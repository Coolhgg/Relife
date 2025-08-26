/**
 * Centralized exports for all TypeScript interfaces
 * This file provides a single entry point for all types used in the Relife application
 */

// Core domain types
export * from './domain';

// App state management
export * from './app-state';
export * from './app-state-extensions';

// User types
export * from './user';

// Email campaign and persona types
export * from './email-campaigns';

// Core API interfaces
export * from './api';

// HTTP client interfaces
export * from './http-client';

// Service-specific interfaces
export * from './services/stripe-api';
export * from './services/convertkit-api';
export * from './services/webhook-api';

// Alarm scheduling interfaces
export * from './alarm-scheduling';

// Reward system interfaces
export * from './reward-system';

// API response interfaces
export * from './api-responses';

// Configuration interfaces
export * from './configuration-interfaces';

// Service Interface Exports
export * from './service-interfaces';
export * from './domain-service-interfaces';

// Additional commonly used type definitions
export type DayOfWeek = 
  | 'sunday'
  | 'monday' 
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

// Re-export commonly used interfaces with descriptive names
export type {
  ApiResponse as StandardApiResponse,
  ApiError as StandardApiError,
  PaginationParams as StandardPaginationParams,
  PaginatedResponse as StandardPaginatedResponse,
  HttpClient as StandardHttpClient,
  HttpRequestConfig as StandardHttpRequestConfig,
  HttpResponse as StandardHttpResponse,
} from './api';

export type {
  StripeSubscription as StripeSubscriptionData,
  StripeCustomer as StripeCustomerData,
  StripePaymentMethod as StripePaymentMethodData,
  StripeInvoice as StripeInvoiceData,
} from './services/stripe-api';

export type {
  ConvertKitSubscriber as ConvertKitSubscriberData,
  ConvertKitTag as ConvertKitTagData,
  ConvertKitBroadcast as ConvertKitBroadcastData,
  UserPersona as EmailMarketingPersona,
} from './services/convertkit-api';

export type {
  WebhookPayload as StandardWebhookPayload,
  AllWebhookPayloads as AnyWebhookPayload,
  WebhookHandler as StandardWebhookHandler,
  WebhookConfig as StandardWebhookConfig,
} from './services/webhook-api';

// Type utilities for enhanced development experience
export type ApiEndpoint<TRequest = unknown, TResponse = unknown> = {
  request: TRequest;
  response: ApiResponse<TResponse>;
};

export type ServiceMethod<TArgs extends unknown[] = unknown[], TResult = unknown> = (
  ...args: TArgs
) => Promise<ApiResponse<TResult>>;

export type AsyncServiceMethod<
  TArgs extends unknown[] = unknown[],
  TResult = unknown,
> = (...args: TArgs) => Promise<TResult>;

// Common type guards for runtime type checking
export const isApiResponse = <T>(value: unknown): value is ApiResponse<T> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ApiResponse).success === 'boolean' &&
    typeof (value as ApiResponse).timestamp === 'string'
  );
};

export const isApiError = (value: unknown): value is ApiError => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ApiError).code === 'string' &&
    typeof (value as ApiError).message === 'string'
  );
};

export const isPaginatedResponse = <T>(
  value: unknown
): value is PaginatedResponse<T> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as PaginatedResponse<T>).data) &&
    typeof (value as PaginatedResponse<T>).meta === 'object'
  );
};

// Helper types for common patterns
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Constants for common API configurations
export const DEFAULT_PAGINATION: PaginationParams = {
  page: 1,
  limit: 20,
};

export const DEFAULT_HTTP_TIMEOUT = 10000; // 10 seconds
export const DEFAULT_RETRY_ATTEMPTS = 3;
export const DEFAULT_RATE_LIMIT = {
  requests: 100,
  window: 60000, // 1 minute
};

// Type-safe environment configuration
export interface ApiEnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  stripe: {
    publishableKey: string;
    secretKey?: string;
    webhookSecret?: string;
  };
  convertkit: {
    apiKey: string;
    apiSecret?: string;
  };
  github?: {
    token: string;
  };
  backend: {
    apiUrl: string;
    apiKey?: string;
  };
  monitoring: {
    sentryDsn?: string;
    posthogKey?: string;
    performanceEndpoint?: string;
  };
}

// Service factory type for dependency injection
export interface ServiceFactory {
  createHttpClient(): HttpClient;
  createSupabaseService(): unknown;
  createStripeService(): unknown;
  createConvertKitService(): unknown;
  createWebhookService(): unknown;
}

// Global error handling types
export interface GlobalErrorHandler {
  handleApiError(_error: ApiError): void;
  handleHttpError(_error: HttpError): void;
  handleWebhookError(_error: unknown, payload: WebhookPayload): void;
}

// Telemetry and monitoring types
export interface TelemetryData {
  operation: string;
  duration: number;
  success: boolean;
  _error?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface MonitoringService {
  recordApiCall(data: TelemetryData): void;
  recordError(_error: Error, context?: Record<string, unknown>): void;
  recordPerformance(metric: string, value: number, tags?: Record<string, string>): void;
}

// Service health check types
export interface ServiceHealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: string;
  latency?: number;
  _error?: string;
}

export interface HealthCheckResponse {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealthCheck[];
  timestamp: string;
  version: string;
}
// Common type definitions for reducing any usage
export * from './common-types';

// Service Interface Exports
export * from './service-interfaces';
export * from './domain-service-interfaces';
