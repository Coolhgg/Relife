// Feature Gate Hook for Relife Alarm App
// Provides access control and upgrade prompts for premium features

import { useState, useEffect, useCallback } from 'react';
import { useSubscription } from './useSubscription';
import type { SubscriptionTier, FeatureAccess } from '../types/premium';
import AnalyticsService from '../services/analytics';

interface FeatureGateConfig {
  feature: string;
  fallbackTier?: SubscriptionTier;
  softGate?: boolean; // Show warning but allow usage
  gracePeriodDays?: number;
  customMessage?: string;
  redirectToUpgrade?: boolean;
  trackUsage?: boolean;
}

interface FeatureGateResult {
  hasAccess: boolean;
  isGated: boolean;
  requiredTier: SubscriptionTier | null;
  usageRemaining?: number;
  usageLimit?: number;
  upgradeMessage: string;
  canBypass: boolean;
  bypassReason?: string;
}

interface FeatureGateActions {
  requestAccess: () => Promise<boolean>;
  trackFeatureAttempt: () => void;
  showUpgradeModal: () => void;
  bypassGate: (reason: string) => void;
}

interface UseFeatureGateOptions {
  userId: string;
  feature: string;
  config?: Partial<FeatureGateConfig>;
  onAccessDenied?: (result: FeatureGateResult) => void;
  onUpgradeRequired?: (requiredTier: SubscriptionTier) => void;
}

