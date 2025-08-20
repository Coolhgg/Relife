// React Testing Library render helpers with providers and contexts

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { faker } from '@faker-js/faker';
import { testConsole, TestUser, TestAlarm, TestTheme } from './index';

// Mock providers for testing
interface MockProviderProps {
  children: ReactNode;
}

// Mock Auth Context Provider
const MockAuthProvider: React.FC<
  MockProviderProps & {
    user?: TestUser | null;
    isLoading?: boolean;
    isAuthenticated?: boolean;
  }
> = ({ children, user = null, isLoading = false, isAuthenticated = false }) => {
  const mockAuthValue = {
    user,
    isLoading,
    isAuthenticated,
    signIn: jest.fn(() => Promise.resolve({ user: user || null, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    signUp: jest.fn(() => Promise.resolve({ user: user || null, error: null })),
    updateProfile: jest.fn(() => Promise.resolve({ user: user || null, error: null })),
    resetPassword: jest.fn(() => Promise.resolve({ error: null })),
    refreshSession: jest.fn(() => Promise.resolve({ user: user || null, error: null })),
  };

  return React.createElement(
    'div',
    { 'data-testid': 'mock-auth-provider', 'data-authenticated': isAuthenticated },
    children
  );
};

// Mock Theme Context Provider
const MockThemeProvider: React.FC<
  MockProviderProps & {
    theme?: TestTheme;
    themes?: TestTheme[];
  }
> = ({ children, theme, themes = [] }) => {
  const mockThemeValue = {
    currentTheme: theme || null,
    availableThemes: themes,
    setTheme: jest.fn((themeId: string) => {
      testConsole.debug(`Mock theme set to: ${themeId}`);
      return Promise.resolve();
    }),
    createCustomTheme: jest.fn(() => Promise.resolve({ theme: null, error: null })),
    deleteTheme: jest.fn(() => Promise.resolve({ error: null })),
    syncThemes: jest.fn(() => Promise.resolve({ themes: [], error: null })),
    isLoading: false,
    isDarkMode: theme?.category === 'dark' || false,
  };

  return React.createElement(
    'div',
    {
      'data-testid': 'mock-theme-provider',
      'data-theme': theme?.name || 'default',
      'data-dark-mode': mockThemeValue.isDarkMode,
    },
    children
  );
};

// Mock Subscription Context Provider
const MockSubscriptionProvider: React.FC<
  MockProviderProps & {
    tier?: 'free' | 'premium' | 'ultimate';
    isActive?: boolean;
  }
> = ({ children, tier = 'free', isActive = true }) => {
  const mockSubscriptionValue = {
    tier,
    isActive,
    isLoading: false,
    subscription:
      tier !== 'free'
        ? {
            id: 'mock-subscription-id',
            tier,
            status: isActive ? 'active' : 'canceled',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            cancel_at_period_end: false,
          }
        : null,
    features: {
      maxAlarms: tier === 'free' ? 5 : tier === 'premium' ? 50 : 100,
      voiceCloning: tier === 'ultimate',
      nuclearMode: tier !== 'free',
      customThemes: tier !== 'free',
      battleMode: tier !== 'free',
      advancedAnalytics: tier === 'ultimate',
      prioritySupport: tier === 'ultimate',
    },
    subscribe: jest.fn((newTier: string) => {
      testConsole.debug(`Mock subscription upgrade to: ${newTier}`);
      return Promise.resolve({ subscription: null, error: null });
    }),
    cancel: jest.fn(() => {
      testConsole.debug('Mock subscription cancellation');
      return Promise.resolve({ error: null });
    }),
    reactivate: jest.fn(() => {
      testConsole.debug('Mock subscription reactivation');
      return Promise.resolve({ error: null });
    }),
  };

  return React.createElement(
    'div',
    {
      'data-testid': 'mock-subscription-provider',
      'data-tier': tier,
      'data-active': isActive,
    },
    children
  );
};

// Mock I18n Context Provider
const MockI18nProvider: React.FC<
  MockProviderProps & {
    language?: string;
    direction?: 'ltr' | 'rtl';
  }
> = ({ children, language = 'en', direction = 'ltr' }) => {
  const mockI18nValue = {
    language,
    direction,
    isLoading: false,
    t: jest.fn((key: string, options?: any) => {
      // Simple mock translation - returns key with options interpolated
      let translated = key;
      if (options) {
        Object.entries(options).forEach(([param, value]) => {
          translated = translated.replace(
            new RegExp(`{{${param}}}`, 'g'),
            String(value)
          );
        });
      }
      return translated;
    }),
    changeLanguage: jest.fn((lang: string) => {
      testConsole.debug(`Mock language changed to: ${lang}`);
      return Promise.resolve();
    }),
    getAvailableLanguages: jest.fn(() => [
      'en',
      'es',
      'fr',
      'de',
      'it',
      'pt',
      'ru',
      'ar',
      'hi',
      'ja',
      'ko',
      'zh',
    ]),
    formatDate: jest.fn((date: Date) => date.toLocaleDateString(language)),
    formatTime: jest.fn((date: Date) => date.toLocaleTimeString(language)),
    formatNumber: jest.fn((num: number) => num.toLocaleString(language)),
  };

  return React.createElement(
    'div',
    {
      'data-testid': 'mock-i18n-provider',
      'data-language': language,
      'data-direction': direction,
      dir: direction,
    },
    children
  );
};

// Mock PWA Context Provider
const MockPWAProvider: React.FC<
  MockProviderProps & {
    isInstalled?: boolean;
    canInstall?: boolean;
    isOnline?: boolean;
  }
> = ({ children, isInstalled = false, canInstall = true, isOnline = true }) => {
  const mockPWAValue = {
    isInstalled,
    canInstall,
    isOnline,
    isLoading: false,
    updateAvailable: false,
    install: jest.fn(() => {
      testConsole.debug('Mock PWA installation');
      return Promise.resolve({ success: true, error: null });
    }),
    update: jest.fn(() => {
      testConsole.debug('Mock PWA update');
      return Promise.resolve({ success: true, error: null });
    }),
    share: jest.fn((data: any) => {
      testConsole.debug('Mock PWA share', data);
      return Promise.resolve({ success: true, error: null });
    }),
  };

  return React.createElement(
    'div',
    {
      'data-testid': 'mock-pwa-provider',
      'data-installed': isInstalled,
      'data-can-install': canInstall,
      'data-online': isOnline,
    },
    children
  );
};

// Mock Analytics Context Provider (Enhanced)
const MockAnalyticsProvider: React.FC<MockProviderProps> = ({ children }) => {
  const mockAnalyticsValue = {
    track: jest.fn((event: string, properties?: any) => {
      testConsole.debug(`Mock analytics track: ${event}`, properties);
    }),
    trackPageView: jest.fn((pageName?: string, properties?: any) => {
      testConsole.debug(`Mock analytics page view: ${pageName}`, properties);
    }),
    trackFeatureUsage: jest.fn(
      (featureName: string, action: string, properties?: any) => {
        testConsole.debug(
          `Mock analytics feature usage: ${featureName}.${action}`,
          properties
        );
      }
    ),
    trackError: jest.fn((error: Error, context?: string) => {
      testConsole.debug(`Mock analytics error: ${error.message}`, context);
    }),
    trackPerformance: jest.fn((metric: string, value: number, context?: string) => {
      testConsole.debug(`Mock analytics performance: ${metric} = ${value}`, context);
    }),
    trackUserInteraction: jest.fn(
      (element: string, action: string, properties?: any) => {
        testConsole.debug(
          `Mock analytics interaction: ${element}.${action}`,
          properties
        );
      }
    ),
    identify: jest.fn((userId: string, traits?: any) => {
      testConsole.debug(`Mock analytics identify: ${userId}`, traits);
    }),
    page: jest.fn((name: string, properties?: any) => {
      testConsole.debug(`Mock analytics page: ${name}`, properties);
    }),
    isEnabled: jest.fn(() => true),
    opt_out: jest.fn(() => {
      testConsole.debug('Mock analytics opt out');
    }),
    opt_in: jest.fn(() => {
      testConsole.debug('Mock analytics opt in');
    }),
  };

  return React.createElement(
    'div',
    { 'data-testid': 'mock-analytics-provider' },
    children
  );
};

// Mock Feature Access Context Provider
const MockFeatureAccessProvider: React.FC<
  MockProviderProps & {
    tier?: 'free' | 'premium' | 'ultimate';
    userId?: string;
  }
> = ({ children, tier = 'free', userId = 'test-user-123' }) => {
  const mockFeatureAccessValue = {
    featureAccess: {
      tier,
      limits: {
        maxAlarms: tier === 'free' ? 5 : tier === 'premium' ? 50 : 100,
        voiceCloning: tier === 'ultimate',
        customThemes: tier !== 'free',
        battleMode: tier !== 'free',
        advancedAnalytics: tier === 'ultimate',
      },
      usage: {
        alarms: faker.number.int({ min: 0, max: tier === 'free' ? 5 : 25 }),
        themes: faker.number.int({ min: 0, max: 10 }),
        voiceClones: tier === 'ultimate' ? faker.number.int({ min: 0, max: 5 }) : 0,
      },
    },
    userTier: tier,
    isLoading: false,
    error: null,
    hasFeatureAccess: jest.fn((featureId: string) => {
      const access =
        tier !== 'free' || ['basic_alarms', 'themes_browse'].includes(featureId);
      testConsole.debug(`Mock feature access check: ${featureId} = ${access}`);
      return access;
    }),
    getFeatureUsage: jest.fn((featureId: string) => {
      const usage = faker.number.int({ min: 0, max: 10 });
      const limit = tier === 'free' ? 5 : tier === 'premium' ? 50 : 100;
      return { used: usage, limit, remaining: limit - usage };
    }),
    getUpgradeRequirement: jest.fn((featureId: string) => {
      if (tier === 'free') return 'premium';
      if (
        tier === 'premium' &&
        ['voice_cloning', 'advanced_analytics'].includes(featureId)
      )
        return 'ultimate';
      return null;
    }),
    trackFeatureAttempt: jest.fn((featureId: string, context?: Record<string, any>) => {
      testConsole.debug(`Mock feature attempt tracked: ${featureId}`, context);
    }),
    refreshFeatureAccess: jest.fn(() => Promise.resolve()),
    grantTemporaryAccess: jest.fn(
      (featureId: string, durationMinutes: number, reason: string) => {
        testConsole.debug(
          `Mock temporary access granted: ${featureId} for ${durationMinutes}min - ${reason}`
        );
      }
    ),
  };

  return React.createElement(
    'div',
    {
      'data-testid': 'mock-feature-access-provider',
      'data-tier': tier,
      'data-user-id': userId,
    },
    children
  );
};

// Mock Screen Reader Context Provider
const MockScreenReaderProvider: React.FC<
  MockProviderProps & {
    enabled?: boolean;
    verbosity?: 'low' | 'medium' | 'high';
  }
> = ({ children, enabled = true, verbosity = 'medium' }) => {
  const mockScreenReaderValue = {
    isEnabled: enabled,
    verbosityLevel: verbosity,
    announce: jest.fn((message: string, priority?: string) => {
      testConsole.debug(
        `Mock screen reader announcement: ${message} [${priority || 'polite'}]`
      );
    }),
    updateSettings: jest.fn((settings: any) => {
      testConsole.debug('Mock screen reader settings updated', settings);
    }),
    describeElement: jest.fn((element: string) => {
      return `Mock description for ${element}`;
    }),
    setFocusAnnouncement: jest.fn((message: string) => {
      testConsole.debug(`Mock focus announcement: ${message}`);
    }),
  };

  return React.createElement(
    'div',
    {
      'data-testid': 'mock-screen-reader-provider',
      'data-enabled': enabled,
      'data-verbosity': verbosity,
    },
    children
  );
};

// Mock Enhanced Theme Provider (more comprehensive than existing)
const MockEnhancedThemeProvider: React.FC<
  MockProviderProps & {
    theme?: TestTheme;
    themes?: TestTheme[];
    personalization?: any;
  }
> = ({ children, theme, themes = [], personalization = {} }) => {
  const mockThemeValue = {
    theme: theme || { id: 'default', name: 'Default', category: 'light' },
    themeConfig: {
      colors: { primary: '#3B82F6', secondary: '#8B5CF6' },
      typography: { fontFamily: 'system-ui' },
      spacing: { unit: 4 },
      animations: { enabled: true },
    },
    personalization: {
      colorPreferences: {},
      typographyPreferences: {},
      motionPreferences: { reduceMotion: false },
      soundPreferences: { enabled: true },
      layoutPreferences: { density: 'medium' },
      accessibilityPreferences: { highContrast: false },
      ...personalization,
    },
    isDarkMode: theme?.category === 'dark' || false,
    isSystemTheme: false,
    setTheme: jest.fn((newTheme: any) => {
      testConsole.debug(`Mock enhanced theme set to:`, newTheme);
    }),
    toggleTheme: jest.fn(() => {
      testConsole.debug('Mock enhanced theme toggled');
    }),
    resetTheme: jest.fn(() => {
      testConsole.debug('Mock enhanced theme reset');
    }),
    updatePersonalization: jest.fn((updates: any) => {
      testConsole.debug('Mock personalization updated', updates);
    }),
    updateColorPreference: jest.fn((property: string, value: any) => {
      testConsole.debug(`Mock color preference updated: ${property} = ${value}`);
    }),
    updateTypographyPreference: jest.fn((property: string, value: any) => {
      testConsole.debug(`Mock typography preference updated: ${property} = ${value}`);
    }),
    updateMotionPreference: jest.fn((property: string, value: any) => {
      testConsole.debug(`Mock motion preference updated: ${property} = ${value}`);
    }),
    updateSoundPreference: jest.fn((property: string, value: any) => {
      testConsole.debug(`Mock sound preference updated: ${property} = ${value}`);
    }),
    updateLayoutPreference: jest.fn((property: string, value: any) => {
      testConsole.debug(`Mock layout preference updated: ${property} = ${value}`);
    }),
    updateAccessibilityPreference: jest.fn((property: string, value: any) => {
      testConsole.debug(
        `Mock accessibility preference updated: ${property} = ${value}`
      );
    }),
    availableThemes: themes,
    createCustomTheme: jest.fn(() => Promise.resolve({ theme: null, error: null })),
    saveThemePreset: jest.fn(() => Promise.resolve()),
    loadThemePreset: jest.fn(() => Promise.resolve()),
    themeAnalytics: {
      mostUsedThemes: themes.slice(0, 3),
      totalThemeChanges: faker.number.int({ min: 5, max: 100 }),
      averageSessionTime: faker.number.int({ min: 600, max: 7200 }),
    },
    getThemeRecommendations: jest.fn(() => themes.slice(0, 5)),
    exportThemes: jest.fn(() => Promise.resolve(JSON.stringify({ themes }))),
    importThemes: jest.fn(() => Promise.resolve(true)),
    syncThemes: jest.fn(() => Promise.resolve()),
    cloudSyncStatus: { status: 'synced', lastSync: new Date() },
    enableCloudSync: jest.fn((enabled: boolean) => {
      testConsole.debug(`Mock cloud sync ${enabled ? 'enabled' : 'disabled'}`);
    }),
    forceCloudSync: jest.fn(() => Promise.resolve()),
    resetCloudData: jest.fn(() => Promise.resolve()),
    onCloudSyncStatusChange: jest.fn(() => () => {}),
    getCSSVariables: jest.fn(() => ({
      '--color-primary': '#3B82F6',
      '--color-secondary': '#8B5CF6',
    })),
  };

  return React.createElement(
    'div',
    {
      'data-testid': 'mock-enhanced-theme-provider',
      'data-theme': theme?.name || 'default',
      'data-dark-mode': mockThemeValue.isDarkMode,
    },
    children
  );
};

// Mock Persona Analytics Provider
const MockPersonaAnalyticsProvider: React.FC<
  MockProviderProps & {
    currentPersona?: string;
  }
> = ({ children, currentPersona = 'struggling_sam' }) => {
  const mockPersonaAnalyticsValue = {
    currentPersona,
    personaConfidence: 0.85,
    trackPersonaAction: jest.fn((action: string, context?: any) => {
      testConsole.debug(
        `Mock persona action tracked: ${action} for ${currentPersona}`,
        context
      );
    }),
    updatePersonaDetection: jest.fn((factors: any) => {
      testConsole.debug(`Mock persona detection updated`, factors);
    }),
    getPersonaInsights: jest.fn(() => ({
      conversionLikelihood: faker.number.float({ min: 0.1, max: 0.9 }),
      recommendedFeatures: ['basic_alarms', 'theme_browser'],
      suggestedUpgrade: currentPersona === 'struggling_sam' ? null : 'premium',
    })),
    triggerPersonaRecalculation: jest.fn(() => Promise.resolve(currentPersona)),
  };

  return React.createElement(
    'div',
    {
      'data-testid': 'mock-persona-analytics-provider',
      'data-current-persona': currentPersona,
    },
    children
  );
};

// Enhanced comprehensive wrapper with all providers
interface AllProvidersProps {
  children: ReactNode;
  initialRoute?: string;
  user?: TestUser | null;
  theme?: TestTheme;
  themes?: TestTheme[];
  tier?: 'free' | 'premium' | 'ultimate';
  language?: string;
  direction?: 'ltr' | 'rtl';
  isAuthenticated?: boolean;
  isOnline?: boolean;
  pwaInstalled?: boolean;
  // Enhanced provider options
  featureAccess?: boolean;
  screenReaderEnabled?: boolean;
  screenReaderVerbosity?: 'low' | 'medium' | 'high';
  enhancedTheme?: boolean;
  personaAnalytics?: boolean;
  currentPersona?: string;
  personalization?: any;
}

const AllProviders: React.FC<AllProvidersProps> = ({
  children,
  initialRoute = '/',
  user = null,
  theme,
  themes = [],
  tier = 'free',
  language = 'en',
  direction = 'ltr',
  isAuthenticated = false,
  isOnline = true,
  pwaInstalled = false,
  featureAccess = true,
  screenReaderEnabled = false,
  screenReaderVerbosity = 'medium',
  enhancedTheme = false,
  personaAnalytics = false,
  currentPersona = 'struggling_sam',
  personalization = {},
}) => {
  // Create router history with initial route
  const RouterWrapper = ({ children }: { children: ReactNode }) => {
    if (initialRoute !== '/') {
      // Mock location for non-root routes
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          pathname: initialRoute,
          href: `${window.location.origin}${initialRoute}`,
        },
        writable: true,
      });
    }

    return React.createElement(BrowserRouter, {}, children);
  };

  // Create nested provider structure with conditional enhanced providers
  let providerChain = children;

  // Analytics Provider (always included)
  providerChain = React.createElement(MockAnalyticsProvider, {}, providerChain);

  // Persona Analytics Provider (conditional)
  if (personaAnalytics) {
    providerChain = React.createElement(
      MockPersonaAnalyticsProvider,
      { currentPersona },
      providerChain
    );
  }

  // Screen Reader Provider (conditional)
  if (screenReaderEnabled) {
    providerChain = React.createElement(
      MockScreenReaderProvider,
      { enabled: screenReaderEnabled, verbosity: screenReaderVerbosity },
      providerChain
    );
  }

  // Feature Access Provider (conditional)
  if (featureAccess) {
    providerChain = React.createElement(
      MockFeatureAccessProvider,
      { tier, userId: user?.id || 'test-user-123' },
      providerChain
    );
  }

  // PWA Provider
  providerChain = React.createElement(
    MockPWAProvider,
    { isInstalled: pwaInstalled, isOnline },
    providerChain
  );

  // Theme Provider (enhanced or standard)
  if (enhancedTheme) {
    providerChain = React.createElement(
      MockEnhancedThemeProvider,
      { theme, themes, personalization },
      providerChain
    );
  } else {
    providerChain = React.createElement(
      MockThemeProvider,
      { theme, themes },
      providerChain
    );
  }

  // Subscription Provider
  providerChain = React.createElement(
    MockSubscriptionProvider,
    { tier, isActive: true },
    providerChain
  );

  // Auth Provider
  providerChain = React.createElement(
    MockAuthProvider,
    { user, isAuthenticated },
    providerChain
  );

  // I18n Provider
  providerChain = React.createElement(
    MockI18nProvider,
    { language, direction },
    providerChain
  );

  // Router Wrapper
  return React.createElement(RouterWrapper, {}, providerChain);
};

