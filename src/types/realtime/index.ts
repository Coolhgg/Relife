/**
 * Real-time Types Export Index
 * Central export point for all real-time WebSocket, push notification, and Supabase real-time types
 */

// Core WebSocket types
export type {
  WebSocketState,
  WebSocketErrorType,
  WebSocketMessage,
  WebSocketMessageType,
  WebSocketConfig,
  WebSocketConnectionInfo,
  DeviceInfo,
  WebSocketError,
  WebSocketEventHandlers,
  WebSocketMetrics,
  WebSocketManager,
  WebSocketAuthPayload,
  WebSocketAuthResponse,
  WebSocketSubscription,
  WebSocketSubscriptionManager,
  WebSocketRateLimit,
  WebSocketRateLimitStatus,
  WebSocketMessageQueue,
  QueuedMessage,
  WebSocketPool
} from '../websocket';

// Real-time message payloads
export type {
  // Alarm messages
  AlarmTriggeredPayload,
  AlarmDismissedPayload,
  AlarmSnoozedPayload,
  AlarmSyncStatusPayload,
  
  // User activity messages
  UserPresenceUpdatePayload,
  UserActivityPayload,
  DeviceStatusChangePayload,
  
  // AI and recommendation messages
  RecommendationGeneratedPayload,
  AIAnalysisCompletePayload,
  VoiceMoodDetectedPayload,
  SleepPatternUpdatedPayload,
  
  // System messages
  SystemNotificationPayload,
  EmergencyAlertPayload,
  
  // Sync messages
  SyncStatusUpdatePayload,
  SyncConflictDetectedPayload,
  
  // Message type unions
  AlarmRealtimeMessage,
  UserRealtimeMessage,
  AIRealtimeMessage,
  SystemRealtimeMessage,
  SyncRealtimeMessage,
  RealtimeMessage
} from '../realtime-messages';

// Message type guards
export {
  isAlarmMessage,
  isUserMessage,
  isAIMessage,
  isSystemMessage,
  isSyncMessage
} from '../realtime-messages';

// Push notification types
export type {
  NotificationPriority,
  NotificationCategory,
  NotificationActionType,
  PushNotificationBase,
  NotificationAction,
  PushNotification,
  
  // Notification data payloads
  AlarmNotificationData,
  MotivationNotificationData,
  ProgressNotificationData,
  SystemNotificationData,
  EmergencyNotificationData,
  SocialNotificationData,
  PromotionalNotificationData,
  NotificationDataPayload,
  
  // Push subscription management
  PushSubscriptionData,
  NotificationPreferences,
  
  // Delivery and tracking
  PushDeliveryStatus,
  PushAnalytics,
  
  // Service worker communication
  ServiceWorkerMessage,
  ServiceWorkerMessageType,
  PushReceivedPayload,
  NotificationClickedPayload,
  NotificationClosedPayload,
  
  // Testing and validation
  PushTestResults,
  
  // Manager interface
  PushNotificationManager,
  PushSubscriptionOptions
} from '../push-notifications';

// Supabase real-time types
export type {
  DatabaseEventType,
  DatabaseChangePayload,
  AlarmChangePayload,
  UserSettingsChangePayload,
  UserPresenceChangePayload,
  PushSubscriptionChangePayload,
  AnalyticsEventChangePayload,
  DatabaseChange,
  
  // Channel management
  RealtimeChannelConfig,
  RealtimeSubscription,
  RealtimeChannelManager,
  
  // Presence management
  PresenceState,
  PresenceInfo,
  PresenceManager,
  
  // Broadcast messaging
  BroadcastMessage,
  BroadcastMessageType,
  BroadcastManager,
  BroadcastDeliveryStatus,
  
  // Sync coordination
  SyncCoordinator,
  SyncCoordinationResult,
  SyncConflict,
  SyncConflictResolution,
  SyncTriggerReason,
  SyncStatus,
  
  // Monitoring and health
  ChannelStatus,
  RealtimeConnectionMetrics,
  RealtimeError,
  RealtimeRecoveryStrategy,
  RealtimeHealthCheck,
  HealthCheckResult,
  HealthStatus
} from '../supabase-realtime';

// Main service interface
export type {
  RealtimeServiceConfig,
  RealtimeService,
  
  // Feature interfaces
  AlarmRealtimeFeatures,
  UserRealtimeFeatures,
  AIRealtimeFeatures,
  SystemRealtimeFeatures,
  
  // Status and metrics
  ConnectionStatus,
  RealtimeServiceMetrics,
  RealtimeDiagnostics,
  
  // Error handling
  RealtimeServiceError,
  
  // Factory and builder
  RealtimeServiceFactory,
  RealtimeServiceBuilder,
  
  // Testing
  MockRealtimeService,
  RealtimeServiceTestHarness,
  TestScenario,
  TestStep,
  TestResult,
  TestSuite,
  PerformanceTest,
  PerformanceResults
} from '../realtime-service';

// ===============================
// UTILITY TYPES AND HELPERS
// ===============================

/**
 * Extract payload type from a WebSocket message
 */
export type ExtractPayload<T> = T extends WebSocketMessage<infer P> ? P : never;

/**
 * Create a typed WebSocket message
 */
export type TypedWebSocketMessage<T extends WebSocketMessageType, P = any> = WebSocketMessage<P> & {
  type: T;
};

/**
 * Real-time event handler function type
 */
