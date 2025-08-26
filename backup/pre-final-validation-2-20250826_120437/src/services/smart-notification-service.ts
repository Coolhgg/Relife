/// <reference lib="dom" />
import { Capacitor } from '@capacitor/core';
import { TimeoutHandle } from '../types/timers';
import {
  // auto: restored by scout - verify import path
  // Note: alarmOrNotification should be defined as local type
  // auto: restored by scout - verify import path
  // Note: alarmOrNotification should be defined as local type
  LocalNotifications,
  ScheduleOptions,
  DeliveredNotifications,
} from '@capacitor/local-notifications';

/**
 * Smart Notification System with Adaptive Timing
 *
 * Features:
 * - Adaptive notification timing based on user behavior
 * - Context-aware notifications (Do Not Disturb integration)
 * - Progressive notification escalation
 * - Battery-optimized scheduling
 * - Sleep schedule integration
 * - Location-based notification adjustments
 */

export interface NotificationContext {
  userActivity: 'active' | 'idle' | 'sleeping' | 'driving' | 'meeting';
  batteryLevel: number;
  isCharging: boolean;
  doNotDisturb: boolean;
  location?: {
    isHome: boolean;
    isWork: boolean;
    isMoving: boolean;
  };
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  connectivity: 'online' | 'offline';
}

export interface SmartNotificationConfig {
  adaptiveEnabled: boolean;
  respectDoNotDisturb: boolean;
  batteryOptimization: boolean;
  locationAware: boolean;
  progressiveEscalation: boolean;
  sleepScheduleIntegration: boolean;
  maxNotificationsPerHour: number;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
  emergencyOverride: boolean;
  vibrationPatterns: {
    gentle: number[];
    normal: number[];
    urgent: number[];
  };
  soundProfiles: {
    morning: string;
    work: string;
    evening: string;
    night: string;
  };
}

export interface AdaptiveNotification {
  id: string;
  type: 'alarm' | 'reminder' | 'optimization' | 'insight' | 'emergency';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  body: string;
  scheduledTime: Date;
  adaptedTime?: Date;
  context: NotificationContext;
  escalationLevel: number;
  maxEscalations: number;
  isDelivered: boolean;
  deliveryAttempts: number;
  adaptationReason?: string;
  userResponse?: 'dismissed' | 'snoozed' | 'ignored';
  responseTime?: number;
}

class SmartNotificationService {
  private static instance: SmartNotificationService;
  private isInitialized = false;
  private _config: SmartNotificationConfig;
  private scheduledNotifications: Map<string, AdaptiveNotification> = new Map();
  private userBehaviorPatterns: Map<string, unknown> = new Map();
  private currentContext: NotificationContext;
  private adaptationHistory: Array<{
    originalTime: Date;
    adaptedTime: Date;
    reason: string;
    effectiveness: number;
    timestamp: Date;
  }> = [];

  private constructor() {
    this._config = this.getDefaultConfig();
    this.currentContext = this.getDefaultContext();
  }

  public static getInstance(): SmartNotificationService {
    if (!SmartNotificationService.instance) {
      SmartNotificationService.instance = new SmartNotificationService();
    }
    return SmartNotificationService.instance;
  }

