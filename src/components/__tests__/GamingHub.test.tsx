/**
 * GamingHub Component Tests
 * 
 * Tests the main gaming interface including rewards, community, and battles tabs,
 * along with navigation and integration with child components.
 */

import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/utils/render-helpers';
import { 
  createTestUser, 
  createTestBattle,
  createTestRewardSystem 
} from '../../__tests__/factories/gaming-factories';
import GamingHub from '../GamingHub';
import type { User, Battle, RewardSystem } from '../../types';

// Mock child components
jest.mock('../RewardsDashboard', () => {
  return function MockRewardsDashboard({ rewardSystem, onRefreshRewards }: any) {
    return (
      <div data-testid="rewards-dashboard">
        <div>Points: {rewardSystem.points}</div>
        <div>Level: {rewardSystem.level}</div>
        <button onClick={onRefreshRewards} data-testid="refresh-rewards">Refresh</button>
      </div>
    );
  };
});

jest.mock('../CommunityHub', () => {
  return function MockCommunityHub({ currentUser, battles, onCreateBattle, onJoinBattle }: any) {
    return (
      <div data-testid="community-hub">
        <div>Welcome {currentUser.displayName}!</div>
        <div>{battles.length} active battles</div>
        <button onClick={() => onCreateBattle({ type: 'speed' })} data-testid="create-battle">
          Create Battle
        </button>
        <button onClick={() => onJoinBattle('battle-123')} data-testid="join-battle">
          Join Battle
        </button>
      </div>
    );
  };
});

jest.mock('../BattleSystem', () => {
  return function MockBattleSystem({ currentUser, friends, activeBattles, onCreateBattle }: any) {
    return (
      <div data-testid="battle-system">
        <div>User: {currentUser.username}</div>
        <div>{friends.length} friends</div>
        <div>{activeBattles.length} battles</div>
        <button onClick={() => onCreateBattle({ type: 'consistency' })} data-testid="create-battle-system">
          Create Battle
        </button>
      </div>
    );
  };
});

