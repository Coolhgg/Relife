/**
 * Enhanced Voice Service
 * Refactored to use standardized service architecture with improved cache management and premium integration
 */

import type { Alarm, VoiceMood } from '../types';
import { formatTime } from '../utils';
import { BaseService } from './base/BaseService';
import { CacheProvider, getCacheManager } from './base/CacheManager';
import {
  VoiceServiceInterface,
  ServiceConfig,
  ServiceHealth,
  AnalyticsServiceInterface
} from '../types/service-architecture';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface VoiceServiceConfig extends ServiceConfig {
  maxCacheSize: number;
  audioFileExpiry: number; // milliseconds
  preloadEnabled: boolean;
  preloadLimit: number;
  defaultRate: number;
  defaultPitch: number;
  defaultVolume: number;
  enablePremiumVoices: boolean;
  enableWebSpeechAPI: boolean;
  enableCloudTTS: boolean;
  cloudTTSProvider: 'elevenlabs' | 'google' | 'azure' | 'aws';
  audioQuality: 'low' | 'medium' | 'high';
  audioFormat: 'mp3' | 'wav' | 'ogg';
}

export interface VoiceServiceDependencies {
  analyticsService?: AnalyticsServiceInterface;
  premiumVoiceService?: any;
  subscriptionService?: any;
  cloudTTSService?: any;
  errorHandler?: any;
}

export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voiceId?: string;
  emotionalIntensity: number;
}

export interface AudioClip {
  id: string;
  url: string;
  duration: number;
  format: string;
  size: number;
  createdAt: Date;
  expiresAt: Date;
  mood: VoiceMood;
  userId?: string;
  premium: boolean;
}

// Voice mood templates
const VOICE_TEMPLATES = {
  'drill-sergeant': [
    'WAKE UP SOLDIER! It\'s {time}! {label}! NO EXCUSES!',
    'DROP AND GIVE ME TWENTY! It\'s {time} and time for {label}!',
    'MOVE IT MOVE IT! {time} means {label} time! GET UP NOW!',
  ],
  'sweet-angel': [
    'Good morning sunshine! It\'s {time} and time for {label}. Have a beautiful day!',
    'Rise and shine, dear! It\'s {time}. Time to start your wonderful day with {label}.',
    'Sweet dreams are over! It\'s {time} and your {label} awaits. You\'ve got this!',
  ],
  'anime-hero': [
    'The power of friendship compels you! It\'s {time}! Time for {label}! Believe in yourself!',
    'Your destiny awaits! It\'s {time} and {label} is calling! Never give up!',
    'Transform and roll out! It\'s {time}! Time to conquer {label} with determination!',
  ],
  'savage-roast': [
    'Oh look, sleeping beauty decided to join us. It\'s {time} and your {label} is waiting.',
    'Well well well, it\'s {time}. Time for {label}. Hope you enjoyed your beauty sleep.',
    'Rise and grind, sunshine. It\'s {time} and {label} won\'t do itself. Time to adult.',
  ],
  'motivational': [
    'Champions rise early! It\'s {time} and time for {label}! Today is your day to shine!',
    'Success starts now! It\'s {time}! Your {label} is the first step to greatness!',
    'Winners don\'t snooze! It\'s {time}! Time to crush {label} and own this day!',
  ],
  'gentle': [
    'Good morning! It\'s {time}. Take your time, but please remember {label} when you\'re ready.',
    'Gentle wake-up call: it\'s {time}. Your {label} is waiting, but no rush.',
    'Sweet morning! It\'s {time} and time for {label}. Hope you slept well.',
  ],
};

// ============================================================================
// Enhanced Voice Service Implementation
// ============================================================================

export class EnhancedVoiceService extends BaseService implements VoiceServiceInterface {
  private audioCache = new Map<string, AudioClip>();
  private cache: CacheProvider;
  private dependencies: VoiceServiceDependencies;
  private speechSynthesis: SpeechSynthesis | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor(dependencies: VoiceServiceDependencies, config: VoiceServiceConfig) {
    super('VoiceService', '2.0.0', config);
    this.dependencies = dependencies;
    this.cache = getCacheManager().getProvider(config.caching?.strategy || 'memory');
  }

  // ============================================================================
  // BaseService Implementation
  // ============================================================================

