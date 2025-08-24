import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Mic,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { PremiumVoiceService } from '../services/premium-voice';
import { SubscriptionService } from '../services/subscription';
import { PremiumGate } from './PremiumGate';

interface UsageTrackerProps {
  userId: string;
  className?: string;
}

interface UsageData {
  tier: string;
  elevenlabsUsage: { current: number; limit: number; percentage: number };
  customMessagesUsage: { current: number; limit: number; percentage: number };
  hasUnlimitedAccess: boolean;
  isLoading: boolean;
  error?: string;
}

export const PremiumUsageTracker: React.FC<UsageTrackerProps> = ({
  userId,
  className = '',
}
) => {
  const [usageData, setUsageData] = useState<UsageData>({
    tier: 'free',
    elevenlabsUsage: { current: 0, limit: 0, percentage: 0 },
    customMessagesUsage: { current: 0, limit: 0, percentage: 0 },
    hasUnlimitedAccess: false,
    isLoading: true,
  });

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect((
) => {
    loadUsageData();
  }, [userId]);

  const loadUsageData = async (
) => {
    
    setUsageData((prev: any
) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const summary = await PremiumVoiceService.getUsageSummary(userId);
      setUsageData({
        ...summary,
        isLoading: false,
      });
      setLastRefresh(new Date());
    } catch (error) {
      
      setUsageData((prev: any
) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load usage data',
      }));
    }
  };

  const getTierColor = (tier: string
) => {
    switch (tier) {
      case 'premium':
        return 'from-amber-500 to-orange-500';
      case 'pro':
        return 'from-purple-500 to-pink-500';
      case 'lifetime':
        return 'from-emerald-500 to-teal-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getTierIcon = (tier: string
) => {
    switch (tier) {
      case 'premium':
        return Crown;
      case 'pro':
        return Sparkles;
      case 'lifetime':
        return Crown;
      default:
        return Crown;
    }
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const renderUsageBar = (
    icon: React.ElementType,
    title: string,
    usage: { current: number; limit: number; percentage: number },
    unlimited: boolean = false
  
) => {
    const Icon = icon;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{title}</span>
          </div>
          <div className="text-sm text-gray-500">
            {unlimited ? (
              <span className="text-green-600 font-medium">Unlimited</span>
            ) : (
              `${usage.current}/${usage.limit === -1 ? '∞' : usage.limit}`
            )}
          </div>
        </div>

        {!unlimited && usage.limit > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(usage.percentage, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-2 rounded-full ${getUsageColor(usage.percentage)}`}
            />
          </div>
        )}

        {!unlimited && usage.percentage >= 90 && (
          <div className="flex items-center space-x-1 text-xs text-red-600">
            <AlertCircle className="w-3 h-3" />
            <span>Approaching limit</span>
          </div>
        )}
      </div>
    );
  };

  if (usageData.tier === 'free') {
    return (
      <div className={`${className}`}>
        <PremiumGate
          feature="elevenlabsVoices"
          userId={userId}
          title="Premium Voice Usage"
          description="Track your premium voice usage and customize your experience"
          mode="replace"
        />
      </div>
    );
  }

  const TierIcon = getTierIcon(usageData.tier);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getTierColor(usageData.tier)} flex items-center justify-center`}
          >
            <TierIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {usageData.tier.charAt(0).toUpperCase() + usageData.tier.slice(1)} Plan
            </h3>
            <p className="text-sm text-gray-500">Voice usage this month</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={loadUsageData}
          disabled={usageData.isLoading}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh usage data"
        >
          <RefreshCw
            className={`w-4 h-4 ${usageData.isLoading ? 'animate-spin' : ''}`}
          />
        </motion.button>
      </div>

      {usageData.error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{usageData.error}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {renderUsageBar(
            Mic,
            'ElevenLabs Voice Calls',
            usageData.elevenlabsUsage,
            usageData.hasUnlimitedAccess || usageData.elevenlabsUsage.limit === -1
          )}

          {renderUsageBar(
            MessageSquare,
            'Custom Voice Messages',
            usageData.customMessagesUsage,
            usageData.hasUnlimitedAccess || usageData.customMessagesUsage.limit === -1
          )}

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              {(usageData.elevenlabsUsage.percentage > 75 ||
                usageData.customMessagesUsage.percentage > 75) &&
                !usageData.hasUnlimitedAccess && (
                  <div className="flex items-center space-x-1 text-amber-600">
                    <TrendingUp className="w-3 h-3" />
                    <span>Consider upgrading</span>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
export default PremiumUsageTracker;
