/**
 * Real-time Message Payloads for Relife App
 * Specific message types and payloads for alarm and user activity real-time communication
 */

import type { Alarm, VoiceMood, User, Battle } from './index';
import type { WebSocketMessage } from './websocket';

// ===============================
// ALARM REAL-TIME MESSAGES
// ===============================

export interface AlarmTriggeredPayload {
  alarm: Alarm;
  triggeredAt: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  deviceInfo: {
    batteryLevel?: number;
    networkType: string;
    isCharging?: boolean;
  };
  contextualData: {
    weatherCondition?: string;
    ambientLightLevel?: number;
    noiseLevel?: number;
  };
}

export interface AlarmDismissedPayload {
  alarmId: string;
  dismissedAt: Date;
  dismissMethod: 'voice' | 'button' | 'shake' | 'challenge' | 'timeout';
  timeToReact: number; // milliseconds
  voiceData?: {
    mood: VoiceMood;
    confidenceScore: number;
    wakefulness: number;
    responseText?: string;
  };
  challengeData?: {
    type: string;
    completed: boolean;
    attempts: number;
    duration: number;
  };
}

export interface AlarmSnoozedPayload {
  alarmId: string;
  snoozedAt: Date;
  snoozeMethod: 'voice' | 'button' | 'shake';
  snoozeDuration: number; // minutes
  snoozeCount: number;
  voiceData?: {
    mood: VoiceMood;
    responseText?: string;
  };
}

export interface AlarmSyncStatusPayload {
  alarmId: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';
  lastSyncAt?: Date;
  conflictDetails?: {
    type: 'time_conflict' | 'data_conflict' | 'permission_conflict';
    localVersion: any;
    remoteVersion: any;
    suggestedResolution: 'use_local' | 'use_remote' | 'merge' | 'manual';
  };
  deviceSource: string;
}

// ===============================
// USER ACTIVITY & PRESENCE
// ===============================

export interface UserPresenceUpdatePayload {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline' | 'do_not_disturb';
  lastSeen: Date;
  activeDevices: Array<{
    deviceId: string;
    type: string;
    lastActivity: Date;
    location?: string;
  }>;
  currentActivity?: {
    type: 'viewing_alarms' | 'setting_alarm' | 'in_meeting' | 'sleeping' | 'commuting';
    details?: any;
    startedAt: Date;
  };
}

export interface UserActivityPayload {
  userId: string;
  activityType: 'page_view' | 'alarm_interaction' | 'settings_change' | 'feature_usage';
  details: {
    page?: string;
    feature?: string;
    action?: string;
    duration?: number;
    metadata?: Record<string, any>;
  };
  timestamp: Date;
  sessionId: string;
  deviceInfo: {
    type: string;
    userAgent: string;
    screen: { width: number; height: number };
  };
}

