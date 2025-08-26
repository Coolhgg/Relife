/**
 * Enhanced Performance Monitor Service
 * Refactored to use standardized service architecture with better threshold configuration and alerting
 */

import { BaseService } from './base/BaseService';
import { CacheProvider, getCacheManager } from './base/CacheManager';
import {
  config,
  import { config
} from '../config/environment';
  PerformanceMonitorInterface,
  ServiceConfig,
  ServiceHealth,
  AnalyticsServiceInterface,
} from '../types/service-architecture';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface PerformanceMonitorConfig extends ServiceConfig {
  // Monitoring intervals
  metricsCollectionInterval: number; // milliseconds
  alertingInterval: number; // milliseconds
  reportingInterval: number; // milliseconds

  // Storage and retention
  maxMetricsInMemory: number;
  metricsRetentionDays: number;
  enablePersistentStorage: boolean;

  // Web Vitals thresholds
  webVitalsThresholds: {
    LCP: { good: number; poor: number };
    FID: { good: number; poor: number };
    CLS: { good: number; poor: number };
    FCP: { good: number; poor: number };
    TTFB: { good: number; poor: number };
  };

  // Custom metric thresholds
  customThresholds: Record<string, ThresholdConfig>;

  // Alerting configuration
  alertingEnabled: boolean;
  alertChannels: AlertChannel[];
  severityLevels: SeverityLevel[];

  // Performance budgets
  performanceBudgets: PerformanceBudget[];

  // Feature flags
  enableWebVitalsTracking: boolean;
  enableResourceTracking: boolean;
  enableMemoryTracking: boolean;
  enableErrorTracking: boolean;
  enableUserInteractionTracking: boolean;
  enableNetworkTracking: boolean;
}

export interface ThresholdConfig {
  good: number;
  poor: number;
  metric: string;
  unit: string;
  alertOnExceeded: boolean;
  consecutiveFailures: number;
}

export interface AlertChannel {
  type: 'console' | 'webhook' | 'analytics' | 'notification';
  endpoint?: string;
  enabled: boolean;
  severityFilter: SeverityLevel[];
}

export interface SeverityLevel {
  name: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  description: string;
}

export interface PerformanceBudget {
  name: string;
  metrics: string[];
  limit: number;
  timeWindow: number; // milliseconds
  alertOnExceeded: boolean;
}

export interface PerformanceMonitorDependencies {
  analyticsService?: AnalyticsServiceInterface;
  notificationService?: any;
  errorHandler?: any;
  webhookService?: any;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
  severity?: SeverityLevel['name'];
  threshold?: ThresholdConfig;
}

export interface WebVitalsMetrics {
  CLS: number; // Cumulative Layout Shift
  FID: number; // First Input Delay
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  TTFB: number; // Time to First Byte
}

