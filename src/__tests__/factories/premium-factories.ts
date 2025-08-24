/**
 * Premium Features Factories
 *
 * Factory functions for generating premium-related entities:
 * - Subscriptions (with different tiers and billing)
 * - Premium Voices (with various personalities)
 * - Custom Sounds (user-generated and premium)
 * - Analytics & Insights
 * - Premium Features & Usage tracking
 */

import { faker } from '@faker-js/faker';
import type {
  Subscription,
  SubscriptionStatus,
  BillingInterval,
  PremiumFeatureCategory,
} from '../../types/premium';
import type {
  PremiumFeature,
  PremiumVoice,
  PremiumAnalytics,
  VoiceMood,
  SubscriptionTier,
  PremiumFeatureCategory,
  PremiumVoiceCategory,
  VoicePersonality,
  VoiceSample,
  VoiceFeatures,
  CustomSound,
  SoundCategory,
  AnalyticsPeriod,
  SleepInsights,
  WakeUpPatterns,
  PerformanceMetrics,
} from '../../types';
import {
  generateId,
  generateTimestamp,
  generatePriceCents,
  generateRating,
  generateUrl,
  randomSubset,
  weightedRandom,
  COMMON_DATA,
} from './factory-utils';

// ===============================
// SUBSCRIPTION FACTORIES
// ===============================

export interface CreateSubscriptionOptions {
  tier?: SubscriptionTier;
  status?: SubscriptionStatus;
  billingInterval?: BillingInterval;
  trial?: boolean;
  userId?: string;
}

export const _createTestSubscription = (
  options: CreateSubscriptionOptions = {}
): Subscription => {
  const {
    tier = weightedRandom([
      { item: 'free', weight: 40 },
      { item: 'basic', weight: 30 },
      { item: 'premium', weight: 20 },
      { item: 'pro', weight: 8 },
      { item: 'enterprise', weight: 2 },
    ]) as SubscriptionTier,
    status = weightedRandom([
      { item: 'active', weight: 60 },
      { item: 'trialing', weight: 15 },
      { item: 'past_due', weight: 10 },
      { item: 'canceled', weight: 8 },
      { item: 'unpaid', weight: 4 },
      { item: 'incomplete', weight: 2 },
      { item: 'paused', weight: 1 },
    ] as Array<{ item: SubscriptionStatus; weight: number }>),
    billingInterval = faker.helpers.arrayElement([
      'month',
      'year',
      'lifetime',
    ] as BillingInterval[]),
    trial = status === 'trialing' || faker.datatype.boolean({ probability: 0.2 }),
    userId = generateId('user'),
  } = options;

  const subscriptionId = generateId('subscription');
  const currentPeriodStart = faker.date.recent({ days: 30 });
  const currentPeriodEnd = new Date(currentPeriodStart);

  if (billingInterval === 'month') {
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
  } else if (billingInterval === 'year') {
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
  } else {
    // Lifetime
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 100);
  }

  // Pricing based on tier and interval
  const monthlyPricing = {
    free: 0,
    basic: 499, // $4.99
    premium: 999, // $9.99
    pro: 1999, // $19.99
    enterprise: 4999, // $49.99
  };

  const amount =
    billingInterval === 'year'
      ? Math.floor(monthlyPricing[tier] * 12 * 0.83) // 17% discount for yearly
      : billingInterval === 'lifetime'
        ? monthlyPricing[tier] * 120 // 10 years worth
        : monthlyPricing[tier];

  return {
    id: subscriptionId,
    userId,
    stripeSubscriptionId:
      tier !== 'free' ? `sub_${faker.string.alphanumeric(14)}` : undefined,
    stripeCustomerId:
      tier !== 'free' ? `cus_${faker.string.alphanumeric(14)}` : undefined,
    tier,
    status,
    billingInterval,
    amount,
    currency: 'usd',
    currentPeriodStart,
    currentPeriodEnd,
    trialStart: trial ? faker.date.recent({ days: 14 }) : undefined,
    trialEnd: trial ? faker.date.soon({ days: 14 }) : undefined,
    cancelAtPeriodEnd:
      status === 'canceled' || faker.datatype.boolean({ probability: 0.1 }),
    canceledAt: status === 'canceled' ? faker.date.recent({ days: 30 }) : undefined,
    endedAt: ['ended', 'incomplete_expired'].includes(status)
      ? faker.date.recent({ days: 30 })
      : undefined,
    createdAt: faker.date.recent({ days: 365 }),
    updatedAt: faker.date.recent({ days: 30 }),
    metadata: {
      source: faker.helpers.arrayElement(['web', 'mobile', 'referral']),
      campaign: faker.datatype.boolean({ probability: 0.3 })
        ? faker.string.alphanumeric(8)
        : undefined,
      referrer: faker.datatype.boolean({ probability: 0.2 })
        ? generateId('user')
        : undefined,
    },
  };
};

export const _createTestPremiumFeature = (
  options: {
    category?: PremiumFeatureCategory;
    tier?: SubscriptionTier;
  } = {}
): PremiumFeature => {
  const {
    category = faker.helpers.arrayElement([
      'alarms',
      'battles',
      'voice',
      'themes',
      'integrations',
      'analytics',
      'ai',
      'collaboration',
      'automation',
      'customization',
    ]),
    tier = faker.helpers.arrayElement([
      'free',
      'basic',
      'premium',
      'pro',
      'enterprise',
    ]) as SubscriptionTier,
  } = options;

  const features = {
    voice: [
      'Premium Voice Personalities',
      'Custom Voice Training',
      'Voice Emotion Detection',
      'Advanced Voice Commands',
    ],
    analytics: [
      'Sleep Pattern Analysis',
      'Performance Insights',
      'Trend Predictions',
      'Export Reports',
    ],
    customization: [
      'Custom Themes',
      'Advanced Sounds',
      'UI Personalization',
      'Branded Experience',
    ],
    gaming: [
      'Tournament Access',
      'Premium Battles',
      'Advanced Statistics',
      'Leaderboard Priority',
    ],
    automation: [
      'Smart Scheduling',
      'Weather Integration',
      'Calendar Sync',
      'IoT Device Control',
    ],
  };

  const featureName = faker.helpers.arrayElement(features[category]);

  return {
    id: generateId('feature'),
    name: featureName,
    description: faker.lorem.sentence(),
    category,
    icon: faker.helpers.arrayElement(['🎵', '📊', '🎨', '🎮', '🤖', '⚡', '🔊', '📈']),
    requiredTier: tier,
    isCore: tier === 'basic',
    isAddon: faker.datatype.boolean({ probability: 0.2 }),
    addonPrice: faker.datatype.boolean({ probability: 0.2 })
      ? generatePriceCents(99, 499)
      : undefined,
    comingSoon: faker.datatype.boolean({ probability: 0.1 }),
  };
};

// ===============================
// VOICE FACTORIES
// ===============================

export interface CreateVoiceOptions {
  mood?: VoiceMood;
  tier?: SubscriptionTier;
  isCustom?: boolean;
  language?: string;
}

