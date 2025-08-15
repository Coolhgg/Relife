// 🧠 Smart Alarm Configuration Optimizer & Health Check
// Run this to analyze your current settings and get personalized recommendations

import type { 
  EnhancedSmartAlarm, 
  ConditionBasedAdjustment,
  WakeUpFeedback,
  SmartAlarmMetrics 
} from './src/services/enhanced-smart-alarm-scheduler';

export interface ConfigHealth {
  overall: 'excellent' | 'good' | 'needs_attention' | 'poor';
  score: number; // 0-100
  recommendations: Recommendation[];
  warnings: Warning[];
  strengths: string[];
}

export interface Recommendation {
  type: 'setting' | 'condition' | 'behavior';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  expectedImprovement: string;
}

export interface Warning {
  severity: 'critical' | 'moderate' | 'minor';
  title: string;
  description: string;
  solution: string;
}

export class ConfigOptimizer {
  
  // ===== CONFIGURATION HEALTH CHECK =====
  
  static analyzeConfiguration(alarm: EnhancedSmartAlarm, metrics?: SmartAlarmMetrics): ConfigHealth {
    const checks = [
      this.checkCoreSettings(alarm),
      this.checkConditionSetup(alarm),
      this.checkLearningProgress(alarm, metrics),
      this.checkUserEngagement(alarm),
      this.checkPerformanceMetrics(metrics)
    ];
    
    const scores = checks.map(check => check.score);
    const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const allRecommendations = checks.flatMap(check => check.recommendations);
    const allWarnings = checks.flatMap(check => check.warnings);
    const allStrengths = checks.flatMap(check => check.strengths);
    
    return {
      overall: this.scoreToGrade(overallScore),
      score: Math.round(overallScore),
      recommendations: this.prioritizeRecommendations(allRecommendations),
      warnings: this.sortWarningsBySeverity(allWarnings),
      strengths: allStrengths
    };
  }

  // ===== CORE SETTINGS ANALYSIS =====
  
  private static checkCoreSettings(alarm: EnhancedSmartAlarm) {
    const recommendations: Recommendation[] = [];
    const warnings: Warning[] = [];
    const strengths: string[] = [];
    let score = 100;

    // Check real-time adaptation
    if (!alarm.realTimeAdaptation) {
      score -= 25;
      recommendations.push({
        type: 'setting',
        priority: 'high',
        title: 'Enable Real-Time Adaptation',
        description: 'Your alarm is not adapting to changing conditions',
        action: 'Enable Real-Time Adaptation in Smart Mode settings',
        expectedImprovement: '40% better wake-up satisfaction'
      });
    } else {
      strengths.push('Real-time adaptation is enabled for intelligent scheduling');
    }

    // Check learning factor
    if (alarm.learningFactor < 0.1) {
      score -= 15;
      warnings.push({
        severity: 'moderate',
        title: 'Learning Factor Too Low',
        description: 'Your alarm is learning very slowly from feedback',
        solution: 'Increase learning factor to 0.2-0.3 for better adaptation'
      });
    } else if (alarm.learningFactor > 0.6) {
      score -= 10;
      warnings.push({
        severity: 'minor',
        title: 'Learning Factor May Be Too High',
        description: 'Rapid learning can cause unstable wake-up times',
        solution: 'Consider reducing learning factor to 0.3-0.4 for stability'
      });
    } else {
      strengths.push('Learning factor is optimally configured for gradual improvement');
    }

    // Check sleep pattern weight
    if (alarm.sleepPatternWeight < 0.3) {
      recommendations.push({
        type: 'setting',
        priority: 'medium',
        title: 'Increase Sleep Pattern Weight',
        description: 'Your settings rely heavily on external conditions vs sleep patterns',
        action: 'Increase Sleep Pattern Weight to 0.5-0.7',
        expectedImprovement: 'More consistent wake-up times'
      });
    } else if (alarm.sleepPatternWeight > 0.9) {
      recommendations.push({
        type: 'setting',
        priority: 'medium',
        title: 'Balance Sleep Patterns with Conditions',
        description: 'Your alarm may not adapt enough to external factors',
        action: 'Reduce Sleep Pattern Weight to 0.7-0.8',
        expectedImprovement: 'Better adaptation to daily variations'
      });
    } else {
      strengths.push('Sleep pattern weight is well-balanced');
    }

    return { score, recommendations, warnings, strengths };
  }

