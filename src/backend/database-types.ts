// Database Result Type Definitions for Backend
// Comprehensive TypeScript interfaces for all database query results

export interface DatabaseUser {
  id: string;
  email: string;
  created_at: string;
  last_active: string;
  preferences?: any;
}

export interface DatabaseAlarm {
  id: string;
  user_id: string;
  time: string;
  enabled: boolean;
  label?: string;
  days?: string;
  sound?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseAlarmEvent {
  id: string;
  alarm_id: string;
  user_id: string;
  triggered_at: string;
  dismissed_at?: string;
  snoozed?: boolean;
  effectiveness_score?: number;
  device_info?: any;
  context?: any;
}

export interface DatabaseAnalyticsEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: any;
  timestamp: string;
  session_id?: string;
  device_type?: string;
}

export interface DatabaseUserStats {
  user_id: string;
  total_alarms: number;
  active_alarms: number;
  completion_rate: number;
  current_streak: number;
  longest_streak: number;
  avg_effectiveness: number;
  last_alarm_time?: string;
  total_score: number;
  level: number;
}

export interface DatabaseEmotionalProfile {
  user_id: string;
  emotional_state: string;
  preferred_tone: string;
  message_effectiveness: any;
  escalation_level: number;
  last_updated: string;
  context_preferences: any;
}

export interface DatabaseBattleStats {
  user_id: string;
  battles_won: number;
  battles_lost: number;
  current_rank: string;
  points: number;
  achievements: any;
  last_battle_time?: string;
}

export interface DatabasePerformanceMetric {
  id: string;
  user_id: string;
  metric_type: string;
  value: number;
  timestamp: string;
  device_type?: string;
  network_type?: string;
  additional_data?: any;
}

export interface DatabaseDeploymentData {
  deployment_id: string;
  version: string;
  environment: string;
  timestamp: string;
  status: string;
  health_score?: number;
}

export interface DatabaseHealthData {
  deployment_id: string;
  timestamp: string;
  status: string;
  health_score: number;
  metrics: any;
  errors: any;
}

export interface DatabaseAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface DatabaseRecommendation {
  user_id: string;
  recommendation_type: string;
  content: string;
  confidence_score: number;
  created_at: string;
  applied: boolean;
}

export interface DatabaseVoiceAnalysis {
  id: string;
  user_id: string;
  audio_data: string;
  analysis_result: any;
  mood_detected: string;
  confidence: number;
  timestamp: string;
}

// Utility type for generic database operations
export interface DatabaseQueryResult<T = any> {
  success: boolean;
  results: T[];
  meta: {
    duration: number;
    changes: number;
    last_row_id: number;
  };
}

// Type guards for runtime type checking
export function isDatabaseUser(obj: unknown): obj is DatabaseUser {
  return (
    typeof obj === "object" && obj !== null && "id" in obj && "email" in obj
  );
}

export function isDatabaseAlarm(obj: unknown): obj is DatabaseAlarm {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "user_id" in obj &&
    "time" in obj
  );
}

export function isDatabaseAlarmEvent(obj: unknown): obj is DatabaseAlarmEvent {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "alarm_id" in obj &&
    "user_id" in obj
  );
}

export function isNumeric(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function isStringValue(value: unknown): value is string {
  return typeof value === "string";
}

// Safe type casting utilities
export function asNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
}

export function asString(value: unknown, fallback: string = ""): string {
  if (typeof value === "string") return value;
  if (value !== null && value !== undefined) return String(value);
  return fallback;
}

export function asObject(value: unknown, fallback: any = {}): any {
  if (typeof value === "object" && value !== null) return value;
  return fallback;
}
