import React, { useState } from 'react';
import {
  Lock,
  Crown,
  Star,
  Check,
  ChevronRight,
  Zap,
  Info,
  Eye,
} from "lucide-react";
import UpgradePrompt from "./UpgradePrompt";

interface PremiumFeatureCardProps {
  /** Feature information */
  feature: {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<any>;
    benefits?: string[];
    comingSoon?: boolean;
  };
  /** Current user */
  user: User;
  /** Whether user has access to this feature */
  hasAccess: boolean;
  /** Callback when feature is clicked */
  onClick?: () => void;
  /** Callback when upgrade is requested */
  /** Card variant */
  variant?: 'default' | 'compact' | 'detailed';
  /** Whether to show preview for locked features */
  showPreview?: boolean;
}

const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({
  feature,
  user,
  hasAccess,
  onClick,
  onUpgrade,
  variant = 'default',
  showPreview = false
}) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getTierBadge = () => {
    if (feature.tier === 'ultimate') {
      return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          <Star className="h-3 w-3" />
          ULTIMATE
        </div>
      );
    } else if (feature.tier === 'premium') {
      return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          <Crown className="h-3 w-3" />
          PREMIUM
        </div>
      );
    }
    return null;
  };

  const getTierColor = () => {
    if (feature.tier === 'ultimate') {
      return {
        gradient: 'from-purple-500 to-pink-500',
        border: 'border-purple-200',
        bg: 'bg-purple-50',
        text: 'text-purple-600'
      };
    } else if (feature.tier === 'premium') {
      return {
        gradient: 'from-orange-500 to-red-500',
        border: 'border-orange-200',
        bg: 'bg-orange-50',
        text: 'text-orange-600'
      };
    }
    return {
      gradient: 'from-gray-500 to-gray-600',
      border: 'border-gray-200',
      bg: 'bg-gray-50',
      text: 'text-gray-600'
    };
  };

  const colors = getTierColor();
  const Icon = feature.icon;

  const handleClick = () => {
    if (hasAccess && onClick) {
      onClick();
    } else if (!hasAccess) {
      if (onUpgrade) {
        onUpgrade(feature.tier);
      } else {
        setShowUpgradeModal(true);
      }
    }
  };

    setShowUpgradeModal(false);
    if (onUpgrade) {
      onUpgrade(tier);
    } else {
      // Default upgrade action - redirect to pricing
      console.log(`Upgrading to ${tier}...`);
    }
  };

  if (variant === 'compact') {
    return (
      <>
        <div
          className={`relative bg-white border-2 rounded-lg p-4 transition-all duration-300 cursor-pointer hover:shadow-md ${
            hasAccess ? 'border-green-200 hover:border-green-300' : `${colors.border} hover:shadow-lg`
          } ${isHovered && !hasAccess ? 'scale-105' : ''}`}
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {!hasAccess && (
            <div className="absolute top-2 right-2">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              hasAccess ? 'bg-green-100 text-green-600' : `${colors.bg} ${colors.text}`
            }`}>
              <Icon className="h-5 w-5" />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">{feature.name}</h3>
              <p className="text-xs text-gray-600 line-clamp-1">{feature.description}</p>
            </div>

            {hasAccess ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>

        {showUpgradeModal && (
          <UpgradePrompt
            feature={feature.id}
            onUpgrade={handleUpgrade}
            onDismiss={() => setShowUpgradeModal(false)}
          />
        )}
      </>
    );
  }

  if (variant === 'detailed') {
    return (
      <>
        <div
          className={`relative bg-white border-2 rounded-xl p-6 transition-all duration-300 ${
            hasAccess
              ? 'border-green-200'
              : `${colors.border} hover:shadow-lg cursor-pointer`
          } ${isHovered && !hasAccess ? 'transform scale-105' : ''}`}
          onClick={!hasAccess ? handleClick : undefined}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Status indicators */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {feature.comingSoon && (
              <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                Coming Soon
              </div>
            )}
            {getTierBadge()}
            {!hasAccess && <Lock className="h-4 w-4 text-gray-400" />}
            {hasAccess && <Check className="h-5 w-5 text-green-500" />}
          </div>

          <div className="mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              hasAccess ? 'bg-green-100 text-green-600' : `${colors.bg} ${colors.text}`
            }`}>
              <Icon className="h-8 w-8" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.name}</h3>
            <p className="text-gray-600 mb-4">{feature.description}</p>

            {feature.benefits && feature.benefits.length > 0 && (
              <div className="space-y-2 mb-4">
                {feature.benefits.slice(0, 4).map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="bg-green-100 text-green-600 p-0.5 rounded-full">
                      <Check className="h-3 w-3" />
                    </div>
                    {benefit}
                  </div>
                ))}
                {feature.benefits.length > 4 && (
                  <div className="text-sm text-gray-500">
                    +{feature.benefits.length - 4} more benefits
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action area */}
          <div className="border-t pt-4">
            {hasAccess ? (
              <button
                onClick={onClick}
                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Use Feature
              </button>
            ) : feature.comingSoon ? (
              <button
                disabled
                className="w-full bg-gray-100 text-gray-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed"
              >
                Coming Soon
              </button>
            ) : (
              <div className="space-y-2">
                {showPreview && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      // Show preview functionality
                      console.log(`Showing preview for ${feature.name}`);
                    }}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Eye className="h-4 w-4" />
                    Preview Feature
                  </button>
                )}
                <button
                  onClick={handleClick}
                  className={`w-full bg-gradient-to-r ${colors.gradient} text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2`}
                >
                  {feature.tier === 'ultimate' ? <Star className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
                  Unlock with {feature.tier === 'ultimate' ? 'Ultimate' : 'Premium'}
                </button>
              </div>
            )}
          </div>
        </div>

        {showUpgradeModal && (
          <UpgradePrompt
            feature={feature.id}
            onUpgrade={handleUpgrade}
            onDismiss={() => setShowUpgradeModal(false)}
          />
        )}
      </>
    );
  }

  // Default variant
  return (
    <>
      <div
        className={`relative bg-white border-2 rounded-xl p-6 transition-all duration-300 ${
          hasAccess
            ? 'border-green-200'
            : `${colors.border} hover:shadow-lg cursor-pointer`
        } ${isHovered && !hasAccess ? 'transform scale-105' : ''}`}
        onClick={!hasAccess ? handleClick : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            hasAccess ? 'bg-green-100 text-green-600' : `${colors.bg} ${colors.text}`
          }`}>
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex items-center gap-2">
            {feature.comingSoon && (
              <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                Coming Soon
              </div>
            )}
            {getTierBadge()}
            {!hasAccess && <Lock className="h-4 w-4 text-gray-400" />}
            {hasAccess && <Check className="h-5 w-5 text-green-500" />}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.name}</h3>
          <p className="text-gray-600 text-sm">{feature.description}</p>
        </div>

        {/* Benefits preview */}
        {feature.benefits && feature.benefits.length > 0 && (
          <div className="space-y-1 mb-4">
            {feature.benefits.slice(0, 2).map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                <div className="bg-green-100 text-green-600 p-0.5 rounded-full">
                  <Check className="h-2.5 w-2.5" />
                </div>
                {benefit}
              </div>
            ))}
            {feature.benefits.length > 2 && (
              <div className="text-xs text-gray-500">
                +{feature.benefits.length - 2} more
              </div>
            )}
          </div>
        )}

        {/* Action button */}
        <div className="pt-4 border-t">
          {hasAccess ? (
            <button
              onClick={onClick}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Zap className="h-4 w-4" />
              Use Feature
            </button>
          ) : feature.comingSoon ? (
            <div className="w-full text-center py-2 text-gray-500 text-sm">
              Coming Soon
            </div>
          ) : (
            <button
              onClick={handleClick}
              className={`w-full bg-gradient-to-r ${colors.gradient} text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm`}
            >
              {feature.tier === 'ultimate' ? <Star className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
              Upgrade to Unlock
            </button>
          )}
        </div>
      </div>

      {showUpgradeModal && (
        <UpgradePrompt
          feature={feature.id}
          onUpgrade={handleUpgrade}
          onDismiss={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  );
};

export default PremiumFeatureCard;