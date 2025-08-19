// Premium Subscription Types for Relife Alarm App
// Comprehensive monetization system with subscription tiers, payments, and feature gating

export type SubscriptionTier =
  | "free"
  | "basic"
  | "premium"
  | "pro"
  | "enterprise";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "unpaid"
  | "trialing"
  | "incomplete"
  | "incomplete_expired";
export type BillingInterval = "month" | "year" | "lifetime";
export type PaymentStatus =
  | "succeeded"
  | "pending"
  | "failed"
  | "canceled"
  | "requires_action"
  | "processing";
export type RefundStatus = "pending" | "succeeded" | "failed" | "canceled";

// Core Subscription Interface
export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  amount: number; // in cents
  currency: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// Subscription Plans
export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  displayName: string;
  description: string;
  tagline?: string;
  features: PremiumFeature[];
  limits: PlanLimits;
  pricing: PlanPricing;
  stripePriceId: string;
  stripeProductId: string;
  isPopular?: boolean;
  isRecommended?: boolean;
  sortOrder: number;
  isActive: boolean;
  trialDays?: number;
  setupFee?: number;
  discountEligible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanPricing {
  monthly: {
    amount: number; // in cents
    currency: string;
    stripePriceId: string;
  };
  yearly: {
    amount: number; // in cents
    currency: string;
    stripePriceId: string;
    discountPercentage?: number;
  };
  lifetime?: {
    amount: number; // in cents
    currency: string;
    stripePriceId: string;
  };
}

export interface PlanLimits {
  maxAlarms: number;
  maxBattles: number;
  maxCustomSounds: number;
  maxVoiceProfiles: number;
  maxThemes: number;
  maxTeamMembers: number;
  maxCalendarIntegrations: number;
  maxSmartFeatures: number;
  apiCallsPerMonth: number;
  storageGB: number;
  supportTier: "community" | "email" | "priority" | "dedicated";
  advancedAnalytics: boolean;
  whiteLabel: boolean;
}

// Premium Features
export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  category: PremiumFeatureCategory;
  icon: string;
  requiredTier: SubscriptionTier;
  isCore: boolean; // Core features are always available in the tier
  isAddon?: boolean; // Add-on features can be purchased separately
  addonPrice?: number;
  comingSoon?: boolean;
}

export type PremiumFeatureCategory =
  | "alarms"
  | "battles"
  | "voice"
  | "themes"
  | "integrations"
  | "analytics"
  | "ai"
  | "collaboration"
  | "automation"
  | "customization";

// Payment & Billing
export interface PaymentMethod {
  id: string;
  userId: string;
  stripePaymentMethodId: string;
  type: "card" | "bank_account" | "paypal" | "apple_pay" | "google_pay";
  isDefault: boolean;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    country?: string;
  };
  billingDetails: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId: string;
  stripeInvoiceId: string;
  stripeCustomerId?: string;
  status: PaymentStatus;
  amount: number; // in cents
  tax?: number; // in cents
  total: number; // in cents
  currency: string;
  dueDate: Date;
  paidAt?: Date;
  periodStart: Date;
  periodEnd: Date;
  description?: string;
  downloadUrl?: string;
  receiptUrl?: string;
  items: InvoiceItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number; // in cents
  quantity: number;
  periodStart?: Date;
  periodEnd?: Date;
  planId?: string;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  invoiceId?: string;
  stripePaymentIntentId: string;
  stripeChargeId?: string;
  amount: number; // in cents
  currency: string;
  status: PaymentStatus;
  paymentMethod: string; // payment method type
  description?: string;
  receiptUrl?: string;
  failureReason?: string;
  refunded: boolean;
  refundedAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  userId: string;
  paymentId: string;
  stripeRefundId: string;
  amount: number; // in cents
  currency: string;
  reason:
    | "duplicate"
    | "fraudulent"
    | "requested_by_customer"
    | "expired_uncaptured_charge";
  status: RefundStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Usage & Analytics
