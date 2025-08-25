/**
 * HTTP Client Interface Definitions
 * Standardized interfaces for all HTTP operations
 */

import { ApiResponse, HttpMethod, HttpRequestConfig, HttpResponse } from './api';

// =============================================================================
// Core HTTP Client Interfaces
// =============================================================================

/**
 * HTTP client interface with standardized methods
 */
export interface HttpClient {
  get<T = unknown>(
    url: string,
    _config?: Partial<HttpRequestConfig>
  ): Promise<ApiResponse<T>>;
  post<T = unknown>(
    url: string,
    data?: unknown,
    _config?: Partial<HttpRequestConfig>
  ): Promise<ApiResponse<T>>;
  put<T = unknown>(
    url: string,
    data?: unknown,
    _config?: Partial<HttpRequestConfig>
  ): Promise<ApiResponse<T>>;
  delete<T = unknown>(
    url: string,
    _config?: Partial<HttpRequestConfig>
  ): Promise<ApiResponse<T>>;
  patch<T = unknown>(
    url: string,
    data?: unknown,
    _config?: Partial<HttpRequestConfig>
  ): Promise<ApiResponse<T>>;
  request<T = unknown>(_config: HttpRequestConfig): Promise<ApiResponse<T>>;
}

/**
 * HTTP interceptor for request/response transformation
 */
export interface HttpInterceptor {
  request?: (
    _config: HttpRequestConfig
  ) => HttpRequestConfig | Promise<HttpRequestConfig>;
  response?: <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
  _error?: (_error: unknown) => unknown | Promise<unknown>;
}

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  validateStatus?: (status: number) => boolean;
  interceptors?: HttpInterceptor[];
  cache?: CacheConfig;
  authentication?: AuthenticationConfig;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  storage: 'memory' | 'localStorage' | 'sessionStorage';
  keyGenerator?: (_config: HttpRequestConfig) => string;
}

/**
 * Authentication configuration
 */
export interface AuthenticationConfig {
  type: 'bearer' | 'basic' | 'api-key' | 'custom';
  token?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  headerName?: string;
  tokenRefresh?: {
    url: string;
    method: HttpMethod;
    headers?: Record<string, string>;
    body?: unknown;
    tokenExtractor: (response: unknown) => string;
  };
}

// =============================================================================
// Request/Response Enhancement Interfaces
// =============================================================================

/**
 * Enhanced request configuration with metadata
 */
export interface EnhancedRequestConfig extends HttpRequestConfig {
  metadata?: {
    operationId?: string;
    description?: string;
    tags?: string[];
    cacheable?: boolean;
    requiresAuth?: boolean;
    rateLimit?: {
      requests: number;
      window: number;
    };
  };
}

/**
 * Enhanced response with performance metrics
 */
export interface EnhancedResponse<T> extends ApiResponse<T> {
  performance: {
    startTime: number;
    endTime: number;
    duration: number;
    requestSize: number;
    responseSize: number;
    fromCache: boolean;
  };
  request: EnhancedRequestConfig;
}

// =============================================================================
// Retry and Circuit Breaker Interfaces
// =============================================================================

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
  retryCondition: (_error: unknown, attempt: number) => boolean;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  expectedExceptionPredicate?: (_error: unknown) => boolean;
}

/**
 * Circuit breaker state
 */
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Circuit breaker metrics
 */
export interface CircuitBreakerMetrics {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  nextRetryTime?: number;
}

// =============================================================================
// Rate Limiting Interfaces
// =============================================================================

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  requests: number;
  window: number;
  strategy: 'sliding_window' | 'fixed_window' | 'token_bucket';
  burst?: number;
  keyGenerator?: (_config: HttpRequestConfig) => string;
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// =============================================================================
// Monitoring and Analytics Interfaces
// =============================================================================

/**
 * HTTP request metrics
 */
export interface HttpRequestMetrics {
  url: string;
  method: HttpMethod;
  statusCode: number;
  duration: number;
  requestSize: number;
  responseSize: number;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  sessionId?: string;
  success: boolean;
  errorType?: string;
  retryCount: number;
  fromCache: boolean;
}

/**
 * HTTP client analytics
 */
export interface HttpClientAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  cacheHitRate: number;
  topEndpoints: Array<{
    url: string;
    method: HttpMethod;
    requestCount: number;
    averageResponseTime: number;
  }>;
  errorBreakdown: Record<string, number>;
}

