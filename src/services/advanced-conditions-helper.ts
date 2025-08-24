import {
  EnhancedSmartAlarmScheduler,
  type EnhancedSmartAlarm,
  type ConditionBasedAdjustment,
} from './enhanced-smart-alarm-scheduler';

// Predefined condition templates for the user's custom configuration
export const CUSTOM_CONDITION_TEMPLATES: Record<string, ConditionBasedAdjustment> = {
  weather_rain_light: {
    id: 'weather_rain_light',
    type: 'weather',
    isEnabled: true,
    priority: 3,
    condition: { operator: 'contains', value: 'rain' },
    adjustment: {
      timeMinutes: -10,
      maxAdjustment: 20,
      reason: 'Light rain may slow commute - extra preparation time',
    },
    effectivenessScore: 0.8,
  },

  calendar_important: {
    id: 'calendar_important',
    type: 'calendar',
    isEnabled: true,
    priority: 4,
    condition: {
      operator: 'contains',
      value: 'important|presentation|interview|meeting',
    },
    adjustment: {
      timeMinutes: -30,
      maxAdjustment: 60,
      reason: 'Important meetings need thorough preparation',
    },
    effectivenessScore: 0.9,
  },

  sleep_debt_high: {
    id: 'sleep_debt_high',
    type: 'sleep_debt',
    isEnabled: true,
    priority: 4,
    condition: { operator: 'greater_than', value: 60 }, // 1 hour debt
    adjustment: {
      timeMinutes: -25,
      maxAdjustment: 45,
      reason: 'High sleep debt requires significant recovery adjustment',
    },
    effectivenessScore: 0.85,
  },

  exercise_morning_prep: {
    id: 'exercise_morning_prep',
    type: 'exercise',
    isEnabled: true,
    priority: 4,
    condition: { operator: 'contains', value: 'workout|gym|run|exercise|training' },
    adjustment: {
      timeMinutes: -30,
      maxAdjustment: 45,
      reason: 'Morning workouts need preparation and warm-up time',
    },
    effectivenessScore: 0.85,
  },
};

export interface ConfigurationValidation {
  score: number; // 0-100
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  enabledConditions: number;
  totalConditions: number;
  issues: string[];
  recommendations: string[];
}

export interface PerformanceAnalysis {
  overallEffectiveness: number;
  userSatisfaction: number;
  recentAdaptations: number;
  topPerformers: string[];
  underPerformers: string[];
  recommendedActions: string[];
  conditionBreakdown: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

export class AdvancedConditionsHelper {
  /**
   * Setup custom conditions for a smart alarm
   */
  static async setupCustomConditions(
    alarmId: string,
    conditionIds: string[],
    config?: {
      learningFactor?: number;
      sleepPatternWeight?: number;
      realTimeAdaptation?: boolean;
      dynamicWakeWindow?: boolean;
    }
  ): Promise<void> {
    console.log('🔧 Setting up custom conditions for alarm:', alarmId);

    // Get current alarm
    const alarm = await EnhancedSmartAlarmScheduler.getSmartAlarm(alarmId);
    if (!alarm) {
      throw new Error(`Alarm with ID ${alarmId} not found`);
    }

    // Build custom conditions array
    const customConditions: ConditionBasedAdjustment[] = conditionIds
      .filter(id => CUSTOM_CONDITION_TEMPLATES[id])
      .map(id => ({ ...CUSTOM_CONDITION_TEMPLATES[id] }));

    if (customConditions.length === 0) {
      throw new Error('No valid condition IDs provided');
    }

    // Apply configuration
    const updatedAlarm: Partial<EnhancedSmartAlarm> = {
      conditionBasedAdjustments: customConditions,
      learningFactor: config?.learningFactor ?? 0.3,
      sleepPatternWeight: config?.sleepPatternWeight ?? 0.7,
      realTimeAdaptation: config?.realTimeAdaptation ?? true,
      dynamicWakeWindow: config?.dynamicWakeWindow ?? true,
    };

    await EnhancedSmartAlarmScheduler.updateSmartAlarm(alarmId, updatedAlarm);

    console.log(`✅ Successfully configured ${customConditions.length} conditions`);
    customConditions.forEach(condition => {
      console.log(
        `   - ${condition.id}: ${condition.adjustment.timeMinutes}min adjustment`
      );
    });
  }

