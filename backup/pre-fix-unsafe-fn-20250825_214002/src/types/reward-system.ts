/**
 * Reward System Type Definitions
 * 
 * This file contains comprehensive TypeScript interfaces for the reward system,
 * matching the database schema from migration 007_create_reward_system.sql
 * 
 * @version 1.0.0
 * @author Scout AI
 */

// ========================================
// Enum Types (matching database enums)
// ========================================

export type RewardType = 
  | 'achievement'
  | 'milestone'
  | 'streak'
  | 'habit_boost'
  | 'niche_mastery'
  | 'social_share'
  | 'gift_unlock';

export type RewardCategory =
  | 'consistency'
  | 'early_riser'
  | 'wellness'
  | 'productivity'
  | 'social'
  | 'explorer'
  | 'master'
  | 'challenger';

export type RewardRarity =
  | 'common'
  | 'rare'
  | 'epic'
  | 'legendary';

export type GiftType =
  | 'theme'
  | 'sound_pack'
  | 'voice_personality'
  | 'alarm_tone'
  | 'background'
  | 'icon_pack'
  | 'premium_trial'
  | 'feature_unlock';

export type UserNiche =
  | 'fitness'
  | 'work'
  | 'study'
  | 'creative'
  | 'family'
  | 'health'
  | 'social'
  | 'spiritual';

export type AIInsightType =
  | 'improvement_suggestion'
  | 'pattern_recognition'
  | 'habit_analysis'
  | 'optimization_tip'
  | 'celebration';

export type InsightPriority =
  | 'low'
  | 'medium'
  | 'high';

// ========================================
// Core Database Table Interfaces
// ========================================

/**
 * Reward/Achievement Master Catalog
 * Represents the rewards table
 */
export interface Reward {
  id: string;
  type: RewardType;
  category: RewardCategory;
  rarity: RewardRarity;
  
  // Core reward information
  title: string;
  description: string;
  icon: string;
  points: number;
  
  // Unlock conditions (stored as JSONB)
  unlock_conditions: Record<string, unknown>;
  
  // Progress tracking
  progress_target?: number;
  progress_unit?: string;
  
  // Personalization templates
  personalized_message_template?: string;
  ai_insight_template?: string;
  
  // Metadata
  is_active: boolean;
  is_premium: boolean;
  sort_order: number;
  tags: string[];
  
  // Audit fields
  created_at: string;
  updated_at: string;
}

/**
 * User's Unlocked Rewards
 * Represents the user_rewards table
 */
export interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  
  // Unlock details
  unlocked_at: string;
  points_earned: number;
  
  // Personalized content
  personalized_message?: string;
  ai_insight?: string;
  
  // Progress tracking
  progress_current: number;
  progress_percentage: number;
  
  // Context when unlocked
  unlock_context: Record<string, unknown>;
  
  // Populated reward details (when joining with rewards table)
  reward?: Reward;
}

/**
 * Available Gifts Catalog
 * Represents the gift_catalog table
 */
export interface GiftCatalog {
  id: string;
  type: GiftType;
  
  // Gift information
  name: string;
  description: string;
  preview_image?: string;
  
  // Cost and availability
  cost_points: number;
  cost_premium_currency: number;
  is_purchasable_with_points: boolean;
  is_purchasable_with_currency: boolean;
  
  // Gift content (file paths, theme data, etc.)
  content_data: Record<string, unknown>;
  
  // Availability
  is_available: boolean;
  is_premium: boolean;
  is_seasonal: boolean;
  available_from?: string;
  available_until?: string;
  
  // Requirements
  required_level: number;
  required_achievements: string[];
  required_subscription_tier?: string;
  
  // Metadata
  tags: string[];
  sort_order: number;
  
  // Audit fields
  created_at: string;
  updated_at: string;
}

/**
 * User's Gift Inventory
 * Represents the user_gift_inventory table
 */
export interface UserGiftInventory {
  id: string;
  user_id: string;
  gift_id: string;
  
  // Acquisition details
  acquired_at: string;
  acquired_method: 'earned' | 'purchased_points' | 'purchased_currency' | 'gifted';
  cost_paid: number;
  
