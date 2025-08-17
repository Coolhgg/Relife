import { SubscriptionService } from '../subscription';
import { ErrorHandler } from '../error-handler';
import { createClient } from '../supabase';
import type { 
  Subscription, 
  SubscriptionTier, 
  SubscriptionStatus,
  PremiumFeatureAccess,
  FeatureLimits,
  PremiumUsage,
  PremiumFeature
} from '../../types';
import { SUBSCRIPTION_LIMITS } from '../../types';
import { createTestUser, createTestSubscription } from '../../__tests__/factories/core-factories';
import { createTestPremiumFeature } from '../../__tests__/factories/premium-factories';
import { faker } from '@faker-js/faker';

// Mock dependencies
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  },
  createClient: jest.fn()
}));

jest.mock('../error-handler', () => ({
  ErrorHandler: {
    handle: jest.fn(),
    logError: jest.fn()
  }
}));

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
};

const mockSupabaseTable = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  neq: jest.fn(),
  gt: jest.fn(),
  gte: jest.fn(),
  lt: jest.fn(),
  lte: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  single: jest.fn()
};

// Mock data for testing
const mockSubscriptionData: Subscription[] = [
  {
    id: 'sub-1',
    userId: 'user-1',
    tier: 'premium',
    status: 'active',
    stripeSubscriptionId: 'stripe-sub-1',
    stripeCustomerId: 'cus-test1',
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2024-02-01'),
    cancelAtPeriodEnd: false,
    billingInterval: 'monthly',
    trialStart: null,
    trialEnd: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    features: ['premiumVoices', 'advancedAnalytics', 'unlimitedAlarms']
  },
  {
    id: 'sub-2',
    userId: 'user-2',
    tier: 'pro',
    status: 'active',
    stripeSubscriptionId: 'stripe-sub-2',
    stripeCustomerId: 'cus-test2',
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2024-02-01'),
    cancelAtPeriodEnd: false,
    billingInterval: 'yearly',
    trialStart: null,
    trialEnd: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    features: ['allPremiumFeatures', 'prioritySupport', 'betaAccess']
  }
];

const mockUsageData = {
  'user-1': {
    id: 'usage-1',
    userId: 'user-1',
    period: '2024-01',
    voiceGenerations: 45,
    alarmCreations: 12,
    analyticsViews: 23,
    customThemes: 5,
    aiInteractions: 18,
    lastUpdated: new Date('2024-01-15')
  },
  'user-2': {
    id: 'usage-2',
    userId: 'user-2',
    period: '2024-01',
    voiceGenerations: 150,
    alarmCreations: 35,
    analyticsViews: 89,
    customThemes: 15,
    aiInteractions: 67,
    lastUpdated: new Date('2024-01-15')
  }
};

