/**
 * Push Notification Types for Real-time Notifications
 * Comprehensive typing for push notifications, service worker messaging, and notification actions
 */

// ===============================
// PUSH NOTIFICATION CORE TYPES
// ===============================

export type NotificationPriority = 'min' | 'low' | 'default' | 'high' | 'max';
export type NotificationCategory =
  | 'alarm'
  | 'motivation'
  | 'progress'
  | 'system'
  | 'emergency'
  | 'social'
  | 'promotional';

export type NotificationActionType =
  | 'dismiss'
  | 'snooze'
  | 'view'
  | 'settings'
  | 'respond'
  | 'quick_reply'
  | 'open_app'
  | 'share'
  | 'feedback';

// Base notification structure
export interface PushNotificationBase {
  id: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  timestamp: Date;
  ttl: number; // time to live in seconds
  requireInteraction?: boolean;
  silent?: boolean;
  renotify?: boolean;
  tag?: string; // for grouping/replacing notifications
  vibrate?: number[]; // vibration pattern
  sound?: string; // custom sound file
  userId: string;
  sessionId?: string;
}

// Notification actions
export interface NotificationAction {
  action: NotificationActionType;
  title: string;
  icon?: string;
  type?: 'button' | 'text'; // text for input responses
  placeholder?: string; // for text inputs
}

// Complete push notification payload
export interface PushNotification extends PushNotificationBase {
  data: NotificationDataPayload;
  actions: NotificationAction[];
}

// ===============================
// NOTIFICATION DATA PAYLOADS
// ===============================

export interface AlarmNotificationData {
  type: 'alarm';
  alarmId: string;
  alarmLabel: string;
  alarmTime: string;
  snoozeCount: number;
  maxSnoozes: number;
  voiceEnabled: boolean;
  challengeEnabled: boolean;
  emergencyMode?: boolean;
  locationContext?: {
    isHome: boolean;
    weatherCondition?: string;
    timeZone: string;
  };
}

export interface MotivationNotificationData {
  type: 'motivation';
  motivationType:
    | 'daily_encouragement'
    | 'streak_celebration'
    | 'goal_reminder'
    | 'achievement_unlock';
  personalizedMessage: string;
  streakCount?: number;
  achievementId?: string;
  goalProgress?: {
    current: number;
    target: number;
    percentage: number;
  };
  voiceMoodContext?: {
    recentMood: string;
    suggestedTone: 'energetic' | 'calm' | 'encouraging' | 'humorous';
  };
}

export interface ProgressNotificationData {
  type: 'progress';
  reportType: 'weekly_summary' | 'monthly_review' | 'habit_milestone' | 'trend_alert';
  metrics: {
    wakeUpSuccess: number; // percentage
    avgWakeUpTime: string;
    sleepConsistency: number;
    moodTrend: 'improving' | 'stable' | 'declining';
  };
  highlights: string[];
  recommendations: string[];
  chartUrl?: string; // link to detailed charts
}

export interface SystemNotificationData {
  type: 'system';
  systemType:
    | 'update_available'
    | 'maintenance'
    | 'security_alert'
    | 'feature_announcement';
  version?: string;
  updateSize?: number; // MB
  maintenanceWindow?: {
    start: Date;
    end: Date;
    affectedFeatures: string[];
  };
  securityLevel?: 'info' | 'warning' | 'critical';
  newFeatures?: Array<{
    name: string;
    description: string;
    icon?: string;
  }>;
}

export interface EmergencyNotificationData {
  type: 'emergency';
  emergencyType:
    | 'critical_alarm_failure'
    | 'account_security'
    | 'data_breach'
    | 'service_outage';
  severity: 'high' | 'critical';
  immediateAction: string;
  contactInfo?: {
    supportEmail: string;
    supportPhone?: string;
    statusPage?: string;
  };
  affectedData?: string[];
  resolutionETA?: Date;
}

