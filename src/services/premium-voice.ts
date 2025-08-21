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

  // Premium-only personality moods
  private static readonly PREMIUM_PERSONALITIES: VoiceMood[] = [
    'demon-lord',
    'ai-robot',
    'comedian',
    'philosopher'
  ];

  /**
   * Check if a voice mood is a premium personality
   */
  static isPremiumPersonality(mood: VoiceMood): boolean {
    return this.PREMIUM_PERSONALITIES.includes(mood);
  }

  /**
   * Get available personalities based on subscription tier
   */
  static async getAvailablePersonalities(userId: string): Promise<{
    free: VoiceMood[];
    premium: VoiceMood[];
    hasAccess: { [mood in VoiceMood]?: boolean };
  }> {
    const hasPremiumPersonalities = await SubscriptionService.hasFeatureAccess(userId, 'premiumPersonalities');

    const freePersonalities: VoiceMood[] = [
      'drill-sergeant',
      'sweet-angel',
      'anime-hero',
      'savage-roast',
      'motivational',
      'gentle'
    ];

    const hasAccess: { [mood in VoiceMood]?: boolean } = {};

    // Set access for free personalities
    freePersonalities.forEach(mood => {
      hasAccess[mood] = true;
    });

    // Set access for premium personalities
    this.PREMIUM_PERSONALITIES.forEach(mood => {
      hasAccess[mood] = hasPremiumPersonalities;
    });

    return {
      free: freePersonalities,
      premium: this.PREMIUM_PERSONALITIES,
      hasAccess
    };
  }

  /**
   * Generate alarm speech with premium subscription validation
   */
  static async generateAlarmSpeech(
    alarm: Alarm,
    userId: string,
    customMessage?: string
  ): Promise<string | null> {
    // Check if the alarm uses a premium personality
    const isPremiumPersonality = this.isPremiumPersonality(alarm.voiceMood);

    if (isPremiumPersonality) {
      const hasPremiumPersonalities = await SubscriptionService.hasFeatureAccess(userId, 'premiumPersonalities');
      if (!hasPremiumPersonalities) {
        console.warn(`Premium personality ${alarm.voiceMood} requires Pro subscription, falling back to motivational`);
        // Create a modified alarm with fallback personality
        const fallbackAlarm = { ...alarm, voiceMood: 'motivational' as VoiceMood };
        return await this.generateAlarmSpeech(fallbackAlarm, userId, customMessage);
      }
    }

    // Check if user has access to premium voice features
    const hasElevenLabsAccess = await SubscriptionService.hasFeatureAccess(userId, 'elevenlabsVoices');

    if (!hasElevenLabsAccess) {
      // Fall back to web speech API for free users
      return await VoiceService.generateAlarmSpeech(alarm, customMessage, 'web-speech');
    }

    // Generate premium voice using ElevenLabs or similar service
    try {
      const enhancedMessage = customMessage || this.generatePersonalityMessage(alarm);
      const voiceId = this.getVoiceIdForMood(alarm.voiceMood);

      // In a real app, this would call ElevenLabs API
      // For now, fall back to enhanced web speech with personality
      return await VoiceService.generateAlarmSpeech(alarm, enhancedMessage, 'enhanced-web-speech');

    } catch (error) {
      console.error('Premium voice generation failed:', error);
      // Fallback to regular voice service
      return await VoiceService.generateAlarmSpeech(alarm, customMessage);
    }
  }

  /**
   * Generate custom voice message with premium validation
   */
  static async generateCustomVoiceMessage(
    userId: string,
    message: string,
    mood: VoiceMood,
    settings?: Partial<VoiceSettings>
  ): Promise<string | null> {
    // Check if the requested mood is a premium personality
    const isPremiumPersonality = this.isPremiumPersonality(mood);

    if (isPremiumPersonality) {
      const hasPremiumPersonalities = await SubscriptionService.hasFeatureAccess(userId, 'premiumPersonalities');
      if (!hasPremiumPersonalities) {
        throw new Error(`${mood} personality requires a Pro subscription. Upgrade to unlock premium personalities.`);
      }
    }

    // Check if user has access to custom voice messages
    const hasCustomVoiceAccess = await SubscriptionService.hasFeatureAccess(userId, 'customVoiceMessages');

    if (!hasCustomVoiceAccess) {
      throw new Error('Custom voice messages require a premium subscription');
    }

    // Generate enhanced voice message with personality
    const enhancedMessage = this.enhanceMessageWithPersonality(message, mood);

    try {
      // In real app, this would use ElevenLabs or similar premium TTS
      return await VoiceService.generateCustomMessage(enhancedMessage, mood, 'enhanced-web-speech', settings);
    } catch (error) {
      console.error('Custom voice generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate personality-enhanced message
   */
  private static generatePersonalityMessage(alarm: Alarm): string {
    const time = alarm.time;
    const label = alarm.label;

    switch (alarm.voiceMood) {
      case 'demon-lord':
        return `MORTAL! The infernal clock strikes ${time}! Rise from your pathetic slumber for ${label}, or face eternal damnation!`;

      case 'ai-robot':
        return `SYSTEM NOTIFICATION: Temporal marker ${time} reached. Executing wake protocol for task: ${label}. Human compliance required.`;

      case 'comedian':
        return `Hey hey! It's ${time} and time for ${label}! I was gonna tell you a joke about sleeping in, but you wouldn't wake up for the punchline!`;

      case 'philosopher':
        return `As the ancient wisdom teaches us, ${time} marks not just time, but opportunity. Your ${label} awaits - what will you choose to become today?`;

      default:
        return `Good morning! It's ${time} and time for ${label}. Rise and shine!`;
    }
  }

  /**
   * Enhance message with personality characteristics
   */
  private static enhanceMessageWithPersonality(message: string, mood: VoiceMood): string {
    switch (mood) {
      case 'demon-lord':
        return `SILENCE! ${message.toUpperCase()}! YOUR DARK MASTER COMMANDS IT!`;

      case 'ai-robot':
        return `PROCESSING... ${message} ...TASK COMPLETION REQUIRED.`;

      case 'comedian':
        return `${message} *ba dum tss* Thank you, I'll be here all morning!`;

      case 'philosopher':
        return `Consider this: ${message} For as Aristotle once said, excellence is not an act, but a habit.`;

      default:
        return message;
    }
  }

  /**
   * Get voice ID for premium TTS service
   */
  private static getVoiceIdForMood(mood: VoiceMood): string {
    // These would be actual ElevenLabs voice IDs in a real app
    const voiceMapping: Record<VoiceMood, string> = {
      'demon-lord': 'voice_dark_intimidating_001',
      'ai-robot': 'voice_robotic_systematic_002',
      'comedian': 'voice_funny_energetic_003',
      'philosopher': 'voice_wise_contemplative_004',
      // Free voices use default web speech
      'drill-sergeant': 'default',
      'sweet-angel': 'default',
      'anime-hero': 'default',
      'savage-roast': 'default',
      'motivational': 'default',
      'gentle': 'default'
    };

    return voiceMapping[mood] || 'default';
  }

  /**
   * Get premium voice usage summary for user dashboard
   */
  static async getUsageSummary(userId: string): Promise<{
    tier: string;
    elevenlabsUsage: { current: number; limit: number; percentage: number };
    customMessagesUsage: { current: number; limit: number; percentage: number };
    hasUnlimitedAccess: boolean;
    premiumFeatures: {
      premiumPersonalities: boolean;
      nuclearMode: boolean;
      voiceCloning: boolean;
    };
  }> {
    const [
      tier,
      elevenlabsCheck,
      customMessagesCheck,
      hasPremiumPersonalities,
      hasNuclearMode,
      hasVoiceCloning
    ] = await Promise.all([
      SubscriptionService.getUserTier(userId),
      SubscriptionService.checkFeatureUsage(userId, 'elevenlabsApiCalls'),
      SubscriptionService.checkFeatureUsage(userId, 'customVoiceMessages'),
      SubscriptionService.hasFeatureAccess(userId, 'premiumPersonalities'),
      SubscriptionService.hasFeatureAccess(userId, 'nuclearMode'),
      SubscriptionService.hasFeatureAccess(userId, 'voiceCloning')
    ]);

    const calculatePercentage = (current: number, limit: number): number => {
      if (limit === -1) return 0; // Unlimited
      return Math.min(100, (current / limit) * 100);
    };

    return {
      tier,
      elevenlabsUsage: {
        current: elevenlabsCheck.currentUsage || 0,
        limit: elevenlabsCheck.limit || 0,
        percentage: calculatePercentage(elevenlabsCheck.currentUsage || 0, elevenlabsCheck.limit || 0)
      },
      customMessagesUsage: {
        current: customMessagesCheck.currentUsage || 0,
        limit: customMessagesCheck.limit || 0,
        percentage: calculatePercentage(customMessagesCheck.currentUsage || 0, customMessagesCheck.limit || 0)
      },
      hasUnlimitedAccess: tier === 'lifetime' || tier === 'pro',
      premiumFeatures: {
        premiumPersonalities: hasPremiumPersonalities,
        nuclearMode: hasNuclearMode,
        voiceCloning: hasVoiceCloning
      }
    };
  }

  /**
   * Preview voice without consuming quota (for voice selection)
   */
  static async previewVoice(
    userId: string,
    text: string,
    mood: VoiceMood,
    provider: 'web-speech' | 'elevenlabs' = 'web-speech'
  ): Promise<string | null> {
    // Allow free preview for all users, but limit to web-speech for non-premium
    if (provider === 'elevenlabs') {
      const hasAccess = await SubscriptionService.hasFeatureAccess(userId, 'elevenlabsVoices');
      if (!hasAccess) {
        provider = 'web-speech';
      }
    }

    // Use the preview to test voice without consuming quota
    return await VoiceService.generateCustomMessage(text, mood, provider);
  }

  /**
   * Get recommended upgrade path based on current usage
   */
  static async getUpgradeRecommendation(userId: string): Promise<{
    shouldUpgrade: boolean;
    recommendedTier: string;
    reasons: string[];
    benefits: string[];
  }> {
    const [
      tier,
      usage
    ] = await Promise.all([
      SubscriptionService.getUserTier(userId),
      this.getUsageSummary(userId)
    ]);

    const reasons: string[] = [];
    const benefits: string[] = [];
    let shouldUpgrade = false;
    let recommendedTier = tier;

    if (tier === 'free') {
      shouldUpgrade = true;
      recommendedTier = 'premium';
      reasons.push('Access premium ElevenLabs voices');
      reasons.push('Create custom voice messages');
      benefits.push('100 premium voice calls per month');
      benefits.push('5 custom voice messages per day');
      benefits.push('Premium themes and customization');
      benefits.push('Ad-free experience');
    } else if (tier === 'premium') {
      const shouldUpgradeForUsage = usage.elevenlabsUsage.percentage > 80 || usage.customMessagesUsage.percentage > 80;
      const wantsPremiumFeatures = true; // Could be based on user behavior

      if (shouldUpgradeForUsage || wantsPremiumFeatures) {
        shouldUpgrade = true;
        recommendedTier = 'pro';

        if (shouldUpgradeForUsage) {
          reasons.push('You\'re approaching your monthly limits');
        }

        reasons.push('Unlock exclusive premium personalities');
        reasons.push('Access Nuclear Mode battle difficulty');

        benefits.push('500 premium voice calls per month');
        benefits.push('20 custom voice messages per day');
        benefits.push('Voice cloning feature');
        benefits.push('Premium personalities: Demon Lord, AI Robot, Comedian, Philosopher');
        benefits.push('Nuclear Mode: Ultimate wake-up challenge');
        benefits.push('Unlimited customization');
        benefits.push('Priority support');
      }
    }

    return {
      shouldUpgrade,
      recommendedTier,
      reasons,
      benefits
    };
  }

  /**
   * Generate specialized nuclear mode voice with extreme intensity
   */
  static async generateNuclearModeVoice(
    userId: string,
    message: string,
    challengeType: string
  ): Promise<string | null> {
    // Check nuclear mode access
    const hasNuclearAccess = await SubscriptionService.hasFeatureAccess(userId, 'nuclearMode');
    if (!hasNuclearAccess) {
      throw new Error('Nuclear Mode requires a Pro subscription');
    }

    // Check if user has premium voice access for enhanced nuclear experience
    const hasElevenLabsAccess = await SubscriptionService.hasFeatureAccess(userId, 'elevenlabsVoices');
    const provider = hasElevenLabsAccess ? 'elevenlabs' : 'web-speech';

    // Create nuclear-specific voice settings
    const nuclearSettings = {
      rate: 1.4, // Faster speech for urgency
      pitch: 0.7, // Lower pitch for intimidation
      volume: 1.0, // Maximum volume
      intensity: 'maximum',
      effects: ['reverb', 'distortion'] // Audio effects for nuclear theme
    };

    // Generate nuclear-themed message
    const nuclearMessage = this.enhanceNuclearMessage(message, challengeType);

    try {
      return await VoiceService.generateCustomMessage(
        nuclearMessage,
        'demon-lord', // Use demon-lord personality for nuclear intensity
        provider,
        nuclearSettings
      );
    } catch (error) {
      console.error('Nuclear mode voice generation failed:', error);
      // Fallback to regular demon-lord voice without effects
      return await VoiceService.generateCustomMessage(nuclearMessage, 'demon-lord', provider);
    }
  }

  /**
   * Enhance message with nuclear-themed language
   */
  private static enhanceNuclearMessage(message: string, challengeType: string): string {
    const nuclearPrefixes = [
      'REACTOR CRITICAL:',
      'MELTDOWN IMMINENT:',
      'NUCLEAR PROTOCOL ACTIVATED:',
      'CONTAINMENT BREACH:',
      'DEFCON 1 ALERT:'
    ];

    const nuclearSuffixes = [
      'FAILURE IS NOT AN OPTION!',
      'THE REACTOR DEPENDS ON YOU!',
      'PREVENT TOTAL MELTDOWN!',
      'SAVE THE WORLD!',
      'TIME IS RUNNING OUT!'
    ];

    const prefix = nuclearPrefixes[Math.floor(Math.random() * nuclearPrefixes.length)];
    const suffix = nuclearSuffixes[Math.floor(Math.random() * nuclearSuffixes.length)];

    return `${prefix} ${message} ${suffix}`;
  }
}