/**
 * Sound Effects Service (Extended with Custom Theme Support)
 * Manages all sound effects throughout the application including UI sounds,
 * notification sounds, and provides an easy-to-use interface for playing sounds
 * Extended to support custom sound theme creation and management
 */

import { AudioManager } from './audio-manager';
import OfflineStorage from './offline-storage';
import { CustomSoundManager } from './custom-sound-manager';
import { supabase } from './supabase';
import type { 
  CustomSoundTheme, 
  CustomSoundThemeCreationSession,
  CustomSoundAssignment,
  CustomSound,
  CustomSoundThemeMetadata,
  ValidationResult
} from '../types/custom-sound-themes';

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

export type SoundTheme = 
  | 'default' 
  | 'nature' 
  | 'electronic' 
  | 'retro' 
  | 'minimal' 
  | 'energetic' 
  | 'calm' 
  | 'ambient' 
  | 'cinematic' 
  | 'futuristic' 
  | 'meditation' 
  | 'workout' 
  | 'fantasy' 
  | 'horror' 
  | 'cyberpunk' 
  | 'lofi' 
  | 'classical' 
  | 'jazz' 
  | 'rock' 
  | 'scifi'
  | 'seasonal'
  | string; // Allow custom theme IDs

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
  // UI Sounds
  | 'ui.click'
  | 'ui.hover'
  | 'ui.success'
  | 'ui.error'
  | 'ui.toggle'
  | 'ui.popup'
  | 'ui.slide'
  | 'ui.confirm'
  | 'ui.cancel'
  
  // Notification Sounds
  | 'notification.default'
  | 'notification.alarm'
  | 'notification.beep'
  | 'notification.chime'
  | 'notification.ping'
  | 'notification.urgent'
  
  // Gentle Alarm Sounds
  | 'alarm.gentle_bells'
  | 'alarm.morning_birds'
  | 'alarm.ocean_waves'
  | 'alarm.forest_awakening'
  | 'alarm.tibetan_bowls'
  | 'alarm.wind_chimes'
  | 'alarm.piano_melody'
  | 'alarm.rain_drops'
  
  // Energetic Alarm Sounds
  | 'alarm.energetic_beep'
  | 'alarm.classic_beep'
  | 'alarm.buzzer'
  | 'alarm.electronic_pulse'
  | 'alarm.digital_cascade'
  | 'alarm.power_up'
  | 'alarm.techno_beat'
  | 'alarm.rock_riff'
  
  // Nature Alarm Sounds
  | 'alarm.sunrise_symphony'
  | 'alarm.jungle_awakening'
  | 'alarm.mountain_stream'
  | 'alarm.thunder_storm'
  | 'alarm.cricket_chorus'
  | 'alarm.whale_songs'
  
  // Ambient Alarm Sounds
  | 'alarm.space_ambient'
  | 'alarm.crystal_resonance'
  | 'alarm.dreamy_pads'
  | 'alarm.ethereal_voices'
  | 'alarm.meditation_gong'
  | 'alarm.healing_tones'
  
  // Themed Alarm Sounds
  | 'alarm.retro_arcade'
  | 'alarm.cyberpunk_alarm'
  | 'alarm.fantasy_horn'
  | 'alarm.horror_suspense'
  | 'alarm.jazz_piano'
  | 'alarm.classical_strings'
  | 'alarm.lofi_beats'
  | 'alarm.workout_pump'
  
  // Ambient Background Sounds
  | 'ambient.white_noise'
  | 'ambient.brown_noise'
  | 'ambient.pink_noise'
  | 'ambient.cafe_atmosphere'
  | 'ambient.library_quiet'
  | 'ambient.fireplace_crackling';

class SoundEffectsService {
  private static instance: SoundEffectsService | null = null;
  private audioManager: AudioManager;
  private customSoundManager: CustomSoundManager;
  private settings: SoundEffectSettings;
  private soundEffects: Map<string, SoundEffectConfig>;
  private loadedSounds: Map<string, AudioBufferSourceNode | null>;
  private isInitialized = false;
  private customThemes: Map<string, CustomSoundTheme> = new Map();
  private activeCreationSession: CustomSoundThemeCreationSession | null = null;

