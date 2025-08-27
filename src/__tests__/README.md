# Relife Testing Framework

A comprehensive testing framework for the Relife alarm application, providing utilities, mocks, and test orchestration for all aspects of the application.

## Overview

This testing framework provides a complete suite of testing utilities designed specifically for the Relife alarm app's architecture, which includes:

- **Cloudflare Edge API** endpoints
- **Supabase** backend services and real-time subscriptions
- **Mobile-first design** with Capacitor integration
- **Premium subscription features** with Stripe payments
- **Real-time battle system** with WebSocket connections
- **Voice recording and AI processing** capabilities

## Quick Start

```typescript
import { testHelpers, relifeTestUtils } from './helpers/comprehensive-test-helpers';
import { performanceTestSuite } from './performance/performance-testing-utilities';
import { relifeIntegrationSuite } from './integration/test-orchestration';

// Basic test helper usage
describe('Alarm Creation', () => {
  it('should create an alarm successfully', async () => {
    await relifeTestUtils.createTestAlarm({
      label: 'Test Alarm',
      time: '07:00',
      difficulty: 'medium'
    });
    
    await testHelpers.verifyCurrentRoute('/alarms');
  });
});

// Performance testing
describe('Performance', () => {
  it('should meet performance requirements', async () => {
    const results = await performanceTestSuite.runComprehensiveTest();
    expect(results.passed).toBe(true);
  });
});

// Integration testing
describe('Integration', () => {
  it('should complete user onboarding flow', async () => {
    const result = await relifeIntegrationSuite.runScenario('user-onboarding');
    expect(result.passed).toBe(true);
  });
});
```

## Architecture

### Testing Stack
- **Test Runner**: Jest/Vitest
- **Component Testing**: React Testing Library
- **API Mocking**: MSW (Mock Service Worker)
- **Mobile Testing**: Capacitor plugin mocks
- **Performance**: Custom performance monitoring
- **E2E Testing**: Playwright-compatible utilities

### Project Structure

```
src/__tests__/
├── api/                    # API testing utilities
│   ├── api-testing-utilities.ts
│   └── enhanced-msw-handlers.ts
├── helpers/                # Test helper utilities
│   └── comprehensive-test-helpers.ts
├── integration/            # Integration testing
│   ├── test-orchestration.ts
│   └── e2e-testing-utilities.ts
├── mobile/                 # Mobile testing utilities
│   └── mobile-testing-utilities.ts
├── mocks/                  # Service and platform mocks
│   ├── service-mocks.ts
│   ├── platform-service-mocks.ts
│   └── [other-mocks].ts
├── payments/               # Payment testing utilities
│   └── payment-testing-utilities.ts
├── performance/            # Performance testing
│   └── performance-testing-utilities.ts
├── realtime/               # Real-time testing
│   ├── websocket-testing.ts
│   └── realtime-testing-utilities.ts
└── utils/                  # Core testing utilities
    ├── performance-helpers.ts
    ├── assertion-helpers.ts
    └── [other-utils].ts
```

## Testing Categories

### 1. Unit Testing
Test individual components and functions in isolation.

```typescript
import { render, screen } from '@testing-library/react';
import { AlarmCard } from '../components/AlarmCard';

test('displays alarm information correctly', () => {
  const alarm = {
    id: '1',
    label: 'Morning Alarm',
    time: '07:00',
    enabled: true
  };
  
  render(<AlarmCard alarm={alarm} />);
  expect(screen.getByText('Morning Alarm')).toBeInTheDocument();
  expect(screen.getByText('07:00')).toBeInTheDocument();
});
```

### 2. Integration Testing
Test complete user flows and feature interactions.

```typescript
import { relifeIntegrationSuite } from './integration/test-orchestration';

describe('Alarm Lifecycle Integration', () => {
  it('should complete full alarm lifecycle', async () => {
    const result = await relifeIntegrationSuite.runScenario('alarm-lifecycle');
    expect(result.passed).toBe(true);
    expect(result.steps).toHaveLength(4);
  });
});
```

### 3. Performance Testing
Monitor and validate application performance.

```typescript
import { performanceTestSuite } from './performance/performance-testing-utilities';

describe('Performance Tests', () => {
  it('should meet alarm trigger latency requirements', async () => {
    const results = await performanceTestSuite.alarmTester.testAlarmTriggerLatency({});
    expect(results.averageLatency).toBeLessThan(100); // 100ms requirement
  });
});
```

### 4. Mobile Testing
Test mobile-specific functionality and platform differences.

```typescript
import { mobilePerformanceTester } from './performance/performance-testing-utilities';

describe('Mobile Performance', () => {
  it('should perform well on low-end devices', async () => {
    const results = await mobilePerformanceTester.testWithDeviceProfile({
      device: 'low-end',
      platform: 'android',
      memoryLimitation: 50,
      cpuThrottling: 2.0,
      networkCondition: '3g'
    });
    
    expect(results.performanceScore).toBeGreaterThan(80);
  });
});
```

