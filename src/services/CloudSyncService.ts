import type { PersonalizationSettings, Theme, ThemeConfig } from '../types';

export interface CloudSyncPreferences {
  theme: Theme;
  themeConfig?: Partial<ThemeConfig>;
  personalization: PersonalizationSettings;
  lastModified: string;
  deviceId: string;
  version: number;
}

export interface CloudSyncOptions {
  autoSync?: boolean;
  syncInterval?: number; // in milliseconds
  conflictResolution?: 'local' | 'remote' | 'merge' | 'ask';
  enableOfflineCache?: boolean;
}

export interface CloudSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime?: Date | null;
  hasConflicts: boolean;
  pendingChanges: number;
  error?: string | null;
}

class CloudSyncService {
  private static instance: CloudSyncService;
  private preferences: CloudSyncPreferences | null = null;
  private options: CloudSyncOptions;
  private status: CloudSyncStatus;
  private syncTimer: NodeJS.Timeout | null = null;
  private listeners: Set<(status: CloudSyncStatus) => void> = new Set();
  private deviceId: string;
  private apiEndpoint: string;

  private constructor() {
    this.deviceId = this.generateDeviceId();
    this.apiEndpoint = process.env.REACT_APP_API_ENDPOINT || '/api';
    this.options = {
      autoSync: true,
      syncInterval: 30000, // 30 seconds
      conflictResolution: 'merge',
      enableOfflineCache: true
    };
    
    this.status = {
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncTime: null,
      hasConflicts: false,
      pendingChanges: 0,
      error: null
    };

    this.initializeListeners();
  }

