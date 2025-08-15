# ⚙️ Advanced Condition-Based Adjustments Configuration Guide

## 🎯 Understanding Condition-Based Adjustments

Condition-based adjustments automatically modify your alarm timing based on real-world factors that affect your morning routine. Each condition has:

- **Trigger**: What activates the adjustment (weather, calendar event, sleep data)
- **Priority**: How important this condition is (1-5 scale) 
- **Adjustment**: How many minutes to shift your alarm (+ = later, - = earlier)
- **Effectiveness**: How well this adjustment works for you (0-1 score)
- **Max Adjustment**: Maximum time change allowed for safety

## 🌦️ Weather Condition Configurations

### **Essential Weather Adjustments**

#### **Rain/Light Precipitation** 🌧️
```typescript
{
  id: 'weather_rain',
  type: 'weather',
  isEnabled: true,
  priority: 3,
  condition: {
    operator: 'contains',
    value: 'rain',
    threshold: 0.5 // 50% chance or higher
  },
  adjustment: {
    timeMinutes: -10,        // Wake up 10 minutes earlier
    maxAdjustment: 20,       // Max 20 minutes earlier
    reason: 'Extra commute time for rainy weather'
  },
  effectivenessScore: 0.8    // Initially high effectiveness
}
```

#### **Heavy Rain/Storms** ⛈️
```typescript
{
  id: 'weather_storm',
  type: 'weather',
  isEnabled: true,
  priority: 4,
  condition: {
    operator: 'greater_than',
    value: 'precipitation_intensity',
    threshold: 2.5 // Heavy rain threshold
  },
  adjustment: {
    timeMinutes: -20,        // Wake up 20 minutes earlier
    maxAdjustment: 35,       // Max 35 minutes earlier
    reason: 'Severe weather requires extra preparation time'
  },
  effectivenessScore: 0.85
}
```

#### **Snow/Ice Conditions** ❄️
```typescript
{
  id: 'weather_snow',
  type: 'weather', 
  isEnabled: true,
  priority: 5,               // Highest priority - safety critical
  condition: {
    operator: 'contains',
    value: 'snow',
    threshold: 1.0 // Any snow accumulation
  },
  adjustment: {
    timeMinutes: -30,        // Wake up 30 minutes earlier
    maxAdjustment: 60,       // Max 1 hour earlier
    reason: 'Snow/ice conditions require extra travel time'
  },
  effectivenessScore: 0.9
}
```

#### **Extreme Temperature** 🌡️
```typescript
{
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
    timeMinutes: -15,        // Extra warm-up time
    maxAdjustment: 25,
    reason: 'Extra time needed to warm up car and dress appropriately'
  },
  effectivenessScore: 0.75
}
```

#### **Perfect Weather Bonus** ☀️
```typescript
{
  id: 'weather_perfect',
  type: 'weather',
  isEnabled: true,
  priority: 1,               // Low priority - nice to have
  condition: {
    operator: 'equals',
    value: 'condition',
    threshold: 'clear'
  },
  adjustment: {
    timeMinutes: 5,          // Wake up 5 minutes later 
    maxAdjustment: 10,       // Enjoy the nice weather
    reason: 'Perfect weather allows relaxed morning'
  },
  effectivenessScore: 0.6
}
```

### **Weather Configuration by Region**

#### **Coastal/High Humidity Areas**
```typescript
{
  id: 'weather_humidity',
  type: 'weather',
  isEnabled: true,
  priority: 2,
  condition: {
    operator: 'greater_than',
    value: 'humidity',
    threshold: 85 // High humidity percentage
  },
  adjustment: {
    timeMinutes: -5,         // Slightly earlier for comfort
    maxAdjustment: 15,
    reason: 'High humidity requires extra preparation time'
  },
  effectivenessScore: 0.65
}
```

#### **Wind/Storm Prone Areas**
```typescript
{
  id: 'weather_high_wind',
  type: 'weather',
  isEnabled: true,
  priority: 4,
  condition: {
    operator: 'greater_than',
    value: 'wind_speed',
    threshold: 25 // High wind speed in mph/kmh
  },
  adjustment: {
    timeMinutes: -15,        // Account for transport delays
    maxAdjustment: 30,
    reason: 'High winds may affect transportation'
  },
  effectivenessScore: 0.8
}
```

## 📅 Calendar Integration Configurations

### **Essential Calendar Adjustments**

