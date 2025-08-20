/**
 * Storage Testing Utilities for Relife Alarm App
 * Provides comprehensive testing utilities for localStorage, sessionStorage, IndexedDB, and Cache API
 */

interface MockStorageInterface {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  clear: jest.Mock;
  key: jest.Mock;
  length: number;
  [key: string]: any;
}

interface MockIndexedDBDatabase {
  name: string;
  version: number;
  objectStoreNames: string[];
  transaction: jest.Mock;
  close: jest.Mock;
  createObjectStore: jest.Mock;
  deleteObjectStore: jest.Mock;
}

interface MockCacheStorage {
  open: jest.Mock;
  has: jest.Mock;
  delete: jest.Mock;
  keys: jest.Mock;
  match: jest.Mock;
}

interface AlarmStorageData {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  sound: string;
  volume: number;
  repeat: string[];
  snoozeEnabled: boolean;
  snoozeInterval: number;
}

interface UserPreferences {
  theme: string;
  language: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: number;
  sounds: {
    defaultAlarm: string;
    notification: string;
    snooze: string;
  };
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
}

// Storage Mocking Utilities
export const storageMocks = {
  /**
   * Create a mock storage implementation
   */
  createMockStorage(): MockStorageInterface {
    const store: Record<string, string> = {};

    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      key: jest.fn((index: number) => Object.keys(store)[index] || null),
      get length() {
        return Object.keys(store).length;
      },
      ...store
    };
  },

  /**
   * Mock localStorage globally
   */
  mockLocalStorage(): MockStorageInterface {
    const mockStorage = this.createMockStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true
    });
    return mockStorage;
  },

  /**
   * Mock sessionStorage globally
   */
  mockSessionStorage(): MockStorageInterface {
    const mockStorage = this.createMockStorage();
    Object.defineProperty(window, 'sessionStorage', {
      value: mockStorage,
      writable: true
    });
    return mockStorage;
  },

  /**
   * Mock both localStorage and sessionStorage
   */
  mockAllWebStorage(): {
    localStorage: MockStorageInterface;
    sessionStorage: MockStorageInterface;
  } {
    return {
      localStorage: this.mockLocalStorage(),
      sessionStorage: this.mockSessionStorage()
    };
  }
};

