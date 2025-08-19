import type { Alarm, VoiceMood, AlarmEvent, AlarmInstance, User } from '../types';
import { generateAlarmId, getNextAlarmTime } from '../utils';
import { scheduleLocalNotification, cancelLocalNotification } from './capacitor';
import { alarmBattleIntegration } from './alarm-battle-integration';
import AppAnalyticsService from './app-analytics';
import SecureAlarmStorageService from './secure-alarm-storage';
import SecurityService from './security';
import { ErrorHandler } from './error-handler';

export class AlarmService {
  private static alarms: Alarm[] = [];
  private static checkInterval: NodeJS.Timeout | null = null;
  
  static async loadAlarms(userId?: string): Promise<Alarm[]> {
    try {
      // Rate limiting check for alarm loading
      if (!SecurityService.checkRateLimit('load_alarms', 20, 60000)) {
        throw new Error('Too many alarm load attempts. Please wait.');
      }

      // Use secure storage to retrieve alarms
      const secureStorage = SecureAlarmStorageService.getInstance();
      const alarmData = await secureStorage.retrieveAlarms(userId);
      
      // Convert date strings back to Date objects and validate
      this.alarms = alarmData.map((alarm) => ({
        ...alarm,
        createdAt: new Date(alarm.createdAt),
        updatedAt: new Date(alarm.updatedAt),
        lastTriggered: alarm.lastTriggered ? new Date(alarm.lastTriggered) : undefined
      })).filter(alarm => {
        // Additional validation for loaded alarms
        return alarm.id && 
               alarm.time && 
               alarm.label && 
               Array.isArray(alarm.days) &&
               alarm.voiceMood;
      });
      
      // Start alarm checking
      this.startAlarmChecker();
      
      // Log security event
      this.logSecurityEvent('alarms_loaded', {
        userId,
        alarmCount: this.alarms.length,
        timestamp: new Date().toISOString()
      });
      
      return this.alarms;
    } catch (error) {
      const wrappedError = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.handleError(
        wrappedError,
        'Failed to load alarms',
        { context: 'alarm_loading', metadata: { userId } }
      );
      console.error('Error loading alarms:', error);
      throw wrappedError;
    }
  }
  
