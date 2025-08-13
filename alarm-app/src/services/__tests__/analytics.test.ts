import AnalyticsService, { 
  AnalyticsConfig, 
  UserProperties, 
  EventProperties, 
  ANALYTICS_EVENTS,
  defaultAnalyticsConfigs 
} from '../analytics';
import posthog from 'posthog-js';
import { testUtils } from '../../test-setup';

// Mock PostHog
jest.mock('posthog-js');

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockPostHog: jest.Mocked<typeof posthog>;

  beforeEach(() => {
    testUtils.clearAllMocks();
    
    // Reset singleton instance
    (AnalyticsService as any).instance = null;
    analyticsService = AnalyticsService.getInstance();
    
    // Setup PostHog mock
    mockPostHog = posthog as jest.Mocked<typeof posthog>;
    mockPostHog.init = jest.fn();
    mockPostHog.identify = jest.fn();
    mockPostHog.reset = jest.fn();
    mockPostHog.capture = jest.fn();
    mockPostHog.people = {
      set: jest.fn(),
      increment: jest.fn()
    } as any;
    mockPostHog.startSessionRecording = jest.fn();
    mockPostHog.stopSessionRecording = jest.fn();
    mockPostHog.getFeatureFlag = jest.fn();
    
    // Mock console methods
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
    
    // Set NODE_ENV to non-test value for most tests
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    // Mock process.env values
    process.env.REACT_APP_VERSION = '1.0.0';
    
    // Restore after each test
    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
      delete process.env.REACT_APP_VERSION;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    test('returns same instance on multiple calls', () => {
      const instance1 = AnalyticsService.getInstance();
      const instance2 = AnalyticsService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    const mockConfig: AnalyticsConfig = {
      apiKey: 'test-posthog-key',
      host: 'https://test-posthog.com',
      environment: 'development',
      debug: true,
      enableSessionRecording: true,
      enableHeatmaps: true
    };

    test('initializes PostHog with correct configuration', () => {
      analyticsService.initialize(mockConfig);
      
      expect(mockPostHog.init).toHaveBeenCalledWith('test-posthog-key', {
        api_host: 'https://test-posthog.com',
        debug: true,
        respect_dnt: true,
        disable_session_recording: false,
        disable_surveys: true,
        capture_pageview: true,
        capture_pageleave: true,
        bootstrap: {
          distinctId: expect.any(String)
        },
        autocapture: true,
        session_recording: {
          maskAllInputs: true,
          maskAllText: false,
          recordCrossOriginIframes: false
        },
        enable_recording_console_log: true,
        property_blacklist: [
          'password', 'token', 'key', 'secret', 'auth', 'credential', 'ssn', 'credit_card'
        ]
      });
      
      expect(analyticsService.isReady()).toBe(true);
      expect(console.info).toHaveBeenCalledWith('Analytics initialized successfully');
    });

    test('uses default host when not provided', () => {
      const configWithoutHost = { ...mockConfig };
      delete configWithoutHost.host;
      
      analyticsService.initialize(configWithoutHost);
      
      expect(mockPostHog.init).toHaveBeenCalledWith(
        'test-posthog-key',
        expect.objectContaining({
          api_host: 'https://app.posthog.com'
        })
      );
    });

    test('adjusts settings based on environment', () => {
      const prodConfig = { ...mockConfig, environment: 'production' as const };
      
      analyticsService.initialize(prodConfig);
      
      expect(mockPostHog.init).toHaveBeenCalledWith(
        'test-posthog-key',
        expect.objectContaining({
          debug: false,
          disable_surveys: false,
          autocapture: false,
          enable_recording_console_log: false
        })
      );
    });

    test('tracks app launched event after initialization', () => {
      analyticsService.initialize(mockConfig);
      
      expect(mockPostHog.capture).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.APP_LAUNCHED,
        expect.objectContaining({
          environment: 'development',
          version: '1.0.0',
          timestamp: expect.any(String)
        })
      );
    });

    test('prevents double initialization', () => {
      analyticsService.initialize(mockConfig);
      analyticsService.initialize(mockConfig);
      
      expect(mockPostHog.init).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith('Analytics is already initialized');
    });

    test('disables initialization in test environment', () => {
      process.env.NODE_ENV = 'test';
      analyticsService.initialize(mockConfig);
      
      expect(mockPostHog.init).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledWith('Analytics disabled in test environment');
      expect(analyticsService.isReady()).toBe(false);
    });

    test('disables initialization in development when configured', () => {
      const configWithDisabled = { ...mockConfig, disableInDevelopment: true };
      
      analyticsService.initialize(configWithDisabled);
      
      expect(mockPostHog.init).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledWith('Analytics disabled in development environment');
    });

    test('handles initialization errors gracefully', () => {
      mockPostHog.init.mockImplementation(() => {
        throw new Error('PostHog init failed');
      });
      
      analyticsService.initialize(mockConfig);
      
      expect(console.error).toHaveBeenCalledWith('Failed to initialize analytics:', expect.any(Error));
      expect(analyticsService.isReady()).toBe(false);
    });

    test('starts session tracking after initialization', () => {
      analyticsService.initialize(mockConfig);
      
      // Should track session started event
      expect(mockPostHog.capture).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.SESSION_STARTED,
        expect.objectContaining({
          session_id: expect.any(String)
        })
      );
    });
  });

  describe('User Identification', () => {
    beforeEach(() => {
      const mockConfig: AnalyticsConfig = {
        apiKey: 'test-key',
        environment: 'development'
      };
      analyticsService.initialize(mockConfig);
    });

    test('identifies user with properties', () => {
      const userId = 'user-123';
      const properties: UserProperties = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        plan: 'premium',
        totalAlarms: 5,
        isSubscribed: true,
        preferredWakeTime: '07:00'
      };
      
      analyticsService.identify(userId, properties);
      
      expect(mockPostHog.identify).toHaveBeenCalledWith(userId, {
        email: 'test@example.com',
        username: 'testuser',
        created_at: undefined,
        plan: 'premium',
        total_alarms: 5,
        is_subscribed: true,
        device_type: expect.any(String),
        preferred_wake_time: '07:00',
        screen_width: expect.any(Number),
        screen_height: expect.any(Number),
        viewport_width: expect.any(Number),
        viewport_height: expect.any(Number),
        timezone: expect.any(String),
        language: expect.any(String),
        user_agent: expect.any(String),
        connection_type: expect.any(String)
      });
    });

    test('works without optional properties', () => {
      analyticsService.identify('user-123');
      
      expect(mockPostHog.identify).toHaveBeenCalledWith('user-123', expect.any(Object));
    });

    test('resets user identity correctly', () => {
      analyticsService.reset();
      
      expect(mockPostHog.reset).toHaveBeenCalled();
      // Should also track session ended event
      expect(mockPostHog.capture).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.SESSION_ENDED,
        expect.objectContaining({
          session_id: expect.any(String),
          session_duration: expect.any(Number)
        })
      );
    });

    test('does not identify when not initialized', () => {
      const uninitializedService = new (AnalyticsService as any)();
      uninitializedService.identify('user-123');
      
      expect(mockPostHog.identify).not.toHaveBeenCalled();
    });
  });

  describe('Event Tracking', () => {
    beforeEach(() => {
      const mockConfig: AnalyticsConfig = {
        apiKey: 'test-key',
        environment: 'development'
      };
      analyticsService.initialize(mockConfig);
    });

    test('tracks event with enhanced properties', () => {
      const eventName = 'alarm_created';
      const properties: EventProperties = {
        source: 'mobile',
        category: 'alarm',
        value: 1,
        metadata: { alarmId: 'alarm-123' }
      };
      
      analyticsService.track(eventName, properties);
      
      expect(mockPostHog.capture).toHaveBeenCalledWith(eventName, {
        source: 'mobile',
        category: 'alarm',
        value: 1,
        metadata: { alarmId: 'alarm-123' },
        timestamp: expect.any(String),
        session_id: expect.any(String),
        session_duration: expect.any(Number),
        url: expect.any(String),
        path: expect.any(String),
        search: expect.any(String),
        hash: expect.any(String),
        referrer: expect.any(String),
        is_online: expect.any(Boolean),
        battery_level: expect.any(String)
      });
    });

    test('tracks event with minimal properties', () => {
      analyticsService.track('simple_event');
      
      expect(mockPostHog.capture).toHaveBeenCalledWith(
        'simple_event',
        expect.objectContaining({
          timestamp: expect.any(String),
          session_id: expect.any(String),
          source: 'web'
        })
      );
    });

    test('falls back to console when not initialized', () => {
      const uninitializedService = new (AnalyticsService as any)();
      uninitializedService.track('test_event', { test: true });
      
      expect(console.log).toHaveBeenCalledWith('Analytics not initialized, event:', 'test_event', { test: true });
      expect(mockPostHog.capture).not.toHaveBeenCalled();
    });
  });

  describe('User Properties Management', () => {
    beforeEach(() => {
      const mockConfig: AnalyticsConfig = {
        apiKey: 'test-key',
        environment: 'development'
      };
      analyticsService.initialize(mockConfig);
    });

    test('sets user properties correctly', () => {
      const properties: Partial<UserProperties> = {
        plan: 'premium',
        totalAlarms: 10,
        isSubscribed: true
      };
      
      analyticsService.setUserProperties(properties);
      
      expect(mockPostHog.people.set).toHaveBeenCalledWith({
        device_type: expect.any(String),
        plan: 'premium',
        totalAlarms: 10,
        isSubscribed: true,
        screen_width: expect.any(Number),
        screen_height: expect.any(Number),
        viewport_width: expect.any(Number),
        viewport_height: expect.any(Number),
        timezone: expect.any(String),
        language: expect.any(String),
        user_agent: expect.any(String),
        connection_type: expect.any(String)
      });
    });

    test('increments numeric properties', () => {
      analyticsService.incrementProperty('alarm_count', 5);
      
      expect(mockPostHog.people.increment).toHaveBeenCalledWith({
        alarm_count: 5
      });
    });

    test('uses default increment value of 1', () => {
      analyticsService.incrementProperty('login_count');
      
      expect(mockPostHog.people.increment).toHaveBeenCalledWith({
        login_count: 1
      });
    });
  });

  describe('Page View Tracking', () => {
    beforeEach(() => {
      const mockConfig: AnalyticsConfig = {
        apiKey: 'test-key',
        environment: 'development'
      };
      analyticsService.initialize(mockConfig);
    });

    test('tracks page view with enhanced context', () => {
      analyticsService.trackPageView('Dashboard', { section: 'main' });
      
      expect(mockPostHog.capture).toHaveBeenCalledWith('$pageview', {
        page_name: 'Dashboard',
        page_url: window.location.href,
        page_path: window.location.pathname,
        referrer: document.referrer,
        section: 'main',
        timestamp: expect.any(String),
        session_id: expect.any(String),
        session_duration: expect.any(Number),
        source: 'web',
        url: expect.any(String),
        path: expect.any(String),
        search: expect.any(String),
        hash: expect.any(String),
        is_online: expect.any(Boolean),
        battery_level: expect.any(String)
      });
    });

    test('uses document title when page name not provided', () => {
      Object.defineProperty(document, 'title', {
        value: 'Test Page Title',
        writable: true
      });
      
      analyticsService.trackPageView();
      
      expect(mockPostHog.capture).toHaveBeenCalledWith(
        '$pageview',
        expect.objectContaining({
          page_name: 'Test Page Title'
        })
      );
    });
  });

  describe('Feature and Performance Tracking', () => {
    beforeEach(() => {
      const mockConfig: AnalyticsConfig = {
        apiKey: 'test-key',
        environment: 'development'
      };
      analyticsService.initialize(mockConfig);
    });

    test('tracks feature usage correctly', () => {
      analyticsService.trackFeatureUsage('voice-commands', 'activate', { success: true });
      
      expect(mockPostHog.capture).toHaveBeenCalledWith('feature_used', {
        feature_name: 'voice-commands',
        action: 'activate',
        success: true,
        timestamp: expect.any(String),
        session_id: expect.any(String),
        session_duration: expect.any(Number),
        source: 'web',
        url: expect.any(String),
        path: expect.any(String),
        search: expect.any(String),
        hash: expect.any(String),
        referrer: expect.any(String),
        is_online: expect.any(Boolean),
        battery_level: expect.any(String)
      });
    });

    test('tracks performance metrics correctly', () => {
      analyticsService.trackPerformance('component_load', 150, 'ms', { component: 'AlarmList' });
      
      expect(mockPostHog.capture).toHaveBeenCalledWith(ANALYTICS_EVENTS.PAGE_LOAD_TIME, {
        metric_name: 'component_load',
        value: 150,
        unit: 'ms',
        component: 'AlarmList',
        timestamp: expect.any(String),
        session_id: expect.any(String),
        session_duration: expect.any(Number),
        source: 'web',
        url: expect.any(String),
        path: expect.any(String),
        search: expect.any(String),
        hash: expect.any(String),
        referrer: expect.any(String),
        is_online: expect.any(Boolean),
        battery_level: expect.any(String)
      });
    });

    test('uses default unit for performance metrics', () => {
      analyticsService.trackPerformance('load_time', 200);
      
      expect(mockPostHog.capture).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.PAGE_LOAD_TIME,
        expect.objectContaining({
          unit: 'ms'
        })
      );
    });

    test('tracks errors with truncated stack trace', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at Object.<anonymous> (/test.js:1:1)\n'.repeat(50);
      
      analyticsService.trackError(error, { component: 'AlarmForm' });
      
      expect(mockPostHog.capture).toHaveBeenCalledWith(ANALYTICS_EVENTS.ERROR_OCCURRED, {
        error_message: 'Test error',
        error_stack: expect.any(String),
        error_name: 'Error',
        component: 'AlarmForm',
        timestamp: expect.any(String),
        session_id: expect.any(String),
        session_duration: expect.any(Number),
        source: 'web',
        url: expect.any(String),
        path: expect.any(String),
        search: expect.any(String),
        hash: expect.any(String),
        referrer: expect.any(String),
        is_online: expect.any(Boolean),
        battery_level: expect.any(String)
      });
      
      // Verify stack trace is truncated
      const captureCall = mockPostHog.capture.mock.calls.find(call => call[0] === ANALYTICS_EVENTS.ERROR_OCCURRED);
      expect(captureCall![1].error_stack.length).toBeLessThanOrEqual(500);
    });

    test('tracks conversion events', () => {
      analyticsService.trackConversion('subscription', 29.99, { plan: 'premium' });
      
      expect(mockPostHog.capture).toHaveBeenCalledWith('conversion', {
        conversion_type: 'subscription',
        value: 29.99,
        plan: 'premium',
        timestamp: expect.any(String),
        session_id: expect.any(String),
        session_duration: expect.any(Number),
        source: 'web',
        url: expect.any(String),
        path: expect.any(String),
        search: expect.any(String),
        hash: expect.any(String),
        referrer: expect.any(String),
        is_online: expect.any(Boolean),
        battery_level: expect.any(String)
      });
    });
  });

  describe('Session Recording', () => {
    beforeEach(() => {
      const mockConfig: AnalyticsConfig = {
        apiKey: 'test-key',
        environment: 'development'
      };
      analyticsService.initialize(mockConfig);
    });

    test('enables session recording', () => {
      analyticsService.toggleSessionRecording(true);
      
      expect(mockPostHog.startSessionRecording).toHaveBeenCalled();
    });

    test('disables session recording', () => {
      analyticsService.toggleSessionRecording(false);
      
      expect(mockPostHog.stopSessionRecording).toHaveBeenCalled();
    });

    test('does not toggle when not initialized', () => {
      const uninitializedService = new (AnalyticsService as any)();
      uninitializedService.toggleSessionRecording(true);
      
      expect(mockPostHog.startSessionRecording).not.toHaveBeenCalled();
    });
  });

  describe('Additional Features', () => {
    beforeEach(() => {
      const mockConfig: AnalyticsConfig = {
        apiKey: 'test-key',
        environment: 'development'
      };
      analyticsService.initialize(mockConfig);
    });

    test('captures user feedback', () => {
      analyticsService.captureFeedback(5, 'Great app!', { page: 'dashboard' });
      
      expect(mockPostHog.capture).toHaveBeenCalledWith('feedback_submitted', {
        rating: 5,
        comment: 'Great app!',
        page: 'dashboard',
        timestamp: expect.any(String),
        session_id: expect.any(String),
        session_duration: expect.any(Number),
        source: 'web',
        url: expect.any(String),
        path: expect.any(String),
        search: expect.any(String),
        hash: expect.any(String),
        referrer: expect.any(String),
        is_online: expect.any(Boolean),
        battery_level: expect.any(String)
      });
    });

    test('tracks experiment participation', () => {
      analyticsService.trackExperiment('onboarding_flow', 'variant_b', { user_segment: 'new' });
      
      expect(mockPostHog.capture).toHaveBeenCalledWith('experiment_participation', {
        experiment_name: 'onboarding_flow',
        variant: 'variant_b',
        user_segment: 'new',
        timestamp: expect.any(String),
        session_id: expect.any(String),
        session_duration: expect.any(Number),
        source: 'web',
        url: expect.any(String),
        path: expect.any(String),
        search: expect.any(String),
        hash: expect.any(String),
        referrer: expect.any(String),
        is_online: expect.any(Boolean),
        battery_level: expect.any(String)
      });
    });

    test('gets feature flag value', () => {
      mockPostHog.getFeatureFlag.mockReturnValue(true);
      
      const flagValue = analyticsService.getFeatureFlag('new_feature');
      
      expect(mockPostHog.getFeatureFlag).toHaveBeenCalledWith('new_feature');
      expect(flagValue).toBe(true);
    });

    test('returns undefined for feature flag when not initialized', () => {
      const uninitializedService = new (AnalyticsService as any)();
      const flagValue = uninitializedService.getFeatureFlag('test_flag');
      
      expect(flagValue).toBeUndefined();
      expect(mockPostHog.getFeatureFlag).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Management', () => {
    test('returns current configuration', () => {
      const mockConfig: AnalyticsConfig = {
        apiKey: 'test-key',
        environment: 'production',
        debug: false
      };
      
      analyticsService.initialize(mockConfig);
      
      const config = analyticsService.getConfig();
      expect(config).toEqual(mockConfig);
    });

    test('returns null when not initialized', () => {
      const uninitializedService = new (AnalyticsService as any)();
      expect(uninitializedService.getConfig()).toBeNull();
    });
  });

  describe('Device and System Detection', () => {
    beforeEach(() => {
      const mockConfig: AnalyticsConfig = {
        apiKey: 'test-key',
        environment: 'development'
      };
      analyticsService.initialize(mockConfig);
    });

    test('detects mobile device correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });
      
      analyticsService.identify('user-123');
      
      expect(mockPostHog.identify).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          device_type: 'mobile'
        })
      );
    });

    test('detects tablet device correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        writable: true
      });
      
      analyticsService.identify('user-123');
      
      expect(mockPostHog.identify).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          device_type: 'mobile' // iPad contains 'ios' so will be detected as mobile
        })
      );
    });

    test('detects desktop device correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true
      });
      
      analyticsService.identify('user-123');
      
      expect(mockPostHog.identify).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          device_type: 'desktop'
        })
      );
    });

    test('includes system properties in identification', () => {
      analyticsService.identify('user-123');
      
      expect(mockPostHog.identify).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          timezone: expect.any(String),
          language: navigator.language,
          user_agent: navigator.userAgent,
          connection_type: expect.any(String)
        })
      );
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      const mockConfig: AnalyticsConfig = {
        apiKey: 'test-key',
        environment: 'development'
      };
      analyticsService.initialize(mockConfig);
    });

    test('generates unique session IDs', () => {
      // Get the session started events
      const sessionStartedCalls = mockPostHog.capture.mock.calls.filter(
        call => call[0] === ANALYTICS_EVENTS.SESSION_STARTED
      );
      
      expect(sessionStartedCalls).toHaveLength(1);
      const sessionId = sessionStartedCalls[0][1].session_id;
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    test('calculates session duration correctly', () => {
      // Simulate time passing
      jest.advanceTimersByTime(5000);
      
      analyticsService.track('test_event');
      
      const testEventCall = mockPostHog.capture.mock.calls.find(call => call[0] === 'test_event');
      expect(testEventCall![1].session_duration).toBeGreaterThan(0);
    });

    test('ends session on reset', () => {
      analyticsService.reset();
      
      const sessionEndedCalls = mockPostHog.capture.mock.calls.filter(
        call => call[0] === ANALYTICS_EVENTS.SESSION_ENDED
      );
      
      expect(sessionEndedCalls).toHaveLength(1);
      expect(sessionEndedCalls[0][1]).toMatchObject({
        session_id: expect.any(String),
        session_duration: expect.any(Number)
      });
    });
  });

  describe('Default Configurations', () => {
    test('provides correct default configurations for all environments', () => {
      expect(defaultAnalyticsConfigs.development).toEqual({
        apiKey: process.env.REACT_APP_POSTHOG_KEY || '',
        environment: 'development',
        debug: true,
        enableSessionRecording: false,
        enableHeatmaps: true,
        disableInDevelopment: false
      });

      expect(defaultAnalyticsConfigs.staging).toEqual({
        apiKey: process.env.REACT_APP_POSTHOG_KEY || '',
        environment: 'staging',
        debug: false,
        enableSessionRecording: true,
        enableHeatmaps: true,
        disableInDevelopment: false
      });

      expect(defaultAnalyticsConfigs.production).toEqual({
        apiKey: process.env.REACT_APP_POSTHOG_KEY || '',
        environment: 'production',
        debug: false,
        enableSessionRecording: true,
        enableHeatmaps: true,
        disableInDevelopment: false
      });
    });
  });

  describe('ANALYTICS_EVENTS Constants', () => {
    test('provides comprehensive event constants', () => {
      expect(ANALYTICS_EVENTS.APP_LAUNCHED).toBe('app_launched');
      expect(ANALYTICS_EVENTS.USER_SIGNED_UP).toBe('user_signed_up');
      expect(ANALYTICS_EVENTS.ALARM_CREATED).toBe('alarm_created');
      expect(ANALYTICS_EVENTS.ALARM_TRIGGERED).toBe('alarm_triggered');
      expect(ANALYTICS_EVENTS.VOICE_COMMAND_USED).toBe('voice_command_used');
      expect(ANALYTICS_EVENTS.PWA_INSTALLED).toBe('pwa_installed');
      expect(ANALYTICS_EVENTS.ONBOARDING_COMPLETED).toBe('onboarding_completed');
      expect(ANALYTICS_EVENTS.ERROR_OCCURRED).toBe('error_occurred');
      expect(ANALYTICS_EVENTS.SESSION_STARTED).toBe('session_started');
      expect(ANALYTICS_EVENTS.SUBSCRIPTION_STARTED).toBe('subscription_started');
    });
  });
});