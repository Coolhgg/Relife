// Feature Gate Components for Relife Alarm App
// Provides UI components for premium feature access control

import React, { ReactNode } from 'react';
import { Lock, Crown, Zap, Sparkles } from 'lucide-react';
import useFeatureGate from '../../hooks/useFeatureGate';
import type { SubscriptionTier } from '../../types/premium';

interface FeatureGateProps {
  children: ReactNode;
  feature: string;
  userId: string;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  softGate?: boolean;
  customMessage?: string;
  className?: string;
  onUpgradeClick?: (requiredTier: SubscriptionTier) => void;
}

export function FeatureGate({
  children,
  feature,
  userId,
  fallback,
  showUpgradePrompt = true,
  softGate = false,
  customMessage,
  className = '',
  onUpgradeClick,
}: FeatureGateProps) {
  const featureGate = useFeatureGate({
    userId,
    feature,
    config: { softGate },
    onUpgradeRequired: onUpgradeClick,
  });

  // Track when gate is encountered
  React.useEffect(() => {
    if (featureGate.isGated) {
      featureGate.trackFeatureAttempt();
    }
  }, [featureGate.isGated]);

  if (featureGate.hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <UpgradePrompt
        feature={feature}
        requiredTier={featureGate.requiredTier}
        message={customMessage || featureGate.upgradeMessage}
        usageRemaining={featureGate.usageRemaining}
        usageLimit={featureGate.usageLimit}
        canBypass={featureGate.canBypass}
        onUpgradeClick={() => {
          featureGate.showUpgradeModal();
          if (onUpgradeClick && featureGate.requiredTier) {
            onUpgradeClick(featureGate.requiredTier);
          }
        }}
        onBypass={softGate ? () => featureGate.requestAccess() : undefined}
        className={className}
      />
    );
  }

  return null;
}

interface UpgradePromptProps {
  feature: string;
  requiredTier: SubscriptionTier | null;
  message: string;
  usageRemaining?: number;
  usageLimit?: number;
  canBypass: boolean;
  onUpgradeClick: () => void;
  onBypass?: () => void;
  className?: string;
}

function UpgradePrompt({
  feature,
  requiredTier,
  message,
  usageRemaining,
  usageLimit,
  canBypass,
  onUpgradeClick,
  onBypass,
  className = '',
}: UpgradePromptProps) {
  const getTierIcon = (tier: SubscriptionTier | null) => {
    switch (tier) {
      case 'basic':
        return <Zap className="w-5 h-5 text-blue-500" />;
      case 'premium':
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      case 'pro':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      default:
        return <Lock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTierColor = (tier: SubscriptionTier | null) => {
    switch (tier) {
      case 'basic':
        return 'border-blue-200 bg-blue-50';
      case 'premium':
        return 'border-purple-200 bg-purple-50';
      case 'pro':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTierName = (tier: SubscriptionTier | null) => {
    switch (tier) {
      case 'basic':
        return 'Basic';
      case 'premium':
        return 'Premium';
      case 'pro':
        return 'Pro';
      default:
        return 'Premium';
    }
  };

  return (
    <div
      className={`rounded-lg border-2 ${getTierColor(requiredTier)} p-6 text-center ${className}`}
    >
      <div className="flex justify-center mb-4">{getTierIcon(requiredTier)}</div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {requiredTier ? `${getTierName(requiredTier)} Feature` : 'Premium Feature'}
      </h3>

      <p className="text-gray-600 mb-4">{message}</p>

      {usageLimit && usageRemaining !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Usage this month</span>
            <span>
              {usageLimit - usageRemaining} / {usageLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, ((usageLimit - usageRemaining) / usageLimit) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <button
          onClick={onUpgradeClick}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            requiredTier === 'basic'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : requiredTier === 'premium'
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : requiredTier === 'pro'
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
        >
          Upgrade to {getTierName(requiredTier)}
        </button>

        {canBypass && onBypass && (
          <button
            onClick={onBypass}
            className="px-6 py-2 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Try It Once
          </button>
        )}
      </div>
    </div>
  );
}

// Higher Order Component for feature gating
export function withFeatureGate<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: string,
  config?: {
    fallback?: ReactNode;
    showUpgradePrompt?: boolean;
    softGate?: boolean;
  }
) {
  return function FeatureGatedComponent(props: P & { userId: string }) {
    const { userId, ...restProps } = props;

    return (
      <FeatureGate
        feature={feature}
        userId={userId}
        fallback={config?.fallback}
        showUpgradePrompt={config?.showUpgradePrompt}
        softGate={config?.softGate}
      >
        <WrappedComponent {...(restProps as P)} />
      </FeatureGate>
    );
  };
}

// Inline feature access check component
interface FeatureAccessProps {
  children: (hasAccess: boolean, upgrade: () => void) => ReactNode;
  feature: string;
  userId: string;
}

export function FeatureAccess({ children, feature, userId }: FeatureAccessProps) {
  const featureGate = useFeatureGate({ userId, feature });

  return <>{children(featureGate.hasAccess, featureGate.showUpgradeModal)}</>;
}

// Usage limit indicator component
interface UsageLimitIndicatorProps {
  feature: string;
  userId: string;
  showOnlyWhenNearLimit?: boolean;
  warningThreshold?: number; // percentage (0-100)
  className?: string;
}

export function UsageLimitIndicator({
  feature,
  userId,
  showOnlyWhenNearLimit = true,
  warningThreshold = 80,
  className = '',
}: UsageLimitIndicatorProps) {
  const featureGate = useFeatureGate({ userId, feature });

  if (!featureGate.usageLimit || featureGate.usageRemaining === undefined) {
    return null;
  }

  const usagePercentage =
    ((featureGate.usageLimit - featureGate.usageRemaining) / featureGate.usageLimit) *
    100;

  if (showOnlyWhenNearLimit && usagePercentage < warningThreshold) {
    return null;
  }

  const isNearLimit = usagePercentage >= warningThreshold;
  const isAtLimit = featureGate.usageRemaining === 0;

  return (
    <div
      className={`rounded-lg p-3 ${isAtLimit ? 'bg-red-50 border border-red-200' : isNearLimit ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'} ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-sm font-medium ${isAtLimit ? 'text-red-700' : isNearLimit ? 'text-yellow-700' : 'text-gray-700'}`}
        >
          {feature.replace('_', ' ')} Usage
        </span>
        <span
          className={`text-sm ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-600'}`}
        >
          {featureGate.usageLimit - featureGate.usageRemaining} /{' '}
          {featureGate.usageLimit}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(100, usagePercentage)}%` }}
        />
      </div>

      {isAtLimit && (
        <p className="text-xs text-red-600">
          You've reached your limit. Upgrade for unlimited access!
        </p>
      )}

      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-yellow-600">
          {featureGate.usageRemaining} uses remaining this month
        </p>
      )}
    </div>
  );
}
