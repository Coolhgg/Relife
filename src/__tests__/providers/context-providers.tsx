/**
 * Context-Specific Test Providers
 *
 * Individual test providers for each application context with realistic mock implementations
 * and helper functions for testing context-dependent components.
 */

import React, { ReactNode, createContext, useContext } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// ===============================
// FEATURE ACCESS CONTEXT
// ===============================

export interface MockFeatureAccessContextValue {
  hasAccess: jest.MockedFunction<(feature: string
) => boolean>;
  checkFeatureAccess: jest.MockedFunction<(feature: string, tier?: string
) => boolean>;
  isFeatureEnabled: jest.MockedFunction<(feature: string
) => boolean>;
  upgradeRequired: jest.MockedFunction<(feature: string
) => boolean>;
  getFeatureLimit: jest.MockedFunction<(feature: string
) => number>;
  getRemainingUsage: jest.MockedFunction<(feature: string
) => number>;
  trackFeatureUsage: jest.MockedFunction<(feature: string
) => void>;
  premiumFeatures: string[];
  ultimateFeatures: string[];
  currentTier: 'free' | 'premium' | 'ultimate';
}

const defaultFeatureAccessValue: MockFeatureAccessContextValue = {
  hasAccess: jest.fn((
) => true),
  checkFeatureAccess: jest.fn((
) => true),
  isFeatureEnabled: jest.fn((
) => true),
  upgradeRequired: jest.fn((
) => false),
  getFeatureLimit: jest.fn((
) => 100),
  getRemainingUsage: jest.fn((
) => 50),
  trackFeatureUsage: jest.fn(),
  premiumFeatures: ['unlimited_alarms', 'custom_voices', 'themes', 'battle_mode'],
  ultimateFeatures: ['ai_optimization', 'advanced_analytics', 'priority_support'],
  currentTier: 'premium',
};

const FeatureAccessTestContext = createContext<MockFeatureAccessContextValue>(
  defaultFeatureAccessValue
);

export const FeatureAccessTestProvider: React.FC<{
  children: ReactNode;
  value?: Partial<MockFeatureAccessContextValue>;
}> = ({ children, value = {} }
) => {
  const mockValue = { ...defaultFeatureAccessValue, ...value };
  return (
    <FeatureAccessTestContext.Provider value={mockValue}>
      {children}
    </FeatureAccessTestContext.Provider>
  );
};

export const _useFeatureAccessTest = (
) => useContext(FeatureAccessTestContext);

// Feature Access Test Scenarios
export const _featureAccessScenarios = {
  freeUser: {
    hasAccess: jest.fn((feature: string
) =>
      ['basic_alarms', 'basic_themes'].includes(feature)
    ),
    upgradeRequired: jest.fn(
      (feature: string
) => !['basic_alarms', 'basic_themes'].includes(feature)
    ),
    currentTier: 'free' as const,
    getFeatureLimit: jest.fn((feature: string
) => (feature === 'alarms' ? 5 : 0)),
  },

  premiumUser: {
    hasAccess: jest.fn(
      (feature: string
) => !['ai_optimization', 'advanced_analytics'].includes(feature)
    ),
    upgradeRequired: jest.fn((feature: string
) =>
      ['ai_optimization', 'advanced_analytics'].includes(feature)
    ),
    currentTier: 'premium' as const,
    getFeatureLimit: jest.fn((
) => 100),
  },

  ultimateUser: {
    hasAccess: jest.fn((
) => true),
    upgradeRequired: jest.fn((
) => false),
    currentTier: 'ultimate' as const,
    getFeatureLimit: jest.fn((
) => Infinity),
  },
};

// ===============================
// LANGUAGE CONTEXT
// ===============================

