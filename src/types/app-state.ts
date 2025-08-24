/**
 * Domain-Specific State Interfaces
 * Central state management interfaces for the Relife alarm application
 */

import type {
  Alarm,
  User,
  Subscription,
  SubscriptionTier,
  SubscriptionStatus,
  FeatureAccess,
  FeatureUsage,
  BillingUsage,
  Trial,
  Discount,
  UserDiscount,
  Invoice,
  PaymentMethod,
  Payment,
  SubscriptionPlan,
  VoiceMood,
  AlarmEvent,
  AlarmInstance,
} from '../types';

import type {
  SchedulingConfig,
  ConditionalRule,
  LocationTrigger,
  SmartOptimization,
  SeasonalAdjustment,
  CalendarIntegration,
} from './alarm-scheduling';

// =============================================================================
// ALARM STATE INTERFACE
// =============================================================================

export interface AlarmState {
  // Core alarm data
  alarms: Alarm[];
  activeAlarms: Alarm[];
  upcomingAlarms: AlarmInstance[];
  
  // Alarm management
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  saveError: string | null;
  lastUpdated: Date | null;
  
  // Current alarm execution
  currentlyTriggering: string[]; // alarm IDs
  snoozing: Record<string, { snoozeCount: number; snoozeUntil: Date }>;
  dismissing: string[]; // alarm IDs being dismissed
  
  // Alarm creation/editing state
  editing: {
    alarmId: string | null;
    isCreating: boolean;
    isDirty: boolean;
    draftAlarm: Partial<Alarm> | null;
    validationErrors: Record<string, string>;
  };
  
  // Advanced scheduling
  schedulingConfigs: Record<string, SchedulingConfig>; // keyed by alarmId
  enabledOptimizations: SmartOptimization[];
  locationTriggers: LocationTrigger[];
  conditionalRules: ConditionalRule[];
  
  // Voice and audio
  voiceSettings: {
    defaultMood: VoiceMood;
    customMoods: VoiceMood[];
    voiceEnabled: boolean;
    volume: number;
    speaking: boolean;
  };
  
  // Battle mode integration
  battleState: {
    activeBattles: Record<string, string>; // alarmId -> battleId mapping
    battleResults: Record<string, BattleResult>;
    battleStats: BattleStats | null;
  };
  
  // Performance and analytics
  performance: {
    successRate: number; // percentage of successful wake-ups
    averageDismissalTime: number; // seconds
    snoozeFrequency: number; // average snoozes per alarm
    weeklyPatterns: WeeklyAlarmPattern[];
    sleepQualityCorrelation: number;
  };
  
  // Settings and preferences
  settings: {
    defaultSound: string;
    defaultVolume: number;
    defaultSnoozeInterval: number;
    maxSnoozes: number;
    alarmToneTest: boolean;
    vibrationEnabled: boolean;
    locationServicesEnabled: boolean;
    weatherIntegrationEnabled: boolean;
    calendarIntegrationEnabled: boolean;
  };
  
  // UI state
  ui: {
    selectedAlarmId: string | null;
    showTestAlarm: boolean;
    showBattleSetup: boolean;
    showSchedulingConfig: boolean;
    expandedSections: Set<string>;
    sortBy: 'time' | 'name' | 'created' | 'nextTrigger';
    filterBy: 'all' | 'active' | 'inactive' | 'upcoming' | 'missed';
  };
}

// Helper interfaces for AlarmState
interface BattleResult {
  alarmId: string;
  battleId: string;
  difficulty: number;
  completed: boolean;
  timeToComplete: number; // seconds
  attempts: number;
  timestamp: Date;
}

interface BattleStats {
  totalBattles: number;
  completedBattles: number;
  successRate: number;
  averageCompletionTime: number;
  difficultyPreference: number;
}

interface WeeklyAlarmPattern {
  dayOfWeek: number; // 0-6
  averageWakeTime: string; // HH:MM
  successRate: number;
  snoozeRate: number;
}

// =============================================================================
// USER STATE INTERFACE
// =============================================================================

export interface UserState {
  // Core user data
  currentUser: User | null;
  profile: UserProfile | null;
  
  // Authentication state
  auth: {
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;
    refreshToken: string | null;
    expiresAt: Date | null;
    loginMethod: 'email' | 'google' | 'apple' | 'anonymous' | null;
  };
  
  // User preferences
  preferences: {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    theme: 'light' | 'dark' | 'auto' | 'custom';
    customTheme: string | null;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    notificationsEnabled: boolean;
    locationSharingEnabled: boolean;
    analyticsEnabled: boolean;
    marketingEmailsEnabled: boolean;
  };
  
