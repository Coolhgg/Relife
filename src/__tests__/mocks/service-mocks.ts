/**
 * Comprehensive Service Mocks - Legacy and Enhanced
 * Provides both legacy singleton patterns and new enhanced service mocks with dependency injection
 * 
 * MIGRATION NOTICE:
 * - Legacy static service mocks are maintained for backward compatibility
 * - New tests should use enhanced service mocks from './enhanced-service-mocks'
 * - Enhanced mocks support dependency injection and BaseService patterns
 */

import type {
  Alarm,
  User,
  Subscription,
  SubscriptionStatus,
  PremiumFeatureAccess,
  Battle,
  AnalyticsEvent,
  VoiceMood,
} from '../../types';

// Mock data storage
const mockStorage = new Map<string, any>();
const mockTimers = new Map<string, NodeJS.Timeout>();

// Utility functions for mock services
export class MockServiceUtils {
  static generateId(prefix: string = 'mock'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static randomBool(probability: number = 0.5): boolean {
    return Math.random() < probability;
  }

  static setCacheEntry(key: string, value: any, ttl: number = 300000): void {
    mockStorage.set(key, value);
    mockStorage.set(`${key}_expiry`, Date.now() + ttl);
  }

  static getCacheEntry<T>(key: string): T | null {
    const expiry = mockStorage.get(`${key}_expiry`);
    if (expiry && Date.now() > expiry) {
      mockStorage.delete(key);
      mockStorage.delete(`${key}_expiry`);
      return null;
    }
    return mockStorage.get(key) || null;
  }

  static clearCache(): void {
    mockStorage.clear();
  }
}

// Mock AlarmService
export class MockAlarmService {
  private static instance: MockAlarmService;
  private static alarms: Alarm[] = [];
  private static checkInterval: NodeJS.Timeout | null = null;
  private static callHistory: Array<{ method: string; args: any[]; timestamp: number }> = [];

  static getInstance(): MockAlarmService {
    if (!this.instance) {
      this.instance = new MockAlarmService();
    }
    return this.instance;
  }

  static reset(): void {
    this.alarms = [];
    this.callHistory = [];
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    MockServiceUtils.clearCache();
  }

  static getCallHistory(): Array<{ method: string; args: any[]; timestamp: number }> {
    return [...this.callHistory];
  }

  private static logCall(method: string, args: any[]): void {
    this.callHistory.push({
      method,
      args: args.map(arg => typeof arg === 'object' ? JSON.parse(JSON.stringify(arg)) : arg),
      timestamp: Date.now(),
    });
  }