  static async saveAlarms(userId?: string): Promise<void> {
    try {
      // Rate limiting check for alarm saving
      if (!SecurityService.checkRateLimit('save_alarms', 50, 60000)) {
        throw new Error('Too many alarm save attempts. Please wait.');
      }

      // Use secure storage to save alarms
      const secureStorage = SecureAlarmStorageService.getInstance();
      await secureStorage.storeAlarms(this.alarms, userId);
      
      // Log security event
      this.logSecurityEvent('alarms_saved', {
        userId,
        alarmCount: this.alarms.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to save alarms',
        { context: 'alarm_saving', metadata: { userId, alarmCount: this.alarms.length } }
      );
      console.error('Error saving alarms:', error);
      throw error;
    }
  }
  
  static async createAlarm(data: {
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
    const now = new Date();
    const newAlarm: Alarm = {
      id: generateAlarmId(),
      userId: data.userId || 'default_user',
      time: data.time,
      label: data.label,
      enabled: true,
      isActive: true,
      days: data.days,
      dayNames: data.days.map(d => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][d] as any),
      voiceMood: data.voiceMood,
      sound: data.sound || 'default',
      difficulty: data.difficulty || 'medium' as any,
      snoozeEnabled: data.snoozeEnabled ?? true,
      snoozeInterval: data.snoozeInterval || 5,
      snoozeCount: 0,
      maxSnoozes: data.maxSnoozes,
      battleId: data.battleId,
      weatherEnabled: data.weatherEnabled || false,
      createdAt: now,
      updatedAt: now
    };
    
    // Validate alarm data before saving
    if (!this.validateAlarmData(newAlarm)) {
      throw new Error('Invalid alarm data');
    }

    this.alarms.push(newAlarm);
    await this.saveAlarms(data.userId);
    await this.scheduleNotification(newAlarm);
    
    // Log security event
    this.logSecurityEvent('alarm_created', {
      alarmId: newAlarm.id,
      userId: data.userId,
      timestamp: new Date().toISOString()
    });
    
    return newAlarm;
  }
  
  static async updateAlarm(alarmId: string, data: {
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
    weatherEnabled?: boolean;
  }): Promise<Alarm> {
    const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
    if (alarmIndex === -1) {
      throw new Error('Alarm not found');
    }
    
    const updatedAlarm: Alarm = {
      ...this.alarms[alarmIndex],
      time: data.time,
      label: data.label,
      days: data.days,
      dayNames: data.days.map(d => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][d] as any),
      voiceMood: data.voiceMood,
      sound: data.sound || this.alarms[alarmIndex].sound,
      difficulty: (data.difficulty || this.alarms[alarmIndex].difficulty) as any,
      snoozeEnabled: data.snoozeEnabled ?? this.alarms[alarmIndex].snoozeEnabled,
      snoozeInterval: data.snoozeInterval || this.alarms[alarmIndex].snoozeInterval,
      maxSnoozes: data.maxSnoozes ?? this.alarms[alarmIndex].maxSnoozes,
      battleId: data.battleId ?? this.alarms[alarmIndex].battleId,
      weatherEnabled: data.weatherEnabled ?? this.alarms[alarmIndex].weatherEnabled,
      updatedAt: new Date()
    };
    
    // Validate updated alarm data
    if (!this.validateAlarmData(updatedAlarm)) {
      throw new Error('Invalid updated alarm data');
    }

    this.alarms[alarmIndex] = updatedAlarm;
    await this.saveAlarms(updatedAlarm.userId);
    
    // Log security event
    this.logSecurityEvent('alarm_updated', {
      alarmId,
      userId: updatedAlarm.userId,
      timestamp: new Date().toISOString()
    });
    
    // Reschedule notification
    await this.cancelNotification(alarmId);
    if (updatedAlarm.enabled) {
      await this.scheduleNotification(updatedAlarm);
    }
    
    return updatedAlarm;
  }
  
  static async deleteAlarm(alarmId: string, userId?: string): Promise<void> {
    // Validate alarm ownership before deletion
    const alarm = this.alarms.find(a => a.id === alarmId);
    if (!alarm) {
      throw new Error('Alarm not found');
    }
    
    if (userId && alarm.userId && alarm.userId !== userId) {
      throw new Error('Access denied: cannot delete alarm belonging to another user');
    }

    await this.cancelNotification(alarmId);
    this.alarms = this.alarms.filter(a => a.id !== alarmId);
    await this.saveAlarms(userId);
    
    // Log security event
    this.logSecurityEvent('alarm_deleted', {
      alarmId,
      userId,
      timestamp: new Date().toISOString()
    });
  }
  
  static async toggleAlarm(alarmId: string, enabled: boolean): Promise<Alarm> {
    const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
    if (alarmIndex === -1) {
      throw new Error('Alarm not found');
    }
    
    const updatedAlarm = {
      ...this.alarms[alarmIndex],
      enabled,
      updatedAt: new Date()
    };
    
    // Validate updated alarm
    if (!this.validateAlarmData(updatedAlarm)) {
      throw new Error('Invalid alarm data after toggle');
    }
    
    this.alarms[alarmIndex] = updatedAlarm;
    await this.saveAlarms(updatedAlarm.userId);
    
    // Log security event
    this.logSecurityEvent('alarm_toggled', {
      alarmId,
      enabled,
      userId: updatedAlarm.userId,
      timestamp: new Date().toISOString()
    });
    
    // Handle notification scheduling
    await this.cancelNotification(alarmId);
    if (enabled) {
      await this.scheduleNotification(this.alarms[alarmIndex]);
    }
    
    return this.alarms[alarmIndex];
  }
  
