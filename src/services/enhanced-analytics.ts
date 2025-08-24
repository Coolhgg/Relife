/**
 * Enhanced Analytics Service
 * Refactored to use standardized service architecture with offline queue and performance tracking
 */

import posthog from 'posthog-js';
import { config, isEnvironment } from '../config/environment';
import { BaseService } from './base/BaseService';
import { CacheProvider, getCacheManager } from './base/CacheManager';
import {
  AnalyticsServiceInterface,
  ServiceConfig,
  ServiceHealth,
  PerformanceTracker
} from '../types/service-architecture';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface AnalyticsServiceConfig extends ServiceConfig {
  apiKey: string;
  host?: string;
  debug?: boolean;
  enableSessionRecording?: boolean;
  enableHeatmaps?: boolean;
  disableInDevelopment?: boolean;
  
  // Enhanced configuration
  maxQueueSize: number;
  flushInterval: number;
  batchSize: number;
  enableOfflineQueue: boolean;
  enablePerformanceTracking: boolean;
  enableUserJourney: boolean;
  privacyMode: 'strict' | 'standard' | 'minimal';
}

export interface UserProperties {
  id?: string;
  email?: string;
  username?: string;
  createdAt?: string;
  plan?: string;
  totalAlarms?: number;
  isSubscribed?: boolean;
  deviceType?: string;
  preferredWakeTime?: string;
  [key: string]: any;
}

export interface EventProperties {
  source?: string;
  category?: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  sessionId?: string;
  performanceMetrics?: PerformanceMetrics;
  userJourney?: UserJourneyStep[];
  [key: string]: any;
}

