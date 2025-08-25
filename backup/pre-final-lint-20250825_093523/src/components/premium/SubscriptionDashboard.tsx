// Subscription Dashboard Component for Relife Alarm App
// Comprehensive view of subscription status, billing, and feature usage

import React, { useState } from 'react';
import {
// auto: restored by scout - verify import path
import { SubscriptionTier } from '@/types';
// auto: restored by scout - verify import path
import { SubscriptionTier } from '@/types';
  Calendar,
  CreditCard,
  TrendingUp,
  Alert,
  AlertTriangle,
  Gift,
  Settings,
  Crown,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AlertDescription } from '../ui/alert';
import PaymentMethodManager from './PaymentMethodManager';
import BillingHistory from './BillingHistory';
import PricingTable from './PricingTable';
import type {
  SubscriptionDashboardData,
  SubscriptionStatus,
  BillingInterval,
} from '../../types/premium';

interface SubscriptionDashboardProps {
  data: SubscriptionDashboardData;
  isLoading?: boolean;
  onUpgrade: (planId: string, billingInterval: BillingInterval) => Promise<void>;
  onDowngrade: (planId: string, billingInterval: BillingInterval) => Promise<void>;
  onCancelSubscription: (reason?: string) => Promise<void>;
  onReactivateSubscription: () => Promise<void>;
  onAddPaymentMethod: () => Promise<void>;
  onRemovePaymentMethod: (paymentMethodId: string) => Promise<void>;
  onSetDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>;
  onUpdateBillingDetails: (
    paymentMethodId: string,
    billingDetails: any
  ) => Promise<void>;
  className?: string;
}

