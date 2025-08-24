/**
 * Core Entity Factories
 *
 * Factory functions for generating core application entities:
 * - User (with various tiers and states)
 * - Alarm (with realistic patterns)
 * - Battle (with different types and statuses)
 * - Theme (with various categories and styles)
 */

import { faker } from '@faker-js/faker';
import type {
  User,
  UserStats,
  UserPreferences,
  Alarm,
  AlarmInstance,
  AlarmEvent,
  Battle,
  BattleParticipant,
  BattleParticipantStats,
  BattleSettings,
  ThemeConfig,
  ThemeColors,
  VoiceMood,
  AlarmDifficulty,
  BattleType,
  BattleStatus,
  ThemeCategory,
  DayOfWeek,
  PersonalizationSettings,
  PremiumFeatureAccess,
  Theme,
  SmartAlarmSettings,
} from '../../types';
import type { Subscription } from '../../types/premium';
import {
  generateId,
  generateTimestamp,
  generateTimeString,
  generateRealisticAlarmTime,
  generateRealisticAlarmDays,
  generateUsername,
  generateExperience,
  generateRating,
  generateHexColor,
  weightedRandom,
  randomSubset,
  COMMON_DATA,
} from './factory-utils';

// ===============================
// HELPER FACTORIES FOR TYPED OBJECTS
// ===============================

const createTestSubscription = (
  tier: Subscription['tier'] = 'premium'
): Subscription => {
  // Map main app tier to premium module tier
  const premiumTier = tier;

  return {
    id: generateId('sub'),
    userId: generateId('user'),
    stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
    stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
    tier: premiumTier,
    status: faker.helpers.arrayElement(['active', 'canceled', 'past_due', 'trialing']),
    billingInterval: faker.helpers.arrayElement(['month', 'year']),
    amount: tier === 'free' ? 0 : faker.number.int({ min: 999, max: 9999 }),
    currency: 'usd',
    currentPeriodStart: faker.date.recent({ days: 30 }),
    currentPeriodEnd: faker.date.soon({ days: 30 }),
    trialStart: faker.date.past({ years: 1 }),
    trialEnd: faker.date.recent({ days: 14 }),
    cancelAtPeriodEnd: false,
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent({ days: 7 }),
  };
};

const createTestPremiumFeatureAccess = (
  tier: Subscription['tier'] = 'premium'
): PremiumFeatureAccess => ({
  // Voice Features
  elevenlabsVoices: tier !== 'free',
  customVoiceMessages: tier !== 'free',
  voiceCloning: tier === 'pro' || tier === 'ultimate' || tier === 'lifetime',
  premiumPersonalities: tier !== 'free',

  // AI Features
  advancedAIInsights: tier !== 'free',
  personalizedChallenges: tier !== 'free',
  smartRecommendations: tier !== 'free',
  behaviorAnalysis:
    tier === 'premium' || tier === 'pro' || tier === 'ultimate' || tier === 'lifetime',

  // Customization
  premiumThemes: tier !== 'free',
  customSounds: tier !== 'free',
  advancedPersonalization: tier !== 'free',
  unlimitedCustomization: tier === 'pro' || tier === 'ultimate' || tier === 'lifetime',

  // Scheduling
  advancedScheduling: tier !== 'free',
  smartScheduling: tier !== 'free',
  locationBasedAlarms:
    tier === 'premium' || tier === 'pro' || tier === 'ultimate' || tier === 'lifetime',
  weatherIntegration: tier !== 'free',

  // Battle System
  exclusiveBattleModes: tier !== 'free',
  customBattleRules:
    tier === 'premium' || tier === 'pro' || tier === 'ultimate' || tier === 'lifetime',
  advancedStats: tier !== 'free',
  leaderboardFeatures: tier !== 'free',
  nuclearMode: tier === 'pro' || tier === 'ultimate' || tier === 'lifetime',

  // Content
  premiumSoundLibrary: tier !== 'free',
  exclusiveContent: tier !== 'free',
  adFree: tier !== 'free',
  prioritySupport:
    tier === 'premium' || tier === 'pro' || tier === 'ultimate' || tier === 'lifetime',
});

