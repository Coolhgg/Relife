/* eslint-disable react-refresh/only-export-components */
// Feature Access Context for Relife Alarm App
// Provides feature access state and controls throughout the React component tree

import React, {
import path
import { SubscriptionTier } from '@/types';
import path
// Replaced stub import with proper implementation
import path
// Replaced stub import with proper implementation
import path
import { SubscriptionTier } from '@/types';
import path
// Replaced stub import with proper implementation
import path
// Replaced stub import with proper implementation
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import FeatureGateService from '../services/feature-gate-service';
import SubscriptionService from '../services/subscription-service';
import { ErrorHandler } from '../services/error-handler';
import { TimeoutHandle } from '../types/timers';

interface FeatureAccessContextValue {
  // State
  featureAccess: FeatureAccess | null;
  isLoading: boolean;
  _error: string | null;

  // Feature checking
  hasFeatureAccess: (featureId: string) => boolean;
  getFeatureUsage: (
    featureId: string
  ) => { used: number; limit: number; remaining: number } | null;

  // Actions
  trackFeatureAttempt: (featureId: string, context?: Record<string, any>) => void;
  refreshFeatureAccess: () => Promise<void>;
  grantTemporaryAccess: (
    featureId: string,
    durationMinutes: number,
    reason: string
  ) => void;

  // Callbacks
  onFeatureBlocked?: (
    featureId: string,
    _requiredTier?: any /* auto: placeholder param - adjust */
  ) => void;
  onUpgradeRequired?: (
    featureId: string,
    _requiredTier?: any /* auto: placeholder param - adjust */
  ) => void;
}

const FeatureAccessContext = createContext<FeatureAccessContextValue | null>(null);

interface FeatureAccessProviderProps {
  children: ReactNode;
  userId: string;
  onFeatureBlocked?: (
    featureId: string,
    _requiredTier?: any /* auto: placeholder param - adjust */
  ) => void;
  onUpgradeRequired?: (
    featureId: string,
    _requiredTier?: any /* auto: placeholder param - adjust */
  ) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function FeatureAccessProvider({
  children,
  userId,
  onFeatureBlocked,
  onUpgradeRequired,
  autoRefresh = true,
  refreshInterval = 300000, // 5 minutes
}: FeatureAccessProviderProps) {
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  const featureGateService = FeatureGateService.getInstance();
  const subscriptionService = SubscriptionService.getInstance();

  // Load initial feature access data
  const loadFeatureAccess = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [accessData, tier] = await Promise.all([
        subscriptionService.getFeatureAccess(userId),
        subscriptionService.getUserTier(userId),
      ]);

      setFeatureAccess(accessData);
      setUserTier(tier);
    } catch (_error) {
      const errorMessage = 'Failed to load feature access data';
      setError(errorMessage);

      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        errorMessage,
        { context: 'FeatureAccessProvider', metadata: { userId } }
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId, subscriptionService]);

  // Initialize on mount
  useEffect(() => {
    loadFeatureAccess();
  }, [loadFeatureAccess]);

  // Auto-refresh feature access
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const interval = setInterval(() => {
      loadFeatureAccess();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadFeatureAccess]);

  // Feature access checking functions
  const hasFeatureAccess = useCallback(
    (featureId: string): boolean => {
      if (!featureAccess) return false;

      const feature = featureAccess.features[featureId];
      if (!feature) return false;

      // Check if user has access
      if (!feature.hasAccess) return false;

      // Check usage limits
      if (feature.usageLimit && feature.usageCount !== undefined) {
        return feature.usageCount < feature.usageLimit;
      }

      return true;
    },
    [featureAccess]
  );

  const getFeatureUsage = useCallback(
    (featureId: string) => {
      if (!featureAccess) return null;

      const feature = featureAccess.features[featureId];
      if (!feature || !feature.usageLimit || feature.usageCount === undefined) {
        return null;
      }

      return {
        used: feature.usageCount,
        limit: feature.usageLimit,
        remaining: Math.max(0, feature.usageLimit - feature.usageCount),
      };
    },
    [featureAccess]
  );

  const getUpgradeRequirement = useCallback(
    (featureId: string) => {
      if (!featureAccess) return null;

      const feature = featureAccess.features[featureId];
      return feature?.upgradeRequired || null;
    },
    [featureAccess]
  );

  // Actions
  const trackFeatureAttempt = useCallback(
    async (featureId: string, context?: Record<string, any>) => {
      const hasAccess = hasFeatureAccess(featureId);

      await featureGateService.trackFeatureAttempt(
        userId,
        featureId,
        hasAccess,
        context
      );

      // Trigger callbacks if access is denied
      if (!hasAccess) {
        const requiredTier = getUpgradeRequirement(featureId);

        if (onFeatureBlocked) {
          onFeatureBlocked(featureId, requiredTier || 'basic');
        }

        if (requiredTier && onUpgradeRequired) {
          onUpgradeRequired(featureId, requiredTier);
        }
      }
    },
    [
      userId,
      hasFeatureAccess,
      getUpgradeRequirement,
      onFeatureBlocked,
      onUpgradeRequired,
    ]
  );

  const refreshFeatureAccess = useCallback(async () => {
    await loadFeatureAccess();
  }, [loadFeatureAccess]);

  const grantTemporaryAccess = useCallback(
    (featureId: string, durationMinutes: number, reason: string) => {
      featureGateService.grantTemporaryAccess(
        userId,
        featureId,
        durationMinutes,
        reason
      );

      // Refresh feature access to reflect the temporary grant
      setTimeout(() => {
        loadFeatureAccess();
      }, 1000);
    },
    [userId, loadFeatureAccess]
  );

  const contextValue: FeatureAccessContextValue = {
    // State
    featureAccess,
    userTier,
    isLoading,
    _error,

    // Feature checking
    hasFeatureAccess,
    getFeatureUsage,
    getUpgradeRequirement,

    // Actions
    trackFeatureAttempt,
    refreshFeatureAccess,
    grantTemporaryAccess,

    // Callbacks
    onFeatureBlocked,
    onUpgradeRequired,
  };

  return (
    <FeatureAccessContext.Provider value={contextValue}>
      {children}
    </FeatureAccessContext.Provider>
  );
}

