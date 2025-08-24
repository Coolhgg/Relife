// Billing History Component for Relife Alarm App
// Displays invoice history, upcoming payments, and payment receipts

import React, { useState } from 'react';
import {
  Receipt,
  Download,
  Eye,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { AlertTriangle, AlertDescription } from '../ui/alert';
import type { Invoice, PaymentStatus } from '../../types/premium';

interface BillingHistoryProps {
  invoices: Invoice[];
  upcomingInvoice?: Invoice | null;
  isLoading?: boolean;
  onDownloadInvoice?: (invoiceId: string) => Promise<void>;
  onViewInvoice?: (invoiceId: string) => void;
  onPayInvoice?: (invoiceId: string) => Promise<void>;
  className?: string;
}

export function BillingHistory({
  invoices,
  upcomingInvoice,
  isLoading = false,
  onDownloadInvoice,
  onViewInvoice,
  onPayInvoice,
  className = '',
}: BillingHistoryProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
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

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'succeeded':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'requires_action':
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Action Required
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    if (!onDownloadInvoice) return;
    try {
      setActionLoading(`download-${invoiceId}`);
      await onDownloadInvoice(invoiceId);
    } catch (error) {
      console.error('Failed to download invoice:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    if (!onPayInvoice) return;
    try {
      setActionLoading(`pay-${invoiceId}`);
      await onPayInvoice(invoiceId);
    } catch (error) {
      console.error('Failed to pay invoice:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const isPastDue = (invoice: Invoice) => {
    return (
      invoice.dueDate &&
      new Date(invoice.dueDate) < new Date() &&
      invoice.status !== 'succeeded'
    );
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upcoming Invoice */}
      {upcomingInvoice && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">
                  {formatCurrency(upcomingInvoice.amount, upcomingInvoice.currency)}
                </p>
                <p className="text-gray-600 text-sm">
                  Due {formatDate(upcomingInvoice.dueDate || upcomingInvoice.createdAt)}
                </p>
                {upcomingInvoice.description && (
                  <p className="text-gray-500 text-sm mt-1">
                    {upcomingInvoice.description}
                  </p>
                )}
              </div>
              {upcomingInvoice.status !== 'succeeded' && (
                <div className="text-right">
                  {getStatusBadge(upcomingInvoice.status)}
                  {isPastDue(upcomingInvoice) && (
                    <p className="text-red-600 text-sm mt-1">Past due</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Payments Alert */}
      {invoices.some(invoice => invoice.status === 'failed' || isPastDue(invoice)) && (
        <AlertTriangle className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">
            You have failed or past due payments. Please update your payment method or
            contact support.
          </AlertDescription>
        </Alert>
      )}

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">No billing history</h4>
              <p className="text-gray-600">
                Your invoices and payment history will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {formatDate(invoice.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {invoice.description || 'Subscription Payment'}
                          </p>
                          {invoice.invoiceNumber && (
                            <p className="text-sm text-gray-500">
                              #{invoice.invoiceNumber}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(invoice.status)}
                          {isPastDue(invoice) && (
                            <p className="text-red-600 text-xs">Past due</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {/* Pay button for failed/unpaid invoices */}
                          {(invoice.status === 'failed' ||
                            invoice.status === 'requires_action' ||
                            isPastDue(invoice)) &&
                            onPayInvoice && (
                              <Button
                                size="sm"
                                onClick={() => handlePayInvoice(invoice.id)}
                                disabled={actionLoading === `pay-${invoice.id}`}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {actionLoading === `pay-${invoice.id}` ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  'Pay Now'
                                )}
                              </Button>
                            )}

                          {/* View invoice */}
                          {onViewInvoice && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewInvoice(invoice.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Download invoice */}
                          {onDownloadInvoice && invoice.receiptUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadInvoice(invoice.id)}
                              disabled={actionLoading === `download-${invoice.id}`}
                            >
                              {actionLoading === `download-${invoice.id}` ? (
                                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Info */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          All payments are processed securely through Stripe. For billing questions,
          contact our support team.
        </p>
      </div>
    </div>
  );
}

export default BillingHistory;
