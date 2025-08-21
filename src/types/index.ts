// Import premium types
export * from './premium';

// Import browser API types
export * from './browser-apis';

// Email Campaign Types
export type PersonaType =
  | 'struggling_sam'     // Free-focused users
  | 'busy_ben'           // Efficiency-driven professionals
  | 'professional_paula' // Feature-rich seekers
  | 'enterprise_emma'    // Team-oriented decision makers
  | 'student_sarah'      // Budget-conscious students
  | 'lifetime_larry';    // One-time payment preferrers

export interface PersonaProfile {
  id: PersonaType;
  displayName: string;
  description: string;
  primaryColor: string;
  messagingTone:
    | "supportive"
    | "efficient"
    | "sophisticated"
    | "business_focused"
    | "casual"
    | "value_focused";
  ctaStyle:
    | "friendly"
    | "urgent"
    | "professional"
    | "corporate"
    | "youthful"
    | "exclusive";
  targetPlan:
    | "free"
    | "basic"
    | "premium"
    | "pro"
    | "student"
    | "lifetime";
}

export interface PersonaDetectionResult {
  persona: PersonaType;
  confidence: number; // 0-1 scale
  factors: PersonaDetectionFactor[];
  updatedAt: Date;
  previousPersona?: PersonaType;
}

export interface PersonaDetectionFactor {
  factor: string;
  weight: number;
  value: string | number | boolean;
  influence: number;
}

export interface EmailCampaign {
  id: string;
  name: string;
  persona: PersonaType;
  status: 'draft' | 'active' | 'paused' | 'completed';
  sequences: EmailSequence[];
  metrics: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailSequence {
  id: string;
  campaignId: string;
  order: number;
  name: string;
  subject: string;
  delayHours: number;
  targetAction: string;
  successMetrics: {
    openRateTarget: number;
    clickRateTarget: number;
    conversionRateTarget?: number;
  };
}

export interface CampaignMetrics {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  lastUpdated: Date;
}

export interface EmailPreferences {
  userId: string;
  subscribed: boolean;
  preferences: {
    marketing: boolean;
    product_updates: boolean;
    educational_content: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  lastUpdated: Date;
}

// Enhanced Alarm interface combining both apps
export interface Alarm {
  id: string;
  userId: string;
  time: string; // HH:MM format
  label: string;
  title?: string; // Additional title field for enhanced functionality
  description?: string; // Description field for alarm details
  enabled: boolean; // from Smart Alarm App
  isActive: boolean; // from Enhanced Battles (same as enabled)
  days: number[]; // 0-6, Sunday = 0 (Smart Alarm format)
  dayNames: DayOfWeek[]; // Enhanced Battles format for compatibility
  recurringDays?: DayOfWeek[]; // Alternative recurring days format
  voiceMood: VoiceMood;
  sound: string; // Enhanced Battles sound system
  soundType?: 'built-in' | 'custom' | 'voice-only'; // Type of sound to use
  customSoundId?: string; // ID of custom sound if soundType is 'custom'
  difficulty: AlarmDifficulty; // Enhanced Battles difficulty
  snoozeEnabled: boolean;
  snoozeInterval: number; // minutes
  snoozeCount: number;
  maxSnoozes?: number;
  lastTriggered?: Date;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Battle system integration
  battleId?: string;
  weatherEnabled?: boolean;
  nuclearChallenges?: string[];
  smartFeatures?: SmartAlarmSettings;
  
  // Advanced scheduling properties
  recurrencePattern?: RecurrencePattern;
  smartOptimizations?: SmartOptimization[];
  seasonalAdjustments?: SeasonalAdjustment[];
  locationTriggers?: LocationTrigger[];
  conditionalRules?: ConditionalRule[];
  sunSchedule?: SunSchedule;
  alarmDependencies?: AlarmDependency[];
  calendarIntegration?: CalendarIntegration;
}

export type VoiceMood =
  | 'drill-sergeant'
  | 'sweet-angel'
  | 'anime-hero'
  | 'savage-roast'
  | 'motivational'
  | 'gentle'
  // Premium-only personalities (Pro+ subscription required)
  | 'demon-lord'
  | 'ai-robot'
  | 'comedian'
  | 'philosopher';

export interface VoiceMoodConfig {
  id: VoiceMood;
  name: string;
  description: string;
  icon: string;
  color: string;
  sample: string;
}

// Enhanced Battles alarm types
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type AlarmDifficulty = 'easy' | 'medium' | 'hard' | 'extreme' | 'nuclear';

export interface AlarmInstance {
  id: string;
  alarmId: string;
  scheduledTime: string; // ISO date string
  actualWakeTime?: string; // ISO date string
  status: 'pending' | 'snoozed' | 'dismissed' | 'completed' | 'missed';
  snoozeCount: number;
  battleId?: string;
}

export interface AlarmEvent {
  id: string;
  alarmId: string;
  firedAt: Date;
  dismissed: boolean;
  snoozed: boolean;
  userAction: 'dismissed' | 'snoozed' | 'ignored';
  dismissMethod?: 'voice' | 'button' | 'shake';
}

// Enhanced User interface combining both apps
export interface User {
  id: string;
  email: string; // from Smart Alarm App
  name?: string; // Smart Alarm App
  username: string; // Enhanced Battles
  displayName: string; // Enhanced Battles
  avatar?: string;
  level: number;
  experience: number;
  joinDate: string;
  lastActive: string;
  preferences: UserPreferences;
  settings?: UserSettings; // Enhanced Battles settings
  stats?: UserStats; // Enhanced Battles stats
  subscriptionStatus?: SubscriptionStatus; // Detailed subscription info
  createdAt: Date | string;
  // Premium subscription fields
  subscription?: import('./premium').Subscription;
  stripeCustomerId?: string;
  trialEndsAt?: Date;
  premiumFeatures?: string[]; // Array of feature IDs user has access to
  featureAccess?: PremiumFeatureAccess;
  usage?: PremiumUsage;
}

export interface UserStats {
  totalBattles: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  averageWakeTime: string;
  totalAlarmsSet: number;
  alarmsCompleted: number;
  snoozeCount: number;
}

// Enhanced User Preferences combining both apps
export interface UserPreferences {
  // Enhanced Theme & Personalization
  personalization: PersonalizationSettings;

  // Smart Alarm App preferences
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  voiceDismissalSensitivity: number; // 1-10
  defaultVoiceMood: VoiceMood;
  hapticFeedback: boolean;
  snoozeMinutes: number;
  maxSnoozes: number;
  rewardsEnabled: boolean;
  aiInsightsEnabled: boolean;
  personalizedMessagesEnabled: boolean;
  shareAchievements: boolean;

  // Enhanced Battles preferences
  battleNotifications?: boolean;
  friendRequests?: boolean;
  trashTalkEnabled?: boolean;
  autoJoinBattles?: boolean;
  smartFeaturesEnabled?: boolean;
  fitnessIntegration?: boolean;
  locationChallenges?: boolean;
  photoChallenges?: boolean;

  // Legacy support (deprecated, use personalization.theme instead)
  theme?: 'light' | 'dark' | 'auto' | 'system';
  gameTheme?: Theme;
}

export interface NotificationPermission {
  granted: boolean;
  requestedAt?: Date;
  deniedAt?: Date;
}

export interface MicrophonePermission {
  granted: boolean;
  requestedAt?: Date;
  deniedAt?: Date;
}

/**
 * Main application state interface that defines the complete state structure
 * for the Smart Alarm application. This interface ensures type safety across
 * all application components and provides a centralized state management contract.
 *
 * @interface AppState
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const [appState, setAppState] = useState<AppState>(INITIAL_APP_STATE);
 *
 * // Access user data
 * if (appState.user) {
 *   console.log(`Welcome ${appState.user.name}`);
 * }
 *
 * // Check current theme
 * const isDarkMode = appState.currentTheme === 'dark';
 * ```
 */
export interface AppState {
  /**
   * Currently authenticated user object or null if not logged in.
   * Contains user profile information, preferences, and subscription details.
   */
  user: User | null;

  /**
   * Array of all user's alarms including enabled/disabled states.
   * This is the primary data structure for alarm management.
   */
  alarms: Alarm[];

  /**
   * Currently active/ringing alarm or null if no alarm is active.
   * Used to determine if the alarm ringing UI should be displayed.
   */
  activeAlarm: Alarm | null;

  /**
   * System permissions required for alarm functionality.
   * Tracks notification and microphone access permissions.
   */
  permissions: {
    /** Notification permission state for alarm alerts */
    notifications: NotificationPermission;
    /** Microphone permission state for voice dismissal */
    microphone: MicrophonePermission;
  };

  /**
   * Whether the user is currently in the onboarding flow.
   * Controls display of welcome screens and initial setup.
   */
  isOnboarding: boolean;

  /**
   * Current active view/screen in the application.
   * Determines which main component to render.
   */
  currentView: 'dashboard' | 'alarms' | 'advanced-scheduling' | 'gaming' | 'settings' | 'alarm-ringing' | 'pricing';

  /**
   * Optional rewards and gamification system state.
   * Includes user level, experience points, and unlocked rewards.
   */
  rewardSystem?: RewardSystem;

  // Enhanced Theme & Personalization

  /**
   * Currently active theme identifier.
   * Determines the overall visual appearance of the application.
   * @example 'light', 'dark', 'high-contrast'
   */
  currentTheme: Theme;

  /**
   * Complete theme configuration object for the current theme.
   * Contains detailed styling information including colors, typography, and effects.
   */
  themeConfig: ThemeConfig;

  /**
   * User's personalization settings and preferences.
   * Includes accessibility settings, UI preferences, and customizations.
   */
  personalization: PersonalizationSettings;

  /**
   * Array of available theme presets that users can choose from.
   * Includes both built-in and custom themes.
   */
  availableThemes: ThemePreset[];

  /**
   * Optional theme store for advanced theme management.
   * Contains featured themes, categories, and community themes.
   */
  themeStore?: ThemeStore;

  // Enhanced Battles state

  /**
   * Array of currently active gaming battles the user is participating in.
   * Used for competitive alarm challenges and social features.
   */
  activeBattles?: Battle[];

  /**
   * List of user's friends with their gaming statistics.
   * Enables social features and friend challenges.
   */
  friends?: FriendWithStats[];

