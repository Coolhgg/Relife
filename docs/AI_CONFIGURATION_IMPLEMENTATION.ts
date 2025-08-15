// 🧠 Enhanced Smart Alarm AI Configuration Implementation
// This file provides ready-to-use configuration examples for different user types

import type { 
  EnhancedSmartAlarm, 
  ConditionBasedAdjustment,
  RealTimeAdaptationConfig 
} from './src/services/enhanced-smart-alarm-scheduler';

// ===== OPTIMAL DEFAULT CONFIGURATION =====

export const OPTIMAL_DEFAULT_CONFIG = {
  // Core AI Settings
  realTimeAdaptation: true,
  dynamicWakeWindow: true,
  sleepPatternWeight: 0.7,        // 70% sleep patterns, 30% conditions
  learningFactor: 0.3,            // Moderate learning speed
  
  // Real-time monitoring settings
  monitoringConfig: {
    enabled: true,
    adaptationInterval: 15,        // Check every 15 minutes
    maxDailyAdaptations: 5,        // Prevent over-adjustment
    minConfidenceThreshold: 0.6,   // 60% confidence minimum
    emergencyOverrideEnabled: true
  } as RealTimeAdaptationConfig
};

// ===== USER TYPE CONFIGURATIONS =====

export const USER_TYPE_CONFIGS = {
  
  // 👨‍💼 Professional with consistent schedule
  professional: {
    realTimeAdaptation: true,
    dynamicWakeWindow: true,
    sleepPatternWeight: 0.7,
    learningFactor: 0.3,
    conditions: [
      {
        id: 'weather_rain',
        type: 'weather' as const,
        isEnabled: true,
        priority: 3,
        condition: { operator: 'contains' as const, value: 'rain' },
        adjustment: { 
          timeMinutes: -10, 
          maxAdjustment: 20, 
          reason: 'Extra commute time in rain' 
        },
        effectivenessScore: 0.8
      },
      {
        id: 'important_meeting',
        type: 'calendar' as const,
        isEnabled: true,
        priority: 5,
        condition: { operator: 'contains' as const, value: 'important' },
        adjustment: { 
          timeMinutes: -30, 
          maxAdjustment: 60, 
          reason: 'Critical meeting preparation time' 
        },
        effectivenessScore: 0.9
      },
      {
        id: 'sleep_debt_high',
        type: 'sleep_debt' as const,
        isEnabled: true,
        priority: 4,
        condition: { operator: 'greater_than' as const, value: 60 },
        adjustment: { 
          timeMinutes: -15, 
          maxAdjustment: 30, 
          reason: 'Recovery time for sleep debt' 
        },
        effectivenessScore: 0.75
      }
    ] as ConditionBasedAdjustment[]
  },

  // 🎓 Student with variable schedule
  student: {
    realTimeAdaptation: true,
    dynamicWakeWindow: true,
    sleepPatternWeight: 0.5,
    learningFactor: 0.4,
    conditions: [
      {
        id: 'exam_day',
        type: 'calendar' as const,
        isEnabled: true,
        priority: 5,
        condition: { operator: 'contains' as const, value: 'exam' },
        adjustment: { 
          timeMinutes: -45, 
          maxAdjustment: 90, 
          reason: 'Extra preparation and review time' 
        },
        effectivenessScore: 0.85
      },
      {
        id: 'weekend_mode',
        type: 'calendar' as const,
        isEnabled: true,
        priority: 2,
        condition: { operator: 'equals' as const, value: 'weekend' },
        adjustment: { 
          timeMinutes: 45, 
          maxAdjustment: 120, 
          reason: 'Weekend relaxation time' 
        },
        effectivenessScore: 0.9
      },
      {
        id: 'high_screen_time',
        type: 'screen_time' as const,
        isEnabled: true,
        priority: 2,
        condition: { operator: 'greater_than' as const, value: 480 }, // 8+ hours
        adjustment: { 
          timeMinutes: 10, 
          maxAdjustment: 15, 
          reason: 'Delayed melatonin from blue light' 
        },
        effectivenessScore: 0.6
      },
      {
        id: 'sleep_debt_moderate',
        type: 'sleep_debt' as const,
        isEnabled: true,
        priority: 4,
        condition: { operator: 'greater_than' as const, value: 30 },
        adjustment: { 
          timeMinutes: -20, 
          maxAdjustment: 40, 
          reason: 'Sleep debt recovery' 
        },
        effectivenessScore: 0.7
      }
    ] as ConditionBasedAdjustment[]
  },

  // 🏋️‍♀️ Fitness enthusiast
  fitness: {
    realTimeAdaptation: true,
    dynamicWakeWindow: true,
    sleepPatternWeight: 0.8,
    learningFactor: 0.3,
    conditions: [
      {
        id: 'intense_workout_recovery',
        type: 'exercise' as const,
        isEnabled: true,
        priority: 3,
        condition: { operator: 'greater_than' as const, value: 120 }, // 2+ hours intense
        adjustment: { 
          timeMinutes: 15, 
          maxAdjustment: 25, 
          reason: 'Muscle recovery needs extra sleep' 
        },
        effectivenessScore: 0.8
      },
      {
        id: 'morning_workout',
        type: 'calendar' as const,
        isEnabled: true,
        priority: 4,
        condition: { operator: 'contains' as const, value: 'workout' },
        adjustment: { 
          timeMinutes: -30, 
          maxAdjustment: 45, 
          reason: 'Pre-workout preparation time' 
        },
        effectivenessScore: 0.85
      },
      {
        id: 'sleep_debt_athlete',
        type: 'sleep_debt' as const,
        isEnabled: true,
        priority: 5,
        condition: { operator: 'greater_than' as const, value: 45 },
        adjustment: { 
          timeMinutes: -25, 
          maxAdjustment: 50, 
          reason: 'Athletic recovery requires more sleep' 
        },
        effectivenessScore: 0.9
      }
    ] as ConditionBasedAdjustment[]
  },

  // 😴 Heavy sleeper
  heavySleeper: {
    realTimeAdaptation: true,
    dynamicWakeWindow: true,
    sleepPatternWeight: 0.8,
    learningFactor: 0.2,
    conditions: [
      {
        id: 'critical_sleep_debt',
        type: 'sleep_debt' as const,
        isEnabled: true,
        priority: 5,
        condition: { operator: 'greater_than' as const, value: 90 },
        adjustment: { 
          timeMinutes: -30, 
          maxAdjustment: 60, 
          reason: 'Heavy sleeper needs extra recovery time' 
        },
        effectivenessScore: 0.8
      },
      {
        id: 'critical_appointments',
        type: 'calendar' as const,
        isEnabled: true,
        priority: 5,
        condition: { operator: 'contains' as const, value: 'critical' },
        adjustment: { 
          timeMinutes: -60, 
          maxAdjustment: 90, 
          reason: 'Extra wake-up time for heavy sleepers' 
        },
        effectivenessScore: 0.85
      }
    ] as ConditionBasedAdjustment[]
  },

  // ⚡ Light sleeper
  lightSleeper: {
    realTimeAdaptation: true,
    dynamicWakeWindow: true,
    sleepPatternWeight: 0.6,
    learningFactor: 0.4,
    conditions: [
      {
        id: 'weather_sensitivity',
        type: 'weather' as const,
        isEnabled: true,
        priority: 3,
        condition: { operator: 'contains' as const, value: 'storm' },
        adjustment: { 
          timeMinutes: -15, 
          maxAdjustment: 25, 
          reason: 'Storm may disrupt light sleeper' 
        },
        effectivenessScore: 0.7
      },
      {
        id: 'stress_adjustment',
        type: 'stress_level' as const,
        isEnabled: true,
        priority: 3,
        condition: { operator: 'greater_than' as const, value: 7 }, // High stress
        adjustment: { 
          timeMinutes: -10, 
          maxAdjustment: 20, 
          reason: 'Stress management time for light sleepers' 
        },
        effectivenessScore: 0.75
      },
      {
        id: 'screen_time_sensitivity',
        type: 'screen_time' as const,
        isEnabled: true,
        priority: 2,
        condition: { operator: 'greater_than' as const, value: 360 }, // 6+ hours
        adjustment: { 
          timeMinutes: 8, 
          maxAdjustment: 15, 
          reason: 'Light sleeper sensitive to blue light' 
        },
        effectivenessScore: 0.65
      }
    ] as ConditionBasedAdjustment[]
  },

  // 🌍 Shift worker
  shiftWorker: {
    realTimeAdaptation: true,
    dynamicWakeWindow: false, // Need consistency for irregular schedule
    sleepPatternWeight: 0.4,
    learningFactor: 0.5,
    conditions: [
      {
        id: 'shift_change',
        type: 'calendar' as const,
        isEnabled: true,
        priority: 5,
        condition: { operator: 'contains' as const, value: 'shift' },
        adjustment: { 
          timeMinutes: -45, 
          maxAdjustment: 90, 
          reason: 'Shift change preparation time' 
        },
        effectivenessScore: 0.8
      },
      {
        id: 'critical_sleep_debt_shift',
        type: 'sleep_debt' as const,
        isEnabled: true,
        priority: 5,
        condition: { operator: 'greater_than' as const, value: 120 }, // 2+ hours
        adjustment: { 
          timeMinutes: -40, 
          maxAdjustment: 80, 
          reason: 'Shift work compounds sleep debt effects' 
        },
        effectivenessScore: 0.85
      }
    ] as ConditionBasedAdjustment[]
  }
};

