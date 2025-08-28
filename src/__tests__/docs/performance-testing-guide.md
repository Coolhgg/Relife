# Performance Testing Guide

This guide covers performance testing, monitoring, and optimization techniques for the Relife
application.

## Overview

Performance is critical for the Relife alarm app because:

- **Alarm reliability**: Alarms must trigger on time with minimal latency
- **Mobile performance**: App must work well on low-end devices
- **Real-time features**: Battles require low-latency communication
- **Background processing**: Must be efficient to preserve battery life

## Performance Testing Utilities

### Performance Test Suite

The comprehensive performance test suite covers all critical areas:

```typescript
import { performanceTestSuite } from '../performance/performance-testing-utilities';

describe('Application Performance', () => {
  it('should meet overall performance requirements', async () => {
    const results = await performanceTestSuite.runComprehensiveTest({
      includeAlarms: true,
      includeApi: true,
      includeRealTime: true,
      includeMobile: true,
      duration: 30000,
    });

    expect(results.passed).toBe(true);
    expect(results.violations).toHaveLength(0);

    console.log('Performance Report:', results.summary);
    console.log('Recommendations:', results.recommendations);
  });
});
```

## Alarm Performance Testing

### Alarm Trigger Latency

Critical for user experience - alarms must trigger quickly:

```typescript
import { alarmPerformanceTester } from '../performance/performance-testing-utilities';

describe('Alarm Performance', () => {
  it('should trigger alarms within 100ms', async () => {
    const results = await alarmPerformanceTester.testAlarmTriggerLatency({
      iterations: 50,
      acceptableLatency: 100,
    });

    expect(results.passed).toBe(true);
    expect(results.averageLatency).toBeLessThan(100);
    expect(results.maxLatency).toBeLessThan(150);
  });

  it('should handle multiple alarms efficiently', async () => {
    const results = await alarmPerformanceTester.testAlarmTriggerLatency({
      alarmConfig: { multiple_alarms: true },
      iterations: 30,
    });

    expect(results.averageLatency).toBeLessThan(200); // Allow more time for multiple alarms
  });
});
```

### Background Performance

Test background processing efficiency:

```typescript
describe('Background Alarm Processing', () => {
  it('should minimize background CPU usage', async () => {
    const results = await alarmPerformanceTester.testBackgroundPerformance(60000); // 1 minute

    expect(results.averageCpuUsage).toBeLessThan(5); // 5% CPU
    expect(results.batteryDrainRate).toBeLessThan(3); // 3% per hour
    expect(results.peakMemoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
```

## API Performance Testing

### Individual Endpoint Performance

```typescript
import { apiPerformanceTester } from '../performance/performance-testing-utilities';

describe('API Endpoint Performance', () => {
  it('should load user alarms quickly', async () => {
    const results = await apiPerformanceTester.testEndpointPerformance('/api/alarms', 'GET', {
      iterations: 100,
      concurrent: 5,
      acceptableResponseTime: 500,
    });

    expect(results.passed).toBe(true);
    expect(results.averageResponseTime).toBeLessThan(500);
    expect(results.p95ResponseTime).toBeLessThan(750); // 95th percentile
    expect(results.successRate).toBeGreaterThan(0.99); // 99% success rate
  });

  it('should handle alarm creation under load', async () => {
    const results = await apiPerformanceTester.testEndpointPerformance('/api/alarms', 'POST', {
      iterations: 50,
      concurrent: 3,
      acceptableResponseTime: 1000,
    });

    expect(results.passed).toBe(true);
  });
});
```

### Critical Path Benchmarking

Test the most important API endpoints together:

```typescript
describe('Critical Path Performance', () => {
  it('should meet performance requirements for all critical paths', async () => {
    const results = await apiPerformanceTester.benchmarkCriticalPaths(
      [
        { name: 'load_alarms', endpoint: '/api/alarms', method: 'GET' },
        { name: 'create_alarm', endpoint: '/api/alarms', method: 'POST' },
        { name: 'update_alarm', endpoint: '/api/alarms/1', method: 'PUT' },
        { name: 'delete_alarm', endpoint: '/api/alarms/1', method: 'DELETE' },
        { name: 'join_battle', endpoint: '/api/battles/join', method: 'POST' },
        { name: 'user_profile', endpoint: '/api/user/profile', method: 'GET' },
      ],
      { acceptableResponseTime: 800 }
    );

    Object.entries(results).forEach(([path, result]) => {
      expect(result.passed).toBe(true);
      console.log(`${path}: ${result.averageResponseTime.toFixed(2)}ms avg`);
    });
  });
});
```

