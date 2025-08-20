// Stripe Configuration
import { config } from './environment';

export interface StripeConfig {
  publishableKey: string;
  secretKey?: string;
  webhookSecret?: string;
  enabled: boolean;
  currency: string;
  successUrl: string;
  cancelUrl: string;
}

// Create Stripe configuration
export const stripeConfig: StripeConfig = {
  publishableKey: config.payments.stripe.publishableKey,
  secretKey: config.payments.stripe.secretKey,
  webhookSecret: config.payments.stripe.webhookSecret,
  enabled: config.payments.stripe.enabled,
  currency: import.meta.env.VITE_PAYMENT_CURRENCY || 'usd',
  successUrl: import.meta.env.VITE_PAYMENT_SUCCESS_URL || '/payment/success',
  cancelUrl: import.meta.env.VITE_PAYMENT_CANCEL_URL || '/payment/cancel',
};

// Subscription plans configuration
export const subscriptionPlans = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Basic alarm functionality',
      'Up to 3 alarms',
      'Standard wake-up sounds',
      'Basic statistics',
    ],
    limits: {
      maxAlarms: 3,
      maxCustomSounds: 0,
      aiInsightsPerDay: 3,
      battlesPerDay: 5,
    },
  },
  basic: {
    name: 'Basic',
    price: 4.99,
    priceId: 'price_basic_monthly', // Replace with actual Stripe price ID
    features: [
      'Unlimited alarms',
      'Custom sound uploads (up to 50MB)',
      'Voice-controlled snooze',
      'Social features (team joining)',
      'Email support',
    ],
    limits: {
      maxAlarms: null, // unlimited
      maxCustomSounds: 10,
      aiInsightsPerDay: 20,
      battlesPerDay: 50,
    },
  },
  premium: {
    name: 'Premium',
    price: 9.99,
    priceId: 'price_premium_monthly', // Replace with actual Stripe price ID
    popular: true,
    features: [
      'All Basic features',
      'Smart wake-up optimization',
      'Advanced scheduling patterns',
      'Voice command recognition',
      'Premium analytics dashboard',
      'Team creation and management',
      'Location-based alarms',
      'Priority support',
    ],
    limits: {
      maxAlarms: null,
      maxCustomSounds: 50,
      aiInsightsPerDay: 100,
      battlesPerDay: null,
      elevenlabsCallsPerMonth: 100,
    },
  },
  pro: {
    name: 'Pro',
    price: 19.99,
    priceId: 'price_pro_monthly', // Replace with actual Stripe price ID
    features: [
      'All Premium features',
      'AI wake-up coach',
      'Enhanced battle modes with tournaments',
      'Advanced voice features',
      'Custom challenge creation',
      'Detailed reporting and exports',
      'White-label options',
      'Dedicated support',
    ],
    limits: {
      maxAlarms: null,
      maxCustomSounds: null,
      aiInsightsPerDay: null,
      battlesPerDay: null,
      elevenlabsCallsPerMonth: 500,
      voiceCloning: true,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: null, // Custom pricing
    priceId: 'price_enterprise_monthly', // Replace with actual Stripe price ID
    features: [
      'All Pro features',
      'Multi-team management',
      'Advanced admin controls',
      'Custom integrations',
      'SLA guarantee',
      'Account manager',
    ],
    limits: {
      maxAlarms: null,
      maxCustomSounds: null,
      aiInsightsPerDay: null,
      battlesPerDay: null,
      elevenlabsCallsPerMonth: null,
      voiceCloning: true,
      customIntegrations: true,
    },
  },
} as const;

export type SubscriptionTier = keyof typeof subscriptionPlans;

// Helper functions
export function getStripePublishableKey(): string {
  if (!stripeConfig.publishableKey) {
    console.warn(
      'Stripe publishable key not configured. Payment functionality will be disabled.'
    );
    return '';
  }
  return stripeConfig.publishableKey;
}

export function isStripeEnabled(): boolean {
  return stripeConfig.enabled && !!stripeConfig.publishableKey;
}

export function getPlanByTier(tier: SubscriptionTier) {
  return subscriptionPlans[tier];
}

export function getAllPlans() {
  return Object.entries(subscriptionPlans).map(([tier, plan]) => ({
    tier: tier as SubscriptionTier,
    ...plan,
  }));
}

export function validateStripeConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (stripeConfig.enabled) {
    if (!stripeConfig.publishableKey) {
      errors.push('Stripe publishable key is required when Stripe is enabled');
    }

    if (!stripeConfig.publishableKey.startsWith('pk_')) {
      errors.push('Invalid Stripe publishable key format');
    }

    // Server-side validation (only if we have access to server environment)
    if (typeof window === 'undefined') {
      // Server-side
      if (!stripeConfig.secretKey) {
        errors.push('Stripe secret key is required for server-side operations');
      }

      if (stripeConfig.secretKey && !stripeConfig.secretKey.startsWith('sk_')) {
        errors.push('Invalid Stripe secret key format');
      }

      if (!stripeConfig.webhookSecret) {
        errors.push('Stripe webhook secret is required for webhook processing');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Development helpers
export function logStripeConfig(): void {
  if (config.features.debugMode) {
    console.group('💳 Stripe Configuration');
    console.log('Enabled:', stripeConfig.enabled);
    console.log(
      'Publishable Key:',
      stripeConfig.publishableKey
        ? `${stripeConfig.publishableKey.substring(0, 12)}...`
        : 'Not configured'
    );
    console.log('Currency:', stripeConfig.currency);
    console.log('Success URL:', stripeConfig.successUrl);
    console.log('Cancel URL:', stripeConfig.cancelUrl);
    console.log('Available Plans:', Object.keys(subscriptionPlans));
    console.groupEnd();
  }
}

export default stripeConfig;
