/**
 * Hook Testing Utilities
 * Provides renderHook wrapper with proper providers and mocking for comprehensive hook testing
 */

import React, { ReactElement, ReactNode } from "react";
import {
  renderHook,
  RenderHookOptions,
  RenderHookResult,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "../../hooks/useTheme";
import { act } from "@testing-library/react";

// Import existing test providers if they exist
// import { TestProviders } from '../providers/test-providers';

// Mock context providers for testing
interface MockThemeContextValue {
  theme: "light" | "dark" | "auto" | "system" | "high-contrast";
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  isSystemTheme: boolean;
}

const MockThemeContext = React.createContext<MockThemeContextValue>({
  theme: "light",
  setTheme: jest.fn(),
  toggleTheme: jest.fn(),
  isDarkMode: false,
  isSystemTheme: false,
});

const MockLanguageContext = React.createContext({
  currentLanguage: "en",
  changeLanguage: jest.fn(),
  isRTL: false,
  languageInfo: { name: "English", code: "en", direction: "ltr" },
});

const MockAuthContext = React.createContext({
  user: null,
  isLoading: false,
  signIn: jest.fn(),
  signOut: jest.fn(),
  isAuthenticated: false,
});

// Provider wrapper for hook testing
interface AllTheProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  theme?: "light" | "dark" | "auto" | "system" | "high-contrast";
  language?: string;
  user?: any;
  initialEntries?: string[];
}

export const AllTheProviders: React.FC<AllTheProvidersProps> = ({
  children,
  queryClient,
  theme = "light",
  language = "en",
  user = null,
  initialEntries = ["/"],
}) => {
  const defaultQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
        gcTime: 0, // Disable garbage collection for predictable tests
      },
    },
  });

  const client = queryClient || defaultQueryClient;

  // Mock theme context value
  const themeContextValue: MockThemeContextValue = {
    theme,
    setTheme: jest.fn(),
    toggleTheme: jest.fn(),
    isDarkMode: theme === "dark",
    isSystemTheme: theme === "system" || theme === "auto",
  };

  // Mock language context value
  const languageContextValue = {
    currentLanguage: language,
    changeLanguage: jest.fn(),
    isRTL: ["ar", "he", "fa", "ur"].includes(language),
    languageInfo: {
      name: language === "en" ? "English" : "Test Language",
      code: language,
      direction: ["ar", "he", "fa", "ur"].includes(language) ? "rtl" : "ltr",
    },
  };

  // Mock auth context value
  const authContextValue = {
    user,
    isLoading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    isAuthenticated: !!user,
  };

  return (
    <BrowserRouter>
      <QueryClientProvider client={client}>
        <MockThemeContext.Provider value={themeContextValue}>
          <MockLanguageContext.Provider value={languageContextValue}>
            <MockAuthContext.Provider value={authContextValue}>
              {children}
            </MockAuthContext.Provider>
          </MockLanguageContext.Provider>
        </MockThemeContext.Provider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// Custom renderHook function with providers
export interface CustomRenderHookOptions<TProps>
  extends Omit<RenderHookOptions<TProps>, "wrapper"> {
  queryClient?: QueryClient;
  theme?: "light" | "dark" | "auto" | "system" | "high-contrast";
  language?: string;
  user?: any;
  initialEntries?: string[];
  wrapper?: React.ComponentType<{ children: ReactNode }>;
}

export function renderHookWithProviders<TResult, TProps>(
  render: (initialProps: TProps) => TResult,
  options: CustomRenderHookOptions<TProps> = {},
): RenderHookResult<TResult, TProps> {
  const {
    queryClient,
    theme,
    language,
    user,
    initialEntries,
    wrapper: CustomWrapper,
    ...renderOptions
  } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => {
    if (CustomWrapper) {
      return (
        <CustomWrapper>
          <AllTheProviders
            queryClient={queryClient}
            theme={theme}
            language={language}
            user={user}
            initialEntries={initialEntries}
          >
            {children}
          </AllTheProviders>
        </CustomWrapper>
      );
    }

    return (
      <AllTheProviders
        queryClient={queryClient}
        theme={theme}
        language={language}
        user={user}
        initialEntries={initialEntries}
      >
        {children}
      </AllTheProviders>
    );
  };

  return renderHook(render, {
    wrapper: Wrapper,
    ...renderOptions,
  });
}

// Utility functions for testing hooks

/**
 * Wait for hook to finish async operations
 */
export const waitForHook = async (callback: () => void, timeout = 1000) => {
  await act(async () => {
    callback();
    // Allow time for async operations
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

/**
 * Mock localStorage for testing
 */
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: 0,
    key: jest.fn(),
    // Helper to access the store in tests
    _getStore: () => store,
    _setStore: (newStore: Record<string, string>) => {
      store = newStore;
    },
  };
})();

/**
 * Mock sessionStorage for testing
 */
export const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: 0,
    key: jest.fn(),
    _getStore: () => store,
    _setStore: (newStore: Record<string, string>) => {
      store = newStore;
    },
  };
})();

