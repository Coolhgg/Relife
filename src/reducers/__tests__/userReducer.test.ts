/**
 * Integration tests for UserReducer
 * Tests that the reducer handles typed payloads correctly
 */

import { userReducer } from '../userReducer';
import { INITIAL_USER_STATE } from '../../constants/initialDomainState';
import type { UserState, UserAction } from '../../types/app-state';
import type { User } from '../../types/domain';

describe('UserReducer Integration Tests', () => {
  let initialState: UserState;

  beforeEach(() => {
    initialState = INITIAL_USER_STATE;
  });

  describe('User Authentication', () => {
    it('should handle USER_LOGIN_SUCCESS with typed user payload', () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: null,
        subscriptionTier: 'free',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        lastLoginAt: new Date('2024-01-02T08:00:00Z'),
        emailVerified: true,
        phoneVerified: false,
        twoFactorEnabled: false,
        
        // Preferences
        preferences: {
          theme: 'dark',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: true,
            sms: false,
            inApp: true
          },
          accessibility: {
            screenReader: false,
            highContrast: false,
            reducedMotion: false,
            fontSize: 'medium'
          }
        },

        // Privacy settings
        privacy: {
          profileVisible: true,
          showActivity: false,
          allowFriendRequests: true,
          shareAchievements: true
        },

        // Activity data
        activity: {
          totalAlarms: 0,
          alarmsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalSnoozes: 0,
          averageWakeTime: null,
          lastActive: new Date()
        },

        // Achievements
        achievements: {
          unlocked: [],
          progress: {},
          points: 0,
          level: 1,
          nextLevelPoints: 100
        },

        // Social
        social: {
          friends: [],
          pendingRequests: [],
          blockedUsers: []
        }
      };

      const action: UserAction = {
        type: 'USER_LOGIN_SUCCESS',
        payload: { user: mockUser }
      };

      const newState = userReducer(initialState, action);

      expect(newState.isAuthenticated).toBe(true);
      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBeNull();
      expect(newState.currentUser).toEqual(mockUser);
    });

    it('should handle USER_LOGIN_ERROR with typed error payload', () => {
      const action: UserAction = {
        type: 'USER_LOGIN_ERROR',
        payload: { error: 'Invalid credentials' }
      };

      const newState = userReducer(initialState, action);

      expect(newState.isAuthenticated).toBe(false);
      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBe('Invalid credentials');
      expect(newState.currentUser).toBeNull();
    });

    it('should handle USER_LOGOUT correctly', () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: null,
        subscriptionTier: 'premium',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: true,
        phoneVerified: false,
        twoFactorEnabled: false,
        preferences: {
          theme: 'dark',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: true,
            sms: false,
            inApp: true
          },
          accessibility: {
            screenReader: false,
            highContrast: false,
            reducedMotion: false,
            fontSize: 'medium'
          }
        },
        privacy: {
          profileVisible: true,
          showActivity: false,
          allowFriendRequests: true,
          shareAchievements: true
        },
        activity: {
          totalAlarms: 10,
          alarmsCompleted: 8,
          currentStreak: 5,
          longestStreak: 12,
          totalSnoozes: 3,
          averageWakeTime: '06:30',
          lastActive: new Date()
        },
        achievements: {
          unlocked: ['early-bird', 'consistent'],
          progress: {},
          points: 500,
          level: 5,
          nextLevelPoints: 600
        },
        social: {
          friends: [],
          pendingRequests: [],
          blockedUsers: []
        }
      };

      const authenticatedState: UserState = {
        ...initialState,
        isAuthenticated: true,
        currentUser: mockUser
      };

      const action: UserAction = {
        type: 'USER_LOGOUT',
        payload: {}
      };

      const newState = userReducer(authenticatedState, action);

      expect(newState.isAuthenticated).toBe(false);
      expect(newState.currentUser).toBeNull();
      expect(newState.error).toBeNull();
    });
  });

  describe('User Profile Updates', () => {
    it('should handle USER_PREFERENCES_UPDATE with typed preferences payload', () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: null,
        subscriptionTier: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: true,
        phoneVerified: false,
        twoFactorEnabled: false,
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: true,
            sms: false,
            inApp: true
          },
          accessibility: {
            screenReader: false,
            highContrast: false,
            reducedMotion: false,
            fontSize: 'medium'
          }
        },
        privacy: {
          profileVisible: true,
          showActivity: false,
          allowFriendRequests: true,
          shareAchievements: true
        },
        activity: {
          totalAlarms: 0,
          alarmsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalSnoozes: 0,
          averageWakeTime: null,
          lastActive: new Date()
        },
        achievements: {
          unlocked: [],
          progress: {},
          points: 0,
          level: 1,
          nextLevelPoints: 100
        },
        social: {
          friends: [],
          pendingRequests: [],
          blockedUsers: []
        }
      };

      const authenticatedState: UserState = {
        ...initialState,
        isAuthenticated: true,
        currentUser: mockUser
      };

      const newPreferences = {
        theme: 'dark' as const,
        language: 'es' as const,
        timezone: 'America/New_York',
        notifications: {
          email: false,
          push: true,
          sms: true,
          inApp: false
        },
        accessibility: {
          screenReader: true,
          highContrast: true,
          reducedMotion: true,
          fontSize: 'large' as const
        }
      };

      const action: UserAction = {
        type: 'USER_PREFERENCES_UPDATE',
        payload: { preferences: newPreferences }
      };

      const newState = userReducer(authenticatedState, action);

      expect(newState.currentUser?.preferences).toEqual(newPreferences);
      expect(newState.currentUser?.updatedAt).toBeDefined();
    });
  });

  describe('Achievement System', () => {
    it('should handle USER_ACHIEVEMENT_UNLOCK with typed achievement payload', () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: null,
        subscriptionTier: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: true,
        phoneVerified: false,
        twoFactorEnabled: false,
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          notifications: { email: true, push: true, sms: false, inApp: true },
          accessibility: { screenReader: false, highContrast: false, reducedMotion: false, fontSize: 'medium' }
        },
        privacy: { profileVisible: true, showActivity: false, allowFriendRequests: true, shareAchievements: true },
        activity: { totalAlarms: 0, alarmsCompleted: 0, currentStreak: 0, longestStreak: 0, totalSnoozes: 0, averageWakeTime: null, lastActive: new Date() },
        achievements: {
          unlocked: [],
          progress: {},
          points: 50,
          level: 1,
          nextLevelPoints: 100
        },
        social: { friends: [], pendingRequests: [], blockedUsers: [] }
      };

      const authenticatedState: UserState = {
        ...initialState,
        isAuthenticated: true,
        currentUser: mockUser
      };

      const action: UserAction = {
        type: 'USER_ACHIEVEMENT_UNLOCK',
        payload: { 
          achievement: 'early-bird',
          points: 50
        }
      };

      const newState = userReducer(authenticatedState, action);

      expect(newState.currentUser?.achievements.unlocked).toContain('early-bird');
      expect(newState.currentUser?.achievements.points).toBe(100);
      expect(newState.currentUser?.achievements.level).toBe(1); // Should remain 1 since 100 points = level 1
    });

    it('should handle USER_STREAK_UPDATE with typed streak payload', () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: null,
        subscriptionTier: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: true,
        phoneVerified: false,
        twoFactorEnabled: false,
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          notifications: { email: true, push: true, sms: false, inApp: true },
          accessibility: { screenReader: false, highContrast: false, reducedMotion: false, fontSize: 'medium' }
        },
        privacy: { profileVisible: true, showActivity: false, allowFriendRequests: true, shareAchievements: true },
        activity: {
          totalAlarms: 10,
          alarmsCompleted: 8,
          currentStreak: 3,
          longestStreak: 5,
          totalSnoozes: 2,
          averageWakeTime: '06:30',
          lastActive: new Date()
        },
        achievements: {
          unlocked: [],
          progress: {},
          points: 0,
          level: 1,
          nextLevelPoints: 100
        },
        social: { friends: [], pendingRequests: [], blockedUsers: [] }
      };

      const authenticatedState: UserState = {
        ...initialState,
        isAuthenticated: true,
        currentUser: mockUser
      };

      const action: UserAction = {
        type: 'USER_STREAK_UPDATE',
        payload: { 
          currentStreak: 7,
          longestStreak: 7
        }
      };

      const newState = userReducer(authenticatedState, action);

      expect(newState.currentUser?.activity.currentStreak).toBe(7);
      expect(newState.currentUser?.activity.longestStreak).toBe(7);
    });
  });
});