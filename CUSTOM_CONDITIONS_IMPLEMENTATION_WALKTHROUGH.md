# 🔧 Custom Advanced Conditions Implementation Guide

## 🎯 Your Selected Configuration

You've chosen the **Full Custom Setup** with these intelligent conditions:
- `weather_rain_light` - Rainy weather commute adjustment
- `calendar_important` - Important meeting preparation  
- `sleep_debt_high` - Sleep debt recovery management
- `exercise_morning_prep` - Morning workout preparation

This combination provides excellent coverage for daily optimization!

## 📋 Step-by-Step Implementation

### **Step 1: Access Your Enhanced Smart Alarm Settings**

1. **Open Relife App**
2. **Navigate to Alarms** → Select your main alarm
3. **Tap "Enhanced Settings"** or "🧠 Smart Settings" 
4. **Go to "Conditions" tab** (2nd tab)

### **Step 2: Apply Your Custom Configuration**

**In your app's enhanced alarm service, run:**

```typescript
import { AdvancedConditionsHelper } from './ADVANCED_CONDITIONS_HELPER';

// Your custom condition setup
const customConditions = [
  'weather_rain_light',      // 🌧️ Rain adjustment
  'calendar_important',      // 📅 Important meetings  
  'sleep_debt_high',         // 😴 Sleep debt recovery
  'exercise_morning_prep'    // 🏋️ Morning workout prep
];

// Implementation
async function setupMyCustomAlarm() {
  try {
    console.log('🔧 Setting up your custom smart alarm...');
    
    // Apply your selected conditions
    await AdvancedConditionsHelper.setupCustomConditions(
      'your-alarm-id', // Replace with your actual alarm ID
      customConditions,
      {
        // Custom configuration overrides
        learningFactor: 0.3,        // Moderate learning speed
        sleepPatternWeight: 0.7,    // 70% sleep patterns, 30% conditions
        realTimeAdaptation: true,   // Enable continuous optimization
        dynamicWakeWindow: true     // Flexible wake-up timing
      }
    );
    
    console.log('✅ Custom conditions configured successfully!');
    
    // Validate the setup
    const validation = await AdvancedConditionsHelper.validateConditionSetup('your-alarm-id');
    console.log(`📊 Setup Quality: ${validation.grade} (${validation.score}/100)`);
    
    return true;
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return false;
  }
}

// Run the setup
setupMyCustomAlarm();
```

### **Step 3: Understanding Your Selected Conditions**

#### **🌧️ Weather Rain Light (`weather_rain_light`)**
```typescript
Configuration:
├── Priority: ⭐⭐⭐ (Medium)
├── Trigger: Weather contains "rain" 
├── Adjustment: -10 minutes earlier
├── Max Change: 20 minutes
├── Reason: "Light rain may slow commute - extra preparation time"
└── Initial Effectiveness: 80%

Benefits:
✅ Never be late due to weather delays
✅ Extra time for rain gear and route planning
✅ Reduced morning stress on rainy days
```

#### **📅 Calendar Important (`calendar_important`)**
```typescript
Configuration:
├── Priority: ⭐⭐⭐⭐ (High)
├── Trigger: Calendar events with "important", "presentation", "interview"
├── Adjustment: -30 minutes earlier
├── Max Change: 60 minutes
├── Reason: "Important meetings need thorough preparation"
└── Initial Effectiveness: 90%

Benefits:
✅ Never rush important presentations
✅ Time for mental preparation and review
✅ Professional confidence and readiness
```

#### **😴 Sleep Debt High (`sleep_debt_high`)**
```typescript
Configuration:
├── Priority: ⭐⭐⭐⭐ (High)
├── Trigger: Sleep debt > 1 hour
├── Adjustment: -25 minutes earlier
├── Max Change: 45 minutes
├── Reason: "High sleep debt requires significant recovery adjustment"
└── Initial Effectiveness: 85%

Benefits:
✅ Promotes earlier bedtime habits
✅ Prevents sleep debt accumulation
✅ Better energy and cognitive function
```

