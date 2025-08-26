/**
 * Domain-specific Service Interfaces
 *
 * This file contains interfaces for specialized domain services
 * like gaming, rewards, themes, etc.
 */
import {
  MockDataRecord,
  MockDataStore,
  PointTransaction,
  RewardCondition,
  RewardData,
  UserReward,
} from '../../types/common-types';

import { BaseService, ServiceConfig } from './service-architecture';
import { User } from './index';

// ============================================================================
// Gaming and Rewards Services
// ============================================================================

export interface IRewardService extends BaseService {
  // Reward Management
  createReward(
    reward: Omit<RewardData, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RewardData>;

  // User Rewards
  grantReward(userId: string, rewardId: string, reason?: string): Promise<void>;
  revokeReward(userId: string, rewardId: string): Promise<void>;
  getUserRewards(userId: string): Promise<UserReward[]>;

  // Achievement System
  checkAchievements(
    userId: string,
    context: string,
    data: Record<string, unknown>
  ): Promise<RewardData[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<void>;

  // Point System
  addPoints(userId: string, points: number, source: string): Promise<void>;
  deductPoints(userId: string, points: number, reason: string): Promise<boolean>;
  getPointBalance(userId: string): Promise<number>;
  getPointHistory(userId: string, limit?: number): Promise<PointTransaction[]>;
}

export interface IGamificationService extends BaseService {
  // Level System
  calculateLevel(experience: number): number;
  getExperienceForLevel(level: number): number;
  addExperience(userId: string, experience: number, source: string): Promise<void>;

  // Streak Tracking
  updateStreak(userId: string, actionType: string): Promise<number>;
  getStreak(userId: string, actionType: string): Promise<number>;
  resetStreak(userId: string, actionType: string): Promise<void>;

  // Challenges
  createChallenge(challenge: {
    name: string;
    description: string;
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    startDate: Date;
    endDate: Date;
    rewards: MockDataRecord[];
    requirements: MockDataRecord[];
  }): Promise<unknown>;

  getUserChallenges(userId: string): Promise<any[]>;
  completeChallenge(userId: string, challengeId: string): Promise<void>;

  // Leaderboards
  getLeaderboard(
    type: string,
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all'
  ): Promise<any[]>;
  getUserRanking(userId: string, type: string): Promise<number>;
}

// ============================================================================
// Theme and Customization Services
// ============================================================================

export interface IThemeService extends BaseService {
  // Theme Management
  getAvailableThemes(): Promise<any[]>;
  getCurrentTheme(userId: string): Promise<unknown>;
  setTheme(userId: string, themeId: string): Promise<void>;

  // Custom Themes
  createCustomTheme(
    userId: string,
    theme: {
      name: string;
      colors: Record<string, string>;
      fonts: Record<string, string>;
      sounds?: Record<string, string>;
    }
  ): Promise<unknown>;

  updateCustomTheme(
    userId: string,
    themeId: string,
    updates: unknown
  ): Promise<unknown>;
  deleteCustomTheme(userId: string, themeId: string): Promise<void>;

  // Theme Assets
  uploadThemeAsset(
    userId: string,
    themeId: string,
    assetType: string,
    file: Blob
  ): Promise<string>;
  getThemeAssets(themeId: string): Promise<any[]>;

  // Premium Themes
  purchaseTheme(userId: string, themeId: string): Promise<void>;
  getUserPurchasedThemes(userId: string): Promise<any[]>;
}

// ============================================================================
// AI and Intelligence Services
// ============================================================================

export interface IEmotionalIntelligenceService extends BaseService {
  // Mood Analysis
  analyzeMood(
    userId: string,
    context: {
      timeOfDay: string;
      sleepQuality?: number;
      stressLevel?: number;
      recentActivities?: string[];
    }
  ): Promise<{
    mood: 'happy' | 'sad' | 'anxious' | 'excited' | 'calm' | 'frustrated';
    confidence: number;
    recommendations: string[];
  }>;

  // Emotional Messages
  generateEmotionalMessage(
    userId: string,
    scenario: string,
    mood: string
  ): Promise<{
    title: string;
    message: string;
    tone: string;
  }>;

  // Behavior Patterns
  analyzeUserBehavior(
    userId: string,
    timeframe: number
  ): Promise<{
    patterns: MockDataRecord[];
    insights: string[];
    recommendations: string[];
  }>;

  // Personalization
  getPersonalizationSuggestions(userId: string): Promise<{
    alarmTimes: string[];
    voiceMoods: string[];
    themes: string[];
    challenges: string[];
  }>;
}

export interface IRecommendationService extends BaseService {
  // Content Recommendations
  getRecommendations(
    userId: string,
    type: 'alarms' | 'themes' | 'challenges' | 'battles'
  ): Promise<any[]>;

  // Smart Scheduling
  suggestOptimalAlarmTimes(
    userId: string,
    preferences: {
      wakeUpGoal: Date;
      sleepDuration: number;
      flexibility: number;
    }
  ): Promise<{
    recommended: Date[];
    reasoning: string[];
  }>;

  // Usage Optimization
  analyzeUsagePatterns(userId: string): Promise<{
    mostActiveHours: number[];
    preferredFeatures: string[];
    optimizationSuggestions: string[];
  }>;

  // Collaborative Filtering
  findSimilarUsers(userId: string): Promise<string[]>;
  getCollaborativeRecommendations(userId: string): Promise<any[]>;
}

// ============================================================================
// Health and Wellness Services
// ============================================================================

export interface ISleepTrackingService extends BaseService {
  // Sleep Data
  recordSleepData(
    userId: string,
    sleepData: {
      bedtime: Date;
      sleepTime: Date;
      wakeTime: Date;
      quality: number; // 1-10 scale
      interruptions: number;
      notes?: string;
    }
  ): Promise<void>;

  getSleepData(userId: string, startDate?: Date, endDate?: Date): Promise<any[]>;
  getSleepSummary(
    userId: string,
    timeframe: 'week' | 'month' | 'year'
  ): Promise<unknown>;

  // Sleep Analysis
  analyzeSleepPatterns(userId: string): Promise<{
    averageSleepDuration: number;
    averageQuality: number;
    trends: MockDataRecord[];
    recommendations: string[];
  }>;

  // Sleep Goals
  setSleepGoals(
    userId: string,
    goals: {
      targetSleepDuration: number;
      targetBedtime: string;
      targetWakeTime: string;
    }
  ): Promise<void>;

  getSleepGoalProgress(userId: string): Promise<unknown>;
}

export interface IWellnessService extends BaseService {
  // Wellness Tracking
  recordWellnessMetric(
    userId: string,
    metric: {
      type: 'stress' | 'energy' | 'mood' | 'productivity';
      value: number;
      timestamp: Date;
      notes?: string;
    }
  ): Promise<void>;

  getWellnessMetrics(userId: string, type?: string, timeframe?: number): Promise<any[]>;

  // Wellness Goals
  setWellnessGoals(userId: string, goals: Record<string, number>): Promise<void>;
  getWellnessProgress(userId: string): Promise<unknown>;

  // Insights and Reports
  generateWellnessReport(
    userId: string,
    timeframe: 'week' | 'month' | 'quarter'
  ): Promise<{
    summary: unknown;
    trends: MockDataRecord[];
    recommendations: string[];
    achievements: MockDataRecord[];
  }>;
}

// ============================================================================
// Integration and External Services
// ============================================================================

export interface ICalendarService extends BaseService {
  // Calendar Integration
  connectCalendar(
    userId: string,
    provider: 'google' | 'outlook' | 'apple',
    credentials: unknown
  ): Promise<void>;
  disconnectCalendar(userId: string, provider: string): Promise<void>;

  // Event Management
  getUpcomingEvents(userId: string, hours: number): Promise<any[]>;
  createEvent(
    userId: string,
    event: {
      title: string;
      start: Date;
      end: Date;
      description?: string;
      location?: string;
    }
  ): Promise<unknown>;

  // Smart Scheduling
  findOptimalMeetingTimes(
    userIds: string[],
    duration: number,
    preferences?: any
  ): Promise<Date[]>;

  // Alarm Integration
  syncAlarmsWithCalendar(userId: string): Promise<void>;
  createAlarmFromEvent(
    userId: string,
    eventId: string,
    offsetMinutes: number
  ): Promise<unknown>;
}

export interface IWeatherService extends BaseService {
  // Weather Data
  getCurrentWeather(location: { lat: number; lng: number } | string): Promise<{
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    visibility: number;
  }>;

  getWeatherForecast(
    location: { lat: number; lng: number } | string,
    days: number
  ): Promise<any[]>;

  // Location Services
  getUserLocation(userId: string): Promise<{ lat: number; lng: number } | null>;
  setUserLocation(
    userId: string,
    location: { lat: number; lng: number }
  ): Promise<void>;

  // Weather-based Features
  getWeatherBasedRecommendations(userId: string): Promise<{
    alarmAdjustments: MockDataRecord[];
    clothingRecommendations: string[];
    activitySuggestions: string[];
  }>;
}

// ============================================================================
// Cloud and Synchronization Services
// ============================================================================

export interface ICloudSyncService extends BaseService {
  // Data Synchronization
  syncUserData(userId: string): Promise<void>;
  forceSyncAll(userId: string): Promise<void>;

  // Sync Status
  getSyncStatus(userId: string): Promise<{
    lastSync: Date;
    pendingChanges: number;
    conflicts: MockDataRecord[];
  }>;

  // Conflict Resolution
  resolveConflict(
    userId: string,
    conflictId: string,
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<void>;

  // Backup and Restore
  createBackup(userId: string): Promise<string>; // Returns backup ID
  restoreBackup(userId: string, backupId: string): Promise<void>;
  getBackupHistory(userId: string): Promise<any[]>;

  // Cross-device Sync
  registerDevice(
    userId: string,
    device: {
      id: string;
      name: string;
      type: 'mobile' | 'desktop' | 'tablet';
      platform: string;
    }
  ): Promise<void>;

  getRegisteredDevices(userId: string): Promise<any[]>;
  removeDevice(userId: string, deviceId: string): Promise<void>;
}

// ============================================================================
// Service Event Types
// ============================================================================

export interface ServiceEventData {
  // Alarm Events
  'alarm:created': { alarmId: string; userId: string };
  'alarm:updated': { alarmId: string; userId: string };
  'alarm:deleted': { alarmId: string; userId: string };
  'alarm:triggered': { alarmId: string; userId: string };
  'alarm:dismissed': { alarmId: string; userId: string; method: string };
  'alarm:snoozed': { alarmId: string; userId: string; duration: number };

  // User Events
  'user:login': { userId: string };
  'user:logout': { userId: string };
  'user:subscription_changed': { userId: string; oldPlan: string; newPlan: string };

  // System Events
  'system:maintenance_start': { message: string };
  'system:maintenance_end': { message: string };
  'service:health_check': { serviceName: string; status: string };
}

export type ServiceEventType = keyof ServiceEventData;

export interface IServiceEventBus extends BaseService {
  // Event Publishing
  publish<T extends ServiceEventType>(
    eventType: T,
    data: ServiceEventData[T]
  ): Promise<void>;

  // Event Subscription
  subscribe<T extends ServiceEventType>(
    eventType: T,
    handler: (data: ServiceEventData[T]) => void | Promise<void>
  ): string; // Returns subscription ID
  unsubscribe(subscriptionId: string): void;

  // Event History
  getEventHistory(
    eventType?: ServiceEventType,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]>;
}
