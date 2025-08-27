/**
 * Real-time Service Interface
 * Complete interface for real-time functionality combining WebSockets, push notifications, and Supabase real-time
 */

import type { 
  WebSocketManager, 
  WebSocketConfig, 
  WebSocketConnectionInfo, 
  WebSocketEventHandlers,
  WebSocketMetrics 
} from './websocket';

import type { 
  PushNotificationManager, 
  PushNotification, 
  NotificationPreferences,
  PushSubscriptionData 
} from './push-notifications';

import type { 
  RealtimeChannelManager, 
  PresenceManager, 
  BroadcastManager,
  SyncCoordinator,
  RealtimeConnectionMetrics,
  HealthCheckResult 
} from './supabase-realtime';

import type { 
  RealtimeMessage,
  AlarmTriggeredPayload,
  AlarmDismissedPayload,
  UserPresenceUpdatePayload,
  RecommendationGeneratedPayload 
} from './realtime-messages';

// ===============================
// MAIN REALTIME SERVICE
// ===============================

export interface RealtimeServiceConfig {
  // WebSocket configuration
  websocket: {
    enabled: boolean;
    config: WebSocketConfig;
    fallbackToPolling: boolean;
    pollingInterval?: number;
  };
  
  // Supabase real-time configuration
  supabase: {
    enabled: boolean;
    enablePresence: boolean;
    enableBroadcast: boolean;
    enableDatabaseChanges: boolean;
    heartbeatInterval: number;
  };
  
  // Push notifications configuration
  pushNotifications: {
    enabled: boolean;
    vapidKey: string;
    autoSubscribe: boolean;
    defaultPreferences: NotificationPreferences;
  };
  
  // Sync and coordination
  sync: {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number; // minutes
    conflictResolution: 'auto' | 'manual' | 'ask_user';
  };
  
  // General settings
  enableLogging: boolean;
  enableMetrics: boolean;
  enableOfflineSupport: boolean;
  maxReconnectionAttempts: number;
  healthCheckInterval: number; // minutes
}

export interface RealtimeService {
  // Core lifecycle
  initialize(config: RealtimeServiceConfig): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
  getConfig(): RealtimeServiceConfig;
  updateConfig(updates: Partial<RealtimeServiceConfig>): Promise<void>;
  
  // Component managers
  getWebSocketManager(): WebSocketManager;
  getPushNotificationManager(): PushNotificationManager;
  getChannelManager(): RealtimeChannelManager;
  getPresenceManager(): PresenceManager;
  getBroadcastManager(): BroadcastManager;
  getSyncCoordinator(): SyncCoordinator;
  
  // High-level real-time features
  alarm: AlarmRealtimeFeatures;
  user: UserRealtimeFeatures;
  ai: AIRealtimeFeatures;
  system: SystemRealtimeFeatures;
  
  // Monitoring and diagnostics
  getMetrics(): Promise<RealtimeServiceMetrics>;
  performHealthCheck(): Promise<HealthCheckResult>;
  getDiagnostics(): Promise<RealtimeDiagnostics>;
  
  // Event handling
  onConnectionStatusChange(handler: (status: ConnectionStatus) => void): () => void;
  onError(handler: (error: RealtimeServiceError) => void): () => void;
  onMessage(handler: (message: RealtimeMessage) => void): () => void;
}

// ===============================
// FEATURE-SPECIFIC INTERFACES
// ===============================

export interface AlarmRealtimeFeatures {
  // Alarm state synchronization
  syncAlarmState(alarmId: string): Promise<void>;
  subscribeToAlarmChanges(userId: string, handler: (alarm: any) => void): () => void;
  
  // Real-time alarm events
  onAlarmTriggered(handler: (data: AlarmTriggeredPayload) => void): () => void;
  onAlarmDismissed(handler: (data: AlarmDismissedPayload) => void): () => void;
  onAlarmSnoozed(handler: (data: any) => void): () => void;
  
  // Alarm notifications
  sendAlarmNotification(alarmData: any): Promise<string>;
  scheduleAlarmReminder(alarmId: string, time: Date): Promise<string>;
  cancelAlarmNotification(notificationId: string): Promise<boolean>;
  
  // Multi-device coordination
  coordinateMultiDeviceAlarm(alarmId: string): Promise<void>;
  handleAlarmConflict(conflictData: any): Promise<void>;
  
  // Emergency features
  triggerEmergencyAlarm(reason: string): Promise<void>;
  broadcastAlarmFailure(alarmId: string, error: string): Promise<void>;
}