const createTestPersonalizationSettings = (): PersonalizationSettings => ({
  theme: faker.helpers.arrayElement(['light', 'dark', 'auto', 'system']),
  customTheme: undefined,
  colorPreferences: {
    favoriteColors: [faker.color.rgb(), faker.color.rgb()],
    avoidColors: [faker.color.rgb()],
    colorblindFriendly: faker.datatype.boolean({ probability: 0.2 }),
    highContrastMode: faker.datatype.boolean({ probability: 0.15 }),
    customAccentColor: faker.color.rgb(),
    saturationLevel: faker.number.int({ min: 0, max: 100 }),
    brightnessLevel: faker.number.int({ min: 0, max: 100 }),
    warmthLevel: faker.number.int({ min: 0, max: 100 }),
  },
  typographyPreferences: {
    preferredFontSize: faker.helpers.arrayElement([
      'small',
      'medium',
      'large',
      'extra-large',
    ]),
    fontSizeScale: faker.number.float({ min: 0.8, max: 1.5, multipleOf: 0.1 }),
    preferredFontFamily: faker.helpers.arrayElement([
      'system',
      'serif',
      'sans-serif',
      'monospace',
    ]),
    customFontFamily: undefined,
    lineHeightPreference: faker.helpers.arrayElement([
      'compact',
      'comfortable',
      'relaxed',
    ]),
    letterSpacingPreference: faker.helpers.arrayElement(['tight', 'normal', 'wide']),
    fontWeight: faker.helpers.arrayElement(['light', 'normal', 'medium', 'bold']),
    dyslexiaFriendly: faker.datatype.boolean({ probability: 0.1 }),
  },
  motionPreferences: {
    enableAnimations: faker.datatype.boolean({ probability: 0.8 }),
    animationSpeed: faker.helpers.arrayElement(['slow', 'normal', 'fast']),
    reduceMotion: faker.datatype.boolean({ probability: 0.2 }),
    preferCrossfade: faker.datatype.boolean({ probability: 0.6 }),
    enableParallax: faker.datatype.boolean({ probability: 0.7 }),
    enableHoverEffects: faker.datatype.boolean({ probability: 0.9 }),
    enableFocusAnimations: faker.datatype.boolean({ probability: 0.8 }),
  },
  soundPreferences: {
    enableSounds: faker.datatype.boolean({ probability: 0.9 }),
    soundVolume: faker.number.int({ min: 0, max: 100 }),
    soundTheme: faker.helpers.arrayElement([
      'default',
      'nature',
      'electronic',
      'minimal',
    ]),
    customSounds: {},
    muteOnFocus: faker.datatype.boolean({ probability: 0.3 }),
    hapticFeedback: faker.datatype.boolean({ probability: 0.7 }),
    spatialAudio: faker.datatype.boolean({ probability: 0.4 }),
  },
  layoutPreferences: {
    density: faker.helpers.arrayElement(['compact', 'comfortable', 'spacious']),
    navigation: faker.helpers.arrayElement(['bottom', 'side', 'top']),
    cardStyle: faker.helpers.arrayElement(['flat', 'elevated', 'outlined']),
    borderRadius: faker.helpers.arrayElement(['sharp', 'rounded', 'circular']),
    showLabels: faker.datatype.boolean({ probability: 0.8 }),
    showIcons: faker.datatype.boolean({ probability: 0.9 }),
    iconSize: faker.helpers.arrayElement(['small', 'medium', 'large']),
    gridColumns: faker.number.int({ min: 2, max: 4 }),
    listSpacing: faker.helpers.arrayElement(['tight', 'normal', 'loose']),
  },
  accessibilityPreferences: {
    screenReaderOptimized: faker.datatype.boolean({ probability: 0.1 }),
    keyboardNavigationOnly: faker.datatype.boolean({ probability: 0.2 }),
    highContrastMode: faker.datatype.boolean({ probability: 0.15 }),
    largeTargets: faker.datatype.boolean({ probability: 0.3 }),
    reducedTransparency: faker.datatype.boolean({ probability: 0.2 }),
    boldText: faker.datatype.boolean({ probability: 0.2 }),
    underlineLinks: faker.datatype.boolean({ probability: 0.1 }),
    flashingElementsReduced: faker.datatype.boolean({ probability: 0.3 }),
    colorOnlyIndicators: faker.datatype.boolean({ probability: 0.8 }),
    focusIndicatorStyle: faker.helpers.arrayElement(['outline', 'highlight', 'glow']),
  },
  lastUpdated: faker.date.recent({ days: 30 }),
  syncAcrossDevices: faker.datatype.boolean({ probability: 0.6 }),
});

