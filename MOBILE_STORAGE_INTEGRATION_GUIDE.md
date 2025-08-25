# Mobile Storage Integration Guide

This guide shows how to integrate your existing IndexedDB storage system with your Capacitor mobile app for optimal performance and reliability.

## Overview

Your project already includes:
- ✅ **IndexedDB with type safety** using the `idb` package
- ✅ **Unified Storage Service** that handles IndexedDB/localStorage fallback
- ✅ **Mobile Storage Service** with Capacitor integration
- ✅ **Comprehensive Capacitor configuration** with all necessary plugins

## Quick Start

### 1. Initialize Mobile Storage in Your App

```typescript
// src/main.tsx or your app entry point
import { MobileStorageService } from './services/mobile-storage';
import { UnifiedStorageService } from './services/unified-storage';

const mobileStorage = MobileStorageService.getInstance();
const storage = UnifiedStorageService.getInstance();

// Initialize mobile storage on app startup
async function initializeApp() {
  try {
    // Configure mobile storage
    await mobileStorage.initializeMobile({
      enableNativePreferences: true,
      syncOnResume: true,
      compressionEnabled: true,
      batchSize: 50,
    });
    
    console.log('Mobile storage initialized successfully');
  } catch (error) {
    console.error('Failed to initialize mobile storage:', error);
  }
}

// Call during app initialization
initializeApp();
```

### 2. Use Mobile-Optimized Storage Operations

```typescript
// Example: Saving alarms with mobile optimizations
import { MobileStorageService } from '../services/mobile-storage';
import type { Alarm } from '../types/domain';

const mobileStorage = MobileStorageService.getInstance();

// Save alarm with native backup for reliability
async function saveAlarmMobile(alarm: Alarm) {
  try {
    // This automatically:
    // - Saves to IndexedDB
    // - Backs up enabled alarms to native storage
    // - Handles fallbacks if storage fails
    await mobileStorage.saveAlarmOptimized(alarm);
  } catch (error) {
    console.error('Failed to save alarm:', error);
  }
}

// Get alarms with native fallback
async function getAlarmsMobile() {
  try {
    // Tries IndexedDB first, falls back to native storage if needed
    return await mobileStorage.getEnabledAlarmsWithFallback();
  } catch (error) {
    console.error('Failed to get alarms:', error);
    return [];
  }
}
```

## Mobile App Integration Patterns

### 1. App Lifecycle Integration

Your mobile storage automatically handles app lifecycle events:

```typescript
// This is already set up in MobileStorageService
// App.addListener('appStateChange', (state) => {
//   - On pause: saves critical data to native storage
//   - On resume: syncs data and checks storage health
//   - On memory warning: clears cache and reduces batch sizes
// });
```

### 2. Network-Aware Operations

```typescript
import { Network } from '@capacitor/network';

// Check network status before sync operations
async function performSyncWithNetworkCheck() {
  const status = await Network.getStatus();
  
  if (status.connected) {
    // Perform sync operations
    const pendingChanges = await storage.getPendingChanges();
    console.log(`Syncing ${pendingChanges.length} changes`);
    
    // Your sync logic here
    await performServerSync(pendingChanges);
  } else {
    console.log('Offline - changes will be synced when online');
  }
}
```

### 3. Memory Management

```typescript
// Get device capabilities and optimize accordingly
const mobileInfo = await mobileStorage.getMobileStorageInfo();

if (mobileInfo.deviceCapabilities?.memoryWarning) {
  // Reduce cache usage
  await storage.clearCache(['temp', 'images']);
  
  // Use smaller batch sizes
  mobileStorage.updateConfig({
    batchSize: 10,
    compressionEnabled: true,
  });
}
```

## Native Storage Integration

### 1. Critical Data Backup

The mobile storage service automatically backs up critical alarms to native storage:

