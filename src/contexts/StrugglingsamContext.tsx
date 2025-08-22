import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  UserStreak,
  SamAchievement,
  SocialChallenge,
  SmartUpgradePrompt,
  HabitCelebration,
  ABTestGroup,
  UserABTest,
  CommunityStats,
  SocialProofData,
  ABTestContext,
} from '../types/struggling-sam';

// State interface
interface StrugglingSamState {
  // User data
  userStreak: UserStreak | null;
  achievements: SamAchievement[];
  activeChallenges: SocialChallenge[];
  upgradePrompts: SmartUpgradePrompt[];
  pendingCelebrations: HabitCelebration[];

  // Community data
  communityStats: CommunityStats | null;
  socialProofData: SocialProofData[];

  // A/B Testing
  currentTestGroup: ABTestGroup | null;
  userABTest: UserABTest | null;

  // UI State
  loading: boolean;
  error: string | null;
}

// Action types
type StrugglingSamAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER_STREAK'; payload: UserStreak }
  | {
      type: 'UPDATE_STREAK';
      payload: { currentStreak: number; longestStreak?: number };
    }
  | { type: 'ADD_ACHIEVEMENT'; payload: SamAchievement }
  | {
      type: 'UPDATE_ACHIEVEMENT';
      payload: { id: string; updates: Partial<SamAchievement> };
    }
  | { type: 'SET_ACHIEVEMENTS'; payload: SamAchievement[] }
  | { type: 'SET_ACTIVE_CHALLENGES'; payload: SocialChallenge[] }
  | { type: 'JOIN_CHALLENGE'; payload: string }
  | { type: 'LEAVE_CHALLENGE'; payload: string }
  | { type: 'ADD_UPGRADE_PROMPT'; payload: SmartUpgradePrompt }
  | { type: 'DISMISS_UPGRADE_PROMPT'; payload: string }
  | { type: 'SET_COMMUNITY_STATS'; payload: CommunityStats }
  | { type: 'SET_SOCIAL_PROOF_DATA'; payload: SocialProofData[] }
  | { type: 'ADD_CELEBRATION'; payload: HabitCelebration }
  | { type: 'DISMISS_CELEBRATION'; payload: string }
  | { type: 'SET_AB_TEST_GROUP'; payload: ABTestGroup }
  | { type: 'SET_USER_AB_TEST'; payload: UserABTest }
  | { type: 'TRACK_CONVERSION'; payload: { testId: string; userId: string } }
  | {
      type: 'TRACK_ENGAGEMENT';
      payload: { testId: string; userId: string; action: string };
    };

// Initial state
const initialState: StrugglingSamState = {
  userStreak: null,
  achievements: [],
  activeChallenges: [],
  upgradePrompts: [],
  pendingCelebrations: [],
  communityStats: null,
  socialProofData: [],
  currentTestGroup: null,
  userABTest: null,
  loading: false,
  error: null,
};

