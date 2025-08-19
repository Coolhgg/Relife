/**
 * Internationalization Testing Utilities for Relife Alarm App
 * Provides comprehensive testing utilities for i18n, localization, and multi-language support
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

interface LocaleConfig {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: '12h' | '24h';
  numberFormat: {
    decimal: string;
    thousands: string;
  };
}

interface TranslationData {
  [key: string]: string | TranslationData;
}

interface I18nContextValue {
  locale: string;
  t: (key: string, options?: any) => string;
  changeLanguage: (locale: string) => void;
  dir: 'ltr' | 'rtl';
  ready: boolean;
}

// Mock Translation Data
const mockTranslations: Record<string, TranslationData> = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      loading: 'Loading...',
      error: 'Error occurred',
      retry: 'Retry'
    },
    alarm: {
      title: 'Alarm',
      setAlarm: 'Set Alarm',
      editAlarm: 'Edit Alarm',
      deleteAlarm: 'Delete Alarm',
      alarmTime: 'Alarm Time',
      alarmLabel: 'Alarm Label',
      repeat: 'Repeat',
      sound: 'Sound',
      volume: 'Volume',
      snooze: 'Snooze',
      stop: 'Stop',
      weekdays: {
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday'
      },
      notifications: {
        alarmSet: 'Alarm set for {{time}}',
        alarmDeleted: 'Alarm deleted',
        alarmRinging: 'Alarm is ringing!'
      }
    },
    settings: {
      title: 'Settings',
      language: 'Language',
      theme: 'Theme',
      timeFormat: 'Time Format',
      notifications: 'Notifications',
      sounds: 'Sounds',
      about: 'About'
    }
  },
  es: {
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      confirm: 'Confirmar',
      back: 'Atrás',
      next: 'Siguiente',
      done: 'Hecho',
      loading: 'Cargando...',
      error: 'Ocurrió un error',
      retry: 'Reintentar'
    },
    alarm: {
      title: 'Alarma',
      setAlarm: 'Establecer Alarma',
      editAlarm: 'Editar Alarma',
      deleteAlarm: 'Eliminar Alarma',
      alarmTime: 'Hora de Alarma',
      alarmLabel: 'Etiqueta de Alarma',
      repeat: 'Repetir',
      sound: 'Sonido',
      volume: 'Volumen',
      snooze: 'Posponer',
      stop: 'Detener',
      weekdays: {
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
        sunday: 'Domingo'
      },
      notifications: {
        alarmSet: 'Alarma configurada para {{time}}',
        alarmDeleted: 'Alarma eliminada',
        alarmRinging: '¡La alarma está sonando!'
      }
    },
    settings: {
      title: 'Configuración',
      language: 'Idioma',
      theme: 'Tema',
      timeFormat: 'Formato de Hora',
      notifications: 'Notificaciones',
      sounds: 'Sonidos',
      about: 'Acerca de'
    }
  },
  fr: {
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      confirm: 'Confirmer',
      back: 'Retour',
      next: 'Suivant',
      done: 'Terminé',
      loading: 'Chargement...',
      error: 'Une erreur est survenue',
      retry: 'Réessayer'
    },
    alarm: {
      title: 'Alarme',
      setAlarm: 'Définir une Alarme',
      editAlarm: 'Modifier l\'Alarme',
      deleteAlarm: 'Supprimer l\'Alarme',
      alarmTime: 'Heure de l\'Alarme',
      alarmLabel: 'Libellé de l\'Alarme',
      repeat: 'Répéter',
      sound: 'Son',
      volume: 'Volume',
      snooze: 'Report',
      stop: 'Arrêter',
      weekdays: {
        monday: 'Lundi',
        tuesday: 'Mardi',
        wednesday: 'Mercredi',
        thursday: 'Jeudi',
        friday: 'Vendredi',
        saturday: 'Samedi',
        sunday: 'Dimanche'
      },
      notifications: {
        alarmSet: 'Alarme définie pour {{time}}',
        alarmDeleted: 'Alarme supprimée',
        alarmRinging: 'L\'alarme sonne!'
      }
    },
    settings: {
      title: 'Paramètres',
      language: 'Langue',
      theme: 'Thème',
      timeFormat: 'Format de l\'Heure',
      notifications: 'Notifications',
      sounds: 'Sons',
      about: 'À propos'
    }
  },
  ar: {
    common: {
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تحرير',
      confirm: 'تأكيد',
      back: 'السابق',
      next: 'التالي',
      done: 'تم',
      loading: 'جاري التحميل...',
      error: 'حدث خطأ',
      retry: 'إعادة المحاولة'
    },
    alarm: {
      title: 'المنبه',
      setAlarm: 'ضبط المنبه',
      editAlarm: 'تحرير المنبه',
      deleteAlarm: 'حذف المنبه',
      alarmTime: 'وقت المنبه',
      alarmLabel: 'تسمية المنبه',
      repeat: 'تكرار',
      sound: 'الصوت',
      volume: 'مستوى الصوت',
      snooze: 'غفوة',
      stop: 'إيقاف',
      weekdays: {
        monday: 'الاثنين',
        tuesday: 'الثلاثاء',
        wednesday: 'الأربعاء',
        thursday: 'الخميس',
        friday: 'الجمعة',
        saturday: 'السبت',
        sunday: 'الأحد'
      },
      notifications: {
        alarmSet: 'تم ضبط المنبه على {{time}}',
        alarmDeleted: 'تم حذف المنبه',
        alarmRinging: 'المنبه يرن!'
      }
    },
    settings: {
      title: 'الإعدادات',
      language: 'اللغة',
      theme: 'السمة',
      timeFormat: 'صيغة الوقت',
      notifications: 'الإشعارات',
      sounds: 'الأصوات',
      about: 'حول'
    }
  }
};

// Locale Configuration
const localeConfigs: Record<string, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: {
      decimal: '.',
      thousands: ','
    }
  },
  es: {
    code: 'es',
    name: 'Español',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimal: ',',
      thousands: '.'
    }
  },
  fr: {
    code: 'fr',
    name: 'Français',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimal: ',',
      thousands: ' '
    }
  },
  ar: {
    code: 'ar',
    name: 'العربية',
    direction: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    numberFormat: {
      decimal: '.',
      thousands: ','
    }
  }
};

// I18n Mocking Utilities
export const i18nMocks = {
  /**
   * Create mock i18n context
   */
  createMockI18nContext(locale: string = 'en'): I18nContextValue {
    const t = (key: string, options: any = {}) => {
      const keys = key.split('.');
      let value: any = mockTranslations[locale];
      
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          return key; // Return key if translation not found
        }
      }
      
      if (typeof value === 'string') {
        // Handle interpolation
        return value.replace(/\{\{(\w+)\}\}/g, (match, prop) => {
          return options[prop] || match;
        });
      }
      
      return key;
    };

    return {
      locale,
      t,
      changeLanguage: jest.fn(),
      dir: localeConfigs[locale]?.direction || 'ltr',
      ready: true
    };
  },

  /**
   * Mock react-i18next
   */
  mockReactI18next(defaultLocale: string = 'en'): void {
    const mockI18n = {
      language: defaultLocale,
      languages: Object.keys(mockTranslations),
      changeLanguage: jest.fn((lng: string) => {
        mockI18n.language = lng;
        return Promise.resolve();
      }),
      t: (key: string, options: any = {}) => {
        const keys = key.split('.');
        let value: any = mockTranslations[mockI18n.language] || mockTranslations[defaultLocale];
        
        for (const k of keys) {
          if (value && typeof value === 'object') {
            value = value[k];
          } else {
            return key;
          }
        }
        
        if (typeof value === 'string') {
          return value.replace(/\{\{(\w+)\}\}/g, (match, prop) => {
            return options[prop] || match;
          });
        }
        
        return key;
      },
      dir: () => localeConfigs[mockI18n.language]?.direction || 'ltr',
      exists: (key: string) => {
        const keys = key.split('.');
        let value: any = mockTranslations[mockI18n.language];
        
        for (const k of keys) {
          if (value && typeof value === 'object') {
            value = value[k];
          } else {
            return false;
          }
        }
        
        return typeof value === 'string';
      }
    };

    jest.mock('react-i18next', () => ({
      useTranslation: () => ({
        t: mockI18n.t,
        i18n: mockI18n
      }),
      Trans: ({ children, i18nKey }: { children: React.ReactNode; i18nKey: string }) => {
        return React.createElement('span', { 'data-testid': `trans-${i18nKey}` }, children);
      },
      I18nextProvider: ({ children }: { children: React.ReactNode }) => children
    }));
  },

  /**
   * Mock browser language detection
   */
  mockBrowserLanguage(languages: string[]): void {
    Object.defineProperty(navigator, 'languages', {
      value: languages,
      writable: true
    });
    
    Object.defineProperty(navigator, 'language', {
      value: languages[0],
      writable: true
    });
  },

  /**
   * Mock Intl APIs
   */
  mockIntlAPIs(locale: string = 'en'): void {
    // Mock Intl.DateTimeFormat
    global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
      format: jest.fn((date: Date) => {
        const config = localeConfigs[locale];
        if (config.dateFormat === 'MM/DD/YYYY') {
          return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
        } else {
          return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        }
      }),
      resolvedOptions: () => ({ locale })
    }));

    // Mock Intl.NumberFormat
    global.Intl.NumberFormat = jest.fn().mockImplementation(() => ({
      format: jest.fn((number: number) => {
        const config = localeConfigs[locale];
        const parts = number.toString().split('.');
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.numberFormat.thousands);
        const decimalPart = parts[1] ? config.numberFormat.decimal + parts[1] : '';
        return integerPart + decimalPart;
      }),
      resolvedOptions: () => ({ locale })
    }));

    // Mock Intl.RelativeTimeFormat
    global.Intl.RelativeTimeFormat = jest.fn().mockImplementation(() => ({
      format: jest.fn((value: number, unit: string) => {
        if (locale === 'es') {
          return `en ${Math.abs(value)} ${unit}${Math.abs(value) !== 1 ? 's' : ''}`;
        } else if (locale === 'fr') {
          return `dans ${Math.abs(value)} ${unit}${Math.abs(value) !== 1 ? 's' : ''}`;
        } else if (locale === 'ar') {
          return `في ${Math.abs(value)} ${unit}`;
        }
        return `in ${Math.abs(value)} ${unit}${Math.abs(value) !== 1 ? 's' : ''}`;
      }),
      resolvedOptions: () => ({ locale })
    }));
  }
};

