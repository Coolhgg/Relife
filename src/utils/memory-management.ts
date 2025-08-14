/**
 * Advanced Memory Management Utilities
 * Provides garbage collection optimization, memory leak prevention, and resource cleanup
 */

import React from 'react';

export interface MemoryUsageStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usage: number; // Percentage
}

export interface WeakCacheOptions<T> {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
  onEvict?: (key: string, value: T) => void;
}

class MemoryManager {
  private refs = new Set<WeakRef<any>>();
  private cleanupTasks = new Map<string, () => void>();
  private intervalId?: number;
  private observers: Array<(stats: MemoryUsageStats) => void> = [];
  private memoryPressureThreshold = 0.8; // 80%
  private isMonitoring = false;

  constructor() {
    this.startMonitoring();
    this.setupMemoryPressureHandler();
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring() {
    if (this.isMonitoring || typeof window === 'undefined') return;

    this.isMonitoring = true;
    this.intervalId = window.setInterval(() => {
      this.performGarbageCollection();
      this.notifyObservers();
    }, 30000); // Check every 30 seconds

    // Clean up on page unload
    window.addEventListener('beforeunload', () => this.cleanup());
  }

  /**
   * Setup memory pressure event handling
   */
  private setupMemoryPressureHandler() {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    // Listen for memory pressure events (if supported)
    if ('memory' in (performance as any)) {
      const checkMemoryPressure = () => {
        const memoryInfo = this.getMemoryUsage();
        if (memoryInfo && memoryInfo.usage > this.memoryPressureThreshold) {
          this.handleMemoryPressure();
        }
      };

      // Check memory pressure more frequently during high usage
      setInterval(checkMemoryPressure, 5000);
    }
  }

  /**
   * Get current memory usage statistics
   */
  getMemoryUsage(): MemoryUsageStats | null {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return null;
    }

    const memory = (performance as any).memory;
    if (!memory) return null;

    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = memory;
    return {
      usedJSHeapSize,
      totalJSHeapSize,
      jsHeapSizeLimit,
      usage: totalJSHeapSize / jsHeapSizeLimit,
    };
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection() {
    // Trigger garbage collection in environments that support it
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }

    // Alternative approach: create memory pressure
    this.createMemoryPressure();
  }

  /**
   * Create memory pressure to encourage garbage collection
   */
  private createMemoryPressure() {
    const arrays: any[] = [];
    
    // Create some temporary objects to encourage GC
    for (let i = 0; i < 100; i++) {
      arrays.push(new Array(1000).fill(null));
    }
    
    // Clear references immediately
    arrays.length = 0;
  }

  /**
   * Perform automatic garbage collection and cleanup
   */
  private performGarbageCollection() {
    // Clean up dead weak references
    const deadRefs = new Set<WeakRef<any>>();
    
    this.refs.forEach(ref => {
      if (ref.deref() === undefined) {
        deadRefs.add(ref);
      }
    });

    deadRefs.forEach(ref => this.refs.delete(ref));

    // Run cleanup tasks
    this.cleanupTasks.forEach((cleanup, id) => {
      try {
        cleanup();
      } catch (error) {
        console.warn(`Cleanup task ${id} failed:`, error);
        this.cleanupTasks.delete(id);
      }
    });
  }

  /**
   * Handle memory pressure situations
   */
  private handleMemoryPressure() {
    console.warn('Memory pressure detected, attempting cleanup...');
    
    // Force garbage collection
    this.forceGarbageCollection();
    
    // Clear caches
    this.clearAllCaches();
    
    // Notify observers about memory pressure
    this.observers.forEach(observer => {
      const stats = this.getMemoryUsage();
      if (stats) observer(stats);
    });
  }

  /**
   * Register a weak reference for tracking
   */
  trackWeakReference<T extends object>(obj: T): WeakRef<T> {
    const ref = new WeakRef(obj);
    this.refs.add(ref);
    return ref;
  }

  /**
   * Register a cleanup task
   */
  registerCleanupTask(id: string, cleanup: () => void) {
    this.cleanupTasks.set(id, cleanup);
  }

  /**
   * Unregister a cleanup task
   */
  unregisterCleanupTask(id: string) {
    this.cleanupTasks.delete(id);
  }

  /**
   * Add memory usage observer
   */
  addMemoryObserver(observer: (stats: MemoryUsageStats) => void) {
    this.observers.push(observer);
  }

