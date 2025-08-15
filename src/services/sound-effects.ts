/**
 * Sound Effects Service
 * Manages all sound effects throughout the application including UI sounds,
 * notification sounds, and provides an easy-to-use interface for playing sounds
 */

import { AudioManager } from './audio-manager';
import OfflineStorage from './offline-storage';

export interface SoundEffectConfig {
  id: string;
  name: string;
  url: string;
  volume?: number;
  category: 'ui' | 'notification' | 'alarm' | 'ambient';
  preload?: boolean;
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

export type SoundTheme = 'default' | 'nature' | 'electronic' | 'retro';

export interface SoundEffectSettings {
  uiSoundsEnabled: boolean;
  notificationSoundsEnabled: boolean;
  alarmSoundsEnabled: boolean;
  ambientSoundsEnabled: boolean;
  masterVolume: number;
  uiVolume: number;
  notificationVolume: number;
  alarmVolume: number;
  ambientVolume: number;
  soundTheme: SoundTheme;
}

export type SoundEffectId = 
  | 'ui.click'
  | 'ui.hover'
  | 'ui.success'
  | 'ui.error'
  | 'notification.default'
  | 'notification.alarm'
  | 'notification.beep'
  | 'alarm.gentle_bells'
  | 'alarm.morning_birds'
  | 'alarm.classic_beep'
  | 'alarm.ocean_waves'
  | 'alarm.energetic_beep';

class SoundEffectsService {
  private static instance: SoundEffectsService | null = null;
  private audioManager: AudioManager;
  private settings: SoundEffectSettings;
  private soundEffects: Map<string, SoundEffectConfig>;
  private loadedSounds: Map<string, AudioBufferSourceNode | null>;
  private isInitialized = false;

  private constructor() {
    this.audioManager = AudioManager.getInstance();
    this.loadedSounds = new Map();
    this.settings = this.getDefaultSettings();
    this.soundEffects = new Map();
    this.initializeSoundEffects();
  }

  static getInstance(): SoundEffectsService {
    if (!SoundEffectsService.instance) {
      SoundEffectsService.instance = new SoundEffectsService();
    }
    return SoundEffectsService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize audio manager
      await this.audioManager.initialize();

      // Load settings from storage
      await this.loadSettings();

      // Preload critical UI sounds
      await this.preloadCriticalSounds();

      this.isInitialized = true;
      console.log('SoundEffectsService initialized successfully');
    } catch (error) {
      console.error('Error initializing SoundEffectsService:', error);
    }
  }

  private getDefaultSettings(): SoundEffectSettings {
    return {
      uiSoundsEnabled: true,
      notificationSoundsEnabled: true,
      alarmSoundsEnabled: true,
      ambientSoundsEnabled: true,
      masterVolume: 0.7,
      uiVolume: 0.5,
      notificationVolume: 0.8,
      alarmVolume: 1.0,
      ambientVolume: 0.6,
      soundTheme: 'default',
    };
  }

