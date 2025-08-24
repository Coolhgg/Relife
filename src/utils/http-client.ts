/**
 * Enhanced HTTP Client Implementation
 * Provides standardized HTTP operations with error handling, caching, and monitoring
 */

import {
  HttpClient,
  HttpClientConfig,
  HttpRequestConfig,
  ApiResponse,
  ApiError,
  HttpMethod,
  EnhancedResponse,
  HttpRequestMetrics,
  RetryConfig,
  CircuitBreakerConfig,
  CircuitBreakerState,
  RateLimitStatus,
  HttpError,
} from '../types';

/**
 * Enhanced HTTP client with comprehensive error handling and monitoring
 */
export class EnhancedHttpClient implements HttpClient {
  private config: HttpClientConfig;
  private metrics: Map<string, HttpRequestMetrics> = new Map();
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      validateStatus: (status) => status >= 200 && status < 300,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...config,
    };
  }

  async get<T = unknown>(
    url: string,
    config?: Partial<HttpRequestConfig>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ 
      url, 
      method: 'GET', 
      ...config 
    });
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: Partial<HttpRequestConfig>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ 
      url, 
      method: 'POST', 
      data, 
      ...config 
    });
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: Partial<HttpRequestConfig>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ 
      url, 
      method: 'PUT', 
      data, 
      ...config 
    });
  }

  async delete<T = unknown>(
    url: string,
    config?: Partial<HttpRequestConfig>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ 
      url, 
      method: 'DELETE', 
      ...config 
    });
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: Partial<HttpRequestConfig>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ 
      url, 
      method: 'PATCH', 
      data, 
      ...config 
    });
  }

  async request<T = unknown>(config: HttpRequestConfig): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const fullConfig = this.mergeConfig(config);
    const cacheKey = this.getCacheKey(fullConfig);

    try {
      // Check circuit breaker
      if (this.isCircuitOpen(fullConfig.url)) {
        throw new Error('Circuit breaker is open');
      }

      // Check rate limiting
      const rateLimitStatus = this.checkRateLimit(fullConfig.url);
      if (rateLimitStatus && rateLimitStatus.remaining <= 0) {
        throw new Error('Rate limit exceeded');
      }

      // Check cache
      if (fullConfig.method === 'GET' && this.config.cache?.enabled) {
        const cachedResponse = this.getFromCache<T>(cacheKey);
        if (cachedResponse) {
          return cachedResponse;
        }
      }

      // Execute request with retries
      const response = await this.executeWithRetry<T>(fullConfig);
      
      // Update circuit breaker on success
      this.recordSuccess(fullConfig.url);

      // Cache successful GET requests
      if (fullConfig.method === 'GET' && this.config.cache?.enabled) {
        this.setCache(cacheKey, response);
      }

      // Record metrics
      this.recordMetrics(fullConfig, response, startTime, Date.now(), true);

      return response;

    } catch (error) {
      const endTime = Date.now();
      
      // Update circuit breaker on failure
      this.recordFailure(fullConfig.url);

      // Record error metrics
      this.recordMetrics(fullConfig, null, startTime, endTime, false, error);

      // Transform error to standardized format
      const apiError = this.transformError(error, fullConfig);
      
      return {
        success: false,
        error: apiError,
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
      };
    }
  }

  private mergeConfig(config: HttpRequestConfig): HttpRequestConfig {
    const baseURL = this.config.baseURL || '';
    const url = config.url.startsWith('http') ? config.url : `${baseURL}${config.url}`;
    
    return {
      ...this.config,
      ...config,
      url,
      headers: {
        ...this.config.headers,
        ...config.headers,
      },
    };
  }

  private async executeWithRetry<T>(config: HttpRequestConfig): Promise<ApiResponse<T>> {
    const maxRetries = this.config.retries || 0;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.executeRequest<T>(config);
        return response;
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries || !this.shouldRetry(error, attempt)) {
          break;
        }

        // Wait before retry with exponential backoff
        const delay = this.calculateRetryDelay(attempt);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private async executeRequest<T>(config: HttpRequestConfig): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      // Apply request interceptors
      const processedConfig = await this.applyRequestInterceptors(config);

      // Build fetch options
      const fetchOptions: RequestInit = {
        method: processedConfig.method,
        headers: processedConfig.headers as HeadersInit,
        signal: controller.signal,
      };

      // Add body for non-GET requests
      if (processedConfig.data && processedConfig.method !== 'GET') {
        fetchOptions.body = JSON.stringify(processedConfig.data);
      }

      // Add query parameters for GET requests
      const url = processedConfig.method === 'GET' && processedConfig.params
        ? `${processedConfig.url}?${new URLSearchParams(
            Object.entries(processedConfig.params).map(([key, value]) => [key, String(value)])
          ).toString()}`
        : processedConfig.url;

      // Execute request
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Parse response
      const responseData = await this.parseResponse(response);

      // Build standardized response
      const apiResponse: ApiResponse<T> = {
        success: this.config.validateStatus?.(response.status) ?? response.ok,
        data: responseData as T,
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
      };

      // Apply response interceptors
      const processedResponse = await this.applyResponseInterceptors(apiResponse);

      if (!processedResponse.success) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return processedResponse;

    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async parseResponse(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else if (contentType?.includes('text/')) {
      return await response.text();
    } else {
      return await response.blob();
    }
  }

  private async applyRequestInterceptors(config: HttpRequestConfig): Promise<HttpRequestConfig> {
    let processedConfig = { ...config };

    if (this.config.interceptors) {
      for (const interceptor of this.config.interceptors) {
        if (interceptor.request) {
          processedConfig = await interceptor.request(processedConfig);
        }
      }
    }

    return processedConfig;
  }

  private async applyResponseInterceptors<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> {
    let processedResponse = { ...response };

    if (this.config.interceptors) {
      for (const interceptor of this.config.interceptors) {
        if (interceptor.response) {
          processedResponse = await interceptor.response(processedResponse);
        }
      }
    }

    return processedResponse;
  }

  private shouldRetry(error: unknown, attempt: number): boolean {
    if (error instanceof Error) {
      // Don't retry on client errors (4xx)
      if (error.message.includes('4')) {
        return false;
      }
      
      // Retry on network errors and 5xx server errors
      return attempt < (this.config.retries || 0);
    }
    
    return false;
  }

  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.retryDelay || 1000;
    return baseDelay * Math.pow(2, attempt); // Exponential backoff
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCacheKey(config: HttpRequestConfig): string {
    const key = `${config.method}:${config.url}`;
    if (config.params) {
      const paramString = new URLSearchParams(
        Object.entries(config.params).map(([k, v]) => [k, String(v)])
      ).toString();
      return `${key}?${paramString}`;
    }
    return key;
  }

  private getFromCache<T>(key: string): ApiResponse<T> | null {
    if (!this.config.cache?.enabled) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const ttl = this.config.cache.ttl || 300000; // 5 minutes default

    if (now - cached.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as ApiResponse<T>;
  }

  private setCache<T>(key: string, response: ApiResponse<T>): void {
    if (!this.config.cache?.enabled) return;

    const maxSize = this.config.cache.maxSize || 100;
    
    if (this.cache.size >= maxSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data: response,
      timestamp: Date.now(),
    });
  }

  private isCircuitOpen(url: string): boolean {
    const state = this.circuitBreakers.get(url);
    return state === 'OPEN';
  }

  private recordSuccess(url: string): void {
    this.circuitBreakers.set(url, 'CLOSED');
  }

  private recordFailure(url: string): void {
    // Simple circuit breaker implementation
    const failures = this.getFailureCount(url) + 1;
    
    if (failures >= 5) { // Threshold of 5 failures
      this.circuitBreakers.set(url, 'OPEN');
    }
  }

  private getFailureCount(url: string): number {
    // This is a simplified implementation
    // In a real application, you'd want to track failures over time
    return 0;
  }

  private checkRateLimit(url: string): RateLimitStatus | null {
    // Simplified rate limiting implementation
    const now = Date.now();
    const limit = this.rateLimits.get(url);
    
    if (!limit || now > limit.resetTime) {
      // Reset rate limit window
      this.rateLimits.set(url, {
        count: 1,
        resetTime: now + 60000, // 1 minute window
      });
      
      return {
        limit: 100,
        remaining: 99,
        reset: now + 60000,
      };
    }

    limit.count++;
    
    return {
      limit: 100,
      remaining: Math.max(0, 100 - limit.count),
      reset: limit.resetTime,
    };
  }

  private recordMetrics(
    config: HttpRequestConfig,
    response: ApiResponse<unknown> | null,
    startTime: number,
    endTime: number,
    success: boolean,
    error?: unknown
  ): void {
    const metrics: HttpRequestMetrics = {
      url: config.url,
      method: config.method,
      statusCode: success ? 200 : 500,
      duration: endTime - startTime,
      requestSize: this.calculateRequestSize(config),
      responseSize: this.calculateResponseSize(response),
      timestamp: new Date().toISOString(),
      success,
      errorType: error instanceof Error ? error.name : undefined,
      retryCount: 0, // This would need to be tracked
      fromCache: false, // This would need to be tracked
    };

    this.metrics.set(`${config.method}:${config.url}:${Date.now()}`, metrics);

    // Keep only last 1000 metrics
    if (this.metrics.size > 1000) {
      const oldestKey = this.metrics.keys().next().value;
      this.metrics.delete(oldestKey);
    }
  }

  private calculateRequestSize(config: HttpRequestConfig): number {
    if (!config.data) return 0;
    return JSON.stringify(config.data).length;
  }

  private calculateResponseSize(response: ApiResponse<unknown> | null): number {
    if (!response) return 0;
    return JSON.stringify(response).length;
  }

  private transformError(error: unknown, config: HttpRequestConfig): ApiError {
    if (error instanceof Error) {
      return {
        code: 'HTTP_ERROR',
        message: error.message,
        details: {
          url: config.url,
          method: config.method,
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: {
        error: String(error),
        url: config.url,
        method: config.method,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for monitoring and debugging
  getMetrics(): HttpRequestMetrics[] {
    return Array.from(this.metrics.values());
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
    return Object.fromEntries(this.circuitBreakers);
  }

  getRateLimitStatus(): Record<string, { count: number; resetTime: number }> {
    return Object.fromEntries(this.rateLimits);
  }
}

/**
 * Factory function to create HTTP client instances
 */
export function createHttpClient(config?: HttpClientConfig): HttpClient {
  return new EnhancedHttpClient(config);
}

/**
 * Default HTTP client instance for application use
 */
export const httpClient = createHttpClient({
  timeout: 10000,
  retries: 3,
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 100,
    storage: 'memory',
  },
});

/**
 * Create service-specific HTTP clients
 */
export const createSupabaseClient = (config: { url: string; key: string }) =>
  createHttpClient({
    baseURL: config.url,
    headers: {
      'apikey': config.key,
      'Authorization': `Bearer ${config.key}`,
      'Content-Type': 'application/json',
    },
  });

export const createStripeClient = (config: { secretKey: string }) =>
  createHttpClient({
    baseURL: 'https://api.stripe.com/v1',
    headers: {
      'Authorization': `Bearer ${config.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

export const createConvertKitClient = (config: { apiKey: string }) =>
  createHttpClient({
    baseURL: 'https://api.convertkit.com/v3',
    headers: {
      'Content-Type': 'application/json',
    },
  });