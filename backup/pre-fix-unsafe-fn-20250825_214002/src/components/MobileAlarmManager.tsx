/**
 * Mobile Alarm Manager Component
 * Demonstrates mobile-optimized alarm operations with IndexedDB + Capacitor integration
 */

import React, { useEffect, useState, useCallback } from 'react';
import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { MobileStorageService } from '../services/mobile-storage';
import { UnifiedStorageService } from '../services/unified-storage';
import type { Alarm } from '../types/domain';

interface StorageStatus {
  isHealthy: boolean;
  storageType: 'indexeddb' | 'localstorage';
  totalAlarms: number;
  nativeBackupCount: number;
  networkStatus: 'online' | 'offline';
  memoryOptimized: boolean;
}

export function MobileAlarmManager() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mobileStorage = MobileStorageService.getInstance();
  const unifiedStorage = UnifiedStorageService.getInstance();

  // Initialize mobile storage and set up listeners
  useEffect(() => {
    initializeMobileAlarmManager();
    setupMobileListeners();
    
    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  const initializeMobileAlarmManager = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize mobile storage with optimized settings
      await mobileStorage.initializeMobile({
        enableNativePreferences: true,
        syncOnResume: true,
        compressionEnabled: true,
        batchSize: 30, // Smaller batch for alarms
        offlineQueueSize: 500,
      });

      // Load alarms with fallback support
      await loadAlarms();
      
      // Update storage status
      await updateStorageStatus();

      console.log('Mobile alarm manager initialized successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize mobile storage');
      console.error('Mobile alarm manager initialization failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupMobileListeners = () => {
    // Listen for app state changes
    App.addListener('appStateChange', (state) => {
      if (state.isActive) {
        handleAppResume();
      }
    });

    // Listen for network changes
    Network.addListener('networkStatusChange', (status) => {
      handleNetworkChange(status.connected);
    });
  };

  const loadAlarms = async () => {
    try {
      // Use mobile-optimized method with automatic fallback
      const enabledAlarms = await mobileStorage.getEnabledAlarmsWithFallback();
      setAlarms(enabledAlarms);
    } catch (err) {
      console.error('Failed to load alarms:', err);
      
      // Try to load from native backup as last resort
      try {
        const backupAlarms = await mobileStorage.getCriticalAlarmsFromNative();
        setAlarms(backupAlarms.filter(alarm => alarm.enabled));
        setError('Loaded from backup - some data may be outdated');
      } catch (backupErr) {
        setError('Failed to load alarms from all sources');
      }
    }
  };

  const updateStorageStatus = async () => {
    try {
      const mobileInfo = await mobileStorage.getMobileStorageInfo();
      const health = await unifiedStorage.checkStorageHealth();

      setStorageStatus({
        isHealthy: health.isHealthy,
        storageType: mobileInfo.storageStats.storageType,
        totalAlarms: mobileInfo.storageStats.alarms,
        nativeBackupCount: mobileInfo.criticalAlarmsCount,
        networkStatus: mobileInfo.networkStatus?.connected ? 'online' : 'offline',
        memoryOptimized: mobileInfo.deviceCapabilities?.memoryWarning || false,
      });
    } catch (err) {
      console.error('Failed to update storage status:', err);
    }
  };

  const handleAppResume = useCallback(async () => {
    console.log('App resumed - refreshing alarms and checking storage health');
    
    try {
      // Refresh alarms
      await loadAlarms();
      
      // Update storage status
      await updateStorageStatus();
      
      // Check if sync is needed
      const pendingChanges = await unifiedStorage.getPendingChanges();
      if (pendingChanges.length > 0) {
        console.log(`${pendingChanges.length} changes pending sync`);
        // Could trigger sync here
      }
    } catch (err) {
      console.error('App resume handling failed:', err);
    }
  }, []);

  const handleNetworkChange = useCallback(async (isOnline: boolean) => {
    console.log(`Network changed: ${isOnline ? 'online' : 'offline'}`);
    
    if (isOnline) {
      // Network reconnected - check for pending sync
      try {
        const pendingChanges = await unifiedStorage.getPendingChanges();
        if (pendingChanges.length > 0) {
          console.log(`Network restored - ${pendingChanges.length} changes ready to sync`);
          // Could auto-sync here
        }
      } catch (err) {
        console.error('Failed to check pending changes:', err);
      }
    }
    
    await updateStorageStatus();
  }, []);

  const saveAlarm = async (alarm: Alarm) => {
    try {
      setError(null);
      
      // Use mobile-optimized save with automatic native backup
      await mobileStorage.saveAlarmOptimized(alarm);
      
      // Refresh the alarm list
      await loadAlarms();
      
      console.log('Alarm saved successfully:', alarm.title);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save alarm';
      setError(errorMessage);
      console.error('Failed to save alarm:', err);
    }
  };

  const deleteAlarm = async (alarmId: string) => {
    try {
      setError(null);
      
      // Delete from main storage
      await unifiedStorage.deleteAlarm(alarmId);
      
      // Refresh the alarm list
      await loadAlarms();
      
      console.log('Alarm deleted successfully:', alarmId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete alarm';
      setError(errorMessage);
      console.error('Failed to delete alarm:', err);
    }
  };

  const performMobileSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      
      // Check storage health first
      const health = await unifiedStorage.checkStorageHealth();
      
      if (!health.isHealthy) {
        console.warn('Storage health issues detected:', health.issues);
        
        // Perform maintenance
        const maintenanceResult = await unifiedStorage.performMaintenance();
        console.log('Maintenance performed:', maintenanceResult);
      }
      
      // Get pending changes
      const pendingChanges = await unifiedStorage.getPendingChanges();
      console.log(`Syncing ${pendingChanges.length} pending changes`);
      
      // Here you would implement your server sync logic
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear pending changes after successful sync
      await unifiedStorage.clearPendingChanges();
      
      // Refresh status
      await updateStorageStatus();
      
      console.log('Sync completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const clearMobileCache = async () => {
    try {
      setError(null);
      
      // Clear non-essential cache for mobile optimization
      await unifiedStorage.clearCache(['temp', 'preview', 'images']);
      
      // Update status
      await updateStorageStatus();
      
      console.log('Mobile cache cleared successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cache';
      setError(errorMessage);
      console.error('Failed to clear cache:', err);
    }
  };

  const addTestAlarm = async () => {
    const testAlarm: Alarm = {
      id: `mobile-alarm-${Date.now()}`,
      title: `Mobile Alarm ${alarms.length + 1}`,
      time: '09:00',
      enabled: true,
      userId: 'mobile-user',
      label: 'Mobile Test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await saveAlarm(testAlarm);
  };

  if (loading) {
    return (
      <div className="mobile-alarm-manager loading">
        <div className="loading-spinner"></div>
        <p>Initializing mobile storage...</p>
      </div>
    );
  }

  return (
    <div className="mobile-alarm-manager">
      <header className="manager-header">
        <h2>Mobile Alarm Manager</h2>
        {storageStatus && (
          <div className={`storage-status ${storageStatus.isHealthy ? 'healthy' : 'warning'}`}>
            <span className="status-indicator"></span>
            {storageStatus.storageType} ({storageStatus.networkStatus})
          </div>
        )}
      </header>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Storage Information */}
      {storageStatus && (
        <div className="storage-info">
          <div className="info-grid">
            <div className="info-item">
              <label>Storage Type:</label>
              <span>{storageStatus.storageType}</span>
            </div>
            <div className="info-item">
              <label>Total Alarms:</label>
              <span>{storageStatus.totalAlarms}</span>
            </div>
            <div className="info-item">
              <label>Native Backup:</label>
              <span>{storageStatus.nativeBackupCount} alarms</span>
            </div>
            <div className="info-item">
              <label>Network:</label>
              <span className={storageStatus.networkStatus}>
                {storageStatus.networkStatus}
              </span>
            </div>
          </div>
          
          {storageStatus.memoryOptimized && (
            <div className="memory-warning">
              🧠 Memory optimization active
            </div>
          )}
        </div>
      )}

      {/* Alarms List */}
      <div className="alarms-section">
        <div className="section-header">
          <h3>Enabled Alarms ({alarms.length})</h3>
          <button 
            className="add-button"
            onClick={addTestAlarm}
            disabled={syncing}
          >
            + Add Test Alarm
          </button>
        </div>
        
        <div className="alarms-list">
          {alarms.length === 0 ? (
            <div className="empty-state">
              <p>No alarms found</p>
              <button onClick={addTestAlarm}>Create your first alarm</button>
            </div>
          ) : (
            alarms.map(alarm => (
              <div key={alarm.id} className="alarm-item">
                <div className="alarm-info">
                  <h4>{alarm.title}</h4>
                  <span className="alarm-time">{alarm.time}</span>
                  {alarm.label && <span className="alarm-label">{alarm.label}</span>}
                </div>
                <div className="alarm-actions">
                  <button 
                    onClick={() => {
                      const updatedAlarm = { 
                        ...alarm, 
                        title: alarm.title + ' (Updated)',
                        updatedAt: new Date()
                      };
                      saveAlarm(updatedAlarm);
                    }}
                    disabled={syncing}
                  >
                    Update
                  </button>
                  <button 
                    onClick={() => deleteAlarm(alarm.id)}
                    disabled={syncing}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="actions-section">
        <button 
          onClick={performMobileSync}
          disabled={syncing}
          className="sync-button"
        >
          {syncing ? 'Syncing...' : 'Sync Storage'}
        </button>
        
        <button 
          onClick={clearMobileCache}
          disabled={syncing}
          className="cache-button"
        >
          Clear Cache
        </button>
        
        <button 
          onClick={updateStorageStatus}
          disabled={syncing}
          className="refresh-button"
        >
          Refresh Status
        </button>
      </div>

      {/* Mobile Features Display */}
      <div className="features-info">
        <h4>Mobile Features Active</h4>
        <ul className="features-list">
          <li>✅ IndexedDB with type safety (idb package)</li>
          <li>✅ Native storage backup via Capacitor Preferences</li>
          <li>✅ App lifecycle integration (pause/resume handling)</li>
          <li>✅ Network status monitoring</li>
          <li>✅ Memory warning optimization</li>
          <li>✅ Intelligent cache management</li>
          <li>✅ Multi-layer fallback strategy</li>
          <li>✅ Mobile-optimized batch operations</li>
        </ul>
      </div>
    </div>
  );
}

export default MobileAlarmManager;