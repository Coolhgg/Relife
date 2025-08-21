/**
 * Support & Utility Factories
 *
 * Factory functions for generating supporting entities:
 * - Emotional Intelligence (states, profiles, contexts)
 * - Media & Assets (images, sounds, files)
 * - Notifications & Messaging
 * - Settings & Configuration
 * - External Integrations
 */

import { faker } from '@faker-js/faker';
import type {
  EmotionalState,
  UserEmotionalProfile,
  EmotionType,
  EmotionalTone,
  EmotionalContext,
  NotificationSettings,
  AppSettings,
  ExternalIntegration,
  MediaAsset,
  UserActivity,
  SystemEvent
} from '../../types';
import {
  generateId,
  generateTimestamp,
  generateUrl,
  randomSubset,
  weightedRandom,
  COMMON_DATA
} from './factory-utils';

// ===============================
// EMOTIONAL INTELLIGENCE FACTORIES
// ===============================

export interface CreateEmotionalStateOptions {
  emotion?: EmotionType;
  intensity?: number;
  context?: EmotionalContext;
}

export const _createTestEmotionalState = (
  options: CreateEmotionalStateOptions = {},
): EmotionalState => {
  const {
    emotion = faker.helpers.arrayElement([...COMMON_DATA.emotionTypes]) as EmotionType,
    intensity = faker.number.int({ min: 1, max: 10 }),
    context = faker.helpers.arrayElement(['morning', 'evening', 'weekend', 'workday', 'stressful', 'relaxed'])
  } = options;

  return {
    emotion,
    intensity,
    context,
    confidence: faker.number.float({ min: 0.6, max: 0.99, multipleOf: 0.01 }),
    triggers: randomSubset([
      'alarm_snoozed', 'late_wake_up', 'battle_loss', 'achievement_unlocked',
      'weather_bad', 'weekend_mode', 'work_stress', 'social_interaction',
      'exercise_completed', 'goal_achieved', 'friend_activity', 'new_feature'
    ], 1, 4),
    recommendedTone: faker.helpers.arrayElement([...COMMON_DATA.emotionalTones]) as EmotionalTone
  };
};

export const _createTestUserEmotionalProfile = (
  userId?: string,
): UserEmotionalProfile => {
  const profileUserId = userId || generateId("user");

  return {
    userId: profileUserId,
    preferredTones: randomSubset([...COMMON_DATA.emotionalTones], 1, 3) as EmotionalTone[],
    avoidedTones: randomSubset([...COMMON_DATA.emotionalTones], 0, 2) as EmotionalTone[],
    mostEffectiveEmotions: randomSubset([...COMMON_DATA.emotionTypes], 2, 4) as EmotionType[],
    responsePatterns: {
      bestTimeToSend: faker.date.recent().toTimeString().slice(0, 5),
      averageResponseTime: faker.number.int({ min: 30, max: 600 }), // seconds
      preferredEscalationSpeed: faker.helpers.arrayElement(['slow', 'medium', 'fast'])
    },
    emotionalHistory: Array.from({ length: faker.number.int({ min: 10, max: 50 }) }, () =>
      createTestEmotionalState()
    ),
    lastAnalyzed: faker.date.recent({ days: 7 })
  };
};

// ===============================
// NOTIFICATION & MESSAGING FACTORIES
// ===============================

export interface CreateNotificationOptions {
  type?: 'alarm' | 'battle' | 'achievement' | 'social' | 'system';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  read?: boolean;
}

