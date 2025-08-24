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
  PerformanceMetrics,
} from '../../types';
import {
  generateId,
  generateTimestamp,
  weightedRandom,
  randomSubset,
  generateRating,
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
  'lifetime_larry',
];

const PERSONA_PROFILES: Record<PersonaType, Omit<PersonaProfile, 'id'>> = {
  struggling_sam: {
    displayName: 'Struggling Sam',
    description: 'Free-focused users who need basic alarm functionality',
    primaryColor: '#3B82F6',
    messagingTone: 'supportive',
    ctaStyle: 'friendly',
  },
  busy_ben: {
    displayName: 'Busy Ben',
    description: 'Efficiency-driven professionals who value time-saving features',
    primaryColor: '#F59E0B',
    messagingTone: 'efficient',
    ctaStyle: 'urgent',
  },
  professional_paula: {
    displayName: 'Professional Paula',
    description: 'Feature-rich seekers who want comprehensive solutions',
    primaryColor: '#8B5CF6',
    messagingTone: 'sophisticated',
    ctaStyle: 'professional',
  },
  enterprise_emma: {
    displayName: 'Enterprise Emma',
    description: 'Team-oriented decision makers focused on organization-wide solutions',
    primaryColor: '#10B981',
    messagingTone: 'business_focused',
    ctaStyle: 'corporate',
  },
  student_sarah: {
    displayName: 'Student Sarah',
    description: 'Budget-conscious students who need affordable solutions',
    primaryColor: '#EC4899',
    messagingTone: 'casual',
    ctaStyle: 'youthful',
  },
  lifetime_larry: {
    displayName: 'Lifetime Larry',
    description: 'One-time payment preferrers who dislike subscriptions',
    primaryColor: '#F97316',
    messagingTone: 'value_focused',
    ctaStyle: 'exclusive',
  },
};

export interface CreatePersonaProfileOptions {
  persona?: PersonaType;
}

export const _createTestPersonaProfile = (
  options: CreatePersonaProfileOptions = {}
): PersonaProfile => {
  const { persona = faker.helpers.arrayElement(PERSONA_TYPES) } = options;
  const baseProfile = PERSONA_PROFILES[persona];

  return {
    id: persona,
    ...baseProfile,
  };
};

export interface CreatePersonaDetectionResultOptions {
  persona?: PersonaType;
  confidence?: number;
  previousPersona?: PersonaType;
}

