// 🚀 Advanced Conditions Integration & Setup Helper
// Complete implementation assistant for condition-based adjustments

import { 
  EnhancedSmartAlarmScheduler,
  type EnhancedSmartAlarm,
  type ConditionBasedAdjustment 
} from './src/services/enhanced-smart-alarm-scheduler';
import {
  WEATHER_CONDITIONS,
  CALENDAR_CONDITIONS, 
  SLEEP_CONDITIONS,
  EXERCISE_CONDITIONS,
  STRESS_CONDITIONS,
  SCREEN_TIME_CONDITIONS,
  CONDITION_TEMPLATES,
  CONFIGURATION_PRESETS
} from './ADVANCED_CONDITIONS_IMPLEMENTATION';

// ===== INTEGRATION HELPER CLASS =====

export class AdvancedConditionsHelper {
  
  // ===== SETUP ASSISTANTS =====
  
  static async setupBasicConditions(alarmId: string): Promise<void> {
    console.log('🔧 Setting up basic condition-based adjustments...');
    
    const basicConditions: ConditionBasedAdjustment[] = [
      WEATHER_CONDITIONS.RAIN_LIGHT,
      WEATHER_CONDITIONS.SNOW,
      CALENDAR_CONDITIONS.IMPORTANT_MEETINGS,
      CALENDAR_CONDITIONS.WEEKEND_MODE,
      SLEEP_CONDITIONS.SLEEP_DEBT_HIGH
    ];

    const currentAlarm = await EnhancedSmartAlarmScheduler.getSmartAlarm(alarmId);
    if (!currentAlarm) {
      throw new Error(`Alarm with ID ${alarmId} not found`);
    }

    await EnhancedSmartAlarmScheduler.updateSmartAlarm(alarmId, {
      conditionBasedAdjustments: basicConditions,
      realTimeAdaptation: true,
      learningFactor: 0.3,
      sleepPatternWeight: 0.7
    });

    console.log(`✅ Basic conditions configured: ${basicConditions.length} conditions active`);
    this.logConditionSummary(basicConditions);
  }

  static async setupUserTypeConditions(
    alarmId: string, 
    userType: keyof typeof CONDITION_TEMPLATES
  ): Promise<void> {
    console.log(`🎯 Setting up ${userType.toLowerCase()} conditions...`);
    
    const conditions = CONDITION_TEMPLATES[userType];
    if (!conditions) {
      throw new Error(`Unknown user type: ${userType}`);
    }

    // User-specific optimizations
    const config = this.getUserTypeConfig(userType);
    
    await EnhancedSmartAlarmScheduler.updateSmartAlarm(alarmId, {
      conditionBasedAdjustments: conditions,
      realTimeAdaptation: true,
      learningFactor: config.learningFactor,
      sleepPatternWeight: config.sleepPatternWeight,
      dynamicWakeWindow: config.dynamicWakeWindow
    });

    console.log(`✅ ${userType} conditions configured: ${conditions.length} conditions active`);
    console.log(`📊 Learning factor: ${config.learningFactor}, Sleep weight: ${config.sleepPatternWeight}`);
    this.logConditionSummary(conditions);
  }

  static async setupCustomConditions(
    alarmId: string,
    conditionIds: string[],
    customConfig?: Partial<EnhancedSmartAlarm>
  ): Promise<void> {
    console.log('🎨 Setting up custom condition configuration...');
    
    const allConditions = this.getAllConditionsMap();
    const selectedConditions: ConditionBasedAdjustment[] = [];
    
    for (const id of conditionIds) {
      const condition = allConditions[id];
      if (!condition) {
        console.warn(`⚠️  Condition '${id}' not found, skipping...`);
        continue;
      }
      selectedConditions.push(condition);
    }

    if (selectedConditions.length === 0) {
      throw new Error('No valid conditions found in the provided IDs');
    }

    const defaultConfig = {
      realTimeAdaptation: true,
      learningFactor: 0.3,
      sleepPatternWeight: 0.7,
      dynamicWakeWindow: true
    };

    await EnhancedSmartAlarmScheduler.updateSmartAlarm(alarmId, {
      conditionBasedAdjustments: selectedConditions,
      ...defaultConfig,
      ...customConfig
    });

    console.log(`✅ Custom conditions configured: ${selectedConditions.length} conditions active`);
    this.logConditionSummary(selectedConditions);
  }

