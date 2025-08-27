/**
 * Service Bootstrap and Initialization System
 * 
 * This file provides the main entry point for initializing the dependency injection
 * container and all enhanced services in the correct order.
 */

import { ServiceContainer } from './base/ServiceContainer';
import {
  registerEnhancedServices,
  initializeEnhancedCriticalServices,
  initializeAllEnhancedServices,
  validateEnhancedServiceConfiguration,
  getEnhancedServiceStats,
  generateDependencyGraph
} from './factories/EnhancedServiceRegistry';

// ============================================================================
// Global Service Container Instance
// ============================================================================

let globalServiceContainer: ServiceContainer | null = null;

/**
 * Get the global service container instance
 */
export function getServiceContainer(): ServiceContainer {
  if (!globalServiceContainer) {
    throw new Error('Service container not initialized. Call initializeServices() first.');
  }
  return globalServiceContainer;
}

/**
 * Create a new service container (used for testing)
 */
export function createServiceContainer(): ServiceContainer {
  return new ServiceContainer();
}

// ============================================================================
// Main Initialization Functions
// ============================================================================

/**
 * Initialize the complete service system
 * This is the main function to call during app startup
 */
export async function initializeServices(options: {
  skipNonCritical?: boolean;
  logDependencyGraph?: boolean;
  validateConfiguration?: boolean;
} = {}): Promise<ServiceContainer> {
  const {
    skipNonCritical = false,
    logDependencyGraph = true,
    validateConfiguration = true
  } = options;
  
  console.log('🎬 Starting Relife Service Initialization...');
  console.log('==========================================');
  
  try {
    // Step 1: Validate configuration
    if (validateConfiguration) {
      console.log('🔍 Step 1: Validating service configuration...');
      if (!validateEnhancedServiceConfiguration()) {
        throw new Error('Service configuration validation failed');
      }
      console.log('✅ Configuration validation passed');
    }
    
    // Step 2: Log dependency graph if requested
    if (logDependencyGraph) {
      console.log(generateDependencyGraph());
    }
    
    // Step 3: Create and configure container
    console.log('🏗️ Step 3: Creating service container...');
    globalServiceContainer = new ServiceContainer();
    
    // Step 4: Register all services
    console.log('📦 Step 4: Registering services...');
    await registerEnhancedServices(globalServiceContainer);
    
    // Step 5: Initialize critical services
    console.log('🔥 Step 5: Initializing critical services...');
    await initializeEnhancedCriticalServices(globalServiceContainer);
    
    // Step 6: Initialize container
    console.log('⚙️ Step 6: Initializing service container...');
    await globalServiceContainer.initialize();
    
    // Step 7: Initialize non-critical enhanced services (optional)
    if (!skipNonCritical) {
      console.log('⚡ Step 7: Initializing enhanced services...');
      await initializeAllEnhancedServices(globalServiceContainer);
    }
    
    // Step 8: Log statistics
    const stats = getEnhancedServiceStats();
    console.log('📊 Service Initialization Complete!');
    console.log('===================================');
    console.log(`✅ Total Services: ${stats.total}`);
    console.log(`⚡ Enhanced Services: ${stats.enhanced} (${stats.enhancedPercentage}%)`);
    console.log(`🔥 Critical Services: ${stats.critical}`);
    console.log(`🏗️ Infrastructure Services: ${stats.infrastructure}`);
    console.log(`💼 Business Services: ${stats.business}`);
    console.log('===================================');
    
    return globalServiceContainer;
    
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    
    // Clean up on failure
    if (globalServiceContainer) {
      try {
        await globalServiceContainer.dispose();
      } catch (cleanupError) {
        console.error('❌ Failed to clean up service container:', cleanupError);
      }
      globalServiceContainer = null;
    }
    
    throw error;
  }
}

/**
 * Initialize services for testing with minimal setup
 */
export async function initializeTestServices(): Promise<ServiceContainer> {
  console.log('🧪 Initializing services for testing...');
  
  return initializeServices({
    skipNonCritical: true,
    logDependencyGraph: false,
    validateConfiguration: true,
  });
}

/**
 * Initialize services for development with full logging
 */
export async function initializeDevServices(): Promise<ServiceContainer> {
  console.log('🛠️ Initializing services for development...');
  
  return initializeServices({
    skipNonCritical: false,
    logDependencyGraph: true,
    validateConfiguration: true,
  });
}