export const _createTestVoice = (options: CreateVoiceOptions = {}): PremiumVoice => {
  const {
    mood = faker.helpers.arrayElement([...COMMON_DATA.voiceMoods]) as VoiceMood,
    tier = faker.helpers.arrayElement([
      'free',
      'basic',
      'premium',
      'pro',
      'enterprise',
    ]) as SubscriptionTier,
    isCustom = faker.datatype.boolean({ probability: 0.1 }),
    language = faker.helpers.arrayElement([
      'en-US',
      'en-GB',
      'es-ES',
      'fr-FR',
      'de-DE',
      'ja-JP',
      'hi-IN',
    ]),
  } = options;

  const voiceId = generateId('voice');

  const voiceNames = {
    'drill-sergeant': ['Commander Steel', 'Sergeant Iron', 'Captain Thunder'],
    'sweet-angel': ['Luna Whisper', 'Seraphina Grace', 'Melody Sweet'],
    'anime-hero': ['Akira Sunrise', 'Yuki Power', 'Sakura Victory'],
    'savage-roast': ['Brutus Burns', 'Sassy Supreme', 'Roast Master'],
    motivational: ['Champion Spirit', 'Victory Voice', 'Success Guide'],
    gentle: ['Calm Waters', 'Peaceful Dawn', 'Soft Breeze'],
    'demon-lord': ['Inferno King', 'Shadow Master', 'Dark Emperor'],
    'ai-robot': ['Cyber Sage', 'Digital Oracle', 'Tech Commander'],
    comedian: ['Laugh Track', 'Joke Master', 'Comedy Central'],
    philosopher: ['Wisdom Voice', 'Sage Speak', 'Deep Thoughts'],
  };

  const name = faker.helpers.arrayElement(voiceNames[mood] || ['Custom Voice']);

  return {
    id: voiceId,
    name,
    description: faker.lorem.sentence(),
    mood,
    tier,
    category: faker.helpers.arrayElement([
      'character',
      'celebrity',
      'professional',
      'community',
    ]) as PremiumVoiceCategory,
    language,
    accent: faker.helpers.arrayElement([
      'american',
      'british',
      'australian',
      'neutral',
    ]),
    gender: faker.helpers.arrayElement(['male', 'female', 'neutral', 'custom']),
    ageRange: faker.helpers.arrayElement(['young', 'adult', 'mature', 'elderly']),
    personality: createTestVoicePersonality(),
    samples: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () =>
      createTestVoiceSample()
    ),
    isCustom,
    createdBy: isCustom ? generateId('user') : undefined,
    tags: randomSubset(
      [
        'energetic',
        'calm',
        'funny',
        'serious',
        'friendly',
        'intense',
        'soothing',
        'powerful',
      ],
      2,
      4
    ),
    popularity: faker.number.int({ min: 0, max: 10000 }),
    rating: generateRating(),
    downloadCount: faker.number.int({ min: 0, max: 50000 }),
    features: createTestVoiceFeatures(),
  };
};

const createTestVoicePersonality = (): SafeVoicePersonality => ({
  energy: faker.number.int({ min: 1, max: 10 }),
  humor: faker.number.int({ min: 1, max: 10 }),
  intensity: faker.number.int({ min: 1, max: 10 }),
  supportiveness: faker.number.int({ min: 1, max: 10 }),
  directness: faker.number.int({ min: 1, max: 10 }),
  creativity: faker.number.int({ min: 1, max: 10 }),
  traits: randomSubset(
    [
      'encouraging',
      'playful',
      'direct',
      'patient',
      'witty',
      'dramatic',
      'calm',
      'energetic',
      'wise',
      'sarcastic',
    ],
    2,
    4
  ),
});

const createTestVoiceSample = (): SafeVoiceSample => ({
  id: generateId('sample'),
  text: faker.helpers.arrayElement([
    "Rise and shine, champion! Today's your day to conquer the world!",
    'Good morning, sleepyhead. Time to embrace the beautiful day ahead.',
    'Wake up, warrior! Your dreams are waiting for you to make them reality!',
    "Morning motivation coming right up! Let's make today absolutely legendary!",
    "Time to get up and show the world what you're made of!",
    "Another day, another chance to be awesome. Let's do this!",
  ]),
  audioUrl: generateUrl() + '/sample.mp3',
  duration: faker.number.int({ min: 2, max: 10 }), // seconds
  context: faker.helpers.arrayElement([
    'wake_up', // auto: adjusted to match enum
    'motivation',
    'challenge', // auto: adjusted to match enum
    'success', // auto: adjusted to match enum
  ]),
  emotion: faker.helpers.arrayElement(['excited', 'calm', 'determined', 'playful']),
});

const createTestVoiceFeatures = (): SafeVoiceFeatures => ({
  emotionalAdaptation: faker.datatype.boolean({ probability: 0.7 }),
  contextAwareness: faker.datatype.boolean({ probability: 0.6 }),
  personalizedMessages: faker.datatype.boolean({ probability: 0.8 }),
  multiLanguage: faker.datatype.boolean({ probability: 0.4 }),
  customizable: faker.datatype.boolean({ probability: 0.5 }),
  backgroundMusic: faker.datatype.boolean({ probability: 0.3 }),
  voiceEffects: faker.datatype.boolean({ probability: 0.4 }),
  realTimeGeneration: faker.datatype.boolean({ probability: 0.2 }),
});