// ===== CONFIGURATION UTILITY FUNCTIONS =====

export function getConfigForUserType(userType: keyof typeof USER_TYPE_CONFIGS): Partial<EnhancedSmartAlarm> {
  const config = USER_TYPE_CONFIGS[userType];
  if (!config) {
    throw new Error(`Unknown user type: ${userType}`);
  }

  return {
    realTimeAdaptation: config.realTimeAdaptation,
    dynamicWakeWindow: config.dynamicWakeWindow,
    sleepPatternWeight: config.sleepPatternWeight,
    learningFactor: config.learningFactor,
    conditionBasedAdjustments: config.conditions
  };
}

export function createOptimalSmartAlarm(
  baseAlarm: Partial<EnhancedSmartAlarm>,
  userType: keyof typeof USER_TYPE_CONFIGS = 'professional'
): Partial<EnhancedSmartAlarm> {
  const config = getConfigForUserType(userType);
  
  return {
    ...baseAlarm,
    ...config,
    smartEnabled: true,
    wakeUpFeedback: [],
    nextOptimalTimes: [],
    adaptationHistory: []
  };
}

// ===== QUICK SETUP FUNCTIONS =====

export function getQuickStartConfig(): Partial<EnhancedSmartAlarm> {
  return {
    realTimeAdaptation: true,
    dynamicWakeWindow: true,
    sleepPatternWeight: 0.7,
    learningFactor: 0.3,
    conditionBasedAdjustments: [
      {
        id: 'weather_rain_basic',
        type: 'weather',
        isEnabled: true,
        priority: 3,
        condition: { operator: 'contains', value: 'rain' },
        adjustment: { 
          timeMinutes: -10, 
          maxAdjustment: 20, 
          reason: 'Rainy weather commute adjustment' 
        },
        effectivenessScore: 0.8
      },
      {
        id: 'important_events_basic',
        type: 'calendar',
        isEnabled: true,
        priority: 5,
        condition: { operator: 'contains', value: 'important' },
        adjustment: { 
          timeMinutes: -30, 
          maxAdjustment: 60, 
          reason: 'Important event preparation' 
        },
        effectivenessScore: 0.9
      },
      {
        id: 'sleep_debt_basic',
        type: 'sleep_debt',
        isEnabled: true,
        priority: 4,
        condition: { operator: 'greater_than', value: 60 },
        adjustment: { 
          timeMinutes: -15, 
          maxAdjustment: 30, 
          reason: 'Sleep debt recovery time' 
        },
        effectivenessScore: 0.75
      },
      {
        id: 'weekend_basic',
        type: 'calendar',
        isEnabled: true,
        priority: 2,
        condition: { operator: 'equals', value: 'weekend' },
        adjustment: { 
          timeMinutes: 30, 
          maxAdjustment: 60, 
          reason: 'Weekend relaxation' 
        },
        effectivenessScore: 0.9
      }
    ] as ConditionBasedAdjustment[]
  };
}

