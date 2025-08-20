/// <reference types="node" />
/// <reference lib="dom" />
import React, { useEffect, useCallback, useRef } from "react";
import { PersonaType, PersonaDetectionFactor } from "../types/index";

// Define missing types based on what the component needs
type UserPersona = {
  type: PersonaType;
  confidence: number;
  traits: string[];
};

type PersonaDetectionData = {
  factors: PersonaDetectionFactor[];
  confidence: number;
  primaryPersona: PersonaType;
  subscriptionTier?: string;
  ageRange?: string;
  usagePatterns?: any;
  priceInteraction?: any;
  featurePreferences?: any;
  deviceType?: string;
  timeOfDay?: any;
};

// Analytics Events for Persona Tracking
export type PersonaAnalyticsEvent =
  | "persona_detected"
  | "persona_changed"
  | "persona_pricing_viewed"
  | "persona_cta_clicked"
  | "persona_onboarding_started"
  | "persona_onboarding_completed"
  | "persona_feature_highlighted"
  | "persona_subscription_converted"
  | "persona_trial_started"
  | "persona_marketing_email_opened"
  | "persona_marketing_email_clicked"
  | "campaign_performance_tracked";

export interface PersonaAnalyticsData {
  userId?: string;
  sessionId: string;
  timestamp: number;
  persona: UserPersona;
  confidence: number;
  detectionMethod: "behavioral" | "explicit" | "inferred";
  previousPersona?: UserPersona;
  conversionStep?:
    | "awareness"
    | "consideration"
    | "trial"
    | "conversion"
    | "retention";
  campaignSource?: "email" | "social" | "organic" | "paid" | "referral";
  metadata?: Record<string, any>;
}

export interface CampaignPerformanceData {
  campaignId: string;
  persona: UserPersona;
  channel: "email" | "social" | "display" | "search" | "influencer";
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    conversionRate: number;
    costPerAcquisition: number;
  };
  timestamp: number;
}

class PersonaAnalyticsTracker {
  private static instance: PersonaAnalyticsTracker;
  private sessionId: string;
  private userId?: string;
  private eventQueue: Array<{
    event: PersonaAnalyticsEvent;
    data: PersonaAnalyticsData | CampaignPerformanceData;
  }> = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  static getInstance(): PersonaAnalyticsTracker {
    if (!PersonaAnalyticsTracker.instance) {
      PersonaAnalyticsTracker.instance = new PersonaAnalyticsTracker();
    }
    return PersonaAnalyticsTracker.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking(): void {
    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 30000);

    // Flush events before page unload
    window.addEventListener("beforeunload", () => {
      this.flushEvents();
    });
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Core Analytics Methods
  trackPersonaDetection(
    persona: UserPersona,
    detectionData: PersonaDetectionData,
    confidence: number,
  ): void {
    const analyticsData: PersonaAnalyticsData = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      persona,
      confidence,
      detectionMethod: "behavioral",
      conversionStep: "awareness",
      metadata: {
        subscriptionTier: detectionData.subscriptionTier,
        ageRange: detectionData.ageRange,
        usagePatterns: detectionData.usagePatterns,
        priceInteraction: detectionData.priceInteraction,
        featurePreferences: detectionData.featurePreferences,
        deviceType: detectionData.deviceType,
        timeOfDay: detectionData.timeOfDay,
        detectionScore: confidence,
      },
    };

    this.queueEvent("persona_detected", analyticsData);
    console.log(
      "[PersonaAnalytics] Persona detected:",
      persona,
      "confidence:",
      confidence,
    );
  }

  trackPersonaChange(
    oldPersona: UserPersona,
    newPersona: UserPersona,
    reason: string,
  ): void {
    const analyticsData: PersonaAnalyticsData = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      persona: newPersona,
      confidence: 0.8, // Default confidence for persona changes
      detectionMethod: "behavioral",
      previousPersona: oldPersona,
      metadata: {
        changeReason: reason,
        changeType: "automatic",
      },
    };

