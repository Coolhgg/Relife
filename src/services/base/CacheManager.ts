/**
 * Cache Management System
 * Provides standardized caching across all services
 */

import {
  CacheProvider,
  CacheEntry,
  CacheStats,
  CacheManager as ICacheManager,
  CacheConfig
} from '../../types/service-architecture';

// ============================================================================
// Memory Cache Provider
// ============================================================================

export class MemoryCacheProvider implements CacheProvider {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0
  };
  private maxSize: number;
  private defaultTtl: number;

  constructor(maxSize: number = 1000, defaultTtl: number = 300000) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanupExpired(), 60000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    this.updateHitRate();
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastUsed();
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: new Date(),
      ttl: ttl || this.defaultTtl,
      hits: 0,
      tags: []
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.size = 0;
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  async keys(pattern?: string): Promise<string[]> {
    const keys = Array.from(this.cache.keys());
    if (!pattern) return keys;
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  async stats(): Promise<CacheStats> {
    return { ...this.stats };
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp.getTime() > entry.ttl;
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp.getTime() > entry.ttl) {
        this.cache.delete(key);
      }
    }
    this.stats.size = this.cache.size;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

// ============================================================================
// LocalStorage Cache Provider
// ============================================================================

export class LocalStorageCacheProvider implements CacheProvider {
  private prefix: string;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0
  };

  constructor(prefix: string = 'cache:') {
    this.prefix = prefix;
    this.updateSize();
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.prefix + key;
    
    try {
      const stored = localStorage.getItem(fullKey);
      if (!stored) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(stored);
      
      if (this.isExpired(entry)) {
        localStorage.removeItem(fullKey);
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      entry.hits++;
      localStorage.setItem(fullKey, JSON.stringify(entry));
      this.stats.hits++;
      this.updateHitRate();
      return entry.value;
    } catch (error) {
      console.warn('LocalStorage cache error:', error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = this.prefix + key;
    
    const entry: CacheEntry<T> = {
      value,
      timestamp: new Date(),
      ttl: ttl || 300000,
      hits: 0
    };

    try {
      localStorage.setItem(fullKey, JSON.stringify(entry));
      this.stats.sets++;
      this.updateSize();
    } catch (error) {
      console.warn('LocalStorage cache set error:', error);
      // Try to make space by removing expired items
      await this.cleanupExpired();
      try {
        localStorage.setItem(fullKey, JSON.stringify(entry));
        this.stats.sets++;
        this.updateSize();
      } catch (retryError) {
        throw new Error('Unable to store in localStorage cache');
      }
    }
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.prefix + key;
    const existed = localStorage.getItem(fullKey) !== null;
    localStorage.removeItem(fullKey);
    
    if (existed) {
      this.stats.deletes++;
      this.updateSize();
    }
    
    return existed;
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    keys.forEach(key => localStorage.removeItem(this.prefix + key));
    this.updateSize();
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async keys(pattern?: string): Promise<string[]> {
    const keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        const cleanKey = key.substring(this.prefix.length);
        if (!pattern || new RegExp(pattern.replace(/\*/g, '.*')).test(cleanKey)) {
          keys.push(cleanKey);
        }
      }
    }
    
    return keys;
  }

  async size(): Promise<number> {
    return this.stats.size;
  }

  async stats(): Promise<CacheStats> {
    return { ...this.stats };
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - new Date(entry.timestamp).getTime() > entry.ttl;
  }

  private async cleanupExpired(): Promise<void> {
    const keys = await this.keys();
    
    for (const key of keys) {
      const fullKey = this.prefix + key;
      const stored = localStorage.getItem(fullKey);
      
      if (stored) {
        try {
          const entry = JSON.parse(stored);
          if (this.isExpired(entry)) {
            localStorage.removeItem(fullKey);
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(fullKey);
        }
      }
    }
    
    this.updateSize();
  }

  private updateSize(): void {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        count++;
      }
    }
    this.stats.size = count;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

// ============================================================================
// IndexedDB Cache Provider
// ============================================================================

export class IndexedDBCacheProvider implements CacheProvider {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0
  };

  constructor(dbName: string = 'app-cache', storeName: string = 'cache-entries') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          this.stats.misses++;
          this.updateHitRate();
          resolve(null);
          return;
        }

        const entry: CacheEntry<T> = result;
        
        if (this.isExpired(entry)) {
          this.delete(key);
          this.stats.misses++;
          this.updateHitRate();
          resolve(null);
          return;
        }

        this.stats.hits++;
        this.updateHitRate();
        resolve(entry.value);
      };
      
      request.onerror = () => {
        this.stats.misses++;
        this.updateHitRate();
        resolve(null);
      };
    });
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.db) await this.initDB();
    
    const entry: CacheEntry<T> & { key: string } = {
      key,
      value,
      timestamp: new Date(),
      ttl: ttl || 300000,
      hits: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry);
      
      request.onsuccess = () => {
        this.stats.sets++;
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<boolean> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => {
        this.stats.deletes++;
        resolve(true);
      };
      
      request.onerror = () => resolve(false);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        this.stats.size = 0;
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async keys(pattern?: string): Promise<string[]> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve) => {
      const keys: string[] = [];
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const key = cursor.value.key;
          if (!pattern || new RegExp(pattern.replace(/\*/g, '.*')).test(key)) {
            keys.push(key);
          }
          cursor.continue();
        } else {
          resolve(keys);
        }
      };
      
      request.onerror = () => resolve([]);
    });
  }

  async size(): Promise<number> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();
      
      request.onsuccess = () => {
        this.stats.size = request.result;
        resolve(request.result);
      };
      
      request.onerror = () => resolve(0);
    });
  }

  async stats(): Promise<CacheStats> {
    await this.size(); // Update size
    return { ...this.stats };
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - new Date(entry.timestamp).getTime() > entry.ttl;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

// ============================================================================
// Cache Manager
// ============================================================================

export class CacheManager implements ICacheManager {
  private providers = new Map<CacheConfig['strategy'], CacheProvider>();

  constructor() {
    this.providers.set('memory', new MemoryCacheProvider());
    this.providers.set('localStorage', new LocalStorageCacheProvider());
    this.providers.set('indexedDB', new IndexedDBCacheProvider());
  }

  getProvider(strategy: CacheConfig['strategy']): CacheProvider {
    const provider = this.providers.get(strategy);
    if (!provider) {
      throw new Error(`Cache provider for strategy '${strategy}' not found`);
    }
    return provider;
  }

  async evict(tags: string[]): Promise<void> {
    // For now, this is a simple implementation
    // In a more sophisticated system, entries would be tagged
    console.log('Cache eviction for tags:', tags);
  }

  async cleanup(): Promise<void> {
    // Cleanup expired entries across all providers
    const cleanupPromises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        // This would need to be implemented in each provider
        console.log('Cleaning up cache provider');
      } catch (error) {
        console.warn('Cache cleanup error:', error);
      }
    });

    await Promise.all(cleanupPromises);
  }

  async getGlobalStats(): Promise<CacheStats> {
    const allStats = await Promise.all(
      Array.from(this.providers.values()).map(provider => provider.stats())
    );

    return allStats.reduce((total, stats) => ({
      hits: total.hits + stats.hits,
      misses: total.misses + stats.misses,
      sets: total.sets + stats.sets,
      deletes: total.deletes + stats.deletes,
      size: total.size + stats.size,
      hitRate: 0 // Will be calculated below
    }), { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0, hitRate: 0 });
  }
}

// Global cache manager instance
let globalCacheManager: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new CacheManager();
  }
  return globalCacheManager;
}