// Advanced TypeScript Utility Types
// Provides sophisticated type utilities for complex type scenarios

/**
 * DeepPartial - Makes all properties of T optional recursively
 * Useful for test factories and partial updates
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? T[P] extends Array<infer U>
      ? Array<DeepPartial<U>>
      : DeepPartial<T[P]>
    : T[P];
};

/**
 * Exact - Prevents excess properties beyond what's defined in T
 * Useful for strict object validation
 */
export type Exact<T> = T extends infer U
  ? U & Record<Exclude<keyof U, keyof T>, never>
  : never;

/**
 * Branded types for type-safe identifiers
 * Prevents mixing different types of IDs
 */
declare const __brand: unique symbol;
export type Branded<T, B> = T & { readonly [__brand]: B };

// Specific ID types
export type UserId = Branded<string, 'UserId'>;
export type AlarmId = Branded<string, 'AlarmId'>;
export type BattleId = Branded<string, 'BattleId'>;
export type ThemeId = Branded<string, 'ThemeId'>;
export type SubscriptionId = Branded<string, 'SubscriptionId'>;

/**
 * Result pattern for better error handling
 * Alternative to throwing exceptions
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * NonEmptyArray - Guarantees array has at least one element
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Optional - Makes specific properties optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * RequiredBy - Makes specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * StrictOmit - Omit that ensures K exists in T
 */
export type StrictOmit<T, K extends keyof T> = Omit<T, K>;

/**
 * StrictPick - Pick that ensures K exists in T  
 */
export type StrictPick<T, K extends keyof T> = Pick<T, K>;

/**
 * ValueOf - Gets union of all values in an object type
 */
export type ValueOf<T> = T[keyof T];

/**
 * KeysOfType - Gets keys of T where value is assignable to U
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Flatten - Flattens nested object types
 */
export type Flatten<T> = {
  [K in keyof T]: T[K];
};

/**
 * DeepReadonly - Makes all properties readonly recursively
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Array<infer U>
      ? readonly DeepReadonly<U>[]
      : DeepReadonly<T[P]>
    : T[P];
};

/**
 * Mutable - Removes readonly modifiers
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * DeepMutable - Removes readonly modifiers recursively
 */
export type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Array<infer U>
      ? Array<DeepMutable<U>>
      : DeepMutable<T[P]>
    : T[P];
};

/**
 * PartialBy - Makes specific properties partial
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Writeable - Removes readonly from specific properties
 */
export type Writeable<T, K extends keyof T> = Omit<T, K> & {
  -readonly [P in K]: T[P];
};

// Factory function type utilities
export type FactoryOptions<T> = DeepPartial<T> & {
  // Allow override of any property with specific values
  overrides?: Partial<T>;
};

export type FactoryFunction<T, TOptions = FactoryOptions<T>> = (
  options?: TOptions
) => T;

// Event handler type utilities
export type EventHandler<TElement = Element, TEvent = Event> = (
  this: TElement,
  ev: TEvent
) => void | boolean;

export type AsyncEventHandler<TElement = Element, TEvent = Event> = (
  this: TElement,
  ev: TEvent
) => Promise<void | boolean>;

// API response type utilities  
export type ApiResponse<T> = Result<T, {
  code: string;
  message: string;
  details?: unknown;
}>;

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

// Validation type utilities
export type ValidationRule<T> = (value: T) => Result<T, string>;
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

// Type guards utilities
export type TypeGuard<T> = (value: unknown) => value is T;
export type AsyncTypeGuard<T> = (value: unknown) => Promise<boolean>;

// Configuration type utilities
export type ConfigKey = string;
export type ConfigValue = string | number | boolean | object | null;
export type Config = Record<ConfigKey, ConfigValue>;

// Discriminated union utilities
export type Discriminated<T, K extends keyof T> = T extends Record<K, infer D>
  ? T & Record<K, D>
  : never;

// Brand utility functions
export const createBrandedId = <B>(prefix: string) => (id: string): Branded<string, B> => 
  `${prefix}_${id}` as Branded<string, B>;

export const extractIdFromBranded = <B>(brandedId: Branded<string, B>): string =>
  brandedId.toString().split('_').slice(1).join('_');

// Result utility functions
export const success = <T>(data: T): Result<T> => ({ success: true, data });
export const failure = <E = Error>(error: E): Result<never, E> => ({ success: false, error });

// Capacitor event types
export interface CapacitorBackButtonEvent {
  canGoBack: boolean;
}

export interface CapacitorAppUrlOpenEvent {
  url: string;
}

export interface CapacitorNetworkEvent {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
}

export interface CapacitorBatteryEvent {
  batteryLevel: number;
  isCharging: boolean;
}

// Security event types
export interface SecurityAlertDetail {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  timestamp: string;
  userId?: string;
  alarmId?: string;
  metadata?: Record<string, unknown>;
}

export interface SecurityAlertEvent extends CustomEvent {
  detail: SecurityAlertDetail;
}

export interface AlarmTamperDetail {
  alarmId: string;
  tamperType: 'physical' | 'digital' | 'network' | 'unknown';
  timestamp: string;
  userId?: string;
  severity: 'medium' | 'high' | 'critical';
}

export interface AlarmTamperEvent extends CustomEvent {
  detail: AlarmTamperDetail;
}

// Discriminated union types for Personas
export type PersonaProfileDiscriminated = 
  | {
      kind: 'struggling_sam';
      tier: 'free';
      supportLevel: 'high';
      conversionUrgency: 'low';
    }
  | {
      kind: 'busy_ben';
      tier: 'basic' | 'premium';
      supportLevel: 'medium';
      conversionUrgency: 'medium';
      timeConstraints: 'high';
    }
  | {
      kind: 'professional_paula';
      tier: 'premium' | 'pro';
      supportLevel: 'low';
      conversionUrgency: 'high';
      businessFocused: true;
    }
  | {
      kind: 'enterprise_emma';
      tier: 'pro';
      supportLevel: 'dedicated';
      conversionUrgency: 'high';
      teamSize: number;
      complianceRequired: boolean;
    }
  | {
      kind: 'student_sarah';
      tier: 'student';
      supportLevel: 'medium';
      conversionUrgency: 'low';
      graduationYear?: number;
      discountEligible: true;
    }
  | {
      kind: 'lifetime_larry';
      tier: 'lifetime';
      supportLevel: 'low';
      conversionUrgency: 'none';
      paymentPreference: 'one_time';
    };

// Type checking utilities
export const isResult = <T, E>(value: unknown): value is Result<T, E> =>
  typeof value === 'object' &&
  value !== null &&
  'success' in value &&
  typeof value.success === 'boolean';

export const isSuccess = <T, E>(result: Result<T, E>): result is { success: true; data: T } =>
  result.success;

export const isFailure = <T, E>(result: Result<T, E>): result is { success: false; error: E } =>
  !result.success;// Webhook event types
export interface StripeWebhookEvent {
  id: string;
  object: 'event';
  type: 'customer.subscription.updated' | 'customer.subscription.deleted' | 'customer.subscription.created' | 'invoice.payment_succeeded' | 'invoice.payment_failed' | 'payment_method.attached';
  data: {
    object: Record<string, unknown>;
  };
  created: number;
  livemode: boolean;
}
