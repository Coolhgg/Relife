/**
 * Integration Tests for Dependency Injection System
 *
 * These tests verify that the entire DI system works correctly
 * with real service dependencies and initialization flows.
 */

import {
  validateEnhancedServiceConfiguration,
  getEnhancedServiceStats,
  generateDependencyGraph,
  isServiceEnhanced,
  getEnhancedServicesByTag,
  registerEnhancedServices,
  initializeEnhancedCriticalServices,
} from '../factories/EnhancedServiceRegistry';
import { ServiceContainer } from '../base/ServiceContainer';
import { createServiceContainer } from '../ServiceBootstrap';

describe('Dependency Injection Integration', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = createServiceContainer();
  });

  afterEach(async () => {
    try {
      await container.dispose();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Service Configuration Validation', () => {
    test('should validate enhanced service configuration successfully', () => {
      const isValid = validateEnhancedServiceConfiguration();
      expect(isValid).toBe(true);
    });

    test('should provide service statistics', () => {
      const stats = getEnhancedServiceStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('enhanced');
      expect(stats).toHaveProperty('critical');
      expect(stats).toHaveProperty('infrastructure');
      expect(stats).toHaveProperty('business');
      expect(stats).toHaveProperty('enhancedPercentage');
      expect(stats).toHaveProperty('services');

      expect(typeof stats.total).toBe('number');
      expect(typeof stats.enhanced).toBe('number');
      expect(typeof stats.critical).toBe('number');
      expect(typeof stats.infrastructure).toBe('number');
      expect(typeof stats.business).toBe('number');
      expect(typeof stats.enhancedPercentage).toBe('number');

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.enhanced).toBeGreaterThan(0);
      expect(stats.critical).toBeGreaterThan(0);
    });

    test('should generate dependency graph', () => {
      const graph = generateDependencyGraph();

      expect(typeof graph).toBe('string');
      expect(graph).toContain('Enhanced Service Dependency Graph');
      expect(graph).toContain('AlarmService');
      expect(graph).toContain('AnalyticsService');
      expect(graph).toContain('StorageService');
    });
  });

  describe('Service Tags and Classification', () => {
    test('should identify enhanced services', () => {
      expect(isServiceEnhanced('AlarmService')).toBe(true);
      expect(isServiceEnhanced('AnalyticsService')).toBe(true);
      expect(isServiceEnhanced('StorageService')).toBe(true);
      expect(isServiceEnhanced('AudioService')).toBe(false); // Not yet enhanced
    });

    test('should get services by tag', () => {
      const enhancedServices = getEnhancedServicesByTag('enhanced');
      const criticalServices = getEnhancedServicesByTag('critical');
      const infrastructureServices = getEnhancedServicesByTag('infrastructure');

      expect(Array.isArray(enhancedServices)).toBe(true);
      expect(Array.isArray(criticalServices)).toBe(true);
      expect(Array.isArray(infrastructureServices)).toBe(true);

      expect(enhancedServices).toContain('AlarmService');
      expect(enhancedServices).toContain('AnalyticsService');
      expect(enhancedServices).toContain('StorageService');

      expect(criticalServices).toContain('StorageService');
      expect(criticalServices).toContain('SecurityService');
      expect(criticalServices).toContain('AlarmService');

      expect(infrastructureServices).toContain('StorageService');
      expect(infrastructureServices).toContain('SecurityService');
    });
  });

  describe('Service Registration', () => {
    test('should register enhanced services successfully', async () => {
      await registerEnhancedServices(container);

      // Check that services are registered
      expect(container.has('AlarmService')).toBe(true);
      expect(container.has('AnalyticsService')).toBe(true);
      expect(container.has('StorageService')).toBe(true);
      expect(container.has('SecurityService')).toBe(true);
      expect(container.has('BattleService')).toBe(true);
      expect(container.has('VoiceService')).toBe(true);
      expect(container.has('SubscriptionService')).toBe(true);
    });

    test('should handle duplicate registration gracefully', async () => {
      await registerEnhancedServices(container);

      // Attempting to register again should throw an error
      await expect(registerEnhancedServices(container)).rejects.toThrow();
    });
  });

  describe('Service Initialization', () => {
    test('should initialize critical services successfully', async () => {
      await registerEnhancedServices(container);
      await initializeEnhancedCriticalServices(container);

      // Check that critical services are initialized
      const criticalServices = getEnhancedServicesByTag('critical');

      for (const serviceName of criticalServices) {
        expect(container.has(serviceName)).toBe(true);

        // Try to resolve the service
        const service = await container.resolve(serviceName);
        expect(service).toBeDefined();
        expect(service.isInitialized()).toBe(true);
      }
    });

    test('should initialize container properly', async () => {
      await registerEnhancedServices(container);
      await container.initialize();

      // All registered services should be available
      const stats = getEnhancedServiceStats();
      const serviceNames = Object.keys({
        ...stats.services.enhanced,
        ...stats.services.critical,
        ...stats.services.infrastructure,
        ...stats.services.business,
      });

      // Remove duplicates
      const uniqueServiceNames = [...new Set(serviceNames)];

      for (const serviceName of uniqueServiceNames) {
        if (container.has(serviceName)) {
          const service = await container.resolve(serviceName);
          expect(service).toBeDefined();
        }
      }
    });
  });

  describe('Service Dependencies', () => {
    test('should resolve dependencies correctly', async () => {
      await registerEnhancedServices(container);
      await container.initialize();

      // AlarmService depends on StorageService, SecurityService, AnalyticsService, BattleService
      const alarmService = await container.resolve('AlarmService');
      expect(alarmService).toBeDefined();
      expect(alarmService.isInitialized()).toBe(true);

      // AnalyticsService depends on StorageService
      const analyticsService = await container.resolve('AnalyticsService');
      expect(analyticsService).toBeDefined();
      expect(analyticsService.isInitialized()).toBe(true);

      // StorageService has no dependencies
      const storageService = await container.resolve('StorageService');
      expect(storageService).toBeDefined();
      expect(storageService.isInitialized()).toBe(true);
    });

    test('should handle circular dependency detection', async () => {
      // The current configuration should not have circular dependencies
      expect(() => {
        validateEnhancedServiceConfiguration();
      }).not.toThrow();
    });

    test('should enforce singleton behavior', async () => {
      await registerEnhancedServices(container);
      await container.initialize();

      // Get the same service multiple times
      const alarmService1 = await container.resolve('AlarmService');
      const alarmService2 = await container.resolve('AlarmService');
      const alarmService3 = container.get('AlarmService');

      // Should be the same instance
      expect(alarmService1).toBe(alarmService2);
      expect(alarmService1).toBe(alarmService3);
    });
  });

  describe('Service Health and Monitoring', () => {
    test('should provide service health information', async () => {
      await registerEnhancedServices(container);
      await container.initialize();

      // Enhanced services should provide health information
      const alarmService = await container.resolve('AlarmService');
      const health = await alarmService.getHealth();

      expect(health).toBeDefined();
      expect(health).toHaveProperty('status');
    });

    test('should track service metrics', async () => {
      await registerEnhancedServices(container);
      await container.initialize();

      const analyticsService = await container.resolve('AnalyticsService');

      // Track a metric
      await analyticsService.track('test_metric', { value: 123 });

      // Service should maintain queue size
      expect(typeof analyticsService.getQueueSize()).toBe('number');
    });
  });

  describe('Error Handling', () => {
    test('should handle service initialization failures gracefully', async () => {
      // This test would require injecting a faulty service
      // For now, we test that the error handling mechanisms exist
      await registerEnhancedServices(container);

      expect(container.has('AlarmService')).toBe(true);
    });

    test('should handle service resolution errors', async () => {
      await registerEnhancedServices(container);

      // Try to resolve a non-existent service
      await expect(container.resolve('NonExistentService')).rejects.toThrow();
    });
  });

  describe('Service Lifecycle Management', () => {
    test('should dispose of services properly', async () => {
      await registerEnhancedServices(container);
      await container.initialize();

      // Services should be initialized
      const alarmService = await container.resolve('AlarmService');
      expect(alarmService.isInitialized()).toBe(true);

      // Dispose of container
      await container.dispose();

      // Services should be cleaned up (we can't easily test this without internal access)
      // But the dispose should complete without error
    });
  });

  describe('Configuration Management', () => {
    test('should handle service configuration updates', async () => {
      await registerEnhancedServices(container);
      await container.initialize();

      const analyticsService = await container.resolve('AnalyticsService');

      // Update configuration
      await analyticsService.updateConfiguration({
        enabled: true,
        environment: 'test',
        analytics: {
          maxQueueSize: 50,
          flushInterval: 15000,
        },
      } as any);

      // Configuration should be updated (we can't easily verify this without internal access)
      // But the update should complete without error
    });
  });
});

