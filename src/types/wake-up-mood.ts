/**
 * Central WakeUpMood Enum and Types
 * This file provides a unified wake-up mood system that supports
 * all mood values used throughout the application.
 */

export enum WakeUpMood {
  Calm = 'calm',
  Focused = 'focused',
  Energetic = 'energetic',
  Groggy = 'groggy',
  Stressed = 'stressed',

  // Additional moods from usage analysis
  Excellent = 'excellent',
  Good = 'good',
  Okay = 'okay',
  Neutral = 'neutral',
  Grumpy = 'grumpy',
  Peaceful = 'peaceful',
  Motivated = 'motivated',
  Refreshed = 'refreshed',
  Tired = 'tired',
  Irritated = 'irritated',
  Anxious = 'anxious',
}

// Type alias for compatibility
export type Mood = WakeUpMood;

// Helper function to validate mood values
export function isValidWakeUpMood(mood: string): mood is keyof typeof WakeUpMood {
  return Object.values(WakeUpMood).includes(mood as WakeUpMood);
}

// Helper function to normalize mood strings to enum values
export function normalizeWakeUpMood(mood: string): WakeUpMood {
  if (isValidWakeUpMood(mood)) {
    return WakeUpMood[mood as keyof typeof WakeUpMood];
  }

  // Fallback for invalid moods
  return WakeUpMood.Neutral;
}
