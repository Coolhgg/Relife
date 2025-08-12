import type { Alarm, VoiceMood, AlarmEvent } from '../types';
import { generateAlarmId, getNextAlarmTime } from '../utils';
import { scheduleLocalNotification, cancelLocalNotification } from './capacitor';
import { Preferences } from '@capacitor/preferences';

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
  }): Promise<Alarm> {
    const now = new Date();
    const newAlarm: Alarm = {
      id: generateAlarmId(),
      time: data.time,
      label: data.label,
      enabled: true,
      days: data.days,
      voiceMood: data.voiceMood,
      snoozeCount: 0,
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
  }): Promise<Alarm> {
    const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
    if (alarmIndex === -1) {
      throw new Error('Alarm not found');
    }
    
    const updatedAlarm: Alarm = {
      ...this.alarms[alarmIndex],
      ...data,
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
  
  static async dismissAlarm(alarmId: string, method: 'voice' | 'button' | 'shake'): Promise<void> {
    const alarm = this.alarms.find(a => a.id === alarmId);
    if (!alarm) return;
    
    // Reset snooze count
    const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
    if (alarmIndex !== -1) {
      this.alarms[alarmIndex] = {
        ...alarm,
        snoozeCount: 0,
        lastTriggered: new Date(),
        updatedAt: new Date()
      };
      await this.saveAlarms();
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
  
  static async snoozeAlarm(alarmId: string, minutes: number = 5): Promise<void> {
    const alarm = this.alarms.find(a => a.id === alarmId);
    if (!alarm) return;
    
    // Increment snooze count
    const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
    if (alarmIndex !== -1) {
      this.alarms[alarmIndex] = {
        ...alarm,
        snoozeCount: alarm.snoozeCount + 1,
        updatedAt: new Date()
      };
      await this.saveAlarms();
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
    
    this.alarms.forEach(alarm => {
      if (!alarm.enabled || !alarm.days.includes(currentDay)) return;
      
      const [alarmHour, alarmMinute] = alarm.time.split(':').map(Number);
      
      if (alarmHour === currentHour && alarmMinute === currentMinute) {
        // Trigger alarm
        window.dispatchEvent(new CustomEvent('alarm-triggered', {
          detail: { alarm }
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
}