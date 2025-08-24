// Environment Configuration Management
// Centralized configuration for different deployment environments

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  // App Configuration
  env: Environment;
  version: string;
  buildTime: string;
  domain: string;
  apiBaseUrl: string;
  cdnUrl?: string;

  // Database
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };

  // Analytics & Monitoring
  analytics: {
    posthog: {
      apiKey: string;
      host: string;
    };
    sentry: {
      dsn: string;
      environment: string;
      org?: string;
      project?: string;
    };
    amplitude?: {
      apiKey: string;
    };
    datadog?: {
      clientToken: string;
      applicationId?: string;
    };
    newRelic?: {
      accountId: string;
      licenseKey?: string;
    };
  };

  // Performance Monitoring
  performance: {
    enabled: boolean;
    endpoint: string;
    analyticsEndpoint: string;
    thresholds: {
      lcp: number; // Largest Contentful Paint (ms)
      fid: number; // First Input Delay (ms)
      cls: number; // Cumulative Layout Shift
      memory: number; // Memory usage (MB)
    };
    healthCheck: {
      interval: TimeoutHandle;
      uptimeBotKey?: string;
    };
  };

  // Feature Flags
  features: {
    sessionRecording: boolean;
    heatmaps: boolean;
    debugMode: boolean;
    offlineSupport: boolean;
    voiceSynthesis: boolean;
    rateLimit: boolean;
  };

  // Payments & Stripe
  payments: {
    stripe: {
      publishableKey: string;
      secretKey?: string; // Server-side only
      webhookSecret?: string; // Server-side only
      enabled: boolean;
    };
  };

  // Security
  security: {
    enableHttps: boolean;
    csrfToken?: string;
    vapidPublicKey?: string;
  };

  // Build Configuration
  build: {
    analyze: boolean;
    sourcemaps: boolean;
    minify: boolean;
    target: string;
  };
}

// Get current environment
export function getEnvironment(): Environment {
  const env = import.meta.env.VITE_APP_ENV || import.meta.env.NODE_ENV;

  if (env === 'production' || env === 'staging') {
    return env as Environment;
  }

  return 'development';
}

// Create environment configuration
export function createEnvironmentConfig(): EnvironmentConfig {
  const env = getEnvironment();
  const isDevelopment = env === 'development';
  const isStaging = env === 'staging';
  const isProduction = env === 'production';

  return {
    env,
    version: import.meta.env.VITE_APP_VERSION || '2.0.0',
    buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
    domain: import.meta.env.VITE_APP_DOMAIN || 'localhost:3000',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
    cdnUrl: import.meta.env.VITE_CDN_URL || undefined,

    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || undefined,
    },

    analytics: {
      posthog: {
        apiKey: import.meta.env.VITE_POSTHOG_KEY || '',
        host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
      },
      sentry: {
        dsn: import.meta.env.VITE_SENTRY_DSN || '',
        environment: env,
        org: import.meta.env.VITE_SENTRY_ORG || undefined,
        project: import.meta.env.VITE_SENTRY_PROJECT || undefined,
      },
      amplitude: import.meta.env.VITE_AMPLITUDE_API_KEY
        ? {
            apiKey: import.meta.env.VITE_AMPLITUDE_API_KEY,
          }
        : undefined,
      datadog: import.meta.env.VITE_DATADOG_CLIENT_TOKEN
        ? {
            clientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN,
            applicationId: import.meta.env.VITE_DATADOG_APP_ID || undefined,
          }
        : undefined,
      newRelic: import.meta.env.VITE_NEW_RELIC_ACCOUNT_ID
        ? {
            accountId: import.meta.env.VITE_NEW_RELIC_ACCOUNT_ID,
            licenseKey: import.meta.env.VITE_NEW_RELIC_LICENSE_KEY || undefined,
          }
        : undefined,
    },

    performance: {
      enabled: import.meta.env.VITE_PERFORMANCE_MONITORING === 'true',
      endpoint: import.meta.env.VITE_PERFORMANCE_ENDPOINT || '/api/performance',
      analyticsEndpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT || '/api/analytics',
      thresholds: {
        lcp: parseInt(import.meta.env.VITE_PERFORMANCE_LCP_THRESHOLD || '2500'),
        fid: parseInt(import.meta.env.VITE_PERFORMANCE_FID_THRESHOLD || '100'),
        cls: parseFloat(import.meta.env.VITE_PERFORMANCE_CLS_THRESHOLD || '0.1'),
        memory: parseInt(import.meta.env.VITE_PERFORMANCE_MEMORY_THRESHOLD || '50'),
      },
      healthCheck: {
        interval: parseInt(import.meta.env.VITE_HEALTH_CHECK_INTERVAL || '60000'),
        uptimeBotKey: import.meta.env.VITE_UPTIME_ROBOT_KEY || undefined,
      },
    },

    features: {
      sessionRecording: import.meta.env.VITE_ENABLE_SESSION_RECORDING === 'true',
      heatmaps: import.meta.env.VITE_ENABLE_HEATMAPS !== 'false', // Default true
      debugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true' || isDevelopment,
      offlineSupport: import.meta.env.VITE_ENABLE_OFFLINE_SUPPORT !== 'false', // Default true
      voiceSynthesis: import.meta.env.VITE_ENABLE_VOICE_SYNTHESIS !== 'false', // Default true
      rateLimit: import.meta.env.VITE_RATE_LIMIT_ENABLED === 'true' || !isDevelopment,
    },

    payments: {
      stripe: {
        publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
        secretKey: import.meta.env.STRIPE_SECRET_KEY || undefined, // Server-side only
        webhookSecret: import.meta.env.STRIPE_WEBHOOK_SECRET || undefined, // Server-side only
        enabled: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
      },
    },

    security: {
      enableHttps: import.meta.env.VITE_ENABLE_HTTPS === 'true' || !isDevelopment,
      csrfToken: import.meta.env.VITE_CSRF_TOKEN || undefined,
      vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || undefined,
    },

    build: {
      analyze: import.meta.env.VITE_BUILD_ANALYZE === 'true',
      sourcemaps: import.meta.env.VITE_BUILD_SOURCEMAPS === 'true' || isDevelopment,
      minify: import.meta.env.VITE_BUILD_MINIFY !== 'false', // Default true
      target: import.meta.env.VITE_BUILD_TARGET || 'es2020',
    },
  };
}

