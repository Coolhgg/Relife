/**
 * IndexedDB Schema Definitions with Type Safety
 * Provides strongly typed interfaces for IndexedDB storage operations
 */

import type { DBSchema, IDBPDatabase } from 'idb';
import type {
  Alarm,
  User,
  AlarmEvent,
  AlarmInstance,
  VoiceMood,
  _PersonalizationSettings,
  Theme,
  Battle,
} from './domain';

// =============================================================================
// STORAGE METADATA INTERFACES
// =============================================================================

export interface StorageMetadata {
  id: string;
  version: string;
  lastSync: string;
  lastBackup?: string;
  pendingChanges: number;
  conflictResolution: 'client-wins' | 'server-wins' | 'merge' | 'manual';
  dataIntegrityHash: string;
  syncRetryCount: number;
  lastErrorReport?: {
    timestamp: string;
    error: string;
    context: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PendingChange {
  id: string;
  entityType: 'alarm' | 'user' | 'theme' | 'voice_mood' | 'battle';
  entityId: string;
  type: 'create' | 'update' | 'delete';
  data?: any;
  timestamp: string;
  retryCount: number;
  lastRetry?: string;
  error?: string;
}

export interface ConflictResolution {
  id: string;
  entityType: string;
  entityId: string;
  localData: any;
  serverData: any;
  timestamp: string;
  resolution?: 'client' | 'server' | 'merged';
  mergedData?: any;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  version: string;
  dataTypes: string[];
  size: number;
  hash: string;
  isAutomatic: boolean;
  description?: string;
  metadata: Record<string, any>;
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: string;
  expiresAt?: string;
  tags: string[];
  size: number;
  accessCount: number;
  lastAccess: string;
}

export interface SearchIndex {
  id: string;
  entityType: string;
  entityId: string;
  searchText: string;
  keywords: string[];
  timestamp: string;
}

// =============================================================================
// EXTENDED DOMAIN INTERFACES WITH STORAGE METADATA
// =============================================================================

export interface StoredAlarm extends Omit<Alarm, 'createdAt' | 'updatedAt'> {
  // Convert dates to strings for IndexedDB storage
  createdAt: string;
  updatedAt: string;
  // Storage-specific metadata
  lastSyncedAt?: string;
  syncVersion?: number;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface StoredUser
  extends Omit<User, 'joinDate' | 'lastActive' | 'createdAt' | 'updatedAt'> {
  joinDate?: string;
  lastActive?: string;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
  syncVersion?: number;
}

export interface StoredAlarmEvent extends Omit<AlarmEvent, 'timestamp'> {
  timestamp: string;
  syncedAt?: string;
}

export interface StoredAlarmInstance
  extends Omit<AlarmInstance, 'scheduledTime' | 'actualTime' | 'createdAt'> {
  scheduledTime: string;
  actualTime?: string;
  createdAt: string;
  syncedAt?: string;
}

export interface StoredVoiceMood extends Omit<VoiceMood, 'createdAt'> {
  createdAt?: string;
  lastSyncedAt?: string;
  syncVersion?: number;
}

export interface StoredTheme extends Omit<Theme, 'createdAt'> {
  createdAt?: string;
  lastSyncedAt?: string;
  syncVersion?: number;
}

export interface StoredBattle
  extends Omit<Battle, 'startedAt' | 'completedAt' | 'createdAt'> {
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  lastSyncedAt?: string;
  syncVersion?: number;
}

// =============================================================================
// INDEXEDDB SCHEMA DEFINITION
// =============================================================================

export interface RelifeDBSchema extends DBSchema {
  // Core entities
  alarms: {
    key: string;
    value: StoredAlarm;
    indexes: {
      'by-user-id': string;
      'by-enabled': boolean;
      'by-time': string;
      'by-updated': string;
      'by-sync-version': number;
    };
  };

  users: {
    key: string;
    value: StoredUser;
    indexes: {
      'by-email': string;
      'by-subscription-tier': string;
      'by-last-active': string;
    };
  };

  alarm_events: {
    key: string;
    value: StoredAlarmEvent;
    indexes: {
      'by-alarm-id': string;
      'by-user-id': string;
      'by-type': string;
      'by-timestamp': string;
    };
  };

  alarm_instances: {
    key: string;
    value: StoredAlarmInstance;
    indexes: {
      'by-alarm-id': string;
      'by-status': string;
      'by-scheduled-time': string;
    };
  };

  voice_moods: {
    key: string;
    value: StoredVoiceMood;
    indexes: {
      'by-user-id': string;
      'by-tone': string;
      'by-is-custom': boolean;
    };
  };

  themes: {
    key: string;
    value: StoredTheme;
    indexes: {
      'by-category': string;
      'by-is-custom': boolean;
      'by-is-premium': boolean;
      'by-created-by': string;
    };
  };

  battles: {
    key: string;
    value: StoredBattle;
    indexes: {
      'by-alarm-id': string;
      'by-user-id': string;
      'by-type': string;
      'by-status': string;
      'by-created-at': string;
    };
  };

  // Storage management entities
  metadata: {
    key: string;
    value: StorageMetadata;
    indexes: {
      'by-last-sync': string;
      'by-version': string;
    };
  };

  pending_changes: {
    key: string;
    value: PendingChange;
    indexes: {
      'by-entity-type': string;
      'by-entity-id': string;
      'by-timestamp': string;
      'by-retry-count': number;
    };
  };

  conflicts: {
    key: string;
    value: ConflictResolution;
    indexes: {
      'by-entity-type': string;
      'by-entity-id': string;
      'by-timestamp': string;
      'by-resolution': string;
    };
  };

  backups: {
    key: string;
    value: BackupRecord;
    indexes: {
      'by-timestamp': string;
      'by-version': string;
      'by-is-automatic': boolean;
    };
  };

  cache: {
    key: string;
    value: CacheEntry;
    indexes: {
      'by-expires-at': string;
      'by-last-access': string;
      'by-tags': string;
      'by-size': number;
    };
  };

  search_index: {
    key: string;
    value: SearchIndex;
    indexes: {
      'by-entity-type': string;
      'by-entity-id': string;
      'by-search-text': string;
      'by-timestamp': string;
    };
  };
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type RelifeDB = IDBPDatabase<RelifeDBSchema>;

export type EntityType = keyof RelifeDBSchema;

export type StoredEntity<T extends EntityType> = RelifeDBSchema[T]['value'];

export type EntityKey<T extends EntityType> = RelifeDBSchema[T]['key'];

// Database version and upgrade information
export const DB_VERSION = 1;
export const DB_NAME = 'RelifeDB';

// Index definitions for type safety
export const INDEXES = {
  alarms: {
    'by-user-id': 'userId',
    'by-enabled': 'enabled',
    'by-time': 'time',
    'by-updated': 'updatedAt',
    'by-sync-version': 'syncVersion',
  },
  users: {
    'by-email': 'email',
    'by-subscription-tier': 'subscriptionTier',
    'by-last-active': 'lastActive',
  },
  alarm_events: {
    'by-alarm-id': 'alarmId',
    'by-user-id': 'userId',
    'by-type': 'type',
    'by-timestamp': 'timestamp',
  },
  alarm_instances: {
    'by-alarm-id': 'alarmId',
    'by-status': 'status',
    'by-scheduled-time': 'scheduledTime',
  },
  voice_moods: {
    'by-user-id': 'userId',
    'by-tone': 'tone',
    'by-is-custom': 'isCustom',
  },
  themes: {
    'by-category': 'category',
    'by-is-custom': 'isCustom',
    'by-is-premium': 'isPremium',
    'by-created-by': 'createdBy',
  },
  battles: {
    'by-alarm-id': 'alarmId',
    'by-user-id': 'userId',
    'by-type': 'type',
    'by-status': 'status',
    'by-created-at': 'createdAt',
  },
  metadata: {
    'by-last-sync': 'lastSync',
    'by-version': 'version',
  },
  pending_changes: {
    'by-entity-type': 'entityType',
    'by-entity-id': 'entityId',
    'by-timestamp': 'timestamp',
    'by-retry-count': 'retryCount',
  },
  conflicts: {
    'by-entity-type': 'entityType',
    'by-entity-id': 'entityId',
    'by-timestamp': 'timestamp',
    'by-resolution': 'resolution',
  },
  backups: {
    'by-timestamp': 'timestamp',
    'by-version': 'version',
    'by-is-automatic': 'isAutomatic',
  },
  cache: {
    'by-expires-at': 'expiresAt',
    'by-last-access': 'lastAccess',
    'by-tags': 'tags',
    'by-size': 'size',
  },
  search_index: {
    'by-entity-type': 'entityType',
    'by-entity-id': 'entityId',
    'by-search-text': 'searchText',
    'by-timestamp': 'timestamp',
  },
} as const;

// Storage configuration
export const STORAGE_CONFIG = {
  // Cache expiration times
  CACHE_TTL: {
    SHORT: 5 * 60 * 1000, // 5 minutes
    MEDIUM: 30 * 60 * 1000, // 30 minutes
    LONG: 24 * 60 * 60 * 1000, // 24 hours
  },
  // Backup settings
  BACKUP: {
    MAX_AUTOMATIC_BACKUPS: 10,
    MAX_MANUAL_BACKUPS: 50,
    AUTO_BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
  },
  // Sync settings
  SYNC: {
    MAX_RETRY_COUNT: 3,
    RETRY_DELAY_BASE: 1000, // 1 second
    BATCH_SIZE: 100,
  },
  // Search settings
  SEARCH: {
    MIN_QUERY_LENGTH: 2,
    MAX_RESULTS: 100,
  },
} as const;