#### **🏋️ Exercise Morning Prep (`exercise_morning_prep`)**
```typescript
Configuration:
├── Priority: ⭐⭐⭐⭐ (High)
├── Trigger: Calendar contains "workout", "gym", "run", "exercise"
├── Adjustment: -30 minutes earlier
├── Max Change: 45 minutes
├── Reason: "Morning workouts need preparation and warm-up time"
└── Initial Effectiveness: 85%

Benefits:
✅ Proper warm-up and preparation time
✅ Consistent workout routine maintenance
✅ Better performance and injury prevention
```

### **Step 4: Fine-Tune Your Configuration**

#### **Customize Adjustments (Optional)**
```typescript
// If you want to modify any condition settings:
const customizedConditions = customConditions.map(conditionId => {
  const condition = getConditionById(conditionId);
  
  // Example: Make rain adjustment more conservative
  if (conditionId === 'weather_rain_light') {
    return {
      ...condition,
      adjustment: {
        ...condition.adjustment,
        timeMinutes: -5,  // Changed from -10 to -5 minutes
        maxAdjustment: 15 // Changed from 20 to 15 minutes
      }
    };
  }
  
  // Example: Increase workout prep time
  if (conditionId === 'exercise_morning_prep') {
    return {
      ...condition,
      adjustment: {
        ...condition.adjustment,
        timeMinutes: -35,  // Changed from -30 to -35 minutes
        maxAdjustment: 50  // Changed from 45 to 50 minutes
      }
    };
  }
  
  return condition;
});
```

#### **Adjust Learning Parameters**
```typescript
// Conservative learning (slower, more stable)
const conservativeConfig = {
  learningFactor: 0.2,
  sleepPatternWeight: 0.8,
  confidenceThreshold: 0.7
};

// Aggressive learning (faster, more adaptive)
const aggressiveConfig = {
  learningFactor: 0.4,
  sleepPatternWeight: 0.6,
  confidenceThreshold: 0.5
};

// Apply your preferred learning style
await AdvancedConditionsHelper.setupCustomConditions(
  'your-alarm-id',
  customConditions,
  conservativeConfig // or aggressiveConfig
);
```

### **Step 5: Validation and Testing**

#### **Run Configuration Health Check**
```typescript
async function validateMySetup() {
  console.log('🔍 Validating your custom configuration...');
  
  const validation = await AdvancedConditionsHelper.validateConditionSetup('your-alarm-id');
  
  console.log(`📊 Overall Score: ${validation.score}/100 (${validation.grade})`);
  console.log(`✅ Enabled Conditions: ${validation.enabledConditions}/${validation.totalConditions}`);
  
  if (validation.issues.length > 0) {
    console.log('⚠️ Issues found:');
    validation.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (validation.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    validation.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
  
  return validation;
}

// Run validation
await validateMySetup();
```

#### **Test Scenario Simulation**
```typescript
// Test how your conditions work together
const testScenarios = [
  {
    name: "Rainy Tuesday with Important Meeting",
    conditions: {
      weather: "rain",
      calendar: ["important meeting at 9 AM"],
      sleepDebt: 45, // minutes
      exercise: false
    },
    expectedAdjustment: -30, // Likely adjustment
    description: "Rain + Important meeting should trigger both conditions"
  },
  {
    name: "Weekend Morning Workout",
    conditions: {
      weather: "clear",
      calendar: ["gym workout at 7 AM"],
      sleepDebt: 15,
      exercise: true
    },
    expectedAdjustment: -30,
    description: "Workout prep should trigger with no conflicting conditions"
  },
  {
    name: "High Sleep Debt Recovery Day",
    conditions: {
      weather: "clear", 
      calendar: ["regular work day"],
      sleepDebt: 90, // 1.5 hours debt
      exercise: false
    },
    expectedAdjustment: -25,
    description: "High sleep debt should promote earlier wake for better habits"
  }
];

// Log test scenarios for manual verification
testScenarios.forEach(scenario => {
  console.log(`🧪 Test: ${scenario.name}`);
  console.log(`   Expected: ${scenario.expectedAdjustment} minutes adjustment`);
  console.log(`   Reason: ${scenario.description}`);
});
```

