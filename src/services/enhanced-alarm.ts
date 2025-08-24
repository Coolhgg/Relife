/**
 * Enhanced Alarm Service
 * Refactored to use standardized service architecture with improved testability
 */

import type { Alarm, VoiceMood, AlarmEvent, AlarmInstance, User } from '../types';
import { generateAlarmId, getNextAlarmTime } from '../utils';
import { BaseService } from './base/BaseService';
import { CacheProvider, getCacheManager } from './base/CacheManager';
import {
  AlarmServiceInterface,
  ServiceConfig,
  ServiceHealth
} from '../types/service-architecture';

export interface AlarmServiceConfig extends ServiceConfig {
  maxAlarmsPerUser: number;
  checkInterval: number;
  cacheTimeout: number;
  enableBattleIntegration: boolean;
  enableSecurityLogging: boolean;
  enablePerformanceTracking: boolean;
}

export interface AlarmServiceDependencies {
  capacitorService?: any;
  analyticsService?: any;
  secureStorageService?: any;
  securityService?: any;
  errorHandler?: any;
  battleIntegrationService?: any;
}

export class EnhancedAlarmService extends BaseService implements AlarmServiceInterface {
  private alarms: Map<string, Alarm> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private cache: CacheProvider;
  private dependencies: AlarmServiceDependencies;

  constructor(dependencies: AlarmServiceDependencies, config: AlarmServiceConfig) {
    super('AlarmService', '2.0.0', config);
    this.dependencies = dependencies;
    this.cache = getCacheManager().getProvider(config.caching?.strategy || 'memory');
  }

  // ============================================================================
  // BaseService Implementation
  // ============================================================================

  protected getDefaultConfig(): Partial<AlarmServiceConfig> {
    return {
      maxAlarmsPerUser: 50,
      checkInterval: 60000, // 1 minute
      cacheTimeout: 300000, // 5 minutes
      enableBattleIntegration: true,
      enableSecurityLogging: true,
      enablePerformanceTracking: true,
      ...super.getDefaultConfig?.() || {}
    };
  }

