/**
 * Backend API Interface Definitions
 * Comprehensive typing for internal backend services
 */

import { ApiResponse, PaginationParams, PaginatedResponse } from '../api';

// =============================================================================
// User Management Interfaces
// =============================================================================

/**
 * User profile interface
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  preferences: UserPreferences;
  subscription: UserSubscription;
  stats: UserStats;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isVerified: boolean;
  timezone?: string;
  locale?: string;
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
    vibration: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    shareStats: boolean;
    allowBattleInvites: boolean;
  };
  alarm: {
    defaultSound: string;
    defaultVolume: number;
    snoozeMinutes: number;
    maxSnoozes: number;
  };
  language: string;
  timeFormat: '12h' | '24h';
  weekStartDay: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * User subscription details
 */
export interface UserSubscription {
  tier: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: string;
  features: string[];
}

/**
 * User statistics
 */
export interface UserStats {
  totalAlarms: number;
  activeAlarms: number;
  completedAlarms: number;
  missedAlarms: number;
  streakCurrent: number;
  streakBest: number;
  battlesWon: number;
  battlesLost: number;
  battlesTotal: number;
  achievementsUnlocked: string[];
  totalPointsEarned: number;
  averageWakeTime: string;
  consistency: number;
}

// =============================================================================
// Alarm System Interfaces
// =============================================================================

/**
 * Alarm interface
 */
export interface Alarm {
  id: string;
  userId: string;
  name: string;
  time: string;
  days: DayOfWeek[];
  enabled: boolean;
  sound: AlarmSound;
  volume: number;
  snooze: SnoozeSettings;
  battle: BattleSettings;
  recurring: boolean;
  timezone?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  nextTrigger?: string;
  lastTriggered?: string;
}

/**
 * Day of week enum
 */
export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

/**
 * Alarm sound configuration
 */
export interface AlarmSound {
  id: string;
  name: string;
  url: string;
  duration?: number;
  category: 'gentle' | 'nature' | 'classic' | 'upbeat' | 'custom';
  isPremium: boolean;
  fadeIn?: boolean;
  fadeInDuration?: number;
}

/**
 * Snooze settings
 */
export interface SnoozeSettings {
  enabled: boolean;
  duration: number;
  maxCount: number;
  progressiveIncrease: boolean;
}

/**
 * Battle settings
 */
export interface BattleSettings {
  enabled: boolean;
  autoJoin: boolean;
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'extreme';
  challengeTypes: BattleChallengeType[];
}

/**
 * Battle challenge types
 */
export type BattleChallengeType = 
  | 'photo_proof'
  | 'location_check'
  | 'math_problem'
  | 'memory_game'
  | 'physical_exercise'
  | 'mindfulness_minute'
  | 'habit_check'
  | 'social_share';

/**
 * Alarm event log
 */
export interface AlarmEvent {
  id: string;
  alarmId: string;
  userId: string;
  type: AlarmEventType;
  timestamp: string;
  metadata: AlarmEventMetadata;
}

/**
 * Alarm event types
 */
export type AlarmEventType = 
  | 'triggered'
  | 'snoozed'
  | 'dismissed'
  | 'missed'
  | 'battle_won'
  | 'battle_lost'
  | 'battle_abandoned';

/**
 * Alarm event metadata
 */
export interface AlarmEventMetadata {
  snoozeCount?: number;
  snoozeDuration?: number;
  wakeTime?: string;
  battleResult?: {
    challengeType: BattleChallengeType;
    score: number;
    completionTime: number;
    difficulty: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  weather?: {
    temperature: number;
    condition: string;
    humidity: number;
  };
}

// =============================================================================
// Battle System Interfaces
// =============================================================================

/**
 * Battle interface
 */
export interface Battle {
  id: string;
  name: string;
  description?: string;
  type: BattleType;
  creatorId: string;
  status: BattleStatus;
  participants: BattleParticipant[];
  settings: BattleSettings;
  prize: BattlePrize;
  schedule: BattleSchedule;
  rules: BattleRules;
  leaderboard: BattleLeaderboard;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
}

/**
 * Battle types
 */
export type BattleType = 
  | 'quick_challenge'
  | 'daily_duel'
  | 'weekly_warrior'
  | 'tournament'
  | 'team_battle'
  | 'custom';

/**
 * Battle status
 */
export type BattleStatus = 
  | 'waiting'
  | 'starting'
  | 'active'
  | 'completed'
  | 'canceled'
  | 'abandoned';

/**
 * Battle participant
 */
export interface BattleParticipant {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  joinedAt: string;
  status: ParticipantStatus;
  wakeTime?: string;
  proofSubmissions: ProofSubmission[];
  score: number;
  rank?: number;
  achievements: string[];
}

/**
 * Participant status
 */
export type ParticipantStatus = 
  | 'joined'
  | 'ready'
  | 'active'
  | 'completed'
  | 'failed'
  | 'disqualified'
  | 'abandoned';

/**
 * Proof submission
 */
export interface ProofSubmission {
  id: string;
  type: BattleChallengeType;
  data: unknown;
  timestamp: string;
  verified: boolean;
  score: number;
  verificationMethod: 'automatic' | 'peer_review' | 'admin_review';
}

/**
 * Battle prize
 */
export interface BattlePrize {
  type: 'points' | 'badges' | 'premium_days' | 'custom';
  value: number;
  distribution: 'winner_takes_all' | 'top_three' | 'all_participants';
  customRewards?: Array<{
    rank: number;
    reward: string;
    value: number;
  }>;
}

/**
 * Battle schedule
 */
export interface BattleSchedule {
  startTime: string;
  endTime?: string;
  duration?: number;
  timeZone: string;
  recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly';
    endDate?: string;
    occurrences?: number;
  };
}

/**
 * Battle rules
 */
export interface BattleRules {
  maxParticipants?: number;
  minParticipants?: number;
  challengeTypes: BattleChallengeType[];
  difficultyLevel: string;
  allowLateJoin: boolean;
  allowSpectators: boolean;
  penaltyForMissing: number;
  bonusForEarlyWake: number;
  teamSize?: number;
}

/**
 * Battle leaderboard
 */
export interface BattleLeaderboard {
  entries: Array<{
    rank: number;
    participant: BattleParticipant;
    score: number;
    completionTime?: number;
    streak?: number;
  }>;
  lastUpdated: string;
}

// =============================================================================
// Tournament System Interfaces
// =============================================================================

/**
 * Tournament interface
 */
