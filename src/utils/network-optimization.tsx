/// <reference lib="dom" />
/**
 * Advanced Network Optimization Utilities
 * Provides request batching, intelligent caching, retry logic, and network monitoring
 */

import React from 'react';
import { TimeoutHandle } from '../types/timers';

export interface NetworkRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  retries?: number;
  timeout?: number;
  cacheKey?: string;
  cacheTTL?: number;
}

export interface BatchRequestOptions {
  maxBatchSize?: number;
  batchDelay?: number;
  concurrencyLimit?: number;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
  lastModified?: string;
}

export interface NetworkStats {
  requestCount: number;
  errorCount: number;
  cacheHitCount: number;
  averageResponseTime: number;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

class NetworkOptimizer {
  private requestQueue: Map<string, NetworkRequest[]> = new Map();
  private cache = new Map<string, CacheEntry>();
  private inFlightRequests = new Map<string, Promise<any>>();
  private batchTimers = new Map<string, TimeoutHandle>();
  private stats: NetworkStats = {
    requestCount: 0,
    errorCount: 0,
    cacheHitCount: 0,
    averageResponseTime: 0,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
  };
  private responseTimeHistory: number[] = [];
  private maxCacheSize = 500;
  private defaultTimeout = 30000;
  private retryDelays = [1000, 2000, 4000]; // Exponential backoff

