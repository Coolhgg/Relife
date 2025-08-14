// Offline Storage Service for Smart Alarm App
// Provides comprehensive offline data management with sync capabilities

import type { Alarm } from '../types';
import { ErrorHandler } from './error-handler';
import SecurityService from './security';

interface StorageMetadata {
  version: string;
  lastSync: string;
  pendingChanges: string[];
}

interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  data?: Alarm;
  timestamp: string;
}

export class OfflineStorage {
  private static instance: OfflineStorage;
  private readonly ALARMS_KEY = 'smart-alarm-alarms';
  private readonly METADATA_KEY = 'smart-alarm-metadata';
  private readonly PENDING_CHANGES_KEY = 'smart-alarm-pending';
  private readonly VERSION = '1.0';

  private constructor() {}

  static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  // Alarm CRUD operations
  async saveAlarms(alarms: Alarm[]): Promise<void> {
    try {
      const data = {
        alarms,
        timestamp: new Date().toISOString(),
        version: this.VERSION
      };
      
      // Encrypt sensitive data before storage
      SecurityService.secureStorageSet(this.ALARMS_KEY, data);
      
      // Update metadata
      await this.updateMetadata({ lastModified: data.timestamp });
      
      console.log('[OfflineStorage] Saved encrypted alarms to local storage:', alarms.length);
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to save alarms locally', { 
        context: 'OfflineStorage.saveAlarms',
        alarmsCount: alarms.length
      });
      throw error;
    }
  }

  async getAlarms(): Promise<Alarm[]> {
    try {
      // Try to get encrypted data first
      const encryptedData = SecurityService.secureStorageGet(this.ALARMS_KEY);
      
      if (encryptedData) {
        // Version check and migration if needed
        if (encryptedData.version !== this.VERSION) {
          const migrated = await this.migrateData(encryptedData);
          return migrated.alarms || [];
        }
        
        console.log('[OfflineStorage] Retrieved encrypted alarms from local storage:', encryptedData.alarms?.length || 0);
        return encryptedData.alarms || [];
      }
      
      // Fallback: try to get unencrypted data for migration
      const unencryptedData = localStorage.getItem(this.ALARMS_KEY);
      if (unencryptedData) {
        console.log('[OfflineStorage] Found unencrypted data, migrating to encrypted storage');
        const parsed = JSON.parse(unencryptedData);
        
        // Migrate to encrypted storage
        SecurityService.secureStorageSet(this.ALARMS_KEY, parsed);
        localStorage.removeItem(this.ALARMS_KEY); // Remove unencrypted version
        
        return parsed.alarms || [];
      }
      
      console.log('[OfflineStorage] No alarms found in local storage');
      return [];
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to retrieve alarms from local storage', {
        context: 'OfflineStorage.getAlarms'
      });
      return [];
    }
  }

  async saveAlarm(alarm: Alarm): Promise<void> {
    try {
      const alarms = await this.getAlarms();
      const existingIndex = alarms.findIndex(a => a.id === alarm.id);
      
      if (existingIndex >= 0) {
        alarms[existingIndex] = alarm;
        await this.addPendingChange({
          id: alarm.id,
          type: 'update',
          data: alarm,
          timestamp: new Date().toISOString()
        });
      } else {
        alarms.push(alarm);
        await this.addPendingChange({
          id: alarm.id,
          type: 'create',
          data: alarm,
          timestamp: new Date().toISOString()
        });
      }
      
      await this.saveAlarms(alarms);
      console.log('[OfflineStorage] Saved individual alarm:', alarm.id);
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to save alarm', {
        context: 'OfflineStorage.saveAlarm',
        alarmId: alarm.id
      });
      throw error;
    }
  }

  async deleteAlarm(alarmId: string): Promise<void> {
    try {
      const alarms = await this.getAlarms();
      const filteredAlarms = alarms.filter(a => a.id !== alarmId);
      
      await this.saveAlarms(filteredAlarms);
      await this.addPendingChange({
        id: alarmId,
        type: 'delete',
        timestamp: new Date().toISOString()
      });
      
      console.log('[OfflineStorage] Deleted alarm:', alarmId);
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to delete alarm', {
        context: 'OfflineStorage.deleteAlarm',
        alarmId
      });
      throw error;
    }
  }

  // Pending changes management for sync
  async addPendingChange(change: PendingChange): Promise<void> {
    try {
      const existingChanges = await this.getPendingChanges();
      
      // Remove any existing change for the same item
      const filteredChanges = existingChanges.filter(c => c.id !== change.id);
      filteredChanges.push(change);
      
      // Encrypt pending changes
      SecurityService.secureStorageSet(this.PENDING_CHANGES_KEY, filteredChanges);
      
      // Request background sync if available
      this.requestBackgroundSync();
      
      console.log('[OfflineStorage] Added encrypted pending change:', change.type, change.id);
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to add pending change', {
        context: 'OfflineStorage.addPendingChange',
        changeType: change.type,
        changeId: change.id
      });
    }
  }

  async getPendingChanges(): Promise<PendingChange[]> {
    try {
      // Try encrypted storage first
      const encryptedData = SecurityService.secureStorageGet(this.PENDING_CHANGES_KEY);
      if (encryptedData) {
        return Array.isArray(encryptedData) ? encryptedData : [];
      }
      
      // Fallback to unencrypted for migration
      const unencryptedData = localStorage.getItem(this.PENDING_CHANGES_KEY);
      if (unencryptedData) {
        const parsed = JSON.parse(unencryptedData);
        // Migrate to encrypted storage
        SecurityService.secureStorageSet(this.PENDING_CHANGES_KEY, parsed);
        localStorage.removeItem(this.PENDING_CHANGES_KEY);
        return Array.isArray(parsed) ? parsed : [];
      }
      
      return [];
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to get pending changes', {
        context: 'OfflineStorage.getPendingChanges'
      });
      return [];
    }
  }

  async clearPendingChanges(): Promise<void> {
    try {
      SecurityService.secureStorageRemove(this.PENDING_CHANGES_KEY);
      localStorage.removeItem(this.PENDING_CHANGES_KEY); // Remove any old unencrypted version
      console.log('[OfflineStorage] Cleared encrypted pending changes');
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to clear pending changes', {
        context: 'OfflineStorage.clearPendingChanges'
      });
    }
  }

  // Metadata management
  private async updateMetadata(updates: Partial<StorageMetadata>): Promise<void> {
    try {
      const existing = await this.getMetadata();
      const metadata: StorageMetadata = {
        ...existing,
        ...updates,
        version: this.VERSION
      };
      
      // Encrypt metadata
      SecurityService.secureStorageSet(this.METADATA_KEY, metadata);
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to update metadata', {
        context: 'OfflineStorage.updateMetadata'
      });
    }
  }

  private async getMetadata(): Promise<StorageMetadata> {
    try {
      // Try encrypted storage first
      const encryptedData = SecurityService.secureStorageGet(this.METADATA_KEY);
      if (encryptedData) {
        return encryptedData;
      }
      
      // Fallback to unencrypted for migration
      const unencryptedData = localStorage.getItem(this.METADATA_KEY);
      if (unencryptedData) {
        const parsed = JSON.parse(unencryptedData);
        // Migrate to encrypted storage
        SecurityService.secureStorageSet(this.METADATA_KEY, parsed);
        localStorage.removeItem(this.METADATA_KEY);
        return parsed;
      }
      
      const defaultMetadata = {
        version: this.VERSION,
        lastSync: new Date().toISOString(),
        pendingChanges: []
      };
      
      // Store default metadata encrypted
      SecurityService.secureStorageSet(this.METADATA_KEY, defaultMetadata);
      return defaultMetadata;
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to get metadata', {
        context: 'OfflineStorage.getMetadata'
      });
      return {
        version: this.VERSION,
        lastSync: new Date().toISOString(),
        pendingChanges: []
      };
    }
  }

  // Data migration
  private async migrateData(oldData: any): Promise<any> {
    console.log('[OfflineStorage] Migrating data from version', oldData.version, 'to', this.VERSION);
    
    // Add migration logic here as the app evolves
    const migrated = {
      ...oldData,
      version: this.VERSION,
      timestamp: new Date().toISOString()
    };
    
    // Save migrated data with encryption
    SecurityService.secureStorageSet(this.ALARMS_KEY, migrated);
    localStorage.removeItem(this.ALARMS_KEY); // Remove old unencrypted version
    
    return migrated;
  }

  // Background sync request
  private requestBackgroundSync(): void {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register('alarm-sync');
      }).catch(error => {
        console.log('[OfflineStorage] Background sync registration failed:', error);
      });
    }
  }

  // Export/Import functionality
  async exportData(): Promise<string> {
    try {
      const alarms = await this.getAlarms();
      const metadata = await this.getMetadata();
      const pendingChanges = await this.getPendingChanges();
      
      const exportData = {
        alarms,
        metadata,
        pendingChanges,
        exportTimestamp: new Date().toISOString()
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to export data', {
        context: 'OfflineStorage.exportData'
      });
      throw error;
    }
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.alarms && Array.isArray(data.alarms)) {
        await this.saveAlarms(data.alarms);
        console.log('[OfflineStorage] Imported', data.alarms.length, 'alarms');
      }
      
      if (data.pendingChanges && Array.isArray(data.pendingChanges)) {
        SecurityService.secureStorageSet(this.PENDING_CHANGES_KEY, data.pendingChanges);
        console.log('[OfflineStorage] Imported', data.pendingChanges.length, 'encrypted pending changes');
      }
      
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to import data', {
        context: 'OfflineStorage.importData'
      });
      throw error;
    }
  }

  // Storage statistics
  async getStorageStats(): Promise<{
    alarmsCount: number;
    pendingChangesCount: number;
    lastSync: string;
    storageUsed: string;
  }> {
    try {
      const alarms = await this.getAlarms();
      const pendingChanges = await this.getPendingChanges();
      const metadata = await this.getMetadata();
      
      // Calculate approximate storage usage
      const totalData = JSON.stringify({ alarms, pendingChanges, metadata });
      const storageUsed = `${(new Blob([totalData]).size / 1024).toFixed(2)} KB`;
      
      return {
        alarmsCount: alarms.length,
        pendingChangesCount: pendingChanges.length,
        lastSync: metadata.lastSync,
        storageUsed
      };
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to get storage stats', {
        context: 'OfflineStorage.getStorageStats'
      });
      return {
        alarmsCount: 0,
        pendingChangesCount: 0,
        lastSync: 'Never',
        storageUsed: '0 KB'
      };
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      // Clear encrypted storage
      SecurityService.secureStorageRemove(this.ALARMS_KEY);
      SecurityService.secureStorageRemove(this.METADATA_KEY);
      SecurityService.secureStorageRemove(this.PENDING_CHANGES_KEY);
      
      // Clear any old unencrypted storage
      localStorage.removeItem(this.ALARMS_KEY);
      localStorage.removeItem(this.METADATA_KEY);
      localStorage.removeItem(this.PENDING_CHANGES_KEY);
      
      console.log('[OfflineStorage] Cleared all encrypted data');
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to clear all data', {
        context: 'OfflineStorage.clearAllData'
      });
      throw error;
    }
  }
}

export default OfflineStorage.getInstance();