describe('GamingHub', () => {
  const mockCurrentUser = createTestUser({
    id: '1',
    username: 'testuser',
    displayName: 'Test User',
    level: 15,
    experience: 2500
  });

  const mockRewardSystem = createTestRewardSystem({
    points: 1250,
    level: 15,
    nextLevelPoints: 1500,
    badges: [
      { id: 'early-bird', name: 'Early Bird', description: 'Wake up before 6 AM for 7 days' },
      { id: 'consistent', name: 'Consistency Champion', description: 'No missed alarms for 14 days' }
    ]
  });

  const mockActiveBattles = [
    createTestBattle({
      id: 'battle-1',
      type: 'speed',
      status: 'active',
      participants: [mockCurrentUser.id, 'user-2']
    }),
    createTestBattle({
      id: 'battle-2',
      type: 'consistency',
      status: 'pending',
      participants: [mockCurrentUser.id]
    })
  ];

  const mockFriends = [
    createTestUser({ id: 'friend-1', displayName: 'Friend One' }),
    createTestUser({ id: 'friend-2', displayName: 'Friend Two' })
  ];

  const mockCallbacks = {
    onCreateBattle: jest.fn(),
    onJoinBattle: jest.fn(),
    onSendTrashTalk: jest.fn(),
    onRefreshRewards: jest.fn()
  };

  const defaultProps = {
    currentUser: mockCurrentUser,
    rewardSystem: mockRewardSystem,
    activeBattles: mockActiveBattles,
    friends: mockFriends,
    ...mockCallbacks
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders gaming hub header correctly', () => {
      renderWithProviders(<GamingHub {...defaultProps} />);

      expect(screen.getByRole('heading', { name: 'Gaming Hub' })).toBeInTheDocument();
      expect(screen.getByText('Rewards, community, and battles all in one place')).toBeInTheDocument();
    });

    it('renders all navigation tabs', () => {
      renderWithProviders(<GamingHub {...defaultProps} />);

      expect(screen.getByRole('tab', { name: /rewards/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /community/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /battles/i })).toBeInTheDocument();
    });

    it('renders tab icons correctly', () => {
      renderWithProviders(<GamingHub {...defaultProps} />);

      expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
      expect(screen.getByTestId('sword-icon')).toBeInTheDocument();
    });

    it('hides tab labels on small screens', () => {
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });

      renderWithProviders(<GamingHub {...defaultProps} />);

      const rewardsText = screen.getByText('Rewards');
      expect(rewardsText).toHaveClass('hidden', 'sm:inline');
    });
  });

  describe('Tab Navigation', () => {
    it('defaults to rewards tab', () => {
      renderWithProviders(<GamingHub {...defaultProps} />);

      const rewardsTab = screen.getByRole('tab', { name: /rewards/i });
      expect(rewardsTab).toHaveAttribute('data-state', 'active');
      expect(screen.getByTestId('rewards-dashboard')).toBeInTheDocument();
    });

    it('switches to community tab when clicked', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<GamingHub {...defaultProps} />);

      const communityTab = screen.getByRole('tab', { name: /community/i });
      await user.click(communityTab);

      expect(communityTab).toHaveAttribute('data-state', 'active');
      expect(screen.getByTestId('community-hub')).toBeInTheDocument();
    });

    it('switches to battles tab when clicked', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<GamingHub {...defaultProps} />);

      const battlesTab = screen.getByRole('tab', { name: /battles/i });
      await user.click(battlesTab);

      expect(battlesTab).toHaveAttribute('data-state', 'active');
      expect(screen.getByTestId('battle-system')).toBeInTheDocument();
    });

    it('supports keyboard navigation between tabs', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<GamingHub {...defaultProps} />);

      const rewardsTab = screen.getByRole('tab', { name: /rewards/i });
      rewardsTab.focus();

      await user.keyboard('{ArrowRight}');
      
      const communityTab = screen.getByRole('tab', { name: /community/i });
      expect(communityTab).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(communityTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Rewards Tab', () => {
    it('renders RewardsDashboard with correct props', () => {
      renderWithProviders(<GamingHub {...defaultProps} />);

      expect(screen.getByTestId('rewards-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Points: 1250')).toBeInTheDocument();
      expect(screen.getByText('Level: 15')).toBeInTheDocument();
    });

    it('shows loading state when rewardSystem is not provided', () => {
      renderWithProviders(
        <GamingHub {...defaultProps} rewardSystem={undefined} />
      );

      expect(screen.getByText('Loading your rewards...')).toBeInTheDocument();
      expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
    });

    it('calls onRefreshRewards when refresh button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<GamingHub {...defaultProps} />);

      const refreshButton = screen.getByTestId('refresh-rewards');
      await user.click(refreshButton);

      expect(mockCallbacks.onRefreshRewards).toHaveBeenCalledTimes(1);
    });
  });

  describe('Community Tab', () => {
    it('renders CommunityHub with correct props', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<GamingHub {...defaultProps} />);

      const communityTab = screen.getByRole('tab', { name: /community/i });
      await user.click(communityTab);

      expect(screen.getByTestId('community-hub')).toBeInTheDocument();
      expect(screen.getByText('Welcome Test User!')).toBeInTheDocument();
      expect(screen.getByText('2 active battles')).toBeInTheDocument();
    });

    it('forwards battle creation from community hub', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<GamingHub {...defaultProps} />);

      const communityTab = screen.getByRole('tab', { name: /community/i });
      await user.click(communityTab);

      const createBattleButton = screen.getByTestId('create-battle');
      await user.click(createBattleButton);

      expect(mockCallbacks.onCreateBattle).toHaveBeenCalledWith({ type: 'speed' });
    });

    it('forwards battle joining from community hub', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<GamingHub {...defaultProps} />);

      const communityTab = screen.getByRole('tab', { name: /community/i });
      await user.click(communityTab);

      const joinBattleButton = screen.getByTestId('join-battle');
      await user.click(joinBattleButton);

      expect(mockCallbacks.onJoinBattle).toHaveBeenCalledWith('battle-123');
    });
  });

  describe('Battles Tab', () => {
    it('renders BattleSystem with correct props', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<GamingHub {...defaultProps} />);

      const battlesTab = screen.getByRole('tab', { name: /battles/i });
      await user.click(battlesTab);

      expect(screen.getByTestId('battle-system')).toBeInTheDocument();
      expect(screen.getByText('User: testuser')).toBeInTheDocument();
      expect(screen.getByText('2 friends')).toBeInTheDocument();
      expect(screen.getByText('2 battles')).toBeInTheDocument();
    });

    it('forwards battle creation from battle system', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<GamingHub {...defaultProps} />);

      const battlesTab = screen.getByRole('tab', { name: /battles/i });
      await user.click(battlesTab);

      const createBattleButton = screen.getByTestId('create-battle-system');
      await user.click(createBattleButton);

      expect(mockCallbacks.onCreateBattle).toHaveBeenCalledWith({ type: 'consistency' });
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<GamingHub {...defaultProps} />);

      const container = screen.getByRole('main');
      expect(container).toHaveClass('flex', 'flex-col', 'h-full');
    });

    it('handles tablet layout properly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      renderWithProviders(<GamingHub {...defaultProps} />);

      // Tab content should be scrollable
      const tabsContent = screen.getByTestId('rewards-dashboard').parentElement;
      expect(tabsContent?.parentElement).toHaveClass('overflow-y-auto');
    });
  });

  describe('Dark Mode Support', () => {
    it('applies dark mode classes correctly', () => {
      renderWithProviders(
        <GamingHub {...defaultProps} />,
        { theme: 'dark' }
      );

      const container = document.querySelector('.dark\\:bg-dark-900');
      expect(container).toBeInTheDocument();

      const header = document.querySelector('.dark\\:bg-dark-800');
      expect(header).toBeInTheDocument();
    });

    it('uses correct text colors in dark mode', () => {
      renderWithProviders(
        <GamingHub {...defaultProps} />,
        { theme: 'dark' }
      );

      const title = screen.getByRole('heading', { name: 'Gaming Hub' });
      expect(title).toHaveClass('dark:text-white');

      const description = screen.getByText('Rewards, community, and battles all in one place');
      expect(description).toHaveClass('dark:text-gray-300');
    });
  });

  describe('Loading States', () => {
    it('handles empty battles array gracefully', () => {
      renderWithProviders(
        <GamingHub {...defaultProps} activeBattles={[]} />
      );

      // Should render without errors
      expect(screen.getByRole('heading', { name: 'Gaming Hub' })).toBeInTheDocument();
    });

    it('handles empty friends array gracefully', () => {
      renderWithProviders(
        <GamingHub {...defaultProps} friends={[]} />
      );

      // Should render without errors
      expect(screen.getByRole('heading', { name: 'Gaming Hub' })).toBeInTheDocument();
    });

    it('shows appropriate loading state for rewards', () => {
      renderWithProviders(
        <GamingHub {...defaultProps} rewardSystem={undefined} />
      );

      expect(screen.getByText('Loading your rewards...')).toBeInTheDocument();
      expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing user data gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      renderWithProviders(
        <GamingHub 
          {...defaultProps} 
          currentUser={null as any}
        />
      );

      // Component should render without crashing
      expect(screen.getByRole('heading', { name: 'Gaming Hub' })).toBeInTheDocument();
      
      consoleError.mockRestore();
    });

    it('handles callback errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      renderWithProviders(
        <GamingHub {...defaultProps} onRefreshRewards={errorCallback} />
      );

      const refreshButton = screen.getByTestId('refresh-rewards');
      
      // Should not crash when callback throws
      await user.click(refreshButton);
      
      expect(errorCallback).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for tabs', () => {
      renderWithProviders(<GamingHub {...defaultProps} />);

      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAccessibleName();
      });
    });

    it('maintains proper tab panel relationships', () => {
      renderWithProviders(<GamingHub {...defaultProps} />);

      const rewardsTab = screen.getByRole('tab', { name: /rewards/i });
      const rewardsPanel = screen.getByRole('tabpanel');
      
      expect(rewardsTab).toHaveAttribute('aria-controls');
      expect(rewardsPanel).toHaveAttribute('aria-labelledby');
    });

    it('supports screen reader navigation', () => {
      renderWithProviders(
        <GamingHub {...defaultProps} />,
        { screenReaderEnabled: true }
      );

      const heading = screen.getByRole('heading', { name: 'Gaming Hub' });
      expect(heading).toHaveAttribute('aria-level', '1');
    });

    it('provides keyboard shortcuts information', () => {
      renderWithProviders(<GamingHub {...defaultProps} />);

      // Check for keyboard navigation hints
      const tabList = screen.getByRole('tablist');
      expect(tabList).toHaveAttribute('aria-orientation', 'horizontal');
    });
  });
});