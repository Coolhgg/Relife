/**
 * Dependency Injection System Validation Script
 *
 * This script validates the entire DI system including:
 * - Service configuration validation
 * - Service registration and initialization
 * - Service dependency resolution
 * - Service health checks
 * - Performance metrics
 */

import {
  validateEnhancedServiceConfiguration,
  getEnhancedServiceStats,
  generateDependencyGraph,
  registerEnhancedServices,
  initializeEnhancedCriticalServices,
  initializeAllEnhancedServices,
} from './factories/EnhancedServiceRegistry';
import { ServiceContainer } from './base/ServiceContainer';
import {
  initializeTestServices,
  performHealthCheck,
  getDebugInfo,
  disposeServices,
} from './ServiceBootstrap';

interface ValidationResult {
  stage: string;
  success: boolean;
  details: any;
  error?: Error;
  duration?: number;
}

class DIValidator {
  private results: ValidationResult[] = [];

  async validate(): Promise<ValidationResult[]> {
    console.log('🔍 Starting Dependency Injection System Validation...');
    console.log('='.repeat(60));

    await this.validateConfiguration();
    await this.validateServiceRegistration();
    await this.validateServiceInitialization();
    await this.validateServiceDependencies();
    await this.validateServiceHealth();
    await this.validatePerformance();
    await this.validateCleanup();

    this.printResults();
    return this.results;
  }

