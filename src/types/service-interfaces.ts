/**
 * Enhanced Service Interfaces for Dependency Injection System
 *
 * This file contains strongly-typed interfaces for all core services
 * used in the dependency injection container.
 */

import { BaseService, ServiceConfig } from './service-architecture';
import { Alarm, User, VoiceMood } from './index';

// ============================================================================
// Core Service Interfaces
// ============================================================================

export interface IAlarmService extends BaseService {
  // CRUD Operations
  createAlarm(data: {
    time: string;
    label: string;
    days: number[];
    voiceMood: VoiceMood;
    sound?: string;
    difficulty?: string;
    snoozeEnabled?: boolean;
    snoozeInterval?: number;
    maxSnoozes?: number;
    battleId?: string;
    userId?: string;
    weatherEnabled?: boolean;
  }): Promise<Alarm>;

  updateAlarm(alarmId: string, data: Partial<Alarm>): Promise<Alarm>;
  deleteAlarm(alarmId: string, userId?: string): Promise<void>;
  toggleAlarm(alarmId: string, enabled: boolean): Promise<Alarm>;

  // Query Operations
  loadAlarms(userId?: string): Promise<Alarm[]>;
  getAlarms(): Alarm[];
  getAlarmById(id: string): Alarm | undefined;
  getUserAlarms(userId: string): Alarm[];
  getBattleAlarms(userId: string): Alarm[];
  getNonBattleAlarms(userId: string): Alarm[];

  // Alarm Actions
  dismissAlarm(
    alarmId: string,
    method: 'voice' | 'button' | 'shake' | 'challenge',
    user?: User
  ): Promise<void>;
  snoozeAlarm(alarmId: string, minutes?: number, user?: User): Promise<void>;

  // Battle Integration
  createBattleAlarm(data: {
    time: string;
    label: string;
    days: number[];
    voiceMood: VoiceMood;
    battleId: string;
    userId: string;
    difficulty?: string;
  }): Promise<Alarm>;
  unlinkAlarmFromBattle(alarmId: string): Promise<void>;

  // Validation and Security
  validateAlarmOwnership(alarmId: string, userId: string): boolean;
}

export interface IAnalyticsService extends BaseService {
  // Event Tracking
  track(event: string, properties?: Record<string, any>): Promise<void>;
  identify(userId: string, traits?: Record<string, any>): Promise<void>;
  page(name: string, properties?: Record<string, any>): Promise<void>;

  // User Analytics
  trackUserAction(
    userId: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<void>;
  trackPerformanceMetric(
    metric: string,
    value: number,
    tags?: Record<string, string>
  ): Promise<void>;

  // Queue Management
  flush(): Promise<void>;
  getQueueSize(): number;

  // Configuration
  updateConfiguration(config: Partial<ServiceConfig>): Promise<void>;
}

export interface ISubscriptionService extends BaseService {
  // Subscription Management
  getSubscription(userId: string): Promise<any>; // TODO: Define Subscription type
  createSubscription(data: any): Promise<any>;
  updateSubscription(id: string, updates: any): Promise<any>;
  cancelSubscription(id: string): Promise<void>;

  // Feature Access
  checkFeatureAccess(userId: string, feature: string): Promise<boolean>;
  getFeatureLimits(userId: string): Promise<Record<string, number>>;

  // Premium Features
  upgradeSubscription(userId: string, planId: string): Promise<any>;
  downgradeSubscription(userId: string, planId: string): Promise<any>;
}

export interface IVoiceService extends BaseService {
  // Speech Synthesis
  speak(
    text: string,
    options?: {
      voiceId?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
    }
  ): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;

  // Voice Management
  getVoices(): Promise<SpeechSynthesisVoice[]>;
  setVoice(voiceId: string): Promise<void>;
  setDefaultVoice(userId: string, voiceId: string): Promise<void>;

  // Audio Generation
  generateAudio(text: string, voiceId: string): Promise<string>;

  // Voice Cloning (Premium)
  cloneVoice(userId: string, audioSample: Blob): Promise<string>;
  deleteClonedVoice(userId: string, voiceId: string): Promise<void>;
}

export interface IBattleService extends BaseService {
  // Battle Management
  createBattle(config: {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    maxParticipants?: number;
    isPublic?: boolean;
    createdBy: string;
  }): Promise<any>; // TODO: Define Battle type

  joinBattle(battleId: string, userId: string): Promise<any>;
  leaveBattle(battleId: string, userId: string): Promise<void>;

  // Battle Progress
  updateBattleProgress(
    battleId: string,
    userId: string,
    progress: {
      alarmsCompleted: number;
      streak: number;
      score: number;
    }
  ): Promise<void>;

  getBattleLeaderboard(battleId: string): Promise<any[]>;
  getBattleHistory(userId: string): Promise<any[]>;

  // Battle Lifecycle
  startBattle(battleId: string): Promise<void>;
  endBattle(battleId: string): Promise<any>;
}

// ============================================================================
// Storage and Cache Services
// ============================================================================

export interface IStorageService extends BaseService {
  // Generic Storage
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;

