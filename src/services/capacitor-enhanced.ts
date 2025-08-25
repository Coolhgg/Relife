import { Capacitor } from '@capacitor/core';
import {
// auto: restored by scout - verify import path
import { KeepAwake } from '@capacitor/keep-awake';
// auto: restored by scout - verify import path
import { AppState } from '@/types';
// auto: restored by scout - verify import path
import { Network } from '@capacitor/network';
// auto: restored by scout - verify import path
import { AppInfo } from '@/types';
// auto: restored by scout - verify import path
import App from '@/App';
// auto: restored by scout - verify import path
import { BackgroundMode } from '@capacitor/background-mode';
// auto: restored by scout - verify import path
import { BackgroundMode } from '@capacitor/background-mode';
// auto: restored by scout - verify import path
import { AppInfo } from '@/types';
// auto: restored by scout - verify import path
import App from '@/App';
// auto: restored by scout - verify import path
import { KeepAwake } from '@capacitor/keep-awake';
// auto: restored by scout - verify import path
import { AppState } from '@/types';
// auto: restored by scout - verify import path
import { Network } from '@capacitor/network';
  LocalNotifications,
  ActionPerformed,
  LocalNotificationSchema,
  LocalNotificationDescriptor,
} from '@capacitor/local-notifications';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
// import ... from '@capacitor/app'; // Package not available in current setup
import { Device, DeviceInfo } from '@capacitor/device';
// import ... from '@capacitor/network'; // Package not available in current setup
// import ... from '@capacitor-community/keep-awake'; // Package not available in current setup
// import ... from '@capacitor-community/background-mode'; // Package not available in current setup
// import ... from '@capacitor/badge'; // Package not available in current setup

export interface AlarmNotification {
  id: number;
  title: string;
  body: string;
  sound?: string;
  vibration?: boolean;
  scheduledAt: Date;
  recurring?: {
    days: number[]; // 0-6, Sunday to Saturday
    interval?: 'daily' | 'weekly' | 'monthly';
  };
  actions?: {
    snooze: boolean;
    dismiss: boolean;
  };
}

export interface DeviceFeatures {
  hasHaptics: boolean;
  hasNotifications: boolean;
  hasBiometrics: boolean;
  hasWakeLock: boolean;
  hasBackgroundMode: boolean;
  platform: 'ios' | 'android' | 'web';
  version: string;
}