export interface UserInteraction {
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'alarm_action' | 'voice_command';
  target: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ResourceMetric {
  name: string;
  type: string;
  size: number;
  loadTime: number;
  timestamp: Date;
  cached: boolean;
}

export interface MemoryMetric {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: Date;
}

export interface NetworkMetric {
  type: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  timestamp: Date;
}

export interface PerformanceReport {
  sessionId: string;
  userId?: string;
  timestamp: Date;
  webVitals: Partial<WebVitalsMetrics>;
  interactions: UserInteraction[];
  customMetrics: PerformanceMetric[];
  resourceMetrics: ResourceMetric[];
  memoryMetrics: MemoryMetric[];
  networkMetrics: NetworkMetric[];
  alerts: PerformanceAlert[];
  deviceInfo: DeviceInfo;
  appInfo: AppInfo;
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  severity: SeverityLevel['name'];
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  description: string;
  tags?: Record<string, string>;
}

export interface DeviceInfo {
  userAgent: string;
  viewport: { width: number; height: number };
  connection?: string;
  memory?: number;
  hardwareConcurrency?: number;
  devicePixelRatio?: number;
}

export interface AppInfo {
  version: string;
  buildTime: string;
  features: string[];
  environment: string;
}

// ============================================================================
// Enhanced Performance Monitor Implementation
// ============================================================================

export class EnhancedPerformanceMonitor
  extends BaseService
  implements PerformanceMonitorInterface
{
  private sessionId: string;
  private webVitals: Partial<WebVitalsMetrics> = {};
  private interactions: UserInteraction[] = [];
  private customMetrics: PerformanceMetric[] = [];
  private resourceMetrics: ResourceMetric[] = [];
  private memoryMetrics: MemoryMetric[] = [];
  private networkMetrics: NetworkMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private observers = new Map<string, PerformanceObserver>();
  private timers = new Map<string, { start: number; tags?: Record<string, string> }>();

  private metricsInterval: NodeJS.Timeout | null = null;
  private alertingInterval: NodeJS.Timeout | null = null;
  private reportingInterval: NodeJS.Timeout | null = null;

  private cache: CacheProvider;
  private dependencies: PerformanceMonitorDependencies;

  constructor(
    dependencies: PerformanceMonitorDependencies,
    _config: PerformanceMonitorConfig
  ) {
    super('PerformanceMonitor', '2.0.0', _config);
    this.dependencies = dependencies;
    this.cache = getCacheManager().getProvider(_config.caching?.strategy || 'memory');
    this.sessionId = this.generateSessionId();
  }

  // ============================================================================
  // BaseService Implementation
  // ============================================================================

  protected getDefaultConfig(): Partial<PerformanceMonitorConfig> {
    return {
      metricsCollectionInterval: 5000, // 5 seconds
      alertingInterval: 10000, // 10 seconds
      reportingInterval: 60000, // 1 minute
      maxMetricsInMemory: 1000,
      metricsRetentionDays: 7,
      enablePersistentStorage: true,

      webVitalsThresholds: {
        LCP: { good: 2500, poor: 4000 },
        FID: { good: 100, poor: 300 },
        CLS: { good: 0.1, poor: 0.25 },
        FCP: { good: 1800, poor: 3000 },
        TTFB: { good: 800, poor: 1800 },
      },

      customThresholds: {
        page_load_time: {
          good: 3000,
          poor: 5000,
          metric: 'page_load_time',
          unit: 'ms',
          alertOnExceeded: true,
          consecutiveFailures: 3,
        },
        api_response_time: {
          good: 500,
          poor: 2000,
          metric: 'api_response_time',
          unit: 'ms',
          alertOnExceeded: true,
          consecutiveFailures: 2,
        },
      },

      alertingEnabled: true,
      alertChannels: [
        {
          type: 'console',
          enabled: true,
          severityFilter: ['medium', 'high', 'critical'],
        },
        {
          type: 'analytics',
          enabled: true,
          severityFilter: ['high', 'critical'],
        },
      ],

      severityLevels: [
        { name: 'low', threshold: 0.7, description: 'Minor performance degradation' },
        {
          name: 'medium',
          threshold: 0.85,
          description: 'Noticeable performance impact',
        },
        {
          name: 'high',
          threshold: 0.95,
          description: 'Significant performance issues',
        },
        {
          name: 'critical',
          threshold: 1.0,
          description: 'Critical performance failure',
        },
      ],

      performanceBudgets: [
        {
          name: 'Page Load Budget',
          metrics: ['LCP', 'FCP', 'page_load_time'],
          limit: 5000,
          timeWindow: 60000,
          alertOnExceeded: true,
        },
      ],

      enableWebVitalsTracking: true,
      enableResourceTracking: true,
      enableMemoryTracking: true,
      enableErrorTracking: true,
      enableUserInteractionTracking: true,
      enableNetworkTracking: true,

      ...(super.getDefaultConfig?.() || {}),
    };
  }

  protected async doInitialize(): Promise<void> {
    const timerId = this.startTimer('initialize');

    try {
      // Set up performance tracking
      if ((this._config as PerformanceMonitorConfig).enableWebVitalsTracking) {
        this.setupWebVitalsTracking();
      }

      if ((this._config as PerformanceMonitorConfig).enableResourceTracking) {
        this.setupResourceTracking();
      }

      if ((this._config as PerformanceMonitorConfig).enableMemoryTracking) {
        this.setupMemoryTracking();
      }

      if ((this._config as PerformanceMonitorConfig).enableUserInteractionTracking) {
        this.setupUserInteractionTracking();
      }

      if ((this._config as PerformanceMonitorConfig).enableNetworkTracking) {
        this.setupNetworkTracking();
      }

      // Load existing metrics from cache
      await this.loadMetricsFromCache();

      // Start periodic tasks
      this.startPeriodicTasks();

      this.emit('performance:initialized', {
        sessionId: this.sessionId,
        trackingEnabled: this.getEnabledFeatures(),
      });

      this.recordMetric('initialize_duration', this.endTimer(timerId) || 0);
    } catch (_error) {
      this.handleError(_error, 'Failed to initialize PerformanceMonitor');
      throw _error;
    }
  }

  protected async doCleanup(): Promise<void> {
    try {
      // Stop periodic tasks
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }

      if (this.alertingInterval) {
        clearInterval(this.alertingInterval);
        this.alertingInterval = null;
      }

      if (this.reportingInterval) {
        clearInterval(this.reportingInterval);
        this.reportingInterval = null;
      }

      // Disconnect observers
      for (const [name, observer] of this.observers) {
        observer.disconnect();
      }
      this.observers.clear();

      // Save final metrics
      await this.saveMetricsToCache();

      // Generate final report
      await this.generatePerformanceReport();

      // Clear in-memory data
      this.customMetrics = [];
      this.interactions = [];
      this.resourceMetrics = [];
      this.memoryMetrics = [];
      this.alerts = [];
    } catch (_error) {
      this.handleError(_error, 'Failed to cleanup PerformanceMonitor');
    }
  }