// ===============================
// CUSTOM SOUND FACTORIES
// ===============================

export interface CreateCustomSoundOptions {
  category?: SoundCategory;
  isCustom?: boolean;
  uploadedBy?: string;
}

export const _createTestCustomSound = (
  options: CreateCustomSoundOptions = {}
): CustomSound => {
  const {
    category = faker.helpers.arrayElement([
      'nature',
      'music',
      'voice',
      'effects',
      'ambient',
      'white-noise',
    ]),
    isCustom = faker.datatype.boolean({ probability: 0.3 }),
    uploadedBy,
  } = options;

  const soundId = generateId('sound');
  const fileName = `${faker.system.fileName()}.mp3`;

  const soundNames = {
    nature: ['Forest Birds', 'Ocean Waves', 'Rain Storm', 'Mountain Stream'],
    music: ['Piano Melody', 'Guitar Strums', 'Orchestral Rise', 'Electronic Beat'],
    voice: ['Gentle Wake Up', 'Energy Boost', 'Calm Reminder', 'Motivational Call'],
    effects: ['Chimes', 'Bell Tower', 'Space Sounds', 'Wind Instruments'],
    ambient: ['City Morning', 'Cafe Atmosphere', 'Library Quiet', 'Garden Peace'],
    'white-noise': ['Pink Noise', 'Brown Noise', 'Fan Sound', 'Static Calm'],
  };

  return {
    id: soundId,
    name: faker.helpers.arrayElement(soundNames[category]),
    description: faker.lorem.sentence(),
    fileName,
    fileUrl: `${generateUrl()}/sounds/${fileName}`,
    duration: faker.number.int({ min: 10, max: 300 }), // 10 seconds to 5 minutes
    category,
    tags: randomSubset(
      ['relaxing', 'energizing', 'focus', 'sleep', 'meditation', 'workout', 'study'],
      1,
      3
    ),
    isCustom,
    uploadedBy: isCustom ? uploadedBy || generateId('user') : undefined,
    uploadedAt: isCustom ? generateTimestamp({ past: 90 }) : undefined,
    downloads: faker.number.int({ min: 0, max: 10000 }),
    rating: generateRating(),
    format: faker.helpers.arrayElement(['mp3', 'wav', 'ogg']),
    size: faker.number.int({ min: 100000, max: 10000000 }), // bytes
    compressionLevel: faker.helpers.arrayElement(['none', 'light', 'medium', 'heavy']),
    isPreloaded: !isCustom && faker.datatype.boolean({ probability: 0.5 }),
  };
};

// ===============================
// ANALYTICS FACTORIES
// ===============================

export interface CreateAnalyticsOptions {
  userId?: string;
  period?: AnalyticsPeriod;
  premium?: boolean;
}

export const _createTestAnalytics = (
  options: CreateAnalyticsOptions = {}
): PremiumAnalytics => {
  const {
    userId = generateId('user'),
    period = faker.helpers.arrayElement(['day', 'week', 'month', 'quarter', 'year']),
    premium = true,
  } = options;

  return {
    userId,
    period,
    sleepInsights: createTestSleepInsights(),
    wakeUpPatterns: createTestWakeUpPatterns(),
    performanceMetrics: createTestPerformanceMetrics(),
    recommendations: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () =>
      createTestAnalyticsRecommendation()
    ),
    trends: Array.from({ length: faker.number.int({ min: 5, max: 15 }) }, () =>
      createTestAnalyticsTrend()
    ),
    comparisons: createTestAnalyticsComparison(),
    goals: Array.from({ length: faker.number.int({ min: 2, max: 6 }) }, () =>
      createTestAnalyticsGoal()
    ),
    achievements: Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, () =>
      createTestAnalyticsAchievement()
    ),
    exportOptions: premium ? createTestAnalyticsExportOptions() : [],
  };
};