```typescript
// This happens automatically, but you can also do it manually:
import { Preferences } from '@capacitor/preferences';

// Save critical app state to native storage
async function backupCriticalData() {
  const enabledAlarms = await storage.getEnabledAlarms();
  
  await Preferences.set({
    key: 'critical-alarms-backup',
    value: JSON.stringify({
      alarms: enabledAlarms.slice(0, 10), // Top 10 alarms
      timestamp: new Date().toISOString(),
    }),
  });
}

// Restore from native storage if main storage fails
async function restoreFromNativeBackup(): Promise<Alarm[]> {
  try {
    const backup = await Preferences.get({ key: 'critical-alarms-backup' });
    if (backup.value) {
      const data = JSON.parse(backup.value);
      return data.alarms || [];
    }
  } catch (error) {
    console.error('Failed to restore from native backup:', error);
  }
  return [];
}
```

### 2. App Settings Persistence

```typescript
// Store app settings in native storage for persistence
async function saveAppSettings(settings: any) {
  await Preferences.set({
    key: 'app-settings',
    value: JSON.stringify(settings),
  });
}

async function loadAppSettings() {
  const result = await Preferences.get({ key: 'app-settings' });
  return result.value ? JSON.parse(result.value) : null;
}
```

## Performance Optimizations

### 1. Batch Operations

```typescript
// Save multiple alarms efficiently
async function saveMultipleAlarms(alarms: Alarm[]) {
  const batchSize = 20; // Mobile-optimized batch size
  
  for (let i = 0; i < alarms.length; i += batchSize) {
    const batch = alarms.slice(i, i + batchSize);
    
    // Save batch with delay to prevent blocking UI
    await Promise.all(batch.map(alarm => storage.saveAlarm(alarm)));
    
    // Small delay between batches
    if (i + batchSize < alarms.length) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}
```

### 2. Intelligent Caching

```typescript
// Use mobile-aware caching
async function cacheWithMobileOptimization<T>(
  key: string,
  data: T,
  priority: 'high' | 'medium' | 'low' = 'medium'
) {
  const mobileInfo = await mobileStorage.getMobileStorageInfo();
  
  // Adjust TTL based on memory constraints
  let ttl = 60 * 60 * 1000; // 1 hour default
  
  if (mobileInfo.deviceCapabilities?.memoryWarning) {
    ttl = priority === 'high' ? 30 * 60 * 1000 : 10 * 60 * 1000; // Shorter TTL
  }
  
  const tags = [`priority-${priority}`, 'mobile-cache'];
  await storage.setCache(key, data, ttl, tags);
}
```

## Error Handling and Recovery

### 1. Storage Health Monitoring

```typescript
// Regular storage health checks
async function performStorageHealthCheck() {
  const health = await storage.checkStorageHealth();
  
  if (!health.isHealthy) {
    console.warn('Storage health issues:', health.issues);
    
    // Automatic recovery
    if (health.issues.includes('High number of conflicts')) {
      await storage.clearPendingChanges();
    }
    
    if (health.recommendations.includes('Consider clearing cache')) {
      await storage.clearCache(['temp', 'preview']);
    }
    
    // Notify user if manual intervention needed
    if (health.issues.length > 2) {
      showStorageHealthWarning(health);
    }
  }
}

// Run health check on app resume
App.addListener('resume', () => {
  performStorageHealthCheck();
});
```

### 2. Fallback Strategies

```typescript
// Multi-layer fallback strategy
async function getAlarmWithFallback(id: string): Promise<Alarm | null> {
  try {
    // Try IndexedDB first
    return await storage.getAlarm(id);
  } catch (indexedDBError) {
    console.warn('IndexedDB failed, trying native storage:', indexedDBError);
    
    try {
      // Try native storage backup
      const criticalAlarms = await mobileStorage.getCriticalAlarmsFromNative();
      return criticalAlarms.find(alarm => alarm.id === id) || null;
    } catch (nativeError) {
      console.error('All storage methods failed:', nativeError);
      
      // Last resort: check localStorage
      const legacyData = localStorage.getItem(`alarm-${id}`);
      if (legacyData) {
        try {
          return JSON.parse(legacyData);
        } catch {
          return null;
        }
      }
      
      return null;
    }
  }
}
```

