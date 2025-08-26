/**
 * Storage Migration Service
 * Handles migration from localStorage-based storage to IndexedDB
 */

import IndexedDBStorage from './indexeddb-storage';
import OfflineStorage from './offline-storage';
import SecurityService from './security';
import { ErrorHandler } from './error-handler';
import type { _Alarm, _User } from '../types/domain';
import type { StorageMetadata, PendingChange } from '../types/indexeddb-schema';

interface MigrationResult {
  success: boolean;
  startTime: string;
  endTime: string;
  duration: number;
  migratedData: {
    alarms: number;
    pendingChanges: number;
    metadata: number;
  };
  errors: string[];
  warnings: string[];
  backupCreated: string | null;
}

interface MigrationStatus {
  isRequired: boolean;
  hasLegacyData: boolean;
  hasModernData: boolean;
  canMigrate: boolean;
  reasons: string[];
}

export class StorageMigrationService {
  private static instance: StorageMigrationService;
  private readonly MIGRATION_VERSION = '1.0.0';
  private readonly MIGRATION_KEY = 'storage-migration-status';
  private readonly LEGACY_KEYS = [
    'smart-alarm-alarms',
    'smart-alarm-metadata',
    'smart-alarm-pending',
    'relife-conflicts',
    'relife-backup',
  ];

  private constructor() {}

  static getInstance(): StorageMigrationService {
    if (!StorageMigrationService.instance) {
      StorageMigrationService.instance = new StorageMigrationService();
    }
    return StorageMigrationService.instance;
  }

  // =============================================================================
  // MIGRATION STATUS CHECKING
  // =============================================================================

