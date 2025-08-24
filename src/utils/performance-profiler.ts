/**
 * React Performance Profiler Utility
 *
 * Provides development-mode performance monitoring for React components,
 * including render time tracking, re-render analysis, and bottleneck detection.
 */

import * as React from 'react';
import { Profiler, ProfilerOnRenderCallback } from 'react';
import { TimeoutHandle } from '../types/timers';

// Performance data storage
interface PerformanceEntry {
  id: string;
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<any>;
  renderCount: number;
  totalTime: number;
  averageTime: number;
  maxTime: number;
  minTime: number;
  lastRender: number;
}

class PerformanceProfiler {
  private data: Map<string, PerformanceEntry> = new Map();
  private enabled: boolean = false;
  private logLevel: 'none' | 'summary' | 'detailed' | 'verbose' = 'none';
  private slowThreshold: number = 16; // 16ms for 60fps
  private reportingEnabled: boolean = false;

  constructor() {
    this.enabled =
      process.env.NODE_ENV === 'development' &&
      process.env.REACT_APP_PERFORMANCE_PROFILING === 'true';

    this.logLevel = (process.env.REACT_APP_PROFILING_LOG_LEVEL as any) || 'summary';
    this.slowThreshold = parseInt(process.env.REACT_APP_SLOW_RENDER_THRESHOLD || '16');
    this.reportingEnabled = process.env.REACT_APP_PERF_REPORTING === 'true';

    if (this.enabled) {
      console.log('🔬 React Performance Profiler enabled');
      this.setupPerformanceObserver();
      this.startPeriodicReporting();
    }
  }

  /**
   * Profiler callback for React Profiler component
   */
  onRender = (
    id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  
) => {
    if (!this.enabled) return;

    const existing = this.data.get(id);
    const renderCount = existing ? existing.renderCount + 1 : 1;

    const entry: PerformanceEntry = {
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
      interactions: new Set(), // Placeholder as interactions parameter was removed in newer React
      renderCount,
      totalTime: existing ? existing.totalTime + actualDuration : actualDuration,
      averageTime: existing
        ? (existing.totalTime + actualDuration) / renderCount
        : actualDuration,
      maxTime: existing ? Math.max(existing.maxTime, actualDuration) : actualDuration,
      minTime: existing ? Math.min(existing.minTime, actualDuration) : actualDuration,
      lastRender: Date.now(),
    };

    this.data.set(id, entry);

    // Log slow renders immediately
    if (actualDuration > this.slowThreshold) {
      this.logSlowRender(entry);
    }

    // Detailed logging in verbose mode
    if (this.logLevel === 'verbose') {
      console.log(`🔬 Render: ${id} (${phase})`, {
        actualDuration: `${actualDuration.toFixed(2)}ms`,
        baseDuration: `${baseDuration.toFixed(2)}ms`,
        renderCount,
        averageTime: `${entry.averageTime.toFixed(2)}ms`,
      });
    }
  };

  /**
   * Log slow renders with detailed information
   */
  private logSlowRender(entry: PerformanceEntry) {
    console.warn(`🐌 Slow render detected: ${entry.id}`, {
      duration: `${entry.actualDuration.toFixed(2)}ms`,
      phase: entry.phase,
      renderCount: entry.renderCount,
      average: `${entry.averageTime.toFixed(2)}ms`,
      threshold: `${this.slowThreshold}ms`,
    });

    // Send to analytics if reporting is enabled
    if (this.reportingEnabled) {
      this.reportSlowRender(entry);
    }
  }

  /**
   * Generate performance summary
   */
  getSummary(): {
    totalComponents: number;
    slowComponents: PerformanceEntry[];
    frequentComponents: PerformanceEntry[];
    averageRenderTime: number;
    totalRenderTime: number;
  } {
    const entries = Array.from(this.data.values());
    const slowComponents = entries.filter(e => e.averageTime > this.slowThreshold);
    const frequentComponents = entries
      .filter(e => e.renderCount > 10)
      .sort((a, b
) => b.renderCount - a.renderCount);

    const totalRenderTime = entries.reduce((sum, e
) => sum + e.totalTime, 0);
    const averageRenderTime = totalRenderTime / Math.max(entries.length, 1);

    return {
      totalComponents: entries.length,
      slowComponents: slowComponents.sort((a, b
) => b.averageTime - a.averageTime),
      frequentComponents,
      averageRenderTime,
      totalRenderTime,
    };
  }