// Hook to use feature access context
export function useFeatureAccessContext(): FeatureAccessContextValue {
  const context = useContext(FeatureAccessContext);

  if (!context) {
    throw new Error(
      'useFeatureAccessContext must be used within a FeatureAccessProvider'
    );
  }

  return context;
}

// Higher-order component to provide feature access context
export function withFeatureAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  userId: string,
  options?: {
    onFeatureBlocked?: (featureId: string, requiredTier?: SubscriptionTier) => void;
    onUpgradeRequired?: (featureId: string, requiredTier?: SubscriptionTier) => void;
  }
) {
  return function FeatureAccessWrappedComponent(props: P) {
    return (
      <FeatureAccessProvider
        userId={userId}
        onFeatureBlocked={options?.onFeatureBlocked}
        onUpgradeRequired={options?.onUpgradeRequired}
      >
        <WrappedComponent {...props} />
      </FeatureAccessProvider>
    );
  };
}

// Component to conditionally render based on feature access
interface ConditionalFeatureProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  onBlocked?: () => void;
}

export function ConditionalFeature({
  feature,
  children,
  fallback = null,
  onBlocked,
}: ConditionalFeatureProps) {
  const { hasFeatureAccess: checkAccess, trackFeatureAttempt } =
    useFeatureAccessContext();

  const hasAccess = checkAccess(feature);

  // Track the attempt when component mounts or feature changes
  useEffect(() => {
    trackFeatureAttempt(feature);

    if (!hasAccess && onBlocked) {
      onBlocked();
    }
  }, [feature, hasAccess, onBlocked, trackFeatureAttempt]);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Hook for easier feature access checking
export function useFeatureAccess(feature: string) {
  const context = useFeatureAccessContext();

  return {
    hasAccess: context.hasFeatureAccess(feature),
    usage: context.getFeatureUsage(feature),
    requiredTier: context.getUpgradeRequirement(feature),
    trackAttempt: (contextData?: Record<string, any>) =>
      context.trackFeatureAttempt(feature, contextData),
  };
}

export default FeatureAccessContext;
