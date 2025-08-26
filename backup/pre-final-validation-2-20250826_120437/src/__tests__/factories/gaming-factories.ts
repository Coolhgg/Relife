/**
 * Gaming & Social Features Factories
 *
 * Factory functions for generating gaming-related entities:
 * - Achievements (with various rarities and categories)
 * - Tournaments (single/multi elimination, round-robin)
 * - Teams (with members and statistics)
 * - Seasons (competitive periods)
 * - Leaderboards & Rankings
 */

import { faker } from '@faker-js/faker';
import type {
  Achievement,
  AchievementCategory,
  AchievementType,
  AchievementRarity,
  AchievementProgress,
  AchievementReward,
  AchievementRequirement,
  Tournament,
  TournamentParticipant,
  TournamentRound,
  Team,
  TeamMember,
  Season,
  Leaderboard,
  LeaderboardEntry,
  Battle,
  BattleType,
  BattleStatus,
  BattleParticipant,
  BattleParticipantStats,
  BattleSettings,
  BattlePrize,
  TrashTalkMessage,
  RewardSystem,
} from '../../types';
import {
  generateId,
  generateTimestamp,
  generateRating,
  generateExperience,
  randomSubset,
  weightedRandom,
  COMMON_DATA,
} from './factory-utils';
import { createTestUser } from './core-factories';

// ===============================
// ACHIEVEMENT FACTORIES
// ===============================

export interface CreateAchievementOptions {
  category?: AchievementCategory;
  rarity?: AchievementRarity;
  unlocked?: boolean;
  userId?: string;
}

export const _createTestAchievement = (
  options: CreateAchievementOptions = {}
): Achievement => {
  const {
    category = faker.helpers.arrayElement([
      'alarm',
      'battle',
      'social',
      'consistency',
      'premium',
      'special',
    ]),
    rarity = weightedRandom([
      { item: 'common', weight: 40 },
      { item: 'uncommon', weight: 30 },
      { item: 'rare', weight: 20 },
      { item: 'epic', weight: 8 },
      { item: 'legendary', weight: 2 },
    ] as Array<{ item: AchievementRarity; weight: number }>),
    unlocked = faker.datatype.boolean({ probability: 0.3 }),
    userId,
  } = options;

  const achievementNames = {
    alarm: [
      'Early Bird',
      'Rise and Shine',
      'Morning Warrior',
      'Dawn Breaker',
      'Sunrise Champion',
      'First Light',
      'Morning Glory',
      'Alarm Master',
    ],
    battle: [
      'Battle Veteran',
      'Victory Seeker',
      'Combat Ready',
      'Champion Fighter',
      'Arena Master',
      'Tournament Winner',
      'Battle Royale',
      'Gladiator',
    ],
    social: [
      'Team Player',
      'Friend Maker',
      'Social Butterfly',
      'Community Leader',
      'Mentor',
      'Helper',
      'Connector',
      'Ambassador',
    ],
    consistency: [
      'Streak Master',
      'Consistent Performer',
      'Habit Builder',
      'Dedication King',
      'Unwavering',
      'Persistent',
      'Marathon Runner',
      'Steady Climber',
    ],
    premium: [
      'Premium Explorer',
      'Feature Master',
      'Voice Collector',
      'Theme Creator',
      'Analytics Expert',
      'Power User',
      'Premium Pioneer',
      'Elite Member',
    ],
    special: [
      'Beta Tester',
      'Anniversary Celebrant',
      'Holiday Spirit',
      'Lucky Winner',
      'Secret Finder',
      'Easter Egg Hunter',
      'Rare Collector',
      'Legendary',
    ],
  };

  const name = faker.helpers.arrayElement(achievementNames[category]);
  const achievementId = generateId('achievement');

  return {
    id: achievementId,
    name,
    description: faker.lorem.sentence(),
    category,
    type: faker.helpers.arrayElement([
      'milestone',
      'streak',
      'challenge',
      'social',
      'hidden',
    ]),
    rarity,
    iconUrl: faker.image.url({ width: 64, height: 64 }),
    unlockedAt: unlocked ? generateTimestamp({ past: 30 }) : undefined,
    progress: unlocked ? undefined : createTestAchievementProgress(),
    rewards: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
      createTestAchievementReward(rarity)
    ),
    requirements: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () =>
      createTestAchievementRequirement(category)
    ),
  };
};

