/**
 * Core Entity Factories
 *
 * Factory functions for generating core application entities:
 * - User (with various tiers and states)
 * - Alarm (with realistic patterns)
 * - Battle (with different types and statuses)
 * - Theme (with various categories and styles)
 */

import { faker } from "@faker-js/faker";
import type { DeepPartial, UserId, AlarmId, BattleId, ThemeId, FactoryOptions } from '../../types/utils';
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
  SubscriptionTier,
  BattleType,
  BattleStatus,
  ThemeCategory,
  DayOfWeek,
  PersonalizationSettings,
  PremiumFeatureAccess,
  Theme,
  SmartAlarmSettings,
} from "../../types";
import type {
  Subscription,
  SubscriptionTier as PremiumSubscriptionTier,
} from "../../types/premium";
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
} from "./factory-utils";

// ===============================
// HELPER FACTORIES FOR TYPED OBJECTS
// ===============================

const createTestSubscription = (tier: SubscriptionTier): Subscription => {
  // Map main app tier to premium module tier
  const premiumTier: PremiumSubscriptionTier =
    tier === "lifetime" ? "enterprise" : (tier as PremiumSubscriptionTier);

  return {
    id: generateId("sub"),
    userId: generateId("user"),
    stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
    stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
    tier: premiumTier,
    status: faker.helpers.arrayElement([
      "active",
      "canceled",
      "past_due",
      "trialing",
    ]),
    billingInterval: faker.helpers.arrayElement(["month", "year"]),
    amount: tier === "free" ? 0 : faker.number.int({ min: 999, max: 9999 }),
    currency: "usd",
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
  tier: SubscriptionTier,
): PremiumFeatureAccess => ({
  // Voice Features
  elevenlabsVoices: tier !== "free",
  customVoiceMessages: tier !== "free",
  voiceCloning: tier === "pro" || tier === "ultimate" || tier === "lifetime",
  premiumPersonalities: tier !== "free",

  // AI Features
  advancedAIInsights: tier !== "free",
  personalizedChallenges: tier !== "free",
  smartRecommendations: tier !== "free",
  behaviorAnalysis:
    tier === "premium" ||
    tier === "pro" ||
    tier === "ultimate" ||
    tier === "lifetime",

  // Customization
  premiumThemes: tier !== "free",
  customSounds: tier !== "free",
  advancedPersonalization: tier !== "free",
  unlimitedCustomization:
    tier === "pro" || tier === "ultimate" || tier === "lifetime",

  // Scheduling
  advancedScheduling: tier !== "free",
  smartScheduling: tier !== "free",
  locationBasedAlarms:
    tier === "premium" ||
    tier === "pro" ||
    tier === "ultimate" ||
    tier === "lifetime",
  weatherIntegration: tier !== "free",

  // Battle System
  exclusiveBattleModes: tier !== "free",
  customBattleRules:
    tier === "premium" ||
    tier === "pro" ||
    tier === "ultimate" ||
    tier === "lifetime",
  advancedStats: tier !== "free",
  leaderboardFeatures: tier !== "free",
  nuclearMode: tier === "pro" || tier === "ultimate" || tier === "lifetime",

  // Content
  premiumSoundLibrary: tier !== "free",
  exclusiveContent: tier !== "free",
  adFree: tier !== "free",
  prioritySupport:
    tier === "premium" ||
    tier === "pro" ||
    tier === "ultimate" ||
    tier === "lifetime",
});

const createTestPersonalizationSettings = (): PersonalizationSettings => ({
  theme: faker.helpers.arrayElement(["light", "dark", "auto", "system"]),
  customTheme: undefined,
  colorPreferences: {
    favoriteColors: [faker.color.hex(), faker.color.hex()],
    avoidColors: [faker.color.hex()],
    colorblindFriendly: faker.datatype.boolean({ probability: 0.2 }),
    highContrastMode: faker.datatype.boolean({ probability: 0.15 }),
    customAccentColor: faker.color.hex(),
    saturationLevel: faker.number.int({ min: 0, max: 100 }),
    brightnessLevel: faker.number.int({ min: 0, max: 100 }),
    warmthLevel: faker.number.int({ min: 0, max: 100 }),
  },
  typographyPreferences: {
    preferredFontSize: faker.helpers.arrayElement([
      "small",
      "medium",
      "large",
      "extra-large",
    ]),
    fontSizeScale: faker.number.float({ min: 0.8, max: 1.5, multipleOf: 0.1 }),
    preferredFontFamily: faker.helpers.arrayElement([
      "system",
      "serif",
      "sans-serif",
      "monospace",
    ]),
    customFontFamily: undefined,
    lineHeightPreference: faker.helpers.arrayElement([
      "compact",
      "comfortable",
      "relaxed",
    ]),
    letterSpacingPreference: faker.helpers.arrayElement([
      "tight",
      "normal",
      "wide",
    ]),
    fontWeight: faker.helpers.arrayElement([
      "light",
      "normal",
      "medium",
      "bold",
    ]),
    dyslexiaFriendly: faker.datatype.boolean({ probability: 0.1 }),
  },
  motionPreferences: {
    enableAnimations: faker.datatype.boolean({ probability: 0.8 }),
    animationSpeed: faker.helpers.arrayElement(["slow", "normal", "fast"]),
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
      "default",
      "nature",
      "electronic",
      "minimal",
    ]),
    customSounds: {},
    muteOnFocus: faker.datatype.boolean({ probability: 0.3 }),
    hapticFeedback: faker.datatype.boolean({ probability: 0.7 }),
    spatialAudio: faker.datatype.boolean({ probability: 0.4 }),
  },
  layoutPreferences: {
    density: faker.helpers.arrayElement(["compact", "comfortable", "spacious"]),
    navigation: faker.helpers.arrayElement(["bottom", "side", "top"]),
    cardStyle: faker.helpers.arrayElement(["flat", "elevated", "outlined"]),
    borderRadius: faker.helpers.arrayElement(["sharp", "rounded", "circular"]),
    showLabels: faker.datatype.boolean({ probability: 0.8 }),
    showIcons: faker.datatype.boolean({ probability: 0.9 }),
    iconSize: faker.helpers.arrayElement(["small", "medium", "large"]),
    gridColumns: faker.number.int({ min: 2, max: 4 }),
    listSpacing: faker.helpers.arrayElement(["tight", "normal", "loose"]),
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
    focusIndicatorStyle: faker.helpers.arrayElement([
      "outline",
      "highlight",
      "glow",
    ]),
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
  tier?: SubscriptionTier;
  isActive?: boolean;
  hasStats?: boolean;
  level?: number;
  premium?: boolean;
  overrides?: DeepPartial<User>;
}

export const createTestUser = <T extends CreateUserOptions = CreateUserOptions>(
  options: T = {} as T
): User => {
  const {
    tier = faker.helpers.arrayElement(COMMON_DATA.subscriptionTiers),
    isActive = true,
    hasStats = true,
    level,
    premium = tier !== "free",
    overrides = {},
  } = options;

  const userId = generateId("user");
  const joinDate = generateTimestamp({ past: 365, format: "iso" });
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
    joinDate: joinDate,
    lastActive: isActive
      ? generateTimestamp({ past: 1, format: "iso" })
      : generateTimestamp({ past: 30, format: "iso" }),
    preferences: createTestUserPreferences({ premium }),
    settings: createTestUserSettings(),
    stats: hasStats ? createTestUserStats() : undefined,
    subscriptionTier: tier,
    subscriptionStatus:
      tier === "free"
        ? undefined
        : faker.helpers.arrayElement(COMMON_DATA.subscriptionStatuses),
    createdAt: joinDate,
    subscription: tier !== "free" ? createTestSubscription(tier) : undefined,
    stripeCustomerId:
      tier !== "free" ? `cus_${faker.string.alphanumeric(14)}` : undefined,
    trialEndsAt: tier === "free" ? undefined : faker.date.soon({ days: 14 }),
    premiumFeatures: premium
      ? randomSubset([
          "voice-personalities",
          "advanced-analytics",
          "custom-themes",
          "battle-premium",
        ])
      : [],
    featureAccess: premium ? createTestPremiumFeatureAccess(tier) : undefined,
    usage: premium ? createTestPremiumUsage() : undefined,
    ...overrides,
  } as User;
};

