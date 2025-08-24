// Premium Feature Card Component - Simplified Version
import React, { useState } from 'react';
import { Crown, Star, Lock, ArrowRight } from 'lucide-react';

interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  tier: string;
  icon: React.ComponentType<any>;
  preview?: string;
}

interface User {
  tier?: string;
}

interface PremiumFeatureCardProps {
  feature: PremiumFeature;
  user: User;
  hasAccess: boolean;
  onClick?: () => void;
  onUpgrade?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  showPreview?: boolean;
}

const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({
  feature,
  user,
  hasAccess,
  onClick,
  onUpgrade,
  variant = 'default',
  showPreview = false,
}) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getTierBadge = () => {
    if (feature.tier === 'ultimate') {
      return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          <Star className="w-3 h-3" />
          Ultimate
        </div>
      );
    }

    if (feature.tier === 'pro') {
      return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          <Crown className="w-3 h-3" />
          Pro
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
        <Crown className="w-3 h-3" />
        Premium
      </div>
    );
  };

  const getTierColor = () => {
    switch (feature.tier) {
      case 'ultimate':
        return 'from-purple-500 to-pink-500';
      case 'pro':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-yellow-500 to-orange-500';
    }
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setShowUpgradeModal(true);
    }
  };

  const handleCardClick = () => {
    if (hasAccess) {
      onClick?.();
    } else {
      handleUpgrade();
    }
  };

  if (variant === 'compact') {
    return (
      <div
        className={`relative p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
          hasAccess
            ? 'border-green-200 bg-green-50 hover:bg-green-100'
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
        }`}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${getTierColor()}`}>
              <feature.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{feature.name}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasAccess && <Lock className="w-4 h-4 text-gray-400" />}
            <ArrowRight
              className={`w-4 h-4 transition-transform ${isHovered ? 'translate-x-1' : ''}`}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-white rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-lg ${
        hasAccess ? 'border-green-200' : 'border-gray-200'
      }`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tier Badge */}
      <div className="absolute top-4 right-4">{getTierBadge()}</div>

      {/* Lock Icon for Locked Features */}
      {!hasAccess && (
        <div className="absolute top-4 left-4">
          <Lock className="w-5 h-5 text-gray-400" />
        </div>
      )}

      <div className="p-6">
        {/* Feature Icon */}
        <div
          className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${getTierColor()} mb-4`}
        >
          <feature.icon className="w-6 h-6 text-white" />
        </div>

        {/* Feature Info */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.name}</h3>
        <p className="text-gray-600 mb-4">{feature.description}</p>

        {/* Preview */}
        {showPreview && feature.preview && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700">{feature.preview}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between">
          {hasAccess ? (
            <button
              onClick={(e: any) => // auto: implicit any {
                e.stopPropagation();
                onClick?.();
              }}
              className="flex items-center gap-2 text-green-600 font-medium hover:text-green-700"
            >
              Use Feature
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={(e: any) => // auto: implicit any {
                e.stopPropagation();
                handleUpgrade();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r ${getTierColor()} hover:shadow-md transition-all duration-200`}
            >
              <Crown className="w-4 h-4" />
              Upgrade to {feature.tier}
            </button>
          )}
        </div>
      </div>

      {/* Hover Effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${getTierColor()} opacity-0 rounded-xl transition-opacity duration-300 ${
          isHovered && !hasAccess ? 'opacity-5' : ''
        }`}
      />
    </div>
  );
};

export default PremiumFeatureCard;
