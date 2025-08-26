/**
 * Webhook API Interface Definitions
 * Comprehensive typing for webhook payloads and handling
 */

import { ApiResponse } from '../api';

// =============================================================================
// Base Webhook Interfaces
// =============================================================================

/**
 * Base webhook payload
 */
export interface WebhookPayload {
  id: string;
  type: string;
  source: WebhookSource;
  timestamp: string;
  data: unknown;
  signature?: string;
  version?: string;
}

/**
 * Webhook sources
 */
export type WebhookSource =
  | 'stripe'
  | 'supabase'
  | 'convertkit'
  | 'github'
  | 'posthog'
  | 'sentry'
  | 'custom';

/**
 * Webhook verification result
 */
export interface WebhookVerificationResult {
  isValid: boolean;
  source: WebhookSource;
  _error?: string;
}

// =============================================================================
// Stripe Webhook Interfaces
// =============================================================================

/**
 * Stripe webhook event types
 */
export type StripeWebhookEventType =
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.created'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'payment_intent.created'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_method.attached'
  | 'setup_intent.succeeded';

/**
 * Stripe webhook payload
 */
export interface StripeWebhookPayload extends WebhookPayload {
  source: 'stripe';
  type: StripeWebhookEventType;
  data: {
    object: {
      id: string;
      object: string;
      [key: string]: unknown;
    };
    previous_attributes?: Record<string, unknown>;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string;
    idempotency_key?: string;
  };
}

// =============================================================================
// Supabase Webhook Interfaces
// =============================================================================

/**
 * Supabase webhook event types
 */
export type SupabaseWebhookEventType = 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * Supabase webhook payload
 */
export interface SupabaseWebhookPayload extends WebhookPayload {
  source: 'supabase';
  type: SupabaseWebhookEventType;
  data: {
    schema: string;
    table: string;
    columns: Array<{
      name: string;
      type: string;
    }>;
    commit_timestamp: string;
    eventType: SupabaseWebhookEventType;
    new: Record<string, unknown> | null;
    old: Record<string, unknown> | null;
  };
}

// =============================================================================
// ConvertKit Webhook Interfaces
// =============================================================================

/**
 * ConvertKit webhook event types
 */
export type ConvertKitWebhookEventType =
  | 'subscriber.subscriber_activate'
  | 'subscriber.subscriber_unsubscribe'
  | 'subscriber.subscriber_bounce'
  | 'subscriber.form_subscribe'
  | 'subscriber.sequence_add'
  | 'subscriber.sequence_complete'
  | 'subscriber.tag_add'
  | 'subscriber.tag_remove';

/**
 * ConvertKit webhook payload
 */
export interface ConvertKitWebhookPayload extends WebhookPayload {
  source: 'convertkit';
  type: ConvertKitWebhookEventType;
  data: {
    subscriber: {
      id: number;
      email_address: string;
      first_name?: string;
      state: string;
      created_at: string;
      fields: Record<string, string | number>;
    };
    form?: {
      id: number;
      name: string;
    };
    sequence?: {
      id: number;
      name: string;
    };
    tag?: {
      id: number;
      name: string;
    };
  };
}

// =============================================================================
// GitHub Webhook Interfaces
// =============================================================================

/**
 * GitHub webhook event types
 */
export type GitHubWebhookEventType =
  | 'push'
  | 'pull_request'
  | 'issues'
  | 'issue_comment'
  | 'release'
  | 'star'
  | 'watch'
  | 'fork'
  | 'deployment'
  | 'workflow_run';

/**
 * GitHub webhook payload
 */
export interface GitHubWebhookPayload extends WebhookPayload {
  source: 'github';
  type: GitHubWebhookEventType;
  data: {
    action?: string;
    repository: {
      id: number;
      name: string;
      full_name: string;
      owner: {
        login: string;
        id: number;
      };
    };
    sender: {
      login: string;
      id: number;
    };
    [key: string]: unknown;
  };
}

// =============================================================================
// PostHog Webhook Interfaces
// =============================================================================

/**
 * PostHog webhook event types
 */
export type PostHogWebhookEventType =
  | 'action.performed'
  | 'annotation.created'
  | 'feature_flag.updated'
  | 'person.created'
  | 'person.updated';

/**
 * PostHog webhook payload
 */
export interface PostHogWebhookPayload extends WebhookPayload {
  source: 'posthog';
  type: PostHogWebhookEventType;
  data: {
    event: string;
    properties: Record<string, unknown>;
    person?: {
      uuid: string;
      properties: Record<string, unknown>;
    };
    timestamp: string;
  };
}

