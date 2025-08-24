/**
 * ConvertKit API Interface Definitions
 * Comprehensive typing for email marketing operations
 */

import { ApiResponse } from '../api';

// =============================================================================
// Core ConvertKit Interfaces
// =============================================================================

/**
 * ConvertKit subscriber
 */
export interface ConvertKitSubscriber {
  id: number;
  first_name?: string;
  email_address: string;
  state: 'active' | 'inactive' | 'bounced' | 'complained';
  created_at: string;
  updated_at: string;
  fields: Record<string, string | number>;
}

/**
 * ConvertKit tag
 */
export interface ConvertKitTag {
  id: number;
  name: string;
  created_at: string;
  total_subscribers: number;
}

/**
 * ConvertKit form
 */
export interface ConvertKitForm {
  id: number;
  name: string;
  created_at: string;
  type: 'embed' | 'hosted' | 'modal' | 'slide_in';
  format: 'inline' | 'modal' | 'slide_in';
  embed_js: string;
  embed_url: string;
  redirect_url?: string;
  success_message?: string;
  archived: boolean;
  total_subscriptions: number;
}

/**
 * ConvertKit sequence
 */
export interface ConvertKitSequence {
  id: number;
  name: string;
  created_at: string;
  hold: boolean;
  repeat: boolean;
  total_subscriptions: number;
}

/**
 * ConvertKit broadcast
 */
export interface ConvertKitBroadcast {
  id: number;
  created_at: string;
  subject: string;
  content?: string;
  description?: string;
  public: boolean;
  published_at?: string;
  send_at?: string;
  thumbnail_alt?: string;
  thumbnail_url?: string;
  email_address: string;
  email_layout_template: string;
  total_recipients: number;
  open_rate?: number;
  click_rate?: number;
  unsubscribe_rate?: number;
  bounce_rate?: number;
  spam_rate?: number;
}

/**
 * ConvertKit custom field
 */
export interface ConvertKitCustomField {
  id: number;
  name: string;
  key: string;
  label: string;
}

// =============================================================================
// Request Interfaces
// =============================================================================

/**
 * Add subscriber request
 */
export interface AddSubscriberRequest {
  email: string;
  first_name?: string;
  fields?: Record<string, string | number>;
  tags?: string[];
  form_id?: number;
}

/**
 * Update subscriber request
 */
export interface UpdateSubscriberRequest {
  subscriber_id: number;
  first_name?: string;
  email_address?: string;
  fields?: Record<string, string | number>;
}

/**
 * Tag subscriber request
 */
export interface TagSubscriberRequest {
  tag_id: number;
  email?: string;
  subscriber_id?: number;
}

/**
 * Add to sequence request
 */
export interface AddToSequenceRequest {
  sequence_id: number;
  email?: string;
  subscriber_id?: number;
}

/**
 * Create broadcast request
 */
export interface CreateBroadcastRequest {
  subject: string;
  content?: string;
  description?: string;
  public?: boolean;
  send_at?: string;
  email_layout_template?: string;
  thumbnail_alt?: string;
  thumbnail_url?: string;
}

/**
 * Create tag request
 */
export interface CreateTagRequest {
  name: string;
}

/**
 * Create form request
 */
export interface CreateFormRequest {
  name: string;
  sign_up_button_text?: string;
  success_message?: string;
  redirect_url?: string;
  background_opacity?: number;
  display_title?: boolean;
  title?: string;
  description?: string;
  name_placeholder?: string;
  email_placeholder?: string;
}

// =============================================================================
// Response Interfaces
// =============================================================================

/**
 * ConvertKit API response wrapper
 */
export interface ConvertKitResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Subscribers list response
 */
export interface SubscribersListResponse {
  total_subscribers: number;
  page: number;
  total_pages: number;
  subscribers: ConvertKitSubscriber[];
}

/**
 * Tags list response
 */
export interface TagsListResponse {
  tags: ConvertKitTag[];
}

/**
 * Forms list response
 */
export interface FormsListResponse {
  forms: ConvertKitForm[];
}

/**
 * Sequences list response
 */
export interface SequencesListResponse {
  sequences: ConvertKitSequence[];
}

/**
 * Broadcasts list response
 */
export interface BroadcastsListResponse {
  broadcasts: ConvertKitBroadcast[];
}

/**
 * Custom fields list response
 */
export interface CustomFieldsListResponse {
  custom_fields: ConvertKitCustomField[];
}

/**
 * Subscriber statistics
 */