export const _createTestAchievementProgress = (): AchievementProgress => ({
  current: faker.number.int({ min: 0, max: 80 }),
  target: faker.number.int({ min: 50, max: 100 }),
  percentage: faker.number.float({ min: 0.1, max: 0.9, multipleOf: 0.01 }),
  milestones: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, (_, i) => ({
    value: (i + 1) * 20,
    completed: faker.datatype.boolean({ probability: 0.5 }),
    reward: faker.helpers.arrayElement(['xp', 'badge', 'coins', 'unlock']),
  })),
});

export const _createTestAchievementReward = (
  rarity: AchievementRarity
): AchievementReward => {
  const baseRewards = {
    common: { xp: 100, coins: 50 },
    uncommon: { xp: 250, coins: 100 },
    rare: { xp: 500, coins: 250 },
    epic: { xp: 1000, coins: 500 },
    legendary: { xp: 2500, coins: 1000 },
  };

  return {
    type: faker.helpers.arrayElement([
      'xp',
      'coins',
      'badge',
      'title',
      'unlock',
      'premium_days',
    ]),
    amount: faker.number.int({
      min: baseRewards[rarity].xp * 0.5,
      max: baseRewards[rarity].xp * 1.5,
    }),
    item: faker.helpers.arrayElement([
      'voice_pack',
      'theme',
      'sound',
      'badge',
      'title',
    ]),
    description: faker.lorem.words(3),
  } as unknown;
};

export const _createTestAchievementRequirement = (
  category: AchievementCategory
): AchievementRequirement => {
  const requirementTypes = {
    alarm: ['alarms_set', 'early_wake_ups', 'consistent_days', 'voice_dismissals'],
    battle: [
      'battles_won',
      'tournaments_joined',
      'streak_battles',
      'battle_participation',
    ],
    social: ['friends_added', 'teams_joined', 'help_given', 'messages_sent'],
    consistency: [
      'streak_days',
      'perfect_weeks',
      'habit_completions',
      'goals_achieved',
    ],
    premium: ['features_used', 'voices_tried', 'themes_created', 'reports_generated'],
    special: ['events_attended', 'secrets_found', 'rare_actions', 'time_periods'],
  };

  const type = faker.helpers.arrayElement(requirementTypes[category]);

  return {
    type,
    target: faker.number.int({ min: 1, max: 100 }),
    description: faker.lorem.sentence(),
    optional: faker.datatype.boolean({ probability: 0.2 }),
  } as unknown;
};

// ===============================
// TOURNAMENT FACTORIES
// ===============================

export interface CreateTournamentOptions {
  type?: 'single-elimination' | 'round-robin' | 'swiss';
  status?: 'registration' | 'active' | 'completed';
  participantCount?: number;
}

