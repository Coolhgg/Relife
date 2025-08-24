// Payment Flow Component for Relife Alarm App
// Handles subscription creation, upgrades, and payment processing

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Shield,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { TimeoutHandle } from '../types/timers';
import type {
  SubscriptionPlan,
  BillingInterval,
  PaymentMethod,
  CreateSubscriptionRequest,
} from '../../types/premium';

interface PaymentFlowProps {
  selectedPlan: SubscriptionPlan;
  billingInterval: BillingInterval;
  existingPaymentMethods?: PaymentMethod[];
  discountCode?: string;
  trialDays?: number;
  onPaymentSuccess: (subscriptionId: string) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
  onCreateSubscription: (
    request: CreateSubscriptionRequest
  ) => Promise<{ clientSecret: string; subscriptionId: string }>;
  className?: string;
}

interface PaymentFormData {
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  cardName: string;
  billingAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  email: string;
  savePaymentMethod: boolean;
  useExistingPaymentMethod?: string;
}

export function PaymentFlow({
  selectedPlan,
  billingInterval,
  existingPaymentMethods = [],
  discountCode,
  trialDays,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  onCreateSubscription,
  className = '',
}: PaymentFlowProps) {
  const [currentStep, setCurrentStep] = useState<
    'review' | 'payment' | 'processing' | 'success'
  >('review');
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardName: '',
    billingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
    email: '',
    savePaymentMethod: true,
    useExistingPaymentMethod:
      existingPaymentMethods.length > 0 ? existingPaymentMethods[0].id : undefined,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getPlanPrice = () => {
    const pricing = selectedPlan.pricing;
    return billingInterval === 'year' ? pricing.yearly : pricing.monthly;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.useExistingPaymentMethod) {
      if (!formData.cardNumber.replace(/\s/g, '')) {
        errors.cardNumber = 'Card number is required';
      }

      if (!formData.expiryDate) {
        errors.expiryDate = 'Expiry date is required';
      }

      if (!formData.cvc) {
        errors.cvc = 'CVC is required';
      }

      if (!formData.cardName.trim()) {
        errors.cardName = 'Cardholder name is required';
      }

      if (!formData.billingAddress.line1.trim()) {
        errors.billingAddress = 'Billing address is required';
      }

      if (!formData.billingAddress.city.trim()) {
        errors.city = 'City is required';
      }

      if (!formData.billingAddress.postalCode.trim()) {
        errors.postalCode = 'Postal code is required';
      }
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Valid email is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '');
    }
    return v;
  };

  const handleInputChange = (field: keyof PaymentFormData | string, value: string) => {
    if (field === 'cardNumber') {
      value = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      value = formatExpiryDate(value);
    } else if (field === 'cvc') {
      value = value.replace(/[^0-9]/gi, '').substring(0, 4);
    }

    if (field.startsWith('billingAddress.')) {
      const addressField = field.replace('billingAddress.', '');
      setFormData((prev: any) => ({ // auto: implicit any{
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev: any) => ({ // auto: implicit any{
        ...prev,
        [field]: value,
      }));
    }

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev: any) => ({ // auto: implicit any{
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSubmitPayment = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setError(null);
    setCurrentStep('processing');

    try {
      const request: CreateSubscriptionRequest = {
        planId: selectedPlan.id,
        billingInterval,
        discountCode,
        trialDays,
        paymentMethodId: formData.useExistingPaymentMethod,
        billingDetails: formData.useExistingPaymentMethod
          ? undefined
          : {
              name: formData.cardName,
              email: formData.email,
              address: formData.billingAddress,
            },
      };

      const result = await onCreateSubscription(request);

      // In a real implementation, you would integrate with Stripe Elements here
      // For now, we'll simulate successful payment
      setTimeout(() => {
        setCurrentStep('success');
        setTimeout(() => {
          onPaymentSuccess(result.subscriptionId);
        }, 2000);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setCurrentStep('payment');
      onPaymentError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { id: 'review', title: 'Review Order', completed: true },
    { id: 'payment', title: 'Payment Details', completed: currentStep === 'success' },
    { id: 'success', title: 'Complete', completed: currentStep === 'success' },
  ];

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step.completed
                    ? 'bg-green-600 border-green-600 text-white'
                    : currentStep === step.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-gray-300 text-gray-300'
                }`}
              >
                {step.completed ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  step.completed
                    ? 'text-green-600'
                    : currentStep === step.id
                      ? 'text-blue-600'
                      : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-0.5 mx-4 ${
                    steps[index + 1].completed ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Review Step */}
      {currentStep === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Details */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold">{selectedPlan.displayName}</h4>
                <p className="text-sm text-gray-600">{selectedPlan.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {billingInterval === 'year' ? 'Annual' : 'Monthly'} billing
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-lg">
                  {formatCurrency(getPlanPrice().amount, getPlanPrice().currency)}
                </p>
                <p className="text-sm text-gray-600">
                  per {billingInterval === 'year' ? 'year' : 'month'}
                </p>
              </div>
            </div>

            {/* Trial Info */}
            {trialDays && trialDays > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  You'll get {trialDays} days free trial. Your card will be charged
                  after the trial ends.
                </AlertDescription>
              </Alert>
            )}

            {/* Discount Code */}
            {discountCode && (
              <div className="flex items-center justify-between text-green-600">
                <span>Discount ({discountCode})</span>
                <span>Applied</span>
              </div>
            )}

            <Separator />

            {/* Total */}
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total {trialDays ? 'after trial' : 'today'}</span>
              <span>
                {formatCurrency(getPlanPrice().amount, getPlanPrice().currency)}
              </span>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setCurrentStep('payment')} className="flex-1">
                Continue to Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Step */}
      {currentStep === 'payment' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}

            {/* Existing Payment Methods */}
            {existingPaymentMethods.length > 0 && (
              <div className="space-y-4">
                <Label>Use existing payment method</Label>
                <div className="space-y-2">
                  {existingPaymentMethods.map(method => (
                    <Card
                      key={method.id}
                      className={`cursor-pointer transition-colors ${
                        formData.useExistingPaymentMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() =>
                        handleInputChange('useExistingPaymentMethod', method.id)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              checked={formData.useExistingPaymentMethod === method.id}
                              onChange={() =>
                                handleInputChange('useExistingPaymentMethod', method.id)
                              }
                              className="text-blue-600"
                            />
                            <CreditCard className="w-5 h-5" />
                            <div>
                              <p className="font-medium">
                                {method.cardData?.brand} ••••{method.cardData?.last4}
                              </p>
                              <p className="text-sm text-gray-600">
                                Expires {method.cardData?.expMonth}/
                                {method.cardData?.expYear}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!formData.useExistingPaymentMethod}
                    onChange={() => handleInputChange('useExistingPaymentMethod', '')}
                    className="text-blue-600"
                  />
                  <Label>Use a new payment method</Label>
                </div>

                <Separator />
              </div>
            )}

            {/* New Payment Method Form */}
            {!formData.useExistingPaymentMethod && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      value={formData.cardNumber}
                      onChange={(e: any) => h // auto: implicit anyandleInputChange('cardNumber', e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className={validationErrors.cardNumber ? 'border-red-300' : ''}
                    />
                    {validationErrors.cardNumber && (
                      <p className="text-sm text-red-600 mt-1">
                        {validationErrors.cardNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      value={formData.expiryDate}
                      onChange={(e: any) => h // auto: implicit anyandleInputChange('expiryDate', e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                      className={validationErrors.expiryDate ? 'border-red-300' : ''}
                    />
                    {validationErrors.expiryDate && (
                      <p className="text-sm text-red-600 mt-1">
                        {validationErrors.expiryDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      value={formData.cvc}
                      onChange={(e: any) => h // auto: implicit anyandleInputChange('cvc', e.target.value)}
                      placeholder="123"
                      maxLength={4}
                      className={validationErrors.cvc ? 'border-red-300' : ''}
                    />
                    {validationErrors.cvc && (
                      <p className="text-sm text-red-600 mt-1">
                        {validationErrors.cvc}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      value={formData.cardName}
                      onChange={(e: any) => h // auto: implicit anyandleInputChange('cardName', e.target.value)}
                      placeholder="John Doe"
                      className={validationErrors.cardName ? 'border-red-300' : ''}
                    />
                    {validationErrors.cardName && (
                      <p className="text-sm text-red-600 mt-1">
                        {validationErrors.cardName}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Billing Address */}
                <div className="space-y-4">
                  <h4 className="font-medium">Billing Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="line1">Address Line 1</Label>
                      <Input
                        id="line1"
                        value={formData.billingAddress.line1}
                        onChange={(e: any) => // auto: implicit any
                          handleInputChange('billingAddress.line1', e.target.value)
                        }
                        placeholder="123 Main Street"
                        className={
                          validationErrors.billingAddress ? 'border-red-300' : ''
                        }
                      />
                      {validationErrors.billingAddress && (
                        <p className="text-sm text-red-600 mt-1">
                          {validationErrors.billingAddress}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="line2">Address Line 2 (Optional)</Label>
                      <Input
                        id="line2"
                        value={formData.billingAddress.line2}
                        onChange={(e: any) => // auto: implicit any
                          handleInputChange('billingAddress.line2', e.target.value)
                        }
                        placeholder="Apartment, suite, etc."
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.billingAddress.city}
                        onChange={(e: any) => // auto: implicit any
                          handleInputChange('billingAddress.city', e.target.value)
                        }
                        placeholder="New York"
                        className={validationErrors.city ? 'border-red-300' : ''}
                      />
                      {validationErrors.city && (
                        <p className="text-sm text-red-600 mt-1">
                          {validationErrors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.billingAddress.state}
                        onChange={(e: any) => // auto: implicit any
                          handleInputChange('billingAddress.state', e.target.value)
                        }
                        placeholder="NY"
                      />
                    </div>

                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={formData.billingAddress.postalCode}
                        onChange={(e: any) => // auto: implicit any
                          handleInputChange('billingAddress.postalCode', e.target.value)
                        }
                        placeholder="10001"
                        className={validationErrors.postalCode ? 'border-red-300' : ''}
                      />
                      {validationErrors.postalCode && (
                        <p className="text-sm text-red-600 mt-1">
                          {validationErrors.postalCode}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.billingAddress.country}
                        onChange={(e: any) => // auto: implicit any
                          handleInputChange('billingAddress.country', e.target.value)
                        }
                        placeholder="US"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e: any) => h // auto: implicit anyandleInputChange('email', e.target.value)}
                placeholder="john@example.com"
                className={validationErrors.email ? 'border-red-300' : ''}
              />
              {validationErrors.email && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.email}</p>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <Lock className="w-4 h-4" />
                <span>Your payment information is encrypted and secure</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('review')}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmitPayment}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                {trialDays ? 'Start Free Trial' : 'Complete Purchase'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Step */}
      {currentStep === 'processing' && (
        <Card className="text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
            <p className="text-gray-600">
              Please don't close this window while we process your payment...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Success Step */}
      {currentStep === 'success' && (
        <Card className="text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-4">
              Welcome to {selectedPlan.displayName}! You now have access to all premium
              features.
            </p>
            {trialDays && (
              <Badge className="bg-blue-100 text-blue-800">
                {trialDays}-day free trial started
              </Badge>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PaymentFlow;
