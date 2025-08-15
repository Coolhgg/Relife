// 🌦️📅😴 Advanced Condition-Based Adjustments Implementation
// Ready-to-use condition configurations for weather, calendar, and sleep patterns

import type { ConditionBasedAdjustment } from './src/services/enhanced-smart-alarm-scheduler';

// ===== WEATHER CONDITIONS =====

export const WEATHER_CONDITIONS: Record<string, ConditionBasedAdjustment> = {
  
  // Light rain - basic commute adjustment
  RAIN_LIGHT: {
    id: 'weather_rain_light',
    type: 'weather',
    isEnabled: true,
    priority: 3,
    condition: {
      operator: 'contains',
      value: 'rain',
      threshold: 0.3 // 30% chance or light rain
    },
    adjustment: {
      timeMinutes: -10,
      maxAdjustment: 20,
      reason: 'Light rain may slow commute - extra preparation time'
    },
    effectivenessScore: 0.8
  },

  // Heavy rain/storms - significant adjustment  
  RAIN_HEAVY: {
    id: 'weather_rain_heavy',
    type: 'weather',
    isEnabled: true,
    priority: 4,
    condition: {
      operator: 'greater_than',
      value: 'precipitation_intensity',
      threshold: 5.0 // Heavy rain
    },
    adjustment: {
      timeMinutes: -25,
      maxAdjustment: 45,
      reason: 'Heavy rain requires significant extra travel time'
    },
    effectivenessScore: 0.85
  },

  // Snow conditions - high priority safety
  SNOW: {
    id: 'weather_snow',
    type: 'weather',
    isEnabled: true,
    priority: 5,
    condition: {
      operator: 'contains',
      value: 'snow'
    },
    adjustment: {
      timeMinutes: -30,
      maxAdjustment: 60,
      reason: 'Snow conditions require extra safety preparation'
    },
    effectivenessScore: 0.9
  },

  // Ice/freezing conditions
  ICE: {
    id: 'weather_ice',
    type: 'weather',
    isEnabled: true,
    priority: 5,
    condition: {
      operator: 'contains',
      value: ['ice', 'freezing', 'sleet']
    },
    adjustment: {
      timeMinutes: -35,
      maxAdjustment: 70,
      reason: 'Icy conditions pose significant safety risks'
    },
    effectivenessScore: 0.95
  },

  // Extreme cold
  EXTREME_COLD: {
    id: 'weather_extreme_cold',
    type: 'weather',
    isEnabled: true,
    priority: 3,
    condition: {
      operator: 'less_than',
      value: 'temperature',
      threshold: -10 // Below -10°C/14°F
    },
    adjustment: {
      timeMinutes: -15,
      maxAdjustment: 25,
      reason: 'Extreme cold requires extra warm-up time'
    },
    effectivenessScore: 0.75
  },

  // Extreme heat
  EXTREME_HEAT: {
    id: 'weather_extreme_heat',
    type: 'weather',
    isEnabled: true,
    priority: 3,
    condition: {
      operator: 'greater_than',
      value: 'temperature',
      threshold: 38 // Above 38°C/100°F
    },
    adjustment: {
      timeMinutes: -10,
      maxAdjustment: 20,
      reason: 'Extreme heat requires cooling preparation'
    },
    effectivenessScore: 0.7
  },

  // High wind
  HIGH_WIND: {
    id: 'weather_high_wind',
    type: 'weather',
    isEnabled: true,
    priority: 4,
    condition: {
      operator: 'greater_than',
      value: 'wind_speed',
      threshold: 25 // 25+ mph/40+ kmh
    },
    adjustment: {
      timeMinutes: -15,
      maxAdjustment: 30,
      reason: 'High winds may affect transportation'
    },
    effectivenessScore: 0.8
  },

  // Perfect weather bonus
  PERFECT_WEATHER: {
    id: 'weather_perfect',
    type: 'weather',
    isEnabled: true,
    priority: 1,
    condition: {
      operator: 'equals',
      value: 'condition',
      threshold: 'clear'
    },
    adjustment: {
      timeMinutes: 5,
      maxAdjustment: 15,
      reason: 'Perfect weather allows relaxed morning'
    },
    effectivenessScore: 0.6
  },

  // Fog/visibility issues
  FOG: {
    id: 'weather_fog',
    type: 'weather',
    isEnabled: true,
    priority: 4,
    condition: {
      operator: 'contains',
      value: ['fog', 'mist'],
      threshold: 0.5
    },
    adjustment: {
      timeMinutes: -20,
      maxAdjustment: 35,
      reason: 'Fog reduces visibility and slows travel'
    },
    effectivenessScore: 0.85
  }
};

