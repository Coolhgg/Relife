// AI-Enhanced Voice Service for Relife Smart Alarm
// Advanced voice synthesis, recognition, and natural language processing

import type { Alarm, VoiceMood, User } from '../types';
import { ErrorHandler } from './error-handler';
import PerformanceMonitor from './performance-monitor';
import { SupabaseService } from './supabase';

export interface VoicePersonality {
  mood: VoiceMood;
  characteristics: {
    energy: 'low' | 'medium' | 'high' | 'very_high';
    formality: 'casual' | 'semi_formal' | 'formal';
    empathy: 'low' | 'medium' | 'high';
    humor: 'none' | 'light' | 'moderate' | 'heavy';
    motivation: 'gentle' | 'encouraging' | 'assertive' | 'aggressive';
  };
  vocabulary: {
    greetings: string[];
    encouragements: string[];
    urgentPhrases: string[];
    compliments: string[];
  };
  speechPatterns: {
    rate: number;
    pitch: number;
    volume: number;
    pause_duration: number;
    emphasis_words: string[];
  };
}

export interface ContextualResponse {
  text: string;
  audioUrl?: string;
  emotion: 'neutral' | 'happy' | 'energetic' | 'calm' | 'urgent' | 'motivational';
  personalizations: string[];
  effectiveness_prediction: number; // 0-100
}

export interface VoiceLearningData {
  userId: string;
  voiceMood: VoiceMood;
  context: {
    timeOfDay: number;
    dayOfWeek: number;
    sleepQuality: number;
    responsiveness: number;
    environmentalFactors: any;
  };
  userResponse: {
    responseTime: number;
    dismissMethod: string;
    effectiveness_rating?: number;
    feedback?: string;
  };
  outcomeSuccess: boolean;
}

class VoiceAIEnhancedService {
  private static instance: VoiceAIEnhancedService;
  private performanceMonitor = PerformanceMonitor.getInstance();
  private personalities = new Map<VoiceMood, VoicePersonality>();
  private userLearningData = new Map<string, VoiceLearningData[]>();
  private contextualMemory = new Map<string, any>();
  private elevenlabsApiKey: string | null = null;
  private openaiApiKey: string | null = null;

  private constructor() {
    this.elevenlabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || null;
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
    this.initializePersonalities();
  }

  static getInstance(): VoiceAIEnhancedService {
    if (!VoiceAIEnhancedService.instance) {
      VoiceAIEnhancedService.instance = new VoiceAIEnhancedService();
    }
    return VoiceAIEnhancedService.instance;
  }

