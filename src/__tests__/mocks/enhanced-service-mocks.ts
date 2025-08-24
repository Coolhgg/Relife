/**
 * Enhanced Service Mocks - New Architecture
 * Implements the enhanced service interfaces with dependency injection patterns
 */

import type {
  BaseService,
  ServiceConfig,
  ServiceHealth,
  ServiceMetrics,
  ServiceError,
  AlarmServiceInterface,
  AnalyticsServiceInterface,
  SubscriptionServiceInterface,
  BattleServiceInterface,
  VoiceServiceInterface,
  PerformanceMonitorInterface,
  CacheProvider,
  CacheStats,
} from '../../types/service-architecture';

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

// ============================================================================
// Mock Base Service Implementation
// ============================================================================

export abstract class MockBaseService implements BaseService {
  public readonly name: string;
  public readonly version: string;
  
  protected config: ServiceConfig;
  protected initialized: boolean = false;
  protected ready: boolean = false;
  protected errors: ServiceError[] = [];
  protected eventHandlers: Map<string, Array<(...args: any[]) => void>> = new Map();
  protected startTime: Date = new Date();
  protected dependencies: Map<string, BaseService> = new Map();

  constructor(name: string, version: string = '1.0.0', config: ServiceConfig, dependencies?: Map<string, BaseService>) {
    this.name = name;
    this.version = version;
    this.config = { ...this.getDefaultConfig(), ...config };
    
    if (dependencies) {
      this.dependencies = dependencies;
    }
  }

  protected abstract getDefaultConfig(): Partial<ServiceConfig>;

  public async initialize(config?: ServiceConfig): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (config) {
      this.config = { ...this.config, ...config };
    }

