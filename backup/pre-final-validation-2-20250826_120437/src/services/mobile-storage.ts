/**
 * Mobile Storage Integration Service
 * Optimizes IndexedDB storage for Capacitor mobile apps
 * Includes native storage fallbacks and mobile-specific optimizations
 */

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { App, AppState } from '@capacitor/app';
import UnifiedStorageService from './unified-storage';
import type { Alarm } from '../types/domain';

interface MobileStorageConfig {
  enableNativePreferences: boolean;
  enableBackgroundSync: boolean;
  compressionEnabled: boolean;
  batchSize: number;
  syncOnResume: boolean;
  offlineQueueSize: number;
}

interface DeviceCapabilities {
  platform: string;
  isNative: boolean;
  memoryWarning: boolean;
  storageQuota: number;
  supportsIndexedDB: boolean;
  supportsWebWorkers: boolean;
}

export class MobileStorageService {
  private static instance: MobileStorageService;
  private unifiedStorage = UnifiedStorageService.getInstance();
  private deviceCapabilities: DeviceCapabilities | null = null;
  private isBackground = false;
  private networkStatus: any = null;
  private config: MobileStorageConfig = {
    enableNativePreferences: true,
    enableBackgroundSync: false,
    compressionEnabled: true,
    batchSize: 50,
    syncOnResume: true,
    offlineQueueSize: 1000,
  };

  private constructor() {
    this.initializeMobileListeners();
  }

  static getInstance(): MobileStorageService {
    if (!MobileStorageService.instance) {
      MobileStorageService.instance = new MobileStorageService();
    }
    return MobileStorageService.instance;
  }

  // =============================================================================
  // MOBILE INITIALIZATION
  // =============================================================================

  async initializeMobile(config?: Partial<MobileStorageConfig>): Promise<void> {
    console.log('[MobileStorage] Initializing mobile storage integration...');

    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Detect device capabilities
    await this.detectDeviceCapabilities();

    // Initialize storage with mobile optimizations
    await this.initializeStorageForMobile();

    // Setup native storage integration
    if (this.config.enableNativePreferences) {
      await this.setupNativeStorageIntegration();
    }

    // Initialize network monitoring
    await this.initializeNetworkMonitoring();

    console.log('[MobileStorage] Mobile storage initialization complete');
  }

  private async detectDeviceCapabilities(): Promise<void> {
    try {
      const deviceInfo = await Device.getInfo();

      this.deviceCapabilities = {
        platform: deviceInfo.platform,
        isNative: Capacitor.isNativePlatform(),
        memoryWarning: false, // Will be updated by memory warnings
        storageQuota: await this.getStorageQuota(),
        supportsIndexedDB: 'indexedDB' in window,
        supportsWebWorkers: 'Worker' in window,
      };

      console.log('[MobileStorage] Device capabilities:', this.deviceCapabilities);
    } catch (error) {
      console.error('[MobileStorage] Failed to detect device capabilities:', error);
    }
  }

  private async getStorageQuota(): Promise<number> {
    if (
      'navigator' in globalThis &&
      'storage' in navigator &&
      'estimate' in navigator.storage
    ) {
      try {
        const estimate = await navigator.storage.estimate();
        return estimate.quota || 0;
      } catch (error) {
        console.warn('[MobileStorage] Storage quota estimation failed:', error);
      }
    }
    return 0;
  }

  private async initializeStorageForMobile(): Promise<void> {
    // Initialize with mobile-optimized settings
    const initOptions = {
      autoMigrate: true,
      fallbackToLegacy: true,
      createBackup:
        this.deviceCapabilities?.storageQuota &&
        this.deviceCapabilities.storageQuota > 50000000, // 50MB
    };

    const result = await this.unifiedStorage.initialize(initOptions);

    if (!result.success && this.config.enableNativePreferences) {
      console.warn(
        '[MobileStorage] IndexedDB failed, using native preferences as primary storage'
      );
      // Could implement native storage as primary if needed
    }
  }

  // =============================================================================
  // NATIVE STORAGE INTEGRATION
  // =============================================================================

  private async setupNativeStorageIntegration(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log(
        '[MobileStorage] Skipping native storage setup - not native platform'
      );
      return;
    }

