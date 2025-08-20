// PostHog analytics mock for testing
import { vi } from "vitest";

/**
 * Comprehensive PostHog mock for testing analytics functionality
 * Provides all methods used in the application with proper vitest mocks
 */

const mockPostHog = {
  // Initialization
  init: vi.fn((apiKey: string, options?: any) => {
    console.log("📊 Mock PostHog initialized");
    return mockPostHog;
  }),

  // User identification
  identify: vi.fn((userId: string, properties?: any) => {
    console.log(`👤 Mock PostHog identify: ${userId}`, properties);
  }),

  // Event tracking
  capture: vi.fn((event: string, properties?: any) => {
    console.log(`📈 Mock PostHog capture: ${event}`, properties);
  }),

  // User properties
  people: {
    set: vi.fn((properties: any) => {
      console.log("👥 Mock PostHog people.set", properties);
    }),
    increment: vi.fn((properties: any) => {
      console.log("📊 Mock PostHog people.increment", properties);
    }),
    delete: vi.fn(),
    union: vi.fn(),
  },

  // Group analytics
  group: vi.fn((groupType: string, groupKey: string, properties?: any) => {
    console.log(`👥 Mock PostHog group: ${groupType}:${groupKey}`, properties);
  }),

  // Alias user
  alias: vi.fn((alias: string) => {
    console.log(`🔗 Mock PostHog alias: ${alias}`);
  }),

  // Reset user
  reset: vi.fn(() => {
    console.log("🔄 Mock PostHog reset");
  }),

  // Feature flags
  getFeatureFlag: vi.fn((flag: string) => {
    console.log(`🚩 Mock PostHog getFeatureFlag: ${flag}`);
    // Return different values for different flags for testing
    if (flag === "premium-features") return true;
    if (flag === "new-ui") return false;
    if (flag === "beta-voice") return true;
    return false;
  }),

  isFeatureEnabled: vi.fn((flag: string) => {
    console.log(`🚩 Mock PostHog isFeatureEnabled: ${flag}`);
    return mockPostHog.getFeatureFlag(flag);
  }),

  onFeatureFlags: vi.fn((callback: (flags: string[]) => void) => {
    console.log("🚩 Mock PostHog onFeatureFlags");
    // Simulate feature flags loading
    setTimeout(() => {
      callback(["premium-features", "beta-voice"]);
    }, 100);
  }),

  // Session recording
  startSessionRecording: vi.fn(() => {
    console.log("🎥 Mock PostHog startSessionRecording");
  }),

  stopSessionRecording: vi.fn(() => {
    console.log("🎥 Mock PostHog stopSessionRecording");
  }),

  // Page tracking
  register: vi.fn((properties: any) => {
    console.log("📝 Mock PostHog register", properties);
  }),

  unregister: vi.fn((property: string) => {
    console.log(`📝 Mock PostHog unregister: ${property}`);
  }),

  // Opt out
  opt_out_capturing: vi.fn(() => {
    console.log("🚫 Mock PostHog opt_out_capturing");
  }),

  opt_in_capturing: vi.fn(() => {
    console.log("✅ Mock PostHog opt_in_capturing");
  }),

  has_opted_out_capturing: vi.fn(() => false),

  // Advanced features
  get_property: vi.fn((property: string) => {
    console.log(`🔍 Mock PostHog get_property: ${property}`);
    return null;
  }),

  get_distinct_id: vi.fn(() => {
    return "mock-distinct-id-12345";
  }),

  get_session_id: vi.fn(() => {
    return "mock-session-id-67890";
  }),

  // Surveys
  getSurveys: vi.fn(() => {
    console.log("📋 Mock PostHog getSurveys");
    return Promise.resolve([]);
  }),

  // Experiments
  getActiveMatchingSurveys: vi.fn(() => {
    console.log("🧪 Mock PostHog getActiveMatchingSurveys");
    return [];
  }),

  // Debug and development
  debug: vi.fn((enable?: boolean) => {
    console.log(`🐛 Mock PostHog debug: ${enable}`);
  }),

  // Configuration
  set_config: vi.fn((config: any) => {
    console.log("⚙️ Mock PostHog set_config", config);
  }),

  // Mobile specific
  ready: vi.fn((callback: () => void) => {
    console.log("📱 Mock PostHog ready");
    setTimeout(callback, 10);
  }),

  // Cookie management
  get_cookie: vi.fn((name: string) => {
    console.log(`🍪 Mock PostHog get_cookie: ${name}`);
    return null;
  }),

  persistence: {
    remove: vi.fn(),
    clear: vi.fn(),
  },

  // Internal methods for testing
  _mockReset: vi.fn(() => {
    // Reset all mocks for clean testing
    Object.values(mockPostHog).forEach((value) => {
      if (typeof value === "function" && value.mockClear) {
        value.mockClear();
      }
    });
    if (mockPostHog.people) {
      Object.values(mockPostHog.people).forEach((value) => {
        if (typeof value === "function" && value.mockClear) {
          value.mockClear();
        }
      });
    }
  }),

  _mockSetFeatureFlag: vi.fn((flag: string, value: boolean) => {
    mockPostHog.getFeatureFlag.mockImplementation((f: string) => {
      if (f === flag) return value;
      return mockPostHog.getFeatureFlag.getMockImplementation()?.(f) || false;
    });
  }),
};

// Create a factory function for creating fresh mocks
export const _createMockPostHog = () => ({
  ...mockPostHog,
  people: { ...mockPostHog.people },
  persistence: { ...mockPostHog.persistence },
});

export default mockPostHog;