## Real-time Performance Testing

### WebSocket Performance

Test WebSocket connection performance for battles:

```typescript
import { realTimePerformanceTester } from '../performance/performance-testing-utilities';

describe('Real-time Performance', () => {
  it('should maintain low latency WebSocket communication', async () => {
    const results = await realTimePerformanceTester.testWebSocketPerformance({
      duration: 30000, // 30 seconds
      messageRate: 10, // 10 messages per second
      acceptableLatency: 150, // 150ms
    });

    expect(results.passed).toBe(true);
    expect(results.averageLatency).toBeLessThan(150);
    expect(results.maxLatency).toBeLessThan(300);
    expect(results.droppedMessages).toBe(0);
  });

  it('should handle battle sync accurately', async () => {
    const results = await realTimePerformanceTester.testBattleRealTimeSync(60000); // 1 minute battle

    expect(results.syncAccuracy).toBeGreaterThan(95); // 95% accuracy
    expect(results.averageLatency).toBeLessThan(200);
    expect(results.desyncEvents).toBeLessThan(5);
  });
});
```

## Mobile Performance Testing

### Device Profile Testing

Test performance across different device capabilities:

```typescript
import { mobilePerformanceTester } from '../performance/performance-testing-utilities';

describe('Mobile Device Performance', () => {
  it('should perform well on high-end devices', async () => {
    const results = await mobilePerformanceTester.testWithDeviceProfile({
      device: 'high-end',
      platform: 'ios',
      memoryLimitation: 200,
      cpuThrottling: 1.0,
      networkCondition: 'wifi',
      batteryOptimization: false,
    });

    expect(results.performanceScore).toBeGreaterThan(90);
    expect(results.frameDrops).toBeLessThan(10);
    expect(results.thermalThrottling).toBe(false);
  });

  it('should remain usable on low-end devices', async () => {
    const results = await mobilePerformanceTester.testWithDeviceProfile({
      device: 'low-end',
      platform: 'android',
      memoryLimitation: 50,
      cpuThrottling: 2.5,
      networkCondition: '3g',
      batteryOptimization: true,
    });

    expect(results.performanceScore).toBeGreaterThan(70); // Lower threshold for low-end
    expect(results.memoryUsage).toBeLessThan(50); // Within memory limit
    expect(results.batteryDrain).toBeLessThan(5); // 5% per hour max
  });
});
```

### Cross-Platform Performance

```typescript
describe('Cross-Platform Performance', () => {
  it('should perform consistently across platforms', async () => {
    const results = await mobilePerformanceTester.benchmarkAcrossDevices(
      async () => {
        // Simulate typical user session
        await testHelpers.navigateTo('/alarms');
        await relifeTestUtils.createTestAlarm();
        await relifeTestUtils.joinBattle('quick');
      },
      30000 // 30 second test
    );

    Object.entries(results).forEach(([device, result]) => {
      expect(result.performanceScore).toBeGreaterThan(60);
      console.log(`${device}: Score ${result.performanceScore}`);
    });
  });
});
```

## Memory Performance Testing

### Memory Leak Detection

```typescript
import { memoryTesting } from '../utils/performance-helpers';

describe('Memory Performance', () => {
  it('should not have memory leaks in alarm creation', async () => {
    const leakTest = await memoryTesting.testMemoryLeak(
      async () => {
        // Create and destroy alarm component multiple times
        const { unmount } = render(<AlarmCreator />);
        await relifeTestUtils.createTestAlarm();
        unmount();
      },
      {
        iterations: 50,
        tolerance: 5, // 5% increase allowed
        gcBetweenRuns: true
      }
    );

    expect(leakTest.hasLeak).toBe(false);
    expect(leakTest.leakRate).toBeLessThan(1024 * 1024); // 1MB per iteration max
  });

  it('should maintain stable memory during battle', async () => {
    const snapshots = await memoryTesting.monitor(30000, 1000); // 30 seconds, 1s intervals

    const memoryGrowth = snapshots.map(s => s.usedJSHeapSize);
    const maxMemory = Math.max(...memoryGrowth);
    const minMemory = Math.min(...memoryGrowth);
    const growthRate = (maxMemory - minMemory) / minMemory;

    expect(growthRate).toBeLessThan(0.2); // Less than 20% growth
  });
});
```