function useFeatureGate(
  options: UseFeatureGateOptions
): FeatureGateResult & FeatureGateActions {
  const { userId, feature, config = {}, onAccessDenied, onUpgradeRequired } = options;

  const subscription = useSubscription({ userId });
  const [gateResult, setGateResult] = useState<FeatureGateResult>({
    hasAccess: false,
    isGated: true,
    requiredTier: null,
    upgradeMessage: '',
    canBypass: false,
  });

  const analytics = AnalyticsService.getInstance();

  const defaultConfig: FeatureGateConfig = {
    feature,
    fallbackTier: 'basic',
    softGate: false,
    gracePeriodDays: 0,
    customMessage: '',
    redirectToUpgrade: true,
    trackUsage: true,
    ...config,
  };

  // Feature access definitions
  const featureDefinitions: Record<
    string,
    {
      requiredTier: SubscriptionTier;
      category: string;
      description: string;
      upgradeMessage: string;
      hasUsageLimit?: boolean;
    }
  > = {
    unlimited_alarms: {
      requiredTier: 'basic',
      category: 'alarms',
      description: 'Set unlimited alarms',
      upgradeMessage:
        'Upgrade to Basic to set unlimited alarms and never miss an important wake-up call!',
    },
    custom_sounds: {
      requiredTier: 'basic',
      category: 'alarms',
      description: 'Upload custom alarm sounds',
      upgradeMessage:
        'Upgrade to Basic to upload your own alarm sounds and wake up to your favorite tunes!',
    },
    alarm_battles: {
      requiredTier: 'basic',
      category: 'battles',
      description: 'Join alarm battles',
      upgradeMessage:
        'Upgrade to Basic to participate in alarm battles and compete with friends!',
      hasUsageLimit: true,
    },
    unlimited_battles: {
      requiredTier: 'premium',
      category: 'battles',
      description: 'Unlimited battle participation',
      upgradeMessage:
        'Upgrade to Premium to join unlimited battles and become the ultimate early bird!',
    },
    smart_scheduling: {
      requiredTier: 'premium',
      category: 'ai',
      description: 'AI-powered smart alarm scheduling',
      upgradeMessage:
        'Upgrade to Premium to unlock AI-powered smart scheduling and optimize your sleep cycles!',
    },
    advanced_voice_ai: {
      requiredTier: 'premium',
      category: 'voice',
      description: 'Advanced AI voice recognition',
      upgradeMessage:
        'Upgrade to Premium for advanced voice AI that understands context and natural speech!',
    },
    calendar_integration: {
      requiredTier: 'premium',
      category: 'integrations',
      description: 'Calendar sync and integration',
      upgradeMessage:
        'Upgrade to Premium to sync with your calendar and auto-schedule wake-up times!',
    },
    weather_integration: {
      requiredTier: 'premium',
      category: 'integrations',
      description: 'Weather-based alarm adjustments',
      upgradeMessage:
        'Upgrade to Premium to adjust alarms based on weather conditions!',
    },
    advanced_analytics: {
      requiredTier: 'premium',
      category: 'analytics',
      description: 'Detailed sleep and wake patterns',
      upgradeMessage:
        'Upgrade to Premium to access detailed analytics and insights about your sleep patterns!',
    },
    team_features: {
      requiredTier: 'pro',
      category: 'collaboration',
      description: 'Team battles and collaboration',
      upgradeMessage:
        'Upgrade to Pro to create team battles and collaborate with colleagues!',
    },
    api_access: {
      requiredTier: 'pro',
      category: 'integrations',
      description: 'Developer API access',
      upgradeMessage:
        'Upgrade to Pro to access our developer API and build custom integrations!',
    },
    white_label: {
      requiredTier: 'pro',
      category: 'customization',
      description: 'Remove Relife branding',
      upgradeMessage:
        'Upgrade to Pro to remove branding and white-label the app for your organization!',
    },
    custom_themes: {
      requiredTier: 'pro',
      category: 'themes',
      description: 'Create custom themes',
      upgradeMessage:
        'Upgrade to Pro to create and share custom themes with unlimited customization options!',
    },
  };

  // Calculate feature access
  useEffect(() => {
    const calculateAccess = () => {
      if (!subscription.featureAccess) {
        setGateResult(prev => ({
          ...prev,
          hasAccess: false,
          isGated: true,
          upgradeMessage: 'Loading subscription data...',
        }));
        return;
      }

      const featureDef = featureDefinitions[feature];
      if (!featureDef) {
        // Unknown feature, allow access
        setGateResult(prev => ({
          ...prev,
          hasAccess: true,
          isGated: false,
          upgradeMessage: '',
        }));
        return;
      }

      const featureAccess = subscription.featureAccess.features[feature];
      const hasBasicAccess = subscription.hasFeatureAccess(feature);
      const requiredTier = featureDef.requiredTier;

      // Check if user is in grace period (for downgrades)
      let inGracePeriod = false;
      if (defaultConfig.gracePeriodDays && defaultConfig.gracePeriodDays > 0) {
        // Implementation would check if user recently downgraded
        // and is still within grace period
        inGracePeriod = false; // Placeholder
      }

      // Check usage limits
      let usageExceeded = false;
      let usageRemaining: number | undefined;
      let usageLimit: number | undefined;

      if (featureAccess?.usageLimit && featureAccess?.usageCount !== undefined) {
        usageLimit = featureAccess.usageLimit;
        usageRemaining = Math.max(0, usageLimit - featureAccess.usageCount);
        usageExceeded = featureAccess.usageCount >= usageLimit;
      }

      // Determine access
      const hasAccess = hasBasicAccess && !usageExceeded;
      const canBypass = defaultConfig.softGate || inGracePeriod;

      let upgradeMessage = featureDef.upgradeMessage;
      if (usageExceeded && hasBasicAccess) {
        upgradeMessage = `You've reached your ${feature.replace('_', ' ')} limit. Upgrade for unlimited access!`;
      }

      const result: FeatureGateResult = {
        hasAccess,
        isGated: !hasAccess,
        requiredTier: hasBasicAccess ? null : requiredTier,
        usageRemaining,
        usageLimit,
        upgradeMessage,
        canBypass,
        bypassReason: inGracePeriod ? 'grace_period' : undefined,
      };

      setGateResult(result);

      // Trigger callbacks
      if (!hasAccess && onAccessDenied) {
        onAccessDenied(result);
      }

      if (requiredTier && !hasBasicAccess && onUpgradeRequired) {
        onUpgradeRequired(requiredTier);
      }
    };

    calculateAccess();
  }, [feature, subscription.featureAccess, subscription.userTier]);

  // Actions
  const requestAccess = useCallback(async (): Promise<boolean> => {
    // Check if access can be granted (e.g., during trial)
    if (gateResult.canBypass) {
      // Temporarily grant access
      setGateResult(prev => ({ ...prev, hasAccess: true, isGated: false }));

      analytics.trackFeatureUsage('feature_gate_bypassed', undefined, {
        userId,
        feature,
        reason: gateResult.bypassReason || 'soft_gate',
      });

      return true;
    }

    // Track access request
    analytics.trackFeatureUsage('feature_access_requested', undefined, {
      userId,
      feature,
      currentTier: subscription.userTier,
      requiredTier: gateResult.requiredTier,
    });

    return false;
  }, [userId, feature, gateResult, subscription.userTier]);

  const trackFeatureAttempt = useCallback(() => {
    if (!defaultConfig.trackUsage) return;

    analytics.trackFeatureUsage('feature_gate_hit', undefined, {
      userId,
      feature,
      hasAccess: gateResult.hasAccess,
      isGated: gateResult.isGated,
      currentTier: subscription.userTier,
      requiredTier: gateResult.requiredTier,
    });
  }, [userId, feature, gateResult, subscription.userTier]);

  const showUpgradeModal = useCallback(() => {
    if (defaultConfig.redirectToUpgrade && gateResult.requiredTier) {
      // Implementation would show upgrade modal or navigate to pricing
      analytics.trackFeatureUsage('upgrade_modal_requested', undefined, {
        userId,
        feature,
        requiredTier: gateResult.requiredTier,
      });

      // You would implement this to show your upgrade modal
      // For now, we'll just track the event
    }
  }, [userId, feature, gateResult.requiredTier]);

  const bypassGate = useCallback(
    (reason: string) => {
      setGateResult(prev => ({
        ...prev,
        hasAccess: true,
        isGated: false,
        bypassReason: reason,
      }));

      analytics.trackFeatureUsage('feature_gate_bypassed_manual', undefined, {
        userId,
        feature,
        reason,
      });
    },
    [userId, feature]
  );

  return {
    ...gateResult,
    requestAccess,
    trackFeatureAttempt,
    showUpgradeModal,
    bypassGate,
  };
}

export default useFeatureGate;