export function getConservativeConfig(): Partial<EnhancedSmartAlarm> {
  return {
    realTimeAdaptation: true,
    dynamicWakeWindow: true,
    sleepPatternWeight: 0.8,  // More weight on consistent patterns
    learningFactor: 0.2,      // Slower learning
    conditionBasedAdjustments: [
      {
        id: 'critical_only',
        type: 'calendar',
        isEnabled: true,
        priority: 5,
        condition: { operator: 'contains', value: 'critical' },
        adjustment: { 
          timeMinutes: -20, 
          maxAdjustment: 30, 
          reason: 'Only critical events trigger adjustments' 
        },
        effectivenessScore: 0.9
      }
    ] as ConditionBasedAdjustment[]
  };
}

export function getAggressiveConfig(): Partial<EnhancedSmartAlarm> {
  return {
    realTimeAdaptation: true,
    dynamicWakeWindow: true,
    sleepPatternWeight: 0.5,  // Equal weight to conditions
    learningFactor: 0.5,      // Faster learning
    conditionBasedAdjustments: [
      ...USER_TYPE_CONFIGS.professional.conditions,
      ...USER_TYPE_CONFIGS.student.conditions,
      ...USER_TYPE_CONFIGS.lightSleeper.conditions
    ] as ConditionBasedAdjustment[]
  };
}

