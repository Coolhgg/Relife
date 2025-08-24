/**
 * Supabase API Interface Definitions
 * Comprehensive typing for database operations and authentication
 */

import { ApiResponse, PaginationParams, PaginatedResponse } from './api';

// =============================================================================
// Database Table Interfaces
// =============================================================================

/**
 * Database user profile
 */
export interface DatabaseUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  preferences: Record<string, unknown>;
  subscription_tier: 'free' | 'premium' | 'enterprise';
  subscription_status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  email_confirmed: boolean;
  phone?: string;
  timezone?: string;
  feature_flags: string[];
}

/**
 * Database alarm record
 */
export interface DatabaseAlarm {
  id: string;
  user_id: string;
  name: string;
  time: string;
  days: number[];
  enabled: boolean;
  sound_id?: string;
  volume: number;
  snooze_enabled: boolean;
  snooze_minutes: number;
  battle_enabled: boolean;
  recurring: boolean;
  timezone?: string;
  created_at: string;
  updated_at: string;
  last_triggered_at?: string;
  metadata: Record<string, unknown>;
}

/**
 * Database alarm event log
 */
export interface DatabaseAlarmEvent {
  id: string;
  alarm_id: string;
  user_id: string;
  event_type: 'triggered' | 'snoozed' | 'dismissed' | 'missed';
  event_time: string;
  metadata: {
    snooze_count?: number;
    snooze_minutes?: number;
    wake_time?: string;
    battle_result?: 'won' | 'lost' | 'abandoned';
  };
  created_at: string;
}

/**
 * Database battle record
 */
export interface DatabaseBattle {
  id: string;
  name: string;
  description?: string;
  type: 'challenge' | 'tournament' | 'friendly';
  creator_id: string;
  status: 'waiting' | 'active' | 'completed' | 'canceled';
  max_participants: number;
  current_participants: number;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  is_public: boolean;
  rules: Record<string, unknown>;
  prize_pool?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Database battle participant
 */
export interface DatabaseBattleParticipant {
  id: string;
  battle_id: string;
  user_id: string;
  joined_at: string;
  wake_time?: string;
  wake_proof?: {
    type: 'photo' | 'location' | 'challenge';
    data: string;
    verified: boolean;
  };
  status: 'joined' | 'woke' | 'missed' | 'disqualified';
  rank?: number;
  points?: number;
}

/**
 * Database subscription record
 */
export interface DatabaseSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan_id: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Authentication Interfaces
// =============================================================================

/**
 * Supabase sign up request
 */
export interface SupabaseSignUpRequest {
  email: string;
  password: string;
  options?: {
    data?: {
      name?: string;
      avatar_url?: string;
      [key: string]: unknown;
    };
    emailRedirectTo?: string;
  };
}

/**
 * Supabase sign in request
 */
export interface SupabaseSignInRequest {
  email: string;
  password: string;
  options?: {
    emailRedirectTo?: string;
    shouldCreateUser?: boolean;
  };
}

/**
 * Supabase OAuth provider sign in
 */
export interface SupabaseOAuthSignInRequest {
  provider: 'github' | 'google' | 'apple' | 'facebook' | 'twitter' | 'discord';
  options?: {
    redirectTo?: string;
    scopes?: string;
    queryParams?: Record<string, string>;
  };
}

/**
 * Supabase password reset request
 */
export interface SupabasePasswordResetRequest {
  email: string;
  options?: {
    redirectTo?: string;
  };
}

/**
 * Supabase update user request
 */
export interface SupabaseUpdateUserRequest {
  email?: string;
  password?: string;
  data?: {
    name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
}

// =============================================================================
// Database Query Interfaces
// =============================================================================

/**
 * Supabase filter operators
 */
export type SupabaseFilterOperator = 
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'like' | 'ilike' | 'is' | 'in' | 'contains'
  | 'containedBy' | 'rangeGt' | 'rangeGte'
  | 'rangeLt' | 'rangeLte' | 'rangeAdjacent'
  | 'overlaps' | 'strictlyLeft' | 'strictlyRight'
  | 'notStrictlyRight' | 'notStrictlyLeft'
  | 'textSearch' | 'match';

/**
 * Supabase query filter
 */
export interface SupabaseQueryFilter {
  column: string;
  operator: SupabaseFilterOperator;
  value: unknown;
}

/**
 * Supabase query options
 */
export interface SupabaseQueryOptions {
  select?: string;
  filters?: SupabaseQueryFilter[];
  order?: Array<{
    column: string;
    ascending?: boolean;
    nullsFirst?: boolean;
  }>;
  range?: {
    from: number;
    to: number;
  };
  limit?: number;
  single?: boolean;
  count?: 'exact' | 'planned' | 'estimated';
}

/**
 * Bulk operation request
 */
export interface SupabaseBulkRequest<T> {
  data: T[];
  options?: {
    upsert?: boolean;
    onConflict?: string;
    ignoreDuplicates?: boolean;
  };
}

/**
 * Bulk operation response
 */
export interface SupabaseBulkResponse<T> {
  data: T[];
  error: {
    message: string;
    details: string;
    hint: string;
    code: string;
  } | null;
  count: number;
  success: boolean;
  failed: Array<{
    index: number;
    error: string;
    data: T;
  }>;
}

// =============================================================================
// Real-time Subscription Interfaces
// =============================================================================

/**
 * Supabase real-time subscription configuration
 */
export interface SupabaseSubscriptionConfig {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  table?: string;
  filter?: string;
}

/**
 * Supabase real-time message
 */
export interface SupabaseRealtimeMessage<T = unknown> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  commit_timestamp: string;
  new: T | null;
  old: T | null;
  errors: string[] | null;
}

/**
 * Supabase real-time subscription
 */
export interface SupabaseRealtimeSubscription {
  id: string;
  callback: (payload: SupabaseRealtimeMessage) => void;
  unsubscribe: () => void;
}

// =============================================================================
// Storage Interfaces
// =============================================================================

/**
 * Supabase file upload request
 */
export interface SupabaseFileUploadRequest {
  bucket: string;
  path: string;
  file: File | Blob;
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  };
}