  private constructor() {
    this.audioManager = AudioManager.getInstance();
    this.customSoundManager = CustomSoundManager.getInstance();
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

      // Load custom themes
      await this.loadCustomThemes();

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

    // Additional UI Sound Effects
    this.soundEffects.set('ui.toggle', {
      id: 'ui.toggle',
      name: 'Toggle Switch',
      url: this.getSoundUrl('ui', 'toggle.wav'),
      volume: 0.4,
      category: 'ui',
      preload: true,
    });

    this.soundEffects.set('ui.popup', {
      id: 'ui.popup',
      name: 'Popup Open',
      url: this.getSoundUrl('ui', 'popup.wav'),
      volume: 0.3,
      category: 'ui',
      preload: true,
    });

    this.soundEffects.set('ui.slide', {
      id: 'ui.slide',
      name: 'Slide Transition',
      url: this.getSoundUrl('ui', 'slide.wav'),
      volume: 0.2,
      category: 'ui',
      preload: true,
    });

    this.soundEffects.set('ui.confirm', {
      id: 'ui.confirm',
      name: 'Confirm Action',
      url: this.getSoundUrl('ui', 'confirm.wav'),
      volume: 0.4,
      category: 'ui',
      preload: true,
    });

    this.soundEffects.set('ui.cancel', {
      id: 'ui.cancel',
      name: 'Cancel Action',
      url: this.getSoundUrl('ui', 'cancel.wav'),
      volume: 0.3,
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

    // Additional Notification Sound Effects
    this.soundEffects.set('notification.chime', {
      id: 'notification.chime',
      name: 'Chime Notification',
      url: this.getSoundUrl('notifications', 'chime.wav'),
      volume: 0.6,
      category: 'notification',
      preload: true,
    });

    this.soundEffects.set('notification.ping', {
      id: 'notification.ping',
      name: 'Ping Notification',
      url: this.getSoundUrl('notifications', 'ping.wav'),
      volume: 0.5,
      category: 'notification',
      preload: true,
    });

    this.soundEffects.set('notification.urgent', {
      id: 'notification.urgent',
      name: 'Urgent Notification',
      url: this.getSoundUrl('notifications', 'urgent.wav'),
      volume: 0.8,
      category: 'notification',
      preload: true,
    });

    // === ALARM SOUND EFFECTS ===
    
    // Gentle Alarm Sounds
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

    this.soundEffects.set('alarm.ocean_waves', {
      id: 'alarm.ocean_waves',
      name: 'Ocean Waves',
      url: this.getSoundUrl('alarms', 'ocean_waves.wav'),
      volume: 0.8,
      category: 'alarm',
      loop: true,
      fadeIn: 3,
    });

    this.soundEffects.set('alarm.forest_awakening', {
      id: 'alarm.forest_awakening',
      name: 'Forest Awakening',
      url: this.getSoundUrl('alarms', 'forest_awakening.wav'),
      volume: 0.7,
      category: 'alarm',
      loop: true,
      fadeIn: 4,
    });

    this.soundEffects.set('alarm.tibetan_bowls', {
      id: 'alarm.tibetan_bowls',
      name: 'Tibetan Singing Bowls',
      url: this.getSoundUrl('alarms', 'tibetan_bowls.wav'),
      volume: 0.8,
      category: 'alarm',
      loop: true,
      fadeIn: 3,
    });

    this.soundEffects.set('alarm.wind_chimes', {
      id: 'alarm.wind_chimes',
      name: 'Wind Chimes',
      url: this.getSoundUrl('alarms', 'wind_chimes.wav'),
      volume: 0.6,
      category: 'alarm',
      loop: true,
      fadeIn: 2,
    });

    this.soundEffects.set('alarm.piano_melody', {
      id: 'alarm.piano_melody',
      name: 'Peaceful Piano',
      url: this.getSoundUrl('alarms', 'piano_melody.wav'),
      volume: 0.7,
      category: 'alarm',
      loop: true,
      fadeIn: 2,
    });

    this.soundEffects.set('alarm.rain_drops', {
      id: 'alarm.rain_drops',
      name: 'Gentle Rain',
      url: this.getSoundUrl('alarms', 'rain_drops.wav'),
      volume: 0.8,
      category: 'alarm',
      loop: true,
      fadeIn: 3,
    });

    // Energetic Alarm Sounds
    this.soundEffects.set('alarm.energetic_beep', {
      id: 'alarm.energetic_beep',
      name: 'Energetic Beep',
      url: this.getSoundUrl('alarms', 'energetic_beep.wav'),
      volume: 0.9,
      category: 'alarm',
      loop: true,
    });

    this.soundEffects.set('alarm.classic_beep', {
      id: 'alarm.classic_beep',
      name: 'Classic Alarm',
      url: this.getSoundUrl('alarms', 'classic_beep.wav'),
      volume: 0.9,
      category: 'alarm',
      loop: true,
    });

    this.soundEffects.set('alarm.buzzer', {
      id: 'alarm.buzzer',
      name: 'Digital Buzzer',
      url: this.getSoundUrl('alarms', 'buzzer.wav'),
      volume: 0.8,
      category: 'alarm',
      loop: true,
    });

    this.soundEffects.set('alarm.electronic_pulse', {
      id: 'alarm.electronic_pulse',
      name: 'Electronic Pulse',
      url: this.getSoundUrl('alarms', 'electronic_pulse.wav'),
      volume: 0.8,
      category: 'alarm',
      loop: true,
    });

    this.soundEffects.set('alarm.digital_cascade', {
      id: 'alarm.digital_cascade',
      name: 'Digital Cascade',
      url: this.getSoundUrl('alarms', 'digital_cascade.wav'),
      volume: 0.8,
      category: 'alarm',
      loop: true,
    });

    this.soundEffects.set('alarm.power_up', {
      id: 'alarm.power_up',
      name: 'Power Up',
      url: this.getSoundUrl('alarms', 'power_up.wav'),
      volume: 0.9,
      category: 'alarm',
      loop: true,
    });

    this.soundEffects.set('alarm.techno_beat', {
      id: 'alarm.techno_beat',
      name: 'Techno Beat',
      url: this.getSoundUrl('alarms', 'techno_beat.wav'),
      volume: 0.8,
      category: 'alarm',
      loop: true,
    });

    this.soundEffects.set('alarm.rock_riff', {
      id: 'alarm.rock_riff',
      name: 'Rock Riff',
      url: this.getSoundUrl('alarms', 'rock_riff.wav'),
      volume: 0.9,
      category: 'alarm',
      loop: true,
    });

    // Nature Alarm Sounds
    this.soundEffects.set('alarm.sunrise_symphony', {
      id: 'alarm.sunrise_symphony',
      name: 'Sunrise Symphony',
      url: this.getSoundUrl('alarms', 'sunrise_symphony.wav'),
      volume: 0.7,
      category: 'alarm',
      loop: true,
      fadeIn: 5,
    });

    this.soundEffects.set('alarm.jungle_awakening', {
      id: 'alarm.jungle_awakening',
      name: 'Jungle Awakening',
      url: this.getSoundUrl('alarms', 'jungle_awakening.wav'),
      volume: 0.8,
      category: 'alarm',
      loop: true,
      fadeIn: 3,
    });

    this.soundEffects.set('alarm.mountain_stream', {
      id: 'alarm.mountain_stream',
      name: 'Mountain Stream',
      url: this.getSoundUrl('alarms', 'mountain_stream.wav'),
      volume: 0.7,
      category: 'alarm',
      loop: true,
      fadeIn: 4,
    });

    this.soundEffects.set('alarm.thunder_storm', {
      id: 'alarm.thunder_storm',
      name: 'Thunder Storm',
      url: this.getSoundUrl('alarms', 'thunder_storm.wav'),
      volume: 0.8,
      category: 'alarm',
      loop: true,
      fadeIn: 2,
    });

    this.soundEffects.set('alarm.cricket_chorus', {
      id: 'alarm.cricket_chorus',
      name: 'Cricket Chorus',
      url: this.getSoundUrl('alarms', 'cricket_chorus.wav'),
      volume: 0.6,
      category: 'alarm',
      loop: true,
      fadeIn: 3,
    });

    this.soundEffects.set('alarm.whale_songs', {
      id: 'alarm.whale_songs',
      name: 'Whale Songs',
      url: this.getSoundUrl('alarms', 'whale_songs.wav'),
      volume: 0.7,
      category: 'alarm',
      loop: true,
      fadeIn: 4,
    });

    // Ambient Alarm Sounds
    this.soundEffects.set('alarm.space_ambient', {
      id: 'alarm.space_ambient',
      name: 'Space Ambient',
      url: this.getSoundUrl('alarms', 'space_ambient.wav'),
      volume: 0.7,
      category: 'alarm',
      loop: true,
      fadeIn: 5,
    });

    this.soundEffects.set('alarm.crystal_resonance', {
      id: 'alarm.crystal_resonance',
      name: 'Crystal Resonance',
      url: this.getSoundUrl('alarms', 'crystal_resonance.wav'),
      volume: 0.8,
      category: 'alarm',
      loop: true,
      fadeIn: 3,
    });

    this.soundEffects.set('alarm.dreamy_pads', {
      id: 'alarm.dreamy_pads',
      name: 'Dreamy Pads',
      url: this.getSoundUrl('alarms', 'dreamy_pads.wav'),
      volume: 0.6,
      category: 'alarm',
      loop: true,
      fadeIn: 4,
    });

    this.soundEffects.set('alarm.ethereal_voices', {
      id: 'alarm.ethereal_voices',
      name: 'Ethereal Voices',
      url: this.getSoundUrl('alarms', 'ethereal_voices.wav'),
      volume: 0.7,
      category: 'alarm',
      loop: true,
      fadeIn: 4,
    });

    this.soundEffects.set('alarm.meditation_gong', {
      id: 'alarm.meditation_gong',
      name: 'Meditation Gong',
      url: this.getSoundUrl('alarms', 'meditation_gong.wav'),
      volume: 0.8,
      category: 'alarm',
      loop: true,
      fadeIn: 2,
    });

    this.soundEffects.set('alarm.healing_tones', {
      id: 'alarm.healing_tones',
      name: 'Healing Tones',
      url: this.getSoundUrl('alarms', 'healing_tones.wav'),
      volume: 0.7,
      category: 'alarm',
      loop: true,
      fadeIn: 3,
    });

    // Themed Alarm Sounds
    this.soundEffects.set('alarm.retro_arcade', {
      id: 'alarm.retro_arcade',
      name: 'Retro Arcade',
      url: this.getSoundUrl('alarms', 'retro_arcade.wav'),
      volume: 0.8,
      category: 'alarm',
      loop: true,
    });

    this.soundEffects.set('alarm.cyberpunk_alarm', {
      id: 'alarm.cyberpunk_alarm',
      name: 'Cyberpunk Alert',
      url: this.getSoundUrl('alarms', 'cyberpunk_alarm.wav'),
      volume: 0.8,
      category: 'alarm',
      loop: true,
    });

    this.soundEffects.set('alarm.fantasy_horn', {
      id: 'alarm.fantasy_horn',
      name: 'Fantasy Horn',
      url: this.getSoundUrl('alarms', 'fantasy_horn.wav'),
      volume: 0.9,
      category: 'alarm',
      loop: true,
    });

    this.soundEffects.set('alarm.horror_suspense', {
      id: 'alarm.horror_suspense',
      name: 'Horror Suspense',
      url: this.getSoundUrl('alarms', 'horror_suspense.wav'),
      volume: 0.7,
      category: 'alarm',
      loop: true,
      fadeIn: 2,
    });

    this.soundEffects.set('alarm.jazz_piano', {
      id: 'alarm.jazz_piano',
      name: 'Jazz Piano',
      url: this.getSoundUrl('alarms', 'jazz_piano.wav'),
      volume: 0.7,
      category: 'alarm',
      loop: true,
      fadeIn: 2,
    });

    this.soundEffects.set('alarm.classical_strings', {
      id: 'alarm.classical_strings',
      name: 'Classical Strings',
      url: this.getSoundUrl('alarms', 'classical_strings.wav'),
      volume: 0.7,
      category: 'alarm',
      loop: true,
      fadeIn: 3,
    });

    this.soundEffects.set('alarm.lofi_beats', {
      id: 'alarm.lofi_beats',
      name: 'Lo-Fi Beats',
      url: this.getSoundUrl('alarms', 'lofi_beats.wav'),
      volume: 0.6,
      category: 'alarm',
      loop: true,
      fadeIn: 2,
    });

    this.soundEffects.set('alarm.workout_pump', {
      id: 'alarm.workout_pump',
      name: 'Workout Pump',
      url: this.getSoundUrl('alarms', 'workout_pump.wav'),
      volume: 0.9,
      category: 'alarm',
      loop: true,
    });

    // === AMBIENT BACKGROUND SOUNDS ===
    this.soundEffects.set('ambient.white_noise', {
      id: 'ambient.white_noise',
      name: 'White Noise',
      url: this.getSoundUrl('ambient', 'white_noise.wav'),
      volume: 0.5,
      category: 'ambient',
      loop: true,
      preload: false,
    });

    this.soundEffects.set('ambient.brown_noise', {
      id: 'ambient.brown_noise',
      name: 'Brown Noise',
      url: this.getSoundUrl('ambient', 'brown_noise.wav'),
      volume: 0.5,
      category: 'ambient',
      loop: true,
      preload: false,
    });

    this.soundEffects.set('ambient.pink_noise', {
      id: 'ambient.pink_noise',
      name: 'Pink Noise',
      url: this.getSoundUrl('ambient', 'pink_noise.wav'),
      volume: 0.5,
      category: 'ambient',
      loop: true,
      preload: false,
    });

    this.soundEffects.set('ambient.cafe_atmosphere', {
      id: 'ambient.cafe_atmosphere',
      name: 'Cafe Atmosphere',
      url: this.getSoundUrl('ambient', 'cafe_atmosphere.wav'),
      volume: 0.4,
      category: 'ambient',
      loop: true,
      preload: false,
    });

    this.soundEffects.set('ambient.library_quiet', {
      id: 'ambient.library_quiet',
      name: 'Library Quiet',
      url: this.getSoundUrl('ambient', 'library_quiet.wav'),
      volume: 0.3,
      category: 'ambient',
      loop: true,
      preload: false,
    });

    this.soundEffects.set('ambient.fireplace_crackling', {
      id: 'ambient.fireplace_crackling',
      name: 'Fireplace Crackling',
      url: this.getSoundUrl('ambient', 'fireplace_crackling.wav'),
      volume: 0.6,
      category: 'ambient',
      loop: true,
      preload: false,
    });
  }

  // ========== CUSTOM THEME SUPPORT METHODS ==========

  private isCustomTheme(themeId: string): boolean {
    const builtInThemes = [
      'default', 'nature', 'electronic', 'retro', 'minimal', 'energetic', 
      'calm', 'ambient', 'cinematic', 'futuristic', 'meditation', 'workout', 
      'fantasy', 'horror', 'cyberpunk', 'lofi', 'classical', 'jazz', 'rock', 
      'scifi', 'seasonal'
    ];
    return !builtInThemes.includes(themeId);
  }

  private getSoundUrl(category: string, filename: string): string {
    // Check if it's a custom theme
    if (this.isCustomTheme(this.settings.soundTheme)) {
      const customTheme = this.customThemes.get(this.settings.soundTheme);
      if (customTheme) {
        return this.getCustomSoundUrl(customTheme, category, filename);
      }
    }
    
    // Handle built-in themes
    if (this.settings.soundTheme === 'default') {
      return `/sounds/${category}/${filename}`;
    }
    return `/sounds/themes/${this.settings.soundTheme}/${category}/${filename}`;
  }

  private getCustomSoundUrl(theme: CustomSoundTheme, category: string, filename: string): string {
    // Map the category and filename to the custom theme's sound assignments
    const categoryMap = {
      'ui': theme.sounds.ui,
      'notifications': theme.sounds.notifications,
      'alarms': theme.sounds.alarms,
      'ambient': theme.sounds.ambient
    };

    const sounds = categoryMap[category as keyof typeof categoryMap];
    if (!sounds) {
      // Fallback to default theme if category not found
      return `/sounds/${category}/${filename}`;
    }

    // Map the filename to the appropriate sound in the theme
    const soundKey = this.mapFilenameToSoundKey(filename);
    const soundAssignment = sounds[soundKey as keyof typeof sounds];
    
    if (soundAssignment) {
      return this.resolveSoundAssignmentUrl(soundAssignment);
    }

    // Fallback to default theme
    return `/sounds/${category}/${filename}`;
  }

  private mapFilenameToSoundKey(filename: string): string {
    // Remove file extension and map to our sound key format
    const baseName = filename.replace(/\.[^/.]+$/, "");
    
    // Map common filenames to theme sound keys
    const mapping: Record<string, string> = {
      'click': 'click',
      'hover': 'hover',
      'success': 'success',
      'error': 'error',
      'toggle': 'toggle',
      'popup': 'popup',
      'slide': 'slide',
      'confirm': 'confirm',
      'cancel': 'cancel',
      'notification': 'default',
      'alarm': 'alarm',
      'beep': 'beep',
      'chime': 'chime',
      'ping': 'ping',
      'urgent': 'urgent',
      'gentle_bells': 'gentle',
      'morning_birds': 'gentle',
      'classic_beep': 'primary',
      'energetic_beep': 'energetic',
      'white_noise': 'white_noise',
      'brown_noise': 'brown_noise',
      'pink_noise': 'pink_noise'
    };

    return mapping[baseName] || baseName;
  }

  private resolveSoundAssignmentUrl(assignment: CustomSoundAssignment): string {
    switch (assignment.type) {
      case 'uploaded':
        return assignment.customSound?.fileUrl || assignment.source;
      case 'builtin':
        return assignment.source;
      case 'url':
        return assignment.source;
      case 'generated':
        return assignment.source; // This would be a generated audio URL
      case 'tts':
        return assignment.source; // This would be a TTS-generated audio URL
      default:
        return assignment.source;
    }
  }

  private async loadCustomThemes(): Promise<void> {
    try {
      // Load custom themes from local storage first
      const localThemes = await OfflineStorage.get('customSoundThemes');
      if (localThemes && Array.isArray(localThemes)) {
        localThemes.forEach(theme => {
          this.customThemes.set(theme.id, theme);
        });
      }

      // TODO: Load from Supabase for synced themes
      // const { data, error } = await supabase
      //   .from('custom_sound_themes')
      //   .select('*');
      // if (data) {
      //   data.forEach(theme => {
      //     this.customThemes.set(theme.id, theme);
      //   });
      // }
    } catch (error) {
      console.warn('Error loading custom themes:', error);
    }
  }

  private async saveCustomThemes(): Promise<void> {
    try {
      const themes = Array.from(this.customThemes.values());
      await OfflineStorage.set('customSoundThemes', themes);
    } catch (error) {
      console.error('Error saving custom themes:', error);
    }
  }

  // ========== CUSTOM THEME MANAGEMENT API ==========

  /**
   * Start a new custom theme creation session
   */
  async startCustomThemeCreation(userId: string, templateTheme?: string): Promise<CustomSoundThemeCreationSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeCreationSession = {
      id: sessionId,
      userId,
      sessionType: 'create',
      currentTheme: {
        id: `custom_${Date.now()}`,
        name: 'New Custom Theme',
        displayName: 'New Custom Theme',
        description: '',
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: false,
        isShared: false,
        version: '1.0.0',
        category: 'custom',
        tags: [],
        rating: 0,
        downloads: 0,
        popularity: 0,
        sounds: {
          ui: {} as any,
          notifications: {} as any,
          alarms: {} as any,
        },
        metadata: {} as CustomSoundThemeMetadata,
        preview: {} as any,
        permissions: {} as any,
        isPremium: false,
        requiresSubscription: false,
      },
      currentStep: 'info',
      completedSteps: [],
      progress: {
        currentStep: 'info',
        stepProgress: 0,
        overallProgress: 0,
        requiredFields: [
          { field: 'name', completed: false, description: 'Theme name' },
          { field: 'sounds', completed: false, description: 'Sound assignments' }
        ],
        optionalFields: []
      },
      startedAt: new Date(),
      autoSaveEnabled: true,
      uploadedFiles: [],
      generatedSounds: [],
      selectedBuiltIns: [],
      validation: {
        isValid: false,
        completeness: 0,
        issues: [],
        suggestions: []
      },
      errors: [],
      warnings: []
    };

    return this.activeCreationSession;
  }

  /**
   * Get the current creation session
   */
  getCurrentCreationSession(): CustomSoundThemeCreationSession | null {
    return this.activeCreationSession;
  }

  /**
   * Update the current creation session
   */
  async updateCreationSession(updates: Partial<CustomSoundThemeCreationSession>): Promise<void> {
    if (!this.activeCreationSession) {
      throw new Error('No active creation session');
    }

    this.activeCreationSession = {
      ...this.activeCreationSession,
      ...updates,
      lastSavedAt: new Date()
    };

    // Auto-save if enabled
    if (this.activeCreationSession.autoSaveEnabled) {
      await this.saveCreationSession();
    }
  }

  /**
   * Save the current creation session
   */
  private async saveCreationSession(): Promise<void> {
    if (!this.activeCreationSession) return;

    try {
      await OfflineStorage.set(`creationSession_${this.activeCreationSession.id}`, this.activeCreationSession);
    } catch (error) {
      console.error('Error saving creation session:', error);
    }
  }

  /**
   * Validate a custom theme
   */
  async validateCustomTheme(theme: Partial<CustomSoundTheme>): Promise<ValidationResult> {
    const issues: any[] = [];
    const suggestions: any[] = [];
    let completeness = 0;

    // Basic validation
    if (!theme.name || theme.name.trim().length === 0) {
      issues.push({
        type: 'error',
        field: 'name',
        message: 'Theme name is required',
        severity: 'critical',
        canAutoFix: false
      });
    } else {
      completeness += 15;
    }

    if (!theme.description || theme.description.trim().length === 0) {
      suggestions.push({
        type: 'completeness',
        message: 'Adding a description will help users understand your theme',
        impact: 'medium'
      });
    } else {
      completeness += 10;
    }

    // Validate sound assignments
    if (theme.sounds) {
      const requiredUISounds = ['click', 'hover', 'success', 'error'];
      const requiredNotificationSounds = ['default', 'alarm', 'beep'];
      const requiredAlarmSounds = ['primary', 'secondary'];

      // Check UI sounds
      const uiSounds = theme.sounds.ui || {};
      const missingUISounds = requiredUISounds.filter(sound => !uiSounds[sound as keyof typeof uiSounds]);
      if (missingUISounds.length > 0) {
        issues.push({
          type: 'warning',
          field: 'ui_sounds',
          message: `Missing UI sounds: ${missingUISounds.join(', ')}`,
          severity: 'medium',
          canAutoFix: true,
          autoFixAction: 'Use default sounds'
        });
      } else {
        completeness += 25;
      }

      // Check notification sounds
      const notificationSounds = theme.sounds.notifications || {};
      const missingNotificationSounds = requiredNotificationSounds.filter(sound => !notificationSounds[sound as keyof typeof notificationSounds]);
      if (missingNotificationSounds.length > 0) {
        issues.push({
          type: 'warning',
          field: 'notification_sounds',
          message: `Missing notification sounds: ${missingNotificationSounds.join(', ')}`,
          severity: 'medium',
          canAutoFix: true,
          autoFixAction: 'Use default sounds'
        });
      } else {
        completeness += 25;
      }

      // Check alarm sounds
      const alarmSounds = theme.sounds.alarms || {};
      const missingAlarmSounds = requiredAlarmSounds.filter(sound => !alarmSounds[sound as keyof typeof alarmSounds]);
      if (missingAlarmSounds.length > 0) {
        issues.push({
          type: 'error',
          field: 'alarm_sounds',
          message: `Missing alarm sounds: ${missingAlarmSounds.join(', ')}`,
          severity: 'critical',
          canAutoFix: true,
          autoFixAction: 'Use default sounds'
        });
      } else {
        completeness += 25;
      }
    } else {
      issues.push({
        type: 'error',
        field: 'sounds',
        message: 'Sound assignments are required',
        severity: 'critical',
        canAutoFix: false
      });
    }

    const isValid = issues.filter(issue => issue.type === 'error').length === 0;

    return {
      isValid,
      completeness,
      issues,
      suggestions
    };
  }

  /**
   * Save a custom theme
   */
  async saveCustomTheme(theme: CustomSoundTheme): Promise<boolean> {
    try {
      // Validate the theme first
      const validation = await this.validateCustomTheme(theme);
      if (!validation.isValid) {
        throw new Error('Theme validation failed');
      }

      // Save to local storage
      this.customThemes.set(theme.id, theme);
      await this.saveCustomThemes();

      // TODO: Save to Supabase for syncing
      // const { error } = await supabase
      //   .from('custom_sound_themes')
      //   .upsert([theme]);
      // if (error) throw error;

      console.log(`Custom theme "${theme.name}" saved successfully`);
      return true;
    } catch (error) {
      console.error('Error saving custom theme:', error);
      return false;
    }
  }

  /**
   * Delete a custom theme
   */
  async deleteCustomTheme(themeId: string, userId: string): Promise<boolean> {
    try {
      const theme = this.customThemes.get(themeId);
      if (!theme) {
        throw new Error('Theme not found');
      }

      if (theme.createdBy !== userId) {
        throw new Error('Unauthorized to delete this theme');
      }

      // Remove from local storage
      this.customThemes.delete(themeId);
      await this.saveCustomThemes();

      // TODO: Delete from Supabase
      // const { error } = await supabase
      //   .from('custom_sound_themes')
      //   .delete()
      //   .eq('id', themeId);
      // if (error) throw error;

      console.log(`Custom theme "${theme.name}" deleted successfully`);
      return true;
    } catch (error) {
      console.error('Error deleting custom theme:', error);
      return false;
    }
  }

  /**
   * Get all custom themes
   */
  getAllCustomThemes(): CustomSoundTheme[] {
    return Array.from(this.customThemes.values());
  }

  /**
   * Get custom themes by user
   */
  getCustomThemesByUser(userId: string): CustomSoundTheme[] {
    return Array.from(this.customThemes.values()).filter(theme => theme.createdBy === userId);
  }

  /**
   * Get a specific custom theme
   */
  getCustomTheme(themeId: string): CustomSoundTheme | undefined {
    return this.customThemes.get(themeId);
  }

  // ========== ORIGINAL METHODS (UPDATED FOR CUSTOM THEME SUPPORT) ==========

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

  // Theme management methods (UPDATED)
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

  getAvailableThemes(): Array<{ id: SoundTheme; name: string; description: string; category?: string; color?: string; isCustom?: boolean }> {
    const builtInThemes = [
      // Core Themes
      {
        id: 'default',
        name: 'Default',
        description: 'Clean and modern sounds',
        category: 'core',
        color: 'blue',
        isCustom: false
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Subtle and understated sounds',
        category: 'core',
        color: 'gray',
        isCustom: false
      },

      // Nature & Ambient Themes
      {
        id: 'nature',
        name: 'Nature',
        description: 'Organic and natural sounds',
        category: 'nature',
        color: 'green',
        isCustom: false
      },
      {
        id: 'calm',
        name: 'Calm',
        description: 'Peaceful and soothing sounds',
        category: 'nature',
        color: 'teal',
        isCustom: false
      },
      {
        id: 'ambient',
        name: 'Ambient',
        description: 'Atmospheric background sounds with ethereal pads',
        category: 'nature',
        color: 'cyan',
        isCustom: false
      },
      {
        id: 'meditation',
        name: 'Meditation',
        description: 'Zen and mindfulness sounds',
        category: 'nature',
        color: 'purple',
        isCustom: false
      },
      {
        id: 'seasonal',
        name: 'Seasonal',
        description: 'Crystal winter sounds with sparkle effects',
        category: 'nature',
        color: 'sky',
        isCustom: false
      },

      // Electronic & Futuristic Themes
      {
        id: 'electronic',
        name: 'Electronic',
        description: 'Digital and synthetic sounds',
        category: 'electronic',
        color: 'indigo',
        isCustom: false
      },
      {
        id: 'futuristic',
        name: 'Futuristic',
        description: 'Sci-fi inspired soundscape',
        category: 'electronic',
        color: 'violet',
        isCustom: false
      },
      {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        description: 'Dark dystopian tech sounds',
        category: 'electronic',
        color: 'pink',
        isCustom: false
      },
      {
        id: 'scifi',
        name: 'Sci-Fi',
        description: 'Futuristic laser sounds and space-age effects',
        category: 'electronic',
        color: 'blue',
        isCustom: false
      },

      // Energetic & Activity Themes
      {
        id: 'energetic',
        name: 'Energetic',
        description: 'High-energy motivating sounds',
        category: 'energy',
        color: 'orange',
        isCustom: false
      },
      {
        id: 'workout',
        name: 'Workout',
        description: 'High-energy motivational sounds with punchy beats',
        category: 'energy',
        color: 'red',
        isCustom: false
      },
      {
        id: 'rock',
        name: 'Rock',
        description: 'Hard rock and metal sounds',
        category: 'energy',
        color: 'slate',
        isCustom: false
      },

      // Artistic & Creative Themes
      {
        id: 'cinematic',
        name: 'Cinematic',
        description: 'Movie-inspired dramatic sounds',
        category: 'artistic',
        color: 'amber',
        isCustom: false
      },
      {
        id: 'fantasy',
        name: 'Fantasy',
        description: 'Magical and mystical sounds',
        category: 'artistic',
        color: 'emerald',
        isCustom: false
      },
      {
        id: 'horror',
        name: 'Horror',
        description: 'Spooky and suspenseful sounds',
        category: 'artistic',
        color: 'zinc',
        isCustom: false
      },
      {
        id: 'lofi',
        name: 'Lo-Fi',
        description: 'Chill and relaxed beats',
        category: 'artistic',
        color: 'rose',
        isCustom: false
      },

      // Musical Genre Themes
      {
        id: 'classical',
        name: 'Classical',
        description: 'Orchestral and chamber music',
        category: 'musical',
        color: 'yellow',
        isCustom: false
      },
      {
        id: 'jazz',
        name: 'Jazz',
        description: 'Smooth jazz and blues',
        category: 'musical',
        color: 'lime',
        isCustom: false
      },

      // Retro & Vintage Themes
      {
        id: 'retro',
        name: 'Retro',
        description: '8-bit and vintage sounds',
        category: 'retro',
        color: 'fuchsia',
        isCustom: false
      }
    ];

    // Add custom themes
    const customThemes = Array.from(this.customThemes.values()).map(theme => ({
      id: theme.id,
      name: theme.displayName || theme.name,
      description: theme.description,
      category: 'custom',
      color: 'neutral',
      isCustom: true
    }));

    return [...builtInThemes, ...customThemes];
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