describe('SubscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset service cache
    SubscriptionService.clearCache();
    
    // Setup default mocks
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    
    // Setup table chain mocks
    mockSupabaseClient.from.mockReturnValue(mockSupabaseTable);
    mockSupabaseTable.select.mockReturnValue(mockSupabaseTable);
    mockSupabaseTable.eq.mockReturnValue(mockSupabaseTable);
    mockSupabaseTable.neq.mockReturnValue(mockSupabaseTable);
    mockSupabaseTable.gt.mockReturnValue(mockSupabaseTable);
    mockSupabaseTable.gte.mockReturnValue(mockSupabaseTable);
    mockSupabaseTable.lt.mockReturnValue(mockSupabaseTable);
    mockSupabaseTable.lte.mockReturnValue(mockSupabaseTable);
    mockSupabaseTable.order.mockReturnValue(mockSupabaseTable);
    mockSupabaseTable.limit.mockReturnValue(mockSupabaseTable);
    mockSupabaseTable.insert.mockReturnValue(mockSupabaseTable);
    mockSupabaseTable.update.mockReturnValue(mockSupabaseTable);
    mockSupabaseTable.upsert.mockReturnValue(mockSupabaseTable);
    mockSupabaseTable.delete.mockReturnValue(mockSupabaseTable);
  });

  describe('getUserSubscription', () => {
    it('should retrieve user subscription successfully', async () => {
      const userId = 'user-1';
      const expectedSubscription = mockSubscriptionData[0];
      
      mockSupabaseTable.single.mockResolvedValue({
        data: expectedSubscription,
        error: null
      });

      const result = await SubscriptionService.getUserSubscription(userId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('subscriptions');
      expect(mockSupabaseTable.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseTable.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockSupabaseTable.eq).toHaveBeenCalledWith('status', 'active');
      expect(result).toEqual(expectedSubscription);
    });

    it('should handle user with no subscription', async () => {
      const userId = 'user-without-sub';
      
      mockSupabaseTable.single.mockResolvedValue({
        data: null,
        error: { message: 'No subscription found' }
      });

      const result = await SubscriptionService.getUserSubscription(userId);

      expect(result).toBeNull();
    });

    it('should return cached subscription on second call', async () => {
      const userId = 'user-1';
      const expectedSubscription = mockSubscriptionData[0];
      
      mockSupabaseTable.single.mockResolvedValue({
        data: expectedSubscription,
        error: null
      });

      // First call
      await SubscriptionService.getUserSubscription(userId);
      
      // Second call
      await SubscriptionService.getUserSubscription(userId);

      // Should only call database once due to caching
      expect(mockSupabaseTable.single).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors gracefully', async () => {
      const userId = 'user-1';
      
      mockSupabaseTable.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const result = await SubscriptionService.getUserSubscription(userId);

      expect(result).toBeNull();
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });

    it('should handle service unavailable scenario', async () => {
      (createClient as jest.Mock).mockReturnValue(null);

      const result = await SubscriptionService.getUserSubscription('user-1');

      expect(result).toBeNull();
    });
  });

  describe('getUserTier', () => {
    it('should return correct tier for premium user', async () => {
      const userId = 'user-1';
      
      mockSupabaseTable.single.mockResolvedValue({
        data: mockSubscriptionData[0],
        error: null
      });

      const tier = await SubscriptionService.getUserTier(userId);

      expect(tier).toBe('premium');
    });

    it('should return correct tier for pro user', async () => {
      const userId = 'user-2';
      
      mockSupabaseTable.single.mockResolvedValue({
        data: mockSubscriptionData[1],
        error: null
      });

      const tier = await SubscriptionService.getUserTier(userId);

      expect(tier).toBe('pro');
    });

    it('should return free tier for user without subscription', async () => {
      const userId = 'user-free';
      
      mockSupabaseTable.single.mockResolvedValue({
        data: null,
        error: { message: 'No subscription' }
      });

      const tier = await SubscriptionService.getUserTier(userId);

      expect(tier).toBe('free');
    });

    it('should use cached subscription data', async () => {
      const userId = 'user-1';
      
      mockSupabaseTable.single.mockResolvedValue({
        data: mockSubscriptionData[0],
        error: null
      });

      // Call getUserSubscription first to populate cache
      await SubscriptionService.getUserSubscription(userId);
      
      // Clear mock call count
      mockSupabaseTable.single.mockClear();
      
      // Call getUserTier - should use cache
      const tier = await SubscriptionService.getUserTier(userId);

      expect(tier).toBe('premium');
      expect(mockSupabaseTable.single).not.toHaveBeenCalled();
    });
  });

  describe('getFeatureAccess', () => {
    it('should return correct feature access for premium tier', async () => {
      const userId = 'user-1';
      
      mockSupabaseTable.single.mockResolvedValue({
        data: mockSubscriptionData[0],
        error: null
      });

      const access = await SubscriptionService.getFeatureAccess(userId);

      expect(access).toBeDefined();
      expect(access.premiumVoices).toBe(true);
      expect(access.advancedAnalytics).toBe(true);
      expect(access.unlimitedAlarms).toBe(true);
    });

    it('should return correct feature access for pro tier', async () => {
      const userId = 'user-2';
      
      mockSupabaseTable.single.mockResolvedValue({
        data: mockSubscriptionData[1],
        error: null
      });

      const access = await SubscriptionService.getFeatureAccess(userId);

      expect(access).toBeDefined();
      expect(access.allPremiumFeatures).toBe(true);
      expect(access.prioritySupport).toBe(true);
      expect(access.betaAccess).toBe(true);
    });

    it('should return limited access for free tier', async () => {
      const userId = 'user-free';
      
      mockSupabaseTable.single.mockResolvedValue({
        data: null,
        error: null
      });

      const access = await SubscriptionService.getFeatureAccess(userId);

      expect(access).toBeDefined();
      expect(access.premiumVoices).toBe(false);
      expect(access.advancedAnalytics).toBe(false);
      expect(access.unlimitedAlarms).toBe(false);
    });
  });

  describe('getFeatureLimits', () => {
    it('should return correct limits for free tier', () => {
      const limits = SubscriptionService.getFeatureLimits('free');

      expect(limits).toEqual(SUBSCRIPTION_LIMITS.free);
      expect(limits.maxAlarms).toBe(5);
      expect(limits.voiceGenerationsPerMonth).toBe(50);
    });

    it('should return correct limits for premium tier', () => {
      const limits = SubscriptionService.getFeatureLimits('premium');

      expect(limits).toEqual(SUBSCRIPTION_LIMITS.premium);
      expect(limits.maxAlarms).toBe(50);
      expect(limits.voiceGenerationsPerMonth).toBe(500);
    });

    it('should return correct limits for pro tier', () => {
      const limits = SubscriptionService.getFeatureLimits('pro');

      expect(limits).toEqual(SUBSCRIPTION_LIMITS.pro);
      expect(limits.maxAlarms).toBeNull(); // unlimited
      expect(limits.voiceGenerationsPerMonth).toBeNull(); // unlimited
    });
  });

  describe('hasFeatureAccess', () => {
    it('should grant access to premium feature for premium user', async () => {
      const userId = 'user-1';
      const feature = 'premiumVoices';
      
      mockSupabaseTable.single.mockResolvedValue({
        data: mockSubscriptionData[0],
        error: null
      });

      const hasAccess = await SubscriptionService.hasFeatureAccess(userId, feature);

      expect(hasAccess).toBe(true);
    });

    it('should deny access to premium feature for free user', async () => {
      const userId = 'user-free';
      const feature = 'premiumVoices';
      
      mockSupabaseTable.single.mockResolvedValue({
        data: null,
        error: null
      });

      const hasAccess = await SubscriptionService.hasFeatureAccess(userId, feature);

      expect(hasAccess).toBe(false);
    });

    it('should grant access to basic features for all users', async () => {
      const userId = 'user-free';
      const feature = 'basicAlarms';
      
      mockSupabaseTable.single.mockResolvedValue({
        data: null,
        error: null
      });

      const hasAccess = await SubscriptionService.hasFeatureAccess(userId, feature);

      expect(hasAccess).toBe(true);
    });
  });

  describe('checkFeatureUsage', () => {
    it('should allow usage within limits', async () => {
      const userId = 'user-1';
      const feature = 'voiceGenerations';
      const requestedAmount = 5;

      // Mock subscription
      mockSupabaseTable.single.mockResolvedValueOnce({
        data: mockSubscriptionData[0],
        error: null
      });

      // Mock current usage
      mockSupabaseTable.single.mockResolvedValueOnce({
        data: mockUsageData[userId],
        error: null
      });

      const result = await SubscriptionService.checkFeatureUsage(userId, feature, requestedAmount);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('should deny usage when over limits', async () => {
      const userId = 'user-1';
      const feature = 'voiceGenerations';
      const requestedAmount = 1000; // Way over premium limit

      // Mock subscription
      mockSupabaseTable.single.mockResolvedValueOnce({
        data: mockSubscriptionData[0],
        error: null
      });

      // Mock current usage (high usage)
      mockSupabaseTable.single.mockResolvedValueOnce({
        data: {
          ...mockUsageData[userId],
          voiceGenerations: 495 // Close to premium limit of 500
        },
        error: null
      });

      const result = await SubscriptionService.checkFeatureUsage(userId, feature, requestedAmount);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('limit exceeded');
    });

    it('should allow unlimited usage for pro tier', async () => {
      const userId = 'user-2';
      const feature = 'voiceGenerations';
      const requestedAmount = 10000;

      // Mock pro subscription
      mockSupabaseTable.single.mockResolvedValueOnce({
        data: mockSubscriptionData[1],
        error: null
      });

      // Mock high usage
      mockSupabaseTable.single.mockResolvedValueOnce({
        data: {
          ...mockUsageData[userId],
          voiceGenerations: 9999
        },
        error: null
      });

      const result = await SubscriptionService.checkFeatureUsage(userId, feature, requestedAmount);

      expect(result.allowed).toBe(true);
    });
  });

  describe('getCurrentUsage', () => {
    it('should retrieve current usage successfully', async () => {
      const userId = 'user-1';
      const expectedUsage = mockUsageData[userId];
      
      mockSupabaseTable.single.mockResolvedValue({
        data: expectedUsage,
        error: null
      });

      const usage = await SubscriptionService.getCurrentUsage(userId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('premium_usage');
      expect(mockSupabaseTable.eq).toHaveBeenCalledWith('user_id', userId);
      expect(usage).toEqual(expectedUsage);
    });

    it('should handle user with no usage data', async () => {
      const userId = 'new-user';
      
      mockSupabaseTable.single.mockResolvedValue({
        data: null,
        error: { message: 'No usage data' }
      });

      const usage = await SubscriptionService.getCurrentUsage(userId);

      expect(usage).toBeNull();
    });

    it('should cache usage data', async () => {
      const userId = 'user-1';
      const expectedUsage = mockUsageData[userId];
      
      mockSupabaseTable.single.mockResolvedValue({
        data: expectedUsage,
        error: null
      });

      // First call
      await SubscriptionService.getCurrentUsage(userId);
      
      // Second call
      await SubscriptionService.getCurrentUsage(userId);

      // Should only query database once
      expect(mockSupabaseTable.single).toHaveBeenCalledTimes(1);
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage successfully', async () => {
      const userId = 'user-1';
      const feature = 'voiceGenerations';
      const amount = 5;

      const updatedUsage = {
        ...mockUsageData[userId],
        voiceGenerations: mockUsageData[userId].voiceGenerations + amount
      };

      mockSupabaseTable.single.mockResolvedValue({
        data: updatedUsage,
        error: null
      });

      await SubscriptionService.incrementUsage(userId, feature, amount);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('premium_usage');
      expect(mockSupabaseTable.upsert).toHaveBeenCalled();
    });

    it('should create new usage record if none exists', async () => {
      const userId = 'new-user';
      const feature = 'voiceGenerations';
      const amount = 1;

      const newUsage = {
        id: 'usage-new',
        userId: userId,
        period: '2024-01',
        voiceGenerations: amount,
        alarmCreations: 0,
        analyticsViews: 0,
        customThemes: 0,
        aiInteractions: 0,
        lastUpdated: expect.any(Date)
      };

      mockSupabaseTable.single.mockResolvedValue({
        data: newUsage,
        error: null
      });

      await SubscriptionService.incrementUsage(userId, feature, amount);

      expect(mockSupabaseTable.upsert).toHaveBeenCalled();
    });

    it('should handle increment errors gracefully', async () => {
      const userId = 'user-1';
      const feature = 'voiceGenerations';
      const amount = 5;

      mockSupabaseTable.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      });

      await expect(SubscriptionService.incrementUsage(userId, feature, amount))
        .rejects.toThrow();

      expect(ErrorHandler.handle).toHaveBeenCalled();
    });
  });

  describe('upsertSubscription', () => {
    it('should create new subscription successfully', async () => {
      const newSubscription = createTestSubscription({
        userId: 'new-user',
        tier: 'premium',
        status: 'active'
      });

      mockSupabaseTable.single.mockResolvedValue({
        data: newSubscription,
        error: null
      });

      await SubscriptionService.upsertSubscription(newSubscription);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('subscriptions');
      expect(mockSupabaseTable.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: newSubscription.userId,
          tier: newSubscription.tier,
          status: newSubscription.status
        })
      );
    });

    it('should update existing subscription successfully', async () => {
      const updatedSubscription = {
        ...mockSubscriptionData[0],
        tier: 'pro' as SubscriptionTier
      };

      mockSupabaseTable.single.mockResolvedValue({
        data: updatedSubscription,
        error: null
      });

      await SubscriptionService.upsertSubscription(updatedSubscription);

      expect(mockSupabaseTable.upsert).toHaveBeenCalled();
    });

    it('should handle upsert errors', async () => {
      const subscription = mockSubscriptionData[0];

      mockSupabaseTable.single.mockResolvedValue({
        data: null,
        error: { message: 'Upsert failed' }
      });

      await expect(SubscriptionService.upsertSubscription(subscription))
        .rejects.toThrow('Failed to upsert subscription');
    });

    it('should invalidate cache after upsert', async () => {
      const subscription = mockSubscriptionData[0];

      // First, get subscription to populate cache
      mockSupabaseTable.single
        .mockResolvedValueOnce({ data: subscription, error: null })
        .mockResolvedValueOnce({ data: subscription, error: null });

      await SubscriptionService.getUserSubscription(subscription.userId);
      await SubscriptionService.upsertSubscription(subscription);

      // Next call should query database again (cache invalidated)
      mockSupabaseTable.single.mockResolvedValueOnce({
        data: subscription,
        error: null
      });

      await SubscriptionService.getUserSubscription(subscription.userId);

      expect(mockSupabaseTable.single).toHaveBeenCalledTimes(3);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription at period end', async () => {
      const userId = 'user-1';
      const cancelAtPeriodEnd = true;

      const cancelledSubscription = {
        ...mockSubscriptionData[0],
        cancelAtPeriodEnd: true
      };

      mockSupabaseTable.single.mockResolvedValue({
        data: cancelledSubscription,
        error: null
      });

      await SubscriptionService.cancelSubscription(userId, cancelAtPeriodEnd);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('subscriptions');
      expect(mockSupabaseTable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          cancel_at_period_end: true,
          status: 'active'
        })
      );
    });

    it('should cancel subscription immediately', async () => {
      const userId = 'user-1';
      const cancelAtPeriodEnd = false;

      const cancelledSubscription = {
        ...mockSubscriptionData[0],
        status: 'cancelled' as SubscriptionStatus
      };

      mockSupabaseTable.single.mockResolvedValue({
        data: cancelledSubscription,
        error: null
      });

      await SubscriptionService.cancelSubscription(userId, cancelAtPeriodEnd);

      expect(mockSupabaseTable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'cancelled',
          cancelled_at: expect.any(String)
        })
      );
    });

    it('should handle cancellation errors', async () => {
      const userId = 'user-1';

      mockSupabaseTable.single.mockResolvedValue({
        data: null,
        error: { message: 'Cancellation failed' }
      });

      await expect(SubscriptionService.cancelSubscription(userId))
        .rejects.toThrow('Failed to cancel subscription');
    });
  });

  describe('getSubscriptionAnalytics', () => {
    it('should retrieve subscription analytics successfully', async () => {
      const mockAnalytics = {
        totalSubscriptions: 150,
        activeSubscriptions: 120,
        trialSubscriptions: 25,
        cancelledSubscriptions: 30,
        revenue: {
          monthly: 15000,
          yearly: 180000
        },
        tierDistribution: {
          free: 1000,
          premium: 100,
          pro: 50
        },
        churnRate: 0.05
      };

      mockSupabaseTable.single.mockResolvedValue({
        data: mockAnalytics,
        error: null
      });

      const analytics = await SubscriptionService.getSubscriptionAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics.totalSubscriptions).toBe(150);
      expect(analytics.activeSubscriptions).toBe(120);
    });

    it('should handle analytics query errors', async () => {
      mockSupabaseTable.single.mockResolvedValue({
        data: null,
        error: { message: 'Analytics query failed' }
      });

      await expect(SubscriptionService.getSubscriptionAnalytics())
        .rejects.toThrow();
    });
  });

  describe('trial management', () => {
    it('should identify user in trial correctly', async () => {
      const userId = 'trial-user';
      const trialSubscription = createTestSubscription({
        userId,
        tier: 'premium',
        status: 'trialing',
        trialStart: new Date('2024-01-01'),
        trialEnd: new Date('2024-01-15')
      });

      mockSupabaseTable.single.mockResolvedValue({
        data: trialSubscription,
        error: null
      });

      const isInTrial = await SubscriptionService.isUserInTrial(userId);

      expect(isInTrial).toBe(true);
    });

    it('should identify user not in trial correctly', async () => {
      const userId = 'user-1';

      mockSupabaseTable.single.mockResolvedValue({
        data: mockSubscriptionData[0], // active, not trial
        error: null
      });

      const isInTrial = await SubscriptionService.isUserInTrial(userId);

      expect(isInTrial).toBe(false);
    });

    it('should calculate trial days remaining correctly', async () => {
      const userId = 'trial-user';
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const trialSubscription = createTestSubscription({
        userId,
        tier: 'premium',
        status: 'trialing',
        trialStart: new Date(),
        trialEnd: futureDate
      });

      mockSupabaseTable.single.mockResolvedValue({
        data: trialSubscription,
        error: null
      });

      const daysRemaining = await SubscriptionService.getTrialDaysRemaining(userId);

      expect(daysRemaining).toBe(7);
    });

    it('should return 0 days for expired trial', async () => {
      const userId = 'expired-trial-user';
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5); // 5 days ago

      const expiredTrialSubscription = createTestSubscription({
        userId,
        tier: 'premium',
        status: 'trialing',
        trialStart: new Date('2024-01-01'),
        trialEnd: pastDate
      });

      mockSupabaseTable.single.mockResolvedValue({
        data: expiredTrialSubscription,
        error: null
      });

      const daysRemaining = await SubscriptionService.getTrialDaysRemaining(userId);

      expect(daysRemaining).toBe(0);
    });
  });

  describe('cache management', () => {
    it('should clear all caches successfully', () => {
      const userId = 'user-1';

      // Populate cache with mock data
      SubscriptionService['setCachedData'](`subscription_${userId}`, mockSubscriptionData[0]);
      SubscriptionService['setCachedData'](`usage_${userId}`, mockUsageData[userId]);

      SubscriptionService.clearCache();

      // Verify cache is cleared
      const cachedSubscription = SubscriptionService['getCachedData'](`subscription_${userId}`);
      const cachedUsage = SubscriptionService['getCachedData'](`usage_${userId}`);

      expect(cachedSubscription).toBeNull();
      expect(cachedUsage).toBeNull();
    });

    it('should respect cache expiry', async () => {
      const userId = 'user-1';
      const subscription = mockSubscriptionData[0];

      // Set cache with very short duration
      SubscriptionService['setCachedData'](`subscription_${userId}`, subscription, 10); // 10ms

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 20));

      const cached = SubscriptionService['getCachedData'](`subscription_${userId}`);
      expect(cached).toBeNull();
    });

    it('should use valid cached data within expiry', () => {
      const userId = 'user-1';
      const subscription = mockSubscriptionData[0];

      // Set cache with long duration
      SubscriptionService['setCachedData'](`subscription_${userId}`, subscription, 60000); // 1 minute

      const cached = SubscriptionService['getCachedData'](`subscription_${userId}`);
      expect(cached).toEqual(subscription);
    });

    it('should invalidate specific cache entries', () => {
      const userId = 'user-1';
      const subscription = mockSubscriptionData[0];
      const usage = mockUsageData[userId];

      // Populate cache
      SubscriptionService['setCachedData'](`subscription_${userId}`, subscription);
      SubscriptionService['setCachedData'](`usage_${userId}`, usage);

      // Invalidate subscription cache only
      SubscriptionService['invalidateCache'](`subscription_${userId}`);

      // Check results
      const cachedSubscription = SubscriptionService['getCachedData'](`subscription_${userId}`);
      const cachedUsage = SubscriptionService['getCachedData'](`usage_${userId}`);

      expect(cachedSubscription).toBeNull();
      expect(cachedUsage).toEqual(usage);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle service unavailable gracefully', async () => {
      (createClient as jest.Mock).mockReturnValue(null);

      const subscription = await SubscriptionService.getUserSubscription('user-1');
      const tier = await SubscriptionService.getUserTier('user-1');
      const usage = await SubscriptionService.getCurrentUsage('user-1');

      expect(subscription).toBeNull();
      expect(tier).toBe('free');
      expect(usage).toBeNull();
    });

    it('should handle network timeouts', async () => {
      const userId = 'user-1';

      mockSupabaseTable.single.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const result = await SubscriptionService.getUserSubscription(userId);

      expect(result).toBeNull();
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });

    it('should handle malformed subscription data', async () => {
      const userId = 'user-1';

      mockSupabaseTable.single.mockResolvedValue({
        data: { invalid: 'data' },
        error: null
      });

      const subscription = await SubscriptionService.getUserSubscription(userId);
      const tier = await SubscriptionService.getUserTier(userId);

      // Should handle gracefully and return defaults
      expect(tier).toBe('free');
    });

    it('should handle concurrent subscription updates', async () => {
      const userId = 'user-1';
      const subscription1 = createTestSubscription({ userId, tier: 'premium' });
      const subscription2 = createTestSubscription({ userId, tier: 'pro' });

      mockSupabaseTable.single
        .mockResolvedValueOnce({ data: subscription1, error: null })
        .mockResolvedValueOnce({ data: subscription2, error: null });

      // Concurrent upserts
      const promises = [
        SubscriptionService.upsertSubscription(subscription1),
        SubscriptionService.upsertSubscription(subscription2)
      ];

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should handle invalid feature names', async () => {
      const userId = 'user-1';
      const invalidFeature = 'nonexistentFeature';

      mockSupabaseTable.single.mockResolvedValue({
        data: mockSubscriptionData[0],
        error: null
      });

      const hasAccess = await SubscriptionService.hasFeatureAccess(userId, invalidFeature);

      expect(hasAccess).toBe(false);
    });

    it('should handle usage increment with invalid feature', async () => {
      const userId = 'user-1';
      const invalidFeature = 'invalidFeature';

      await expect(
        SubscriptionService.incrementUsage(userId, invalidFeature, 1)
      ).rejects.toThrow();
    });

    it('should handle subscription status edge cases', async () => {
      const userId = 'user-edge';
      const edgeCaseSubscription = createTestSubscription({
        userId,
        tier: 'premium',
        status: 'past_due' as SubscriptionStatus
      });

      mockSupabaseTable.single.mockResolvedValue({
        data: edgeCaseSubscription,
        error: null
      });

      const tier = await SubscriptionService.getUserTier(userId);
      const hasAccess = await SubscriptionService.hasFeatureAccess(userId, 'premiumVoices');

      // Past due should be treated as active for features but may have restrictions
      expect(tier).toBe('premium');
    });
  });

  describe('performance and optimization', () => {
    it('should batch multiple subscription queries efficiently', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      
      mockSupabaseTable.single
        .mockResolvedValueOnce({ data: mockSubscriptionData[0], error: null })
        .mockResolvedValueOnce({ data: mockSubscriptionData[1], error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const promises = userIds.map(userId => 
        SubscriptionService.getUserSubscription(userId)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(mockSubscriptionData[0]);
      expect(results[1]).toEqual(mockSubscriptionData[1]);
      expect(results[2]).toBeNull();
    });

    it('should handle high-frequency usage updates', async () => {
      const userId = 'user-1';
      const feature = 'voiceGenerations';

      // Mock successful updates
      for (let i = 0; i < 10; i++) {
        mockSupabaseTable.single.mockResolvedValueOnce({
          data: { ...mockUsageData[userId], voiceGenerations: i + 1 },
          error: null
        });
      }

      // Rapid concurrent updates
      const promises = Array(10).fill(null).map((_, i) =>
        SubscriptionService.incrementUsage(userId, feature, 1)
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should efficiently handle repeated feature access checks', async () => {
      const userId = 'user-1';
      const feature = 'premiumVoices';

      mockSupabaseTable.single.mockResolvedValue({
        data: mockSubscriptionData[0],
        error: null
      });

      // Multiple access checks - should use cache
      await SubscriptionService.hasFeatureAccess(userId, feature);
      await SubscriptionService.hasFeatureAccess(userId, feature);
      await SubscriptionService.hasFeatureAccess(userId, feature);

      // Should only query once due to caching
      expect(mockSupabaseTable.single).toHaveBeenCalledTimes(1);
    });
  });
});