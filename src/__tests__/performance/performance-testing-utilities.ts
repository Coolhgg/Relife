/**
 * Comprehensive performance testing utilities and monitoring mocks for Relife
 * Extends the basic performance helpers with app-specific testing capabilities
 */

import {
  performanceCore,
  memoryTesting,
  PerformanceBenchmark,
} from '../utils/performance-helpers';

// Enhanced performance interfaces for Relife
export interface AlarmPerformanceMetrics {
  alarmCheckTime: number;
  alarmTriggerTime: number;
  audioLoadTime: number;
  vibrationLatency: number;
  batteryImpact: number;
  backgroundProcessingTime: number;
}

export interface ApiPerformanceMetrics {
  requestDuration: number;
  responseSize: number;
  firstByteTime: number;
  dnsLookupTime: number;
  connectionTime: number;
  sslTime: number;
  transferTime: number;
  retryCount: number;
  cacheHitRate: number;
}

export interface RealTimePerformanceMetrics {
  connectionTime: number;
  messageLatency: number;
  reconnectionTime: number;
  messageQueueLength: number;
  droppedMessages: number;
  bandwidthUsage: number;
}

export interface MobilePerformanceProfile {
  device: 'high-end' | 'mid-range' | 'low-end';
  platform: 'ios' | 'android' | 'web';
  memoryLimitation: number;
  cpuThrottling: number;
  networkCondition: '4g' | '3g' | '2g' | 'slow-3g' | 'wifi';
  batteryOptimization: boolean;
}

// Performance monitoring mock service
export class MockPerformanceMonitor {
  private static instance: MockPerformanceMonitor;
  private metrics: Map<string, unknown[]> = new Map();
  private alerts: Array<{ type: string; message: string; timestamp: number }> = [];
  private thresholds: Map<string, number> = new Map([
    ['api_response_time', 1000], // 1s
    ['alarm_trigger_latency', 100], // 100ms
    ['memory_usage', 50 * 1024 * 1024], // 50MB
    ['battery_drain_rate', 5], // 5% per hour
    ['websocket_latency', 200], // 200ms
  ]);

  static getInstance(): MockPerformanceMonitor {
    if (!MockPerformanceMonitor.instance) {
      MockPerformanceMonitor.instance = new MockPerformanceMonitor();
    }
    return MockPerformanceMonitor.instance;
  }

  // Record performance metric
  recordMetric(category: string, metric: unknown): void {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }

    const timestampedMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.get(category)!.push(timestampedMetric);

    // Check for threshold violations
    this.checkThresholds(category, metric);

    // Simulate real monitoring behavior
    setTimeout(() => {
      this.cleanupOldMetrics(category);
    }, 0);
  }

  // Check metric thresholds and generate alerts
  private checkThresholds(category: string, metric: unknown): void {
    const threshold = this.thresholds.get(category);
    if (!threshold) return;

    const metricValue = this.extractMetricValue(category, metric);
    if (metricValue && metricValue > threshold) {
      this.alerts.push({
        type: 'threshold_violation',
        message: `${category} exceeded threshold: ${metricValue} > ${threshold}`,
        timestamp: Date.now(),
      });
    }
  }

  // Extract comparable value from metric
  private extractMetricValue(category: string, metric: unknown): number | null {
    switch (category) {
      case 'api_response_time':
        return metric.requestDuration;
      case 'alarm_trigger_latency':
        return metric.alarmTriggerTime;
      case 'memory_usage':
        return metric.usedJSHeapSize;
      case 'battery_drain_rate':
        return metric.batteryImpact;
      case 'websocket_latency':
        return metric.messageLatency;
      default:
        return null;
    }
  }

  // Get performance summary
  getPerformanceSummary(category?: string): any {
    if (category) {
      const categoryMetrics = this.metrics.get(category) || [];
      return this.calculateSummary(categoryMetrics);
    }

    const summary: Record<string, unknown> = {};
    for (const [cat, metrics] of this.metrics.entries()) {
      summary[cat] = this.calculateSummary(metrics);
    }
    return summary;
  }

  private calculateSummary(metrics: unknown[]): any {
    if (metrics.length === 0) return null;

    const recent = metrics.slice(-100); // Last 100 metrics
    return {
      count: recent.length,
      latest: recent[recent.length - 1],
      averageTimestamp: recent.reduce((sum, m) => sum + m.timestamp, 0) / recent.length,
      timeRange: {
        start: recent[0].timestamp,
        end: recent[recent.length - 1].timestamp,
      },
    };
  }

  // Get performance alerts
  getAlerts(since?: number): unknown[] {
    const cutoff = since || Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    return this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  // Set performance threshold
  setThreshold(category: string, value: number): void {
    this.thresholds.set(category, value);
  }

  // Clean up old metrics (keep last 1000 per category)
  private cleanupOldMetrics(category: string): void {
    const metrics = this.metrics.get(category);
    if (metrics && metrics.length > 1000) {
      this.metrics.set(category, metrics.slice(-1000));
    }
  }

  // Reset all data
  reset(): void {
    this.metrics.clear();
    this.alerts.length = 0;
    this.thresholds.clear();
  }

  // Get call history for testing
  getCallHistory(): { metrics: Map<string, unknown[]>; alerts: unknown[] } {
    return {
      metrics: new Map(this.metrics),
      alerts: [...this.alerts],
    };
  }
}