### 5. API Testing
Test API endpoints and service integrations.

```typescript
import { apiPerformanceTester } from './performance/performance-testing-utilities';

describe('API Performance', () => {
  it('should respond to critical endpoints quickly', async () => {
    const results = await apiPerformanceTester.benchmarkCriticalPaths([
      { name: 'load_alarms', endpoint: '/api/alarms', method: 'GET' },
      { name: 'create_alarm', endpoint: '/api/alarms', method: 'POST' }
    ]);
    
    expect(results.load_alarms.passed).toBe(true);
    expect(results.create_alarm.passed).toBe(true);
  });
});
```

## Key Features

### Mock Services
All external services are mocked with realistic behavior:

- **Supabase**: Database operations, authentication, real-time subscriptions
- **Stripe**: Payment processing, webhook handling
- **Cloudflare**: Edge API responses, global distribution simulation
- **Capacitor**: Native mobile plugins (notifications, audio, storage)
- **ElevenLabs**: Voice synthesis and processing

### Performance Monitoring
Built-in performance monitoring with:

- **Alarm Performance**: Trigger latency, background processing
- **API Performance**: Response times, error rates, caching
- **Real-time Performance**: WebSocket latency, sync accuracy
- **Mobile Performance**: Frame rates, memory usage, battery impact

### Test Orchestration
Sophisticated test orchestration with:

- **Parallel Execution**: Run tests concurrently for speed
- **Retry Logic**: Automatic retry for flaky tests
- **Scenario Management**: Pre-built user journey scenarios
- **Performance Monitoring**: Integrated performance tracking

### Realistic Test Data
Factory patterns for generating realistic test data:

- **Users**: With proper subscription tiers and preferences
- **Alarms**: With various configurations and settings
- **Battles**: With participants and challenge data
- **Voice Clips**: With metadata and processing status

## Best Practices

### 1. Test Organization
```typescript
describe('Feature: Alarm Management', () => {
  describe('When user creates an alarm', () => {
    it('should save alarm with correct properties', async () => {
      // Test implementation
    });
    
    it('should show success notification', async () => {
      // Test implementation
    });
  });
});
```

### 2. Setup and Cleanup
```typescript
beforeEach(async () => {
  // Reset all mocks
  testHelpers.clearTestState();
  MockAlarmService.reset();
  MockSubscriptionService.reset();
});

afterEach(async () => {
  // Cleanup test data
  await testHelpers.waitForDataLoad();
});
```

### 3. Async Testing
```typescript
it('should handle async operations correctly', async () => {
  const promise = relifeTestUtils.createTestAlarm();
  
  // Wait for loading states
  await testHelpers.waitForElement(() => 
    screen.queryByText(/creating alarm/i)
  );
  
  await promise;
  
  // Verify completion
  await testHelpers.waitForElement(() =>
    screen.queryByText(/alarm created/i)
  );
});
```

### 4. Error Testing
```typescript
it('should handle errors gracefully', async () => {
  // Force an error condition
  MockAlarmService.setScenario('error');
  
  await testHelpers.verifyErrorHandling(
    () => relifeTestUtils.createTestAlarm(),
    /failed to create alarm/i
  );
});
```

## Configuration

### Environment Variables
```bash
# Test configuration
TEST_MOBILE=true              # Enable mobile-specific tests
TEST_PERFORMANCE=true         # Enable performance monitoring
TEST_A11Y=true               # Enable accessibility tests
VERBOSE_TESTS=true           # Enable verbose logging
DEBUG_TESTS=true             # Enable debug output

# Test platform
TEST_PLATFORM=web            # web | ios | android
```

### Test Configuration Files
- `vitest.config.ts` - Main test configuration
- `src/__tests__/config/global-setup.ts` - Global test setup
- `src/__tests__/config/test-sequencer.js` - Test execution order

## Guides

- [Getting Started Guide](./docs/getting-started.md)
- [API Testing Guide](./docs/api-testing-guide.md)
- [Performance Testing Guide](./docs/performance-testing-guide.md)
- [Mobile Testing Guide](./docs/mobile-testing-guide.md)
- [Integration Testing Guide](./docs/integration-testing-guide.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)

## Contributing

When adding new tests:

1. **Follow naming conventions**: `feature.test.ts` for units, `feature.integration.test.ts` for integration
2. **Use appropriate utilities**: Import from the correct utility modules
3. **Add performance monitoring**: Include performance assertions for critical paths
4. **Test mobile scenarios**: Ensure mobile compatibility where applicable
5. **Update documentation**: Add examples and update guides as needed

## Support

For questions or issues with the testing framework:

1. Check the [Troubleshooting Guide](./docs/troubleshooting.md)
2. Review existing tests for examples
3. Check the mock service implementations
4. Verify test environment configuration

---

*This testing framework is designed to provide comprehensive coverage for the Relife alarm application while maintaining fast execution times and reliable results.*