/**
 * Supabase Real-time Types
 * Comprehensive typing for Supabase real-time subscriptions, database changes, and presence
 */

import type { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';

// ===============================
// DATABASE CHANGE EVENTS
// ===============================

export type DatabaseEventType = 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE';

export interface DatabaseChangePayload<T = any> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: DatabaseEventType;
  new: T;
  old: T;
  errors: any[] | null;
}

// Specific table change payloads
export interface AlarmChangePayload extends DatabaseChangePayload {
  table: 'alarms';
  new: {
    id: string;
    user_id: string;
    label: string;
    time: string;
    enabled: boolean;
    days: number[];
    voice_mood?: string;
    sound?: string;
    challenge_enabled?: boolean;
    snooze_limit?: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
  };
  old: Partial<AlarmChangePayload['new']>;
}

export interface UserSettingsChangePayload extends DatabaseChangePayload {
  table: 'user_settings';
  new: {
    user_id: string;
    notifications_enabled: boolean;
    sound_volume: number;
    vibration_enabled: boolean;
    voice_features_enabled: boolean;
    theme_preference: string;
    timezone: string;
    language: string;
    privacy_settings: Record<string, any>;
    updated_at: string;
  };
  old: Partial<UserSettingsChangePayload['new']>;
}

export interface UserPresenceChangePayload extends DatabaseChangePayload {
  table: 'user_presence';
  new: {
    user_id: string;
    status: 'online' | 'away' | 'busy' | 'offline';
    last_seen: string;
    device_info: Record<string, any>;
    location_context?: Record<string, any>;
    activity_context?: Record<string, any>;
    updated_at: string;
  };
  old: Partial<UserPresenceChangePayload['new']>;
}

export interface PushSubscriptionChangePayload extends DatabaseChangePayload {
  table: 'push_subscriptions';
  new: {
    id: string;
    user_id: string;
    endpoint: string;
    keys: Record<string, string>;
    device_info: Record<string, any>;
    preferences: Record<string, any>;
    is_active: boolean;
    created_at: string;
    last_used: string;
  };
  old: Partial<PushSubscriptionChangePayload['new']>;
}

export interface AnalyticsEventChangePayload extends DatabaseChangePayload {
  table: 'analytics_events';
  new: {
    id: string;
    user_id: string;
    event_type: string;
    event_data: Record<string, any>;
    session_id: string;
    device_info: Record<string, any>;
    timestamp: string;
    processed: boolean;
  };
  old: Partial<AnalyticsEventChangePayload['new']>;
}

// Union type for all database changes
export type DatabaseChange = 
  | AlarmChangePayload
  | UserSettingsChangePayload
  | UserPresenceChangePayload
  | PushSubscriptionChangePayload
  | AnalyticsEventChangePayload;

// ===============================
// REALTIME CHANNEL MANAGEMENT
// ===============================

export interface RealtimeChannelConfig {
  channelName: string;
  topic: string;
  config?: {
    broadcast?: { self?: boolean; ack?: boolean; };
    presence?: { key?: string; };
    private?: boolean;
  };
  filters?: Array<{
    event: string;
    schema?: string;
    table?: string;
    filter?: string;
  }>;
}

export interface RealtimeSubscription {
  id: string;
  channelName: string;
  userId: string;
  subscriptionType: 'database_changes' | 'broadcast' | 'presence' | 'custom';
  filters: RealtimeChannelConfig['filters'];
  isActive: boolean;
  createdAt: Date;
  lastActivity?: Date;
  errorCount: number;
  lastError?: {
    message: string;
    timestamp: Date;
    details?: any;
  };
}

