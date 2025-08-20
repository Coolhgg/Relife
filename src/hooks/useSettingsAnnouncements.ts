// Settings-specific screen reader announcement hook
import { useCallback, useEffect, useRef } from "react";
import { useScreenReaderAnnouncements } from "./useScreenReaderAnnouncements";
import type { VoiceMood } from "../types";
import { getVoiceMoodConfig } from "../utils";

export interface SettingsAnnouncement {
  type:
    | "section-toggle"
    | "theme-change"
    | "voice-mood-change"
    | "permission-status"
    | "toggle-switch"
    | "slider-change"
    | "dropdown-change"
    | "setting-update"
    | "validation-error";
  data?: any;
  priority?: "polite" | "assertive";
}

export function useSettingsAnnouncements() {
  const { announce } = useScreenReaderAnnouncements();
  const previousValues = useRef<Record<string, any>>({});

  // Section expansion/collapse announcements
  const announceSectionToggle = useCallback(
    (sectionName: string, isExpanded: boolean) => {
      const message = isExpanded
        ? `${sectionName} section expanded. Use tab to navigate through options.`
        : `${sectionName} section collapsed.`;

      announce({
        type: "custom",
        message,
        priority: "polite",
      });
    },
    [announce],
  );

  // Theme change announcements
  const announceThemeChange = useCallback(
    (theme: "light" | "dark" | "auto") => {
      const themeDescriptions = {
        light: "Light theme selected. Interface will use bright colors.",
        dark: "Dark theme selected. Interface will use dark colors.",
        auto: "Auto theme selected. Interface will follow system preferences.",
      };

      announce({
        type: "custom",
        message: themeDescriptions[theme],
        priority: "polite",
      });
    },
    [announce],
  );

  // Voice mood change announcements
  const announceVoiceMoodChange = useCallback(
    (mood: VoiceMood) => {
      const moodConfig = getVoiceMoodConfig(mood);

      announce({
        type: "custom",
        message: `Default voice mood changed to ${moodConfig.name}. ${moodConfig.description}`,
        priority: "polite",
      });
    },
    [announce],
  );

  // Permission status announcements
  const announcePermissionStatus = useCallback(
    (permissionName: string, granted: boolean, critical: boolean = false) => {
      const status = granted ? "granted" : "denied";
      const impact = granted
        ? critical
          ? "All features will work normally."
          : "Feature will work normally."
        : critical
          ? "Some features may not work properly. Please enable in device settings."
          : "This feature may be limited. You can enable it in device settings.";

      announce({
        type: "custom",
        message: `${permissionName} permission ${status}. ${impact}`,
        priority: critical && !granted ? "assertive" : "polite",
      });
    },
    [announce],
  );

  // Toggle switch announcements
  const announceToggleSwitch = useCallback(
    (settingName: string, enabled: boolean, description?: string) => {
      const status = enabled ? "enabled" : "disabled";
      const additionalInfo = description ? `. ${description}` : "";

      announce({
        type: "custom",
        message: `${settingName} ${status}${additionalInfo}`,
        priority: "polite",
      });
    },
    [announce],
  );

  // Slider change announcements (with debouncing)
  const announceSliderChange = useCallback(
    (
      sliderName: string,
      value: number,
      min: number,
      max: number,
      label?: string,
    ) => {
      // Calculate percentage and description
      const percentage = Math.round(((value - min) / (max - min)) * 100);
      const valueLabel = label || `${value}`;

      let intensityDescription = "";
      if (percentage <= 20) intensityDescription = "Very low";
      else if (percentage <= 40) intensityDescription = "Low";
      else if (percentage <= 60) intensityDescription = "Medium";
      else if (percentage <= 80) intensityDescription = "High";
      else intensityDescription = "Very high";

      announce({
        type: "custom",
        message: `${sliderName} set to ${valueLabel}. ${intensityDescription} level.`,
        priority: "polite",
      });
    },
    [announce],
  );

  // Dropdown change announcements
  const announceDropdownChange = useCallback(
    (settingName: string, selectedValue: string, description?: string) => {
      const additionalInfo = description ? `. ${description}` : "";

      announce({
        type: "custom",
        message: `${settingName} changed to ${selectedValue}${additionalInfo}`,
        priority: "polite",
      });
    },
    [announce],
  );

  // Settings validation error announcements
  const announceValidationError = useCallback(
    (fieldName: string, errorMessage: string) => {
      announce({
        type: "error",
        data: { fieldName, errorMessage },
        priority: "assertive",
      });
    },
    [announce],
  );

  // Settings save confirmation
  const announceSettingsSaved = useCallback(
    (settingType?: string) => {
      const message = settingType
        ? `${settingType} settings saved successfully.`
        : "Settings saved successfully.";

      announce({
        type: "success",
        message,
        priority: "polite",
      });
    },
    [announce],
  );

  // Click-to-hear functionality for settings
  const announceSettingDescription = useCallback(
    (settingName: string, currentValue: string, description: string) => {
      announce({
        type: "custom",
        message: `${settingName}. Current value: ${currentValue}. ${description}`,
        priority: "polite",
      });
    },
    [announce],
  );

  // Loading state announcements for settings
  const announceSettingsLoading = useCallback(
    (action: string, isLoading: boolean) => {
      if (isLoading) {
        announce({
          type: "custom",
          message: `${action} in progress. Please wait.`,
          priority: "polite",
        });
      } else {
        announce({
          type: "custom",
          message: `${action} completed.`,
          priority: "polite",
        });
      }
    },
    [announce],
  );

  // Link/button click announcements for external actions
  const announceLinkActivation = useCallback(
    (linkName: string, opensInNewWindow: boolean = false) => {
      const windowInfo = opensInNewWindow ? " Opening in new window." : "";
      announce({
        type: "custom",
        message: `Activating ${linkName}.${windowInfo}`,
        priority: "polite",
      });
    },
    [announce],
  );

  return {
    announceSectionToggle,
    announceThemeChange,
    announceVoiceMoodChange,
    announcePermissionStatus,
    announceToggleSwitch,
    announceSliderChange,
    announceDropdownChange,
    announceValidationError,
    announceSettingsSaved,
    announceSettingDescription,
    announceSettingsLoading,
    announceLinkActivation,
  };
}

export default useSettingsAnnouncements;
