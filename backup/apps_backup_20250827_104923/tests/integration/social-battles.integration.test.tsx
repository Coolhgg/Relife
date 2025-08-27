import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  setupAllMocks, 
  createMockUser, 
  createMockBattle, 
  generateTestUsers,
  measurePerformance,
  expectPerformanceWithin 
} from '../utils/test-mocks';
import type { User, Battle, Tournament, BattleResult } from '../../src/types';

// Mock Components (these would be real components in the actual app)
const SocialBattlesComponent = ({ user }: { user: User }) => {
  return (
    <div data-testid="social-battles">
      <h1>Social Battles</h1>
      <button data-testid="create-battle">Create Battle</button>
      <button data-testid="join-battle">Join Battle</button>
      <button data-testid="view-tournaments">View Tournaments</button>
      <div data-testid="battle-list">
        <div data-testid="battle-item">Test Battle</div>
      </div>
    </div>
  );
};

const BattleCreationModal = ({ onSubmit, onClose }: { 
  onSubmit: (battle: any) => void; 
  onClose: () => void;
}) => {
  const [battleData, setBattleData] = useState({
    name: '',
    type: 'streak',
    duration: 'P7D',
    difficulty: 'medium'
  });

  return (
    <div data-testid="battle-creation-modal">
      <input
        data-testid="battle-name"
        value={battleData.name}
        onChange={(e) => setBattleData({ ...battleData, name: e.target.value })}
        placeholder="Battle Name"
      />
      <select
        data-testid="battle-type"
        value={battleData.type}
        onChange={(e) => setBattleData({ ...battleData, type: e.target.value as any })}
      >
        <option value="streak">Streak Challenge</option>
        <option value="early_bird">Early Bird</option>
        <option value="consistency">Consistency Challenge</option>
        <option value="team">Team Battle</option>
      </select>
      <select
        data-testid="battle-duration"
        value={battleData.duration}
        onChange={(e) => setBattleData({ ...battleData, duration: e.target.value })}
      >
        <option value="P1D">1 Day</option>
        <option value="P3D">3 Days</option>
        <option value="P7D">1 Week</option>
        <option value="P14D">2 Weeks</option>
        <option value="P30D">1 Month</option>
      </select>
      <button
        data-testid="submit-battle"
        onClick={() => onSubmit(battleData)}
      >
        Create Battle
      </button>
      <button data-testid="cancel-battle" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
};

const TournamentBracket = ({ tournament }: { tournament: Tournament }) => {
  return (
    <div data-testid="tournament-bracket">
      <h2>{tournament.name}</h2>
      <div data-testid="tournament-rounds">
        {tournament.rounds?.map((round, index) => (
          <div key={index} data-testid={`round-${index}`}>
            Round {index + 1}
            {round.matches?.map((match, matchIndex) => (
              <div key={matchIndex} data-testid={`match-${index}-${matchIndex}`}>
                {match.participants.join(' vs ')}
              </div>
            ))}
          </div>
        ))}
      </div>
      <button data-testid="join-tournament">Join Tournament</button>
    </div>
  );
};

// Mock services
const mockSocialBattlesService = {
  createBattle: vi.fn(),
  joinBattle: vi.fn(),
  leaveBattle: vi.fn(),
  getBattles: vi.fn(),
  getBattleResults: vi.fn(),
  inviteFriend: vi.fn(),
  acceptInvitation: vi.fn(),
  declineInvitation: vi.fn(),
  sendBattleMessage: vi.fn(),
  getBattleMessages: vi.fn(),
  updateBattleProgress: vi.fn(),
  endBattle: vi.fn()
};

const mockTournamentService = {
  createTournament: vi.fn(),
  joinTournament: vi.fn(),
  getTournaments: vi.fn(),
  getTournamentBracket: vi.fn(),
  updateTournamentProgress: vi.fn(),
  endTournament: vi.fn()
};

const mockRealtimeService = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  send: vi.fn(),
  onMessage: vi.fn(),
  onPresenceChange: vi.fn(),
  onBattleUpdate: vi.fn(),
  getOnlineParticipants: vi.fn()
};

// Mock WebSocket
const mockWebSocket = () => {
  const mockWS = {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: WebSocket.OPEN,
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null
  };

  global.WebSocket = vi.fn().mockImplementation(() => mockWS);
  return mockWS;
};

