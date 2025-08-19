import React, { useState, useEffect } from "react";
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
  Flame,
  Brain,
  Laugh,
  Robot,
  Clock,
  Users,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";
import type { PremiumFeature, SubscriptionTier } from "../../types";

interface EnhancedUpgradePromptProps {
  /** The feature that triggered the upgrade prompt */
  feature: string;
  /** Whether to show as modal or inline */
  variant?: "modal" | "inline" | "banner" | "fullscreen";
  /** Callback when user clicks upgrade */
  onUpgrade: (tier: SubscriptionTier) => void;
  /** Callback when user dismisses prompt */
  onDismiss?: () => void;
  /** Custom title override */
  title?: string;
  /** Custom description override */
  description?: string;
  /** Whether to show pricing */
  showPricing?: boolean;
  /** Current user tier for comparison */
  currentTier?: SubscriptionTier;
  /** Show social proof */
  showSocialProof?: boolean;
  /** Show urgency messaging */
  showUrgency?: boolean;
  /** Custom CTA text */
  ctaText?: string;
}

const EnhancedUpgradePrompt: React.FC<EnhancedUpgradePromptProps> = ({
  feature,
  variant = "modal",
  onUpgrade,
  onDismiss,
  title,
  description,
  showPricing = true,
  currentTier = "free",
  showSocialProof = true,
  showUrgency = true,
  ctaText,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Rotate testimonials every 4 seconds
  useEffect(() => {
    if (!showSocialProof) return;
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [showSocialProof]);

  const getFeatureInfo = (featureId: string) => {
    const featureMap: Record<
      string,
      {
        title: string;
        description: string;
        icon: React.ReactNode;
        benefits: string[];
        tier: SubscriptionTier;
        color: string;
        gradient: string;
      }
    > = {
      nuclearMode: {
        title: "Nuclear Mode",
        description: "The ultimate wake-up challenge for unstoppable mornings",
        icon: <Flame className="w-8 h-8" />,
        benefits: [
          "5x score multiplier for ultimate rewards",
          "Nuclear-themed extreme challenges",
          "Meltdown consequences for failure",
          "Exclusive achievement system",
          "Dramatic visual effects",
        ],
        tier: "pro",
        color: "from-red-500 to-orange-600",
        gradient: "bg-gradient-to-br from-red-50 to-orange-50",
      },
      premiumPersonalities: {
        title: "Premium Voice Personalities",
        description:
          "Unlock exclusive AI personalities for personalized wake-ups",
        icon: <Brain className="w-8 h-8" />,
        benefits: [
          "🔥 Demon Lord: Dark, intimidating commands",
          "🤖 AI Robot: Systematic wake protocols",
          "🎭 Comedian: Hilarious entertainment",
          "🧠 Philosopher: Contemplative wisdom",
          "Never get bored with variety",
        ],
        tier: "pro",
        color: "from-purple-500 to-pink-600",
        gradient: "bg-gradient-to-br from-purple-50 to-pink-50",
      },
      customVoices: {
        title: "Custom Voice Messages",
        description: "Create personalized wake-up messages with premium TTS",
        icon: <Mic className="w-8 h-8" />,
        benefits: [
          "High-quality ElevenLabs voices",
          "Unlimited custom messages",
          "Voice cloning technology",
          "Emotional voice variations",
          "Celebrity-style voices",
        ],
        tier: "premium",
        color: "from-blue-500 to-cyan-600",
        gradient: "bg-gradient-to-br from-blue-50 to-cyan-50",
      },
      analytics: {
        title: "Advanced Analytics",
        description: "Deep insights into your sleep and wake patterns",
        icon: <BarChart3 className="w-8 h-8" />,
        benefits: [
          "Sleep quality analysis",
          "Productivity correlations",
          "Habit tracking insights",
          "Performance optimization",
          "Exportable reports",
        ],
        tier: "premium",
        color: "from-green-500 to-emerald-600",
        gradient: "bg-gradient-to-br from-green-50 to-emerald-50",
      },
    };

    return (
      featureMap[featureId] || {
        title: "Premium Feature",
        description: "Unlock advanced functionality",
        icon: <Star className="w-8 h-8" />,
        benefits: ["Enhanced functionality", "Priority support"],
        tier: "premium" as SubscriptionTier,
        color: "from-gray-500 to-gray-600",
        gradient: "bg-gradient-to-br from-gray-50 to-gray-100",
      }
    );
  };

  const testimonials = [
    {
      text: "Nuclear Mode completely changed my morning routine. I actually look forward to waking up now!",
      author: "Sarah M.",
      title: "Pro User",
      rating: 5,
    },
    {
      text: "The Demon Lord personality is hilarious but surprisingly effective. Best $9.99 I've spent.",
      author: "Mike R.",
      title: "Pro User",
      rating: 5,
    },
    {
      text: "Finally an alarm app that understands psychology. The premium features are game-changing.",
      author: "Dr. Lisa K.",
      title: "Sleep Specialist",
      rating: 5,
    },
  ];

  const featureInfo = getFeatureInfo(feature);
  const displayTitle = title || `Unlock ${featureInfo.title}`;
  const displayDescription = description || featureInfo.description;

  const getPricingInfo = () => {
    if (featureInfo.tier === "pro") {
      return {
        monthly: { price: 9.99, savings: null },
        yearly: { price: 99.99, savings: 17 },
      };
    }
    return {
      monthly: { price: 4.99, savings: null },
      yearly: { price: 49.99, savings: 17 },
    };
  };

  const pricing = getPricingInfo();

  const handleUpgrade = (
    tier: SubscriptionTier,
    interval: "monthly" | "yearly" = "monthly",
  ) => {
    // Add smooth transition effect
    setIsAnimating(true);
    setTimeout(() => {
      onUpgrade(tier);
    }, 200);
  };

  if (variant === "banner") {
    return (
      <div
        className={`
        relative overflow-hidden rounded-xl border border-yellow-200 
        bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50
        p-4 shadow-sm transition-all duration-300 hover:shadow-md
        ${isAnimating ? "animate-pulse" : ""}
      `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg bg-gradient-to-br ${featureInfo.color} text-white`}
            >
              {featureInfo.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{displayTitle}</h3>
              <p className="text-sm text-gray-600">{displayDescription}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {showUrgency && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
                <Zap className="w-3 h-3 mr-1" />
                Limited Time
              </span>
            )}
            <button
              onClick={() => handleUpgrade(featureInfo.tier)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              {ctaText || "Upgrade Now"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className={`
        relative rounded-2xl border-2 border-dashed border-gray-200 
        p-6 text-center transition-all duration-300 hover:border-gray-300
        ${featureInfo.gradient}
        ${isAnimating ? "animate-bounce" : ""}
      `}
      >
        <div className="mx-auto mb-4">
          <div
            className={`inline-flex p-4 rounded-full bg-gradient-to-br ${featureInfo.color} text-white shadow-lg`}
          >
            {featureInfo.icon}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {displayTitle}
        </h3>
        <p className="text-gray-600 mb-4">{displayDescription}</p>

        <div className="space-y-2 mb-6">
          {featureInfo.benefits.slice(0, 3).map((benefit, index) => (
            <div
              key={index}
              className="flex items-center justify-center text-sm text-gray-700"
            >
              <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              {benefit}
            </div>
          ))}
        </div>

        <button
          onClick={() => handleUpgrade(featureInfo.tier)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          {ctaText ||
            `Upgrade to ${featureInfo.tier.charAt(0).toUpperCase() + featureInfo.tier.slice(1)}`}
        </button>
      </div>
    );
  }

  // Modal and Fullscreen variants
  const isFullscreen = variant === "fullscreen";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        className={`
        relative w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden
        transform transition-all duration-300
        ${isAnimating ? "scale-95 opacity-0" : "scale-100 opacity-100"}
        ${isFullscreen ? "max-w-4xl max-h-screen" : "max-h-[90vh]"}
      `}
      >
        {/* Header */}
        <div
          className={`relative px-8 pt-8 pb-6 bg-gradient-to-br ${featureInfo.color} text-white overflow-hidden`}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white transform translate-x-32 -translate-y-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white transform -translate-x-24 translate-y-24"></div>
          </div>

          {/* Close button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-2xl">
                {featureInfo.icon}
              </div>
              <div>
                <h2 className="text-3xl font-bold">{displayTitle}</h2>
                {showUrgency && (
                  <div className="flex items-center mt-2">
                    <Sparkles className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium opacity-90">
                      Limited time offer
                    </span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xl text-white text-opacity-90">
              {displayDescription}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {/* Benefits */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What you'll get:
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {featureInfo.benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social Proof */}
          {showSocialProof && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  What users are saying
                </h3>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    (4.9/5 from 2,847 users)
                  </span>
                </div>
              </div>
              <div className="transition-all duration-500">
                <blockquote className="text-gray-700 italic mb-3">
                  "{testimonials[currentTestimonial].text}"
                </blockquote>
                <div className="flex items-center justify-between">
                  <cite className="text-sm font-medium text-gray-900">
                    — {testimonials[currentTestimonial].author},{" "}
                    {testimonials[currentTestimonial].title}
                  </cite>
                  <div className="flex space-x-1">
                    {testimonials.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentTestimonial
                            ? "bg-blue-600"
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing */}
          {showPricing && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Choose your plan:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monthly */}
                <div className="relative p-6 border-2 border-gray-200 rounded-2xl hover:border-blue-300 transition-colors">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Monthly
                    </h4>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        ${pricing.monthly.price}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <button
                      onClick={() => handleUpgrade(featureInfo.tier, "monthly")}
                      className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-800 transition-colors"
                    >
                      Start Monthly Plan
                    </button>
                  </div>
                </div>

                {/* Yearly */}
                <div className="relative p-6 border-2 border-blue-500 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50">
                  {pricing.yearly.savings && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Save {pricing.yearly.savings}%
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 mb-2">Yearly</h4>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-gray-900">
                        ${pricing.yearly.price}
                      </span>
                      <span className="text-gray-600">/year</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      <span className="line-through">
                        ${(pricing.monthly.price * 12).toFixed(2)}
                      </span>
                      <span className="text-green-600 font-medium ml-2">
                        Save $
                        {(
                          pricing.monthly.price * 12 -
                          pricing.yearly.price
                        ).toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleUpgrade(featureInfo.tier, "yearly")}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                    >
                      Start Yearly Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 border-t pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span>Instant activation</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span>Join 10,000+ happy users</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedUpgradePrompt;