  static async dismissAlarm(alarmId: string, method: 'voice' | 'button' | 'shake' | 'challenge', user?: User): Promise<void> {
    const alarm = this.alarms.find(a => a.id === alarmId);
    if (!alarm) {
      throw new Error(`Alarm with ID ${alarmId} not found`);
    }
    
    const dismissalTime = new Date();
    
    // Reset snooze count
    const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
    if (alarmIndex !== -1) {
      const updatedAlarm = {
        ...alarm,
        snoozeCount: 0,
        lastTriggered: dismissalTime,
        updatedAt: dismissalTime
      };
      
      this.alarms[alarmIndex] = updatedAlarm;
      await this.saveAlarms(user?.id);
      
      // Log security event
      this.logSecurityEvent('alarm_dismissed', {
        alarmId,
        method,
        userId: user?.id,
        timestamp: dismissalTime.toISOString()
      });
    }
    
    // Handle battle integration
    if (user && alarm.battleId) {
      const alarmInstance: AlarmInstance = {
        id: `instance_${Date.now()}`,
        alarmId: alarm.id,
        scheduledTime: this.getLastScheduledTime(alarm).toISOString(),
        actualWakeTime: dismissalTime.toISOString(),
        status: 'completed',
        snoozeCount: alarm.snoozeCount,
        battleId: alarm.battleId
      };
      
      await alarmBattleIntegration.handleAlarmDismissal(
        alarmInstance,
        user,
        dismissalTime,
        method
      );
    }
    
    // Log alarm event
    await this.logAlarmEvent({
      id: `event_${Date.now()}`,
      alarmId,
      firedAt: new Date(),
      dismissed: true,
      snoozed: false,
      userAction: 'dismissed',
      dismissMethod: method
    });
    
    // Reschedule for next occurrence
    await this.scheduleNotification(alarm);
  }
  
  static async snoozeAlarm(alarmId: string, minutes?: number, user?: User): Promise<void> {
    const alarm = this.alarms.find(a => a.id === alarmId);
    if (!alarm) {
      throw new Error(`Alarm with ID ${alarmId} not found`);
    }
    
    // Use provided minutes, or alarm's configured interval, or user's default preference, or 5 as fallback
    const snoozeMinutes = minutes || alarm.snoozeInterval || (user?.preferences?.snoozeMinutes) || 5;
    
    const snoozeTime = new Date();
    const newSnoozeCount = alarm.snoozeCount + 1;
    
    // Check if snoozing is allowed for battle alarms
    if (alarm.battleId && !alarm.snoozeEnabled) {
      throw new Error('Snoozing not allowed for this battle alarm');
    }
    
    // Check max snoozes limit - use alarm's setting or user's preference
    const maxSnoozes = alarm.maxSnoozes || (user?.preferences?.maxSnoozes) || Infinity;
    if (maxSnoozes && newSnoozeCount > maxSnoozes) {
      throw new Error(`Maximum snoozes exceeded (${newSnoozeCount}/${maxSnoozes})`);
    }
    
    // Increment snooze count
    const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
    if (alarmIndex !== -1) {
      const updatedAlarm = {
        ...alarm,
        snoozeCount: newSnoozeCount,
        updatedAt: snoozeTime
      };
      
      this.alarms[alarmIndex] = updatedAlarm;
      await this.saveAlarms(user?.id);
      
      // Log security event
      this.logSecurityEvent('alarm_snoozed', {
        alarmId,
        snoozeCount: newSnoozeCount,
        userId: user?.id,
        timestamp: snoozeTime.toISOString()
      });
    }
    
    // Handle battle integration
    if (user && alarm.battleId) {
      const alarmInstance: AlarmInstance = {
        id: `instance_${Date.now()}`,
        alarmId: alarm.id,
        scheduledTime: this.getLastScheduledTime(alarm).toISOString(),
        status: 'snoozed',
        snoozeCount: newSnoozeCount,
        battleId: alarm.battleId
      };
      
      await alarmBattleIntegration.handleAlarmSnooze(
        alarmInstance,
        user,
        snoozeTime,
        newSnoozeCount
      );
    }
    
    // Log alarm event
    await this.logAlarmEvent({
      id: `event_${Date.now()}`,
      alarmId,
      firedAt: new Date(),
      dismissed: false,
      snoozed: true,
      userAction: 'snoozed'
    });
    
    // Schedule snooze notification
    const nextSnoozeTime = new Date(Date.now() + snoozeMinutes * 60 * 1000);
    
    console.log(`Snoozing alarm "${alarm.label}" for ${snoozeMinutes} minutes (attempt ${newSnoozeCount}/${maxSnoozes === Infinity ? '∞' : maxSnoozes})`);
    await scheduleLocalNotification({
      id: parseInt(alarmId.replace(/\D/g, '')) + 10000, // Offset for snooze
      title: `⏰ ${alarm.label} (Snoozed)`,
      body: `Time to wake up! (Snooze ${newSnoozeCount}/${maxSnoozes === Infinity ? '∞' : maxSnoozes})`,
      schedule: nextSnoozeTime
    });
  }
  
