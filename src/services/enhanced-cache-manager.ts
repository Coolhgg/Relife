import type { AudioCacheEntry, AudioMetadata } from './audio-manager';
import type { CustomSound } from './types/media';
import { TimeoutHandle } from '../types/timers';

export interface CacheEntry extends AudioCacheEntry {
  accessCount: number;
  lastAccessed: Date;
  frequency: number; // Access frequency score
  compressionRatio?: number;
  originalSize?: number;
  tags: string[];
}

export interface CachePolicy {
  maxSizeBytes: number;
  maxEntries: number;
  ttlSeconds: number; // Time to live
  evictionStrategy: 'lru' | 'lfu' | 'fifo' | 'intelligent';
  compressionThreshold: number; // Bytes
  preloadThreshold: number; // Access count threshold for preloading
}

export interface CacheStats {
  totalSize: number;
  totalEntries: number;
  hitRate: number;
  missRate: number;
  compressionRatio: number;
  averageAccessTime: number;
  evictionCount: number;
  preloadHits: number;
  memoryPressure: number; // 0-1 scale
}

export interface CacheWarmingConfig {
  enabled: boolean;
  scheduleHours: number[]; // Hours of day to warm cache (0-23)
  maxWarmingEntries: number;
  warmingBatchSize: number;
  priorityCategories: string[];
}

export class EnhancedCacheManager {
  private static instance: EnhancedCacheManager | null = null;
  private db: IDBDatabase | null = null;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private accessLog: Map<string, number[]> = new Map(); // Track access times
  private policy: CachePolicy;
  private stats: CacheStats;
  private warmingConfig: CacheWarmingConfig;
  private compressionWorker: Worker | null = null;
  private isInitialized = false;

  static getInstance(): EnhancedCacheManager {
    if (!EnhancedCacheManager.instance) {
      EnhancedCacheManager.instance = new EnhancedCacheManager();
    }
    return EnhancedCacheManager.instance;
  }