### **Step 6: Monitor Performance**

#### **Weekly Performance Review**
```typescript
async function weeklyReview() {
  console.log('📅 Running weekly performance review...');
  
  const performance = await AdvancedConditionsHelper.analyzeConditionPerformance('your-alarm-id');
  
  console.log('📊 Performance Summary:');
  console.log(`   Overall Effectiveness: ${Math.round(performance.overallEffectiveness * 100)}%`);
  console.log(`   User Satisfaction: ${Math.round(performance.userSatisfaction * 100)}%`);
  console.log(`   Recent Adaptations: ${performance.recentAdaptations} this week`);
  
  console.log('\n🏆 Top Performers:');
  performance.topPerformers.forEach(performer => {
    console.log(`   ✅ ${performer}`);
  });
  
  if (performance.underPerformers.length > 0) {
    console.log('\n⚠️ Under Performers:');
    performance.underPerformers.forEach(underPerformer => {
      console.log(`   🔍 ${underPerformer} - needs review`);
    });
  }
  
  console.log('\n💡 Recommended Actions:');
  performance.recommendedActions.forEach(action => {
    console.log(`   - ${action}`);
  });
  
  return performance;
}

// Schedule weekly review (run this weekly)
await weeklyReview();
```

#### **Real-Time Monitoring Dashboard**
```typescript
// Monitor your conditions in real-time
async function showConditionStatus() {
  const alarm = await EnhancedSmartAlarmScheduler.getSmartAlarm('your-alarm-id');
  const conditions = alarm?.conditionBasedAdjustments || [];
  
  console.log('📱 Current Condition Status:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  conditions.forEach(condition => {
    const statusIcon = condition.isEnabled ? '✅' : '❌';
    const effectivenessBar = '█'.repeat(Math.round(condition.effectivenessScore * 10));
    const priority = '⭐'.repeat(condition.priority);
    
    console.log(`${statusIcon} ${condition.id}`);
    console.log(`   Priority: ${priority} (${condition.priority}/5)`);
    console.log(`   Effectiveness: ${effectivenessBar} ${Math.round(condition.effectivenessScore * 100)}%`);
    console.log(`   Adjustment: ${condition.adjustment.timeMinutes} minutes`);
    console.log(`   Reason: ${condition.adjustment.reason}`);
    console.log('');
  });
}

// Check status anytime
await showConditionStatus();
```

### **Step 7: Optimization and Maintenance**

#### **Monthly Optimization**
```typescript
async function monthlyOptimization() {
  console.log('🔧 Running monthly optimization...');
  
  // Analyze performance
  const performance = await AdvancedConditionsHelper.analyzeConditionPerformance('your-alarm-id');
  
  // Auto-optimize based on data
  await AdvancedConditionsHelper.optimizeConditions('your-alarm-id');
  
  // Get suggestions for improvements
  const suggestions = await AdvancedConditionsHelper.suggestConditions('your-alarm-id');
  
  console.log('✅ Optimization complete!');
  console.log('\n💡 Suggestions for next month:');
  suggestions.addConditions.forEach(suggestion => {
    console.log(`   + ${suggestion}`);
  });
  
  if (suggestions.removeConditions.length > 0) {
    console.log('\n🗑️ Consider removing:');
    suggestions.removeConditions.forEach(removal => {
      console.log(`   - ${removal}`);
    });
  }
  
  return { performance, suggestions };
}

// Run monthly (set a calendar reminder!)
await monthlyOptimization();
```

## 🎯 Success Metrics to Track