export interface AnalyticsEvent {
  name: string;
  properties: EventProperties;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  retryCount: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceMetrics {
  pageLoadTime?: number;
  componentRenderTime?: number;
  apiResponseTime?: number;
  memoryUsage?: number;
  navigationTiming?: NavigationTiming;
  webVitals?: WebVitals;
}

export interface WebVitals {
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
  lcp?: number; // Largest Contentful Paint
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export interface UserJourneyStep {
  action: string;
  timestamp: Date;
  context?: string;
  duration?: number;
}

export interface AnalyticsServiceDependencies {
  performanceMonitor?: PerformanceTracker;
  errorHandler?: any;
  offlineManager?: any;
  securityService?: any;
}

// Analytics events constants
export const ANALYTICS_EVENTS = {
  // App lifecycle
  APP_LAUNCHED: 'app_launched',
  APP_INSTALLED: 'app_installed',
  APP_UPDATED: 'app_updated',

  // Authentication
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  PASSWORD_RESET: 'password_reset',

  // Alarm management
  ALARM_CREATED: 'alarm_created',
  ALARM_EDITED: 'alarm_edited',
  ALARM_DELETED: 'alarm_deleted',
  ALARM_ENABLED: 'alarm_enabled',
  ALARM_DISABLED: 'alarm_disabled',

  // Alarm interactions
  ALARM_TRIGGERED: 'alarm_triggered',
  ALARM_DISMISSED: 'alarm_dismissed',
  ALARM_SNOOZED: 'alarm_snoozed',
  ALARM_MISSED: 'alarm_missed',

  // Performance
  PAGE_LOAD_TIME: 'page_load_time',
  COMPONENT_RENDER_TIME: 'component_render_time',
  API_RESPONSE_TIME: 'api_response_time',
  WEB_VITALS_MEASURED: 'web_vitals_measured',

  // User journey
  USER_JOURNEY_STARTED: 'user_journey_started',
  USER_JOURNEY_COMPLETED: 'user_journey_completed',
  USER_ACTION_PERFORMED: 'user_action_performed',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
  ERROR_BOUNDARY_TRIGGERED: 'error_boundary_triggered',

  // Business metrics
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  REVENUE_EVENT: 'revenue_event',
} as const;

// ============================================================================
// Enhanced Analytics Service Implementation
// ============================================================================

export class EnhancedAnalyticsService extends BaseService implements AnalyticsServiceInterface {
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string | null = null;
  private sessionStartTime: Date | null = null;
  private userJourney: UserJourneyStep[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private cache: CacheProvider;
  private dependencies: AnalyticsServiceDependencies;
  private isOnline = navigator.onLine;

  constructor(dependencies: AnalyticsServiceDependencies, config: AnalyticsServiceConfig) {
    super('AnalyticsService', '2.0.0', config);
    this.dependencies = dependencies;
    this.cache = getCacheManager().getProvider(config.caching?.strategy || 'memory');
    
    // Listen for online/offline events
    this.setupNetworkListeners();
  }

  // ============================================================================
  // BaseService Implementation
  // ============================================================================

  protected getDefaultConfig(): Partial<AnalyticsServiceConfig> {
    return {
      apiKey: config.analytics.posthog.apiKey,
      host: config.analytics.posthog.host,
      environment: config.env,
      debug: config.features.debugMode,
      enableSessionRecording: config.features.sessionRecording,
      enableHeatmaps: config.features.heatmaps,
      maxQueueSize: 1000,
      flushInterval: 30000, // 30 seconds
      batchSize: 50,
      enableOfflineQueue: true,
      enablePerformanceTracking: true,
      enableUserJourney: true,
      privacyMode: 'standard',
      disableInDevelopment: false,
      ...super.getDefaultConfig?.() || {}
    };
  }

  protected async doInitialize(): Promise<void> {
    const timerId = this.startTimer('initialize');

    try {
      // Initialize PostHog if API key is available
      if ((this.config as AnalyticsServiceConfig).apiKey) {
        await this.initializePostHog();
      }

      // Load queued events from cache
      await this.loadQueueFromCache();

      // Set up periodic flush
      this.setupPeriodicFlush();

      // Set up web vitals monitoring
      if ((this.config as AnalyticsServiceConfig).enablePerformanceTracking) {
        await this.setupWebVitalsMonitoring();
      }

      // Start session
      this.startSession();

      this.emit('analytics:initialized', {
        queueSize: this.eventQueue.length,
        sessionId: this.sessionId
      });

      this.recordMetric('initialize_duration', this.endTimer(timerId) || 0);

    } catch (error) {
      this.handleError(error, 'Failed to initialize AnalyticsService');
      throw error;
    }
  }

  protected async doCleanup(): Promise<void> {
    try {
      // Flush remaining events
      await this.flush();

      // Stop periodic flush
      if (this.flushInterval) {
        clearInterval(this.flushInterval);
        this.flushInterval = null;
      }

      // End session
      this.endSession();

      // Save queue to cache
      await this.saveQueueToCache();

      // Clear cache
      await this.cache.clear();

    } catch (error) {
      this.handleError(error, 'Failed to cleanup AnalyticsService');
    }
  }

  public async getHealth(): Promise<ServiceHealth> {
    const baseHealth = await super.getHealth();
    
    const queueSize = this.eventQueue.length;
    const config = this.config as AnalyticsServiceConfig;
    
    // Determine health based on queue size and connectivity
    let status = baseHealth.status;
    if (queueSize > config.maxQueueSize * 0.8) {
      status = 'degraded';
    }
    if (queueSize >= config.maxQueueSize || (!this.isOnline && queueSize > 100)) {
      status = 'unhealthy';
    }

    return {
      ...baseHealth,
      status,
      metrics: {
        ...baseHealth.metrics || {},
        queueSize,
        sessionActive: !!this.sessionId,
        isOnline: this.isOnline,
        journeySteps: this.userJourney.length
      }
    };
  }

  // ============================================================================
  // AnalyticsServiceInterface Implementation
  // ============================================================================

  public async track(eventName: string, properties: EventProperties = {}): Promise<void> {
    const timerId = this.startTimer('track');

    try {
      const event: AnalyticsEvent = {
        name: eventName,
        properties: {
          ...properties,
          timestamp: properties.timestamp || new Date().toISOString(),
          sessionId: this.sessionId || undefined,
          sessionDuration: this.getSessionDuration(),
          source: properties.source || 'web',
          ...this.getContextualProperties()
        },
        timestamp: new Date(),
        userId: properties.userId,
        sessionId: this.sessionId || undefined,
        retryCount: 0,
        priority: this.getEventPriority(eventName)
      };

      // Add performance metrics if enabled
      if ((this.config as AnalyticsServiceConfig).enablePerformanceTracking) {
        event.properties.performanceMetrics = await this.getPerformanceMetrics();
      }

      // Add user journey if enabled
      if ((this.config as AnalyticsServiceConfig).enableUserJourney) {
        event.properties.userJourney = [...this.userJourney];
      }

      // Queue event
      await this.queueEvent(event);

      // Update user journey
      this.updateUserJourney(eventName, properties.context);

      // Try immediate send if online
      if (this.isOnline) {
        await this.processQueue();
      }

      this.recordMetric('track_duration', this.endTimer(timerId) || 0);
      this.recordMetric('events_tracked', 1);

    } catch (error) {
      this.handleError(error, 'Failed to track event', { eventName, properties });
    }
  }

  public async identify(userId: string, traits: Record<string, any> = {}): Promise<void> {
    const timerId = this.startTimer('identify');

    try {
      const userProperties: UserProperties = {
        id: userId,
        deviceType: this.getDeviceType(),
        ...traits,
        ...this.getSystemProperties()
      };

      // Queue identify event
      await this.queueEvent({
        name: '_identify',
        properties: { userId, traits: userProperties },
        timestamp: new Date(),
        userId,
        sessionId: this.sessionId || undefined,
        retryCount: 0,
        priority: 'high'
      });

      // Cache user data for offline use
      await this.cache.set('user_identity', { userId, traits: userProperties }, 86400000); // 24 hours

      this.recordMetric('identify_duration', this.endTimer(timerId) || 0);

    } catch (error) {
      this.handleError(error, 'Failed to identify user', { userId, traits });
    }
  }

  public async page(name: string, properties: EventProperties = {}): Promise<void> {
    return this.track('$pageview', {
      page_name: name,
      page_url: window.location.href,
      page_path: window.location.pathname,
      referrer: document.referrer,
      ...properties
    });
  }

  public async flush(): Promise<void> {
    const timerId = this.startTimer('flush');

    try {
      await this.processQueue();
      this.recordMetric('flush_duration', this.endTimer(timerId) || 0);

    } catch (error) {
      this.handleError(error, 'Failed to flush events');
    }
  }

  public getQueueSize(): number {
    return this.eventQueue.length;
  }

  // ============================================================================
  // Enhanced Analytics Methods
  // ============================================================================

  public async trackPerformanceMetric(name: string, value: number, tags?: Record<string, string>): Promise<void> {
    return this.track(ANALYTICS_EVENTS.PAGE_LOAD_TIME, {
      metric_name: name,
      metric_value: value,
      metric_tags: tags,
      category: 'performance'
    });
  }

  public async trackWebVitals(vitals: WebVitals): Promise<void> {
    return this.track(ANALYTICS_EVENTS.WEB_VITALS_MEASURED, {
      ...vitals,
      category: 'performance',
      source: 'web_vitals_api'
    });
  }

  public async trackUserJourney(action: string, context?: string, duration?: number): Promise<void> {
    const step: UserJourneyStep = {
      action,
      timestamp: new Date(),
      context,
      duration
    };

    this.userJourney.push(step);

    // Keep journey within reasonable bounds
    if (this.userJourney.length > 100) {
      this.userJourney = this.userJourney.slice(-50);
    }

    return this.track(ANALYTICS_EVENTS.USER_ACTION_PERFORMED, {
      action,
      context,
      duration,
      journey_length: this.userJourney.length,
      category: 'user_journey'
    });
  }

  public clearUserJourney(): void {
    this.userJourney = [];
  }

  public getUserJourney(): UserJourneyStep[] {
    return [...this.userJourney];
  }

  // ============================================================================
  // Private Implementation Methods
  // ============================================================================

  private async initializePostHog(): Promise<void> {
    const config = this.config as AnalyticsServiceConfig;

    // Don't initialize in test environments
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    try {
      posthog.init(config.apiKey, {
        api_host: config.host || 'https://app.posthog.com',
        debug: config.debug || isEnvironment.development,
        respect_dnt: config.privacyMode === 'strict',
        disable_session_recording: !config.enableSessionRecording,
        disable_surveys: isEnvironment.development,
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: !isEnvironment.production,
        session_recording: {
          maskAllInputs: config.privacyMode !== 'minimal',
          recordCrossOriginIframes: false
        },
        property_blacklist: this.getPropertyBlacklist(config.privacyMode),
        loaded: (posthog) => {
          posthog.register({
            app_environment: config.environment,
            app_version: '2.0.0',
            performance_monitoring_enabled: config.enablePerformanceTracking
          });
        }
      });

    } catch (error) {
      this.handleError(error, 'Failed to initialize PostHog');
    }
  }

  private async queueEvent(event: AnalyticsEvent): Promise<void> {
    const config = this.config as AnalyticsServiceConfig;

    // Check queue size limit
    if (this.eventQueue.length >= config.maxQueueSize) {
      // Remove oldest low-priority events
      this.eventQueue = this.eventQueue
        .filter(e => e.priority !== 'low')
        .slice(-(config.maxQueueSize - 1));
    }

    this.eventQueue.push(event);

    // Cache queue for offline persistence
    if (config.enableOfflineQueue) {
      await this.saveQueueToCache();
    }
  }

  private async processQueue(): Promise<void> {
    if (!this.isOnline || this.eventQueue.length === 0) {
      return;
    }

    const config = this.config as AnalyticsServiceConfig;
    const batch = this.eventQueue.splice(0, config.batchSize);

    try {
      // Process batch
      for (const event of batch) {
        if (event.name === '_identify') {
          posthog.identify(event.properties.userId, event.properties.traits);
        } else {
          posthog.capture(event.name, event.properties);
        }
      }

      // Update cache
      await this.saveQueueToCache();

    } catch (error) {
      // Re-queue failed events with increased retry count
      const retriedEvents = batch.map(event => ({
        ...event,
        retryCount: event.retryCount + 1
      })).filter(event => event.retryCount < 3); // Max 3 retries

      this.eventQueue.unshift(...retriedEvents);
      this.handleError(error, 'Failed to process analytics batch');
    }
  }

  private setupPeriodicFlush(): void {
    const config = this.config as AnalyticsServiceConfig;
    
    this.flushInterval = setInterval(() => {
      this.processQueue().catch(error => 
        this.handleError(error, 'Failed in periodic flush')
      );
    }, config.flushInterval);
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue().catch(error => 
        this.handleError(error, 'Failed to process queue when coming online')
      );
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async setupWebVitalsMonitoring(): Promise<void> {
    try {
      // Use web-vitals library if available
      if (typeof window !== 'undefined' && 'performance' in window) {
        // Monitor Core Web Vitals
        this.monitorWebVitals();
      }
    } catch (error) {
      this.handleError(error, 'Failed to setup web vitals monitoring');
    }
  }

  private monitorWebVitals(): void {
    // Monitor LCP (Largest Contentful Paint)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.trackWebVitals({ lcp: lastEntry.startTime });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Monitor FID (First Input Delay)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        this.trackWebVitals({ fid: entry.processingStart - entry.startTime });
      });
    }).observe({ entryTypes: ['first-input'] });