export interface RealtimeChannelManager {
  createChannel(config: RealtimeChannelConfig): RealtimeChannel;
  subscribeToTable<T>(
    table: string, 
    eventTypes: DatabaseEventType[], 
    handler: (payload: DatabaseChangePayload<T>) => void,
    filter?: string
  ): string;
  subscribeToPresence(
    channelName: string,
    handlers: {
      onJoin?: (key: string, currentPresences: any, newPresences: any) => void;
      onLeave?: (key: string, currentPresences: any, leftPresences: any) => void;
      onSync?: () => void;
    }
  ): string;
  subscribeToBroadcast<T>(
    channelName: string,
    eventName: string,
    handler: (payload: T) => void
  ): string;
  unsubscribe(subscriptionId: string): Promise<boolean>;
  unsubscribeAll(): Promise<void>;
  getActiveSubscriptions(): RealtimeSubscription[];
  getChannelStatus(channelName: string): ChannelStatus;
}

// ===============================
// PRESENCE MANAGEMENT
// ===============================

export interface PresenceState {
  [key: string]: PresenceInfo[];
}

export interface PresenceInfo {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  joinedAt: Date;
  lastActivity: Date;
  deviceInfo: {
    type: string;
    userAgent: string;
    location?: string;
  };
  activityContext?: {
    currentPage: string;
    activeFeature?: string;
    engagementLevel: 'high' | 'medium' | 'low';
  };
  capabilities: {
    canReceivePush: boolean;
    canReceiveWebSocket: boolean;
    hasServiceWorker: boolean;
    supportsNotifications: boolean;
  };
}

export interface PresenceManager {
  track(presenceInfo: Omit<PresenceInfo, 'joinedAt' | 'lastActivity'>): Promise<boolean>;
  untrack(): Promise<boolean>;
  getPresenceState(): PresenceState;
  getOnlineUsers(): PresenceInfo[];
  getUserPresence(userId: string): PresenceInfo | null;
  onPresenceUpdate(handler: (state: PresenceState) => void): void;
  onUserJoined(handler: (userInfo: PresenceInfo) => void): void;
  onUserLeft(handler: (userId: string) => void): void;
  updateActivity(context?: PresenceInfo['activityContext']): void;
  setStatus(status: PresenceInfo['status']): void;
}

// ===============================
// BROADCAST MESSAGING
// ===============================

export interface BroadcastMessage<T = any> {
  type: BroadcastMessageType;
  payload: T;
  senderId: string;
  timestamp: Date;
  targetUsers?: string[]; // if undefined, broadcast to all
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requiresAck?: boolean;
  expiresAt?: Date;
}

export type BroadcastMessageType = 
  | 'user_activity_update'
  | 'alarm_state_sync'
  | 'emergency_notification'
  | 'system_announcement'
  | 'collaborative_action'
  | 'real_time_metric_update'
  | 'presence_ping'
  | 'custom_event';

export interface BroadcastManager {
  send<T>(message: BroadcastMessage<T>, channelName: string): Promise<RealtimeChannelSendResponse>;
  subscribe<T>(
    channelName: string,
    messageType: BroadcastMessageType,
    handler: (message: BroadcastMessage<T>) => void
  ): string;
  unsubscribe(subscriptionId: string): boolean;
  getDeliveryStatus(messageId: string): Promise<BroadcastDeliveryStatus>;
}

export interface BroadcastDeliveryStatus {
  messageId: string;
  sentAt: Date;
  totalRecipients: number;
  deliveredCount: number;
  acknowledgedCount: number;
  failedRecipients: string[];
  deliveryReport: Array<{
    userId: string;
    status: 'pending' | 'delivered' | 'acknowledged' | 'failed';
    timestamp?: Date;
    error?: string;
  }>;
}

// ===============================
// SYNC COORDINATION
// ===============================

export interface SyncCoordinator {
  requestSync(userId: string, itemTypes: string[]): Promise<string>;
  coordinateMultiDeviceSync(userId: string): Promise<SyncCoordinationResult>;
  handleSyncConflict(conflictId: string, resolution: SyncConflictResolution): Promise<boolean>;
  getSyncStatus(syncId: string): Promise<SyncStatus>;
  onSyncRequired(handler: (userId: string, reason: SyncTriggerReason) => void): void;
  onConflictDetected(handler: (conflict: SyncConflict) => void): void;
}

