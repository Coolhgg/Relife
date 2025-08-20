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

import { faker } from "@faker-js/faker";
import type {
  Subscription,
  SubscriptionStatus,
  BillingInterval,
  PremiumFeatureCategory,
} from "../../types/premium";
import type {
  PremiumFeature,
  PremiumVoice,
  PremiumAnalytics,
  VoiceMood,
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
} from "../../types";
import {
  generateId,
  generateTimestamp,
  generatePriceCents,
  generateRating,
  generateUrl,
  randomSubset,
  weightedRandom,
  COMMON_DATA,
} from "./factory-utils";

// ===============================
// SUBSCRIPTION FACTORIES
// ===============================

export interface CreateSubscriptionOptions {
  status?: SubscriptionStatus;
  billingInterval?: BillingInterval;
  trial?: boolean;
  userId?: string;
}

export const _createTestSubscription = (
  options: CreateSubscriptionOptions = {},
): Subscription => {
  const {
    tier = weightedRandom([
      { item: "free", weight: 40 },
      { item: "basic", weight: 30 },
      { item: "premium", weight: 20 },
      { item: "pro", weight: 8 },
      { item: "enterprise", weight: 2 },
    status = weightedRandom([
      { item: "active", weight: 60 },
      { item: "trialing", weight: 15 },
      { item: "past_due", weight: 10 },
      { item: "canceled", weight: 8 },
      { item: "unpaid", weight: 4 },
      { item: "incomplete", weight: 2 },
      { item: "paused", weight: 1 },
    ] as Array<{ item: SubscriptionStatus; weight: number }>),
    billingInterval = faker.helpers.arrayElement([
      "month",
      "year",
      "lifetime",
    ] as BillingInterval[]),
    trial = status === "trialing" ||
      faker.datatype.boolean({ probability: 0.2 }),
    userId = generateId("user"),
  } = options;

  const subscriptionId = generateId("subscription");
  const currentPeriodStart = faker.date.recent({ days: 30 });
  const currentPeriodEnd = new Date(currentPeriodStart);

  if (billingInterval === "month") {
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
  } else if (billingInterval === "year") {
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
  } else {
    // Lifetime
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 100);
  }

  // Pricing based on tier and interval
    free: 0,
    basic: 499, // $4.99
    premium: 999, // $9.99
    pro: 1999, // $19.99
    enterprise: 4999, // $49.99
    lifetime: 9999, // $99.99 base for lifetime calculation
  };

  const amount =
    billingInterval === "year"
      ? Math.floor(monthlyPricing[tier] * 12 * 0.83) // 17% discount for yearly
      : billingInterval === "lifetime"
        ? monthlyPricing[tier] * 120 // 10 years worth
        : monthlyPricing[tier];

  return {
    id: subscriptionId,
    userId,
    stripeSubscriptionId:
      tier !== "free" ? `sub_${faker.string.alphanumeric(14)}` : undefined,
    stripeCustomerId:
      tier !== "free" ? `cus_${faker.string.alphanumeric(14)}` : undefined,
    tier,
    status,
    billingInterval,
    amount,
    currency: "usd",
    currentPeriodStart,
    currentPeriodEnd,
    trialStart: trial ? faker.date.recent({ days: 14 }) : undefined,
    trialEnd: trial ? faker.date.soon({ days: 14 }) : undefined,
    cancelAtPeriodEnd:
      status === "canceled" || faker.datatype.boolean({ probability: 0.1 }),
    canceledAt:
      status === "canceled" ? faker.date.recent({ days: 30 }) : undefined,
    endedAt: ["ended", "incomplete_expired"].includes(status)
      ? faker.date.recent({ days: 30 })
      : undefined,
    createdAt: faker.date.recent({ days: 365 }),
    updatedAt: faker.date.recent({ days: 30 }),
    metadata: {
      source: faker.helpers.arrayElement(["web", "mobile", "referral"]),
      campaign: faker.datatype.boolean({ probability: 0.3 })
        ? faker.string.alphanumeric(8)
        : undefined,
      referrer: faker.datatype.boolean({ probability: 0.2 })
        ? generateId("user")
        : undefined,
    },
  };
};