// Alarm-specific performance testing
export class AlarmPerformanceTester {
  private monitor = MockPerformanceMonitor.getInstance();

  async testAlarmTriggerLatency(alarmConfig: unknown,
    options: { iterations?: number; acceptableLatency?: number } = {}
  ): Promise<{
    passed: boolean;
    averageLatency: number;
    maxLatency: number;
    results: AlarmPerformanceMetrics[];
  }> {
    const { iterations = 50, acceptableLatency = 100 } = options;
    const results: AlarmPerformanceMetrics[] = [];

    for (let i = 0; i < iterations; i++) {
      const metrics = await this.measureAlarmTrigger(alarmConfig);
      results.push(metrics);
      this.monitor.recordMetric('alarm_trigger_latency', metrics);

      // Small delay between tests to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const latencies = results.map(r => r.alarmTriggerTime);
    const averageLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);

    return {
      passed:
        averageLatency <= acceptableLatency && maxLatency <= acceptableLatency * 1.5,
      averageLatency,
      maxLatency,
      results,
    };
  }

  private async measureAlarmTrigger(alarmConfig: unknown): Promise<AlarmPerformanceMetrics> {
    const startTime = performance.now();

    // Simulate alarm checking
    const alarmCheckStart = performance.now();
    await this.simulateAlarmCheck(alarmConfig);
    const alarmCheckTime = performance.now() - alarmCheckStart;

    // Simulate alarm trigger
    const triggerStart = performance.now();
    await this.simulateAlarmTrigger();
    const alarmTriggerTime = performance.now() - triggerStart;

    // Simulate audio loading
    const audioStart = performance.now();
    await this.simulateAudioLoad();
    const audioLoadTime = performance.now() - audioStart;

    return {
      alarmCheckTime,
      alarmTriggerTime,
      audioLoadTime,
      vibrationLatency: Math.random() * 20 + 10, // 10-30ms
      batteryImpact: Math.random() * 0.5 + 0.1, // 0.1-0.6%
      backgroundProcessingTime: performance.now() - startTime,
    };
  }

  private async simulateAlarmCheck(_config: unknown): Promise<void> {
    // Simulate various alarm check scenarios
    const complexity = _config?.multiple_alarms ? 50 : 20;
    await new Promise(resolve => setTimeout(resolve, Math.random() * complexity + 10));
  }

  private async simulateAlarmTrigger(): Promise<void> {
    // Simulate alarm trigger with realistic delays
    await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 20));
  }

  private async simulateAudioLoad(): Promise<void> {
    // Simulate audio file loading
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  }

  async testBackgroundPerformance(duration: number = 10000): Promise<{
    averageCpuUsage: number;
    peakMemoryUsage: number;
    batteryDrainRate: number;
    backgroundTaskCount: number;
  }> {
    const startTime = Date.now();
    const memorySnapshots: unknown[] = [];
    let backgroundTaskCount = 0;

    // Simulate background alarm monitoring
    const interval = setInterval(() => {
      memorySnapshots.push(memoryTesting.snapshot('background'));
      backgroundTaskCount++;
    }, 1000);

    await new Promise(resolve => setTimeout(resolve, duration));
    clearInterval(interval);

    const peakMemoryUsage = Math.max(...memorySnapshots.map(s => s.usedJSHeapSize));

    const averageCpuUsage = Math.random() * 5 + 2; // 2-7%
    const batteryDrainRate = Math.random() * 2 + 1; // 1-3% per hour

    this.monitor.recordMetric('background_performance', {
      duration: Date.now() - startTime,
      averageCpuUsage,
      peakMemoryUsage,
      batteryDrainRate,
      backgroundTaskCount,
    });

    return {
      averageCpuUsage,
      peakMemoryUsage,
      batteryDrainRate,
      backgroundTaskCount,
    };
  }
}