export interface Tournament {
  id: string;
  name: string;
  description?: string;
  format: TournamentFormat;
  status: TournamentStatus;
  schedule: TournamentSchedule;
  participants: TournamentParticipant[];
  brackets: TournamentBracket[];
  prizePool: TournamentPrizePool;
  rules: TournamentRules;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tournament formats
 */
export type TournamentFormat = 
  | 'single_elimination'
  | 'double_elimination'
  | 'round_robin'
  | 'swiss_system'
  | 'ladder'
  | 'custom';

/**
 * Tournament status
 */
export type TournamentStatus = 
  | 'registration_open'
  | 'registration_closed'
  | 'starting'
  | 'in_progress'
  | 'completed'
  | 'canceled';

/**
 * Tournament schedule
 */
export interface TournamentSchedule {
  registrationStart: string;
  registrationEnd: string;
  tournamentStart: string;
  tournamentEnd: string;
  phases: Array<{
    name: string;
    startTime: string;
    endTime: string;
    description?: string;
  }>;
}

/**
 * Tournament participant
 */
export interface TournamentParticipant {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  seed?: number;
  currentRound: number;
  wins: number;
  losses: number;
  score: number;
  eliminated: boolean;
}

/**
 * Tournament bracket
 */
export interface TournamentBracket {
  id: string;
  round: number;
  matches: TournamentMatch[];
}

/**
 * Tournament match
 */
export interface TournamentMatch {
  id: string;
  participant1: TournamentParticipant;
  participant2: TournamentParticipant;
  winner?: TournamentParticipant;
  status: 'scheduled' | 'active' | 'completed' | 'canceled';
  scheduledTime: string;
  battle?: Battle;
}

/**
 * Tournament prize pool
 */
export interface TournamentPrizePool {
  total: number;
  currency: 'points' | 'premium_days' | 'usd';
  distribution: Array<{
    position: string;
    percentage: number;
    amount: number;
  }>;
}

/**
 * Tournament rules
 */
export interface TournamentRules {
  maxParticipants: number;
  minParticipants: number;
  entryFee?: number;
  battleFormat: BattleType;
  eliminationCriteria: string;
  tieBreakers: string[];
}

// =============================================================================
// Request/Response Interfaces
// =============================================================================

/**
 * Create user request
 */
export interface CreateUserRequest {
  email: string;
  name?: string;
  password?: string;
  preferences?: Partial<UserPreferences>;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  name?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
  timezone?: string;
  locale?: string;
}

/**
 * Create alarm request
 */
export interface CreateAlarmRequest {
  name: string;
  time: string;
  days: DayOfWeek[];
  enabled?: boolean;
  sound?: Partial<AlarmSound>;
  volume?: number;
  snooze?: Partial<SnoozeSettings>;
  battle?: Partial<BattleSettings>;
  recurring?: boolean;
  timezone?: string;
}

/**
 * Update alarm request
 */
export interface UpdateAlarmRequest extends Partial<CreateAlarmRequest> {
  id: string;
}

/**
 * Alarm filters
 */
export interface AlarmFilters extends PaginationParams {
  enabled?: boolean;
  battleEnabled?: boolean;
  recurring?: boolean;
  upcoming?: boolean;
  soundCategory?: string;
}

/**
 * Create battle request
 */
export interface CreateBattleRequest {
  name: string;
  description?: string;
  type: BattleType;
  settings: Partial<BattleSettings>;
  prize?: Partial<BattlePrize>;
  schedule: BattleSchedule;
  rules?: Partial<BattleRules>;
}

/**
 * Join battle request
 */
export interface JoinBattleRequest {
  battleId: string;
  message?: string;
}

/**
 * Submit battle proof request
 */
export interface SubmitBattleProofRequest {
  battleId: string;
  proof: {
    type: BattleChallengeType;
    data: unknown;
    timestamp?: string;
  };
}

// =============================================================================
// Service Response Interfaces
// =============================================================================

export interface BackendServiceResponse<T> extends ApiResponse<T> {
  requestId: string;
  processingTime: number;
}

export interface UserServiceResponses {
  user: BackendServiceResponse<User>;
  users: BackendServiceResponse<PaginatedResponse<User>>;
  userStats: BackendServiceResponse<UserStats>;
}

export interface AlarmServiceResponses {
  alarm: BackendServiceResponse<Alarm>;
  alarms: BackendServiceResponse<PaginatedResponse<Alarm>>;
  alarmEvents: BackendServiceResponse<PaginatedResponse<AlarmEvent>>;
  alarmSounds: BackendServiceResponse<AlarmSound[]>;
}

export interface BattleServiceResponses {
  battle: BackendServiceResponse<Battle>;
  battles: BackendServiceResponse<PaginatedResponse<Battle>>;
  battleParticipants: BackendServiceResponse<BattleParticipant[]>;
  battleLeaderboard: BackendServiceResponse<BattleLeaderboard>;
}

export interface TournamentServiceResponses {
  tournament: BackendServiceResponse<Tournament>;
  tournaments: BackendServiceResponse<PaginatedResponse<Tournament>>;
  tournamentBrackets: BackendServiceResponse<TournamentBracket[]>;
}