// ===== CALENDAR CONDITIONS =====

export const CALENDAR_CONDITIONS: Record<string, ConditionBasedAdjustment> = {
  
  // Critical meetings and events
  CRITICAL_EVENTS: {
    id: 'calendar_critical',
    type: 'calendar',
    isEnabled: true,
    priority: 5,
    condition: {
      operator: 'contains',
      value: ['critical', 'urgent', 'emergency', 'CEO', 'board meeting']
    },
    adjustment: {
      timeMinutes: -60,
      maxAdjustment: 120,
      reason: 'Critical events require extensive preparation'
    },
    effectivenessScore: 0.95
  },

  // Important meetings
  IMPORTANT_MEETINGS: {
    id: 'calendar_important',
    type: 'calendar',
    isEnabled: true,
    priority: 4,
    condition: {
      operator: 'contains',
      value: ['important', 'presentation', 'interview', 'client meeting']
    },
    adjustment: {
      timeMinutes: -30,
      maxAdjustment: 60,
      reason: 'Important meetings need thorough preparation'
    },
    effectivenessScore: 0.9
  },

  // Early morning meetings (before 8 AM)
  EARLY_MEETINGS: {
    id: 'calendar_early_meeting',
    type: 'calendar',
    isEnabled: true,
    priority: 4,
    condition: {
      operator: 'less_than',
      value: 'first_event_time',
      threshold: '08:00'
    },
    adjustment: {
      timeMinutes: -25,
      maxAdjustment: 45,
      reason: 'Early meetings require additional preparation time'
    },
    effectivenessScore: 0.85
  },

  // All-day events and conferences
  ALL_DAY_EVENTS: {
    id: 'calendar_all_day',
    type: 'calendar',
    isEnabled: true,
    priority: 4,
    condition: {
      operator: 'equals',
      value: 'event_duration',
      threshold: 'all_day'
    },
    adjustment: {
      timeMinutes: -20,
      maxAdjustment: 40,
      reason: 'All-day events require extra energy and preparation'
    },
    effectivenessScore: 0.8
  },

  // Travel days
  TRAVEL_DAYS: {
    id: 'calendar_travel',
    type: 'calendar',
    isEnabled: true,
    priority: 5,
    condition: {
      operator: 'contains',
      value: ['flight', 'travel', 'airport', 'departure', 'check-in']
    },
    adjustment: {
      timeMinutes: -90,
      maxAdjustment: 180,
      reason: 'Travel requires extensive preparation and buffer time'
    },
    effectivenessScore: 0.95
  },

  // Weekend mode
  WEEKEND_MODE: {
    id: 'calendar_weekend',
    type: 'calendar',
    isEnabled: true,
    priority: 2,
    condition: {
      operator: 'equals',
      value: 'day_type',
      threshold: ['saturday', 'sunday']
    },
    adjustment: {
      timeMinutes: 45,
      maxAdjustment: 120,
      reason: 'Weekend relaxation and recovery time'
    },
    effectivenessScore: 0.9
  },

  // Holiday mode
  HOLIDAY_MODE: {
    id: 'calendar_holiday',
    type: 'calendar',
    isEnabled: true,
    priority: 2,
    condition: {
      operator: 'equals',
      value: 'day_type',
      threshold: 'holiday'
    },
    adjustment: {
      timeMinutes: 60,
      maxAdjustment: 150,
      reason: 'Holiday relaxation time'
    },
    effectivenessScore: 0.95
  },

  // Busy day preparation (5+ meetings)
  BUSY_DAY: {
    id: 'calendar_busy_day',
    type: 'calendar',
    isEnabled: true,
    priority: 3,
    condition: {
      operator: 'greater_than',
      value: 'meeting_count',
      threshold: 5
    },
    adjustment: {
      timeMinutes: -20,
      maxAdjustment: 35,
      reason: 'Busy day requires extra mental preparation'
    },
    effectivenessScore: 0.7
  },

  // Meeting-free days
  FREE_DAY: {
    id: 'calendar_free_day',
    type: 'calendar',
    isEnabled: true,
    priority: 1,
    condition: {
      operator: 'equals',
      value: 'meeting_count',
      threshold: 0
    },
    adjustment: {
      timeMinutes: 15,
      maxAdjustment: 30,
      reason: 'Free day allows relaxed morning routine'
    },
    effectivenessScore: 0.8
  },

  // Late social events (previous night impact)
  LATE_SOCIAL_RECOVERY: {
    id: 'calendar_late_social',
    type: 'calendar',
    isEnabled: true,
    priority: 3,
    condition: {
      operator: 'contains',
      value: 'previous_evening_events',
      threshold: ['party', 'dinner', 'social', 'event']
    },
    adjustment: {
      timeMinutes: 20,
      maxAdjustment: 40,
      reason: 'Late social events impact morning energy'
    },
    effectivenessScore: 0.75
  },

  // Deadline days
  DEADLINE_PRESSURE: {
    id: 'calendar_deadline',
    type: 'calendar',
    isEnabled: true,
    priority: 4,
    condition: {
      operator: 'contains',
      value: ['deadline', 'due', 'submission', 'final']
    },
    adjustment: {
      timeMinutes: -35,
      maxAdjustment: 60,
      reason: 'Deadline pressure requires extra preparation and focus time'
    },
    effectivenessScore: 0.85
  }
};