  // Privacy and security
  privacy: {
    dataProcessingConsent: boolean;
    marketingConsent: boolean;
    analyticsConsent: boolean;
    consentDate: Date | null;
    twoFactorEnabled: boolean;
    biometricLoginEnabled: boolean;
    sessionTimeout: number; // minutes
  };
  
  // User activity and streaks
  activity: {
    currentStreak: number; // days
    longestStreak: number; // days
    totalAlarmsSet: number;
    totalAlarmsTriggered: number;
    totalAlarmsDismissed: number;
    totalSnoozesUsed: number;
    averageWakeTime: string; // HH:MM
    sleepScore: number; // 0-100
    lastActive: Date | null;
    joinDate: Date | null;
  };
  
  // Achievements and gamification
  achievements: {
    unlockedAchievements: Achievement[];
    availableAchievements: Achievement[];
    totalPoints: number;
    currentLevel: number;
    progressToNextLevel: number;
    badges: Badge[];
  };
  
  // Social features
  social: {
    friends: UserFriend[];
    challenges: SocialChallenge[];
    leaderboardRank: number | null;
    sharePermissions: SharePermissions;
    communityParticipation: boolean;
  };
  
  // Error states
  errors: {
    profileLoadError: string | null;
    updateError: string | null;
    authError: string | null;
    permissionError: string | null;
  };
  
  // Loading states
  loading: {
    profile: boolean;
    preferences: boolean;
    activity: boolean;
    achievements: boolean;
    friends: boolean;
  };
}

// Helper interfaces for UserState
interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  phoneNumber: string | null;
  dateOfBirth: Date | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  occupation: string | null;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  unlockedAt?: Date;
  progress?: number; // 0-100
  requirements: AchievementRequirement[];
}

interface AchievementRequirement {
  type: string;
  value: number;
  current: number;
  completed: boolean;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date;
}

interface UserFriend {
  id: string;
  displayName: string;
  avatar: string | null;
  status: 'pending' | 'accepted' | 'blocked';
  addedAt: Date;
  lastSeen: Date | null;
}

interface SocialChallenge {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'group' | 'global';
  startDate: Date;
  endDate: Date;
  participants: number;
  progress: number; // 0-100
  completed: boolean;
  reward: string;
}

interface SharePermissions {
  shareProfile: boolean;
  shareActivity: boolean;
  shareAchievements: boolean;
  shareStreaks: boolean;
  allowFriendRequests: boolean;
  allowChallengeInvites: boolean;
}

// =============================================================================
// SUBSCRIPTION STATE INTERFACE
// =============================================================================

export interface SubscriptionState {
  // Core subscription data
  currentSubscription: Subscription | null;
  subscriptionPlan: SubscriptionPlan | null;
  availablePlans: SubscriptionPlan[];
  
  // Feature access
  featureAccess: FeatureAccess | null;
  featureUsage: Record<string, FeatureUsage>; // keyed by feature ID
  billingUsage: BillingUsage | null;
  
  // Subscription status
  status: {
    isActive: boolean;
    isPremium: boolean;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    expiresAt: Date | null;
    renewsAt: Date | null;
    cancelAtPeriodEnd: boolean;
    gracePeriodEndsAt: Date | null;
  };
  
  // Trial information
  trial: {
    isInTrial: boolean;
    trialPlan: string | null;
    trialStarted: Date | null;
    trialEndsAt: Date | null;
    trialDaysRemaining: number;
    hasUsedTrial: boolean;
    eligibleForExtension: boolean;
  };
  
  // Billing and payments
  billing: {
    paymentMethods: PaymentMethod[];
    defaultPaymentMethod: PaymentMethod | null;
    upcomingInvoice: Invoice | null;
    invoiceHistory: Invoice[];
    paymentHistory: Payment[];
    nextBillingDate: Date | null;
    billingInterval: 'monthly' | 'yearly' | 'lifetime';
    currency: string;
    taxRate: number;
  };
  
  // Discounts and promotions
  promotions: {
    activeDiscounts: UserDiscount[];
    availableDiscounts: Discount[];
    referralCode: string | null;
    referralStats: {
      referralsCount: number;
      successfulReferrals: number;
      totalEarnings: number; // in cents
      pendingEarnings: number; // in cents
    };
  };
  
  // Upgrade/downgrade management
  changes: {
    pendingChange: SubscriptionChange | null;
    changeHistory: SubscriptionChange[];
    upgradePrompts: UpgradePrompt[];
    lastUpgradePrompt: Date | null;
    upgradePromptFrequency: number; // days
  };
  