## Render Performance Testing

### Component Render Performance

```typescript
import { reactPerformance } from '../utils/performance-helpers';

describe('Component Render Performance', () => {
  it('should render alarm list quickly', async () => {
    const alarms = Array.from({ length: 20 }, (_, i) =>
      MockDataFactory.createAlarm({ label: `Alarm ${i}` })
    );

    const results = await reactPerformance.measureRender(
      () => render(<AlarmList alarms={alarms} />),
      { label: 'alarm-list' }
    );

    expect(results.mountTime).toBeLessThan(100); // 100ms mount time
    expect(results.renderTime).toBeLessThan(150); // Total render under 150ms
  });

  it('should handle re-renders efficiently', async () => {
    const results = await reactPerformance.measureRender(
      () => render(<AlarmCard alarm={mockAlarm} />),
      { rerenders: 10, label: 'alarm-card' }
    );

    expect(results.updateTime / results.rerenderCount).toBeLessThan(10); // <10ms per rerender
  });
});
```

### Stress Testing Components

```typescript
describe('Component Stress Testing', () => {
  it('should handle stress conditions', async () => {
    const stressResult = await reactPerformance.stressTest(
      () => render(<ComplexDashboard />),
      {
        iterations: 100,
        maxRenderTime: 16, // 60fps target
        label: 'dashboard-stress'
      }
    );

    expect(stressResult.passed).toBe(true);
    expect(stressResult.violations).toHaveLength(0);
    expect(stressResult.results.averageTime).toBeLessThan(16);
  });
});
```

## Performance Monitoring and Alerts

### Setup Performance Monitoring

```typescript
import { performanceMonitor } from '../performance/performance-testing-utilities';

beforeEach(() => {
  // Configure performance thresholds
  performanceMonitor.setThreshold('api_response_time', 1000);
  performanceMonitor.setThreshold('alarm_trigger_latency', 100);
  performanceMonitor.setThreshold('memory_usage', 50 * 1024 * 1024);
  performanceMonitor.setThreshold('websocket_latency', 200);
});

afterEach(() => {
  // Check for performance violations
  const alerts = performanceMonitor.getAlerts();
  if (alerts.length > 0) {
    console.warn('Performance alerts:', alerts);
  }
});
```

### Generate Performance Reports

```typescript
describe('Performance Reporting', () => {
  it('should generate comprehensive performance report', async () => {
    // Run various operations
    await relifeTestUtils.createTestAlarm();
    await relifeTestUtils.joinBattle('quick');
    await apiClient.request('GET', '/api/alarms');

    const report = performanceTestSuite.generateReport();

    expect(report.overallHealth).toBeOneOf(['excellent', 'good']);
    expect(Object.keys(report.metrics)).toContain('alarm_trigger_latency');
    expect(Object.keys(report.metrics)).toContain('api_response_time');

    // Log report for analysis
    console.log('Performance Report:', JSON.stringify(report, null, 2));
  });
});
```

## Performance Optimization Techniques

### Lazy Loading Testing

```typescript
describe('Lazy Loading Performance', () => {
  it('should load components on demand', async () => {
    const { result, renderTime } = await testHelpers.measureRenderTime(async () => {
      render(<LazyDashboard />);

      // Wait for lazy components to load
      await testHelpers.waitForElement(() =>
        screen.queryByTestId('dashboard-content')
      );
    });

    expect(renderTime).toBeLessThan(2000); // Initial load under 2s
  });
});
```

### Caching Performance

```typescript
describe('Caching Performance', () => {
  it('should improve performance with caching', async () => {
    // First request (cache miss)
    const firstRequest = await testHelpers.measureInteractionTime(async () => {
      await apiClient.request('GET', '/api/alarms');
    });

    // Second request (cache hit)
    const secondRequest = await testHelpers.measureInteractionTime(async () => {
      await apiClient.request('GET', '/api/alarms');
    });

    expect(secondRequest).toBeLessThan(firstRequest * 0.5); // 50% faster with cache
  });
});
```