export const _createTestTournament = (
  options: CreateTournamentOptions = {}
): Tournament => {
  const {
    type = faker.helpers.arrayElement(['single-elimination', 'round-robin', 'swiss']),
    status = faker.helpers.arrayElement(['registration', 'active', 'completed']),
    participantCount = faker.number.int({ min: 8, max: 64 }),
  } = options;

  const tournamentId = generateId('tournament');
  const startTime =
    status === 'registration'
      ? generateTimestamp({ future: 7 })
      : generateTimestamp({ past: status === 'completed' ? 30 : 7 });

  const endTime =
    status === 'completed'
      ? generateTimestamp({ past: 7 })
      : generateTimestamp({ future: 14 });

  // Generate participants
  const participants: TournamentParticipant[] = [];
  for (let i = 0; i < participantCount; i++) {
    participants.push(createTestTournamentParticipant());
  }

  // Generate rounds based on tournament type
  const rounds = createTestTournamentRounds(type, participantCount, status);

  return {
    id: tournamentId,
    name: faker.helpers.arrayElement([
      'Morning Champions Cup',
      'Rise and Grind Tournament',
      'Early Bird Championship',
      'Dawn Warriors League',
      'Sunrise Battle Royale',
      'Wake Up Warriors Cup',
      'Morning Glory Tournament',
    ]),
    description: faker.lorem.sentence(),
    type,
    status,
    participants,
    maxParticipants: Math.max(
      participantCount,
      faker.number.int({ min: participantCount, max: 128 })
    ),
    rounds,
    currentRound:
      status === 'registration'
        ? 0
        : faker.number.int({ min: 1, max: Math.max(1, rounds.length) }),
    winner:
      status === 'completed'
        ? faker.helpers.arrayElement(participants).userId
        : undefined,
    prizePool: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
      createTestTournamentPrize()
    ),
    startTime,
    endTime,
    entryFee: faker.number.int({ min: 50, max: 500 }), // XP cost
    seasonId: faker.datatype.boolean({ probability: 0.7 })
      ? generateId('season')
      : undefined,
    createdAt: generateTimestamp({ past: 14 }),
  };
};

export const _createTestTournamentParticipant = (): TournamentParticipant => ({
  userId: generateId('_user'),
  user: createTestUser(),
  registeredAt: generateTimestamp({ past: 14 }),
  seed: faker.number.int({ min: 1, max: 64 }),
  eliminated: faker.datatype.boolean({ probability: 0.6 }),
  eliminatedRound: faker.datatype.boolean({ probability: 0.6 })
    ? faker.number.int({ min: 1, max: 5 })
    : undefined,
  currentRound: faker.number.int({ min: 0, max: 5 }),
  stats: {
    wins: faker.number.int({ min: 0, max: 10 }),
    losses: faker.number.int({ min: 0, max: 5 }),
    pointsScored: faker.number.int({ min: 0, max: 1000 }),
    averagePerformance: faker.number.float({
      min: 0.5,
      max: 1.0,
      multipleOf: 0.01,
    }),
  },
});

export const _createTestTournamentRounds = (
  type: 'single-elimination' | 'round-robin' | 'swiss',
  participantCount: number,
  status: string
): TournamentRound[] => {
  const rounds: TournamentRound[] = [];

  if (type === 'single-elimination') {
    const roundCount = Math.ceil(Math.log2(participantCount));
    for (let i = 1; i <= roundCount; i++) {
      rounds.push({
        number: i,
        name:
          i === roundCount
            ? 'Final'
            : i === roundCount - 1
              ? 'Semi-Final'
              : `Round ${i}`,
        matches: Array.from(
          { length: Math.ceil(participantCount / Math.pow(2, i)) },
          () => createTestTournamentMatch()
        ),
        status:
          status === 'completed' || i < 3
            ? 'completed'
            : status === 'active' && i === 3
              ? 'active'
              : 'pending',
        startTime: generateTimestamp({ past: 7 - i }),
        endTime: generateTimestamp({ past: 6 - i }),
      } as unknown);
    }
  } else if (type === 'round-robin') {
    for (let i = 1; i <= participantCount - 1; i++) {
      rounds.push({
        number: i,
        name: `Round ${i}`,
        matches: Array.from({ length: Math.floor(participantCount / 2) }, () =>
          createTestTournamentMatch()
        ),
        status: i < 5 ? 'completed' : 'pending',
        startTime: generateTimestamp({ past: 7 - i }),
        endTime: generateTimestamp({ past: 6 - i }),
      } as unknown);
    }
  }

  return rounds;
};

