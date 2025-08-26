/**
 * Unified Storage Service
 * Provides a clean, high-level interface for all storage operations
 * Automatically handles migration from localStorage to IndexedDB
 */

import IndexedDBStorage from './indexeddb-storage';
import StorageMigrationService from './storage-migration';
import _OfflineStorage from './offline-storage';
import EnhancedOfflineStorage from './enhanced-offline-storage';
import { ErrorHandler } from './error-handler';
import type {
  Alarm,
  _User,
  _AlarmEvent,
  _VoiceMood,
  _Theme,
  _Battle,
} from '../types/domain';
import type {
  PendingChange,
  _ConflictResolution,
  SearchIndex,
} from '../types/indexeddb-schema';

interface StorageInitializationResult {
  success: boolean;
  usingModernStorage: boolean;
  migrationPerformed: boolean;
  migrationResult?: any;
  error?: string;
}

interface StorageStats {
  totalSize: number;
  alarms: number;
  pendingChanges: number;
  conflicts: number;
  cacheEntries: number;
  lastSync: string | null;
  storageType: 'indexeddb' | 'localstorage' | 'hybrid';
  isHealthy: boolean;
}

export class UnifiedStorageService {
  private static instance: UnifiedStorageService;
  private initialized = false;
  private usingModernStorage = false;
  private initializationPromise: Promise<StorageInitializationResult> | null = null;

  // Storage service instances
  private indexedDBStorage = IndexedDBStorage.getInstance();
  private migrationService = StorageMigrationService.getInstance();
  private legacyStorage = EnhancedOfflineStorage.getInstance();

  private constructor() {}

  static getInstance(): UnifiedStorageService {
    if (!UnifiedStorageService.instance) {
      UnifiedStorageService.instance = new UnifiedStorageService();
    }
    return UnifiedStorageService.instance;
  }

  // =============================================================================
  // INITIALIZATION AND SETUP
  // =============================================================================

