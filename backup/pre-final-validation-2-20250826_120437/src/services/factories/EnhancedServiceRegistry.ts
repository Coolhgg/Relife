/**
 * Enhanced Service Registry and Registration System
 *
 * This file provides centralized registration of all enhanced services with their
 * dependencies and configuration for the dependency injection container.
 */

import { ServiceContainer } from '../base/ServiceContainer';
import { ServiceDescriptor } from '../../types/service-architecture';
import {
  createEnhancedServiceDescriptor,
  getDefaultServiceConfig,
  EnhancedServiceFactoryRegistry,
} from './EnhancedServiceFactories';

// ============================================================================
// Enhanced Service Dependency Graph
// ============================================================================

/**
 * Service dependency definitions for enhanced services
 * Services are registered in dependency order (dependencies first)
 */
export const ENHANCED_SERVICE_DEPENDENCIES = {
  // Infrastructure services (no dependencies)
  StorageService: [],
  SecurityService: [],

  // Core services with minimal dependencies
  AnalyticsService: ['StorageService'],
  AudioService: [],

  // Services that depend on core services
  CacheService: ['StorageService'],
  PerformanceService: ['AnalyticsService'],
  NotificationService: ['AnalyticsService', 'StorageService'],

  // Business logic services
  BattleService: ['StorageService', 'AnalyticsService'],
  VoiceService: ['AudioService', 'AnalyticsService'],
  SubscriptionService: ['AnalyticsService', 'StorageService'],

  // Complex services with multiple dependencies
  AlarmService: [
    'StorageService',
    'SecurityService',
    'AnalyticsService',
    'BattleService',
  ],
};

// ============================================================================
// Enhanced Service Tags and Configuration
// ============================================================================

export const ENHANCED_SERVICE_TAGS = {
  StorageService: ['infrastructure', 'critical', 'enhanced'],
  SecurityService: ['infrastructure', 'critical'],
  AnalyticsService: ['core', 'tracking', 'enhanced'],
  AudioService: ['core', 'media'],
  CacheService: ['infrastructure', 'performance'],
  PerformanceService: ['monitoring', 'metrics'],
  NotificationService: ['ui', 'communication'],
  BattleService: ['business', 'gaming'],
  VoiceService: ['ui', 'media', 'accessibility'],
  SubscriptionService: ['business', 'monetization'],
  AlarmService: ['business', 'critical', 'user-facing', 'enhanced'],
};

export const ENHANCED_SERVICE_CONFIGS = {
  StorageService: {
    ...getDefaultServiceConfig(),
    caching: {
      ...getDefaultServiceConfig().caching,
      strategy: 'indexedDB' as const,
      ttl: 86400000, // 24 hours for storage
      maxSize: 1000, // Increase cache size for storage service
    },
    monitoring: {
      ...getDefaultServiceConfig().monitoring,
      healthCheckInterval: 60000, // Check every minute
    },
  },
  SecurityService: {
    ...getDefaultServiceConfig(),
    timeout: 5000, // Faster timeout for security checks
    errorHandling: {
      ...getDefaultServiceConfig().errorHandling,
      fallbackStrategy: 'none' as const, // No fallback for security
      retryAttempts: 1, // Don't retry security operations
    },
  },
  AnalyticsService: {
    ...getDefaultServiceConfig(),
    caching: {
      ...getDefaultServiceConfig().caching,
      strategy: 'memory' as const,
      ttl: 60000, // 1 minute cache for analytics
      maxSize: 500,
    },
    analytics: {
      maxQueueSize: 100,
      flushInterval: 30000, // Flush every 30 seconds
      offlineStorage: true,
    },
  },
  AudioService: {
    ...getDefaultServiceConfig(),
    timeout: 10000,
    errorHandling: {
      ...getDefaultServiceConfig().errorHandling,
      fallbackStrategy: 'mock' as const,
    },
  },
  AlarmService: {
    ...getDefaultServiceConfig(),
    timeout: 15000,
    errorHandling: {
      ...getDefaultServiceConfig().errorHandling,
      retryAttempts: 5, // More retries for critical alarm operations
      circuitBreaker: {
        failureThreshold: 3, // Lower threshold for alarms
        recoveryTimeout: 60000, // Longer recovery time
        monitoringPeriod: 300000, // 5 minutes
      },
    },
    alarms: {
      maxAlarmsPerUser: 50,
      maxSnoozes: 3,
      defaultSnoozeInterval: 5,
      cleanupInterval: 3600000, // Clean up old alarms every hour
    },
  },
};

