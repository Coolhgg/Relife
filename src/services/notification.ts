import type { Alarm } from '../types';
import { getNextAlarmTime, getVoiceMoodConfig } from '../utils';
import { TimeoutHandle } from '../types/timers';
import {
  scheduleLocalNotification,
  cancelLocalNotification,
  requestNotificationPermissions,
  vibrate,
} from './capacitor';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
  data?: Record<string, unknown>;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface ScheduledNotification {
  id: string;
  alarmId: string;
  type: 'alarm' | 'reminder' | 'snooze';
  scheduledTime: Date;
  notification: NotificationOptions;
}

export class NotificationService {
  private static isInitialized = false;
  private static hasPermission = false;
  private static scheduledNotifications = new Map<string, ScheduledNotification>();
  private static serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  static async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return this.hasPermission;
    }

    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return false;
      }

      // Get service worker registration
      if ('serviceWorker' in navigator) {
        try {
          this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
          console.log('Service worker ready for notifications');
        } catch (error) {
          console.warn('Service worker not available:', error);
        }
      }

      // Request permissions
      this.hasPermission = await this.requestPermissions();

      // Set up notification click handlers
      this.setupNotificationHandlers();

      this.isInitialized = true;
      console.log('Notification service initialized, permission:', this.hasPermission);

      return this.hasPermission;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      return false;
    }
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      // Try Capacitor first (for mobile)
      const capacitorPermission = await requestNotificationPermissions();
      if (capacitorPermission) {
        return true;
      }

      // Fallback to web Notification API
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }

      return false;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async scheduleAlarmNotification(alarm: Alarm): Promise<void> {
    if (!this.hasPermission) {
      console.warn('No notification permission, cannot schedule alarm notification');
      return;
    }

    try {
      const nextTime = getNextAlarmTime(alarm);
      if (!nextTime) {
        console.warn('No next time found for alarm:', alarm.id);
        return;
      }

      const voiceMoodConfig = getVoiceMoodConfig(alarm.voiceMood);

      // Schedule main alarm notification
      const mainNotification: ScheduledNotification = {
        id: `alarm_${alarm.id}`,
        alarmId: alarm.id,
        type: 'alarm',
        scheduledTime: nextTime,
        notification: {
          title: `🔔 ${alarm.label}`,
          body: `Time to wake up! ${voiceMoodConfig.name} mode ready.`,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: alarm.id,
          requireInteraction: true,
          vibrate: [500, 200, 500, 200, 500],
          actions: [
            {
              action: 'dismiss',
              title: 'Dismiss',
              icon: '/dismiss-icon.png',
            },
            {
              action: 'snooze',
              title: 'Snooze 5min',
              icon: '/snooze-icon.png',
            },
          ],
          data: {
            alarmId: alarm.id,
            voiceMood: alarm.voiceMood,
            type: 'alarm',
          },
        },
      };

      await this.scheduleNotification(mainNotification);

      // Schedule reminder notification (15 minutes before)
      const reminderTime = new Date(nextTime.getTime() - 15 * 60 * 1000);
      if (reminderTime > new Date()) {
        const reminderNotification: ScheduledNotification = {
          id: `reminder_${alarm.id}`,
          alarmId: alarm.id,
          type: 'reminder',
          scheduledTime: reminderTime,
          notification: {
            title: '⏰ Alarm Reminder',
            body: `${alarm.label} in 15 minutes`,
            icon: '/icon-192x192.png',
            tag: `reminder_${alarm.id}`,
            silent: true,
            data: {
              alarmId: alarm.id,
              type: 'reminder',
            },
          },
        };

        await this.scheduleNotification(reminderNotification);
      }

      console.log(`Scheduled notifications for alarm ${alarm.id} at ${nextTime}`);
    } catch (error) {
      console.error('Error scheduling alarm notification:', error);
    }
  }

  static async scheduleSnoozeNotification(
    alarm: Alarm,
    minutes: number = 5
  ): Promise<void> {
    if (!this.hasPermission) {
      console.warn('No notification permission, cannot schedule snooze notification');
      return;
    }

    try {
      const snoozeTime = new Date(Date.now() + minutes * 60 * 1000);
      const voiceMoodConfig = getVoiceMoodConfig(alarm.voiceMood);

      const snoozeNotification: ScheduledNotification = {
        id: `snooze_${alarm.id}_${Date.now()}`,
        alarmId: alarm.id,
        type: 'snooze',
        scheduledTime: snoozeTime,
        notification: {
          title: `😴 ${alarm.label} (Snoozed)`,
          body: `Snooze time is up! ${voiceMoodConfig.name} mode ready.`,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: `snooze_${alarm.id}`,
          requireInteraction: true,
          vibrate: [300, 100, 300, 100, 300],
          actions: [
            {
              action: 'dismiss',
              title: 'Dismiss',
              icon: '/dismiss-icon.png',
            },
            {
              action: 'snooze',
              title: 'Snooze 5min',
              icon: '/snooze-icon.png',
            },
          ],
          data: {
            alarmId: alarm.id,
            voiceMood: alarm.voiceMood,
            type: 'snooze',
            snoozeCount: alarm.snoozeCount + 1,
          },
        },
      };

      await this.scheduleNotification(snoozeNotification);
      console.log(
        `Scheduled snooze notification for alarm ${alarm.id} in ${minutes} minutes`
      );
    } catch (error) {
      console.error('Error scheduling snooze notification:', error);
    }
  }

  static async cancelAlarmNotifications(alarmId: string): Promise<void> {
    try {
      // Cancel all notification types for this alarm
      const notificationIds = [
        `alarm_${alarmId}`,
        `reminder_${alarmId}`,
        ...Array.from(this.scheduledNotifications.keys()).filter(id =>
          id.startsWith(`snooze_${alarmId}`)
        ),
      ];

      for (const id of notificationIds) {
        await this.cancelNotification(id);
      }

      console.log(`Cancelled all notifications for alarm ${alarmId}`);
    } catch (error) {
      console.error('Error cancelling alarm notifications:', error);
    }
  }

  private static async scheduleNotification(
    scheduledNotification: ScheduledNotification
  ): Promise<void> {
    try {
      // Store the scheduled notification
      this.scheduledNotifications.set(scheduledNotification.id, scheduledNotification);

      // Try Capacitor local notifications first
      try {
        await scheduleLocalNotification({
          id: parseInt(scheduledNotification.id.replace(/\D/g, '')) || Date.now(),
          title: scheduledNotification.notification.title,
          body: scheduledNotification.notification.body,
          schedule: scheduledNotification.scheduledTime,
        });
        return;
      } catch (capacitorError) {
        console.warn('Capacitor notification failed, trying web API:', capacitorError);
      }

      // Fallback to setTimeout for web
      const delay = scheduledNotification.scheduledTime.getTime() - Date.now();
      if (delay > 0) {
        setTimeout(() => {
          this.showNotification(scheduledNotification.notification);
        }, delay);
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  private static async cancelNotification(id: string): Promise<void> {
    try {
      // Remove from scheduled notifications
      this.scheduledNotifications.delete(id);

      // Try to cancel Capacitor notification
      try {
        await cancelLocalNotification(parseInt(id.replace(/\D/g, '')) || 0);
      } catch (capacitorError) {
        console.warn('Could not cancel Capacitor notification:', capacitorError);
      }
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  static async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.hasPermission) {
      console.warn('No notification permission');
      return;
    }

    try {
      // Try service worker notification first
      if (this.serviceWorkerRegistration) {
        const notificationOptions: NotificationOptions = {
          body: options.body,
          icon: options.icon || '/icon-192x192.png',
          badge: options.badge || '/badge-72x72.png',
          tag: options.tag,
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false,
          data: options.data || {},
        };

        // Add actions if available (service worker notifications support this)
        if (options.actions) {
          notificationOptions.actions = options.actions;
        }

        await this.serviceWorkerRegistration.showNotification(
          options.title,
          notificationOptions
        );

        // Trigger vibration separately if specified
        if (options.vibrate && 'vibrate' in navigator) {
          navigator.vibrate(options.vibrate);
        }
        return;
      }

      // Fallback to regular notification
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: options.data || {},
      });

      // Trigger vibration separately if specified
      if (options.vibrate && 'vibrate' in navigator) {
        navigator.vibrate(options.vibrate);
      }

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();

        // Dispatch custom event
        window.dispatchEvent(
          new CustomEvent('notification-click', {
            detail: { notification: options },
          })
        );
      };

      // Auto-close after 30 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 30000);
      }

      // Trigger vibration if supported
      if (options.vibrate && navigator.vibrate) {
        navigator.vibrate(options.vibrate);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  static async showTestNotification(voiceMood: string): Promise<void> {
    await this.showNotification({
      title: '🔔 Test Alarm',
      body: `Testing ${voiceMood} voice mood notification`,
      icon: '/icon-192x192.png',
      tag: 'test',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: { type: 'test', voiceMood },
    });
  }

  private static setupNotificationHandlers(): void {
    // Handle notification clicks from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        const { type, data } = event.data;

        switch (type) {
          case 'NOTIFICATION_CLICK':
            this.handleNotificationClick(data);
            break;
          case 'NOTIFICATION_ACTION':
            this.handleNotificationAction(data);
            break;
        }
      });
    }

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Clear any notifications when app becomes visible
        this.clearVisibleNotifications();
      }
    });
  }

  private static handleNotificationClick(data: Record<string, unknown>): void {
    console.log('Notification clicked:', data);

    // Focus the app
    window.focus();

    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent('notification-click', {
        detail: data,
      })
    );
  }

  private static handleNotificationAction(data: Record<string, unknown>): void {
    console.log('Notification action:', data);

    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent('notification-action', {
        detail: data,
      })
    );
  }

  private static async clearVisibleNotifications(): Promise<void> {
    try {
      if (this.serviceWorkerRegistration) {
        const notifications = await this.serviceWorkerRegistration.getNotifications();
        notifications.forEach(notification => notification.close());
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  static getPermissionStatus(): NotificationPermission {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  }

  static hasNotificationPermission(): boolean {
    return this.hasPermission;
  }

  static getScheduledNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values());
  }

  static async vibrate(pattern: number[] = [200, 100, 200]): Promise<void> {
    try {
      await vibrate();
    } catch {
      // Fallback to web vibration
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    }
  }

  static async sendPushNotification(payload: Record<string, unknown>): Promise<void> {
    // This would be implemented with a backend service
    // For now, we'll just log the payload
    console.log('Push notification payload:', payload);

    // In a real implementation, you would send this to your backend
    // which would then send the push notification via FCM/APNS
  }
}
