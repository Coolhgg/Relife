/**
 * Comprehensive API Interface Definitions for Relife
 * Provides type safety for all API interactions
 */

// =============================================================================
// Core API Response Interfaces
// =============================================================================

/**
 * Standard API response wrapper for all endpoints
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  _error?: ApiError;
  message?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Standardized error response structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
  statusCode?: number;
}

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
}

/**
 * Pagination metadata in responses
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
  totalPages: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// =============================================================================
// HTTP Client Interfaces
// =============================================================================

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * HTTP request configuration
 */
export interface HttpRequestConfig {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

/**
 * HTTP response structure
 */
export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  _config: HttpRequestConfig;
}

/**
 * HTTP client interface
 */
export interface HttpClient {
  get<T = unknown>(
    url: string,
    _config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>>;
  post<T = unknown>(
    url: string,
    data?: unknown,
    _config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>>;
  put<T = unknown>(
    url: string,
    data?: unknown,
    _config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>>;
  delete<T = unknown>(
    url: string,
    _config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>>;
  patch<T = unknown>(
    url: string,
    data?: unknown,
    _config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>>;
}

// =============================================================================
// Backend API Interfaces
// =============================================================================

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services: {
    database: 'healthy' | 'degraded' | 'unhealthy';
    storage: 'healthy' | 'degraded' | 'unhealthy';
    cache: 'healthy' | 'degraded' | 'unhealthy';
  };
  timestamp: string;
}

/**
 * User creation request
 */
export interface CreateUserRequest {
  email: string;
  name?: string;
  password?: string;
  preferences?: Record<string, unknown>;
}

/**
 * User update request
 */
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  preferences?: Record<string, unknown>;
  avatar?: string;
}

/**
 * User statistics response
 */
export interface UserStatsResponse {
  alarmsCreated: number;
  alarmsCompleted: number;
  streakDays: number;
  battlesWon: number;
  battlesLost: number;
  totalBattles: number;
  achievementsUnlocked: number;
  lastActiveDate: string;
  joinDate: string;
}

/**
 * Alarm creation request
 */
export interface CreateAlarmRequest {
  name: string;
  time: string;
  days: number[];
  enabled: boolean;
  soundId?: string;
  volume?: number;
  snoozeEnabled?: boolean;
  battleEnabled?: boolean;
  recurring?: boolean;
  timezone?: string;
}

/**
 * Alarm update request
 */
export interface UpdateAlarmRequest extends Partial<CreateAlarmRequest> {
  id: string;
}

/**
 * Alarm filter parameters
 */
export interface AlarmFilters extends PaginationParams {
  userId?: string;
  enabled?: boolean;
  withBattles?: boolean;
  recurring?: boolean;
  upcoming?: boolean;
}

/**
 * Battle creation request
 */
export interface CreateBattleRequest {
  type: 'challenge' | 'tournament' | 'friendly';
  name: string;
  description?: string;
  maxParticipants?: number;
  startTime: string;
  duration?: number;
  isPublic?: boolean;
  rules?: Record<string, unknown>;
}

/**
 * Battle join request
 */
export interface JoinBattleRequest {
  battleId: string;
  userId: string;
  message?: string;
}

/**
 * Battle wake confirmation
 */
export interface BattleWakeRequest {
  battleId: string;
  userId: string;
  wakeTime: string;
  proof?: {
    type: 'photo' | 'location' | 'challenge';
    data: string;
  };
}

/**
 * Tournament filters
 */
export interface TournamentFilters extends PaginationParams {
  status?: 'upcoming' | 'active' | 'completed';
  type?: string;
  userId?: string;
}

// =============================================================================
// Performance Monitoring Interfaces
// =============================================================================

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
  userId?: string;
  sessionId?: string;
}

/**
 * Web vitals data
 */
export interface WebVitalsData {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

/**
 * Error report data
 */
export interface ErrorReportData {
  message: string;
  stack?: string;
  type: 'javascript' | 'network' | 'resource' | 'security';
  source: string;
  line?: number;
  column?: number;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url: string;
  timestamp: string;
}

/**
 * Performance dashboard response
 */
export interface PerformanceDashboardResponse {
  metrics: {
    averagePageLoadTime: number;
    errorRate: number;
    userSessions: number;
    bounceRate: number;
  };
  vitals: {
    cls: { value: number; rating: string };
    fid: { value: number; rating: string };
    lcp: { value: number; rating: string };
    fcp: { value: number; rating: string };
    ttfb: { value: number; rating: string };
  };
  trends: {
    period: string;
    data: Array<{
      date: string;
      loadTime: number;
      errorCount: number;
      sessions: number;
    }>;
  };
}

// =============================================================================
// External Service Interfaces
// =============================================================================

/**
 * Supabase authentication response
 */
export interface SupabaseAuthResponse {
  user: {
    id: string;
    email: string;
    emailConfirmed: boolean;
    phone?: string;
    lastSignInAt: string;
    appMetadata: Record<string, unknown>;
    userMetadata: Record<string, unknown>;
    aud: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
    user: object;
  } | null;
  error: {
    message: string;
    status?: number;
  } | null;
}

/**
 * Stripe subscription response
 */
export interface StripeSubscriptionResponse {
  id: string;
  customer: string;
  status:
    | 'active'
    | 'past_due'
    | 'unpaid'
    | 'canceled'
    | 'incomplete'
    | 'incomplete_expired'
    | 'trialing';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  items: Array<{
    id: string;
    price: {
      id: string;
      nickname?: string;
      unitAmount: number;
      currency: string;
      interval: 'day' | 'week' | 'month' | 'year';
      intervalCount: number;
    };
    quantity: number;
  }>;
  latestInvoice?: string;
  nextPaymentAttempt?: number;
  metadata: Record<string, string>;
}

/**
 * Stripe payment intent response
 */
export interface StripePaymentIntentResponse {
  id: string;
  clientSecret: string;
  status:
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'succeeded'
    | 'canceled';
  amount: number;
  currency: string;
  customer?: string;
  metadata: Record<string, string>;
}

/**
 * ConvertKit subscriber response
 */
export interface ConvertKitSubscriberResponse {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
  state: 'active' | 'inactive' | 'bounced' | 'complained';
  createdAt: string;
  updatedAt: string;
  tags: Array<{
    id: number;
    name: string;
    createdAt: string;
  }>;
  customFields: Record<string, string>;
}

/**
 * GitHub API user response
 */
export interface GitHubUserResponse {
  id: number;
  login: string;
  name?: string;
  email?: string;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization';
  site_admin: boolean;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

/**
 * Social media post response (generic)
 */
export interface SocialMediaPostResponse {
  id: string;
  text: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    verified: boolean;
  };
  createdAt: string;
  metrics: {
    likes: number;
    shares: number;
    comments: number;
    views?: number;
  };
  media?: Array<{
    type: 'image' | 'video' | 'gif';
    url: string;
    thumbnailUrl?: string;
    altText?: string;
  }>;
  hashtags: string[];
  mentions: string[];
  url: string;
}

// =============================================================================
// Webhook Payload Interfaces
// =============================================================================

/**
 * Base webhook payload
 */
export interface WebhookPayload {
  id: string;
  type: string;
  source: 'stripe' | 'supabase' | 'convertkit' | 'github' | 'custom';
  timestamp: string;
  data: unknown;
  signature?: string;
}

/**
 * Stripe webhook payload
 */
export interface StripeWebhookPayload extends WebhookPayload {
  source: 'stripe';
  type:
    | 'customer.subscription.created'
    | 'customer.subscription.updated'
    | 'customer.subscription.deleted'
    | 'invoice.payment_succeeded'
    | 'invoice.payment_failed'
    | 'payment_intent.succeeded';
  data: {
    object: StripeSubscriptionResponse | object;
  };
}

/**
 * Supabase webhook payload
 */
export interface SupabaseWebhookPayload extends WebhookPayload {
  source: 'supabase';
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  data: {
    schema: string;
    table: string;
    columns: Array<{
      name: string;
      type: string;
    }>;
    commit_timestamp: string;
    eventType: string;
    new: Record<string, unknown> | null;
    old: Record<string, unknown> | null;
  };
}

/**
 * ConvertKit webhook payload
 */
export interface ConvertKitWebhookPayload extends WebhookPayload {
  source: 'convertkit';
  type:
    | 'subscriber.subscriber_activate'
    | 'subscriber.subscriber_unsubscribe'
    | 'subscriber.subscriber_bounce';
  data: {
    subscriber: ConvertKitSubscriberResponse;
  };
}

// =============================================================================
// Real-time Message Interfaces
// =============================================================================

/**
 * Base WebSocket message
 */
export interface WebSocketMessage {
  id: string;
  type: string;
  timestamp: string;
  data: unknown;
}

/**
 * Alarm notification message
 */
export interface AlarmNotificationMessage extends WebSocketMessage {
  type: 'alarm.triggered' | 'alarm.snoozed' | 'alarm.dismissed';
  data: {
    alarmId: string;
    userId: string;
    time: string;
    action?: 'snooze' | 'dismiss';
    snoozeMinutes?: number;
  };
}

/**
 * Battle update message
 */
export interface BattleUpdateMessage extends WebSocketMessage {
  type:
    | 'battle.joined'
    | 'battle.left'
    | 'battle.started'
    | 'battle.ended'
    | 'battle.wake';
  data: {
    battleId: string;
    userId?: string;
    participants: number;
    status: 'waiting' | 'active' | 'completed';
    winner?: string;
    wakeTime?: string;
  };
}

/**
 * System notification message
 */
export interface SystemNotificationMessage extends WebSocketMessage {
  type: 'system.maintenance' | 'system.update' | 'system.announcement';
  data: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | '_error';
    action?: {
      label: string;
      url: string;
    };
  };
}

// =============================================================================
// Request/Response Type Unions
// =============================================================================

/**
 * All API request types
 */
export type ApiRequest =
  | CreateUserRequest
  | UpdateUserRequest
  | CreateAlarmRequest
  | UpdateAlarmRequest
  | CreateBattleRequest
  | JoinBattleRequest
  | BattleWakeRequest
  | PerformanceMetric
  | WebVitalsData
  | ErrorReportData;

/**
 * All API response types
 */
export type ApiResponseData =
  | HealthCheckResponse
  | UserStatsResponse
  | StripeSubscriptionResponse
  | StripePaymentIntentResponse
  | ConvertKitSubscriberResponse
  | GitHubUserResponse
  | SocialMediaPostResponse
  | PerformanceDashboardResponse
  | SupabaseAuthResponse;

/**
 * All webhook payload types
 */
export type WebhookPayloadTypes =
  | StripeWebhookPayload
  | SupabaseWebhookPayload
  | ConvertKitWebhookPayload;

/**
 * All WebSocket message types
 */
export type WebSocketMessageTypes =
  | AlarmNotificationMessage
  | BattleUpdateMessage
  | SystemNotificationMessage;

// =============================================================================
// API Endpoint Types
// =============================================================================

/**
 * API endpoint configuration
 */
export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  authenticated: boolean;
  rateLimit?: {
    requests: number;
    window: number;
  };
  requestSchema?: unknown;
  responseSchema?: unknown;
}

/**
 * API endpoints registry
 */
export interface ApiEndpoints {
  // Health & System
  health: ApiEndpoint;
  echo: ApiEndpoint;

