import { supabase } from "./supabase";
import type { User } from "../types";
import { ErrorHandler } from "./error-handler";

export type SubscriptionTier = "free" | "premium" | "ultimate";

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  requiredTier: SubscriptionTier;
  category: "alarm" | "voice" | "analytics" | "customization" | "ai";
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
}

export class PremiumService {
  private static instance: PremiumService;

  private constructor() {}

  static getInstance(): PremiumService {
    if (!PremiumService.instance) {
      PremiumService.instance = new PremiumService();
    }
    return PremiumService.instance;
  }

  // Premium features configuration
  private premiumFeatures: PremiumFeature[] = [
    // Nuclear Mode
    {
      id: "nuclear_mode",
      name: "Nuclear Mode",
      description:
        "Extreme difficulty alarm challenges that are nearly impossible to ignore",
      requiredTier: "premium",
      category: "alarm",
    },

    // Custom Voices
    {
      id: "custom_voices",
      name: "Custom Voice Library",
      description:
        "Access to premium AI-generated voices and celebrity-style voices",
      requiredTier: "premium",
      category: "voice",
    },
    {
      id: "voice_cloning",
      name: "Voice Cloning",
      description: "Clone your own voice or upload custom voice recordings",
      requiredTier: "ultimate",
      category: "voice",
    },
    {
      id: "extra_personalities",
      name: "Extra Personalities",
      description:
        "Access to 20+ additional alarm personalities and mood variations",
      requiredTier: "premium",
      category: "voice",
    },

    // Advanced Features
    {
      id: "advanced_analytics",
      name: "Advanced Analytics",
      description:
        "Detailed sleep insights, performance tracking, and AI recommendations",
      requiredTier: "premium",
      category: "analytics",
    },
    {
      id: "unlimited_alarms",
      name: "Unlimited Alarms",
      description: "Create unlimited alarms (free users limited to 10)",
      requiredTier: "premium",
      category: "alarm",
    },
    {
      id: "smart_scheduling",
      name: "AI Smart Scheduling",
      description:
        "AI-powered optimal wake time suggestions based on sleep patterns",
      requiredTier: "premium",
      category: "ai",
    },
    {
      id: "theme_store",
      name: "Premium Themes",
      description:
        "Access to premium themes and unlimited customization options",
      requiredTier: "premium",
      category: "customization",
    },
    {
      id: "priority_support",
      name: "Priority Support",
      description: "24/7 premium support with faster response times",
      requiredTier: "premium",
      category: "ai",
    },

    // Ultimate Features
    {
      id: "white_label",
      name: "White Label",
      description:
        "Remove branding and customize the app for your organization",
      requiredTier: "ultimate",
      category: "customization",
    },
    {
      id: "api_access",
      name: "API Access",
      description: "Full API access for integrations and custom automations",
      requiredTier: "ultimate",
      category: "ai",
    },
  ];

