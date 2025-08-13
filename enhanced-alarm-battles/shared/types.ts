// Theme Types
export type Theme = 'minimalist' | 'colorful' | 'dark';

// User & Profile Types
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
  experience: number;
  joinDate: string;
  lastActive: string;
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

// Alarm Types
export interface Alarm {
  id: string;
  userId: string;
  time: string; // HH:MM format
  days: DayOfWeek[];
  label: string;
  isActive: boolean;
  sound: string;
  snoozeEnabled: boolean;
  snoozeInterval: number; // minutes
  difficulty: AlarmDifficulty;
  createdAt: string;
  updatedAt: string;
}

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

// Community Types
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

// Quest Types
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

// Ranking Types
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

// Notification Types
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

// Settings Types
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

// Gamification Types
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

export interface SmartAlarmSettings {
  weatherEnabled: boolean;
  locationEnabled: boolean;
  fitnessEnabled: boolean;
  smartWakeWindow: number; // minutes before alarm to start smart wake
  adaptiveDifficulty: boolean;
  contextualTasks: boolean;
  environmentalAdjustments: boolean;
}

export interface ContextualTask {
  id: string;
  description: string;
  type: ContextualTaskType;
  triggers: TaskTrigger[];
  difficulty: AlarmDifficulty;
  estimatedTime: number; // seconds
}

export type ContextualTaskType = 'weather_check' | 'traffic_check' | 'calendar_check' | 'fitness_goal' | 'location_visit' | 'photo_challenge';

export interface TaskTrigger {
  type: 'weather' | 'location' | 'time' | 'fitness' | 'calendar';
  condition: string;
  value: string | number;
}

// AI & Automation Types
export interface AIOptimization {
  id: string;
  userId: string;
  type: AIOptimizationType;
  isEnabled: boolean;
  confidence: number; // 0-1
  recommendations: AIRecommendation[];
  learningData: LearningData;
  lastOptimized: string;
}

export type AIOptimizationType = 'wake_time' | 'difficulty' | 'sound_selection' | 'task_generation' | 'battle_matching' | 'sleep_cycle';

export interface AIRecommendation {
  id: string;
  type: AIOptimizationType;
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  action: AIAction;
  appliedAt?: string;
}

export interface AIAction {
  type: 'adjust_time' | 'change_difficulty' | 'suggest_sound' | 'create_task' | 'modify_setting';
  parameters: Record<string, any>;
  reversible: boolean;
}

export interface LearningData {
  sleepPatterns: SleepPattern[];
  wakeUpBehavior: WakeUpBehavior[];
  battlePerformance: BattlePerformanceData[];
  userPreferences: UserPreference[];
  contextualFactors: ContextualFactor[];
}

export interface SleepPattern {
  date: string;
  bedTime: string;
  wakeTime: string;
  sleepQuality: number; // 1-10
  sleepDuration: number; // hours
  sleepEfficiency: number; // percentage
  deepSleepPercentage: number;
  remSleepPercentage: number;
}

export interface WakeUpBehavior {
  date: string;
  alarmTime: string;
  actualWakeTime: string;
  snoozeCount: number;
  difficulty: AlarmDifficulty;
  completionTime: number; // seconds
  mood: WakeUpMood;
  environment: WakeUpEnvironment;
}

export type WakeUpMood = 'excellent' | 'good' | 'neutral' | 'tired' | 'grumpy';

export interface WakeUpEnvironment {
  weather: string;
  temperature: number;
  lightLevel: number;
  noiseLevel: number;
  dayOfWeek: DayOfWeek;
}

export interface BattlePerformanceData {
  battleId: string;
  date: string;
  battleType: BattleType;
  difficulty: AlarmDifficulty;
  result: 'won' | 'lost' | 'draw';
  score: number;
  completionTime: number;
  mistakes: number;
  timeOfDay: string;
  mood: WakeUpMood;
}

