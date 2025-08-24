/// <reference lib="dom" />
// import ... from 'idb'; // Package not available in current setup
import { supabase } from './supabase';
import type { Alarm } from '../types';
import { TimeoutHandle } from '../types/timers';

interface OfflineDB extends DBSchema {
  alarms: {
    key: string;
    value: Alarm & {
      syncStatus: 'pending' | 'synced' | 'failed';
      lastModified: number;
      operation: 'create' | 'update' | 'delete';
    };
  };
  voiceCache: {
    key: string;
    value: {
      id: string;
      alarmId: string;
      voiceMood: string;
      audioBlob: Blob;
      text: string;
      duration: number;
      createdAt: number;
      expiresAt: number;
    };
  };
  sleepSessions: {
    key: string;
    value: {
      id: string;
      userId: string;
      bedtime: number;
      wakeTime: number;
      sleepDuration: number;
      sleepQuality: number;
      createdAt: number;
      syncStatus: 'pending' | 'synced' | 'failed';
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: 'alarm' | 'sleep' | 'voice';
      operation: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
      retryCount: number;
      lastError?: string;
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: any;
      lastModified: number;
      syncStatus: 'pending' | 'synced' | 'failed';
    };
  };
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingOperations: number;
  failedOperations: number;
  syncInProgress: boolean;
}

export interface OfflineCapabilities {
  alarmProcessing: boolean;
  voicePlayback: boolean;
  dataStorage: boolean;
  backgroundSync: boolean;
  serviceWorker: boolean;
}

export class OfflineManager {
  private static db: IDBPDatabase<OfflineDB> | null = null;
  private static isInitialized = false;
  private static syncInProgress = false;
  private static onlineListeners: (() => void)[] = [];
  private static offlineListeners: (() => void)[] = [];

  static async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Initialize IndexedDB
      this.db = await openDB<OfflineDB>('RelifeOfflineDB', 1, {
        upgrade(db) {
          // Alarms store
          if (!db.objectStoreNames.contains('alarms')) {
            const alarmStore = db.createObjectStore('alarms', { keyPath: 'id' });
            alarmStore.createIndex('syncStatus', 'syncStatus');
            alarmStore.createIndex('lastModified', 'lastModified');
          }

          // Voice cache store
          if (!db.objectStoreNames.contains('voiceCache')) {
            const voiceStore = db.createObjectStore('voiceCache', { keyPath: 'id' });
            voiceStore.createIndex('alarmId', 'alarmId');
            voiceStore.createIndex('expiresAt', 'expiresAt');
          }

          // Sleep sessions store
          if (!db.objectStoreNames.contains('sleepSessions')) {
            const sleepStore = db.createObjectStore('sleepSessions', { keyPath: 'id' });
            sleepStore.createIndex('syncStatus', 'syncStatus');
            sleepStore.createIndex('createdAt', 'createdAt');
          }

          // Sync queue store
          if (!db.objectStoreNames.contains('syncQueue')) {
            const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
            syncStore.createIndex('type', 'type');
            syncStore.createIndex('timestamp', 'timestamp');
          }

          // Settings store
          if (!db.objectStoreNames.contains('settings')) {
            const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
            settingsStore.createIndex('syncStatus', 'syncStatus');
          }
        },
      });

      // Register service worker
      await this.registerServiceWorker();

      // Set up online/offline listeners
      this.setupNetworkListeners();

      // Schedule periodic sync
      this.schedulePeriodicSync();

      // Clean up expired data
      await this.cleanupExpiredData();

