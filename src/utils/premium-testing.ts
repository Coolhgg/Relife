/**
 * Premium Feature Testing Utilities
 * 
 * This module provides testing utilities and integration examples
 * for the premium subscription system
 */

import { SubscriptionService } from '../services/subscription';
import { PremiumVoiceService } from '../services/premium-voice';
import type { 
  Subscription, 
  SubscriptionTier, 
  PremiumFeatureAccess,
  PremiumUsage
} from '../types';

// Test user IDs for different subscription tiers
export const TEST_USER_IDS = {
  FREE: 'test-user-free-123',
  PREMIUM: 'test-user-premium-456',
  PRO: 'test-user-pro-789',
  LIFETIME: 'test-user-lifetime-012'
};

// Mock subscription data for testing
export const MOCK_SUBSCRIPTIONS: Record<SubscriptionTier, Subscription | null> = {
  free: null, // Free users don't have subscription records
  premium: {
    id: 'sub_premium_123',
    userId: TEST_USER_IDS.PREMIUM,
    tier: 'premium',
    status: 'active',
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2024-02-01'),
    cancelAtPeriodEnd: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    stripeCustomerId: 'cus_premium_123',
    stripeSubscriptionId: 'sub_stripe_premium_123',
    stripePriceId: 'price_premium_monthly'
  },
  pro: {
    id: 'sub_pro_456',
    userId: TEST_USER_IDS.PRO,
    tier: 'pro',
    status: 'active',
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2024-02-01'),
    cancelAtPeriodEnd: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    stripeCustomerId: 'cus_pro_456',
    stripeSubscriptionId: 'sub_stripe_pro_456',
    stripePriceId: 'price_pro_monthly'
  },
  lifetime: {
    id: 'sub_lifetime_789',
    userId: TEST_USER_IDS.LIFETIME,
    tier: 'lifetime',
    status: 'active',
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2099-01-01'), // Far future for lifetime
    cancelAtPeriodEnd: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    stripeCustomerId: 'cus_lifetime_789',
    stripeSubscriptionId: 'sub_stripe_lifetime_789',
    stripePriceId: 'price_lifetime'
  }
};

// Mock usage data for testing limits
export const MOCK_USAGE_DATA: Record<string, PremiumUsage> = {
  [TEST_USER_IDS.PREMIUM]: {
    userId: TEST_USER_IDS.PREMIUM,
    month: '2024-01',
    elevenlabsApiCalls: 45, // Under limit of 100
    aiInsightsGenerated: 8, // Under limit of 10
    customVoiceMessages: 3, // Under limit of 5
    premiumThemesUsed: ['neon-cyberpunk', 'sunset-gradient'],
    lastUpdated: new Date()
  },
  [TEST_USER_IDS.PRO]: {
    userId: TEST_USER_IDS.PRO,
    month: '2024-01',
    elevenlabsApiCalls: 250, // Under limit of 500
    aiInsightsGenerated: 15, // Under limit of 25
    customVoiceMessages: 12, // Under limit of 20
    premiumThemesUsed: ['neon-cyberpunk', 'sunset-gradient', 'forest-zen', 'deep-space'],
    lastUpdated: new Date()
  },
  [`${TEST_USER_IDS.PREMIUM}_high_usage`]: {
    userId: TEST_USER_IDS.PREMIUM,
    month: '2024-01',
    elevenlabsApiCalls: 95, // Close to limit of 100
    aiInsightsGenerated: 9, // Close to limit of 10
    customVoiceMessages: 4, // Close to limit of 5
    premiumThemesUsed: ['neon-cyberpunk', 'sunset-gradient'],
    lastUpdated: new Date()
  }
};

/**
 * Test suite for premium functionality
 */
export class PremiumTester {
  
