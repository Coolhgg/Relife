import { audioManager, AudioManager } from './audio-manager';
import type { AudioLoadProgress, AudioCacheEntry } from './audio-manager';
import type { CustomSound, Playlist, AudioLoadOptions } from './types/media';
import { TimeoutHandle } from '../types/timers';

export interface LazyLoadQueueItem {
  id: string;
  url: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  options: AudioLoadOptions;
  callbacks: {
    onProgress?: (progress: AudioLoadProgress
) => void;
    onComplete?: (entry: AudioCacheEntry
) => void;
    onError?: (error: Error
) => void;
  };
}

export interface LazyLoadStats {
  queueSize: number;
  activeLoads: number;
  completedLoads: number;
  failedLoads: number;
  totalBytesLoaded: number;
  averageLoadTime: number;
  cacheHitRate: number;
}

export class LazyAudioLoader {
  private static instance: LazyAudioLoader | null = null;
  private loadQueue: LazyLoadQueueItem[] = [];
  private activeLoads: Map<string, Promise<AudioCacheEntry>> = new Map();
  private maxConcurrentLoads = 3;
  private stats: LazyLoadStats = {
    queueSize: 0,
    activeLoads: 0,
    completedLoads: 0,
    failedLoads: 0,
    totalBytesLoaded: 0,
    averageLoadTime: 0,
    cacheHitRate: 0,
  };
  private loadTimes: number[] = [];
  private cacheHits = 0;
  private totalRequests = 0;

  static getInstance(): LazyAudioLoader {
    if (!LazyAudioLoader.instance) {
      LazyAudioLoader.instance = new LazyAudioLoader();
    }
    return LazyAudioLoader.instance;
  }

  private constructor() {
    // Start processing queue
    this.processQueue();
  }

  /**
   * Add a sound to the lazy loading queue
   */
  async queueSound(
    sound: CustomSound,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    callbacks?: {
      onProgress?: (progress: AudioLoadProgress
) => void;
      onComplete?: (entry: AudioCacheEntry
) => void;
      onError?: (error: Error
) => void;
    }
  ): Promise<AudioCacheEntry> {
    const id = `sound_${sound.id}`;

    // Check if already cached
    const cached = audioManager.getCacheStats();
    if (cached.totalEntries > 0) {
      try {
        const existing = await audioManager.loadAudioFile(sound.fileUrl, {
          cacheKey: id,
          priority: 'low', // Don't re-download, just check cache
        });
        this.cacheHits++;
        this.totalRequests++;
        callbacks?.onComplete?.(existing);
        return existing;
      } catch (error) {
        // Not cached, continue with queuing
      }
    }

    return new Promise((resolve, reject
) => {
      const queueItem: LazyLoadQueueItem = {
        id,
        url: sound.fileUrl,
        priority,
        options: {
          priority,
          progressive: true,
          compression: this.getCompressionLevel(sound),
          cacheKey: id,
          maxSize: 10 * 1024 * 1024, // 10MB max
          timeout: 30000, // 30 second timeout
        },
        callbacks: {
          ...callbacks,
          onComplete: entry => {
            callbacks?.onComplete?.(entry);
            resolve(entry);
          },
          onError: error => {
            callbacks?.onError?.(error);
            reject(error);
          },
        },
      };

      this.addToQueue(queueItem);
      this.totalRequests++;
    });
  }