// Test data generators
const generateMockTournament = (overrides: Partial<Tournament> = {}): Tournament => {
  return {
    id: 'test-tournament-123',
    name: 'Weekly Wake-Up Championship',
    type: 'single_elimination',
    status: 'upcoming',
    participants: [],
    maxParticipants: 16,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    prizePool: { coins: 1000, trophies: ['champion', 'runner_up'] },
    rounds: [],
    settings: { difficulty: 'medium', battleType: 'streak' },
    createdAt: new Date().toISOString(),
    creatorId: 'system',
    ...overrides
  };
};

const generateBattleMessages = (count: number, battleId: string) => {
  const messages = [];
  for (let i = 0; i < count; i++) {
    messages.push({
      id: `msg-${i}`,
      battleId,
      userId: `user-${i % 3}`,
      userName: `User ${i % 3}`,
      message: `Test message ${i}`,
      timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
      type: 'text'
    });
  }
  return messages;
};

const generateBattleProgress = (participants: string[]) => {
  return participants.map((userId, index) => ({
    userId,
    streak: Math.floor(Math.random() * 10),
    totalAlarms: Math.floor(Math.random() * 20) + 5,
    successfulAlarms: Math.floor(Math.random() * 15) + 3,
    averageWakeTime: `07:${15 + index * 5}:00`,
    lastActive: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    score: Math.floor(Math.random() * 1000) + 100
  }));
};