export interface UserRealtimeFeatures {
  // Presence management
  updatePresence(status: UserPresenceUpdatePayload['status']): Promise<void>;
  subscribeToPresence(handler: (presence: UserPresenceUpdatePayload) => void): () => void;
  getOnlineUsers(): Promise<UserPresenceUpdatePayload[]>;
  
  // Activity tracking
  trackActivity(activity: any): Promise<void>;
  subscribeToUserActivity(userId: string, handler: (activity: any) => void): () => void;
  
  // Social features
  sendFriendRequest(toUserId: string): Promise<void>;
  inviteToChallenge(userIds: string[], challengeData: any): Promise<void>;
  
  // Device coordination
  syncDeviceSettings(): Promise<void>;
  onDeviceStatusChange(handler: (status: any) => void): () => void;
}

export interface AIRealtimeFeatures {
  // Recommendations
  subscribeToRecommendations(handler: (rec: RecommendationGeneratedPayload) => void): () => void;
  requestAnalysis(type: string, data: any): Promise<string>;
  
  // Voice and mood
  updateVoiceMood(mood: any): Promise<void>;
  onVoiceMoodDetected(handler: (mood: any) => void): () => void;
  
  // Sleep pattern analysis
  onSleepPatternUpdate(handler: (pattern: any) => void): () => void;
  triggerSleepAnalysis(): Promise<void>;
  
  // Personalization
  updatePersonalizationData(data: any): Promise<void>;
  onPersonalizationUpdate(handler: (data: any) => void): () => void;
}

export interface SystemRealtimeFeatures {
  // System notifications
  sendSystemNotification(notification: any): Promise<string>;
  subscribeToSystemNotifications(handler: (notification: any) => void): () => void;
  
  // Emergency alerts
  sendEmergencyAlert(alert: any): Promise<void>;
  onEmergencyAlert(handler: (alert: any) => void): () => void;
  
  // Maintenance and updates
  announceMaintenanceWindow(window: any): Promise<void>;
  notifyAppUpdate(updateInfo: any): Promise<void>;
  
  // Performance monitoring
  reportPerformanceMetric(metric: any): Promise<void>;
  onPerformanceAlert(handler: (alert: any) => void): () => void;
}

// ===============================
// STATUS AND METRICS
// ===============================

export interface ConnectionStatus {
  overall: 'connected' | 'connecting' | 'disconnected' | 'error';
  websocket: {
    status: 'connected' | 'connecting' | 'disconnected' | 'error';
    connectionInfo?: WebSocketConnectionInfo;
  };
  supabase: {
    status: 'connected' | 'connecting' | 'disconnected' | 'error';
    activeChannels: number;
    subscriptions: number;
  };
  pushNotifications: {
    status: 'subscribed' | 'unsubscribed' | 'error';
    subscription?: PushSubscriptionData;
  };
  lastStatusChange: Date;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface RealtimeServiceMetrics {
  // Connection metrics
  connections: {
    websocket: WebSocketMetrics;
    supabase: RealtimeConnectionMetrics;
    totalUptime: number;
    reconnections: number;
  };
  
  // Message throughput
  messaging: {
    messagesSent: number;
    messagesReceived: number;
    messagesPerSecond: number;
    averageLatency: number;
    failureRate: number;
  };
  
  // Feature usage
  features: {
    alarmEvents: number;
    presenceUpdates: number;
    notifications: number;
    syncOperations: number;
    aiInteractions: number;
  };
  
  // Performance
  performance: {
    memoryUsage: number; // MB
    cpuUsage: number; // percentage
    networkUsage: { sent: number; received: number; };
    cacheHitRate: number;
  };
  
  // Errors and health
  health: {
    errorCount: number;
    warningCount: number;
    lastError?: Date;
    healthScore: number; // 0-100
  };
  
  // Time ranges
  timeRange: {
    start: Date;
    end: Date;
    duration: number; // seconds
  };
}

export interface RealtimeDiagnostics {
  // System information
  system: {
    userAgent: string;
    platform: string;
    onlineStatus: boolean;
    batteryLevel?: number;
    networkType?: string;
    memoryInfo?: any;
  };
  
  // Capability detection
  capabilities: {
    webSocket: boolean;
    serviceWorker: boolean;
    pushNotifications: boolean;
    backgroundSync: boolean;
    webRTC: boolean;
    indexedDB: boolean;
  };
  
  // Configuration validation
  configuration: {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
    missingFeatures: string[];
  };
  