  public async getHealth(): Promise<ServiceHealth> {
    const baseHealth = await super.getHealth();

    const config = this._config as PerformanceMonitorConfig;
    const metricsCount = this.customMetrics.length;
    const alertsCount = this.alerts.filter(a => !a.resolved).length;

    // Determine health based on metrics count and active alerts
    let status = baseHealth.status;
    if (metricsCount > _config.maxMetricsInMemory * 0.8) {
      status = 'degraded';
    }
    if (alertsCount > 10 || metricsCount >= _config.maxMetricsInMemory) {
      status = 'unhealthy';
    }

    return {
      ...baseHealth,
      status,
      metrics: {
        ...(baseHealth.metrics || {}),
        sessionId: this.sessionId,
        metricsCount,
        activeAlerts: alertsCount,
        webVitalsTracked: Object.keys(this.webVitals).length,
        observersActive: this.observers.size,
      },
    };
  }

  // ============================================================================
  // PerformanceMonitorInterface Implementation
  // ============================================================================

  public recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      tags,
      severity: this.determineSeverity(name, value),
    };

    // Add threshold info if available
    const config = this.config as PerformanceMonitorConfig;
    if (_config.customThresholds[name]) {
      metric.threshold = _config.customThresholds[name];
    }

    this.customMetrics.push(metric);

    // Check memory limit
    if (this.customMetrics.length > _config.maxMetricsInMemory) {
      this.customMetrics = this.customMetrics.slice(
        -Math.floor(_config.maxMetricsInMemory * 0.8)
      );
    }

    // Check for threshold violations
    this.checkThresholdViolation(metric);

    // Emit event
    this.emit('performance:metric_recorded', metric);
  }

  public recordWebVital(name: string, value: number): void {
    const vitalName = name as keyof WebVitalsMetrics;
    this.webVitals[vitalName] = value;

    this.recordMetric(`web_vital_${name.toLowerCase()}`, value, {
      category: 'web_vitals',
      vital: name,
    });

    // Check Web Vitals threshold
    this.checkWebVitalThreshold(vitalName, value);
  }

  public setThreshold(metric: string, threshold: number): void {
    const config = this.config as PerformanceMonitorConfig;

    if (!_config.customThresholds[metric]) {
      _config.customThresholds[metric] = {
        good: threshold * 0.7,
        poor: threshold,
        metric,
        unit: 'ms',
        alertOnExceeded: true,
        consecutiveFailures: 3,
      };
    } else {
      _config.customThresholds[metric].poor = threshold;
    }

    this.emit('performance:threshold_updated', { metric, threshold });
  }

  public async getMetrics(timeRange?: { start: Date; end: Date }): Promise<any> {
    let metrics = [...this.customMetrics];

    if (timeRange) {
      metrics = metrics.filter(
        metric =>
          metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
      );
    }

    return {
      customMetrics: metrics,
      webVitals: this.webVitals,
      interactions: this.interactions,
      resourceMetrics: this.resourceMetrics,
      memoryMetrics: this.memoryMetrics,
      networkMetrics: this.networkMetrics,
      alerts: this.alerts.filter(
        alert =>
          !timeRange ||
          (alert.timestamp >= timeRange.start && alert.timestamp <= timeRange.end)
      ),
    };
  }

  public async createAlert(_config: any): Promise<string> {
    const alert: PerformanceAlert = {
      id: this.generateAlertId(),
      metric: config.metric,
      value: config.value,
      threshold: config.threshold,
      severity: config.severity || 'medium',
      timestamp: new Date(),
      resolved: false,
      description: config.description || `${_config.metric} exceeded threshold`,
      tags: config.tags,
    };

    this.alerts.push(alert);

    // Trigger alert notifications
    await this.processAlert(alert);

    this.emit('performance:alert_created', alert);

    return alert.id;
  }

  // ============================================================================
  // Enhanced Performance Methods
  // ============================================================================

  public startTimer(operation: string, tags?: Record<string, string>): string {
    const timerId = `${operation}_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    this.timers.set(timerId, {
      start: performance.now(),
      tags,
    });

    return timerId;
  }

  public endTimer(timerId: string): number | null {
    const timer = this.timers.get(timerId);
    if (!timer) return null;

    const duration = performance.now() - timer.start;
    this.timers.delete(timerId);

    // Extract operation name from timer ID
    const operation = timerId.split('_')[0];
    this.recordMetric(`${operation}_duration`, duration, {
      ...timer.tags,
      category: 'timing',
    });

    return duration;
  }

  public trackUserInteraction(
    type: UserInteraction['type'],
    target: string,
    metadata?: any
  ): void {
    const interaction: UserInteraction = {
      type,
      target,
      timestamp: new Date(),
      metadata,
    };

    this.interactions.push(interaction);

    // Limit interactions in memory
    if (this.interactions.length > 100) {
      this.interactions = this.interactions.slice(-50);
    }

    this.recordMetric('user_interaction', 1, {
      interaction_type: type,
      target,
      category: 'user_behavior',
    });
  }

  public async generatePerformanceReport(): Promise<PerformanceReport> {
    const report: PerformanceReport = {
      sessionId: this.sessionId,
      timestamp: new Date(),
      webVitals: { ...this.webVitals },
      interactions: [...this.interactions],
      customMetrics: [...this.customMetrics],
      resourceMetrics: [...this.resourceMetrics],
      memoryMetrics: [...this.memoryMetrics],
      networkMetrics: [...this.networkMetrics],
      alerts: [...this.alerts],
      deviceInfo: this.getDeviceInfo(),
      appInfo: this.getAppInfo(),
    };

    // Save report to cache
    await this.cache.set(`performance_report:${this.sessionId}`, report, 86400000); // 24 hours

    // Send to analytics if available
    if (this.dependencies.analyticsService) {
      await this.dependencies.analyticsService.track('performance_report_generated', {
        sessionId: this.sessionId,
        metricsCount: report.customMetrics.length,
        alertsCount: report.alerts.length,
        webVitalsCount: Object.keys(report.webVitals).length,
      });
    }

    this.emit('performance:report_generated', report);

    return report;
  }

  public async clearMetrics(): Promise<void> {
    this.customMetrics = [];
    this.interactions = [];
    this.resourceMetrics = [];
    this.memoryMetrics = [];
    this.alerts = [];
    this.webVitals = {};

    await this.cache.clear();

    this.emit('performance:metrics_cleared');
  }

  // ============================================================================
  // Private Implementation Methods
  // ============================================================================

  private setupWebVitalsTracking(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        const value = lastEntry.renderTime || lastEntry.loadTime || 0;
        this.recordWebVital('LCP', value);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver(list => {
        list.getEntries().forEach((entry: any) => {
          const value = entry.processingStart - entry.startTime;
          this.recordWebVital('FID', value);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver(list => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordWebVital('CLS', clsValue);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);

      // First Contentful Paint (FCP)
      const paintObserver = new PerformanceObserver(list => {
        list.getEntries().forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.recordWebVital('FCP', entry.startTime);
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.set('paint', paintObserver);

      // Time to First Byte (TTFB)
      const navigationEntries = performance.getEntriesByType(
        'navigation'
      ) as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0];
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        this.recordWebVital('TTFB', ttfb);
      }
    } catch (_error) {
      this.handleError(_error, 'Failed to setup web vitals tracking');
    }
  }

  private setupResourceTracking(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const resourceObserver = new PerformanceObserver(list => {
        list.getEntries().forEach((entry: any) => {
          const resourceMetric: ResourceMetric = {
            name: entry.name,
            type: entry.initiatorType || 'unknown',
            size: entry.transferSize || 0,
            loadTime: entry.responseEnd - entry.startTime,
            timestamp: new Date(),
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
          };

          this.resourceMetrics.push(resourceMetric);

          // Limit resource metrics in memory
          if (this.resourceMetrics.length > 200) {
            this.resourceMetrics = this.resourceMetrics.slice(-100);
          }

          this.recordMetric('resource_load_time', resourceMetric.loadTime, {
            resource_type: resourceMetric.type,
            cached: resourceMetric.cached.toString(),
            category: 'resources',
          });
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (_error) {
      this.handleError(_error, 'Failed to setup resource tracking');
    }
  }

  private setupMemoryTracking(): void {
    if (!('memory' in performance)) return;

    const trackMemory = () => {
      const memory = (performance as any).memory;
      const memoryMetric: MemoryMetric = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: new Date(),
      };

      this.memoryMetrics.push(memoryMetric);

      // Limit memory metrics in memory
      if (this.memoryMetrics.length > 100) {
        this.memoryMetrics = this.memoryMetrics.slice(-50);
      }

      this.recordMetric('memory_usage', memoryMetric.usedJSHeapSize, {
        category: 'memory',
      });

      this.recordMetric(
        'memory_usage_percent',
        (memoryMetric.usedJSHeapSize / memoryMetric.jsHeapSizeLimit) * 100,
        { category: 'memory' }
      );
    };

    // Track memory immediately and then periodically
    trackMemory();

    const memoryInterval = setInterval(trackMemory, 30000); // Every 30 seconds

    // Store interval for cleanup
    (this as any).memoryInterval = memoryInterval;
  }

  private setupUserInteractionTracking(): void {
    // Track clicks
    document.addEventListener('click', _event => {
      const target = this.getElementIdentifier(_event.target as Element);
      this.trackUserInteraction('click', target, {
        x: event.clientX,
        y: _event.clientY,
      });
    });

    // Track scrolling
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackUserInteraction('scroll', 'document', {
          scrollY: window.scrollY,
          scrollX: window.scrollX,
        });
      }, 100);
    });

    // Track input events
    document.addEventListener('input', _event => {
      const target = this.getElementIdentifier(_event.target as Element);
      this.trackUserInteraction('input', target);
    });
  }

  private setupNetworkTracking(): void {
    if (!('connection' in navigator)) return;

    const connection = (navigator as any).connection;

    const trackNetwork = () => {
      const networkMetric: NetworkMetric = {
        type: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        timestamp: new Date(),
      };

      this.networkMetrics.push(networkMetric);

      if (this.networkMetrics.length > 50) {
        this.networkMetrics = this.networkMetrics.slice(-25);
      }

      this.recordMetric('network_downlink', networkMetric.downlink, {
        network_type: networkMetric.type,
        effective_type: networkMetric.effectiveType,
        category: 'network',
      });
    };

    trackNetwork();
    connection.addEventListener('change', trackNetwork);
  }

  private startPeriodicTasks(): void {
    const config = this._config as PerformanceMonitorConfig;

    // Metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectPeriodicMetrics().catch(_error =>
        this.handleError(_error, 'Failed in periodic metrics collection')
      );
    }, config.metricsCollectionInterval);

    // Alerting
    if (_config.alertingEnabled) {
      this.alertingInterval = setInterval(() => {
        this.checkPerformanceBudgets().catch(_error =>
          this.handleError(_error, 'Failed in alerting check')
        );
      }, config.alertingInterval);
    }

    // Reporting
    this.reportingInterval = setInterval(() => {
      this.generatePerformanceReport().catch(_error =>
        this.handleError(_error, 'Failed to generate performance report')
      );
    }, config.reportingInterval);
  }

  private async collectPeriodicMetrics(): Promise<void> {
    // Collect current performance metrics
    this.recordMetric('session_duration', Date.now() - performance.timeOrigin, {
      category: 'session',
    });

    // Check memory if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric(
        'heap_usage_percent',
        (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      );
    }

    // Record active observers
    this.recordMetric('active_observers', this.observers.size, {
      category: 'monitoring',
    });
  }

  private async checkPerformanceBudgets(): Promise<void> {
    const config = this._config as PerformanceMonitorConfig;

    for (const budget of _config.performanceBudgets) {
      const recentMetrics = this.customMetrics.filter(
        metric =>
          budget.metrics.includes(metric.name) &&
          Date.now() - metric.timestamp.getTime() <= budget.timeWindow
      );

      const averageValue =
        recentMetrics.reduce((sum, metric) => sum + metric.value, 0) /
        recentMetrics.length;

      if (averageValue > budget.limit && budget.alertOnExceeded) {
        await this.createAlert({
          metric: budget.name,
          value: averageValue,
          threshold: budget.limit,
          severity: 'high',
          description: `Performance budget exceeded: ${budget.name}`,
          tags: { budget: budget.name, type: 'budget_violation' },
        });
      }
    }
  }

  private determineSeverity(metricName: string, value: number): SeverityLevel['name'] {
    const config = this.config as PerformanceMonitorConfig;
    const threshold = _config.customThresholds[metricName];

    if (!threshold) return 'low';

    const ratio = value / threshold.poor;

    for (const level of _config.severityLevels.sort(
      (a, b) => b.threshold - a.threshold
    )) {
      if (ratio >= level.threshold) {
        return level.name;
      }
    }

    return 'low';
  }

  private checkThresholdViolation(metric: PerformanceMetric): void {
    if (!metric.threshold || !metric.threshold.alertOnExceeded) return;

    if (metric.value > metric.threshold.poor) {
      this.createAlert({
        metric: metric.name,
        value: metric.value,
        threshold: metric.threshold.poor,
        severity: this.determineSeverity(metric.name, metric.value),
        description: `Threshold exceeded for ${metric.name}`,
        tags: { ...metric.tags, type: 'threshold_violation' },
      });
    }
  }

  private checkWebVitalThreshold(
    vitalName: keyof WebVitalsMetrics,
    value: number
  ): void {
    const config = this.config as PerformanceMonitorConfig;
    const threshold = _config.webVitalsThresholds[vitalName];

    if (!threshold) return;

    if (value > threshold.poor) {
      this.createAlert({
        metric: `web_vital_${vitalName.toLowerCase()}`,
        value,
        threshold: threshold.poor,
        severity: 'high',
        description: `Poor Web Vital: ${vitalName}`,
        tags: { vital: vitalName, category: 'web_vitals' },
      });
    }
  }

  private async processAlert(alert: PerformanceAlert): Promise<void> {
    const config = this._config as PerformanceMonitorConfig;

    for (const channel of _config.alertChannels) {
      if (!channel.enabled || !channel.severityFilter.includes(alert.severity)) {
        continue;
      }

      try {
        switch (channel.type) {
          case 'console':
            console.warn(`[Performance Alert] ${alert.description}`, alert);
            break;

          case 'analytics':
            if (this.dependencies.analyticsService) {
              await this.dependencies.analyticsService.track(
                'performance_alert_triggered',
                {
                  alertId: alert.id,
                  metric: alert.metric,
                  value: alert.value,
                  threshold: alert.threshold,
                  severity: alert.severity,
                }
              );
            }
            break;

          case 'notification':
            if (this.dependencies.notificationService) {
              await this.dependencies.notificationService.send({
                title: 'Performance Alert',
                message: alert.description,
                severity: alert.severity,
              });
            }
            break;

          case 'webhook':
            if (channel.endpoint && this.dependencies.webhookService) {
              await this.dependencies.webhookService.send(channel.endpoint, alert);
            }
            break;
        }
      } catch (_error) {
        this.handleError(_error, 'Failed to process alert', {
          alertId: alert.id,
          channel: channel.type,
        });
      }
    }
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      connection: (navigator as any).connection?.effectiveType,
      memory: (performance as any).memory?.jsHeapSizeLimit,
      hardwareConcurrency: navigator.hardwareConcurrency,
      devicePixelRatio: window.devicePixelRatio,
    };
  }

  private getAppInfo(): AppInfo {
    return {
      version: '2.0.0',
      buildTime: new Date().toISOString(),
      features: this.getEnabledFeatures(),
      environment: this._config.environment || 'development',
    };
  }

  private getEnabledFeatures(): string[] {
    const config = this._config as PerformanceMonitorConfig;
    const features: string[] = [];

    if (_config.enableWebVitalsTracking) features.push('web_vitals');
    if (_config.enableResourceTracking) features.push('resources');
    if (_config.enableMemoryTracking) features.push('memory');
    if (_config.enableUserInteractionTracking) features.push('interactions');
    if (_config.enableNetworkTracking) features.push('network');
    if (_config.alertingEnabled) features.push('alerting');

    return features;
  }

  private getElementIdentifier(element: Element): string {
    if (!element) return 'unknown';

    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async loadMetricsFromCache(): Promise<void> {
    try {
      const cachedMetrics =
        await this.cache.get<PerformanceMetric[]>('performance_metrics');
      if (cachedMetrics) {
        this.customMetrics = cachedMetrics;
      }

      const cachedAlerts =
        await this.cache.get<PerformanceAlert[]>('performance_alerts');
      if (cachedAlerts) {
        this.alerts = cachedAlerts;
      }
    } catch (_error) {
      this.handleError(_error, 'Failed to load metrics from cache');
    }
  }

  private async saveMetricsToCache(): Promise<void> {
    try {
      await this.cache.set('performance_metrics', this.customMetrics, 86400000); // 24 hours
      await this.cache.set('performance_alerts', this.alerts, 86400000);
    } catch (_error) {
      this.handleError(_error, 'Failed to save metrics to cache');
    }
  }

  // ============================================================================
  // Testing Support Methods
  // ============================================================================

  public async reset(): Promise<void> {
    if (this._config.environment !== 'test') {
      throw new Error('Reset only allowed in test environment');
    }

    await this.clearMetrics();
    this.timers.clear();
    this.observers.clear();
  }

  public getTestState(): any {
    if (this._config.environment !== 'test') {
      throw new Error('Test state only available in test environment');
    }

    return {
      sessionId: this.sessionId,
      metricsCount: this.customMetrics.length,
      alertsCount: this.alerts.length,
      webVitals: this.webVitals,
      observersCount: this.observers.size,
      timersCount: this.timers.size,
    };
  }
}

// ============================================================================
// Factory and Exports
// ============================================================================

export const createPerformanceMonitor = (
  dependencies: PerformanceMonitorDependencies = {},
  _config: Partial<PerformanceMonitorConfig> = {}
): EnhancedPerformanceMonitor => {
  const fullConfig: PerformanceMonitorConfig = {
    enabled: true,
    environment: config.environment || 'development',
    metricsCollectionInterval: config.metricsCollectionInterval || 5000,
    alertingInterval: config.alertingInterval || 10000,
    reportingInterval: config.reportingInterval || 60000,
    maxMetricsInMemory: config.maxMetricsInMemory || 1000,
    metricsRetentionDays: config.metricsRetentionDays || 7,
    enablePersistentStorage: config.enablePersistentStorage ?? true,
    webVitalsThresholds: _config.webVitalsThresholds || {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
    },
    customThresholds: config.customThresholds || {},
    alertingEnabled: config.alertingEnabled ?? true,
    alertChannels: config.alertChannels || [],
    severityLevels: config.severityLevels || [],
    performanceBudgets: config.performanceBudgets || [],
    enableWebVitalsTracking: config.enableWebVitalsTracking ?? true,
    enableResourceTracking: config.enableResourceTracking ?? true,
    enableMemoryTracking: config.enableMemoryTracking ?? true,
    enableErrorTracking: config.enableErrorTracking ?? true,
    enableUserInteractionTracking: config.enableUserInteractionTracking ?? true,
    enableNetworkTracking: config.enableNetworkTracking ?? true,
    ...config,
  };

  return new EnhancedPerformanceMonitor(dependencies, fullConfig);
};

export const performanceMonitor = createPerformanceMonitor();
