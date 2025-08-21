/// <reference types="node" />
/// <reference lib="dom" />
// Offline Analytics Service for Relife App
// Comprehensive offline analytics collection and queuing with intelligent batching

import { EnhancedOfflineStorage } from './enhanced-offline-storage';
import { ErrorHandler } from './error-handler';
import SecurityService from './security';

interface AnalyticsEvent {
  id: string;
  type: 'alarm_set' | 'alarm_dismissed' | 'alarm_snoozed' | 'battle_joined' | 'battle_won' | 'reward_earned' | 'achievement_unlocked' | 'user_action' | 'page_view' | 'error' | 'performance';
  category: 'alarm' | 'gaming' | 'rewards' | 'user' | 'system' | 'performance';
  action: string;
  label?: string;
  value?: number;
  properties: Record<string, any>;
  timestamp: string;
  sessionId: string;
  userId?: string;
  synced: boolean;
  retryCount: number;
}

interface SessionData {
  id: string;
  startTime: string;
  endTime?: string;
  userId?: string;
  userAgent: string;
  viewport: { width: number; height: number };
  timezone: string;
  language: string;
  isOnline: boolean;
  events: string[]; // event IDs
}

interface AnalyticsConfig {
  maxQueueSize: number;
  maxRetries: number;
  batchSize: number;
  flushInterval: number; // milliseconds
  enableDebugLogging: boolean;
  enablePerformanceTracking: boolean;
}

interface PerformanceMetric {
  id: string;
  type: 'page_load' | 'component_render' | 'api_call' | 'cache_hit' | 'cache_miss' | 'service_worker_action';
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

export class OfflineAnalyticsService {
  private static instance: OfflineAnalyticsService;
  private readonly STORAGE_KEYS = {
    EVENTS_QUEUE: 'relife-analytics-events',
    SESSION_DATA: 'relife-analytics-session',
    PERFORMANCE_METRICS: 'relife-analytics-performance',
    CONFIG: 'relife-analytics-config'
  };

  private config: AnalyticsConfig = {
    maxQueueSize: 1000,
    maxRetries: 3,
    batchSize: 50,
    flushInterval: 30000, // 30 seconds
    enableDebugLogging: false,
    enablePerformanceTracking: true
  };

  private eventQueue: AnalyticsEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private currentSession: SessionData;
  private flushTimer?: NodeJS.Timeout;
  private isOnline = navigator.onLine;
  private isFlushing = false;

  private constructor() {
    this.initializeSession();
    this.loadFromStorage();
    this.setupEventListeners();
    this.startFlushTimer();
  }

  static getInstance(): OfflineAnalyticsService {
    if (!OfflineAnalyticsService.instance) {
      OfflineAnalyticsService.instance = new OfflineAnalyticsService();
    }
    return OfflineAnalyticsService.instance;
  }

  // ==================== INITIALIZATION ====================

  private initializeSession(): void {
    this.currentSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date().toISOString(),
      userId: undefined, // Will be set when user logs in
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      isOnline: navigator.onLine,
      events: []
    };

    console.log('[OfflineAnalytics] New session initialized:', this.currentSession.id);
  }

  private async loadFromStorage(): Promise<void> {
    try {
      // Load queued events
      const events = SecurityService.secureStorageGet(this.STORAGE_KEYS.EVENTS_QUEUE);
      if (events && Array.isArray(events)) {
        this.eventQueue = events;
        console.log('[OfflineAnalytics] Loaded', this.eventQueue.length, 'queued events');
      }

      // Load performance metrics
      const metrics = SecurityService.secureStorageGet(this.STORAGE_KEYS.PERFORMANCE_METRICS);
      if (metrics && Array.isArray(metrics)) {
        this.performanceMetrics = metrics;
      }

      // Load configuration
      const config = SecurityService.secureStorageGet(this.STORAGE_KEYS.CONFIG);
      if (config) {
        this.config = { ...this.config, ...config };
      }
    } catch (error) {
      console.error('[OfflineAnalytics] Failed to load from storage:', error);
    }
  }