// Export singleton configuration
export const config = createEnvironmentConfig();

// Environment-specific utilities
export const isEnvironment = {
  development: config.env === 'development',
  staging: config.env === 'staging',
  production: config.env === 'production',

  // Convenience checks
  isDev: config.env === 'development',
  isProd: config.env === 'production',
  isNotProd: config.env !== 'production',
};

// Debugging helpers
export function logEnvironmentInfo(): void {
  if (config.features.debugMode) {
    console.group('🌍 Environment Configuration');
    console.log('Environment:', config.env);
    console.log('Version:', config.version);
    console.log('Build Time:', config.buildTime);
    console.log('Domain:', config.domain);
    console.log('API URL:', config.apiBaseUrl);
    console.log('CDN URL:', config.cdnUrl || 'Not configured');
    console.log('Features:', config.features);
    console.log('Performance Monitoring:', config.performance.enabled);
    console.groupEnd();
  }
}

// Validate configuration
export function validateEnvironmentConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!config.supabase.url) {
    errors.push('VITE_SUPABASE_URL is required');
  }

  if (!config.supabase.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }

  // Stripe validation
  if (config.payments.stripe.enabled && !config.payments.stripe.publishableKey) {
    errors.push('VITE_STRIPE_PUBLISHABLE_KEY is required when Stripe is enabled');
  }

  if (config.performance.enabled) {
    if (!config.performance.endpoint) {
      errors.push(
        'VITE_PERFORMANCE_ENDPOINT is required when performance monitoring is enabled'
      );
    }

    if (!config.performance.analyticsEndpoint) {
      errors.push(
        'VITE_ANALYTICS_ENDPOINT is required when performance monitoring is enabled'
      );
    }
  }

  // Analytics configuration
  if (config.analytics.posthog.apiKey && !config.analytics.posthog.host) {
    errors.push('VITE_POSTHOG_HOST is required when PostHog key is provided');
  }

  // Production-specific validation
  if (config.env === 'production') {
    if (!config.security.enableHttps) {
      errors.push('HTTPS should be enabled in production');
    }

    if (!config.analytics.sentry.dsn) {
      errors.push('Sentry DSN should be configured in production');
    }

    if (config.features.debugMode) {
      console.warn('⚠️ Debug mode is enabled in production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Performance configuration helpers
export function getPerformanceThresholds() {
  return config.performance.thresholds;
}

export function isFeatureEnabled(
  feature: keyof EnvironmentConfig['features']
): boolean {
  return config.features[feature];
}

// URL helpers
export function getApiUrl(path: string): string {
  const baseUrl = config.apiBaseUrl.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return `${baseUrl}/${cleanPath}`;
}

export function getCdnUrl(asset: string): string {
  if (!config.cdnUrl) {
    return asset;
  }

  const baseUrl = config.cdnUrl.replace(/\/$/, '');
  const cleanAsset = asset.replace(/^\//, '');
  return `${baseUrl}/${cleanAsset}`;
}

// Export default configuration
export default config;