export interface SocialNotificationData {
  type: 'social';
  socialType:
    | 'friend_request'
    | 'challenge_invite'
    | 'leaderboard_update'
    | 'group_activity';
  fromUserId?: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  challengeId?: string;
  challengeName?: string;
  groupId?: string;
  groupName?: string;
  ranking?: {
    position: number;
    totalParticipants: number;
    category: string;
  };
}

export interface PromotionalNotificationData {
  type: 'promotional';
  campaignId: string;
  offerType: 'discount' | 'trial' | 'feature_unlock' | 'content_recommendation';
  offerValue?: string; // "20% off", "7 days free", etc.
  validUntil?: Date;
  productUrl?: string;
  targetingReason: string; // why this user received this offer
  personalization?: {
    userName: string;
    relevantFeatures: string[];
    usagePatterns: string[];
  };
}

export type NotificationDataPayload =
  | AlarmNotificationData
  | MotivationNotificationData
  | ProgressNotificationData
  | SystemNotificationData
  | EmergencyNotificationData
  | SocialNotificationData
  | PromotionalNotificationData;

// ===============================
// PUSH SUBSCRIPTION MANAGEMENT
// ===============================

export interface PushSubscriptionData {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo: {
    type: 'mobile' | 'desktop' | 'tablet';
    platform: string;
    browser: string;
    version: string;
    userAgent: string;
  };
  preferences: NotificationPreferences;
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
  failures: number;
  lastFailure?: Date;
  testResults?: PushTestResults;
}

export interface NotificationPreferences {
  categories: Record<NotificationCategory, boolean>;
  priority: {
    min: boolean;
    low: boolean;
    default: boolean;
    high: boolean;
    max: boolean;
  };
  schedule: {
    enabled: boolean;
    allowedHours: {
      start: string; // HH:MM
      end: string; // HH:MM
    };
    timezone: string;
    weekdays: boolean[];
    exceptions: Array<{
      date: string; // YYYY-MM-DD
      allowed: boolean;
      reason: string;
    }>;
  };
  sound: {
    enabled: boolean;
    volume: number; // 0-100
    customSounds: Record<NotificationCategory, string>;
  };
  vibration: {
    enabled: boolean;
    pattern: number[];
  };
  batching: {
    enabled: boolean;
    maxBatchSize: number;
    batchWindow: number; // minutes
  };
  doNotDisturb: {
    enabled: boolean;
    schedule: Array<{
      start: string;
      end: string;
      days: number[];
      exceptions: NotificationCategory[];
    }>;
  };
}

// ===============================
// PUSH DELIVERY & TRACKING
// ===============================

export interface PushDeliveryStatus {
  notificationId: string;
  userId: string;
  subscriptionId: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'expired' | 'dismissed';
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  actionTaken?: {
    action: NotificationActionType;
    timestamp: Date;
    response?: string;
  };
  failureReason?: {
    code: string;
    message: string;
    recoverable: boolean;
    retryAfter?: number;
  };
  deliveryAttempts: number;
  lastAttemptAt?: Date;
  metadata?: {
    deviceOnline: boolean;
    batteryLevel?: number;
    networkType?: string;
    appState?: 'foreground' | 'background' | 'closed';
  };
}

export interface PushAnalytics {
  notificationId: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  metrics: {
    totalSent: number;
    delivered: number;
    opened: number;
    dismissed: number;
    actionsTaken: number;
    failed: number;
    expired: number;
  };
  rates: {
    deliveryRate: number; // delivered / sent
    openRate: number; // opened / delivered
    actionRate: number; // actions / delivered
    dismissalRate: number; // dismissed / delivered
  };
  timing: {
    averageDeliveryTime: number; // milliseconds
    averageTimeToOpen: number;
    averageTimeToAction: number;
  };
  segmentation: {
    byDevice: Record<string, PushAnalytics['metrics']>;
    byTimeOfDay: Record<string, PushAnalytics['metrics']>;
    byDayOfWeek: Record<string, PushAnalytics['metrics']>;
  };
  lastUpdated: Date;
}

