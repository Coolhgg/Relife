import React, { useState } from 'react';
import {
  Lock,
  Crown,
  Star,
  Unlock,
  Eye,
  Zap,
  ArrowRight,
  Info,
  X,
} from "lucide-react";
import UpgradePrompt from "./UpgradePrompt";

interface FeatureLockOverlayProps {
  /** Whether the feature is locked */
  isLocked: boolean;
  /** Required subscription tier */
  requiredTier?: string;
  /** Feature name */
  featureName: string;
  /** Feature description */
  description?: string;
  /** Feature ID for upgrade prompt */
  featureId?: string;
  /** Children to render (the locked content) */
  children: React.ReactNode;
  /** Blur the content when locked */
  blurContent?: boolean;
  /** Show preview button */
  showPreview?: boolean;
  /** Custom unlock message */
  unlockMessage?: string;
  /** Overlay variant */
  variant?: 'overlay' | 'card' | 'banner' | 'minimal';
  /** Callback when upgrade is clicked */
  onUpgrade?: () => void;
  /** Callback when preview is clicked */
  onPreview?: () => void;
}

const FeatureLockOverlay: React.FC<FeatureLockOverlayProps> = ({
  isLocked,
  requiredTier,
  featureName,
  description,
  featureId,
  children,
  blurContent = true,
  showPreview = false,
  unlockMessage,
  variant = 'overlay',
  onUpgrade,
  onPreview
}) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const getTierInfo = () => {
    switch (requiredTier) {
      case 'ultimate':
        return {
          name: 'Ultimate',
          icon: Star,
          color: 'from-purple-500 to-pink-500',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-600',
          price: '$19.99/month'
        };
      case 'premium':
        return {
          name: 'Premium',
          icon: Crown,
          color: 'from-orange-500 to-red-500',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-600',
          price: '$9.99/month'
        };
      default:
        return {
          name: 'Premium',
          icon: Crown,
          color: 'from-orange-500 to-red-500',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-600',
          price: '$9.99/month'
        };
    }
  };

  const tierInfo = getTierInfo();
  const TierIcon = tierInfo.icon;

  const handleUpgrade = (tier?: string) => {

    if (onUpgrade) {
      onUpgrade(tier || requiredTier);
    } else {
      setShowUpgradeModal(true);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview();
    } else {
      setShowPreviewModal(true);
    }
  };

  // If not locked, just render children
  if (!isLocked) {
    return <>{children}</>;
  }

  if (variant === 'banner') {
    return (
      <div className="relative">
        <div className={blurContent ? 'filter blur-sm pointer-events-none select-none' : 'pointer-events-none select-none opacity-50'}>
          {children}
        </div>

        <div className={`absolute inset-x-0 top-0 bg-gradient-to-r ${tierInfo.color} text-white p-3 rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TierIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{unlockMessage || `${featureName} requires ${tierInfo.name}`}</span>
            </div>
            <button
              onClick={() => handleUpgrade()}
              className="bg-white bg-opacity-20 text-white px-3 py-1 rounded text-sm font-medium hover:bg-opacity-30 transition-colors"
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="relative group">
        <div className={blurContent ? 'filter blur-sm pointer-events-none select-none' : 'pointer-events-none select-none opacity-50'}>
          {children}
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => handleUpgrade()}
            className={`bg-gradient-to-r ${tierInfo.color} text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2`}
          >
            <Lock className="h-4 w-4" />
            Unlock
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="relative">
        {blurContent && (
          <div className="filter blur-sm pointer-events-none select-none">
            {children}
          </div>
        )}

        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center">
          <div className="mb-4">
            <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center bg-gradient-to-br ${tierInfo.color}`}>
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{featureName}</h3>
            <p className="text-gray-600 mb-4">
              {description || `This feature requires ${tierInfo.name} subscription`}
            </p>
          </div>

          <div className="space-y-3">
            {showPreview && (
              <button
                onClick={handlePreview}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview Feature
              </button>
            )}

            <button
              onClick={() => handleUpgrade()}
              className={`w-full bg-gradient-to-r ${tierInfo.color} text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2`}
            >
              <TierIcon className="h-4 w-4" />
              Upgrade to {tierInfo.name}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default overlay variant
  return (
    <>
      <div className="relative">
        <div className={blurContent ? 'filter blur-sm pointer-events-none select-none' : 'pointer-events-none select-none opacity-30'}>
          {children}
        </div>

        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 text-center shadow-lg">
            <div className="mb-4">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center bg-gradient-to-br ${tierInfo.color}`}>
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{featureName}</h3>
              <p className="text-sm text-gray-600">
                {unlockMessage || `Requires ${tierInfo.name} subscription`}
              </p>
            </div>

            <div className="space-y-3">
              {showPreview && (
                <button
                  onClick={handlePreview}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
              )}

              <button
                onClick={() => handleUpgrade()}
                className={`w-full bg-gradient-to-r ${tierInfo.color} text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm`}
              >
                <TierIcon className="h-4 w-4" />
                Upgrade ({tierInfo.price})
              </button>

              {description && (
                <div className="text-xs text-gray-500 mt-2">
                  <Info className="h-3 w-3 inline mr-1" />
                  {description}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showUpgradeModal && featureId && (
        <UpgradePrompt
          feature={featureId}
          onUpgrade={tier => {
            setShowUpgradeModal(false);
            onUpgrade?.(tier);
          }}
          onDismiss={() => setShowUpgradeModal(false)}
        />
      )}

      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {featureName} Preview
                </h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                {/* Render a preview version of the children */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="text-center text-gray-600 mb-4">
                    <Eye className="h-8 w-8 mx-auto mb-2" />
                    <p>This is a preview of the {featureName} feature.</p>
                    <p className="text-sm">Full functionality available with {tierInfo.name} subscription.</p>
                  </div>
                  {/* Could render a limited/demo version of children here */}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleUpgrade();
                  }}
                  className={`flex-1 bg-gradient-to-r ${tierInfo.color} text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2`}
                >
                  <TierIcon className="h-4 w-4" />
                  Unlock Full Feature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeatureLockOverlay;
