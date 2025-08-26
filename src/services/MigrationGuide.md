# Service Migration Guide: From Direct Imports to Dependency Injection

This guide explains how to migrate from direct service imports to using the new dependency injection
container.

## Overview

The app now uses a sophisticated dependency injection (DI) container that manages service lifecycle,
dependencies, and configuration. This replaces the old singleton pattern used by most services.

## Migration Steps

### 1. Remove Direct Service Imports

**Before (Old Pattern):**

```typescript
import { AlarmService } from '../services/alarm';
import AnalyticsService from '../services/analytics';
import { VoiceService } from '../services/voice';
```

**After (New Pattern):**

```typescript
import { getService } from '../services/ServiceBootstrap';
import { IAlarmService, IAnalyticsService, IVoiceService } from '../types/service-interfaces';
```

### 2. Update Service Usage in Components

**Before (Old Pattern):**

```typescript
class MyComponent extends React.Component {
  async componentDidMount() {
    const alarms = await AlarmService.loadAlarms();
    await AnalyticsService.track('component_mounted');
  }
}
```

**After (New Pattern):**

```typescript
class MyComponent extends React.Component {
  private alarmService = getService<IAlarmService>('AlarmService');
  private analyticsService = getService<IAnalyticsService>('AnalyticsService');

  async componentDidMount() {
    const alarms = await this.alarmService.loadAlarms();
    await this.analyticsService.track('component_mounted');
  }
}
```

### 3. Update Service Usage in Hooks

**Before (Old Pattern):**

```typescript
function useAlarms() {
  useEffect(() => {
    AlarmService.loadAlarms().then(setAlarms);
  }, []);
}
```

**After (New Pattern):**

```typescript
function useAlarms() {
  const alarmService = useMemo(() => getService<IAlarmService>('AlarmService'), []);

  useEffect(() => {
    alarmService.loadAlarms().then(setAlarms);
  }, [alarmService]);
}
```

### 4. Update Service Usage in Utility Functions

**Before (Old Pattern):**

```typescript
export async function processAlarms() {
  const alarms = await AlarmService.loadAlarms();
  await AnalyticsService.track('alarms_processed', { count: alarms.length });
}
```

**After (New Pattern):**

```typescript
import { getService } from '../services/ServiceBootstrap';
import { IAlarmService, IAnalyticsService } from '../types/service-interfaces';

export async function processAlarms() {
  const alarmService = getService<IAlarmService>('AlarmService');
  const analyticsService = getService<IAnalyticsService>('AnalyticsService');

  const alarms = await alarmService.loadAlarms();
  await analyticsService.track('alarms_processed', { count: alarms.length });
}
```

## Available Services

The following services are available through the DI container:

### Core Services

- `AlarmService` - Enhanced alarm management (implements `IAlarmService`)
- `AnalyticsService` - Enhanced analytics and tracking (implements `IAnalyticsService`)
- `StorageService` - Enhanced storage with caching (implements `IStorageService`)

### Infrastructure Services

- `CacheService` - Caching and performance (implements `ICacheService`)
- `SecurityService` - Security and authentication (implements `ISecurityService`)
- `PerformanceService` - Performance monitoring (implements `IPerformanceService`)

### Business Services

- `SubscriptionService` - Subscription management (implements `ISubscriptionService`)
- `VoiceService` - Voice and audio features (implements `IVoiceService`)
- `BattleService` - Gaming and challenges (implements `IBattleService`)
- `NotificationService` - Push notifications (implements `INotificationService`)
- `AudioService` - Audio playback and management (implements `IAudioService`)

## Error Handling

If a service is not available (app not initialized), `getService` will throw an error:

```typescript
try {
  const alarmService = getService<IAlarmService>('AlarmService');
} catch (error) {
  console.error('AlarmService not available:', error);
  // Handle gracefully or show error to user
}
```

## Testing

For testing, use `initializeTestServices()`:

```typescript
import { initializeTestServices, getService } from '../services/ServiceBootstrap';

beforeAll(async () => {
  await initializeTestServices();
});

test('should load alarms', async () => {
  const alarmService = getService<IAlarmService>('AlarmService');
  const alarms = await alarmService.loadAlarms();
  expect(alarms).toBeDefined();
});
```

## Benefits

1. **Type Safety**: Full TypeScript support with service interfaces
2. **Dependency Management**: Automatic dependency resolution and injection
3. **Lifecycle Management**: Proper initialization and cleanup
4. **Testing**: Easy mocking and testing with isolated containers
5. **Performance**: Better memory management and service reuse
6. **Configuration**: Centralized service configuration and monitoring

## Migration Priority

1. **High Priority** - Files that use AlarmService directly
2. **Medium Priority** - Files that use AnalyticsService, VoiceService
3. **Low Priority** - Files that use utility services

## Files to Update

Based on the codebase scan, these files need migration:

### Critical (High Priority)

- `src/App.tsx` - Main app component with many service imports
- `src/components/AlarmForm.tsx` - Alarm creation and editing
- `src/components/AlarmList.tsx` - Alarm listing and management
- `src/components/AlarmRinging.tsx` - Active alarm handling

### Important (Medium Priority)

- `src/components/AlarmManagement.tsx` - Alarm management interface
- `src/analytics/PersonaAnalytics.tsx` - Analytics tracking
- `src/backend/*.ts` - Backend API integrations

### Utilities (Low Priority)

- Various utility functions and helper components

## Next Steps

1. Update high-priority files first
2. Test each component after migration
3. Run full integration tests
4. Monitor for any service initialization issues
5. Gradually migrate remaining files

The migration can be done incrementally - the old services will continue to work alongside the new
DI system during the transition period.