// ===== SLEEP PATTERN CONDITIONS =====

export const SLEEP_CONDITIONS: Record<string, ConditionBasedAdjustment> = {
  
  // Sleep debt management (graduated responses)
  SLEEP_DEBT_MINOR: {
    id: 'sleep_debt_minor',
    type: 'sleep_debt',
    isEnabled: true,
    priority: 2,
    condition: {
      operator: 'greater_than',
      value: 'sleep_debt_minutes',
      threshold: 15 // 15-30 minutes debt
    },
    adjustment: {
      timeMinutes: -5,
      maxAdjustment: 10,
      reason: 'Minor sleep debt adjustment'
    },
    effectivenessScore: 0.65
  },

  SLEEP_DEBT_MODERATE: {
    id: 'sleep_debt_moderate',
    type: 'sleep_debt',
    isEnabled: true,
    priority: 3,
    condition: {
      operator: 'greater_than',
      value: 'sleep_debt_minutes',
      threshold: 30 // 30-60 minutes debt
    },
    adjustment: {
      timeMinutes: -15,
      maxAdjustment: 25,
      reason: 'Moderate sleep debt requires schedule adjustment'
    },
    effectivenessScore: 0.75
  },

  SLEEP_DEBT_HIGH: {
    id: 'sleep_debt_high',
    type: 'sleep_debt',
    isEnabled: true,
    priority: 4,
    condition: {
      operator: 'greater_than',
      value: 'sleep_debt_minutes',
      threshold: 60 // 1+ hours debt
    },
    adjustment: {
      timeMinutes: -25,
      maxAdjustment: 45,
      reason: 'High sleep debt requires significant recovery adjustment'
    },
    effectivenessScore: 0.85
  },

  SLEEP_DEBT_SEVERE: {
    id: 'sleep_debt_severe',
    type: 'sleep_debt',
    isEnabled: true,
    priority: 5,
    condition: {
      operator: 'greater_than',
      value: 'sleep_debt_minutes',
      threshold: 120 // 2+ hours debt
    },
    adjustment: {
      timeMinutes: -40,
      maxAdjustment: 75,
      reason: 'Severe sleep debt requires immediate schedule correction'
    },
    effectivenessScore: 0.9
  },

  // Sleep credit (extra sleep)
  SLEEP_CREDIT: {
    id: 'sleep_credit',
    type: 'sleep_debt',
    isEnabled: true,
    priority: 2,
    condition: {
      operator: 'less_than',
      value: 'sleep_debt_minutes',
      threshold: -30 // 30+ minutes extra sleep
    },
    adjustment: {
      timeMinutes: 15,
      maxAdjustment: 30,
      reason: 'Extra sleep credit allows relaxed wake-up'
    },
    effectivenessScore: 0.8
  },

  // Sleep quality adjustments
  SLEEP_QUALITY_POOR: {
    id: 'sleep_quality_poor',
    type: 'sleep_debt',
    isEnabled: true,
    priority: 4,
    condition: {
      operator: 'less_than',
      value: 'sleep_quality_score',
      threshold: 5 // Below 5/10 quality
    },
    adjustment: {
      timeMinutes: -20,
      maxAdjustment: 35,
      reason: 'Poor sleep quality requires routine adjustment'
    },
    effectivenessScore: 0.8
  },

  SLEEP_QUALITY_EXCELLENT: {
    id: 'sleep_quality_excellent',
    type: 'sleep_debt',
    isEnabled: true,
    priority: 1,
    condition: {
      operator: 'greater_than',
      value: 'sleep_quality_score',
      threshold: 8.5 // Above 8.5/10 quality
    },
    adjustment: {
      timeMinutes: 10,
      maxAdjustment: 20,
      reason: 'Excellent sleep quality allows relaxed wake-up'
    },
    effectivenessScore: 0.85
  },

  // Sleep stage optimization
  SLEEP_STAGE_DEEP_AVOID: {
    id: 'sleep_stage_deep',
    type: 'sleep_debt',
    isEnabled: true,
    priority: 3,
    condition: {
      operator: 'equals',
      value: 'predicted_sleep_stage',
      threshold: 'deep_sleep'
    },
    adjustment: {
      timeMinutes: 20,
      maxAdjustment: 35,
      reason: 'Avoid deep sleep wake-up for better alertness'
    },
    effectivenessScore: 0.9
  },

  SLEEP_STAGE_LIGHT_OPTIMAL: {
    id: 'sleep_stage_light',
    type: 'sleep_debt',
    isEnabled: true,
    priority: 3,
    condition: {
      operator: 'equals',
      value: 'predicted_sleep_stage',
      threshold: 'light_sleep'
    },
    adjustment: {
      timeMinutes: -5,
      maxAdjustment: 10,
      reason: 'Light sleep stage is optimal for wake-up'
    },
    effectivenessScore: 0.9
  },

  SLEEP_STAGE_REM_GOOD: {
    id: 'sleep_stage_rem',
    type: 'sleep_debt',
    isEnabled: true,
    priority: 2,
    condition: {
      operator: 'equals',
      value: 'predicted_sleep_stage',
      threshold: 'rem_sleep'
    },
    adjustment: {
      timeMinutes: 0,
      maxAdjustment: 5,
      reason: 'REM sleep wake-up is acceptable'
    },
    effectivenessScore: 0.7
  },

  // Sleep consistency patterns
  SLEEP_CONSISTENCY_GOOD: {
    id: 'sleep_consistency_good',
    type: 'sleep_debt',
    isEnabled: true,
    priority: 1,
    condition: {
      operator: 'greater_than',
      value: 'sleep_consistency_score',
      threshold: 8 // Consistent sleep pattern
    },
    adjustment: {
      timeMinutes: 5,
      maxAdjustment: 15,
      reason: 'Consistent sleep pattern allows small flexibility'
    },
    effectivenessScore: 0.75
  },

  SLEEP_CONSISTENCY_POOR: {
    id: 'sleep_consistency_poor',
    type: 'sleep_debt',
    isEnabled: true,
    priority: 3,
    condition: {
      operator: 'less_than',
      value: 'sleep_consistency_score',
      threshold: 5 // Inconsistent pattern
    },
    adjustment: {
      timeMinutes: -10,
      maxAdjustment: 20,
      reason: 'Inconsistent sleep requires routine stabilization'
    },
    effectivenessScore: 0.8
  }
};

