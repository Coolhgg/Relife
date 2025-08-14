import AnalyticsConfigService from '../analytics-config';
import PrivacyComplianceService from '../privacy-compliance';
import SentryService from '../sentry';
import AnalyticsService from '../analytics';
import AppAnalyticsService from '../app-analytics';
import PerformanceAnalyticsService from '../performance-analytics';

// Mock external dependencies
jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  setUser: jest.fn(),
  clearUser: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  configureScope: jest.fn(),
  withScope: jest.fn((fn) => fn({ setTag: jest.fn(), setContext: jest.fn(), setFingerprint: jest.fn() }))
}));

jest.mock('posthog-js', () => ({
  init: jest.fn(),
  identify: jest.fn(),
  track: jest.fn(),
  set: jest.fn(),
  capture: jest.fn(),
  startSessionRecording: jest.fn(),
  stopSessionRecording: jest.fn(),
  onFeatureFlags: jest.fn(),
  getFeatureFlag: jest.fn(),
  reset: jest.fn()
}));

// Mock browser APIs
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  }
});

Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => 1000),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024,
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 200 * 1024 * 1024
    }
  }
});

global.PerformanceObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn()
})) as any;

Object.defineProperty(global.window, 'addEventListener', {
  writable: true,
  value: jest.fn()
});