  // ===== CONDITIONS ANALYSIS =====
  
  private static checkConditionSetup(alarm: EnhancedSmartAlarm) {
    const recommendations: Recommendation[] = [];
    const warnings: Warning[] = [];
    const strengths: string[] = [];
    let score = 100;

    const conditions = alarm.conditionBasedAdjustments || [];
    const enabledConditions = conditions.filter(c => c.isEnabled);

    // Check if any conditions are enabled
    if (enabledConditions.length === 0) {
      score -= 30;
      recommendations.push({
        type: 'condition',
        priority: 'high',
        title: 'Enable Basic Conditions',
        description: 'No condition-based adjustments are active',
        action: 'Enable weather, calendar, and sleep debt conditions',
        expectedImprovement: '35% more personalized scheduling'
      });
    } else {
      strengths.push(`${enabledConditions.length} condition-based adjustments are active`);
    }

    // Check for essential conditions
    const hasWeather = conditions.some(c => c.type === 'weather' && c.isEnabled);
    const hasCalendar = conditions.some(c => c.type === 'calendar' && c.isEnabled);
    const hasSleepDebt = conditions.some(c => c.type === 'sleep_debt' && c.isEnabled);

    if (!hasWeather) {
      recommendations.push({
        type: 'condition',
        priority: 'medium',
        title: 'Add Weather Conditions',
        description: 'Weather impacts commute time and should adjust wake-up timing',
        action: 'Enable rain/storm weather condition with -10 minute adjustment',
        expectedImprovement: 'Better preparation for weather-affected mornings'
      });
    }

    if (!hasCalendar) {
      recommendations.push({
        type: 'condition',
        priority: 'medium',
        title: 'Add Calendar Integration',
        description: 'Important events need extra preparation time',
        action: 'Enable important event detection with -30 minute adjustment',
        expectedImprovement: 'Never be late for important meetings'
      });
    }

    if (!hasSleepDebt) {
      recommendations.push({
        type: 'condition',
        priority: 'high',
        title: 'Add Sleep Debt Monitoring',
        description: 'Sleep debt significantly impacts wake-up difficulty',
        action: 'Enable sleep debt condition for >1 hour debt',
        expectedImprovement: '25% improvement in wake-up energy'
      });
    }

    // Check condition effectiveness
    const ineffectiveConditions = enabledConditions.filter(c => c.effectivenessScore < 0.5);
    if (ineffectiveConditions.length > 0) {
      score -= 10 * ineffectiveConditions.length;
      warnings.push({
        severity: 'moderate',
        title: `${ineffectiveConditions.length} Ineffective Conditions`,
        description: 'Some conditions are not improving your wake-up experience',
        solution: `Consider disabling: ${ineffectiveConditions.map(c => c.type).join(', ')}`
      });
    }

    // Check for too many conditions (analysis paralysis)
    if (enabledConditions.length > 8) {
      warnings.push({
        severity: 'minor',
        title: 'Too Many Active Conditions',
        description: 'Many conditions can cause conflicting adjustments',
        solution: 'Disable least effective conditions and focus on top performers'
      });
    }

    return { score, recommendations, warnings, strengths };
  }

  // ===== LEARNING PROGRESS ANALYSIS =====
  