  async checkMigrationStatus(): Promise<MigrationStatus> {
    try {
      console.log('[StorageMigration] Checking migration status...');

      const result: MigrationStatus = {
        isRequired: false,
        hasLegacyData: false,
        hasModernData: false,
        canMigrate: true,
        reasons: [],
      };

      // Check if migration has already been completed
      const migrationStatus = this.getMigrationRecord();
      if (migrationStatus?.completed) {
        result.reasons.push('Migration already completed');
        return result;
      }

      // Check for legacy data
      result.hasLegacyData = await this.hasLegacyData();
      if (result.hasLegacyData) {
        result.reasons.push('Legacy localStorage data found');
      }

      // Check for modern data
      result.hasModernData = await this.hasModernData();
      if (result.hasModernData) {
        result.reasons.push('Modern IndexedDB data found');
      }

      // Determine if migration is required
      result.isRequired = result.hasLegacyData && !migrationStatus?.completed;

      // Check if we can safely migrate
      if (result.hasLegacyData && result.hasModernData) {
        result.canMigrate = false;
        result.reasons.push(
          'Both legacy and modern data exist - manual intervention required'
        );
      }

      // Check browser support
      if (!this.isBrowserSupported()) {
        result.canMigrate = false;
        result.reasons.push('Browser does not support IndexedDB');
      }

      console.log('[StorageMigration] Migration status:', result);
      return result;
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to check migration status', {
        context: 'StorageMigrationService.checkMigrationStatus',
      });
      return {
        isRequired: false,
        hasLegacyData: false,
        hasModernData: false,
        canMigrate: false,
        reasons: ['Error checking migration status'],
      };
    }
  }

  private async hasLegacyData(): Promise<boolean> {
    // Check both encrypted and unencrypted versions
    for (const key of this.LEGACY_KEYS) {
      // Check unencrypted localStorage
      if (localStorage.getItem(key)) {
        return true;
      }
      // Check encrypted storage
      if (SecurityService.secureStorageGet(key)) {
        return true;
      }
    }
    return false;
  }

  private async hasModernData(): Promise<boolean> {
    try {
      const indexedDBStorage = IndexedDBStorage.getInstance();
      await indexedDBStorage.initialize();
      const alarmCount = await indexedDBStorage.count('alarms');
      return alarmCount > 0;
    } catch (error) {
      console.warn('[StorageMigration] Could not check IndexedDB data:', error);
      return false;
    }
  }

  private isBrowserSupported(): boolean {
    return 'indexedDB' in window;
  }

  // =============================================================================
  // MIGRATION EXECUTION
  // =============================================================================

  async performMigration(
    options: {
      createBackup?: boolean;
      clearLegacyData?: boolean;
      dryRun?: boolean;
    } = {}
  ): Promise<MigrationResult> {
    const startTime = new Date().toISOString();
    const result: MigrationResult = {
      success: false,
      startTime,
      endTime: '',
      duration: 0,
      migratedData: {
        alarms: 0,
        pendingChanges: 0,
        metadata: 0,
      },
      errors: [],
      warnings: [],
      backupCreated: null,
    };

    try {
      console.log('[StorageMigration] Starting migration...', options);

      const { createBackup = true, clearLegacyData = true, dryRun = false } = options;

      // Check if migration is safe to proceed
      const status = await this.checkMigrationStatus();
      if (!status.canMigrate) {
        throw new Error(`Cannot migrate: ${status.reasons.join(', ')}`);
      }

      if (!status.isRequired) {
        result.warnings.push('Migration not required');
        result.success = true;
        return result;
      }

      // Create backup if requested
      if (createBackup && !dryRun) {
        try {
          const backupData = await this.createLegacyBackup();
          result.backupCreated = await this.storeLegacyBackup(backupData);
          console.log(
            '[StorageMigration] Legacy data backup created:',
            result.backupCreated
          );
        } catch (backupError) {
          result.warnings.push(
            `Backup failed: ${backupError instanceof Error ? backupError.message : 'Unknown error'}`
          );
        }
      }

      // Initialize modern storage
      const indexedDBStorage = IndexedDBStorage.getInstance();
      await indexedDBStorage.initialize();

      // Migrate alarms
      try {
        result.migratedData.alarms = await this.migrateAlarms(indexedDBStorage, dryRun);
      } catch (alarmError) {
        result.errors.push(
          `Alarm migration failed: ${alarmError instanceof Error ? alarmError.message : 'Unknown error'}`
        );
      }

      // Migrate pending changes
      try {
        result.migratedData.pendingChanges = await this.migratePendingChanges(
          indexedDBStorage,
          dryRun
        );
      } catch (changesError) {
        result.errors.push(
          `Pending changes migration failed: ${changesError instanceof Error ? changesError.message : 'Unknown error'}`
        );
      }

      // Migrate metadata
      try {
        result.migratedData.metadata = await this.migrateMetadata(
          indexedDBStorage,
          dryRun
        );
      } catch (metadataError) {
        result.errors.push(
          `Metadata migration failed: ${metadataError instanceof Error ? metadataError.message : 'Unknown error'}`
        );
      }

      // Clear legacy data if migration was successful and requested
      if (clearLegacyData && !dryRun && result.errors.length === 0) {
        try {
          await this.clearLegacyData();
          console.log('[StorageMigration] Legacy data cleared');
        } catch (clearError) {
          result.warnings.push(
            `Failed to clear legacy data: ${clearError instanceof Error ? clearError.message : 'Unknown error'}`
          );
        }
      }

      // Mark migration as completed
      if (!dryRun && result.errors.length === 0) {
        this.markMigrationCompleted();
      }

      result.success = result.errors.length === 0;

      result.endTime = new Date().toISOString();
      result.duration =
        new Date(result.endTime).getTime() - new Date(result.startTime).getTime();

      console.log('[StorageMigration] Migration completed:', result);
      return result;
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : 'Unknown migration error'
      );
      result.endTime = new Date().toISOString();
      result.duration =
        new Date(result.endTime).getTime() - new Date(result.startTime).getTime();

      ErrorHandler.handleError(error, 'Migration failed', {
        context: 'StorageMigrationService.performMigration',
        options,
        result,
      });

      return result;
    }
  }

  // =============================================================================
  // INDIVIDUAL MIGRATION STEPS
  // =============================================================================

  private async migrateAlarms(
    indexedDBStorage: IndexedDBStorage,
    dryRun: boolean
  ): Promise<number> {
    console.log('[StorageMigration] Migrating alarms...');

    const offlineStorage = OfflineStorage.getInstance();
    const legacyAlarms = await offlineStorage.getAlarms();

    if (dryRun) {
      console.log(`[StorageMigration] Would migrate ${legacyAlarms.length} alarms`);
      return legacyAlarms.length;
    }

    let migratedCount = 0;
    for (const alarm of legacyAlarms) {
      try {
        await indexedDBStorage.saveAlarm(alarm);
        migratedCount++;
      } catch (error) {
        console.error('[StorageMigration] Failed to migrate alarm:', alarm.id, error);
      }
    }

    console.log(
      `[StorageMigration] Successfully migrated ${migratedCount}/${legacyAlarms.length} alarms`
    );
    return migratedCount;
  }

  private async migratePendingChanges(
    indexedDBStorage: IndexedDBStorage,
    dryRun: boolean
  ): Promise<number> {
    console.log('[StorageMigration] Migrating pending changes...');

    const offlineStorage = OfflineStorage.getInstance();
    const legacyChanges = await offlineStorage.getPendingChanges();

    if (dryRun) {
      console.log(
        `[StorageMigration] Would migrate ${legacyChanges.length} pending changes`
      );
      return legacyChanges.length;
    }

    let migratedCount = 0;
    for (const change of legacyChanges) {
      try {
        const pendingChange: PendingChange = {
          id: `migration-${change.id || Date.now()}`,
          entityType: 'alarm', // Legacy changes were mostly alarms
          entityId: change.id || '',
          type: change.type as 'create' | 'update' | 'delete',
          data: change.data,
          timestamp: change.timestamp,
          retryCount: 0,
        };

        await indexedDBStorage.addPendingChange(pendingChange);
        migratedCount++;
      } catch (error) {
        console.error(
          '[StorageMigration] Failed to migrate pending change:',
          change,
          error
        );
      }
    }

    console.log(
      `[StorageMigration] Successfully migrated ${migratedCount}/${legacyChanges.length} pending changes`
    );
    return migratedCount;
  }

  private async migrateMetadata(
    indexedDBStorage: IndexedDBStorage,
    dryRun: boolean
  ): Promise<number> {
    console.log('[StorageMigration] Migrating metadata...');

    // Try to get legacy metadata from both encrypted and unencrypted sources
    let legacyMetadata: any = null;

    try {
      legacyMetadata = SecurityService.secureStorageGet('smart-alarm-metadata');
    } catch (_error) {
      console.warn(
        '[StorageMigration] Could not get encrypted metadata, trying unencrypted'
      );
    }

    if (!legacyMetadata) {
      const unencryptedData = localStorage.getItem('smart-alarm-metadata');
      if (unencryptedData) {
        try {
          legacyMetadata = JSON.parse(unencryptedData);
        } catch (_error) {
          console.warn('[StorageMigration] Could not parse legacy metadata');
        }
      }
    }

    if (!legacyMetadata) {
      console.log('[StorageMigration] No legacy metadata found');
      return 0;
    }

    if (dryRun) {
      console.log('[StorageMigration] Would migrate 1 metadata record');
      return 1;
    }

    try {
      const modernMetadata: StorageMetadata = {
        id: 'migration-metadata',
        version: this.MIGRATION_VERSION,
        lastSync: legacyMetadata.lastSync || new Date().toISOString(),
        lastBackup: legacyMetadata.lastBackup,
        pendingChanges: legacyMetadata.pendingChanges?.length || 0,
        conflictResolution: legacyMetadata.conflictResolution || 'client-wins',
        dataIntegrityHash: legacyMetadata.dataIntegrityHash || '',
        syncRetryCount: legacyMetadata.syncRetryCount || 0,
        lastErrorReport: legacyMetadata.lastErrorReport,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await indexedDBStorage.create('metadata', modernMetadata);
      console.log('[StorageMigration] Successfully migrated metadata');
      return 1;
    } catch (error) {
      console.error('[StorageMigration] Failed to migrate metadata:', error);
      return 0;
    }
  }

  // =============================================================================
  // BACKUP AND CLEANUP
  // =============================================================================

  private async createLegacyBackup(): Promise<any> {
    console.log('[StorageMigration] Creating legacy data backup...');

    const backup: any = {
      version: this.MIGRATION_VERSION,
      timestamp: new Date().toISOString(),
      data: {},
    };

    // Backup all legacy keys
    for (const key of this.LEGACY_KEYS) {
      // Try encrypted storage first
      let data = SecurityService.secureStorageGet(key);
      if (data) {
        backup.data[key] = { encrypted: true, data };
      } else {
        // Try unencrypted
        const unencryptedData = localStorage.getItem(key);
        if (unencryptedData) {
          try {
            backup.data[key] = { encrypted: false, data: JSON.parse(unencryptedData) };
          } catch (_error) {
            backup.data[key] = { encrypted: false, data: unencryptedData };
          }
        }
      }
    }

    return backup;
  }

  private async storeLegacyBackup(backupData: any): Promise<string> {
    const backupId = `legacy-backup-${Date.now()}`;
    const backupString = JSON.stringify(backupData);

    // Store in localStorage as fallback
    localStorage.setItem(backupId, backupString);

    console.log('[StorageMigration] Legacy backup stored with ID:', backupId);
    return backupId;
  }

  private async clearLegacyData(): Promise<void> {
    console.log('[StorageMigration] Clearing legacy data...');

    for (const key of this.LEGACY_KEYS) {
      // Remove from encrypted storage
      try {
        SecurityService.secureStorageRemove(key);
      } catch (error) {
        console.warn(
          `[StorageMigration] Failed to remove encrypted key ${key}:`,
          error
        );
      }

      // Remove from unencrypted storage
      localStorage.removeItem(key);
    }

    console.log('[StorageMigration] Legacy data cleared');
  }

  // =============================================================================
  // MIGRATION RECORD MANAGEMENT
  // =============================================================================

  private getMigrationRecord(): {
    completed: boolean;
    timestamp?: string;
    version?: string;
  } | null {
    try {
      const record = localStorage.getItem(this.MIGRATION_KEY);
      return record ? JSON.parse(record) : null;
    } catch (_error) {
      return null;
    }
  }

  private markMigrationCompleted(): void {
    const record = {
      completed: true,
      timestamp: new Date().toISOString(),
      version: this.MIGRATION_VERSION,
    };

    localStorage.setItem(this.MIGRATION_KEY, JSON.stringify(record));
    console.log('[StorageMigration] Migration marked as completed');
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async rollbackMigration(backupId: string): Promise<boolean> {
    try {
      console.log('[StorageMigration] Rolling back migration...');

      const backupData = localStorage.getItem(backupId);
      if (!backupData) {
        throw new Error('Backup not found');
      }

      const backup = JSON.parse(backupData);

      // Restore legacy data
      for (const [key, value] of Object.entries(backup.data)) {
        const keyData = value as any;
        if (keyData.encrypted) {
          SecurityService.secureStorageSet(key, keyData.data);
        } else {
          const dataString =
            typeof keyData.data === 'string'
              ? keyData.data
              : JSON.stringify(keyData.data);
          localStorage.setItem(key, dataString);
        }
      }

      // Clear modern data
      const indexedDBStorage = IndexedDBStorage.getInstance();
      await indexedDBStorage.deleteDatabase();

      // Remove migration record
      localStorage.removeItem(this.MIGRATION_KEY);

      console.log('[StorageMigration] Migration rollback completed');
      return true;
    } catch (error) {
      ErrorHandler.handleError(error, 'Migration rollback failed', {
        context: 'StorageMigrationService.rollbackMigration',
        backupId,
      });
      return false;
    }
  }

  async validateMigration(): Promise<{
    isValid: boolean;
    issues: string[];
    statistics: {
      legacyAlarms: number;
      modernAlarms: number;
      legacyPendingChanges: number;
      modernPendingChanges: number;
    };
  }> {
    try {
      console.log('[StorageMigration] Validating migration...');

      const result = {
        isValid: true,
        issues: [] as string[],
        statistics: {
          legacyAlarms: 0,
          modernAlarms: 0,
          legacyPendingChanges: 0,
          modernPendingChanges: 0,
        },
      };

      // Count legacy data
      const offlineStorage = OfflineStorage.getInstance();
      const legacyAlarms = await offlineStorage.getAlarms();
      const legacyPendingChanges = await offlineStorage.getPendingChanges();

      result.statistics.legacyAlarms = legacyAlarms.length;
      result.statistics.legacyPendingChanges = legacyPendingChanges.length;

      // Count modern data
      const indexedDBStorage = IndexedDBStorage.getInstance();
      await indexedDBStorage.initialize();

      result.statistics.modernAlarms = await indexedDBStorage.count('alarms');
      result.statistics.modernPendingChanges =
        await indexedDBStorage.count('pending_changes');

      // Validate migration completeness
      const migrationRecord = this.getMigrationRecord();
      if (!migrationRecord?.completed) {
        result.issues.push('Migration not marked as completed');
        result.isValid = false;
      }

      if (result.statistics.legacyAlarms > 0) {
        result.issues.push('Legacy alarms still present');
      }

      if (result.statistics.modernAlarms === 0) {
        result.issues.push('No modern alarms found');
        result.isValid = false;
      }

      console.log('[StorageMigration] Migration validation:', result);
      return result;
    } catch (error) {
      ErrorHandler.handleError(error, 'Migration validation failed', {
        context: 'StorageMigrationService.validateMigration',
      });

      return {
        isValid: false,
        issues: ['Validation failed due to error'],
        statistics: {
          legacyAlarms: 0,
          modernAlarms: 0,
          legacyPendingChanges: 0,
          modernPendingChanges: 0,
        },
      };
    }
  }
}

// Export singleton instance
export default StorageMigrationService.getInstance();
