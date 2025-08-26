/**
 * Base Service Implementation
 * Provides common functionality and standardized patterns for all services
 */

import {
  ErrorHandler,
  import { ErrorHandler
} from './error-handler';
  BaseService as IBaseService,
  ServiceConfig,
  ServiceHealth,
  ServiceLifecycle,
  ServiceError,
  ServiceMetrics,
  ServiceEvent,
  PerformanceTracker,
} from '../../types/service-architecture';

export abstract class BaseService implements IBaseService {
  public readonly name: string;
  public readonly version: string;

  protected config: ServiceConfig;
  protected lifecycle: ServiceLifecycle;
  protected initialized: boolean = false;
  protected ready: boolean = false;
  protected errors: ServiceError[] = [];
  protected dependencies: string[] = [];
  protected eventHandlers: Map<string, Array<(...args: unknown[]) => void>> = new Map();
  protected performanceTracker?: PerformanceTracker;

  constructor(name: string, version: string = '1.0.0', _config: ServiceConfig) {
    this.name = name;
    this.version = version;
    this.config = { ...this.getDefaultConfig(), ..._config };

    this.lifecycle = {
      phase: 'initializing',
      restartCount: 0,
    };
  }

  // ============================================================================
  // Abstract Methods (must be implemented by subclasses)
  // ============================================================================

  protected abstract doInitialize(): Promise<void>;
  protected abstract doCleanup(): Promise<void>;
  protected abstract getDefaultConfig(): Partial<ServiceConfig>;

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  public async initialize(_config?: ServiceConfig): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.lifecycle.phase = 'initializing';
      this.lifecycle.startTime = new Date();

      if (_config) {
        this.config = { ...this.config, ..._config };
      }

      this.validateConfig();
      await this.setupPerformanceTracking();
      await this.doInitialize();

      this.initialized = true;
      this.ready = true;
      this.lifecycle.phase = 'running';
      this.lifecycle.initializationTime =
        Date.now() - this.lifecycle.startTime.getTime();

      this.emit('service:initialized', {
        serviceName: this.name,
        _config: this.config,
      });