  async initialize(
    options: {
      autoMigrate?: boolean;
      fallbackToLegacy?: boolean;
      createBackup?: boolean;
    } = {}
  ): Promise<StorageInitializationResult> {
    if (this.initialized) {
      return {
        success: true,
        usingModernStorage: this.usingModernStorage,
        migrationPerformed: false,
      };
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization(options);
    const result = await this.initializationPromise;

    if (result.success) {
      this.initialized = true;
      this.usingModernStorage = result.usingModernStorage;
    }

    return result;
  }

  private async performInitialization(options: {
    autoMigrate?: boolean;
    fallbackToLegacy?: boolean;
    createBackup?: boolean;
  }): Promise<StorageInitializationResult> {
    const {
      autoMigrate = true,
      fallbackToLegacy = true,
      createBackup = true,
    } = options;

    console.log('[UnifiedStorage] Initializing storage system...', options);

    try {
      // Check if IndexedDB is supported
      if (!('indexedDB' in window)) {
        console.warn('[UnifiedStorage] IndexedDB not supported, using legacy storage');
        return {
          success: true,
          usingModernStorage: false,
          migrationPerformed: false,
        };
      }

      // Try to initialize IndexedDB
      try {
        await this.indexedDBStorage.initialize();
        console.log('[UnifiedStorage] IndexedDB initialized successfully');

        // Check if migration is needed
        const migrationStatus = await this.migrationService.checkMigrationStatus();

        if (migrationStatus.isRequired && autoMigrate && migrationStatus.canMigrate) {
          console.log('[UnifiedStorage] Starting automatic migration...');

          const migrationResult = await this.migrationService.performMigration({
            createBackup,
            clearLegacyData: true,
            dryRun: false,
          });

          if (migrationResult.success) {
            console.log('[UnifiedStorage] Migration completed successfully');
            return {
              success: true,
              usingModernStorage: true,
              migrationPerformed: true,
              migrationResult,
            };
          } else {
            console.error('[UnifiedStorage] Migration failed:', migrationResult);

            if (fallbackToLegacy) {
              console.log('[UnifiedStorage] Falling back to legacy storage');
              return {
                success: true,
                usingModernStorage: false,
                migrationPerformed: false,
                error: 'Migration failed, using legacy storage',
              };
            } else {
              throw new Error(`Migration failed: ${migrationResult.errors.join(', ')}`);
            }
          }
        }

        // No migration needed or migration not auto-enabled
        return {
          success: true,
          usingModernStorage: true,
          migrationPerformed: false,
        };
      } catch (indexedDBError) {
        console.error(
          '[UnifiedStorage] IndexedDB initialization failed:',
          indexedDBError
        );

        if (fallbackToLegacy) {
          console.log('[UnifiedStorage] Falling back to legacy storage');
          return {
            success: true,
            usingModernStorage: false,
            migrationPerformed: false,
            error: 'IndexedDB failed, using legacy storage',
          };
        } else {
          throw indexedDBError;
        }
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'Storage initialization failed', {
        context: 'UnifiedStorageService.performInitialization',
        options,
      });

      return {
        success: false,
        usingModernStorage: false,
        migrationPerformed: false,
        error: error instanceof Error ? error.message : 'Unknown initialization error',
      };
    }
  }

  // =============================================================================
  // ALARM OPERATIONS
  // =============================================================================

  async saveAlarm(alarm: Alarm): Promise<void> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      await this.indexedDBStorage.saveAlarm(alarm);
    } else {
      await this.legacyStorage.saveAlarm(alarm);
    }
  }

  async getAlarm(id: string): Promise<Alarm | null> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      return await this.indexedDBStorage.getAlarm(id);
    } else {
      const alarms = await this.legacyStorage.getAlarms();
      return alarms.find(alarm => alarm.id === id) || null;
    }
  }

  async getAllAlarms(): Promise<Alarm[]> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      return await this.indexedDBStorage.getAllAlarms();
    } else {
      return await this.legacyStorage.getAlarms();
    }
  }

  async getAlarmsByUserId(userId: string): Promise<Alarm[]> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      return await this.indexedDBStorage.getAlarmsByUserId(userId);
    } else {
      const alarms = await this.legacyStorage.getAlarms();
      return alarms.filter(alarm => alarm.userId === userId);
    }
  }

  async getEnabledAlarms(): Promise<Alarm[]> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      return await this.indexedDBStorage.getEnabledAlarms();
    } else {
      const alarms = await this.legacyStorage.getAlarms();
      return alarms.filter(alarm => alarm.enabled);
    }
  }

  async deleteAlarm(id: string): Promise<void> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      await this.indexedDBStorage.deleteAlarm(id);
    } else {
      await this.legacyStorage.deleteAlarm(id);
    }
  }

  // =============================================================================
  // SEARCH OPERATIONS
  // =============================================================================

  async search(query: string, entityTypes?: string[]): Promise<SearchIndex[]> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      return await this.indexedDBStorage.search(query, entityTypes);
    } else {
      // Implement basic search for legacy storage
      return this.performLegacySearch(query, entityTypes);
    }
  }

  private async performLegacySearch(
    query: string,
    entityTypes?: string[]
  ): Promise<SearchIndex[]> {
    const results: SearchIndex[] = [];
    const lowerQuery = query.toLowerCase();

    if (!entityTypes || entityTypes.includes('alarm')) {
      const alarms = await this.legacyStorage.getAlarms();
      for (const alarm of alarms) {
        const searchText = [alarm.title, alarm.label, alarm.description]
          .join(' ')
          .toLowerCase();
        if (searchText.includes(lowerQuery)) {
          results.push({
            id: `alarm-${alarm.id}`,
            entityType: 'alarm',
            entityId: alarm.id,
            searchText,
            keywords: searchText.split(' ').filter(word => word.length > 1),
            timestamp: alarm.updatedAt.toISOString(),
          });
        }
      }
    }

    return results.slice(0, 50); // Limit results
  }

  // =============================================================================
  // SYNC AND OFFLINE OPERATIONS
  // =============================================================================

  async getPendingChanges(): Promise<PendingChange[]> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      return await this.indexedDBStorage.getPendingChanges();
    } else {
      const legacyChanges = await this.legacyStorage.getPendingChanges();
      return legacyChanges.map(change => ({
        id: change.id || `legacy-${Date.now()}`,
        entityType: 'alarm' as const,
        entityId: change.id || '',
        type: change.type as 'create' | 'update' | 'delete',
        data: change.data,
        timestamp: change.timestamp,
        retryCount: 0,
      }));
    }
  }

  async clearPendingChanges(): Promise<void> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      const changes = await this.indexedDBStorage.getPendingChanges();
      for (const change of changes) {
        await this.indexedDBStorage.removePendingChange(change.id);
      }
    } else {
      await this.legacyStorage.clearPendingChanges();
    }
  }

  async performAdvancedSync(options: any = {}): Promise<any> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      // For modern storage, we'd implement advanced sync here
      console.log('[UnifiedStorage] Advanced sync not yet implemented for IndexedDB');
      return { success: true, synced: 0, failed: 0, conflicts: 0, errors: [] };
    } else {
      return await this.legacyStorage.performAdvancedSync(options);
    }
  }

  // =============================================================================
  // CACHE OPERATIONS
  // =============================================================================

  async setCache<T>(
    key: string,
    data: T,
    ttl?: number,
    tags: string[] = []
  ): Promise<void> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      await this.indexedDBStorage.setCache(key, data, ttl, tags);
    } else {
      // Simple cache implementation for legacy storage
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : undefined,
      };
      localStorage.setItem(`cache-${key}`, JSON.stringify(cacheData));
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      return await this.indexedDBStorage.getCache(key);
    } else {
      const cacheItem = localStorage.getItem(`cache-${key}`);
      if (!cacheItem) return null;

      try {
        const parsed = JSON.parse(cacheItem);
        if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
          localStorage.removeItem(`cache-${key}`);
          return null;
        }
        return parsed.data;
      } catch {
        return null;
      }
    }
  }

  async clearCache(tags?: string[]): Promise<void> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      await this.indexedDBStorage.clearCache(tags);
    } else {
      // Clear all cache items for legacy storage
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache-'));
      for (const key of keys) {
        localStorage.removeItem(key);
      }
    }
  }

  // =============================================================================
  // STORAGE STATISTICS AND HEALTH
  // =============================================================================

  async getStorageStats(): Promise<StorageStats> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      const stats = await this.indexedDBStorage.getStorageStats();
      return {
        totalSize: stats.totalSize,
        alarms: stats.storeStats.alarms?.count || 0,
        pendingChanges: stats.syncStats.pendingChanges,
        conflicts: stats.syncStats.conflicts,
        cacheEntries: stats.cacheStats.totalEntries,
        lastSync: stats.syncStats.lastSync,
        storageType: 'indexeddb',
        isHealthy:
          stats.cacheStats.expiredEntries < 100 && stats.syncStats.conflicts < 10,
      };
    } else {
      const basicStats = await this.legacyStorage.getStorageStats();
      const enhancedStats = await this.legacyStorage.getEnhancedStorageStats();

      return {
        totalSize: parseInt(basicStats.storageUsed.replace(/[^\d]/g, '')) * 1024 || 0,
        alarms: basicStats.alarmsCount,
        pendingChanges: basicStats.pendingChangesCount,
        conflicts: enhancedStats.conflicts,
        cacheEntries: 0, // Legacy doesn't have structured cache
        lastSync: basicStats.lastSync,
        storageType: 'localstorage',
        isHealthy: enhancedStats.syncHealth === 'good',
      };
    }
  }

  async performMaintenance(): Promise<{
    success: boolean;
    actions: string[];
    errors: string[];
  }> {
    await this.ensureInitialized();

    const result = {
      success: true,
      actions: [] as string[],
      errors: [] as string[],
    };

    try {
      if (this.usingModernStorage) {
        const maintenanceResult = await this.indexedDBStorage.maintenance();
        result.actions.push(
          `Cleared ${maintenanceResult.clearedExpiredCache} expired cache entries`
        );
        result.actions.push(
          ...maintenanceResult.optimizedIndexes.map(idx => `Optimized index: ${idx}`)
        );
        result.errors.push(...maintenanceResult.errors);
      } else {
        // Perform legacy maintenance
        await this.legacyStorage.validateDataIntegrity();
        result.actions.push('Validated data integrity');

        // Clear old cache entries
        const keys = Object.keys(localStorage).filter(key => key.startsWith('cache-'));
        let clearedCount = 0;
        const now = Date.now();

        for (const key of keys) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              if (parsed.expiresAt && parsed.expiresAt < now) {
                localStorage.removeItem(key);
                clearedCount++;
              }
            }
          } catch {
            localStorage.removeItem(key);
            clearedCount++;
          }
        }

        if (clearedCount > 0) {
          result.actions.push(`Cleared ${clearedCount} expired cache entries`);
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(
        error instanceof Error ? error.message : 'Unknown maintenance error'
      );
    }

    return result;
  }

  // =============================================================================
  // BACKUP AND EXPORT
  // =============================================================================

  async createBackup(includeConflicts = false): Promise<{
    success: boolean;
    backupId: string;
    size: number;
    error?: string;
  }> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      // Modern backup would be implemented here
      console.log('[UnifiedStorage] Modern backup not yet implemented');
      return {
        success: false,
        backupId: '',
        size: 0,
        error: 'Modern backup not implemented',
      };
    } else {
      return await this.legacyStorage.createBackup(includeConflicts);
    }
  }

  async exportData(): Promise<string> {
    await this.ensureInitialized();

    if (this.usingModernStorage) {
      const alarms = await this.indexedDBStorage.getAllAlarms();
      const pendingChanges = await this.indexedDBStorage.getPendingChanges();

      return JSON.stringify(
        {
          version: '2.0',
          timestamp: new Date().toISOString(),
          storageType: 'indexeddb',
          data: {
            alarms,
            pendingChanges,
          },
        },
        null,
        2
      );
    } else {
      return await this.legacyStorage.exportData();
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async checkStorageHealth(): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
    storageType: string;
    canUpgrade: boolean;
  }> {
    await this.ensureInitialized();

    const result = {
      isHealthy: true,
      issues: [] as string[],
      recommendations: [] as string[],
      storageType: this.usingModernStorage ? 'indexeddb' : 'localstorage',
      canUpgrade: false,
    };

    try {
      const stats = await this.getStorageStats();

      if (!stats.isHealthy) {
        result.isHealthy = false;
        result.issues.push('Storage health check failed');
      }

      if (stats.conflicts > 5) {
        result.isHealthy = false;
        result.issues.push(`High number of conflicts: ${stats.conflicts}`);
        result.recommendations.push('Consider resolving conflicts manually');
      }

      if (stats.pendingChanges > 20) {
        result.issues.push(`Many pending changes: ${stats.pendingChanges}`);
        result.recommendations.push('Check network connectivity for sync');
      }

      if (!this.usingModernStorage) {
        result.canUpgrade = true;
        result.recommendations.push(
          'Consider upgrading to IndexedDB for better performance'
        );
      }

      if (stats.cacheEntries > 1000) {
        result.recommendations.push('Consider clearing cache for better performance');
      }
    } catch (_error) {
      result.isHealthy = false;
      result.issues.push('Failed to check storage health');
    }

    return result;
  }

  // Migration-related methods
  async getMigrationStatus() {
    return await this.migrationService.checkMigrationStatus();
  }

  async performMigration(options: any = {}) {
    return await this.migrationService.performMigration(options);
  }

  isUsingModernStorage(): boolean {
    return this.usingModernStorage;
  }

  getStorageType(): 'indexeddb' | 'localstorage' {
    return this.usingModernStorage ? 'indexeddb' : 'localstorage';
  }
}

// Export singleton instance
export default UnifiedStorageService.getInstance();
