/// <reference types="node" />
// Secure Alarm Storage Service
// Provides encrypted storage and integrity validation for alarm data

import { Preferences } from '@capacitor/preferences';
import SecurityService from './security';
import type { Alarm, AlarmEvent } from '../types';
import { ErrorHandler } from './error-handler';
import { TimeoutHandle } from '../types/timers';

interface SecureAlarmData {
  alarms: Alarm[];
  checksum: string;
  timestamp: string;
  version: string;
  userId?: string;
}

interface AlarmBackupData {
  data: SecureAlarmData;
  signature: string;
  created: string;
  backupId: string;
}

export class SecureAlarmStorageService {
  private static instance: SecureAlarmStorageService;
  private static readonly ALARMS_KEY = 'secure_alarms';
  private static readonly ALARM_EVENTS_KEY = 'secure_alarm_events';
  private static readonly BACKUP_KEY_PREFIX = 'alarm_backup_';
  private static readonly VERSION = '2.0.0';
  private static readonly MAX_BACKUPS = 5;
  private static readonly INTEGRITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private integrityCheckTimer: TimeoutHandle | null = null;
  private lastIntegrityCheck: Date | null = null;
  private tamperedDetectionCallbacks: Array<(details: any) => void> = [];

  private constructor() {
    this.startIntegrityMonitoring();
  }

  static getInstance(): SecureAlarmStorageService {
    if (!SecureAlarmStorageService.instance) {
      SecureAlarmStorageService.instance = new SecureAlarmStorageService();
    }
    return SecureAlarmStorageService.instance;
  }

  /**
   * Securely store alarms with encryption and integrity validation
   */
  async storeAlarms(alarms: Alarm[], userId?: string): Promise<void> {
    try {
      // Validate input data
      if (!Array.isArray(alarms)) {
        throw new Error('Invalid alarm data: must be an array');
      }

      // Sanitize alarm data to prevent injection attacks
      const sanitizedAlarms = alarms.map(alarm => this.sanitizeAlarmData(alarm));

      // Create secure alarm data structure
      const secureData: SecureAlarmData = {
        alarms: sanitizedAlarms,
        checksum: this.calculateChecksum(sanitizedAlarms),
        timestamp: new Date().toISOString(),
        version: SecureAlarmStorageService.VERSION,
        userId,
      };

      // Generate data signature for integrity validation
      const signature = SecurityService.generateDataSignature(secureData);

      // Create final payload with signature
      const payload = {
        data: secureData,
        signature,
        integrity: this.generateIntegrityToken(secureData),
      };

      // Encrypt the entire payload
      const encryptedPayload = SecurityService.encryptData(payload);

      // Store encrypted data
      await Preferences.set({
        key: SecureAlarmStorageService.ALARMS_KEY,
        value: encryptedPayload,
      });

      // Create backup
      await this.createBackup(secureData, signature);

      // Log security event
      this.logSecurityEvent('alarms_stored', {
        userId,
        alarmCount: alarms.length,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `[SecureAlarmStorage] Successfully stored ${alarms.length} alarms with encryption`
      );
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to store alarms securely',
        {
          context: 'secure_alarm_storage',
          metadata: { userId, alarmCount: alarms.length },
        }
      );
      throw new Error('Failed to store alarm data securely');
    }
  }