  /**
   * Remove memory usage observer
   */
  removeMemoryObserver(observer: (stats: MemoryUsageStats) => void) {
    const index = this.observers.indexOf(observer);
    if (index >= 0) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Notify all observers of current memory usage
   */
  private notifyObservers() {
    const stats = this.getMemoryUsage();
    if (stats) {
      this.observers.forEach(observer => observer(stats));
    }
  }

  /**
   * Clear all managed caches
   */
  private clearAllCaches() {
    // This will be called by cache implementations
    window.dispatchEvent(new CustomEvent('memory-pressure', { 
      detail: { 
        type: 'clear-caches',
        timestamp: Date.now()
      }
    }));
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.cleanupTasks.clear();
    this.refs.clear();
    this.observers.length = 0;
    this.isMonitoring = false;
  }
}

/**
 * High-performance weak cache with automatic cleanup
 */
export class WeakCache<T> {
  private cache = new Map<string, { value: T; timestamp: number; ref?: WeakRef<T> }>();
  private maxSize: number;
  private ttl: number;
  private onEvict?: (key: string, value: T) => void;
  private cleanupId?: string;

  constructor(options: WeakCacheOptions<T> = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 300000; // 5 minutes default
    this.onEvict = options.onEvict;

    // Register for memory pressure cleanup
    const cleanupId = `weak-cache-${Date.now()}-${Math.random()}`;
    this.cleanupId = cleanupId;
    memoryManager.registerCleanupTask(cleanupId, () => this.cleanup());

    // Listen for memory pressure events
    window.addEventListener('memory-pressure', () => this.handleMemoryPressure());
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return undefined;
    }

    // Check weak reference if available
    if (entry.ref) {
      const value = entry.ref.deref();
      if (value === undefined) {
        this.delete(key);
        return undefined;
      }
      return value;
    }

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    // Evict oldest entries if at max size
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: any = {
      value,
      timestamp: Date.now(),
    };

    // Use weak reference for objects
    if (typeof value === 'object' && value !== null) {
      entry.ref = new WeakRef(value);
    }

    this.cache.set(key, entry);
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry && this.onEvict) {
      this.onEvict(key, entry.value);
    }
    return this.cache.delete(key);
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    if (this.onEvict) {
      this.cache.forEach((entry, key) => {
        this.onEvict!(key, entry.value);
      });
    }
    this.cache.clear();
  }

  /**
   * Evict oldest entries
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    const toEvict = Math.ceil(this.maxSize * 0.25); // Evict 25%
    for (let i = 0; i < toEvict && entries[i]; i++) {
      const [key, entry] = entries[i];
      if (this.onEvict) {
        this.onEvict(key, entry.value);
      }
      this.cache.delete(key);
    }
  }

  /**
   * Handle memory pressure by clearing expired entries
   */
  private handleMemoryPressure(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.ttl || (entry.ref && !entry.ref.deref())) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.delete(key));
  }

  /**
   * Cleanup cache resources
   */
  private cleanup(): void {
    this.clear();
    if (this.cleanupId) {
      memoryManager.unregisterCleanupTask(this.cleanupId);
    }
  }
}

/**
 * Memory-aware object pool for reusing objects
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset?: (obj: T) => void;
  private maxSize: number;

  constructor(factory: () => T, reset?: (obj: T) => void, maxSize: number = 50) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  /**
   * Get object from pool or create new one
   */
  acquire(): T {
    const obj = this.pool.pop() || this.factory();
    return obj;
  }

  /**
   * Return object to pool
   */
  release(obj: T): void {
    if (this.pool.length >= this.maxSize) {
      return; // Pool is full, let GC handle it
    }

    if (this.reset) {
      this.reset(obj);
    }

    this.pool.push(obj);
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.pool.length = 0;
  }

  /**
   * Get current pool size
   */
  get size(): number {
    return this.pool.length;
  }
}

// Create singleton memory manager
export const memoryManager = new MemoryManager();

/**
 * React hook for memory management
 */
