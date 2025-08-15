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
      timestamp: new Date().toISOString()
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
  async initialize(config?: Partial<AnalyticsEnvironmentConfig>): Promise<InitializationStatus> {
    // Determine environment
    const environment = this.getEnvironment();
    
    // Merge with default config
    this.config = {
      environment,
      enableSentry: true,
      enableAnalytics: true,
      enableDebugMode: environment === 'development',
      privacyMode: false,
      ...config
    };

    console.info('Initializing analytics services for environment:', environment);

    // Initialize Sentry
    if (this.config.enableSentry) {
      try {
        await this.initializeSentry();
        this.initializationStatus.sentry.initialized = true;
        console.info('✅ Sentry initialized successfully');
      } catch (error) {
        this.initializationStatus.sentry.error = error instanceof Error ? error.message : String(error);
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
        this.initializationStatus.analytics.error = error instanceof Error ? error.message : String(error);
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
      beforeSend: this.config!.privacyMode ? this.createPrivacyFilter() : undefined
    };

    sentryService.initialize(sentryConfig);
    
    // Add initial context
    sentryService.addBreadcrumb('Analytics services initialized', 'system', {
      environment: this.config!.environment,
      privacyMode: this.config!.privacyMode,
      timestamp: new Date().toISOString()
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
      enableSessionRecording: !this.config!.privacyMode && defaultConfig.enableSessionRecording,
      host: process.env.REACT_APP_POSTHOG_HOST
    };

    analyticsService.initialize(analyticsConfig);
  }\n\n  /**\n   * Set user context across all services\n   */\n  setUserContext(userId: string, properties: Record<string, unknown> = {}): void {\n    const sentryService = SentryService.getInstance();\n    const analyticsService = AnalyticsService.getInstance();\n\n    // Enhanced user properties\n    const userProperties = {\n      id: userId,\n      environment: this.config?.environment,\n      privacyMode: this.config?.privacyMode,\n      timestamp: new Date().toISOString(),\n      ...properties\n    };\n\n    // Set in Sentry\n    if (this.initializationStatus.sentry.initialized) {\n      sentryService.setUser({\n        id: userId,\n        ...properties\n      } as any);\n    }\n\n    // Set in Analytics\n    if (this.initializationStatus.analytics.initialized) {\n      analyticsService.identify(userId, userProperties as any);\n    }\n\n    console.debug('User context set:', { userId, environment: this.config?.environment });\n  }\n\n  /**\n   * Clear user context across all services\n   */\n  clearUserContext(): void {\n    const sentryService = SentryService.getInstance();\n    const analyticsService = AnalyticsService.getInstance();\n\n    if (this.initializationStatus.sentry.initialized) {\n      sentryService.clearUser();\n    }\n\n    if (this.initializationStatus.analytics.initialized) {\n      analyticsService.reset();\n    }\n\n    console.debug('User context cleared');\n  }\n\n  /**\n   * Get current initialization status\n   */\n  getStatus(): InitializationStatus {\n    return { ...this.initializationStatus };\n  }\n\n  /**\n   * Check if services are ready for use\n   */\n  isReady(): boolean {\n    return this.initializationStatus.sentry.initialized || this.initializationStatus.analytics.initialized;\n  }\n\n  /**\n   * Get current configuration\n   */\n  getConfig(): AnalyticsEnvironmentConfig | null {\n    return this.config;\n  }\n\n  /**\n   * Enable/disable privacy mode\n   */\n  setPrivacyMode(enabled: boolean): void {\n    if (this.config) {\n      this.config.privacyMode = enabled;\n      \n      // Update analytics session recording\n      const analyticsService = AnalyticsService.getInstance();\n      if (this.initializationStatus.analytics.initialized) {\n        analyticsService.toggleSessionRecording(!enabled);\n      }\n      \n      console.info('Privacy mode', enabled ? 'enabled' : 'disabled');\n    }\n  }\n\n  /**\n   * Update debug mode\n   */\n  setDebugMode(enabled: boolean): void {\n    if (this.config) {\n      this.config.enableDebugMode = enabled;\n      console.info('Debug mode', enabled ? 'enabled' : 'disabled');\n    }\n  }\n\n  /**\n   * Track initialization metrics\n   */\n  trackInitializationMetrics(): void {\n    const analyticsService = AnalyticsService.getInstance();\n    \n    if (this.initializationStatus.analytics.initialized) {\n      analyticsService.track('analytics_initialized', {\n        sentry_initialized: this.initializationStatus.sentry.initialized,\n        analytics_initialized: this.initializationStatus.analytics.initialized,\n        environment: this.config?.environment,\n        privacy_mode: this.config?.privacyMode,\n        debug_mode: this.config?.enableDebugMode,\n        initialization_time: this.initializationStatus.timestamp,\n        sentry_error: this.initializationStatus.sentry.error,\n        analytics_error: this.initializationStatus.analytics.error\n      });\n    }\n  }\n\n  /**\n   * Determine current environment\n   */\n  private getEnvironment(): 'development' | 'staging' | 'production' {\n    // Check explicit environment variable\n    const envVar = process.env.REACT_APP_ENVIRONMENT;\n    if (envVar && ['development', 'staging', 'production'].includes(envVar)) {\n      return envVar as 'development' | 'staging' | 'production';\n    }\n\n    // Fall back to NODE_ENV\n    if (process.env.NODE_ENV === 'production') {\n      return 'production';\n    } else if (process.env.NODE_ENV === 'development') {\n      return 'development';\n    }\n\n    // Default to development for safety\n    return 'development';\n  }\n\n  /**\n   * Create privacy filter for Sentry events\n   */\n  private createPrivacyFilter() {\n    return (event: any) => {\n      // In privacy mode, limit data collection\n      if (event.user) {\n        // Keep only essential user data\n        event.user = {\n          id: event.user.id // Only keep user ID\n        };\n      }\n\n      // Remove request data\n      if (event.request) {\n        delete event.request.cookies;\n        delete event.request.headers;\n        delete event.request.data;\n      }\n\n      // Limit breadcrumbs\n      if (event.breadcrumbs) {\n        event.breadcrumbs = event.breadcrumbs.slice(-3); // Keep only last 3\n      }\n\n      return event;\n    };\n  }\n\n  /**\n   * Log initialization summary\n   */\n  private logInitializationSummary(): void {\n    const sentryStatus = this.initializationStatus.sentry.initialized ? '✅' : '❌';\n    const analyticsStatus = this.initializationStatus.analytics.initialized ? '✅' : '❌';\n    \n    console.group('📊 Analytics Services Initialization Summary');\n    console.log(`Environment: ${this.config?.environment}`);\n    console.log(`Sentry: ${sentryStatus} ${this.initializationStatus.sentry.initialized ? 'Ready' : 'Failed'}`);\n    console.log(`Analytics: ${analyticsStatus} ${this.initializationStatus.analytics.initialized ? 'Ready' : 'Failed'}`);\n    console.log(`Privacy Mode: ${this.config?.privacyMode ? 'Enabled' : 'Disabled'}`);\n    console.log(`Debug Mode: ${this.config?.enableDebugMode ? 'Enabled' : 'Disabled'}`);\n    \n    if (this.initializationStatus.sentry.error) {\n      console.error('Sentry Error:', this.initializationStatus.sentry.error);\n    }\n    \n    if (this.initializationStatus.analytics.error) {\n      console.error('Analytics Error:', this.initializationStatus.analytics.error);\n    }\n    \n    console.groupEnd();\n  }\n}\n\nexport default AnalyticsConfigService;