// Analytics Service for Smart Alarm App
// Provides comprehensive user behavior tracking and analytics using PostHog
// Enhanced with environment-specific configuration

import posthog from 'posthog-js';
import { config, isEnvironment } from '../config/environment';

export interface AnalyticsConfig {
  apiKey: string;
  host?: string;
  environment: 'development' | 'staging' | 'production';
  debug?: boolean;
  enableSessionRecording?: boolean;
  enableHeatmaps?: boolean;
  disableInDevelopment?: boolean;
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
}

export interface EventProperties {
  source?: string;
  category?: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  sessionId?: string;
  // Allow custom properties for flexible analytics
  [key: string]: any;
}

// Common event names as constants for consistency
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

  // Features
  VOICE_COMMAND_USED: 'voice_command_used',
  VOICE_RECOGNITION_ENABLED: 'voice_recognition_enabled',
  NOTIFICATION_PERMISSION_GRANTED: 'notification_permission_granted',
  NOTIFICATION_PERMISSION_DENIED: 'notification_permission_denied',

  // PWA
  PWA_INSTALL_PROMPTED: 'pwa_install_prompted',
  PWA_INSTALLED: 'pwa_installed',
  PWA_INSTALL_DISMISSED: 'pwa_install_dismissed',

  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',

  // Settings
  SETTINGS_OPENED: 'settings_opened',
  SETTING_CHANGED: 'setting_changed',
  THEME_CHANGED: 'theme_changed',

  // Performance
  PAGE_LOAD_TIME: 'page_load_time',
  COMPONENT_RENDER_TIME: 'component_render_time',
  API_RESPONSE_TIME: 'api_response_time',

  // Errors (for cross-tracking with Sentry)
  ERROR_OCCURRED: 'error_occurred',
  ERROR_BOUNDARY_TRIGGERED: 'error_boundary_triggered',

  // Engagement
  SESSION_STARTED: 'session_started',
  SESSION_ENDED: 'session_ended',
  FEATURE_DISCOVERY: 'feature_discovery',
  HELP_ACCESSED: 'help_accessed',

  // Retention
  DAILY_ACTIVE: 'daily_active',
  WEEKLY_ACTIVE: 'weekly_active',
  MONTHLY_ACTIVE: 'monthly_active',

  // Business metrics
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  REVENUE_EVENT: 'revenue_event',
} as const;

