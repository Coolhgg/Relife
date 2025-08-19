// Enhanced Capacitor mobile plugins mock for testing

/**
 * Comprehensive Capacitor mock for testing mobile functionality
 * Provides all plugins used in the application with proper jest/vitest mocks
 * Supports USE_REAL_DEVICE environment variable for testing with real devices
 */

import { vi } from 'vitest';

// Environment variable check for real device testing
const USE_REAL_DEVICE = process.env.USE_REAL_DEVICE === 'true';

// If using real device, don't use mocks (handled at module level)
if (USE_REAL_DEVICE) {
  console.log('🔥 Using REAL Capacitor plugins (USE_REAL_DEVICE=true)');
} else {
  console.log('🧪 Using MOCK Capacitor plugins for testing');
}

// Mock alarm state for testing
const mockAlarmState = {
  scheduledAlarms: new Map<number, any>(),
  activeAlarms: new Set<number>(),
  alarmHistory: [] as any[]
};

// Mock audio state for testing
const mockAudioState = {
  currentlyPlaying: null as string | null,
  volume: 1.0,
  isPlaying: false,
  isPaused: false,
  loadedSounds: new Map<string, any>()
};

// Mock background state
const mockBackgroundState = {
  isEnabled: false,
  isActive: false,
  keepAwakeActive: false
};

// Mock device state
let mockDeviceState = {
  platform: 'web' as 'web' | 'ios' | 'android',
  isNative: false,
  deviceInfo: {
    platform: 'web',
    model: 'Unknown',
    operatingSystem: 'unknown',
    osVersion: 'unknown',
    manufacturer: 'Unknown',
    isVirtual: false,
    webViewVersion: 'Unknown'
  },
  permissions: {
    notifications: 'granted' as 'granted' | 'denied' | 'prompt',
    camera: 'granted' as 'granted' | 'denied' | 'prompt',
    microphone: 'granted' as 'granted' | 'denied' | 'prompt',
    location: 'granted' as 'granted' | 'denied' | 'prompt'
  }
};

// Core Capacitor mock
export const Capacitor = {
  // Platform detection
  getPlatform: vi.fn(() => {
    console.log(`📱 Mock Capacitor getPlatform: ${mockDeviceState.platform}`);
    return mockDeviceState.platform;
  }),

  isNativePlatform: vi.fn(() => {
    console.log(`📱 Mock Capacitor isNativePlatform: ${mockDeviceState.isNative}`);
    return mockDeviceState.isNative;
  }),

  // Plugin availability
  isPluginAvailable: vi.fn((pluginName: string) => {
    console.log(`🔌 Mock Capacitor isPluginAvailable: ${pluginName}`);
    return true; // Assume all plugins are available for testing
  }),

  // Convert file source to web viewable
  convertFileSrc: vi.fn((filePath: string) => {
    console.log(`🔗 Mock Capacitor convertFileSrc: ${filePath}`);
    return `capacitor://localhost/_capacitor_file_${encodeURIComponent(filePath)}`;
  }),

  // Internal methods for testing
  _mockSetPlatform: vi.fn((platform: 'web' | 'ios' | 'android') => {
    mockDeviceState.platform = platform;
    mockDeviceState.isNative = platform !== 'web';
    console.log(`📱 Mock Capacitor platform set to: ${platform}`);
  }),

  _mockReset: vi.fn(() => {
    mockDeviceState = {
      platform: 'web',
      isNative: false,
      deviceInfo: {
        platform: 'web',
        model: 'Unknown',
        operatingSystem: 'unknown',
        osVersion: 'unknown',
        manufacturer: 'Unknown',
        isVirtual: false,
        webViewVersion: 'Unknown'
      },
      permissions: {
        notifications: 'granted',
        camera: 'granted',
        microphone: 'granted',
        location: 'granted'
      }
    };
    console.log('🧹 Mock Capacitor reset');
  })
};