// Note: ThemeConfig helper removed as we now use simple Theme type directly

const createTestSmartAlarmSettings = (): SmartAlarmSettings => ({
  weatherEnabled: faker.datatype.boolean({ probability: 0.4 }),
  locationEnabled: faker.datatype.boolean({ probability: 0.3 }),
  fitnessEnabled: faker.datatype.boolean({ probability: 0.5 }),
  smartWakeWindow: faker.number.int({ min: 5, max: 30 }),
  adaptiveDifficulty: faker.datatype.boolean({ probability: 0.6 }),
  contextualTasks: faker.datatype.boolean({ probability: 0.7 }),
  environmentalAdjustments: faker.datatype.boolean({ probability: 0.5 }),
});

const createTestBattleParticipantStats = (): BattleParticipantStats => ({
  wakeTime: generateRealisticAlarmTime(),
  tasksCompleted: faker.number.int({ min: 0, max: 10 }),
  snoozeCount: faker.number.int({ min: 0, max: 5 }),
  score: faker.number.int({ min: 0, max: 1000 }),
});

// ===============================
// USER FACTORIES
// ===============================

export interface CreateUserOptions {
  isActive?: boolean;
  hasStats?: boolean;
  level?: number;
  premium?: boolean;
}

export const _createTestUser = <T extends CreateUserOptions = CreateUserOptions>(
  options: T = {} as T
): User => {
  const {
    tier = faker.helpers.arrayElement(COMMON_DATA.subscriptionTiers),
    isActive = true,
    hasStats = true,
    level,
    premium = tier !== 'free',
  } = options;

  const userId = generateId('user');
  const joinDate = generateTimestamp({ past: 365 });
  const experience = level
    ? level * 100 + faker.number.int({ min: 0, max: 99 })
    : generateExperience();
  const actualLevel = level || Math.floor(experience / 100);

  return {
    id: userId,
    email: faker.internet.email(),
    name: faker.person.fullName(),
    username: generateUsername(),
    displayName: faker.person.firstName(),
    avatar: faker.image.avatar(),
    level: actualLevel,
    experience,
    joinDate,
    lastActive: isActive
      ? generateTimestamp({ past: 1 })
      : generateTimestamp({ past: 30 }),
    preferences: createTestUserPreferences({ premium }),
    settings: createTestUserSettings(),
    stats: hasStats ? createTestUserStats() : undefined,
    subscriptionTier: tier,
    subscriptionStatus:
      tier === 'free'
        ? undefined
        : faker.helpers.arrayElement(COMMON_DATA.subscriptionStatuses),
    createdAt: joinDate,
    subscription:
      tier !== 'free'
        ? ({
            id: generateId('sub'),
            userId,
            tier,
            status: faker.helpers.arrayElement(['active', 'trialing']) as any,
            billingInterval: faker.helpers.arrayElement(['month', 'year']) as any,
            amount: tier === 'premium' ? 999 : tier === 'ultimate' ? 1999 : 499,
            currency: 'usd',
            currentPeriodStart: new Date(),
            currentPeriodEnd: faker.date.future(),
            cancelAtPeriodEnd: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Subscription)
        : undefined,
    stripeCustomerId:
      tier !== 'free' ? `cus_${faker.string.alphanumeric(14)}` : undefined,
    trialEndsAt: tier === 'free' ? undefined : faker.date.soon({ days: 14 }),
    premiumFeatures: premium
      ? randomSubset([
          'voice-personalities',
          'advanced-analytics',
          'custom-themes',
          'battle-premium',
        ])
      : [],
    featureAccess: premium
      ? ({
          voicePersonalities: true,
          advancedAnalytics: true,
          customThemes: true,
          battlePremium: true,
          prioritySupport: tier === 'premium' || tier === 'pro',
          apiAccess: tier === 'pro' || tier === 'enterprise',
        } as any)
      : undefined,
    usage: premium ? createTestPremiumUsage() : undefined,
  };
};

export const _createTestUserStats = (): UserStats => ({
  totalBattles: faker.number.int({ min: 0, max: 100 }),
  wins: faker.number.int({ min: 0, max: 50 }),
  losses: faker.number.int({ min: 0, max: 50 }),
  winRate: faker.number.float({ min: 0.1, max: 0.9, multipleOf: 0.01 }),
  currentStreak: faker.number.int({ min: 0, max: 30 }),
  longestStreak: faker.number.int({ min: 0, max: 100 }),
  averageWakeTime: generateRealisticAlarmTime(),
  totalAlarmsSet: faker.number.int({ min: 1, max: 500 }),
  alarmsCompleted: faker.number.int({ min: 1, max: 450 }),
  snoozeCount: faker.number.int({ min: 0, max: 100 }),
});

export const _createTestUserPreferences = (
  options: { premium?: boolean } = {}
): UserPreferences => {
  const { premium = false } = options;

  return {
    personalization: {
      theme: faker.helpers.arrayElement(['light', 'dark', 'auto', 'system']),
      language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de', 'ja', 'hi']),
      timezone: faker.location.timeZone(),
    } as any,
    notificationsEnabled: faker.datatype.boolean({ probability: 0.8 }),
    soundEnabled: faker.datatype.boolean({ probability: 0.9 }),
    voiceDismissalSensitivity: faker.number.int({ min: 1, max: 10 }),
    defaultVoiceMood: faker.helpers.arrayElement(
      premium ? [...COMMON_DATA.voiceMoods] : COMMON_DATA.voiceMoods.slice(0, 6) // Free tier only
    ) as VoiceMood,
    hapticFeedback: faker.datatype.boolean({ probability: 0.7 }),
    snoozeMinutes: faker.helpers.arrayElement([5, 9, 10, 15]),
    maxSnoozes: faker.number.int({ min: 1, max: 5 }),
    rewardsEnabled: faker.datatype.boolean({ probability: 0.85 }),
    aiInsightsEnabled: premium && faker.datatype.boolean({ probability: 0.6 }),
    personalizedMessagesEnabled: faker.datatype.boolean({ probability: 0.75 }),
    shareAchievements: faker.datatype.boolean({ probability: 0.5 }),
    battleNotifications: faker.datatype.boolean({ probability: 0.8 }),
    friendRequests: faker.datatype.boolean({ probability: 0.9 }),
    trashTalkEnabled: faker.datatype.boolean({ probability: 0.3 }),
    autoJoinBattles: faker.datatype.boolean({ probability: 0.2 }),
    smartFeaturesEnabled: premium && faker.datatype.boolean({ probability: 0.8 }),
    fitnessIntegration: premium && faker.datatype.boolean({ probability: 0.4 }),
    locationChallenges: faker.datatype.boolean({ probability: 0.6 }),
    photoChallenges: faker.datatype.boolean({ probability: 0.5 }),
    theme: faker.helpers.arrayElement(['light', 'dark', 'auto', 'system']),
    gameTheme: { id: generateId('theme') } as any,
  };
};

const createTestUserSettings = () => ({
  notifications: {
    push: true,
    email: faker.datatype.boolean({ probability: 0.6 }),
    sms: faker.datatype.boolean({ probability: 0.3 }),
  },
  privacy: {
    profileVisible: faker.datatype.boolean({ probability: 0.8 }),
    statsVisible: faker.datatype.boolean({ probability: 0.7 }),
    allowFriendRequests: faker.datatype.boolean({ probability: 0.9 }),
  },
  theme: {
    mode: faker.helpers.arrayElement(['light', 'dark', 'system']),
    primaryColor: faker.internet.color(),
  },
  alarm: {
    defaultVolume: faker.number.float({ min: 0.5, max: 1.0 }),
    snoozeTime: faker.number.int({ min: 5, max: 15 }),
  },
});

const createTestPremiumUsage = () => ({
  voicePersonalitiesUsed: faker.number.int({ min: 0, max: 10 }),
  customThemesCreated: faker.number.int({ min: 0, max: 5 }),
  advancedReportsGenerated: faker.number.int({ min: 0, max: 20 }),
  apiCallsUsed: faker.number.int({ min: 0, max: 1000 }),
  monthlyLimit: faker.number.int({ min: 1000, max: 10000 }),
});

// ===============================
// ALARM FACTORIES
// ===============================

export interface CreateAlarmOptions {
  userId?: string;
  enabled?: boolean;
  difficulty?: AlarmDifficulty;
  premium?: boolean;
  battleId?: string;
}

export const _createTestAlarm = <T extends CreateAlarmOptions = CreateAlarmOptions>(
  options: T = {} as T
): Alarm => {
  const {
    userId = generateId('user'),
    enabled = faker.datatype.boolean({ probability: 0.8 }),
    difficulty,
    premium = false,
    battleId,
  } = options;

  const alarmId = generateId('alarm');
  const days = generateRealisticAlarmDays();
  const time = generateRealisticAlarmTime();
  const alarmDifficulty =
    difficulty ||
    (faker.helpers.arrayElement(COMMON_DATA.alarmDifficulties) as AlarmDifficulty);

  return {
    id: alarmId,
    userId,
    time,
    label: faker.helpers.arrayElement([
      'Morning Workout',
      'Work Start',
      'Meeting Reminder',
      'Wake Up Call',
      'School Time',
      'Gym Session',
      'Study Time',
      'Daily Standup',
    ]),
    title: faker.lorem.words(2),
    description: faker.lorem.sentence(),
    enabled,
    isActive: enabled && faker.datatype.boolean({ probability: 0.9 }),
    days,
    dayNames: days.map(
      day =>
        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
          day
        ]
    ) as any,
    recurringDays: days.map(
      day =>
        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
          day
        ]
    ) as any,
    voiceMood: faker.helpers.arrayElement(
      premium ? [...COMMON_DATA.voiceMoods] : COMMON_DATA.voiceMoods.slice(0, 6) // Free tier only
    ) as VoiceMood,
    sound: faker.helpers.arrayElement([
      'classic-bell',
      'nature-birds',
      'electronic-beep',
      'acoustic-guitar',
      'ocean-waves',
      'rainfall',
      'upbeat-tune',
    ]),
    soundType: faker.helpers.arrayElement(['built-in', 'custom', 'voice-only']),
    customSoundId: faker.datatype.boolean({ probability: 0.3 })
      ? generateId('sound')
      : undefined,
    difficulty: alarmDifficulty,
    snoozeEnabled: faker.datatype.boolean({ probability: 0.8 }),
    snoozeInterval: faker.helpers.arrayElement([5, 9, 10, 15]),
    snoozeCount: faker.number.int({ min: 0, max: 3 }),
    maxSnoozes: faker.number.int({ min: 1, max: 5 }),
    lastTriggered: faker.datatype.boolean({ probability: 0.6 })
      ? faker.date.recent({ days: 7 })
      : undefined,
    createdAt: generateTimestamp({ past: 30 }),
    updatedAt: generateTimestamp({ past: 7 }),
    battleId,
    weatherEnabled: premium && faker.datatype.boolean({ probability: 0.4 }),
    smartFeatures: premium
      ? ({
          adaptiveVolume: faker.datatype.boolean({ probability: 0.7 }),
          sleepCycleDetection: faker.datatype.boolean({ probability: 0.5 }),
          contextualMessages: faker.datatype.boolean({ probability: 0.8 }),
        } as any)
      : undefined,
  };
};

