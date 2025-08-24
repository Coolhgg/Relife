// Vitest globals are available globally, no need to import
/**
 * BattleSystem Component Tests
 *
 * Tests the battle creation, management, and interaction system including
 * different battle types, participant management, and trash talk functionality.
 */

import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/utils/render-helpers';
import {
  createTestUser,
  createTestBattle,
  createTestBattleParticipant,
  createTestTrashTalkMessage,
} from '../../__tests__/factories/gaming-factories';
import BattleSystem from '../BattleSystem';

// Mock hooks
const mockUseGamingAnnouncements = {
  announcements: [],
  addAnnouncement: jest.fn(),
  clearAnnouncements: jest.fn(),
};

jest.mock('../hooks/useGamingAnnouncements', (
) => ({
  useGamingAnnouncements: (
) => mockUseGamingAnnouncements,
}));

// Mock services
const mockOfflineGamingService = {
  createBattle: jest.fn(),
  joinBattle: jest.fn(),
  sendTrashTalk: jest.fn(),
  getBattleUpdates: jest.fn(),
};

jest.mock('../services/offline-gaming', (
) => mockOfflineGamingService);

describe('BattleSystem', (
) => {
  const mockCurrentUser = createTestUser({
    id: '1',
    username: 'testuser',
    displayName: 'Test User',
    level: 15,
    experience: 2500,
  });

  const mockFriends = [
    createTestUser({
      id: '2',
      username: 'friend1',
      displayName: 'Friend One',
      level: 12,
      lastActive: new Date().toISOString(),
    }),
    createTestUser({
      id: '3',
      username: 'friend2',
      displayName: 'Friend Two',
      level: 18,
      lastActive: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    }),
    createTestUser({
      id: '4',
      username: 'friend3',
      displayName: 'Friend Three',
      level: 8,
      lastActive: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    }),
  ];

  const mockActiveBattles = [
    createTestBattle({
      id: 'battle-1',
      type: 'speed',
      status: 'active',
      creatorId: mockCurrentUser.id,
      participants: [
        createTestBattleParticipant({ userId: mockCurrentUser.id, score: 150 }),
        createTestBattleParticipant({ userId: mockFriends[0].id, score: 120 }),
      ],
      startTime: new Date(Date.now() - 3600000), // Started 1 hour ago
      endTime: new Date(Date.now() + 3600000), // Ends in 1 hour
      trashTalk: [
        createTestTrashTalkMessage({
          userId: mockCurrentUser.id,
          message: "I'm gonna crush you all!",
          timestamp: new Date(),
        }),
      ],
    }),
    createTestBattle({
      id: 'battle-2',
      type: 'consistency',
      status: 'pending',
      creatorId: mockFriends[1].id,
      participants: [
        createTestBattleParticipant({ userId: mockFriends[1].id }),
        createTestBattleParticipant({ userId: mockCurrentUser.id }),
      ],
      startTime: new Date(Date.now() + 86400000), // Starts tomorrow
      endTime: new Date(Date.now() + 86400000 + 604800000), // 7 days duration
    }),
  ];

  const mockCallbacks = {
    onCreateBattle: jest.fn(),
    onJoinBattle: jest.fn(),
    onSendTrashTalk: jest.fn(),
  };

  const defaultProps = {
    currentUser: mockCurrentUser,
    friends: mockFriends,
    activeBattles: mockActiveBattles,
    ...mockCallbacks,
  };

  beforeEach((
) => {
    jest.clearAllMocks();
    mockOfflineGamingService.createBattle.mockResolvedValue({ id: 'new-battle-123' });
  });

  describe('Rendering', (
) => {
    it('renders battle system tabs correctly', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      expect(screen.getByRole('tab', { name: /active battles/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /create battle/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /battle history/i })).toBeInTheDocument();
    });

    it('displays active battles list', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      expect(screen.getByText('Speed Battle')).toBeInTheDocument();
      expect(screen.getByText('Consistency Challenge')).toBeInTheDocument();
    });

    it('shows battle status badges correctly', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('displays participant count and limits', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      expect(screen.getByText('2/8 participants')).toBeInTheDocument(); // Speed battle
      expect(screen.getByText('2/20 participants')).toBeInTheDocument(); // Consistency battle
    });
  });

  describe('Battle Types Display', (
) => {
    it('shows correct battle type information', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      // Switch to create battle tab
      const createTab = screen.getByRole('tab', { name: /create battle/i });
      fireEvent.click(createTab);

      expect(screen.getByText('Speed Battle')).toBeInTheDocument();
      expect(screen.getByText('⚡')).toBeInTheDocument();
      expect(screen.getByText('First to wake up wins')).toBeInTheDocument();
      expect(screen.getByText('2 hours')).toBeInTheDocument();

      expect(screen.getByText('Consistency Challenge')).toBeInTheDocument();
      expect(screen.getByText('📈')).toBeInTheDocument();
      expect(screen.getByText('Most consistent wake times')).toBeInTheDocument();
      expect(screen.getByText('7 days')).toBeInTheDocument();

      expect(screen.getByText('Task Master')).toBeInTheDocument();
      expect(screen.getByText('🎯')).toBeInTheDocument();
      expect(screen.getByText('Complete tasks fastest')).toBeInTheDocument();
      expect(screen.getByText('1 day')).toBeInTheDocument();
    });

    it('displays max participants for each battle type', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      const createTab = screen.getByRole('tab', { name: /create battle/i });
      fireEvent.click(createTab);

      expect(screen.getByText('Max 8 players')).toBeInTheDocument(); // Speed
      expect(screen.getByText('Max 20 players')).toBeInTheDocument(); // Consistency
      expect(screen.getByText('Max 10 players')).toBeInTheDocument(); // Tasks
    });
  });

  describe('Battle Creation', (
) => {
    beforeEach((
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      const createTab = screen.getByRole('tab', { name: /create battle/i });
      fireEvent.click(createTab);
    });

    it('allows selecting battle type', async (
) => {
      const user = userEvent.setup();

      const speedBattleCard = screen.getByText('Speed Battle').closest('button');
      await user.click(speedBattleCard!);

      expect(speedBattleCard).toHaveClass('ring-2', 'ring-blue-500');
    });

    it('shows battle creation form when type is selected', async (
) => {
      const user = userEvent.setup();

      const speedBattleCard = screen.getByText('Speed Battle').closest('button');
      await user.click(speedBattleCard!);

      expect(screen.getByLabelText(/battle name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
    });

    it('allows inviting friends to battle', async (
) => {
      const user = userEvent.setup();

      const speedBattleCard = screen.getByText('Speed Battle').closest('button');
      await user.click(speedBattleCard!);

      expect(screen.getByText('Invite Friends')).toBeInTheDocument();
      expect(screen.getByText('Friend One')).toBeInTheDocument();
      expect(screen.getByText('Friend Two')).toBeInTheDocument();

      const friendCheckbox = screen.getByLabelText('Friend One');
      await user.click(friendCheckbox);

      expect(friendCheckbox).toBeChecked();
    });

    it('validates required fields before creation', async (
) => {
      const user = userEvent.setup();

      const speedBattleCard = screen.getByText('Speed Battle').closest('button');
      await user.click(speedBattleCard!);

      const createButton = screen.getByRole('button', { name: /create battle/i });
      await user.click(createButton);

      expect(screen.getByText(/battle name is required/i)).toBeInTheDocument();
    });

    it('creates battle with valid input', async (
) => {
      const user = userEvent.setup();

      const speedBattleCard = screen.getByText('Speed Battle').closest('button');
      await user.click(speedBattleCard!);

      await user.type(screen.getByLabelText(/battle name/i), 'My Epic Battle');
      await user.type(
        screen.getByLabelText(/description/i),
        "Let's see who's fastest!"
      );

      // Select friend
      const friendCheckbox = screen.getByLabelText('Friend One');
      await user.click(friendCheckbox);

      const createButton = screen.getByRole('button', { name: /create battle/i });
      await user.click(createButton);

      await waitFor((
) => {
        expect(mockCallbacks.onCreateBattle).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Epic Battle',
            description: "Let's see who's fastest!",
            type: 'speed',
            invitedUsers: [mockFriends[0].id],
          })
        );
      });
    });
  });

  describe('Battle Management', (
) => {
    it('allows joining pending battles', async (
) => {
      const user = userEvent.setup();

      renderWithProviders(<BattleSystem {...defaultProps} />);

      const joinButton = screen.getAllByText(/join/i)[0]; // First join button
      await user.click(joinButton);

      expect(mockCallbacks.onJoinBattle).toHaveBeenCalledWith('battle-2');
    });

    it('shows leave option for active battles user created', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      const leaveBattleButton = screen.getByText(/leave battle/i);
      expect(leaveBattleButton).toBeInTheDocument();
    });

    it('displays battle progress and scores', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      expect(screen.getByText('150')).toBeInTheDocument(); // User's score
      expect(screen.getByText('120')).toBeInTheDocument(); // Friend's score
    });

    it('shows time remaining for active battles', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      expect(screen.getByText(/time remaining/i)).toBeInTheDocument();
    });
  });

  describe('Trash Talk Feature', (
) => {
    it('displays existing trash talk messages', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      expect(screen.getByText("I'm gonna crush you all!")).toBeInTheDocument();
    });

    it('allows sending new trash talk messages', async (
) => {
      const user = userEvent.setup();

      renderWithProviders(<BattleSystem {...defaultProps} />);

      const trashTalkButton = screen.getByRole('button', { name: /trash talk/i });
      await user.click(trashTalkButton);

      const messageInput = screen.getByPlaceholderText(/send a message/i);
      await user.type(messageInput, "You're going down!");

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockCallbacks.onSendTrashTalk).toHaveBeenCalledWith(
        'battle-1',
        "You're going down!"
      );
    });

    it('limits trash talk message length', async (
) => {
      const user = userEvent.setup();

      renderWithProviders(<BattleSystem {...defaultProps} />);

      const trashTalkButton = screen.getByRole('button', { name: /trash talk/i });
      await user.click(trashTalkButton);

      const messageInput = screen.getByPlaceholderText(/send a message/i);
      const longMessage = 'a'.repeat(201); // Over 200 character limit

      await user.type(messageInput, longMessage);

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();

      expect(screen.getByText(/message too long/i)).toBeInTheDocument();
    });

    it('prevents sending empty trash talk messages', async (
) => {
      const user = userEvent.setup();

      renderWithProviders(<BattleSystem {...defaultProps} />);

      const trashTalkButton = screen.getByRole('button', { name: /trash talk/i });
      await user.click(trashTalkButton);

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Friend Selection', (
) => {
    it('shows friends list with online status', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      const createTab = screen.getByRole('tab', { name: /create battle/i });
      fireEvent.click(createTab);

      const speedBattleCard = screen.getByText('Speed Battle').closest('button');
      fireEvent.click(speedBattleCard!);

      expect(screen.getByText('Friend One')).toBeInTheDocument();
      expect(screen.getByTestId('online-indicator')).toBeInTheDocument(); // Recently active friend
    });

    it('filters friends by search query', async (
) => {
      const user = userEvent.setup();

      renderWithProviders(<BattleSystem {...defaultProps} />);

      const createTab = screen.getByRole('tab', { name: /create battle/i });
      await user.click(createTab);

      const speedBattleCard = screen.getByText('Speed Battle').closest('button');
      await user.click(speedBattleCard!);

      const searchInput = screen.getByPlaceholderText(/search friends/i);
      await user.type(searchInput, 'Friend One');

      expect(screen.getByText('Friend One')).toBeInTheDocument();
      expect(screen.queryByText('Friend Two')).not.toBeInTheDocument();
    });

    it('shows friend levels and experience', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      const createTab = screen.getByRole('tab', { name: /create battle/i });
      fireEvent.click(createTab);

      const speedBattleCard = screen.getByText('Speed Battle').closest('button');
      fireEvent.click(speedBattleCard!);

      expect(screen.getByText('Level 12')).toBeInTheDocument(); // Friend One
      expect(screen.getByText('Level 18')).toBeInTheDocument(); // Friend Two
    });
  });

  describe('Offline Support', (
) => {
    it('shows offline indicators', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const offlineIndicator = screen.getByTestId('wifi-off-icon');
      expect(offlineIndicator).toBeInTheDocument();
    });

    it('queues actions when offline', async (
) => {
      const user = userEvent.setup();

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      renderWithProviders(<BattleSystem {...defaultProps} />);

      const trashTalkButton = screen.getByRole('button', { name: /trash talk/i });
      await user.click(trashTalkButton);

      const messageInput = screen.getByPlaceholderText(/send a message/i);
      await user.type(messageInput, 'Offline message');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(
        screen.getByText(/message queued for when you're back online/i)
      ).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', (
) => {
    it('updates battle scores in real-time', async (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      // Mock real-time score update
      const updatedBattle = {
        ...mockActiveBattles[0],
        participants: [
          { ...mockActiveBattles[0].participants[0], score: 200 }, // User's new score
          { ...mockActiveBattles[0].participants[1], score: 180 }, // Friend's new score
        ],
      };

      // Simulate real-time update
      fireEvent(
        window,
        new CustomEvent('battle-update', {
          detail: { battleId: 'battle-1', battle: updatedBattle },
        })
      );

      await waitFor((
) => {
        expect(screen.getByText('200')).toBeInTheDocument();
        expect(screen.getByText('180')).toBeInTheDocument();
      });
    });

    it('shows live participant count changes', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      // Initial count
      expect(screen.getByText('2/8 participants')).toBeInTheDocument();

      // Mock participant joining
      const updatedBattle = {
        ...mockActiveBattles[0],
        participants: [
          ...mockActiveBattles[0].participants,
          createTestBattleParticipant({ userId: 'new-user-id' }),
        ],
      };

      fireEvent(
        window,
        new CustomEvent('battle-update', {
          detail: { battleId: 'battle-1', battle: updatedBattle },
        })
      );

      expect(screen.getByText('3/8 participants')).toBeInTheDocument();
    });
  });

  describe('Accessibility', (
) => {
    it('provides proper ARIA labels for battle cards', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      const battleCards = screen.getAllByRole('article');
      battleCards.forEach(card => {
        expect(card).toHaveAccessibleName();
      });
    });

    it('supports keyboard navigation for battle types', async (
) => {
      const user = userEvent.setup();

      renderWithProviders(<BattleSystem {...defaultProps} />);

      const createTab = screen.getByRole('tab', { name: /create battle/i });
      await user.click(createTab);

      const speedBattleCard = screen.getByText('Speed Battle').closest('button');
      speedBattleCard!.focus();

      expect(speedBattleCard).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(speedBattleCard).toHaveClass('ring-2', 'ring-blue-500');
    });

    it('announces battle status changes', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      const statusUpdates = screen.getByRole('status');
      expect(statusUpdates).toHaveAttribute('aria-live', 'polite');
    });

    it('provides screen reader friendly trash talk interface', async (
) => {
      const user = userEvent.setup();

      renderWithProviders(<BattleSystem {...defaultProps} />);

      const trashTalkButton = screen.getByRole('button', { name: /trash talk/i });
      expect(trashTalkButton).toHaveAccessibleDescription();

      await user.click(trashTalkButton);

      const messageInput = screen.getByPlaceholderText(/send a message/i);
      expect(messageInput).toHaveAttribute('aria-label');
    });
  });

  describe('Error Handling', (
) => {
    it('handles battle creation failures', async (
) => {
      const user = userEvent.setup();

      mockOfflineGamingService.createBattle.mockRejectedValue(
        new Error('Creation failed')
      );

      renderWithProviders(<BattleSystem {...defaultProps} />);

      const createTab = screen.getByRole('tab', { name: /create battle/i });
      await user.click(createTab);

      const speedBattleCard = screen.getByText('Speed Battle').closest('button');
      await user.click(speedBattleCard!);

      await user.type(screen.getByLabelText(/battle name/i), 'Test Battle');

      const createButton = screen.getByRole('button', { name: /create battle/i });
      await user.click(createButton);

      await waitFor((
) => {
        expect(screen.getByText(/failed to create battle/i)).toBeInTheDocument();
      });
    });

    it('handles empty battles list gracefully', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} activeBattles={[]} />);

      expect(screen.getByText(/no active battles/i)).toBeInTheDocument();
    });

    it('handles network errors gracefully', async (
) => {
      const user = userEvent.setup();

      mockCallbacks.onSendTrashTalk.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<BattleSystem {...defaultProps} />);

      const trashTalkButton = screen.getByRole('button', { name: /trash talk/i });
      await user.click(trashTalkButton);

      const messageInput = screen.getByPlaceholderText(/send a message/i);
      await user.type(messageInput, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor((
) => {
        expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', (
) => {
    beforeEach((
) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('adapts layout for mobile screens', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      const container = screen.getByTestId('battle-system-container');
      expect(container).toHaveClass('px-4'); // Mobile padding
    });

    it('stacks battle cards vertically on mobile', (
) => {
      renderWithProviders(<BattleSystem {...defaultProps} />);

      const battleGrid = screen.getByTestId('battles-grid');
      expect(battleGrid).toHaveClass('flex-col');
    });

    it('uses mobile-optimized trash talk interface', async (
) => {
      const user = userEvent.setup();

      renderWithProviders(<BattleSystem {...defaultProps} />);

      const trashTalkButton = screen.getByRole('button', { name: /trash talk/i });
      await user.click(trashTalkButton);

      // Should use mobile dialog
      expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-md');
    });
  });
});
