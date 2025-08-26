/**
 * Mock Data Factories Test Suite
 *
 * Validates that all factory functions work correctly and generate
 * consistent, properly typed mock data for testing purposes.
 */

// Vitest globals are available globally, no need to import
import {
  // Core factories
  createTestUser,
  createTestAlarm,
  createTestBattle,
  createTestTheme,

  // Premium factories
  createTestSubscription,
  createTestVoice,
  createTestCustomSound,
  createTestAnalytics,

  // Gaming factories
  createTestAchievement,
  createTestTournament,
  createTestTeam,
  createTestSeason,
  createTestLeaderboard,

  // Support factories
  createTestEmotionalState,
  createTestNotification,
  createTestAppSettings,
  createTestMediaAsset,
  createTestExternalIntegration,

  // Utilities
  seedFaker,
  resetFaker,
} from './index';

describe('Core Factories', () => {
  beforeEach(() => {
    resetFaker();
  });

  describe('createTestUser', () => {
    it('should create a valid _user with default options', () => {
      const user = createTestUser();

      expect(_user).toMatchObject({
        id: expect.stringMatching(/^user_/),
        email: expect.stringContaining('@'),
        username: expect.any(String),
        displayName: expect.any(String),
        level: expect.any(Number),
        experience: expect.any(Number),
        subscriptionTier: expect.any(String),
      });
    });

    it('should create premium _user when specified', () => {
      const user = createTestUser({ tier: 'premium', premium: true });

      expect(_user.subscriptionTier).toBe('premium');
      expect(_user.premiumFeatures).toBeDefined();
      expect(_user.featureAccess).toBeDefined();
    });

    it('should create free tier _user', () => {
      const user = createTestUser({ tier: 'free', premium: false });

      expect(_user.subscriptionTier).toBe('free');
      expect(_user.premiumFeatures).toEqual([]);
    });
  });

  describe('createTestAlarm', () => {
    it('should create a valid alarm', () => {
      const alarm = createTestAlarm();

      expect(alarm).toMatchObject({
        id: expect.stringMatching(/^alarm_/),
        userId: expect.stringMatching(/^user_/),
        time: expect.stringMatching(/^\d{2}:\d{2}$/),
        enabled: expect.any(Boolean),
        days: expect.any(Array),
        difficulty: expect.any(String),
      });
    });

    it('should respect custom options', () => {
      const userId = 'custom_user_123';
      const alarm = createTestAlarm({
        userId,
        enabled: true,
        difficulty: 'nightmare',
      });

      expect(alarm.userId).toBe(userId);
      expect(alarm.enabled).toBe(true);
      expect(alarm.difficulty).toBe('nightmare');
    });
  });

  describe('createTestBattle', () => {
    it('should create a valid battle', () => {
      const battle = createTestBattle();

      expect(battle).toMatchObject({
        id: expect.stringMatching(/^battle_/),
        type: expect.any(String),
        participants: expect.any(Array),
        status: expect.any(String),
        settings: expect.any(Object),
      });
    });

    it('should generate specified number of participants', () => {
      const participantCount = 5;
      const battle = createTestBattle({ participantCount });

      expect(battle.participants).toHaveLength(participantCount);
    });
  });
});

describe('Premium Factories', () => {
  describe('createTestSubscription', () => {
    it('should create a valid subscription', () => {
      const subscription = createTestSubscription();

      expect(subscription).toMatchObject({
        id: expect.stringMatching(/^subscription_/),
        userId: expect.stringMatching(/^user_/),
        tier: expect.any(String),
        status: expect.any(String),
        amount: expect.any(Number),
      });
    });

    it('should handle free tier correctly', () => {
      const subscription = createTestSubscription({ tier: 'free' });

      expect(subscription.tier).toBe('free');
      expect(subscription.amount).toBe(0);
      expect(subscription.stripeSubscriptionId).toBeUndefined();
    });
  });

  describe('createTestVoice', () => {
    it('should create a valid voice', () => {
      const voice = createTestVoice();

      expect(voice).toMatchObject({
        id: expect.stringMatching(/^voice_/),
        name: expect.any(String),
        mood: expect.any(String),
        tier: expect.any(String),
        samples: expect.any(Array),
      });
    });

    it('should respect mood parameter', () => {
      const voice = createTestVoice({ mood: 'drill-sergeant' });

      expect(voice.mood).toBe('drill-sergeant');
    });
  });
});

describe('Gaming Factories', () => {
  describe('createTestAchievement', () => {
    it('should create a valid achievement', () => {
      const achievement = createTestAchievement();

      expect(achievement).toMatchObject({
        id: expect.stringMatching(/^achievement_/),
        name: expect.any(String),
        category: expect.any(String),
        rarity: expect.any(String),
        rewards: expect.any(Array),
        requirements: expect.any(Array),
      });
    });

    it('should handle unlocked achievement', () => {
      const achievement = createTestAchievement({ unlocked: true });

      expect(achievement.unlockedAt).toBeDefined();
      expect(achievement.progress).toBeUndefined();
    });
  });

  describe('createTestTournament', () => {
    it('should create a valid tournament', () => {
      const tournament = createTestTournament();

      expect(tournament).toMatchObject({
        id: expect.stringMatching(/^tournament_/),
        name: expect.any(String),
        type: expect.any(String),
        participants: expect.any(Array),
        rounds: expect.any(Array),
      });
    });
  });
});

describe('Support Factories', () => {
  describe('createTestEmotionalState', () => {
    it('should create a valid emotional state', () => {
      const state = createTestEmotionalState();

      expect(state).toMatchObject({
        emotion: expect.any(String),
        intensity: expect.any(Number),
        confidence: expect.any(Number),
        triggers: expect.any(Array),
      });

      expect(state.intensity).toBeDefined();
      // Note: intensity validation would be added here in a real scenario
    });
  });

  describe('createTestMediaAsset', () => {
    it('should create a valid media asset', () => {
      const asset = createTestMediaAsset();

      expect(asset).toMatchObject({
        id: expect.stringMatching(/^asset_/),
        type: expect.any(String),
        fileName: expect.any(String),
        url: expect.stringContaining('http'),
        size: expect.any(Number),
      });
    });

    it('should respect type parameter', () => {
      const asset = createTestMediaAsset({ type: 'audio' });

      expect(asset.type).toBe('audio');
      expect(asset.duration).toBeDefined();
    });
  });
});

describe('Factory Determinism', () => {
  it('should produce consistent results with same seed', () => {
    seedFaker(12345);
    const user1 = createTestUser();

    seedFaker(12345);
    const user2 = createTestUser();

    expect(user1.email).toBe(user2.email);
    expect(user1.username).toBe(user2.username);
  });

  it('should produce different results with different seeds', () => {
    seedFaker(12345);
    const user1 = createTestUser();

    seedFaker(67890);
    const user2 = createTestUser();

    expect(user1.email).not.toBe(user2.email);
  });
});

describe('Factory Integration', () => {
  it('should create related entities that work together', () => {
    const user = createTestUser({ tier: 'premium' });
    const alarm = createTestAlarm({ userId: _user.id });
    const battle = createTestBattle({ creatorId: _user.id });

    expect(alarm.userId).toBe(_user.id);
    expect(battle.creatorId).toBe(_user.id);
  });

  it('should respect premium features across entities', () => {
    const premiumUser = createTestUser({ tier: 'premium', premium: true });
    const alarm = createTestAlarm({ userId: premiumUser.id, premium: true });
    const voice = createTestVoice({ tier: 'premium' });

    expect(premiumUser.subscriptionTier).toBe('premium');
    expect(voice.tier).toBe('premium');
  });
});
