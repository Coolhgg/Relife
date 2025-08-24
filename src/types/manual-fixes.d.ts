/**
 * Manual Fixes - Placeholder Types
 *
 * This file contains safe placeholder types for custom domain types that
 * may be referenced but not yet fully defined. These are temporary stubs
 * to prevent TypeScript compilation errors.
 */

// Subscription tier placeholder
export type SubscriptionTier = 'free' | 'premium' | 'pro' | string;

// Generic alarm interface placeholder
export interface Alarm {
  [key: string]: any;
}

// Generic theme interface placeholder
export interface Theme {
  [key: string]: any;
}

// Additional placeholder types that might be needed
export interface User {
  [key: string]: any;
}

export interface Battle {
  [key: string]: any;
}

export interface Subscription {
  [key: string]: any;
}

export interface PremiumFeatureAccess {
  [key: string]: any;
}

export interface PersonalizationSettings {
  [key: string]: any;
}

export interface SmartAlarmSettings {
  [key: string]: any;
}

export interface BattleParticipantStats {
  [key: string]: any;
}

export interface BattleSettings {
  [key: string]: any;
}
