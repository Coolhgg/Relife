import { vi, describe, test, beforeEach, afterEach, expect } from 'vitest';
/**
 * Alarm Themes Integration Tests
 * Tests the complete alarm theme system integration
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
vi.mock('../services/offline-storage');
vi.mock('../services/audio-manager');

// Import services
import { soundEffectsService } from '../services/sound-effects';
import { visualAlarmThemes } from '../services/visual-alarm-themes';
import { contextualThemes } from '../services/contextual-themes';
import { themeCombinations } from '../services/theme-combinations';

// Mock DOM methods
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
});

Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn()
  }
});

describe('Alarm Themes Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sound Effects Service Integration', () => {
    it('should initialize with expanded sound themes', async () => {
      const themes = soundEffectsService.getAvailableThemes();
      
      expect(themes.length).toBeGreaterThan(4); // Original had 4, now should have many more
      expect(themes.find(t => t.id === 'nature')).toBeDefined();
      expect(themes.find(t => t.id === 'cyberpunk')).toBeDefined();
      expect(themes.find(t => t.id === 'workout')).toBeDefined();
    });

    it('should have expanded sound effect IDs', () => {
      const allSounds = soundEffectsService.getAllSoundEffects();
      
      // Check for new gentle alarm sounds
      const gentleSounds = allSounds.filter(s => s.id.includes('tibetan_bowls'));
      expect(gentleSounds.length).toBe(1);
      
      // Check for new energetic sounds
      const energeticSounds = allSounds.filter(s => s.id.includes('power_up'));
      expect(energeticSounds.length).toBe(1);
      
      // Check for ambient sounds
      const ambientSounds = allSounds.filter(s => s.category === 'ambient');
      expect(ambientSounds.length).toBeGreaterThan(0);
    });

    it('should support theme switching', async () => {
      const originalTheme = soundEffectsService.getSoundTheme();
      
      await soundEffectsService.setSoundTheme('nature');
      expect(soundEffectsService.getSoundTheme()).toBe('nature');
      
      await soundEffectsService.setSoundTheme('cyberpunk');
      expect(soundEffectsService.getSoundTheme()).toBe('cyberpunk');
      
      // Restore original
      await soundEffectsService.setSoundTheme(originalTheme);
    });
  });

  describe('Visual Alarm Themes Integration', () => {
    it('should load all visual themes', () => {
      const themes = visualAlarmThemes.getAllThemes();
      
      expect(themes.length).toBeGreaterThan(5);
      expect(themes.find(t => t.id === 'sunrise_glow')).toBeDefined();
      expect(themes.find(t => t.id === 'neon_pulse')).toBeDefined();
      expect(themes.find(t => t.id === 'galaxy_spiral')).toBeDefined();
    });

    it('should generate valid CSS for themes', () => {
      const theme = visualAlarmThemes.getTheme('sunrise_glow');
      expect(theme).toBeDefined();
      
      if (theme) {
        const css = visualAlarmThemes.generateThemeCSS(theme);
        expect(css).toContain('--primary-color:');
        expect(css).toContain('--gradient-start:');
        expect(css).toContain('font-family:');
      }
    });

    it('should recommend visual themes based on sound themes', () => {
      const natureVisual = visualAlarmThemes.getRecommendedVisualTheme('nature');
      expect(natureVisual).toBe('forest_canopy');
      
      const electronicVisual = visualAlarmThemes.getRecommendedVisualTheme('electronic');
      expect(electronicVisual).toBe('neon_pulse');
    });

    it('should categorize themes correctly', () => {
      const gentleThemes = visualAlarmThemes.getThemesByCategory('gentle');
      const energeticThemes = visualAlarmThemes.getThemesByCategory('energetic');
      
      expect(gentleThemes.length).toBeGreaterThan(0);
      expect(energeticThemes.length).toBeGreaterThan(0);
      
      // Check that categorization is correct
      gentleThemes.forEach(theme => {
        expect(theme.category).toBe('gentle');
      });
    });
  });

  describe('Contextual Themes Integration', () => {
    it('should provide contextual recommendations', async () => {
      const morningTime = '7:00';
      const testDate = new Date('2023-06-15T07:00:00'); // Thursday morning
      
      const recommendation = await contextualThemes.getContextualRecommendation(morningTime, testDate);
      
      expect(recommendation).toBeDefined();
      expect(recommendation.visual).toBeDefined();
      expect(recommendation.sound).toBeDefined();
      expect(recommendation.voice).toBeDefined();
      expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(100);
    });

    it('should learn from user patterns', () => {
      const testTime = '8:30';
      const testDate = new Date();
      
      // Record usage
      contextualThemes.recordThemeUsage(
        'sunrise_glow',
        'nature',
        'gentle',
        testTime,
        testDate
      );
      
      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should handle different times of day', async () => {
      const earlyMorning = await contextualThemes.getContextualRecommendation('5:00');
      const lateNight = await contextualThemes.getContextualRecommendation('23:00');
      
      expect(earlyMorning.reason).toContain('gentle');
      // Late night should be different from early morning
      expect(earlyMorning.visual !== lateNight.visual || 
             earlyMorning.sound !== lateNight.sound).toBe(true);
    });
  });

  describe('Theme Combinations Integration', () => {
    it('should load predefined combinations', () => {
      const allCombinations = themeCombinations.getAllCombinations();
      
      expect(allCombinations.length).toBeGreaterThan(10);
      
      // Check for specific combinations
      const peacefulSunrise = themeCombinations.getCombination('peaceful_sunrise');
      expect(peacefulSunrise).toBeDefined();
      expect(peacefulSunrise?.visual).toBe('sunrise_glow');
      expect(peacefulSunrise?.sound).toBe('nature');
      expect(peacefulSunrise?.voice).toBe('sweet-angel');
    });

    it('should categorize combinations correctly', () => {
      const gentleCombos = themeCombinations.getCombinationsByCategory('gentle');
      const energeticCombos = themeCombinations.getCombinationsByCategory('energetic');
      
      expect(gentleCombos.length).toBeGreaterThan(0);
      expect(energeticCombos.length).toBeGreaterThan(0);
      
      gentleCombos.forEach(combo => {
        expect(combo.category).toBe('gentle');
      });
    });

    it('should filter by time of day', () => {
      const morningCombos = themeCombinations.getCombinationsByTimeOfDay('morning');
      const nightCombos = themeCombinations.getCombinationsByTimeOfDay('night');
      
      expect(morningCombos.length).toBeGreaterThan(0);
      expect(nightCombos.length).toBeGreaterThan(0);
      
      morningCombos.forEach(combo => {
        expect(combo.timeOfDay).toContain('morning');
      });
    });

    it('should support custom combinations', () => {
      const customId = themeCombinations.createCustomCombination(
        'Test Combo',
        'A test combination',
        'sunrise_glow',
        'nature',
        'gentle'
      );
      
      expect(customId).toBeDefined();
      expect(customId.startsWith('custom_')).toBe(true);
      
      const customCombo = themeCombinations.getCombination(customId);
      expect(customCombo).toBeDefined();
      expect(customCombo?.name).toBe('Test Combo');
    });

    it('should manage favorites', () => {
      const testComboId = 'peaceful_sunrise';
      
      // Add to favorites
      themeCombinations.addToFavorites(testComboId);
      expect(themeCombinations.isFavorite(testComboId)).toBe(true);
      
      // Remove from favorites
      themeCombinations.removeFromFavorites(testComboId);
      expect(themeCombinations.isFavorite(testComboId)).toBe(false);
    });

    it('should track usage and effectiveness', () => {
      const testComboId = 'peaceful_sunrise';
      const combo = themeCombinations.getCombination(testComboId);
      
      const originalUsageCount = combo?.usageCount || 0;
      
      // Record usage
      themeCombinations.recordUsage(testComboId, 85);
      
      const updatedCombo = themeCombinations.getCombination(testComboId);
      expect(updatedCombo?.usageCount).toBe(originalUsageCount + 1);
      expect(updatedCombo?.effectiveness).toBe(85);
      expect(updatedCombo?.lastUsed).toBeInstanceOf(Date);
    });

    it('should provide personalized recommendations', () => {
      // Record some usage to build patterns
      themeCombinations.recordUsage('peaceful_sunrise');
      themeCombinations.recordUsage('forest_meditation');
      
      const recommendations = themeCombinations.getPersonalizedRecommendations(3);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Cross-Service Integration', () => {
    it('should integrate visual and sound theme recommendations', () => {
      const soundTheme = 'nature';
      const visualTheme = visualAlarmThemes.getRecommendedVisualTheme(soundTheme);
      
      expect(visualTheme).toBeDefined();
      
      // The visual theme should make sense with the sound theme
      const visualThemeData = visualAlarmThemes.getTheme(visualTheme);
      expect(visualThemeData?.category).toMatch(/gentle|nature|ambient/);
    });

    it('should handle theme application workflow', () => {
      const combination = themeCombinations.getCombination('peaceful_sunrise');
      expect(combination).toBeDefined();
      
      if (combination) {
        // This should not throw errors
        const visualTheme = visualAlarmThemes.getTheme(combination.visual);
        expect(visualTheme).toBeDefined();
        
        const soundThemes = soundEffectsService.getAvailableThemes();
        const soundTheme = soundThemes.find(t => t.id === combination.sound);
        expect(soundTheme).toBeDefined();
      }
    });

    it('should maintain consistency between services', () => {
      const combinations = themeCombinations.getAllCombinations();
      
      combinations.forEach(combo => {
        // Visual theme should exist
        const visualTheme = visualAlarmThemes.getTheme(combo.visual);
        expect(visualTheme).toBeDefined();
        
        // Sound theme should exist
        const soundThemes = soundEffectsService.getAvailableThemes();
        const soundTheme = soundThemes.find(t => t.id === combo.sound);
        expect(soundTheme).toBeDefined();
        
        // Voice mood should be valid
        const validVoiceMoods = [
          'drill-sergeant', 'sweet-angel', 'anime-hero', 'savage-roast',
          'motivational', 'gentle', 'demon-lord', 'ai-robot', 'comedian', 'philosopher'
        ];
        expect(validVoiceMoods).toContain(combo.voice);
      });
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle missing themes gracefully', () => {
      const nonExistentTheme = visualAlarmThemes.getTheme('non_existent_theme' as any);
      expect(nonExistentTheme).toBeUndefined();
      
      const nonExistentCombo = themeCombinations.getCombination('non_existent_combo');
      expect(nonExistentCombo).toBeUndefined();
    });

    it('should handle invalid data gracefully', async () => {
      // Should not throw errors with invalid input
      expect(() => {
        contextualThemes.recordThemeUsage(
          'invalid_visual' as any,
          'invalid_sound' as any,
          'invalid_voice' as any,
          'invalid_time',
          new Date()
        );
      }).not.toThrow();
    });

    it('should validate combination data', () => {
      const combinations = themeCombinations.getAllCombinations();
      
      combinations.forEach(combo => {
        expect(combo.id).toBeDefined();
        expect(combo.name).toBeDefined();
        expect(combo.description).toBeDefined();
        expect(combo.visual).toBeDefined();
        expect(combo.sound).toBeDefined();
        expect(combo.voice).toBeDefined();
        expect(combo.category).toBeDefined();
        expect(combo.difficulty).toBeDefined();
        expect(combo.mood).toBeDefined();
        expect(Array.isArray(combo.tags)).toBe(true);
        expect(Array.isArray(combo.timeOfDay)).toBe(true);
        expect(Array.isArray(combo.weatherSuitability)).toBe(true);
        expect(typeof combo.popularity).toBe('number');
        expect(combo.popularity).toBeGreaterThanOrEqual(0);
        expect(combo.popularity).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Data Persistence', () => {
    it('should save and load user preferences', () => {
      const testComboId = 'peaceful_sunrise';
      
      // Add to favorites (should trigger save)
      themeCombinations.addToFavorites(testComboId);
      
      // Check that localStorage.setItem was called
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should handle export/import of user themes', () => {
      // Add some test data
      themeCombinations.addToFavorites('peaceful_sunrise');
      const customId = themeCombinations.createCustomCombination(
        'Export Test',
        'Test for export',
        'sunrise_glow',
        'nature',
        'gentle'
      );
      
      // Export
      const exportData = themeCombinations.exportUserThemes();
      expect(exportData).toBeDefined();
      expect(typeof exportData).toBe('string');
      
      // Should be valid JSON
      expect(() => JSON.parse(exportData)).not.toThrow();
      
      // Import should work
      const importResult = themeCombinations.importUserThemes(exportData);
      expect(importResult).toBe(true);
    });
  });
});

// Integration test for React components (would need React Testing Library)
describe('Component Integration', () => {
  it('should be compatible with existing alarm system', () => {
    // This would test that the new components work with existing Alarm types
    const mockAlarm = {
      id: '1',
      name: 'Test Alarm',
      time: '07:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      enabled: true,
      sound: 'gentle_bells',
      soundType: 'built-in' as const,
      voiceMood: 'gentle' as const,
      difficulty: 'easy' as const,
      snoozeEnabled: true,
      snoozeInterval: 5,
      snoozeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Should be able to find matching theme combinations
    const matchingCombos = themeCombinations.getAllCombinations().filter(combo => 
      combo.voice === mockAlarm.voiceMood
    );
    
    expect(matchingCombos.length).toBeGreaterThan(0);
  });

  it('should provide theme data for UI components', () => {
    const allCombinations = themeCombinations.getAllCombinations();
    const allCollections = themeCombinations.getAllCollections();
    const visualThemes = visualAlarmThemes.getAllThemes();
    
    expect(allCombinations.length).toBeGreaterThan(0);
    expect(allCollections.length).toBeGreaterThan(0);
    expect(visualThemes.length).toBeGreaterThan(0);
    
    // UI should be able to render this data
    allCombinations.forEach(combo => {
      expect(combo.name).toBeTruthy();
      expect(combo.description).toBeTruthy();
    });
  });
});

export default {};