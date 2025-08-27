/**
 * Enhanced Alarm Service Implementation
 * 
 * Extends BaseService and implements IAlarmService interface
 * Provides dependency-injected alarm management with proper lifecycle
 */

import { BaseService } from '../base/BaseService';
import { IAlarmService, IStorageService, ISecurityService, IAnalyticsService, IBattleService } from '../../types/service-interfaces';
import { ServiceConfig } from '../../types/service-architecture';
import { Alarm, VoiceMood, User } from '../../types';
import { generateAlarmId, getNextAlarmTime } from '../../utils';
import { scheduleLocalNotification, cancelLocalNotification } from '../capacitor';
import { TimeoutHandle } from '../../types/timers';

export class EnhancedAlarmService extends BaseService implements IAlarmService {
  public readonly name = 'AlarmService';
  public readonly version = '2.0.0';

  private alarms: Alarm[] = [];
  private checkInterval: TimeoutHandle | null = null;
  private storageService: IStorageService;
  private securityService: ISecurityService;
  private analyticsService: IAnalyticsService;
  private battleService: IBattleService;

  constructor(dependencies: {
    storageService: IStorageService;
    securityService: ISecurityService;
    analyticsService: IAnalyticsService;
    battleService: IBattleService;
    config: ServiceConfig;
  }) {
    super(dependencies.config);
    
    this.storageService = dependencies.storageService;
    this.securityService = dependencies.securityService;
    this.analyticsService = dependencies.analyticsService;
    this.battleService = dependencies.battleService;
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  async initialize(config?: ServiceConfig): Promise<void> {
    await super.initialize(config);
    
    try {
      // Load existing alarms
      await this.loadAlarms();
      
      // Start alarm monitoring
      this.startAlarmMonitoring();
      
      this.markReady();
      console.log(`${this.name} initialized successfully with ${this.alarms.length} alarms`);
      
    } catch (error) {
      console.error(`${this.name} initialization failed:`, error);
      throw error;
    }
  }

  async start(): Promise<void> {
    await super.start();
    this.startAlarmMonitoring();
  }

  async stop(): Promise<void> {
    await super.stop();
    this.stopAlarmMonitoring();
  }

  async cleanup(): Promise<void> {
    this.stopAlarmMonitoring();
    this.alarms = [];
    await super.cleanup();
  }

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  async createAlarm(data: {
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
    this.ensureInitialized();

    try {
      // Security validation
      if (data.userId && !await this.securityService.validateUser(data.userId)) {
        throw new Error('Invalid user ID');
      }

      // Rate limiting
      if (!await this.securityService.checkRateLimit('create_alarm', 10, 300000)) {
        throw new Error('Rate limit exceeded for alarm creation');
      }

      // Create alarm object
      const alarm: Alarm = {
        id: generateAlarmId(),
        time: data.time,
        label: data.label,
        enabled: true,
        days: data.days,
        voiceMood: data.voiceMood,
        sound: data.sound,
        difficulty: data.difficulty || 'medium',
        snoozeEnabled: data.snoozeEnabled ?? true,
        snoozeInterval: data.snoozeInterval || 5,
        maxSnoozes: data.maxSnoozes || 3,
        battleId: data.battleId,
        userId: data.userId,
        weatherEnabled: data.weatherEnabled ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
        snoozeCount: 0,
        dismissed: false,
        isActive: false,
      };

      // Store alarm
      this.alarms.push(alarm);
      await this.persistAlarms();

      // Schedule notification
      await this.scheduleAlarmNotification(alarm);

      // Track analytics
      await this.analyticsService.track('alarm_created', {
        alarmId: alarm.id,
        userId: data.userId,
        difficulty: alarm.difficulty,
        hasBattle: !!alarm.battleId,
      });

      this.emit('alarm:created', alarm);
      return alarm;

    } catch (error) {
      await this.handleError(error as Error, 'createAlarm');
      throw error;
    }
  }

  async updateAlarm(alarmId: string, data: Partial<Alarm>): Promise<Alarm> {
    this.ensureInitialized();

    try {
      const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
      if (alarmIndex === -1) {
        throw new Error(`Alarm ${alarmId} not found`);
      }

      const existingAlarm = this.alarms[alarmIndex];

      // Security validation
      if (data.userId && existingAlarm.userId !== data.userId) {
        if (!this.validateAlarmOwnership(alarmId, data.userId)) {
          throw new Error('Permission denied: Cannot update alarm owned by another user');
        }
      }

      // Update alarm
      const updatedAlarm: Alarm = {
        ...existingAlarm,
        ...data,
        id: alarmId, // Prevent ID changes
        updatedAt: new Date(),
      };

      this.alarms[alarmIndex] = updatedAlarm;
      await this.persistAlarms();

      // Re-schedule notification if needed
      if (data.time || data.days || data.enabled !== undefined) {
        await this.scheduleAlarmNotification(updatedAlarm);
      }

      // Track analytics
      await this.analyticsService.track('alarm_updated', {
        alarmId,
        userId: updatedAlarm.userId,
        changes: Object.keys(data),
      });

      this.emit('alarm:updated', updatedAlarm);
      return updatedAlarm;

    } catch (error) {
      await this.handleError(error as Error, 'updateAlarm');
      throw error;
    }
  }

  async deleteAlarm(alarmId: string, userId?: string): Promise<void> {
    this.ensureInitialized();

    try {
      const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
      if (alarmIndex === -1) {
        throw new Error(`Alarm ${alarmId} not found`);
      }

      const alarm = this.alarms[alarmIndex];

      // Security validation
      if (userId && !this.validateAlarmOwnership(alarmId, userId)) {
        throw new Error('Permission denied: Cannot delete alarm owned by another user');
      }

      // Cancel notification
      await cancelLocalNotification(alarmId);

      // Remove from battle if linked
      if (alarm.battleId) {
        await this.unlinkAlarmFromBattle(alarmId);
      }

      // Remove alarm
      this.alarms.splice(alarmIndex, 1);
      await this.persistAlarms();

      // Track analytics
      await this.analyticsService.track('alarm_deleted', {
        alarmId,
        userId: alarm.userId,
        hadBattle: !!alarm.battleId,
      });

      this.emit('alarm:deleted', alarmId);

    } catch (error) {
      await this.handleError(error as Error, 'deleteAlarm');
      throw error;
    }
  }

  async toggleAlarm(alarmId: string, enabled: boolean): Promise<Alarm> {
    this.ensureInitialized();

    try {
      const alarm = this.alarms.find(a => a.id === alarmId);
      if (!alarm) {
        throw new Error(`Alarm ${alarmId} not found`);
      }

      alarm.enabled = enabled;
      alarm.updatedAt = new Date();

      // Schedule or cancel notification
      if (enabled) {
        await this.scheduleAlarmNotification(alarm);
      } else {
        await cancelLocalNotification(alarmId);
      }

      await this.persistAlarms();

      // Track analytics
      await this.analyticsService.track('alarm_toggled', {
        alarmId,
        enabled,
        userId: alarm.userId,
      });

      this.emit('alarm:toggled', { alarm, enabled });
      return alarm;

    } catch (error) {
      await this.handleError(error as Error, 'toggleAlarm');
      throw error;
    }
  }

  // ============================================================================
  // Query Operations
  // ============================================================================

  async loadAlarms(userId?: string): Promise<Alarm[]> {
    this.ensureInitialized();

    try {
      // Rate limiting
      if (!await this.securityService.checkRateLimit('load_alarms', 20, 60000)) {
        throw new Error('Rate limit exceeded for alarm loading');
      }

      // Load from storage
      const alarmData = await this.storageService.get('alarms') || [];
      
      // Filter by user if specified
      const filteredAlarms = userId 
        ? alarmData.filter((alarm: any) => alarm.userId === userId)
        : alarmData;

      // Convert and validate
      this.alarms = filteredAlarms
        .map((alarm: any) => ({
          ...alarm,
          createdAt: new Date(alarm.createdAt),
          updatedAt: new Date(alarm.updatedAt),
          lastTriggered: alarm.lastTriggered ? new Date(alarm.lastTriggered) : undefined,
        }))
        .filter((alarm: any) => this.validateAlarmData(alarm));

      return this.alarms;

    } catch (error) {
      await this.handleError(error as Error, 'loadAlarms');
      throw error;
    }
  }

  getAlarms(): Alarm[] {
    this.ensureReady();
    return [...this.alarms];
  }

  getAlarmById(id: string): Alarm | undefined {
    this.ensureReady();
    return this.alarms.find(alarm => alarm.id === id);
  }

  getUserAlarms(userId: string): Alarm[] {
    this.ensureReady();
    return this.alarms.filter(alarm => alarm.userId === userId);
  }

  getBattleAlarms(userId: string): Alarm[] {
    this.ensureReady();
    return this.alarms.filter(alarm => 
      alarm.userId === userId && alarm.battleId
    );
  }

  getNonBattleAlarms(userId: string): Alarm[] {
    this.ensureReady();
    return this.alarms.filter(alarm => 
      alarm.userId === userId && !alarm.battleId
    );
  }

  // ============================================================================
  // Alarm Actions
  // ============================================================================

  async dismissAlarm(alarmId: string, method: 'voice' | 'button' | 'shake' | 'challenge', user?: User): Promise<void> {
    this.ensureInitialized();

    try {
      const alarm = this.alarms.find(a => a.id === alarmId);
      if (!alarm) {
        throw new Error(`Alarm ${alarmId} not found`);
      }

      // Security validation
      if (user && alarm.userId !== user.id) {
        throw new Error('Permission denied: Cannot dismiss alarm owned by another user');
      }

      alarm.dismissed = true;
      alarm.isActive = false;
      alarm.lastTriggered = new Date();
      alarm.snoozeCount = 0;
      alarm.updatedAt = new Date();

      await this.persistAlarms();

      // Handle battle integration
      if (alarm.battleId && user) {
        await this.battleService.completeBattleChallenge(alarm.battleId, user.id, method);
      }

      // Track analytics
      await this.analyticsService.track('alarm_dismissed', {
        alarmId,
        method,
        userId: user?.id || alarm.userId,
        battleId: alarm.battleId,
      });

      this.emit('alarm:dismissed', { alarm, method, user });

    } catch (error) {
      await this.handleError(error as Error, 'dismissAlarm');
      throw error;
    }
  }

  async snoozeAlarm(alarmId: string, minutes: number = 5, user?: User): Promise<void> {
    this.ensureInitialized();

    try {
      const alarm = this.alarms.find(a => a.id === alarmId);
      if (!alarm) {
        throw new Error(`Alarm ${alarmId} not found`);
      }

      // Security validation
      if (user && alarm.userId !== user.id) {
        throw new Error('Permission denied: Cannot snooze alarm owned by another user');
      }

      // Check snooze limits
      if (!alarm.snoozeEnabled) {
        throw new Error('Snoozing is disabled for this alarm');
      }

      if (alarm.snoozeCount >= (alarm.maxSnoozes || 3)) {
        throw new Error('Maximum snooze limit reached');
      }

      alarm.snoozeCount++;
      alarm.updatedAt = new Date();

      // Schedule snooze notification
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);
      
      await scheduleLocalNotification({
        id: `${alarmId}_snooze_${alarm.snoozeCount}`,
        title: `Snoozed: ${alarm.label}`,
        body: `Snooze ${alarm.snoozeCount}/${alarm.maxSnoozes}`,
        schedule: { at: snoozeTime },
      });

      await this.persistAlarms();

      // Track analytics
      await this.analyticsService.track('alarm_snoozed', {
        alarmId,
        snoozeMinutes: minutes,
        snoozeCount: alarm.snoozeCount,
        userId: user?.id || alarm.userId,
      });

      this.emit('alarm:snoozed', { alarm, minutes, user });

    } catch (error) {
      await this.handleError(error as Error, 'snoozeAlarm');
      throw error;
    }
  }

  // ============================================================================
  // Battle Integration
  // ============================================================================

  async createBattleAlarm(data: {
    time: string;
    label: string;
    days: number[];
    voiceMood: VoiceMood;
    battleId: string;
    userId: string;
    difficulty?: string;
  }): Promise<Alarm> {
    return this.createAlarm({
      ...data,
      battleId: data.battleId,
    });
  }

  async unlinkAlarmFromBattle(alarmId: string): Promise<void> {
    this.ensureInitialized();

    try {
      const alarm = this.alarms.find(a => a.id === alarmId);
      if (!alarm) {
        throw new Error(`Alarm ${alarmId} not found`);
      }

      if (!alarm.battleId) {
        return; // Already unlinked
      }

      const previousBattleId = alarm.battleId;
      alarm.battleId = undefined;
      alarm.updatedAt = new Date();

      await this.persistAlarms();

      // Track analytics
      await this.analyticsService.track('alarm_unlinked_from_battle', {
        alarmId,
        battleId: previousBattleId,
        userId: alarm.userId,
      });

      this.emit('alarm:battle_unlinked', { alarm, previousBattleId });

    } catch (error) {
      await this.handleError(error as Error, 'unlinkAlarmFromBattle');
      throw error;
    }
  }

  // ============================================================================
  // Validation and Security
  // ============================================================================

  validateAlarmOwnership(alarmId: string, userId: string): boolean {
    const alarm = this.alarms.find(a => a.id === alarmId);
    return alarm?.userId === userId;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async persistAlarms(): Promise<void> {
    try {
      await this.storageService.set('alarms', this.alarms);
    } catch (error) {
      console.error('Failed to persist alarms:', error);
      throw new Error('Failed to save alarm data');
    }
  }

  private async scheduleAlarmNotification(alarm: Alarm): Promise<void> {
    if (!alarm.enabled) return;

    try {
      const nextTrigger = getNextAlarmTime(alarm.time, alarm.days);
      
      await scheduleLocalNotification({
        id: alarm.id,
        title: alarm.label,
        body: `Time to wake up! (${alarm.voiceMood} mood)`,
        schedule: { at: nextTrigger },
        sound: alarm.sound,
      });
    } catch (error) {
      console.error(`Failed to schedule notification for alarm ${alarm.id}:`, error);
    }
  }

  private validateAlarmData(alarm: any): boolean {
    return !!(
      alarm.id &&
      alarm.time &&
      alarm.label &&
      Array.isArray(alarm.days) &&
      alarm.voiceMood
    );
  }

  private startAlarmMonitoring(): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.checkActiveAlarms();
    }, 30000) as any; // Check every 30 seconds
  }

  private stopAlarmMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval as any);
      this.checkInterval = null;
    }
  }

  private async checkActiveAlarms(): Promise<void> {
    const now = new Date();
    
    for (const alarm of this.alarms) {
      if (!alarm.enabled || alarm.dismissed) continue;

      const nextTrigger = getNextAlarmTime(alarm.time, alarm.days);
      if (nextTrigger <= now && !alarm.isActive) {
        alarm.isActive = true;
        alarm.lastTriggered = now;
        
        this.emit('alarm:triggered', alarm);
      }
    }
  }
}