  protected getDefaultConfig(): Partial<VoiceServiceConfig> {
    return {
      maxCacheSize: 100,
      audioFileExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
      preloadEnabled: true,
      preloadLimit: 10,
      defaultRate: 1.0,
      defaultPitch: 1.0,
      defaultVolume: 0.9,
      enablePremiumVoices: true,
      enableWebSpeechAPI: true,
      enableCloudTTS: false,
      cloudTTSProvider: 'elevenlabs',
      audioQuality: 'medium',
      audioFormat: 'mp3',
      ...super.getDefaultConfig?.() || {}
    };
  }

  protected async doInitialize(): Promise<void> {
    const timerId = this.startTimer('initialize');

    try {
      if ((this.config as VoiceServiceConfig).enableWebSpeechAPI) {
        await this.initializeWebSpeechAPI();
      }

      await this.loadAudioClipsFromCache();

      if ((this.config as VoiceServiceConfig).enableCloudTTS) {
        await this.initializeCloudTTS();
      }

      this.emit('voice:initialized', {
        availableVoices: this.availableVoices.length,
        cachedClips: this.audioCache.size
      });

      this.recordMetric('initialize_duration', this.endTimer(timerId) || 0);

    } catch (error) {
      this.handleError(error, 'Failed to initialize VoiceService');
      throw error;
    }
  }

  protected async doCleanup(): Promise<void> {
    try {
      await this.saveAudioClipsToCache();
      await this.cleanupExpiredAudioClips();
      this.audioCache.clear();

      if (this.speechSynthesis) {
        this.speechSynthesis.cancel();
      }

    } catch (error) {
      this.handleError(error, 'Failed to cleanup VoiceService');
    }
  }

  public async getHealth(): Promise<ServiceHealth> {
    const baseHealth = await super.getHealth();
    
    const config = this.config as VoiceServiceConfig;
    const cacheUsage = this.audioCache.size / config.maxCacheSize;
    
    let status = baseHealth.status;
    if (cacheUsage > 0.8) {
      status = 'degraded';
    }
    if (!this.speechSynthesis && !config.enableCloudTTS) {
      status = 'unhealthy';
    }

    return {
      ...baseHealth,
      status,
      metrics: {
        ...baseHealth.metrics || {},
        cachedClips: this.audioCache.size,
        availableVoices: this.availableVoices.length,
        cacheUsage: cacheUsage * 100
      }
    };
  }

  // ============================================================================
  // VoiceServiceInterface Implementation
  // ============================================================================

  public async speak(text: string, options: any = {}): Promise<void> {
    const timerId = this.startTimer('speak');

    try {
      const settings: VoiceSettings = {
        rate: options.rate || (this.config as VoiceServiceConfig).defaultRate,
        pitch: options.pitch || (this.config as VoiceServiceConfig).defaultPitch,
        volume: options.volume || (this.config as VoiceServiceConfig).defaultVolume,
        emotionalIntensity: options.emotionalIntensity || 1.0,
        ...options
      };

      if (this.speechSynthesis) {
        await this.speakWithWebAPI(text, settings);
      } else if ((this.config as VoiceServiceConfig).enableCloudTTS) {
        await this.speakWithCloudTTS(text, settings);
      } else {
        throw new Error('No TTS service available');
      }

      if (this.dependencies.analyticsService) {
        await this.dependencies.analyticsService.track('voice_synthesis_used', {
          textLength: text.length,
          provider: this.speechSynthesis ? 'web_speech_api' : 'cloud_tts'
        });
      }

      this.recordMetric('speak_duration', this.endTimer(timerId) || 0);

    } catch (error) {
      this.handleError(error, 'Failed to speak text', { text, options });
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
    this.emit('voice:stopped');
  }

  public async getVoices(): Promise<SpeechSynthesisVoice[]> {
    return [...this.availableVoices];
  }

  public async setVoice(voiceId: string): Promise<void> {
    const voice = this.availableVoices.find(v => v.voiceURI === voiceId);
    if (!voice) {
      throw new Error(`Voice not found: ${voiceId}`);
    }
    this.emit('voice:changed', { voiceId });
  }

  public async generateAudio(text: string, voiceId: string): Promise<string> {
    const timerId = this.startTimer('generateAudio');

    try {
      const cacheKey = this.generateCacheKey(text, voiceId);
      
      const cachedClip = this.audioCache.get(cacheKey) || await this.cache.get<AudioClip>(cacheKey);
      if (cachedClip && !this.isExpired(cachedClip)) {
        this.recordMetric('audio_cache_hits', 1);
        return cachedClip.url;
      }

      const audioUrl = await this.synthesizeAudio(text, voiceId);
      
      const audioClip: AudioClip = {
        id: cacheKey,
        url: audioUrl,
        duration: this.estimateAudioDuration(text),
        format: (this.config as VoiceServiceConfig).audioFormat,
        size: this.estimateAudioSize(text),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + (this.config as VoiceServiceConfig).audioFileExpiry),
        mood: 'motivational',
        premium: false
      };

      await this.cacheAudioClip(audioClip);

      this.recordMetric('generateAudio_duration', this.endTimer(timerId) || 0);

      return audioUrl;

    } catch (error) {
      this.handleError(error, 'Failed to generate audio', { text, voiceId });
      throw error;
    }
  }