  private initializeSoundEffects(): void {
    // UI Sound Effects
    this.soundEffects.set('ui.click', {
      id: 'ui.click',
      name: 'Click Sound',
      url: this.getSoundUrl('ui', 'click.wav'),
      volume: 0.3,
      category: 'ui',
      preload: true,
    });

    this.soundEffects.set('ui.hover', {
      id: 'ui.hover',
      name: 'Hover Sound',
      url: this.getSoundUrl('ui', 'hover.wav'),
      volume: 0.2,
      category: 'ui',
      preload: true,
    });

    this.soundEffects.set('ui.success', {
      id: 'ui.success',
      name: 'Success Sound',
      url: this.getSoundUrl('ui', 'success.wav'),
      volume: 0.4,
      category: 'ui',
      preload: true,
    });

    this.soundEffects.set('ui.error', {
      id: 'ui.error',
      name: 'Error Sound',
      url: this.getSoundUrl('ui', 'error.wav'),
      volume: 0.5,
      category: 'ui',
      preload: true,
    });

    // Notification Sound Effects
    this.soundEffects.set('notification.default', {
      id: 'notification.default',
      name: 'Notification',
      url: this.getSoundUrl('notifications', 'notification.wav'),
      volume: 0.6,
      category: 'notification',
      preload: true,
    });

    this.soundEffects.set('notification.alarm', {
      id: 'notification.alarm',
      name: 'Alarm Notification',
      url: this.getSoundUrl('notifications', 'alarm.wav'),
      volume: 0.8,
      category: 'notification',
      preload: true,
    });

    this.soundEffects.set('notification.beep', {
      id: 'notification.beep',
      name: 'Beep Notification',
      url: this.getSoundUrl('notifications', 'beep.wav'),
      volume: 0.5,
      category: 'notification',
      preload: true,
    });

    // Alarm Sound Effects
    this.soundEffects.set('alarm.gentle_bells', {
      id: 'alarm.gentle_bells',
      name: 'Gentle Bells',
      url: this.getSoundUrl('alarms', 'gentle_bells.wav'),
      volume: 0.8,
      category: 'alarm',
      loop: true,
      fadeIn: 1,
    });

    this.soundEffects.set('alarm.morning_birds', {
      id: 'alarm.morning_birds',
      name: 'Morning Birds',
      url: this.getSoundUrl('alarms', 'morning_birds.wav'),
      volume: 0.7,
      category: 'alarm',
      loop: true,
      fadeIn: 2,
    });

    this.soundEffects.set('alarm.classic_beep', {
      id: 'alarm.classic_beep',
      name: 'Classic Alarm',
      url: this.getSoundUrl('alarms', 'classic_beep.wav'),
      volume: 0.9,
      category: 'alarm',
      loop: true,
    });

    this.soundEffects.set('alarm.ocean_waves', {
      id: 'alarm.ocean_waves',
      name: 'Ocean Waves',
      url: this.getSoundUrl('alarms', 'ocean_waves.wav'),
      volume: 0.8,
      category: 'alarm',
      loop: true,
      fadeIn: 3,
    });

    this.soundEffects.set('alarm.energetic_beep', {
      id: 'alarm.energetic_beep',
      name: 'Energetic Beep',
      url: this.getSoundUrl('alarms', 'energetic_beep.wav'),
      volume: 0.9,
      category: 'alarm',
      loop: true,
    });
  }

  private getSoundUrl(category: string, filename: string): string {
    if (this.settings.soundTheme === 'default') {
      return `/sounds/${category}/${filename}`;
    }
    return `/sounds/themes/${this.settings.soundTheme}/${category}/${filename}`;
  }

  private refreshSoundUrls(): void {
    this.soundEffects.forEach((config, key) => {
      const pathParts = config.url.split('/');
      const filename = pathParts[pathParts.length - 1];
      let category = pathParts[pathParts.length - 2];
      
      // Handle theme path structure
      if (pathParts.includes('themes')) {
        category = pathParts[pathParts.length - 2];
      }
      
      config.url = this.getSoundUrl(category, filename);
    });
  }

