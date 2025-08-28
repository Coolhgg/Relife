/**
 * Initial Domain-Specific Application State
 * Provides properly typed initial state that matches the AppState interface
 * from types/app-state.ts
 */

import type {
  AppState,
  AlarmState, 
  UserState,
  SubscriptionState
} from '../types/app-state';

import type {
  VoiceMood
} from '../types/domain';

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULT_VOICE_MOOD: VoiceMood = {
  id: 'default',
  name: 'Gentle',
  tone: 'calm',
  pitch: 0.8,
  speed: 1.0,
  volume: 0.7,
};

// =============================================================================
// INITIAL ALARM STATE
// =============================================================================

const INITIAL_ALARM_STATE: AlarmState = {
  // Core alarm data
  alarms: [],
  activeAlarms: [],
  upcomingAlarms: [],
  
  // Alarm management
  isLoading: false,
  isSaving: false,
  loadError: null,
  saveError: null,
  lastUpdated: null,
  
  // Current alarm execution
  currentlyTriggering: [],
  snoozing: {},
  dismissing: [],
  
  // Alarm creation/editing state
  editing: {
    alarmId: null,
    isCreating: false,
    isDirty: false,
    draftAlarm: null,
    validationErrors: {},
  },
  
  // Advanced scheduling
  schedulingConfigs: {},
  enabledOptimizations: [],
  locationTriggers: [],
  conditionalRules: [],
  
  // Voice and audio
  voiceSettings: {
    defaultMood: DEFAULT_VOICE_MOOD,
    customMoods: [],
    voiceEnabled: true,
    volume: 0.8,
    speaking: false,
  },
  
  // Battle mode integration
  battleState: {
    activeBattles: {},
    battleResults: {},
    battleStats: null,
  },
  
  // Performance and analytics
  performance: {
    successRate: 0,
    averageDismissalTime: 0,
    snoozeFrequency: 0,
    weeklyPatterns: [],
    sleepQualityCorrelation: 0,
  },
  
  // Settings and preferences
  settings: {
    defaultSound: 'default',
    defaultVolume: 0.8,
    defaultSnoozeInterval: 5,
    maxSnoozes: 3,
    alarmToneTest: false,
    vibrationEnabled: true,
    locationServicesEnabled: false,
    weatherIntegrationEnabled: false,
    calendarIntegrationEnabled: false,
  },
  
  // UI state
  ui: {
    selectedAlarmId: null,
    showTestAlarm: false,
    showBattleSetup: false,
    showSchedulingConfig: false,
    expandedSections: new Set(),
    sortBy: 'time',
    filterBy: 'all',
  },
};

// =============================================================================
// INITIAL USER STATE
// =============================================================================

const INITIAL_USER_STATE: UserState = {
  // Core user data
  currentUser: null,
  profile: null,
  
  // Authentication state
  auth: {
    isAuthenticated: false,
    isLoading: false,
    token: null,
    refreshToken: null,
    expiresAt: null,
    loginMethod: null,
  },
  
  // User preferences
  preferences: {
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    theme: 'light',
    customTheme: null,
    soundEnabled: true,
    vibrationEnabled: true,
    notificationsEnabled: true,
    locationSharingEnabled: false,
    analyticsEnabled: true,
    marketingEmailsEnabled: false,
  },
  
  // Privacy and security
  privacy: {
    dataProcessingConsent: false,
    marketingConsent: false,
    analyticsConsent: false,
    consentDate: null,
    twoFactorEnabled: false,
    biometricLoginEnabled: false,
    sessionTimeout: 30, // minutes
  },
  
  // User activity and streaks
  activity: {
    currentStreak: 0,
    longestStreak: 0,
    totalAlarmsSet: 0,
    totalAlarmsTriggered: 0,
    totalAlarmsDismissed: 0,
    totalSnoozesUsed: 0,
    averageWakeTime: '07:00',
    sleepScore: 0,
    lastActive: null,
    joinDate: null,
  },
  
  // Achievements and gamification
  achievements: {
    unlockedAchievements: [],
    availableAchievements: [],
    totalPoints: 0,
    currentLevel: 1,
    progressToNextLevel: 0,
    badges: [],
  },
  
  // Social features
  social: {
    friends: [],
    challenges: [],
    leaderboardRank: null,
    sharePermissions: {
      shareProfile: false,
      shareActivity: false,
      shareAchievements: false,
      shareStreaks: false,
      allowFriendRequests: true,
      allowChallengeInvites: true,
    },
    communityParticipation: false,
  },
  
  // Error states
  errors: {
    profileLoadError: null,
    updateError: null,
    authError: null,
    permissionError: null,
  },
  
  // Loading states
  loading: {
    profile: false,
    preferences: false,
    activity: false,
    achievements: false,
    friends: false,
  },
};

