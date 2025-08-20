// Complete Subscription Management Page for Relife Alarm App
// Main page component that integrates all premium subscription functionality

import React, { useState, useEffect } from 'react';
import {
  Crown,
  CreditCard,
  BarChart3,
  Settings,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import useSubscription from '../../hooks/useSubscription';
import useAuth from '../../hooks/useAuth';
import SubscriptionDashboard from './SubscriptionDashboard';
import PricingTable from './PricingTable';
import PaymentFlow from './PaymentFlow';
import SubscriptionManagement from './SubscriptionManagement';
import type { SubscriptionPlan, BillingInterval } from '../../types/premium';

interface SubscriptionPageProps {
  className?: string;
  initialTab?: 'overview' | 'plans' | 'billing' | 'settings';
}

export function SubscriptionPage({
  className = '',
  initialTab = 'overview',
}: SubscriptionPageProps) {
  const { user } = useAuth();
  const subscription = useSubscription({ userId: user?.id || '', autoRefresh: true });

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>('month');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (subscription.error) {
      setError(subscription.error);
    }
  }, [subscription.error]);

  // Clear messages after a delay
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handlePlanSelect = async (
    plan: SubscriptionPlan,
    billingInterval: BillingInterval
  ) => {
    setSelectedPlan(plan);
    setSelectedInterval(billingInterval);
    setShowPaymentFlow(true);
  };

  const handleUpgrade = async (planId: string, billingInterval: BillingInterval) => {
    try {
      await subscription.updateSubscription({
        planId,
        billingInterval,
        prorate: true,
      });
      setSuccess('Subscription upgraded successfully!');
      setActiveTab('overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upgrade subscription');
    }
  };

  const handleDowngrade = async (planId: string, billingInterval: BillingInterval) => {
    try {
      await subscription.updateSubscription({
        planId,
        billingInterval,
        prorate: false, // Usually downgrades are effective at period end
      });
      setSuccess('Subscription will be changed at the end of your billing period');
      setActiveTab('overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to downgrade subscription');
    }
  };

  const handlePaymentSuccess = (subscriptionId: string) => {
    setShowPaymentFlow(false);
    setSelectedPlan(null);
    setSuccess('Payment successful! Welcome to your new plan!');
    subscription.refreshSubscription();
    setActiveTab('overview');
  };

  const handlePaymentError = (error: string) => {
    setError(error);
    setShowPaymentFlow(false);
  };

  const handleStartTrial = async (planId: string) => {
    try {
      await subscription.startFreeTrial(planId);
      setSuccess('Free trial started! Enjoy all premium features.');
      setActiveTab('overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start free trial');
    }
  };

  if (!user) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${className}`}>
        <Card className="text-center">
          <CardContent className="p-8">
            <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Premium Features</h2>
            <p className="text-gray-600 mb-6">
              Sign in to access premium subscription features and manage your account.
            </p>
            <Button size="lg">Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (subscription.isLoading && !subscription.isInitialized) {
    return (
      <div className={`max-w-6xl mx-auto p-6 space-y-6 ${className}`}>
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (showPaymentFlow && selectedPlan) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${className}`}>
        <PaymentFlow
          selectedPlan={selectedPlan}
          billingInterval={selectedInterval}
          existingPaymentMethods={subscription.paymentMethods}
          trialDays={selectedPlan.trialDays}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          onCancel={() => {
            setShowPaymentFlow(false);
            setSelectedPlan(null);
          }}
          onCreateSubscription={subscription.createSubscription}
        />
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Crown className="w-8 h-8 text-purple-600" />
            Premium Subscription
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your subscription, billing, and premium features
          </p>
        </div>

        {/* Quick Status */}
        {subscription.subscription && (
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              {subscription.subscription.status === 'active' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className="font-medium capitalize">
                {subscription.currentPlan?.displayName || subscription.userTier}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {subscription.subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews'}{' '}
              {new Date(
                subscription.subscription.currentPeriodEnd
              ).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          {subscription.isInitialized && (
            <SubscriptionDashboard
              data={{
                subscription: subscription.subscription,
                currentPlan: subscription.currentPlan,
                featureAccess: subscription.featureAccess,
                usage: subscription.usage,
                availablePlans: subscription.availablePlans,
                paymentMethods: subscription.paymentMethods,
                invoiceHistory: subscription.invoiceHistory,
                upcomingInvoice: subscription.upcomingInvoice,
                activeTrial: subscription.activeTrial,
              }}
              isLoading={subscription.isLoading}
              onUpgrade={handleUpgrade}
              onDowngrade={handleDowngrade}
              onCancelSubscription={subscription.cancelSubscription}
              onReactivateSubscription={subscription.reactivateSubscription}
              onAddPaymentMethod={subscription.addPaymentMethod}
              onRemovePaymentMethod={subscription.removePaymentMethod}
              onSetDefaultPaymentMethod={subscription.setDefaultPaymentMethod}
              onUpdateBillingDetails={subscription.updateBillingDetails}
            />
          )}
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="mt-6">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-gray-600">
                Upgrade or downgrade your subscription anytime
              </p>
            </div>

            <PricingTable
              plans={subscription.availablePlans}
              currentTier={subscription.userTier}
              onPlanSelect={handlePlanSelect}
              loading={subscription.isLoading}
            />

            {/* Trial CTA */}
            {subscription.userTier === 'free' && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Start Your Free Trial
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Try premium features risk-free for 14 days
                  </p>
                  <Button
                    onClick={() =>
                      handleStartTrial(
                        subscription.availablePlans.find(p => p.tier === 'premium')
                          ?.id || ''
                      )
                    }
                    disabled={subscription.isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Start Free Trial
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="mt-6">
          {subscription.isInitialized && (
            <SubscriptionDashboard
              data={{
                subscription: subscription.subscription,
                currentPlan: subscription.currentPlan,
                featureAccess: subscription.featureAccess,
                usage: subscription.usage,
                availablePlans: subscription.availablePlans,
                paymentMethods: subscription.paymentMethods,
                invoiceHistory: subscription.invoiceHistory,
                upcomingInvoice: subscription.upcomingInvoice,
                activeTrial: subscription.activeTrial,
              }}
              isLoading={subscription.isLoading}
              onUpgrade={handleUpgrade}
              onDowngrade={handleDowngrade}
              onCancelSubscription={subscription.cancelSubscription}
              onReactivateSubscription={subscription.reactivateSubscription}
              onAddPaymentMethod={subscription.addPaymentMethod}
              onRemovePaymentMethod={subscription.removePaymentMethod}
              onSetDefaultPaymentMethod={subscription.setDefaultPaymentMethod}
              onUpdateBillingDetails={subscription.updateBillingDetails}
            />
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          {subscription.subscription && subscription.currentPlan && (
            <SubscriptionManagement
              subscription={subscription.subscription}
              currentPlan={subscription.currentPlan}
              availablePlans={subscription.availablePlans}
              isLoading={subscription.isLoading}
              onUpgrade={handleUpgrade}
              onDowngrade={handleDowngrade}
              onCancelSubscription={subscription.cancelSubscription}
              onReactivateSubscription={subscription.reactivateSubscription}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center pt-6 border-t">
        <p className="text-sm text-gray-500">
          Questions about billing?{' '}
          <Button variant="link" className="p-0 h-auto">
            Contact Support
          </Button>
        </p>
      </div>
    </div>
  );
}

export default SubscriptionPage;
