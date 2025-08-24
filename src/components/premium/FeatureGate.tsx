// Feature Gate Components for Relife Alarm App - Simplified Version
import React, { ReactNode } from 'react';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
  children: ReactNode;
  feature: string;
  userId: string;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  softGate?: boolean;
  customMessage?: string;
  className?: string;
  onUpgradeClick?: (
) => void;
}

function FeatureGate({
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
  // Simplified implementation for testing
  const hasAccess = true; // TODO: Replace with actual feature gate logic

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={`premium-gate ${className}`}>
      <div className="flex items-center justify-center p-6 bg-gray-100 rounded-lg">
        <Lock className="w-6 h-6 mr-2" />
        <span>{customMessage || 'This feature requires a premium subscription'}</span>
        {showUpgradePrompt && onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
}

export default FeatureGate;
