/**
 * WebSocket Types for Real-time Communication
 * Comprehensive type definitions for WebSocket connections and messaging
 */

// Base WebSocket connection states
export type WebSocketState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' | 'ERROR';

export type WebSocketErrorType = 
  | 'CONNECTION_FAILED' 
  | 'AUTHENTICATION_FAILED'
  | 'NETWORK_ERROR'
  | 'PROTOCOL_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'INVALID_MESSAGE'
  | 'RECONNECTION_FAILED';

// Base WebSocket message structure
export interface WebSocketMessage<T = any> {
  id: string;
  type: WebSocketMessageType;
  payload: T;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  version?: string;
}

// WebSocket message types
export type WebSocketMessageType = 
  // Connection management
  | 'connection_established'
  | 'heartbeat_ping'
  | 'heartbeat_pong'
  | 'authentication_request'
  | 'authentication_response'
  | 'reconnection_required'
  | 'connection_closing'
  
  // Alarm-related real-time events
  | 'alarm_triggered'
  | 'alarm_dismissed'
  | 'alarm_snoozed'
  | 'alarm_created'
  | 'alarm_updated'
  | 'alarm_deleted'
  | 'alarm_sync_status'
  
  // User activity and presence
  | 'user_presence_update'
  | 'user_activity'
  | 'device_status_change'
  
  // Real-time recommendations and AI
  | 'recommendation_generated'
  | 'ai_analysis_complete'
  | 'voice_mood_detected'
  | 'sleep_pattern_updated'
  
  // System notifications
  | 'system_notification'
  | 'emergency_alert'
  | 'maintenance_notice'
  | 'feature_announcement'
  
  // Data synchronization
  | 'sync_requested'
  | 'sync_status_update'
  | 'sync_conflict_detected'
  | 'data_updated'
  
  // Error handling
  | 'error_occurred'
  | 'warning_issued';

// WebSocket connection configuration
export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  timeout: number;
  heartbeatInterval: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  exponentialBackoff: boolean;
  maxReconnectDelay: number;
  enableCompression: boolean;
  bufferMaxItems: number;
  bufferMaxTime: number;
  enableLogging: boolean;
}

// WebSocket connection info
export interface WebSocketConnectionInfo {
  id: string;
  state: WebSocketState;
  url: string;
  protocol?: string;
  connectedAt?: Date;
  lastHeartbeat?: Date;
  reconnectCount: number;
  latency?: number;
  userId?: string;
  sessionId?: string;
  deviceInfo?: DeviceInfo;
}

// Device information for WebSocket connections
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'smartwatch' | 'smart_speaker';
  platform: string;
  userAgent: string;
  screen?: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  network?: {
    type: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  capabilities: {
    notifications: boolean;
    serviceWorker: boolean;
    webSocket: boolean;
    webRTC: boolean;
  };
}

// WebSocket error information
export interface WebSocketError {
  type: WebSocketErrorType;
  code?: number;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
  retryAfter?: number;
}

// WebSocket event handlers
export interface WebSocketEventHandlers {
  onOpen?: (connectionInfo: WebSocketConnectionInfo) => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (error: WebSocketError) => void;
  onMessage?: <T>(message: WebSocketMessage<T>) => void;
  onReconnecting?: (attempt: number, delay: number) => void;
  onReconnected?: (connectionInfo: WebSocketConnectionInfo) => void;
  onReconnectFailed?: (error: WebSocketError) => void;
}

// WebSocket metrics for monitoring
export interface WebSocketMetrics {
  connectionId: string;
  connectionsEstablished: number;
  connectionsDropped: number;
  messagesReceived: number;
  messagesSent: number;
  averageLatency: number;
  maxLatency: number;
  totalReconnections: number;
  uptime: number;
  dataTransferred: {
    sent: number;
    received: number;
  };
  errorCounts: Record<WebSocketErrorType, number>;
  lastUpdated: Date;
}

// WebSocket manager interface
export interface WebSocketManager {
  connect(config: WebSocketConfig, handlers: WebSocketEventHandlers): Promise<WebSocketConnectionInfo>;
  disconnect(reason?: string): Promise<void>;
  send<T>(message: WebSocketMessage<T>): Promise<boolean>;
  isConnected(): boolean;
  getConnectionInfo(): WebSocketConnectionInfo | null;
  getMetrics(): WebSocketMetrics;
  setHeartbeatInterval(interval: number): void;
  addMessageFilter(filter: (message: WebSocketMessage) => boolean): void;
  removeMessageFilter(filter: (message: WebSocketMessage) => boolean): void;
}

// WebSocket authentication
export interface WebSocketAuthPayload {
  token: string;
  userId: string;
  sessionId: string;
  deviceInfo: DeviceInfo;
  capabilities: string[];
}

export interface WebSocketAuthResponse {
  success: boolean;
  sessionId: string;
  permissions: string[];
  serverCapabilities: string[];
  heartbeatInterval: number;
  maxMessageSize: number;
  rateLimit: {
    messagesPerSecond: number;
    burstLimit: number;
  };
}

// WebSocket subscription management
export interface WebSocketSubscription {
  id: string;
  type: 'user_activity' | 'alarm_updates' | 'system_notifications' | 'presence' | 'data_sync';
  filters?: Record<string, any>;
  userId?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  createdAt: Date;
  lastActivity?: Date;
}

export interface WebSocketSubscriptionManager {
  subscribe(subscription: Omit<WebSocketSubscription, 'id' | 'createdAt'>): string;
  unsubscribe(subscriptionId: string): boolean;
  listSubscriptions(): WebSocketSubscription[];
  updateSubscription(subscriptionId: string, updates: Partial<WebSocketSubscription>): boolean;
}

// WebSocket rate limiting
export interface WebSocketRateLimit {
  messagesPerSecond: number;
  burstLimit: number;
  windowSizeMs: number;
  resetIntervalMs: number;
}

export interface WebSocketRateLimitStatus {
  remaining: number;
  resetTime: Date;
  isBlocked: boolean;
  blockedUntil?: Date;
}

// WebSocket message queue for offline scenarios
export interface WebSocketMessageQueue {
  maxSize: number;
  maxAge: number; // milliseconds
  messages: QueuedMessage[];
}

export interface QueuedMessage {
  message: WebSocketMessage;
  attempts: number;
  queuedAt: Date;
  scheduledFor?: Date;
  priority: number;
}

// WebSocket connection pool for multiple connections
export interface WebSocketPool {
  connections: Map<string, WebSocketConnectionInfo>;
  maxConnections: number;
  loadBalancingStrategy: 'round_robin' | 'least_connections' | 'random';
  healthCheck: {
    interval: number;
    timeout: number;
    enabled: boolean;
  };
}