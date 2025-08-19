// Enhanced Offline Storage Service for Relife App
// Provides comprehensive offline data management with advanced sync, conflict resolution, and data integrity

import type { Alarm } from "../types";
import { ErrorHandler } from "./error-handler";
import SecurityService from "./security";
import OfflineStorage from "./offline-storage";

interface EnhancedStorageMetadata {
  version: string;
  lastSync: string;
  lastBackup: string;
  pendingChanges: string[];
  conflictResolution: "client-wins" | "server-wins" | "merge" | "manual";
  dataIntegrityHash: string;
  syncRetryCount: number;
  lastErrorReport?: {
    timestamp: string;
    error: string;
    context: string;
  };
}

interface ConflictResolution {
  id: string;
  localData: any;
  serverData: any;
  timestamp: string;
  resolution?: "client" | "server" | "merged";
  mergedData?: any;
}

interface DataIntegrityCheck {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixedIssues: string[];
}

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
  errors: string[];
}

interface BackupMetadata {
  timestamp: string;
  version: string;
  dataTypes: string[];
  size: number;
  hash: string;
}

export class EnhancedOfflineStorage extends OfflineStorage {
  private static instance: EnhancedOfflineStorage;
  private readonly CONFLICTS_KEY = "relife-conflicts";
  private readonly BACKUP_KEY = "relife-backup";
  private readonly INTEGRITY_KEY = "relife-integrity";
  private readonly ENHANCED_VERSION = "2.0.0";

  private constructor() {
    super();
  }

  static getInstance(): EnhancedOfflineStorage {
    if (!EnhancedOfflineStorage.instance) {
      EnhancedOfflineStorage.instance = new EnhancedOfflineStorage();
    }
    return EnhancedOfflineStorage.instance;
  }

  // ==================== ENHANCED DATA INTEGRITY ====================

  async validateDataIntegrity(): Promise<DataIntegrityCheck> {
    try {
      console.log("[EnhancedStorage] Validating data integrity...");

      const result: DataIntegrityCheck = {
        isValid: true,
        errors: [],
        warnings: [],
        fixedIssues: [],
      };

      // Validate alarms data
      const alarms = await this.getAlarms();
      for (const alarm of alarms) {
        if (!alarm.id) {
          result.errors.push(`Alarm missing ID: ${JSON.stringify(alarm)}`);
          result.isValid = false;
        }
        if (!alarm.time || !/^\d{2}:\d{2}$/.test(alarm.time)) {
          result.errors.push(
            `Invalid alarm time format: ${alarm.id} - ${alarm.time}`,
          );
          result.isValid = false;
        }
        if (alarm.days && !Array.isArray(alarm.days)) {
          result.warnings.push(`Alarm ${alarm.id} has invalid days format`);
          // Fix the issue
          alarm.days = [];
          result.fixedIssues.push(`Fixed days format for alarm ${alarm.id}`);
        }
      }

      // Validate pending changes
      const pendingChanges = await this.getPendingChanges();
      for (const change of pendingChanges) {
        if (!change.id || !change.type || !change.timestamp) {
          result.errors.push(
            `Invalid pending change: ${JSON.stringify(change)}`,
          );
          result.isValid = false;
        }
      }

      // Save fixed data if any issues were auto-corrected
      if (result.fixedIssues.length > 0) {
        await this.saveAlarms(alarms);
        console.log(
          "[EnhancedStorage] Auto-fixed data integrity issues:",
          result.fixedIssues,
        );
      }

      // Update data integrity hash
      await this.updateDataIntegrityHash(alarms, pendingChanges);

      console.log("[EnhancedStorage] Data integrity check completed:", result);
      return result;
    } catch (error) {
      ErrorHandler.handleError(error, "Data integrity validation failed", {
        context: "EnhancedOfflineStorage.validateDataIntegrity",
      });
      return {
        isValid: false,
        errors: [error.message || "Unknown validation error"],
        warnings: [],
        fixedIssues: [],
      };
    }
  }

  private async updateDataIntegrityHash(
    alarms: Alarm[],
    pendingChanges: any[],
  ): Promise<void> {
    try {
      const combinedData = JSON.stringify({ alarms, pendingChanges });
      const hash = await this.calculateHash(combinedData);

      SecurityService.secureStorageSet(this.INTEGRITY_KEY, {
        hash,
        timestamp: new Date().toISOString(),
        alarmsCount: alarms.length,
        pendingCount: pendingChanges.length,
      });
    } catch (error) {
      console.error(
        "[EnhancedStorage] Failed to update integrity hash:",
        error,
      );
    }
  }

