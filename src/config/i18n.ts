import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { Device } from '@capacitor/device';

// Supported languages with their configurations
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English (American)',
    nativeName: 'English (US)',
    flag: '🇺🇸',
    dir: 'ltr',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    currency: 'USD',
    region: 'US'
  },
  'en-GB': {
    code: 'en-GB',
    name: 'English (British)',
    nativeName: 'English (UK)',
    flag: '🇬🇧',
    dir: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    currency: 'GBP',
    region: 'GB'
  },
  es: {
    code: 'es',
    name: 'Spanish (European)',
    nativeName: 'Español (España)',
    flag: '🇪🇸',
    dir: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    currency: 'EUR',
    region: 'ES'
  },
  'es-MX': {
    code: 'es-MX',
    name: 'Spanish (Mexican)',
    nativeName: 'Español (México)',
    flag: '🇲🇽',
    dir: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '12h',
    currency: 'MXN',
    region: 'MX'
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    dir: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    currency: 'EUR',
    region: 'FR'
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    dir: 'ltr',
    dateFormat: 'dd.MM.yyyy',
    timeFormat: '24h',
    currency: 'EUR',
    region: 'DE'
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    dir: 'ltr',
    dateFormat: 'yyyy/MM/dd',
    timeFormat: '24h',
    currency: 'JPY',
    region: 'JP'
  },
  zh: {
    code: 'zh',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    flag: '🇨🇳',
    dir: 'ltr',
    dateFormat: 'yyyy/MM/dd',
    timeFormat: '24h',
    currency: 'CNY',
    region: 'CN'
  },
  'zh-TW': {
    code: 'zh-TW',
    name: 'Chinese (Traditional)',
    nativeName: '繁體中文',
    flag: '🇹🇼',
    dir: 'ltr',
    dateFormat: 'yyyy/MM/dd',
    timeFormat: '24h',
    currency: 'TWD',
    region: 'TW'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    dir: 'rtl',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '12h',
    currency: 'SAR',
    region: 'SA'
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    dir: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '12h',
    currency: 'INR',
    region: 'IN'
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    dir: 'ltr',
    dateFormat: 'yyyy. MM. dd.',
    timeFormat: '12h',
    currency: 'KRW',
    region: 'KR'
  },
  pt: {
    code: 'pt',
    name: 'Portuguese (European)',
    nativeName: 'Português Europeu',
    flag: '🇵🇹',
    dir: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    currency: 'EUR',
    region: 'PT'
  },
  'pt-BR': {
    code: 'pt-BR',
    name: 'Portuguese (Brazilian)',
    nativeName: 'Português Brasileiro',
    flag: '🇧🇷',
    dir: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    currency: 'BRL',
    region: 'BR'
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    dir: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    currency: 'EUR',
    region: 'IT'
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    dir: 'ltr',
    dateFormat: 'dd.MM.yyyy',
    timeFormat: '24h',
    currency: 'RUB',
    region: 'RU'
  },
  id: {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
    dir: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    currency: 'IDR',
    region: 'ID'
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇧🇩',
    dir: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '12h',
    currency: 'BDT',
    region: 'BD'
  },
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    dir: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    currency: 'VND',
    region: 'VN'
  },
  th: {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    flag: '🇹🇭',
    dir: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    currency: 'THB',
    region: 'TH'
  }
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Default language fallback
const DEFAULT_LANGUAGE = 'en';