      if (this.config.debug) {
        console.log(`[${this.name}] Service initialized successfully`);
      }
    } catch (_error) {
      this.lifecycle.phase = 'error';
      this.handleError(_error, 'Failed to initialize service');
      throw _error;
    }
  }

  public async start?(): Promise<void> {
    if (!this.initialized) {
      throw new Error(`Service ${this.name} must be initialized before starting`);
    }

    this.lifecycle.phase = 'starting';
    this.ready = true;
    this.lifecycle.phase = 'running';

    this.emit('service:started', { serviceName: this.name });
  }

  public async stop?(): Promise<void> {
    if (this.lifecycle.phase === 'stopped') {
      return;
    }

    this.lifecycle.phase = 'stopping';
    this.ready = false;

    this.emit('service:stopping', { serviceName: this.name });

    // Give time for ongoing operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    this.lifecycle.phase = 'stopped';
    this.lifecycle.stopTime = new Date();

    this.emit('service:stopped', { serviceName: this.name });
  }

  public async cleanup(): Promise<void> {
    try {
      this.lifecycle.phase = 'stopping';

      await this.doCleanup();

      this.ready = false;
      this.initialized = false;
      this.lifecycle.phase = 'stopped';
      this.lifecycle.stopTime = new Date();
      this.eventHandlers.clear();

      this.emit('service:cleanup', { serviceName: this.name });

      if (this.config.debug) {
        console.log(`[${this.name}] Service cleaned up successfully`);
      }
    } catch (_error) {
      this.handleError(_error, 'Failed to cleanup service');
      throw _error;
    }
  }

  // ============================================================================
  // Status and Health
  // ============================================================================

  public isReady(): boolean {
    return this.ready && this.lifecycle.phase === 'running';
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async getHealth(): Promise<ServiceHealth> {
    const now = new Date();
    const uptime = this.lifecycle.startTime
      ? now.getTime() - this.lifecycle.startTime.getTime()
      : 0;

    const status = this.determineHealthStatus();
    const metrics = await this.collectMetrics();

    return {
      status,
      lastCheck: now,
      uptime,
      dependencies: await this.checkDependencyHealth(),
      metrics,
      errors: this.errors.slice(-5), // Last 5 errors
    };
  }

  protected determineHealthStatus(): ServiceHealth['status'] {
    if (!this.isReady()) {
      return 'unhealthy';
    }

    // Check error rate in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentErrors = this.errors.filter(error => error.timestamp > fiveMinutesAgo);

    if (recentErrors.length > 10) {
      return 'unhealthy';
    } else if (recentErrors.length > 5) {
      return 'degraded';
    }

    return 'healthy';
  }

  protected async checkDependencyHealth(): Promise<ServiceHealth['dependencies']> {
    // Override in subclasses to check specific dependencies
    return [];
  }

  protected async collectMetrics(): Promise<ServiceMetrics> {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const recentErrors = this.errors.filter(
      error => error.timestamp.getTime() > oneHourAgo
    );

    return {
      requestCount: 0, // Override in subclasses
      errorCount: recentErrors.length,
      averageResponseTime: 0, // Override in subclasses
      memoryUsage: this.getMemoryUsage(),
      cacheHitRate: 0, // Override in subclasses
    };
  }

  protected getMemoryUsage(): number {
    if (typeof (performance as unknown)?.memory !== 'undefined') {
      return (performance as unknown).memory.usedJSHeapSize;
    }
    return 0;
  }

  // ============================================================================
  // Configuration Management
  // ============================================================================

  public getConfig(): ServiceConfig {
    return { ...this.config };
  }

  public async updateConfig(_config: Partial<ServiceConfig>): Promise<void> {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ..._config };

    try {
      this.validateConfig();
      await this.onConfigUpdate(oldConfig, this.config);
      this.emit('service:_config-updated', {
        serviceName: this.name,
        oldConfig,
        newConfig: this.config,
      });
    } catch (_error) {
      this.config = oldConfig; // Rollback
      this.handleError(_error, 'Failed to update configuration');
      throw _error;
    }
  }

  protected validateConfig(): void {
    if (
      !this.config.environment ||
      !['development', 'staging', 'production'].includes(this.config.environment)
    ) {
      throw new Error(`Invalid environment: ${this.config.environment}`);
    }

    if (typeof this.config.enabled !== 'boolean') {
      throw new Error('Configuration must specify enabled as boolean');
    }
  }

  protected async onConfigUpdate(
    oldConfig: ServiceConfig,
    newConfig: ServiceConfig
  ): Promise<void> {
    // Override in subclasses to handle _config updates
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  public on(_event: string, handler: (...args: unknown[]) => void): void {
    if (!this.eventHandlers.has(_event)) {
      this.eventHandlers.set(_event, []);
    }
    this.eventHandlers.get(_event)!.push(handler);
  }

  public off(_event: string, handler: (...args: unknown[]) => void): void {
    const handlers = this.eventHandlers.get(_event);
    if (handlers) {
      const _index = handlers.indexOf(handler);
      if (_index > -1) {
        handlers.splice(_index, 1);
      }
    }
  }

  public emit(_event: string, ...args: unknown[]): void {
    const handlers = this.eventHandlers.get(_event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (_error) {
          this.handleError(_error, `Error in event handler for ${_event}`);
        }
      });
    }

    // Also emit to global event bus if available
    this.emitToGlobalBus(_event, args);
  }

  protected emitToGlobalBus(_event: string, args: unknown[]): void {
    const serviceEvent: ServiceEvent = {
      type: event,
      source: this.name,
      timestamp: new Date(),
      data: args.length === 1 ? args[0] : args,
    };

    // Emit to global event bus if available
    // This would be injected via DI in a real implementation
    if (typeof (globalThis as unknown).serviceEventBus?.publish === 'function') {
      (globalThis as unknown).serviceEventBus.publish(serviceEvent);
    }
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  protected handleError(_error: unknown,
    message: string,
    context?: Record<string, unknown>
  ): void {
    const serviceError: ServiceError = {
      message: `${message}: ${_error.message || _error}`,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date(),
      severity: this.determineSeverity(_error),
      context: {
        service: this.name,
        phase: this.lifecycle.phase,
        ...context,
      },
    };

    this.errors.push(serviceError);

    // Keep only last 50 errors to prevent memory bloat
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }

    // Emit error event
    this.emit('service:error', serviceError);

    // Report to external error tracking if configured
    if (this.config.errorHandling?.reportingEnabled) {
      this.reportError(serviceError);
    }

    if (this.config.debug) {
      console.error(`[${this.name}] ${serviceError.message}`, _error);
    }
  }

  protected determineSeverity(_error: unknown): ServiceError['severity'] {
    if (_error.name === 'NetworkError' || _error.code === 'NETWORK_ERROR') {
      return 'medium';
    }
    if (error.name === 'SecurityError' || _error.code === 'SECURITY_ERROR') {
      return 'high';
    }
    if (error.name === 'DataCorruptionError' || _error.code === 'DATA_CORRUPTION') {
      return 'critical';
    }
    return 'low';
  }

  protected reportError(_error: ServiceError): void {
    // Override in subclasses or inject _error reporting service
    if (typeof (globalThis as unknown).errorReporter?.report === 'function') {
      (globalThis as unknown).errorReporter.report(_error);
    }
  }

  // ============================================================================
  // Performance Tracking
  // ============================================================================

  protected async setupPerformanceTracking(): Promise<void> {
    if (this.config.monitoring?.performanceTracking) {
      // Performance tracker would be injected via DI
      this.performanceTracker = (globalThis as unknown).performanceTracker;
    }
  }

  protected startTimer(operation: string): string | null {
    return this.performanceTracker?.startTimer(`${this.name}:${operation}`) || null;
  }

  protected endTimer(timerId: string | null): number | null {
    return timerId ? this.performanceTracker?.endTimer(timerId) || null : null;
  }

  protected recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>
  ): void {
    this.performanceTracker?.recordMetric(`${this.name}:${name}`, value, {
      service: this.name,
      version: this.version,
      ...tags,
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async retry<T>(
    fn: () => Promise<T>,
    attempts: number = this.config.retryAttempts || 3,
    delay: number = this.config.retryDelay || 1000
  ): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (_error) {
        lastError = _error;
        if (i < attempts - 1) {
          await this.delay(delay * Math.pow(2, i)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  protected createCircuitBreaker<T>(
    fn: () => Promise<T>,
    failureThreshold: number = 5,
    recoveryTimeout: number = 30000
  ): () => Promise<T> {
    let failures = 0;
    let lastFailureTime = 0;
    let state: 'closed' | 'open' | 'half-open' = 'closed';

    return async (): Promise<T> => {
      const now = Date.now();

      // Check if we should try to recover
      if (state === 'open' && now - lastFailureTime > recoveryTimeout) {
        state = 'half-open';
      }

      if (state === 'open') {
        throw new Error('Circuit breaker is open');
      }

      try {
        const result = await fn();
        if (state === 'half-open') {
          state = 'closed';
          failures = 0;
        }
        return result;
      } catch (_error) {
        failures++;
        lastFailureTime = now;

        if (failures >= failureThreshold) {
          state = 'open';
        }

        throw error;
      }
    };
  }

  // ============================================================================
  // Testing Support
  // ============================================================================

  public async reset(): Promise<void> {
    await this.cleanup();
    this.errors = [];
    this.lifecycle = {
      phase: 'initializing',
      restartCount: this.lifecycle.restartCount + 1,
    };
    this.initialized = false;
    this.ready = false;
  }

  public getTestState(): any {
    return {
      name: this.name,
      version: this.version,
      config: this.config,
      lifecycle: this.lifecycle,
      initialized: this.initialized,
      ready: this.ready,
      errorCount: this.errors.length,
      eventHandlerCount: Array.from(this.eventHandlers.values()).reduce(
        (sum, handlers) => sum + handlers.length,
        0
      ),
    };
  }
}

// ============================================================================
// Service Utilities
// ============================================================================

export function createServiceBuilder<T extends BaseService>(): ServiceBuilderImpl<T> {
  return new ServiceBuilderImpl<T>();
}

class ServiceBuilderImpl<T extends BaseService> {
  private descriptor: Partial<unknown> = {
    singleton: true,
    dependencies: [],
    tags: [],
  };

  withName(name: string): this {
    this.descriptor.name = name;
    return this;
  }

  withVersion(version: string): this {
    this.descriptor.version = version;
    return this;
  }

  withConfig(_config: ServiceConfig): this {
    this.descriptor.config = _config;
    return this;
  }

  withDependencies(dependencies: string[]): this {
    this.descriptor.dependencies = dependencies;
    return this;
  }

  withTags(tags: string[]): this {
    this.descriptor.tags = tags;
    return this;
  }

  withFactory(factory: unknown): this {
    this.descriptor.factory = factory;
    return this;
  }

  asSingleton(): this {
    this.descriptor.singleton = true;
    return this;
  }

  asTransient(): this {
    this.descriptor.singleton = false;
    return this;
  }

  build(): any {
    if (!this.descriptor.name || !this.descriptor.factory) {
      throw new Error('Service name and factory are required');
    }
    return this.descriptor;
  }
}