  /**
   * Initialize the smart notification system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (Capacitor.isNativePlatform()) {
        // Request notification permissions
        const permResult = await LocalNotifications.requestPermissions();
        if (permResult.display !== 'granted') {
          throw new Error('Notification permissions not granted');
        }

        // Set up notification listeners
        await LocalNotifications.addListener(
          'localNotificationReceived',
          notification => {
            this.handleNotificationReceived(notification);
          }
        );

        await LocalNotifications.addListener(
          'localNotificationActionPerformed',
          action => {
            this.handleNotificationAction(action);
          }
        );
      }

      // Load saved configuration and patterns
      await this.loadConfiguration();
      await this.loadUserBehaviorPatterns();

      // Start context monitoring
      this.startContextMonitoring();

      this.isInitialized = true;
    } catch (_error) {
      console.error('Failed to initialize SmartNotificationService:', _error);
      throw _error;
    }
  }

  /**
   * Schedule a smart notification with adaptive timing
   */
  public async scheduleAdaptiveNotification(
    baseTime: Date,
    type: 'alarm' | 'reminder' | 'optimization' | 'insight' = 'alarm'
  ): Promise<string> {
    const notificationId = `smart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const notification: AdaptiveNotification = {
      id: notificationId,
      type,
      priority: type === 'alarm' ? 'urgent' : 'normal',
      title: this.generateTitle(alarmOrNotification, type),
      body: this.generateBody(alarmOrNotification, type),
      scheduledTime: baseTime,
      context: await this.getCurrentContext(),
      escalationLevel: 0,
      maxEscalations: type === 'alarm' ? 5 : 2,
      isDelivered: false,
      deliveryAttempts: 0,
      ...('id' in alarmOrNotification ? {} : alarmOrNotification),
    };

    // Apply adaptive timing
    const adaptedTime = await this.calculateAdaptiveTime(notification);
    notification.adaptedTime = adaptedTime;

    // Store the notification
    this.scheduledNotifications.set(notificationId, notification);

    // Schedule the platform notification
    await this.scheduleNativeNotification(notification);

    // Save state
    await this.saveScheduledNotifications();

    return notificationId;
  }

  /**
   * Calculate adaptive timing based on context and user patterns
   */
  private async calculateAdaptiveTime(
    notification: AdaptiveNotification
  ): Promise<Date> {
    let adaptedTime = new Date(notification.scheduledTime);
    const adaptations: string[] = [];

    if (!this._config.adaptiveEnabled) {
      return adaptedTime;
    }

    // 1. Respect quiet hours
    if (this.isInQuietHours(adaptedTime)) {
      if (notification.priority === 'urgent' && this._config.emergencyOverride) {
        adaptations.push('Emergency override - quiet hours ignored');
      } else {
        const quietEnd = this.parseTimeString(this._config.quietHoursEnd);
        adaptedTime = new Date(adaptedTime);
        adaptedTime.setHours(quietEnd.hours, quietEnd.minutes, 0, 0);
        if (adaptedTime < notification.scheduledTime) {
          adaptedTime.setDate(adaptedTime.getDate() + 1);
        }
        adaptations.push(
          `Delayed to after quiet hours (${this._config.quietHoursEnd})`
        );
      }
    }

    // 2. Check Do Not Disturb
    if (this._config.respectDoNotDisturb && notification.context.doNotDisturb) {
      if (notification.priority !== 'urgent') {
        adaptedTime = new Date(adaptedTime.getTime() + 30 * 60 * 1000); // Delay by 30 minutes
        adaptations.push('Delayed due to Do Not Disturb mode');
      }
    }

    // 3. Battery optimization
    if (
      this._config.batteryOptimization &&
      notification.context.batteryLevel < 20 &&
      !notification.context.isCharging
    ) {
      if (notification.type !== 'alarm') {
        adaptedTime = new Date(adaptedTime.getTime() + 15 * 60 * 1000); // Delay by 15 minutes
        adaptations.push('Delayed for battery optimization');
      }
    }

    // 4. User activity context
    const activityAdjustment = this.getActivityBasedAdjustment(
      notification.context.userActivity,
      notification.type
    );
    if (activityAdjustment !== 0) {
      adaptedTime = new Date(adaptedTime.getTime() + activityAdjustment);
      adaptations.push(
        `Adjusted ${activityAdjustment > 0 ? '+' : ''}${Math.round(activityAdjustment / 60000)} min for ${notification.context.userActivity} activity`
      );
    }

    // 5. Location-based adjustments
    if (this._config.locationAware && notification.context.location) {
      const locationAdjustment = this.getLocationBasedAdjustment(
        notification.context.location,
        notification.type
      );
      if (locationAdjustment !== 0) {
        adaptedTime = new Date(adaptedTime.getTime() + locationAdjustment);
        adaptations.push(
          `Location-based adjustment: ${Math.round(locationAdjustment / 60000)} min`
        );
      }
    }

    // 6. Historical pattern analysis
    const patternAdjustment = this.getPatternBasedAdjustment(notification);
    if (patternAdjustment !== 0) {
      adaptedTime = new Date(adaptedTime.getTime() + patternAdjustment);
      adaptations.push(
        `Pattern-based adjustment: ${Math.round(patternAdjustment / 60000)} min`
      );
    }

    // 7. Rate limiting
    const rateLimitAdjustment = await this.getRateLimitAdjustment(adaptedTime);
    if (rateLimitAdjustment !== 0) {
      adaptedTime = new Date(adaptedTime.getTime() + rateLimitAdjustment);
      adaptations.push(
        `Rate limit adjustment: ${Math.round(rateLimitAdjustment / 60000)} min`
      );
    }

    // Store adaptation reasoning
    if (adaptations.length > 0) {
      notification.adaptationReason = adaptations.join('; ');
      this.recordAdaptation(
        notification.scheduledTime,
        adaptedTime,
        notification.adaptationReason
      );
    }

    return adaptedTime;
  }

  /**
   * Get activity-based timing adjustments
   */
  private getActivityBasedAdjustment(activity: string, type: string): number {
    const adjustments: Record<string, Record<string, number>> = {
      sleeping: {
        alarm: 0, // Never delay alarms for sleep
        reminder: 4 * 60 * 60 * 1000, // 4 hours delay
        optimization: 8 * 60 * 60 * 1000, // 8 hours delay
        insight: 8 * 60 * 60 * 1000,
      },
      driving: {
        alarm: 0,
        reminder: 15 * 60 * 1000, // 15 minutes delay
        optimization: 30 * 60 * 1000, // 30 minutes delay
        insight: 30 * 60 * 1000,
      },
      meeting: {
        alarm: 0,
        reminder: 60 * 60 * 1000, // 1 hour delay
        optimization: 2 * 60 * 60 * 1000, // 2 hours delay
        insight: 2 * 60 * 60 * 1000,
      },
      active: {
        alarm: 0,
        reminder: 0,
        optimization: 0,
        insight: 0,
      },
      idle: {
        alarm: 0,
        reminder: 0,
        optimization: -5 * 60 * 1000, // Deliver 5 minutes earlier when idle
        insight: -5 * 60 * 1000,
      },
    };

    return adjustments[activity]?.[type] || 0;
  }

  /**
   * Get location-based timing adjustments
   */
  private getLocationBasedAdjustment(location: unknown, type: string): number {
    let adjustment = 0;

    // Deliver earlier when moving (might lose connectivity)
    if (location.isMoving && type !== 'alarm') {
      adjustment -= 10 * 60 * 1000; // 10 minutes earlier
    }

    // Adjust based on location type
    if (location.isWork && type === 'optimization') {
      adjustment += 30 * 60 * 1000; // Delay optimization notifications at work
    }

    if (location.isHome && type === 'insight') {
      adjustment -= 5 * 60 * 1000; // Deliver insights earlier at home
    }

    return adjustment;
  }

  /**
   * Get pattern-based adjustments using historical data
   */
  private getPatternBasedAdjustment(notification: AdaptiveNotification): number {
    const patternKey = `${notification.type}_${notification.context.timeOfDay}`;
    const pattern = this.userBehaviorPatterns.get(patternKey);

    if (!pattern || pattern.samples < 5) {
      return 0; // Need at least 5 samples for pattern analysis
    }

    // Calculate optimal timing based on user response patterns
    const optimalDelay = pattern.averageResponseTime - pattern.averageDeliveryDelay;
    return Math.max(-30 * 60 * 1000, Math.min(30 * 60 * 1000, optimalDelay));
  }

  /**
   * Check rate limiting and adjust timing
   */
  private async getRateLimitAdjustment(proposedTime: Date): Promise<number> {
    const hourStart = new Date(proposedTime);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourEnd.getHours() + 1);

    const notificationsInHour = Array.from(this.scheduledNotifications.values()).filter(
      n => {
        const time = n.adaptedTime || n.scheduledTime;
        return time >= hourStart && time < hourEnd && !n.isDelivered;
      }
    );

    if (notificationsInHour.length >= this._config.maxNotificationsPerHour) {
      // Find next available slot
      const nextSlot = new Date(hourEnd);
      return nextSlot.getTime() - proposedTime.getTime();
    }

    return 0;
  }

  /**
   * Schedule native platform notification
   */
  private async scheduleNativeNotification(
    notification: AdaptiveNotification
  ): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Web notification scheduling not implemented');
      return;
    }

    const deliveryTime = notification.adaptedTime || notification.scheduledTime;
    const vibrationPattern = this.getVibrationPattern(notification.priority);
    const soundProfile = this.getSoundProfile(notification.context.timeOfDay);

    const scheduleOptions: ScheduleOptions = {
      notifications: [
        {
          title: notification.title,
          body: notification.body,
          id:
            parseInt(notification.id.replace(/[^0-9]/g, '').slice(-8)) ||
            Math.floor(Math.random() * 1000000),
          schedule: { at: deliveryTime },
          sound: soundProfile,
          attachments:
            notification.type === 'alarm'
              ? [{ id: 'alarm', url: 'public/sounds/alarm.wav' }]
              : undefined,
          actionTypeId: notification.type,
          extra: {
            notificationId: notification.id,
            type: notification.type,
            priority: notification.priority,
            escalationLevel: notification.escalationLevel,
          },
        },
      ],
    };

    await LocalNotifications.schedule(scheduleOptions);
  }

  /**
   * Handle progressive notification escalation
   */
  private async escalateNotification(notificationId: string): Promise<void> {
    const notification = this.scheduledNotifications.get(notificationId);
    if (!notification || notification.escalationLevel >= notification.maxEscalations) {
      return;
    }

    notification.escalationLevel++;
    notification.priority = this.getEscalatedPriority(notification.priority);

    // Schedule next escalation
    const escalationDelay = this.getEscalationDelay(
      notification.escalationLevel,
      notification.type
    );
    const nextTime = new Date(Date.now() + escalationDelay);

    await this.scheduleNativeNotification({
      ...notification,
      scheduledTime: nextTime,
      title: `${notification.title} (${notification.escalationLevel}/${notification.maxEscalations})`,
      body:
        notification.escalationLevel === notification.maxEscalations
          ? `${notification.body} - Final reminder!`
          : `${notification.body} - Reminder ${notification.escalationLevel}`,
    });
  }

  /**
   * Monitor device context for adaptive notifications
   */
  private startContextMonitoring(): void {
    // Update context every 5 minutes
    setInterval(
      async () => {
        this.currentContext = await this.getCurrentContext();
      },
      5 * 60 * 1000
    );

    // Monitor device events
    document.addEventListener('visibilitychange', () => {
      this.currentContext.userActivity = document.hidden ? 'idle' : 'active';
    });

    // Battery monitoring (if supported)
    if ('getBattery' in navigator) {
      (navigator as unknown).getBattery().then((battery: unknown) => {
        const updateBatteryInfo = () => {
          this.currentContext.batteryLevel = Math.round(battery.level * 100);
          this.currentContext.isCharging = battery.charging;
        };

        updateBatteryInfo();
        battery.addEventListener('chargingchange', updateBatteryInfo);
        battery.addEventListener('levelchange', updateBatteryInfo);
      });
    }
  }

  /**
   * Record user behavior for pattern analysis
   */
  public recordUserResponse(
    notificationId: string,
    response: 'dismissed' | 'snoozed' | 'ignored',
    responseTime: number
  ): void {
    const notification = this.scheduledNotifications.get(notificationId);
    if (!notification) return;

    notification.userResponse = response;
    notification.responseTime = responseTime;

    // Update behavior patterns
    const patternKey = `${notification.type}_${notification.context.timeOfDay}`;
    const existingPattern = this.userBehaviorPatterns.get(patternKey) || {
      samples: 0,
      averageResponseTime: 0,
      averageDeliveryDelay: 0,
      dismissalRate: 0,
      snoozeRate: 0,
      ignoreRate: 0,
    };

    const newSamples = existingPattern.samples + 1;
    const deliveryDelay =
      (notification.adaptedTime || notification.scheduledTime).getTime() -
      notification.scheduledTime.getTime();

    existingPattern.samples = newSamples;
    existingPattern.averageResponseTime =
      (existingPattern.averageResponseTime * (newSamples - 1) + responseTime) /
      newSamples;
    existingPattern.averageDeliveryDelay =
      (existingPattern.averageDeliveryDelay * (newSamples - 1) + deliveryDelay) /
      newSamples;

    // Update response rates
    const responses = { dismissed: 0, snoozed: 0, ignored: 0 };
    responses[response] = 1;

    existingPattern.dismissalRate =
      (existingPattern.dismissalRate * (newSamples - 1) + responses.dismissed) /
      newSamples;
    existingPattern.snoozeRate =
      (existingPattern.snoozeRate * (newSamples - 1) + responses.snoozed) / newSamples;
    existingPattern.ignoreRate =
      (existingPattern.ignoreRate * (newSamples - 1) + responses.ignored) / newSamples;

    this.userBehaviorPatterns.set(patternKey, existingPattern);
    this.saveUserBehaviorPatterns();
  }

  /**
   * Get adaptive notification statistics
   */
  public getAdaptiveStats(): any {
    const total = this.scheduledNotifications.size;
    const adapted = Array.from(this.scheduledNotifications.values()).filter(
      n => n.adaptedTime
    ).length;
    const delivered = Array.from(this.scheduledNotifications.values()).filter(
      n => n.isDelivered
    ).length;

    const responseRates = {
      dismissed: 0,
      snoozed: 0,
      ignored: 0,
    };

    let totalResponses = 0;
    this.scheduledNotifications.forEach(n => {
      if (n.userResponse) {
        responseRates[n.userResponse]++;
        totalResponses++;
      }
    });

    Object.keys(responseRates).forEach(key => {
      responseRates[key as keyof typeof responseRates] =
        totalResponses > 0
          ? (responseRates[key as keyof typeof responseRates] / totalResponses) * 100
          : 0;
    });

    return {
      total,
      adapted,
      adaptationRate: total > 0 ? (adapted / total) * 100 : 0,
      delivered,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      responseRates,
      patternCount: this.userBehaviorPatterns.size,
      adaptationHistory: this.adaptationHistory.length,
    };
  }

  /**
   * Update configuration
   */
  public async updateConfig(_config: Partial<SmartNotificationConfig>): Promise<void> {
    this.config = { ...this.config, ..._config };
    await this.saveConfiguration();
  }

  /**
   * Helper methods
   */
  private generateTitle(alarm: unknown, type: string): string {
    if (type === 'alarm' && 'label' in alarm) {
      return `⏰ ${alarm.label}`;
    }

    const titles = {
      alarm: '⏰ Wake Up Time!',
      reminder: '🔔 Reminder',
      optimization: '💡 Smart Suggestion',
      insight: '📊 Sleep Insight',
    };

    return titles[type] || '🔔 Notification';
  }

  private generateBody(alarm: unknown, type: string): string {
    if (type === 'alarm' && 'label' in alarm) {
      return `Time to wake up! ${alarm.label}`;
    }

    const bodies = {
      alarm: 'Good morning! Time to start your day.',
      reminder: 'You have a scheduled reminder.',
      optimization: 'We found a way to improve your sleep schedule.',
      insight: "Here's what we learned about your sleep patterns.",
    };

    return bodies[type] || 'You have a new notification.';
  }

  private getVibrationPattern(priority: string): number[] {
    return (
      this.config.vibrationPatterns[
        priority as keyof typeof this._config.vibrationPatterns
      ] || this._config.vibrationPatterns.normal
    );
  }

  private getSoundProfile(timeOfDay: string): string {
    return (
      this.config.soundProfiles[timeOfDay as keyof typeof this._config.soundProfiles] ||
      this._config.soundProfiles.morning
    );
  }

  private isInQuietHours(time: Date): boolean {
    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    const start = this.config.quietHoursStart;
    const end = this.config.quietHoursEnd;

    if (start < end) {
      return timeStr >= start && timeStr <= end;
    } else {
      return timeStr >= start || timeStr <= end;
    }
  }

  private parseTimeString(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  private getEscalatedPriority(
    currentPriority: string
  ): 'low' | 'normal' | 'high' | 'urgent' {
    const escalation = {
      low: 'normal',
      normal: 'high',
      high: 'urgent',
      urgent: 'urgent',
    };
    return escalation[currentPriority as keyof typeof escalation] as unknown;
  }

  private getEscalationDelay(level: number, type: string): number {
    const baseDelays = {
      alarm: [5 * 60 * 1000, 10 * 60 * 1000, 15 * 60 * 1000], // 5, 10, 15 minutes
      reminder: [30 * 60 * 1000, 60 * 60 * 1000], // 30 minutes, 1 hour
      optimization: [4 * 60 * 60 * 1000], // 4 hours
      insight: [24 * 60 * 60 * 1000], // 24 hours
    };

    const delays = baseDelays[type] || baseDelays.reminder;
    return delays[Math.min(level - 1, delays.length - 1)] || delays[delays.length - 1];
  }

  private recordAdaptation(
    originalTime: Date,
    adaptedTime: Date,
    reason: string
  ): void {
    this.adaptationHistory.push({
      originalTime,
      adaptedTime,
      reason,
      effectiveness: 0, // Will be updated when _user responds
      timestamp: new Date(),
    });

    // Keep only last 1000 adaptations
    if (this.adaptationHistory.length > 1000) {
      this.adaptationHistory = this.adaptationHistory.slice(-1000);
    }
  }

  private async getCurrentContext(): Promise<NotificationContext> {
    // This would integrate with device APIs in a real implementation
    const now = new Date();
    const hour = now.getHours();

    return {
      userActivity: document.hidden ? 'idle' : 'active',
      batteryLevel: this.currentContext?.batteryLevel || 100,
      isCharging: this.currentContext?.isCharging || false,
      doNotDisturb: false, // Would integrate with system DND
      timeOfDay:
        hour < 12
          ? 'morning'
          : hour < 17
            ? 'afternoon'
            : hour < 21
              ? 'evening'
              : 'night',
      connectivity: navigator.onLine ? 'online' : 'offline',
    };
  }

  private getDefaultConfig(): SmartNotificationConfig {
    return {
      adaptiveEnabled: true,
      respectDoNotDisturb: true,
      batteryOptimization: true,
      locationAware: true,
      progressiveEscalation: true,
      sleepScheduleIntegration: true,
      maxNotificationsPerHour: 3,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      emergencyOverride: true,
      vibrationPatterns: {
        gentle: [500, 200, 500],
        normal: [1000, 500, 1000],
        urgent: [500, 200, 500, 200, 1000, 300, 1000],
      },
      soundProfiles: {
        morning: 'gentle_wake',
        work: 'professional',
        evening: 'soft_chime',
        night: 'quiet_tone',
      },
    };
  }

  private getDefaultContext(): NotificationContext {
    return {
      userActivity: 'active',
      batteryLevel: 100,
      isCharging: false,
      doNotDisturb: false,
      timeOfDay: 'morning',
      connectivity: 'online',
    };
  }

  // Notification event handlers
  private handleNotificationReceived(notification: unknown): void {
    const adaptiveNotification = this.scheduledNotifications.get(
      notification.extra?.notificationId
    );
    if (adaptiveNotification) {
      adaptiveNotification.isDelivered = true;
      adaptiveNotification.deliveryAttempts++;
    }
  }

  private handleNotificationAction(action: unknown): void {
    const notificationId = action.notification.extra?.notificationId;
    if (notificationId) {
      const responseTime = Date.now() - action.notification.schedule.at.getTime();

      let response: 'dismissed' | 'snoozed' | 'ignored' = 'dismissed';
      if (action.actionId === 'snooze') {
        response = 'snoozed';
      }

      this.recordUserResponse(notificationId, response, responseTime);

      if (response === 'snoozed') {
        this.scheduleSnooze(notificationId);
      }
    }
  }

  private async scheduleSnooze(notificationId: string): Promise<void> {
    const notification = this.scheduledNotifications.get(notificationId);
    if (!notification) return;

    const snoozeTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes default

    await this.scheduleNativeNotification({
      ...notification,
      scheduledTime: snoozeTime,
      title: `${notification.title} (Snoozed)`,
      escalationLevel: Math.min(
        notification.escalationLevel + 1,
        notification.maxEscalations
      ),
    });
  }

  // Persistence methods
  private async saveConfiguration(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('smart_notification_config', JSON.stringify(this._config));
    }
  }

  private async loadConfiguration(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('smart_notification_config');
      if (saved) {
        this.config = { ...this._config, ...JSON.parse(saved) };
      }
    }
  }

  private async saveUserBehaviorPatterns(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      const patterns = Object.fromEntries(this.userBehaviorPatterns);
      localStorage.setItem('notification_behavior_patterns', JSON.stringify(patterns));
    }
  }

  private async loadUserBehaviorPatterns(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('notification_behavior_patterns');
      if (saved) {
        const patterns = JSON.parse(saved);
        this.userBehaviorPatterns = new Map(Object.entries(patterns));
      }
    }
  }

  private async saveScheduledNotifications(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      const notifications = Object.fromEntries(this.scheduledNotifications);
      localStorage.setItem(
        'scheduled_adaptive_notifications',
        JSON.stringify(notifications, (key, value) => {
          if (value instanceof Date) {
            return { __type: 'Date', value: value.toISOString() };
          }
          return value;
        })
      );
    }
  }
}

export default SmartNotificationService;
