import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Device } from '@capacitor/device';
import { TimeoutHandle } from '../types/timers';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  changeLanguage,
  getCurrentLanguage,
  getLanguageInfo,
  isRTL,
  formatTime,
  formatRelativeTime,
} from '../config/i18n';

// Language context interface
interface LanguageContextType {
  // Current language state
  currentLanguage: SupportedLanguage;
  languageInfo: (typeof SUPPORTED_LANGUAGES)[SupportedLanguage];
  isRTL: boolean;
  isLoading: boolean;
  error: string | null;

  // Available languages
  supportedLanguages: typeof SUPPORTED_LANGUAGES;

  // Language switching
  changeLanguage: (lang: SupportedLanguage) => Promise<void>;
  detectDeviceLanguage: () => Promise<SupportedLanguage>;

  // Translation helpers
  t: (key: string, options?: Record<string, unknown>) => string;
  tExists: (key: string) => boolean;

  // Formatting helpers
  formatTime: (time: string) => string;
  formatRelativeTime: (date: Date) => string;
  formatNumber: (num: number) => string;
  formatDate: (date: Date) => string;

  // Direction helpers
  getTextDirection: () => 'ltr' | 'rtl';
  getFlexDirection: () => 'row' | 'row-reverse';

  // Language preferences
  autoDetectEnabled: boolean;
  setAutoDetectEnabled: (enabled: boolean) => void;
}

// Create context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Hook to use language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Props interface for provider
interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLanguage?: SupportedLanguage;
  enableAutoDetect?: boolean;
}