// Device plugin
export const Device = {
  getInfo: vi.fn(() => {
    console.log('📱 Mock Device getInfo');
    return Promise.resolve({
      ...mockDeviceState.deviceInfo,
      name: 'Mock Device',
      diskFree: 1000000000,
      diskTotal: 16000000000,
      memUsed: 500000000,
      realDiskFree: 1000000000,
      realDiskTotal: 16000000000
    });
  }),

  getId: vi.fn(() => {
    console.log('🆔 Mock Device getId');
    return Promise.resolve({
      identifier: 'mock-device-id-12345'
    });
  }),

  getLanguageCode: vi.fn(() => {
    console.log('🌐 Mock Device getLanguageCode');
    return Promise.resolve({
      value: 'en'
    });
  }),

  getBatteryInfo: vi.fn(() => {
    console.log('🔋 Mock Device getBatteryInfo');
    return Promise.resolve({
      batteryLevel: 0.85,
      isCharging: false
    });
  })
};

// Local Notifications plugin (original version - replaced by enhanced version below)
const OriginalLocalNotifications = {
  schedule: vi.fn((options: { notifications: any[] }) => {
    console.log('🔔 Mock LocalNotifications schedule', options.notifications.length);
    return Promise.resolve({
      notifications: options.notifications.map((notification, index) => ({
        id: notification.id || index + 1,
        ...notification
      }))
    });
  }),

  getPending: vi.fn(() => {
    console.log('⏳ Mock LocalNotifications getPending');
    return Promise.resolve({
      notifications: []
    });
  }),

  registerActionTypes: vi.fn((options: { types: any[] }) => {
    console.log('⚡ Mock LocalNotifications registerActionTypes', options.types.length);
    return Promise.resolve();
  }),

  cancel: vi.fn((options: { notifications: any[] }) => {
    console.log('❌ Mock LocalNotifications cancel', options.notifications.length);
    return Promise.resolve();
  }),

  areEnabled: vi.fn(() => {
    console.log('❓ Mock LocalNotifications areEnabled');
    return Promise.resolve({
      value: mockDeviceState.permissions.notifications === 'granted'
    });
  }),

  requestPermissions: vi.fn(() => {
    console.log('🔐 Mock LocalNotifications requestPermissions');
    return Promise.resolve({
      display: mockDeviceState.permissions.notifications
    });
  }),

  checkPermissions: vi.fn(() => {
    console.log('🔍 Mock LocalNotifications checkPermissions');
    return Promise.resolve({
      display: mockDeviceState.permissions.notifications
    });
  }),

  addListener: vi.fn((eventName: string, listenerFunc: Function) => {
    console.log(`👂 Mock LocalNotifications addListener: ${eventName}`);
    return {
      remove: vi.fn(() => {
        console.log(`🔇 Mock LocalNotifications listener removed: ${eventName}`);
      })
    };
  }),

  removeAllListeners: vi.fn(() => {
    console.log('🔇 Mock LocalNotifications removeAllListeners');
    return Promise.resolve();
  })
};

// Push Notifications plugin
export const PushNotifications = {
  register: vi.fn(() => {
    console.log('📨 Mock PushNotifications register');
    return Promise.resolve();
  }),

  requestPermissions: vi.fn(() => {
    console.log('🔐 Mock PushNotifications requestPermissions');
    return Promise.resolve({
      receive: mockDeviceState.permissions.notifications
    });
  }),

  checkPermissions: vi.fn(() => {
    console.log('🔍 Mock PushNotifications checkPermissions');
    return Promise.resolve({
      receive: mockDeviceState.permissions.notifications
    });
  }),

  addListener: vi.fn((eventName: string, listenerFunc: Function) => {
    console.log(`👂 Mock PushNotifications addListener: ${eventName}`);

    // Simulate registration success
    if (eventName === 'registration') {
      setTimeout(() => {
        listenerFunc({
          value: 'mock-registration-token-12345'
        });
      }, 100);
    }

    return {
      remove: vi.fn(() => {
        console.log(`🔇 Mock PushNotifications listener removed: ${eventName}`);
      })
    };
  }),

  removeAllListeners: vi.fn(() => {
    console.log('🔇 Mock PushNotifications removeAllListeners');
    return Promise.resolve();
  })
};