  /**
   * User's unlocked achievements and progress tracking.
   * Provides gamification and motivation through milestone recognition.
   */
  achievements?: Achievement[];

  /**
   * Active tournaments the user can participate in.
   * Larger-scale competitive events with multiple participants.
   */
  tournaments?: Tournament[];

  /**
   * Teams the user belongs to for group challenges.
   * Enables collaborative alarm goals and team-based competitions.
   */
  teams?: Team[];

  /**
   * Current gaming season information and leaderboards.
   * Provides seasonal context for competitions and rewards.
   */
  currentSeason?: Season;

  // Legacy support (deprecated)

  /**
   * @deprecated Use `currentTheme` instead
   * Legacy theme property maintained for backward compatibility.
   * Will be removed in a future version.
   */
  theme?: Theme;
}

// Enhanced Alarm Form Data
export interface AlarmFormData {
  time: string;
  label: string;
  days: number[];
  voiceMood: VoiceMood;
  // Enhanced Battles additions
  difficulty?: AlarmDifficulty;
  sound?: string;
  snoozeEnabled?: boolean;
  snoozeInterval?: number;
  weatherEnabled?: boolean;
  battleEnabled?: boolean;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isValidResponse: boolean;
}

// Rewards System Types
export interface Reward {
  id: string;
  type: 'achievement' | 'streak' | 'milestone' | 'habit_boost' | 'niche_mastery';
  title: string;
  description: string;
  icon: string;
  category: RewardCategory;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlockedAt: Date;
  progress?: RewardProgress;
  aiInsight?: string;
  personalizedMessage?: string;
}

export type RewardCategory =
  | 'consistency'
  | 'early_riser'
  | 'night_owl'
  | 'productivity'
  | 'wellness'
  | 'social'
  | 'explorer'
  | 'master'
  | 'challenger';

export interface RewardProgress {
  current: number;
  target: number;
  percentage: number;
  nextMilestone?: string;
}

export interface UserHabit {
  id: string;
  pattern: 'morning_routine' | 'evening_routine' | 'workout_time' | 'work_schedule' | 'weekend_vibes' | 'custom';
  frequency: number; // times per week
  consistency: number; // 0-1 score
  improvement: number; // trend score
  niche: UserNiche;
  lastAnalyzed: Date;
}

export interface UserNiche {
  primary: 'fitness' | 'work' | 'study' | 'creative' | 'family' | 'health' | 'social' | 'spiritual';
  secondary?: UserNiche['primary'];
  confidence: number; // AI confidence 0-1
  traits: string[]; // AI-detected personality traits
  preferences: {
    morningPerson: boolean;
    weekendSleeper: boolean;
    consistentSchedule: boolean;
    voiceMoodPreference: VoiceMood[];
  };
}

export interface AIInsight {
  id: string;
  type: 'habit_analysis' | 'improvement_suggestion' | 'pattern_recognition' | 'reward_recommendation';
  title: string;
  message: string;
  confidence: number;
  actionable: boolean;
  suggestedActions?: string[];
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface RewardSystem {
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  unlockedRewards: Reward[];
  availableRewards: Reward[];
  habits: UserHabit[];
  niche: UserNiche;
  aiInsights: AIInsight[];
  lastAnalysis: Date;
  // Enhanced Battles integration
  achievements?: Achievement[];
  dailyChallenges?: DailyChallenge[];
  weeklyChallenges?: WeeklyChallenge[];
  experienceHistory?: ExperienceGain[];
  levelRewards?: LevelReward[];
}

// ============================================================================
// STRUGGLING SAM OPTIMIZATION TYPES - Gamification & Social Proof
// ============================================================================

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
  type: 'streak_started' | 'achievement_unlocked' | 'challenge_joined' | 'milestone_reached';
  message: string;
  timestamp: Date;
  anonymous: boolean;
}

// ============================================================================
// PREMIUM SUBSCRIPTION TYPES - Subscription & Feature Gating
// ============================================================================

// Subscription tiers - consolidated definition
export type SubscriptionTier =
  | "free"
  | "basic"
  | "student"
  | "premium"
  | "pro"
  | "ultimate"
  | "lifetime";

// Subscription status values
export type SubscriptionStatus =
  | 'active'
  | 'inactive'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

// Premium feature definition
export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  category: "alarm" | "voice" | "analytics" | "customization" | "ai";
  isEnabled?: boolean;
  beta?: boolean;
}

// Note: SubscriptionPlan interface defined later in file with more comprehensive properties

// Detailed subscription status interface
export interface SubscriptionDetails {
  isActive: boolean;
  expiresAt?: string; // ISO date string
  renewsAt?: string; // ISO date string
  cancelledAt?: string; // ISO date string
  paymentMethod?: PaymentMethod;
  billingCycle: 'monthly' | 'yearly';
  trialEndsAt?: string; // ISO date string
  isTrialActive?: boolean;
  features: SubscriptionFeatureAccess;
  limits: SubscriptionLimits;
  nextBillingAmount?: number;
  currency: string;
}

// Payment method information
export interface PaymentMethod {
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string; // last 4 digits for cards
  brand?: string; // visa, mastercard, etc.
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

// Feature access details
export interface SubscriptionFeatureAccess {
  nuclearMode: boolean;
  customVoices: boolean;
  voiceCloning: boolean;
  extraPersonalities: boolean;
  advancedAnalytics: boolean;
  unlimitedAlarms: boolean;
  smartScheduling: boolean;
  premiumThemes: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
}

// Subscription limits
export interface SubscriptionLimits {
  maxAlarms: number | null; // null means unlimited
  maxCustomVoices: number | null;
  maxThemes: number | null;
  apiCallsPerMonth: number | null;
  storageQuotaMB: number | null;
  cloudBackups: number | null;
}

// Subscription usage tracking
export interface SubscriptionUsage {
  currentAlarms: number;
  currentCustomVoices: number;
  apiCallsThisMonth: number;
  storageUsedMB: number;
  lastUpdated: string;
}

// Premium upgrade options
export interface UpgradeOption {
  discount?: number; // percentage
  promoCode?: string;
  urgency?: 'low' | 'medium' | 'high';
  benefits: string[];
  testimonials?: CustomerTestimonial[];
}

// Customer testimonials for upgrade prompts
export interface CustomerTestimonial {
  id: string;
  customerName: string;
  customerTitle?: string;
  content: string;
  rating: number; // 1-5
  verified: boolean;
}

// Nuclear mode specific types
export interface NuclearModeChallenge {
  id: string;
  type: NuclearChallengeType;
  title: string;
  description: string;
  difficulty: number; // 1-10
  timeLimit?: number; // seconds
  attempts: number;
  maxAttempts: number;
  instructions: string[];
  successCriteria: string;
  failureConsequence: string;
  hints?: string[];
  configuration: NuclearChallengeConfig;
}

export type NuclearChallengeType =
  | 'multi_step_math'
  | 'memory_sequence'
  | 'physical_movement'
  | 'barcode_scan'
  | 'photo_proof'
  | 'voice_recognition'
  | 'typing_challenge'
  | 'pattern_matching'
  | 'location_verification'
  | 'qr_code_hunt'
  | 'shake_intensity'
  | 'sound_matching'
  | 'color_sequence'
  | 'puzzle_solving'
  | 'riddle_answer';

export interface NuclearChallengeConfig {
  mathComplexity?: 'basic' | 'advanced' | 'expert';
  sequenceLength?: number;
  movementType?: 'shake' | 'walk' | 'jump' | 'spin';
  barcodeRequired?: string; // specific barcode to scan
  photoType?: 'selfie' | 'environment' | 'specific_object';
  voicePhrase?: string;
  typingText?: string;
  typingSpeed?: number; // WPM required
  patternSize?: number;
  locationRadius?: number; // meters
  qrCodes?: string[]; // QR code content
  shakeThreshold?: number;
  soundFile?: string;
  colorCount?: number;
  puzzleComplexity?: 'easy' | 'medium' | 'hard';
  riddleCategory?: string;
}

// Nuclear mode session tracking
export interface NuclearModeSession {
  id: string;
  alarmId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  challenges: NuclearChallengeAttempt[];
  totalAttempts: number;
  successfulChallenges: number;
  failedChallenges: number;
  sessionDuration: number; // seconds
  difficulty: number; // 1-10
  result: 'completed' | 'failed' | 'abandoned';
  performance: NuclearPerformance;
}

export interface NuclearChallengeAttempt {
  challengeId: string;
  challenge: NuclearModeChallenge;
  attemptNumber: number;
  startedAt: string;
  completedAt?: string;
  successful: boolean;
  timeToComplete?: number; // seconds
  hintsUsed: number;
  errorsMade: number;
  details?: Record<string, any>; // challenge-specific data
}

export interface NuclearPerformance {
  overallScore: number; // 0-100
  speed: number; // 0-100
  accuracy: number; // 0-100
  persistence: number; // 0-100
  improvement: number; // compared to previous sessions
  rank: number; // among all nuclear mode users
  achievements: string[]; // achievement IDs unlocked
}

// Premium voice system types
export interface PremiumVoice {
  id: string;
  name: string;
  description: string;
  mood: VoiceMood;
  category: PremiumVoiceCategory;
  language: string;
  accent?: string;
  gender: 'male' | 'female' | 'neutral' | 'custom';
  ageRange: string; // e.g., "young adult", "middle-aged"
  personality: VoicePersonality;
  samples: VoiceSample[];
  isCustom: boolean;
  createdBy?: string; // user ID for custom voices
  tags: string[];
  popularity: number;
  rating: number; // 1-5
  downloadCount: number;
  features: VoiceFeatures;
}

export type PremiumVoiceCategory =
  | 'celebrity_style'
  | 'professional'
  | 'entertainment'
  | 'motivational'
  | 'soothing'
  | 'energetic'
  | 'character'
  | 'custom'
  | 'ai_generated';

export interface VoicePersonality {
  energy: number; // 1-10
  friendliness: number; // 1-10
  authority: number; // 1-10
  humor: number; // 1-10
  empathy: number; // 1-10
  directness: number; // 1-10
}

export interface VoiceSample {
  id: string;
  text: string;
  audioUrl: string;
  duration: number; // seconds
  context: 'wake_up' | 'motivation' | 'challenge' | 'success' | 'failure';
}

export interface VoiceFeatures {
  supportsSSML: boolean; // Speech Synthesis Markup Language
  supportsEmotions: boolean;
  supportsSpeedControl: boolean;
  supportsPitchControl: boolean;
  supportsBreathing: boolean;
  supportsWhisper: boolean;
  supportsEmphasis: boolean;
  maxTextLength: number;
}

// Voice cloning (Ultimate tier feature)
export interface VoiceCloneRequest {
  id: string;
  userId: string;
  name: string;
  description?: string;
  sourceType: 'upload' | 'record' | 'import';
  audioFiles: VoiceCloneFile[];
  status: VoiceCloneStatus;
  progress: number; // 0-100
  estimatedCompletion?: string;
  createdAt: string;
  completedAt?: string;
  result?: VoiceCloneResult;
  settings: VoiceCloneSettings;
}

export type VoiceCloneStatus =
  | 'pending'
  | 'processing'
  | 'training'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface VoiceCloneFile {
  id: string;
  fileName: string;
  fileSize: number;
  duration: number; // seconds
  uploadedAt: string;
  processed: boolean;
  quality: 'low' | 'medium' | 'high' | 'excellent';
  transcription?: string;
}

export interface VoiceCloneResult {
  voiceId: string;
  quality: number; // 1-10
  similarity: number; // 1-10 compared to source
  naturalness: number; // 1-10
  clarity: number; // 1-10
  recommendations: string[];
  limitationsWarning?: string;
}

export interface VoiceCloneSettings {
  enhanceQuality: boolean;
  removeNoise: boolean;
  normalizeVolume: boolean;
  targetLanguage: string;
  voiceGender?: 'preserve' | 'male' | 'female' | 'neutral';
  speedAdjustment: number; // -50 to +50
  pitchAdjustment: number; // -50 to +50
  addEmotions: boolean;
}

// Premium analytics types
export interface PremiumAnalytics {
  userId: string;
  period: AnalyticsPeriod;
  sleepInsights: SleepInsights;
  wakeUpPatterns: WakeUpPatterns;
  performanceMetrics: PerformanceMetrics;
  recommendations: AnalyticsRecommendation[];
  trends: AnalyticsTrend[];
  comparisons: AnalyticsComparison;
  goals: AnalyticsGoal[];
  achievements: AnalyticsAchievement[];
  exportOptions: AnalyticsExportOption[];
}

export type AnalyticsPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface SleepInsights {
  averageSleepDuration: number; // hours
  sleepQualityScore: number; // 1-10
  consistencyScore: number; // 1-10
  optimalBedtime: string;
  optimalWakeTime: string;
  sleepDebt: number; // hours
  weekendCatchUp: number; // hours
  sleepEfficiency: number; // percentage
  factors: SleepFactorAnalysis[];
}

export interface SleepFactorAnalysis {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  strength: number; // 1-10
  frequency: number; // how often it occurs
  recommendation: string;
}

export interface WakeUpPatterns {
  averageWakeTime: string;
  consistencyScore: number; // 1-10
  weekdayPattern: TimePattern;
  weekendPattern: TimePattern;
  seasonalTrends: SeasonalTrend[];
  moodCorrelations: MoodCorrelation[];
}

export interface TimePattern {
  average: string;
  earliest: string;
  latest: string;
  variance: number; // minutes
  trend: 'improving' | 'declining' | 'stable';
}

export interface SeasonalTrend {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  averageWakeTime: string;
  sleepDuration: number;
  qualityScore: number;
}

export interface MoodCorrelation {
  mood: WakeUpMood;
  frequency: number; // percentage
  averageWakeTime: string;
  sleepDuration: number;
  factorsInfluencing: string[];
}

export interface PerformanceMetrics {
  wakeUpSuccessRate: number; // percentage
  averageSnoozeCount: number;
  challengeSuccessRate: number; // percentage
  improvementRate: number; // percentage month over month
  streakMetrics: StreakMetrics;
  difficultyProgression: DifficultyProgression;
}

export interface StreakMetrics {
  currentStreak: number;
  longestStreak: number;
  averageStreakLength: number;
  streakBreakReasons: StreakBreakReason[];
}

export interface StreakBreakReason {
  reason: string;
  frequency: number; // percentage
  impact: 'minor' | 'moderate' | 'major';
}

export interface DifficultyProgression {
  currentLevel: AlarmDifficulty;
  recommendedNext: AlarmDifficulty;
  readinessScore: number; // 1-10
  skillAreas: SkillArea[];
}

export interface SkillArea {
  area: string;
  currentLevel: number; // 1-10
  improvement: number; // change from last period
  exercises: string[];
}

export interface AnalyticsRecommendation {
  id: string;
  type: 'sleep' | 'wake_time' | 'difficulty' | 'routine' | 'health';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  expectedImpact: string;
  timeToSeeResults: string;
  actionSteps: string[];
  basedOn: string[]; // data sources
  confidence: number; // 1-10
}

export interface AnalyticsTrend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  magnitude: number; // how significant
  timeframe: string;
  prediction: string;
  factors: string[];
}

export interface AnalyticsComparison {
  personalBest: Record<string, number>;
  lastPeriod: Record<string, number>;
  peerAverage: Record<string, number>;
  globalAverage: Record<string, number>;
  ranking: AnalyticsRanking;
}

export interface AnalyticsRanking {
  overall: number; // percentile
  consistency: number;
  improvement: number;
  longevity: number; // how long using the app
}

export interface AnalyticsGoal {
  id: string;
  type: 'consistency' | 'wake_time' | 'sleep_duration' | 'difficulty' | 'custom';
  title: string;
  target: number;
  current: number;
  progress: number; // percentage
  deadline?: string;
  reward?: string;
  status: 'active' | 'completed' | 'paused' | 'failed';
}

export interface AnalyticsAchievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: string;
  value: number;
}

