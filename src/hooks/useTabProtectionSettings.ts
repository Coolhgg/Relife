/// <reference lib="dom" />
import { useState, useEffect, useCallback } from 'react';
import type { TabProtectionSettings } from '../types/tabProtection';
import {
  getTabProtectionSettings,
  saveTabProtectionSettings,
  DEFAULT_TAB_PROTECTION_SETTINGS,
} from '../types/tabProtection';

interface UseTabProtectionSettingsReturn {
  settings: TabProtectionSettings;
  updateSettings: (updates: Partial<TabProtectionSettings>) => void;
  updateProtectionTiming: (
    updates: Partial<TabProtectionSettings['protectionTiming']>
  ) => void;
  updateCustomMessages: (
    updates: Partial<TabProtectionSettings['customMessages']>
  ) => void;
  updateVisualSettings: (
    updates: Partial<TabProtectionSettings['visualSettings']>
  ) => void;
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

export const useTabProtectionSettings = (): UseTabProtectionSettingsReturn => {
  const [settings, setSettings] = useState<TabProtectionSettings>(() =>
    getTabProtectionSettings()
  );

  // Listen for settings changes from other tabs/windows
  useEffect(() => {
    const handleSettingsChange = (_event: CustomEvent<TabProtectionSettings>) => {
      setSettings(_event.detail);
    };

    const handleStorageChange = (_event: StorageEvent) => {
      if (_event.key === 'tabProtectionSettings') {
        setSettings(getTabProtectionSettings());
      }
    };

    window.addEventListener(
      'tabProtectionSettingsChanged' as any,
      handleSettingsChange
    );
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(
        'tabProtectionSettingsChanged' as any,
        handleSettingsChange
      );
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateSettings = useCallback(
    (updates: Partial<TabProtectionSettings>) => {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      saveTabProtectionSettings(newSettings);
    },
    [settings]
  );

  const updateProtectionTiming = useCallback(
    (updates: Partial<TabProtectionSettings['protectionTiming']>) => {
      const newSettings = {
        ...settings,
        protectionTiming: {
          ...settings.protectionTiming,
          ...updates,
        },
      };
      setSettings(newSettings);
      saveTabProtectionSettings(newSettings);
    },
    [settings]
  );

  const updateCustomMessages = useCallback(
    (updates: Partial<TabProtectionSettings['customMessages']>) => {
      const newSettings = {
        ...settings,
        customMessages: {
          ...settings.customMessages,
          ...updates,
          visualWarningTitle: {
            ...settings.customMessages.visualWarningTitle,
            ...updates.visualWarningTitle,
          },
          accessibilityMessages: {
            ...settings.customMessages.accessibilityMessages,
            ...updates.accessibilityMessages,
          },
        },
      };
      setSettings(newSettings);
      saveTabProtectionSettings(newSettings);
    },
    [settings]
  );

  const updateVisualSettings = useCallback(
    (updates: Partial<TabProtectionSettings['visualSettings']>) => {
      const newSettings = {
        ...settings,
        visualSettings: {
          ...settings.visualSettings,
          ...updates,
        },
      };
      setSettings(newSettings);
      saveTabProtectionSettings(newSettings);
    },
    [settings]
  );

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_TAB_PROTECTION_SETTINGS);
    saveTabProtectionSettings(DEFAULT_TAB_PROTECTION_SETTINGS);
  }, []);

  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  const importSettings = useCallback((settingsJson: string): boolean => {
    try {
      const importedSettings = JSON.parse(settingsJson);

      // Basic validation
      if (typeof importedSettings !== 'object' || importedSettings === null) {
        return false;
      }

      // Merge with defaults to ensure all required fields exist
      const validatedSettings: TabProtectionSettings = {
        ...DEFAULT_TAB_PROTECTION_SETTINGS,
        ...importedSettings,
        protectionTiming: {
          ...DEFAULT_TAB_PROTECTION_SETTINGS.protectionTiming,
          ...importedSettings.protectionTiming,
        },
        customMessages: {
          ...DEFAULT_TAB_PROTECTION_SETTINGS.customMessages,
          ...importedSettings.customMessages,
          visualWarningTitle: {
            ...DEFAULT_TAB_PROTECTION_SETTINGS.customMessages.visualWarningTitle,
            ...importedSettings.customMessages?.visualWarningTitle,
          },
          accessibilityMessages: {
            ...DEFAULT_TAB_PROTECTION_SETTINGS.customMessages.accessibilityMessages,
            ...importedSettings.customMessages?.accessibilityMessages,
          },
        },
        visualSettings: {
          ...DEFAULT_TAB_PROTECTION_SETTINGS.visualSettings,
          ...importedSettings.visualSettings,
        },
      };

      setSettings(validatedSettings);
      saveTabProtectionSettings(validatedSettings);
      return true;
    } catch (_error) {
      console._error('Failed to import settings:', _error);
      return false;
    }
  }, []);

  return {
    settings,
    updateSettings,
    updateProtectionTiming,
    updateCustomMessages,
    updateVisualSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
  };
};

export default useTabProtectionSettings;