export const _createTestTournamentMatch = () => ({
  id: generateId('match'),
  participant1: generateId('_user'),
  participant2: generateId('_user'),
  winner: faker.helpers.arrayElement([null, 'participant1', 'participant2']),
  score: {
    participant1: faker.number.int({ min: 0, max: 100 }),
    participant2: faker.number.int({ min: 0, max: 100 }),
  },
  status: faker.helpers.arrayElement(['pending', 'active', 'completed']),
  scheduledTime: generateTimestamp({ past: 7 }),
  completedAt: faker.datatype.boolean({ probability: 0.7 })
    ? generateTimestamp({ past: 7 })
    : undefined,
});

// Tournament prize factory - currently unused but may be needed for future tournament enhancements
export const _createTestTournamentPrize = () => ({
  rank: faker.number.int({ min: 1, max: 10 }),
  xp: faker.number.int({ min: 500, max: 5000 }),
  coins: faker.number.int({ min: 100, max: 1000 }),
  items: randomSubset(['badge', 'title', 'voice_pack', 'theme', 'premium_days'], 1, 3),
  description: faker.lorem.words(3),
});

// ===============================
// TEAM FACTORIES
// ===============================

export interface CreateTeamOptions {
  memberCount?: number;
  isPublic?: boolean;
  createdBy?: string;
}

export const _createTestTeam = (options: CreateTeamOptions = {}): Team => {
  const {
    memberCount = faker.number.int({ min: 2, max: 20 }),
    isPublic = faker.datatype.boolean({ probability: 0.7 }),
    createdBy = generateId('_user'),
  } = options;

  const teamId = generateId('team');

  // Generate team members
  const members: TeamMember[] = [];
  for (let i = 0; i < memberCount; i++) {
    members.push(createTestTeamMember(i === 0 ? createdBy : undefined));
  }

  return {
    id: teamId,
    name: faker.helpers.arrayElement([
      'Morning Warriors',
      'Early Birds United',
      'Dawn Breakers',
      'Sunrise Squad',
      'Wake Up Champions',
      'Rise & Grind Crew',
      'Morning Glory Gang',
      'First Light Team',
    ]),
    description: faker.lorem.sentence(),
    members,
    createdBy,
    isPublic,
    maxMembers: Math.max(memberCount, faker.number.int({ min: memberCount, max: 50 })),
    joinCode: isPublic ? faker.string.alphanumeric(8).toUpperCase() : undefined,
    stats: createTestTeamStats(),
    achievements: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () =>
      generateId('achievement')
    ),
    currentSeason: faker.datatype.boolean({ probability: 0.8 })
      ? generateId('season')
      : undefined,
    createdAt: generateTimestamp({ past: 90 }),
    settings: {
      requireApproval: faker.datatype.boolean({ probability: 0.4 }),
      allowInvites: faker.datatype.boolean({ probability: 0.8 }),
      publicStats: faker.datatype.boolean({ probability: 0.6 }),
      notifications: faker.datatype.boolean({ probability: 0.9 }),
    },
  } as unknown;
};

export const _createTestTeamMember = (userId?: string): TeamMember => ({
  userId: userId || generateId('_user'),
  user: createTestUser(),
  role: faker.helpers.arrayElement(['member', 'moderator', 'admin', 'owner']),
  joinedAt: generateTimestamp({ past: 60 }),
  isActive: faker.datatype.boolean({ probability: 0.8 }),
  stats: {
    battlesParticipated: faker.number.int({ min: 0, max: 50 }),
    pointsContributed: faker.number.int({ min: 0, max: 5000 }),
    averagePerformance: faker.number.float({
      min: 0.4,
      max: 1.0,
      multipleOf: 0.01,
    }),
    teamBattlesWon: faker.number.int({ min: 0, max: 20 }),
  },
  permissions: faker.helpers.arrayElements(
    ['invite', 'kick', 'edit_team', 'manage_battles'],
    { min: 0, max: 4 }
  ),
});