// I18n Testing Utilities
export const i18nUtils = {
  /**
   * Test translation key existence
   */
  testTranslationExists(key: string, locale: string = 'en'): void {
    const keys = key.split('.');
    let value: any = mockTranslations[locale];
    
    for (const k of keys) {
      expect(value).toBeDefined();
      expect(typeof value).toBe('object');
      value = value[k];
    }
    
    expect(typeof value).toBe('string');
    expect(value).toBeTruthy();
  },

  /**
   * Test translation in all supported locales
   */
  testTranslationInAllLocales(key: string): void {
    Object.keys(mockTranslations).forEach(locale => {
      this.testTranslationExists(key, locale);
    });
  },

  /**
   * Test interpolation in translations
   */
  testTranslationInterpolation(key: string, variables: Record<string, string>, locale: string = 'en'): void {
    const mockContext = i18nMocks.createMockI18nContext(locale);
    const translated = mockContext.t(key, variables);
    
    // Check that variables are interpolated
    Object.entries(variables).forEach(([varKey, varValue]) => {
      expect(translated).toContain(varValue);
      expect(translated).not.toContain(`{{${varKey}}}`);
    });
  },

  /**
   * Test pluralization
   */
  testPluralization(baseKey: string, count: number, locale: string = 'en'): void {
    const mockContext = i18nMocks.createMockI18nContext(locale);
    const translated = mockContext.t(baseKey, { count });
    
    expect(translated).toBeDefined();
    expect(typeof translated).toBe('string');
  },

  /**
   * Test RTL support
   */
  testRTLSupport(locale: string): void {
    const config = localeConfigs[locale];
    expect(config).toBeDefined();
    expect(['ltr', 'rtl']).toContain(config.direction);
    
    // Test document direction
    document.dir = config.direction;
    expect(document.dir).toBe(config.direction);
  },

  /**
   * Test time format localization
   */
  testTimeFormatLocalization(time: Date, locale: string): void {
    const config = localeConfigs[locale];
    expect(config).toBeDefined();
    expect(['12h', '24h']).toContain(config.timeFormat);
    
    // Test time formatting
    const formatter = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: config.timeFormat === '12h'
    });
    
    const formattedTime = formatter.format(time);
    expect(formattedTime).toBeDefined();
    
    if (config.timeFormat === '12h') {
      expect(formattedTime).toMatch(/AM|PM|am|pm/);
    }
  },

  /**
   * Test number format localization
   */
  testNumberFormatLocalization(number: number, locale: string): void {
    const config = localeConfigs[locale];
    expect(config).toBeDefined();
    
    const formatter = new Intl.NumberFormat(locale);
    const formattedNumber = formatter.format(number);
    
    expect(formattedNumber).toBeDefined();
    expect(typeof formattedNumber).toBe('string');
  }
};