export interface MockLanguageContextValue {
  language: string;
  setLanguage: jest.MockedFunction<(lang: string
) => void>;
  t: jest.MockedFunction<(key: string, options?: any
) => string>;
  dir: 'ltr' | 'rtl';
  formatTime: jest.MockedFunction<(time: Date
) => string>;
  formatDate: jest.MockedFunction<(date: Date
) => string>;
  formatRelativeTime: jest.MockedFunction<(date: Date
) => string>;
  formatCurrency: jest.MockedFunction<(amount: number, currency?: string
) => string>;
  supportedLanguages: Array<{ code: string; name: string; rtl: boolean }>;
  isLoading: boolean;
  error: string | null;
}

const defaultLanguageValue: MockLanguageContextValue = {
  language: 'en',
  setLanguage: jest.fn(),
  t: jest.fn((key: string
) => key.split('.').pop() || key),
  dir: 'ltr',
  formatTime: jest.fn((time: Date
) => time.toLocaleTimeString('en-US')),
  formatDate: jest.fn((date: Date
) => date.toLocaleDateString('en-US')),
  formatRelativeTime: jest.fn((date: Date
) => 'just now'),
  formatCurrency: jest.fn((amount: number, currency = 'USD'
) => `$${amount}`),
  supportedLanguages: [
    { code: 'en', name: 'English', rtl: false },
    { code: 'es', name: 'Español', rtl: false },
    { code: 'ar', name: 'العربية', rtl: true },
  ],
  isLoading: false,
  error: null,
};

const LanguageTestContext =
  createContext<MockLanguageContextValue>(defaultLanguageValue);

export const LanguageTestProvider: React.FC<{
  children: ReactNode;
  value?: Partial<MockLanguageContextValue>;
}> = ({ children, value = {} }
) => {
  const mockValue = { ...defaultLanguageValue, ...value };
  return (
    <LanguageTestContext.Provider value={mockValue}>
      {children}
    </LanguageTestContext.Provider>
  );
};

export const _useLanguageTest = (
) => useContext(LanguageTestContext);

// Language Test Scenarios
export const _languageScenarios = {
  english: {
    language: 'en',
    dir: 'ltr' as const,
    t: jest.fn((key: string
) => key.replace(/\./g, ' ').toUpperCase()),
  },

  spanish: {
    language: 'es',
    dir: 'ltr' as const,
    t: jest.fn((key: string
) => `es_${key}`),
  },

  arabic: {
    language: 'ar',
    dir: 'rtl' as const,
    t: jest.fn((key: string
) => `ar_${key}`),
    formatTime: jest.fn((time: Date
) => time.toLocaleTimeString('ar-SA')),
  },

  loading: {
    isLoading: true,
    t: jest.fn((
) => '...'),
  },

  error: {
    error: 'Failed to load translations',
    t: jest.fn((key: string
) => key),
  },
};

// ===============================
// ALARM CONTEXT
// ===============================

export interface MockAlarmContextValue {
  alarms: any[];
  activeAlarm: any | null;
  addAlarm: jest.MockedFunction<(alarm: any
) => Promise<void>>;
  updateAlarm: jest.MockedFunction<(id: string, updates: any
) => Promise<void>>;
  deleteAlarm: jest.MockedFunction<(id: string
) => Promise<void>>;
  toggleAlarm: jest.MockedFunction<(id: string
) => Promise<void>>;
  snoozeAlarm: jest.MockedFunction<(id: string
) => Promise<void>>;
  stopAlarm: jest.MockedFunction<(id: string
) => Promise<void>>;
  duplicateAlarm: jest.MockedFunction<(id: string
) => Promise<void>>;
  bulkUpdateAlarms: jest.MockedFunction<(updates: any[]
) => Promise<void>>;
  getUpcomingAlarms: jest.MockedFunction<(
) => any[]>;
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
}

