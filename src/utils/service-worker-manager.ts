// Enhanced Service Worker Manager for Alarm Reliability
import type { Alarm } from '../types';
import { ErrorHandler } from '../services/error-handler';
import { TimeoutHandle } from '../types/timers';

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('ServiceWorkerManager: Service workers not supported');
      return false;
    }

    try {
      console.log('ServiceWorkerManager: Registering enhanced service worker...');

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw-enhanced.js');

      // Request notification permissions
      await this.requestNotificationPermission();

      // Set up message listeners
      this.setupMessageListeners();

      // Set up visibility change handling
      this.setupVisibilityHandling();

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      this.isInitialized = true;
      console.log('ServiceWorkerManager: Initialization complete');

      return true;
    } catch (error) {
      console.error('ServiceWorkerManager: Initialization failed:', error);
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Service worker initialization failed'
      );
      return false;
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('ServiceWorkerManager: Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      console.warn('ServiceWorkerManager: Notification permission denied');
      return 'denied';
    }

    try {
      console.log('ServiceWorkerManager: Requesting notification permission...');
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('ServiceWorkerManager: Notification permission granted');
        // Notify service worker about permission
        await this.sendMessage('REQUEST_NOTIFICATION_PERMISSION');
      } else {
        console.warn(
          'ServiceWorkerManager: Notification permission not granted:',
          permission
        );
      }

      return permission;
    } catch (error) {
      console.error(
        'ServiceWorkerManager: Error requesting notification permission:',
        error
      );
      return 'denied';
    }
  }

  async updateAlarms(alarms: Alarm[]): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('ServiceWorkerManager: Not initialized, cannot update alarms');
      return false;
    }

    try {
      console.log(`ServiceWorkerManager: Updating ${alarms.length} alarms`);

      const response = await this.sendMessage('UPDATE_ALARMS', { alarms });

      if (response.success) {
        console.log('ServiceWorkerManager: Alarms updated successfully');
        return true;
      } else {
        console.error('ServiceWorkerManager: Failed to update alarms:', response.error);
        return false;
      }
    } catch (error) {
      console.error('ServiceWorkerManager: Error updating alarms:', error);
      return false;
    }
  }

  async scheduleAlarm(alarm: Alarm): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('ServiceWorkerManager: Not initialized, cannot schedule alarm');
      return false;
    }

    try {
      console.log(`ServiceWorkerManager: Scheduling alarm ${alarm.id}`);

      const response = await this.sendMessage('SCHEDULE_ALARM', { alarm });

      if (response.success) {
        console.log(`ServiceWorkerManager: Alarm ${alarm.id} scheduled successfully`);
        return true;
      } else {
        console.error(
          `ServiceWorkerManager: Failed to schedule alarm ${alarm.id}:`,
          response.error
        );
        return false;
      }
    } catch (error) {
      console.error(`ServiceWorkerManager: Error scheduling alarm ${alarm.id}:`, error);
      return false;
    }
  }

  async cancelAlarm(alarmId: string): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('ServiceWorkerManager: Not initialized, cannot cancel alarm');
      return false;
    }

    try {
      console.log(`ServiceWorkerManager: Cancelling alarm ${alarmId}`);

      const response = await this.sendMessage('CANCEL_ALARM', { alarmId });

      if (response.success) {
        console.log(`ServiceWorkerManager: Alarm ${alarmId} cancelled successfully`);
        return true;
      } else {
        console.error(
          `ServiceWorkerManager: Failed to cancel alarm ${alarmId}:`,
          response.error
        );
        return false;
      }
    } catch (error) {
      console.error(`ServiceWorkerManager: Error cancelling alarm ${alarmId}:`, error);
      return false;
    }
  }

  async getServiceWorkerState(): Promise<any> {
    if (!this.isInitialized) {
      return { error: 'Service worker not initialized' };
    }

    try {
      const response = await this.sendMessage('GET_SERVICE_WORKER_STATE');
      return response.data || response;
    } catch (error) {
      console.error('ServiceWorkerManager: Error getting service worker state:', error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  async performHealthCheck(): Promise<any> {
    if (!this.isInitialized) {
      return { error: 'Service worker not initialized' };
    }

    try {
      console.log('ServiceWorkerManager: Performing health check...');
      const response = await this.sendMessage('HEALTH_CHECK');
      console.log('ServiceWorkerManager: Health check result:', response.data);
      return response.data || response;
    } catch (error) {
      console.error('ServiceWorkerManager: Error performing health check:', error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async sendMessage(type: string, data?: any): Promise<any> {
    return new Promise((resolve, reject
) => {
      if (!this.registration?.active) {
        reject(new Error('Service worker not active'));
        return;
      }

      // Create MessageChannel for reliable communication
      const messageChannel = new MessageChannel();

      // Set up timeout
      const timeout = setTimeout((
) => {
        reject(new Error('Service worker message timeout'));
      }, 10000); // 10 second timeout

      messageChannel.port1.onmessage = event => {
        clearTimeout(timeout);
        resolve(event.data);
      };

      // Send message
      this.registration.active.postMessage({ type, data }, [messageChannel.port2]);
    });
  }

  private setupMessageListeners(): void {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('message', event => {
      const { type, data } = event.data;

      switch (type) {
        case 'ALARM_TRIGGERED':
          console.log('ServiceWorkerManager: Alarm triggered:', data.alarm.id);
          this.handleAlarmTriggered(data.alarm);
          break;

        case 'ALARM_SCHEDULED':
          console.log('ServiceWorkerManager: Alarm scheduled:', data.alarmId);
          break;

        case 'ALARM_CANCELLED':
          console.log('ServiceWorkerManager: Alarm cancelled:', data.alarmId);
          break;

        case 'NETWORK_STATUS':
          console.log('ServiceWorkerManager: Network status change:', data.isOnline);
          break;

        case 'COMPLETE_SYNC_FINISHED':
          console.log('ServiceWorkerManager: Service worker sync completed');
          break;

        default:
          console.log('ServiceWorkerManager: Unknown service worker message:', type);
      }
    });
  }

  private handleAlarmTriggered(alarm: Alarm): void {
    // Dispatch custom event for the app to handle
    const event = new CustomEvent('serviceWorkerAlarmTriggered', {
      detail: { alarm },
    });
    window.dispatchEvent(event);
  }

  private setupVisibilityHandling(): void {
    document.addEventListener('visibilitychange', (
) => {
      if (!this.isInitialized || !this.registration?.active) return;

      if (document.visibilityState === 'hidden') {
        console.log('ServiceWorkerManager: Tab hidden, syncing alarm state...');
        this.registration.active.postMessage({
          type: 'SYNC_ALARM_STATE',
        });
      } else if (document.visibilityState === 'visible') {
        console.log('ServiceWorkerManager: Tab visible, performing health check...');
        this.registration.active.postMessage({
          type: 'HEALTH_CHECK',
        });
      }
    });

    window.addEventListener('beforeunload', (
) => {
      if (this.registration?.active) {
        this.registration.active.postMessage({
          type: 'TAB_CLOSING',
        });
      }
    });
  }

  // Static convenience methods
  static async initialize(): Promise<boolean> {
    const instance = ServiceWorkerManager.getInstance();
    return await instance.initialize();
  }

  static async updateAlarms(alarms: Alarm[]): Promise<boolean> {
    const instance = ServiceWorkerManager.getInstance();
    return await instance.updateAlarms(alarms);
  }

  static async scheduleAlarm(alarm: Alarm): Promise<boolean> {
    const instance = ServiceWorkerManager.getInstance();
    return await instance.scheduleAlarm(alarm);
  }

  static async cancelAlarm(alarmId: string): Promise<boolean> {
    const instance = ServiceWorkerManager.getInstance();
    return await instance.cancelAlarm(alarmId);
  }

  static async requestNotificationPermission(): Promise<NotificationPermission> {
    const instance = ServiceWorkerManager.getInstance();
    return await instance.requestNotificationPermission();
  }

  static async getServiceWorkerState(): Promise<any> {
    const instance = ServiceWorkerManager.getInstance();
    return await instance.getServiceWorkerState();
  }

  static async performHealthCheck(): Promise<any> {
    const instance = ServiceWorkerManager.getInstance();
    return await instance.performHealthCheck();
  }
}

// Export singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance();
