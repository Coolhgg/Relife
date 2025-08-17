/**
 * Enhanced Entity Factories
 * 
 * Additional factories for newer application entities:
 * - Persona Detection & Email Campaigns
 * - Tab Protection Settings
 * - Advanced Analytics
 * - Performance Metrics
 */

import { faker } from '@faker-js/faker';
import type {
  PersonaType,
  PersonaProfile,
  PersonaDetectionResult,
  PersonaDetectionFactor,
  EmailCampaign,
  EmailSequence,
  CampaignMetrics,
  TabProtectionSettings,
  TabProtectionEvent,
  PerformanceMetric,
  SystemHealth,
  FeatureUsageStats
} from '../../types';
import {
  generateId,
  generateTimestamp,
  weightedRandom,
  randomSubset,
  generateRating
} from './factory-utils';

// ===============================
// PERSONA DETECTION FACTORIES
// ===============================

const PERSONA_TYPES: PersonaType[] = [
  'struggling_sam',
  'busy_ben', 
  'professional_paula',
  'enterprise_emma',
  'student_sarah',
  'lifetime_larry'
];

const PERSONA_PROFILES: Record<PersonaType, Omit<PersonaProfile, 'id'>> = {
  struggling_sam: {
    displayName: 'Struggling Sam',
    description: 'Free-focused users who need basic alarm functionality',
    primaryColor: '#3B82F6',
    messagingTone: 'supportive',
    ctaStyle: 'friendly',
    targetSubscriptionTier: 'free',
    conversionGoals: ['increase_engagement', 'basic_feature_adoption'],
    preferredChannels: ['email', 'in_app']
  },
  busy_ben: {
    displayName: 'Busy Ben',
    description: 'Efficiency-driven professionals who value time-saving features',
    primaryColor: '#F59E0B',
    messagingTone: 'efficient',
    ctaStyle: 'urgent',
    targetSubscriptionTier: 'basic',
    conversionGoals: ['premium_upgrade', 'automation_features'],
    preferredChannels: ['push', 'email']
  },
  professional_paula: {
    displayName: 'Professional Paula',
    description: 'Feature-rich seekers who want comprehensive solutions',
    primaryColor: '#8B5CF6',
    messagingTone: 'sophisticated',
    ctaStyle: 'professional',
    targetSubscriptionTier: 'premium',
    conversionGoals: ['feature_exploration', 'premium_retention'],
    preferredChannels: ['email', 'push', 'in_app']
  },
  enterprise_emma: {
    displayName: 'Enterprise Emma',
    description: 'Team-oriented decision makers focused on organization-wide solutions',
    primaryColor: '#10B981',
    messagingTone: 'business_focused',
    ctaStyle: 'corporate',
    targetSubscriptionTier: 'pro',
    conversionGoals: ['team_features', 'enterprise_upgrade'],
    preferredChannels: ['email', 'sms']
  },
  student_sarah: {
    displayName: 'Student Sarah',
    description: 'Budget-conscious students who need affordable solutions',
    primaryColor: '#EC4899',
    messagingTone: 'casual',
    ctaStyle: 'youthful',
    targetSubscriptionTier: 'student',
    conversionGoals: ['student_discount', 'feature_discovery'],
    preferredChannels: ['push', 'in_app']
  },
  lifetime_larry: {
    displayName: 'Lifetime Larry',
    description: 'One-time payment preferrers who dislike subscriptions',
    primaryColor: '#F97316',
    messagingTone: 'value_focused',
    ctaStyle: 'exclusive',
    targetSubscriptionTier: 'lifetime',
    conversionGoals: ['lifetime_conversion', 'value_demonstration'],
    preferredChannels: ['email', 'in_app']
  }
};

export interface CreatePersonaProfileOptions {
  persona?: PersonaType;
  customGoals?: string[];
  customChannels?: ('email' | 'push' | 'in_app' | 'sms')[];
}

export const createTestPersonaProfile = (options: CreatePersonaProfileOptions = {}): PersonaProfile => {
  const { persona = faker.helpers.arrayElement(PERSONA_TYPES) } = options;
  const baseProfile = PERSONA_PROFILES[persona];
  
  return {
    id: persona,
    ...baseProfile,
    conversionGoals: options.customGoals || baseProfile.conversionGoals,
    preferredChannels: options.customChannels || baseProfile.preferredChannels
  };
};

export interface CreatePersonaDetectionResultOptions {
  persona?: PersonaType;
  confidence?: number;
  previousPersona?: PersonaType;
}