export interface AnalyticsExportOption {
  format: 'pdf' | 'csv' | 'json' | 'xlsx';
  title: string;
  description: string;
  dataIncluded: string[];
  premium: boolean;
}

// ============================================================================
// ENHANCED BATTLES TYPES - Gaming & Competition Features
// ============================================================================

// Enhanced Theme & Personalization Types
export type Theme =
  | 'light'
  | 'dark'
  | 'auto'
  | 'system'
  | 'high-contrast'
  | 'minimalist'
  | 'colorful'
  | 'nature'
  | 'ocean'
  | 'sunset'
  | 'forest'
  | 'cosmic'
  | 'gradient'
  | 'neon'
  | 'pastel'
  | 'monochrome'
  | 'gaming'
  | 'professional'
  | 'retro'
  | 'cyberpunk'
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'focus'
  | 'ocean-breeze'
  | 'sunset-glow'
  | 'forest-dream'
  | 'midnight-cosmos'
  | 'custom';

export interface ThemeConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: ThemeCategory;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  animations: ThemeAnimations;
  effects: ThemeEffects;
  accessibility: ThemeAccessibility;
  previewImage?: string;
  isCustom: boolean;
  isPremium: boolean;
  createdBy?: string;
  createdAt?: Date;
  popularity?: number;
  rating?: number;
}

export type ThemeCategory = 'system' | 'nature' | 'abstract' | 'gradient' | 'accessibility' | 'premium' | 'custom';

export interface ThemeColors {
  // Base colors
  primary: ColorPalette;
  secondary: ColorPalette;
  accent: ColorPalette;
  neutral: ColorPalette;

  // Semantic colors
  success: ColorPalette;
  warning: ColorPalette;
  error: ColorPalette;
  info: ColorPalette;

  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    overlay: string;
    modal: string;
    card: string;
  };

  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    disabled: string;
    link: string;
  };

  // Border colors
  border: {
    primary: string;
    secondary: string;
    focus: string;
    hover: string;
    active: string;
  };

  // Surface colors
  surface: {
    elevated: string;
    depressed: string;
    interactive: string;
    disabled: string;
  };
}

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // base color
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface ThemeTypography {
  fontFamily: {
    primary: string;
    secondary: string;
    monospace: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface ThemeSpacing {
  scale: number; // base scale multiplier
  sizes: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    8: string;
    10: string;
    12: string;
    16: string;
    20: string;
    24: string;
    32: string;
    40: string;
    48: string;
    56: string;
    64: string;
  };
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
}

export interface ThemeAnimations {
  enabled: boolean;
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    linear: string;
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    bounce: string;
    elastic: string;
  };
  scale: number; // global animation speed multiplier
}

export interface ThemeEffects {
  shadows: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
    none: string;
  };
  blur: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  opacity: {
    disabled: number;
    hover: number;
    focus: number;
    overlay: number;
  };
  gradients: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

export interface ThemeAccessibility {
  contrastRatio: 'AA' | 'AAA' | 'custom';
  reduceMotion: boolean;
  highContrast: boolean;
  largeFonts: boolean;
  focusVisible: boolean;
  reducedTransparency: boolean;
}

export interface PersonalizationSettings {
  theme: Theme;
  customTheme?: CustomThemeConfig;
  colorPreferences: ColorPreferences;
  typographyPreferences: TypographyPreferences;
  motionPreferences: MotionPreferences;
  soundPreferences: SoundPreferences;
  layoutPreferences: LayoutPreferences;
  accessibilityPreferences: AccessibilityPreferences;
  lastUpdated: Date;
  syncAcrossDevices: boolean;
}

export interface CustomThemeConfig extends ThemeConfig {
  baseTheme: Theme; // theme this custom theme is based on
  customizations: ThemeCustomizations;
  isShared: boolean;
  sharedWith?: string[]; // user IDs
}

export interface ThemeCustomizations {
  colors?: Partial<ThemeColors>;
  typography?: Partial<ThemeTypography>;
  spacing?: Partial<ThemeSpacing>;
  animations?: Partial<ThemeAnimations>;
  effects?: Partial<ThemeEffects>;
  overrides?: CSSCustomProperties;
}

export interface CSSCustomProperties {
  [key: string]: string | number;
}

