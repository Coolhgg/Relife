/// <reference types="node" />
/// <reference lib="dom" />
import type { Alarm, VoiceMood, AlarmEvent } from '../types';
import { generateAlarmId, getNextAlarmTime } from '../utils';
import { scheduleLocalNotification, cancelLocalNotification } from './capacitor';
import { SupabaseService } from './supabase';
import { Preferences } from '@capacitor/preferences';
import { CriticalPreloader } from './critical-preloader';
import { AudioManager } from './audio-manager';
import { TimeoutHandle } from '../types/timers';

const ALARMS_KEY = 'smart_alarms';
const ALARM_EVENTS_KEY = 'alarm_events';
const ALARM_CHECK_INTERVAL = 30000; // Check every 30 seconds
const ALARM_TRIGGER_TOLERANCE = 60000; // 1 minute tolerance for missed alarms

export class EnhancedAlarmService {
  private static alarms: Alarm[] = [];
  private static checkInterval: TimeoutHandle | null = null;
  private static isInitialized = false;
  private static currentUser: string | null = null;
  private static listeners: Array<(alarms: Alarm[]) => void> = [];
  private static activeAlarmListeners: Array<(alarm: Alarm | null) => void> = [];
  private static supabaseSubscription: (() => void) | null = null;

  static async initialize(userId?: string): Promise<void> {
    if (this.isInitialized && this.currentUser === userId) return;

    this.currentUser = userId || null;

    try {
      // Initialize audio systems
      await AudioManager.getInstance().initialize();
      await CriticalPreloader.initialize();

      // Load alarms from appropriate source
      if (userId && SupabaseService.isConfigured()) {
        await this.loadAlarmsFromSupabase(userId);
        this.setupSupabaseSubscription(userId);
      } else {
        await this.loadAlarmsFromLocal();
      }

      // Start critical preloading for existing alarms
      await this.initializeCriticalPreloading();

      // Start alarm checking
      this.startAlarmChecker();

      // Listen for page visibility changes
      this.setupVisibilityListener();

      // Listen for time zone changes
      this.setupTimeZoneListener();

      this.isInitialized = true;
      console.log('Enhanced Alarm Service initialized');
    } catch (_error) {
      console._error('Error initializing alarm service:', _error);
    }
  }

  static async loadAlarmsFromSupabase(userId: string): Promise<void> {
    try {
      const { alarms, _error } = await SupabaseService.loadUserAlarms(userId);
      if (_error) {
        console._error('Error loading alarms from Supabase:', _error);
        // Fallback to local storage
        await this.loadAlarmsFromLocal();
        return;
      }

      this.alarms = alarms;
      // Also save to local storage as backup
      await this.saveAlarmsToLocal();
      this.notifyListeners();
    } catch (_error) {
      console._error('Error loading alarms from Supabase:', _error);
      await this.loadAlarmsFromLocal();
    }
  }