  /**
   * Initialize voice personalities with advanced characteristics
   */
  private initializePersonalities(): void {
    const personalities: [VoiceMood, VoicePersonality][] = [
      [
        'drill-sergeant',
        {
          mood: 'drill-sergeant',
          characteristics: {
            energy: 'very_high',
            formality: 'formal',
            empathy: 'low',
            humor: 'none',
            motivation: 'aggressive',
          },
          vocabulary: {
            greetings: [
              'ATTENTION!',
              'SOLDIER!',
              'WAKE UP NOW!',
              'RISE AND SHINE WARRIOR!',
            ],
            encouragements: [
              "YOU'VE GOT THIS!",
              'NO EXCUSES!',
              'MOVE IT!',
              'PUSH THROUGH!',
            ],
            urgentPhrases: [
              'TIME IS WASTING!',
              'GET UP NOW!',
              'NO DELAYS!',
              'MISSION TIME!',
            ],
            compliments: [
              'OUTSTANDING DISCIPLINE!',
              'EXCELLENT WORK!',
              'MISSION ACCOMPLISHED!',
            ],
          },
          speechPatterns: {
            rate: 1.3,
            pitch: 0.8,
            volume: 0.95,
            pause_duration: 200,
            emphasis_words: ['NOW', 'TIME', 'MOVE', 'UP', 'GO'],
          },
        },
      ],

      [
        'sweet-angel',
        {
          mood: 'sweet-angel',
          characteristics: {
            energy: 'low',
            formality: 'casual',
            empathy: 'high',
            humor: 'light',
            motivation: 'gentle',
          },
          vocabulary: {
            greetings: [
              'Good morning, sunshine!',
              'Rise and shine, beautiful!',
              'Hello there, sleepyhead!',
            ],
            encouragements: [
              'You can do this!',
              'I believe in you!',
              'Take your time, sweetie!',
            ],
            urgentPhrases: [
              "It's time, honey!",
              'Wakey wakey!',
              'The world needs you awake!',
            ],
            compliments: ["You're amazing!", 'Such a champion!', "You're doing great!"],
          },
          speechPatterns: {
            rate: 0.9,
            pitch: 1.3,
            volume: 0.7,
            pause_duration: 800,
            emphasis_words: ['sweetie', 'honey', 'beautiful', 'amazing'],
          },
        },
      ],

      [
        'anime-hero',
        {
          mood: 'anime-hero',
          characteristics: {
            energy: 'very_high',
            formality: 'casual',
            empathy: 'medium',
            humor: 'moderate',
            motivation: 'encouraging',
          },
          vocabulary: {
            greetings: [
              'The adventure begins!',
              "Hero, it's time!",
              'Your destiny awaits!',
            ],
            encouragements: [
              'Believe in yourself!',
              'Your power is unlimited!',
              'Go beyond your limits!',
            ],
            urgentPhrases: [
              'The battle starts now!',
              'Time to power up!',
              'Your moment has come!',
            ],
            compliments: [
              'Incredible power!',
              'True hero spirit!',
              'Amazing determination!',
            ],
          },
          speechPatterns: {
            rate: 1.2,
            pitch: 1.1,
            volume: 0.9,
            pause_duration: 300,
            emphasis_words: ['power', 'hero', 'destiny', 'believe', 'unlimited'],
          },
        },
      ],

      [
        'savage-roast',
        {
          mood: 'savage-roast',
          characteristics: {
            energy: 'medium',
            formality: 'casual',
            empathy: 'low',
            humor: 'heavy',
            motivation: 'assertive',
          },
          vocabulary: {
            greetings: [
              'Still sleeping? Seriously?',
              "Oh look who's finally moving!",
              'About time!',
            ],
            encouragements: [
              'At least try to pretend you care!',
              "Maybe today you'll surprise us!",
              'Low expectations, remember?',
            ],
            urgentPhrases: [
              'The day is basically over!',
              'Everyone else is already winning!',
              'Still in bed? Classic.',
            ],
            compliments: [
              'Wow, you actually did it!',
              'Not completely terrible!',
              'Better than expected!',
            ],
          },
          speechPatterns: {
            rate: 1.0,
            pitch: 0.9,
            volume: 0.85,
            pause_duration: 500,
            emphasis_words: ['seriously', 'really', 'actually', 'finally'],
          },
        },
      ],

      [
        'motivational',
        {
          mood: 'motivational',
          characteristics: {
            energy: 'high',
            formality: 'semi_formal',
            empathy: 'high',
            humor: 'light',
            motivation: 'encouraging',
          },
          vocabulary: {
            greetings: [
              'Time to achieve greatness!',
              'Your success story starts now!',
              'Ready to conquer the day?',
            ],
            encouragements: [
              "You're stronger than you think!",
              'Every step counts!',
              'Success is calling!',
            ],
            urgentPhrases: [
              'Opportunities are waiting!',
              'Your goals need you awake!',
              'Time to make it happen!',
            ],
            compliments: [
              'Incredible dedication!',
              'True champion mindset!',
              'Outstanding commitment!',
            ],
          },
          speechPatterns: {
            rate: 1.1,
            pitch: 1.0,
            volume: 0.85,
            pause_duration: 400,
            emphasis_words: [
              'success',
              'achieve',
              'greatness',
              'opportunity',
              'champion',
            ],
          },
        },
      ],

      [
        'gentle',
        {
          mood: 'gentle',
          characteristics: {
            energy: 'low',
            formality: 'casual',
            empathy: 'high',
            humor: 'light',
            motivation: 'gentle',
          },
          vocabulary: {
            greetings: [
              'Good morning, dear',
              'Time to gently wake up',
              'A peaceful morning begins',
            ],
            encouragements: [
              'Take it slow',
              "There's no rush",
              "You're doing wonderfully",
            ],
            urgentPhrases: ["When you're ready", 'Soft reminder', 'Gentle nudge'],
            compliments: ['So peaceful', 'Beautifully calm', 'Graceful awakening'],
          },
          speechPatterns: {
            rate: 0.8,
            pitch: 1.1,
            volume: 0.6,
            pause_duration: 1000,
            emphasis_words: ['gently', 'peaceful', 'calm', 'soft'],
          },
        },
      ],

      // === PREMIUM PERSONALITIES (Pro+ Subscription Required) ===

      [
        'demon-lord',
        {
          mood: 'demon-lord',
          characteristics: {
            energy: 'very_high',
            formality: 'formal',
            empathy: 'low',
            humor: 'heavy',
            motivation: 'aggressive',
          },
          vocabulary: {
            greetings: [
              'AWAKEN, MORTAL!',
              'Your eternal slumber ends NOW!',
              'Rise from the depths!',
              'The darkness commands you!',
            ],
            encouragements: [
              'Face your destiny!',
              'Embrace the chaos!',
              'Conquer your fears!',
              'Show no mercy to weakness!',
            ],
            urgentPhrases: [
              'THE UNDERWORLD AWAITS!',
              'Your soul is MINE!',
              'Bow before the darkness!',
              'Suffer the consequences!',
            ],
            compliments: [
              'Impressive, for a mortal!',
              'The darkness approves!',
              'You have pleased the abyss!',
              'Worthy of infernal praise!',
            ],
          },
          speechPatterns: {
            rate: 1.4,
            pitch: 0.6,
            volume: 1.0,
            pause_duration: 600,
            emphasis_words: ['MORTAL', 'DARKNESS', 'ETERNAL', 'ABYSS', 'INFERNAL'],
          },
        },
      ],

      [
        'ai-robot',
        {
          mood: 'ai-robot',
          characteristics: {
            energy: 'medium',
            formality: 'formal',
            empathy: 'low',
            humor: 'none',
            motivation: 'assertive',
          },
          vocabulary: {
            greetings: [
              'SYSTEM INITIATED. USER AWAKENING REQUIRED.',
              'PROCESSING: Wake-up protocol activated.',
              'ALERT: Sleep cycle terminated.',
              'BOOTING: Morning sequence initiated.',
            ],
            encouragements: [
              'EFFICIENCY PARAMETERS: Optimal.',
              'PERFORMANCE METRICS: Improving.',
              'PRODUCTIVITY ANALYSIS: Favorable.',
              'SYSTEM STATUS: Functional.',
            ],
            urgentPhrases: [
              'CRITICAL: Immediate response required.',
              'WARNING: Delay exceeding parameters.',
              'ERROR: User still in sleep mode.',
              'TIMEOUT: Wake sequence failing.',
            ],
            compliments: [
              'ANALYSIS: Performance satisfactory.',
              'EVALUATION: Mission accomplished.',
              'ASSESSMENT: Task completed successfully.',
              'CALCULATION: Optimal execution achieved.',
            ],
          },
          speechPatterns: {
            rate: 1.0,
            pitch: 0.9,
            volume: 0.8,
            pause_duration: 100,
            emphasis_words: ['SYSTEM', 'PROTOCOL', 'ANALYSIS', 'CRITICAL', 'ERROR'],
          },
        },
      ],

      [
        'comedian',
        {
          mood: 'comedian',
          characteristics: {
            energy: 'high',
            formality: 'casual',
            empathy: 'medium',
            humor: 'heavy',
            motivation: 'encouraging',
          },
          vocabulary: {
            greetings: [
              "Ladies and gentlemen, please welcome... someone who's still asleep!",
              'Good morning! This is your wake-up call... literally!',
              'Rise and shine! Time for the greatest show on Earth: your morning routine!',
              'Breaking news: Local person discovers they own an alarm clock!',
            ],
            encouragements: [
              "You're killing it! Well, maybe just your sleep schedule.",
              'Look at you go! Slowly... but still going!',
              "Hey, at least you're not a morning person... yet!",
              'Progress! You opened your eyes! Standing ovation!',
            ],
            urgentPhrases: [
              "The snooze button called - it's filing for divorce!",
              'Your bed is starting a support group for clingy relationships!',
              "Time to break up with your pillow - it's getting weird!",
              'The morning is here whether you like it or not!',
            ],
            compliments: [
              'You did it! The crowd goes wild! Well, the crowd is just me, but still!',
              'Standing ovation! From your alarm clock!',
              'Achievement unlocked: Basic human function!',
              "And that's how it's done, folks!",
            ],
          },
          speechPatterns: {
            rate: 1.2,
            pitch: 1.1,
            volume: 0.9,
            pause_duration: 700,
            emphasis_words: [
              'folks',
              'literally',
              'breaking',
              'achievement',
              'ovation',
            ],
          },
        },
      ],

      [
        'philosopher',
        {
          mood: 'philosopher',
          characteristics: {
            energy: 'low',
            formality: 'formal',
            empathy: 'high',
            humor: 'light',
            motivation: 'gentle',
          },
          vocabulary: {
            greetings: [
              'Consider this: another day of existence begins.',
              'Contemplate the beauty of consciousness returning.',
              'Behold, the eternal cycle of rest and awakening.',
              'Ponder this moment between dreams and reality.',
            ],
            encouragements: [
              'Each awakening is a choice to embrace being.',
              'The examined life includes examining your morning routine.',
              'Courage, dear soul, for today brings new wisdom.',
              "Life's greatest adventures often begin with small steps... like getting up.",
            ],
            urgentPhrases: [
              'Time, that mysterious river, flows onward.',
              'The universe patiently awaits your participation.',
              'Reality gently knocks upon the door of dreams.',
              'The day offers its gifts to those who rise.',
            ],
            compliments: [
              'Wisdom lies in the simple act of beginning.',
              'You have chosen the path of consciousness - admirable.',
              'In rising, you participate in the great human experience.',
              'Your awakening contributes to the symphony of existence.',
            ],
          },
          speechPatterns: {
            rate: 0.8,
            pitch: 0.9,
            volume: 0.7,
            pause_duration: 1200,
            emphasis_words: [
              'contemplate',
              'existence',
              'wisdom',
              'consciousness',
              'universe',
            ],
          },
        },
      ],
    ];

    personalities.forEach(([mood, personality]) => {
      this.personalities.set(mood, personality);
    });
  }

