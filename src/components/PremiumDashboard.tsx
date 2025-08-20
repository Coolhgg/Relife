import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Sparkles,
  Star,
  TrendingUp,
  Shield,
  Zap,
  Mic,
  MessageSquare,
  Palette,
  Settings,
  BarChart3,
  Gift,
  ArrowRight,
  Clock,
  Calendar,
  Users
} from 'lucide-react';
import { PremiumUsageTracker } from './PremiumUsageTracker';
import { PremiumGate } from './PremiumGate';
import { SubscriptionModal } from './SubscriptionModal';
import { SubscriptionService } from '../services/subscription';
import { PremiumVoiceService } from '../services/premium-voice';
import type { SubscriptionTier, PremiumFeatureAccess } from '../types';

interface PremiumDashboardProps {
  userId: string;
  className?: string;
}

interface DashboardState {
  tier: SubscriptionTier;
  featureAccess: PremiumFeatureAccess;
  trialDaysRemaining: number;
  isTrialing: boolean;
  upgradeRecommendation: {
    shouldUpgrade: boolean;
    recommendedTier: string;
    reasons: string[];
    benefits: string[];
  };
  loading: boolean;
  showSubscriptionModal: boolean;
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  status: 'available' | 'locked' | 'limited';
  usage?: { current: number; limit: number };
  upgradeRequired?: string;
  onClick?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  status,
  usage,
  upgradeRequired,
  onClick
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'available': return 'border-green-200 bg-green-50';
      case 'limited': return 'border-yellow-200 bg-yellow-50';
      case 'locked': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'available': return <Shield className="w-4 h-4 text-green-500" />;
      case 'limited': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'locked': return <Crown className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all ${getStatusColor()} ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            status === 'available'
              ? 'bg-green-500 text-white'
              : status === 'limited'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-400 text-white'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        {getStatusIcon()}
      </div>

