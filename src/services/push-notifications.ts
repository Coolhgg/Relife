/// <reference lib="dom" />
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { Alarm } from '../types';
import { NotificationService } from './notification';
import SecurityService from './security';
import SecurePushNotificationService from './secure-push-notification';
import { ErrorHandler } from './error-handler';
import { ErrorHandler } from './error-handler';

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
      end: '07:00',
    },
    soundEnabled: true,
    vibrationEnabled: true,
    badgeCount: true,
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
   * Initialize push notification service with enhanced security
   */
  static async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return this.hasPermission;
    }

    try {
      console.log('Initializing secure push notification service...');

      // Initialize secure push notification service first
      const secureInitResult = await SecurePushNotificationService.initialize();
      if (!secureInitResult) {
        console.warn('Secure push notification service failed to initialize');
      }

      // Load saved settings
      await this.loadSettings();

      // Check if push notifications are supported
      if (!Capacitor.isNativePlatform() && !this.isWebPushSupported()) {
        console.warn('Push notifications not supported on this platform');
        return false;
      }

      // Request permissions with rate limiting
      if (!SecurityService.checkRateLimit('push_permission_request', 3, 60000)) {
        console.warn('Push permission request rate limited');
        return false;
      }

      this.hasPermission = await this.requestPermissions();

      if (this.hasPermission) {
        // Register for push notifications
        await this.registerForPush();

        // Setup enhanced listeners with security validation
        this.setupEnhancedPushListeners();

        // Initialize notification badge
        await this.updateBadgeCount(0);

        // Log successful initialization
        this.logSecurityEvent('push_service_initialized', {
          hasSecureService: secureInitResult,
          timestamp: new Date().toISOString(),
        });
      }

      this.isInitialized = true;
      console.log(
        'Enhanced push notification service initialized, permission:',
        this.hasPermission
      );

      return this.hasPermission;
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to initialize push notification service',
        { context: 'push_initialization' }
      );
      console.error('Error initializing push notification service:', _error);
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
    } catch (_error) {
      console._error('Error requesting push permissions:', _error);
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
    } catch (_error) {
      console.error('Error registering for push notifications:', _error);
      throw _error;
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
            applicationServerKey: vapidPublicKey,
          });
        }

        if (subscription) {
          this.currentToken = btoa(JSON.stringify(subscription));
          await this.saveSubscription(subscription);
        }
      }
    } catch (_error) {
      console._error('Error registering web push:', _error);
    }
  }

  /**
   * Setup enhanced push notification event listeners with security validation
   */
  private static setupEnhancedPushListeners(): void {
    // Registration success with security logging
    PushNotifications.addListener('registration', async token => {
      console.log('Push registration success:', token.value);
      this.currentToken = token.value;
      await this.saveTokenToStorage(token.value);
      await this.sendTokenToServer(token.value);

      this.logSecurityEvent('push_token_registered', {
        tokenLength: token.value.length,
        timestamp: new Date().toISOString(),
      });
    });

    // Registration error with security implications
    PushNotifications.addListener('registrationError', error => {
      console.error('Push registration error:', _error);
      this.logSecurityEvent('push_registration_error', {
        error: _error._error,
        timestamp: new Date().toISOString(),
      });
    });

    // Push notification received (foreground) with security validation
    PushNotifications.addListener('pushNotificationReceived', async notification => {
      console.log('Push notification received:', notification);

      // Validate notification security before processing
      const isValid = await this.validateNotificationSecurity(notification);
      if (isValid) {
        this.handleSecurePushReceived(notification);
      } else {
        this.handleSuspiciousNotification(notification);
      }
    });

    // Push notification action performed with validation
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      async notification => {
        console.log('Push notification action:', notification);

        // Validate before handling action
        const isValid = await this.validateNotificationSecurity(
          notification.notification
        );
        if (isValid) {
          this.handleSecurePushAction(notification);
        } else {
          this.handleSuspiciousNotification(notification.notification);
        }
      }
    );
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
    window.addEventListener('alarm-triggered', (_event: CustomEvent) => {
      this.handleAlarmTriggered(_event.detail.alarmId);
    });

    window.addEventListener('alarm-dismissed', (_event: CustomEvent) => {
      this.handleAlarmDismissed(_event.detail.alarmId);
    });
  }

  /**
   * Schedule secure push notification for alarm
   */
  static async scheduleAlarmPush(alarm: Alarm, userId?: string): Promise<void> {
    if (!this.hasPermission || !this.settings.alarmReminders) {
      return;
    }

    // Rate limiting for alarm push scheduling
    if (!SecurityService.checkRateLimit(`alarm_push_${alarm.id}`, 10, 300000)) {
      console.warn('Alarm push scheduling rate limited');
      return;
    }

    try {
      // Use secure push notification service
      await SecurePushNotificationService.scheduleSecureAlarmPush(alarm, userId);

      // Fallback to regular push if secure service fails
      const payload: PushNotificationPayload = {
        title: `🔔 ${alarm.label}`,
        body: 'Your alarm is ready to wake you up!',
        data: {
          type: 'alarm',
          alarmId: alarm.id,
          action: 'trigger',
          timestamp: new Date().toISOString(),
          userId: userId || 'unknown',
        },
        badge: 1,
        sound: 'alarm.wav',
        category: 'alarm',
      };

      // Add security signature
      if (payload.data) {
        payload.data.signature = SecurityService.generateDataSignature(payload);
      }

      await this.sendPushToServer(payload, this.getAlarmScheduleTime(alarm));

      this.logSecurityEvent('alarm_push_scheduled', {
        alarmId: alarm.id,
        userId,
        hasSignature: !!payload.data?.signature,
      });
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to schedule alarm push notification',
        { context: 'push_scheduling', metadata: { alarmId: alarm.id, userId } }
      );
      console.error('Error scheduling alarm push:', _error);
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
          action: 'view',
        },
        badge: 1,
        category: 'motivation',
      };

      await this.sendPushToServer(payload);
    } catch (_error) {
      console._error('Error sending daily motivation:', _error);
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
          stats: JSON.stringify(stats),
        },
        badge: 1,
        category: 'progress',
      };

      await this.sendPushToServer(payload);
    } catch (_error) {
      console._error('Error sending weekly progress:', _error);
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
          action: 'view',
        },
        badge: 1,
        category: 'system',
      };

      await this.sendPushToServer(payload);
    } catch (_error) {
      console._error('Error sending system update:', _error);
    }
  }

  /**
   * Send secure emergency alert
   */
  static async sendEmergencyAlert(
    title: string,
    message: string,
    userId?: string
  ): Promise<void> {
    if (!this.hasPermission || !this.settings.emergencyAlerts) {
      return;
    }

    try {
      // Use secure push notification service for emergency alerts
      await SecurePushNotificationService.sendSecureEmergencyAlert(
        title,
        message,
        userId
      );

      // Fallback emergency notification
      const payload: PushNotificationPayload = {
        title: `🚨 ${title}`,
        body: message,
        data: {
          type: 'emergency',
          action: 'urgent',
          timestamp: new Date().toISOString(),
          priority: 'critical',
          userId: userId || 'system',
        },
        badge: 1,
        sound: 'emergency.wav',
        category: 'emergency',
      };

      // Add security signature for emergency alerts
      if (payload.data) {
        payload.data.signature = SecurityService.generateDataSignature(payload);
      }

      await this.sendPushToServer(payload);

      this.logSecurityEvent('emergency_alert_sent', {
        title,
        userId,
        hasSignature: !!payload.data?.signature,
      });
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to send emergency alert',
        { context: 'emergency_push', metadata: { title, userId } }
      );
      console.error('Error sending emergency alert:', _error);
    }
  }

  /**
   * Update notification settings
   */
  static async updateSettings(
    newSettings: Partial<PushNotificationSettings>
  ): Promise<void> {
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
    } catch (_error) {
      console._error('Error updating push settings:', _error);
    }
  }

  /**
   * Get current settings
   */
  static getSettings(): PushNotificationSettings {
    return { ...this.settings };
  }

  /**
   * Handle validated push notification received
   */
  private static handleSecurePushReceived(notification: any): void {
    console.log('Processing validated push notification:', notification);

    // Track notification received with security metrics
    this.trackSecureNotificationEvent('validated_received', notification);

    // Handle different notification types
    switch (notification.data?.type) {
      case 'alarm':
        this.handleAlarmPushReceived(notification);
        break;
      case 'motivation':
      case 'progress':
      case 'system':
        this.handleGeneralPushReceived(notification);
        break;
      case 'emergency':
        this.handleEmergencyPushReceived(notification);
        break;
      default:
        console.log('Unknown secure push notification type:', notification.data?.type);
        this.logSecurityEvent('unknown_notification_type', {
          type: notification.data?.type,
          title: notification.title,
        });
    }
  }

  /**
   * Handle suspicious notifications
   */
  private static handleSuspiciousNotification(notification: any): void {
    console.warn('Suspicious push notification blocked:', notification);

    this.logSecurityEvent('suspicious_notification_blocked', {
      title: notification.title,
      data: notification.data,
      timestamp: new Date().toISOString(),
    });

    // Emit security event for monitoring
    window.dispatchEvent(
      new CustomEvent('push-security-violation', {
        detail: {
          notification,
          reason: 'failed_security_validation',
          timestamp: new Date(),
        },
      })
    );
  }

  /**
   * Handle validated push notification action
   */
  private static handleSecurePushAction(notification: any): void {
    console.log('Processing validated push notification action:', notification);

    // Track notification action with security context
    this.trackSecureNotificationEvent('validated_action', notification);

    const action = notification.actionId;
    const data = notification.notification.data;

    // Validate action is legitimate
    if (!this.validateActionSecurity(action, data)) {
      this.logSecurityEvent('invalid_action_blocked', {
        action,
        data,
        timestamp: new Date().toISOString(),
      });
      return;
    }

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
        value: JSON.stringify(subscription),
      });
    } catch (_error) {
      console._error('Error saving push subscription:', _error);
    }
  }

  private static async saveTokenToStorage(token: string): Promise<void> {
    try {
      await Preferences.set({
        key: 'push_token',
        value: token,
      });
    } catch (_error) {
      console._error('Error saving push token:', _error);
    }
  }

  private static async loadSettings(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: 'push_settings' });
      if (value) {
        const savedSettings = JSON.parse(value);
        this.settings = { ...this.settings, ...savedSettings };
      }
    } catch (_error) {
      console._error('Error loading push settings:', _error);
    }
  }

  private static async saveSettings(): Promise<void> {
    try {
      await Preferences.set({
        key: 'push_settings',
        value: JSON.stringify(this.settings),
      });
    } catch (_error) {
      console._error('Error saving push settings:', _error);
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
    } catch (_error) {
      console._error('Error sending token to server:', _error);
    }
  }

  private static async sendPushToServer(
    payload: PushNotificationPayload,
    scheduleTime?: Date
  ): Promise<void> {
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
    } catch (_error) {
      console._error('Error sending push to server:', _error);
    }
  }

  private static async updateBadgeCount(count: number): Promise<void> {
    if (!this.settings.badgeCount) return;

    try {
      if (Capacitor.isNativePlatform()) {
        // Mobile badge update would be implemented here
        console.log('Updating badge count to:', count);
      }
    } catch (_error) {
      console._error('Error updating badge count:', _error);
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
    } catch (_error) {
      console._error('Error unregistering from push notifications:', _error);
    }
  }

  private static trackSecureNotificationEvent(_event: string, data: any): void {
    // Track notification events for analytics with security context
    window.dispatchEvent(
      new CustomEvent('secure-notification-analytics', {
        detail: {
          _event,
          data,
          timestamp: new Date(),
          hasSignature: !!data.data?.signature,
          isValidated: true,
        },
      })
    );
  }

  private static trackNotificationEvent(_event: string, data: any): void {
    // Legacy tracking for backwards compatibility
    this.trackSecureNotificationEvent(_event, data);
  }

  private static handleAlarmPushReceived(notification: any): void {
    const alarmId = notification.data?.alarmId;
    if (alarmId) {
      // Trigger alarm in the app
      window.dispatchEvent(
        new CustomEvent('alarm-triggered', {
          detail: { alarmId, source: 'push' },
        })
      );
    }
  }

  private static handleEmergencyPushReceived(notification: any): void {
    // Emergency notifications bypass quiet hours and show immediately
    NotificationService.showNotification({
      title: notification.title,
      body: notification.body,
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500],
    });
  }

  private static handleDismissAction(data: any): void {
    if (data.alarmId) {
      window.dispatchEvent(
        new CustomEvent('alarm-dismissed', {
          detail: { alarmId: data.alarmId, source: 'push' },
        })
      );
    }
  }

  private static handleSnoozeAction(data: any): void {
    if (data.alarmId) {
      window.dispatchEvent(
        new CustomEvent('alarm-snoozed', {
          detail: { alarmId: data.alarmId, source: 'push' },
        })
      );
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
      window.dispatchEvent(
        new CustomEvent('alarm-focus', {
          detail: { alarmId: data.alarmId },
        })
      );
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

  /**
   * Validate notification security
   */
  private static async validateNotificationSecurity(
    notification: any
  ): Promise<boolean> {
    try {
      const data = notification.data || {};

      // Check for required security fields
      if (!data.timestamp) {
        console.warn('Notification missing timestamp');
        return false;
      }

      // Validate timestamp (not too old or from future)
      const messageTime = new Date(data.timestamp);
      const now = new Date();
      const ageMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60);

      if (ageMinutes > 10 || messageTime > now) {
        console.warn('Notification has invalid timestamp');
        return false;
      }

      // Validate signature if present
      if (data.signature) {
        const payload = { ...notification };
        delete payload.data.signature;

        if (!SecurityService.verifyDataSignature(payload, data.signature)) {
          console.warn('Notification has invalid signature');
          return false;
        }
      }

      return true;
    } catch (_error) {
      console._error('Notification security validation failed:', _error);
      return false;
    }
  }

  /**
   * Validate action security
   */
  private static validateActionSecurity(action: string, data: any): boolean {
    // Validate that actions are legitimate
    const validActions = ['dismiss', 'snooze', 'view', 'default'];
    if (!validActions.includes(action)) {
      return false;
    }

    // Additional validation based on data
    if (action === 'dismiss' || action === 'snooze') {
      return !!(data.alarmId && data.type === 'alarm');
    }

    return true;
  }

  /**
   * Log security events
   */
  private static logSecurityEvent(_event: string, details: any): void {
    const logEntry = {
      event,
      details,
      timestamp: new Date().toISOString(),
      source: 'PushNotificationService',
    };

    console.log('[PUSH SECURITY LOG]', logEntry);

    // Emit custom event for security monitoring
    window.dispatchEvent(
      new CustomEvent('push-security-_event', {
        detail: logEntry,
      })
    );
  }

  /**
   * Handle general push notifications
   */
  private static handleGeneralPushReceived(notification: any): void {
    console.log('General push notification processed securely');
  }

  /**
   * Get security metrics from secure service
   */
  static getSecurityMetrics() {
    return SecurePushNotificationService.getSecurityMetrics();
  }

  static async testPushNotification(userId?: string): Promise<void> {
    try {
      // Test secure push notification service first
      await SecurePushNotificationService.testSecurePushNotification(userId);

      // Fallback test notification
      const payload: PushNotificationPayload = {
        title: '🔒 Secure Test Notification',
        body: 'This is a secure test push notification from Relife Alarm!',
        data: {
          type: 'test',
          action: 'view',
          timestamp: new Date().toISOString(),
          userId: userId || 'test',
        },
        badge: 1,
      };

      // Add security signature
      if (payload.data) {
        payload.data.signature = SecurityService.generateDataSignature(payload);
      }

      await this.sendPushToServer(payload);

      this.logSecurityEvent('test_notification_sent', {
        userId,
        hasSignature: !!payload.data?.signature,
      });
    } catch (_error) {
      console._error('Error sending test notification:', _error);
    }
  }
}