  /**
   * Generate contextual wake-up message with AI personalization
   */
  async generateContextualMessage(
    alarm: Alarm,
    user: User,
    context: {
      sleepQuality?: number;
      timeOfDay: number;
      weather?: any;
      calendar?: any;
      previousResponses?: any[];
    }
  ): Promise<ContextualResponse> {
    try {
      const startTime = performance.now();

      // Get user's learning data
      const learningData = await this.getUserLearningData(user.id);
      const personality =
        this.personalities.get(alarm.voiceMood) ||
        this.personalities.get('motivational')!;

      // Generate base message using personality
      let baseMessage = await this.generatePersonalizedMessage(
        alarm,
        user,
        personality,
        context,
        learningData
      );

      // Enhance with AI if available
      if (this.openaiApiKey && learningData.length > 5) {
        baseMessage = await this.enhanceWithAI(
          baseMessage,
          user,
          context,
          learningData
        );
      }

      // Add contextual personalizations
      const personalizations = this.generatePersonalizations(
        user,
        context,
        learningData
      );

      // Predict effectiveness
      const effectivenessPrediction = this.predictEffectiveness(
        alarm.voiceMood,
        context,
        learningData
      );

      // Generate audio if premium service available
      let audioUrl: string | undefined;
      if (this.elevenlabsApiKey && user.preferences?.subscription_tier !== 'free') {
        audioUrl = await this.generatePremiumAudio(baseMessage, personality, user.id);
      }

      const duration = performance.now() - startTime;
      this.performanceMonitor.trackCustomMetric(
        'contextual_message_generation',
        duration
      );

      return {
        text: baseMessage,
        audioUrl,
        emotion: this.getEmotionFromMood(alarm.voiceMood),
        personalizations,
        effectiveness_prediction: effectivenessPrediction,
      };
    } catch (error) {
      ErrorHandler.handleError(
        error as Error,
        'Failed to generate contextual message',
        { userId: user.id, alarmId: alarm.id }
      );

      // Fallback to simple message
      return {
        text: `Good morning! Time to wake up for ${alarm.label}`,
        emotion: 'neutral',
        personalizations: [],
        effectiveness_prediction: 50,
      };
    }
  }