  static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }

  private generateDeviceId(): string {
    // Try to get existing device ID from localStorage
    const stored = localStorage.getItem('device-id');
    if (stored) return stored;

    // Generate new device ID
    const id = 'device_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('device-id', id);
    return id;
  }

  private initializeListeners(): void {
    // Online/offline status
    window.addEventListener('online', () => {
      this.updateStatus({ isOnline: true });
      if (this.options.autoSync) {
        this.sync();
      }
    });

    window.addEventListener('offline', () => {
      this.updateStatus({ isOnline: false });
      this.stopAutoSync();
    });

    // Visibility change (when app becomes active)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.status.isOnline && this.options.autoSync) {
        this.sync();
      }
    });

    // Before unload - save any pending changes
    window.addEventListener('beforeunload', () => {
      this.saveToCache();
    });
  }

  // Configuration methods
  setOptions(options: Partial<CloudSyncOptions>): void {
    this.options = { ...this.options, ...options };
    
    if (options.autoSync !== undefined) {
      if (options.autoSync) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }

    if (options.syncInterval !== undefined) {
      this.restartAutoSync();
    }
  }

  getOptions(): CloudSyncOptions {
    return { ...this.options };
  }

  getStatus(): CloudSyncStatus {
    return { ...this.status };
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  // Status management
  private updateStatus(updates: Partial<CloudSyncStatus>): void {
    this.status = { ...this.status, ...updates };
    this.notifyListeners();
  }

  onStatusChange(listener: (status: CloudSyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.status));
  }

  // Update preferences method for theme provider
  updatePreferences(preferences: CloudSyncPreferences): Promise<void> {
    this.preferences = preferences;
    this.updateStatus({ pendingChanges: this.status.pendingChanges + 1 });
    
    // Save locally immediately
    this.saveLocalPreferences(preferences);
    
    // Sync to cloud if online
    if (this.status.isOnline && this.options.autoSync) {
      return this.sync();
    } else {
      this.saveToCache();
      return Promise.resolve();
    }
  }

  // Sync methods
  async sync(): Promise<void> {
    if (this.status.isSyncing || !this.status.isOnline) {
      return;
    }

    this.updateStatus({ isSyncing: true, error: null });

    try {
      // Get local preferences
      const localPrefs = this.getLocalPreferences();
      
      // Fetch remote preferences
      const remotePrefs = await this.fetchRemotePreferences();
      
      // Resolve conflicts if both exist
      let syncPrefs: CloudSyncPreferences;
      if (localPrefs && remotePrefs) {
        syncPrefs = await this.resolveConflicts(localPrefs, remotePrefs);
      } else {
        syncPrefs = localPrefs || remotePrefs || this.createDefaultPreferences();
      }
      
      // Update local storage
      this.saveLocalPreferences(syncPrefs);
      
      // Update remote storage
      await this.saveRemotePreferences(syncPrefs);
      
      // Update status
      this.preferences = syncPrefs;
      this.updateStatus({
        isSyncing: false,
        lastSyncTime: new Date(),
        hasConflicts: false,
        pendingChanges: 0,
        error: null
      });
      
    } catch (error) {
      console.error('Cloud sync error:', error);
      this.updateStatus({
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      });
      
      // Save to cache for retry
      this.saveToCache();
    }
  }

  getLocalPreferences(): CloudSyncPreferences | null {
    try {
      const stored = localStorage.getItem('cloud-sync-preferences');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading local preferences:', error);
      return null;
    }
  }

  private saveLocalPreferences(preferences: CloudSyncPreferences): void {
    try {
      localStorage.setItem('cloud-sync-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving local preferences:', error);
    }
  }

  private async fetchRemotePreferences(): Promise<CloudSyncPreferences | null> {
    try {
      // Check if user is authenticated
      const authToken = this.getAuthToken();
      if (!authToken) {
        return null; // No user logged in
      }

      const response = await fetch(`${this.apiEndpoint}/user/preferences`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        return null; // No remote preferences exist
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching remote preferences:', error);
      throw error;
    }
  }

  private async saveRemotePreferences(preferences: CloudSyncPreferences): Promise<void> {
    const authToken = this.getAuthToken();
    if (!authToken) {
      return; // No user logged in, skip cloud save
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/user/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving remote preferences:', error);
      throw error;
    }
  }

  private async resolveConflicts(
    local: CloudSyncPreferences,
    remote: CloudSyncPreferences
  ): Promise<CloudSyncPreferences> {
    // Check if there's actually a conflict
    const localTime = new Date(local.lastModified).getTime();
    const remoteTime = new Date(remote.lastModified).getTime();
    
    // If times are very close (within 5 seconds), no conflict
    if (Math.abs(localTime - remoteTime) < 5000) {
      return localTime > remoteTime ? local : remote;
    }

    // Handle conflict based on resolution strategy
    switch (this.options.conflictResolution) {
      case 'local':
        return local;
      
      case 'remote':
        return remote;
      
      case 'merge':
        return this.mergePreferences(local, remote);
      
      case 'ask':
        this.updateStatus({ hasConflicts: true });
        // In a real app, this would show a UI for user to choose
        // For now, fall back to merge
        return this.mergePreferences(local, remote);
      
      default:
        return localTime > remoteTime ? local : remote;
    }
  }

  private mergePreferences(
    local: CloudSyncPreferences,
    remote: CloudSyncPreferences
  ): CloudSyncPreferences {
    // Use the most recent theme
    const useLocal = new Date(local.lastModified) > new Date(remote.lastModified);
    const basePrefs = useLocal ? local : remote;
    const otherPrefs = useLocal ? remote : local;
    
    // Merge personalization settings intelligently
    const mergedPersonalization: PersonalizationSettings = {
      ...otherPrefs.personalization,
      ...basePrefs.personalization,
      
      // Merge arrays by combining unique values
      colorPreferences: {
        ...otherPrefs.personalization.colorPreferences,
        ...basePrefs.personalization.colorPreferences,
        favoriteColors: Array.from(new Set([
          ...(otherPrefs.personalization.colorPreferences?.favoriteColors || []),
          ...(basePrefs.personalization.colorPreferences?.favoriteColors || [])
        ])),
        avoidColors: Array.from(new Set([
          ...(otherPrefs.personalization.colorPreferences?.avoidColors || []),
          ...(basePrefs.personalization.colorPreferences?.avoidColors || [])
        ]))
      }
    };
    
    return {
      ...basePrefs,
      personalization: mergedPersonalization,
      lastModified: new Date().toISOString(),
      version: Math.max(local.version, remote.version) + 1
    };
  }

  private createDefaultPreferences(): CloudSyncPreferences {
    return {
      theme: 'light',
      personalization: {
        theme: 'light',
        colorPreferences: {
          favoriteColors: [],
          avoidColors: [],
          colorblindFriendly: false,
          highContrastMode: false,
          saturationLevel: 100,
          brightnessLevel: 100,
          warmthLevel: 50
        },
        typographyPreferences: {
          preferredFontSize: 'medium',
          fontSizeScale: 1,
          preferredFontFamily: 'system',
          lineHeightPreference: 'comfortable',
          letterSpacingPreference: 'normal',
          fontWeight: 'normal',
          dyslexiaFriendly: false
        },
        motionPreferences: {
          enableAnimations: true,
          animationSpeed: 'normal',
          reduceMotion: false,
          preferCrossfade: false,
          enableParallax: true,
          enableHoverEffects: true,
          enableFocusAnimations: true
        },
        soundPreferences: {
          enableSounds: true,
          soundVolume: 70,
          soundTheme: 'default',
          customSounds: {},
          muteOnFocus: false,
          hapticFeedback: true,
          spatialAudio: false
        },
        layoutPreferences: {
          density: 'comfortable',
          navigation: 'sidebar',
          cardStyle: 'rounded',
          borderRadius: 8,
          showLabels: true,
          showIcons: true,
          iconSize: 'medium',
          gridColumns: 'auto',
          listSpacing: 'normal'
        },
        accessibilityPreferences: {
          screenReaderOptimized: false,
          keyboardNavigationOnly: false,
          highContrastMode: false,
          largeTargets: false,
          reducedTransparency: false,
          boldText: false,
          underlineLinks: false,
          flashingElementsReduced: true,
          colorOnlyIndicators: false,
          focusIndicatorStyle: 'default'
        },
        lastUpdated: new Date()
      },
      lastModified: new Date().toISOString(),
      deviceId: this.deviceId,
      version: 1
    };
  }

  private saveToCache(): void {
    if (!this.options.enableOfflineCache || !this.preferences) {
      return;
    }

    try {
      const cache = {
        preferences: this.preferences,
        pendingChanges: this.status.pendingChanges,
        timestamp: Date.now()
      };
      localStorage.setItem('cloud-sync-cache', JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  private loadFromCache(): void {
    if (!this.options.enableOfflineCache) {
      return;
    }

    try {
      const stored = localStorage.getItem('cloud-sync-cache');
      if (!stored) return;

      const cache = JSON.parse(stored);
      
      // Only load if cache is less than 24 hours old
      if (Date.now() - cache.timestamp < 24 * 60 * 60 * 1000) {
        this.preferences = cache.preferences;
        this.updateStatus({ pendingChanges: cache.pendingChanges || 0 });
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
  }

  // Auto-sync management
  private startAutoSync(): void {
    if (this.syncTimer || !this.options.autoSync) {
      return;
    }

    this.syncTimer = setInterval(() => {
      if (this.status.isOnline) {
        this.sync();
      }
    }, this.options.syncInterval);
  }

  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private restartAutoSync(): void {
    this.stopAutoSync();
    if (this.options.autoSync) {
      this.startAutoSync();
    }
  }

  // Authentication helpers
  private getAuthToken(): string | null {
    // Try multiple sources for auth token
    return (
      localStorage.getItem('auth_token') ||
      localStorage.getItem('supabase.auth.token') ||
      sessionStorage.getItem('auth_token') ||
      null
    );
  }

  isUserAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Cleanup
  dispose(): void {
    this.stopAutoSync();
    this.listeners.clear();
    this.saveToCache();
  }

  // Manual actions for UI
  async forceSync(): Promise<void> {
    await this.sync();
  }

  async clearRemoteData(): Promise<void> {
    const authToken = this.getAuthToken();
    if (!authToken) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/user/preferences`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Clear local preferences
      localStorage.removeItem('cloud-sync-preferences');
      localStorage.removeItem('cloud-sync-cache');
      
      this.preferences = null;
      this.updateStatus({ pendingChanges: 0, hasConflicts: false });
      
    } catch (error) {
      console.error('Error clearing remote data:', error);
      throw error;
    }
  }

  // Initialize the service
  async initialize(): Promise<void> {
    this.loadFromCache();
    
    if (this.status.isOnline && this.isUserAuthenticated()) {
      await this.sync();
    }
    
    if (this.options.autoSync) {
      this.startAutoSync();
    }
  }
}

export { CloudSyncStatus };
export default CloudSyncService;