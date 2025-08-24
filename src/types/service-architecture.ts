/**
 * Service Architecture Types and Interfaces
 * Provides standardized patterns for all services in the application
 */

// ============================================================================
// Core Service Interfaces
// ============================================================================

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  uptime: number;
  dependencies: ServiceDependencyHealth[];
  metrics?: ServiceMetrics;
  errors?: ServiceError[];
}

export interface ServiceDependencyHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: Date;
}

export interface ServiceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  memoryUsage?: number;
  cacheHitRate?: number;
}

export interface ServiceError {
  message: string;
  code: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

// ============================================================================
// Base Service Interface
// ============================================================================

export interface BaseService {
  readonly name: string;
  readonly version: string;
  
  // Lifecycle methods
  initialize(config?: ServiceConfig): Promise<void>;
  start?(): Promise<void>;
  stop?(): Promise<void>;
  cleanup(): Promise<void>;
  
  // Status and health
  isReady(): boolean;
  isInitialized(): boolean;
  getHealth(): Promise<ServiceHealth>;
  
  // Configuration
  getConfig(): ServiceConfig;
  updateConfig(config: Partial<ServiceConfig>): Promise<void>;
  
  // Event handling
  on?(event: string, handler: (...args: any[]) => void): void;
  off?(event: string, handler: (...args: any[]) => void): void;
  emit?(event: string, ...args: any[]): void;
}

// ============================================================================
// Service Configuration
// ============================================================================

export interface ServiceConfig {
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  debug?: boolean;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  caching?: CacheConfig;
  errorHandling?: ErrorHandlingConfig;
  monitoring?: MonitoringConfig;
  [key: string]: any;
}

export interface CacheConfig {
  enabled: boolean;
  strategy: 'memory' | 'localStorage' | 'indexedDB' | 'hybrid';
  ttl: number; // Time to live in milliseconds
  maxSize?: number;
  evictionPolicy?: 'lru' | 'fifo' | 'ttl';
  namespace?: string;
}

export interface ErrorHandlingConfig {
  retryAttempts: number;
  retryDelay: number;
  circuitBreaker?: CircuitBreakerConfig;
  fallbackStrategy?: 'cache' | 'mock' | 'offline' | 'none';
  reportingEnabled: boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export interface MonitoringConfig {
  metricsEnabled: boolean;
  healthCheckInterval: number;
  performanceTracking: boolean;
  alerting?: AlertingConfig;
}

export interface AlertingConfig {
  enabled: boolean;
  thresholds: {
    responseTime: number;
    errorRate: number;
    availability: number;
  };
  channels: string[];
}

// ============================================================================
// Dependency Injection
// ============================================================================

export interface ServiceDescriptor {
  name: string;
  factory: ServiceFactory<any>;
  dependencies: string[];
  singleton: boolean;
  config?: ServiceConfig;
  tags?: string[];
}

export interface ServiceFactory<T extends BaseService> {
  create(dependencies: ServiceMap, config: ServiceConfig): T;
}

export interface ServiceContainer {
  register<T extends BaseService>(descriptor: ServiceDescriptor): void;
  get<T extends BaseService>(name: string): T;
  has(name: string): boolean;
  resolve<T extends BaseService>(name: string): Promise<T>;
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  getAll(): ServiceMap;
  getByTag(tag: string): BaseService[];
}

export type ServiceMap = Map<string, BaseService>;

// ============================================================================
// Caching Interfaces
// ============================================================================

export interface CacheEntry<T = any> {
  value: T;
  timestamp: Date;
  ttl: number;
  hits: number;
  tags?: string[];
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(pattern?: string): Promise<string[]>;
  size(): Promise<number>;
  stats(): Promise<CacheStats>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

export interface CacheManager {
  getProvider(strategy: CacheConfig['strategy']): CacheProvider;
  evict(tags: string[]): Promise<void>;
  cleanup(): Promise<void>;
  getGlobalStats(): Promise<CacheStats>;
}

// ============================================================================
// Event System
// ============================================================================

export interface ServiceEvent {
  type: string;
  source: string;
  timestamp: Date;
  data?: any;
  correlationId?: string;
}

export interface EventBus {
  subscribe(eventType: string, handler: (event: ServiceEvent) => void): void;
  unsubscribe(eventType: string, handler: (event: ServiceEvent) => void): void;
  publish(event: ServiceEvent): void;
  publishAsync(event: ServiceEvent): Promise<void>;
}

// ============================================================================
// Service Lifecycle
// ============================================================================

export interface ServiceLifecycle {
  phase: 'initializing' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  startTime?: Date;
  stopTime?: Date;
  initializationTime?: number;
  restartCount: number;
  lastError?: ServiceError;
}

// ============================================================================
// Performance Monitoring
// ============================================================================

export interface PerformanceTracker {
  startTimer(operation: string): string;
  endTimer(timerId: string): number;
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
  recordEvent(name: string, data?: any): void;
  getMetrics(timeRange?: { start: Date; end: Date }): Promise<PerformanceMetrics>;
}

export interface PerformanceMetrics {
  operations: OperationMetrics[];
  events: EventMetrics[];
  summary: {
    totalOperations: number;
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
  };
}

export interface OperationMetrics {
  name: string;
  count: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  errorCount: number;
  successRate: number;
}

export interface EventMetrics {
  name: string;
  count: number;
  lastOccurrence: Date;
  data?: any;
}

// ============================================================================
// Service Registry
// ============================================================================

export interface ServiceRegistry {
  register(service: BaseService): void;
  unregister(serviceName: string): void;
  get<T extends BaseService>(serviceName: string): T | null;
  getAll(): BaseService[];
  getByTag(tag: string): BaseService[];
  discover(criteria: ServiceDiscoveryCriteria): BaseService[];
  getHealth(): Promise<ServiceRegistryHealth>;
}

export interface ServiceDiscoveryCriteria {
  name?: string;
  version?: string;
  tags?: string[];
  status?: ServiceHealth['status'];
  environment?: ServiceConfig['environment'];
}

export interface ServiceRegistryHealth {
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  unhealthyServices: number;
  services: Array<{
    name: string;
    status: ServiceHealth['status'];
    lastCheck: Date;
  }>;
}

// ============================================================================
// Specialized Service Types
// ============================================================================

export interface AlarmServiceInterface extends BaseService {
  createAlarm(alarm: any): Promise<any>;
  updateAlarm(id: string, updates: any): Promise<any>;
  deleteAlarm(id: string): Promise<boolean>;
  getAlarms(): Promise<any[]>;
  triggerAlarm(id: string): Promise<void>;
  snoozeAlarm(id: string, duration: number): Promise<void>;
}

export interface AnalyticsServiceInterface extends BaseService {
  track(event: string, properties?: Record<string, any>): Promise<void>;
  identify(userId: string, traits?: Record<string, any>): Promise<void>;
  page(name: string, properties?: Record<string, any>): Promise<void>;
  flush(): Promise<void>;
  getQueueSize(): number;
}

export interface SubscriptionServiceInterface extends BaseService {
  getSubscription(userId: string): Promise<any>;
  createSubscription(data: any): Promise<any>;
  updateSubscription(id: string, updates: any): Promise<any>;
  cancelSubscription(id: string): Promise<void>;
  checkFeatureAccess(feature: string): boolean;
}

export interface BattleServiceInterface extends BaseService {
  createBattle(config: any): Promise<any>;
  joinBattle(battleId: string, userId: string): Promise<any>;
  updateBattleProgress(battleId: string, progress: any): Promise<void>;
  getBattleHistory(userId: string): Promise<any[]>;
  endBattle(battleId: string): Promise<any>;
}

export interface VoiceServiceInterface extends BaseService {
  speak(text: string, options?: any): Promise<void>;
  stop(): Promise<void>;
  getVoices(): Promise<any[]>;
  setVoice(voiceId: string): Promise<void>;
  generateAudio(text: string, voiceId: string): Promise<string>;
}

export interface PerformanceMonitorInterface extends BaseService {
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
  recordWebVital(name: string, value: number): void;
  setThreshold(metric: string, threshold: number): void;
  getMetrics(timeRange?: { start: Date; end: Date }): Promise<any>;
  createAlert(config: any): Promise<string>;
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

export function isBaseService(obj: any): obj is BaseService {
  return obj && 
    typeof obj.name === 'string' &&
    typeof obj.version === 'string' &&
    typeof obj.initialize === 'function' &&
    typeof obj.cleanup === 'function' &&
    typeof obj.isReady === 'function' &&
    typeof obj.getHealth === 'function';
}

export function isServiceConfig(obj: any): obj is ServiceConfig {
  return obj && 
    typeof obj.enabled === 'boolean' &&
    typeof obj.environment === 'string' &&
    ['development', 'staging', 'production'].includes(obj.environment);
}

// ============================================================================
// Service Builder
// ============================================================================

export interface ServiceBuilder<T extends BaseService> {
  withName(name: string): ServiceBuilder<T>;
  withVersion(version: string): ServiceBuilder<T>;
  withConfig(config: ServiceConfig): ServiceBuilder<T>;
  withDependencies(dependencies: string[]): ServiceBuilder<T>;
  withTags(tags: string[]): ServiceBuilder<T>;
  withFactory(factory: ServiceFactory<T>): ServiceBuilder<T>;
  asSingleton(): ServiceBuilder<T>;
  asTransient(): ServiceBuilder<T>;
  build(): ServiceDescriptor;
}