  // Usage tracking
  is_equipped: boolean;
  first_used_at?: string;
  last_used_at?: string;
  usage_count: number;
  
  // Metadata
  acquisition_context: Record<string, unknown>;
  
  // Populated gift details (when joining with gift_catalog table)
  gift?: GiftCatalog;
}

/**
 * AI-Generated User Insights
 * Represents the user_ai_insights table
 */
export interface UserAIInsight {
  id: string;
  user_id: string;
  
  // Insight details
  type: AIInsightType;
  priority: InsightPriority;
  title: string;
  message: string;
  confidence: number;
  
  // Actionability
  is_actionable: boolean;
  suggested_actions: string[];
  
  // Analysis data
  analysis_data: Record<string, unknown>;
  patterns_detected: string[];
  
  // User interaction
  is_read: boolean;
  is_dismissed: boolean;
  user_feedback?: number; // 1-5 rating
  user_feedback_text?: string;
  
  // Timing
  created_at: string;
  expires_at?: string;
  read_at?: string;
  dismissed_at?: string;
}

/**
 * User Habit Patterns
 * Represents the user_habits table
 */
export interface UserHabit {
  id: string;
  user_id: string;
  
  // Habit identification
  pattern: string; // morning_routine, evening_routine, workout_time, etc.
  niche: UserNiche;
  
  // Habit metrics
  frequency: number; // times per week
  consistency: number; // 0.0 to 1.0
  improvement_trend: number; // positive for improving, negative for declining
  
  // Analysis metadata
  analyzed_from: string;
  analyzed_to: string;
  analysis_confidence: number;
  
  // Habit context
  context_data: Record<string, unknown>;
  
  // Audit fields
  created_at: string;
  updated_at: string;
  last_analyzed_at: string;
}

/**
 * User Niche Profile
 * Represents the user_niche_profiles table
 */
export interface UserNicheProfile {
  id: string;
  user_id: string;
  
  // Primary niche identification
  primary_niche: UserNiche;
  secondary_niche?: UserNiche;
  confidence: number;
  
  // User traits and preferences
  traits: string[];
  preferences: Record<string, unknown>;
  
  // Analysis metadata
  analysis_version: string;
  last_updated_at: string;
}

/**
 * User Reward Analytics
 * Represents the user_reward_analytics table
 */
export interface UserRewardAnalytics {
  id: string;
  user_id: string;
  
  // Core metrics
  total_points: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  
  // Reward counts
  total_rewards_unlocked: number;
  rewards_this_week: number;
  rewards_this_month: number;
  
  // Gift metrics
  total_gifts_owned: number;
  gifts_equipped: number;
  points_spent_on_gifts: number;
  
  // Engagement metrics
  insights_generated: number;
  insights_acted_upon: number;
  avg_insight_rating?: number;
  
  // Timing
  last_reward_earned_at?: string;
  last_analysis_run_at: string;
  
  // Analytics metadata
  analysis_period_start: string;
  analysis_period_end: string;
}

// ========================================
// Service Interface Types
// ========================================

/**
 * Main Reward System Service Interface
 */
export interface RewardSystem {
  // User reward management
  getUserRewards(userId: string): Promise<UserReward[]>;
  unlockReward(userId: string, rewardId: string, context?: Record<string, unknown>): Promise<UserReward>;
  checkRewardEligibility(userId: string, rewardId: string): Promise<boolean>;
  
  // Reward catalog
  getAvailableRewards(userId: string, filters?: RewardFilters): Promise<Reward[]>;
  getRewardDetails(rewardId: string): Promise<Reward>;
  
  // Gift system
  getGiftCatalog(filters?: GiftFilters): Promise<GiftCatalog[]>;
  getUserGiftInventory(userId: string): Promise<UserGiftInventory[]>;
  purchaseGift(userId: string, giftId: string, paymentMethod: 'points' | 'currency'): Promise<UserGiftInventory>;
  equipGift(userId: string, giftId: string): Promise<void>;
  unequipGift(userId: string, giftId: string): Promise<void>;
  