  /**
   * Queue an entire playlist for lazy loading
   */
  async queuePlaylist(
    playlist: Playlist,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<AudioCacheEntry[]> {
    const promises = playlist.sounds
      .sort((a, b
) => a.order - b.order) // Load in play order
      .map((playlistSound, index
) => {
        // First few sounds get higher priority
        const adjustedPriority = index < 3 ? 'high' : priority;

        return this.queueSound(playlistSound.sound, adjustedPriority);
      });

    return Promise.allSettled(promises).then(results => {
      return results
        .filter(
          (result): result is PromiseFulfilledResult<AudioCacheEntry> =>
            result.status === 'fulfilled'
        )
        .map(result => result.value);
    });
  }

  /**
   * Queue sounds based on user's alarm schedule
   */
  async queueAlarmSounds(alarms: any[]): Promise<void> {
    const now = new Date();

    // Sort alarms by proximity to current time
    const sortedAlarms = alarms
      .filter(alarm => alarm.enabled && alarm.customSound)
      .sort((a, b
) => {
        const timeA = this.getNextAlarmTime(a.time, a.days);
        const timeB = this.getNextAlarmTime(b.time, b.days);
        return timeA.getTime() - timeB.getTime();
      });

    for (const alarm of sortedAlarms) {
      const nextAlarm = this.getNextAlarmTime(alarm.time, alarm.days);
      const timeUntilAlarm = nextAlarm.getTime() - now.getTime();
      const hoursUntilAlarm = timeUntilAlarm / (1000 * 60 * 60);

      let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (hoursUntilAlarm <= 1) {
        priority = 'critical';
      } else if (hoursUntilAlarm <= 4) {
        priority = 'high';
      } else if (hoursUntilAlarm <= 12) {
        priority = 'medium';
      }

      try {
        await this.queueSound(alarm.customSound, priority);
      } catch (error) {
        console.warn(`Failed to queue sound for alarm ${alarm.id}:`, error);
      }
    }
  }

  /**
   * Smart preloading based on user behavior and patterns
   */
  async smartPreload(
    options: {
      userHabits?: {
        favoriteCategories: string[];
        recentlyPlayed: string[];
        playlistHistory: string[];
      };
      networkSpeed?: 'slow' | 'medium' | 'fast';
      storageLimit?: number; // bytes
      timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    } = {}
  ): Promise<void> {
    const { networkSpeed = 'medium', storageLimit = 50 * 1024 * 1024 } = options;

    // Adjust concurrent loads based on network speed
    switch (networkSpeed) {
      case 'slow':
        this.maxConcurrentLoads = 1;
        break;
      case 'medium':
        this.maxConcurrentLoads = 3;
        break;
      case 'fast':
        this.maxConcurrentLoads = 5;
        break;
    }

    // Check current storage usage
    const cacheStats = audioManager.getCacheStats();
    if (cacheStats.totalSize >= storageLimit) {
      console.log('Storage limit reached, skipping smart preload');
      return;
    }

    // TODO: Implement ML-based smart preloading based on user patterns
    // For now, implement basic heuristics

    if (options.userHabits?.favoriteCategories) {
      // Preload sounds from favorite categories
      console.log(
        'Smart preloading based on favorite categories:',
        options.userHabits.favoriteCategories
      );
    }
  }

  /**
   * Pause all loading (useful for low battery or poor network)
   */
  pauseLoading(): void {
    // This would pause active downloads in a real implementation
    console.log('Lazy loading paused');
  }

  /**
   * Resume loading
   */
  resumeLoading(): void {
    console.log('Lazy loading resumed');
    this.processQueue();
  }

  /**
   * Clear the loading queue
   */
  clearQueue(): void {
    this.loadQueue = [];
    this.stats.queueSize = 0;
  }

  /**
   * Get loading statistics
   */
  getStats(): LazyLoadStats {
    this.stats.queueSize = this.loadQueue.length;
    this.stats.activeLoads = this.activeLoads.size;
    this.stats.cacheHitRate =
      this.totalRequests > 0 ? this.cacheHits / this.totalRequests : 0;
    this.stats.averageLoadTime =
      this.loadTimes.length > 0
        ? this.loadTimes.reduce((sum, time
) => sum + time, 0) / this.loadTimes.length
        : 0;

    return { ...this.stats };
  }

  /**
   * Get queue status for debugging
   */
  getQueueStatus(): {
    queue: Array<{ id: string; priority: string; url: string }>;
    active: string[];
  } {
    return {
      queue: this.loadQueue.map(item => ({
        id: item.id,
        priority: item.priority,
        url: item.url,
      })),
      active: Array.from(this.activeLoads.keys()),
    };
  }

  private addToQueue(item: LazyLoadQueueItem): void {
    // Remove existing item with same ID
    this.loadQueue = this.loadQueue.filter(existing => existing.id !== item.id);

    // Insert based on priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const insertIndex = this.loadQueue.findIndex(
      existing => priorityOrder[item.priority] < priorityOrder[existing.priority]
    );

    if (insertIndex === -1) {
      this.loadQueue.push(item);
    } else {
      this.loadQueue.splice(insertIndex, 0, item);
    }

    this.stats.queueSize = this.loadQueue.length;
  }

  private async processQueue(): Promise<void> {
    if (
      this.activeLoads.size >= this.maxConcurrentLoads ||
      this.loadQueue.length === 0
    ) {
      // Check again in 1 second
      setTimeout((
) => this.processQueue(), 1000);
      return;
    }

    const item = this.loadQueue.shift();
    if (!item) {
      setTimeout((
) => this.processQueue(), 1000);
      return;
    }

    const startTime = performance.now();
    const loadPromise = this.loadAudioItem(item);
    this.activeLoads.set(item.id, loadPromise);

    try {
      const result = await loadPromise;
      const loadTime = performance.now() - startTime;

      this.loadTimes.push(loadTime);
      // Keep only last 100 load times for average calculation
      if (this.loadTimes.length > 100) {
        this.loadTimes.shift();
      }

      this.stats.completedLoads++;
      this.stats.totalBytesLoaded += result.metadata.size || 0;

      item.callbacks.onComplete?.(result);
    } catch (error) {
      this.stats.failedLoads++;
      item.callbacks.onError?.(error as Error);
    } finally {
      this.activeLoads.delete(item.id);
    }

    // Continue processing queue
    setTimeout((
) => this.processQueue(), 100);
  }

  private async loadAudioItem(item: LazyLoadQueueItem): Promise<AudioCacheEntry> {
    return await audioManager.loadAudioFile(item.url, {
      ...item.options,
      onProgress: item.callbacks.onProgress,
    });
  }

  private getCompressionLevel(
    sound: CustomSound
  ): 'none' | 'light' | 'medium' | 'heavy' {
    // Auto-select compression based on file size and type
    const size = (sound.duration * 128 * 1024) / 8; // Estimate size (128kbps MP3)

    if (size < 1024 * 1024) {
      // < 1MB
      return 'none';
    } else if (size < 5 * 1024 * 1024) {
      // < 5MB
      return 'light';
    } else if (size < 10 * 1024 * 1024) {
      // < 10MB
      return 'medium';
    } else {
      return 'heavy';
    }
  }

  private getNextAlarmTime(timeString: string, days: number[]): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const today = now.getDay();

    // Find next occurrence
    for (let i = 0; i < 7; i++) {
      const checkDay = (today + i) % 7;
      if (days.includes(checkDay)) {
        const alarmDate = new Date(now);
        alarmDate.setDate(now.getDate() + i);
        alarmDate.setHours(hours, minutes, 0, 0);

        if (i === 0 && alarmDate <= now) {
          continue; // Today's alarm has passed
        }

        return alarmDate;
      }
    }

    // Fallback to next occurrence of first day in array
    const nextDay = days[0];
    const daysUntilNext = (nextDay - today + 7) % 7;
    const nextAlarm = new Date(now);
    nextAlarm.setDate(now.getDate() + daysUntilNext);
    nextAlarm.setHours(hours, minutes, 0, 0);

    return nextAlarm;
  }
}

// Export singleton
export const lazyAudioLoader = LazyAudioLoader.getInstance();
