// Pricing Table Component for Relife Alarm App
// Displays subscription plans with upgrade/downgrade functionality

import React, { useState } from "react";
import { Check, Zap, Star, Crown, ArrowRight } from "lucide-react";
import { FeatureBadge } from "./FeatureUtils";
import type {
  SubscriptionPlan,
  BillingInterval,
} from "../../types/premium";

interface PricingTableProps {
  plans: SubscriptionPlan[];
  billingInterval?: BillingInterval;
  onPlanSelect: (plan: SubscriptionPlan, billingInterval: BillingInterval) => void;
  onBillingIntervalChange?: (interval: BillingInterval) => void;
  loading?: boolean;
  className?: string;
}

export function PricingTable({
  plans,
  currentTier = 'free',
  billingInterval = 'month',
  onPlanSelect,
  onBillingIntervalChange,
  loading = false,
  className = ''
}: PricingTableProps) {
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>(billingInterval);

  const handleIntervalChange = (interval: BillingInterval) => {
    setSelectedInterval(interval);
    if (onBillingIntervalChange) {
      onBillingIntervalChange(interval);
    }
  };

  const getPlanPrice = (plan: SubscriptionPlan, interval: BillingInterval) => {
    if (plan.tier === 'free') return { amount: 0, currency: 'usd' };

    const pricing = plan.pricing;
    if (interval === 'year') {
      return pricing.yearly || pricing.monthly;
    }
    return pricing.monthly;
  };

  const formatPrice = (amount: number, currency: string, interval: BillingInterval) => {
    const price = (amount / 100).toFixed(2);
    const symbol = currency === 'usd' ? '$' : currency.toUpperCase();
    const period = interval === 'year' ? 'year' : 'month';

    return amount === 0 ? 'Free' : `${symbol}${price}/${period}`;
  };

  const getDiscountPercentage = (plan: SubscriptionPlan) => {
    if (!plan.pricing.yearly?.discountPercentage) return null;
    return plan.pricing.yearly.discountPercentage;
  };

    switch (tier) {
      case 'basic':
        return <Zap className="w-6 h-6 text-blue-600" />;
      case 'premium':
        return <Star className="w-6 h-6 text-purple-600" />;
      case 'pro':
        return <Crown className="w-6 h-6 text-yellow-600" />;
      default:
        return null;
    }
  };

  const isUpgrade = (tier: string) => {
    const hierarchy = [
      "free",
      "basic",
      "premium",
      "pro",
      "enterprise",
    ];
    return hierarchy.indexOf(tier) > hierarchy.indexOf(currentTier);
  };

  const getButtonText = (tier: string) => {
    if (isCurrentPlan(tier)) return "Current Plan";
    if (isUpgrade(tier)) return "Upgrade";
    return "Downgrade";
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Billing Interval Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => handleIntervalChange('month')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedInterval === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => handleIntervalChange('year')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
              selectedInterval === 'year'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(plan => {
          const price = getPlanPrice(plan, selectedInterval);
          const discount = selectedInterval === 'year' ? getDiscountPercentage(plan) : null;
          const isCurrent = isCurrentPlan(plan.tier);
          const isPopular = plan.isPopular;

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
                isPopular
                  ? 'border-purple-500 shadow-lg scale-105'
                  : isCurrent
                  ? 'border-green-500'
                  : 'border-gray-200'
              }`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute top-4 right-4">
                  <FeatureBadge tier={plan.tier} size="sm" variant="prominent" />
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                {getPlanIcon(plan.tier) && (
                  <div className="flex justify-center mb-3">
                    {getPlanIcon(plan.tier)}
                  </div>
                )}

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {plan.displayName}
                </h3>

                <div className="mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(price.amount, price.currency, selectedInterval)}
                  </span>
                  {discount && (
                    <div className="text-sm text-green-600 font-medium">
                      Save {discount}% annually
                    </div>
                  )}
                </div>

                <p className="text-gray-600 text-sm">
                  {plan.description}
                </p>
              </div>

              {/* Features List */}
              <div className="mb-6">
                <ul className="space-y-3">
                  {plan.features.slice(0, 6).map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature.name}</span>
                    </li>
                  ))}

                  {plan.features.length > 6 && (
                    <li className="text-sm text-gray-500 font-medium">
                      + {plan.features.length - 6} more features
                    </li>
                  )}
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onPlanSelect(plan, selectedInterval)}
                disabled={loading || isCurrent}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  isCurrent
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : isPopular
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : plan.tier === 'basic'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : plan.tier === 'pro'
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {getButtonText(plan.tier)}
                    {!isCurrent && <ArrowRight className="w-4 h-4" />}
                  </>
                )}
              </button>

              {/* Free Trial */}
              {plan.trialDays && plan.trialDays > 0 && !isCurrent && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  {plan.trialDays}-day free trial
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Link */}
      <div className="text-center mt-8">
        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          Compare all features →
        </button>
      </div>
    </div>
  );
}

export default PricingTable;