export const _createTestAlarmInstance = (alarmId: string): AlarmInstance => ({
  id: generateId('instance'),
  alarmId,
  scheduledTime: generateTimestamp({ future: 1 }),
  actualWakeTime: faker.datatype.boolean({ probability: 0.7 })
    ? generateTimestamp()
    : undefined,
  status: faker.helpers.arrayElement([
    'pending',
    'snoozed',
    'dismissed',
    'completed',
    'missed',
  ]),
  snoozeCount: faker.number.int({ min: 0, max: 3 }),
  battleId: faker.datatype.boolean({ probability: 0.3 })
    ? generateId('battle')
    : undefined,
});

export const _createTestAlarmEvent = (alarmId: string): AlarmEvent => ({
  id: generateId('event'),
  alarmId,
  firedAt: faker.date.recent({ days: 7 }),
  dismissed: faker.datatype.boolean({ probability: 0.8 }),
  snoozed: faker.datatype.boolean({ probability: 0.4 }),
  userAction: faker.helpers.arrayElement(['dismissed', 'snoozed', 'ignored']),
  dismissMethod: faker.helpers.arrayElement(['voice', 'button', 'shake']),
});

// ===============================
// BATTLE FACTORIES
// ===============================

export interface CreateBattleOptions {
  type?: BattleType;
  status?: BattleStatus;
  participantCount?: number;
  creatorId?: string;
  premium?: boolean;
}

