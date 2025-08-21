/**
 * React Hook for Sound Effects
 * Provides easy access to sound effects throughout the React app
 */

import React, { useCallback, useEffect, useState } from 'react';
import { soundEffectsService, type SoundEffectId, type SoundEffectSettings, type SoundTheme } from '../services/sound-effects';

export interface SoundEffectHandlers {
  playClick: () => void;
  playHover: () => void;
  playSuccess: () => void;
  playError: () => void;
  playNotification: () => void;
  playAlarmNotification: () => void;
  playBeep: () => void;
}

export interface SoundEffectControls {
  playSound: (soundId: SoundEffectId, options?: {
    volume?: number;
    loop?: boolean;
    fadeIn?: number;
    fadeOut?: number;
    force?: boolean;
  }) => Promise<AudioBufferSourceNode | null>;
  stopSound: (soundId: SoundEffectId) => void;
  stopAllSounds: () => void;
  testSound: (soundId: SoundEffectId) => Promise<boolean>;
  settings: SoundEffectSettings;
  updateSettings: (newSettings: Partial<SoundEffectSettings>) => Promise<void>;
  setSoundTheme: (theme: SoundTheme) => Promise<void>;
  getSoundTheme: () => SoundTheme;
  getAvailableThemes: () => Array<{ id: SoundTheme; name: string; description: string }>;
  previewTheme: (theme: SoundTheme) => Promise<void>;
  isInitialized: boolean;
}