## Mobile-Specific UI Components

### 1. Storage Status Component

```typescript
// src/components/MobileStorageStatus.tsx
import React, { useEffect, useState } from 'react';
import { MobileStorageService } from '../services/mobile-storage';

export function MobileStorageStatus() {
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadStorageInfo() {
      try {
        const mobileStorage = MobileStorageService.getInstance();
        const info = await mobileStorage.getMobileStorageInfo();
        setStorageInfo(info);
      } catch (error) {
        console.error('Failed to load storage info:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadStorageInfo();
  }, []);
  
  if (isLoading) return <div>Loading storage info...</div>;
  
  return (
    <div className="mobile-storage-status">
      <h3>Storage Status</h3>
      <div className="storage-details">
        <p>Platform: {storageInfo?.deviceCapabilities?.platform}</p>
        <p>Storage Type: {storageInfo?.storageStats?.storageType}</p>
        <p>Total Alarms: {storageInfo?.storageStats?.alarms}</p>
        <p>Native Backup: {storageInfo?.criticalAlarmsCount} alarms</p>
        <p>Network: {storageInfo?.networkStatus?.connected ? 'Online' : 'Offline'}</p>
        
        {storageInfo?.deviceCapabilities?.memoryWarning && (
          <div className="memory-warning">
            ⚠️ Low memory detected - cache optimization active
          </div>
        )}
        
        {!storageInfo?.storageStats?.isHealthy && (
          <div className="health-warning">
            ⚠️ Storage health issues detected
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2. Mobile Settings Component

```typescript
// src/components/MobileStorageSettings.tsx
import React from 'react';
import { MobileStorageService } from '../services/mobile-storage';

export function MobileStorageSettings() {
  const mobileStorage = MobileStorageService.getInstance();
  const config = mobileStorage.getConfig();
  
  const handleConfigUpdate = (updates: any) => {
    mobileStorage.updateConfig(updates);
  };
  
  return (
    <div className="mobile-storage-settings">
      <h3>Mobile Storage Settings</h3>
      
      <label>
        <input
          type="checkbox"
          checked={config.enableNativePreferences}
          onChange={(e) => handleConfigUpdate({ 
            enableNativePreferences: e.target.checked 
          })}
        />
        Enable native storage backup
      </label>
      
      <label>
        <input
          type="checkbox"
          checked={config.syncOnResume}
          onChange={(e) => handleConfigUpdate({ 
            syncOnResume: e.target.checked 
          })}
        />
        Sync on app resume
      </label>
      
      <label>
        <input
          type="checkbox"
          checked={config.compressionEnabled}
          onChange={(e) => handleConfigUpdate({ 
            compressionEnabled: e.target.checked 
          })}
        />
        Enable data compression
      </label>
      
      <label>
        Batch size:
        <input
          type="range"
          min="10"
          max="100"
          value={config.batchSize}
          onChange={(e) => handleConfigUpdate({ 
            batchSize: parseInt(e.target.value) 
          })}
        />
        {config.batchSize}
      </label>
    </div>
  );
}
```

## Testing Mobile Storage

### 1. Unit Tests

```typescript
// src/services/__tests__/mobile-storage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MobileStorageService } from '../mobile-storage';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
  },
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: vi.fn(),
    get: vi.fn(),
  },
}));

