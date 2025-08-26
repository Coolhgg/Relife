/// <reference lib="dom" />
import { MockDataRecord, MockDataStore } from '../../types/common-types';

import { vi } from 'vitest';
// After environment setup - runs after each test environment is created
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';
import ResizeObserver from 'resize-observer-polyfill';

/**
 * Enhanced after-environment setup with comprehensive polyfills and configurations
 */

// Configure React Testing Library for optimal test performance
configure({
  testIdAttribute: 'data-testid',
  // Reduce timeout for faster test feedback
  asyncUtilTimeout: 2000,
  // Configure DOM cleanup
  computedStyleSupportsPseudoElements: true,
});

// Enhanced global polyfills for comprehensive browser API coverage
if (typeof global !== 'undefined') {
  // Text encoding polyfills
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;

  // Resize Observer polyfill
  global.ResizeObserver = ResizeObserver;

  // Enhanced URL polyfill
  if (!global.URL.createObjectURL) {
    global.URL.createObjectURL = jest.fn(() => 'mocked-object-url');
    global.URL.revokeObjectURL = jest.fn();
  }

  // File and FileReader polyfills for upload testing
  global.File = class MockFile {
    constructor(
      public chunks: BlobPart[],
      public name: string,
      public options?: FilePropertyBag
    ) {}
    get size() {
      return this.chunks.reduce((acc, chunk) => acc + (chunk as unknown).length, 0);
    }
    get type() {
      return this.options?.type || '';
    }
    get lastModified() {
      return this.options?.lastModified || Date.now();
    }
  } as unknown;

  global.FileReader = class MockFileReader {
    result: string | ArrayBuffer | null = null;
    _error: any = null;
    readyState = 0;
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null =
      null;
    onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null =
      null;

    readAsText(file: Blob) {
      this.readyState = 1;
      setTimeout(() => {
        this.result = 'mocked file content';
        this.readyState = 2;
        this.onload?.(new ProgressEvent('load'));
        this.onloadend?.(new ProgressEvent('loadend'));
      }, 10);
    }

    readAsDataURL(file: Blob) {
      this.readyState = 1;
      setTimeout(() => {
        this.result = 'data:text/plain;base64,bW9ja2VkIGZpbGUgY29udGVudA==';
        this.readyState = 2;
        this.onload?.(new ProgressEvent('load'));
        this.onloadend?.(new ProgressEvent('loadend'));
      }, 10);
    }

    readAsArrayBuffer(file: Blob) {
      this.readyState = 1;
      setTimeout(() => {
        this.result = new ArrayBuffer(8);
        this.readyState = 2;
        this.onload?.(new ProgressEvent('load'));
        this.onloadend?.(new ProgressEvent('loadend'));
      }, 10);
    }

    abort() {
      this.readyState = 2;
      this.onabort?.(new ProgressEvent('abort'));
    }

    addEventListener(type: string, listener: unknown) {
      this[`on${type}` as keyof this] = listener;
    }

    removeEventListener() {}
    dispatchEvent() {
      return true;
    }
  } as unknown;

  // Blob polyfill
  global.Blob = class MockBlob {
    constructor(
      public parts: BlobPart[] = [],
      public options: BlobPropertyBag = {}
    ) {}
    get size() {
      return this.parts.reduce((acc, part) => acc + (part as unknown).length, 0);
    }
    get type() {
      return this.options.type || '';
    }
    slice() {
      return new MockBlob();
    }
    stream() {
      return new ReadableStream();
    }
    text() {
      return Promise.resolve('mocked blob text');
    }
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(8));
    }
  } as unknown;

  // FormData polyfill for file upload testing
  global.FormData = class MockFormData {
    private data = new Map<string, any>();

    append(name: string, value: unknown, filename?: string) {
      this.data.set(name, { value, filename });
    }

    set(name: string, value: unknown, filename?: string) {
      this.data.set(name, { value, filename });
    }

    get(name: string) {
      return this.data.get(name)?.value;
    }

    getAll(name: string) {
      return this.data.has(name) ? [this.data.get(name).value] : [];
    }

    has(name: string) {
      return this.data.has(name);
    }

    delete(name: string) {
      this.data.delete(name);
    }

    keys() {
      return this.data.keys();
    }

    values() {
      return Array.from(this.data.values()).map(item => item.value);
    }

    entries() {
      return Array.from(this.data.entries()).map(([key, item]) => [key, item.value]);
    }

    forEach(callback: unknown) {
      this.data.forEach((item, key) => callback(item.value, key, this));
    }
  } as unknown;

  // Enhanced crypto polyfill for secure operations testing
  if (!global.crypto) {
    global.crypto = {
      getRandomValues: (arr: unknown) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
      randomUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      },
      subtle: {
        digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
        encrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
        decrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
        sign: jest.fn(() => Promise.resolve(new ArrayBuffer(64))),
        verify: jest.fn(() => Promise.resolve(true)),
        generateKey: jest.fn(() => Promise.resolve({})),
        importKey: jest.fn(() => Promise.resolve({})),
        exportKey: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
        deriveBits: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
        deriveKey: jest.fn(() => Promise.resolve({})),
        wrapKey: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
        unwrapKey: jest.fn(() => Promise.resolve({})),
      },
    } as unknown;
  }

  // Navigator polyfills for PWA testing
  Object.defineProperty(global.navigator, 'serviceWorker', {
    value: {
      register: jest.fn(() =>
        Promise.resolve({
          installing: null,
          waiting: null,
          active: {
            postMessage: jest.fn(),
            state: 'activated',
          },
          update: jest.fn(() => Promise.resolve()),
          unregister: jest.fn(() => Promise.resolve(true)),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })
      ),
      ready: Promise.resolve({
        installing: null,
        waiting: null,
        active: {
          postMessage: jest.fn(),
          state: 'activated',
        },
        update: jest.fn(() => Promise.resolve()),
        unregister: jest.fn(() => Promise.resolve(true)),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }),
      controller: null,
      getRegistration: jest.fn(() => Promise.resolve(undefined)),
      getRegistrations: jest.fn(() => Promise.resolve([])),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    writable: true,
    configurable: true,
  });

  // Enhanced geolocation mock for location-based features
  Object.defineProperty(global.navigator, 'geolocation', {
    value: {
      getCurrentPosition: jest.fn((success, _error) => {
        const position = {
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        };
        success(position);
      }),
      watchPosition: jest.fn(() => 1),
      clearWatch: jest.fn(),
    },
    writable: true,
    configurable: true,
  });

  // Device memory mock for performance testing
  Object.defineProperty(global.navigator, 'deviceMemory', {
    value: 8,
    writable: true,
    configurable: true,
  });

  // Connection API mock for network testing
  Object.defineProperty(global.navigator, 'connection', {
    value: {
      effectiveType: '4g',
      rtt: 100,
      downlink: 10,
      saveData: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    writable: true,
    configurable: true,
  });

  // Share API mock for PWA testing
  Object.defineProperty(global.navigator, 'share', {
    value: jest.fn(() => Promise.resolve()),
    writable: true,
    configurable: true,
  });

  // Permissions API mock
  Object.defineProperty(global.navigator, 'permissions', {
    value: {
      query: jest.fn(() =>
        Promise.resolve({
          state: 'granted',
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })
      ),
    },
    writable: true,
    configurable: true,
  });

  // Vibration API mock for haptics testing
  Object.defineProperty(global.navigator, 'vibrate', {
    value: jest.fn(() => true),
    writable: true,
    configurable: true,
  });
}

// Enhanced window polyfills
if (typeof window !== 'undefined') {
  // Notification API mock for push notification testing
  (window as unknown).Notification = class MockNotification {
    static permission = 'granted';
    static requestPermission = jest.fn(() => Promise.resolve('granted'));

    title: string;
    options: NotificationOptions;
    onclick: any = null;
    onclose: any = null;
    onerror: any = null;
    onshow: any = null;

    constructor(title: string, options: NotificationOptions = {}) {
      this.title = title;
      this.options = options;
      setTimeout(() => this.onshow?.(), 0);
    }

    close() {
      setTimeout(() => this.onclose?.(), 0);
    }

    addEventListener(type: string, listener: unknown) {
      this[`on${type}` as keyof this] = listener;
    }

    removeEventListener() {}
    dispatchEvent() {
      return true;
    }
  };

  // Screen Wake Lock API mock
  (window.navigator as unknown).wakeLock = {
    request: jest.fn(() =>
      Promise.resolve({
        type: 'screen',
        released: false,
        release: jest.fn(() => Promise.resolve()),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })
    ),
  };

  // Battery API mock
  (window.navigator as unknown).getBattery = jest.fn(() =>
    Promise.resolve({
      charging: true,
      chargingTime: 0,
      dischargingTime: Infinity,
      level: 1.0,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })
  );

  // Page Visibility API mock
  Object.defineProperty(document, 'visibilityState', {
    value: 'visible',
    writable: true,
    configurable: true,
  });

  Object.defineProperty(document, 'hidden', {
    value: false,
    writable: true,
    configurable: true,
  });

  // Fullscreen API mock
  document.requestFullscreen = jest.fn(() => Promise.resolve());
  document.exitFullscreen = jest.fn(() => Promise.resolve());
  Object.defineProperty(document, 'fullscreenElement', {
    value: null,
    writable: true,
    configurable: true,
  });

  // Clipboard API mock
  Object.defineProperty(window.navigator, 'clipboard', {
    value: {
      writeText: jest.fn(() => Promise.resolve()),
      readText: jest.fn(() => Promise.resolve('mocked clipboard text')),
      write: jest.fn(() => Promise.resolve()),
      read: jest.fn(() => Promise.resolve([])),
    },
    writable: true,
    configurable: true,
  });

  // Enhanced media queries mock
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query.includes('max-width: 768px') ? true : false, // Default to mobile
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));

  // Web Audio API mock for sound testing
  (window as unknown).AudioContext = class MockAudioContext {
    state = 'running';
    sampleRate = 44100;
    currentTime = 0;
    destination = { connect: jest.fn(), disconnect: jest.fn() };

    createOscillator() {
      return {
        connect: jest.fn(),
        disconnect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { value: 440 },
        type: 'sine',
      };
    }

    createGain() {
      return {
        connect: jest.fn(),
        disconnect: jest.fn(),
        gain: { value: 1 },
      };
    }

    createAnalyser() {
      return {
        connect: jest.fn(),
        disconnect: jest.fn(),
        getByteFrequencyData: jest.fn(),
        getByteTimeDomainData: jest.fn(),
      };
    }

    close() {
      return Promise.resolve();
    }

    resume() {
      return Promise.resolve();
    }

    suspend() {
      return Promise.resolve();
    }
  };

  // Payment Request API mock
  (window as unknown).PaymentRequest = class MockPaymentRequest {
    constructor(
      public methodData: MockDataRecord[],
      public details: any,
      public options?: any
    ) {}

    show() {
      return Promise.resolve({
        requestId: 'mock-request-id',
        methodName: 'https://example.com/pay',
        details: {},
        complete: jest.fn(() => Promise.resolve()),
      });
    }

    abort() {
      return Promise.resolve();
    }

    canMakePayment() {
      return Promise.resolve(true);
    }

    addEventListener() {}
    removeEventListener() {}
  };
}

