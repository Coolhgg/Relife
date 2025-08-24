// Subscription Management Service for Relife Alarm App
// High-level subscription business logic, feature access, and user management

import type {
  Subscription,
  SubscriptionPlan,
  SubscriptionTier,
  FeatureAccess,
  BillingUsage,
  Trial,
  Discount,
  UserDiscount,
  FreeCredit,
  Referral,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  CancelSubscriptionRequest,
  SubscriptionDashboardData,
  RevenueMetrics,
} from '../types/premium';
import type {
  SubscriptionPlanDbRow,
  TrialDbRow,
  DiscountDbRow,
  RetentionOffer,
  CreateSubscriptionResult,
  UpdateSubscriptionResult,
  CancelSubscriptionResult,
  DiscountValidationResult,
  TrialStartResult,
  FreeTierLimits,
  ReferralStats,
  EnhancedBillingUsage,
} from '../types/subscription';
import type { User } from '../types';
import StripeService from './stripe-service';
import { supabase } from './supabase';
import { ErrorHandler } from './error-handler';
import AnalyticsService from './analytics';

class SubscriptionService {
  private static instance: SubscriptionService;
  private stripeService: StripeService;
  private featureCache = new Map<string, FeatureAccess>();
  private planCache = new Map<string, SubscriptionPlan>();