// Reducer
const strugglingSamReducer = (
  state: StrugglingSamState,
  action: StrugglingSamAction
): StrugglingSamState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_USER_STREAK':
      return { ...state, userStreak: action.payload };

    case 'UPDATE_STREAK':
      return {
        ...state,
        userStreak: state.userStreak
          ? {
              ...state.userStreak,
              currentStreak: action.payload.currentStreak,
              longestStreak:
                action.payload.longestStreak || state.userStreak.longestStreak,
              updatedAt: new Date(),
            }
          : null,
      };

    case 'ADD_ACHIEVEMENT':
      return {
        ...state,
        achievements: [...state.achievements, action.payload],
      };

    case 'UPDATE_ACHIEVEMENT':
      return {
        ...state,
        achievements: state.achievements.map(achievement =>
          achievement.id === action.payload.id
            ? { ...achievement, ...action.payload.updates }
            : achievement
        ),
      };

    case 'SET_ACHIEVEMENTS':
      return { ...state, achievements: action.payload };

    case 'SET_ACTIVE_CHALLENGES':
      return { ...state, activeChallenges: action.payload };

    case 'JOIN_CHALLENGE':
      // This would be handled by the API call, but we can update local state
      return state;

    case 'LEAVE_CHALLENGE':
      // This would be handled by the API call, but we can update local state
      return state;

    case 'ADD_UPGRADE_PROMPT':
      return {
        ...state,
        upgradePrompts: [...state.upgradePrompts, action.payload],
      };

    case 'DISMISS_UPGRADE_PROMPT':
      return {
        ...state,
        upgradePrompts: state.upgradePrompts.filter(
          prompt => prompt.id !== action.payload
        ),
      };

    case 'SET_COMMUNITY_STATS':
      return { ...state, communityStats: action.payload };

    case 'SET_SOCIAL_PROOF_DATA':
      return { ...state, socialProofData: action.payload };

    case 'ADD_CELEBRATION':
      return {
        ...state,
        pendingCelebrations: [...state.pendingCelebrations, action.payload],
      };

    case 'DISMISS_CELEBRATION':
      return {
        ...state,
        pendingCelebrations: state.pendingCelebrations.filter(
          celebration => celebration.id !== action.payload
        ),
      };

    case 'SET_AB_TEST_GROUP':
      return { ...state, currentTestGroup: action.payload };

    case 'SET_USER_AB_TEST':
      return { ...state, userABTest: action.payload };

    case 'TRACK_CONVERSION':
      // Handle conversion tracking
      return state;

    case 'TRACK_ENGAGEMENT':
      // Handle engagement tracking
      return state;

    default:
      return state;
  }
};

// Context interface
interface StrugglingSamContextType extends StrugglingSamState, ABTestContext {
  // Actions
  updateStreak: (streakData: { currentStreak: number; longestStreak?: number }) => void;
  unlockAchievement: (achievement: SamAchievement) => void;
  shareAchievement: (achievementId: string) => void;
  joinChallenge: (challengeId: string) => void;
  leaveChallenge: (challengeId: string) => void;
  showUpgradePrompt: (prompt: SmartUpgradePrompt) => void;
  dismissUpgradePrompt: (promptId: string) => void;
  celebrateMilestone: (celebration: HabitCelebration) => void;
  dismissCelebration: (celebrationId: string) => void;
  loadUserData: (userId: string) => Promise<void>;
  refreshCommunityStats: () => Promise<void>;

  // A/B Testing methods
  currentTests: ABTestGroup[];
  userAssignments: UserABTest[];
  isFeatureEnabled: (featureId: string) => boolean;
  getFeatureVariant: (featureId: string) => string | null;
  trackConversion: (testId: string, userId: string) => void;
  trackEngagement: (testId: string, userId: string, action: string) => void;
}

// Create contexts
const StrugglingSamContext = createContext<StrugglingSamContextType | undefined>(
  undefined
);