  constructor() {
    this.initializeNetworkMonitoring();
    this.setupCacheManagement();
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring() {
    if (typeof navigator === 'undefined') return;

    // Monitor connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.updateConnectionStats(connection);

      connection.addEventListener('change', () => {
        this.updateConnectionStats(connection);
        this.adjustBatchingStrategy();
      });
    }

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.pauseNonCriticalRequests();
    });
  }

  /**
   * Update connection statistics
   */
  private updateConnectionStats(connection: any) {
    this.stats.connectionType = connection.type || 'unknown';
    this.stats.effectiveType = connection.effectiveType || 'unknown';
    this.stats.downlink = connection.downlink || 0;
    this.stats.rtt = connection.rtt || 0;
  }

  /**
   * Setup cache management
   */
  private setupCacheManagement() {
    // Clean expired cache entries every 5 minutes
    setInterval(() => {
      this.cleanExpiredCache();
    }, 300000);

    // Listen for memory pressure
    window.addEventListener('memory-pressure', () => {
      this.clearCache();
    });
  }

  /**
   * Make an optimized HTTP request
   */
  async request<T = any>(request: NetworkRequest): Promise<T> {
    this.stats.requestCount++;

    // Check cache first
    if (request.method === 'GET' && request.cacheKey) {
      const cachedData = this.getCachedData<T>(request.cacheKey);
      if (cachedData) {
        this.stats.cacheHitCount++;
        return cachedData;
      }
    }

    // Check for in-flight requests
    const requestKey = this.getRequestKey(request);
    if (this.inFlightRequests.has(requestKey)) {
      return this.inFlightRequests.get(requestKey);
    }

    // Create and execute request
    const requestPromise = this.executeRequest<T>(request);
    this.inFlightRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;

      // Cache successful GET requests
      if (request.method === 'GET' && request.cacheKey && result) {
        this.setCachedData(request.cacheKey, result, request.cacheTTL);
      }

      return result;
    } finally {
      this.inFlightRequests.delete(requestKey);
    }
  }

  /**
   * Add request to batch queue
   */
  async batchRequest<T = any>(
    request: NetworkRequest,
    options: BatchRequestOptions = {}
  ): Promise<T> {
    const { maxBatchSize = 10, batchDelay = 50, concurrencyLimit = 6 } = options;

    const batchKey = `${request.method}:${new URL(request.url).origin}`;

    // Initialize batch queue if needed
    if (!this.requestQueue.has(batchKey)) {
      this.requestQueue.set(batchKey, []);
    }

    const queue = this.requestQueue.get(batchKey)!;
    queue.push(request);

    // Process batch if conditions are met
    if (queue.length >= maxBatchSize) {
      return this.processBatch<T>(batchKey, concurrencyLimit);
    }

    // Set timer for batch processing
    if (!this.batchTimers.has(batchKey)) {
      const timer = window.setTimeout(() => {
        this.processBatch(batchKey, concurrencyLimit);
      }, batchDelay);
      this.batchTimers.set(batchKey, timer);
    }

    // Return promise that resolves when this request is processed
    return new Promise((resolve, reject) => {
      request.resolve = resolve;
      request.reject = reject;
    });
  }

  /**
   * Process a batch of requests
   */
  private async processBatch<T = any>(
    batchKey: string,
    concurrencyLimit: number
  ): Promise<T> {
    const queue = this.requestQueue.get(batchKey) || [];
    this.requestQueue.set(batchKey, []);

    // Clear timer
    const timer = this.batchTimers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchKey);
    }

    // Process requests in chunks based on concurrency limit
    const chunks = this.chunkArray(queue, concurrencyLimit);

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(async request => {
          try {
            const result = await this.request(request);
            if (request.resolve) request.resolve(result);
          } catch (error) {
            if (request.reject) request.reject(error);
          }
        })
      );
    }

    // Return the first result (for single request batches)
    return queue[0] as any;
  }

  /**
   * Execute a network request with retry logic
   */
  private async executeRequest<T>(request: NetworkRequest): Promise<T> {
    const startTime = Date.now();
    let lastError: Error;

    for (let attempt = 0; attempt <= (request.retries || 3); attempt++) {
      try {
        const response = await this.makeHttpRequest(request);

        // Record response time
        const responseTime = Date.now() - startTime;
        this.recordResponseTime(responseTime);

        return response;
      } catch (error) {
        lastError = error as Error;
        this.stats.errorCount++;

        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('4')) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < (request.retries || 3)) {
          const delay =
            this.retryDelays[Math.min(attempt, this.retryDelays.length - 1)];
          await this.delay(delay * (1 + Math.random() * 0.1)); // Add jitter
        }
      }
    }

    throw lastError!;
  }

  /**
   * Make actual HTTP request
   */
  private async makeHttpRequest<T>(request: NetworkRequest): Promise<T> {
    const controller = new AbortController();
    const timeout = request.timeout || this.defaultTimeout;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers,
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }

      return response.text() as any;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get cached data
   */
  private getCachedData<T>(cacheKey: string): T | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached data
   */
  private setCachedData<T>(cacheKey: string, data: T, ttl: number = 300000) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRUEntry();
    }

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  /**
   * Evict least recently used cache entry
   */
  private evictLRUEntry() {
    let oldestKey: string | undefined;
    let oldestTimestamp = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Generate request key for deduplication
   */
  private getRequestKey(request: NetworkRequest): string {
    return `${request.method}:${request.url}:${JSON.stringify(request.body)}`;
  }

  /**
   * Record response time for statistics
   */
  private recordResponseTime(time: number) {
    this.responseTimeHistory.push(time);

    // Keep only last 100 response times
    if (this.responseTimeHistory.length > 100) {
      this.responseTimeHistory.shift();
    }

    // Update average
    this.stats.averageResponseTime =
      this.responseTimeHistory.reduce((a, b) => a + b, 0) /
      this.responseTimeHistory.length;
  }

  /**
   * Adjust batching strategy based on connection
   */
  private adjustBatchingStrategy() {
    // Reduce batching on slow connections
    if (this.stats.effectiveType === 'slow-2g' || this.stats.effectiveType === '2g') {
      // Process batches more aggressively on slow connections
      this.batchTimers.forEach((timer, batchKey) => {
        clearTimeout(timer);
        this.processBatch(batchKey, 2); // Lower concurrency
      });
    }
  }

  /**
   * Process offline queue when back online
   */
  private processOfflineQueue() {
    // Process all pending batches when back online
    this.batchTimers.forEach((timer, batchKey) => {
      clearTimeout(timer);
      this.processBatch(batchKey, 6);
    });
  }

  /**
   * Pause non-critical requests when offline
   */
  private pauseNonCriticalRequests() {
    // Cancel timers for non-critical batches
    this.batchTimers.forEach((timer, batchKey) => {
      const queue = this.requestQueue.get(batchKey) || [];
      const hasCriticalRequests = queue.some(req => req.priority === 'critical');

      if (!hasCriticalRequests) {
        clearTimeout(timer);
        this.batchTimers.delete(batchKey);
      }
    });
  }

  /**
   * Utility functions
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get network statistics
   */
  getStats(): NetworkStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      requestCount: 0,
      errorCount: 0,
      cacheHitCount: 0,
      averageResponseTime: 0,
      connectionType: this.stats.connectionType,
      effectiveType: this.stats.effectiveType,
      downlink: this.stats.downlink,
      rtt: this.stats.rtt,
    };
    this.responseTimeHistory = [];
  }
}

