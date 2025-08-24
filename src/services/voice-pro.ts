/// <reference types="node" />
/// <reference lib="dom" />
import type { Alarm, VoiceMood } from '../types';
import { formatTime } from '../utils';
import { TimeoutHandle } from '../types/timers';

// Enhanced voice configuration types
export interface VoiceProvider {
  id: string;
  name: string;
  type: 'web-speech' | 'elevenlabs' | 'google-cloud' | 'azure' | 'amazon-polly';
  premium: boolean;
  languages: string[];
  voices: VoiceOption[];
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  accent?: string;
  preview?: string; // URL to preview audio
  quality: 'standard' | 'high' | 'premium';
  category: 'natural' | 'expressive' | 'professional' | 'casual';
}

export interface VoiceSettings {
  provider: string;
  voiceId: string;
  speed: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 2.0
  volume: number; // 0.0 - 1.0
  stability?: number; // For ElevenLabs (0.0 - 1.0)
  clarity?: number; // For ElevenLabs (0.0 - 1.0)
  style?: number; // For some providers (0.0 - 1.0)
}

export interface CachedVoiceMessage {
  id: string;
  alarmId: string;
  voiceMood: VoiceMood;
  audioUrl: string;
  text: string;
  duration: number;
  createdAt: Date;
  expiresAt: Date;
  provider: string;
  settings: VoiceSettings;
}

export interface RecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  intent?: 'dismiss' | 'snooze' | 'unknown';
  entities?: { [key: string]: string };
}

export class VoiceProService {
  private static audioCache = new Map<string, CachedVoiceMessage>();
  private static isInitialized = false;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static repeatInterval: TimeoutHandle | null = null;
  private static recognition: SpeechRecognition | null = null;

