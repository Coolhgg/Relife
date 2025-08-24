/// <reference lib="dom" />
// App Analytics Integration Service
// Provides centralized analytics tracking for the Smart Alarm App

import AnalyticsConfigService from './analytics-config';
import AnalyticsService, { ANALYTICS_EVENTS } from './analytics';
import SentryService from './sentry';
import { ErrorHandler } from './error-handler';
import type { Alarm, VoiceMood } from '../types';
import { TimeoutHandle } from '../types/timers';

export interface AppAnalyticsEvents {
  // Alarm Management
  alarmCreated: {
    alarmId: string;
    time: string;
    days: number[];
    label: string;
    voiceMood?: VoiceMood;
    isQuickSetup?: boolean;
    presetType?: 'morning' | 'work' | 'custom';
  };

  alarmEdited: {
    alarmId: string;
    changes: string[];
    previousTime?: string;
    newTime?: string;
  };

  alarmDeleted: {
    alarmId: string;
    hadBeenUsed: boolean;
    totalAlarms: number;
  };

  alarmTriggered: {
    alarmId: string;
    label: string;
    time: string;
    onTime: boolean;
    delayMinutes?: number;
  };

  alarmDismissed: {
    alarmId: string;
    method: 'voice' | 'button' | 'swipe';
    timeToRespond: number;
    snoozeCount?: number;
  };

  alarmSnoozed: {
    alarmId: string;
    snoozeCount: number;
    snoozeMinutes: number;
  };

  // Voice Recognition
  voiceCommandUsed: {
    command: string;
    success: boolean;
    confidence?: number;
    language?: string;
  };

  voiceRecognitionToggled: {
    enabled: boolean;
    alarmId?: string;
  };

  // User Experience
  onboardingCompleted: {
    steps: number;
    timeSpent: number;
    skipped: boolean;
  };

  featureDiscovered: {
    feature: string;
    method: 'exploration' | 'onboarding' | 'help';
  };

  // Performance
  appPerformance: {
    loadTime: number;
    componentRenderTime?: number;
    memoryUsage?: number;
  };
}

class AppAnalyticsService {
  private static instance: AppAnalyticsService;
  private analyticsConfig: AnalyticsConfigService;
  private analytics: AnalyticsService;
  private sentry: SentryService;
  private sessionStartTime: number;
  private performanceMarkers: Map<string, TimeoutHandle> = new Map();

  private constructor() {
    this.analyticsConfig = AnalyticsConfigService.getInstance();
    this.analytics = AnalyticsService.getInstance();
    this.sentry = SentryService.getInstance();
    this.sessionStartTime = Date.now();
  }

  static getInstance(): AppAnalyticsService {
    if (!AppAnalyticsService.instance) {
      AppAnalyticsService.instance = new AppAnalyticsService();
    }
    return AppAnalyticsService.instance;
  }

