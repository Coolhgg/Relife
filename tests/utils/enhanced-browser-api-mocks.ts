/// <reference lib="dom" />
/**
 * Enhanced Browser API Mocks for Integration Tests
 * 
 * Comprehensive mocks for critical browser APIs needed for alarm app functionality:
 * - Notification API
 * - Push Manager API  
 * - Service Worker API
 * - Wake Lock API
 * - Background Sync API
 * - Enhanced Speech Recognition
 */

import { vi } from 'vitest';

// Types for mock state management
interface MockNotificationState {
  permissions: {[key: string]: NotificationPermission};
  notifications: MockNotification[];
  clickHandlers: {[key: string]: () => void};
}

interface MockServiceWorkerState {
  registrations: MockServiceWorkerRegistration[];
  activeWorker: MockServiceWorker | null;
  messageHandlers: {[key: string]: (event: MessageEvent) => void};
}

interface MockPushState {
  subscriptions: MockPushSubscription[];
  pushMessages: any[];
}

// Mock state storage
const mockStates = {
  notification: {
    permissions: { default: 'default' as NotificationPermission },
    notifications: [],
    clickHandlers: {}
  } as MockNotificationState,
  serviceWorker: {
    registrations: [],
    activeWorker: null,
    messageHandlers: {}
  } as MockServiceWorkerState,
  push: {
    subscriptions: [],
    pushMessages: []
  } as MockPushState
};

// Mock Notification interface
interface MockNotification extends EventTarget {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  onclick: ((this: Notification, ev: Event) => any) | null;
  onclose: ((this: Notification, ev: Event) => any) | null;
  onerror: ((this: Notification, ev: Event) => any) | null;
  onshow: ((this: Notification, ev: Event) => any) | null;
  close(): void;
}

// Mock ServiceWorker interface
interface MockServiceWorker extends EventTarget {
  scriptURL: string;
  state: ServiceWorkerState;
  onstatechange: ((this: ServiceWorker, ev: Event) => any) | null;
  postMessage(message: any, transfer?: Transferable[]): void;
}

// Mock ServiceWorkerRegistration interface
interface MockServiceWorkerRegistration extends EventTarget {
  scope: string;
  installing: ServiceWorker | null;
  waiting: ServiceWorker | null;
  active: ServiceWorker | null;
  pushManager: MockPushManager;
  sync: MockSyncManager;
  update(): Promise<void>;
  unregister(): Promise<boolean>;
  showNotification(title: string, options?: NotificationOptions): Promise<void>;
  getNotifications(filter?: GetNotificationOptions): Promise<Notification[]>;
}

// Mock PushManager interface
interface MockPushManager {
  supportedContentEncodings: readonly string[];
  subscribe(options?: PushSubscriptionOptions): Promise<MockPushSubscription>;
  getSubscription(): Promise<MockPushSubscription | null>;
  permissionState(options?: PushSubscriptionOptions): Promise<PermissionState>;
}

// Mock PushSubscription interface
interface MockPushSubscription {
  endpoint: string;
  expirationTime: number | null;
  options: PushSubscriptionOptions;
  getKey(name: PushEncryptionKeyName): ArrayBuffer | null;
  toJSON(): PushSubscriptionJSON;
  unsubscribe(): Promise<boolean>;
}

// Mock SyncManager interface
interface MockSyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

// Mock WakeLock interface
interface MockWakeLock {
  request(type?: WakeLockType): Promise<MockWakeLockSentinel>;
}

interface MockWakeLockSentinel extends EventTarget {
  released: boolean;
  type: WakeLockType;
  release(): Promise<void>;
  onrelease: ((this: WakeLockSentinel, ev: Event) => any) | null;
}

/**
 * Mock Notification API
 * Supports permission requests, notification creation, click handling, and cleanup
 */