  private constructor() {
    this.policy = {
      maxSizeBytes: 150 * 1024 * 1024, // 150MB
      maxEntries: 1000,
      ttlSeconds: 7 * 24 * 60 * 60, // 7 days
      evictionStrategy: 'intelligent',
      compressionThreshold: 1024 * 1024, // 1MB
      preloadThreshold: 5, // Preload after 5 accesses
    };

    this.stats = {
      totalSize: 0,
      totalEntries: 0,
      hitRate: 0,
      missRate: 0,
      compressionRatio: 0,
      averageAccessTime: 0,
      evictionCount: 0,
      preloadHits: 0,
      memoryPressure: 0,
    };

    this.warmingConfig = {
      enabled: true,
      scheduleHours: [6, 7, 8, 18, 19, 20], // Morning and evening
      maxWarmingEntries: 50,
      warmingBatchSize: 5,
      priorityCategories: ['nature', 'energetic', 'motivation'],
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.initializeDatabase();
      await this.initializeCompressionWorker();
      await this.loadMemoryCache();
      await this.startMaintenanceTasks();

      this.isInitialized = true;
      console.log('Enhanced cache manager initialized');
    } catch (_error) {
      console._error('Failed to initialize enhanced cache manager:', _error);
    }
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('EnhancedAudioCache', 2);

      request.onerror = () => reject(request._error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (_event.target as IDBOpenDBRequest).result;

        // Create enhanced cache store
        if (!db.objectStoreNames.contains('enhancedCache')) {
          const store = db.createObjectStore('enhancedCache', { keyPath: 'id' });
          store.createIndex('type', 'type');
          store.createIndex('priority', 'priority');
          store.createIndex('lastAccessed', 'lastAccessed');
          store.createIndex('frequency', 'frequency');
          store.createIndex('tags', 'tags', { multiEntry: true });
          store.createIndex('expiresAt', 'expiresAt');
        }

        // Create access log store
        if (!db.objectStoreNames.contains('accessLog')) {
          const logStore = db.createObjectStore('accessLog', { keyPath: 'id' });
          logStore.createIndex('timestamp', 'timestamp');
        }

        // Create metadata store
        if (!db.objectStoreNames.contains('cacheMetadata')) {
          const metaStore = db.createObjectStore('cacheMetadata', { keyPath: 'key' });
        }
      };
    });
  }

  private async initializeCompressionWorker(): Promise<void> {
    try {
      // In a real implementation, you'd load an actual compression worker
      // For now, we'll simulate compression
      console.log('Compression worker initialized (simulated)');
    } catch (_error) {
      console.warn('Compression worker not available:', _error);
    }
  }

  private async loadMemoryCache(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['enhancedCache'], 'readonly');
    const store = transaction.objectStore('enhancedCache');

    // Load high-priority and frequently accessed items into memory
    const frequencyIndex = store._index('frequency');
    const request = frequencyIndex.openCursor(null, 'prev'); // Descending order

    let loadedCount = 0;
    const maxMemoryEntries = 50; // Limit memory cache size

    return new Promise((resolve, reject) => {
      request.onsuccess = event => {
        const cursor = (_event.target as IDBRequest).result;

        if (cursor && loadedCount < maxMemoryEntries) {
          const entry = cursor.value as CacheEntry;

          // Only load to memory if recently accessed or high priority
          const hoursAgo =
            (Date.now() - entry.lastAccessed.getTime()) / (1000 * 60 * 60);
          if (
            hoursAgo < 24 ||
            entry.priority === 'critical' ||
            entry.priority === 'high'
          ) {
            this.memoryCache.set(entry.id, entry);
            loadedCount++;
          }

          cursor.continue();
        } else {
          console.log(`Loaded ${loadedCount} entries into memory cache`);
          resolve();
        }
      };

      request.onerror = () => reject(request._error);
    });
  }

  async get(id: string): Promise<CacheEntry | null> {
    const startTime = performance.now();

    try {
      // Check memory cache first
      let entry = this.memoryCache.get(id);

      if (entry) {
        this.recordAccess(id, startTime);
        this.stats.hitRate++;
        return entry;
      }

      // Check IndexedDB
      entry = await this.getFromDatabase(id);

      if (entry) {
        // Add to memory cache if frequently accessed
        if (entry.frequency > 3) {
          this.memoryCache.set(id, entry);
        }

        this.recordAccess(id, startTime);
        this.stats.hitRate++;
        return entry;
      }

      this.stats.missRate++;
      return null;
    } catch (_error) {
      console._error('Error getting cache entry:', _error);
      this.stats.missRate++;
      return null;
    }
  }

  async set(entry: CacheEntry): Promise<boolean> {
    try {
      // Apply compression if needed
      if (
        entry.metadata.size &&
        entry.metadata.size > this.policy.compressionThreshold
      ) {
        entry = await this.compressEntry(entry);
      }

      // Check cache size limits
      await this.enforcePolicy();

      // Set expiration if not set
      if (!entry.expiresAt) {
        entry.expiresAt = new Date(Date.now() + this.policy.ttlSeconds * 1000);
      }

      // Initialize access tracking
      entry.accessCount = entry.accessCount || 0;
      entry.lastAccessed = new Date();
      entry.frequency = entry.frequency || 0;

      // Save to database
      await this.saveToDatabase(entry);

      // Add to memory cache if high priority
      if (entry.priority === 'critical' || entry.priority === 'high') {
        this.memoryCache.set(entry.id, entry);
      }

      this.updateStats();
      return true;
    } catch (_error) {
      console._error('Error setting cache entry:', _error);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      this.memoryCache.delete(id);

      if (!this.db) return false;

      const transaction = this.db.transaction(['enhancedCache'], 'readwrite');
      const store = transaction.objectStore('enhancedCache');

      return new Promise(resolve => {
        const request = store.delete(id);
        request.onsuccess = () => {
          this.updateStats();
          resolve(true);
        };
        request.onerror = () => resolve(false);
      });
    } catch (_error) {
      console._error('Error deleting cache entry:', _error);
      return false;
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.accessLog.clear();

    if (!this.db) return;

    const transaction = this.db.transaction(
      ['enhancedCache', 'accessLog'],
      'readwrite'
    );

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('enhancedCache').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request._error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('accessLog').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request._error);
      }),
    ]);

    this.resetStats();
  }

  // Cache warming - preload popular/likely-to-be-accessed content
  async warmCache(sounds: CustomSound[]): Promise<void> {
    if (!this.warmingConfig.enabled) return;

    const currentHour = new Date().getHours();
    if (!this.warmingConfig.scheduleHours.includes(currentHour)) {
      return;
    }

    console.log('Starting cache warming...');

    // Sort sounds by priority for warming
    const prioritizedSounds = sounds
      .filter(
        sound =>
          this.warmingConfig.priorityCategories.includes(sound.category) ||
          (sound.rating && sound.rating > 4)
      )
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, this.warmingConfig.maxWarmingEntries);

    // Warm cache in batches
    for (
      let i = 0;
      i < prioritizedSounds.length;
      i += this.warmingConfig.warmingBatchSize
    ) {
      const batch = prioritizedSounds.slice(i, i + this.warmingConfig.warmingBatchSize);

      await Promise.allSettled(batch.map(sound => this.warmCacheEntry(sound)));

      // Small delay between batches to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Cache warming completed for ${prioritizedSounds.length} sounds`);
  }

  private async warmCacheEntry(sound: CustomSound): Promise<void> {
    const cacheKey = `warm_${sound.id}`;

    // Check if already cached
    const existing = await this.get(cacheKey);
    if (existing) return;

    try {
      // Create a basic cache entry for warming
      const entry: CacheEntry = {
        id: cacheKey,
        type: 'audio_file',
        data: null, // We'll load data later when actually needed
        metadata: {
          soundId: sound.id,
          size: (sound.duration * 128 * 1024) / 8, // Estimate
          isPreloaded: true,
        },
        cachedAt: new Date(),
        priority: 'low',
        accessCount: 0,
        lastAccessed: new Date(),
        frequency: 0,
        tags: [sound.category, ...sound.tags],
      };

      await this.set(entry);
      this.stats.preloadHits++;
    } catch (_error) {
      console.warn(`Failed to warm cache for sound ${sound.id}:`, _error);
    }
  }

  // Intelligent cache eviction
  private async enforcePolicy(): Promise<void> {
    const currentStats = await this.calculateCurrentStats();

    if (
      currentStats.totalSize <= this.policy.maxSizeBytes &&
      currentStats.totalEntries <= this.policy.maxEntries
    ) {
      return; // No eviction needed
    }

    const entriesToEvict = await this.selectEntriesForEviction();

    for (const entry of entriesToEvict) {
      await this.delete(entry.id);
      this.stats.evictionCount++;
    }

    console.log(`Evicted ${entriesToEvict.length} cache entries`);
  }

  private async selectEntriesForEviction(): Promise<CacheEntry[]> {
    const allEntries = await this.getAllEntries();
    const now = new Date();

    // Remove expired entries first
    const expired = allEntries.filter(
      entry => entry.expiresAt && entry.expiresAt < now
    );

    if (expired.length > 0) {
      return expired;
    }

    // Apply eviction strategy
    switch (this.policy.evictionStrategy) {
      case 'lru':
        return this.selectLRUEntries(allEntries);
      case 'lfu':
        return this.selectLFUEntries(allEntries);
      case 'fifo':
        return this.selectFIFOEntries(allEntries);
      case 'intelligent':
      default:
        return this.selectIntelligentEntries(allEntries);
    }
  }

  private selectIntelligentEntries(entries: CacheEntry[]): CacheEntry[] {
    // Intelligent eviction considers multiple factors
    const scored = entries.map(entry => {
      const age = Date.now() - entry.cachedAt.getTime();
      const timeSinceAccess = Date.now() - entry.lastAccessed.getTime();
      const size = entry.metadata.size || 0;

      // Lower score = higher priority for eviction
      let score = 0;

      // Factor in frequency (higher frequency = lower eviction score)
      score -= entry.frequency * 10;

      // Factor in recency (more recent access = lower eviction score)
      score += timeSinceAccess / (1000 * 60 * 60); // Hours since access

      // Factor in size (larger files get slightly higher eviction score)
      score += Math.log(size + 1) / 1000;

      // Factor in priority (critical/high priority = much lower eviction score)
      if (entry.priority === 'critical') score -= 100;
      else if (entry.priority === 'high') score -= 50;
      else if (entry.priority === 'medium') score -= 20;

      // Factor in age (very old entries get higher eviction score)
      if (age > 7 * 24 * 60 * 60 * 1000) score += 50; // Older than 7 days

      return { entry, score };
    });

    // Sort by score (lowest first) and return top candidates
    scored.sort((a, b) => a.score - b.score);

    // Evict up to 10% of entries or until under limits
    const maxEvict = Math.min(
      entries.length * 0.1,
      entries.length - this.policy.maxEntries + 10
    );
    return scored.slice(0, maxEvict).map(s => s.entry);
  }

  private selectLRUEntries(entries: CacheEntry[]): CacheEntry[] {
    return entries
      .sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime())
      .slice(0, Math.min(50, entries.length * 0.1));
  }

  private selectLFUEntries(entries: CacheEntry[]): CacheEntry[] {
    return entries
      .sort((a, b) => a.frequency - b.frequency)
      .slice(0, Math.min(50, entries.length * 0.1));
  }

  private selectFIFOEntries(entries: CacheEntry[]): CacheEntry[] {
    return entries
      .sort((a, b) => a.cachedAt.getTime() - b.cachedAt.getTime())
      .slice(0, Math.min(50, entries.length * 0.1));
  }

  private async compressEntry(entry: CacheEntry): Promise<CacheEntry> {
    if (!entry.data || !(entry.data instanceof ArrayBuffer)) {
      return entry;
    }

    try {
      // Simulate compression (in real implementation, use actual compression)
      const originalSize = entry.data.byteLength;

      // Mock compression - reduce size by 30%
      const compressedSize = Math.floor(originalSize * 0.7);
      const compressedData = entry.data.slice(0, compressedSize);

      entry.data = compressedData;
      entry.originalSize = originalSize;
      entry.compressionRatio = originalSize / compressedSize;
      entry.metadata.compressionLevel = 'medium';
      entry.metadata.size = compressedSize;

      console.log(
        `Compressed cache entry ${entry.id}: ${originalSize} -> ${compressedSize} bytes`
      );

      return entry;
    } catch (_error) {
      console.warn('Compression failed:', _error);
      return entry;
    }
  }

  private recordAccess(id: string, startTime: number): void {
    const accessTime = performance.now() - startTime;

    // Update average access time
    this.stats.averageAccessTime =
      this.stats.averageAccessTime * 0.9 + accessTime * 0.1;

    // Update access log
    const now = Date.now();
    const log = this.accessLog.get(id) || [];
    log.push(now);

    // Keep only last 100 accesses
    if (log.length > 100) {
      log.shift();
    }

    this.accessLog.set(id, log);

    // Update frequency in cache entry
    this.updateEntryFrequency(id, log);
  }

  private async updateEntryFrequency(id: string, accessLog: number[]): Promise<void> {
    const entry = this.memoryCache.get(id) || (await this.getFromDatabase(id));
    if (!entry) return;

    // Calculate frequency based on recent accesses
    const now = Date.now();
    const recent = accessLog.filter(time => now - time < 24 * 60 * 60 * 1000); // Last 24 hours

    entry.frequency = recent.length;
    entry.accessCount++;
    entry.lastAccessed = new Date();

    // Update in cache
    if (this.memoryCache.has(id)) {
      this.memoryCache.set(id, entry);
    }
  }

  private async getFromDatabase(id: string): Promise<CacheEntry | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction(['enhancedCache'], 'readonly');
    const store = transaction.objectStore('enhancedCache');

    return new Promise(resolve => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  private async saveToDatabase(entry: CacheEntry): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['enhancedCache'], 'readwrite');
    const store = transaction.objectStore('enhancedCache');

    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request._error);
    });
  }

  private async getAllEntries(): Promise<CacheEntry[]> {
    if (!this.db) return [];

    const transaction = this.db.transaction(['enhancedCache'], 'readonly');
    const store = transaction.objectStore('enhancedCache');

    return new Promise(resolve => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  private async calculateCurrentStats(): Promise<{
    totalSize: number;
    totalEntries: number;
  }> {
    const entries = await this.getAllEntries();

    return {
      totalSize: entries.reduce((sum, entry) => sum + (entry.metadata.size || 0), 0),
      totalEntries: entries.length,
    };
  }

  private async updateStats(): Promise<void> {
    const current = await this.calculateCurrentStats();
    this.stats.totalSize = current.totalSize;
    this.stats.totalEntries = current.totalEntries;

    // Calculate memory pressure
    this.stats.memoryPressure = Math.min(
      1,
      current.totalSize / this.policy.maxSizeBytes
    );
  }

  private resetStats(): void {
    this.stats = {
      totalSize: 0,
      totalEntries: 0,
      hitRate: 0,
      missRate: 0,
      compressionRatio: 0,
      averageAccessTime: 0,
      evictionCount: 0,
      preloadHits: 0,
      memoryPressure: 0,
    };
  }

  private async startMaintenanceTasks(): Promise<void> {
    // Cleanup expired entries every hour
    setInterval(
      async () => {
        await this.cleanupExpiredEntries();
      },
      60 * 60 * 1000
    );

    // Update stats every 5 minutes
    setInterval(
      async () => {
        await this.updateStats();
      },
      5 * 60 * 1000
    );

    // Enforce policy every 10 minutes
    setInterval(
      async () => {
        await this.enforcePolicy();
      },
      10 * 60 * 1000
    );
  }

  private async cleanupExpiredEntries(): Promise<void> {
    const entries = await this.getAllEntries();
    const now = new Date();
    const expired = entries.filter(entry => entry.expiresAt && entry.expiresAt < now);

    for (const entry of expired) {
      await this.delete(entry.id);
    }

    if (expired.length > 0) {
      console.log(`Cleaned up ${expired.length} expired cache entries`);
    }
  }

  // Public API methods
  getStats(): CacheStats {
    return { ...this.stats };
  }

  updatePolicy(updates: Partial<CachePolicy>): void {
    this.policy = { ...this.policy, ...updates };
    console.log('Cache policy updated:', this.policy);
  }

  updateWarmingConfig(updates: Partial<CacheWarmingConfig>): void {
    this.warmingConfig = { ...this.warmingConfig, ...updates };
    console.log('Cache warming _config updated:', this.warmingConfig);
  }

  async optimize(): Promise<void> {
    console.log('Starting cache optimization...');

    await this.enforcePolicy();
    await this.cleanupExpiredEntries();
    await this.updateStats();

    console.log('Cache optimization completed');
  }
}

// Export singleton
export const enhancedCacheManager = EnhancedCacheManager.getInstance();