export interface SyncCoordinationResult {
  syncId: string;
  participatingDevices: Array<{
    deviceId: string;
    lastSync: Date;
    conflictCount: number;
  }>;
  coordinationStrategy: 'sequential' | 'parallel' | 'leader_follower';
  estimatedDuration: number; // seconds
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  id: string;
  itemType: string;
  itemId: string;
  conflictType: 'data_mismatch' | 'concurrent_edit' | 'version_skew';
  devices: Array<{
    deviceId: string;
    version: any;
    lastModified: Date;
  }>;
  autoResolvable: boolean;
  suggestedResolution: SyncConflictResolution;
}

export interface SyncConflictResolution {
  strategy: 'use_latest' | 'use_device' | 'merge_data' | 'manual_review';
  selectedDeviceId?: string;
  mergeInstructions?: Record<string, any>;
  userChoice?: 'local' | 'remote' | 'merge';
}

export type SyncTriggerReason = 
  | 'user_login'
  | 'data_change_detected'
  | 'periodic_sync'
  | 'device_reconnection'
  | 'conflict_resolution'
  | 'manual_trigger';

export interface SyncStatus {
  id: string;
  userId: string;
  type: 'full' | 'incremental' | 'conflict_resolution';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  progress: {
    totalItems: number;
    processedItems: number;
    failedItems: number;
    percentage: number;
  };
  itemDetails: Record<string, {
    total: number;
    processed: number;
    failed: number;
    conflicts: number;
  }>;
  errors: Array<{
    itemType: string;
    itemId: string;
    error: string;
    timestamp: Date;
  }>;
}

// ===============================
// CHANNEL STATUS & MONITORING
// ===============================

export interface ChannelStatus {
  channelName: string;
  state: 'closed' | 'errored' | 'joined' | 'joining' | 'leaving';
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  lastHeartbeat?: Date;
  latency?: number; // milliseconds
  reconnectCount: number;
  errorCount: number;
  lastError?: {
    code: string;
    message: string;
    timestamp: Date;
    recoverable: boolean;
  };
  subscriptionCount: number;
  messagesSent: number;
  messagesReceived: number;
  bytesTransferred: {
    sent: number;
    received: number;
  };
}

export interface RealtimeConnectionMetrics {
  totalChannels: number;
  activeChannels: number;
  totalSubscriptions: number;
  messagesThroughput: {
    sent: number;
    received: number;
    perSecond: number;
  };
  connectionUptime: number; // seconds
  averageLatency: number;
  errorRate: number;
  reconnectionRate: number;
  dataTransfer: {
    totalSent: number;
    totalReceived: number;
    compression: number; // percentage
  };
  lastUpdated: Date;
}

// ===============================
// ERROR HANDLING & RECOVERY
// ===============================

export interface RealtimeError {
  type: 'connection' | 'subscription' | 'authentication' | 'rate_limit' | 'protocol' | 'unknown';
  code: string;
  message: string;
  channelName?: string;
  subscriptionId?: string;
  timestamp: Date;
  recoverable: boolean;
  retryCount: number;
  context?: Record<string, any>;
}

export interface RealtimeRecoveryStrategy {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  recoveryActions: Array<{
    trigger: 'connection_lost' | 'subscription_failed' | 'rate_limited' | 'authentication_expired';
    action: 'reconnect' | 'resubscribe' | 'wait_and_retry' | 'escalate_to_user' | 'fallback_to_polling';
    delay?: number;
    maxAttempts?: number;
  }>;
}

export interface RealtimeHealthCheck {
  performHealthCheck(): Promise<HealthCheckResult>;
  schedulePeriodicChecks(interval: number): void;
  stopPeriodicChecks(): void;
  onHealthStatusChange(handler: (status: HealthStatus) => void): void;
}

export interface HealthCheckResult {
  overall: HealthStatus;
  checks: {
    connection: HealthStatus;
    authentication: HealthStatus;
    subscriptions: HealthStatus;
    latency: HealthStatus;
    errorRate: HealthStatus;
  };
  metrics: RealtimeConnectionMetrics;
  recommendations: string[];
  timestamp: Date;
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';