  // User Management
  getUsers: ApiEndpoint;
  getUser: ApiEndpoint;
  createUser: ApiEndpoint;
  updateUser: ApiEndpoint;
  getUserStats: ApiEndpoint;

  // Alarm Operations
  getAlarms: ApiEndpoint;
  createAlarm: ApiEndpoint;
  updateAlarm: ApiEndpoint;
  deleteAlarm: ApiEndpoint;

  // Battle System
  getBattles: ApiEndpoint;
  createBattle: ApiEndpoint;
  getBattle: ApiEndpoint;
  joinBattle: ApiEndpoint;
  wakeBattle: ApiEndpoint;

  // Tournament System
  getTournaments: ApiEndpoint;

  // Performance Monitoring
  performanceMetrics: ApiEndpoint;
  webVitals: ApiEndpoint;
  errorReporting: ApiEndpoint;
  performanceDashboard: ApiEndpoint;
  performanceTrends: ApiEndpoint;
}

/**
 * Environment configuration interface
 */
export interface ApiConfiguration {
  baseUrl: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
  authentication: {
    type: 'bearer' | 'basic' | 'api-key';
    token?: string;
    refreshUrl?: string;
  };
  monitoring: {
    enabled: boolean;
    endpoint?: string;
    sampleRate?: number;
  };
}
