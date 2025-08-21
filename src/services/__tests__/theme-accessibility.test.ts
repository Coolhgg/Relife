import { expect, test, jest } from "@jest/globals";
/// <reference lib="dom" />
/**
 * Tests for Theme Accessibility Service
 */

import ThemeAccessibilityService from '../theme-accessibility';
import { PersonalizationSettings } from '../../types';

// Mock DOM APIs
const mockDocument = {
  createElement: jest.fn(() => ({
    setAttribute: jest.fn(),
    appendChild: jest.fn(),
    textContent: '',
    style: {
      cssText: ''
    },
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false)
    }
  })),
  body: {
    appendChild: jest.fn(),
    insertBefore: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false)
    }
  },
  documentElement: {
    style: {
      setProperty: jest.fn()
    },
    classList: {
      contains: jest.fn(() => false)
    }
  },
  querySelector: jest.fn(() => null),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  head: {
    appendChild: jest.fn()
  }
};

// Mock window APIs
const mockWindow = {
  matchMedia: jest.fn(() => ({
    matches: false,
    addEventListener: jest.fn()
  }))
};

global.document = mockDocument as any;
global.window = mockWindow as any;

describe('ThemeAccessibilityService', () => {
  let service: ThemeAccessibilityService;

  beforeEach(() => {
    service = ThemeAccessibilityService.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('Contrast Ratio Calculation', () => {
    test('should calculate correct contrast ratio for black and white', () => {
      const result = service.calculateContrastRatio('#000000', '#ffffff');
      expect(result.ratio).toBe(21);
      expect(result.level).toBe('AAA');
      expect(result.isAccessible).toBe(true);
    });

    test('should calculate contrast ratio for similar colors', () => {
      const result = service.calculateContrastRatio('#444444', '#666666');
      expect(result.ratio).toBeGreaterThan(1);
      expect(result.isAccessible).toBeFalsy();
    });

    test('should cache contrast ratio calculations', () => {
      // First calculation
      const result1 = service.calculateContrastRatio('#000000', '#ffffff');
      // Second calculation should use cache
      const result2 = service.calculateContrastRatio('#000000', '#ffffff');

      expect(result1).toBe(result2);
    });
  });

  describe('Color Blindness Simulation', () => {
    test('should simulate different types of color blindness', () => {
      const result = service.simulateColorBlindness('#ff0000');

      expect(result).toHaveProperty('protanopia');
      expect(result).toHaveProperty('deuteranopia');
      expect(result).toHaveProperty('tritanopia');
      expect(result).toHaveProperty('achromatopsia');

      // Results should be valid hex colors
      Object.values(result).forEach(color => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    test('should handle invalid color input gracefully', () => {
      const result = service.simulateColorBlindness('invalid-color');

      // Should return original color for all variants when invalid
      expect(result.protanopia).toBe('invalid-color');
      expect(result.deuteranopia).toBe('invalid-color');
      expect(result.tritanopia).toBe('invalid-color');
      expect(result.achromatopsia).toBe('invalid-color');
    });
  });

  describe('Accessibility Enhancements', () => {
    test('should apply high contrast mode', () => {
      const settings: PersonalizationSettings = {
        theme: 'light',
        colorPreferences: {
          favoriteColors: [],
          avoidColors: [],
          colorblindFriendly: false,
          highContrastMode: false,
          saturationLevel: 100,
          brightnessLevel: 100,
          warmthLevel: 50
        },
        typographyPreferences: {
          preferredFontSize: 'medium',
          fontSizeScale: 1,
          preferredFontFamily: 'system',
          lineHeightPreference: 'comfortable',
          letterSpacingPreference: 'normal',
          fontWeight: 'normal',
          dyslexiaFriendly: false
        },
        motionPreferences: {
          enableAnimations: true,
          animationSpeed: 'normal',
          reduceMotion: false,
          preferCrossfade: false,
          enableParallax: true,
          enableHoverEffects: true,
          enableFocusAnimations: true
        },
        soundPreferences: {
          enableSounds: true,
          soundVolume: 70,
          soundTheme: 'default',
          customSounds: {},
          muteOnFocus: false,
          hapticFeedback: true,
          spatialAudio: false
        },
        layoutPreferences: {
          density: 'comfortable',
          navigation: 'bottom',
          cardStyle: 'elevated',
          borderRadius: 'rounded',
          showLabels: true,
          showIcons: true,
          iconSize: 'medium',
          gridColumns: 2,
          listSpacing: 'normal'
        },
        accessibilityPreferences: {
          screenReaderOptimized: false,
          keyboardNavigationOnly: false,
          highContrastMode: true,
          largeTargets: false,
          reducedTransparency: false,
          boldText: false,
          underlineLinks: false,
          flashingElementsReduced: false,
          colorOnlyIndicators: false,
          focusIndicatorStyle: 'outline'
        },
        lastUpdated: new Date(),
        syncAcrossDevices: true
      };

      service.applyAccessibilityEnhancements(settings);

      expect(mockDocument.body.classList.add).toHaveBeenCalledWith('high-contrast');
    });

    test('should apply reduced motion settings', () => {
      const settings: PersonalizationSettings = {
        theme: 'light',
        colorPreferences: {
          favoriteColors: [],
          avoidColors: [],
          colorblindFriendly: false,
          highContrastMode: false,
          saturationLevel: 100,
          brightnessLevel: 100,
          warmthLevel: 50
        },
        typographyPreferences: {
          preferredFontSize: 'medium',
          fontSizeScale: 1,
          preferredFontFamily: 'system',
          lineHeightPreference: 'comfortable',
          letterSpacingPreference: 'normal',
          fontWeight: 'normal',
          dyslexiaFriendly: false
        },
        motionPreferences: {
          enableAnimations: true,
          animationSpeed: 'normal',
          reduceMotion: true,
          preferCrossfade: false,
          enableParallax: true,
          enableHoverEffects: true,
          enableFocusAnimations: true
        },
        soundPreferences: {
          enableSounds: true,
          soundVolume: 70,
          soundTheme: 'default',
          customSounds: {},
          muteOnFocus: false,
          hapticFeedback: true,
          spatialAudio: false
        },
        layoutPreferences: {
          density: 'comfortable',
          navigation: 'bottom',
          cardStyle: 'elevated',
          borderRadius: 'rounded',
          showLabels: true,
          showIcons: true,
          iconSize: 'medium',
          gridColumns: 2,
          listSpacing: 'normal'
        },
        accessibilityPreferences: {
          screenReaderOptimized: false,
          keyboardNavigationOnly: false,
          highContrastMode: false,
          largeTargets: false,
          reducedTransparency: false,
          boldText: false,
          underlineLinks: false,
          flashingElementsReduced: false,
          colorOnlyIndicators: false,
          focusIndicatorStyle: 'outline'
        },
        lastUpdated: new Date(),
        syncAcrossDevices: true
      };

      service.applyAccessibilityEnhancements(settings);

      expect(mockDocument.body.classList.add).toHaveBeenCalledWith('reduce-motion');
    });

    test('should apply dyslexia-friendly fonts', () => {
      const settings: PersonalizationSettings = {
        theme: 'light',
        colorPreferences: {
          favoriteColors: [],
          avoidColors: [],
          colorblindFriendly: false,
          highContrastMode: false,
          saturationLevel: 100,
          brightnessLevel: 100,
          warmthLevel: 50
        },
        typographyPreferences: {
          preferredFontSize: 'medium',
          fontSizeScale: 1,
          preferredFontFamily: 'system',
          lineHeightPreference: 'comfortable',
          letterSpacingPreference: 'normal',
          fontWeight: 'normal',
          dyslexiaFriendly: true
        },
        motionPreferences: {
          enableAnimations: true,
          animationSpeed: 'normal',
          reduceMotion: false,
          preferCrossfade: false,
          enableParallax: true,
          enableHoverEffects: true,
          enableFocusAnimations: true
        },
        soundPreferences: {
          enableSounds: true,
          soundVolume: 70,
          soundTheme: 'default',
          customSounds: {},
          muteOnFocus: false,
          hapticFeedback: true,
          spatialAudio: false
        },
        layoutPreferences: {
          density: 'comfortable',
          navigation: 'bottom',
          cardStyle: 'elevated',
          borderRadius: 'rounded',
          showLabels: true,
          showIcons: true,
          iconSize: 'medium',
          gridColumns: 2,
          listSpacing: 'normal'
        },
        accessibilityPreferences: {
          screenReaderOptimized: false,
          keyboardNavigationOnly: false,
          highContrastMode: false,
          largeTargets: false,
          reducedTransparency: false,
          boldText: false,
          underlineLinks: false,
          flashingElementsReduced: false,
          colorOnlyIndicators: false,
          focusIndicatorStyle: 'outline'
        },
        lastUpdated: new Date(),
        syncAcrossDevices: true
      };

      service.applyAccessibilityEnhancements(settings);

      expect(mockDocument.body.classList.add).toHaveBeenCalledWith('dyslexia-friendly');
    });
  });

  describe('Theme Accessibility Testing', () => {
    test('should test theme accessibility and provide scores', () => {
      const themeColors = {
        '--theme-text-primary': '#000000',
        '--theme-background': '#ffffff',
        '--theme-primary': '#0000ff',
        '--theme-focus': '#0000ff'
      };

      const result = service.testThemeAccessibility(themeColors);

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('recommendations');
      expect(typeof result.overallScore).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should identify accessibility issues', () => {
      const themeColors = {
        '--theme-text-primary': '#777777',
        '--theme-background': '#888888',
        '--theme-primary': '#999999'
      };

      const result = service.testThemeAccessibility(themeColors);

      expect(result.overallScore).toBeLessThan(100);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility Status', () => {
    test('should return current accessibility status', () => {
      const status = service.getAccessibilityStatus();

      expect(status).toHaveProperty('hasHighContrast');
      expect(status).toHaveProperty('hasReducedMotion');
      expect(status).toHaveProperty('hasScreenReaderOptimizations');
      expect(status).toHaveProperty('hasSkipLinks');
      expect(status).toHaveProperty('focusVisible');

      Object.values(status).forEach(value => {
        expect(typeof value).toBe('boolean');
      });
    });
  });

  describe('ARIA Announcements', () => {
    test('should announce theme changes', () => {
      // This would require more complex DOM mocking to fully test
      // For now, just ensure the method doesn't throw
      expect(() => {
        service.announceThemeChange('Dark Mode');
      }).not.toThrow();

      expect(() => {
        service.announceThemeChange('Light Mode', {
          includePreviousTheme: true,
          previousTheme: 'Dark Mode'
        });
      }).not.toThrow();
    });
  });
});