    // Monitor CLS (Cumulative Layout Shift)
    new PerformanceObserver((entryList) => {
      let cls = 0;
      entryList.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      });
      this.trackWebVitals({ cls });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private startSession(): void {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
    this.userJourney = [];

    this.track(ANALYTICS_EVENTS.APP_LAUNCHED, {
      session_id: this.sessionId,
      category: 'session'
    });
  }

  private endSession(): void {
    if (this.sessionId && this.sessionStartTime) {
      this.track('session_ended', {
        session_id: this.sessionId,
        session_duration: Date.now() - this.sessionStartTime.getTime(),
        journey_steps: this.userJourney.length,
        category: 'session'
      });
    }

    this.sessionId = null;
    this.sessionStartTime = null;
    this.userJourney = [];
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private getSessionDuration(): number | undefined {
    if (!this.sessionStartTime) return undefined;
    return Date.now() - this.sessionStartTime.getTime();
  }

  private updateUserJourney(action: string, context?: string): void {
    const config = this.config as AnalyticsServiceConfig;
    
    if (!config.enableUserJourney) return;

    const step: UserJourneyStep = {
      action,
      timestamp: new Date(),
      context
    };

    this.userJourney.push(step);

    // Keep journey within reasonable bounds
    if (this.userJourney.length > 100) {
      this.userJourney = this.userJourney.slice(-50);
    }
  }

  private getEventPriority(eventName: string): AnalyticsEvent['priority'] {
    // Critical events that should always be sent
    const criticalEvents = ['error_occurred', 'subscription_started', 'revenue_event'];
    if (criticalEvents.includes(eventName)) return 'critical';

    // High priority events
    const highPriorityEvents = ['user_signed_up', 'alarm_triggered', 'app_launched'];
    if (highPriorityEvents.includes(eventName)) return 'high';

    // Medium priority events
    const mediumPriorityEvents = ['alarm_created', 'page_view', 'feature_used'];
    if (mediumPriorityEvents.some(event => eventName.includes(event))) return 'medium';

    return 'low';
  }

  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {};

    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        metrics.pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart;
        metrics.navigationTiming = navigation;
      }