    this.queueEvent("persona_changed", analyticsData);
    console.log(
      "[PersonaAnalytics] Persona changed:",
      oldPersona,
      "->",
      newPersona,
      "reason:",
      reason,
    );
  }

  trackPersonaPricingInteraction(
    persona: UserPersona,
    action: "view" | "click" | "hover",
    tier?: string,
  ): void {
    const analyticsData: PersonaAnalyticsData = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      persona,
      confidence: 0.9,
      detectionMethod: "explicit",
      conversionStep: "consideration",
      metadata: {
        action,
        tier,
        timestamp: Date.now(),
      },
    };

    this.queueEvent("persona_pricing_viewed", analyticsData);
  }

  trackPersonaCTAClick(
    persona: UserPersona,
    ctaText: string,
    tier: string,
    position: string,
  ): void {
    const analyticsData: PersonaAnalyticsData = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      persona,
      confidence: 1.0,
      detectionMethod: "explicit",
      conversionStep: "consideration",
      metadata: {
        ctaText,
        tier,
        position,
        clickedAt: Date.now(),
      },
    };

    this.queueEvent("persona_cta_clicked", analyticsData);
  }

  trackOnboardingProgress(
    persona: UserPersona,
    step: number,
    completed: boolean,
  ): void {
    const event = completed
      ? "persona_onboarding_completed"
      : "persona_onboarding_started";
    const analyticsData: PersonaAnalyticsData = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      persona,
      confidence: 0.9,
      detectionMethod: "explicit",
      conversionStep: completed ? "trial" : "consideration",
      metadata: {
        step,
        completed,
        onboardingType: "persona_driven",
      },
    };

    this.queueEvent(event, analyticsData);
  }

  trackSubscriptionConversion(
    persona: UserPersona,
    tier: string,
    revenue: number,
    campaignSource?: string,
  ): void {
    const analyticsData: PersonaAnalyticsData = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      persona,
      confidence: 1.0,
      detectionMethod: "explicit",
      conversionStep: "conversion",
      campaignSource: campaignSource as any,
      metadata: {
        tier,
        revenue,
        conversionTime: Date.now(),
        lifetimeValue: this.calculateLifetimeValue(tier),
      },
    };

    this.queueEvent("persona_subscription_converted", analyticsData);
  }

  trackCampaignPerformance(campaignData: CampaignPerformanceData): void {
    this.queueEvent("campaign_performance_tracked", campaignData);
    console.log(
      "[PersonaAnalytics] Campaign performance tracked:",
      campaignData.campaignId,
    );
  }

  trackMarketingEmailInteraction(
    persona: UserPersona,
    campaignId: string,
    action: "opened" | "clicked",
    linkUrl?: string,
  ): void {
    const event =
      action === "opened"
        ? "persona_marketing_email_opened"
        : "persona_marketing_email_clicked";
    const analyticsData: PersonaAnalyticsData = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      persona,
      confidence: 0.8,
      detectionMethod: "explicit",
      conversionStep: action === "clicked" ? "consideration" : "awareness",
      campaignSource: "email",
      metadata: {
        campaignId,
        action,
        linkUrl,
        emailType: "persona_targeted",
      },
    };

    this.queueEvent(event, analyticsData);
  }

  // Helper Methods
  private calculateLifetimeValue(tier: string): number {
    const monthlyValues: Record<string, number> = {
      Basic: 3.99 * 12, // $47.88 annually
      Premium: 7.99 * 12, // $95.88 annually
      Pro: 15.99 * 12, // $191.88 annually
      Student: 1.99 * 12, // $23.88 annually
      Lifetime: 99, // One-time payment
    };
    return monthlyValues[tier] || 0;
  }

  private queueEvent(
    event: PersonaAnalyticsEvent,
    data: PersonaAnalyticsData | CampaignPerformanceData,
  ): void {
    this.eventQueue.push({ event, data });

    // Auto-flush if queue gets large
    if (this.eventQueue.length >= 10) {
      this.flushEvents();
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send to your analytics endpoint
      await this.sendToAnalyticsEndpoint(events);
      console.log("[PersonaAnalytics] Flushed", events.length, "events");
    } catch (error) {
      console.error("[PersonaAnalytics] Failed to flush events:", error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  private async sendToAnalyticsEndpoint(
    events: Array<{
      event: PersonaAnalyticsEvent;
      data: PersonaAnalyticsData | CampaignPerformanceData;
    }>,
  ): Promise<void> {
    // Replace with your actual analytics endpoint
    const ANALYTICS_ENDPOINT = "/api/analytics/persona-events";

    const response = await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        events,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Analytics endpoint returned ${response.status}`);
    }
  }

  // Public API for getting analytics data
  getSessionSummary(): {
    sessionId: string;
    userId?: string;
    eventsQueued: number;
  } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      eventsQueued: this.eventQueue.length,
    };
  }
}

// React Hook for Analytics Tracking
export const usePersonaAnalytics = () => {
  const tracker = useRef(PersonaAnalyticsTracker.getInstance());

  const trackPersonaDetection = useCallback(
    (
      persona: UserPersona,
      detectionData: PersonaDetectionData,
      confidence: number,
    ) => {
      tracker.current.trackPersonaDetection(persona, detectionData, confidence);
    },
    [],
  );

  const trackPersonaChange = useCallback(
    (oldPersona: UserPersona, newPersona: UserPersona, reason: string) => {
      tracker.current.trackPersonaChange(oldPersona, newPersona, reason);
    },
    [],
  );

  const trackPricingInteraction = useCallback(
    (
      persona: UserPersona,
      action: "view" | "click" | "hover",
      tier?: string,
    ) => {
      tracker.current.trackPersonaPricingInteraction(persona, action, tier);
    },
    [],
  );

  const trackCTAClick = useCallback(
    (persona: UserPersona, ctaText: string, tier: string, position: string) => {
      tracker.current.trackPersonaCTAClick(persona, ctaText, tier, position);
    },
    [],
  );

  const trackOnboardingProgress = useCallback(
    (persona: UserPersona, step: number, completed: boolean) => {
      tracker.current.trackOnboardingProgress(persona, step, completed);
    },
    [],
  );

  const trackSubscriptionConversion = useCallback(
    (
      persona: UserPersona,
      tier: string,
      revenue: number,
      campaignSource?: string,
    ) => {
      tracker.current.trackSubscriptionConversion(
        persona,
        tier,
        revenue,
        campaignSource,
      );
    },
    [],
  );

  const trackCampaignPerformance = useCallback(
    (campaignData: CampaignPerformanceData) => {
      tracker.current.trackCampaignPerformance(campaignData);
    },
    [],
  );

  const trackEmailInteraction = useCallback(
    (
      persona: UserPersona,
      campaignId: string,
      action: "opened" | "clicked",
      linkUrl?: string,
    ) => {
      tracker.current.trackMarketingEmailInteraction(
        persona,
        campaignId,
        action,
        linkUrl,
      );
    },
    [],
  );

  const setUserId = useCallback((userId: string) => {
    tracker.current.setUserId(userId);
  }, []);

  const getSessionSummary = useCallback(() => {
    return tracker.current.getSessionSummary();
  }, []);

  return {
    trackPersonaDetection,
    trackPersonaChange,
    trackPricingInteraction,
    trackCTAClick,
    trackOnboardingProgress,
    trackSubscriptionConversion,
    trackCampaignPerformance,
    trackEmailInteraction,
    setUserId,
    getSessionSummary,
  };
};

// Analytics Provider Component
export const PersonaAnalyticsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const analytics = usePersonaAnalytics();

  useEffect(() => {
    // Initialize analytics on mount
    console.log("[PersonaAnalytics] Analytics provider initialized");

    // Clean up on unmount
    return () => {
      console.log("[PersonaAnalytics] Analytics provider cleaned up");
    };
  }, []);

  return <>{children}</>;
};

export default PersonaAnalyticsTracker;