    await this.doInitialize();
    this.initialized = true;
    this.ready = true;
    this.emit('service:initialized', { serviceName: this.name });
  }

  protected abstract doInitialize(): Promise<void>;

  public async cleanup(): Promise<void> {
    this.ready = false;
    this.initialized = false;
    this.errors = [];
    this.eventHandlers.clear();
    await this.doCleanup();
    this.emit('service:cleaned');
  }

  protected abstract doCleanup(): Promise<void>;

  public isReady(): boolean {
    return this.ready;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async getHealth(): Promise<ServiceHealth> {
    return {
      status: this.ready ? 'healthy' : 'unhealthy',
      lastCheck: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      dependencies: [],
      metrics: {
        requestCount: 0,
        errorCount: this.errors.length,
        averageResponseTime: 50,
        memoryUsage: 0,
        cacheHitRate: 0.85,
      },
      errors: this.errors.slice(-10),
    };
  }

  public getConfig(): ServiceConfig {
    return { ...this.config };
  }

  public async updateConfig(config: Partial<ServiceConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    this.emit('service:config-updated', { serviceName: this.name, config });
  }

  public on(event: string, handler: (...args: any[]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off(event: string, handler: (...args: any[]) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          this.handleError(error, `Error in event handler for ${event}`);
        }
      });
    }
  }

  protected handleError(error: any, context: string): void {
    const serviceError: ServiceError = {
      message: error.message || String(error),
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date(),
      severity: 'medium',
      context: { serviceName: this.name, context },
    };
    
    this.errors.push(serviceError);
    
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }
    
    this.emit('service:error', serviceError);
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected generateId(prefix: string = 'mock'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Mock Cache Provider
// ============================================================================

export class MockCacheProvider implements CacheProvider {
  private cache = new Map<string, { value: any; timestamp: Date; ttl: number }>();
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0, hitRate: 0 };

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    if (Date.now() - entry.timestamp.getTime() > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl: number = 300000): Promise<void> {
    this.cache.set(key, { value, timestamp: new Date(), ttl });
    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  async delete(key: string): Promise<boolean> {
    const existed = this.cache.delete(key);
    if (existed) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return existed;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.size = 0;
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key) && await this.get(key) !== null;
  }

  async keys(pattern?: string): Promise<string[]> {
    const keys = Array.from(this.cache.keys());
    if (pattern) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return keys.filter(key => regex.test(key));
    }
    return keys;
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  async stats(): Promise<CacheStats> {
    return { ...this.stats };
  }

  reset(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0, hitRate: 0 };
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

// ============================================================================
// Mock Alarm Service
// ============================================================================

export class MockAlarmService extends MockBaseService implements AlarmServiceInterface {
  private alarms: Alarm[] = [];
  private cache = new MockCacheProvider();
  private callHistory: Array<{ method: string; args: any[]; timestamp: number }> = [];

  constructor(dependencies?: Map<string, BaseService>, config?: ServiceConfig) {
    super('MockAlarmService', '1.0.0', config || {}, dependencies);
  }

  protected getDefaultConfig(): Partial<ServiceConfig> {
    return {
      enabled: true,
      environment: 'development',
      debug: true,
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000,
      caching: {
        enabled: true,
        strategy: 'memory',
        ttl: 300000,
        maxSize: 100,
        evictionPolicy: 'lru',
      },
    };
  }

  protected async doInitialize(): Promise<void> {
    const mockAlarms: Alarm[] = [
      {
        id: this.generateId('alarm'),
        userId: 'test-user',
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
    ];

    this.alarms = mockAlarms;
    await this.cache.set('alarms', mockAlarms);
  }

  protected async doCleanup(): Promise<void> {
    this.alarms = [];
    this.callHistory = [];
    this.cache.reset();
  }

  private logCall(method: string, args: any[]): void {
    this.callHistory.push({
      method,
      args: args.map(arg => typeof arg === 'object' ? JSON.parse(JSON.stringify(arg)) : arg),
      timestamp: Date.now(),
    });
  }

  public getCallHistory(): Array<{ method: string; args: any[]; timestamp: number }> {
    return [...this.callHistory];
  }

  public async createAlarm(alarm: Partial<Alarm>): Promise<Alarm> {
    this.logCall('createAlarm', [alarm]);

    const newAlarm: Alarm = {
      id: this.generateId('alarm'),
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
    await this.cache.set('alarms', this.alarms);
    
    this.emit('alarm:created', newAlarm);
    await this.delay(100);
    
    return newAlarm;
  }

  public async updateAlarm(id: string, updates: Partial<Alarm>): Promise<Alarm> {
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
    await this.cache.set('alarms', this.alarms);
    
    this.emit('alarm:updated', updatedAlarm);
    await this.delay(50);
    
    return updatedAlarm;
  }

  public async deleteAlarm(id: string): Promise<boolean> {
    this.logCall('deleteAlarm', [id]);

    const alarmIndex = this.alarms.findIndex(alarm => alarm.id === id);
    if (alarmIndex === -1) {
      return false;
    }

    const deletedAlarm = this.alarms[alarmIndex];
    this.alarms.splice(alarmIndex, 1);
    await this.cache.set('alarms', this.alarms);
    
    this.emit('alarm:deleted', { id, deletedAlarm });
    await this.delay(50);
    
    return true;
  }

  public async getAlarms(): Promise<Alarm[]> {
    this.logCall('getAlarms', []);

    const cached = await this.cache.get<Alarm[]>('alarms');
    if (cached) {
      return cached;
    }

    await this.delay(100);
    return [...this.alarms];
  }

  public async triggerAlarm(id: string): Promise<void> {
    this.logCall('triggerAlarm', [id]);

    const alarm = this.alarms.find(a => a.id === id);
    if (!alarm) {
      throw new Error(`Alarm with id ${id} not found`);
    }

    this.emit('alarm:triggered', alarm);
    await this.delay(50);
  }

  public async snoozeAlarm(id: string, duration: number): Promise<void> {
    this.logCall('snoozeAlarm', [id, duration]);

    const alarm = this.alarms.find(a => a.id === id);
    if (!alarm) {
      throw new Error(`Alarm with id ${id} not found`);
    }

    this.emit('alarm:snoozed', { alarm, duration });
    await this.delay(50);
  }
}

// ============================================================================
// Mock Analytics Service
// ============================================================================

export class MockAnalyticsService extends MockBaseService implements AnalyticsServiceInterface {
  private events: AnalyticsEvent[] = [];
  private cache = new MockCacheProvider();
  private callHistory: Array<{ method: string; args: any[]; timestamp: number }> = [];
  private queue: Array<{ event: string; properties?: Record<string, any>; userId?: string }> = [];

  constructor(dependencies?: Map<string, BaseService>, config?: ServiceConfig) {
    super('MockAnalyticsService', '1.0.0', config || {}, dependencies);
  }

  protected getDefaultConfig(): Partial<ServiceConfig> {
    return {
      enabled: true,
      environment: 'development',
      debug: true,
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000,
      caching: {
        enabled: true,
        strategy: 'memory',
        ttl: 300000,
      },
    };
  }

  protected async doInitialize(): Promise<void> {
    setInterval(() => this.processQueue(), 1000);
  }

  protected async doCleanup(): Promise<void> {
    this.events = [];
    this.callHistory = [];
    this.queue = [];
    this.cache.reset();
  }

  private logCall(method: string, args: any[]): void {
    this.callHistory.push({
      method,
      args: args.map(arg => typeof arg === 'object' ? JSON.parse(JSON.stringify(arg)) : arg),
      timestamp: Date.now(),
    });
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, 10);
    for (const item of batch) {
      const analyticsEvent: AnalyticsEvent = {
        event: item.event,
        properties: item.properties || {},
        timestamp: new Date().toISOString(),
        distinctId: item.userId || 'anonymous',
      };
      this.events.push(analyticsEvent);
    }
  }

  public getCallHistory(): Array<{ method: string; args: any[]; timestamp: number }> {
    return [...this.callHistory];
  }

  public getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  public async track(event: string, properties?: Record<string, any>): Promise<void> {
    this.logCall('track', [event, properties]);

    if (!this.config.enabled) {
      return;
    }

    this.queue.push({ event, properties });
    this.emit('analytics:tracked', { event, properties });
    await this.delay(25);
  }

  public async identify(userId: string, traits?: Record<string, any>): Promise<void> {
    this.logCall('identify', [userId, traits]);

    if (!this.config.enabled) {
      return;
    }

    await this.track('user_identified', { ...traits, user_id: userId });
  }

  public async page(name: string, properties?: Record<string, any>): Promise<void> {
    this.logCall('page', [name, properties]);

    if (!this.config.enabled) {
      return;
    }

    await this.track('page_view', { page: name, ...properties });
  }

  public async flush(): Promise<void> {
    this.logCall('flush', []);
    await this.processQueue();
    this.emit('analytics:flushed');
    await this.delay(100);
  }
}

// ============================================================================
// Mock Subscription Service
// ============================================================================

export class MockSubscriptionService extends MockBaseService implements SubscriptionServiceInterface {
  private subscriptions = new Map<string, Subscription>();
  private cache = new MockCacheProvider();
  private callHistory: Array<{ method: string; args: any[]; timestamp: number }> = [];

  constructor(dependencies?: Map<string, BaseService>, config?: ServiceConfig) {
    super('MockSubscriptionService', '1.0.0', config || {}, dependencies);
  }

  protected getDefaultConfig(): Partial<ServiceConfig> {
    return {
      enabled: true,
      environment: 'development',
      debug: true,
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000,
      caching: {
        enabled: true,
        strategy: 'memory',
        ttl: 300000,
      },
    };
  }

  protected async doInitialize(): Promise<void> {
    const premiumSub: Subscription = {
      id: this.generateId('sub'),
      userId: 'premium-user',
      tier: 'premium',
      status: 'active' as SubscriptionStatus,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      trialEnd: undefined,
      cancelAtPeriodEnd: false,
      canceledAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      stripeCustomerId: 'cus_' + this.generateId(),
      stripeSubscriptionId: 'sub_' + this.generateId(),
      stripePriceId: 'price_premium_monthly',
    };

    this.subscriptions.set('premium-user', premiumSub);
  }

  protected async doCleanup(): Promise<void> {
    this.subscriptions.clear();
    this.callHistory = [];
    this.cache.reset();
  }

  private logCall(method: string, args: any[]): void {
    this.callHistory.push({
      method,
      args: args.map(arg => typeof arg === 'object' ? JSON.parse(JSON.stringify(arg)) : arg),
      timestamp: Date.now(),
    });
  }

  public getCallHistory(): Array<{ method: string; args: any[]; timestamp: number }> {
    return [...this.callHistory];
  }

  public async getSubscription(userId: string): Promise<Subscription | null> {
    this.logCall('getSubscription', [userId]);

    const cacheKey = `subscription_${userId}`;
    const cached = await this.cache.get<Subscription>(cacheKey);
    if (cached) {
      return cached;
    }

    await this.delay(200);
    const subscription = this.subscriptions.get(userId) || null;
    
    if (subscription) {
      await this.cache.set(cacheKey, subscription);
    }

    return subscription;
  }

  public async createSubscription(data: any): Promise<Subscription> {
    this.logCall('createSubscription', [data]);

    const subscription: Subscription = {
      id: this.generateId('sub'),
      userId: data.userId,
      tier: data.tier || 'premium',
      status: 'active' as SubscriptionStatus,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      trialEnd: data.trialEnd,
      cancelAtPeriodEnd: false,
      canceledAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      stripeCustomerId: 'cus_' + this.generateId(),
      stripeSubscriptionId: 'sub_' + this.generateId(),
      stripePriceId: data.priceId || 'price_premium_monthly',
      ...data,
    };

    this.subscriptions.set(data.userId, subscription);
    this.emit('subscription:created', subscription);
    await this.delay(100);
    
    return subscription;
  }

  public async updateSubscription(id: string, updates: any): Promise<Subscription> {
    this.logCall('updateSubscription', [id, updates]);

    const subscription = Array.from(this.subscriptions.values()).find(s => s.id === id);
    if (!subscription) {
      throw new Error(`Subscription with id ${id} not found`);
    }

    const updatedSubscription = { ...subscription, ...updates, updatedAt: new Date() };
    this.subscriptions.set(subscription.userId, updatedSubscription);
    
    this.emit('subscription:updated', updatedSubscription);
    await this.delay(100);
    
    return updatedSubscription;
  }

  public async cancelSubscription(id: string): Promise<void> {
    this.logCall('cancelSubscription', [id]);

    const subscription = Array.from(this.subscriptions.values()).find(s => s.id === id);
    if (!subscription) {
      throw new Error(`Subscription with id ${id} not found`);
    }

    subscription.status = 'canceled';
    subscription.canceledAt = new Date();
    this.subscriptions.set(subscription.userId, subscription);
    
    this.emit('subscription:canceled', subscription);
    await this.delay(100);
  }

  public checkFeatureAccess(feature: string): boolean {
    return true;
  }
}

// ============================================================================
// Mock Battle Service
// ============================================================================

export class MockBattleService extends MockBaseService implements BattleServiceInterface {
  private battles: Battle[] = [];
  private callHistory: Array<{ method: string; args: any[]; timestamp: number }> = [];

  constructor(dependencies?: Map<string, BaseService>, config?: ServiceConfig) {
    super('MockBattleService', '1.0.0', config || {}, dependencies);
  }

  protected getDefaultConfig(): Partial<ServiceConfig> {
    return {
      enabled: true,
      environment: 'development',
      debug: true,
    };
  }

  protected async doInitialize(): Promise<void> {
    // Initialize with empty battles
  }

  protected async doCleanup(): Promise<void> {
    this.battles = [];
    this.callHistory = [];
  }

  private logCall(method: string, args: any[]): void {
    this.callHistory.push({
      method,
      args: args.map(arg => typeof arg === 'object' ? JSON.parse(JSON.stringify(arg)) : arg),
      timestamp: Date.now(),
    });
  }

  public getCallHistory(): Array<{ method: string; args: any[]; timestamp: number }> {
    return [...this.callHistory];
  }

  public async createBattle(config: any): Promise<Battle> {
    this.logCall('createBattle', [config]);

    const battle: Battle = {
      id: this.generateId('battle'),
      creatorId: config.creatorId || 'test-user',
      title: config.title || 'Test Battle',
      description: config.description || 'A test battle',
      type: config.type || 'weekly_challenge',
      startDate: config.startDate || new Date().toISOString(),
      endDate: config.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxParticipants: config.maxParticipants || 10,
      currentParticipants: 1,
      prizePool: config.prizePool || 100,
      entryFee: config.entryFee || 10,
      status: 'active',
      rules: config.rules || {
        wakeUpWindow: '05:00-08:00',
        verificationRequired: true,
        snoozePenalty: 5,
      },
      participants: [{
        userId: config.creatorId || 'test-user',
        joinedAt: new Date().toISOString(),
        status: 'active',
        score: 0,
      }],
      leaderboard: [{
        userId: config.creatorId || 'test-user',
        username: 'Creator',
        score: 0,
        rank: 1,
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...config,
    };

    this.battles.push(battle);
    this.emit('battle:created', battle);
    await this.delay(100);
    
    return battle;
  }

  public async joinBattle(battleId: string, userId: string): Promise<any> {
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
    
    this.emit('battle:joined', { battleId, userId });
    await this.delay(100);
    
    return { success: true };
  }

  public async updateBattleProgress(battleId: string, progress: any): Promise<void> {
    this.logCall('updateBattleProgress', [battleId, progress]);

    const battle = this.battles.find(b => b.id === battleId);
    if (!battle) {
      throw new Error(`Battle ${battleId} not found`);
    }

    battle.updatedAt = new Date().toISOString();
    this.emit('battle:progress-updated', { battleId, progress });
    await this.delay(50);
  }

  public async getBattleHistory(userId: string): Promise<any[]> {
    this.logCall('getBattleHistory', [userId]);

    const userBattles = this.battles.filter(battle => 
      battle.participants.some(p => p.userId === userId)
    );

    await this.delay(100);
    return userBattles;
  }

  public async endBattle(battleId: string): Promise<any> {
    this.logCall('endBattle', [battleId]);

    const battle = this.battles.find(b => b.id === battleId);
    if (!battle) {
      throw new Error(`Battle ${battleId} not found`);
    }

    battle.status = 'completed';
    battle.updatedAt = new Date().toISOString();
    
    this.emit('battle:ended', battle);
    await this.delay(100);
    
    return { success: true, battle };
  }
}

// ============================================================================
// Mock Voice Service
// ============================================================================

export class MockVoiceService extends MockBaseService implements VoiceServiceInterface {
  private callHistory: Array<{ method: string; args: any[]; timestamp: number }> = [];
  private availableVoices: any[] = [];
  private currentVoice: string = 'default';
  private speaking: boolean = false;

  constructor(dependencies?: Map<string, BaseService>, config?: ServiceConfig) {
    super('MockVoiceService', '1.0.0', config || {}, dependencies);
  }

  protected getDefaultConfig(): Partial<ServiceConfig> {
    return {
      enabled: true,
      environment: 'development',
      debug: true,
    };
  }

  protected async doInitialize(): Promise<void> {
    this.availableVoices = [
      { id: 'default', name: 'Default Voice', language: 'en-US' },
      { id: 'female1', name: 'Sarah', language: 'en-US' },
      { id: 'male1', name: 'David', language: 'en-US' },
    ];
  }

  protected async doCleanup(): Promise<void> {
    this.callHistory = [];
    this.speaking = false;
  }

  private logCall(method: string, args: any[]): void {
    this.callHistory.push({
      method,
      args: args.map(arg => typeof arg === 'object' ? JSON.parse(JSON.stringify(arg)) : arg),
      timestamp: Date.now(),
    });
  }

  public getCallHistory(): Array<{ method: string; args: any[]; timestamp: number }> {
    return [...this.callHistory];
  }

  public async speak(text: string, options?: any): Promise<void> {
    this.logCall('speak', [text, options]);

    if (!this.config.enabled) {
      return;
    }

    this.speaking = true;
    this.emit('voice:speaking', { text, options });
    
    // Simulate speaking duration based on text length
    const duration = Math.max(1000, text.length * 50);
    await this.delay(duration);
    
    this.speaking = false;
    this.emit('voice:finished', { text });
  }

  public async stop(): Promise<void> {
    this.logCall('stop', []);
    
    this.speaking = false;
    this.emit('voice:stopped');
    await this.delay(50);
  }

  public async getVoices(): Promise<any[]> {
    this.logCall('getVoices', []);
    
    await this.delay(100);
    return [...this.availableVoices];
  }

  public async setVoice(voiceId: string): Promise<void> {
    this.logCall('setVoice', [voiceId]);
    
    const voice = this.availableVoices.find(v => v.id === voiceId);
    if (!voice) {
      throw new Error(`Voice ${voiceId} not found`);
    }
    
    this.currentVoice = voiceId;
    this.emit('voice:changed', { voiceId });
    await this.delay(50);
  }

  public async generateAudio(text: string, voiceId: string): Promise<string> {
    this.logCall('generateAudio', [text, voiceId]);
    
    await this.delay(500);
    const audioUrl = `data:audio/wav;base64,${btoa('mock-audio-data-' + text)}`;
    
    this.emit('voice:audio-generated', { text, voiceId, audioUrl });
    return audioUrl;
  }

  public isSpeaking(): boolean {
    return this.speaking;
  }
}

// ============================================================================
// Export Enhanced Mock Services and Utilities
// ============================================================================

export const createMockServiceContainer = (): Map<string, BaseService> => {
  const container = new Map<string, BaseService>();
  
  const defaultConfig: ServiceConfig = {
    enabled: true,
    environment: 'development',
    debug: true,
  };

  container.set('alarmService', new MockAlarmService(container, defaultConfig));
  container.set('analyticsService', new MockAnalyticsService(container, defaultConfig));
  container.set('subscriptionService', new MockSubscriptionService(container, defaultConfig));
  container.set('battleService', new MockBattleService(container, defaultConfig));
  container.set('voiceService', new MockVoiceService(container, defaultConfig));
  
  return container;
};

export const resetAllMockServices = async (container: Map<string, BaseService>): Promise<void> => {
  for (const [, service] of container) {
    await service.cleanup();
  }
};

export const initializeAllMockServices = async (container: Map<string, BaseService>): Promise<void> => {
  for (const [, service] of container) {
    await service.initialize();
  }
};

// Export individual services for backwards compatibility
export {
  MockAlarmService as EnhancedMockAlarmService,
  MockAnalyticsService as EnhancedMockAnalyticsService,
  MockSubscriptionService as EnhancedMockSubscriptionService,
  MockBattleService as EnhancedMockBattleService,
  MockVoiceService as EnhancedMockVoiceService,
};

// Default export for easy usage
export default {
  MockAlarmService,
  MockAnalyticsService,
  MockSubscriptionService,
  MockBattleService,
  MockVoiceService,
  MockCacheProvider,
  createMockServiceContainer,
  resetAllMockServices,
  initializeAllMockServices,
};