// API performance testing utilities
export class ApiPerformanceTester {
  private monitor = MockPerformanceMonitor.getInstance();

  async testEndpointPerformance(
    endpoint: string,
    method: string = 'GET',
    options: {
      iterations?: number;
      concurrent?: number;
      acceptableResponseTime?: number;
    } = {}
  ): Promise<{
    passed: boolean;
    averageResponseTime: number;
    p95ResponseTime: number;
    successRate: number;
    results: ApiPerformanceMetrics[];
  }> {
    const { iterations = 100, concurrent = 5, acceptableResponseTime = 1000 } = options;
    const results: ApiPerformanceMetrics[] = [];

    // Run tests in batches for concurrency
    const batchSize = concurrent;
    const batches = Math.ceil(iterations / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const batchPromises: Promise<ApiPerformanceMetrics>[] = [];
      const remainingIterations = Math.min(batchSize, iterations - batch * batchSize);

      for (let i = 0; i < remainingIterations; i++) {
        batchPromises.push(this.measureApiCall(endpoint, method));
      }

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Record all results
    results.forEach(result => {
      this.monitor.recordMetric('api_response_time', result);
    });

    // Calculate statistics
    const responseTimes = results.map(r => r.requestDuration);
    const averageResponseTime =
      responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const successRate =
      results.filter(r => r.requestDuration < acceptableResponseTime * 2).length /
      results.length;

    return {
      passed:
        averageResponseTime <= acceptableResponseTime &&
        p95ResponseTime <= acceptableResponseTime * 1.5,
      averageResponseTime,
      p95ResponseTime,
      successRate,
      results,
    };
  }

  private async measureApiCall(
    endpoint: string,
    method: string
  ): Promise<ApiPerformanceMetrics> {
    const startTime = performance.now();

    // Simulate realistic API call timings
    const dnsLookupTime = Math.random() * 20 + 5; // 5-25ms
    const connectionTime = Math.random() * 50 + 20; // 20-70ms
    const sslTime = Math.random() * 100 + 50; // 50-150ms
    const firstByteTime = Math.random() * 200 + 100; // 100-300ms
    const transferTime = Math.random() * 100 + 50; // 50-150ms

    await new Promise(resolve =>
      setTimeout(
        resolve,
        dnsLookupTime + connectionTime + sslTime + firstByteTime + transferTime
      )
    );

    const requestDuration = performance.now() - startTime;
    const responseSize = Math.floor(Math.random() * 10000 + 1000); // 1-11KB

    return {
      requestDuration,
      responseSize,
      firstByteTime,
      dnsLookupTime,
      connectionTime,
      sslTime,
      transferTime,
      retryCount: Math.random() > 0.95 ? 1 : 0, // 5% retry rate
      cacheHitRate: Math.random() > 0.7 ? 1 : 0, // 30% cache hit
    };
  }

  async benchmarkCriticalPaths(
    paths: Array<{ name: string; endpoint: string; method?: string }>,
    options: { acceptableResponseTime?: number } = {}
  ): Promise<Record<string, unknown>> {
    const { acceptableResponseTime = 500 } = options;
    const results: Record<string, unknown> = {};

    for (const path of paths) {
      const result = await this.testEndpointPerformance(path.endpoint, path.method, {
        iterations: 50,
        acceptableResponseTime,
      });
      results[path.name] = result;
    }

    return results;
  }
}

// Real-time performance testing
export class RealTimePerformanceTester {
  private monitor = MockPerformanceMonitor.getInstance();