export const createTestUserStats = (): UserStats => ({
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

export const createTestUserPreferences = (
  options: { premium?: boolean } = {},
): UserPreferences => {
  const { premium = false } = options;

  return {
    personalization: createTestPersonalizationSettings(),
    notificationsEnabled: faker.datatype.boolean({ probability: 0.8 }),
    soundEnabled: faker.datatype.boolean({ probability: 0.9 }),
    voiceDismissalSensitivity: faker.number.int({ min: 1, max: 10 }),
    defaultVoiceMood: faker.helpers.arrayElement(
      premium
        ? [...COMMON_DATA.voiceMoods]
        : COMMON_DATA.voiceMoods.slice(0, 6), // Free tier only
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
    smartFeaturesEnabled:
      premium && faker.datatype.boolean({ probability: 0.8 }),
    fitnessIntegration: premium && faker.datatype.boolean({ probability: 0.4 }),
    locationChallenges: faker.datatype.boolean({ probability: 0.6 }),
    photoChallenges: faker.datatype.boolean({ probability: 0.5 }),
    theme: faker.helpers.arrayElement(["light", "dark", "auto", "system"]),
    gameTheme: faker.helpers.arrayElement([
      "light",
      "dark",
      "ocean-breeze",
      "sunset-glow",
      "forest-dream",
    ]) as Theme,
  };
};

const createTestUserSettings = () => ({
  theme: faker.helpers.arrayElement([
    "light",
    "dark",
    "auto",
    "system",
    "high-contrast",
  ]),
  notifications: {
    pushEnabled: faker.datatype.boolean({ probability: 0.8 }),
    battleChallenges: faker.datatype.boolean({ probability: 0.7 }),
    friendRequests: faker.datatype.boolean({ probability: 0.9 }),
    achievements: faker.datatype.boolean({ probability: 0.8 }),
    reminders: faker.datatype.boolean({ probability: 0.6 }),
    trashTalk: faker.datatype.boolean({ probability: 0.3 }),
  },
  privacy: {
    profileVisible: faker.datatype.boolean({ probability: 0.8 }),
    statsVisible: faker.datatype.boolean({ probability: 0.7 }),
    onlineStatus: faker.datatype.boolean({ probability: 0.6 }),
    allowFriendRequests: faker.datatype.boolean({ probability: 0.9 }),
  },
  alarm: {
    defaultSound: faker.helpers.arrayElement([
      "classic-bell",
      "nature-birds",
      "electronic-beep",
    ]),
    defaultSnoozeInterval: faker.number.int({ min: 5, max: 15 }),
    maxSnoozeCount: faker.number.int({ min: 1, max: 5 }),
    vibrationEnabled: faker.datatype.boolean({ probability: 0.7 }),
    gradualVolumeIncrease: faker.datatype.boolean({ probability: 0.6 }),
  },
});

const createTestPremiumUsage = () => ({
  userId: generateId("user"),
  month: faker.date.recent({ days: 30 }).toISOString().slice(0, 7), // YYYY-MM format
  elevenlabsApiCalls: faker.number.int({ min: 0, max: 1000 }),
  aiInsightsGenerated: faker.number.int({ min: 0, max: 20 }),
  customVoiceMessages: faker.number.int({ min: 0, max: 100 }),
  premiumThemesUsed: randomSubset(
    ["ocean-breeze", "sunset-glow", "forest-dream", "midnight-cosmos"],
    0,
    3,
  ),
  lastUpdated: faker.date.recent({ days: 7 }),
});

// ===============================
// ALARM FACTORIES
// ===============================

export interface CreateAlarmOptions {
  userId?: UserId;
  enabled?: boolean;
  difficulty?: AlarmDifficulty;
  premium?: boolean;
  battleId?: BattleId;
  overrides?: DeepPartial<Alarm>;
}

export const createTestAlarm = <T extends CreateAlarmOptions = CreateAlarmOptions>(
  options: T = {} as T
): Alarm => {
  const {
    userId = generateId("user"),
    enabled = faker.datatype.boolean({ probability: 0.8 }),
    difficulty,
    premium = false,
    battleId,
  } = options;

  const alarmId = generateId("alarm");
  const days = generateRealisticAlarmDays();
  const time = generateRealisticAlarmTime();
  const alarmDifficulty =
    difficulty ||
    (faker.helpers.arrayElement(
      COMMON_DATA.alarmDifficulties,
    ) as AlarmDifficulty);

  return {
    id: alarmId,
    userId,
    time,
    label: faker.helpers.arrayElement([
      "Morning Workout",
      "Work Start",
      "Meeting Reminder",
      "Wake Up Call",
      "School Time",
      "Gym Session",
      "Study Time",
      "Daily Standup",
    ]),
    title: faker.lorem.words(2),
    description: faker.lorem.sentence(),
    enabled,
    isActive: enabled && faker.datatype.boolean({ probability: 0.9 }),
    days,
    dayNames: days.map(
      (day: number) =>
        [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][day] as DayOfWeek,
    ),
    recurringDays: days.map(
      (day: number) =>
        [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][day] as DayOfWeek,
    ),
    voiceMood: faker.helpers.arrayElement(
      premium
        ? [...COMMON_DATA.voiceMoods]
        : COMMON_DATA.voiceMoods.slice(0, 6), // Free tier only
    ) as VoiceMood,
    sound: faker.helpers.arrayElement([
      "classic-bell",
      "nature-birds",
      "electronic-beep",
      "acoustic-guitar",
      "ocean-waves",
      "rainfall",
      "upbeat-tune",
    ]),
    soundType: faker.helpers.arrayElement(["built-in", "custom", "voice-only"]),
    customSoundId: faker.datatype.boolean({ probability: 0.3 })
      ? generateId("sound")
      : undefined,
    difficulty: alarmDifficulty,
    snoozeEnabled: faker.datatype.boolean({ probability: 0.8 }),
    snoozeInterval: faker.helpers.arrayElement([5, 9, 10, 15]),
    snoozeCount: faker.number.int({ min: 0, max: 3 }),
    maxSnoozes: faker.number.int({ min: 1, max: 5 }),
    lastTriggered: faker.datatype.boolean({ probability: 0.6 })
      ? faker.date.recent({ days: 7 })
      : undefined,
    createdAt: generateTimestamp({ past: 30, format: "iso" }),
    updatedAt: generateTimestamp({ past: 7, format: "iso" }),
    battleId,
    weatherEnabled: premium && faker.datatype.boolean({ probability: 0.4 }),
    smartFeatures: premium ? createTestSmartAlarmSettings() : undefined,
  };
};

export const createTestAlarmInstance = (alarmId: string): AlarmInstance => ({
  id: generateId("instance"),
  alarmId,
  scheduledTime: generateTimestamp({ future: 1, format: "iso" }),
  actualWakeTime: faker.datatype.boolean({ probability: 0.7 })
    ? generateTimestamp({ format: "iso" })
    : undefined,
  status: faker.helpers.arrayElement([
    "pending",
    "snoozed",
    "dismissed",
    "completed",
    "missed",
  ]),
  snoozeCount: faker.number.int({ min: 0, max: 3 }),
  battleId: faker.datatype.boolean({ probability: 0.3 })
    ? generateId("battle")
    : undefined,
});

export const createTestAlarmEvent = (alarmId: string): AlarmEvent => ({
  id: generateId("event"),
  alarmId,
  firedAt: faker.date.recent({ days: 7 }),
  dismissed: faker.datatype.boolean({ probability: 0.8 }),
  snoozed: faker.datatype.boolean({ probability: 0.4 }),
  userAction: faker.helpers.arrayElement(["dismissed", "snoozed", "ignored"]),
  dismissMethod: faker.helpers.arrayElement(["voice", "button", "shake"]),
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

export const createTestBattle = (options: CreateBattleOptions = {}): Battle => {
  const {
    type = faker.helpers.arrayElement(COMMON_DATA.battleTypes) as BattleType,
    status = faker.helpers.arrayElement(
      COMMON_DATA.battleStatuses,
    ) as BattleStatus,
    participantCount = faker.number.int({ min: 2, max: 10 }),
    creatorId = generateId("user"),
    premium = false,
  } = options;

  const battleId = generateId("battle");
  const startTime = generateTimestamp({ future: 1, format: "iso" });
  const endTime = generateTimestamp({ future: 7, format: "iso" });

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
    startTime: startTime,
    endTime: endTime,
    settings: createTestBattleSettings({ type, premium }),
    winner:
      status === "completed"
        ? faker.helpers.arrayElement(participants).userId
        : undefined,
    createdAt: generateTimestamp({ past: 7, format: "iso" }),
    tournamentId: type === "tournament" ? generateId("tournament") : undefined,
    teamId: type === "team" ? generateId("team") : undefined,
    seasonId: faker.datatype.boolean({ probability: 0.3 })
      ? generateId("season")
      : undefined,
    maxParticipants: Math.max(
      participantCount,
      faker.number.int({ min: participantCount, max: 50 }),
    ),
    minParticipants: Math.min(
      participantCount,
      faker.number.int({ min: 2, max: Math.max(2, participantCount) }),
    ),
    entryFee: premium ? faker.number.int({ min: 10, max: 100 }) : 0,
    prizePool: createTestBattlePrize({ premium }),
  };
};

export const createTestBattleParticipant = (
  userId?: string,
): BattleParticipant => {
  const participantUserId = userId || generateId("user");

  return {
    userId: participantUserId,
    user: createTestUser(),
    joinedAt: generateTimestamp({ past: 7, format: "iso" }),
    progress: faker.number.int({ min: 0, max: 100 }),
    completedAt: faker.datatype.boolean({ probability: 0.6 })
      ? generateTimestamp({ format: "iso" })
      : undefined,
    stats: createTestBattleParticipantStats(),
  };
};

const createTestBattleSettings = (options: {
  type: BattleType;
  premium: boolean;
}): BattleSettings => {
  const { type, premium } = options;

  return {
    duration: `P${faker.number.int({ min: 1, max: 30 })}D`, // ISO duration format
    maxParticipants: faker.number.int({ min: 2, max: 50 }),
    difficulty: faker.helpers.arrayElement(
      COMMON_DATA.alarmDifficulties,
    ) as AlarmDifficulty,
    allowLateJoins: faker.datatype.boolean({ probability: 0.6 }),
    speedTarget: type === "speed" ? generateRealisticAlarmTime() : undefined,
    consistencyDays:
      type === "consistency"
        ? faker.number.int({ min: 5, max: 30 })
        : undefined,
    tasks: premium
      ? [
          {
            id: generateId("task"),
            description: faker.lorem.sentence(),
            completed: false,
          },
          {
            id: generateId("task"),
            description: faker.lorem.sentence(),
            completed: faker.datatype.boolean({ probability: 0.3 }),
          },
        ]
      : undefined,
  };
};

const createTestBattlePrize = (options: { premium: boolean }) => {
  const { premium } = options;

  return {
    experience: faker.number.int({ min: 100, max: 1000 }),
    title: faker.helpers.arrayElement([
      "Early Bird",
      "Consistent Champion",
      "Battle Warrior",
    ]),
    badge: faker.helpers.arrayElement([
      "early-bird",
      "consistent",
      "warrior",
      "champion",
    ]),
    seasonPoints: premium
      ? faker.number.int({ min: 50, max: 500 })
      : faker.number.int({ min: 10, max: 50 }),
  };
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

export const createTestTheme = (
  options: CreateThemeOptions = {},
): ThemeConfig => {
  const {
    category = faker.helpers.arrayElement(
      COMMON_DATA.themeCategories,
    ) as ThemeCategory,
    isPremium = faker.datatype.boolean({ probability: 0.3 }),
    isCustom = faker.datatype.boolean({ probability: 0.2 }),
    createdBy,
  } = options;

  const themeId = generateId("theme");
  const name = faker.helpers.arrayElement([
    "Ocean Breeze",
    "Forest Dawn",
    "Sunset Glow",
    "Midnight Blue",
    "Cherry Blossom",
    "Arctic White",
    "Volcanic Red",
    "Cosmic Purple",
    "Golden Hour",
    "Deep Space",
    "Emerald Dream",
    "Rose Gold",
  ]);

  return {
    id: themeId,
    name: name.toLowerCase().replace(/\s+/g, "-"),
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
    createdBy: isCustom ? createdBy || generateId("user") : undefined,
    createdAt: generateTimestamp({ past: 365, format: "date" }) as Date,
    popularity: generateRating() * 20, // 0-100
    rating: generateRating(),
  };
};

const createTestThemeColors = (): ThemeColors => ({
  primary: createTestColorPalette(),
  secondary: createTestColorPalette(),
  accent: createTestColorPalette(),
  neutral: createTestColorPalette(),
  success: createTestColorPalette("#22c55e"),
  warning: createTestColorPalette("#f59e0b"),
  error: createTestColorPalette("#ef4444"),
  info: createTestColorPalette("#3b82f6"),
  background: {
    primary: generateHexColor(),
    secondary: generateHexColor(),
    tertiary: generateHexColor(),
    overlay: "rgba(0, 0, 0, 0.5)",
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
  950: generateHexColor(),
});

const createTestThemeTypography = () => ({
  fontFamily: {
    primary: faker.helpers.arrayElement([
      "Inter",
      "Roboto",
      "Open Sans",
      "Lato",
    ]),
    secondary: faker.helpers.arrayElement([
      "Poppins",
      "Montserrat",
      "Source Sans Pro",
    ]),
    monospace: faker.helpers.arrayElement([
      "Monaco",
      "Consolas",
      "Source Code Pro",
    ]),
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2.0,
  },
  letterSpacing: {
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
  },
});

const createTestThemeSpacing = () => ({
  scale: faker.helpers.arrayElement([4, 8]),
  sizes: {
    0: "0rem",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    32: "8rem",
    40: "10rem",
    48: "12rem",
    56: "14rem",
    64: "16rem",
  },
  borderRadius: {
    none: "0px",
    sm: "0.125rem",
    base: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },
});

const createTestThemeAnimations = () => ({
  enabled: faker.datatype.boolean({ probability: 0.8 }),
  duration: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
  },
  easing: {
    linear: "linear",
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    elastic: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  },
  scale: faker.number.float({ min: 0.5, max: 1.5, multipleOf: 0.1 }),
});

const createTestThemeEffects = () => ({
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    base: "0 1px 3px rgba(0, 0, 0, 0.1)",
    md: "0 4px 6px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.15)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.15)",
    "2xl": "0 25px 50px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px rgba(0, 0, 0, 0.06)",
    none: "none",
  },
  blur: {
    sm: "4px",
    base: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "40px",
    "3xl": "64px",
  },
  opacity: {
    disabled: 0.6,
    hover: 0.8,
    focus: 0.9,
    overlay: 0.75,
  },
  gradients: {
    primary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    secondary: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    accent: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  },
});

const createTestThemeAccessibility = () => ({
  contrastRatio: faker.helpers.arrayElement(["AA", "AAA"]),
  reduceMotion: faker.datatype.boolean({ probability: 0.1 }),
  highContrast: faker.datatype.boolean({ probability: 0.2 }),
  largeFonts: faker.datatype.boolean({ probability: 0.3 }),
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
export const createFlexibleUser = (overrides: Partial<User> = {}): User => {
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
export const createFlexibleAlarm = (overrides: Partial<Alarm> = {}): Alarm => {
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
export const createFlexibleBattle = (overrides: Partial<Battle> = {}): Battle => {
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
export const createFlexibleTheme = (overrides: Partial<ThemeConfig> = {}): ThemeConfig => {
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
export function createBatch<T>(
  factory: (overrides?: Partial<T>) => T,
  count: number,
  overridesList: Partial<T>[] = []
): T[] {
  return Array.from({ length: count }, (_, i) => 
    factory(overridesList[i] || {})
  );
}

// Convenience exports for common test scenarios
export const createMinimalUser = () => createFlexibleUser({
  stats: undefined,
  settings: undefined,
  subscription: undefined
});

export const createPremiumUser = () => createFlexibleUser({
  subscriptionTier: 'premium',
  featureAccess: createTestPremiumFeatureAccess('premium'),
  usage: createTestPremiumUsage()
});

export const createActiveAlarm = () => createFlexibleAlarm({
  enabled: true,
  nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
});

export const createCompletedBattle = () => createFlexibleBattle({
  status: 'completed',
  endTime: new Date(),
  winner: generateId('user')
});
