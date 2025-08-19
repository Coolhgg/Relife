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
  BattleSettings,
  ThemeConfig,
  ThemeColors,
  VoiceMood,
  AlarmDifficulty,
  SubscriptionTier,
  BattleType,
  BattleStatus,
  ThemeCategory
} from '../../types';
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
  COMMON_DATA
} from './factory-utils';

// ===============================
// USER FACTORIES
// ===============================

export interface CreateUserOptions {
  tier?: SubscriptionTier;
  isActive?: boolean;
  hasStats?: boolean;
  level?: number;
  premium?: boolean;
}

export const createTestUser = (options: CreateUserOptions = {}): User => {
  const {
    tier = faker.helpers.arrayElement(COMMON_DATA.subscriptionTiers),
    isActive = true,
    hasStats = true,
    level,
    premium = tier !== 'free'
  } = options;

  const userId = generateId('user');
  const joinDate = generateTimestamp({ past: 365 });
  const experience = level ? level * 100 + faker.number.int({ min: 0, max: 99 }) : generateExperience();
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
    lastActive: isActive ? generateTimestamp({ past: 1 }) : generateTimestamp({ past: 30 }),
    preferences: createTestUserPreferences({ premium }),
    settings: createTestUserSettings(),
    stats: hasStats ? createTestUserStats() : undefined,
    subscriptionTier: tier,
    subscriptionStatus: tier === 'free' ? undefined : faker.helpers.arrayElement(COMMON_DATA.subscriptionStatuses),
    createdAt: joinDate,
    subscription: tier !== 'free' ? { id: generateId('sub') } as any : undefined,
    stripeCustomerId: tier !== 'free' ? `cus_${faker.string.alphanumeric(14)}` : undefined,
    trialEndsAt: tier === 'free' ? undefined : faker.date.soon({ days: 14 }),
    premiumFeatures: premium ? randomSubset(['voice-personalities', 'advanced-analytics', 'custom-themes', 'battle-premium']) : [],
    featureAccess: premium ? {
      voicePersonalities: true,
      advancedAnalytics: true,
      customThemes: true,
      battlePremium: true,
      prioritySupport: tier === 'premium' || tier === 'pro',
      apiAccess: tier === 'pro' || tier === 'enterprise'
    } as any : undefined,
    usage: premium ? createTestPremiumUsage() : undefined
  };
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
  snoozeCount: faker.number.int({ min: 0, max: 100 })
});