// IndexedDB Mocking Utilities
export const indexedDBMocks = {
  /**
   * Mock IndexedDB with basic operations
   */
  mockIndexedDB(): void {
    const mockDatabases = new Map<string, MockIndexedDBDatabase>();

    const mockIDBRequest = {
      result: null,
      error: null,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      readyState: 'pending'
    };

    const mockOpen = jest.fn((name: string, version?: number) => {
      const request = { ...mockIDBRequest };

      setTimeout(() => {
        if (!mockDatabases.has(name)) {
          const db: MockIndexedDBDatabase = {
            name,
            version: version || 1,
            objectStoreNames: [],
            transaction: jest.fn(),
            close: jest.fn(),
            createObjectStore: jest.fn((storeName: string) => {
              db.objectStoreNames.push(storeName);
              return {
                add: jest.fn(),
                put: jest.fn(),
                get: jest.fn(),
                delete: jest.fn(),
                clear: jest.fn(),
                createIndex: jest.fn()
              };
            }),
            deleteObjectStore: jest.fn()
          };
          mockDatabases.set(name, db);
        }

        request.result = mockDatabases.get(name);
        request.readyState = 'done';
        if (request.onsuccess) request.onsuccess({} as Event);
      }, 0);

      return request;
    });

    Object.defineProperty(window, 'indexedDB', {
      value: {
        open: mockOpen,
        deleteDatabase: jest.fn(),
        databases: jest.fn(() => Promise.resolve([]))
      },
      writable: true
    });
  },

  /**
   * Create mock alarm database operations
   */
  createAlarmDatabase(): {
    addAlarm: jest.Mock;
    getAlarm: jest.Mock;
    updateAlarm: jest.Mock;
    deleteAlarm: jest.Mock;
    getAllAlarms: jest.Mock;
  } {
    const alarms = new Map<string, AlarmStorageData>();

    return {
      addAlarm: jest.fn((alarm: AlarmStorageData) => {
        alarms.set(alarm.id, alarm);
        return Promise.resolve(alarm.id);
      }),
      getAlarm: jest.fn((id: string) => {
        return Promise.resolve(alarms.get(id) || null);
      }),
      updateAlarm: jest.fn((id: string, updates: Partial<AlarmStorageData>) => {
        const existing = alarms.get(id);
        if (existing) {
          alarms.set(id, { ...existing, ...updates });
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      }),
      deleteAlarm: jest.fn((id: string) => {
        const deleted = alarms.delete(id);
        return Promise.resolve(deleted);
      }),
      getAllAlarms: jest.fn(() => {
        return Promise.resolve(Array.from(alarms.values()));
      })
    };
  }
};

// Cache API Mocking Utilities
export const cacheMocks = {
  /**
   * Mock Cache API for PWA testing
   */
  mockCacheAPI(): MockCacheStorage {
    const caches = new Map<string, Map<string, Response>>();

    const mockCacheStorage: MockCacheStorage = {
      open: jest.fn((cacheName: string) => {
        if (!caches.has(cacheName)) {
          caches.set(cacheName, new Map());
        }

        const cache = caches.get(cacheName)!;

        return Promise.resolve({
          add: jest.fn((request: string) => {
            cache.set(request, new Response('cached'));
            return Promise.resolve();
          }),
          addAll: jest.fn((requests: string[]) => {
            requests.forEach(req => cache.set(req, new Response('cached')));
            return Promise.resolve();
          }),
          put: jest.fn((request: string, response: Response) => {
            cache.set(request, response);
            return Promise.resolve();
          }),
          match: jest.fn((request: string) => {
            return Promise.resolve(cache.get(request) || null);
          }),
          delete: jest.fn((request: string) => {
            return Promise.resolve(cache.delete(request));
          }),
          keys: jest.fn(() => {
            return Promise.resolve(Array.from(cache.keys()));
          })
        });
      }),
      has: jest.fn((cacheName: string) => {
        return Promise.resolve(caches.has(cacheName));
      }),
      delete: jest.fn((cacheName: string) => {
        return Promise.resolve(caches.delete(cacheName));
      }),
      keys: jest.fn(() => {
        return Promise.resolve(Array.from(caches.keys()));
      }),
      match: jest.fn((request: string) => {
        for (const cache of caches.values()) {
          const response = cache.get(request);
          if (response) return Promise.resolve(response);
        }
        return Promise.resolve(null);
      })
    };

    Object.defineProperty(window, 'caches', {
      value: mockCacheStorage,
      writable: true
    });

    return mockCacheStorage;
  }
};

// Storage Testing Utilities
export const storageUtils = {
  /**
   * Test localStorage operations
   */
  testLocalStorage(operations: {
    set?: { key: string; value: string }[];
    get?: string[];
    remove?: string[];
    clear?: boolean;
  }): void {
    const mockStorage = storageMocks.mockLocalStorage();

    if (operations.set) {
      operations.set.forEach(({ key, value }) => {
        localStorage.setItem(key, value);
        expect(mockStorage.setItem).toHaveBeenCalledWith(key, value);
      });
    }

    if (operations.get) {
      operations.get.forEach(key => {
        localStorage.getItem(key);
        expect(mockStorage.getItem).toHaveBeenCalledWith(key);
      });
    }

    if (operations.remove) {
      operations.remove.forEach(key => {
        localStorage.removeItem(key);
        expect(mockStorage.removeItem).toHaveBeenCalledWith(key);
      });
    }

    if (operations.clear) {
      localStorage.clear();
      expect(mockStorage.clear).toHaveBeenCalled();
    }
  },

  /**
   * Test alarm data persistence
   */
  testAlarmPersistence(alarmData: AlarmStorageData): void {
    const mockStorage = storageMocks.mockLocalStorage();
    const key = `alarm_${alarmData.id}`;
    const serializedData = JSON.stringify(alarmData);

    // Test saving alarm
    localStorage.setItem(key, serializedData);
    expect(mockStorage.setItem).toHaveBeenCalledWith(key, serializedData);

    // Test loading alarm
    const retrieved = localStorage.getItem(key);
    expect(mockStorage.getItem).toHaveBeenCalledWith(key);

    if (retrieved) {
      const parsedAlarm = JSON.parse(retrieved);
      expect(parsedAlarm).toEqual(alarmData);
    }
  },

  /**
   * Test user preferences storage
   */
  testPreferencesStorage(preferences: UserPreferences): void {
    const mockStorage = storageMocks.mockLocalStorage();
    const key = 'user_preferences';
    const serializedPrefs = JSON.stringify(preferences);

    localStorage.setItem(key, serializedPrefs);
    expect(mockStorage.setItem).toHaveBeenCalledWith(key, serializedPrefs);

    const retrieved = localStorage.getItem(key);
    expect(mockStorage.getItem).toHaveBeenCalledWith(key);

    if (retrieved) {
      const parsedPrefs = JSON.parse(retrieved);
      expect(parsedPrefs).toEqual(preferences);
    }
  },

  /**
   * Test storage quota and limits
   */
  testStorageQuota(): void {
    const mockStorage = storageMocks.mockLocalStorage();

    // Test large data storage
    const largeData = 'x'.repeat(1024 * 1024); // 1MB of data

    try {
      localStorage.setItem('large_data', largeData);
      expect(mockStorage.setItem).toHaveBeenCalledWith('large_data', largeData);
    } catch (error) {
      // Handle quota exceeded error
      expect(error).toBeInstanceOf(Error);
    }
  },

  /**
   * Test storage events
   */
  testStorageEvents(): void {
    const mockStorage = storageMocks.mockLocalStorage();
    const storageEventListener = jest.fn();

    window.addEventListener('storage', storageEventListener);

    // Simulate storage change in another tab
    const storageEvent = new StorageEvent('storage', {
      key: 'test_key',
      oldValue: 'old_value',
      newValue: 'new_value',
      storageArea: localStorage
    });

    window.dispatchEvent(storageEvent);
    expect(storageEventListener).toHaveBeenCalledWith(storageEvent);

    window.removeEventListener('storage', storageEventListener);
  }
};

// Cleanup Utilities
export const storageCleanup = {
  /**
   * Clear all storage mocks
   */
  clearAllStorage(): void {
    localStorage.clear();
    sessionStorage.clear();
  },

  /**
   * Reset all storage mocks
   */
  resetStorageMocks(): void {
    jest.clearAllMocks();
    this.clearAllStorage();
  },

  /**
   * Clean up IndexedDB mocks
   */
  cleanupIndexedDB(): void {
    // Reset indexedDB mock
    delete (window as any).indexedDB;
  },

  /**
   * Clean up Cache API mocks
   */
  cleanupCacheAPI(): void {
    delete (window as any).caches;
  }
};

// Data Factory for Testing
export const storageDataFactory = {
  /**
   * Create test alarm data
   */
  createAlarmData(overrides: Partial<AlarmStorageData> = {}): AlarmStorageData {
    return {
      id: 'test-alarm-id',
      time: '07:00',
      label: 'Wake up',
      enabled: true,
      sound: 'classic-alarm',
      volume: 80,
      repeat: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      snoozeEnabled: true,
      snoozeInterval: 5,
      ...overrides
    };
  },

  /**
   * Create test user preferences
   */
  createUserPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
    return {
      theme: 'dark',
      language: 'en',
      timeFormat: '24h',
      weekStartsOn: 1,
      sounds: {
        defaultAlarm: 'classic-alarm',
        notification: 'gentle-chime',
        snooze: 'soft-beep'
      },
      notifications: {
        enabled: true,
        sound: true,
        vibration: true
      },
      ...overrides
    };
  },

  /**
   * Create multiple test alarms
   */
  createMultipleAlarms(count: number): AlarmStorageData[] {
    return Array.from({ length: count }, (_, index) =>
      this.createAlarmData({
        id: `alarm-${index + 1}`,
        time: `0${7 + index}:00`,
        label: `Alarm ${index + 1}`
      })
    );
  }
};

