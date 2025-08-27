/**
 * Domain-Specific Interfaces
 * Core business domain entities for the Relife alarm application
 */

// =============================================================================
// CORE DOMAIN INTERFACES
// =============================================================================

export interface Alarm {
  id: string;
  userId: string;
  title: string;
  time: string; // HH:MM format
  enabled: boolean;
  days: number[]; // 0-6 (Sunday to Saturday)
  sound: string;
  volume: number; // 0-1
  snoozeEnabled: boolean;
  snoozeInterval: number; // minutes
  maxSnoozes: number;
  vibrationEnabled?: boolean;
  label?: string;
  description?: string;
  isRecurring?: boolean;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  level?: number;
  experience?: number;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus?: SubscriptionStatus;
  joinDate?: Date;
  lastActive?: Date;
  preferences?: UserPreferences;
  settings?: UserSettings;
  stats?: UserStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  theme: 'light' | 'dark' | 'auto' | 'custom';
  customTheme?: string | null;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  locationSharingEnabled: boolean;
  analyticsEnabled: boolean;
  marketingEmailsEnabled: boolean;
}

export interface UserSettings {
  defaultAlarmSound: string;
  defaultVolume: number;
  defaultSnoozeInterval: number;
  maxSnoozes: number;
  batteryOptimization: boolean;
  autoSyncEnabled: boolean;
  backupEnabled: boolean;
}

