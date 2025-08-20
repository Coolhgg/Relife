import * as React from "react";
/**
 * A/B Testing Hook for Struggling Sam Optimization
 * Handles feature flags, variant assignments, and tracking
 */

import { useState, useEffect, useCallback } from "react";
import {
  ABTestGroup,
  UserABTest,
  ABTestFeature,
  ABTestMetrics,
} from "../types/struggling-sam";
import StrugglingSamApiService from "../services/struggling-sam-api";

// Feature configuration for different test groups
export const STRUGGLING_SAM_FEATURES = {
  // Control Group Features (30% of users)
  CONTROL: {
    streaks: false,
    achievements: false,
    social_proof: false,
    upgrade_prompts: false,
    celebrations: false,
    challenges: false,
  },

  // Gamification Only Group (35% of users)
  GAMIFICATION: {
    streaks: true,
    achievements: true,
    social_proof: false,
    upgrade_prompts: false,
    celebrations: true,
    challenges: false,
  },

  // Full Optimization Group (35% of users)
  FULL_OPTIMIZATION: {
    streaks: true,
    achievements: true,
    social_proof: true,
    upgrade_prompts: true,
    celebrations: true,
    challenges: true,
  },
};

export type FeatureKey = keyof typeof STRUGGLING_SAM_FEATURES.FULL_OPTIMIZATION;

interface ABTestingState {
  testGroup: ABTestGroup | null;
  userAssignment: UserABTest | null;
  features: Record<FeatureKey, boolean>;
  variant: string;
  loading: boolean;
  error: string | null;
}