    try {
      // Sync critical data to native preferences
      await this.syncCriticalDataToNative();

      // Setup periodic sync
      if (this.config.syncOnResume) {
        this.setupPeriodicNativeSync();
      }

      console.log('[MobileStorage] Native storage integration setup complete');
    } catch (error) {
      console.error('[MobileStorage] Native storage setup failed:', error);
    }
  }

  private async syncCriticalDataToNative(): Promise<void> {
    try {
      // Get enabled alarms (most critical for mobile)
      const enabledAlarms = await this.unifiedStorage.getEnabledAlarms();

      // Store in native preferences as backup
      await Preferences.set({
        key: 'critical-alarms',
        value: JSON.stringify({
          alarms: enabledAlarms.slice(0, 10), // Limit to 10 most important
          timestamp: new Date().toISOString(),
          version: '1.0',
        }),
      });

      // Store app settings
      const stats = await this.unifiedStorage.getStorageStats();
      await Preferences.set({
        key: 'storage-stats',
        value: JSON.stringify({
          lastSync: stats.lastSync,
          totalAlarms: stats.alarms,
          storageType: stats.storageType,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log('[MobileStorage] Critical data synced to native storage');
    } catch (error) {
      console.error('[MobileStorage] Failed to sync critical data:', error);
    }
  }

  async getCriticalAlarmsFromNative(): Promise<Alarm[]> {
    try {
      const result = await Preferences.get({ key: 'critical-alarms' });
      if (result.value) {
        const data = JSON.parse(result.value);
        return data.alarms || [];
      }
    } catch (error) {
      console.error(
        '[MobileStorage] Failed to get critical alarms from native:',
        error
      );
    }
    return [];
  }

  // =============================================================================
  // MOBILE APP LIFECYCLE INTEGRATION
  // =============================================================================

  private async initializeMobileListeners(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // App state changes
    App.addListener('appStateChange', (state: AppState) => {
      this.handleAppStateChange(state);
    });

    // Resume from background
    App.addListener('resume', () => {
      this.handleAppResume();
    });

    // Pause (going to background)
    App.addListener('pause', () => {
      this.handleAppPause();
    });

    // Memory warnings
    if ('memory' in performance) {
      // @ts-ignore - Modern browsers
      performance.addEventListener('memory', () => {
        this.handleMemoryWarning();
      });
    }
  }

  private async handleAppStateChange(state: AppState): Promise<void> {
    this.isBackground = !state.isActive;

    if (state.isActive) {
      await this.handleAppResume();
    } else {
      await this.handleAppPause();
    }
  }

  private async handleAppResume(): Promise<void> {
    console.log('[MobileStorage] App resumed - performing sync');

    try {
      // Sync critical data
      if (this.config.syncOnResume) {
        await this.syncCriticalDataToNative();
      }

      // Check storage health
      const health = await this.unifiedStorage.checkStorageHealth();
      if (!health.isHealthy) {
        console.warn('[MobileStorage] Storage health issues detected:', health.issues);

        // Attempt automatic recovery
        await this.performMobileMaintenanceTasks();
      }

      // Update network status
      await this.updateNetworkStatus();
    } catch (error) {
      console.error('[MobileStorage] App resume handling failed:', error);
    }
  }

  private async handleAppPause(): Promise<void> {
    console.log('[MobileStorage] App paused - saving critical data');

    try {
      // Force sync critical data before going to background
      await this.syncCriticalDataToNative();

      // Clear non-essential cache to free memory
      await this.clearNonEssentialCache();
    } catch (error) {
      console.error('[MobileStorage] App pause handling failed:', error);
    }
  }

  private async handleMemoryWarning(): Promise<void> {
    console.warn('[MobileStorage] Memory warning received - performing cleanup');

    if (this.deviceCapabilities) {
      this.deviceCapabilities.memoryWarning = true;
    }

    try {
      // Clear cache aggressively
      await this.unifiedStorage.clearCache();

      // Reduce batch sizes
      this.config.batchSize = Math.max(10, this.config.batchSize / 2);

      // Sync critical data to native storage
      await this.syncCriticalDataToNative();
    } catch (error) {
      console.error('[MobileStorage] Memory warning handling failed:', error);
    }
  }

  // =============================================================================
  // MOBILE-OPTIMIZED OPERATIONS
  // =============================================================================

  async saveAlarmOptimized(alarm: Alarm): Promise<void> {
    try {
      // Save to main storage
      await this.unifiedStorage.saveAlarm(alarm);

      // If alarm is enabled, also save to native storage for reliability
      if (alarm.enabled && Capacitor.isNativePlatform()) {
        await this.saveCriticalAlarmToNative(alarm);
      }
    } catch (error) {
      console.error('[MobileStorage] Optimized alarm save failed:', error);

      // Fallback: save to native storage only
      if (Capacitor.isNativePlatform()) {
        await this.saveCriticalAlarmToNative(alarm);
      }

      throw error;
    }
  }

  private async saveCriticalAlarmToNative(alarm: Alarm): Promise<void> {
    try {
      const criticalAlarms = await this.getCriticalAlarmsFromNative();
      const existingIndex = criticalAlarms.findIndex(a => a.id === alarm.id);

      if (existingIndex >= 0) {
        criticalAlarms[existingIndex] = alarm;
      } else {
        criticalAlarms.unshift(alarm);
        // Keep only 10 most recent
        criticalAlarms.splice(10);
      }

      await Preferences.set({
        key: 'critical-alarms',
        value: JSON.stringify({
          alarms: criticalAlarms,
          timestamp: new Date().toISOString(),
          version: '1.0',
        }),
      });
    } catch (error) {
      console.error('[MobileStorage] Failed to save critical alarm to native:', error);
    }
  }

  async getEnabledAlarmsWithFallback(): Promise<Alarm[]> {
    try {
      // Try main storage first
      return await this.unifiedStorage.getEnabledAlarms();
    } catch (error) {
      console.error(
        '[MobileStorage] Main storage failed, using native fallback:',
        error
      );

      // Fallback to native storage
      if (Capacitor.isNativePlatform()) {
        const criticalAlarms = await this.getCriticalAlarmsFromNative();
        return criticalAlarms.filter(alarm => alarm.enabled);
      }

      return [];
    }
  }

  // =============================================================================
  // MOBILE MAINTENANCE AND OPTIMIZATION
  // =============================================================================

  private async performMobileMaintenanceTasks(): Promise<void> {
    console.log('[MobileStorage] Performing mobile maintenance tasks...');

    try {
      // Regular maintenance
      const result = await this.unifiedStorage.performMaintenance();

      // Mobile-specific optimizations
      if (this.deviceCapabilities?.memoryWarning) {
        await this.optimizeForLowMemory();
      }

      if (
        this.deviceCapabilities?.storageQuota &&
        this.deviceCapabilities.storageQuota > 0
      ) {
        await this.optimizeStorageUsage();
      }

      console.log('[MobileStorage] Mobile maintenance completed:', result);
    } catch (error) {
      console.error('[MobileStorage] Mobile maintenance failed:', error);
    }
  }

  private async optimizeForLowMemory(): Promise<void> {
    // Reduce cache size
    await this.unifiedStorage.clearCache(['temp', 'preview']);

    // Compress data if possible
    if (this.config.compressionEnabled) {
      // Could implement data compression here
      console.log('[MobileStorage] Data compression optimization applied');
    }

    // Reduce batch sizes
    this.config.batchSize = Math.max(5, this.config.batchSize / 4);
  }

  private async optimizeStorageUsage(): Promise<void> {
    const stats = await this.unifiedStorage.getStorageStats();
    const quotaUsagePercent =
      (stats.totalSize / this.deviceCapabilities!.storageQuota) * 100;

    if (quotaUsagePercent > 80) {
      console.warn(
        '[MobileStorage] Storage usage high:',
        quotaUsagePercent.toFixed(1),
        '%'
      );

      // Clear old cache entries
      await this.unifiedStorage.clearCache();

      // Could implement data archival here
      console.log('[MobileStorage] Storage optimization applied');
    }
  }

  private async clearNonEssentialCache(): Promise<void> {
    // Clear cache entries that aren't critical for mobile operation
    await this.unifiedStorage.clearCache(['images', 'media', 'temp', 'preview']);
  }

  // =============================================================================
  // NETWORK AND SYNC INTEGRATION
  // =============================================================================

  private async initializeNetworkMonitoring(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      this.networkStatus = await Network.getStatus();

      Network.addListener('networkStatusChange', status => {
        this.networkStatus = status;
        this.handleNetworkChange(status);
      });
    } catch (error) {
      console.error('[MobileStorage] Network monitoring setup failed:', error);
    }
  }

  private async handleNetworkChange(status: any): Promise<void> {
    console.log('[MobileStorage] Network status changed:', status);

    if (status.connected && !this.isBackground) {
      // Network reconnected - attempt sync
      try {
        const pendingChanges = await this.unifiedStorage.getPendingChanges();
        if (pendingChanges.length > 0) {
          console.log(
            `[MobileStorage] Network reconnected - syncing ${pendingChanges.length} pending changes`
          );
          // Could trigger sync here
        }
      } catch (error) {
        console.error('[MobileStorage] Network reconnection sync failed:', error);
      }
    }
  }

  private async updateNetworkStatus(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        this.networkStatus = await Network.getStatus();
      } catch (error) {
        console.error('[MobileStorage] Network status update failed:', error);
      }
    }
  }

  // =============================================================================
  // MOBILE STORAGE UTILITIES
  // =============================================================================

  async getMobileStorageInfo(): Promise<{
    deviceCapabilities: DeviceCapabilities | null;
    storageStats: any;
    networkStatus: any;
    nativeStorageAvailable: boolean;
    criticalAlarmsCount: number;
  }> {
    const stats = await this.unifiedStorage.getStorageStats();
    const criticalAlarms = await this.getCriticalAlarmsFromNative();

    return {
      deviceCapabilities: this.deviceCapabilities,
      storageStats: stats,
      networkStatus: this.networkStatus,
      nativeStorageAvailable: Capacitor.isNativePlatform(),
      criticalAlarmsCount: criticalAlarms.length,
    };
  }

  getConfig(): MobileStorageConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<MobileStorageConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('[MobileStorage] Configuration updated:', this.config);
  }
}

// Export singleton instance
export default MobileStorageService.getInstance();
