import { VoiceService } from './voice-pro';
import { SubscriptionService } from './subscription';
import type { Alarm, VoiceMood, VoiceSettings } from '../types';

/**
 * Premium-aware voice service wrapper
 * Handles subscription validation for premium voice features
 */
export class PremiumVoiceService {
  
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

    // Check usage limits for premium users
    const usageCheck = await SubscriptionService.checkFeatureUsage(userId, 'elevenlabsApiCalls');
    if (!usageCheck.hasAccess) {
      // Notify user of limit reached and fall back to web speech
      console.warn('ElevenLabs usage limit reached, falling back to web speech');
      return await VoiceService.generateAlarmSpeech(alarm, customMessage, 'web-speech');
    }

    try {
      // Use premium ElevenLabs voices
      const audioUrl = await VoiceService.generateAlarmSpeech(alarm, customMessage, 'elevenlabs');
      
      if (audioUrl) {
        // Increment usage counter
        await SubscriptionService.incrementUsage(userId, 'elevenlabsApiCalls');
      }
      
      return audioUrl;
    } catch (error) {
      console.error('ElevenLabs voice generation failed:', error);
      // Fall back to web speech on error
      return await VoiceService.generateAlarmSpeech(alarm, customMessage, 'web-speech');
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

    // Check usage limits
    const usageCheck = await SubscriptionService.checkFeatureUsage(userId, 'customVoiceMessages');
    if (!usageCheck.hasAccess) {
      throw new Error(`Daily limit of ${usageCheck.limit} custom voice messages reached. Upgrade for more.`);
    }

    try {
      // Generate custom voice message using premium provider
      const audioUrl = await VoiceService.generateCustomMessage(message, mood, 'elevenlabs', settings);
      
      if (audioUrl) {
        // Increment usage counter
        await SubscriptionService.incrementUsage(userId, 'customVoiceMessages');
      }
      
      return audioUrl;
    } catch (error) {
      console.error('Custom voice message generation failed:', error);
      throw error;
    }
  }

  /**
   * Get available voice options based on subscription tier
   */
  static async getAvailableVoices(userId: string): Promise<{
    providers: string[];
    hasElevenLabs: boolean;
    hasCustomMessages: boolean;
    usage: {
      elevenlabsApiCalls: { current: number; limit: number; hasAccess: boolean };
      customVoiceMessages: { current: number; limit: number; hasAccess: boolean };
    };
  }> {
    const [
      hasElevenLabs,
      hasCustomMessages,
      elevenlabsUsage,
      customMessagesUsage
    ] = await Promise.all([
      SubscriptionService.hasFeatureAccess(userId, 'elevenlabsVoices'),
      SubscriptionService.hasFeatureAccess(userId, 'customVoiceMessages'),
      SubscriptionService.checkFeatureUsage(userId, 'elevenlabsApiCalls'),
      SubscriptionService.checkFeatureUsage(userId, 'customVoiceMessages')
    ]);

    const providers = ['web-speech'];
    if (hasElevenLabs) {
      providers.push('elevenlabs');
    }

    return {
      providers,
      hasElevenLabs,
      hasCustomMessages,
      usage: {
        elevenlabsApiCalls: {
          current: elevenlabsUsage.currentUsage || 0,
          limit: elevenlabsUsage.limit || 0,
          hasAccess: elevenlabsUsage.hasAccess
        },
        customVoiceMessages: {
          current: customMessagesUsage.currentUsage || 0,
          limit: customMessagesUsage.limit || 0,
          hasAccess: customMessagesUsage.hasAccess
        }
      }
    };
  }

  /**
   * Validate if user can use voice cloning feature
   */
  static async canUseVoiceCloning(userId: string): Promise<{
    hasAccess: boolean;
    reason?: string;
  }> {
    const hasVoiceCloning = await SubscriptionService.hasFeatureAccess(userId, 'voiceCloning');
    
    if (!hasVoiceCloning) {
      return {
        hasAccess: false,
        reason: 'Voice cloning requires a Pro subscription or higher'
      };
    }

    return { hasAccess: true };
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

    return await VoiceService.generateCustomMessage(text, mood, provider);
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
}