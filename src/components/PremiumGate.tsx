import React, { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Crown, Sparkles, Star, ArrowUp } from 'lucide-react';
import { SubscriptionService } from '../services/subscription';
import type { PremiumFeatureAccess, SubscriptionTier } from '../types';
import { SubscriptionModal } from './SubscriptionModal';

interface PremiumGateProps {
  feature: keyof PremiumFeatureAccess;
  userId: string;
  children: ReactNode;
  fallback?: ReactNode;
  showPreview?: boolean;
  title?: string;
  description?: string;
  className?: string;
  mode?: 'block' | 'overlay' | 'replace';
}

interface PremiumGateState {
  hasAccess: boolean;
  loading: boolean;
  tier: SubscriptionTier;
  isModalOpen: boolean;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  feature,
  userId,
  children,
  fallback,
  showPreview = false,
  title,
  description,
  className = '',
  mode = 'block'
}) => {
  const [state, setState] = useState<PremiumGateState>({
    hasAccess: false,
    loading: true,
    tier: 'free',
    isModalOpen: false
  });

  useEffect(() => {
    checkAccess();
  }, [userId, feature]);

  const checkAccess = async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const [hasAccess, tier] = await Promise.all([
        SubscriptionService.hasFeatureAccess(userId, feature),
        SubscriptionService.getUserTier(userId)
      ]);

      setState(prev => ({
        ...prev,
        hasAccess,
        tier,
        loading: false
      }));
    } catch (error) {
      console.error('Error checking premium access:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleUpgrade = () => {
    setState(prev => ({ ...prev, isModalOpen: true }));
  };

  const handleModalClose = () => {
    setState(prev => ({ ...prev, isModalOpen: false }));
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-pulse flex items-center space-x-2">
          <Crown className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-gray-500">Checking access...</span>
        </div>
      </div>
    );
  }

  if (state.hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access - show upgrade prompt
  const getFeatureTitle = () => {
    if (title) return title;
    
    const featureTitles: Record<keyof PremiumFeatureAccess, string> = {
      elevenlabsVoices: 'Premium Voices',
      customVoiceMessages: 'Custom Voice Messages',
      voiceCloning: 'Voice Cloning',
      advancedAIInsights: 'Advanced AI Insights',
      personalizedChallenges: 'Personalized Challenges',
      smartRecommendations: 'Smart Recommendations',
      behaviorAnalysis: 'Behavior Analysis',
      premiumThemes: 'Premium Themes',
      customSounds: 'Custom Sounds',
      advancedPersonalization: 'Advanced Personalization',
      unlimitedCustomization: 'Unlimited Customization',
      advancedScheduling: 'Advanced Scheduling',
      smartScheduling: 'Smart Scheduling',
      locationBasedAlarms: 'Location-Based Alarms',
      weatherIntegration: 'Weather Integration',
      exclusiveBattleModes: 'Exclusive Battle Modes',
      customBattleRules: 'Custom Battle Rules',
      advancedStats: 'Advanced Statistics',
      leaderboardFeatures: 'Leaderboard Features',
      premiumSoundLibrary: 'Premium Sound Library',
      exclusiveContent: 'Exclusive Content',
      adFree: 'Ad-Free Experience',
      prioritySupport: 'Priority Support',
      nuclearMode: 'Nuclear Mode',
      premiumPersonalities: 'Premium Voice Personalities'
    };

    return featureTitles[feature] || 'Premium Feature';
  };

  const getFeatureDescription = () => {
    if (description) return description;
    
    const featureDescriptions: Record<keyof PremiumFeatureAccess, string> = {
      elevenlabsVoices: 'Get access to ultra-realistic AI voices powered by ElevenLabs',
      customVoiceMessages: 'Create personalized voice messages for your alarms',
      voiceCloning: 'Clone your own voice for ultimate personalization',
      advancedAIInsights: 'Get deeper insights into your sleep patterns and habits',
      personalizedChallenges: 'Receive AI-generated challenges tailored to your goals',
      smartRecommendations: 'Get intelligent recommendations to improve your routine',
      behaviorAnalysis: 'Analyze your behavior patterns with advanced AI',
      premiumThemes: 'Access exclusive, beautifully designed themes',
      customSounds: 'Upload and use your own custom alarm sounds',
      advancedPersonalization: 'Unlock advanced customization options',
      unlimitedCustomization: 'Remove all limits on customization features',
      advancedScheduling: 'Set up complex alarm schedules with multiple conditions',
      smartScheduling: 'Let AI optimize your alarm schedule automatically',
      locationBasedAlarms: 'Set alarms that trigger based on your location',
      weatherIntegration: 'Adjust alarms based on weather conditions',
      exclusiveBattleModes: 'Access special battle modes and challenges',
      customBattleRules: 'Create your own battle rules and challenges',
      advancedStats: 'View detailed statistics and performance metrics',
      leaderboardFeatures: 'Compete on exclusive premium leaderboards',
      premiumSoundLibrary: 'Access hundreds of high-quality alarm sounds',
      exclusiveContent: 'Get access to premium content and features',
      adFree: 'Enjoy the app without any advertisements',
      prioritySupport: 'Get priority customer support and faster responses',
      nuclearMode: 'Access the ultimate extreme difficulty with nuclear-level challenges',
      premiumPersonalities: 'Unlock 4 exclusive premium voice personalities including demon-lord, ai-robot, comedian, and philosopher'
    };

    return featureDescriptions[feature] || 'Unlock this premium feature to enhance your experience';
  };

  const getRequiredTier = (): SubscriptionTier => {
    // Define which tier is required for each feature
    const tierRequirements: Record<keyof PremiumFeatureAccess, SubscriptionTier> = {
      elevenlabsVoices: 'premium',
      customVoiceMessages: 'premium',
      voiceCloning: 'pro',
      advancedAIInsights: 'premium',
      personalizedChallenges: 'premium',
      smartRecommendations: 'premium',
      behaviorAnalysis: 'premium',
      premiumThemes: 'premium',
      customSounds: 'premium',
      advancedPersonalization: 'premium',
      unlimitedCustomization: 'pro',
      advancedScheduling: 'premium',
      smartScheduling: 'pro',
      locationBasedAlarms: 'premium',
      weatherIntegration: 'premium',
      exclusiveBattleModes: 'premium',
      customBattleRules: 'pro',
      advancedStats: 'premium',
      leaderboardFeatures: 'premium',
      premiumSoundLibrary: 'premium',
      exclusiveContent: 'premium',
      adFree: 'premium',
      prioritySupport: 'pro',
      nuclearMode: 'pro',
      premiumPersonalities: 'pro'
    };

    return tierRequirements[feature] || 'premium';
  };

  const renderUpgradePrompt = () => {
    const requiredTier = getRequiredTier();
    const featureTitle = getFeatureTitle();
    const featureDesc = getFeatureDescription();

    const tierColors = {
      premium: 'from-amber-500 to-orange-500',
      pro: 'from-purple-500 to-pink-500',
      lifetime: 'from-emerald-500 to-teal-500'
    };

    const tierIcons = {
      premium: Crown,
      pro: Sparkles,
      lifetime: Star
    };

    const TierIcon = tierIcons[requiredTier as keyof typeof tierIcons] || Crown;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 ${className}`}
      >
        {/* Background decoration */}
        <div className="absolute -top-6 -right-6 w-24 h-24 opacity-5">
          <TierIcon className="w-full h-full" />
        </div>
        
        <div className="relative">
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${tierColors[requiredTier]} flex items-center justify-center`}>
              <TierIcon className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {featureTitle}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {featureDesc}
              </p>
              
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Requires {requiredTier}
                </span>
                <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${tierColors[requiredTier]}`} />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpgrade}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r ${tierColors[requiredTier]} text-white font-medium text-sm hover:shadow-lg transition-shadow`}
              >
                <ArrowUp className="w-4 h-4" />
                <span>Upgrade to {requiredTier}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderOverlayMode = () => {
    return (
      <div className={`relative ${className}`}>
        {showPreview && (
          <div className="opacity-50 pointer-events-none blur-sm">
            {children}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
          <div className="text-center p-4">
            <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">
              {getFeatureTitle()}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              This feature requires a premium subscription
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUpgrade}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium text-sm"
            >
              Upgrade Now
            </motion.button>
          </div>
        </div>
      </div>
    );
  };

  // Render based on mode
  if (mode === 'overlay') {
    return (
      <>
        {renderOverlayMode()}
        <AnimatePresence>
          {state.isModalOpen && (
            <SubscriptionModal
              isOpen={state.isModalOpen}
              onClose={handleModalClose}
              userId={userId}
              highlightedFeature={feature}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  if (mode === 'replace') {
    return (
      <>
        {fallback || renderUpgradePrompt()}
        <AnimatePresence>
          {state.isModalOpen && (
            <SubscriptionModal
              isOpen={state.isModalOpen}
              onClose={handleModalClose}
              userId={userId}
              highlightedFeature={feature}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // Default block mode
  return (
    <>
      {renderUpgradePrompt()}
      <AnimatePresence>
        {state.isModalOpen && (
          <SubscriptionModal
            isOpen={state.isModalOpen}
            onClose={handleModalClose}
            userId={userId}
            highlightedFeature={feature}
          />
        )}
      </AnimatePresence>
    </>
  );
};