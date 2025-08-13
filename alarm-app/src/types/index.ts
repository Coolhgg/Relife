export interface Alarm {
  id: string;
  userId?: string;
  time: string; // HH:MM format
  label: string;
  enabled: boolean;
  days: number[]; // 0-6, Sunday = 0
  voiceMood: VoiceMood;
  snoozeCount: number;
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
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

export interface AlarmEvent {
  id: string;
  alarmId: string;
  firedAt: Date;
  dismissed: boolean;
  snoozed: boolean;
  userAction: 'dismissed' | 'snoozed' | 'ignored';
  dismissMethod?: 'voice' | 'button' | 'shake';
}

export interface User {
  id: string;
  email: string;
  name?: string;
  preferences: UserPreferences;
  createdAt: Date;
}

export interface UserPreferences {
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
  currentView: 'dashboard' | 'alarms' | 'settings' | 'performance' | 'rewards' | 'alarm-ringing';
  rewardSystem?: RewardSystem;
}

export interface AlarmFormData {
  time: string;
  label: string;
  days: number[];
  voiceMood: VoiceMood;
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
}