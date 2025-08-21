/// <reference lib="dom" />
/**
 * Gaming and Rewards System Integration Tests
 * 
 * Tests for gamification features and social functionality:
 * - Achievement unlocking and progression
 * - Battle creation and participation
 * - Streak tracking and rewards
 * - Social features (friends, leaderboards)
 * - Experience points and leveling system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

import App from '../../src/App';
import { AIRewardsService } from '../../src/services/ai-rewards';
import { BattleService } from '../../src/services/battle';

import { integrationTestHelpers } from '../utils/integration-test-setup';
import { createMockUser, createMockAlarm } from '../utils/test-mocks';

vi.mock('../../src/services/ai-rewards');
vi.mock('../../src/services/battle');

describe('Gaming and Rewards System Integration', () => {
  let container: HTMLElement;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (container) container.remove();
  });

  describe('Achievement and Reward System', () => {
    it('should unlock achievements and grant rewards', async () => {
      const mockUser = createMockUser({
        level: 1,
        experience: 0,
        achievements: []
      });

      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);

      await act(async () => {
        const result = render(<BrowserRouter><App /></BrowserRouter>);
        container = result.container;
      });

      // Complete an alarm to trigger achievement
      const mockReward = {
        level: 2,
        experience: 100,
        unlockedAchievements: ['first_alarm_completed'],
        unlockedRewards: ['morning_warrior_badge']
      };

      vi.mocked(AIRewardsService.getInstance().analyzeAndGenerateRewards).mockResolvedValue(mockReward);

      // Navigate to gaming hub
      const gamingButton = screen.getByRole('button', { name: /gaming.*hub|rewards/i });
      await user.click(gamingButton);

      await waitFor(() => {
        expect(screen.getByText(/achievement.*unlocked|reward.*earned/i)).toBeInTheDocument();
        expect(screen.getByText(/morning.*warrior/i)).toBeInTheDocument();
      });
    });
  });

  describe('Battle System', () => {
    it('should create and participate in battles', async () => {
      const mockUser = createMockUser({ level: 5 });
      vi.mocked(SupabaseService.getCurrentUser).mockResolvedValue(mockUser);

      await act(async () => {
        const result = render(<BrowserRouter><App /></BrowserRouter>);
        container = result.container;
      });

      // Create a battle
      const createBattleButton = screen.getByRole('button', { name: /create.*battle/i });
      await user.click(createBattleButton);

      const battleName = screen.getByLabelText(/battle.*name/i);
      await user.type(battleName, 'Morning Warriors Challenge');

      const mockBattle = {
        id: 'battle-123',
        name: 'Morning Warriors Challenge',
        participants: [mockUser.id],
        status: 'active'
      };

      vi.mocked(BattleService.createBattle).mockResolvedValue({ battle: mockBattle, error: null });

      const startBattleButton = screen.getByRole('button', { name: /start.*battle/i });
      await user.click(startBattleButton);

      await waitFor(() => {
        expect(screen.getByText('Morning Warriors Challenge')).toBeInTheDocument();
        expect(screen.getByText(/battle.*active/i)).toBeInTheDocument();
      });
    });
  });
});