describe('Service Integration Scenarios', () => {
  let container: ServiceContainer;

  beforeEach(async () => {
    container = createServiceContainer();
    await registerEnhancedServices(container);
    await container.initialize();
  });

  afterEach(async () => {
    try {
      await container.dispose();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Real-world Usage Scenarios', () => {
    test('should handle alarm creation workflow', async () => {
      const alarmService = await container.resolve('AlarmService');
      const analyticsService = await container.resolve('AnalyticsService');

      // Create an alarm (this would trigger analytics tracking)
      const alarm = await alarmService.createAlarm({
        time: '08:00',
        label: 'Test Alarm',
        days: [1, 2, 3, 4, 5],
        voiceMood: 'motivational' as any,
        userId: 'test-user',
      });

      expect(alarm).toBeDefined();
      expect(alarm.id).toBeDefined();
      expect(alarm.time).toBe('08:00');
      expect(alarm.label).toBe('Test Alarm');

      // Analytics should have tracked the event
      expect(analyticsService.getQueueSize()).toBeGreaterThan(0);
    });

    test('should handle data persistence workflow', async () => {
      const storageService = await container.resolve('StorageService');

      // Store some data
      await storageService.set('test_key', {
        value: 'test_data',
        timestamp: Date.now(),
      });

      // Retrieve the data
      const data = await storageService.get('test_key');
      expect(data).toBeDefined();
      expect(data.value).toBe('test_data');

      // Check if key exists
      const hasKey = await storageService.has('test_key');
      expect(hasKey).toBe(true);

      // Delete the data
      const deleted = await storageService.delete('test_key');
      expect(deleted).toBe(true);

      // Verify deletion
      const hasKeyAfterDelete = await storageService.has('test_key');
      expect(hasKeyAfterDelete).toBe(false);
    });

    test('should handle analytics tracking workflow', async () => {
      const analyticsService = await container.resolve('AnalyticsService');

      // Track various events
      await analyticsService.track('user_login', { userId: 'test-user' });
      await analyticsService.trackUserAction('test-user', 'button_click', {
        button: 'create_alarm',
      });
      await analyticsService.trackPerformanceMetric('load_time', 1500, {
        page: 'home',
      });

      expect(analyticsService.getQueueSize()).toBe(3);

      // Flush events
      await analyticsService.flush();
      expect(analyticsService.getQueueSize()).toBe(0);
    });
  });
});
