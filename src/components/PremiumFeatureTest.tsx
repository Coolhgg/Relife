// Premium Feature Test Component - Simplified Version
import React, { useState } from 'react';
import { Crown, Star, Zap, Shield } from 'lucide-react';

interface PremiumFeatureTestProps {
  userTier?: string;
  onUpgrade?: () => void;
  className?: string;
}

const PremiumFeatureTest: React.FC<PremiumFeatureTestProps> = ({
  userTier = 'free',
  onUpgrade,
  className = ''
}) => {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features = [
    {
      id: 'nuclear-mode',
      name: 'Nuclear Mode',
      description: 'Ultra-challenging wake-up tasks',
      icon: Zap,
      tier: 'premium',
      color: 'from-red-500 to-orange-600'
    },
    {
      id: 'voice-cloning',
      name: 'Voice Cloning',
      description: 'Create custom AI voices',
      icon: Star,
      tier: 'pro',
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'analytics-pro',
      name: 'Advanced Analytics',
      description: 'Detailed sleep and wake patterns',
      icon: Shield,
      tier: 'premium',
      color: 'from-blue-500 to-cyan-600'
    }
  ];

  const tierHierarchy = {
    free: 0,
    basic: 1,
    premium: 2,
    pro: 3,
    ultimate: 4
  };

  const hasAccess = (requiredTier: string) => {
    return (tierHierarchy[userTier] || 0) >= (tierHierarchy[requiredTier] || 0);
  };

  const handleFeatureSelect = (featureId: string) => {
    setSelectedFeature(featureId);
    const feature = features.find(f => f.id === featureId);
    if (feature && !hasAccess(feature.tier)) {
      // Show upgrade prompt for locked features
      onUpgrade?.();
    }
  };

  return (
    <div className={`premium-feature-test ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Crown className="w-8 h-8 text-yellow-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Premium Features</h2>
            <p className="text-gray-600">Test and explore advanced capabilities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isAccessible = hasAccess(feature.tier);
            const isSelected = selectedFeature === feature.id;

            return (
              <div
                key={feature.id}
                onClick={() => handleFeatureSelect(feature.id)}
                className={`relative cursor-pointer rounded-lg p-4 border transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${!isAccessible ? 'opacity-75' : ''}`}
              >
                {!isAccessible && (
                  <div className="absolute top-2 right-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                  </div>
                )}

                <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${feature.color} mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">{feature.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{feature.description}</p>

                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    feature.tier === 'premium' 
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {feature.tier}
                  </span>

                  {!isAccessible && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpgrade?.();
                      }}
                      className="text-xs px-3 py-1 bg-yellow-500 text-white rounded-full hover:bg-yellow-600"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {selectedFeature && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Feature Demo</h4>
            <p className="text-gray-600 mb-3">
              This is where the selected feature demo would be displayed.
            </p>
            {!hasAccess(features.find(f => f.id === selectedFeature)?.tier || '') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-yellow-800 text-sm">
                  This feature requires a premium subscription. 
                  <button
                    onClick={onUpgrade}
                    className="ml-2 text-yellow-900 font-medium hover:underline"
                  >
                    Upgrade now
                  </button>
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Current plan: <span className="font-medium capitalize">{userTier}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumFeatureTest;