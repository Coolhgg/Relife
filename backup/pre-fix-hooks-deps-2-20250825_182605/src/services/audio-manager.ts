/// <reference types="node" />
/// <reference lib="dom" />
import type { Alarm, VoiceMood } from '../types';
import type { CustomSound, Playlist, PlaylistSound } from './types/media';
import { formatTime } from '../utils';
import { TimeoutHandle } from '../types/timers';
import { _event } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
import { _config } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
import { error } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify

export interface AudioCacheEntry {
  id: string;
  type: 'tts' | 'audio_file' | 'web_audio';
  data: ArrayBuffer | string | null;
  metadata: AudioMetadata;
  cachedAt: Date;
  expiresAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AudioMetadata {
  duration?: number;
  format?: string;
  size?: number;
  voiceMood?: VoiceMood;
  alarmId?: string;
  soundId?: string;
  isPreloaded?: boolean;
  compressionLevel?: 'none' | 'light' | 'medium' | 'heavy';
}

export interface AudioLoadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed?: number; // bytes per second
  estimatedTimeRemaining?: number; // seconds
}

export interface AudioPreloadConfig {
  criticalAssets: string[];
  preloadDistance: number; // minutes before alarm
  maxCacheSize: number; // bytes
  compressionEnabled: boolean;
  priorityLoading: boolean;
  formatOptimizationEnabled: boolean;
  preferredFormat?: string;
  autoCompressionThreshold: number; // bytes - auto-compress files larger than this
}

export class AudioManager {
  private static instance: AudioManager | null = null;
  private audioContext: AudioContext | null = null;
  private cache: Map<string, AudioCacheEntry> = new Map();
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private loadingQueue: Map<string, Promise<AudioCacheEntry>> = new Map();
  private preloadConfig: AudioPreloadConfig;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private repeatInterval: TimeoutHandle | null = null;

  // Progressive loading for large files
  private progressCallbacks: Map<string, (progress: AudioLoadProgress) => void> =
    new Map();

  // Voice mood configurations (from enhanced voice service)
  private voiceMoodConfigs = {
    'drill-sergeant': { rate: 1.3, pitch: 0.7, volume: 1.0 },
    'sweet-angel': { rate: 0.9, pitch: 1.3, volume: 0.8 },
    'anime-hero': { rate: 1.2, pitch: 1.2, volume: 1.0 },
    'savage-roast': { rate: 1.0, pitch: 0.9, volume: 0.9 },
    motivational: { rate: 1.1, pitch: 1.0, volume: 1.0 },
    gentle: { rate: 0.8, pitch: 1.1, volume: 0.6 },
  };

  private constructor() {
    this.preloadConfig = {
      criticalAssets: [],
      preloadDistance: 10, // 10 minutes before alarm
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      compressionEnabled: true,
      priorityLoading: true,
      formatOptimizationEnabled: true,
      autoCompressionThreshold: 1024 * 1024, // 1MB
    };
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize IndexedDB for audio caching
      await this.initializeDB();

      // Initialize Web Audio Context
      await this.initializeAudioContext();

      // Initialize Speech Synthesis
      await this.initializeSpeechSynthesis();

      // Load cached audio entries
      await this.loadCachedEntries();

      this.isInitialized = true;
      console.log('AudioManager initialized successfully');
    } catch (_error) {
      console._error('Error initializing AudioManager:', _error);
    }
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AlarmAudioCache', 1);

