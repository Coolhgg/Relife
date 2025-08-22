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
    ...overrides,
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
    ...overrides,
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
    ...overrides,
  };
};

// Mock Navigator APIs
export const mockNavigatorAPI = () => {
  // Mock geolocation
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn().mockImplementation(success => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.006,
            accuracy: 100,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
    writable: true,
  });

  // Mock clipboard
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue('test'),
    },
    writable: true,
  });

  // Mock user agent
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (compatible; Test/1.0)',
    writable: true,
  });

  // Mock online status
  Object.defineProperty(navigator, 'onLine', {
    value: true,
    writable: true,
  });

  // Mock permissions
  Object.defineProperty(navigator, 'permissions', {
    value: {
      query: vi.fn().mockResolvedValue({ state: 'granted' }),
    },
    writable: true,
  });

  // Mock vibration
  Object.defineProperty(navigator, 'vibrate', {
    value: vi.fn().mockReturnValue(true),
    writable: true,
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
        update: vi.fn(),
      }),
      getElement: vi.fn(),
    }),
    confirmCardPayment: vi.fn().mockResolvedValue({
      paymentIntent: {
        status: 'succeeded',
        id: 'pi_test_12345',
      },
    }),
    confirmCardSetup: vi.fn().mockResolvedValue({
      setupIntent: {
        status: 'succeeded',
        id: 'seti_test_12345',
      },
    }),
    createPaymentMethod: vi.fn().mockResolvedValue({
      paymentMethod: {
        id: 'pm_test_12345',
      },
    }),
    retrievePaymentIntent: vi.fn(),
  });
};

// Mock Local Storage
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
      clear: vi.fn(() => {
        Object.keys(storage).forEach(key => delete storage[key]);
      }),
      key: vi.fn((index: number) => Object.keys(storage)[index] || null),
      get length() {
        return Object.keys(storage).length;
      },
    },
    writable: true,
  });
};

// Mock Session Storage
export const mockSessionStorage = () => {
  const storage: Record<string, string> = {};

  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
      clear: vi.fn(() => {
        Object.keys(storage).forEach(key => delete storage[key]);
      }),
      key: vi.fn((index: number) => Object.keys(storage)[index] || null),
      get length() {
        return Object.keys(storage).length;
      },
    },
    writable: true,
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
        clear: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
      }),
    }),
    close: vi.fn(),
  };

  Object.defineProperty(window, 'indexedDB', {
    value: {
      open: vi.fn().mockReturnValue({
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: mockDB,
      }),
      deleteDatabase: vi.fn(),
    },
    writable: true,
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
    blob: vi.fn().mockResolvedValue(new Blob()),
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(callback => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    trigger: (entries: any[]) => callback(entries),
  }));

  // Mock MutationObserver
  global.MutationObserver = vi.fn().mockImplementation(callback => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn().mockReturnValue([]),
  }));

  // Mock URL
  global.URL = {
    createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
    revokeObjectURL: vi.fn(),
  } as any;

  // Mock performance
  Object.defineProperty(window, 'performance', {
    value: {
      now: vi.fn().mockReturnValue(Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn().mockReturnValue([]),
    },
    writable: true,
  });
};

// Mock Audio Context
export const mockAudioContext = () => {
  global.AudioContext = vi.fn().mockImplementation(() => ({
    createOscillator: vi.fn().mockReturnValue({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 440 },
    }),
    createGain: vi.fn().mockReturnValue({
      connect: vi.fn(),
      gain: { value: 1 },
    }),
    destination: {},
    currentTime: 0,
    close: vi.fn().mockResolvedValue(undefined),
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
    removeEventListener: vi.fn(),
  }));
};

// Mock Media APIs
export const mockMediaAPIs = () => {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: vi.fn().mockReturnValue([
          {
            stop: vi.fn(),
            enabled: true,
          },
        ]),
      }),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    },
    writable: true,
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
        exportKey: vi.fn(),
      },
    },
    writable: true,
  });
};

// Mock WebSocket API for real-time features
export const mockWebSocket = () => {
  const mockWS = {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1, // WebSocket.OPEN
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,
    url: '',
    protocol: '',
    extensions: '',
    bufferedAmount: 0,
    binaryType: 'blob' as BinaryType,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
    dispatchEvent: vi.fn(),
  };

  global.WebSocket = vi.fn().mockImplementation((url: string) => {
    mockWS.url = url;
    return mockWS;
  }) as any;

  // Add static constants
  (global.WebSocket as any).CONNECTING = 0;
  (global.WebSocket as any).OPEN = 1;
  (global.WebSocket as any).CLOSING = 2;
  (global.WebSocket as any).CLOSED = 3;

  return mockWS;
};