/**
 * Supabase file upload response
 */
export interface SupabaseFileUploadResponse {
  data: {
    path: string;
    id: string;
    fullPath: string;
  } | null;
  error: {
    message: string;
    statusCode?: string;
  } | null;
}

/**
 * Supabase file metadata
 */
export interface SupabaseFileMetadata {
  name: string;
  bucket_id: string;
  owner: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

/**
 * Supabase signed URL request
 */
export interface SupabaseSignedUrlRequest {
  bucket: string;
  path: string;
  expiresIn: number;
  options?: {
    download?: boolean;
    transform?: {
      width?: number;
      height?: number;
      resize?: 'cover' | 'contain' | 'fill';
      format?: 'webp' | 'png' | 'jpg';
      quality?: number;
    };
  };
}

// =============================================================================
// Service Response Interfaces
// =============================================================================

/**
 * Supabase service response wrapper
 */
export interface SupabaseServiceResponse<T> extends ApiResponse<T> {
  postgrestStatus?: number;
  count?: number;
}

/**
 * Alarm service responses
 */
export interface AlarmServiceResponse {
  alarms: ApiResponse<DatabaseAlarm[]>;
  alarm: ApiResponse<DatabaseAlarm>;
  events: ApiResponse<DatabaseAlarmEvent[]>;
}

/**
 * User service responses
 */
export interface UserServiceResponse {
  profile: ApiResponse<DatabaseUser>;
  stats: ApiResponse<{
    totalAlarms: number;
    activeAlarms: number;
    completedAlarms: number;
    streakDays: number;
    battlesWon: number;
    battlesTotal: number;
    joinDate: string;
    lastActiveDate: string;
  }>;
  preferences: ApiResponse<Record<string, unknown>>;
}

/**
 * Battle service responses
 */
export interface BattleServiceResponse {
  battles: ApiResponse<DatabaseBattle[]>;
  battle: ApiResponse<DatabaseBattle & { participants: DatabaseBattleParticipant[] }>;
  leaderboard: ApiResponse<Array<{
    user: DatabaseUser;
    participant: DatabaseBattleParticipant;
  }>>;
}

// =============================================================================
// Connection Pool and Performance
// =============================================================================

/**
 * Supabase connection configuration
 */
export interface SupabaseConnectionConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  options?: {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
      storage?: Storage;
    };
    db?: {
      schema?: string;
    };
    realtime?: {
      params?: Record<string, string>;
      headers?: Record<string, string>;
    };
    global?: {
      fetch?: typeof fetch;
      headers?: Record<string, string>;
    };
  };
}

/**
 * Connection pool statistics
 */
export interface SupabaseConnectionStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  maxConnections: number;
  connectionTime: {
    min: number;
    max: number;
    average: number;
  };
  queryTime: {
    min: number;
    max: number;
    average: number;
  };
}

/**
 * Performance metrics for Supabase operations
 */
export interface SupabasePerformanceMetrics {
  operation: string;
  table: string;
  duration: number;
  rowsAffected: number;
  timestamp: string;
  success: boolean;
  error?: string;
  queryPlan?: {
    cost: number;
    rows: number;
    planTime: number;
    executionTime: number;
  };
}