// ============================================================================
// Registration Functions
// ============================================================================

/**
 * Register all enhanced services with the container in dependency order
 */
export async function registerEnhancedServices(
  container: ServiceContainer
): Promise<void> {
  console.log(
    '🚀 Registering enhanced services with dependency injection container...'
  );

  // Validate configuration first
  if (!validateEnhancedServiceConfiguration()) {
    throw new Error('Enhanced service configuration validation failed');
  }

  const registrationOrder = getEnhancedServiceRegistrationOrder();
  console.log('📋 Service registration order:', registrationOrder.join(' → '));

  for (const serviceName of registrationOrder) {
    try {
      const descriptor = createEnhancedServiceDescriptor(
        serviceName as keyof typeof EnhancedServiceFactoryRegistry,
        ENHANCED_SERVICE_DEPENDENCIES[
          serviceName as keyof typeof ENHANCED_SERVICE_DEPENDENCIES
        ] || [],
        true, // All services are singletons by default
        ENHANCED_SERVICE_CONFIGS[
          serviceName as keyof typeof ENHANCED_SERVICE_CONFIGS
        ] || getDefaultServiceConfig(),
        ENHANCED_SERVICE_TAGS[serviceName as keyof typeof ENHANCED_SERVICE_TAGS] || []
      );

      container.register(descriptor);

      // Log with enhanced status
      const tags =
        ENHANCED_SERVICE_TAGS[serviceName as keyof typeof ENHANCED_SERVICE_TAGS] || [];
      const isEnhanced = tags.includes('enhanced');
      const isCritical = tags.includes('critical');

      const statusEmoji = isEnhanced ? '⚡' : isCritical ? '🔥' : '✅';
      console.log(
        `${statusEmoji} Registered ${serviceName}${isEnhanced ? ' (Enhanced)' : ''}${isCritical ? ' (Critical)' : ''}`
      );
    } catch (error) {
      console.error(`❌ Failed to register ${serviceName}:`, error);
      throw new Error(
        `Enhanced service registration failed for ${serviceName}: ${error}`
      );
    }
  }

  console.log('📦 All enhanced services registered successfully');
}

/**
 * Get the correct order for enhanced service registration based on dependencies
 */
function getEnhancedServiceRegistrationOrder(): string[] {
  const services = Object.keys(ENHANCED_SERVICE_DEPENDENCIES);
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const order: string[] = [];

  function visit(serviceName: string) {
    if (visiting.has(serviceName)) {
      throw new Error(`Circular dependency detected involving ${serviceName}`);
    }

    if (visited.has(serviceName)) {
      return;
    }

    visiting.add(serviceName);

    const dependencies =
      ENHANCED_SERVICE_DEPENDENCIES[
        serviceName as keyof typeof ENHANCED_SERVICE_DEPENDENCIES
      ] || [];
    for (const dep of dependencies) {
      visit(dep);
    }

    visiting.delete(serviceName);
    visited.add(serviceName);
    order.push(serviceName);
  }

  for (const service of services) {
    visit(service);
  }

  return order;
}

/**
 * Initialize all critical services with enhanced error handling
 */
