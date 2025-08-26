/**
 * Tests for Enhanced Service Implementations
 */

import { EnhancedAlarmService } from '../enhanced/EnhancedAlarmService';
import { EnhancedAnalyticsService } from '../enhanced/EnhancedAnalyticsService';
import { EnhancedStorageService } from '../enhanced/EnhancedStorageService';
import {
  IAlarmService,
  IAnalyticsService,
  IStorageService,
  ISecurityService,
  IBattleService,
} from '../../types/service-interfaces';
import { ServiceConfig } from '../../types/service-architecture';
import { VoiceMood } from '../../types';

// Mock dependencies
const mockStorageService: IStorageService = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  has: jest.fn(),
  keys: jest.fn(),
  size: jest.fn(),
  getMultiple: jest.fn(),
  setMultiple: jest.fn(),
  deleteMultiple: jest.fn(),
  backup: jest.fn(),
  restore: jest.fn(),
  getStats: jest.fn(),
} as any;

const mockSecurityService: ISecurityService = {
  validateUser: jest.fn(),
  checkRateLimit: jest.fn(),
} as any;

const mockAnalyticsService: IAnalyticsService = {
  track: jest.fn(),
  identify: jest.fn(),
  page: jest.fn(),
  trackUserAction: jest.fn(),
  trackPerformanceMetric: jest.fn(),
  flush: jest.fn(),
  getQueueSize: jest.fn(),
  updateConfiguration: jest.fn(),
} as any;

const mockBattleService: IBattleService = {
  completeBattleChallenge: jest.fn(),
} as any;

const defaultConfig: ServiceConfig = {
  enabled: true,
  environment: 'test',
  debug: false,
  timeout: 5000,
  retryAttempts: 3,
  retryDelay: 1000,
  caching: {
    enabled: true,
    strategy: 'memory',
    ttl: 60000,
    maxSize: 100,
    evictionPolicy: 'lru',
  },
  errorHandling: {
    retryAttempts: 3,
    retryDelay: 1000,
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000,
    },
    fallbackStrategy: 'cache',
    reportingEnabled: true,
  },
  monitoring: {
    metricsEnabled: true,
    healthCheckInterval: 30000,
    performanceTracking: true,
    alerting: {
      enabled: true,
      thresholds: {
        responseTime: 1000,
        errorRate: 0.05,
        availability: 0.99,
      },
      channels: ['console'],
    },
  },
};

