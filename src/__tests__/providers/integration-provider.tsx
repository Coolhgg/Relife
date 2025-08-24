/**
 * Integration Test Provider
 *
 * Comprehensive provider that combines all contexts and services for full integration testing.
 * Provides realistic end-to-end testing scenarios that mirror production usage.
 */

import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';

import { TestProviders, TestProvidersOptions } from './test-providers';
import { ContextTestProvider, ContextTestOptions } from './context-providers';
import { ServiceTestProviders } from './service-providers';

// ===============================
// INTEGRATION TEST OPTIONS
// ===============================

export interface IntegrationTestOptions {
  // User state
  user?: {
    authenticated?: boolean;
    tier?: 'free' | 'premium' | 'ultimate';
    profile?: any;
    preferences?: any;
  };

  // Application state
  app?: {
    theme?: string;
    language?: string;
    online?: boolean;
    loading?: boolean;
    error?: string | null;
  };

  // Data state
  data?: {
    alarms?: any[];
    battles?: any[];
    voices?: any[];
    themes?: any[];
    notifications?: any[];
  };

  // Feature flags
  features?: {
    premiumFeatures?: boolean;
    battleMode?: boolean;
    voiceGeneration?: boolean;
    customThemes?: boolean;
    analytics?: boolean;
  };

  // Device/Environment
  environment?: {
    mobile?: boolean;
    tablet?: boolean;
    desktop?: boolean;
    pwa?: boolean;
    offline?: boolean;
    notifications?: 'granted' | 'denied' | 'default';
  };

  // Network conditions
  network?: {
    slow?: boolean;
    intermittent?: boolean;
    offline?: boolean;
  };

  // Router configuration
  router?: MemoryRouterProps & {
    protected?: boolean;
    redirectTo?: string;
  };

  // Query client configuration
  queryClient?: {
    cacheTime?: number;
    staleTime?: number;
    retry?: boolean | number;
    refetchOnWindowFocus?: boolean;
  };
}

// ===============================
// INTEGRATION PROVIDER
// ===============================

