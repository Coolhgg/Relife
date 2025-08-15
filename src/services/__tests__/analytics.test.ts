import { AnalyticsService, ANALYTICS_EVENTS } from '../analytics';

// Mock PostHog
const mockPostHog = {
  init: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  capture: jest.fn(),
  people: {
    set: jest.fn(),
    increment: jest.fn()
  },
  register: jest.fn(),
  getFeatureFlag: jest.fn(),
  startSessionRecording: jest.fn(),
  stopSessionRecording: jest.fn()
};

jest.mock('posthog-js', () => mockPostHog);

describe('AnalyticsService', () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    analytics = AnalyticsService.getInstance();
  });

  afterEach(() => {
    localStorage.clear();
    // Reset singleton instance for clean tests
    (AnalyticsService as any).instance = undefined;
  });

  describe('Initialization', () => {
    it('should initialize PostHog with correct configuration', () => {
      analytics.initialize();
      
      expect(mockPostHog.init).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          api_host: expect.any(String),
          debug: expect.any(Boolean),
          respect_dnt: true,
          capture_pageview: true,
          capture_pageleave: true,
          autocapture: expect.any(Boolean)
        })
      );
    });

    it('should not initialize twice', () => {
      analytics.initialize();
      analytics.initialize();
      
      expect(mockPostHog.init).toHaveBeenCalledTimes(1);
    });

    it('should skip initialization in test environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      
      analytics.initialize();
      
      expect(mockPostHog.init).not.toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
    });

    it('should track app launch event on initialization', () => {
      analytics.initialize();
      
      expect(mockPostHog.capture).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.APP_LAUNCHED,
        expect.objectContaining({
          environment: expect.any(String),
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('User Identification', () => {
    beforeEach(() => {
      analytics.initialize();
      jest.clearAllMocks();
    });

    it('should identify user with correct properties', () => {
      const userId = 'user123';
      const properties = {
        id: userId,
        email: 'user@example.com',
        username: 'testuser',
        createdAt: '2024-01-01T00:00:00Z',
        totalAlarms: 5,
        isSubscribed: true
      };

      analytics.identify(userId, properties);

      expect(mockPostHog.identify).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          email: properties.email,
          username: properties.username,
          created_at: properties.createdAt,
          total_alarms: properties.totalAlarms,
          is_subscribed: properties.isSubscribed
        })
      );
    });

    it('should reset user identity', () => {
      analytics.reset();
      
      expect(mockPostHog.reset).toHaveBeenCalled();
    });
  });

  describe('Event Tracking', () => {
    beforeEach(() => {
      analytics.initialize();
      jest.clearAllMocks();
    });

    it('should track events with enhanced properties', () => {
      const eventName = 'test_event';
      const properties = {
        category: 'test',
        value: 100
      };

      analytics.track(eventName, properties);

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        eventName,
        expect.objectContaining({
          ...properties,
          timestamp: expect.any(String),
          session_id: expect.any(String),
          source: 'web'
        })
      );
    });

    it('should track page views with contextual information', () => {
      const pageName = 'dashboard';
      const properties = { user_role: 'admin' };

      analytics.trackPageView(pageName, properties);

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        '$pageview',
        expect.objectContaining({
          page_name: pageName,
          page_url: expect.any(String),
          page_path: expect.any(String),
          ...properties
        })
      );
    });

    it('should track feature usage', () => {
      const featureName = 'alarm_creation';
      const action = 'button_clicked';
      const properties = { alarm_type: 'voice' };

      analytics.trackFeatureUsage(featureName, action, properties);

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        'feature_used',
        expect.objectContaining({
          feature_name: featureName,
          action,
          ...properties
        })
      );
    });
  });

  describe('User Properties', () => {
    beforeEach(() => {
      analytics.initialize();
      jest.clearAllMocks();
    });

    it('should set user properties', () => {
      const properties = {
        plan: 'premium',
        totalAlarms: 10
      };

      analytics.setUserProperties(properties);

      expect(mockPostHog.people.set).toHaveBeenCalledWith(
        expect.objectContaining(properties)
      );
    });

    it('should increment numeric properties', () => {
      const property = 'alarms_created';
      const value = 3;

      analytics.incrementProperty(property, value);

      expect(mockPostHog.people.increment).toHaveBeenCalledWith({
        [property]: value
      });
    });
  });

  describe('Performance Tracking', () => {
    beforeEach(() => {
      analytics.initialize();
      jest.clearAllMocks();
    });

    it('should track performance markers', () => {
      const markerName = 'component_render';
      
      analytics.startPerformanceMarker(markerName);
      
      // Simulate some work
      setTimeout(() => {
        const duration = analytics.endPerformanceMarker(markerName);
        
        expect(typeof duration).toBe('number');
        expect(duration).toBeGreaterThanOrEqual(0);
        expect(mockPostHog.capture).toHaveBeenCalledWith(
          'performance_marker',
          expect.objectContaining({
            marker_name: markerName,
            duration: expect.any(Number)
          })
        );
      }, 10);
    });

    it('should handle invalid performance markers gracefully', () => {
      const duration = analytics.endPerformanceMarker('nonexistent_marker');
      
      expect(duration).toBe(0);
      expect(mockPostHog.capture).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      analytics.initialize();
      jest.clearAllMocks();
    });

    it('should track errors with context', () => {
      const error = new Error('Test error');
      const context = 'component_mount';
      const metadata = { userId: 'user123' };

      analytics.trackError(error, context, metadata);

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.ERROR_OCCURRED,
        expect.objectContaining({
          error_message: error.message,
          error_stack: error.stack,
          context,
          metadata
        })
      );
    });

    it('should handle string errors', () => {
      const errorMessage = 'String error';
      const context = 'api_call';

      analytics.trackError(errorMessage, context);

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.ERROR_OCCURRED,
        expect.objectContaining({
          error_message: errorMessage,
          context
        })
      );
    });
  });

  describe('Feature Flags', () => {
    beforeEach(() => {
      analytics.initialize();
      jest.clearAllMocks();
    });

    it('should get feature flag values', () => {
      const flagName = 'new_feature_enabled';
      const expectedValue = true;
      
      mockPostHog.getFeatureFlag.mockReturnValue(expectedValue);
      
      const result = analytics.getFeatureFlag(flagName);
      
      expect(mockPostHog.getFeatureFlag).toHaveBeenCalledWith(flagName);
      expect(result).toBe(expectedValue);
    });
  });

  describe('Session Recording', () => {
    beforeEach(() => {
      analytics.initialize();
      jest.clearAllMocks();
    });

    it('should start session recording', () => {
      analytics.enableSessionRecording(true);
      
      expect(mockPostHog.startSessionRecording).toHaveBeenCalled();
    });

    it('should stop session recording', () => {
      analytics.enableSessionRecording(false);
      
      expect(mockPostHog.stopSessionRecording).toHaveBeenCalled();
    });
  });

  describe('Analytics Events Constants', () => {
    it('should have all required event constants', () => {
      expect(ANALYTICS_EVENTS).toHaveProperty('APP_LAUNCHED');
      expect(ANALYTICS_EVENTS).toHaveProperty('USER_SIGNED_IN');
      expect(ANALYTICS_EVENTS).toHaveProperty('USER_SIGNED_OUT');
      expect(ANALYTICS_EVENTS).toHaveProperty('ALARM_CREATED');
      expect(ANALYTICS_EVENTS).toHaveProperty('ALARM_TRIGGERED');
      expect(ANALYTICS_EVENTS).toHaveProperty('ALARM_DISMISSED');
      expect(ANALYTICS_EVENTS).toHaveProperty('PWA_INSTALLED');
      expect(ANALYTICS_EVENTS).toHaveProperty('ERROR_OCCURRED');
      expect(ANALYTICS_EVENTS).toHaveProperty('SESSION_STARTED');
      expect(ANALYTICS_EVENTS).toHaveProperty('SESSION_ENDED');
    });

    it('should have consistent event naming convention', () => {
      Object.values(ANALYTICS_EVENTS).forEach(eventName => {
        expect(eventName).toMatch(/^[a-z_]+$/);
        expect(eventName).not.toContain(' ');
        expect(eventName).not.toContain('-');
      });
    });
  });

  describe('Environment Handling', () => {
    it('should handle missing configuration gracefully', () => {
      // Mock empty configuration
      const originalConfig = require('../../config/environment').config;
      jest.doMock('../../config/environment', () => ({
        config: {
          analytics: {
            posthog: {
              apiKey: '',
              host: ''
            }
          }
        }
      }));

      analytics.initialize();
      
      expect(mockPostHog.init).not.toHaveBeenCalled();
    });
  });

  describe('Integration with React Hooks', () => {
    it('should work correctly with React component lifecycle', () => {
      // Simulate React component mount
      analytics.initialize();
      analytics.identify('user123', { email: 'test@example.com' });
      
      // Simulate user interactions
      analytics.track(ANALYTICS_EVENTS.ALARM_CREATED, { alarm_type: 'voice' });
      analytics.track(ANALYTICS_EVENTS.ALARM_TRIGGERED, { alarm_id: 'alarm123' });
      
      // Verify events were tracked
      expect(mockPostHog.capture).toHaveBeenCalledTimes(3); // APP_LAUNCHED + 2 custom events
      
      // Simulate component unmount
      analytics.reset();
      
      expect(mockPostHog.reset).toHaveBeenCalled();
    });
  });
});