// ===== MONITORING CONFIGURATION =====

export const MONITORING_CONFIGS = {
  battery_saver: {
    enabled: true,
    adaptationInterval: 30,     // Check every 30 minutes
    maxDailyAdaptations: 3,     // Fewer adaptations
    minConfidenceThreshold: 0.7, // Higher confidence needed
    emergencyOverrideEnabled: true
  } as RealTimeAdaptationConfig,
  
  balanced: {
    enabled: true,
    adaptationInterval: 15,     // Default 15 minutes
    maxDailyAdaptations: 5,     // Standard limit
    minConfidenceThreshold: 0.6, // 60% confidence
    emergencyOverrideEnabled: true
  } as RealTimeAdaptationConfig,
  
  aggressive: {
    enabled: true,
    adaptationInterval: 10,     // Check every 10 minutes
    maxDailyAdaptations: 8,     // More adaptations allowed
    minConfidenceThreshold: 0.5, // Lower confidence threshold
    emergencyOverrideEnabled: true
  } as RealTimeAdaptationConfig
};

// ===== USAGE EXAMPLES =====

/*
// Example 1: Set up alarm for professional user
const professionalAlarm = createOptimalSmartAlarm(
  {
    id: 'work-alarm-1',
    time: '07:00',
    enabled: true,
    smartEnabled: true
  },
  'professional'
);

// Example 2: Quick start configuration
const quickAlarm = {
  id: 'quick-setup',
  time: '06:30',
  enabled: true,
  smartEnabled: true,
  ...getQuickStartConfig()
};

// Example 3: Conservative setup for heavy sleeper
const conservativeAlarm = {
  id: 'conservative-setup',
  time: '06:00',
  enabled: true,
  smartEnabled: true,
  ...getConservativeConfig(),
  sleepPatternWeight: 0.9  // Override for heavy sleeper
};
*/

export default {
  OPTIMAL_DEFAULT_CONFIG,
  USER_TYPE_CONFIGS,
  MONITORING_CONFIGS,
  getConfigForUserType,
  createOptimalSmartAlarm,
  getQuickStartConfig,
  getConservativeConfig,
  getAggressiveConfig
};