export const _createTestTeamStats = () => ({
  totalMembers: faker.number.int({ min: 2, max: 50 }),
  activeMembers: faker.number.int({ min: 1, max: 30 }),
  totalBattles: faker.number.int({ min: 0, max: 100 }),
  battlesWon: faker.number.int({ min: 0, max: 80 }),
  winRate: faker.number.float({ min: 0.2, max: 0.9, multipleOf: 0.01 }),
  totalPoints: faker.number.int({ min: 0, max: 50000 }),
  averageLevel: faker.number.float({ min: 5.0, max: 50.0, multipleOf: 0.1 }),
  longestWinStreak: faker.number.int({ min: 0, max: 15 }),
  currentRanking: faker.number.int({ min: 1, max: 1000 }),
});

// ===============================
// SEASON FACTORIES
// ===============================

export interface CreateSeasonOptions {
  status?: 'upcoming' | 'active' | 'ended';
  theme?: string;
}

export const _createTestSeason = (options: CreateSeasonOptions = {}): Season => {
  const {
    status = faker.helpers.arrayElement(['upcoming', 'active', 'ended']),
    theme,
  } = options;

  const seasonId = generateId('season');
  const seasonNumber = faker.number.int({ min: 1, max: 10 });

  const startDate =
    status === 'upcoming'
      ? generateTimestamp({ future: 30 })
      : status === 'active'
        ? generateTimestamp({ past: 30 })
        : generateTimestamp({ past: 120 });

  const endDate =
    status === 'ended'
      ? generateTimestamp({ past: 30 })
      : generateTimestamp({ future: status === 'upcoming' ? 120 : 60 });

  return {
    id: seasonId,
    number: seasonNumber,
    name:
      theme ||
      faker.helpers.arrayElement([
        'Spring Awakening',
        'Summer Sunrise',
        'Autumn Challenge',
        'Winter Warriors',
        'New Year Revolution',
        'Back to School',
        'Holiday Spirit',
        'Championship Season',
      ]),
    description: faker.lorem.sentence(),
    status,
    startDate,
    endDate,
    theme:
      theme ||
      faker.helpers.arrayElement(['nature', 'holiday', 'challenge', 'community']),
    rewards: {
      tiers: Array.from({ length: 5 }, (_, i) => ({
        rank: i + 1,
        name: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'][i],
        requirements: { points: (i + 1) * 1000 },
        rewards: {
          xp: (i + 1) * 500,
          badge: `season_${seasonNumber}_${['bronze', 'silver', 'gold', 'platinum', 'diamond'][i]}`,
          title: faker.lorem.words(2),
        },
      })),
      special: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
        name: faker.lorem.words(2),
        description: faker.lorem.sentence(),
        rarity: faker.helpers.arrayElement(['rare', 'epic', 'legendary']),
        unlockCondition: faker.lorem.words(4),
      })),
    },
    leaderboard: createTestLeaderboard(),
    tournaments: Array.from({ length: faker.number.int({ min: 2, max: 8 }) }, () =>
      generateId('tournament')
    ),
    specialEvents: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => ({
      id: generateId('_event'),
      name: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      startDate: generateTimestamp({ past: 30 }),
      endDate: generateTimestamp({ future: 30 }),
      type: faker.helpers.arrayElement(['challenge', 'community', 'special']),
    })),
    stats: {
      totalParticipants: faker.number.int({ min: 100, max: 10000 }),
      activePlayers: faker.number.int({ min: 50, max: 5000 }),
      tournamentsHeld: faker.number.int({ min: 5, max: 50 }),
      achievementsUnlocked: faker.number.int({ min: 100, max: 5000 }),
    },
  } as unknown;
};

// ===============================
// LEADERBOARD FACTORIES
// ===============================