export interface ColorPreferences {
  favoriteColors: string[];
  avoidColors: string[];
  colorblindFriendly: boolean;
  highContrastMode: boolean;
  customAccentColor?: string;
  saturationLevel: number; // 0-100
  brightnessLevel: number; // 0-100
  warmthLevel: number; // 0-100 (warm to cool)
}

export interface TypographyPreferences {
  preferredFontSize: 'small' | 'medium' | 'large' | 'extra-large';
  fontSizeScale: number; // multiplier for base font size
  preferredFontFamily: 'system' | 'sans-serif' | 'serif' | 'monospace' | 'custom';
  customFontFamily?: string;
  lineHeightPreference: 'compact' | 'comfortable' | 'relaxed';
  letterSpacingPreference: 'tight' | 'normal' | 'wide';
  fontWeight: 'light' | 'normal' | 'medium' | 'bold';
  dyslexiaFriendly: boolean;
}

export interface MotionPreferences {
  enableAnimations: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  reduceMotion: boolean;
  preferCrossfade: boolean;
  enableParallax: boolean;
  enableHoverEffects: boolean;
  enableFocusAnimations: boolean;
}

export interface SoundPreferences {
  enableSounds: boolean;
  soundVolume: number; // 0-100
  soundTheme: SoundTheme;
  customSounds: CustomSoundMapping;
  muteOnFocus: boolean;
  hapticFeedback: boolean;
  spatialAudio: boolean;
}

export type SoundTheme =
  | 'default'
  | 'nature'
  | 'electronic'
  | 'retro'
  | 'minimal'
  | 'energetic'
  | 'calm'
  | 'ambient'
  | 'cinematic'
  | 'futuristic'
  | 'meditation'
  | 'workout'
  | 'fantasy'
  | 'horror'
  | 'cyberpunk'
  | 'lofi'
  | 'classical'
  | 'jazz'
  | 'rock'
  | 'custom';

export interface CustomSoundMapping {
  [action: string]: string; // action -> sound file URL
}

export interface LayoutPreferences {
  density: 'compact' | 'comfortable' | 'spacious';
  navigation: 'bottom' | 'side' | 'top';
  cardStyle: 'flat' | 'elevated' | 'outlined';
  borderRadius: 'sharp' | 'rounded' | 'circular';
  showLabels: boolean;
  showIcons: boolean;
  iconSize: 'small' | 'medium' | 'large';
  gridColumns: number;
  listSpacing: 'tight' | 'normal' | 'loose';
}

export interface AccessibilityPreferences {
  screenReaderOptimized: boolean;
  keyboardNavigationOnly: boolean;
  highContrastMode: boolean;
  largeTargets: boolean; // make clickable areas larger
  reducedTransparency: boolean;
  boldText: boolean;
  underlineLinks: boolean;
  flashingElementsReduced: boolean;
  colorOnlyIndicators: boolean; // avoid using color as only indicator
  focusIndicatorStyle: 'outline' | 'highlight' | 'glow';
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: Theme;
  personalization: Partial<PersonalizationSettings>;
  preview: ThemePreview;
  tags: string[];
  isDefault: boolean;
  isPremium: boolean;
  createdBy?: string;
  popularityScore: number;
}

export interface ThemePreview {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  cardColor: string;
  accentColor: string;
  gradientPreview?: string;
  thumbnailUrl?: string;
}

export interface ThemeStore {
  featured: ThemePreset[];
  categories: ThemeStoreCategory[];
  userThemes: CustomThemeConfig[];
  sharedThemes: CustomThemeConfig[];
  recentlyUsed: Theme[];
  trending: ThemePreset[];
}

export interface ThemeStoreCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  themes: ThemePreset[];
  count: number;
}

export interface ThemeUsageAnalytics {
  mostUsedThemes: { theme: Theme; usage: number }[];
  timeSpentPerTheme: { theme: Theme; timeMs: number }[];
  switchFrequency: number; // switches per day
  favoriteColors: string[];
  accessibilityFeatureUsage: { feature: string; enabled: boolean }[];
  customizationActivity: ThemeCustomizationEvent[];
}

export interface ThemeCustomizationEvent {
  id: string;
  type: 'color_change' | 'font_change' | 'layout_change' | 'accessibility_change';
  property: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  revertedAt?: Date;
}

export interface ThemeExportData {
  version: string;
  exportedAt: Date;
  themes: CustomThemeConfig[];
  personalization: PersonalizationSettings;
  metadata: {
    appVersion: string;
    platform: string;
    userId?: string;
  };
}

export interface ThemeImportResult {
  success: boolean;
  importedThemes: string[]; // theme IDs
  skippedThemes: string[];
  errors: string[];
  warnings: string[];
  conflictResolution?: 'overwrite' | 'rename' | 'skip';
}

// Battle Types
export type BattleType = 'speed' | 'consistency' | 'tasks' | 'bragging' | 'group' | 'tournament' | 'team';
export type BattleStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'registration';

export interface Battle {
  id: string;
  type: BattleType;
  participants: BattleParticipant[];
  creatorId: string;
  status: BattleStatus;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  settings: BattleSettings;
  winner?: string; // userId
  createdAt: string;
  // Enhanced battle fields
  tournamentId?: string;
  teamId?: string;
  seasonId?: string;
  maxParticipants?: number;
  minParticipants?: number;
  entryFee?: number; // XP cost to join
  prizePool?: BattlePrize;
}

export interface BattlePrize {
  experience: number;
  title?: string;
  badge?: string;
  seasonPoints?: number;
}

export interface BattleParticipant {
  userId: string;
  user: User;
  joinedAt: string;
  progress: number; // 0-100
  completedAt?: string;
  stats: BattleParticipantStats;
}

export interface BattleParticipantStats {
  wakeTime?: string;
  tasksCompleted: number;
  snoozeCount: number;
  score: number;
}

export interface BattleSettings {
  duration: string; // ISO duration string (e.g., "PT24H" for 24 hours)
  maxParticipants?: number;
  difficulty?: AlarmDifficulty; // difficulty level for the battle
  tasks?: BattleTask[];
  speedTarget?: string; // time string for speed battles
  consistencyDays?: number; // for consistency battles
  allowLateJoins?: boolean; // whether to allow participants to join after battle starts
}

export interface BattleTask {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

// Community & Social Types
export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  acceptedAt?: string;
}

export interface FriendWithStats extends User {
  stats: UserStats;
  friendship: Friendship;
  isOnline: boolean;
  activeBattles: number;
}

export interface TrashTalkMessage {
  id: string;
  battleId: string;
  userId: string;
  user: User;
  message: string;
  timestamp: string;
}

// Achievement & Gamification Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  type: AchievementType;
  rarity: AchievementRarity;
  iconUrl: string;
  unlockedAt?: string;
  progress?: AchievementProgress;
  rewards: AchievementReward[];
  requirements: AchievementRequirement[];
}

export type AchievementCategory = 'wakeup' | 'battles' | 'social' | 'consistency' | 'challenges' | 'special';
export type AchievementType = 'milestone' | 'streak' | 'challenge' | 'social' | 'seasonal' | 'rare';
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
}

export interface AchievementReward {
  type: 'experience' | 'title' | 'badge' | 'avatar' | 'theme' | 'sound';
  value: number | string;
  description: string;
}

export interface AchievementRequirement {
  type: 'battles_won' | 'streak_days' | 'early_wake' | 'friends_added' | 'tournaments_won' | 'tasks_completed';
  value: number;
  description: string;
}

export interface DailyChallenge {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  description: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  target: number;
  progress: number;
  rewards: ChallengeReward[];
  completed: boolean;
  completedAt?: string;
  expiresAt: string;
}

export type ChallengeType = 'wake_early' | 'no_snooze' | 'battle_win' | 'friend_challenge' | 'task_master' | 'consistency' | 'social';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface ChallengeReward {
  type: 'experience' | 'badge' | 'title' | 'bonus_xp';
  value: number | string;
  description: string;
}

export interface WeeklyChallenge extends DailyChallenge {
  weekStart: string; // YYYY-MM-DD
  dailyProgress: DailyChallengeProgress[];
}

export interface DailyChallengeProgress {
  date: string;
  completed: boolean;
  progress: number;
}

export interface LevelReward {
  level: number;
  experience: number;
  rewards: LevelRewardItem[];
  unlocked: boolean;
  unlockedAt?: string;
}

export interface LevelRewardItem {
  type: 'title' | 'badge' | 'avatar' | 'theme' | 'sound' | 'feature';
  name: string;
  description: string;
  value: string;
  rarity: AchievementRarity;
}

export interface ExperienceGain {
  id: string;
  userId: string;
  amount: number;
  source: ExperienceSource;
  description: string;
  multiplier?: number;
  timestamp: string;
}

export type ExperienceSource = 'alarm_complete' | 'battle_win' | 'battle_participate' | 'challenge_complete' | 'achievement_unlock' | 'streak_bonus' | 'friend_referral' | 'daily_login';

export interface StreakBonus {
  days: number;
  multiplier: number;
  bonusXP: number;
  title?: string;
  badge?: string;
}

export interface PlayerLevel {
  current: number;
  experience: number;
  experienceToNext: number;
  experienceTotal: number;
  progress: number; // 0-100 to next level
}

// Tournament Types
export interface Tournament {
  id: string;
  name: string;
  description: string;
  type: 'single-elimination' | 'round-robin' | 'swiss';
  status: 'registration' | 'active' | 'completed';
  participants: TournamentParticipant[];
  maxParticipants: number;
  rounds: TournamentRound[];
  currentRound: number;
  winner?: string;
  prizePool: BattlePrize[];
  startTime: string;
  endTime: string;
  entryFee: number;
  seasonId?: string;
  createdAt: string;
}

export interface TournamentParticipant {
  userId: string;
  user: User;
  registeredAt: string;
  eliminated: boolean;
  currentRound: number;
  wins: number;
  losses: number;
}

export interface TournamentRound {
  id: string;
  roundNumber: number;
  battles: Battle[];
  status: 'pending' | 'active' | 'completed';
  startTime: string;
  endTime: string;
}

// Team Types
export interface Team {
  id: string;
  name: string;
  description: string;
  captainId: string;
  members: TeamMember[];
  maxMembers: number;
  isPublic: boolean;
  stats: TeamStats;
  createdAt: string;
  seasonId?: string;
}

