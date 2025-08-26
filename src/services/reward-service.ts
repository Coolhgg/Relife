/**
 * Comprehensive Reward Service
 *
 * Main service for the reward system that integrates:
 * - Database persistence (PostgreSQL)
 * - AI-driven behavior analysis
 * - User progress tracking
 * - Achievement unlocking
 * - Gift management
 * - Analytics tracking
 *
 * @version 1.0.0
 * @author Scout AI
 */

import type {
  Reward,
  UserReward,
  GiftCatalog,
  UserGiftInventory,
  UserAIInsight,
  UserHabit,
  UserNicheProfile,
  UserRewardAnalytics,
  RewardSystem,
  RewardType,
  RewardCategory,
  RewardRarity,
  GiftType,
  UserNiche,
  AIInsightType,
  InsightPriority,
  RewardFilter,
  RewardQuery,
  RewardNotification,
  RewardEvent,
} from '../types/reward-system';
import { AIRewardsService } from './ai-rewards';
import AnalyticsService from './analytics';
import { supabase } from './supabase';

interface DatabaseConnection {
  client: typeof supabase;
  isConnected: boolean;
  lastError: string | null;
}

interface ServiceConfig {
  enableAnalytics: boolean;
  enableAIInsights: boolean;
  enableNotifications: boolean;
  debugMode: boolean;
  aiAnalysisInterval: number; // milliseconds
  batchSize: number;
}

interface RewardServiceEvents {
  'reward:unlocked': (reward: UserReward) => void;
  'gift:unlocked': (gift: UserGiftInventory) => void;
  'milestone:reached': (milestone: UserRewardAnalytics) => void;
  'streak:updated': (streak: UserHabit) => void;
  'niche:identified': (niche: UserNicheProfile) => void;
  'insight:generated': (insight: UserAIInsight) => void;
  'error:occurred': (error: Error) => void;
}

export class RewardService implements RewardSystem {
  private static instance: RewardService;
  private db: DatabaseConnection;
  private aiService: AIRewardsService;
  private analytics: AnalyticsService;
  private config: ServiceConfig;
  private eventListeners: Map<keyof RewardServiceEvents, Function[]> = new Map();
  private isInitialized = false;
  private cache = {
    rewards: new Map<string, Reward>(),
    userRewards: new Map<string, UserReward[]>(),
    gifts: new Map<string, GiftCatalog>(),
    userInventory: new Map<string, UserGiftInventory[]>(),
  };

  private constructor() {
    this.db = {
      client: supabase,
      isConnected: false,
      lastError: null,
    };
    this.aiService = AIRewardsService.getInstance();
    this.analytics = AnalyticsService.getInstance();
    this.config = {
      enableAnalytics: true,
      enableAIInsights: true,
      enableNotifications: true,
      debugMode: process.env.NODE_ENV === 'development',
      aiAnalysisInterval: 5 * 60 * 1000, // 5 minutes
      batchSize: 50,
    };
  }

  static getInstance(): RewardService {
    if (!RewardService.instance) {
      RewardService.instance = new RewardService();
    }
    return RewardService.instance;
  }

  /**
   * Initialize the reward service
   */
  async initialize(customConfig?: Partial<ServiceConfig>): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Merge configuration
      this.config = { ...this.config, ...customConfig };

      // Test database connection
      await this.testDatabaseConnection();

      // Initialize AI service
      if (this.config.enableAIInsights) {
        // AI service is already initialized as singleton
      }

      // Initialize analytics if enabled
      if (this.config.enableAnalytics) {
        this.analytics.track('reward_service_initialized', {
          config: this.config,
          timestamp: new Date().toISOString(),
        });
      }

      // Load initial data into cache
      await this.preloadCache();

      this.isInitialized = true;