  /**
   * Securely retrieve and decrypt alarms with integrity validation
   */
  async retrieveAlarms(userId?: string): Promise<Alarm[]> {
    try {
      // Retrieve encrypted data
      const { value } = await Preferences.get({
        key: SecureAlarmStorageService.ALARMS_KEY,
      });

      if (!value) {
        console.log('[SecureAlarmStorage] No stored alarms found');
        return [];
      }

      // Decrypt the payload
      let decryptedPayload: any;
      try {
        decryptedPayload = SecurityService.decryptData(value);
      } catch (decryptError) {
        console.error(
          '[SecureAlarmStorage] Failed to decrypt alarm data:',
          decryptError
        );

        // Attempt recovery from backup
        const backupData = await this.recoverFromBackup(userId);
        if (backupData) {
          console.log('[SecureAlarmStorage] Successfully recovered from backup');
          return backupData;
        }

        throw new Error('Failed to decrypt alarm data and no valid backup found');
      }

      const { data, signature, integrity } = decryptedPayload;

      // Validate data signature
      if (!SecurityService.verifyDataSignature(data, signature)) {
        console.error('[SecureAlarmStorage] Data signature validation failed');
        this.handleTamperDetection('signature_validation_failed', { userId });

        // Try to recover from backup
        const backupData = await this.recoverFromBackup(userId);
        if (backupData) {
          return backupData;
        }

        throw new Error('Alarm data integrity validation failed');
      }

      // Validate integrity token
      if (!this.validateIntegrityToken(data, integrity)) {
        console.error('[SecureAlarmStorage] Integrity token validation failed');
        this.handleTamperDetection('integrity_token_failed', { userId });
      }

      // Validate checksum
      const calculatedChecksum = this.calculateChecksum(data.alarms);
      if (data.checksum !== calculatedChecksum) {
        console.error('[SecureAlarmStorage] Checksum validation failed');
        this.handleTamperDetection('checksum_mismatch', {
          userId,
          stored: data.checksum,
          calculated: calculatedChecksum,
        });

        // Try to recover from backup
        const backupData = await this.recoverFromBackup(userId);
        if (backupData) {
          return backupData;
        }

        throw new Error('Alarm data checksum validation failed');
      }

      // Validate user ownership
      if (userId && data.userId && data.userId !== userId) {
        console.error('[SecureAlarmStorage] User ID mismatch in stored data');
        throw new Error('Access denied: alarm data belongs to different user');
      }

      // Validate alarm data structure
      const validAlarms = this.validateAndSanitizeAlarms(data.alarms);

      // Update last integrity check
      this.lastIntegrityCheck = new Date();

      // Log security event
      this.logSecurityEvent('alarms_retrieved', {
        userId,
        alarmCount: validAlarms.length,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `[SecureAlarmStorage] Successfully retrieved ${validAlarms.length} alarms`
      );
      return validAlarms;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to retrieve alarms securely',
        { context: 'secure_alarm_retrieval', metadata: { userId } }
      );

      // Return empty array as fallback to prevent app crash
      return [];
    }
  }