export interface TeamMember {
  userId: string;
  user: User;
  role: 'captain' | 'member';
  joinedAt: string;
  contribution: TeamContribution;
}

export interface TeamContribution {
  battlesParticipated: number;
  battlesWon: number;
  totalScore: number;
  averagePerformance: number;
}

export interface TeamStats {
  totalBattles: number;
  wins: number;
  losses: number;
  winRate: number;
  rank: number;
  seasonPoints: number;
  averageScore: number;
}

// Gaming Season Types
export interface GameSeason {
  id: string;
  name: string;
  description: string;
  status: 'upcoming' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  type: 'individual' | 'team' | 'mixed';
  leaderboard: GameSeasonRanking[];
  tournaments: Tournament[];
  rewards: GameSeasonReward[];
  theme: string;
  rules: string[];
}

export interface GameSeasonRanking {
  rank: number;
  userId?: string;
  teamId?: string;
  entity: User | Team;
  points: number;
  battlesWon: number;
  totalBattles: number;
  change: number; // position change from last update
}

export interface GameSeasonReward {
  rank: number;
  experience: number;
  title?: string;
  badge?: string;
  exclusiveContent?: string;
}

// Smart Features Types
export interface SmartAlarmSettings {
  weatherEnabled: boolean;
  locationEnabled: boolean;
  fitnessEnabled: boolean;
  smartWakeWindow: number; // minutes before alarm to start smart wake
  adaptiveDifficulty: boolean;
  contextualTasks: boolean;
  environmentalAdjustments: boolean;
}

export interface WeatherAlarm extends Alarm {
  weatherEnabled: boolean;
  weatherConditions: WeatherCondition[];
  weatherActions: WeatherAction[];
}

export interface WeatherCondition {
  type: 'rain' | 'snow' | 'sunny' | 'cloudy' | 'windy' | 'hot' | 'cold';
  operator: 'equals' | 'greater_than' | 'less_than';
  value?: number; // for temperature conditions
}

export interface WeatherAction {
  condition: WeatherCondition;
  action: 'adjust_time' | 'change_sound' | 'add_task' | 'send_notification';
  value: string | number;
  description: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: WeatherForecast[];
  location: string;
  lastUpdated: string;
}

export interface WeatherForecast {
  time: string;
  temperature: number;
  condition: string;
  precipitation: number;
}

// ===== ADVANCED ALARM SCHEDULING TYPES =====

// Enhanced Alarm with Advanced Scheduling
export interface AdvancedAlarm {
  scheduleType: ScheduleType;
  recurrencePattern?: RecurrencePattern;
  conditionalRules?: ConditionalRule[];
  locationTriggers?: LocationTrigger[];
  calendarIntegration?: CalendarIntegration;
  timeZone?: string;
  seasonalAdjustments?: SeasonalAdjustment[];
  smartOptimizations?: SmartOptimization[];
  dependencies?: AlarmDependency[];
}

// Schedule Types
export type ScheduleType =
  | 'once'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom'
  | 'conditional'
  | 'dynamic';

// Advanced Recurrence Patterns
export interface RecurrencePattern {
  type: RecurrenceType;
  interval: number; // every N days/weeks/months
  daysOfWeek?: number[]; // 0-6 for weekly patterns
  daysOfMonth?: number[]; // 1-31 for monthly patterns
  weeksOfMonth?: number[]; // 1-5 for monthly patterns (first week, second week, etc.)
  monthsOfYear?: number[]; // 1-12 for yearly patterns
  endDate?: Date;
  endAfterOccurrences?: number;
  exceptions?: Date[]; // dates to skip
  customPattern?: CustomPattern;
}

export type RecurrenceType =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'workdays'
  | 'weekends'
  | 'custom';

export interface CustomPattern {
  name: string;
  description: string;
  dates: string[]; // specific dates in ISO format
  intervals: number[]; // days from start date
  businessDaysOnly?: boolean;
  skipHolidays?: boolean;
}

// Conditional Scheduling
export interface ConditionalRule {
  id: string;
  name: string;
  condition: AlarmCondition;
  action: AlarmAction;
  priority: number;
  isActive: boolean;
}

export interface AlarmCondition {
  type: ConditionType;
  operator: ConditionOperator;
  value: any;
  source?: string; // API endpoint, calendar, etc.
}

export type ConditionType =
  | 'weather'
  | 'calendar'
  | 'calendar_event'
  | 'sleep_quality'
  | 'day_of_week'
  | 'date_range'
  | 'time_since_last'
  | 'fitness_metric'
  | 'location'
  | 'battery_level'
  | 'do_not_disturb'
  | 'custom';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'between'
  | 'exists'
  | 'not_exists';

export interface AlarmAction {
  type: ActionType;
  value: any;
  parameters?: Record<string, any>;
}

export type ActionType =
  | 'adjust_time'
  | 'change_sound'
  | 'change_difficulty'
  | 'skip_alarm'
  | 'add_task'
  | 'send_notification'
  | 'delay_by'
  | 'change_volume'
  | 'change_voice_mood'
  | 'trigger_other_alarm'
  | 'enable_alarm'
  | 'disable_alarm';

// Location-Based Alarms
export interface LocationTrigger {
  id: string;
  name: string;
  type: LocationTriggerType;
  location: Location;
  radius: number; // meters
  action: LocationAction;
  isActive: boolean;
}

export type LocationTriggerType =
  | 'enter_location'
  | 'exit_location'
  | 'arrive_home'
  | 'leave_home'
  | 'arrive_work'
  | 'leave_work';

export interface LocationAction {
  type: 'enable_alarm' | 'disable_alarm' | 'adjust_time' | 'notification';
  parameters: Record<string, any>;
}

// Calendar Integration
export interface CalendarIntegration {
  provider: CalendarProvider;
  calendarId?: string;
  eventTypes?: string[];
  lookAheadMinutes: number;
  adjustmentRules: CalendarAdjustmentRule[];
  isActive: boolean;
}

export type CalendarProvider =
  | 'google'
  | 'outlook'
  | 'apple'
  | 'ics_url'
  | 'caldav';

export interface CalendarAdjustmentRule {
  eventType: string;
  adjustment: number; // minutes before event
  action: 'set_alarm' | 'adjust_existing' | 'skip_if_conflict';
}

// Seasonal & Dynamic Adjustments
export interface SeasonalAdjustment {
  season: Season;
  adjustmentMinutes: number;
  startDate: string; // MM-DD format
  endDate: string; // MM-DD format
  isActive: boolean;
}

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

// Smart Optimizations
export interface SmartOptimization {
  type: OptimizationType;
  isEnabled: boolean;
  parameters: OptimizationParameters;
  lastApplied?: Date;
  effectiveness?: number; // 0-1 score
}

export type OptimizationType =
  | 'sleep_cycle'
  | 'sunrise_sunset'
  | 'traffic_conditions'
  | 'weather_forecast'
  | 'energy_levels'
  | 'workout_schedule'
  | 'social_patterns';

export interface OptimizationParameters {
  sensitivity: number; // 0-1, how aggressively to optimize
  maxAdjustment: number; // max minutes to adjust
  learningEnabled: boolean;
  preferences: Record<string, any>;
}

// Alarm Dependencies
export interface AlarmDependency {
  type: DependencyType;
  targetAlarmId?: string;
  condition: string;
  action: string;
}

export type DependencyType =
  | 'sequential'
  | 'conditional'
  | 'alternative'
  | 'backup';

// Advanced Scheduling Configuration
export interface SchedulingConfig {
  timeZone: string;
  defaultWakeWindow: number;
  enableSmartAdjustments: boolean;
  maxDailyAdjustment: number;
  learningMode: boolean;
  privacyMode: boolean;
  backupAlarms: boolean;
  advancedLogging: boolean;
}

// Scheduling Statistics
export interface SchedulingStats {
  totalScheduledAlarms: number;
  successfulWakeUps: number;
  averageAdjustment: number;
  mostEffectiveOptimization: OptimizationType;
  patternRecognition: PatternInsight[];
  recommendations: SchedulingRecommendation[];
}

export interface PatternInsight {
  pattern: string;
  frequency: number;
  confidence: number;
  suggestion: string;
}

export interface SchedulingRecommendation {
  type: 'optimization' | 'pattern' | 'health' | 'efficiency';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  action: string;
}

// Sunrise/Sunset Based Scheduling
export interface SunSchedule {
  type: 'sunrise' | 'sunset';
  offset: number; // minutes before/after
  location: Location;
  seasonalAdjustment: boolean;
}

// Bulk Scheduling Operations
export interface BulkScheduleOperation {
  operation: 'create' | 'update' | 'delete' | 'duplicate';
  alarmIds?: string[];
  dateRange?: { start: Date; end: Date };
  filters?: ScheduleFilter[];
}

export interface ScheduleFilter {
  operator: ConditionOperator;
  value: any;
}

// Import/Export Scheduling
export interface ScheduleExport {
  version: string;
  exportDate: string;
  alarms: Alarm[];
  settings: SchedulingConfig;
  metadata: Record<string, any>;
}

export interface ScheduleImport {
  source: 'backup' | 'template' | 'migration';
  data: ScheduleExport;
  options: ImportOptions;
}

export interface ImportOptions {
  overwriteExisting: boolean;
  preserveIds: boolean;
  adjustTimeZones: boolean;
  skipInvalid: boolean;
}

// Location Challenge Types
export interface LocationChallenge {
  id: string;
  name: string;
  description: string;
  type: LocationChallengeType;
  targetLocation: Location;
  radius: number; // meters
  timeLimit?: number; // minutes
  rewards: ChallengeReward[];
  status: 'active' | 'completed' | 'failed' | 'expired';
  startedAt?: string;
  completedAt?: string;
  progress: LocationProgress;
}

export type LocationChallengeType = 'visit_place' | 'stay_duration' | 'distance_from_home' | 'elevation_gain' | 'speed_challenge';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

export interface LocationProgress {
  currentLocation?: Location;
  distanceToTarget?: number;
  timeInRadius?: number;
  elevationGained?: number;
  averageSpeed?: number;
}

// Fitness Integration Types
export interface FitnessIntegration {
  id: string;
  userId: string;
  provider: FitnessProvider;
  isConnected: boolean;
  lastSync: string;
  permissions: FitnessPermission[];
  data: FitnessData;
}

