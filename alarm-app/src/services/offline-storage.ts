// Offline Storage Service for Smart Alarm App
// Provides comprehensive offline data management with sync capabilities

import type { Alarm } from '../types';
import { ErrorHandler } from './error-handler';

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
      localStorage.setItem(this.ALARMS_KEY, JSON.stringify(data));
      
      // Update metadata
      await this.updateMetadata({ lastModified: data.timestamp });
      
      console.log('[OfflineStorage] Saved alarms to local storage:', alarms.length);
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
      const data = localStorage.getItem(this.ALARMS_KEY);
      if (!data) {
        console.log('[OfflineStorage] No alarms found in local storage');
        return [];
      }

      const parsed = JSON.parse(data);
      
      // Version check and migration if needed
      if (parsed.version !== this.VERSION) {
        const migrated = await this.migrateData(parsed);
        return migrated.alarms || [];
      }

      console.log('[OfflineStorage] Retrieved alarms from local storage:', parsed.alarms?.length || 0);
      return parsed.alarms || [];
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
      
      localStorage.setItem(this.PENDING_CHANGES_KEY, JSON.stringify(filteredChanges));
      
      // Request background sync if available
      this.requestBackgroundSync();
      
      console.log('[OfflineStorage] Added pending change:', change.type, change.id);
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
      const data = localStorage.getItem(this.PENDING_CHANGES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to get pending changes', {
        context: 'OfflineStorage.getPendingChanges'
      });
      return [];
    }
  }

  async clearPendingChanges(): Promise<void> {
    try {
      localStorage.removeItem(this.PENDING_CHANGES_KEY);
      console.log('[OfflineStorage] Cleared pending changes');
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
      
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to update metadata', {
        context: 'OfflineStorage.updateMetadata'
      });
    }
  }

  private async getMetadata(): Promise<StorageMetadata> {
    try {
      const data = localStorage.getItem(this.METADATA_KEY);
      if (!data) {
        return {
          version: this.VERSION,
          lastSync: new Date().toISOString(),
          pendingChanges: []
        };
      }
      return JSON.parse(data);
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
    
    // Save migrated data
    localStorage.setItem(this.ALARMS_KEY, JSON.stringify(migrated));
    
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
        localStorage.setItem(this.PENDING_CHANGES_KEY, JSON.stringify(data.pendingChanges));
        console.log('[OfflineStorage] Imported', data.pendingChanges.length, 'pending changes');
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
      localStorage.removeItem(this.ALARMS_KEY);
      localStorage.removeItem(this.METADATA_KEY);
      localStorage.removeItem(this.PENDING_CHANGES_KEY);
      
      console.log('[OfflineStorage] Cleared all data');
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to clear all data', {
        context: 'OfflineStorage.clearAllData'
      });
      throw error;
    }
  }
}

export default OfflineStorage.getInstance();