  static async loadAlarms(userId?: string): Promise<Alarm[]> {
    this.logCall('loadAlarms', [userId]);
    
    const cacheKey = `alarms_${userId || 'anonymous'}`;
    const cached = MockServiceUtils.getCacheEntry<Alarm[]>(cacheKey);
    if (cached) {
      this.alarms = cached;
      return cached;
    }

    // Simulate loading delay
    await MockServiceUtils.delay(100);

    // Return mock alarms
    const mockAlarms: Alarm[] = [
      {
        id: MockServiceUtils.generateId('alarm'),
        userId: userId || 'test-user',
        time: '07:00:00',
        label: 'Morning Workout',
        days: [1, 2, 3, 4, 5],
        isActive: true,
        voiceMood: 'motivational' as VoiceMood,
        soundFile: 'energetic_beep.wav',
        difficulty: 'medium',
        snoozeEnabled: true,
        snoozeInterval: 5,
        maxSnoozes: 3,
        battleModeEnabled: false,
        smartSchedulingEnabled: false,
        locationBased: false,
        weatherAdaptive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: MockServiceUtils.generateId('alarm'),
        userId: userId || 'test-user',
        time: '22:00:00',
        label: 'Evening Wind Down',
        days: [0, 1, 2, 3, 4, 5, 6],
        isActive: true,
        voiceMood: 'calm' as VoiceMood,
        soundFile: 'gentle_bells.wav',
        difficulty: 'easy',
        snoozeEnabled: false,
        snoozeInterval: 0,
        maxSnoozes: 0,
        battleModeEnabled: false,
        smartSchedulingEnabled: true,
        locationBased: false,
        weatherAdaptive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.alarms = mockAlarms;
    MockServiceUtils.setCacheEntry(cacheKey, mockAlarms);
    
    return mockAlarms;
  }

  static async saveAlarms(userId?: string): Promise<void> {
    this.logCall('saveAlarms', [userId]);
    
    // Simulate save delay
    await MockServiceUtils.delay(50);
    
    const cacheKey = `alarms_${userId || 'anonymous'}`;
    MockServiceUtils.setCacheEntry(cacheKey, this.alarms);
  }

  static async addAlarm(alarm: Partial<Alarm>): Promise<Alarm> {
    this.logCall('addAlarm', [alarm]);
    
    const newAlarm: Alarm = {
      id: MockServiceUtils.generateId('alarm'),
      userId: alarm.userId || 'test-user',
      time: alarm.time || '07:00:00',
      label: alarm.label || 'New Alarm',
      days: alarm.days || [1, 2, 3, 4, 5],
      isActive: alarm.isActive ?? true,
      voiceMood: alarm.voiceMood || 'neutral',
      soundFile: alarm.soundFile || 'default.wav',
      difficulty: alarm.difficulty || 'medium',
      snoozeEnabled: alarm.snoozeEnabled ?? true,
      snoozeInterval: alarm.snoozeInterval || 5,
      maxSnoozes: alarm.maxSnoozes || 3,
      battleModeEnabled: alarm.battleModeEnabled ?? false,
      smartSchedulingEnabled: alarm.smartSchedulingEnabled ?? false,
      locationBased: alarm.locationBased ?? false,
      weatherAdaptive: alarm.weatherAdaptive ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...alarm,
    };

    this.alarms.push(newAlarm);
    await this.saveAlarms(newAlarm.userId);
    
    return newAlarm;
  }

  static async updateAlarm(id: string, updates: Partial<Alarm>): Promise<Alarm> {
    this.logCall('updateAlarm', [id, updates]);
    
    const alarmIndex = this.alarms.findIndex(alarm => alarm.id === id);
    if (alarmIndex === -1) {
      throw new Error(`Alarm with id ${id} not found`);
    }

    const updatedAlarm = {
      ...this.alarms[alarmIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.alarms[alarmIndex] = updatedAlarm;
    await this.saveAlarms(updatedAlarm.userId);
    
    return updatedAlarm;
  }

  static async deleteAlarm(id: string): Promise<void> {
    this.logCall('deleteAlarm', [id]);
    
    const alarmIndex = this.alarms.findIndex(alarm => alarm.id === id);
    if (alarmIndex === -1) {
      throw new Error(`Alarm with id ${id} not found`);
    }

    const deletedAlarm = this.alarms[alarmIndex];
    this.alarms.splice(alarmIndex, 1);
    await this.saveAlarms(deletedAlarm.userId);
  }

  static getAlarms(): Alarm[] {
    return [...this.alarms];
  }

  static startAlarmChecker(): void {
    this.logCall('startAlarmChecker', []);
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      // Mock alarm checking logic
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
      const currentDay = now.getDay();

      this.alarms.forEach(alarm => {
        if (alarm.isActive && alarm.time === currentTime && alarm.days.includes(currentDay)) {
          this.logCall('alarmTriggered', [alarm.id]);
        }
      });
    }, 1000);
  }

  static stopAlarmChecker(): void {
    this.logCall('stopAlarmChecker', []);
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Mock SubscriptionService
export class MockSubscriptionService {
  private static cache = new Map<string, any>();
  private static cacheExpiry = new Map<string, number>();
  private static callHistory: Array<{ method: string; args: any[]; timestamp: number }> = [];
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static reset(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    this.callHistory = [];
  }

  static getCallHistory(): Array<{ method: string; args: any[]; timestamp: number }> {
    return [...this.callHistory];
  }

  private static logCall(method: string, args: any[]): void {
    this.callHistory.push({
      method,
      args: args.map(arg => typeof arg === 'object' ? JSON.parse(JSON.stringify(arg)) : arg),
      timestamp: Date.now(),
    });
  }

  private static getCachedData<T>(key: string): T | null {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  private static setCachedData<T>(key: string, value: T): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    this.logCall('getUserSubscription', [userId]);
    
    const cacheKey = `subscription_${userId}`;
    const cached = this.getCachedData<Subscription>(cacheKey);
    if (cached) {
      return cached;
    }

    // Simulate API delay
    await MockServiceUtils.delay(200);

    // Mock subscription based on userId
    if (userId.includes('premium')) {
      const subscription: Subscription = {
        id: MockServiceUtils.generateId('sub'),
        userId,
        tier: 'premium',
        status: 'active' as SubscriptionStatus,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialEnd: undefined,
        cancelAtPeriodEnd: false,
        canceledAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        stripeCustomerId: 'cus_' + MockServiceUtils.generateId(),
        stripeSubscriptionId: 'sub_' + MockServiceUtils.generateId(),
        stripePriceId: 'price_premium_monthly',
      };

      this.setCachedData(cacheKey, subscription);
      return subscription;
    }

    return null; // Free user
  }

  static async checkFeatureAccess(userId: string, feature: keyof PremiumFeatureAccess): Promise<{
    hasAccess: boolean;
    reason?: string;
    upgradeRequired?: boolean;
    currentUsage?: number;
    limit?: number;
  }> {
    this.logCall('checkFeatureAccess', [userId, feature]);
    
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription || subscription.status !== 'active') {
      return {
        hasAccess: false,
        reason: 'Premium subscription required',
        upgradeRequired: true,
      };
    }

    // Mock feature limits
    const featureLimits: Record<string, number> = {
      elevenlabsVoices: 100,
      customVoiceMessages: 50,
      advancedScheduling: -1, // unlimited
      exclusiveBattleModes: -1,
      premiumThemes: -1,
      aiInsights: 20,
      cloudSync: -1,
      prioritySupport: -1,
    };

    const limit = featureLimits[feature];
    if (limit === -1) {
      return { hasAccess: true };
    }

    // Mock current usage
    const currentUsage = Math.floor(Math.random() * limit * 0.8);
    
    return {
      hasAccess: currentUsage < limit,
      currentUsage,
      limit,
      reason: currentUsage >= limit ? 'Monthly limit exceeded' : undefined,
    };
  }

  static async incrementFeatureUsage(userId: string, feature: keyof PremiumFeatureAccess, amount: number = 1): Promise<void> {
    this.logCall('incrementFeatureUsage', [userId, feature, amount]);
    
    // Simulate usage tracking
    await MockServiceUtils.delay(50);
    
    const usageKey = `usage_${userId}_${feature}`;
    const currentUsage = this.getCachedData<number>(usageKey) || 0;
    this.setCachedData(usageKey, currentUsage + amount);
  }

  static async getSubscriptionFeatures(tier: string): Promise<PremiumFeatureAccess> {
    this.logCall('getSubscriptionFeatures', [tier]);
    
    if (tier === 'premium') {
      return {
        elevenlabsVoices: true,
        customVoiceMessages: true,
        advancedScheduling: true,
        exclusiveBattleModes: true,
        premiumThemes: true,
        aiInsights: true,
        cloudSync: true,
        prioritySupport: true,
        exportData: true,
        multiDevice: true,
        socialChallenges: true,
        voiceCloning: true,
        smartNotifications: true,
        healthIntegration: true,
        analytics: true,
      };
    }

    // Free tier
    return {
      elevenlabsVoices: false,
      customVoiceMessages: false,
      advancedScheduling: false,
      exclusiveBattleModes: false,
      premiumThemes: false,
      aiInsights: false,
      cloudSync: false,
      prioritySupport: false,
      exportData: false,
      multiDevice: false,
      socialChallenges: false,
      voiceCloning: false,
      smartNotifications: false,
      healthIntegration: false,
      analytics: false,
    };
  }
}

// Mock AnalyticsService
export class MockAnalyticsService {
  private static events: AnalyticsEvent[] = [];
  private static callHistory: Array<{ method: string; args: any[]; timestamp: number }> = [];
  private static isEnabled: boolean = true;

  static reset(): void {
    this.events = [];
    this.callHistory = [];
    this.isEnabled = true;
  }

  static getCallHistory(): Array<{ method: string; args: any[]; timestamp: number }> {
    return [...this.callHistory];
  }

  static getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  private static logCall(method: string, args: any[]): void {
    this.callHistory.push({
      method,
      args: args.map(arg => typeof arg === 'object' ? JSON.parse(JSON.stringify(arg)) : arg),
      timestamp: Date.now(),
    });
  }

  static async track(event: string, properties?: Record<string, any>, userId?: string): Promise<void> {
    this.logCall('track', [event, properties, userId]);
    
    if (!this.isEnabled) {
      return;
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: properties || {},
      timestamp: new Date().toISOString(),
      distinctId: userId || 'anonymous',
    };

    this.events.push(analyticsEvent);
    
    // Simulate API delay
    await MockServiceUtils.delay(50);
  }

  static async identify(userId: string, traits?: Record<string, any>): Promise<void> {
    this.logCall('identify', [userId, traits]);
    
    if (!this.isEnabled) {
      return;
    }

    await this.track('user_identified', { ...traits, user_id: userId }, userId);
  }

  static async page(name: string, properties?: Record<string, any>, userId?: string): Promise<void> {
    this.logCall('page', [name, properties, userId]);
    
    if (!this.isEnabled) {
      return;
    }

    await this.track('page_view', { page: name, ...properties }, userId);
  }

  static async batch(events: Array<{ event: string; properties?: Record<string, any>; userId?: string }>): Promise<void> {
    this.logCall('batch', [events]);
    
    if (!this.isEnabled) {
      return;
    }

    for (const eventData of events) {
      await this.track(eventData.event, eventData.properties, eventData.userId);
    }
  }

  static async flush(): Promise<void> {
    this.logCall('flush', []);
    
    // Simulate flush delay
    await MockServiceUtils.delay(100);
  }
}

// Mock BattleService
export class MockBattleService {
  private static battles: Battle[] = [];
  private static callHistory: Array<{ method: string; args: any[]; timestamp: number }> = [];
  private static realTimeUpdates: Map<string, NodeJS.Timeout> = new Map();

  static reset(): void {
    this.battles = [];
    this.callHistory = [];
    this.realTimeUpdates.forEach(timer => clearTimeout(timer));
    this.realTimeUpdates.clear();
  }

  static getCallHistory(): Array<{ method: string; args: any[]; timestamp: number }> {
    return [...this.callHistory];
  }

  static getBattles(): Battle[] {
    return [...this.battles];
  }

  private static logCall(method: string, args: any[]): void {
    this.callHistory.push({
      method,
      args: args.map(arg => typeof arg === 'object' ? JSON.parse(JSON.stringify(arg)) : arg),
      timestamp: Date.now(),
    });
  }

  static async createBattle(battleData: Partial<Battle>): Promise<Battle> {
    this.logCall('createBattle', [battleData]);
    
    const battle: Battle = {
      id: MockServiceUtils.generateId('battle'),
      creatorId: battleData.creatorId || 'test-user',
      title: battleData.title || 'Test Battle',
      description: battleData.description || 'A test battle',
      type: battleData.type || 'weekly_challenge',
      startDate: battleData.startDate || new Date().toISOString(),
      endDate: battleData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxParticipants: battleData.maxParticipants || 10,
      currentParticipants: 1,
      prizePool: battleData.prizePool || 100,
      entryFee: battleData.entryFee || 10,
      status: 'active',
      rules: battleData.rules || {
        wakeUpWindow: '05:00-08:00',
        verificationRequired: true,
        snoozePenalty: 5,
      },
      participants: [
        {
          userId: battleData.creatorId || 'test-user',
          joinedAt: new Date().toISOString(),
          status: 'active',
          score: 0,
        },
      ],
      leaderboard: [
        {
          userId: battleData.creatorId || 'test-user',
          username: 'Creator',
          score: 0,
          rank: 1,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...battleData,
    };

    this.battles.push(battle);
    
    // Simulate real-time updates
    this.simulateRealTimeUpdates(battle.id);
    
    await MockServiceUtils.delay(100);
    return battle;
  }

  static async joinBattle(battleId: string, userId: string): Promise<void> {
    this.logCall('joinBattle', [battleId, userId]);
    
    const battle = this.battles.find(b => b.id === battleId);
    if (!battle) {
      throw new Error(`Battle ${battleId} not found`);
    }

    if (battle.currentParticipants >= battle.maxParticipants) {
      throw new Error('Battle is full');
    }

    const alreadyJoined = battle.participants.some(p => p.userId === userId);
    if (alreadyJoined) {
      throw new Error('User already in battle');
    }

    battle.participants.push({
      userId,
      joinedAt: new Date().toISOString(),
      status: 'active',
      score: 0,
    });

    battle.leaderboard.push({
      userId,
      username: `User_${userId.slice(-4)}`,
      score: 0,
      rank: battle.leaderboard.length + 1,
    });

    battle.currentParticipants++;
    battle.updatedAt = new Date().toISOString();
    
    await MockServiceUtils.delay(100);
  }

  static async submitWakeProof(battleId: string, userId: string, proofData: any): Promise<{
    pointsEarned: number;
    newScore: number;
    rank: number;
  }> {
    this.logCall('submitWakeProof', [battleId, userId, proofData]);
    
    const battle = this.battles.find(b => b.id === battleId);
    if (!battle) {
      throw new Error(`Battle ${battleId} not found`);
    }

    const participant = battle.participants.find(p => p.userId === userId);
    if (!participant) {
      throw new Error('User not in battle');
    }

    // Mock scoring logic
    const pointsEarned = Math.floor(Math.random() * 20) + 10;
    const leaderboardEntry = battle.leaderboard.find(l => l.userId === userId);
    
    if (leaderboardEntry) {
      leaderboardEntry.score += pointsEarned;
      
      // Update rankings
      battle.leaderboard.sort((a, b) => b.score - a.score);
      battle.leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });
    }

    battle.updatedAt = new Date().toISOString();
    
    await MockServiceUtils.delay(100);
    
    return {
      pointsEarned,
      newScore: leaderboardEntry?.score || 0,
      rank: leaderboardEntry?.rank || 1,
    };
  }

  private static simulateRealTimeUpdates(battleId: string): void {
    const timer = setInterval(() => {
      const battle = this.battles.find(b => b.id === battleId);
      if (!battle || battle.status !== 'active') {
        clearInterval(timer);
        this.realTimeUpdates.delete(battleId);
        return;
      }

      // Simulate random participant activity
      if (MockServiceUtils.randomBool(0.1)) { // 10% chance per interval
        const randomParticipant = battle.participants[Math.floor(Math.random() * battle.participants.length)];
        if (randomParticipant) {
          this.submitWakeProof(battleId, randomParticipant.userId, { type: 'auto_generated' });
        }
      }
    }, 5000); // Update every 5 seconds

    this.realTimeUpdates.set(battleId, timer);
  }

  static async getBattles(filters?: { status?: string; userId?: string }): Promise<Battle[]> {
    this.logCall('getBattles', [filters]);
    
    let filteredBattles = [...this.battles];
    
    if (filters?.status) {
      filteredBattles = filteredBattles.filter(battle => battle.status === filters.status);
    }
    
    if (filters?.userId) {
      filteredBattles = filteredBattles.filter(battle => 
        battle.participants.some(p => p.userId === filters.userId)
      );
    }
    
    await MockServiceUtils.delay(100);
    return filteredBattles;
  }
}

// Export all mock services
export const MockServices = {
  AlarmService: MockAlarmService,
  SubscriptionService: MockSubscriptionService,
  AnalyticsService: MockAnalyticsService,
  BattleService: MockBattleService,
  Utils: MockServiceUtils,
};

// Reset all services
export const resetAllMockServices = (): void => {
  MockAlarmService.reset();
  MockSubscriptionService.reset();
  MockAnalyticsService.reset();
  MockBattleService.reset();
  MockServiceUtils.clearCache();
};

export default MockServices;

// ============================================================================
// Enhanced Service Mocks (New Architecture)
// ============================================================================

// Import enhanced service mocks for new dependency injection patterns
export {
  MockBaseService,
  MockCacheProvider,
  MockAlarmService as EnhancedMockAlarmService,
  MockAnalyticsService as EnhancedMockAnalyticsService,
  MockSubscriptionService as EnhancedMockSubscriptionService,
  MockBattleService as EnhancedMockBattleService,
  MockVoiceService as EnhancedMockVoiceService,
  createMockServiceContainer,
  resetAllMockServices as resetEnhancedMockServices,
  initializeAllMockServices,
} from './enhanced-service-mocks';

// Enhanced service provider
export {
  EnhancedServiceProvider,
  useServiceContainer,
  useEnhancedAlarmService,
  useEnhancedAnalyticsService,
  useEnhancedSubscriptionService,
  useEnhancedBattleService,
  useEnhancedVoiceService,
  createTestServiceContainer,
  withEnhancedServices,
} from '../providers/enhanced-service-providers';

/**
 * Migration Guide:
 * 
 * OLD (Legacy):
 * ```typescript
 * import { MockAlarmService } from './service-mocks';
 * MockAlarmService.reset();
 * const alarms = await MockAlarmService.loadAlarms();
 * ```
 * 
 * NEW (Enhanced):
 * ```typescript
 * import { EnhancedMockAlarmService, createMockServiceContainer } from './service-mocks';
 * const container = createMockServiceContainer();
 * const alarmService = container.get('alarmService') as EnhancedMockAlarmService;
 * await alarmService.initialize();
 * const alarms = await alarmService.getAlarms();
 * ```
 * 
 * Or use with React Provider:
 * ```typescript
 * import { EnhancedServiceProvider, useEnhancedAlarmService } from './service-mocks';
 * 
 * function TestComponent() {
 *   const alarmService = useEnhancedAlarmService();
 *   // Use alarmService...
 * }
 * 
 * // In test:
 * render(
 *   <EnhancedServiceProvider>
 *     <TestComponent />
 *   </EnhancedServiceProvider>
 * );
 * ```
 */