export const _createTestPersonaDetectionResult = (
  options: CreatePersonaDetectionResultOptions = {}
): PersonaDetectionResult => {
  const {
    persona = faker.helpers.arrayElement(PERSONA_TYPES),
    confidence = faker.number.float({ min: 0.6, max: 0.95 }),
    previousPersona,
  } = options;

  const factorCount = faker.number.int({ min: 3, max: 8 });
  const factors: PersonaDetectionFactor[] = Array.from({ length: factorCount }, () => ({
    factor: faker.helpers.arrayElement([
      'usage_pattern',
      'feature_interaction',
      'payment_behavior',
      'demographics',
      'time_of_day',
    ]),
    value: faker.number.float({ min: 0.1, max: 1.0 }),
    weight: faker.number.float({ min: 0.1, max: 0.5 }),
    influence: faker.number.float({ min: 0.1, max: 0.9 }),
  }));

  return {
    persona,
    confidence,
    factors,
    updatedAt: new Date(generateTimestamp()),
    ...(previousPersona && { previousPersona }),
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

export const _createTestEmailCampaign = (
  options: CreateEmailCampaignOptions = {}
): EmailCampaign => {
  const {
    persona = faker.helpers.arrayElement(PERSONA_TYPES),
    status = faker.helpers.arrayElement(['draft', 'active', 'paused', 'completed']),
    sequences = faker.number.int({ min: 1, max: 5 }),
  } = options;

  const campaignId = generateId('campaign');
  const personaProfile = PERSONA_PROFILES[persona];

  return {
    id: campaignId,
    name: `${personaProfile.displayName} ${faker.lorem.words(2)}`,
    description: faker.lorem.paragraph(),
    targetPersona: persona,
    status,
    createdAt: new Date(generateTimestamp({ past: 30 })),
    updatedAt: new Date(generateTimestamp({ past: 5 })),
    sequences: Array.from({ length: sequences }, (_, i) =>
      createTestEmailSequence({
        campaignId,
        sequenceOrder: i + 1,
        _persona,
      })
    ),
    metrics: createTestCampaignMetrics({ campaignId }),
    settings: {
      sendTimeOptimization: faker.datatype.boolean(),
      personalizedSubjectLines: faker.datatype.boolean(),
      dynamicContent: faker.datatype.boolean(),
      abTestEnabled: faker.datatype.boolean(),
    },
  };
};

export interface CreateEmailSequenceOptions {
  campaignId?: string;
  sequenceOrder?: number;
  persona?: PersonaType;
}

export const _createTestEmailSequence = (
  options: CreateEmailSequenceOptions = {}
): EmailSequence => {
  const {
    campaignId = generateId('campaign'),
    sequenceOrder = 1,
    persona = faker.helpers.arrayElement(PERSONA_TYPES),
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
    isActive: faker.datatype.boolean({ probability: 0.8 }),
  };
};

export interface CreateCampaignMetricsOptions {
  campaignId?: string;
  totalSent?: number;
}

export const _createTestCampaignMetrics = (
  options: CreateCampaignMetricsOptions = {}
): CampaignMetrics => {
  const {
    campaignId = generateId('campaign'),
    totalSent = faker.number.int({ min: 100, max: 10000 }),
  } = options;

  const opened = faker.number.int({
    min: Math.floor(totalSent * 0.1),
    max: Math.floor(totalSent * 0.4),
  });
  const clicked = faker.number.int({
    min: Math.floor(opened * 0.1),
    max: Math.floor(opened * 0.3),
  });
  const converted = faker.number.int({
    min: Math.floor(clicked * 0.1),
    max: Math.floor(clicked * 0.2),
  });

  return {
    campaignId,
    totalSent,
    delivered:
      totalSent - faker.number.int({ min: 0, max: Math.floor(totalSent * 0.05) }),
    opened,
    clicked,
    converted,
    unsubscribed: faker.number.int({ min: 0, max: Math.floor(totalSent * 0.02) }),
    bounced: faker.number.int({ min: 0, max: Math.floor(totalSent * 0.03) }),
    openRate: opened / totalSent,
    clickRate: clicked / totalSent,
    conversionRate: converted / totalSent,
    lastUpdated: new Date(generateTimestamp({ past: 1 })),
  };
};

// ===============================
// PERFORMANCE METRICS FACTORIES
// ===============================

export interface CreatePerformanceMetricsOptions {
  timeRange?: 'hourly' | 'daily' | 'weekly';
}

export const _createTestPerformanceMetrics = (
  options: CreatePerformanceMetricsOptions = {}
): PerformanceMetrics => {
  const { timeRange = faker.helpers.arrayElement(['hourly', 'daily', 'weekly']) } =
    options;

  return {
    alarmAccuracy: faker.number.float({ min: 85, max: 99 }),
    wakeUpSuccess: faker.number.float({ min: 70, max: 95 }),
    avgSetupTime: faker.number.int({ min: 30, max: 300 }),
    avgSnoozeCount: faker.number.float({ min: 0.5, max: 3.0 }),
    userSatisfaction: faker.number.float({ min: 3.5, max: 5.0 }),
    bugReports: faker.number.int({ min: 0, max: 10 }),
    crashes: faker.number.int({ min: 0, max: 5 }),
    responseTime: faker.number.float({ min: 100, max: 2000 }),
    memoryUsage: faker.number.float({ min: 50, max: 500 }),
    batteryImpact: faker.number.float({ min: 1, max: 10 }),
    lastUpdated: new Date(generateTimestamp({ past: 1 })),
  };
};

// Export individual functions with proper names
export const createTestPersonaProfile = _createTestPersonaProfile;
export const createTestPersonaDetectionResult = _createTestPersonaDetectionResult;
export const createTestEmailCampaign = _createTestEmailCampaign;
export const createTestEmailSequence = _createTestEmailSequence;
export const createTestCampaignMetrics = _createTestCampaignMetrics;
export const createTestPerformanceMetrics = _createTestPerformanceMetrics;

// Export all factories for easy testing
export const _enhancedFactories = {
  createTestPersonaProfile,
  createTestPersonaDetectionResult,
  createTestEmailCampaign,
  createTestEmailSequence,
  createTestCampaignMetrics,
  createTestPerformanceMetrics,
};
// ===============================
// ENHANCED PARTIAL OVERRIDE FACTORIES
// ===============================

/**
 * Flexible PersonaDetectionResult factory with Partial override support
 */
export const _createFlexiblePersonaDetectionResult = (
  overrides: Partial<PersonaDetectionResult> = {}
): PersonaDetectionResult => {
  const base = createTestPersonaDetectionResult();
  return { ...base, ...overrides };
};

/**
 * Flexible EmailCampaign factory with Partial override support
 */
export const _createFlexibleEmailCampaign = (
  overrides: Partial<EmailCampaign> = {}
): EmailCampaign => {
  const base = createTestEmailCampaign();
  return { ...base, ...overrides };
};