export const _createTestLeaderboard = (entryCount = 100): Leaderboard => {
  const leaderboardId = generateId('leaderboard');
  const entries: LeaderboardEntry[] = [];
  for (let i = 1; i <= entryCount; i++) {
    entries.push(createTestLeaderboardEntry(i));
  }

  return {
    id: leaderboardId,
    name: faker.helpers.arrayElement([
      'Global Rankings',
      'Weekly Champions',
      'Monthly Leaders',
      'Season Standings',
    ]),
    type: faker.helpers.arrayElement(['global', 'friends', 'team', 'regional']),
    period: faker.helpers.arrayElement(['all-time', 'monthly', 'weekly', 'daily']),
    entries,
    lastUpdated: generateTimestamp({ past: 1 }),
    totalEntries: entryCount,
    userRank: faker.number.int({ min: 1, max: entryCount }),
    category: faker.helpers.arrayElement([
      'points',
      'battles',
      'consistency',
      'achievements',
    ]),
  } as unknown;
};

export const _createTestLeaderboardEntry = (rank: number): LeaderboardEntry =>
  ({
    rank,
    userId: generateId('_user'),
    user: createTestUser(),
    score: faker.number.int({
      min: Math.max(1000 - rank * 10, 100),
      max: 10000 - rank * 50,
    }),
    change: faker.number.int({ min: -5, max: 5 }), // rank change from last period
    streak: faker.number.int({ min: 0, max: 30 }),
    achievements: faker.number.int({ min: 0, max: 50 }),
    lastActive: generateTimestamp({ past: 7 }),
  }) as unknown; // Battle-related factory functions to append to gaming-factories.ts

/**
 * Battle Factories
 */

export const _createTestBattle = (overrides: Partial<Battle> = {}): Battle => ({
  id: overrides.id || generateId('battle'),
  type: overrides.type || faker.helpers.arrayElement(['speed', 'consistency', 'tasks']),
  participants: overrides.participants || [
    createTestBattleParticipant(),
    createTestBattleParticipant(),
  ],
  creatorId: overrides.creatorId || generateId('_user'),
  status:
    overrides.status || faker.helpers.arrayElement(['pending', 'active', 'completed']),
  startTime:
    overrides.startTime ||
    new Date(Date.now() + faker.number.int({ min: 0, max: 86400000 })), // Within next 24 hours
  endTime:
    overrides.endTime ||
    new Date(Date.now() + faker.number.int({ min: 86400000, max: 604800000 })), // 1-7 days from now
  settings: overrides.settings || createTestBattleSettings(),
  winner: overrides.winner,
  createdAt: overrides.createdAt || generateTimestamp({ past: 7 }),
  maxParticipants: overrides.maxParticipants || faker.number.int({ min: 4, max: 20 }),
  minParticipants: overrides.minParticipants || 2,
  entryFee: overrides.entryFee || faker.number.int({ min: 0, max: 100 }),
  prizePool: overrides.prizePool || createTestBattlePrize(),
  trashTalk: overrides.trashTalk || [],
});

export const _createTestBattleParticipant = (
  overrides: Partial<BattleParticipant> = {}
): BattleParticipant => ({
  userId: overrides.userId || generateId('_user'),
  user: overrides.user || createTestUser(),
  joinedAt: overrides.joinedAt || generateTimestamp({ past: 7 }),
  progress:
    overrides.progress !== undefined
      ? overrides.progress
      : faker.number.int({ min: 0, max: 100 }),
  completedAt: overrides.completedAt,
  stats: overrides.stats || createTestBattleParticipantStats(),
});

export const _createTestBattleParticipantStats = (
  overrides: Partial<BattleParticipantStats> = {}
): BattleParticipantStats => ({
  wakeTime: overrides.wakeTime || faker.date.recent().toISOString(),
  tasksCompleted:
    overrides.tasksCompleted !== undefined
      ? overrides.tasksCompleted
      : faker.number.int({ min: 0, max: 10 }),
  snoozeCount:
    overrides.snoozeCount !== undefined
      ? overrides.snoozeCount
      : faker.number.int({ min: 0, max: 5 }),
  score:
    overrides.score !== undefined
      ? overrides.score
      : faker.number.int({ min: 0, max: 1000 }),
});