  // AI insights
  generateInsights(userId: string): Promise<UserAIInsight[]>;
  getUserInsights(userId: string, filters?: InsightFilters): Promise<UserAIInsight[]>;
  markInsightAsRead(userId: string, insightId: string): Promise<void>;
  dismissInsight(userId: string, insightId: string): Promise<void>;
  rateInsight(userId: string, insightId: string, rating: number, feedback?: string): Promise<void>;
  
  // Habit analysis
  analyzeUserHabits(userId: string): Promise<UserHabit[]>;
  getUserHabits(userId: string): Promise<UserHabit[]>;
  updateUserNicheProfile(userId: string): Promise<UserNicheProfile>;
  getUserNicheProfile(userId: string): Promise<UserNicheProfile | null>;
  
  // Analytics
  getUserAnalytics(userId: string): Promise<UserRewardAnalytics>;
  updateUserAnalytics(userId: string): Promise<UserRewardAnalytics>;
  
  // Progress tracking
  updateRewardProgress(userId: string, rewardId: string, progress: number): Promise<void>;
  calculateUserLevel(userId: string): Promise<number>;
  calculateStreakInfo(userId: string): Promise<{ current: number; longest: number }>;
}

// ========================================
// Filter and Query Types
// ========================================

export interface RewardFilters {
  type?: RewardType[];
  category?: RewardCategory[];
  rarity?: RewardRarity[];
  is_premium?: boolean;
  unlocked_only?: boolean;
  available_only?: boolean;
  points_range?: { min?: number; max?: number };
  sort_by?: 'points' | 'rarity' | 'category' | 'created_at' | 'sort_order';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface GiftFilters {
  type?: GiftType[];
  is_available?: boolean;
  is_premium?: boolean;
  is_seasonal?: boolean;
  user_level?: number;
  cost_range?: { min?: number; max?: number };
  sort_by?: 'cost_points' | 'name' | 'created_at' | 'sort_order';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface InsightFilters {
  type?: AIInsightType[];
  priority?: InsightPriority[];
  is_read?: boolean;
  is_dismissed?: boolean;
  is_actionable?: boolean;
  date_range?: { start: string; end: string };
  sort_by?: 'created_at' | 'priority' | 'confidence';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ========================================
// API Response Types
// ========================================

export interface RewardSystemResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface RewardUnlockResponse {
  reward: UserReward;
  celebration_message: string;
  points_earned: number;
  level_up?: {
    old_level: number;
    new_level: number;
    level_up_message: string;
  };
}

export interface GiftPurchaseResponse {
  gift_inventory: UserGiftInventory;
  points_remaining: number;
  purchase_message: string;
}

export interface AnalysisResponse {
  insights: UserAIInsight[];
  habits: UserHabit[];
  niche_profile: UserNicheProfile;
  analytics: UserRewardAnalytics;
  analysis_timestamp: string;
}

// ========================================
// Event and Notification Types
// ========================================

export interface RewardNotification {
  type: 'reward_unlocked' | 'level_up' | 'streak_milestone' | 'gift_available' | 'insight_generated';
  title: string;
  message: string;
  icon?: string;
  action_url?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  expires_at?: string;
}

export interface RewardEvent {
  event_type: string;
  user_id: string;
  reward_id?: string;
  gift_id?: string;
  insight_id?: string;
  event_data: Record<string, unknown>;
  timestamp: string;
}

// ========================================
// Configuration and Settings Types
// ========================================

export interface RewardSystemConfig {
  points_per_level: number;
  max_level: number;
  streak_bonus_multiplier: number;
  daily_analysis_enabled: boolean;
  notification_preferences: {
    reward_unlocked: boolean;
    level_up: boolean;
    insights: boolean;
    streak_milestones: boolean;
  };
  ai_analysis_config: {
    min_confidence_threshold: number;
    max_insights_per_day: number;
    analysis_frequency_hours: number;
  };
}

export interface UserRewardPreferences {
  user_id: string;
  notification_settings: RewardSystemConfig['notification_preferences'];
  privacy_settings: {
    share_achievements: boolean;
    show_on_leaderboard: boolean;
    allow_ai_analysis: boolean;
  };
  personalization_settings: {
    preferred_insight_types: AIInsightType[];
    celebration_style: 'minimal' | 'moderate' | 'enthusiastic';
    difficulty_preference: 'easy' | 'moderate' | 'challenging';
  };
}

// ========================================
// Utility Types
// ========================================

export type RewardWithUserProgress = Reward & {
  user_progress?: {
    unlocked: boolean;
    progress_current: number;
    progress_percentage: number;
    unlocked_at?: string;
  };
};

export type GiftWithOwnershipStatus = GiftCatalog & {
  user_ownership?: {
    owned: boolean;
    equipped: boolean;
    acquired_at?: string;
    usage_count: number;
  };
};

export type InsightWithActions = UserAIInsight & {
  available_actions: Array<{
    id: string;
    label: string;
    action_type: 'navigate' | 'modify_setting' | 'create_alarm' | 'dismiss';
    payload: Record<string, unknown>;
  }>;
};

// ========================================
// Type Guards
// ========================================

export const isReward = (value: unknown): value is Reward => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Reward).id === 'string' &&
    typeof (value as Reward).title === 'string' &&
    typeof (value as Reward).points === 'number'
  );
};

