/// <reference lib="dom" />
// Enhanced Performance Monitoring Service for Smart Alarm App
// Tracks Web Vitals, user interactions, and application performance metrics
// Now integrated with real-time alerts and performance optimization

import { performanceAlertManager } from '../utils/performance-alerts';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface WebVitalsMetrics {
  CLS: number; // Cumulative Layout Shift
  FID: number; // First Input Delay
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  TTFB: number; // Time to First Byte
}

interface UserInteraction {
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'alarm_action';
  target: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  sessionId: string;
  userId?: string;
  timestamp: number;
  webVitals: Partial<WebVitalsMetrics>;
  interactions: UserInteraction[];
  customMetrics: PerformanceMetric[];
  deviceInfo: {
    userAgent: string;
    viewport: { width: number; height: number };
    connection?: string;
    memory?: number;
  };
  appInfo: {
    version: string;
    buildTime: string;
    features: string[];
  };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private sessionId: string;
  private webVitals: Partial<WebVitalsMetrics> = {};
  private interactions: UserInteraction[] = [];
  private customMetrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private reportingInterval: number | null = null;
  private isInitialized = false;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Initialize performance monitoring
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.setupWebVitalsTracking();
      this.setupNavigationTracking();
      this.setupResourceTracking();
      this.setupMemoryTracking();
      this.setupErrorTracking();
      this.startPeriodicReporting();

      this.isInitialized = true;
      console.log('[PerformanceMonitor] Initialized successfully');

