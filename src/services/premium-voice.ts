<<<<<<< HEAD
import type { 
  User, 
  VoiceMood, 
  VoiceMoodConfig, 
  PremiumVoice, 
  VoicePersonality, 
  VoiceCloneRequest,
  Alarm,
  SubscriptionTier
} from '../types';
import { PremiumService } from './premium';
import { VoiceService } from './voice';
import { supabase } from './supabase';

export class PremiumVoiceService {
  private static instance: PremiumVoiceService;
  private static audioCache = new Map<string, string>();
  private static voiceCloneCache = new Map<string, Blob>();
  
  // Premium voice personalities with detailed characteristics
  private static readonly PREMIUM_PERSONALITIES: Record<string, VoicePersonality> = {
    'celebrity-chef': {
      id: 'celebrity-chef',
      name: 'Celebrity Chef',
      description: 'Wake up with culinary passion and gourmet motivation',
      characteristics: ['enthusiastic', 'passionate', 'creative', 'inspiring'],
      voiceSettings: { pitch: 1.0, rate: 1.1, volume: 0.9 },
      samplePhrases: [
        "Time to rise and whisk! Your morning masterpiece awaits!",
        "Wake up, chef! Today's special is success, seasoned with determination!"
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'lifestyle'
    },
    'zen-master': {
      id: 'zen-master',
      name: 'Zen Master',
      description: 'Find inner peace and mindful awakening',
      characteristics: ['calm', 'wise', 'centered', 'peaceful'],
      voiceSettings: { pitch: 0.8, rate: 0.7, volume: 0.7 },
      samplePhrases: [
        "Breathe deeply. The morning light brings new possibilities.",
        "Awaken gently, like a flower opening to the sun."
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'wellness'
    },
    'robot-companion': {
      id: 'robot-companion',
      name: 'Robot Companion',
      description: 'Friendly AI assistant with helpful efficiency',
      characteristics: ['helpful', 'precise', 'friendly', 'systematic'],
      voiceSettings: { pitch: 1.2, rate: 1.0, volume: 0.8 },
      samplePhrases: [
        "SYSTEM ALERT: Optimal wake time detected. Initializing human activation sequence.",
        "Good morning, human! Your productivity protocols are ready for execution."
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'tech'
    },
    'pirate-captain': {
      id: 'pirate-captain',
      name: 'Pirate Captain',
      description: 'Adventurous sea captain ready for treasure hunting',
      characteristics: ['adventurous', 'bold', 'charismatic', 'commanding'],
      voiceSettings: { pitch: 0.9, rate: 1.1, volume: 0.9 },
      samplePhrases: [
        "Ahoy there, matey! The sunrise brings new adventures!",
        "All hands on deck! Time to seize the day like treasure!"
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'adventure'
    },
    'space-commander': {
      id: 'space-commander',
      name: 'Space Commander',
      description: 'Galactic leader ready for interstellar missions',
      characteristics: ['commanding', 'futuristic', 'confident', 'strategic'],
      voiceSettings: { pitch: 1.0, rate: 1.0, volume: 1.0 },
      samplePhrases: [
        "Mission Control to sleepyhead: Time for launch sequence!",
        "Engage morning protocols! Your stellar day awaits, Commander!"
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'sci-fi'
    },
    'wise-mentor': {
      id: 'wise-mentor',
      name: 'Wise Mentor',
      description: 'Thoughtful guide offering wisdom and encouragement',
      characteristics: ['wise', 'supportive', 'patient', 'encouraging'],
      voiceSettings: { pitch: 0.9, rate: 0.9, volume: 0.8 },
      samplePhrases: [
        "Every master was once a beginner. Your journey starts now.",
        "The early bird doesn't just catch the worm, it catches opportunities."
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'wisdom'
    },
    'energetic-coach': {
      id: 'energetic-coach',
      name: 'Energetic Coach',
      description: 'High-energy fitness coach pumping you up',
      characteristics: ['energetic', 'motivating', 'upbeat', 'encouraging'],
      voiceSettings: { pitch: 1.1, rate: 1.2, volume: 1.0 },
      samplePhrases: [
        "LET'S GO CHAMPION! Time to crush this day!",
        "You're stronger than your excuses! Rise and DOMINATE!"
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'fitness'
    },
    'soothing-therapist': {
      id: 'soothing-therapist',
      name: 'Soothing Therapist',
      description: 'Gentle, caring voice for mental wellness',
      characteristics: ['gentle', 'caring', 'understanding', 'supportive'],
      voiceSettings: { pitch: 1.1, rate: 0.8, volume: 0.7 },
      samplePhrases: [
        "You're safe, you're loved, and today is full of possibilities.",
        "Take a deep breath. You have everything you need within you."
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'wellness'
    },
    'morning-dj': {
      id: 'morning-dj',
      name: 'Morning DJ',
      description: 'Radio personality bringing energy and music vibes',
      characteristics: ['entertaining', 'upbeat', 'charismatic', 'fun'],
      voiceSettings: { pitch: 1.0, rate: 1.1, volume: 0.9 },
      samplePhrases: [
        "GOOD MORNING listeners! You're tuned into your best life!",
        "This is your wake-up call on Life FM! Time to turn up the volume on success!"
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'entertainment'
    },
    'meditation-guide': {
      id: 'meditation-guide',
      name: 'Meditation Guide',
      description: 'Peaceful guide for mindful morning rituals',
      characteristics: ['peaceful', 'centered', 'mindful', 'calming'],
      voiceSettings: { pitch: 0.9, rate: 0.7, volume: 0.6 },
      samplePhrases: [
        "As you gently return to awareness, feel gratitude for this new day.",
        "Let your morning begin with intention and peaceful presence."
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'wellness'
    },
    'fitness-trainer': {
      id: 'fitness-trainer',
      name: 'Fitness Trainer',
      description: 'Professional trainer focused on health and strength',
      characteristics: ['disciplined', 'motivating', 'health-focused', 'encouraging'],
      voiceSettings: { pitch: 1.0, rate: 1.0, volume: 0.9 },
      samplePhrases: [
        "Your body is your temple! Time to honor it with movement!",
        "Champions train while others sleep in. You're a champion!"
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'fitness'
    },
    'life-coach': {
      id: 'life-coach',
      name: 'Life Coach',
      description: 'Empowering coach helping you reach your potential',
      characteristics: ['empowering', 'goal-focused', 'inspiring', 'strategic'],
      voiceSettings: { pitch: 1.0, rate: 0.9, volume: 0.8 },
      samplePhrases: [
        "Your future self is counting on the decisions you make today.",
        "Success isn't just about what you accomplish, but who you become."
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'personal-development'
    },
    'coffee-barista': {
      id: 'coffee-barista',
      name: 'Coffee Barista',
      description: 'Friendly coffee expert brewing motivation',
      characteristics: ['friendly', 'warm', 'energizing', 'welcoming'],
      voiceSettings: { pitch: 1.1, rate: 1.0, volume: 0.8 },
      samplePhrases: [
        "Good morning! Your daily blend of success is ready to brew!",
        "Rise and grind! Today's special is opportunity with a shot of determination!"
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'lifestyle'
    },
    'nature-guide': {
      id: 'nature-guide',
      name: 'Nature Guide',
      description: 'Outdoor enthusiast connecting you with natural rhythms',
      characteristics: ['peaceful', 'natural', 'grounding', 'inspiring'],
      voiceSettings: { pitch: 0.9, rate: 0.8, volume: 0.7 },
      samplePhrases: [
        "The forest awakens, birds sing, and nature calls you to rise.",
        "Like the sunrise over mountains, your day begins with natural beauty."
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'nature'
    },
    'time-traveler': {
      id: 'time-traveler',
      name: 'Time Traveler',
      description: 'Mysterious traveler from future dimensions',
      characteristics: ['mysterious', 'wise', 'futuristic', 'intriguing'],
      voiceSettings: { pitch: 1.0, rate: 0.9, volume: 0.8 },
      samplePhrases: [
        "Greetings from the future! Your timeline's most important moment starts now.",
        "The temporal nexus opens! This moment shapes your destiny!"
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'sci-fi'
    },
    'superhero': {
      id: 'superhero',
      name: 'Superhero',
      description: 'Heroic champion ready to save the day',
      characteristics: ['heroic', 'confident', 'inspiring', 'powerful'],
      voiceSettings: { pitch: 1.0, rate: 1.1, volume: 1.0 },
      samplePhrases: [
        "With great power comes great responsibility! Time to be someone's hero!",
        "The world needs heroes, and heroes don't sleep in! ASSEMBLE!"
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'adventure'
    },
    'wise-owl': {
      id: 'wise-owl',
      name: 'Wise Owl',
      description: 'Ancient wisdom with gentle nocturnal insight',
      characteristics: ['wise', 'gentle', 'thoughtful', 'knowledgeable'],
      voiceSettings: { pitch: 0.8, rate: 0.8, volume: 0.7 },
      samplePhrases: [
        "Hoot hoot! Wisdom whispers: early risers catch life's greatest treasures.",
        "The owl sees through darkness to dawn. Your vision becomes clear now."
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'wisdom'
    },
    'energetic-squirrel': {
      id: 'energetic-squirrel',
      name: 'Energetic Squirrel',
      description: 'Playful, high-energy forest friend',
      characteristics: ['playful', 'energetic', 'cheerful', 'busy'],
      voiceSettings: { pitch: 1.3, rate: 1.3, volume: 0.8 },
      samplePhrases: [
        "CHITTER CHATTER! Time to gather the nuts of success!",
        "Bounce bounce! The day is full of acorns to collect! Let's GO!"
      ],
      premiumTier: 'premium' as SubscriptionTier,
      category: 'fun'
    }
  };

  // Premium voice configurations for mood mapping
  private static readonly PREMIUM_VOICE_CONFIGS: Record<VoiceMood, VoiceMoodConfig> = {
    // Free voices
    'drill-sergeant': {
      id: 'drill-sergeant',
      name: 'Drill Sergeant',
      description: 'Military-style wake-up calls',
      icon: '🪖',
      color: '#8B4513',
      sample: 'WAKE UP SOLDIER! NO EXCUSES!'
    },
    'sweet-angel': {
      id: 'sweet-angel',
      name: 'Sweet Angel',
      description: 'Gentle, caring wake-up messages',
      icon: '👼',
      color: '#FFB6C1',
      sample: 'Good morning sunshine! Have a beautiful day!'
    },
    'anime-hero': {
      id: 'anime-hero',
      name: 'Anime Hero',
      description: 'Energetic hero with determination power',
      icon: '⚡',
      color: '#FF6B6B',
      sample: 'Believe in yourself! Your destiny awaits!'
    },
    'savage-roast': {
      id: 'savage-roast',
      name: 'Savage Roast',
      description: 'Sarcastic but motivating wake-up calls',
      icon: '🔥',
      color: '#FF4500',
      sample: 'Well well well, sleeping beauty decided to join us.'
    },
    'motivational': {
      id: 'motivational',
      name: 'Motivational',
      description: 'Classic inspirational speaker energy',
      icon: '💪',
      color: '#4CAF50',
      sample: 'Champions rise early! Today is your day to shine!'
    },
    'gentle': {
      id: 'gentle',
      name: 'Gentle',
      description: 'Soft, patient wake-up approach',
      icon: '🌸',
      color: '#E1BEE7',
      sample: 'Good morning! Take your time when you\'re ready.'
    },
    
    // Premium voices
    'celebrity-chef': {
      id: 'celebrity-chef',
      name: 'Celebrity Chef',
      description: 'Wake up with culinary passion and gourmet motivation',
      icon: '👨‍🍳',
      color: '#FF6347',
      sample: 'Time to rise and whisk! Your morning masterpiece awaits!'
    },
    'zen-master': {
      id: 'zen-master',
      name: 'Zen Master',
      description: 'Find inner peace and mindful awakening',
      icon: '🧘‍♂️',
      color: '#9C88FF',
      sample: 'Breathe deeply. The morning light brings new possibilities.'
    },
    'robot-companion': {
      id: 'robot-companion',
      name: 'Robot Companion',
      description: 'Friendly AI assistant with helpful efficiency',
      icon: '🤖',
      color: '#00BCD4',
      sample: 'SYSTEM ALERT: Optimal wake time detected. Initializing human activation.'
    },
    'pirate-captain': {
      id: 'pirate-captain',
      name: 'Pirate Captain',
      description: 'Adventurous sea captain ready for treasure hunting',
      icon: '🏴‍☠️',
      color: '#8B4513',
      sample: 'Ahoy there, matey! The sunrise brings new adventures!'
    },
    'space-commander': {
      id: 'space-commander',
      name: 'Space Commander',
      description: 'Galactic leader ready for interstellar missions',
      icon: '🚀',
      color: '#4A5568',
      sample: 'Mission Control to sleepyhead: Time for launch sequence!'
    },
    'wise-mentor': {
      id: 'wise-mentor',
      name: 'Wise Mentor',
      description: 'Thoughtful guide offering wisdom and encouragement',
      icon: '🎓',
      color: '#2C5530',
      sample: 'Every master was once a beginner. Your journey starts now.'
    },
    'energetic-coach': {
      id: 'energetic-coach',
      name: 'Energetic Coach',
      description: 'High-energy fitness coach pumping you up',
      icon: '🏋️‍♂️',
      color: '#FF5722',
      sample: 'LET\'S GO CHAMPION! Time to crush this day!'
    },
    'soothing-therapist': {
      id: 'soothing-therapist',
      name: 'Soothing Therapist',
      description: 'Gentle, caring voice for mental wellness',
      icon: '💙',
      color: '#81C784',
      sample: 'You\'re safe, you\'re loved, and today is full of possibilities.'
    },
    'drill-instructor': {
      id: 'drill-instructor',
      name: 'Drill Instructor',
      description: 'Intense military training motivation',
      icon: '⚔️',
      color: '#8B0000',
      sample: 'DROP AND GIVE ME TWENTY! Victory demands discipline!'
    },
    'motivational-speaker': {
      id: 'motivational-speaker',
      name: 'Motivational Speaker',
      description: 'Professional inspirational speaking style',
      icon: '🎤',
      color: '#FFD700',
      sample: 'Success is not a destination, it\'s a journey that starts NOW!'
    },
    'morning-dj': {
      id: 'morning-dj',
      name: 'Morning DJ',
      description: 'Radio personality bringing energy and music vibes',
      icon: '📻',
      color: '#FF9800',
      sample: 'GOOD MORNING listeners! You\'re tuned into your best life!'
    },
    'meditation-guide': {
      id: 'meditation-guide',
      name: 'Meditation Guide',
      description: 'Peaceful guide for mindful morning rituals',
      icon: '🕉️',
      color: '#8E24AA',
      sample: 'As you gently return to awareness, feel gratitude for this new day.'
    },
    'fitness-trainer': {
      id: 'fitness-trainer',
      name: 'Fitness Trainer',
      description: 'Professional trainer focused on health and strength',
      icon: '💪',
      color: '#4CAF50',
      sample: 'Your body is your temple! Time to honor it with movement!'
    },
    'life-coach': {
      id: 'life-coach',
      name: 'Life Coach',
      description: 'Empowering coach helping you reach your potential',
      icon: '🎯',
      color: '#3F51B5',
      sample: 'Your future self is counting on the decisions you make today.'
    },
    'coffee-barista': {
      id: 'coffee-barista',
      name: 'Coffee Barista',
      description: 'Friendly coffee expert brewing motivation',
      icon: '☕',
      color: '#8D6E63',
      sample: 'Good morning! Your daily blend of success is ready to brew!'
    },
    'nature-guide': {
      id: 'nature-guide',
      name: 'Nature Guide',
      description: 'Outdoor enthusiast connecting you with natural rhythms',
      icon: '🌲',
      color: '#4CAF50',
      sample: 'The forest awakens, birds sing, and nature calls you to rise.'
    },
    'time-traveler': {
      id: 'time-traveler',
      name: 'Time Traveler',
      description: 'Mysterious traveler from future dimensions',
      icon: '⏰',
      color: '#9C27B0',
      sample: 'Greetings from the future! Your timeline\'s most important moment starts now.'
    },
    'superhero': {
      id: 'superhero',
      name: 'Superhero',
      description: 'Heroic champion ready to save the day',
      icon: '🦸‍♂️',
      color: '#F44336',
      sample: 'With great power comes great responsibility! Time to be someone\'s hero!'
    },
    'wise-owl': {
      id: 'wise-owl',
      name: 'Wise Owl',
      description: 'Ancient wisdom with gentle nocturnal insight',
      icon: '🦉',
      color: '#8D6E63',
      sample: 'Hoot hoot! Wisdom whispers: early risers catch life\'s greatest treasures.'
    },
    'energetic-squirrel': {
      id: 'energetic-squirrel',
      name: 'Energetic Squirrel',
      description: 'Playful, high-energy forest friend',
      icon: '🐿️',
      color: '#FF5722',
      sample: 'CHITTER CHATTER! Time to gather the nuts of success!'
    },
    'custom': {
      id: 'custom',
      name: 'Custom Voice',
      description: 'Your personalized AI-cloned voice (Ultimate tier)',
      icon: '🎙️',
      color: '#E91E63',
      sample: 'This is your custom voice speaking directly to you!'
    }
  };

  private constructor() {}

  static getInstance(): PremiumVoiceService {
    if (!this.instance) {
      this.instance = new PremiumVoiceService();
    }
    return this.instance;
  }

  // Get all available voice moods with premium access control
  static async getAvailableVoices(userId: string): Promise<VoiceMoodConfig[]> {
    const userTier = await PremiumService.getInstance().getUserTier(userId);
    const allVoices = Object.values(this.PREMIUM_VOICE_CONFIGS);
    
    // Free tier gets basic voices only
    const freeVoices: VoiceMood[] = [
      'drill-sergeant', 'sweet-angel', 'anime-hero', 
      'savage-roast', 'motivational', 'gentle'
    ];

    if (userTier === 'free') {
      return allVoices.filter(voice => freeVoices.includes(voice.id));
    }

    // Premium and Ultimate get all voices
    return allVoices;
  }

  // Check if user can access specific voice
  static async canAccessVoice(userId: string, voiceMood: VoiceMood): Promise<boolean> {
    if (voiceMood === 'custom') {
      // Custom voices require Ultimate tier
      return await PremiumService.getInstance().hasFeatureAccess(userId, 'voice_cloning');
    }

    // Check if voice requires premium
    const freeVoices: VoiceMood[] = [
      'drill-sergeant', 'sweet-angel', 'anime-hero', 
      'savage-roast', 'motivational', 'gentle'
    ];

    if (freeVoices.includes(voiceMood)) {
      return true; // Free voice, always accessible
    }

    // Premium voice requires premium or ultimate tier
    return await PremiumService.getInstance().hasFeatureAccess(userId, 'custom_voices');
  }

  // Get voice personality information
  static getVoicePersonality(voiceMood: VoiceMood): VoicePersonality | null {
    return this.PREMIUM_PERSONALITIES[voiceMood] || null;
  }

  // Get voice configuration
  static getVoiceConfig(voiceMood: VoiceMood): VoiceMoodConfig {
    return this.PREMIUM_VOICE_CONFIGS[voiceMood];
  }

  // Generate enhanced premium alarm message with personality
  static async generatePremiumAlarmMessage(
    alarm: Alarm, 
    userId: string
  ): Promise<string | null> {
    // Check access to the voice
    const hasAccess = await this.canAccessVoice(userId, alarm.voiceMood);
    if (!hasAccess) {
      // Fall back to basic voice service
      return await VoiceService.generateAlarmMessage({
        ...alarm,
        voiceMood: 'motivational' // Safe fallback
      });
    }

    const cacheKey = `premium_${alarm.id}_${alarm.voiceMood}_${userId}`;
    
    // Check cache first
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    try {
      let message: string;
      
      if (alarm.voiceMood === 'custom') {
        // Use custom voice if available
        message = await this.generateCustomVoiceMessage(alarm, userId);
      } else {
        // Use premium personality-enhanced message
        message = this.generatePersonalityMessage(alarm);
      }

      // Generate high-quality TTS (in real app, this would call ElevenLabs/OpenAI TTS)
      const audioUrl = await this.generatePremiumTTS(message, alarm.voiceMood, userId);
      
      if (audioUrl) {
        this.audioCache.set(cacheKey, audioUrl);
        return audioUrl;
      }
    } catch (error) {
      console.error('Error generating premium alarm message:', error);
    }

    return null;
  }

  // Generate personality-based message using advanced templates
  private static generatePersonalityMessage(alarm: Alarm): string {
    const personality = this.getVoicePersonality(alarm.voiceMood);
    if (!personality) {
      // Fallback to basic voice service
      return this.generateBasicMessage(alarm);
    }

    // Use personality sample phrases or generate contextual message
    const randomPhrase = personality.samplePhrases[
      Math.floor(Math.random() * personality.samplePhrases.length)
    ];

    // Customize with alarm details
    const time = alarm.time;
    const label = alarm.label;
    
    // Advanced personality-based message generation
    if (personality.characteristics.includes('energetic')) {
      return `${randomPhrase} It's ${time} and time to DOMINATE ${label}!`;
    } else if (personality.characteristics.includes('gentle')) {
      return `${randomPhrase} It's ${time}, and your ${label} awaits whenever you're ready.`;
    } else if (personality.characteristics.includes('wise')) {
      return `${randomPhrase} The clock shows ${time}, and wisdom says ${label} is your next step forward.`;
    }

    return `${randomPhrase} Time: ${time}. Mission: ${label}. Let's make it happen!`;
  }

  // Generate basic message fallback
  private static generateBasicMessage(alarm: Alarm): string {
    const time = alarm.time;
    const label = alarm.label;
    return `Good morning! It's ${time} and time for ${label}. You've got this!`;
  }

  // Generate custom voice message using user's voice clone
  private static async generateCustomVoiceMessage(alarm: Alarm, userId: string): Promise<string> {
    try {
      // In a real app, this would load the user's voice clone from database
      const customVoice = await this.getUserCustomVoice(userId);
      if (!customVoice) {
        return this.generateBasicMessage(alarm);
      }

      // Generate personalized message using user's speaking patterns
      const personalizedMessage = await this.generatePersonalizedMessage(alarm, customVoice);
      return personalizedMessage;
    } catch (error) {
      console.error('Error generating custom voice message:', error);
      return this.generateBasicMessage(alarm);
    }
  }

  // Simulate premium TTS generation (would integrate with ElevenLabs/OpenAI in real app)
  private static async generatePremiumTTS(
    message: string, 
    voiceMood: VoiceMood, 
    userId: string
  ): Promise<string | null> {
    try {
      if (voiceMood === 'custom') {
        // Use custom voice clone
        return await this.generateCustomTTS(message, userId);
      }

      // Simulate API call to premium TTS service
      const voiceConfig = this.getVoiceConfig(voiceMood);
      const personality = this.getVoicePersonality(voiceMood);

      // In a real app, this would make actual API calls to:
      // - ElevenLabs for high-quality voices
      // - OpenAI TTS for natural speech
      // - Custom voice engines for personality-specific voices

      console.log(`Generating premium TTS for voice: ${voiceConfig.name}`);
      console.log(`Message: ${message}`);
      console.log(`Personality traits:`, personality?.characteristics);

      // Return null for now (would return actual audio URL in real app)
      return null;
    } catch (error) {
      console.error('Error generating premium TTS:', error);
      return null;
    }
  }

  // Custom TTS for voice cloning (Ultimate tier feature)
  private static async generateCustomTTS(message: string, userId: string): Promise<string | null> {
    try {
      // Check if user has voice clone available
      const hasVoiceClone = await this.hasUserVoiceClone(userId);
      if (!hasVoiceClone) {
        console.warn(`No voice clone found for user ${userId}`);
        return null;
      }

      // In a real app, this would:
      // 1. Load user's voice model from cloud storage
      // 2. Generate TTS using their cloned voice
      // 3. Apply their personal speaking patterns
      // 4. Return high-quality audio file URL

      console.log(`Generating custom TTS with user ${userId}'s voice clone`);
      console.log(`Message: ${message}`);
      
      return null; // Would return actual audio URL
    } catch (error) {
      console.error('Error generating custom TTS:', error);
      return null;
    }
  }

  // Voice cloning management
  static async createVoiceClone(userId: string, audioSamples: Blob[]): Promise<VoiceCloneRequest> {
    try {
      // Verify user has Ultimate tier
      const hasAccess = await PremiumService.getInstance().hasFeatureAccess(userId, 'voice_cloning');
      if (!hasAccess) {
        throw new Error('Voice cloning requires Ultimate subscription');
      }

      const cloneRequest: VoiceCloneRequest = {
        id: `clone_${userId}_${Date.now()}`,
        userId,
        audioSamples: audioSamples.map((blob, index) => ({
          id: `sample_${index}`,
          audioBlob: blob,
          duration: 0, // Would be calculated
          quality: 'pending'
        })),
        status: 'processing',
        createdAt: new Date(),
        estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      // Save to database
      await this.saveVoiceCloneRequest(cloneRequest);

      // Start processing (would trigger ML pipeline in real app)
      this.processVoiceClone(cloneRequest);

      return cloneRequest;
    } catch (error) {
      console.error('Error creating voice clone:', error);
      throw error;
    }
  }

  // Process voice clone (simulated ML pipeline)
  private static async processVoiceClone(request: VoiceCloneRequest): Promise<void> {
    try {
      console.log(`Processing voice clone for user ${request.userId}`);
      
      // In a real app, this would:
      // 1. Validate audio samples (quality, length, content)
      // 2. Send to AI voice cloning service (ElevenLabs, Resemble AI, etc.)
      // 3. Train custom voice model
      // 4. Validate and test generated voice
      // 5. Store voice model in cloud storage
      // 6. Update database with completion status

      // Simulate processing delay
      setTimeout(async () => {
        await this.completeVoiceClone(request.id);
      }, 5000); // 5 seconds for demo

    } catch (error) {
      console.error('Error processing voice clone:', error);
      await this.failVoiceClone(request.id, error.message);
    }
  }

  // Complete voice clone processing
  private static async completeVoiceClone(requestId: string): Promise<void> {
    try {
      // Update database with completion
      await supabase
        .from('voice_clones')
        .update({ 
          status: 'completed',
          completedAt: new Date().toISOString(),
          voiceModelUrl: `https://storage.example.com/voices/${requestId}.model`
        })
        .eq('id', requestId);

      console.log(`Voice clone ${requestId} completed successfully`);
    } catch (error) {
      console.error('Error completing voice clone:', error);
    }
  }

  // Fail voice clone processing
  private static async failVoiceClone(requestId: string, error: string): Promise<void> {
    try {
      await supabase
        .from('voice_clones')
        .update({ 
          status: 'failed',
          error: error,
          completedAt: new Date().toISOString()
        })
        .eq('requestId', requestId);

      console.log(`Voice clone ${requestId} failed: ${error}`);
    } catch (dbError) {
      console.error('Error updating failed voice clone:', dbError);
    }
  }

  // Utility methods
  private static async getUserCustomVoice(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('voice_clones')
        .select('*')
        .eq('userId', userId)
        .eq('status', 'completed')
        .order('createdAt', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error getting user custom voice:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error querying custom voice:', error);
      return null;
    }
  }

  private static async hasUserVoiceClone(userId: string): Promise<boolean> {
    const voice = await this.getUserCustomVoice(userId);
    return voice !== null;
  }

  private static async saveVoiceCloneRequest(request: VoiceCloneRequest): Promise<void> {
    try {
      const { error } = await supabase
        .from('voice_clones')
        .insert({
          id: request.id,
          userId: request.userId,
          status: request.status,
          createdAt: request.createdAt.toISOString(),
          estimatedCompletion: request.estimatedCompletion?.toISOString()
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving voice clone request:', error);
      throw error;
    }
  }

  private static async generatePersonalizedMessage(alarm: Alarm, customVoice: any): Promise<string> {
    // In a real app, this would analyze user's speaking patterns and generate 
    // personalized messages using their voice characteristics
    const time = alarm.time;
    const label = alarm.label;
    
    return `Hey there! It's ${time} and time for ${label}. This is your own voice speaking to you!`;
  }

  // Test premium voice
  static async testPremiumVoice(voiceMood: VoiceMood, userId: string): Promise<void> {
    const hasAccess = await this.canAccessVoice(userId, voiceMood);
    if (!hasAccess) {
      throw new Error('You need a premium subscription to test this voice');
    }

    const testAlarm: Alarm = {
      id: 'test',
      time: '07:00',
      label: 'Morning Workout',
      enabled: true,
      days: [1, 2, 3, 4, 5],
      voiceMood: voiceMood,
      snoozeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const message = this.generatePersonalityMessage(testAlarm);
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      const personality = this.getVoicePersonality(voiceMood);
      
      if (personality) {
        utterance.rate = personality.voiceSettings.rate;
        utterance.pitch = personality.voiceSettings.pitch;
        utterance.volume = personality.voiceSettings.volume;
      }
      
      speechSynthesis.speak(utterance);
    }
  }

  // Clear caches
  static clearCache(): void {
    this.audioCache.clear();
    this.voiceCloneCache.clear();
  }
}
  }
}