export const createTestUserPreferences = (options: { premium?: boolean } = {}): UserPreferences => {
  const { premium = false } = options;

  return {
    personalization: {
      theme: faker.helpers.arrayElement(['light', 'dark', 'auto', 'system']),
      language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de', 'ja', 'hi']),
      timezone: faker.location.timeZone()
    } as any,
    notificationsEnabled: faker.datatype.boolean({ probability: 0.8 }),
    soundEnabled: faker.datatype.boolean({ probability: 0.9 }),
    voiceDismissalSensitivity: faker.number.int({ min: 1, max: 10 }),
    defaultVoiceMood: faker.helpers.arrayElement(
      premium
        ? [...COMMON_DATA.voiceMoods]
        : COMMON_DATA.voiceMoods.slice(0, 6) // Free tier only
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
    gameTheme: { id: generateId('theme') } as any
  };
};

const createTestUserSettings = () => ({
  theme: faker.helpers.arrayElement(['light', 'dark', 'auto', 'system', 'high-contrast']),
  notifications: {
    pushEnabled: faker.datatype.boolean({ probability: 0.8 }),
    battleChallenges: faker.datatype.boolean({ probability: 0.7 }),
    friendRequests: faker.datatype.boolean({ probability: 0.9 }),
    achievements: faker.datatype.boolean({ probability: 0.8 }),
    reminders: faker.datatype.boolean({ probability: 0.6 }),
    trashTalk: faker.datatype.boolean({ probability: 0.3 })
  },
  privacy: {
    profileVisible: faker.datatype.boolean({ probability: 0.8 }),
    statsVisible: faker.datatype.boolean({ probability: 0.7 }),
    onlineStatus: faker.datatype.boolean({ probability: 0.6 }),
    allowFriendRequests: faker.datatype.boolean({ probability: 0.9 })
  },
  alarm: {
    defaultSound: faker.helpers.arrayElement(['classic-bell', 'nature-birds', 'electronic-beep']),
    defaultSnoozeInterval: faker.number.int({ min: 5, max: 15 }),
    maxSnoozeCount: faker.number.int({ min: 1, max: 5 }),
    vibrationEnabled: faker.datatype.boolean({ probability: 0.7 }),
    gradualVolumeIncrease: faker.datatype.boolean({ probability: 0.6 })
  }
});

const createTestPremiumUsage = () => ({
  userId: generateId('user'),
  month: faker.date.recent({ days: 30 }).toISOString().slice(0, 7), // YYYY-MM format
  elevenlabsApiCalls: faker.number.int({ min: 0, max: 1000 }),
  aiInsightsGenerated: faker.number.int({ min: 0, max: 20 }),
  customVoiceMessages: faker.number.int({ min: 0, max: 100 }),
  premiumThemesUsed: randomSubset(['ocean-breeze', 'sunset-glow', 'forest-dream', 'midnight-cosmos'], 0, 3),
  lastUpdated: faker.date.recent({ days: 7 })
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

export const createTestAlarm = (options: CreateAlarmOptions = {}): Alarm => {
  const {
    userId = generateId('user'),
    enabled = faker.datatype.boolean({ probability: 0.8 }),
    difficulty,
    premium = false,
    battleId
  } = options;

  const alarmId = generateId('alarm');
  const days = generateRealisticAlarmDays();
  const time = generateRealisticAlarmTime();
  const alarmDifficulty = difficulty || faker.helpers.arrayElement(COMMON_DATA.alarmDifficulties) as AlarmDifficulty;

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
      'Daily Standup'
    ]),
    title: faker.lorem.words(2),
    description: faker.lorem.sentence(),
    enabled,
    isActive: enabled && faker.datatype.boolean({ probability: 0.9 }),
    days,
    dayNames: days.map(day => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]) as any,
    recurringDays: days.map(day => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]) as any,
    voiceMood: faker.helpers.arrayElement(
      premium
        ? [...COMMON_DATA.voiceMoods]
        : COMMON_DATA.voiceMoods.slice(0, 6) // Free tier only
    ) as VoiceMood,
    sound: faker.helpers.arrayElement([
      'classic-bell',
      'nature-birds',
      'electronic-beep',
      'acoustic-guitar',
      'ocean-waves',
      'rainfall',
      'upbeat-tune'
    ]),
    soundType: faker.helpers.arrayElement(['built-in', 'custom', 'voice-only']),
    customSoundId: faker.datatype.boolean({ probability: 0.3 }) ? generateId('sound') : undefined,
    difficulty: alarmDifficulty,
    snoozeEnabled: faker.datatype.boolean({ probability: 0.8 }),
    snoozeInterval: faker.helpers.arrayElement([5, 9, 10, 15]),
    snoozeCount: faker.number.int({ min: 0, max: 3 }),
    maxSnoozes: faker.number.int({ min: 1, max: 5 }),
    lastTriggered: faker.datatype.boolean({ probability: 0.6 }) ? faker.date.recent({ days: 7 }) : undefined,
    createdAt: generateTimestamp({ past: 30 }),
    updatedAt: generateTimestamp({ past: 7 }),
    battleId,
    weatherEnabled: premium && faker.datatype.boolean({ probability: 0.4 }),
    smartFeatures: premium ? {
      adaptiveVolume: faker.datatype.boolean({ probability: 0.7 }),
      sleepCycleDetection: faker.datatype.boolean({ probability: 0.5 }),
      contextualMessages: faker.datatype.boolean({ probability: 0.8 })
    } as any : undefined
  };
};