// ===== EXERCISE CONDITIONS =====

export const EXERCISE_CONDITIONS: Record<string, ConditionBasedAdjustment> = {
  
  INTENSE_WORKOUT_RECOVERY: {
    id: 'exercise_intense_recovery',
    type: 'exercise',
    isEnabled: true,
    priority: 3,
    condition: {
      operator: 'greater_than',
      value: 'previous_day_exercise_minutes',
      threshold: 90 // 90+ minutes intense exercise
    },
    adjustment: {
      timeMinutes: 20,
      maxAdjustment: 40,
      reason: 'Intense exercise requires additional recovery sleep'
    },
    effectivenessScore: 0.8
  },

  MORNING_WORKOUT_PREP: {
    id: 'exercise_morning_prep',
    type: 'exercise',
    isEnabled: true,
    priority: 4,
    condition: {
      operator: 'contains',
      value: 'morning_calendar',
      threshold: ['workout', 'gym', 'run', 'exercise', 'training']
    },
    adjustment: {
      timeMinutes: -30,
      maxAdjustment: 45,
      reason: 'Morning workouts need preparation and warm-up time'
    },
    effectivenessScore: 0.85
  },

  REST_DAY_RELAXATION: {
    id: 'exercise_rest_day',
    type: 'exercise',
    isEnabled: true,
    priority: 1,
    condition: {
      operator: 'equals',
      value: 'scheduled_exercise',
      threshold: false // No exercise planned
    },
    adjustment: {
      timeMinutes: 10,
      maxAdjustment: 20,
      reason: 'Rest day allows more relaxed wake-up'
    },
    effectivenessScore: 0.7
  }
};

