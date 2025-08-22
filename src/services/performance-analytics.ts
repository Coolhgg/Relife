/// <reference lib="dom" />
// Performance Analytics Integration Service
// Provides comprehensive performance monitoring with Sentry and PostHog integration

import SentryService from './sentry';
import AnalyticsService from './analytics';
import AppAnalyticsService from './app-analytics';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'load' | 'interaction' | 'api' | 'render' | 'memory' | 'network';
  context?: Record<string, unknown>;
}

export interface PerformanceThresholds {
  excellent: number;
  good: number;
  needsImprovement: number;
  poor: number;
}

export interface WebVitalsMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

class PerformanceAnalyticsService {
  private static instance: PerformanceAnalyticsService;
  private sentryService: SentryService;
  private analyticsService: AnalyticsService;
  private appAnalytics: AppAnalyticsService;
  private observer?: PerformanceObserver;
  private metrics: PerformanceMetric[] = [];
  private webVitals: WebVitalsMetrics = {};
  private isInitialized = false;

  // Performance thresholds based on Core Web Vitals
  private thresholds = {
    FCP: { excellent: 1800, good: 3000, needsImprovement: 4000, poor: Infinity },
    LCP: { excellent: 2500, good: 4000, needsImprovement: 5000, poor: Infinity },
    FID: { excellent: 100, good: 300, needsImprovement: 500, poor: Infinity },
    CLS: { excellent: 0.1, good: 0.25, needsImprovement: 0.4, poor: Infinity },
    TTFB: { excellent: 800, good: 1800, needsImprovement: 2500, poor: Infinity },
  };

  private constructor() {
    this.sentryService = SentryService.getInstance();
    this.analyticsService = AnalyticsService.getInstance();
    this.appAnalytics = AppAnalyticsService.getInstance();
  }

  static getInstance(): PerformanceAnalyticsService {
    if (!PerformanceAnalyticsService.instance) {
      PerformanceAnalyticsService.instance = new PerformanceAnalyticsService();
    }
    return PerformanceAnalyticsService.instance;
  }

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    if (this.isInitialized) return;

