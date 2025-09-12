/**
 * Mock Data Factories - Main Export File
 *
 * Comprehensive data factories for generating consistent test data
 * across all application entities in the Relife alarm app.
 */

// Core entity factories
export * from './core-factories';
export * from './premium-factories';
export * from './gaming-factories';
export * from './support-factories';

// Factory utilities
export * from './factory-utils';
export { _seedFaker as seedFaker, _resetFaker as resetFaker } from './factory-utils';

// Re-export commonly used factories with convenient names
export {
  _createTestUser as createTestUser,
  _createTestAlarm as createTestAlarm,
  _createTestBattle as createTestBattle,
  _createTestTheme as createTestTheme,
} from './core-factories';

export {
  _createTestSubscription as createTestSubscription,
  _createTestVoice as createTestVoice,
  _createTestCustomSound as createTestCustomSound,
  _createTestAnalytics as createTestAnalytics,
  createTestSubscriptionPlan,
  createTestPaymentMethod,
  createTestPricing,
} from './premium-factories';

export {
  createTestAchievement,
  createTestTournament,
  createTestTeam,
  createTestSeason,
  createTestLeaderboard,
} from './gaming-factories';

export {
  _createTestEmotionalState as createTestEmotionalState,
  _createTestNotification as createTestNotification,
  _createTestAppSettings as createTestAppSettings,
  _createTestMediaAsset as createTestMediaAsset,
  _createTestExternalIntegration as createTestExternalIntegration,
} from './support-factories';