// ===== STRESS CONDITIONS =====

export const STRESS_CONDITIONS: Record<string, ConditionBasedAdjustment> = {
  
  HIGH_STRESS_PREP: {
    id: 'stress_high_day',
    type: 'stress_level',
    isEnabled: true,
    priority: 3,
    condition: {
      operator: 'greater_than',
      value: 'predicted_stress_level',
      threshold: 7 // High stress (8-10 scale)
    },
    adjustment: {
      timeMinutes: -20,
      maxAdjustment: 35,
      reason: 'High stress days need extra mental preparation time'
    },
    effectivenessScore: 0.75
  },

  LOW_STRESS_RELAXED: {
    id: 'stress_low_day',
    type: 'stress_level',
    isEnabled: true,
    priority: 2,
    condition: {
      operator: 'less_than',
      value: 'predicted_stress_level',
      threshold: 3 // Low stress day
    },
    adjustment: {
      timeMinutes: 10,
      maxAdjustment: 20,
      reason: 'Low stress day allows relaxed morning routine'
    },
    effectivenessScore: 0.7
  }
};

// ===== SCREEN TIME CONDITIONS =====

export const SCREEN_TIME_CONDITIONS: Record<string, ConditionBasedAdjustment> = {
  
  HIGH_SCREEN_TIME: {
    id: 'screen_time_high',
    type: 'screen_time',
    isEnabled: true,
    priority: 2,
    condition: {
      operator: 'greater_than',
      value: 'evening_screen_minutes',
      threshold: 120 // 2+ hours before bed
    },
    adjustment: {
      timeMinutes: 10,
      maxAdjustment: 20,
      reason: 'High screen time delays natural sleep hormones'
    },
    effectivenessScore: 0.65
  },

  BLUE_LIGHT_EXPOSURE: {
    id: 'blue_light_exposure',
    type: 'screen_time',
    isEnabled: true,
    priority: 2,
    condition: {
      operator: 'greater_than',
      value: 'blue_light_exposure_score',
      threshold: 8 // High blue light exposure
    },
    adjustment: {
      timeMinutes: 15,
      maxAdjustment: 25,
      reason: 'Blue light disrupts natural sleep-wake cycle'
    },
    effectivenessScore: 0.7
  }
};

// ===== CONDITION TEMPLATES BY USER TYPE =====

