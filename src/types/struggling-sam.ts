// ============================================================================
// STRUGGLING SAM OPTIMIZATION TYPES - Gamification & Social Proof
// ============================================================================

import { PersonaType, User } from './index';

// User Streak System
export interface UserStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastWakeUpDate: string; // YYYY-MM-DD
  streakType: 'daily_wakeup' | 'weekly_consistency' | 'monthly_progress';
  freezesUsed: number;
  maxFreezes: number;
  multiplier: number; // streak bonus multiplier
  milestones: StreakMilestone[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StreakMilestone {
  id: string;
  streakDays: number;
  title: string;
  description: string;
  reward: StreakReward;
  unlockedAt?: Date;
  celebrated: boolean;
}

export interface StreakReward {
  type: 'badge' | 'experience' | 'feature_unlock' | 'discount' | 'social_share';
  value: string | number;
  description: string;
  iconUrl?: string;
}

// Achievement System for Struggling Sam
export interface SamAchievement {
  id: string;
  userId: string;
  achievementType: SamAchievementType;
  title: string;
  description: string;
  iconUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  shared: boolean;
  progress?: AchievementProgress;
  requirements: AchievementRequirement[];
  socialProofText: string; // Text for sharing
}

export type SamAchievementType =
  | 'early_bird' // 5 consecutive days
  | 'consistent_riser' // 14 days
  | 'morning_champion' // 30 days
  | 'streak_warrior' // 50 days
  | 'habit_master' // 100 days
  | 'social_butterfly' // share 3 achievements
  | 'community_helper' // join 5 challenges
  | 'comeback_kid' // recover from streak break
  | 'weekend_warrior' // wake up early on weekends
  | 'month_perfectionist'; // perfect month

export interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
}

export interface AchievementRequirement {
  type:
    | 'streak_days'
    | 'early_wake'
    | 'consistency'
    | 'social_activity'
    | 'challenges_completed';
  value: number;
  description: string;
}

// Social Proof System
export interface SocialProofData {
  id: string;
  type: SocialProofType;
  content: string;
  timestamp: Date;
  isRealTime: boolean;
  userSegment?: PersonaType;
  engagement?: SocialEngagement;
}

export type SocialProofType =
  | 'user_count' // "47 people started their morning routine in the last hour"
  | 'success_story' // Real user testimonials
  | 'achievement_unlock' // "John just unlocked Early Bird badge!"
  | 'streak_milestone' // "Sarah reached a 30-day streak!"
  | 'community_activity' // "15 people joined challenges today"
  | 'upgrade_social_proof' // "Join 15,420+ users who upgraded"
  | 'peer_comparison'; // "Users like you average 25-day streaks"

export interface SocialEngagement {
  views: number;
  clicks: number;
  shares: number;
  conversionRate: number;
  lastUpdated: Date;
}

// Social Challenges
export interface SocialChallenge {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  challengeType: SocialChallengeType;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // days
  maxParticipants: number;
  currentParticipants: number;
  participants: ChallengeParticipant[];
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  rewards: SocialChallengeReward[];
  leaderboard: ChallengeLeaderboard[];
  socialProofMetrics: SocialProofMetrics;
  createdAt: Date;
}

export type SocialChallengeType =
  | 'streak_competition' // Who can maintain longest streak
  | 'early_wake_challenge' // Wake up before specific time
  | 'consistency_challenge' // Wake up same time daily
  | 'group_motivation' // Support each other
  | 'habit_building' // Build new morning routine
  | 'peer_accountability'; // Check in with each other

export interface ChallengeParticipant {
  userId: string;
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>;
  joinedAt: Date;
  progress: number; // 0-100
  currentStreak: number;
  lastActivity: Date;
  rank: number;
  isActive: boolean;
}

export interface SocialChallengeReward {
  type: 'badge' | 'experience' | 'streak_freeze' | 'premium_trial' | 'discount';
  value: string | number;
  description: string;
  eligibleRanks: number[]; // which ranks get this reward
}

export interface ChallengeLeaderboard {
  rank: number;
  userId: string;
  username: string;
  score: number;
  progress: number;
  streak: number;
  lastActivity: Date;
}

export interface SocialProofMetrics {
  totalParticipants: number;
  activeParticipants: number;
  completionRate: number;
  shareCount: number;
  engagementScore: number;
}

// Smart Upgrade Prompts for Struggling Sam
export interface SmartUpgradePrompt {
  id: string;
  userId: string;
  triggerType: UpgradeTriggerType;
  promptType: UpgradePromptType;
  title: string;
  description: string;
  benefits: string[];
  socialProof: string;
  discount?: UpgradeDiscount;
  urgency: UpgradeUrgency;
  context: UpgradeContext;
  isShown: boolean;
  shownAt?: Date;
  clickedAt?: Date;
  convertedAt?: Date;
  dismissedAt?: Date;
  createdAt: Date;
}

export type UpgradeTriggerType =
  | 'streak_milestone' // Day 7, 14, 21, 30
  | 'achievement_unlock' // After unlocking achievement
  | 'social_sharing' // After sharing achievement
  | 'challenge_completion' // After completing challenge
  | 'habit_formation' // After consistent behavior
  | 'feature_limitation' // When hitting free limits
  | 'peer_influence'; // When friends upgrade