export const _createTestNotification = (
  options: CreateNotificationOptions = {},
) => {
  const {
    type = faker.helpers.arrayElement(['alarm', 'battle', 'achievement', 'social', 'system']),
    priority = weightedRandom([
      { item: 'low', weight: 40 },
      { item: 'medium', weight: 35 },
      { item: 'high', weight: 20 },
      { item: 'urgent', weight: 5 }
    ] as Array<{ item: 'low' | 'medium' | 'high' | 'urgent'; weight: number }>),
    read = faker.datatype.boolean({ probability: 0.6 })
  } = options;

  const notificationMessages = {
    alarm: [
      'Your alarm is set for tomorrow morning',
      'Time to wake up! Your alarm is ringing',
      'You snoozed your alarm 3 times today',
      'Great job waking up on time!'
    ],
    battle: [
      'New battle invitation received',
      'Battle starting in 30 minutes',
      'You won your morning battle!',
      'Battle results are now available'
    ],
    achievement: [
      'New achievement unlocked!',
      'You\'re on a 7-day streak!',
      'Achievement progress: 80% complete',
      'Congratulations on your milestone!'
    ],
    social: [
      'Friend request received',
      'Your team needs you for a battle',
      'New message from your battle group',
      'Friend achieved a new milestone'
    ],
    system: [
      'App update available',
      'Your subscription expires soon',
      'New features have been added',
      'Maintenance scheduled for tonight'
    ]
  };

  return {
    id: generateId('notification'),
    userId: generateId('user'),
    type,
    title: faker.lorem.words(3),
    message: faker.helpers.arrayElement(notificationMessages[type]),
    priority,
    read,
    actionRequired: faker.datatype.boolean({ probability: 0.3 }),
    actionUrl: faker.datatype.boolean({ probability: 0.4 }) ? generateUrl() : undefined,
    metadata: {
      entityId: generateId(),
      entityType: type,
      source: faker.helpers.arrayElement(['app', 'system', 'user', 'external']),
      channel: faker.helpers.arrayElement(['push', 'in-app', 'email', 'sms'])
    },
    createdAt: generateTimestamp({ past: 7 }),
    readAt: read ? generateTimestamp({ past: 3 }) : undefined,
    expiresAt: faker.datatype.boolean({ probability: 0.3 }) ? generateTimestamp({ future: 30 }) : undefined
  };
};

export const _createTestNotificationSettings = (): NotificationSettings =>
  ({
    push: {
      enabled: faker.datatype.boolean({ probability: 0.8 }),
      alarms: faker.datatype.boolean({ probability: 0.95 }),
      battles: faker.datatype.boolean({ probability: 0.8 }),
      achievements: faker.datatype.boolean({ probability: 0.7 }),
      social: faker.datatype.boolean({ probability: 0.6 }),
      marketing: faker.datatype.boolean({ probability: 0.3 }),
    },
    email: {
      enabled: faker.datatype.boolean({ probability: 0.6 }),
      digest: faker.datatype.boolean({ probability: 0.4 }),
      important: faker.datatype.boolean({ probability: 0.8 }),
      marketing: faker.datatype.boolean({ probability: 0.2 }),
    },
    inApp: {
      enabled: faker.datatype.boolean({ probability: 0.9 }),
      sound: faker.datatype.boolean({ probability: 0.7 }),
      vibration: faker.datatype.boolean({ probability: 0.6 }),
      badge: faker.datatype.boolean({ probability: 0.8 }),
    },
    quietHours: {
      enabled: faker.datatype.boolean({ probability: 0.5 }),
      startTime: "22:00",
      endTime: "07:00",
      exceptions: randomSubset(["alarms", "urgent"], 0, 2),
    },
    frequency: {
      maxPerDay: faker.number.int({ min: 5, max: 50 }),
      maxPerHour: faker.number.int({ min: 1, max: 10 }),
      batchSimilar: faker.datatype.boolean({ probability: 0.7 }),
    },
  }) as any;

// ===============================
// SETTINGS & CONFIGURATION FACTORIES
// ===============================

export const _createTestAppSettings = (userId?: string): AppSettings => ({
  userId: userId || generateId('user'),
  appearance: {
    theme: faker.helpers.arrayElement(['light', 'dark', 'auto', 'system']),
    accentColor: faker.internet.color(),
    fontSize: faker.helpers.arrayElement(['small', 'medium', 'large']),
    animations: faker.datatype.boolean({ probability: 0.8 }),
    reduceMotion: faker.datatype.boolean({ probability: 0.1 })
  },
  accessibility: {
    highContrast: faker.datatype.boolean({ probability: 0.1 }),
    screenReader: faker.datatype.boolean({ probability: 0.05 }),
    largeText: faker.datatype.boolean({ probability: 0.15 }),
    colorBlindSupport: faker.datatype.boolean({ probability: 0.08 }),
    keyboardNavigation: faker.datatype.boolean({ probability: 0.1 })
  },
  privacy: {
    profileVisible: faker.datatype.boolean({ probability: 0.8 }),
    statsVisible: faker.datatype.boolean({ probability: 0.7 }),
    allowFriendRequests: faker.datatype.boolean({ probability: 0.9 }),
    showOnlineStatus: faker.datatype.boolean({ probability: 0.6 }),
    dataCollection: faker.datatype.boolean({ probability: 0.5 })
  },
  security: {
    biometricAuth: faker.datatype.boolean({ probability: 0.4 }),
    autoLock: faker.datatype.boolean({ probability: 0.6 }),
    lockTimeout: faker.number.int({ min: 1, max: 60 }), // minutes
    requireAuthForSettings: faker.datatype.boolean({ probability: 0.3 })
  },
  storage: {
    cloudSync: faker.datatype.boolean({ probability: 0.7 }),
    localBackup: faker.datatype.boolean({ probability: 0.5 }),
    cacheSize: faker.number.int({ min: 50, max: 500 }), // MB
    autoCleanup: faker.datatype.boolean({ probability: 0.8 })
  },
  experimental: {
    betaFeatures: faker.datatype.boolean({ probability: 0.2 }),
    aiFeatures: faker.datatype.boolean({ probability: 0.3 }),
    analyticsSharing: faker.datatype.boolean({ probability: 0.4 })
  }
} as any);