export type FitnessProvider = 'apple_health' | 'google_fit' | 'fitbit' | 'garmin' | 'strava' | 'polar';
export type FitnessPermission = 'steps' | 'sleep' | 'heart_rate' | 'activity' | 'distance' | 'calories';

export interface FitnessData {
  steps: number;
  sleepHours: number;
  heartRate?: number;
  activeMinutes: number;
  distance: number; // meters
  caloriesBurned: number;
  date: string;
}

export interface FitnessChallenge extends DailyChallenge {
  fitnessType: FitnessPermission;
  targetValue: number;
  currentValue: number;
  unit: string;
  integration: FitnessProvider;
}

// Enhanced Settings Types
export interface UserSettings {
  theme: Theme;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  alarm: AlarmSettings;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  battleChallenges: boolean;
  friendRequests: boolean;
  achievements: boolean;
  reminders: boolean;
  trashTalk: boolean;
}

export interface PrivacySettings {
  profileVisible: boolean;
  statsVisible: boolean;
  onlineStatus: boolean;
  allowFriendRequests: boolean;
}

export interface AlarmSettings {
  defaultSound: string;
  defaultSnoozeInterval: number;
  maxSnoozeCount: number;
  vibrationEnabled: boolean;
  gradualVolumeIncrease: boolean;
}

// Media & Content Types
export interface CustomSound {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  duration: number; // seconds
  category: SoundCategory;
  tags: string[];
  isCustom: boolean;
  uploadedBy?: string;
  uploadedAt?: string;
  downloads?: number;
  rating?: number;
}

export type SoundCategory = 'nature' | 'music' | 'voice' | 'mechanical' | 'ambient' | 'energetic' | 'calm' | 'custom';

// Sound selection types
export interface SoundOption {
  id: string;
  name: string;
  type: 'built-in' | 'custom' | 'voice-only';
  category?: SoundCategory;
  preview?: string; // URL or identifier for preview
  customSound?: CustomSound; // Full custom sound data if type is 'custom'
}

export interface SoundLibrary {
  builtInSounds: SoundOption[];
  customSounds: CustomSound[];
  voiceOnlyMode: SoundOption;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  sounds: PlaylistSound[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  playCount: number;
  likeCount: number;
  shareCount: number;
}

export interface PlaylistSound {
  soundId: string;
  sound: CustomSound;
  order: number;
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
  volume?: number; // 0-1
}

export interface MotivationalQuote {
  id: string;
  text: string;
  author?: string;
  category: QuoteCategory;
  tags: string[];
  isCustom: boolean;
  submittedBy?: string;
  submittedAt?: string;
  likes: number;
  uses: number;
}

export type QuoteCategory = 'motivation' | 'inspiration' | 'success' | 'health' | 'productivity' | 'mindfulness' | 'humor' | 'custom';

export interface PhotoChallenge {
  id: string;
  name: string;
  description: string;
  category: PhotoChallengeCategory;
  difficulty: ChallengeDifficulty;
  prompts: PhotoPrompt[];
  timeLimit?: number; // minutes
  rewards: ChallengeReward[];
  examples?: PhotoExample[];
  createdBy: string;
  createdAt: string;
  popularity: number;
  completionRate: number;
}

export type PhotoChallengeCategory = 'selfie' | 'environment' | 'task_proof' | 'creative' | 'location' | 'fitness' | 'food' | 'pets';

export interface PhotoPrompt {
  id: string;
  text: string;
  optional: boolean;
  hints?: string[];
  validationRules?: PhotoValidationRule[];
}

export interface PhotoValidationRule {
  type: 'face_detection' | 'object_detection' | 'location_check' | 'timestamp_check' | 'lighting_check';
  parameters: Record<string, any>;
  required: boolean;
}

export interface PhotoExample {
  id: string;
  imageUrl: string;
  description: string;
  rating: number;
}

// Quest & Ranking Types
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  target: number;
  progress: number;
  reward: QuestReward;
  expiresAt?: string;
  completedAt?: string;
}

export type QuestType = 'daily' | 'weekly' | 'monthly' | 'achievement';

export interface QuestReward {
  experience: number;
  title?: string;
  badge?: string;
}

export interface RankingEntry {
  rank: number;
  user: User;
  score: number;
  change: number; // position change since last period
}

export interface Rankings {
  global: RankingEntry[];
  friends: RankingEntry[];
  weekly: RankingEntry[];
  monthly: RankingEntry[];
}

// Notification Types (Enhanced)
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

export type NotificationType = 'battle_challenge' | 'battle_result' | 'friend_request' | 'achievement' | 'quest_complete' | 'reminder';

// API Response Types
// AI & ML Types for Enhanced Features
export interface AIOptimization {
  id: string;
  userId: string;
  type: 'sleep_pattern' | 'wake_time' | 'mood_prediction' | 'task_scheduling' | 'difficulty_adjustment';
  suggestion: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  appliedAt?: Date;
  results?: AIOptimizationResult;
  createdAt: Date;
  isEnabled: boolean;
  lastOptimized?: Date;
}

export interface AIOptimizationResult {
  improvementPercentage: number;
  userSatisfaction: number; // 1-10
  metricsChanged: Record<string, number>;
  followUpNeeded: boolean;
}

export interface AIRecommendation {
  id: string;
  userId: string;
  category: 'alarm' | 'routine' | 'challenge' | 'social' | 'wellness';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;
  estimatedBenefit: string;
  implementationSteps: string[];
  basedOn: AIRecommendationSource[];
  expiresAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  type: 'sleep_pattern' | 'wake_time' | 'mood_prediction' | 'task_scheduling' | 'difficulty_adjustment';
  appliedAt?: Date;
  impact: 'low' | 'medium' | 'high';
  action: string;
}

export interface AIRecommendationSource {
  type: 'sleep_data' | 'behavior_pattern' | 'performance_metrics' | 'user_preferences' | 'community_trends';
  dataPoints: number;
  timeRange: string;
  relevance: number; // 0-1
}

export interface PersonalizedChallenge {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'habit_building' | 'skill_improvement' | 'wellness' | 'productivity' | 'social';
  difficulty: ChallengeDifficulty;
  duration: number; // days
  personalizedFactors: PersonalizationFactor[];
  tasks: ChallengeTask[];
  progress: ChallengeProgress;
  rewards: ChallengeReward[];
  aiInsights: string[];
  adaptations: ChallengeAdaptation[];
  status: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  expectedSuccessRate: number; // 0-1
  personalizedFor: string[];
}

export interface PersonalizationFactor {
  type: 'user_niche' | 'sleep_pattern' | 'skill_level' | 'availability' | 'motivation_style';
  value: string | number;
  weight: number; // influence on challenge design
}

export interface ChallengeTask {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'milestone' | 'optional';
  difficulty: number; // 1-10
  estimatedTime: number; // minutes
  dependencies: string[]; // task IDs
  completed: boolean;
  completedAt?: Date;
  evidence?: TaskEvidence[];
}

export interface TaskEvidence {
  type: 'photo' | 'text' | 'location' | 'time_tracking' | 'peer_verification';
  data: any;
  verifiedAt: Date;
  verificationSource: 'user' | 'ai' | 'peer' | 'sensor';
}

export interface ChallengeProgress {
  totalTasks: number;
  completedTasks: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // 0-1
  consistency: number; // 0-1
  engagement: number; // 0-1
  lastActivity: Date;
}

export interface ChallengeAdaptation {
  id: string;
  reason: 'difficulty_adjustment' | 'time_constraint' | 'motivation_boost' | 'personalization_update';
  originalValue: any;
  newValue: any;
  appliedAt: Date;
  impact: string;
}

export interface SmartAutomation {
  id: string;
  userId: string;
  name: string;
  type: 'alarm_optimization' | 'routine_adjustment' | 'challenge_creation' | 'reminder_timing';
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
  conditions: AutomationCondition[];
  isActive: boolean;
  learningEnabled: boolean;
  performanceMetrics: AutomationMetrics;
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
  isEnabled: boolean;
  description: string;
  executionCount: number;
  lastExecuted?: Date;
}

export interface AutomationTrigger {
  type: 'time' | 'location' | 'behavior' | 'performance' | 'external_api';
  parameters: Record<string, any>;
  sensitivity: number; // 0-1
}

export interface AutomationAction {
  type: 'adjust_alarm' | 'send_notification' | 'create_challenge' | 'update_settings' | 'log_data';
  parameters: Record<string, any>;
  priority: number;
  reversible: boolean;
  delay?: number;
}

export interface AutomationCondition {
  type: 'time_range' | 'user_state' | 'weather' | 'calendar' | 'performance_threshold';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
  required: boolean;
}

export interface AutomationMetrics {
  totalTriggers: number;
  successfulActions: number;
  userOverrides: number;
  averageResponseTime: number;
  satisfactionScore: number; // 1-10
  lastEvaluated: Date;
}

export interface SleepPattern {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  bedTime: string; // HH:MM
  sleepTime?: string; // HH:MM (actual sleep start)
  wakeTime: string; // HH:MM
  totalSleepHours: number;
  sleepQuality: number; // 1-10
  sleepStages?: SleepStage[];
  interruptions: SleepInterruption[];
  factors: SleepFactor[];
  mood: WakeUpMood;
  energyLevel: number; // 1-10
  notes?: string;
  source: 'manual' | 'fitness_tracker' | 'phone_sensors' | 'smart_alarm';
  aiAnalysis?: SleepAnalysis;
  createdAt: Date;
  sleepDuration: number; // minutes
  sleepEfficiency: number; // 0-1
  deepSleepPercentage: number; // 0-100
  remSleepPercentage: number; // 0-100
}

export interface SleepStage {
  type: 'light' | 'deep' | 'rem' | 'awake';
  startTime: string;
  duration: number; // minutes
  quality: number; // 0-1
}

export interface SleepInterruption {
  time: string;
  type: 'noise' | 'light' | 'movement' | 'bathroom' | 'stress' | 'unknown';
  duration: number; // minutes
  impact: 'low' | 'medium' | 'high';
}

export interface SleepFactor {
  type: 'caffeine' | 'alcohol' | 'exercise' | 'stress' | 'screen_time' | 'meal_timing' | 'room_temperature';
  value: string | number;
  timing: string; // when the factor occurred
  impact: 'positive' | 'negative' | 'neutral';
}

