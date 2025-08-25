/**
 * Enhanced Subscription Service
 * Refactored to use standardized service architecture with improved caching and error handling
 */

import type {
import { _config } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
import { error } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
  Subscription,
  SubscriptionStatus,
  PremiumFeatureAccess,
  PremiumUsage,
  FeatureLimits,
  SubscriptionLimits,
  SUBSCRIPTION_PLANS,
  SubscriptionTier,
} from '../types';

import { BaseService } from './base/BaseService';
import { CacheProvider, getCacheManager } from './base/CacheManager';
import {
  SubscriptionServiceInterface,
  ServiceConfig,
  ServiceHealth,
  CircuitBreakerConfig,
} from '../types/service-architecture';

export interface SubscriptionServiceConfig extends ServiceConfig {
  cacheDuration: number;
  usageCacheDuration: number;
  maxRetries: number;
  retryBackoffMs: number;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  circuitBreaker: CircuitBreakerConfig;
  enableAnalytics: boolean;
  enableUsageTracking: boolean;
}

export interface SubscriptionServiceDependencies {
  supabaseService?: any;
  stripeService?: any;
  analyticsService?: any;
  errorHandler?: any;
}

export interface SubscriptionCheckResult {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  currentUsage?: number;
  limit?: number;
}

export class EnhancedSubscriptionService
  extends BaseService
  implements SubscriptionServiceInterface
{
  private cache: CacheProvider;
  private dependencies: SubscriptionServiceDependencies;
  private rateLimitTracker = new Map<string, { count: number; resetTime: number }>();
  private circuitBreakers = new Map<
    string,
    ReturnType<BaseService['createCircuitBreaker']>
  >();

  constructor(
    dependencies: SubscriptionServiceDependencies,
    _config: SubscriptionServiceConfig
  ) {
    super('SubscriptionService', '2.0.0', _config);
    this.dependencies = dependencies;
    this.cache = getCacheManager().getProvider(_config.caching?.strategy || 'memory');
  }

  // ============================================================================
  // BaseService Implementation
  // ============================================================================

  protected getDefaultConfig(): Partial<SubscriptionServiceConfig> {
    return {
      cacheDuration: 300000, // 5 minutes
      usageCacheDuration: 60000, // 1 minute for usage data
      maxRetries: 3,
      retryBackoffMs: 1000,
      rateLimit: {
        windowMs: 60000, // 1 minute
        maxRequests: 100,
      },
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 30000,
        monitoringPeriod: 60000,
      },
      enableAnalytics: true,
      enableUsageTracking: true,
      ...(super.getDefaultConfig?.() || {}),
    };
  }

  protected async doInitialize(): Promise<void> {
    const timerId = this.startTimer('initialize');

    try {
      // Initialize cache
      await this.setupCache();

      // Setup circuit breakers for external services
      this.setupCircuitBreakers();

      // Preload subscription plans configuration
      await this.preloadConfiguration();

      // Setup periodic cleanup
      this.setupPeriodicCleanup();

      this.emit('subscription:initialized', {
        cacheStrategy: this._config.caching?.strategy,
        circuitBreakersEnabled: true,
      });

      this.recordMetric('initialize_duration', this.endTimer(timerId) || 0);
    } catch (_error) {
      this.handleError(_error, 'Failed to initialize SubscriptionService');
      throw _error;
    }
  }

  protected async doCleanup(): Promise<void> {
    try {
      // Clear all caches
      await this.cache.clear();

      // Clear rate limit tracking
      this.rateLimitTracker.clear();
      this.circuitBreakers.clear();
    } catch (_error) {
      this.handleError(_error, 'Failed to cleanup SubscriptionService');
    }
  }

  public async getHealth(): Promise<ServiceHealth> {
    const baseHealth = await super.getHealth();

    // Check external service availability
    const dependencies = await this.checkDependencyHealth();

    // Calculate cache performance
    const cacheStats = await this.cache.stats();

    return {
      ...baseHealth,
      dependencies,
      metrics: {
        ...(baseHealth.metrics || {}),
        cacheHitRate: cacheStats.hitRate,
        cacheSize: cacheStats.size,
        rateLimitedRequests: this.getRateLimitedRequestsCount(),
        circuitBreakerStatus: this.getCircuitBreakerStatus(),
      },
    };
  }

  protected async checkDependencyHealth(): Promise<ServiceHealth['dependencies']> {
    const dependencies: ServiceHealth['dependencies'] = [];

    // Check Supabase connection
    if (this.dependencies.supabaseService) {
      const supabaseHealth = await this.checkServiceHealth('supabase', async () => {
        // Simple query to test connection
        const result = await this.dependencies.supabaseService
          .from('subscriptions')
          .select('id')
          .limit(1);
        return !result._error;
      });
      dependencies.push(supabaseHealth);
    }

    // Check Stripe connection
    if (this.dependencies.stripeService) {
      const stripeHealth = await this.checkServiceHealth('stripe', async () => {
        // Test Stripe API availability
        return await this.dependencies.stripeService.testConnection();
      });
      dependencies.push(stripeHealth);
    }

    return dependencies;
  }

  // ============================================================================
  // SubscriptionServiceInterface Implementation
  // ============================================================================

  public async getSubscription(userId: string): Promise<Subscription | null> {
    const timerId = this.startTimer('getSubscription');

    try {
      // Check rate limit
      if (!this.checkRateLimit('getSubscription', userId)) {
        throw new Error('Rate limit exceeded for subscription queries');
      }

      // Try cache first
      const cacheKey = `subscription:${userId}`;
      const cached = await this.cache.get<Subscription>(cacheKey);
      if (cached) {
        this.recordMetric('subscription_cache_hit', 1);
        return cached;
      }

      this.recordMetric('subscription_cache_miss', 1);

      // Get from database with circuit breaker
      const subscription = await this.executeWithCircuitBreaker(
        'supabase',
        async () => {
          return await this.fetchSubscriptionFromDatabase(userId);
        }
      );

      // Cache the result
      if (subscription) {
        const config = this._config as SubscriptionServiceConfig;
        await this.cache.set(cacheKey, subscription, _config.cacheDuration);
      }

      this.recordMetric('getSubscription_duration', this.endTimer(timerId) || 0);

      return subscription;
    } catch (_error) {
      this.recordMetric('getSubscription_errors', 1);
      this.handleError(_error, 'Failed to get subscription', { userId });
      return null;
    }
  }

  public async createSubscription(
    subscriptionData: Partial<Subscription>
  ): Promise<Subscription> {
    const timerId = this.startTimer('createSubscription');

    try {
      // Validate input
      this.validateSubscriptionData(subscriptionData);

      // Check rate limit
      if (!this.checkRateLimit('createSubscription', subscriptionData.userId || '')) {
        throw new Error('Rate limit exceeded for subscription creation');
      }

      const now = new Date();
      const subscription: Subscription = {
        id: subscriptionData.id || this.generateSubscriptionId(),
        userId: subscriptionData.userId!,
        tier: subscriptionData.tier || 'free',
        status: subscriptionData.status || 'active',
        currentPeriodStart: subscriptionData.currentPeriodStart || now,
        currentPeriodEnd:
          subscriptionData.currentPeriodEnd ||
          new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        trialEnd: subscriptionData.trialEnd,
        cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd || false,
        canceledAt: subscriptionData.canceledAt,
        createdAt: subscriptionData.createdAt || now,
        updatedAt: now,
        stripeCustomerId: subscriptionData.stripeCustomerId,
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
        stripePriceId: subscriptionData.stripePriceId,
      };

      // Save to database with circuit breaker
      await this.executeWithCircuitBreaker('supabase', async () => {
        await this.saveSubscriptionToDatabase(subscription);
      });

      // Update cache
      const cacheKey = `subscription:${subscription.userId}`;
      const config = this.config as SubscriptionServiceConfig;
      await this.cache.set(cacheKey, subscription, _config.cacheDuration);

      // Track analytics
      await this.trackSubscriptionEvent('subscription_created', subscription);

      this.recordMetric('createSubscription_duration', this.endTimer(timerId) || 0);
      this.emit('subscription:created', subscription);

      return subscription;
    } catch (_error) {
      this.recordMetric('createSubscription_errors', 1);
      this.handleError(_error, 'Failed to create subscription', { subscriptionData });
      throw error;
    }
  }

  public async updateSubscription(
    id: string,
    updates: Partial<Subscription>
  ): Promise<Subscription> {
    const timerId = this.startTimer('updateSubscription');

    try {
      // Get existing subscription
      const existing = await this.getSubscriptionById(id);
      if (!existing) {
        throw new Error(`Subscription with ID ${id} not found`);
      }

      // Check rate limit
      if (!this.checkRateLimit('updateSubscription', existing.userId)) {
        throw new Error('Rate limit exceeded for subscription updates');
      }

      const updatedSubscription: Subscription = {
        ...existing,
        ...updates,
        id, // Ensure ID cannot be changed
        updatedAt: new Date(),
      };

      // Validate updated data
      this.validateSubscriptionData(updatedSubscription);

      // Save to database with circuit breaker
      await this.executeWithCircuitBreaker('supabase', async () => {
        await this.saveSubscriptionToDatabase(updatedSubscription);
      });

      // Update cache
      const cacheKey = `subscription:${updatedSubscription.userId}`;
      const config = this.config as SubscriptionServiceConfig;
      await this.cache.set(cacheKey, updatedSubscription, _config.cacheDuration);

      // Invalidate related caches
      await this.invalidateUserCaches(updatedSubscription.userId);

      // Track analytics
      await this.trackSubscriptionEvent(
        'subscription_updated',
        updatedSubscription,
        updates
      );

      this.recordMetric('updateSubscription_duration', this.endTimer(timerId) || 0);
      this.emit('subscription:updated', {
        id,
        subscription: updatedSubscription,
        changes: updates,
      });

      return updatedSubscription;
    } catch (_error) {
      this.recordMetric('updateSubscription_errors', 1);
      this.handleError(_error, 'Failed to update subscription', { id, updates });
      throw error;
    }
  }

  public async cancelSubscription(id: string): Promise<void> {
    const timerId = this.startTimer('cancelSubscription');

    try {
      const subscription = await this.getSubscriptionById(id);
      if (!subscription) {
        throw new Error(`Subscription with ID ${id} not found`);
      }

      // Check rate limit
      if (!this.checkRateLimit('cancelSubscription', subscription.userId)) {
        throw new Error('Rate limit exceeded for subscription cancellation');
      }

      const canceledSubscription: Subscription = {
        ...subscription,
        status: 'canceled',
        canceledAt: new Date(),
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      };

      // Save to database with circuit breaker
      await this.executeWithCircuitBreaker('supabase', async () => {
        await this.saveSubscriptionToDatabase(canceledSubscription);
      });

      // Update cache
      const cacheKey = `subscription:${subscription.userId}`;
      const config = this.config as SubscriptionServiceConfig;
      await this.cache.set(cacheKey, canceledSubscription, _config.cacheDuration);

      // Invalidate related caches
      await this.invalidateUserCaches(subscription.userId);

      // Track analytics
      await this.trackSubscriptionEvent('subscription_canceled', canceledSubscription);

      this.recordMetric('cancelSubscription_duration', this.endTimer(timerId) || 0);
      this.emit('subscription:canceled', { id, subscription: canceledSubscription });
    } catch (_error) {
      this.recordMetric('cancelSubscription_errors', 1);
      this.handleError(_error, 'Failed to cancel subscription', { id });
      throw error;
    }
  }

  public checkFeatureAccess(feature: keyof PremiumFeatureAccess): boolean {
    // This would typically use the current user's subscription
    // For now, return basic implementation
    return false;
  }

  // ============================================================================
  // Additional Public Methods
  // ============================================================================

  public async getSubscriptionById(id: string): Promise<Subscription | null> {
    try {
      const cacheKey = `subscription:id:${id}`;
      const cached = await this.cache.get<Subscription>(cacheKey);
      if (cached) {
        return cached;
      }

      const subscription = await this.executeWithCircuitBreaker(
        'supabase',
        async () => {
          return await this.fetchSubscriptionByIdFromDatabase(id);
        }
      );

      if (subscription) {
        const config = this._config as SubscriptionServiceConfig;
        await this.cache.set(cacheKey, subscription, _config.cacheDuration);
      }

      return subscription;
    } catch (_error) {
      this.handleError(_error, 'Failed to get subscription by ID', { id });
      return null;
    }
  }

  public async getUserTier(userId: string): Promise<SubscriptionTier> {
    try {
      const subscription = await this.getSubscription(userId);
      return subscription?.tier || 'free';
    } catch (_error) {
      this.handleError(_error, 'Failed to get _user tier', { userId });
      return 'free';
    }
  }

  public async getFeatureAccess(userId: string): Promise<PremiumFeatureAccess> {
    try {
      const tier = await this.getUserTier(userId);
      const plan = SUBSCRIPTION_PLANS.find(p => p.tier === tier);
      return plan?.featureAccess || SUBSCRIPTION_PLANS[0].featureAccess;
    } catch (_error) {
      this.handleError(_error, 'Failed to get feature access', { userId });
      return SUBSCRIPTION_PLANS[0].featureAccess; // Default to free tier
    }
  }

  public async hasFeatureAccess(
    userId: string,
    feature: keyof PremiumFeatureAccess
  ): Promise<boolean> {
    try {
      const featureAccess = await this.getFeatureAccess(userId);
      return featureAccess[feature];
    } catch (_error) {
      this.handleError(_error, 'Failed to check feature access', { userId, feature });
      return false;
    }
  }

  public async checkFeatureUsage(
    userId: string,
    feature: 'elevenlabsApiCalls' | 'aiInsightsGenerated' | 'customVoiceMessages'
  ): Promise<SubscriptionCheckResult> {
    try {
      const tier = await this.getUserTier(userId);
      const limits = await this.getFeatureLimits(userId);
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

      if (limit === -1) {
        return { hasAccess: true };
      }

      if (currentUsage >= limit) {
        return {
          hasAccess: false,
          reason: 'Daily/monthly limit exceeded',
          upgradeRequired: true,
          currentUsage,
          limit,
        };
      }

      return { hasAccess: true, currentUsage, limit };
    } catch (_error) {
      this.handleError(_error, 'Failed to check feature usage', { userId, feature });
      return { hasAccess: false, reason: 'Error checking usage' };
    }
  }

  public async getCurrentUsage(userId: string): Promise<PremiumUsage | null> {
    const timerId = this.startTimer('getCurrentUsage');

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const cacheKey = `usage:${userId}:${currentMonth}`;

      // Try cache first
      const cached = await this.cache.get<PremiumUsage>(cacheKey);
      if (cached) {
        this.recordMetric('usage_cache_hit', 1);
        return cached;
      }

      this.recordMetric('usage_cache_miss', 1);

      // Get from database with circuit breaker
      const usage = await this.executeWithCircuitBreaker('supabase', async () => {
        return await this.fetchUsageFromDatabase(userId, currentMonth);
      });

      // Cache with shorter duration for usage data
      if (usage) {
        const config = this._config as SubscriptionServiceConfig;
        await this.cache.set(cacheKey, usage, _config.usageCacheDuration);
      }

      this.recordMetric('getCurrentUsage_duration', this.endTimer(timerId) || 0);

      return usage;
    } catch (_error) {
      this.recordMetric('getCurrentUsage_errors', 1);
      this.handleError(_error, 'Failed to get current usage', { userId });
      return null;
    }
  }

  public async incrementUsage(
    userId: string,
    feature: 'elevenlabsApiCalls' | 'aiInsightsGenerated' | 'customVoiceMessages',
    increment: number = 1
  ): Promise<void> {
    const timerId = this.startTimer('incrementUsage');

    try {
      if (!(this._config as SubscriptionServiceConfig).enableUsageTracking) {
        return;
      }

      // Check rate limit
      if (!this.checkRateLimit('incrementUsage', userId)) {
        throw new Error('Rate limit exceeded for usage increment');
      }

      const currentMonth = new Date().toISOString().slice(0, 7);

      // Update database with circuit breaker
      await this.executeWithCircuitBreaker('supabase', async () => {
        await this.incrementUsageInDatabase(userId, currentMonth, feature, increment);
      });

      // Invalidate cache
      const cacheKey = `usage:${userId}:${currentMonth}`;
      await this.cache.delete(cacheKey);

      // Track analytics
      if ((this._config as SubscriptionServiceConfig).enableAnalytics) {
        await this.trackUsageEvent('usage_incremented', {
          userId,
          feature,
          increment,
          month: currentMonth,
        });
      }

      this.recordMetric('incrementUsage_duration', this.endTimer(timerId) || 0);
      this.emit('usage:incremented', { userId, feature, increment });
    } catch (_error) {
      this.recordMetric('incrementUsage_errors', 1);
      this.handleError(_error, 'Failed to increment usage', {
        userId,
        feature,
        increment,
      });
      throw error;
    }
  }

  public async getFeatureLimits(userId: string): Promise<SubscriptionLimits> {
    try {
      const tier = await this.getUserTier(userId);
      return SubscriptionLimits[tier];
    } catch (_error) {
      this.handleError(_error, 'Failed to get feature limits', { userId });
      return SubscriptionLimits.free; // Default to free tier limits
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async setupCache(): Promise<void> {
    try {
      const cacheStats = await this.cache.stats();
      console.debug(
        `[SubscriptionService] Cache initialized with ${cacheStats.size} entries`
      );
    } catch (_error) {
      this.handleError(_error, 'Failed to setup cache');
    }
  }

  private setupCircuitBreakers(): void {
    const config = this._config as SubscriptionServiceConfig;

    // Setup circuit breaker for Supabase calls
    this.circuitBreakers.set(
      'supabase',
      this.createCircuitBreaker(
        async () => {
          throw new Error('Circuit breaker test');
        }, // Placeholder
        config.circuitBreaker.failureThreshold,
        config.circuitBreaker.recoveryTimeout
      )
    );

    // Setup circuit breaker for Stripe calls
    this.circuitBreakers.set(
      'stripe',
      this.createCircuitBreaker(
        async () => {
          throw new Error('Circuit breaker test');
        }, // Placeholder
        config.circuitBreaker.failureThreshold,
        config.circuitBreaker.recoveryTimeout
      )
    );
  }

  private async preloadConfiguration(): Promise<void> {
    try {
      // Cache subscription plans configuration
      const cacheKey = 'subscription:plans';
      await this.cache.set(cacheKey, SUBSCRIPTION_PLANS, 24 * 60 * 60 * 1000); // Cache for 24 hours
    } catch (_error) {
      console.warn('[SubscriptionService] Failed to preload configuration:', _error);
    }
  }

  private setupPeriodicCleanup(): void {
    // Run cleanup every hour
    setInterval(
      () => {
        this.performPeriodicCleanup();
      },
      60 * 60 * 1000
    );
  }

  private async performPeriodicCleanup(): Promise<void> {
    try {
      // Clean up expired rate limit entries
      const now = Date.now();
      for (const [key, data] of this.rateLimitTracker.entries()) {
        if (now > data.resetTime) {
          this.rateLimitTracker.delete(key);
        }
      }

      // Clean up old cache entries would be handled by CacheManager
    } catch (_error) {
      console.warn('[SubscriptionService] Periodic cleanup _error:', _error);
    }
  }

  private checkRateLimit(action: string, userId: string): boolean {
    const config = this._config as SubscriptionServiceConfig;
    const key = `${action}:${userId}`;
    const now = Date.now();

    const existing = this.rateLimitTracker.get(key);
    if (!existing || now > existing.resetTime) {
      // Reset or create new tracking
      this.rateLimitTracker.set(key, {
        count: 1,
        resetTime: now + _config.rateLimit.windowMs,
      });
      return true;
    }

    if (existing.count >= _config.rateLimit.maxRequests) {
      this.recordMetric('rate_limit_exceeded', 1, { action, userId });
      return false;
    }

    existing.count++;
    return true;
  }

  private async executeWithCircuitBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      return await circuitBreaker();
    }

    // Fallback to direct execution if no circuit breaker
    return await operation();
  }

  private async checkServiceHealth(
    serviceName: string,
    healthCheck: () => Promise<boolean>
  ): Promise<ServiceHealth['dependencies'][0]> {
    const startTime = Date.now();

    try {
      const isHealthy = await healthCheck();
      const responseTime = Date.now() - startTime;

      return {
        name: serviceName,
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        lastCheck: new Date(),
      };
    } catch (_error) {
      return {
        name: serviceName,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
      };
    }
  }

  private validateSubscriptionData(data: Partial<Subscription>): void {
    if (!data.userId) {
      throw new Error('User ID is required');
    }

    if (data.tier && !['free', 'basic', 'premium', 'pro'].includes(data.tier)) {
      throw new Error('Invalid subscription tier');
    }

    if (
      data.status &&
      !['active', 'canceled', 'past_due', 'unpaid'].includes(data.status)
    ) {
      throw new Error('Invalid subscription status');
    }
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async fetchSubscriptionFromDatabase(
    userId: string
  ): Promise<Subscription | null> {
    if (!this.dependencies.supabaseService) {
      return null;
    }

    const { data, _error } = await this.dependencies.supabaseService
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && _error.code !== 'PGRST116') {
      throw new Error(`Failed to get subscription: ${_error.message}`);
    }

    if (!data) return null;

    return {
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
      stripePriceId: data.stripe_price_id,
    };
  }

  private async fetchSubscriptionByIdFromDatabase(
    id: string
  ): Promise<Subscription | null> {
    if (!this.dependencies.supabaseService) {
      return null;
    }

    const { data, _error } = await this.dependencies.supabaseService
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error && _error.code !== 'PGRST116') {
      throw new Error(`Failed to get subscription by ID: ${_error.message}`);
    }

    if (!data) return null;

    return {
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
      stripePriceId: data.stripe_price_id,
    };
  }

  private async saveSubscriptionToDatabase(subscription: Subscription): Promise<void> {
    if (!this.dependencies.supabaseService) {
      throw new Error('Supabase service not available');
    }

    const { _error } = await this.dependencies.supabaseService
      .from('subscriptions')
      .upsert([
        {
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
          stripe_price_id: subscription.stripePriceId,
        },
      ]);

    if (_error) {
      throw new Error(`Failed to save subscription: ${_error.message}`);
    }
  }

  private async fetchUsageFromDatabase(
    userId: string,
    month: string
  ): Promise<PremiumUsage | null> {
    if (!this.dependencies.supabaseService) {
      return null;
    }

    const { data, _error } = await this.dependencies.supabaseService
      .from('premium_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .single();

    if (error && _error.code !== 'PGRST116') {
      throw new Error(`Failed to get usage: ${_error.message}`);
    }

    if (!data) return null;

    return {
      userId: data.user_id,
      month: data.month,
      elevenlabsApiCalls: data.elevenlabs_api_calls,
      aiInsightsGenerated: data.ai_insights_generated,
      customVoiceMessages: data.custom_voice_messages,
      premiumThemesUsed: data.premium_themes_used,
      lastUpdated: new Date(data.last_updated),
    };
  }

  private async incrementUsageInDatabase(
    userId: string,
    month: string,
    feature: string,
    increment: number
  ): Promise<void> {
    if (!this.dependencies.supabaseService) {
      throw new Error('Supabase service not available');
    }

    const { _error } = await this.dependencies.supabaseService.rpc(
      'increment_premium_usage',
      {
        p_user_id: userId,
        p_month: month,
        p_feature: feature,
        p_increment: increment,
      }
    );

    if (_error) {
      throw new Error(`Failed to increment usage: ${_error.message}`);
    }
  }

  private async invalidateUserCaches(userId: string): Promise<void> {
    try {
      // Clear subscription cache
      await this.cache.delete(`subscription:${userId}`);

      // Clear usage cache for current month
      const currentMonth = new Date().toISOString().slice(0, 7);
      await this.cache.delete(`usage:${userId}:${currentMonth}`);

      // Clear feature access cache
      await this.cache.delete(`feature-access:${userId}`);
    } catch (_error) {
      console.warn('[SubscriptionService] Failed to invalidate _user caches:', _error);
    }
  }

  private async trackSubscriptionEvent(
    _event: string,
    subscription: Subscription,
    changes?: any
  ): Promise<void> {
    if (!(this._config as SubscriptionServiceConfig).enableAnalytics) return;

    try {
      if (this.dependencies.analyticsService) {
        await this.dependencies.analyticsService.track(_event, {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          tier: subscription.tier,
          status: subscription.status,
          changes,
        });
      }
    } catch (_error) {
      console.warn('[SubscriptionService] Failed to track analytics _event:', _error);
    }
  }

  private async trackUsageEvent(_event: string, data: any): Promise<void> {
    if (!(this._config as SubscriptionServiceConfig).enableAnalytics) return;

    try {
      if (this.dependencies.analyticsService) {
        await this.dependencies.analyticsService.track(_event, data);
      }
    } catch (_error) {
      console.warn('[SubscriptionService] Failed to track usage _event:', _error);
    }
  }

  private getRateLimitedRequestsCount(): number {
    return Array.from(this.rateLimitTracker.values()).filter(
      data =>
        data.count >= (this._config as SubscriptionServiceConfig).rateLimit.maxRequests
    ).length;
  }

  private getCircuitBreakerStatus(): Record<string, string> {
    // This would return the actual status of circuit breakers
    // For now, return a simple status
    return {
      supabase: 'closed',
      stripe: 'closed',
    };
  }

  // ============================================================================
  // Testing Support
  // ============================================================================

  public async reset(): Promise<void> {
    await super.reset();

    this.rateLimitTracker.clear();
    this.circuitBreakers.clear();
    await this.cache.clear();
  }

  public getTestState(): any {
    return {
      ...super.getTestState(),
      rateLimitTrackerSize: this.rateLimitTracker.size,
      circuitBreakerCount: this.circuitBreakers.size,
      cacheSize: this.cache.size?.() || 0,
    };
  }
}

// Factory function for dependency injection
export const createSubscriptionService = (
  dependencies: SubscriptionServiceDependencies,
  _config: SubscriptionServiceConfig
): EnhancedSubscriptionService => {
  return new EnhancedSubscriptionService(dependencies, _config);
};