// Enhanced custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Provider options
  initialRoute?: string;
  user?: TestUser | null;
  theme?: TestTheme;
  themes?: TestTheme[];
  tier?: 'free' | 'premium' | 'ultimate';
  language?: string;
  direction?: 'ltr' | 'rtl';
  isAuthenticated?: boolean;
  isOnline?: boolean;
  pwaInstalled?: boolean;

  // Enhanced provider options
  featureAccess?: boolean;
  screenReaderEnabled?: boolean;
  screenReaderVerbosity?: 'low' | 'medium' | 'high';
  enhancedTheme?: boolean;
  personaAnalytics?: boolean;
  currentPersona?: string;
  personalization?: any;

  // Render options
  skipProviders?: boolean;
  customWrapper?: React.ComponentType<{ children: ReactNode }>;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const {
    initialRoute = '/',
    user = null,
    theme,
    themes = [],
    tier = 'free',
    language = 'en',
    direction = 'ltr',
    isAuthenticated = false,
    isOnline = true,
    pwaInstalled = false,
    featureAccess = true,
    screenReaderEnabled = false,
    screenReaderVerbosity = 'medium',
    enhancedTheme = false,
    personaAnalytics = false,
    currentPersona = 'struggling_sam',
    personalization = {},
    skipProviders = false,
    customWrapper,
    ...renderOptions
  } = options;

  testConsole.debug('Rendering with enhanced providers', {
    initialRoute,
    hasUser: !!user,
    tier,
    language,
    isAuthenticated,
    isOnline,
    pwaInstalled,
    featureAccess,
    screenReaderEnabled,
    enhancedTheme,
    personaAnalytics,
    skipProviders,
  });

  let Wrapper: React.ComponentType<{ children: ReactNode }>;

  if (skipProviders) {
    Wrapper = ({ children }) => React.createElement('div', {}, children);
  } else if (customWrapper) {
    Wrapper = customWrapper;
  } else {
    Wrapper = ({ children }) =>
      React.createElement(AllProviders, {
        initialRoute,
        user,
        theme,
        themes,
        tier,
        language,
        direction,
        isAuthenticated,
        isOnline,
        pwaInstalled,
        featureAccess,
        screenReaderEnabled,
        screenReaderVerbosity,
        enhancedTheme,
        personaAnalytics,
        currentPersona,
        personalization,
        children,
      });
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Convenience render functions for common scenarios
export const renderAsGuest = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  return renderWithProviders(ui, {
    ...options,
    user: null,
    isAuthenticated: false,
    tier: 'free',
  });
};

