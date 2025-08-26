/// <reference lib="dom" />
// Secure Push Notification Service
// Enhanced push notification service with security features and integrity validation

import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { Alarm } from '../types';
import { NotificationService } from './notification';
import SecurityService from './security';
import { ErrorHandler } from './error-handler';
import { TimeoutHandle } from '../types/timers';
import { ErrorHandler } from './error-handler';

export interface SecurePushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
  category?: string;
  // Security fields
  signature?: string;
  timestamp?: string;
  nonce?: string;
  userId?: string;
  sessionId?: string;
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
  // Security settings
  requireSignature: boolean;
  validateTimestamp: boolean;
  maxMessageAge: number; // in minutes
  blockSuspiciousSenders: boolean;
}

export interface SecurePushSubscription {
  token: string;
  platform: string;
  deviceId: string;
  registrationTime: Date;
  isActive: boolean;
  // Security fields
  encryptionKey?: string;
  lastValidated?: Date;
  trustLevel: 'trusted' | 'verified' | 'unverified';
  securityFlags: string[];
}

interface PushSecurityMetrics {
  totalReceived: number;
  validatedMessages: number;
  rejectedMessages: number;
  spoofingAttempts: number;
  lastSecurityEvent: Date | null;
  trustScore: number;
}

export class SecurePushNotificationService {
  private static instance: SecurePushNotificationService;
  private static isInitialized = false;
  private static hasPermission = false;
  private static currentToken: string | null = null;
  private static encryptionKey: string | null = null;
  private static sessionId: string | null = null;

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
    // Security defaults
    requireSignature: true,
    validateTimestamp: true,
    maxMessageAge: 10, // 10 minutes
    blockSuspiciousSenders: true,
  };

  private static securityMetrics: PushSecurityMetrics = {
    totalReceived: 0,
    validatedMessages: 0,
    rejectedMessages: 0,
    spoofingAttempts: 0,
    lastSecurityEvent: null,
    trustScore: 100,
  };

  private static trustedSenders: Set<string> = new Set();
  private static messageHistory: Map<string, Date> = new Map(); // For duplicate detection
  private static rateLimitMap: Map<string, number[]> = new Map(); // For rate limiting

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): SecurePushNotificationService {
    if (!this.instance) {
      this.instance = new SecurePushNotificationService();
    }
    return this.instance;
  }

  /**
   * Initialize secure push notification service
   */
  static async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return this.hasPermission;
    }

    try {
      console.log('Initializing secure push notification service...');

      // Generate session ID for this app session
      this.sessionId = SecurityService.generateCSRFToken();

      // Load saved settings and security data
      await this.loadSettings();
      await this.loadSecurityData();

      // Check if push notifications are supported
      if (!Capacitor.isNativePlatform() && !this.isWebPushSupported()) {
        console.warn('Push notifications not supported on this platform');
        return false;
      }

      // Request permissions
      this.hasPermission = await this.requestPermissions();

      if (this.hasPermission) {
        // Generate encryption key for this session
        await this.initializeEncryption();

        // Register for push notifications
        await this.registerForPush();

        // Setup secure listeners
        this.setupSecurePushListeners();

        // Initialize notification badge
        await this.updateBadgeCount(0);

        // Start security monitoring
        this.startSecurityMonitoring();
      }

      this.isInitialized = true;
      console.log(
        'Secure push notification service initialized, permission:',
        this.hasPermission
      );

      return this.hasPermission;
    } catch (_error) {
      console._error('Error initializing secure push notification service:', _error);
      return false;
    }
  }

  /**
   * Initialize encryption for push notifications
   */
  private static async initializeEncryption(): Promise<void> {
    try {
      // Generate or retrieve encryption key
      let key = await this.getStoredEncryptionKey();
      if (!key) {
        key = SecurityService.generateSecurePassword(32);
        await this.storeEncryptionKey(key);
      }
      this.encryptionKey = key;
    } catch (_error) {
      console.error('Failed to initialize push notification encryption:', _error);
      throw _error;
    }
  }

  /**
   * Enhanced push notification listeners with security validation
   */
  private static setupSecurePushListeners(): void {
    // Registration success
    PushNotifications.addListener('registration', async token => {
      console.log('Secure push registration success:', token.value);
      this.currentToken = token.value;
      await this.saveTokenToStorage(token.value);
      await this.sendTokenToServer(token.value);

      // Add to trusted senders
      this.trustedSenders.add('system');
    });

    // Registration error
    PushNotifications.addListener('registrationError', error => {
      console.error('Secure push registration error:', _error);
      this.logSecurityEvent('registration_error', { error: _error._error });
    });

    // Push notification received (foreground) - with security validation
    PushNotifications.addListener('pushNotificationReceived', async notification => {
      console.log('Secure push notification received:', notification);

      const validationResult = await this.validateNotificationSecurity(notification);
      if (validationResult.isValid) {
        this.handleSecurePushReceived(notification, validationResult);
      } else {
        this.handleSuspiciousNotification(notification, validationResult);
      }
    });

    // Push notification action performed - with security validation
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      async notification => {
        console.log('Secure push notification action:', notification);

        const validationResult = await this.validateNotificationSecurity(
          notification.notification
        );
        if (validationResult.isValid) {
          this.handleSecurePushAction(notification, validationResult);
        } else {
          this.handleSuspiciousNotification(
            notification.notification,
            validationResult
          );
        }
      }
    );
  }

  /**
   * Validate push notification security
   */
  private static async validateNotificationSecurity(notification: unknown): Promise<{
    isValid: boolean;
    reasons: string[];
    trustLevel: 'trusted' | 'suspicious' | 'malicious';
    metadata?: unknown;
  }> {
    const reasons: string[] = [];
    let trustLevel: 'trusted' | 'suspicious' | 'malicious' = 'trusted';

    try {
      this.securityMetrics.totalReceived++;

      const data = notification.data || {};
      const title = notification.title || '';
      const body = notification.body || '';

      // 1. Validate timestamp if enabled
      if (this.settings.validateTimestamp && data.timestamp) {
        const messageTime = new Date(data.timestamp);
        const now = new Date();
        const ageMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60);

        if (ageMinutes > this.settings.maxMessageAge) {
          reasons.push(`Message too old: ${ageMinutes.toFixed(1)} minutes`);
          trustLevel = 'suspicious';
        }

        if (messageTime > now) {
          reasons.push('Message from future');
          trustLevel = 'malicious';
        }
      }

      // 2. Validate signature if required
      if (this.settings.requireSignature && data.signature) {
        const payload = { title, body, ...data };
        delete payload.signature; // Remove signature from validation

        if (!SecurityService.verifyDataSignature(payload, data.signature)) {
          reasons.push('Invalid signature');
          trustLevel = 'malicious';
        }
      } else if (this.settings.requireSignature) {
        reasons.push('Missing required signature');
        trustLevel = 'suspicious';
      }

      // 3. Check for duplicate messages
      const messageHash = SecurityService.hashData(
        JSON.stringify({ title, body, timestamp: data.timestamp })
      );
      if (this.messageHistory.has(messageHash)) {
        const lastSeen = this.messageHistory.get(messageHash)!;
        const timeDiff = new Date().getTime() - lastSeen.getTime();
        if (timeDiff < 60000) {
          // Less than 1 minute ago
          reasons.push('Duplicate message detected');
          trustLevel = 'suspicious';
        }
      }
      this.messageHistory.set(messageHash, new Date());

      // 4. Validate sender if possible
      const senderId = data.senderId || data.userId || 'unknown';
      if (
        this.settings.blockSuspiciousSenders &&
        !this.trustedSenders.has(senderId) &&
        senderId !== 'unknown'
      ) {
        // Check sender reputation
        if (await this.isSuspiciousSender(senderId)) {
          reasons.push('Suspicious sender');
          trustLevel = 'suspicious';
        }
      }

      // 5. Validate session ID if present
      if (data.sessionId && data.sessionId !== this.sessionId) {
        reasons.push('Invalid session ID');
        trustLevel = 'suspicious';
      }

      // 6. Check for malicious content
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /data:text\/html/i,
        /on\w+\s*=/i,
      ];

      const textContent = title + ' ' + body;
      if (suspiciousPatterns.some(pattern => pattern.test(textContent))) {
        reasons.push('Malicious content detected');
        trustLevel = 'malicious';
      }

      // 7. Rate limiting check
      if (!this.checkNotificationRateLimit(senderId)) {
        reasons.push('Rate limit exceeded');
        trustLevel = 'suspicious';
      }

      // 8. Validate nonce to prevent replay attacks
      if (data.nonce) {
        if (!this.validateNonce(data.nonce)) {
          reasons.push('Invalid or reused nonce');
          trustLevel = 'malicious';
        }
      }

      const isValid = trustLevel === 'trusted';

      if (isValid) {
        this.securityMetrics.validatedMessages++;
      } else {
        this.securityMetrics.rejectedMessages++;
        if (trustLevel === 'malicious') {
          this.securityMetrics.spoofingAttempts++;
        }
      }

      return { isValid, reasons, trustLevel };
    } catch (_error) {
      console._error('Push notification security validation failed:', _error);
      this.securityMetrics.rejectedMessages++;
      return {
        isValid: false,
        reasons: ['Security validation failed'],
        trustLevel: 'malicious',
      };
    }
  }

  /**
   * Handle validated secure push notifications
   */
  private static handleSecurePushReceived(
    notification: unknown,
    validationResult: unknown
  ): void {
    console.log('Processing validated push notification:', notification);

    // Track notification received
    this.trackNotificationEvent('secure_received', notification);

    // Handle different notification types with enhanced security
    const data = notification.data || {};
    switch (data.type) {
      case 'alarm':
        this.handleSecureAlarmPush(notification);
        break;
      case 'motivation':
      case 'progress':
      case 'system':
        this.handleSecureGeneralPush(notification);
        break;
      case 'emergency':
        this.handleSecureEmergencyPush(notification);
        break;
      default:
        console.log('Unknown secure push notification type:', data.type);
    }
  }

  /**
   * Handle suspicious notifications
   */
  private static handleSuspiciousNotification(
    notification: unknown,
    validationResult: unknown
  ): void {
    console.warn('Suspicious push notification detected:', {
      notification,
      reasons: validationResult.reasons,
      trustLevel: validationResult.trustLevel,
    });

    this.securityMetrics.lastSecurityEvent = new Date();

    // Update trust score
    if (validationResult.trustLevel === 'malicious') {
      this.securityMetrics.trustScore = Math.max(
        0,
        this.securityMetrics.trustScore - 10
      );
    } else {
      this.securityMetrics.trustScore = Math.max(
        0,
        this.securityMetrics.trustScore - 5
      );
    }

    // Log security event
    this.logSecurityEvent('suspicious_push_notification', {
      title: notification.title,
      reasons: validationResult.reasons,
      trustLevel: validationResult.trustLevel,
      data: notification.data,
    });

    // Emit security event for monitoring
    window.dispatchEvent(
      new CustomEvent('push-security-violation', {
        detail: {
          notification,
          validationResult,
          timestamp: new Date(),
        },
      })
    );

    // Block sender if malicious
    if (validationResult.trustLevel === 'malicious') {
      const senderId = notification.data?.senderId || notification.data?.userId;
      if (senderId) {
        this.blockSender(senderId);
      }
    }
  }

  /**
   * Create secure push notification payload
   */
  static async createSecurePayload(
    basePayload: SecurePushNotificationPayload,
    userId?: string
  ): Promise<SecurePushNotificationPayload> {
    try {
      const securePayload: SecurePushNotificationPayload = {
        ...basePayload,
        timestamp: new Date().toISOString(),
        nonce: SecurityService.generateCSRFToken(),
        userId,
        sessionId: this.sessionId,
      };

      // Generate signature
      if (this.settings.requireSignature) {
        securePayload.signature = SecurityService.generateDataSignature(securePayload);
      }

      return securePayload;
    } catch (_error) {
      console.error('Failed to create secure payload:', _error);
      throw _error;
    }
  }

  /**
   * Schedule secure alarm push notification
   */
  static async scheduleSecureAlarmPush(alarm: Alarm, userId?: string): Promise<void> {
    if (!this.hasPermission || !this.settings.alarmReminders) {
      return;
    }

    try {
      const basePayload: SecurePushNotificationPayload = {
        title: `🔔 ${alarm.label}`,
        body: 'Your secure alarm is ready to wake you up!',
        data: {
          type: 'alarm',
          alarmId: alarm.id,
          action: 'trigger',
          priority: 'high',
        },
        badge: 1,
        sound: 'alarm.wav',
        category: 'alarm',
      };

      const securePayload = await this.createSecurePayload(basePayload, userId);
      await this.sendSecurePushToServer(
        securePayload,
        this.getAlarmScheduleTime(alarm)
      );

      this.logSecurityEvent('secure_alarm_push_scheduled', {
        alarmId: alarm.id,
        userId,
        hasSignature: !!securePayload.signature,
      });
    } catch (_error) {
      console._error('Error scheduling secure alarm push:', _error);
    }
  }

  /**
   * Send secure emergency alert
   */
  static async sendSecureEmergencyAlert(
    title: string,
    message: string,
    userId?: string
  ): Promise<void> {
    if (!this.hasPermission || !this.settings.emergencyAlerts) {
      return;
    }

    try {
      const basePayload: SecurePushNotificationPayload = {
        title: `🚨 ${title}`,
        body: message,
        data: {
          type: 'emergency',
          action: 'urgent',
          priority: 'critical',
        },
        badge: 1,
        sound: 'emergency.wav',
        category: 'emergency',
      };

      const securePayload = await this.createSecurePayload(basePayload, userId);
      await this.sendSecurePushToServer(securePayload);

      this.logSecurityEvent('secure_emergency_alert_sent', {
        title,
        userId,
        hasSignature: !!securePayload.signature,
      });
    } catch (_error) {
      console._error('Error sending secure emergency alert:', _error);
    }
  }

  /**
   * Start security monitoring for push notifications
   */
  private static startSecurityMonitoring(): void {
    // Clean up old message history every 5 minutes
    setInterval(
      () => {
        this.cleanupMessageHistory();
      },
      5 * 60 * 1000
    );

    // Reset rate limits every hour
    setInterval(
      () => {
        this.rateLimitMap.clear();
      },
      60 * 60 * 1000
    );

    // Monitor trust score and adjust security settings
    setInterval(
      () => {
        this.adjustSecuritySettings();
      },
      10 * 60 * 1000
    ); // Every 10 minutes
  }

  /**
   * Security helper methods
   */

  private static async isSuspiciousSender(senderId: string): Promise<boolean> {
    // Simple reputation check - could be enhanced with server-side data
    const rateLimit = this.rateLimitMap.get(senderId) || [];
    return rateLimit.length > 20; // More than 20 messages in the rate limit window
  }

  private static checkNotificationRateLimit(senderId: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxMessages = 10; // Max 10 messages per minute per sender

    let timestamps = this.rateLimitMap.get(senderId) || [];
    timestamps = timestamps.filter(time => now - time < windowMs);

    if (timestamps.length >= maxMessages) {
      return false;
    }

    timestamps.push(now);
    this.rateLimitMap.set(senderId, timestamps);
    return true;
  }

  private static validateNonce(nonce: string): boolean {
    // Simple nonce validation - in production, you'd store used nonces
    // For now, just check if it's a valid format
    return nonce && nonce.length >= 16;
  }

  private static blockSender(senderId: string): void {
    console.log(`Blocking suspicious sender: ${senderId}`);
    // In production, this would update server-side block list
    this.logSecurityEvent('sender_blocked', { senderId });
  }

  private static cleanupMessageHistory(): void {
    const maxAge = 60 * 60 * 1000; // 1 hour
    const now = new Date().getTime();

    for (const [hash, timestamp] of this.messageHistory.entries()) {
      if (now - timestamp.getTime() > maxAge) {
        this.messageHistory.delete(hash);
      }
    }
  }

  private static adjustSecuritySettings(): void {
    // Adjust security based on trust score
    if (this.securityMetrics.trustScore < 50) {
      // Low trust - increase security
      this.settings.requireSignature = true;
      this.settings.validateTimestamp = true;
      this.settings.maxMessageAge = 5; // Stricter time window
      this.settings.blockSuspiciousSenders = true;
    } else if (this.securityMetrics.trustScore > 90) {
      // High trust - can relax some settings
      this.settings.maxMessageAge = 15; // More lenient time window
    }
  }

  private static async getStoredEncryptionKey(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: 'push_encryption_key' });
      return value;
    } catch {
      return null;
    }
  }

  private static async storeEncryptionKey(key: string): Promise<void> {
    try {
      await Preferences.set({ key: 'push_encryption_key', value: key });
    } catch (_error) {
      console._error('Failed to store push encryption key:', _error);
    }
  }

  private static async loadSecurityData(): Promise<void> {
    try {
      // Load trusted senders
      const { value: trustedData } = await Preferences.get({
        key: 'trusted_push_senders',
      });
      if (trustedData) {
        const trusted = JSON.parse(trustedData);
        this.trustedSenders = new Set(trusted);
      }

      // Load security metrics
      const { value: metricsData } = await Preferences.get({
        key: 'push_security_metrics',
      });
      if (metricsData) {
        const metrics = JSON.parse(metricsData);
        this.securityMetrics = { ...this.securityMetrics, ...metrics };
      }
    } catch (_error) {
      console._error('Failed to load push security data:', _error);
    }
  }

  private static async saveSecurityData(): Promise<void> {
    try {
      await Preferences.set({
        key: 'trusted_push_senders',
        value: JSON.stringify(Array.from(this.trustedSenders)),
      });

      await Preferences.set({
        key: 'push_security_metrics',
        value: JSON.stringify(this.securityMetrics),
      });
    } catch (_error) {
      console._error('Failed to save push security data:', _error);
    }
  }

  // Enhanced secure handlers
  private static handleSecureAlarmPush(notification: unknown): void {
    const alarmId = notification.data?.alarmId;
    if (alarmId) {
      window.dispatchEvent(
        new CustomEvent('secure-alarm-triggered', {
          detail: { alarmId, source: 'secure_push', notification },
        })
      );
    }
  }

  private static handleSecureGeneralPush(notification: unknown): void {
    // Handle general secure notifications
    console.log('Secure general push notification processed');
  }

  private static handleSecureEmergencyPush(notification: unknown): void {
    // Emergency notifications bypass some security checks but are still validated
    NotificationService.showNotification({
      title: notification.title,
      body: notification.body,
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500],
    });
  }

  private static handleSecurePushAction(
    notification: unknown,
    validationResult: unknown
  ): void {
    // Handle secure push actions
    const action = notification.actionId;
    const data = notification.notification.data;

    // All the same action handling as before, but with validation
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
        this.handleDefaultAction(data);
    }
  }

  // Inherit all the original methods from PushNotificationService
  static async updateSettings(
    newSettings: Partial<PushNotificationSettings>
  ): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();

    // Save security data when settings change
    await this.saveSecurityData();
  }

  static getSecurityMetrics(): PushSecurityMetrics {
    return { ...this.securityMetrics };
  }

  static async testSecurePushNotification(userId?: string): Promise<void> {
    const basePayload: SecurePushNotificationPayload = {
      title: '🔒 Secure Test Notification',
      body: 'This is a secure test push notification with integrity validation!',
      data: {
        type: 'test',
        action: 'view',
      },
      badge: 1,
    };

    const securePayload = await this.createSecurePayload(basePayload, userId);
    await this.sendSecurePushToServer(securePayload);
  }

  // Helper methods (continuing from original service)
  private static logSecurityEvent(_event: string, details: unknown): void {
    const logEntry = {
      event,
      details,
      timestamp: new Date().toISOString(),
      source: 'SecurePushNotificationService',
    };

    console.log('[PUSH SECURITY LOG]', logEntry);

    window.dispatchEvent(
      new CustomEvent('push-security-log', {
        detail: logEntry,
      })
    );
  }

  private static trackNotificationEvent(_event: string, data: unknown): void {
    window.dispatchEvent(
      new CustomEvent('secure-notification-analytics', {
        detail: { _event, data, timestamp: new Date() },
      })
    );
  }

  // Placeholder methods that would integrate with existing service
  private static isWebPushSupported(): boolean {
    return false;
  }
  private static async requestPermissions(): Promise<boolean> {
    return false;
  }
  private static async registerForPush(): Promise<void> {}
  private static async sendSecurePushToServer(
    payload: SecurePushNotificationPayload,
    scheduleTime?: Date
  ): Promise<void> {}
  private static async saveTokenToStorage(token: string): Promise<void> {}
  private static async sendTokenToServer(token: string): Promise<void> {}
  private static async updateBadgeCount(count: number): Promise<void> {}
  private static async loadSettings(): Promise<void> {}
  private static async saveSettings(): Promise<void> {}
  private static getAlarmScheduleTime(alarm: Alarm): Date {
    return new Date();
  }
  private static handleDismissAction(data: unknown): void {}
  private static handleSnoozeAction(data: unknown): void {}
  private static handleViewAction(data: unknown): void {}
  private static handleDefaultAction(data: unknown): void {}
  private setupEventListeners(): void {}
}

export default SecurePushNotificationService.getInstance();
