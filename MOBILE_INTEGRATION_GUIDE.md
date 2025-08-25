# Capacitor Mobile Storage Integration Guide

Your project already has excellent mobile storage integration! Here's how to use it effectively.

## ✅ What You Already Have

- **IndexedDB with type safety** using the `idb` package (v8.0.3)
- **Unified Storage Service** with automatic fallback handling
- **Mobile Storage Service** with Capacitor integration
- **Comprehensive Capacitor config** with all necessary plugins

## Quick Start

### 1. Initialize Mobile Storage

```typescript
// In your app startup (main.tsx or App.tsx)
import { MobileStorageService } from './services/mobile-storage';

const mobileStorage = MobileStorageService.getInstance();

async function initApp() {
  await mobileStorage.initializeMobile({
    enableNativePreferences: true,  // Backup to native storage
    syncOnResume: true,            // Sync when app resumes
    compressionEnabled: true,      // Optimize for mobile
    batchSize: 50,                // Mobile batch size
  });
}

initApp();
```

### 2. Use Mobile-Optimized Operations

```typescript
// Save alarms with mobile optimizations
await mobileStorage.saveAlarmOptimized(alarm);

// Get alarms with native fallback
const alarms = await mobileStorage.getEnabledAlarmsWithFallback();

// Get mobile storage info
const info = await mobileStorage.getMobileStorageInfo();
```

## Key Features

### 🔄 Automatic App Lifecycle Handling
- **App Pause**: Saves critical data to native storage
- **App Resume**: Syncs data and checks storage health  
- **Memory Warning**: Clears cache and optimizes performance

### 🛡️ Multi-Layer Fallback Strategy
1. **IndexedDB** (primary, with type safety)
2. **Native Capacitor Preferences** (critical data backup)
3. **localStorage** (legacy fallback)

### 📱 Mobile-Specific Optimizations
- Network status monitoring
- Memory constraint handling
- Intelligent cache management
- Batch operations for performance

## Integration Examples

### React Component Integration

```typescript
import { useMobileStorage } from './mobile-integration-demo';

function AlarmComponent() {
  const { 
    saveAlarmOptimized, 
    getAlarmsWithFallback,
    getStorageInfo 
  } = useMobileStorage();
  
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  
  useEffect(() => {
    loadAlarms();
  }, []);
  
  const loadAlarms = async () => {
    const enabledAlarms = await getAlarmsWithFallback();
    setAlarms(enabledAlarms);
  };
  
  const saveAlarm = async (alarm: Alarm) => {
    await saveAlarmOptimized(alarm);
    await loadAlarms(); // Refresh
  };
  
  return (
    <div>
      {alarms.map(alarm => (
        <div key={alarm.id}>{alarm.title}</div>
      ))}
    </div>
  );
}
```

### Storage Health Monitoring

```typescript
import { UnifiedStorageService } from './services/unified-storage';

const storage = UnifiedStorageService.getInstance();

// Check and maintain storage health
async function maintainStorage() {
  const health = await storage.checkStorageHealth();
  
  if (!health.isHealthy) {
    console.warn('Storage issues:', health.issues);
    
    // Automatic maintenance
    await storage.performMaintenance();
    
    // Clear cache if needed
    if (health.recommendations.includes('clear cache')) {
      await storage.clearCache(['temp', 'preview']);
    }
  }
}
```

## Native Storage Backup

Critical alarms are automatically backed up to Capacitor Preferences:

```typescript
// This happens automatically, but you can access it:
const criticalAlarms = await mobileStorage.getCriticalAlarmsFromNative();
console.log(`${criticalAlarms.length} alarms backed up natively`);
```

## Configuration Options

```typescript
mobileStorage.updateConfig({
  enableNativePreferences: true,    // Enable native backup
  enableBackgroundSync: false,      // Background sync (if supported)
  compressionEnabled: true,         // Compress data
  batchSize: 50,                   // Batch operation size
  syncOnResume: true,              // Sync on app resume
  offlineQueueSize: 1000,          // Max offline queue
});
```

## Error Handling

The mobile storage service includes comprehensive error handling:

```typescript
try {
  await mobileStorage.saveAlarmOptimized(alarm);
} catch (error) {
  // Automatic fallback to native storage
  // User-friendly error handling
  console.error('Storage error:', error);
}
```

## Testing

Your project includes mobile storage tests:

```bash
# Run mobile storage tests
npm run test:mobile:mock

# Test with real device
npm run test:mobile:device

# Mobile E2E tests
npm run test:e2e:mobile
```

## Performance Monitoring

```typescript
// Get detailed storage performance info
const info = await mobileStorage.getMobileStorageInfo();

console.log('Storage Performance:', {
  platform: info.deviceCapabilities?.platform,
  storageType: info.storageStats?.storageType,
  totalAlarms: info.storageStats?.alarms,
  nativeBackupCount: info.criticalAlarmsCount,
  memoryWarning: info.deviceCapabilities?.memoryWarning,
});
```

## Demo Component

See `mobile-integration-demo.tsx` for a complete working example showing:
- Storage initialization
- Mobile-optimized operations  
- Storage health monitoring
- Native backup management
- Performance optimizations

## Best Practices

1. **Always initialize** mobile storage on app startup
2. **Use mobile-optimized methods** instead of direct storage calls
3. **Monitor storage health** regularly
4. **Handle memory warnings** by clearing cache
5. **Test on real devices** with various memory/network conditions

## Troubleshooting

- **IndexedDB issues**: Automatic fallback to native storage
- **Memory warnings**: Cache is automatically cleared
- **Network issues**: Operations are queued for later sync
- **Storage corruption**: Health monitoring detects and repairs

Your mobile storage integration is production-ready with excellent type safety, performance, and reliability!