// =============================================================================
// Service-Specific Client Interfaces
// =============================================================================

/**
 * Supabase HTTP client configuration
 */
export interface SupabaseClientConfig extends HttpClientConfig {
  supabaseUrl: string;
  supabaseKey: string;
  schema?: string;
  autoRefreshToken?: boolean;
  persistSession?: boolean;
}

/**
 * Stripe HTTP client configuration
 */
export interface StripeClientConfig extends HttpClientConfig {
  secretKey: string;
  publishableKey?: string;
  apiVersion?: string;
  maxNetworkRetries?: number;
  timeout?: number;
}

/**
 * ConvertKit HTTP client configuration
 */
export interface ConvertKitClientConfig extends HttpClientConfig {
  apiKey: string;
  apiSecret?: string;
  apiVersion?: string;
}

/**
 * GitHub HTTP client configuration
 */
export interface GitHubClientConfig extends HttpClientConfig {
  token: string;
  userAgent?: string;
  apiVersion?: string;
}

// =============================================================================
// Error Handling Interfaces
// =============================================================================

/**
 * HTTP error details
 */
export interface HttpError extends Error {
  code: string;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  request?: HttpRequestConfig;
  response?: {
    data: unknown;
    status: number;
    statusText: string;
    headers: Record<string, string>;
  };
  retryable: boolean;
  timestamp: string;
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  enableRetry: boolean;
  retryConfig?: RetryConfig;
  enableCircuitBreaker: boolean;
  circuitBreakerConfig?: CircuitBreakerConfig;
  enableFallback: boolean;
  fallbackResponse?: <T>(_error: HttpError) => ApiResponse<T>;
  enableLogging: boolean;
  logLevel: '_error' | 'warn' | 'info' | 'debug';
}

// =============================================================================
// Testing Interfaces
// =============================================================================

/**
 * HTTP mock configuration
 */
export interface HttpMockConfig {
  url: string | RegExp;
  method?: HttpMethod;
  response: {
    status: number;
    data: unknown;
    headers?: Record<string, string>;
    delay?: number;
  };
  times?: number;
  persist?: boolean;
}

/**
 * HTTP client testing utilities
 */
export interface HttpClientTestUtils {
  mock(_config: HttpMockConfig): void;
  mockOnce(_config: HttpMockConfig): void;
  clearMocks(): void;
  getRequestHistory(): HttpRequestConfig[];
  getLastRequest(): HttpRequestConfig | undefined;
  verifyRequest(url: string | RegExp, method?: HttpMethod): boolean;
}

// =============================================================================
// Factory and Builder Interfaces
// =============================================================================

/**
 * HTTP client factory
 */
export interface HttpClientFactory {
  create(_config?: HttpClientConfig): HttpClient;
  createSupabaseClient(_config: SupabaseClientConfig): HttpClient;
  createStripeClient(_config: StripeClientConfig): HttpClient;
  createConvertKitClient(_config: ConvertKitClientConfig): HttpClient;
  createGitHubClient(_config: GitHubClientConfig): HttpClient;
}

/**
 * HTTP client builder for fluent configuration
 */
export interface HttpClientBuilder {
  baseURL(url: string): HttpClientBuilder;
  timeout(ms: number): HttpClientBuilder;
  headers(headers: Record<string, string>): HttpClientBuilder;
  retries(count: number): HttpClientBuilder;
  authentication(auth: AuthenticationConfig): HttpClientBuilder;
  cache(cache: CacheConfig): HttpClientBuilder;
  rateLimit(rateLimit: RateLimiterConfig): HttpClientBuilder;
  circuitBreaker(circuitBreaker: CircuitBreakerConfig): HttpClientBuilder;
  interceptor(interceptor: HttpInterceptor): HttpClientBuilder;
  build(): HttpClient;
}

// =============================================================================
// Plugin System Interfaces
// =============================================================================

/**
 * HTTP client plugin
 */
export interface HttpClientPlugin {
  name: string;
  version: string;
  install(client: HttpClient, options?: Record<string, unknown>): void;
  uninstall?(client: HttpClient): void;
}

/**
 * Plugin manager
 */
export interface PluginManager {
  install(plugin: HttpClientPlugin, options?: Record<string, unknown>): void;
  uninstall(pluginName: string): void;
  isInstalled(pluginName: string): boolean;
  getInstalledPlugins(): string[];
}