#### **Critical Meetings/Interviews** 🎯
```typescript
{
  id: 'calendar_critical',
  type: 'calendar',
  isEnabled: true,
  priority: 5,               // Highest priority
  condition: {
    operator: 'contains',
    value: ['critical', 'interview', 'presentation', 'important meeting'],
    threshold: 1 // Any match triggers
  },
  adjustment: {
    timeMinutes: -45,        // Wake up 45 minutes earlier
    maxAdjustment: 90,       // Max 1.5 hours earlier
    reason: 'Critical events need extensive preparation time'
  },
  effectivenessScore: 0.95
}
```

#### **Early Morning Meetings** 🌅
```typescript
{
  id: 'calendar_early_meeting',
  type: 'calendar',
  isEnabled: true,
  priority: 4,
  condition: {
    operator: 'less_than',
    value: 'first_event_time',
    threshold: '08:00' // Before 8 AM
  },
  adjustment: {
    timeMinutes: -30,        // Extra preparation time
    maxAdjustment: 60,
    reason: 'Early meetings require additional preparation'
  },
  effectivenessScore: 0.85
}
```

#### **All-Day Events/Conferences** 📊
```typescript
{
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
    timeMinutes: -20,        // Extra energy preparation
    maxAdjustment: 40,
    reason: 'All-day events require extra energy and preparation'
  },
  effectivenessScore: 0.8
}
```

#### **Weekend/Holiday Mode** 🏖️
```typescript
{
  id: 'calendar_weekend',
  type: 'calendar',
  isEnabled: true,
  priority: 2,
  condition: {
    operator: 'equals',
    value: 'day_type',
    threshold: ['saturday', 'sunday', 'holiday']
  },
  adjustment: {
    timeMinutes: 45,         // Wake up 45 minutes later
    maxAdjustment: 120,      // Max 2 hours later
    reason: 'Weekend relaxation and recovery time'
  },
  effectivenessScore: 0.9
}
```

#### **Travel Days** ✈️
```typescript
{
  id: 'calendar_travel',
  type: 'calendar',
  isEnabled: true,
  priority: 5,
  condition: {
    operator: 'contains',
    value: ['flight', 'travel', 'trip', 'airport', 'departure'],
    threshold: 1
  },
  adjustment: {
    timeMinutes: -60,        // Wake up 1 hour earlier
    maxAdjustment: 120,      // Max 2 hours earlier
    reason: 'Travel requires extra preparation and buffer time'
  },
  effectivenessScore: 0.9
}
```

#### **Social Events (Previous Night Impact)** 🎉
```typescript
{
  id: 'calendar_late_social',
  type: 'calendar',
  isEnabled: true,
  priority: 3,
  condition: {
    operator: 'contains',
    value: 'previous_evening_events',
    threshold: ['party', 'dinner', 'social', 'event'] // Events ending after 10 PM
  },
  adjustment: {
    timeMinutes: 15,         // Wake up 15 minutes later
    maxAdjustment: 30,       // Allow recovery time
    reason: 'Late social events impact morning energy'
  },
  effectivenessScore: 0.75
}
```

### **Advanced Calendar Conditions**

#### **Meeting Density Analysis** 📈
```typescript
{
  id: 'calendar_busy_day',
  type: 'calendar',
  isEnabled: true,
  priority: 3,
  condition: {
    operator: 'greater_than',
    value: 'meeting_count',
    threshold: 5 // More than 5 meetings
  },
  adjustment: {
    timeMinutes: -20,        // Extra energy preparation
    maxAdjustment: 35,
    reason: 'Busy day requires extra mental preparation'
  },
  effectivenessScore: 0.7
}
```

#### **Meeting-Free Days** 🆓
```typescript
{
  id: 'calendar_free_day',
  type: 'calendar',
  isEnabled: true,
  priority: 1,
  condition: {
    operator: 'equals',
    value: 'meeting_count',
    threshold: 0 // No scheduled meetings
  },
  adjustment: {
    timeMinutes: 15,         // Relaxed morning
    maxAdjustment: 30,
    reason: 'Free day allows for relaxed morning routine'
  },
  effectivenessScore: 0.8
}
```

## 😴 Sleep Pattern Adjustments

### **Sleep Debt Management**

#### **Moderate Sleep Debt (30-60 minutes)** 
```typescript
{
  id: 'sleep_debt_moderate',
  type: 'sleep_debt',
  isEnabled: true,
  priority: 3,
  condition: {
    operator: 'greater_than',
    value: 'sleep_debt_minutes',
    threshold: 30 // 30+ minutes of debt
  },
  adjustment: {
    timeMinutes: -10,        // Slightly earlier bedtime signal
    maxAdjustment: 20,
    reason: 'Moderate sleep debt requires minor recovery adjustment'
  },
  effectivenessScore: 0.7
}
```

