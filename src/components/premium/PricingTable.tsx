// Premium Pricing Table Component - Simplified Version
import React, { useState } from 'react';

interface PricingTableProps {
  plans?: any[];
  currentTier?: string;
  billingInterval?: 'month' | 'year';
  onPlanSelect?: (planId: string
) => void;
  onBillingIntervalChange?: (interval: 'month' | 'year'
) => void;
  loading?: boolean;
  className?: string;
}

export function PricingTable({
  plans = [],
  currentTier = 'free',
  billingInterval = 'month',
  onPlanSelect,
  onBillingIntervalChange,
  loading = false,
  className = '',
}: PricingTableProps) {
  const [selectedInterval, setSelectedInterval] = useState(billingInterval);

  const handleIntervalChange = (interval: 'month' | 'year'
) => {
    setSelectedInterval(interval);
    onBillingIntervalChange?.(interval);
  };

  const handlePlanSelect = (planId: string
) => {
    onPlanSelect?.(planId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`pricing-table ${className}`}>
      <div className="flex justify-center mb-8">
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={(
) => handleIntervalChange('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedInterval === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={(
) => handleIntervalChange('year')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedInterval === 'year'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="border rounded-lg p-6 relative">
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="text-3xl font-bold mt-2">
              $
              {selectedInterval === 'month'
                ? plan.pricing.monthly.amount / 100
                : plan.pricing.yearly.amount / 100}
              <span className="text-sm font-normal text-gray-500">
                /{selectedInterval}
              </span>
            </p>
            <button
              onClick={(
) => handlePlanSelect(plan.id)}
              className="w-full mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              disabled={currentTier === plan.tier}
            >
              {currentTier === plan.tier ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PricingTable;
