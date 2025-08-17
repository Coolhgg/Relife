/**
 * Test Wrapper Providers for Contexts and Services
 * 
 * Comprehensive test wrapper providers that mock all application contexts and services
 * for isolated and integration testing scenarios.
 */

import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Context Types
interface FeatureAccessContextValue {
  hasAccess: (feature: string) => boolean;
  checkFeatureAccess: (feature: string, tier?: string) => boolean;
  isFeatureEnabled: (feature: string) => boolean;
  upgradeRequired: (feature: string) => boolean;
}

interface LanguageContextValue {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, options?: any) => string;
  dir: 'ltr' | 'rtl';
  formatTime: (time: Date) => string;
  formatDate: (date: Date) => string;
}

interface AuthContextValue {
  user: any | null;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
  isDark: boolean;
  colors: Record<string, string>;
  animations: boolean;
  setAnimations: (enabled: boolean) => void;
}

interface AlarmContextValue {
  alarms: any[];
  addAlarm: (alarm: any) => Promise<void>;
  updateAlarm: (id: string, updates: any) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  activeAlarm: any | null;
  snoozeAlarm: (id: string) => Promise<void>;
  stopAlarm: (id: string) => Promise<void>;
}

interface SubscriptionContextValue {
  subscription: any | null;
  tier: 'free' | 'premium' | 'ultimate';
  isSubscribed: boolean;
  subscribe: (tier: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  features: string[];
  billing: any | null;
}

// Mock Context Implementations
export const createMockFeatureAccessContext = (overrides: Partial<FeatureAccessContextValue> = {}): FeatureAccessContextValue => ({
  hasAccess: jest.fn(() => true),
  checkFeatureAccess: jest.fn(() => true),
  isFeatureEnabled: jest.fn(() => true),
  upgradeRequired: jest.fn(() => false),
  ...overrides
});

export const createMockLanguageContext = (overrides: Partial<LanguageContextValue> = {}): LanguageContextValue => ({
  language: 'en',
  setLanguage: jest.fn(),
  t: jest.fn((key: string) => key),
  dir: 'ltr',
  formatTime: jest.fn((time: Date) => time.toLocaleTimeString()),
  formatDate: jest.fn((date: Date) => date.toLocaleDateString()),
  ...overrides
});

export const createMockAuthContext = (overrides: Partial<AuthContextValue> = {}): AuthContextValue => ({
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    subscription: { tier: 'premium', status: 'active' }
  },
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  isAuthenticated: true,
  isLoading: false,
  error: null,
  ...overrides
});

export const createMockThemeContext = (overrides: Partial<ThemeContextValue> = {}): ThemeContextValue => ({
  theme: 'dark',
  setTheme: jest.fn(),
  isDark: true,
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    accent: '#06b6d4'
  },
  animations: true,
  setAnimations: jest.fn(),
  ...overrides
});

export const createMockAlarmContext = (overrides: Partial<AlarmContextValue> = {}): AlarmContextValue => ({
  alarms: [
    {
      id: 'alarm-1',
      time: '07:00',
      label: 'Wake up',
      enabled: true,
      days: [1, 2, 3, 4, 5],
      sound: 'classic'
    }
  ],
  addAlarm: jest.fn(),
  updateAlarm: jest.fn(),
  deleteAlarm: jest.fn(),
  toggleAlarm: jest.fn(),
  activeAlarm: null,
  snoozeAlarm: jest.fn(),
  stopAlarm: jest.fn(),
  ...overrides
});

export const createMockSubscriptionContext = (overrides: Partial<SubscriptionContextValue> = {}): SubscriptionContextValue => ({
  subscription: {
    id: 'sub-123',
    tier: 'premium',
    status: 'active',
    current_period_end: '2024-12-31T23:59:59Z'
  },
  tier: 'premium',
  isSubscribed: true,
  subscribe: jest.fn(),
  cancelSubscription: jest.fn(),
  features: ['unlimited_alarms', 'custom_voices', 'themes', 'battle_mode'],
  billing: {
    amount: 9.99,
    currency: 'USD',
    interval: 'month'
  },
  ...overrides
});

// Context Providers
const FeatureAccessContext = React.createContext<FeatureAccessContextValue>(createMockFeatureAccessContext());
const LanguageContext = React.createContext<LanguageContextValue>(createMockLanguageContext());
const AuthContext = React.createContext<AuthContextValue>(createMockAuthContext());
const ThemeContext = React.createContext<ThemeContextValue>(createMockThemeContext());
const AlarmContext = React.createContext<AlarmContextValue>(createMockAlarmContext());
const SubscriptionContext = React.createContext<SubscriptionContextValue>(createMockSubscriptionContext());

// Individual Provider Components
export const MockFeatureAccessProvider: React.FC<{
  children: ReactNode;
  value?: Partial<FeatureAccessContextValue>;
}> = ({ children, value = {} }) => {
  const mockValue = createMockFeatureAccessContext(value);
  return (
    <FeatureAccessContext.Provider value={mockValue}>
      {children}
    </FeatureAccessContext.Provider>
  );
};