  private async runValidationStage<T>(
    stage: string,
    validator: () => Promise<T>
  ): Promise<T | null> {
    const startTime = Date.now();
    console.log(`\n🧪 ${stage}...`);

    try {
      const result = await validator();
      const duration = Date.now() - startTime;

      this.results.push({
        stage,
        success: true,
        details: result,
        duration,
      });

      console.log(`✅ ${stage} - PASSED (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.results.push({
        stage,
        success: false,
        details: null,
        error: error as Error,
        duration,
      });

      console.log(`❌ ${stage} - FAILED (${duration}ms)`);
      console.error(`   Error: ${(error as Error).message}`);
      return null;
    }
  }

  private async validateConfiguration(): Promise<void> {
    await this.runValidationStage('Configuration Validation', async () => {
      const isValid = validateEnhancedServiceConfiguration();
      if (!isValid) {
        throw new Error('Service configuration validation failed');
      }

      const stats = getEnhancedServiceStats();
      const graph = generateDependencyGraph();

      console.log(`   📊 Total Services: ${stats.total}`);
      console.log(
        `   ⚡ Enhanced Services: ${stats.enhanced} (${stats.enhancedPercentage}%)`
      );
      console.log(`   🔥 Critical Services: ${stats.critical}`);
      console.log(`   🏗️ Infrastructure Services: ${stats.infrastructure}`);
      console.log(`   💼 Business Services: ${stats.business}`);

      return { stats, graph };
    });
  }

  private async validateServiceRegistration(): Promise<void> {
    await this.runValidationStage('Service Registration', async () => {
      const container = new ServiceContainer();

      await registerEnhancedServices(container);

      // Check that all expected services are registered
      const stats = getEnhancedServiceStats();
      const allServiceNames = [
        ...stats.services.enhanced,
        ...stats.services.critical,
        ...stats.services.infrastructure,
        ...stats.services.business,
      ];

      // Remove duplicates
      const uniqueServiceNames = [...new Set(allServiceNames)];

      for (const serviceName of uniqueServiceNames) {
        if (!container.has(serviceName)) {
          throw new Error(`Service ${serviceName} was not registered`);
        }
      }

      await container.dispose();

      return {
        registeredServices: uniqueServiceNames,
        count: uniqueServiceNames.length,
      };
    });
  }

  private async validateServiceInitialization(): Promise<void> {
    await this.runValidationStage('Service Initialization', async () => {
      const container = await initializeTestServices();

      // Check that services are properly initialized
      const stats = getEnhancedServiceStats();
      const criticalServices = stats.services.critical;

      const initializationResults = [];

      for (const serviceName of criticalServices) {
        if (container.has(serviceName)) {
          const service = await container.resolve(serviceName);
          const isInitialized = service.isInitialized();

          initializationResults.push({
            service: serviceName,
            initialized: isInitialized,
          });

          if (!isInitialized) {
            throw new Error(`Critical service ${serviceName} failed to initialize`);
          }
        }
      }

      await disposeServices();

      return {
        criticalServices: initializationResults,
        totalInitialized: initializationResults.length,
      };
    });
  }

  private async validateServiceDependencies(): Promise<void> {
    await this.runValidationStage('Service Dependencies', async () => {
      const container = await initializeTestServices();

      // Test AlarmService (has multiple dependencies)
      const alarmService = await container.resolve('AlarmService');
      expect(alarmService).toBeDefined();
      expect(alarmService.isInitialized()).toBe(true);

      // Test AnalyticsService (depends on StorageService)
      const analyticsService = await container.resolve('AnalyticsService');
      expect(analyticsService).toBeDefined();
      expect(analyticsService.isInitialized()).toBe(true);

      // Test StorageService (no dependencies)
      const storageService = await container.resolve('StorageService');
      expect(storageService).toBeDefined();
      expect(storageService.isInitialized()).toBe(true);

      // Test singleton behavior
      const alarmService2 = await container.resolve('AlarmService');
      if (alarmService !== alarmService2) {
        throw new Error('Services are not properly implemented as singletons');
      }

      await disposeServices();

      return {
        testedServices: ['AlarmService', 'AnalyticsService', 'StorageService'],
        singletonBehavior: 'verified',
      };
    });
  }

  private async validateServiceHealth(): Promise<void> {
    await this.runValidationStage('Service Health', async () => {
      await initializeTestServices();

      const healthResult = await performHealthCheck();

      if (
        !healthResult.healthy &&
        Object.values(healthResult.services).some(
          s => s.critical && s.status === 'unhealthy'
        )
      ) {
        throw new Error('Critical services are unhealthy');
      }

      await disposeServices();

      return healthResult;
    });
  }

  private async validatePerformance(): Promise<void> {
    await this.runValidationStage('Performance Validation', async () => {
      const initStartTime = Date.now();
      await initializeTestServices();
      const initTime = Date.now() - initStartTime;

      if (initTime > 5000) {
        // 5 seconds
        console.warn(`   ⚠️ Initialization took ${initTime}ms (longer than expected)`);
      }

      const healthStartTime = Date.now();
      await performHealthCheck();
      const healthTime = Date.now() - healthStartTime;

      if (healthTime > 1000) {
        // 1 second
        console.warn(`   ⚠️ Health check took ${healthTime}ms (longer than expected)`);
      }

      await disposeServices();

      return {
        initializationTime: initTime,
        healthCheckTime: healthTime,
        performanceGrade:
          initTime < 2000 && healthTime < 500
            ? 'A'
            : initTime < 5000 && healthTime < 1000
              ? 'B'
              : 'C',
      };
    });
  }

  private async validateCleanup(): Promise<void> {
    await this.runValidationStage('Cleanup Validation', async () => {
      await initializeTestServices();

      // Services should be available
      const debugInfo = getDebugInfo();
      if (debugInfo.error) {
        throw new Error('Services not properly initialized before cleanup');
      }

      await disposeServices();

      // Services should be cleaned up
      try {
        getDebugInfo();
        throw new Error('Services were not properly disposed');
      } catch (error) {
        if ((error as Error).message.includes('not initialized')) {
          // This is expected
          return { cleanupSuccessful: true };
        }
        throw error;
      }
    });
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📋 DEPENDENCY INJECTION VALIDATION RESULTS');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalTime = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏱️  Total Time: ${totalTime}ms`);
    console.log(
      `   🎯 Success Rate: ${Math.round((passed / this.results.length) * 100)}%`
    );

    if (failed > 0) {
      console.log(`\n❌ Failed Stages:`);
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   • ${r.stage}: ${r.error?.message}`);
        });
    }

    console.log(
      `\n${passed === this.results.length ? '🎉 ALL VALIDATIONS PASSED!' : '⚠️  SOME VALIDATIONS FAILED'}`
    );
    console.log('='.repeat(60));
  }
}

// Helper function for assertions (simple implementation)
function expect(value: any) {
  return {
    toBeDefined: () => {
      if (value === undefined) {
        throw new Error('Expected value to be defined');
      }
    },
    toBe: (expected: any) => {
      if (value !== expected) {
        throw new Error(`Expected ${value} to be ${expected}`);
      }
    },
  };
}

// Main validation function
export async function validateDependencyInjection(): Promise<boolean> {
  const validator = new DIValidator();
  const results = await validator.validate();

  return results.every(r => r.success);
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateDependencyInjection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation failed with error:', error);
      process.exit(1);
    });
}
