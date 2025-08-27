/**
 * Comprehensive Capacitor Plugin Mock System
 *
 * Complete mock implementation for all Capacitor plugins used in Relife Alarm app.
 * Provides high-fidelity simulation of mobile functionality for testing:
 *
 * Core Plugins:
 * - Device, App, Network, Keyboard, Screen, Browser
 *
 * Notification Plugins:
 * - LocalNotifications, PushNotifications, Badge
 *
 * Media Plugins:
 * - Camera, Filesystem, AudioManager, Haptics
 *
 * Location Plugins:
 * - Geolocation
 *
 * UI Plugins:
 * - StatusBar, SplashScreen
 *
 * Background Plugins:
 * - BackgroundMode, KeepAwake
 *
 * Storage Plugins:
 * - Preferences
 *
 * Social Plugins:
 * - Share
 *
 * Features:
 * - Cross-platform behavior simulation (iOS/Android/Web)
 * - Realistic async operations with proper timing
 * - Error condition simulation
 * - Event system simulation
 * - Comprehensive state tracking for testing
 * - Support for real device testing via USE_REAL_DEVICE=true
 */

import { vi } from 'vitest';
import { AnyFn } from 'src/types/utility-types';

// Environment variable check for real device testing
const USE_REAL_DEVICE = process.env.USE_REAL_DEVICE === 'true';

// Logging utility
const log = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV !== 'test' || process.env.VERBOSE_TESTS === 'true') {
    console.log(message, ...args);
  }
};

if (USE_REAL_DEVICE) {
  log('🔥 Using REAL Capacitor plugins (USE_REAL_DEVICE=true)');
} else {
  log('🧪 Using MOCK Capacitor plugins for testing');
}

// Type definitions for better mock typing
type PermissionState = 'granted' | 'denied' | 'prompt';
type Platform = 'web' | 'ios' | 'android';
type NotificationAction = 'tap' | 'dismiss' | 'snooze';
type HapticType = 'LIGHT' | 'MEDIUM' | 'HEAVY';
type NotificationType = 'SUCCESS' | 'WARNING' | 'ERROR';

interface MockAlarmNotification {
  id: number;
  title: string;
  body: string;
  schedule?: {
    at?: Date;
    repeats?: boolean;
    every?: 'day' | 'week' | 'month';
    allowWhileIdle?: boolean;
  };
  sound?: string;
  extra?: Record<string, any>;
  scheduledAt?: number;
  isAlarm?: boolean;
}

interface MockAudioAsset {
  assetId: string;
  assetPath: string;
  duration: number;
  isLoaded: boolean;
}

interface MockDeviceInfo {
  platform: Platform;
  model: string;
  operatingSystem: string;
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
  webViewVersion: string;
  name?: string;
  diskFree?: number;
  diskTotal?: number;
  memUsed?: number;
  realDiskFree?: number;
  realDiskTotal?: number;
}

interface MockBatteryInfo {
  batteryLevel: number;
  isCharging: boolean;
}

interface MockNetworkStatus {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
}

// Comprehensive mock state management
const mockState = {
  // Alarm management
  alarms: {
    scheduled: new Map<number, MockAlarmNotification>(),
    active: new Set<number>(),
    history: [] as Array<
      MockAlarmNotification & { triggeredAt: number; action: string }
    >,
  },

  // Audio management
  audio: {
    currentlyPlaying: null as string | null,
    volume: 1.0,
    isPlaying: false,
    isPaused: false,
    loadedSounds: new Map<string, MockAudioAsset>(),
  },

  // Background processing
  background: {
    isEnabled: false,
    isActive: false,
    keepAwakeActive: false,
  },

  // Device characteristics
  device: {
    platform: 'web' as Platform,
    isNative: false,
    info: {
      platform: 'web',
      model: 'Mock Device',
      operatingSystem: 'unknown',
      osVersion: 'unknown',
      manufacturer: 'Mock Manufacturer',
      isVirtual: false,
      webViewVersion: 'Unknown',
      name: 'Mock Device',
      diskFree: 1000000000,
      diskTotal: 16000000000,
      memUsed: 500000000,
      realDiskFree: 1000000000,
      realDiskTotal: 16000000000,
    } as MockDeviceInfo,
    battery: {
      batteryLevel: 0.85,
      isCharging: false,
    } as MockBatteryInfo,
    permissions: {
      notifications: 'granted' as PermissionState,
      camera: 'granted' as PermissionState,
      microphone: 'granted' as PermissionState,
      location: 'granted' as PermissionState,
    },
  },

  // Network connectivity
  network: {
    connected: true,
    connectionType: 'wifi' as 'wifi' | 'cellular' | 'none' | 'unknown',
  } as MockNetworkStatus,

  // App lifecycle
  app: {
    isActive: true,
    state: 'active' as 'active' | 'background' | 'unknown',
  },

  // UI state
  ui: {
    statusBar: {
      style: 'DEFAULT' as 'LIGHT' | 'DARK' | 'DEFAULT',
      backgroundColor: '#000000',
      visible: true,
      overlaysWebView: false,
    },
    splashScreen: {
      visible: false,
    },
    keyboard: {
      visible: false,
      height: 0,
    },
  },

  // File system
  filesystem: {
    files: new Map<string, { data: string; mimeType: string }>(),
  },

  // Camera state
  camera: {
    available: true,
    permissions: 'granted' as PermissionState,
  },

  // Badge count
  badge: {
    count: 0,
  },

  // Location tracking
  geolocation: {
    currentPosition: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
    },
    watchIds: new Map<string, NodeJS.Timeout>(),
  },
};

// Event listener management
const mockEventListeners = new Map<
  string,
  Array<{ eventName: string; callback: AnyFn; pluginName: string }>
>();

const addMockListener = (pluginName: string, eventName: string, callback: AnyFn) => {
  const key = `${pluginName}:${eventName}`;
  if (!mockEventListeners.has(key)) {
    mockEventListeners.set(key, []);
  }
  mockEventListeners.get(key)!.push({ eventName, callback, pluginName });
  log(`👂 Mock ${pluginName} listener added: ${eventName}`);
  return {
    remove: vi.fn(() => {
      const listeners = mockEventListeners.get(key);
      if (listeners) {
        const _index = listeners.findIndex(l => l.callback === callback);
        if (_index > -1) {
          listeners.splice(_index, 1);
          log(`🔇 Mock ${pluginName} listener removed: ${eventName}`);
        }
      }
    }),
  };
};