export const renderAsUser = (
  ui: ReactElement,
  user?: TestUser,
  options: CustomRenderOptions = {}
) => {
  const defaultUser: TestUser = user || {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return renderWithProviders(ui, {
    ...options,
    user: defaultUser,
    isAuthenticated: true,
    tier: user?.subscription?.tier || 'free',
  });
};

export const renderAsPremiumUser = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const premiumUser: TestUser = {
    id: 'test-premium-user-123',
    email: 'premium@example.com',
    name: 'Premium User',
    role: 'premium',
    subscription: {
      tier: 'premium',
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return renderWithProviders(ui, {
    ...options,
    user: premiumUser,
    isAuthenticated: true,
    tier: 'premium',
  });
};

export const renderAsUltimateUser = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const ultimateUser: TestUser = {
    id: 'test-ultimate-user-123',
    email: 'ultimate@example.com',
    name: 'Ultimate User',
    role: 'premium',
    subscription: {
      tier: 'ultimate',
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return renderWithProviders(ui, {
    ...options,
    user: ultimateUser,
    isAuthenticated: true,
    tier: 'ultimate',
  });
};

export const renderMobile = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  // Set mobile viewport
  Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));

  return renderWithProviders(ui, options);
};

export const renderTablet = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  // Set tablet viewport
  Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: 1024, writable: true });

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));

  return renderWithProviders(ui, options);
};

