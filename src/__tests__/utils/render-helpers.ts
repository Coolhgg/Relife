// React Testing Library render helpers with providers and contexts

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { testConsole, TestUser, TestAlarm, TestTheme } from './index';

// Mock providers for testing
interface MockProviderProps {
  children: ReactNode;
}

// Mock Auth Context Provider
const MockAuthProvider: React.FC<MockProviderProps & { 
  user?: TestUser | null;
  isLoading?: boolean;
  isAuthenticated?: boolean;
}> = ({ 
  children, 
  user = null, 
  isLoading = false, 
  isAuthenticated = false 
}) => {
  const mockAuthValue = {
    user,
    isLoading,
    isAuthenticated,
    signIn: jest.fn(() => Promise.resolve({ user: user || null, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    signUp: jest.fn(() => Promise.resolve({ user: user || null, error: null })),
    updateProfile: jest.fn(() => Promise.resolve({ user: user || null, error: null })),
    resetPassword: jest.fn(() => Promise.resolve({ error: null })),
    refreshSession: jest.fn(() => Promise.resolve({ user: user || null, error: null }))
  };

  return React.createElement(
    'div',
    { 'data-testid': 'mock-auth-provider', 'data-authenticated': isAuthenticated },
    children
  );
};

// Mock Theme Context Provider
const MockThemeProvider: React.FC<MockProviderProps & { 
  theme?: TestTheme;
  themes?: TestTheme[];
}> = ({ 
  children, 
  theme,
  themes = []
}) => {
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
    isDarkMode: theme?.category === 'dark' || false
  };

  return React.createElement(
    'div',
    { 
      'data-testid': 'mock-theme-provider',
      'data-theme': theme?.name || 'default',
      'data-dark-mode': mockThemeValue.isDarkMode
    },
    children
  );
};

// Mock Subscription Context Provider
const MockSubscriptionProvider: React.FC<MockProviderProps & {
  tier?: 'free' | 'premium' | 'ultimate';
  isActive?: boolean;
}> = ({
  children,
  tier = 'free',
  isActive = true
}) => {
  const mockSubscriptionValue = {
    tier,
    isActive,
    isLoading: false,
    subscription: tier !== 'free' ? {
      id: 'mock-subscription-id',
      tier,
      status: isActive ? 'active' : 'canceled',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false
    } : null,
    features: {
      maxAlarms: tier === 'free' ? 5 : tier === 'premium' ? 50 : 100,
      voiceCloning: tier === 'ultimate',
      nuclearMode: tier !== 'free',
      customThemes: tier !== 'free',
      battleMode: tier !== 'free',
      advancedAnalytics: tier === 'ultimate',
      prioritySupport: tier === 'ultimate'
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
    })
  };

  return React.createElement(
    'div',
    {
      'data-testid': 'mock-subscription-provider',
      'data-tier': tier,
      'data-active': isActive
    },
    children
  );
};

// Mock I18n Context Provider
const MockI18nProvider: React.FC<MockProviderProps & {
  language?: string;
  direction?: 'ltr' | 'rtl';
}> = ({
  children,
  language = 'en',
  direction = 'ltr'
}) => {
  const mockI18nValue = {
    language,
    direction,
    isLoading: false,
    t: jest.fn((key: string, options?: any) => {
      // Simple mock translation - returns key with options interpolated
      let translated = key;
      if (options) {
        Object.entries(options).forEach(([param, value]) => {
          translated = translated.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
        });
      }
      return translated;
    }),
    changeLanguage: jest.fn((lang: string) => {
      testConsole.debug(`Mock language changed to: ${lang}`);
      return Promise.resolve();
    }),
    getAvailableLanguages: jest.fn(() => [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'hi', 'ja', 'ko', 'zh'
    ]),
    formatDate: jest.fn((date: Date) => date.toLocaleDateString(language)),
    formatTime: jest.fn((date: Date) => date.toLocaleTimeString(language)),
    formatNumber: jest.fn((num: number) => num.toLocaleString(language))
  };

  return React.createElement(
    'div',
    {
      'data-testid': 'mock-i18n-provider',
      'data-language': language,
      'data-direction': direction,
      dir: direction
    },
    children
  );
};

// Mock PWA Context Provider
const MockPWAProvider: React.FC<MockProviderProps & {
  isInstalled?: boolean;
  canInstall?: boolean;
  isOnline?: boolean;
}> = ({
  children,
  isInstalled = false,
  canInstall = true,
  isOnline = true
}) => {
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
    })
  };

  return React.createElement(
    'div',
    {
      'data-testid': 'mock-pwa-provider',
      'data-installed': isInstalled,
      'data-can-install': canInstall,
      'data-online': isOnline
    },
    children
  );
};