// =============================================================================
// Sentry Webhook Interfaces
// =============================================================================

/**
 * Sentry webhook event types
 */
export type SentryWebhookEventType =
  | 'error.created'
  | 'issue.created'
  | 'issue.resolved'
  | 'issue.assigned'
  | 'issue.ignored'
  | 'metric_alert.triggered'
  | 'metric_alert.resolved';

/**
 * Sentry webhook payload
 */
export interface SentryWebhookPayload extends WebhookPayload {
  source: 'sentry';
  type: SentryWebhookEventType;
  data: {
    issue?: {
      id: string;
      title: string;
      culprit: string;
      permalink: string;
      level: string;
      status: string;
    };
    event?: {
      id: string;
      message: string;
      timestamp: string;
      level: string;
      platform: string;
    };
    project: {
      id: string;
      name: string;
      slug: string;
    };
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

// =============================================================================
// Custom Webhook Interfaces
// =============================================================================

/**
 * Custom application webhook types
 */
export type CustomWebhookEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'alarm.created'
  | 'alarm.triggered'
  | 'alarm.completed'
  | 'battle.created'
  | 'battle.joined'
  | 'battle.completed'
  | 'tournament.created'
  | 'tournament.started'
  | 'tournament.completed'
  | 'achievement.unlocked'
  | 'subscription.upgraded'
  | 'subscription.downgraded';

/**
 * Custom webhook payload
 */
export interface CustomWebhookPayload extends WebhookPayload {
  source: 'custom';
  type: CustomWebhookEventType;
  data: {
    userId?: string;
    entityId: string;
    entityType: string;
    action: string;
    metadata?: Record<string, unknown>;
    previousState?: Record<string, unknown>;
    currentState?: Record<string, unknown>;
  };
}

// =============================================================================
// Webhook Handler Interfaces
// =============================================================================

/**
 * Webhook handler function
 */
export type WebhookHandler<T extends WebhookPayload = WebhookPayload> = (
  payload: T
) => Promise<WebhookHandlerResult>;

/**
 * Webhook handler result
 */
export interface WebhookHandlerResult {
  success: boolean;
  message?: string;
  data?: unknown;
  retry?: boolean;
  retryAfter?: number;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  source: WebhookSource;
  endpoint: string;
  secret: string;
  enabled: boolean;
  events: string[];
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffSeconds: number;
  };
  timeout: number;
  headers?: Record<string, string>;
}

/**
 * Webhook processing status
 */
export interface WebhookProcessingStatus {
  id: string;
  webhookId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  attempts: number;
  lastAttemptAt: string;
  nextAttemptAt?: string;
  _error?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Webhook Registry Interfaces
// =============================================================================

/**
 * Webhook registry entry
 */
export interface WebhookRegistryEntry {
  id: string;
  source: WebhookSource;
  eventType: string;
  handler: string;
  enabled: boolean;
  priority: number;
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex';
    value: string;
  }>;
  transforms?: Array<{
    field: string;
    operation: 'map' | 'filter' | 'format' | 'validate';
    _config: Record<string, unknown>;
  }>;
}

/**
 * Webhook registry
 */
export interface WebhookRegistry {
  entries: WebhookRegistryEntry[];
  getHandlers(source: WebhookSource, eventType: string): WebhookRegistryEntry[];
  register(entry: WebhookRegistryEntry): void;
  unregister(id: string): void;
  isEnabled(id: string): boolean;
  setEnabled(id: string, enabled: boolean): void;
}

// =============================================================================
// Type Unions
// =============================================================================

/**
 * All webhook payload types
 */
export type AllWebhookPayloads =
  | StripeWebhookPayload
  | SupabaseWebhookPayload
  | ConvertKitWebhookPayload
  | GitHubWebhookPayload
  | PostHogWebhookPayload
  | SentryWebhookPayload
  | CustomWebhookPayload;

/**
 * All webhook event types
 */
export type AllWebhookEventTypes =
  | StripeWebhookEventType
  | SupabaseWebhookEventType
  | ConvertKitWebhookEventType
  | GitHubWebhookEventType
  | PostHogWebhookEventType
  | SentryWebhookEventType
  | CustomWebhookEventType;

// =============================================================================
// Service Response Interface
// =============================================================================

export interface WebhookServiceResponse extends ApiResponse {
  webhookId: string;
  processed: boolean;
  retryCount: number;
}