// =============================================================================
// INITIAL SUBSCRIPTION STATE
// =============================================================================

const INITIAL_SUBSCRIPTION_STATE: SubscriptionState = {
  // Core subscription data
  currentSubscription: null,
  subscriptionPlan: null,
  availablePlans: [],
  
  // Feature access
  featureAccess: null,
  featureUsage: {},
  billingUsage: null,
  
  // Subscription status
  status: {
    isActive: false,
    isPremium: false,
    tier: 'free',
    status: 'active',
    expiresAt: null,
    renewsAt: null,
    cancelAtPeriodEnd: false,
    gracePeriodEndsAt: null,
  },
  
  // Trial information
  trial: {
    isInTrial: false,
    trialPlan: null,
    trialStarted: null,
    trialEndsAt: null,
    trialDaysRemaining: 0,
    hasUsedTrial: false,
    eligibleForExtension: false,
  },
  
  // Billing and payments
  billing: {
    paymentMethods: [],
    defaultPaymentMethod: null,
    upcomingInvoice: null,
    invoiceHistory: [],
    paymentHistory: [],
    nextBillingDate: null,
    billingInterval: 'monthly',
    currency: 'USD',
    taxRate: 0,
  },
  
  // Discounts and promotions
  promotions: {
    activeDiscounts: [],
    availableDiscounts: [],
    referralCode: null,
    referralStats: {
      referralsCount: 0,
      successfulReferrals: 0,
      totalEarnings: 0,
      pendingEarnings: 0,
    },
  },
  
  // Upgrade/downgrade management
  changes: {
    pendingChange: null,
    changeHistory: [],
    upgradePrompts: [],
    lastUpgradePrompt: null,
    upgradePromptFrequency: 7,
  },
  
  // Feature limitations and usage warnings
  limits: {
    reachedLimits: new Set(),
    approachingLimits: new Set(),
    overageFees: [],
    warningsShown: new Set(),
  },
  
  // UI state for subscription management
  ui: {
    showUpgradeModal: false,
    showCancelModal: false,
    showPaymentModal: false,
    selectedUpgradePlan: null,
    paymentProcessing: false,
    lastPaymentError: null,
    showUsageDetails: false,
  },
  
  // Loading and error states
  loading: {
    subscription: false,
    plans: false,
    paymentMethods: false,
    invoices: false,
    featureAccess: false,
  },
  
  errors: {
    subscriptionError: null,
    paymentError: null,
    billingError: null,
    featureAccessError: null,
  },
};

// =============================================================================
// INITIAL APP STATE  
// =============================================================================

export const INITIAL_DOMAIN_APP_STATE: AppState = {
  alarm: INITIAL_ALARM_STATE,
  user: INITIAL_USER_STATE,
  subscription: INITIAL_SUBSCRIPTION_STATE,
  
  // Global app state
  app: {
    initialized: false,
    isOnline: navigator?.onLine ?? true,
    lastSync: null,
    syncInProgress: false,
    version: '1.0.0',
    environment: 'development',
    maintenanceMode: false,
    criticalError: null,
  },
  
  // Navigation and routing
  navigation: {
    currentView: 'dashboard',
    previousView: null,
    navigationHistory: ['dashboard'],
    modalStack: [],
  },
  
  // Performance monitoring
  performance: {
    startupTime: 0,
    memoryUsage: 0,
    batteryOptimized: true,
    reducedAnimations: false,
  },
};

// Export individual state sections for testing and development
export {
  INITIAL_ALARM_STATE,
  INITIAL_USER_STATE, 
  INITIAL_SUBSCRIPTION_STATE,
  DEFAULT_VOICE_MOOD
};