  /**
   * Generate personalized message based on personality and context
   */
  private async generatePersonalizedMessage(
    alarm: Alarm,
    user: User,
    personality: VoicePersonality,
    context: any,
    learningData: VoiceLearningData[]
  ): Promise<string> {
    const timeOfDay = context.timeOfDay;
    const isWeekend = context.dayOfWeek === 0 || context.dayOfWeek === 6;

    // Select appropriate greeting based on time and personality
    let greeting = this.selectRandomFromArray(personality.vocabulary.greetings);

    // Add time-specific context
    if (timeOfDay < 6) {
      greeting = this.adjustForEarlyMorning(greeting, personality);
    } else if (timeOfDay > 9) {
      greeting = this.adjustForLateMorning(greeting, personality);
    }

    // Add encouragement based on learning data
    let encouragement = '';
    if (learningData.length > 0) {
      const avgResponseTime =
        learningData.reduce((sum, data) => sum + data.userResponse.responseTime, 0) /
        learningData.length;

      if (avgResponseTime > 60) {
        // User typically takes longer to respond
        encouragement = this.selectRandomFromArray(
          personality.vocabulary.urgentPhrases
        );
      } else {
        encouragement = this.selectRandomFromArray(
          personality.vocabulary.encouragements
        );
      }
    } else {
      encouragement = this.selectRandomFromArray(personality.vocabulary.encouragements);
    }

    // Add alarm-specific context
    const alarmContext = alarm.label
      ? `Time for ${alarm.label}!`
      : 'Time to start your day!';

    // Add weather context if available
    let weatherContext = '';
    if (context.weather) {
      weatherContext = this.generateWeatherContext(context.weather, personality);
    }

    // Add sleep quality context
    let sleepContext = '';
    if (context.sleepQuality !== undefined) {
      sleepContext = this.generateSleepQualityContext(
        context.sleepQuality,
        personality
      );
    }

    // Combine elements based on personality
    return this.combineMessageElements(
      greeting,
      encouragement,
      alarmContext,
      weatherContext,
      sleepContext,
      personality
    );
  }

