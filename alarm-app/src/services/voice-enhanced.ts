import type { Alarm, VoiceMood } from '../types';
import { formatTime } from '../utils';

export class VoiceServiceEnhanced {
  private static audioCache = new Map<string, string>();
  private static isInitialized = false;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static repeatInterval: NodeJS.Timeout | null = null;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if speech synthesis is supported
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        return;
      }

      // Wait for voices to load
      if (speechSynthesis.getVoices().length === 0) {
        await new Promise<void>((resolve) => {
          speechSynthesis.addEventListener('voiceschanged', () => {
            resolve();
          }, { once: true });
        });
      }

      this.isInitialized = true;
      console.log('Enhanced voice service initialized');
    } catch (error) {
      console.error('Error initializing voice service:', error);
    }
  }

  static async playAlarmMessage(alarm: Alarm): Promise<boolean> {
    await this.initialize();

    try {
      const message = this.generateMessageText(alarm);
      return await this.textToSpeech(message, alarm.voiceMood);
    } catch (error) {
      console.error('Error playing alarm message:', error);
      return false;
    }
  }

  static async startRepeatingAlarmMessage(alarm: Alarm, intervalMs: number = 30000): Promise<() => void> {
    await this.initialize();
    
    let isActive = true;
    const message = this.generateMessageText(alarm);
    
    const playMessage = async () => {
      if (!isActive) return;
      
      try {
        await this.textToSpeech(message, alarm.voiceMood);
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
        `RISE AND GRIND WARRIOR! It's ${time}! ${label} awaits! NO SNOOZING!`
      ],
      'sweet-angel': [
        `Good morning sunshine! It's ${time} and time for ${label}. Have a beautiful day!`,
        `Rise and shine, dear! It's ${time}. Time to start your wonderful day with ${label}.`,
        `Sweet dreams are over! It's ${time} and your ${label} awaits. You've got this!`,
        `Hello beautiful! It's ${time}. Time to embrace the day with ${label}. Sending you love!`,
        `Wake up sweetie! It's ${time} and ${label} is calling. You're amazing!`
      ],
      'anime-hero': [
        `The power of friendship compels you! It's ${time}! Time for ${label}! Believe in yourself!`,
        `Your destiny awaits! It's ${time} and ${label} is calling! Never give up!`,
        `Transform and roll out! It's ${time}! Time to conquer ${label} with the power of determination!`,
        `The world needs you! It's ${time}! ${label} is your quest! Fight on!`,
        `Unlock your true potential! It's ${time}! ${label} will make you stronger! Plus ultra!`
      ],
      'savage-roast': [
        `Oh look, sleeping beauty finally decided to join us. It's ${time} and your ${label} is waiting.`,
        `Well well well, it's ${time}. Time for ${label}. Hope you enjoyed your beauty sleep because you need it.`,
        `Rise and grind, sunshine. It's ${time} and ${label} won't do itself. Time to adult.`,
        `Congratulations on being fashionably late to ${time}. Your ${label} is judging you.`,
        `Hey sleepyhead, it's ${time}. ${label} called, it wants to know if you're still interested.`
      ],
      'motivational': [
        `Champions rise early! It's ${time} and time for ${label}! Today is your day to shine!`,
        `Success starts now! It's ${time}! Your ${label} is the first step to greatness!`,
        `Winners don't snooze! It's ${time}! Time to crush ${label} and own this day!`,
        `Every legend started with an alarm! It's ${time}! ${label} is your moment!`,
        `The grind starts now! It's ${time}! ${label} is calling your name! Let's go!`
      ],
      'gentle': [
        `Good morning! It's ${time}. Take your time, but please remember ${label} when you're ready.`,
        `Gentle wake-up call: it's ${time}. Your ${label} is waiting, but no rush.`,
        `Sweet morning! It's ${time} and time for ${label}. Hope you slept well.`,
        `Peaceful morning! It's ${time}. ${label} is gently calling. Rest well, then rise.`,
        `Soft reminder: it's ${time}. ${label} is here when you're ready. Take care.`
      ]
    };

    const moodTemplates = templates[alarm.voiceMood] || templates['motivational'];
    const randomIndex = Math.floor(Math.random() * moodTemplates.length);
    
    return moodTemplates[randomIndex];
  }

  private static async textToSpeech(text: string, voiceMood: VoiceMood): Promise<boolean> {
    if (!('speechSynthesis' in window)) {
      return false;
    }

    return new Promise((resolve) => {
      try {
        // Cancel any existing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;
        
        // Configure voice based on mood
        this.configureVoiceForMood(utterance, voiceMood);
        
        utterance.onstart = () => {
          console.log('Speech synthesis started:', text.substring(0, 50) + '...');
        };

        utterance.onend = () => {
          console.log('Speech synthesis ended');
          this.currentUtterance = null;
          resolve(true);
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event.error);
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
        
      } catch (error) {
        console.error('Error in text-to-speech:', error);
        resolve(false);
      }
    });
  }

  private static configureVoiceForMood(utterance: SpeechSynthesisUtterance, mood: VoiceMood): void {
    const voices = speechSynthesis.getVoices();
    
    // Try to find appropriate voices for different moods
    let preferredVoice: SpeechSynthesisVoice | null = null;
    
    switch (mood) {
      case 'drill-sergeant':
        utterance.rate = 1.3;
        utterance.pitch = 0.7;
        utterance.volume = 1.0;
        // Prefer male voice with lower pitch
        preferredVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('male') ||
          voice.name.toLowerCase().includes('man') ||
          voice.name.toLowerCase().includes('david') ||
          voice.name.toLowerCase().includes('alex')
        ) || null;
        break;
        
      case 'sweet-angel':
        utterance.rate = 0.9;
        utterance.pitch = 1.3;
        utterance.volume = 0.8;
        // Prefer female voice with higher pitch
        preferredVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('woman') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('victoria') ||
          voice.name.toLowerCase().includes('karen')
        ) || null;
        break;
        
      case 'anime-hero':
        utterance.rate = 1.2;
        utterance.pitch = 1.2;
        utterance.volume = 1.0;
        // Any energetic voice
        break;
        
      case 'savage-roast':
        utterance.rate = 1.0;
        utterance.pitch = 0.9;
        utterance.volume = 0.9;
        // Slightly sarcastic tone
        break;
        
      case 'motivational':
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        // Clear, strong voice
        break;
        
      case 'gentle':
        utterance.rate = 0.8;
        utterance.pitch = 1.1;
        utterance.volume = 0.6;
        // Soft, calm voice
        preferredVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('woman')
        ) || null;
        break;
        
      default:
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
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

  static async generateAlarmMessage(alarm: Alarm): Promise<string | null> {
    await this.initialize();
    
    try {
      const cacheKey = `${alarm.id}_${alarm.voiceMood}`;
      
      // Check if we have cached audio URL
      if (this.audioCache.has(cacheKey)) {
        return this.audioCache.get(cacheKey)!;
      }
      
      // For web-based speech synthesis, we don't generate audio URLs
      // Instead, we'll return null to trigger the speech synthesis directly
      return null;
    } catch (error) {
      console.error('Error generating alarm message:', error);
      return null;
    }
  }

  static async preloadAlarmMessages(alarms: Alarm[]): Promise<void> {
    // Generate and cache message texts for all alarms
    alarms.forEach(alarm => {
      const cacheKey = `${alarm.id}_${alarm.voiceMood}`;
      if (!this.audioCache.has(cacheKey)) {
        const message = this.generateMessageText(alarm);
        this.audioCache.set(cacheKey, message);
      }
    });
    
    console.log(`Preloaded ${alarms.length} alarm messages`);
  }

  static clearCache(): void {
    this.audioCache.clear();
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
      updatedAt: new Date()
    };

    await this.playAlarmMessage(testAlarm);
  }

  static async requestSpeechPermissions(): Promise<boolean> {
    try {
      await this.initialize();
      
      // Check if speech synthesis is supported
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        return false;
      }

      // Test speech synthesis with silent utterance
      const testUtterance = new SpeechSynthesisUtterance('Voice test');
      testUtterance.volume = 0; // Silent test
      
      return new Promise((resolve) => {
        testUtterance.onend = () => resolve(true);
        testUtterance.onerror = () => resolve(false);
        
        speechSynthesis.speak(testUtterance);
        
        // Timeout fallback
        setTimeout(() => resolve(true), 1000);
      });
    } catch (error) {
      console.error('Error requesting speech permissions:', error);
      return false;
    }
  }

  static getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!('speechSynthesis' in window)) {
      return [];
    }
    return speechSynthesis.getVoices();
  }

  static isSpeaking(): boolean {
    if (!('speechSynthesis' in window)) {
      return false;
    }
    return speechSynthesis.speaking;
  }
}

// Export both for compatibility
export const VoiceService = VoiceServiceEnhanced;