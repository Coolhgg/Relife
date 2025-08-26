/**
 * Common Type Definitions
 *
 * This file contains common types that replace frequent 'any' usage patterns
 * throughout the codebase, particularly for testing, mocks, and generic operations.
 */

// Generic data types for mock stores and database operations
export interface MockDataRecord {
  id: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export type MockDataStore = Record<string, MockDataRecord[]>;

// Authentication related types
export interface MockAuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MockAuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: MockAuthUser;
}

export interface MockAuthState {
  user: MockAuthUser | null;
  session: MockAuthSession | null;
  isAuthenticated: boolean;
}

// Database query types
export interface QueryOptions {
  ascending?: boolean;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

export interface DatabaseResponse<T = unknown> {
  data: T;
  error: Error | null;
}

export interface SelectQuery<T = MockDataRecord> {
  eq: (column: string, value: unknown) => Promise<DatabaseResponse<T | null>>;
  neq: (column: string, value: unknown) => SelectQuery<T>;
  gt: (column: string, value: unknown) => SelectQuery<T>;
  gte: (column: string, value: unknown) => SelectQuery<T>;
  lt: (column: string, value: unknown) => SelectQuery<T>;
  lte: (column: string, value: unknown) => SelectQuery<T>;
  like: (column: string, pattern: string) => SelectQuery<T>;
  ilike: (column: string, pattern: string) => SelectQuery<T>;
  in: (column: string, values: unknown[]) => SelectQuery<T>;
  single: () => Promise<DatabaseResponse<T | null>>;
  limit: (count: number) => SelectQuery<T>;
  order: (column: string, options?: QueryOptions) => SelectQuery<T>;
}

// Analytics and tracking types
export interface AnalyticsProperties {
  [key: string]: string | number | boolean | Date | null | undefined;
}

export interface AnalyticsTraits {
  name?: string;
  email?: string;
  userId?: string;
  [key: string]: string | number | boolean | Date | null | undefined;
}

export interface AnalyticsEvent {
  event: string;
  properties?: AnalyticsProperties;
  timestamp?: Date;
  userId?: string;
  anonymousId?: string;
}

export interface AnalyticsData {
  events: AnalyticsEvent[];
  pageViews: number;
  sessions: number;
  users: number;
  conversionRate?: number;
  avgSessionDuration?: number;
}

// Service mock types
export interface ServiceCallHistory {
  method: string;
  args: unknown[];
  timestamp: number;
  result?: unknown;
  error?: Error;
}

export interface MockServiceBase {
  callHistory: ServiceCallHistory[];
  lastCall?: ServiceCallHistory;
  reset(): void;
  getCallHistory(): ServiceCallHistory[];
}

// Battle/Gaming types
export interface BattleConfig {
  id: string;
  name: string;
  description?: string;
  type: 'individual' | 'team' | 'tournament';
  maxParticipants: number;
  startTime: Date;
  endTime: Date;
  rules?: Record<string, unknown>;
  rewards?: BattleReward[];
}

export interface BattleParticipant {
  userId: string;
  username: string;
  score: number;
  rank?: number;
  joinedAt: Date;
  status: 'active' | 'eliminated' | 'completed';
}

export interface BattleReward {
  id: string;
  type: 'points' | 'badge' | 'item';
  name: string;
  value: number;
  condition: 'winner' | 'participant' | 'top_3' | 'top_10';
}

export interface Battle {
  id: string;
  config: BattleConfig;
  participants: BattleParticipant[];
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Alarm types (enhanced)
export interface AlarmData {
  id: string;
  time: string;
  label?: string;
  days?: number[];
  sound?: string;
  isActive: boolean;
  snoozeEnabled?: boolean;
  snoozeInterval?: number;
  maxSnoozes?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'nuclear';
  battleId?: string;
  voiceMood?: 'gentle' | 'energetic' | 'stern' | 'playful';
  weatherEnabled?: boolean;
  locationTriggers?: LocationTrigger[];
  created_at?: string;
  updated_at?: string;
  userId?: string;
}

export interface LocationTrigger {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  action: 'enable' | 'disable' | 'adjust_time' | 'notify';
  parameters?: Record<string, unknown>;
}

// Reward system types
export interface RewardCondition {
  type: 'streak' | 'count' | 'time' | 'battle_win' | 'achievement';
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
  value: number | string;
  metadata?: Record<string, unknown>;
}

export interface RewardData {
  id: string;
  type: 'badge' | 'points' | 'item' | 'unlock';
  name: string;
  description: string;
  iconUrl?: string;
  value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  conditions: RewardCondition[];
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserReward {
  id: string;
  userId: string;
  rewardId: string;
  grantedAt: Date;
  grantedBy?: string;
  reason?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  source: string;
  description?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Generic API response types
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Event handler types
export type EventHandler<T = unknown> = (event: T) => void;
export type AsyncEventHandler<T = unknown> = (event: T) => Promise<void>;

// Generic callback types
export type CallbackFunction<TArgs extends unknown[] = [], TReturn = void> = (
  ...args: TArgs
) => TReturn;

export type AsyncCallbackFunction<TArgs extends unknown[] = [], TReturn = void> = (
  ...args: TArgs
) => Promise<TReturn>;

// Utility types for forms and inputs
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface FormFieldError {
  field: string;
  message: string;
  code?: string;
}

export interface FormState<T = Record<string, unknown>> {
  values: T;
  errors: FormFieldError[];
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

// Theme and customization types
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent?: string;
  background: string;
  foreground: string;
  muted?: string;
  border?: string;
  [key: string]: string | undefined;
}

export interface ThemeData {
  id: string;
  name: string;
  description?: string;
  colors: ThemeColors;
  typography?: Record<string, unknown>;
  spacing?: Record<string, unknown>;
  animations?: Record<string, unknown>;
  isCustom?: boolean;
  created_at?: string;
  updated_at?: string;
  userId?: string;
}

// Generic filter and search types
export interface FilterCriteria {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: unknown;
}

export interface SearchParams {
  query?: string;
  filters?: FilterCriteria[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult<T = unknown> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Cache and storage types
export interface CacheEntry<T = unknown> {
  value: T;
  timestamp: Date;
  ttl: number;
  metadata?: Record<string, unknown>;
}

export interface StorageAdapter {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

// Generic service configuration
export interface ServiceConfiguration {
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  rateLimiting?: {
    requests: number;
    window: number;
  };
  caching?: {
    enabled: boolean;
    ttl?: number;
  };
  [key: string]: unknown;
}