  // Feature limitations and usage warnings
  limits: {
    reachedLimits: Set<string>; // feature IDs
    approachingLimits: Set<string>; // feature IDs
    overageFees: OverageFee[];
    warningsShown: Set<string>; // feature IDs with warnings shown
  };
  
  // UI state for subscription management
  ui: {
    showUpgradeModal: boolean;
    showCancelModal: boolean;
    showPaymentModal: boolean;
    selectedUpgradePlan: SubscriptionPlan | null;
    paymentProcessing: boolean;
    lastPaymentError: string | null;
    showUsageDetails: boolean;
  };
  
  // Loading and error states
  loading: {
    subscription: boolean;
    plans: boolean;
    paymentMethods: boolean;
    invoices: boolean;
    featureAccess: boolean;
  };
  
  errors: {
    subscriptionError: string | null;
    paymentError: string | null;
    billingError: string | null;
    featureAccessError: string | null;
  };
}

// Helper interfaces for SubscriptionState
interface SubscriptionChange {
  id: string;
  type: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate';
  fromPlan: SubscriptionPlan;
  toPlan: SubscriptionPlan;
  effectiveDate: Date;
  prorationAmount: number; // in cents
  reason: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface UpgradePrompt {
  id: string;
  feature: string;
  title: string;
  message: string;
  targetPlan: SubscriptionPlan;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  triggers: string[]; // what triggered this prompt
  shownAt: Date;
  dismissedAt: Date | null;
  actedOn: boolean;
}

interface OverageFee {
  feature: string;
  unitsOver: number;
  pricePerUnit: number; // in cents
  totalFee: number; // in cents
  billingPeriod: string;
}

// =============================================================================
// ROOT APPLICATION STATE
// =============================================================================

export interface AppState {
  alarm: AlarmState;
  user: UserState;
  subscription: SubscriptionState;
  
  // Global app state
  app: {
    initialized: boolean;
    isOnline: boolean;
    lastSync: Date | null;
    syncInProgress: boolean;
    version: string;
    environment: 'development' | 'staging' | 'production';
    maintenanceMode: boolean;
    criticalError: string | null;
  };
  
  // Navigation and routing
  navigation: {
    currentView: 'dashboard' | 'alarms' | 'settings' | 'profile' | 'subscription';
    previousView: string | null;
    navigationHistory: string[];
    modalStack: string[];
  };
  