// Render Helpers with I18n Context
export const i18nRenderHelpers = {
  /**
   * Render component with I18n context
   */
  renderWithI18n: (
    ui: React.ReactElement,
    locale: string = 'en',
    renderOptions: RenderOptions = {}
  ) => {
    const mockI18nContext = i18nMocks.createMockI18nContext(locale);
    
    // Mock the useTranslation hook
    jest.mock('react-i18next', () => ({
      useTranslation: () => ({
        t: mockI18nContext.t,
        i18n: {
          language: locale,
          changeLanguage: mockI18nContext.changeLanguage,
          dir: () => mockI18nContext.dir
        }
      })
    }));

    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      // Set document direction
      React.useEffect(() => {
        document.dir = mockI18nContext.dir;
      }, []);

      return React.createElement(React.Fragment, {}, children);
    };

    return render(ui, {
      wrapper: Wrapper,
      ...renderOptions
    });
  },

  /**
   * Test component in multiple locales
   */
  testInMultipleLocales: (
    ui: React.ReactElement,
    testFn: (locale: string) => void,
    locales: string[] = ['en', 'es', 'fr', 'ar']
  ) => {
    locales.forEach(locale => {
      describe(`in ${locale} locale`, () => {
        beforeEach(() => {
          i18nMocks.mockReactI18next(locale);
          i18nMocks.mockIntlAPIs(locale);
        });

        testFn(locale);
      });
    });
  }
};

