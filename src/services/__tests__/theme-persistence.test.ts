import { expect, test, jest } from '@jest/globals';
/**
 * Unit tests for ThemePersistenceService
 * Tests enhanced theme persistence functionality including backup, restore, and error handling
 */

import ThemePersistenceService from '../theme-persistence';
import type { Theme } from '../../types';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock ErrorHandler
jest.mock('../_error-handler', () => ({
  ErrorHandler: {
    handleError: jest.fn(),
  },
}));

describe('ThemePersistenceService', () => {
  let persistenceService: ThemePersistenceService;

  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();

    // Get fresh instance
    persistenceService = ThemePersistenceService.getInstance();
  });

  afterEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create default storage on first run', () => {
      const stored = mockLocalStorage.getItem('relife-theme-data');
      expect(stored).toBeTruthy();

      const data = JSON.parse(stored!);
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('theme');
      expect(data).toHaveProperty('timestamp');
      expect(data.version).toBe('2.0.0');
    });

    it('should create metadata on initialization', () => {
      const metadata = mockLocalStorage.getItem('relife-theme-metadata');
      expect(metadata).toBeTruthy();

      const parsed = JSON.parse(metadata!);
      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('lastBackup');
      expect(parsed.version).toBe('2.0.0');
    });
  });

  describe('Theme Data Management', () => {
    it('should save theme data successfully', async () => {
      const testData = {
        theme: 'dark' as Theme,
        timestamp: new Date().toISOString(),
      };

      const result = await persistenceService.saveThemeData(testData);
      expect(result).toBe(true);

      const stored = mockLocalStorage.getItem('relife-theme-data');
      const parsedData = JSON.parse(stored!);
      expect(parsedData.theme).toBe('dark');
    });

    it('should load theme data successfully', async () => {
      // Save test data first
      await persistenceService.saveThemeData({
        theme: 'dark' as Theme,
        personalization: {
          colorPreferences: {
            accentColor: '#ff0000',
          },
        },
      });

      const loadedData = await persistenceService.loadThemeData();
      expect(loadedData.theme).toBe('dark');
      expect(loadedData.personalization).toHaveProperty('colorPreferences');
    });

    it('should return default data when storage is empty', async () => {
      mockLocalStorage.clear();

      const data = await persistenceService.loadThemeData();
      expect(data.theme).toBe('light'); // Default theme
      expect(data.version).toBe('2.0.0');
    });

    it('should handle corrupted data gracefully', async () => {
      // Set invalid JSON
      mockLocalStorage.setItem('relife-theme-data', 'invalid-json');

      const data = await persistenceService.loadThemeData();
      expect(data).toBeTruthy();
      expect(data.theme).toBe('light'); // Should fall back to default
    });
  });

  describe('Backup and Restore', () => {
    it('should create backups when saving data', async () => {
      await persistenceService.saveThemeData({
        theme: 'dark' as Theme,
      });

      // Check if backup was created
      const backupKeys = Object.keys(mockLocalStorage.store).filter(key =>
        key.startsWith('relife-theme-backup-')
      );

      expect(backupKeys.length).toBeGreaterThan(0);
    });

    it('should restore from backup when main data is corrupted', async () => {
      // Save valid data (creates backup)
      await persistenceService.saveThemeData({
        theme: 'dark' as Theme,
      });

      // Corrupt main data
      mockLocalStorage.setItem('relife-theme-data', 'corrupted-data');

      // Should restore from backup
      const data = await persistenceService.loadThemeData();
      expect(data.theme).toBe('dark');
    });

    it('should limit number of backups', async () => {
      // Create more backups than the limit (3)
      for (let i = 0; i < 5; i++) {
        await persistenceService.saveThemeData({
          theme: 'light' as Theme,
          timestamp: new Date().toISOString(),
        });
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      const backupKeys = Object.keys(mockLocalStorage.store).filter(key =>
        key.startsWith('relife-theme-backup-')
      );

      expect(backupKeys.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Import and Export', () => {
    it('should export theme data as JSON string', async () => {
      await persistenceService.saveThemeData({
        theme: 'dark' as Theme,
        personalization: {
          colorPreferences: {
            accentColor: '#ff0000',
          },
        },
      });

      const exported = await persistenceService.exportThemes();
      expect(typeof exported).toBe('string');

      const parsedExport = JSON.parse(exported);
      expect(parsedExport.theme).toBe('dark');
      expect(parsedExport).toHaveProperty('exportedAt');
      expect(parsedExport).toHaveProperty('exportVersion');
    });

    it('should import theme data from JSON string', async () => {
      const importData = {
        version: '2.0.0',
        theme: 'dark' as Theme,
        timestamp: new Date().toISOString(),
        themeConfig: {},
        personalization: {
          colorPreferences: {
            accentColor: '#00ff00',
          },
        },
        customThemes: [],
        presets: [],
        analytics: {
          lastUsed: new Date().toISOString(),
          usageCount: 5,
          favoriteThemes: ['dark'],
        },
      };

      const success = await persistenceService.importThemes(JSON.stringify(importData));
      expect(success).toBe(true);

      const loadedData = await persistenceService.loadThemeData();
      expect(loadedData.theme).toBe('dark');
      expect(loadedData.analytics.usageCount).toBe(5);
    });

    it('should handle invalid import data', async () => {
      const success = await persistenceService.importThemes('invalid-json');
      expect(success).toBe(false);
    });
  });

  describe('Data Validation', () => {
    it('should update analytics when saving theme data', async () => {
      await persistenceService.saveThemeData({
        theme: 'dark' as Theme,
      });

      const data = await persistenceService.loadThemeData();
      expect(data.analytics.usageCount).toBe(1);
      expect(data.analytics.lastUsed).toBeTruthy();
    });

    it('should preserve existing data when partial updates are made', async () => {
      // Initial save
      await persistenceService.saveThemeData({
        theme: 'light' as Theme,
        personalization: {
          colorPreferences: {
            accentColor: '#ff0000',
          },
        },
      });

      // Partial update
      await persistenceService.saveThemeData({
        theme: 'dark' as Theme,
      });

      const data = await persistenceService.loadThemeData();
      expect(data.theme).toBe('dark');
      expect(data.personalization?.colorPreferences?.accentColor).toBe('#ff0000');
    });
  });

  describe('Storage Statistics', () => {
    it('should provide accurate storage statistics', async () => {
      await persistenceService.saveThemeData({
        theme: 'dark' as Theme,
      });

      const stats = persistenceService.getStorageStats();
      expect(stats).toHaveProperty('dataSize');
      expect(stats).toHaveProperty('backupCount');
      expect(stats).toHaveProperty('version');
      expect(stats.version).toBe('2.0.0');
      expect(stats.dataSize).toBeGreaterThan(0);
    });
  });

  describe('Data Clearing', () => {
    it('should clear all data and reset to defaults', async () => {
      await persistenceService.saveThemeData({
        theme: 'dark' as Theme,
      });

      const success = await persistenceService.clearAllData();
      expect(success).toBe(true);

      const data = await persistenceService.loadThemeData();
      expect(data.theme).toBe('light'); // Back to default
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw errors
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = await persistenceService.saveThemeData({
        theme: 'dark' as Theme,
      });
      expect(result).toBe(false);

      // Restore original function
      mockLocalStorage.setItem = originalSetItem;
    });

    it('should validate data integrity', async () => {
      // Test with missing required fields
      const invalidData = {
        theme: 'dark',
        // missing other required fields
      };

      mockLocalStorage.setItem('relife-theme-data', JSON.stringify(invalidData));

      const data = await persistenceService.loadThemeData();
      expect(data.theme).toBe('light'); // Should fall back to default
    });
  });
});