// Haptics plugin
export const Haptics = {
  impact: vi.fn((options?: { style?: 'LIGHT' | 'MEDIUM' | 'HEAVY' }) => {
    console.log('📳 Mock Haptics impact', options?.style || 'MEDIUM');
    return Promise.resolve();
  }),

  notification: vi.fn((options?: { type?: 'SUCCESS' | 'WARNING' | 'ERROR' }) => {
    console.log('📳 Mock Haptics notification', options?.type || 'SUCCESS');
    return Promise.resolve();
  }),

  vibrate: vi.fn((options?: { duration?: number }) => {
    console.log('📳 Mock Haptics vibrate', options?.duration || 300);
    return Promise.resolve();
  }),

  selectionStart: vi.fn(() => {
    console.log('📳 Mock Haptics selectionStart');
    return Promise.resolve();
  }),

  selectionChanged: vi.fn(() => {
    console.log('📳 Mock Haptics selectionChanged');
    return Promise.resolve();
  }),

  selectionEnd: vi.fn(() => {
    console.log('📳 Mock Haptics selectionEnd');
    return Promise.resolve();
  })
};

// Geolocation plugin
export const Geolocation = {
  getCurrentPosition: vi.fn((options?: any) => {
    console.log('🌍 Mock Geolocation getCurrentPosition', options);
    return Promise.resolve({
      timestamp: Date.now(),
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      }
    });
  }),

  watchPosition: vi.fn((options?: any, callback?: Function) => {
    console.log('👀 Mock Geolocation watchPosition', options);

    if (callback) {
      const watchId = `mock-watch-${Math.random().toString(36).substr(2, 9)}`;

      // Simulate position updates
      const interval = setInterval(() => {
        callback(null, {
          timestamp: Date.now(),
          coords: {
            latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
            longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          }
        });
      }, 1000);

      // Store interval for cleanup
      (global as any).mockGeoWatchIntervals = (global as any).mockGeoWatchIntervals || new Map();
      (global as any).mockGeoWatchIntervals.set(watchId, interval);

      return watchId;
    }

    return Promise.resolve('mock-watch-id');
  }),

  clearWatch: vi.fn((options: { id: string }) => {
    console.log('🛑 Mock Geolocation clearWatch', options.id);

    const intervals = (global as any).mockGeoWatchIntervals;
    if (intervals && intervals.has(options.id)) {
      clearInterval(intervals.get(options.id));
      intervals.delete(options.id);
    }

    return Promise.resolve();
  }),

  checkPermissions: vi.fn(() => {
    console.log('🔍 Mock Geolocation checkPermissions');
    return Promise.resolve({
      location: mockDeviceState.permissions.location,
      coarseLocation: mockDeviceState.permissions.location
    });
  }),

  requestPermissions: vi.fn(() => {
    console.log('🔐 Mock Geolocation requestPermissions');
    return Promise.resolve({
      location: mockDeviceState.permissions.location,
      coarseLocation: mockDeviceState.permissions.location
    });
  })
};

// Preferences plugin (for local storage)
export const Preferences = {
  configure: vi.fn((options: { group?: string }) => {
    console.log('⚙️ Mock Preferences configure', options);
    return Promise.resolve();
  }),

  get: vi.fn((options: { key: string }) => {
    console.log(`🔍 Mock Preferences get: ${options.key}`);
    const value = localStorage.getItem(options.key);
    return Promise.resolve({ value });
  }),

  set: vi.fn((options: { key: string; value: string }) => {
    console.log(`💾 Mock Preferences set: ${options.key} = ${options.value}`);
    localStorage.setItem(options.key, options.value);
    return Promise.resolve();
  }),

  remove: vi.fn((options: { key: string }) => {
    console.log(`🗑️ Mock Preferences remove: ${options.key}`);
    localStorage.removeItem(options.key);
    return Promise.resolve();
  }),

  clear: vi.fn(() => {
    console.log('🧹 Mock Preferences clear');
    localStorage.clear();
    return Promise.resolve();
  }),

  keys: vi.fn(() => {
    console.log('🔑 Mock Preferences keys');
    const keys = Object.keys(localStorage);
    return Promise.resolve({ keys });
  })
};

