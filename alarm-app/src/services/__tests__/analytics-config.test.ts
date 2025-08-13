import AnalyticsConfigService, { AnalyticsEnvironmentConfig, InitializationStatus } from '../analytics-config';
import SentryService from '../sentry';
import AnalyticsService from '../analytics';
import { testUtils } from '../../test-setup';

// Mock the service dependencies
jest.mock('../sentry');
jest.mock('../analytics');

describe('AnalyticsConfigService', () => {
  let configService: AnalyticsConfigService;
  let mockSentryService: jest.Mocked<SentryService>;
  let mockAnalyticsService: jest.Mocked<AnalyticsService>;

  beforeEach(() => {
    testUtils.clearAllMocks();
    
    // Reset singleton instance
    (AnalyticsConfigService as any).instance = null;
    configService = AnalyticsConfigService.getInstance();
    
    // Setup mocked services
    mockSentryService = {
      getInstance: jest.fn().mockReturnThis(),
      initialize: jest.fn(),
      addBreadcrumb: jest.fn(),
      setUser: jest.fn(),
      clearUser: jest.fn()
    } as any;
    
    mockAnalyticsService = {
      getInstance: jest.fn().mockReturnThis(),
      initialize: jest.fn(),
      identify: jest.fn(),
      reset: jest.fn(),
      toggleSessionRecording: jest.fn(),
      track: jest.fn()
    } as any;
    
    (SentryService.getInstance as jest.Mock).mockReturnValue(mockSentryService);
    (AnalyticsService.getInstance as jest.Mock).mockReturnValue(mockAnalyticsService);
    
    // Mock environment variables
    process.env.REACT_APP_SENTRY_DSN = 'https://test-dsn@sentry.io/test';
    process.env.REACT_APP_POSTHOG_KEY = 'test-posthog-key';
    process.env.REACT_APP_POSTHOG_HOST = 'https://app.posthog.com';
    process.env.REACT_APP_ENVIRONMENT = 'test';
    
    // Mock console methods
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
    jest.spyOn(console, 'group').mockImplementation();
    jest.spyOn(console, 'groupEnd').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.REACT_APP_SENTRY_DSN;
    delete process.env.REACT_APP_POSTHOG_KEY;
    delete process.env.REACT_APP_POSTHOG_HOST;
    delete process.env.REACT_APP_ENVIRONMENT;
  });

  describe('Singleton Pattern', () => {
    test('returns same instance on multiple calls', () => {
      const instance1 = AnalyticsConfigService.getInstance();
      const instance2 = AnalyticsConfigService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    test('initializes both services successfully with default config', async () => {
      const status = await configService.initialize();
      
      expect(mockSentryService.initialize).toHaveBeenCalledWith({
        environment: 'development',
        debug: true,
        dsn: 'https://test-dsn@sentry.io/test',
        sampleRate: 1.0,
        tracesSampleRate: 1.0,
        enableTracing: true,
        release: undefined,
        beforeSend: undefined
      });
      
      expect(mockAnalyticsService.initialize).toHaveBeenCalledWith({
        apiKey: 'test-posthog-key',
        debug: true,
        enableSessionRecording: true,
        host: 'https://app.posthog.com'
      });
      
      expect(status.sentry.initialized).toBe(true);
      expect(status.analytics.initialized).toBe(true);
      expect(status.timestamp).toBeDefined();
    });

    test('handles custom configuration', async () => {
      const customConfig: Partial<AnalyticsEnvironmentConfig> = {
        environment: 'production',
        enableDebugMode: false,
        privacyMode: true
      };
      
      await configService.initialize(customConfig);
      
      expect(mockSentryService.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          debug: false,
          beforeSend: expect.any(Function)
        })
      );
      
      expect(mockAnalyticsService.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          debug: false,
          enableSessionRecording: false
        })
      );
    });

    test('handles Sentry initialization failure gracefully', async () => {
      mockSentryService.initialize.mockImplementation(() => {
        throw new Error('Sentry DSN invalid');
      });
      
      const status = await configService.initialize();
      
      expect(status.sentry.initialized).toBe(false);
      expect(status.sentry.error).toBe('Sentry DSN invalid');
      expect(status.analytics.initialized).toBe(true);
      expect(console.error).toHaveBeenCalledWith('❌ Failed to initialize Sentry:', expect.any(Error));
    });

    test('handles Analytics initialization failure gracefully', async () => {
      mockAnalyticsService.initialize.mockImplementation(() => {
        throw new Error('PostHog API key invalid');
      });
      
      const status = await configService.initialize();
      
      expect(status.sentry.initialized).toBe(true);
      expect(status.analytics.initialized).toBe(false);
      expect(status.analytics.error).toBe('PostHog API key invalid');
      expect(console.error).toHaveBeenCalledWith('❌ Failed to initialize Analytics:', expect.any(Error));
    });

    test('skips initialization when services are disabled', async () => {
      const config: Partial<AnalyticsEnvironmentConfig> = {
        enableSentry: false,
        enableAnalytics: false
      };
      
      const status = await configService.initialize(config);
      
      expect(mockSentryService.initialize).not.toHaveBeenCalled();
      expect(mockAnalyticsService.initialize).not.toHaveBeenCalled();
      expect(status.sentry.initialized).toBe(false);
      expect(status.analytics.initialized).toBe(false);
      expect(console.info).toHaveBeenCalledWith('🔇 Sentry disabled by configuration');
      expect(console.info).toHaveBeenCalledWith('🔇 Analytics disabled by configuration');
    });

    test('throws error when required environment variables are missing', async () => {
      delete process.env.REACT_APP_SENTRY_DSN;
      delete process.env.REACT_APP_POSTHOG_KEY;
      
      const status = await configService.initialize();
      
      expect(status.sentry.error).toBe('REACT_APP_SENTRY_DSN environment variable is required');
      expect(status.analytics.error).toBe('REACT_APP_POSTHOG_KEY environment variable is required');
    });
  });

  describe('Environment Detection', () => {
    test('uses REACT_APP_ENVIRONMENT when available', async () => {
      process.env.REACT_APP_ENVIRONMENT = 'staging';
      
      await configService.initialize();
      
      const config = configService.getConfig();
      expect(config?.environment).toBe('staging');
    });

    test('falls back to NODE_ENV', async () => {
      delete process.env.REACT_APP_ENVIRONMENT;
      process.env.NODE_ENV = 'production';
      
      await configService.initialize();
      
      const config = configService.getConfig();
      expect(config?.environment).toBe('production');
    });

    test('defaults to development when no environment is set', async () => {
      delete process.env.REACT_APP_ENVIRONMENT;
      process.env.NODE_ENV = 'test';
      
      await configService.initialize();
      
      const config = configService.getConfig();
      expect(config?.environment).toBe('development');
    });
  });

  describe('User Context Management', () => {
    beforeEach(async () => {
      await configService.initialize();
    });

    test('sets user context across all services', () => {
      const userId = 'user-123';
      const properties = { email: 'test@example.com', plan: 'premium' };
      
      configService.setUserContext(userId, properties);
      
      expect(mockSentryService.setUser).toHaveBeenCalledWith({
        id: userId,
        email: 'test@example.com',
        plan: 'premium'
      });
      
      expect(mockAnalyticsService.identify).toHaveBeenCalledWith(userId, {
        id: userId,
        environment: 'development',
        privacyMode: false,
        timestamp: expect.any(String),
        email: 'test@example.com',
        plan: 'premium'
      });
    });

    test('clears user context across all services', () => {
      configService.clearUserContext();
      
      expect(mockSentryService.clearUser).toHaveBeenCalled();
      expect(mockAnalyticsService.reset).toHaveBeenCalled();
      expect(console.debug).toHaveBeenCalledWith('User context cleared');
    });

    test('only calls services that are initialized', () => {
      // Reset and create a new instance with failed analytics
      (AnalyticsConfigService as any).instance = null;
      const newConfigService = AnalyticsConfigService.getInstance();
      
      // Mock analytics service to fail initialization
      mockAnalyticsService.initialize.mockImplementation(() => {
        throw new Error('Init failed');
      });
      
      newConfigService.initialize().then(() => {
        newConfigService.setUserContext('user-123');
        
        expect(mockSentryService.setUser).toHaveBeenCalled();
        expect(mockAnalyticsService.identify).not.toHaveBeenCalled();
      });
    });
  });

  describe('Privacy Mode', () => {
    beforeEach(async () => {
      await configService.initialize();
    });

    test('enables privacy mode and updates services', () => {
      configService.setPrivacyMode(true);
      
      const config = configService.getConfig();
      expect(config?.privacyMode).toBe(true);
      expect(mockAnalyticsService.toggleSessionRecording).toHaveBeenCalledWith(false);
      expect(console.info).toHaveBeenCalledWith('Privacy mode', 'enabled');
    });

    test('disables privacy mode and updates services', () => {
      configService.setPrivacyMode(false);
      
      const config = configService.getConfig();
      expect(config?.privacyMode).toBe(false);
      expect(mockAnalyticsService.toggleSessionRecording).toHaveBeenCalledWith(true);
      expect(console.info).toHaveBeenCalledWith('Privacy mode', 'disabled');
    });

    test('creates privacy filter for Sentry when privacy mode is enabled', async () => {
      await configService.initialize({ privacyMode: true });
      
      expect(mockSentryService.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          beforeSend: expect.any(Function)
        })
      );
    });
  });

  describe('Debug Mode', () => {
    beforeEach(async () => {
      await configService.initialize();
    });

    test('enables debug mode', () => {
      configService.setDebugMode(true);
      
      const config = configService.getConfig();
      expect(config?.enableDebugMode).toBe(true);
      expect(console.info).toHaveBeenCalledWith('Debug mode', 'enabled');
    });

    test('disables debug mode', () => {
      configService.setDebugMode(false);
      
      const config = configService.getConfig();
      expect(config?.enableDebugMode).toBe(false);
      expect(console.info).toHaveBeenCalledWith('Debug mode', 'disabled');
    });
  });

  describe('Status Management', () => {
    test('returns correct initialization status', async () => {
      const status = await configService.initialize();
      const retrievedStatus = configService.getStatus();
      
      expect(retrievedStatus).toEqual(status);
      expect(retrievedStatus.timestamp).toBeDefined();
    });

    test('reports ready when at least one service is initialized', async () => {
      await configService.initialize();
      expect(configService.isReady()).toBe(true);
    });

    test('reports not ready when no services are initialized', async () => {
      mockSentryService.initialize.mockImplementation(() => {
        throw new Error('Failed');
      });
      mockAnalyticsService.initialize.mockImplementation(() => {
        throw new Error('Failed');
      });
      
      await configService.initialize();
      expect(configService.isReady()).toBe(false);
    });
  });

  describe('Initialization Metrics', () => {
    test('tracks initialization metrics when analytics is available', async () => {
      await configService.initialize();
      configService.trackInitializationMetrics();
      
      expect(mockAnalyticsService.track).toHaveBeenCalledWith('analytics_initialized', {
        sentry_initialized: true,
        analytics_initialized: true,
        environment: 'development',
        privacy_mode: false,
        debug_mode: true,
        initialization_time: expect.any(String),
        sentry_error: undefined,
        analytics_error: undefined
      });
    });

    test('does not track metrics when analytics is not initialized', async () => {
      mockAnalyticsService.initialize.mockImplementation(() => {
        throw new Error('Failed');
      });
      
      await configService.initialize();
      configService.trackInitializationMetrics();
      
      expect(mockAnalyticsService.track).not.toHaveBeenCalled();
    });
  });

  describe('Privacy Filter', () => {
    test('filters sensitive data in privacy mode', async () => {
      await configService.initialize({ privacyMode: true });
      
      // Get the privacy filter function
      const initCall = mockSentryService.initialize.mock.calls[0][0];
      const privacyFilter = initCall.beforeSend;
      
      expect(privacyFilter).toBeDefined();
      
      // Test the filter
      const mockEvent = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          ip_address: '192.168.1.1'
        },
        request: {
          cookies: 'session=abc123',
          headers: { 'Authorization': 'Bearer token123' },
          data: 'sensitive data'
        },
        breadcrumbs: [
          { message: 'breadcrumb 1' },
          { message: 'breadcrumb 2' },
          { message: 'breadcrumb 3' },
          { message: 'breadcrumb 4' },
          { message: 'breadcrumb 5' }
        ]
      };
      
      const filteredEvent = privacyFilter(mockEvent);
      
      // Should only keep user ID
      expect(filteredEvent.user).toEqual({ id: 'user-123' });
      
      // Should remove request data
      expect(filteredEvent.request).toBeUndefined();
      
      // Should limit breadcrumbs to last 3
      expect(filteredEvent.breadcrumbs).toHaveLength(3);
      expect(filteredEvent.breadcrumbs[0].message).toBe('breadcrumb 3');
    });
  });

  describe('Configuration Access', () => {
    test('returns current configuration', async () => {
      const customConfig = { environment: 'staging' as const, privacyMode: true };
      await configService.initialize(customConfig);
      
      const config = configService.getConfig();
      
      expect(config).toEqual(expect.objectContaining({
        environment: 'staging',
        privacyMode: true,
        enableSentry: true,
        enableAnalytics: true
      }));
    });

    test('returns null when not initialized', () => {
      const newService = new (AnalyticsConfigService as any)();
      expect(newService.getConfig()).toBeNull();
    });
  });

  describe('Logging and Console Output', () => {
    test('logs initialization summary', async () => {
      await configService.initialize();
      
      expect(console.group).toHaveBeenCalledWith('📊 Analytics Services Initialization Summary');
      expect(console.log).toHaveBeenCalledWith('Environment: development');
      expect(console.log).toHaveBeenCalledWith('Sentry: ✅ Ready');
      expect(console.log).toHaveBeenCalledWith('Analytics: ✅ Ready');
      expect(console.log).toHaveBeenCalledWith('Privacy Mode: Disabled');
      expect(console.log).toHaveBeenCalledWith('Debug Mode: Enabled');
      expect(console.groupEnd).toHaveBeenCalled();
    });

    test('logs errors in initialization summary', async () => {
      mockSentryService.initialize.mockImplementation(() => {
        throw new Error('Sentry failed');
      });
      
      await configService.initialize();
      
      expect(console.error).toHaveBeenCalledWith('Sentry Error:', 'Sentry failed');
    });
  });
});