#### **High Sleep Debt (1-2 hours)**
```typescript
{
  id: 'sleep_debt_high',
  type: 'sleep_debt',
  isEnabled: true,
  priority: 4,
  condition: {
    operator: 'greater_than',
    value: 'sleep_debt_minutes',
    threshold: 60 // 1+ hours of debt
  },
  adjustment: {
    timeMinutes: -20,        // Earlier wake for bedtime discipline
    maxAdjustment: 40,
    reason: 'High sleep debt requires recovery adjustment'
  },
  effectivenessScore: 0.8
}
```

#### **Severe Sleep Debt (2+ hours)**
```typescript
{
  id: 'sleep_debt_severe',
  type: 'sleep_debt',
  isEnabled: true,
  priority: 5,
  condition: {
    operator: 'greater_than',
    value: 'sleep_debt_minutes',
    threshold: 120 // 2+ hours of debt
  },
  adjustment: {
    timeMinutes: -30,        // Significant adjustment needed
    maxAdjustment: 60,
    reason: 'Severe sleep debt requires immediate schedule correction'
  },
  effectivenessScore: 0.85
}
```

#### **Sleep Credit (Extra Sleep)** 💤
```typescript
{
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
    timeMinutes: 10,         // Slightly later wake up
    maxAdjustment: 20,
    reason: 'Extra sleep credit allows for relaxed morning'
  },
  effectivenessScore: 0.75
}
```

### **Sleep Quality Patterns**

#### **Poor Sleep Quality Recovery** 
```typescript
{
  id: 'sleep_quality_poor',
  type: 'sleep_debt',
  isEnabled: true,
  priority: 4,
  condition: {
    operator: 'less_than',
    value: 'sleep_quality_score',
    threshold: 6 // Below 6/10 quality
  },
  adjustment: {
    timeMinutes: -15,        // Earlier schedule to improve habits
    maxAdjustment: 30,
    reason: 'Poor sleep quality requires routine adjustment'
  },
  effectivenessScore: 0.75
}
```

#### **Excellent Sleep Quality** ⭐
```typescript
{
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
    timeMinutes: 5,          // Small reward for good sleep
    maxAdjustment: 15,
    reason: 'Excellent sleep quality allows relaxed wake-up'
  },
  effectivenessScore: 0.8
}
```

#### **Sleep Stage Optimization** 🧠
```typescript
{
  id: 'sleep_stage_deep',
  type: 'sleep_debt',
  isEnabled: true,
  priority: 3,
  condition: {
    operator: 'equals',
    value: 'predicted_sleep_stage',
    threshold: 'deep_sleep' // Avoid deep sleep wake-ups
  },
  adjustment: {
    timeMinutes: 15,         // Delay to avoid deep sleep stage
    maxAdjustment: 25,
    reason: 'Avoid waking during deep sleep for better alertness'
  },
  effectivenessScore: 0.9
}
```

#### **REM Sleep Optimization** 💭
```typescript
{
  id: 'sleep_stage_light',
  type: 'sleep_debt',
  isEnabled: true,
  priority: 3,
  condition: {
    operator: 'equals',
    value: 'predicted_sleep_stage',
    threshold: 'light_sleep' // Optimal wake-up stage
  },
  adjustment: {
    timeMinutes: -5,         // Slightly earlier to catch light sleep
    maxAdjustment: 10,
    reason: 'Wake during light sleep for optimal alertness'
  },
  effectivenessScore: 0.85
}
```

## 🏋️ Exercise & Activity Adjustments

### **Exercise Impact Conditions**

#### **Intense Workout Recovery** 💪
```typescript
{
  id: 'exercise_intense_recovery',
  type: 'exercise',
  isEnabled: true,
  priority: 3,
  condition: {
    operator: 'greater_than',
    value: 'previous_day_exercise_minutes',
    threshold: 90 // 90+ minutes of exercise
  },
  adjustment: {
    timeMinutes: 20,         // Extra recovery time
    maxAdjustment: 40,
    reason: 'Intense exercise requires additional recovery sleep'
  },
  effectivenessScore: 0.8
}
```

#### **Morning Workout Preparation** 🌅
```typescript
{
  id: 'exercise_morning_prep',
  type: 'exercise',
  isEnabled: true,
  priority: 4,
  condition: {
    operator: 'contains',
    value: 'morning_calendar',
    threshold: ['workout', 'gym', 'run', 'exercise']
  },
  adjustment: {
    timeMinutes: -30,        // Extra preparation time
    maxAdjustment: 45,
    reason: 'Morning workouts need preparation and warm-up time'
  },
  effectivenessScore: 0.85
}
```