export const createTestAlarmInstance = (alarmId: string): AlarmInstance => ({
  id: generateId('instance'),
  alarmId,
  scheduledTime: generateTimestamp({ future: 1 }),
  actualWakeTime: faker.datatype.boolean({ probability: 0.7 }) ? generateTimestamp() : undefined,
  status: faker.helpers.arrayElement(['pending', 'snoozed', 'dismissed', 'completed', 'missed']),
  snoozeCount: faker.number.int({ min: 0, max: 3 }),
  battleId: faker.datatype.boolean({ probability: 0.3 }) ? generateId('battle') : undefined
});

export const createTestAlarmEvent = (alarmId: string): AlarmEvent => ({
  id: generateId('event'),
  alarmId,
  firedAt: faker.date.recent({ days: 7 }),
  dismissed: faker.datatype.boolean({ probability: 0.8 }),
  snoozed: faker.datatype.boolean({ probability: 0.4 }),
  userAction: faker.helpers.arrayElement(['dismissed', 'snoozed', 'ignored']),
  dismissMethod: faker.helpers.arrayElement(['voice', 'button', 'shake'])
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
    status = faker.helpers.arrayElement(COMMON_DATA.battleStatuses) as BattleStatus,
    participantCount = faker.number.int({ min: 2, max: 10 }),
    creatorId = generateId('user'),
    premium = false
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
    startTime: startTime,
    endTime: endTime,
    settings: createTestBattleSettings({ type, premium }),
    winner: status === 'completed' ? faker.helpers.arrayElement(participants).userId : undefined,
    createdAt: generateTimestamp({ past: 7 }),
    tournamentId: type === 'tournament' ? generateId('tournament') : undefined,
    teamId: type === 'team' ? generateId('team') : undefined,
    seasonId: faker.datatype.boolean({ probability: 0.3 }) ? generateId('season') : undefined,
    maxParticipants: Math.max(participantCount, faker.number.int({ min: participantCount, max: 50 })),
    minParticipants: Math.min(participantCount, faker.number.int({ min: 2, max: Math.max(2, participantCount) })),
    entryFee: premium ? faker.number.int({ min: 10, max: 100 }) : 0,
    prizePool: createTestBattlePrize({ premium })
  };
};

export const createTestBattleParticipant = (userId?: string): BattleParticipant => {
  const participantUserId = userId || generateId('user');

  return {
    userId: participantUserId,
    user: createTestUser(),
    joinedAt: generateTimestamp({ past: 7 }),
    progress: faker.number.int({ min: 0, max: 100 }),
    completedAt: faker.datatype.boolean({ probability: 0.6 }) ? generateTimestamp() : undefined,
    stats: {
      wakeUpTime: generateRealisticAlarmTime(),
      completionTime: faker.number.int({ min: 1, max: 300 }), // seconds
      accuracy: faker.number.float({ min: 0.5, max: 1.0, multipleOf: 0.01 }),
      streakDays: faker.number.int({ min: 0, max: 30 }),
      bonusPoints: faker.number.int({ min: 0, max: 500 })
    } as any
  };
};

const createTestBattleSettings = (options: { type: BattleType; premium: boolean }): BattleSettings => {
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
      snoozeOveruse: faker.number.int({ min: 1, max: 10 })
    },
    rewards: {
      dailyCompletion: faker.number.int({ min: 10, max: 100 }),
      perfectWeek: faker.number.int({ min: 50, max: 500 }),
      battleWin: faker.number.int({ min: 100, max: 1000 })
    },
    rules: type === 'speed' ? {
      targetTime: generateRealisticAlarmTime(),
      allowanceWindow: faker.number.int({ min: 5, max: 30 }) // minutes
    } : type === 'consistency' ? {
      requiredDays: faker.number.int({ min: 5, max: 30 }),
      allowedMisses: faker.number.int({ min: 0, max: 3 })
    } : {}
  } as any;
};

