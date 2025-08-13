// Enhanced Alarm interface combining both apps
export interface Alarm {
  id: string;
  userId: string;
  time: string; // HH:MM format
  label: string;
  enabled: boolean; // from Smart Alarm App
  isActive: boolean; // from Enhanced Battles (same as enabled)
  days: number[]; // 0-6, Sunday = 0 (Smart Alarm format)
  dayNames: DayOfWeek[]; // Enhanced Battles format for compatibility
  voiceMood: VoiceMood;
  sound: string; // Enhanced Battles sound system
  difficulty: AlarmDifficulty; // Enhanced Battles difficulty
  snoozeEnabled: boolean;
  snoozeInterval: number; // minutes
  snoozeCount: number;
  maxSnoozes?: number;
  lastTriggered?: Date;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Battle system integration
  battleId?: string;
  weatherEnabled?: boolean;
  smartFeatures?: SmartAlarmSettings;
}

export type VoiceMood = 
  | 'drill-sergeant' 
  | 'sweet-angel' 
  | 'anime-hero' 
  | 'savage-roast'
  | 'motivational'
  | 'gentle';

export interface VoiceMoodConfig {
  id: VoiceMood;
  name: string;
  description: string;
  icon: string;
  color: string;
  sample: string;
}

// Enhanced Battles alarm types
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type AlarmDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export interface AlarmInstance {
  id: string;
  alarmId: string;
  scheduledTime: string; // ISO date string
  actualWakeTime?: string; // ISO date string
  status: 'pending' | 'snoozed' | 'dismissed' | 'completed' | 'missed';
  snoozeCount: number;
  battleId?: string;
}

export interface AlarmEvent {
  id: string;
  alarmId: string;
  firedAt: Date;
  dismissed: boolean;
  snoozed: boolean;
  userAction: 'dismissed' | 'snoozed' | 'ignored';
  dismissMethod?: 'voice' | 'button' | 'shake';
}

// Enhanced User interface combining both apps
export interface User {
  id: string;
  email: string; // from Smart Alarm App
  name?: string; // Smart Alarm App
  username: string; // Enhanced Battles
  displayName: string; // Enhanced Battles
  avatar?: string;
  level: number;
  experience: number;
  joinDate: string;
  lastActive: string;
  preferences: UserPreferences;
  settings?: UserSettings; // Enhanced Battles settings
  stats?: UserStats; // Enhanced Battles stats
  createdAt: Date | string;
}

export interface UserStats {
  totalBattles: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  averageWakeTime: string;
  totalAlarmsSet: number;
  alarmsCompleted: number;
  snoozeCount: number;
}

// Enhanced User Preferences combining both apps
export interface UserPreferences {
  // Smart Alarm App preferences
  theme: 'light' | 'dark' | 'auto';
  notificationsEnabled: boolean;
  voiceDismissalSensitivity: number; // 1-10
  defaultVoiceMood: VoiceMood;
  hapticFeedback: boolean;
  snoozeMinutes: number;
  maxSnoozes: number;
  rewardsEnabled: boolean;
  aiInsightsEnabled: boolean;
  personalizedMessagesEnabled: boolean;
  shareAchievements: boolean;
  // Enhanced Battles preferences
  gameTheme?: Theme; // enhanced theme system
  battleNotifications?: boolean;
  friendRequests?: boolean;
  trashTalkEnabled?: boolean;
  autoJoinBattles?: boolean;
  smartFeaturesEnabled?: boolean;
  fitnessIntegration?: boolean;
  locationChallenges?: boolean;
  photoChallenges?: boolean;
}

export interface NotificationPermission {
  granted: boolean;
  requestedAt?: Date;
  deniedAt?: Date;
}

export interface MicrophonePermission {
  granted: boolean;
  requestedAt?: Date;
  deniedAt?: Date;
}

