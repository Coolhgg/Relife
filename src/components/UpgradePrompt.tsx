import React from 'react';
import {
  Crown,
  Star,
  Zap,
  X,
  Check,
  Mic,
  Target,
  Infinity,
  Shield,
  BarChart3,
  Palette,
  Headphones,
} from "lucide-react";

interface UpgradePromptProps {
  /** The feature that triggered the upgrade prompt */
  feature: PremiumFeature | string;
  /** Whether to show as modal or inline */
  variant?: 'modal' | 'inline' | 'banner';
  /** Callback when user clicks upgrade */
  /** Callback when user dismisses prompt */
  onDismiss?: () => void;
  /** Custom title override */
  title?: string;
  /** Custom description override */
  description?: string;
  /** Whether to show pricing */
  showPricing?: boolean;
  /** Current user tier for comparison */
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  variant = 'modal',
  onUpgrade,
  onDismiss,
  title,
  description,
  showPricing = true,
  currentTier = 'free'
}) => {
  const getFeatureInfo = (featureId: string) => {
    const featureMap: Record<
      string,
      {
        title: string;
        description: string;
        icon: React.ComponentType<any>;
        benefits: string[];
      }
    > = {
      nuclear_mode: {
        title: "Nuclear Mode",
        description: "Extreme difficulty challenges that guarantee you wake up",
        icon: Target,
        benefits: [
          'Mathematical gauntlets',
          'Memory challenges',
          'Physical movement detection',
          'Photo proof requirements',
          'Voice recognition tasks'
        ]
      },
      'custom_voices': {
        title: 'Premium Voices',
        description: '20+ unique AI personalities to wake you up',
        icon: Mic,
        benefits: [
          'Celebrity chef motivation',
          'Zen master mindfulness',
          'Robot companion efficiency',
          'Pirate captain adventure',
          'And 16+ more personalities'
        ]
      },
      'voice_cloning': {
        title: 'Voice Cloning',
        description: 'Create a custom AI voice clone of yourself or loved ones',
        icon: Headphones,
        benefits: [
          'Upload voice samples',
          'AI generates your voice',
          'Personalized wake-up calls',
          'Share with family members',
          'High-quality speech synthesis'
        ]
      },
      'unlimited_alarms': {
        title: 'Unlimited Alarms',
        description: 'Create as many alarms as you need without limits',
        icon: Infinity,
        benefits: [
          'No 10-alarm limit',
          'Complex schedules',
          'Multiple time zones',
          'Backup alarms',
          'Event-specific alarms'
        ]
      },
      'advanced_analytics': {
        title: 'Advanced Analytics',
        description: 'Detailed insights into your sleep and wake patterns',
        icon: BarChart3,
        benefits: [
          'Sleep quality tracking',
          'Wake time optimization',
          'Performance trends',
          'Personalized insights',
          'Export data reports'
        ]
      },
      'priority_support': {
        title: 'Priority Support',
        description: 'Get help faster with dedicated premium support',
        icon: Shield,
        benefits: [
          'Faster response times',
          'Dedicated support team',
          'Phone support option',
          'Feature request priority',
          '24/7 availability'
        ]
      },
      'theme_store': {
        title: 'Premium Themes',
        description: 'Beautiful themes and customization options',
        icon: Palette,
        benefits: [
          'Exclusive themes',
          'Custom color schemes',
          'Animated backgrounds',
          'Dark mode variants',
          'Seasonal themes'
        ]
      }
    };

    return (
      featureMap[featureId] || {
        title: "Premium Feature",
        description: "This feature requires a premium subscription",
        icon: Crown,
        benefits: [
          "Enhanced functionality",
          "Premium experience",
          "Advanced features",
        ],
      }
    );
  };

  const featureInfo =
    typeof feature === "string"
      ? getFeatureInfo(feature)
      : {
          title: "Premium Feature",
          description: "This feature requires a premium subscription",
          icon: Crown,
          benefits: ["Enhanced functionality"],
        };

  const Icon = featureInfo.icon;

  const plans = [
    {
      name: "Premium",
      price: "$9.99/month",
      icon: Crown,
      color: 'from-orange-500 to-red-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      features: [
        'Nuclear Mode challenges',
        '20+ Premium voices',
        'Unlimited alarms',
        'Advanced analytics',
        'Priority support',
        'Premium themes'
      ]
    },
    {
      name: "Ultimate",
      price: "$19.99/month",
      icon: Star,
      color: 'from-purple-500 to-pink-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      features: [
        'Everything in Premium',
        'Voice cloning',
        'White label options',
        'API access',
        'Custom integrations',
        'Dedicated support'
      ]
    }
  ];

  const getRequiredPlan = () => {
    return plans.find(plan => plan.tier === featureInfo.tier) || plans[0];
  };

  const requiredPlan = getRequiredPlan();

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{title || featureInfo.title}</h3>
              <p className="text-orange-100 text-sm">{description || featureInfo.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpgrade(featureInfo.tier)}
              className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors text-sm"
            >
              Upgrade Now
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-white hover:text-orange-200 transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br ${requiredPlan.color}`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {title || `Unlock ${featureInfo.title}`}
          </h3>
          <p className="text-gray-600 mb-4">{description || featureInfo.description}</p>
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">What you'll get:</div>
            <div className="space-y-1">
              {featureInfo.benefits.slice(0, 3).map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-500" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => onUpgrade(featureInfo.tier)}
            className={`bg-gradient-to-r ${requiredPlan.color} text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 w-full`}
          >
            <requiredPlan.icon className="h-4 w-4" />
            Upgrade to {requiredPlan.name}
          </button>
        </div>
      </div>
    );
  }

  // Modal variant
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-gradient-to-r ${requiredPlan.color} text-white p-6 rounded-t-xl relative`}>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Icon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {title || `Unlock ${featureInfo.title}`}
              </h2>
              <p className="text-white text-opacity-90">
                {description || featureInfo.description}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Feature benefits */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What you'll get with {featureInfo.title}:
            </h3>
            <div className="grid gap-3">
              {featureInfo.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="bg-green-100 text-green-600 p-1 rounded-full">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing plans */}
          {showPricing && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Plan:</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {plans.map(plan => {
                  const isRequired = plan.tier === featureInfo.tier;
                  const isHigherTier = plan.tier === 'ultimate' && featureInfo.tier === 'premium';
                  const showPlan = isRequired || isHigherTier;

                  if (!showPlan) return null;

                  return (
                    <div
                      key={plan.tier}
                      className={`border-2 rounded-xl p-6 relative ${
                        isRequired ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      {isRequired && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Required
                          </div>
                        </div>
                      )}

                      <div className="text-center">
                        <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center bg-gradient-to-br ${plan.color}`}>
                          <plan.icon className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h4>
                        <div className="text-2xl font-bold mb-4">
                          <span className={plan.textColor}>{plan.price}</span>
                        </div>

                        <div className="space-y-2 mb-6">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => onUpgrade(plan.tier)}
                          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                            isRequired
                              ? `bg-gradient-to-r ${plan.color} text-white hover:shadow-lg`
                              : `border-2 ${plan.textColor} border-current hover:bg-opacity-10 ${plan.bgColor}`
                          }`}
                        >
                          {isRequired ? `Unlock with ${plan.name}` : `Upgrade to ${plan.name}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Simple upgrade button for non-pricing version */}
          {!showPricing && (
            <div className="text-center">
              <button
                onClick={() => onUpgrade(featureInfo.tier)}
                className={`bg-gradient-to-r ${requiredPlan.color} text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 mx-auto`}
              >
                <requiredPlan.icon className="h-5 w-5" />
                Upgrade to {requiredPlan.name}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;