export interface UserPreference {
  category: 'sound' | 'difficulty' | 'timing' | 'tasks' | 'social';
  key: string;
  value: any;
  confidence: number;
  lastUpdated: string;
}

export interface ContextualFactor {
  type: 'weather' | 'calendar' | 'location' | 'fitness' | 'social';
  value: any;
  impact: number; // -1 to 1
  date: string;
}

export interface PersonalizedChallenge {
  id: string;
  userId: string;
  generatedBy: 'ai' | 'user' | 'friend';
  difficulty: AlarmDifficulty;
  type: ChallengeType;
  adaptiveElements: AdaptiveElement[];
  personalizedFor: PersonalizationFactor[];
  expectedSuccessRate: number;
  actualPerformance?: ChallengePerformance;
  createdAt: string;
}

export interface AdaptiveElement {
  type: 'dynamic_difficulty' | 'contextual_tasks' | 'personalized_rewards' | 'social_pressure';
  parameters: Record<string, any>;
  adaptationRule: AdaptationRule;
}

export interface AdaptationRule {
  trigger: 'success_rate' | 'time_of_day' | 'mood' | 'performance_trend';
  condition: string;
  action: string;
  parameters: Record<string, any>;
}

export interface PersonalizationFactor {
  type: 'sleep_chronotype' | 'performance_history' | 'motivation_style' | 'social_preference' | 'goal_orientation';
  value: string | number;
  weight: number; // 0-1
}

export interface ChallengePerformance {
  completed: boolean;
  score: number;
  timeSpent: number;
  mistakesMade: number;
  hintsUsed: number;
  mood: WakeUpMood;
  feedback?: string;
}

export interface SmartAutomation {
  id: string;
  userId: string;
  name: string;
  description: string;
  isEnabled: boolean;
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
  conditions: AutomationCondition[];
  schedule?: AutomationSchedule;
  lastExecuted?: string;
  executionCount: number;
}

export interface AutomationTrigger {
  type: 'time' | 'weather' | 'sleep_score' | 'battle_result' | 'location' | 'fitness_goal';
  condition: string;
  value: any;
}

export interface AutomationAction {
  type: 'adjust_alarm' | 'create_challenge' | 'send_notification' | 'update_setting' | 'suggest_battle';
  parameters: Record<string, any>;
  delay?: number; // seconds
}

export interface AutomationCondition {
  type: 'and' | 'or' | 'not';
  rules: AutomationRule[];
}

export interface AutomationRule {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
}

export interface AutomationSchedule {
  days: DayOfWeek[];
  timeRange?: { start: string; end: string };
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
  maxExecutions?: number;
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

export interface PhotoSubmission {
  id: string;
  challengeId: string;
  userId: string;
  imageUrl: string;
  caption?: string;
  submittedAt: string;
  validationResults: ValidationResult[];
  approved: boolean;
  score?: number;
  feedback?: string;
}

export interface ValidationResult {
  ruleId: string;
  passed: boolean;
  confidence: number;
  details?: string;
}

export interface MediaLibrary {
  id: string;
  userId: string;
  sounds: CustomSound[];
  playlists: Playlist[];
  quotes: MotivationalQuote[];
  photos: UserPhoto[];
  storage: StorageInfo;
}

export interface UserPhoto {
  id: string;
  fileName: string;
  imageUrl: string;
  thumbnailUrl: string;
  uploadedAt: string;
  tags: string[];
  challengeId?: string;
  isPublic: boolean;
}

export interface StorageInfo {
  used: number; // bytes
  total: number; // bytes
  percentage: number;
}

export interface ContentPreferences {
  defaultSoundCategory: SoundCategory;
  preferredQuoteCategories: QuoteCategory[];
  autoPlayPlaylists: boolean;
  quotesEnabled: boolean;
  photoChallengesEnabled: boolean;
  contentSharing: boolean;
  nsfw: boolean;
}

export interface ContentModerationResult {
  approved: boolean;
  flagged: boolean;
  reasons: string[];
  confidence: number;
  reviewRequired: boolean;
}