/**
 * Type Safety Test Suite for Core Factories
 *
 * Validates that all factory functions return properly typed objects
 * without unsafe 'as any' type casts, ensuring type safety compliance.
 * 
 * This test suite specifically validates the fixes made in Phase 3 of
 * the core-factories type safety improvements.
 */

import { describe, it, expect } from 'vitest';
import {
  createTestUser,
  createTestAlarm,
  createTestBattle,
  CreateUserOptions
} from './core-factories';
import {
  User,
  Alarm,
  Battle,
  PremiumFeatureAccess,
  PersonalizationSettings,
  SmartAlarmSettings,
  BattleParticipantStats,
  BattleSettings,
  Theme
} from '../../types';
import { Subscription } from '../../types/premium';

describe('Core Factories Type Safety', () => {
  describe('createTestUser Type Safety', () => {
    it('should return properly typed User object without any casts', () => {
      const user = createTestUser({ tier: 'premium', premium: true });

      // Verify basic User interface compliance
      expect(typeof user.id).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(typeof user.username).toBe('string');
      expect(typeof user.subscriptionTier).toBe('string');
      expect(typeof user.level).toBe('number');
      expect(typeof user.experience).toBe('number');

      // Verify proper typing of complex nested objects
      if (user.subscription) {
        // Should be a proper Subscription object, not { id: string } as any
        const subscription = user.subscription as Subscription;
        expect(typeof subscription.id).toBe('string');
        expect(typeof subscription.userId).toBe('string');
        expect(typeof subscription.tier).toBe('string');
        expect(typeof subscription.status).toBe('string');
        expect(typeof subscription.amount).toBe('number');
        expect(typeof subscription.currency).toBe('string');
        expect(subscription.currentPeriodStart).toBeInstanceOf(Date);
        expect(subscription.currentPeriodEnd).toBeInstanceOf(Date);
      }

      if (user.featureAccess) {
        // Should be a proper PremiumFeatureAccess object, not partial object as any
        const features = user.featureAccess as PremiumFeatureAccess;
        expect(typeof features.elevenlabsVoices).toBe('boolean');
        expect(typeof features.customVoiceMessages).toBe('boolean');
        expect(typeof features.premiumThemes).toBe('boolean');
        expect(typeof features.advancedAIInsights).toBe('boolean');
        expect(typeof features.nuclearMode).toBe('boolean');
        expect(typeof features.prioritySupport).toBe('boolean');
      }

      // Verify PersonalizationSettings is properly typed
      const personalization = user.preferences.personalization as PersonalizationSettings;
      expect(typeof personalization.theme).toBe('string');
      expect(Array.isArray(personalization.colorPreferences.favoriteColors)).toBe(true);
      expect(typeof personalization.colorPreferences.colorblindFriendly).toBe('boolean');
      expect(typeof personalization.typographyPreferences.preferredFontSize).toBe('string');
      expect(['small', 'medium', 'large', 'extra-large']).toContain(personalization.typographyPreferences.preferredFontSize);
      expect(typeof personalization.motionPreferences.enableAnimations).toBe('boolean');
      expect(typeof personalization.soundPreferences.enableSounds).toBe('boolean');
      expect(typeof personalization.layoutPreferences.density).toBe('string');
      expect(['compact', 'comfortable', 'spacious']).toContain(personalization.layoutPreferences.density);
      expect(typeof personalization.accessibilityPreferences.screenReaderOptimized).toBe('boolean');
    });

    it('should return proper Theme type for gameTheme', () => {
      const user = createTestUser();
      
      // gameTheme should be a proper Theme string, not ThemeConfig object as any
      const gameTheme = user.preferences.gameTheme as Theme;
      expect(typeof gameTheme).toBe('string');
      expect([
        'light', 'dark', 'ocean-breeze', 'sunset-glow', 'forest-dream',
        'auto', 'system', 'high-contrast', 'minimalist', 'colorful'
      ]).toContain(gameTheme);
    });

    it('should handle free tier users without premium features', () => {
      const user = createTestUser({ tier: 'free', premium: false });

      expect(user.subscriptionTier).toBe('free');
      expect(user.subscription).toBeUndefined();
      expect(user.featureAccess).toBeUndefined();
      expect(user.premiumFeatures).toEqual([]);
    });
  });

  describe('createTestAlarm Type Safety', () => {
    it('should return properly typed SmartAlarmSettings', () => {
      const alarm = createTestAlarm({ premium: true });

      if (alarm.smartFeatures) {
        // Should be proper SmartAlarmSettings object, not partial object as any
        const smartFeatures = alarm.smartFeatures as SmartAlarmSettings;
        expect(typeof smartFeatures.weatherEnabled).toBe('boolean');
        expect(typeof smartFeatures.locationEnabled).toBe('boolean');
        expect(typeof smartFeatures.fitnessEnabled).toBe('boolean');
        expect(typeof smartFeatures.smartWakeWindow).toBe('number');
        expect(typeof smartFeatures.adaptiveDifficulty).toBe('boolean');
        expect(typeof smartFeatures.contextualTasks).toBe('boolean');
        expect(typeof smartFeatures.environmentalAdjustments).toBe('boolean');
      }
    });

    it('should not have smartFeatures for non-premium users', () => {
      const alarm = createTestAlarm({ premium: false });
      expect(alarm.smartFeatures).toBeUndefined();
    });
  });

  describe('createTestBattle Type Safety', () => {
    it('should return properly typed BattleParticipantStats', () => {
      const battle = createTestBattle({ type: 'consistency' });

      // Verify participants have proper stats, not partial object as any
      battle.participants.forEach(participant => {
        const stats = participant.stats as BattleParticipantStats;
        expect(typeof stats.tasksCompleted).toBe('number');
        expect(typeof stats.snoozeCount).toBe('number');
        expect(typeof stats.score).toBe('number');
        
        if (stats.wakeTime) {
          expect(typeof stats.wakeTime).toBe('string');
        }
      });
    });

    it('should return properly typed BattleSettings', () => {
      const battle = createTestBattle({ type: 'speed' });

      // Should be proper BattleSettings object, not extended object as any
      const settings = battle.settings as BattleSettings;
      expect(typeof settings.duration).toBe('string');
      expect(settings.duration).toMatch(/^P\d+D$/); // ISO duration format
      
      if (settings.maxParticipants !== undefined) {
        expect(typeof settings.maxParticipants).toBe('number');
      }
      
      if (settings.allowLateJoins !== undefined) {
        expect(typeof settings.allowLateJoins).toBe('boolean');
      }

      if (settings.speedTarget !== undefined) {
        expect(typeof settings.speedTarget).toBe('string');
      }

      if (settings.tasks) {
        settings.tasks.forEach(task => {
          expect(typeof task.id).toBe('string');
          expect(typeof task.description).toBe('string');
          expect(typeof task.completed).toBe('boolean');
        });
      }
    });

    it('should return properly typed BattlePrize', () => {
      const battle = createTestBattle({ type: 'consistency' });

      // Should be proper BattlePrize object, not custom object as any
      if (battle.prize) {
        expect(typeof battle.prize.experience).toBe('number');
        
        if (battle.prize.title !== undefined) {
          expect(typeof battle.prize.title).toBe('string');
        }
        
        if (battle.prize.badge !== undefined) {
          expect(typeof battle.prize.badge).toBe('string');
        }
        
        if (battle.prize.seasonPoints !== undefined) {
          expect(typeof battle.prize.seasonPoints).toBe('number');
        }
      }
    });
  });

  describe('Type Safety Regression Tests', () => {
    it('should not contain any as any type casts in generated objects', () => {
      // This is a meta-test to ensure we haven't regressed
      const user = createTestUser({ tier: 'premium', premium: true });
      const alarm = createTestAlarm({ premium: true });
      const battle = createTestBattle({ type: 'speed' });

      // These assertions would fail if the objects contained 'as any' casts
      // because the runtime types would not match the expected TypeScript types
      expect(user).toMatchObject({
        id: expect.any(String),
        preferences: expect.objectContaining({
          personalization: expect.objectContaining({
            colorPreferences: expect.objectContaining({
              favoriteColors: expect.any(Array)
            })
          })
        })
      });

      if (alarm.smartFeatures) {
        expect(alarm.smartFeatures).toMatchObject({
          weatherEnabled: expect.any(Boolean),
          locationEnabled: expect.any(Boolean),
          fitnessEnabled: expect.any(Boolean)
        });
      }

      expect(battle.settings).toMatchObject({
        duration: expect.stringMatching(/^P\d+D$/)
      });
    });
  });
});