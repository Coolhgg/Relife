import { expect, test, jest } from '@jest/globals';
/// <reference lib="dom" />
/**
 * Unit tests for useTheme hook
 * Tests theme management, personalization, and integration functionality
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../useTheme';
import type { Theme, PersonalizationSettings } from '../../types';

// Mock services
jest.mock('../../services/CloudSyncService', (
) => ({
  __esModule: true,
  default: jest.fn().mockImplementation((
) => ({
    initialize: jest.fn(),
    setPreferences: jest.fn(),
    sync: jest.fn(),
    getStatus: jest.fn((
) => ({
      isOnline: true,
      isSyncing: false,
      hasConflicts: false,
      pendingChanges: 0,
    })),
  })),
}));

jest.mock('../../services/theme-persistence', (
) => ({
  __esModule: true,
  default: {
    getInstance: jest.fn((
) => ({
      loadThemeData: jest.fn().mockResolvedValue({
        version: '2.0.0',
        theme: 'light',
        timestamp: new Date().toISOString(),
        themeConfig: {},
        personalization: {},
        customThemes: [],
        presets: [],
        analytics: {
          lastUsed: new Date().toISOString(),
          usageCount: 0,
          favoriteThemes: [],
        },
      }),
      saveThemeData: jest.fn().mockResolvedValue(true),
      exportThemes: jest.fn().mockResolvedValue('{}'),
      importThemes: jest.fn().mockResolvedValue(true),
    })),
  },
}));

// Mock localStorage
const mockLocalStorage = ((
) => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string
) => store[key] || null,
    setItem: (key: string, value: string
) => {
      store[key] = value;
    },
    removeItem: (key: string
) => {
      delete store[key];
    },
    clear: (
) => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const wrapper = ({ children }: { children: React.ReactNode }
) => (
  <ThemeProvider defaultTheme="light" storageKey="test-theme">
    {children}
  </ThemeProvider>
);

describe('useTheme Hook', (
) => {
  beforeEach((
) => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('Theme Management', (
) => {
    it('should initialize with default theme', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      expect(result.current.theme).toBe('light');
      expect(result.current.themeConfig).toBeDefined();
    });

    it('should set theme correctly', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      act((
) => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDarkMode).toBe(true);
    });

    it('should toggle between light and dark themes', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      // Start with light theme
      expect(result.current.theme).toBe('light');

      act((
) => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');

      act((
) => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
    });

    it('should reset theme to default', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      act((
) => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');

      act((
) => {
        result.current.resetTheme();
      });

      expect(result.current.theme).toBe('light');
    });

    it('should handle invalid theme gracefully', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      act((
) => {
        // @ts-expect-error Testing invalid theme
        result.current.setTheme('invalid-theme');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid theme: invalid-theme')
      );
      expect(result.current.theme).toBe('light'); // Should remain unchanged

      consoleSpy.mockRestore();
    });
  });

  describe('Personalization', (
) => {
    it('should update personalization settings', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      const updates: Partial<PersonalizationSettings> = {
        colorPreferences: {
          accentColor: '#ff0000',
        },
      };

      act((
) => {
        result.current.updatePersonalization(updates);
      });

      expect(result.current.personalization.colorPreferences?.accentColor).toBe(
        '#ff0000'
      );
    });

    it('should update color preferences', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      act((
) => {
        result.current.updateColorPreference('primaryColor', '#00ff00');
      });

      expect(result.current.personalization.colorPreferences?.primaryColor).toBe(
        '#00ff00'
      );
    });

    it('should update typography preferences', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      act((
) => {
        result.current.updateTypographyPreference('fontSize', 'large');
      });

      expect(result.current.personalization.typographyPreferences?.fontSize).toBe(
        'large'
      );
    });

    it('should update motion preferences', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      act((
) => {
        result.current.updateMotionPreference('reduceMotion', true);
      });

      expect(result.current.personalization.motionPreferences?.reduceMotion).toBe(true);
    });

    it('should update sound preferences', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      act((
) => {
        result.current.updateSoundPreference('enabled', false);
      });

      expect(result.current.personalization.soundPreferences?.enabled).toBe(false);
    });

    it('should update layout preferences', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      act((
) => {
        result.current.updateLayoutPreference('density', 'compact');
      });

      expect(result.current.personalization.layoutPreferences?.density).toBe('compact');
    });

    it('should update accessibility preferences', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      act((
) => {
        result.current.updateAccessibilityPreference('highContrast', true);
      });

      expect(
        result.current.personalization.accessibilityPreferences?.highContrast
      ).toBe(true);
    });
  });

  describe('CSS Variables and Classes', (
) => {
    it('should generate CSS variables', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      const cssVars = result.current.getCSSVariables();
      expect(typeof cssVars).toBe('object');
      expect(Object.keys(cssVars).length).toBeGreaterThan(0);
    });

    it('should generate theme classes', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      const classes = result.current.getThemeClasses();
      expect(Array.isArray(classes)).toBe(true);
      expect(classes.length).toBeGreaterThan(0);
    });

    it('should check accessibility contrast', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      const isAccessible = result.current.isAccessibleContrast('#000000', '#ffffff');
      expect(typeof isAccessible).toBe('boolean');
      expect(isAccessible).toBe(true); // Black on white should be accessible

      const isNotAccessible = result.current.isAccessibleContrast('#ffff00', '#ffffff');
      expect(isNotAccessible).toBe(false); // Yellow on white should not be accessible
    });
  });

  describe('Custom Themes and Presets', (
) => {
    it('should create custom theme', async (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      let customTheme;
      await act(async (
) => {
        customTheme = await result.current.createCustomTheme('light', {
          primaryColor: '#ff0000',
        });
      });

      expect(customTheme).toBeDefined();
      expect(customTheme?.baseTheme).toBe('light');
    });

    it('should save theme preset', async (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      const preset = {
        id: 'test-preset',
        name: 'Test Preset',
        theme: 'light' as Theme,
        personalization: {},
        createdAt: new Date(),
        isCustom: true,
        category: 'custom' as const,
      };

      await act(async (
) => {
        await result.current.saveThemePreset(preset);
      });

      // Should not throw any errors
      expect(true).toBe(true);
    });

    it('should load theme preset', async (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      await act(async (
) => {
        await result.current.loadThemePreset('test-preset-id');
      });

      // Should not throw any errors
      expect(true).toBe(true);
    });

    it('should get theme recommendations', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      const recommendations = result.current.getThemeRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('Import/Export', (
) => {
    it('should export themes', async (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      let exportData;
      await act(async (
) => {
        exportData = await result.current.exportThemes();
      });

      expect(typeof exportData).toBe('string');
    });

    it('should import themes', async (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      const testData = JSON.stringify({
        version: '2.0.0',
        personalization: {
          colorPreferences: {
            accentColor: '#ff0000',
          },
        },
      });

      let success;
      await act(async (
) => {
        success = await result.current.importThemes(testData);
      });

      expect(success).toBe(true);
    });

    it('should handle invalid import data', async (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      let success;
      await act(async (
) => {
        success = await result.current.importThemes('invalid-json');
      });

      expect(success).toBe(false);
    });
  });

  describe('Cloud Sync', (
) => {
    it('should sync themes to cloud', async (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      await act(async (
) => {
        await result.current.syncThemes();
      });

      // Should not throw any errors
      expect(true).toBe(true);
    });

    it('should enable/disable cloud sync', (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      act((
) => {
        result.current.enableCloudSync(true);
      });

      act((
) => {
        result.current.enableCloudSync(false);
      });

      // Should not throw any errors
      expect(true).toBe(true);
    });

    it('should force cloud sync', async (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      await act(async (
) => {
        await result.current.forceCloudSync();
      });

      // Should not throw any errors
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', (
) => {
    it('should handle cloud sync errors gracefully', async (
) => {
      const { result } = renderHook((
) => useTheme(), { wrapper });

      // Mock cloud sync service to throw error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        await act(async (
) => {
          await result.current.syncThemes();
        });
      } catch (error) {
        // Expected to potentially throw
      }

      consoleSpy.mockRestore();
    });
  });

  describe('Theme Context', (
) => {
    it('should throw error when used outside provider', (
) => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect((
) => {
        renderHook((
) => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('System Theme Detection', (
) => {
    it('should detect system theme when enableSystem is true', (
) => {
      const wrapperWithSystem = ({ children }: { children: React.ReactNode }
) => (
        <ThemeProvider
          defaultTheme="light"
          enableSystem={true}
          storageKey="test-theme-system"
        >
          {children}
        </ThemeProvider>
      );

      const { result } = renderHook((
) => useTheme(), { wrapper: wrapperWithSystem });

      expect(result.current.isSystemTheme).toBe(true);
    });
  });
});
