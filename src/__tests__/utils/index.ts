// Comprehensive testing utilities for Relife application
// Provides common testing functions, helpers, and utilities

export * from "./render-helpers";
export * from "./assertion-helpers";
export * from "./mock-helpers";
export * from "./data-builders";
export * from "./dom-helpers";
export * from "./async-helpers";
export * from "./performance-helpers";
export * from "./accessibility-helpers";
export * from "./mobile-helpers";
export * from "./audio-helpers";
export * from "./storage-helpers";
export * from "./animation-helpers";
export * from "./i18n-helpers";

// Re-export commonly used testing library functions for convenience
export {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
  getByRole,
  getByText,
  getByTestId,
  getByLabelText,
  queryByRole,
  queryByText,
  queryByTestId,
  queryByLabelText,
  findByRole,
  findByText,
  findByTestId,
  findByLabelText,
  act,
} from "@testing-library/react";

export { default as userEvent } from "@testing-library/user-event";

// Type definitions for common test scenarios
export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "premium" | "admin";
  subscription?: {
    tier: "free" | "premium" | "ultimate";
    status: "active" | "canceled" | "past_due";
    current_period_end: string;
  };
  preferences?: {
    theme: string;
    language: string;
    notifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TestAlarm {
  id: string;
  userId: string;
  time: string;
  label: string;
  enabled: boolean;
  isActive: boolean;
  days: number[];
  dayNames: (
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday"
  )[];
  voiceMood:
    | "gentle"
    | "motivational"
    | "drill-sergeant"
    | "zen"
    | "energetic"
    | "custom";
  sound: string;
  difficulty: "easy" | "medium" | "hard" | "nuclear";
  snoozeEnabled: boolean;
  snoozeInterval: number;
  snoozeCount: number;
  maxSnoozes: number;
  repeatOptions?: {
    type: "daily" | "weekly" | "monthly";
    interval: number;
    endDate?: string;
  };
  battleMode?: {
    enabled: boolean;
    difficulty: "easy" | "medium" | "hard";
    opponents: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface TestTheme {
  id: string;
  name: string;
  category: "light" | "dark" | "gaming" | "seasonal" | "custom";
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
  fonts?: {
    primary: string;
    secondary: string;
  };
  animations?: {
    enabled: boolean;
    speed: "slow" | "normal" | "fast";
  };
  premium: boolean;
  createdAt: string;
}

export interface TestBattle {
  id: string;
  participants: string[];
  startTime: string;
  endTime: string;
  status: "pending" | "active" | "completed" | "abandoned";
  difficulty: "easy" | "medium" | "hard";
  challenges: Array<{
    type: "math" | "pattern" | "memory" | "reaction";
    difficulty: number;
    timeLimit: number;
    completed: boolean;
    score: number;
  }>;
  winner?: string;
  rewards?: {
    xp: number;
    coins: number;
    badges: string[];
  };
  createdAt: string;
}

export interface TestVoiceClip {
  id: string;
  userId: string;
  name: string;
  audioUrl: string;
  duration: number;
  size: number;
  format: "mp3" | "wav" | "ogg";
  isProcessed: boolean;
  voiceSignature?: string;
  emotions?: Array<{
    emotion: "calm" | "energetic" | "motivational" | "stern";
    confidence: number;
  }>;
  createdAt: string;
}

// Common test constants
export const TEST_CONSTANTS = {
  // Time constants
  ANIMATION_TIMEOUT: 1000,
  API_TIMEOUT: 5000,
  USER_INTERACTION_DELAY: 100,
  DEBOUNCE_DELAY: 300,

  // Mock IDs
  MOCK_USER_ID: "test-user-12345",
  MOCK_ALARM_ID: "test-alarm-67890",
  MOCK_THEME_ID: "test-theme-abcde",
  MOCK_BATTLE_ID: "test-battle-fghij",

  // Test data limits
  MAX_ALARMS: 50,
  MAX_VOICE_CLIPS: 10,
  MAX_THEMES: 20,

  // File size limits
  MAX_AUDIO_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB

  // Premium limits
  FREE_ALARM_LIMIT: 5,
  PREMIUM_ALARM_LIMIT: 50,
  ULTIMATE_ALARM_LIMIT: 100,

  // Voice constants
  VOICE_SAMPLE_RATE: 44100,
  VOICE_BIT_DEPTH: 16,
  VOICE_MIN_DURATION: 3000, // 3 seconds
  VOICE_MAX_DURATION: 30000, // 30 seconds

  // Theme constants
  THEME_COLOR_COUNT: 6,
  CUSTOM_THEME_LIMIT: 10,

  // Battle constants
  BATTLE_MIN_PARTICIPANTS: 2,
  BATTLE_MAX_PARTICIPANTS: 8,
  BATTLE_TIME_LIMIT: 300000, // 5 minutes

  // Subscription tiers
  TIERS: {
    FREE: "free",
    PREMIUM: "premium",
    ULTIMATE: "ultimate",
  } as const,

  // Languages
  SUPPORTED_LANGUAGES: [
    "en",
    "es",
    "fr",
    "de",
    "it",
    "pt",
    "ru",
    "ar",
    "hi",
    "ja",
    "ko",
    "zh",
  ] as const,

  // Device platforms
  PLATFORMS: {
    WEB: "web",
    IOS: "ios",
    ANDROID: "android",
  } as const,

  // Test viewport sizes
  VIEWPORTS: {
    MOBILE: { width: 375, height: 667 },
    TABLET: { width: 768, height: 1024 },
    DESKTOP: { width: 1200, height: 800 },
    LARGE: { width: 1920, height: 1080 },
  } as const,
} as const;

// Environment detection utilities
export const _testEnv = {
  isCI: process.env.CI === "true",
  isVerbose: process.env.VERBOSE_TESTS === "true",
  isDebug: process.env.DEBUG_TESTS === "true",
  isMobile: process.env.TEST_MOBILE === "true",
  isVisual: process.env.TEST_VISUAL === "true",
  isPerformance: process.env.TEST_PERFORMANCE === "true",
  isAccessibility: process.env.TEST_A11Y === "true",
  platform: (process.env.TEST_PLATFORM as "web" | "ios" | "android") || "web",
};

// Console utilities for tests
export const _testConsole = {
  log: (message: string, ...args: any[]) => {
    if (testEnv.isVerbose) {
      console.log(`[TEST] ${message}`, ...args);
    }
  },

  debug: (message: string, ...args: any[]) => {
    if (testEnv.isDebug) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`[TEST WARN] ${message}`, ...args);
  },

  error: (message: string, ...args: any[]) => {
    console.error(`[TEST ERROR] ${message}`, ...args);
  },

  group: (label: string) => {
    if (testEnv.isVerbose) {
      console.group(`[TEST] ${label}`);
    }
  },

  groupEnd: () => {
    if (testEnv.isVerbose) {
      console.groupEnd();
    }
  },
};

// Test lifecycle helpers
export const _testLifecycle = {
  beforeEach: (cleanup?: () => void | Promise<void>) => {
    beforeEach(async () => {
      testConsole.debug("Test setup starting");
      if (cleanup) {
        await cleanup();
      }
      testConsole.debug("Test setup complete");
    });
  },

  afterEach: (cleanup?: () => void | Promise<void>) => {
    afterEach(async () => {
      testConsole.debug("Test cleanup starting");
      if (cleanup) {
        await cleanup();
      }
      testConsole.debug("Test cleanup complete");
    });
  },

  setupSuite: (name: string, setup?: () => void | Promise<void>) => {
    describe(name, () => {
      beforeAll(async () => {
        testConsole.group(`Setting up test suite: ${name}`);
        if (setup) {
          await setup();
        }
        testConsole.groupEnd();
      });
    });
  },
};
