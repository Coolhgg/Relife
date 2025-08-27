/**
 * Enhanced Theme Persistence Service
 * Handles comprehensive theme data storage, backup, and recovery
 */

import type {
  Theme,
  ThemeConfig,
  PersonalizationSettings,
  ThemePreset,
  CustomThemeConfig,
} from '../types';
import { ErrorHandler } from './error-handler';

interface ThemeStorageData {
  version: string;
  timestamp: string;
  theme: Theme;
  themeConfig: ThemeConfig;
  personalization: PersonalizationSettings;
  customThemes: CustomThemeConfig[];
  presets: ThemePreset[];
  analytics: {
    lastUsed: string;
    usageCount: number;
    favoriteThemes: string[];
  };
}

interface StorageMetadata {
  version: string;
  lastBackup: string;
  backupCount: number;
  lastSync: string;
  corruption?: boolean;
}

class ThemePersistenceService {
  private static instance: ThemePersistenceService;
  private readonly STORAGE_KEY = 'relife-theme-data';
  private readonly BACKUP_KEY = 'relife-theme-backup';
  private readonly METADATA_KEY = 'relife-theme-metadata';
  private readonly CURRENT_VERSION = '2.0.0';
  private readonly MAX_BACKUPS = 3;

  static getInstance(): ThemePersistenceService {
    if (!this.instance) {
      this.instance = new ThemePersistenceService();
    }
    return this.instance;
  }

  private constructor() {
    // Initialize on creation
    this.initializeStorage();
  }