  /**
   * Enhance message with OpenAI for premium users
   */
  private async enhanceWithAI(
    baseMessage: string,
    user: User,
    context: any,
    learningData: VoiceLearningData[]
  ): Promise<string> {
    try {
      if (!this.openaiApiKey) {
        return baseMessage;
      }

      const userPattern = this.analyzeUserPatterns(learningData);
      const contextSummary = this.summarizeContext(context);

      const prompt = `
        Enhance this wake-up message for maximum effectiveness:

        Base message: "${baseMessage}"

        User patterns:
        - Average response time: ${userPattern.avgResponseTime}s
        - Most effective times: ${userPattern.bestTimes.join(', ')}
        - Preferred wake-up style: ${userPattern.preferredStyle}
        - Success rate: ${userPattern.successRate}%

        Current context:
        ${contextSummary}

        Requirements:
        - Keep the same general tone and personality
        - Make it more personalized and effective
        - Keep it under 100 words
        - Include motivational elements that work for this user
        - Consider the time of day and context

        Enhanced message:
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json();
      const enhancedMessage = data.choices?.[0]?.message?.content?.trim();

      return enhancedMessage || baseMessage;
    } catch (error) {
      console.error('AI enhancement failed:', error);
      return baseMessage;
    }
  }

  /**
   * Generate premium audio using ElevenLabs
   */
  private async generatePremiumAudio(
    text: string,
    personality: VoicePersonality,
    userId: string
  ): Promise<string | undefined> {
    try {
      if (!this.elevenlabsApiKey) {
        return undefined;
      }

      // Get user's preferred voice or use default for personality
      const voiceId = await this.getOptimalVoiceId(personality.mood, userId);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenlabsApiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.8,
              similarity_boost: 0.8,
              style: 0.7,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('ElevenLabs API request failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cache audio for future use
      const cacheKey = `audio_${userId}_${this.hashString(text)}`;
      localStorage.setItem(cacheKey, audioUrl);

      this.performanceMonitor.trackCustomMetric('premium_audio_generated', 1);

      return audioUrl;
    } catch (error) {
      console.error('Premium audio generation failed:', error);
      return undefined;
    }
  }

  /**
   * Learn from user interactions
   */
  async learnFromInteraction(learningData: VoiceLearningData): Promise<void> {
    try {
      // Store learning data locally
      const userLearning = this.userLearningData.get(learningData.userId) || [];
      userLearning.push(learningData);

      // Keep only last 50 interactions
      if (userLearning.length > 50) {
        userLearning.splice(0, userLearning.length - 50);
      }

      this.userLearningData.set(learningData.userId, userLearning);

      // Store in database for cross-device learning
      await this.storeLearningDataInDatabase(learningData);

      // Update user voice preferences if there's a clear pattern
      await this.updateVoicePreferencesIfNeeded(learningData.userId);

      this.performanceMonitor.trackCustomMetric('voice_learning_data_stored', 1);
    } catch (error) {
      console.error('Failed to learn from interaction:', error);
    }
  }

  /**
   * Predict effectiveness of a voice message
   */
  private predictEffectiveness(
    voiceMood: VoiceMood,
    context: any,
    learningData: VoiceLearningData[]
  ): number {
    if (learningData.length === 0) {
      return 70; // Default prediction
    }

    // Filter similar contexts
    const similarContexts = learningData.filter(data => {
      const timeDiff = Math.abs(data.context.timeOfDay - context.timeOfDay);
      const dayMatch = data.context.dayOfWeek === context.dayOfWeek;
      return timeDiff <= 1 || dayMatch;
    });

    if (similarContexts.length === 0) {
      return 60; // Lower confidence without similar context
    }

    // Calculate average effectiveness for similar contexts with this voice mood
    const moodMatches = similarContexts.filter(data => data.voiceMood === voiceMood);

    if (moodMatches.length === 0) {
      return 50; // No data for this voice mood in similar context
    }

    const avgEffectiveness =
      moodMatches.reduce((sum, data) => {
        const effectiveness = data.outcomeSuccess
          ? Math.max(70, 100 - (data.userResponse.responseTime / 60) * 10)
          : 20;
        return sum + effectiveness;
      }, 0) / moodMatches.length;

    return Math.round(avgEffectiveness);
  }

  /**
   * Utility methods
   */
  private selectRandomFromArray(array: string[]): string {
    return array[Math.floor(Math.random() * array.length)];
  }

  private adjustForEarlyMorning(
    greeting: string,
    personality: VoicePersonality
  ): string {
    if (personality.characteristics.empathy === 'high') {
      return `I know it's early, but ${greeting.toLowerCase()}`;
    } else if (personality.characteristics.motivation === 'aggressive') {
      return `EARLY BIRD SPECIAL! ${greeting}`;
    }
    return greeting;
  }