// Mock Analytics Context Provider
const MockAnalyticsProvider: React.FC<MockProviderProps> = ({ children }) => {
  const mockAnalyticsValue = {
    track: jest.fn((event: string, properties?: any) => {
      testConsole.debug(`Mock analytics track: ${event}`, properties);
    }),
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
    })
  };

  return React.createElement(
    'div',
    { 'data-testid': 'mock-analytics-provider' },
    children
  );
};

// Comprehensive wrapper with all providers
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
  pwaInstalled = false
}) => {
  // Create router history with initial route
  const RouterWrapper = ({ children }: { children: ReactNode }) => {
    if (initialRoute !== '/') {
      // Mock location for non-root routes
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          pathname: initialRoute,
          href: `${window.location.origin}${initialRoute}`
        },
        writable: true
      });
    }

    return React.createElement(BrowserRouter, {}, children);
  };

  return React.createElement(
    RouterWrapper,
    {},
    React.createElement(
      MockI18nProvider,
      { language, direction },
      React.createElement(
        MockAuthProvider,
        { user, isAuthenticated },
        React.createElement(
          MockSubscriptionProvider,
          { tier, isActive: true },
          React.createElement(
            MockThemeProvider,
            { theme, themes },
            React.createElement(
              MockPWAProvider,
              { isInstalled: pwaInstalled, isOnline },
              React.createElement(
                MockAnalyticsProvider,
                {},
                children
              )
            )
          )
        )
      )
    )
  );
};

// Custom render function with providers
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
    skipProviders = false,
    customWrapper,
    ...renderOptions
  } = options;

  testConsole.debug('Rendering with providers', {
    initialRoute,
    hasUser: !!user,
    tier,
    language,
    isAuthenticated,
    isOnline,
    pwaInstalled,
    skipProviders
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
        children
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
    tier: 'free'
  });
};

export const renderAsUser = (ui: ReactElement, user?: TestUser, options: CustomRenderOptions = {}) => {
  const defaultUser: TestUser = user || {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return renderWithProviders(ui, {
    ...options,
    user: defaultUser,
    isAuthenticated: true,
    tier: user?.subscription?.tier || 'free'
  });
};

export const renderAsPremiumUser = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const premiumUser: TestUser = {
    id: 'test-premium-user-123',
    email: 'premium@example.com',
    name: 'Premium User',
    role: 'premium',
    subscription: {
      tier: 'premium',
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return renderWithProviders(ui, {
    ...options,
    user: premiumUser,
    isAuthenticated: true,
    tier: 'premium'
  });
};

export const renderAsUltimateUser = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const ultimateUser: TestUser = {
    id: 'test-ultimate-user-123',
    email: 'ultimate@example.com',
    name: 'Ultimate User',
    role: 'premium',
    subscription: {
      tier: 'ultimate',
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return renderWithProviders(ui, {
    ...options,
    user: ultimateUser,
    isAuthenticated: true,
    tier: 'ultimate'
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
    isOnline: false
  });
};

export const renderRTL = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  return renderWithProviders(ui, {
    ...options,
    direction: 'rtl',
    language: 'ar'
  });
};

// Re-export the default render for convenience
export { render };

// Export custom render as default
export default renderWithProviders;