  static async applyPreset(
    alarmId: string, 
    presetName: keyof typeof CONFIGURATION_PRESETS
  ): Promise<void> {
    console.log(`⚡ Applying ${presetName.toLowerCase()} preset...`);
    
    const preset = CONFIGURATION_PRESETS[presetName];
    if (!preset) {
      throw new Error(`Unknown preset: ${presetName}`);
    }

    await EnhancedSmartAlarmScheduler.updateSmartAlarm(alarmId, {
      conditionBasedAdjustments: preset.conditions,
      learningFactor: preset.learningFactor,
      sleepPatternWeight: preset.sleepPatternWeight,
      realTimeAdaptation: true
    });

    console.log(`✅ ${presetName} preset applied: ${preset.description}`);
    console.log(`📊 ${preset.conditions.length} conditions, Learning: ${preset.learningFactor}, Sleep Weight: ${preset.sleepPatternWeight}`);
    this.logConditionSummary(preset.conditions);
  }

  // ===== VALIDATION & ANALYSIS =====
  
  static async validateConditionSetup(alarmId: string): Promise<ValidationResult> {
    console.log('🔍 Validating condition configuration...');
    
    const alarm = await EnhancedSmartAlarmScheduler.getSmartAlarm(alarmId) as EnhancedSmartAlarm;
    if (!alarm) {
      return {
        isValid: false,
        issues: ['Alarm not found'],
        recommendations: ['Check alarm ID'],
        score: 0
      };
    }

    const conditions = alarm.conditionBasedAdjustments || [];
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check if conditions are enabled
    if (conditions.length === 0) {
      issues.push('No conditions configured');
      recommendations.push('Enable basic conditions (weather, calendar, sleep debt)');
      score -= 40;
    }

    const enabledConditions = conditions.filter(c => c.isEnabled);
    if (enabledConditions.length < conditions.length) {
      issues.push(`${conditions.length - enabledConditions.length} conditions are disabled`);
      recommendations.push('Review and enable useful conditions');
      score -= 10;
    }

    // Check for essential condition types
    const hasWeather = conditions.some(c => c.type === 'weather' && c.isEnabled);
    const hasCalendar = conditions.some(c => c.type === 'calendar' && c.isEnabled);
    const hasSleepDebt = conditions.some(c => c.type === 'sleep_debt' && c.isEnabled);

    if (!hasWeather) {
      recommendations.push('Add weather conditions for commute optimization');
      score -= 15;
    }
    if (!hasCalendar) {
      recommendations.push('Add calendar integration for event preparation');
      score -= 15;  
    }
    if (!hasSleepDebt) {
      recommendations.push('Add sleep debt tracking for energy management');
      score -= 20;
    }

    // Check for conflicting priorities
    const criticalConditions = conditions.filter(c => c.priority === 5 && c.isEnabled);
    if (criticalConditions.length > 3) {
      issues.push('Too many critical priority conditions may cause conflicts');
      recommendations.push('Review priority levels and reduce critical conditions');
      score -= 10;
    }

    // Check effectiveness scores
    const poorConditions = conditions.filter(c => c.effectivenessScore < 0.6 && c.isEnabled);
    if (poorConditions.length > 0) {
      issues.push(`${poorConditions.length} conditions have low effectiveness`);
      recommendations.push('Disable or adjust poorly performing conditions');
      score -= poorConditions.length * 5;
    }

    // Check learning configuration
    if (alarm.learningFactor < 0.1) {
      issues.push('Learning factor too low for effective adaptation');
      recommendations.push('Increase learning factor to 0.2-0.3');
      score -= 10;
    } else if (alarm.learningFactor > 0.6) {
      issues.push('Learning factor too high may cause instability');
      recommendations.push('Reduce learning factor to 0.3-0.4');
      score -= 5;
    }

    const isValid = issues.length === 0;
    const grade = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'Poor';

    console.log(`📊 Validation complete: ${grade} (${score}/100)`);
    if (issues.length > 0) {
      console.log('⚠️  Issues:', issues);
    }
    if (recommendations.length > 0) {
      console.log('💡 Recommendations:', recommendations);
    }

    return {
      isValid,
      issues,
      recommendations,
      score,
      grade,
      enabledConditions: enabledConditions.length,
      totalConditions: conditions.length
    };
  }

