/**
 * Extensions to AppState interface to provide flattened properties expected by App.tsx
 * This provides backward compatibility while maintaining the nested structure
 */

import type { Alarm, UserFriend, AppState as BaseAppState } from './index';

// Type augmentation to add expected properties to AppState
declare module './app-state' {
  interface AppState {
    // Flattened properties for component compatibility
    activeAlarm: Alarm | null;
    permissions: {
      notifications: { granted: boolean };
      location: { granted: boolean };
      camera: { granted: boolean };
      microphone: { granted: boolean };
    };
    currentView: 'dashboard' | 'alarms' | 'settings' | 'profile' | 'subscription' | 'gaming' | 'advanced-scheduling' | 'pricing' | 'gift-shop';
    rewardSystem: {
      points: number;
      level: number;
      experience: number;
      streakDays: number;
      unlockedRewards: string[];
    };
    activeBattles: Record<string, string>; // alarmId -> battleId mapping
    friends: UserFriend[];
    isOnboarding: boolean;
  }
}

export {};