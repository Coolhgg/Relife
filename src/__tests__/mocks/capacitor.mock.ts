// Capacitor mobile plugins mock for testing

/**
 * Comprehensive Capacitor mock for testing mobile functionality
 * Provides all plugins used in the application with proper jest mocks
 */

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
  getPlatform: jest.fn(() => {
    console.log(`📱 Mock Capacitor getPlatform: ${mockDeviceState.platform}`);
    return mockDeviceState.platform;
  }),

  isNativePlatform: jest.fn(() => {
    console.log(`📱 Mock Capacitor isNativePlatform: ${mockDeviceState.isNative}`);
    return mockDeviceState.isNative;
  }),

  // Plugin availability
  isPluginAvailable: jest.fn((pluginName: string) => {
    console.log(`🔌 Mock Capacitor isPluginAvailable: ${pluginName}`);
    return true; // Assume all plugins are available for testing
  }),

  // Convert file source to web viewable
  convertFileSrc: jest.fn((filePath: string) => {
    console.log(`🔗 Mock Capacitor convertFileSrc: ${filePath}`);
    return `capacitor://localhost/_capacitor_file_${encodeURIComponent(filePath)}`;
  }),

  // Internal methods for testing
  _mockSetPlatform: jest.fn((platform: 'web' | 'ios' | 'android') => {
    mockDeviceState.platform = platform;
    mockDeviceState.isNative = platform !== 'web';
    console.log(`📱 Mock Capacitor platform set to: ${platform}`);
  }),

  _mockReset: jest.fn(() => {
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
  getInfo: jest.fn(() => {
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

  getId: jest.fn(() => {
    console.log('🆔 Mock Device getId');
    return Promise.resolve({
      identifier: 'mock-device-id-12345'
    });
  }),

  getLanguageCode: jest.fn(() => {
    console.log('🌐 Mock Device getLanguageCode');
    return Promise.resolve({
      value: 'en'
    });
  }),

  getBatteryInfo: jest.fn(() => {
    console.log('🔋 Mock Device getBatteryInfo');
    return Promise.resolve({
      batteryLevel: 0.85,
      isCharging: false
    });
  })
};

// Local Notifications plugin
export const LocalNotifications = {
  schedule: jest.fn((options: { notifications: any[] }) => {
    console.log('🔔 Mock LocalNotifications schedule', options.notifications.length);
    return Promise.resolve({
      notifications: options.notifications.map((notification, index) => ({
        id: notification.id || index + 1,
        ...notification
      }))
    });
  }),

  getPending: jest.fn(() => {
    console.log('⏳ Mock LocalNotifications getPending');
    return Promise.resolve({
      notifications: []
    });
  }),

  registerActionTypes: jest.fn((options: { types: any[] }) => {
    console.log('⚡ Mock LocalNotifications registerActionTypes', options.types.length);
    return Promise.resolve();
  }),

  cancel: jest.fn((options: { notifications: any[] }) => {
    console.log('❌ Mock LocalNotifications cancel', options.notifications.length);
    return Promise.resolve();
  }),

  areEnabled: jest.fn(() => {
    console.log('❓ Mock LocalNotifications areEnabled');
    return Promise.resolve({
      value: mockDeviceState.permissions.notifications === 'granted'
    });
  }),

  requestPermissions: jest.fn(() => {
    console.log('🔐 Mock LocalNotifications requestPermissions');
    return Promise.resolve({
      display: mockDeviceState.permissions.notifications
    });
  }),

  checkPermissions: jest.fn(() => {
    console.log('🔍 Mock LocalNotifications checkPermissions');
    return Promise.resolve({
      display: mockDeviceState.permissions.notifications
    });
  }),

  addListener: jest.fn((eventName: string, listenerFunc: Function) => {
    console.log(`👂 Mock LocalNotifications addListener: ${eventName}`);
    return {
      remove: jest.fn(() => {
        console.log(`🔇 Mock LocalNotifications listener removed: ${eventName}`);
      })
    };
  }),

  removeAllListeners: jest.fn(() => {
    console.log('🔇 Mock LocalNotifications removeAllListeners');
    return Promise.resolve();
  })
};

// Push Notifications plugin
export const PushNotifications = {
  register: jest.fn(() => {
    console.log('📨 Mock PushNotifications register');
    return Promise.resolve();
  }),

  requestPermissions: jest.fn(() => {
    console.log('🔐 Mock PushNotifications requestPermissions');
    return Promise.resolve({
      receive: mockDeviceState.permissions.notifications
    });
  }),

  checkPermissions: jest.fn(() => {
    console.log('🔍 Mock PushNotifications checkPermissions');
    return Promise.resolve({
      receive: mockDeviceState.permissions.notifications
    });
  }),

  addListener: jest.fn((eventName: string, listenerFunc: Function) => {
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
      remove: jest.fn(() => {
        console.log(`🔇 Mock PushNotifications listener removed: ${eventName}`);
      })
    };
  }),

  removeAllListeners: jest.fn(() => {
    console.log('🔇 Mock PushNotifications removeAllListeners');
    return Promise.resolve();
  })
};

// Haptics plugin
export const Haptics = {
  impact: jest.fn((options?: { style?: 'LIGHT' | 'MEDIUM' | 'HEAVY' }) => {
    console.log('📳 Mock Haptics impact', options?.style || 'MEDIUM');
    return Promise.resolve();
  }),

  notification: jest.fn((options?: { type?: 'SUCCESS' | 'WARNING' | 'ERROR' }) => {
    console.log('📳 Mock Haptics notification', options?.type || 'SUCCESS');
    return Promise.resolve();
  }),

  vibrate: jest.fn((options?: { duration?: number }) => {
    console.log('📳 Mock Haptics vibrate', options?.duration || 300);
    return Promise.resolve();
  }),

  selectionStart: jest.fn(() => {
    console.log('📳 Mock Haptics selectionStart');
    return Promise.resolve();
  }),

  selectionChanged: jest.fn(() => {
    console.log('📳 Mock Haptics selectionChanged');
    return Promise.resolve();
  }),

  selectionEnd: jest.fn(() => {
    console.log('📳 Mock Haptics selectionEnd');
    return Promise.resolve();
  })
};

// Geolocation plugin
export const Geolocation = {
  getCurrentPosition: jest.fn((options?: any) => {
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

  watchPosition: jest.fn((options?: any, callback?: Function) => {
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

  clearWatch: jest.fn((options: { id: string }) => {
    console.log('🛑 Mock Geolocation clearWatch', options.id);
    
    const intervals = (global as any).mockGeoWatchIntervals;
    if (intervals && intervals.has(options.id)) {
      clearInterval(intervals.get(options.id));
      intervals.delete(options.id);
    }
    
    return Promise.resolve();
  }),

  checkPermissions: jest.fn(() => {
    console.log('🔍 Mock Geolocation checkPermissions');
    return Promise.resolve({
      location: mockDeviceState.permissions.location,
      coarseLocation: mockDeviceState.permissions.location
    });
  }),

  requestPermissions: jest.fn(() => {
    console.log('🔐 Mock Geolocation requestPermissions');
    return Promise.resolve({
      location: mockDeviceState.permissions.location,
      coarseLocation: mockDeviceState.permissions.location
    });
  })
};

// Preferences plugin (for local storage)
export const Preferences = {
  configure: jest.fn((options: { group?: string }) => {
    console.log('⚙️ Mock Preferences configure', options);
    return Promise.resolve();
  }),

  get: jest.fn((options: { key: string }) => {
    console.log(`🔍 Mock Preferences get: ${options.key}`);
    const value = localStorage.getItem(options.key);
    return Promise.resolve({ value });
  }),

  set: jest.fn((options: { key: string; value: string }) => {
    console.log(`💾 Mock Preferences set: ${options.key} = ${options.value}`);
    localStorage.setItem(options.key, options.value);
    return Promise.resolve();
  }),

  remove: jest.fn((options: { key: string }) => {
    console.log(`🗑️ Mock Preferences remove: ${options.key}`);
    localStorage.removeItem(options.key);
    return Promise.resolve();
  }),

  clear: jest.fn(() => {
    console.log('🧹 Mock Preferences clear');
    localStorage.clear();
    return Promise.resolve();
  }),

  keys: jest.fn(() => {
    console.log('🔑 Mock Preferences keys');
    const keys = Object.keys(localStorage);
    return Promise.resolve({ keys });
  })
};

// Status Bar plugin
export const StatusBar = {
  setStyle: jest.fn((options: { style: 'LIGHT' | 'DARK' | 'DEFAULT' }) => {
    console.log(`🎨 Mock StatusBar setStyle: ${options.style}`);
    return Promise.resolve();
  }),

  setBackgroundColor: jest.fn((options: { color: string }) => {
    console.log(`🎨 Mock StatusBar setBackgroundColor: ${options.color}`);
    return Promise.resolve();
  }),

  show: jest.fn(() => {
    console.log('👁️ Mock StatusBar show');
    return Promise.resolve();
  }),

  hide: jest.fn(() => {
    console.log('🙈 Mock StatusBar hide');
    return Promise.resolve();
  }),

  setOverlaysWebView: jest.fn((options: { overlay: boolean }) => {
    console.log(`📱 Mock StatusBar setOverlaysWebView: ${options.overlay}`);
    return Promise.resolve();
  })
};

// Splash Screen plugin
export const SplashScreen = {
  show: jest.fn((options?: { showDuration?: number; fadeInDuration?: number; fadeOutDuration?: number; autoHide?: boolean }) => {
    console.log('💫 Mock SplashScreen show', options);
    return Promise.resolve();
  }),

  hide: jest.fn((options?: { fadeOutDuration?: number }) => {
    console.log('🙈 Mock SplashScreen hide', options);
    return Promise.resolve();
  })
};

// Global mock setup methods
export const _mockCapacitorSetup = {
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
  _mockCapacitorSetup
};