  static async analyzeConditionPerformance(alarmId: string): Promise<PerformanceAnalysis> {
    console.log('📈 Analyzing condition performance...');
    
    const alarm = await EnhancedSmartAlarmScheduler.getSmartAlarm(alarmId) as EnhancedSmartAlarm;
    if (!alarm) {
      throw new Error('Alarm not found');
    }

    const conditions = alarm.conditionBasedAdjustments || [];
    const feedback = alarm.wakeUpFeedback || [];
    const adaptations = alarm.adaptationHistory || [];

    // Group conditions by performance
    const excellent = conditions.filter(c => c.effectivenessScore >= 0.9);
    const good = conditions.filter(c => c.effectivenessScore >= 0.7 && c.effectivenessScore < 0.9);  
    const fair = conditions.filter(c => c.effectivenessScore >= 0.5 && c.effectivenessScore < 0.7);
    const poor = conditions.filter(c => c.effectivenessScore < 0.5);

    // Calculate overall metrics
    const avgEffectiveness = conditions.length > 0 ? 
      conditions.reduce((sum, c) => sum + c.effectivenessScore, 0) / conditions.length : 0;
    
    const recentFeedback = feedback.filter(f => 
      f.date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    
    const avgSatisfaction = recentFeedback.length > 0 ?
      recentFeedback.reduce((sum, f) => {
        const feelingScore = this.feelingToScore(f.feeling);
        return sum + feelingScore;
      }, 0) / recentFeedback.length : 0;

    const recentAdaptations = adaptations.filter(a =>
      a.date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    console.log(`📊 Performance Analysis Complete:`);
    console.log(`   Average Effectiveness: ${Math.round(avgEffectiveness * 100)}%`);
    console.log(`   User Satisfaction: ${Math.round(avgSatisfaction * 100)}%`);
    console.log(`   Recent Adaptations: ${recentAdaptations.length} this week`);

    return {
      overallEffectiveness: avgEffectiveness,
      userSatisfaction: avgSatisfaction,
      conditionBreakdown: {
        excellent: excellent.length,
        good: good.length,
        fair: fair.length,
        poor: poor.length
      },
      topPerformers: excellent.slice(0, 3).map(c => c.id),
      underPerformers: poor.map(c => c.id),
      recentAdaptations: recentAdaptations.length,
      recommendedActions: this.generatePerformanceRecommendations(
        avgEffectiveness, avgSatisfaction, poor.length, recentAdaptations.length
      )
    };
  }

  // ===== OPTIMIZATION HELPERS =====

  static async optimizeConditions(alarmId: string): Promise<void> {
    console.log('🔧 Optimizing condition configuration...');
    
    const performance = await this.analyzeConditionPerformance(alarmId);
    const alarm = await EnhancedSmartAlarmScheduler.getSmartAlarm(alarmId) as EnhancedSmartAlarm;
    
    if (!alarm) return;
    
    const optimizedConditions = alarm.conditionBasedAdjustments?.map(condition => {
      // Reduce adjustment magnitude for poor performers
      if (condition.effectivenessScore < 0.5) {
        return {
          ...condition,
          adjustment: {
            ...condition.adjustment,
            timeMinutes: Math.round(condition.adjustment.timeMinutes * 0.7)
          }
        };
      }
      
      // Increase effectiveness for good performers
      if (condition.effectivenessScore > 0.8) {
        return {
          ...condition,
          adjustment: {
            ...condition.adjustment,
            maxAdjustment: Math.min(condition.adjustment.maxAdjustment + 5, 60)
          }
        };
      }
      
      return condition;
    });

    await EnhancedSmartAlarmScheduler.updateSmartAlarm(alarmId, {
      conditionBasedAdjustments: optimizedConditions
    });

    console.log('✅ Conditions optimized based on performance data');
  }

  static async suggestConditions(alarmId: string): Promise<ConditionSuggestions> {
    console.log('💡 Generating condition suggestions...');
    
    const alarm = await EnhancedSmartAlarmScheduler.getSmartAlarm(alarmId) as EnhancedSmartAlarm;
    if (!alarm) {
      throw new Error('Alarm not found');
    }

    const currentConditions = alarm.conditionBasedAdjustments || [];
    const currentTypes = new Set(currentConditions.map(c => c.type));
    const suggestions: string[] = [];
    const removeRecommendations: string[] = [];

    // Suggest missing essential conditions
    if (!currentTypes.has('weather')) {
      suggestions.push('Add weather conditions for commute optimization');
    }
    if (!currentTypes.has('calendar')) {
      suggestions.push('Add calendar integration for event preparation');
    }
    if (!currentTypes.has('sleep_debt')) {
      suggestions.push('Add sleep debt tracking for better recovery');
    }

    // Suggest removal of poor performers
    const poorConditions = currentConditions.filter(c => c.effectivenessScore < 0.4);
    for (const condition of poorConditions) {
      removeRecommendations.push(`Consider disabling '${condition.id}' (${Math.round(condition.effectivenessScore * 100)}% effective)`);
    }

    // Suggest additional conditions based on user patterns
    const feedback = alarm.wakeUpFeedback || [];
    const recentFeedback = feedback.slice(-10);
    
    if (recentFeedback.some(f => f.difficulty === 'very_hard' || f.difficulty === 'hard')) {
      if (!currentTypes.has('exercise')) {
        suggestions.push('Add exercise recovery conditions - may help with difficult wake-ups');
      }
      if (!currentTypes.has('stress_level')) {
        suggestions.push('Add stress level monitoring - stress affects sleep quality');
      }
    }

    if (recentFeedback.some(f => f.notes?.toLowerCase().includes('screen') || f.timeToFullyAwake > 30)) {
      if (!currentTypes.has('screen_time')) {
        suggestions.push('Add screen time tracking - blue light affects sleep quality');
      }
    }

    console.log(`💡 Generated ${suggestions.length} suggestions and ${removeRecommendations.length} removal recommendations`);

    return {
      addConditions: suggestions,
      removeConditions: removeRecommendations,
      optimizationTips: [
        'Monitor condition effectiveness monthly',
        'Adjust learning factor based on schedule stability', 
        'Provide consistent feedback for better AI learning',
        'Review priority levels to avoid conflicts'
      ]
    };
  }

  // ===== UTILITY METHODS =====

  private static getUserTypeConfig(userType: string) {
    const configs = {
      PROFESSIONAL: { learningFactor: 0.3, sleepPatternWeight: 0.7, dynamicWakeWindow: true },
      STUDENT: { learningFactor: 0.4, sleepPatternWeight: 0.5, dynamicWakeWindow: true },
      FITNESS: { learningFactor: 0.3, sleepPatternWeight: 0.8, dynamicWakeWindow: true },
      SHIFT_WORKER: { learningFactor: 0.5, sleepPatternWeight: 0.4, dynamicWakeWindow: false },
      PARENT: { learningFactor: 0.2, sleepPatternWeight: 0.6, dynamicWakeWindow: true },
      TRAVELER: { learningFactor: 0.4, sleepPatternWeight: 0.5, dynamicWakeWindow: true }
    };
    return configs[userType as keyof typeof configs] || configs.PROFESSIONAL;
  }

  private static getAllConditionsMap() {
    return {
      ...WEATHER_CONDITIONS,
      ...CALENDAR_CONDITIONS,
      ...SLEEP_CONDITIONS,
      ...EXERCISE_CONDITIONS,
      ...STRESS_CONDITIONS,
      ...SCREEN_TIME_CONDITIONS
    };
  }

  private static logConditionSummary(conditions: ConditionBasedAdjustment[]) {
    const byType = conditions.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📋 Condition Summary:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} condition${count > 1 ? 's' : ''}`);
    });

    const avgPriority = conditions.reduce((sum, c) => sum + c.priority, 0) / conditions.length;
    const avgEffectiveness = conditions.reduce((sum, c) => sum + c.effectivenessScore, 0) / conditions.length;
    
    console.log(`   Average Priority: ${avgPriority.toFixed(1)}/5`);
    console.log(`   Average Effectiveness: ${Math.round(avgEffectiveness * 100)}%`);
  }

  private static feelingToScore(feeling: string): number {
    const scores = {
      'terrible': 0.1,
      'tired': 0.3,
      'okay': 0.5,
      'good': 0.7,
      'excellent': 0.9
    };
    return scores[feeling as keyof typeof scores] || 0.5;
  }

  private static generatePerformanceRecommendations(
    effectiveness: number,
    satisfaction: number,
    poorCount: number,
    adaptationCount: number
  ): string[] {
    const recommendations: string[] = [];

    if (effectiveness < 0.7) {
      recommendations.push('Review and disable low-performing conditions');
    }
    if (satisfaction < 0.7) {
      recommendations.push('Consider adjusting learning factor or sleep pattern weight');
    }
    if (poorCount > 2) {
      recommendations.push('Too many ineffective conditions - simplify your setup');
    }
    if (adaptationCount > 15) {
      recommendations.push('Too many adaptations - reduce learning factor');
    } else if (adaptationCount < 2) {
      recommendations.push('Very few adaptations - consider increasing learning factor');
    }

    return recommendations;
  }
}

// ===== TYPES =====

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
  score: number;
  grade?: string;
  enabledConditions?: number;
  totalConditions?: number;
}

interface PerformanceAnalysis {
  overallEffectiveness: number;
  userSatisfaction: number;
  conditionBreakdown: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  topPerformers: string[];
  underPerformers: string[];
  recentAdaptations: number;
  recommendedActions: string[];
}

interface ConditionSuggestions {
  addConditions: string[];
  removeConditions: string[];
  optimizationTips: string[];
}

// ===== QUICK SETUP SCRIPTS =====

export const QuickSetupScripts = {
  
  async setupNewUser(alarmId: string, userType: keyof typeof CONDITION_TEMPLATES = 'PROFESSIONAL') {
    console.log('🚀 Setting up new user with enhanced smart alarm...');
    
    try {
      await AdvancedConditionsHelper.setupUserTypeConditions(alarmId, userType);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for setup
      
      const validation = await AdvancedConditionsHelper.validateConditionSetup(alarmId);
      console.log(`✅ Setup complete: ${validation.grade} (${validation.score}/100)`);
      
      if (validation.recommendations.length > 0) {
        console.log('💡 Next steps:', validation.recommendations);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Setup failed:', error);
      return false;
    }
  },

  async weeklyOptimization(alarmId: string) {
    console.log('📅 Running weekly optimization...');
    
    try {
      const performance = await AdvancedConditionsHelper.analyzeConditionPerformance(alarmId);
      await AdvancedConditionsHelper.optimizeConditions(alarmId);
      const suggestions = await AdvancedConditionsHelper.suggestConditions(alarmId);
      
      console.log('📊 Weekly Report:');
      console.log(`   Effectiveness: ${Math.round(performance.overallEffectiveness * 100)}%`);
      console.log(`   Satisfaction: ${Math.round(performance.userSatisfaction * 100)}%`);
      console.log(`   Top Performers: ${performance.topPerformers.join(', ')}`);
      
      if (suggestions.addConditions.length > 0) {
        console.log('💡 Consider adding:', suggestions.addConditions[0]);
      }
      
      return performance;
    } catch (error) {
      console.error('❌ Optimization failed:', error);
      return null;
    }
  },

  async emergencyReset(alarmId: string) {
    console.log('🔄 Performing emergency reset to basic conditions...');
    
    try {
      await AdvancedConditionsHelper.setupBasicConditions(alarmId);
      console.log('✅ Reset complete - basic conditions restored');
      return true;
    } catch (error) {
      console.error('❌ Reset failed:', error);
      return false;
    }
  }
};

// ===== USAGE EXAMPLES =====

/*
// Example 1: Setup for professional user
await QuickSetupScripts.setupNewUser('alarm-123', 'PROFESSIONAL');

// Example 2: Apply quick start preset
await AdvancedConditionsHelper.applyPreset('alarm-123', 'QUICK_START');

// Example 3: Setup custom conditions
await AdvancedConditionsHelper.setupCustomConditions('alarm-123', [
  'weather_rain_light',
  'calendar_important',
  'sleep_debt_high',
  'exercise_morning_prep'
]);

// Example 4: Weekly maintenance
await QuickSetupScripts.weeklyOptimization('alarm-123');

// Example 5: Validate current setup
const validation = await AdvancedConditionsHelper.validateConditionSetup('alarm-123');
console.log(`Setup Quality: ${validation.grade}`);
*/

export default AdvancedConditionsHelper;