const createTestSleepInsights = (): SafeSleepInsights => ({
  averageBedtime: faker.date.recent().toTimeString().slice(0, 5),
  averageWakeTime: faker.date.recent().toTimeString().slice(0, 5),
  averageSleepDuration: faker.number.float({ min: 6.0, max: 10.0, multipleOf: 0.1 }),
  sleepEfficiency: faker.number.float({ min: 0.7, max: 0.98, multipleOf: 0.01 }),
  consistencyScore: faker.number.int({ min: 60, max: 100 }),
  optimalBedtime: faker.date.recent().toTimeString().slice(0, 5),
  sleepDebt: faker.number.float({ min: -2.0, max: 2.0, multipleOf: 0.1 }),
  weekendShift: faker.number.float({ min: -2.0, max: 3.0, multipleOf: 0.1 }),
});

const createTestWakeUpPatterns = (): SafeWakeUpPatterns => ({
  mostCommonWakeTime: faker.date.recent().toTimeString().slice(0, 5),
  wakeTimeVariability: faker.number.float({ min: 0.1, max: 2.0, multipleOf: 0.1 }),
  snoozeFrequency: faker.number.float({ min: 0.1, max: 0.8, multipleOf: 0.01 }),
  averageSnoozeCount: faker.number.float({ min: 0.5, max: 4.0, multipleOf: 0.1 }),
  quickestWakeUp: faker.number.int({ min: 0, max: 60 }), // seconds
  longestSnoozeSession: faker.number.int({ min: 5, max: 120 }), // minutes
  weekdayVsWeekend: {
    weekdayAvg: faker.date.recent().toTimeString().slice(0, 5),
    weekendAvg: faker.date.recent().toTimeString().slice(0, 5),
    difference: faker.number.float({ min: -2.0, max: 4.0, multipleOf: 0.1 }),
  },
});

const createTestPerformanceMetrics = (): SafePerformanceMetrics => ({
  completionRate: faker.number.float({ min: 0.6, max: 1.0, multipleOf: 0.01 }),
  averageResponseTime: faker.number.int({ min: 5, max: 300 }), // seconds
  streakRecord: faker.number.int({ min: 1, max: 100 }),
  currentStreak: faker.number.int({ min: 0, max: 50 }),
  improvementTrend: faker.number.float({ min: -0.2, max: 0.3, multipleOf: 0.01 }),
  battlesWon: faker.number.int({ min: 0, max: 50 }),
  totalBattles: faker.number.int({ min: 1, max: 100 }),
  winRate: faker.number.float({ min: 0.1, max: 0.9, multipleOf: 0.01 }),
  experienceGained: faker.number.int({ min: 100, max: 10000 }),
});

const createTestAnalyticsRecommendation = () => ({
  id: generateId('recommendation'),
  type: faker.helpers.arrayElement(['sleep', 'wake', 'habit', 'battle', 'voice']),
  title: faker.lorem.words(4),
  description: faker.lorem.sentence(),
  priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
  actionable: faker.datatype.boolean({ probability: 0.8 }),
  estimatedImpact: faker.helpers.arrayElement(['small', 'medium', 'large']),
  category: faker.helpers.arrayElement([
    'timing',
    'consistency',
    'motivation',
    'health',
  ]),
});

const createTestAnalyticsTrend = () => ({
  id: generateId('trend'),
  metric: faker.helpers.arrayElement([
    'wake-time',
    'sleep-duration',
    'consistency',
    'performance',
  ]),
  direction: faker.helpers.arrayElement(['up', 'down', 'stable']),
  magnitude: faker.number.float({ min: 0.1, max: 2.0, multipleOf: 0.1 }),
  confidence: faker.number.float({ min: 0.6, max: 0.99, multipleOf: 0.01 }),
  timeframe: faker.helpers.arrayElement(['week', 'month', 'quarter']),
  significance: faker.helpers.arrayElement(['minor', 'moderate', 'significant']),
});

