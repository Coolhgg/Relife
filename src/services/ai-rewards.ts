/**
 * AI-Driven Rewards Service
 * Analyzes user behavior patterns to provide personalized achievements and insights
 */

import type {
  Reward,
  RewardSystem,
  UserHabit,
  UserNiche,
  AIInsight,
  RewardCategory,
  VoiceMood,
  Alarm,
  AlarmEvent,
} from '../types';
import AnalyticsService from './analytics';

interface BehaviorPattern {
  type:
    | 'consistency'
    | 'time_preference'
    | 'voice_mood'
    | 'dismissal_method'
    | 'frequency';
  strength: number; // 0-1
  data: Record<string, any>;
}

interface PersonalityProfile {
  traits: string[];
  primaryNiche: UserNiche['primary'];
  confidence: number;
  morningPerson: boolean;
  consistencyScore: number;
  challengeSeeking: boolean;
}

export class AIRewardsService {
  private static instance: AIRewardsService;
  private rewardTemplates: Map<string, Partial<Reward>> = new Map();

  private constructor() {
    this.initializeRewardTemplates();
  }

  static getInstance(): AIRewardsService {
    if (!AIRewardsService.instance) {
      AIRewardsService.instance = new AIRewardsService();
    }
    return AIRewardsService.instance;
  }

  /**
   * Analyze user behavior and generate personalized reward system
   */
  async analyzeAndGenerateRewards(
    alarms: Alarm[],
    alarmEvents: AlarmEvent[] = []
  ): Promise<RewardSystem> {
    const analytics = AnalyticsService.getInstance();
    const behavior = analytics.getUserBehavior();

    // Analyze behavior patterns
    const patterns = this.analyzeBehaviorPatterns(alarms, alarmEvents, behavior);

    // Generate personality profile
    const personality = this.generatePersonalityProfile(patterns, behavior);

    // Identify user habits
    const habits = this.identifyHabits(patterns, alarms);

    // Generate niche profile
    const niche = this.generateNicheProfile(personality, habits, patterns);

    // Generate AI insights
    const aiInsights = this.generateAIInsights(patterns, personality, habits);

    // Generate available rewards
    const availableRewards = this.generatePersonalizedRewards(
      personality,
      niche,
      habits
    );

    // Calculate current progress
    const currentStreak = this.calculateCurrentStreak(alarmEvents);
    const longestStreak = this.calculateLongestStreak(alarmEvents);
    const unlockedRewards = this.checkUnlockedRewards(
      availableRewards,
      habits,
      currentStreak
    );
    const totalPoints = this.calculateTotalPoints(unlockedRewards);
    const level = Math.floor(totalPoints / 100) + 1;

    return {
      totalPoints,
      level,
      currentStreak,
      longestStreak,
      unlockedRewards,
      availableRewards,
      habits,
      niche,
      aiInsights,
      lastAnalysis: new Date(),
    };
  }

