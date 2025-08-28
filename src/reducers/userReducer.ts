/**
 * User State Reducer
 * Handles all user-related state mutations with type safety
 */

import type { UserState, UserAction } from '../types/app-state';
import { INITIAL_USER_STATE } from '../constants/initialDomainState';

export const userReducer = (
  state: UserState = INITIAL_USER_STATE,
  action: UserAction
): UserState => {
  switch (action.type) {
    // =============================================================================
    // AUTHENTICATION ACTIONS
    // =============================================================================
    case 'USER_LOGIN_START':
      return {
        ...state,
        auth: {
          ...state.auth,
          isLoading: true,
        },
        errors: {
          ...state.errors,
          authError: null,
        },
      };

    case 'USER_LOGIN_SUCCESS': {
      const { user, token, refreshToken } = action.payload;
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
      
      return {
        ...state,
        currentUser: user,
        auth: {
          isAuthenticated: true,
          isLoading: false,
          token,
          refreshToken,
          expiresAt,
          loginMethod: 'email', // Could be determined from payload in the future
        },
        activity: {
          ...state.activity,
          lastActive: new Date(),
          joinDate: state.activity.joinDate || new Date(),
        },
        errors: {
          ...state.errors,
          authError: null,
        },
      };
    }

    case 'USER_LOGIN_ERROR':
      return {
        ...state,
        auth: {
          ...state.auth,
          isLoading: false,
        },
        errors: {
          ...state.errors,
          authError: action.payload,
        },
      };

    case 'USER_LOGOUT':
      return {
        ...INITIAL_USER_STATE,
        // Preserve some settings even after logout
        preferences: state.preferences,
      };

    // =============================================================================
    // PROFILE ACTIONS
    // =============================================================================
    case 'USER_PROFILE_LOAD_START':
      return {
        ...state,
        loading: {
          ...state.loading,
          profile: true,
        },
        errors: {
          ...state.errors,
          profileLoadError: null,
        },
      };

    case 'USER_PROFILE_LOAD_SUCCESS':
      return {
        ...state,
        profile: action.payload,
        loading: {
          ...state.loading,
          profile: false,
        },
        errors: {
          ...state.errors,
          profileLoadError: null,
        },
      };

    case 'USER_PROFILE_LOAD_ERROR':
      return {
        ...state,
        loading: {
          ...state.loading,
          profile: false,
        },
        errors: {
          ...state.errors,
          profileLoadError: action.payload,
        },
      };

    // =============================================================================
    // PREFERENCES ACTIONS
    // =============================================================================
    case 'USER_PREFERENCES_UPDATE':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
        activity: {
          ...state.activity,
          lastActive: new Date(),
        },
      };

    // =============================================================================
    // ACHIEVEMENT ACTIONS
    // =============================================================================
    case 'USER_ACHIEVEMENT_UNLOCK': {
      const newAchievement = action.payload;
      const isAlreadyUnlocked = state.achievements.unlockedAchievements.some(
        achievement => achievement.id === newAchievement.id
      );

      if (isAlreadyUnlocked) {
        return state;
      }

      return {
        ...state,
        achievements: {
          ...state.achievements,
          unlockedAchievements: [
            ...state.achievements.unlockedAchievements,
            { ...newAchievement, unlockedAt: new Date() },
          ],
          availableAchievements: state.achievements.availableAchievements.filter(
            achievement => achievement.id !== newAchievement.id
          ),
          totalPoints: state.achievements.totalPoints + newAchievement.points,
          // Update level based on points (every 100 points = 1 level)
          currentLevel: Math.floor((state.achievements.totalPoints + newAchievement.points) / 100) + 1,
          progressToNextLevel: (state.achievements.totalPoints + newAchievement.points) % 100,
        },
        activity: {
          ...state.activity,
          lastActive: new Date(),
        },
      };
    }

    // =============================================================================
    // STREAK ACTIONS  
    // =============================================================================
    case 'USER_STREAK_UPDATE': {
      const { current, longest } = action.payload;
      return {
        ...state,
        activity: {
          ...state.activity,
          currentStreak: current,
          longestStreak: Math.max(longest, state.activity.longestStreak),
          lastActive: new Date(),
        },
      };
    }

    // =============================================================================
    // SOCIAL ACTIONS
    // =============================================================================
    case 'USER_FRIEND_REQUEST': {
      const friendRequest = action.payload;
      const isAlreadyFriend = state.social.friends.some(
        friend => friend.id === friendRequest.id
      );

      if (isAlreadyFriend) {
        return state;
      }

      return {
        ...state,
        social: {
          ...state.social,
          friends: [
            ...state.social.friends,
            { ...friendRequest, status: 'pending' },
          ],
        },
      };
    }

    case 'USER_FRIEND_ACCEPT': {
      const friendId = action.payload;
      return {
        ...state,
        social: {
          ...state.social,
          friends: state.social.friends.map(friend =>
            friend.id === friendId
              ? { ...friend, status: 'accepted' as const }
              : friend
          ),
        },
      };
    }

    case 'USER_CHALLENGE_JOIN': {
      const challenge = action.payload;
      const isAlreadyJoined = state.social.challenges.some(
        existingChallenge => existingChallenge.id === challenge.id
      );

      if (isAlreadyJoined) {
        return state;
      }

      return {
        ...state,
        social: {
          ...state.social,
          challenges: [...state.social.challenges, challenge],
        },
      };
    }

    // =============================================================================
    // DEFAULT CASE
    // =============================================================================
    default:
      return state;
  }
};