// Enhanced performance measurement for testing
const mockPerformance = {
  ...performance,
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  now: jest.fn(() => Date.now()),
  timeOrigin: Date.now(),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
  configurable: true,
});

// Console customization for cleaner test output
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string') {
    // Suppress known warnings in test environment
    if (
      message.includes('Warning: ReactDOM.render is deprecated') ||
      message.includes('Warning: ComponentWillMount has been renamed') ||
      message.includes('Warning: componentWillReceiveProps has been renamed') ||
      message.includes('Warning: componentWillUpdate has been renamed')
    ) {
      return;
    }
  }
  originalWarn.apply(console, args);
};

// Enhanced Service Architecture Setup
// Initialize mock services for testing with the new dependency injection patterns
if (global && typeof global === 'object') {
  // Import enhanced service mocks
  let enhancedServiceMocks: any;
  try {
    enhancedServiceMocks = require('../mocks/enhanced-service-mocks');

    // Create a global service container for tests
    global.__ENHANCED_SERVICE_CONTAINER__ =
      enhancedServiceMocks.createMockServiceContainer();

    // Initialize services by default for tests
    enhancedServiceMocks
      .initializeAllMockServices(global.__ENHANCED_SERVICE_CONTAINER__)
      .then(() => {
        console.log('🔧 Enhanced service architecture initialized');
      })
      .catch((_error: unknown) => {
        console.warn('⚠️ Enhanced service initialization failed:', _error);
      });
  } catch (_error) {
    // Enhanced services not available in this test run
    console.log('⚠️ Enhanced services not available, using legacy mocks');
  }

  // Setup global test utilities for service management
  global.__RESET_ENHANCED_SERVICES__ = async () => {
    if (enhancedServiceMocks && global.__ENHANCED_SERVICE_CONTAINER__) {
      await enhancedServiceMocks.resetAllMockServices(
        global.__ENHANCED_SERVICE_CONTAINER__
      );
      await enhancedServiceMocks.initializeAllMockServices(
        global.__ENHANCED_SERVICE_CONTAINER__
      );
    }
  };
}

console.log('🔧 Enhanced after-environment setup complete');
console.log('📱 Mobile simulation enabled');
console.log('🌐 PWA APIs mocked');
console.log('🔊 Audio APIs mocked');
console.log('💳 Payment APIs mocked');
console.log('📋 Clipboard API mocked');
console.log('🔐 Crypto APIs mocked');
console.log('⚡ Enhanced service architecture ready');