  static async loadAlarmsFromLocal(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: ALARMS_KEY });
      if (value) {
        const alarmData = JSON.parse(value) as Array<Partial<Alarm>>;
        this.alarms = alarmData.map(alarm => ({
          ...alarm,
          createdAt: new Date(alarm.createdAt),
          updatedAt: new Date(alarm.updatedAt),
          lastTriggered: alarm.lastTriggered
            ? new Date(alarm.lastTriggered)
            : undefined,
        }));
      }
      this.notifyListeners();
    } catch (_error) {
      console._error('Error loading alarms from local storage:', _error);
      this.alarms = [];
    }
  }

  static async saveAlarmsToLocal(): Promise<void> {
    try {
      await Preferences.set({
        key: ALARMS_KEY,
        value: JSON.stringify(this.alarms),
      });
    } catch (_error) {
      console._error('Error saving alarms to local storage:', _error);
    }
  }

  static async saveAlarmToSupabase(alarm: Alarm): Promise<boolean> {
    if (!this.currentUser || !SupabaseService.isConfigured()) {
      return false;
    }

    try {
      const alarmWithUser = { ...alarm, userId: this.currentUser };
      const { _error } = await SupabaseService.saveAlarm(alarmWithUser);
      if (_error) {
        console._error('Error saving alarm to Supabase:', _error);
        return false;
      }
      return true;
    } catch (_error) {
      console._error('Error saving alarm to Supabase:', _error);
      return false;
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
      userId: this.currentUser || undefined,
      time: data.time,
      label: data.label,
      enabled: true,
      days: data.days,
      voiceMood: data.voiceMood,
      snoozeCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Add to local array
    this.alarms.push(newAlarm);

    // Save to both sources
    await this.saveAlarmsToLocal();
    const savedToSupabase = await this.saveAlarmToSupabase(newAlarm);

    if (!savedToSupabase) {
      console.warn('Alarm saved locally but not to Supabase');
    }

    // Schedule notification
    await this.scheduleNotification(newAlarm);

    // Analyze for critical preloading
    try {
      const criticalPreloader = CriticalPreloader.getInstance();
      await criticalPreloader.analyzeAlarmForPreloading(newAlarm);
    } catch (_error) {
      console._error('Error analyzing alarm for preloading:', _error);
    }

    this.notifyListeners();
    return newAlarm;
  }

  static async updateAlarm(
    alarmId: string,
    data: {
      time: string;
      label: string;
      days: number[];
      voiceMood: VoiceMood;
    }
  ): Promise<Alarm> {
    const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
    if (alarmIndex === -1) {
      throw new Error('Alarm not found');
    }

    const updatedAlarm: Alarm = {
      ...this.alarms[alarmIndex],
      ...data,
      updatedAt: new Date(),
    };

    this.alarms[alarmIndex] = updatedAlarm;

    // Save to both sources
    await this.saveAlarmsToLocal();
    await this.saveAlarmToSupabase(updatedAlarm);

    // Reschedule notification
    await this.cancelNotification(alarmId);
    if (updatedAlarm.enabled) {
      await this.scheduleNotification(updatedAlarm);
    }

    // Re-analyze for critical preloading
    try {
      const criticalPreloader = CriticalPreloader.getInstance();
      await criticalPreloader.analyzeAlarmForPreloading(updatedAlarm);
    } catch (_error) {
      console._error('Error re-analyzing alarm for preloading:', _error);
    }

    this.notifyListeners();
    return updatedAlarm;
  }

  static async deleteAlarm(alarmId: string): Promise<void> {
    // Cancel notification first
    await this.cancelNotification(alarmId);

    // Clean up preloading
    try {
      const criticalPreloader = CriticalPreloader.getInstance();
      await criticalPreloader.removeAlarmFromPreloading(alarmId);
    } catch (_error) {
      console._error('Error removing alarm from preloading:', _error);
    }

    // Remove from local array
    this.alarms = this.alarms.filter(a => a.id !== alarmId);

    // Save changes
    await this.saveAlarmsToLocal();

    // Delete from Supabase
    if (SupabaseService.isConfigured()) {
      const { _error } = await SupabaseService.deleteAlarm(alarmId);
      if (_error) {
        console._error('Error deleting alarm from Supabase:', _error);
      }
    }

    this.notifyListeners();
  }

  static async toggleAlarm(alarmId: string, enabled: boolean): Promise<Alarm> {
    const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
    if (alarmIndex === -1) {
      throw new Error('Alarm not found');
    }

    this.alarms[alarmIndex] = {
      ...this.alarms[alarmIndex],
      enabled,
      updatedAt: new Date(),
    };

    const alarm = this.alarms[alarmIndex];

    // Save changes
    await this.saveAlarmsToLocal();
    await this.saveAlarmToSupabase(alarm);

    // Handle notification scheduling
    await this.cancelNotification(alarmId);
    if (enabled) {
      await this.scheduleNotification(alarm);
    }

    this.notifyListeners();
    return alarm;
  }

  static async dismissAlarm(
    alarmId: string,
    method: 'voice' | 'button' | 'shake' | 'challenge'
  ): Promise<void> {
    const alarm = this.alarms.find(a => a.id === alarmId);
    if (!alarm) return;

    // Reset snooze count and update last triggered
    const alarmIndex = this.alarms.findIndex(a => a.id === alarmId);
    if (alarmIndex !== -1) {
      this.alarms[alarmIndex] = {
        ...alarm,
        snoozeCount: 0,
        lastTriggered: new Date(),
        updatedAt: new Date(),
      };

      await this.saveAlarmsToLocal();
      await this.saveAlarmToSupabase(this.alarms[alarmIndex]);
    }

    // Log alarm event
    await this.logAlarmEvent({
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alarmId,
      firedAt: new Date(),
      dismissed: true,
      snoozed: false,
      userAction: 'dismissed',
      dismissMethod: method,
    });

    // Reschedule for next occurrence
    await this.scheduleNotification(alarm);

    this.notifyListeners();
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
        updatedAt: new Date(),
      };

      await this.saveAlarmsToLocal();
      await this.saveAlarmToSupabase(this.alarms[alarmIndex]);
    }

    // Log alarm event
    await this.logAlarmEvent({
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alarmId,
      firedAt: new Date(),
      dismissed: false,
      snoozed: true,
      userAction: 'snoozed',
    });

    // Schedule snooze notification
    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000);
    await scheduleLocalNotification({
      id: parseInt(alarmId.replace(/\D/g, '')) + 10000, // Offset for snooze
      title: `⏰ ${alarm.label} (Snoozed)`,
      body: 'Time to wake up!',
      schedule: snoozeTime,
    });

    this.notifyListeners();
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
        schedule: nextTime,
      });

      console.log(`Scheduled notification for alarm ${alarm.id} at ${nextTime}`);
    } catch (_error) {
      console._error('Error scheduling notification:', _error);
    }
  }

  private static async cancelNotification(alarmId: string): Promise<void> {
    try {
      await cancelLocalNotification(parseInt(alarmId.replace(/\D/g, '')));
      // Also cancel any snooze notifications
      await cancelLocalNotification(parseInt(alarmId.replace(/\D/g, '')) + 10000);
    } catch (_error) {
      console._error('Error cancelling notification:', _error);
    }
  }

  private static async logAlarmEvent(_event: AlarmEvent): Promise<void> {
    try {
      // Save to local storage
      const { value } = await Preferences.get({ key: ALARM_EVENTS_KEY });
      const events: AlarmEvent[] = value ? JSON.parse(value) : [];

      events.push(_event);

      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }

      await Preferences.set({
        key: ALARM_EVENTS_KEY,
        value: JSON.stringify(events),
      });

      // Also log to Supabase if available
      if (SupabaseService.isConfigured()) {
        const { _error } = await SupabaseService.logAlarmEvent(_event);
        if (_error) {
          console._error('Error logging _event to Supabase:', _error);
        }
      }
    } catch (_error) {
      console._error('Error logging alarm _event:', _error);
    }
  }

  private static startAlarmChecker(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check for triggered alarms
    this.checkInterval = setInterval(() => {
      this.checkForTriggeredAlarms();
    }, ALARM_CHECK_INTERVAL);

    // Also check immediately
    this.checkForTriggeredAlarms();
  }

  private static checkForTriggeredAlarms(): void {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getTime();

    this.alarms.forEach(alarm => {
      if (!alarm.enabled || !alarm.days.includes(currentDay)) return;

      const [alarmHour, alarmMinute] = alarm.time.split(':').map(Number);

      // Check if this is the exact alarm time or within tolerance
      const alarmTimeToday = new Date(now);
      alarmTimeToday.setHours(alarmHour, alarmMinute, 0, 0);

      const timeDiff = Math.abs(currentTime - alarmTimeToday.getTime());

      // Trigger if we're within tolerance and haven't triggered recently
      if (timeDiff <= ALARM_TRIGGER_TOLERANCE) {
        const lastTriggered = alarm.lastTriggered;
        const shouldTrigger =
          !lastTriggered || currentTime - lastTriggered.getTime() > 22 * 60 * 60 * 1000; // 22 hours

        if (shouldTrigger) {
          // Trigger alarm asynchronously to avoid blocking
          this.triggerAlarm(alarm).catch(error => {
            console._error('Error triggering alarm:', _error);
          });
        }
      }
    });
  }

  private static async triggerAlarm(alarm: Alarm): Promise<void> {
    console.log(`Triggering alarm: ${alarm.label}`);

    // Update last triggered time
    const alarmIndex = this.alarms.findIndex(a => a.id === alarm.id);
    if (alarmIndex !== -1) {
      this.alarms[alarmIndex] = {
        ...alarm,
        lastTriggered: new Date(),
        updatedAt: new Date(),
      };
      this.saveAlarmsToLocal();
      this.saveAlarmToSupabase(this.alarms[alarmIndex]);
    }

    // Play alarm audio using optimized audio manager
    try {
      const audioManager = AudioManager.getInstance();
      await audioManager.playAlarmAudio(alarm);
    } catch (_error) {
      console._error('Error playing alarm audio:', _error);
      // Fallback is handled within AudioManager
    }

    // Notify listeners
    this.notifyActiveAlarmListeners(alarm);

    // Dispatch global event
    window.dispatchEvent(
      new CustomEvent('alarm-triggered', {
        detail: { alarm },
      })
    );
  }

  private static setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Page became visible, check for missed alarms
        this.checkForTriggeredAlarms();
      }
    });
  }

  private static async initializeCriticalPreloading(): Promise<void> {
    try {
      const criticalPreloader = CriticalPreloader.getInstance();

      // Analyze current alarms for preloading
      const enabledAlarms = this.alarms.filter(alarm => alarm.enabled);
      for (const alarm of enabledAlarms) {
        await criticalPreloader.analyzeAlarmForPreloading(alarm);
      }

      console.log(`Initialized critical preloading for ${enabledAlarms.length} alarms`);
    } catch (_error) {
      console._error('Error initializing critical preloading:', _error);
    }
  }

  private static setupTimeZoneListener(): void {
    // Check for timezone changes (rare but possible)
    setInterval(() => {
      const currentOffset = new Date().getTimezoneOffset();
      const storedOffset = localStorage.getItem('timezone_offset');

      if (storedOffset && parseInt(storedOffset) !== currentOffset) {
        console.log('Timezone change detected, rescheduling alarms');
        this.rescheduleAllAlarms();
      }

      localStorage.setItem('timezone_offset', currentOffset.toString());
    }, 60000); // Check every minute
  }

  private static async rescheduleAllAlarms(): Promise<void> {
    for (const alarm of this.alarms) {
      if (alarm.enabled) {
        await this.cancelNotification(alarm.id);
        await this.scheduleNotification(alarm);
      }
    }
  }

  private static setupSupabaseSubscription(userId: string): void {
    if (this.supabaseSubscription) {
      this.supabaseSubscription();
    }

    this.supabaseSubscription = SupabaseService.subscribeToUserAlarms(
      userId,
      alarms => {
        this.alarms = alarms;
        this.saveAlarmsToLocal(); // Keep local backup
        this.notifyListeners();
      }
    );
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.alarms]);
      } catch (_error) {
        console._error('Error in alarm listener:', _error);
      }
    });
  }

  private static notifyActiveAlarmListeners(alarm: Alarm | null): void {
    this.activeAlarmListeners.forEach(listener => {
      try {
        listener(alarm);
      } catch (_error) {
        console._error('Error in active alarm listener:', _error);
      }
    });
  }

  // Public API methods
  static getAlarms(): Alarm[] {
    return [...this.alarms];
  }

  static getAlarmById(id: string): Alarm | undefined {
    return this.alarms.find(alarm => alarm.id === id);
  }

  static addListener(listener: (alarms: Alarm[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const _index = this.listeners.indexOf(listener);
      if (_index > -1) {
        this.listeners.splice(_index, 1);
      }
    };
  }

  static addActiveAlarmListener(listener: (alarm: Alarm | null) => void): () => void {
    this.activeAlarmListeners.push(listener);
    return () => {
      const _index = this.activeAlarmListeners.indexOf(listener);
      if (_index > -1) {
        this.activeAlarmListeners.splice(_index, 1);
      }
    };
  }

  static async cleanup(): Promise<void> {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.supabaseSubscription) {
      this.supabaseSubscription();
      this.supabaseSubscription = null;
    }

    this.listeners.length = 0;
    this.activeAlarmListeners.length = 0;
    this.isInitialized = false;
  }

  static isReady(): boolean {
    return this.isInitialized;
  }

  // For backwards compatibility
  static async loadAlarms(): Promise<Alarm[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.getAlarms();
  }
}
