import { supabase, createClient } from './supabase';
import type {
  Subscription,
  SubscriptionTier,
  SubscriptionStatus,
  PremiumFeatureAccess,
  PremiumUsage,
  FeatureLimits,
  SUBSCRIPTION_LIMITS,
  SUBSCRIPTION_PLANS
} from '../types';
import { ErrorHandler } from './error-handler';

interface SubscriptionCheckResult {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  currentUsage?: number;
  limit?: number;
}

export class SubscriptionService {
  private static cache = new Map<string, any>();
  private static cacheExpiry = new Map<string, number>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private static isAvailable = createClient() !== null;

  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    if (!this.isAvailable) {
      return null;
    }

    const cacheKey = `subscription_${userId}`;
    const cached = this.getCachedData<Subscription>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw new Error(`Failed to get subscription: ${error.message}`);
      }

      const subscription = data ? {
        id: data.id,
        userId: data.user_id,
        tier: data.tier,
        status: data.status,
        currentPeriodStart: new Date(data.current_period_start),
        currentPeriodEnd: new Date(data.current_period_end),
        trialEnd: data.trial_end ? new Date(data.trial_end) : undefined,
        cancelAtPeriodEnd: data.cancel_at_period_end,
        canceledAt: data.canceled_at ? new Date(data.canceled_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        stripeCustomerId: data.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
        stripePriceId: data.stripe_price_id
      } as Subscription : null;

      if (subscription) {
        this.setCachedData(cacheKey, subscription);
      }

      return subscription;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get user subscription',
        { context: 'getUserSubscription', userId }
      );
      return null;
    }
  }

  /**
   * Get user's subscription tier
   */
  static async getUserTier(userId: string): Promise<SubscriptionTier> {
    const subscription = await this.getUserSubscription(userId);
    return subscription?.tier || 'free';
  }

  /**
   * Get user's feature access permissions
   */
  static async getFeatureAccess(userId: string): Promise<PremiumFeatureAccess> {
    const tier = await this.getUserTier(userId);
    const plan = SUBSCRIPTION_PLANS.find(p => p.tier === tier);
    return plan?.featureAccess || SUBSCRIPTION_PLANS[0].featureAccess; // Default to free tier
  }

  /**
   * Get user's feature limits
   */
  static getFeatureLimits(tier: SubscriptionTier): FeatureLimits {
    return SUBSCRIPTION_LIMITS[tier];
  }

  /**
   * Check if user has access to a specific feature
   */
  static async hasFeatureAccess(
    userId: string,
    feature: keyof PremiumFeatureAccess
  ): Promise<boolean> {
    const featureAccess = await this.getFeatureAccess(userId);
    return featureAccess[feature];
  }

  /**
   * Check if user can use a feature based on usage limits
   */
  static async checkFeatureUsage(
    userId: string,
    feature: 'elevenlabsApiCalls' | 'aiInsightsGenerated' | 'customVoiceMessages'
  ): Promise<SubscriptionCheckResult> {
    const tier = await this.getUserTier(userId);
    const limits = this.getFeatureLimits(tier);
    const usage = await this.getCurrentUsage(userId);

    let currentUsage: number = 0;
    let limit: number = 0;

    switch (feature) {
      case 'elevenlabsApiCalls':
        currentUsage = usage?.elevenlabsApiCalls || 0;
        limit = limits.elevenlabsCallsPerMonth;
        break;
      case 'aiInsightsGenerated':
        currentUsage = usage?.aiInsightsGenerated || 0;
        limit = limits.aiInsightsPerDay;
        break;
      case 'customVoiceMessages':
        currentUsage = usage?.customVoiceMessages || 0;
        limit = limits.customVoiceMessagesPerDay;
        break;
    }

    if (limit === -1) { // Unlimited
      return { hasAccess: true };
    }

    if (currentUsage >= limit) {
      return {
        hasAccess: false,
        reason: `Daily/monthly limit exceeded`,
        upgradeRequired: true,
        currentUsage,
        limit
      };
    }

    return { hasAccess: true, currentUsage, limit };
  }

  /**
   * Get current month's usage for a user
   */
  static async getCurrentUsage(userId: string): Promise<PremiumUsage | null> {
    if (!this.isAvailable) {
      return null;
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const cacheKey = `usage_${userId}_${currentMonth}`;
    const cached = this.getCachedData<PremiumUsage>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('premium_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get usage: ${error.message}`);
      }

      const usage = data ? {
        userId: data.user_id,
        month: data.month,
        elevenlabsApiCalls: data.elevenlabs_api_calls,
        aiInsightsGenerated: data.ai_insights_generated,
        customVoiceMessages: data.custom_voice_messages,
        premiumThemesUsed: data.premium_themes_used,
        lastUpdated: new Date(data.last_updated)
      } as PremiumUsage : null;

      if (usage) {
        this.setCachedData(cacheKey, usage, 1 * 60 * 1000); // Cache for 1 minute for usage data
      }

      return usage;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get usage data',
        { context: 'getCurrentUsage', userId }
      );
      return null;
    }
  }

  /**
   * Increment usage for a specific feature
   */
  static async incrementUsage(
    userId: string,
    feature: 'elevenlabsApiCalls' | 'aiInsightsGenerated' | 'customVoiceMessages',
    increment: number = 1
  ): Promise<void> {
    if (!this.isAvailable) {
      return;
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    try {
      const { error } = await supabase.rpc('increment_premium_usage', {
        p_user_id: userId,
        p_month: currentMonth,
        p_feature: feature,
        p_increment: increment
      });

      if (error) {
        throw new Error(`Failed to increment usage: ${error.message}`);
      }

      // Invalidate cache
      const cacheKey = `usage_${userId}_${currentMonth}`;
      this.invalidateCache(cacheKey);
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to increment usage',
        { context: 'incrementUsage', userId, feature, increment }
      );
    }
  }

  /**
   * Create or update a subscription
   */
  static async upsertSubscription(subscription: Subscription): Promise<void> {
    if (!this.isAvailable) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .upsert([{
          id: subscription.id,
          user_id: subscription.userId,
          tier: subscription.tier,
          status: subscription.status,
          current_period_start: subscription.currentPeriodStart.toISOString(),
          current_period_end: subscription.currentPeriodEnd.toISOString(),
          trial_end: subscription.trialEnd?.toISOString(),
          cancel_at_period_end: subscription.cancelAtPeriodEnd,
          canceled_at: subscription.canceledAt?.toISOString(),
          created_at: subscription.createdAt.toISOString(),
          updated_at: subscription.updatedAt.toISOString(),
          stripe_customer_id: subscription.stripeCustomerId,
          stripe_subscription_id: subscription.stripeSubscriptionId,
          stripe_price_id: subscription.stripePriceId
        }]);

      if (error) {
        throw new Error(`Failed to upsert subscription: ${error.message}`);
      }

      // Invalidate cache
      this.invalidateCache(`subscription_${subscription.userId}`);
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to upsert subscription',
        { context: 'upsertSubscription', subscriptionId: subscription.id }
      );
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<void> {
    if (!this.isAvailable) {
      return;
    }

    try {
      const updates: any = {
        cancel_at_period_end: cancelAtPeriodEnd,
        updated_at: new Date().toISOString()
      };

      if (!cancelAtPeriodEnd) {
        updates.status = 'canceled';
        updates.canceled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) {
        throw new Error(`Failed to cancel subscription: ${error.message}`);
      }

      // Invalidate cache
      this.invalidateCache(`subscription_${userId}`);
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to cancel subscription',
        { context: 'cancelSubscription', userId }
      );
    }
  }

  /**
   * Get subscription analytics for admin
   */
  static async getSubscriptionAnalytics(): Promise<{
    totalSubscriptions: number;
    subscriptionsByTier: Record<SubscriptionTier, number>;
    monthlyRevenue: number;
    churnRate: number;
  } | null> {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('get_subscription_analytics');

      if (error) {
        throw new Error(`Failed to get subscription analytics: ${error.message}`);
      }

      return data;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get subscription analytics',
        { context: 'getSubscriptionAnalytics' }
      );
      return null;
    }
  }

  /**
   * Check if user is in trial period
   */
  static async isUserInTrial(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription?.trialEnd) {
      return false;
    }

    return new Date() < subscription.trialEnd;
  }

  /**
   * Get days remaining in trial
   */
  static async getTrialDaysRemaining(userId: string): Promise<number> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription?.trialEnd) {
      return 0;
    }

    const now = new Date();
    const trialEnd = subscription.trialEnd;
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  // Cache management methods
  private static setCachedData<T>(key: string, data: T, duration?: number): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + (duration || this.CACHE_DURATION));
  }

  private static getCachedData<T>(key: string): T | null {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  private static invalidateCache(key: string): void {
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
  }

  /**
   * Clear all cached data
   */
  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}