export const _createTestBattle = (options: CreateBattleOptions = {}): Battle => {
  const {
    type = faker.helpers.arrayElement(COMMON_DATA.battleTypes) as BattleType,
    status = faker.helpers.arrayElement(COMMON_DATA.battleStatuses) as BattleStatus,
    participantCount = faker.number.int({ min: 2, max: 10 }),
    creatorId = generateId('user'),
    premium = false,
  } = options;

  const battleId = generateId('battle');
  const startTime = generateTimestamp({ future: 1 });
  const endTime = generateTimestamp({ future: 7 });

  // Generate participants
  const participants: BattleParticipant[] = [];
  for (let i = 0; i < participantCount; i++) {
    participants.push(createTestBattleParticipant());
  }

  return {
    id: battleId,
    type,
    participants,
    creatorId,
    status,
    startTime,
    endTime,
    settings: createTestBattleSettings({ type, premium }),
    winner:
      status === 'completed'
        ? faker.helpers.arrayElement(participants).userId
        : undefined,
    createdAt: generateTimestamp({ past: 7 }),
    tournamentId: type === 'tournament' ? generateId('tournament') : undefined,
    teamId: type === 'team' ? generateId('team') : undefined,
    seasonId: faker.datatype.boolean({ probability: 0.3 })
      ? generateId('season')
      : undefined,
    maxParticipants: Math.max(
      participantCount,
      faker.number.int({ min: participantCount, max: 50 })
    ),
    minParticipants: Math.min(
      participantCount,
      faker.number.int({ min: 2, max: Math.max(2, participantCount) })
    ),
    entryFee: premium ? faker.number.int({ min: 10, max: 100 }) : 0,
    prizePool: createTestBattlePrize({ premium }),
  };
};