    try {
      // Monitor Core Web Vitals
      this.initializeCoreWebVitals();

      // Monitor resource loading
      this.initializeResourceMonitoring();

      // Monitor long tasks
      this.initializeLongTaskMonitoring();

      // Monitor navigation
      this.initializeNavigationMonitoring();

      // Monitor memory usage
      this.initializeMemoryMonitoring();

      // Set up automatic reporting
      this.setupPeriodicReporting();

      this.isInitialized = true;
      console.info('Performance analytics initialized successfully');
    } catch (error) {
      console.error('Failed to initialize performance analytics:', error);
    }
  }

  /**
   * Track a custom performance metric
   */
  trackMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    category: PerformanceMetric['category'] = 'interaction',
    context?: Record<string, unknown>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      category,
      context,
    };

    this.metrics.push(metric);

    // Send to analytics services
    if (this.analyticsService.isReady()) {
      this.analyticsService.trackPerformance(name, value, unit, context);
    }

    // Send performance data to Sentry
    if (this.sentryService.isReady()) {
      this.sentryService.capturePerformance(name, value, context);
    }

    // Check thresholds and alert if poor performance
    this.checkPerformanceThresholds(metric);

    // Keep only recent metrics (last 100)
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Start a performance measurement
   */
  startMeasurement(name: string): () => number {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.trackMetric(name, duration, 'ms', 'interaction');
      return duration;
    };
  }

  /**
   * Track alarm-specific performance
   */
  trackAlarmPerformance(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, unknown>
  ): void {
    this.trackMetric(`alarm_${operation}`, duration, 'ms', 'interaction', {
      success,
      operation,
      ...metadata,
    });

    // Track in app analytics
    this.appAnalytics.trackPerformance(`alarm_${operation}`, duration, {
      success,
      ...metadata,
    });
  }

  /**
   * Track API request performance
   */
  trackApiRequest(url: string, method: string, duration: number, status: number): void {
    const category = status >= 400 ? 'error' : 'api';

    this.trackMetric(
      'api_request',
      duration,
      'ms',
      category as PerformanceMetric['category'],
      {
        url: this.sanitizeUrl(url),
        method,
        status,
        success: status < 400,
      }
    );

    // Track slow API requests in Sentry
    if (duration > 5000) {
      // Slower than 5 seconds
      this.sentryService.captureMessage(
        `Slow API request: ${method} ${url}`,
        'warning',
        {
          component: 'performance-analytics',
          metadata: { duration, status, url: this.sanitizeUrl(url) },
        }
      );
    }
  }

  /**
   * Track component render performance
   */
  trackComponentRender(
    componentName: string,
    renderTime: number,
    props?: Record<string, unknown>
  ): void {
    this.trackMetric(`component_render_${componentName}`, renderTime, 'ms', 'render', {
      componentName,
      propsCount: props ? Object.keys(props).length : 0,
    });

    // Alert on slow renders
    if (renderTime > 100) {
      // Slower than 100ms
      this.sentryService.addBreadcrumb(`Slow render: ${componentName}`, 'performance', {
        renderTime,
        componentName,
      });
    }
  }

  /**
   * Get current web vitals
   */
  getWebVitals(): WebVitalsMetrics {
    return { ...this.webVitals };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    metrics: PerformanceMetric[];
    webVitals: WebVitalsMetrics;
    averages: Record<string, number>;
    issues: Array<{
      metric: string;
      value: number;
      threshold: string;
      severity: string;
    }>;
  } {
    const averages = this.calculateAverages();
    const issues = this.identifyPerformanceIssues();

    return {
      metrics: this.metrics.slice(-20), // Last 20 metrics
      webVitals: this.webVitals,
      averages,
      issues,
    };
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private initializeCoreWebVitals(): void {
    // FCP - First Contentful Paint
    this.observePerformanceEntry('paint', entries => {
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.webVitals.FCP = fcpEntry.startTime;
        this.trackMetric('FCP', fcpEntry.startTime, 'ms', 'load');
      }
    });

    // LCP - Largest Contentful Paint
    this.observePerformanceEntry('largest-contentful-paint', entries => {
      const lcpEntry = entries[entries.length - 1]; // Latest LCP
      if (lcpEntry) {
        this.webVitals.LCP = lcpEntry.renderTime || lcpEntry.loadTime;
        this.trackMetric('LCP', this.webVitals.LCP, 'ms', 'load');
      }
    });

    // FID - First Input Delay
    this.observePerformanceEntry('first-input', entries => {
      const fidEntry = entries[0];
      if (fidEntry) {
        this.webVitals.FID = fidEntry.processingStart - fidEntry.startTime;
        this.trackMetric('FID', this.webVitals.FID, 'ms', 'interaction');
      }
    });

    // CLS - Cumulative Layout Shift
    let clsValue = 0;
    this.observePerformanceEntry('layout-shift', entries => {
      for (const entry of entries) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.webVitals.CLS = clsValue;
      this.trackMetric('CLS', clsValue, 'score', 'load');
    });

    // TTFB - Time to First Byte
    this.observePerformanceEntry('navigation', entries => {
      const navEntry = entries[0] as PerformanceNavigationTiming;
      if (navEntry) {
        this.webVitals.TTFB = navEntry.responseStart - navEntry.requestStart;
        this.trackMetric('TTFB', this.webVitals.TTFB, 'ms', 'network');
      }
    });
  }

  /**
   * Initialize resource loading monitoring
   */
  private initializeResourceMonitoring(): void {
    this.observePerformanceEntry('resource', entries => {
      for (const entry of entries) {
        const resource = entry as PerformanceResourceTiming;
        const duration = resource.responseEnd - resource.startTime;

        this.trackMetric('resource_load', duration, 'ms', 'load', {
          url: this.sanitizeUrl(resource.name),
          type: this.getResourceType(resource.name),
          size: resource.transferSize || 0,
        });
      }
    });
  }

  /**
   * Initialize long task monitoring
   */
  private initializeLongTaskMonitoring(): void {
    this.observePerformanceEntry('longtask', entries => {
      for (const entry of entries) {
        this.trackMetric('long_task', entry.duration, 'ms', 'interaction', {
          startTime: entry.startTime,
        });

        // Report long tasks to Sentry
        this.sentryService.captureMessage(
          `Long task detected: ${entry.duration}ms`,
          'warning',
          {
            component: 'performance-monitor',
            metadata: { duration: entry.duration, startTime: entry.startTime },
          }
        );
      }
    });
  }

  /**
   * Initialize navigation monitoring
   */
  private initializeNavigationMonitoring(): void {
    this.observePerformanceEntry('navigation', entries => {
      const navEntry = entries[0] as PerformanceNavigationTiming;
      if (navEntry) {
        // Track various navigation timings
        const timings = {
          domContentLoaded:
            navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
          loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
          domInteractive: navEntry.domInteractive - navEntry.fetchStart,
        };

        Object.entries(timings).forEach(([name, value]) => {
          this.trackMetric(`navigation_${name}`, value, 'ms', 'load');
        });
      }
    });
  }

  /**
   * Initialize memory monitoring
   */
  private initializeMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          this.trackMetric(
            'memory_used',
            memory.usedJSHeapSize / 1024 / 1024,
            'MB',
            'memory',
            {
              total: memory.totalJSHeapSize / 1024 / 1024,
              limit: memory.jsHeapSizeLimit / 1024 / 1024,
            }
          );
        }
      }, 30000); // Every 30 seconds
    }
  }

  /**
   * Set up periodic reporting
   */
  private setupPeriodicReporting(): void {
    // Report performance summary every 2 minutes
    setInterval(() => {
      this.reportPerformanceSummary();
    }, 120000);

    // Report web vitals on page unload
    window.addEventListener('beforeunload', () => {
      this.reportWebVitals();
    });
  }

  /**
   * Observe performance entries
   */
  private observePerformanceEntry(
    type: string,
    callback: (entries: PerformanceEntry[]) => void
  ): void {
    try {
      if (typeof PerformanceObserver !== 'undefined') {
        const observer = new PerformanceObserver(list => {
          callback(list.getEntries());
        });
        observer.observe({ entryTypes: [type] });
      }
    } catch (error) {
      console.warn(`Failed to observe ${type} performance entries:`, error);
    }
  }

  /**
   * Check performance thresholds
   */
  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const thresholdKey = metric.name as keyof typeof this.thresholds;
    const threshold = this.thresholds[thresholdKey];

    if (threshold && metric.value > threshold.poor) {
      // Report poor performance to Sentry
      this.sentryService.captureMessage(
        `Poor performance detected: ${metric.name}`,
        'warning',
        {
          component: 'performance-analytics',
          metadata: {
            metric: metric.name,
            value: metric.value,
            threshold: 'poor',
            context: metric.context,
          },
        }
      );
    }
  }

  /**
   * Calculate performance averages
   */
  private calculateAverages(): Record<string, number> {
    const averages: Record<string, number> = {};
    const groups: Record<string, number[]> = {};

    // Group metrics by name
    this.metrics.forEach(metric => {
      if (!groups[metric.name]) {
        groups[metric.name] = [];
      }
      groups[metric.name].push(metric.value);
    });

    // Calculate averages
    Object.entries(groups).forEach(([name, values]) => {
      averages[name] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    return averages;
  }

  /**
   * Identify performance issues
   */
  private identifyPerformanceIssues(): Array<{
    metric: string;
    value: number;
    threshold: string;
    severity: string;
  }> {
    const issues = [];
    const averages = this.calculateAverages();

    Object.entries(averages).forEach(([metric, value]) => {
      const thresholdKey = metric as keyof typeof this.thresholds;
      const threshold = this.thresholds[thresholdKey];

      if (threshold) {
        let severity = 'good';
        let thresholdName = 'excellent';

        if (value > threshold.poor) {
          severity = 'critical';
          thresholdName = 'poor';
        } else if (value > threshold.needsImprovement) {
          severity = 'warning';
          thresholdName = 'needs-improvement';
        } else if (value > threshold.good) {
          severity = 'info';
          thresholdName = 'good';
        }

        if (severity !== 'good') {
          issues.push({
            metric,
            value,
            threshold: thresholdName,
            severity,
          });
        }
      }
    });

    return issues;
  }

  /**
   * Report performance summary to analytics
   */
  private reportPerformanceSummary(): void {
    const summary = this.getPerformanceSummary();

    if (this.analyticsService.isReady()) {
      this.analyticsService.track('performance_summary', {
        webVitals: summary.webVitals,
        averages: summary.averages,
        issuesCount: summary.issues.length,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Report web vitals to analytics
   */
  private reportWebVitals(): void {
    if (this.analyticsService.isReady()) {
      this.analyticsService.track('web_vitals', {
        ...this.webVitals,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Sanitize URL for privacy
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    } catch {
      return 'invalid-url';
    }
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase() || '';

    if (['js', 'mjs'].includes(ext)) return 'script';
    if (['css'].includes(ext)) return 'stylesheet';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
    if (['woff', 'woff2', 'ttf', 'otf'].includes(ext)) return 'font';

    return 'other';
  }
}

export default PerformanceAnalyticsService;