const createTestBattlePrize = (options: { premium: boolean }) => {
  const { premium } = options;

  return {
    xp: faker.number.int({ min: 100, max: 1000 }),
    badges: randomSubset(['early-bird', 'consistent', 'warrior', 'champion'], 1, 2),
    premiumDays: premium ? faker.number.int({ min: 1, max: 30 }) : 0,
    customization: premium ? randomSubset(['theme', 'voice', 'sound'], 0, 2) : []
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

export const createTestTheme = (options: CreateThemeOptions = {}): ThemeConfig => {
  const {
    category = faker.helpers.arrayElement(COMMON_DATA.themeCategories) as ThemeCategory,
    isPremium = faker.datatype.boolean({ probability: 0.3 }),
    isCustom = faker.datatype.boolean({ probability: 0.2 }),
    createdBy
  } = options;

  const themeId = generateId('theme');
  const name = faker.helpers.arrayElement([
    'Ocean Breeze', 'Forest Dawn', 'Sunset Glow', 'Midnight Blue',
    'Cherry Blossom', 'Arctic White', 'Volcanic Red', 'Cosmic Purple',
    'Golden Hour', 'Deep Space', 'Emerald Dream', 'Rose Gold'
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
    createdBy: isCustom ? (createdBy || generateId('user')) : undefined,
    createdAt: generateTimestamp({ past: 365, format: 'date' }) as Date,
    popularity: generateRating() * 20, // 0-100
    rating: generateRating()
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
    card: generateHexColor()
  },
  text: {
    primary: generateHexColor(),
    secondary: generateHexColor(),
    tertiary: generateHexColor(),
    inverse: generateHexColor(),
    disabled: generateHexColor(),
    link: generateHexColor()
  },
  border: {
    primary: generateHexColor(),
    secondary: generateHexColor(),
    focus: generateHexColor(),
    hover: generateHexColor(),
    active: generateHexColor()
  },
  surface: {
    elevated: generateHexColor(),
    depressed: generateHexColor(),
    interactive: generateHexColor(),
    disabled: generateHexColor()
  }
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
  950: generateHexColor()
});

const createTestThemeTypography = () => ({
  fontFamily: {
    primary: faker.helpers.arrayElement(['Inter', 'Roboto', 'Open Sans', 'Lato']),
    secondary: faker.helpers.arrayElement(['Poppins', 'Montserrat', 'Source Sans Pro']),
    monospace: faker.helpers.arrayElement(['Monaco', 'Consolas', 'Source Code Pro'])
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem'
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2.0
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em'
  }
});

const createTestThemeSpacing = () => ({
  scale: faker.helpers.arrayElement([4, 8]),
  sizes: {
    0: '0rem',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    40: '10rem',
    48: '12rem',
    56: '14rem',
    64: '16rem'
  },
  borderRadius: {
    none: '0px',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  }
});

const createTestThemeAnimations = () => ({
  enabled: faker.datatype.boolean({ probability: 0.8 }),
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  },
  scale: faker.number.float({ min: 0.5, max: 1.5, multipleOf: 0.1 })
});

const createTestThemeEffects = () => ({
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.15)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    none: 'none'
  },
  blur: {
    sm: '4px',
    base: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '40px',
    '3xl': '64px'
  },
  opacity: {
    disabled: 0.6,
    hover: 0.8,
    focus: 0.9,
    overlay: 0.75
  },
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  }
});

const createTestThemeAccessibility = () => ({
  contrastRatio: faker.helpers.arrayElement(['AA', 'AAA']),
  reduceMotion: faker.datatype.boolean({ probability: 0.1 }),
  highContrast: faker.datatype.boolean({ probability: 0.2 }),
  largeFonts: faker.datatype.boolean({ probability: 0.3 }),
  focusVisible: true,
  reducedTransparency: faker.datatype.boolean({ probability: 0.15 })
});