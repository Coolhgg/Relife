import { audioManager } from './audio-manager';
import { lazyAudioLoader } from './lazy-audio-loader';
import type { Alarm, VoiceMood } from '../types';
import type { CustomSound } from './types/media';

export interface CriticalAsset {
  id: string;
  type: 'tts' | 'audio_file' | 'fallback_beep';
  alarmId: string;
  priority: number; // 1-10, higher = more critical
  preloadTime: Date; // When to preload
  triggerTime: Date; // When alarm triggers
  isLoaded: boolean;
  loadStarted: boolean;
  metadata: {
    voiceMood?: VoiceMood;
    soundId?: string;
    fileUrl?: string;
    size?: number;
    estimatedLoadTime?: number;
  };
}

export interface PreloadStrategy {
  name: string;
  description: string;
  preloadWindow: number; // minutes before alarm
  batchSize: number; // how many assets to preload at once
  retryAttempts: number;
  priorityThreshold: number; // minimum priority to preload
}

export interface PreloadStats {
  totalAssets: number;
  loadedAssets: number;
  failedAssets: number;
  successRate: number;
  averageLoadTime: number;
  cacheHitRate: number;
  memoryUsage: number; // bytes
  lastPreloadTime: Date | null;
}

export class CriticalAssetPreloader {
  private static instance: CriticalAssetPreloader | null = null;
  private criticalAssets: Map<string, CriticalAsset> = new Map();
  private preloadTimer: NodeJS.Timeout | null = null;
  private isPreloading = false;
  private strategy: PreloadStrategy;
  private stats: PreloadStats = {
    totalAssets: 0,
    loadedAssets: 0,
    failedAssets: 0,
    successRate: 0,
    averageLoadTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    lastPreloadTime: null,
  };

  static getInstance(): CriticalAssetPreloader {
    if (!CriticalAssetPreloader.instance) {
      CriticalAssetPreloader.instance = new CriticalAssetPreloader();
    }
    return CriticalAssetPreloader.instance;
  }

  private constructor() {
    this.strategy = {
      name: 'aggressive',
      description: 'Aggressive preloading for instant alarm response',
      preloadWindow: 15, // 15 minutes before alarm
      batchSize: 3,
      retryAttempts: 3,
      priorityThreshold: 5,
    };

    // Start monitoring cycle
    this.startMonitoring();
  }