  private static checkLearningProgress(alarm: EnhancedSmartAlarm, metrics?: SmartAlarmMetrics) {
    const recommendations: Recommendation[] = [];
    const warnings: Warning[] = [];
    const strengths: string[] = [];
    let score = 100;

    const feedback = alarm.wakeUpFeedback || [];
    const recent30Days = feedback.filter(f => 
      f.date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    // Check feedback collection
    if (feedback.length === 0) {
      score -= 40;
      recommendations.push({
        type: 'behavior',
        priority: 'high',
        title: 'Start Providing Feedback',
        description: 'No wake-up feedback has been collected for learning',
        action: 'Rate your wake-up experience after each alarm',
        expectedImprovement: 'Enable AI learning and personalization'
      });
    } else if (recent30Days.length < 10) {
      score -= 20;
      recommendations.push({
        type: 'behavior',
        priority: 'medium',
        title: 'Increase Feedback Frequency',
        description: 'More feedback helps the AI learn your preferences faster',
        action: 'Provide feedback after every wake-up for faster learning',
        expectedImprovement: '50% faster optimization'
      });
    } else {
      strengths.push(`${recent30Days.length} feedback entries in the last 30 days`);
    }

    // Check adaptation history
    const adaptations = alarm.adaptationHistory || [];
    const recentAdaptations = adaptations.filter(a => 
      a.date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    if (recentAdaptations.length === 0 && alarm.realTimeAdaptation) {
      warnings.push({
        severity: 'moderate',
        title: 'No Recent Adaptations',
        description: 'Real-time adaptation is enabled but no adjustments are being made',
        solution: 'Check if conditions are configured correctly and triggering'
      });
    } else if (recentAdaptations.length > 20) {
      warnings.push({
        severity: 'minor',
        title: 'Too Many Adaptations',
        description: 'Excessive adaptations may indicate unstable configuration',
        solution: 'Reduce learning factor or increase confidence threshold'
      });
    }

    // Check metrics if available
    if (metrics) {
      if (metrics.userSatisfaction > 0.8) {
        strengths.push('High user satisfaction with wake-up experience');
      } else if (metrics.userSatisfaction < 0.6) {
        score -= 15;
        recommendations.push({
          type: 'setting',
          priority: 'high',
          title: 'Improve User Satisfaction',
          description: `Current satisfaction is ${Math.round(metrics.userSatisfaction * 100)}%`,
          action: 'Review and adjust condition settings, provide more feedback',
          expectedImprovement: 'Target >80% satisfaction rate'
        });
      }

      if (metrics.adaptationSuccess > 0.75) {
        strengths.push('High adaptation success rate');
      } else {
        recommendations.push({
          type: 'setting',
          priority: 'medium',
          title: 'Improve Adaptation Success',
          description: 'AI adaptations are not consistently improving wake-ups',
          action: 'Review condition effectiveness and adjust priorities',
          expectedImprovement: 'More successful timing adjustments'
        });
      }
    }

    return { score, recommendations, warnings, strengths };
  }

  // ===== USER ENGAGEMENT ANALYSIS =====
  
  private static checkUserEngagement(alarm: EnhancedSmartAlarm) {
    const recommendations: Recommendation[] = [];
    const warnings: Warning[] = [];
    const strengths: string[] = [];
    let score = 100;

    const feedback = alarm.wakeUpFeedback || [];
    const lastFeedback = feedback.length > 0 ? feedback[feedback.length - 1] : null;

    // Check recent engagement
    if (lastFeedback) {
      const daysSinceLastFeedback = (Date.now() - lastFeedback.date.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastFeedback > 7) {
        score -= 20;
        recommendations.push({
          type: 'behavior',
          priority: 'medium',
          title: 'Resume Feedback Collection',
          description: `Last feedback was ${Math.round(daysSinceLastFeedback)} days ago`,
          action: 'Enable automatic feedback prompts after each alarm',
          expectedImprovement: 'Continued learning and optimization'
        });
      } else {
        strengths.push('Recent user feedback indicates active engagement');
      }
    }

    // Check feedback quality
    const recentFeedback = feedback.slice(-10); // Last 10 entries
    const hasDetailedFeedback = recentFeedback.some(f => f.notes && f.notes.length > 10);
    
    if (!hasDetailedFeedback && recentFeedback.length > 5) {
      recommendations.push({
        type: 'behavior',
        priority: 'low',
        title: 'Add Detailed Feedback Notes',
        description: 'Detailed notes help the AI understand your preferences better',
        action: 'Include brief notes about sleep quality factors in feedback',
        expectedImprovement: 'More nuanced personalization'
      });
    }

    return { score, recommendations, warnings, strengths };
  }

  // ===== PERFORMANCE METRICS ANALYSIS =====
  
  private static checkPerformanceMetrics(metrics?: SmartAlarmMetrics) {
    const recommendations: Recommendation[] = [];
    const warnings: Warning[] = [];
    const strengths: string[] = [];
    let score = 100;

    if (!metrics) {
      score -= 10;
      warnings.push({
        severity: 'minor',
        title: 'No Performance Metrics Available',
        description: 'Need more data to analyze performance',
        solution: 'Continue using the system for at least 2 weeks to generate metrics'
      });
      return { score, recommendations, warnings, strengths };
    }

    // Check wake-up difficulty trend
    if (metrics.averageWakeUpDifficulty < 2.5) {
      strengths.push('Excellent average wake-up difficulty score');
    } else if (metrics.averageWakeUpDifficulty > 3.5) {
      recommendations.push({
        type: 'setting',
        priority: 'high',
        title: 'Address Wake-Up Difficulty',
        description: 'Average wake-up difficulty is high',
        action: 'Increase sleep debt monitoring and adjust bedtime routine',
        expectedImprovement: 'Easier morning wake-ups'
      });
    }

    // Check sleep debt trend
    if (metrics.sleepDebtTrend === 'improving') {
      strengths.push('Sleep debt is improving over time');
    } else if (metrics.sleepDebtTrend === 'worsening') {
      warnings.push({
        severity: 'moderate',
        title: 'Worsening Sleep Debt',
        description: 'Sleep debt is increasing over time',
        solution: 'Consider earlier bedtime recommendations and sleep hygiene improvements'
      });
    }

    return { score, recommendations, warnings, strengths };
  }

  // ===== UTILITY METHODS =====
  
  private static scoreToGrade(score: number): 'excellent' | 'good' | 'needs_attention' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'needs_attention';
    return 'poor';
  }

  private static prioritizeRecommendations(recommendations: Recommendation[]): Recommendation[] {
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private static sortWarningsBySeverity(warnings: Warning[]): Warning[] {
    return warnings.sort((a, b) => {
      const severityOrder = { critical: 3, moderate: 2, minor: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  // ===== PERSONALIZED RECOMMENDATIONS =====
  
  static generatePersonalizedConfig(
    currentAlarm: EnhancedSmartAlarm, 
    userProfile: 'professional' | 'student' | 'fitness' | 'shift_worker' | 'parent'
  ): Partial<EnhancedSmartAlarm> {
    const baseConfig = { ...currentAlarm };
    
    switch (userProfile) {
      case 'professional':
        return {
          ...baseConfig,
          learningFactor: 0.3,
          sleepPatternWeight: 0.7,
          conditionBasedAdjustments: this.getProfessionalConditions()
        };
        
      case 'student':
        return {
          ...baseConfig,
          learningFactor: 0.4,
          sleepPatternWeight: 0.5,
          conditionBasedAdjustments: this.getStudentConditions()
        };
        
      case 'fitness':
        return {
          ...baseConfig,
          learningFactor: 0.3,
          sleepPatternWeight: 0.8,
          conditionBasedAdjustments: this.getFitnessConditions()
        };
        
      case 'shift_worker':
        return {
          ...baseConfig,
          learningFactor: 0.5,
          sleepPatternWeight: 0.4,
          dynamicWakeWindow: false,
          conditionBasedAdjustments: this.getShiftWorkerConditions()
        };
        
      case 'parent':
        return {
          ...baseConfig,
          learningFactor: 0.2,
          sleepPatternWeight: 0.6,
          conditionBasedAdjustments: this.getParentConditions()
        };
        
      default:
        return baseConfig;
    }
  }

  private static getProfessionalConditions(): ConditionBasedAdjustment[] {
    return [
      {
        id: 'commute_weather',
        type: 'weather',
        isEnabled: true,
        priority: 3,
        condition: { operator: 'contains', value: 'rain' },
        adjustment: { timeMinutes: -10, maxAdjustment: 20, reason: 'Weather commute adjustment' },
        effectivenessScore: 0.8
      },
      {
        id: 'important_meetings',
        type: 'calendar',
        isEnabled: true,
        priority: 5,
        condition: { operator: 'contains', value: 'important' },
        adjustment: { timeMinutes: -30, maxAdjustment: 60, reason: 'Important meeting preparation' },
        effectivenessScore: 0.9
      }
    ];
  }

  private static getStudentConditions(): ConditionBasedAdjustment[] {
    return [
      {
        id: 'exam_preparation',
        type: 'calendar',
        isEnabled: true,
        priority: 5,
        condition: { operator: 'contains', value: 'exam' },
        adjustment: { timeMinutes: -45, maxAdjustment: 90, reason: 'Exam preparation time' },
        effectivenessScore: 0.85
      },
      {
        id: 'weekend_recovery',
        type: 'calendar',
        isEnabled: true,
        priority: 2,
        condition: { operator: 'equals', value: 'weekend' },
        adjustment: { timeMinutes: 60, maxAdjustment: 120, reason: 'Weekend sleep recovery' },
        effectivenessScore: 0.9
      }
    ];
  }

  private static getFitnessConditions(): ConditionBasedAdjustment[] {
    return [
      {
        id: 'workout_recovery',
        type: 'exercise',
        isEnabled: true,
        priority: 3,
        condition: { operator: 'greater_than', value: 120 },
        adjustment: { timeMinutes: 15, maxAdjustment: 30, reason: 'Exercise recovery time' },
        effectivenessScore: 0.8
      },
      {
        id: 'morning_workout',
        type: 'calendar',
        isEnabled: true,
        priority: 4,
        condition: { operator: 'contains', value: 'workout' },
        adjustment: { timeMinutes: -30, maxAdjustment: 45, reason: 'Pre-workout preparation' },
        effectivenessScore: 0.85
      }
    ];
  }

  private static getShiftWorkerConditions(): ConditionBasedAdjustment[] {
    return [
      {
        id: 'shift_change',
        type: 'calendar',
        isEnabled: true,
        priority: 5,
        condition: { operator: 'contains', value: 'shift' },
        adjustment: { timeMinutes: -45, maxAdjustment: 90, reason: 'Shift change preparation' },
        effectivenessScore: 0.8
      }
    ];
  }

  private static getParentConditions(): ConditionBasedAdjustment[] {
    return [
      {
        id: 'school_day',
        type: 'calendar',
        isEnabled: true,
        priority: 4,
        condition: { operator: 'contains', value: 'school' },
        adjustment: { timeMinutes: -20, maxAdjustment: 40, reason: 'School preparation time' },
        effectivenessScore: 0.85
      }
    ];
  }
}

// ===== USAGE EXAMPLE =====
/*
// Example usage:
const currentAlarm = await EnhancedSmartAlarmScheduler.getSmartAlarm('alarm-id') as EnhancedSmartAlarm;
const metrics = await EnhancedSmartAlarmScheduler.getSmartAlarmMetrics('alarm-id');

const healthCheck = ConfigOptimizer.analyzeConfiguration(currentAlarm, metrics);

console.log(`Overall Health: ${healthCheck.overall} (${healthCheck.score}/100)`);
console.log('Strengths:', healthCheck.strengths);
console.log('Top Recommendations:', healthCheck.recommendations.slice(0, 3));
console.log('Warnings:', healthCheck.warnings);

// Get personalized config for a professional
const optimizedConfig = ConfigOptimizer.generatePersonalizedConfig(currentAlarm, 'professional');
await EnhancedSmartAlarmScheduler.updateSmartAlarm('alarm-id', optimizedConfig);
*/

export default ConfigOptimizer;