      {usage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Usage this month</span>
            <span className={`font-medium ${
              usage.current >= usage.limit ? 'text-red-600' : 'text-gray-900'
            }`}>
              {usage.current}/{usage.limit === -1 ? '∞' : usage.limit}
            </span>
          </div>
          {usage.limit > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  usage.current >= usage.limit ? 'bg-red-500' :
                  usage.current / usage.limit > 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((usage.current / usage.limit) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {upgradeRequired && status === 'locked' && (
        <div className="mt-3 text-xs text-gray-500">
          Requires {upgradeRequired} plan
        </div>
      )}
    </motion.div>
  );
};

export const PremiumDashboard: React.FC<PremiumDashboardProps> = ({
  userId,
  className = ''
}) => {
  const [state, setState] = useState<DashboardState>({
    tier: 'free',
    featureAccess: {} as PremiumFeatureAccess,
    trialDaysRemaining: 0,
    isTrialing: false,
    upgradeRecommendation: {
      shouldUpgrade: false,
      recommendedTier: 'premium',
      reasons: [],
      benefits: []
    },
    loading: true,
    showSubscriptionModal: false
  });

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const [
        tier,
        featureAccess,
        trialDays,
        isTrialing,
        upgradeRec
      ] = await Promise.all([
        SubscriptionService.getUserTier(userId),
        SubscriptionService.getFeatureAccess(userId),
        SubscriptionService.getTrialDaysRemaining(userId),
        SubscriptionService.isUserInTrial(userId),
        PremiumVoiceService.getUpgradeRecommendation(userId)
      ]);

      setState(prev => ({
        ...prev,
        tier,
        featureAccess,
        trialDaysRemaining: trialDays,
        isTrialing,
        upgradeRecommendation: upgradeRec,
        loading: false
      }));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const getTierInfo = () => {
    const tierInfo = {
      free: { name: 'Free', icon: Shield, color: 'from-gray-500 to-gray-600' },
      premium: { name: 'Premium', icon: Crown, color: 'from-amber-500 to-orange-500' },
      pro: { name: 'Pro', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
      lifetime: { name: 'Lifetime', icon: Star, color: 'from-emerald-500 to-teal-500' }
    };
    return tierInfo[state.tier] || tierInfo.free;
  };

  const handleUpgrade = () => {
    setState(prev => ({ ...prev, showSubscriptionModal: true }));
  };

  const renderHeader = () => {
    const tierInfo = getTierInfo();
    const TierIcon = tierInfo.icon;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tierInfo.color} flex items-center justify-center shadow-lg`}>
              <TierIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {tierInfo.name} Plan
              </h2>
              <p className="text-gray-600">
                {state.isTrialing && state.trialDaysRemaining > 0
                  ? `${state.trialDaysRemaining} days left in trial`
                  : 'Your current subscription tier'
                }
              </p>
            </div>
          </div>

          {(state.tier === 'free' || state.upgradeRecommendation.shouldUpgrade) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUpgrade}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl flex items-center space-x-2 shadow-lg hover:shadow-xl transition-shadow"
            >
              <TrendingUp className="w-5 h-5" />
              <span>Upgrade Plan</span>
            </motion.button>
          )}
        </div>

        {state.upgradeRecommendation.shouldUpgrade && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800 mb-1">
                  Upgrade Recommended
                </h4>
                <p className="text-sm text-amber-700 mb-2">
                  {state.upgradeRecommendation.reasons.join('. ')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {state.upgradeRecommendation.benefits.slice(0, 2).map((benefit, index) => (
                    <span
                      key={index}
                      className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFeatureGrid = () => {
    const features = [
      {
        icon: Mic,
        title: 'ElevenLabs Voices',
        description: 'Ultra-realistic AI voices for your alarms',
        feature: 'elevenlabsVoices' as keyof PremiumFeatureAccess,
        upgradeRequired: 'Premium'
      },
      {
        icon: MessageSquare,
        title: 'Custom Voice Messages',
        description: 'Create personalized voice messages',
        feature: 'customVoiceMessages' as keyof PremiumFeatureAccess,
        upgradeRequired: 'Premium'
      },
      {
        icon: Palette,
        title: 'Premium Themes',
        description: 'Access exclusive, beautiful themes',
        feature: 'premiumThemes' as keyof PremiumFeatureAccess,
        upgradeRequired: 'Premium'
      },
      {
        icon: BarChart3,
        title: 'Advanced Analytics',
        description: 'Detailed insights into your sleep patterns',
        feature: 'advancedStats' as keyof PremiumFeatureAccess,
        upgradeRequired: 'Premium'
      },
      {
        icon: Calendar,
        title: 'Smart Scheduling',
        description: 'AI-optimized alarm scheduling',
        feature: 'smartScheduling' as keyof PremiumFeatureAccess,
        upgradeRequired: 'Pro'
      },
      {
        icon: Users,
        title: 'Custom Battle Rules',
        description: 'Create your own battle challenges',
        feature: 'customBattleRules' as keyof PremiumFeatureAccess,
        upgradeRequired: 'Pro'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            status={state.featureAccess[feature.feature] ? 'available' : 'locked'}
            upgradeRequired={feature.upgradeRequired}
            onClick={state.featureAccess[feature.feature] ? undefined : handleUpgrade}
          />
        ))}
      </div>
    );
  };

  if (state.loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {renderHeader()}

      {/* Usage Tracker */}
      {state.tier !== 'free' && (
        <PremiumUsageTracker userId={userId} />
      )}

      {/* Feature Overview */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <Gift className="w-6 h-6 text-purple-500" />
          <span>Premium Features</span>
        </h3>
        {renderFeatureGrid()}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <h4 className="font-semibold text-gray-900">Quick Actions</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-white rounded-lg border border-gray-200 text-left hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">Manage Subscription</p>
                <p className="text-sm text-gray-600">Change plan or cancel</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpgrade}
            className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-left text-white hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-white" />
              <div>
                <p className="font-medium text-white">Explore Premium</p>
                <p className="text-sm text-purple-100">See all premium features</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white ml-auto" />
            </div>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {state.showSubscriptionModal && (
          <SubscriptionModal
            isOpen={state.showSubscriptionModal}
            onClose={() => setState(prev => ({ ...prev, showSubscriptionModal: false }))}
            userId={userId}
          />
        )}
      </AnimatePresence>
    </div>
  );
};