  private static async scheduleNotification(alarm: Alarm): Promise<void> {
    if (!alarm.enabled || alarm.days.length === 0) return;
    
    try {
      const nextTime = getNextAlarmTime(alarm);
      if (!nextTime) return;
      
      // Enhanced notification body with snooze info
      let notificationBody = 'Time to wake up!';
      if (alarm.snoozeEnabled) {
        notificationBody += ` (Snooze: ${alarm.snoozeInterval}min`;
        if (alarm.maxSnoozes && alarm.maxSnoozes > 0) {
          notificationBody += `, max ${alarm.maxSnoozes}x`;
        }
        notificationBody += ')';
      }
      
      await scheduleLocalNotification({
        id: parseInt(alarm.id.replace(/\D/g, '')),
        title: `🔔 ${alarm.label}`,
        body: notificationBody,
        schedule: nextTime
      });
      
      console.log(`Scheduled alarm "${alarm.label}" for ${nextTime.toLocaleString()}`);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }
  
  private static async cancelNotification(alarmId: string): Promise<void> {
    try {
      await cancelLocalNotification(parseInt(alarmId.replace(/\D/g, '')));
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }
  
  private static async logAlarmEvent(event: AlarmEvent): Promise<void> {
    try {
      // Use secure storage for alarm events
      const secureStorage = SecureAlarmStorageService.getInstance();
      const existingEvents = await secureStorage.retrieveAlarmEvents();
      
      existingEvents.push(event);
      
      // Keep only last 100 events
      if (existingEvents.length > 100) {
        existingEvents.splice(0, existingEvents.length - 100);
      }
      
      await secureStorage.storeAlarmEvents(existingEvents);
    } catch (error) {
      console.error('Error logging alarm event:', error);
    }
  }
  
  private static startAlarmChecker(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // Check every minute for triggered alarms
    this.checkInterval = setInterval(() => {
      this.checkForTriggeredAlarms();
    }, 60000); // 1 minute
    
    // Also check immediately
    this.checkForTriggeredAlarms();
  }
  
  private static checkForTriggeredAlarms(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();
    
    this.alarms.forEach(async alarm => {
      if (!alarm.enabled || !alarm.days.includes(currentDay)) return;
      
      const [alarmHour, alarmMinute] = alarm.time.split(':').map(Number);
      
      if (alarmHour === currentHour && alarmMinute === currentMinute) {
        // Create alarm instance for battle tracking
        const alarmInstance: AlarmInstance = {
          id: `instance_${Date.now()}_${alarm.id}`,
          alarmId: alarm.id,
          scheduledTime: now.toISOString(),
          status: 'pending',
          snoozeCount: 0,
          battleId: alarm.battleId
        };
        
        // Handle battle integration
        if (alarm.battleId) {
          // This would get the current user - for now we'll use a placeholder
          const user: User = {
            id: alarm.userId || 'default_user',
            email: 'user@example.com',
            username: 'user',
            displayName: 'User',
            level: 1,
            experience: 0,
            joinDate: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            preferences: {} as any,
            createdAt: new Date().toISOString()
          };
          
          await alarmBattleIntegration.handleAlarmTrigger(alarmInstance, user);
        }
        
        // Trigger alarm with enhanced data
        window.dispatchEvent(new CustomEvent('alarm-triggered', {
          detail: { alarm, alarmInstance }
        }));
      }
    });
  }
  
  static getAlarms(): Alarm[] {
    return this.alarms;
  }
  
  static getAlarmById(id: string): Alarm | undefined {
    return this.alarms.find(alarm => alarm.id === id);
  }
  
  // New battle-specific methods
  static async createBattleAlarm(data: {
    time: string;
    label: string;
    days: number[];
    voiceMood: VoiceMood;
    battleId: string;
    userId: string;
    difficulty?: string;
  }): Promise<Alarm> {
    const battleAlarm = await alarmBattleIntegration.createBattleAlarm(
      {
        userId: data.userId,
        time: data.time,
        label: data.label,
        enabled: true,
        isActive: true,
        days: data.days,
        dayNames: data.days.map(d => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][d] as any),
        voiceMood: data.voiceMood,
        sound: 'default',
        difficulty: (data.difficulty || 'medium') as any,
        snoozeEnabled: false,
        snoozeInterval: 5,
        snoozeCount: 0
      },
      data.battleId,
      {
        id: data.userId,
        email: 'user@example.com',
        username: 'user',
        displayName: 'User',
        level: 1,
        experience: 0,
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        preferences: {} as any,
        createdAt: new Date().toISOString()
      }
    );
    
    // Validate battle alarm data
    if (!this.validateAlarmData(battleAlarm)) {
      throw new Error('Invalid battle alarm data');
    }

    this.alarms.push(battleAlarm);
    await this.saveAlarms(data.userId);
    await this.scheduleNotification(battleAlarm);
    
    // Log security event
    this.logSecurityEvent('battle_alarm_created', {
      alarmId: battleAlarm.id,
      battleId: data.battleId,
      userId: data.userId,
      timestamp: new Date().toISOString()
    });
    
    return battleAlarm;
  }
  
  static getBattleAlarms(userId: string): Alarm[] {
    return this.alarms.filter(alarm => alarm.userId === userId && alarm.battleId);
  }
  
  static getNonBattleAlarms(userId: string): Alarm[] {
    return this.alarms.filter(alarm => alarm.userId === userId && !alarm.battleId);
  }
  
  static async unlinkAlarmFromBattle(alarmId: string): Promise<void> {
    const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
    if (alarmIndex === -1) return;
    
    const originalBattleId = this.alarms[alarmIndex].battleId;
    
    const updatedAlarm = {
      ...this.alarms[alarmIndex],
      battleId: undefined,
      snoozeEnabled: true, // Reset to allow snoozing
      updatedAt: new Date()
    };
    
    this.alarms[alarmIndex] = updatedAlarm;
    await this.saveAlarms(updatedAlarm.userId);
    
    // Log security event
    this.logSecurityEvent('alarm_unlinked_from_battle', {
      alarmId,
      previousBattleId: originalBattleId,
      timestamp: new Date().toISOString()
    });
    
    if (originalBattleId) {
      await alarmBattleIntegration.unlinkAlarmFromBattle(alarmId);
    }
  }
  
  private static getLastScheduledTime(alarm: Alarm): Date {
    // Calculate the last time this alarm was supposed to fire
    // This is a simplified calculation - in production you'd want more precise tracking
    const now = new Date();
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // If the scheduled time is in the future, it was for yesterday
    if (scheduledTime > now) {
      scheduledTime.setDate(scheduledTime.getDate() - 1);
    }
    
    return scheduledTime;
  }
  
  /**
   * Validate alarm data structure and content
   */
  private static validateAlarmData(alarm: Partial<Alarm>): boolean {
    try {
      // Required fields
      if (!alarm.id || !alarm.time || !alarm.label || !alarm.voiceMood) {
        return false;
      }
      
      // Validate time format (HH:MM)
      if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(alarm.time)) {
        return false;
      }
      
      // Validate days array
      if (!Array.isArray(alarm.days) || alarm.days.length === 0) {
        return false;
      }
      
      // Validate day values (0-6)
      if (!alarm.days.every(day => typeof day === 'number' && day >= 0 && day <= 6)) {
        return false;
      }
      
      // Validate label length and content
      if (typeof alarm.label !== 'string' || alarm.label.length > 100) {
        return false;
      }
      
      // Validate snooze settings
      if (typeof alarm.snoozeInterval === 'number' && (alarm.snoozeInterval < 1 || alarm.snoozeInterval > 60)) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Log security events for audit trail
   */
  private static logSecurityEvent(event: string, details: any): void {
    const logEntry = {
      event,
      details,
      timestamp: new Date().toISOString(),
      source: 'AlarmService'
    };
    
    // Emit custom event for security monitoring
    window.dispatchEvent(new CustomEvent('alarm-security-event', {
      detail: logEntry
    }));
    
    console.log('[ALARM SECURITY LOG]', logEntry);
  }
  
  /**
   * Get alarms for specific user with ownership validation
   */
  static getUserAlarms(userId: string): Alarm[] {
    return this.alarms.filter(alarm => 
      !alarm.userId || alarm.userId === userId
    );
  }
  
  /**
   * Validate user ownership of alarm
   */
  static validateAlarmOwnership(alarmId: string, userId: string): boolean {
    const alarm = this.alarms.find(a => a.id === alarmId);
    if (!alarm) {
      return false;
    }
    
    // If alarm has no userId set, allow access (legacy alarms)
    // If alarm has userId, it must match the requesting user
    return !alarm.userId || alarm.userId === userId;
  }
}

// Enhanced alarm event tracking with security
export const enhancedAlarmTracking = {
  async trackAlarmPerformance(alarmId: string, userId: string) {
    const alarm = AlarmService.getAlarmById(alarmId);
    if (!alarm) {
      throw new Error(`Alarm with ID ${alarmId} not found for performance tracking`);
    }
    
    // Validate ownership before tracking
    if (!AlarmService.validateAlarmOwnership(alarmId, userId)) {
      throw new Error('Access denied: cannot track performance for alarm not owned by user');
    }
    
    AppAnalyticsService.getInstance().track('alarm_performance', {
      alarmId,
      userId,
      difficulty: alarm.difficulty,
      hasBattle: !!alarm.battleId,
      battleId: alarm.battleId,
      snoozeCount: alarm.snoozeCount,
      voiceMood: alarm.voiceMood
    });
  },
  
  async trackBattleAlarmUsage(userId: string) {
    // Use secure user-specific alarm retrieval
    const battleAlarms = AlarmService.getBattleAlarms(userId);
    const regularAlarms = AlarmService.getNonBattleAlarms(userId);
    
    // Additional validation to ensure only user's alarms are tracked
    const validBattleAlarms = battleAlarms.filter(alarm => 
      AlarmService.validateAlarmOwnership(alarm.id, userId)
    );
    const validRegularAlarms = regularAlarms.filter(alarm => 
      AlarmService.validateAlarmOwnership(alarm.id, userId)
    );
    
    AppAnalyticsService.getInstance().track('alarm_battle_usage', {
      userId,
      battleAlarmsCount: validBattleAlarms.length,
      regularAlarmsCount: validRegularAlarms.length,
      battleParticipationRate: validBattleAlarms.length / (validBattleAlarms.length + validRegularAlarms.length)
    });
  }
};