// Complete Test Suite for Storage
export const createStorageTestSuite = () => ({
  /**
   * Test basic localStorage operations
   */
  testBasicLocalStorage(): void {
    const mockStorage = storageMocks.mockLocalStorage();

    // Test set/get
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
    expect(mockStorage.setItem).toHaveBeenCalledWith('test', 'value');
    expect(mockStorage.getItem).toHaveBeenCalledWith('test');

    // Test remove
    localStorage.removeItem('test');
    expect(localStorage.getItem('test')).toBeNull();
    expect(mockStorage.removeItem).toHaveBeenCalledWith('test');
  },

  /**
   * Test alarm data lifecycle
   */
  testAlarmDataLifecycle(): void {
    const alarmData = storageDataFactory.createAlarmData();
    const mockDatabase = indexedDBMocks.createAlarmDatabase();

    // Test adding alarm
    mockDatabase.addAlarm(alarmData);
    expect(mockDatabase.addAlarm).toHaveBeenCalledWith(alarmData);

    // Test retrieving alarm
    mockDatabase.getAlarm(alarmData.id);
    expect(mockDatabase.getAlarm).toHaveBeenCalledWith(alarmData.id);

    // Test updating alarm
    const updates = { enabled: false };
    mockDatabase.updateAlarm(alarmData.id, updates);
    expect(mockDatabase.updateAlarm).toHaveBeenCalledWith(alarmData.id, updates);

    // Test deleting alarm
    mockDatabase.deleteAlarm(alarmData.id);
    expect(mockDatabase.deleteAlarm).toHaveBeenCalledWith(alarmData.id);
  },

  /**
   * Test PWA cache functionality
   */
  testPWACache(): void {
    const mockCache = cacheMocks.mockCacheAPI();

    // Test cache operations
    caches.open('relife-v1').then(cache => {
      cache.add('/alarm-sounds/classic.mp3');
      cache.match('/alarm-sounds/classic.mp3');
    });

    expect(mockCache.open).toHaveBeenCalledWith('relife-v1');
  },

  /**
   * Test storage error handling
   */
  testStorageErrorHandling(): void {
    const mockStorage = storageMocks.mockLocalStorage();

    // Simulate storage error
    mockStorage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => {
      localStorage.setItem('test', 'value');
    }).toThrow('QuotaExceededError');
  }
});

export default {
  storageMocks,
  indexedDBMocks,
  cacheMocks,
  storageUtils,
  storageCleanup,
  storageDataFactory,
  createStorageTestSuite
};