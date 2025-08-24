# Enhanced Service Mocks

This directory contains both legacy and enhanced service mocks for testing.

## New Enhanced Service Architecture

The enhanced service mocks implement the new dependency injection patterns and BaseService architecture:

### Key Features
- **Dependency Injection**: Services receive dependencies through constructor injection
- **BaseService Pattern**: All services extend MockBaseService with standardized lifecycle
- **Health Monitoring**: Built-in health checks and metrics collection
- **Event System**: Services emit events for lifecycle and state changes
- **Caching Support**: Multi-provider caching with TTL and eviction policies
- **Error Handling**: Comprehensive error handling with automatic recovery
- **Testing Support**: Easy reset and state inspection for tests

### Usage

#### With React Provider (Recommended)
```typescript
import { EnhancedServiceProvider, useEnhancedAlarmService } from './enhanced-service-providers';

function TestComponent() {
  const alarmService = useEnhancedAlarmService();
  // Use service...
}

// In test:
render(
  <EnhancedServiceProvider>
    <TestComponent />
  </EnhancedServiceProvider>
);
```

#### Direct Usage
```typescript
import { createMockServiceContainer, initializeAllMockServices } from './enhanced-service-mocks';

const container = createMockServiceContainer();
await initializeAllMockServices(container);

const alarmService = container.get('alarmService');
const alarms = await alarmService.getAlarms();
```

### Service Interfaces

All enhanced services implement their respective interfaces:

- `AlarmServiceInterface` - Alarm management with lifecycle support
- `AnalyticsServiceInterface` - Event tracking with offline queue
- `SubscriptionServiceInterface` - Subscription management with caching
- `BattleServiceInterface` - Battle system with real-time updates
- `VoiceServiceInterface` - Voice synthesis with cache management

### Migration from Legacy

Legacy static service mocks are still supported for backward compatibility:

```typescript
// Legacy (still works)
import { MockAlarmService } from './service-mocks';
MockAlarmService.reset();
const alarms = await MockAlarmService.loadAlarms();

// Enhanced (recommended)
import { EnhancedServiceProvider, useEnhancedAlarmService } from './service-mocks';
// Use with React Provider or direct container access
```

## Files

- `enhanced-service-mocks.ts` - New enhanced service mock implementations
- `service-mocks.ts` - Legacy static mocks + enhanced exports
- `../providers/enhanced-service-providers.tsx` - React providers for enhanced services
- `../providers/service-providers.tsx` - Legacy service providers

## Testing Utilities

The enhanced mocks include testing utilities:

```typescript
// Reset all services
await resetAllMockServices(container);

// Check service health
const health = await service.getHealth();

// Inspect service state
const callHistory = service.getCallHistory();

// Test error handling
service.emit('service:error', mockError);
```