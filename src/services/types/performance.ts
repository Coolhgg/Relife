export interface PerformanceConfig {
  targetFPS: number;
  memoryLimit: number; // MB
  networkTimeout: number; // ms
  cacheSize: number; // MB
}

export interface PerformanceBudget {
  // Time budgets (ms)
  pageLoad: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  
  // Resource budgets
  totalBundleSize: number; // KB
  initialBundleSize: number; // KB
  imageSize: number; // KB
  audioSize: number; // KB
  
  // Memory budgets (MB)
  heapSize: number;
  domNodes: number;
  
  // Network budgets
  requestCount: number;
  requestDuration: number; // ms
}

export interface PerformanceThresholds {
  // Critical thresholds that trigger immediate action
  critical: {
    memoryUsage: number; // MB
    fps: number;
    responseTime: number; // ms
    errorRate: number; // percentage
  };
  
  // Warning thresholds that trigger optimization
  warning: {
    memoryUsage: number; // MB
    fps: number;
    responseTime: number; // ms
    errorRate: number; // percentage
  };
  
  // Good thresholds for optimal performance
  good: {
    memoryUsage: number; // MB
    fps: number;
    responseTime: number; // ms
    errorRate: number; // percentage
  };
}

export interface RenderingOptimizations {
  // Component-level optimizations
  memoization: boolean;
  virtualScrolling: boolean;
  lazyLoading: boolean;
  imageOptimization: boolean;
  
  // Animation optimizations
  reducedMotion: boolean;
  gpuAcceleration: boolean;
  willChange: boolean;
  
  // DOM optimizations
  elementRecycling: boolean;
  batchedUpdates: boolean;
  passiveListeners: boolean;
}

export interface MemoryOptimizations {
  // Cache management
  maxCacheSize: number; // MB
  cacheEvictionStrategy: 'lru' | 'lfu' | 'fifo' | 'intelligent';
  automaticCleanup: boolean;
  
  // Object management
  weakReferences: boolean;
  pooledObjects: boolean;
  manualGarbageCollection: boolean;
  
  // Memory monitoring
  memoryPressureDetection: boolean;
  leakDetection: boolean;
  heapSnapshots: boolean;
}

export interface NetworkOptimizations {
  // Request optimization
  requestBatching: boolean;
  connectionPooling: boolean;
  compressionEnabled: boolean;
  
  // Caching strategies
  serviceworkerCaching: boolean;
  browserCaching: boolean;
  cdnUsage: boolean;
  
  // Progressive loading
  resourceHints: boolean;
  preloadCritical: boolean;
  deferNonCritical: boolean;
}

export interface AdaptivePerformanceConfig {
  deviceTier: 'low-end' | 'mid-range' | 'high-end';
  budgets: PerformanceBudget;
  thresholds: PerformanceThresholds;
  optimizations: {
    rendering: RenderingOptimizations;
    memory: MemoryOptimizations;
    network: NetworkOptimizations;
  };
}

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'memory' | 'network' | 'user' | 'system';
  severity: 'good' | 'warning' | 'critical';
  deviceTier?: 'low-end' | 'mid-range' | 'high-end';
  context?: Record<string, any>;
}

export interface FrameRateMetrics {
  current: number;
  average: number;
  min: number;
  max: number;
  drops: number;
  targetFPS: number;
  history: number[];
}

export interface MemoryMetrics {
  used: number; // MB
  total: number; // MB
  limit: number; // MB
  percentage: number;
  pressure: 'low' | 'medium' | 'high' | 'critical';
  gcFrequency: number; // collections per minute
  heapGrowthRate: number; // MB per minute
}

export interface NetworkMetrics {
  latency: number; // ms
  bandwidth: number; // Mbps
  requestCount: number;
  failureRate: number; // percentage
  cacheHitRate: number; // percentage
  compressionRatio: number;
}

export interface RenderMetrics {
  paintTime: number; // ms
  layoutTime: number; // ms
  styleRecalcTime: number; // ms
  compositeTime: number; // ms
  domNodeCount: number;
  cssRuleCount: number;
  jsExecutionTime: number; // ms
}

export interface UserExperienceMetrics {
  firstContentfulPaint: number; // ms
  largestContentfulPaint: number; // ms
  cumulativeLayoutShift: number;
  firstInputDelay: number; // ms
  timeToInteractive: number; // ms
  totalBlockingTime: number; // ms
  interactionToNextPaint: number; // ms
}

export interface PerformanceSnapshot {
  timestamp: number;
  deviceTier: 'low-end' | 'mid-range' | 'high-end';
  frameRate: FrameRateMetrics;
  memory: MemoryMetrics;
  network: NetworkMetrics;
  rendering: RenderMetrics;
  userExperience: UserExperienceMetrics;
  overallScore: number; // 0-100
}

export interface PerformanceAlert {
  id: string;
  type: 'memory' | 'fps' | 'network' | 'render' | 'user';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: number;
  metrics: Partial<PerformanceSnapshot>;
  suggestions: string[];
  autoFix?: () => Promise<void>;
}

export interface DeviceAdaptation {
  // Automatic adaptations based on device capabilities
  audioQuality: 'low' | 'medium' | 'high';
  imageQuality: 'low' | 'medium' | 'high';
  animationComplexity: 'none' | 'simple' | 'complex';
  cacheStrategy: 'minimal' | 'moderate' | 'aggressive';
  preloadingStrategy: 'disabled' | 'conservative' | 'aggressive';
  
  // UI adaptations
  listVirtualization: boolean;
  lazyImageLoading: boolean;
  reducedAnimations: boolean;
  simplifiedUI: boolean;
  
  // Performance monitoring adaptations
  monitoringFrequency: number; // ms
  metricRetention: number; // count
  alertThresholds: PerformanceThresholds;
}

// Utility types for specific optimizations
export type OptimizationStrategy = 'none' | 'conservative' | 'balanced' | 'aggressive';

export interface ComponentOptimization {
  shouldMemoize: boolean;
  shouldVirtualize: boolean;
  shouldLazyLoad: boolean;
  updateStrategy: 'immediate' | 'batched' | 'deferred';
  rerenderStrategy: 'always' | 'shallow' | 'deep' | 'manual';
}

export interface AssetOptimization {
  compression: 'none' | 'light' | 'medium' | 'heavy';
  format: 'original' | 'webp' | 'avif' | 'optimized';
  quality: number; // 0-100
  lazy: boolean;
  progressive: boolean;
  responsive: boolean;
}

export interface CacheOptimization {
  strategy: 'lru' | 'lfu' | 'ttl' | 'intelligent';
  maxSize: number; // MB
  evictionThreshold: number; // percentage
  compressionEnabled: boolean;
  persistentStorage: boolean;
  backgroundSync: boolean;
}