export const _createTestBattleSettings = (
  overrides: Partial<BattleSettings> = {}
): BattleSettings => ({
  duration: overrides.duration || 'PT24H', // 24 hours
  maxParticipants: overrides.maxParticipants || faker.number.int({ min: 4, max: 20 }),
  difficulty:
    overrides.difficulty ||
    faker.helpers.arrayElement(['easy', 'medium', 'hard', 'nightmare']),
});

export const _createTestBattlePrize = (
  overrides: Partial<BattlePrize> = {}
): BattlePrize => ({
  experience:
    overrides.experience !== undefined
      ? overrides.experience
      : faker.number.int({ min: 100, max: 1000 }),
  title: overrides.title || faker.helpers.maybe(() => faker.lorem.words(2)),
  badge: overrides.badge || faker.helpers.maybe(() => faker.lorem.word()),
  seasonPoints:
    overrides.seasonPoints !== undefined
      ? overrides.seasonPoints
      : faker.number.int({ min: 10, max: 100 }),
});

export const _createTestTrashTalkMessage = (
  overrides: Partial<TrashTalkMessage> = {}
): TrashTalkMessage => ({
  id: overrides.id || generateId('trash-talk'),
  battleId: overrides.battleId || generateId('battle'),
  userId: overrides.userId || generateId('_user'),
  user: overrides.user || createTestUser(),
  message:
    overrides.message ||
    faker.helpers.arrayElement([
      "You're going down!",
      "I've been training for this!",
      "Time to show you who's boss!",
      'Victory is mine!',
      'Ready to get schooled?',
      'Bring it on!',
      "I'm unstoppable!",
      "You don't stand a chance!",
    ]),
  timestamp: overrides.timestamp || new Date(),
});

export const _createTestRewardSystem = (
  overrides: Partial<RewardSystem> = {}
): RewardSystem => ({
  totalPoints: faker.number.int({ min: 100, max: 10000 }),
  level: faker.number.int({ min: 1, max: 50 }),
  currentStreak: faker.number.int({ min: 0, max: 30 }),
  longestStreak: faker.number.int({ min: 0, max: 100 }),
  unlockedRewards: [],
  availableRewards: [],
  habits: [],
  niche: {
    primary: 'work',
    confidence: 0.8,
    traits: [],
    preferences: {
      morningPerson: true,
      weekendSleeper: false,
      consistentSchedule: true,
      voiceMoodPreference: [],
    },
  },
  achievements: overrides.achievements || [],
  lastUpdated: overrides.lastUpdated || generateTimestamp({ past: 1 }),
});

// ===============================
// PUBLIC EXPORTS
// ===============================

// Achievement exports
export const createTestAchievement = _createTestAchievement;
export const createTestAchievementProgress = _createTestAchievementProgress;
export const createTestAchievementReward = _createTestAchievementReward;
export const createTestAchievementRequirement = _createTestAchievementRequirement;

// Tournament exports
export const createTestTournament = _createTestTournament;
export const createTestTournamentParticipant = _createTestTournamentParticipant;
export const createTestTournamentRounds = _createTestTournamentRounds;
export const createTestTournamentMatch = _createTestTournamentMatch;
export const createTestTournamentPrize = _createTestTournamentPrize;

// Team exports
export const createTestTeam = _createTestTeam;
export const createTestTeamMember = _createTestTeamMember;
export const createTestTeamStats = _createTestTeamStats;

// Season exports
export const createTestSeason = _createTestSeason;

// Leaderboard exports
export const createTestLeaderboard = _createTestLeaderboard;
export const createTestLeaderboardEntry = _createTestLeaderboardEntry;

// Battle exports
export const createTestBattle = _createTestBattle;
export const createTestBattleParticipant = _createTestBattleParticipant;
export const createTestBattleParticipantStats = _createTestBattleParticipantStats;
export const createTestBattleSettings = _createTestBattleSettings;
export const createTestBattlePrize = _createTestBattlePrize;
export const createTestTrashTalkMessage = _createTestTrashTalkMessage;
export const createTestRewardSystem = _createTestRewardSystem;
