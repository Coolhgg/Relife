// Analytics Configuration and Initialization Service
// Manages setup and initialization of Sentry and PostHog based on environment

import SentryService, { defaultSentryConfigs } from './sentry';
import AnalyticsService, { defaultAnalyticsConfigs } from './analytics';

export interface AnalyticsEnvironmentConfig {
  environment: 'development' | 'staging' | 'production';
  enableSentry: boolean;
  enableAnalytics: boolean;
  enableDebugMode: boolean;
  privacyMode: boolean;
}

export interface InitializationStatus {
  sentry: {
    initialized: boolean;
    error?: string;
  };
  analytics: {
    initialized: boolean;
    error?: string;
  };
  timestamp: string;
}

class AnalyticsConfigService {
  private static instance: AnalyticsConfigService;
  private initializationStatus: InitializationStatus;
  private config: AnalyticsEnvironmentConfig | null = null;

  private constructor() {
    this.initializationStatus = {
      sentry: { initialized: false },
      analytics: { initialized: false },
      timestamp: new Date().toISOString(),
    };
  }

  static getInstance(): AnalyticsConfigService {
    if (!AnalyticsConfigService.instance) {
      AnalyticsConfigService.instance = new AnalyticsConfigService();
    }
    return AnalyticsConfigService.instance;
  }

  /**
   * Initialize analytics services based on environment
   */
  async initialize(
    config?: Partial<AnalyticsEnvironmentConfig>
  ): Promise<InitializationStatus> {
    // Determine environment
    const environment = this.getEnvironment();

    // Merge with default config
    this.config = {
      environment,
      enableSentry: true,
      enableAnalytics: true,
      enableDebugMode: environment === 'development',
      privacyMode: false,
      ...config,
    };

    console.info('Initializing analytics services for environment:', environment);

    // Initialize Sentry
    if (this.config.enableSentry) {
      try {
        await this.initializeSentry();
        this.initializationStatus.sentry.initialized = true;
        console.info('✅ Sentry initialized successfully');
      } catch (error) {
        this.initializationStatus.sentry.error =
          error instanceof Error ? error.message : String(error);
        console.error('❌ Failed to initialize Sentry:', error);
      }
    } else {
      console.info('🔇 Sentry disabled by configuration');
    }

    // Initialize PostHog Analytics
    if (this.config.enableAnalytics) {
      try {
        await this.initializeAnalytics();
        this.initializationStatus.analytics.initialized = true;
        console.info('✅ Analytics initialized successfully');
      } catch (error) {
        this.initializationStatus.analytics.error =
          error instanceof Error ? error.message : String(error);
        console.error('❌ Failed to initialize Analytics:', error);
      }
    } else {
      console.info('🔇 Analytics disabled by configuration');
    }

    this.initializationStatus.timestamp = new Date().toISOString();

    // Log initialization summary
    this.logInitializationSummary();

    return this.initializationStatus;
  }