export interface DeviceStatusChangePayload {
  deviceId: string;
  userId: string;
  status: 'connected' | 'disconnected' | 'low_battery' | 'charging' | 'updated';
  deviceInfo: {
    type: string;
    name: string;
    batteryLevel?: number;
    isCharging?: boolean;
    version?: string;
    capabilities: string[];
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  networkInfo?: {
    type: 'wifi' | 'cellular' | 'ethernet' | 'offline';
    strength?: number;
    provider?: string;
  };
}

// ===============================
// AI & RECOMMENDATIONS
// ===============================

export interface RecommendationGeneratedPayload {
  recommendationId: string;
  type: 'alarm_optimization' | 'sleep_schedule' | 'voice_mood' | 'challenge_difficulty';
  category: 'performance' | 'health' | 'productivity' | 'wellness';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recommendation: {
    title: string;
    description: string;
    actionText: string;
    benefits: string[];
    estimatedImpact: number; // 1-10 scale
  };
  data: {
    currentState: any;
    suggestedChanges: any;
    reasoning: string;
    confidence: number; // 0-1
    basedOn: string[]; // data sources
  };
  validUntil?: Date;
  autoApply?: boolean;
}

export interface AIAnalysisCompletePayload {
  analysisId: string;
  type:
    | 'sleep_pattern'
    | 'voice_effectiveness'
    | 'habit_formation'
    | 'performance_trend';
  userId: string;
  results: {
    summary: string;
    insights: Array<{
      category: string;
      finding: string;
      confidence: number;
      impact: 'positive' | 'negative' | 'neutral';
    }>;
    metrics: Record<string, number>;
    trends: Array<{
      metric: string;
      direction: 'improving' | 'declining' | 'stable';
      rate: number;
      significance: number;
    }>;
  };
  recommendations: Array<{
    action: string;
    priority: number;
    expectedOutcome: string;
  }>;
  generatedAt: Date;
  validFor: number; // days
}

export interface VoiceMoodDetectedPayload {
  userId: string;
  sessionId: string;
  detectedMood: VoiceMood;
  confidence: number; // 0-1
  audioMetrics: {
    duration: number; // seconds
    volume: number; // dB
    pitch: number; // Hz
    clarity: number; // 0-1
    responseTime: number; // milliseconds
  };
  contextualFactors: {
    timeOfDay: string;
    dayOfWeek: string;
    weatherCondition?: string;
    recentAlarmActivity: boolean;
    stressIndicators?: number;
  };
  recommendations: Array<{
    type: 'voice_training' | 'mood_improvement' | 'schedule_adjustment';
    suggestion: string;
    priority: number;
  }>;
  historicalComparison: {
    averageMood: VoiceMood;
    moodTrend: 'improving' | 'declining' | 'stable';
    unusualPatterns: string[];
  };
}

export interface SleepPatternUpdatedPayload {
  userId: string;
  analysisDate: Date;
  pattern: {
    averageBedtime: string; // HH:MM format
    averageWakeTime: string;
    averageSleepDuration: number; // hours
    sleepEfficiency: number; // percentage
    deepSleepPercentage: number;
    remSleepPercentage: number;
  };
  trends: {
    bedtimeConsistency: number; // 0-1, higher is more consistent
    wakeTimeConsistency: number;
    weekendShift: number; // hours difference from weekdays
    seasonalTrend?: string;
  };
  insights: Array<{
    category: 'quality' | 'timing' | 'duration' | 'consistency';
    finding: string;
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }>;
  recommendations: Array<{
    type: 'bedtime_adjustment' | 'wake_time_adjustment' | 'environment_change';
    description: string;
    expectedImprovement: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
}

// ===============================
// SYSTEM NOTIFICATIONS
// ===============================

export interface SystemNotificationPayload {
  notificationId: string;
  type: 'info' | 'warning' | '_error' | 'success' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  details?: string;
  actionRequired: boolean;
  actions?: Array<{
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'danger';
    url?: string;
  }>;
  affectedFeatures?: string[];
  estimatedResolution?: Date;
  dismissible: boolean;
  expiresAt?: Date;
}

export interface EmergencyAlertPayload {
  alertId: string;
  type: 'security_breach' | 'service_outage' | 'data_loss' | 'critical_bug';
  severity: 'high' | 'critical';
  title: string;
  description: string;
  immediateActions: string[];
  affectedUsers?: string[];
  estimatedImpact: string;
  statusUrl?: string;
  contactInfo?: {
    email: string;
    phone?: string;
    supportUrl?: string;
  };
  issuedAt: Date;
  resolvedAt?: Date;
}

// ===============================
// DATA SYNCHRONIZATION
// ===============================

export interface SyncStatusUpdatePayload {
  syncId: string;
  userId: string;
  type: 'full_sync' | 'incremental_sync' | 'conflict_resolution';
  status: 'started' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress: {
    current: number;
    total: number;
    percentage: number;
    estimatedTimeRemaining?: number; // seconds
  };
  items: {
    alarms: { processed: number; total: number; errors: number };
    settings: { processed: number; total: number; errors: number };
    analytics: { processed: number; total: number; errors: number };
  };
  conflicts?: Array<{
    itemType: string;
    itemId: string;
    resolution: 'pending' | 'resolved' | 'skipped';
    strategy?: 'use_local' | 'use_remote' | 'merge';
  }>;
  errors?: Array<{
    code: string;
    message: string;
    itemType?: string;
    itemId?: string;
  }>;
}

export interface SyncConflictDetectedPayload {
  conflictId: string;
  itemType: 'alarm' | 'settings' | 'user_data';
  itemId: string;
  conflictType:
    | 'data_mismatch'
    | 'timestamp_conflict'
    | 'permission_conflict'
    | 'version_conflict';
  localVersion: {
    data: any;
    lastModified: Date;
    version: number;
    source: string;
  };
  remoteVersion: {
    data: any;
    lastModified: Date;
    version: number;
    source: string;
  };
  autoResolution?: {
    possible: boolean;
    strategy: 'use_latest' | 'merge_fields' | 'prefer_local' | 'prefer_remote';
    confidence: number;
  };
  userActionRequired: boolean;
  suggestedActions: Array<{
    action: 'accept_local' | 'accept_remote' | 'merge' | 'review_manually';
    description: string;
    consequences: string;
  }>;
}

// ===============================
// TYPED MESSAGE UNIONS
// ===============================

export type AlarmRealtimeMessage =
  | WebSocketMessage<AlarmTriggeredPayload>
  | WebSocketMessage<AlarmDismissedPayload>
  | WebSocketMessage<AlarmSnoozedPayload>
  | WebSocketMessage<AlarmSyncStatusPayload>;

export type UserRealtimeMessage =
  | WebSocketMessage<UserPresenceUpdatePayload>
  | WebSocketMessage<UserActivityPayload>
  | WebSocketMessage<DeviceStatusChangePayload>;

export type AIRealtimeMessage =
  | WebSocketMessage<RecommendationGeneratedPayload>
  | WebSocketMessage<AIAnalysisCompletePayload>
  | WebSocketMessage<VoiceMoodDetectedPayload>
  | WebSocketMessage<SleepPatternUpdatedPayload>;

export type SystemRealtimeMessage =
  | WebSocketMessage<SystemNotificationPayload>
  | WebSocketMessage<EmergencyAlertPayload>;

export type SyncRealtimeMessage =
  | WebSocketMessage<SyncStatusUpdatePayload>
  | WebSocketMessage<SyncConflictDetectedPayload>;

export type RealtimeMessage =
  | AlarmRealtimeMessage
  | UserRealtimeMessage
  | AIRealtimeMessage
  | SystemRealtimeMessage
  | SyncRealtimeMessage;

// ===============================
// MESSAGE TYPE GUARDS
// ===============================

export const isAlarmMessage = (
  message: WebSocketMessage
): message is AlarmRealtimeMessage => {
  return [
    'alarm_triggered',
    'alarm_dismissed',
    'alarm_snoozed',
    'alarm_sync_status',
  ].includes(message.type);
};

export const isUserMessage = (
  message: WebSocketMessage
): message is UserRealtimeMessage => {
  return ['user_presence_update', 'user_activity', 'device_status_change'].includes(
    message.type
  );
};

export const isAIMessage = (
  message: WebSocketMessage
): message is AIRealtimeMessage => {
  return [
    'recommendation_generated',
    'ai_analysis_complete',
    'voice_mood_detected',
    'sleep_pattern_updated',
  ].includes(message.type);
};

export const isSystemMessage = (
  message: WebSocketMessage
): message is SystemRealtimeMessage => {
  return ['system_notification', 'emergency_alert'].includes(message.type);
};

export const isSyncMessage = (
  message: WebSocketMessage
): message is SyncRealtimeMessage => {
  return ['sync_status_update', 'sync_conflict_detected'].includes(message.type);
};
