// Stripe Webhook Configuration for Relife Alarm App
// Configuration constants and setup utilities for webhook processing

export const WEBHOOK_EVENTS = [
  // Subscription lifecycle events
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',

  // Invoice and payment events
  'invoice.created',
  'invoice.finalized', 
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'invoice.upcoming',

  // Payment intent events
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.requires_action',

  // Payment method events
  'payment_method.attached',
  'payment_method.detached',
  'setup_intent.succeeded',

  // Customer events
  'customer.created',
  'customer.updated',
  'customer.deleted',
  'customer.source.created',
  'customer.source.updated',
  'customer.source.deleted',

  // Discount and coupon events
  'coupon.created',
  'coupon.updated',
  'coupon.deleted',
  'customer.discount.created',
  'customer.discount.updated',
  'customer.discount.deleted',

  // Dispute and chargeback events
  'charge.dispute.created',
  'charge.dispute.updated',

  // Account and capability events (for Connect if needed)
  'account.updated',
  'capability.updated'
] as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[number];

// Webhook endpoint configuration
export const WEBHOOK_CONFIG = {
  // Maximum number of retry attempts
  maxRetries: 3,
  
  // Webhook signature tolerance (seconds)
  tolerance: 300, // 5 minutes
  
  // Events that should be processed immediately (high priority)
  highPriorityEvents: [
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'customer.subscription.deleted'
  ],
  
  // Events that can be processed with delay (low priority)
  lowPriorityEvents: [
    'customer.updated',
    'invoice.created'
  ],
  
  // Timeout for webhook processing (milliseconds)
  processingTimeout: 30000, // 30 seconds
  
  // Batch processing configuration
  batchProcessing: {
    enabled: false, // Enable for high-volume scenarios
    batchSize: 10,
    batchTimeout: 5000 // 5 seconds
  }
};

// Webhook security configuration
export const SECURITY_CONFIG = {
  // Required headers
  requiredHeaders: [
    'stripe-signature'
  ],
  
  // Allowed content types
  allowedContentTypes: [
    'application/json',
    'application/json; charset=utf-8'
  ],
  
  // Rate limiting (requests per minute)
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 1000 // Max 1000 webhooks per minute
  },
  
  // IP whitelist (Stripe's webhook IPs)
  ipWhitelist: [
    '54.187.174.169',
    '54.187.205.235', 
    '54.187.216.72',
    '54.241.31.99',
    '54.241.31.102',
    '54.241.34.107'
  ]
};

// Environment configuration
export interface WebhookEnvironmentConfig {
  stripeSecretKey: string;
  webhookSecret: string;
  databaseUrl: string;
  environment: 'development' | 'staging' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics: boolean;
  enableRetries: boolean;
}

export function getWebhookEnvironmentConfig(): WebhookEnvironmentConfig {
  return {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    databaseUrl: process.env.SUPABASE_URL || '',
    environment: (process.env.NODE_ENV as any) || 'development',
    logLevel: (process.env.WEBHOOK_LOG_LEVEL as any) || 'info',
    enableMetrics: process.env.ENABLE_WEBHOOK_METRICS === 'true',
    enableRetries: process.env.ENABLE_WEBHOOK_RETRIES !== 'false'
  };
}

// Webhook monitoring and alerting configuration
export const MONITORING_CONFIG = {
  // Alert thresholds
  alertThresholds: {
    errorRate: 0.05, // Alert if error rate exceeds 5%
    processingTime: 10000, // Alert if processing takes more than 10 seconds
    queueSize: 1000 // Alert if queue size exceeds 1000
  },
  
  // Metrics to track
  metrics: [
    'webhook_events_processed',
    'webhook_processing_time',
    'webhook_errors',
    'webhook_retries'
  ],
  
  // Health check configuration
  healthCheck: {
    enabled: true,
    interval: 60000, // 1 minute
    timeout: 5000 // 5 seconds
  }
};

// Webhook retry configuration
export const RETRY_CONFIG = {
  // Exponential backoff settings
  backoff: {
    initialDelay: 1000, // 1 second
    maxDelay: 300000, // 5 minutes
    multiplier: 2,
    jitter: true
  },
  
  // Events that should not be retried
  nonRetryableEvents: [
    'customer.deleted' // Don't retry if customer is already deleted
  ],
  
  // Error codes that should trigger immediate retry
  retryableErrors: [
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'EAI_AGAIN'
  ],
  
  // Error codes that should not be retried
  nonRetryableErrors: [
    'INVALID_SIGNATURE',
    'EVENT_TOO_OLD'
  ]
};

// Development and testing helpers
export const DEVELOPMENT_CONFIG = {
  // Mock webhook events for testing
  mockEvents: {
    subscriptionCreated: {
      id: 'evt_test_webhook',
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test',
          customer: 'cus_test',
          status: 'active',
          items: {
            data: [{
              price: {
                id: 'price_test',
                unit_amount: 999,
                currency: 'usd',
                recurring: { interval: 'month' }
              }
            }]
          }
        }
      }
    }
  },
  
  // Testing utilities
  enableTestMode: process.env.STRIPE_TEST_MODE === 'true',
  
  // Debug logging
  verboseLogging: process.env.WEBHOOK_VERBOSE_LOGGING === 'true'
};

// Webhook endpoint validation
export function validateWebhookConfig(config: Partial<WebhookEnvironmentConfig>): string[] {
  const errors: string[] = [];
  
  if (!config.stripeSecretKey) {
    errors.push('STRIPE_SECRET_KEY is required');
  }
  
  if (!config.webhookSecret) {
    errors.push('STRIPE_WEBHOOK_SECRET is required');
  }
  
  if (!config.databaseUrl) {
    errors.push('SUPABASE_URL is required');
  }
  
  if (config.stripeSecretKey && !config.stripeSecretKey.startsWith('sk_')) {
    errors.push('STRIPE_SECRET_KEY must start with "sk_"');
  }
  
  if (config.webhookSecret && !config.webhookSecret.startsWith('whsec_')) {
    errors.push('STRIPE_WEBHOOK_SECRET must start with "whsec_"');
  }
  
  return errors;
}

// Setup instructions for different environments
export const SETUP_INSTRUCTIONS = {
  stripe: {
    webhookUrl: 'https://your-app.com/api/webhooks/stripe',
    events: WEBHOOK_EVENTS,
    description: 'Relife Alarm App - Subscription Management'
  },
  
  environments: {
    development: {
      webhookUrl: 'https://localhost:3000/api/webhooks/stripe',
      ngrokSetup: 'Use ngrok for local testing: ngrok http 3000'
    },
    
    staging: {
      webhookUrl: 'https://staging.your-app.com/api/webhooks/stripe'
    },
    
    production: {
      webhookUrl: 'https://your-app.com/api/webhooks/stripe'
    }
  }
};

export default {
  WEBHOOK_EVENTS,
  WEBHOOK_CONFIG,
  SECURITY_CONFIG,
  MONITORING_CONFIG,
  RETRY_CONFIG,
  DEVELOPMENT_CONFIG,
  getWebhookEnvironmentConfig,
  validateWebhookConfig,
  SETUP_INSTRUCTIONS
};