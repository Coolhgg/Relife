// Feature Utility Components for Relife Alarm App
// Additional utility components for feature gating and premium features

import React, { ReactNode } from 'react';
import { Shield, Star, Lock, TrendingUp, Users, Zap } from 'lucide-react';
import { useFeatureAccessContext } from '../../contexts/FeatureAccessContext';

// Feature Badge Component
interface FeatureBadgeProps {
  tier?: string; // auto: added for prop compatibility
  size?: 'sm' | 'md' | 'lg';
  variant?: 'subtle' | 'prominent';
  className?: string;
}

export function FeatureBadge({
  tier, // auto: added destructuring for existing usage
  size = 'md',
  variant = 'subtle',
  className = '',
}: FeatureBadgeProps) {
  const getConfig = (
) => {
    switch (tier) {
      case 'basic':
        return {
          label: 'Basic',
          icon: Zap,
          colors:
            variant === 'prominent'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-blue-100 text-blue-700 border-blue-200',
        };
      case 'premium':
        return {
          label: 'Premium',
          icon: Star,
          colors:
            variant === 'prominent'
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-purple-100 text-purple-700 border-purple-200',
        };
      case 'pro':
        return {
          label: 'Pro',
          icon: Shield,
          colors:
            variant === 'prominent'
              ? 'bg-yellow-600 text-white border-yellow-600'
              : 'bg-yellow-100 text-yellow-700 border-yellow-200',
        };
      default:
        return {
          label: 'Premium',
          icon: Lock,
          colors:
            variant === 'prominent'
              ? 'bg-gray-600 text-white border-gray-600'
              : 'bg-gray-100 text-gray-700 border-gray-200',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.colors} ${sizeClasses[size]} ${className}`}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
    </span>
  );
}

// Tier Comparison Component
interface TierComparisonProps {
  features?: string[];
  className?: string;
  currentTier?: string; // auto: added for prop compatibility
  targetTier?: string; // auto: added for prop compatibility
}

export function TierComparison({
  currentTier,
  targetTier,
  features = [],
  className = '',
}: TierComparisonProps) {
  const tierHierarchy = ['free', 'basic', 'premium', 'pro', 'enterprise'];
  const isUpgrade =
    tierHierarchy.indexOf(targetTier) > tierHierarchy.indexOf(currentTier);

  const getNewFeatures = (
) => {
    // This would ideally come from a feature service
    const featuresByTier = {
      basic: ['Unlimited Alarms', 'Custom Sounds', 'Premium Themes', 'Alarm Battles'],
      premium: [
        'Smart Scheduling',
        'Calendar Integration',
        'Advanced Analytics',
        'Unlimited Battles',
      ],
      pro: ['Team Features', 'API Access', 'White Label', 'Custom Theme Creator'],
    };

    return featuresByTier[targetTier] || [];
  };

  const newFeatures = features.length > 0 ? features : getNewFeatures();

  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FeatureBadge tier={currentTier} size="sm" />
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <FeatureBadge tier={targetTier} size="sm" variant="prominent" />
        </div>
        <span
          className={`text-sm font-medium ${isUpgrade ? 'text-green-600' : 'text-orange-600'}`}
        >
          {isUpgrade ? 'Upgrade' : 'Downgrade'}
        </span>
      </div>

      {newFeatures.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            {isUpgrade ? "New features you'll get:" : "Features you'll lose:"}
          </h4>
          <ul className="space-y-1">
            {newFeatures.map((feature, index
) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isUpgrade ? 'bg-green-500' : 'bg-red-500'}`}
                />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Usage Progress Component
interface UsageProgressProps {
  feature: string;
  showLabel?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export function UsageProgress({
  feature,
  showLabel = true,
  showPercentage = false,
  className = '',
}: UsageProgressProps) {
  const { getFeatureUsage } = useFeatureAccessContext();
  const usage = getFeatureUsage(feature);

  if (!usage) {
    return null;
  }

  const percentage = (usage.used / usage.limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className={`${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 capitalize">
            {feature.replace('_', ' ')} Usage
          </span>
          <span className="text-sm text-gray-500">
            {usage.used} / {usage.limit}
            {showPercentage && ` (${Math.round(percentage)}%)`}
          </span>
        </div>
      )}

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {isAtLimit && (
        <p className="text-xs text-red-600 mt-1">
          Limit reached. Upgrade for unlimited access!
        </p>
      )}
    </div>
  );
}

// Feature Highlight Component
interface FeatureHighlightProps {
  feature: string;
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
  onLearnMore?: (
) => void;
  className?: string;
}

export function FeatureHighlight({
  feature,
  title,
  description,
  icon: Icon = Star,
  tier,
  comingSoon = false,
  onLearnMore,
  className = '',
}: FeatureHighlightProps) {
  const { hasFeatureAccess, trackFeatureAttempt } = useFeatureAccessContext();
  const hasAccess = hasFeatureAccess(feature);

  const handleClick = (
) => {
    trackFeatureAttempt(feature, { source: 'feature_highlight' });
    if (onLearnMore) {
      onLearnMore();
    }
  };

  return (
    <div
      className={`relative bg-white border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${className}`}
    >
      {/* Feature Badge */}
      <div className="absolute top-2 right-2">
        <FeatureBadge tier={tier} size="sm" />
      </div>

      {/* Coming Soon Badge */}
      {comingSoon && (
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            Coming Soon
          </span>
        </div>
      )}

      {/* Content */}
      <div className="pr-16">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`p-2 rounded-lg ${hasAccess ? 'bg-green-100' : 'bg-gray-100'}`}
          >
            <Icon
              className={`w-5 h-5 ${hasAccess ? 'text-green-600' : 'text-gray-500'}`}
            />
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>

        <p className="text-gray-600 text-sm mb-3">{description}</p>

        {/* Action Button */}
        <button
          onClick={handleClick}
          disabled={comingSoon}
          className={`text-sm font-medium transition-colors ${
            hasAccess
              ? 'text-green-600 hover:text-green-700'
              : comingSoon
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          {comingSoon ? 'Coming Soon' : hasAccess ? 'Available' : 'Learn More'}
        </button>
      </div>

      {/* Access Indicator */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
          hasAccess ? 'bg-green-500' : comingSoon ? 'bg-orange-500' : 'bg-gray-300'
        }`}
      />
    </div>
  );
}

// Subscription Prompt Component
interface SubscriptionPromptProps {
  feature: string;
  title?: string;
  description?: string;
  ctaText?: string;
  onUpgrade?: (
) => void;
  onDismiss?: (
) => void;
  className?: string;
}

export function SubscriptionPrompt({
  feature,
  title,
  description,
  ctaText = 'Upgrade Now',
  onUpgrade,
  onDismiss,
  className = '',
}: SubscriptionPromptProps) {
  const { getUpgradeRequirement, trackFeatureAttempt } = useFeatureAccessContext();
  const requiredTier = getUpgradeRequirement(feature);

  const handleUpgradeClick = (
) => {
    trackFeatureAttempt(feature, { source: 'subscription_prompt' });
    if (onUpgrade) {
      onUpgrade();
    }
  };

  if (!requiredTier) {
    return null;
  }

  const defaultTitle = `Upgrade to ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}`;
  const defaultDescription = `This feature requires a ${requiredTier} subscription. Upgrade now to unlock this and many other premium features.`;

  return (
    <div
      className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{title || defaultTitle}</h3>
          <p className="text-gray-600 text-sm mb-3">
            {description || defaultDescription}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUpgradeClick}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              {ctaText}
            </button>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Maybe Later
              </button>
            )}
          </div>
        </div>

        <FeatureBadge tier={requiredTier} variant="prominent" />
      </div>
    </div>
  );
}

// Team Feature Indicator
interface TeamFeatureIndicatorProps {
  feature: string;
  teamSize?: number;
  className?: string;
}

export function TeamFeatureIndicator({
  feature,
  teamSize,
  className = '',
}: TeamFeatureIndicatorProps) {
  const { hasFeatureAccess } = useFeatureAccessContext();
  const hasAccess = hasFeatureAccess(feature);

  if (!hasAccess) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium ${className}`}
    >
      <Users className="w-3 h-3" />
      Team Feature
      {teamSize && <span>({teamSize} members)</span>}
    </div>
  );
}

export default {
  FeatureBadge,
  TierComparison,
  UsageProgress,
  FeatureHighlight,
  SubscriptionPrompt,
  TeamFeatureIndicator,
};