      request.onerror = () => reject(request._error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (_event.target as IDBOpenDBRequest).result;

        // Create object store for audio cache
        if (!db.objectStoreNames.contains('audioCache')) {
          const store = db.createObjectStore('audioCache', { keyPath: 'id' });
          store.createIndex('type', 'type');
          store.createIndex('priority', 'priority');
          store.createIndex('cachedAt', 'cachedAt');
          store.createIndex('expiresAt', 'expiresAt');
        }
      };
    });
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Resume context if it's suspended (required for iOS)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (_error) {
      console.warn('Web Audio API not supported:', _error);
    }
  }

  private async initializeSpeechSynthesis(): Promise<void> {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Wait for voices to load
    if (speechSynthesis.getVoices().length === 0) {
      await new Promise<void>(resolve => {
        speechSynthesis.addEventListener(
          'voiceschanged',
          () => {
            resolve();
          },
          { once: true }
        );
      });
    }
  }

  private async loadCachedEntries(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['audioCache'], 'readonly');
    const store = transaction.objectStore('audioCache');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const entries = request.result as AudioCacheEntry[];
        entries.forEach(entry => {
          // Check if entry is expired
          if (entry.expiresAt && new Date() > entry.expiresAt) {
            this.removeCacheEntry(entry.id);
          } else {
            this.cache.set(entry.id, entry);
          }
        });
        console.log(`Loaded ${this.cache.size} cached audio entries`);
        resolve();
      };
      request.onerror = () => reject(request._error);
    });
  }

  // Lazy loading implementation
  async loadAudioFile(
    url: string,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      progressive?: boolean;
      onProgress?: (progress: AudioLoadProgress) => void;
      cacheKey?: string;
      compression?: 'none' | 'light' | 'medium' | 'heavy';
      optimizeFormat?: boolean;
      targetFormat?: string;
    } = {}
  ): Promise<AudioCacheEntry> {
    const cacheKey = options.cacheKey || url;

    // Check if already cached
    const cached = this.cache.get(cacheKey);
    if (cached && cached.data) {
      return cached;
    }

    // Check if already loading
    const existing = this.loadingQueue.get(cacheKey);
    if (existing) {
      return existing;
    }

    // Start loading
    const loadPromise = this.performLazyLoad(url, options, cacheKey);
    this.loadingQueue.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      this.loadingQueue.delete(cacheKey);
      return result;
    } catch (_error) {
      this.loadingQueue.delete(cacheKey);
      throw _error;
    }
  }

  private async performLazyLoad(
    url: string,
    options: any,
    cacheKey: string
  ): Promise<AudioCacheEntry> {
    const {
      priority = 'medium',
      progressive = true,
      onProgress,
      compression = 'light',
    } = options;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load audio: ${response.statusText}`);
      }

      const total = parseInt(response.headers.get('content-length') || '0');
      let loaded = 0;

      if (progressive && onProgress && total > 0) {
        // Progressive loading with progress tracking
        const reader = response.body?.getReader();
        const chunks: Uint8Array[] = [];

        if (reader) {
          const startTime = Date.now();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            loaded += value.length;

            const elapsed = (Date.now() - startTime) / 1000;
            const speed = loaded / elapsed;
            const remaining = (total - loaded) / speed;

            onProgress({
              loaded,
              total,
              percentage: (loaded / total) * 100,
              speed,
              estimatedTimeRemaining: remaining,
            });
          }

          // Combine chunks
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
          const combined = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }

          const audioBuffer = combined.buffer;

          // Apply format optimization if enabled
          let optimizedData = audioBuffer;
          if (
            this.preloadConfig.compressionEnabled &&
            options.optimizeFormat !== false
          ) {
            const originalFormat = this.detectAudioFormat(url);
            optimizedData = await this.optimizeAudioFormat(
              audioBuffer,
              originalFormat,
              options.targetFormat
            );
          }

          // Apply compression if requested
          const compressedData = await this.compressAudio(optimizedData, compression);

          const entry: AudioCacheEntry = {
            id: cacheKey,
            type: 'audio_file',
            data: compressedData,
            metadata: {
              size: compressedData.byteLength,
              format: this.detectAudioFormat(url),
              compressionLevel: compression,
              isPreloaded: false,
            },
            cachedAt: new Date(),
            priority,
          };

          await this.saveCacheEntry(entry);
          this.cache.set(cacheKey, entry);
          return entry;
        }
      }

      // Fallback: load entire file at once
      const arrayBuffer = await response.arrayBuffer();

      // Apply format optimization if enabled
      let optimizedData = arrayBuffer;
      if (this.preloadConfig.compressionEnabled && options.optimizeFormat !== false) {
        const originalFormat = this.detectAudioFormat(url);
        optimizedData = await this.optimizeAudioFormat(
          arrayBuffer,
          originalFormat,
          options.targetFormat
        );
      }

      const compressedData = await this.compressAudio(optimizedData, compression);

      const entry: AudioCacheEntry = {
        id: cacheKey,
        type: 'audio_file',
        data: compressedData,
        metadata: {
          size: compressedData.byteLength,
          format: this.detectAudioFormat(url),
          compressionLevel: compression,
          isPreloaded: false,
        },
        cachedAt: new Date(),
        priority,
      };

      await this.saveCacheEntry(entry);
      this.cache.set(cacheKey, entry);
      return entry;
    } catch (_error) {
      console.error('Error loading audio file:', _error);
      throw _error;
    }
  }

  // Critical asset preloading
  async preloadCriticalAssets(alarms: Alarm[]): Promise<void> {
    const now = new Date();
    const criticalAlarms = alarms.filter(alarm => {
      if (!alarm.enabled) return false;

      const alarmTime = this.parseAlarmTime(alarm.time);
      const timeUntilAlarm = alarmTime.getTime() - now.getTime();
      const minutesUntilAlarm = timeUntilAlarm / (1000 * 60);

      return (
        minutesUntilAlarm <= this.preloadConfig.preloadDistance && minutesUntilAlarm > 0
      );
    });

    console.log(`Preloading ${criticalAlarms.length} critical alarms`);

    // Preload TTS messages for critical alarms
    const ttsPromises = criticalAlarms.map(alarm => this.preloadTTSMessage(alarm));

    // Preload any custom sounds used by alarms
    const soundPromises = criticalAlarms
      .filter(alarm => (alarm as any).customSound)
      .map(alarm => this.preloadCustomSound((alarm as any).customSound));

    await Promise.allSettled([...ttsPromises, ...soundPromises]);
  }

  private async preloadTTSMessage(alarm: Alarm): Promise<void> {
    try {
      const cacheKey = `tts_${alarm.id}_${alarm.voiceMood}`;

      // Check if already cached
      if (this.cache.has(cacheKey)) {
        return;
      }

      const messageText = this.generateTTSMessage(alarm);

      // Pre-generate voice configuration
      const voiceConfig =
        this.voiceMoodConfigs[alarm.voiceMood] || this.voiceMoodConfigs['motivational'];

      const entry: AudioCacheEntry = {
        id: cacheKey,
        type: 'tts',
        data: messageText,
        metadata: {
          voiceMood: alarm.voiceMood,
          alarmId: alarm.id,
          isPreloaded: true,
        },
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        priority: 'critical',
      };

      await this.saveCacheEntry(entry);
      this.cache.set(cacheKey, entry);

      console.log(`Preloaded TTS message for alarm ${alarm.id}`);
    } catch (_error) {
      console._error('Error preloading TTS message:', _error);
    }
  }

  private async preloadCustomSound(sound: CustomSound): Promise<void> {
    try {
      await this.loadAudioFile(sound.fileUrl, {
        priority: 'critical',
        cacheKey: `sound_${sound.id}`,
        compression: 'light',
      });
      console.log(`Preloaded custom sound: ${sound.name}`);
    } catch (_error) {
      console._error('Error preloading custom sound:', _error);
    }
  }

  // Enhanced TTS with caching
  async playTTSMessage(alarm: Alarm, repeat: boolean = false): Promise<boolean> {
    await this.initialize();

    try {
      const cacheKey = `tts_${alarm.id}_${alarm.voiceMood}`;
      const cached = this.cache.get(cacheKey);

      let messageText: string;
      if (cached && cached.data && typeof cached.data === 'string') {
        messageText = cached.data;
      } else {
        messageText = this.generateTTSMessage(alarm);

        // Cache the message
        const entry: AudioCacheEntry = {
          id: cacheKey,
          type: 'tts',
          data: messageText,
          metadata: {
            voiceMood: alarm.voiceMood,
            alarmId: alarm.id,
            isPreloaded: false,
          },
          cachedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          priority: 'high',
        };

        await this.saveCacheEntry(entry);
        this.cache.set(cacheKey, entry);
      }

      return await this.speakText(messageText, alarm.voiceMood, repeat);
    } catch (_error) {
      console._error('Error playing TTS message:', _error);
      return false;
    }
  }

  private async speakText(
    text: string,
    mood: VoiceMood,
    repeat: boolean
  ): Promise<boolean> {
    if (!('speechSynthesis' in window)) {
      return false;
    }

    return new Promise(resolve => {
      try {
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;

        // Apply voice mood configuration
        const config =
          this.voiceMoodConfigs[mood] || this.voiceMoodConfigs['motivational'];
        utterance.rate = config.rate;
        utterance.pitch = config.pitch;
        utterance.volume = _config.volume;

        // Try to find appropriate voice
        const voices = speechSynthesis.getVoices();
        const voice = this.selectVoiceForMood(voices, mood);
        if (voice) utterance.voice = voice;

        utterance.onstart = () => {
          console.log('TTS started:', text.substring(0, 50) + '...');
        };

        utterance.onend = () => {
          console.log('TTS ended');
          this.currentUtterance = null;

          if (repeat) {
            // Set up repeating playback
            this.repeatInterval = setTimeout(() => {
              this.speakText(text, mood, true);
            }, 30000); // Repeat every 30 seconds
          }

          resolve(true);
        };

        utterance.onerror = event => {
          console.error('TTS _error:', _event._error);
          this.currentUtterance = null;
          resolve(false);
        };

        speechSynthesis.speak(utterance);

        // Fallback timeout
        setTimeout(() => {
          if (this.currentUtterance === utterance) {
            speechSynthesis.cancel();
            this.currentUtterance = null;
            resolve(false);
          }
        }, 15000);
      } catch (_error) {
        console._error('Error in TTS:', _error);
        resolve(false);
      }
    });
  }

  // Play audio files with Web Audio API
  async playAudioFile(
    url: string,
    options: {
      volume?: number;
      loop?: boolean;
      fadeIn?: number;
      fadeOut?: number;
      onEnded?: () => void;
    } = {}
  ): Promise<AudioBufferSourceNode | null> {
    await this.initialize();

    if (!this.audioContext) {
      console.warn('Web Audio API not available');
      return null;
    }

    try {
      // Load audio file (with lazy loading)
      const cacheEntry = await this.loadAudioFile(url, {
        priority: 'high',
        progressive: true,
      });

      if (!cacheEntry.data || !(cacheEntry.data instanceof ArrayBuffer)) {
        throw new Error('Invalid audio data');
      }

      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(
        cacheEntry.data.slice(0)
      );

      // Create source node
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Apply options
      const { volume = 1, loop = false, fadeIn = 0, fadeOut = 0, onEnded } = options;

      gainNode.gain.value = fadeIn > 0 ? 0 : volume;
      source.loop = loop;

      // Fade in
      if (fadeIn > 0) {
        gainNode.gain.linearRampToValueAtTime(
          volume,
          this.audioContext.currentTime + fadeIn
        );
      }

      // Fade out
      if (fadeOut > 0 && !loop) {
        const duration = audioBuffer.duration;
        gainNode.gain.linearRampToValueAtTime(
          0,
          this.audioContext.currentTime + duration - fadeOut
        );
      }

      // Set up ended callback
      if (onEnded) {
        source.onended = onEnded;
      }

      // Start playback
      source.start();

      return source;
    } catch (_error) {
      console._error('Error playing audio file:', _error);
      return null;
    }
  }

  // Fallback beep generation (from original implementation)
  async playFallbackBeep(
    pattern: 'single' | 'double' | 'triple' = 'single'
  ): Promise<void> {
    if (!this.audioContext) {
      console.warn('Web Audio API not available for fallback beep');
      return;
    }

    const frequencies = [800, 600, 1000];
    const beepCount = pattern === 'single' ? 1 : pattern === 'double' ? 2 : 3;

    for (let i = 0; i < beepCount; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequencies[i % frequencies.length];
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);

      oscillator.start(this.audioContext.currentTime + i * 0.6);
      oscillator.stop(this.audioContext.currentTime + 0.5 + i * 0.6);

      if (i < beepCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }
  }

  // Public method for custom sound preloading
  async preloadCustomSoundFile(sound: CustomSound): Promise<void> {
    try {
      await this.loadAudioFile(sound.fileUrl, {
        priority: 'critical',
        cacheKey: `sound_${sound.id}`,
        compression: 'light',
      });
      console.log(`Preloaded custom sound: ${sound.name}`);
    } catch (_error) {
      console.error('Error preloading custom sound:', _error);
      throw _error;
    }
  }

  // Public method for playing custom sounds
  async playCustomSound(
    sound: CustomSound,
    options: {
      volume?: number;
      loop?: boolean;
      fadeIn?: number;
      fadeOut?: number;
      onEnded?: () => void;
    } = {}
  ): Promise<AudioBufferSourceNode | null> {
    try {
      return await this.playAudioFile(sound.fileUrl, options);
    } catch (_error) {
      console._error('Error playing custom sound:', _error);
      return null;
    }
  }

  // Utility methods
  private generateTTSMessage(alarm: Alarm): string {
    const time = formatTime(alarm.time);
    const label = alarm.label;

    const templates = {
      'drill-sergeant': [
        `WAKE UP SOLDIER! It's ${time}! ${label}! NO EXCUSES!`,
        `DROP AND GIVE ME TWENTY! It's ${time} and time for ${label}!`,
        `MOVE IT MOVE IT! ${time} means ${label} time! GET UP NOW!`,
      ],
      'sweet-angel': [
        `Good morning sunshine! It's ${time} and time for ${label}. Have a beautiful day!`,
        `Rise and shine, dear! It's ${time}. Time to start your wonderful day with ${label}.`,
        `Sweet dreams are over! It's ${time} and your ${label} awaits. You've got this!`,
      ],
      'anime-hero': [
        `The power of friendship compels you! It's ${time}! Time for ${label}! Believe in yourself!`,
        `Your destiny awaits! It's ${time} and ${label} is calling! Never give up!`,
        `Transform and roll out! It's ${time}! Time to conquer ${label} with determination!`,
      ],
      'savage-roast': [
        `Oh look, sleeping beauty finally decided to join us. It's ${time} and your ${label} is waiting.`,
        `Well well well, it's ${time}. Time for ${label}. Hope you enjoyed your beauty sleep.`,
        `Rise and grind, sunshine. It's ${time} and ${label} won't do itself. Time to adult.`,
      ],
      motivational: [
        `Champions rise early! It's ${time} and time for ${label}! Today is your day to shine!`,
        `Success starts now! It's ${time}! Your ${label} is the first step to greatness!`,
        `Winners don't snooze! It's ${time}! Time to crush ${label} and own this day!`,
      ],
      gentle: [
        `Good morning! It's ${time}. Take your time, but please remember ${label} when you're ready.`,
        `Gentle wake-up call: it's ${time}. Your ${label} is waiting, but no rush.`,
        `Sweet morning! It's ${time} and time for ${label}. Hope you slept well.`,
      ],
    };

    const moodTemplates = templates[alarm.voiceMood] || templates['motivational'];
    const randomIndex = Math.floor(Math.random() * moodTemplates.length);
    return moodTemplates[randomIndex];
  }

  private selectVoiceForMood(
    voices: SpeechSynthesisVoice[],
    mood: VoiceMood
  ): SpeechSynthesisVoice | null {
    switch (mood) {
      case 'drill-sergeant':
        return (
          voices.find(
            voice =>
              voice.name.toLowerCase().includes('male') ||
              voice.name.toLowerCase().includes('alex') ||
              voice.name.toLowerCase().includes('david')
          ) || null
        );

      case 'sweet-angel':
      case 'gentle':
        return (
          voices.find(
            voice =>
              voice.name.toLowerCase().includes('female') ||
              voice.name.toLowerCase().includes('samantha') ||
              voice.name.toLowerCase().includes('victoria')
          ) || null
        );

      default:
        return null;
    }
  }

  private parseAlarmTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    // If the time has passed today, set for tomorrow
    if (date < new Date()) {
      date.setDate(date.getDate() + 1);
    }

    return date;
  }

  private detectAudioFormat(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      case 'ogg':
        return 'audio/ogg';
      case 'm4a':
        return 'audio/mp4';
      case 'aac':
        return 'audio/aac';
      default:
        return 'audio/unknown';
    }
  }

  private async compressAudio(
    audioBuffer: ArrayBuffer,
    level: 'none' | 'light' | 'medium' | 'heavy'
  ): Promise<ArrayBuffer> {
    if (level === 'none') return audioBuffer;

    try {
      // Use Web Audio API for compression
      if (!this.audioContext) {
        await this.initializeAudioContext();
      }

      if (!this.audioContext) {
        console.warn('Audio context not available for compression');
        return audioBuffer;
      }

      // Decode the audio data
      const decodedAudio = await this.audioContext.decodeAudioData(
        audioBuffer.slice(0)
      );

      // Apply compression based on level
      const compressionSettings = this.getCompressionSettings(level);
      const compressedAudio = await this.applyAudioCompression(
        decodedAudio,
        compressionSettings
      );

      // Re-encode to ArrayBuffer (simulated - in production use proper encoding libraries)
      const compressedBuffer = await this.encodeAudioBuffer(
        compressedAudio,
        compressionSettings
      );

      return compressedBuffer;
    } catch (_error) {
      console._error('Audio compression failed, returning original:', _error);
      return audioBuffer;
    }
  }

  private getCompressionSettings(level: 'light' | 'medium' | 'heavy') {
    const settings = {
      light: {
        sampleRate: 22050, // Reduced from 44.1kHz
        bitDepth: 16,
        channels: 1, // Mono
        quality: 0.8,
      },
      medium: {
        sampleRate: 16000, // Further reduced
        bitDepth: 16,
        channels: 1, // Mono
        quality: 0.6,
      },
      heavy: {
        sampleRate: 8000, // Phone quality
        bitDepth: 16,
        channels: 1, // Mono
        quality: 0.4,
      },
    };

    return settings[level];
  }

  private async applyAudioCompression(
    audioBuffer: AudioBuffer,
    settings: { sampleRate: number; channels: number; quality: number }
  ): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not available');

    const { sampleRate, channels } = settings;
    const originalSampleRate = audioBuffer.sampleRate;
    const originalChannels = audioBuffer.numberOfChannels;

    // Create a new buffer with compressed settings
    const compressedLength = Math.floor(
      audioBuffer.length * (sampleRate / originalSampleRate)
    );
    const compressedBuffer = this.audioContext.createBuffer(
      Math.min(channels, originalChannels),
      compressedLength,
      sampleRate
    );

    // Resample and mix down channels if needed
    for (let channel = 0; channel < compressedBuffer.numberOfChannels; channel++) {
      const originalChannelData = audioBuffer.getChannelData(
        Math.min(channel, originalChannels - 1)
      );
      const compressedChannelData = compressedBuffer.getChannelData(channel);

      // Simple linear resampling (in production, use proper resampling algorithms)
      for (let i = 0; i < compressedLength; i++) {
        const originalIndex = Math.floor(i * (audioBuffer.length / compressedLength));
        compressedChannelData[i] = originalChannelData[originalIndex] || 0;
      }
    }

    return compressedBuffer;
  }

  private async encodeAudioBuffer(
    audioBuffer: AudioBuffer,
    settings: { quality: number }
  ): Promise<ArrayBuffer> {
    // For production, this would use a proper audio encoder (e.g., LAME for MP3, OGG encoder, etc.)
    // For now, we simulate compression by reducing the data size

    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;

    // Create a simplified compressed format (16-bit PCM)
    const bytesPerSample = 2; // 16-bit
    const totalBytes = length * channels * bytesPerSample;
    const compressedBytes = Math.floor(totalBytes * settings.quality);

    const buffer = new ArrayBuffer(compressedBytes);
    const view = new DataView(buffer);

    // Convert float32 samples to 16-bit PCM with compression
    let offset = 0;
    const step = Math.max(
      1,
      Math.floor(length / (compressedBytes / (channels * bytesPerSample)))
    );

    for (let i = 0; i < length && offset < compressedBytes - 1; i += step) {
      for (
        let channel = 0;
        channel < channels && offset < compressedBytes - 1;
        channel++
      ) {
        const channelData = audioBuffer.getChannelData(channel);
        const sample = Math.max(-1, Math.min(1, channelData[i] || 0));
        const pcmSample = Math.floor(sample * 0x7fff);

        view.setInt16(offset, pcmSample, true);
        offset += 2;
      }
    }

    return buffer;
  }

  private async saveCacheEntry(entry: AudioCacheEntry): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['audioCache'], 'readwrite');
    const store = transaction.objectStore('audioCache');

    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request._error);
    });
  }

  private async removeCacheEntry(id: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['audioCache'], 'readwrite');
    const store = transaction.objectStore('audioCache');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        this.cache.delete(id);
        resolve();
      };
      request.onerror = () => reject(request._error);
    });
  }

  // Public utility methods
  stopAllAudio(): void {
    // Stop TTS
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    this.currentUtterance = null;

    // Clear repeat interval
    if (this.repeatInterval) {
      clearTimeout(this.repeatInterval);
      this.repeatInterval = null;
    }
  }

  async clearCache(): Promise<void> {
    this.cache.clear();

    if (this.db) {
      const transaction = this.db.transaction(['audioCache'], 'readwrite');
      const store = transaction.objectStore('audioCache');
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request._error);
      });
    }
  }

  getCacheStats(): {
    totalEntries: number;
    totalSize: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  } {
    const stats = {
      totalEntries: this.cache.size,
      totalSize: 0,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
    };

    this.cache.forEach(entry => {
      stats.totalSize += entry.metadata.size || 0;
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
      stats.byPriority[entry.priority] = (stats.byPriority[entry.priority] || 0) + 1;
    });

    return stats;
  }

  updatePreloadConfig(_config: Partial<AudioPreloadConfig>): void {
    this.preloadConfig = { ...this.preloadConfig, ..._config };
  }

  // Audio format optimization methods

  /**
   * Optimizes audio files for better loading performance
   * @param audioData - Raw audio data
   * @param originalFormat - Original audio format
   * @param targetFormat - Desired output format
   * @returns Optimized audio data
   */
  async optimizeAudioFormat(
    audioData: ArrayBuffer,
    originalFormat: string,
    targetFormat?: string
  ): Promise<ArrayBuffer> {
    try {
      // Determine optimal target format based on browser support and file size
      const optimalFormat =
        targetFormat ||
        this.determineOptimalFormat(originalFormat, audioData.byteLength);

      if (originalFormat === optimalFormat) {
        return audioData; // Already in optimal format
      }

      // Convert format using Web Audio API
      return await this.convertAudioFormat(audioData, originalFormat, optimalFormat);
    } catch (_error) {
      console._error('Audio format optimization failed:', _error);
      return audioData; // Return original on failure
    }
  }

  /**
   * Determines the optimal audio format based on file size and browser capabilities
   */
  private determineOptimalFormat(currentFormat: string, fileSize: number): string {
    // Check browser support for different formats
    const formatSupport = this.checkFormatSupport();

    // For large files, prefer more compressed formats
    if (fileSize > 5 * 1024 * 1024) {
      // 5MB+
      if (formatSupport.opus) return 'audio/opus';
      if (formatSupport.ogg) return 'audio/ogg';
      if (formatSupport.aac) return 'audio/aac';
    }

    // For medium files, balance quality and size
    if (fileSize > 1 * 1024 * 1024) {
      // 1MB+
      if (formatSupport.aac) return 'audio/aac';
      if (formatSupport.ogg) return 'audio/ogg';
    }

    // For small files or universal compatibility, use MP3
    if (formatSupport.mp3) return 'audio/mpeg';

    // Fallback to current format
    return currentFormat;
  }

  /**
   * Checks browser support for different audio formats
   */
  private checkFormatSupport(): Record<string, boolean> {
    const audio = document.createElement('audio');

    return {
      mp3: audio.canPlayType('audio/mpeg') !== '',
      wav: audio.canPlayType('audio/wav') !== '',
      ogg: audio.canPlayType('audio/ogg') !== '',
      aac: audio.canPlayType('audio/aac') !== '',
      opus: audio.canPlayType('audio/ogg; codecs="opus"') !== '',
      webm: audio.canPlayType('audio/webm') !== '',
    };
  }

  /**
   * Converts audio from one format to another
   */
  private async convertAudioFormat(
    audioData: ArrayBuffer,
    fromFormat: string,
    toFormat: string
  ): Promise<ArrayBuffer> {
    if (!this.audioContext) {
      await this.initializeAudioContext();
    }

    if (!this.audioContext) {
      throw new Error('Audio context not available for format conversion');
    }

    try {
      // Decode the source audio
      const audioBuffer = await this.audioContext.decodeAudioData(audioData.slice(0));

      // Re-encode in target format (simplified implementation)
      // In production, this would use format-specific encoders
      return await this.encodeToFormat(audioBuffer, toFormat);
    } catch (_error) {
      console._error(`Error converting from ${fromFormat} to ${toFormat}:`, _error);
      throw error;
    }
  }

  /**
   * Encodes audio buffer to a specific format
   */
  private async encodeToFormat(
    audioBuffer: AudioBuffer,
    format: string
  ): Promise<ArrayBuffer> {
    // This is a simplified implementation
    // In production, use proper audio encoding libraries like:
    // - LAME.js for MP3
    // - vorbis.js for OGG
    // - opus-recorder for Opus
    // - ffmpeg.wasm for comprehensive format support

    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;

    // Create WAV format as fallback (most universally supported)
    const buffer = new ArrayBuffer(44 + length * channels * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * channels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * channels * 2, true);

    // Audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < channels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        const pcmSample = Math.floor(sample * 0x7fff);
        view.setInt16(offset, pcmSample, true);
        offset += 2;
      }
    }

    return buffer;
  }

  /**
   * Analyzes audio file and suggests optimization
   */
  async analyzeAndOptimize(
    url: string,
    options: {
      maxSize?: number;
      preferredFormat?: string;
      compressionLevel?: 'none' | 'light' | 'medium' | 'heavy';
    } = {}
  ): Promise<{
    originalSize: number;
    optimizedSize: number;
    format: string;
    compressionApplied: string;
  }> {
    try {
      const response = await fetch(url);
      const originalData = await response.arrayBuffer();
      const originalFormat = this.detectAudioFormat(url);

      // Apply format optimization
      const formatOptimized = await this.optimizeAudioFormat(
        originalData,
        originalFormat,
        options.preferredFormat
      );

      // Apply compression
      const compressionLevel =
        options.compressionLevel ||
        (originalData.byteLength > 5 * 1024 * 1024
          ? 'heavy'
          : originalData.byteLength > 1 * 1024 * 1024
            ? 'medium'
            : 'light');

      const finalOptimized = await this.compressAudio(
        formatOptimized,
        compressionLevel
      );

      return {
        originalSize: originalData.byteLength,
        optimizedSize: finalOptimized.byteLength,
        format:
          options.preferredFormat ||
          this.determineOptimalFormat(originalFormat, originalData.byteLength),
        compressionApplied: compressionLevel,
      };
    } catch (_error) {
      console.error('Audio analysis and optimization failed:', _error);
      throw _error;
    }
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();