export const IntegrationTestProvider: React.FC<{
  children: ReactNode;
  options?: IntegrationTestOptions;
}> = ({ children, options = {} }
) => {
  const {
    user = {},
    app = {},
    data = {},
    features = {},
    environment = {},
    network = {},
    router = {},
    queryClient: queryClientOptions = {},
  } = options;

  // Create QueryClient with options
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: queryClientOptions.retry ?? false,
        cacheTime: queryClientOptions.cacheTime ?? 0,
        staleTime: queryClientOptions.staleTime ?? 0,
        refetchOnWindowFocus: queryClientOptions.refetchOnWindowFocus ?? false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Configure context options based on integration options
  const contextOptions: ContextTestOptions = {
    featureAccess: {
      hasAccess: jest.fn((feature: string
) => {
        if (user.tier === 'free') {
          return ['basic_alarms', 'basic_themes'].includes(feature);
        }
        if (user.tier === 'premium') {
          return !['ai_optimization', 'advanced_analytics'].includes(feature);
        }
        return true; // ultimate tier
      }),
      upgradeRequired: jest.fn((feature: string
) => {
        if (user.tier === 'ultimate') return false;
        if (user.tier === 'premium') {
          return ['ai_optimization', 'advanced_analytics'].includes(feature);
        }
        return !['basic_alarms', 'basic_themes'].includes(feature);
      }),
      currentTier: user.tier || 'free',
      premiumFeatures: features.premiumFeatures
        ? ['unlimited_alarms', 'custom_voices', 'themes', 'battle_mode']
        : [],
      ultimateFeatures: ['ai_optimization', 'advanced_analytics', 'priority_support'],
    },

    language: {
      language: app.language || 'en',
      dir: app.language === 'ar' ? 'rtl' : 'ltr',
      isLoading: app.loading || false,
      error: app.error || null,
    },

    alarm: {
      alarms: data.alarms || [],
      isLoading: app.loading || false,
      error: app.error || null,
      getUpcomingAlarms: jest.fn((
) =>
        (data.alarms || []).filter((alarm: any
) => alarm.enabled)
      ),
    },

    theme: {
      theme: app.theme || 'dark',
      isDark: app.theme !== 'light',
      animations: !environment.mobile, // Reduce animations on mobile
      customThemes: data.themes || [],
      isLoading: app.loading || false,
      error: app.error || null,
    },
  };

  // Configure service options based on integration options
  const serviceOptions = {
    alarmService: {
      getAlarms: jest.fn().mockResolvedValue(data.alarms || []),
      createAlarm: jest.fn().mockImplementation(async alarm => {
        if (network.offline) {
          throw new Error('Network unavailable');
        }
        if (network.slow) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        return { ...alarm, id: 'new-alarm-' + Date.now() };
      }),
      syncAlarms: jest.fn().mockImplementation(async (
) => {
        if (network.offline) {
          throw new Error('Sync failed - no internet connection');
        }
        if (network.intermittent && Math.random() > 0.5) {
          throw new Error('Sync failed - connection timeout');
        }
      }),
    },

    analyticsService: {
      track: features.analytics ? jest.fn() : jest.fn(),
      identify: features.analytics ? jest.fn() : jest.fn(),
    },

    battleService: {
      getBattles: jest.fn().mockResolvedValue(data.battles || []),
      createBattle: features.battleMode
        ? jest.fn().mockResolvedValue({ id: 'battle-123' })
        : jest.fn().mockRejectedValue(new Error('Battle mode not available')),
    },

    subscriptionService: {
      getSubscription: jest.fn().mockResolvedValue(
        user.tier !== 'free'
          ? {
              tier: user.tier,
              status: 'active',
              features: contextOptions.featureAccess?.premiumFeatures || [],
            }
          : null
      ),
      checkAccess: contextOptions.featureAccess?.hasAccess || jest.fn((
) => true),
    },

    voiceService: {
      getVoices: jest.fn().mockResolvedValue(data.voices || []),
      generateVoice: features.voiceGeneration
        ? jest.fn().mockResolvedValue({ url: 'mock-voice-url' })
        : jest.fn().mockRejectedValue(new Error('Voice generation not available')),
    },

    notificationService: {
      requestPermission: jest
        .fn()
        .mockResolvedValue(environment.notifications || 'granted'),
      showNotification: jest.fn().mockImplementation(async (title, options
) => {
        if (environment.notifications === 'denied') {
          throw new Error('Notifications not permitted');
        }
      }),
    },

    audioService: {
      loadSound: jest.fn().mockImplementation(async url => {
        if (network.slow) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        if (network.offline) {
          throw new Error('Cannot load sound - offline');
        }
        return { id: 'sound-' + Date.now(), loaded: true };
      }),
    },

    storageService: {
      get: jest.fn().mockImplementation(async key => {
        // Simulate different storage scenarios
        if (key === 'user-preferences') {
          return user.preferences || null;
        }
        if (key.startsWith('alarm-')) {
          const alarmId = key.replace('alarm-', '');
          return (data.alarms || []).find((a: any
) => a.id === alarmId) || null;
        }
        return null;
      }),
      set: jest.fn().mockImplementation(async (key, value
) => {
        if (environment.offline) {
          // Store locally when offline
          return;
        }
        // Simulate network storage
        if (network.slow) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }),
    },
  };

  // Router configuration
  const routerConfig: MemoryRouterProps = {
    initialEntries: router.initialEntries || ['/'],
    initialIndex: router.initialIndex,
    ...router,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter {...routerConfig}>
        <ServiceTestProviders {...serviceOptions}>
          <ContextTestProvider options={contextOptions}>{children}</ContextTestProvider>
        </ServiceTestProviders>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// ===============================
// INTEGRATION SCENARIOS
// ===============================

export const _integrationScenarios = {
  // New user just signed up
  newUser: {
    user: {
      authenticated: true,
      tier: 'free' as const,
      profile: {
        id: 'new-user-123',
        email: 'newuser@example.com',
        name: 'New User',
        createdAt: new Date().toISOString(),
      },
    },
    data: {
      alarms: [],
      battles: [],
      voices: [],
      themes: [],
    },
    features: {
      premiumFeatures: false,
      battleMode: false,
      voiceGeneration: false,
      customThemes: false,
    },
  },

  // Premium user with data
  premiumUser: {
    user: {
      authenticated: true,
      tier: 'premium' as const,
      profile: {
        id: 'premium-user-456',
        email: 'premium@example.com',
        name: 'Premium User',
      },
    },
    data: {
      alarms: [
        { id: 'alarm-1', time: '07:00', label: 'Work', enabled: true },
        { id: 'alarm-2', time: '08:30', label: 'Gym', enabled: false },
      ],
      battles: [{ id: 'battle-1', status: 'active', participants: 3 }],
      voices: [{ id: 'voice-1', name: 'My Voice', processed: true }],
    },
    features: {
      premiumFeatures: true,
      battleMode: true,
      voiceGeneration: true,
      customThemes: true,
    },
  },

  // Ultimate user with full access
  ultimateUser: {
    user: {
      authenticated: true,
      tier: 'ultimate' as const,
    },
    features: {
      premiumFeatures: true,
      battleMode: true,
      voiceGeneration: true,
      customThemes: true,
      analytics: true,
    },
  },

  // Unauthenticated user
  guestUser: {
    user: {
      authenticated: false,
    },
    router: {
      initialEntries: ['/login'],
    },
  },

  // Mobile user
  mobileUser: {
    environment: {
      mobile: true,
      notifications: 'granted' as const,
    },
    app: {
      theme: 'dark', // Mobile users often prefer dark mode
    },
  },

  // Offline user
  offlineUser: {
    network: {
      offline: true,
    },
    environment: {
      offline: true,
    },
  },

  // User with slow connection
  slowConnection: {
    network: {
      slow: true,
    },
  },

  // User with intermittent connection
  unstableConnection: {
    network: {
      intermittent: true,
    },
  },

  // PWA user
  pwaUser: {
    environment: {
      pwa: true,
      notifications: 'granted' as const,
    },
  },

  // User with denied notifications
  noNotifications: {
    environment: {
      notifications: 'denied' as const,
    },
  },

  // RTL language user
  rtlUser: {
    app: {
      language: 'ar',
      theme: 'light', // RTL users might prefer light themes
    },
  },

  // Error state user
  errorState: {
    app: {
      loading: false,
      error: 'Failed to load user data',
    },
  },

  // Loading state
  loadingState: {
    app: {
      loading: true,
      error: null,
    },
  },
};

// ===============================
// INTEGRATION RENDER FUNCTION
// ===============================

export const _renderWithIntegration = (
  ui: React.ReactElement,
  options: IntegrationTestOptions & RenderOptions = {}

) => {
  const {
    user,
    app,
    data,
    features,
    environment,
    network,
    router,
    queryClient,
    ...renderOptions
  } = options;

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }
) => (
    <IntegrationTestProvider
      options={{ user, app, data, features, environment, network, router, queryClient }}
    >
      {children}
    </IntegrationTestProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Helper function to render with predefined scenarios
export const _renderWithIntegrationScenario = (
  ui: React.ReactElement,
  scenario: keyof typeof integrationScenarios,
  additionalOptions: IntegrationTestOptions = {}

) => {
  const scenarioOptions = integrationScenarios[scenario];
  const mergedOptions = {
    ...scenarioOptions,
    ...additionalOptions,
    // Deep merge for nested objects
    user: { ...scenarioOptions.user, ...additionalOptions.user },
    app: { ...scenarioOptions.app, ...additionalOptions.app },
    data: { ...scenarioOptions.data, ...additionalOptions.data },
    features: { ...scenarioOptions.features, ...additionalOptions.features },
    environment: { ...scenarioOptions.environment, ...additionalOptions.environment },
    network: { ...scenarioOptions.network, ...additionalOptions.network },
  };

  return renderWithIntegration(ui, mergedOptions);
};

export default {
  IntegrationTestProvider,
  renderWithIntegration,
  renderWithIntegrationScenario,
  integrationScenarios,
};