// Status Bar plugin
export const StatusBar = {
  setStyle: vi.fn((options: { style: 'LIGHT' | 'DARK' | 'DEFAULT' }) => {
    console.log(`🎨 Mock StatusBar setStyle: ${options.style}`);
    return Promise.resolve();
  }),

  setBackgroundColor: vi.fn((options: { color: string }) => {
    console.log(`🎨 Mock StatusBar setBackgroundColor: ${options.color}`);
    return Promise.resolve();
  }),

  show: vi.fn(() => {
    console.log('👁️ Mock StatusBar show');
    return Promise.resolve();
  }),

  hide: vi.fn(() => {
    console.log('🙈 Mock StatusBar hide');
    return Promise.resolve();
  }),

  setOverlaysWebView: vi.fn((options: { overlay: boolean }) => {
    console.log(`📱 Mock StatusBar setOverlaysWebView: ${options.overlay}`);
    return Promise.resolve();
  })
};

// Splash Screen plugin
export const SplashScreen = {
  show: vi.fn((options?: { showDuration?: number; fadeInDuration?: number; fadeOutDuration?: number; autoHide?: boolean }) => {
    console.log('💫 Mock SplashScreen show', options);
    return Promise.resolve();
  }),

  hide: vi.fn((options?: { fadeOutDuration?: number }) => {
    console.log('🙈 Mock SplashScreen hide', options);
    return Promise.resolve();
  })
};

// Global mock setup methods (original version - replaced by enhanced version below)
const _originalMockCapacitorSetup = {
  setPlatform: (platform: 'web' | 'ios' | 'android') => {
    Capacitor._mockSetPlatform(platform);
  },

  setPermission: (permission: keyof typeof mockDeviceState.permissions, value: 'granted' | 'denied' | 'prompt') => {
    mockDeviceState.permissions[permission] = value;
    console.log(`🔐 Mock permission set: ${permission} = ${value}`);
  },

  setDeviceInfo: (info: Partial<typeof mockDeviceState.deviceInfo>) => {
    Object.assign(mockDeviceState.deviceInfo, info);
    console.log('📱 Mock device info updated', info);
  },

  reset: () => {
    Capacitor._mockReset();

    // Clear any watch intervals
    if ((global as any).mockGeoWatchIntervals) {
      (global as any).mockGeoWatchIntervals.forEach((interval: any) => {
        clearInterval(interval);
      });
      (global as any).mockGeoWatchIntervals.clear();
    }

    console.log('🧹 Mock Capacitor fully reset');
  }
};

// Background Mode plugin (for alarm reliability)
export const BackgroundMode = {
  enable: vi.fn(() => {
    console.log('🌙 Mock BackgroundMode enable');
    mockBackgroundState.isEnabled = true;
    mockBackgroundState.isActive = true;
    return Promise.resolve();
  }),

  disable: vi.fn(() => {
    console.log('🌅 Mock BackgroundMode disable');
    mockBackgroundState.isEnabled = false;
    mockBackgroundState.isActive = false;
    return Promise.resolve();
  }),

  isEnabled: vi.fn(() => {
    console.log('❓ Mock BackgroundMode isEnabled');
    return Promise.resolve({ enabled: mockBackgroundState.isEnabled });
  }),

  isActive: vi.fn(() => {
    console.log('❓ Mock BackgroundMode isActive');
    return Promise.resolve({ activated: mockBackgroundState.isActive });
  }),

  wakeUp: vi.fn(() => {
    console.log('⏰ Mock BackgroundMode wakeUp');
    return Promise.resolve();
  }),

  unlock: vi.fn(() => {
    console.log('🔓 Mock BackgroundMode unlock');
    return Promise.resolve();
  })
};

// Keep Awake plugin (prevents device sleep during alarms)
export const KeepAwake = {
  keepAwake: vi.fn(() => {
    console.log('👁️ Mock KeepAwake keepAwake');
    mockBackgroundState.keepAwakeActive = true;
    return Promise.resolve();
  }),

  allowSleep: vi.fn(() => {
    console.log('😴 Mock KeepAwake allowSleep');
    mockBackgroundState.keepAwakeActive = false;
    return Promise.resolve();
  }),

  isSupported: vi.fn(() => {
    console.log('❓ Mock KeepAwake isSupported');
    return Promise.resolve({ supported: true });
  }),

  isKeptAwake: vi.fn(() => {
    console.log('❓ Mock KeepAwake isKeptAwake');
    return Promise.resolve({ kept: mockBackgroundState.keepAwakeActive });
  })
};