export const useABTesting = (userId?: string) => {
  const [state, setState] = useState<ABTestingState>({
    testGroup: null,
    userAssignment: null,
    features: STRUGGLING_SAM_FEATURES.CONTROL,
    variant: "control",
    loading: false,
    error: null,
  });

  // Initialize A/B test assignment
  useEffect(() => {
    if (userId) {
      initializeABTesting(userId);
    }
  }, [userId]);

  const initializeABTesting = async (userId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Check if user already has an A/B test assignment
      let userAssignment =
        await StrugglingSamApiService.getUserABTestAssignment(userId);

      // If no assignment exists, create one
      if (!userAssignment) {
        userAssignment =
          await StrugglingSamApiService.assignUserToABTest(userId);
      }

      // Get test group details
      const testGroups = await StrugglingSamApiService.getABTestGroups();
      const testGroup = testGroups.find(
        (group) => group.id === userAssignment?.testId,
      );

      if (testGroup && userAssignment) {
        // Determine features based on test group
        let features = STRUGGLING_SAM_FEATURES.CONTROL;
        let variant = "control";

        if (testGroup.name === "Gamification Only") {
          features = STRUGGLING_SAM_FEATURES.GAMIFICATION;
          variant = "gamification";
        } else if (testGroup.name === "Full Optimization") {
          features = STRUGGLING_SAM_FEATURES.FULL_OPTIMIZATION;
          variant = "full";
        }

        setState({
          testGroup,
          userAssignment,
          features,
          variant,
          loading: false,
          error: null,
        });

        // Track user assignment
        await StrugglingSamApiService.trackABTestEngagement(
          testGroup.id,
          userId,
          "session_start",
        );
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to initialize A/B testing",
        }));
      }
    } catch (error) {
      console.error("A/B Testing initialization error:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to initialize A/B testing",
      }));
    }
  };

  // Check if a feature is enabled
  const isFeatureEnabled = useCallback(
    (featureKey: FeatureKey): boolean => {
      return state.features[featureKey] || false;
    },
    [state.features],
  );

  // Get feature variant
  const getFeatureVariant = useCallback(
    (featureKey: FeatureKey): string | null => {
      if (!state.features[featureKey]) return null;
      return state.variant;
    },
    [state.features, state.variant],
  );

  // Track feature usage
  const trackFeatureUsage = useCallback(
    async (
      featureKey: FeatureKey,
      action: string,
      metadata?: Record<string, any>,
    ) => {
      if (!state.testGroup || !state.userAssignment || !userId) return;

      try {
        await StrugglingSamApiService.trackABTestEngagement(
          state.testGroup.id,
          userId,
          `feature_${featureKey}_${action}`,
          { feature: featureKey, action, ...metadata },
        );
      } catch (error) {
        console.error("Failed to track feature usage:", error);
      }
    },
    [state.testGroup, state.userAssignment, userId],
  );

  // Track conversion event
  const trackConversion = useCallback(
    async (
      conversionType: "upgrade" | "subscription" | "premium_trial" = "upgrade",
    ) => {
      if (!state.testGroup || !state.userAssignment || !userId) return;

      try {
        await StrugglingSamApiService.trackABTestConversion(
          state.testGroup.id,
          userId,
        );

        // Also track the specific conversion type
        await StrugglingSamApiService.trackABTestEngagement(
          state.testGroup.id,
          userId,
          "conversion",
          { type: conversionType },
        );
      } catch (error) {
        console.error("Failed to track conversion:", error);
      }
    },
    [state.testGroup, state.userAssignment, userId],
  );

  // Track engagement event
  const trackEngagement = useCallback(
    async (action: string, metadata?: Record<string, any>) => {
      if (!state.testGroup || !state.userAssignment || !userId) return;

      try {
        await StrugglingSamApiService.trackABTestEngagement(
          state.testGroup.id,
          userId,
          action,
          metadata,
        );
      } catch (error) {
        console.error("Failed to track engagement:", error);
      }
    },
    [state.testGroup, state.userAssignment, userId],
  );

  // Component visibility helpers
  const shouldShowStreaks = isFeatureEnabled("streaks");
  const shouldShowAchievements = isFeatureEnabled("achievements");
  const shouldShowSocialProof = isFeatureEnabled("social_proof");
  const shouldShowUpgradePrompts = isFeatureEnabled("upgrade_prompts");
  const shouldShowCelebrations = isFeatureEnabled("celebrations");
  const shouldShowChallenges = isFeatureEnabled("challenges");

  return {
    // State
    testGroup: state.testGroup,
    userAssignment: state.userAssignment,
    variant: state.variant,
    loading: state.loading,
    error: state.error,

    // Feature flags
    features: state.features,
    isFeatureEnabled,
    getFeatureVariant,

    // Component visibility
    shouldShowStreaks,
    shouldShowAchievements,
    shouldShowSocialProof,
    shouldShowUpgradePrompts,
    shouldShowCelebrations,
    shouldShowChallenges,

    // Tracking methods
    trackFeatureUsage,
    trackConversion,
    trackEngagement,

    // Utility
    isControlGroup: state.variant === "control",
    isGamificationGroup: state.variant === "gamification",
    isFullOptimizationGroup: state.variant === "full",
  };
};

// Higher-order component for conditional rendering based on A/B tests
export const withABTest = <T extends object>(
  Component: React.ComponentType<T>,
  featureKey: FeatureKey,
) => {
  return (props: T & { userId?: string }) => {
    const { isFeatureEnabled } = useABTesting(props.userId);

    if (!isFeatureEnabled(featureKey)) {
      return null;
    }

    return <Component {...props} />;
  };
};

// Hook for A/B test aware component mounting
export const useABTestComponent = (featureKey: FeatureKey, userId?: string) => {
  const { isFeatureEnabled, trackFeatureUsage } = useABTesting(userId);

  useEffect(() => {
    if (isFeatureEnabled(featureKey)) {
      trackFeatureUsage(featureKey, "component_mounted");
    }
  }, [isFeatureEnabled, featureKey, trackFeatureUsage]);

  return {
    shouldRender: isFeatureEnabled(featureKey),
    trackUsage: (action: string, metadata?: Record<string, any>) =>
      trackFeatureUsage(featureKey, action, metadata),
  };
};

export default useABTesting;