// ===============================
// MEDIA & ASSET FACTORIES
// ===============================

export interface CreateMediaAssetOptions {
  type?: 'image' | 'audio' | 'video' | 'document';
  category?: string;
  isUserGenerated?: boolean;
}

export const _createTestMediaAsset = (
  options: CreateMediaAssetOptions = {},
): MediaAsset => {
  const {
    type = faker.helpers.arrayElement(['image', 'audio', 'video', 'document']),
    category,
    isUserGenerated = faker.datatype.boolean({ probability: 0.3 })
  } = options;

  const assetId = generateId('asset');
  const fileName = `${faker.system.fileName()}.${getFileExtension(type)}`;

  return {
    id: assetId,
    type,
    category: category || faker.helpers.arrayElement(['avatar', 'sound', 'theme', 'achievement', 'background']),
    fileName,
    originalName: fileName,
    url: `${generateUrl()}/assets/${fileName}`,
    thumbnailUrl: type === 'image' ? `${generateUrl()}/thumbnails/${fileName}` : undefined,
    size: faker.number.int({ min: 1024, max: 10485760 }), // 1KB to 10MB
    mimeType: getMimeType(type),
    dimensions: type === 'image' ? {
      width: faker.number.int({ min: 100, max: 2048 }),
      height: faker.number.int({ min: 100, max: 2048 })
    } : undefined,
    duration: ['audio', 'video'].includes(type) ? faker.number.int({ min: 1, max: 600 }) : undefined,
    metadata: {
      title: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      tags: randomSubset(['alarm', 'nature', 'music', 'voice', 'background', 'theme'], 1, 3),
      quality: faker.helpers.arrayElement(['low', 'medium', 'high', 'ultra']),
      bitrate: ['audio', 'video'].includes(type) ? faker.number.int({ min: 128, max: 320 }) : undefined
    },
    uploadedBy: isUserGenerated ? generateId('user') : 'system',
    uploadedAt: generateTimestamp({ past: 90 }),
    isPublic: faker.datatype.boolean({ probability: 0.6 }),
    downloads: faker.number.int({ min: 0, max: 50000 }),
    rating: faker.number.float({ min: 3.0, max: 5.0, multipleOf: 0.1 }),
    processing: {
      status: faker.helpers.arrayElement(['pending', 'processing', 'completed', 'failed']),
      progress: faker.number.int({ min: 0, max: 100 }),
      variants: type === 'image' ? ['thumbnail', 'medium', 'large'] : ['original']
    }
  } as any;
};

const getFileExtension = (type: string): string => {
  const extensions = {
    image: ['jpg', 'png', 'gif', 'webp'],
    audio: ['mp3', 'wav', 'ogg', 'm4a'],
    video: ['mp4', 'webm', 'mov'],
    document: ['pdf', 'txt', 'json']
  };
  return faker.helpers.arrayElement(extensions[type as keyof typeof extensions] || ['bin']);
};

const getMimeType = (type: string): string => {
  const mimeTypes = {
    image: 'image/jpeg',
    audio: 'audio/mpeg',
    video: 'video/mp4',
    document: 'application/pdf'
  };
  return mimeTypes[type as keyof typeof mimeTypes] || 'application/octet-stream';
};

// ===============================
// EXTERNAL INTEGRATION FACTORIES
// ===============================

