/**
 * Advanced Alarm Scheduling Type Definitions
 * Comprehensive interfaces for complex alarm scheduling features
 */

// Recurrence Pattern Interface
export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number; // Every N days/weeks/months
  daysOfWeek?: number[]; // 0-6 where 0 = Sunday
  daysOfMonth?: number[]; // 1-31
  endDate?: Date;
  endAfter?: number; // End after N occurrences
  exceptions?: Date[]; // Dates to skip
}

// Conditional Rules Interface
export interface ConditionalRule {
  id: string;
  name: string;
  condition: {
    type: 'weather' | 'location' | 'calendar' | 'sleep' | 'health' | 'custom';
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
    value: string | number | boolean | [number, number];
    source?: string; // API endpoint or data source
  };
  action: {
    type: 'adjust_time' | 'disable' | 'change_sound' | 'add_notification' | 'custom';
    parameters: Record<string, any>;
  };
  priority: number; // Higher priority rules execute first
  enabled: boolean;
}

// Location Trigger Interface
export interface LocationTrigger {
  id: string;
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number; // Radius in meters
  action: {
    type: 'enable' | 'disable' | 'adjust_time' | 'notification';
    parameters: {
      minutes?: number; // for adjust_time actions
      message?: string; // for notification actions
      notificationType?: 'alert' | 'banner' | 'sound';
    };
  };
  trigger: 'enter' | 'exit' | 'dwell'; // When to trigger
  dwellTime?: number; // Required dwell time in minutes for 'dwell' trigger
  enabled: boolean;
}

// Smart Optimization Interface
export interface SmartOptimization {
  enabled: boolean;
  learningMode: 'passive' | 'active' | 'adaptive';
  optimizations: {
    sleepCycleDetection: boolean;
    weatherAdjustment: boolean;
    trafficConsideration: boolean;
    calendarIntegration: boolean;
    healthDataIntegration: boolean;
  };
  personalizedSettings: {
    optimalWakeWindow: number; // Minutes before/after scheduled time
    snoozeBehaviorLearning: boolean;
    difficultyAdjustment: boolean;
    soundPreferenceLearning: boolean;
  };
  dataRetention: number; // Days to keep learning data
}

// Seasonal Adjustment Interface
export interface SeasonalAdjustment {
  enabled: boolean;
  adjustments: {
    spring?: TimeAdjustment;
    summer?: TimeAdjustment;
    autumn?: TimeAdjustment;
    winter?: TimeAdjustment;
  };
  transitionPeriod: number; // Days to gradually adjust
  location?: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
}

// Time Adjustment Helper Interface
interface TimeAdjustment {
  offsetMinutes: number; // Positive = later, negative = earlier
  enabled: boolean;
  startDate?: string; // MM-DD format for manual seasonal definitions
  endDate?: string; // MM-DD format
}

// Calendar Integration Interface
export interface CalendarIntegration {
  enabled: boolean;
  providers: {
    google?: CalendarProvider;
    outlook?: CalendarProvider;
    icloud?: CalendarProvider;
    exchange?: CalendarProvider;
  };
  rules: CalendarRule[];
  defaultLookahead: number; // Days to look ahead for events
}

// Calendar Provider Configuration
interface CalendarProvider {
  enabled: boolean;
  credentials?: {
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
  };
  calendars: string[]; // Calendar IDs to monitor
  syncFrequency: number; // Minutes between syncs
}

// Calendar Rule Interface
interface CalendarRule {
  id: string;
  name: string;
  eventCriteria: {
    titleContains?: string[];
    locationContains?: string[];
    attendeeCount?: number;
    duration?: { min?: number; max?: number }; // Minutes
    isAllDay?: boolean;
  };
  adjustment: {
    type: 'time_before' | 'time_after' | 'disable' | 'custom_time';
    minutes?: number; // For time_before/time_after
    customTime?: string; // For custom_time (HH:MM format)
  };
  priority: number;
  enabled: boolean;
}

// Sun Schedule Interface
export interface SunSchedule {
  enabled: boolean;
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  mode: 'sunrise' | 'sunset' | 'civil_twilight' | 'nautical_twilight' | 'astronomical_twilight';
  offset: number; // Minutes before/after sun event
  seasonalVariation: boolean; // Whether to account for seasonal changes
  fallbackTime?: string; // HH:MM fallback if sun times unavailable
}

// Main Scheduling Configuration Interface
export interface SchedulingConfig {
  id: string;
  name: string;
  alarmId: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Core scheduling components
  recurrencePattern?: RecurrencePattern;
  conditionalRules: ConditionalRule[];
  locationTriggers: LocationTrigger[];
  smartOptimization: SmartOptimization;
  seasonalAdjustment: SeasonalAdjustment;
  calendarIntegration: CalendarIntegration;
  sunSchedule?: SunSchedule;
  
  // Metadata
  tags: string[];
  priority: 'low' | 'normal' | 'high' | 'critical';
  enabled: boolean;
  
  // Performance and monitoring
  executionHistory: SchedulingExecution[];
  performanceMetrics: {
    successRate: number;
    averageExecutionTime: number;
    lastOptimized: Date;
  };
}

// Execution History Interface
interface SchedulingExecution {
  timestamp: Date;
  status: 'success' | 'failed' | 'skipped' | 'adjusted';
  adjustedTime?: Date;
  triggeredRules: string[]; // Rule IDs that were applied
  executionTime: number; // Milliseconds
  error?: string;
}

// Export helper types for component props
export interface AlarmSchedulingProps {
  alarms: any[];
  onCreateAlarm: (alarm: any) => void;
  onUpdateAlarm: (id: string, alarm: any) => void;
  onDeleteAlarm: (id: string) => void;
}

// Constants for validation
export const SCHEDULING_CONSTANTS = {
  MAX_CONDITIONAL_RULES: 10,
  MAX_LOCATION_TRIGGERS: 5,
  MAX_RECURRENCE_INTERVAL: 365,
  MIN_RECURRENCE_INTERVAL: 1,
  MAX_OFFSET_MINUTES: 720, // 12 hours
  MIN_OFFSET_MINUTES: -720,
  DEFAULT_DWELL_TIME: 5,
  MAX_DWELL_TIME: 60,
} as const;

// Validation helpers
export const validateSchedulingConfig = (config: SchedulingConfig): boolean => {
  if (!config.id || !config.name || !config.alarmId) return false;
  if (config.conditionalRules.length > SCHEDULING_CONSTANTS.MAX_CONDITIONAL_RULES) return false;
  if (config.locationTriggers.length > SCHEDULING_CONSTANTS.MAX_LOCATION_TRIGGERS) return false;
  return true;
};

// Type guards
export const isRecurrencePattern = (value: any): value is RecurrencePattern => {
  return value && typeof value.type === 'string' && typeof value.interval === 'number';
};

export const isConditionalRule = (value: any): value is ConditionalRule => {
  return value && value.id && value.condition && value.action;
};

export const isLocationTrigger = (value: any): value is LocationTrigger => {
  return value && value.id && value.coordinates && value.action;
};