## Performance Testing Best Practices

### 1. Set Realistic Thresholds

```typescript
// ✅ Good - realistic thresholds based on requirements
expect(results.averageLatency).toBeLessThan(100); // Alarm trigger requirement
expect(results.apiResponseTime).toBeLessThan(500); // User experience threshold

// ❌ Bad - arbitrary or unrealistic thresholds
expect(results.averageLatency).toBeLessThan(1); // Unrealistic
```

### 2. Test Under Various Conditions

```typescript
describe('Performance Under Various Conditions', () => {
  it('should perform well with slow network', async () => {
    apiClient.setScenario('slow');
    // Test performance under slow conditions
  });

  it('should perform well with high memory pressure', async () => {
    // Simulate high memory usage
    const largeData = new Array(1000000).fill('test data');
    // Run performance tests
  });
});
```

### 3. Use Proper Statistical Analysis

```typescript
describe('Statistical Performance Analysis', () => {
  it('should have consistent performance', async () => {
    const results = await performanceCore.benchmark(() => relifeTestUtils.createTestAlarm(), {
      iterations: 100,
    });

    expect(results.standardDeviation).toBeLessThan(results.averageTime * 0.2); // Low variance
    expect(results.successRate).toBeGreaterThan(0.99); // High reliability
  });
});
```

### 4. Monitor Performance Regressions

```typescript
describe('Performance Regression Detection', () => {
  it('should detect performance regressions', async () => {
    const baselineFile = path.join(__dirname, 'performance-baseline.json');
    const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));

    const currentResults = await performanceTestSuite.runComprehensiveTest();

    // Compare with baseline (allow 10% regression)
    expect(currentResults.summary.averageLatency).toBeLessThan(baseline.averageLatency * 1.1);
  });
});
```

## Performance Testing CI/CD Integration

### Automated Performance Testing

```typescript
// In CI environment
if (process.env.CI) {
  describe('CI Performance Tests', () => {
    it('should meet performance requirements in CI', async () => {
      const results = await performanceTestSuite.runComprehensiveTest({
        duration: 10000, // Shorter duration for CI
      });

      // Fail build if performance requirements not met
      expect(results.passed).toBe(true);
    });
  });
}
```

### Performance Budgets

```json
{
  "performance-budgets": {
    "alarm-trigger-latency": 100,
    "api-response-time": 500,
    "component-render-time": 50,
    "bundle-size": 1048576,
    "memory-usage": 52428800
  }
}
```

## Troubleshooting Performance Issues

### 1. Identify Bottlenecks

```typescript
// Use detailed performance monitoring
const detailedResults = await performanceCore.benchmark(
  async () => {
    console.time('total-operation');
    console.time('step-1');
    await step1();
    console.timeEnd('step-1');

    console.time('step-2');
    await step2();
    console.timeEnd('step-2');

    console.timeEnd('total-operation');
  },
  { iterations: 10 }
);
```

### 2. Profile Memory Usage

```typescript
// Monitor memory throughout test execution
const memoryProfiler = await memoryTesting.monitor(30000, 500);
const memorySpikes = memoryProfiler.filter(
  (snapshot, i) => i > 0 && snapshot.usedJSHeapSize > memoryProfiler[i - 1].usedJSHeapSize * 1.2
);

console.log('Memory spikes detected:', memorySpikes);
```

### 3. Analyze Performance Trends

```typescript
// Generate trend analysis
const performanceHistory = performanceMonitor.getCallHistory();
const trends = analyzePerformanceTrends(performanceHistory.metrics);

console.log('Performance trends:', trends);
```

## Next Steps

- Review [Integration Testing Guide](./integration-testing-guide.md) for E2E performance testing
- Check [Mobile Testing Guide](./mobile-testing-guide.md) for mobile-specific performance
  optimization
- See [Troubleshooting Guide](./troubleshooting.md) for performance debugging techniques

---

This guide provides comprehensive coverage of performance testing in the Relife application. Use
these utilities and patterns to ensure optimal performance across all user scenarios and device
types.