// Alarm-specific I18n Utilities
export const alarmI18nUtils = {
  /**
   * Test alarm time formatting
   */
  testAlarmTimeFormatting(time: Date, locale: string): void {
    const config = localeConfigs[locale];
    const formatter = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: config.timeFormat === '12h'
    });
    
    const formattedTime = formatter.format(time);
    expect(formattedTime).toBeDefined();
    
    // Test that alarm time is formatted correctly for the locale
    if (config.timeFormat === '12h') {
      expect(formattedTime).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM|am|pm)$/);
    } else {
      expect(formattedTime).toMatch(/^\d{1,2}:\d{2}$/);
    }
  },

  /**
   * Test weekday names localization
   */
  testWeekdayLocalization(locale: string): void {
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const mockContext = i18nMocks.createMockI18nContext(locale);
    
    weekdays.forEach(weekday => {
      const translatedWeekday = mockContext.t(`alarm.weekdays.${weekday}`);
      expect(translatedWeekday).toBeDefined();
      expect(translatedWeekday).not.toBe(`alarm.weekdays.${weekday}`);
      expect(translatedWeekday.length).toBeGreaterThan(0);
    });
  },

  /**
   * Test alarm notification messages
   */
  testAlarmNotificationMessages(locale: string): void {
    const mockContext = i18nMocks.createMockI18nContext(locale);
    
    // Test alarm set notification
    const alarmSetMessage = mockContext.t('alarm.notifications.alarmSet', { time: '7:00 AM' });
    expect(alarmSetMessage).toContain('7:00 AM');
    expect(alarmSetMessage).not.toContain('{{time}}');
    
    // Test alarm deleted notification
    const alarmDeletedMessage = mockContext.t('alarm.notifications.alarmDeleted');
    expect(alarmDeletedMessage).toBeDefined();
    expect(alarmDeletedMessage.length).toBeGreaterThan(0);
    
    // Test alarm ringing notification
    const alarmRingingMessage = mockContext.t('alarm.notifications.alarmRinging');
    expect(alarmRingingMessage).toBeDefined();
    expect(alarmRingingMessage.length).toBeGreaterThan(0);
  }
};