const defaultAlarmValue: MockAlarmContextValue = {
  alarms: [
    {
      id: 'alarm-1',
      time: '07:00',
      label: 'Morning Alarm',
      enabled: true,
      days: [1, 2, 3, 4, 5], // Monday to Friday
      sound: 'classic',
      volume: 80,
      snoozeEnabled: true,
      snoozeInterval: 5,
    },
    {
      id: 'alarm-2',
      time: '08:30',
      label: 'Backup Alarm',
      enabled: false,
      days: [6, 0], // Weekend
      sound: 'gentle',
      volume: 60,
      snoozeEnabled: false,
    },
  ],
  activeAlarm: null,
  addAlarm: jest.fn(),
  updateAlarm: jest.fn(),
  deleteAlarm: jest.fn(),
  toggleAlarm: jest.fn(),
  snoozeAlarm: jest.fn(),
  stopAlarm: jest.fn(),
  duplicateAlarm: jest.fn(),
  bulkUpdateAlarms: jest.fn(),
  getUpcomingAlarms: jest.fn((
) => []),
  isLoading: false,
  error: null,
  lastSyncTime: new Date(),
};

const AlarmTestContext = createContext<MockAlarmContextValue>(defaultAlarmValue);

export const AlarmTestProvider: React.FC<{
  children: ReactNode;
  value?: Partial<MockAlarmContextValue>;
}> = ({ children, value = {} }
) => {
  const mockValue = { ...defaultAlarmValue, ...value };
  return (
    <AlarmTestContext.Provider value={mockValue}>{children}</AlarmTestContext.Provider>
  );
};

export const _useAlarmTest = (
) => useContext(AlarmTestContext);

// Alarm Test Scenarios
export const _alarmScenarios = {
  noAlarms: {
    alarms: [],
    getUpcomingAlarms: jest.fn((
) => []),
  },

  singleAlarm: {
    alarms: [
      {
        id: 'single-alarm',
        time: '06:00',
        label: 'Single Alarm',
        enabled: true,
        days: [1, 2, 3, 4, 5],
      },
    ],
  },

  multipleAlarms: {
    alarms: Array.from({ length: 10 }, (_, i
) => ({
      id: `alarm-${i + 1}`,
      time: `${String(6 + i).padStart(2, '0')}:00`,
      label: `Alarm ${i + 1}`,
      enabled: i % 2 === 0,
      days: [1, 2, 3, 4, 5],
    })),
  },

  activeAlarm: {
    activeAlarm: {
      id: 'active-alarm',
      time: '07:00',
      label: 'Currently Ringing',
      enabled: true,
      isRinging: true,
    },
  },

  loading: {
    isLoading: true,
    alarms: [],
  },

  error: {
    error: 'Failed to load alarms',
    alarms: [],
  },
};

// ===============================
// THEME CONTEXT
// ===============================

export interface MockThemeContextValue {
  theme: string;
  setTheme: jest.MockedFunction<(theme: string
) => void>;
  isDark: boolean;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  animations: boolean;
  setAnimations: jest.MockedFunction<(enabled: boolean
) => void>;
  customThemes: any[];
  createCustomTheme: jest.MockedFunction<(theme: any
) => Promise<void>>;
  deleteCustomTheme: jest.MockedFunction<(id: string
) => Promise<void>>;
  exportTheme: jest.MockedFunction<(id: string
) => Promise<string>>;
  importTheme: jest.MockedFunction<(data: string
) => Promise<void>>;
  isLoading: boolean;
  error: string | null;
}

const defaultThemeValue: MockThemeContextValue = {
  theme: 'dark',
  setTheme: jest.fn(),
  isDark: true,
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  fonts: {
    primary: 'Inter',
    secondary: 'Boto Mono',
    heading: 'Poppins',
  },
  animations: true,
  setAnimations: jest.fn(),
  customThemes: [],
  createCustomTheme: jest.fn(),
  deleteCustomTheme: jest.fn(),
  exportTheme: jest.fn(),
  importTheme: jest.fn(),
  isLoading: false,
  error: null,
};

const ThemeTestContext = createContext<MockThemeContextValue>(defaultThemeValue);