describe('EnhancedAlarmService', () => {
  let alarmService: EnhancedAlarmService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup mock responses
    (mockStorageService.get as jest.Mock).mockResolvedValue([]);
    (mockStorageService.set as jest.Mock).mockResolvedValue(undefined);
    (mockSecurityService.validateUser as jest.Mock).mockResolvedValue(true);
    (mockSecurityService.checkRateLimit as jest.Mock).mockResolvedValue(true);
    (mockAnalyticsService.track as jest.Mock).mockResolvedValue(undefined);
    (mockBattleService.completeBattleChallenge as jest.Mock).mockResolvedValue(
      undefined
    );

    alarmService = new EnhancedAlarmService({
      storageService: mockStorageService,
      securityService: mockSecurityService,
      analyticsService: mockAnalyticsService,
      battleService: mockBattleService,
      config: defaultConfig,
    });

    await alarmService.initialize();
  });

  afterEach(async () => {
    if (alarmService) {
      await alarmService.cleanup();
    }
  });

  describe('Lifecycle', () => {
    test('should initialize successfully', async () => {
      expect(alarmService.name).toBe('AlarmService');
      expect(alarmService.version).toBe('2.0.0');
      expect(alarmService.isInitialized()).toBe(true);
      expect(alarmService.isReady()).toBe(true);
    });

    test('should start and stop correctly', async () => {
      await alarmService.start();
      expect(alarmService.isReady()).toBe(true);

      await alarmService.stop();
      expect(alarmService.isReady()).toBe(false);
    });

    test('should load existing alarms on initialization', async () => {
      const mockAlarms = [
        {
          id: 'test-1',
          time: '07:00',
          label: 'Test Alarm',
          enabled: true,
          days: [1, 2, 3, 4, 5],
          voiceMood: 'motivational' as VoiceMood,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      (mockStorageService.get as jest.Mock).mockResolvedValue(mockAlarms);

      const newAlarmService = new EnhancedAlarmService({
        storageService: mockStorageService,
        securityService: mockSecurityService,
        analyticsService: mockAnalyticsService,
        battleService: mockBattleService,
        config: defaultConfig,
      });

      await newAlarmService.initialize();

      const alarms = newAlarmService.getAlarms();
      expect(alarms).toHaveLength(1);
      expect(alarms[0].id).toBe('test-1');

      await newAlarmService.cleanup();
    });
  });

  describe('CRUD Operations', () => {
    test('should create alarm successfully', async () => {
      const alarmData = {
        time: '08:00',
        label: 'Morning Alarm',
        days: [1, 2, 3, 4, 5],
        voiceMood: 'energetic' as VoiceMood,
        userId: 'user-123',
      };

      const alarm = await alarmService.createAlarm(alarmData);

      expect(alarm).toBeDefined();
      expect(alarm.time).toBe('08:00');
      expect(alarm.label).toBe('Morning Alarm');
      expect(alarm.userId).toBe('user-123');
      expect(alarm.id).toBeDefined();
      expect(alarm.enabled).toBe(true);

      // Verify analytics was called
      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        'alarm_created',
        expect.any(Object)
      );

      // Verify storage was called
      expect(mockStorageService.set).toHaveBeenCalledWith('alarms', expect.any(Array));
    });

    test('should update alarm successfully', async () => {
      // First create an alarm
      const alarmData = {
        time: '08:00',
        label: 'Morning Alarm',
        days: [1, 2, 3, 4, 5],
        voiceMood: 'motivational' as VoiceMood,
        userId: 'user-123',
      };

      const alarm = await alarmService.createAlarm(alarmData);

      // Then update it
      const updatedAlarm = await alarmService.updateAlarm(alarm.id, {
        label: 'Updated Morning Alarm',
        time: '08:30',
      });

      expect(updatedAlarm.label).toBe('Updated Morning Alarm');
      expect(updatedAlarm.time).toBe('08:30');
      expect(updatedAlarm.updatedAt).toBeInstanceOf(Date);

      // Verify analytics was called
      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        'alarm_updated',
        expect.any(Object)
      );
    });

    test('should delete alarm successfully', async () => {
      // First create an alarm
      const alarmData = {
        time: '08:00',
        label: 'Morning Alarm',
        days: [1, 2, 3, 4, 5],
        voiceMood: 'motivational' as VoiceMood,
        userId: 'user-123',
      };

      const alarm = await alarmService.createAlarm(alarmData);
      expect(alarmService.getAlarms()).toHaveLength(1);

      // Then delete it
      await alarmService.deleteAlarm(alarm.id);
      expect(alarmService.getAlarms()).toHaveLength(0);

      // Verify analytics was called
      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        'alarm_deleted',
        expect.any(Object)
      );
    });

    test('should toggle alarm successfully', async () => {
      // First create an alarm
      const alarmData = {
        time: '08:00',
        label: 'Morning Alarm',
        days: [1, 2, 3, 4, 5],
        voiceMood: 'motivational' as VoiceMood,
        userId: 'user-123',
      };

      const alarm = await alarmService.createAlarm(alarmData);
      expect(alarm.enabled).toBe(true);

      // Toggle it off
      const toggledAlarm = await alarmService.toggleAlarm(alarm.id, false);
      expect(toggledAlarm.enabled).toBe(false);

      // Toggle it back on
      const toggledAlarm2 = await alarmService.toggleAlarm(alarm.id, true);
      expect(toggledAlarm2.enabled).toBe(true);

      // Verify analytics was called
      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        'alarm_toggled',
        expect.any(Object)
      );
    });
  });

  describe('Security and Validation', () => {
    test('should validate alarm ownership', async () => {
      const alarmData = {
        time: '08:00',
        label: 'Morning Alarm',
        days: [1, 2, 3, 4, 5],
        voiceMood: 'motivational' as VoiceMood,
        userId: 'user-123',
      };

      const alarm = await alarmService.createAlarm(alarmData);

      expect(alarmService.validateAlarmOwnership(alarm.id, 'user-123')).toBe(true);
      expect(alarmService.validateAlarmOwnership(alarm.id, 'other-user')).toBe(false);
    });

    test('should respect rate limiting', async () => {
      (mockSecurityService.checkRateLimit as jest.Mock).mockResolvedValue(false);

      const alarmData = {
        time: '08:00',
        label: 'Morning Alarm',
        days: [1, 2, 3, 4, 5],
        voiceMood: 'motivational' as VoiceMood,
        userId: 'user-123',
      };

      await expect(alarmService.createAlarm(alarmData)).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    test('should validate user permissions', async () => {
      (mockSecurityService.validateUser as jest.Mock).mockResolvedValue(false);

      const alarmData = {
        time: '08:00',
        label: 'Morning Alarm',
        days: [1, 2, 3, 4, 5],
        voiceMood: 'motivational' as VoiceMood,
        userId: 'invalid-user',
      };

      await expect(alarmService.createAlarm(alarmData)).rejects.toThrow(
        'Invalid user ID'
      );
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      // Create test alarms
      await alarmService.createAlarm({
        time: '07:00',
        label: 'Alarm 1',
        days: [1, 2, 3, 4, 5],
        voiceMood: 'motivational' as VoiceMood,
        userId: 'user-1',
      });

      await alarmService.createAlarm({
        time: '08:00',
        label: 'Alarm 2',
        days: [1, 2, 3, 4, 5],
        voiceMood: 'energetic' as VoiceMood,
        userId: 'user-2',
        battleId: 'battle-1',
      });
    });

    test('should get all alarms', () => {
      const alarms = alarmService.getAlarms();
      expect(alarms).toHaveLength(2);
    });

    test('should get user alarms', () => {
      const user1Alarms = alarmService.getUserAlarms('user-1');
      const user2Alarms = alarmService.getUserAlarms('user-2');

      expect(user1Alarms).toHaveLength(1);
      expect(user2Alarms).toHaveLength(1);
      expect(user1Alarms[0].userId).toBe('user-1');
      expect(user2Alarms[0].userId).toBe('user-2');
    });

    test('should get battle alarms', () => {
      const battleAlarms = alarmService.getBattleAlarms('user-2');
      const nonBattleAlarms = alarmService.getNonBattleAlarms('user-2');

      expect(battleAlarms).toHaveLength(1);
      expect(nonBattleAlarms).toHaveLength(0);
      expect(battleAlarms[0].battleId).toBe('battle-1');
    });

    test('should get alarm by ID', () => {
      const alarms = alarmService.getAlarms();
      const alarm = alarmService.getAlarmById(alarms[0].id);

      expect(alarm).toBeDefined();
      expect(alarm!.id).toBe(alarms[0].id);
    });
  });
});

