import type { Alarm, VoiceMood } from '../types';
import { formatTime } from '../utils';
import { PremiumVoiceService } from './premium-voice';

export class VoiceService {
  private static audioCache = new Map<string, string>();
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if speech synthesis is supported
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        return;
      }

      this.isInitialized = true;
      console.log('Voice service initialized');
    } catch (error) {
      console.error('Error initializing voice service:', error);
    }
  }

  static async generateAlarmMessage(
    alarm: Alarm,
    userId?: string
  ): Promise<string | null> {
    await this.initialize();

    // If userId is provided, try premium voice service first
    if (userId) {
      try {
        const premiumMessage = await PremiumVoiceService.generatePremiumAlarmMessage(
          alarm,
          userId
        );
        if (premiumMessage) {
          return premiumMessage;
        }
      } catch (error) {
        console.warn('Premium voice service failed, falling back to basic:', error);
      }
    }

    const cacheKey = `${alarm.id}_${alarm.voiceMood}`;

    // Check cache first
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    try {
      const message = this.generateMessageText(alarm);
      const audioUrl = await this.textToSpeech(message, alarm.voiceMood);

      if (audioUrl) {
        this.audioCache.set(cacheKey, audioUrl);
        return audioUrl;
      }
    } catch (error) {
      console.error('Error generating alarm message:', error);
    }

    return null;
  }

  private static generateMessageText(alarm: Alarm): string {
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
        `Transform and roll out! It's ${time}! Time to conquer ${label} with the power of determination!`,
      ],
      'savage-roast': [
        `Oh look, sleeping beauty finally decided to join us. It's ${time} and your ${label} is waiting.`,
        `Well well well, it's ${time}. Time for ${label}. Hope you enjoyed your beauty sleep because you need it.`,
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

  private static async textToSpeech(
    text: string,
    voiceMood: VoiceMood
  ): Promise<string | null> {
    if (!('speechSynthesis' in window)) {
      return null;
    }

    return new Promise(resolve => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);

        // Configure voice based on mood
        this.configureVoiceForMood(utterance, voiceMood);

        utterance.onstart = () => {
          console.log('Speech synthesis started');
        };

        utterance.onend = () => {
          console.log('Speech synthesis ended');
          // For now, return null as we can't easily capture Web Speech API output
          // In a real app, you'd use a TTS service like ElevenLabs or Google Cloud TTS
          resolve(null);
        };

        utterance.onerror = event => {
          console.error('Speech synthesis error:', event);
          resolve(null);
        };

        speechSynthesis.speak(utterance);

        // Fallback timeout
        setTimeout(() => {
          resolve(null);
        }, 10000);
      } catch (error) {
        console.error('Error in text-to-speech:', error);
        resolve(null);
      }
    });
  }

  private static configureVoiceForMood(
    utterance: SpeechSynthesisUtterance,
    mood: VoiceMood
  ): void {
    const voices = speechSynthesis.getVoices();

    // Configure based on mood
    switch (mood) {
      case 'drill-sergeant':
        utterance.rate = 1.2;
        utterance.pitch = 0.8;
        utterance.volume = 1.0;
        break;
      case 'sweet-angel': {
        utterance.rate = 0.9;
        utterance.pitch = 1.2;
        utterance.volume = 0.8;
        // Prefer female voice if available
        const femaleVoice = voices.find(
          voice =>
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('samantha')
        );
        if (femaleVoice) utterance.voice = femaleVoice;
        break;
      }
      case 'anime-hero':
        utterance.rate = 1.1;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        break;
      case 'savage-roast':
        utterance.rate = 1.0;
        utterance.pitch = 0.9;
        utterance.volume = 0.9;
        break;
      case 'motivational':
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        break;
      case 'gentle':
        utterance.rate = 0.8;
        utterance.pitch = 1.1;
        utterance.volume = 0.7;
        break;
      default:
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;
    }
  }

  static async preloadAlarmMessages(alarms: Alarm[], userId?: string): Promise<void> {
    // Preload voice messages for all alarms
    const promises = alarms.map(alarm => this.generateAlarmMessage(alarm, userId));

    try {
      await Promise.allSettled(promises);
      console.log('Preloaded alarm messages');
    } catch (error) {
      console.error('Error preloading alarm messages:', error);
    }
  }

  static clearCache(): void {
    this.audioCache.clear();
  }

  static async testVoice(mood: VoiceMood, userId?: string): Promise<void> {
    await this.initialize();

    // If userId provided and it's a premium voice, use premium service
    if (userId) {
      try {
        const canAccess = await PremiumVoiceService.canAccessVoice(userId, mood);
        if (canAccess) {
          await PremiumVoiceService.testPremiumVoice(mood, userId);
          return;
        }
      } catch (error) {
        console.warn('Premium voice test failed, falling back to basic:', error);
      }
    }

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

    const message = this.generateMessageText(testAlarm);

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      this.configureVoiceForMood(utterance, mood);
      speechSynthesis.speak(utterance);
    }
  }
}
