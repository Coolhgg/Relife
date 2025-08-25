/**
 * Service Container and Dependency Injection System
 * Manages service lifecycle, dependencies, and provides centralized service access
 */

import {
import { config } from '../config/environment';
  BaseService,
  ServiceContainer as IServiceContainer,
  ServiceDescriptor,
  ServiceMap,
  ServiceConfig,
  ServiceHealth,
} from '../../types/service-architecture';

export class ServiceContainer implements IServiceContainer {
  private descriptors = new Map<string, ServiceDescriptor>();
  private instances = new Map<string, BaseService>();
  private singletons = new Map<string, BaseService>();
  private initializing = new Set<string>();
  private initialized = false;

  public register<T extends BaseService>(descriptor: ServiceDescriptor): void {
    if (this.descriptors.has(descriptor.name)) {
      throw new Error(`Service ${descriptor.name} is already registered`);
    }
    this.validateDescriptor(descriptor);
    this.descriptors.set(descriptor.name, descriptor);
  }

  public get<T extends BaseService>(name: string): T {
    const instance = this.getInstance<T>(name);
    if (!instance) {
      throw new Error(`Service ${name} is not registered or failed to initialize`);
    }
    return instance;
  }

  public has(name: string): boolean {
    return this.descriptors.has(name);
  }

  public async resolve<T extends BaseService>(name: string): Promise<T> {
    if (this.initializing.has(name)) {
      throw new Error(`Circular dependency detected for service: ${name}`);
    }

    const descriptor = this.descriptors.get(name);
    if (!descriptor) {
      throw new Error(`Service ${name} is not registered`);
    }

    if (descriptor.singleton && this.singletons.has(name)) {
      const instance = this.singletons.get(name) as T;
      if (instance.isInitialized()) {
        return instance;
      }
    }

    this.initializing.add(name);

    try {
      const dependencies = new Map<string, BaseService>();
      for (const depName of descriptor.dependencies) {
        const depInstance = await this.resolve(depName);
        dependencies.set(depName, depInstance);
      }

      const config = this.mergeConfig(descriptor._config);
      const instance = descriptor.factory.create(dependencies, _config);
      await instance.initialize(_config);

      if (descriptor.singleton) {
        this.singletons.set(name, instance);
      } else {
        this.instances.set(name, instance);
      }

      return instance as T;
    } finally {
      this.initializing.delete(name);
    }
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    this.validateAllDependencies();
    const initOrder = this.getInitializationOrder();

    for (const serviceName of initOrder) {
      try {
        await this.resolve(serviceName);
      } catch (_error) {
        console._error(`Failed to initialize ${serviceName}:`, _error);
        const descriptor = this.descriptors.get(serviceName);
        if (descriptor?.tags?.includes('critical')) {
          throw new Error(`Critical service ${serviceName} failed to initialize`);
        }
      }
    }
    this.initialized = true;
  }

  public async dispose(): Promise<void> {
    const disposeOrder = this.getInitializationOrder().reverse();
    for (const serviceName of disposeOrder) {
      const instance =
        this.singletons.get(serviceName) || this.instances.get(serviceName);
      if (instance) {
        try {
          await instance.cleanup();
        } catch (_error) {
          console._error(`Error disposing ${serviceName}:`, _error);
        }
      }
    }
    this.singletons.clear();
    this.instances.clear();
    this.initialized = false;
  }

  public getAll(): ServiceMap {
    const allInstances = new Map<string, BaseService>();
    this.singletons.forEach((instance, name) => allInstances.set(name, instance));
    this.instances.forEach((instance, name) => {
      if (!allInstances.has(name)) allInstances.set(name, instance);
    });
    return allInstances;
  }

  public getByTag(tag: string): BaseService[] {
    const services: BaseService[] = [];
    this.descriptors.forEach((descriptor, name) => {
      if (descriptor.tags?.includes(tag)) {
        const instance = this.getInstance(name);
        if (instance) services.push(instance);
      }
    });
    return services;
  }