export function useSoundEffects(): SoundEffectControls & SoundEffectHandlers {
  const [settings, setSettings] = useState<SoundEffectSettings>(soundEffectsService.getSettings());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize sound effects service
  useEffect(() => {
    let mounted = true;

    const initializeSounds = async () => {
      try {
        await soundEffectsService.initialize();
        if (mounted) {
          setSettings(soundEffectsService.getSettings());
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing sound effects:', error);
      }
    };

    initializeSounds();

    return () => {
      mounted = false;
    };
  }, []);

  // Sound effect handlers
  const playClick = useCallback(() => {
    soundEffectsService.playUISound('click');
  }, []);

  const playHover = useCallback(() => {
    soundEffectsService.playUISound('hover');
  }, []);

  const playSuccess = useCallback(() => {
    soundEffectsService.playUISound('success');
  }, []);

  const playError = useCallback(() => {
    soundEffectsService.playUISound('error');
  }, []);

  const playNotification = useCallback(() => {
    soundEffectsService.playNotificationSound('default');
  }, []);

  const playAlarmNotification = useCallback(() => {
    soundEffectsService.playNotificationSound('alarm');
  }, []);

  const playBeep = useCallback(() => {
    soundEffectsService.playNotificationSound('beep');
  }, []);

  // Control methods
  const playSound = useCallback(async (soundId: SoundEffectId, options?: {
    volume?: number;
    loop?: boolean;
    fadeIn?: number;
    fadeOut?: number;
    force?: boolean;
  }) => {
    return await soundEffectsService.playSound(soundId, options);
  }, []);

  const stopSound = useCallback((soundId: SoundEffectId) => {
    soundEffectsService.stopSound(soundId);
  }, []);

  const stopAllSounds = useCallback(() => {
    soundEffectsService.stopAllSounds();
  }, []);

  const testSound = useCallback(async (soundId: SoundEffectId) => {
    return await soundEffectsService.testSound(soundId);
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<SoundEffectSettings>) => {
    await soundEffectsService.updateSettings(newSettings);
    setSettings(soundEffectsService.getSettings());
  }, []);

  // Theme management methods
  const setSoundTheme = useCallback(async (theme: SoundTheme) => {
    await soundEffectsService.setSoundTheme(theme);
    setSettings(soundEffectsService.getSettings());
  }, []);

  const getSoundTheme = useCallback(() => {
    return soundEffectsService.getSoundTheme();
  }, []);

  const getAvailableThemes = useCallback(() => {
    return soundEffectsService.getAvailableThemes();
  }, []);

  const previewTheme = useCallback(async (theme: SoundTheme) => {
    await soundEffectsService.previewTheme(theme);
  }, []);

  return {
    // Handlers
    playClick,
    playHover,
    playSuccess,
    playError,
    playNotification,
    playAlarmNotification,
    playBeep,
    // Controls
    playSound,
    stopSound,
    stopAllSounds,
    testSound,
    settings,
    updateSettings,
    // Theme controls
    setSoundTheme,
    getSoundTheme,
    getAvailableThemes,
    previewTheme,
    isInitialized,
  };
}

// Specialized hooks for different use cases
export function useUISound() {
  const { playClick, playHover, playSuccess, playError, settings } = useSoundEffects();

  const createClickHandler = useCallback((originalHandler?: () => void) => {
    return () => {
      if (settings.uiSoundsEnabled) {
        playClick();
      }
      originalHandler?.();
    };
  }, [playClick, settings.uiSoundsEnabled]);

  const createHoverHandler = useCallback((originalHandler?: () => void) => {
    return () => {
      if (settings.uiSoundsEnabled) {
        playHover();
      }
      originalHandler?.();
    };
  }, [playHover, settings.uiSoundsEnabled]);

  const createSuccessHandler = useCallback((originalHandler?: () => void) => {
    return () => {
      if (settings.uiSoundsEnabled) {
        playSuccess();
      }
      originalHandler?.();
    };
  }, [playSuccess, settings.uiSoundsEnabled]);

  const createErrorHandler = useCallback((originalHandler?: () => void) => {
    return () => {
      if (settings.uiSoundsEnabled) {
        playError();
      }
      originalHandler?.();
    };
  }, [playError, settings.uiSoundsEnabled]);

  return {
    playClick,
    playHover,
    playSuccess,
    playError,
    createClickHandler,
    createHoverHandler,
    createSuccessHandler,
    createErrorHandler,
    soundsEnabled: settings.uiSoundsEnabled,
  };
}

export function useNotificationSounds() {
  const { playNotification, playAlarmNotification, playBeep, settings, playSound } = useSoundEffects();

  const playCustomNotification = useCallback(async (type: 'default' | 'alarm' | 'beep' = 'default') => {
    if (!settings.notificationSoundsEnabled) return;

    switch (type) {
      case 'alarm':
        return playAlarmNotification();
      case 'beep':
        return playBeep();
      default:
        return playNotification();
    }
  }, [playNotification, playAlarmNotification, playBeep, settings.notificationSoundsEnabled]);

  return {
    playNotification,
    playAlarmNotification,
    playBeep,
    playCustomNotification,
    soundsEnabled: settings.notificationSoundsEnabled,
  };
}

export function useAlarmSounds() {
  const { playSound, stopSound, settings } = useSoundEffects();

  const playAlarmSound = useCallback(async (
    soundType: 'gentle_bells' | 'morning_birds' | 'classic_beep' | 'ocean_waves' | 'energetic_beep',
    options: { volume?: number; fadeIn?: number } = {}
  ) => {
    if (!settings.alarmSoundsEnabled) return null;

    const soundId = `alarm.${soundType}` as SoundEffectId;
    return await playSound(soundId, {
      loop: true,
      fadeIn: 1,
      ...options,
    });
  }, [playSound, settings.alarmSoundsEnabled]);

  const stopAlarmSound = useCallback((
    soundType: 'gentle_bells' | 'morning_birds' | 'classic_beep' | 'ocean_waves' | 'energetic_beep'
  ) => {
    const soundId = `alarm.${soundType}` as SoundEffectId;
    stopSound(soundId);
  }, [stopSound]);

  return {
    playAlarmSound,
    stopAlarmSound,
    soundsEnabled: settings.alarmSoundsEnabled,
  };
}

// HOC for adding sound effects to components
export function withSoundEffects<T extends object>(
  Component: React.ComponentType<T>,
  soundType: 'click' | 'hover' | 'success' | 'error' = 'click'
) {
  return React.forwardRef<any, T>((props: T, ref) => {
    const { createClickHandler, createHoverHandler, createSuccessHandler, createErrorHandler } = useUISound();

    const getSoundHandler = () => {
      switch (soundType) {
        case 'hover': return createHoverHandler;
        case 'success': return createSuccessHandler;
        case 'error': return createErrorHandler;
        default: return createClickHandler;
      }
    };

    const soundHandler = getSoundHandler();
    const enhancedProps = {
      ...props,
      onClick: soundHandler((props as any).onClick),
      ref,
    };

    return <Component {...enhancedProps} />;
  });
}

export default useSoundEffects;