// Mock MediaRecorder API for voice recording
export const mockMediaRecorder = () => {
  const mockRecorder = {
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    state: 'inactive',
    mimeType: 'audio/webm;codecs=opus',
    stream: null,
    videoBitsPerSecond: 0,
    audioBitsPerSecond: 0,
    ondataavailable: null,
    onstart: null,
    onstop: null,
    onpause: null,
    onresume: null,
    onerror: null,
    dispatchEvent: vi.fn(),
    requestData: vi.fn(),
    isTypeSupported: vi.fn().mockReturnValue(true),
  };

  global.MediaRecorder = vi.fn().mockImplementation(() => mockRecorder) as any;
  (global.MediaRecorder as any).isTypeSupported = vi.fn().mockReturnValue(true);

  return mockRecorder;
};

// Mock File API for file uploads
export const mockFileAPI = () => {
  const createMockBlob = (data: any, type: string = 'audio/webm') => {
    const blob = {
      size: data.length || 1024,
      type,
      text: vi.fn().mockResolvedValue(data),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
      stream: vi.fn(),
      slice: vi.fn().mockReturnValue(blob),
    };
    return blob as Blob;
  };

  global.Blob = vi.fn().mockImplementation((data: any[], options: any) => {
    return createMockBlob(data, options?.type);
  }) as any;

  const createMockFile = (name: string, data: any, type: string) => {
    const file = Object.assign(createMockBlob(data, type), {
      name,
      lastModified: Date.now(),
      webkitRelativePath: '',
    });
    return file as File;
  };

  global.File = vi
    .fn()
    .mockImplementation((data: any[], name: string, options: any) => {
      return createMockFile(name, data, options?.type || 'text/plain');
    }) as any;

  return { createMockBlob, createMockFile };
};

// Mock Biometric APIs
export const mockBiometricAPIs = () => {
  // Mock Web Authentication API for biometric auth
  Object.defineProperty(navigator, 'credentials', {
    value: {
      create: vi.fn().mockResolvedValue({
        id: 'mock-credential-id',
        rawId: new ArrayBuffer(32),
        response: {
          clientDataJSON: new ArrayBuffer(32),
          attestationObject: new ArrayBuffer(32),
        },
        type: 'public-key',
      }),
      get: vi.fn().mockResolvedValue({
        id: 'mock-credential-id',
        rawId: new ArrayBuffer(32),
        response: {
          clientDataJSON: new ArrayBuffer(32),
          authenticatorData: new ArrayBuffer(32),
          signature: new ArrayBuffer(32),
          userHandle: new ArrayBuffer(16),
        },
        type: 'public-key',
      }),
      store: vi.fn().mockResolvedValue(undefined),
      preventSilentAccess: vi.fn().mockResolvedValue(undefined),
    },
    writable: true,
  });
};

// Mock sleep tracking APIs
export const mockSleepAPIs = () => {
  // Mock Accelerometer API (for movement detection)
  global.Accelerometer = vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    x: 0,
    y: 0,
    z: 9.8,
    timestamp: Date.now(),
  }));

  // Mock Ambient Light API
  global.AmbientLightSensor = vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    illuminance: 300,
  }));

  // Mock Heart Rate API (for wearable integration)
  Object.defineProperty(navigator, 'bluetooth', {
    value: {
      requestDevice: vi.fn().mockResolvedValue({
        id: 'mock-device-id',
        name: 'Mock Heart Rate Monitor',
        gatt: {
          connect: vi.fn().mockResolvedValue({
            getPrimaryService: vi.fn().mockResolvedValue({
              getCharacteristic: vi.fn().mockResolvedValue({
                readValue: vi.fn().mockResolvedValue(new DataView(new ArrayBuffer(2))),
                startNotifications: vi.fn(),
                stopNotifications: vi.fn(),
                addEventListener: vi.fn(),
              }),
            }),
          }),
        },
      }),
      getAvailability: vi.fn().mockResolvedValue(true),
    },
    writable: true,
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
  mockWebSocket();
  mockMediaRecorder();
  mockFileAPI();
  mockBiometricAPIs();
  mockSleepAPIs();
};

// Test Data Generators
export const generateTestAlarms = (count: number, userId: string): Alarm[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockAlarm({
      id: `test-alarm-${i}`,
      userId,
      time: `0${6 + i}:00`,
      label: `Test Alarm ${i + 1}`,
      enabled: i % 2 === 0, // Alternate enabled/disabled
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
      experience: Math.floor(Math.random() * 1000),
    })
  );
};