// Language provider component
export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  defaultLanguage = 'en',
  enableAutoDetect = true,
}) => {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(() => {
    const stored = localStorage.getItem('language-auto-detect');
    return stored !== null ? JSON.parse(stored) : enableAutoDetect;
  });

  // Current language state
  const currentLanguage = useMemo(() => getCurrentLanguage(), [i18n.language]);

  const languageInfo = useMemo(
    () => getLanguageInfo(currentLanguage),
    [currentLanguage]
  );

  const currentIsRTL = useMemo(() => isRTL(currentLanguage), [currentLanguage]);

  // Detect device language
  const detectDeviceLanguage = useCallback(async (): Promise<SupportedLanguage> => {
    try {
      if (window.Capacitor) {
        const deviceLangInfo = await Device.getLanguageCode();
        const deviceLang = deviceLangInfo.value;

        // Check if device language is supported
        if (deviceLang && Object.keys(SUPPORTED_LANGUAGES).includes(deviceLang)) {
          return deviceLang as SupportedLanguage;
        }

        // Try to match by language prefix (e.g., 'en-US' -> 'en')
        const langPrefix = deviceLang?.split('-')[0];
        if (langPrefix && Object.keys(SUPPORTED_LANGUAGES).includes(langPrefix)) {
          return langPrefix as SupportedLanguage;
        }
      }

      // Fallback to browser language detection
      const browserLang = navigator.language || navigator.languages?.[0];
      if (browserLang) {
        if (Object.keys(SUPPORTED_LANGUAGES).includes(browserLang)) {
          return browserLang as SupportedLanguage;
        }

        const langPrefix = browserLang.split('-')[0];
        if (Object.keys(SUPPORTED_LANGUAGES).includes(langPrefix)) {
          return langPrefix as SupportedLanguage;
        }
      }

      return defaultLanguage;
    } catch (error) {
      console.error('Failed to detect device language:', error);
      return defaultLanguage;
    }
  }, [defaultLanguage]);

  // Change language function
  const handleChangeLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      if (lang === currentLanguage) {
        return; // No change needed
      }

      setIsLoading(true);
      setError(null);

      try {
        await changeLanguage(lang);

        // Store preference
        localStorage.setItem('user-language', lang);

        // Announce language change for accessibility
        const langInfo = SUPPORTED_LANGUAGES[lang];
        if (langInfo) {
          // Use a small delay to ensure screen readers pick up the announcement
          setTimeout(() => {
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.textContent = `Language changed to ${langInfo.nativeName}`;
            document.body.appendChild(announcement);

            // Remove after announcement
            setTimeout(() => {
              document.body.removeChild(announcement);
            }, 1000);
          }, 100);
        }

        console.log(
          `Language changed successfully to: ${lang} (${langInfo?.nativeName})`
        );
      } catch (error) {
        console.error('Failed to change language:', error);
        setError(`Failed to change language to ${lang}`);
      } finally {
        setIsLoading(false);
      }
    },
    [currentLanguage]
  );

  // Auto-detect device language on mount
  useEffect(() => {
    const initializeLanguage = async () => {
      if (!autoDetectEnabled) return;

      const storedLanguage = localStorage.getItem('user-language');
      if (storedLanguage && Object.keys(SUPPORTED_LANGUAGES).includes(storedLanguage)) {
        // User has a stored preference, don't auto-detect
        return;
      }

      try {
        const detectedLang = await detectDeviceLanguage();
        if (detectedLang !== currentLanguage) {
          console.log(`Auto-detected language: ${detectedLang}`);
          await handleChangeLanguage(detectedLang);
        }
      } catch (error) {
        console.warn('Failed to auto-detect language:', error);
      }
    };

    initializeLanguage();
  }, [autoDetectEnabled, currentLanguage, detectDeviceLanguage, handleChangeLanguage]);

  // Handle auto-detect setting changes
  useEffect(() => {
    localStorage.setItem('language-auto-detect', JSON.stringify(autoDetectEnabled));
  }, [autoDetectEnabled]);

  // Translation helpers
  const tExists = useCallback(
    (key: string): boolean => {
      return i18n.exists(key);
    },
    [i18n]
  );

  // Formatting helpers
  const formatTimeHelper = useCallback(
    (time: string): string => {
      return formatTime(time, currentLanguage);
    },
    [currentLanguage]
  );

  const formatRelativeTimeHelper = useCallback(
    (date: Date): string => {
      return formatRelativeTime(date, currentLanguage);
    },
    [currentLanguage]
  );

  const formatNumber = useCallback(
    (num: number): string => {
      try {
        return new Intl.NumberFormat(currentLanguage).format(num);
      } catch (error) {
        console.error('Failed to format number:', error);
        return num.toString();
      }
    },
    [currentLanguage]
  );

  const formatDate = useCallback(
    (date: Date): string => {
      try {
        return new Intl.DateTimeFormat(currentLanguage, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(date);
      } catch (error) {
        console.error('Failed to format date:', error);
        return date.toLocaleDateString();
      }
    },
    [currentLanguage]
  );

  // Direction helpers
  const getTextDirection = useCallback((): 'ltr' | 'rtl' => {
    return currentIsRTL ? 'rtl' : 'ltr';
  }, [currentIsRTL]);

  const getFlexDirection = useCallback((): 'row' | 'row-reverse' => {
    return currentIsRTL ? 'row-reverse' : 'row';
  }, [currentIsRTL]);

  // Context value
  const contextValue = useMemo<LanguageContextType>(
    () => ({
      // Current language state
      currentLanguage,
      languageInfo,
      isRTL: currentIsRTL,
      isLoading,
      error,

      // Available languages
      supportedLanguages: SUPPORTED_LANGUAGES,

      // Language switching
      changeLanguage: handleChangeLanguage,
      detectDeviceLanguage,

      // Translation helpers
      t,
      tExists,

      // Formatting helpers
      formatTime: formatTimeHelper,
      formatRelativeTime: formatRelativeTimeHelper,
      formatNumber,
      formatDate,

      // Direction helpers
      getTextDirection,
      getFlexDirection,

      // Language preferences
      autoDetectEnabled,
      setAutoDetectEnabled,
    }),
    [
      currentLanguage,
      languageInfo,
      currentIsRTL,
      isLoading,
      error,
      handleChangeLanguage,
      detectDeviceLanguage,
      t,
      tExists,
      formatTimeHelper,
      formatRelativeTimeHelper,
      formatNumber,
      formatDate,
      getTextDirection,
      getFlexDirection,
      autoDetectEnabled,
      setAutoDetectEnabled,
    ]
  );

  return (
    <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>
  );
};

// Additional hook for getting specific translation namespaces
export const useTranslationNamespace = (namespace: string) => {
  const { t } = useTranslation(namespace);
  const language = useLanguage();

  return {
    t,
    ...language,
  };
};

// Hook for language-aware routing/navigation
export const useLanguageAwareNavigation = () => {
  const { currentLanguage, isRTL } = useLanguage();

  const getNavigationDirection = useCallback(() => {
    return isRTL ? 'rtl' : 'ltr';
  }, [isRTL]);

  const getSlideDirection = useCallback(() => {
    return isRTL ? 'right' : 'left';
  }, [isRTL]);

  return {
    currentLanguage,
    isRTL,
    getNavigationDirection,
    getSlideDirection,
  };
};

// Export the context for advanced usage
export { LanguageContext };

export default LanguageProvider;
