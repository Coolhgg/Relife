/**
 * Modern IndexedDB Storage Service with Type Safety
 * Provides high-performance, type-safe local storage using the idb package
 */

import { openDB, deleteDB } from 'idb';
import type {
  RelifeDB,
  RelifeDBSchema,
  _StorageMetadata,
  PendingChange,
  _ConflictResolution,
  _BackupRecord,
  CacheEntry,
  SearchIndex,
  StoredAlarm,
  _StoredUser,
  _StoredAlarmEvent,
  _StoredVoiceMood,
  _StoredTheme,
  _StoredBattle,
  EntityType,
  StoredEntity,
  DB_VERSION,
  DB_NAME,
  INDEXES,
  STORAGE_CONFIG,
} from '../types/indexeddb-schema';
import type { Alarm, _User } from '../types/domain';
import { ErrorHandler } from './error-handler';
import _SecurityService from './security';

export class IndexedDBStorage {
  private static instance: IndexedDBStorage;
  private db: RelifeDB | null = null;
  private initPromise: Promise<RelifeDB> | null = null;
  private readonly dbName = DB_NAME;
  private readonly dbVersion = DB_VERSION;

  private constructor() {}

  static getInstance(): IndexedDBStorage {
    if (!IndexedDBStorage.instance) {
      IndexedDBStorage.instance = new IndexedDBStorage();
    }
    return IndexedDBStorage.instance;
  }

  // =============================================================================
  // DATABASE INITIALIZATION AND MANAGEMENT
  // =============================================================================