  async testWebSocketPerformance(
    options: {
      duration?: number;
      messageRate?: number;
      acceptableLatency?: number;
    } = {}
  ): Promise<{
    passed: boolean;
    averageLatency: number;
    maxLatency: number;
    messagesSent: number;
    messagesReceived: number;
    droppedMessages: number;
  }> {
    const { duration = 10000, messageRate = 10, acceptableLatency = 200 } = options;
    const latencies: number[] = [];
    let messagesSent = 0;
    let messagesReceived = 0;
    let droppedMessages = 0;

    const startTime = Date.now();
    const interval = setInterval(async () => {
      const messageStart = performance.now();

      // Simulate message send and receive
      await this.simulateMessageRoundTrip();

      const latency = performance.now() - messageStart;
      latencies.push(latency);
      messagesSent++;

      if (latency < acceptableLatency * 3) {
        messagesReceived++;
      } else {
        droppedMessages++;
      }

      this.monitor.recordMetric('websocket_latency', {
        messageLatency: latency,
        connectionTime: 0, // Already connected
        messageQueueLength: Math.floor(Math.random() * 10),
        droppedMessages,
        bandwidthUsage: Math.random() * 1000 + 500, // bytes
      });
    }, 1000 / messageRate);

    await new Promise(resolve => setTimeout(resolve, duration));
    clearInterval(interval);

    const averageLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);

    return {
      passed: averageLatency <= acceptableLatency && droppedMessages === 0,
      averageLatency,
      maxLatency,
      messagesSent,
      messagesReceived,
      droppedMessages,
    };
  }

  private async simulateMessageRoundTrip(): Promise<void> {
    // Simulate realistic WebSocket message timing
    const networkLatency = Math.random() * 100 + 50; // 50-150ms
    const processingTime = Math.random() * 20 + 5; // 5-25ms

    await new Promise(resolve => setTimeout(resolve, networkLatency + processingTime));
  }

  async testBattleRealTimeSync(battleDuration: number = 30000): Promise<{
    syncAccuracy: number;
    averageLatency: number;
    desyncEvents: number;
    participantCount: number;
  }> {
    const participants = Math.floor(Math.random() * 8) + 2; // 2-10 participants
    const syncEvents: number[] = [];
    let desyncEvents = 0;

    const startTime = Date.now();

    // Simulate battle sync events
    const interval = setInterval(() => {
      const syncStart = performance.now();

      // Simulate sync with multiple participants
      const participantLatencies = Array.from(
        { length: participants },
        () => Math.random() * 150 + 50 // 50-200ms per participant
      );

      const maxLatency = Math.max(...participantLatencies);
      const syncLatency = maxLatency + Math.random() * 50; // Additional processing

      syncEvents.push(syncLatency);

      // Check for desync (when participants are too far apart)
      const latencySpread = maxLatency - Math.min(...participantLatencies);
      if (latencySpread > 500) {
        // 500ms threshold
        desyncEvents++;
      }
    }, 2000); // Sync every 2 seconds

    await new Promise(resolve => setTimeout(resolve, battleDuration));
    clearInterval(interval);

    const averageLatency =
      syncEvents.reduce((sum, l) => sum + l, 0) / syncEvents.length;
    const syncAccuracy = (1 - desyncEvents / syncEvents.length) * 100;

    this.monitor.recordMetric('battle_sync', {
      battleDuration,
      syncAccuracy,
      averageLatency,
      desyncEvents,
      participantCount: participants,
    });

    return {
      syncAccuracy,
      averageLatency,
      desyncEvents,
      participantCount: participants,
    };
  }
}

// Mobile performance testing with device profiles
export class MobilePerformanceTester {
  private monitor = MockPerformanceMonitor.getInstance();

  async testWithDeviceProfile(
    profile: MobilePerformanceProfile,
    testDuration: number = 30000
  ): Promise<{
    performanceScore: number;
    memoryUsage: number;
    batteryDrain: number;
    thermalThrottling: boolean;
    frameDrops: number;
  }> {
    // Apply device-specific throttling
    const cpuMultiplier = this.getCpuMultiplier(profile);
    const memoryPressure = this.getMemoryPressure(profile);

    const startTime = Date.now();
    let frameDrops = 0;
    const memorySnapshots: number[] = [];

    const interval = setInterval(async () => {
      // Simulate frame rendering with device limitations
      const frameStart = performance.now();

      // Simulate work with CPU throttling
      const workDuration = (Math.random() * 16 + 8) * cpuMultiplier; // Target 60fps with throttling
      await new Promise(resolve => setTimeout(resolve, workDuration));

      const frameTime = performance.now() - frameStart;
      if (frameTime > 16.67) {
        // Missed 60fps target
        frameDrops++;
      }

      // Track memory with device pressure
      const memoryUsage = (Math.random() * 20 + 10) * memoryPressure; // MB
      memorySnapshots.push(memoryUsage);
    }, 16.67); // 60fps target

    await new Promise(resolve => setTimeout(resolve, testDuration));
    clearInterval(interval);

    const averageMemory =
      memorySnapshots.reduce((sum, m) => sum + m, 0) / memorySnapshots.length;
    const batteryDrain = this.calculateBatteryDrain(profile, testDuration);
    const thermalThrottling = profile.device === 'low-end' && batteryDrain > 2;

    const performanceScore = this.calculatePerformanceScore({
      frameDrops,
      memoryUsage: averageMemory,
      batteryDrain,
      thermalThrottling,
      profile,
    });

    this.monitor.recordMetric('mobile_performance', {
      profile,
      performanceScore,
      memoryUsage: averageMemory,
      batteryDrain,
      thermalThrottling,
      frameDrops,
    });

    return {
      performanceScore,
      memoryUsage: averageMemory,
      batteryDrain,
      thermalThrottling,
      frameDrops,
    };
  }