export interface AppState {
  user: User | null;
  alarms: Alarm[];
  activeAlarm: Alarm | null;
  permissions: {
    notifications: NotificationPermission;
    microphone: MicrophonePermission;
  };
  isOnboarding: boolean;
  currentView: 'dashboard' | 'alarms' | 'settings' | 'performance' | 'rewards' | 'alarm-ringing' | 'battles' | 'community';
  rewardSystem?: RewardSystem;
  // Enhanced Battles state
  activeBattles?: Battle[];
  friends?: FriendWithStats[];
  achievements?: Achievement[];
  tournaments?: Tournament[];
  teams?: Team[];
  currentSeason?: Season;
  theme?: Theme;
}

// Enhanced Alarm Form Data
export interface AlarmFormData {
  time: string;
  label: string;
  days: number[];
  voiceMood: VoiceMood;
  // Enhanced Battles additions
  difficulty?: AlarmDifficulty;
  sound?: string;
  snoozeEnabled?: boolean;
  snoozeInterval?: number;
  weatherEnabled?: boolean;
  battleEnabled?: boolean;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isValidResponse: boolean;
}

// Rewards System Types
export interface Reward {
  id: string;
  type: 'achievement' | 'streak' | 'milestone' | 'habit_boost' | 'niche_mastery';
  title: string;
  description: string;
  icon: string;
  category: RewardCategory;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlockedAt: Date;
  progress?: RewardProgress;
  aiInsight?: string;
  personalizedMessage?: string;
}

export type RewardCategory = 
  | 'consistency' 
  | 'early_riser' 
  | 'night_owl' 
  | 'productivity' 
  | 'wellness' 
  | 'social' 
  | 'explorer' 
  | 'master'
  | 'challenger';

export interface RewardProgress {
  current: number;
  target: number;
  percentage: number;
  nextMilestone?: string;
}

export interface UserHabit {
  id: string;
  pattern: 'morning_routine' | 'evening_routine' | 'workout_time' | 'work_schedule' | 'weekend_vibes' | 'custom';
  frequency: number; // times per week
  consistency: number; // 0-1 score
  improvement: number; // trend score
  niche: UserNiche;
  lastAnalyzed: Date;
}

export interface UserNiche {
  primary: 'fitness' | 'work' | 'study' | 'creative' | 'family' | 'health' | 'social' | 'spiritual';
  secondary?: UserNiche['primary'];
  confidence: number; // AI confidence 0-1
  traits: string[]; // AI-detected personality traits
  preferences: {
    morningPerson: boolean;
    weekendSleeper: boolean;
    consistentSchedule: boolean;
    voiceMoodPreference: VoiceMood[];
  };
}

export interface AIInsight {
  id: string;
  type: 'habit_analysis' | 'improvement_suggestion' | 'pattern_recognition' | 'reward_recommendation';
  title: string;
  message: string;
  confidence: number;
  actionable: boolean;
  suggestedActions?: string[];
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface RewardSystem {
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  unlockedRewards: Reward[];
  availableRewards: Reward[];
  habits: UserHabit[];
  niche: UserNiche;
  aiInsights: AIInsight[];
  lastAnalysis: Date;
  // Enhanced Battles integration
  achievements?: Achievement[];
  dailyChallenges?: DailyChallenge[];
  weeklyChallenges?: WeeklyChallenge[];
  experienceHistory?: ExperienceGain[];
  levelRewards?: LevelReward[];
}

// ============================================================================
// ENHANCED BATTLES TYPES - Gaming & Competition Features
// ============================================================================

// Theme Types
export type Theme = 'minimalist' | 'colorful' | 'dark';

// Battle Types
export type BattleType = 'speed' | 'consistency' | 'tasks' | 'bragging' | 'group' | 'tournament' | 'team';
export type BattleStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'registration';

export interface Battle {
  id: string;
  type: BattleType;
  participants: BattleParticipant[];
  creatorId: string;
  status: BattleStatus;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  settings: BattleSettings;
  winner?: string; // userId
  createdAt: string;
  // Enhanced battle fields
  tournamentId?: string;
  teamId?: string;
  seasonId?: string;
  maxParticipants?: number;
  minParticipants?: number;
  entryFee?: number; // XP cost to join
  prizePool?: BattlePrize;
}

export interface BattlePrize {
  experience: number;
  title?: string;
  badge?: string;
  seasonPoints?: number;
}

export interface BattleParticipant {
  userId: string;
  user: User;
  joinedAt: string;
  progress: number; // 0-100
  completedAt?: string;
  stats: BattleParticipantStats;
}

export interface BattleParticipantStats {
  wakeTime?: string;
  tasksCompleted: number;
  snoozeCount: number;
  score: number;
}

export interface BattleSettings {
  duration: string; // ISO duration string (e.g., "PT24H" for 24 hours)
  maxParticipants: number;
  tasks?: BattleTask[];
  speedTarget?: string; // time string for speed battles
  consistencyDays?: number; // for consistency battles
}

export interface BattleTask {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

// Community & Social Types
export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  acceptedAt?: string;
}

export interface FriendWithStats extends User {
  stats: UserStats;
  friendship: Friendship;
  isOnline: boolean;
  activeBattles: number;
}

export interface TrashTalkMessage {
  id: string;
  battleId: string;
  userId: string;
  user: User;
  message: string;
  timestamp: string;
}

// Achievement & Gamification Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  type: AchievementType;
  rarity: AchievementRarity;
  iconUrl: string;
  unlockedAt?: string;
  progress?: AchievementProgress;
  rewards: AchievementReward[];
  requirements: AchievementRequirement[];
}

