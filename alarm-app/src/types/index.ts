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
  currentView: 'dashboard' | 'alarms' | 'settings' | 'alarm-ringing';
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