export const isUserReward = (value: unknown): value is UserReward => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as UserReward).user_id === 'string' &&
    typeof (value as UserReward).reward_id === 'string' &&
    typeof (value as UserReward).unlocked_at === 'string'
  );
};

export const isGiftCatalog = (value: unknown): value is GiftCatalog => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as GiftCatalog).id === 'string' &&
    typeof (value as GiftCatalog).name === 'string' &&
    typeof (value as GiftCatalog).cost_points === 'number'
  );
};

export const isUserAIInsight = (value: unknown): value is UserAIInsight => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as UserAIInsight).user_id === 'string' &&
    typeof (value as UserAIInsight).message === 'string' &&
    typeof (value as UserAIInsight).confidence === 'number'
  );
};

// ========================================
// Constants
// ========================================

export const REWARD_RARITIES: Record<RewardRarity, { color: string; weight: number }> = {
  common: { color: '#9CA3AF', weight: 1 },
  rare: { color: '#3B82F6', weight: 2 },
  epic: { color: '#8B5CF6', weight: 3 },
  legendary: { color: '#F59E0B', weight: 4 },
};

export const REWARD_CATEGORIES: Record<RewardCategory, { icon: string; description: string }> = {
  consistency: { icon: '🔄', description: 'Regular alarm usage and wake-up habits' },
  early_riser: { icon: '🌅', description: 'Waking up early and maintaining morning routines' },
  wellness: { icon: '🧘', description: 'Health and wellness-focused achievements' },
  productivity: { icon: '⚡', description: 'Productive habits and task completion' },
  social: { icon: '👥', description: 'Community engagement and sharing' },
  explorer: { icon: '🗺️', description: 'Trying new features and customizations' },
  master: { icon: '🏆', description: 'Advanced usage and expertise milestones' },
  challenger: { icon: '🎯', description: 'Difficult goals and streak challenges' },
};

export const NICHE_DESCRIPTIONS: Record<UserNiche, string> = {
  fitness: 'Focused on health, exercise, and physical wellness',
  work: 'Professional development and work-life balance',
  study: 'Learning, education, and academic pursuits',
  creative: 'Artistic endeavors and creative expression',
  family: 'Family time and relationship priorities',
  health: 'Medical appointments and health management',
  social: 'Social activities and community engagement',
  spiritual: 'Meditation, reflection, and spiritual practices',
};

export const DEFAULT_REWARD_CONFIG: RewardSystemConfig = {
  points_per_level: 1000,
  max_level: 100,
  streak_bonus_multiplier: 1.5,
  daily_analysis_enabled: true,
  notification_preferences: {
    reward_unlocked: true,
    level_up: true,
    insights: true,
    streak_milestones: true,
  },
  ai_analysis_config: {
    min_confidence_threshold: 0.7,
    max_insights_per_day: 3,
    analysis_frequency_hours: 24,
  },
};