      this.trackCustomMetric('monitor_initialization', performance.now());
    } catch (error) {
      console.error('[PerformanceMonitor] Initialization failed:', error);
    }
  }

  // Web Vitals tracking using Performance Observer API
  private setupWebVitalsTracking(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
            renderTime?: number;
            loadTime?: number;
          };
          this.webVitals.LCP = lastEntry.renderTime || lastEntry.loadTime || 0;
          this.trackCustomMetric('LCP', this.webVitals.LCP);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] LCP tracking failed:', error);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.webVitals.FID = entry.processingStart - entry.startTime;
            this.trackCustomMetric('FID', this.webVitals.FID);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] FID tracking failed:', error);
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.webVitals.CLS = clsValue;
              this.trackCustomMetric('CLS', clsValue);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] CLS tracking failed:', error);
      }
    }

    // First Contentful Paint (FCP) and Time to First Byte (TTFB)
    if (performance.getEntriesByType) {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.webVitals.FCP = entry.startTime;
            this.trackCustomMetric('FCP', entry.startTime);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', observer);
      } catch (error) {
        console.warn('[PerformanceMonitor] Paint tracking failed:', error);
      }

      // TTFB from navigation timing
      const navigationEntries = performance.getEntriesByType(
        'navigation'
      ) as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0];
        this.webVitals.TTFB = navEntry.responseStart - navEntry.requestStart;
        this.trackCustomMetric('TTFB', this.webVitals.TTFB);
      }
    }
  }

  // Navigation and page load tracking
  private setupNavigationTracking(): void {
    if (performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType(
        'navigation'
      ) as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        const entry = navEntries[0];

        this.trackCustomMetric(
          'dom_content_loaded',
          entry.domContentLoadedEventEnd - entry.navigationStart
        );
        this.trackCustomMetric(
          'page_load_complete',
          entry.loadEventEnd - entry.navigationStart
        );
        this.trackCustomMetric(
          'dom_processing',
          entry.domContentLoadedEventStart - entry.domInteractive
        );
      }
    }

    // Track route changes for SPA navigation
    const currentPath = window.location.pathname;
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      this.trackNavigation((args[2] as string) || window.location.pathname);
      return originalPushState.apply(history, args);
    };

    history.replaceState = (...args) => {
      this.trackNavigation((args[2] as string) || window.location.pathname);
      return originalReplaceState.apply(history, args);
    };

    window.addEventListener('popstate', () => {
      this.trackNavigation(window.location.pathname);
    });
  }

  // Resource loading performance
  private setupResourceTracking(): void {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver(list => {
          list.getEntries().forEach((entry: PerformanceEntry) => {
            const resourceEntry = entry as PerformanceResourceTiming;

            // Track slow resources
            const loadTime = resourceEntry.responseEnd - resourceEntry.startTime;
            if (loadTime > 1000) {
              // Resources taking more than 1s
              this.trackCustomMetric('slow_resource', loadTime, {
                url: entry.name,
                type: resourceEntry.initiatorType,
                size: resourceEntry.transferSize,
              });
            }

            // Track failed resources
            if (resourceEntry.responseStart === 0) {
              this.trackCustomMetric('failed_resource', 0, {
                url: entry.name,
                type: resourceEntry.initiatorType,
              });
            }
          });
        });

        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] Resource tracking failed:', error);
      }
    }
  }

  // Memory usage tracking
  private setupMemoryTracking(): void {
    if ('memory' in performance) {
      const trackMemory = () => {
        const memory = (performance as any).memory;
        this.trackCustomMetric('memory_used', memory.usedJSHeapSize, {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        });
      };

      // Track memory every 30 seconds
      setInterval(trackMemory, 30000);
      trackMemory(); // Initial measurement
    }
  }

  // Error tracking integration
  private setupErrorTracking(): void {
    window.addEventListener('error', event => {
      this.trackCustomMetric('js_error', 1, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', event => {
      this.trackCustomMetric('unhandled_promise_rejection', 1, {
        reason: event.reason?.toString() || 'Unknown',
      });
    });
  }

  // User interaction tracking
  trackUserInteraction(
    type: UserInteraction['type'],
    target: string,
    metadata?: Record<string, any>,
    duration?: number
  ): void {
    const interaction: UserInteraction = {
      type,
      target,
      timestamp: performance.now(),
      duration,
      metadata,
    };

    this.interactions.push(interaction);

    // Keep only recent interactions (last 100)
    if (this.interactions.length > 100) {
      this.interactions = this.interactions.slice(-100);
    }

    this.trackCustomMetric(`interaction_${type}`, 1, { target, ...metadata });
  }

  // Enhanced custom metric tracking with aggregation and real-time alerts
  trackCustomMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: performance.now(),
      metadata,
    };

    this.customMetrics.push(metric);

    // Keep only recent metrics (last 500 for better analysis)
    if (this.customMetrics.length > 500) {
      this.customMetrics = this.customMetrics.slice(-500);
    }

    // Track specific performance thresholds
    this.checkPerformanceThresholds(name, value, metadata);

    // Send to alert manager for real-time monitoring
    try {
      performanceAlertManager.recordMetric(name, value, metadata);
    } catch (error) {
      console.warn(
        '[PerformanceMonitor] Failed to record metric in alert manager:',
        error
      );
    }
  }

  // Check for performance threshold violations
  private checkPerformanceThresholds(
    name: string,
    value: number,
    metadata?: Record<string, any>
  ): void {
    const thresholds = {
      LCP: 2500, // Largest Contentful Paint should be < 2.5s
      FID: 100, // First Input Delay should be < 100ms
      CLS: 0.1, // Cumulative Layout Shift should be < 0.1
      TTFB: 800, // Time to First Byte should be < 800ms
      supabase_operation: 3000, // Database operations should be < 3s
      alarm_trigger_delay: 1000, // Alarm triggers should be < 1s delayed
      voice_synthesis_delay: 2000, // Voice synthesis should start < 2s
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (threshold && value > threshold) {
      console.warn(
        `[PerformanceMonitor] Threshold violation: ${name} = ${value}ms (threshold: ${threshold}ms)`,
        metadata
      );

      // Track threshold violations as custom metrics
      this.customMetrics.push({
        name: `threshold_violation_${name}`,
        value: value - threshold,
        timestamp: performance.now(),
        metadata: { ...metadata, threshold, actualValue: value },
      });
    }
  }

  // Navigation tracking
  private trackNavigation(path: string): void {
    this.trackUserInteraction('navigation', path, {
      timestamp: Date.now(),
      referrer: document.referrer,
    });
  }

  // Alarm-specific performance tracking
  trackAlarmAction(
    action: 'create' | 'edit' | 'delete' | 'toggle' | 'trigger' | 'dismiss' | 'snooze',
    duration?: number,
    metadata?: Record<string, any>
  ): void {
    this.trackUserInteraction(
      'alarm_action',
      action,
      {
        ...metadata,
        critical: true, // Mark alarm actions as critical for performance
      },
      duration
    );

    this.trackCustomMetric(`alarm_${action}_performance`, duration || 0, metadata);
  }

  // Generate performance report with enhanced data
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      webVitals: { ...this.webVitals },
      interactions: [...this.interactions],
      customMetrics: [...this.customMetrics],
      deviceInfo: this.getDeviceInfo(),
      appInfo: this.getAppInfo(),
    };

    // Add user ID if available
    try {
      const authData = localStorage.getItem('supabase.auth.token');
      if (authData) {
        const parsed = JSON.parse(authData);
        report.userId = parsed?.user?.id;
      }
    } catch {
      // User not authenticated or error parsing
    }

    return report;
  }

  // Get device information
  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      connection: (navigator as any).connection?.effectiveType || 'unknown',
      memory: (navigator as any).deviceMemory || 'unknown',
    };
  }

  // Get app information with enhanced feature detection
  private getAppInfo() {
    const features = [
      'offline-support',
      'error-boundaries',
      'input-validation',
      'pwa-capabilities',
      'performance-monitoring',
      'real-time-sync',
      'voice-synthesis',
      'background-processing',
    ];

    // Add detected capabilities
    if ('serviceWorker' in navigator) features.push('service-worker');
    if ('PushManager' in window) features.push('push-notifications');
    if ('vibrate' in navigator) features.push('haptic-feedback');
    if ('speechSynthesis' in window) features.push('speech-synthesis');
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
      features.push('speech-recognition');
    if ('Notification' in window) features.push('notifications');
    if ('caches' in window) features.push('cache-api');
    if ('indexedDB' in window) features.push('indexeddb');
    if ('localStorage' in window) features.push('local-storage');

    return {
      version: import.meta.env.VITE_APP_VERSION || '2.0.0',
      buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
      features: [...new Set(features)], // Remove duplicates
    };
  }

  // Start periodic reporting with enhanced connectivity handling
  private startPeriodicReporting(): void {
    // Send report every 5 minutes
    this.reportingInterval = window.setInterval(
      () => {
        this.sendReport();
      },
      5 * 60 * 1000
    );

    // Send report on page unload
    window.addEventListener('beforeunload', () => {
      this.sendReport();
    });

    // Send report when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendReport();
      }
    });

    // Retry failed reports when connection is restored
    window.addEventListener('online', () => {
      this.trackCustomMetric('network_connection_restored', 1);
      this.retryFailedReports();
      // Send current report immediately when back online
      setTimeout(() => this.sendReport(), 1000);
    });

    window.addEventListener('offline', () => {
      this.trackCustomMetric('network_connection_lost', 1);
    });
  }

  // Send performance report
  private sendReport(): void {
    try {
      const report = this.generateReport();

      // Store locally for offline scenarios
      this.storeReportLocally(report);

      // Send to analytics endpoint if online
      if (navigator.onLine) {
        this.sendReportToServer(report);
      }
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to send report:', error);
    }
  }

  // Store report locally
  private storeReportLocally(report: PerformanceReport): void {
    try {
      const existingReports = JSON.parse(
        localStorage.getItem('performance-reports') || '[]'
      );
      existingReports.push(report);

      // Keep only last 10 reports
      const recentReports = existingReports.slice(-10);
      localStorage.setItem('performance-reports', JSON.stringify(recentReports));
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to store report locally:', error);
    }
  }

  // Send report to server with enhanced retry logic
  private sendReportToServer(report: PerformanceReport): void {
    const sendWithRetry = async (attempt: number = 1): Promise<void> => {
      const maxRetries = 3;

      try {
        if ('sendBeacon' in navigator && attempt === 1) {
          // Use sendBeacon for reliable delivery on first attempt
          const success = navigator.sendBeacon(
            '/api/performance',
            JSON.stringify(report)
          );
          if (!success && attempt < maxRetries) {
            throw new Error('SendBeacon failed');
          }
        } else {
          // Fallback to fetch with retry logic
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await fetch('/api/performance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Retry-Attempt': attempt.toString(),
            },
            body: JSON.stringify(report),
            keepalive: true,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }

        console.log(
          `[PerformanceMonitor] Successfully sent report on attempt ${attempt}`
        );
      } catch (error) {
        console.warn(`[PerformanceMonitor] Attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          setTimeout(() => sendWithRetry(attempt + 1), delay);
        } else {
          console.error(
            '[PerformanceMonitor] All retry attempts failed, storing report locally'
          );
          this.storeFailedReport(report);
        }
      }
    };

    sendWithRetry();
  }

  // Store failed reports for retry when connection is restored
  private storeFailedReport(report: PerformanceReport): void {
    try {
      const failedReports = JSON.parse(
        localStorage.getItem('failed-performance-reports') || '[]'
      );
      failedReports.push({
        ...report,
        failedAt: Date.now(),
      });

      // Keep only last 5 failed reports
      const recentFailedReports = failedReports.slice(-5);
      localStorage.setItem(
        'failed-performance-reports',
        JSON.stringify(recentFailedReports)
      );
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to store failed report:', error);
    }
  }

  // Retry failed reports when connection is restored
  private async retryFailedReports(): Promise<void> {
    try {
      const failedReports = JSON.parse(
        localStorage.getItem('failed-performance-reports') || '[]'
      );

      if (failedReports.length === 0) return;

      console.log(
        `[PerformanceMonitor] Retrying ${failedReports.length} failed reports`
      );

      for (const report of failedReports) {
        this.sendReportToServer(report);
      }

      // Clear failed reports after attempting to resend
      localStorage.removeItem('failed-performance-reports');
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to retry failed reports:', error);
    }
  }

  // Get stored reports
  getStoredReports(): PerformanceReport[] {
    try {
      return JSON.parse(localStorage.getItem('performance-reports') || '[]');
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to retrieve stored reports:', error);
      return [];
    }
  }

  // Clear stored reports
  clearStoredReports(): void {
    localStorage.removeItem('performance-reports');
  }

  // Get performance summary
  getPerformanceSummary() {
    const reports = this.getStoredReports();
    const currentReport = this.generateReport();

    return {
      currentSession: {
        webVitals: currentReport.webVitals,
        interactionCount: currentReport.interactions.length,
        customMetricCount: currentReport.customMetrics.length,
      },
      historicalData: {
        totalSessions: reports.length,
        averageWebVitals: this.calculateAverageWebVitals(reports),
        mostCommonInteractions: this.getMostCommonInteractions(reports),
      },
    };
  }

  // Calculate average Web Vitals
  private calculateAverageWebVitals(
    reports: PerformanceReport[]
  ): Partial<WebVitalsMetrics> {
    if (reports.length === 0) return {};

    const totals = reports.reduce(
      (acc, report) => {
        Object.entries(report.webVitals).forEach(([key, value]) => {
          acc[key] = (acc[key] || 0) + value;
        });
        return acc;
      },
      {} as Record<string, number>
    );

    const averages: Partial<WebVitalsMetrics> = {};
    Object.entries(totals).forEach(([key, total]) => {
      averages[key as keyof WebVitalsMetrics] = total / reports.length;
    });

    return averages;
  }

  // Get most common interactions
  private getMostCommonInteractions(
    reports: PerformanceReport[]
  ): Array<{ type: string; count: number }> {
    const interactionCounts: Record<string, number> = {};

    reports.forEach(report => {
      report.interactions.forEach(interaction => {
        const key = `${interaction.type}:${interaction.target}`;
        interactionCounts[key] = (interactionCounts[key] || 0) + 1;
      });
    });

    return Object.entries(interactionCounts)
      .map(([key, count]) => {
        const [type, target] = key.split(':');
        return { type: `${type} - ${target}`, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }

    // Send final report
    this.sendReport();
  }

  /**
   * Clear all stored performance data
   */
  clearData(): void {
    try {
      localStorage.removeItem('performanceReports');
      this.reports = [];
    } catch (error) {
      console.error('Failed to clear performance data:', error);
    }
  }
}

// Enhanced analytics methods for better insights
interface PerformanceTrends {
  averagePageLoadTime: number;
  averageInteractionDelay: number;
  errorRate: number;
  mostUsedFeatures: Array<{ feature: string; usage: number }>;
  performanceScore: number;
  recommendations: string[];
}

// Add these methods to PerformanceMonitor class
PerformanceMonitor.prototype.getPerformanceTrends = function (): PerformanceTrends {
  const reports = this.getStoredReports();
  const allMetrics = reports.flatMap(r => r.customMetrics);
  const allInteractions = reports.flatMap(r => r.interactions);

  // Calculate averages
  const pageLoadMetrics = allMetrics.filter(m => m.name === 'page_load_complete');
  const averagePageLoadTime =
    pageLoadMetrics.length > 0
      ? pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) / pageLoadMetrics.length
      : 0;

  const interactionDelays = allMetrics.filter(m => m.name.includes('interaction_'));
  const averageInteractionDelay =
    interactionDelays.length > 0
      ? interactionDelays.reduce((sum, m) => sum + m.value, 0) /
        interactionDelays.length
      : 0;

  // Calculate error rate
  const errorMetrics = allMetrics.filter(m => m.name.includes('error'));
  const totalInteractions = allInteractions.length;
  const errorRate = totalInteractions > 0 ? errorMetrics.length / totalInteractions : 0;

  // Most used features
  const featureUsage: Record<string, number> = {};
  allInteractions.forEach(interaction => {
    featureUsage[interaction.target] = (featureUsage[interaction.target] || 0) + 1;
  });

  const mostUsedFeatures = Object.entries(featureUsage)
    .map(([feature, usage]) => ({ feature, usage }))
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 10);

  // Calculate performance score (0-100)
  let score = 100;
  if (averagePageLoadTime > 3000) score -= 20;
  if (averageInteractionDelay > 100) score -= 15;
  if (errorRate > 0.05) score -= 25; // More than 5% error rate

  // Web Vitals impact
  const currentReport = this.generateReport();
  if (currentReport.webVitals.LCP && currentReport.webVitals.LCP > 2500) score -= 15;
  if (currentReport.webVitals.FID && currentReport.webVitals.FID > 100) score -= 10;
  if (currentReport.webVitals.CLS && currentReport.webVitals.CLS > 0.1) score -= 10;

  // Generate recommendations
  const recommendations: string[] = [];
  if (averagePageLoadTime > 3000)
    recommendations.push(
      'Optimize page load time - consider code splitting or image optimization'
    );
  if (averageInteractionDelay > 100)
    recommendations.push(
      'Improve interaction responsiveness - check for blocking JavaScript'
    );
  if (errorRate > 0.05) recommendations.push('Investigate and fix recurring errors');
  if (currentReport.webVitals.LCP && currentReport.webVitals.LCP > 2500)
    recommendations.push(
      'Optimize Largest Contentful Paint - improve server response time or resource loading'
    );
  if (currentReport.webVitals.CLS && currentReport.webVitals.CLS > 0.1)
    recommendations.push(
      'Reduce Cumulative Layout Shift - ensure images have dimensions and avoid dynamic content injection'
    );

  return {
    averagePageLoadTime,
    averageInteractionDelay,
    errorRate,
    mostUsedFeatures,
    performanceScore: Math.max(0, score),
    recommendations,
  };
};

// Export enhanced performance monitor
export default PerformanceMonitor.getInstance();
export type { PerformanceTrends };
