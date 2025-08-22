/// <reference types="node" />
// Advanced Alarm Backup and Redundancy Service
// Provides comprehensive backup management, redundancy, and disaster recovery for alarm data

import { Preferences } from '@capacitor/preferences';
import SecurityService from './security';
import SecureAlarmStorageService from './secure-alarm-storage';
import { ErrorHandler } from './error-handler';
import type { Alarm, AlarmEvent } from '../types';

interface BackupMetadata {
  id: string;
  created: Date;
  size: number;
  alarmCount: number;
  userId?: string;
  type: 'manual' | 'scheduled' | 'emergency';
  verified: boolean;
  checksum: string;
  location: BackupLocation;
}

interface BackupData {
  metadata: BackupMetadata;
  alarms: Alarm[];
  events: AlarmEvent[];
  signature: string;
  encrypted: boolean;
  version: string;
}

interface BackupLocation {
  id: string;
  type: 'local' | 'secure_local' | 'cloud_cache' | 'redundant';
  priority: number;
  available: boolean;
  lastSync: Date | null;
}

interface RecoveryPoint {
  id: string;
  timestamp: Date;
  alarmCount: number;
  backupCount: number;
  status: 'healthy' | 'degraded' | 'corrupted';
  recoverable: boolean;
}

export class AlarmBackupRedundancyService {
  private static instance: AlarmBackupRedundancyService;
  private static readonly BACKUP_PREFIX = 'alarm_backup_v2_';
  private static readonly METADATA_KEY = 'backup_metadata_registry';
  private static readonly MAX_LOCAL_BACKUPS = 10;
  private static readonly BACKUP_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
  private static readonly VERIFICATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  private backupTimer: number | null = null;
  private verificationTimer: number | null = null;
  private backupLocations: Map<string, BackupLocation> = new Map();
  private recoveryPoints: RecoveryPoint[] = [];
  private backupInProgress = false;

  private constructor() {
    this.initializeBackupLocations();
    this.startScheduledBackups();
    this.startBackupVerification();
  }

  static getInstance(): AlarmBackupRedundancyService {
    if (!AlarmBackupRedundancyService.instance) {
      AlarmBackupRedundancyService.instance = new AlarmBackupRedundancyService();
    }
    return AlarmBackupRedundancyService.instance;
  }

  /**
   * Initialize backup locations with redundancy
   */
  private initializeBackupLocations(): void {
    this.backupLocations.set('local_primary', {
      id: 'local_primary',
      type: 'local',
      priority: 1,
      available: true,
      lastSync: null,
    });

    this.backupLocations.set('local_secure', {
      id: 'local_secure',
      type: 'secure_local',
      priority: 2,
      available: true,
      lastSync: null,
    });

    this.backupLocations.set('redundant_cache', {
      id: 'redundant_cache',
      type: 'redundant',
      priority: 3,
      available: true,
      lastSync: null,
    });

    console.log('[BackupRedundancy] Initialized backup locations');
  }

