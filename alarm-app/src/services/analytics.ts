// Analytics Service for Smart Alarm App
// Provides comprehensive user behavior tracking and analytics using PostHog

import posthog from 'posthog-js';

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
  id: string;
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
  REVENUE_EVENT: 'revenue_event'
} as const;

class AnalyticsService {
  private static instance: AnalyticsService;
  private isInitialized = false;
  private config: AnalyticsConfig | null = null;
  private sessionId: string | null = null;
  private sessionStartTime: number | null = null;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize PostHog analytics
   */
  initialize(config: AnalyticsConfig): void {
    if (this.isInitialized) {
      console.warn('Analytics is already initialized');
      return;
    }

    // Don't initialize in test environments
    if (process.env.NODE_ENV === 'test') {
      console.info('Analytics disabled in test environment');
      return;
    }

    // Don't initialize in development if disabled
    if (config.environment === 'development' && config.disableInDevelopment) {
      console.info('Analytics disabled in development environment');
      return;
    }

    this.config = config;

    try {
      posthog.init(config.apiKey, {
        api_host: config.host || 'https://app.posthog.com',
        
        // Environment-specific settings
        debug: config.debug || config.environment === 'development',
        
        // Privacy settings
        respect_dnt: true,
        disable_session_recording: !config.enableSessionRecording,
        disable_surveys: config.environment === 'development',
        
        // Performance settings
        capture_pageview: true,
        capture_pageleave: true,
        
        // Feature flags
        bootstrap: {
          distinctId: this.generateSessionId()
        },
        
        // Autocapture settings
        autocapture: config.environment !== 'production', // More selective in production
        
        // Session recording settings
        session_recording: {
          maskAllInputs: true,
          maskAllText: false,
          recordCrossOriginIframes: false
        },
        
        // Heatmaps
        enable_recording_console_log: config.debug || false,
        
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
          'credit_card'
        ]
      });

      // Start session tracking
      this.startSession();

      this.isInitialized = true;
      console.info('Analytics initialized successfully');

      // Track app launch
      this.track(ANALYTICS_EVENTS.APP_LAUNCHED, {
        environment: config.environment,
        version: process.env.REACT_APP_VERSION || 'unknown',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to initialize analytics:', error);
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
      ...this.getSystemProperties()
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
      console.log('Analytics not initialized, event:', eventName, properties);
      return;
    }

    const enhancedProperties = {
      ...properties,
      timestamp: properties.timestamp || new Date().toISOString(),
      session_id: this.sessionId,
      session_duration: this.getSessionDuration(),
      source: properties.source || 'web',
      ...this.getContextualProperties()
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
      ...this.getSystemProperties()
    });
  }

  /**
   * Increment a numeric property
   */
  incrementProperty(property: string, value: number = 1): void {
    if (!this.isInitialized) return;

    posthog.people.increment({
      [property]: value
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
      ...properties
    };

    this.track('$pageview', pageProperties);
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureName: string, action: string, properties: EventProperties = {}): void {
    this.track('feature_used', {
      feature_name: featureName,
      action,
      ...properties
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metricName: string, value: number, unit: string = 'ms', properties: EventProperties = {}): void {
    this.track(ANALYTICS_EVENTS.PAGE_LOAD_TIME, {
      metric_name: metricName,
      value,
      unit,
      ...properties
    });
  }

  /**
   * Track errors (to correlate with Sentry)
   */
  trackError(error: Error, context: EventProperties = {}): void {
    this.track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500), // Truncate for performance
      error_name: error.name,
      ...context
    });
  }

  /**
   * Track conversion events
   */
  trackConversion(conversionType: string, value?: number, properties: EventProperties = {}): void {
    this.track('conversion', {
      conversion_type: conversionType,
      value,
      ...properties
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
  captureFeedback(rating: number, comment: string, properties: EventProperties = {}): void {
    this.track('feedback_submitted', {
      rating,
      comment,
      ...properties
    });
  }

  /**
   * Track experiment participation
   */
  trackExperiment(experimentName: string, variant: string, properties: EventProperties = {}): void {
    this.track('experiment_participation', {
      experiment_name: experimentName,
      variant,
      ...properties
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
      session_id: this.sessionId
    });
  }

  /**
   * End current session
   */
  private endSession(): void {
    if (this.sessionId && this.sessionStartTime) {
      this.track(ANALYTICS_EVENTS.SESSION_ENDED, {
        session_id: this.sessionId,
        session_duration: this.getSessionDuration()
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
   * Get device type information
   */
  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|ios|iphone|ipad/.test(userAgent)) {
      return 'mobile';
    } else if (/tablet/.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Get system properties for context
   */
  private getSystemProperties(): Record<string, unknown> {
    return {
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      user_agent: navigator.userAgent,
      connection_type: (navigator as any).connection?.effectiveType || 'unknown'
    };
  }

  /**
   * Get contextual properties for events
   */
  private getContextualProperties(): Record<string, unknown> {
    return {
      url: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer,
      is_online: navigator.onLine,
      battery_level: (navigator as any).getBattery ? 'available' : 'unavailable'
    };
  }
}

// Default configuration for different environments
export const defaultAnalyticsConfigs = {
  development: {
    apiKey: process.env.REACT_APP_POSTHOG_KEY || '',
    environment: 'development' as const,
    debug: true,
    enableSessionRecording: false,
    enableHeatmaps: true,
    disableInDevelopment: false
  },
  staging: {
    apiKey: process.env.REACT_APP_POSTHOG_KEY || '',
    environment: 'staging' as const,
    debug: false,
    enableSessionRecording: true,
    enableHeatmaps: true,
    disableInDevelopment: false
  },
  production: {
    apiKey: process.env.REACT_APP_POSTHOG_KEY || '',
    environment: 'production' as const,
    debug: false,
    enableSessionRecording: true,
    enableHeatmaps: true,
    disableInDevelopment: false
  }
};

export default AnalyticsService;