export type AchievementCategory = 'wakeup' | 'battles' | 'social' | 'consistency' | 'challenges' | 'special';
export type AchievementType = 'milestone' | 'streak' | 'challenge' | 'social' | 'seasonal' | 'rare';
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
}

export interface AchievementReward {
  type: 'experience' | 'title' | 'badge' | 'avatar' | 'theme' | 'sound';
  value: number | string;
  description: string;
}

export interface AchievementRequirement {
  type: 'battles_won' | 'streak_days' | 'early_wake' | 'friends_added' | 'tournaments_won' | 'tasks_completed';
  value: number;
  description: string;
}

export interface DailyChallenge {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  description: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  target: number;
  progress: number;
  rewards: ChallengeReward[];
  completed: boolean;
  completedAt?: string;
  expiresAt: string;
}

export type ChallengeType = 'wake_early' | 'no_snooze' | 'battle_win' | 'friend_challenge' | 'task_master' | 'consistency' | 'social';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface ChallengeReward {
  type: 'experience' | 'badge' | 'title' | 'bonus_xp';
  value: number | string;
  description: string;
}

export interface WeeklyChallenge extends DailyChallenge {
  weekStart: string; // YYYY-MM-DD
  dailyProgress: DailyChallengeProgress[];
}

export interface DailyChallengeProgress {
  date: string;
  completed: boolean;
  progress: number;
}

export interface LevelReward {
  level: number;
  experience: number;
  rewards: LevelRewardItem[];
  unlocked: boolean;
  unlockedAt?: string;
}

export interface LevelRewardItem {
  type: 'title' | 'badge' | 'avatar' | 'theme' | 'sound' | 'feature';
  name: string;
  description: string;
  value: string;
  rarity: AchievementRarity;
}

export interface ExperienceGain {
  id: string;
  userId: string;
  amount: number;
  source: ExperienceSource;
  description: string;
  multiplier?: number;
  timestamp: string;
}

export type ExperienceSource = 'alarm_complete' | 'battle_win' | 'battle_participate' | 'challenge_complete' | 'achievement_unlock' | 'streak_bonus' | 'friend_referral' | 'daily_login';

export interface StreakBonus {
  days: number;
  multiplier: number;
  bonusXP: number;
  title?: string;
  badge?: string;
}

export interface PlayerLevel {
  current: number;
  experience: number;
  experienceToNext: number;
  experienceTotal: number;
  progress: number; // 0-100 to next level
}

// Tournament Types
export interface Tournament {
  id: string;
  name: string;
  description: string;
  type: 'single-elimination' | 'round-robin' | 'swiss';
  status: 'registration' | 'active' | 'completed';
  participants: TournamentParticipant[];
  maxParticipants: number;
  rounds: TournamentRound[];
  currentRound: number;
  winner?: string;
  prizePool: BattlePrize[];
  startTime: string;
  endTime: string;
  entryFee: number;
  seasonId?: string;
  createdAt: string;
}