  /**
   * Create comprehensive backup with redundancy
   */
  async createBackup(
    type: 'manual' | 'scheduled' | 'emergency' = 'manual',
    userId?: string
  ): Promise<string> {
    if (this.backupInProgress) {
      console.warn('[BackupRedundancy] Backup already in progress, skipping');
      return '';
    }

    this.backupInProgress = true;

    try {
      // Retrieve current data
      const alarms = await SecureAlarmStorageService.retrieveAlarms(userId);
      const events = await SecureAlarmStorageService.retrieveAlarmEvents();

      // Create backup metadata
      const backupId = this.generateBackupId();
      const metadata: BackupMetadata = {
        id: backupId,
        created: new Date(),
        size: this.calculateBackupSize(alarms, events),
        alarmCount: alarms.length,
        userId,
        type,
        verified: false,
        checksum: '',
        location: this.getPrimaryBackupLocation(),
      };

      // Create backup data structure
      const backupData: BackupData = {
        metadata,
        alarms,
        events,
        signature: '',
        encrypted: true,
        version: '2.0.0',
      };

      // Generate checksum and signature
      backupData.metadata.checksum = this.calculateBackupChecksum(backupData);
      backupData.signature = SecurityService.generateDataSignature(backupData);

      // Store backup in multiple locations with redundancy
      const backupResults = await this.storeBackupWithRedundancy(backupId, backupData);

      // Verify backup integrity
      const verified = await this.verifyBackupIntegrity(backupId);
      backupData.metadata.verified = verified;

      // Update metadata registry
      await this.updateBackupMetadata(metadata);

      // Clean up old backups
      await this.cleanupOldBackups();

      // Create recovery point
      await this.createRecoveryPoint(backupId, alarms.length, backupResults.length);

      // Log backup event
      this.logBackupEvent('backup_created', {
        backupId,
        type,
        alarmCount: alarms.length,
        locations: backupResults.length,
        verified,
      });

      console.log(
        `[BackupRedundancy] Created backup ${backupId} with ${backupResults.length} redundant copies`
      );
      return backupId;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to create backup with redundancy',
        { context: 'backup_creation', metadata: { userId, type } }
      );
      throw error;
    } finally {
      this.backupInProgress = false;
    }
  }

  /**
   * Store backup across multiple locations with redundancy
   */
  private async storeBackupWithRedundancy(
    backupId: string,
    backupData: BackupData
  ): Promise<string[]> {
    const storedLocations: string[] = [];
    const encryptedBackup = SecurityService.encryptData(backupData);

    // Attempt to store in all available locations
    for (const [locationId, location] of this.backupLocations) {
      if (!location.available) {
        console.warn(`[BackupRedundancy] Location ${locationId} not available`);
        continue;
      }

      try {
        const backupKey = `${AlarmBackupRedundancyService.BACKUP_PREFIX}${locationId}_${backupId}`;

        await Preferences.set({
          key: backupKey,
          value: encryptedBackup,
        });

        location.lastSync = new Date();
        storedLocations.push(locationId);

        console.log(`[BackupRedundancy] Stored backup in location: ${locationId}`);
      } catch (error) {
        console.error(
          `[BackupRedundancy] Failed to store backup in ${locationId}:`,
          error
        );
        location.available = false; // Mark as unavailable
      }
    }

    if (storedLocations.length === 0) {
      throw new Error('Failed to store backup in any location');
    }

    return storedLocations;
  }

  /**
   * Retrieve backup from the best available location
   */
  async retrieveBackup(backupId: string): Promise<BackupData | null> {
    // Get sorted locations by priority
    const sortedLocations = Array.from(this.backupLocations.entries())
      .filter(([, location]) => location.available)
      .sort(([, a], [, b]) => a.priority - b.priority);

    for (const [locationId, location] of sortedLocations) {
      try {
        const backupKey = `${AlarmBackupRedundancyService.BACKUP_PREFIX}${locationId}_${backupId}`;
        const { value } = await Preferences.get({ key: backupKey });

        if (!value) {
          continue;
        }

        const backupData: BackupData = SecurityService.decryptData(value);

        // Verify backup integrity
        if (!SecurityService.verifyDataSignature(backupData, backupData.signature)) {
          console.error(
            `[BackupRedundancy] Invalid signature in backup ${backupId} from ${locationId}`
          );
          continue;
        }

        // Verify checksum
        const calculatedChecksum = this.calculateBackupChecksum(backupData);
        if (backupData.metadata.checksum !== calculatedChecksum) {
          console.error(
            `[BackupRedundancy] Checksum mismatch in backup ${backupId} from ${locationId}`
          );
          continue;
        }

        console.log(
          `[BackupRedundancy] Successfully retrieved backup ${backupId} from ${locationId}`
        );
        return backupData;
      } catch (error) {
        console.error(
          `[BackupRedundancy] Failed to retrieve backup from ${locationId}:`,
          error
        );
        location.available = false;
        continue;
      }
    }

    console.error(
      `[BackupRedundancy] Failed to retrieve backup ${backupId} from any location`
    );
    return null;
  }

  /**
   * Perform comprehensive disaster recovery
   */
  async performDisasterRecovery(
    userId?: string
  ): Promise<{ success: boolean; recoveredAlarms: Alarm[]; source: string }> {
    console.log('[BackupRedundancy] Starting disaster recovery process...');

    try {
      // Get all available backups
      const availableBackups = await this.getAvailableBackups(userId);

      if (availableBackups.length === 0) {
        console.error('[BackupRedundancy] No backups available for disaster recovery');
        return { success: false, recoveredAlarms: [], source: 'none' };
      }

      // Sort by creation date (most recent first)
      availableBackups.sort((a, b) => b.created.getTime() - a.created.getTime());

      // Try to recover from each backup until successful
      for (const backup of availableBackups) {
        try {
          const backupData = await this.retrieveBackup(backup.id);
          if (!backupData) {
            continue;
          }

          // Validate user ownership
          if (
            userId &&
            backupData.metadata.userId &&
            backupData.metadata.userId !== userId
          ) {
            continue;
          }

          // Restore alarms
          await SecureAlarmStorageService.getInstance().storeAlarms(
            backupData.alarms,
            userId
          );

          // Restore events if available
          if (backupData.events && backupData.events.length > 0) {
            await SecureAlarmStorageService.getInstance().storeAlarmEvents(
              backupData.events
            );
          }

          // Log recovery event
          this.logBackupEvent('disaster_recovery_success', {
            backupId: backup.id,
            alarmCount: backupData.alarms.length,
            userId,
            source: backup.location.type,
          });

          console.log(
            `[BackupRedundancy] Disaster recovery successful from backup ${backup.id}`
          );
          return {
            success: true,
            recoveredAlarms: backupData.alarms,
            source: `${backup.location.type} (${backup.id})`,
          };
        } catch (error) {
          console.error(
            `[BackupRedundancy] Failed to recover from backup ${backup.id}:`,
            error
          );
          continue;
        }
      }

      console.error('[BackupRedundancy] All disaster recovery attempts failed');
      return { success: false, recoveredAlarms: [], source: 'failed' };
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Disaster recovery failed',
        { context: 'disaster_recovery', metadata: { userId } }
      );
      return { success: false, recoveredAlarms: [], source: 'error' };
    }
  }

  /**
   * Start scheduled automatic backups
   */
  private startScheduledBackups(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.backupTimer = setInterval(async () => {
      try {
        await this.createBackup('scheduled');
      } catch (error) {
        console.error('[BackupRedundancy] Scheduled backup failed:', error);
      }
    }, AlarmBackupRedundancyService.BACKUP_INTERVAL);

    console.log('[BackupRedundancy] Started scheduled backups');
  }

  /**
   * Start periodic backup verification
   */
  private startBackupVerification(): void {
    if (this.verificationTimer) {
      clearInterval(this.verificationTimer);
    }

    this.verificationTimer = setInterval(async () => {
      try {
        await this.verifyAllBackups();
      } catch (error) {
        console.error('[BackupRedundancy] Backup verification failed:', error);
      }
    }, AlarmBackupRedundancyService.VERIFICATION_INTERVAL);

    console.log('[BackupRedundancy] Started backup verification');
  }

  /**
   * Verify integrity of a specific backup
   */
  async verifyBackupIntegrity(backupId: string): Promise<boolean> {
    try {
      const backupData = await this.retrieveBackup(backupId);
      if (!backupData) {
        return false;
      }

      // Verify signature
      if (!SecurityService.verifyDataSignature(backupData, backupData.signature)) {
        return false;
      }

      // Verify checksum
      const calculatedChecksum = this.calculateBackupChecksum(backupData);
      if (backupData.metadata.checksum !== calculatedChecksum) {
        return false;
      }

      // Verify alarm data structure
      if (!Array.isArray(backupData.alarms)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error(`[BackupRedundancy] Failed to verify backup ${backupId}:`, error);
      return false;
    }
  }

  /**
   * Verify all existing backups
   */
  private async verifyAllBackups(): Promise<void> {
    console.log('[BackupRedundancy] Starting backup verification...');

    try {
      const backups = await this.getAvailableBackups();
      const results = {
        total: backups.length,
        verified: 0,
        corrupted: 0,
        inaccessible: 0,
      };

      for (const backup of backups) {
        const isValid = await this.verifyBackupIntegrity(backup.id);

        if (isValid) {
          results.verified++;
        } else {
          results.corrupted++;
          console.warn(`[BackupRedundancy] Corrupted backup detected: ${backup.id}`);

          // Emit event for UI notification
          window.dispatchEvent(
            new CustomEvent('backup-corruption-detected', {
              detail: { backupId: backup.id, metadata: backup },
            })
          );
        }
      }

      // Log verification results
      this.logBackupEvent('backup_verification_completed', results);

      console.log(
        `[BackupRedundancy] Verification completed: ${results.verified}/${results.total} valid`
      );
    } catch (error) {
      console.error('[BackupRedundancy] Backup verification error:', error);
    }
  }

  /**
   * Get list of available backups
   */
  async getAvailableBackups(userId?: string): Promise<BackupMetadata[]> {
    try {
      const { value } = await Preferences.get({
        key: AlarmBackupRedundancyService.METADATA_KEY,
      });

      if (!value) {
        return [];
      }

      const metadataRegistry: BackupMetadata[] = JSON.parse(value);

      return metadataRegistry
        .filter(backup => !userId || !backup.userId || backup.userId === userId)
        .map(backup => ({
          ...backup,
          created: new Date(backup.created),
        }));
    } catch (error) {
      console.error('[BackupRedundancy] Failed to get available backups:', error);
      return [];
    }
  }

  /**
   * Create recovery point snapshot
   */
  private async createRecoveryPoint(
    backupId: string,
    alarmCount: number,
    backupCount: number
  ): Promise<void> {
    const recoveryPoint: RecoveryPoint = {
      id: backupId,
      timestamp: new Date(),
      alarmCount,
      backupCount,
      status: 'healthy',
      recoverable: true,
    };

    this.recoveryPoints.unshift(recoveryPoint);

    // Keep only recent recovery points
    if (this.recoveryPoints.length > 50) {
      this.recoveryPoints = this.recoveryPoints.slice(0, 50);
    }
  }

  /**
   * Get system recovery status
   */
  async getRecoveryStatus(): Promise<{
    totalBackups: number;
    verifiedBackups: number;
    lastBackup: Date | null;
    recoveryPoints: number;
    redundancyLevel: 'none' | 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    try {
      const backups = await this.getAvailableBackups();
      const verifiedBackups = backups.filter(b => b.verified).length;
      const lastBackup =
        backups.length > 0
          ? backups.reduce(
              (latest, backup) => (backup.created > latest ? backup.created : latest),
              backups[0].created
            )
          : null;

      // Calculate redundancy level
      let redundancyLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
      const activeLocations = Array.from(this.backupLocations.values()).filter(
        l => l.available
      ).length;

      if (activeLocations >= 3 && verifiedBackups >= 5) {
        redundancyLevel = 'high';
      } else if (activeLocations >= 2 && verifiedBackups >= 3) {
        redundancyLevel = 'medium';
      } else if (activeLocations >= 1 && verifiedBackups >= 1) {
        redundancyLevel = 'low';
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (backups.length < 3) {
        recommendations.push('Create more backup copies for better redundancy');
      }
      if (verifiedBackups < backups.length) {
        recommendations.push('Some backups failed verification - check data integrity');
      }
      if (
        !lastBackup ||
        new Date().getTime() - lastBackup.getTime() > 24 * 60 * 60 * 1000
      ) {
        recommendations.push(
          'Recent backup not found - consider creating a new backup'
        );
      }

      return {
        totalBackups: backups.length,
        verifiedBackups,
        lastBackup,
        recoveryPoints: this.recoveryPoints.length,
        redundancyLevel,
        recommendations,
      };
    } catch (error) {
      console.error('[BackupRedundancy] Failed to get recovery status:', error);
      return {
        totalBackups: 0,
        verifiedBackups: 0,
        lastBackup: null,
        recoveryPoints: 0,
        redundancyLevel: 'none',
        recommendations: ['Unable to assess backup status due to error'],
      };
    }
  }

  /**
   * Update backup metadata registry
   */
  private async updateBackupMetadata(metadata: BackupMetadata): Promise<void> {
    try {
      const existing = await this.getAvailableBackups();
      existing.unshift(metadata);

      // Keep only recent backups in metadata
      const recentMetadata = existing.slice(
        0,
        AlarmBackupRedundancyService.MAX_LOCAL_BACKUPS
      );

      await Preferences.set({
        key: AlarmBackupRedundancyService.METADATA_KEY,
        value: JSON.stringify(recentMetadata),
      });
    } catch (error) {
      console.error('[BackupRedundancy] Failed to update backup metadata:', error);
    }
  }

  /**
   * Clean up old backup files
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const { keys } = await Preferences.keys();
      const backupKeys = keys
        .filter(key => key.startsWith(AlarmBackupRedundancyService.BACKUP_PREFIX))
        .sort()
        .reverse();

      if (backupKeys.length <= AlarmBackupRedundancyService.MAX_LOCAL_BACKUPS) {
        return;
      }

      const keysToRemove = backupKeys.slice(
        AlarmBackupRedundancyService.MAX_LOCAL_BACKUPS
      );
      for (const key of keysToRemove) {
        await Preferences.remove({ key });
      }

      console.log(
        `[BackupRedundancy] Cleaned up ${keysToRemove.length} old backup files`
      );
    } catch (error) {
      console.error('[BackupRedundancy] Failed to cleanup old backups:', error);
    }
  }

  /**
   * Generate unique backup ID
   */
  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate backup checksum
   */
  private calculateBackupChecksum(backupData: Omit<BackupData, 'signature'>): string {
    const checksumData = {
      alarms: backupData.alarms,
      events: backupData.events,
      version: backupData.version,
      metadata: {
        ...backupData.metadata,
        checksum: '', // Exclude checksum from checksum calculation
      },
    };

    const dataString = JSON.stringify(checksumData, Object.keys(checksumData).sort());
    return SecurityService.hashData(dataString);
  }

  /**
   * Calculate backup size estimate
   */
  private calculateBackupSize(alarms: Alarm[], events: AlarmEvent[]): number {
    return JSON.stringify({ alarms, events }).length;
  }

  /**
   * Get primary backup location
   */
  private getPrimaryBackupLocation(): BackupLocation {
    return (
      this.backupLocations.get('local_primary') ||
      this.backupLocations.values().next().value
    );
  }

  /**
   * Log backup events for monitoring
   */
  private logBackupEvent(event: string, details: any): void {
    const logEntry = {
      event,
      details,
      timestamp: new Date().toISOString(),
      source: 'AlarmBackupRedundancyService',
    };

    console.log('[BACKUP LOG]', logEntry);

    // Emit custom event for monitoring
    window.dispatchEvent(
      new CustomEvent('backup-event', {
        detail: logEntry,
      })
    );
  }

  /**
   * Force emergency backup
   */
  async createEmergencyBackup(userId?: string): Promise<string> {
    console.log('[BackupRedundancy] Creating emergency backup...');
    return await this.createBackup('emergency', userId);
  }

  /**
   * Test backup system integrity
   */
  async testBackupSystem(): Promise<{
    locationsAvailable: number;
    locationsTotal: number;
    canCreateBackup: boolean;
    canRecoverData: boolean;
    testResults: any;
  }> {
    const testResults: any = {};

    try {
      // Test backup creation
      const testBackupId = await this.createBackup('manual', 'test_user');
      testResults.backupCreation = testBackupId ? 'success' : 'failed';

      // Test backup retrieval
      if (testBackupId) {
        const retrievedBackup = await this.retrieveBackup(testBackupId);
        testResults.backupRetrieval = retrievedBackup ? 'success' : 'failed';
      }

      // Test location availability
      const availableLocations = Array.from(this.backupLocations.values()).filter(
        l => l.available
      );
      testResults.locationAvailability = {
        available: availableLocations.length,
        total: this.backupLocations.size,
      };

      return {
        locationsAvailable: availableLocations.length,
        locationsTotal: this.backupLocations.size,
        canCreateBackup: testResults.backupCreation === 'success',
        canRecoverData: testResults.backupRetrieval === 'success',
        testResults,
      };
    } catch (error) {
      console.error('[BackupRedundancy] Backup system test failed:', error);
      return {
        locationsAvailable: 0,
        locationsTotal: this.backupLocations.size,
        canCreateBackup: false,
        canRecoverData: false,
        testResults: { error: error.message },
      };
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
    if (this.verificationTimer) {
      clearInterval(this.verificationTimer);
      this.verificationTimer = null;
    }
    console.log('[BackupRedundancy] Service destroyed');
  }
}

export default AlarmBackupRedundancyService.getInstance();