export const _createTestBattleParticipant = (userId?: string): BattleParticipant => {
  const participantUserId = userId || generateId('user');

  return {
    userId: participantUserId,
    user: createTestUser(),
    joinedAt: generateTimestamp({ past: 7 }),
    progress: faker.number.int({ min: 0, max: 100 }),
    completedAt: faker.datatype.boolean({ probability: 0.6 })
      ? generateTimestamp()
      : undefined,
    stats: {
      wakeUpTime: generateRealisticAlarmTime(),
      completionTime: faker.number.int({ min: 1, max: 300 }), // seconds
      accuracy: faker.number.float({ min: 0.5, max: 1.0, multipleOf: 0.01 }),
      streakDays: faker.number.int({ min: 0, max: 30 }),
      bonusPoints: faker.number.int({ min: 0, max: 500 }),
    } as any,
  };
};

const createTestBattleSettings = (options: {
  type: BattleType;
  premium: boolean;
}): BattleSettings => {
  const { type, premium } = options;

  return {
    duration: faker.number.int({ min: 1, max: 30 }), // days
    allowLateJoin: faker.datatype.boolean({ probability: 0.6 }),
    publicVisible: faker.datatype.boolean({ probability: 0.8 }),
    autoStart: faker.datatype.boolean({ probability: 0.7 }),
    requireVerification: premium && faker.datatype.boolean({ probability: 0.4 }),
    trashTalkEnabled: faker.datatype.boolean({ probability: 0.3 }),
    penalties: {
      lateWakeUp: faker.number.int({ min: 5, max: 50 }),
      missedDay: faker.number.int({ min: 10, max: 100 }),
      snoozeOveruse: faker.number.int({ min: 1, max: 10 }),
    },
    rewards: {
      dailyCompletion: faker.number.int({ min: 10, max: 100 }),
      perfectWeek: faker.number.int({ min: 50, max: 500 }),
      battleWin: faker.number.int({ min: 100, max: 1000 }),
    },
    rules:
      type === 'speed'
        ? {
            targetTime: generateRealisticAlarmTime(),
            allowanceWindow: faker.number.int({ min: 5, max: 30 }), // minutes
          }
        : type === 'consistency'
          ? {
              requiredDays: faker.number.int({ min: 5, max: 30 }),
              allowedMisses: faker.number.int({ min: 0, max: 3 }),
            }
          : {},
  } as any;
};