      this.log('Reward service initialized successfully');
    } catch (error) {
      this.handleError(error as Error, 'Failed to initialize reward service');
      throw error;
    }
  }

  /**
   * Test database connection
   */
  private async testDatabaseConnection(): Promise<void> {
    try {
      const { data, error } = await this.db.client
        .from('rewards')
        .select('id')
        .limit(1);

      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }

      this.db.isConnected = true;
      this.db.lastError = null;
      this.log('Database connection established');
    } catch (error) {
      this.db.isConnected = false;
      this.db.lastError = (error as Error).message;
      throw error;
    }
  }

  /**
   * Preload essential data into cache
   */
  private async preloadCache(): Promise<void> {
    try {
      // Load all rewards
      const { data: rewards, error: rewardsError } = await this.db.client
        .from('rewards')
        .select('*');

      if (rewardsError) {
        throw new Error(`Failed to load rewards: ${rewardsError.message}`);
      }

      rewards?.forEach(reward => {
        this.cache.rewards.set(reward.id, reward);
      });

      // Load all gifts
      const { data: gifts, error: giftsError } = await this.db.client
        .from('gift_catalog')
        .select('*');

      if (giftsError) {
        throw new Error(`Failed to load gifts: ${giftsError.message}`);
      }

      gifts?.forEach(gift => {
        this.cache.gifts.set(gift.id, gift);
      });

      this.log(
        `Loaded ${rewards?.length || 0} rewards and ${gifts?.length || 0} gifts into cache`
      );
    } catch (error) {
      this.handleError(error as Error, 'Failed to preload cache');
      throw error;
    }
  }

  // ========================================
  // Reward Management
  // ========================================

  /**
   * Get all available rewards with optional filtering
   */
  async getRewards(filter?: RewardFilter): Promise<Reward[]> {
    try {
      let query = this.db.client.from('rewards').select('*');

      // Apply filters
      if (filter?.category) {
        query = query.eq('category', filter.category);
      }
      if (filter?.type) {
        query = query.eq('type', filter.type);
      }
      if (filter?.rarity) {
        query = query.eq('rarity', filter.rarity);
      }
      if (filter?.isActive !== undefined) {
        query = query.eq('is_active', filter.isActive);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch rewards: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      this.handleError(error as Error, 'Failed to get rewards');
      return [];
    }
  }

  /**
   * Get user's unlocked rewards
   */
  async getUserRewards(userId: string, filter?: RewardFilter): Promise<UserReward[]> {
    try {
      // Check cache first
      const cacheKey = `${userId}:${JSON.stringify(filter || {})}`;
      if (this.cache.userRewards.has(cacheKey)) {
        return this.cache.userRewards.get(cacheKey)!;
      }

      let query = this.db.client
        .from('user_rewards')
        .select(
          `
          *,
          reward:rewards(*)
        `
        )
        .eq('user_id', userId);

      // Apply filters
      if (filter?.category) {
        query = query.eq('rewards.category', filter.category);
      }
      if (filter?.isViewed !== undefined) {
        query = query.eq('is_viewed', filter.isViewed);
      }

      const { data, error } = await query.order('unlocked_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch user rewards: ${error.message}`);
      }

      const userRewards = data || [];
      this.cache.userRewards.set(cacheKey, userRewards);

      return userRewards;
    } catch (error) {
      this.handleError(error as Error, 'Failed to get user rewards');
      return [];
    }
  }

  /**
   * Check and unlock rewards for a user based on their activity
   */
  async checkAndUnlockRewards(
    userId: string,
    activityData: unknown
  ): Promise<UserReward[]> {
    try {
      // Get AI recommendations for potential rewards
      const potentialRewards = await this.aiService.analyzeAndRecommendRewards(
        userId,
        activityData
      );

      const unlockedRewards: UserReward[] = [];

      for (const rewardRec of potentialRewards) {
        // Check if user already has this reward
        const existingReward = await this.hasUserReward(userId, rewardRec.id);
        if (existingReward) {
          continue;
        }

        // Verify unlock conditions
        const canUnlock = await this.verifyUnlockConditions(
          userId,
          rewardRec.id,
          activityData
        );

        if (canUnlock) {
          const userReward = await this.unlockReward(userId, rewardRec.id, {
            context_data: rewardRec.context || {},
            unlock_reason: rewardRec.reason || 'Achievement unlocked',
          });

          if (userReward) {
            unlockedRewards.push(userReward);
          }
        }
      }

      return unlockedRewards;
    } catch (error) {
      this.handleError(error as Error, 'Failed to check and unlock rewards');
      return [];
    }
  }

  /**
   * Unlock a specific reward for a user
   */
  async unlockReward(
    userId: string,
    rewardId: string,
    metadata?: Record<string, unknown>
  ): Promise<UserReward | null> {
    try {
      // Get reward details
      const reward = await this.getRewardById(rewardId);
      if (!reward) {
        throw new Error(`Reward not found: ${rewardId}`);
      }

      // Check if user already has this reward
      const existingReward = await this.hasUserReward(userId, rewardId);
      if (existingReward) {
        this.log(`User ${userId} already has reward ${rewardId}`);
        return existingReward;
      }

      // Create user reward record
      const userRewardData = {
        user_id: userId,
        reward_id: rewardId,
        unlocked_at: new Date().toISOString(),
        is_viewed: false,
        context_data: metadata || {},
        points_earned: reward.points_value || 0,
      };

      const { data, error } = await this.db.client
        .from('user_rewards')
        .insert(userRewardData)
        .select(
          `
          *,
          reward:rewards(*)
        `
        )
        .single();

      if (error) {
        throw new Error(`Failed to unlock reward: ${error.message}`);
      }

      const userReward = data as UserReward;

      // Update user analytics
      await this.updateUserAnalytics(userId, {
        total_rewards: 1,
        total_points: reward.points_value || 0,
        last_reward_date: new Date().toISOString(),
      });

      // Clear cache
      this.clearUserCache(userId);

      // Emit event
      this.emit('reward:unlocked', userReward);

      // Track analytics
      if (this.config.enableAnalytics) {
        this.analytics.track('reward_unlocked', {
          user_id: userId,
          reward_id: rewardId,
          reward_category: reward.category,
          reward_type: reward.type,
          points_earned: reward.points_value,
          metadata,
        });
      }

      this.log(`Unlocked reward ${rewardId} for user ${userId}`);
      return userReward;
    } catch (error) {
      this.handleError(error as Error, 'Failed to unlock reward');
      return null;
    }
  }

  /**
   * Mark rewards as viewed
   */
  async markRewardsAsViewed(userId: string, rewardIds: string[]): Promise<boolean> {
    try {
      const { error } = await this.db.client
        .from('user_rewards')
        .update({ is_viewed: true })
        .eq('user_id', userId)
        .in('reward_id', rewardIds);

      if (error) {
        throw new Error(`Failed to mark rewards as viewed: ${error.message}`);
      }

      // Clear cache
      this.clearUserCache(userId);

      return true;
    } catch (error) {
      this.handleError(error as Error, 'Failed to mark rewards as viewed');
      return false;
    }
  }

  // ========================================
  // Gift Management
  // ========================================

  /**
   * Get all available gifts
   */
  async getGifts(filter?: {
    type?: GiftType;
    isActive?: boolean;
  }): Promise<GiftCatalog[]> {
    try {
      let query = this.db.client.from('gift_catalog').select('*');

      if (filter?.type) {
        query = query.eq('type', filter.type);
      }
      if (filter?.isActive !== undefined) {
        query = query.eq('is_active', filter.isActive);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch gifts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      this.handleError(error as Error, 'Failed to get gifts');
      return [];
    }
  }

  /**
   * Get user's gift inventory
   */
  async getUserGifts(userId: string): Promise<UserGiftInventory[]> {
    try {
      // Check cache first
      if (this.cache.userInventory.has(userId)) {
        return this.cache.userInventory.get(userId)!;
      }

      const { data, error } = await this.db.client
        .from('user_gift_inventory')
        .select(
          `
          *,
          gift:gift_catalog(*)
        `
        )
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch user gifts: ${error.message}`);
      }

      const userGifts = data || [];
      this.cache.userInventory.set(userId, userGifts);

      return userGifts;
    } catch (error) {
      this.handleError(error as Error, 'Failed to get user gifts');
      return [];
    }
  }

  /**
   * Unlock a gift for a user (either by points or premium currency)
   */
  async unlockGift(
    userId: string,
    giftId: string,
    paymentMethod: 'points' | 'premium',
    metadata?: Record<string, unknown>
  ): Promise<UserGiftInventory | null> {
    try {
      // Get gift details
      const gift = await this.getGiftById(giftId);
      if (!gift) {
        throw new Error(`Gift not found: ${giftId}`);
      }

      // Check if user already has this gift
      const existingGift = await this.hasUserGift(userId, giftId);
      if (existingGift) {
        this.log(`User ${userId} already has gift ${giftId}`);
        return existingGift;
      }

      // Verify user can afford the gift
      const canAfford = await this.verifyGiftAffordability(userId, gift, paymentMethod);
      if (!canAfford) {
        throw new Error(`User cannot afford gift ${giftId} with ${paymentMethod}`);
      }

      // Deduct cost from user balance
      await this.deductGiftCost(userId, gift, paymentMethod);

      // Create user gift record
      const userGiftData = {
        user_id: userId,
        gift_id: giftId,
        unlocked_at: new Date().toISOString(),
        is_equipped: false,
        payment_method: paymentMethod,
        cost_paid: paymentMethod === 'points' ? gift.cost_points : gift.cost_premium,
        metadata: metadata || {},
      };

      const { data, error } = await this.db.client
        .from('user_gift_inventory')
        .insert(userGiftData)
        .select(
          `
          *,
          gift:gift_catalog(*)
        `
        )
        .single();

      if (error) {
        throw new Error(`Failed to unlock gift: ${error.message}`);
      }

      const userGift = data as UserGiftInventory;

      // Clear cache
      this.cache.userInventory.delete(userId);

      // Emit event
      this.emit('gift:unlocked', userGift);

      // Track analytics
      if (this.config.enableAnalytics) {
        this.analytics.track('gift_unlocked', {
          user_id: userId,
          gift_id: giftId,
          gift_type: gift.type,
          payment_method: paymentMethod,
          cost_paid: userGiftData.cost_paid,
          metadata,
        });
      }

      this.log(`Unlocked gift ${giftId} for user ${userId} using ${paymentMethod}`);
      return userGift;
    } catch (error) {
      this.handleError(error as Error, 'Failed to unlock gift');
      return null;
    }
  }

  /**
   * Equip/unequip a gift
   */
  async equipGift(
    userId: string,
    giftId: string,
    equip: boolean = true
  ): Promise<boolean> {
    try {
      // First, if equipping, unequip other gifts of the same type
      if (equip) {
        const gift = await this.getGiftById(giftId);
        if (gift) {
          await this.db.client
            .from('user_gift_inventory')
            .update({ is_equipped: false })
            .eq('user_id', userId)
            .eq('gift.type', gift.type);
        }
      }

      // Update the specific gift
      const { error } = await this.db.client
        .from('user_gift_inventory')
        .update({ is_equipped: equip })
        .eq('user_id', userId)
        .eq('gift_id', giftId);

      if (error) {
        throw new Error(
          `Failed to ${equip ? 'equip' : 'unequip'} gift: ${error.message}`
        );
      }

      // Clear cache
      this.cache.userInventory.delete(userId);

      return true;
    } catch (error) {
      this.handleError(error as Error, 'Failed to equip gift');
      return false;
    }
  }

  // ========================================
  // AI Insights and Habits
  // ========================================

  /**
   * Generate AI insights for a user
   */
  async generateUserInsights(userId: string): Promise<UserAIInsight[]> {
    try {
      if (!this.config.enableAIInsights) {
        return [];
      }

      // Get user's alarm data and activity
      const insights = await this.aiService.generateInsights(userId);

      // Store insights in database
      const storedInsights: UserAIInsight[] = [];

      for (const insight of insights) {
        const insightData = {
          user_id: userId,
          insight_type: insight.type as AIInsightType,
          title: insight.title,
          description: insight.description,
          priority: insight.priority as InsightPriority,
          confidence_score: insight.confidence || 0.8,
          data_points: insight.dataPoints || {},
          recommendations: insight.recommendations || [],
          expires_at: insight.expiresAt || null,
          is_read: false,
        };

        const { data, error } = await this.db.client
          .from('user_ai_insights')
          .insert(insightData)
          .select()
          .single();

        if (!error && data) {
          storedInsights.push(data);
        }
      }

      // Emit event
      storedInsights.forEach(insight => {
        this.emit('insight:generated', insight);
      });

      return storedInsights;
    } catch (error) {
      this.handleError(error as Error, 'Failed to generate user insights');
      return [];
    }
  }

  /**
   * Get user's AI insights
   */
  async getUserInsights(userId: string, limit: number = 10): Promise<UserAIInsight[]> {
    try {
      const { data, error } = await this.db.client
        .from('user_ai_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch user insights: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      this.handleError(error as Error, 'Failed to get user insights');
      return [];
    }
  }

  /**
   * Track user habits
   */
  async updateUserHabits(
    userId: string,
    habitData: Partial<UserHabit>
  ): Promise<UserHabit | null> {
    try {
      // Check if habit record exists
      const { data: existing } = await this.db.client
        .from('user_habits')
        .select('*')
        .eq('user_id', userId)
        .eq('habit_name', habitData.habit_name)
        .single();

      let result;

      if (existing) {
        // Update existing habit
        const { data, error } = await this.db.client
          .from('user_habits')
          .update({
            current_streak: habitData.current_streak,
            longest_streak: habitData.longest_streak,
            last_activity_date: habitData.last_activity_date,
            total_completions: habitData.total_completions,
            data_points: habitData.data_points,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to update habit: ${error.message}`);
        }

        result = data;
      } else {
        // Create new habit
        const { data, error } = await this.db.client
          .from('user_habits')
          .insert({
            user_id: userId,
            ...habitData,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create habit: ${error.message}`);
        }

        result = data;
      }

      // Emit event if streak updated
      if (result) {
        this.emit('streak:updated', result);
      }

      return result;
    } catch (error) {
      this.handleError(error as Error, 'Failed to update user habits');
      return null;
    }
  }

  // ========================================
  // User Analytics and Progress
  // ========================================

  /**
   * Get user's reward analytics
   */
  async getUserAnalytics(userId: string): Promise<UserRewardAnalytics | null> {
    try {
      const { data, error } = await this.db.client
        .from('user_reward_analytics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found"
        throw new Error(`Failed to fetch user analytics: ${error.message}`);
      }

      return data || null;
    } catch (error) {
      this.handleError(error as Error, 'Failed to get user analytics');
      return null;
    }
  }

  /**
   * Update user analytics
   */
  async updateUserAnalytics(
    userId: string,
    updates: Partial<UserRewardAnalytics>
  ): Promise<UserRewardAnalytics | null> {
    try {
      // Get current analytics
      const current = await this.getUserAnalytics(userId);

      const analyticsData = {
        user_id: userId,
        total_rewards: (current?.total_rewards || 0) + (updates.total_rewards || 0),
        total_points: (current?.total_points || 0) + (updates.total_points || 0),
        total_gifts: (current?.total_gifts || 0) + (updates.total_gifts || 0),
        current_streak: updates.current_streak ?? current?.current_streak ?? 0,
        longest_streak: Math.max(
          updates.longest_streak || 0,
          current?.longest_streak || 0
        ),
        last_reward_date: updates.last_reward_date || current?.last_reward_date,
        last_active_date: new Date().toISOString(),
        niche_scores: {
          ...current?.niche_scores,
          ...updates.niche_scores,
        },
        achievement_progress: {
          ...current?.achievement_progress,
          ...updates.achievement_progress,
        },
      };

      const { data, error } = await this.db.client
        .from('user_reward_analytics')
        .upsert(analyticsData, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update user analytics: ${error.message}`);
      }

      return data;
    } catch (error) {
      this.handleError(error as Error, 'Failed to update user analytics');
      return null;
    }
  }

  // ========================================
  // User Niche and Personality
  // ========================================

  /**
   * Get or create user niche profile
   */
  async getUserNicheProfile(userId: string): Promise<UserNicheProfile | null> {
    try {
      const { data, error } = await this.db.client
        .from('user_niche_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch user niche profile: ${error.message}`);
      }

      return data || null;
    } catch (error) {
      this.handleError(error as Error, 'Failed to get user niche profile');
      return null;
    }
  }

  /**
   * Update user niche profile
   */
  async updateUserNicheProfile(
    userId: string,
    profileData: Partial<UserNicheProfile>
  ): Promise<UserNicheProfile | null> {
    try {
      const { data, error } = await this.db.client
        .from('user_niche_profiles')
        .upsert(
          {
            user_id: userId,
            ...profileData,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        )
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update user niche profile: ${error.message}`);
      }

      // Emit event
      this.emit('niche:identified', data);

      return data;
    } catch (error) {
      this.handleError(error as Error, 'Failed to update user niche profile');
      return null;
    }
  }

  // ========================================
  // Helper Methods
  // ========================================

  /**
   * Get reward by ID
   */
  private async getRewardById(rewardId: string): Promise<Reward | null> {
    try {
      // Check cache first
      if (this.cache.rewards.has(rewardId)) {
        return this.cache.rewards.get(rewardId)!;
      }

      const { data, error } = await this.db.client
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .single();

      if (error) {
        this.log(`Reward not found: ${rewardId}`);
        return null;
      }

      this.cache.rewards.set(rewardId, data);
      return data;
    } catch (error) {
      this.handleError(error as Error, 'Failed to get reward by ID');
      return null;
    }
  }

  /**
   * Get gift by ID
   */
  private async getGiftById(giftId: string): Promise<GiftCatalog | null> {
    try {
      // Check cache first
      if (this.cache.gifts.has(giftId)) {
        return this.cache.gifts.get(giftId)!;
      }

      const { data, error } = await this.db.client
        .from('gift_catalog')
        .select('*')
        .eq('id', giftId)
        .single();

      if (error) {
        this.log(`Gift not found: ${giftId}`);
        return null;
      }

      this.cache.gifts.set(giftId, data);
      return data;
    } catch (error) {
      this.handleError(error as Error, 'Failed to get gift by ID');
      return null;
    }
  }

  /**
   * Check if user has a specific reward
   */
  private async hasUserReward(
    userId: string,
    rewardId: string
  ): Promise<UserReward | null> {
    try {
      const { data, error } = await this.db.client
        .from('user_rewards')
        .select('*')
        .eq('user_id', userId)
        .eq('reward_id', rewardId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to check user reward: ${error.message}`);
      }

      return data || null;
    } catch (error) {
      this.handleError(error as Error, 'Failed to check user reward');
      return null;
    }
  }

  /**
   * Check if user has a specific gift
   */
  private async hasUserGift(
    userId: string,
    giftId: string
  ): Promise<UserGiftInventory | null> {
    try {
      const { data, error } = await this.db.client
        .from('user_gift_inventory')
        .select('*')
        .eq('user_id', userId)
        .eq('gift_id', giftId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to check user gift: ${error.message}`);
      }

      return data || null;
    } catch (error) {
      this.handleError(error as Error, 'Failed to check user gift');
      return null;
    }
  }

  /**
   * Verify reward unlock conditions
   */
  private async verifyUnlockConditions(
    userId: string,
    rewardId: string,
    activityData: unknown
  ): Promise<boolean> {
    try {
      const reward = await this.getRewardById(rewardId);
      if (!reward || !reward.unlock_conditions) {
        return false;
      }

      // Use AI service to verify conditions
      return await this.aiService.verifyUnlockConditions(
        userId,
        reward.unlock_conditions,
        activityData
      );
    } catch (error) {
      this.handleError(error as Error, 'Failed to verify unlock conditions');
      return false;
    }
  }

  /**
   * Verify if user can afford a gift
   */
  private async verifyGiftAffordability(
    userId: string,
    gift: GiftCatalog,
    paymentMethod: 'points' | 'premium'
  ): Promise<boolean> {
    try {
      const analytics = await this.getUserAnalytics(userId);
      if (!analytics) {
        return false;
      }

      if (paymentMethod === 'points') {
        return (analytics.total_points || 0) >= (gift.cost_points || 0);
      } else {
        // For premium currency, you'd need to implement premium balance tracking
        // For now, assume user has enough premium currency
        return true;
      }
    } catch (error) {
      this.handleError(error as Error, 'Failed to verify gift affordability');
      return false;
    }
  }

  /**
   * Deduct gift cost from user balance
   */
  private async deductGiftCost(
    userId: string,
    gift: GiftCatalog,
    paymentMethod: 'points' | 'premium'
  ): Promise<void> {
    try {
      if (paymentMethod === 'points') {
        await this.updateUserAnalytics(userId, {
          total_points: -(gift.cost_points || 0),
        });
      } else {
        // For premium currency, implement premium balance deduction
        // This would typically involve external payment processing
      }
    } catch (error) {
      this.handleError(error as Error, 'Failed to deduct gift cost');
      throw error;
    }
  }

  /**
   * Clear user-specific cache entries
   */
  private clearUserCache(userId: string): void {
    // Clear user rewards cache
    const keysToDelete = Array.from(this.cache.userRewards.keys()).filter(key =>
      key.startsWith(`${userId}:`)
    );
    keysToDelete.forEach(key => this.cache.userRewards.delete(key));

    // Clear user inventory cache
    this.cache.userInventory.delete(userId);
  }

  /**
   * Event management
   */
  on<K extends keyof RewardServiceEvents>(
    event: K,
    listener: RewardServiceEvents[K]
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  private emit<K extends keyof RewardServiceEvents>(
    event: K,
    ...args: Parameters<RewardServiceEvents[K]>
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        (listener as Function)(...args);
      } catch (error) {
        this.handleError(error as Error, `Error in event listener for ${event}`);
      }
    });
  }

  /**
   * Error handling
   */
  private handleError(error: Error, context: string): void {
    const errorMessage = `${context}: ${error.message}`;

    if (this.config.debugMode) {
      console.error('RewardService Error:', errorMessage, error);
    }

    // Track error in analytics
    if (this.config.enableAnalytics) {
      this.analytics.trackError(error, context);
    }

    // Emit error event
    this.emit('error:occurred', error);
  }

  /**
   * Logging
   */
  private log(message: string): void {
    if (this.config.debugMode) {
      console.log(`RewardService: ${message}`);
    }
  }

  /**
   * Service status
   */
  isReady(): boolean {
    return this.isInitialized && this.db.isConnected;
  }

  /**
   * Get service status
   */
  getStatus(): {
    isInitialized: boolean;
    isConnected: boolean;
    lastError: string | null;
    cacheSize: {
      rewards: number;
      userRewards: number;
      gifts: number;
      userInventory: number;
    };
  } {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.db.isConnected,
      lastError: this.db.lastError,
      cacheSize: {
        rewards: this.cache.rewards.size,
        userRewards: this.cache.userRewards.size,
        gifts: this.cache.gifts.size,
        userInventory: this.cache.userInventory.size,
      },
    };
  }
}

// Export singleton instance
export const rewardService = RewardService.getInstance();

// Export factory function for initialization
export async function initializeRewardService(
  config?: Partial<ServiceConfig>
): Promise<RewardService> {
  const service = RewardService.getInstance();
  await service.initialize(config);
  return service;
}

export default RewardService;
