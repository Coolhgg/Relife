/// <reference lib="dom" />
/**
 * Test Mocks and Utilities
 * 
 * Centralized mocks for integration testing
 */

import { vi } from 'vitest';
import type { User, Alarm, Battle, RewardSystem } from '../../src/types';

// Mock User Creation
export const createMockUser = (overrides: Partial<User> = {}): User => {
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    level: 1,
    experience: 0,
    subscriptionTier: 'free',
    premiumFeatures: [],
    subscriptionId: null,
    subscriptionStatus: null,
    trialEndsAt: null,
    achievements: [],
    friends: [],
    detectedPersona: 'struggling_sam',
    ...overrides
  };
};

// Mock Alarm Creation
export const createMockAlarm = (overrides: Partial<Alarm> = {}): Alarm => {
  return {
    id: 'test-alarm-123',
    userId: 'test-user-123',
    time: '07:00',
    label: 'Test Alarm',
    enabled: true,
    isActive: false,
    days: [1, 2, 3, 4, 5], // Weekdays
    dayNames: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    sound: 'default',
    volume: 0.8,
    vibrate: true,
    voiceMood: 'motivational',
    difficulty: 'medium',
    snoozeEnabled: true,
    snoozeInterval: 5,
    maxSnoozes: 3,
    snoozeCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastTriggered: undefined,
    completed: false,
    metadata: {},
    ...overrides
  };
};

// Mock Battle Creation
export const createMockBattle = (overrides: Partial<Battle> = {}): Battle => {
  return {
    id: 'test-battle-123',
    type: 'streak',
    participants: ['test-user-123'],
    creatorId: 'test-user-123',
    status: 'pending',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    settings: { duration: 'P7D', difficulty: 'medium' },
    createdAt: new Date().toISOString(),
    name: 'Test Battle',
    ...overrides
  };
};

// Mock Navigator APIs
export const mockNavigatorAPI = () => {
  // Mock geolocation
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 100,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    },
    writable: true
  });

  // Mock clipboard
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue('test')
    },
    writable: true
  });

  // Mock user agent
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (compatible; Test/1.0)',
    writable: true
  });

  // Mock online status
  Object.defineProperty(navigator, 'onLine', {
    value: true,
    writable: true
  });

  // Mock permissions
  Object.defineProperty(navigator, 'permissions', {
    value: {
      query: vi.fn().mockResolvedValue({ state: 'granted' })
    },
    writable: true
  });

  // Mock vibration
  Object.defineProperty(navigator, 'vibrate', {
    value: vi.fn().mockReturnValue(true),
    writable: true
  });
};

// Mock Stripe API
export const mockStripeAPI = () => {
  global.Stripe = vi.fn().mockResolvedValue({
    elements: vi.fn().mockReturnValue({
      create: vi.fn().mockReturnValue({
        mount: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn(),
        update: vi.fn()
      }),
      getElement: vi.fn()
    }),
    confirmCardPayment: vi.fn().mockResolvedValue({
      paymentIntent: {
        status: 'succeeded',
        id: 'pi_test_12345'
      }
    }),
    confirmCardSetup: vi.fn().mockResolvedValue({
      setupIntent: {
        status: 'succeeded',
        id: 'seti_test_12345'
      }
    }),
    createPaymentMethod: vi.fn().mockResolvedValue({
      paymentMethod: {
        id: 'pm_test_12345'
      }
    }),
    retrievePaymentIntent: vi.fn()
  });
};

// Mock Local Storage
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};
  
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete storage[key]; }),
      clear: vi.fn(() => { Object.keys(storage).forEach(key => delete storage[key]); }),
      key: vi.fn((index: number) => Object.keys(storage)[index] || null),
      get length() { return Object.keys(storage).length; }
    },
    writable: true
  });
};

// Mock Session Storage
export const mockSessionStorage = () => {
  const storage: Record<string, string> = {};
  
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete storage[key]; }),
      clear: vi.fn(() => { Object.keys(storage).forEach(key => delete storage[key]); }),
      key: vi.fn((index: number) => Object.keys(storage)[index] || null),
      get length() { return Object.keys(storage).length; }
    },
    writable: true
  });
};

