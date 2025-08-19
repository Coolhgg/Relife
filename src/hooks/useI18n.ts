import { useTranslation } from "react-i18next";
import { useLanguage } from "../contexts/LanguageContext";
import { SupportedLanguage } from "../config/i18n";

/**
 * Enhanced i18n hook that combines react-i18next with our language context
 * Provides easy access to translations and language utilities
 */
export const useI18n = (namespace?: string) => {
  const { t: baseT, i18n } = useTranslation(
    namespace ? [namespace, "common"] : ["common"],
  );
  const language = useLanguage();

  // Enhanced translation function with better type safety and fallbacks
  const t = (key: string, options?: Record<string, unknown>) => {
    try {
      const translated = baseT(key, options);

      // If translation is the same as key, it might be missing
      if (translated === key && process.env.NODE_ENV === "development") {
        console.warn(
          `Missing translation for key: ${key} in namespace: ${namespace || "common"}`,
        );
      }

      return translated;
    } catch (error) {
      console.error("Translation error:", error);
      return key; // Fallback to key
    }
  };

  // Pluralization helper
  const tp = (
    key: string,
    count: number,
    options?: Record<string, unknown>,
  ) => {
    return t(key, { count, ...options });
  };

  // Interpolation helper for common patterns
  const ti = (key: string, interpolations: Record<string, unknown>) => {
    return t(key, interpolations);
  };

  // Conditional translation - returns empty string if key doesn't exist
  const tc = (key: string, options?: Record<string, unknown>) => {
    return language.tExists(key) ? t(key, options) : "";
  };

  // Translation with default value
  const td = (
    key: string,
    defaultValue: string,
    options?: Record<string, unknown>,
  ) => {
    const translated = t(key, options);
    return translated === key ? defaultValue : translated;
  };

  // Array translation helper (for lists like weekdays, months, etc.)
  const ta = (baseKey: string, items: string[]) => {
    return items.map((item) => t(`${baseKey}.${item}`));
  };

  // Date and time translation helpers
  const formatAlarmTime = (time: string) => {
    return language.formatTime(time);
  };

  const formatAlarmDate = (date: Date) => {
    return language.formatDate(date);
  };

  const formatRelativeAlarmTime = (date: Date) => {
    return language.formatRelativeTime(date);
  };

  // Weekday translations
  const getWeekdayNames = (short: boolean = false) => {
    const baseKey = short ? "common:weekdays" : "common:weekdays";
    const suffix = short ? "_short" : "";

    return [
      t(`${baseKey}.sunday${suffix}`),
      t(`${baseKey}.monday${suffix}`),
      t(`${baseKey}.tuesday${suffix}`),
      t(`${baseKey}.wednesday${suffix}`),
      t(`${baseKey}.thursday${suffix}`),
      t(`${baseKey}.friday${suffix}`),
      t(`${baseKey}.saturday${suffix}`),
    ];
  };

  // Time period translations
  const getTimePeriods = () => ({
    morning: t("common:time.morning"),
    afternoon: t("common:time.afternoon"),
    evening: t("common:time.evening"),
    night: t("common:time.night"),
  });

  // Voice mood translations for alarms
  const getVoiceMoods = () => ({
    gentle: t("alarms:create.moods.gentle"),
    energetic: t("alarms:create.moods.energetic"),
    motivational: t("alarms:create.moods.motivational"),
    "drill-sergeant": t("alarms:create.moods.drill-sergeant"),
    funny: t("alarms:create.moods.funny"),
    calm: t("alarms:create.moods.calm"),
  });

  // Difficulty level translations
  const getDifficultyLevels = () => ({
    easy: t("alarms:create.difficulties.easy"),
    medium: t("alarms:create.difficulties.medium"),
    hard: t("alarms:create.difficulties.hard"),
    nuclear: t("alarms:create.difficulties.nuclear"),
  });

  // Error message helper
  const getErrorMessage = (errorKey: string, fallback?: string) => {
    const errorMessage = tc(`errors:${errorKey}`);
    if (errorMessage) return errorMessage;

    // Try general error
    const generalError = tc(`errors:general.${errorKey}`);
    if (generalError) return generalError;

    return fallback || t("errors:general.unknownError");
  };

  // Success message helper
  const getSuccessMessage = (successKey: string, context?: string) => {
    const contextPrefix = context ? `${context}.` : "";
    return (
      tc(`${contextPrefix}messages.${successKey}`) ||
      tc(`common:status.success`)
    );
  };

  // Language direction helpers for styling
  const getDirectionStyles = () => ({
    textAlign: language.isRTL ? ("right" as const) : ("left" as const),
    direction: language.getTextDirection(),
    flexDirection: language.getFlexDirection(),
  });

  // Responsive text helper based on language
  const getResponsiveText = (
    shortKey: string,
    longKey: string,
    useShort: boolean = false,
  ) => {
    return useShort ? t(shortKey) : t(longKey);
  };

  // Navigation text helper
  const getNavigationLabels = () => ({
    dashboard: t("common:navigation.dashboard"),
    alarms: t("common:navigation.alarms"),
    advanced: t("common:navigation.advanced"),
    gaming: t("common:navigation.gaming"),
    settings: t("common:navigation.settings"),
    premium: t("common:navigation.premium"),
  });

  // Action button labels
  const getActionLabels = () => ({
    save: t("common:app.save"),
    cancel: t("common:app.cancel"),
    delete: t("common:app.delete"),
    edit: t("common:app.edit"),
    add: t("common:app.add"),
    close: t("common:app.close"),
    confirm: t("common:app.confirm"),
    retry: t("common:app.retry"),
    refresh: t("common:app.refresh"),
  });

  // Accessibility labels
  const getA11yLabels = () => ({
    skipToContent: t("common:accessibility.skipToContent"),
    mainContent: t("common:accessibility.mainContent"),
    navigation: t("common:accessibility.navigation"),
    loading: t("common:accessibility.loading"),
    error: t("common:accessibility.error"),
  });

  return {
    // Basic translation functions
    t,
    tp, // pluralization
    ti, // interpolation
    tc, // conditional
    td, // with default
    ta, // array translation

    // Language utilities
    ...language,

    // Formatting helpers
    formatAlarmTime,
    formatAlarmDate,
    formatRelativeAlarmTime,

    // Domain-specific translations
    getWeekdayNames,
    getTimePeriods,
    getVoiceMoods,
    getDifficultyLevels,
    getErrorMessage,
    getSuccessMessage,
    getNavigationLabels,
    getActionLabels,
    getA11yLabels,

    // Styling helpers
    getDirectionStyles,
    getResponsiveText,

    // i18n instance for advanced usage
    i18n,

    // Change language (from context)
    changeLanguage: language.changeLanguage,

    // Current language info
    currentLanguage: language.currentLanguage,
    languageInfo: language.languageInfo,
    isRTL: language.isRTL,
  };
};