  // Performance monitoring
  performance: {
    startupTime: number;
    memoryUsage: number;
    batteryOptimized: boolean;
    reducedAnimations: boolean;
  };
}

// =============================================================================
// STATE ACTION TYPES
// =============================================================================

// Alarm actions
export type AlarmAction =
  | { type: 'ALARMS_LOAD_START' }
  | { type: 'ALARMS_LOAD_SUCCESS'; payload: Alarm[] }
  | { type: 'ALARMS_LOAD_ERROR'; payload: string }
  | { type: 'ALARM_CREATE_START' }
  | { type: 'ALARM_CREATE_SUCCESS'; payload: Alarm }
  | { type: 'ALARM_CREATE_ERROR'; payload: string }
  | { type: 'ALARM_UPDATE_START'; payload: string }
  | { type: 'ALARM_UPDATE_SUCCESS'; payload: Alarm }
  | { type: 'ALARM_UPDATE_ERROR'; payload: { id: string; error: string } }
  | { type: 'ALARM_DELETE'; payload: string }
  | { type: 'ALARM_TOGGLE'; payload: { id: string; enabled: boolean } }
  | { type: 'ALARM_TRIGGER'; payload: string }
  | { type: 'ALARM_SNOOZE'; payload: { id: string; snoozeUntil: Date } }
  | { type: 'ALARM_DISMISS'; payload: string }
  | { type: 'SET_EDITING_ALARM'; payload: { alarmId: string | null; isCreating: boolean } }
  | { type: 'UPDATE_DRAFT_ALARM'; payload: Partial<Alarm> }
  | { type: 'SET_ALARM_VALIDATION_ERRORS'; payload: Record<string, string> }
  | { type: 'UPDATE_SCHEDULING_CONFIG'; payload: { alarmId: string; config: SchedulingConfig } };

// User actions
export type UserAction =
  | { type: 'USER_LOGIN_START' }
  | { type: 'USER_LOGIN_SUCCESS'; payload: { user: User; token: string; refreshToken: string } }
  | { type: 'USER_LOGIN_ERROR'; payload: string }
  | { type: 'USER_LOGOUT' }
  | { type: 'USER_PROFILE_LOAD_START' }
  | { type: 'USER_PROFILE_LOAD_SUCCESS'; payload: UserProfile }
  | { type: 'USER_PROFILE_LOAD_ERROR'; payload: string }
  | { type: 'USER_PREFERENCES_UPDATE'; payload: Partial<UserState['preferences']> }
  | { type: 'USER_ACHIEVEMENT_UNLOCK'; payload: Achievement }
  | { type: 'USER_STREAK_UPDATE'; payload: { current: number; longest: number } }
  | { type: 'USER_FRIEND_REQUEST'; payload: UserFriend }
  | { type: 'USER_FRIEND_ACCEPT'; payload: string }
  | { type: 'USER_CHALLENGE_JOIN'; payload: SocialChallenge };

// Subscription actions  
export type SubscriptionAction =
  | { type: 'SUBSCRIPTION_LOAD_START' }
  | { type: 'SUBSCRIPTION_LOAD_SUCCESS'; payload: Subscription }
  | { type: 'SUBSCRIPTION_LOAD_ERROR'; payload: string }
  | { type: 'SUBSCRIPTION_UPGRADE_START' }
  | { type: 'SUBSCRIPTION_UPGRADE_SUCCESS'; payload: Subscription }
  | { type: 'SUBSCRIPTION_UPGRADE_ERROR'; payload: string }
  | { type: 'SUBSCRIPTION_CANCEL_START' }
  | { type: 'SUBSCRIPTION_CANCEL_SUCCESS'; payload: Subscription }
  | { type: 'SUBSCRIPTION_CANCEL_ERROR'; payload: string }
  | { type: 'FEATURE_ACCESS_UPDATE'; payload: FeatureAccess }
  | { type: 'FEATURE_USAGE_UPDATE'; payload: { feature: string; usage: FeatureUsage } }
  | { type: 'PAYMENT_METHOD_ADD'; payload: PaymentMethod }
  | { type: 'PAYMENT_METHOD_REMOVE'; payload: string }
  | { type: 'INVOICE_RECEIVED'; payload: Invoice }
  | { type: 'UPGRADE_PROMPT_SHOW'; payload: UpgradePrompt }
  | { type: 'UPGRADE_PROMPT_DISMISS'; payload: string };

// Combined action type
export type AppAction = AlarmAction | UserAction | SubscriptionAction;

// =============================================================================
// STATE SELECTORS (for easy state access)
// =============================================================================

export const createAppSelectors = (state: AppState) => ({
  // Alarm selectors
  getActiveAlarms: () => state.alarm.alarms.filter(alarm => alarm.enabled),
  getUpcomingAlarms: () => state.alarm.upcomingAlarms.slice(0, 5),
  getAlarmById: (id: string) => state.alarm.alarms.find(alarm => alarm.id === id),
  isAlarmLoading: () => state.alarm.isLoading,
  getCurrentlyTriggeringAlarms: () => state.alarm.currentlyTriggering,
  
  // User selectors
  isAuthenticated: () => state.user.auth.isAuthenticated,
  getCurrentUser: () => state.user.currentUser,
  getUserTier: () => state.subscription.status.tier,
  getCurrentStreak: () => state.user.activity.currentStreak,
  getUserAchievements: () => state.user.achievements.unlockedAchievements,
  
  // Subscription selectors
  isPremiumUser: () => state.subscription.status.isPremium,
  hasFeatureAccess: (featureId: string) => 
    state.subscription.featureAccess?.features[featureId]?.hasAccess ?? false,
  getSubscriptionStatus: () => state.subscription.status,
  getRemainingTrialDays: () => state.subscription.trial.trialDaysRemaining,
  getNextBillingDate: () => state.subscription.billing.nextBillingDate,
});

// =============================================================================
// VALIDATION AND UTILITY FUNCTIONS
// =============================================================================

export const validateAlarmState = (state: AlarmState): boolean => {
  return Array.isArray(state.alarms) && 
         typeof state.isLoading === 'boolean' &&
         state.editing !== null &&
         typeof state.editing === 'object';
};

export const validateUserState = (state: UserState): boolean => {
  return state.auth !== null &&
         typeof state.auth === 'object' &&
         typeof state.auth.isAuthenticated === 'boolean';
};

export const validateSubscriptionState = (state: SubscriptionState): boolean => {
  return state.status !== null &&
         typeof state.status === 'object' &&
         typeof state.status.isActive === 'boolean';
};

// Type guards
export const isAlarmState = (value: any): value is AlarmState => {
  return value && validateAlarmState(value);
};

export const isUserState = (value: any): value is UserState => {
  return value && validateUserState(value);
};

export const isSubscriptionState = (value: any): value is SubscriptionState => {
  return value && validateSubscriptionState(value);
};