export interface FeatureUsage {
  id: string;
  userId: string;
  subscriptionId: string;
  feature: string;
  usageCount: number;
  limitCount: number;
  resetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingUsage {
  userId: string;
  subscriptionId: string;
  period: {
    start: Date;
    end: Date;
  };
  usage: {
    [feature: string]: {
      used: number;
      limit: number;
      percentage: number;
    };
  };
  overageCharges: {
    feature: string;
    units: number;
    unitPrice: number;
    totalCharge: number;
  }[];
  totalOverageAmount: number;
}

// Discounts & Promotions
export interface Discount {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: "percentage" | "fixed" | "trial_extension";
  value: number; // percentage (0-100) or fixed amount in cents
  currency?: string;
  applicableTiers: SubscriptionTier[];
  applicablePlans: string[]; // plan IDs
  minAmount?: number; // minimum purchase amount in cents
  maxUses?: number;
  currentUses: number;
  maxUsesPerCustomer?: number;
  validFrom: Date;
  validUntil?: Date;
  firstTimeBuyers: boolean;
  stackable: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDiscount {
  id: string;
  userId: string;
  discountId: string;
  discount: Discount;
  usedCount: number;
  firstUsedAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
}

// Trials & Free Credits
export interface Trial {
  id: string;
  userId: string;
  planId: string;
  tier: SubscriptionTier;
  startDate: Date;
  endDate: Date;
  status: "active" | "expired" | "converted" | "canceled";
  convertedToSubscriptionId?: string;
  remindersSent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FreeCredit {
  id: string;
  userId: string;
  amount: number; // in cents
  currency: string;
  source: "referral" | "promotion" | "refund" | "bonus" | "compensation";
  description: string;
  remainingAmount: number;
  expiresAt?: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Referrals & Affiliate System
export interface ReferralProgram {
  id: string;
  name: string;
  description: string;
  referrerReward: {
    type: "credit" | "discount" | "free_months";
    value: number;
    currency?: string;
  };
  refereeReward: {
    type: "credit" | "discount" | "free_months" | "trial_extension";
    value: number;
    currency?: string;
  };
  conditions: {
    minSubscriptionTier: SubscriptionTier;
    validForDays: number;
    requiresPayment: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  refereeEmail: string;
  code: string;
  status: "pending" | "signed_up" | "converted" | "rewarded" | "expired";
  signedUpAt?: Date;
  convertedAt?: Date;
  rewardedAt?: Date;
  referrerReward?: string; // reward ID or amount
  refereeReward?: string; // reward ID or amount
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription Management
export interface SubscriptionChange {
  id: string;
  subscriptionId: string;
  userId: string;
  changeType:
    | "upgrade"
    | "downgrade"
    | "cancel"
    | "reactivate"
    | "pause"
    | "resume";
  fromTier: SubscriptionTier;
  toTier: SubscriptionTier;
  fromPlanId: string;
  toPlanId: string;
  prorationAmount?: number; // in cents
  effectiveDate: Date;
  reason?: string;
  appliedBy: "user" | "admin" | "system";
  createdAt: Date;
}

export interface CancellationSurvey {
  id: string;
  userId: string;
  subscriptionId: string;
  primaryReason:
    | "too_expensive"
    | "not_using"
    | "missing_features"
    | "technical_issues"
    | "competitor"
    | "other";
  secondaryReasons: string[];
  feedback: string;
  improvementSuggestions: string;
  likelyToReturn: number; // 1-10 scale
  wouldRecommend: number; // 1-10 scale
  retentionOfferShown: boolean;
  retentionOfferAccepted: boolean;
  createdAt: Date;
}

// Feature Gating & Access Control
export interface FeatureAccess {
  userId: string;
  subscriptionTier: SubscriptionTier;
  features: {
    [featureId: string]: {
      hasAccess: boolean;
      usageLimit?: number;
      usageCount?: number;
      resetDate?: Date;
      upgradeRequired?: SubscriptionTier;
    };
  };
  lastUpdated: Date;
}

export interface FeatureGate {
  featureId: string;
  requiredTier: SubscriptionTier;
  gracePeriodDays?: number; // Allow usage after downgrade for X days
  softLimit?: boolean; // Show warnings but allow usage
  redirectToUpgrade?: string; // URL to redirect for upgrade
  customMessage?: string;
}

// Revenue Analytics
export interface RevenueMetrics {
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalRevenue: number;
    recurringRevenue: number; // MRR or ARR
    newRevenue: number;
    churnRevenue: number;
    expansionRevenue: number; // from upgrades
    contractionRevenue: number; // from downgrades
    totalCustomers: number;
    newCustomers: number;
    churnedCustomers: number;
    averageRevenuePerUser: number;
    lifetimeValue: number;
    churnRate: number;
    growthRate: number;
  };
  byTier: {
    [tier in SubscriptionTier]: {
      customers: number;
      revenue: number;
      churnRate: number;
      avgRevenue: number;
    };
  };
  cohortAnalysis: CohortData[];
}

export interface CohortData {
  cohort: string; // YYYY-MM
  customersCount: number;
  periods: {
    period: number; // months since signup
    retainedCustomers: number;
    retentionRate: number;
    revenue: number;
  }[];
}

// Error Handling
export interface SubscriptionError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
  userFriendlyMessage: string;
}

// API Request/Response Types
export interface CreateSubscriptionRequest {
  planId: string;
  paymentMethodId?: string;
  discountCode?: string;
  billingInterval: BillingInterval;
  trialDays?: number;
}

export interface CreateSubscriptionResponse {
  subscription: Subscription;
  clientSecret?: string; // for SCA authentication
  requiresAction: boolean;
  error?: SubscriptionError;
}

export interface UpdateSubscriptionRequest {
  planId?: string;
  billingInterval?: BillingInterval;
  cancelAtPeriodEnd?: boolean;
  prorationBehavior?: "always_invoice" | "create_prorations" | "none";
}

export interface UpdateSubscriptionResponse {
  subscription: Subscription;
  prorationAmount?: number;
  effectiveDate: Date;
  error?: SubscriptionError;
}

export interface CancelSubscriptionRequest {
  reason?: string;
  feedback?: string;
  cancelImmediately?: boolean;
  surveyData?: Partial<CancellationSurvey>;
}

export interface CancelSubscriptionResponse {
  subscription: Subscription;
  refundAmount?: number;
  effectiveDate: Date;
  retentionOffer?: {
    discountPercentage: number;
    durationMonths: number;
    description: string;
  };
  error?: SubscriptionError;
}

// Webhook Event Types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
    previous_attributes?: any;
  };
  created: number;
  livemode: boolean;
  pending_webhooks: number;
  request?: {
    id: string;
    idempotency_key?: string;
  };
}

export interface WebhookProcessingResult {
  processed: boolean;
  error?: string;
  actions: string[];
  subscriptionId?: string;
  userId?: string;
  timestamp: Date;
}

// UI State Types
export interface PremiumUIState {
  selectedPlan?: SubscriptionPlan;
  isLoading: boolean;
  isProcessingPayment: boolean;
  showPaymentModal: boolean;
  showCancelModal: boolean;
  showUpgradeModal: boolean;
  errors: Record<string, string>;
  currentStep:
    | "plan_selection"
    | "payment_method"
    | "confirmation"
    | "processing"
    | "complete";
  paymentIntent?: {
    clientSecret: string;
    status: string;
  };
}

export interface SubscriptionDashboardData {
  subscription: Subscription | null;
  currentPlan: SubscriptionPlan | null;
  usage: BillingUsage | null;
  upcomingInvoice: Invoice | null;
  paymentMethods: PaymentMethod[];
  invoiceHistory: Invoice[];
  availablePlans: SubscriptionPlan[];
  discountCodes: UserDiscount[];
  referralStats: {
    code: string;
    referrals: number;
    rewards: number;
    pendingRewards: number;
  };
}

// Integration Types
export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  apiVersion: string;
  appInfo: {
    name: string;
    version: string;
    url: string;
  };
}

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: "sandbox" | "production";
}

export interface ApplePayConfig {
  merchantId: string;
  merchantName: string;
  supportedNetworks: string[];
}

// Export all types as a namespace for easy importing
export namespace Premium {
  export type Tier = SubscriptionTier;
  export type Status = SubscriptionStatus;
  export type Billing = BillingInterval;
  export type Payment = PaymentStatus;
}
