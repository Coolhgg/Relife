// Payment Method Manager Component for Relife Alarm App
// Manages credit cards, bank accounts, and other payment methods

import React, { useState } from 'react';
import { CreditCard, Trash2, Plus, Check, AlertCircle, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import type { PaymentMethod, PaymentMethodType } from '../../types/premium';

interface PaymentMethodManagerProps {
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId?: string;
  isLoading?: boolean;
  onAddPaymentMethod: () => Promise<void>;
  onRemovePaymentMethod: (paymentMethodId: string) => Promise<void>;
  onSetDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>;
  onUpdateBillingDetails: (paymentMethodId: string, billingDetails: any) => Promise<void>;
  className?: string;
}

export function PaymentMethodManager({
  paymentMethods,
  defaultPaymentMethodId,
  isLoading = false,
  onAddPaymentMethod,
  onRemovePaymentMethod,
  onSetDefaultPaymentMethod,
  onUpdateBillingDetails,
  className = ''
}: PaymentMethodManagerProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMethod = async () => {
    try {
      setActionLoading('add');
      setError(null);
      await onAddPaymentMethod();
      setShowAddMethod(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add payment method');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMethod = async (paymentMethodId: string) => {
    try {
      setActionLoading(paymentMethodId);
      setError(null);
      await onRemovePaymentMethod(paymentMethodId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove payment method');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      setActionLoading(`default-${paymentMethodId}`);
      setError(null);
      await onSetDefaultPaymentMethod(paymentMethodId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default payment method');
    } finally {
      setActionLoading(null);
    }
  };

  const getPaymentMethodIcon = (type: PaymentMethodType) => {
    switch (type) {
      case 'card':
        return <CreditCard className="w-5 h-5" />;
      case 'bank_account':
        return <CreditCard className="w-5 h-5" />; // Bank icon could be different
      case 'paypal':
        return <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center">P</div>;
      case 'apple_pay':
        return <div className="w-5 h-5 bg-black rounded text-white text-xs flex items-center justify-center">A</div>;
      case 'google_pay':
        return <div className="w-5 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center">G</div>;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const formatCardNumber = (last4: string) => `•••• •••• •••• ${last4}`;

  const getCardBrand = (brand?: string) => {
    if (!brand) return '';
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const isDefaultMethod = (paymentMethodId: string) => paymentMethodId === defaultPaymentMethodId;

  if (isLoading && paymentMethods.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Payment Methods</h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-6 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payment Methods</h3>
        <Dialog open={showAddMethod} onOpenChange={setShowAddMethod}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">
                We'll redirect you to a secure page to add your payment method.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddMethod(false)}
                  disabled={actionLoading === 'add'}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMethod}
                  disabled={actionLoading === 'add'}
                >
                  {actionLoading === 'add' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {paymentMethods.length === 0 ? (
        <Card className="p-8 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="font-semibold text-gray-900 mb-2">No payment methods</h4>
          <p className="text-gray-600 mb-4">
            Add a payment method to manage your subscription
          </p>
          <Button onClick={() => setShowAddMethod(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <Card key={method.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getPaymentMethodIcon(method.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">
                        {method.type === 'card' && method.cardData ? (
                          <>
                            {getCardBrand(method.cardData.brand)} {formatCardNumber(method.cardData.last4)}
                          </>
                        ) : method.type === 'bank_account' ? (
                          `Bank Account ••••${method.cardData?.last4 || '****'}`
                        ) : method.type === 'paypal' ? (
                          'PayPal'
                        ) : method.type === 'apple_pay' ? (
                          'Apple Pay'
                        ) : method.type === 'google_pay' ? (
                          'Google Pay'
                        ) : (
                          'Payment Method'
                        )}
                      </h4>
                      {isDefaultMethod(method.id) && (
                        <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          <Star className="w-3 h-3" />
                          Default
                        </div>
                      )}
                    </div>
                    {method.type === 'card' && method.cardData && (
                      <p className="text-sm text-gray-600">
                        Expires {method.cardData.expMonth.toString().padStart(2, '0')}/{method.cardData.expYear}
                      </p>
                    )}
                    {method.billingDetails?.name && (
                      <p className="text-sm text-gray-600">
                        {method.billingDetails.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!isDefaultMethod(method.id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={actionLoading === `default-${method.id}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {actionLoading === `default-${method.id}` ? (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Make Default
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMethod(method.id)}
                    disabled={actionLoading === method.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    {actionLoading === method.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {paymentMethods.length > 0 && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            All payment methods are securely stored with Stripe
          </p>
        </div>
      )}
    </div>
  );
}

export default PaymentMethodManager;