  // ============================================================================
  // Enhanced Voice Methods
  // ============================================================================

  public async generateAlarmMessage(alarm: Alarm, userId?: string): Promise<string | null> {
    const timerId = this.startTimer('generateAlarmMessage');

    try {
      if (userId && (this.config as VoiceServiceConfig).enablePremiumVoices) {
        const premiumResult = await this.tryPremiumVoiceGeneration(alarm, userId);
        if (premiumResult) {
          this.recordMetric('premium_voice_used', 1);
          return premiumResult;
        }
      }

      const messageText = this.generateMessageText(alarm);
      const audioUrl = await this.generateAudio(messageText, alarm.voiceMood);
      
      this.recordMetric('generateAlarmMessage_duration', this.endTimer(timerId) || 0);
      
      return audioUrl;

    } catch (error) {
      this.handleError(error, 'Failed to generate alarm message', { alarmId: alarm.id, userId });
      return null;
    }
  }

  public async preloadAlarmMessages(alarms: Alarm[], userId?: string): Promise<void> {
    const config = this.config as VoiceServiceConfig;
    
    if (!config.preloadEnabled) return;

    const timerId = this.startTimer('preloadAlarmMessages');

    try {
      const alarmsToPreload = alarms.slice(0, config.preloadLimit);
      
      const preloadPromises = alarmsToPreload.map(alarm => 
        this.generateAlarmMessage(alarm, userId).catch(error => 
          this.handleError(error, 'Failed to preload alarm message', { alarmId: alarm.id })
        )
      );

      await Promise.allSettled(preloadPromises);

      this.recordMetric('preloadAlarmMessages_duration', this.endTimer(timerId) || 0);

      this.emit('voice:preload_completed', { 
        preloadedCount: alarmsToPreload.length
      });

    } catch (error) {
      this.handleError(error, 'Failed to preload alarm messages');
    }
  }

  public async testVoice(mood: VoiceMood, userId?: string): Promise<void> {
    const testAlarm: Alarm = {
      id: 'voice_test',
      time: '07:00',
      label: 'Morning Workout',
      enabled: true,
      days: [1, 2, 3, 4, 5],
      voiceMood: mood,
      snoozeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const messageText = this.generateMessageText(testAlarm);
    
    await this.speak(messageText, this.getVoiceSettingsForMood(mood));
  }

  public async clearVoiceCache(userId?: string): Promise<void> {
    if (userId) {
      const userClips = Array.from(this.audioCache.values()).filter(clip => clip.userId === userId);
      
      for (const clip of userClips) {
        this.audioCache.delete(clip.id);
        await this.cache.delete(clip.id);
      }
    } else {
      this.audioCache.clear();
      await this.cache.clear();
    }

    this.emit('voice:cache_cleared', { userId });
  }

  // ============================================================================
  // Private Implementation Methods
  // ============================================================================

  private async initializeWebSpeechAPI(): Promise<void> {
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    this.speechSynthesis = window.speechSynthesis;
    await this.loadAvailableVoices();
  }

  private async loadAvailableVoices(): Promise<void> {
    return new Promise(resolve => {
      const loadVoices = () => {
        this.availableVoices = this.speechSynthesis!.getVoices();
        
        if (this.availableVoices.length > 0) {
          resolve();
        } else {
          setTimeout(loadVoices, 100);
        }
      };

      if (this.speechSynthesis) {
        this.speechSynthesis.onvoiceschanged = loadVoices;
      }

      loadVoices();
    });
  }

  private async initializeCloudTTS(): Promise<void> {
    if (!this.dependencies.cloudTTSService) {
      throw new Error('Cloud TTS service not available');
    }

    await this.dependencies.cloudTTSService.initialize();
  }

  private async speakWithWebAPI(text: string, settings: VoiceSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.speechSynthesis) {
        reject(new Error('Speech synthesis not available'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;
      
      if (settings.voiceId) {
        const voice = this.availableVoices.find(v => v.voiceURI === settings.voiceId);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(new Error(`Speech synthesis error: ${error.error}`));

      this.speechSynthesis.speak(utterance);

      setTimeout(() => {
        this.speechSynthesis!.cancel();
        resolve();
      }, 30000);
    });
  }

  private async speakWithCloudTTS(text: string, settings: VoiceSettings): Promise<void> {
    if (!this.dependencies.cloudTTSService) {
      throw new Error('Cloud TTS service not available');
    }

    await this.dependencies.cloudTTSService.speak(text, settings);
  }

  private async synthesizeAudio(text: string, voiceId: string): Promise<string> {
    const config = this.config as VoiceServiceConfig;
    
    if (config.enableCloudTTS && this.dependencies.cloudTTSService) {
      return await this.dependencies.cloudTTSService.generateAudio(text, voiceId);
    }

    return `data:audio/${config.audioFormat};base64,placeholder`;
  }

  private generateMessageText(alarm: Alarm): string {
    const time = formatTime(alarm.time);
    const label = alarm.label;
    const templates = VOICE_TEMPLATES[alarm.voiceMood] || VOICE_TEMPLATES['motivational'];
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    return template
      .replace('{time}', time)
      .replace('{label}', label);
  }

  private getVoiceSettingsForMood(mood: VoiceMood): VoiceSettings {
    const config = this.config as VoiceServiceConfig;
    
    const baseSettings: VoiceSettings = {
      rate: config.defaultRate,
      pitch: config.defaultPitch,
      volume: config.defaultVolume,
      emotionalIntensity: 1.0
    };

    switch (mood) {
      case 'drill-sergeant':
        return { ...baseSettings, rate: 1.2, pitch: 0.8, volume: 1.0, emotionalIntensity: 1.5 };
      case 'sweet-angel':
        return { ...baseSettings, rate: 0.9, pitch: 1.2, volume: 0.8, emotionalIntensity: 0.8 };
      case 'anime-hero':
        return { ...baseSettings, rate: 1.1, pitch: 1.1, volume: 1.0, emotionalIntensity: 1.3 };
      case 'savage-roast':
        return { ...baseSettings, rate: 1.0, pitch: 0.9, volume: 0.9, emotionalIntensity: 1.1 };
      case 'motivational':
        return { ...baseSettings, rate: 1.0, pitch: 1.0, volume: 1.0, emotionalIntensity: 1.2 };
      case 'gentle':
        return { ...baseSettings, rate: 0.8, pitch: 1.1, volume: 0.7, emotionalIntensity: 0.6 };
      default:
        return baseSettings;
    }
  }

  private async tryPremiumVoiceGeneration(alarm: Alarm, userId: string): Promise<string | null> {
    if (!this.dependencies.premiumVoiceService) return null;

    try {
      const hasAccess = await this.dependencies.premiumVoiceService.canAccessVoice(userId, alarm.voiceMood);
      if (!hasAccess) return null;

      return await this.dependencies.premiumVoiceService.generatePremiumAlarmMessage(alarm, userId);
      
    } catch (error) {
      this.handleError(error, 'Premium voice generation failed', { alarmId: alarm.id, userId });
      return null;
    }
  }

  private generateCacheKey(text: string, voiceMood: VoiceMood | string, userId?: string): string {
    const baseKey = `${text}_${voiceMood}`;
    return userId ? `${userId}_${baseKey}` : baseKey;
  }

  private isExpired(audioClip: AudioClip): boolean {
    return new Date() > audioClip.expiresAt;
  }

  private estimateAudioDuration(text: string): number {
    const wordsPerMinute = 200;
    const charactersPerWord = 5;
    const words = text.length / charactersPerWord;
    return (words / wordsPerMinute) * 60 * 1000;
  }

  private estimateAudioSize(text: string): number {
    const config = this.config as VoiceServiceConfig;
    const duration = this.estimateAudioDuration(text) / 1000;
    
    const bitrateMap = {
      low: 64,
      medium: 128,
      high: 256
    };
    
    const bitrate = bitrateMap[config.audioQuality];
    return (duration * bitrate * 1000) / 8;
  }

  private async cacheAudioClip(audioClip: AudioClip): Promise<void> {
    const config = this.config as VoiceServiceConfig;
    
    if (this.audioCache.size >= config.maxCacheSize) {
      await this.evictOldestCacheEntries();
    }

    this.audioCache.set(audioClip.id, audioClip);
    await this.cache.set(audioClip.id, audioClip, config.audioFileExpiry);
  }

  private async evictOldestCacheEntries(): Promise<void> {
    const config = this.config as VoiceServiceConfig;
    const entriesToRemove = Math.floor(config.maxCacheSize * 0.2);
    
    const sortedClips = Array.from(this.audioCache.values())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    const toRemove = sortedClips.slice(0, entriesToRemove);
    
    for (const clip of toRemove) {
      this.audioCache.delete(clip.id);
      await this.cache.delete(clip.id);
    }
  }

  private async cleanupExpiredAudioClips(): Promise<void> {
    const now = new Date();
    const expiredClips = Array.from(this.audioCache.values())
      .filter(clip => now > clip.expiresAt);
    
    for (const clip of expiredClips) {
      this.audioCache.delete(clip.id);
      await this.cache.delete(clip.id);
    }

    if (expiredClips.length > 0) {
      this.emit('voice:cache_cleaned', { cleanedCount: expiredClips.length });
    }
  }

  private async loadAudioClipsFromCache(): Promise<void> {
    try {
      const audioKeys = await this.cache.keys('audio_*');
      
      for (const key of audioKeys) {
        const audioClip = await this.cache.get<AudioClip>(key);
        if (audioClip && !this.isExpired(audioClip)) {
          this.audioCache.set(key, audioClip);
        }
      }
    } catch (error) {
      this.handleError(error, 'Failed to load audio clips from cache');
    }
  }

  private async saveAudioClipsToCache(): Promise<void> {
    try {
      const config = this.config as VoiceServiceConfig;
      
      for (const [key, audioClip] of this.audioCache) {
        if (!this.isExpired(audioClip)) {
          await this.cache.set(key, audioClip, config.audioFileExpiry);
        }
      }
    } catch (error) {
      this.handleError(error, 'Failed to save audio clips to cache');
    }
  }

  // ============================================================================
  // Testing Support Methods
  // ============================================================================

  public async reset(): Promise<void> {
    if (this.config.environment !== 'test') {
      throw new Error('Reset only allowed in test environment');
    }

    await this.clearVoiceCache();
  }

  public getTestState(): any {
    if (this.config.environment !== 'test') {
      throw new Error('Test state only available in test environment');
    }

    return {
      cachedClips: Array.from(this.audioCache.values()),
      availableVoices: this.availableVoices.length
    };
  }
}

// ============================================================================
// Factory and Exports
// ============================================================================

export const createVoiceService = (
  dependencies: VoiceServiceDependencies = {},
  config: Partial<VoiceServiceConfig> = {}
): EnhancedVoiceService => {
  const fullConfig: VoiceServiceConfig = {
    enabled: true,
    environment: config.environment || 'development',
    maxCacheSize: config.maxCacheSize || 100,
    audioFileExpiry: config.audioFileExpiry || 7 * 24 * 60 * 60 * 1000,
    preloadEnabled: config.preloadEnabled ?? true,
    preloadLimit: config.preloadLimit || 10,
    defaultRate: config.defaultRate || 1.0,
    defaultPitch: config.defaultPitch || 1.0,
    defaultVolume: config.defaultVolume || 0.9,
    enablePremiumVoices: config.enablePremiumVoices ?? true,
    enableWebSpeechAPI: config.enableWebSpeechAPI ?? true,
    enableCloudTTS: config.enableCloudTTS ?? false,
    cloudTTSProvider: config.cloudTTSProvider || 'elevenlabs',
    audioQuality: config.audioQuality || 'medium',
    audioFormat: config.audioFormat || 'mp3',
    ...config
  };

  return new EnhancedVoiceService(dependencies, fullConfig);
};

export const voiceService = createVoiceService();