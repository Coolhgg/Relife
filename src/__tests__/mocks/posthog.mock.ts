// PostHog analytics mock for testing

/**
 * Comprehensive PostHog mock for testing analytics functionality
 * Provides all methods used in the application with proper jest mocks
 */

const mockPostHog = {
  // Initialization
  init: jest.fn((apiKey: string, options?: any) => {
    console.log('📊 Mock PostHog initialized');
    return mockPostHog;
  }),

  // User identification
  identify: jest.fn((userId: string, properties?: any) => {
    console.log(`👤 Mock PostHog identify: ${userId}`, properties);
  }),

  // Event tracking
  capture: jest.fn((event: string, properties?: any) => {
    console.log(`📈 Mock PostHog capture: ${event}`, properties);
  }),

  // User properties
  people: {
    set: jest.fn((properties: any) => {
      console.log('👥 Mock PostHog people.set', properties);
    }),
    increment: jest.fn((properties: any) => {
      console.log('📊 Mock PostHog people.increment', properties);
    }),
    delete: jest.fn(),
    union: jest.fn(),
  },

  // Group analytics
  group: jest.fn((groupType: string, groupKey: string, properties?: any) => {
    console.log(`👥 Mock PostHog group: ${groupType}:${groupKey}`, properties);
  }),

  // Alias user
  alias: jest.fn((alias: string) => {
    console.log(`🔗 Mock PostHog alias: ${alias}`);
  }),

  // Reset user
  reset: jest.fn(() => {
    console.log('🔄 Mock PostHog reset');
  }),

  // Feature flags
  getFeatureFlag: jest.fn((flag: string) => {
    console.log(`🚩 Mock PostHog getFeatureFlag: ${flag}`);
    // Return different values for different flags for testing
    if (flag === 'premium-features') return true;
    if (flag === 'new-ui') return false;
    if (flag === 'beta-voice') return true;
    return false;
  }),

  isFeatureEnabled: jest.fn((flag: string) => {
    console.log(`🚩 Mock PostHog isFeatureEnabled: ${flag}`);
    return mockPostHog.getFeatureFlag(flag);
  }),

  onFeatureFlags: jest.fn((callback: (flags: string[]) => void) => {
    console.log('🚩 Mock PostHog onFeatureFlags');
    // Simulate feature flags loading
    setTimeout(() => {
      callback(['premium-features', 'beta-voice']);
    }, 100);
  }),

  // Session recording
  startSessionRecording: jest.fn(() => {
    console.log('🎥 Mock PostHog startSessionRecording');
  }),

  stopSessionRecording: jest.fn(() => {
    console.log('🎥 Mock PostHog stopSessionRecording');
  }),

  // Page tracking
  register: jest.fn((properties: any) => {
    console.log('📝 Mock PostHog register', properties);
  }),

  unregister: jest.fn((property: string) => {
    console.log(`📝 Mock PostHog unregister: ${property}`);
  }),

  // Opt out
  opt_out_capturing: jest.fn(() => {
    console.log('🚫 Mock PostHog opt_out_capturing');
  }),

  opt_in_capturing: jest.fn(() => {
    console.log('✅ Mock PostHog opt_in_capturing');
  }),

  has_opted_out_capturing: jest.fn(() => false),

  // Advanced features
  get_property: jest.fn((property: string) => {
    console.log(`🔍 Mock PostHog get_property: ${property}`);
    return null;
  }),

  get_distinct_id: jest.fn(() => {
    return 'mock-distinct-id-12345';
  }),

  get_session_id: jest.fn(() => {
    return 'mock-session-id-67890';
  }),

  // Surveys
  getSurveys: jest.fn(() => {
    console.log('📋 Mock PostHog getSurveys');
    return Promise.resolve([]);
  }),

  // Experiments
  getActiveMatchingSurveys: jest.fn(() => {
    console.log('🧪 Mock PostHog getActiveMatchingSurveys');
    return [];
  }),

  // Debug and development
  debug: jest.fn((enable?: boolean) => {
    console.log(`🐛 Mock PostHog debug: ${enable}`);
  }),

  // Configuration
  set_config: jest.fn((config: any) => {
    console.log('⚙️ Mock PostHog set_config', config);
  }),

  // Mobile specific
  ready: jest.fn((callback: () => void) => {
    console.log('📱 Mock PostHog ready');
    setTimeout(callback, 10);
  }),

  // Cookie management
  get_cookie: jest.fn((name: string) => {
    console.log(`🍪 Mock PostHog get_cookie: ${name}`);
    return null;
  }),

  persistence: {
    remove: jest.fn(),
    clear: jest.fn(),
  },

  // Internal methods for testing
  _mockReset: jest.fn(() => {
    // Reset all mocks for clean testing
    Object.values(mockPostHog).forEach(value => {
      if (typeof value === 'function' && value.mockClear) {
        value.mockClear();
      }
    });
    if (mockPostHog.people) {
      Object.values(mockPostHog.people).forEach(value => {
        if (typeof value === 'function' && value.mockClear) {
          value.mockClear();
        }
      });
    }
  }),

  _mockSetFeatureFlag: jest.fn((flag: string, value: boolean) => {
    mockPostHog.getFeatureFlag.mockImplementation((f: string) => {
      if (f === flag) return value;
      return mockPostHog.getFeatureFlag.getMockImplementation()?.(f) || false;
    });
  }),
};

// Create a factory function for creating fresh mocks
export const createMockPostHog = () => ({
  ...mockPostHog,
  people: { ...mockPostHog.people },
  persistence: { ...mockPostHog.persistence },
});

export default mockPostHog;