  // Provider configurations
  private static providers: VoiceProvider[] = [
    {
      id: 'web-speech',
      name: 'Browser Speech',
      type: 'web-speech',
      premium: false,
      languages: [
        'en-US',
        'en-GB',
        'es-ES',
        'fr-FR',
        'de-DE',
        'it-IT',
        'ja-JP',
        'ko-KR',
        'zh-CN',
      ],
      voices: [], // Populated dynamically
    },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      type: 'elevenlabs',
      premium: true,
      languages: [
        'en-US',
        'en-GB',
        'es-ES',
        'fr-FR',
        'de-DE',
        'it-IT',
        'pl-PL',
        'pt-BR',
      ],
      voices: [
        {
          id: '21m00Tcm4TlvDq8ikWAM',
          name: 'Rachel',
          gender: 'female',
          quality: 'premium',
          category: 'natural',
        },
        {
          id: 'AZnzlk1XvdvUeBnXmlld',
          name: 'Domi',
          gender: 'female',
          quality: 'premium',
          category: 'expressive',
        },
        {
          id: 'EXAVITQu4vr4xnSDxMaL',
          name: 'Bella',
          gender: 'female',
          quality: 'premium',
          category: 'professional',
        },
        {
          id: 'ErXwobaYiN019PkySvjV',
          name: 'Antoni',
          gender: 'male',
          quality: 'premium',
          category: 'natural',
        },
        {
          id: 'VR6AewLTigWG4xSOukaG',
          name: 'Arnold',
          gender: 'male',
          quality: 'premium',
          category: 'expressive',
        },
        {
          id: 'pNInz6obpgDQGcFmaJgB',
          name: 'Adam',
          gender: 'male',
          quality: 'premium',
          category: 'professional',
        },
        {
          id: 'yoZ06aMxZJJ28mfd3POQ',
          name: 'Sam',
          gender: 'neutral',
          quality: 'premium',
          category: 'casual',
        },
      ],
    },
  ];

  // Voice mood to voice ID mapping for different providers
  private static moodVoiceMappings: {
    [mood in VoiceMood]: { [provider: string]: string };
  } = {
    'drill-sergeant': {
      elevenlabs: 'VR6AewLTigWG4xSOukaG', // Arnold - expressive male
      'web-speech': 'male',
    },
    'sweet-angel': {
      elevenlabs: '21m00Tcm4TlvDq8ikWAM', // Rachel - natural female
      'web-speech': 'female',
    },
    'anime-hero': {
      elevenlabs: 'AZnzlk1XvdvUeBnXmlld', // Domi - expressive female
      'web-speech': 'female',
    },
    'savage-roast': {
      elevenlabs: 'ErXwobaYiN019PkySvjV', // Antoni - natural male
      'web-speech': 'male',
    },
    motivational: {
      elevenlabs: 'pNInz6obpgDQGcFmaJgB', // Adam - professional male
      'web-speech': 'male',
    },
    gentle: {
      elevenlabs: 'EXAVITQu4vr4xnSDxMaL', // Bella - professional female
      'web-speech': 'female',
    },
  };

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize web speech voices
      await this.loadWebSpeechVoices();

      // Check for premium voice service API keys
      const elevenLabsKey = localStorage.getItem('elevenlabs_api_key');
      if (elevenLabsKey) {
        await this.validateElevenLabsKey(elevenLabsKey);
      }

      // Initialize voice recognition
      this.initializeRecognition();

      // Load cached voice messages from IndexedDB
      await this.loadCachedMessages();

      this.isInitialized = true;
      console.log('Voice Pro service initialized successfully');
    } catch (error) {
      console.error('Error initializing Voice Pro service:', error);
      this.isInitialized = true; // Continue with fallback
    }
  }

  private static async loadWebSpeechVoices(): Promise<void> {
    if (!('speechSynthesis' in window)) return;

    // Wait for voices to load
    if (speechSynthesis.getVoices().length === 0) {
      await new Promise<void>(resolve => {
        const checkVoices = () => {
          if (speechSynthesis.getVoices().length > 0) {
            resolve();
          } else {
            setTimeout(checkVoices, 100);
          }
        };
        speechSynthesis.addEventListener('voiceschanged', () => resolve(), {
          once: true,
        });
        checkVoices();
      });
    }

    // Update web speech provider with available voices
    const webProvider = this.providers.find(p => p.id === 'web-speech');
    if (webProvider) {
      const voices = speechSynthesis.getVoices();
      webProvider.voices = voices.map((voice, index) => ({
        id: voice.voiceURI || `voice_${index}`,
        name: voice.name,
        gender: this.detectGender(voice.name),
        quality: voice.localService ? 'high' : 'standard',
        category: 'natural' as const,
      }));
    }
  }

  private static detectGender(voiceName: string): 'male' | 'female' | 'neutral' {
    const name = voiceName.toLowerCase();
    const femaleIndicators = [
      'female',
      'woman',
      'samantha',
      'victoria',
      'karen',
      'zira',
      'susan',
      'fiona',
    ];
    const maleIndicators = ['male', 'man', 'david', 'mark', 'daniel', 'alex', 'james'];

    if (femaleIndicators.some(indicator => name.includes(indicator))) return 'female';
    if (maleIndicators.some(indicator => name.includes(indicator))) return 'male';
    return 'neutral';
  }

  private static async validateElevenLabsKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error validating ElevenLabs API key:', error);
      return false;
    }
  }

  private static initializeRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;
    this.recognition.lang = 'en-US';
  }

  private static async loadCachedMessages(): Promise<void> {
    try {
      // Load cached messages from IndexedDB (implementation would go here)
      // For now, using localStorage as fallback
      const cached = localStorage.getItem('voice_cache');
      if (cached) {
        const messages: CachedVoiceMessage[] = JSON.parse(cached);
        messages.forEach(msg => {
          if (new Date() < msg.expiresAt) {
            this.audioCache.set(this.getCacheKey(msg.alarmId, msg.voiceMood), msg);
          }
        });
        console.log(`Loaded ${messages.length} cached voice messages`);
      }
    } catch (error) {
      console.error('Error loading cached messages:', error);
    }
  }

  static async generateAlarmMessage(
    alarm: Alarm,
    forceRegenerate = false
  ): Promise<string | null> {
    await this.initialize();

    const cacheKey = this.getCacheKey(alarm.id, alarm.voiceMood);

    // Check cache first (unless forcing regeneration)
    if (!forceRegenerate && this.audioCache.has(cacheKey)) {
      const cached = this.audioCache.get(cacheKey)!;
      if (new Date() < cached.expiresAt) {
        return cached.audioUrl;
      } else {
        this.audioCache.delete(cacheKey);
      }
    }

    try {
      const message = this.generateMessageText(alarm);
      const settings = this.getVoiceSettingsForMood(alarm.voiceMood);

      // Try premium providers first, fall back to web speech
      const providers = ['elevenlabs', 'web-speech'];

      for (const providerId of providers) {
        try {
          const audioUrl = await this.generateSpeech(message, settings, providerId);
          if (audioUrl) {
            // Cache the result
            const cachedMessage: CachedVoiceMessage = {
              id: this.generateId(),
              alarmId: alarm.id,
              voiceMood: alarm.voiceMood,
              audioUrl,
              text: message,
              duration: this.estimateDuration(message),
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
              provider: providerId,
              settings,
            };

            this.audioCache.set(cacheKey, cachedMessage);
            await this.persistCache();

            return audioUrl;
          }
        } catch (error) {
          console.error(`Error generating speech with ${providerId}:`, error);
          continue; // Try next provider
        }
      }
    } catch (error) {
      console.error('Error generating alarm message:', error);
    }

    return null;
  }

  private static async generateSpeech(
    text: string,
    settings: VoiceSettings,
    providerId: string
  ): Promise<string | null> {
    switch (providerId) {
      case 'elevenlabs':
        return await this.generateElevenLabsSpeech(text, settings);
      case 'web-speech':
        return await this.generateWebSpeech(text, settings);
      default:
        return null;
    }
  }

  private static async generateElevenLabsSpeech(
    text: string,
    settings: VoiceSettings
  ): Promise<string | null> {
    const apiKey = localStorage.getItem('elevenlabs_api_key');
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found');
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${settings.voiceId}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: settings.stability || 0.5,
              similarity_boost: settings.clarity || 0.5,
              style: settings.style || 0.0,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('ElevenLabs generation failed:', error);
      return null;
    }
  }

  private static async generateWebSpeech(
    text: string,
    settings: VoiceSettings
  ): Promise<string | null> {
    if (!('speechSynthesis' in window)) {
      return null;
    }

    // For web speech, we can't generate audio URLs, so we return a special identifier
    // The actual speech will be played directly using speechSynthesis.speak()
    return `web-speech:${btoa(text)}:${JSON.stringify(settings)}`;
  }

  static async playAlarmMessage(alarm: Alarm): Promise<boolean> {
    await this.initialize();

    try {
      const audioUrl = await this.generateAlarmMessage(alarm);
      if (!audioUrl) {
        return false;
      }

      if (audioUrl.startsWith('web-speech:')) {
        // Handle web speech directly
        return await this.playWebSpeech(audioUrl);
      } else {
        // Handle audio URL (from premium providers)
        return await this.playAudioUrl(audioUrl);
      }
    } catch (error) {
      console.error('Error playing alarm message:', error);
      return false;
    }
  }

  private static async playWebSpeech(encodedData: string): Promise<boolean> {
    try {
      const parts = encodedData.split(':');
      const text = atob(parts[1]);
      const settings: VoiceSettings = JSON.parse(parts[2]);

      speechSynthesis.cancel(); // Stop any existing speech

      const utterance = new SpeechSynthesisUtterance(text);
      this.configureWebSpeechUtterance(utterance, settings);

      return new Promise(resolve => {
        utterance.onend = () => resolve(true);
        utterance.onerror = () => resolve(false);

        speechSynthesis.speak(utterance);
        this.currentUtterance = utterance;

        // Fallback timeout
        setTimeout(() => resolve(false), 15000);
      });
    } catch (error) {
      console.error('Error playing web speech:', error);
      return false;
    }
  }

  private static async playAudioUrl(url: string): Promise<boolean> {
    try {
      const audio = new Audio(url);

      return new Promise(resolve => {
        audio.onended = () => resolve(true);
        audio.onerror = () => resolve(false);
        audio.oncanplaythrough = () => {
          audio.play().catch(() => resolve(false));
        };

        audio.load();

        // Fallback timeout
        setTimeout(() => {
          audio.pause();
          resolve(false);
        }, 30000);
      });
    } catch (error) {
      console.error('Error playing audio URL:', error);
      return false;
    }
  }

  static async startRepeatingAlarmMessage(
    alarm: Alarm,
    intervalMs: number = 30000
  ): Promise<() => void> {
    await this.initialize();

    let isActive = true;

    const playMessage = async () => {
      if (!isActive) return;

      try {
        await this.playAlarmMessage(alarm);
      } catch (error) {
        console.error('Error playing repeating message:', error);
      }
    };

    // Play immediately
    playMessage();

    // Set up interval for repeated playback
    this.repeatInterval = setInterval(() => {
      if (isActive) {
        playMessage();
      } else {
        clearInterval(this.repeatInterval!);
        this.repeatInterval = null;
      }
    }, intervalMs);

    // Return stop function
    return () => {
      isActive = false;
      if (this.repeatInterval) {
        clearInterval(this.repeatInterval);
        this.repeatInterval = null;
      }
      this.stopSpeech();
    };
  }

  static generateMessageText(alarm: Alarm): string {
    const time = formatTime(alarm.time);
    const label = alarm.label;

    const templates = {
      'drill-sergeant': [
        `WAKE UP SOLDIER! It's ${time}! ${label}! NO EXCUSES!`,
        `DROP AND GIVE ME TWENTY! It's ${time} and time for ${label}!`,
        `MOVE IT MOVE IT! ${time} means ${label} time! GET UP NOW!`,
        `ATTENTION! ${time} HOURS! Time for ${label}! MOVE YOUR BODY!`,
        `RISE AND GRIND WARRIOR! It's ${time}! ${label} awaits! NO SNOOZING!`,
      ],
      'sweet-angel': [
        `Good morning sunshine! It's ${time} and time for ${label}. Have a beautiful day!`,
        `Rise and shine, dear! It's ${time}. Time to start your wonderful day with ${label}.`,
        `Sweet dreams are over! It's ${time} and your ${label} awaits. You've got this!`,
        `Hello beautiful! It's ${time}. Time to embrace the day with ${label}. Sending you love!`,
        `Wake up sweetie! It's ${time} and ${label} is calling. You're amazing!`,
      ],
      'anime-hero': [
        `The power of friendship compels you! It's ${time}! Time for ${label}! Believe in yourself!`,
        `Your destiny awaits! It's ${time} and ${label} is calling! Never give up!`,
        `Transform and roll out! It's ${time}! Time to conquer ${label} with the power of determination!`,
        `The world needs you! It's ${time}! ${label} is your quest! Fight on!`,
        `Unlock your true potential! It's ${time}! ${label} will make you stronger! Plus ultra!`,
      ],
      'savage-roast': [
        `Oh look, sleeping beauty finally decided to join us. It's ${time} and your ${label} is waiting.`,
        `Well well well, it's ${time}. Time for ${label}. Hope you enjoyed your beauty sleep because you need it.`,
        `Rise and grind, sunshine. It's ${time} and ${label} won't do itself. Time to adult.`,
        `Congratulations on being fashionably late to ${time}. Your ${label} is judging you.`,
        `Hey sleepyhead, it's ${time}. ${label} called, it wants to know if you're still interested.`,
      ],
      motivational: [
        `Champions rise early! It's ${time} and time for ${label}! Today is your day to shine!`,
        `Success starts now! It's ${time}! Your ${label} is the first step to greatness!`,
        `Winners don't snooze! It's ${time}! Time to crush ${label} and own this day!`,
        `Every legend started with an alarm! It's ${time}! ${label} is your moment!`,
        `The grind starts now! It's ${time}! ${label} is calling your name! Let's go!`,
      ],
      gentle: [
        `Good morning! It's ${time}. Take your time, but please remember ${label} when you're ready.`,
        `Gentle wake-up call: it's ${time}. Your ${label} is waiting, but no rush.`,
        `Sweet morning! It's ${time} and time for ${label}. Hope you slept well.`,
        `Peaceful morning! It's ${time}. ${label} is gently calling. Rest well, then rise.`,
        `Soft reminder: it's ${time}. ${label} is here when you're ready. Take care.`,
      ],
    };

    const moodTemplates = templates[alarm.voiceMood] || templates['motivational'];
    const randomIndex = Math.floor(Math.random() * moodTemplates.length);

    return moodTemplates[randomIndex];
  }

  static async startVoiceRecognition(
    onResult: (result: RecognitionResult) => void,
    onError?: (error: string) => void
  ): Promise<() => void> {
    await this.initialize();

    if (!this.recognition) {
      onError?.('Speech recognition not supported');
      return () => {};
    }

    let isActive = true;

    this.recognition.onstart = () => {
      console.log('Voice recognition started');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!isActive) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.toLowerCase().trim();
        const confidence = result[0].confidence;

        const recognitionResult: RecognitionResult = {
          transcript,
          confidence,
          isFinal: result.isFinal,
          intent: this.parseIntent(transcript),
          entities: this.extractEntities(transcript),
        };

        onResult(recognitionResult);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      onError?.(event.error);
    };

    this.recognition.onend = () => {
      if (isActive) {
        // Auto-restart recognition if still active
        setTimeout(() => {
          if (isActive && this.recognition) {
            try {
              this.recognition.start();
            } catch (error) {
              console.error('Error restarting recognition:', error);
            }
          }
        }, 1000);
      }
    };

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      onError?.('Failed to start recognition');
    }

    // Return stop function
    return () => {
      isActive = false;
      if (this.recognition) {
        this.recognition.stop();
      }
    };
  }

  private static parseIntent(transcript: string): 'dismiss' | 'snooze' | 'unknown' {
    const dismissWords = [
      'stop',
      'dismiss',
      'turn off',
      'shut up',
      'quiet',
      'cancel',
      'end',
      'off',
    ];
    const snoozeWords = [
      'snooze',
      'five more minutes',
      'later',
      'wait',
      'sleep',
      'more time',
    ];

    if (dismissWords.some(word => transcript.includes(word))) {
      return 'dismiss';
    }
    if (snoozeWords.some(word => transcript.includes(word))) {
      return 'snooze';
    }
    return 'unknown';
  }

  private static extractEntities(transcript: string): { [key: string]: string } {
    const entities: { [key: string]: string } = {};

    // Extract time mentions
    const timeMatch = transcript.match(/(\d+)\s*(minute|minutes|hour|hours)/i);
    if (timeMatch) {
      entities.duration = timeMatch[0];
    }

    return entities;
  }

  private static getVoiceSettingsForMood(mood: VoiceMood): VoiceSettings {
    const baseSettings: { [mood in VoiceMood]: Partial<VoiceSettings> } = {
      'drill-sergeant': {
        speed: 1.3,
        pitch: 0.7,
        volume: 1.0,
        stability: 0.8,
        clarity: 0.9,
      },
      'sweet-angel': {
        speed: 0.9,
        pitch: 1.3,
        volume: 0.8,
        stability: 0.6,
        clarity: 0.8,
      },
      'anime-hero': {
        speed: 1.2,
        pitch: 1.2,
        volume: 1.0,
        stability: 0.4,
        clarity: 0.9,
      },
      'savage-roast': {
        speed: 1.0,
        pitch: 0.9,
        volume: 0.9,
        stability: 0.7,
        clarity: 0.7,
      },
      motivational: {
        speed: 1.1,
        pitch: 1.0,
        volume: 1.0,
        stability: 0.8,
        clarity: 0.9,
      },
      gentle: {
        speed: 0.8,
        pitch: 1.1,
        volume: 0.6,
        stability: 0.9,
        clarity: 0.6,
      },
    };

    const defaultProvider =
      localStorage.getItem('preferred_voice_provider') || 'elevenlabs';
    const voiceMapping = this.moodVoiceMappings[mood];
    const voiceId = voiceMapping[defaultProvider] || voiceMapping['elevenlabs'];

    return {
      provider: defaultProvider,
      voiceId,
      ...baseSettings[mood],
    } as VoiceSettings;
  }

  private static configureWebSpeechUtterance(
    utterance: SpeechSynthesisUtterance,
    settings: VoiceSettings
  ): void {
    const voices = speechSynthesis.getVoices();

    utterance.rate = settings.speed;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    // Try to find the preferred voice
    if (
      settings.voiceId &&
      settings.voiceId !== 'male' &&
      settings.voiceId !== 'female'
    ) {
      const voice = voices.find(
        v => v.voiceURI === settings.voiceId || v.name === settings.voiceId
      );
      if (voice) {
        utterance.voice = voice;
        return;
      }
    }

    // Fallback to gender-based selection
    const gender = settings.voiceId as 'male' | 'female';
    if (gender === 'female') {
      const femaleVoice = voices.find(
        voice => this.detectGender(voice.name) === 'female'
      );
      if (femaleVoice) utterance.voice = femaleVoice;
    } else if (gender === 'male') {
      const maleVoice = voices.find(voice => this.detectGender(voice.name) === 'male');
      if (maleVoice) utterance.voice = maleVoice;
    }
  }

  static stopSpeech(): void {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    this.currentUtterance = null;

    if (this.repeatInterval) {
      clearInterval(this.repeatInterval);
      this.repeatInterval = null;
    }
  }

  static async testVoice(mood: VoiceMood): Promise<void> {
    await this.initialize();

    const testAlarm: Alarm = {
      id: 'test',
      time: '07:00',
      label: 'Morning Workout',
      enabled: true,
      days: [1, 2, 3, 4, 5],
      voiceMood: mood,
      snoozeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.playAlarmMessage(testAlarm);
  }

  static getProviders(): VoiceProvider[] {
    return this.providers;
  }

  static getVoicesForMood(mood: VoiceMood): VoiceOption[] {
    const mapping = this.moodVoiceMappings[mood];
    const voices: VoiceOption[] = [];

    Object.entries(mapping).forEach(([providerId, voiceId]) => {
      const provider = this.providers.find(p => p.id === providerId);
      if (provider) {
        const voice = provider.voices.find(v => v.id === voiceId);
        if (voice) {
          voices.push(voice);
        }
      }
    });

    return voices;
  }

  static async clearCache(): Promise<void> {
    this.audioCache.clear();
    localStorage.removeItem('voice_cache');

    // Clear blob URLs to free memory
    this.audioCache.forEach(cached => {
      if (cached.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(cached.audioUrl);
      }
    });
  }

  static async setApiKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      localStorage.setItem(`${provider}_api_key`, apiKey);

      // Validate the key
      if (provider === 'elevenlabs') {
        return await this.validateElevenLabsKey(apiKey);
      }

      return true;
    } catch (error) {
      console.error('Error setting API key:', error);
      return false;
    }
  }

  // Helper methods
  private static getCacheKey(alarmId: string, voiceMood: VoiceMood): string {
    return `${alarmId}_${voiceMood}`;
  }

  private static generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private static estimateDuration(text: string): number {
    // Rough estimation: ~150 words per minute for speech
    const words = text.split(' ').length;
    return Math.ceil((words / 150) * 60 * 1000); // milliseconds
  }

  private static async persistCache(): Promise<void> {
    try {
      const cacheData = Array.from(this.audioCache.values());
      localStorage.setItem('voice_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error persisting cache:', error);
    }
  }
}

// Export main service
export const VoiceService = VoiceProService;