// Custom language detector that includes Capacitor Device language detection
const createCustomLanguageDetector = () => {
  return {
    type: 'languageDetector' as const,
    async: true,
    init: () => {},
    detect: async (callback: (lng: string) => void) => {
      try {
        // Try to get device language from Capacitor first
        if (window.Capacitor) {
          try {
            const deviceLangInfo = await Device.getLanguageCode();
            const deviceLang = deviceLangInfo.value;
            
            // Check if device language is supported
            if (deviceLang && Object.keys(SUPPORTED_LANGUAGES).includes(deviceLang)) {
              console.log('🌍 Using device language:', deviceLang);
              callback(deviceLang);
              return;
            }
            
            // Try to match by language prefix (e.g., 'en-US' -> 'en')
            const langPrefix = deviceLang?.split('-')[0];
            if (langPrefix && Object.keys(SUPPORTED_LANGUAGES).includes(langPrefix)) {
              console.log('🌍 Using device language prefix:', langPrefix);
              callback(langPrefix);
              return;
            }
          } catch (capacitorError) {
            console.warn('Failed to get device language from Capacitor:', capacitorError);
          }
        }
        
        // Fallback to browser language detection
        const browserLang = navigator.language || navigator.languages?.[0];
        if (browserLang) {
          // Check exact match
          if (Object.keys(SUPPORTED_LANGUAGES).includes(browserLang)) {
            console.log('🌍 Using browser language:', browserLang);
            callback(browserLang);
            return;
          }
          
          // Try language prefix
          const langPrefix = browserLang.split('-')[0];
          if (Object.keys(SUPPORTED_LANGUAGES).includes(langPrefix)) {
            console.log('🌍 Using browser language prefix:', langPrefix);
            callback(langPrefix);
            return;
          }
        }
        
        // Final fallback to default language
        console.log('🌍 Using default language:', DEFAULT_LANGUAGE);
        callback(DEFAULT_LANGUAGE);
        
      } catch (error) {
        console.error('Language detection failed:', error);
        callback(DEFAULT_LANGUAGE);
      }
    },
    cacheUserLanguage: (lng: string) => {
      try {
        localStorage.setItem('user-language', lng);
      } catch (error) {
        console.warn('Failed to cache user language:', error);
      }
    }
  };
};

// i18n configuration
const i18nConfig = {
  // Use backend to load translation files
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    addPath: '/locales/{{lng}}/{{ns}}.missing.json',
    allowMultiLoading: false,
    crossDomain: false,
    withCredentials: false,
    overrideMimeType: false,
    requestOptions: {
      mode: 'cors',
      credentials: 'same-origin',
      cache: 'default'
    }
  },
  
  // Language detection configuration
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
    lookupLocalStorage: 'user-language',
    caches: ['localStorage'],
    excludeCacheFor: ['cimode'],
    checkWhitelist: true
  },
  
  fallbackLng: DEFAULT_LANGUAGE,
  debug: import.meta.env.MODE === 'development',
  
  // Namespaces
  defaultNS: 'common',
  ns: ['common', 'alarms', 'auth', 'gaming', 'settings', 'errors'],
  
  // Interpolation options
  interpolation: {
    escapeValue: false // React already escapes values
  },
  
  // React specific options
  react: {
    bindI18n: 'languageChanged',
    bindI18nStore: '',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span'],
    useSuspense: false // Disable suspense to avoid loading issues
  },
  
  // Performance optimizations
  load: 'languageOnly', // Don't load country-specific variants
  preload: [DEFAULT_LANGUAGE], // Preload default language
  
  // Key management
  keySeparator: '.',
  nsSeparator: ':',
  
  // Missing key handling
  saveMissing: import.meta.env.MODE === 'development',
  missingKeyHandler: (lng: string[], ns: string, key: string, fallbackValue: string) => {
    if (import.meta.env.MODE === 'development') {
      console.warn(`Missing translation key: ${ns}:${key} for language: ${lng.join(', ')}`);
    }
  },
  
  // Additional configuration for better performance
  returnEmptyString: false,
  returnNull: false,
  returnObjects: false,
  joinArrays: ' ',
  
  // Pluralization
  compatibilityJSON: 'v4',
  
  // Resources (will be overridden by backend)
  resources: {}
};