const createTestAnalyticsComparison = () => ({
  previousPeriod: {
    completionRate: faker.number.float({ min: 0.5, max: 1.0, multipleOf: 0.01 }),
    avgWakeTime: faker.date.recent().toTimeString().slice(0, 5),
    streakDays: faker.number.int({ min: 0, max: 30 }),
  },
  improvement: {
    completionRate: faker.number.float({ min: -0.2, max: 0.3, multipleOf: 0.01 }),
    wakeTimeConsistency: faker.number.float({ min: -0.5, max: 0.5, multipleOf: 0.01 }),
    overallScore: faker.number.int({ min: -20, max: 25 }),
  },
  ranking: {
    global: faker.number.int({ min: 1, max: 100000 }),
    friends: faker.number.int({ min: 1, max: 50 }),
    percentile: faker.number.int({ min: 10, max: 99 }),
  },
});

const createTestAnalyticsGoal = () => ({
  id: generateId('goal'),
  type: faker.helpers.arrayElement(['wake-time', 'consistency', 'streak', 'battles']),
  target: faker.number.int({ min: 5, max: 100 }),
  current: faker.number.int({ min: 0, max: 80 }),
  deadline: generateTimestamp({ future: 30 }),
  priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
  status: faker.helpers.arrayElement(['active', 'paused', 'completed', 'failed']),
});

const createTestAnalyticsAchievement = () => ({
  id: generateId('achievement'),
  name: faker.helpers.arrayElement([
    'Early Bird',
    'Consistency King',
    'Battle Warrior',
    'Snooze Slayer',
    'Wake Up Champion',
    'Morning Motivation',
    'Streak Master',
  ]),
  description: faker.lorem.sentence(),
  unlockedAt: generateTimestamp({ past: 30 }),
  rarity: faker.helpers.arrayElement([
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary',
  ]),
  points: faker.number.int({ min: 50, max: 500 }),
});

const createTestAnalyticsExportOptions = () => [
  {
    format: 'pdf',
    name: 'Detailed Sleep Report',
    description: 'Comprehensive analysis with charts and insights',
  },
  {
    format: 'csv',
    name: 'Raw Data Export',
    description: 'All your data in CSV format for analysis',
  },
  {
    format: 'json',
    name: 'API Data Export',
    description: 'Machine-readable format for integrations',
  },
];

// ===============================
// PUBLIC EXPORTS
// ===============================

// Subscription exports
export const createTestSubscription = _createTestSubscription;
export const createTestPremiumFeature = _createTestPremiumFeature;

// Voice exports
export const createTestVoice = _createTestVoice;

// Custom Sound exports
export const createTestCustomSound = _createTestCustomSound;

// Analytics exports
export const createTestAnalytics = _createTestAnalytics;

// ===============================
// MISSING EXPORT PLACEHOLDERS
// ===============================

// Placeholder exports to satisfy imports - please refine
export const _createTestSubscriptionPlan = (options: any = {}) => {
  return {} as any; // auto: placeholder - please refine
};

export const _createTestPaymentMethod = (options: any = {}) => {
  return {} as any; // auto: placeholder - please refine
};

export const _createTestPricing = (options: any = {}) => {
  return {} as any; // auto: placeholder - please refine
};

// Placeholder exports
export const createTestSubscriptionPlan = _createTestSubscriptionPlan;
export const createTestPaymentMethod = _createTestPaymentMethod;
export const createTestPricing = _createTestPricing;

// ===============================
// SAFE TYPE WIDENINGS
// ===============================

// auto: widened type - factory functions can return partial interfaces
export type SafeVoicePersonality = Partial<VoicePersonality> & {
  energy: number;
  humor: number;
};
export type SafeVoiceSample = Partial<VoiceSample> & {
  id: string;
  text: string;
  audioUrl: string;
  duration: number;
};
export type SafeVoiceFeatures = Partial<VoiceFeatures>;
export type SafeSleepInsights = Partial<SleepInsights> & {
  averageSleepDuration?: number;
  sleepQualityScore?: number;
};
export type SafeWakeUpPatterns = Partial<WakeUpPatterns> & { averageWakeTime?: string };
export type SafePerformanceMetrics = Partial<PerformanceMetrics> & {
  wakeUpSuccessRate?: number;
};
