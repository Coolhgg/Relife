// Additional type definitions for Advanced Alarm Scheduler
// This file provides strict typing for the advanced alarm scheduler functionality

import type {
  Alarm,
  RecurrencePattern,
  ConditionalRule,
  LocationTrigger,
  CalendarIntegration,
  SchedulingConfig,
  SchedulingStats,
  SunSchedule,
  BulkScheduleOperation,
  ScheduleExport,
  ScheduleImport,
  SmartOptimization,
  SeasonalAdjustment,
  OptimizationType,
  AlarmDependency,
  Location,
  AlarmCondition,
  AlarmAction,
} from './index';

// Extended interface for capacitor notifications
export interface CapacitorNotificationService {
  scheduleLocalNotification(data: NotificationScheduleData): Promise<void>;
  cancelLocalNotification(id: number): Promise<void>;
}

// Enhanced notification data structure
export interface NotificationScheduleData {
  id: number;
  title: string;
  body: string;
  schedule: Date;
}

// Location action parameters
export interface LocationActionParameters {
  type: 'enable_alarm' | 'disable_alarm' | 'adjust_time' | 'notification';
  minutes?: number;
  message?: string;
  parameters?: {
    minutes?: number;
    message?: string;
  };
}

// Weather condition types
export interface WeatherConditionData {
  type: 'temperature' | 'condition' | 'humidity' | 'wind_speed';
  operator: 'greater_than' | 'less_than' | 'equals';
  value: number;
  condition?: string;
}

// Calendar condition types
export interface CalendarConditionData {
  type: 'day_of_week' | 'date_range' | 'has_events' | 'free_time';
  value: any;
  operator?: 'equals';
}

// Sleep quality condition types
export interface SleepQualityConditionData {
  type: 'quality_score' | 'duration' | 'efficiency';
  value: number;
  operator: 'greater_than' | 'less_than';
}

// Time since last condition types
export interface TimeSinceLastConditionData {
  value: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  unit: 'minutes' | 'hours' | 'days';
}

// Bulk operation result
export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
}

// Sun time data
export interface SunTimeData {
  sunrise: Date;
  sunset: Date;
}

// Sleep data simulation
export interface SleepData {
  quality: number;
  duration: number;
  efficiency: number;
  deepSleep: number;
}

// Current weather simulation
export interface CurrentWeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}

// Season type
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

// Extended alarm condition types to match usage
export interface ExtendedAlarmCondition extends AlarmCondition {
  conditions?: any;
}

// Extended Alarm interface for advanced scheduling
export interface AdvancedAlarm extends Alarm {
  recurrencePattern?: RecurrencePattern;
  smartOptimizations?: SmartOptimization[];
  seasonalAdjustments?: SeasonalAdjustment[];
  locationTriggers?: LocationTrigger[];
  conditionalRules?: ConditionalRule[];
  sunSchedule?: SunSchedule;
  alarmDependencies?: AlarmDependency[];
  calendarIntegration?: CalendarIntegration;
}