const triggerMockEvent = (pluginName: string, eventName: string, data?: any) => {
  const key = `${pluginName}:${eventName}`;
  const listeners = mockEventListeners.get(key);
  if (listeners) {
    listeners.forEach(listener => {
      try {
        listener.callback(data);
        log(`📢 Mock ${pluginName} _event triggered: ${eventName}`, data);
      } catch (_error) {
        log(`❌ Mock ${pluginName} _event listener error:`, _error);
      }
    });
  }
};

// =============================================================================
// CORE CAPACITOR API
// =============================================================================

export const Capacitor = {
  // Platform detection
  getPlatform: vi.fn(() => {
    log(`📱 Mock Capacitor.getPlatform: ${mockState.device.platform}`);
    return mockState.device.platform;
  }),

  isNativePlatform: vi.fn(() => {
    log(`📱 Mock Capacitor.isNativePlatform: ${mockState.device.isNative}`);
    return mockState.device.isNative;
  }),

  // Plugin availability
  isPluginAvailable: vi.fn((pluginName: string) => {
    log(`🔌 Mock Capacitor.isPluginAvailable: ${pluginName}`);
    return true; // All plugins available in mock
  }),

  // Convert file source to web viewable
  convertFileSrc: vi.fn((filePath: string) => {
    log(`🔗 Mock Capacitor.convertFileSrc: ${filePath}`);
    return `capacitor://localhost/_capacitor_file_${encodeURIComponent(filePath)}`;
  }),

  // Plugin registration (for testing)
  registerPlugin: vi.fn((pluginName: string, options?: any) => {
    log(`🔌 Mock Capacitor.registerPlugin: ${pluginName}`, options);
    return {}; // Return empty plugin object
  }),

  // Testing utilities
  _mockSetPlatform: (platform: Platform) => {
    mockState.device.platform = platform;
    mockState.device.isNative = platform !== 'web';
    log(`📱 Mock platform set to: ${platform}`);
  },

  _mockReset: () => {
    // Reset all state to defaults
    Object.assign(mockState, {
      alarms: {
        scheduled: new Map(),
        active: new Set(),
        history: [],
      },
      audio: {
        currentlyPlaying: null,
        volume: 1.0,
        isPlaying: false,
        isPaused: false,
        loadedSounds: new Map(),
      },
      background: {
        isEnabled: false,
        isActive: false,
        keepAwakeActive: false,
      },
      device: {
        platform: 'web',
        isNative: false,
        info: {
          platform: 'web',
          model: 'Mock Device',
          operatingSystem: 'unknown',
          osVersion: 'unknown',
          manufacturer: 'Mock Manufacturer',
          isVirtual: false,
          webViewVersion: 'Unknown',
          name: 'Mock Device',
          diskFree: 1000000000,
          diskTotal: 16000000000,
          memUsed: 500000000,
          realDiskFree: 1000000000,
          realDiskTotal: 16000000000,
        },
        battery: {
          batteryLevel: 0.85,
          isCharging: false,
        },
        permissions: {
          notifications: 'granted',
          camera: 'granted',
          microphone: 'granted',
          location: 'granted',
        },
      },
      network: {
        connected: true,
        connectionType: 'wifi',
      },
      app: {
        isActive: true,
        state: 'active',
      },
      ui: {
        statusBar: {
          style: 'DEFAULT',
          backgroundColor: '#000000',
          visible: true,
          overlaysWebView: false,
        },
        splashScreen: {
          visible: false,
        },
        keyboard: {
          visible: false,
          height: 0,
        },
      },
      filesystem: {
        files: new Map(),
      },
      camera: {
        available: true,
        permissions: 'granted',
      },
      badge: {
        count: 0,
      },
      geolocation: {
        currentPosition: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
        },
        watchIds: new Map(),
      },
    });

    // Clear all event listeners
    mockEventListeners.clear();

    // Clear geolocation watch intervals
    mockState.geolocation.watchIds.forEach(interval => clearInterval(interval));
    mockState.geolocation.watchIds.clear();

    log('🧹 Mock Capacitor completely reset');
  },
};

// =============================================================================
// DEVICE PLUGIN
// =============================================================================

export const Device = {
  getInfo: vi.fn(() => {
    log('📱 Mock Device.getInfo');
    return Promise.resolve(mockState.device.info);
  }),

  getId: vi.fn(() => {
    log('🆔 Mock Device.getId');
    return Promise.resolve({
      identifier: 'mock-device-id-12345',
    });
  }),

  getLanguageCode: vi.fn(() => {
    log('🌐 Mock Device.getLanguageCode');
    return Promise.resolve({
      value: 'en',
    });
  }),

  getBatteryInfo: vi.fn(() => {
    log('🔋 Mock Device.getBatteryInfo');
    return Promise.resolve(mockState.device.battery);
  }),

  // Testing utilities
  _mockSetBattery: (level: number, isCharging: boolean = false) => {
    mockState.device.battery = { batteryLevel: level, isCharging };
    log(
      `🔋 Mock battery set: ${Math.round(level * 100)}% ${isCharging ? '(charging)' : ''}`
    );
  },

  _mockSetDeviceInfo: (info: Partial<MockDeviceInfo>) => {
    Object.assign(mockState.device.info, info);
    log('📱 Mock device info updated:', info);
  },
};

// =============================================================================
// LOCAL NOTIFICATIONS PLUGIN
// =============================================================================