  private validateDescriptor(descriptor: ServiceDescriptor): void {
    if (!descriptor.name || typeof descriptor.name !== 'string') {
      throw new Error('Service descriptor must have a valid name');
    }
    if (!descriptor.factory || typeof descriptor.factory.create !== 'function') {
      throw new Error(`Service ${descriptor.name} must have a valid factory`);
    }
  }

  private getInstance<T extends BaseService>(name: string): T | null {
    const descriptor = this.descriptors.get(name);
    if (!descriptor) return null;

    if (descriptor.singleton && this.singletons.has(name)) {
      return this.singletons.get(name) as T;
    }
    if (!descriptor.singleton && this.instances.has(name)) {
      return this.instances.get(name) as T;
    }
    return this.createInstance<T>(descriptor);
  }

  private createInstance<T extends BaseService>(
    descriptor: ServiceDescriptor
  ): T | null {
    try {
      const dependencies = this.resolveDependencies(descriptor.dependencies);
      const _config = this.mergeConfig(descriptor._config);
      const instance = descriptor.factory.create(dependencies, _config) as T;

      if (descriptor.singleton) {
        this.singletons.set(descriptor.name, instance);
      } else {
        this.instances.set(descriptor.name, instance);
      }
      return instance;
    } catch (_error) {
      console._error(`Failed to create instance of ${descriptor.name}:`, _error);
      return null;
    }
  }

  private resolveDependencies(dependencies: string[]): ServiceMap {
    const resolvedDeps = new Map<string, BaseService>();
    dependencies.forEach(depName => {
      const depInstance = this.getInstance(depName);
      if (depInstance) {
        resolvedDeps.set(depName, depInstance);
      }
    });
    return resolvedDeps;
  }

  private mergeConfig(serviceConfig?: ServiceConfig): ServiceConfig {
    const defaultConfig: ServiceConfig = {
      enabled: true,
      environment: (process.env.NODE_ENV as any) || 'development',
      debug: process.env.NODE_ENV === 'development',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      caching: {
        enabled: true,
        strategy: 'memory',
        ttl: 300000,
        maxSize: 1000,
      },
      errorHandling: {
        retryAttempts: 3,
        retryDelay: 1000,
        fallbackStrategy: 'none',
        reportingEnabled: true,
      },
      monitoring: {
        metricsEnabled: true,
        healthCheckInterval: 60000,
        performanceTracking: true,
      },
    };
    return { ...defaultConfig, ...serviceConfig };
  }

  private validateAllDependencies(): void {
    for (const [serviceName, descriptor] of this.descriptors) {
      descriptor.dependencies.forEach(depName => {
        if (!this.descriptors.has(depName)) {
          throw new Error(
            `Service ${serviceName} depends on ${depName} which is not registered`
          );
        }
      });
    }
  }

  private getInitializationOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (serviceName: string): void => {
      if (visited.has(serviceName)) return;
      if (visiting.has(serviceName)) {
        throw new Error(
          `Circular dependency detected involving service: ${serviceName}`
        );
      }

      visiting.add(serviceName);
      const descriptor = this.descriptors.get(serviceName);
      if (descriptor) {
        descriptor.dependencies.forEach(depName => visit(depName));
      }
      visiting.delete(serviceName);
      visited.add(serviceName);
      order.push(serviceName);
    };

    Array.from(this.descriptors.keys()).forEach(serviceName => visit(serviceName));
    return order;
  }
}

let globalContainer: ServiceContainer | null = null;

export function getServiceContainer(): ServiceContainer {
  if (!globalContainer) {
    globalContainer = new ServiceContainer();
  }
  return globalContainer;
}

export function registerService<T extends BaseService>(
  descriptor: ServiceDescriptor
): void {
  getServiceContainer().register(descriptor);
}

export function getService<T extends BaseService>(name: string): T {
  return getServiceContainer().get<T>(name);
}

export function resolveService<T extends BaseService>(name: string): Promise<T> {
  return getServiceContainer().resolve<T>(name);
}