export const createTestPersonaDetectionResult = (options: CreatePersonaDetectionResultOptions = {}): PersonaDetectionResult => {
  const {
    persona = faker.helpers.arrayElement(PERSONA_TYPES),
    confidence = faker.number.float({ min: 0.6, max: 0.95 }),
    previousPersona
  } = options;

  const factorCount = faker.number.int({ min: 3, max: 8 });
  const factors: PersonaDetectionFactor[] = Array.from({ length: factorCount }, () => ({
    type: faker.helpers.arrayElement(['usage_pattern', 'feature_interaction', 'payment_behavior', 'demographics', 'time_of_day']),
    value: faker.number.float({ min: 0.1, max: 1.0 }),
    weight: faker.number.float({ min: 0.1, max: 0.5 }),
    description: faker.lorem.sentence()
  }));

  return {
    persona,
    confidence,
    factors,
    updatedAt: new Date(generateTimestamp()),
    ...(previousPersona && { previousPersona })
  };
};

// ===============================
// EMAIL CAMPAIGN FACTORIES
// ===============================

export interface CreateEmailCampaignOptions {
  persona?: PersonaType;
  status?: 'draft' | 'active' | 'paused' | 'completed';
  sequences?: number;
}

export const createTestEmailCampaign = (options: CreateEmailCampaignOptions = {}): EmailCampaign => {
  const {
    persona = faker.helpers.arrayElement(PERSONA_TYPES),
    status = faker.helpers.arrayElement(['draft', 'active', 'paused', 'completed']),
    sequences = faker.number.int({ min: 1, max: 5 })
  } = options;

  const campaignId = generateId('campaign');
  const personaProfile = PERSONA_PROFILES[persona];

  return {
    id: campaignId,
    name: `${personaProfile.displayName} ${faker.lorem.words(2)}`,
    description: faker.lorem.paragraph(),
    targetPersona: persona,
    status,
    createdAt: generateTimestamp({ past: 30 }),
    updatedAt: generateTimestamp({ past: 5 }),
    sequences: Array.from({ length: sequences }, (_, i) => createTestEmailSequence({
      campaignId,
      sequenceOrder: i + 1,
      persona
    })),
    metrics: createTestCampaignMetrics({ campaignId }),
    settings: {
      sendTimeOptimization: faker.datatype.boolean(),
      personalizedSubjectLines: faker.datatype.boolean(),
      dynamicContent: faker.datatype.boolean(),
      abTestEnabled: faker.datatype.boolean()
    }
  };
};

export interface CreateEmailSequenceOptions {
  campaignId?: string;
  sequenceOrder?: number;
  persona?: PersonaType;
}

export const createTestEmailSequence = (options: CreateEmailSequenceOptions = {}): EmailSequence => {
  const {
    campaignId = generateId('campaign'),
    sequenceOrder = 1,
    persona = faker.helpers.arrayElement(PERSONA_TYPES)
  } = options;

  const personaProfile = PERSONA_PROFILES[persona];

  return {
    id: generateId('sequence'),
    campaignId,
    name: `${personaProfile.displayName} - Email ${sequenceOrder}`,
    sequenceOrder,
    triggerDelay: faker.number.int({ min: 0, max: 168 }), // 0-7 days in hours
    subject: faker.lorem.sentence(),
    htmlContent: faker.lorem.paragraphs(3, '<br><br>'),
    textContent: faker.lorem.paragraphs(3, '\n\n'),
    ctaText: faker.lorem.words(3),
    ctaUrl: faker.internet.url(),
    messagingTone: personaProfile.messagingTone,
    ctaStyle: personaProfile.ctaStyle,
    isActive: faker.datatype.boolean({ probability: 0.8 })
  };
};

export interface CreateCampaignMetricsOptions {
  campaignId?: string;
  totalSent?: number;
}

export const createTestCampaignMetrics = (options: CreateCampaignMetricsOptions = {}): CampaignMetrics => {
  const {
    campaignId = generateId('campaign'),
    totalSent = faker.number.int({ min: 100, max: 10000 })
  } = options;

  const opened = faker.number.int({ min: Math.floor(totalSent * 0.1), max: Math.floor(totalSent * 0.4) });
  const clicked = faker.number.int({ min: Math.floor(opened * 0.1), max: Math.floor(opened * 0.3) });
  const converted = faker.number.int({ min: Math.floor(clicked * 0.1), max: Math.floor(clicked * 0.2) });

  return {
    campaignId,
    totalSent,
    delivered: totalSent - faker.number.int({ min: 0, max: Math.floor(totalSent * 0.05) }),
    opened,
    clicked,
    converted,
    unsubscribed: faker.number.int({ min: 0, max: Math.floor(totalSent * 0.02) }),
    bounced: faker.number.int({ min: 0, max: Math.floor(totalSent * 0.03) }),
    openRate: opened / totalSent,
    clickRate: clicked / totalSent,
    conversionRate: converted / totalSent,
    lastUpdated: generateTimestamp({ past: 1 })
  };
};

