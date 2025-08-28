/**
 * Enhanced Service Factories for Dependency Injection Container
 *
 * This file contains factory implementations that create enhanced service instances
 * for the dependency injection container system.
 */

import {
  BaseService,
  ServiceFactory,
  ServiceConfig,
  ServiceMap,
} from '../../types/service-architecture';
import {
  IAlarmService,
  IAnalyticsService,
  ISubscriptionService,
  IVoiceService,
  IBattleService,
  IStorageService,
  ICacheService,
  ISecurityService,
  INotificationService,
  IAudioService,
  IPerformanceService,
} from '../../types/service-interfaces';

// Import enhanced service implementations
import { EnhancedAlarmService } from '../enhanced/EnhancedAlarmService';
import { EnhancedAnalyticsService } from '../enhanced/EnhancedAnalyticsService';
import { EnhancedStorageService } from '../enhanced/EnhancedStorageService';

// Import other service implementations (to be enhanced later)
import { SubscriptionService } from '../subscription';
import { VoiceService } from '../voice';
import { BattleService } from '../battle';
import { AudioManager } from '../audio-manager';
import PerformanceMonitorService from '../performance-monitor';
import { NotificationService } from '../notification';

// ============================================================================
// Enhanced Service Factories
// ============================================================================

export class EnhancedAlarmServiceFactory implements ServiceFactory<IAlarmService> {
  create(dependencies: ServiceMap, config: ServiceConfig): IAlarmService {
    const storageService = dependencies.get('StorageService') as IStorageService;
    const securityService = dependencies.get('SecurityService') as ISecurityService;
    const analyticsService = dependencies.get('AnalyticsService') as IAnalyticsService;
    const battleService = dependencies.get('BattleService') as IBattleService;

    return new EnhancedAlarmService({
      storageService,
      securityService,
      analyticsService,
      battleService,
      config,
    });
  }
}

export class EnhancedAnalyticsServiceFactory
  implements ServiceFactory<IAnalyticsService>
{
  create(dependencies: ServiceMap, config: ServiceConfig): IAnalyticsService {
    const storageService = dependencies.get('StorageService') as IStorageService;

    return new EnhancedAnalyticsService({
      storageService,
      config,
    });
  }
}

export class EnhancedStorageServiceFactory implements ServiceFactory<IStorageService> {
  create(dependencies: ServiceMap, config: ServiceConfig): IStorageService {
    return new EnhancedStorageService(config);
  }
}

// ============================================================================
// Legacy Service Factories (to be enhanced)
// ============================================================================

export class SubscriptionServiceFactory
  implements ServiceFactory<ISubscriptionService>
{
  create(dependencies: ServiceMap, config: ServiceConfig): ISubscriptionService {
    const analyticsService = dependencies.get('AnalyticsService') as IAnalyticsService;
    const storageService = dependencies.get('StorageService') as IStorageService;

    return new SubscriptionService({
      analyticsService,
      storageService,
      config,
    });
  }
}

export class VoiceServiceFactory implements ServiceFactory<IVoiceService> {
  create(dependencies: ServiceMap, config: ServiceConfig): IVoiceService {
    const audioService = dependencies.get('AudioService') as IAudioService;
    const analyticsService = dependencies.get('AnalyticsService') as IAnalyticsService;

    return new VoiceService({
      audioService,
      analyticsService,
      config,
    });
  }
}

export class BattleServiceFactory implements ServiceFactory<IBattleService> {
  create(dependencies: ServiceMap, config: ServiceConfig): IBattleService {
    const storageService = dependencies.get('StorageService') as IStorageService;
    const analyticsService = dependencies.get('AnalyticsService') as IAnalyticsService;

    return new BattleService({
      storageService,
      analyticsService,
      config,
    });
  }
}

export class AudioServiceFactory implements ServiceFactory<IAudioService> {
  create(dependencies: ServiceMap, config: ServiceConfig): IAudioService {
    return new AudioManager({
      config,
    });
  }
}

export class PerformanceServiceFactory implements ServiceFactory<IPerformanceService> {
  create(dependencies: ServiceMap, config: ServiceConfig): IPerformanceService {
    const analyticsService = dependencies.get('AnalyticsService') as IAnalyticsService;

    return new PerformanceMonitorService({
      analyticsService,
      config,
    });
  }
}

export class NotificationServiceFactory
  implements ServiceFactory<INotificationService>
{
  create(dependencies: ServiceMap, config: ServiceConfig): INotificationService {
    const analyticsService = dependencies.get('AnalyticsService') as IAnalyticsService;
    const storageService = dependencies.get('StorageService') as IStorageService;

    return new NotificationService({
      analyticsService,
      storageService,
      config,
    });
  }
}

// ============================================================================
// Infrastructure Service Factories
// ============================================================================

export class CacheServiceFactory implements ServiceFactory<ICacheService> {
  create(dependencies: ServiceMap, config: ServiceConfig): ICacheService {
    const storageService = dependencies.get('StorageService') as IStorageService;

    const { CacheManager } = require('../base/CacheManager');
    return new CacheManager({
      storageService,
      config,
    });
  }
}

export class SecurityServiceFactory implements ServiceFactory<ISecurityService> {
  create(dependencies: ServiceMap, config: ServiceConfig): ISecurityService {
    const analyticsService = dependencies.get('AnalyticsService') as IAnalyticsService;

    const { SecurityService } = require('../security');
    return new SecurityService({
      analyticsService,
      config,
    });
  }
}

// ============================================================================
// Enhanced Factory Registry
// ============================================================================

export const EnhancedServiceFactoryRegistry = {
  AlarmService: new EnhancedAlarmServiceFactory(),
  AnalyticsService: new EnhancedAnalyticsServiceFactory(),
  StorageService: new EnhancedStorageServiceFactory(),
  SubscriptionService: new SubscriptionServiceFactory(),
  VoiceService: new VoiceServiceFactory(),
  BattleService: new BattleServiceFactory(),
  AudioService: new AudioServiceFactory(),
  PerformanceService: new PerformanceServiceFactory(),
  NotificationService: new NotificationServiceFactory(),
  CacheService: new CacheServiceFactory(),
  SecurityService: new SecurityServiceFactory(),
};

// ============================================================================
// Helper Functions
// ============================================================================

export function createEnhancedServiceDescriptor(
  name: keyof typeof EnhancedServiceFactoryRegistry,
  dependencies: string[] = [],
  singleton: boolean = true,
  config?: Partial<ServiceConfig>,
  tags?: string[]
) {
  return {
    name,
    factory: EnhancedServiceFactoryRegistry[name],
    dependencies,
    singleton,
    _config: config as ServiceConfig,
    tags: tags || [],
  };
}

export function getDefaultServiceConfig(): ServiceConfig {
  return {
    enabled: true,
    environment:
      (process.env.NODE_ENV as 'development' | 'staging' | 'production') ||
      'development',
    debug: process.env.NODE_ENV === 'development',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    caching: {
      enabled: true,
      strategy: 'hybrid',
      ttl: 300000, // 5 minutes
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
}