// Initialize i18next
const initI18n = async () => {
  try {
    // Custom language detector
    const customDetector = createCustomLanguageDetector();
    
    await i18n
      .use(Backend)
      .use(LanguageDetector)
      .use(initReactI18next)
      .use(customDetector)
      .init(i18nConfig);
    
    console.log('🌍 i18n initialized successfully with language:', i18n.language);
    
    // Set HTML direction based on language
    const currentLangConfig = SUPPORTED_LANGUAGES[i18n.language as SupportedLanguage];
    if (currentLangConfig) {
      document.dir = currentLangConfig.dir;
      document.documentElement.lang = i18n.language;
    }
    
    // Listen for language changes to update document direction
    i18n.on('languageChanged', (lng: string) => {
      const langConfig = SUPPORTED_LANGUAGES[lng as SupportedLanguage];
      if (langConfig) {
        document.dir = langConfig.dir;
        document.documentElement.lang = lng;
        console.log('🌍 Language changed to:', lng, 'Direction:', langConfig.dir);
      }
    });
    
    return i18n;
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    throw error;
  }
};

// Helper functions
export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18n.language as SupportedLanguage) || DEFAULT_LANGUAGE;
};

export const getLanguageInfo = (lang?: SupportedLanguage) => {
  const currentLang = lang || getCurrentLanguage();
  return SUPPORTED_LANGUAGES[currentLang];
};

export const isRTL = (lang?: SupportedLanguage): boolean => {
  const langInfo = getLanguageInfo(lang);
  return langInfo?.dir === 'rtl';
};

export const changeLanguage = async (lang: SupportedLanguage): Promise<void> => {
  try {
    await i18n.changeLanguage(lang);
    
    // Update document direction and language
    const langConfig = SUPPORTED_LANGUAGES[lang];
    if (langConfig) {
      document.dir = langConfig.dir;
      document.documentElement.lang = lang;
    }
    
    // Save to localStorage
    localStorage.setItem('user-language', lang);
    
    console.log('🌍 Language changed successfully to:', lang);
  } catch (error) {
    console.error('Failed to change language:', error);
    throw error;
  }
};

export const formatMessage = (key: string, options?: Record<string, unknown>): string => {
  return i18n.t(key, options);
};

export const formatRelativeTime = (date: Date, lang?: SupportedLanguage): string => {
  const currentLang = lang || getCurrentLanguage();
  try {
    const now = Date.now();
    const targetTime = date.getTime();
    const diffInSeconds = Math.round((targetTime - now) / 1000);
    const absDiff = Math.abs(diffInSeconds);
    
    const rtf = new Intl.RelativeTimeFormat(currentLang, { numeric: 'auto' });
    
    // Choose appropriate unit based on time difference
    if (absDiff < 60) {
      return rtf.format(diffInSeconds, 'second');
    } else if (absDiff < 3600) {
      return rtf.format(Math.round(diffInSeconds / 60), 'minute');
    } else if (absDiff < 86400) {
      return rtf.format(Math.round(diffInSeconds / 3600), 'hour');
    } else if (absDiff < 2592000) {
      return rtf.format(Math.round(diffInSeconds / 86400), 'day');
    } else if (absDiff < 31536000) {
      return rtf.format(Math.round(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(Math.round(diffInSeconds / 31536000), 'year');
    }
  } catch (error) {
    console.error('Failed to format relative time:', error);
    return date.toLocaleDateString(currentLang);
  }
};

export const formatTime = (time: string, lang?: SupportedLanguage): string => {
  const currentLang = lang || getCurrentLanguage();
  const langInfo = getLanguageInfo(currentLang);
  
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    return new Intl.DateTimeFormat(currentLang, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: langInfo?.timeFormat === '12h'
    }).format(date);
  } catch (error) {
    console.error('Failed to format time:', error);
    return time;
  }
};