export async function initializeEnhancedCriticalServices(
  container: ServiceContainer
): Promise<void> {
  console.log('🔧 Initializing enhanced critical services...');

  const criticalServices = Object.entries(ENHANCED_SERVICE_TAGS)
    .filter(([_, tags]) => tags.includes('critical'))
    .map(([serviceName]) => serviceName)
    .sort((a, b) => {
      // Prioritize enhanced services
      const aEnhanced =
        ENHANCED_SERVICE_TAGS[a as keyof typeof ENHANCED_SERVICE_TAGS]?.includes(
          'enhanced'
        );
      const bEnhanced =
        ENHANCED_SERVICE_TAGS[b as keyof typeof ENHANCED_SERVICE_TAGS]?.includes(
          'enhanced'
        );
      if (aEnhanced && !bEnhanced) return -1;
      if (!aEnhanced && bEnhanced) return 1;
      return 0;
    });

  console.log('🎯 Critical services to initialize:', criticalServices.join(', '));

  for (const serviceName of criticalServices) {
    try {
      const startTime = Date.now();
      await container.resolve(serviceName);
      const initTime = Date.now() - startTime;

      const tags =
        ENHANCED_SERVICE_TAGS[serviceName as keyof typeof ENHANCED_SERVICE_TAGS] || [];
      const isEnhanced = tags.includes('enhanced');
      const statusEmoji = isEnhanced ? '⚡' : '🔥';

      console.log(
        `${statusEmoji} Initialized critical service: ${serviceName} (${initTime}ms)${isEnhanced ? ' [Enhanced]' : ''}`
      );
    } catch (error) {
      console.error(`❌ Failed to initialize critical service ${serviceName}:`, error);
      throw new Error(
        `Critical enhanced service initialization failed: ${serviceName}`
      );
    }
  }

  console.log('🎯 All critical enhanced services initialized successfully');
}

/**
 * Initialize all enhanced services (non-critical ones too)
 */
export async function initializeAllEnhancedServices(
  container: ServiceContainer
): Promise<void> {
  console.log('🌟 Initializing all enhanced services...');

  const enhancedServices = Object.entries(ENHANCED_SERVICE_TAGS)
    .filter(([_, tags]) => tags.includes('enhanced'))
    .map(([serviceName]) => serviceName);

  const nonCriticalEnhanced = enhancedServices.filter(serviceName => {
    const tags =
      ENHANCED_SERVICE_TAGS[serviceName as keyof typeof ENHANCED_SERVICE_TAGS] || [];
    return !tags.includes('critical');
  });

  console.log('⚡ Enhanced services to initialize:', nonCriticalEnhanced.join(', '));

  for (const serviceName of nonCriticalEnhanced) {
    try {
      const startTime = Date.now();
      await container.resolve(serviceName);
      const initTime = Date.now() - startTime;

      console.log(`⚡ Initialized enhanced service: ${serviceName} (${initTime}ms)`);
    } catch (error) {
      console.warn(`⚠️ Failed to initialize enhanced service ${serviceName}:`, error);
      // Don't throw for non-critical services, just log warning
    }
  }

  console.log('🌟 All enhanced services initialization complete');
}

/**
 * Validate enhanced service configuration
 */