## 🧠 Stress & Mental Health Conditions

### **Stress Level Adjustments**

#### **High Stress Day Preparation** 
```typescript
{
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
    timeMinutes: -15,        // Extra mental preparation time
    maxAdjustment: 30,
    reason: 'High stress days need extra mental preparation'
  },
  effectivenessScore: 0.75
}
```

#### **Relaxed Day Adjustment** 😌
```typescript
{
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
    timeMinutes: 10,         // Relaxed morning
    maxAdjustment: 20,
    reason: 'Low stress day allows for relaxed morning routine'
  },
  effectivenessScore: 0.7
}
```

## 📱 Technology Impact Conditions

### **Screen Time Adjustments**

#### **High Screen Time Before Bed** 
```typescript
{
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
    timeMinutes: 8,          // Delayed melatonin production
    maxAdjustment: 15,
    reason: 'High screen time delays natural sleep hormones'
  },
  effectivenessScore: 0.65
}
```

#### **Blue Light Exposure Impact** 💙
```typescript
{
  id: 'blue_light_exposure',
  type: 'screen_time',
  isEnabled: true,
  priority: 2,
  condition: {
    operator: 'greater_than',
    value: 'blue_light_exposure_score',
    threshold: 8 // High exposure score
  },
  adjustment: {
    timeMinutes: 12,         // Compensate for circadian disruption
    maxAdjustment: 20,
    reason: 'Blue light exposure disrupts natural sleep-wake cycle'
  },
  effectivenessScore: 0.7
}
```

## ⚙️ Implementation Code Examples

### **Adding Conditions to Your Alarm**

```typescript
import { 
  EnhancedSmartAlarmScheduler,
  type ConditionBasedAdjustment 
} from './services/enhanced-smart-alarm-scheduler';

// Weather condition setup
const weatherConditions: ConditionBasedAdjustment[] = [
  {
    id: 'rain_commute',
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
    id: 'severe_weather',
    type: 'weather',
    isEnabled: true,
    priority: 4,
    condition: { operator: 'contains', value: 'storm' },
    adjustment: { 
      timeMinutes: -25, 
      maxAdjustment: 45, 
      reason: 'Severe weather safety preparation' 
    },
    effectivenessScore: 0.85
  }
];

// Calendar condition setup
const calendarConditions: ConditionBasedAdjustment[] = [
  {
    id: 'important_events',
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
    id: 'weekend_relaxation',
    type: 'calendar',
    isEnabled: true,
    priority: 2,
    condition: { operator: 'equals', value: 'weekend' },
    adjustment: { 
      timeMinutes: 30, 
      maxAdjustment: 60, 
      reason: 'Weekend lie-in time' 
    },
    effectivenessScore: 0.95
  }
];

// Sleep pattern conditions
const sleepConditions: ConditionBasedAdjustment[] = [
  {
    id: 'high_sleep_debt',
    type: 'sleep_debt',
    isEnabled: true,
    priority: 4,
    condition: { operator: 'greater_than', value: 60 },
    adjustment: { 
      timeMinutes: -20, 
      maxAdjustment: 40, 
      reason: 'Sleep debt recovery adjustment' 
    },
    effectivenessScore: 0.8
  },
  {
    id: 'poor_sleep_quality',
    type: 'sleep_debt',
    isEnabled: true,
    priority: 3,
    condition: { operator: 'less_than', value: 6 },
    adjustment: { 
      timeMinutes: -15, 
      maxAdjustment: 30, 
      reason: 'Poor sleep quality compensation' 
    },
    effectivenessScore: 0.75
  }
];

// Combine all conditions
const allConditions = [
  ...weatherConditions,
  ...calendarConditions,
  ...sleepConditions
];

// Update your alarm with advanced conditions
async function setupAdvancedConditions(alarmId: string) {
  const currentAlarm = await EnhancedSmartAlarmScheduler.getSmartAlarm(alarmId);
  
  if (currentAlarm) {
    await EnhancedSmartAlarmScheduler.updateSmartAlarm(alarmId, {
      conditionBasedAdjustments: allConditions,
      realTimeAdaptation: true,
      learningFactor: 0.3,
      sleepPatternWeight: 0.7
    });
    
    console.log('Advanced conditions configured successfully!');
  }
}
```

## 📊 Priority and Effectiveness Guidelines

### **Priority Level Guidelines**

