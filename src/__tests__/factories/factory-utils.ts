/**
 * Factory Utilities
 *
 * Common utilities and helpers for generating consistent mock data
 * Used across all factory modules.
 */

import { faker } from '@faker-js/faker';

// Seed faker for deterministic tests when needed
export const seedFaker = (seed?: number) => {
  if (seed) {
    faker.seed(seed);
  }
};

// Generate consistent IDs
export const generateId = (prefix = '') => {
  return prefix ? `${prefix}_${faker.string.uuid()}` : faker.string.uuid();
};

// Generate realistic timestamps
export function generateTimestamp(options: { past?: number; future?: number; format: 'date' }): Date;
export function generateTimestamp(options?: { past?: number; future?: number; format?: 'iso' }): string;
export function generateTimestamp(options?: {
  past?: number;
  future?: number;
  format?: 'iso' | 'date';
}): string | Date {
  const { past = 0, future = 0, format = 'iso' } = options || {};

  let date: Date;
  if (past) {
    date = faker.date.recent({ days: past });
  } else if (future) {
    date = faker.date.soon({ days: future });
  } else {
    date = faker.date.anytime();
  }

  return format === 'date' ? date : date.toISOString();
}

// Generate realistic time strings (HH:MM format)
export const generateTimeString = () => {
  const hour = faker.number.int({ min: 0, max: 23 });
  const minute = faker.number.int({ min: 0, max: 59 });
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Common data sets for consistency
export const COMMON_DATA = {
  voiceMoods: [
    'drill-sergeant',
    'sweet-angel',
    'anime-hero',
    'savage-roast',
    'motivational',
    'gentle',
    'demon-lord', // Premium
    'ai-robot', // Premium
    'comedian', // Premium
    'philosopher' // Premium
  ] as const,

  subscriptionTiers: [
    'free',
    'basic',
    'premium',
    'pro',
    'enterprise'
  ] as const,

  subscriptionStatuses: [
    'active',
    'canceled',
    'past_due',
    'unpaid',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'paused'
  ] as const,

  battleTypes: [
    'speed',
    'consistency',
    'tasks',
    'bragging',
    'group',
    'tournament',
    'team'
  ] as const,

  battleStatuses: [
    'pending',
    'active',
    'completed',
    'cancelled',
    'registration'
  ] as const,

  themeCategories: [
    'nature',
    'minimal',
    'dark',
    'colorful',
    'gaming',
    'professional',
    'seasonal',
    'custom'
  ] as const,

  alarmDifficulties: [
    'easy',
    'medium',
    'hard',
    'nightmare'
  ] as const,

  achievementRarities: [
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary'
  ] as const,

  emotionTypes: [
    'happy',
    'sad',
    'worried',
    'excited',
    'lonely',
    'proud',
    'sleepy'
  ] as const,

  emotionalTones: [
    'encouraging',
    'playful',
    'firm',
    'roast'
  ] as const
};

// Generate random array subset
export const randomSubset = <T>(array: readonly T[], min = 1, max?: number): T[] => {
  const maxItems = max || array.length;
  const count = faker.number.int({ min, max: Math.min(maxItems, array.length) });
  return faker.helpers.arrayElements([...array], count);
};

// Generate weighted random selection
export const weightedRandom = <T>(items: Array<{ item: T; weight: number }>): T => {
  const totalWeight = items.reduce((sum, { weight }) => sum + weight, 0);
  let random = faker.number.float() * totalWeight;

  for (const { item, weight } of items) {
    random -= weight;
    if (random <= 0) return item;
  }

  return items[items.length - 1].item;
};

// Generate realistic phone numbers
export const generatePhoneNumber = () => {
  return faker.phone.number({ style: 'national' });
};

// Generate realistic URLs
export const generateUrl = (domain = 'relife.app') => {
  return `https://${faker.internet.domainWord()}.${domain}`;
};

// Generate hex colors
export const generateHexColor = () => {
  return faker.internet.color();
};

// Generate currency amounts in cents
export const generatePriceCents = (min = 99, max = 9999) => {
  return faker.number.int({ min, max });
};

// Generate realistic usernames
export const generateUsername = () => {
  const patterns = [
    () => faker.internet.username().toLowerCase(),
    () => `${faker.word.adjective()}${faker.word.noun()}${faker.number.int({ min: 1, max: 999 })}`,
    () => `${faker.person.firstName().toLowerCase()}_${faker.word.noun()}`,
    () => `${faker.word.noun()}_${faker.number.int({ min: 1000, max: 9999 })}`
  ];

  return faker.helpers.arrayElement(patterns)();
};

// Generate experience points with realistic distribution
export const generateExperience = () => {
  // Most users are low level, few are high level (exponential distribution)
  const level = Math.floor(Math.random() * Math.random() * 100) + 1;
  return level * 100 + faker.number.int({ min: 0, max: 99 });
};

// Generate realistic ratings (skewed towards higher ratings)
export const generateRating = () => {
  // Beta distribution approximation for ratings (most ratings are 4-5 stars)
  const random1 = Math.random();
  const random2 = Math.random();
  const beta = Math.pow(random1, 0.5) * Math.pow(random2, 0.2);
  return Math.round((beta * 4 + 1) * 10) / 10; // 1.0 to 5.0
};

// Generate alarm time with realistic distribution
export const generateRealisticAlarmTime = () => {
  // Most alarms are between 6 AM and 9 AM
  const isNormal = Math.random() < 0.7;

  if (isNormal) {
    const hour = faker.number.int({ min: 6, max: 9 });
    const minute = faker.helpers.arrayElement([0, 15, 30, 45]); // Common minute intervals
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  } else {
    // Some people have unusual schedules
    return generateTimeString();
  }
};

// Generate days of week for alarms (more realistic patterns)
export const generateRealisticAlarmDays = () => {
  const patterns = [
    [1, 2, 3, 4, 5], // Weekdays only (most common)
    [0, 1, 2, 3, 4, 5, 6], // Every day
    [1, 3, 5], // Mon/Wed/Fri
    [2, 4], // Tue/Thu
    [0, 6], // Weekends only
    [1, 2, 3, 4], // Mon-Thu
  ];

  return faker.helpers.arrayElement(patterns);
};

// Generate realistic battle duration
export const generateBattleDuration = () => {
  // Most battles are 1-7 days
  const durations = [
    { item: 1, weight: 30 }, // Daily challenges
    { item: 3, weight: 25 }, // 3-day challenges
    { item: 7, weight: 20 }, // Weekly challenges
    { item: 14, weight: 15 }, // Bi-weekly
    { item: 30, weight: 10 }, // Monthly
  ];

  return weightedRandom(durations);
};

// Reset faker to random seed
export const resetFaker = () => {
  faker.seed();
};