// Extend NetworkRequest with resolve/reject for batch processing
declare module './network-optimization' {
  interface NetworkRequest {
    resolve?: (value: any) => void;
    reject?: (reason: any) => void;
  }
}

// Create singleton instance
export const networkOptimizer = new NetworkOptimizer();

/**
 * React hook for optimized HTTP requests
 */
export function useOptimizedRequest<T = any>() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<T | null>(null);

  const execute = React.useCallback(async (request: NetworkRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await networkOptimizer.request<T>(request);
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Request failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const executeBatch = React.useCallback(
    async (request: NetworkRequest, options?: BatchRequestOptions) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await networkOptimizer.batchRequest<T>(request, options);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Batch request failed');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = React.useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    executeBatch,
    reset,
    isLoading,
    error,
    data,
  };
}

/**
 * React hook for network statistics
 */
export function useNetworkStats() {
  const [stats, setStats] = React.useState<NetworkStats>(() =>
    networkOptimizer.getStats()
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(networkOptimizer.getStats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return stats;
}

/**
 * High-level API functions
 */
export const api = {
  get: <T = any,>(url: string, options: Partial<NetworkRequest> = {}): Promise<T> => {
    return networkOptimizer.request<T>({
      id: `get-${Date.now()}-${Math.random()}`,
      method: 'GET',
      url,
      cacheKey: `GET:${url}`,
      cacheTTL: 300000, // 5 minutes default
      ...options,
    });
  },

  post: <T = any,>(
    url: string,
    body?: any,
    options: Partial<NetworkRequest> = {}
  ): Promise<T> => {
    return networkOptimizer.request<T>({
      id: `post-${Date.now()}-${Math.random()}`,
      method: 'POST',
      url,
      body,
      ...options,
    });
  },

  put: <T = any,>(
    url: string,
    body?: any,
    options: Partial<NetworkRequest> = {}
  ): Promise<T> => {
    return networkOptimizer.request<T>({
      id: `put-${Date.now()}-${Math.random()}`,
      method: 'PUT',
      url,
      body,
      ...options,
    });
  },

  delete: <T = any,>(
    url: string,
    options: Partial<NetworkRequest> = {}
  ): Promise<T> => {
    return networkOptimizer.request<T>({
      id: `delete-${Date.now()}-${Math.random()}`,
      method: 'DELETE',
      url,
      ...options,
    });
  },

  // Batch operations
  batchGet: <T = any,>(
    urls: string[],
    options: BatchRequestOptions = {}
  ): Promise<T[]> => {
    const requests = urls.map(url => ({
      id: `batch-get-${Date.now()}-${Math.random()}`,
      method: 'GET' as const,
      url,
      cacheKey: `GET:${url}`,
      cacheTTL: 300000,
    }));

    return Promise.all(
      requests.map(request => networkOptimizer.batchRequest<T>(request, options))
    );
  },
};

/**
 * Network status indicator component
 */
export interface NetworkStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  className = '',
  showDetails = false,
}) => {
  const stats = useNetworkStats();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const errorRate =
    stats.requestCount > 0 ? (stats.errorCount / stats.requestCount) * 100 : 0;

  const cacheHitRate =
    stats.requestCount > 0 ? (stats.cacheHitCount / stats.requestCount) * 100 : 0;

  return (
    <div className={`network-status ${!isOnline ? 'offline' : ''} ${className}`}>
      <div className="network-indicator">
        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
        <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {showDetails && isOnline && (
        <div className="network-details text-xs mt-2 space-y-1">
          <div>Connection: {stats.effectiveType}</div>
          <div>Avg Response: {Math.round(stats.averageResponseTime)}ms</div>
          <div>Cache Hit Rate: {Math.round(cacheHitRate)}%</div>
          <div>Error Rate: {Math.round(errorRate)}%</div>
          {stats.downlink > 0 && <div>Speed: {stats.downlink}Mbps</div>}
        </div>
      )}
    </div>
  );
};

export default networkOptimizer;
