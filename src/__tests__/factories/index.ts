/**
 * Mock Data Factories - Main Export File
 *
 * Comprehensive data factories for generating consistent test data
 * across all application entities in the Relife alarm app.
 */

// Core entity factories
export * from "./core-factories";
export * from "./premium-factories";
export * from "./gaming-factories";
export * from "./support-factories";

// Factory utilities
export * from "./factory-utils";

// Re-export commonly used factories with convenient names
export {
  createTestUser,
  createTestAlarm,
  createTestBattle,
  createTestTheme,
} from "./core-factories";

export {
  createTestSubscription,
  createTestVoice,
  createTestCustomSound,
  createTestAnalytics,
} from "./premium-factories";

export {
  createTestAchievement,
  createTestTournament,
  createTestTeam,
  createTestSeason,
  createTestLeaderboard,
} from "./gaming-factories";

export {
  createTestEmotionalState,
  createTestNotification,
  createTestAppSettings,
  createTestMediaAsset,
  createTestExternalIntegration,
} from "./support-factories";
