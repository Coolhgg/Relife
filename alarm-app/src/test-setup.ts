// Jest test setup and configuration
import '@testing-library/jest-dom';

// Mock Web APIs that may not be available in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Intersection Observer
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock Notification API
global.Notification = class Notification {
  static permission = 'default';
  static requestPermission = jest.fn().mockResolvedValue('granted');
  
  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    this.body = options?.body || '';
    this.icon = options?.icon || '';
    this.tag = options?.tag || '';
  }
  
  title: string;
  body: string;
  icon: string;
  tag: string;
  close = jest.fn();
} as any;

// Mock Service Worker Registration
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: {
        postMessage: jest.fn()
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      unregister: jest.fn().mockResolvedValue(true)
    }),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: {
        postMessage: jest.fn()
      },
      sync: {
        register: jest.fn().mockResolvedValue(undefined)
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      unregister: jest.fn().mockResolvedValue(true)
    }),
    controller: {
      postMessage: jest.fn()
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  writable: true
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Web Speech API
global.SpeechRecognition = class SpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  
  start = jest.fn();
  stop = jest.fn();
  abort = jest.fn();
  
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null = null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null = null;
  
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
};

global.webkitSpeechRecognition = global.SpeechRecognition;

// Mock Audio API
global.Audio = class Audio {
  constructor(src?: string) {
    this.src = src || '';
  }
  
  src: string;
  volume = 1;
  currentTime = 0;
  duration = 0;
  paused = true;
  
  play = jest.fn().mockResolvedValue(undefined);
  pause = jest.fn();
  load = jest.fn();
  
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
} as any;

// Mock AudioContext
global.AudioContext = class AudioContext {
  state = 'running';
  sampleRate = 44100;
  currentTime = 0;
  destination = {};
  
  createOscillator = jest.fn().mockReturnValue({
    type: 'sine',
    frequency: { value: 440 },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  });
  
  createGain = jest.fn().mockReturnValue({
    gain: { value: 1 },
    connect: jest.fn(),
    disconnect: jest.fn()
  });
  
  resume = jest.fn().mockResolvedValue(undefined);
  suspend = jest.fn().mockResolvedValue(undefined);
  close = jest.fn().mockResolvedValue(undefined);
  
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
} as any;

// Mock Vibration API
Object.defineProperty(navigator, 'vibrate', {
  value: jest.fn().mockReturnValue(true),
  writable: true
});

// Mock Geolocation API
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn()
  },
  writable: true
});

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn().mockReturnValue('mock-uuid-1234'),
    getRandomValues: jest.fn().mockImplementation((array: any) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    })
  }
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn().mockReturnValue(Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn().mockReturnValue([]),
    getEntriesByType: jest.fn().mockReturnValue([]),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn()
  }
});

// Mock URL constructor for service workers
if (!global.URL.createObjectURL) {
  global.URL.createObjectURL = jest.fn().mockReturnValue('mock-object-url');
  global.URL.revokeObjectURL = jest.fn();
}

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
  blob: jest.fn().mockResolvedValue(new Blob())
});

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Override console.error and console.warn to ignore React/testing-library warnings
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
     args[0].includes('Warning: React.createFactory is deprecated') ||
     args[0].includes('Warning: componentWillReceiveProps'))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: componentWillMount') ||
     args[0].includes('Warning: componentWillReceiveProps'))
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Test utilities
export const testUtils = {
  // Mock alarm data
  mockAlarm: {
    id: 'test-alarm-1',
    time: '07:00',
    label: 'Morning Alarm',
    days: [1, 2, 3, 4, 5],
    enabled: true,
    voiceMood: 'motivational' as const,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    lastTriggered: null
  },
  
  // Mock app state
  mockAppState: {
    user: null,
    alarms: [],
    activeAlarm: null,
    permissions: {
      notifications: { granted: true },
      microphone: { granted: true }
    },
    isOnboarding: false,
    currentView: 'dashboard' as const
  },
  
  // Async test helper
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock event helper
  createMockEvent: (type: string, properties: Record<string, any> = {}) => ({
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: { value: '' },
    ...properties
  }),
  
  // Storage helpers
  mockLocalStorage: localStorageMock,
  mockSessionStorage: sessionStorageMock,
  
  // Clear all mocks
  clearAllMocks: () => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  }
};

// Setup and teardown
beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  
  // Reset navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    value: true,
    writable: true
  });
});

afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();
});