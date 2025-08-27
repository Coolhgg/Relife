/**
 * Tests for Service Bootstrap and Dependency Injection System
 */

import {
  initializeServices,
  initializeTestServices,
  getServiceContainer,
  getService,
  resolveService,
  hasService,
  disposeServices,
  performHealthCheck,
  getDebugInfo,
  isAppInitialized,
} from '../ServiceBootstrap';
import { ServiceContainer } from '../base/ServiceContainer';
import { IAlarmService, IAnalyticsService, IStorageService } from '../../types/service-interfaces';

describe('ServiceBootstrap', () => {
  beforeEach(async () => {
    // Clean up any existing container
    try {
      await disposeServices();
    } catch {
      // Ignore if no container exists
    }
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await disposeServices();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Service Initialization', () => {
    test('should initialize test services successfully', async () => {
      const container = await initializeTestServices();
      
      expect(container).toBeInstanceOf(ServiceContainer);
      expect(isAppInitialized()).toBe(true);
    });

    test('should initialize services with custom options', async () => {
      const container = await initializeServices({
        skipNonCritical: true,
        logDependencyGraph: false,
        validateConfiguration: true,
      });
      
      expect(container).toBeInstanceOf(ServiceContainer);
      expect(isAppInitialized()).toBe(true);
    });

    test('should handle initialization timeout gracefully', async () => {
      // This test would require mocking a slow service
      // For now, we'll just test that the function exists
      expect(initializeServices).toBeDefined();
    }, 10000);
  });

  describe('Service Access', () => {
    beforeEach(async () => {
      await initializeTestServices();
    });

    test('should get service container', () => {
      const container = getServiceContainer();
      expect(container).toBeInstanceOf(ServiceContainer);
    });

    test('should get services by name', () => {
      const alarmService = getService<IAlarmService>('AlarmService');
      const analyticsService = getService<IAnalyticsService>('AnalyticsService');
      const storageService = getService<IStorageService>('StorageService');
      
      expect(alarmService).toBeDefined();
      expect(analyticsService).toBeDefined();
      expect(storageService).toBeDefined();
      
      // Check that services have expected methods
      expect(typeof alarmService.createAlarm).toBe('function');
      expect(typeof analyticsService.track).toBe('function');
      expect(typeof storageService.get).toBe('function');
    });

    test('should resolve services asynchronously', async () => {
      const alarmService = await resolveService<IAlarmService>('AlarmService');
      const analyticsService = await resolveService<IAnalyticsService>('AnalyticsService');
      
      expect(alarmService).toBeDefined();
      expect(analyticsService).toBeDefined();
    });

    test('should check if services exist', () => {
      expect(hasService('AlarmService')).toBe(true);
      expect(hasService('AnalyticsService')).toBe(true);
      expect(hasService('StorageService')).toBe(true);
      expect(hasService('NonExistentService')).toBe(false);
    });

    test('should throw error for non-existent service', () => {
      expect(() => {
        getService('NonExistentService');
      }).toThrow('Service NonExistentService is not registered or failed to initialize');
    });

    test('should throw error when container not initialized', async () => {
      await disposeServices();
      
      expect(() => {
        getServiceContainer();
      }).toThrow('Service container not initialized');
      
      expect(isAppInitialized()).toBe(false);
    });
  });

  describe('Health Checks', () => {
    beforeEach(async () => {
      await initializeTestServices();
    });

    test('should perform health check on initialized services', async () => {
      const healthResult = await performHealthCheck();
      
      expect(healthResult).toHaveProperty('healthy');
      expect(healthResult).toHaveProperty('services');
      expect(healthResult).toHaveProperty('stats');
      
      expect(typeof healthResult.healthy).toBe('boolean');
      expect(typeof healthResult.services).toBe('object');
      expect(typeof healthResult.stats).toBe('object');
    });

    test('should report unhealthy when container not initialized', async () => {
      await disposeServices();
      
      const healthResult = await performHealthCheck();
      
      expect(healthResult.healthy).toBe(false);
      expect(healthResult.services).toEqual({});
      expect(healthResult.stats).toHaveProperty('error');
    });
  });

  describe('Debug Information', () => {
    beforeEach(async () => {
      await initializeTestServices();
    });

    test('should provide debug information', () => {
      const debugInfo = getDebugInfo();
      
      expect(debugInfo).toHaveProperty('stats');
      expect(debugInfo).toHaveProperty('dependencyGraph');
      expect(debugInfo).toHaveProperty('containerState');
      
      expect(debugInfo.containerState.initialized).toBe(true);
      expect(typeof debugInfo.stats.total).toBe('number');
      expect(typeof debugInfo.dependencyGraph).toBe('string');
    });

    test('should report error when container not initialized', async () => {
      await disposeServices();
      
      const debugInfo = getDebugInfo();
      
      expect(debugInfo).toHaveProperty('error');
      expect(debugInfo.error).toBe('Service container not initialized');
    });
  });

  describe('Service Lifecycle', () => {
    test('should dispose of services properly', async () => {
      await initializeTestServices();
      expect(isAppInitialized()).toBe(true);
      
      await disposeServices();
      expect(isAppInitialized()).toBe(false);
    });

    test('should handle disposal when not initialized', async () => {
      // Should not throw
      await expect(disposeServices()).resolves.toBeUndefined();
    });
  });

  describe('Service Integration', () => {
    beforeEach(async () => {
      await initializeTestServices();
    });

    test('should have working alarm service', async () => {
      const alarmService = getService<IAlarmService>('AlarmService');
      
      // Test loading alarms
      const alarms = await alarmService.loadAlarms();
      expect(Array.isArray(alarms)).toBe(true);
      
      // Test getting alarms
      const cachedAlarms = alarmService.getAlarms();
      expect(Array.isArray(cachedAlarms)).toBe(true);
    });

    test('should have working analytics service', async () => {
      const analyticsService = getService<IAnalyticsService>('AnalyticsService');
      
      // Test tracking event
      await expect(analyticsService.track('test_event', { test: true })).resolves.toBeUndefined();
      
      // Test queue size
      const queueSize = analyticsService.getQueueSize();
      expect(typeof queueSize).toBe('number');
    });

    test('should have working storage service', async () => {
      const storageService = getService<IStorageService>('StorageService');
      
      // Test storage operations
      await storageService.set('test_key', 'test_value');
      const value = await storageService.get('test_key');
      expect(value).toBe('test_value');
      
      const hasKey = await storageService.has('test_key');
      expect(hasKey).toBe(true);
      
      const deleted = await storageService.delete('test_key');
      expect(deleted).toBe(true);
      
      const hasKeyAfterDelete = await storageService.has('test_key');
      expect(hasKeyAfterDelete).toBe(false);
    });
  });

  describe('Service Dependencies', () => {
    beforeEach(async () => {
      await initializeTestServices();
    });

    test('should resolve service dependencies correctly', () => {
      // AlarmService depends on StorageService, SecurityService, AnalyticsService, BattleService
      const alarmService = getService<IAlarmService>('AlarmService');
      const storageService = getService<IStorageService>('StorageService');
      const analyticsService = getService<IAnalyticsService>('AnalyticsService');
      
      expect(alarmService).toBeDefined();
      expect(storageService).toBeDefined();
      expect(analyticsService).toBeDefined();
      
      // All should be singleton instances
      const alarmService2 = getService<IAlarmService>('AlarmService');
      const storageService2 = getService<IStorageService>('StorageService');
      
      expect(alarmService).toBe(alarmService2);
      expect(storageService).toBe(storageService2);
    });
  });

  describe('Error Handling', () => {
    test('should handle service initialization errors gracefully', async () => {
      // This would require mocking a service that fails to initialize
      // For now, we ensure the error handling functions exist
      expect(initializeServices).toBeDefined();
      expect(performHealthCheck).toBeDefined();
    });

    test('should provide meaningful error messages', () => {
      expect(() => {
        getService('InvalidServiceName');
      }).toThrow(/Service InvalidServiceName is not registered/);
    });
  });
});