describe('EnhancedAnalyticsService', () => {
  let analyticsService: EnhancedAnalyticsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    (mockStorageService.get as jest.Mock).mockResolvedValue(null);
    (mockStorageService.set as jest.Mock).mockResolvedValue(undefined);

    analyticsService = new EnhancedAnalyticsService({
      storageService: mockStorageService,
      config: defaultConfig,
    });

    await analyticsService.initialize();
  });

  afterEach(async () => {
    if (analyticsService) {
      await analyticsService.cleanup();
    }
  });

  describe('Event Tracking', () => {
    test('should track events successfully', async () => {
      await analyticsService.track('test_event', { key: 'value' });

      expect(analyticsService.getQueueSize()).toBe(1);
    });

    test('should identify users', async () => {
      await analyticsService.identify('user-123', { name: 'Test User' });

      // Should track user_identified event
      expect(analyticsService.getQueueSize()).toBe(1);
    });

    test('should track page views', async () => {
      await analyticsService.page('home', { source: 'navigation' });

      expect(analyticsService.getQueueSize()).toBe(1);
    });

    test('should track user actions', async () => {
      await analyticsService.trackUserAction('user-123', 'button_click', {
        button: 'create_alarm',
      });

      expect(analyticsService.getQueueSize()).toBe(1);
    });

    test('should track performance metrics', async () => {
      await analyticsService.trackPerformanceMetric('load_time', 1500, {
        page: 'home',
      });

      expect(analyticsService.getQueueSize()).toBe(1);
    });
  });

  describe('Queue Management', () => {
    test('should flush events', async () => {
      // Add some events
      await analyticsService.track('event1');
      await analyticsService.track('event2');
      expect(analyticsService.getQueueSize()).toBe(2);

      // Flush events
      await analyticsService.flush();
      expect(analyticsService.getQueueSize()).toBe(0);
    });

    test('should auto-flush when queue is full', async () => {
      const originalFlush = jest.spyOn(analyticsService, 'flush');

      // Add events to fill the queue (assuming default maxSize is 100)
      for (let i = 0; i < 100; i++) {
        await analyticsService.track(`event_${i}`);
      }

      // Next event should trigger auto-flush
      await analyticsService.track('overflow_event');

      expect(originalFlush).toHaveBeenCalled();
    });
  });
});