      this.isInitialized = true;
      console.log('Offline manager initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize offline manager:', error);
      return false;
    }
  }

  private static async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      // Use existing registration from ServiceWorkerManager instead of registering again
      const registration =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register('/sw-unified.js'));
      console.log('Service Worker registered:', registration);

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', event => {
        this.handleServiceWorkerMessage(event.data);
      });

      // Request background sync permission
      if ('sync' in window.ServiceWorkerRegistration.prototype) {
        await registration.sync.register('background-sync');
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  private static setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('Network: Online');
      this.onlineListeners.forEach(listener => listener());
      this.syncWhenOnline();
    });

    window.addEventListener('offline', () => {
      console.log('Network: Offline');
      this.offlineListeners.forEach(listener => listener());
    });
  }

  private static schedulePeriodicSync(): void {
    // Sync every 5 minutes when online
    setInterval(
      async () => {
        if (navigator.onLine) {
          await this.syncPendingOperations();
        }
      },
      5 * 60 * 1000
    );
  }

  // Alarm management
  static async saveAlarmOffline(
    alarm: Alarm,
    operation: 'create' | 'update' | 'delete' = 'create'
  ): Promise<void> {
    if (!this.db) throw new Error('Offline manager not initialized');

    const offlineAlarm = {
      ...alarm,
      syncStatus: 'pending' as const,
      lastModified: Date.now(),
      operation,
    };

    await this.db.put('alarms', offlineAlarm);

    // Add to sync queue
    await this.addToSyncQueue('alarm', operation, alarm);

    console.log(`Alarm ${operation} saved offline:`, alarm.id);
  }

  static async getAlarmsOffline(): Promise<Alarm[]> {
    if (!this.db) return [];

    try {
      const alarms = await this.db.getAll('alarms');
      return alarms
        .filter((alarm: any) => a // auto: implicit anylarm.operation !== 'delete')
        .map(({ syncStatus, lastModified, operation, ...alarm }) => alarm as Alarm);
    } catch (error) {
      console.error('Failed to get offline alarms:', error);
      return [];
    }
  }

  static async getAlarmOffline(id: string): Promise<Alarm | null> {
    if (!this.db) return null;

    try {
      const alarm = await this.db.get('alarms', id);
      if (alarm && alarm.operation !== 'delete') {
        const { syncStatus, lastModified, operation, ...alarmData } = alarm;
        return alarmData as Alarm;
      }
      return null;
    } catch (error) {
      console.error('Failed to get offline alarm:', error);
      return null;
    }
  }

  // Voice caching
  static async cacheVoiceMessage(
    id: string,
    alarmId: string,
    voiceMood: string,
    audioBlob: Blob,
    text: string,
    duration: number,
    ttlHours: number = 24
  ): Promise<void> {
    if (!this.db) throw new Error('Offline manager not initialized');

    const cached = {
      id,
      alarmId,
      voiceMood,
      audioBlob,
      text,
      duration,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlHours * 60 * 60 * 1000,
    };

    await this.db.put('voiceCache', cached);
    console.log(`Voice message cached: ${id}`);
  }

  static async getCachedVoiceMessage(
    alarmId: string,
    voiceMood: string
  ): Promise<{
    audioBlob: Blob;
    text: string;
    duration: number;
  } | null> {
    if (!this.db) return null;

    try {
      const tx = this.db.transaction('voiceCache', 'readonly');
      const index = tx.store.index('alarmId');
      const messages = await index.getAll(alarmId);

      const validMessage = messages.find(
        msg => msg.voiceMood === voiceMood && msg.expiresAt > Date.now()
      );

      if (validMessage) {
        return {
          audioBlob: validMessage.audioBlob,
          text: validMessage.text,
          duration: validMessage.duration,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to get cached voice message:', error);
      return null;
    }
  }

  // Sync queue management
  private static async addToSyncQueue(
    type: 'alarm' | 'sleep' | 'voice',
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    if (!this.db) return;

    const queueItem = {
      id: this.generateId(),
      type,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await this.db.put('syncQueue', queueItem);
  }

  static async syncPendingOperations(): Promise<void> {
    if (!this.db || this.syncInProgress || !navigator.onLine) return;

    this.syncInProgress = true;
    console.log('Starting sync of pending operations...');

    try {
      const queueItems = await this.db.getAll('syncQueue');
      const sortedItems = queueItems.sort((a, b) => a.timestamp - b.timestamp);

      for (const item of sortedItems) {
        try {
          await this.syncItem(item);
          await this.db.delete('syncQueue', item.id);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);

          // Update retry count
          item.retryCount++;
          item.lastError = error instanceof Error ? error.message : 'Unknown error';

          // Remove after 5 failed attempts
          if (item.retryCount >= 5) {
            await this.db.delete('syncQueue', item.id);
            console.log(`Removed failed sync item after 5 attempts: ${item.id}`);
          } else {
            await this.db.put('syncQueue', item);
          }
        }
      }

      console.log('Sync completed');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private static async syncItem(item: any): Promise<void> {
    switch (item.type) {
      case 'alarm':
        await this.syncAlarmItem(item);
        break;
      case 'sleep':
        await this.syncSleepItem(item);
        break;
      case 'voice':
        await this.syncVoiceItem(item);
        break;
      default:
        throw new Error(`Unknown sync item type: ${item.type}`);
    }
  }

  private static async syncAlarmItem(item: any): Promise<void> {
    const { operation, data } = item;

    switch (operation) {
      case 'create':
        await supabase.from('alarms').insert(data);
        break;
      case 'update':
        await supabase.from('alarms').update(data).eq('id', data.id);
        break;
      case 'delete':
        await supabase.from('alarms').delete().eq('id', data.id);
        break;
    }

    // Update sync status in local storage
    if (this.db && (operation === 'create' || operation === 'update')) {
      const localAlarm = await this.db.get('alarms', data.id);
      if (localAlarm) {
        localAlarm.syncStatus = 'synced';
        await this.db.put('alarms', localAlarm);
      }
    }
  }

  private static async syncSleepItem(item: any): Promise<void> {
    const { operation, data } = item;

    switch (operation) {
      case 'create':
        await supabase.from('sleep_sessions').insert(data);
        break;
      case 'update':
        await supabase.from('sleep_sessions').update(data).eq('id', data.id);
        break;
      case 'delete':
        await supabase.from('sleep_sessions').delete().eq('id', data.id);
        break;
    }
  }

  private static async syncVoiceItem(item: any): Promise<void> {
    // Voice items are typically cached locally and don't need server sync
    // unless we're implementing cloud voice storage
    console.log('Voice item sync not implemented yet');
  }

  private static async syncWhenOnline(): Promise<void> {
    // Trigger sync when coming back online
    setTimeout(() => {
      this.syncPendingOperations();
    }, 1000); // Wait 1 second for network to stabilize
  }

  // Settings management
  static async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Offline manager not initialized');

    const setting = {
      key,
      value,
      lastModified: Date.now(),
      syncStatus: 'pending' as const,
    };

    await this.db.put('settings', setting);

    // Add to sync queue for cloud backup
    await this.addToSyncQueue('alarm', 'update', { key, value });

    // Also save to localStorage for immediate access
    localStorage.setItem(key, JSON.stringify(value));
  }

  static async getSetting(key: string): Promise<any> {
    // Try localStorage first for speed
    const localValue = localStorage.getItem(key);
    if (localValue) {
      try {
        return JSON.parse(localValue);
      } catch (error) {
        console.error('Failed to parse local setting:', error);
      }
    }

    // Fallback to IndexedDB
    if (this.db) {
      try {
        const setting = await this.db.get('settings', key);
        return setting?.value;
      } catch (error) {
        console.error('Failed to get setting from IndexedDB:', error);
      }
    }

    return null;
  }

  // Cleanup and maintenance
  private static async cleanupExpiredData(): Promise<void> {
    if (!this.db) return;

    try {
      const now = Date.now();

      // Clean expired voice cache
      const tx = this.db.transaction('voiceCache', 'readwrite');
      const index = tx.store.index('expiresAt');
      const expiredVoices = await index.getAll(IDBKeyRange.upperBound(now));

      for (const expired of expiredVoices) {
        await tx.store.delete(expired.id);
      }

      console.log(`Cleaned up ${expiredVoices.length} expired voice messages`);
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }

  // Status and capabilities
  static async getStatus(): Promise<SyncStatus> {
    const pendingOperations = this.db ? await this.db.count('syncQueue') : 0;
    const failedOperations = this.db
      ? (await this.db.getAll('syncQueue')).filter((item: any) => i // auto: implicit anytem.retryCount > 0).length
      : 0;

    return {
      isOnline: navigator.onLine,
      lastSync: null, // Would track actual last sync time
      pendingOperations,
      failedOperations,
      syncInProgress: this.syncInProgress,
    };
  }

  static getCapabilities(): OfflineCapabilities {
    return {
      alarmProcessing: true,
      voicePlayback: !!this.db,
      dataStorage: !!this.db,
      backgroundSync:
        'serviceWorker' in navigator &&
        'sync' in window.ServiceWorkerRegistration.prototype,
      serviceWorker: 'serviceWorker' in navigator,
    };
  }

  // Event listeners
  static addOnlineListener(callback: () => void): void {
    this.onlineListeners.push(callback);
  }

  static addOfflineListener(callback: () => void): void {
    this.offlineListeners.push(callback);
  }

  static removeOnlineListener(callback: () => void): void {
    const index = this.onlineListeners.indexOf(callback);
    if (index > -1) {
      this.onlineListeners.splice(index, 1);
    }
  }

  static removeOfflineListener(callback: () => void): void {
    const index = this.offlineListeners.indexOf(callback);
    if (index > -1) {
      this.offlineListeners.splice(index, 1);
    }
  }

  // Service worker communication
  private static handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'ALARM_TRIGGER':
        // Handle alarm trigger from service worker
        this.handleBackgroundAlarm(data.alarm);
        break;
      case 'SYNC_COMPLETE':
        console.log('Background sync completed');
        break;
      case 'CACHE_UPDATED':
        console.log('App cache updated');
        break;
    }
  }

  private static handleBackgroundAlarm(alarm: Alarm): void {
    // This would trigger the alarm UI even when app is in background
    console.log('Background alarm triggered:', alarm);

    // Post message to main thread if available
    if (typeof window !== 'undefined' && window.postMessage) {
      window.postMessage(
        {
          type: 'BACKGROUND_ALARM',
          alarm,
        },
        window.location.origin
      );
    }
  }

  // Utility methods
  private static generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Bulk operations
  static async exportData(): Promise<{
    alarms: any[];
    sleepSessions: any[];
    settings: any[];
    voiceCache: any[];
  }> {
    if (!this.db) throw new Error('Offline manager not initialized');

    const [alarms, sleepSessions, settings, voiceCache] = await Promise.all([
      this.db.getAll('alarms'),
      this.db.getAll('sleepSessions'),
      this.db.getAll('settings'),
      this.db.getAll('voiceCache'),
    ]);

    return {
      alarms,
      sleepSessions,
      settings,
      voiceCache: voiceCache.map(({ audioBlob, ...rest }) => rest), // Exclude blobs for export
    };
  }

  static async importData(data: {
    alarms?: any[];
    sleepSessions?: any[];
    settings?: any[];
  }): Promise<void> {
    if (!this.db) throw new Error('Offline manager not initialized');

    const tx = this.db.transaction(
      ['alarms', 'sleepSessions', 'settings'],
      'readwrite'
    );

    if (data.alarms) {
      for (const alarm of data.alarms) {
        await tx.objectStore('alarms').put(alarm);
      }
    }

    if (data.sleepSessions) {
      for (const session of data.sleepSessions) {
        await tx.objectStore('sleepSessions').put(session);
      }
    }

    if (data.settings) {
      for (const setting of data.settings) {
        await tx.objectStore('settings').put(setting);
      }
    }

    await tx.done;
    console.log('Data import completed');
  }

  static async clearAllData(): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(
      ['alarms', 'sleepSessions', 'settings', 'voiceCache', 'syncQueue'],
      'readwrite'
    );

    await Promise.all([
      tx.objectStore('alarms').clear(),
      tx.objectStore('sleepSessions').clear(),
      tx.objectStore('settings').clear(),
      tx.objectStore('voiceCache').clear(),
      tx.objectStore('syncQueue').clear(),
    ]);

    await tx.done;
    console.log('All offline data cleared');
  }
}

export default OfflineManager;
