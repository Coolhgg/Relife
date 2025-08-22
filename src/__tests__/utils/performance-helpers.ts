/// <reference lib="dom" />
// Performance testing utilities for measuring render times, memory usage, and optimization

import { act } from 'react';
import { TEST_CONSTANTS } from './index';

// Performance measurement interfaces
export interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface RenderPerformanceResult {
  renderTime: number;
  mountTime: number;
  updateTime: number;
  unmountTime: number;
  totalTime: number;
  rerenderCount: number;
}

export interface MemorySnapshot {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
  label?: string;
}

export interface PerformanceBenchmark {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  successRate: number;
}

// Core performance measurement utilities
export const _performanceCore = {
  // Enhanced performance marking with metadata
  mark: (name: string, metadata?: Record<string, any>): PerformanceMark => {
    const startTime = performance.now();
    performance.mark(name);

    return {
      name,
      startTime,
      metadata,
    };
  },

  // Measure time between two marks
  measure: (markName: string, startMark?: string, endMark?: string): number => {
    const measureName = `${markName}-measure`;

    if (startMark && endMark) {
      performance.measure(measureName, startMark, endMark);
    } else {
      performance.measure(measureName, markName);
    }

    const entries = performance.getEntriesByName(measureName);
    return entries.length > 0 ? entries[entries.length - 1].duration : 0;
  },

  // Time a function execution
  timeFunction: async <T>(
    fn: () => T | Promise<T>,
    label?: string
  ): Promise<{ result: T; duration: number }> => {
    const startTime = performance.now();
    const result = await fn();
    const duration = performance.now() - startTime;

    if (label) {
      console.log(`Performance: ${label} took ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  },

  // Benchmark a function multiple times
  benchmark: async <T>(
    fn: () => T | Promise<T>,
    options: {
      iterations?: number;
      warmup?: number;
      name?: string;
    } = {}
  ): Promise<PerformanceBenchmark> => {
    const { iterations = 100, warmup = 10, name = 'benchmark' } = options;
    const times: number[] = [];
    let successCount = 0;

    // Warmup runs
    for (let i = 0; i < warmup; i++) {
      try {
        await fn();
      } catch (error) {
        // Ignore warmup errors
      }
    }

    // Actual benchmark runs
    for (let i = 0; i < iterations; i++) {
      try {
        const { duration } = await performanceCore.timeFunction(fn);
        times.push(duration);
        successCount++;
      } catch (error) {
        times.push(Infinity); // Mark failed runs
      }
    }

    const validTimes = times.filter(t => t !== Infinity);
    const totalTime = validTimes.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / validTimes.length;
    const minTime = Math.min(...validTimes);
    const maxTime = Math.max(...validTimes);

    // Calculate standard deviation
    const variance =
      validTimes.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) /
      validTimes.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      name,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      successRate: successCount / iterations,
    };
  },

  // Clear all performance marks and measures
  clearMarks: (pattern?: string): void => {
    if (pattern) {
      const entries = performance.getEntriesByType('mark');
      entries
        .filter(entry => entry.name.includes(pattern))
        .forEach(entry => performance.clearMarks(entry.name));
    } else {
      performance.clearMarks();
      performance.clearMeasures();
    }
  },
};

// React component performance testing
export const _reactPerformance = {
  // Measure component render performance
  measureRender: async (
    renderComponent: () => void | Promise<void>,
    options: {
      rerenders?: number;
      label?: string;
    } = {}
  ): Promise<RenderPerformanceResult> => {
    const { rerenders = 0, label = 'component' } = options;

    let mountTime = 0;
    let updateTime = 0;
    const unmountTime = 0;
    let rerenderCount = 0;

    // Measure initial mount
    const mountResult = await performanceCore.timeFunction(async () => {
      await act(async () => {
        await renderComponent();
      });
    }, `${label}-mount`);
    mountTime = mountResult.duration;

    // Measure rerenders if specified
    if (rerenders > 0) {
      for (let i = 0; i < rerenders; i++) {
        const updateResult = await performanceCore.timeFunction(async () => {
          await act(async () => {
            await renderComponent();
          });
        }, `${label}-update-${i}`);
        updateTime += updateResult.duration;
        rerenderCount++;
      }
    }

    const renderTime = mountTime + updateTime;
    const totalTime = renderTime + unmountTime;

    return {
      renderTime,
      mountTime,
      updateTime,
      unmountTime,
      totalTime,
      rerenderCount,
    };
  },

  // Test component performance under stress
  stressTest: async (
    renderComponent: () => void | Promise<void>,
    options: {
      iterations?: number;
      concurrency?: number;
      maxRenderTime?: number;
      label?: string;
    } = {}
  ): Promise<{
    passed: boolean;
    results: PerformanceBenchmark;
    violations: Array<{ iteration: number; time: number }>;
  }> => {
    const {
      iterations = 50,
      concurrency = 1,
      maxRenderTime = 16, // 60fps target
      label = 'stress-test',
    } = options;

    const violations: Array<{ iteration: number; time: number }> = [];

    const results = await performanceCore.benchmark(
      async () => {
        const result = await reactPerformance.measureRender(renderComponent, { label });
        return result.renderTime;
      },
      { iterations, name: label }
    );

    // Check for violations
    const entries = performance.getEntriesByType('measure');
    entries.forEach((entry, index) => {
      if (entry.duration > maxRenderTime) {
        violations.push({ iteration: index, time: entry.duration });
      }
    });

    return {
      passed: violations.length === 0 && results.averageTime <= maxRenderTime,
      results,
      violations,
    };
  },
};

// Memory testing utilities
export const _memoryTesting = {
  // Take memory snapshot
  snapshot: (label?: string): MemorySnapshot => {
    const memory = (performance as any).memory || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    };

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now(),
      label,
    };
  },

  // Compare two memory snapshots
  compare: (before: MemorySnapshot, after: MemorySnapshot) => {
    const usedDiff = after.usedJSHeapSize - before.usedJSHeapSize;
    const totalDiff = after.totalJSHeapSize - before.totalJSHeapSize;
    const timeDiff = after.timestamp - before.timestamp;

    return {
      usedHeapDelta: usedDiff,
      totalHeapDelta: totalDiff,
      timeDelta: timeDiff,
      usedHeapRate: usedDiff / timeDiff, // bytes per ms
      hasMemoryLeak: usedDiff > 0 && usedDiff / before.usedJSHeapSize > 0.1, // 10% increase threshold
      percentageIncrease: (usedDiff / before.usedJSHeapSize) * 100,
    };
  },

  // Test for memory leaks
  testMemoryLeak: async (
    operation: () => void | Promise<void>,
    options: {
      iterations?: number;
      tolerance?: number; // percentage increase allowed
      gcBetweenRuns?: boolean;
    } = {}
  ): Promise<{
    hasLeak: boolean;
    snapshots: MemorySnapshot[];
    leakRate: number; // bytes per iteration
    totalIncrease: number;
  }> => {
    const { iterations = 100, tolerance = 5, gcBetweenRuns = true } = options;
    const snapshots: MemorySnapshot[] = [];

    // Initial snapshot
    snapshots.push(memoryTesting.snapshot('initial'));

    for (let i = 0; i < iterations; i++) {
      await operation();

      // Force garbage collection if available and requested
      if (gcBetweenRuns && (global as any).gc) {
        (global as any).gc();
      }

      snapshots.push(memoryTesting.snapshot(`iteration-${i}`));
    }

    const initial = snapshots[0];
    const final = snapshots[snapshots.length - 1];
    const comparison = memoryTesting.compare(initial, final);

    const hasLeak = comparison.percentageIncrease > tolerance;
    const leakRate = comparison.usedHeapDelta / iterations;

    return {
      hasLeak,
      snapshots,
      leakRate,
      totalIncrease: comparison.usedHeapDelta,
    };
  },

  // Monitor memory usage over time
  monitor: (
    duration: number,
    interval: number = 1000,
    label: string = 'monitor'
  ): Promise<MemorySnapshot[]> => {
    return new Promise(resolve => {
      const snapshots: MemorySnapshot[] = [];
      const startTime = Date.now();

      const intervalId = setInterval(() => {
        snapshots.push(memoryTesting.snapshot(`${label}-${snapshots.length}`));

        if (Date.now() - startTime >= duration) {
          clearInterval(intervalId);
          resolve(snapshots);
        }
      }, interval);
    });
  },
};

// Bundle size and loading performance
export const _bundlePerformance = {
  // Measure resource loading times
  measureResourceLoading: (): Promise<
    Array<{
      name: string;
      type: string;
      size: number;
      duration: number;
      startTime: number;
    }>
  > => {
    return new Promise(resolve => {
      window.addEventListener('load', () => {
        const resources = performance.getEntriesByType(
          'resource'
        ) as PerformanceResourceTiming[];

        const resourceMetrics = resources.map(resource => ({
          name: resource.name,
          type: resource.initiatorType,
          size: resource.transferSize || 0,
          duration: resource.duration,
          startTime: resource.startTime,
        }));

        resolve(resourceMetrics);
      });
    });
  },

  // Analyze bundle performance
  analyzeBundleSize: (
    thresholds: {
      maxTotalSize?: number;
      maxIndividualSize?: number;
      maxLoadTime?: number;
    } = {}
  ): Promise<{
    passed: boolean;
    totalSize: number;
    largestResource: { name: string; size: number };
    violations: string[];
  }> => {
    const {
      maxTotalSize = 1024 * 1024, // 1MB
      maxIndividualSize = 256 * 1024, // 256KB
      maxLoadTime = 3000, // 3 seconds
    } = thresholds;

    return bundlePerformance.measureResourceLoading().then(resources => {
      const violations: string[] = [];
      const totalSize = resources.reduce((sum, resource) => sum + resource.size, 0);
      const largestResource = resources.reduce(
        (largest, resource) => (resource.size > largest.size ? resource : largest),
        { name: '', size: 0 }
      );

      if (totalSize > maxTotalSize) {
        violations.push(
          `Total bundle size (${totalSize} bytes) exceeds limit (${maxTotalSize} bytes)`
        );
      }

      resources.forEach(resource => {
        if (resource.size > maxIndividualSize) {
          violations.push(
            `Resource ${resource.name} (${resource.size} bytes) exceeds individual size limit`
          );
        }

        if (resource.duration > maxLoadTime) {
          violations.push(
            `Resource ${resource.name} took ${resource.duration}ms to load (limit: ${maxLoadTime}ms)`
          );
        }
      });

      return {
        passed: violations.length === 0,
        totalSize,
        largestResource,
        violations,
      };
    });
  },
};

// Performance testing assertions
export const _performanceAssertions = {
  // Assert render time is within limit
  expectRenderTimeWithin: (
    actualTime: number,
    maxTime: number,
    componentName?: string
  ) => {
    const message = componentName
      ? `${componentName} render time (${actualTime.toFixed(2)}ms) should be within ${maxTime}ms`
      : `Render time (${actualTime.toFixed(2)}ms) should be within ${maxTime}ms`;

    expect(actualTime).toBeLessThanOrEqual(maxTime);
  },

  // Assert no memory leaks
  expectNoMemoryLeak: (
    leakTest: Awaited<ReturnType<typeof memoryTesting.testMemoryLeak>>
  ) => {
    expect(leakTest.hasLeak).toBe(false);
    if (leakTest.hasLeak) {
      console.warn(
        `Memory leak detected: ${leakTest.totalIncrease} bytes increase (${leakTest.leakRate} bytes/iteration)`
      );
    }
  },

  // Assert performance benchmark meets criteria
  expectBenchmarkToPass: (
    benchmark: PerformanceBenchmark,
    criteria: {
      maxAverageTime?: number;
      minSuccessRate?: number;
      maxStandardDeviation?: number;
    }
  ) => {
    const { maxAverageTime, minSuccessRate = 0.95, maxStandardDeviation } = criteria;

    if (maxAverageTime) {
      expect(benchmark.averageTime).toBeLessThanOrEqual(maxAverageTime);
    }

    expect(benchmark.successRate).toBeGreaterThanOrEqual(minSuccessRate);

    if (maxStandardDeviation) {
      expect(benchmark.standardDeviation).toBeLessThanOrEqual(maxStandardDeviation);
    }
  },
};

// Export grouped utilities
export const _performanceHelpers = {
  core: performanceCore,
  react: reactPerformance,
  memory: memoryTesting,
  bundle: bundlePerformance,
  assertions: performanceAssertions,
};

// Export individual modules for convenience
// Alias exports without underscores
export const performanceCore = _performanceCore;
export const reactPerformance = _reactPerformance;
export const memoryTesting = _memoryTesting;
export const bundlePerformance = _bundlePerformance;
export const performanceAssertions = _performanceAssertions;

export {
  performanceCore,
  reactPerformance,
  memoryTesting,
  bundlePerformance,
  performanceAssertions,
};

// Export as default
export default performanceHelpers;
