// Revenue Analytics Service for Relife Alarm App
// Comprehensive analytics and tracking for premium monetization

import { supabase } from './supabase';
import AnalyticsService from './analytics';
import type {
  SubscriptionTier,
  BillingInterval,
  SubscriptionStatus,
  PaymentStatus,
} from '../types/premium';

export interface RevenueMetrics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  ltv: number; // Customer Lifetime Value
  churnRate: number;
  conversionRate: number;
  upgradePath: {
    [key: string]: number;
  };
  tierDistribution: {
    [key in SubscriptionTier]: number;
  };
  cohortAnalysis: CohortData[];
}

export interface CohortData {
  cohort: string;
  size: number;
  revenue: number;
  retentionByMonth: number[];
}

export interface UserJourney {
  userId: string;
  events: Array<{
    type: 'signup' | 'trial_start' | 'conversion' | 'upgrade' | 'downgrade' | 'churn';
    timestamp: Date;
    tier?: SubscriptionTier;
    amount?: number;
    metadata?: Record<string, any>;
  }>;
  totalValue: number;
  daysActive: number;
  currentTier: SubscriptionTier;
}

export interface FeatureAdoptionMetrics {
  feature: string;
  adoptionRate: number;
  tierCorrelation: Record<SubscriptionTier, number>;
  engagementScore: number;
  conversionImpact: number;
}

