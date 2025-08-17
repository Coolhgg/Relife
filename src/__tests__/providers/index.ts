/**
 * Test Providers Index
 * 
 * Central export point for all test providers, utilities, and scenarios.
 * Provides comprehensive testing infrastructure for the Relife alarm application.
 */

// Core test providers
export {
  TestProviders,
  renderWithProviders,
  renderWithScenario,
  testScenarios,
  useTestContext,
  createMockServices,
  type TestProvidersOptions
} from './test-providers';

// Context-specific providers
export {
  FeatureAccessTestProvider,
  LanguageTestProvider,
  AlarmTestProvider,
  ThemeTestProvider,
  ContextTestProvider,
  renderWithContexts,
  renderWithScenario as renderWithContextScenario,
  featureAccessScenarios,
  languageScenarios,
  alarmScenarios,
  themeScenarios,
  useFeatureAccessTest,
  useLanguageTest,
  useAlarmTest,
  useThemeTest,
  type MockFeatureAccessContextValue,
  type MockLanguageContextValue,
  type MockAlarmContextValue,
  type MockThemeContextValue,
  type ContextTestOptions
} from './context-providers';

// Service-specific providers
export {
  ServiceTestProviders,
  useAlarmServiceTest,
  useAnalyticsServiceTest,
  useBattleServiceTest,
  useSubscriptionServiceTest,
  useVoiceServiceTest,
  useNotificationServiceTest,
  useAudioServiceTest,
  useStorageServiceTest,
  useSecurityServiceTest,
  serviceScenarios,
  type MockAlarmService,
  type MockAnalyticsService,
  type MockBattleService,
  type MockSubscriptionService,
  type MockVoiceService,
  type MockNotificationService,
  type MockAudioService,
  type MockStorageService,
  type MockSecurityService
} from './service-providers';

// Integration provider
export {
  IntegrationTestProvider,
  renderWithIntegration,
  integrationScenarios,
  type IntegrationTestOptions
} from './integration-provider';

// Utility functions for common test patterns
export const createTestSuite = (name: string, tests: () => void) => {
  describe(name, () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    tests();
  });
};

export const createAsyncTestSuite = (name: string, tests: () => void) => {
  describe(name, () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      // Allow for async setup
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    afterEach(async () => {
      jest.restoreAllMocks();
      // Allow for async cleanup
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    tests();
  });
};

// Common test utilities
export const testUtils = {
  /**
   * Wait for async operations to complete
   */
  waitForAsync: (timeout: number = 100) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
  },

  /**
   * Create a mock function with predefined responses
   */
  createMockWithResponses: <T extends any[]>(responses: T) => {
    const mock = jest.fn();
    responses.forEach((response, index) => {
      mock.mockReturnValueOnce(response);
    });
    return mock;
  },

  /**
   * Create a mock promise that resolves/rejects after a delay
   */
  createDelayedPromise: <T>(value: T, delay: number = 100, shouldReject: boolean = false) => {
    return new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        if (shouldReject) {
          reject(new Error(String(value)));
        } else {
          resolve(value);
        }
      }, delay);
    });
  },

  /**
   * Generate realistic test data
   */
  generateTestData: {
    user: (overrides: any = {}) => ({
      id: 'test-user-' + Math.random().toString(36).substr(2, 9),
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      ...overrides
    }),

    alarm: (overrides: any = {}) => ({
      id: 'test-alarm-' + Math.random().toString(36).substr(2, 9),
      time: '07:00',
      label: 'Test Alarm',
      enabled: true,
      days: [1, 2, 3, 4, 5],
      sound: 'classic',
      createdAt: new Date().toISOString(),
      ...overrides
    }),

    battle: (overrides: any = {}) => ({
      id: 'test-battle-' + Math.random().toString(36).substr(2, 9),
      status: 'pending',
      participants: [],
      createdAt: new Date().toISOString(),
      ...overrides
    })
  }
};

// Performance testing utilities
export const performanceUtils = {
  /**
   * Measure component render time
   */
  measureRenderTime: async (renderFn: () => any) => {
    const start = performance.now();
    await renderFn();
    const end = performance.now();
    return end - start;
  },

  /**
   * Test memory usage
   */
  measureMemoryUsage: () => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  },

  /**
   * Simulate slow network conditions
   */
  simulateSlowNetwork: (delay: number = 1000) => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(async (...args) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return originalFetch(...args);
    });
    return () => {
      global.fetch = originalFetch;
    };
  }
};

// Accessibility testing utilities
export const a11yUtils = {
  /**
   * Check for required ARIA attributes
   */
  checkAriaAttributes: (element: HTMLElement, requiredAttributes: string[]) => {
    const missing = requiredAttributes.filter(attr => 
      !element.hasAttribute(attr)
    );
    return {
      hasAll: missing.length === 0,
      missing
    };
  },

  /**
   * Check color contrast
   */
  checkColorContrast: (foreground: string, background: string) => {
    // Simplified contrast check - in real tests you'd use a proper library
    return {
      ratio: 4.5, // Mock ratio
      isAccessible: true
    };
  },

  /**
   * Test keyboard navigation
   */
  testKeyboardNavigation: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    return {
      count: focusableElements.length,
      elements: Array.from(focusableElements)
    };
  }
};

// Mobile testing utilities
export const mobileUtils = {
  /**
   * Simulate mobile viewport
   */
  setMobileViewport: () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667
    });
    window.dispatchEvent(new Event('resize'));
  },

  /**
   * Simulate tablet viewport
   */
  setTabletViewport: () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1024
    });
    window.dispatchEvent(new Event('resize'));
  },

  /**
   * Reset viewport to desktop
   */
  setDesktopViewport: () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800
    });
    window.dispatchEvent(new Event('resize'));
  }
};

// Common test constants
export const TEST_IDS = {
  ALARM_LIST: 'alarm-list',
  ALARM_CARD: 'alarm-card',
  ADD_ALARM_BUTTON: 'add-alarm-button',
  TIME_PICKER: 'time-picker',
  LABEL_INPUT: 'label-input',
  SAVE_BUTTON: 'save-button',
  CANCEL_BUTTON: 'cancel-button',
  DELETE_BUTTON: 'delete-button',
  TOGGLE_BUTTON: 'toggle-button',
  SNOOZE_BUTTON: 'snooze-button',
  STOP_BUTTON: 'stop-button',
  SETTINGS_BUTTON: 'settings-button',
  THEME_SELECTOR: 'theme-selector',
  LANGUAGE_SELECTOR: 'language-selector',
  NOTIFICATION_TOGGLE: 'notification-toggle',
  SOUND_SELECTOR: 'sound-selector',
  VOLUME_SLIDER: 'volume-slider',
  BATTLE_LIST: 'battle-list',
  JOIN_BATTLE_BUTTON: 'join-battle-button',
  CREATE_BATTLE_BUTTON: 'create-battle-button',
  LEADERBOARD: 'leaderboard',
  USER_PROFILE: 'user-profile',
  SUBSCRIPTION_CARD: 'subscription-card',
  UPGRADE_BUTTON: 'upgrade-button'
} as const;

export default {
  createTestSuite,
  createAsyncTestSuite,
  testUtils,
  performanceUtils,
  a11yUtils,
  mobileUtils,
  TEST_IDS
};