  /**
   * Print performance summary to console
   */
  logSummary() {
    if (!this.enabled || this.logLevel === 'none') return;

    const summary = this.getSummary();

    console.group('🔬 React Performance Summary');
    console.log(`📊 Total components tracked: ${summary.totalComponents}`);
    console.log(`⚡ Average render time: ${summary.averageRenderTime.toFixed(2)}ms`);
    console.log(`🕒 Total render time: ${summary.totalRenderTime.toFixed(2)}ms`);

    if (summary.slowComponents.length > 0) {
      console.group(`🐌 Slow components (>${this.slowThreshold}ms):`);
      summary.slowComponents.forEach(comp => {
        console.log(
          `  ${comp.id}: avg ${comp.averageTime.toFixed(2)}ms, max ${comp.maxTime.toFixed(2)}ms, renders: ${comp.renderCount}`
        );
      });
      console.groupEnd();
    }

    if (summary.frequentComponents.length > 0) {
      console.group('🔄 Frequently rendering components:');
      summary.frequentComponents.slice(0, 5).forEach(comp => {
        console.log(
          `  ${comp.id}: ${comp.renderCount} renders, avg ${comp.averageTime.toFixed(2)}ms`
        );
      });
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Setup Performance Observer for additional metrics
   */
  private setupPerformanceObserver() {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure' && entry.name.startsWith('⚛️')) {
            // React DevTools performance markers
            if (this.logLevel === 'verbose') {
              console.log(
                `⚛️ React measure: ${entry.name}`,
                `${entry.duration.toFixed(2)}ms`
              );
            }
          }
        });
      });

      observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    } catch (error) {
      console.warn('Performance Observer not available:', error);
    }
  }

  /**
   * Start periodic performance reporting
   */
  private startPeriodicReporting() {
    if (!this.reportingEnabled) return;

    // Report summary every 30 seconds in development
    setInterval((
) => {
      if (this.logLevel !== 'none') {
        this.logSummary();
      }

      if (this.reportingEnabled) {
        this.sendPerformanceReport();
      }
    }, 30000);
  }

  /**
   * Send slow render data to analytics
   */
  private reportSlowRender(entry: PerformanceEntry) {
    // This would integrate with your analytics system
    const reportData = {
      event: 'slow_render_detected',
      component: entry.id,
      duration: entry.actualDuration,
      phase: entry.phase,
      renderCount: entry.renderCount,
      timestamp: entry.lastRender,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Send to analytics endpoint (mock for now)
    if (process.env.REACT_APP_ANALYTICS_ENDPOINT) {
      fetch(`${process.env.REACT_APP_ANALYTICS_ENDPOINT}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      }).catch(error => {
        console.warn('Failed to report performance data:', error);
      });
    }
  }

  /**
   * Send periodic performance report
   */
  private sendPerformanceReport() {
    const summary = this.getSummary();
    const reportData = {
      event: 'performance_summary',
      summary,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Send to analytics endpoint (mock for now)
    if (process.env.REACT_APP_ANALYTICS_ENDPOINT) {
      fetch(`${process.env.REACT_APP_ANALYTICS_ENDPOINT}/performance/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      }).catch(error => {
        console.warn('Failed to report performance summary:', error);
      });
    }
  }

  /**
   * Clear all performance data
   */
  clear() {
    this.data.clear();
  }

  /**
   * Get specific component performance data
   */
  getComponentData(id: string): PerformanceEntry | undefined {
    return this.data.get(id);
  }

  /**
   * Export performance data for external analysis
   */
  exportData(): PerformanceEntry[] {
    return Array.from(this.data.values());
  }
}

// Global profiler instance
export const performanceProfiler = new PerformanceProfiler();

/**
 * Higher-order component for easy performance profiling
 */
export function withPerformanceProfiler<T extends {}>(
  WrappedComponent: React.ComponentType<T>,
  profilerId?: string
) {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';
  const id = profilerId || displayName;

  const ProfiledComponent: React.FC<T> = props => {
    return React.createElement(
      Profiler,
      { id, onRender: performanceProfiler.onRender },
      React.createElement(WrappedComponent, props)
    );
  };

  ProfiledComponent.displayName = `withPerformanceProfiler(${displayName})`;
  return ProfiledComponent;
}

/**
 * Hook for component-level performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  const startTime = React.useRef<TimeoutHandle | undefined>(undefined);
  const renderCount = React.useRef<TimeoutHandle>(0);

  React.useEffect((
) => {
    renderCount.current += 1;
    const endTime = performance.now();

    if (startTime.current) {
      const duration = endTime - startTime.current;

      if (duration > performanceProfiler['slowThreshold']) {
        console.warn(
          `🐌 Slow render in ${componentName}: ${duration.toFixed(2)}ms`,
          `(render #${renderCount.current})`
        );
      }
    }

    startTime.current = endTime;
  });

  return {
    renderCount: renderCount.current,
    logRender: (message?: string
) => {
      if (performanceProfiler['logLevel'] === 'verbose') {
        console.log(`🔬 ${componentName}${message ? `: ${message}` : ''}`);
      }
    },
  };
}

// Export the Profiler component for manual use
export { Profiler } from 'react';
