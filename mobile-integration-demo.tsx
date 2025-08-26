/**
 * Mobile Storage Integration Demo
 * Shows how to use your existing IndexedDB + Capacitor storage in mobile apps
 */

import React, { useEffect, useState } from 'react';
import { MobileStorageService } from './src/services/mobile-storage';
import { UnifiedStorageService } from './src/services/unified-storage';
import type { Alarm } from './src/types/domain';

export function MobileStorageDemo() {
  const [mobileStorage] = useState(() => MobileStorageService.getInstance());
  const [unifiedStorage] = useState(() => UnifiedStorageService.getInstance());
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeMobileStorage();
  }, []);

  const initializeMobileStorage = async () => {
    try {
      // Initialize mobile storage with optimizations
      await mobileStorage.initializeMobile({
        enableNativePreferences: true, // Backup critical data to native storage
        syncOnResume: true, // Sync when app resumes
        compressionEnabled: true, // Compress data for mobile
        batchSize: 50, // Mobile-optimized batch size
      });

      // Load storage information
      const info = await mobileStorage.getMobileStorageInfo();
      setStorageInfo(info);

      // Load alarms with mobile optimizations
      const enabledAlarms = await mobileStorage.getEnabledAlarmsWithFallback();
      setAlarms(enabledAlarms);

      console.log('Mobile storage initialized:', info);
    } catch (error) {
      console.error('Failed to initialize mobile storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAlarmMobile = async (alarm: Alarm) => {
    try {
      // This automatically:
      // - Saves to IndexedDB (with type safety from idb package)
      // - Backs up to native Capacitor Preferences if alarm is enabled
      // - Handles fallbacks if main storage fails
      await mobileStorage.saveAlarmOptimized(alarm);

      // Refresh the list
      const updatedAlarms = await mobileStorage.getEnabledAlarmsWithFallback();
      setAlarms(updatedAlarms);
    } catch (error) {
      console.error('Failed to save alarm:', error);
      // Could show user-friendly error message
    }
  };

  const performMobileSync = async () => {
    try {
      // Check storage health
      const health = await unifiedStorage.checkStorageHealth();

      if (!health.isHealthy) {
        console.warn('Storage issues detected:', health.issues);

        // Perform maintenance
        await unifiedStorage.performMaintenance();
      }

      // Sync pending changes (when network is available)
      const pendingChanges = await unifiedStorage.getPendingChanges();
      console.log(`${pendingChanges.length} changes pending sync`);

      // Your server sync logic would go here
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const clearMobileCache = async () => {
    try {
      // Clear cache intelligently based on mobile constraints
      await unifiedStorage.clearCache(['temp', 'preview', 'images']);
      console.log('Mobile cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  if (loading) {
    return <div>Initializing mobile storage...</div>;
  }

  return (
    <div className="mobile-storage-demo">
      <h2>Mobile Storage Integration Demo</h2>

      {/* Storage Information */}
      <div className="storage-info">
        <h3>Storage Status</h3>
        <p>Platform: {storageInfo?.deviceCapabilities?.platform}</p>
        <p>Native Platform: {storageInfo?.nativeStorageAvailable ? 'Yes' : 'No'}</p>
        <p>Storage Type: {storageInfo?.storageStats?.storageType}</p>
        <p>Total Alarms: {storageInfo?.storageStats?.alarms}</p>
        <p>Native Backup Count: {storageInfo?.criticalAlarmsCount}</p>
        <p>Network: {storageInfo?.networkStatus?.connected ? 'Online' : 'Offline'}</p>

        {storageInfo?.deviceCapabilities?.memoryWarning && (
          <div style={{ color: 'orange' }}>
            ⚠️ Memory warning detected - optimizations active
          </div>
        )}
      </div>

      {/* Alarms List */}
      <div className="alarms-section">
        <h3>Enabled Alarms ({alarms.length})</h3>
        {alarms.map(alarm => (
          <div key={alarm.id} className="alarm-item">
            <span>
              {alarm.title} - {alarm.time}
            </span>
            <button
              onClick={() => {
                // Update alarm example
                const updatedAlarm = { ...alarm, title: alarm.title + ' (Updated)' };
                saveAlarmMobile(updatedAlarm);
              }}
            >
              Update
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="actions">
        <button
          onClick={() => {
            const newAlarm: Alarm = {
              id: `alarm-${Date.now()}`,
              title: 'Mobile Test Alarm',
              time: '09:00',
              enabled: true,
              userId: 'test-user',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            saveAlarmMobile(newAlarm);
          }}
        >
          Add Test Alarm
        </button>

        <button onClick={performMobileSync}>Sync Storage</button>

        <button onClick={clearMobileCache}>Clear Cache</button>

        <button
          onClick={async () => {
            // Force sync critical data to native storage
            const criticalAlarms = await mobileStorage.getCriticalAlarmsFromNative();
            console.log('Critical alarms in native storage:', criticalAlarms);
          }}
        >
          Check Native Backup
        </button>
      </div>

      {/* Mobile-specific optimizations display */}
      <div className="optimizations">
        <h3>Mobile Optimizations Active</h3>
        <ul>
          <li>✅ IndexedDB with type safety (idb package)</li>
          <li>✅ Native storage backup for critical alarms</li>
          <li>✅ App lifecycle integration (pause/resume)</li>
          <li>✅ Network status monitoring</li>
          <li>✅ Memory warning handling</li>
          <li>✅ Intelligent cache management</li>
          <li>✅ Batch operations for performance</li>
          <li>✅ Multi-layer fallback strategy</li>
        </ul>
      </div>
    </div>
  );
}

// Hook for using mobile storage in components
export function useMobileStorage() {
  const [mobileStorage] = useState(() => MobileStorageService.getInstance());
  const [unifiedStorage] = useState(() => UnifiedStorageService.getInstance());

  return {
    // Mobile-optimized operations
    saveAlarmOptimized: (alarm: Alarm) => mobileStorage.saveAlarmOptimized(alarm),
    getAlarmsWithFallback: () => mobileStorage.getEnabledAlarmsWithFallback(),

    // Storage management
    getStorageInfo: () => mobileStorage.getMobileStorageInfo(),
    performMaintenance: () => unifiedStorage.performMaintenance(),
    checkHealth: () => unifiedStorage.checkStorageHealth(),

    // Cache operations
    clearCache: (tags?: string[]) => unifiedStorage.clearCache(tags),
    setCache: <T,>(key: string, data: T, ttl?: number, tags?: string[]) =>
      unifiedStorage.setCache(key, data, ttl, tags),
    getCache: <T,>(key: string) => unifiedStorage.getCache<T>(key),

    // Native storage integration
    getCriticalAlarms: () => mobileStorage.getCriticalAlarmsFromNative(),

    // Configuration
    updateConfig: (config: any) => mobileStorage.updateConfig(config),
  };
}

export default MobileStorageDemo;
