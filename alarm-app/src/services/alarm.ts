import type { Alarm, VoiceMood, AlarmEvent, AlarmInstance, User } from '../types';
import { generateAlarmId, getNextAlarmTime } from '../utils';
import { scheduleLocalNotification, cancelLocalNotification } from './capacitor';
import { Preferences } from '@capacitor/preferences';
import { alarmBattleIntegration } from './alarm-battle-integration';
import { AppAnalyticsService } from './app-analytics';

const ALARMS_KEY = 'smart_alarms';
const ALARM_EVENTS_KEY = 'alarm_events';

export class AlarmService {
  private static alarms: Alarm[] = [];
  private static checkInterval: NodeJS.Timeout | null = null;
  
  static async loadAlarms(): Promise<Alarm[]> {
    try {
      const { value } = await Preferences.get({ key: ALARMS_KEY });
      if (value) {
        const alarmData = JSON.parse(value) as Array<Partial<Alarm>>;
        this.alarms = alarmData.map((alarm) => ({
          ...alarm,
          createdAt: new Date(alarm.createdAt),
          updatedAt: new Date(alarm.updatedAt),
          lastTriggered: alarm.lastTriggered ? new Date(alarm.lastTriggered) : undefined
        }));
      }
      
      // Start alarm checking
      this.startAlarmChecker();
      
      return this.alarms;
    } catch (error) {
      console.error('Error loading alarms:', error);
      return [];
    }
  }
  
  static async saveAlarms(): Promise<void> {
    try {
      await Preferences.set({
        key: ALARMS_KEY,
        value: JSON.stringify(this.alarms)
      });
    } catch (error) {
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
    
    this.alarms.push(newAlarm);
    await this.saveAlarms();
    await this.scheduleNotification(newAlarm);
    
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
    
    this.alarms[alarmIndex] = updatedAlarm;
    await this.saveAlarms();
    
    // Reschedule notification
    await this.cancelNotification(alarmId);
    if (updatedAlarm.enabled) {
      await this.scheduleNotification(updatedAlarm);
    }
    
    return updatedAlarm;
  }
  
  static async deleteAlarm(alarmId: string): Promise<void> {
    await this.cancelNotification(alarmId);
    this.alarms = this.alarms.filter(a => a.id !== alarmId);
    await this.saveAlarms();
  }
  
  static async toggleAlarm(alarmId: string, enabled: boolean): Promise<Alarm> {
    const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
    if (alarmIndex === -1) {
      throw new Error('Alarm not found');
    }
    
    this.alarms[alarmIndex] = {
      ...this.alarms[alarmIndex],
      enabled,
      updatedAt: new Date()
    };
    
    await this.saveAlarms();
    
    // Handle notification scheduling
    await this.cancelNotification(alarmId);
    if (enabled) {
      await this.scheduleNotification(this.alarms[alarmIndex]);
    }
    
    return this.alarms[alarmIndex];
  }
  
  static async dismissAlarm(alarmId: string, method: 'voice' | 'button' | 'shake', user?: User): Promise<void> {
    const alarm = this.alarms.find(a => a.id === alarmId);
    if (!alarm) return;
    
    const dismissalTime = new Date();
    
    // Reset snooze count
    const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
    if (alarmIndex !== -1) {
      this.alarms[alarmIndex] = {
        ...alarm,
        snoozeCount: 0,
        lastTriggered: dismissalTime,
        updatedAt: dismissalTime
      };
      await this.saveAlarms();
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
  
  static async snoozeAlarm(alarmId: string, minutes: number = 5, user?: User): Promise<void> {
    const alarm = this.alarms.find(a => a.id === alarmId);
    if (!alarm) return;
    
    const snoozeTime = new Date();
    const newSnoozeCount = alarm.snoozeCount + 1;
    
    // Check if snoozing is allowed for battle alarms
    if (alarm.battleId && !alarm.snoozeEnabled) {
      console.warn('Snoozing not allowed for this battle alarm');
      return;
    }
    
    // Check max snoozes limit
    if (alarm.maxSnoozes && newSnoozeCount > alarm.maxSnoozes) {
      console.warn('Maximum snoozes exceeded');
      return;
    }
    
    // Increment snooze count
    const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
    if (alarmIndex !== -1) {
      this.alarms[alarmIndex] = {
        ...alarm,
        snoozeCount: newSnoozeCount,
        updatedAt: snoozeTime
      };
      await this.saveAlarms();
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
    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000);
    await scheduleLocalNotification({
      id: parseInt(alarmId.replace(/\D/g, '')) + 10000, // Offset for snooze
      title: `⏰ ${alarm.label} (Snoozed)`,
      body: 'Time to wake up!',
      schedule: snoozeTime
    });
  }
  
  private static async scheduleNotification(alarm: Alarm): Promise<void> {
    if (!alarm.enabled || alarm.days.length === 0) return;
    
    try {
      const nextTime = getNextAlarmTime(alarm);
      if (!nextTime) return;
      
      await scheduleLocalNotification({
        id: parseInt(alarm.id.replace(/\D/g, '')),
        title: `🔔 ${alarm.label}`,
        body: 'Time to wake up!',
        schedule: nextTime
      });
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
      const { value } = await Preferences.get({ key: ALARM_EVENTS_KEY });
      const events: AlarmEvent[] = value ? JSON.parse(value) : [];
      
      events.push(event);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      await Preferences.set({
        key: ALARM_EVENTS_KEY,
        value: JSON.stringify(events)
      });
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
    
    this.alarms.push(battleAlarm);
    await this.saveAlarms();
    await this.scheduleNotification(battleAlarm);
    
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
    
    this.alarms[alarmIndex] = {
      ...this.alarms[alarmIndex],
      battleId: undefined,
      snoozeEnabled: true, // Reset to allow snoozing
      updatedAt: new Date()
    };
    
    await this.saveAlarms();
    
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
}

// Enhanced alarm event tracking
export const enhancedAlarmTracking = {
  async trackAlarmPerformance(alarmId: string, userId: string) {
    const alarm = AlarmService.getAlarmById(alarmId);
    if (!alarm) return;
    
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
    const battleAlarms = AlarmService.getBattleAlarms(userId);
    const regularAlarms = AlarmService.getNonBattleAlarms(userId);
    
    AppAnalyticsService.getInstance().track('alarm_battle_usage', {
      userId,
      battleAlarmsCount: battleAlarms.length,
      regularAlarmsCount: regularAlarms.length,
      battleParticipationRate: battleAlarms.length / (battleAlarms.length + regularAlarms.length)
    });
  }
};