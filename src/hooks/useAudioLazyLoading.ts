import { useState, useEffect, useCallback, useRef } from 'react';
import { lazyAudioLoader } from '../services/lazy-audio-loader';
import type { AudioLoadProgress, AudioCacheEntry } from '../services/audio-manager';
import type { CustomSound, Playlist, LoadingState } from '../services/types/media';

export interface AudioLoadingState {
  state: LoadingState;
  progress: number;
  error: string | null;
  entry: AudioCacheEntry | null;
  speed?: number;
  estimatedTimeRemaining?: number;
}

/**
 * Hook for lazy loading individual audio files
 */
export function useAudioLazyLoading(
  sound: CustomSound | null,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): AudioLoadingState {
  const [state, setState] = useState<AudioLoadingState>({
    state: 'idle',
    progress: 0,
    error: null,
    entry: null
  });

  const loadSound = useCallback(async () => {
    if (!sound) return;

    setState(prev => ({ ...prev, state: 'loading', error: null }));

    try {
      const entry = await lazyAudioLoader.queueSound(sound, priority, {
        onProgress: (progress: AudioLoadProgress) => {
          setState(prev => ({
            ...prev,
            progress: progress.percentage,
            speed: progress.speed,
            estimatedTimeRemaining: progress.estimatedTimeRemaining
          }));
        },
        onComplete: (entry: AudioCacheEntry) => {
          setState(prev => ({
            ...prev,
            state: 'loaded',
            progress: 100,
            entry
          }));
        },
        onError: (error: Error) => {
          setState(prev => ({
            ...prev,
            state: 'error',
            error: error.message
          }));
        }
      });

      // If promise resolves immediately (cached), update state
      setState(prev => ({
        ...prev,
        state: 'loaded',
        progress: 100,
        entry
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        state: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [sound, priority]);

  useEffect(() => {
    if (sound) {
      loadSound();
    } else {
      setState({
        state: 'idle',
        progress: 0,
        error: null,
        entry: null
      });
    }
  }, [sound, loadSound]);

  return state;
}

/**
 * Hook for lazy loading playlists
 */
export function usePlaylistLazyLoading(
  playlist: Playlist | null,
  priority: 'low' | 'medium' | 'high' = 'medium'
): {
  overallState: LoadingState;
  overallProgress: number;
  soundStates: Map<string, AudioLoadingState>;
  loadedSounds: AudioCacheEntry[];
  errors: Array<{ soundId: string; error: string }>;
} {
  const [overallState, setOverallState] = useState<LoadingState>('idle');
  const [overallProgress, setOverallProgress] = useState(0);
  const [soundStates, setSoundStates] = useState<Map<string, AudioLoadingState>>(new Map());
  const [loadedSounds, setLoadedSounds] = useState<AudioCacheEntry[]>([]);
  const [errors, setErrors] = useState<Array<{ soundId: string; error: string }>>([]);

  const loadPlaylist = useCallback(async () => {
    if (!playlist || playlist.sounds.length === 0) return;

    setOverallState('loading');
    setErrors([]);
    
    const newSoundStates = new Map<string, AudioLoadingState>();
    playlist.sounds.forEach(playlistSound => {
      newSoundStates.set(playlistSound.soundId, {
        state: 'idle',
        progress: 0,
        error: null,
        entry: null
      });
    });
    setSoundStates(new Map(newSoundStates));

    try {
      const entries = await lazyAudioLoader.queuePlaylist(playlist, priority);
      setLoadedSounds(entries);
      setOverallState('loaded');
      setOverallProgress(100);
    } catch (error) {
      setOverallState('error');
      setErrors(prev => [...prev, { 
        soundId: 'playlist', 
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
  }, [playlist, priority]);

  useEffect(() => {
    if (playlist) {
      loadPlaylist();
    } else {
      setOverallState('idle');
      setOverallProgress(0);
      setSoundStates(new Map());
      setLoadedSounds([]);
      setErrors([]);
    }
  }, [playlist, loadPlaylist]);

  // Update overall progress based on individual sound progress
  useEffect(() => {
    if (soundStates.size > 0) {
      const totalProgress = Array.from(soundStates.values())
        .reduce((sum, state) => sum + state.progress, 0);
      const avgProgress = totalProgress / soundStates.size;
      setOverallProgress(avgProgress);
    }
  }, [soundStates]);

  return {
    overallState,
    overallProgress,
    soundStates,
    loadedSounds,
    errors
  };
}

/**
 * Hook for preloading alarm sounds based on schedule
 */
export function useAlarmSoundPreloading(alarms: any[]) {
  const [preloadingStatus, setPreloadingStatus] = useState<{
    isPreloading: boolean;
    preloadedCount: number;
    totalToPreload: number;
    errors: string[];
  }>({
    isPreloading: false,
    preloadedCount: 0,
    totalToPreload: 0,
    errors: []
  });

  const preloadAlarmSounds = useCallback(async () => {
    const alarmsWithSounds = alarms.filter(alarm => alarm.enabled && alarm.customSound);
    
    if (alarmsWithSounds.length === 0) return;

    setPreloadingStatus({
      isPreloading: true,
      preloadedCount: 0,
      totalToPreload: alarmsWithSounds.length,
      errors: []
    });

    try {
      await lazyAudioLoader.queueAlarmSounds(alarms);
      
      setPreloadingStatus(prev => ({
        ...prev,
        isPreloading: false,
        preloadedCount: alarmsWithSounds.length
      }));
    } catch (error) {
      setPreloadingStatus(prev => ({
        ...prev,
        isPreloading: false,
        errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error']
      }));
    }
  }, [alarms]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      preloadAlarmSounds();
    }, 1000); // Delay to avoid excessive API calls

    return () => clearTimeout(timeoutId);
  }, [preloadAlarmSounds]);

  return preloadingStatus;
}

/**
 * Hook for monitoring lazy loading statistics
 */
export function useLazyLoadingStats() {
  const [stats, setStats] = useState(lazyAudioLoader.getStats());
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStats(lazyAudioLoader.getStats());
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return stats;
}

/**
 * Hook for controlling lazy loading behavior
 */
export function useLazyLoadingControl() {
  const [isPaused, setIsPaused] = useState(false);
  
  const pauseLoading = useCallback(() => {
    lazyAudioLoader.pauseLoading();
    setIsPaused(true);
  }, []);

  const resumeLoading = useCallback(() => {
    lazyAudioLoader.resumeLoading();
    setIsPaused(false);
  }, []);

  const clearQueue = useCallback(() => {
    lazyAudioLoader.clearQueue();
  }, []);

  const getQueueStatus = useCallback(() => {
    return lazyAudioLoader.getQueueStatus();
  }, []);

  return {
    isPaused,
    pauseLoading,
    resumeLoading,
    clearQueue,
    getQueueStatus
  };
}

/**
 * Hook for smart preloading based on user behavior
 */
export function useSmartPreloading(
  userPreferences: {
    favoriteCategories?: string[];
    recentlyPlayed?: string[];
    playlistHistory?: string[];
  } = {}
) {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadedCount, setPreloadedCount] = useState(0);

  const startSmartPreload = useCallback(async (options: {
    networkSpeed?: 'slow' | 'medium' | 'fast';
    storageLimit?: number;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  } = {}) => {
    setIsPreloading(true);
    setPreloadedCount(0);

    try {
      await lazyAudioLoader.smartPreload({
        userHabits: userPreferences,
        ...options
      });
      
      // This would be updated by actual preload progress in a real implementation
      setPreloadedCount(5); // Mock number
    } catch (error) {
      console.error('Smart preloading failed:', error);
    } finally {
      setIsPreloading(false);
    }
  }, [userPreferences]);

  return {
    isPreloading,
    preloadedCount,
    startSmartPreload
  };
}