  private initializeStorage(): void {
    try {
      const metadata = this.getMetadata();
      if (!metadata || metadata.version !== this.CURRENT_VERSION) {
        this.migrateStorage(metadata?.version);
      }
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to initialize theme storage',
        { context: 'theme_persistence_init' }
      );
    }
  }

  private migrateStorage(oldVersion?: string): void {
    try {
      console.log(
        `Migrating theme storage from ${oldVersion || 'unknown'} to ${this.CURRENT_VERSION}`
      );

      // Handle migration from older versions
      if (!oldVersion) {
        // First time setup or corrupted data
        this.createDefaultStorage();
      } else {
        // Version-specific migration logic could go here
        this.updateStorageVersion();
      }
    } catch (_error) {
      console._error('Storage migration failed:', _error);
      this.createDefaultStorage();
    }
  }

  private createDefaultStorage(): void {
    const defaultData: ThemeStorageData = {
      version: this.CURRENT_VERSION,
      timestamp: new Date().toISOString(),
      theme: 'light',
      themeConfig: {} as ThemeConfig, // Will be populated by useTheme
      personalization: {} as PersonalizationSettings, // Will be populated by useTheme
      customThemes: [],
      presets: [],
      analytics: {
        lastUsed: new Date().toISOString(),
        usageCount: 0,
        favoriteThemes: [],
      },
    };

    const metadata: StorageMetadata = {
      version: this.CURRENT_VERSION,
      lastBackup: new Date().toISOString(),
      backupCount: 0,
      lastSync: new Date().toISOString(),
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultData));
    localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
  }

  private updateStorageVersion(): void {
    const metadata = this.getMetadata();
    if (metadata) {
      metadata.version = this.CURRENT_VERSION;
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    }
  }

  private getMetadata(): StorageMetadata | null {
    try {
      const stored = localStorage.getItem(this.METADATA_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (_error) {
      console._error('Failed to parse storage metadata:', _error);
      return null;
    }
  }

  private updateMetadata(updates: Partial<StorageMetadata>): void {
    try {
      const metadata = this.getMetadata() || {
        version: this.CURRENT_VERSION,
        lastBackup: new Date().toISOString(),
        backupCount: 0,
        lastSync: new Date().toISOString(),
      };

      Object.assign(metadata, updates);
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to update storage metadata',
        { context: 'theme_persistence_metadata' }
      );
    }
  }

  /**
   * Save theme data with automatic backup
   */
  async saveThemeData(data: Partial<ThemeStorageData>): Promise<boolean> {
    try {
      // Create backup before saving
      await this.createBackup();

      const existing = await this.loadThemeData();
      const updatedData: ThemeStorageData = {
        ...existing,
        ...data,
        timestamp: new Date().toISOString(),
        version: this.CURRENT_VERSION,
      };

      // Update analytics
      if (data.theme) {
        updatedData.analytics.lastUsed = new Date().toISOString();
        updatedData.analytics.usageCount += 1;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedData));

      this.updateMetadata({
        lastSync: new Date().toISOString(),
      });

      return true;
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to save theme data',
        { context: 'theme_persistence_save', metadata: { dataKeys: Object.keys(data) } }
      );
      return false;
    }
  }

  /**
   * Load theme data with fallback handling
   */
  async loadThemeData(): Promise<ThemeStorageData> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.getDefaultThemeData();
      }

      const data = JSON.parse(stored) as ThemeStorageData;

      // Validate data integrity
      if (!this.validateThemeData(data)) {
        console.warn('Theme data validation failed, attempting backup restore');
        return (await this.restoreFromBackup()) || this.getDefaultThemeData();
      }

      return data;
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to load theme data',
        { context: 'theme_persistence_load' }
      );

      // Try to restore from backup
      const backupData = await this.restoreFromBackup();
      return backupData || this.getDefaultThemeData();
    }
  }

  private validateThemeData(data: any): boolean {
    try {
      return (
        data && typeof data === 'object' && data.version && data.theme && data.timestamp
      );
    } catch {
      return false;
    }
  }

  private getDefaultThemeData(): ThemeStorageData {
    return {
      version: this.CURRENT_VERSION,
      timestamp: new Date().toISOString(),
      theme: 'light',
      themeConfig: {} as ThemeConfig,
      personalization: {} as PersonalizationSettings,
      customThemes: [],
      presets: [],
      analytics: {
        lastUsed: new Date().toISOString(),
        usageCount: 0,
        favoriteThemes: [],
      },
    };
  }

  /**
   * Create a backup of current theme data
   */
  async createBackup(): Promise<boolean> {
    try {
      const currentData = localStorage.getItem(this.STORAGE_KEY);
      if (!currentData) return false;

      const metadata = this.getMetadata();
      const backupKey = `${this.BACKUP_KEY}-${Date.now()}`;

      // Store backup with timestamp
      localStorage.setItem(backupKey, currentData);

      // Manage backup count
      await this.cleanupOldBackups();

      this.updateMetadata({
        lastBackup: new Date().toISOString(),
        backupCount: (metadata?.backupCount || 0) + 1,
      });

      return true;
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to create theme backup',
        { context: 'theme_backup_create' }
      );
      return false;
    }
  }

  /**
   * Restore theme data from the most recent backup
   */
  async restoreFromBackup(): Promise<ThemeStorageData | null> {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.BACKUP_KEY))
        .sort()
        .reverse(); // Most recent first

      for (const backupKey of backupKeys) {
        try {
          const backupData = localStorage.getItem(backupKey);
          if (backupData) {
            const parsedData = JSON.parse(backupData) as ThemeStorageData;
            if (this.validateThemeData(parsedData)) {
              // Restore the backup
              localStorage.setItem(this.STORAGE_KEY, backupData);
              console.log('Successfully restored theme data from backup');
              return parsedData;
            }
          }
        } catch (_error) {
          console.warn(`Failed to restore from backup ${backupKey}:`, _error);
        }
      }

      return null;
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to restore from backup',
        { context: 'theme_backup_restore' }
      );
      return null;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.BACKUP_KEY))
        .sort()
        .reverse(); // Most recent first

      // Keep only the most recent backups
      const keysToDelete = backupKeys.slice(this.MAX_BACKUPS);
      keysToDelete.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (_error) {
      console.warn('Failed to cleanup old backups:', _error);
    }
  }

  /**
   * Export theme data as JSON string
   */
  async exportThemes(): Promise<string> {
    try {
      const data = await this.loadThemeData();
      const exportData = {
        ...data,
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0', // Could be dynamic
        exportVersion: this.CURRENT_VERSION,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to export themes',
        { context: 'theme_export' }
      );
      throw error;
    }
  }

  /**
   * Import theme data from JSON string
   */
  async importThemes(jsonData: string): Promise<boolean> {
    try {
      const importData = JSON.parse(jsonData);

      // Validate import data
      if (!this.validateThemeData(importData)) {
        throw new Error('Invalid theme data format');
      }

      // Create backup before import
      await this.createBackup();

      // Import the data
      const success = await this.saveThemeData(importData);

      if (success) {
        console.log('Theme data imported successfully');
      }

      return success;
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to import themes',
        { context: 'theme_import' }
      );
      return false;
    }
  }

  /**
   * Clear all theme data and reset to defaults
   */
  async clearAllData(): Promise<boolean> {
    try {
      // Create final backup
      await this.createBackup();

      // Clear main data
      localStorage.removeItem(this.STORAGE_KEY);

      // Clear metadata
      localStorage.removeItem(this.METADATA_KEY);

      // Initialize with defaults
      this.createDefaultStorage();

      return true;
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to clear theme data',
        { context: 'theme_clear' }
      );
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    dataSize: number;
    backupCount: number;
    lastBackup: string | null;
    version: string;
  } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const metadata = this.getMetadata();
      const backupKeys = Object.keys(localStorage).filter(key =>
        key.startsWith(this.BACKUP_KEY)
      );

      return {
        dataSize: data ? new Blob([data]).size : 0,
        backupCount: backupKeys.length,
        lastBackup: metadata?.lastBackup || null,
        version: this.CURRENT_VERSION,
      };
    } catch (_error) {
      console._error('Failed to get storage stats:', _error);
      return {
        dataSize: 0,
        backupCount: 0,
        lastBackup: null,
        version: this.CURRENT_VERSION,
      };
    }
  }
}

export default ThemePersistenceService;