// Specialized hooks for specific domains

/**
 * Hook for alarm-related translations
 */
export const useAlarmI18n = () => {
  const i18n = useI18n("alarms");

  const getAlarmStatusText = (status: string) => {
    return i18n.tc(`alarms:status.${status}`) || status;
  };

  const getSnoozeText = (minutes: number, snoozesLeft: number) => {
    return (
      i18n.ti("alarms:ringing.snoozeFor", { minutes }) +
      (snoozesLeft > 0
        ? ` (${i18n.tp("alarms:ringing.snoozesLeft", snoozesLeft)})`
        : "")
    );
  };

  return {
    ...i18n,
    getAlarmStatusText,
    getSnoozeText,
  };
};

/**
 * Hook for authentication-related translations
 */
export const useAuthI18n = () => {
  const i18n = useI18n("auth");

  const getAuthErrorText = (errorCode: string) => {
    return i18n.getErrorMessage(`auth.${errorCode}`, "Authentication failed");
  };

  return {
    ...i18n,
    getAuthErrorText,
  };
};

/**
 * Hook for gaming-related translations
 */
export const useGamingI18n = () => {
  const i18n = useI18n("gaming");

  const getBattleStatusText = (status: string) => {
    return i18n.tc(`gaming:battles.status.${status}`) || status;
  };

  const getRewardText = (rewardType: string) => {
    return i18n.tc(`gaming:rewards.types.${rewardType}`) || rewardType;
  };

  return {
    ...i18n,
    getBattleStatusText,
    getRewardText,
  };
};

/**
 * Hook for settings-related translations
 */
export const useSettingsI18n = () => {
  const i18n = useI18n("settings");

  const getCategoryText = (category: string) => {
    return i18n.tc(`settings:categories.${category}`) || category;
  };

  return {
    ...i18n,
    getCategoryText,
  };
};

export default useI18n;