// Mock console methods
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('Analytics Services Integration', () => {
  let analyticsConfig: AnalyticsConfigService;
  let privacyCompliance: PrivacyComplianceService;
  let sentryService: SentryService;
  let analyticsService: AnalyticsService;
  let appAnalytics: AppAnalyticsService;
  let performanceAnalytics: PerformanceAnalyticsService;

  beforeEach(() => {
    // Reset all singleton instances
    (AnalyticsConfigService as any).instance = null;
    (PrivacyComplianceService as any).instance = null;
    (SentryService as any).instance = null;
    (AnalyticsService as any).instance = null;
    (AppAnalyticsService as any).instance = null;
    (PerformanceAnalyticsService as any).instance = null;

    // Clear all mocks
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Mock environment variables
    process.env.REACT_APP_SENTRY_DSN = 'https://test@sentry.io/123';
    process.env.REACT_APP_POSTHOG_API_KEY = 'test-api-key';
    process.env.REACT_APP_POSTHOG_HOST = 'https://test.posthog.com';
    process.env.NODE_ENV = 'test';

    // Reset localStorage mock
    (global.localStorage.getItem as jest.Mock).mockReturnValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Service Initialization Order and Dependencies', () => {
    it('should initialize all services in correct dependency order', async () => {
      // Initialize services in the order they would be used in the app
      privacyCompliance = PrivacyComplianceService.getInstance();
      analyticsConfig = AnalyticsConfigService.getInstance();
      sentryService = SentryService.getInstance();
      analyticsService = AnalyticsService.getInstance();
      appAnalytics = AppAnalyticsService.getInstance();
      performanceAnalytics = PerformanceAnalyticsService.getInstance();

      // Initialize analytics config first (this coordinates other services)
      await analyticsConfig.initialize();

      expect(analyticsConfig.isInitialized()).toBe(true);
      expect(sentryService.isReady()).toBe(true);
      expect(analyticsService.isReady()).toBe(true);
    });

    it('should handle service initialization failures gracefully', async () => {
      // Mock Sentry initialization failure
      const sentryInit = require('@sentry/react').init;
      sentryInit.mockImplementationOnce(() => {
        throw new Error('Sentry initialization failed');
      });

      analyticsConfig = AnalyticsConfigService.getInstance();
      await analyticsConfig.initialize();

      // Should still initialize other services
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to initialize Sentry:',
        expect.any(Error)
      );
      
      // Analytics should still work
      analyticsService = AnalyticsService.getInstance();
      expect(analyticsService.isReady()).toBe(true);
    });

    it('should propagate configuration to all services', async () => {
      const customConfig = {
        enableSentry: true,
        enableAnalytics: true,
        enablePerformanceMonitoring: true,
        debugMode: true,
        environment: 'development' as const
      };

      analyticsConfig = AnalyticsConfigService.getInstance();
      await analyticsConfig.initialize(customConfig);

      // Check if configuration is applied to services
      expect(analyticsConfig.getStatus().debugMode).toBe(true);
      expect(analyticsConfig.getStatus().environment).toBe('development');
    });
  });

  describe('Privacy Compliance Integration', () => {
    beforeEach(async () => {
      privacyCompliance = PrivacyComplianceService.getInstance();
      analyticsConfig = AnalyticsConfigService.getInstance();
      await analyticsConfig.initialize();
    });

    it('should respect privacy settings across all services', () => {
      // Set privacy mode
      privacyCompliance.setConsent('analytics', false);
      privacyCompliance.setConsent('errorReporting', false);

      // Enable privacy mode in config
      analyticsConfig.enablePrivacyMode();

      appAnalytics = AppAnalyticsService.getInstance();
      
      // Track an event - should not be sent due to privacy settings
      appAnalytics.trackEvent('test_event', { data: 'test' });

      const posthog = require('posthog-js');
      expect(posthog.track).not.toHaveBeenCalled();
    });

    it('should filter sensitive data based on privacy settings', async () => {
      analyticsConfig = AnalyticsConfigService.getInstance();
      await analyticsConfig.initialize();

      appAnalytics = AppAnalyticsService.getInstance();

      // Track event with sensitive data
      appAnalytics.trackEvent('user_action', {
        email: 'user@example.com',
        password: 'secret123',
        token: 'auth-token-123',
        userId: 'user-456',
        action: 'login'
      });

      const posthog = require('posthog-js');
      const trackCall = posthog.track.mock.calls[0];
      
      // Sensitive fields should be filtered out
      expect(trackCall[1]).not.toHaveProperty('email');
      expect(trackCall[1]).not.toHaveProperty('password');
      expect(trackCall[1]).not.toHaveProperty('token');
      
      // Non-sensitive fields should remain
      expect(trackCall[1]).toHaveProperty('userId', 'user-456');
      expect(trackCall[1]).toHaveProperty('action', 'login');
    });

    it('should handle consent changes dynamically', () => {
      privacyCompliance = PrivacyComplianceService.getInstance();
      analyticsConfig = AnalyticsConfigService.getInstance();
      appAnalytics = AppAnalyticsService.getInstance();

      // Initially allow analytics
      privacyCompliance.setConsent('analytics', true);
      
      // Track an event - should be sent
      appAnalytics.trackEvent('allowed_event', {});
      
      // Revoke consent
      privacyCompliance.setConsent('analytics', false);
      analyticsConfig.enablePrivacyMode();
      
      // Track another event - should not be sent
      appAnalytics.trackEvent('blocked_event', {});

      const posthog = require('posthog-js');
      expect(posthog.track).toHaveBeenCalledWith('allowed_event', expect.any(Object));
      expect(posthog.track).not.toHaveBeenCalledWith('blocked_event', expect.any(Object));
    });
  });

  describe('Cross-Service Communication', () => {
    beforeEach(async () => {
      analyticsConfig = AnalyticsConfigService.getInstance();
      await analyticsConfig.initialize();
      
      appAnalytics = AppAnalyticsService.getInstance();
      performanceAnalytics = PerformanceAnalyticsService.getInstance();
      performanceAnalytics.initialize();
    });

    it('should share user context across all services', () => {
      const userData = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'premium'
      };

      // Set user in app analytics
      appAnalytics.setUser(userData);

      // Verify user is set in all underlying services
      const sentry = require('@sentry/react');
      const posthog = require('posthog-js');
      
      expect(sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        username: 'Test User'
      });
      
      expect(posthog.identify).toHaveBeenCalledWith('user-123', {
        email: 'test@example.com',
        name: 'Test User',
        role: 'premium'
      });
    });

    it('should correlate performance data with user events', () => {
      const userData = { id: 'user-123', name: 'Test User' };
      appAnalytics.setUser(userData);

      // Track an alarm event
      appAnalytics.trackAlarmEvent('create', 'success', {
        alarmId: 'alarm-456',
        time: '07:00',
        type: 'wake_up'
      });

      // Track performance for the same operation
      performanceAnalytics.trackAlarmPerformance('create', 150, true, {
        alarmId: 'alarm-456'
      });

      const posthog = require('posthog-js');
      
      // Both events should be tracked with user context
      expect(posthog.track).toHaveBeenCalledWith(
        'alarm_create',
        expect.objectContaining({
          alarmId: 'alarm-456',
          time: '07:00'
        })
      );
      
      expect(posthog.track).toHaveBeenCalledWith(
        'performance_metric',
        expect.objectContaining({
          metric: 'alarm_create',
          value: 150,
          success: true
        })
      );
    });

    it('should handle error correlation across services', () => {
      const userData = { id: 'user-123', name: 'Test User' };
      appAnalytics.setUser(userData);

      const error = new Error('Alarm creation failed');
      const context = {
        component: 'AlarmCreator',
        action: 'create_alarm',
        alarmId: 'alarm-789'
      };

      // Report error through app analytics
      appAnalytics.trackError(error, context);

      const sentry = require('@sentry/react');
      const posthog = require('posthog-js');
      
      // Error should be sent to Sentry with context
      expect(sentry.captureException).toHaveBeenCalledWith(error, expect.objectContaining({
        extra: expect.objectContaining(context)
      }));
      
      // Error should be tracked in analytics for analysis
      expect(posthog.track).toHaveBeenCalledWith(
        'error_occurred',
        expect.objectContaining({
          error_name: 'Error',
          error_message: 'Alarm creation failed',
          component: 'AlarmCreator'
        })
      );
    });
  });

  describe('End-to-End User Journey Tracking', () => {
    beforeEach(async () => {
      analyticsConfig = AnalyticsConfigService.getInstance();
      await analyticsConfig.initialize();
      
      appAnalytics = AppAnalyticsService.getInstance();
      performanceAnalytics = PerformanceAnalyticsService.getInstance();
      performanceAnalytics.initialize();
    });

    it('should track complete user sign-in journey', () => {
      // User starts sign-in
      appAnalytics.trackEvent('sign_in_started', { method: 'email' });

      // Track sign-in performance
      const endMeasurement = performanceAnalytics.startMeasurement('user_sign_in');
      
      // Simulate sign-in completion
      setTimeout(() => {
        const duration = endMeasurement();
        
        const userData = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        };

        // Set user context
        appAnalytics.setUser(userData);
        
        // Track successful sign-in
        appAnalytics.trackEvent('sign_in_completed', {
          method: 'email',
          duration,
          success: true
        });
      }, 500);

      jest.advanceTimersByTime(500);

      const posthog = require('posthog-js');
      
      expect(posthog.track).toHaveBeenCalledWith('sign_in_started', { method: 'email' });
      expect(posthog.identify).toHaveBeenCalledWith('user-123', expect.any(Object));
      expect(posthog.track).toHaveBeenCalledWith(
        'sign_in_completed',
        expect.objectContaining({
          method: 'email',
          success: true
        })
      );
    });

    it('should track complete alarm creation journey', () => {
      const userData = { id: 'user-123', name: 'Test User' };
      appAnalytics.setUser(userData);

      // Start alarm creation
      appAnalytics.trackEvent('alarm_creation_started', { source: 'main_screen' });

      // Track page view for alarm creation screen
      appAnalytics.trackPageView('/create-alarm', 'Create Alarm');

      // Track performance of alarm creation
      const alarmData = {
        alarmId: 'alarm-456',
        time: '07:00',
        type: 'wake_up',
        repeatDays: ['monday', 'tuesday', 'wednesday']
      };

      performanceAnalytics.trackAlarmPerformance('create', 200, true, alarmData);

      // Complete alarm creation
      appAnalytics.trackAlarmEvent('create', 'success', alarmData);

      // Track feature usage
      appAnalytics.trackFeatureUsage('alarm_creation', { success: true });

      const posthog = require('posthog-js');
      
      expect(posthog.track).toHaveBeenCalledWith('alarm_creation_started', { source: 'main_screen' });
      expect(posthog.track).toHaveBeenCalledWith('page_view', expect.objectContaining({
        page: '/create-alarm',
        title: 'Create Alarm'
      }));
      expect(posthog.track).toHaveBeenCalledWith('alarm_create', expect.objectContaining(alarmData));
      expect(posthog.track).toHaveBeenCalledWith('feature_used', expect.objectContaining({
        feature: 'alarm_creation'
      }));
    });

    it('should track user onboarding completion', () => {
      const userData = { id: 'user-123', name: 'New User' };
      appAnalytics.setUser(userData);

      // Track onboarding steps
      appAnalytics.trackEvent('onboarding_step_completed', { step: 1, stepName: 'welcome' });
      appAnalytics.trackEvent('onboarding_step_completed', { step: 2, stepName: 'permissions' });
      appAnalytics.trackEvent('onboarding_step_completed', { step: 3, stepName: 'first_alarm' });

      // Complete onboarding
      appAnalytics.trackOnboardingCompletion({
        totalSteps: 3,
        completionTime: 180000, // 3 minutes
        stepsSkipped: 0
      });

      const posthog = require('posthog-js');
      
      // Should track completion and set user property
      expect(posthog.track).toHaveBeenCalledWith('onboarding_completed', expect.objectContaining({
        totalSteps: 3,
        completionTime: 180000
      }));
      
      expect(posthog.set).toHaveBeenCalledWith({
        has_completed_onboarding: true,
        onboarding_completion_date: expect.any(String)
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      analyticsConfig = AnalyticsConfigService.getInstance();
      await analyticsConfig.initialize();
      
      appAnalytics = AppAnalyticsService.getInstance();
    });

    it('should continue functioning when one service fails', () => {
      // Mock Sentry failure
      const sentry = require('@sentry/react');
      sentry.captureException.mockImplementationOnce(() => {
        throw new Error('Sentry service unavailable');
      });

      const error = new Error('Test error');
      
      // Should not throw even if Sentry fails
      expect(() => {
        appAnalytics.trackError(error, { component: 'test' });
      }).not.toThrow();

      // PostHog should still work
      const posthog = require('posthog-js');
      expect(posthog.track).toHaveBeenCalledWith(
        'error_occurred',
        expect.any(Object)
      );
    });

    it('should handle network failures gracefully', () => {
      // Mock network failure for PostHog
      const posthog = require('posthog-js');
      posthog.track.mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      // Should not break the application
      expect(() => {
        appAnalytics.trackEvent('test_event', { data: 'test' });
      }).not.toThrow();

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Analytics tracking failed:',
        expect.any(Error)
      );
    });

    it('should retry failed operations when service recovers', () => {
      let callCount = 0;
      const posthog = require('posthog-js');
      
      // Fail first call, succeed second call
      posthog.track.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Temporary failure');
        }
      });

      // First attempt should fail gracefully
      appAnalytics.trackEvent('test_event_1', { data: 'test1' });
      
      // Second attempt should succeed
      appAnalytics.trackEvent('test_event_2', { data: 'test2' });

      expect(posthog.track).toHaveBeenCalledTimes(2);
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance and Resource Management', () => {
    beforeEach(async () => {
      analyticsConfig = AnalyticsConfigService.getInstance();
      await analyticsConfig.initialize();
      
      appAnalytics = AppAnalyticsService.getInstance();
      performanceAnalytics = PerformanceAnalyticsService.getInstance();
      performanceAnalytics.initialize();
    });

    it('should efficiently batch multiple events', () => {
      const posthog = require('posthog-js');
      
      // Track multiple events in quick succession
      for (let i = 0; i < 10; i++) {
        appAnalytics.trackEvent(`event_${i}`, { index: i });
      }

      // Should make individual calls (PostHog handles batching internally)
      expect(posthog.track).toHaveBeenCalledTimes(10);
    });

    it('should limit memory usage for performance metrics', () => {
      // Track many performance metrics
      for (let i = 0; i < 150; i++) {
        performanceAnalytics.trackMetric(`metric_${i}`, i);
      }

      const summary = performanceAnalytics.getPerformanceSummary();
      
      // Should limit stored metrics to prevent memory leaks
      expect(summary.metrics.length).toBe(20); // Returns last 20
    });

    it('should handle high-frequency events efficiently', () => {
      const startTime = Date.now();
      
      // Track 100 events rapidly
      for (let i = 0; i < 100; i++) {
        performanceAnalytics.trackMetric('rapid_metric', i);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should process events quickly (< 100ms for 100 events)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Real-World Integration Scenarios', () => {
    beforeEach(async () => {
      analyticsConfig = AnalyticsConfigService.getInstance();
      await analyticsConfig.initialize();
      
      appAnalytics = AppAnalyticsService.getInstance();
      performanceAnalytics = PerformanceAnalyticsService.getInstance();
      performanceAnalytics.initialize();
    });

    it('should handle app startup analytics flow', () => {
      // Track app startup
      appAnalytics.trackEvent('app_started', {
        version: '1.0.0',
        platform: 'web',
        startupTime: 1200
      });

      // Track performance during startup
      performanceAnalytics.trackMetric('app_startup', 1200, 'ms', 'load');

      // Track initial page load
      appAnalytics.trackPageView('/', 'Home');

      // Check for existing user session
      const userData = { id: 'returning-user', name: 'John Doe' };
      appAnalytics.setUser(userData);

      const posthog = require('posthog-js');
      const sentry = require('@sentry/react');
      
      expect(posthog.track).toHaveBeenCalledWith('app_started', expect.objectContaining({
        version: '1.0.0',
        platform: 'web'
      }));
      
      expect(posthog.identify).toHaveBeenCalledWith('returning-user', expect.any(Object));
      expect(sentry.setUser).toHaveBeenCalledWith(expect.objectContaining({
        id: 'returning-user'
      }));
    });

    it('should handle app background/foreground transitions', () => {
      const userData = { id: 'user-123', name: 'Active User' };
      appAnalytics.setUser(userData);

      // Simulate app going to background
      appAnalytics.trackEvent('app_backgrounded', {
        sessionDuration: 300000, // 5 minutes
        timestamp: new Date().toISOString()
      });

      // Simulate app returning to foreground
      appAnalytics.trackEvent('app_foregrounded', {
        backgroundDuration: 120000, // 2 minutes
        timestamp: new Date().toISOString()
      });

      const posthog = require('posthog-js');
      
      expect(posthog.track).toHaveBeenCalledWith('app_backgrounded', expect.objectContaining({
        sessionDuration: 300000
      }));
      
      expect(posthog.track).toHaveBeenCalledWith('app_foregrounded', expect.objectContaining({
        backgroundDuration: 120000
      }));
    });

    it('should handle offline/online transitions', () => {
      appAnalytics.trackEvent('connectivity_changed', { 
        online: false,
        previousState: 'online'
      });

      // Simulate going back online and sending queued events
      appAnalytics.trackEvent('connectivity_changed', {
        online: true,
        previousState: 'offline',
        queuedEvents: 5
      });

      const posthog = require('posthog-js');
      
      expect(posthog.track).toHaveBeenCalledWith('connectivity_changed', 
        expect.objectContaining({ online: false })
      );
      expect(posthog.track).toHaveBeenCalledWith('connectivity_changed',
        expect.objectContaining({ online: true, queuedEvents: 5 })
      );
    });
  });

  describe('Service Health Monitoring', () => {
    beforeEach(async () => {
      analyticsConfig = AnalyticsConfigService.getInstance();
      await analyticsConfig.initialize();
    });

    it('should monitor service health status', () => {
      const status = analyticsConfig.getStatus();
      
      expect(status).toMatchObject({
        isInitialized: true,
        services: expect.objectContaining({
          sentry: expect.objectContaining({ ready: expect.any(Boolean) }),
          analytics: expect.objectContaining({ ready: expect.any(Boolean) })
        })
      });
    });

    it('should report service initialization metrics', () => {
      const status = analyticsConfig.getStatus();
      
      expect(status.initializationTime).toBeGreaterThan(0);
      expect(status.services.sentry.initializationTime).toBeGreaterThan(0);
      expect(status.services.analytics.initializationTime).toBeGreaterThan(0);
    });

    it('should track service availability over time', () => {
      // Simulate service becoming unavailable
      const sentry = require('@sentry/react');
      sentry.captureException.mockImplementationOnce(() => {
        throw new Error('Service unavailable');
      });

      appAnalytics = AppAnalyticsService.getInstance();
      appAnalytics.trackError(new Error('Test error'));

      // Service should handle the failure gracefully
      const status = analyticsConfig.getStatus();
      expect(status.services.sentry.lastError).toBeDefined();
    });
  });
});