export const renderDesktop = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  // Set desktop viewport
  Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));

  return renderWithProviders(ui, options);
};

export const renderOffline = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  return renderWithProviders(ui, {
    ...options,
    isOnline: false,
  });
};

export const renderRTL = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  return renderWithProviders(ui, {
    ...options,
    direction: 'rtl',
    language: 'ar',
  });
};

// Enhanced provider convenience functions
export const renderWithFeatureAccess = (
  ui: ReactElement,
  tier: 'free' | 'premium' | 'ultimate' = 'premium',
  options: CustomRenderOptions = {}
) => {
  return renderWithProviders(ui, {
    ...options,
    tier,
    featureAccess: true,
    isAuthenticated: true,
    user: options.user || {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
};

export const renderWithScreenReader = (
  ui: ReactElement,
  verbosity: 'low' | 'medium' | 'high' = 'medium',
  options: CustomRenderOptions = {}
) => {
  return renderWithProviders(ui, {
    ...options,
    screenReaderEnabled: true,
    screenReaderVerbosity: verbosity,
  });
};

export const renderWithEnhancedTheme = (
  ui: ReactElement,
  theme?: TestTheme,
  options: CustomRenderOptions = {}
) => {
  return renderWithProviders(ui, {
    ...options,
    enhancedTheme: true,
    theme,
    personalization: {
      colorPreferences: { primaryColor: '#3B82F6' },
      motionPreferences: { reduceMotion: false },
      accessibilityPreferences: { highContrast: false },
    },
  });
};

export const renderWithPersonaAnalytics = (
  ui: ReactElement,
  persona: string = 'struggling_sam',
  options: CustomRenderOptions = {}
) => {
  return renderWithProviders(ui, {
    ...options,
    personaAnalytics: true,
    currentPersona: persona,
  });
};

export const renderWithAllEnhancements = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  return renderWithProviders(ui, {
    ...options,
    featureAccess: true,
    screenReaderEnabled: true,
    enhancedTheme: true,
    personaAnalytics: true,
    isAuthenticated: true,
    tier: 'premium',
    user: options.user || {
      id: 'test-user-123',
      email: 'premium@example.com',
      name: 'Premium User',
      role: 'premium',
      subscription: {
        tier: 'premium',
        status: 'active',
        current_period_end: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
};

// Re-export the default render for convenience
export { render };

// Export custom render as default
export default renderWithProviders;