### **Target Performance Indicators**
```typescript
const successTargets = {
  overallEffectiveness: 0.80,    // 80%+ condition effectiveness
  userSatisfaction: 0.80,        // 80%+ wake-up satisfaction
  adaptationSuccess: 0.75,       // 75%+ successful adaptations
  weeklyAdaptations: { min: 2, max: 10 }, // 2-10 adaptations per week
  conditionHealth: {
    excellent: 2,  // At least 2 excellent conditions (90%+)
    poor: 0        // No poor conditions (<50%)
  }
};

// Check if you're meeting targets
async function checkTargets() {
  const performance = await AdvancedConditionsHelper.analyzeConditionPerformance('your-alarm-id');
  
  const results = {
    effectiveness: performance.overallEffectiveness >= successTargets.overallEffectiveness,
    satisfaction: performance.userSatisfaction >= successTargets.userSatisfaction,
    adaptations: performance.recentAdaptations >= successTargets.weeklyAdaptations.min &&
                 performance.recentAdaptations <= successTargets.weeklyAdaptations.max,
    conditionHealth: performance.conditionBreakdown.poor <= successTargets.conditionHealth.poor
  };
  
  console.log('🎯 Target Achievement:');
  Object.entries(results).forEach(([metric, achieved]) => {
    const icon = achieved ? '✅' : '❌';
    console.log(`   ${icon} ${metric}: ${achieved ? 'ACHIEVED' : 'NEEDS WORK'}`);
  });
  
  return results;
}
```

## 🚀 Quick Actions

### **Emergency Quick Fixes**
```typescript
// If something goes wrong, quick fixes:

// 1. Reset to safe defaults
await QuickSetupScripts.emergencyReset('your-alarm-id');

// 2. Disable problematic condition
const alarm = await EnhancedSmartAlarmScheduler.getSmartAlarm('your-alarm-id');
const updatedConditions = alarm.conditionBasedAdjustments?.map(c => 
  c.id === 'problematic-condition-id' ? { ...c, isEnabled: false } : c
);
await EnhancedSmartAlarmScheduler.updateSmartAlarm('your-alarm-id', {
  conditionBasedAdjustments: updatedConditions
});

// 3. Reduce learning speed if too chaotic
await EnhancedSmartAlarmScheduler.updateSmartAlarm('your-alarm-id', {
  learningFactor: 0.2  // Slower, more stable
});
```

### **Enhancement Options**
```typescript
// Add more conditions later:
const additionalConditions = [
  'weather_snow',           // Winter weather protection
  'calendar_travel',        // Travel day preparation  
  'stress_high_day',        // Stress management
  'screen_time_high'        // Blue light impact
];

// Add them individually:
await AdvancedConditionsHelper.setupCustomConditions('your-alarm-id', [
  ...customConditions,      // Your existing conditions
  ...additionalConditions   // New additions
]);
```

## ✅ Implementation Checklist

### **Setup Phase (Week 1)**
- [ ] Apply custom condition configuration
- [ ] Run validation health check  
- [ ] Test scenario simulations
- [ ] Enable feedback collection
- [ ] Set learning parameters

### **Monitoring Phase (Weeks 2-4)**
- [ ] Daily feedback provision after wake-ups
- [ ] Weekly performance reviews
- [ ] Monitor condition effectiveness scores
- [ ] Track adaptation frequency
- [ ] Note any issues or unexpected behavior

### **Optimization Phase (Month 2+)**
- [ ] Monthly optimization runs
- [ ] Add/remove conditions based on performance
- [ ] Fine-tune adjustment magnitudes
- [ ] Adjust learning parameters if needed
- [ ] Share successful patterns

## 🎉 Congratulations!

Your custom advanced condition setup is now configured with:

✅ **Intelligent Weather Adaptation** - Never late due to rain  
✅ **Important Meeting Preparation** - Always ready for critical events  
✅ **Sleep Debt Management** - Promotes healthy sleep habits  
✅ **Exercise Optimization** - Perfect workout preparation timing  

Your smart alarm will learn your patterns over 2-4 weeks and provide increasingly personalized wake-up optimization. Enjoy your enhanced mornings! 🌅