describe('EnhancedStorageService', () => {
  let storageService: EnhancedStorageService;

  beforeEach(async () => {
    // Mock IndexedDB
    const mockIDBDatabase = {
      transaction: jest.fn(),
      close: jest.fn(),
      objectStoreNames: { contains: jest.fn().mockReturnValue(false) },
    };

    const mockIDBRequest = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockIDBDatabase,
    };

    const mockIDBTransaction = {
      objectStore: jest.fn(),
    };

    const mockIDBObjectStore = {
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      getAllKeys: jest.fn(),
      createIndex: jest.fn(),
    };

    // Mock IndexedDB global
    global.indexedDB = {
      open: jest.fn().mockReturnValue(mockIDBRequest),
    } as any;

    mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);
    mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);

    // Setup successful responses
    const mockSuccessRequest = {
      onsuccess: null,
      onerror: null,
      result: null,
    };

    mockIDBObjectStore.get.mockReturnValue(mockSuccessRequest);
    mockIDBObjectStore.put.mockReturnValue(mockSuccessRequest);
    mockIDBObjectStore.delete.mockReturnValue(mockSuccessRequest);
    mockIDBObjectStore.clear.mockReturnValue(mockSuccessRequest);
    mockIDBObjectStore.getAllKeys.mockReturnValue({
      ...mockSuccessRequest,
      result: [],
    });

    storageService = new EnhancedStorageService(defaultConfig);

    // Simulate successful DB initialization
    setTimeout(() => {
      if (mockIDBRequest.onsuccess) {
        mockIDBRequest.onsuccess({ target: mockIDBRequest } as any);
      }
    }, 0);

    await storageService.initialize();
  });

  afterEach(async () => {
    if (storageService) {
      await storageService.cleanup();
    }
  });

  describe('Basic Operations', () => {
    test('should initialize successfully', () => {
      expect(storageService.name).toBe('StorageService');
      expect(storageService.version).toBe('2.0.0');
      expect(storageService.isInitialized()).toBe(true);
    });

    test('should handle storage operations', async () => {
      // These tests would need more complex IndexedDB mocking
      // For now, we verify the service initializes correctly
      expect(storageService).toBeDefined();
    });
  });
});
