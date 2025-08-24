// Subscription-specific Type Definitions
// Additional types for subscription service to complement premium.ts

// Database row types for mapping functions
export interface SubscriptionPlanDbRow {
  id: string;
  tier: string;
  name: string;
  display_name: string;
  description: string;
  tagline?: string;
  features: any[] | null;
  limits: Record<string, any> | null;
  pricing: Record<string, any> | null;
  stripe_price_id_monthly?: string;
  stripe_product_id?: string;
  is_popular?: boolean;
  is_recommended?: boolean;
  sort_order?: number;
  is_active?: boolean;
  trial_days?: number;
  setup_fee?: number;
  discount_eligible?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrialDbRow {
  id: string;
  user_id: string;
  plan_id: string;
  tier: string;
  start_date: string;
  end_date: string;
  status: string;
  converted_to_subscription_id?: string;
  reminders_sent?: number;
  created_at: string;
  updated_at: string;
}

export interface DiscountDbRow {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  currency?: string;
  applicable_tiers?: string[];
  applicable_plans?: string[];
  min_amount?: number;
  max_uses?: number;
  current_uses?: number;
  max_uses_per_customer?: number;
  valid_from: string;
  valid_until?: string;
  first_time_buyers?: boolean;
  stackable?: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

// Retention offer type to replace 'any'
export interface RetentionOffer {
  id: string;
  type: 'discount' | 'free_months' | 'upgrade' | 'feature_unlock';
  title: string;
  description: string;
  discountPercentage?: number;
  freeMonths?: number;
  features?: string[];
  validUntil: Date;
  acceptUrl: string;
  declineUrl: string;
  metadata?: Record<string, any>;
}

// Enhanced response types with proper typing
export interface CreateSubscriptionResult {
  success: boolean;
  subscription?: import('./premium').Subscription;
  _error?: import('./premium').SubscriptionError;
  clientSecret?: string;
}

export interface UpdateSubscriptionResult {
  success: boolean;
  subscription?: import('./premium').Subscription;
  _error?: import('./premium').SubscriptionError;
}

export interface CancelSubscriptionResult {
  success: boolean;
  subscription?: import('./premium').Subscription;
  _error?: import('./premium').SubscriptionError;
  retentionOffer?: RetentionOffer;
}

// Validation result types
export interface DiscountValidationResult {
  valid: boolean;
  discount?: import('./premium').Discount;
  _error?: string;
}

export interface TrialStartResult {
  success: boolean;
  trial?: import('./premium').Trial;
  _error?: string;
}

// Feature usage tracking types
export interface FeatureUsageParams {
  p_user_id: string;
  p_feature: string;
  p_usage_amount: number;
  p_reset_date: string;
}

export interface DiscountUsageParams {
  p_user_id: string;
  p_discount_code: string;
}

// Database query result types
export interface FeatureUsageDbRow {
  id: string;
  user_id: string;
  feature: string;
  usage_count: number;
  limit_count?: number;
  reset_date: string;
  created_at: string;
  updated_at: string;
}

export interface UserDiscountDbRow {
  id: string;
  user_id: string;
  discount_id: string;
  used_count: number;
  first_used_at?: string;
  last_used_at?: string;
  created_at: string;
  discounts: DiscountDbRow; // For joined queries
}

export interface ReferralDbRow {
  id: string;
  referrer_id: string;
  referee_id?: string;
  status: 'pending' | 'converted' | 'rewarded';
  created_at: string;
  updated_at: string;
}

// Service configuration types
export interface FreeTierLimits {
  maxAlarms: number;
  maxBattles: number;
  maxCustomSounds: number;
  maxVoiceProfiles: number;
  maxThemes: number;
  supportTier: 'community' | 'email' | 'priority' | 'dedicated';
  advancedAnalytics: boolean;
}

// Referral statistics type
export interface ReferralStats {
  code: string;
  referrals: number;
  rewards: number;
  pendingRewards: number;
}

// Extended interfaces for better type safety
export interface EnhancedBillingUsage extends Record<string, unknown> {
  usage: {
    [feature: string]: {
      used: number;
      limit: number;
      percentage: number;
      resetDate?: Date;
    };
  };
}

// Type guards for runtime type checking
export declare function isValidSubscriptionTier(tier: string): boolean;
export declare function isValidSubscriptionStatus(status: string): boolean;
