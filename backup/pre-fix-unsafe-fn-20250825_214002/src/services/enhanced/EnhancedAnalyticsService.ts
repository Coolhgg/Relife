/**
 * Enhanced Analytics Service Implementation
 * 
 * Extends BaseService and implements IAnalyticsService interface
 * Provides dependency-injected analytics with proper lifecycle management
 */

import { BaseService } from '../base/BaseService';
import { IAnalyticsService, IStorageService } from '../../types/service-interfaces';
import { ServiceConfig } from '../../types/service-architecture';

interface AnalyticsEvent {
  id: string;
  event: string;
  properties: Record<string, any>;
  userId?: string;
  timestamp: Date;
  sessionId?: string;
}

interface AnalyticsQueue {
  events: AnalyticsEvent[];
  maxSize: number;
  flushInterval: number;
}

export class EnhancedAnalyticsService extends BaseService implements IAnalyticsService {
  public readonly name = 'AnalyticsService';
  public readonly version = '2.0.0';

  private storageService: IStorageService;
  private queue: AnalyticsQueue;
  private sessionId: string;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(dependencies: {
    storageService: IStorageService;
    config: ServiceConfig;
  }) {
    super(dependencies.config);
    
    this.storageService = dependencies.storageService;
    this.sessionId = this.generateSessionId();
    this.queue = {
      events: [],
      maxSize: 100,
      flushInterval: 30000, // 30 seconds
    };
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  async initialize(config?: ServiceConfig): Promise<void> {
    await super.initialize(config);
    
    try {
      // Load queued events from storage
      await this.loadQueuedEvents();
      
      // Start auto-flush timer
      this.startAutoFlush();
      
      // Track session start
      await this.track('session_started', {
        sessionId: this.sessionId,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        timestamp: new Date().toISOString(),
      });
      
      this.markReady();
      console.log(`${this.name} initialized successfully`);
      
    } catch (error) {
      console.error(`${this.name} initialization failed:`, error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    await super.stop();
    
    // Flush remaining events before stopping
    await this.flush();
    
    // Stop auto-flush timer
    this.stopAutoFlush();
    
    // Track session end
    await this.track('session_ended', {
      sessionId: this.sessionId,
      duration: Date.now() - this.getInitializationTime(),
    });
  }

  async cleanup(): Promise<void> {
    this.stopAutoFlush();
    await this.flush();
    this.queue.events = [];
    await super.cleanup();
  }

  // ============================================================================
  // Event Tracking Methods
  // ============================================================================

  async track(event: string, properties?: Record<string, any>): Promise<void> {
    this.ensureInitialized();

    try {
      const analyticsEvent: AnalyticsEvent = {
        id: this.generateEventId(),
        event,
        properties: properties || {},
        timestamp: new Date(),
        sessionId: this.sessionId,
      };

      // Add to queue
      this.queue.events.push(analyticsEvent);

      // Flush if queue is full
      if (this.queue.events.length >= this.queue.maxSize) {
        await this.flush();
      }

      // Save to storage for persistence
      await this.persistQueue();

      this.emit('analytics:event_tracked', { event, properties });

    } catch (error) {
      await this.handleError(error as Error, 'track');
      console.error('Failed to track event:', event, error);
    }
  }

  async identify(userId: string, traits?: Record<string, any>): Promise<void> {
    this.ensureInitialized();

    try {
      await this.track('user_identified', {
        userId,
        traits: traits || {},
        previousUserId: this.getCurrentUserId(),
      });

      // Store user ID for future events
      await this.storageService.set('analytics_user_id', userId);
      
      this.emit('analytics:user_identified', { userId, traits });

    } catch (error) {
      await this.handleError(error as Error, 'identify');
      console.error('Failed to identify user:', userId, error);
    }
  }

  async page(name: string, properties?: Record<string, any>): Promise<void> {
    this.ensureInitialized();

    try {
      await this.track('page_viewed', {
        page: name,
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        referrer: typeof document !== 'undefined' ? document.referrer : 'unknown',
        ...properties,
      });

      this.emit('analytics:page_viewed', { name, properties });

    } catch (error) {
      await this.handleError(error as Error, 'page');
      console.error('Failed to track page view:', name, error);
    }
  }

  // ============================================================================
  // User Analytics Methods
  // ============================================================================

  async trackUserAction(userId: string, action: string, metadata?: Record<string, any>): Promise<void> {
    this.ensureInitialized();

    try {
      await this.track('user_action', {
        userId,
        action,
        metadata: metadata || {},
      });

      this.emit('analytics:user_action', { userId, action, metadata });

    } catch (error) {
      await this.handleError(error as Error, 'trackUserAction');
      console.error('Failed to track user action:', action, error);
    }
  }

  async trackPerformanceMetric(metric: string, value: number, tags?: Record<string, string>): Promise<void> {
    this.ensureInitialized();

    try {
      await this.track('performance_metric', {
        metric,
        value,
        tags: tags || {},
        timestamp: Date.now(),
      });

      this.emit('analytics:performance_metric', { metric, value, tags });

    } catch (error) {
      await this.handleError(error as Error, 'trackPerformanceMetric');
      console.error('Failed to track performance metric:', metric, error);
    }
  }

  // ============================================================================
  // Queue Management Methods
  // ============================================================================

  async flush(): Promise<void> {
    if (this.queue.events.length === 0) return;

    this.ensureInitialized();

    try {
      const eventsToSend = [...this.queue.events];
      this.queue.events = [];

      // In a real implementation, this would send to an analytics service
      // For now, we'll just log and store locally
      console.log('Flushing analytics events:', eventsToSend.length);

      // Store events for offline analysis
      const existingEvents = await this.storageService.get('analytics_events') || [];
      await this.storageService.set('analytics_events', [...existingEvents, ...eventsToSend]);

      // Update queue storage
      await this.persistQueue();

      this.emit('analytics:events_flushed', { count: eventsToSend.length });

    } catch (error) {
      // If flush fails, restore events to queue
      this.queue.events = [...this.queue.events];
      await this.handleError(error as Error, 'flush');
      console.error('Failed to flush analytics events:', error);
    }
  }

  getQueueSize(): number {
    return this.queue.events.length;
  }

  // ============================================================================
  // Configuration Methods
  // ============================================================================

  async updateConfiguration(config: Partial<ServiceConfig>): Promise<void> {
    await super.updateConfig(config);

    // Update queue configuration if provided
    if (config.analytics) {
      this.queue.maxSize = config.analytics.maxQueueSize || this.queue.maxSize;
      this.queue.flushInterval = config.analytics.flushInterval || this.queue.flushInterval;
      
      // Restart auto-flush with new interval
      this.stopAutoFlush();
      this.startAutoFlush();
    }

    this.emit('analytics:config_updated', config);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getInitializationTime(): number {
    // This would be set during initialization
    return Date.now();
  }

  private async getCurrentUserId(): Promise<string | null> {
    try {
      return await this.storageService.get('analytics_user_id');
    } catch {
      return null;
    }
  }

  private async loadQueuedEvents(): Promise<void> {
    try {
      const queueData = await this.storageService.get('analytics_queue');
      if (queueData && Array.isArray(queueData.events)) {
        this.queue.events = queueData.events.map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp),
        }));
      }
    } catch (error) {
      console.warn('Failed to load queued analytics events:', error);
    }
  }

  private async persistQueue(): Promise<void> {
    try {
      await this.storageService.set('analytics_queue', {
        events: this.queue.events,
        lastPersisted: new Date(),
      });
    } catch (error) {
      console.warn('Failed to persist analytics queue:', error);
    }
  }

  private startAutoFlush(): void {
    if (this.flushTimer) return;

    this.flushTimer = setInterval(async () => {
      if (this.queue.events.length > 0) {
        await this.flush();
      }
    }, this.queue.flushInterval);
  }

  private stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}