export interface TournamentParticipant {
  userId: string;
  user: User;
  registeredAt: string;
  eliminated: boolean;
  currentRound: number;
  wins: number;
  losses: number;
}

export interface TournamentRound {
  id: string;
  roundNumber: number;
  battles: Battle[];
  status: 'pending' | 'active' | 'completed';
  startTime: string;
  endTime: string;
}

// Team Types
export interface Team {
  id: string;
  name: string;
  description: string;
  captainId: string;
  members: TeamMember[];
  maxMembers: number;
  isPublic: boolean;
  stats: TeamStats;
  createdAt: string;
  seasonId?: string;
}

export interface TeamMember {
  userId: string;
  user: User;
  role: 'captain' | 'member';
  joinedAt: string;
  contribution: TeamContribution;
}

export interface TeamContribution {
  battlesParticipated: number;
  battlesWon: number;
  totalScore: number;
  averagePerformance: number;
}

export interface TeamStats {
  totalBattles: number;
  wins: number;
  losses: number;
  winRate: number;
  rank: number;
  seasonPoints: number;
  averageScore: number;
}

// Season Types
export interface Season {
  id: string;
  name: string;
  description: string;
  status: 'upcoming' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  type: 'individual' | 'team' | 'mixed';
  leaderboard: SeasonRanking[];
  tournaments: Tournament[];
  rewards: SeasonReward[];
  theme: string;
  rules: string[];
}

export interface SeasonRanking {
  rank: number;
  userId?: string;
  teamId?: string;
  entity: User | Team;
  points: number;
  battlesWon: number;
  totalBattles: number;
  change: number; // position change from last update
}

export interface SeasonReward {
  rank: number;
  experience: number;
  title?: string;
  badge?: string;
  exclusiveContent?: string;
}

// Smart Features Types
export interface SmartAlarmSettings {
  weatherEnabled: boolean;
  locationEnabled: boolean;
  fitnessEnabled: boolean;
  smartWakeWindow: number; // minutes before alarm to start smart wake
  adaptiveDifficulty: boolean;
  contextualTasks: boolean;
  environmentalAdjustments: boolean;
}

export interface WeatherAlarm extends Alarm {
  weatherEnabled: boolean;
  weatherConditions: WeatherCondition[];
  weatherActions: WeatherAction[];
}

export interface WeatherCondition {
  type: 'rain' | 'snow' | 'sunny' | 'cloudy' | 'windy' | 'hot' | 'cold';
  operator: 'equals' | 'greater_than' | 'less_than';
  value?: number; // for temperature conditions
}

export interface WeatherAction {
  condition: WeatherCondition;
  action: 'adjust_time' | 'change_sound' | 'add_task' | 'send_notification';
  value: string | number;
  description: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: WeatherForecast[];
  location: string;
  lastUpdated: string;
}

export interface WeatherForecast {
  time: string;
  temperature: number;
  condition: string;
  precipitation: number;
}

// Location Challenge Types
export interface LocationChallenge {
  id: string;
  name: string;
  description: string;
  type: LocationChallengeType;
  targetLocation: Location;
  radius: number; // meters
  timeLimit?: number; // minutes
  rewards: ChallengeReward[];
  status: 'active' | 'completed' | 'failed' | 'expired';
  startedAt?: string;
  completedAt?: string;
  progress: LocationProgress;
}

export type LocationChallengeType = 'visit_place' | 'stay_duration' | 'distance_from_home' | 'elevation_gain' | 'speed_challenge';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

export interface LocationProgress {
  currentLocation?: Location;
  distanceToTarget?: number;
  timeInRadius?: number;
  elevationGained?: number;
  averageSpeed?: number;
}

// Fitness Integration Types
export interface FitnessIntegration {
  id: string;
  userId: string;
  provider: FitnessProvider;
  isConnected: boolean;
  lastSync: string;
  permissions: FitnessPermission[];
  data: FitnessData;
}