// ===============================
// TAB PROTECTION FACTORIES
// ===============================

export interface CreateTabProtectionSettingsOptions {
  enabled?: boolean;
  customMessages?: boolean;
}

export const createTestTabProtectionSettings = (options: CreateTabProtectionSettingsOptions = {}): TabProtectionSettings => {
  const { enabled = faker.datatype.boolean({ probability: 0.7 }), customMessages = false } = options;

  const defaultMessages = {
    activeAlarmMessage: "⏰ Active Alarm - Closing this tab may cause you to miss your alarm!",
    upcomingAlarmMessage: "🔔 Upcoming Alarm - You have an alarm set soon. Stay on this tab to ensure it works!",
    enabledAlarmMessage: "✅ Alarms Enabled - This tab needs to stay open for your alarms to work properly.",
    visualWarningTitle: {
      activeAlarm: "Alarm Currently Active!",
      upcomingAlarm: "Alarm Coming Soon!"
    },
    accessibilityMessages: {
      protectionActive: "Tab protection is active due to enabled alarms",
      protectionInactive: "No tab protection needed - no active alarms",
      alarmRingingWarning: "WARNING: Alarm is currently ringing in this tab",
      upcomingAlarmWarning: "NOTICE: Upcoming alarm requires this tab to remain open"
    }
  };

  const customMessageSet = customMessages ? {
    activeAlarmMessage: faker.lorem.sentence(),
    upcomingAlarmMessage: faker.lorem.sentence(),
    enabledAlarmMessage: faker.lorem.sentence(),
    visualWarningTitle: {
      activeAlarm: faker.lorem.words(3),
      upcomingAlarm: faker.lorem.words(3)
    },
    accessibilityMessages: {
      protectionActive: faker.lorem.sentence(),
      protectionInactive: faker.lorem.sentence(),
      alarmRingingWarning: faker.lorem.sentence(),
      upcomingAlarmWarning: faker.lorem.sentence()
    }
  } : defaultMessages;

  return {
    enabled,
    protectionTiming: {
      activeAlarmWarning: faker.datatype.boolean({ probability: 0.9 }),
      upcomingAlarmWarning: faker.datatype.boolean({ probability: 0.8 }),
      upcomingAlarmThreshold: faker.number.int({ min: 15, max: 120 }),
      enabledAlarmWarning: faker.datatype.boolean({ probability: 0.6 })
    },
    customMessages: customMessageSet,
    visualSettings: {
      showVisualWarning: faker.datatype.boolean({ probability: 0.8 }),
      autoHideDelay: faker.number.int({ min: 0, max: 30 }),
      position: faker.helpers.arrayElement(['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center']),
      showAlarmDetails: faker.datatype.boolean({ probability: 0.7 }),
      maxAlarmsShown: faker.number.int({ min: 1, max: 5 })
    },
    preventNavigation: {
      beforeUnload: faker.datatype.boolean({ probability: 0.8 }),
      confirmationDialog: faker.datatype.boolean({ probability: 0.7 }),
      allowBypass: faker.datatype.boolean({ probability: 0.3 }),
      bypassMethod: faker.helpers.arrayElement(['double_click', 'long_press', 'confirmation_code'])
    },
    exceptions: {
      allowedDomains: faker.helpers.arrayElements(['relife-app.com', 'localhost', 'staging.relife.com'], 2),
      allowedPaths: ['/settings', '/help'],
      bypassKeywords: ['emergency', 'urgent']
    }
  };
};

export interface CreateTabProtectionEventOptions {
  eventType?: 'warning_shown' | 'navigation_blocked' | 'bypass_attempted' | 'settings_changed';
  userId?: string;
}

export const createTestTabProtectionEvent = (options: CreateTabProtectionEventOptions = {}): TabProtectionEvent => {
  const {
    eventType = faker.helpers.arrayElement(['warning_shown', 'navigation_blocked', 'bypass_attempted', 'settings_changed']),
    userId = generateId('user')
  } = options;

  return {
    id: generateId('tab_event'),
    userId,
    eventType,
    timestamp: generateTimestamp({ past: 7 }),
    details: {
      url: faker.internet.url(),
      userAgent: faker.internet.userAgent(),
      alarmId: generateId('alarm'),
      alarmTime: faker.date.soon({ days: 1 }).toISOString(),
      minutesUntilAlarm: faker.number.int({ min: 5, max: 240 })
    },
    metadata: {
      sessionId: generateId('session'),
      deviceType: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet']),
      browserName: faker.helpers.arrayElement(['chrome', 'firefox', 'safari', 'edge'])
    }
  };
};