export const formatDate = (date: Date, lang?: SupportedLanguage): string => {
  const currentLang = lang || getCurrentLanguage();
  try {
    return new Intl.DateTimeFormat(currentLang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Failed to format date:', error);
    return date.toLocaleDateString();
  }
};

export const formatShortDate = (date: Date, lang?: SupportedLanguage): string => {
  const currentLang = lang || getCurrentLanguage();
  try {
    return new Intl.DateTimeFormat(currentLang, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Failed to format short date:', error);
    return date.toLocaleDateString();
  }
};

export const formatCurrency = (amount: number, lang?: SupportedLanguage): string => {
  const currentLang = lang || getCurrentLanguage();
  const langInfo = getLanguageInfo(currentLang);
  
  try {
    return new Intl.NumberFormat(currentLang, {
      style: 'currency',
      currency: langInfo?.currency || 'USD'
    }).format(amount);
  } catch (error) {
    console.error('Failed to format currency:', error);
    return `${amount} ${langInfo?.currency || 'USD'}`;
  }
};

export const formatNumber = (num: number, lang?: SupportedLanguage): string => {
  const currentLang = lang || getCurrentLanguage();
  try {
    return new Intl.NumberFormat(currentLang).format(num);
  } catch (error) {
    console.error('Failed to format number:', error);
    return num.toString();
  }
};

export const formatPercentage = (value: number, lang?: SupportedLanguage): string => {
  const currentLang = lang || getCurrentLanguage();
  try {
    return new Intl.NumberFormat(currentLang, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value / 100);
  } catch (error) {
    console.error('Failed to format percentage:', error);
    return `${value}%`;
  }
};

export const formatList = (items: string[], lang?: SupportedLanguage): string => {
  const currentLang = lang || getCurrentLanguage();
  try {
    if (typeof Intl.ListFormat !== 'undefined') {
      return new Intl.ListFormat(currentLang, {
        style: 'long',
        type: 'conjunction'
      }).format(items);
    } else {
      // Fallback for older browsers
      if (items.length === 0) return '';
      if (items.length === 1) return items[0];
      if (items.length === 2) return `${items[0]} and ${items[1]}`;
      return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
    }
  } catch (error) {
    console.error('Failed to format list:', error);
    return items.join(', ');
  }
};

export const formatDuration = (seconds: number, lang?: SupportedLanguage): string => {
  const currentLang = lang || getCurrentLanguage();
  try {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return formatMessage('common:time.hoursMinutesSeconds', { hours, minutes, seconds: remainingSeconds });
    } else if (minutes > 0) {
      return formatMessage('common:time.minutesSeconds', { minutes, seconds: remainingSeconds });
    } else {
      return formatMessage('common:time.seconds', { seconds: remainingSeconds });
    }
  } catch (error) {
    console.error('Failed to format duration:', error);
    return `${seconds}s`;
  }
};

// Translation key validation in development
export const validateTranslationKey = (key: string, namespace?: string): boolean => {
  if (process.env.NODE_ENV !== 'development') return true;
  
  try {
    const fullKey = namespace ? `${namespace}:${key}` : key;
    return i18n.exists(fullKey);
  } catch {
    return false;
  }
};

// Get all missing translation keys (development only)
export const getMissingTranslationKeys = (): string[] => {
  if (process.env.NODE_ENV !== 'development') return [];
  
  const missingKeys: string[] = [];
  // This would be implemented based on your specific needs
  // For now, it's a placeholder
  return missingKeys;
};

// Pluralization helper
export const getPluralizationRules = (lang?: SupportedLanguage): Intl.PluralRules => {
  const currentLang = lang || getCurrentLanguage();
  try {
    return new Intl.PluralRules(currentLang);
  } catch (error) {
    console.error('Failed to get pluralization rules:', error);
    return new Intl.PluralRules('en'); // Fallback to English
  }
};

// Smart pluralization for different languages
export const smartPlural = (count: number, options: Record<string, string>, lang?: SupportedLanguage): string => {
  const currentLang = lang || getCurrentLanguage();
  try {
    const pluralRule = getPluralizationRules(currentLang).select(count);
    return options[pluralRule] || options.other || options.one || '';
  } catch (error) {
    console.error('Failed to get plural form:', error);
    return options.other || options.one || '';
  }
};

export { i18n };
export default initI18n;