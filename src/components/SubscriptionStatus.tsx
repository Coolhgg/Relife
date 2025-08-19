import React, { useState, useEffect } from 'react';
import {
  Crown,
  Star,
  Heart,
  Calendar,
  CreditCard,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Gift,
  TrendingUp
} from 'lucide-react';
import type { User, SubscriptionStatus as SubscriptionStatusType, SubscriptionTier } from '../types';
import { PremiumService } from '../services/premium';

interface SubscriptionStatusProps {
  user: User;
  /** Display variant */
  variant?: 'full' | 'compact' | 'badge' | 'card';
  /** Show upgrade button */
  showUpgrade?: boolean;
  /** Show manage subscription button */
  showManage?: boolean;
  /** Callback when upgrade is clicked */
  onUpgrade?: (tier: SubscriptionTier) => void;
  /** Callback when manage is clicked */
  onManage?: () => void;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  user,
  variant = 'full',
  showUpgrade = true,
  showManage = true,
  onUpgrade,
  onManage
}) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionStatus();
  }, [user.id]);

  const loadSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const status = await PremiumService.getInstance().getSubscriptionStatus(user.id);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error loading subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierInfo = () => {
    switch (user.subscriptionTier) {
      case 'ultimate':
        return {
          name: 'Ultimate',
          icon: Star,
          color: 'from-purple-500 to-pink-500',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-600',
          borderColor: 'border-purple-200',
          description: 'All features + Voice cloning'
        };
      case 'premium':
        return {
          name: 'Premium',
          icon: Crown,
          color: 'from-orange-500 to-red-500',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-600',
          borderColor: 'border-orange-200',
          description: 'Nuclear mode + Premium voices'
        };
      case 'free':
      default:
        return {
          name: 'Free',
          icon: Heart,
          color: 'from-gray-400 to-gray-500',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200',
          description: 'Basic features only'
        };
    }
  };

  const getStatusInfo = () => {
    if (!subscriptionStatus) return null;

    const now = new Date();

    if (subscriptionStatus.status === 'canceled') {
      const endsAt = new Date(subscriptionStatus.currentPeriodEnd || now);
      const daysUntilEnd = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        status: 'canceled',
        message: `Canceled - Access until ${endsAt.toLocaleDateString()}`,
        urgency: daysUntilEnd <= 7 ? 'high' : 'medium',
        daysLeft: daysUntilEnd,
        icon: AlertTriangle
      };
    }

    if (subscriptionStatus.status === 'past_due') {
      return {
        status: 'past_due',
        message: 'Payment failed - Update payment method',
        urgency: 'high',
        icon: AlertTriangle
      };
    }

    if (subscriptionStatus.status === 'active') {
      const renewsAt = new Date(subscriptionStatus.currentPeriodEnd || now);
      const daysUntilRenewal = Math.ceil((renewsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        status: 'active',
        message: `Renews on ${renewsAt.toLocaleDateString()}`,
        urgency: 'none',
        daysLeft: daysUntilRenewal,
        icon: CheckCircle
      };
    }

    if (subscriptionStatus.status === 'trialing') {
      const trialEnds = new Date(subscriptionStatus.trialEnd || now);
      const daysLeft = Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        status: 'trialing',
        message: `Trial ends in ${daysLeft} days`,
        urgency: daysLeft <= 3 ? 'medium' : 'none',
        daysLeft,
        icon: Gift
      };
    }

    return null;
  };

  const tierInfo = getTierInfo();
  const statusInfo = getStatusInfo();
  const TierIcon = tierInfo.icon;

  if (loading && variant !== 'badge') {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-100 rounded-lg h-16 w-full"></div>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${tierInfo.bgColor} ${tierInfo.textColor}`}>
        <TierIcon className="h-4 w-4" />
        {tierInfo.name}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-white border-2 ${tierInfo.borderColor} rounded-lg p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${tierInfo.color}`}>
              <TierIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{tierInfo.name}</h3>
              {statusInfo && (
                <p className={`text-sm ${
                  statusInfo.urgency === 'high' ? 'text-red-600' :
                  statusInfo.urgency === 'medium' ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>
                  {statusInfo.message}
                </p>
              )}
            </div>
          </div>

          {user.subscriptionTier === 'free' && showUpgrade && (
            <button
              onClick={() => onUpgrade?.('premium')}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <Crown className="h-4 w-4" />
              Upgrade
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-gradient-to-br ${tierInfo.color} text-white rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <TierIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{tierInfo.name} Plan</h3>
              <p className="text-white text-opacity-80">{tierInfo.description}</p>
            </div>
          </div>

          {statusInfo && (
            <div className="text-right">
              <statusInfo.icon className="h-5 w-5 mb-1 ml-auto" />
              <div className="text-sm text-white text-opacity-80">
                {statusInfo.message}
              </div>
            </div>
          )}
        </div>

        {subscriptionStatus && (
          <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white text-opacity-60 mb-1">Status</div>
                <div className="font-medium capitalize">{subscriptionStatus.status}</div>
              </div>
              <div>
                <div className="text-white text-opacity-60 mb-1">
                  {subscriptionStatus.status === 'trialing' ? 'Trial Ends' : 'Next Billing'}
                </div>
                <div className="font-medium">
                  {subscriptionStatus.currentPeriodEnd && new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {user.subscriptionTier === 'free' && showUpgrade && (
            <button
              onClick={() => onUpgrade?.('premium')}
              className="flex-1 bg-white text-gray-900 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Upgrade Now
            </button>
          )}

          {user.subscriptionTier !== 'free' && showManage && (
            <button
              onClick={onManage}
              className="flex-1 bg-white bg-opacity-20 text-white py-2 px-4 rounded-lg font-medium hover:bg-opacity-30 transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Manage
            </button>
          )}

          {user.subscriptionTier === 'premium' && showUpgrade && (
            <button
              onClick={() => onUpgrade?.('ultimate')}
              className="bg-white bg-opacity-20 text-white py-2 px-3 rounded-lg font-medium hover:bg-opacity-30 transition-colors flex items-center justify-center gap-2"
            >
              <Star className="h-4 w-4" />
              Ultimate
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${tierInfo.color}`}>
            <TierIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{tierInfo.name} Plan</h3>
            <p className="text-gray-600">{tierInfo.description}</p>
          </div>
        </div>

        {statusInfo && (
          <div className="text-right">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
              statusInfo.urgency === 'high' ? 'bg-red-100 text-red-700' :
              statusInfo.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              <statusInfo.icon className="h-4 w-4" />
              {statusInfo.status}
            </div>
          </div>
        )}
      </div>

      {/* Subscription details */}
      {subscriptionStatus && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500 mb-1">Status</div>
              <div className="font-medium text-gray-900 capitalize">{subscriptionStatus.status}</div>
            </div>

            <div>
              <div className="text-gray-500 mb-1">
                {subscriptionStatus.status === 'trialing' ? 'Trial Ends' :
                 subscriptionStatus.status === 'canceled' ? 'Access Until' : 'Next Billing'}
              </div>
              <div className="font-medium text-gray-900">
                {subscriptionStatus.currentPeriodEnd && new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
              </div>
            </div>

            {subscriptionStatus.plan && (
              <div>
                <div className="text-gray-500 mb-1">Plan</div>
                <div className="font-medium text-gray-900">${subscriptionStatus.plan.amount}/month</div>
              </div>
            )}

            {subscriptionStatus.usage && (
              <div>
                <div className="text-gray-500 mb-1">Alarms Used</div>
                <div className="font-medium text-gray-900">
                  {subscriptionStatus.usage.alarmsUsed} / {subscriptionStatus.usage.alarmsLimit === -1 ? '∞' : subscriptionStatus.usage.alarmsLimit}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status message */}
      {statusInfo && (
        <div className={`rounded-lg p-3 mb-4 ${
          statusInfo.urgency === 'high' ? 'bg-red-50 border border-red-200' :
          statusInfo.urgency === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            <statusInfo.icon className={`h-4 w-4 ${
              statusInfo.urgency === 'high' ? 'text-red-600' :
              statusInfo.urgency === 'medium' ? 'text-yellow-600' :
              'text-blue-600'
            }`} />
            <span className={`text-sm ${
              statusInfo.urgency === 'high' ? 'text-red-700' :
              statusInfo.urgency === 'medium' ? 'text-yellow-700' :
              'text-blue-700'
            }`}>
              {statusInfo.message}
            </span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {user.subscriptionTier === 'free' && showUpgrade && (
          <button
            onClick={() => onUpgrade?.('premium')}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Crown className="h-4 w-4" />
            Upgrade to Premium
          </button>
        )}

        {user.subscriptionTier === 'premium' && showUpgrade && (
          <button
            onClick={() => onUpgrade?.('ultimate')}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Star className="h-4 w-4" />
            Upgrade to Ultimate
          </button>
        )}

        {user.subscriptionTier !== 'free' && showManage && (
          <button
            onClick={onManage}
            className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Manage Subscription
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus;