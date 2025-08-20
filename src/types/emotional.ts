// Emotional Intelligence Types for Relife Smart Alarm
// Integrates with existing voice mood system and user preferences

export type EmotionType =
  | 'happy'
  | 'sad'
  | 'worried'
  | 'excited'
  | 'lonely'
  | 'proud'
  | 'sleepy';

export type EmotionalTone = 'encouraging' | 'playful' | 'firm' | 'roast';

export type EscalationLevel =
  | 'gentle'
  | 'slightly_emotional'
  | 'strong_emotional'
  | 'social_pressure'
  | 'major_reset';

export interface EmotionalContext {
  daysSinceLastUse: number;
  missedAlarms: number;
  brokenStreaks: number;
  socialActivity: number;
  achievements: number;
  sleepPatterns: 'good' | 'poor' | 'inconsistent';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weekday: boolean;
  previousEmotionalResponses: EmotionalResponse[];
}

export interface EmotionalState {
  emotion: EmotionType;
  intensity: number; // 1-10 scale
  context: EmotionalContext;
  confidence: number; // 0-1 scale, how confident we are in this emotion
  triggers: string[]; // What caused this emotional state
  recommendedTone: EmotionalTone;
}

export interface EmotionalMessage {
  id: string;
  emotion: EmotionType;
  tone: EmotionalTone;
  template: string;
  variables: Record<string, any>;
  personalizedMessage: string;
  effectiveness: number; // Running average effectiveness score
  usageCount: number;
  lastUsed?: Date;
}

export interface EmotionalResponse {
  messageId: string;
  emotion: EmotionType;
  tone: EmotionalTone;
  notificationOpened: boolean;
  actionTaken: 'dismissed' | 'snoozed' | 'opened_app' | 'completed_task' | 'none';
  timeToResponse?: number; // milliseconds
  effectivenessRating?: number; // 1-5 user rating
  timestamp: Date;
}

export interface UserEmotionalProfile {
  userId: string;
  preferredTones: EmotionalTone[];
  avoidedTones: EmotionalTone[];
  mostEffectiveEmotions: EmotionType[];
  responsePatterns: {
    bestTimeToSend: string; // HH:mm format
    averageResponseTime: number;
    preferredEscalationSpeed: 'slow' | 'medium' | 'fast';
  };
  emotionalHistory: EmotionalState[];
  lastAnalyzed: Date;
}

export interface EmotionalNotificationPayload {
  userId: string;
  emotion: EmotionType;
  tone: EmotionalTone;
  message: EmotionalMessage;
  scheduledFor: Date;
  escalationLevel: EscalationLevel;
  deepLink?: string;
  largeImage?: string;
  vibrationPattern?: number[];
  requireInteraction: boolean;
  metadata: {
    experiment?: string; // For A/B testing
    version: string;
    analysisConfidence: number;
  };
}

// Integration with existing voice mood system
export const VOICE_MOOD_TO_EMOTIONAL_TONE: Record<string, EmotionalTone> = {
  'drill-sergeant': 'firm',
  'sweet-angel': 'encouraging',
  'anime-hero': 'playful',
  'savage-roast': 'roast',
  motivational: 'encouraging',
  gentle: 'encouraging',
};

// Notification categories for integration with existing push service
export const EMOTIONAL_NOTIFICATION_CATEGORIES = {
  COMEBACK: 'emotional_comeback',
  CELEBRATION: 'emotional_celebration',
  GENTLE_NUDGE: 'emotional_nudge',
  ACHIEVEMENT: 'emotional_achievement',
  STREAK_WARNING: 'emotional_streak_warning',
} as const;

export type EmotionalNotificationCategory =
  (typeof EMOTIONAL_NOTIFICATION_CATEGORIES)[keyof typeof EMOTIONAL_NOTIFICATION_CATEGORIES];