export const LocalNotifications = {
  schedule: vi.fn((options: { notifications: MockAlarmNotification[] }) => {
    log(
      `🔔 Mock LocalNotifications.schedule: ${options.notifications.length} notifications`
    );

    const scheduledNotifications = options.notifications.map(notification => {
      const id = notification.id || Date.now() + Math.floor(Math.random() * 1000);
      const enhancedNotification: MockAlarmNotification = {
        ...notification,
        id,
        scheduledAt: Date.now(),
        isAlarm:
          notification.title?.includes('Alarm') || notification.extra?.isAlarm || false,
      };

      // Store scheduled notifications
      mockState.alarms.scheduled.set(id, enhancedNotification);

      // Update badge count
      mockState.badge.count = mockState.alarms.scheduled.size;

      if (enhancedNotification.isAlarm) {
        log(`⏰ Alarm scheduled: ID ${id}`);
      }

      return enhancedNotification;
    });

    return Promise.resolve({ notifications: scheduledNotifications });
  }),

  getPending: vi.fn(() => {
    log('⏳ Mock LocalNotifications.getPending');
    const pendingNotifications = Array.from(mockState.alarms.scheduled.values());
    return Promise.resolve({ notifications: pendingNotifications });
  }),

  cancel: vi.fn((options: { notifications: Array<{ id: number }> }) => {
    log(
      `❌ Mock LocalNotifications.cancel: ${options.notifications.length} notifications`
    );

    options.notifications.forEach(({ id }) => {
      if (mockState.alarms.scheduled.has(id)) {
        const notification = mockState.alarms.scheduled.get(id);
        mockState.alarms.scheduled.delete(id);
        mockState.alarms.active.delete(id);

        if (notification?.isAlarm) {
          log(`⏰ Alarm cancelled: ID ${id}`);
        }
      }
    });

    // Update badge count
    mockState.badge.count = mockState.alarms.scheduled.size;

    return Promise.resolve();
  }),

  registerActionTypes: vi.fn((options: { types: any[] }) => {
    log(
      `⚡ Mock LocalNotifications.registerActionTypes: ${options.types.length} types`
    );
    return Promise.resolve();
  }),

  areEnabled: vi.fn(() => {
    log('❓ Mock LocalNotifications.areEnabled');
    return Promise.resolve({
      value: mockState.device.permissions.notifications === 'granted',
    });
  }),

  requestPermissions: vi.fn(() => {
    log('🔐 Mock LocalNotifications.requestPermissions');
    return Promise.resolve({
      display: mockState.device.permissions.notifications,
    });
  }),

  checkPermissions: vi.fn(() => {
    log('🔍 Mock LocalNotifications.checkPermissions');
    return Promise.resolve({
      display: mockState.device.permissions.notifications,
    });
  }),

  addListener: vi.fn((eventName: string, listenerFunc: (...args: unknown[]) => void) => {
    log(`👂 Mock LocalNotifications.addListener: ${eventName}`);
    return addMockListener('LocalNotifications', eventName, listenerFunc);
  }),

  removeAllListeners: vi.fn(() => {
    log('🔇 Mock LocalNotifications.removeAllListeners');
    // Remove all LocalNotifications listeners
    for (const [key] of mockEventListeners) {
      if (key.startsWith('LocalNotifications:')) {
        mockEventListeners.delete(key);
      }
    }
    return Promise.resolve();
  }),

  // Testing utilities
  _mockTriggerNotification: (
    notificationId: number,
    actionId: NotificationAction = 'tap'
  ) => {
    const notification = mockState.alarms.scheduled.get(notificationId);
    if (notification) {
      mockState.alarms.active.add(notificationId);
      mockState.alarms.history.push({
        ...notification,
        triggeredAt: Date.now(),
        action: 'triggered',
      });

      // Trigger events
      triggerMockEvent('LocalNotifications', 'localNotificationReceived', {
        notificationId,
        actionId: 'default',
        inputValue: '',
        extra: notification.extra || {},
      });

      if (actionId !== 'tap') {
        triggerMockEvent('LocalNotifications', 'localNotificationActionPerformed', {
          notificationId,
          actionId,
          inputValue: '',
          extra: notification.extra || {},
        });
      }

      log(`🔔 Notification triggered: ${notificationId} (${actionId})`);
    }
  },
};

// =============================================================================
// PUSH NOTIFICATIONS PLUGIN
// =============================================================================

export const PushNotifications = {
  register: vi.fn(() => {
    log('📨 Mock PushNotifications.register');
    // Simulate registration event
    setTimeout(() => {
      triggerMockEvent('PushNotifications', 'registration', {
        value: 'mock-registration-token-12345',
      });
    }, 100);
    return Promise.resolve();
  }),

  getDeliveredNotifications: vi.fn(() => {
    log('📨 Mock PushNotifications.getDeliveredNotifications');
    return Promise.resolve({ notifications: [] });
  }),

  removeDeliveredNotifications: vi.fn((options: { notifications: any[] }) => {
    log(
      `📨 Mock PushNotifications.removeDeliveredNotifications: ${options.notifications.length}`
    );
    return Promise.resolve();
  }),

  removeAllDeliveredNotifications: vi.fn(() => {
    log('📨 Mock PushNotifications.removeAllDeliveredNotifications');
    return Promise.resolve();
  }),

  requestPermissions: vi.fn(() => {
    log('🔐 Mock PushNotifications.requestPermissions');
    return Promise.resolve({
      receive: mockState.device.permissions.notifications,
    });
  }),

  checkPermissions: vi.fn(() => {
    log('🔍 Mock PushNotifications.checkPermissions');
    return Promise.resolve({
      receive: mockState.device.permissions.notifications,
    });
  }),

  addListener: vi.fn((eventName: string, listenerFunc: (...args: unknown[]) => void) => {
    log(`👂 Mock PushNotifications.addListener: ${eventName}`);
    return addMockListener('PushNotifications', eventName, listenerFunc);
  }),

  removeAllListeners: vi.fn(() => {
    log('🔇 Mock PushNotifications.removeAllListeners');
    for (const [key] of mockEventListeners) {
      if (key.startsWith('PushNotifications:')) {
        mockEventListeners.delete(key);
      }
    }
    return Promise.resolve();
  }),

  // Testing utilities
  _mockReceivePush: (data: any) => {
    triggerMockEvent('PushNotifications', 'pushNotificationReceived', data);
    log('📨 Mock push notification received:', data);
  },

  _mockPushAction: (data: any) => {
    triggerMockEvent('PushNotifications', 'pushNotificationActionPerformed', data);
    log('📨 Mock push notification action:', data);
  },
};

// =============================================================================
// HAPTICS PLUGIN
// =============================================================================

export const Haptics = {
  impact: vi.fn((options?: { style?: HapticType }) => {
    const style = options?.style || 'MEDIUM';
    log(`📳 Mock Haptics.impact: ${style}`);
    return Promise.resolve();
  }),

  notification: vi.fn((options?: { type?: NotificationType }) => {
    const type = options?.type || 'SUCCESS';
    log(`📳 Mock Haptics.notification: ${type}`);
    return Promise.resolve();
  }),

  vibrate: vi.fn((options?: { duration?: number }) => {
    const duration = options?.duration || 300;
    log(`📳 Mock Haptics.vibrate: ${duration}ms`);
    return Promise.resolve();
  }),

  selectionStart: vi.fn(() => {
    log('📳 Mock Haptics.selectionStart');
    return Promise.resolve();
  }),

  selectionChanged: vi.fn(() => {
    log('📳 Mock Haptics.selectionChanged');
    return Promise.resolve();
  }),

  selectionEnd: vi.fn(() => {
    log('📳 Mock Haptics.selectionEnd');
    return Promise.resolve();
  }),
};

// =============================================================================
// GEOLOCATION PLUGIN
// =============================================================================