export function useMemoryManagement() {
  const [memoryStats, setMemoryStats] = React.useState<MemoryUsageStats | null>(null);
  const cleanupTasks = React.useRef<Map<string, () => void>>(new Map());

  React.useEffect(() => {
    const observer = (stats: MemoryUsageStats) => setMemoryStats(stats);
    memoryManager.addMemoryObserver(observer);

    return () => {
      memoryManager.removeMemoryObserver(observer);
      // Cleanup all registered tasks
      cleanupTasks.current.forEach(cleanup => cleanup());
      cleanupTasks.current.clear();
    };
  }, []);

  const registerCleanup = React.useCallback((id: string, cleanup: () => void) => {
    cleanupTasks.current.set(id, cleanup);
    memoryManager.registerCleanupTask(id, cleanup);
  }, []);

  const unregisterCleanup = React.useCallback((id: string) => {
    cleanupTasks.current.delete(id);
    memoryManager.unregisterCleanupTask(id);
  }, []);

  const forceCleanup = React.useCallback(() => {
    memoryManager.forceGarbageCollection();
  }, []);

  return {
    memoryStats,
    registerCleanup,
    unregisterCleanup,
    forceCleanup,
  };
}

/**
 * React hook for weak cache
 */
export function useWeakCache<T>(options: WeakCacheOptions<T> = {}) {
  const cache = React.useMemo(() => new WeakCache<T>(options), []);

  React.useEffect(() => {
    return () => cache.clear();
  }, [cache]);

  return cache;
}

/**
 * React hook for object pool
 */
export function useObjectPool<T>(
  factory: () => T,
  reset?: (obj: T) => void,
  maxSize: number = 50
) {
  const pool = React.useMemo(() => new ObjectPool(factory, reset, maxSize), [factory, reset, maxSize]);

  React.useEffect(() => {
    return () => pool.clear();
  }, [pool]);

  return pool;
}

/**
 * Higher-order component for automatic memory cleanup
 */
export function withMemoryManagement<P extends object>(
  Component: React.ComponentType<P>,
  cleanupFn?: () => void
) {
  return React.forwardRef<any, P>((props, ref) => {
    const { registerCleanup } = useMemoryManagement();

    React.useEffect(() => {
      if (cleanupFn) {
        const cleanupId = `component-${Date.now()}-${Math.random()}`;
        registerCleanup(cleanupId, cleanupFn);
      }
    }, [registerCleanup]);

    return React.createElement(Component, { ...props, ref });
  });
}

/**
 * Utility for creating memory-efficient event listeners
 */
export function createMemoryEfficientListener<T extends Event>(
  target: EventTarget,
  event: string,
  handler: (event: T) => void,
  options?: AddEventListenerOptions
) {
  const weakHandler = new WeakMap();
  const listenerOptions = { ...options, passive: true };

  const wrappedHandler = (event: T) => {
    if (weakHandler.has(handler)) {
      handler(event);
    }
  };

  weakHandler.set(handler, true);
  target.addEventListener(event, wrappedHandler as EventListener, listenerOptions);

  return () => {
    target.removeEventListener(event, wrappedHandler as EventListener, listenerOptions);
    weakHandler.delete(handler);
  };
}

/**
 * Memory usage monitor component
 */
export interface MemoryMonitorProps {
  className?: string;
  showDetails?: boolean;
  warningThreshold?: number;
}

export const MemoryMonitor: React.FC<MemoryMonitorProps> = ({
  className = '',
  showDetails = false,
  warningThreshold = 0.8,
}) => {
  const { memoryStats } = useMemoryManagement();

  if (!memoryStats) {
    return null;
  }

  const isWarning = memoryStats.usage > warningThreshold;
  const usedMB = Math.round(memoryStats.usedJSHeapSize / 1024 / 1024);
  const totalMB = Math.round(memoryStats.totalJSHeapSize / 1024 / 1024);
  const limitMB = Math.round(memoryStats.jsHeapSizeLimit / 1024 / 1024);

  return (
    <div className={`memory-monitor ${isWarning ? 'warning' : ''} ${className}`}>
      <div className=\"memory-usage-bar\">
        <div 
          className=\"memory-usage-fill\"
          style={{ width: `${memoryStats.usage * 100}%` }}
        />
      </div>
      
      {showDetails && (
        <div className=\"memory-details text-xs mt-1\">
          <div>Used: {usedMB}MB / {totalMB}MB</div>
          <div>Limit: {limitMB}MB</div>
          <div>Usage: {Math.round(memoryStats.usage * 100)}%</div>
        </div>
      )}
    </div>
  );
};

export default memoryManager;