export type UpgradePromptType =
  | 'celebration_offer' // "Celebrate your 7-day streak with Premium!"
  | 'feature_unlock' // "Unlock advanced features you've earned"
  | 'social_proof' // "Join friends who upgraded for better results"
  | 'limited_time' // "Special offer ending soon"
  | 'habit_milestone' // "You've built the habit, now supercharge it"
  | 'gentle_nudge'; // Soft, supportive messaging

export interface UpgradeDiscount {
  percentage: number;
  duration: number; // hours
  code?: string;
  reason: string; // "Streak celebration discount"
}

export interface UpgradeUrgency {
  level: 'low' | 'medium' | 'high';
  message: string;
  expiresAt?: Date;
}

export interface UpgradeContext {
  streakDays: number;
  recentAchievements: string[];
  socialActivity: boolean;
  engagementLevel: 'low' | 'medium' | 'high';
  previousPromptsSeen: number;
  daysSinceLastPrompt: number;
}

// A/B Testing Framework
export interface ABTestGroup {
  id: string;
  name: string;
  description: string;
  percentage: number; // 0-100
  isControl: boolean;
  features: ABTestFeature[];
  status: 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  results?: ABTestResults;
}

export interface ABTestFeature {
  featureId: string;
  variant: string;
  enabled: boolean;
  configuration: Record<string, any>;
}

export interface ABTestResults {
  totalUsers: number;
  conversionRate: number;
  significanceLevel: number;
  confidenceInterval: [number, number];
  metrics: ABTestMetrics;
  isWinner: boolean;
  lastUpdated: Date;
}

export interface ABTestMetrics {
  streakEngagement: number;
  achievementUnlocks: number;
  socialSharing: number;
  upgradeConversion: number;
  retentionRate: number;
  timeToConvert: number; // days
}

// User Assignment to A/B Tests
export interface UserABTest {
  userId: string;
  testId: string;
  groupId: string;
  assignedAt: Date;
  isActive: boolean;
  hasConverted: boolean;
  convertedAt?: Date;
  metrics: UserABTestMetrics;
}

export interface UserABTestMetrics {
  sessionsCount: number;
  featuresUsed: string[];
  engagementScore: number;
  retentionDays: number;
  lastActivity: Date;
}

// Habit Celebration System
export interface HabitCelebration {
  id: string;
  userId: string;
  celebrationType: CelebrationType;
  trigger: CelebrationTrigger;
  title: string;
  message: string;
  animation: CelebrationAnimation;
  rewards: CelebrationReward[];
  socialShare: CelebrationSocialShare;
  isShown: boolean;
  shownAt?: Date;
  sharedAt?: Date;
  createdAt: Date;
}

export type CelebrationType =
  | 'streak_milestone' // 3, 7, 14, 30 days
  | 'achievement_unlock' // New badge earned
  | 'challenge_complete' // Finished social challenge
  | 'comeback_success' // Recovered from streak break
  | 'weekend_success' // Maintained streak over weekend
  | 'monthly_perfect'; // Perfect month completed

export interface CelebrationTrigger {
  type: 'streak_reached' | 'achievement_earned' | 'challenge_won' | 'milestone_hit';
  value: number;
  context: Record<string, any>;
}

export interface CelebrationAnimation {
  type: 'confetti' | 'fireworks' | 'pulse' | 'bounce' | 'glow';
  duration: number; // milliseconds
  intensity: 'subtle' | 'moderate' | 'intense';
  colors: string[];
}

export interface CelebrationReward {
  type: 'badge' | 'experience' | 'streak_freeze' | 'discount' | 'social_unlock';
  value: string | number;
  description: string;
  immediate: boolean;
}

export interface CelebrationSocialShare {
  enabled: boolean;
  defaultMessage: string;
  imageUrl?: string;
  hashtags: string[];
  platforms: ('twitter' | 'facebook' | 'instagram' | 'linkedin')[];
}

// Success Stories & Testimonials
export interface SuccessStory {
  id: string;
  userId?: string; // Anonymous if null
  userName: string;
  userAvatar?: string;
  title: string;
  story: string;
  beforeAfter: BeforeAfterStats;
  tags: string[];
  verified: boolean;
  featured: boolean;
  likes: number;
  shares: number;
  createdAt: Date;
  persona: PersonaType;
  conversionImpact: number; // conversion lift when shown
}

export interface BeforeAfterStats {
  before: {
    wakeUpTime: string;
    consistency: number; // 0-100
    energy: number; // 1-10
  };
  after: {
    wakeUpTime: string;
    consistency: number;
    energy: number;
    streakDays: number;
  };
  improvement: {
    consistencyImprovement: number;
    energyImprovement: number;
    timeImprovement: number; // minutes earlier
  };
}

// Community Statistics for Social Proof
export interface CommunityStats {
  totalUsers: number;
  activeToday: number;
  totalStreaks: number;
  averageStreak: number;
  achievementsUnlocked: number;
  challengesActive: number;
  successRate: number;
  lastUpdated: Date;
  realtimeActivity: RealtimeActivity[];
}

export interface RealtimeActivity {
  id: string;
  type:
    | 'streak_started'
    | 'achievement_unlocked'
    | 'challenge_joined'
    | 'milestone_reached';
  message: string;
  timestamp: Date;
  anonymous: boolean;
}

// A/B Testing Context Provider
export interface ABTestContext {
  currentTests: ABTestGroup[];
  userAssignments: UserABTest[];
  isFeatureEnabled: (featureId: string) => boolean;
  getFeatureVariant: (featureId: string) => string | null;
  trackConversion: (testId: string, userId: string) => void;
  trackEngagement: (testId: string, userId: string, action: string) => void;
}