/**
 * Mock geolocation API
 */
export const mockGeolocation = {
  getCurrentPosition: jest.fn((success, error) => {
    success({
      coords: {
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    });
  }),
  watchPosition: jest.fn(() => 1),
  clearWatch: jest.fn(),
};

/**
 * Mock notification API
 */
export const mockNotification = {
  permission: "granted" as NotificationPermission,
  requestPermission: jest.fn(() =>
    Promise.resolve("granted" as NotificationPermission),
  ),
};

/**
 * Mock audio context and audio elements
 */
export const mockAudio = {
  AudioContext: jest.fn(() => ({
    createBuffer: jest.fn(),
    createBufferSource: jest.fn(() => ({
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    })),
    decodeAudioData: jest.fn(() => Promise.resolve({})),
    destination: {},
  })),
  HTMLAudioElement: jest.fn(() => ({
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    load: jest.fn(),
    currentTime: 0,
    duration: 100,
    volume: 1,
    muted: false,
    paused: true,
    ended: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
};

/**
 * Setup all global mocks for testing environment
 */
export const setupGlobalMocks = () => {
  // Setup storage mocks
  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
    writable: true,
  });

  Object.defineProperty(window, "sessionStorage", {
    value: mockSessionStorage,
    writable: true,
  });

  // Setup geolocation mock
  Object.defineProperty(navigator, "geolocation", {
    value: mockGeolocation,
    writable: true,
  });

  // Setup notification mock
  Object.defineProperty(window, "Notification", {
    value: mockNotification,
    writable: true,
  });

  // Setup audio mocks
  (global as any).AudioContext = mockAudio.AudioContext;
  (global as any).HTMLAudioElement = mockAudio.HTMLAudioElement;

  // Setup matchMedia mock
  Object.defineProperty(window, "matchMedia", {
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
    writable: true,
  });

  // Setup ResizeObserver mock
  (global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Setup IntersectionObserver mock
  (global as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock fetch if not already mocked
  if (!global.fetch) {
    (global as any).fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(""),
        blob: () => Promise.resolve(new Blob()),
      }),
    );
  }
};

/**
 * Clear all mocks between tests
 */
export const clearAllMocks = () => {
  jest.clearAllMocks();
  mockLocalStorage.clear();
  mockSessionStorage.clear();

  // Reset mock implementations
  mockLocalStorage.getItem.mockClear();
  mockLocalStorage.setItem.mockClear();
  mockLocalStorage.removeItem.mockClear();
  mockSessionStorage.getItem.mockClear();
  mockSessionStorage.setItem.mockClear();
  mockSessionStorage.removeItem.mockClear();

  mockGeolocation.getCurrentPosition.mockClear();
  mockGeolocation.watchPosition.mockClear();
  mockGeolocation.clearWatch.mockClear();

  mockNotification.requestPermission.mockClear();
};

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: "test-user-123",
  email: "test@example.com",
  name: "Test User",
  role: "user",
  preferences: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockAlarm = (overrides = {}) => ({
  id: "test-alarm-123",
  userId: "test-user-123",
  time: "07:00",
  label: "Test Alarm",
  isActive: true,
  days: [1, 2, 3, 4, 5],
  dayNames: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  voiceMood: "motivational",
  sound: "default-alarm.mp3",
  difficulty: "medium",
  snoozeEnabled: true,
  snoozeInterval: 5,
  snoozeCount: 0,
  maxSnoozes: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockSubscription = (overrides = {}) => ({
  id: "sub_test123",
  status: "active",
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  plan: {
    id: "plan_premium",
    amount: 999,
    currency: "usd",
    interval: "month",
  },
  customer: "cus_test123",
  ...overrides,
});

// Export all utilities
export { MockThemeContext, MockLanguageContext, MockAuthContext };

export default renderHookWithProviders;