  private setupEventListeners(): void {
    // Online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Viewport changes
    window.addEventListener('resize', this.handleViewportChange.bind(this));

    // Page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Beforeunload for session end
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

    // Service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'ANALYTICS_SYNC_COMPLETE') {
          this.handleSyncComplete(event.data);
        }
      });
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.isOnline && this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.config.flushInterval);
  }

  // ==================== EVENT TRACKING ====================

  async trackEvent(
    type: AnalyticsEvent['type'],
    category: AnalyticsEvent['category'],
    action: string,
    properties: Record<string, any> = {},
    options?: {
      label?: string;
      value?: number;
      immediate?: boolean;
    }
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        category,
        action,
        label: options?.label,
        value: options?.value,
        properties: {
          ...properties,
          sessionId: this.currentSession.id,
          url: window.location.href,
          userAgent: navigator.userAgent,
          viewport: this.currentSession.viewport,
          timestamp: Date.now()
        },
        timestamp: new Date().toISOString(),
        sessionId: this.currentSession.id,
        userId: this.currentSession.userId,
        synced: false,
        retryCount: 0
      };

      // Add to queue
      this.eventQueue.push(event);
      this.currentSession.events.push(event.id);

      // Enforce queue size limit
      if (this.eventQueue.length > this.config.maxQueueSize) {
        const removed = this.eventQueue.shift();
        console.warn('[OfflineAnalytics] Queue full, removed oldest event:', removed?.id);
      }

      // Save to storage
      await this.saveToStorage();

      // Log if debugging enabled
      if (this.config.enableDebugLogging) {
        console.log('[OfflineAnalytics] Tracked event:', type, action, properties);
      }

      // Immediate flush if requested and online
      if (options?.immediate && this.isOnline) {
        await this.flushEvents();
      }

      // Send to service worker for queuing
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'QUEUE_ANALYTICS',
          data: { event }
        });
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to track analytics event', {
        context: 'OfflineAnalyticsService.trackEvent',
        eventType: type,
        action
      });
    }
  }

  // ==================== PERFORMANCE TRACKING ====================

  startPerformanceTimer(type: PerformanceMetric['type'], name: string, metadata?: Record<string, any>): string {
    if (!this.config.enablePerformanceTracking) {
      return '';
    }

    const id = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metric: PerformanceMetric = {
      id,
      type,
      name,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.performanceMetrics.push(metric);
    return id;
  }

  endPerformanceTimer(id: string): void {
    if (!this.config.enablePerformanceTracking || !id) {
      return;
    }

    const metric = this.performanceMetrics.find(m => m.id === id);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;

      // Track as analytics event
      this.trackEvent('performance', 'performance', metric.name, {
        type: metric.type,
        duration: Math.round(metric.duration),
        ...metric.metadata
      });

      if (this.config.enableDebugLogging) {
        console.log('[OfflineAnalytics] Performance metric:', metric.name, `${metric.duration.toFixed(2)}ms`);
      }
    }
  }

  // ==================== SPECIALIZED EVENT TRACKERS ====================

  async trackAlarmEvent(action: 'set' | 'dismissed' | 'snoozed' | 'missed', alarmData: any): Promise<void> {
    await this.trackEvent('alarm_' + action, 'alarm', action, {
      alarmId: alarmData.id,
      time: alarmData.time,
      label: alarmData.label,
      voiceMood: alarmData.voiceMood,
      difficulty: alarmData.difficulty,
      snoozeCount: alarmData.snoozeCount || 0
    });
  }

  async trackBattleEvent(action: 'created' | 'joined' | 'completed' | 'won' | 'lost', battleData: any): Promise<void> {
    await this.trackEvent('battle_' + action, 'gaming', action, {
      battleId: battleData.id,
      battleType: battleData.type,
      participants: battleData.participants?.length || 0,
      duration: battleData.duration,
      score: battleData.score
    });
  }

  async trackRewardEvent(action: 'earned' | 'claimed' | 'level_up', rewardData: any): Promise<void> {
    await this.trackEvent('reward_' + action, 'rewards', action, {
      rewardType: rewardData.type,
      amount: rewardData.amount,
      level: rewardData.level,
      totalPoints: rewardData.totalPoints,
      reason: rewardData.reason
    });
  }

  async trackUserAction(action: string, properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent('user_action', 'user', action, properties);
  }

  async trackPageView(page: string, properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent('page_view', 'user', 'page_view', {
      page,
      url: window.location.href,
      referrer: document.referrer,
      ...properties
    });
  }

  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.trackEvent('error', 'system', 'error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    }, { immediate: true });
  }

  // ==================== EVENT HANDLERS ====================

  private async handleOnline(): Promise<void> {
    this.isOnline = true;
    this.currentSession.isOnline = true;

    console.log('[OfflineAnalytics] Coming online, flushing events...');
    await this.trackEvent('user_action', 'system', 'online', {
      queuedEvents: this.eventQueue.filter(e => !e.synced).length
    });

    await this.flushEvents();
  }

  private async handleOffline(): Promise<void> {
    this.isOnline = false;
    this.currentSession.isOnline = false;

    await this.trackEvent('user_action', 'system', 'offline');
  }

  private handleViewportChange(): void {
    this.currentSession.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  private async handleVisibilityChange(): Promise<void> {
    if (document.hidden) {
      await this.trackEvent('user_action', 'user', 'page_hidden');
    } else {
      await this.trackEvent('user_action', 'user', 'page_visible');
    }
  }

  private async handleBeforeUnload(): Promise<void> {
    // End current session
    this.currentSession.endTime = new Date().toISOString();

    await this.trackEvent('user_action', 'user', 'session_end', {
      duration: Date.now() - new Date(this.currentSession.startTime).getTime(),
      eventsTracked: this.currentSession.events.length
    }, { immediate: true });

    // Final flush
    if (this.isOnline && this.eventQueue.length > 0) {
      await this.flushEvents();
    }
  }

  // ==================== SYNC MANAGEMENT ====================

  async flushEvents(): Promise<void> {
    if (this.isFlushing || !this.isOnline) {
      return;
    }

    this.isFlushing = true;

    try {
      const unsyncedEvents = this.eventQueue.filter(e => !e.synced && e.retryCount < this.config.maxRetries);

      if (unsyncedEvents.length === 0) {
        this.isFlushing = false;
        return;
      }

      console.log('[OfflineAnalytics] Flushing', unsyncedEvents.length, 'events...');

      // Process in batches
      for (let i = 0; i < unsyncedEvents.length; i += this.config.batchSize) {
        const batch = unsyncedEvents.slice(i, i + this.config.batchSize);

        try {
          await this.sendEventBatch(batch);

          // Mark as synced
          batch.forEach(event => {
            event.synced = true;
          });
        } catch (error) {
          // Increment retry count for failed events
          batch.forEach(event => {
            event.retryCount++;
          });

          console.error('[OfflineAnalytics] Failed to sync batch:', error);
        }
      }

      // Remove events that exceeded max retries
      const initialLength = this.eventQueue.length;
      this.eventQueue = this.eventQueue.filter(e => e.retryCount < this.config.maxRetries);

      if (this.eventQueue.length < initialLength) {
        console.warn('[OfflineAnalytics] Removed', initialLength - this.eventQueue.length, 'events that exceeded max retries');
      }

      await this.saveToStorage();
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to flush analytics events', {
        context: 'OfflineAnalyticsService.flushEvents'
      });
    } finally {
      this.isFlushing = false;
    }
  }

  private async sendEventBatch(events: AnalyticsEvent[]): Promise<void> {
    // In a real implementation, this would make API calls to send events
    // For now, we'll simulate the API call
    console.log('[OfflineAnalytics] Sending batch of', events.length, 'events');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Simulated API failure');
    }
  }

  private handleSyncComplete(data: any): void {
    console.log('[OfflineAnalytics] Sync completed via service worker:', data);

    // Dispatch custom event for components to update
    window.dispatchEvent(new CustomEvent('analytics-sync-complete', {
      detail: {
        synced: data.synced || 0,
        failed: data.failed || 0,
        timestamp: Date.now()
      }
    }));
  }

  // ==================== STORAGE MANAGEMENT ====================

  private async saveToStorage(): Promise<void> {
    try {
      SecurityService.secureStorageSet(this.STORAGE_KEYS.EVENTS_QUEUE, this.eventQueue);
      SecurityService.secureStorageSet(this.STORAGE_KEYS.SESSION_DATA, this.currentSession);
      SecurityService.secureStorageSet(this.STORAGE_KEYS.PERFORMANCE_METRICS, this.performanceMetrics);
      SecurityService.secureStorageSet(this.STORAGE_KEYS.CONFIG, this.config);
    } catch (error) {
      console.error('[OfflineAnalytics] Failed to save to storage:', error);
    }
  }

  // ==================== CONFIGURATION ====================

  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    SecurityService.secureStorageSet(this.STORAGE_KEYS.CONFIG, this.config);

    // Restart timer if interval changed
    if (newConfig.flushInterval) {
      this.startFlushTimer();
    }
  }

  setUserId(userId: string): void {
    this.currentSession.userId = userId;
    this.trackEvent('user_action', 'user', 'login', { userId });
  }

  // ==================== UTILITY METHODS ====================

  getQueuedEventsCount(): number {
    return this.eventQueue.filter(e => !e.synced).length;
  }

  getSessionInfo(): SessionData {
    return { ...this.currentSession };
  }

  getAnalyticsStats() {
    return {
      queuedEvents: this.eventQueue.filter(e => !e.synced).length,
      totalEvents: this.eventQueue.length,
      performanceMetrics: this.performanceMetrics.length,
      sessionId: this.currentSession.id,
      sessionDuration: Date.now() - new Date(this.currentSession.startTime).getTime(),
      isOnline: this.isOnline,
      isFlushing: this.isFlushing,
      lastFlushTime: this.eventQueue.find(e => e.synced)?.timestamp
    };
  }

  async clearOfflineData(): Promise<void> {
    try {
      this.eventQueue = [];
      this.performanceMetrics = [];
      this.initializeSession();

      await this.saveToStorage();

      console.log('[OfflineAnalytics] Cleared all offline analytics data');
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to clear offline analytics data', {
        context: 'OfflineAnalyticsService.clearOfflineData'
      });
    }
  }
}

export default OfflineAnalyticsService;