/**
 * Initialize services for production with optimizations
 */
export async function initializeProdServices(): Promise<ServiceContainer> {
  console.log('🚀 Initializing services for production...');
  
  return initializeServices({
    skipNonCritical: false,
    logDependencyGraph: false,
    validateConfiguration: false, // Skip validation in production for performance
  });
}

// ============================================================================
// Service Access Functions
// ============================================================================

/**
 * Get a service by name (with type safety)
 */
export function getService<T>(name: string): T {
  const container = getServiceContainer();
  return container.get<T>(name);
}

/**
 * Resolve a service asynchronously (with type safety)
 */
export async function resolveService<T>(name: string): Promise<T> {
  const container = getServiceContainer();
  return container.resolve<T>(name);
}

/**
 * Check if a service exists
 */
export function hasService(name: string): boolean {
  try {
    const container = getServiceContainer();
    return container.has(name);
  } catch {
    return false;
  }
}

// ============================================================================
// Cleanup Functions
// ============================================================================

/**
 * Dispose of all services and clean up resources
 */
export async function disposeServices(): Promise<void> {
  if (!globalServiceContainer) {
    console.warn('⚠️ Service container not initialized, nothing to dispose');
    return;
  }
  
  console.log('🧹 Disposing of services...');
  
  try {
    await globalServiceContainer.dispose();
    console.log('✅ Services disposed successfully');
  } catch (error) {
    console.error('❌ Failed to dispose services:', error);
    throw error;
  } finally {
    globalServiceContainer = null;
  }
}

// ============================================================================
// Health Check Functions
// ============================================================================

/**
 * Perform health check on all services
 */
export async function performHealthCheck(): Promise<{
  healthy: boolean;
  services: Record<string, any>;
  stats: any;
}> {
  if (!globalServiceContainer) {
    return {
      healthy: false,
      services: {},
      stats: { error: 'Service container not initialized' }
    };
  }
  
  console.log('🏥 Performing service health check...');
  
  try {
    const stats = getEnhancedServiceStats();
    const services: Record<string, any> = {};
    let overallHealthy = true;
    
    // Check critical services
    const criticalServices = stats.services.critical;
    for (const serviceName of criticalServices) {
      try {
        const service = globalServiceContainer.get(serviceName);
        const health = await (service as any).getHealth?.() || { status: 'unknown' };
        services[serviceName] = {
          status: 'healthy',
          critical: true,
          enhanced: stats.services.enhanced.includes(serviceName),
          health
        };
      } catch (error) {
        services[serviceName] = {
          status: 'unhealthy',
          critical: true,
          enhanced: stats.services.enhanced.includes(serviceName),
          error: (error as Error).message
        };
        overallHealthy = false;
      }
    }
    
    // Check enhanced services
    const enhancedServices = stats.services.enhanced.filter(s => !criticalServices.includes(s));
    for (const serviceName of enhancedServices) {
      try {
        const service = globalServiceContainer.get(serviceName);
        const health = await (service as any).getHealth?.() || { status: 'unknown' };
        services[serviceName] = {
          status: 'healthy',
          critical: false,
          enhanced: true,
          health
        };
      } catch (error) {
        services[serviceName] = {
          status: 'unhealthy',
          critical: false,
          enhanced: true,
          error: (error as Error).message
        };
        // Don't mark overall as unhealthy for non-critical services
      }
    }
    
    return {
      healthy: overallHealthy,
      services,
      stats
    };
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return {
      healthy: false,
      services: {},
      stats: { error: (error as Error).message }
    };
  }
}

// ============================================================================
// Debug Functions
// ============================================================================

/**
 * Get debug information about the service container
 */
export function getDebugInfo(): any {
  if (!globalServiceContainer) {
    return { error: 'Service container not initialized' };
  }
  
  return {
    stats: getEnhancedServiceStats(),
    dependencyGraph: generateDependencyGraph(),
    containerState: {
      initialized: true,
      serviceCount: Object.keys(getEnhancedServiceStats().services).length,
    }
  };
}

// ============================================================================
// Export Global Functions for Easy Access
// ============================================================================

// Export global functions for backward compatibility
export {
  registerEnhancedServices as registerServices,
  initializeEnhancedCriticalServices as initializeCriticalServices,
  validateEnhancedServiceConfiguration as validateServiceConfiguration,
  getEnhancedServiceStats as getServiceStats,
};