  private adjustForLateMorning(
    greeting: string,
    personality: VoicePersonality
  ): string {
    if (personality.characteristics.humor === 'heavy') {
      return `Better late than never! ${greeting}`;
    } else if (personality.characteristics.motivation === 'aggressive') {
      return `LATE START! ${greeting} CATCH UP TIME!`;
    }
    return greeting;
  }

  private generateWeatherContext(weather: any, personality: VoicePersonality): string {
    if (!weather) return '';

    if (weather.condition === 'sunny') {
      return personality.characteristics.energy === 'high'
        ? 'The sun is shining bright for you!'
        : 'Beautiful sunny day awaits';
    } else if (weather.condition === 'rainy') {
      return personality.characteristics.empathy === 'high'
        ? 'Cozy rainy day perfect for a gentle start'
        : "Don't let the rain slow you down!";
    }

    return '';
  }

  private generateSleepQualityContext(
    sleepQuality: number,
    personality: VoicePersonality
  ): string {
    if (sleepQuality > 80) {
      return personality.vocabulary.compliments[0] + ' Great sleep quality!';
    } else if (sleepQuality < 50) {
      return personality.characteristics.empathy === 'high'
        ? "I know you didn't sleep well, take it easy"
        : 'Rough night? Time to power through!';
    }
    return '';
  }