describe('Social Battles Integration Tests', () => {
  let mockUser: User;
  let mockFriends: User[];
  let mockWebSocketInstance: any;

  beforeEach(() => {
    setupAllMocks();
    mockWebSocketInstance = mockWebSocket();
    
    mockUser = createMockUser({
      id: 'test-user-main',
      subscriptionTier: 'premium',
      friends: ['friend-1', 'friend-2', 'friend-3'],
      level: 15,
      experience: 2500
    });
    
    mockFriends = generateTestUsers(5).map((user, index) => ({
      ...user,
      id: `friend-${index + 1}`,
      friends: ['test-user-main']
    }));

    // Reset all mocks
    Object.values(mockSocialBattlesService).forEach(mock => mock.mockReset());
    Object.values(mockTournamentService).forEach(mock => mock.mockReset());
    Object.values(mockRealtimeService).forEach(mock => mock.mockReset());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Battle Creation and Management', () => {
    it('should create a new battle successfully', async () => {
      const mockBattle = createMockBattle({
        name: 'Morning Champions',
        type: 'streak',
        participants: [mockUser.id]
      });

      mockSocialBattlesService.createBattle.mockResolvedValue(mockBattle);
      mockSocialBattlesService.getBattles.mockResolvedValue([mockBattle]);

      render(<SocialBattlesComponent user={mockUser} />);

      const createButton = screen.getByTestId('create-battle');
      await userEvent.click(createButton);

      // Simulate battle creation modal
      const modal = screen.getByTestId('battle-creation-modal');
      expect(modal).toBeInTheDocument();

      await userEvent.type(screen.getByTestId('battle-name'), 'Morning Champions');
      await userEvent.selectOptions(screen.getByTestId('battle-type'), 'streak');
      await userEvent.selectOptions(screen.getByTestId('battle-duration'), 'P7D');

      const submitButton = screen.getByTestId('submit-battle');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSocialBattlesService.createBattle).toHaveBeenCalledWith({
          name: 'Morning Champions',
          type: 'streak',
          duration: 'P7D',
          difficulty: 'medium'
        });
      });
    });

    it('should handle different battle types correctly', async () => {
      const battleTypes = ['streak', 'early_bird', 'consistency', 'team'];
      
      for (const battleType of battleTypes) {
        const mockBattle = createMockBattle({
          type: battleType as any,
          name: `${battleType} Battle`
        });

        mockSocialBattlesService.createBattle.mockResolvedValueOnce(mockBattle);

        render(<SocialBattlesComponent user={mockUser} />);

        await userEvent.click(screen.getByTestId('create-battle'));
        await userEvent.type(screen.getByTestId('battle-name'), `${battleType} Battle`);
        await userEvent.selectOptions(screen.getByTestId('battle-type'), battleType);
        await userEvent.click(screen.getByTestId('submit-battle'));

        await waitFor(() => {
          expect(mockSocialBattlesService.createBattle).toHaveBeenCalledWith(
            expect.objectContaining({ type: battleType })
          );
        });
      }
    });

    it('should validate premium features for advanced battle types', async () => {
      const freeUser = createMockUser({ subscriptionTier: 'free' });
      mockSocialBattlesService.createBattle.mockRejectedValue(
        new Error('Premium feature required')
      );

      render(<SocialBattlesComponent user={freeUser} />);

      await userEvent.click(screen.getByTestId('create-battle'));
      await userEvent.type(screen.getByTestId('battle-name'), 'Team Battle');
      await userEvent.selectOptions(screen.getByTestId('battle-type'), 'team');
      await userEvent.click(screen.getByTestId('submit-battle'));

      await waitFor(() => {
        expect(screen.getByText(/premium feature required/i)).toBeInTheDocument();
      });
    });

    it('should allow joining existing battles', async () => {
      const existingBattle = createMockBattle({
        id: 'existing-battle',
        participants: ['other-user-1', 'other-user-2'],
        status: 'active',
        name: 'Open Battle'
      });

      mockSocialBattlesService.getBattles.mockResolvedValue([existingBattle]);
      mockSocialBattlesService.joinBattle.mockResolvedValue({
        ...existingBattle,
        participants: [...existingBattle.participants, mockUser.id]
      });

      render(<SocialBattlesComponent user={mockUser} />);

      await userEvent.click(screen.getByTestId('join-battle'));

      await waitFor(() => {
        expect(screen.getByText('Open Battle')).toBeInTheDocument();
      });

      const joinButton = screen.getByText('Join This Battle');
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(mockSocialBattlesService.joinBattle).toHaveBeenCalledWith('existing-battle');
      });
    });

    it('should handle battle invitations', async () => {
      const invitation = {
        id: 'invite-123',
        battleId: 'battle-123',
        fromUserId: 'friend-1',
        fromUserName: 'Friend One',
        battleName: 'Morning Challenge',
        invitedAt: new Date().toISOString(),
        status: 'pending'
      };

      mockSocialBattlesService.getInvitations = vi.fn().mockResolvedValue([invitation]);
      mockSocialBattlesService.acceptInvitation.mockResolvedValue({ success: true });

      render(<SocialBattlesComponent user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Morning Challenge')).toBeInTheDocument();
        expect(screen.getByText('from Friend One')).toBeInTheDocument();
      });

      const acceptButton = screen.getByTestId('accept-invitation');
      await userEvent.click(acceptButton);

      await waitFor(() => {
        expect(mockSocialBattlesService.acceptInvitation).toHaveBeenCalledWith('invite-123');
      });
    });
  });

  describe('Real-time Features', () => {
    it('should establish WebSocket connection for battle updates', async () => {
      const activeBattle = createMockBattle({
        status: 'active',
        participants: [mockUser.id, 'friend-1', 'friend-2']
      });

      mockRealtimeService.connect.mockResolvedValue({ connected: true });
      mockSocialBattlesService.getBattles.mockResolvedValue([activeBattle]);

      render(<SocialBattlesComponent user={mockUser} />);

      await waitFor(() => {
        expect(mockRealtimeService.connect).toHaveBeenCalled();
        expect(mockRealtimeService.subscribe).toHaveBeenCalledWith(
          `battle:${activeBattle.id}`
        );
      });
    });

    it('should handle real-time battle progress updates', async () => {
      const activeBattle = createMockBattle({
        status: 'active',
        participants: [mockUser.id, 'friend-1']
      });

      const progressUpdate = {
        battleId: activeBattle.id,
        userId: 'friend-1',
        type: 'progress_update',
        data: {
          streak: 5,
          lastAlarmCompleted: new Date().toISOString(),
          score: 450
        }
      };

      mockRealtimeService.onBattleUpdate.mockImplementation((callback) => {
        setTimeout(() => callback(progressUpdate), 100);
      });

      render(<SocialBattlesComponent user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Friend streak: 5')).toBeInTheDocument();
        expect(screen.getByText('Score: 450')).toBeInTheDocument();
      });
    });

    it('should show real-time participant presence', async () => {
      const activeBattle = createMockBattle({
        participants: [mockUser.id, 'friend-1', 'friend-2', 'friend-3']
      });

      const presenceData = {
        battleId: activeBattle.id,
        online: ['friend-1', 'friend-3'],
        offline: ['friend-2'],
        lastSeen: {
          'friend-2': new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      };

      mockRealtimeService.getOnlineParticipants.mockResolvedValue(presenceData);

      render(<SocialBattlesComponent user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('2 participants online')).toBeInTheDocument();
        expect(screen.getByText('Friend-2 last seen 30 minutes ago')).toBeInTheDocument();
      });
    });

    it('should handle real-time chat messages', async () => {
      const activeBattle = createMockBattle();
      const messages = generateBattleMessages(5, activeBattle.id);

      mockSocialBattlesService.getBattleMessages.mockResolvedValue(messages);
      
      let messageCallback: (message: any) => void;
      mockRealtimeService.onMessage.mockImplementation((callback) => {
        messageCallback = callback;
      });

      render(<SocialBattlesComponent user={mockUser} />);

      // Send a new message through WebSocket
      const newMessage = {
        id: 'msg-new',
        battleId: activeBattle.id,
        userId: 'friend-1',
        userName: 'Friend One',
        message: 'Great job everyone!',
        timestamp: new Date().toISOString(),
        type: 'text'
      };

      act(() => {
        messageCallback(newMessage);
      });

      await waitFor(() => {
        expect(screen.getByText('Great job everyone!')).toBeInTheDocument();
        expect(screen.getByText('Friend One')).toBeInTheDocument();
      });
    });

    it('should handle connection failures gracefully', async () => {
      mockRealtimeService.connect.mockRejectedValue(new Error('Connection failed'));

      render(<SocialBattlesComponent user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/offline mode/i)).toBeInTheDocument();
        expect(screen.getByText(/real-time features unavailable/i)).toBeInTheDocument();
      });

      // Should still show basic battle functionality
      expect(screen.getByTestId('create-battle')).toBeInTheDocument();
      expect(screen.getByTestId('join-battle')).toBeInTheDocument();
    });
  });

  describe('Tournament System', () => {
    it('should display available tournaments', async () => {
      const tournaments = [
        generateMockTournament({
          name: 'Weekly Championship',
          status: 'upcoming',
          participants: [],
          maxParticipants: 16
        }),
        generateMockTournament({
          name: 'Monthly Masters',
          status: 'registration',
          participants: ['user-1', 'user-2', 'user-3'],
          maxParticipants: 32
        })
      ];

      mockTournamentService.getTournaments.mockResolvedValue(tournaments);

      render(<SocialBattlesComponent user={mockUser} />);

      await userEvent.click(screen.getByTestId('view-tournaments'));

      await waitFor(() => {
        expect(screen.getByText('Weekly Championship')).toBeInTheDocument();
        expect(screen.getByText('Monthly Masters')).toBeInTheDocument();
        expect(screen.getByText('0/16 participants')).toBeInTheDocument();
        expect(screen.getByText('3/32 participants')).toBeInTheDocument();
      });
    });

    it('should allow joining tournaments', async () => {
      const tournament = generateMockTournament({
        id: 'tournament-123',
        participants: ['user-1', 'user-2'],
        maxParticipants: 8
      });

      mockTournamentService.getTournaments.mockResolvedValue([tournament]);
      mockTournamentService.joinTournament.mockResolvedValue({
        ...tournament,
        participants: [...tournament.participants, mockUser.id]
      });

      render(<TournamentBracket tournament={tournament} />);

      const joinButton = screen.getByTestId('join-tournament');
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(mockTournamentService.joinTournament).toHaveBeenCalledWith('tournament-123');
      });
    });

    it('should generate tournament brackets correctly', async () => {
      const tournament = generateMockTournament({
        participants: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8'],
        rounds: [
          {
            roundNumber: 1,
            matches: [
              { id: 'match-1', participants: ['user-1', 'user-2'], winner: null },
              { id: 'match-2', participants: ['user-3', 'user-4'], winner: null },
              { id: 'match-3', participants: ['user-5', 'user-6'], winner: null },
              { id: 'match-4', participants: ['user-7', 'user-8'], winner: null }
            ]
          },
          {
            roundNumber: 2,
            matches: [
              { id: 'match-5', participants: [], winner: null },
              { id: 'match-6', participants: [], winner: null }
            ]
          },
          {
            roundNumber: 3,
            matches: [
              { id: 'match-7', participants: [], winner: null }
            ]
          }
        ]
      });

      render(<TournamentBracket tournament={tournament} />);

      // Check that all rounds are displayed
      expect(screen.getByTestId('round-0')).toBeInTheDocument();
      expect(screen.getByTestId('round-1')).toBeInTheDocument();
      expect(screen.getByTestId('round-2')).toBeInTheDocument();

      // Check first round matches
      expect(screen.getByTestId('match-0-0')).toBeInTheDocument();
      expect(screen.getByTestId('match-0-1')).toBeInTheDocument();
      expect(screen.getByTestId('match-0-2')).toBeInTheDocument();
      expect(screen.getByTestId('match-0-3')).toBeInTheDocument();

      expect(screen.getByText('user-1 vs user-2')).toBeInTheDocument();
      expect(screen.getByText('user-7 vs user-8')).toBeInTheDocument();
    });

    it('should handle tournament progression', async () => {
      const tournament = generateMockTournament({
        status: 'active',
        participants: [mockUser.id, 'friend-1'],
        rounds: [
          {
            roundNumber: 1,
            matches: [
              { 
                id: 'match-1', 
                participants: [mockUser.id, 'friend-1'], 
                winner: null,
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]
          }
        ]
      });

      mockTournamentService.getTournaments.mockResolvedValue([tournament]);

      const matchResult = {
        matchId: 'match-1',
        winner: mockUser.id,
        scores: {
          [mockUser.id]: 85,
          'friend-1': 72
        },
        completedAt: new Date().toISOString()
      };

      mockTournamentService.updateTournamentProgress.mockResolvedValue(matchResult);

      render(<TournamentBracket tournament={tournament} />);

      // Simulate match completion
      await waitFor(() => {
        expect(screen.getByText('Match in progress')).toBeInTheDocument();
      });

      // Tournament service would call this when match ends
      act(() => {
        mockTournamentService.updateTournamentProgress(matchResult);
      });

      await waitFor(() => {
        expect(screen.getByText(`Winner: ${mockUser.name}`)).toBeInTheDocument();
        expect(screen.getByText('Score: 85 - 72')).toBeInTheDocument();
      });
    });

    it('should validate tournament entry requirements', async () => {
      const premiumTournament = generateMockTournament({
        name: 'Premium Masters',
        requirements: {
          minLevel: 10,
          subscriptionTier: 'premium',
          achievements: ['early_bird_master']
        }
      });

      const lowLevelUser = createMockUser({
        level: 5,
        subscriptionTier: 'free',
        achievements: []
      });

      mockTournamentService.joinTournament.mockRejectedValue(
        new Error('Requirements not met: Level 10+ and Premium subscription required')
      );

      render(<TournamentBracket tournament={premiumTournament} />);

      // Should show requirements
      expect(screen.getByText('Level 10+ required')).toBeInTheDocument();
      expect(screen.getByText('Premium subscription required')).toBeInTheDocument();

      const joinButton = screen.getByTestId('join-tournament');
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText(/requirements not met/i)).toBeInTheDocument();
      });
    });
  });

  describe('Multiplayer Interactions', () => {
    it('should handle friend challenges', async () => {
      const friendBattle = createMockBattle({
        type: 'friend_challenge',
        participants: [mockUser.id],
        invitedUsers: ['friend-1'],
        settings: { private: true, duration: 'P3D' }
      });

      mockSocialBattlesService.inviteFriend.mockResolvedValue(friendBattle);

      render(<SocialBattlesComponent user={mockUser} />);

      const challengeFriendButton = screen.getByTestId('challenge-friend');
      await userEvent.click(challengeFriendButton);

      // Select friend to challenge
      const friendSelector = screen.getByTestId('friend-selector');
      await userEvent.selectOptions(friendSelector, 'friend-1');

      const sendChallengeButton = screen.getByTestId('send-challenge');
      await userEvent.click(sendChallengeButton);

      await waitFor(() => {
        expect(mockSocialBattlesService.inviteFriend).toHaveBeenCalledWith({
          friendId: 'friend-1',
          battleType: 'friend_challenge',
          duration: 'P3D'
        });
      });
    });

    it('should display team battle coordination', async () => {
      const teamBattle = createMockBattle({
        type: 'team',
        participants: [mockUser.id, 'friend-1', 'friend-2', 'friend-3'],
        teams: [
          {
            id: 'team-1',
            name: 'Early Birds',
            members: [mockUser.id, 'friend-1'],
            captain: mockUser.id
          },
          {
            id: 'team-2',
            name: 'Night Owls',
            members: ['friend-2', 'friend-3'],
            captain: 'friend-2'
          }
        ]
      });

      const teamProgress = {
        'team-1': { totalScore: 850, averageStreak: 6.5, teamBonus: 50 },
        'team-2': { totalScore: 720, averageStreak: 5.2, teamBonus: 25 }
      };

      mockSocialBattlesService.getTeamProgress = vi.fn().mockResolvedValue(teamProgress);

      render(<SocialBattlesComponent user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Early Birds')).toBeInTheDocument();
        expect(screen.getByText('Night Owls')).toBeInTheDocument();
        expect(screen.getByText('Team Score: 850')).toBeInTheDocument();
        expect(screen.getByText('Average Streak: 6.5')).toBeInTheDocument();
        expect(screen.getByText('Team Bonus: +50')).toBeInTheDocument();
      });

      // Should show user is team captain
      expect(screen.getByText('(Captain)')).toBeInTheDocument();
    });

    it('should handle battle spectating', async () => {
      const publicBattle = createMockBattle({
        type: 'public_challenge',
        participants: ['friend-1', 'friend-2'],
        settings: { allowSpectators: true, public: true }
      });

      const battleProgress = generateBattleProgress(['friend-1', 'friend-2']);

      mockSocialBattlesService.getBattleResults.mockResolvedValue(battleProgress);
      mockSocialBattlesService.spectate = vi.fn().mockResolvedValue({ success: true });

      render(<SocialBattlesComponent user={mockUser} />);

      const spectateButton = screen.getByTestId('spectate-battle');
      await userEvent.click(spectateButton);

      await waitFor(() => {
        expect(mockSocialBattlesService.spectate).toHaveBeenCalledWith(publicBattle.id);
        expect(screen.getByText('Spectating Mode')).toBeInTheDocument();
        expect(screen.getByText('Friend-1 Streak: 7')).toBeInTheDocument();
        expect(screen.getByText('Friend-2 Streak: 4')).toBeInTheDocument();
      });

      // Should not allow interaction in spectating mode
      expect(screen.queryByTestId('send-message')).not.toBeInTheDocument();
    });

    it('should support battle messaging with emoji reactions', async () => {
      const activeBattle = createMockBattle({
        participants: [mockUser.id, 'friend-1', 'friend-2']
      });

      const messages = generateBattleMessages(10, activeBattle.id);
      mockSocialBattlesService.getBattleMessages.mockResolvedValue(messages);
      mockSocialBattlesService.sendBattleMessage.mockResolvedValue({ success: true });
      mockSocialBattlesService.addReaction = vi.fn().mockResolvedValue({ success: true });

      render(<SocialBattlesComponent user={mockUser} />);

      const chatInput = screen.getByTestId('chat-input');
      await userEvent.type(chatInput, 'Good morning everyone! 🌅');

      const sendButton = screen.getByTestId('send-message');
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(mockSocialBattlesService.sendBattleMessage).toHaveBeenCalledWith({
          battleId: activeBattle.id,
          message: 'Good morning everyone! 🌅',
          type: 'text'
        });
      });

      // Test emoji reactions
      const messageElement = screen.getByText('Test message 0');
      const reactionButton = messageElement.parentElement?.querySelector('[data-testid="add-reaction"]');
      
      if (reactionButton) {
        await userEvent.click(reactionButton);
        const thumbsUpEmoji = screen.getByTestId('emoji-👍');
        await userEvent.click(thumbsUpEmoji);

        await waitFor(() => {
          expect(mockSocialBattlesService.addReaction).toHaveBeenCalledWith({
            messageId: 'msg-0',
            emoji: '👍'
          });
        });
      }
    });
  });

  describe('Performance and Analytics', () => {
    it('should handle large numbers of concurrent battles efficiently', async () => {
      const largeBattleList = Array.from({ length: 50 }, (_, i) =>
        createMockBattle({
          id: `battle-${i}`,
          name: `Battle ${i}`,
          participants: generateTestUsers(Math.floor(Math.random() * 10) + 2).map(u => u.id)
        })
      );

      mockSocialBattlesService.getBattles.mockResolvedValue(largeBattleList);

      const loadTime = await measurePerformance(async () => {
        render(<SocialBattlesComponent user={mockUser} />);
        
        await waitFor(() => {
          expect(screen.getByText('Battle 0')).toBeInTheDocument();
          expect(screen.getByText('Battle 49')).toBeInTheDocument();
        }, { timeout: 5000 });
      });

      expectPerformanceWithin(loadTime, 2000); // Should load within 2 seconds
    });

    it('should track social engagement analytics', async () => {
      const mockAnalytics = {
        trackBattleCreated: vi.fn(),
        trackBattleJoined: vi.fn(),
        trackMessageSent: vi.fn(),
        trackTournamentJoined: vi.fn(),
        trackFriendChallenged: vi.fn()
      };

      // Mock analytics service
      global.analytics = mockAnalytics;

      const battle = createMockBattle();
      mockSocialBattlesService.createBattle.mockResolvedValue(battle);

      render(<SocialBattlesComponent user={mockUser} />);

      await userEvent.click(screen.getByTestId('create-battle'));
      await userEvent.type(screen.getByTestId('battle-name'), 'Analytics Test Battle');
      await userEvent.click(screen.getByTestId('submit-battle'));

      await waitFor(() => {
        expect(mockAnalytics.trackBattleCreated).toHaveBeenCalledWith({
          battleId: battle.id,
          battleType: 'streak',
          duration: 'P7D',
          difficulty: 'medium',
          userLevel: mockUser.level,
          subscriptionTier: mockUser.subscriptionTier
        });
      });
    });

    it('should measure real-time feature performance', async () => {
      const activeBattle = createMockBattle({ status: 'active' });
      mockRealtimeService.connect.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ connected: true }), 100))
      );

      const connectionTime = await measurePerformance(async () => {
        render(<SocialBattlesComponent user={mockUser} />);
        
        await waitFor(() => {
          expect(screen.getByText('Connected')).toBeInTheDocument();
        });
      });

      expectPerformanceWithin(connectionTime, 500); // WebSocket should connect quickly

      // Test message delivery performance
      let messageCallback: (message: any) => void;
      mockRealtimeService.onMessage.mockImplementation((callback) => {
        messageCallback = callback;
      });

      const messageDeliveryTime = await measurePerformance(async () => {
        const testMessage = {
          id: 'perf-test-msg',
          battleId: activeBattle.id,
          userId: 'friend-1',
          userName: 'Friend One',
          message: 'Performance test message',
          timestamp: new Date().toISOString(),
          type: 'text'
        };

        act(() => {
          messageCallback(testMessage);
        });

        await waitFor(() => {
          expect(screen.getByText('Performance test message')).toBeInTheDocument();
        });
      });

      expectPerformanceWithin(messageDeliveryTime, 100); // Messages should appear instantly
    });

    it('should handle network failures gracefully', async () => {
      // Simulate network failure
      mockSocialBattlesService.getBattles.mockRejectedValue(new Error('Network Error'));
      mockRealtimeService.connect.mockRejectedValue(new Error('WebSocket connection failed'));

      render(<SocialBattlesComponent user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/connection error/i)).toBeInTheDocument();
        expect(screen.getByText(/trying offline mode/i)).toBeInTheDocument();
      });

      // Should show cached data
      expect(screen.getByText(/showing cached battles/i)).toBeInTheDocument();

      // Should allow retry
      const retryButton = screen.getByTestId('retry-connection');
      expect(retryButton).toBeInTheDocument();

      // Simulate successful retry
      mockSocialBattlesService.getBattles.mockResolvedValueOnce([
        createMockBattle({ name: 'Restored Battle' })
      ]);

      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Restored Battle')).toBeInTheDocument();
        expect(screen.queryByText(/connection error/i)).not.toBeInTheDocument();
      });
    });

    it('should validate premium features and show upgrade prompts', async () => {
      const freeUser = createMockUser({ subscriptionTier: 'free' });

      render(<SocialBattlesComponent user={freeUser} />);

      // Try to create a premium battle type
      await userEvent.click(screen.getByTestId('create-battle'));
      await userEvent.selectOptions(screen.getByTestId('battle-type'), 'team');

      expect(screen.getByText(/premium feature/i)).toBeInTheDocument();
      expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument();

      // Click upgrade prompt
      const upgradeButton = screen.getByTestId('upgrade-to-premium');
      await userEvent.click(upgradeButton);

      expect(screen.getByText(/subscription plans/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle battle creation failures', async () => {
      mockSocialBattlesService.createBattle.mockRejectedValue(
        new Error('Server overloaded. Please try again later.')
      );

      render(<SocialBattlesComponent user={mockUser} />);

      await userEvent.click(screen.getByTestId('create-battle'));
      await userEvent.type(screen.getByTestId('battle-name'), 'Failed Battle');
      await userEvent.click(screen.getByTestId('submit-battle'));

      await waitFor(() => {
        expect(screen.getByText(/server overloaded/i)).toBeInTheDocument();
        expect(screen.getByTestId('retry-create-battle')).toBeInTheDocument();
      });
    });

    it('should handle empty states gracefully', async () => {
      mockSocialBattlesService.getBattles.mockResolvedValue([]);
      mockTournamentService.getTournaments.mockResolvedValue([]);

      render(<SocialBattlesComponent user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/no active battles/i)).toBeInTheDocument();
        expect(screen.getByText(/create your first battle/i)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId('view-tournaments'));

      await waitFor(() => {
        expect(screen.getByText(/no tournaments available/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid battle configurations', async () => {
      render(<SocialBattlesComponent user={mockUser} />);

      await userEvent.click(screen.getByTestId('create-battle'));
      
      // Try to submit without name
      await userEvent.click(screen.getByTestId('submit-battle'));

      expect(screen.getByText(/battle name is required/i)).toBeInTheDocument();

      // Try invalid duration
      await userEvent.type(screen.getByTestId('battle-name'), 'Test Battle');
      await userEvent.selectOptions(screen.getByTestId('battle-duration'), 'invalid-duration');

      await waitFor(() => {
        expect(screen.getByText(/invalid duration selected/i)).toBeInTheDocument();
      });
    });

    it('should handle WebSocket disconnections', async () => {
      const activeBattle = createMockBattle({ status: 'active' });
      
      mockRealtimeService.connect.mockResolvedValue({ connected: true });
      
      let disconnectCallback: () => void;
      mockRealtimeService.onDisconnect = vi.fn().mockImplementation((callback) => {
        disconnectCallback = callback;
      });

      render(<SocialBattlesComponent user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/connected/i)).toBeInTheDocument();
      });

      // Simulate disconnection
      act(() => {
        disconnectCallback();
      });

      await waitFor(() => {
        expect(screen.getByText(/connection lost/i)).toBeInTheDocument();
        expect(screen.getByText(/attempting to reconnect/i)).toBeInTheDocument();
      });

      // Should show reconnecting indicator
      expect(screen.getByTestId('reconnecting-indicator')).toBeInTheDocument();
    });

    it('should handle tournament bracket edge cases', async () => {
      // Test odd number of participants
      const oddTournament = generateMockTournament({
        participants: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'], // 5 participants
        type: 'single_elimination'
      });

      // Should create proper bracket with byes
      const expectedRounds = [
        {
          roundNumber: 1,
          matches: [
            { participants: ['user-1', 'user-2'] },
            { participants: ['user-3', 'user-4'] },
            { participants: ['user-5'], bye: true } // bye round
          ]
        }
      ];

      mockTournamentService.generateBracket = vi.fn().mockReturnValue(expectedRounds);

      render(<TournamentBracket tournament={oddTournament} />);

      expect(screen.getByText('user-5 (bye)')).toBeInTheDocument();
    });
  });
});