  // Connection diagnostics
  connectivity: {
    websocketReachable: boolean;
    supabaseReachable: boolean;
    pushEndpointValid: boolean;
    firewallIssues: boolean;
    latencyTest: {
      min: number;
      max: number;
      average: number;
      jitter: number;
    };
  };
  
  // Performance analysis
  performance: {
    initializationTime: number;
    connectionTime: number;
    subscriptionTime: number;
    messageProcessingTime: number;
    memoryLeaks: boolean;
    performanceScore: number; // 0-100
  };
  
  // Error analysis
  errors: {
    recentErrors: Array<{
      type: string;
      message: string;
      timestamp: Date;
      stack?: string;
    }>;
    errorPatterns: Array<{
      pattern: string;
      occurrences: number;
      lastSeen: Date;
    }>;
    recoverySuccess: number; // percentage
  };
}

// ===============================
// ERROR HANDLING
// ===============================

export interface RealtimeServiceError {
  type: 'websocket' | 'supabase' | 'push_notifications' | 'sync' | 'configuration' | 'network' | 'unknown';
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  recoverable: boolean;
  userActionRequired: boolean;
  suggestedActions: string[];
  context?: {
    userId?: string;
    sessionId?: string;
    deviceInfo?: any;
    networkState?: any;
  };
}

// ===============================
// FACTORY AND BUILDER
// ===============================

export interface RealtimeServiceFactory {
  create(config: RealtimeServiceConfig): RealtimeService;
  createWithDefaults(overrides?: Partial<RealtimeServiceConfig>): RealtimeService;
  validateConfig(config: RealtimeServiceConfig): { valid: boolean; errors: string[]; };
  getDefaultConfig(): RealtimeServiceConfig;
}

export interface RealtimeServiceBuilder {
  withWebSocket(config: WebSocketConfig): RealtimeServiceBuilder;
  withSupabase(config: any): RealtimeServiceBuilder;
  withPushNotifications(config: any): RealtimeServiceBuilder;
  withSync(config: any): RealtimeServiceBuilder;
  enableLogging(enabled: boolean): RealtimeServiceBuilder;
  enableMetrics(enabled: boolean): RealtimeServiceBuilder;
  enableOfflineSupport(enabled: boolean): RealtimeServiceBuilder;
  build(): RealtimeService;
}

// ===============================
// TESTING AND MOCKING
// ===============================

export interface MockRealtimeService extends RealtimeService {
  // Mock-specific methods
  simulateMessage(message: RealtimeMessage): void;
  simulateError(error: RealtimeServiceError): void;
  simulateDisconnection(duration?: number): void;
  simulateLatency(latency: number): void;
  
  // Mock state management
  setMockConnectionStatus(status: ConnectionStatus): void;
  setMockMetrics(metrics: Partial<RealtimeServiceMetrics>): void;
  clearMockState(): void;
  
  // Test helpers
  getReceivedMessages(): RealtimeMessage[];
  getSentMessages(): RealtimeMessage[];
  getMethodCallHistory(): Array<{ method: string; args: any[]; timestamp: Date; }>;
}

export interface RealtimeServiceTestHarness {
  createMockService(config?: Partial<RealtimeServiceConfig>): MockRealtimeService;
  createTestScenario(scenario: TestScenario): Promise<TestResult>;
  runIntegrationTests(): Promise<TestSuite>;
  measurePerformance(operations: PerformanceTest[]): Promise<PerformanceResults>;
}

export interface TestScenario {
  name: string;
  description: string;
  steps: TestStep[];
  expectedOutcome: any;
  timeout: number;
}

export interface TestStep {
  action: 'send_message' | 'simulate_error' | 'wait' | 'assert' | 'custom';
  parameters: any;
  expectedResponse?: any;
  timeout?: number;
}

export interface TestResult {
  scenario: string;
  passed: boolean;
  duration: number;
  steps: Array<{
    step: number;
    passed: boolean;
    actualResponse?: any;
    error?: string;
  }>;
  metrics?: Partial<RealtimeServiceMetrics>;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
}

export interface PerformanceTest {
  name: string;
  operation: () => Promise<any>;
  iterations: number;
  concurrency?: number;
}

export interface PerformanceResults {
  tests: Array<{
    name: string;
    iterations: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    throughput: number; // operations per second
    memoryUsage: number;
    errors: number;
  }>;
  overall: {
    totalDuration: number;
    totalOperations: number;
    overallThroughput: number;
    errorRate: number;
  };
}