export const CONDITION_TEMPLATES = {
  
  PROFESSIONAL: [
    WEATHER_CONDITIONS.RAIN_LIGHT,
    WEATHER_CONDITIONS.SNOW,
    CALENDAR_CONDITIONS.IMPORTANT_MEETINGS,
    CALENDAR_CONDITIONS.EARLY_MEETINGS,
    CALENDAR_CONDITIONS.WEEKEND_MODE,
    SLEEP_CONDITIONS.SLEEP_DEBT_HIGH,
    STRESS_CONDITIONS.HIGH_STRESS_PREP
  ],

  STUDENT: [
    CALENDAR_CONDITIONS.CRITICAL_EVENTS, // Exams, deadlines
    CALENDAR_CONDITIONS.WEEKEND_MODE,
    CALENDAR_CONDITIONS.FREE_DAY,
    SLEEP_CONDITIONS.SLEEP_DEBT_MODERATE,
    SLEEP_CONDITIONS.SLEEP_QUALITY_POOR,
    SCREEN_TIME_CONDITIONS.HIGH_SCREEN_TIME,
    STRESS_CONDITIONS.HIGH_STRESS_PREP
  ],

  FITNESS: [
    EXERCISE_CONDITIONS.INTENSE_WORKOUT_RECOVERY,
    EXERCISE_CONDITIONS.MORNING_WORKOUT_PREP,
    EXERCISE_CONDITIONS.REST_DAY_RELAXATION,
    SLEEP_CONDITIONS.SLEEP_DEBT_HIGH,
    SLEEP_CONDITIONS.SLEEP_QUALITY_EXCELLENT,
    WEATHER_CONDITIONS.RAIN_LIGHT
  ],

  SHIFT_WORKER: [
    CALENDAR_CONDITIONS.CRITICAL_EVENTS, // Shift changes
    SLEEP_CONDITIONS.SLEEP_DEBT_SEVERE,
    SLEEP_CONDITIONS.SLEEP_CONSISTENCY_POOR,
    STRESS_CONDITIONS.HIGH_STRESS_PREP,
    WEATHER_CONDITIONS.EXTREME_COLD,
    WEATHER_CONDITIONS.SNOW
  ],

  PARENT: [
    CALENDAR_CONDITIONS.IMPORTANT_MEETINGS, // School events
    CALENDAR_CONDITIONS.WEEKEND_MODE,
    SLEEP_CONDITIONS.SLEEP_DEBT_HIGH, // Parents need sleep!
    SLEEP_CONDITIONS.SLEEP_QUALITY_POOR,
    WEATHER_CONDITIONS.RAIN_LIGHT,
    STRESS_CONDITIONS.HIGH_STRESS_PREP
  ],

  TRAVELER: [
    CALENDAR_CONDITIONS.TRAVEL_DAYS,
    WEATHER_CONDITIONS.EXTREME_COLD,
    WEATHER_CONDITIONS.EXTREME_HEAT,
    WEATHER_CONDITIONS.SNOW,
    SLEEP_CONDITIONS.SLEEP_DEBT_HIGH,
    SLEEP_CONDITIONS.SLEEP_CONSISTENCY_POOR
  ]
};

// ===== UTILITY FUNCTIONS =====

export function getConditionsForUserType(userType: keyof typeof CONDITION_TEMPLATES): ConditionBasedAdjustment[] {
  const template = CONDITION_TEMPLATES[userType];
  if (!template) {
    throw new Error(`Unknown user type: ${userType}`);
  }
  return template;
}

export function createCustomConditionSet(conditionIds: string[]): ConditionBasedAdjustment[] {
  const allConditions = {
    ...WEATHER_CONDITIONS,
    ...CALENDAR_CONDITIONS,
    ...SLEEP_CONDITIONS,
    ...EXERCISE_CONDITIONS,
    ...STRESS_CONDITIONS,
    ...SCREEN_TIME_CONDITIONS
  };

  return conditionIds.map(id => {
    const condition = Object.values(allConditions).find(c => c.id === id);
    if (!condition) {
      throw new Error(`Condition with ID '${id}' not found`);
    }
    return condition;
  });
}

export function getEssentialConditions(): ConditionBasedAdjustment[] {
  return [
    WEATHER_CONDITIONS.RAIN_LIGHT,
    WEATHER_CONDITIONS.SNOW,
    CALENDAR_CONDITIONS.IMPORTANT_MEETINGS,
    CALENDAR_CONDITIONS.WEEKEND_MODE,
    SLEEP_CONDITIONS.SLEEP_DEBT_HIGH
  ];
}