  private constructor() {
    this.stripeService = StripeService.getInstance();
  }

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * Initialize the subscription service
   */
  public async initialize(): Promise<void> {
    try {
      // Load subscription plans into cache
      await this.loadSubscriptionPlans();
      console.log('Subscription service initialized successfully');
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to initialize subscription service',
        { context: 'subscription_service_init' }
      );
      throw error;
    }
  }

  /**
   * Get all available subscription plans
   */
  public async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      if (this.planCache.size === 0) {
        await this.loadSubscriptionPlans();
      }

      return Array.from(this.planCache.values())
        .filter(plan => plan.isActive)
        .sort((a, b
) => a.sortOrder - b.sortOrder);
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get subscription plans',
        { context: 'get_subscription_plans' }
      );
      return [];
    }
  }

  /**
   * Get subscription plan by ID
   */
  public async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    try {
      if (this.planCache.has(planId)) {
        return this.planCache.get(planId)!;
      }

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      const plan = this.mapDatabasePlan(data);
      this.planCache.set(planId, plan);
      return plan;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get subscription plan',
        { context: 'get_subscription_plan', metadata: { planId } }
      );
      return null;
    }
  }

  /**
   * Get user's current subscription
   */
  public async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      return await this.stripeService.getUserSubscription(userId);
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get user subscription',
        { context: 'get_user_subscription', metadata: { userId } }
      );
      return null;
    }
  }

  /**
   * Get user's subscription tier
   */
  public async getUserTier(userId: string): Promise<SubscriptionTier> {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription || subscription.status !== 'active') {
        return 'free';
      }

      return subscription.tier;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get user tier',
        { context: 'get_user_tier', metadata: { userId } }
      );
      return 'free';
    }
  }

  /**
   * Create subscription for user
   */
  public async createSubscription(
    userId: string,
    request: CreateSubscriptionRequest
  ): Promise<CreateSubscriptionResult> {
    try {
      const analytics = AnalyticsService.getInstance();

      // Validate the plan exists and is active
      const plan = await this.getSubscriptionPlan(request.planId);
      if (!plan) {
        return { success: false, error: 'Invalid subscription plan' };
      }

      // Check if user already has an active subscription
      const existingSubscription = await this.getUserSubscription(userId);
      if (existingSubscription && existingSubscription.status === 'active') {
        return { success: false, error: 'User already has an active subscription' };
      }

      // Validate discount code if provided
      if (request.discountCode) {
        const discountValidation = await this.validateDiscountCode(
          userId,
          request.discountCode
        );
        if (!discountValidation.valid) {
          return {
            success: false,
            error: discountValidation.error || 'Invalid discount code',
          };
        }
      }

      // Create subscription via Stripe
      const result = await this.stripeService.createSubscription(userId, request);

      if (result.error) {
        analytics.trackError(
          new Error(result.error.message),
          'subscription_creation_failed',
          {
            userId,
            planId: request.planId,
            errorCode: result.error.code,
          }
        );
        return { success: false, error: result.error.userFriendlyMessage };
      }

      // Record discount usage if applicable
      if (request.discountCode && result.subscription) {
        await this.recordDiscountUsage(userId, request.discountCode);
      }

      // Update feature access cache
      this.featureCache.delete(userId);

      analytics.trackFeatureUsage('subscription_created', undefined, {
        userId,
        tier: result.subscription.tier,
        planId: request.planId,
        billingInterval: request.billingInterval,
      });

      return {
        success: true,
        subscription: result.subscription,
        clientSecret: result.clientSecret,
      };
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to create subscription',
        { context: 'create_subscription', metadata: { userId, request } }
      );
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Update user's subscription
   */
  public async updateSubscription(
    userId: string,
    subscriptionId: string,
    request: UpdateSubscriptionRequest
  ): Promise<UpdateSubscriptionResult> {
    try {
      const analytics = AnalyticsService.getInstance();

      // Validate the new plan if provided
      if (request.planId) {
        const plan = await this.getSubscriptionPlan(request.planId);
        if (!plan) {
          return { success: false, error: 'Invalid subscription plan' };
        }
      }

      // Update subscription via Stripe
      const result = await this.stripeService.updateSubscription(
        subscriptionId,
        request
      );

      if (result.error) {
        return { success: false, error: result.error.userFriendlyMessage };
      }

      // Update feature access cache
      this.featureCache.delete(userId);

      analytics.trackFeatureUsage('subscription_updated', undefined, {
        userId,
        subscriptionId,
        changeType: request.planId ? 'plan_change' : 'billing_change',
      });

      return {
        success: true,
        subscription: result.subscription,
      };
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to update subscription',
        {
          context: 'update_subscription',
          metadata: { userId, subscriptionId, request },
        }
      );
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Cancel user's subscription
   */
  public async cancelSubscription(
    userId: string,
    subscriptionId: string,
    request: CancelSubscriptionRequest
  ): Promise<CancelSubscriptionResult> {
    try {
      const analytics = AnalyticsService.getInstance();

      // Cancel subscription via Stripe
      const result = await this.stripeService.cancelSubscription(
        subscriptionId,
        request
      );

      if (result.error) {
        return { success: false, error: result.error.userFriendlyMessage };
      }

      // Update feature access cache
      this.featureCache.delete(userId);

      analytics.trackFeatureUsage('subscription_canceled', undefined, {
        userId,
        subscriptionId,
        reason: request.reason,
        immediate: request.cancelImmediately,
      });

      return {
        success: true,
        subscription: result.subscription,
        retentionOffer: result.retentionOffer,
      };
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to cancel subscription',
        {
          context: 'cancel_subscription',
          metadata: { userId, subscriptionId, request },
        }
      );
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Check if user has access to a feature
   */
  public async hasFeatureAccess(userId: string, featureId: string): Promise<boolean> {
    try {
      const featureAccess = await this.getFeatureAccess(userId);
      const feature = featureAccess.features[featureId];

      if (!feature) {
        return false;
      }

      // Check if user has access
      if (!feature.hasAccess) {
        return false;
      }

      // Check usage limits
      if (feature.usageLimit && feature.usageCount !== undefined) {
        return feature.usageCount < feature.usageLimit;
      }

      return true;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to check feature access',
        { context: 'has_feature_access', metadata: { userId, featureId } }
      );
      return false;
    }
  }

  /**
   * Get feature access details for user
   */
  public async getFeatureAccess(userId: string): Promise<FeatureAccess> {
    try {
      // Check cache first
      if (this.featureCache.has(userId)) {
        return this.featureCache.get(userId)!;
      }

      const userTier = await this.getUserTier(userId);
      const usage = await this.getUserUsage(userId);
      const features: FeatureAccess['features'] = {};

      // Get all premium features
      const { data: premiumFeatures } = await supabase
        .from('premium_features')
        .select('*');

      if (premiumFeatures) {
        for (const feature of premiumFeatures) {
          const hasAccess = this.checkTierAccess(userTier, feature.required_tier);
          const featureUsage = usage.usage[feature.id];

          features[feature.id] = {
            hasAccess,
            usageLimit: featureUsage?.limit,
            usageCount: featureUsage?.used,
            resetDate: featureUsage?.resetDate,
            upgradeRequired: hasAccess ? undefined : feature.required_tier,
          };
        }
      }

      const featureAccess: FeatureAccess = {
        userId,
        subscriptionTier: userTier,
        features,
        lastUpdated: new Date(),
      };

      // Cache the result
      this.featureCache.set(userId, featureAccess);

      return featureAccess;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get feature access',
        { context: 'get_feature_access', metadata: { userId } }
      );

      // Return minimal access on error
      return {
        userId,
        subscriptionTier: 'free',
        features: {},
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Track feature usage
   */
  public async trackFeatureUsage(
    userId: string,
    featureId: string,
    amount: number = 1
  ): Promise<void> {
    try {
      const now = new Date();
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // First day of next month

      await supabase.rpc('track_feature_usage', {
        p_user_id: userId,
        p_feature: featureId,
        p_usage_amount: amount,
        p_reset_date: resetDate.toISOString(),
      });

      // Clear cache to force refresh
      this.featureCache.delete(userId);
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to track feature usage',
        { context: 'track_feature_usage', metadata: { userId, featureId, amount } }
      );
    }
  }

  /**
   * Get user's billing usage
   */
  public async getUserUsage(userId: string): Promise<BillingUsage> {
    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: usageData } = await supabase
        .from('feature_usage')
        .select('*')
        .eq('user_id', userId)
        .gte('reset_date', periodStart.toISOString())
        .lte('reset_date', periodEnd.toISOString());

      const subscription = await this.getUserSubscription(userId);
      const plan = subscription
        ? await this.getSubscriptionPlan(subscription.planId || '')
        : null;

      const usage: BillingUsage['usage'] = {};
      const limits = plan?.limits || this.getFreeTierLimits();

      // Map feature usage to billing format
      usageData?.forEach((item: any
) => { const limit = (limits as any)[item.feature] || item.limit_count;
        usage[item.feature] = {
          used: item.usage_count,
          limit,
          percentage: limit > 0 ? Math.min((item.usage_count / limit) * 100, 100) : 0,
        };
      });

      return {
        userId,
        subscriptionId: subscription?.id || '',
        period: {
          start: periodStart,
          end: periodEnd,
        },
        usage,
        overageCharges: [], // Implement overage logic if needed
        totalOverageAmount: 0,
      };
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get user usage',
        { context: 'get_user_usage', metadata: { userId } }
      );

      // Return empty usage on error
      return {
        userId,
        subscriptionId: '',
        period: { start: new Date(), end: new Date() },
        usage: {},
        overageCharges: [],
        totalOverageAmount: 0,
      };
    }
  }

  /**
   * Start free trial
   */
  public async startFreeTrial(
    userId: string,
    planId: string
  ): Promise<TrialStartResult> {
    try {
      const plan = await this.getSubscriptionPlan(planId);
      if (!plan || !plan.trialDays) {
        return { success: false, error: 'No trial available for this plan' };
      }

      // Check if user already had a trial for this tier
      const { data: existingTrial } = await supabase
        .from('trials')
        .select('*')
        .eq('user_id', userId)
        .eq('tier', plan.tier)
        .single();

      if (existingTrial) {
        return { success: false, error: 'Trial already used for this plan' };
      }

      const startDate = new Date();
      const endDate = new Date(
        startDate.getTime() + plan.trialDays * 24 * 60 * 60 * 1000
      );

      const { data: trialData, error } = await supabase
        .from('trials')
        .insert({
          user_id: userId,
          plan_id: planId,
          tier: plan.tier,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Clear feature cache
      this.featureCache.delete(userId);

      const trial: Trial = this.mapDatabaseTrial(trialData);

      const analytics = AnalyticsService.getInstance();
      analytics.trackFeatureUsage('trial_started', undefined, {
        userId,
        planId,
        tier: plan.tier,
        trialDays: plan.trialDays,
      });

      return { success: true, trial };
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to start free trial',
        { context: 'start_free_trial', metadata: { userId, planId } }
      );
      return { success: false, error: 'Failed to start trial. Please try again.' };
    }
  }

  /**
   * Validate discount code
   */
  public async validateDiscountCode(
    userId: string,
    code: string
  ): Promise<DiscountValidationResult> {
    try {
      const { data: discount, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString())
        .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
        .single();

      if (error || !discount) {
        return { valid: false, error: 'Invalid or expired discount code' };
      }

      // Check usage limits
      if (discount.max_uses && discount.current_uses >= discount.max_uses) {
        return { valid: false, error: 'Discount code usage limit reached' };
      }

      // Check per-customer usage limit
      if (discount.max_uses_per_customer) {
        const { data: userUsage } = await supabase
          .from('user_discounts')
          .select('used_count')
          .eq('user_id', userId)
          .eq('discount_id', discount.id)
          .single();

        if (userUsage && userUsage.used_count >= discount.max_uses_per_customer) {
          return { valid: false, error: 'You have already used this discount code' };
        }
      }

      // Check first-time buyer restriction
      if (discount.first_time_buyers) {
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .limit(1)
          .single();

        if (existingSubscription) {
          return {
            valid: false,
            error: 'This discount is only available for first-time customers',
          };
        }
      }

      return {
        valid: true,
        discount: this.mapDatabaseDiscount(discount),
      };
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to validate discount code',
        { context: 'validate_discount_code', metadata: { userId, code } }
      );
      return { valid: false, error: 'Failed to validate discount code' };
    }
  }

  /**
   * Get subscription dashboard data
   */
  public async getSubscriptionDashboard(
    userId: string
  ): Promise<SubscriptionDashboardData> {
    try {
      const [
        subscription,
        paymentMethods,
        invoices,
        plans,
        usage,
        userDiscounts,
        referralStats,
      ] = await Promise.all([
        this.getUserSubscription(userId),
        this.stripeService.getPaymentMethods(userId),
        this.stripeService.getUserInvoices(userId, 10),
        this.getSubscriptionPlans(),
        this.getUserUsage(userId),
        this.getUserDiscounts(userId),
        this.getReferralStats(userId),
      ]);

      const currentPlan = subscription
        ? await this.getSubscriptionPlan(subscription.planId || '')
        : null;
      const upcomingInvoice = subscription
        ? await this.stripeService.getUpcomingInvoice(subscription.id)
        : null;

      return {
        subscription,
        currentPlan,
        usage,
        upcomingInvoice,
        paymentMethods,
        invoiceHistory: invoices,
        availablePlans: plans,
        discountCodes: userDiscounts,
        referralStats,
      };
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get subscription dashboard',
        { context: 'get_subscription_dashboard', metadata: { userId } }
      );

      // Return minimal dashboard data on error
      return {
        subscription: null,
        currentPlan: null,
        usage: null,
        upcomingInvoice: null,
        paymentMethods: [],
        invoiceHistory: [],
        availablePlans: [],
        discountCodes: [],
        referralStats: {
          code: '',
          referrals: 0,
          rewards: 0,
          pendingRewards: 0,
        },
      };
    }
  }

  /**
   * Private helper methods
   */

  private async loadSubscriptionPlans(): Promise<void> {
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      throw error;
    }

    this.planCache.clear();
    plans?.forEach((plan: any
) => { this.planCache.set(plan.id, this.mapDatabasePlan(plan));
    });
  }

  private checkTierAccess(
    userTier: SubscriptionTier,
    requiredTier: SubscriptionTier
  ): boolean {
    const tierHierarchy: SubscriptionTier[] = [
      'free',
      'basic',
      'student',
      'premium',
      'pro',
      'ultimate',
      'lifetime',
    ];
    const userLevel = tierHierarchy.indexOf(userTier);
    const requiredLevel = tierHierarchy.indexOf(requiredTier);
    return userLevel >= requiredLevel;
  }

  private getFreeTierLimits() {
    return {
      maxAlarms: 3,
      maxBattles: 1,
      maxCustomSounds: 0,
      maxVoiceProfiles: 1,
      maxThemes: 2,
      supportTier: 'community',
      advancedAnalytics: false,
    };
  }

  private async recordDiscountUsage(userId: string, code: string): Promise<void> {
    await supabase.rpc('record_discount_usage', {
      p_user_id: userId,
      p_discount_code: code,
    });
  }

  private async getUserDiscounts(userId: string): Promise<UserDiscount[]> {
    const { data } = await supabase
      .from('user_discounts')
      .select(
        `
        *,
        discounts (*)
      `
      )
      .eq('user_id', userId);

    return (
      data?.map((item: any
) => ({
        id: item.id,
        userId: item.user_id,
        discountId: item.discount_id,
        discount: this.mapDatabaseDiscount(item.discounts),
        usedCount: item.used_count,
        firstUsedAt: item.first_used_at ? new Date(item.first_used_at) : undefined,
        lastUsedAt: item.last_used_at ? new Date(item.last_used_at) : undefined,
        createdAt: new Date(item.created_at),
      })) || []
    );
  }

  private async getReferralStats(userId: string): Promise<any> {
    // Implementation for referral statistics
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);

    const referrals = data?.length || 0;
    const rewards = data?.filter((r: any
) => r.status === 'rewarded').length || 0;
    const pendingRewards = data?.filter((r: any
) => r.status === 'converted').length || 0;

    return {
      code: `REF-${userId.slice(-8).toUpperCase()}`, // Generate referral code
      referrals,
      rewards,
      pendingRewards,
    };
  }

  // Mapping functions
  private mapDatabasePlan(data: SubscriptionPlanDbRow): SubscriptionPlan {
    return {
      id: data.id,
      tier: data.tier,
      name: data.name,
      displayName: data.display_name,
      description: data.description,
      tagline: data.tagline,
      features: data.features || [],
      limits: data.limits || {},
      pricing: data.pricing || {},
      stripePriceId: data.stripe_price_id_monthly || '',
      stripeProductId: data.stripe_product_id || '',
      isPopular: data.is_popular || false,
      isRecommended: data.is_recommended || false,
      sortOrder: data.sort_order || 0,
      isActive: data.is_active || false,
      trialDays: data.trial_days || 0,
      setupFee: data.setup_fee || 0,
      discountEligible: data.discount_eligible || false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapDatabaseTrial(data: TrialDbRow): Trial {
    return {
      id: data.id,
      userId: data.user_id,
      planId: data.plan_id,
      tier: data.tier,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      status: data.status,
      convertedToSubscriptionId: data.converted_to_subscription_id,
      remindersSent: data.reminders_sent || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapDatabaseDiscount(data: DiscountDbRow): Discount {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value,
      currency: data.currency,
      applicableTiers: data.applicable_tiers || [],
      applicablePlans: data.applicable_plans || [],
      minAmount: data.min_amount,
      maxUses: data.max_uses,
      currentUses: data.current_uses || 0,
      maxUsesPerCustomer: data.max_uses_per_customer,
      validFrom: new Date(data.valid_from),
      validUntil: data.valid_until ? new Date(data.valid_until) : undefined,
      firstTimeBuyers: data.first_time_buyers || false,
      stackable: data.stackable || false,
      isActive: data.is_active || false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

export default SubscriptionService;