  /**
   * Analyze alarms and identify critical assets that need preloading
   */
  async analyzeCriticalAssets(alarms: Alarm[]): Promise<CriticalAsset[]> {
    const now = new Date();
    const criticalAssets: CriticalAsset[] = [];

    for (const alarm of alarms) {
      if (!alarm.enabled) continue;

      const nextTrigger = this.calculateNextTrigger(alarm, now);
      const timeUntilTrigger = nextTrigger.getTime() - now.getTime();
      const minutesUntilTrigger = timeUntilTrigger / (1000 * 60);

      // Only consider alarms within the next 24 hours
      if (minutesUntilTrigger > 24 * 60 || minutesUntilTrigger < 0) continue;

      const priority = this.calculatePriority(minutesUntilTrigger, alarm);
      const preloadTime = new Date(
        nextTrigger.getTime() - this.strategy.preloadWindow * 60 * 1000
      );

      // TTS asset (always critical)
      const ttsAsset: CriticalAsset = {
        id: `tts_${alarm.id}`,
        type: 'tts',
        alarmId: alarm.id,
        priority: Math.max(priority, 8), // TTS always high priority
        preloadTime,
        triggerTime: nextTrigger,
        isLoaded: false,
        loadStarted: false,
        metadata: {
          voiceMood: alarm.voiceMood,
          estimatedLoadTime: 2000, // 2 seconds for TTS generation
        },
      };
      criticalAssets.push(ttsAsset);

      // Custom sound asset (if exists)
      const customSound = (alarm as any).customSound as CustomSound | undefined;
      if (customSound) {
        const audioAsset: CriticalAsset = {
          id: `audio_${alarm.id}`,
          type: 'audio_file',
          alarmId: alarm.id,
          priority,
          preloadTime,
          triggerTime: nextTrigger,
          isLoaded: false,
          loadStarted: false,
          metadata: {
            soundId: customSound.id,
            fileUrl: customSound.fileUrl,
            size: (customSound.duration * 128 * 1024) / 8, // Estimate size
            estimatedLoadTime: this.estimateLoadTime(customSound),
          },
        };
        criticalAssets.push(audioAsset);
      }

      // Fallback beep (always available, minimal priority)
      const fallbackAsset: CriticalAsset = {
        id: `fallback_${alarm.id}`,
        type: 'fallback_beep',
        alarmId: alarm.id,
        priority: 3,
        preloadTime: new Date(nextTrigger.getTime() - 1 * 60 * 1000), // 1 minute before
        triggerTime: nextTrigger,
        isLoaded: true, // Always available
        loadStarted: true,
        metadata: {
          estimatedLoadTime: 0, // Immediate
        },
      };
      criticalAssets.push(fallbackAsset);
    }

    // Sort by priority and trigger time
    criticalAssets.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.triggerTime.getTime() - b.triggerTime.getTime(); // Earlier trigger first
    });

    // Update internal tracking
    this.updateCriticalAssets(criticalAssets);

    return criticalAssets;
  }

  /**
   * Preload critical assets that are due for preloading
   */
  async preloadDueAssets(): Promise<void> {
    if (this.isPreloading) return;

    this.isPreloading = true;
    const now = new Date();
    const dueAssets = Array.from(this.criticalAssets.values())
      .filter(
        asset =>
          !asset.isLoaded &&
          !asset.loadStarted &&
          asset.preloadTime <= now &&
          asset.priority >= this.strategy.priorityThreshold
      )
      .slice(0, this.strategy.batchSize); // Limit batch size

    if (dueAssets.length === 0) {
      this.isPreloading = false;
      return;
    }

    console.log(`Preloading ${dueAssets.length} critical assets`);

    const loadPromises = dueAssets.map(asset => this.preloadAsset(asset));

    try {
      await Promise.allSettled(loadPromises);
      this.stats.lastPreloadTime = new Date();
    } catch (error) {
      console.error('Error in batch preloading:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Preload a specific critical asset
   */
  private async preloadAsset(asset: CriticalAsset): Promise<void> {
    asset.loadStarted = true;
    const startTime = performance.now();

    try {
      switch (asset.type) {
        case 'tts':
          await this.preloadTTSAsset(asset);
          break;
        case 'audio_file':
          await this.preloadAudioAsset(asset);
          break;
        case 'fallback_beep':
          // Already loaded
          break;
      }

      asset.isLoaded = true;
      this.stats.loadedAssets++;

      const loadTime = performance.now() - startTime;
      this.updateLoadTimeStats(loadTime);

      console.log(`Critical asset ${asset.id} preloaded in ${Math.round(loadTime)}ms`);
    } catch (error) {
      console.error(`Failed to preload critical asset ${asset.id}:`, error);
      this.stats.failedAssets++;

      // Retry with exponential backoff
      setTimeout(
        () => {
          if (!asset.isLoaded && asset.priority >= 8) {
            this.retryPreload(asset);
          }
        },
        Math.min(1000 * Math.pow(2, this.stats.failedAssets), 30000)
      );
    }
  }

  private async preloadTTSAsset(asset: CriticalAsset): Promise<void> {
    // Find the alarm to get the voice mood
    const alarm = await this.findAlarmById(asset.alarmId);
    if (!alarm) throw new Error(`Alarm ${asset.alarmId} not found`);

    // Use audioManager to preload TTS
    await audioManager.preloadCriticalAssets([alarm]);
  }

  private async preloadAudioAsset(asset: CriticalAsset): Promise<void> {
    if (!asset.metadata.fileUrl) {
      throw new Error('No file URL for audio asset');
    }

    // Use lazy loader with critical priority
    await lazyAudioLoader.loadAudioFile(asset.metadata.fileUrl, {
      priority: 'critical',
      progressive: false, // Load entirely for critical assets
      compression: 'none', // No compression for instant playback
      cacheKey: `critical_${asset.id}`,
      timeout: 10000, // 10 second timeout
    });
  }

  private async retryPreload(asset: CriticalAsset, attempt: number = 1): Promise<void> {
    if (attempt > this.strategy.retryAttempts) {
      console.error(`Max retry attempts reached for asset ${asset.id}`);
      return;
    }

    console.log(`Retrying preload for asset ${asset.id}, attempt ${attempt}`);

    try {
      await this.preloadAsset(asset);
    } catch (error) {
      setTimeout(
        () => {
          this.retryPreload(asset, attempt + 1);
        },
        Math.min(2000 * Math.pow(2, attempt), 30000)
      );
    }
  }

  /**
   * Emergency preload - load critical assets immediately for imminent alarms
   */
  async emergencyPreload(alarmIds: string[]): Promise<void> {
    console.log('EMERGENCY PRELOAD triggered for alarms:', alarmIds);

    const urgentAssets = Array.from(this.criticalAssets.values()).filter(
      asset => alarmIds.includes(asset.alarmId) && !asset.isLoaded
    );

    // Load all urgent assets in parallel
    const loadPromises = urgentAssets.map(asset => this.preloadAsset(asset));
    await Promise.allSettled(loadPromises);
  }

  /**
   * Verify that critical assets are ready for alarm trigger
   */
  async verifyCriticalAssets(alarmId: string): Promise<{
    ttsReady: boolean;
    audioReady: boolean;
    fallbackReady: boolean;
    overallReady: boolean;
  }> {
    const ttsAsset = this.criticalAssets.get(`tts_${alarmId}`);
    const audioAsset = this.criticalAssets.get(`audio_${alarmId}`);
    const fallbackAsset = this.criticalAssets.get(`fallback_${alarmId}`);

    const result = {
      ttsReady: ttsAsset?.isLoaded ?? false,
      audioReady: audioAsset?.isLoaded ?? true, // No audio asset means ready
      fallbackReady: fallbackAsset?.isLoaded ?? true,
      overallReady: false,
    };

    result.overallReady = result.ttsReady || result.audioReady || result.fallbackReady;

    if (!result.overallReady) {
      console.warn(
        `Critical assets not ready for alarm ${alarmId}, triggering emergency preload`
      );
      await this.emergencyPreload([alarmId]);

      // Re-check after emergency preload
      return this.verifyCriticalAssets(alarmId);
    }

    return result;
  }

  /**
   * Clean up expired assets to save memory
   */
  cleanupExpiredAssets(): void {
    const now = new Date();
    const expired: string[] = [];

    this.criticalAssets.forEach((asset, id) => {
      // Remove assets whose alarms have passed
      if (asset.triggerTime < now) {
        expired.push(id);
      }
    });

    expired.forEach(id => {
      this.criticalAssets.delete(id);
    });

    if (expired.length > 0) {
      console.log(`Cleaned up ${expired.length} expired critical assets`);
    }
  }

  /**
   * Get preloading statistics
   */
  getStats(): PreloadStats {
    const total = this.stats.loadedAssets + this.stats.failedAssets;
    this.stats.totalAssets = this.criticalAssets.size;
    this.stats.successRate = total > 0 ? this.stats.loadedAssets / total : 0;

    return { ...this.stats };
  }

  /**
   * Update preloading strategy
   */
  updateStrategy(strategy: Partial<PreloadStrategy>): void {
    this.strategy = { ...this.strategy, ...strategy };
    console.log('Updated preload strategy:', this.strategy);
  }

  /**
   * Get current critical assets status
   */
  getCriticalAssetsStatus(): Array<{
    id: string;
    type: string;
    alarmId: string;
    priority: number;
    isLoaded: boolean;
    timeUntilTrigger: number; // minutes
    timeUntilPreload: number; // minutes
  }> {
    const now = new Date();

    return Array.from(this.criticalAssets.values()).map(asset => ({
      id: asset.id,
      type: asset.type,
      alarmId: asset.alarmId,
      priority: asset.priority,
      isLoaded: asset.isLoaded,
      timeUntilTrigger: (asset.triggerTime.getTime() - now.getTime()) / (1000 * 60),
      timeUntilPreload: (asset.preloadTime.getTime() - now.getTime()) / (1000 * 60),
    }));
  }

  private startMonitoring(): void {
    // Check every minute for due preloads
    this.preloadTimer = setInterval(async () => {
      try {
        await this.preloadDueAssets();
        this.cleanupExpiredAssets();
      } catch (error) {
        console.error('Error in preload monitoring:', error);
      }
    }, 60000); // 1 minute interval
  }

  private updateCriticalAssets(assets: CriticalAsset[]): void {
    // Clear existing assets
    this.criticalAssets.clear();

    // Add new assets
    assets.forEach(asset => {
      this.criticalAssets.set(asset.id, asset);
    });
  }

  private calculateNextTrigger(alarm: Alarm, from: Date): Date {
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const nextTrigger = new Date(from);

    // Start with today
    nextTrigger.setHours(hours, minutes, 0, 0);

    // If the time has passed today, move to tomorrow
    if (nextTrigger <= from) {
      nextTrigger.setDate(nextTrigger.getDate() + 1);
    }

    // Find the next day that matches the alarm's day schedule
    while (true) {
      const dayOfWeek = nextTrigger.getDay();
      if (alarm.days.includes(dayOfWeek)) {
        break;
      }
      nextTrigger.setDate(nextTrigger.getDate() + 1);
    }

    return nextTrigger;
  }

  private calculatePriority(minutesUntilTrigger: number, alarm: Alarm): number {
    // Base priority on time until trigger
    let priority = 5; // Default

    if (minutesUntilTrigger <= 15) {
      priority = 10; // Extremely critical
    } else if (minutesUntilTrigger <= 60) {
      priority = 9; // Very critical
    } else if (minutesUntilTrigger <= 240) {
      // 4 hours
      priority = 7; // High
    } else if (minutesUntilTrigger <= 720) {
      // 12 hours
      priority = 6; // Medium-high
    }

    // Adjust based on alarm properties
    if (alarm.snoozeCount > 0) {
      priority -= 1; // Lower priority for snoozed alarms
    }

    // TODO: Consider user's sleep patterns, importance ratings, etc.

    return Math.max(1, Math.min(10, priority));
  }

  private estimateLoadTime(sound: CustomSound): number {
    // Estimate based on file size and network conditions
    const estimatedSize = (sound.duration * 128 * 1024) / 8; // 128 kbps
    const estimatedSpeed = 500 * 1024; // 500 KB/s (conservative estimate)
    return (estimatedSize / estimatedSpeed) * 1000; // Convert to milliseconds
  }

  private updateLoadTimeStats(loadTime: number): void {
    // Simple moving average of last 10 load times
    // In a real implementation, this would be more sophisticated
    this.stats.averageLoadTime = this.stats.averageLoadTime * 0.9 + loadTime * 0.1;
  }

  private async findAlarmById(alarmId: string): Promise<Alarm | null> {
    // This would typically interface with your alarm storage service
    // For now, we'll return null and handle in the calling code
    return null;
  }

  destroy(): void {
    if (this.preloadTimer) {
      clearInterval(this.preloadTimer);
      this.preloadTimer = null;
    }
    this.criticalAssets.clear();
  }
}

// Export singleton
export const criticalPreloader = CriticalAssetPreloader.getInstance();
