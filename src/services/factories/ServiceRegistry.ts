/**
 * Service Registry and Registration System
 *
 * This file provides centralized registration of all services with their
 * dependencies and configuration for the dependency injection container.
 */

import { ServiceContainer } from '../base/ServiceContainer';
import { ServiceDescriptor } from '../../types/service-architecture';
import {
  createServiceDescriptor,
  getDefaultServiceConfig,
  ServiceFactoryRegistry,
} from './ServiceFactories';

// ============================================================================
// Service Dependency Graph
// ============================================================================

/**
 * Service dependency definitions
 * Services are registered in dependency order (dependencies first)
 */
export const SERVICE_DEPENDENCIES = {
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
// Service Tags and Configuration
// ============================================================================

export const SERVICE_TAGS = {
  StorageService: ['infrastructure', 'critical'],
  SecurityService: ['infrastructure', 'critical'],
  AnalyticsService: ['core', 'tracking'],
  AudioService: ['core', 'media'],
  CacheService: ['infrastructure', 'performance'],
  PerformanceService: ['monitoring', 'metrics'],
  NotificationService: ['ui', 'communication'],
  BattleService: ['business', 'gaming'],
  VoiceService: ['ui', 'media', 'accessibility'],
  SubscriptionService: ['business', 'monetization'],
  AlarmService: ['business', 'critical', 'user-facing'],
};

export const SERVICE_CONFIGS = {
  StorageService: {
    ...getDefaultServiceConfig(),
    caching: {
      ...getDefaultServiceConfig().caching,
      strategy: 'indexedDB' as const,
      ttl: 86400000, // 24 hours for storage
    },
  },
  SecurityService: {
    ...getDefaultServiceConfig(),
    timeout: 5000, // Faster timeout for security checks
    errorHandling: {
      ...getDefaultServiceConfig().errorHandling,
      fallbackStrategy: 'none' as const, // No fallback for security
    },
  },
  AnalyticsService: {
    ...getDefaultServiceConfig(),
    caching: {
      ...getDefaultServiceConfig().caching,
      strategy: 'memory' as const,
      ttl: 60000, // 1 minute cache for analytics
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
    },
  },
};

// ============================================================================
// Registration Functions
// ============================================================================

/**
 * Register all services with the container in dependency order
 */
export async function registerAllServices(container: ServiceContainer): Promise<void> {
  console.log('🚀 Registering services with dependency injection container...');

  const registrationOrder = getServiceRegistrationOrder();

  for (const serviceName of registrationOrder) {
    try {
      const descriptor = createServiceDescriptor(
        serviceName as keyof typeof ServiceFactoryRegistry,
        SERVICE_DEPENDENCIES[serviceName as keyof typeof SERVICE_DEPENDENCIES] || [],
        true, // All services are singletons by default
        SERVICE_CONFIGS[serviceName as keyof typeof SERVICE_CONFIGS] ||
          getDefaultServiceConfig(),
        SERVICE_TAGS[serviceName as keyof typeof SERVICE_TAGS] || []
      );

      container.register(descriptor);
      console.log(`✅ Registered ${serviceName}`);
    } catch (error) {
      console.error(`❌ Failed to register ${serviceName}:`, error);
      throw new Error(`Service registration failed for ${serviceName}: ${error}`);
    }
  }

  console.log('📦 All services registered successfully');
}

/**
 * Get the correct order for service registration based on dependencies
 */
function getServiceRegistrationOrder(): string[] {
  const services = Object.keys(SERVICE_DEPENDENCIES);
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
      SERVICE_DEPENDENCIES[serviceName as keyof typeof SERVICE_DEPENDENCIES] || [];
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
 * Initialize all critical services
 */
export async function initializeCriticalServices(
  container: ServiceContainer
): Promise<void> {
  console.log('🔧 Initializing critical services...');

  const criticalServices = Object.entries(SERVICE_TAGS)
    .filter(([_, tags]) => tags.includes('critical'))
    .map(([serviceName]) => serviceName);

  for (const serviceName of criticalServices) {
    try {
      await container.resolve(serviceName);
      console.log(`✅ Initialized critical service: ${serviceName}`);
    } catch (error) {
      console.error(`❌ Failed to initialize critical service ${serviceName}:`, error);
      throw new Error(`Critical service initialization failed: ${serviceName}`);
    }
  }

  console.log('🎯 All critical services initialized successfully');
}

/**
 * Validate service configuration
 */
export function validateServiceConfiguration(): boolean {
  console.log('🔍 Validating service configuration...');

  // Check that all services have factories
  const missingFactories = Object.keys(SERVICE_DEPENDENCIES).filter(
    serviceName =>
      !ServiceFactoryRegistry[serviceName as keyof typeof ServiceFactoryRegistry]
  );

  if (missingFactories.length > 0) {
    console.error('❌ Missing factories for services:', missingFactories);
    return false;
  }

  // Check that all dependencies are valid services
  for (const [serviceName, dependencies] of Object.entries(SERVICE_DEPENDENCIES)) {
    for (const dep of dependencies) {
      if (!SERVICE_DEPENDENCIES[dep as keyof typeof SERVICE_DEPENDENCIES]) {
        console.error(`❌ Service ${serviceName} depends on unknown service: ${dep}`);
        return false;
      }
    }
  }

  // Check for circular dependencies
  try {
    getServiceRegistrationOrder();
  } catch (error) {
    console.error('❌ Circular dependency detected:', error);
    return false;
  }

  console.log('✅ Service configuration is valid');
  return true;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get services by tag
 */
export function getServicesByTag(tag: string): string[] {
  return Object.entries(SERVICE_TAGS)
    .filter(([_, tags]) => tags.includes(tag))
    .map(([serviceName]) => serviceName);
}

/**
 * Get service dependencies
 */
export function getServiceDependencies(serviceName: string): string[] {
  return SERVICE_DEPENDENCIES[serviceName as keyof typeof SERVICE_DEPENDENCIES] || [];
}

/**
 * Check if service has specific tag
 */
export function serviceHasTag(serviceName: string, tag: string): boolean {
  const tags = SERVICE_TAGS[serviceName as keyof typeof SERVICE_TAGS] || [];
  return tags.includes(tag);
}