      // Memory usage (if available)
      if ('memory' in window.performance) {
        const memory = (window.performance as any).memory;
        metrics.memoryUsage = memory.usedJSHeapSize;
      }
    }

    return metrics;
  }

  private getContextualProperties(): Record<string, any> {
    return {
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      online: navigator.onLine
    };
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/tablet|ipad|playbook|silk/.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|android|touch|webos|iphone|ipad|ipod|blackberry|kindle/.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getSystemProperties(): Record<string, any> {
    return {
      platform: navigator.platform,
      cookies_enabled: navigator.cookieEnabled,
      do_not_track: navigator.doNotTrack === '1',
      connection_type: this.getConnectionType()
    };
  }

  private getConnectionType(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection?.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  private getPropertyBlacklist(privacyMode: string): string[] {
    const baseBlacklist = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
    
    if (privacyMode === 'strict') {
      return [...baseBlacklist, 'email', 'phone', 'address', 'ip'];
    }
    
    return baseBlacklist;
  }

  private async loadQueueFromCache(): Promise<void> {
    try {
      const cachedQueue = await this.cache.get<AnalyticsEvent[]>('analytics_queue');
      if (cachedQueue && Array.isArray(cachedQueue)) {
        this.eventQueue = cachedQueue;
      }
    } catch (error) {
      this.handleError(error, 'Failed to load queue from cache');
    }
  }

  private async saveQueueToCache(): Promise<void> {
    try {
      await this.cache.set('analytics_queue', this.eventQueue, 86400000); // 24 hours
    } catch (error) {
      this.handleError(error, 'Failed to save queue to cache');
    }
  }
}

// ============================================================================
// Factory and Exports
// ============================================================================

export const createAnalyticsService = (
  dependencies: AnalyticsServiceDependencies = {},
  config: Partial<AnalyticsServiceConfig> = {}
): EnhancedAnalyticsService => {
  const fullConfig: AnalyticsServiceConfig = {
    enabled: true,
    environment: config.environment || 'development',
    apiKey: config.apiKey || '',
    host: config.host,
    debug: config.debug || false,
    enableSessionRecording: config.enableSessionRecording || false,
    enableHeatmaps: config.enableHeatmaps || false,
    disableInDevelopment: config.disableInDevelopment || false,
    maxQueueSize: config.maxQueueSize || 1000,
    flushInterval: config.flushInterval || 30000,
    batchSize: config.batchSize || 50,
    enableOfflineQueue: config.enableOfflineQueue ?? true,
    enablePerformanceTracking: config.enablePerformanceTracking ?? true,
    enableUserJourney: config.enableUserJourney ?? true,
    privacyMode: config.privacyMode || 'standard',
    ...config
  };

  return new EnhancedAnalyticsService(dependencies, fullConfig);
};

// Export singleton instance for backward compatibility
export const analyticsService = createAnalyticsService();

export { ANALYTICS_EVENTS };