// Audio Manager plugin (for alarm sounds and audio playback)
export const AudioManager = {
  preload: vi.fn((options: { assetId: string; assetPath: string; audioChannelNum?: number; isUrl?: boolean }) => {
    console.log(`🎧 Mock AudioManager preload: ${options.assetId}`);
    mockAudioState.loadedSounds.set(options.assetId, {
      assetId: options.assetId,
      assetPath: options.assetPath,
      duration: 30, // Mock duration
      isLoaded: true
    });
    return Promise.resolve({ assetId: options.assetId });
  }),

  play: vi.fn((options: { assetId: string; time?: number }) => {
    console.log(`▶️ Mock AudioManager play: ${options.assetId}`);
    mockAudioState.currentlyPlaying = options.assetId;
    mockAudioState.isPlaying = true;
    mockAudioState.isPaused = false;

    // Simulate audio completion
    const sound = mockAudioState.loadedSounds.get(options.assetId);
    if (sound) {
      setTimeout(() => {
        if (mockAudioState.currentlyPlaying === options.assetId) {
          mockAudioState.isPlaying = false;
          mockAudioState.currentlyPlaying = null;
        }
      }, (sound.duration || 5) * 1000);
    }

    return Promise.resolve({ assetId: options.assetId });
  }),

  pause: vi.fn((options: { assetId: string }) => {
    console.log(`⏸️ Mock AudioManager pause: ${options.assetId}`);
    if (mockAudioState.currentlyPlaying === options.assetId) {
      mockAudioState.isPaused = true;
      mockAudioState.isPlaying = false;
    }
    return Promise.resolve({ assetId: options.assetId });
  }),

  resume: vi.fn((options: { assetId: string }) => {
    console.log(`▶️ Mock AudioManager resume: ${options.assetId}`);
    if (mockAudioState.currentlyPlaying === options.assetId && mockAudioState.isPaused) {
      mockAudioState.isPlaying = true;
      mockAudioState.isPaused = false;
    }
    return Promise.resolve({ assetId: options.assetId });
  }),

  stop: vi.fn((options: { assetId: string }) => {
    console.log(`⏹️ Mock AudioManager stop: ${options.assetId}`);
    if (mockAudioState.currentlyPlaying === options.assetId) {
      mockAudioState.isPlaying = false;
      mockAudioState.isPaused = false;
      mockAudioState.currentlyPlaying = null;
    }
    return Promise.resolve({ assetId: options.assetId });
  }),

  loop: vi.fn((options: { assetId: string }) => {
    console.log(`🔁 Mock AudioManager loop: ${options.assetId}`);
    return Promise.resolve({ assetId: options.assetId });
  }),

  unload: vi.fn((options: { assetId: string }) => {
    console.log(`🚮 Mock AudioManager unload: ${options.assetId}`);
    mockAudioState.loadedSounds.delete(options.assetId);
    if (mockAudioState.currentlyPlaying === options.assetId) {
      mockAudioState.currentlyPlaying = null;
      mockAudioState.isPlaying = false;
      mockAudioState.isPaused = false;
    }
    return Promise.resolve({ assetId: options.assetId });
  }),

  setVolume: vi.fn((options: { assetId: string; volume: number }) => {
    console.log(`🔊 Mock AudioManager setVolume: ${options.assetId} = ${options.volume}`);
    mockAudioState.volume = options.volume;
    return Promise.resolve({ assetId: options.assetId });
  }),

  isPlaying: vi.fn((options: { assetId: string }) => {
    console.log(`❓ Mock AudioManager isPlaying: ${options.assetId}`);
    const isCurrentlyPlaying = mockAudioState.currentlyPlaying === options.assetId && mockAudioState.isPlaying;
    return Promise.resolve({ assetId: options.assetId, isPlaying: isCurrentlyPlaying });
  })
};