// Context provider component
export const StrugglingSamProvider: React.FC<{
  children: React.ReactNode;
  userId?: string;
}> = ({ children, userId }) => {
  const [state, dispatch] = useReducer(strugglingSamReducer, initialState);

  // Initialize user data when userId changes
  useEffect(() => {
    if (userId) {
      loadUserData(userId);
    }
  }, [userId]);

  // Load user data from API
  const loadUserData = async (userId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // In a real app, these would be API calls
      // For now, we'll create mock data
      const mockUserStreak: UserStreak = {
        id: `streak-${userId}`,
        userId,
        currentStreak: 5,
        longestStreak: 12,
        lastWakeUpDate: new Date().toISOString().split('T')[0],
        streakType: 'daily_wakeup',
        freezesUsed: 0,
        maxFreezes: 3,
        multiplier: 1.2,
        milestones: [],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updatedAt: new Date(),
      };

      dispatch({ type: 'SET_USER_STREAK', payload: mockUserStreak });

      // Load achievements
      const mockAchievements: SamAchievement[] = [
        {
          id: `achievement-1-${userId}`,
          userId,
          achievementType: 'early_bird',
          title: 'Early Bird',
          description: 'Wake up 5 consecutive days at your alarm time',
          iconUrl: '🌅',
          rarity: 'common',
          unlockedAt: new Date(),
          shared: false,
          progress: { current: 5, target: 5, percentage: 100 },
          requirements: [
            { type: 'streak_days', value: 5, description: 'Maintain 5-day streak' },
          ],
          socialProofText: 'Just unlocked the Early Bird achievement! 🌅',
        },
      ];

      dispatch({ type: 'SET_ACHIEVEMENTS', payload: mockAchievements });

      // Load community stats
      await refreshCommunityStats();

      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load user data' });
    }
  };

  // Refresh community stats
  const refreshCommunityStats = async () => {
    try {
      // Mock community stats
      const mockCommunityStats: CommunityStats = {
        totalUsers: 15420,
        activeToday: 2847,
        totalStreaks: 8923,
        averageStreak: 12.5,
        achievementsUnlocked: 24658,
        challengesActive: 15,
        successRate: 0.76,
        lastUpdated: new Date(),
        realtimeActivity: [
          {
            id: '1',
            type: 'achievement_unlocked',
            message: 'Sarah just unlocked Morning Champion! 🏆',
            timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
            anonymous: false,
          },
          {
            id: '2',
            type: 'streak_started',
            message: 'Mike started a new 7-day streak! 🔥',
            timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
            anonymous: false,
          },
        ],
      };

      dispatch({ type: 'SET_COMMUNITY_STATS', payload: mockCommunityStats });

      // Mock social proof data
      const mockSocialProofData: SocialProofData[] = [
        {
          id: '1',
          type: 'user_count',
          content: '47 people started their morning routine in the last hour',
          timestamp: new Date(),
          isRealTime: true,
          userSegment: 'struggling_sam',
          engagement: {
            views: 1243,
            clicks: 89,
            shares: 12,
            conversionRate: 0.15,
            lastUpdated: new Date(),
          },
        },
      ];

      dispatch({ type: 'SET_SOCIAL_PROOF_DATA', payload: mockSocialProofData });
    } catch (error) {
      console.error('Failed to refresh community stats:', error);
    }
  };

  // Update streak
  const updateStreak = (streakData: {
    currentStreak: number;
    longestStreak?: number;
  }) => {
    dispatch({ type: 'UPDATE_STREAK', payload: streakData });

    // Check for milestone celebrations
    const currentStreak = streakData.currentStreak;
    const milestones = [3, 7, 14, 21, 30, 50, 100];

    if (milestones.includes(currentStreak)) {
      const celebration: HabitCelebration = {
        id: `celebration-${Date.now()}`,
        userId: userId || '',
        celebrationType: 'streak_milestone',
        trigger: {
          type: 'streak_reached',
          value: currentStreak,
          context: { streakDays: currentStreak },
        },
        title: `${currentStreak}-Day Streak!`,
        message: `Congratulations! You've reached a ${currentStreak}-day streak! 🎉`,
        animation: {
          type: 'confetti',
          duration: 3000,
          intensity: 'moderate',
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'],
        },
        rewards: [
          {
            type: 'badge',
            value: `${currentStreak}-Day Warrior`,
            description: `Earned for reaching ${currentStreak} consecutive days`,
            immediate: true,
          },
        ],
        socialShare: {
          enabled: true,
          defaultMessage: `I just reached a ${currentStreak}-day morning routine streak with Relife! 🔥`,
          hashtags: ['#MorningHabit', '#StreakSuccess', '#Relife'],
          platforms: ['twitter', 'facebook'],
        },
        isShown: false,
        createdAt: new Date(),
      };

      dispatch({ type: 'ADD_CELEBRATION', payload: celebration });
    }
  };

  // Unlock achievement
  const unlockAchievement = (achievement: SamAchievement) => {
    dispatch({ type: 'ADD_ACHIEVEMENT', payload: achievement });

    // Create celebration for achievement unlock
    const celebration: HabitCelebration = {
      id: `celebration-achievement-${Date.now()}`,
      userId: userId || '',
      celebrationType: 'achievement_unlock',
      trigger: {
        type: 'achievement_earned',
        value: 1,
        context: { achievementType: achievement.achievementType },
      },
      title: 'Achievement Unlocked!',
      message: `You've unlocked: ${achievement.title}! ${achievement.iconUrl}`,
      animation: {
        type: 'fireworks',
        duration: 4000,
        intensity: 'intense',
        colors: ['#FFD700', '#FFA500', '#FF69B4'],
      },
      rewards: [
        {
          type: 'badge',
          value: achievement.title,
          description: achievement.description,
          immediate: true,
        },
      ],
      socialShare: {
        enabled: true,
        defaultMessage: `Just unlocked the ${achievement.title} achievement in Relife! ${achievement.iconUrl}`,
        hashtags: ['#Achievement', '#Relife', '#MorningSuccess'],
        platforms: ['twitter', 'facebook', 'linkedin'],
      },
      isShown: false,
      createdAt: new Date(),
    };

    dispatch({ type: 'ADD_CELEBRATION', payload: celebration });
  };

  // Share achievement
  const shareAchievement = (achievementId: string) => {
    dispatch({
      type: 'UPDATE_ACHIEVEMENT',
      payload: { id: achievementId, updates: { shared: true } },
    });
  };

  // Join challenge
  const joinChallenge = (challengeId: string) => {
    dispatch({ type: 'JOIN_CHALLENGE', payload: challengeId });
  };

  // Leave challenge
  const leaveChallenge = (challengeId: string) => {
    dispatch({ type: 'LEAVE_CHALLENGE', payload: challengeId });
  };

  // Show upgrade prompt
  const showUpgradePrompt = (prompt: SmartUpgradePrompt) => {
    dispatch({ type: 'ADD_UPGRADE_PROMPT', payload: prompt });
  };

  // Dismiss upgrade prompt
  const dismissUpgradePrompt = (promptId: string) => {
    dispatch({ type: 'DISMISS_UPGRADE_PROMPT', payload: promptId });
  };

  // Celebrate milestone
  const celebrateMilestone = (celebration: HabitCelebration) => {
    dispatch({ type: 'ADD_CELEBRATION', payload: celebration });
  };

  // Dismiss celebration
  const dismissCelebration = (celebrationId: string) => {
    dispatch({ type: 'DISMISS_CELEBRATION', payload: celebrationId });
  };

  // A/B Testing methods
  const isFeatureEnabled = (featureId: string): boolean => {
    if (!state.currentTestGroup || !state.userABTest) return false;

    const feature = state.currentTestGroup.features.find(
      f => f.featureId === featureId
    );
    return feature?.enabled || false;
  };

  const getFeatureVariant = (featureId: string): string | null => {
    if (!state.currentTestGroup) return null;

    const feature = state.currentTestGroup.features.find(
      f => f.featureId === featureId
    );
    return feature?.variant || null;
  };

  const trackConversion = (testId: string, userId: string) => {
    dispatch({ type: 'TRACK_CONVERSION', payload: { testId, userId } });
  };

  const trackEngagement = (testId: string, userId: string, action: string) => {
    dispatch({ type: 'TRACK_ENGAGEMENT', payload: { testId, userId, action } });
  };

  const contextValue: StrugglingSamContextType = {
    ...state,
    // Actions
    updateStreak,
    unlockAchievement,
    shareAchievement,
    joinChallenge,
    leaveChallenge,
    showUpgradePrompt,
    dismissUpgradePrompt,
    celebrateMilestone,
    dismissCelebration,
    loadUserData,
    refreshCommunityStats,

    // A/B Testing
    currentTests: state.currentTestGroup ? [state.currentTestGroup] : [],
    userAssignments: state.userABTest ? [state.userABTest] : [],
    isFeatureEnabled,
    getFeatureVariant,
    trackConversion,
    trackEngagement,
  };

  return (
    <StrugglingSamContext.Provider value={contextValue}>
      {children}
    </StrugglingSamContext.Provider>
  );
};

// Custom hook to use the context
export const useStrugglingSam = () => {
  const context = useContext(StrugglingSamContext);
  if (context === undefined) {
    throw new Error('useStrugglingSam must be used within a StrugglingSamProvider');
  }
  return context;
};

export default StrugglingSamContext;