export interface SleepAnalysis {
  pattern: 'consistent' | 'irregular' | 'improving' | 'declining';
  recommendations: string[];
  riskFactors: string[];
  optimalBedtime: string;
  optimalWakeTime: string;
  confidenceLevel: number; // 0-1
  trendsDetected: SleepTrend[];
}

export interface SleepTrend {
  metric: 'sleep_duration' | 'bedtime_consistency' | 'wake_time_consistency' | 'sleep_quality';
  direction: 'improving' | 'declining' | 'stable';
  magnitude: number; // how significant the trend is
  timeframe: string; // e.g., "last 2 weeks"
}

export interface WakeUpBehavior {
  id: string;
  userId: string;
  alarmId: string;
  date: string;
  scheduledWakeTime: string;
  actualWakeTime: string;
  dismissMethod: 'voice' | 'button' | 'shake' | 'photo' | 'math' | 'barcode';
  snoozeCount: number;
  snoozeDuration: number; // total minutes snoozed
  difficulty: AlarmDifficulty;
  completionTime: number; // seconds to dismiss alarm
  mood: WakeUpMood;
  energyLevel: number; // 1-10
  readiness: number; // 1-10 how ready they felt
  challenges: WakeUpChallenge[];
  context: WakeUpContext;
  performance: WakeUpPerformance;
  createdAt: Date;
  alarmTime: string; // HH:MM
  environment: 'home' | 'travel' | 'other';
}

export interface WakeUpChallenge {
  type: 'math' | 'photo' | 'voice' | 'memory' | 'physical' | 'location';
  difficulty: number; // 1-10
  attempts: number;
  successful: boolean;
  timeToComplete: number; // seconds
  details?: Record<string, any>;
}

export interface WakeUpContext {
  weather: string;
  temperature: number;
  dayOfWeek: string;
  sleepHours: number;
  stressLevel?: number; // 1-10
  calendarEvents?: number; // events scheduled for the day
  location?: 'home' | 'travel' | 'other';
}

export interface WakeUpPerformance {
  responseTime: number; // seconds from alarm to first interaction
  accuracy: number; // for challenges requiring correctness
  persistence: number; // how long they kept trying vs giving up
  consistency: number; // compared to their usual performance
}

export type WakeUpMood =
  | 'excellent'
  | 'good'
  | 'okay'
  | 'tired'
  | 'groggy'
  | 'irritated'
  | 'refreshed'
  | 'energetic'
  | 'anxious'
  | 'peaceful'
  | 'neutral'
  | 'grumpy';

export interface BattlePerformanceData {
  battleId: string;
  userId: string;
  performance: BattlePerformanceMetrics;
  comparison: BattleComparison;
  improvement: BattleImprovement;
  streaks: BattleStreaks;
  achievements: string[]; // achievement IDs unlocked
  analysis: BattleAnalysis;
  createdAt: Date;
  date: string; // YYYY-MM-DD
  result: 'win' | 'loss' | 'draw';
  score: number;
  battleType: 'solo' | 'multiplayer' | 'tournament';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  mistakes: number;
  mood: WakeUpMood;
}

export interface BattlePerformanceMetrics {
  wakeTimeScore: number; // 0-100
  consistencyScore: number; // 0-100
  challengeScore: number; // 0-100
  socialScore: number; // 0-100
  overallScore: number; // 0-100
  rank: number;
  percentile: number; // 0-100
}

export interface BattleComparison {
  vsPersonalBest: number; // percentage difference
  vsFriends: number; // average rank among friends
  vsGlobal: number; // global percentile
  improvements: string[]; // areas that improved
  weaknesses: string[]; // areas that declined
}

export interface BattleImprovement {
  shortTerm: ImprovementMetric; // last 7 days
  mediumTerm: ImprovementMetric; // last 30 days
  longTerm: ImprovementMetric; // last 90 days
  suggestions: ImprovementSuggestion[];
}

export interface ImprovementMetric {
  scoreChange: number;
  rankChange: number;
  streakChange: number;
  consistencyChange: number;
}

export interface ImprovementSuggestion {
  area: 'wake_time' | 'consistency' | 'challenges' | 'social';
  suggestion: string;
  expectedImpact: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  timeToSeeResults: string; // e.g., "1-2 weeks"
}

export interface BattleStreaks {
  current: StreakData;
  longest: StreakData;
  recent: StreakData[]; // last 10 streaks
}

export interface StreakData {
  length: number;
  type: 'win' | 'participation' | 'consistency' | 'improvement';
  startDate: string;
  endDate?: string;
  averageScore: number;
}

export interface BattleAnalysis {
  strengths: string[];
  weaknesses: string[];
  patterns: BattlePattern[];
  recommendations: string[];
  riskFactors: string[];
  motivationProfile: MotivationProfile;
}

export interface BattlePattern {
  type: 'day_of_week' | 'time_of_day' | 'battle_type' | 'opponent_type';
  pattern: string;
  strength: number; // 0-1 how strong the pattern is
  impact: 'positive' | 'negative' | 'neutral';
}

export interface MotivationProfile {
  primaryDriver: 'competition' | 'achievement' | 'social' | 'personal_growth';
  competitiveness: number; // 1-10
  socialInfluence: number; // 1-10
  intrinsicMotivation: number; // 1-10
  extrinsicMotivation: number; // 1-10
  riskTolerance: number; // 1-10
}

export interface LearningData {
  id: string;
  userId: string;
  subject: 'user_behavior' | 'performance_patterns' | 'preferences' | 'optimal_settings';
  dataPoints: LearningDataPoint[];
  insights: LearningInsight[];
  confidence: number; // 0-1
  lastUpdated: Date;
  isActive: boolean; // whether this learning is being applied
  validationResults?: ValidationResult[];
}

export interface LearningDataPoint {
  timestamp: Date;
  context: Record<string, any>;
  outcome: Record<string, any>;
  success: boolean;
  weight: number; // importance of this data point
}

export interface LearningInsight {
  type: 'correlation' | 'trend' | 'anomaly' | 'optimal_value' | 'trigger_condition';
  description: string;
  confidence: number; // 0-1
  strength: number; // 0-1 how strong the pattern is
  actionable: boolean;
  recommendedAction?: string;
}

export interface ValidationResult {
  date: Date;
  hypothesis: string;
  predicted: any;
  actual: any;
  accuracy: number; // 0-1
  method: 'a_b_test' | 'holdout' | 'cross_validation' | 'user_feedback';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// CLOUDFLARE WORKERS TYPES - Edge Computing & Storage
// ============================================================================

// Cloudflare D1 Database Types
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = any>(): Promise<D1Result<T>>;
  raw<T = any>(): Promise<T[]>;
}

export interface D1Result<T = Record<string, any>> {
  results?: T[];
  success: boolean;
  meta: {
    duration: number;
    size_after?: number;
    rows_read?: number;
    rows_written?: number;
    last_row_id?: number;
    changed_db?: boolean;
    changes?: number;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

// Cloudflare KV Namespace Types
export interface KVNamespace {
  get(key: string, options?: KVGetOptions): Promise<string | null>;
  get(key: string, type: 'text'): Promise<string | null>;
  get(key: string, type: 'json'): Promise<any>;
  get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>;
  get(key: string, type: 'stream'): Promise<ReadableStream | null>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVPutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVListOptions): Promise<KVListResult>;
  getWithMetadata<Metadata = any>(key: string, options?: KVGetWithMetadataOptions): Promise<KVGetWithMetadataResult<string, Metadata>>;
  getWithMetadata<Metadata = any>(key: string, type: 'text'): Promise<KVGetWithMetadataResult<string, Metadata>>;
  getWithMetadata<Metadata = any>(key: string, type: 'json'): Promise<KVGetWithMetadataResult<any, Metadata>>;
  getWithMetadata<Metadata = any>(key: string, type: 'arrayBuffer'): Promise<KVGetWithMetadataResult<ArrayBuffer, Metadata>>;
  getWithMetadata<Metadata = any>(key: string, type: 'stream'): Promise<KVGetWithMetadataResult<ReadableStream, Metadata>>;
}

export interface KVGetOptions {
  cacheTtl?: number;
}

export interface KVGetWithMetadataOptions {
  cacheTtl?: number;
}

export interface KVPutOptions {
  expiration?: number;
  expirationTtl?: number;
  metadata?: any;
}

export interface KVListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface KVListResult {
  keys: KVKey[];
  list_complete: boolean;
  cursor?: string;
}

export interface KVKey {
  name: string;
  expiration?: number;
  metadata?: any;
}

export interface KVGetWithMetadataResult<Value, Metadata> {
  value: Value | null;
  metadata: Metadata | null;
}

// Cloudflare R2 Bucket Types
export interface R2Bucket {
  head(key: string): Promise<R2Object | null>;
  get(key: string, options?: R2GetOptions): Promise<R2ObjectBody | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>;
  delete(key: string | string[]): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
  createMultipartUpload(key: string, options?: R2CreateMultipartUploadOptions): Promise<R2MultipartUpload>;
}

export interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  range?: R2Range;
  checksums?: R2Checksums;
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T = any>(): Promise<T>;
  blob(): Promise<Blob>;
}

export interface R2GetOptions {
  onlyIf?: R2Conditional;
  range?: R2Range;
}

export interface R2PutOptions {
  onlyIf?: R2Conditional;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  md5?: ArrayBuffer | string;
  sha1?: ArrayBuffer | string;
  sha256?: ArrayBuffer | string;
  sha384?: ArrayBuffer | string;
  sha512?: ArrayBuffer | string;
}

export interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
  delimiter?: string;
  startAfter?: string;
  include?: ('httpMetadata' | 'customMetadata')[];
}

export interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

export interface R2HTTPMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  cacheExpiry?: Date;
}

export interface R2Range {
  offset?: number;
  length?: number;
  suffix?: number;
}

export interface R2Conditional {
  etagMatches?: string;
  etagDoesNotMatch?: string;
  uploadedBefore?: Date;
  uploadedAfter?: Date;
}