export const ThemeTestProvider: React.FC<{
  children: ReactNode;
  value?: Partial<MockThemeContextValue>;
}> = ({ children, value = {} }
) => {
  const mockValue = { ...defaultThemeValue, ...value };
  return (
    <ThemeTestContext.Provider value={mockValue}>{children}</ThemeTestContext.Provider>
  );
};

export const _useThemeTest = (
) => useContext(ThemeTestContext);

// Theme Test Scenarios
export const _themeScenarios = {
  light: {
    theme: 'light',
    isDark: false,
    colors: {
      primary: '#6366f1',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
    },
  },

  dark: {
    theme: 'dark',
    isDark: true,
    colors: {
      primary: '#6366f1',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
    },
  },

  gaming: {
    theme: 'gaming',
    isDark: true,
    colors: {
      primary: '#ff0080',
      background: '#000000',
      surface: '#1a1a1a',
      text: '#ffffff',
      accent: '#00ff80',
    },
  },

  noAnimations: {
    animations: false,
  },

  customThemes: {
    customThemes: [
      {
        id: 'custom-1',
        name: 'My Custom Theme',
        colors: { primary: '#ff6b6b' },
      },
    ],
  },
};

// ===============================
// COMBINED CONTEXT PROVIDER
// ===============================

export interface ContextTestOptions {
  featureAccess?: Partial<MockFeatureAccessContextValue>;
  language?: Partial<MockLanguageContextValue>;
  alarm?: Partial<MockAlarmContextValue>;
  theme?: Partial<MockThemeContextValue>;
}

export const ContextTestProvider: React.FC<{
  children: ReactNode;
  options?: ContextTestOptions;
}> = ({ children, options = {} }
) => {
  const { featureAccess = {}, language = {}, alarm = {}, theme = {} } = options;

  return (
    <FeatureAccessTestProvider value={featureAccess}>
      <LanguageTestProvider value={language}>
        <AlarmTestProvider value={alarm}>
          <ThemeTestProvider value={theme}>{children}</ThemeTestProvider>
        </AlarmTestProvider>
      </LanguageTestProvider>
    </FeatureAccessTestProvider>
  );
};

// Custom render function for context testing
export const _renderWithContexts = (
  ui: React.ReactElement,
  options: ContextTestOptions & RenderOptions = {}

) => {
  const { featureAccess, language, alarm, theme, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }
) => (
    <ContextTestProvider options={{ featureAccess, language, alarm, theme }}>
      {children}
    </ContextTestProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Pre-configured scenario testing
export const _renderWithScenario = (
  ui: React.ReactElement,
  scenarios: {
    featureAccess?: keyof typeof featureAccessScenarios;
    language?: keyof typeof languageScenarios;
    alarm?: keyof typeof alarmScenarios;
    theme?: keyof typeof themeScenarios;
  }

) => {
  const options: ContextTestOptions = {};

  if (scenarios.featureAccess) {
    options.featureAccess = featureAccessScenarios[scenarios.featureAccess];
  }
  if (scenarios.language) {
    options.language = languageScenarios[scenarios.language];
  }
  if (scenarios.alarm) {
    options.alarm = alarmScenarios[scenarios.alarm];
  }
  if (scenarios.theme) {
    options.theme = themeScenarios[scenarios.theme];
  }

  return renderWithContexts(ui, options);
};

// Alias exports without underscores
export const featureAccessScenarios = _featureAccessScenarios;
export const languageScenarios = _languageScenarios;
export const alarmScenarios = _alarmScenarios;
export const themeScenarios = _themeScenarios;
export const renderWithContexts = _renderWithContexts;
export const renderWithScenario = _renderWithScenario;

export default {
  FeatureAccessTestProvider,
  LanguageTestProvider,
  AlarmTestProvider,
  ThemeTestProvider,
  ContextTestProvider,
  renderWithContexts,
  renderWithScenario,
  featureAccessScenarios,
  languageScenarios,
  alarmScenarios,
  themeScenarios,
};