export type RealtimeEventHandler<T = any> = (payload: T) => void | Promise<void>;

/**
 * Real-time event subscription cleanup function
 */
export type RealtimeSubscriptionCleanup = () => void;

/**
 * Real-time configuration validation result
 */
export interface RealtimeConfigValidation {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: string[];
  recommendations: string[];
}

/**
 * Real-time feature flags
 */
export interface RealtimeFeatureFlags {
  websockets: boolean;
  pushNotifications: boolean;
  supabaseRealtime: boolean;
  presence: boolean;
  broadcast: boolean;
  sync: boolean;
  offlineSupport: boolean;
  encryption: boolean;
  compression: boolean;
  analytics: boolean;
  debugging: boolean;
}

/**
 * Real-time performance thresholds
 */
export interface RealtimePerformanceThresholds {
  maxLatency: number; // milliseconds
  maxReconnections: number;
  maxErrorRate: number; // percentage
  minUptime: number; // percentage
  maxMemoryUsage: number; // MB
  minConnectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

/**
 * Real-time security configuration
 */
export interface RealtimeSecurityConfig {
  enableEncryption: boolean;
  encryptionKey?: string;
  enableAuthentication: boolean;
  tokenRefreshInterval: number; // minutes
  enableRateLimiting: boolean;
  rateLimits: {
    messagesPerSecond: number;
    connectionsPerIP: number;
    subscriptionsPerUser: number;
  };
  enableAuditLogging: boolean;
  auditLogLevel: 'minimal' | 'standard' | 'verbose';
}

// ===============================
// CONSTANTS AND DEFAULTS
// ===============================

/**
 * Default WebSocket configuration
 */
export const DEFAULT_WEBSOCKET_CONFIG: WebSocketConfig = {
  url: '',
  timeout: 10000,
  heartbeatInterval: 30000,
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  exponentialBackoff: true,
  maxReconnectDelay: 30000,
  enableCompression: true,
  bufferMaxItems: 100,
  bufferMaxTime: 5000,
  enableLogging: false
};

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  categories: {
    alarm: true,
    motivation: true,
    progress: true,
    system: true,
    emergency: true,
    social: false,
    promotional: false
  },
  priority: {
    min: false,
    low: true,
    default: true,
    high: true,
    max: true
  },
  schedule: {
    enabled: true,
    allowedHours: {
      start: '07:00',
      end: '22:00'
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    weekdays: [true, true, true, true, true, true, true],
    exceptions: []
  },
  sound: {
    enabled: true,
    volume: 80,
    customSounds: {}
  },
  vibration: {
    enabled: true,
    pattern: [200, 100, 200]
  },
  batching: {
    enabled: false,
    maxBatchSize: 5,
    batchWindow: 10
  },
  doNotDisturb: {
    enabled: false,
    schedule: [],
  }
};

/**
 * Default real-time service configuration
 */
export const DEFAULT_REALTIME_CONFIG: RealtimeServiceConfig = {
  websocket: {
    enabled: true,
    config: DEFAULT_WEBSOCKET_CONFIG,
    fallbackToPolling: true,
    pollingInterval: 30000
  },
  supabase: {
    enabled: true,
    enablePresence: true,
    enableBroadcast: true,
    enableDatabaseChanges: true,
    heartbeatInterval: 30000
  },
  pushNotifications: {
    enabled: true,
    vapidKey: '',
    autoSubscribe: true,
    defaultPreferences: DEFAULT_NOTIFICATION_PREFERENCES
  },
  sync: {
    enabled: true,
    autoSync: true,
    syncInterval: 15,
    conflictResolution: 'ask_user'
  },
  enableLogging: false,
  enableMetrics: true,
  enableOfflineSupport: true,
  maxReconnectionAttempts: 5,
  healthCheckInterval: 5
};

/**
 * Real-time message type constants
 */
export const REALTIME_MESSAGE_TYPES = {
  // Connection management
  CONNECTION_ESTABLISHED: 'connection_established',
  HEARTBEAT_PING: 'heartbeat_ping',
  HEARTBEAT_PONG: 'heartbeat_pong',
  
  // Alarm events
  ALARM_TRIGGERED: 'alarm_triggered',
  ALARM_DISMISSED: 'alarm_dismissed',
  ALARM_SNOOZED: 'alarm_snoozed',
  
  // User activity
  USER_PRESENCE_UPDATE: 'user_presence_update',
  USER_ACTIVITY: 'user_activity',
  
  // AI and recommendations
  RECOMMENDATION_GENERATED: 'recommendation_generated',
  VOICE_MOOD_DETECTED: 'voice_mood_detected',
  
  // System notifications
  SYSTEM_NOTIFICATION: 'system_notification',
  EMERGENCY_ALERT: 'emergency_alert',
  
  // Sync operations
  SYNC_STATUS_UPDATE: 'sync_status_update',
  SYNC_CONFLICT_DETECTED: 'sync_conflict_detected'
} as const;

/**
 * Notification action type constants
 */
export const NOTIFICATION_ACTIONS = {
  DISMISS: 'dismiss',
  SNOOZE: 'snooze',
  VIEW: 'view',
  SETTINGS: 'settings',
  RESPOND: 'respond',
  QUICK_REPLY: 'quick_reply',
  OPEN_APP: 'open_app',
  SHARE: 'share',
  FEEDBACK: 'feedback'
} as const;