  /**
   * Securely store alarm events with encryption
   */
  async storeAlarmEvents(events: AlarmEvent[]): Promise<void> {
    try {
      if (!Array.isArray(events)) {
        throw new Error('Invalid event data: must be an array');
      }

      const secureEventData = {
        events,
        checksum: this.calculateChecksum(events),
        timestamp: new Date().toISOString(),
        version: SecureAlarmStorageService.VERSION,
      };

      const signature = SecurityService.generateDataSignature(secureEventData);
      const payload = { data: secureEventData, signature };
      const encryptedPayload = SecurityService.encryptData(payload);

      await Preferences.set({
        key: SecureAlarmStorageService.ALARM_EVENTS_KEY,
        value: encryptedPayload,
      });

      console.log(`[SecureAlarmStorage] Stored ${events.length} alarm events securely`);
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to store alarm events securely',
        { context: 'secure_event_storage' }
      );
      throw error;
    }
  }

  /**
   * Securely retrieve alarm events
   */
  async retrieveAlarmEvents(): Promise<AlarmEvent[]> {
    try {
      const { value } = await Preferences.get({
        key: SecureAlarmStorageService.ALARM_EVENTS_KEY,
      });

      if (!value) {
        return [];
      }

      const decryptedPayload = SecurityService.decryptData(value);
      const { data, signature } = decryptedPayload;

      if (!SecurityService.verifyDataSignature(data, signature)) {
        console.error('[SecureAlarmStorage] Event data signature validation failed');
        return [];
      }

      const calculatedChecksum = this.calculateChecksum(data.events);
      if (data.checksum !== calculatedChecksum) {
        console.error('[SecureAlarmStorage] Event checksum validation failed');
        return [];
      }

      return data.events || [];
    } catch (error) {
      console.error('[SecureAlarmStorage] Failed to retrieve alarm events:', error);
      return [];
    }
  }

  /**
   * Create encrypted backup of alarm data
   */
  private async createBackup(data: SecureAlarmData, signature: string): Promise<void> {
    try {
      const backupData: AlarmBackupData = {
        data,
        signature,
        created: new Date().toISOString(),
        backupId: SecurityService.generateCSRFToken(), // Use as unique backup ID
      };

      const encryptedBackup = SecurityService.encryptData(backupData);
      const backupKey = `${SecureAlarmStorageService.BACKUP_KEY_PREFIX}${Date.now()}`;

      await Preferences.set({
        key: backupKey,
        value: encryptedBackup,
      });

      // Clean up old backups
      await this.cleanupOldBackups();

      console.log(`[SecureAlarmStorage] Created backup with key: ${backupKey}`);
    } catch (error) {
      console.error('[SecureAlarmStorage] Failed to create backup:', error);
      // Don't throw - backup failure shouldn't prevent primary storage
    }
  }

  /**
   * Recover alarm data from the most recent valid backup
   */
  private async recoverFromBackup(userId?: string): Promise<Alarm[] | null> {
    try {
      console.log('[SecureAlarmStorage] Attempting to recover from backup...');

      // Get all keys to find backup keys
      const { keys } = await Preferences.keys();
      const backupKeys = keys
        .filter((key: any) => k // auto: implicit anyey.startsWith(SecureAlarmStorageService.BACKUP_KEY_PREFIX))
        .sort()
        .reverse(); // Most recent first

      for (const backupKey of backupKeys) {
        try {
          const { value } = await Preferences.get({ key: backupKey });
          if (!value) continue;

          const backupData: AlarmBackupData = SecurityService.decryptData(value);

          // Validate backup signature
          if (
            !SecurityService.verifyDataSignature(backupData.data, backupData.signature)
          ) {
            console.warn(
              `[SecureAlarmStorage] Invalid signature in backup: ${backupKey}`
            );
            continue;
          }

          // Validate checksum
          const calculatedChecksum = this.calculateChecksum(backupData.data.alarms);
          if (backupData.data.checksum !== calculatedChecksum) {
            console.warn(
              `[SecureAlarmStorage] Invalid checksum in backup: ${backupKey}`
            );
            continue;
          }

          // Validate user ownership if specified
          if (userId && backupData.data.userId && backupData.data.userId !== userId) {
            console.warn(`[SecureAlarmStorage] User mismatch in backup: ${backupKey}`);
            continue;
          }

          // Valid backup found - restore it
          await this.storeAlarms(backupData.data.alarms, userId);

          console.log(
            `[SecureAlarmStorage] Successfully recovered from backup: ${backupKey}`
          );
          return this.validateAndSanitizeAlarms(backupData.data.alarms);
        } catch (backupError) {
          console.warn(
            `[SecureAlarmStorage] Failed to process backup ${backupKey}:`,
            backupError
          );
          continue;
        }
      }

      console.error('[SecureAlarmStorage] No valid backups found for recovery');
      return null;
    } catch (error) {
      console.error('[SecureAlarmStorage] Backup recovery failed:', error);
      return null;
    }
  }

  /**
   * Clean up old backup files, keeping only the most recent ones
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const { keys } = await Preferences.keys();
      const backupKeys = keys
        .filter((key: any) => k // auto: implicit anyey.startsWith(SecureAlarmStorageService.BACKUP_KEY_PREFIX))
        .sort()
        .reverse(); // Most recent first

      if (backupKeys.length <= SecureAlarmStorageService.MAX_BACKUPS) {
        return;
      }

      // Remove oldest backups
      const keysToRemove = backupKeys.slice(SecureAlarmStorageService.MAX_BACKUPS);
      for (const key of keysToRemove) {
        await Preferences.remove({ key });
      }

      console.log(`[SecureAlarmStorage] Cleaned up ${keysToRemove.length} old backups`);
    } catch (error) {
      console.error('[SecureAlarmStorage] Failed to cleanup old backups:', error);
    }
  }

  /**
   * Start periodic integrity monitoring
   */
  private startIntegrityMonitoring(): void {
    if (this.integrityCheckTimer) {
      clearInterval(this.integrityCheckTimer);
    }

    this.integrityCheckTimer = setInterval(async () => {
      try {
        await this.performIntegrityCheck();
      } catch (error) {
        console.error('[SecureAlarmStorage] Integrity check failed:', error);
      }
    }, SecureAlarmStorageService.INTEGRITY_CHECK_INTERVAL);

    console.log('[SecureAlarmStorage] Started integrity monitoring');
  }

  /**
   * Perform comprehensive integrity check on stored data
   */
  private async performIntegrityCheck(): Promise<void> {
    try {
      const { value } = await Preferences.get({
        key: SecureAlarmStorageService.ALARMS_KEY,
      });

      if (!value) {
        return; // No data to check
      }

      // Attempt to decrypt and validate without throwing errors
      try {
        const decryptedPayload = SecurityService.decryptData(value);
        const { data, signature } = decryptedPayload;

        if (!SecurityService.verifyDataSignature(data, signature)) {
          this.handleTamperDetection('integrity_check_signature_failed', {});
          return;
        }

        const calculatedChecksum = this.calculateChecksum(data.alarms);
        if (data.checksum !== calculatedChecksum) {
          this.handleTamperDetection('integrity_check_checksum_failed', {
            stored: data.checksum,
            calculated: calculatedChecksum,
          });
          return;
        }

        this.lastIntegrityCheck = new Date();
        console.log('[SecureAlarmStorage] Integrity check passed');
      } catch (decryptError) {
        this.handleTamperDetection('integrity_check_decrypt_failed', {
          error: decryptError.message,
        });
      }
    } catch (error) {
      console.error('[SecureAlarmStorage] Integrity check error:', error);
    }
  }

  /**
   * Handle tamper detection events
   */
  private handleTamperDetection(type: string, details: any): void {
    const tamperEvent = {
      type,
      details,
      timestamp: new Date().toISOString(),
      severity: 'high',
    };

    // Log security event
    this.logSecurityEvent('tamper_detected', tamperEvent);

    // Notify registered callbacks
    this.tamperedDetectionCallbacks.forEach(callback => {
      try {
        callback(tamperEvent);
      } catch (error) {
        console.error('[SecureAlarmStorage] Tamper detection callback error:', error);
      }
    });

    // Emit custom event for UI components
    window.dispatchEvent(
      new CustomEvent('alarm-tamper-detected', {
        detail: tamperEvent,
      })
    );

    console.error('[SecureAlarmStorage] TAMPER DETECTED:', tamperEvent);
  }

  /**
   * Register callback for tamper detection events
   */
  onTamperDetected(callback: (details: any) => void): void {
    this.tamperedDetectionCallbacks.push(callback);
  }

  /**
   * Calculate checksum for data integrity validation
   */
  private calculateChecksum(data: any): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return SecurityService.hashData(dataString);
  }

  /**
   * Generate integrity token for additional validation
   */
  private generateIntegrityToken(data: SecureAlarmData): string {
    const tokenData = {
      checksum: data.checksum,
      timestamp: data.timestamp,
      version: data.version,
      alarmCount: data.alarms.length,
    };
    return SecurityService.hashData(JSON.stringify(tokenData));
  }

  /**
   * Validate integrity token
   */
  private validateIntegrityToken(data: SecureAlarmData, token: string): boolean {
    try {
      const expectedToken = this.generateIntegrityToken(data);
      return expectedToken === token;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize alarm data to prevent injection attacks
   */
  private sanitizeAlarmData(alarm: Alarm): Alarm {
    return {
      ...alarm,
      label: SecurityService.sanitizeInput(alarm.label, { maxLength: 100 }),
      // Keep other fields as-is but ensure they're the right type
      time: String(alarm.time),
      enabled: Boolean(alarm.enabled),
      isActive: Boolean(alarm.isActive),
      days: Array.isArray(alarm.days)
        ? alarm.days.filter(d => typeof d === 'number')
        : [],
      voiceMood: alarm.voiceMood,
      sound: alarm.sound
        ? SecurityService.sanitizeInput(String(alarm.sound))
        : 'default',
      snoozeEnabled: Boolean(alarm.snoozeEnabled),
      snoozeInterval:
        typeof alarm.snoozeInterval === 'number' ? alarm.snoozeInterval : 5,
      snoozeCount: typeof alarm.snoozeCount === 'number' ? alarm.snoozeCount : 0,
    };
  }

  /**
   * Validate and sanitize retrieved alarm data
   */
  private validateAndSanitizeAlarms(alarms: any[]): Alarm[] {
    if (!Array.isArray(alarms)) {
      return [];
    }

    return alarms
      .filter(alarm => alarm && typeof alarm === 'object')
      .map(alarm => this.sanitizeAlarmData(alarm))
      .filter(alarm => {
        // Basic validation
        return (
          alarm.id &&
          alarm.time &&
          alarm.label &&
          Array.isArray(alarm.days) &&
          alarm.voiceMood
        );
      });
  }

  /**
   * Log security events for audit trail
   */
  private logSecurityEvent(event: string, details: any): void {
    const logEntry = {
      event,
      details,
      timestamp: new Date().toISOString(),
      source: 'SecureAlarmStorageService',
    };

    // Store in a separate security log (you might want to send this to a server)
    console.log('[SECURITY LOG]', logEntry);

    // Emit custom event for security monitoring
    window.dispatchEvent(
      new CustomEvent('security-event', {
        detail: logEntry,
      })
    );
  }

  /**
   * Clear all stored alarm data (for security purposes)
   */
  async clearAllData(): Promise<void> {
    try {
      // Remove main data
      await Preferences.remove({ key: SecureAlarmStorageService.ALARMS_KEY });
      await Preferences.remove({ key: SecureAlarmStorageService.ALARM_EVENTS_KEY });

      // Remove all backups
      const { keys } = await Preferences.keys();
      const backupKeys = keys.filter((key: any) => /* auto: implicit any */
        key.startsWith(SecureAlarmStorageService.BACKUP_KEY_PREFIX)
      );

      for (const key of backupKeys) {
        await Preferences.remove({ key });
      }

      this.logSecurityEvent('all_data_cleared', {
        timestamp: new Date().toISOString(),
      });

      console.log('[SecureAlarmStorage] All alarm data cleared');
    } catch (error) {
      console.error('[SecureAlarmStorage] Failed to clear all data:', error);
      throw error;
    }
  }

  /**
   * Get storage status and statistics
   */
  async getStorageStatus(): Promise<any> {
    try {
      const { keys } = await Preferences.keys();
      const alarmDataExists = keys.includes(SecureAlarmStorageService.ALARMS_KEY);
      const eventDataExists = keys.includes(SecureAlarmStorageService.ALARM_EVENTS_KEY);
      const backupCount = keys.filter((key: any) => /* auto: implicit any */
        key.startsWith(SecureAlarmStorageService.BACKUP_KEY_PREFIX)
      ).length;

      return {
        hasAlarmData: alarmDataExists,
        hasEventData: eventDataExists,
        backupCount,
        lastIntegrityCheck: this.lastIntegrityCheck,
        version: SecureAlarmStorageService.VERSION,
        integrityMonitoringActive: !!this.integrityCheckTimer,
      };
    } catch (error) {
      console.error('[SecureAlarmStorage] Failed to get storage status:', error);
      return {
        hasAlarmData: false,
        hasEventData: false,
        backupCount: 0,
        lastIntegrityCheck: null,
        version: SecureAlarmStorageService.VERSION,
        integrityMonitoringActive: false,
        error: error.message,
      };
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.integrityCheckTimer) {
      clearInterval(this.integrityCheckTimer);
      this.integrityCheckTimer = null;
    }
    this.tamperedDetectionCallbacks = [];
    console.log('[SecureAlarmStorage] Service destroyed');
  }
}

export default SecureAlarmStorageService.getInstance();
