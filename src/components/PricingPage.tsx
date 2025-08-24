// Pricing Page Component - Simplified Version
import React, { useState } from 'react';
import { ArrowLeft, Crown, Check } from 'lucide-react';
import type { User } from '../types';

interface PricingPageProps {
  onBack?: (
) => void;
  onSelectPlan?: (planId: string
) => void;
  currentTier?: string;
  user?: User;
  onUpgrade?: ((...args: any[]
) => void) | undefined; // auto: widened function prop
  onManageSubscription?: ((...args: any[]
) => void) | undefined; // auto: widened function prop
}

const PricingPage: React.FC<PricingPageProps> = ({
  onBack,
  onSelectPlan,
  currentTier = 'free',
  user, // auto: added for prop compatibility
  onUpgrade, // auto: added for prop compatibility
  onManageSubscription, // auto: added for prop compatibility
}
) => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(
    'monthly'
  );

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for getting started',
      features: [
        'Up to 5 alarms',
        'Basic voice moods',
        'Standard difficulty levels',
        'Community support',
      ],
      popular: false,
      tier: 'free',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: { monthly: 9.99, yearly: 99.99 },
      description: 'For serious morning achievers',
      features: [
        'Unlimited alarms',
        'Premium voice personalities',
        'Nuclear mode challenges',
        'Advanced analytics',
        'Priority support',
      ],
      popular: true,
      tier: 'premium',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: { monthly: 19.99, yearly: 199.99 },
      description: 'For teams and power users',
      features: [
        'Everything in Premium',
        'Team collaboration',
        'API access',
        'White-label options',
        'Dedicated support',
      ],
      popular: false,
      tier: 'pro',
    },
  ];

  const handlePlanSelect = (planId: string
) => {
    onSelectPlan?.(planId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          )}
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 mb-8">
            Unlock powerful features to transform your mornings
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={(
) => setBillingInterval('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  billingInterval === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={(
) => setBillingInterval('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  billingInterval === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Yearly <span className="text-green-600 ml-1">(Save 17%)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg relative ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Crown className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-600 mt-2">{plan.description}</p>

                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price[billingInterval]}
                  </span>
                  {plan.id !== 'free' && (
                    <span className="text-gray-600">
                      /{billingInterval.replace('ly', '')}
                    </span>
                  )}
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index
) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={(
) => handlePlanSelect(plan.id)}
                  disabled={currentTier === plan.tier}
                  className={`w-full mt-8 px-6 py-3 rounded-lg font-medium ${
                    currentTier === plan.tier
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : plan.popular
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {currentTier === plan.tier
                    ? 'Current Plan'
                    : plan.id === 'free'
                      ? 'Get Started'
                      : 'Subscribe Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ or additional info could go here */}
        <div className="text-center mt-16">
          <p className="text-gray-600">
            Need help choosing?{' '}
            <a href="#" className="text-blue-500 hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