export const _createTestExternalIntegration = (
  service: "fitness" | "calendar" | "weather" | "music" | "home" = "fitness",
): ExternalIntegration => {
  const integrationId = generateId('integration');

  const serviceConfigs = {
    fitness: {
      name: 'Apple Health',
      provider: 'apple',
      scopes: ['sleep', 'activity', 'heart_rate'],
      data: { steps: 8500, sleep_hours: 7.5 }
    },
    calendar: {
      name: 'Google Calendar',
      provider: 'google',
      scopes: ['calendar.readonly', 'events.read'],
      data: { next_event: 'Team Meeting', time: '09:00' }
    },
    weather: {
      name: 'Weather Service',
      provider: 'openweather',
      scopes: ['current', 'forecast'],
      data: { temp: 22, condition: 'sunny', humidity: 65 }
    },
    music: {
      name: 'Spotify',
      provider: 'spotify',
      scopes: ['playlist.read', 'player.control'],
      data: { current_track: 'Morning Motivation', playlist: 'Wake Up' }
    },
    home: {
      name: 'Smart Home Hub',
      provider: 'homekit',
      scopes: ['lights.control', 'thermostat.control'],
      data: { lights_on: true, temperature: 20 }
    }
  };

  const config = serviceConfigs[service];

  return {
    id: integrationId,
    userId: generateId('user'),
    service,
    provider: config.provider,
    name: config.name,
    isEnabled: faker.datatype.boolean({ probability: 0.7 }),
    isConnected: faker.datatype.boolean({ probability: 0.8 }),
    scopes: config.scopes,
    credentials: {
      accessToken: faker.string.alphanumeric(32),
      refreshToken: faker.string.alphanumeric(32),
      expiresAt: generateTimestamp({ future: 30 })
    },
    settings: {
      syncFrequency: faker.helpers.arrayElement(['realtime', '5min', '15min', 'hourly']),
      autoSync: faker.datatype.boolean({ probability: 0.8 }),
      notifications: faker.datatype.boolean({ probability: 0.6 })
    },
    lastSync: generateTimestamp({ past: 1 }),
    data: config.data,
    connectedAt: generateTimestamp({ past: 30 })
  } as any;
};

// ===============================
// ACTIVITY & EVENT TRACKING FACTORIES
// ===============================

export const _createTestUserActivity = (userId?: string): UserActivity => {
  const activityUserId = userId || generateId("user");

  return {
    id: generateId('activity'),
    userId: activityUserId,
    type: faker.helpers.arrayElement([
      'login', 'logout', 'alarm_set', 'alarm_dismissed', 'battle_joined',
      'achievement_unlocked', 'settings_changed', 'friend_added', 'purchase_made'
    ]),
    details: {
      action: faker.lorem.words(2),
      target: faker.helpers.arrayElement(['alarm', 'battle', 'user', 'setting', 'purchase']),
      metadata: {
        source: faker.helpers.arrayElement(['mobile', 'web', 'api']),
        duration: faker.number.int({ min: 1, max: 300 }), // seconds
        success: faker.datatype.boolean({ probability: 0.9 })
      }
    },
    timestamp: generateTimestamp({ past: 30 }),
    ipAddress: faker.internet.ip(),
    userAgent: faker.internet.userAgent(),
    location: {
      country: faker.location.countryCode(),
      city: faker.location.city(),
      timezone: faker.location.timeZone()
    }
  } as any;
};

export const _createTestSystemEvent = (): SystemEvent =>
  ({
    id: generateId("event"),
    type: faker.helpers.arrayElement([
      "user_registered",
      "subscription_created",
      "payment_processed",
      "error_occurred",
      "feature_used",
      "performance_alert",
    ]),
    level: faker.helpers.arrayElement(["info", "warning", "error", "critical"]),
    message: faker.lorem.sentence(),
    details: {
      component: faker.helpers.arrayElement([
        "auth",
        "payment",
        "notification",
        "database",
        "api",
      ]),
      code: faker.string.alphanumeric(8).toUpperCase(),
      stack: faker.datatype.boolean({ probability: 0.3 })
        ? faker.lorem.paragraph()
        : undefined,
    },
    userId: faker.datatype.boolean({ probability: 0.7 })
      ? generateId("user")
      : undefined,
    timestamp: generateTimestamp({ past: 7 }),
    environment: faker.helpers.arrayElement([
      "production",
      "staging",
      "development",
    ]),
    version: faker.system.semver(),
  }) as any;