export function validateEnhancedServiceConfiguration(): boolean {
  console.log('🔍 Validating enhanced service configuration...');

  // Check that all services have factories
  const missingFactories = Object.keys(ENHANCED_SERVICE_DEPENDENCIES).filter(
    serviceName =>
      !EnhancedServiceFactoryRegistry[
        serviceName as keyof typeof EnhancedServiceFactoryRegistry
      ]
  );

  if (missingFactories.length > 0) {
    console.error('❌ Missing factories for enhanced services:', missingFactories);
    return false;
  }

  // Check that all dependencies are valid services
  for (const [serviceName, dependencies] of Object.entries(
    ENHANCED_SERVICE_DEPENDENCIES
  )) {
    for (const dep of dependencies) {
      if (
        !ENHANCED_SERVICE_DEPENDENCIES[
          dep as keyof typeof ENHANCED_SERVICE_DEPENDENCIES
        ]
      ) {
        console.error(
          `❌ Enhanced service ${serviceName} depends on unknown service: ${dep}`
        );
        return false;
      }
    }
  }

  // Check for circular dependencies
  try {
    getEnhancedServiceRegistrationOrder();
  } catch (error) {
    console.error('❌ Circular dependency detected in enhanced services:', error);
    return false;
  }

  // Validate enhanced service integrity
  const enhancedServices = Object.entries(ENHANCED_SERVICE_TAGS)
    .filter(([_, tags]) => tags.includes('enhanced'))
    .map(([serviceName]) => serviceName);

  console.log('⚡ Enhanced services found:', enhancedServices.join(', '));

  console.log('✅ Enhanced service configuration is valid');
  return true;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get enhanced services by tag
 */
export function getEnhancedServicesByTag(tag: string): string[] {
  return Object.entries(ENHANCED_SERVICE_TAGS)
    .filter(([_, tags]) => tags.includes(tag))
    .map(([serviceName]) => serviceName);
}

/**
 * Get enhanced service dependencies
 */
export function getEnhancedServiceDependencies(serviceName: string): string[] {
  return (
    ENHANCED_SERVICE_DEPENDENCIES[
      serviceName as keyof typeof ENHANCED_SERVICE_DEPENDENCIES
    ] || []
  );
}

/**
 * Check if service is enhanced
 */
export function isServiceEnhanced(serviceName: string): boolean {
  const tags =
    ENHANCED_SERVICE_TAGS[serviceName as keyof typeof ENHANCED_SERVICE_TAGS] || [];
  return tags.includes('enhanced');
}

/**
 * Get service statistics
 */
export function getEnhancedServiceStats() {
  const totalServices = Object.keys(ENHANCED_SERVICE_DEPENDENCIES).length;
  const enhancedServices = getEnhancedServicesByTag('enhanced');
  const criticalServices = getEnhancedServicesByTag('critical');
  const infrastructureServices = getEnhancedServicesByTag('infrastructure');
  const businessServices = getEnhancedServicesByTag('business');

  return {
    total: totalServices,
    enhanced: enhancedServices.length,
    critical: criticalServices.length,
    infrastructure: infrastructureServices.length,
    business: businessServices.length,
    enhancedPercentage: Math.round((enhancedServices.length / totalServices) * 100),
    services: {
      enhanced: enhancedServices,
      critical: criticalServices,
      infrastructure: infrastructureServices,
      business: businessServices,
    },
  };
}

/**
 * Generate service dependency graph visualization
 */
export function generateDependencyGraph(): string {
  const services = Object.keys(ENHANCED_SERVICE_DEPENDENCIES);
  let graph = '\n📊 Enhanced Service Dependency Graph:\n';
  graph += '========================================\n';

  const registrationOrder = getEnhancedServiceRegistrationOrder();

  for (const serviceName of registrationOrder) {
    const dependencies =
      ENHANCED_SERVICE_DEPENDENCIES[
        serviceName as keyof typeof ENHANCED_SERVICE_DEPENDENCIES
      ] || [];
    const tags =
      ENHANCED_SERVICE_TAGS[serviceName as keyof typeof ENHANCED_SERVICE_TAGS] || [];
    const isEnhanced = tags.includes('enhanced');
    const isCritical = tags.includes('critical');

    const icon = isEnhanced ? '⚡' : isCritical ? '🔥' : '📦';
    const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';

    graph += `${icon} ${serviceName}${tagStr}\n`;

    if (dependencies.length > 0) {
      for (let i = 0; i < dependencies.length; i++) {
        const dep = dependencies[i];
        const isLast = i === dependencies.length - 1;
        const connector = isLast ? '└─' : '├─';
        graph += `  ${connector} depends on: ${dep}\n`;
      }
    } else {
      graph += '  └─ no dependencies\n';
    }
    graph += '\n';
  }

  return graph;
}