export function SubscriptionDashboard({
  data,
  isLoading = false,
  onUpgrade,
  onDowngrade,
  onCancelSubscription,
  onReactivateSubscription,
  onAddPaymentMethod,
  onRemovePaymentMethod,
  onSetDefaultPaymentMethod,
  onUpdateBillingDetails,
  className = '',
}: SubscriptionDashboardProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'basic':
        return <Zap className="w-5 h-5 text-blue-600" />;
      case 'premium':
        return <Crown className="w-5 h-5 text-purple-600" />;
      case 'pro':
        return <Crown className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-orange-100 text-orange-800">Past Due</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-100 text-red-800">Unpaid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const handlePlanSelect = async (plan: any, billingInterval: BillingInterval) => {
    try {
      setActionLoading('plan-change');

      const currentTierIndex = [
        'free',
        'basic',
        'premium',
        'pro',
        'enterprise',
      ].indexOf(data.subscription?.tier || 'free');
      const newTierIndex = ['free', 'basic', 'premium', 'pro', 'enterprise'].indexOf(
        plan.tier
      );

      if (newTierIndex > currentTierIndex) {
        await onUpgrade(plan.id, billingInterval);
      } else {
        await onDowngrade(plan.id, billingInterval);
      }

      setShowUpgradeModal(false);
    } catch (_error) {
      console._error('Failed to change plan:', _error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setActionLoading('cancel');
      await onCancelSubscription('User initiated cancellation');
    } catch (_error) {
      console._error('Failed to cancel subscription:', _error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setActionLoading('reactivate');
      await onReactivateSubscription();
    } catch (_error) {
      console._error('Failed to reactivate subscription:', _error);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Alert for subscription issues */}
      {data.subscription?.status === 'past_due' && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-600">
            Your subscription payment is past due. Please update your payment method to
            continue using premium features.
          </AlertDescription>
        </Alert>
      )}

      {data.subscription?.cancelAtPeriodEnd && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-600 flex items-center justify-between">
            <span>
              Your subscription will end on{' '}
              {formatDate(data.subscription.currentPeriodEnd)}.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReactivateSubscription}
              disabled={actionLoading === 'reactivate'}
            >
              {actionLoading === 'reactivate' ? 'Processing...' : 'Reactivate'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Subscription */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                {getTierIcon(data.subscription?.tier || 'free')}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize mb-2">
                  {data.currentPlan?.displayName || 'Free'}
                </div>
                {data.subscription && (
                  <>
                    {getStatusBadge(data.subscription.status)}
                    <p className="text-xs text-gray-600 mt-2">
                      {data.subscription.billingInterval === 'year'
                        ? 'Yearly'
                        : 'Monthly'}{' '}
                      billing
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Next Billing */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {data.subscription && data.subscription.tier !== 'free' ? (
                  <>
                    <div className="text-2xl font-bold">
                      {formatCurrency(
                        data.subscription.amount,
                        data.subscription.currency
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      Due {formatDate(data.subscription.currentPeriodEnd)}
                    </p>
                  </>
                ) : (
                  <div className="text-2xl font-bold text-gray-400">—</div>
                )}
              </CardContent>
            </Card>

            {/* Features Used */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Features Used</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {data.usage ? (
                  <>
                    <div className="text-2xl font-bold">
                      {Object.values(data.usage.features).reduce(
                        (sum, feature) => sum + feature.used,
                        0
                      )}
                    </div>
                    <p className="text-xs text-gray-600">This month</p>
                  </>
                ) : (
                  <div className="text-2xl font-bold text-gray-400">—</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trial Information */}
          {data.activeTrial && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Gift className="w-5 h-5" />
                  Free Trial Active
                </CardTitle>
              </CardHeader>
              <CardContent className="text-blue-800">
                <p className="mb-2">
                  Your free trial ends on {formatDate(data.activeTrial.endDate)}.
                </p>
                <p className="text-sm">
                  Days remaining:{' '}
                  {Math.ceil(
                    (new Date(data.activeTrial.endDate).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )}
                </p>
                <Button className="mt-4" onClick={() => setShowUpgradeModal(true)}>
                  Choose a Plan
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setShowUpgradeModal(true)}>
                  Change Plan
                </Button>

                {data.subscription &&
                  data.subscription.tier !== 'free' &&
                  !data.subscription.cancelAtPeriodEnd && (
                    <Button
                      variant="outline"
                      onClick={handleCancelSubscription}
                      disabled={actionLoading === 'cancel'}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {actionLoading === 'cancel'
                        ? 'Processing...'
                        : 'Cancel Subscription'}
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          {data.usage && data.currentPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(data.usage.features).map(([featureKey, featureUsage]) => {
                const limit =
                  data.currentPlan?.limits?.[
                    featureKey as keyof typeof data.currentPlan.limits
                  ] || 0;
                const usedPercentage =
                  typeof limit === 'number'
                    ? Math.min((featureUsage.used / limit) * 100, 100)
                    : 0;

                return (
                  <Card key={featureKey}>
                    <CardHeader>
                      <CardTitle className="text-sm capitalize">
                        {featureKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{featureUsage.used} used</span>
                          <span>{typeof limit === 'number' ? limit : '∞'} limit</span>
                        </div>
                        {typeof limit === 'number' && (
                          <Progress value={usedPercentage} className="h-2" />
                        )}
                        {featureUsage.resetDate && (
                          <p className="text-xs text-gray-600">
                            Resets {formatDate(featureUsage.resetDate)}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">No usage data</h4>
              <p className="text-gray-600">
                Usage statistics will appear here once you start using premium features.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <PaymentMethodManager
            paymentMethods={data.paymentMethods || []}
            defaultPaymentMethodId={data.paymentMethods?.[0]?.id}
            onAddPaymentMethod={onAddPaymentMethod}
            onRemovePaymentMethod={onRemovePaymentMethod}
            onSetDefaultPaymentMethod={onSetDefaultPaymentMethod}
            onUpdateBillingDetails={onUpdateBillingDetails}
          />

          <BillingHistory
            invoices={data.invoiceHistory || []}
            upcomingInvoice={data.upcomingInvoice}
          />
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <PricingTable
            plans={data.availablePlans || []}
            currentTier={data.subscription?.tier || 'free'}
            onPlanSelect={handlePlanSelect}
            loading={actionLoading === 'plan-change'}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SubscriptionDashboard;