export class CapacitorEnhancedService {
  private static instance: CapacitorEnhancedService;
  private deviceFeatures: DeviceFeatures | null = null;
  private isInitialized = false;
  private appInfo: AppInfo | null = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    if (!CapacitorEnhancedService.instance) {
      CapacitorEnhancedService.instance = this;
    }
    return CapacitorEnhancedService.instance;
  }

  static getInstance(): CapacitorEnhancedService {
    if (!CapacitorEnhancedService.instance) {
      CapacitorEnhancedService.instance = new CapacitorEnhancedService();
    }
    return CapacitorEnhancedService.instance;
  }

  // Initialize all Capacitor services
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[Capacitor] Initializing enhanced services...');

    try {
      // Get device features
      await this.detectDeviceFeatures();

      // Initialize core services
      await this.initializeCore();

      // Initialize notifications
      await this.initializeNotifications();

      // Initialize app state listeners
      await this.initializeAppListeners();

      // Initialize network monitoring
      await this.initializeNetwork();

      // Initialize status bar
      await this.initializeStatusBar();

      // Hide splash screen
      await this.hideSplashScreen();

      this.isInitialized = true;
      console.log('[Capacitor] Enhanced services initialized successfully');
      this.emit('initialized', { features: this.deviceFeatures });
    } catch (_error) {
      console.error('[Capacitor] Failed to initialize services:', _error);
      throw _error;
    }
  }

  // Detect device capabilities
  private async detectDeviceFeatures(): Promise<void> {
    try {
      const deviceInfo = await Device.getInfo();
      const appInfo = await App.getInfo();

      this.appInfo = appInfo;
      this.deviceFeatures = {
        hasHaptics:
          Capacitor.isNativePlatform() &&
          (deviceInfo.platform === 'ios' ||
            (deviceInfo.platform === 'android' && parseInt(deviceInfo.osVersion) >= 8)),
        hasNotifications: Capacitor.isNativePlatform(),
        hasBiometrics: Capacitor.isNativePlatform(),
        hasWakeLock: Capacitor.isNativePlatform(),
        hasBackgroundMode: Capacitor.isNativePlatform(),
        platform: deviceInfo.platform as 'ios' | 'android' | 'web',
        version: appInfo.version,
      };

      console.log('[Capacitor] Device features detected:', this.deviceFeatures);
    } catch (_error) {
      console._error('[Capacitor] Failed to detect device features:', _error);
      // Fallback features
      this.deviceFeatures = {
        hasHaptics: false,
        hasNotifications: false,
        hasBiometrics: false,
        hasWakeLock: false,
        hasBackgroundMode: false,
        platform: 'web',
        version: '1.0.0',
      };
    }
  }

  // Initialize core services
  private async initializeCore(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Enable background mode for alarms
      if (this.deviceFeatures?.hasBackgroundMode) {
        await BackgroundMode.enable();
        console.log('[Capacitor] Background mode enabled');
      }

      // Initialize badge
      await Badge.clear();
    } catch (_error) {
      console.warn('[Capacitor] Core initialization warning:', _error);
    }
  }

  // Initialize local notifications
  private async initializeNotifications(): Promise<void> {
    if (!this.deviceFeatures?.hasNotifications) return;

    try {
      // Request permissions
      const permissions = await LocalNotifications.requestPermissions();
      console.log('[Capacitor] Notification permissions:', permissions);

      // Listen for notification events
      LocalNotifications.addListener('localNotificationReceived', notification => {
        console.log('[Capacitor] Notification received:', notification);
        this.emit('notification-received', notification);
      });

      LocalNotifications.addListener('localNotificationActionPerformed', action => {
        console.log('[Capacitor] Notification action:', action);
        this.handleNotificationAction(action);
      });
    } catch (_error) {
      console._error('[Capacitor] Notification initialization failed:', _error);
    }
  }

  // Initialize app state listeners
  private async initializeAppListeners(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    App.addListener('appStateChange', (state: AppState) => {
      console.log('[Capacitor] App state changed:', state);
      this.emit('app-state-change', state);

      if (state.isActive) {
        this.handleAppBecomeActive();
      } else {
        this.handleAppGoBackground();
      }
    });

    App.addListener('appUrlOpen', event => {
      console.log('[Capacitor] App opened via URL:', _event);
      this.emit('app-url-open', _event);
    });

    App.addListener('backButton', event => {
      console.log('[Capacitor] Back button pressed:', _event);
      this.emit('back-button', _event);
    });
  }

  // Initialize network monitoring
  private async initializeNetwork(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const status = await Network.getStatus();
      console.log('[Capacitor] Initial network status:', status);

      Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
        console.log('[Capacitor] Network status changed:', status);
        this.emit('network-change', status);
      });
    } catch (_error) {
      console.warn('[Capacitor] Network monitoring initialization failed:', _error);
    }
  }

  // Initialize status bar
  private async initializeStatusBar(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#667eea' });
    } catch (_error) {
      console.warn('[Capacitor] Status bar configuration failed:', _error);
    }
  }

  // Hide splash screen
  private async hideSplashScreen(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await SplashScreen.hide();
    } catch (_error) {
      console.warn('[Capacitor] Splash screen hide failed:', _error);
    }
  }

  // Alarm-specific methods

  // Schedule alarm notification
  async scheduleAlarmNotification(alarm: AlarmNotification): Promise<void> {
    if (!this.deviceFeatures?.hasNotifications) {
      throw new Error('Notifications not supported');
    }

    const notification: LocalNotificationSchema = {
      id: alarm.id,
      title: alarm.title,
      body: alarm.body,
      schedule: { at: alarm.scheduledAt },
      sound: alarm.sound || 'default',
      attachments: undefined,
      actionTypeId: 'ALARM_ACTIONS',
      extra: {
        type: 'alarm',
        alarmId: alarm.id,
      },
    };

    try {
      await LocalNotifications.schedule({ notifications: [notification] });

      // Update badge count
      const pending = await LocalNotifications.getPending();
      await Badge.set({ count: pending.notifications.length });

      console.log('[Capacitor] Alarm notification scheduled:', alarm.id);
      this.emit('alarm-scheduled', { alarm, notification });
    } catch (_error) {
      console.error('[Capacitor] Failed to schedule alarm:', _error);
      throw _error;
    }
  }

  // Cancel alarm notification
  async cancelAlarmNotification(alarmId: number): Promise<void> {
    if (!this.deviceFeatures?.hasNotifications) return;

    try {
      await LocalNotifications.cancel({ notifications: [{ id: alarmId }] });

      // Update badge count
      const pending = await LocalNotifications.getPending();
      await Badge.set({ count: pending.notifications.length });

      console.log('[Capacitor] Alarm notification cancelled:', alarmId);
      this.emit('alarm-cancelled', { alarmId });
    } catch (_error) {
      console.error('[Capacitor] Failed to cancel alarm:', _error);
      throw _error;
    }
  }

  // Get pending alarms
  async getPendingAlarms(): Promise<LocalNotificationDescriptor[]> {
    if (!this.deviceFeatures?.hasNotifications) return [];

    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications.filter((n: any) => n.extra?.type === 'alarm');
    } catch (_error) {
      console._error('[Capacitor] Failed to get pending alarms:', _error);
      return [];
    }
  }

  // Haptic feedback methods
  async triggerHapticFeedback(
    type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | '_error' = 'light'
  ): Promise<void> {
    if (!this.deviceFeatures?.hasHaptics) return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.SUCCESS });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.WARNING });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.ERROR });
          break;
      }
    } catch (_error) {
      console.warn('[Capacitor] Haptic feedback failed:', _error);
    }
  }

  // Keep screen awake during alarm
  async keepAwake(): Promise<void> {
    if (!this.deviceFeatures?.hasWakeLock) return;

    try {
      await KeepAwake.keepAwake();
      console.log('[Capacitor] Screen wake lock acquired');
    } catch (_error) {
      console.warn('[Capacitor] Keep awake failed:', _error);
    }
  }

  // Allow screen to sleep
  async allowSleep(): Promise<void> {
    if (!this.deviceFeatures?.hasWakeLock) return;

    try {
      await KeepAwake.allowSleep();
      console.log('[Capacitor] Screen wake lock released');
    } catch (_error) {
      console.warn('[Capacitor] Allow sleep failed:', _error);
    }
  }

  // Handle notification actions
  private handleNotificationAction(action: ActionPerformed): void {
    const { actionId, notification } = action;

    switch (actionId) {
      case 'snooze':
        this.handleSnoozeAction(notification);
        break;
      case 'dismiss':
        this.handleDismissAction(notification);
        break;
      case 'tap':
        this.handleTapAction(notification);
        break;
      default:
        console.log('[Capacitor] Unknown notification action:', actionId);
    }
  }

  private handleSnoozeAction(notification: any): void {
    console.log('[Capacitor] Snooze action triggered');
    this.emit('alarm-snoozed', {
      alarmId: notification.extra?.alarmId,
      notification,
    });
  }

  private handleDismissAction(notification: any): void {
    console.log('[Capacitor] Dismiss action triggered');
    this.emit('alarm-dismissed', {
      alarmId: notification.extra?.alarmId,
      notification,
    });
  }

  private handleTapAction(notification: any): void {
    console.log('[Capacitor] Notification tapped');
    this.emit('alarm-tapped', {
      alarmId: notification.extra?.alarmId,
      notification,
    });
  }

  // App lifecycle handlers
  private async handleAppBecomeActive(): Promise<void> {
    console.log('[Capacitor] App became active');

    // Clear badge when app becomes active
    try {
      await Badge.clear();
    } catch (_error) {
      console.warn('[Capacitor] Failed to clear badge:', _error);
    }
  }

  private async handleAppGoBackground(): Promise<void> {
    console.log('[Capacitor] App went to background');

    // Enable background mode if needed
    if (this.deviceFeatures?.hasBackgroundMode) {
      try {
        await BackgroundMode.enable();
      } catch (_error) {
        console.warn('[Capacitor] Failed to enable background mode:', _error);
      }
    }
  }

  // Utility methods
  getDeviceFeatures(): DeviceFeatures | null {
    return this.deviceFeatures;
  }

  getAppInfo(): AppInfo | null {
    return this.appInfo;
  }

  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  getPlatform(): string {
    return Capacitor.getPlatform();
  }

  // Event handling
  on(_event: string, callback: Function): void {
    if (!this.listeners.has(_event)) {
      this.listeners.set(_event, []);
    }
    this.listeners.get(_event)!.push(callback);
  }

  off(_event: string, callback: Function): void {
    const listeners = this.listeners.get(_event);
    if (listeners) {
      const _index = listeners.indexOf(callback);
      if (_index > -1) {
        listeners.splice(_index, 1);
      }
    }
  }

  private emit(_event: string, data?: any): void {
    const listeners = this.listeners.get(_event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (_error) {
          console.error(`[Capacitor] Event listener _error for ${_event}:`, _error);
        }
      });
    }
  }

  // Cleanup
  destroy(): void {
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const capacitorEnhanced = CapacitorEnhancedService.getInstance();
