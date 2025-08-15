import { VoiceService } from './voice-pro';
import { SubscriptionService } from './subscription';
import type { Alarm, VoiceMood, VoiceSettings } from '../types';

/**
 * Premium-aware voice service wrapper
 * Handles subscription validation for premium voice features
 */
export class PremiumVoiceService {
  
  /**
   * Generate alarm speech with premium subscription validation
   */
  static async generateAlarmSpeech(
    alarm: Alarm, 
    userId: string,
    customMessage?: string
  ): Promise<string | null> {
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
  }> {
    const [
      tier,
      elevenlabsCheck,
      customMessagesCheck
    ] = await Promise.all([
      SubscriptionService.getUserTier(userId),
      SubscriptionService.checkFeatureUsage(userId, 'elevenlabsApiCalls'),
      SubscriptionService.checkFeatureUsage(userId, 'customVoiceMessages')
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
      hasUnlimitedAccess: tier === 'lifetime' || tier === 'pro'
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
    } else if (tier === 'premium') {
      if (usage.elevenlabsUsage.percentage > 80 || usage.customMessagesUsage.percentage > 80) {
        shouldUpgrade = true;
        recommendedTier = 'pro';
        reasons.push('You\'re approaching your monthly limits');
        benefits.push('500 premium voice calls per month');
        benefits.push('20 custom voice messages per day');
        benefits.push('Voice cloning feature');
        benefits.push('Unlimited customization');
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