  async initialize(): Promise<RelifeDB> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.openDatabase();
    this.db = await this.initPromise;
    return this.db;
  }

  private async openDatabase(): Promise<RelifeDB> {
    try {
      console.log('[IndexedDBStorage] Opening database...');

      const db = await openDB<RelifeDBSchema>(this.dbName, this.dbVersion, {
        upgrade: (db, oldVersion, newVersion, transaction, _event) => {
          console.log(
            `[IndexedDBStorage] Upgrading database from ${oldVersion} to ${newVersion}`
          );
          this.upgradeDatabase(db, oldVersion, newVersion, transaction);
        },
        blocked: (currentVersion, blockedVersion, _event) => {
          console.warn('[IndexedDBStorage] Database blocked:', {
            currentVersion,
            blockedVersion,
          });
        },
        blocking: (currentVersion, blockedVersion, _event) => {
          console.warn('[IndexedDBStorage] Database blocking:', {
            currentVersion,
            blockedVersion,
          });
        },
      });

      console.log('[IndexedDBStorage] Database opened successfully');
      return db;
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to open IndexedDB database', {
        context: 'IndexedDBStorage.openDatabase',
        dbName: this.dbName,
        dbVersion: this.dbVersion,
      });
      throw error;
    }
  }

  private upgradeDatabase(
    db: RelifeDB,
    oldVersion: number,
    newVersion: number | null,
    _transaction: any
  ): void {
    console.log('[IndexedDBStorage] Performing database upgrade...');

    try {
      // Create object stores and indexes
      this.createObjectStores(db);
      console.log('[IndexedDBStorage] Database upgrade completed successfully');
    } catch (error) {
      ErrorHandler.handleError(error, 'Database upgrade failed', {
        context: 'IndexedDBStorage.upgradeDatabase',
        oldVersion,
        newVersion,
      });
      throw error;
    }
  }

  private createObjectStores(db: RelifeDB): void {
    // Create alarms store
    if (!db.objectStoreNames.contains('alarms')) {
      const alarmsStore = db.createObjectStore('alarms', { keyPath: 'id' });
      alarmsStore.createIndex('by-user-id', INDEXES.alarms['by-user-id']);
      alarmsStore.createIndex('by-enabled', INDEXES.alarms['by-enabled']);
      alarmsStore.createIndex('by-time', INDEXES.alarms['by-time']);
      alarmsStore.createIndex('by-updated', INDEXES.alarms['by-updated']);
      alarmsStore.createIndex('by-sync-version', INDEXES.alarms['by-sync-version']);
    }

    // Create users store
    if (!db.objectStoreNames.contains('users')) {
      const usersStore = db.createObjectStore('users', { keyPath: 'id' });
      usersStore.createIndex('by-email', INDEXES.users['by-email']);
      usersStore.createIndex(
        'by-subscription-tier',
        INDEXES.users['by-subscription-tier']
      );
      usersStore.createIndex('by-last-active', INDEXES.users['by-last-active']);
    }

    // Create alarm_events store
    if (!db.objectStoreNames.contains('alarm_events')) {
      const eventsStore = db.createObjectStore('alarm_events', { keyPath: 'id' });
      eventsStore.createIndex('by-alarm-id', INDEXES.alarm_events['by-alarm-id']);
      eventsStore.createIndex('by-user-id', INDEXES.alarm_events['by-user-id']);
      eventsStore.createIndex('by-type', INDEXES.alarm_events['by-type']);
      eventsStore.createIndex('by-timestamp', INDEXES.alarm_events['by-timestamp']);
    }

    // Create alarm_instances store
    if (!db.objectStoreNames.contains('alarm_instances')) {
      const instancesStore = db.createObjectStore('alarm_instances', { keyPath: 'id' });
      instancesStore.createIndex('by-alarm-id', INDEXES.alarm_instances['by-alarm-id']);
      instancesStore.createIndex('by-status', INDEXES.alarm_instances['by-status']);
      instancesStore.createIndex(
        'by-scheduled-time',
        INDEXES.alarm_instances['by-scheduled-time']
      );
    }

    // Create voice_moods store
    if (!db.objectStoreNames.contains('voice_moods')) {
      const moodsStore = db.createObjectStore('voice_moods', { keyPath: 'id' });
      moodsStore.createIndex('by-user-id', INDEXES.voice_moods['by-user-id']);
      moodsStore.createIndex('by-tone', INDEXES.voice_moods['by-tone']);
      moodsStore.createIndex('by-is-custom', INDEXES.voice_moods['by-is-custom']);
    }

    // Create themes store
    if (!db.objectStoreNames.contains('themes')) {
      const themesStore = db.createObjectStore('themes', { keyPath: 'id' });
      themesStore.createIndex('by-category', INDEXES.themes['by-category']);
      themesStore.createIndex('by-is-custom', INDEXES.themes['by-is-custom']);
      themesStore.createIndex('by-is-premium', INDEXES.themes['by-is-premium']);
      themesStore.createIndex('by-created-by', INDEXES.themes['by-created-by']);
    }

    // Create battles store
    if (!db.objectStoreNames.contains('battles')) {
      const battlesStore = db.createObjectStore('battles', { keyPath: 'id' });
      battlesStore.createIndex('by-alarm-id', INDEXES.battles['by-alarm-id']);
      battlesStore.createIndex('by-user-id', INDEXES.battles['by-user-id']);
      battlesStore.createIndex('by-type', INDEXES.battles['by-type']);
      battlesStore.createIndex('by-status', INDEXES.battles['by-status']);
      battlesStore.createIndex('by-created-at', INDEXES.battles['by-created-at']);
    }

    // Create metadata store
    if (!db.objectStoreNames.contains('metadata')) {
      const metadataStore = db.createObjectStore('metadata', { keyPath: 'id' });
      metadataStore.createIndex('by-last-sync', INDEXES.metadata['by-last-sync']);
      metadataStore.createIndex('by-version', INDEXES.metadata['by-version']);
    }

    // Create pending_changes store
    if (!db.objectStoreNames.contains('pending_changes')) {
      const changesStore = db.createObjectStore('pending_changes', { keyPath: 'id' });
      changesStore.createIndex(
        'by-entity-type',
        INDEXES.pending_changes['by-entity-type']
      );
      changesStore.createIndex('by-entity-id', INDEXES.pending_changes['by-entity-id']);
      changesStore.createIndex('by-timestamp', INDEXES.pending_changes['by-timestamp']);
      changesStore.createIndex(
        'by-retry-count',
        INDEXES.pending_changes['by-retry-count']
      );
    }

    // Create conflicts store
    if (!db.objectStoreNames.contains('conflicts')) {
      const conflictsStore = db.createObjectStore('conflicts', { keyPath: 'id' });
      conflictsStore.createIndex('by-entity-type', INDEXES.conflicts['by-entity-type']);
      conflictsStore.createIndex('by-entity-id', INDEXES.conflicts['by-entity-id']);
      conflictsStore.createIndex('by-timestamp', INDEXES.conflicts['by-timestamp']);
      conflictsStore.createIndex('by-resolution', INDEXES.conflicts['by-resolution']);
    }

    // Create backups store
    if (!db.objectStoreNames.contains('backups')) {
      const backupsStore = db.createObjectStore('backups', { keyPath: 'id' });
      backupsStore.createIndex('by-timestamp', INDEXES.backups['by-timestamp']);
      backupsStore.createIndex('by-version', INDEXES.backups['by-version']);
      backupsStore.createIndex('by-is-automatic', INDEXES.backups['by-is-automatic']);
    }

    // Create cache store
    if (!db.objectStoreNames.contains('cache')) {
      const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
      cacheStore.createIndex('by-expires-at', INDEXES.cache['by-expires-at']);
      cacheStore.createIndex('by-last-access', INDEXES.cache['by-last-access']);
      cacheStore.createIndex('by-tags', INDEXES.cache['by-tags'], { multiEntry: true });
      cacheStore.createIndex('by-size', INDEXES.cache['by-size']);
    }

    // Create search_index store
    if (!db.objectStoreNames.contains('search_index')) {
      const searchStore = db.createObjectStore('search_index', { keyPath: 'id' });
      searchStore.createIndex('by-entity-type', INDEXES.search_index['by-entity-type']);
      searchStore.createIndex('by-entity-id', INDEXES.search_index['by-entity-id']);
      searchStore.createIndex('by-search-text', INDEXES.search_index['by-search-text']);
      searchStore.createIndex('by-timestamp', INDEXES.search_index['by-timestamp']);
    }

    console.log('[IndexedDBStorage] All object stores and indexes created');
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      console.log('[IndexedDBStorage] Database closed');
    }
  }

  async deleteDatabase(): Promise<void> {
    await this.closeDatabase();
    await deleteDB(this.dbName);
    console.log('[IndexedDBStorage] Database deleted');
  }

  // =============================================================================
  // GENERIC CRUD OPERATIONS
  // =============================================================================

  async create<T extends EntityType>(
    storeName: T,
    data: StoredEntity<T>
  ): Promise<void> {
    try {
      const db = await this.initialize();
      await db.add(storeName, data);
      console.log(`[IndexedDBStorage] Created ${storeName} record:`, data);
    } catch (error) {
      ErrorHandler.handleError(error, `Failed to create ${storeName} record`, {
        context: 'IndexedDBStorage.create',
        storeName,
        data,
      });
      throw error;
    }
  }

  async read<T extends EntityType>(
    storeName: T,
    key: string
  ): Promise<StoredEntity<T> | undefined> {
    try {
      const db = await this.initialize();
      const result = await db.get(storeName, key);
      return result;
    } catch (error) {
      ErrorHandler.handleError(error, `Failed to read ${storeName} record`, {
        context: 'IndexedDBStorage.read',
        storeName,
        key,
      });
      throw error;
    }
  }

  async update<T extends EntityType>(
    storeName: T,
    data: StoredEntity<T>
  ): Promise<void> {
    try {
      const db = await this.initialize();
      await db.put(storeName, data);
      console.log(`[IndexedDBStorage] Updated ${storeName} record:`, data);
    } catch (error) {
      ErrorHandler.handleError(error, `Failed to update ${storeName} record`, {
        context: 'IndexedDBStorage.update',
        storeName,
        data,
      });
      throw error;
    }
  }

  async delete<T extends EntityType>(storeName: T, key: string): Promise<void> {
    try {
      const db = await this.initialize();
      await db.delete(storeName, key);
      console.log(`[IndexedDBStorage] Deleted ${storeName} record:`, key);
    } catch (error) {
      ErrorHandler.handleError(error, `Failed to delete ${storeName} record`, {
        context: 'IndexedDBStorage.delete',
        storeName,
        key,
      });
      throw error;
    }
  }

  async getAll<T extends EntityType>(storeName: T): Promise<StoredEntity<T>[]> {
    try {
      const db = await this.initialize();
      return await db.getAll(storeName);
    } catch (error) {
      ErrorHandler.handleError(error, `Failed to get all ${storeName} records`, {
        context: 'IndexedDBStorage.getAll',
        storeName,
      });
      throw error;
    }
  }

  async getAllKeys<T extends EntityType>(storeName: T): Promise<string[]> {
    try {
      const db = await this.initialize();
      return await db.getAllKeys(storeName);
    } catch (error) {
      ErrorHandler.handleError(error, `Failed to get all ${storeName} keys`, {
        context: 'IndexedDBStorage.getAllKeys',
        storeName,
      });
      throw error;
    }
  }

  async clear<T extends EntityType>(storeName: T): Promise<void> {
    try {
      const db = await this.initialize();
      await db.clear(storeName);
      console.log(`[IndexedDBStorage] Cleared ${storeName} store`);
    } catch (error) {
      ErrorHandler.handleError(error, `Failed to clear ${storeName} store`, {
        context: 'IndexedDBStorage.clear',
        storeName,
      });
      throw error;
    }
  }

  async count<T extends EntityType>(storeName: T): Promise<number> {
    try {
      const db = await this.initialize();
      return await db.count(storeName);
    } catch (error) {
      ErrorHandler.handleError(error, `Failed to count ${storeName} records`, {
        context: 'IndexedDBStorage.count',
        storeName,
      });
      throw error;
    }
  }

  // =============================================================================
  // INDEX-BASED QUERIES
  // =============================================================================

  async getByIndex<T extends EntityType, K extends keyof RelifeDBSchema[T]['indexes']>(
    storeName: T,
    indexName: K,
    query: RelifeDBSchema[T]['indexes'][K]
  ): Promise<StoredEntity<T>[]> {
    try {
      const db = await this.initialize();
      return await db.getAllFromIndex(storeName, indexName as string, query);
    } catch (error) {
      ErrorHandler.handleError(error, `Failed to query ${storeName} by index`, {
        context: 'IndexedDBStorage.getByIndex',
        storeName,
        indexName,
        query,
      });
      throw error;
    }
  }

  async getOneByIndex<
    T extends EntityType,
    K extends keyof RelifeDBSchema[T]['indexes'],
  >(
    storeName: T,
    indexName: K,
    query: RelifeDBSchema[T]['indexes'][K]
  ): Promise<StoredEntity<T> | undefined> {
    try {
      const db = await this.initialize();
      return await db.getFromIndex(storeName, indexName as string, query);
    } catch (error) {
      ErrorHandler.handleError(error, `Failed to get one ${storeName} by index`, {
        context: 'IndexedDBStorage.getOneByIndex',
        storeName,
        indexName,
        query,
      });
      throw error;
    }
  }

  // =============================================================================
  // ALARM-SPECIFIC OPERATIONS
  // =============================================================================

  private convertAlarmToStored(alarm: Alarm): StoredAlarm {
    return {
      ...alarm,
      createdAt: alarm.createdAt.toISOString(),
      updatedAt: alarm.updatedAt.toISOString(),
      syncVersion: 1,
    };
  }

  private convertStoredToAlarm(stored: StoredAlarm): Alarm {
    return {
      ...stored,
      createdAt: new Date(stored.createdAt),
      updatedAt: new Date(stored.updatedAt),
    };
  }

  async saveAlarm(alarm: Alarm): Promise<void> {
    const storedAlarm = this.convertAlarmToStored(alarm);
    const existing = await this.read('alarms', alarm.id);

    if (existing) {
      storedAlarm.syncVersion = (existing.syncVersion || 1) + 1;
      await this.update('alarms', storedAlarm);
    } else {
      await this.create('alarms', storedAlarm);
    }

    // Add to pending changes for sync
    await this.addPendingChange({
      id: `alarm-${alarm.id}-${Date.now()}`,
      entityType: 'alarm',
      entityId: alarm.id,
      type: existing ? 'update' : 'create',
      data: alarm,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    });

    // Update search index
    await this.updateSearchIndex(
      'alarm',
      alarm.id,
      [alarm.title, alarm.label || '', alarm.description || ''].join(' ')
    );
  }

  async getAlarm(id: string): Promise<Alarm | null> {
    const stored = await this.read('alarms', id);
    return stored ? this.convertStoredToAlarm(stored) : null;
  }

  async getAllAlarms(): Promise<Alarm[]> {
    const stored = await this.getAll('alarms');
    return stored.filter(alarm => !alarm.isDeleted).map(this.convertStoredToAlarm);
  }

  async getAlarmsByUserId(userId: string): Promise<Alarm[]> {
    const stored = await this.getByIndex('alarms', 'by-user-id', userId);
    return stored.filter(alarm => !alarm.isDeleted).map(this.convertStoredToAlarm);
  }

  async getEnabledAlarms(): Promise<Alarm[]> {
    const stored = await this.getByIndex('alarms', 'by-enabled', true);
    return stored.filter(alarm => !alarm.isDeleted).map(this.convertStoredToAlarm);
  }

  async deleteAlarm(id: string): Promise<void> {
    // Soft delete by marking as deleted
    const existing = await this.read('alarms', id);
    if (existing) {
      existing.isDeleted = true;
      existing.deletedAt = new Date().toISOString();
      existing.syncVersion = (existing.syncVersion || 1) + 1;
      await this.update('alarms', existing);

      // Add to pending changes
      await this.addPendingChange({
        id: `alarm-delete-${id}-${Date.now()}`,
        entityType: 'alarm',
        entityId: id,
        type: 'delete',
        timestamp: new Date().toISOString(),
        retryCount: 0,
      });

      // Remove from search index
      await this.removeFromSearchIndex('alarm', id);
    }
  }

  // =============================================================================
  // PENDING CHANGES MANAGEMENT
  // =============================================================================

  async addPendingChange(change: PendingChange): Promise<void> {
    await this.create('pending_changes', change);
    console.log('[IndexedDBStorage] Added pending change:', change);
  }

  async getPendingChanges(): Promise<PendingChange[]> {
    return await this.getAll('pending_changes');
  }

  async removePendingChange(id: string): Promise<void> {
    await this.delete('pending_changes', id);
  }

  async updatePendingChangeRetryCount(id: string): Promise<void> {
    const change = await this.read('pending_changes', id);
    if (change) {
      change.retryCount = (change.retryCount || 0) + 1;
      change.lastRetry = new Date().toISOString();
      await this.update('pending_changes', change);
    }
  }

  // =============================================================================
  // SEARCH INDEX MANAGEMENT
  // =============================================================================

  async updateSearchIndex(
    entityType: string,
    entityId: string,
    searchText: string
  ): Promise<void> {
    const keywords = this.extractKeywords(searchText);
    const searchIndex: SearchIndex = {
      id: `${entityType}-${entityId}`,
      entityType,
      entityId,
      searchText: searchText.toLowerCase(),
      keywords,
      timestamp: new Date().toISOString(),
    };

    const existing = await this.read('search_index', searchIndex.id);
    if (existing) {
      await this.update('search_index', searchIndex);
    } else {
      await this.create('search_index', searchIndex);
    }
  }

  async removeFromSearchIndex(entityType: string, entityId: string): Promise<void> {
    const id = `${entityType}-${entityId}`;
    await this.delete('search_index', id);
  }

  async search(query: string, entityTypes?: string[]): Promise<SearchIndex[]> {
    if (query.length < STORAGE_CONFIG.SEARCH.MIN_QUERY_LENGTH) {
      return [];
    }

    const _db = await this.initialize();
    const lowerQuery = query.toLowerCase();
    const results: SearchIndex[] = [];

    // Search by entity type if specified
    if (entityTypes && entityTypes.length > 0) {
      for (const entityType of entityTypes) {
        const typeResults = await this.getByIndex(
          'search_index',
          'by-entity-type',
          entityType
        );
        const filtered = typeResults.filter(
          item =>
            item.searchText.includes(lowerQuery) ||
            item.keywords.some(keyword => keyword.includes(lowerQuery))
        );
        results.push(...filtered);
      }
    } else {
      // Search all
      const allResults = await this.getAll('search_index');
      const filtered = allResults.filter(
        item =>
          item.searchText.includes(lowerQuery) ||
          item.keywords.some(keyword => keyword.includes(lowerQuery))
      );
      results.push(...filtered);
    }

    return results.slice(0, STORAGE_CONFIG.SEARCH.MAX_RESULTS);
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 1)
      .slice(0, 20); // Limit keywords
  }

  // =============================================================================
  // CACHE MANAGEMENT
  // =============================================================================

  async setCache<T>(
    key: string,
    data: T,
    ttl?: number,
    tags: string[] = []
  ): Promise<void> {
    const now = new Date().toISOString();
    const expiresAt = ttl ? new Date(Date.now() + ttl).toISOString() : undefined;

    const cacheEntry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      expiresAt,
      tags,
      size: JSON.stringify(data).length,
      accessCount: 0,
      lastAccess: now,
    };

    const existing = await this.read('cache', key);
    if (existing) {
      cacheEntry.accessCount = existing.accessCount;
      await this.update('cache', cacheEntry);
    } else {
      await this.create('cache', cacheEntry);
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    const entry = await this.read('cache', key);
    if (!entry) {
      return null;
    }

    // Check expiration
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      await this.delete('cache', key);
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccess = new Date().toISOString();
    await this.update('cache', entry);

    return entry.data as T;
  }

  async clearCache(tags?: string[]): Promise<void> {
    if (!tags || tags.length === 0) {
      await this.clear('cache');
      return;
    }

    // Clear cache entries with specific tags
    const db = await this.initialize();
    const transaction = db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    const index = store.index('by-tags');

    for (const tag of tags) {
      const cursor = await index.openCursor(tag);
      if (cursor) {
        await cursor.delete();
      }
    }
  }

  async clearExpiredCache(): Promise<number> {
    const _db = await this.initialize();
    const now = new Date().toISOString();
    const expiredEntries = await this.getByIndex(
      'cache',
      'by-expires-at',
      IDBKeyRange.upperBound(now)
    );

    for (const entry of expiredEntries) {
      await this.delete('cache', entry.key);
    }

    console.log(
      `[IndexedDBStorage] Cleared ${expiredEntries.length} expired cache entries`
    );
    return expiredEntries.length;
  }

  // =============================================================================
  // DATABASE STATISTICS AND MAINTENANCE
  // =============================================================================

  async getStorageStats(): Promise<{
    totalSize: number;
    storeStats: Record<string, { count: number; estimatedSize: number }>;
    cacheStats: {
      totalEntries: number;
      expiredEntries: number;
      totalSize: number;
    };
    syncStats: {
      pendingChanges: number;
      conflicts: number;
      lastSync: string | null;
    };
  }> {
    const db = await this.initialize();
    const storeStats: Record<string, { count: number; estimatedSize: number }> = {};
    let totalSize = 0;

    // Get stats for each store
    for (const storeName of db.objectStoreNames) {
      const count = await db.count(storeName);
      const allData = await db.getAll(storeName);
      const estimatedSize = allData.reduce(
        (size, item) => size + JSON.stringify(item).length,
        0
      );

      storeStats[storeName] = { count, estimatedSize };
      totalSize += estimatedSize;
    }

    // Get cache stats
    const cacheEntries = await this.getAll('cache');
    const now = new Date();
    const expiredEntries = cacheEntries.filter(
      entry => entry.expiresAt && new Date(entry.expiresAt) < now
    );
    const cacheSize = cacheEntries.reduce((size, entry) => size + entry.size, 0);

    // Get sync stats
    const pendingChanges = await this.count('pending_changes');
    const conflicts = await this.count('conflicts');
    const metadata = await this.getAll('metadata');
    const lastSync =
      metadata.length > 0
        ? metadata.reduce(
            (latest, meta) =>
              !latest || meta.lastSync > latest ? meta.lastSync : latest,
            null as string | null
          )
        : null;

    return {
      totalSize,
      storeStats,
      cacheStats: {
        totalEntries: cacheEntries.length,
        expiredEntries: expiredEntries.length,
        totalSize: cacheSize,
      },
      syncStats: {
        pendingChanges,
        conflicts,
        lastSync,
      },
    };
  }

  async maintenance(): Promise<{
    clearedExpiredCache: number;
    optimizedIndexes: string[];
    errors: string[];
  }> {
    const result = {
      clearedExpiredCache: 0,
      optimizedIndexes: [] as string[],
      errors: [] as string[],
    };

    try {
      // Clear expired cache entries
      result.clearedExpiredCache = await this.clearExpiredCache();

      console.log('[IndexedDBStorage] Maintenance completed:', result);
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : 'Unknown maintenance error'
      );
      ErrorHandler.handleError(error, 'Database maintenance failed', {
        context: 'IndexedDBStorage.maintenance',
      });
    }

    return result;
  }
}

// Export singleton instance
export default IndexedDBStorage.getInstance();
