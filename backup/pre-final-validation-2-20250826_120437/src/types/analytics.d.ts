/**
 * Analytics and Revenue Tracking Type Definitions
 * Comprehensive types for revenue analytics, user journey tracking, and feature adoption metrics
 */

// Core Revenue Analytics Types
export interface RevenueRecord {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  tier: SubscriptionTier;
  billingInterval: BillingInterval;
  timestamp: Date;
  eventType: RevenueEventType;
  metadata?: Record<string, any>;
}

export interface DailyMetric {
  date: Date;
  mrr: number;
  arr: number;
  newSubscriptions: number;
  churns: number;
  upgrades: number;
  downgrades: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

export interface MonthlySummary {
  month: string; // YYYY-MM format
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  mrr: number;
  arr: number;
  newCustomers: number;
  churnedCustomers: number;
  churnRate: number;
  conversionRate: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
}

// Subscription and User Types
export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'pro' | 'enterprise';
export type BillingInterval = 'month' | 'year';
export type SubscriptionStatus = 'active' | 'canceled' | 'unpaid' | 'trialing';

export type RevenueEventType =
  | 'signup'
  | 'trial_start'
  | 'trial_end'
  | 'conversion'
  | 'upgrade'
  | 'downgrade'
  | 'churn'
  | 'payment_success'
  | 'payment_failed'
  | 'refund';

// User Journey and Event Types
export interface UserJourney {
  userId: string;
  events: Array<{
    type: RevenueEventType;
    timestamp: Date;
    tier?: SubscriptionTier;
    amount?: number;
    metadata?: Record<string, any>;
  }>;
  totalValue: number;
  daysActive: number;
  currentTier: SubscriptionTier;
}

export interface RevenueEventInput {
  userId: string;
  type: string;
  tier?: SubscriptionTier;
  amount?: number;
  billingInterval?: BillingInterval;
  metadata?: Record<string, any>;
}

// Feature Adoption and Metrics
export interface FeatureAdoptionMetrics {
  feature: string;
  adoptionRate: number;
  engagementScore: number;
  conversionImpact: number;
  tierCorrelation: Record<SubscriptionTier, number>;
}

export interface TierCorrelation {
  free: number;
  basic: number;
  premium: number;
  pro: number;
  enterprise: number;
}

// Refunds and Adjustments
export interface Refund {
  id: string;
  userId: string;
  originalPaymentId: string;
  amount: number;
  reason: string;
  processedAt: Date;
  metadata?: Record<string, any>;
}

export interface Discount {
  id: string;
  code?: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  appliedToUserId: string;
  appliedAt: Date;
  expiresAt?: Date;
}

// Chart and Visualization Types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface RevenueChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }>;
}

// Cohort Analysis
export interface CohortData {
  cohort: string;
  size: number;
  revenue: number;
  retentionByMonth: number[];
}

export interface CohortAnalysis {
  cohorts: CohortData[];
  retentionMatrix: number[][];
  revenueMatrix: number[][];
}

// Analytics Service Integration
export interface AnalyticsEventProperties {
  userId?: string;
  tier?: SubscriptionTier;
  amount?: number;
  billingInterval?: BillingInterval;
  source?: string;
  category?: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp?: string;
  sessionId?: string;
  [key: string]: any;
}

// Report Generation
export interface RevenueReport {
  period: string;
  generatedAt: Date;
  summary: RevenueMetrics;
  featureAdoption: FeatureAdoptionMetrics[];
  insights: string[];
  cohortAnalysis?: CohortAnalysis;
  chartData?: RevenueChartData;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  ltv: number;
  churnRate: number;
  conversionRate: number;
  upgradePath: Record<string, number>;
  tierDistribution: Record<string, number>;
  cohortAnalysis: CohortData[];
}

// Database Record Types
export interface SubscriptionRecord {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  billingInterval: BillingInterval;
  createdAt: Date;
  updatedAt: Date;
  canceledAt?: Date;
  trialEndsAt?: Date;
}

export interface UserEventRecord {
  id: string;
  userId: string;
  type: RevenueEventType;
  tier?: SubscriptionTier;
  amount?: number;
  billingInterval?: BillingInterval;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface FeatureUsageRecord {
  id: string;
  userId: string;
  featureName: string;
  tier: SubscriptionTier;
  usageCount: number;
  lastUsedAt: Date;
  createdAt: Date;
}

// Time Range Types
export type TimeRange = '7d' | '30d' | '90d' | '1y';
export type ReportFormat = 'json' | 'csv';

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
}

export type MetricsCache = Map<string, CacheEntry<any>>;
