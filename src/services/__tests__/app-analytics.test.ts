import AppAnalyticsService, { AppAnalyticsEvents } from '../app-analytics';
import AnalyticsConfigService from '../analytics-config';
import AnalyticsService, { ANALYTICS_EVENTS } from '../analytics';
import SentryService from '../sentry';
import { ErrorHandler } from '../error-handler';
import { testUtils } from '../../test-setup';

// Mock dependencies
jest.mock('../analytics-config');
jest.mock('../analytics');
jest.mock('../sentry');
jest.mock('../error-handler');

describe('AppAnalyticsService', () => {
  let appAnalyticsService: AppAnalyticsService;
  let mockAnalyticsConfig: jest.Mocked<AnalyticsConfigService>;
  let mockAnalytics: jest.Mocked<AnalyticsService>;
  let mockSentry: jest.Mocked<SentryService>;
  let mockErrorHandler: jest.Mocked<typeof ErrorHandler>;

  beforeEach(() => {
    testUtils.clearAllMocks();
    
    // Reset singleton instance
    (AppAnalyticsService as any).instance = null;
    
    // Setup mocked services
    mockAnalyticsConfig = {
      initialize: jest.fn().mockResolvedValue({
        sentry: { initialized: true },
        analytics: { initialized: true },
        timestamp: new Date().toISOString()
      }),
      setUserContext: jest.fn(),
      clearUserContext: jest.fn(),
      isReady: jest.fn().mockReturnValue(true),
      getConfig: jest.fn().mockReturnValue({ environment: 'development' }),
      setPrivacyMode: jest.fn()
    } as any;
    
    mockAnalytics = {
      isReady: jest.fn().mockReturnValue(true),
      track: jest.fn(),
      trackPerformance: jest.fn(),
      trackFeatureUsage: jest.fn(),
      trackPageView: jest.fn(),
      trackError: jest.fn(),
      setUserProperties: jest.fn()
    } as any;
    
    mockSentry = {
      addBreadcrumb: jest.fn()
    } as any;
    
    mockErrorHandler = {
      handleError: jest.fn()
    } as any;
    
    // Mock singleton getInstance methods
    (AnalyticsConfigService.getInstance as jest.Mock).mockReturnValue(mockAnalyticsConfig);
    (AnalyticsService.getInstance as jest.Mock).mockReturnValue(mockAnalytics);
    (SentryService.getInstance as jest.Mock).mockReturnValue(mockSentry);
    (ErrorHandler as any).handleError = mockErrorHandler.handleError;
    
    // Create service instance
    appAnalyticsService = AppAnalyticsService.getInstance();
    
    // Mock console methods
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    
    // Mock performance API
    Object.defineProperty(global, 'performance', {
      value: {
        now: jest.fn().mockReturnValue(1000),
        memory: {
          usedJSHeapSize: 10 * 1024 * 1024,
          totalJSHeapSize: 20 * 1024 * 1024,
          jsHeapSizeLimit: 100 * 1024 * 1024
        }
      },
      writable: true
    });
    
    // Mock environment variables
    process.env.REACT_APP_VERSION = '1.0.0';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.REACT_APP_VERSION;
  });

  describe('Singleton Pattern', () => {
    test('returns same instance on multiple calls', () => {
      const instance1 = AppAnalyticsService.getInstance();
      const instance2 = AppAnalyticsService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    test('initializes analytics services successfully', async () => {
      await appAnalyticsService.initializeAnalytics();
      
      expect(mockAnalyticsConfig.initialize).toHaveBeenCalled();
      expect(mockAnalytics.track).toHaveBeenCalledWith('analyticsInitialized', {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        sentryInitialized: true,
        analyticsInitialized: true,
        environment: 'development'
      });
      expect(console.info).toHaveBeenCalledWith('App analytics services initialized successfully');
    });

    test('handles initialization errors gracefully', async () => {
      mockAnalyticsConfig.initialize.mockRejectedValue(new Error('Init failed'));
      
      await appAnalyticsService.initializeAnalytics();
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        {
          context: 'analytics_initialization',
          component: 'AppAnalyticsService',
          action: 'initialize'
        }
      );
    });

    test('starts performance monitoring after initialization', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      await appAnalyticsService.initializeAnalytics();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('User Context Management', () => {
    test('sets user context with enhanced properties', () => {
      const userId = 'user-123';
      const userProperties = {
        email: 'test@example.com',
        plan: 'premium',
        signInMethod: 'email'
      };
      
      appAnalyticsService.setUserContext(userId, userProperties);
      
      expect(mockAnalyticsConfig.setUserContext).toHaveBeenCalledWith(userId, {
        email: 'test@example.com',
        plan: 'premium',
        signInMethod: 'email',
        sessionId: expect.any(String),
        firstSeen: expect.any(String),
        platform: 'web',
        appVersion: '1.0.0'
      });
      
      expect(mockAnalytics.track).toHaveBeenCalledWith('userSignedIn', {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        userId,
        method: 'email'
      });
    });

    test('handles user context setup errors', () => {
      mockAnalyticsConfig.setUserContext.mockImplementation(() => {
        throw new Error('Context setup failed');
      });
      
      appAnalyticsService.setUserContext('user-123', { email: 'test@example.com' });
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        {
          context: 'user_context_setup',
          component: 'AppAnalyticsService',
          metadata: { userId: 'user-123' }
        }
      );
    });

    test('clears user context and tracks sign out', () => {
      appAnalyticsService.clearUserContext();
      
      expect(mockAnalyticsConfig.clearUserContext).toHaveBeenCalled();
      expect(mockAnalytics.track).toHaveBeenCalledWith('userSignedOut', {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number)
      });
    });

    test('handles user context clear errors', () => {
      mockAnalyticsConfig.clearUserContext.mockImplementation(() => {
        throw new Error('Clear failed');
      });
      
      appAnalyticsService.clearUserContext();
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        {
          context: 'user_context_clear',
          component: 'AppAnalyticsService'
        }
      );
    });
  });

  describe('Alarm Event Tracking', () => {
    test('tracks alarm creation with comprehensive data', () => {
      const alarm = {
        id: 'alarm-123',
        time: '07:00',
        days: [1, 2, 3, 4, 5],
        label: 'Morning Alarm',
        voiceMood: 'motivational' as const
      };
      const context = { isQuickSetup: true, presetType: 'morning' };
      
      appAnalyticsService.trackAlarmCreated(alarm, context);
      
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.ALARM_CREATED, {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        alarmId: 'alarm-123',
        time: '07:00',
        days: [1, 2, 3, 4, 5],
        label: 'Morning Alarm',
        voiceMood: 'motivational',
        isQuickSetup: true,
        presetType: 'morning'
      });
      
      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(
        'Alarm created: Morning Alarm at 07:00',
        'user',
        { alarmId: 'alarm-123', isQuickSetup: true }
      );
    });

    test('tracks alarm creation with minimal data', () => {
      const alarm = { id: 'alarm-456' };
      
      appAnalyticsService.trackAlarmCreated(alarm);
      
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.ALARM_CREATED, {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        alarmId: 'alarm-456',
        time: 'unknown',
        days: [],
        label: 'Unnamed',
        voiceMood: undefined,
        isQuickSetup: false,
        presetType: undefined
      });
    });

    test('tracks alarm dismissal with performance metrics', () => {
      const alarmId = 'alarm-123';
      const method = 'voice';
      const responseTime = 2500;
      const snoozeCount = 2;
      
      appAnalyticsService.trackAlarmDismissed(alarmId, method, responseTime, snoozeCount);
      
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.ALARM_DISMISSED, {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        alarmId,
        method,
        timeToRespond: responseTime,
        snoozeCount
      });
      
      expect(mockAnalytics.trackPerformance).toHaveBeenCalledWith('alarm_response_time', responseTime, 'ms', {
        method,
        snoozeCount
      });
    });

    test('tracks alarm dismissal without snooze count when zero', () => {
      appAnalyticsService.trackAlarmDismissed('alarm-123', 'button', 1000, 0);
      
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.ALARM_DISMISSED, {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        alarmId: 'alarm-123',
        method: 'button',
        timeToRespond: 1000,
        snoozeCount: undefined
      });
    });

    test('tracks generic alarm events correctly', () => {
      const eventData = { alarmId: 'alarm-123', changes: ['time', 'label'] };
      
      appAnalyticsService.trackAlarmEvent('alarmEdited', eventData);
      
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.ALARM_EDITED, {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        alarmId: 'alarm-123',
        changes: ['time', 'label']
      });
    });
  });

  describe('Voice Command Tracking', () => {
    test('tracks successful voice command', () => {
      appAnalyticsService.trackVoiceCommand('snooze alarm', true, 0.95);
      
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.VOICE_COMMAND_USED, {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        command: 'snooze alarm',
        success: true,
        confidence: 0.95,
        language: navigator.language
      });
    });

    test('tracks failed voice command and adds breadcrumb', () => {
      appAnalyticsService.trackVoiceCommand('invalid command', false, 0.3);
      
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.VOICE_COMMAND_USED, {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        command: 'invalid command',
        success: false,
        confidence: 0.3,
        language: navigator.language
      });
      
      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(
        'Voice command failed: invalid command',
        'user',
        { confidence: 0.3, language: navigator.language }
      );
    });

    test('tracks voice command without confidence score', () => {
      appAnalyticsService.trackVoiceCommand('dismiss alarm', true);
      
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.VOICE_COMMAND_USED, {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        command: 'dismiss alarm',
        success: true,
        confidence: undefined,
        language: navigator.language
      });
    });
  });

  describe('Performance Tracking', () => {
    test('tracks performance metrics with metadata', () => {
      const metricName = 'component_render_time';
      const value = 45;
      const metadata = { component: 'AlarmList', itemCount: 5 };
      
      appAnalyticsService.trackPerformance(metricName, value, metadata);
      
      expect(mockAnalytics.trackPerformance).toHaveBeenCalledWith(metricName, value, 'ms', {
        timestamp: expect.any(String),
        component: 'AlarmList',
        itemCount: 5
      });
    });

    test('tracks performance markers correctly', () => {
      appAnalyticsService.startPerformanceMarker('test_operation');
      
      // Simulate time passing
      (performance.now as jest.Mock).mockReturnValue(2000);
      
      const duration = appAnalyticsService.endPerformanceMarker('test_operation', { operation: 'test' });
      
      expect(duration).toBe(1000);
      expect(mockAnalytics.trackPerformance).toHaveBeenCalledWith('test_operation', 1000, 'ms', {
        timestamp: expect.any(String),
        operation: 'test'
      });
    });

    test('handles missing performance marker gracefully', () => {
      const duration = appAnalyticsService.endPerformanceMarker('nonexistent_marker');
      
      expect(duration).toBe(0);
      expect(mockAnalytics.trackPerformance).not.toHaveBeenCalled();
    });
  });

  describe('Feature and Page Tracking', () => {
    test('tracks feature usage with context', () => {
      appAnalyticsService.trackFeatureUsage('voice-recognition', 'enable', { userType: 'premium' });
      
      expect(mockAnalytics.trackFeatureUsage).toHaveBeenCalledWith('voice-recognition', 'enable', {
        source: 'app',
        timestamp: expect.any(String),
        userType: 'premium'
      });
    });

    test('tracks feature usage with default action', () => {
      appAnalyticsService.trackFeatureUsage('notifications');
      
      expect(mockAnalytics.trackFeatureUsage).toHaveBeenCalledWith('notifications', 'used', {
        source: 'app',
        timestamp: expect.any(String)
      });
    });

    test('tracks page views with metadata', () => {
      appAnalyticsService.trackPageView('Dashboard', { section: 'main', alarmCount: 3 });
      
      expect(mockAnalytics.trackPageView).toHaveBeenCalledWith('Dashboard', {
        source: 'navigation',
        timestamp: expect.any(String),
        section: 'main',
        alarmCount: 3
      });
    });
  });

  describe('Onboarding and User Properties', () => {
    test('tracks onboarding completion and updates user properties', () => {
      appAnalyticsService.trackOnboardingCompleted(5, 180000, false);
      
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        steps: 5,
        timeSpent: 180000,
        skipped: false
      });
      
      expect(mockAnalytics.setUserProperties).toHaveBeenCalledWith({
        onboardingCompleted: true,
        onboardingSteps: 5,
        onboardingDuration: 180000
      });
    });

    test('tracks skipped onboarding', () => {
      appAnalyticsService.trackOnboardingCompleted(2, 30000, true);
      
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        steps: 2,
        timeSpent: 30000,
        skipped: true
      });
    });
  });

  describe('Error Tracking', () => {
    test('tracks errors with enhanced context', () => {
      const error = new Error('Test error');
      const context = { component: 'AlarmForm', action: 'save' };
      
      appAnalyticsService.trackError(error, context);
      
      expect(mockAnalytics.trackError).toHaveBeenCalledWith(error, {
        source: 'app-analytics-service',
        timestamp: expect.any(String),
        sessionDuration: expect.any(Number),
        component: 'AlarmForm',
        action: 'save'
      });
    });

    test('tracks errors without additional context', () => {
      const error = new Error('Simple error');
      
      appAnalyticsService.trackError(error);
      
      expect(mockAnalytics.trackError).toHaveBeenCalledWith(error, {
        source: 'app-analytics-service',
        timestamp: expect.any(String),
        sessionDuration: expect.any(Number)
      });
    });
  });

  describe('Privacy and Configuration', () => {
    test('sets privacy mode and tracks event', () => {
      appAnalyticsService.setPrivacyMode(true);
      
      expect(mockAnalyticsConfig.setPrivacyMode).toHaveBeenCalledWith(true);
      expect(mockAnalytics.track).toHaveBeenCalledWith('privacyModeToggled', {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        enabled: true,
        timestamp: expect.any(String)
      });
    });

    test('disables privacy mode and tracks event', () => {
      appAnalyticsService.setPrivacyMode(false);
      
      expect(mockAnalyticsConfig.setPrivacyMode).toHaveBeenCalledWith(false);
      expect(mockAnalytics.track).toHaveBeenCalledWith('privacyModeToggled', {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        enabled: false,
        timestamp: expect.any(String)
      });
    });

    test('checks analytics readiness status', () => {
      const ready = appAnalyticsService.isReady();
      
      expect(mockAnalyticsConfig.isReady).toHaveBeenCalled();
      expect(ready).toBe(true);
    });
  });

  describe('Event Name Mapping', () => {
    test('maps alarm event types to correct analytics events', () => {
      const eventTypes: Array<keyof AppAnalyticsEvents> = [
        'alarmCreated',
        'alarmEdited', 
        'alarmDeleted',
        'alarmTriggered',
        'alarmDismissed',
        'alarmSnoozed'
      ];
      
      eventTypes.forEach(eventType => {
        appAnalyticsService.trackAlarmEvent(eventType, { alarmId: 'test' });
      });
      
      // Verify correct event names were used
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.ALARM_CREATED, expect.any(Object));
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.ALARM_EDITED, expect.any(Object));
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.ALARM_DELETED, expect.any(Object));
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.ALARM_TRIGGERED, expect.any(Object));
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.ALARM_DISMISSED, expect.any(Object));
      expect(mockAnalytics.track).toHaveBeenCalledWith(ANALYTICS_EVENTS.ALARM_SNOOZED, expect.any(Object));
    });

    test('uses original event name when no mapping exists', () => {
      appAnalyticsService.trackAlarmEvent('customEvent' as any, { data: 'test' });
      
      expect(mockAnalytics.track).toHaveBeenCalledWith('customEvent', {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        data: 'test'
      });
    });
  });

  describe('Session Management', () => {
    test('generates unique session IDs', () => {
      appAnalyticsService.setUserContext('user-1');
      appAnalyticsService.setUserContext('user-2');
      
      const calls = mockAnalyticsConfig.setUserContext.mock.calls;
      const sessionId1 = calls[0][1].sessionId;
      const sessionId2 = calls[1][1].sessionId;
      
      expect(sessionId1).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(sessionId2).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(sessionId1).not.toBe(sessionId2);
    });

    test('calculates session duration correctly', () => {
      // Create service instance at time 0
      const startTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(startTime);
      
      // Reset and create new instance to capture start time
      (AppAnalyticsService as any).instance = null;
      const newService = AppAnalyticsService.getInstance();
      
      // Simulate time passing
      jest.spyOn(Date, 'now').mockReturnValue(startTime + 5000);
      
      newService.clearUserContext();
      
      expect(mockAnalytics.track).toHaveBeenCalledWith('userSignedOut', {
        source: 'smart-alarm-app',
        sessionDuration: 5000
      });
    });
  });

  describe('Performance Monitoring Setup', () => {
    test('sets up performance monitoring event listeners', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      await appAnalyticsService.initializeAnalytics();
      
      // Verify event listeners were added
      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    test('tracks connectivity changes', async () => {
      await appAnalyticsService.initializeAnalytics();
      
      // Simulate online event
      const onlineHandler = window.addEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1] as Function;
      
      onlineHandler();
      
      expect(mockAnalytics.track).toHaveBeenCalledWith('connectivity_changed', {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        status: 'online'
      });
      
      // Simulate offline event
      const offlineHandler = window.addEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1] as Function;
      
      offlineHandler();
      
      expect(mockAnalytics.track).toHaveBeenCalledWith('connectivity_changed', {
        source: 'smart-alarm-app',
        sessionDuration: expect.any(Number),
        status: 'offline'
      });
    });

    test('tracks page load performance', async () => {
      await appAnalyticsService.initializeAnalytics();
      
      // Simulate page load event
      const loadHandler = window.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1] as Function;
      
      loadHandler();
      
      expect(mockAnalytics.trackPerformance).toHaveBeenCalledWith('page_load_time', 1000, 'ms', {
        timestamp: expect.any(String),
        type: 'initial_load'
      });
    });
  });

  describe('Analytics Service Availability', () => {
    test('only tracks events when analytics is ready', () => {
      mockAnalytics.isReady.mockReturnValue(false);
      
      appAnalyticsService.setUserContext('user-123');
      
      // Should call setUserContext but not track event
      expect(mockAnalyticsConfig.setUserContext).toHaveBeenCalled();
      expect(mockAnalytics.track).not.toHaveBeenCalledWith('userSignedIn', expect.any(Object));
    });

    test('tracks events when analytics becomes ready', () => {
      mockAnalytics.isReady.mockReturnValue(true);
      
      appAnalyticsService.trackFeatureUsage('test-feature');
      
      expect(mockAnalytics.trackFeatureUsage).toHaveBeenCalled();
    });
  });
});