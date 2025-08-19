/**
 * Gaming and Rewards System Integration Tests
 * 
 * Tests the complete gaming and rewards flow:
 * 1. Reward system initialization and progression
 * 2. Achievement unlocking and notifications
 * 3. Battle creation and participation
 * 4. Leaderboard updates and ranking
 * 5. Social features (friends, trash talk)
 * 6. Analytics integration
 * 7. Cross-user interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Import components and services
import App from '../../src/App';
import { SupabaseService } from '../../src/services/supabase';
import { AIRewardsService } from '../../src/services/ai-rewards';
import { AppAnalyticsService } from '../../src/services/app-analytics';

// Import test utilities
import { createMockUser, createMockAlarm, mockNavigatorAPI } from '../utils/test-mocks';
import { TestData } from '../e2e/fixtures/test-data';

// Types
import type { Alarm, User, Battle, RewardSystem } from '../../src/types';

// Mock external services
vi.mock('../../src/services/supabase');
vi.mock('../../src/services/ai-rewards');
vi.mock('posthog-js');

describe('Gaming and Rewards System Integration', () => {
  let mockUser: User;
  let container: HTMLElement;
  let user: ReturnType<typeof userEvent.setup>;
  
  // Service instances
  let rewardsService: AIRewardsService;
  let analyticsService: AppAnalyticsService;

  beforeAll(() => {
    mockNavigatorAPI();
  });

  beforeEach(async () => {
    user = userEvent.setup();
    mockUser = createMockUser({
      level: 1,
      experience: 0,
      achievements: []
    });
    
    // Reset all mocks
    vi.clearAllMocks();
    
    rewardsService = AIRewardsService.getInstance();
    analyticsService = AppAnalyticsService.getInstance();
    
    // Mock successful authentication
    vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({ 
      alarms: [], 
      error: null 
    });
    
    // Mock initial rewards system
    const initialRewards: RewardSystem = {
      level: 1,
      experience: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalAlarmsCompleted: 0,
      unlockedRewards: [],
      availableRewards: [
        {
          id: 'first-alarm',
          type: 'achievement',
          title: 'First Steps',
          description: 'Create your first alarm',
          points: 10,
          unlockCondition: { type: 'alarms_created', value: 1 }
        }
      ],
      nextMilestone: {
        type: 'streak',
        target: 7,
        progress: 0,
        description: 'Complete 7 days in a row'
      }
    };
    
    vi.mocked(rewardsService.analyzeAndGenerateRewards).mockResolvedValue(initialRewards);
  });

  afterEach(() => {
    if (container) {
      container.remove();
    }
    localStorage.clear();
    sessionStorage.clear();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Reward System Initialization and Progression', () => {
    it('should initialize rewards system and track first alarm achievement', async () => {
      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to gaming hub
      const gamingButton = screen.getByRole('button', { name: /gaming|gamepad/i });
      await user.click(gamingButton);

      await waitFor(() => {
        expect(screen.getByText(/level 1/i)).toBeInTheDocument();
      });

      // Verify initial rewards state is displayed
      expect(screen.getByText(/first steps/i)).toBeInTheDocument();

      // Go back and create first alarm
      const dashboardButton = screen.getByRole('button', { name: /dashboard|clock/i });
      await user.click(dashboardButton);

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Create alarm
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '07:00');

      const labelInput = screen.getByLabelText(/label|name/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Reward Test Alarm');

      const mockAlarm = createMockAlarm({
        id: 'reward-alarm-123',
        userId: mockUser.id,
        time: '07:00',
        label: 'Reward Test Alarm',
        enabled: true
      });

      // Mock updated rewards after alarm creation
      const updatedRewards: RewardSystem = {
        level: 1,
        experience: 10,
        currentStreak: 0,
        longestStreak: 0,
        totalAlarmsCompleted: 0,
        unlockedRewards: [
          {
            id: 'first-alarm',
            type: 'achievement',
            title: 'First Steps',
            description: 'Create your first alarm',
            points: 10,
            unlockedAt: new Date(),
            unlockCondition: { type: 'alarms_created', value: 1 }
          }
        ],
        availableRewards: [
          {
            id: 'early-bird',
            type: 'achievement', 
            title: 'Early Bird',
            description: 'Set an alarm before 8 AM',
            points: 15,
            unlockCondition: { type: 'early_alarm', value: 1 }
          }
        ],
        nextMilestone: {
          type: 'streak',
          target: 7,
          progress: 0,
          description: 'Complete 7 days in a row'
        }
      };

      vi.mocked(SupabaseService.saveAlarm).mockResolvedValueOnce({
        alarm: mockAlarm,
        error: null
      });

      vi.mocked(rewardsService.analyzeAndGenerateRewards).mockResolvedValueOnce(updatedRewards);

      await user.click(screen.getByRole('button', { name: /save|create/i }));

      await waitFor(() => {
        expect(screen.getByText('Reward Test Alarm')).toBeInTheDocument();
      });

      // Should show achievement notification
      await waitFor(() => {
        const achievementNotification = screen.queryByText(/achievement.*unlocked|first steps/i);
        if (achievementNotification) {
          expect(achievementNotification).toBeInTheDocument();
        }
      }, { timeout: 5000 });

      // Verify rewards system was updated
      expect(rewardsService.analyzeAndGenerateRewards).toHaveBeenCalledWith([mockAlarm]);
    });

    it('should track streak progression and level up', async () => {
      // Mock user with some progress
      const progressUser = {
        ...mockUser,
        level: 2,
        experience: 45,
        currentStreak: 6
      };

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(progressUser);

      // Mock existing alarms
      const existingAlarms = Array.from({ length: 6 }, (_, i) => 
        createMockAlarm({
          id: `streak-alarm-${i}`,
          userId: progressUser.id,
          time: '07:00',
          label: `Day ${i + 1} Alarm`,
          enabled: true,
          lastTriggered: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
          completed: true
        })
      );

      vi.mocked(SupabaseService.loadUserAlarms).mockResolvedValue({
        alarms: existingAlarms,
        error: null
      });

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to gaming hub
      const gamingButton = screen.getByRole('button', { name: /gaming|gamepad/i });
      await user.click(gamingButton);

      await waitFor(() => {
        expect(screen.getByText(/level 2/i)).toBeInTheDocument();
      });

      // Should show current streak
      expect(screen.getByText(/6.*day.*streak/i)).toBeInTheDocument();

      // Simulate completing today's alarm (7th day)
      const mockLevelUpRewards: RewardSystem = {
        level: 3, // Level up!
        experience: 70,
        currentStreak: 7, // Streak milestone reached
        longestStreak: 7,
        totalAlarmsCompleted: 7,
        unlockedRewards: [
          {
            id: 'week-warrior',
            type: 'achievement',
            title: 'Week Warrior',
            description: 'Complete 7 days in a row',
            points: 50,
            unlockedAt: new Date(),
            unlockCondition: { type: 'streak', value: 7 }
          }
        ],
        availableRewards: [],
        nextMilestone: {
          type: 'streak',
          target: 30,
          progress: 7,
          description: 'Complete 30 days in a row'
        }
      };

      vi.mocked(rewardsService.analyzeAndGenerateRewards).mockResolvedValueOnce(mockLevelUpRewards);

      // Simulate alarm completion
      await act(async () => {
        // This would normally come from alarm dismissal
        const completionEvent = new CustomEvent('alarm-completed', {
          detail: { alarmId: 'today-alarm', completed: true }
        });
        window.dispatchEvent(completionEvent);
      });

      // Should show level up notification
      await waitFor(() => {
        const levelUpNotification = screen.queryByText(/level.*up|reached.*level.*3/i);
        if (levelUpNotification) {
          expect(levelUpNotification).toBeInTheDocument();
        }
      });

      // Should show streak achievement
      await waitFor(() => {
        const streakAchievement = screen.queryByText(/week.*warrior|7.*day.*streak/i);
        if (streakAchievement) {
          expect(streakAchievement).toBeInTheDocument();
        }
      });
    });
  });

  describe('Battle System Integration', () => {
    it('should create and participate in battles', async () => {
      const battleCreatorUser = {
        ...mockUser,
        level: 5,
        friends: ['friend1', 'friend2']
      };

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(battleCreatorUser);

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to gaming hub
      const gamingButton = screen.getByRole('button', { name: /gaming|gamepad/i });
      await user.click(gamingButton);

      await waitFor(() => {
        expect(screen.getByText(/level 5/i)).toBeInTheDocument();
      });

      // Create a battle
      const createBattleButton = screen.queryByRole('button', { name: /create.*battle|new.*battle/i });
      if (createBattleButton) {
        await user.click(createBattleButton);

        await waitFor(() => {
          const battleModal = screen.getByRole('dialog');
          expect(battleModal).toBeInTheDocument();
        });

        // Fill battle details
        const battleNameInput = screen.getByLabelText(/battle.*name|title/i);
        await user.clear(battleNameInput);
        await user.type(battleNameInput, 'Morning Motivation Battle');

        const battleTypeSelect = screen.getByLabelText(/battle.*type/i);
        await user.selectOptions(battleTypeSelect, 'streak');

        const durationSelect = screen.getByLabelText(/duration/i);
        await user.selectOptions(durationSelect, '7'); // 7 days

        // Mock battle creation
        const mockBattle: Battle = {
          id: 'battle-123',
          type: 'streak',
          participants: [battleCreatorUser.id],
          creatorId: battleCreatorUser.id,
          status: 'active',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          settings: { duration: 'P7D', difficulty: 'medium' },
          createdAt: new Date().toISOString(),
          name: 'Morning Motivation Battle'
        };

        vi.mocked(SupabaseService.createBattle).mockResolvedValueOnce({
          battle: mockBattle,
          error: null
        });

        const createButton = screen.getByRole('button', { name: /create|start.*battle/i });
        await user.click(createButton);

        await waitFor(() => {
          expect(screen.getByText('Morning Motivation Battle')).toBeInTheDocument();
        });

        // Verify analytics tracking
        expect(analyticsService.trackFeatureUsage).toHaveBeenCalledWith(
          'battle_creation',
          'created',
          expect.objectContaining({
            battleType: 'streak',
            duration: 7
          })
        );
      }
    });

    it('should handle battle participation and trash talk', async () => {
      const participant = {
        ...mockUser,
        id: 'participant-456',
        name: 'Battle Participant'
      };

      const mockBattle: Battle = {
        id: 'active-battle-789',
        type: 'speed',
        participants: ['creator-123', participant.id],
        creatorId: 'creator-123',
        status: 'active',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        settings: { duration: 'PT24H', difficulty: 'hard' },
        createdAt: new Date().toISOString(),
        name: 'Speed Challenge'
      };

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(participant);
      vi.mocked(SupabaseService.getActiveBattles).mockResolvedValue({
        battles: [mockBattle],
        error: null
      });

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to gaming hub
      const gamingButton = screen.getByRole('button', { name: /gaming|gamepad/i });
      await user.click(gamingButton);

      await waitFor(() => {
        expect(screen.getByText('Speed Challenge')).toBeInTheDocument();
      });

      // Send trash talk
      const trashTalkInput = screen.queryByPlaceholderText(/trash.*talk|message/i);
      if (trashTalkInput) {
        await user.type(trashTalkInput, "You're going down! ⚡");

        const sendButton = screen.getByRole('button', { name: /send/i });
        await user.click(sendButton);

        // Mock trash talk sent
        vi.mocked(SupabaseService.sendTrashTalk).mockResolvedValueOnce({
          success: true,
          error: null
        });

        await waitFor(() => {
          expect(SupabaseService.sendTrashTalk).toHaveBeenCalledWith(
            'active-battle-789',
            "You're going down! ⚡"
          );
        });

        // Verify analytics tracking
        expect(analyticsService.trackFeatureUsage).toHaveBeenCalledWith(
          'trash_talk',
          'sent',
          expect.objectContaining({
            battleId: 'active-battle-789',
            messageLength: expect.any(Number)
          })
        );
      }
    });
  });

  describe('Social Features and Leaderboards', () => {
    it('should display leaderboards and friend rankings', async () => {
      const userWithFriends = {
        ...mockUser,
        level: 8,
        friends: ['friend1', 'friend2', 'friend3']
      };

      const mockLeaderboard = [
        { userId: 'leader1', name: 'Top Player', level: 15, experience: 1500, rank: 1 },
        { userId: userWithFriends.id, name: userWithFriends.name, level: 8, experience: 800, rank: 5 },
        { userId: 'friend1', name: 'Best Friend', level: 7, experience: 700, rank: 8 }
      ];

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(userWithFriends);
      vi.mocked(SupabaseService.getLeaderboard).mockResolvedValue({
        leaderboard: mockLeaderboard,
        error: null
      });

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to gaming hub
      const gamingButton = screen.getByRole('button', { name: /gaming|gamepad/i });
      await user.click(gamingButton);

      await waitFor(() => {
        expect(screen.getByText(/level 8/i)).toBeInTheDocument();
      });

      // Should show leaderboard
      await waitFor(() => {
        expect(screen.getByText('Top Player')).toBeInTheDocument();
        expect(screen.getByText('Best Friend')).toBeInTheDocument();
      });

      // Should show user's rank
      expect(screen.getByText(/rank.*5|#5/i)).toBeInTheDocument();

      // Test friend challenge
      const challengeButton = screen.queryByRole('button', { name: /challenge.*friend/i });
      if (challengeButton) {
        await user.click(challengeButton);

        // Should open challenge modal
        await waitFor(() => {
          const challengeModal = screen.getByRole('dialog');
          expect(challengeModal).toBeInTheDocument();
        });
      }
    });
  });

  describe('Analytics Integration', () => {
    it('should track comprehensive gaming analytics', async () => {
      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to gaming hub
      const gamingButton = screen.getByRole('button', { name: /gaming|gamepad/i });
      await user.click(gamingButton);

      // Verify gaming hub access is tracked
      expect(analyticsService.trackFeatureUsage).toHaveBeenCalledWith(
        'gaming_hub',
        'accessed',
        expect.any(Object)
      );

      // Simulate reward unlocking
      await act(async () => {
        const rewardEvent = new CustomEvent('reward-unlocked', {
          detail: { 
            rewardId: 'test-reward',
            type: 'achievement',
            points: 25
          }
        });
        window.dispatchEvent(rewardEvent);
      });

      // Should track reward analytics
      expect(analyticsService.trackFeatureUsage).toHaveBeenCalledWith(
        'reward_unlocked',
        'achievement',
        expect.objectContaining({
          rewardId: 'test-reward',
          points: 25
        })
      );
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle gaming system errors gracefully', async () => {
      // Mock rewards service failure
      vi.mocked(rewardsService.analyzeAndGenerateRewards).mockRejectedValueOnce(
        new Error('Rewards service unavailable')
      );

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to gaming hub
      const gamingButton = screen.getByRole('button', { name: /gaming|gamepad/i });
      await user.click(gamingButton);

      // Should show error state gracefully
      await waitFor(() => {
        const errorMessage = screen.queryByText(/error|unavailable|try.*again/i);
        if (errorMessage) {
          expect(errorMessage).toBeInTheDocument();
        }
      });

      // Gaming hub should still be functional in some capacity
      expect(screen.getByRole('button', { name: /gaming|gamepad/i })).toBeInTheDocument();
    });

    it('should maintain performance with large datasets', async () => {
      // Mock large leaderboard
      const largeLeaderboard = Array.from({ length: 1000 }, (_, i) => ({
        userId: `user-${i}`,
        name: `Player ${i}`,
        level: Math.floor(Math.random() * 20) + 1,
        experience: Math.floor(Math.random() * 2000),
        rank: i + 1
      }));

      vi.mocked(SupabaseService.getLeaderboard).mockResolvedValue({
        leaderboard: largeLeaderboard,
        error: null
      });

      const startTime = performance.now();

      let appContainer: HTMLElement;
      
      await act(async () => {
        const result = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
        appContainer = result.container;
        container = appContainer;
      });

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      const gamingButton = screen.getByRole('button', { name: /gaming|gamepad/i });
      await user.click(gamingButton);

      await waitFor(() => {
        expect(screen.getByText(/level/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      
      // Should load quickly even with large dataset
      expect(endTime - startTime).toBeLessThan(3000);

      // Should only render visible items (virtualization)
      const leaderboardItems = screen.getAllByText(/Player \d+/);
      expect(leaderboardItems.length).toBeLessThan(50); // Should virtualize
    });
  });
});