export const mockNotificationAPI = () => {
  // Mock Notification constructor
  const MockNotificationConstructor = vi.fn().mockImplementation(function(
    this: MockNotification,
    title: string,
    options: NotificationOptions = {}
  ) {
    const notification: MockNotification = {
      title,
      body: options.body,
      icon: options.icon,
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction,
      silent: options.silent,
      timestamp: Date.now(),
      onclick: null,
      onclose: null,
      onerror: null,
      onshow: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      close: vi.fn(() => {
        const index = mockStates.notification.notifications.indexOf(notification);
        if (index > -1) {
          mockStates.notification.notifications.splice(index, 1);
        }
        if (notification.onclose) {
          notification.onclose(new Event('close'));
        }
      })
    };

    // Store notification
    mockStates.notification.notifications.push(notification);

    // Simulate show event
    setTimeout(() => {
      if (notification.onshow) {
        notification.onshow(new Event('show'));
      }
    }, 0);

    return notification;
  });

  // Mock static methods
  MockNotificationConstructor.permission = mockStates.notification.permissions.default;
  
  MockNotificationConstructor.requestPermission = vi.fn().mockImplementation(
    (callback?: (permission: NotificationPermission) => void) => {
      const permission: NotificationPermission = 'granted';
      mockStates.notification.permissions.default = permission;
      MockNotificationConstructor.permission = permission;
      
      if (callback) {
        callback(permission);
        return Promise.resolve(permission);
      }
      
      return Promise.resolve(permission);
    }
  );

  // Set global Notification
  global.Notification = MockNotificationConstructor as any;

  // Helper functions for tests
  return {
    getActiveNotifications: () => mockStates.notification.notifications,
    simulateNotificationClick: (notification: MockNotification) => {
      if (notification.onclick) {
        notification.onclick(new Event('click'));
      }
    },
    simulatePermissionDenied: () => {
      mockStates.notification.permissions.default = 'denied';
      MockNotificationConstructor.permission = 'denied';
    },
    resetNotifications: () => {
      mockStates.notification.notifications = [];
      mockStates.notification.permissions.default = 'default';
      MockNotificationConstructor.permission = 'default';
    }
  };
};

/**
 * Mock Service Worker API
 * Supports registration, messaging, and lifecycle management
 */