  /**
   * Validate the current condition setup
   */
  static async validateConditionSetup(
    alarmId: string
  ): Promise<ConfigurationValidation> {
    const alarm = await EnhancedSmartAlarmScheduler.getSmartAlarm(alarmId);
    if (!alarm) {
      throw new Error(`Alarm with ID ${alarmId} not found`);
    }

    const conditions = alarm.conditionBasedAdjustments || [];
    const enabledConditions = conditions.filter((c: any
) => c.isEnabled).length;
    const totalConditions = conditions.length;

    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Base score for having conditions
    if (enabledConditions > 0) {
      score += 30;
    } else {
      issues.push('No conditions are enabled');
    }

    // Score for variety of condition types
    const conditionTypes = new Set(
      conditions.filter((c: any
) => c.isEnabled).map((c: any
) => c.type)
    );
    if (conditionTypes.size >= 3) {
      score += 25;
    } else if (conditionTypes.size >= 2) {
      score += 15;
      recommendations.push('Consider adding more condition types for better coverage');
    } else {
      issues.push('Limited condition type variety');
      recommendations.push('Add conditions for weather, calendar, and sleep patterns');
    }

    // Score for effectiveness
    const avgEffectiveness =
      conditions.reduce((sum, c
) => sum + c.effectivenessScore, 0) / conditions.length;
    if (avgEffectiveness >= 0.8) {
      score += 25;
    } else if (avgEffectiveness >= 0.6) {
      score += 15;
    } else {
      issues.push('Low average condition effectiveness');
    }

    // Score for configuration completeness
    if (alarm.learningFactor && alarm.sleepPatternWeight) {
      score += 10;
    }

    if (alarm.realTimeAdaptation) {
      score += 10;
    } else {
      recommendations.push('Enable real-time adaptation for better results');
    }

    // Determine grade
    let grade: ConfigurationValidation['grade'];
    if (score >= 90) grade = 'Excellent';
    else if (score >= 75) grade = 'Good';
    else if (score >= 60) grade = 'Fair';
    else grade = 'Poor';

    return {
      score,
      grade,
      enabledConditions,
      totalConditions,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze condition performance over time
   */
  static async analyzeConditionPerformance(
    alarmId: string
  ): Promise<PerformanceAnalysis> {
    const alarm = await EnhancedSmartAlarmScheduler.getSmartAlarm(alarmId);
    if (!alarm) {
      throw new Error(`Alarm with ID ${alarmId} not found`);
    }

    const conditions = alarm.conditionBasedAdjustments || [];
    const feedback = alarm.wakeUpFeedback || [];
    const adaptationHistory = alarm.adaptationHistory || [];

    // Calculate overall effectiveness
    const overallEffectiveness =
      conditions.length > 0
        ? conditions.reduce((sum, c
) => sum + c.effectivenessScore, 0) /
          conditions.length
        : 0;

    // Calculate user satisfaction from feedback
    const recentFeedback = feedback.slice(-30); // Last 30 days
    const userSatisfaction =
      recentFeedback.length > 0
        ? recentFeedback.reduce((sum, f
) => {
            const feelingScore =
              ['terrible', 'tired', 'okay', 'good', 'excellent'].indexOf(f.feeling) / 4;
            return sum + feelingScore;
          }, 0) / recentFeedback.length
        : 0;

    // Count recent adaptations
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentAdaptations = adaptationHistory.filter(
      a => new Date(a.date) >= lastWeek
    ).length;

    // Identify top and under performers
    const topPerformers = conditions
      .filter((c: any
) => c.effectivenessScore >= 0.8)
      .map((c: any
) => c.id);

    const underPerformers = conditions
      .filter((c: any
) => c.effectivenessScore < 0.5)
      .map((c: any
) => c.id);

    // Generate recommended actions
    const recommendedActions: string[] = [];
    if (underPerformers.length > 0) {
      recommendedActions.push(
        `Review and adjust ${underPerformers.length} underperforming conditions`
      );
    }
    if (recentAdaptations === 0) {
      recommendedActions.push('Enable real-time adaptation to improve performance');
    }
    if (userSatisfaction < 0.6) {
      recommendedActions.push('Adjust learning factor and sleep pattern weight');
    }

    // Calculate condition breakdown
    const conditionBreakdown = {
      excellent: conditions.filter((c: any
) => c.effectivenessScore >= 0.9).length,
      good: conditions.filter(
        c => c.effectivenessScore >= 0.7 && c.effectivenessScore < 0.9
      ).length,
      fair: conditions.filter(
        c => c.effectivenessScore >= 0.5 && c.effectivenessScore < 0.7
      ).length,
      poor: conditions.filter((c: any
) => c.effectivenessScore < 0.5).length,
    };

    return {
      overallEffectiveness,
      userSatisfaction,
      recentAdaptations,
      topPerformers,
      underPerformers,
      recommendedActions,
      conditionBreakdown,
    };
  }

  /**
   * Optimize conditions based on performance data
   */
  static async optimizeConditions(alarmId: string): Promise<void> {
    const alarm = await EnhancedSmartAlarmScheduler.getSmartAlarm(alarmId);
    if (!alarm) {
      throw new Error(`Alarm with ID ${alarmId} not found`);
    }

    const performance = await this.analyzeConditionPerformance(alarmId);
    const conditions = alarm.conditionBasedAdjustments || [];

    // Optimize underperforming conditions
    const optimizedConditions = conditions.map((condition: any
) => {
      // auto
      if (condition.effectivenessScore < 0.5) {
        // Reduce adjustment magnitude for poor performers
        const adjustedCondition = { ...condition };
        adjustedCondition.adjustment.timeMinutes = Math.round(
          condition.adjustment.timeMinutes * 0.7
        );
        adjustedCondition.adjustment.maxAdjustment = Math.round(
          condition.adjustment.maxAdjustment * 0.8
        );
        console.log(
          `📉 Optimizing ${condition.id}: reduced adjustment to ${adjustedCondition.adjustment.timeMinutes}min`
        );
        return adjustedCondition;
      }
      return condition;
    });

    // Adjust learning parameters based on satisfaction
    let learningFactor = alarm.learningFactor || 0.3;
    if (performance.userSatisfaction < 0.5) {
      learningFactor = Math.max(0.2, learningFactor - 0.1); // Slower learning
    } else if (performance.userSatisfaction > 0.8) {
      learningFactor = Math.min(0.4, learningFactor + 0.1); // Faster learning
    }

    await EnhancedSmartAlarmScheduler.updateSmartAlarm(alarmId, {
      conditionBasedAdjustments: optimizedConditions,
      learningFactor,
    });

    console.log('✅ Conditions optimized based on performance data');
  }

  /**
   * Get recommendations for new conditions to add
   */
  static async suggestConditions(alarmId: string): Promise<{
    addConditions: string[];
    removeConditions: string[];
  }> {
    const performance = await this.analyzeConditionPerformance(alarmId);

    const addConditions: string[] = [];
    const removeConditions: string[] = [];

    // Suggest removing poor performers
    removeConditions.push(...performance.underPerformers);

    // Suggest adding conditions based on what's missing
    const currentConditions = new Set(
      performance.topPerformers.concat(performance.underPerformers)
    );

    if (!currentConditions.has('weather_rain_light')) {
      addConditions.push('Consider adding weather-based adjustments');
    }
    if (!currentConditions.has('calendar_important')) {
      addConditions.push('Consider adding calendar integration for important events');
    }
    if (!currentConditions.has('sleep_debt_high')) {
      addConditions.push('Consider adding sleep debt management');
    }

    return { addConditions, removeConditions };
  }
}

// Quick setup scripts for common scenarios
export class QuickSetupScripts {
  /**
   * Quick setup for new users
   */
  static async setupNewUser(alarmId: string): Promise<void> {
    await AdvancedConditionsHelper.setupCustomConditions(
      alarmId,
      ['weather_rain_light', 'sleep_debt_high'],
      {
        learningFactor: 0.25, // Conservative learning
        sleepPatternWeight: 0.75, // Focus on sleep patterns
        realTimeAdaptation: true,
        dynamicWakeWindow: true,
      }
    );
  }

  /**
   * Emergency reset to safe defaults
   */
  static async emergencyReset(alarmId: string): Promise<void> {
    const alarm = await EnhancedSmartAlarmScheduler.getSmartAlarm(alarmId);
    if (!alarm) return;

    await EnhancedSmartAlarmScheduler.updateSmartAlarm(alarmId, {
      conditionBasedAdjustments: [],
      learningFactor: 0.2,
      sleepPatternWeight: 0.8,
      realTimeAdaptation: false,
      dynamicWakeWindow: false,
    });

    console.log('🚨 Emergency reset completed - all conditions disabled');
  }

  /**
   * Apply the user's specific custom configuration
   */
  static async applyUserCustomConfiguration(alarmId: string): Promise<void> {
    console.log('🎯 Applying your custom smart alarm configuration...');

    await AdvancedConditionsHelper.setupCustomConditions(
      alarmId,
      [
        'weather_rain_light', // 🌧️ Light rain adjustment
        'calendar_important', // 📅 Important meetings
        'sleep_debt_high', // 😴 Sleep debt recovery
        'exercise_morning_prep', // 🏋️ Morning workout prep
      ],
      {
        learningFactor: 0.3, // Balanced learning speed
        sleepPatternWeight: 0.7, // 70% sleep patterns, 30% conditions
        realTimeAdaptation: true, // Enable continuous optimization
        dynamicWakeWindow: true, // Flexible wake-up timing
      }
    );

    console.log('✅ Your custom configuration is now active!');
    console.log('📊 Expected benefits:');
    console.log('   🌧️ Never be late due to rainy weather');
    console.log('   📅 Always prepared for important meetings');
    console.log('   😴 Better sleep debt management');
    console.log('   🏋️ Perfect workout preparation timing');
  }
}