// ===============================
// SERVICE WORKER COMMUNICATION
// ===============================

export interface ServiceWorkerMessage<T = any> {
  type: ServiceWorkerMessageType;
  payload: T;
  messageId: string;
  timestamp: Date;
}

export type ServiceWorkerMessageType =
  | 'push_received'
  | 'notification_clicked'
  | 'notification_closed'
  | 'background_sync'
  | 'cache_update'
  | 'offline_detected'
  | 'online_detected'
  | 'app_update_available'
  | 'push_subscription_changed';

export interface PushReceivedPayload {
  notification: PushNotification;
  isAppInForeground: boolean;
  shouldShowNotification: boolean;
  customHandling?: {
    suppressNotification: boolean;
    customDisplay: boolean;
    forwardToApp: boolean;
  };
}

export interface NotificationClickedPayload {
  notificationId: string;
  action?: NotificationActionType;
  actionInput?: string;
  notificationData: NotificationDataPayload;
  clickedAt: Date;
  shouldOpenApp: boolean;
  targetUrl?: string;
}

export interface NotificationClosedPayload {
  notificationId: string;
  reason: 'user' | 'programmatic' | 'timeout';
  closedAt: Date;
  timeVisible: number; // milliseconds
}

// ===============================
// PUSH TESTING & VALIDATION
// ===============================

export interface PushTestResults {
  subscriptionId: string;
  testId: string;
  runAt: Date;
  results: {
    subscriptionValid: boolean;
    endpointReachable: boolean;
    keysValid: boolean;
    deliverySuccessful: boolean;
    notificationDisplayed: boolean;
  };
  timings: {
    subscriptionValidation: number;
    endpointTest: number;
    deliveryTest: number;
    displayTest: number;
    totalTime: number;
  };
  errors?: Array<{ step: string; _error: string; details?: any }>;
  deviceCapabilities: {
    serviceWorkerSupport: boolean;
    notificationSupport: boolean;
    pushManagerSupport: boolean;
    backgroundSyncSupport: boolean;
    badgeSupport: boolean;
    actionsSupport: boolean;
    imageSupport: boolean;
    vibrateSupport: boolean;
  };
}

// ===============================
// PUSH NOTIFICATION MANAGER
// ===============================

export interface PushNotificationManager {
  // Subscription management
  subscribe(options?: PushSubscriptionOptions): Promise<PushSubscriptionData>;
  unsubscribe(subscriptionId: string): Promise<boolean>;
  updateSubscription(
    subscriptionId: string,
    updates: Partial<PushSubscriptionData>
  ): Promise<boolean>;
  getSubscription(): Promise<PushSubscriptionData | null>;

  // Preferences
  updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean>;
  getPreferences(): Promise<NotificationPreferences>;

  // Notification management
  sendNotification(notification: PushNotification): Promise<string>;
  scheduleNotification(
    notification: PushNotification,
    scheduleFor: Date
  ): Promise<string>;
  cancelNotification(notificationId: string): Promise<boolean>;
  getDeliveryStatus(notificationId: string): Promise<PushDeliveryStatus>;

  // Analytics and testing
  getAnalytics(timeRange?: { start: Date; end: Date }): Promise<PushAnalytics[]>;
  testPushCapabilities(): Promise<PushTestResults>;

  // Event handlers
  onNotificationReceived(handler: (notification: PushNotification) => void): void;
  onNotificationClicked(handler: (data: NotificationClickedPayload) => void): void;
  onNotificationClosed(handler: (data: NotificationClosedPayload) => void): void;
}

export interface PushSubscriptionOptions {
  userVisibleOnly?: boolean;
  applicationServerKey?: Uint8Array | string;
  vapidKey?: string;
}