  // Batch Operations
  getMany<T>(keys: string[]): Promise<(T | null)[]>;
  setMany<T>(items: Array<{ key: string; value: T; ttl?: number }>): Promise<void>;
  deleteMany(keys: string[]): Promise<boolean[]>;

  // Key Management
  keys(pattern?: string): Promise<string[]>;
  exists(key: string): Promise<boolean>;

  // User-scoped Storage
  getUserData<T>(userId: string, key: string): Promise<T | null>;
  setUserData<T>(userId: string, key: string, value: T): Promise<void>;
  deleteUserData(userId: string, key: string): Promise<boolean>;
}

export interface ICacheService extends BaseService {
  // Cache Operations
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;

  // Cache Statistics
  getStats(): Promise<{
    hitRate: number;
    missRate: number;
    size: number;
    maxSize: number;
  }>;

  // Cache Management
  evict(strategy?: 'lru' | 'lfu' | 'ttl'): Promise<number>;
  warmup(keys: string[]): Promise<void>;
}

// ============================================================================
// Security and Authentication Services
// ============================================================================

export interface ISecurityService extends BaseService {
  // Rate Limiting
  checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean;

  // Data Encryption
  encrypt(data: string): Promise<string>;
  decrypt(encryptedData: string): Promise<string>;

  // Token Management
  generateToken(payload: any, expiresIn?: string): Promise<string>;
  verifyToken(token: string): Promise<any>;
  revokeToken(token: string): Promise<void>;

  // Security Monitoring
  logSecurityEvent(event: string, details: any): void;
  getSecurityEvents(startDate?: Date, endDate?: Date): Promise<any[]>;
}

// ============================================================================
// Notification and Communication Services
// ============================================================================

export interface INotificationService extends BaseService {
  // Push Notifications
  sendPushNotification(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, any>;
      icon?: string;
      badge?: string;
    }
  ): Promise<void>;

  // Local Notifications
  scheduleLocalNotification(notification: {
    id: number;
    title: string;
    body: string;
    schedule: Date;
    data?: Record<string, any>;
  }): Promise<void>;

  cancelLocalNotification(id: number): Promise<void>;

  // Subscription Management
  subscribeUser(userId: string, subscription: any): Promise<void>;
  unsubscribeUser(userId: string): Promise<void>;

  // Notification Templates
  sendTemplate(
    userId: string,
    templateId: string,
    data: Record<string, any>
  ): Promise<void>;
}

// ============================================================================
// Audio and Media Services
// ============================================================================

export interface IAudioService extends BaseService {
  // Audio Playback
  play(
    audioUrl: string,
    options?: {
      volume?: number;
      loop?: boolean;
      fadeIn?: number;
    }
  ): Promise<void>;

  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;

  // Audio Management
  preload(audioUrls: string[]): Promise<void>;
  setVolume(volume: number): Promise<void>;

  // Sound Effects
  playSystemSound(soundType: 'success' | 'error' | 'warning' | 'info'): Promise<void>;

  // Custom Sounds
  uploadCustomSound(userId: string, audioFile: Blob, name: string): Promise<string>;
  getCustomSounds(userId: string): Promise<any[]>;
  deleteCustomSound(userId: string, soundId: string): Promise<void>;
}

// ============================================================================
// Performance and Monitoring Services
// ============================================================================

export interface IPerformanceService extends BaseService {
  // Metrics Collection
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
  recordTiming(name: string, startTime: number, endTime?: number): void;

  // Performance Monitoring
  startTimer(name: string): string; // Returns timer ID
  endTimer(timerId: string): number; // Returns elapsed time

  // Memory Monitoring
  getMemoryUsage(): Promise<{
    used: number;
    total: number;
    percentage: number;
  }>;

  // Performance Reports
  getPerformanceReport(startDate?: Date, endDate?: Date): Promise<any>;
}

// ============================================================================
// Service Factory Types
// ============================================================================

export interface IServiceFactory<T extends BaseService> {
  create(dependencies: Map<string, BaseService>, config: ServiceConfig): T;
}

// Service factory function type
export type ServiceFactoryFunction<T extends BaseService> = (
  dependencies: Map<string, BaseService>,
  config: ServiceConfig
) => T;

// ============================================================================
// Service Registration Types
// ============================================================================

export interface ServiceRegistrationOptions {
  name: string;
  singleton?: boolean;
  dependencies?: string[];
  tags?: string[];
  config?: Partial<ServiceConfig>;
  factory: IServiceFactory<any> | ServiceFactoryFunction<any>;
}

// ============================================================================
// Service Discovery and Health
// ============================================================================

export interface IServiceDiscovery extends BaseService {
  // Service Registration
  registerService(registration: ServiceRegistrationOptions): Promise<void>;
  unregisterService(name: string): Promise<void>;

  // Service Discovery
  findService(name: string): Promise<BaseService | null>;
  findServicesByTag(tag: string): Promise<BaseService[]>;

  // Health Monitoring
  checkServiceHealth(name: string): Promise<any>;
  getSystemHealth(): Promise<any>;
}