  private getCpuMultiplier(profile: MobilePerformanceProfile): number {
    switch (profile.device) {
      case 'high-end':
        return 1.0;
      case 'mid-range':
        return 1.5;
      case 'low-end':
        return 2.5;
      default:
        return 1.0;
    }
  }

  private getMemoryPressure(profile: MobilePerformanceProfile): number {
    switch (profile.device) {
      case 'high-end':
        return 1.0;
      case 'mid-range':
        return 1.3;
      case 'low-end':
        return 2.0;
      default:
        return 1.0;
    }
  }

  private calculateBatteryDrain(
    profile: MobilePerformanceProfile,
    duration: number
  ): number {
    const baseRate = profile.batteryOptimization ? 0.5 : 1.0; // %/hour
    const deviceMultiplier = profile.device === 'low-end' ? 1.5 : 1.0;
    const networkMultiplier = profile.networkCondition === 'wifi' ? 0.8 : 1.2;

    return (
      (baseRate * deviceMultiplier * networkMultiplier * duration) / (60 * 60 * 1000)
    );
  }

  private calculatePerformanceScore(metrics: {
    frameDrops: number;
    memoryUsage: number;
    batteryDrain: number;
    thermalThrottling: boolean;
    profile: MobilePerformanceProfile;
  }): number {
    let score = 100;

    // Deduct for frame drops
    score -= Math.min(metrics.frameDrops * 2, 40);

    // Deduct for high memory usage
    if (metrics.memoryUsage > metrics.profile.memoryLimitation) {
      score -= 20;
    }

    // Deduct for battery drain
    if (metrics.batteryDrain > 5) {
      // More than 5% per hour
      score -= 15;
    }

    // Deduct for thermal throttling
    if (metrics.thermalThrottling) {
      score -= 25;
    }

    return Math.max(score, 0);
  }

  async benchmarkAcrossDevices(
    testFunction: () => Promise<void>,
    duration: number = 10000
  ): Promise<Record<string, unknown>> {
    const profiles: MobilePerformanceProfile[] = [
      {
        device: 'high-end',
        platform: 'ios',
        memoryLimitation: 200,
        cpuThrottling: 1.0,
        networkCondition: 'wifi',
        batteryOptimization: false,
      },
      {
        device: 'mid-range',
        platform: 'android',
        memoryLimitation: 100,
        cpuThrottling: 1.3,
        networkCondition: '4g',
        batteryOptimization: true,
      },
      {
        device: 'low-end',
        platform: 'android',
        memoryLimitation: 50,
        cpuThrottling: 2.0,
        networkCondition: '3g',
        batteryOptimization: true,
      },
    ];

    const results: Record<string, unknown> = {};

    for (const profile of profiles) {
      const key = `${profile.device}-${profile.platform}`;
      results[key] = await this.testWithDeviceProfile(profile, duration);
    }

    return results;
  }
}

// Comprehensive performance test suite
export class PerformanceTestSuite {
  private alarmTester = new AlarmPerformanceTester();
  private apiTester = new ApiPerformanceTester();
  private realTimeTester = new RealTimePerformanceTester();
  private mobileTester = new MobilePerformanceTester();
  private monitor = MockPerformanceMonitor.getInstance();