export interface UserStats {
  totalBattles?: number;
  wins?: number;
  losses?: number;
  winRate?: number;
  currentStreak: number;
  longestStreak: number;
  averageWakeTime?: string;
  totalAlarmsSet: number;
  alarmsCompleted?: number;
  snoozeCount?: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId?: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  amount: number; // in cents
  currency: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  endedAt?: Date;
  autoRenew: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  tier: SubscriptionTier;
  features: string[];
  limits: PlanLimits;
  pricing: PlanPricing;
  stripePriceId: string;
  stripeProductId: string;
  isPopular?: boolean;
  isRecommended?: boolean;
  sortOrder: number;
  isActive: boolean;
  trialDays?: number;
  discountEligible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanLimits {
  maxAlarms: number;
  maxBattles: number;
  maxCustomSounds: number;
  maxVoicePersonalities: number;
  maxCustomThemes: number;
  storageLimit: number; // in MB
  apiCallsPerMonth: number;
  supportLevel: 'basic' | 'priority' | 'dedicated';
}

export interface PlanPricing {
  monthly: {
    amount: number; // in cents
    currency: string;
    stripePriceId: string;
  };
  yearly: {
    amount: number; // in cents
    currency: string;
    stripePriceId: string;
    discountPercentage?: number;
  };
  lifetime?: {
    amount: number; // in cents
    currency: string;
    stripePriceId: string;
  };
}

export interface FeatureAccess {
  userId: string;
  tier: SubscriptionTier;
  features: Record<string, FeatureUsageInfo>;
  lastUpdated: Date;
}

export interface FeatureUsageInfo {
  hasAccess: boolean;
  usageCount: number;
  usageLimit: number;
  resetDate: Date;
}

export interface FeatureUsage {
  featureId: string;
  userId: string;
  usageCount: number;
  lastUsed: Date;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface BillingUsage {
  userId: string;
  period: string;
  apiCalls: number;
  storageUsed: number; // in MB
  bandwidthUsed: number; // in MB
  calculatedAt: Date;
}

export interface VoiceMood {
  id: string;
  name: string;
  tone: 'calm' | 'energetic' | 'assertive' | 'gentle' | 'firm';
  pitch: number; // 0-2
  speed: number; // 0.5-2
  volume: number; // 0-1
  personalityTraits?: string[];
  sampleText?: string;
  isCustom?: boolean;
  userId?: string;
  createdAt?: Date;
}

export interface AlarmEvent {
  id: string;
  alarmId: string;
  userId: string;
  type: 'triggered' | 'dismissed' | 'snoozed' | 'missed';
  timestamp: Date;
  responseTime?: number; // seconds
  snoozeCount?: number;
  effectiveness?: number; // 1-10
  context?: AlarmContext;
}

export interface AlarmContext {
  deviceType: string;
  batteryLevel?: number;
  isCharging?: boolean;
  networkStatus: 'online' | 'offline';
  locationApproximate?: string;
  weatherCondition?: string;
  sleepQuality?: number; // 1-10
}

export interface AlarmInstance {
  id: string;
  alarmId: string;
  scheduledTime: Date;
  actualTime?: Date;
  status: 'pending' | 'triggered' | 'dismissed' | 'snoozed' | 'missed';
  snoozeCount: number;
  createdAt: Date;
}

// =============================================================================
// TYPE UNIONS AND ENUMS
// =============================================================================

export type SubscriptionTier = 
  | 'free' 
  | 'basic' 
  | 'student' 
  | 'premium' 
  | 'pro' 
  | 'ultimate' 
  | 'lifetime';

export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'past_due' 
  | 'unpaid' 
  | 'trialing' 
  | 'incomplete' 
  | 'incomplete_expired';

export type BillingInterval = 'month' | 'year' | 'lifetime';

export type PaymentStatus = 
  | 'succeeded' 
  | 'pending' 
  | 'failed' 
  | 'canceled' 
  | 'requires_action' 
  | 'processing';

// =============================================================================
// PAYMENT INTERFACES
// =============================================================================

export interface PaymentMethod {
  id: string;
  userId: string;
  stripePaymentMethodId: string;
  type: 'card' | 'bank_account' | 'paypal';
  isDefault: boolean;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId: string;
  stripeInvoiceId: string;
  amount: number; // in cents
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  paidAt?: Date;
  items: InvoiceItem[];
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number; // in cents
  quantity: number;
  unitAmount: number; // in cents
}

export interface Payment {
  id: string;
  userId: string;
  invoiceId?: string;
  stripePaymentIntentId: string;
  amount: number; // in cents
  currency: string;
  status: PaymentStatus;
  paymentMethodId: string;
  paidAt?: Date;
  failureReason?: string;
  createdAt: Date;
}

// =============================================================================
// UTILITY INTERFACES
// =============================================================================

export interface Trial {
  userId: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  hasEnded: boolean;
  extendedUntil?: Date;
}

export interface Discount {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumAmount?: number;
  maxUses?: number;
  currentUses: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableTiers: SubscriptionTier[];
}

export interface UserDiscount {
  userId: string;
  discountId: string;
  appliedAt: Date;
  subscriptionId: string;
  amountSaved: number; // in cents
}

// =============================================================================
// THEME AND PERSONALIZATION INTERFACES
// =============================================================================

export interface Theme {
  id: string;
  name: string;
  displayName: string;
  category: 'light' | 'dark' | 'custom' | 'seasonal';
  colors: ThemeColors;
  isCustom: boolean;
  isPremium: boolean;
  createdBy?: string;
  createdAt?: Date;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
}

export interface PersonalizationSettings {
  theme: 'light' | 'dark' | 'auto' | 'custom';
  customTheme?: string;
  colorPreferences: {
    favoriteColors: string[];
    avoidColors: string[];
    colorblindFriendly: boolean;
    highContrastMode: boolean;
    saturationLevel: number;
    brightnessLevel: number;
    warmthLevel: number;
  };
  typographyPreferences?: {
    preferredFontSize: string;
    fontSizeScale: number;
    preferredFontFamily: string;
    lineHeightPreference: string;
    letterSpacingPreference: string;
    fontWeight: string;
    dyslexiaFriendly: boolean;
  };
  motionPreferences?: {
    enableAnimations: boolean;
    animationSpeed: string;
    reduceMotion: boolean;
    preferCrossfade: boolean;
    enableParallax: boolean;
    enableHoverEffects: boolean;
    enableFocusAnimations: boolean;
  };
  soundPreferences?: {
    enableSounds: boolean;
    soundVolume: number;
    soundTheme: string;
    customSounds: Record<string, string>;
    muteOnFocus: boolean;
    hapticFeedback: boolean;
    spatialAudio: boolean;
  };
  layoutPreferences?: {
    density: string;
    navigation: string;
    cardStyle: string;
    borderRadius: string;
    showLabels: boolean;
    showIcons: boolean;
    iconSize: string;
    gridColumns: number;
    listSpacing: string;
  };
  accessibilityPreferences?: {
    screenReaderOptimized: boolean;
    keyboardNavigationOnly: boolean;
    highContrastMode: boolean;
    largeTargets: boolean;
    reducedTransparency: boolean;
    boldText: boolean;
    underlineLinks: boolean;
    flashingElementsReduced: boolean;
    colorOnlyIndicators: boolean;
    focusIndicatorStyle: string;
  };
  lastUpdated: Date;
  syncAcrossDevices: boolean;
}

// =============================================================================
// BATTLE AND GAMIFICATION INTERFACES  
// =============================================================================

export interface Battle {
  id: string;
  alarmId: string;
  userId: string;
  type: 'math' | 'memory' | 'puzzle' | 'qr_code' | 'photo' | 'walking';
  difficulty: number; // 1-10
  status: 'pending' | 'active' | 'completed' | 'failed' | 'expired';
  config: BattleConfig;
  startedAt?: Date;
  completedAt?: Date;
  timeLimit: number; // seconds
  attempts: number;
  maxAttempts: number;
  score?: number;
  effectiveness?: number; // how well it woke up the user
  createdAt: Date;
}

export interface BattleConfig {
  type: Battle['type'];
  difficulty: number;
  timeLimit: number;
  maxAttempts: number;
  settings: Record<string, any>;
}

export interface BattleSettings {
  enabledTypes: Battle['type'][];
  defaultDifficulty: number;
  adaptiveDifficulty: boolean;
  maxConsecutiveFails: number;
  emergencyBackup: boolean;
  soundDuringBattle: boolean;
  vibrationDuringBattle: boolean;
}

export interface BattleParticipantStats {
  userId: string;
  totalBattles: number;
  completedBattles: number;
  failedBattles: number;
  successRate: number;
  averageCompletionTime: number;
  averageAttempts: number;
  bestTime: number;
  favoriteType: Battle['type'];
  currentDifficulty: number;
  lastBattleAt?: Date;
}

// =============================================================================
// SMART ALARM INTERFACES
// =============================================================================

export interface SmartAlarmSettings {
  enabledFeatures: string[];
  sleepCycleDetection: boolean;
  weatherIntegration: boolean;
  calendarIntegration: boolean;
  locationBasedTiming: boolean;
  machinelearningOptimization: boolean;
  adaptiveVolumeControl: boolean;
  intelligentSnoozing: boolean;
  contextAwareWakeup: boolean;
}

// =============================================================================
// PREMIUM FEATURE ACCESS INTERFACES
// =============================================================================

export interface PremiumFeatureAccess {
  userId: string;
  tier: SubscriptionTier;
  features: Record<string, boolean>;
  usage: Record<string, FeatureUsage>;
  limits: Record<string, number>;
  lastChecked: Date;
}