// Mock IndexedDB
export const mockIndexedDB = () => {
  const mockDB = {
    transaction: vi.fn().mockReturnValue({
      objectStore: vi.fn().mockReturnValue({
        add: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
        get: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
        put: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
        delete: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
        clear: vi.fn().mockReturnValue({ onsuccess: null, onerror: null })
      })
    }),
    close: vi.fn()
  };

  Object.defineProperty(window, 'indexedDB', {
    value: {
      open: vi.fn().mockReturnValue({
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: mockDB
      }),
      deleteDatabase: vi.fn()
    },
    writable: true
  });
};

// Mock Web APIs
export const mockWebAPIs = () => {
  // Mock fetch
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
    blob: vi.fn().mockResolvedValue(new Blob())
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    trigger: (entries: any[]) => callback(entries)
  }));

  // Mock MutationObserver
  global.MutationObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn().mockReturnValue([])
  }));

  // Mock URL
  global.URL = {
    createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
    revokeObjectURL: vi.fn()
  } as any;

  // Mock performance
  Object.defineProperty(window, 'performance', {
    value: {
      now: vi.fn().mockReturnValue(Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn().mockReturnValue([])
    },
    writable: true
  });
};

// Mock Audio Context
export const mockAudioContext = () => {
  global.AudioContext = vi.fn().mockImplementation(() => ({
    createOscillator: vi.fn().mockReturnValue({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 440 }
    }),
    createGain: vi.fn().mockReturnValue({
      connect: vi.fn(),
      gain: { value: 1 }
    }),
    destination: {},
    currentTime: 0,
    close: vi.fn().mockResolvedValue(undefined)
  }));

  // Mock HTMLAudioElement
  global.HTMLAudioElement = vi.fn().mockImplementation(() => ({
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    load: vi.fn(),
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
};

// Mock Media APIs
export const mockMediaAPIs = () => {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: vi.fn().mockReturnValue([{
          stop: vi.fn(),
          enabled: true
        }])
      }),
      enumerateDevices: vi.fn().mockResolvedValue([])
    },
    writable: true
  });
};

// Mock Crypto API
export const mockCrypto = () => {
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: vi.fn((arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
      subtle: {
        digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
        encrypt: vi.fn(),
        decrypt: vi.fn(),
        generateKey: vi.fn(),
        importKey: vi.fn(),
        exportKey: vi.fn()
      }
    },
    writable: true
  });
};

// Setup all mocks
export const setupAllMocks = () => {
  mockNavigatorAPI();
  mockLocalStorage();
  mockSessionStorage();
  mockIndexedDB();
  mockWebAPIs();
  mockAudioContext();
  mockMediaAPIs();
  mockCrypto();
  mockStripeAPI();
};

// Test Data Generators
export const generateTestAlarms = (count: number, userId: string): Alarm[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockAlarm({
      id: `test-alarm-${i}`,
      userId,
      time: `0${6 + i}:00`,
      label: `Test Alarm ${i + 1}`,
      enabled: i % 2 === 0 // Alternate enabled/disabled
    })
  );
};

export const generateTestUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({
      id: `test-user-${i}`,
      email: `user${i}@example.com`,
      name: `Test User ${i + 1}`,
      level: Math.floor(Math.random() * 20) + 1,
      experience: Math.floor(Math.random() * 1000)
    })
  );
};

// Test Assertions Helpers
export const expectAlarmToBeVisible = (alarmLabel: string, screen: any) => {
  expect(screen.getByText(alarmLabel)).toBeInTheDocument();
};

export const expectErrorMessage = (screen: any) => {
  const errorElement = screen.queryByText(/error|failed|something went wrong/i);
  expect(errorElement).toBeInTheDocument();
};

export const expectLoadingState = (screen: any) => {
  const loadingElement = screen.queryByText(/loading|wait/i);
  expect(loadingElement).toBeInTheDocument();
};

// Performance Testing Helpers
export const measurePerformance = async (fn: () => Promise<void>) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

export const expectPerformanceWithin = (duration: number, maxMs: number) => {
  expect(duration).toBeLessThan(maxMs);
};