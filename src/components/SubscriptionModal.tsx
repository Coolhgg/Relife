import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Crown,
  Sparkles,
  Star,
  Check,
  Loader2,
  CreditCard,
  Shield,
  Zap
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan, type PremiumFeatureAccess, type SubscriptionTier } from '../types';
import { SubscriptionService } from '../services/subscription';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  highlightedFeature?: keyof PremiumFeatureAccess;
}

interface ModalState {
  selectedPlan: SubscriptionPlan | null;
  isProcessing: boolean;
  error: string | null;
  currentTier: SubscriptionTier;
  trialDaysRemaining: number;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  userId,
  highlightedFeature
}) => {
  const [state, setState] = useState<ModalState>({
    selectedPlan: null,
    isProcessing: false,
    error: null,
    currentTier: 'free',
    trialDaysRemaining: 0
  });

  useEffect(() => {
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen, userId]);

  const loadUserData = async () => {
    try {
      const [tier, trialDays] = await Promise.all([
        SubscriptionService.getUserTier(userId),
        SubscriptionService.getTrialDaysRemaining(userId)
      ]);

      setState(prev => ({
        ...prev,
        currentTier: tier,
        trialDaysRemaining: trialDays
      }));
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setState(prev => ({ ...prev, selectedPlan: plan }));
  };

  const handleSubscribe = async () => {
    if (!state.selectedPlan) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // TODO: Integrate with Stripe or other payment processor
      // For now, we'll simulate the subscription flow
      console.log('Subscribing to plan:', state.selectedPlan);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Close modal and show success
      onClose();

      // TODO: Refresh user data in parent component
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to process subscription'
      }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'premium': return Crown;
      case 'pro': return Sparkles;
      case 'lifetime': return Star;
      default: return Shield;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'premium': return 'from-amber-500 to-orange-500';
      case 'pro': return 'from-purple-500 to-pink-500';
      case 'lifetime': return 'from-emerald-500 to-teal-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const isFeatureHighlighted = (plan: SubscriptionPlan): boolean => {
    if (!highlightedFeature) return false;
    return plan.featureAccess[highlightedFeature];
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const TierIcon = getTierIcon(plan.tier);
    const isSelected = state.selectedPlan?.id === plan.id;
    const isCurrentTier = state.currentTier === plan.tier;
    const isHighlighted = isFeatureHighlighted(plan);

    return (
      <motion.div
        key={plan.id}
        layout
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handlePlanSelect(plan)}
        className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-500 shadow-lg bg-blue-50'
            : isHighlighted
            ? 'border-amber-300 shadow-md bg-amber-50'
            : 'border-gray-200 hover:border-gray-300'
        } ${isCurrentTier ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Most Popular
            </span>
          </div>
        )}

        {isHighlighted && (
          <div className="absolute -top-3 right-4">
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              Includes This Feature
            </span>
          </div>
        )}

        {isCurrentTier && (
          <div className="absolute -top-3 left-4">
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              Current Plan
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getTierColor(plan.tier)} flex items-center justify-center`}>
              <TierIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-500">{plan.description}</p>
            </div>
          </div>

          {isSelected && (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <div className="mb-4">
          {plan.tier === 'free' ? (
            <div className="text-2xl font-bold text-gray-900">Free</div>
          ) : (
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
              {plan.interval !== 'lifetime' && (
                <span className="text-sm text-gray-500">/{plan.interval}</span>
              )}
            </div>
          )}
        </div>

        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {!isCurrentTier && plan.tier !== 'free' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              handlePlanSelect(plan);
            }}
            className={`w-full mt-4 py-2 px-4 rounded-lg font-medium transition-colors ${
              isSelected
                ? 'bg-blue-500 text-white'
                : `bg-gradient-to-r ${getTierColor(plan.tier)} text-white hover:shadow-lg`
            }`}
          >
            Select {plan.name}
          </motion.button>
        )}
      </motion.div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
              <p className="text-gray-600 mt-1">
                Unlock premium features to enhance your alarm experience
              </p>
              {state.trialDaysRemaining > 0 && (
                <div className="mt-2 inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  <Zap className="w-4 h-4" />
                  <span>{state.trialDaysRemaining} days left in trial</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {SUBSCRIPTION_PLANS.map(plan => renderPlanCard(plan))}
            </div>

            {state.selectedPlan && state.selectedPlan.tier !== 'free' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-gray-50 rounded-xl"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Complete Your Subscription
                </h3>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-700">
                      {state.selectedPlan.name} Plan
                    </p>
                    <p className="text-sm text-gray-500">
                      Billed {state.selectedPlan.interval === 'lifetime' ? 'once' : state.selectedPlan.interval + 'ly'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${state.selectedPlan.price}
                    </p>
                    {state.selectedPlan.interval !== 'lifetime' && (
                      <p className="text-sm text-gray-500">
                        per {state.selectedPlan.interval}
                      </p>
                    )}
                  </div>
                </div>

                {state.error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                    {state.error}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubscribe}
                  disabled={state.isProcessing}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
                    state.isProcessing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : `bg-gradient-to-r ${getTierColor(state.selectedPlan.tier)} hover:shadow-lg`
                  }`}
                >
                  {state.isProcessing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Subscribe to {state.selectedPlan.name}</span>
                    </div>
                  )}
                </motion.button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  Secure payment processing. Cancel anytime.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};