  /**
   * Initialize analytics services for the app
   */
  async initializeAnalytics(): Promise<void> {
    try {
      const status = await this.analyticsConfig.initialize();

      // Track initialization success/failure
      if (status.analytics.initialized || status.sentry.initialized) {
        this.trackAppEvent('analyticsInitialized', {
          sentryInitialized: status.sentry.initialized,
          analyticsInitialized: status.analytics.initialized,
          environment: this.analyticsConfig.getConfig()?.environment || 'unknown',
        });
      }

      // Start performance tracking
      this.startPerformanceMonitoring();

      console.info('App analytics services initialized successfully');
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        {
          context: 'analytics_initialization',
          component: 'AppAnalyticsService',
          action: 'initialize',
        }
      );
    }
  }

  /**
   * Set user context when user logs in
   */
  setUserContext(userId: string, userProperties: Record<string, unknown> = {}): void {
    try {
      // Enhanced user properties for analytics
      const enhancedProperties = {
        ...userProperties,
        sessionId: this.generateSessionId(),
        firstSeen: new Date().toISOString(),
        platform: 'web',
        appVersion: process.env.REACT_APP_VERSION || 'unknown',
      };

      this.analyticsConfig.setUserContext(userId, enhancedProperties);

      // Track user sign in
      this.trackAppEvent('userSignedIn', {
        userId,
        method: (userProperties.signInMethod as string) || 'unknown',
      });
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        {
          context: 'user_context_setup',
          component: 'AppAnalyticsService',
          metadata: { userId },
        }
      );
    }
  }

  /**
   * Clear user context when user logs out
   */
  clearUserContext(): void {
    try {
      this.analyticsConfig.clearUserContext();
      this.trackAppEvent('userSignedOut', {
        sessionDuration: Date.now() - this.sessionStartTime,
      });
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        {
          context: 'user_context_clear',
          component: 'AppAnalyticsService',
        }
      );
    }
  }

  /**
   * Track alarm-related events
   */
  trackAlarmEvent(eventType: keyof AppAnalyticsEvents, eventData: any): void {
    const eventName = this.getAlarmEventName(eventType);
    this.trackAppEvent(eventName, eventData);
  }

  /**
   * Track alarm creation with comprehensive data
   */
  trackAlarmCreated(
    alarm: Partial<Alarm>,
    context: { isQuickSetup?: boolean; presetType?: string } = {}
  ): void {
    this.trackAlarmEvent('alarmCreated', {
      alarmId: alarm.id || 'unknown',
      time: alarm.time || 'unknown',
      days: alarm.days || [],
      label: alarm.label || 'Unnamed',
      voiceMood: alarm.voiceMood,
      isQuickSetup: context.isQuickSetup || false,
      presetType: context.presetType,
    });

    // Add breadcrumb for debugging
    this.sentry.addBreadcrumb(
      `Alarm created: ${alarm.label} at ${alarm.time}`,
      'user',
      { alarmId: alarm.id, isQuickSetup: context.isQuickSetup }
    );
  }

  /**
   * Track alarm interactions with detailed context
   */
  trackAlarmDismissed(
    alarmId: string,
    method: 'voice' | 'button' | 'swipe',
    responseTime: number,
    snoozeCount = 0
  ): void {
    this.trackAlarmEvent('alarmDismissed', {
      alarmId,
      method,
      timeToRespond: responseTime,
      snoozeCount: snoozeCount > 0 ? snoozeCount : undefined,
    });

    // Performance tracking
    this.analytics.trackPerformance('alarm_response_time', responseTime, 'ms', {
      method,
      snoozeCount,
    });
  }

  /**
   * Track general alarm actions
   */
  trackAlarmAction(
    action: string,
    alarmId: string,
    metadata?: Record<string, unknown>
  ): void {
    this.trackAppEvent(`alarm_${action}`, {
      alarmId,
      action,
      timestamp: new Date().toISOString(),
      ...metadata,
    });

    // Add breadcrumb for debugging
    this.sentry.addBreadcrumb(`Alarm action: ${action} on ${alarmId}`, 'user', {
      alarmId,
      action,
      ...metadata,
    });
  }

  /**
   * Track voice command usage
   */
  trackVoiceCommand(command: string, success: boolean, confidence?: number): void {
    this.trackAppEvent(ANALYTICS_EVENTS.VOICE_COMMAND_USED, {
      command,
      success,
      confidence,
      language: navigator.language,
    });

    // Add context for error debugging if failed
    if (!success) {
      this.sentry.addBreadcrumb(`Voice command failed: ${command}`, 'user', {
        confidence,
        language: navigator.language,
      });
    }
  }

  /**
   * Track app performance metrics
   */
  trackPerformance(
    metricName: string,
    value: number,
    metadata?: Record<string, unknown>
  ): void {
    this.analytics.trackPerformance(metricName, value, 'ms', {
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Track feature usage with context
   */
  trackFeatureUsage(
    feature: string,
    action?: string,
    context?: Record<string, unknown>
  ): void {
    this.analytics.trackFeatureUsage(feature, action || 'used', {
      source: 'app',
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Track page/view changes
   */
  trackPageView(viewName: string, metadata?: Record<string, unknown>): void {
    this.analytics.trackPageView(viewName, {
      source: 'navigation',
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Start performance marker
   */
  startPerformanceMarker(name: string): void {
    this.performanceMarkers.set(name, performance.now());
  }

  /**
   * End performance marker and track
   */
  endPerformanceMarker(name: string, metadata?: Record<string, unknown>): number {
    const startTime = this.performanceMarkers.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.trackPerformance(name, duration, metadata);
      this.performanceMarkers.delete(name);
      return duration;
    }
    return 0;
  }

  /**
   * Track user onboarding completion
   */
  trackOnboardingCompleted(steps: number, timeSpent: number, skipped: boolean): void {
    this.trackAppEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
      steps,
      timeSpent,
      skipped,
    });

    // Update user properties
    this.analytics.setUserProperties({
      onboardingCompleted: true,
      onboardingSteps: steps,
      onboardingDuration: timeSpent,
    });
  }

  /**
   * Track errors with enhanced context
   */
  trackError(error: Error, context: Record<string, unknown> = {}): void {
    this.analytics.trackError(error, {
      source: 'app-analytics-service',
      timestamp: new Date().toISOString(),
      sessionDuration: Date.now() - this.sessionStartTime,
      ...context,
    });
  }

  /**
   * Get analytics readiness status
   */
  isReady(): boolean {
    return this.analyticsConfig.isReady();
  }

  /**
   * Enable/disable privacy mode
   */
  setPrivacyMode(enabled: boolean): void {
    this.analyticsConfig.setPrivacyMode(enabled);

    this.trackAppEvent('privacyModeToggled', {
      enabled,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track generic app event
   */
  private trackAppEvent(eventName: string, data: Record<string, unknown>): void {
    if (this.analytics.isReady()) {
      this.analytics.track(eventName, {
        source: 'smart-alarm-app',
        sessionDuration: Date.now() - this.sessionStartTime,
        ...data,
      });
    }
  }

  /**
   * Map alarm event types to analytics event names
   */
  private getAlarmEventName(eventType: keyof AppAnalyticsEvents): string {
    const eventMap = {
      alarmCreated: ANALYTICS_EVENTS.ALARM_CREATED,
      alarmEdited: ANALYTICS_EVENTS.ALARM_EDITED,
      alarmDeleted: ANALYTICS_EVENTS.ALARM_DELETED,
      alarmTriggered: ANALYTICS_EVENTS.ALARM_TRIGGERED,
      alarmDismissed: ANALYTICS_EVENTS.ALARM_DISMISSED,
      alarmSnoozed: ANALYTICS_EVENTS.ALARM_SNOOZED,
      voiceCommandUsed: ANALYTICS_EVENTS.VOICE_COMMAND_USED,
      voiceRecognitionToggled: ANALYTICS_EVENTS.VOICE_RECOGNITION_ENABLED,
      onboardingCompleted: ANALYTICS_EVENTS.ONBOARDING_COMPLETED,
      featureDiscovered: ANALYTICS_EVENTS.FEATURE_DISCOVERY,
      appPerformance: ANALYTICS_EVENTS.PAGE_LOAD_TIME,
    };

    return eventMap[eventType] || eventType;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Monitor page load performance
    window.addEventListener('load', (
) => {
      const loadTime = performance.now();
      this.trackPerformance('page_load_time', loadTime, {
        type: 'initial_load',
      });
    });

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      setInterval((
) => {
        const memory = (performance as any).memory;
        if (memory) {
          this.trackPerformance('memory_usage', memory.usedJSHeapSize / 1024 / 1024, {
            type: 'memory_mb',
            total: memory.totalJSHeapSize / 1024 / 1024,
            limit: memory.jsHeapSizeLimit / 1024 / 1024,
          });
        }
      }, 60000); // Every minute
    }

    // Monitor connectivity changes
    window.addEventListener('online', (
) => {
      this.trackAppEvent('connectivity_changed', { status: 'online' });
    });

    window.addEventListener('offline', (
) => {
      this.trackAppEvent('connectivity_changed', { status: 'offline' });
    });
  }
}

export default AppAnalyticsService;
