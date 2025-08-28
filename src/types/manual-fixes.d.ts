/**
 * Domain Interface Re-exports
 * 
 * This file re-exports all domain interfaces from the centralized domain.ts file
 * to maintain backward compatibility while providing proper type safety.
 */

// Re-export all domain interfaces
export * from './domain';

// Legacy compatibility exports (deprecated - use domain.ts imports instead)
export type { 
  Alarm,
  User, 
  Subscription,
  SubscriptionTier,
  Theme,
  Battle,
  BattleSettings,
  BattleParticipantStats,
  PremiumFeatureAccess,
  PersonalizationSettings,
  SmartAlarmSettings
} from './domain';