export class RevenueAnalyticsService {
  private static instance: RevenueAnalyticsService;
  private metricsCache: Map<string, { data: any; timestamp: Date }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): RevenueAnalyticsService {
    if (!RevenueAnalyticsService.instance) {
      RevenueAnalyticsService.instance = new RevenueAnalyticsService();
    }
    return RevenueAnalyticsService.instance;
  }

  /**
   * Get overall revenue metrics
   */
  public async getRevenueMetrics(
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<RevenueMetrics> {
    const cacheKey = `revenue_metrics_${timeRange}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const endDate = new Date();
      const startDate = this.getStartDate(endDate, timeRange);

      // Calculate MRR
      const mrr = await this.calculateMRR();

      // Calculate ARR
      const arr = mrr * 12;

      // Calculate LTV
      const ltv = await this.calculateLTV();

      // Calculate churn rate
      const churnRate = await this.calculateChurnRate(startDate, endDate);

      // Calculate conversion rate
      const conversionRate = await this.calculateConversionRate(startDate, endDate);

      // Get upgrade paths
      const upgradePath = await this.getUpgradePath(startDate, endDate);

      // Get tier distribution
      const tierDistribution = await this.getTierDistribution();

      // Get cohort analysis
      const cohortAnalysis = await this.getCohortAnalysis();

      const metrics: RevenueMetrics = {
        mrr,
        arr,
        ltv,
        churnRate,
        conversionRate,
        upgradePath,
        tierDistribution,
        cohortAnalysis,
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error calculating revenue metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate Monthly Recurring Revenue
   */
  private async calculateMRR(): Promise<number> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('amount, billingInterval, currency')
      .eq('status', 'active')
      .neq('tier', 'free');

    if (error) throw error;

    let totalMRR = 0;
    data?.forEach(subscription => {
      const monthlyAmount =
        subscription.billingInterval === 'year'
          ? subscription.amount / 12
          : subscription.amount;
      totalMRR += monthlyAmount;
    });

    return totalMRR / 100; // Convert from cents
  }

  /**
   * Calculate Customer Lifetime Value
   */
  private async calculateLTV(): Promise<number> {
    // LTV = Average Revenue per User / Churn Rate
    const avgRevenuePerUser = await this.getAverageRevenuePerUser();
    const churnRate = await this.calculateChurnRate();

    return churnRate > 0 ? avgRevenuePerUser / churnRate : 0;
  }

  /**
   * Calculate churn rate for a given period
   */
  private async calculateChurnRate(startDate?: Date, endDate?: Date): Promise<number> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Get users who were active at the beginning of the period
    const { data: activeAtStart, error: activeError } = await supabase
      .from('subscriptions')
      .select('userId')
      .eq('status', 'active')
      .lte('createdAt', start.toISOString());

    if (activeError) throw activeError;

    // Get users who churned during the period
    const { data: churned, error: churnError } = await supabase
      .from('subscriptions')
      .select('userId')
      .in('status', ['canceled', 'unpaid'])
      .gte('canceledAt', start.toISOString())
      .lte('canceledAt', end.toISOString());

    if (churnError) throw churnError;

    if (!activeAtStart?.length) return 0;

    return (churned?.length || 0) / activeAtStart.length;
  }

  /**
   * Calculate trial to paid conversion rate
   */
  private async calculateConversionRate(
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Get trial users who started in the period
    const { data: trialUsers, error: trialError } = await supabase
      .from('trials')
      .select('userId')
      .gte('startDate', start.toISOString())
      .lte('startDate', end.toISOString());

    if (trialError) throw trialError;

    // Get conversions from those trial users
    const trialUserIds = trialUsers?.map(t => t.userId) || [];
    if (trialUserIds.length === 0) return 0;

    const { data: conversions, error: conversionError } = await supabase
      .from('subscriptions')
      .select('userId')
      .in('userId', trialUserIds)
      .neq('tier', 'free')
      .eq('status', 'active');

    if (conversionError) throw conversionError;

    return (conversions?.length || 0) / trialUserIds.length;
  }

  /**
   * Get upgrade/downgrade paths
   */
  private async getUpgradePath(
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('subscription_changes')
      .select('previousTier, newTier')
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString());

    if (error) throw error;

    const paths: Record<string, number> = {};
    data?.forEach(change => {
      const path = `${change.previousTier}_to_${change.newTier}`;
      paths[path] = (paths[path] || 0) + 1;
    });

    return paths;
  }

  /**
   * Get current tier distribution
   */
  private async getTierDistribution(): Promise<Record<SubscriptionTier, number>> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('status', 'active');

    if (error) throw error;

    const distribution: Record<SubscriptionTier, number> = {
      free: 0,
      basic: 0,
      premium: 0,
      pro: 0,
      enterprise: 0,
    };

    data?.forEach(subscription => {
      distribution[subscription.tier as SubscriptionTier]++;
    });

    return distribution;
  }

  /**
   * Get cohort analysis data
   */
  private async getCohortAnalysis(): Promise<CohortData[]> {
    // This would be complex SQL query - simplified for example
    const cohorts: CohortData[] = [];

    const months = this.getLastNMonths(12);

    for (const month of months) {
      const cohortData = await this.getCohortData(month);
      cohorts.push(cohortData);
    }

    return cohorts;
  }

  /**
   * Get feature adoption metrics
   */
  public async getFeatureAdoptionMetrics(): Promise<FeatureAdoptionMetrics[]> {
    const cacheKey = 'feature_adoption';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const features = [
      'smart_wakeup',
      'custom_sounds',
      'voice_commands',
      'team_battles',
      'advanced_analytics',
      'location_alarms',
    ];

    const metrics: FeatureAdoptionMetrics[] = [];

    for (const feature of features) {
      const adoptionData = await this.getFeatureAdoptionData(feature);
      metrics.push(adoptionData);
    }

    this.setCachedData(cacheKey, metrics);
    return metrics;
  }

  /**
   * Get user journey data
   */
  public async getUserJourney(userId: string): Promise<UserJourney> {
    const { data: events, error } = await supabase
      .from('user_events')
      .select('*')
      .eq('userId', userId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    const journey: UserJourney = {
      userId,
      events:
        events?.map(event => ({
          type: event.type,
          timestamp: new Date(event.timestamp),
          tier: event.tier,
          amount: event.amount,
          metadata: event.metadata,
        })) || [],
      totalValue: 0,
      daysActive: 0,
      currentTier: 'free',
    };

    // Calculate metrics
    journey.totalValue = journey.events
      .filter(e => e.amount)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    if (journey.events.length > 0) {
      const firstEvent = journey.events[0].timestamp;
      const lastEvent = journey.events[journey.events.length - 1].timestamp;
      journey.daysActive = Math.floor(
        (lastEvent.getTime() - firstEvent.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Get current tier
    const currentEvent = journey.events.filter(e => e.tier).reverse()[0];
    journey.currentTier = currentEvent?.tier || 'free';

    return journey;
  }

  /**
   * Track revenue event
   */
  public async trackRevenueEvent(event: {
    userId: string;
    type: string;
    amount?: number;
    tier?: SubscriptionTier;
    billingInterval?: BillingInterval;
    metadata?: Record<string, any>;
  }): Promise<void> {
    // Store in database
    await supabase.from('user_events').insert({
      userId: event.userId,
      type: event.type,
      amount: event.amount,
      tier: event.tier,
      billingInterval: event.billingInterval,
      metadata: event.metadata,
      timestamp: new Date(),
    });

    // Send to analytics service
    AnalyticsService.track(`revenue_${event.type}`, {
      userId: event.userId,
      amount: event.amount,
      tier: event.tier,
      billingInterval: event.billingInterval,
      ...event.metadata,
    });

    // Clear relevant caches
    this.clearCacheByPattern('revenue_');
  }

  /**
   * Generate revenue report
   */
  public async generateRevenueReport(
    timeRange: '7d' | '30d' | '90d' | '1y',
    format: 'json' | 'csv' = 'json'
  ): Promise<any> {
    const metrics = await this.getRevenueMetrics(timeRange);
    const featureMetrics = await this.getFeatureAdoptionMetrics();

    const report = {
      period: timeRange,
      generatedAt: new Date(),
      summary: metrics,
      featureAdoption: featureMetrics,
      insights: this.generateInsights(metrics, featureMetrics),
    };

    if (format === 'csv') {
      return this.convertToCSV(report);
    }

    return report;
  }

  // Helper methods

  private async getAverageRevenuePerUser(): Promise<number> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('amount')
      .eq('status', 'active')
      .neq('tier', 'free');

    if (error) throw error;

    if (!data?.length) return 0;

    const totalRevenue = data.reduce((sum, sub) => sum + sub.amount, 0);
    return totalRevenue / data.length / 100; // Convert from cents
  }

  private async getCohortData(month: string): Promise<CohortData> {
    // Simplified cohort calculation
    return {
      cohort: month,
      size: 100,
      revenue: 5000,
      retentionByMonth: [100, 85, 72, 65, 58, 52, 48, 45, 42, 40, 38, 36],
    };
  }

  private async getFeatureAdoptionData(
    feature: string
  ): Promise<FeatureAdoptionMetrics> {
    const { data: usage, error } = await supabase
      .from('feature_usage')
      .select('userId, tier')
      .eq('featureName', feature);

    if (error) throw error;

    const { data: totalUsers, error: totalError } = await supabase
      .from('users')
      .select('tier');

    if (totalError) throw totalError;

    const adoptionRate = usage?.length ? usage.length / (totalUsers?.length || 1) : 0;

    return {
      feature,
      adoptionRate,
      tierCorrelation: {
        free: 0.1,
        basic: 0.3,
        premium: 0.7,
        pro: 0.9,
        enterprise: 1.0,
      },
      engagementScore: Math.random() * 100, // Placeholder
      conversionImpact: Math.random() * 0.5, // Placeholder
    };
  }

  private getStartDate(endDate: Date, range: string): Date {
    const date = new Date(endDate);
    switch (range) {
      case '7d':
        date.setDate(date.getDate() - 7);
        break;
      case '30d':
        date.setDate(date.getDate() - 30);
        break;
      case '90d':
        date.setDate(date.getDate() - 90);
        break;
      case '1y':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    return date;
  }

  private getLastNMonths(n: number): string[] {
    const months: string[] = [];
    const date = new Date();

    for (let i = 0; i < n; i++) {
      const month = new Date(date.getFullYear(), date.getMonth() - i, 1);
      months.push(month.toISOString().substring(0, 7));
    }

    return months.reverse();
  }

  private generateInsights(
    metrics: RevenueMetrics,
    features: FeatureAdoptionMetrics[]
  ): string[] {
    const insights: string[] = [];

    if (metrics.churnRate > 0.05) {
      insights.push('Churn rate is above 5% - consider retention strategies');
    }

    if (metrics.conversionRate < 0.15) {
      insights.push('Trial conversion rate is below 15% - optimize onboarding');
    }

    const topFeature = features.sort((a, b) => b.adoptionRate - a.adoptionRate)[0];
    if (topFeature) {
      insights.push(
        `${topFeature.feature} has the highest adoption rate at ${(topFeature.adoptionRate * 100).toFixed(1)}%`
      );
    }

    return insights;
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - in production, use a proper CSV library
    return JSON.stringify(data);
  }

  private getCachedData(key: string): any {
    const cached = this.metricsCache.get(key);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.metricsCache.set(key, { data, timestamp: new Date() });
  }

  private clearCacheByPattern(pattern: string): void {
    for (const key of this.metricsCache.keys()) {
      if (key.includes(pattern)) {
        this.metricsCache.delete(key);
      }
    }
  }
}

export default RevenueAnalyticsService.getInstance();