export function getAdvancedConditions(): ConditionBasedAdjustment[] {
  return [
    WEATHER_CONDITIONS.HIGH_WIND,
    WEATHER_CONDITIONS.FOG,
    CALENDAR_CONDITIONS.BUSY_DAY,
    CALENDAR_CONDITIONS.DEADLINE_PRESSURE,
    SLEEP_CONDITIONS.SLEEP_STAGE_DEEP_AVOID,
    EXERCISE_CONDITIONS.INTENSE_WORKOUT_RECOVERY,
    STRESS_CONDITIONS.HIGH_STRESS_PREP,
    SCREEN_TIME_CONDITIONS.HIGH_SCREEN_TIME
  ];
}

// ===== CONFIGURATION PRESETS =====

export const CONFIGURATION_PRESETS = {
  
  QUICK_START: {
    conditions: getEssentialConditions(),
    learningFactor: 0.3,
    sleepPatternWeight: 0.7,
    description: 'Basic conditions for immediate use'
  },

  COMPREHENSIVE: {
    conditions: [...getEssentialConditions(), ...getAdvancedConditions()],
    learningFactor: 0.3,
    sleepPatternWeight: 0.6,
    description: 'Full condition set for maximum personalization'
  },

  CONSERVATIVE: {
    conditions: [
      CALENDAR_CONDITIONS.CRITICAL_EVENTS,
      WEATHER_CONDITIONS.SNOW,
      SLEEP_CONDITIONS.SLEEP_DEBT_SEVERE
    ],
    learningFactor: 0.2,
    sleepPatternWeight: 0.8,
    description: 'Minimal adjustments, high consistency'
  },

  AGGRESSIVE: {
    conditions: [...getEssentialConditions(), ...getAdvancedConditions()],
    learningFactor: 0.5,
    sleepPatternWeight: 0.5,
    description: 'Maximum adaptation and learning speed'
  }
};

// ===== IMPLEMENTATION EXAMPLE =====

/*
import { 
  EnhancedSmartAlarmScheduler,
  type ConditionBasedAdjustment 
} from './services/enhanced-smart-alarm-scheduler';

// Example: Set up professional user conditions
async function setupProfessionalConditions(alarmId: string) {
  const conditions = getConditionsForUserType('PROFESSIONAL');
  
  await EnhancedSmartAlarmScheduler.updateSmartAlarm(alarmId, {
    conditionBasedAdjustments: conditions,
    realTimeAdaptation: true,
    learningFactor: 0.3,
    sleepPatternWeight: 0.7
  });
  
  console.log(`Configured ${conditions.length} conditions for professional user`);
}

// Example: Use quick start preset
async function setupQuickStart(alarmId: string) {
  const preset = CONFIGURATION_PRESETS.QUICK_START;
  
  await EnhancedSmartAlarmScheduler.updateSmartAlarm(alarmId, {
    conditionBasedAdjustments: preset.conditions,
    learningFactor: preset.learningFactor,
    sleepPatternWeight: preset.sleepPatternWeight
  });
  
  console.log(`Applied quick start configuration: ${preset.description}`);
}

// Example: Create custom condition set
async function setupCustomConditions(alarmId: string) {
  const customConditions = createCustomConditionSet([
    'weather_rain_light',
    'calendar_important',
    'sleep_debt_high',
    'exercise_morning_prep',
    'stress_high_day'
  ]);
  
  await EnhancedSmartAlarmScheduler.updateSmartAlarm(alarmId, {
    conditionBasedAdjustments: customConditions
  });
  
  console.log(`Applied ${customConditions.length} custom conditions`);
}
*/

export default {
  WEATHER_CONDITIONS,
  CALENDAR_CONDITIONS,
  SLEEP_CONDITIONS,
  EXERCISE_CONDITIONS,
  STRESS_CONDITIONS,
  SCREEN_TIME_CONDITIONS,
  CONDITION_TEMPLATES,
  CONFIGURATION_PRESETS,
  getConditionsForUserType,
  createCustomConditionSet,
  getEssentialConditions,
  getAdvancedConditions
};