export const Geolocation = {
  getCurrentPosition: vi.fn((options?: any) => {
    log('🌍 Mock Geolocation.getCurrentPosition', options);
    return Promise.resolve({
      timestamp: Date.now(),
      coords: {
        latitude: mockState.geolocation.currentPosition.latitude,
        longitude: mockState.geolocation.currentPosition.longitude,
        accuracy: mockState.geolocation.currentPosition.accuracy,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
    });
  }),

  watchPosition: vi.fn((options?: any, callback?: AnyFn) => {
    log('👀 Mock Geolocation.watchPosition', options);

    const watchId = `mock-watch-${Math.random().toString(36).substr(2, 9)}`;

    if (callback) {
      // Simulate position updates
      const interval = setInterval(() => {
        const position = {
          timestamp: Date.now(),
          coords: {
            latitude:
              mockState.geolocation.currentPosition.latitude +
              (Math.random() - 0.5) * 0.01,
            longitude:
              mockState.geolocation.currentPosition.longitude +
              (Math.random() - 0.5) * 0.01,
            accuracy:
              mockState.geolocation.currentPosition.accuracy +
              (Math.random() - 0.5) * 5,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
        };
        callback(null, position);
      }, 1000);

      mockState.geolocation.watchIds.set(watchId, interval);
    }

    return Promise.resolve(watchId);
  }),

  clearWatch: vi.fn((options: { id: string }) => {
    log('🛑 Mock Geolocation.clearWatch', options.id);

    const interval = mockState.geolocation.watchIds.get(options.id);
    if (interval) {
      clearInterval(interval);
      mockState.geolocation.watchIds.delete(options.id);
    }

    return Promise.resolve();
  }),

  checkPermissions: vi.fn(() => {
    log('🔍 Mock Geolocation.checkPermissions');
    return Promise.resolve({
      location: mockState.device.permissions.location,
      coarseLocation: mockState.device.permissions.location,
    });
  }),

  requestPermissions: vi.fn(() => {
    log('🔐 Mock Geolocation.requestPermissions');
    return Promise.resolve({
      location: mockState.device.permissions.location,
      coarseLocation: mockState.device.permissions.location,
    });
  }),

  // Testing utilities
  _mockSetPosition: (latitude: number, longitude: number, accuracy: number = 10) => {
    mockState.geolocation.currentPosition = { latitude, longitude, accuracy };
    log(`🌍 Mock position set: ${latitude}, ${longitude} (±${accuracy}m)`);
  },
};

// =============================================================================
// PREFERENCES PLUGIN (STORAGE)
// =============================================================================

export const Preferences = {
  configure: vi.fn((options: { group?: string }) => {
    log('⚙️ Mock Preferences.configure', options);
    return Promise.resolve();
  }),

  get: vi.fn((options: { key: string }) => {
    log(`🔍 Mock Preferences.get: ${options.key}`);
    const value = localStorage.getItem(options.key);
    return Promise.resolve({ value });
  }),

  set: vi.fn((options: { key: string; value: string }) => {
    log(`💾 Mock Preferences.set: ${options.key} = ${options.value}`);
    localStorage.setItem(options.key, options.value);
    return Promise.resolve();
  }),

  remove: vi.fn((options: { key: string }) => {
    log(`🗑️ Mock Preferences.remove: ${options.key}`);
    localStorage.removeItem(options.key);
    return Promise.resolve();
  }),

  clear: vi.fn(() => {
    log('🧹 Mock Preferences.clear');
    localStorage.clear();
    return Promise.resolve();
  }),

  keys: vi.fn(() => {
    log('🔑 Mock Preferences.keys');
    const keys = Object.keys(localStorage);
    return Promise.resolve({ keys });
  }),
};

// =============================================================================
// STATUS BAR PLUGIN
// =============================================================================

export const StatusBar = {
  setStyle: vi.fn((options: { style: 'LIGHT' | 'DARK' | 'DEFAULT' }) => {
    log(`🎨 Mock StatusBar.setStyle: ${options.style}`);
    mockState.ui.statusBar.style = options.style;
    return Promise.resolve();
  }),

  setBackgroundColor: vi.fn((options: { color: string }) => {
    log(`🎨 Mock StatusBar.setBackgroundColor: ${options.color}`);
    mockState.ui.statusBar.backgroundColor = options.color;
    return Promise.resolve();
  }),

  show: vi.fn(() => {
    log('👁️ Mock StatusBar.show');
    mockState.ui.statusBar.visible = true;
    return Promise.resolve();
  }),

  hide: vi.fn(() => {
    log('🙈 Mock StatusBar.hide');
    mockState.ui.statusBar.visible = false;
    return Promise.resolve();
  }),

  setOverlaysWebView: vi.fn((options: { overlay: boolean }) => {
    log(`📱 Mock StatusBar.setOverlaysWebView: ${options.overlay}`);
    mockState.ui.statusBar.overlaysWebView = options.overlay;
    return Promise.resolve();
  }),

  getInfo: vi.fn(() => {
    log('ℹ️ Mock StatusBar.getInfo');
    return Promise.resolve({
      visible: mockState.ui.statusBar.visible,
      style: mockState.ui.statusBar.style,
      color: mockState.ui.statusBar.backgroundColor,
      overlays: mockState.ui.statusBar.overlaysWebView,
    });
  }),
};

// =============================================================================
// SPLASH SCREEN PLUGIN
// =============================================================================

export const SplashScreen = {
  show: vi.fn(
    (options?: {
      showDuration?: number;
      fadeInDuration?: number;
      fadeOutDuration?: number;
      autoHide?: boolean;
    }) => {
      log('💫 Mock SplashScreen.show', options);
      mockState.ui.splashScreen.visible = true;

      // Auto-hide if specified
      if (options?.autoHide && options.showDuration) {
        setTimeout(() => {
          mockState.ui.splashScreen.visible = false;
        }, options.showDuration);
      }

      return Promise.resolve();
    }
  ),

  hide: vi.fn((options?: { fadeOutDuration?: number }) => {
    log('🙈 Mock SplashScreen.hide', options);
    mockState.ui.splashScreen.visible = false;
    return Promise.resolve();
  }),
};

// =============================================================================
// ADDITIONAL PLUGINS
// =============================================================================

// App Plugin
export const App = {
  exitApp: vi.fn(() => {
    log('🚪 Mock App.exitApp');
    return Promise.resolve();
  }),

  getInfo: vi.fn(() => {
    log('ℹ️ Mock App.getInfo');
    return Promise.resolve({
      name: 'Relife Alarm',
      id: 'com.scrapybara.relife',
      build: '1',
      version: '1.0.0',
    });
  }),

  getState: vi.fn(() => {
    log('📱 Mock App.getState');
    return Promise.resolve({
      isActive: mockState.app.isActive,
    });
  }),

  addListener: vi.fn((eventName: string, listenerFunc: (...args: unknown[]) => void) => {
    log(`👂 Mock App.addListener: ${eventName}`);
    return addMockListener('App', eventName, listenerFunc);
  }),

  removeAllListeners: vi.fn(() => {
    log('🔇 Mock App.removeAllListeners');
    for (const [key] of mockEventListeners) {
      if (key.startsWith('App:')) {
        mockEventListeners.delete(key);
      }
    }
    return Promise.resolve();
  }),

  // Testing utilities
  _mockAppStateChange: (isActive: boolean) => {
    mockState.app.isActive = isActive;
    mockState.app.state = isActive ? 'active' : 'background';
    triggerMockEvent('App', 'appStateChange', { isActive });
    log(`📱 Mock app state changed: ${isActive ? 'active' : 'background'}`);
  },

  _mockBackButton: () => {
    triggerMockEvent('App', 'backButton', { canGoBack: false });
    log('⬅️ Mock back button pressed');
  },
};

// Network Plugin
export const Network = {
  getStatus: vi.fn(() => {
    log('🌐 Mock Network.getStatus');
    return Promise.resolve(mockState.network);
  }),

  addListener: vi.fn((eventName: string, listenerFunc: (...args: unknown[]) => void) => {
    log(`👂 Mock Network.addListener: ${eventName}`);
    return addMockListener('Network', eventName, listenerFunc);
  }),

  removeAllListeners: vi.fn(() => {
    log('🔇 Mock Network.removeAllListeners');
    for (const [key] of mockEventListeners) {
      if (key.startsWith('Network:')) {
        mockEventListeners.delete(key);
      }
    }
    return Promise.resolve();
  }),

  // Testing utilities
  _mockNetworkChange: (
    connected: boolean,
    connectionType: 'wifi' | 'cellular' | 'none' | 'unknown' = 'wifi'
  ) => {
    mockState.network = { connected, connectionType };
    triggerMockEvent('Network', 'networkStatusChange', mockState.network);
    log(`🌐 Mock network changed: ${connected ? connectionType : 'disconnected'}`);
  },
};

// Badge Plugin
export const Badge = {
  set: vi.fn((options: { count: number }) => {
    log(`🔴 Mock Badge.set: ${options.count}`);
    mockState.badge.count = options.count;
    return Promise.resolve();
  }),

  get: vi.fn(() => {
    log('🔴 Mock Badge.get');
    return Promise.resolve({ count: mockState.badge.count });
  }),

  clear: vi.fn(() => {
    log('🔴 Mock Badge.clear');
    mockState.badge.count = 0;
    return Promise.resolve();
  }),

  increase: vi.fn((options?: { count?: number }) => {
    const increment = options?.count || 1;
    mockState.badge.count += increment;
    log(`🔴 Mock Badge.increase: +${increment} (total: ${mockState.badge.count})`);
    return Promise.resolve();
  }),

  decrease: vi.fn((options?: { count?: number }) => {
    const decrement = options?.count || 1;
    mockState.badge.count = Math.max(0, mockState.badge.count - decrement);
    log(`🔴 Mock Badge.decrease: -${decrement} (total: ${mockState.badge.count})`);
    return Promise.resolve();
  }),
};

// Background Mode Plugin
export const BackgroundMode = {
  enable: vi.fn(() => {
    log('🌙 Mock BackgroundMode.enable');
    mockState.background.isEnabled = true;
    mockState.background.isActive = true;
    return Promise.resolve();
  }),

  disable: vi.fn(() => {
    log('🌅 Mock BackgroundMode.disable');
    mockState.background.isEnabled = false;
    mockState.background.isActive = false;
    return Promise.resolve();
  }),

  isEnabled: vi.fn(() => {
    log('❓ Mock BackgroundMode.isEnabled');
    return Promise.resolve({ enabled: mockState.background.isEnabled });
  }),

  isActive: vi.fn(() => {
    log('❓ Mock BackgroundMode.isActive');
    return Promise.resolve({ activated: mockState.background.isActive });
  }),

  wakeUp: vi.fn(() => {
    log('⏰ Mock BackgroundMode.wakeUp');
    return Promise.resolve();
  }),

  unlock: vi.fn(() => {
    log('🔓 Mock BackgroundMode.unlock');
    return Promise.resolve();
  }),
};

// Keep Awake Plugin
export const KeepAwake = {
  keepAwake: vi.fn(() => {
    log('👁️ Mock KeepAwake.keepAwake');
    mockState.background.keepAwakeActive = true;
    return Promise.resolve();
  }),

  allowSleep: vi.fn(() => {
    log('😴 Mock KeepAwake.allowSleep');
    mockState.background.keepAwakeActive = false;
    return Promise.resolve();
  }),

  isSupported: vi.fn(() => {
    log('❓ Mock KeepAwake.isSupported');
    return Promise.resolve({ supported: mockState.device.isNative });
  }),

  isKeptAwake: vi.fn(() => {
    log('❓ Mock KeepAwake.isKeptAwake');
    return Promise.resolve({ kept: mockState.background.keepAwakeActive });
  }),
};

// Camera Plugin
export const Camera = {
  getPhoto: vi.fn((options: any) => {
    log('📷 Mock Camera.getPhoto', options);
    return Promise.resolve({
      base64String: 'mock-base64-image-data',
      dataUrl: 'data:image/jpeg;base64,mock-base64-image-data',
      format: 'jpeg',
      saved: false,
    });
  }),

  requestPermissions: vi.fn(() => {
    log('🔐 Mock Camera.requestPermissions');
    return Promise.resolve({
      camera: mockState.device.permissions.camera,
      photos: mockState.device.permissions.camera,
    });
  }),

  checkPermissions: vi.fn(() => {
    log('🔍 Mock Camera.checkPermissions');
    return Promise.resolve({
      camera: mockState.device.permissions.camera,
      photos: mockState.device.permissions.camera,
    });
  }),
};

// Filesystem Plugin
export const Filesystem = {
  readFile: vi.fn((options: { path: string }) => {
    log(`📖 Mock Filesystem.readFile: ${options.path}`);
    const file = mockState.filesystem.files.get(options.path);
    if (file) {
      return Promise.resolve({ data: file.data });
    }
    return Promise.reject(new Error('File not found'));
  }),

  writeFile: vi.fn((options: { path: string; data: string; directory?: string }) => {
    log(`📝 Mock Filesystem.writeFile: ${options.path}`);
    mockState.filesystem.files.set(options.path, {
      data: options.data,
      mimeType: 'text/plain',
    });
    return Promise.resolve({ uri: `file://${options.path}` });
  }),

  deleteFile: vi.fn((options: { path: string }) => {
    log(`🗑️ Mock Filesystem.deleteFile: ${options.path}`);
    mockState.filesystem.files.delete(options.path);
    return Promise.resolve();
  }),

  mkdir: vi.fn((options: { path: string }) => {
    log(`📁 Mock Filesystem.mkdir: ${options.path}`);
    return Promise.resolve();
  }),

  rmdir: vi.fn((options: { path: string }) => {
    log(`🗂️ Mock Filesystem.rmdir: ${options.path}`);
    return Promise.resolve();
  }),

  readdir: vi.fn((options: { path: string }) => {
    log(`📋 Mock Filesystem.readdir: ${options.path}`);
    const files = Array.from(mockState.filesystem.files.keys())
      .filter(path => path.startsWith(options.path))
      .map(path => ({
        name: path.split('/').pop() || '',
        type: 'file',
        size: 0,
        ctime: 0,
        mtime: 0,
        uri: path,
      }));
    return Promise.resolve({ files });
  }),

  getUri: vi.fn((options: { path: string }) => {
    log(`🔗 Mock Filesystem.getUri: ${options.path}`);
    return Promise.resolve({ uri: `file://${options.path}` });
  }),

  stat: vi.fn((options: { path: string }) => {
    log(`📊 Mock Filesystem.stat: ${options.path}`);
    const file = mockState.filesystem.files.get(options.path);
    if (file) {
      return Promise.resolve({
        type: 'file',
        size: file.data.length,
        ctime: 0,
        mtime: 0,
        uri: `file://${options.path}`,
      });
    }
    return Promise.reject(new Error('File not found'));
  }),
};

// Keyboard Plugin
export const Keyboard = {
  addListener: vi.fn((eventName: string, listenerFunc: (...args: unknown[]) => void) => {
    log(`👂 Mock Keyboard.addListener: ${eventName}`);
    return addMockListener('Keyboard', eventName, listenerFunc);
  }),

  removeAllListeners: vi.fn(() => {
    log('🔇 Mock Keyboard.removeAllListeners');
    for (const [key] of mockEventListeners) {
      if (key.startsWith('Keyboard:')) {
        mockEventListeners.delete(key);
      }
    }
    return Promise.resolve();
  }),

  show: vi.fn(() => {
    log('⌨️ Mock Keyboard.show');
    mockState.ui.keyboard.visible = true;
    mockState.ui.keyboard.height = 300;
    triggerMockEvent('Keyboard', 'keyboardWillShow', { keyboardHeight: 300 });
    triggerMockEvent('Keyboard', 'keyboardDidShow', { keyboardHeight: 300 });
    return Promise.resolve();
  }),

  hide: vi.fn(() => {
    log('⌨️ Mock Keyboard.hide');
    mockState.ui.keyboard.visible = false;
    mockState.ui.keyboard.height = 0;
    triggerMockEvent('Keyboard', 'keyboardWillHide', {});
    triggerMockEvent('Keyboard', 'keyboardDidHide', {});
    return Promise.resolve();
  }),

  setAccessoryBarVisible: vi.fn((options: { isVisible: boolean }) => {
    log(`⌨️ Mock Keyboard.setAccessoryBarVisible: ${options.isVisible}`);
    return Promise.resolve();
  }),

  setScroll: vi.fn((options: { isDisabled: boolean }) => {
    log(`⌨️ Mock Keyboard.setScroll: ${!options.isDisabled}`);
    return Promise.resolve();
  }),

  setStyle: vi.fn((options: { style: 'DARK' | 'LIGHT' }) => {
    log(`⌨️ Mock Keyboard.setStyle: ${options.style}`);
    return Promise.resolve();
  }),

  setResizeMode: vi.fn((options: { mode: 'body' | 'ionic' | 'native' }) => {
    log(`⌨️ Mock Keyboard.setResizeMode: ${options.mode}`);
    return Promise.resolve();
  }),
};

// Screen Orientation Plugin
export const ScreenOrientation = {
  orientation: vi.fn(() => {
    log('📱 Mock ScreenOrientation.orientation');
    return Promise.resolve({ type: 'portrait-primary' });
  }),

  lock: vi.fn((options: { orientation: string }) => {
    log(`📱 Mock ScreenOrientation.lock: ${options.orientation}`);
    return Promise.resolve();
  }),

  unlock: vi.fn(() => {
    log('📱 Mock ScreenOrientation.unlock');
    return Promise.resolve();
  }),

  addListener: vi.fn((eventName: string, listenerFunc: (...args: unknown[]) => void) => {
    log(`👂 Mock ScreenOrientation.addListener: ${eventName}`);
    return addMockListener('ScreenOrientation', eventName, listenerFunc);
  }),

  removeAllListeners: vi.fn(() => {
    log('🔇 Mock ScreenOrientation.removeAllListeners');
    for (const [key] of mockEventListeners) {
      if (key.startsWith('ScreenOrientation:')) {
        mockEventListeners.delete(key);
      }
    }
    return Promise.resolve();
  }),
};

// Browser Plugin
export const Browser = {
  open: vi.fn((options: { url: string; windowName?: string }) => {
    log(`🌐 Mock Browser.open: ${options.url}`);
    return Promise.resolve();
  }),

  close: vi.fn(() => {
    log('🌐 Mock Browser.close');
    return Promise.resolve();
  }),

  addListener: vi.fn((eventName: string, listenerFunc: (...args: unknown[]) => void) => {
    log(`👂 Mock Browser.addListener: ${eventName}`);
    return addMockListener('Browser', eventName, listenerFunc);
  }),

  removeAllListeners: vi.fn(() => {
    log('🔇 Mock Browser.removeAllListeners');
    for (const [key] of mockEventListeners) {
      if (key.startsWith('Browser:')) {
        mockEventListeners.delete(key);
      }
    }
    return Promise.resolve();
  }),
};

// Share Plugin
export const Share = {
  share: vi.fn(
    (options: { title?: string; text?: string; url?: string; files?: string[] }) => {
      log('📤 Mock Share.share', options);
      return Promise.resolve({ activityType: 'mock.share.activity' });
    }
  ),

  canShare: vi.fn(() => {
    log('❓ Mock Share.canShare');
    return Promise.resolve({ value: true });
  }),
};

// =============================================================================
// GLOBAL MOCK SETUP AND UTILITIES
// =============================================================================

export const _mockCapacitorSetup = {
  // Platform management
  setPlatform: (platform: Platform) => {
    if (!USE_REAL_DEVICE) {
      Capacitor._mockSetPlatform(platform);
    }
  },

  // Permission management
  setPermission: (
    permission: keyof typeof mockState.device.permissions,
    value: PermissionState
  ) => {
    if (!USE_REAL_DEVICE) {
      mockState.device.permissions[permission] = value;
      log(`🔐 Mock permission set: ${permission} = ${value}`);
    }
  },

  // Device configuration
  setDeviceInfo: (info: Partial<MockDeviceInfo>) => {
    if (!USE_REAL_DEVICE) {
      Object.assign(mockState.device.info, info);
      log('📱 Mock device info updated', info);
    }
  },

  setBatteryInfo: (info: Partial<MockBatteryInfo>) => {
    if (!USE_REAL_DEVICE) {
      Object.assign(mockState.device.battery, info);
      log('🔋 Mock battery info updated', info);
    }
  },

  // Network simulation
  setNetworkStatus: (status: Partial<MockNetworkStatus>) => {
    if (!USE_REAL_DEVICE) {
      Object.assign(mockState.network, status);
      triggerMockEvent('Network', 'networkStatusChange', mockState.network);
      log('🌐 Mock network status updated', status);
    }
  },

  // Alarm testing helpers
  scheduleTestAlarm: (alarmData: Partial<MockAlarmNotification>) => {
    if (!USE_REAL_DEVICE) {
      const id = alarmData.id || Date.now();
      const alarm: MockAlarmNotification = {
        title: 'Test Alarm',
        body: 'Test alarm body',
        ...alarmData,
        id,
        isAlarm: true,
      };
      mockState.alarms.scheduled.set(id, alarm);
      mockState.badge.count = mockState.alarms.scheduled.size;
      log(`⏰ Test alarm scheduled: ${id}`);
      return id;
    }
    return 0;
  },

  triggerAlarm: (alarmId: number) => {
    if (!USE_REAL_DEVICE) {
      LocalNotifications._mockTriggerNotification(alarmId);
    }
  },

  getScheduledAlarms: () => {
    if (!USE_REAL_DEVICE) {
      return Array.from(mockState.alarms.scheduled.values());
    }
    return [];
  },

  getActiveAlarms: () => {
    if (!USE_REAL_DEVICE) {
      return Array.from(mockState.alarms.active);
    }
    return [];
  },

  getAlarmHistory: () => {
    if (!USE_REAL_DEVICE) {
      return [...mockState.alarms.history];
    }
    return [];
  },

  // Audio testing helpers
  loadTestSound: (assetId: string, assetPath: string) => {
    if (!USE_REAL_DEVICE) {
      const asset: MockAudioAsset = {
        assetId,
        assetPath,
        duration: 30,
        isLoaded: true,
      };
      mockState.audio.loadedSounds.set(assetId, asset);
      log(`🎧 Test sound loaded: ${assetId}`);
      return Promise.resolve();
    }
  },

  playTestSound: (assetId: string) => {
    if (!USE_REAL_DEVICE) {
      const asset = mockState.audio.loadedSounds.get(assetId);
      if (asset) {
        mockState.audio.currentlyPlaying = assetId;
        mockState.audio.isPlaying = true;
        mockState.audio.isPaused = false;

        // Simulate audio completion
        setTimeout(() => {
          if (mockState.audio.currentlyPlaying === assetId) {
            mockState.audio.isPlaying = false;
            mockState.audio.currentlyPlaying = null;
          }
        }, asset.duration * 1000);

        log(`▶️ Test sound playing: ${assetId}`);
      }
    }
  },

  getLoadedSounds: () => {
    if (!USE_REAL_DEVICE) {
      return Array.from(mockState.audio.loadedSounds.keys());
    }
    return [];
  },

  getCurrentAudio: () => {
    if (!USE_REAL_DEVICE) {
      return {
        currentlyPlaying: mockState.audio.currentlyPlaying,
        isPlaying: mockState.audio.isPlaying,
        isPaused: mockState.audio.isPaused,
        volume: mockState.audio.volume,
      };
    }
    return null;
  },

  // Background testing helpers
  enableBackgroundMode: () => {
    if (!USE_REAL_DEVICE) {
      return BackgroundMode.enable();
    }
  },

  getBackgroundState: () => {
    if (!USE_REAL_DEVICE) {
      return { ...mockState.background };
    }
    return null;
  },

  // Event simulation
  triggerEvent: (pluginName: string, eventName: string, data?: any) => {
    if (!USE_REAL_DEVICE) {
      triggerMockEvent(pluginName, eventName, data);
    }
  },

  // File system helpers
  createMockFile: (path: string, data: string, mimeType: string = 'text/plain') => {
    if (!USE_REAL_DEVICE) {
      mockState.filesystem.files.set(path, { data, mimeType });
      log(`📝 Mock file created: ${path}`);
    }
  },

  // Complete reset
  reset: () => {
    if (!USE_REAL_DEVICE) {
      Capacitor._mockReset();
      log('🧹 Mock Capacitor completely reset');
    }
  },
};

// =============================================================================
// DEFAULT EXPORT FOR MODULE MOCKING
// =============================================================================

// Export individual plugins for targeted mocking
export {
  Capacitor,
  Device,
  LocalNotifications,
  PushNotifications,
  Haptics,
  Geolocation,
  Preferences,
  StatusBar,
  SplashScreen,
  App,
  Network,
  Badge,
  BackgroundMode,
  KeepAwake,
  Camera,
  Filesystem,
  Keyboard,
  ScreenOrientation,
  Browser,
  Share,
  _mockCapacitorSetup,
};

// Default export for jest.mock() usage
const CapacitorMock = {
  Capacitor,
  Device,
  LocalNotifications,
  PushNotifications,
  Haptics,
  Geolocation,
  Preferences,
  StatusBar,
  SplashScreen,
  App,
  Network,
  Badge,
  BackgroundMode,
  KeepAwake,
  Camera,
  Filesystem,
  Keyboard,
  ScreenOrientation,
  Browser,
  Share,
  _mockCapacitorSetup,
};

export default CapacitorMock;

// =============================================================================
// GLOBAL INITIALIZATION
// =============================================================================

// Initialize global references for testing utilities
if (typeof global !== 'undefined') {
  // Make mock setup available globally for easy testing
  (global as any).mockCapacitor = _mockCapacitorSetup;

  // Initialize event listener tracking
  (global as any).mockEventListeners = mockEventListeners;

  // Make state accessible for advanced testing scenarios
  (global as any).mockCapacitorState = mockState;

  log('🧪 Global Capacitor mock utilities initialized');
}

// =============================================================================
// VITEST MOCK REGISTRATION
// =============================================================================

// Auto-register mocks for common Capacitor modules when not using real device
if (!USE_REAL_DEVICE) {
  // Core Capacitor
  vi.mock('@capacitor/core', () => ({ Capacitor }));

  // Individual plugins
  vi.mock('@capacitor/device', () => ({ Device }));
  vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications }));
  vi.mock('@capacitor/push-notifications', () => ({ PushNotifications }));
  vi.mock('@capacitor/haptics', () => ({ Haptics }));
  vi.mock('@capacitor/geolocation', () => ({ Geolocation }));
  vi.mock('@capacitor/preferences', () => ({ Preferences }));
  vi.mock('@capacitor/status-bar', () => ({ StatusBar }));
  vi.mock('@capacitor/splash-screen', () => ({ SplashScreen }));
  vi.mock('@capacitor/app', () => ({ App }));
  vi.mock('@capacitor/network', () => ({ Network }));
  vi.mock('@capacitor/badge', () => ({ Badge }));
  vi.mock('@capacitor/camera', () => ({ Camera }));
  vi.mock('@capacitor/filesystem', () => ({ Filesystem }));
  vi.mock('@capacitor/keyboard', () => ({ Keyboard }));
  vi.mock('@capacitor/screen-orientation', () => ({ ScreenOrientation }));
  vi.mock('@capacitor/browser', () => ({ Browser }));
  vi.mock('@capacitor/share', () => ({ Share }));

  // Community plugins
  vi.mock('@capacitor-community/background-mode', () => ({ BackgroundMode }));
  vi.mock('@capacitor-community/keep-awake', () => ({ KeepAwake }));

  log('🔌 Capacitor plugin mocks auto-registered for Vitest');
}