  private combineMessageElements(
    greeting: string,
    encouragement: string,
    alarmContext: string,
    weatherContext: string,
    sleepContext: string,
    personality: VoicePersonality
  ): string {
    const elements = [
      greeting,
      encouragement,
      alarmContext,
      weatherContext,
      sleepContext,
    ].filter(element => element.trim().length > 0);

    // Combine based on personality speech patterns
    if (personality.characteristics.energy === 'very_high') {
      return elements.join(' ') + '!';
    } else if (personality.characteristics.formality === 'casual') {
      return elements.join('. ') + '.';
    } else {
      return elements.join(', ') + '.';
    }
  }

  private getEmotionFromMood(mood: VoiceMood): ContextualResponse['emotion'] {
    const emotionMap: Record<VoiceMood, ContextualResponse['emotion']> = {
      'drill-sergeant': 'urgent',
      'sweet-angel': 'calm',
      'anime-hero': 'energetic',
      'savage-roast': 'neutral',
      motivational: 'motivational',
      gentle: 'calm',
    };
    return emotionMap[mood] || 'neutral';
  }

  private async getUserLearningData(userId: string): Promise<VoiceLearningData[]> {
    // Try to get from local cache first
    const cached = this.userLearningData.get(userId);
    if (cached) {
      return cached;
    }

    // Load from database
    try {
      const { data, error } = await SupabaseService.getInstance()
        .client.from('voice_learning_data')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const learningData =
        data?.map((row: any) => ({
          // auto: implicit any{
          userId: row.user_id,
          voiceMood: row.voice_mood,
          context: row.context,
          userResponse: row.user_response,
          outcomeSuccess: row.outcome_success,
        })) || [];

      this.userLearningData.set(userId, learningData);
      return learningData;
    } catch (error) {
      console.error('Failed to load learning data:', error);
      return [];
    }
  }

