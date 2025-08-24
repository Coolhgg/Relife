// Subscription Management Component for Relife Alarm App
// Handles subscription cancellation, upgrades, downgrades, and plan changes

import React, { useState } from 'react';
import {
  Alert,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Gift,
  Settings,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../ui/dialog';
import { AlertTriangle, AlertDescription } from '../ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Progress } from '../ui/textarea';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import PricingTable from './PricingTable';
import { TimeoutHandle } from '../types/timers';
import type {
  Subscription,
  SubscriptionPlan,
  BillingInterval,
  CancelSubscriptionRequest,
} from '../../types/premium';

interface SubscriptionManagementProps {
  subscription: Subscription;
  currentPlan: SubscriptionPlan;
  availablePlans: SubscriptionPlan[];
  isLoading?: boolean;
  onUpgrade: (planId: string, billingInterval: BillingInterval) => Promise<void>;
  onDowngrade: (planId: string, billingInterval: BillingInterval) => Promise<void>;
  onCancelSubscription: (request: CancelSubscriptionRequest) => Promise<void>;
  onReactivateSubscription: () => Promise<void>;
  onPauseSubscription?: (pauseDuration: number) => Promise<void>;
  className?: string;
}

interface CancellationData {
  reason: string;
  feedback: string;
  effectiveDate: 'immediate' | 'period_end';
  retentionOfferAccepted?: boolean;
}

export function SubscriptionManagement({
  subscription,
  currentPlan,
  availablePlans,
  isLoading = false,
  onUpgrade,
  onDowngrade,
  onCancelSubscription,
  onReactivateSubscription,
  onPauseSubscription,
  className = '',
}: SubscriptionManagementProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showRetentionOffer, setShowRetentionOffer] = useState(false);
  const [cancellationData, setCancellationData] = useState<CancellationData>({
    reason: '',
    feedback: '',
    effectiveDate: 'period_end',
  });

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

  const getTierHierarchy = () => {
    return ['free', 'basic', 'premium', 'pro', 'enterprise'];
  };

  const isUpgrade = (tier: SubscriptionTier) => {
    const hierarchy = getTierHierarchy();
    return hierarchy.indexOf(tier) > hierarchy.indexOf(subscription.tier);
  };

  const isDowngrade = (tier: SubscriptionTier) => {
    const hierarchy = getTierHierarchy();
    return hierarchy.indexOf(tier) < hierarchy.indexOf(subscription.tier);
  };

  const getUpgradeOptions = () => {
    return availablePlans.filter(plan => isUpgrade(plan.tier));
  };

  const getDowngradeOptions = () => {
    return availablePlans.filter(plan => isDowngrade(plan.tier));
  };

  const cancellationReasons = [
    'Too expensive',
    'Not using enough features',
    'Found a better alternative',
    'Technical issues',
    'Poor customer support',
    'Missing features I need',
    'Temporary financial constraints',
    'Other',
  ];

  const retentionOffers = [
    {
      id: 'discount_50',
      title: '50% Off Next 3 Months',
      description: 'Save 50% on your current plan for the next 3 months',
      savings: Math.floor(subscription.amount * 0.5 * 3),
      duration: '3 months',
    },
    {
      id: 'discount_25_6m',
      title: '25% Off Next 6 Months',
      description: 'Save 25% on your current plan for the next 6 months',
      savings: Math.floor(subscription.amount * 0.25 * 6),
      duration: '6 months',
    },
    {
      id: 'pause_subscription',
      title: 'Pause Subscription',
      description: 'Pause your subscription for up to 3 months, then resume when ready',
      savings: subscription.amount * 3,
      duration: 'Up to 3 months',
    },
  ];

  const handlePlanChange = async (
    plan: SubscriptionPlan,
    billingInterval: BillingInterval
  ) => {
    try {
      setActionLoading('plan-change');

      if (isUpgrade(plan.tier)) {
        await onUpgrade(plan.id, billingInterval);
      } else if (isDowngrade(plan.tier)) {
        await onDowngrade(plan.id, billingInterval);
      }

      setShowUpgradeDialog(false);
    } catch (_error) {
      console._error('Failed to change plan:', _error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
    // Simulate showing retention offer based on cancellation reason
    setTimeout(() => {
      if (cancellationData.reason && !showRetentionOffer) {
        setShowRetentionOffer(true);
      }
    }, 500);
  };

  const handleCancelConfirm = async () => {
    try {
      setActionLoading('cancel');

      const request: CancelSubscriptionRequest = {
        reason: cancellationData.reason,
        feedback: cancellationData.feedback,
        cancelAtPeriodEnd: cancellationData.effectiveDate === 'period_end',
        retentionOfferAccepted: cancellationData.retentionOfferAccepted,
      };

      await onCancelSubscription(request);
      setShowCancelDialog(false);
      setShowRetentionOffer(false);
    } catch (_error) {
      console._error('Failed to cancel subscription:', _error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async () => {
    try {
      setActionLoading('reactivate');
      await onReactivateSubscription();
    } catch (_error) {
      console._error('Failed to reactivate subscription:', _error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptRetentionOffer = (offerId: string) => {
    setCancellationData((prev: any) => ({
      ...prev,
      retentionOfferAccepted: true,
    }));
    // In a real implementation, you would apply the retention offer here
    setShowRetentionOffer(false);
    setShowCancelDialog(false);
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Subscription Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Current Plan</h4>
              <p className="text-2xl font-bold">{currentPlan.displayName}</p>
              <p className="text-gray-600">{currentPlan.description}</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(subscription.amount, subscription.currency)} per{' '}
                {subscription.billingInterval}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Next Billing</h4>
              <p className="text-lg font-semibold">
                {formatDate(subscription.currentPeriodEnd)}
              </p>
              <p className="text-gray-600">
                {subscription.cancelAtPeriodEnd
                  ? 'Subscription will end'
                  : 'Auto-renewal'}
              </p>
            </div>
          </div>

          {/* Cancellation Notice */}
          {subscription.cancelAtPeriodEnd && (
            <AlertTriangle className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-600">
                Your subscription will end on{' '}
                {formatDate(subscription.currentPeriodEnd)}. You can reactivate anytime
                before this date.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3 pt-4">
            <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4" />
                  Change Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Choose a New Plan</DialogTitle>
                </DialogHeader>
                <PricingTable
                  plans={availablePlans}
                  currentTier={subscription.tier}
                  onPlanSelect={handlePlanChange}
                  loading={actionLoading === 'plan-change'}
                />
              </DialogContent>
            </Dialog>

            {subscription.cancelAtPeriodEnd ? (
              <Button
                onClick={handleReactivate}
                disabled={actionLoading === 'reactivate'}
                className="flex items-center gap-2"
              >
                {actionLoading === 'reactivate' && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Reactivate Subscription
              </Button>
            ) : (
              <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Cancel Subscription
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      Cancel Subscription
                    </DialogTitle>
                  </DialogHeader>

                  {!showRetentionOffer ? (
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        We're sorry to see you go! Help us improve by sharing why you're
                        canceling.
                      </p>

                      <div>
                        <Label htmlFor="reason">Reason for canceling</Label>
                        <Select
                          value={cancellationData.reason}
                          onValueChange={(value: any) =>
                            setCancellationData((prev: any) => ({
                              ...prev,
                              reason: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a reason..." />
                          </SelectTrigger>
                          <SelectContent>
                            {cancellationReasons.map(reason => (
                              <SelectItem key={reason} value={reason}>
                                {reason}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="feedback">Additional feedback (optional)</Label>
                        <Textarea
                          id="feedback"
                          value={cancellationData.feedback}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCancellationData((prev: any) => ({
                              ...prev,
                              feedback: e.target.value,
                            }))
                          }
                          placeholder="Tell us more about your experience..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>When should the cancellation take effect?</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="period_end"
                              name="effectiveDate"
                              checked={cancellationData.effectiveDate === 'period_end'}
                              onChange={() =>
                                setCancellationData((prev: any) => ({
                                  ...prev,
                                  effectiveDate: 'period_end',
                                }))
                              }
                            />
                            <Label htmlFor="period_end" className="text-sm">
                              At the end of current billing period (
                              {formatDate(subscription.currentPeriodEnd)})
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="immediate"
                              name="effectiveDate"
                              checked={cancellationData.effectiveDate === 'immediate'}
                              onChange={() =>
                                setCancellationData((prev: any) => ({
                                  ...prev,
                                  effectiveDate: 'immediate',
                                }))
                              }
                            />
                            <Label htmlFor="immediate" className="text-sm">
                              Immediately (no refund for unused time)
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <Gift className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold">
                          Wait! We have a special offer
                        </h3>
                        <p className="text-gray-600">
                          Before you go, here are some exclusive offers just for you:
                        </p>
                      </div>

                      <div className="space-y-3">
                        {retentionOffers.map(offer => (
                          <Card
                            key={offer.id}
                            className="border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                            onClick={() => handleAcceptRetentionOffer(offer.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-blue-900">
                                    {offer.title}
                                  </h4>
                                  <p className="text-sm text-blue-700 mt-1">
                                    {offer.description}
                                  </p>
                                  <p className="text-xs text-blue-600 mt-2">
                                    Duration: {offer.duration}
                                  </p>
                                </div>
                                <div className="text-right text-blue-900">
                                  <p className="font-bold">Save</p>
                                  <p className="text-lg font-bold">
                                    {formatCurrency(offer.savings)}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="text-center">
                        <Button
                          variant="outline"
                          onClick={() => setShowRetentionOffer(false)}
                          className="text-gray-600"
                        >
                          No thanks, continue with cancellation
                        </Button>
                      </div>
                    </div>
                  )}

                  {!showRetentionOffer && (
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelDialog(false)}
                      >
                        Keep Subscription
                      </Button>
                      <Button
                        onClick={handleCancelConfirm}
                        disabled={
                          !cancellationData.reason || actionLoading === 'cancel'
                        }
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {actionLoading === 'cancel' ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : null}
                        Confirm Cancellation
                      </Button>
                    </DialogFooter>
                  )}
                </DialogContent>
              </Dialog>
            )}

            {onPauseSubscription && !subscription.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                onClick={() => onPauseSubscription(90)} // 90 days pause
                disabled={actionLoading === 'pause'}
                className="flex items-center gap-2"
              >
                {actionLoading === 'pause' && (
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                )}
                <Calendar className="w-4 h-4" />
                Pause Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Recommendations */}
      {(getUpgradeOptions().length > 0 || getDowngradeOptions().length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upgrade Options */}
              {getUpgradeOptions()
                .slice(0, 1)
                .map(plan => (
                  <Card key={plan.id} className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-green-900">
                            {plan.displayName}
                          </h4>
                          <p className="text-sm text-green-700">{plan.description}</p>
                        </div>
                        <ArrowUpCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-900">
                          {formatCurrency(
                            plan.pricing.monthly.amount,
                            plan.pricing.monthly.currency
                          )}
                          /month
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handlePlanChange(plan, 'month')}
                          disabled={actionLoading === 'plan-change'}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Upgrade
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {/* Downgrade Options */}
              {getDowngradeOptions()
                .slice(-1)
                .map(plan => (
                  <Card key={plan.id} className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-blue-900">
                            {plan.displayName}
                          </h4>
                          <p className="text-sm text-blue-700">{plan.description}</p>
                        </div>
                        <ArrowDownCircle className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-900">
                          {formatCurrency(
                            plan.pricing.monthly.amount,
                            plan.pricing.monthly.currency
                          )}
                          /month
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePlanChange(plan, 'month')}
                          disabled={actionLoading === 'plan-change'}
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          Downgrade
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SubscriptionManagement;
