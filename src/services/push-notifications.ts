import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { Alarm } from '../types';
import { NotificationService } from './notification';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
  category?: string;
}

export interface PushNotificationSettings {
  enabled: boolean;
  alarmReminders: boolean;
  dailyMotivation: boolean;
  weeklyProgress: boolean;
  systemUpdates: boolean;
  emergencyAlerts: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeCount: boolean;
}

export interface PushSubscription {
  token: string;
  platform: string;
  deviceId: string;
  registrationTime: Date;
  isActive: boolean;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private static isInitialized = false;
  private static hasPermission = false;
  private static currentToken: string | null = null;
  private static settings: PushNotificationSettings = {
    enabled: true,
    alarmReminders: true,
    dailyMotivation: true,
    weeklyProgress: true,
    systemUpdates: true,
    emergencyAlerts: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00'
    },
    soundEnabled: true,
    vibrationEnabled: true,
    badgeCount: true
  };

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): PushNotificationService {
    if (!this.instance) {
      this.instance = new PushNotificationService();
    }
    return this.instance;
  }

  /**
   * Initialize push notification service
   */
  static async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return this.hasPermission;
    }

    try {
      console.log('Initializing push notification service...');

      // Load saved settings
      await this.loadSettings();

      // Check if push notifications are supported
      if (!Capacitor.isNativePlatform() && !this.isWebPushSupported()) {
        console.warn('Push notifications not supported on this platform');
        return false;
      }

      // Request permissions
      this.hasPermission = await this.requestPermissions();
      
      if (this.hasPermission) {
        // Register for push notifications
        await this.registerForPush();
        
        // Setup listeners
        this.setupPushListeners();
        
        // Initialize notification badge
        await this.updateBadgeCount(0);
      }

      this.isInitialized = true;
      console.log('Push notification service initialized, permission:', this.hasPermission);
      
      return this.hasPermission;
    } catch (error) {
      console.error('Error initializing push notification service:', error);
      return false;
    }
  }

  /**
   * Request push notification permissions
   */
  private static async requestPermissions(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Mobile platforms
        const { receive } = await PushNotifications.requestPermissions();
        return receive === 'granted';
      } else {
        // Web platform
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting push permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications
   */
  private static async registerForPush(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await PushNotifications.register();
      } else {
        // Web push registration would happen here
        await this.registerWebPush();
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      throw error;
    }
  }

  /**
   * Register for web push notifications
   */
  private static async registerWebPush(): Promise<void> {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        
        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          // Create new subscription
          const vapidPublicKey = await this.getVapidKey();
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidPublicKey
          });
        }
        
        if (subscription) {
          this.currentToken = btoa(JSON.stringify(subscription));
          await this.saveSubscription(subscription);
        }
      }
    } catch (error) {
      console.error('Error registering web push:', error);
    }
  }

  /**
   * Setup push notification event listeners
   */
  private static setupPushListeners(): void {
    // Registration success
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success:', token.value);
      this.currentToken = token.value;
      await this.saveTokenToStorage(token.value);
      await this.sendTokenToServer(token.value);
    });

    // Registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Push notification received (foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      this.handlePushReceived(notification);
    });

    // Push notification action performed
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action:', notification);
      this.handlePushAction(notification);
    });
  }

  /**
   * Setup general event listeners
   */
  private setupEventListeners(): void {
    // Handle app lifecycle changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // App became visible, clear badge
        PushNotificationService.updateBadgeCount(0);
      }
    });

    // Handle custom events
    window.addEventListener('alarm-triggered', (event: CustomEvent) => {
      this.handleAlarmTriggered(event.detail.alarmId);
    });

    window.addEventListener('alarm-dismissed', (event: CustomEvent) => {
      this.handleAlarmDismissed(event.detail.alarmId);
    });
  }

  /**
   * Schedule push notification for alarm
   */
  static async scheduleAlarmPush(alarm: Alarm): Promise<void> {
    if (!this.hasPermission || !this.settings.alarmReminders) {
      return;
    }

    try {
      const payload: PushNotificationPayload = {
        title: `🔔 ${alarm.label}`,
        body: 'Your alarm is ready to wake you up!',
        data: {
          type: 'alarm',
          alarmId: alarm.id,
          action: 'trigger'
        },
        badge: 1,
        sound: 'alarm.wav',
        category: 'alarm'
      };

      await this.sendPushToServer(payload, this.getAlarmScheduleTime(alarm));
    } catch (error) {
      console.error('Error scheduling alarm push:', error);
    }
  }

  /**
   * Send daily motivation notification
   */
  static async sendDailyMotivation(message: string): Promise<void> {
    if (!this.hasPermission || !this.settings.dailyMotivation) {
      return;
    }

    if (this.isQuietHours()) {
      return;
    }

    try {
      const payload: PushNotificationPayload = {
        title: '💪 Daily Motivation',
        body: message,
        data: {
          type: 'motivation',
          action: 'view'
        },
        badge: 1,
        category: 'motivation'
      };

      await this.sendPushToServer(payload);
    } catch (error) {
      console.error('Error sending daily motivation:', error);
    }
  }

  /**
   * Send weekly progress notification
   */
  static async sendWeeklyProgress(stats: any): Promise<void> {
    if (!this.hasPermission || !this.settings.weeklyProgress) {
      return;
    }

    if (this.isQuietHours()) {
      return;
    }

    try {
      const payload: PushNotificationPayload = {
        title: '📊 Weekly Progress',
        body: `You've completed ${stats.alarmsTriggered} alarms this week! ${stats.streak > 7 ? '🔥' : ''}`,
        data: {
          type: 'progress',
          action: 'view',
          stats: JSON.stringify(stats)
        },
        badge: 1,
        category: 'progress'
      };

      await this.sendPushToServer(payload);
    } catch (error) {
      console.error('Error sending weekly progress:', error);
    }
  }

  /**
   * Send system update notification
   */
  static async sendSystemUpdate(title: string, message: string): Promise<void> {
    if (!this.hasPermission || !this.settings.systemUpdates) {
      return;
    }

    try {
      const payload: PushNotificationPayload = {
        title: `🚀 ${title}`,
        body: message,
        data: {
          type: 'system',
          action: 'view'
        },
        badge: 1,
        category: 'system'
      };

      await this.sendPushToServer(payload);
    } catch (error) {
      console.error('Error sending system update:', error);
    }
  }

  /**
   * Send emergency alert
   */
  static async sendEmergencyAlert(title: string, message: string): Promise<void> {
    if (!this.hasPermission || !this.settings.emergencyAlerts) {
      return;
    }

    try {
      const payload: PushNotificationPayload = {
        title: `🚨 ${title}`,
        body: message,
        data: {
          type: 'emergency',
          action: 'urgent'
        },
        badge: 1,
        sound: 'emergency.wav',
        category: 'emergency'
      };

      await this.sendPushToServer(payload);
    } catch (error) {
      console.error('Error sending emergency alert:', error);
    }
  }

  /**
   * Update notification settings
   */
  static async updateSettings(newSettings: Partial<PushNotificationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await this.saveSettings();
      
      // If notifications are disabled, unregister
      if (!this.settings.enabled) {
        await this.unregister();
      } else if (!this.hasPermission) {
        // If enabled but no permission, request it
        await this.requestPermissions();
      }

      console.log('Push notification settings updated:', this.settings);
    } catch (error) {
      console.error('Error updating push settings:', error);
    }
  }

  /**
   * Get current settings
   */
  static getSettings(): PushNotificationSettings {
    return { ...this.settings };
  }

  /**
   * Handle push notification received
   */
  private static handlePushReceived(notification: any): void {
    console.log('Processing received push notification:', notification);
    
    // Track notification received
    this.trackNotificationEvent('received', notification);
    
    // Handle different notification types
    switch (notification.data?.type) {
      case 'alarm':
        this.handleAlarmPushReceived(notification);
        break;
      case 'motivation':
      case 'progress':
      case 'system':
        // These are handled by the system automatically
        break;
      case 'emergency':
        this.handleEmergencyPushReceived(notification);
        break;
      default:
        console.log('Unknown push notification type:', notification.data?.type);
    }
  }

  /**
   * Handle push notification action
   */
  private static handlePushAction(notification: any): void {
    console.log('Processing push notification action:', notification);
    
    // Track notification action
    this.trackNotificationEvent('action', notification);
    
    const action = notification.actionId;
    const data = notification.notification.data;
    
    switch (action) {
      case 'dismiss':
        this.handleDismissAction(data);
        break;
      case 'snooze':
        this.handleSnoozeAction(data);
        break;
      case 'view':
        this.handleViewAction(data);
        break;
      default:
        // Default tap action
        this.handleDefaultAction(data);
    }
  }

  /**
   * Utility Methods
   */

  private static isWebPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  private static isQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const startParts = this.settings.quietHours.start.split(':');
    const startTime = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    
    const endParts = this.settings.quietHours.end.split(':');
    const endTime = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private static getAlarmScheduleTime(alarm: Alarm): Date {
    // This would calculate the next alarm time
    // For now, return a simple calculation
    return new Date(Date.now() + 60 * 1000); // 1 minute from now for testing
  }

  private static async getVapidKey(): Promise<string> {
    // In a real implementation, this would be your VAPID public key
    return 'BNxZ-your-vapid-public-key-here';
  }

  private static async saveSubscription(subscription: PushSubscription): Promise<void> {
    try {
      await Preferences.set({
        key: 'push_subscription',
        value: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('Error saving push subscription:', error);
    }
  }

  private static async saveTokenToStorage(token: string): Promise<void> {
    try {
      await Preferences.set({
        key: 'push_token',
        value: token
      });
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  private static async loadSettings(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: 'push_settings' });
      if (value) {
        const savedSettings = JSON.parse(value);
        this.settings = { ...this.settings, ...savedSettings };
      }
    } catch (error) {
      console.error('Error loading push settings:', error);
    }
  }

  private static async saveSettings(): Promise<void> {
    try {
      await Preferences.set({
        key: 'push_settings',
        value: JSON.stringify(this.settings)
      });
    } catch (error) {
      console.error('Error saving push settings:', error);
    }
  }

  private static async sendTokenToServer(token: string): Promise<void> {
    try {
      // In a real implementation, send token to your backend
      console.log('Sending token to server:', token);
      
      // Example API call:
      // await fetch('/api/push/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     token,
      //     platform: Capacitor.getPlatform(),
      //     deviceId: await this.getDeviceId()
      //   })
      // });
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }

  private static async sendPushToServer(payload: PushNotificationPayload, scheduleTime?: Date): Promise<void> {
    try {
      // In a real implementation, send push request to your backend
      console.log('Scheduling push notification:', payload, scheduleTime);
      
      // Example API call:
      // await fetch('/api/push/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     payload,
      //     scheduleTime,
      //     token: this.currentToken
      //   })
      // });
    } catch (error) {
      console.error('Error sending push to server:', error);
    }
  }

  private static async updateBadgeCount(count: number): Promise<void> {
    if (!this.settings.badgeCount) return;

    try {
      if (Capacitor.isNativePlatform()) {
        // Mobile badge update would be implemented here
        console.log('Updating badge count to:', count);
      }
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  }

  private static async unregister(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Mobile unregistration
        console.log('Unregistering from push notifications');
      } else {
        // Web unregistration
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }
      
      this.currentToken = null;
      this.hasPermission = false;
    } catch (error) {
      console.error('Error unregistering from push notifications:', error);
    }
  }

  private static trackNotificationEvent(event: string, data: any): void {
    // Track notification events for analytics
    window.dispatchEvent(new CustomEvent('notification-analytics', {
      detail: {
        event,
        data,
        timestamp: new Date()
      }
    }));
  }

  private static handleAlarmPushReceived(notification: any): void {
    const alarmId = notification.data?.alarmId;
    if (alarmId) {
      // Trigger alarm in the app
      window.dispatchEvent(new CustomEvent('alarm-triggered', {
        detail: { alarmId, source: 'push' }
      }));
    }
  }

  private static handleEmergencyPushReceived(notification: any): void {
    // Emergency notifications bypass quiet hours and show immediately
    NotificationService.showNotification({
      title: notification.title,
      body: notification.body,
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500]
    });
  }

  private static handleDismissAction(data: any): void {
    if (data.alarmId) {
      window.dispatchEvent(new CustomEvent('alarm-dismissed', {
        detail: { alarmId: data.alarmId, source: 'push' }
      }));
    }
  }

  private static handleSnoozeAction(data: any): void {
    if (data.alarmId) {
      window.dispatchEvent(new CustomEvent('alarm-snoozed', {
        detail: { alarmId: data.alarmId, source: 'push' }
      }));
    }
  }

  private static handleViewAction(data: any): void {
    // Navigate to relevant section based on notification type
    switch (data.type) {
      case 'progress':
        window.location.hash = '/progress';
        break;
      case 'motivation':
        window.location.hash = '/dashboard';
        break;
      default:
        window.focus();
    }
  }

  private static handleDefaultAction(data: any): void {
    window.focus();
    
    if (data.alarmId) {
      window.dispatchEvent(new CustomEvent('alarm-focus', {
        detail: { alarmId: data.alarmId }
      }));
    }
  }

  private static handleAlarmTriggered(alarmId: string): void {
    console.log('Alarm triggered via push:', alarmId);
    this.updateBadgeCount(0);
  }

  private static handleAlarmDismissed(alarmId: string): void {
    console.log('Alarm dismissed via push:', alarmId);
    this.updateBadgeCount(0);
  }

  /**
   * Public API Methods
   */

  static getPermissionStatus(): boolean {
    return this.hasPermission;
  }

  static getCurrentToken(): string | null {
    return this.currentToken;
  }

  static async testPushNotification(): Promise<void> {
    const payload: PushNotificationPayload = {
      title: '🔔 Test Notification',
      body: 'This is a test push notification from Relife Alarm!',
      data: {
        type: 'test',
        action: 'view'
      },
      badge: 1
    };

    await this.sendPushToServer(payload);
  }
}