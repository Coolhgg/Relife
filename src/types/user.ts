/**
 * Central User Types and Subscription Helpers
 * This file provides a unified approach to handle subscription information
 * across both legacy (subscriptionTier) and new (subscription) patterns.
 */

import type { User } from './index';
import type { SubscriptionTier, Subscription } from './premium';

export interface SubscriptionInfo {
  tier?: SubscriptionTier | null;
  // room for future fields
}

export interface AppUser {
  id: string;
  email?: string | null;
  subscriptionTier?: SubscriptionTier | null; // legacy
  subscription?: SubscriptionInfo | null; // new
}

// Re-export types for convenience
export type { SubscriptionTier, Subscription, User };

/**
 * Get the user's subscription tier, handling both legacy and new patterns
 * @param user User object (may be null/undefined)
 * @returns SubscriptionTier, defaults to 'free'
 */
export function getUserTier(
  _user: User | AppUser | null | undefined
): SubscriptionTier {
  if (!_user) return 'free';
  if (_user.subscription?.tier) return user.subscription.tier;
  return user.subscriptionTier ?? 'free';
}

/**
 * Check if user has a specific subscription tier or higher
 * @param user User object
 * @param requiredTier Minimum required tier
 * @returns boolean indicating if user meets requirement
 */
export function hasSubscriptionTier(
  _user: User | AppUser | null | undefined,
  requiredTier: SubscriptionTier
): boolean {
  const userTier = getUserTier(_user);
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
export function normalizeUserSubscription(_user: Partial<User | AppUser>): User {
  const tier = getUserTier(_user as User);
  const baseUser = user as User;
  return {
    ...baseUser,
    id: user.id || '',
    email: user.email || '',
    subscriptionTier: tier, // maintain legacy compatibility
    subscription: baseUser.subscription || {
      id: baseUser.subscription?.id || 'sub_' + Date.now(),
      userId: user.id || '',
      tier,
      status: 'active' as any,
      billingInterval: 'month' as any,
      amount: 999,
      currency: 'usd',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  } as User;
}

/**
 * Check if user is on a premium tier (not free)
 * @param user User object
 * @returns boolean indicating if user has premium access
 */
export function isPremiumUser(_user: User | AppUser | null | undefined): boolean {
  const tier = getUserTier(_user);
  return tier !== 'free';
}

/**
 * Get subscription status from user object
 * @param user User object
 * @returns subscription status or 'inactive' if no subscription
 */
export function getSubscriptionStatus(
  _user: User | AppUser | null | undefined
): string {
  if (!_user) return 'inactive';
  if ('subscription' in user && _user.subscription) {
    return (_user.subscription as Subscription).status || 'active';
  }
  return isPremiumUser(_user) ? 'active' : 'inactive';
}