  private async loadSettings(): Promise<void> {
    try {
      const savedSettings = await OfflineStorage.get('soundEffectSettings');
      if (savedSettings) {
        this.settings = { ...this.getDefaultSettings(), ...savedSettings };
      }
    } catch (error) {
      console.warn('Error loading sound settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await OfflineStorage.set('soundEffectSettings', this.settings);
    } catch (error) {
      console.error('Error saving sound settings:', error);
    }
  }

  private async preloadCriticalSounds(): Promise<void> {
    const criticalSounds = Array.from(this.soundEffects.values())
      .filter(sound => sound.preload && sound.category === 'ui');

    const preloadPromises = criticalSounds.map(sound =>
      this.audioManager.loadAudioFile(sound.url, {
        priority: 'high',
        cacheKey: sound.id,
      }).catch(error => {
        console.warn(`Failed to preload sound ${sound.id}:`, error);
      })
    );

    await Promise.allSettled(preloadPromises);
  }

  // Main sound playing methods
  async playSound(soundId: SoundEffectId, options: {
    volume?: number;
    loop?: boolean;
    fadeIn?: number;
    fadeOut?: number;
    force?: boolean; // Ignore settings and play anyway
  } = {}): Promise<AudioBufferSourceNode | null> {
    await this.initialize();

    const soundConfig = this.soundEffects.get(soundId);
    if (!soundConfig) {
      console.warn(`Sound effect not found: ${soundId}`);
      return null;
    }

    // Check if sound category is enabled
    if (!options.force && !this.isCategoryEnabled(soundConfig.category)) {
      return null;
    }

    try {
      const volume = this.calculateVolume(soundConfig, options.volume);
      
      const audioSource = await this.audioManager.playAudioFile(soundConfig.url, {
        volume,
        loop: options.loop ?? soundConfig.loop ?? false,
        fadeIn: options.fadeIn ?? soundConfig.fadeIn,
        fadeOut: options.fadeOut ?? soundConfig.fadeOut,
      });

      // Store reference for potential stopping
      if (audioSource) {
        this.loadedSounds.set(soundId, audioSource);
      }

      return audioSource;
    } catch (error) {
      console.error(`Error playing sound ${soundId}:`, error);
      return null;
    }
  }

  // Convenience methods for different sound categories
  async playUISound(soundId: 'click' | 'hover' | 'success' | 'error', options: { volume?: number } = {}): Promise<void> {
    await this.playSound(`ui.${soundId}` as SoundEffectId, options);
  }

  async playNotificationSound(soundId: 'default' | 'alarm' | 'beep', options: { volume?: number } = {}): Promise<void> {
    await this.playSound(`notification.${soundId}` as SoundEffectId, options);
  }

  async playAlarmSound(soundId: 'gentle_bells' | 'morning_birds' | 'classic_beep' | 'ocean_waves' | 'energetic_beep', options: {
    volume?: number;
    loop?: boolean;
    fadeIn?: number;
  } = {}): Promise<AudioBufferSourceNode | null> {
    return await this.playSound(`alarm.${soundId}` as SoundEffectId, {
      loop: true, // Default to looping for alarms
      ...options,
    });
  }

  // Sound management methods
  stopSound(soundId: SoundEffectId): void {
    const audioSource = this.loadedSounds.get(soundId);
    if (audioSource) {
      try {
        audioSource.stop();
        this.loadedSounds.delete(soundId);
      } catch (error) {
        // Sound might already be stopped
      }
    }
  }

  stopAllSounds(): void {
    this.loadedSounds.forEach((source, soundId) => {
      if (source) {
        try {
          source.stop();
        } catch (error) {
          // Sound might already be stopped
        }
      }
    });
    this.loadedSounds.clear();
  }

  stopSoundsByCategory(category: SoundEffectConfig['category']): void {
    this.soundEffects.forEach((config, soundId) => {
      if (config.category === category) {
        this.stopSound(soundId as SoundEffectId);
      }
    });
  }

  // Settings management
  private isCategoryEnabled(category: SoundEffectConfig['category']): boolean {
    switch (category) {
      case 'ui': return this.settings.uiSoundsEnabled;
      case 'notification': return this.settings.notificationSoundsEnabled;
      case 'alarm': return this.settings.alarmSoundsEnabled;
      case 'ambient': return this.settings.ambientSoundsEnabled;
      default: return true;
    }
  }

  private calculateVolume(soundConfig: SoundEffectConfig, overrideVolume?: number): number {
    const baseVolume = overrideVolume ?? soundConfig.volume ?? 1;
    const categoryVolume = this.getCategoryVolume(soundConfig.category);
    return Math.min(1, baseVolume * categoryVolume * this.settings.masterVolume);
  }

  private getCategoryVolume(category: SoundEffectConfig['category']): number {
    switch (category) {
      case 'ui': return this.settings.uiVolume;
      case 'notification': return this.settings.notificationVolume;
      case 'alarm': return this.settings.alarmVolume;
      case 'ambient': return this.settings.ambientVolume;
      default: return 1;
    }
  }

  // Public settings API
  getSettings(): SoundEffectSettings {
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<SoundEffectSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  async setSoundEnabled(category: SoundEffectConfig['category'], enabled: boolean): Promise<void> {
    const settingsKey = `${category}SoundsEnabled` as keyof SoundEffectSettings;
    await this.updateSettings({ [settingsKey]: enabled });
  }

  async setVolume(category: SoundEffectConfig['category'] | 'master', volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const settingsKey = category === 'master' ? 'masterVolume' : `${category}Volume` as keyof SoundEffectSettings;
    await this.updateSettings({ [settingsKey]: clampedVolume });
  }

  // Theme management methods
  async setSoundTheme(theme: SoundTheme): Promise<void> {
    const oldTheme = this.settings.soundTheme;
    await this.updateSettings({ soundTheme: theme });
    
    // Update all sound URLs to use new theme
    this.refreshSoundUrls();
    
    // Clear loaded sounds cache to force reload with new theme
    this.stopAllSounds();
    
    // Preload critical sounds with new theme
    if (this.isInitialized) {
      await this.preloadCriticalSounds();
    }
    
    console.log(`Sound theme changed from ${oldTheme} to ${theme}`);
  }

  getSoundTheme(): SoundTheme {
    return this.settings.soundTheme;
  }

  getAvailableThemes(): Array<{ id: SoundTheme; name: string; description: string }> {
    return [
      {
        id: 'default',
        name: 'Default',
        description: 'Clean and modern sounds'
      },
      {
        id: 'nature',
        name: 'Nature',
        description: 'Organic and natural sounds'
      },
      {
        id: 'electronic',
        name: 'Electronic',
        description: 'Digital and synthetic sounds'
      },
      {
        id: 'retro',
        name: 'Retro',
        description: '8-bit and vintage sounds'
      }
    ];
  }

  async previewTheme(theme: SoundTheme): Promise<void> {
    const originalTheme = this.settings.soundTheme;
    
    // Temporarily change theme for preview
    this.settings.soundTheme = theme;
    this.refreshSoundUrls();
    
    // Play a preview sound
    await this.playUISound('click', { volume: 0.5 });
    
    // Restore original theme
    this.settings.soundTheme = originalTheme;
    this.refreshSoundUrls();
  }

  // Utility methods
  getSoundEffect(soundId: SoundEffectId): SoundEffectConfig | undefined {
    return this.soundEffects.get(soundId);
  }

  getAllSoundEffects(): SoundEffectConfig[] {
    return Array.from(this.soundEffects.values());
  }

  getSoundEffectsByCategory(category: SoundEffectConfig['category']): SoundEffectConfig[] {
    return Array.from(this.soundEffects.values()).filter(sound => sound.category === category);
  }

  // Test methods for debugging
  async testSound(soundId: SoundEffectId): Promise<boolean> {
    try {
      const result = await this.playSound(soundId, { force: true });
      return result !== null;
    } catch (error) {
      console.error(`Test failed for sound ${soundId}:`, error);
      return false;
    }
  }

  async testAllSounds(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};
    
    for (const soundId of this.soundEffects.keys()) {
      results[soundId] = await this.testSound(soundId as SoundEffectId);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  }

  // Integration methods for existing services
  async playAlarmRingingSound(alarmSoundType: string): Promise<AudioBufferSourceNode | null> {
    // Map existing alarm sound types to our new system
    const soundMapping: { [key: string]: SoundEffectId } = {
      'gentle_bells': 'alarm.gentle_bells',
      'morning_birds': 'alarm.morning_birds',
      'classic_beep': 'alarm.classic_beep',
      'ocean_waves': 'alarm.ocean_waves',
      'energetic_beep': 'alarm.energetic_beep',
    };

    const soundId = soundMapping[alarmSoundType];
    if (soundId) {
      return await this.playSound(soundId, { loop: true, fadeIn: 1 });
    }

    console.warn(`Unknown alarm sound type: ${alarmSoundType}`);
    return null;
  }

  // Notification integration
  async playPushNotificationSound(): Promise<void> {
    await this.playNotificationSound('default');
  }

  async playEmergencyNotificationSound(): Promise<void> {
    await this.playNotificationSound('alarm', { volume: 1.0 });
  }

  // UI integration helpers
  createSoundHandler(soundType: 'click' | 'hover' | 'success' | 'error') {
    return () => this.playUISound(soundType);
  }

  // React hook integration
  getSoundHandlers() {
    return {
      onClick: this.createSoundHandler('click'),
      onHover: this.createSoundHandler('hover'),
      onSuccess: this.createSoundHandler('success'),
      onError: this.createSoundHandler('error'),
    };
  }
}

// Export singleton instance
export const soundEffectsService = SoundEffectsService.getInstance();
export default SoundEffectsService;