  /**
   * Analyze user behavior patterns
   */
  private analyzeBehaviorPatterns(
    alarms: Alarm[],
    alarmEvents: AlarmEvent[],
    behavior: any
  ): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];

    // Consistency pattern analysis
    const enabledAlarms = alarms.filter(a => a.enabled);
    const dismissalRate = behavior.alarmPatterns.dismissRate || 0;
    const consistencyScore =
      dismissalRate > 0.8
        ? 1
        : dismissalRate > 0.6
          ? 0.7
          : dismissalRate > 0.4
            ? 0.5
            : 0.2;

    patterns.push({
      type: 'consistency',
      strength: consistencyScore,
      data: {
        dismissalRate,
        enabledAlarms: enabledAlarms.length,
        regularSchedule: this.hasRegularSchedule(alarms),
      },
    });

    // Time preference analysis
    const morningAlarms = alarms.filter(a => {
      const hour = parseInt(a.time.split(':')[0]);
      return hour >= 5 && hour <= 10;
    });
    const eveningAlarms = alarms.filter(a => {
      const hour = parseInt(a.time.split(':')[0]);
      return hour >= 18 && hour <= 23;
    });

    const morningPerson = morningAlarms.length > eveningAlarms.length;
    patterns.push({
      type: 'time_preference',
      strength:
        Math.abs(morningAlarms.length - eveningAlarms.length) /
        Math.max(alarms.length, 1),
      data: {
        morningPerson,
        morningAlarms: morningAlarms.length,
        eveningAlarms: eveningAlarms.length,
        mostCommonTime: behavior.alarmPatterns.mostCommonTime,
      },
    });

    // Voice mood pattern analysis
    const voiceMoodCounts = alarms.reduce(
      (acc, alarm) => {
        acc[alarm.voiceMood] = (acc[alarm.voiceMood] || 0) + 1;
        return acc;
      },
      {} as Record<VoiceMood, number>
    );

    const preferredVoiceMood = Object.entries(voiceMoodCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] as VoiceMood;

    patterns.push({
      type: 'voice_mood',
      strength: 0.8, // High confidence in voice mood preference
      data: {
        preferredVoiceMood,
        voiceMoodDistribution: voiceMoodCounts,
        varietyScore: Object.keys(voiceMoodCounts).length / 6, // out of 6 possible moods
      },
    });

    // Dismissal method analysis
    const dismissalMethods = alarmEvents
      .filter(e => e.dismissed)
      .reduce(
        (acc, event) => {
          const method = event.dismissMethod || 'button';
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    const preferredDismissalMethod =
      Object.entries(dismissalMethods).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      'button';

    patterns.push({
      type: 'dismissal_method',
      strength: 0.6,
      data: {
        preferredDismissalMethod,
        methodDistribution: dismissalMethods,
        voiceDismissalUsage: dismissalMethods.voice || 0,
      },
    });

    // Frequency analysis
    const totalAlarms = behavior.alarmPatterns.totalAlarms || 0;
    const averagePerDay = behavior.alarmPatterns.averageAlarmsPerDay || 0;

    patterns.push({
      type: 'frequency',
      strength: Math.min(averagePerDay / 3, 1), // Normalize to 3 alarms per day as high
      data: {
        totalAlarms,
        averagePerDay,
        frequencyCategory:
          averagePerDay > 2 ? 'high' : averagePerDay > 0.5 ? 'medium' : 'low',
      },
    });

    return patterns;
  }

  /**
   * Generate personality profile based on behavior patterns
   */
  private generatePersonalityProfile(
    patterns: BehaviorPattern[],
    behavior: any
  ): PersonalityProfile {
    const traits: string[] = [];
    const timePattern = patterns.find(p => p.type === 'time_preference');
    const consistencyPattern = patterns.find(p => p.type === 'consistency');
    const voicePattern = patterns.find(p => p.type === 'voice_mood');
    const frequencyPattern = patterns.find(p => p.type === 'frequency');

    const morningPerson = timePattern?.data.morningPerson || false;
    const consistencyScore = consistencyPattern?.strength || 0.5;

    // Generate traits based on patterns
    if (consistencyScore > 0.8) {
      traits.push('highly disciplined', 'reliable', 'goal-oriented');
    } else if (consistencyScore > 0.6) {
      traits.push('moderately consistent', 'improving');
    } else {
      traits.push('flexible', 'adaptable', 'work in progress');
    }

    if (morningPerson) {
      traits.push('early riser', 'morning productivity');
    } else {
      traits.push('night owl', 'evening energy');
    }

    const preferredMood = voicePattern?.data.preferredVoiceMood;
    switch (preferredMood) {
      case 'drill-sergeant':
        traits.push('challenge-seeker', 'tough love appreciator');
        break;
      case 'motivational':
        traits.push('inspiration-driven', 'positive mindset');
        break;
      case 'gentle':
        traits.push('calm approach', 'self-compassionate');
        break;
      case 'anime-hero':
        traits.push('creative spirit', 'playful');
        break;
      case 'savage-roast':
        traits.push('humor appreciation', 'thick-skinned');
        break;
      case 'sweet-angel':
        traits.push('kindness-valued', 'gentle soul');
        break;
    }

    const frequencyData = frequencyPattern?.data;
    const primaryNiche = this.inferPrimaryNiche(traits, frequencyData, morningPerson);

    return {
      traits: traits.slice(0, 6), // Limit to top 6 traits
      primaryNiche,
      confidence: 0.75,
      morningPerson,
      consistencyScore,
      challengeSeeking:
        preferredMood === 'drill-sergeant' || preferredMood === 'savage-roast',
    };
  }

  /**
   * Identify user habits based on alarm patterns
   */
  private identifyHabits(patterns: BehaviorPattern[], alarms: Alarm[]): UserHabit[] {
    const habits: UserHabit[] = [];
    const consistencyPattern = patterns.find(p => p.type === 'consistency');
    const timePattern = patterns.find(p => p.type === 'time_preference');
    const frequencyPattern = patterns.find(p => p.type === 'frequency');

    // Morning routine habit
    const morningAlarms = alarms.filter(a => {
      const hour = parseInt(a.time.split(':')[0]);
      return hour >= 5 && hour <= 10 && a.enabled;
    });

    if (morningAlarms.length > 0) {
      habits.push({
        id: 'morning_routine',
        pattern: 'morning_routine',
        frequency: morningAlarms.length,
        consistency: consistencyPattern?.strength || 0.5,
        improvement: this.calculateImprovementTrend('morning'),
        niche: this.inferNicheFromAlarmLabels(morningAlarms),
        lastAnalyzed: new Date(),
      });
    }

    // Evening routine habit
    const eveningAlarms = alarms.filter(a => {
      const hour = parseInt(a.time.split(':')[0]);
      return hour >= 18 && hour <= 23 && a.enabled;
    });

    if (eveningAlarms.length > 0) {
      habits.push({
        id: 'evening_routine',
        pattern: 'evening_routine',
        frequency: eveningAlarms.length,
        consistency: consistencyPattern?.strength || 0.5,
        improvement: this.calculateImprovementTrend('evening'),
        niche: this.inferNicheFromAlarmLabels(eveningAlarms),
        lastAnalyzed: new Date(),
      });
    }

    // Workout time habit (based on labels)
    const workoutAlarms = alarms.filter(
      a =>
        a.label.toLowerCase().includes('gym') ||
        a.label.toLowerCase().includes('workout') ||
        a.label.toLowerCase().includes('exercise') ||
        a.label.toLowerCase().includes('run')
    );

    if (workoutAlarms.length > 0) {
      habits.push({
        id: 'workout_time',
        pattern: 'workout_time',
        frequency: workoutAlarms.length,
        consistency: consistencyPattern?.strength || 0.5,
        improvement: this.calculateImprovementTrend('workout'),
        niche: {
          primary: 'fitness',
          confidence: 0.9,
          traits: ['health-conscious'],
          preferences: {} as any,
        },
        lastAnalyzed: new Date(),
      });
    }

    return habits;
  }

  /**
   * Generate niche profile for the user
   */
  private generateNicheProfile(
    personality: PersonalityProfile,
    habits: UserHabit[],
    patterns: BehaviorPattern[]
  ): UserNiche {
    const nicheScores = {
      fitness: 0,
      work: 0,
      study: 0,
      creative: 0,
      family: 0,
      health: 0,
      social: 0,
      spiritual: 0,
    };

    // Score based on habits
    habits.forEach(habit => {
      if (habit.niche?.primary) {
        nicheScores[habit.niche.primary] += habit.frequency * habit.consistency;
      }
    });

    // Score based on personality traits
    personality.traits.forEach(trait => {
      if (trait.includes('disciplined') || trait.includes('goal-oriented')) {
        nicheScores.work += 0.3;
        nicheScores.fitness += 0.2;
      }
      if (trait.includes('creative') || trait.includes('playful')) {
        nicheScores.creative += 0.4;
      }
      if (trait.includes('morning productivity')) {
        nicheScores.work += 0.3;
        nicheScores.fitness += 0.2;
      }
    });

    // Find primary and secondary niches
    const sortedNiches = Object.entries(nicheScores).sort(([, a], [, b]) => b - a) as [
      UserNiche['primary'],
      number,
    ][];

    const primary = sortedNiches[0][0];
    const secondary = sortedNiches[1][1] > 0 ? sortedNiches[1][0] : undefined;

    const voicePattern = patterns.find(p => p.type === 'voice_mood');
    const timePattern = patterns.find(p => p.type === 'time_preference');
    const consistencyPattern = patterns.find(p => p.type === 'consistency');

    return {
      primary,
      secondary,
      confidence: Math.min(sortedNiches[0][1] / 2, 1), // Normalize confidence
      traits: personality.traits,
      preferences: {
        morningPerson: personality.morningPerson,
        weekendSleeper: !personality.morningPerson,
        consistentSchedule: consistencyPattern?.strength > 0.7,
        voiceMoodPreference: voicePattern?.data.preferredVoiceMood
          ? [voicePattern.data.preferredVoiceMood]
          : [],
      },
    };
  }

  /**
   * Generate AI insights based on analysis
   */
  private generateAIInsights(
    patterns: BehaviorPattern[],
    personality: PersonalityProfile,
    habits: UserHabit[]
  ): AIInsight[] {
    const insights: AIInsight[] = [];
    const consistencyPattern = patterns.find(p => p.type === 'consistency');
    const timePattern = patterns.find(p => p.type === 'time_preference');

    // Consistency insights
    if (consistencyPattern && consistencyPattern.strength < 0.6) {
      insights.push({
        id: `insight_consistency_${Date.now()}`,
        type: 'improvement_suggestion',
        title: 'Boost Your Consistency',
        message: `I notice you're dismissing alarms ${Math.round(consistencyPattern.data.dismissalRate * 100)}% of the time. Try setting alarms 15 minutes earlier to give yourself buffer time, or use a more motivating voice mood.`,
        confidence: 0.8,
        actionable: true,
        suggestedActions: [
          'Set buffer time in your alarms',
          'Try a different voice mood',
          'Review your sleep schedule',
        ],
        createdAt: new Date(),
        priority: 'high',
      });
    }

    // Time optimization insights
    if (timePattern && timePattern.strength > 0.7) {
      const timeType = timePattern.data.morningPerson ? 'morning' : 'evening';
      insights.push({
        id: `insight_time_${Date.now()}`,
        type: 'pattern_recognition',
        title: `You're a Natural ${timeType.charAt(0).toUpperCase() + timeType.slice(1)} Person!`,
        message: `Your alarm patterns show you're most active during ${timeType} hours. Consider scheduling your most important tasks during these peak energy times.`,
        confidence: timePattern.strength,
        actionable: true,
        suggestedActions: [
          `Schedule important tasks in ${timeType}`,
          'Align your most challenging alarms with your energy peaks',
        ],
        createdAt: new Date(),
        priority: 'medium',
      });
    }

    // Habit formation insights
    const strongHabits = habits.filter(h => h.consistency > 0.7);
    if (strongHabits.length > 0) {
      insights.push({
        id: `insight_habits_${Date.now()}`,
        type: 'habit_analysis',
        title: 'Strong Habit Formation Detected!',
        message: `You've built ${strongHabits.length} consistent habit${strongHabits.length > 1 ? 's' : ''}: ${strongHabits.map(h => h.pattern.replace('_', ' ')).join(', ')}. This shows great potential for forming new positive routines.`,
        confidence: 0.9,
        actionable: true,
        suggestedActions: [
          'Add a new complementary habit',
          'Share your success to motivate others',
        ],
        createdAt: new Date(),
        priority: 'low',
      });
    }

    return insights.slice(0, 5); // Limit to 5 most relevant insights
  }

  /**
   * Generate personalized rewards based on user profile
   */
  private generatePersonalizedRewards(
    personality: PersonalityProfile,
    niche: UserNiche,
    habits: UserHabit[]
  ): Reward[] {
    const rewards: Reward[] = [];
    const baseRewards = Array.from(this.rewardTemplates.entries());

    // Generate niche-specific rewards
    const nicheRewards = baseRewards.filter(([key]) => key.includes(niche.primary));
    nicheRewards.forEach(([key, template]) => {
      rewards.push(this.personalizeReward(template, personality, niche, key));
    });

    // Generate personality-specific rewards
    if (personality.challengeSeeking) {
      const challengeRewards = baseRewards.filter(([key]) => key.includes('challenge'));
      challengeRewards.forEach(([key, template]) => {
        rewards.push(this.personalizeReward(template, personality, niche, key));
      });
    }

    if (personality.consistencyScore > 0.7) {
      const consistencyRewards = baseRewards.filter(([key]) =>
        key.includes('consistency')
      );
      consistencyRewards.forEach(([key, template]) => {
        rewards.push(this.personalizeReward(template, personality, niche, key));
      });
    }

    // Generate habit-specific rewards
    habits.forEach(habit => {
      const habitRewards = baseRewards.filter(([key]) => key.includes(habit.pattern));
      habitRewards.forEach(([key, template]) => {
        rewards.push(this.personalizeReward(template, personality, niche, key));
      });
    });

    // Add universal rewards
    const universalRewards = baseRewards.filter(([key]) => key.includes('universal'));
    universalRewards.forEach(([key, template]) => {
      rewards.push(this.personalizeReward(template, personality, niche, key));
    });

    return rewards.slice(0, 20); // Limit to 20 most relevant rewards
  }

  /**
   * Personalize a reward template
   */
  private personalizeReward(
    template: Partial<Reward>,
    personality: PersonalityProfile,
    niche: UserNiche,
    key: string
  ): Reward {
    const personalizedMessages = {
      fitness: 'Your dedication to fitness is inspiring! Keep pushing those limits! 💪',
      work: "Professional excellence detected! You're building great work habits! 💼",
      creative:
        'Your creative spirit shines through your routine! Keep that inspiration flowing! 🎨',
      morning: personality.morningPerson
        ? 'Early bird catches the worm! Your morning discipline is admirable! 🌅'
        : "You're becoming a morning warrior! Every sunrise is a new victory! ⭐",
      consistency: `${personality.traits.includes('highly disciplined') ? 'Your discipline is legendary!' : 'Building consistency like a champion!'} Keep it up! 🏆`,
    };

    const aiInsights = {
      fitness:
        "Your workout timing patterns suggest you're building sustainable fitness habits.",
      work: 'Your professional alarm schedule indicates strong time management skills.',
      creative:
        'Your creative routine shows you understand the importance of inspiration timing.',
      morning:
        'Your morning consistency is linked to higher productivity and better mood throughout the day.',
      consistency:
        'Research shows that consistent wake times improve sleep quality by up to 23%.',
    };

    const personalizedMessage =
      Object.entries(personalizedMessages).find(([type]) => key.includes(type))?.[1] ||
      template.personalizedMessage;

    const aiInsight =
      Object.entries(aiInsights).find(([type]) => key.includes(type))?.[1] ||
      template.aiInsight;

    return {
      id: `reward_${key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: template.type || 'achievement',
      title: template.title || 'Achievement Unlocked',
      description: template.description || 'You did something great!',
      icon: template.icon || '🏆',
      category: template.category || this.inferCategoryFromNiche(niche.primary),
      rarity: template.rarity || 'common',
      points: template.points || 10,
      unlockedAt: new Date(),
      personalizedMessage,
      aiInsight,
    };
  }

  // Helper methods
  private hasRegularSchedule(alarms: Alarm[]): boolean {
    const enabledAlarms = alarms.filter(a => a.enabled);
    if (enabledAlarms.length === 0) return false;

    const times = enabledAlarms.map(a => a.time);
    const uniqueTimes = [...new Set(times)];
    return uniqueTimes.length <= enabledAlarms.length * 0.7; // 70% or more alarms at same times
  }

  private inferPrimaryNiche(
    traits: string[],
    frequencyData: any,
    morningPerson: boolean
  ): UserNiche['primary'] {
    if (traits.some(t => t.includes('discipline') || t.includes('goal'))) {
      return morningPerson ? 'work' : 'fitness';
    }
    if (traits.some(t => t.includes('creative') || t.includes('playful'))) {
      return 'creative';
    }
    if (frequencyData?.averagePerDay > 2) {
      return 'health';
    }
    return 'work'; // Default
  }

  private inferNicheFromAlarmLabels(alarms: Alarm[]): UserNiche {
    const labels = alarms.map(a => a.label.toLowerCase()).join(' ');

    if (
      labels.includes('gym') ||
      labels.includes('workout') ||
      labels.includes('exercise')
    ) {
      return {
        primary: 'fitness',
        confidence: 0.8,
        traits: ['health-conscious'],
        preferences: {} as any,
      };
    }
    if (
      labels.includes('work') ||
      labels.includes('meeting') ||
      labels.includes('office')
    ) {
      return {
        primary: 'work',
        confidence: 0.8,
        traits: ['professional'],
        preferences: {} as any,
      };
    }
    if (
      labels.includes('study') ||
      labels.includes('class') ||
      labels.includes('exam')
    ) {
      return {
        primary: 'study',
        confidence: 0.8,
        traits: ['academic'],
        preferences: {} as any,
      };
    }

    return {
      primary: 'health',
      confidence: 0.5,
      traits: ['routine-focused'],
      preferences: {} as any,
    };
  }

  private calculateImprovementTrend(type: string): number {
    // In a real implementation, this would analyze historical data
    // For now, return a positive trend
    return 0.1 + Math.random() * 0.2; // 10-30% improvement
  }

  private calculateCurrentStreak(alarmEvents: AlarmEvent[]): number {
    if (alarmEvents.length === 0) return 0;

    const sortedEvents = alarmEvents
      .filter(e => e.dismissed)
      .sort((a, b) => b.firedAt.getTime() - a.firedAt.getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const event of sortedEvents) {
      const eventDate = new Date(event.firedAt);
      eventDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (currentDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === streak || daysDiff === streak + 1) {
        streak++;
        currentDate = eventDate;
      } else {
        break;
      }
    }

    return streak;
  }

  private calculateLongestStreak(alarmEvents: AlarmEvent[]): number {
    if (alarmEvents.length === 0) return 0;

    const dismissedEvents = alarmEvents
      .filter(e => e.dismissed)
      .sort((a, b) => a.firedAt.getTime() - b.firedAt.getTime());

    let maxStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const event of dismissedEvents) {
      const eventDate = new Date(event.firedAt);
      eventDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor(
          (eventDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }

      maxStreak = Math.max(maxStreak, currentStreak);
      lastDate = eventDate;
    }

    return maxStreak;
  }

  private checkUnlockedRewards(
    availableRewards: Reward[],
    habits: UserHabit[],
    currentStreak: number
  ): Reward[] {
    return availableRewards.filter(reward => {
      switch (reward.type) {
        case 'streak':
          return currentStreak >= (reward.progress?.target || 5);
        case 'habit_boost':
          return habits.some(h => h.consistency > 0.7);
        case 'milestone':
          return habits.length >= 2;
        default:
          return Math.random() > 0.7; // 30% chance for other rewards
      }
    });
  }

  private calculateTotalPoints(unlockedRewards: Reward[]): number {
    return unlockedRewards.reduce((total, reward) => total + reward.points, 0);
  }

  private inferCategoryFromNiche(niche: UserNiche['primary']): RewardCategory {
    const mapping: Record<UserNiche['primary'], RewardCategory> = {
      fitness: 'wellness',
      work: 'productivity',
      study: 'productivity',
      creative: 'explorer',
      family: 'social',
      health: 'wellness',
      social: 'social',
      spiritual: 'wellness',
    };
    return mapping[niche] || 'consistency';
  }

  /**
   * Initialize reward templates
   */
  private initializeRewardTemplates(): void {
    const templates = [
      // Consistency rewards
      {
        key: 'consistency_starter',
        template: {
          type: 'achievement' as const,
          title: 'Consistency Champion',
          description: 'Dismissed alarms 5 days in a row',
          icon: '🎯',
          category: 'consistency' as const,
          rarity: 'common' as const,
          points: 50,
          progress: { current: 0, target: 5, percentage: 0 },
        },
      },
      {
        key: 'consistency_master',
        template: {
          type: 'streak' as const,
          title: 'Habit Master',
          description: 'Maintained a 30-day alarm streak',
          icon: '🏆',
          category: 'master' as const,
          rarity: 'epic' as const,
          points: 500,
          progress: { current: 0, target: 30, percentage: 0 },
        },
      },

      // Morning person rewards
      {
        key: 'morning_warrior',
        template: {
          type: 'achievement' as const,
          title: 'Morning Warrior',
          description: 'Successfully woke up before 7 AM for a week',
          icon: '🌅',
          category: 'early_riser' as const,
          rarity: 'rare' as const,
          points: 100,
          progress: { current: 0, target: 7, percentage: 0 },
        },
      },

      // Fitness rewards
      {
        key: 'fitness_dedication',
        template: {
          type: 'niche_mastery' as const,
          title: 'Fitness Dedication',
          description: 'Never missed a workout alarm this month',
          icon: '💪',
          category: 'wellness' as const,
          rarity: 'rare' as const,
          points: 200,
        },
      },

      // Work productivity rewards
      {
        key: 'work_productivity',
        template: {
          type: 'milestone' as const,
          title: 'Productivity Pro',
          description: 'Optimized your work schedule with smart alarms',
          icon: '💼',
          category: 'productivity' as const,
          rarity: 'common' as const,
          points: 75,
        },
      },

      // Creative rewards
      {
        key: 'creative_spirit',
        template: {
          type: 'achievement' as const,
          title: 'Creative Spirit',
          description: 'Set up a consistent creative routine',
          icon: '🎨',
          category: 'explorer' as const,
          rarity: 'rare' as const,
          points: 150,
        },
      },

      // Challenge rewards
      {
        key: 'challenge_accepted',
        template: {
          type: 'achievement' as const,
          title: 'Challenge Accepted',
          description: 'Used drill-sergeant mode for tough wake-ups',
          icon: '⚔️',
          category: 'challenger' as const,
          rarity: 'epic' as const,
          points: 300,
        },
      },

      // Universal rewards
      {
        key: 'universal_starter',
        template: {
          type: 'achievement' as const,
          title: 'Getting Started',
          description: 'Set up your first alarm',
          icon: '⭐',
          category: 'consistency' as const,
          rarity: 'common' as const,
          points: 10,
        },
      },
      {
        key: 'universal_explorer',
        template: {
          type: 'achievement' as const,
          title: 'Voice Explorer',
          description: 'Tried 3 different voice moods',
          icon: '🎭',
          category: 'explorer' as const,
          rarity: 'common' as const,
          points: 30,
        },
      },
    ];

    templates.forEach(({ key, template }) => {
      this.rewardTemplates.set(key, template);
    });
  }
}

export default AIRewardsService;