  private async storeLearningDataInDatabase(
    learningData: VoiceLearningData
  ): Promise<void> {
    try {
      const { error } = await SupabaseService.getInstance()
        .client.from('voice_learning_data')
        .insert({
          user_id: learningData.userId,
          voice_mood: learningData.voiceMood,
          context: learningData.context,
          user_response: learningData.userResponse,
          outcome_success: learningData.outcomeSuccess,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to store learning data:', error);
    }
  }

  private async updateVoicePreferencesIfNeeded(userId: string): Promise<void> {
    const learningData = this.userLearningData.get(userId) || [];

    if (learningData.length < 10) return; // Need enough data

    // Analyze which voice mood is most effective
    const moodEffectiveness = new Map<VoiceMood, { success: number; total: number }>();

    learningData.forEach(data => {
      const current = moodEffectiveness.get(data.voiceMood) || { success: 0, total: 0 };
      current.total++;
      if (data.outcomeSuccess) {
        current.success++;
      }
      moodEffectiveness.set(data.voiceMood, current);
    });

    // Find most effective mood
    let bestMood: VoiceMood | null = null;
    let bestRate = 0;

    for (const [mood, stats] of moodEffectiveness.entries()) {
      if (stats.total >= 3) {
        // Need minimum attempts
        const rate = stats.success / stats.total;
        if (rate > bestRate) {
          bestRate = rate;
          bestMood = mood;
        }
      }
    }

    // Update user preferences if there's a clear winner
    if (bestMood && bestRate > 0.8) {
      try {
        const { error } = await SupabaseService.getInstance()
          .client.from('users')
          .update({
            preferences: {
              defaultVoiceMood: bestMood,
            },
          })
          .eq('id', userId);

        if (!error) {
          console.info(`Updated user ${userId} preferred voice mood to ${bestMood}`);
        }
      } catch (error) {
        console.error('Failed to update voice preferences:', error);
      }
    }
  }

  private analyzeUserPatterns(learningData: VoiceLearningData[]): any {
    const avgResponseTime =
      learningData.reduce((sum, data) => sum + data.userResponse.responseTime, 0) /
      learningData.length;

    // Find best performing times
    const timePerformance = new Map<number, { success: number; total: number }>();
    learningData.forEach(data => {
      const hour = data.context.timeOfDay;
      const current = timePerformance.get(hour) || { success: 0, total: 0 };
      current.total++;
      if (data.outcomeSuccess) current.success++;
      timePerformance.set(hour, current);
    });

    const bestTimes = Array.from(timePerformance.entries())
      .filter(([, stats]) => stats.total >= 2)
      .sort(([, a], [, b]) => b.success / b.total - a.success / a.total)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    const successRate =
      (learningData.filter(data => data.outcomeSuccess).length / learningData.length) *
      100;

    return {
      avgResponseTime: Math.round(avgResponseTime),
      bestTimes,
      preferredStyle: this.determinePreferredStyle(learningData),
      successRate: Math.round(successRate),
    };
  }

  private determinePreferredStyle(learningData: VoiceLearningData[]): string {
    const moodCounts = new Map<VoiceMood, TimeoutHandle>();
    learningData
      .filter(data => data.outcomeSuccess)
      .forEach(data => {
        moodCounts.set(data.voiceMood, (moodCounts.get(data.voiceMood) || 0) + 1);
      });

    const mostSuccessful = Array.from(moodCounts.entries()).sort(
      ([, a], [, b]) => b - a
    )[0];

    return mostSuccessful ? mostSuccessful[0] : 'motivational';
  }

  private summarizeContext(context: any): string {
    const parts = [];
    if (context.timeOfDay < 6) parts.push('Very early morning');
    else if (context.timeOfDay < 9) parts.push('Early morning');
    else if (context.timeOfDay < 12) parts.push('Late morning');
    else parts.push('Afternoon');

    if (context.sleepQuality !== undefined) {
      parts.push(`Sleep quality: ${context.sleepQuality}%`);
    }

    if (context.weather) {
      parts.push(`Weather: ${context.weather.condition}`);
    }

    return parts.join(', ');
  }

  private generatePersonalizations(
    user: User,
    context: any,
    learningData: VoiceLearningData[]
  ): string[] {
    const personalizations = [];

    // Add user name if available
    if (user.name) {
      personalizations.push(`Addressed as ${user.name}`);
    }

    // Add context-based personalizations
    if (context.sleepQuality > 80) {
      personalizations.push('Acknowledged good sleep quality');
    }

    if (learningData.length > 0) {
      const avgResponse =
        learningData.reduce((sum, data) => sum + data.userResponse.responseTime, 0) /
        learningData.length;
      if (avgResponse < 30) {
        personalizations.push('Quick responder style');
      } else {
        personalizations.push('Gentle approach for slower wake-up');
      }
    }

    return personalizations;
  }

  private async getOptimalVoiceId(mood: VoiceMood, userId: string): Promise<string> {
    // Map voice moods to ElevenLabs voice IDs (these would be configured)
    const voiceMap: Record<VoiceMood, string> = {
      'drill-sergeant': 'voice-id-drill-sergeant',
      'sweet-angel': 'voice-id-sweet-angel',
      'anime-hero': 'voice-id-anime-hero',
      'savage-roast': 'voice-id-savage-roast',
      motivational: 'voice-id-motivational',
      gentle: 'voice-id-gentle',
    };

    return voiceMap[mood] || voiceMap['motivational'];
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  }
}

export default VoiceAIEnhancedService;