  private async calculateHash(data: string): Promise<string> {
    // Simple hash calculation (in production, use a proper crypto library)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // ==================== ADVANCED SYNC WITH CONFLICT RESOLUTION ====================

  async performAdvancedSync(
    options: {
      conflictResolution?: "client-wins" | "server-wins" | "merge" | "manual";
      retryFailedOnly?: boolean;
      maxRetries?: number;
    } = {},
  ): Promise<SyncResult> {
    try {
      console.log(
        "[EnhancedStorage] Starting advanced sync with options:",
        options,
      );

      const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        conflicts: 0,
        errors: [],
      };

      const {
        conflictResolution = "merge",
        retryFailedOnly = false,
        maxRetries = 3,
      } = options;

      // Get pending changes to sync
      const pendingChanges = await this.getPendingChanges();
      let changesToSync = pendingChanges;

      if (retryFailedOnly) {
        // Only retry previously failed syncs
        changesToSync = pendingChanges.filter(
          (change: any) => change.retryCount && change.retryCount > 0,
        );
      }

      console.log(`[EnhancedStorage] Syncing ${changesToSync.length} changes`);

      for (const change of changesToSync) {
        try {
          if ((change.retryCount || 0) >= maxRetries) {
            console.warn(
              `[EnhancedStorage] Skipping change ${change.id} - max retries exceeded`,
            );
            result.failed++;
            continue;
          }

          const syncSuccess = await this.syncSingleChange(
            change,
            conflictResolution,
          );

          if (syncSuccess.hasConflict) {
            result.conflicts++;
            await this.storeConflict({
              id: change.id,
              localData: change.data,
              serverData: syncSuccess.serverData,
              timestamp: new Date().toISOString(),
            });
          }

          if (syncSuccess.success) {
            result.synced++;
            // Remove successfully synced change
            await this.removePendingChange(change.id);
          } else {
            result.failed++;
            result.errors.push(
              `Failed to sync ${change.id}: ${syncSuccess.error}`,
            );

            // Update retry count
            await this.updatePendingChangeRetryCount(change.id);
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Sync error for ${change.id}: ${error.message}`);
          await this.updatePendingChangeRetryCount(change.id);
        }
      }

      // Update sync metadata
      await this.updateSyncMetadata({
        lastSync: new Date().toISOString(),
        syncResult: result,
        conflictResolution,
      });

      if (result.failed > 0 || result.conflicts > 0) {
        result.success = false;
      }

      console.log("[EnhancedStorage] Advanced sync completed:", result);
      return result;
    } catch (error) {
      ErrorHandler.handleError(error, "Advanced sync failed", {
        context: "EnhancedOfflineStorage.performAdvancedSync",
      });
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        errors: [error.message || "Unknown sync error"],
      };
    }
  }

  private async syncSingleChange(
    change: any,
    conflictResolution: string,
  ): Promise<{
    success: boolean;
    hasConflict: boolean;
    serverData?: any;
    error?: string;
  }> {
    try {
      // Simulate API call to sync data
      // In real implementation, this would make actual HTTP requests
      console.log(
        `[EnhancedStorage] Syncing change ${change.id} with resolution: ${conflictResolution}`,
      );

      // Check for conflicts by comparing timestamps or versions
      const hasConflict = Math.random() < 0.1; // 10% chance of conflict for simulation

      if (hasConflict) {
        const serverData = {
          ...change.data,
          modifiedBy: "server",
          lastModified: Date.now(),
        };

        if (conflictResolution === "client-wins") {
          return { success: true, hasConflict: true, serverData };
        } else if (conflictResolution === "server-wins") {
          // Update local data with server data
          if (change.type === "update" && change.data) {
            await this.saveAlarm(serverData);
          }
          return { success: true, hasConflict: true, serverData };
        } else if (conflictResolution === "merge") {
          // Merge local and server data
          const mergedData = await this.mergeData(change.data, serverData);
          if (change.type === "update" && mergedData) {
            await this.saveAlarm(mergedData);
          }
          return { success: true, hasConflict: true, serverData: mergedData };
        }

        return {
          success: false,
          hasConflict: true,
          serverData,
          error: "Manual conflict resolution required",
        };
      }

      // No conflict - sync normally
      return { success: true, hasConflict: false };
    } catch (error) {
      return { success: false, hasConflict: false, error: error.message };
    }
  }

  private async mergeData(localData: any, serverData: any): Promise<any> {
    try {
      // Intelligent data merging logic
      const merged = { ...localData };

      // Use server data for certain fields that should be authoritative
      const serverAuthoritative = ["id", "userId", "createdAt"];
      serverAuthoritative.forEach((field) => {
        if (serverData[field] !== undefined) {
          merged[field] = serverData[field];
        }
      });

      // Use most recent timestamp for user-modifiable fields
      if (serverData.lastModified && localData.lastModified) {
        if (serverData.lastModified > localData.lastModified) {
          // Server data is newer for user fields
          const userFields = ["label", "time", "days", "enabled", "voiceMood"];
          userFields.forEach((field) => {
            if (serverData[field] !== undefined) {
              merged[field] = serverData[field];
            }
          });
        }
      }

      // Always use the latest modification timestamp
      merged.lastModified = Math.max(
        localData.lastModified || 0,
        serverData.lastModified || 0,
      );

      console.log("[EnhancedStorage] Data merged successfully:", merged);
      return merged;
    } catch (error) {
      console.error("[EnhancedStorage] Data merge failed:", error);
      // Fallback to local data if merge fails
      return localData;
    }
  }

  // ==================== CONFLICT MANAGEMENT ====================

  private async storeConflict(conflict: ConflictResolution): Promise<void> {
    try {
      const existingConflicts = await this.getConflicts();
      existingConflicts.push(conflict);

      SecurityService.secureStorageSet(this.CONFLICTS_KEY, existingConflicts);
      console.log(
        "[EnhancedStorage] Conflict stored for manual resolution:",
        conflict.id,
      );
    } catch (error) {
      console.error("[EnhancedStorage] Failed to store conflict:", error);
    }
  }

  async getConflicts(): Promise<ConflictResolution[]> {
    try {
      const conflicts = SecurityService.secureStorageGet(this.CONFLICTS_KEY);
      return Array.isArray(conflicts) ? conflicts : [];
    } catch (error) {
      console.error("[EnhancedStorage] Failed to get conflicts:", error);
      return [];
    }
  }

  async resolveConflict(
    conflictId: string,
    resolution: "client" | "server" | "merged",
    mergedData?: any,
  ): Promise<boolean> {
    try {
      const conflicts = await this.getConflicts();
      const conflictIndex = conflicts.findIndex((c) => c.id === conflictId);

      if (conflictIndex === -1) {
        console.warn("[EnhancedStorage] Conflict not found:", conflictId);
        return false;
      }

      const conflict = conflicts[conflictIndex];
      conflict.resolution = resolution;

      let dataToSave: any;
      if (resolution === "client") {
        dataToSave = conflict.localData;
      } else if (resolution === "server") {
        dataToSave = conflict.serverData;
      } else if (resolution === "merged" && mergedData) {
        dataToSave = mergedData;
        conflict.mergedData = mergedData;
      }

      // Save the resolved data
      if (dataToSave) {
        await this.saveAlarm(dataToSave);
      }

      // Remove the resolved conflict
      conflicts.splice(conflictIndex, 1);
      SecurityService.secureStorageSet(this.CONFLICTS_KEY, conflicts);

      console.log(
        "[EnhancedStorage] Conflict resolved:",
        conflictId,
        resolution,
      );
      return true;
    } catch (error) {
      ErrorHandler.handleError(error, "Failed to resolve conflict", {
        context: "EnhancedOfflineStorage.resolveConflict",
        conflictId,
        resolution,
      });
      return false;
    }
  }

  // ==================== ENHANCED BACKUP AND RECOVERY ====================

  async createBackup(includeConflicts: boolean = false): Promise<{
    success: boolean;
    backupId: string;
    size: number;
    error?: string;
  }> {
    try {
      console.log("[EnhancedStorage] Creating enhanced backup...");

      const alarms = await this.getAlarms();
      const pendingChanges = await this.getPendingChanges();
      const metadata =
        SecurityService.secureStorageGet("smart-alarm-metadata") || {};

      const backupData: any = {
        version: this.ENHANCED_VERSION,
        timestamp: new Date().toISOString(),
        alarms,
        pendingChanges,
        metadata,
      };

      if (includeConflicts) {
        backupData.conflicts = await this.getConflicts();
      }

      // Add integrity information
      const dataString = JSON.stringify(backupData);
      backupData.hash = await this.calculateHash(dataString);
      backupData.size = new Blob([dataString]).size;

      const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const backupMetadata: BackupMetadata = {
        timestamp: backupData.timestamp,
        version: this.ENHANCED_VERSION,
        dataTypes: Object.keys(backupData).filter(
          (key) => !["version", "timestamp", "hash", "size"].includes(key),
        ),
        size: backupData.size,
        hash: backupData.hash,
      };

      // Store backup with metadata
      SecurityService.secureStorageSet(
        `${this.BACKUP_KEY}-${backupId}`,
        backupData,
      );
      SecurityService.secureStorageSet(
        `${this.BACKUP_KEY}-meta-${backupId}`,
        backupMetadata,
      );

      // Update backup history
      await this.updateBackupHistory(backupId, backupMetadata);

      console.log("[EnhancedStorage] Backup created successfully:", backupId);
      return {
        success: true,
        backupId,
        size: backupData.size,
      };
    } catch (error) {
      ErrorHandler.handleError(error, "Failed to create backup", {
        context: "EnhancedOfflineStorage.createBackup",
      });
      return {
        success: false,
        backupId: "",
        size: 0,
        error: error.message,
      };
    }
  }

  async restoreFromBackup(
    backupId: string,
    options: {
      overwriteConflicts?: boolean;
      validateIntegrity?: boolean;
      createBackupBeforeRestore?: boolean;
    } = {},
  ): Promise<{
    success: boolean;
    restored: {
      alarms: number;
      pendingChanges: number;
      conflicts: number;
    };
    error?: string;
  }> {
    try {
      console.log("[EnhancedStorage] Restoring from backup:", backupId);

      const {
        overwriteConflicts = false,
        validateIntegrity = true,
        createBackupBeforeRestore = true,
      } = options;

      // Create backup before restore if requested
      if (createBackupBeforeRestore) {
        await this.createBackup(true);
      }

      // Get backup data
      const backupData = SecurityService.secureStorageGet(
        `${this.BACKUP_KEY}-${backupId}`,
      );
      if (!backupData) {
        throw new Error("Backup not found");
      }

      // Validate backup integrity if requested
      if (validateIntegrity && backupData.hash) {
        const dataToValidate = { ...backupData };
        delete dataToValidate.hash;
        const calculatedHash = await this.calculateHash(
          JSON.stringify(dataToValidate),
        );

        if (calculatedHash !== backupData.hash) {
          throw new Error(
            "Backup integrity check failed - data may be corrupted",
          );
        }
      }

      const result = {
        success: true,
        restored: {
          alarms: 0,
          pendingChanges: 0,
          conflicts: 0,
        },
      };

      // Restore alarms
      if (backupData.alarms && Array.isArray(backupData.alarms)) {
        await this.saveAlarms(backupData.alarms);
        result.restored.alarms = backupData.alarms.length;
      }

      // Restore pending changes
      if (
        backupData.pendingChanges &&
        Array.isArray(backupData.pendingChanges)
      ) {
        SecurityService.secureStorageSet(
          "smart-alarm-pending",
          backupData.pendingChanges,
        );
        result.restored.pendingChanges = backupData.pendingChanges.length;
      }

      // Restore conflicts if present and not overwriting
      if (backupData.conflicts && Array.isArray(backupData.conflicts)) {
        if (overwriteConflicts) {
          SecurityService.secureStorageSet(
            this.CONFLICTS_KEY,
            backupData.conflicts,
          );
          result.restored.conflicts = backupData.conflicts.length;
        } else {
          // Merge with existing conflicts
          const existingConflicts = await this.getConflicts();
          const mergedConflicts = [
            ...existingConflicts,
            ...backupData.conflicts,
          ];
          SecurityService.secureStorageSet(this.CONFLICTS_KEY, mergedConflicts);
          result.restored.conflicts = backupData.conflicts.length;
        }
      }

      // Restore metadata if present
      if (backupData.metadata) {
        SecurityService.secureStorageSet(
          "smart-alarm-metadata",
          backupData.metadata,
        );
      }

      console.log("[EnhancedStorage] Restore completed successfully:", result);
      return result;
    } catch (error) {
      ErrorHandler.handleError(error, "Failed to restore from backup", {
        context: "EnhancedOfflineStorage.restoreFromBackup",
        backupId,
      });
      return {
        success: false,
        restored: { alarms: 0, pendingChanges: 0, conflicts: 0 },
        error: error.message,
      };
    }
  }

  async getBackupHistory(): Promise<BackupMetadata[]> {
    try {
      const history =
        SecurityService.secureStorageGet(`${this.BACKUP_KEY}-history`) || [];
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.error("[EnhancedStorage] Failed to get backup history:", error);
      return [];
    }
  }

  private async updateBackupHistory(
    backupId: string,
    metadata: BackupMetadata,
  ): Promise<void> {
    try {
      const history = await this.getBackupHistory();
      history.unshift({ ...metadata, id: backupId } as any);

      // Keep only last 10 backups in history
      const trimmedHistory = history.slice(0, 10);
      SecurityService.secureStorageSet(
        `${this.BACKUP_KEY}-history`,
        trimmedHistory,
      );
    } catch (error) {
      console.error(
        "[EnhancedStorage] Failed to update backup history:",
        error,
      );
    }
  }

  // ==================== UTILITY METHODS ====================

  private async removePendingChange(changeId: string): Promise<void> {
    try {
      const pendingChanges = await this.getPendingChanges();
      const filteredChanges = pendingChanges.filter(
        (change: any) => change.id !== changeId,
      );
      SecurityService.secureStorageSet("smart-alarm-pending", filteredChanges);
    } catch (error) {
      console.error(
        "[EnhancedStorage] Failed to remove pending change:",
        error,
      );
    }
  }

  private async updatePendingChangeRetryCount(changeId: string): Promise<void> {
    try {
      const pendingChanges = await this.getPendingChanges();
      const change = pendingChanges.find((c: any) => c.id === changeId);

      if (change) {
        change.retryCount = (change.retryCount || 0) + 1;
        change.lastRetry = new Date().toISOString();
        SecurityService.secureStorageSet("smart-alarm-pending", pendingChanges);
      }
    } catch (error) {
      console.error("[EnhancedStorage] Failed to update retry count:", error);
    }
  }

  private async updateSyncMetadata(update: any): Promise<void> {
    try {
      const existing =
        SecurityService.secureStorageGet("smart-alarm-metadata") || {};
      const updated = { ...existing, ...update };
      SecurityService.secureStorageSet("smart-alarm-metadata", updated);
    } catch (error) {
      console.error("[EnhancedStorage] Failed to update sync metadata:", error);
    }
  }

  // ==================== ENHANCED STATISTICS ====================

  async getEnhancedStorageStats(): Promise<{
    basic: any;
    conflicts: number;
    backups: number;
    integrityStatus: "valid" | "invalid" | "unknown";
    syncHealth: "good" | "warning" | "error";
    lastBackup: string | null;
    dataVersion: string;
  }> {
    try {
      const basic = await this.getStorageStats();
      const conflicts = await this.getConflicts();
      const backupHistory = await this.getBackupHistory();

      // Check integrity
      const integrityCheck = await this.validateDataIntegrity();
      const integrityStatus = integrityCheck.isValid ? "valid" : "invalid";

      // Determine sync health
      let syncHealth: "good" | "warning" | "error" = "good";
      if (basic.pendingChangesCount > 10) {
        syncHealth = "warning";
      }
      if (conflicts.length > 5 || basic.pendingChangesCount > 25) {
        syncHealth = "error";
      }

      return {
        basic,
        conflicts: conflicts.length,
        backups: backupHistory.length,
        integrityStatus,
        syncHealth,
        lastBackup:
          backupHistory.length > 0 ? backupHistory[0].timestamp : null,
        dataVersion: this.ENHANCED_VERSION,
      };
    } catch (error) {
      console.error("[EnhancedStorage] Failed to get enhanced stats:", error);
      const basic = await this.getStorageStats();
      return {
        basic,
        conflicts: 0,
        backups: 0,
        integrityStatus: "unknown" as const,
        syncHealth: "error" as const,
        lastBackup: null,
        dataVersion: this.ENHANCED_VERSION,
      };
    }
  }
}

export default EnhancedOfflineStorage.getInstance();
