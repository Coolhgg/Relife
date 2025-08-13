import SentryService, { SentryConfig, UserContext, ErrorContext, defaultSentryConfigs } from '../sentry';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { testUtils } from '../../test-setup';

// Mock Sentry
jest.mock('@sentry/react');
jest.mock('@sentry/tracing');

describe('SentryService', () => {
  let sentryService: SentryService;
  let mockSentry: jest.Mocked<typeof Sentry>;

  beforeEach(() => {
    testUtils.clearAllMocks();
    
    // Reset singleton instance
    (SentryService as any).instance = null;
    sentryService = SentryService.getInstance();
    
    // Setup Sentry mocks
    mockSentry = Sentry as jest.Mocked<typeof Sentry>;
    mockSentry.init = jest.fn();
    mockSentry.setUser = jest.fn();
    mockSentry.captureException = jest.fn().mockReturnValue('event-id-123');
    mockSentry.captureMessage = jest.fn().mockReturnValue('message-id-123');
    mockSentry.addBreadcrumb = jest.fn();
    mockSentry.startTransaction = jest.fn().mockReturnValue({
      finish: jest.fn(),
      setTag: jest.fn(),
      setData: jest.fn()
    });
    mockSentry.withScope = jest.fn().mockImplementation((callback) => {
      const mockScope = {
        setLevel: jest.fn(),
        setTag: jest.fn(),
        setContext: jest.fn(),
        setFingerprint: jest.fn(),
        addBreadcrumb: jest.fn()
      };
      return callback(mockScope);
    });
    mockSentry.wrap = jest.fn().mockImplementation((fn) => fn);
    mockSentry.withErrorBoundary = jest.fn();
    
    // Mock BrowserTracing
    (BrowserTracing as jest.Mock).mockImplementation(() => ({}));
    
    // Mock console methods
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
    
    // Set NODE_ENV to non-test value for most tests
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    // Restore after each test
    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    test('returns same instance on multiple calls', () => {
      const instance1 = SentryService.getInstance();
      const instance2 = SentryService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    const mockConfig: SentryConfig = {
      dsn: 'https://test@sentry.io/123',
      environment: 'development',
      debug: true,
      enableTracing: true,
      tracesSampleRate: 1.0
    };

    test('initializes Sentry with correct configuration', () => {
      sentryService.initialize(mockConfig);
      
      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test@sentry.io/123',
          environment: 'development',
          debug: true,
          integrations: expect.arrayContaining([
            expect.any(Object), // BrowserTracing
            expect.any(Object)  // Replay
          ]),
          tracesSampleRate: 1.0,
          replaysSessionSampleRate: 1.0,
          replaysOnErrorSampleRate: 1.0,
          release: process.env.REACT_APP_VERSION || 'unknown',
          beforeSend: expect.any(Function),
          initialScope: expect.objectContaining({
            tags: {
              component: 'smart-alarm-app',
              platform: 'web'
            }
          })
        })
      );
      
      expect(sentryService.isReady()).toBe(true);
      expect(console.info).toHaveBeenCalledWith('Sentry initialized successfully');
    });

    test('adjusts traces sample rate based on environment', () => {
      const prodConfig = { ...mockConfig, environment: 'production' as const };
      delete prodConfig.tracesSampleRate;
      
      sentryService.initialize(prodConfig);
      
      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 0.1
        })
      );
    });

    test('prevents double initialization', () => {
      sentryService.initialize(mockConfig);
      sentryService.initialize(mockConfig);
      
      expect(mockSentry.init).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith('Sentry is already initialized');
    });

    test('disables initialization in test environment', () => {
      process.env.NODE_ENV = 'test';
      sentryService.initialize(mockConfig);
      
      expect(mockSentry.init).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledWith('Sentry disabled in test environment');
      expect(sentryService.isReady()).toBe(false);
    });

    test('handles initialization errors gracefully', () => {
      mockSentry.init.mockImplementation(() => {
        throw new Error('Sentry init failed');
      });
      
      sentryService.initialize(mockConfig);
      
      expect(console.error).toHaveBeenCalledWith('Failed to initialize Sentry:', expect.any(Error));
      expect(sentryService.isReady()).toBe(false);
    });

    test('applies custom beforeSend filter', () => {
      const customBeforeSend = jest.fn().mockReturnValue(null);
      const configWithFilter = { ...mockConfig, beforeSend: customBeforeSend };
      
      sentryService.initialize(configWithFilter);
      
      // Get the beforeSend function that was passed to Sentry.init
      const sentryInitCall = mockSentry.init.mock.calls[0][0];
      const beforeSendFunction = sentryInitCall.beforeSend;
      
      // Test the beforeSend function
      const mockEvent = { message: 'test event' };
      const mockHint = {};
      
      const result = beforeSendFunction(mockEvent, mockHint);
      
      expect(customBeforeSend).toHaveBeenCalledWith(mockEvent);
      expect(result).toBeNull(); // Custom filter returned null
    });
  });

  describe('User Context Management', () => {
    beforeEach(() => {
      const mockConfig: SentryConfig = {
        dsn: 'https://test@sentry.io/123',
        environment: 'development'
      };
      sentryService.initialize(mockConfig);
    });

    test('sets user context correctly', () => {
      const user: UserContext = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        segment: 'premium'
      };
      
      sentryService.setUser(user);
      
      expect(mockSentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        segment: 'premium'
      });
    });

    test('clears user context correctly', () => {
      sentryService.clearUser();
      
      expect(mockSentry.setUser).toHaveBeenCalledWith(null);
    });

    test('does not set user when not initialized', () => {
      const uninitializedService = new (SentryService as any)();
      uninitializedService.setUser({ id: 'user-123' });
      
      expect(mockSentry.setUser).not.toHaveBeenCalled();
    });
  });

  describe('Error Capture', () => {
    beforeEach(() => {
      const mockConfig: SentryConfig = {
        dsn: 'https://test@sentry.io/123',
        environment: 'development'
      };
      sentryService.initialize(mockConfig);
    });

    test('captures error with basic context', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        component: 'AlarmComponent',
        action: 'createAlarm',
        level: 'error'
      };
      
      const eventId = sentryService.captureError(error, context);
      
      expect(eventId).toBe('event-id-123');
      expect(mockSentry.withScope).toHaveBeenCalled();
      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
    });

    test('applies error context to scope', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        component: 'AlarmComponent',
        action: 'createAlarm',
        level: 'warning',
        tags: { feature: 'alarm-management' },
        metadata: { alarmId: 'alarm-123' },
        fingerprint: ['alarm', 'creation', 'error']
      };
      
      sentryService.captureError(error, context);
      
      // Verify withScope was called and examine the scope setup
      expect(mockSentry.withScope).toHaveBeenCalled();
      const scopeCallback = mockSentry.withScope.mock.calls[0][0];
      
      const mockScope = {
        setLevel: jest.fn(),
        setTag: jest.fn(),
        setContext: jest.fn(),
        setFingerprint: jest.fn(),
        addBreadcrumb: jest.fn()
      };
      
      scopeCallback(mockScope);
      
      expect(mockScope.setLevel).toHaveBeenCalledWith('warning');
      expect(mockScope.setTag).toHaveBeenCalledWith('feature', 'alarm-management');
      expect(mockScope.setContext).toHaveBeenCalledWith('errorContext', expect.objectContaining({
        component: 'AlarmComponent',
        action: 'createAlarm',
        alarmId: 'alarm-123',
        timestamp: expect.any(String),
        userAgent: navigator.userAgent,
        url: window.location.href
      }));
      expect(mockScope.setFingerprint).toHaveBeenCalledWith(['alarm', 'creation', 'error']);
      expect(mockScope.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Error in AlarmComponent',
        category: 'error',
        level: 'error',
        data: { alarmId: 'alarm-123' }
      });
    });

    test('falls back to console when not initialized', () => {
      const uninitializedService = new (SentryService as any)();
      const error = new Error('Test error');
      
      const eventId = uninitializedService.captureError(error);
      
      expect(eventId).toBe('sentry-not-initialized');
      expect(console.error).toHaveBeenCalledWith('Sentry not initialized, falling back to console:', error);
      expect(mockSentry.captureException).not.toHaveBeenCalled();
    });
  });

  describe('Message Capture', () => {
    beforeEach(() => {
      const mockConfig: SentryConfig = {
        dsn: 'https://test@sentry.io/123',
        environment: 'development'
      };
      sentryService.initialize(mockConfig);
    });

    test('captures message with context', () => {
      const message = 'User performed critical action';
      const context: ErrorContext = {
        component: 'SecurityManager',
        tags: { security: 'high' }
      };
      
      const eventId = sentryService.captureMessage(message, 'warning', context);
      
      expect(eventId).toBe('message-id-123');
      expect(mockSentry.captureMessage).toHaveBeenCalledWith(message, 'warning');
    });

    test('uses default info level when not specified', () => {
      sentryService.captureMessage('Info message');
      
      expect(mockSentry.captureMessage).toHaveBeenCalledWith('Info message', 'info');
    });

    test('falls back to console when not initialized', () => {
      const uninitializedService = new (SentryService as any)();
      
      const eventId = uninitializedService.captureMessage('Test message');
      
      expect(eventId).toBe('sentry-not-initialized');
      expect(console.log).toHaveBeenCalledWith('Sentry not initialized, message:', 'Test message');
    });
  });

  describe('Breadcrumbs', () => {
    beforeEach(() => {
      const mockConfig: SentryConfig = {
        dsn: 'https://test@sentry.io/123',
        environment: 'development'
      };
      sentryService.initialize(mockConfig);
    });

    test('adds breadcrumb with correct structure', () => {
      const message = 'User clicked alarm button';
      const category = 'ui';
      const data = { alarmId: 'alarm-123', action: 'click' };
      
      sentryService.addBreadcrumb(message, category, data);
      
      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        message,
        category,
        level: 'info',
        timestamp: expect.any(Number),
        data
      });
    });

    test('uses default category when not specified', () => {
      sentryService.addBreadcrumb('Default category test');
      
      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'user'
        })
      );
    });

    test('does not add breadcrumb when not initialized', () => {
      const uninitializedService = new (SentryService as any)();
      uninitializedService.addBreadcrumb('Test breadcrumb');
      
      expect(mockSentry.addBreadcrumb).not.toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(() => {
      const mockConfig: SentryConfig = {
        dsn: 'https://test@sentry.io/123',
        environment: 'development'
      };
      sentryService.initialize(mockConfig);
    });

    test('starts transaction correctly', () => {
      const transaction = sentryService.startTransaction('alarm-creation', 'task');
      
      expect(mockSentry.startTransaction).toHaveBeenCalledWith({
        name: 'alarm-creation',
        op: 'task',
        tags: {
          component: 'smart-alarm-app'
        }
      });
      expect(transaction).toBeDefined();
    });

    test('uses default operation when not specified', () => {
      sentryService.startTransaction('page-load');
      
      expect(mockSentry.startTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          op: 'navigation'
        })
      );
    });

    test('finishes transaction correctly', () => {
      const mockTransaction = {
        finish: jest.fn(),
        setTag: jest.fn(),
        setData: jest.fn()
      };
      
      sentryService.finishTransaction(mockTransaction as any);
      
      expect(mockTransaction.finish).toHaveBeenCalled();
    });

    test('handles null transaction gracefully', () => {
      expect(() => {
        sentryService.finishTransaction(null);
      }).not.toThrow();
    });

    test('captures performance metrics as breadcrumbs', () => {
      const name = 'alarm-load-time';
      const duration = 150;
      const metadata = { alarmCount: 5 };
      
      sentryService.capturePerformance(name, duration, metadata);
      
      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Performance: alarm-load-time',
        category: 'performance',
        level: 'info',
        timestamp: expect.any(Number),
        data: {
          duration: 150,
          alarmCount: 5
        }
      });
    });

    test('returns null when starting transaction without initialization', () => {
      const uninitializedService = new (SentryService as any)();
      const transaction = uninitializedService.startTransaction('test');
      
      expect(transaction).toBeNull();
      expect(mockSentry.startTransaction).not.toHaveBeenCalled();
    });
  });

  describe('Event Sanitization', () => {
    beforeEach(() => {
      const mockConfig: SentryConfig = {
        dsn: 'https://test@sentry.io/123',
        environment: 'development'
      };
      sentryService.initialize(mockConfig);
    });

    test('sanitizes sensitive headers from request data', () => {
      // Get the beforeSend function from Sentry.init
      const sentryInitCall = mockSentry.init.mock.calls[0][0];
      const beforeSendFunction = sentryInitCall.beforeSend;
      
      const eventWithSensitiveData = {
        request: {
          headers: {
            'Authorization': 'Bearer secret-token',
            'Cookie': 'session=abc123',
            'X-API-Key': 'api-key-secret',
            'Content-Type': 'application/json'
          }
        }
      };
      
      const sanitizedEvent = beforeSendFunction(eventWithSensitiveData, {});
      
      expect(sanitizedEvent.request.headers).toEqual({
        'Content-Type': 'application/json'
      });
    });

    test('sanitizes sensitive query parameters', () => {
      const sentryInitCall = mockSentry.init.mock.calls[0][0];
      const beforeSendFunction = sentryInitCall.beforeSend;
      
      const eventWithSensitiveQuery = {
        request: {
          query_string: 'user=john&token=secret123&key=apikey456&normal=value'
        }
      };
      
      const sanitizedEvent = beforeSendFunction(eventWithSensitiveQuery, {});
      
      expect(sanitizedEvent.request.query_string).toBe('user=john&token=***&key=***&normal=value');
    });

    test('sanitizes sensitive extra data', () => {
      const sentryInitCall = mockSentry.init.mock.calls[0][0];
      const beforeSendFunction = sentryInitCall.beforeSend;
      
      const eventWithSensitiveExtra = {
        extra: {
          userPassword: 'secret123',
          apiToken: 'token456',
          normalData: 'safe-value',
          authHeader: 'Bearer xyz'
        }
      };
      
      const sanitizedEvent = beforeSendFunction(eventWithSensitiveExtra, {});
      
      expect(sanitizedEvent.extra).toEqual({
        userPassword: '***',
        apiToken: '***',
        normalData: 'safe-value',
        authHeader: '***'
      });
    });

    test('filters events in development mode when debug is off', () => {
      const configWithoutDebug: SentryConfig = {
        dsn: 'https://test@sentry.io/123',
        environment: 'development',
        debug: false
      };
      
      // Reset and reinitialize with debug off
      (SentryService as any).instance = null;
      const newService = SentryService.getInstance();
      newService.initialize(configWithoutDebug);
      
      const sentryInitCall = mockSentry.init.mock.calls[1][0];
      const beforeSendFunction = sentryInitCall.beforeSend;
      
      const mockEvent = { message: 'test event' };
      const result = beforeSendFunction(mockEvent, {});
      
      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith('Sentry event (dev mode):', mockEvent);
    });
  });

  describe('Function Wrapping', () => {
    beforeEach(() => {
      const mockConfig: SentryConfig = {
        dsn: 'https://test@sentry.io/123',
        environment: 'development'
      };
      sentryService.initialize(mockConfig);
    });

    test('wraps function with Sentry error handling', () => {
      const testFunction = jest.fn();
      const context: ErrorContext = { component: 'TestComponent' };
      
      const wrappedFunction = sentryService.wrap(testFunction, context);
      
      expect(mockSentry.withScope).toHaveBeenCalled();
      expect(mockSentry.wrap).toHaveBeenCalledWith(testFunction);
    });

    test('returns original function when not initialized', () => {
      const uninitializedService = new (SentryService as any)();
      const testFunction = jest.fn();
      
      const wrappedFunction = uninitializedService.wrap(testFunction);
      
      expect(wrappedFunction).toBe(testFunction);
      expect(mockSentry.wrap).not.toHaveBeenCalled();
    });
  });

  describe('Error Boundary', () => {
    beforeEach(() => {
      const mockConfig: SentryConfig = {
        dsn: 'https://test@sentry.io/123',
        environment: 'development'
      };
      sentryService.initialize(mockConfig);
    });

    test('creates error boundary using Sentry withErrorBoundary', () => {
      const mockFallback = jest.fn();
      const errorBoundary = sentryService.createErrorBoundary(mockFallback);
      
      expect(errorBoundary).toBe(mockSentry.withErrorBoundary);
    });
  });

  describe('Configuration Management', () => {
    test('returns current configuration', () => {
      const mockConfig: SentryConfig = {
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
        debug: false
      };
      
      sentryService.initialize(mockConfig);
      
      const config = sentryService.getConfig();
      expect(config).toEqual(mockConfig);
    });

    test('returns null when not initialized', () => {
      const uninitializedService = new (SentryService as any)();
      expect(uninitializedService.getConfig()).toBeNull();
    });
  });

  describe('Default Configurations', () => {
    test('provides correct default configurations for all environments', () => {
      expect(defaultSentryConfigs.development).toEqual({
        dsn: process.env.REACT_APP_SENTRY_DSN || '',
        environment: 'development',
        debug: true,
        enableTracing: true,
        tracesSampleRate: 1.0
      });

      expect(defaultSentryConfigs.staging).toEqual({
        dsn: process.env.REACT_APP_SENTRY_DSN || '',
        environment: 'staging',
        debug: false,
        enableTracing: true,
        tracesSampleRate: 0.5
      });

      expect(defaultSentryConfigs.production).toEqual({
        dsn: process.env.REACT_APP_SENTRY_DSN || '',
        environment: 'production',
        debug: false,
        enableTracing: true,
        tracesSampleRate: 0.1
      });
    });
  });
});