// Web Audio API mock for browser testing
export const WebAudioAPI = {
  createAudioContext: vi.fn(() => ({
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 440 }
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: { value: 1.0 }
    })),
    destination: {},
    state: 'running',
    resume: vi.fn(() => Promise.resolve())
  })),

  mockPlaySound: vi.fn((soundId: string, options?: any) => {
    console.log(`🔊 Mock WebAudio playSound: ${soundId}`, options);
    mockAudioState.currentlyPlaying = soundId;
    mockAudioState.isPlaying = true;
    return Promise.resolve();
  })
};

// Enhanced Local Notifications with alarm-specific functionality
const enhancedLocalNotifications = {
  ...LocalNotifications,

  // Enhanced schedule method with alarm tracking
  schedule: vi.fn((options: { notifications: any[] }) => {
    console.log(`🔔 Mock Enhanced LocalNotifications schedule: ${options.notifications.length} alarms`);

    const scheduledNotifications = options.notifications.map((notification, index) => {
      const id = notification.id || Date.now() + index;
      const enhancedNotification = {
        id,
        ...notification,
        scheduledAt: Date.now(),
        isAlarm: notification.title?.includes('Alarm') || notification.extra?.isAlarm
      };

      // Track alarms specifically
      if (enhancedNotification.isAlarm) {
        mockAlarmState.scheduledAlarms.set(id, enhancedNotification);
        console.log(`⏰ Alarm scheduled: ID ${id} at ${notification.schedule?.at || 'recurring'}`);
      }

      return enhancedNotification;
    });

    return Promise.resolve({ notifications: scheduledNotifications });
  }),

  // Enhanced cancel with alarm tracking
  cancel: vi.fn((options: { notifications: any[] }) => {
    console.log(`❌ Mock Enhanced LocalNotifications cancel: ${options.notifications.length} notifications`);

    options.notifications.forEach(notification => {
      const id = typeof notification === 'object' ? notification.id : notification;
      if (mockAlarmState.scheduledAlarms.has(id)) {
        console.log(`⏰ Alarm cancelled: ID ${id}`);
        mockAlarmState.scheduledAlarms.delete(id);
      }
      mockAlarmState.activeAlarms.delete(id);
    });

    return Promise.resolve();
  }),

  // Get pending alarms specifically
  getPendingAlarms: vi.fn(() => {
    console.log('⏳ Mock LocalNotifications getPendingAlarms');
    const alarms = Array.from(mockAlarmState.scheduledAlarms.values());
    return Promise.resolve({ notifications: alarms });
  }),

  // Trigger an alarm for testing
  _mockTriggerAlarm: vi.fn((alarmId: number) => {
    console.log(`🔔 Mock trigger alarm: ${alarmId}`);
    if (mockAlarmState.scheduledAlarms.has(alarmId)) {
      const alarm = mockAlarmState.scheduledAlarms.get(alarmId);
      mockAlarmState.activeAlarms.add(alarmId);
      mockAlarmState.alarmHistory.push({
        ...alarm,
        triggeredAt: Date.now(),
        action: 'triggered'
      });

      // Simulate notification received event
      setTimeout(() => {
        if (global.mockNotificationListeners) {
          global.mockNotificationListeners.forEach((listener: Function) => {
            listener({
              notificationId: alarmId,
              actionId: 'default',
              inputValue: '',
              extra: alarm.extra || {}
            });
          });
        }
      }, 100);
    }
  })
};

// Replace LocalNotifications with enhanced version
export const LocalNotifications = enhancedLocalNotifications;

