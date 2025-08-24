// Premium Gate Component - Simplified Version
import React, { ReactNode } from 'react';
import { Lock, Crown } from 'lucide-react';

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
  userTier?: string;
  requiredTier?: string;
  mode?: string;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  onUpgrade?: () => void;
  className?: string;
}

const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  feature,
  userTier = 'free',
  requiredTier = 'premium',
  _mode,
  fallback,
  showUpgradePrompt = true,
  onUpgrade,
  className = '',
}) => {
  // Simple tier hierarchy check
  const tierHierarchy = {
    free: 0,
    basic: 1,
    premium: 2,
    pro: 3,
    ultimate: 4,
  };

  const hasAccess =
    (tierHierarchy[userTier] || 0) >= (tierHierarchy[requiredTier] || 0);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      className={`premium-gate bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-6 text-center ${className}`}
    >
      <div className="flex flex-col items-center">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-3 mb-4">
          <Crown className="w-6 h-6 text-white" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Feature</h3>

        <p className="text-gray-600 mb-4">
          {feature} requires a {requiredTier} subscription or higher.
        </p>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Lock className="w-4 h-4" />
          <span>Unlock with {requiredTier} plan</span>
        </div>

        {showUpgradePrompt && (
          <button
            onClick={onUpgrade}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Crown className="w-4 h-4" />
            Upgrade to {requiredTier}
          </button>
        )}

        <p className="text-xs text-gray-500 mt-3">
          Already have a subscription? Refresh the page to update your access.
        </p>
      </div>
    </div>
  );
};

export default PremiumGate;