export const MockLanguageProvider: React.FC<{
  children: ReactNode;
  value?: Partial<LanguageContextValue>;
}> = ({ children, value = {} }) => {
  const mockValue = createMockLanguageContext(value);
  return (
    <LanguageContext.Provider value={mockValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const MockAuthProvider: React.FC<{
  children: ReactNode;
  value?: Partial<AuthContextValue>;
}> = ({ children, value = {} }) => {
  const mockValue = createMockAuthContext(value);
  return (
    <AuthContext.Provider value={mockValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const MockThemeProvider: React.FC<{
  children: ReactNode;
  value?: Partial<ThemeContextValue>;
}> = ({ children, value = {} }) => {
  const mockValue = createMockThemeContext(value);
  return (
    <ThemeContext.Provider value={mockValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const MockAlarmProvider: React.FC<{
  children: ReactNode;
  value?: Partial<AlarmContextValue>;
}> = ({ children, value = {} }) => {
  const mockValue = createMockAlarmContext(value);
  return (
    <AlarmContext.Provider value={mockValue}>
      {children}
    </AlarmContext.Provider>
  );
};

export const MockSubscriptionProvider: React.FC<{
  children: ReactNode;
  value?: Partial<SubscriptionContextValue>;
}> = ({ children, value = {} }) => {
  const mockValue = createMockSubscriptionContext(value);
  return (
    <SubscriptionContext.Provider value={mockValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Service Mocks
export const createMockServices = () => ({
  alarmService: {
    createAlarm: jest.fn(),
    updateAlarm: jest.fn(),
    deleteAlarm: jest.fn(),
    getAlarms: jest.fn(() => Promise.resolve([])),
    scheduleAlarm: jest.fn(),
    cancelAlarm: jest.fn(),
    snoozeAlarm: jest.fn(),
    stopAlarm: jest.fn()
  },
  
  analyticsService: {
    track: jest.fn(),
    identify: jest.fn(),
    page: jest.fn(),
    group: jest.fn(),
    alias: jest.fn(),
    reset: jest.fn()
  },
  
  battleService: {
    createBattle: jest.fn(),
    joinBattle: jest.fn(),
    leaveBattle: jest.fn(),
    getBattles: jest.fn(() => Promise.resolve([])),
    startBattle: jest.fn(),
    endBattle: jest.fn(),
    submitAnswer: jest.fn()
  },
  
  subscriptionService: {
    getSubscription: jest.fn(),
    subscribe: jest.fn(),
    cancelSubscription: jest.fn(),
    updateSubscription: jest.fn(),
    getFeatures: jest.fn(() => []),
    checkAccess: jest.fn(() => true)
  },
  
  voiceService: {
    generateVoice: jest.fn(),
    uploadVoice: jest.fn(),
    deleteVoice: jest.fn(),
    getVoices: jest.fn(() => Promise.resolve([])),
    processVoice: jest.fn(),
    synthesizeVoice: jest.fn()
  },
  
  themeService: {
    getThemes: jest.fn(() => Promise.resolve([])),
    applyTheme: jest.fn(),
    createCustomTheme: jest.fn(),
    deleteTheme: jest.fn(),
    exportTheme: jest.fn(),
    importTheme: jest.fn()
  },
  
  notificationService: {
    requestPermission: jest.fn(() => Promise.resolve('granted')),
    showNotification: jest.fn(),
    scheduleNotification: jest.fn(),
    cancelNotification: jest.fn(),
    clearAllNotifications: jest.fn()
  },
  
  audioService: {
    loadSound: jest.fn(),
    playSound: jest.fn(),
    stopSound: jest.fn(),
    pauseSound: jest.fn(),
    setVolume: jest.fn(),
    fadeIn: jest.fn(),
    fadeOut: jest.fn()
  },
  
  storageService: {
    set: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    keys: jest.fn(() => []),
    size: jest.fn(() => 0)
  },
  
  securityService: {
    encrypt: jest.fn((data) => Promise.resolve(btoa(JSON.stringify(data)))),
    decrypt: jest.fn((data) => Promise.resolve(JSON.parse(atob(data)))),
    hash: jest.fn((data) => Promise.resolve(`hash_${data}`)),
    verify: jest.fn(() => Promise.resolve(true)),
    generateToken: jest.fn(() => 'mock_token_123')
  }
});

// Service Provider Context
const ServiceContext = React.createContext(createMockServices());

export const MockServiceProvider: React.FC<{
  children: ReactNode;
  services?: Partial<ReturnType<typeof createMockServices>>;
}> = ({ children, services = {} }) => {
  const mockServices = { ...createMockServices(), ...services };
  return (
    <ServiceContext.Provider value={mockServices}>
      {children}
    </ServiceContext.Provider>
  );
};

// Combined Test Provider
export interface TestProvidersOptions {
  // Context overrides
  featureAccess?: Partial<FeatureAccessContextValue>;
  language?: Partial<LanguageContextValue>;
  auth?: Partial<AuthContextValue>;
  theme?: Partial<ThemeContextValue>;
  alarm?: Partial<AlarmContextValue>;
  subscription?: Partial<SubscriptionContextValue>;
  
  // Service overrides
  services?: Partial<ReturnType<typeof createMockServices>>;
  
  // Router options
  router?: MemoryRouterProps;
  
  // Query client options
  queryClient?: QueryClient;
  
  // Additional wrappers
  wrappers?: React.ComponentType<{ children: ReactNode }>[];
}

export const TestProviders: React.FC<{
  children: ReactNode;
  options?: TestProvidersOptions;
}> = ({ children, options = {} }) => {
  const {
    featureAccess = {},
    language = {},
    auth = {},
    theme = {},
    alarm = {},
    subscription = {},
    services = {},
    router = { initialEntries: ['/'] },
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    }),
    wrappers = []
  } = options;

  let wrappedChildren = (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter {...router}>
        <MockServiceProvider services={services}>
          <MockFeatureAccessProvider value={featureAccess}>
            <MockLanguageProvider value={language}>
              <MockAuthProvider value={auth}>
                <MockThemeProvider value={theme}>
                  <MockAlarmProvider value={alarm}>
                    <MockSubscriptionProvider value={subscription}>
                      {children}
                    </MockSubscriptionProvider>
                  </MockAlarmProvider>
                </MockThemeProvider>
              </MockAuthProvider>
            </MockLanguageProvider>
          </MockFeatureAccessProvider>
        </MockServiceProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );

  // Apply additional wrappers
  wrappers.forEach(Wrapper => {
    wrappedChildren = <Wrapper>{wrappedChildren}</Wrapper>;
  });

  return <>{wrappedChildren}</>;
};

// Custom Render Function
export interface TestRenderOptions extends RenderOptions {
  providerOptions?: TestProvidersOptions;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: TestRenderOptions = {}
) => {
  const { providerOptions = {}, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <TestProviders options={providerOptions}>
      {children}
    </TestProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Utility Hooks for Testing
export const useTestContext = () => {
  const featureAccess = React.useContext(FeatureAccessContext);
  const language = React.useContext(LanguageContext);
  const auth = React.useContext(AuthContext);
  const theme = React.useContext(ThemeContext);
  const alarm = React.useContext(AlarmContext);
  const subscription = React.useContext(SubscriptionContext);
  const services = React.useContext(ServiceContext);

  return {
    featureAccess,
    language,
    auth,
    theme,
    alarm,
    subscription,
    services
  };
};

// Pre-configured Test Scenarios
export const testScenarios = {
  // Free user scenario
  freeUser: {
    auth: {
      user: {
        id: 'free-user',
        email: 'free@test.com',
        subscription: { tier: 'free', status: 'active' }
      }
    },
    subscription: {
      tier: 'free' as const,
      isSubscribed: false,
      features: ['basic_alarms']
    },
    featureAccess: {
      hasAccess: jest.fn((feature: string) => feature === 'basic_alarms'),
      upgradeRequired: jest.fn((feature: string) => feature !== 'basic_alarms')
    }
  },

  // Premium user scenario
  premiumUser: {
    auth: {
      user: {
        id: 'premium-user',
        email: 'premium@test.com',
        subscription: { tier: 'premium', status: 'active' }
      }
    },
    subscription: {
      tier: 'premium' as const,
      isSubscribed: true,
      features: ['unlimited_alarms', 'custom_voices', 'themes']
    },
    featureAccess: {
      hasAccess: jest.fn(() => true),
      upgradeRequired: jest.fn(() => false)
    }
  },

  // Unauthenticated scenario
  unauthenticated: {
    auth: {
      user: null,
      isAuthenticated: false
    }
  },

  // Mobile scenario
  mobile: {
    theme: {
      theme: 'mobile-dark',
      colors: {
        primary: '#6366f1',
        background: '#000000',
        surface: '#1a1a1a'
      }
    }
  },

  // RTL language scenario
  rtl: {
    language: {
      language: 'ar',
      dir: 'rtl' as const,
      t: jest.fn((key: string) => `ar_${key}`)
    }
  },

  // Offline scenario
  offline: {
    services: {
      storageService: {
        get: jest.fn(),
        set: jest.fn(),
        // Simulate offline storage
      }
    }
  }
};

// Helper function to render with pre-configured scenarios
export const renderWithScenario = (
  ui: React.ReactElement,
  scenario: keyof typeof testScenarios,
  additionalOptions: TestProvidersOptions = {}
) => {
  const scenarioOptions = testScenarios[scenario];
  const mergedOptions = {
    ...scenarioOptions,
    ...additionalOptions
  };

  return renderWithProviders(ui, {
    providerOptions: mergedOptions
  });
};

export default {
  TestProviders,
  renderWithProviders,
  renderWithScenario,
  testScenarios,
  useTestContext,
  createMockServices
};