const createTestBattlePrize = (options: { premium: boolean }) => {
  const { premium } = options;

  return {
    xp: faker.number.int({ min: 100, max: 1000 }),
    badges: randomSubset(['early-bird', 'consistent', 'warrior', 'champion'], 1, 2),
    premiumDays: premium ? faker.number.int({ min: 1, max: 30 }) : 0,
    customization: premium ? randomSubset(['theme', 'voice', 'sound'], 0, 2) : [],
  } as any;
};

// ===============================
// THEME FACTORIES
// ===============================

export interface CreateThemeOptions {
  category?: ThemeCategory;
  isPremium?: boolean;
  isCustom?: boolean;
  createdBy?: string;
}

export const _createTestTheme = (options: CreateThemeOptions = {}): ThemeConfig => {
  const {
    category = faker.helpers.arrayElement(COMMON_DATA.themeCategories) as ThemeCategory,
    isPremium = faker.datatype.boolean({ probability: 0.3 }),
    isCustom = faker.datatype.boolean({ probability: 0.2 }),
    createdBy,
  } = options;

  const themeId = generateId('theme');
  const name = faker.helpers.arrayElement([
    'Ocean Breeze',
    'Forest Dawn',
    'Sunset Glow',
    'Midnight Blue',
    'Cherry Blossom',
    'Arctic White',
    'Volcanic Red',
    'Cosmic Purple',
    'Golden Hour',
    'Deep Space',
    'Emerald Dream',
    'Rose Gold',
  ]);

  return {
    id: themeId,
    name: name.toLowerCase().replace(/\s+/g, '-'),
    displayName: name,
    description: faker.lorem.sentence(),
    category,
    colors: createTestThemeColors(),
    typography: createTestThemeTypography(),
    spacing: createTestThemeSpacing(),
    animations: createTestThemeAnimations(),
    effects: createTestThemeEffects(),
    accessibility: createTestThemeAccessibility(),
    previewImage: faker.image.url({ width: 400, height: 300 }),
    isCustom,
    isPremium,
    createdBy: isCustom ? createdBy || generateId('user') : undefined,
    createdAt: generateTimestamp({ past: 365 }),
    popularity: generateRating() * 20, // 0-100
    rating: generateRating(),
  };
};

const createTestThemeColors = (): ThemeColors => ({
  primary: createTestColorPalette(),
  secondary: createTestColorPalette(),
  accent: createTestColorPalette(),
  neutral: createTestColorPalette(),
  success: createTestColorPalette('#22c55e'),
  warning: createTestColorPalette('#f59e0b'),
  error: createTestColorPalette('#ef4444'),
  info: createTestColorPalette('#3b82f6'),
  background: {
    primary: generateHexColor(),
    secondary: generateHexColor(),
    tertiary: generateHexColor(),
    overlay: 'rgba(0, 0, 0, 0.5)',
    modal: generateHexColor(),
    card: generateHexColor(),
  },
  text: {
    primary: generateHexColor(),
    secondary: generateHexColor(),
    tertiary: generateHexColor(),
    inverse: generateHexColor(),
    disabled: generateHexColor(),
    link: generateHexColor(),
  },
  border: {
    primary: generateHexColor(),
    secondary: generateHexColor(),
    focus: generateHexColor(),
    hover: generateHexColor(),
    active: generateHexColor(),
  },
  surface: {
    elevated: generateHexColor(),
    depressed: generateHexColor(),
    interactive: generateHexColor(),
    disabled: generateHexColor(),
  },
});

const createTestColorPalette = (baseColor?: string) => ({
  50: baseColor || generateHexColor(),
  100: generateHexColor(),
  200: generateHexColor(),
  300: generateHexColor(),
  400: generateHexColor(),
  500: baseColor || generateHexColor(),
  600: generateHexColor(),
  700: generateHexColor(),
  800: generateHexColor(),
  900: generateHexColor(),
});