describe('MobileStorageService', () => {
  let mobileStorage: MobileStorageService;
  
  beforeEach(() => {
    mobileStorage = MobileStorageService.getInstance();
  });
  
  it('should initialize mobile storage', async () => {
    await mobileStorage.initializeMobile({
      enableNativePreferences: true,
      syncOnResume: true,
    });
    
    const info = await mobileStorage.getMobileStorageInfo();
    expect(info.nativeStorageAvailable).toBe(true);
  });
  
  it('should save alarms with native backup', async () => {
    const alarm = {
      id: 'test-alarm',
      title: 'Test Alarm',
      enabled: true,
      time: '09:00',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await mobileStorage.saveAlarmOptimized(alarm);
    
    // Verify native backup was created
    const criticalAlarms = await mobileStorage.getCriticalAlarmsFromNative();
    expect(criticalAlarms).toContainEqual(alarm);
  });
});
```

### 2. Integration Tests

```typescript
// tests/integration/mobile-storage.integration.test.ts
import { describe, it, expect } from 'vitest';
import { MobileStorageService } from '../../src/services/mobile-storage';
import { UnifiedStorageService } from '../../src/services/unified-storage';

describe('Mobile Storage Integration', () => {
  it('should handle storage fallbacks correctly', async () => {
    const mobileStorage = MobileStorageService.getInstance();
    const unifiedStorage = UnifiedStorageService.getInstance();
    
    // Initialize both services
    await mobileStorage.initializeMobile();
    await unifiedStorage.initialize();
    
    // Test alarm with fallback
    const testAlarm = {
      id: 'integration-test',
      title: 'Integration Test Alarm',
      enabled: true,
      time: '10:00',
      userId: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Save alarm
    await mobileStorage.saveAlarmOptimized(testAlarm);
    
    // Retrieve with fallback
    const alarms = await mobileStorage.getEnabledAlarmsWithFallback();
    
    expect(alarms).toContainEqual(testAlarm);
  });
});
```

## Migration from Pure Web Storage

If you're migrating existing web storage to mobile:

```typescript
// Migration helper
async function migrateToMobileStorage() {
  console.log('Starting migration to mobile storage...');
  
  const unifiedStorage = UnifiedStorageService.getInstance();
  const mobileStorage = MobileStorageService.getInstance();
  
  // Initialize mobile storage
  await mobileStorage.initializeMobile();
  
  // Check if migration is needed
  const migrationStatus = await unifiedStorage.getMigrationStatus();
  
  if (migrationStatus.isRequired) {
    console.log('Performing storage migration...');
    
    const result = await unifiedStorage.performMigration({
      createBackup: true,
      clearLegacyData: false, // Keep legacy as fallback initially
    });
    
    if (result.success) {
      console.log('Migration completed successfully');
      
      // Sync critical data to native storage
      await mobileStorage.syncCriticalDataToNative();
    } else {
      console.error('Migration failed:', result.errors);
    }
  }
  
  console.log('Mobile storage migration complete');
}
```

## Best Practices Summary

1. **Always initialize mobile storage** on app startup
2. **Use mobile-optimized operations** for better performance
3. **Enable native storage backup** for critical data reliability
4. **Monitor storage health** and handle issues proactively
5. **Implement fallback strategies** for different failure scenarios
6. **Optimize for memory constraints** on mobile devices
7. **Use network-aware sync** to handle connectivity changes
8. **Test thoroughly** on both iOS and Android devices

## Troubleshooting

### Common Issues

1. **IndexedDB not available**: The mobile storage service automatically falls back to localStorage and native storage
2. **Memory warnings**: Reduce cache size and batch operations
3. **Storage quota exceeded**: Clear old cache and implement data archival
4. **Sync failures**: Check network connectivity and retry logic

### Debug Information

```typescript
// Get comprehensive debug info
async function getDebugInfo() {
  const mobileStorage = MobileStorageService.getInstance();
  const unifiedStorage = UnifiedStorageService.getInstance();
  
  const info = {
    mobile: await mobileStorage.getMobileStorageInfo(),
    stats: await unifiedStorage.getStorageStats(),
    health: await unifiedStorage.checkStorageHealth(),
    config: mobileStorage.getConfig(),
  };
  
  console.log('Debug Info:', JSON.stringify(info, null, 2));
  return info;
}
```

## Next Steps

1. **Initialize mobile storage** in your app entry point
2. **Replace direct storage calls** with mobile-optimized versions
3. **Add storage monitoring** to your app dashboard
4. **Test on real devices** with different memory and network conditions
5. **Monitor performance** and adjust configuration as needed

Your mobile storage integration is now ready for production use with excellent type safety, performance optimizations, and reliability features!