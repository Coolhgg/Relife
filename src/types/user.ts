/**
 * Central User Types and Subscription Helpers
 * This file provides a unified approach to handle subscription information
 * across both legacy (subscriptionTier) and new (subscription) patterns.
 */

export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'enterprise';

export interface SubscriptionInfo {
  tier?: SubscriptionTier | null;
  // room for future fields
}

export interface AppUser {
  id: string;
  email?: string | null;
  subscriptionTier?: SubscriptionTier | null; // legacy
  subscription?: SubscriptionInfo | null;     // new
}

/**
 * Get the user's subscription tier, handling both legacy and new patterns
 * @param user User object (may be null/undefined)
 * @returns SubscriptionTier, defaults to 'free'
 */
export function getUserTier(user: AppUser | null | undefined): SubscriptionTier {
  if (!user) return 'free';
  if (user.subscription?.tier) return user.subscription.tier;
  return user.subscriptionTier ?? 'free';
}

/**
 * Check if user has a specific subscription tier or higher
 * @param user User object
 * @param requiredTier Minimum required tier
 * @returns boolean indicating if user meets requirement
 */
export function hasSubscriptionTier(
  user: AppUser | null | undefined, 
  requiredTier: SubscriptionTier
): boolean {
  const userTier = getUserTier(user);
  const tierHierarchy: SubscriptionTier[] = ['free', 'pro', 'premium', 'enterprise'];
  const userIndex = tierHierarchy.indexOf(userTier);
  const requiredIndex = tierHierarchy.indexOf(requiredTier);
  return userIndex >= requiredIndex;
}

/**
 * Create a normalized user object for API calls
 * @param user Partial user data
 * @returns User object with normalized subscription fields
 */
export function normalizeUserSubscription(user: Partial<AppUser>): AppUser {
  const tier = getUserTier(user as AppUser);
  return {
    id: user.id || '',
    email: user.email,
    subscriptionTier: tier, // maintain legacy compatibility
    subscription: {
      tier,
    },
    ...user,
  };
}