class AnalyticsService {
  private static instance: AnalyticsService;
  private isInitialized = false;
  private config: AnalyticsConfig | null = null;
  private sessionId: string | null = null;
  private sessionStartTime: TimeoutHandle | null = null;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize PostHog analytics with environment-specific configuration
   */
  initialize(customConfig?: Partial<AnalyticsConfig>): void {
    if (this.isInitialized) {
      return;
    }

    // Don't initialize in test environments
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    // Use environment configuration by default
    const analyticsConfig: AnalyticsConfig = {
      apiKey: config.analytics.posthog.apiKey,
      host: config.analytics.posthog.host,
      environment: config.env,
      debug: config.features.debugMode,
      enableSessionRecording: config.features.sessionRecording,
      enableHeatmaps: config.features.heatmaps,
      disableInDevelopment: false, // We handle this here
      ...customConfig,
    };

    // Don't initialize if no API key is provided
    if (!analyticsConfig.apiKey) {
      return;
    }

    this.config = analyticsConfig;

    try {
      posthog.init(analyticsConfig.apiKey, {
        api_host: analyticsConfig.host || 'https://app.posthog.com',

        // Environment-specific settings
        debug: analyticsConfig.debug || isEnvironment.development,

        // Privacy settings
        respect_dnt: true,
        disable_session_recording: !analyticsConfig.enableSessionRecording,
        disable_surveys: isEnvironment.development,

        // Performance settings
        capture_pageview: true,
        capture_pageleave: true,

        // Feature flags
        bootstrap: {
          distinctID: this.generateSessionId(),
        },

        // Autocapture settings
        autocapture: !isEnvironment.production, // More selective in production

        // Session recording settings
        session_recording: {
          maskAllInputs: true,
          recordCrossOriginIframes: false,
        },

        // Heatmaps
        enable_recording_console_log: config.features.debugMode || false,

        // Custom properties to include with every event
        property_blacklist: [
          // Sensitive data to exclude
          'password',
          'token',
          'key',
          'secret',
          'auth',
          'credential',
          'ssn',
          'credit_card',
        ],

        // Environment-specific performance settings
        loaded: posthog => {
          // Set super properties that apply to all events
          posthog.register({
            app_environment: config.env,
            app_version: config.version,
            app_build_time: config.buildTime,
            performance_monitoring_enabled: config.performance.enabled,
          });
        },
      });

      // Start session tracking
      this.startSession();

      this.isInitialized = true;

      // Track app launch with environment info
      this.track(ANALYTICS_EVENTS.APP_LAUNCHED, {
        environment: config.env,
        version: config.version,
        build_time: config.buildTime,
        domain: config.domain,
        performance_enabled: config.performance.enabled,
        features_enabled: Object.entries(config.features)
          .filter(([_, enabled]) => enabled)
          .map(([feature]) => feature),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Track initialization failure - silently fail in production
      // Error is already logged by the underlying PostHog library if needed
    }
  }

  /**
   * Identify a user with properties
   */
  identify(userId: string, properties: UserProperties = {}): void {
    if (!this.isInitialized) return;

    posthog.identify(userId, {
      email: properties.email,
      username: properties.username,
      created_at: properties.createdAt,
      plan: properties.plan,
      total_alarms: properties.totalAlarms,
      is_subscribed: properties.isSubscribed,
      device_type: this.getDeviceType(),
      preferred_wake_time: properties.preferredWakeTime,
      ...this.getSystemProperties(),
    });
  }

  /**
   * Reset user identity (e.g., on logout)
   */
  reset(): void {
    if (!this.isInitialized) return;

    posthog.reset();
    this.endSession();
  }

  /**
   * Track an event with properties
   */
  track(eventName: string, properties: EventProperties = {}): void {
    if (!this.isInitialized) {
      return;
    }

    const enhancedProperties = {
      ...properties,
      timestamp: properties.timestamp || new Date().toISOString(),
      session_id: this.sessionId,
      session_duration: this.getSessionDuration(),
      source: properties.source || 'web',
      ...this.getContextualProperties(),
    };

    posthog.capture(eventName, enhancedProperties);
  }

  /**
   * Set user properties without identifying
   */
  setUserProperties(properties: Partial<UserProperties>): void {
    if (!this.isInitialized) return;

    posthog.people.set({
      device_type: this.getDeviceType(),
      ...properties,
      ...this.getSystemProperties(),
    });
  }

  /**
   * Increment a numeric property
   */
  incrementProperty(property: string, value: number = 1): void {
    if (!this.isInitialized) return;

    // PostHog doesn't have people.increment, so we track as an event
    this.track('property_increment', {
      property,
      value,
      increment: true,
    });
  }

  /**
   * Track page view with enhanced context
   */
  trackPageView(pageName?: string, properties: EventProperties = {}): void {
    if (!this.isInitialized) return;

    const pageProperties = {
      page_name: pageName || document.title,
      page_url: window.location.href,
      page_path: window.location.pathname,
      referrer: document.referrer,
      ...properties,
    };

    this.track('$pageview', pageProperties);
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(
    featureName: string,
    action?: any /* auto: placeholder param - adjust */,
    properties: EventProperties = {}
  ): void {
    this.track('feature_used', {
      feature_name: featureName,
      action: action || 'used',
      ...properties,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(
    metricName: string,
    value: number,
    unit: string = 'ms',
    properties: EventProperties = {}
  ): void {
    this.track(ANALYTICS_EVENTS.PAGE_LOAD_TIME, {
      metric_name: metricName,
      value,
      unit,
      ...properties,
    });
  }

  /**
   * Track errors (to correlate with Sentry)
   */
  trackError(error: Error, _contextName?: any /* auto: placeholder param - adjust */, context: EventProperties = {}): void {
    this.track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500), // Truncate for performance
      error_name: error.name,
      ...context,
    });
  }

  /**
   * Track conversion events
   */
  trackConversion(
    conversionType: string,
    value?: number,
    properties: EventProperties = {}
  ): void {
    this.track('conversion', {
      conversion_type: conversionType,
      value,
      ...properties,
    });
  }

  /**
   * Enable/disable session recording
   */
  toggleSessionRecording(enabled: boolean): void {
    if (!this.isInitialized) return;

    if (enabled) {
      posthog.startSessionRecording();
    } else {
      posthog.stopSessionRecording();
    }
  }

  /**
   * Capture user feedback
   */
  captureFeedback(
    rating: number,
    comment: string,
    properties: EventProperties = {}
  ): void {
    this.track('feedback_submitted', {
      rating,
      comment,
      ...properties,
    });
  }

  /**
   * Track experiment participation
   */
  trackExperiment(
    experimentName: string,
    variant: string,
    properties: EventProperties = {}
  ): void {
    this.track('experiment_participation', {
      experiment_name: experimentName,
      variant,
      ...properties,
    });
  }

  /**
   * Get feature flag value
   */
  getFeatureFlag(flagName: string): boolean | string | undefined {
    if (!this.isInitialized) return undefined;

    return posthog.getFeatureFlag(flagName);
  }

  /**
   * Check if analytics is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): AnalyticsConfig | null {
    return this.config;
  }

  /**
   * Start a new session
   */
  private startSession(): void {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();

    this.track(ANALYTICS_EVENTS.SESSION_STARTED, {
      session_id: this.sessionId,
    });
  }

  /**
   * End current session
   */
  private endSession(): void {
    if (this.sessionId && this.sessionStartTime) {
      this.track(ANALYTICS_EVENTS.SESSION_ENDED, {
        session_id: this.sessionId,
        session_duration: this.getSessionDuration(),
      });
    }

    this.sessionId = null;
    this.sessionStartTime = null;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get current session duration
   */
  private getSessionDuration(): number {
    if (!this.sessionStartTime) return 0;
    return Date.now() - this.sessionStartTime;
  }

  /**
   * Get device type information with enhanced detection
   */
  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const screenWidth = window.screen.width;

    // Enhanced mobile detection
    if (
      /mobile|android|ios|iphone/.test(userAgent) ||
      (hasTouch && screenWidth < 768)
    ) {
      return 'mobile';
    } else if (
      /tablet|ipad/.test(userAgent) ||
      (hasTouch && screenWidth >= 768 && screenWidth < 1024)
    ) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Get enhanced system properties for context
   */
  private getSystemProperties(): Record<string, unknown> {
    const connection = (navigator as any).connection;

    return {
      // Display info
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      pixel_ratio: window.devicePixelRatio || 1,

      // Locale info
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      languages: navigator.languages?.slice(0, 3), // First 3 languages

      // Browser info
      user_agent: navigator.userAgent,
      platform: navigator.platform,

      // Network info
      connection_type: connection?.effectiveType || 'unknown',
      connection_downlink: connection?.downlink,
      connection_rtt: connection?.rtt,
      connection_save_data: connection?.saveData,

      // Device capabilities
      touch_support: 'ontouchstart' in window,
      max_touch_points: navigator.maxTouchPoints || 0,
      hardware_concurrency: navigator.hardwareConcurrency || 1,
      device_memory: (navigator as any).deviceMemory || 'unknown',

      // App environment context
      app_environment: config.env,
      app_version: config.version,
      performance_monitoring: config.performance.enabled,
    };
  }

  /**
   * Get contextual properties for events with enhanced context
   */
  private getContextualProperties(): Record<string, unknown> {
    return {
      // URL context
      url: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer,

      // State context
      is_online: navigator.onLine,
      visibility_state: document.visibilityState,
      page_loaded: document.readyState === 'complete',

      // Performance context
      memory_used: (performance as any).memory?.usedJSHeapSize,
      connection_type: (navigator as any).connection?.effectiveType,

      // User context
      session_id: this.sessionId,
      session_duration: this.getSessionDuration(),

      // Environment context
      environment: config.env,
      version: config.version,

      // Feature flags
      features_enabled: Object.entries(config.features)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => feature),
    };
  }

  /**
   * Get analytics summary for dashboard display
   */
  getAnalyticsSummary(): any {
    return {
      sessionId: this.sessionId,
      sessionDuration: this.getSessionDuration(),
      isInitialized: this.isInitialized,
      eventsTracked: 0, // Would track this in real implementation
      userProperties: {},
      lastEventTime: new Date().toISOString(),
    };
  }

  /**
   * Export analytics data
   */
  exportData(): any {
    return {
      analytics: this.getAnalyticsSummary(),
      session: {
        id: this.sessionId,
        duration: this.getSessionDuration(),
        startTime: this.sessionStartTime
          ? new Date(this.sessionStartTime).toISOString()
          : undefined,
      },
      exportTime: new Date().toISOString(),
    };
  }

  /**
   * Clear analytics data
   */
  clearData(): void {
    if (this.isInitialized && typeof posthog !== 'undefined') {
      posthog.reset();
    }
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
  }

  /**
   * Capture exception for error handling (alias for trackError)
   */
  captureException(error: Error, context?: EventProperties): void {
    this.trackError(error, context);
  }

  /**
   * Track deployment events
   */
  trackDeployment(version: string, environment: string): void {
    this.track('deployment_completed', {
      version,
      environment,
      timestamp: new Date().toISOString(),
      previous_version: localStorage.getItem('app_version'),
      deployment_type: version.indexOf('hotfix') !== -1 ? 'hotfix' : 'release',
    });

    // Store current version for next deployment
    localStorage.setItem('app_version', version);
  }

  /**
   * Track performance budget metrics
   */
  trackPerformanceBudget(metric: string, value: number, budget: number): void {
    const exceededBudget = value > budget;
    const percentage = (value / budget) * 100;

    this.track('performance_budget_check', {
      metric,
      value,
      budget,
      exceeds_budget: exceededBudget,
      percentage,
      environment: config.env,
    });

    if (exceededBudget) {
      this.track('performance_budget_violation', {
        metric,
        value,
        budget,
        overage: value - budget,
        percentage,
      });
    }
  }

  /**
   * Track feature flag evaluations
   */
  trackFeatureFlag(flag: string, enabled: boolean, variant?: string): void {
    this.track('feature_flag_evaluation', {
      flag,
      enabled,
      variant,
      environment: config.env,
      user_segment: this.getUserSegment(),
    });
  }

  /**
   * Track business metrics
   */
  trackBusinessMetric(
    metric: string,
    value: number,
    metadata?: Record<string, any>
  ): void {
    this.track('business_metric', {
      metric,
      value,
      environment: config.env,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Track SLA violations
   */
  trackSLAViolation(
    service: string,
    metric: string,
    threshold: number,
    actual: number
  ): void {
    this.track('sla_violation', {
      service,
      metric,
      threshold,
      actual,
      violation_percentage: ((actual - threshold) / threshold) * 100,
      environment: config.env,
      severity: this.calculateSeverity(actual, threshold),
    });
  }

  /**
   * Get user segment for analytics
   */
  private getUserSegment(): string {
    // Implement user segmentation logic based on your needs
    return 'default';
  }

  /**
   * Calculate SLA violation severity
   */
  private calculateSeverity(
    actual: number,
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = actual / threshold;
    if (ratio < 1.2) return 'low';
    if (ratio < 1.5) return 'medium';
    if (ratio < 2.0) return 'high';
    return 'critical';
  }
}

// Environment-aware analytics initialization
export function initializeAnalytics(
  customConfig?: Partial<AnalyticsConfig>
): AnalyticsService {
  const analytics = AnalyticsService.getInstance();
  analytics.initialize(customConfig);
  return analytics;
}

// Default configuration factory for different environments
export function createAnalyticsConfig(environment?: string): AnalyticsConfig {
  const env = environment || config.env;

  return {
    apiKey: config.analytics.posthog.apiKey,
    host: config.analytics.posthog.host,
    environment: env as 'development' | 'staging' | 'production',
    debug: env === 'development',
    enableSessionRecording: env !== 'development',
    enableHeatmaps: true,
    disableInDevelopment: false,
  };
}

// Legacy support for default configs
export const defaultAnalyticsConfigs = {
  development: createAnalyticsConfig('development'),
  staging: createAnalyticsConfig('staging'),
  production: createAnalyticsConfig('production'),
};

export default AnalyticsService;