  /**
   * Test subscription access for different tiers
   */
  static async testSubscriptionAccess(): Promise<{
    success: boolean;
    results: Array<{
      tier: SubscriptionTier;
      userId: string;
      hasElevenlabs: boolean;
      hasCustomMessages: boolean;
      hasPremiumThemes: boolean;
      hasVoiceCloning: boolean;
    }>;
    errors: string[];
  }> {
    const results = [];
    const errors = [];

    try {
      for (const [tier, userId] of Object.entries(TEST_USER_IDS)) {
        try {
          const [
            hasElevenlabs,
            hasCustomMessages, 
            hasPremiumThemes,
            hasVoiceCloning
          ] = await Promise.all([
            SubscriptionService.hasFeatureAccess(userId, 'elevenlabsVoices'),
            SubscriptionService.hasFeatureAccess(userId, 'customVoiceMessages'),
            SubscriptionService.hasFeatureAccess(userId, 'premiumThemes'),
            SubscriptionService.hasFeatureAccess(userId, 'voiceCloning')
          ]);

          results.push({
            tier: tier.toLowerCase() as SubscriptionTier,
            userId,
            hasElevenlabs,
            hasCustomMessages,
            hasPremiumThemes,
            hasVoiceCloning
          });
        } catch (error) {
          errors.push(`Error testing ${tier}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return { success: errors.length === 0, results, errors };
    } catch (error) {
      return {
        success: false,
        results: [],
        errors: [`Global test error: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Test usage limits and tracking
   */
  static async testUsageLimits(): Promise<{
    success: boolean;
    results: Array<{
      userId: string;
      tier: SubscriptionTier;
      elevenlabsCheck: { hasAccess: boolean; currentUsage?: number; limit?: number };
      customMessagesCheck: { hasAccess: boolean; currentUsage?: number; limit?: number };
    }>;
    errors: string[];
  }> {
    const results = [];
    const errors = [];

    try {
      for (const [tier, userId] of Object.entries(TEST_USER_IDS)) {
        if (tier === 'FREE') continue; // Skip free users for usage testing

        try {
          const [elevenlabsCheck, customMessagesCheck] = await Promise.all([
            SubscriptionService.checkFeatureUsage(userId, 'elevenlabsApiCalls'),
            SubscriptionService.checkFeatureUsage(userId, 'customVoiceMessages')
          ]);

          results.push({
            userId,
            tier: tier.toLowerCase() as SubscriptionTier,
            elevenlabsCheck,
            customMessagesCheck
          });
        } catch (error) {
          errors.push(`Error testing usage for ${tier}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return { success: errors.length === 0, results, errors };
    } catch (error) {
      return {
        success: false,
        results: [],
        errors: [`Global usage test error: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Test voice generation with premium validation
   */
  static async testPremiumVoiceGeneration(): Promise<{
    success: boolean;
    results: Array<{
      userId: string;
      tier: SubscriptionTier;
      canUseElevenlabs: boolean;
      canCreateCustomMessages: boolean;
      voicePreview: string | null;
    }>;
    errors: string[];
  }> {
    const results = [];
    const errors = [];

    try {
      for (const [tier, userId] of Object.entries(TEST_USER_IDS)) {
        try {
          const [
            canUseElevenlabs,
            canCreateCustomMessages,
            voicePreview
          ] = await Promise.all([
            SubscriptionService.hasFeatureAccess(userId, 'elevenlabsVoices'),
            SubscriptionService.hasFeatureAccess(userId, 'customVoiceMessages'),
            PremiumVoiceService.previewVoice(
              userId, 
              'Good morning! Time to wake up and seize the day!', 
              'motivational'
            )
          ]);

          results.push({
            userId,
            tier: tier.toLowerCase() as SubscriptionTier,
            canUseElevenlabs,
            canCreateCustomMessages,
            voicePreview
          });
        } catch (error) {
          errors.push(`Error testing voice for ${tier}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return { success: errors.length === 0, results, errors };
    } catch (error) {
      return {
        success: false,
        results: [],
        errors: [`Global voice test error: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Test upgrade recommendations
   */
  static async testUpgradeRecommendations(): Promise<{
    success: boolean;
    results: Array<{
      userId: string;
      tier: SubscriptionTier;
      recommendation: {
        shouldUpgrade: boolean;
        recommendedTier: string;
        reasons: string[];
        benefits: string[];
      };
    }>;
    errors: string[];
  }> {
    const results = [];
    const errors = [];

    try {
      for (const [tier, userId] of Object.entries(TEST_USER_IDS)) {
        try {
          const recommendation = await PremiumVoiceService.getUpgradeRecommendation(userId);

          results.push({
            userId,
            tier: tier.toLowerCase() as SubscriptionTier,
            recommendation
          });
        } catch (error) {
          errors.push(`Error testing recommendations for ${tier}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return { success: errors.length === 0, results, errors };
    } catch (error) {
      return {
        success: false,
        results: [],
        errors: [`Global recommendation test error: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Run comprehensive premium feature test suite
   */
  static async runFullTestSuite(): Promise<{
    success: boolean;
    summary: {
      testsRun: number;
      testsPassed: number;
      testsFailed: number;
    };
    results: {
      subscriptionAccess: any;
      usageLimits: any;
      voiceGeneration: any;
      upgradeRecommendations: any;
    };
    errors: string[];
  }> {
    console.log('🚀 Starting Premium Feature Test Suite...');
    
    const allErrors: string[] = [];
    let testsRun = 0;
    let testsPassed = 0;

    // Test 1: Subscription Access
    console.log('📋 Testing subscription access...');
    testsRun++;
    const subscriptionAccessTest = await this.testSubscriptionAccess();
    if (subscriptionAccessTest.success) {
      testsPassed++;
      console.log('✅ Subscription access test passed');
    } else {
      console.log('❌ Subscription access test failed');
      allErrors.push(...subscriptionAccessTest.errors);
    }

    // Test 2: Usage Limits
    console.log('📊 Testing usage limits...');
    testsRun++;
    const usageLimitsTest = await this.testUsageLimits();
    if (usageLimitsTest.success) {
      testsPassed++;
      console.log('✅ Usage limits test passed');
    } else {
      console.log('❌ Usage limits test failed');
      allErrors.push(...usageLimitsTest.errors);
    }

    // Test 3: Voice Generation
    console.log('🎤 Testing premium voice generation...');
    testsRun++;
    const voiceGenerationTest = await this.testPremiumVoiceGeneration();
    if (voiceGenerationTest.success) {
      testsPassed++;
      console.log('✅ Voice generation test passed');
    } else {
      console.log('❌ Voice generation test failed');
      allErrors.push(...voiceGenerationTest.errors);
    }

    // Test 4: Upgrade Recommendations
    console.log('💡 Testing upgrade recommendations...');
    testsRun++;
    const upgradeRecommendationsTest = await this.testUpgradeRecommendations();
    if (upgradeRecommendationsTest.success) {
      testsPassed++;
      console.log('✅ Upgrade recommendations test passed');
    } else {
      console.log('❌ Upgrade recommendations test failed');
      allErrors.push(...upgradeRecommendationsTest.errors);
    }

    const testsFailed = testsRun - testsPassed;
    const success = testsFailed === 0;

    console.log(`\n📈 Test Suite Complete:`);
    console.log(`   Tests Run: ${testsRun}`);
    console.log(`   Passed: ${testsPassed}`);
    console.log(`   Failed: ${testsFailed}`);
    console.log(`   Success Rate: ${Math.round((testsPassed / testsRun) * 100)}%`);

    return {
      success,
      summary: {
        testsRun,
        testsPassed,
        testsFailed
      },
      results: {
        subscriptionAccess: subscriptionAccessTest,
        usageLimits: usageLimitsTest,
        voiceGeneration: voiceGenerationTest,
        upgradeRecommendations: upgradeRecommendationsTest
      },
      errors: allErrors
    };
  }
}

/**
 * Premium feature integration examples
 */
export class PremiumIntegrationExamples {
  
  /**
   * Example: Gating a premium feature in a component
   */
  static exampleFeatureGating = `
    import { PremiumGate } from '../components/PremiumGate';
    
    const VoiceSettingsComponent = ({ userId }) => {
      return (
        <div>
          <h3>Voice Settings</h3>
          
          {/* Basic voice settings available to all users */}
          <VoiceVolumeSlider />
          <VoiceSpeedSlider />
          
          {/* Premium ElevenLabs voices - gated */}
          <PremiumGate 
            feature="elevenlabsVoices" 
            userId={userId}
            title="Premium AI Voices"
            description="Access ultra-realistic voices powered by ElevenLabs"
          >
            <ElevenLabsVoiceSelector />
          </PremiumGate>
          
          {/* Pro feature - custom voice messages */}
          <PremiumGate 
            feature="customVoiceMessages" 
            userId={userId}
            mode="overlay"
            showPreview={true}
          >
            <CustomVoiceMessageCreator />
          </PremiumGate>
        </div>
      );
    };
  `;

  /**
   * Example: Using premium voice service
   */
  static exampleVoiceService = `
    import { PremiumVoiceService } from '../services/premium-voice';
    
    const generateWakeupMessage = async (userId, alarm) => {
      try {
        // This automatically checks subscription and usage limits
        const audioUrl = await PremiumVoiceService.generateAlarmSpeech(
          alarm, 
          userId,
          "Good morning! Time to conquer your day!"
        );
        
        if (audioUrl) {
          // Play the generated audio
          playAudio(audioUrl);
        } else {
          // Fallback to default alarm sound
          playDefaultAlarm();
        }
      } catch (error) {
        console.error('Voice generation failed:', error);
        showUpgradePrompt(); // Show upgrade modal
      }
    };
  `;

  /**
   * Example: Subscription state management
   */
  static exampleStateManagement = `
    import { useEffect, useState } from 'react';
    import { SubscriptionService } from '../services/subscription';
    
    const usePremiumFeatures = (userId) => {
      const [subscriptionState, setSubscriptionState] = useState({
        tier: 'free',
        featureAccess: {},
        usage: null,
        loading: true
      });
      
      useEffect(() => {
        const loadSubscriptionData = async () => {
          try {
            const [tier, featureAccess, usage] = await Promise.all([
              SubscriptionService.getUserTier(userId),
              SubscriptionService.getFeatureAccess(userId),
              SubscriptionService.getCurrentUsage(userId)
            ]);
            
            setSubscriptionState({
              tier,
              featureAccess,
              usage,
              loading: false
            });
          } catch (error) {
            console.error('Failed to load subscription data:', error);
            setSubscriptionState(prev => ({ ...prev, loading: false }));
          }
        };
        
        if (userId) {
          loadSubscriptionData();
        }
      }, [userId]);
      
      return subscriptionState;
    };
  `;

  /**
   * Generate complete integration guide
   */
  static generateIntegrationGuide(): string {
    return `
# Premium Features Integration Guide

## Overview
This guide shows how to integrate premium monetization hooks into your Relife alarm app.

## Core Services

### 1. SubscriptionService
Handles all subscription-related operations:
- \`getUserTier(userId)\` - Get user's subscription tier
- \`hasFeatureAccess(userId, feature)\` - Check if user has access to specific feature
- \`checkFeatureUsage(userId, feature)\` - Check usage limits for premium features
- \`incrementUsage(userId, feature)\` - Track feature usage

### 2. PremiumVoiceService
Premium-aware wrapper for voice features:
- \`generateAlarmSpeech(alarm, userId)\` - Generate premium voice with validation
- \`generateCustomVoiceMessage(userId, message, mood)\` - Create custom voice messages
- \`getAvailableVoices(userId)\` - Get voices available to user's tier

## UI Components

### 1. PremiumGate
Wrap any component to add premium gating:
${this.exampleFeatureGating}

### 2. PremiumDashboard
Show user's subscription status and usage:
\`\`\`jsx
<PremiumDashboard userId={currentUser.id} />
\`\`\`

### 3. PremiumUsageTracker
Display usage statistics for premium features:
\`\`\`jsx
<PremiumUsageTracker userId={currentUser.id} />
\`\`\`

## Integration Examples

### Voice Service Integration
${this.exampleVoiceService}

### State Management Hook
${this.exampleStateManagement}

## Database Setup
1. Run the SQL schema in \`database/premium_schema.sql\`
2. Configure your Supabase project with the new tables
3. Set up Stripe webhooks for subscription events

## Testing
Use the PremiumTester utility to validate your integration:

\`\`\`javascript
import { PremiumTester } from '../utils/premium-testing';

// Run full test suite
const results = await PremiumTester.runFullTestSuite();
console.log('Test results:', results);
\`\`\`

## Next Steps
1. Integrate Stripe payment processing
2. Set up webhooks for subscription events
3. Add analytics tracking for premium features
4. Implement A/B testing for upgrade prompts
    `;
  }
}

// Export testing utilities
export { PremiumTester };
export default PremiumIntegrationExamples;