// Global mock setup methods (enhanced)
export const _mockCapacitorSetup = {
  setPlatform: (platform: 'web' | 'ios' | 'android') => {
    if (!USE_REAL_DEVICE && Capacitor._mockSetPlatform) {
      Capacitor._mockSetPlatform(platform);
    }
  },

  setPermission: (permission: keyof typeof mockDeviceState.permissions, value: 'granted' | 'denied' | 'prompt') => {
    if (!USE_REAL_DEVICE) {
      mockDeviceState.permissions[permission] = value;
      console.log(`🔐 Mock permission set: ${permission} = ${value}`);
    }
  },

  setDeviceInfo: (info: Partial<typeof mockDeviceState.deviceInfo>) => {
    if (!USE_REAL_DEVICE) {
      Object.assign(mockDeviceState.deviceInfo, info);
      console.log('📱 Mock device info updated', info);
    }
  },

  // Alarm-specific test helpers
  scheduleTestAlarm: (alarmData: any) => {
    if (!USE_REAL_DEVICE) {
      const id = alarmData.id || Date.now();
      mockAlarmState.scheduledAlarms.set(id, { ...alarmData, id, isAlarm: true });
      console.log(`⏰ Test alarm scheduled: ${id}`);
      return id;
    }
  },

  triggerAlarm: (alarmId: number) => {
    if (!USE_REAL_DEVICE && enhancedLocalNotifications._mockTriggerAlarm) {
      enhancedLocalNotifications._mockTriggerAlarm(alarmId);
    }
  },

  getScheduledAlarms: () => {
    if (!USE_REAL_DEVICE) {
      return Array.from(mockAlarmState.scheduledAlarms.values());
    }
    return [];
  },

  getActiveAlarms: () => {
    if (!USE_REAL_DEVICE) {
      return Array.from(mockAlarmState.activeAlarms);
    }
    return [];
  },

  getAlarmHistory: () => {
    if (!USE_REAL_DEVICE) {
      return [...mockAlarmState.alarmHistory];
    }
    return [];
  },

  // Audio test helpers
  loadTestSound: (assetId: string, assetPath: string) => {
    if (!USE_REAL_DEVICE && AudioManager.preload) {
      return AudioManager.preload({ assetId, assetPath });
    }
  },

  getLoadedSounds: () => {
    if (!USE_REAL_DEVICE) {
      return Array.from(mockAudioState.loadedSounds.keys());
    }
    return [];
  },

  getCurrentAudio: () => {
    if (!USE_REAL_DEVICE) {
      return {
        currentlyPlaying: mockAudioState.currentlyPlaying,
        isPlaying: mockAudioState.isPlaying,
        isPaused: mockAudioState.isPaused,
        volume: mockAudioState.volume
      };
    }
    return null;
  },

  // Background task helpers
  enableBackgroundMode: () => {
    if (!USE_REAL_DEVICE && BackgroundMode.enable) {
      return BackgroundMode.enable();
    }
  },

  getBackgroundState: () => {
    if (!USE_REAL_DEVICE) {
      return { ...mockBackgroundState };
    }
    return null;
  },

  reset: () => {
    if (!USE_REAL_DEVICE) {
      // Reset base Capacitor state
      if (Capacitor._mockReset) {
        Capacitor._mockReset();
      }

      // Reset alarm state
      mockAlarmState.scheduledAlarms.clear();
      mockAlarmState.activeAlarms.clear();
      mockAlarmState.alarmHistory.length = 0;

      // Reset audio state
      mockAudioState.currentlyPlaying = null;
      mockAudioState.isPlaying = false;
      mockAudioState.isPaused = false;
      mockAudioState.volume = 1.0;
      mockAudioState.loadedSounds.clear();

      // Reset background state
      mockBackgroundState.isEnabled = false;
      mockBackgroundState.isActive = false;
      mockBackgroundState.keepAwakeActive = false;

      // Clear any watch intervals
      if ((global as any).mockGeoWatchIntervals) {
        (global as any).mockGeoWatchIntervals.forEach((interval: any) => {
          clearInterval(interval);
        });
        (global as any).mockGeoWatchIntervals.clear();
      }

      console.log('🧹 Enhanced Mock Capacitor fully reset');
    }
  }
};

// Default export for jest.mock
export default {
  Capacitor,
  Device,
  LocalNotifications,
  PushNotifications,
  Haptics,
  Geolocation,
  Preferences,
  StatusBar,
  SplashScreen,
  BackgroundMode,
  KeepAwake,
  AudioManager,
  _mockCapacitorSetup,
  WebAudioAPI
};

// Initialize global mock notification listeners
if (typeof global !== 'undefined') {
  global.mockNotificationListeners = global.mockNotificationListeners || [];
}