// Complete I18n Test Suite
export const createI18nTestSuite = () => ({
  /**
   * Test basic translation functionality
   */
  testBasicTranslation(component: React.ReactElement): void {
    i18nRenderHelpers.testInMultipleLocales(
      component,
      (locale) => {
        const { getByText } = i18nRenderHelpers.renderWithI18n(component, locale);
        const mockContext = i18nMocks.createMockI18nContext(locale);
        
        // Test common translations
        expect(mockContext.t('common.save')).toBeDefined();
        expect(mockContext.t('common.cancel')).toBeDefined();
        expect(mockContext.t('common.delete')).toBeDefined();
      }
    );
  },

  /**
   * Test RTL layout support
   */
  testRTLSupport(component: React.ReactElement): void {
    const { container } = i18nRenderHelpers.renderWithI18n(component, 'ar');
    
    expect(document.dir).toBe('rtl');
    
    // Check for RTL-specific styling
    const elements = container.querySelectorAll('[dir], [style*="direction"]');
    elements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.direction) {
        expect(['ltr', 'rtl']).toContain(computedStyle.direction);
      }
    });
  },

  /**
   * Test locale-specific time formatting
   */
  testTimeFormatting(): void {
    const testTime = new Date('2023-01-01T14:30:00');
    
    Object.keys(localeConfigs).forEach(locale => {
      alarmI18nUtils.testAlarmTimeFormatting(testTime, locale);
    });
  },

  /**
   * Test missing translation fallback
   */
  testMissingTranslationFallback(): void {
    const mockContext = i18nMocks.createMockI18nContext('en');
    const nonExistentKey = 'non.existent.key';
    const result = mockContext.t(nonExistentKey);
    
    expect(result).toBe(nonExistentKey);
  }
});

// Cleanup Utilities
export const i18nCleanup = {
  /**
   * Reset all I18n mocks
   */
  resetI18nMocks(): void {
    jest.clearAllMocks();
    document.dir = 'ltr';
  },

  /**
   * Restore browser language settings
   */
  restoreBrowserLanguage(): void {
    delete (navigator as any).language;
    delete (navigator as any).languages;
  },

  /**
   * Reset Intl mocks
   */
  resetIntlMocks(): void {
    // Restore original Intl implementations if they were mocked
    if (global.Intl.DateTimeFormat.mockRestore) {
      (global.Intl.DateTimeFormat as jest.Mock).mockRestore();
    }
    if (global.Intl.NumberFormat.mockRestore) {
      (global.Intl.NumberFormat as jest.Mock).mockRestore();
    }
    if (global.Intl.RelativeTimeFormat.mockRestore) {
      (global.Intl.RelativeTimeFormat as jest.Mock).mockRestore();
    }
  }
};

export default {
  i18nMocks,
  i18nUtils,
  i18nRenderHelpers,
  alarmI18nUtils,
  createI18nTestSuite,
  i18nCleanup,
  mockTranslations,
  localeConfigs
};