// Feature Gate Service for Relife Alarm App
// Centralized feature access control and management

import type {
  FeatureAccess,
  FeatureGate,
  PremiumFeature,
} from "../types/premium";
import SubscriptionService from "./subscription-service";
import { ErrorHandler } from "./error-handler";
import AnalyticsService from "./analytics";

interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  usageLimit?: number;
  resetPeriod?: "daily" | "weekly" | "monthly";
  gracePeriodDays?: number;
  isCore: boolean;
  comingSoon?: boolean;
}

interface FeatureAccessResult {
  hasAccess: boolean;
  reason:
    | "tier_sufficient"
    | "tier_insufficient"
    | "usage_exceeded"
    | "feature_disabled"
    | "grace_period"
    | "trial_access";
  usageRemaining?: number;
  usageLimit?: number;
  resetDate?: Date;
  upgradeMessage?: string;
}

interface FeatureRestriction {
  userId: string;
  feature: string;
  restrictedUntil: Date;
  reason: string;
  canBypass: boolean;
}

class FeatureGateService {
  private static instance: FeatureGateService;
  private subscriptionService: SubscriptionService;
  private analytics: AnalyticsService;
  private featureDefinitions = new Map<string, FeatureDefinition>();
  private accessCache = new Map<
    string,
    { access: FeatureAccessResult; timestamp: number }
  >();
  private restrictions = new Map<string, FeatureRestriction>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.subscriptionService = SubscriptionService.getInstance();
    this.analytics = AnalyticsService.getInstance();
    this.initializeFeatureDefinitions();
  }

  public static getInstance(): FeatureGateService {
    if (!FeatureGateService.instance) {
      FeatureGateService.instance = new FeatureGateService();
    }
    return FeatureGateService.instance;
  }

  /**
   * Initialize feature definitions
   */
  private initializeFeatureDefinitions(): void {
    const features: FeatureDefinition[] = [
      // Basic Tier Features
      {
        id: "unlimited_alarms",
        name: "Unlimited Alarms",
        description: "Set unlimited number of alarms",
        category: "alarms",
        requiredTier: "basic",
        isCore: true,
      },
      {
        id: "custom_sounds",
        name: "Custom Sounds",
        description: "Upload custom alarm sounds",
        category: "alarms",
        requiredTier: "basic",
        usageLimit: 10,
        resetPeriod: "monthly",
        isCore: true,
      },
      {
        id: "basic_themes",
        name: "Premium Themes",
        description: "Access to premium visual themes",
        category: "themes",
        requiredTier: "basic",
        isCore: true,
      },
      {
        id: "alarm_battles",
        name: "Alarm Battles",
        description: "Participate in competitive wake-up challenges",
        category: "battles",
        requiredTier: "basic",
        usageLimit: 5,
        resetPeriod: "monthly",
        isCore: true,
      },

      // Premium Tier Features
      {
        id: "unlimited_battles",
        name: "Unlimited Battles",
        description: "Join unlimited alarm battles",
        category: "battles",
        requiredTier: "premium",
        isCore: true,
      },
      {
        id: "smart_scheduling",
        name: "Smart Scheduling",
        description: "AI-powered optimal alarm timing",
        category: "ai",
        requiredTier: "premium",
        isCore: true,
      },
      {
        id: "calendar_integration",
        name: "Calendar Integration",
        description: "Sync with external calendars",
        category: "integrations",
        requiredTier: "premium",
        isCore: true,
      },
      {
        id: "weather_integration",
        name: "Weather Integration",
        description: "Weather-based alarm adjustments",
        category: "integrations",
        requiredTier: "premium",
        isCore: true,
      },
      {
        id: "advanced_analytics",
        name: "Advanced Analytics",
        description: "Detailed sleep and wake pattern analysis",
        category: "analytics",
        requiredTier: "premium",
        isCore: true,
      },
      {
        id: "voice_ai_advanced",
        name: "Advanced Voice AI",
        description: "Enhanced voice recognition and responses",
        category: "voice",
        requiredTier: "premium",
        isCore: true,
      },

      // Pro Tier Features
      {
        id: "team_features",
        name: "Team Collaboration",
        description: "Team battles and group challenges",
        category: "collaboration",
        requiredTier: "pro",
        isCore: true,
      },
      {
        id: "api_access",
        name: "API Access",
        description: "Developer API for custom integrations",
        category: "integrations",
        requiredTier: "pro",
        usageLimit: 10000,
        resetPeriod: "monthly",
        isCore: true,
      },
      {
        id: "white_label",
        name: "White Label",
        description: "Remove Relife branding",
        category: "customization",
        requiredTier: "pro",
        isCore: true,
      },
      {
        id: "custom_themes",
        name: "Custom Theme Creator",
        description: "Create and share custom themes",
        category: "themes",
        requiredTier: "pro",
        isCore: true,
      },
      {
        id: "tournament_creation",
        name: "Tournament Creation",
        description: "Create and manage tournaments",
        category: "battles",
        requiredTier: "pro",
        isCore: true,
      },
      {
        id: "priority_support",
        name: "Priority Support",
        description: "Priority customer support",
        category: "support",
        requiredTier: "premium",
        isCore: true,
      },
    ];

    features.forEach((feature) => {
      this.featureDefinitions.set(feature.id, feature);
    });
  }

  /**
   * Check if user has access to a feature
   */
  public async checkFeatureAccess(
    userId: string,
    featureId: string,
  ): Promise<FeatureAccessResult> {
    try {
      // Check cache first
      const cacheKey = `${userId}:${featureId}`;
      const cached = this.accessCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.access;
      }

      // Check if feature is restricted
      const restriction = this.restrictions.get(cacheKey);
      if (restriction && restriction.restrictedUntil > new Date()) {
        return {
          hasAccess: restriction.canBypass,
          reason: "feature_disabled",
          upgradeMessage: `This feature is temporarily restricted: ${restriction.reason}`,
        };
      }

      const featureDef = this.featureDefinitions.get(featureId);
      if (!featureDef) {
        // Unknown feature, default to no access
        return {
          hasAccess: false,
          reason: "feature_disabled",
          upgradeMessage: "This feature is not available",
        };
      }

      if (featureDef.comingSoon) {
        return {
          hasAccess: false,
          reason: "feature_disabled",
          upgradeMessage: "This feature is coming soon!",
        };
      }

      // Get user's subscription tier and feature access
      const [userTier, featureAccess] = await Promise.all([
        this.subscriptionService.getUserTier(userId),
        this.subscriptionService.getFeatureAccess(userId),
      ]);

      // Check tier requirements
      const tierAccess = this.checkTierAccess(
        userTier,
        featureDef.requiredTier,
      );
      if (!tierAccess) {
        const result: FeatureAccessResult = {
          hasAccess: false,
          reason: "tier_insufficient",
          requiredTier: featureDef.requiredTier,
          upgradeMessage: this.getUpgradeMessage(featureDef),
        };

        // Cache the result
        this.accessCache.set(cacheKey, {
          access: result,
          timestamp: Date.now(),
        });

        return result;
      }

      // Check usage limits
      const featureUsage = featureAccess.features[featureId];
      if (featureDef.usageLimit && featureUsage) {
        const usageExceeded =
          featureUsage.usageCount !== undefined &&
          featureUsage.usageCount >= featureDef.usageLimit;

        if (usageExceeded) {
          const result: FeatureAccessResult = {
            hasAccess: false,
            reason: "usage_exceeded",
            usageRemaining: 0,
            usageLimit: featureDef.usageLimit,
            resetDate: featureUsage.resetDate,
            upgradeMessage: this.getUsageExceededMessage(featureDef),
          };

          this.accessCache.set(cacheKey, {
            access: result,
            timestamp: Date.now(),
          });

          return result;
        }
      }

      // Access granted
      const result: FeatureAccessResult = {
        hasAccess: true,
        reason: "tier_sufficient",
        usageRemaining:
          featureDef.usageLimit && featureUsage?.usageCount !== undefined
            ? Math.max(0, featureDef.usageLimit - featureUsage.usageCount)
            : undefined,
        usageLimit: featureDef.usageLimit,
        resetDate: featureUsage?.resetDate,
      };

      // Cache the result
      this.accessCache.set(cacheKey, {
        access: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        "Failed to check feature access",
        { context: "feature_gate_service", metadata: { userId, featureId } },
      );

      // Return safe default on error
      return {
        hasAccess: false,
        reason: "feature_disabled",
        upgradeMessage: "Unable to check feature access. Please try again.",
      };
    }
  }

  /**
   * Track feature usage attempt
   */
  public async trackFeatureAttempt(
    userId: string,
    featureId: string,
    granted: boolean,
    context?: Record<string, any>,
  ): Promise<void> {
    try {
      const featureDef = this.featureDefinitions.get(featureId);

      this.analytics.trackFeatureUsage("feature_access_attempt", undefined, {
        userId,
        featureId,
        featureName: featureDef?.name || featureId,
        category: featureDef?.category || "unknown",
        granted,
        requiredTier: featureDef?.requiredTier,
        context,
      });

      // If usage was denied, track the specific reason
      if (!granted) {
        const accessResult = await this.checkFeatureAccess(userId, featureId);
        this.analytics.trackFeatureUsage("feature_access_denied", undefined, {
          userId,
          featureId,
          reason: accessResult.reason,
          requiredTier: accessResult.requiredTier,
        });
      }
    } catch (error) {
      // Don't throw on analytics errors
      console.error("Failed to track feature attempt:", error);
    }
  }

  /**
   * Grant temporary access to a feature
   */
  public grantTemporaryAccess(
    userId: string,
    featureId: string,
    durationMinutes: number,
    reason: string,
  ): void {
    const cacheKey = `${userId}:${featureId}`;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Remove any existing restrictions
    this.restrictions.delete(cacheKey);

    // Grant access in cache
    this.accessCache.set(cacheKey, {
      access: {
        hasAccess: true,
        reason: "grace_period",
        upgradeMessage: `Temporary access granted: ${reason}`,
      },
      timestamp: Date.now(),
    });

    // Track the temporary access grant
    this.analytics.trackFeatureUsage("temporary_access_granted", undefined, {
      userId,
      featureId,
      durationMinutes,
      reason,
    });

    // Schedule removal
    setTimeout(
      () => {
        this.accessCache.delete(cacheKey);
      },
      durationMinutes * 60 * 1000,
    );
  }

  /**
   * Restrict access to a feature
   */
  public restrictFeatureAccess(
    userId: string,
    featureId: string,
    durationMinutes: number,
    reason: string,
    canBypass: boolean = false,
  ): void {
    const cacheKey = `${userId}:${featureId}`;
    const restrictedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

    this.restrictions.set(cacheKey, {
      userId,
      feature: featureId,
      restrictedUntil,
      reason,
      canBypass,
    });

    // Clear any cached access
    this.accessCache.delete(cacheKey);

    this.analytics.trackFeatureUsage("feature_access_restricted", undefined, {
      userId,
      featureId,
      durationMinutes,
      reason,
      canBypass,
    });
  }

  /**
   * Get all features for a subscription tier
   */
      "free",
      "basic",
      "premium",
      "pro",
      "enterprise",
    ];
    const tierLevel = tierHierarchy.indexOf(tier);

    return Array.from(this.featureDefinitions.values()).filter((feature) => {
      const requiredLevel = tierHierarchy.indexOf(feature.requiredTier);
      return requiredLevel <= tierLevel;
    });
  }

  /**
   * Get feature definition
   */
  public getFeatureDefinition(featureId: string): FeatureDefinition | null {
    return this.featureDefinitions.get(featureId) || null;
  }

  /**
   * Clear access cache for user
   */
  public clearUserCache(userId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.accessCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.accessCache.delete(key));
  }

  /**
   * Private helper methods
   */

  private checkTierAccess(
  ): boolean {
      "free",
      "basic",
      "premium",
      "pro",
      "enterprise",
    ];
    const userLevel = tierHierarchy.indexOf(userTier);
    const requiredLevel = tierHierarchy.indexOf(requiredTier);
    return userLevel >= requiredLevel;
  }

  private getUpgradeMessage(feature: FeatureDefinition): string {
    const tierNames = {
      basic: "Basic",
      premium: "Premium",
      pro: "Pro",
      enterprise: "Enterprise",
    };

    const tierName = tierNames[feature.requiredTier] || "Premium";

    switch (feature.category) {
      case "alarms":
        return `Upgrade to ${tierName} to unlock ${feature.name.toLowerCase()} and enhance your wake-up experience!`;
      case "battles":
        return `Upgrade to ${tierName} to access ${feature.name.toLowerCase()} and compete with friends!`;
      case "ai":
        return `Upgrade to ${tierName} to unlock ${feature.name.toLowerCase()} and optimize your sleep schedule with AI!`;
      case "integrations":
        return `Upgrade to ${tierName} to enable ${feature.name.toLowerCase()} and sync your data seamlessly!`;
      case "analytics":
        return `Upgrade to ${tierName} to access ${feature.name.toLowerCase()} and track your sleep patterns!`;
      case "collaboration":
        return `Upgrade to ${tierName} to unlock ${feature.name.toLowerCase()} and work together with your team!`;
      default:
        return `Upgrade to ${tierName} to unlock ${feature.name.toLowerCase()} and get the most out of Relife!`;
    }
  }

  private getUsageExceededMessage(feature: FeatureDefinition): string {
    const resetPeriod = feature.resetPeriod || "monthly";
    return `You've reached your ${resetPeriod} limit for ${feature.name.toLowerCase()}. Upgrade for unlimited access!`;
  }
}

export default FeatureGateService;