export interface R2Checksums {
  md5?: ArrayBuffer;
  sha1?: ArrayBuffer;
  sha256?: ArrayBuffer;
  sha384?: ArrayBuffer;
  sha512?: ArrayBuffer;
}

export interface R2MultipartUpload {
  key: string;
  uploadId: string;
  abort(): Promise<void>;
  complete(uploadedParts: R2UploadedPart[]): Promise<R2Object>;
  uploadPart(partNumber: number, value: ReadableStream | ArrayBuffer | string): Promise<R2UploadedPart>;
}

export interface R2UploadedPart {
  partNumber: number;
  etag: string;
}

export interface R2CreateMultipartUploadOptions {
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
}

// Media Library and Content Types
export interface MediaLibrary {
  id: string;
  userId: string;
  sounds: CustomSound[];
  playlists: Playlist[];
  quotes: MotivationalQuote[];
  storage: StorageInfo;
  cacheSettings: CacheSettings;
  compressionSettings: CompressionSettings;
}

export interface ContentPreferences {
  audioQuality: 'low' | 'medium' | 'high';
  autoDownload: boolean;
  storageLimit: number; // in MB
  cacheEnabled: boolean;
  offlineMode: boolean;
}

export interface StorageInfo {
  used: number; // in MB
  available: number; // in MB
  total: number; // in MB
}

export interface CacheSettings {
  enabled: boolean;
  maxSize: number; // in MB
  ttl: number; // in seconds
}

export interface CompressionSettings {
  enabled: boolean;
  quality: number; // 0-100
  format: 'mp3' | 'aac' | 'ogg';
}

export interface ContextualTask {
  id: string;
  title: string;
  description: string;
  category: 'productivity' | 'health' | 'social' | 'learning';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // in minutes
  context: TaskContext;
  rewards: TaskReward[];
  completed: boolean;
}

export interface TaskContext {
  location?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  weatherCondition?: string;
  userMood?: string;
  availableTime?: number; // in minutes
}

export interface TaskReward {
  type: 'experience' | 'achievement' | 'item';
  value: number | string;
  description: string;
}

// Premium Subscription Types (using consolidated definitions above)

export interface Subscription {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Payment provider specific fields
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
}

export interface PremiumFeatureAccess {
  // Voice Features
  elevenlabsVoices: boolean;
  customVoiceMessages: boolean;
  voiceCloning: boolean;
  premiumPersonalities: boolean; // Access to demon-lord, ai-robot, comedian, philosopher

  // AI Features
  advancedAIInsights: boolean;
  personalizedChallenges: boolean;
  smartRecommendations: boolean;
  behaviorAnalysis: boolean;

  // Customization
  premiumThemes: boolean;
  customSounds: boolean;
  advancedPersonalization: boolean;
  unlimitedCustomization: boolean;

  // Scheduling
  advancedScheduling: boolean;
  smartScheduling: boolean;
  locationBasedAlarms: boolean;
  weatherIntegration: boolean;

  // Battle System
  exclusiveBattleModes: boolean;
  customBattleRules: boolean;
  advancedStats: boolean;
  leaderboardFeatures: boolean;
  nuclearMode: boolean; // Ultra-extreme battle mode for Pro+ users

  // Content
  premiumSoundLibrary: boolean;
  exclusiveContent: boolean;
  adFree: boolean;
  prioritySupport: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  interval: 'month' | 'year' | 'lifetime';
  features: string[];
  featureAccess: PremiumFeatureAccess;
  popular?: boolean;
  description?: string;
  stripePriceId?: string;
  savings?: number;
  trialDays?: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'google_pay' | 'apple_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  stripePaymentMethodId?: string;
}

export interface PremiumUsage {
  userId: string;
  month: string; // YYYY-MM format
  elevenlabsApiCalls: number;
  aiInsightsGenerated: number;
  customVoiceMessages: number;
  premiumThemesUsed: string[];
  lastUpdated: Date;
}

// Premium Feature Limits
export interface FeatureLimits {
  elevenlabsCallsPerMonth: number;
  aiInsightsPerDay: number;
  customVoiceMessagesPerDay: number;
  customSoundsStorage: number; // in MB
  themesAllowed: number;
  battlesPerDay: number;
}

// Default feature limits by tier
export const DEFAULT_FEATURE_LIMITS: Record<SubscriptionTier, FeatureLimits> = {
  free: {
    elevenlabsCallsPerMonth: 0,
    aiInsightsPerDay: 3,
    customVoiceMessagesPerDay: 0,
    customSoundsStorage: 0,
    themesAllowed: 3,
    battlesPerDay: 5
  },
  premium: {
    elevenlabsCallsPerMonth: 100,
    aiInsightsPerDay: 10,
    customVoiceMessagesPerDay: 5,
    customSoundsStorage: 50,
    themesAllowed: 10,
    battlesPerDay: 20
  },
  pro: {
    elevenlabsCallsPerMonth: 500,
    aiInsightsPerDay: 25,
    customVoiceMessagesPerDay: 20,
    customSoundsStorage: 200,
    themesAllowed: -1, // unlimited
    battlesPerDay: -1 // unlimited
  },
  ultimate: {
    elevenlabsCallsPerMonth: 1000,
    aiInsightsPerDay: -1, // unlimited
    customVoiceMessagesPerDay: -1, // unlimited
    customSoundsStorage: 500,
    themesAllowed: -1, // unlimited
    battlesPerDay: -1 // unlimited
  },
  lifetime: {
    elevenlabsCallsPerMonth: 1000,
    aiInsightsPerDay: -1, // unlimited
    customVoiceMessagesPerDay: -1, // unlimited
    customSoundsStorage: 500,
    themesAllowed: -1, // unlimited
    battlesPerDay: -1 // unlimited
  }
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tier: 'free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      '3 AI insights per day',
      'Basic themes',
      '5 battles per day',
      'Standard voice options',
      'Basic customization'
    ],
    featureAccess: {
      elevenlabsVoices: false,
      customVoiceMessages: false,
      voiceCloning: false,
      premiumPersonalities: false,
      advancedAIInsights: false,
      personalizedChallenges: false,
      smartRecommendations: false,
      behaviorAnalysis: false,
      premiumThemes: false,
      customSounds: false,
      advancedPersonalization: false,
      unlimitedCustomization: false,
      advancedScheduling: false,
      smartScheduling: false,
      locationBasedAlarms: false,
      weatherIntegration: false,
      exclusiveBattleModes: false,
      customBattleRules: false,
      advancedStats: false,
      leaderboardFeatures: false,
      nuclearMode: false,
      premiumSoundLibrary: false,
      exclusiveContent: false,
      adFree: false,
      prioritySupport: false
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    tier: 'premium',
    price: 4.99,
    currency: 'USD',
    interval: 'month',
    popular: true,
    features: [
      '100 ElevenLabs voice calls/month',
      '10 AI insights per day',
      '5 custom voice messages/day',
      'Premium themes',
      '20 battles per day',
      'Premium sound library',
      'Advanced customization',
      'Ad-free experience'
    ],
    featureAccess: {
      elevenlabsVoices: true,
      customVoiceMessages: true,
      voiceCloning: false,
      premiumPersonalities: false,
      advancedAIInsights: true,
      personalizedChallenges: true,
      smartRecommendations: true,
      behaviorAnalysis: true,
      premiumThemes: true,
      customSounds: true,
      advancedPersonalization: true,
      unlimitedCustomization: false,
      advancedScheduling: true,
      smartScheduling: false,
      locationBasedAlarms: true,
      weatherIntegration: true,
      exclusiveBattleModes: true,
      customBattleRules: false,
      advancedStats: true,
      leaderboardFeatures: true,
      nuclearMode: false, // Premium tier doesn't get nuclear mode
      premiumSoundLibrary: true,
      exclusiveContent: true,
      adFree: true,
      prioritySupport: false
    },
    stripePriceId: 'price_premium_monthly'
  },
  {
    id: 'pro',
    name: 'Pro',
    tier: 'pro',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: [
      '500 ElevenLabs voice calls/month',
      '25 AI insights per day',
      '20 custom voice messages/day',
      'Voice cloning',
      'Unlimited battles',
      'Nuclear Mode battle difficulty',
      'Custom battle rules',
      'Smart scheduling',
      'Unlimited customization',
      'Priority support'
    ],
    featureAccess: {
      elevenlabsVoices: true,
      customVoiceMessages: true,
      voiceCloning: true,
      advancedAIInsights: true,
      personalizedChallenges: true,
      smartRecommendations: true,
      behaviorAnalysis: true,
      premiumThemes: true,
      customSounds: true,
      advancedPersonalization: true,
      unlimitedCustomization: true,
      advancedScheduling: true,
      smartScheduling: true,
      locationBasedAlarms: true,
      weatherIntegration: true,
      exclusiveBattleModes: true,
      customBattleRules: true,
      advancedStats: true,
      leaderboardFeatures: true,
      nuclearMode: true, // Pro and Lifetime tiers get nuclear mode access
      premiumSoundLibrary: true,
      exclusiveContent: true,
      adFree: true,
      prioritySupport: true
    },
    stripePriceId: 'price_pro_monthly'
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    tier: 'lifetime',
    price: 99.99,
    currency: 'USD',
    interval: 'lifetime',
    features: [
      '1000 ElevenLabs voice calls/month',
      'Unlimited AI insights',
      'Unlimited custom voice messages',
      'All premium features',
      'Lifetime updates',
      'Priority support'
    ],
    featureAccess: {
      elevenlabsVoices: true,
      customVoiceMessages: true,
      voiceCloning: true,
      advancedAIInsights: true,
      personalizedChallenges: true,
      smartRecommendations: true,
      behaviorAnalysis: true,
      premiumThemes: true,
      customSounds: true,
      advancedPersonalization: true,
      unlimitedCustomization: true,
      advancedScheduling: true,
      smartScheduling: true,
      locationBasedAlarms: true,
      weatherIntegration: true,
      exclusiveBattleModes: true,
      customBattleRules: true,
      advancedStats: true,
      leaderboardFeatures: true,
      nuclearMode: true, // Pro and Lifetime tiers get nuclear mode access
      premiumSoundLibrary: true,
      exclusiveContent: true,
      adFree: true,
      prioritySupport: true
    },
    stripePriceId: 'price_lifetime'
  }
];