  protected async doInitialize(): Promise<void> {
    const timerId = this.startTimer('initialize');
    
    try {
      // Initialize cache if not already done
      await this.setupCache();
      
      // Load initial alarms from storage
      await this.loadAlarmsFromStorage();
      
      // Start alarm checking if enabled
      if (this.config.enabled) {
        this.startAlarmChecker();
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.emit('alarms:initialized', {
        alarmCount: this.alarms.size
      });
      
      this.recordMetric('initialize_duration', this.endTimer(timerId) || 0);
      
    } catch (error) {
      this.handleError(error, 'Failed to initialize AlarmService');
      throw error;
    }
  }

  protected async doCleanup(): Promise<void> {
    try {
      // Stop alarm checker
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
      
      // Save any pending changes
      await this.saveAlarmsToStorage();
      
      // Clear cache
      await this.cache.clear();
      
      // Clear in-memory alarms
      this.alarms.clear();
      
    } catch (error) {
      this.handleError(error, 'Failed to cleanup AlarmService');
    }
  }

  public async getHealth(): Promise<ServiceHealth> {
    const baseHealth = await super.getHealth();
    
    // Additional alarm-specific health checks
    const alarmCount = this.alarms.size;
    const cacheStats = await this.cache.stats();
    
    // Determine if service is healthy based on alarm-specific criteria
    let status = baseHealth.status;
    if (alarmCount > (this.config as AlarmServiceConfig).maxAlarmsPerUser * 10) {
      status = 'degraded';
    }
    
    return {
      ...baseHealth,
      status,
      metrics: {
        ...baseHealth.metrics || {},
        alarmCount,
        cacheHitRate: cacheStats.hitRate,
        pendingAlarms: this.getPendingAlarmsCount(),
        nextAlarmTime: this.getNextAlarmTime()?.getTime() || 0
      }
    };
  }

  // ============================================================================
  // AlarmServiceInterface Implementation
  // ============================================================================

  public async createAlarm(alarmData: {
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
  }): Promise<Alarm> {
    const timerId = this.startTimer('createAlarm');
    
    try {
      // Validate input
      this.validateAlarmData(alarmData);
      
      // Check user alarm limit
      await this.checkUserAlarmLimit(alarmData.userId);
      
      // Rate limiting check
      if (!await this.checkRateLimit('create_alarm', alarmData.userId)) {
        throw new Error('Rate limit exceeded for alarm creation');
      }
      
      const now = new Date();
      const newAlarm: Alarm = {
        id: generateAlarmId(),
        userId: alarmData.userId || 'default_user',
        time: alarmData.time,
        label: alarmData.label,
        enabled: true,
        isActive: true,
        days: alarmData.days,
        dayNames: alarmData.days.map(d => [
          'sunday', 'monday', 'tuesday', 'wednesday',
          'thursday', 'friday', 'saturday'
        ][d] as any),
        voiceMood: alarmData.voiceMood,
        sound: alarmData.sound || 'default',
        difficulty: (alarmData.difficulty || 'medium') as any,
        snoozeEnabled: alarmData.snoozeEnabled ?? true,
        snoozeInterval: alarmData.snoozeInterval || 5,
        snoozeCount: 0,
        maxSnoozes: alarmData.maxSnoozes,
        battleId: alarmData.battleId,
        weatherEnabled: alarmData.weatherEnabled || false,
        createdAt: now,
        updatedAt: now,
      };
      
      // Validate complete alarm object
      if (!this.validateCompleteAlarm(newAlarm)) {
        throw new Error('Invalid alarm data after creation');
      }
      
      // Store in memory and cache
      this.alarms.set(newAlarm.id, newAlarm);
      await this.cacheAlarm(newAlarm);
      
      // Persist to storage
      await this.saveAlarmsToStorage();
      
      // Schedule notification
      await this.scheduleNotification(newAlarm);
      
      // Handle battle integration if enabled
      if (newAlarm.battleId && this.dependencies.battleIntegrationService) {
        await this.handleBattleIntegration('create', newAlarm);
      }
      
      // Log security event
      await this.logSecurityEvent('alarm_created', {
        alarmId: newAlarm.id,
        userId: alarmData.userId,
        timestamp: now.toISOString(),
      });
      
      // Track analytics
      await this.trackAnalyticsEvent('alarm_created', {
        alarmId: newAlarm.id,
        difficulty: newAlarm.difficulty,
        hasBattle: !!newAlarm.battleId,
        voiceMood: newAlarm.voiceMood
      });
      
      this.recordMetric('createAlarm_duration', this.endTimer(timerId) || 0);
      this.emit('alarm:created', newAlarm);
      
      return newAlarm;
      
    } catch (error) {
      this.recordMetric('createAlarm_errors', 1);
      this.handleError(error, 'Failed to create alarm', { alarmData });
      throw error;
    }
  }

  public async updateAlarm(id: string, updates: Partial<Alarm>): Promise<Alarm> {
    const timerId = this.startTimer('updateAlarm');
    
    try {
      const existingAlarm = await this.getAlarmById(id);
      if (!existingAlarm) {
        throw new Error(`Alarm with ID ${id} not found`);
      }
      
      // Validate ownership if userId is provided
      if (updates.userId && existingAlarm.userId !== updates.userId) {
        throw new Error('Access denied: cannot update alarm belonging to another user');
      }
      
      // Rate limiting check
      if (!await this.checkRateLimit('update_alarm', existingAlarm.userId)) {
        throw new Error('Rate limit exceeded for alarm updates');
      }
      
      const updatedAlarm: Alarm = {
        ...existingAlarm,
        ...updates,
        id, // Ensure ID cannot be changed
        updatedAt: new Date(),
      };
      
      // Validate updated alarm
      if (!this.validateCompleteAlarm(updatedAlarm)) {
        throw new Error('Invalid updated alarm data');
      }
      
      // Update in memory and cache
      this.alarms.set(id, updatedAlarm);
      await this.cacheAlarm(updatedAlarm);
      
      // Persist to storage
      await this.saveAlarmsToStorage();
      
      // Reschedule notification
      await this.cancelNotification(id);
      if (updatedAlarm.enabled) {
        await this.scheduleNotification(updatedAlarm);
      }
      
      // Handle battle integration if enabled
      if (updatedAlarm.battleId && this.dependencies.battleIntegrationService) {
        await this.handleBattleIntegration('update', updatedAlarm);
      }
      
      // Log security event
      await this.logSecurityEvent('alarm_updated', {
        alarmId: id,
        userId: updatedAlarm.userId,
        changes: Object.keys(updates),
        timestamp: new Date().toISOString(),
      });
      
      this.recordMetric('updateAlarm_duration', this.endTimer(timerId) || 0);
      this.emit('alarm:updated', { id, alarm: updatedAlarm, changes: updates });
      
      return updatedAlarm;
      
    } catch (error) {
      this.recordMetric('updateAlarm_errors', 1);
      this.handleError(error, 'Failed to update alarm', { id, updates });
      throw error;
    }
  }

  public async deleteAlarm(id: string): Promise<boolean> {
    const timerId = this.startTimer('deleteAlarm');
    
    try {
      const alarm = await this.getAlarmById(id);
      if (!alarm) {
        return false;
      }
      
      // Rate limiting check
      if (!await this.checkRateLimit('delete_alarm', alarm.userId)) {
        throw new Error('Rate limit exceeded for alarm deletion');
      }
      
      // Cancel notification
      await this.cancelNotification(id);
      
      // Remove from memory and cache
      this.alarms.delete(id);
      await this.cache.delete(`alarm:${id}`);
      
      // Persist changes
      await this.saveAlarmsToStorage();
      
      // Handle battle integration if enabled
      if (alarm.battleId && this.dependencies.battleIntegrationService) {
        await this.handleBattleIntegration('delete', alarm);
      }
      
      // Log security event
      await this.logSecurityEvent('alarm_deleted', {
        alarmId: id,
        userId: alarm.userId,
        timestamp: new Date().toISOString(),
      });
      
      this.recordMetric('deleteAlarm_duration', this.endTimer(timerId) || 0);
      this.emit('alarm:deleted', { id, alarm });
      
      return true;
      
    } catch (error) {
      this.recordMetric('deleteAlarm_errors', 1);
      this.handleError(error, 'Failed to delete alarm', { id });
      throw error;
    }
  }

  public async getAlarms(): Promise<Alarm[]> {
    try {
      return Array.from(this.alarms.values());
    } catch (error) {
      this.handleError(error, 'Failed to get alarms');
      return [];
    }
  }

  public async triggerAlarm(id: string): Promise<void> {
    const timerId = this.startTimer('triggerAlarm');
    
    try {
      const alarm = await this.getAlarmById(id);
      if (!alarm) {
        throw new Error(`Alarm with ID ${id} not found`);
      }
      
      const now = new Date();
      
      // Create alarm instance for tracking
      const alarmInstance: AlarmInstance = {
        id: `instance_${Date.now()}_${id}`,
        alarmId: id,
        scheduledTime: now.toISOString(),
        status: 'triggered',
        snoozeCount: 0,
        battleId: alarm.battleId,
      };
      
      // Handle battle integration
      if (alarm.battleId && this.dependencies.battleIntegrationService) {
        await this.handleBattleIntegration('trigger', alarm, alarmInstance);
      }
      
      // Log alarm event
      await this.logAlarmEvent({
        id: `event_${Date.now()}`,
        alarmId: id,
        firedAt: now,
        dismissed: false,
        snoozed: false,
        userAction: 'triggered',
      });
      
      // Emit trigger event
      this.emit('alarm:triggered', { alarm, alarmInstance });
      
      // Dispatch browser event for UI
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('alarm-triggered', {
            detail: { alarm, alarmInstance },
          })
        );
      }
      
      this.recordMetric('triggerAlarm_duration', this.endTimer(timerId) || 0);
      
    } catch (error) {
      this.recordMetric('triggerAlarm_errors', 1);
      this.handleError(error, 'Failed to trigger alarm', { id });
      throw error;
    }
  }

  public async snoozeAlarm(id: string, duration: number): Promise<void> {
    const timerId = this.startTimer('snoozeAlarm');
    
    try {
      const alarm = await this.getAlarmById(id);
      if (!alarm) {
        throw new Error(`Alarm with ID ${id} not found`);
      }
      
      if (!alarm.snoozeEnabled) {
        throw new Error('Snoozing is not enabled for this alarm');
      }
      
      const newSnoozeCount = alarm.snoozeCount + 1;
      const maxSnoozes = alarm.maxSnoozes || Infinity;
      
      if (newSnoozeCount > maxSnoozes) {
        throw new Error(`Maximum snoozes exceeded (${newSnoozeCount}/${maxSnoozes})`);
      }
      
      // Update snooze count
      const updatedAlarm = {
        ...alarm,
        snoozeCount: newSnoozeCount,
        updatedAt: new Date(),
      };
      
      this.alarms.set(id, updatedAlarm);
      await this.cacheAlarm(updatedAlarm);
      
      // Schedule snooze notification
      const nextSnoozeTime = new Date(Date.now() + duration * 60 * 1000);
      await this.scheduleSnoozeNotification(updatedAlarm, nextSnoozeTime);
      
      // Log alarm event
      await this.logAlarmEvent({
        id: `event_${Date.now()}`,
        alarmId: id,
        firedAt: new Date(),
        dismissed: false,
        snoozed: true,
        userAction: 'snoozed',
      });
      
      // Handle battle integration
      if (alarm.battleId && this.dependencies.battleIntegrationService) {
        await this.handleBattleIntegration('snooze', updatedAlarm, undefined, newSnoozeCount);
      }
      
      this.recordMetric('snoozeAlarm_duration', this.endTimer(timerId) || 0);
      this.emit('alarm:snoozed', { id, alarm: updatedAlarm, duration, snoozeCount: newSnoozeCount });
      
    } catch (error) {
      this.recordMetric('snoozeAlarm_errors', 1);
      this.handleError(error, 'Failed to snooze alarm', { id, duration });
      throw error;
    }
  }

  // ============================================================================
  // Additional Public Methods
  // ============================================================================

  public async getAlarmById(id: string): Promise<Alarm | null> {
    try {
      // Try cache first
      const cached = await this.cache.get<Alarm>(`alarm:${id}`);
      if (cached) {
        return cached;
      }
      
      // Fallback to memory
      const alarm = this.alarms.get(id) || null;
      if (alarm) {
        await this.cacheAlarm(alarm);
      }
      
      return alarm;
    } catch (error) {
      this.handleError(error, 'Failed to get alarm by ID', { id });
      return null;
    }
  }

  public async getUserAlarms(userId: string): Promise<Alarm[]> {
    try {
      const allAlarms = await this.getAlarms();
      return allAlarms.filter(alarm => !alarm.userId || alarm.userId === userId);
    } catch (error) {
      this.handleError(error, 'Failed to get user alarms', { userId });
      return [];
    }
  }

  public async toggleAlarm(id: string, enabled: boolean): Promise<Alarm> {
    return this.updateAlarm(id, { enabled });
  }

  public async dismissAlarm(id: string, method: string): Promise<void> {
    const timerId = this.startTimer('dismissAlarm');
    
    try {
      const alarm = await this.getAlarmById(id);
      if (!alarm) {
        throw new Error(`Alarm with ID ${id} not found`);
      }
      
      // Reset snooze count and update last triggered
      const dismissalTime = new Date();
      const updatedAlarm = {
        ...alarm,
        snoozeCount: 0,
        lastTriggered: dismissalTime,
        updatedAt: dismissalTime,
      };
      
      this.alarms.set(id, updatedAlarm);
      await this.cacheAlarm(updatedAlarm);
      
      // Log alarm event
      await this.logAlarmEvent({
        id: `event_${Date.now()}`,
        alarmId: id,
        firedAt: dismissalTime,
        dismissed: true,
        snoozed: false,
        userAction: 'dismissed',
        dismissMethod: method,
      });
      
      // Handle battle integration
      if (alarm.battleId && this.dependencies.battleIntegrationService) {
        await this.handleBattleIntegration('dismiss', updatedAlarm, undefined, undefined, method);
      }
      
      // Reschedule for next occurrence
      await this.scheduleNotification(updatedAlarm);
      
      this.recordMetric('dismissAlarm_duration', this.endTimer(timerId) || 0);
      this.emit('alarm:dismissed', { id, alarm: updatedAlarm, method });
      
    } catch (error) {
      this.recordMetric('dismissAlarm_errors', 1);
      this.handleError(error, 'Failed to dismiss alarm', { id, method });
      throw error;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async setupCache(): Promise<void> {
    try {
      // Initialize cache if needed
      const cacheStats = await this.cache.stats();
      console.debug(`[AlarmService] Cache initialized with ${cacheStats.size} entries`);
    } catch (error) {
      this.handleError(error, 'Failed to setup cache');
    }
  }

  private async loadAlarmsFromStorage(): Promise<void> {
    try {
      if (!this.dependencies.secureStorageService) {
        console.warn('[AlarmService] No secure storage service available');
        return;
      }
      
      const storage = this.dependencies.secureStorageService.getInstance();
      const alarmData = await storage.retrieveAlarms();
      
      // Convert and validate loaded alarms
      alarmData.forEach((alarmObj: any) => {
        try {
          const alarm: Alarm = {
            ...alarmObj,
            createdAt: new Date(alarmObj.createdAt),
            updatedAt: new Date(alarmObj.updatedAt),
            lastTriggered: alarmObj.lastTriggered ? new Date(alarmObj.lastTriggered) : undefined,
          };
          
          if (this.validateCompleteAlarm(alarm)) {
            this.alarms.set(alarm.id, alarm);
          }
        } catch (error) {
          console.warn(`[AlarmService] Failed to load alarm ${alarmObj.id}:`, error);
        }
      });
      
      console.debug(`[AlarmService] Loaded ${this.alarms.size} alarms from storage`);
      
    } catch (error) {
      this.handleError(error, 'Failed to load alarms from storage');
    }
  }

  private async saveAlarmsToStorage(): Promise<void> {
    try {
      if (!this.dependencies.secureStorageService) {
        return;
      }
      
      const storage = this.dependencies.secureStorageService.getInstance();
      const alarmsArray = Array.from(this.alarms.values());
      await storage.storeAlarms(alarmsArray);
      
    } catch (error) {
      this.handleError(error, 'Failed to save alarms to storage');
    }
  }

  private async cacheAlarm(alarm: Alarm): Promise<void> {
    try {
      const cacheTimeout = (this.config as AlarmServiceConfig).cacheTimeout;
      await this.cache.set(`alarm:${alarm.id}`, alarm, cacheTimeout);
    } catch (error) {
      console.warn(`[AlarmService] Failed to cache alarm ${alarm.id}:`, error);
    }
  }

  private validateAlarmData(data: any): void {
    if (!data.time || !/^([01]?\d|2[0-3]):[0-5]\d$/.test(data.time)) {
      throw new Error('Invalid time format');
    }
    
    if (!data.label || typeof data.label !== 'string' || data.label.length > 100) {
      throw new Error('Invalid label');
    }
    
    if (!Array.isArray(data.days) || data.days.length === 0) {
      throw new Error('Invalid days array');
    }
    
    if (!data.days.every((day: any) => typeof day === 'number' && day >= 0 && day <= 6)) {
      throw new Error('Invalid day values');
    }
    
    if (!data.voiceMood) {
      throw new Error('Voice mood is required');
    }
  }

  private validateCompleteAlarm(alarm: Alarm): boolean {
    try {
      return !!(
        alarm.id &&
        alarm.time &&
        alarm.label &&
        alarm.voiceMood &&
        Array.isArray(alarm.days) &&
        alarm.days.length > 0 &&
        alarm.days.every(day => typeof day === 'number' && day >= 0 && day <= 6)
      );
    } catch {
      return false;
    }
  }

  private async checkUserAlarmLimit(userId?: string): Promise<void> {
    if (!userId) return;
    
    const userAlarms = await this.getUserAlarms(userId);
    const maxAlarms = (this.config as AlarmServiceConfig).maxAlarmsPerUser;
    
    if (userAlarms.length >= maxAlarms) {
      throw new Error(`Maximum alarm limit reached (${maxAlarms})`);
    }
  }

  private async checkRateLimit(action: string, userId?: string): Promise<boolean> {
    if (!this.dependencies.securityService) {
      return true; // No rate limiting if security service unavailable
    }
    
    const key = `${action}_${userId || 'anonymous'}`;
    return this.dependencies.securityService.checkRateLimit(key, 10, 60000);
  }

  private startAlarmChecker(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    const interval = (this.config as AlarmServiceConfig).checkInterval;
    this.checkInterval = setInterval(() => {
      this.checkForTriggeredAlarms();
    }, interval);
    
    // Check immediately
    this.checkForTriggeredAlarms();
  }

  private async checkForTriggeredAlarms(): Promise<void> {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDay = now.getDay();
      
      for (const alarm of this.alarms.values()) {
        if (!alarm.enabled || !alarm.days.includes(currentDay)) {
          continue;
        }
        
        const [alarmHour, alarmMinute] = alarm.time.split(':').map(Number);
        
        if (alarmHour === currentHour && alarmMinute === currentMinute) {
          await this.triggerAlarm(alarm.id);
        }
      }
    } catch (error) {
      this.handleError(error, 'Error checking for triggered alarms');
    }
  }

  private async scheduleNotification(alarm: Alarm): Promise<void> {
    if (!this.dependencies.capacitorService || !alarm.enabled || alarm.days.length === 0) {
      return;
    }
    
    try {
      const nextTime = getNextAlarmTime(alarm);
      if (!nextTime) return;
      
      let notificationBody = 'Time to wake up!';
      if (alarm.snoozeEnabled) {
        notificationBody += ` (Snooze: ${alarm.snoozeInterval}min`;
        if (alarm.maxSnoozes && alarm.maxSnoozes > 0) {
          notificationBody += `, max ${alarm.maxSnoozes}x`;
        }
        notificationBody += ')';
      }
      
      await this.dependencies.capacitorService.scheduleLocalNotification({
        id: parseInt(alarm.id.replace(/\D/g, '')),
        title: `🔔 ${alarm.label}`,
        body: notificationBody,
        schedule: nextTime,
      });
      
    } catch (error) {
      this.handleError(error, 'Failed to schedule notification', { alarmId: alarm.id });
    }
  }

  private async scheduleSnoozeNotification(alarm: Alarm, snoozeTime: Date): Promise<void> {
    if (!this.dependencies.capacitorService) return;
    
    try {
      await this.dependencies.capacitorService.scheduleLocalNotification({
        id: parseInt(alarm.id.replace(/\D/g, '')) + 10000, // Offset for snooze
        title: `⏰ ${alarm.label} (Snoozed)`,
        body: `Time to wake up! (Snooze ${alarm.snoozeCount}/${alarm.maxSnoozes === undefined ? '∞' : alarm.maxSnoozes})`,
        schedule: snoozeTime,
      });
    } catch (error) {
      this.handleError(error, 'Failed to schedule snooze notification', { alarmId: alarm.id });
    }
  }

  private async cancelNotification(alarmId: string): Promise<void> {
    if (!this.dependencies.capacitorService) return;
    
    try {
      await this.dependencies.capacitorService.cancelLocalNotification(
        parseInt(alarmId.replace(/\D/g, ''))
      );
    } catch (error) {
      console.warn(`[AlarmService] Failed to cancel notification for ${alarmId}:`, error);
    }
  }

  private async logAlarmEvent(event: AlarmEvent): Promise<void> {
    try {
      if (!this.dependencies.secureStorageService) return;
      
      const storage = this.dependencies.secureStorageService.getInstance();
      const existingEvents = await storage.retrieveAlarmEvents() || [];
      
      existingEvents.push(event);
      
      // Keep only last 100 events
      if (existingEvents.length > 100) {
        existingEvents.splice(0, existingEvents.length - 100);
      }
      
      await storage.storeAlarmEvents(existingEvents);
    } catch (error) {
      console.warn('[AlarmService] Failed to log alarm event:', error);
    }
  }

  private async logSecurityEvent(event: string, details: any): Promise<void> {
    if (!(this.config as AlarmServiceConfig).enableSecurityLogging) return;
    
    try {
      const logEntry = {
        event,
        details,
        timestamp: new Date().toISOString(),
        source: 'EnhancedAlarmService',
      };
      
      // Emit event for external security monitoring
      this.emit('security:event', logEntry);
      
      // Log to browser console in development
      if (this.config.debug) {
        console.log('[ALARM SECURITY LOG]', logEntry);
      }
      
    } catch (error) {
      console.warn('[AlarmService] Failed to log security event:', error);
    }
  }

  private async trackAnalyticsEvent(event: string, data: any): Promise<void> {
    if (!(this.config as AlarmServiceConfig).enablePerformanceTracking) return;
    
    try {
      if (this.dependencies.analyticsService) {
        await this.dependencies.analyticsService.getInstance().track(event, data);
      }
    } catch (error) {
      console.warn('[AlarmService] Failed to track analytics event:', error);
    }
  }

  private async handleBattleIntegration(
    action: string,
    alarm: Alarm,
    instance?: AlarmInstance,
    snoozeCount?: number,
    method?: string
  ): Promise<void> {
    if (!(this.config as AlarmServiceConfig).enableBattleIntegration) return;
    
    try {
      const battleService = this.dependencies.battleIntegrationService;
      if (!battleService) return;
      
      switch (action) {
        case 'create':
          await battleService.handleAlarmCreated(alarm);
          break;
        case 'trigger':
          if (instance) {
            await battleService.handleAlarmTrigger(instance);
          }
          break;
        case 'dismiss':
          if (instance) {
            await battleService.handleAlarmDismissal(instance, method);
          }
          break;
        case 'snooze':
          if (instance && typeof snoozeCount === 'number') {
            await battleService.handleAlarmSnooze(instance, snoozeCount);
          }
          break;
      }
    } catch (error) {
      console.warn('[AlarmService] Battle integration error:', error);
    }
  }

  private setupEventListeners(): void {
    // Listen for configuration changes
    this.on('service:config-updated', async (data) => {
      if (data.serviceName === this.name) {
        // Restart alarm checker if interval changed
        if (this.checkInterval) {
          this.startAlarmChecker();
        }
      }
    });
  }

  private getPendingAlarmsCount(): number {
    return Array.from(this.alarms.values()).filter(alarm => 
      alarm.enabled && alarm.days.length > 0
    ).length;
  }

  private getNextAlarmTime(): Date | null {
    const now = new Date();
    let nextTime: Date | null = null;
    
    for (const alarm of this.alarms.values()) {
      if (!alarm.enabled || alarm.days.length === 0) continue;
      
      const alarmNextTime = getNextAlarmTime(alarm);
      if (alarmNextTime && (!nextTime || alarmNextTime < nextTime)) {
        nextTime = alarmNextTime;
      }
    }
    
    return nextTime;
  }

  // ============================================================================
  // Testing Support
  // ============================================================================

  public async reset(): Promise<void> {
    await super.reset();
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.alarms.clear();
    await this.cache.clear();
  }

  public getTestState(): any {
    return {
      ...super.getTestState(),
      alarmCount: this.alarms.size,
      cacheSize: this.cache.size?.() || 0,
      hasCheckInterval: !!this.checkInterval
    };
  }
}

// Factory function for dependency injection
export const createAlarmService = (
  dependencies: AlarmServiceDependencies,
  config: AlarmServiceConfig
): EnhancedAlarmService => {
  return new EnhancedAlarmService(dependencies, config);
};