const createTestThemeTypography = () => ({
  fontFamily: {
    primary: faker.helpers.arrayElement(['Inter', 'Roboto', 'Open Sans', 'Lato']),
    secondary: faker.helpers.arrayElement(['Poppins', 'Montserrat', 'Source Sans Pro']),
    mono: faker.helpers.arrayElement(['Monaco', 'Consolas', 'Source Code Pro']),
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
});

const createTestThemeSpacing = () => ({
  scale: faker.helpers.arrayElement([4, 8]),
  sizes: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
});

const createTestThemeAnimations = () => ({
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
  },
});

const createTestThemeEffects = () => ({
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.15)',
  },
  blur: {
    sm: '4px',
    md: '8px',
    lg: '16px',
  },
  brightness: {
    hover: '1.05',
    active: '0.95',
  },
});

const createTestThemeAccessibility = () => ({
  focusVisible: true,
  reducedTransparency: faker.datatype.boolean({ probability: 0.15 }),
});

// ===============================
// ENHANCED PARTIAL OVERRIDE FACTORIES
// ===============================

/**
 * Enhanced User factory with full Partial<User> override support
 * Provides maximum flexibility for test scenarios
 *
 * @example
 * const user = createFlexibleUser({ email: 'test@example.com', level: 10 });
 * const premiumUser = createFlexibleUser({ subscriptionTier: 'premium' });
 */
export const _createFlexibleUser = (overrides: Partial<User> = {}): User => {
  const base = createTestUser();
  return { ...base, ...overrides };
};

/**
 * Enhanced Alarm factory with Partial<Alarm> override support
 * Perfect for testing specific alarm configurations
 *
 * @example
 * const alarm = createFlexibleAlarm({ enabled: false, time: '06:00' });
 * const weekendAlarm = createFlexibleAlarm({ days: ['saturday', 'sunday'] });
 */
export const _createFlexibleAlarm = (overrides: Partial<Alarm> = {}): Alarm => {
  const base = createTestAlarm();
  return { ...base, ...overrides };
};

/**
 * Enhanced Battle factory with Partial<Battle> override support
 * Ideal for testing various battle states and configurations
 *
 * @example
 * const activeBattle = createFlexibleBattle({ status: 'active' });
 * const tournamentBattle = createFlexibleBattle({ type: 'tournament' });
 */
export const _createFlexibleBattle = (overrides: Partial<Battle> = {}): Battle => {
  const base = createTestBattle();
  return { ...base, ...overrides };
};

/**
 * Enhanced Theme factory with Partial<ThemeConfig> override support
 * Useful for testing theme variations and customizations
 *
 * @example
 * const darkTheme = createFlexibleTheme({ category: 'dark' });
 * const customTheme = createFlexibleTheme({ name: 'MyTheme', isPremium: true });
 */
export const _createFlexibleTheme = (
  overrides: Partial<ThemeConfig> = {}
): ThemeConfig => {
  const base = createTestTheme();
  return { ...base, ...overrides };
};

/**
 * Batch factory creator for generating multiple test entities with variations
 * Efficient for testing collections and bulk operations
 *
 * @example
 * const users = createBatch(createFlexibleUser, 5, [
 *   { email: 'user1@test.com' },
 *   { email: 'user2@test.com' },
 *   { level: 10 },
 *   { subscriptionTier: 'premium' },
 *   {} // Use defaults
 * ]);
 */
export function _createBatch<T>(
  factory: (overrides?: Partial<T>) => T,
  count: number,
  overridesList: Partial<T>[] = []
): T[] {
  return Array.from({ length: count }, (_, i) => factory(overridesList[i] || {}));
}

// Convenience exports for common test scenarios
export const _createMinimalUser = () =>
  createFlexibleUser({
    stats: undefined,
    settings: undefined,
    subscription: undefined,
  });

export const _createPremiumUser = () =>
  createFlexibleUser({
    subscriptionTier: 'premium',
    featureAccess: createTestPremiumFeatureAccess('premium'),
    usage: createTestPremiumUsage(),
  });

export const _createActiveAlarm = () =>
  createFlexibleAlarm({
    enabled: true,
    nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  });

export const _createCompletedBattle = () =>
  createFlexibleBattle({
    status: 'completed',
    endTime: new Date(),
    winner: generateId('user'),
  });