export const _createTestPremiumFeature = (
  options: {
    category?: PremiumFeatureCategory;
  } = {},
): PremiumFeature => {
  const {
    category = faker.helpers.arrayElement([
      "alarms",
      "battles",
      "voice",
      "themes",
      "integrations",
      "analytics",
      "ai",
      "collaboration",
      "automation",
      "customization",
    ]),
    tier = faker.helpers.arrayElement([
      "free",
      "basic",
      "premium",
      "pro",
      "enterprise",
  } = options;

  const features: Record<PremiumFeatureCategory, string[]> = {
    alarms: [
      "Premium Alarm Sounds",
      "Smart Snooze Control",
      "Advanced Wake Patterns",
      "Alarm Analytics",
    ],
    battles: [
      "Tournament Access",
      "Premium Battles",
      "Advanced Statistics",
      "Leaderboard Priority",
    ],
    voice: [
      "Premium Voice Personalities",
      "Custom Voice Training",
      "Voice Emotion Detection",
      "Advanced Voice Commands",
    ],
    themes: [
      "Premium Themes",
      "Custom Backgrounds",
      "Animated Themes",
      "Seasonal Collections",
    ],
    integrations: [
      "Third-party Apps",
      "Smart Home Control",
      "Calendar Sync",
      "Weather Integration",
    ],
    analytics: [
      "Sleep Pattern Analysis",
      "Performance Insights",
      "Trend Predictions",
      "Export Reports",
    ],
    ai: [
      "AI Recommendations",
      "Smart Scheduling",
      "Predictive Analysis",
      "Personalized Insights",
    ],
    collaboration: [
      "Team Features",
      "Shared Alarms",
      "Group Challenges",
      "Social Integration",
    ],
    automation: [
      "Smart Scheduling",
      "Auto-adjustments",
      "Rule-based Actions",
      "IoT Device Control",
    ],
    customization: [
      "Custom Themes",
      "Advanced Sounds",
      "UI Personalization",
      "Branded Experience",
    ],
  };

  const featureName = faker.helpers.arrayElement(features[category]);

  return {
    id: generateId("feature"),
    name: featureName,
    description: faker.lorem.sentence(),
    category,
    icon: faker.helpers.arrayElement([
      "🎵",
      "📊",
      "🎨",
      "🎮",
      "🤖",
      "⚡",
      "🔊",
      "📈",
    ]) as string,
    requiredTier: tier,
    isCore: ["basic", "premium"].includes(tier),
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
  isCustom?: boolean;
  language?: string;
}

export const _createTestVoice = (
  options: CreateVoiceOptions = {},
): PremiumVoice => {
  const {
    mood = faker.helpers.arrayElement([...COMMON_DATA.voiceMoods]) as VoiceMood,
    tier = faker.helpers.arrayElement([
      "free",
      "basic",
      "premium",
      "pro",
      "enterprise",
    isCustom = faker.datatype.boolean({ probability: 0.1 }),
    language = faker.helpers.arrayElement([
      "en-US",
      "en-GB",
      "es-ES",
      "fr-FR",
      "de-DE",
      "ja-JP",
      "hi-IN",
    ]),
  } = options;

  const voiceId = generateId("voice");

  const voiceNames = {
    "drill-sergeant": ["Commander Steel", "Sergeant Iron", "Captain Thunder"],
    "sweet-angel": ["Luna Whisper", "Seraphina Grace", "Melody Sweet"],
    "anime-hero": ["Akira Sunrise", "Yuki Power", "Sakura Victory"],
    "savage-roast": ["Brutus Burns", "Sassy Supreme", "Roast Master"],
    motivational: ["Champion Spirit", "Victory Voice", "Success Guide"],
    gentle: ["Calm Waters", "Peaceful Dawn", "Soft Breeze"],
    "demon-lord": ["Inferno King", "Shadow Master", "Dark Emperor"],
    "ai-robot": ["Cyber Sage", "Digital Oracle", "Tech Commander"],
    comedian: ["Laugh Track", "Joke Master", "Comedy Central"],
    philosopher: ["Wisdom Voice", "Sage Speak", "Deep Thoughts"],
  };

  const name = faker.helpers.arrayElement(voiceNames[mood] || ["Custom Voice"]);

  return {
    id: voiceId,
    name,
    description: faker.lorem.sentence(),
    mood,
    tier,
    category: faker.helpers.arrayElement([
      "character",
      "celebrity",
      "professional",
      "community",
    ]) as PremiumVoiceCategory,
    language,
    accent: faker.helpers.arrayElement([
      "american",
      "british",
      "australian",
      "neutral",
    ]),
    gender: faker.helpers.arrayElement(["male", "female", "neutral", "custom"]),
    ageRange: faker.helpers.arrayElement([
      "young",
      "adult",
      "mature",
      "elderly",
    ]),
    personality: createTestVoicePersonality(),
    samples: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () =>
      createTestVoiceSample(),
    ),
    isCustom,
    createdBy: isCustom ? generateId("user") : undefined,
    tags: randomSubset(
      [
        "energetic",
        "calm",
        "funny",
        "serious",
        "friendly",
        "intense",
        "soothing",
        "powerful",
      ],
      2,
      4,
    ),
    popularity: faker.number.int({ min: 0, max: 10000 }),
    rating: generateRating(),
    downloadCount: faker.number.int({ min: 0, max: 50000 }),
    features: createTestVoiceFeatures(),
  };
};

const createTestVoicePersonality = (): VoicePersonality =>
  ({
    energy: faker.number.int({ min: 1, max: 10 }),
    humor: faker.number.int({ min: 1, max: 10 }),
    intensity: faker.number.int({ min: 1, max: 10 }),
    supportiveness: faker.number.int({ min: 1, max: 10 }),
    directness: faker.number.int({ min: 1, max: 10 }),
    creativity: faker.number.int({ min: 1, max: 10 }),
    traits: randomSubset(
      [
        "encouraging",
        "playful",
        "direct",
        "patient",
        "witty",
        "dramatic",
        "calm",
        "energetic",
        "wise",
        "sarcastic",
      ],
      2,
      4,
    ),
  }) as any;

const createTestVoiceSample = (): VoiceSample =>
  ({
    id: generateId("sample"),
    text: faker.helpers.arrayElement([
      "Rise and shine, champion! Today's your day to conquer the world!",
      "Good morning, sleepyhead. Time to embrace the beautiful day ahead.",
      "Wake up, warrior! Your dreams are waiting for you to make them reality!",
      "Morning motivation coming right up! Let's make today absolutely legendary!",
      "Time to get up and show the world what you're made of!",
      "Another day, another chance to be awesome. Let's do this!",
    ]),
    audioUrl: generateUrl() + "/sample.mp3",
    duration: faker.number.int({ min: 2, max: 10 }), // seconds
    context: faker.helpers.arrayElement([
      "wake-up",
      "motivation",
      "reminder",
      "celebration",
    ]),
    emotion: faker.helpers.arrayElement([
      "excited",
      "calm",
      "determined",
      "playful",
    ]),
  }) as any;

const createTestVoiceFeatures = (): VoiceFeatures =>
  ({
    emotionalAdaptation: faker.datatype.boolean({ probability: 0.7 }),
    contextAwareness: faker.datatype.boolean({ probability: 0.6 }),
    personalizedMessages: faker.datatype.boolean({ probability: 0.8 }),
    multiLanguage: faker.datatype.boolean({ probability: 0.4 }),
    customizable: faker.datatype.boolean({ probability: 0.5 }),
    backgroundMusic: faker.datatype.boolean({ probability: 0.3 }),
    voiceEffects: faker.datatype.boolean({ probability: 0.4 }),
    realTimeGeneration: faker.datatype.boolean({ probability: 0.2 }),
  }) as any;

// ===============================
// CUSTOM SOUND FACTORIES
// ===============================

export interface CreateCustomSoundOptions {
  category?: SoundCategory;
  isCustom?: boolean;
  uploadedBy?: string;
}

export const _createTestCustomSound = (
  options: CreateCustomSoundOptions = {},
): CustomSound => {
  const {
    category = faker.helpers.arrayElement([
      "nature",
      "music",
      "voice",
      "mechanical",
      "ambient",
      "energetic",
      "calm",
      "custom",
    ]),
    isCustom = faker.datatype.boolean({ probability: 0.3 }),
    uploadedBy,
  } = options;

  const soundId = generateId("sound");
  const fileName = `${faker.system.fileName()}.mp3`;

  const soundNames = {
    nature: ["Forest Birds", "Ocean Waves", "Rain Storm", "Mountain Stream"],
    music: [
      "Piano Melody",
      "Guitar Strums",
      "Orchestral Rise",
      "Electronic Beat",
    ],
    voice: [
      "Gentle Wake Up",
      "Energy Boost",
      "Calm Reminder",
      "Motivational Call",
    ],
    mechanical: ["Chimes", "Bell Tower", "Wind Instruments", "Clock Ticking"],
    ambient: [
      "City Morning",
      "Cafe Atmosphere",
      "Library Quiet",
      "Garden Peace",
    ],
    energetic: ["Power Beat", "High Energy", "Motivation Mix", "Action Theme"],
    calm: ["Soft Melody", "Peaceful Sounds", "Relaxing Tones", "Quiet Time"],
    custom: ["User Upload 1", "Custom Sound", "Personal Mix", "My Creation"],
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
      [
        "relaxing",
        "energizing",
        "focus",
        "sleep",
        "meditation",
        "workout",
        "study",
      ],
      1,
      3,
    ),
    isCustom,
    uploadedBy: isCustom ? uploadedBy || generateId("user") : undefined,
    uploadedAt: isCustom ? generateTimestamp({ past: 90 }) : undefined,
    downloads: faker.number.int({ min: 0, max: 10000 }),
    rating: generateRating(),
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
  options: CreateAnalyticsOptions = {},
): PremiumAnalytics => {
  const {
    userId = generateId("user"),
    period = faker.helpers.arrayElement([
      "week",
      "month",
      "quarter",
      "year",
      "custom",
    ]),
    premium = true,
  } = options;

  return {
    userId,
    period,
    sleepInsights: createTestSleepInsights(),
    wakeUpPatterns: createTestWakeUpPatterns(),
    performanceMetrics: createTestPerformanceMetrics(),
    recommendations: Array.from(
      { length: faker.number.int({ min: 3, max: 8 }) },
      () => createTestAnalyticsRecommendation(),
    ),
    trends: Array.from({ length: faker.number.int({ min: 5, max: 15 }) }, () =>
      createTestAnalyticsTrend(),
    ),
    comparisons: createTestAnalyticsComparison(),
    goals: Array.from({ length: faker.number.int({ min: 2, max: 6 }) }, () =>
      createTestAnalyticsGoal(),
    ),
    achievements: Array.from(
      { length: faker.number.int({ min: 1, max: 10 }) },
      () => createTestAnalyticsAchievement(),
    ),
    exportOptions: premium ? createTestAnalyticsExportOptions() : [],
  };
};

const createTestSleepInsights = (): SleepInsights =>
  ({
    averageBedtime: faker.date.recent().toTimeString().slice(0, 5),
    averageWakeTime: faker.date.recent().toTimeString().slice(0, 5),
    averageSleepDuration: faker.number.float({
      min: 6.0,
      max: 10.0,
      multipleOf: 0.1,
    }),
    sleepEfficiency: faker.number.float({
      min: 0.7,
      max: 0.98,
      multipleOf: 0.01,
    }),
    consistencyScore: faker.number.int({ min: 60, max: 100 }),
    optimalBedtime: faker.date.recent().toTimeString().slice(0, 5),
    sleepDebt: faker.number.float({ min: -2.0, max: 2.0, multipleOf: 0.1 }),
    weekendShift: faker.number.float({ min: -2.0, max: 3.0, multipleOf: 0.1 }),
  }) as any;

const createTestWakeUpPatterns = (): WakeUpPatterns =>
  ({
    mostCommonWakeTime: faker.date.recent().toTimeString().slice(0, 5),
    wakeTimeVariability: faker.number.float({
      min: 0.1,
      max: 2.0,
      multipleOf: 0.1,
    }),
    snoozeFrequency: faker.number.float({
      min: 0.1,
      max: 0.8,
      multipleOf: 0.01,
    }),
    averageSnoozeCount: faker.number.float({
      min: 0.5,
      max: 4.0,
      multipleOf: 0.1,
    }),
    quickestWakeUp: faker.number.int({ min: 0, max: 60 }), // seconds
    longestSnoozeSession: faker.number.int({ min: 5, max: 120 }), // minutes
    weekdayVsWeekend: {
      weekdayAvg: faker.date.recent().toTimeString().slice(0, 5),
      weekendAvg: faker.date.recent().toTimeString().slice(0, 5),
      difference: faker.number.float({ min: -2.0, max: 4.0, multipleOf: 0.1 }),
    },
  }) as any;

const createTestPerformanceMetrics = (): PerformanceMetrics =>
  ({
    completionRate: faker.number.float({
      min: 0.6,
      max: 1.0,
      multipleOf: 0.01,
    }),
    averageResponseTime: faker.number.int({ min: 5, max: 300 }), // seconds
    streakRecord: faker.number.int({ min: 1, max: 100 }),
    currentStreak: faker.number.int({ min: 0, max: 50 }),
    improvementTrend: faker.number.float({
      min: -0.2,
      max: 0.3,
      multipleOf: 0.01,
    }),
    battlesWon: faker.number.int({ min: 0, max: 50 }),
    totalBattles: faker.number.int({ min: 1, max: 100 }),
    winRate: faker.number.float({ min: 0.1, max: 0.9, multipleOf: 0.01 }),
    experienceGained: faker.number.int({ min: 100, max: 10000 }),
  }) as any;

const createTestAnalyticsRecommendation = () => ({
  id: generateId("recommendation"),
  type: faker.helpers.arrayElement([
    "sleep",
    "wake_time",
    "difficulty",
    "routine",
    "health",
  ]),
  priority: faker.helpers.arrayElement(["low", "medium", "high", "urgent"]),
  title: faker.lorem.words(4),
  description: faker.lorem.sentence(),
  expectedImpact: faker.lorem.sentence(),
  timeToSeeResults: faker.helpers.arrayElement([
    "1-2 days",
    "1 week",
    "2-3 weeks",
    "1 month",
  ]),
  actionSteps: Array.from(
    { length: faker.number.int({ min: 2, max: 5 }) },
    () => faker.lorem.sentence(),
  ),
  basedOn: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
    faker.helpers.arrayElement([
      "sleep patterns",
      "wake times",
      "user behavior",
      "performance data",
    ]),
  ),
  confidence: faker.number.int({ min: 1, max: 10 }),
});

const createTestAnalyticsTrend = () => ({
  metric: faker.helpers.arrayElement([
    "wake-time",
    "sleep-duration",
    "consistency",
    "performance",
  ]),
  direction: faker.helpers.arrayElement(["improving", "declining", "stable"]),
  magnitude: faker.number.float({ min: 0.1, max: 2.0, multipleOf: 0.1 }),
  timeframe: faker.helpers.arrayElement(["week", "month", "quarter"]),
  prediction: faker.lorem.sentence(),
  factors: Array.from({ length: faker.number.int({ min: 2, max: 4 }) }, () =>
    faker.helpers.arrayElement([
      "schedule changes",
      "weather patterns",
      "stress levels",
      "weekend shifts",
    ]),
  ),
});

const createTestAnalyticsComparison = () => ({
  personalBest: {
    completionRate: faker.number.float({
      min: 0.8,
      max: 1.0,
      multipleOf: 0.01,
    }),
    avgWakeTime: faker.number.float({ min: 6.0, max: 9.0, multipleOf: 0.1 }),
    streakDays: faker.number.int({ min: 15, max: 100 }),
  },
  lastPeriod: {
    completionRate: faker.number.float({
      min: 0.5,
      max: 1.0,
      multipleOf: 0.01,
    }),
    avgWakeTime: faker.number.float({ min: 6.0, max: 10.0, multipleOf: 0.1 }),
    streakDays: faker.number.int({ min: 0, max: 30 }),
  },
  peerAverage: {
    completionRate: faker.number.float({
      min: 0.6,
      max: 0.85,
      multipleOf: 0.01,
    }),
    avgWakeTime: faker.number.float({ min: 6.5, max: 8.5, multipleOf: 0.1 }),
    streakDays: faker.number.int({ min: 5, max: 25 }),
  },
  globalAverage: {
    completionRate: faker.number.float({
      min: 0.55,
      max: 0.75,
      multipleOf: 0.01,
    }),
    avgWakeTime: faker.number.float({ min: 7.0, max: 8.0, multipleOf: 0.1 }),
    streakDays: faker.number.int({ min: 3, max: 15 }),
  },
  ranking: {
    overall: faker.number.int({ min: 10, max: 99 }),
    consistency: faker.number.int({ min: 10, max: 99 }),
    improvement: faker.number.int({ min: 10, max: 99 }),
    longevity: faker.number.int({ min: 10, max: 99 }),
  },
});

const createTestAnalyticsGoal = () => {
  const target = faker.number.int({ min: 10, max: 100 });
  const current = faker.number.int({ min: 0, max: target });
  return {
    id: generateId("goal"),
    type: faker.helpers.arrayElement([
      "consistency",
      "wake_time",
      "sleep_duration",
      "difficulty",
      "custom",
    ]),
    title: faker.lorem.words(3),
    target,
    current,
    progress: Math.round((current / target) * 100),
    deadline: generateTimestamp({ future: 30 }),
    reward: faker.datatype.boolean({ probability: 0.3 })
      ? faker.lorem.words(2)
      : undefined,
    status: faker.helpers.arrayElement([
      "active",
      "completed",
      "paused",
      "failed",
    ]),
  };
};

const createTestAnalyticsAchievement = () => ({
  id: generateId("achievement"),
  title: faker.helpers.arrayElement([
    "Early Bird",
    "Consistency King",
    "Battle Warrior",
    "Snooze Slayer",
    "Wake Up Champion",
    "Morning Motivation",
    "Streak Master",
  ]),
  description: faker.lorem.sentence(),
  unlockedAt: generateTimestamp({ past: 30 }),
  rarity: faker.helpers.arrayElement([
    "common",
    "uncommon",
    "rare",
    "epic",
    "legendary",
  ]),
  category: faker.helpers.arrayElement([
    "habits",
    "battles",
    "consistency",
    "achievement",
  ]),
  value: faker.number.int({ min: 50, max: 500 }),
});

const createTestAnalyticsExportOptions = () => [
  {
    format: "pdf" as const,
    title: "Detailed Sleep Report",
    description: "Comprehensive analysis with charts and insights",
    dataIncluded: [
      "sleep patterns",
      "wake times",
      "performance metrics",
      "trends",
    ],
    premium: true,
  },
  {
    format: "csv" as const,
    title: "Raw Data Export",
    description: "All your data in CSV format for analysis",
    dataIncluded: ["timestamps", "completion rates", "streaks", "raw metrics"],
    premium: false,
  },
  {
    format: "json" as const,
    title: "API Data Export",
    description: "Machine-readable format for integrations",
    dataIncluded: ["structured data", "metadata", "relationships", "analytics"],
    premium: true,
  },
];