export type FitnessProvider = 'apple_health' | 'google_fit' | 'fitbit' | 'garmin' | 'strava' | 'polar';
export type FitnessPermission = 'steps' | 'sleep' | 'heart_rate' | 'activity' | 'distance' | 'calories';

export interface FitnessData {
  steps: number;
  sleepHours: number;
  heartRate?: number;
  activeMinutes: number;
  distance: number; // meters
  caloriesBurned: number;
  date: string;
}

export interface FitnessChallenge extends DailyChallenge {
  fitnessType: FitnessPermission;
  targetValue: number;
  currentValue: number;
  unit: string;
  integration: FitnessProvider;
}

// Enhanced Settings Types
export interface UserSettings {
  theme: Theme;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  alarm: AlarmSettings;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  battleChallenges: boolean;
  friendRequests: boolean;
  achievements: boolean;
  reminders: boolean;
  trashTalk: boolean;
}

export interface PrivacySettings {
  profileVisible: boolean;
  statsVisible: boolean;
  onlineStatus: boolean;
  allowFriendRequests: boolean;
}

export interface AlarmSettings {
  defaultSound: string;
  defaultSnoozeInterval: number;
  maxSnoozeCount: number;
  vibrationEnabled: boolean;
  gradualVolumeIncrease: boolean;
}

// Media & Content Types
export interface CustomSound {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  duration: number; // seconds
  category: SoundCategory;
  tags: string[];
  isCustom: boolean;
  uploadedBy?: string;
  uploadedAt?: string;
  downloads?: number;
  rating?: number;
}

export type SoundCategory = 'nature' | 'music' | 'voice' | 'mechanical' | 'ambient' | 'energetic' | 'calm' | 'custom';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  sounds: PlaylistSound[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  playCount: number;
  likeCount: number;
  shareCount: number;
}

export interface PlaylistSound {
  soundId: string;
  sound: CustomSound;
  order: number;
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
  volume?: number; // 0-1
}

export interface MotivationalQuote {
  id: string;
  text: string;
  author?: string;
  category: QuoteCategory;
  tags: string[];
  isCustom: boolean;
  submittedBy?: string;
  submittedAt?: string;
  likes: number;
  uses: number;
}

export type QuoteCategory = 'motivation' | 'inspiration' | 'success' | 'health' | 'productivity' | 'mindfulness' | 'humor' | 'custom';

export interface PhotoChallenge {
  id: string;
  name: string;
  description: string;
  category: PhotoChallengeCategory;
  difficulty: ChallengeDifficulty;
  prompts: PhotoPrompt[];
  timeLimit?: number; // minutes
  rewards: ChallengeReward[];
  examples?: PhotoExample[];
  createdBy: string;
  createdAt: string;
  popularity: number;
  completionRate: number;
}

export type PhotoChallengeCategory = 'selfie' | 'environment' | 'task_proof' | 'creative' | 'location' | 'fitness' | 'food' | 'pets';

export interface PhotoPrompt {
  id: string;
  text: string;
  optional: boolean;
  hints?: string[];
  validationRules?: PhotoValidationRule[];
}

export interface PhotoValidationRule {
  type: 'face_detection' | 'object_detection' | 'location_check' | 'timestamp_check' | 'lighting_check';
  parameters: Record<string, any>;
  required: boolean;
}

export interface PhotoExample {
  id: string;
  imageUrl: string;
  description: string;
  rating: number;
}

// Quest & Ranking Types
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  target: number;
  progress: number;
  reward: QuestReward;
  expiresAt?: string;
  completedAt?: string;
}

export type QuestType = 'daily' | 'weekly' | 'monthly' | 'achievement';

export interface QuestReward {
  experience: number;
  title?: string;
  badge?: string;
}

export interface RankingEntry {
  rank: number;
  user: User;
  score: number;
  change: number; // position change since last period
}

export interface Rankings {
  global: RankingEntry[];
  friends: RankingEntry[];
  weekly: RankingEntry[];
  monthly: RankingEntry[];
}

// Notification Types (Enhanced)
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

export type NotificationType = 'battle_challenge' | 'battle_result' | 'friend_request' | 'achievement' | 'quest_complete' | 'reminder';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}