  async runComprehensiveTest(
    options: {
      includeAlarms?: boolean;
      includeApi?: boolean;
      includeRealTime?: boolean;
      includeMobile?: boolean;
      duration?: number;
    } = {}
  ): Promise<{
    passed: boolean;
    summary: Record<string, unknown>;
    violations: string[];
    recommendations: string[];
  }> {
    const {
      includeAlarms = true,
      includeApi = true,
      includeRealTime = true,
      includeMobile = true,
      duration = 30000,
    } = options;

    const results: Record<string, unknown> = {};
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Run alarm performance tests
    if (includeAlarms) {
      const alarmResults = await this.alarmTester.testAlarmTriggerLatency({});
      results.alarms = alarmResults;

      if (!alarmResults.passed) {
        violations.push(`Alarm trigger latency exceeded acceptable threshold`);
        recommendations.push(`Optimize alarm checking logic to reduce latency`);
      }
    }

    // Run API performance tests
    if (includeApi) {
      const apiResults = await this.apiTester.benchmarkCriticalPaths([
        { name: 'load_alarms', endpoint: '/api/alarms', method: 'GET' },
        { name: 'create_alarm', endpoint: '/api/alarms', method: 'POST' },
        { name: 'join_battle', endpoint: '/api/battles/join', method: 'POST' },
      ]);
      results.api = apiResults;

      Object.entries(apiResults).forEach(([path, result]: [string, any]) => {
        if (!result.passed) {
          violations.push(`API endpoint ${path} performance below threshold`);
          recommendations.push(`Consider caching or optimization for ${path}`);
        }
      });
    }

    // Run real-time performance tests
    if (includeRealTime) {
      const realTimeResults = await this.realTimeTester.testBattleRealTimeSync();
      results.realTime = realTimeResults;

      if (realTimeResults.syncAccuracy < 95) {
        violations.push(`Real-time sync accuracy below 95%`);
        recommendations.push(
          `Implement better network _error handling and retry logic`
        );
      }
    }

    // Run mobile performance tests
    if (includeMobile) {
      const mobileResults = await this.mobileTester.benchmarkAcrossDevices(async () => {
        /* Test function */
      }, duration);
      results.mobile = mobileResults;

      Object.entries(mobileResults).forEach(([device, result]: [string, any]) => {
        if (result.performanceScore < 80) {
          violations.push(`Mobile performance on ${device} below acceptable score`);
          recommendations.push(`Optimize for lower-end devices`);
        }
      });
    }

    const passed = violations.length === 0;

    return {
      passed,
      summary: results,
      violations,
      recommendations,
    };
  }

  // Generate performance report
  generateReport(): {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    metrics: Record<string, unknown>;
    trends: Record<string, 'improving' | 'stable' | 'degrading'>;
    alerts: unknown[];
  } {
    const summary = this.monitor.getPerformanceSummary();
    const alerts = this.monitor.getAlerts();

    // Calculate overall health based on recent metrics and alerts
    const overallHealth = this.calculateOverallHealth(summary, alerts);

    // Analyze trends (simplified - in real implementation would use historical data)
    const trends: Record<string, 'improving' | 'stable' | 'degrading'> = {};
    Object.keys(summary).forEach(key => {
      trends[key] = 'stable'; // Simplified - would calculate based on historical data
    });

    return {
      overallHealth,
      metrics: summary,
      trends,
      alerts,
    };
  }

  private calculateOverallHealth(
    summary: Record<string, unknown>,
    alerts: unknown[]
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    const recentAlerts = alerts.filter(a => a.timestamp > Date.now() - 60 * 60 * 1000);

    if (recentAlerts.length === 0) return 'excellent';
    if (recentAlerts.length <= 2) return 'good';
    if (recentAlerts.length <= 5) return 'fair';
    return 'poor';
  }

  // Reset all performance data
  reset(): void {
    this.monitor.reset();
  }
}

// Export utilities and classes
export {
  MockPerformanceMonitor,
  AlarmPerformanceTester,
  ApiPerformanceTester,
  RealTimePerformanceTester,
  MobilePerformanceTester,
  PerformanceTestSuite,
};

// Create singleton instances for easy use
export const performanceMonitor = MockPerformanceMonitor.getInstance();
export const alarmPerformanceTester = new AlarmPerformanceTester();
export const apiPerformanceTester = new ApiPerformanceTester();
export const realTimePerformanceTester = new RealTimePerformanceTester();
export const mobilePerformanceTester = new MobilePerformanceTester();
export const performanceTestSuite = new PerformanceTestSuite();

// Export default
export default {
  MockPerformanceMonitor,
  AlarmPerformanceTester,
  ApiPerformanceTester,
  RealTimePerformanceTester,
  MobilePerformanceTester,
  PerformanceTestSuite,
  performanceMonitor,
  alarmPerformanceTester,
  apiPerformanceTester,
  realTimePerformanceTester,
  mobilePerformanceTester,
  performanceTestSuite,
};
