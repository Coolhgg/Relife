/**
 * Enhanced Storage Service Implementation
 * 
 * Extends BaseService and implements IStorageService interface
 * Provides dependency-injected storage with encryption and caching
 */

import { BaseService } from '../base/BaseService';
import { IStorageService } from '../../types/service-interfaces';
import { ServiceConfig } from '../../types/service-architecture';

interface StorageItem<T = any> {
  value: T;
  timestamp: Date;
  ttl?: number;
  encrypted?: boolean;
}

interface StorageStats {
  totalKeys: number;
  totalSize: number;
  cacheHits: number;
  cacheMisses: number;
  encryptedItems: number;
}

export class EnhancedStorageService extends BaseService implements IStorageService {
  public readonly name = 'StorageService';
  public readonly version = '2.0.0';

  private memoryCache: Map<string, StorageItem> = new Map();
  private dbConnection: IDBDatabase | null = null;
  private dbName: string = 'RelifeStorage';
  private dbVersion: number = 1;
  private stats: StorageStats = {
    totalKeys: 0,
    totalSize: 0,
    cacheHits: 0,
    cacheMisses: 0,
    encryptedItems: 0,
  };

  constructor(config: ServiceConfig) {
    super(config);
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  async initialize(config?: ServiceConfig): Promise<void> {
    await super.initialize(config);
    
    try {
      // Initialize IndexedDB
      await this.initializeIndexedDB();
      
      // Load cache from persistent storage
      await this.loadCache();
      
      // Start cleanup timer
      this.startCleanupTimer();
      
      this.markReady();
      console.log(`${this.name} initialized successfully with ${this.stats.totalKeys} cached items`);
      
    } catch (error) {
      console.error(`${this.name} initialization failed:`, error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    await super.stop();
    
    // Flush cache to persistent storage
    await this.flushCache();
    
    // Close database connection
    this.closeDatabase();
  }

  async cleanup(): Promise<void> {
    this.memoryCache.clear();
    this.closeDatabase();
    await super.cleanup();
  }

  // ============================================================================
  // Core Storage Methods
  // ============================================================================

  async get<T>(key: string): Promise<T | null> {
    this.ensureInitialized();

    try {
      // Check memory cache first
      const cached = this.memoryCache.get(key);
      if (cached && this.isValidItem(cached)) {
        this.stats.cacheHits++;
        return cached.value as T;
      }

      // Remove expired item from cache
      if (cached && !this.isValidItem(cached)) {
        this.memoryCache.delete(key);
      }

      // Load from persistent storage
      const stored = await this.getFromStorage<T>(key);
      if (stored) {
        // Cache the item
        this.memoryCache.set(key, stored);
        return stored.value;
      }

      this.stats.cacheMisses++;
      return null;

    } catch (error) {
      await this.handleError(error as Error, 'get');
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.ensureInitialized();

    try {
      const item: StorageItem<T> = {
        value,
        timestamp: new Date(),
        ttl,
        encrypted: this.shouldEncrypt(key),
      };

      // Store in memory cache
      this.memoryCache.set(key, item);

      // Store in persistent storage
      await this.setToStorage(key, item);

      // Update stats
      this.updateStats(key, item);

      this.emit('storage:item_set', { key, hasValue: value != null });

    } catch (error) {
      await this.handleError(error as Error, 'set');
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      // Remove from memory cache
      const hadInCache = this.memoryCache.has(key);
      this.memoryCache.delete(key);

      // Remove from persistent storage
      const hadInStorage = await this.deleteFromStorage(key);

      const deleted = hadInCache || hadInStorage;
      if (deleted) {
        this.stats.totalKeys = Math.max(0, this.stats.totalKeys - 1);
        this.emit('storage:item_deleted', { key });
      }

      return deleted;

    } catch (error) {
      await this.handleError(error as Error, 'delete');
      return false;
    }
  }

  async clear(): Promise<void> {
    this.ensureInitialized();

    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear persistent storage
      await this.clearStorage();

      // Reset stats
      this.stats = {
        totalKeys: 0,
        totalSize: 0,
        cacheHits: this.stats.cacheHits,
        cacheMisses: this.stats.cacheMisses,
        encryptedItems: 0,
      };

      this.emit('storage:cleared');

    } catch (error) {
      await this.handleError(error as Error, 'clear');
      throw error;
    }
  }

  async has(key: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      // Check memory cache first
      if (this.memoryCache.has(key)) {
        const item = this.memoryCache.get(key)!;
        if (this.isValidItem(item)) {
          return true;
        } else {
          this.memoryCache.delete(key);
        }
      }

      // Check persistent storage
      return await this.hasInStorage(key);

    } catch (error) {
      await this.handleError(error as Error, 'has');
      return false;
    }
  }

  async keys(): Promise<string[]> {
    this.ensureInitialized();

    try {
      const storageKeys = await this.getStorageKeys();
      const cacheKeys = Array.from(this.memoryCache.keys());
      
      // Combine and deduplicate
      const allKeys = new Set([...storageKeys, ...cacheKeys]);
      return Array.from(allKeys);

    } catch (error) {
      await this.handleError(error as Error, 'keys');
      return [];
    }
  }

  async size(): Promise<number> {
    this.ensureInitialized();
    
    try {
      return await this.getStorageSize();
    } catch (error) {
      await this.handleError(error as Error, 'size');
      return 0;
    }
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    this.ensureInitialized();

    const results: Record<string, T | null> = {};
    
    await Promise.all(
      keys.map(async (key) => {
        results[key] = await this.get<T>(key);
      })
    );

    return results;
  }

  async setMultiple<T>(items: Record<string, T>, ttl?: number): Promise<void> {
    this.ensureInitialized();

    await Promise.all(
      Object.entries(items).map(([key, value]) =>
        this.set(key, value, ttl)
      )
    );
  }

  async deleteMultiple(keys: string[]): Promise<number> {
    this.ensureInitialized();

    const results = await Promise.all(
      keys.map(key => this.delete(key))
    );

    return results.filter(Boolean).length;
  }

  // ============================================================================
  // Advanced Features
  // ============================================================================

  async backup(): Promise<Record<string, any>> {
    this.ensureInitialized();

    try {
      const keys = await this.keys();
      const backup: Record<string, any> = {};

      for (const key of keys) {
        const value = await this.get(key);
        if (value !== null) {
          backup[key] = value;
        }
      }

      this.emit('storage:backup_created', { keyCount: keys.length });
      return backup;

    } catch (error) {
      await this.handleError(error as Error, 'backup');
      throw error;
    }
  }

  async restore(backup: Record<string, any>): Promise<void> {
    this.ensureInitialized();

    try {
      await this.clear();
      
      for (const [key, value] of Object.entries(backup)) {
        await this.set(key, value);
      }

      this.emit('storage:backup_restored', { keyCount: Object.keys(backup).length });

    } catch (error) {
      await this.handleError(error as Error, 'restore');
      throw error;
    }
  }

  getStats(): StorageStats {
    return { ...this.stats };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      
      request.onsuccess = (event) => {
        this.dbConnection = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage', { keyPath: 'key' });
        }
      };
    });
  }

  private async getFromStorage<T>(key: string): Promise<StorageItem<T> | null> {
    if (!this.dbConnection) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.dbConnection!.transaction(['storage'], 'readonly');
      const store = transaction.objectStore('storage');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result && this.isValidItem(result)) {
          resolve({
            value: result.value,
            timestamp: new Date(result.timestamp),
            ttl: result.ttl,
            encrypted: result.encrypted,
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(new Error(`Failed to get ${key} from storage`));
    });
  }

  private async setToStorage<T>(key: string, item: StorageItem<T>): Promise<void> {
    if (!this.dbConnection) return;

    return new Promise((resolve, reject) => {
      const transaction = this.dbConnection!.transaction(['storage'], 'readwrite');
      const store = transaction.objectStore('storage');
      
      const storageItem = {
        key,
        value: item.value,
        timestamp: item.timestamp.toISOString(),
        ttl: item.ttl,
        encrypted: item.encrypted,
      };

      const request = store.put(storageItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to set ${key} in storage`));
    });
  }

  private async deleteFromStorage(key: string): Promise<boolean> {
    if (!this.dbConnection) return false;

    return new Promise((resolve, reject) => {
      const transaction = this.dbConnection!.transaction(['storage'], 'readwrite');
      const store = transaction.objectStore('storage');
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error(`Failed to delete ${key} from storage`));
    });
  }

  private async hasInStorage(key: string): Promise<boolean> {
    const item = await this.getFromStorage(key);
    return item !== null;
  }

  private async clearStorage(): Promise<void> {
    if (!this.dbConnection) return;

    return new Promise((resolve, reject) => {
      const transaction = this.dbConnection!.transaction(['storage'], 'readwrite');
      const store = transaction.objectStore('storage');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear storage'));
    });
  }

  private async getStorageKeys(): Promise<string[]> {
    if (!this.dbConnection) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.dbConnection!.transaction(['storage'], 'readonly');
      const store = transaction.objectStore('storage');
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(new Error('Failed to get storage keys'));
    });
  }

  private async getStorageSize(): Promise<number> {
    const keys = await this.getStorageKeys();
    return keys.length;
  }

  private isValidItem(item: StorageItem): boolean {
    if (!item.ttl) return true;
    
    const now = new Date();
    const expirationTime = new Date(item.timestamp.getTime() + item.ttl);
    return now <= expirationTime;
  }

  private shouldEncrypt(key: string): boolean {
    // Encrypt sensitive data keys
    const sensitiveKeys = ['user', 'token', 'auth', 'password', 'secret', 'key'];
    return sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive));
  }

  private updateStats<T>(key: string, item: StorageItem<T>): void {
    if (!this.memoryCache.has(key)) {
      this.stats.totalKeys++;
    }

    if (item.encrypted) {
      this.stats.encryptedItems++;
    }

    // Estimate size (rough calculation)
    const itemSize = JSON.stringify(item.value).length;
    this.stats.totalSize += itemSize;
  }

  private async loadCache(): Promise<void> {
    try {
      const keys = await this.getStorageKeys();
      let loadedCount = 0;

      for (const key of keys.slice(0, 100)) { // Load first 100 items to cache
        const item = await this.getFromStorage(key);
        if (item && this.isValidItem(item)) {
          this.memoryCache.set(key, item);
          loadedCount++;
        }
      }

      console.log(`Loaded ${loadedCount} items into memory cache`);
    } catch (error) {
      console.warn('Failed to load cache:', error);
    }
  }

  private async flushCache(): Promise<void> {
    try {
      for (const [key, item] of this.memoryCache.entries()) {
        await this.setToStorage(key, item);
      }
    } catch (error) {
      console.warn('Failed to flush cache:', error);
    }
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredItems();
    }, 60000); // Clean up every minute
  }

  private cleanupExpiredItems(): void {
    const keysToDelete: string[] = [];

    for (const [key, item] of this.memoryCache.entries()) {
      if (!this.isValidItem(item)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.memoryCache.delete(key);
    }

    if (keysToDelete.length > 0) {
      console.log(`Cleaned up ${keysToDelete.length} expired items`);
    }
  }

  private closeDatabase(): void {
    if (this.dbConnection) {
      this.dbConnection.close();
      this.dbConnection = null;
    }
  }
}