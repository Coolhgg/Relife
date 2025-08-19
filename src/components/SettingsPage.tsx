import React from "react";
import { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Bell,
  Smartphone,
  Volume2,
  Shield,
  Info,
  ExternalLink,
  LogOut,
  Bug,
  Palette,
  Zap,
  Settings,
  Eye,
  AlertTriangle,
} from "lucide-react";
import type { AppState, VoiceMood, Theme } from "../types";
import { VOICE_MOODS } from "../utils";
import UserProfile from "./UserProfile";
import ErrorBoundaryTest from "./ErrorBoundaryTest";
import PushNotificationSettingsComponent from "./PushNotificationSettings";
import PushNotificationTester from "./PushNotificationTester";
import PersonalizationSettings from "./PersonalizationSettings";
import TabProtectionSettings from "./TabProtectionSettings";
import ThemeManager from "./ThemeManager";
import CloudSyncControls from "./CloudSyncControls";
import { useSettingsAnnouncements } from "../hooks/useSettingsAnnouncements";
import { useFocusAnnouncements } from "../hooks/useScreenReaderAnnouncements";
import { useTheme } from "../hooks/useTheme";
import SoundSettings from "./SoundSettings";

interface SettingsPageProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  onTestVoice?: (mood: VoiceMood) => Promise<void>;
  onUpdateProfile?: (updates: any) => Promise<void>;
  onSignOut?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  appState,
  onUpdateProfile,
  onSignOut,
  isLoading = false,
  error = null,
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showErrorTest, setShowErrorTest] = useState(false);

  // Announce page entry
  useEffect(() => {
    announceEnter(
      "Settings page loaded. Use tab to navigate through different setting categories.",
    );
  }, [announceEnter]);

  // Announce permission status on component mount
  useEffect(() => {
    if (appState.permissions) {
      setTimeout(() => {
        announcePermissionStatus(
          "Notifications",
          appState.permissions.notifications.granted,
          true,
        );
        announcePermissionStatus(
          "Microphone",
          appState.permissions.microphone.granted,
          false,
        );
      }, 1000);
    }
  }, [appState.permissions, announcePermissionStatus]);
  // Get theme from context instead of local state
  const {
    theme: currentTheme,
    setTheme,
    availableThemes,
    isDarkMode,
  } = useTheme();
  const [defaultVoiceMood, setDefaultVoiceMood] =
    useState<VoiceMood>("motivational");
  const [voiceSensitivity, setVoiceSensitivity] = useState(5);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [snoozeDuration, setSnoozeDuration] = useState("10");
  const [maxSnoozes, setMaxSnoozes] = useState("5");
  const [tabProtectionEnabled, setTabProtectionEnabled] = useState(() => {
    // Get from localStorage or default to true
    const stored = localStorage.getItem("tabProtectionEnabled");
    return stored !== null ? JSON.parse(stored) : true;
  });

  const {
    announceSectionToggle,
    announceThemeChange,
    announceVoiceMoodChange,
    announcePermissionStatus,
    announceToggleSwitch,
    announceSliderChange,
    announceDropdownChange,
    announceSettingDescription,
    announceLinkActivation,
  } = useSettingsAnnouncements();

  const { announceEnter } = useFocusAnnouncements("Settings");

  const toggleSection = (section: string) => {
    const wasActive = activeSection === section;
    const newState = wasActive ? null : section;
    setActiveSection(newState);

    // Announce section toggle
    if (!wasActive) {
      const sectionNames = {
        permissions: "Permissions",
        appearance: "Appearance",
        themes: "Themes and Appearance",
        personalization: "Advanced Personalization",
        voice: "Voice Settings",
        notifications: "Notifications",
        cloudsync: "Cloud Sync",
        security: "Security & Privacy",
        about: "About",
      };
      announceSectionToggle(
        sectionNames[section as keyof typeof sectionNames] || section,
        true,
      );
    } else {
      announceSectionToggle("Section", false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, section: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleSection(section);
    }
  };

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    announceThemeChange(theme);
    console.log("Theme changed to:", theme);
  };

  const handleDefaultVoiceMoodChange = (mood: VoiceMood) => {
    setDefaultVoiceMood(mood);
    announceVoiceMoodChange(mood);
    console.log("Default voice mood changed to:", mood);
  };

  // Handler functions for interactive elements
  const handleVoiceSensitivityChange = (value: number) => {
    setVoiceSensitivity(value);
    announceSliderChange("Voice dismissal sensitivity", value, 1, 10);
  };

  const handlePushNotificationsToggle = () => {
    const newValue = !pushNotifications;
    setPushNotifications(newValue);
    announceToggleSwitch(
      "Push notifications",
      newValue,
      newValue
        ? "You will receive alarm notifications"
        : "You will not receive alarm notifications",
    );
  };

  const handleHapticFeedbackToggle = () => {
    const newValue = !hapticFeedback;
    setHapticFeedback(newValue);
    announceToggleSwitch(
      "Haptic feedback",
      newValue,
      newValue
        ? "Device will vibrate on interactions"
        : "Device will not vibrate on interactions",
    );
  };

  const handleSnoozeDurationChange = (value: string) => {
    setSnoozeDuration(value);
    announceDropdownChange(
      "Snooze duration",
      `${value} minutes`,
      `Alarms will snooze for ${value} minutes when snoozed`,
    );
  };

  const handleMaxSnoozesChange = (value: string) => {
    setMaxSnoozes(value);
    const description =
      value === "-1"
        ? "Alarms can be snoozed unlimited times"
        : `Alarms can be snoozed up to ${value} times before stopping`;
    announceDropdownChange(
      "Maximum snoozes",
      value === "-1" ? "Unlimited" : `${value} times`,
      description,
    );
  };

  const handleLinkClick = (linkName: string) => {
    announceLinkActivation(linkName, true);
    // In a real app, this would open the link
    console.log(`Opening ${linkName}`);
  };

  // Click-to-hear functionality for settings descriptions
  const handleSettingDescriptionClick = (
    settingName: string,
    currentValue: string,
    description: string,
  ) => {
    announceSettingDescription(settingName, currentValue, description);
  };

  const renderPermissionStatus = (granted: boolean, label: string) => (
    <div
      className={`flex items-center gap-2 text-sm ${
        granted
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400"
      }`}
      role="status"
      aria-label={`${label} permission is ${granted ? "granted" : "denied"}`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          granted ? "bg-green-500" : "bg-red-500"
        }`}
        role="img"
        aria-label={granted ? "Permission granted" : "Permission denied"}
      />
      <span>{granted ? `${label} granted` : `${label} denied`}</span>
    </div>
  );

  return (
    <>
      <main
        className="p-4 space-y-4"
        role="main"
        aria-labelledby="settings-heading"
      >
        <h1
          id="settings-heading"
          className="text-xl font-bold mb-6 text-gray-900 dark:text-white"
        >
          Settings
        </h1>

        {/* User Profile Section */}
        {appState.user && (
          <section className="mb-6">
            <UserProfile
              user={appState.user}
              onUpdateProfile={onUpdateProfile || (() => Promise.resolve())}
              onSignOut={onSignOut || (() => {})}
              isLoading={isLoading}
              error={error}
            />
          </section>
        )}

        {/* App Permissions */}
        <section className="alarm-card">
          <button
            onClick={() => toggleSection("permissions")}
            onKeyDown={(e) => handleKeyDown(e, "permissions")}
            className="w-full flex items-center justify-between p-1"
            aria-expanded={activeSection === "permissions"}
            aria-controls="permissions-content"
            aria-labelledby="permissions-heading"
          >
            <div className="flex items-center gap-3">
              <Shield
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                aria-hidden="true"
              />
              <span
                id="permissions-heading"
                className="font-medium text-gray-900 dark:text-white"
              >
                Permissions
              </span>
            </div>
          </button>

          {activeSection === "permissions" && (
            <div
              id="permissions-content"
              className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-3"
              role="region"
              aria-labelledby="permissions-heading"
            >
              {renderPermissionStatus(
                appState.permissions.notifications.granted,
                "Notifications",
              )}
              {renderPermissionStatus(
                appState.permissions.microphone.granted,
                "Microphone",
              )}

              <div
                className="text-xs text-gray-500 dark:text-gray-400 mt-3"
                role="note"
              >
                If permissions are denied, some features may not work properly.
                You can enable them in your device settings.
              </div>
            </div>
          )}
        </section>

        {/* Appearance */}
        <section className="alarm-card">
          <button
            onClick={() => toggleSection("appearance")}
            onKeyDown={(e) => handleKeyDown(e, "appearance")}
            className="w-full flex items-center justify-between p-1"
            aria-expanded={activeSection === "appearance"}
            aria-controls="appearance-content"
            aria-labelledby="appearance-heading"
          >
            <div className="flex items-center gap-3">
              <Sun
                className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                aria-hidden="true"
              />
              <span
                id="appearance-heading"
                className="font-medium text-gray-900 dark:text-white"
              >
                Appearance
              </span>
            </div>
          </button>

          {activeSection === "appearance" && (
            <div
              id="appearance-content"
              className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-4"
              role="region"
              aria-labelledby="appearance-heading"
            >
              <fieldset>
                <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  Theme Selection
                </legend>

                {/* Primary Theme Options */}
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Primary Themes
                  </div>
                  <div
                    className="grid grid-cols-3 gap-2"
                    role="radiogroup"
                    aria-label="Primary theme selection"
                  >
                    {["light", "dark", "auto"].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => handleThemeChange(theme as Theme)}
                        className={`alarm-button ${
                          currentTheme === theme
                            ? "alarm-button-primary"
                            : "alarm-button-secondary"
                        } py-3 text-sm capitalize flex flex-col items-center gap-1`}
                        role="radio"
                        aria-checked={theme === currentTheme}
                        aria-label={`${theme} theme`}
                        aria-describedby={`theme-${theme}-desc`}
                      >
                        {theme === "light" && (
                          <Sun className="w-4 h-4" aria-hidden="true" />
                        )}
                        {theme === "dark" && (
                          <Moon className="w-4 h-4" aria-hidden="true" />
                        )}
                        {theme === "auto" && (
                          <Smartphone className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span className="text-xs">{theme}</span>
                        <span id={`theme-${theme}-desc`} className="sr-only">
                          {theme === "light" &&
                            "Use bright colors for the interface"}
                          {theme === "dark" &&
                            "Use dark colors for the interface"}
                          {theme === "auto" &&
                            "Follow system theme preferences"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accessibility Themes */}
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Accessibility
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleThemeChange("high-contrast")}
                      className={`alarm-button ${
                        currentTheme === "high-contrast"
                          ? "alarm-button-primary"
                          : "alarm-button-secondary"
                      } py-3 text-sm flex items-center gap-2`}
                      role="radio"
                      aria-checked={currentTheme === "high-contrast"}
                      aria-label="High contrast theme for better accessibility"
                    >
                      <Zap className="w-4 h-4" aria-hidden="true" />
                      <div className="text-left">
                        <div className="font-medium">High Contrast</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Enhanced visibility and contrast
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleThemeChange("focus")}
                      className={`alarm-button ${
                        currentTheme === "focus"
                          ? "alarm-button-primary"
                          : "alarm-button-secondary"
                      } py-3 text-sm flex items-center gap-2`}
                      role="radio"
                      aria-checked={currentTheme === "focus"}
                      aria-label="Focus theme for minimal distraction"
                    >
                      <Eye className="w-4 h-4" aria-hidden="true" />
                      <div className="text-left">
                        <div className="font-medium">Focus</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Minimal distraction for concentration
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Specialized Themes */}
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Specialized
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        id: "gaming",
                        icon: "🎮",
                        name: "Gaming",
                        desc: "Dark with neon accents",
                      },
                      {
                        id: "professional",
                        icon: "💼",
                        name: "Professional",
                        desc: "Clean business theme",
                      },
                      {
                        id: "retro",
                        icon: "📺",
                        name: "Retro",
                        desc: "80s inspired colors",
                      },
                      {
                        id: "cyberpunk",
                        icon: "🌆",
                        name: "Cyberpunk",
                        desc: "Futuristic neon theme",
                      },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id as Theme)}
                        className={`alarm-button ${
                          currentTheme === theme.id
                            ? "alarm-button-primary"
                            : "alarm-button-secondary"
                        } py-2 text-sm flex items-center gap-2 text-left`}
                        role="radio"
                        aria-checked={currentTheme === theme.id}
                        aria-label={`${theme.name}: ${theme.desc}`}
                      >
                        <span className="text-lg" aria-hidden="true">
                          {theme.icon}
                        </span>
                        <div>
                          <div className="font-medium text-xs">
                            {theme.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                            {theme.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seasonal Themes */}
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Seasonal
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        id: "spring",
                        icon: "🌸",
                        name: "Spring",
                        desc: "Fresh greens and pastels",
                      },
                      {
                        id: "summer",
                        icon: "☀️",
                        name: "Summer",
                        desc: "Bright blues and oranges",
                      },
                      {
                        id: "autumn",
                        icon: "🍁",
                        name: "Autumn",
                        desc: "Warm browns and golds",
                      },
                      {
                        id: "winter",
                        icon: "❄️",
                        name: "Winter",
                        desc: "Cool blues and whites",
                      },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id as Theme)}
                        className={`alarm-button ${
                          currentTheme === theme.id
                            ? "alarm-button-primary"
                            : "alarm-button-secondary"
                        } py-2 text-sm flex items-center gap-2 text-left`}
                        role="radio"
                        aria-checked={currentTheme === theme.id}
                        aria-label={`${theme.name}: ${theme.desc}`}
                      >
                        <span className="text-lg" aria-hidden="true">
                          {theme.icon}
                        </span>
                        <div>
                          <div className="font-medium text-xs">
                            {theme.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                            {theme.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nature & Abstract Themes */}
                <div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Nature & Abstract
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "nature",
                      "ocean",
                      "sunset",
                      "cosmic",
                      "gradient",
                      "neon",
                    ].map((theme) => {
                      const themeInfo = {
                        nature: {
                          icon: "🌿",
                          name: "Nature",
                          desc: "Earth tones and natural colors",
                        },
                        ocean: {
                          icon: "🌊",
                          name: "Ocean",
                          desc: "Cool blues and aquatic vibes",
                        },
                        sunset: {
                          icon: "🌅",
                          name: "Sunset",
                          desc: "Warm oranges and golden hues",
                        },
                        cosmic: {
                          icon: "🌌",
                          name: "Cosmic",
                          desc: "Deep space purples and blues",
                        },
                        gradient: {
                          icon: "🎨",
                          name: "Gradient",
                          desc: "Smooth color transitions",
                        },
                        neon: {
                          icon: "⚡",
                          name: "Neon",
                          desc: "Bright electric colors",
                        },
                      }[theme] || {
                        icon: "🎨",
                        name: theme,
                        desc: "Custom theme",
                      };

                      return (
                        <button
                          key={theme}
                          onClick={() => handleThemeChange(theme as Theme)}
                          className={`alarm-button ${
                            currentTheme === theme
                              ? "alarm-button-primary"
                              : "alarm-button-secondary"
                          } py-2 text-sm flex items-center gap-2 text-left`}
                          role="radio"
                          aria-checked={currentTheme === theme}
                          aria-label={`${themeInfo.name}: ${themeInfo.desc}`}
                        >
                          <span className="text-lg" aria-hidden="true">
                            {themeInfo.icon}
                          </span>
                          <div>
                            <div className="font-medium text-xs">
                              {themeInfo.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                              {themeInfo.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Current Theme Info */}
                <div className="mt-4 p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Palette
                      className="w-4 h-4 text-blue-500"
                      aria-hidden="true"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Current:{" "}
                        {currentTheme.charAt(0).toUpperCase() +
                          currentTheme.slice(1)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {isDarkMode ? "Dark mode active" : "Light mode active"}
                      </div>
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>
          )}
        </section>

        {/* Themes & Appearance */}
        <section className="alarm-card">
          <button
            onClick={() => toggleSection("themes")}
            onKeyDown={(e) => handleKeyDown(e, "themes")}
            className="w-full flex items-center justify-between p-1"
            aria-expanded={activeSection === "themes"}
            aria-controls="themes-content"
            aria-labelledby="themes-heading"
          >
            <div className="flex items-center gap-3">
              <Palette
                className="w-5 h-5 text-purple-600 dark:text-purple-400"
                aria-hidden="true"
              />
              <span
                id="themes-heading"
                className="font-medium text-gray-900 dark:text-white"
              >
                Themes & Appearance
              </span>
            </div>
          </button>

          {activeSection === "themes" && (
            <div
              id="themes-content"
              className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300"
              role="region"
              aria-labelledby="themes-heading"
            >
              <ThemeManager compact />
            </div>
          )}
        </section>

        {/* Advanced Personalization */}
        <section className="alarm-card">
          <button
            onClick={() => toggleSection("personalization")}
            onKeyDown={(e) => handleKeyDown(e, "personalization")}
            className="w-full flex items-center justify-between p-1"
            aria-expanded={activeSection === "personalization"}
            aria-controls="personalization-content"
            aria-labelledby="personalization-heading"
          >
            <div className="flex items-center gap-3">
              <Settings
                className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                aria-hidden="true"
              />
              <span
                id="personalization-heading"
                className="font-medium text-gray-900 dark:text-white"
              >
                Advanced Personalization
              </span>
            </div>
          </button>

          {activeSection === "personalization" && (
            <div
              id="personalization-content"
              className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300"
              role="region"
              aria-labelledby="personalization-heading"
            >
              <PersonalizationSettings />
            </div>
          )}
        </section>

        {/* Cloud Sync */}
        <section className="alarm-card">
          <button
            onClick={() => toggleSection("cloudsync")}
            onKeyDown={(e) => handleKeyDown(e, "cloudsync")}
            className="w-full flex items-center justify-between p-1"
            aria-expanded={activeSection === "cloudsync"}
            aria-controls="cloudsync-content"
            aria-labelledby="cloudsync-heading"
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              <span
                id="cloudsync-heading"
                className="font-medium text-gray-900 dark:text-white"
              >
                Cloud Sync
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Sync across devices
              </span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 text-gray-400 ${
                  activeSection === "cloudsync" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>

          {activeSection === "cloudsync" && (
            <div
              id="cloudsync-content"
              className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300"
              role="region"
              aria-labelledby="cloudsync-heading"
            >
              <CloudSyncControls />
            </div>
          )}
        </section>

        {/* Voice Settings */}
        <section className="alarm-card">
          <button
            onClick={() => toggleSection("voice")}
            onKeyDown={(e) => handleKeyDown(e, "voice")}
            className="w-full flex items-center justify-between p-1"
            aria-expanded={activeSection === "voice"}
            aria-controls="voice-content"
            aria-labelledby="voice-heading"
          >
            <div className="flex items-center gap-3">
              <Volume2
                className="w-5 h-5 text-purple-600 dark:text-purple-400"
                aria-hidden="true"
              />
              <span
                id="voice-heading"
                className="font-medium text-gray-900 dark:text-white"
              >
                Voice Settings
              </span>
            </div>
          </button>

          {activeSection === "voice" && (
            <div
              id="voice-content"
              className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-4"
              role="region"
              aria-labelledby="voice-heading"
            >
              <fieldset>
                <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  Default Voice Mood
                </legend>
                <div
                  className="grid grid-cols-2 gap-2"
                  role="radiogroup"
                  aria-label="Default voice mood selection"
                >
                  {VOICE_MOODS.slice(0, 4).map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => handleDefaultVoiceMoodChange(mood.id)}
                      className={`alarm-button ${defaultVoiceMood === mood.id ? "alarm-button-primary" : "alarm-button-secondary"} p-3 text-left`}
                      role="radio"
                      aria-checked={mood.id === defaultVoiceMood}
                      aria-label={`${mood.name}: ${mood.description}`}
                      aria-describedby={`mood-${mood.id}-desc`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span aria-hidden="true">{mood.icon}</span>
                        <span className="text-sm font-medium">{mood.name}</span>
                      </div>
                      <div
                        id={`mood-${mood.id}-desc`}
                        className="text-xs text-gray-500 dark:text-gray-400"
                      >
                        {mood.description}
                      </div>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="voice-sensitivity"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
                >
                  Voice Dismissal Sensitivity
                </label>
                <input
                  id="voice-sensitivity"
                  type="range"
                  min="1"
                  max="10"
                  value={voiceSensitivity}
                  onChange={(e) =>
                    handleVoiceSensitivityChange(parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 dark:bg-dark-300 rounded-lg appearance-none cursor-pointer"
                  aria-describedby="sensitivity-help"
                  aria-valuemin={1}
                  aria-valuemax={10}
                  aria-valuenow={voiceSensitivity}
                  aria-valuetext={`${voiceSensitivity} out of 10, ${voiceSensitivity <= 2 ? "Very low" : voiceSensitivity <= 4 ? "Low" : voiceSensitivity <= 6 ? "Medium" : voiceSensitivity <= 8 ? "High" : "Very high"} sensitivity`}
                />
                <div
                  id="sensitivity-help"
                  className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1"
                >
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Sound Settings */}
        <section className="alarm-card">
          <button
            onClick={() => toggleSection("sounds")}
            onKeyDown={(e) => handleKeyDown(e, "sounds")}
            className="w-full flex items-center justify-between p-1"
            aria-expanded={activeSection === "sounds"}
            aria-controls="sounds-content"
            aria-labelledby="sounds-heading"
          >
            <div className="flex items-center gap-3">
              <Volume2
                className="w-5 h-5 text-purple-600 dark:text-purple-400"
                aria-hidden="true"
              />
              <span
                id="sounds-heading"
                className="font-medium text-gray-900 dark:text-white"
              >
                Sound Effects
              </span>
            </div>
          </button>

          {activeSection === "sounds" && (
            <div
              id="sounds-content"
              className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300"
              role="region"
              aria-labelledby="sounds-heading"
            >
              <SoundSettings userId={appState.user?.id} />
            </div>
          )}
        </section>

        {/* Notification Settings */}
        <section className="alarm-card">
          <button
            onClick={() => toggleSection("notifications")}
            onKeyDown={(e) => handleKeyDown(e, "notifications")}
            className="w-full flex items-center justify-between p-1"
            aria-expanded={activeSection === "notifications"}
            aria-controls="notifications-content"
            aria-labelledby="notifications-heading"
          >
            <div className="flex items-center gap-3">
              <Bell
                className="w-5 h-5 text-green-600 dark:text-green-400"
                aria-hidden="true"
              />
              <span
                id="notifications-heading"
                className="font-medium text-gray-900 dark:text-white"
              >
                Notifications
              </span>
            </div>
          </button>

          {activeSection === "notifications" && (
            <div
              id="notifications-content"
              className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-6"
              role="region"
              aria-labelledby="notifications-heading"
            >
              {/* Push Notification Settings */}
              <div>
                <PushNotificationSettingsComponent className="" />
              </div>

              {/* Push Notification Tester */}
              <div>
                <PushNotificationTester />
              </div>

              {/* Legacy Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Alarm Settings
                </h4>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Haptic Feedback
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Vibrate on interactions
                    </div>
                  </div>
                  <button
                    onClick={handleHapticFeedbackToggle}
                    className={`alarm-toggle ${hapticFeedback ? "alarm-toggle-checked" : "alarm-toggle-unchecked"}`}
                    role="switch"
                    aria-checked={hapticFeedback}
                    aria-label={`Haptic feedback ${hapticFeedback ? "enabled" : "disabled"}`}
                    aria-describedby="haptic-desc"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSettingDescriptionClick(
                          "Haptic feedback",
                          hapticFeedback ? "enabled" : "disabled",
                          "Device will vibrate when you interact with buttons and controls",
                        );
                      }
                    }}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hapticFeedback ? "translate-x-5" : "translate-x-0"}`}
                      aria-hidden="true"
                    />
                    <span id="haptic-desc" className="sr-only">
                      Toggle haptic feedback on or off
                    </span>
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="snooze-duration"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
                  >
                    Snooze Duration (minutes)
                  </label>
                  <select
                    id="snooze-duration"
                    value={snoozeDuration}
                    onChange={(e) => handleSnoozeDurationChange(e.target.value)}
                    className="alarm-input"
                    aria-describedby="snooze-duration-desc"
                  >
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                  </select>
                  <div id="snooze-duration-desc" className="sr-only">
                    How long to snooze alarms when snooze button is pressed
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="max-snoozes"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
                  >
                    Maximum Snoozes
                  </label>
                  <select
                    id="max-snoozes"
                    value={maxSnoozes}
                    onChange={(e) => handleMaxSnoozesChange(e.target.value)}
                    className="alarm-input"
                    aria-describedby="max-snoozes-desc"
                  >
                    <option value="3">3 times</option>
                    <option value="5">5 times</option>
                    <option value="10">10 times</option>
                    <option value="-1">Unlimited</option>
                  </select>
                  <div id="max-snoozes-desc" className="sr-only">
                    Maximum number of times an alarm can be snoozed before it
                    stops
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Security & Privacy */}
        <section className="alarm-card">
          <button
            onClick={() => toggleSection("security")}
            onKeyDown={(e) => handleKeyDown(e, "security")}
            className="w-full flex items-center justify-between p-1"
            aria-expanded={activeSection === "security"}
            aria-controls="security-content"
            aria-labelledby="security-heading"
          >
            <div className="flex items-center gap-3">
              <Shield
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                aria-hidden="true"
              />
              <span
                id="security-heading"
                className="font-medium text-gray-900 dark:text-white"
              >
                Security & Privacy
              </span>
            </div>
          </button>

          {activeSection === "security" && (
            <div
              id="security-content"
              className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-4"
              role="region"
              aria-labelledby="security-heading"
            >
              <TabProtectionSettings />
            </div>
          )}
        </section>

        {/* About */}
        <section className="alarm-card">
          <button
            onClick={() => toggleSection("about")}
            onKeyDown={(e) => handleKeyDown(e, "about")}
            className="w-full flex items-center justify-between p-1"
            aria-expanded={activeSection === "about"}
            aria-controls="about-content"
            aria-labelledby="about-heading"
          >
            <div className="flex items-center gap-3">
              <Info
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                aria-hidden="true"
              />
              <span
                id="about-heading"
                className="font-medium text-gray-900 dark:text-white"
              >
                About
              </span>
            </div>
          </button>

          {activeSection === "about" && (
            <div
              id="about-content"
              className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-4"
              role="region"
              aria-labelledby="about-heading"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Smart Alarm
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Version 1.0.0
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                  Wake up with personalized voice messages and intelligent
                  features.
                </div>
              </div>

              <nav
                className="space-y-3"
                role="navigation"
                aria-label="App information links"
              >
                <button
                  onClick={() => handleLinkClick("Privacy Policy")}
                  className="alarm-button alarm-button-secondary w-full flex items-center justify-center gap-2"
                  aria-label="Open privacy policy in new window"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  Privacy Policy
                </button>

                <button
                  onClick={() => handleLinkClick("Terms of Service")}
                  className="alarm-button alarm-button-secondary w-full flex items-center justify-center gap-2"
                  aria-label="Open terms of service in new window"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  Terms of Service
                </button>

                <button
                  onClick={() => handleLinkClick("Contact Support")}
                  className="alarm-button alarm-button-secondary w-full flex items-center justify-center gap-2"
                  aria-label="Contact support team"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  Contact Support
                </button>
              </nav>
            </div>
          )}
        </section>

        {/* Development Tools - Only shown in development mode */}
        {process.env.NODE_ENV === "development" && (
          <section className="alarm-card bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800">
            <button
              onClick={() => toggleSection("development")}
              onKeyDown={(e) => handleKeyDown(e, "development")}
              className="w-full flex items-center justify-between p-1"
              aria-expanded={activeSection === "development"}
              aria-controls="development-content"
              aria-labelledby="development-heading"
            >
              <div className="flex items-center gap-3">
                <Bug
                  className="w-5 h-5 text-orange-600 dark:text-orange-400"
                  aria-hidden="true"
                />
                <span
                  id="development-heading"
                  className="font-medium text-orange-900 dark:text-orange-100"
                >
                  Development Tools
                </span>
              </div>
            </button>

            {activeSection === "development" && (
              <div
                id="development-content"
                className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-700 space-y-4"
                role="region"
                aria-labelledby="development-heading"
              >
                <div className="bg-orange-100 dark:bg-orange-900/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Bug className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-1">
                        Error Boundary Testing
                      </h4>
                      <p className="text-orange-800 dark:text-orange-200 text-sm mb-3">
                        Test error boundaries by triggering intentional errors.
                        This helps ensure the app handles errors gracefully.
                      </p>
                      <button
                        onClick={() => setShowErrorTest(true)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Open Error Boundary Test
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Footer */}
        <footer
          className="text-center text-xs text-gray-500 dark:text-gray-400 pt-6"
          role="contentinfo"
        >
          Made with ❤️ for better mornings
        </footer>
      </main>

      {/* Error Boundary Test Modal */}
      {showErrorTest && (
        <ErrorBoundaryTest onClose={() => setShowErrorTest(false)} />
      )}
    </>
  );
};

export default SettingsPage;