  /**
   * Initialize Sentry error tracking
   */
  private async initializeSentry(): Promise<void> {
    const sentryService = SentryService.getInstance();

    // Check if DSN is available
    const dsn = process.env.REACT_APP_SENTRY_DSN;
    if (!dsn) {
      throw new Error('REACT_APP_SENTRY_DSN environment variable is required');
    }

    // Get environment-specific config
    const defaultConfig = defaultSentryConfigs[this.config!.environment];

    // Custom configuration based on privacy and debug settings
    const sentryConfig = {
      ...defaultConfig,
      dsn,
      debug: this.config!.enableDebugMode,
      beforeSend: this.config!.privacyMode ? this.createPrivacyFilter() : undefined,
    };

    sentryService.initialize(sentryConfig);

    // Add initial context
    sentryService.addBreadcrumb('Analytics services initialized', 'system', {
      environment: this.config!.environment,
      privacyMode: this.config!.privacyMode,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Initialize PostHog analytics
   */
  private async initializeAnalytics(): Promise<void> {
    const analyticsService = AnalyticsService.getInstance();

    // Check if API key is available
    const apiKey = process.env.REACT_APP_POSTHOG_KEY;
    if (!apiKey) {
      throw new Error('REACT_APP_POSTHOG_KEY environment variable is required');
    }

    // Get environment-specific config
    const defaultConfig = defaultAnalyticsConfigs[this.config!.environment];

    // Custom configuration based on privacy and debug settings
    const analyticsConfig = {
      ...defaultConfig,
      apiKey,
      debug: this.config!.enableDebugMode,
      enableSessionRecording:
        !this.config!.privacyMode && defaultConfig.enableSessionRecording,
      host: process.env.REACT_APP_POSTHOG_HOST,
    };

    analyticsService.initialize(analyticsConfig);
  }

  /**
   * Set user context across all services
   */
  setUserContext(userId: string, properties: Record<string, unknown> = {}): void {
    const sentryService = SentryService.getInstance();
    const analyticsService = AnalyticsService.getInstance();

    // Enhanced user properties
    const userProperties = {
      id: userId,
      environment: this.config?.environment,
      privacyMode: this.config?.privacyMode,
      timestamp: new Date().toISOString(),
      ...properties,
    };

    // Set in Sentry
    if (this.initializationStatus.sentry.initialized) {
      sentryService.setUser({
        id: userId,
        ...properties,
      } as any);
    }

    // Set in Analytics
    if (this.initializationStatus.analytics.initialized) {
      analyticsService.identify(userId, userProperties as any);
    }

    console.debug('User context set:', {
      userId,
      environment: this.config?.environment,
    });
  }

  /**
   * Clear user context across all services
   */
  clearUserContext(): void {
    const sentryService = SentryService.getInstance();
    const analyticsService = AnalyticsService.getInstance();

    if (this.initializationStatus.sentry.initialized) {
      sentryService.clearUser();
    }

    if (this.initializationStatus.analytics.initialized) {
      analyticsService.reset();
    }

    console.debug('User context cleared');
  }

  /**
   * Get current initialization status
   */
  getStatus(): InitializationStatus {
    return { ...this.initializationStatus };
  }

  /**
   * Check if services are ready for use
   */
  isReady(): boolean {
    return (
      this.initializationStatus.sentry.initialized ||
      this.initializationStatus.analytics.initialized
    );
  }

  /**
   * Get current configuration
   */
  getConfig(): AnalyticsEnvironmentConfig | null {
    return this.config;
  }

  /**
   * Enable/disable privacy mode
   */
  setPrivacyMode(enabled: boolean): void {
    if (this.config) {
      this.config.privacyMode = enabled;

      // Update analytics session recording
      const analyticsService = AnalyticsService.getInstance();
      if (this.initializationStatus.analytics.initialized) {
        analyticsService.toggleSessionRecording(!enabled);
      }

      console.info('Privacy mode', enabled ? 'enabled' : 'disabled');
    }
  }

  /**
   * Update debug mode
   */
  setDebugMode(enabled: boolean): void {
    if (this.config) {
      this.config.enableDebugMode = enabled;
      console.info('Debug mode', enabled ? 'enabled' : 'disabled');
    }
  }

  /**
   * Track initialization metrics
   */
  trackInitializationMetrics(): void {
    const analyticsService = AnalyticsService.getInstance();

    if (this.initializationStatus.analytics.initialized) {
      analyticsService.track('analytics_initialized', {
        sentry_initialized: this.initializationStatus.sentry.initialized,
        analytics_initialized: this.initializationStatus.analytics.initialized,
        environment: this.config?.environment,
        privacy_mode: this.config?.privacyMode,
        debug_mode: this.config?.enableDebugMode,
        initialization_time: this.initializationStatus.timestamp,
        sentry_error: this.initializationStatus.sentry.error,
        analytics_error: this.initializationStatus.analytics.error,
      });
    }
  }

  /**
   * Determine current environment
   */
  private getEnvironment(): 'development' | 'staging' | 'production' {
    // Check explicit environment variable
    const envVar = process.env.REACT_APP_ENVIRONMENT;
    if (envVar && ['development', 'staging', 'production'].includes(envVar)) {
      return envVar as 'development' | 'staging' | 'production';
    }

    // Fall back to NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      return 'production';
    } else if (process.env.NODE_ENV === 'development') {
      return 'development';
    }

    // Default to development for safety
    return 'development';
  }

  /**
   * Create privacy filter for Sentry events
   */
  private createPrivacyFilter() {
    return (event: any) => {
      // In privacy mode, limit data collection
      if (event.user) {
        // Keep only essential user data
        event.user = {
          id: event.user.id, // Only keep user ID
        };
      }

      // Remove request data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
        delete event.request.data;
      }

      // Limit breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.slice(-3); // Keep only last 3
      }

      return event;
    };
  }

  /**
   * Log initialization summary
   */
  private logInitializationSummary(): void {
    const sentryStatus = this.initializationStatus.sentry.initialized ? '✅' : '❌';
    const analyticsStatus = this.initializationStatus.analytics.initialized
      ? '✅'
      : '❌';

    console.group('📊 Analytics Services Initialization Summary');
    console.log(`Environment: ${this.config?.environment}`);
    console.log(
      `Sentry: ${sentryStatus} ${this.initializationStatus.sentry.initialized ? 'Ready' : 'Failed'}`
    );
    console.log(
      `Analytics: ${analyticsStatus} ${this.initializationStatus.analytics.initialized ? 'Ready' : 'Failed'}`
    );
    console.log(`Privacy Mode: ${this.config?.privacyMode ? 'Enabled' : 'Disabled'}`);
    console.log(`Debug Mode: ${this.config?.enableDebugMode ? 'Enabled' : 'Disabled'}`);

    if (this.initializationStatus.sentry.error) {
      console.error('Sentry Error:', this.initializationStatus.sentry.error);
    }

    if (this.initializationStatus.analytics.error) {
      console.error('Analytics Error:', this.initializationStatus.analytics.error);
    }

    console.groupEnd();
  }
}

export default AnalyticsConfigService;