export const mockServiceWorkerAPI = () => {
  const createMockServiceWorker = (scriptURL: string): MockServiceWorker => ({
    scriptURL,
    state: 'activated',
    onstatechange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    postMessage: vi.fn((message: any) => {
      // Simulate message handling
      setTimeout(() => {
        const messageEvent = new MessageEvent('message', { data: message });
        Object.values(mockStates.serviceWorker.messageHandlers).forEach(handler => {
          handler(messageEvent);
        });
      }, 0);
    })
  });

  const createMockPushManager = (): MockPushManager => ({
    supportedContentEncodings: ['aes128gcm', 'aesgcm'],
    subscribe: vi.fn().mockImplementation(async (options?: PushSubscriptionOptions) => {
      const subscription: MockPushSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-123',
        expirationTime: null,
        options: options || {},
        getKey: vi.fn().mockReturnValue(new ArrayBuffer(65)),
        toJSON: vi.fn().mockReturnValue({
          endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-123',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key'
          }
        }),
        unsubscribe: vi.fn().mockResolvedValue(true)
      };
      mockStates.push.subscriptions.push(subscription);
      return subscription;
    }),
    getSubscription: vi.fn().mockImplementation(async () => {
      return mockStates.push.subscriptions[0] || null;
    }),
    permissionState: vi.fn().mockResolvedValue('granted' as PermissionState)
  });

  const createMockSyncManager = (): MockSyncManager => ({
    register: vi.fn().mockResolvedValue(undefined),
    getTags: vi.fn().mockResolvedValue(['alarm-sync', 'background-sync'])
  });

  const createMockServiceWorkerRegistration = (scope: string): MockServiceWorkerRegistration => {
    const activeWorker = createMockServiceWorker(`${scope}/sw.js`);
    mockStates.serviceWorker.activeWorker = activeWorker;

    return {
      scope,
      installing: null,
      waiting: null,
      active: activeWorker,
      pushManager: createMockPushManager(),
      sync: createMockSyncManager(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      unregister: vi.fn().mockResolvedValue(true),
      showNotification: vi.fn().mockImplementation(async (title: string, options?: NotificationOptions) => {
        // Create notification through service worker
        const notification = new (global.Notification as any)(title, options);
        return notification;
      }),
      getNotifications: vi.fn().mockResolvedValue([])
    };
  };

  // Mock navigator.serviceWorker
  const mockServiceWorkerContainer = {
    controller: null,
    ready: Promise.resolve(createMockServiceWorkerRegistration('/')),
    register: vi.fn().mockImplementation(async (scriptURL: string, options?: RegistrationOptions) => {
      const scope = options?.scope || '/';
      const registration = createMockServiceWorkerRegistration(scope);
      mockStates.serviceWorker.registrations.push(registration);
      return registration;
    }),
    getRegistration: vi.fn().mockImplementation(async (scope?: string) => {
      return mockStates.serviceWorker.registrations.find(reg => 
        !scope || reg.scope === scope
      ) || null;
    }),
    getRegistrations: vi.fn().mockImplementation(async () => {
      return mockStates.serviceWorker.registrations;
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    startMessages: vi.fn()
  };

  Object.defineProperty(navigator, 'serviceWorker', {
    value: mockServiceWorkerContainer,
    writable: true,
    configurable: true
  });

  return {
    getRegistrations: () => mockStates.serviceWorker.registrations,
    getActiveWorker: () => mockStates.serviceWorker.activeWorker,
    simulateMessage: (message: any) => {
      Object.values(mockStates.serviceWorker.messageHandlers).forEach(handler => {
        handler(new MessageEvent('message', { data: message }));
      });
    },
    addMessageHandler: (id: string, handler: (event: MessageEvent) => void) => {
      mockStates.serviceWorker.messageHandlers[id] = handler;
    },
    resetServiceWorkers: () => {
      mockStates.serviceWorker.registrations = [];
      mockStates.serviceWorker.activeWorker = null;
      mockStates.serviceWorker.messageHandlers = {};
    }
  };
};

/**
 * Mock Wake Lock API
 * Supports screen wake lock for alarm display
 */
export const mockWakeLockAPI = () => {
  const activeSentinels: MockWakeLockSentinel[] = [];

  const createWakeLockSentinel = (type: WakeLockType): MockWakeLockSentinel => {
    const sentinel: MockWakeLockSentinel = {
      released: false,
      type,
      onrelease: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      release: vi.fn().mockImplementation(async () => {
        sentinel.released = true;
        const index = activeSentinels.indexOf(sentinel);
        if (index > -1) {
          activeSentinels.splice(index, 1);
        }
        if (sentinel.onrelease) {
          sentinel.onrelease(new Event('release'));
        }
      })
    };
    
    activeSentinels.push(sentinel);
    return sentinel;
  };

  const mockWakeLock: MockWakeLock = {
    request: vi.fn().mockImplementation(async (type: WakeLockType = 'screen') => {
      return createWakeLockSentinel(type);
    })
  };

  Object.defineProperty(navigator, 'wakeLock', {
    value: mockWakeLock,
    writable: true,
    configurable: true
  });

  return {
    getActiveSentinels: () => activeSentinels,
    releaseAll: async () => {
      await Promise.all(activeSentinels.map(sentinel => sentinel.release()));
    },
    resetWakeLocks: () => {
      activeSentinels.splice(0, activeSentinels.length);
    }
  };
};

/**
 * Mock Enhanced Speech Recognition API
 * More comprehensive than basic speech synthesis
 */
export const mockEnhancedSpeechRecognitionAPI = () => {
  const mockRecognition = {
    continuous: false,
    interimResults: false,
    lang: 'en-US',
    maxAlternatives: 1,
    serviceURI: '',
    grammars: null,
    onstart: null,
    onend: null,
    onerror: null,
    onresult: null,
    onnomatch: null,
    onsoundstart: null,
    onsoundend: null,
    onspeechstart: null,
    onspeechend: null,
    onaudiostart: null,
    onaudioend: null,
    
    start: vi.fn().mockImplementation(function() {
      setTimeout(() => {
        if (this.onstart) this.onstart(new Event('start'));
        if (this.onaudiostart) this.onaudiostart(new Event('audiostart'));
        if (this.onsoundstart) this.onsoundstart(new Event('soundstart'));
        if (this.onspeechstart) this.onspeechstart(new Event('speechstart'));
      }, 50);
    }),
    
    stop: vi.fn().mockImplementation(function() {
      setTimeout(() => {
        if (this.onspeechend) this.onspeechend(new Event('speechend'));
        if (this.onsoundend) this.onsoundend(new Event('soundend'));
        if (this.onaudioend) this.onaudioend(new Event('audioend'));
        if (this.onend) this.onend(new Event('end'));
      }, 50);
    }),
    
    abort: vi.fn().mockImplementation(function() {
      setTimeout(() => {
        if (this.onend) this.onend(new Event('end'));
      }, 10);
    }),
    
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  };

  // Mock speech recognition constructor
  const MockSpeechRecognition = vi.fn().mockImplementation(() => mockRecognition);
  
  // Set up global APIs
  global.SpeechRecognition = MockSpeechRecognition;
  global.webkitSpeechRecognition = MockSpeechRecognition;

  return {
    instance: mockRecognition,
    simulateResult: (transcript: string, isFinal: boolean = true) => {
      const results = [{
        0: { transcript, confidence: 0.95 },
        isFinal,
        length: 1
      }];
      
      const event = {
        results,
        resultIndex: 0,
        type: 'result'
      };
      
      if (mockRecognition.onresult) {
        mockRecognition.onresult(event as any);
      }
    },
    simulateError: (error: string = 'network') => {
      const event = { error, type: 'error' };
      if (mockRecognition.onerror) {
        mockRecognition.onerror(event as any);
      }
    },
    simulateNoMatch: () => {
      if (mockRecognition.onnomatch) {
        mockRecognition.onnomatch(new Event('nomatch'));
      }
    }
  };
};

/**
 * Mock Permissions API with advanced support
 */
export const mockEnhancedPermissionsAPI = () => {
  const permissions: {[key: string]: PermissionStatus} = {};
  
  const createPermissionStatus = (name: string, state: PermissionState = 'granted'): PermissionStatus => {
    const status = {
      name,
      state,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    } as PermissionStatus;
    
    permissions[name] = status;
    return status;
  };

  Object.defineProperty(navigator, 'permissions', {
    value: {
      query: vi.fn().mockImplementation(async (descriptor: PermissionDescriptor) => {
        const existingPermission = permissions[descriptor.name];
        if (existingPermission) {
          return existingPermission;
        }
        
        // Default permissions for different types
        const defaultStates: {[key: string]: PermissionState} = {
          'notifications': 'granted',
          'push': 'granted',
          'microphone': 'granted',
          'camera': 'denied',
          'geolocation': 'granted',
          'persistent-storage': 'granted'
        };
        
        return createPermissionStatus(descriptor.name, defaultStates[descriptor.name] || 'denied');
      })
    },
    writable: true,
    configurable: true
  });

  return {
    setPermission: (name: string, state: PermissionState) => {
      if (permissions[name]) {
        permissions[name].state = state;
        if (permissions[name].onchange) {
          permissions[name].onchange!(new Event('change'));
        }
      } else {
        createPermissionStatus(name, state);
      }
    },
    getPermissions: () => permissions,
    resetPermissions: () => {
      Object.keys(permissions).forEach(key => delete permissions[key]);
    }
  };
};

/**
 * Setup all enhanced browser API mocks
 */
export const setupEnhancedBrowserAPIMocks = () => {
  const notificationMocks = mockNotificationAPI();
  const serviceWorkerMocks = mockServiceWorkerAPI(); 
  const wakeLockMocks = mockWakeLockAPI();
  const speechMocks = mockEnhancedSpeechRecognitionAPI();
  const permissionMocks = mockEnhancedPermissionsAPI();

  return {
    notifications: notificationMocks,
    serviceWorker: serviceWorkerMocks,
    wakeLock: wakeLockMocks,
    speech: speechMocks,
    permissions: permissionMocks,
    
    // Cleanup function for tests
    resetAll: () => {
      notificationMocks.resetNotifications();
      serviceWorkerMocks.resetServiceWorkers();
      wakeLockMocks.resetWakeLocks();
      permissionMocks.resetPermissions();
    }
  };
};

/**
 * Utilities for integration tests
 */
export const createIntegrationTestHelpers = () => {
  const mocks = setupEnhancedBrowserAPIMocks();
  
  return {
    ...mocks,
    
    // Common alarm app scenarios
    simulateAlarmNotification: async (title: string, options?: NotificationOptions) => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
      }
      return mocks.notifications.getActiveNotifications().slice(-1)[0];
    },
    
    simulateVoiceAlarmDismiss: () => {
      mocks.speech.simulateResult('dismiss alarm', true);
    },
    
    simulateVoiceSnooze: () => {
      mocks.speech.simulateResult('snooze 5 minutes', true);
    },
    
    simulatePushSubscription: async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: new Uint8Array([1, 2, 3, 4])
      });
    },
    
    simulateScreenWakeLock: async () => {
      return navigator.wakeLock!.request('screen');
    },
    
    // Test state verification
    verifyNotificationShown: (expectedTitle: string) => {
      const notifications = mocks.notifications.getActiveNotifications();
      return notifications.some(n => n.title === expectedTitle);
    },
    
    verifyServiceWorkerActive: () => {
      return mocks.serviceWorker.getActiveWorker() !== null;
    },
    
    verifyPushSubscriptionActive: () => {
      return mocks.serviceWorker.getRegistrations().some(reg => 
        reg.pushManager && reg.pushManager.getSubscription()
      );
    }
  };
};