// Generate mock sleep session data
export const generateMockSleepSession = (date: Date, overrides: any = {}) => {
  const bedtime = new Date(date);
  bedtime.setHours(22 + Math.random() * 3, Math.random() * 60); // Random bedtime between 10-1 AM

  const wakeTime = new Date(bedtime);
  wakeTime.setTime(wakeTime.getTime() + (6 + Math.random() * 3) * 60 * 60 * 1000); // 6-9 hours later

  return {
    id: `sleep-${date.toISOString().split('T')[0]}`,
    userId: 'test-user-123',
    date: date.toISOString().split('T')[0],
    bedtime: bedtime.toISOString(),
    wakeTime: wakeTime.toISOString(),
    sleepDuration: wakeTime.getTime() - bedtime.getTime(),
    sleepStages: {
      light: Math.random() * 0.5 + 0.3, // 30-80%
      deep: Math.random() * 0.3 + 0.1, // 10-40%
      rem: Math.random() * 0.25 + 0.15, // 15-40%
      awake: Math.random() * 0.1, // 0-10%
    },
    sleepQuality: Math.floor(Math.random() * 40) + 60, // 60-100
    heartRate: {
      average: Math.floor(Math.random() * 20) + 50, // 50-70 bpm
      lowest: Math.floor(Math.random() * 10) + 45, // 45-55 bpm
    },
    movement: Math.random() * 50, // movement score
    environment: {
      temperature: Math.random() * 6 + 18, // 18-24°C
      humidity: Math.random() * 30 + 40, // 40-70%
      lightExposure: Math.random() * 10, // lux
      noise: Math.random() * 40, // dB
    },
    ...overrides,
  };
};

// Generate tournament data
export const generateMockTournament = (overrides: any = {}) => {
  return {
    id: `tournament-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Tournament',
    type: 'single_elimination',
    status: 'upcoming',
    participants: [],
    maxParticipants: 16,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    prizePool: { coins: 1000, trophies: [] },
    rounds: [],
    settings: { difficulty: 'medium', battleType: 'streak' },
    createdAt: new Date().toISOString(),
    creatorId: 'system',
    ...overrides,
  };
};

// Generate realistic audio blob for voice testing
export const generateMockAudioBlob = (duration: number = 5000) => {
  const arrayBuffer = new ArrayBuffer(duration * 16); // Simulate audio data
  const uint8Array = new Uint8Array(arrayBuffer);

  // Fill with mock audio data (sine wave pattern)
  for (let i = 0; i < uint8Array.length; i++) {
    uint8Array[i] = Math.sin(i * 0.1) * 127 + 128;
  }

  return new Blob([uint8Array], { type: 'audio/webm;codecs=opus' });
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

// Real-time feature test helpers
export const simulateWebSocketMessage = (mockWS: any, message: any) => {
  if (mockWS.onmessage) {
    mockWS.onmessage({ data: JSON.stringify(message) });
  }
};

export const simulateWebSocketConnection = (mockWS: any) => {
  mockWS.readyState = 1; // OPEN
  if (mockWS.onopen) {
    mockWS.onopen({});
  }
};

export const simulateWebSocketDisconnection = (mockWS: any) => {
  mockWS.readyState = 3; // CLOSED
  if (mockWS.onclose) {
    mockWS.onclose({ code: 1000, reason: 'Normal closure' });
  }
};

// Voice recording test helpers
export const simulateVoiceRecording = (mockRecorder: any, duration: number = 3000) => {
  mockRecorder.state = 'recording';
  if (mockRecorder.onstart) {
    mockRecorder.onstart({});
  }

  setTimeout(() => {
    const audioBlob = generateMockAudioBlob(duration);
    if (mockRecorder.ondataavailable) {
      mockRecorder.ondataavailable({ data: audioBlob });
    }

    mockRecorder.state = 'inactive';
    if (mockRecorder.onstop) {
      mockRecorder.onstop({});
    }
  }, 100);
};

// Sleep data generation for large datasets
export const generateLargeSleepDataset = (
  days: number,
  userId: string = 'test-user-123'
) => {
  const sessions = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Create realistic patterns (worse sleep on weekends, seasonal variations)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const seasonalFactor = Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 0.3;

    const session = generateMockSleepSession(date, {
      userId,
      sleepQuality: Math.max(
        40,
        Math.min(
          100,
          75 + (isWeekend ? -10 : 5) + seasonalFactor * 20 + (Math.random() - 0.5) * 20
        )
      ),
    });

    sessions.push(session);
  }

  return sessions;
};

// Battle progress simulation
export const simulateBattleProgress = (battleId: string, participants: string[]) => {
  return participants.map((userId, index) => ({
    userId,
    battleId,
    currentStreak: Math.floor(Math.random() * 10),
    longestStreak: Math.floor(Math.random() * 20) + 5,
    totalAlarms: Math.floor(Math.random() * 30) + 10,
    successfulAlarms: Math.floor(Math.random() * 25) + 8,
    averageWakeTime: new Date(Date.now() + (7 + index * 0.5) * 60 * 60 * 1000)
      .toTimeString()
      .slice(0, 5),
    lastActive: new Date(
      Date.now() - Math.random() * 12 * 60 * 60 * 1000
    ).toISOString(),
    score: Math.floor(Math.random() * 1000) + 100,
    rank: index + 1,
  }));
};