// =============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// =============================================================================

// Legacy exports for existing tests
export const _Capacitor = Capacitor;
export const _Device = Device;
export const _LocalNotifications = LocalNotifications;
export const _PushNotifications = PushNotifications;
export const _Haptics = Haptics;
export const _Geolocation = Geolocation;
export const _Preferences = Preferences;
export const _StatusBar = StatusBar;
export const _SplashScreen = SplashScreen;
export const _App = App;
export const _Network = Network;
export const _Badge = Badge;
export const _BackgroundMode = BackgroundMode;
export const _KeepAwake = KeepAwake;
export const _Camera = Camera;
export const _Filesystem = Filesystem;
export const _Keyboard = Keyboard;
export const _ScreenOrientation = ScreenOrientation;
export const _Browser = Browser;
export const _Share = Share;

// Audio Manager mock (for backward compatibility)
export const AudioManager = {
  preload: vi.fn(
    (options: {
      assetId: string;
      assetPath: string;
      audioChannelNum?: number;
      isUrl?: boolean;
    }) => {
      log(`🎧 Mock AudioManager.preload: ${options.assetId}`);
      const asset: MockAudioAsset = {
        assetId: options.assetId,
        assetPath: options.assetPath,
        duration: 30,
        isLoaded: true,
      };
      mockState.audio.loadedSounds.set(options.assetId, asset);
      return Promise.resolve({ assetId: options.assetId });
    }
  ),

  play: vi.fn((options: { assetId: string; time?: number }) => {
    log(`▶️ Mock AudioManager.play: ${options.assetId}`);
    mockState.audio.currentlyPlaying = options.assetId;
    mockState.audio.isPlaying = true;
    mockState.audio.isPaused = false;

    // Simulate audio completion
    const sound = mockState.audio.loadedSounds.get(options.assetId);
    if (sound) {
      setTimeout(() => {
        if (mockState.audio.currentlyPlaying === options.assetId) {
          mockState.audio.isPlaying = false;
          mockState.audio.currentlyPlaying = null;
        }
      }, sound.duration * 1000);
    }

    return Promise.resolve({ assetId: options.assetId });
  }),

  pause: vi.fn((options: { assetId: string }) => {
    log(`⏸️ Mock AudioManager.pause: ${options.assetId}`);
    if (mockState.audio.currentlyPlaying === options.assetId) {
      mockState.audio.isPaused = true;
      mockState.audio.isPlaying = false;
    }
    return Promise.resolve({ assetId: options.assetId });
  }),

  resume: vi.fn((options: { assetId: string }) => {
    log(`▶️ Mock AudioManager.resume: ${options.assetId}`);
    if (
      mockState.audio.currentlyPlaying === options.assetId &&
      mockState.audio.isPaused
    ) {
      mockState.audio.isPlaying = true;
      mockState.audio.isPaused = false;
    }
    return Promise.resolve({ assetId: options.assetId });
  }),

  stop: vi.fn((options: { assetId: string }) => {
    log(`⏹️ Mock AudioManager.stop: ${options.assetId}`);
    if (mockState.audio.currentlyPlaying === options.assetId) {
      mockState.audio.isPlaying = false;
      mockState.audio.isPaused = false;
      mockState.audio.currentlyPlaying = null;
    }
    return Promise.resolve({ assetId: options.assetId });
  }),

  loop: vi.fn((options: { assetId: string }) => {
    log(`🔁 Mock AudioManager.loop: ${options.assetId}`);
    return Promise.resolve({ assetId: options.assetId });
  }),

  unload: vi.fn((options: { assetId: string }) => {
    log(`🗮 Mock AudioManager.unload: ${options.assetId}`);
    mockState.audio.loadedSounds.delete(options.assetId);
    if (mockState.audio.currentlyPlaying === options.assetId) {
      mockState.audio.currentlyPlaying = null;
      mockState.audio.isPlaying = false;
      mockState.audio.isPaused = false;
    }
    return Promise.resolve({ assetId: options.assetId });
  }),

  setVolume: vi.fn((options: { assetId: string; volume: number }) => {
    log(`🔊 Mock AudioManager.setVolume: ${options.assetId} = ${options.volume}`);
    mockState.audio.volume = options.volume;
    return Promise.resolve({ assetId: options.assetId });
  }),

  isPlaying: vi.fn((options: { assetId: string }) => {
    log(`❓ Mock AudioManager.isPlaying: ${options.assetId}`);
    const isCurrentlyPlaying =
      mockState.audio.currentlyPlaying === options.assetId && mockState.audio.isPlaying;
    return Promise.resolve({
      assetId: options.assetId,
      isPlaying: isCurrentlyPlaying,
    });
  }),
};

export const _AudioManager = AudioManager;

// Web Audio API mock
export const WebAudioAPI = {
  createAudioContext: vi.fn(() => ({
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 440 },
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: { value: 1.0 },
    })),
    destination: {},
    state: 'running',
    resume: vi.fn(() => Promise.resolve()),
  })),

  mockPlaySound: vi.fn((soundId: string, options?: any) => {
    log(`🔊 Mock WebAudio.mockPlaySound: ${soundId}`, options);
    mockState.audio.currentlyPlaying = soundId;
    mockState.audio.isPlaying = true;
    return Promise.resolve();
  }),
};

export const _WebAudioAPI = WebAudioAPI;