```typescript
const PRIORITY_GUIDELINES = {
  5: 'Critical - Safety, travel, critical meetings',
  4: 'High - Important events, high sleep debt, severe weather', 
  3: 'Medium - Regular weather, exercise recovery, stress management',
  2: 'Low - Weekend mode, screen time, relaxation adjustments',
  1: 'Minimal - Perfect weather bonus, minor conveniences'
};
```

### **Effectiveness Score Meaning**

```typescript
const EFFECTIVENESS_RANGES = {
  0.9-1.0: 'Excellent - Nearly always improves wake-up experience',
  0.8-0.89: 'Very Good - Consistently helpful adjustments',
  0.7-0.79: 'Good - Generally beneficial',
  0.6-0.69: 'Moderate - Sometimes helpful',
  0.5-0.59: 'Poor - Rarely improves experience',
  '<0.5': 'Ineffective - Consider disabling'
};
```

## 🔧 Configuration Best Practices

### **Condition Setup Strategy**

1. **Start Simple** - Enable 3-4 basic conditions first
   ```typescript
   const basicConditions = [
     'weather_rain',      // Essential weather
     'calendar_important', // Critical events  
     'sleep_debt_high',   // Sleep management
     'calendar_weekend'   // Weekend relaxation
   ];
   ```

2. **Monitor for 2 Weeks** - Let effectiveness scores stabilize

3. **Add Gradually** - Introduce 1-2 new conditions per week

4. **Review Monthly** - Disable conditions with <0.6 effectiveness

### **Adjustment Range Guidelines**

```typescript
const ADJUSTMENT_GUIDELINES = {
  'Minor adjustments': '±5-10 minutes',
  'Moderate adjustments': '±10-20 minutes', 
  'Significant adjustments': '±20-40 minutes',
  'Major adjustments': '±40+ minutes (only for critical conditions)'
};
```

### **Seasonal Condition Management**

```typescript
// Example: Disable snow conditions in summer
const seasonallyDisableConditions = (season: string) => {
  if (season === 'summer') {
    return ['weather_snow', 'weather_extreme_cold'];
  }
  if (season === 'winter') {
    return ['weather_extreme_heat'];
  }
  return [];
};
```

## 📈 Monitoring and Optimization

### **Weekly Effectiveness Review**

```typescript
async function reviewConditionEffectiveness(alarmId: string) {
  const alarm = await EnhancedSmartAlarmScheduler.getSmartAlarm(alarmId);
  const conditions = alarm?.conditionBasedAdjustments || [];
  
  const effectivenessReport = conditions.map(condition => ({
    id: condition.id,
    type: condition.type,
    effectiveness: condition.effectivenessScore,
    priority: condition.priority,
    status: condition.effectivenessScore >= 0.6 ? 'Keep' : 'Review'
  }));
  
  console.log('Condition Effectiveness Report:', effectivenessReport);
  
  // Identify conditions to optimize
  const poorConditions = conditions.filter(c => c.effectivenessScore < 0.6);
  if (poorConditions.length > 0) {
    console.log('Conditions to review:', poorConditions.map(c => c.id));
  }
  
  return effectivenessReport;
}
```

### **Automated Optimization**

```typescript
async function optimizeConditions(alarmId: string) {
  const alarm = await EnhancedSmartAlarmScheduler.getSmartAlarm(alarmId);
  if (!alarm) return;
  
  const optimizedConditions = alarm.conditionBasedAdjustments?.map(condition => {
    // Auto-adjust effectiveness based on recent feedback
    if (condition.effectivenessScore < 0.5) {
      // Reduce adjustment magnitude for poor performers
      return {
        ...condition,
        adjustment: {
          ...condition.adjustment,
          timeMinutes: Math.round(condition.adjustment.timeMinutes * 0.7)
        }
      };
    }
    return condition;
  });
  
  await EnhancedSmartAlarmScheduler.updateSmartAlarm(alarmId, {
    conditionBasedAdjustments: optimizedConditions
  });
}
```

## 🎯 Quick Setup Templates

### **Professional Template**
```typescript
const professionalConditions = [
  weatherRainAdjustment(-10),
  calendarImportantEvents(-30),
  sleepDebtHigh(-15),
  weekendMode(+30)
];
```

### **Student Template** 
```typescript
const studentConditions = [
  examPreparation(-45),
  weekendRecovery(+60),
  screenTimeHigh(+10),
  sleepDebtModerate(-20)
];
```

### **Fitness Template**
```typescript
const fitnessConditions = [
  exerciseRecovery(+20),
  morningWorkoutPrep(-30),
  sleepDebtAthlete(-25),
  weatherCommute(-10)
];
```

Your advanced condition-based adjustments are now configured for intelligent, automatic wake-up optimization! 🚀