import { expect, test, jest } from "@jest/globals";
/// <reference lib="dom" />
/**
 * Gaming Integration Tests
 *
 * Tests integration between Gaming components including end-to-end user journeys
 * for battle creation, participation, trash talking, and reward earning.
 */

import React from "react";
import { screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../__tests__/utils/render-helpers";
import {
  createTestUser,
  createTestBattle,
  createTestRewardSystem,
  createTestBattleParticipant,
} from "../../__tests__/factories/gaming-factories";
import GamingHub from "../GamingHub";

// Mock services
const mockGamingService = {
  createBattle: jest.fn(),
  joinBattle: jest.fn(),
  sendTrashTalk: jest.fn(),
  getBattleUpdates: jest.fn(),
  leaveBattle: jest.fn(),
};

jest.mock("../services/gamingService", () => ({
  gamingService: mockGamingService,
}));

// Mock real-time updates
const mockWebSocket = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
};

jest.mock("../hooks/useRealTimeUpdates", () => ({
  useRealTimeUpdates: () => ({
    connected: true,
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  }),
}));

describe("Gaming Integration Tests", () => {
  const mockCurrentUser = createTestUser({
    id: "current-user",
    username: "gaming-pro",
    displayName: "Gaming Pro",
    level: 20,
    experience: 5000,
  });

  const mockFriends = [
    createTestUser({
      id: "friend-1",
      username: "speedster",
      displayName: "Speed Demon",
      level: 18,
      lastActive: new Date().toISOString(),
    }),
    createTestUser({
      id: "friend-2",
      username: "consistent",
      displayName: "Consistency King",
      level: 22,
      lastActive: new Date(Date.now() - 3600000).toISOString(),
    }),
    createTestUser({
      id: "friend-3",
      username: "taskmaster",
      displayName: "Task Master",
      level: 15,
      lastActive: new Date(Date.now() - 86400000).toISOString(),
    }),
  ];

  const mockRewardSystem = createTestRewardSystem({
    userId: mockCurrentUser.id,
    points: 2500,
    level: 20,
    experience: 5000,
    nextLevelPoints: 6000,
    badges: [
      {
        id: "speed-demon",
        name: "Speed Demon",
        description: "Win 10 speed battles",
        unlockedAt: new Date().toISOString(),
        rarity: "rare",
      },
    ],
  });

  const mockActiveBattles = [
    createTestBattle({
      id: "active-battle-1",
      type: "speed",
      status: "active",
      creatorId: mockCurrentUser.id,
      participants: [
        createTestBattleParticipant({
          userId: mockCurrentUser.id,
          user: mockCurrentUser,
          score: 250,
        }),
        createTestBattleParticipant({
          userId: mockFriends[0].id,
          user: mockFriends[0],
          score: 200,
        }),
      ],
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(Date.now() + 3600000), // 1 hour from now
      trashTalk: [],
    }),
  ];

  const defaultProps = {
    currentUser: mockCurrentUser,
    rewardSystem: mockRewardSystem,
    activeBattles: mockActiveBattles,
    friends: mockFriends,
    onCreateBattle: jest.fn(),
    onJoinBattle: jest.fn(),
    onSendTrashTalk: jest.fn(),
    onRefreshRewards: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGamingService.createBattle.mockResolvedValue({
      id: "new-battle-123",
      participants: [mockCurrentUser.id],
    });
    mockGamingService.joinBattle.mockResolvedValue({ success: true });
    mockGamingService.sendTrashTalk.mockResolvedValue({ success: true });
  });

  describe("Complete Battle Creation Flow", () => {
    it("creates a speed battle and invites friends", async () => {
      const user = userEvent.setup();

      renderWithProviders(<GamingHub {...defaultProps} />);

      // Navigate to battles tab
      const battlesTab = screen.getByRole("tab", { name: /battles/i });
      await user.click(battlesTab);

      // Switch to create battle tab
      const createBattleTab = screen.getByRole("tab", {
        name: /create battle/i,
      });
      await user.click(createBattleTab);

      // Select speed battle type
      const speedBattleCard = screen
        .getByText("Speed Battle")
        .closest("button");
      await user.click(speedBattleCard!);

      // Fill out battle form
      await user.type(
        screen.getByLabelText(/battle name/i),
        "Morning Sprint Challenge",
      );
      await user.type(
        screen.getByLabelText(/description/i),
        "Let's see who can wake up fastest tomorrow!",
      );

      // Set start time to tomorrow morning
      const tomorrow = new Date(Date.now() + 86400000);
      const startTimeInput = screen.getByLabelText(/start time/i);
      await user.clear(startTimeInput);
      await user.type(startTimeInput, tomorrow.toISOString().slice(0, 16));

      // Invite friends
      const speedsterCheckbox = screen.getByLabelText("Speed Demon");
      const consistencyCheckbox = screen.getByLabelText("Consistency King");

      await user.click(speedsterCheckbox);
      await user.click(consistencyCheckbox);

      expect(speedsterCheckbox).toBeChecked();
      expect(consistencyCheckbox).toBeChecked();

      // Create the battle
      const createButton = screen.getByRole("button", {
        name: /create battle/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        expect(defaultProps.onCreateBattle).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Morning Sprint Challenge",
            description: "Let's see who can wake up fastest tomorrow!",
            type: "speed",
            invitedUsers: [mockFriends[0].id, mockFriends[1].id],
          }),
        );
      });

      // Should show success message
      expect(
        screen.getByText(/battle created successfully/i),
      ).toBeInTheDocument();
    });

    it("validates battle creation form properly", async () => {
      const user = userEvent.setup();

      renderWithProviders(<GamingHub {...defaultProps} />);

      // Navigate to battles and create battle
      const battlesTab = screen.getByRole("tab", { name: /battles/i });
      await user.click(battlesTab);

      const createBattleTab = screen.getByRole("tab", {
        name: /create battle/i,
      });
      await user.click(createBattleTab);

      const speedBattleCard = screen
        .getByText("Speed Battle")
        .closest("button");
      await user.click(speedBattleCard!);

      // Try to create without filling required fields
      const createButton = screen.getByRole("button", {
        name: /create battle/i,
      });
      await user.click(createButton);

      // Should show validation errors
      expect(screen.getByText(/battle name is required/i)).toBeInTheDocument();

      // Fill only name
      await user.type(screen.getByLabelText(/battle name/i), "Test Battle");

      // Try again - should still need description
      await user.click(createButton);
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();

      // Fill description
      await user.type(
        screen.getByLabelText(/description/i),
        "Test description",
      );

      // Now should succeed
      await user.click(createButton);

      await waitFor(() => {
        expect(defaultProps.onCreateBattle).toHaveBeenCalled();
      });
    });
  });

  describe("Battle Participation Flow", () => {
    it("allows joining and participating in battles", async () => {
      const user = userEvent.setup();

      const pendingBattle = createTestBattle({
        id: "pending-battle",
        status: "pending",
        creatorId: mockFriends[0].id,
        participants: [
          createTestBattleParticipant({
            userId: mockFriends[0].id,
            user: mockFriends[0],
          }),
        ],
      });

      renderWithProviders(
        <GamingHub
          {...defaultProps}
          activeBattles={[...mockActiveBattles, pendingBattle]}
        />,
      );

      // Navigate to battles
      const battlesTab = screen.getByRole("tab", { name: /battles/i });
      await user.click(battlesTab);

      // Should see the pending battle
      expect(screen.getByText("Pending")).toBeInTheDocument();

      // Join the battle
      const joinButtons = screen.getAllByText(/join/i);
      const joinButton = joinButtons.find((btn) =>
        btn
          .closest('[data-testid="battle-card"]')
          ?.textContent?.includes("Pending"),
      );

      await user.click(joinButton!);

      expect(defaultProps.onJoinBattle).toHaveBeenCalledWith("pending-battle");

      // Should show confirmation
      expect(
        screen.getByText(/joined battle successfully/i),
      ).toBeInTheDocument();
    });

    it("prevents joining battles when already at max participants", () => {
      const fullBattle = createTestBattle({
        id: "full-battle",
        status: "pending",
        maxParticipants: 2,
        participants: [
          createTestBattleParticipant({ userId: mockFriends[0].id }),
          createTestBattleParticipant({ userId: mockFriends[1].id }),
        ],
      });

      renderWithProviders(
        <GamingHub {...defaultProps} activeBattles={[fullBattle]} />,
      );

      const battlesTab = screen.getByRole("tab", { name: /battles/i });
      fireEvent.click(battlesTab);

      // Join button should be disabled
      const joinButton = screen.getByRole("button", { name: /battle full/i });
      expect(joinButton).toBeDisabled();
    });
  });

  describe("Trash Talk Integration", () => {
    it("enables trash talk during active battles", async () => {
      const user = userEvent.setup();

      renderWithProviders(<GamingHub {...defaultProps} />);

      // Navigate to battles
      const battlesTab = screen.getByRole("tab", { name: /battles/i });
      await user.click(battlesTab);

      // Find and click trash talk button for active battle
      const trashTalkButton = screen.getByRole("button", {
        name: /trash talk/i,
      });
      await user.click(trashTalkButton);

      // Should open trash talk dialog
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/trash talk/i)).toBeInTheDocument();

      // Send a message
      const messageInput = screen.getByPlaceholderText(/send a message/i);
      await user.type(messageInput, "You're going down, Speed Demon!");

      const sendButton = screen.getByRole("button", { name: /send/i });
      await user.click(sendButton);

      expect(defaultProps.onSendTrashTalk).toHaveBeenCalledWith(
        "active-battle-1",
        "You're going down, Speed Demon!",
      );

      // Message should appear in chat
      await waitFor(() => {
        expect(
          screen.getByText("You're going down, Speed Demon!"),
        ).toBeInTheDocument();
      });
    });

    it("prevents sending inappropriate messages", async () => {
      const user = userEvent.setup();

      renderWithProviders(<GamingHub {...defaultProps} />);

      const battlesTab = screen.getByRole("tab", { name: /battles/i });
      await user.click(battlesTab);

      const trashTalkButton = screen.getByRole("button", {
        name: /trash talk/i,
      });
      await user.click(trashTalkButton);

      // Try to send inappropriate content (this would be filtered by the service)
      const messageInput = screen.getByPlaceholderText(/send a message/i);
      await user.type(messageInput, "This is inappropriate content!");

      // Mock service rejection
      mockGamingService.sendTrashTalk.mockRejectedValue(
        new Error("Message contains inappropriate content"),
      );

      const sendButton = screen.getByRole("button", { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(
          screen.getByText(/message contains inappropriate content/i),
        ).toBeInTheDocument();
      });
    });

    it("shows message history chronologically", () => {
      const battleWithMessages = {
        ...mockActiveBattles[0],
        trashTalk: [
          {
            id: "msg-1",
            battleId: "active-battle-1",
            userId: mockFriends[0].id,
            user: mockFriends[0],
            message: "Bring it on!",
            timestamp: new Date(Date.now() - 300000), // 5 minutes ago
          },
          {
            id: "msg-2",
            battleId: "active-battle-1",
            userId: mockCurrentUser.id,
            user: mockCurrentUser,
            message: "You asked for it!",
            timestamp: new Date(Date.now() - 60000), // 1 minute ago
          },
        ],
      };

      renderWithProviders(
        <GamingHub {...defaultProps} activeBattles={[battleWithMessages]} />,
      );

      const battlesTab = screen.getByRole("tab", { name: /battles/i });
      fireEvent.click(battlesTab);

      const trashTalkButton = screen.getByRole("button", {
        name: /trash talk/i,
      });
      fireEvent.click(trashTalkButton);

      // Messages should appear in chronological order
      const messages = screen.getAllByTestId("trash-talk-message");
      expect(messages).toHaveLength(2);

      // First message should be older one
      expect(messages[0]).toHaveTextContent("Bring it on!");
      expect(messages[1]).toHaveTextContent("You asked for it!");
    });
  });

  describe("Real-time Battle Updates", () => {
    it("updates battle scores in real-time", async () => {
      renderWithProviders(<GamingHub {...defaultProps} />);

      const battlesTab = screen.getByRole("tab", { name: /battles/i });
      fireEvent.click(battlesTab);

      // Initial scores
      expect(screen.getByText("250")).toBeInTheDocument(); // Current user
      expect(screen.getByText("200")).toBeInTheDocument(); // Friend

      // Simulate real-time score update
      const updatedBattle = {
        ...mockActiveBattles[0],
        participants: [
          { ...mockActiveBattles[0].participants[0], score: 300 },
          { ...mockActiveBattles[0].participants[1], score: 280 },
        ],
      };

      // Mock WebSocket message
      act(() => {
        fireEvent(
          window,
          new CustomEvent("battle-score-update", {
            detail: { battleId: "active-battle-1", battle: updatedBattle },
          }),
        );
      });

      // Scores should update
      await waitFor(() => {
        expect(screen.getByText("300")).toBeInTheDocument();
        expect(screen.getByText("280")).toBeInTheDocument();
      });
    });

    it("shows live participant changes", async () => {
      renderWithProviders(<GamingHub {...defaultProps} />);

      const battlesTab = screen.getByRole("tab", { name: /battles/i });
      fireEvent.click(battlesTab);

      // Initial participant count
      expect(screen.getByText("2/8 participants")).toBeInTheDocument();

      // Simulate someone joining
      const updatedBattle = {
        ...mockActiveBattles[0],
        participants: [
          ...mockActiveBattles[0].participants,
          createTestBattleParticipant({ userId: "new-participant" }),
        ],
      };

      act(() => {
        fireEvent(
          window,
          new CustomEvent("battle-participant-joined", {
            detail: { battleId: "active-battle-1", battle: updatedBattle },
          }),
        );
      });

      await waitFor(() => {
        expect(screen.getByText("3/8 participants")).toBeInTheDocument();
      });
    });
  });

  describe("Rewards Integration", () => {
    it("shows reward updates after battle completion", async () => {
      renderWithProviders(<GamingHub {...defaultProps} />);

      // Start on rewards tab
      expect(screen.getByTestId("rewards-dashboard")).toBeInTheDocument();
      expect(screen.getByText("Points: 2500")).toBeInTheDocument();

      // Simulate battle completion with reward
      act(() => {
        fireEvent(
          window,
          new CustomEvent("battle-completed", {
            detail: {
              battleId: "active-battle-1",
              winner: mockCurrentUser.id,
              rewards: {
                experience: 500,
                points: 200,
                badge: "speed-champion",
              },
            },
          }),
        );
      });

      // Should trigger rewards refresh
      await waitFor(() => {
        expect(defaultProps.onRefreshRewards).toHaveBeenCalled();
      });

      // Should show reward notification
      expect(
        screen.getByText(/you earned 500 experience/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/you earned 200 points/i)).toBeInTheDocument();
    });

    it("unlocks new badges from battle achievements", () => {
      const updatedRewardSystem = {
        ...mockRewardSystem,
        badges: [
          ...mockRewardSystem.badges,
          {
            id: "consistency-master",
            name: "Consistency Master",
            description: "Win 5 consistency battles",
            unlockedAt: new Date().toISOString(),
            rarity: "epic" as const,
          },
        ],
      };

      const { rerender } = renderWithProviders(<GamingHub {...defaultProps} />);

      // Initially shows existing badges
      expect(screen.getByText("Speed Demon")).toBeInTheDocument();

      // Update with new badge
      rerender(
        <GamingHub {...defaultProps} rewardSystem={updatedRewardSystem} />,
      );

      expect(screen.getByText("Consistency Master")).toBeInTheDocument();
      expect(screen.getByText(/new badge unlocked/i)).toBeInTheDocument();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("handles network errors during battle operations", async () => {
      const user = userEvent.setup();

      // Mock network error
      mockGamingService.joinBattle.mockRejectedValue(
        new Error("Network error"),
      );

      renderWithProviders(<GamingHub {...defaultProps} />);

      const battlesTab = screen.getByRole("tab", { name: /battles/i });
      await user.click(battlesTab);

      const joinButton = screen.getByRole("button", { name: /join/i });
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText(/network error occurred/i)).toBeInTheDocument();
      });

      // Should provide retry option
      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it("handles empty states gracefully", () => {
      renderWithProviders(
        <GamingHub {...defaultProps} activeBattles={[]} friends={[]} />,
      );

      const battlesTab = screen.getByRole("tab", { name: /battles/i });
      fireEvent.click(battlesTab);

      expect(screen.getByText(/no active battles/i)).toBeInTheDocument();

      const createBattleTab = screen.getByRole("tab", {
        name: /create battle/i,
      });
      fireEvent.click(createBattleTab);

      expect(screen.getByText(/no friends to invite/i)).toBeInTheDocument();
    });

    it("recovers from temporary service outages", async () => {
      const user = userEvent.setup();

      // Mock service outage
      mockGamingService.createBattle
        .mockRejectedValueOnce(new Error("Service unavailable"))
        .mockResolvedValueOnce({ id: "recovery-battle" });

      renderWithProviders(<GamingHub {...defaultProps} />);

      const battlesTab = screen.getByRole("tab", { name: /battles/i });
      await user.click(battlesTab);

      const createBattleTab = screen.getByRole("tab", {
        name: /create battle/i,
      });
      await user.click(createBattleTab);

      const speedBattleCard = screen
        .getByText("Speed Battle")
        .closest("button");
      await user.click(speedBattleCard!);

      await user.type(screen.getByLabelText(/battle name/i), "Recovery Test");
      await user.type(
        screen.getByLabelText(/description/i),
        "Testing recovery",
      );

      // First attempt fails
      const createButton = screen.getByRole("button", {
        name: /create battle/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/service unavailable/i)).toBeInTheDocument();
      });

      // Retry succeeds
      const retryButton = screen.getByRole("button", { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(
          screen.getByText(/battle created successfully/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility Integration", () => {
    it("maintains focus management across gaming flows", async () => {
      const user = userEvent.setup();

      renderWithProviders(<GamingHub {...defaultProps} />);

      // Navigate using keyboard
      const battlesTab = screen.getByRole("tab", { name: /battles/i });
      battlesTab.focus();

      await user.keyboard("{Enter}");
      expect(battlesTab).toHaveAttribute("data-state", "active");

      // Focus should move to battle content
      const battleCard = screen.getAllByRole("article")[0];
      expect(battleCard).toHaveAttribute("tabindex", "0");
    });

    it("provides proper ARIA announcements for battle state changes", async () => {
      renderWithProviders(<GamingHub {...defaultProps} />);

      const battlesTab = screen.getByRole("tab", { name: /battles/i });
      fireEvent.click(battlesTab);

      // Battle status announcements
      const statusRegion = screen.getByRole("status");
      expect(statusRegion).toHaveAttribute("aria-live", "polite");

      // Simulate battle completion
      act(() => {
        fireEvent(
          window,
          new CustomEvent("battle-completed", {
            detail: { battleId: "active-battle-1", winner: mockCurrentUser.id },
          }),
        );
      });

      expect(statusRegion).toHaveTextContent(/battle completed/i);
    });
  });
});