// ===============================
// PERFORMANCE METRICS FACTORIES
// ===============================

export interface CreatePerformanceMetricOptions {
  metricType?: string;
  timeRange?: 'hourly' | 'daily' | 'weekly';
}

export const createTestPerformanceMetric = (options: CreatePerformanceMetricOptions = {}): PerformanceMetric => {
  const {
    metricType = faker.helpers.arrayElement(['alarm_accuracy', 'wake_success_rate', 'app_performance', 'user_engagement']),
    timeRange = faker.helpers.arrayElement(['hourly', 'daily', 'weekly'])
  } = options;

  return {
    id: generateId('metric'),
    metricType,
    value: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
    timestamp: generateTimestamp({ past: 30 }),
    metadata: {
      timeRange,
      sampleSize: faker.number.int({ min: 100, max: 10000 }),
      confidence: faker.number.float({ min: 0.8, max: 0.99 }),
      benchmarkValue: faker.number.float({ min: 70, max: 95 })
    }
  };
};

export interface CreateSystemHealthOptions {
  status?: 'healthy' | 'warning' | 'critical';
}

export const createTestSystemHealth = (options: CreateSystemHealthOptions = {}): SystemHealth => {
  const { status = weightedRandom(['healthy', 'warning', 'critical'], [0.7, 0.2, 0.1]) } = options;

  return {
    status,
    timestamp: generateTimestamp({ past: 1 }),
    metrics: {
      cpuUsage: faker.number.float({ min: 10, max: 90 }),
      memoryUsage: faker.number.float({ min: 20, max: 85 }),
      diskUsage: faker.number.float({ min: 15, max: 95 }),
      networkLatency: faker.number.float({ min: 10, max: 200 }),
      errorRate: faker.number.float({ min: 0, max: 5 }),
      uptime: faker.number.float({ min: 95, max: 99.99 })
    },
    services: {
      database: faker.helpers.arrayElement(['healthy', 'warning', 'critical']),
      cache: faker.helpers.arrayElement(['healthy', 'warning', 'critical']),
      notifications: faker.helpers.arrayElement(['healthy', 'warning', 'critical']),
      storage: faker.helpers.arrayElement(['healthy', 'warning', 'critical'])
    }
  };
};

export interface CreateFeatureUsageStatsOptions {
  feature?: string;
  timeRange?: number; // days
}

export const createTestFeatureUsageStats = (options: CreateFeatureUsageStatsOptions = {}): FeatureUsageStats => {
  const {
    feature = faker.helpers.arrayElement(['alarms', 'themes', 'voice_cloning', 'battle_mode', 'analytics']),
    timeRange = faker.number.int({ min: 7, max: 90 })
  } = options;

  const totalUsers = faker.number.int({ min: 1000, max: 50000 });
  const activeUsers = faker.number.int({ min: Math.floor(totalUsers * 0.1), max: Math.floor(totalUsers * 0.8) });

  return {
    feature,
    timeRange: `${timeRange}d`,
    totalUsers,
    activeUsers,
    usageRate: activeUsers / totalUsers,
    avgSessionsPerUser: faker.number.float({ min: 1, max: 10 }),
    avgTimePerSession: faker.number.int({ min: 60, max: 1800 }), // seconds
    topActions: [
      { action: faker.lorem.word(), count: faker.number.int({ min: 100, max: 5000 }) },
      { action: faker.lorem.word(), count: faker.number.int({ min: 50, max: 3000 }) },
      { action: faker.lorem.word(), count: faker.number.int({ min: 25, max: 2000 }) }
    ],
    conversionMetrics: {
      trialToFree: faker.number.float({ min: 0.1, max: 0.4 }),
      freeToPremium: faker.number.float({ min: 0.02, max: 0.15 }),
      premiumRetention: faker.number.float({ min: 0.6, max: 0.9 })
    }
  };
};

// Export all factories for easy testing
export const enhancedFactories = {
  createTestPersonaProfile,
  createTestPersonaDetectionResult,
  createTestEmailCampaign,
  createTestEmailSequence,
  createTestCampaignMetrics,
  createTestTabProtectionSettings,
  createTestTabProtectionEvent,
  createTestPerformanceMetric,
  createTestSystemHealth,
  createTestFeatureUsageStats
};