  // Subscription plans
  private subscriptionPlans: SubscriptionPlan[] = [
    {
      tier: "free",
      name: "Free",
      description: "Perfect for getting started with smart alarms",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "Up to 10 alarms",
        "Basic voice moods",
        "Standard themes",
        "Basic analytics",
        "Community support",
      ],
    },
    {
      tier: "premium",
      name: "Premium",
      description: "Unlock advanced features and premium content",
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      popular: true,
      features: [
        "Nuclear Mode",
        "Custom voice library",
        "Extra personalities (20+)",
        "Unlimited alarms",
        "Advanced analytics",
        "AI smart scheduling",
        "Premium themes",
        "Priority support",
        "All free features",
      ],
    },
    {
      tier: "ultimate",
      name: "Ultimate",
      description: "Complete access with advanced customization",
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      features: [
        "Voice cloning",
        "White label options",
        "API access",
        "Custom integrations",
        "Dedicated support",
        "All premium features",
      ],
    },
  ];

  /**
   * Check if user has access to a specific feature
   */
  hasFeatureAccess(userTier: SubscriptionTier, featureId: string): boolean {
    const feature = this.premiumFeatures.find((f) => f.id === featureId);
    if (!feature) {
      return true; // If feature doesn't exist in our premium list, it's free
    }

    return this.hasMinimumTier(userTier, feature.requiredTier);
  }

  /**
   * Check if user has minimum required subscription tier
   */
  hasMinimumTier(
    userTier: SubscriptionTier,
    requiredTier: SubscriptionTier,
  ): boolean {
    const tierHierarchy: Record<SubscriptionTier, number> = {
      free: 0,
      premium: 1,
      ultimate: 2,
    };

    return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
  }

  /**
   * Get user's current subscription tier
   */
  async getUserTier(userId: string): Promise<SubscriptionTier> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("subscription_tier")
        .eq("id", userId)
        .single();

      if (error) {
        ErrorHandler.handleError(error, "Failed to get user subscription tier");
        return "free"; // Default to free on error
      }

      return data?.subscription_tier || "free";
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        "Error checking user subscription tier",
      );
      return "free";
    }
  }

  /**
   * Update user's subscription tier
   */
  async updateUserTier(
    userId: string,
    newTier: SubscriptionTier,
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          subscription_tier: newTier,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        ErrorHandler.handleError(
          error,
          "Failed to update user subscription tier",
        );
        return false;
      }

      return true;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        "Error updating user subscription tier",
      );
      return false;
    }
  }

  /**
   * Get available features for a subscription tier
   */
  getFeaturesForTier(tier: SubscriptionTier): PremiumFeature[] {
    return this.premiumFeatures.filter((feature) =>
      this.hasMinimumTier(tier, feature.requiredTier),
    );
  }

  /**
   * Get locked features for a subscription tier
   */
  getLockedFeatures(tier: SubscriptionTier): PremiumFeature[] {
    return this.premiumFeatures.filter(
      (feature) => !this.hasMinimumTier(tier, feature.requiredTier),
    );
  }

  /**
   * Get all subscription plans
   */
  getSubscriptionPlans(): SubscriptionPlan[] {
    return this.subscriptionPlans;
  }

  /**
   * Get specific subscription plan
   */
  getSubscriptionPlan(tier: SubscriptionTier): SubscriptionPlan | undefined {
    return this.subscriptionPlans.find((plan) => plan.tier === tier);
  }

  /**
   * Check if user can perform action (with limit checking)
   */
  async canPerformAction(
    userId: string,
    action: "create_alarm" | "use_voice" | "access_analytics",
  ): Promise<{
    allowed: boolean;
    reason?: string;
    upgradeRequired?: SubscriptionTier;
  }> {
    const userTier = await this.getUserTier(userId);

    switch (action) {
      case "create_alarm": {
        if (userTier === "free") {
          // Check alarm count for free users
          const { data, error } = await supabase
            .from("alarms")
            .select("id")
            .eq("user_id", userId);

          if (error) {
            return { allowed: false, reason: "Error checking alarm count" };
          }

          if (data && data.length >= 10) {
            return {
              allowed: false,
              reason: "Free users are limited to 10 alarms",
              upgradeRequired: "premium",
            };
          }
        }
        return { allowed: true };
      }

      case "use_voice": {
        // All tiers can use basic voices, premium checks are per-voice
        return { allowed: true };
      }

      case "access_analytics": {
        if (userTier === "free") {
          return {
            allowed: false,
            reason: "Advanced analytics require Premium subscription",
            upgradeRequired: "premium",
          };
        }
        return { allowed: true };
      }

      default:
        return { allowed: true };
    }
  }

  /**
   * Generate upgrade URL for payment processing
   */
  generateUpgradeUrl(
    currentTier: SubscriptionTier,
    targetTier: SubscriptionTier,
    userId: string,
  ): string {
    // In a real app, this would integrate with Stripe, Paddle, or similar
    const plan = this.getSubscriptionPlan(targetTier);
    if (!plan) {
      return "/pricing";
    }

    // For demo purposes, return a mock URL
    return `/upgrade?from=${currentTier}&to=${targetTier}&user=${userId}&price=${plan.monthlyPrice}`;
  }

  /**
   * Check feature access and return upgrade info if needed
   */
  async checkFeatureAccess(
    userId: string,
    featureId: string,
  ): Promise<{
    hasAccess: boolean;
    userTier: SubscriptionTier;
    requiredTier?: SubscriptionTier;
    upgradeUrl?: string;
    feature?: PremiumFeature;
  }> {
    const userTier = await this.getUserTier(userId);
    const hasAccess = this.hasFeatureAccess(userTier, featureId);
    const feature = this.premiumFeatures.find((f) => f.id === featureId);

    if (!hasAccess && feature) {
      return {
        hasAccess: false,
        userTier,
        requiredTier: feature.requiredTier,
        upgradeUrl: this.generateUpgradeUrl(
          userTier,
          feature.requiredTier,
          userId,
        ),
        feature,
      };
    }

    return {
      hasAccess: true,
      userTier,
      feature,
    };
  }

  /**
   * Get user's subscription status and limits
   */
  async getSubscriptionStatus(userId: string): Promise<{
    tier: SubscriptionTier;
    plan: SubscriptionPlan;
    limits: {
      alarmCount: { current: number; max: number | null };
      voicesAccess: { basic: boolean; premium: boolean; ultimate: boolean };
      featuresUnlocked: string[];
      featuresLocked: string[];
    };
  }> {
    const tier = await this.getUserTier(userId);
    const plan = this.getSubscriptionPlan(tier)!;

    // Get current alarm count
    const { data: alarms } = await supabase
      .from("alarms")
      .select("id")
      .eq("user_id", userId);

    const alarmCount = alarms?.length || 0;
    const maxAlarms = tier === "free" ? 10 : null; // null means unlimited

    const unlockedFeatures = this.getFeaturesForTier(tier);
    const lockedFeatures = this.getLockedFeatures(tier);

    return {
      tier,
      plan,
      limits: {
        alarmCount: {
          current: alarmCount,
          max: maxAlarms,
        },
        voicesAccess: {
          basic: true,
          premium: this.hasMinimumTier(tier, "premium"),
          ultimate: this.hasMinimumTier(tier, "ultimate"),
        },
        featuresUnlocked: unlockedFeatures.map((f) => f.id),
        featuresLocked: lockedFeatures.map((f) => f.id),
      },
    };
  }
}

export const premiumService = PremiumService.getInstance();