export interface SubscriberStatsResponse {
  total_subscribers: number;
  active_subscribers: number;
  inactive_subscribers: number;
  bounced_subscribers: number;
  complained_subscribers: number;
  growth_rate: number;
  churn_rate: number;
}

// =============================================================================
// Webhook Interfaces
// =============================================================================

/**
 * ConvertKit webhook subscriber event
 */
export interface ConvertKitWebhookSubscriberEvent {
  id: string;
  event: 'subscriber.subscriber_activate' | 'subscriber.subscriber_unsubscribe' | 'subscriber.subscriber_bounce' | 'subscriber.subscriber_complain';
  created_at: string;
  subscriber: {
    id: number;
    email_address: string;
    first_name?: string;
    state: string;
    created_at: string;
    fields: Record<string, string | number>;
    tags: ConvertKitTag[];
  };
}

/**
 * ConvertKit webhook form event
 */
export interface ConvertKitWebhookFormEvent {
  id: string;
  event: 'subscriber.form_subscribe';
  created_at: string;
  subscriber: ConvertKitSubscriber;
  form: ConvertKitForm;
}

/**
 * ConvertKit webhook sequence event
 */
export interface ConvertKitWebhookSequenceEvent {
  id: string;
  event: 'subscriber.sequence_add' | 'subscriber.sequence_complete';
  created_at: string;
  subscriber: ConvertKitSubscriber;
  sequence: ConvertKitSequence;
}

// =============================================================================
// Persona-Based Interfaces
// =============================================================================

/**
 * User persona types for targeted campaigns
 */
export type UserPersona = 
  | 'struggling_sam'
  | 'ambitious_alex' 
  | 'mindful_maya'
  | 'social_sophie'
  | 'tech_tyler'
  | 'health_hannah'
  | 'student_steve'
  | 'parent_paul'
  | 'senior_sarah'
  | 'entrepreneur_emma';

/**
 * Persona-specific campaign configuration
 */
export interface PersonaCampaignConfig {
  persona: UserPersona;
  tags: string[];
  forms: number[];
  sequences: number[];
  custom_fields: Record<string, string | number>;
  email_preferences: {
    frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
    time_of_day: 'morning' | 'afternoon' | 'evening';
    content_type: 'educational' | 'motivational' | 'promotional' | 'mixed';
  };
}

/**
 * Persona assignment request
 */
export interface PersonaAssignmentRequest {
  email: string;
  persona: UserPersona;
  confidence: number;
  source: 'signup_form' | 'behavior_analysis' | 'survey' | 'manual';
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Analytics Interfaces
// =============================================================================

/**
 * Email campaign analytics
 */
export interface EmailCampaignAnalytics {
  campaign_id: number;
  campaign_name: string;
  campaign_type: 'broadcast' | 'sequence' | 'form';
  sent_at: string;
  total_recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  bounced: number;
  complained: number;
  rates: {
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
    unsubscribe_rate: number;
    bounce_rate: number;
    complaint_rate: number;
  };
  revenue_attribution?: {
    total_revenue: number;
    conversion_count: number;
    average_order_value: number;
  };
}

/**
 * Subscriber engagement metrics
 */
export interface SubscriberEngagementMetrics {
  subscriber_id: number;
  email: string;
  engagement_score: number;
  total_emails_received: number;
  total_emails_opened: number;
  total_clicks: number;
  last_opened_at?: string;
  last_clicked_at?: string;
  favorite_content_topics: string[];
  optimal_send_time: string;
  preferred_frequency: string;
  risk_of_unsubscribe: 'low' | 'medium' | 'high';
}

// =============================================================================
// Service Response Interfaces
// =============================================================================

export interface ConvertKitServiceResponse<T> extends ApiResponse<T> {
  convertKitRequestId?: string;
}

export interface SubscriberServiceResponse {
  subscriber: ConvertKitServiceResponse<ConvertKitSubscriber>;
  subscribers: ConvertKitServiceResponse<SubscribersListResponse>;
  stats: ConvertKitServiceResponse<SubscriberStatsResponse>;
}

export interface CampaignServiceResponse {
  broadcasts: ConvertKitServiceResponse<BroadcastsListResponse>;
  broadcast: ConvertKitServiceResponse<ConvertKitBroadcast>;
  sequences: ConvertKitServiceResponse<SequencesListResponse>;
  analytics: ConvertKitServiceResponse<EmailCampaignAnalytics>;
}

export interface TagServiceResponse {
  tags: ConvertKitServiceResponse<TagsListResponse>;
  tag: ConvertKitServiceResponse<ConvertKitTag>;
}