/**
 * Enhanced Recommendation Engine
 * Advanced recommendation system using collaborative filtering, content-based filtering,
 * and hybrid approaches for personalized user recommendations
 */

import type { Alarm, AlarmEvent, User, PersonaType } from '../types';
import AdvancedBehavioralIntelligence from './advanced-behavioral-intelligence';
import CrossPlatformIntegration from './cross-platform-integration';

// Recommendation types and interfaces
interface BaseRecommendation {
  id: string;
  title: string;
  description: string;
  category:
    | 'optimization'
    | 'wellness'
    | 'productivity'
    | 'social'
    | 'habit_formation'
    | 'recovery';
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  personalizedReason: string;
  estimatedImpact: {
    sleepQuality: number;
    energyLevel: number;
    consistency: number;
    wellbeing: number;
    productivity: number;
  };
  implementationComplexity: 'simple' | 'moderate' | 'complex';
  timeToSeeResults: string;
  createdAt: Date;
  expiresAt: Date;
}

interface ActionableRecommendation extends BaseRecommendation {
  type: 'actionable';
  actions: Array<{
    step: number;
    description: string;
    duration: string;
    required: boolean;
    alternatives?: string[];
  }>;
  prerequisites: string[];
  successMetrics: Array<{
    metric: string;
    targetImprovement: number;
    measuredBy: string;
  }>;
}

interface InsightRecommendation extends BaseRecommendation {
  type: 'insight';
  insight: string;
  supportingData: Array<{
    dataPoint: string;
    value: string | number;
    context: string;
  }>;
  learnMoreTopics: string[];
}

interface ChallengeRecommendation extends BaseRecommendation {
  type: 'challenge';
  challenge: {
    duration: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    goals: string[];
    milestones: Array<{
      day: number;
      milestone: string;
      reward: string;
    }>;
  };
  joinableFriends?: string[];
}

interface PersonalizedContent extends BaseRecommendation {
  type: 'content';
  content: {
    mediaType: 'article' | 'video' | 'podcast' | 'exercise' | 'meditation';
    url?: string;
    duration: string;
    tags: string[];
    personalizedNotes: string;
  };
}

type Recommendation =
  | ActionableRecommendation
  | InsightRecommendation
  | ChallengeRecommendation
  | PersonalizedContent;

// Machine learning models for recommendations
interface UserVector {
  userId: string;
  features: {
    // Behavioral features
    consistencyScore: number;
    morningPersonality: number;
    socialInfluence: number;
    changeAdaptability: number;
    stressResilience: number;

    // Preference features
    challengeSeeking: number;
    privacyPreference: number;
    featureUsage: Record<string, number>;

    // Context features
    seasonalSensitivity: number;
    weatherSensitivity: number;
    socialActivityLevel: number;
    workLifeBalance: number;

    // Outcome features
    sleepQualityTrend: number;
    productivityTrend: number;
    wellbeingTrend: number;
    engagementLevel: number;
  };
  embedding: number[]; // High-dimensional vector representation
  lastUpdated: Date;
}

interface SimilarityResult {
  userId: string;
  similarity: number;
  sharedFeatures: string[];
}

interface RecommendationContext {
  timeOfDay: string;
  dayOfWeek: string;
  season: string;
  recentAlarmPerformance: number;
  stressLevel: number;
  energyLevel: number;
  upcomingEvents: Array<{ type: string; timeUntil: number }>;
  recentRecommendationEngagement: number;
}

export class EnhancedRecommendationEngine {
  private static instance: EnhancedRecommendationEngine;
  private userVectors: Map<string, UserVector> = new Map();
  private recommendationHistory: Map<string, Recommendation[]> = new Map();
  private engagementData: Map<string, Map<string, number>> = new Map(); // userId -> recommendationId -> engagement
  private collaborativeFiltering: CollaborativeFilteringModel;
  private contentBasedFiltering: ContentBasedFilteringModel;

  private constructor() {
    this.collaborativeFiltering = new CollaborativeFilteringModel();
    this.contentBasedFiltering = new ContentBasedFilteringModel();
    this.initializeRecommendationEngine();
  }

  static getInstance(): EnhancedRecommendationEngine {
    if (!EnhancedRecommendationEngine.instance) {
      EnhancedRecommendationEngine.instance = new EnhancedRecommendationEngine();
    }
    return EnhancedRecommendationEngine.instance;
  }

  /**
   * Generate comprehensive personalized recommendations for a user
   */
  async generatePersonalizedRecommendations(
    userId: string,
    alarms: Alarm[],
    alarmEvents: AlarmEvent[],
    context?: RecommendationContext
  ): Promise<{
    recommendations: Recommendation[];
    reasoning: {
      primaryFactors: string[];
      collaborativeInsights: string[];
      contentBasedMatches: string[];
      contextualAdjustments: string[];
    };
    nextUpdateIn: number; // minutes
  }> {
    // Update user vector with latest data
    await this.updateUserVector(userId, alarms, alarmEvents);

    // Get recommendation context
    const recommendationContext =
      context || (await this.buildRecommendationContext(userId));

    // Generate recommendations using multiple approaches
    const collaborativeRecs = await this.generateCollaborativeRecommendations(
      userId,
      recommendationContext
    );
    const contentBasedRecs = await this.generateContentBasedRecommendations(
      userId,
      recommendationContext
    );
    const contextualRecs = await this.generateContextualRecommendations(
      userId,
      recommendationContext
    );
    const hybridRecs = await this.generateHybridRecommendations(
      userId,
      recommendationContext
    );

    // Combine and rank all recommendations
    const allRecommendations = [
      ...collaborativeRecs,
      ...contentBasedRecs,
      ...contextualRecs,
      ...hybridRecs,
    ];

    // Remove duplicates and rank by relevance
    const uniqueRecommendations = this.deduplicateAndRank(
      allRecommendations,
      userId,
      recommendationContext
    );

    // Limit to top recommendations based on user preferences
    const finalRecommendations = this.selectOptimalRecommendations(
      uniqueRecommendations,
      userId
    );

    // Generate reasoning explanation
    const reasoning = this.generateRecommendationReasoning(
      finalRecommendations,
      userId,
      recommendationContext
    );

    // Store recommendations for future learning
    this.storeRecommendationHistory(userId, finalRecommendations);

    // Calculate next update time based on user engagement patterns
    const nextUpdateIn = this.calculateNextUpdateTime(userId);

    return {
      recommendations: finalRecommendations,
      reasoning,
      nextUpdateIn,
    };
  }

  /**
   * Generate collaborative filtering recommendations
   */
  private async generateCollaborativeRecommendations(
    userId: string,
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    const userVector = this.userVectors.get(userId);
    if (!userVector) return [];

    // Find similar users
    const similarUsers = this.findSimilarUsers(userId, 10);

    // Get recommendations from similar users
    const recommendations: Recommendation[] = [];

    for (const similar of similarUsers) {
      const similarUserHistory = this.recommendationHistory.get(similar.userId) || [];
      const engagementHistory = this.engagementData.get(similar.userId) || new Map();

      // Find highly engaged recommendations from similar users
      for (const rec of similarUserHistory) {
        const engagement = engagementHistory.get(rec.id) || 0;
        if (engagement > 0.7 && !this.hasUserSeenRecommendation(userId, rec)) {
          // Adapt recommendation for current user
          const adaptedRec = this.adaptRecommendationForUser(
            rec,
            userId,
            context,
            similar.similarity
          );
          if (adaptedRec) {
            recommendations.push(adaptedRec);
          }
        }
      }
    }

    return recommendations.slice(0, 5); // Limit collaborative recommendations
  }

  /**
   * Generate content-based filtering recommendations
   */
  private async generateContentBasedRecommendations(
    userId: string,
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    const userVector = this.userVectors.get(userId);
    if (!userVector) return [];

    const recommendations: Recommendation[] = [];

    // Analyze user's historical preferences
    const userHistory = this.recommendationHistory.get(userId) || [];
    const userEngagement = this.engagementData.get(userId) || new Map();

    // Find patterns in what user has engaged with
    const preferredCategories = this.analyzePreferredCategories(
      userHistory,
      userEngagement
    );
    const preferredComplexity = this.analyzePreferredComplexity(
      userHistory,
      userEngagement
    );
    const preferredTypes = this.analyzePreferredTypes(userHistory, userEngagement);

    // Generate new recommendations based on preferences
    if (
      preferredCategories.includes('productivity') &&
      userVector.features.workLifeBalance < 0.7
    ) {
      recommendations.push(this.createProductivityRecommendation(userId, context));
    }

    if (
      preferredCategories.includes('wellness') &&
      userVector.features.stressResilience < 0.6
    ) {
      recommendations.push(this.createWellnessRecommendation(userId, context));
    }

    if (
      preferredCategories.includes('optimization') &&
      userVector.features.consistencyScore < 0.8
    ) {
      recommendations.push(this.createOptimizationRecommendation(userId, context));
    }

    if (
      userVector.features.challengeSeeking > 0.7 &&
      preferredTypes.includes('challenge')
    ) {
      recommendations.push(this.createChallengeRecommendation(userId, context));
    }

    return recommendations.filter(r => r !== null) as Recommendation[];
  }

  /**
   * Generate contextual recommendations based on current situation
   */
  private async generateContextualRecommendations(
    userId: string,
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Time-based recommendations
    if (context.timeOfDay === 'morning' && context.recentAlarmPerformance < 0.7) {
      recommendations.push(
        this.createMorningOptimizationRecommendation(userId, context)
      );
    }

    if (context.timeOfDay === 'evening' && context.stressLevel > 0.6) {
      recommendations.push(this.createEveningRelaxationRecommendation(userId, context));
    }

    // Stress-based recommendations
    if (context.stressLevel > 0.7) {
      recommendations.push(this.createStressReductionRecommendation(userId, context));
    }

    // Energy-based recommendations
    if (context.energyLevel < 0.5) {
      recommendations.push(this.createEnergyBoostRecommendation(userId, context));
    }

    // Seasonal recommendations
    if (
      context.season === 'winter' &&
      this.userVectors.get(userId)?.features.seasonalSensitivity > 0.6
    ) {
      recommendations.push(
        this.createSeasonalAdjustmentRecommendation(userId, context)
      );
    }

    return recommendations.filter(r => r !== null) as Recommendation[];
  }

  /**
   * Generate hybrid recommendations combining multiple approaches
   */
  private async generateHybridRecommendations(
    userId: string,
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const userVector = this.userVectors.get(userId);
    if (!userVector) return [];

    // Cross-platform data integration recommendations
    try {
      const crossPlatformData =
        await CrossPlatformIntegration.getInstance().getCrossPlatformData(userId);

      if (crossPlatformData?.health) {
        const healthData = crossPlatformData.health;

        // Sleep quality hybrid recommendation
        if (
          healthData.sleepData.quality < 7 &&
          userVector.features.consistencyScore > 0.6
        ) {
          recommendations.push(
            this.createSleepQualityHybridRecommendation(userId, context, healthData)
          );
        }

        // Energy correlation hybrid recommendation
        if (
          healthData.energyLevel < 7 &&
          userVector.features.morningPersonality > 0.7
        ) {
          recommendations.push(
            this.createEnergyCorrelationRecommendation(userId, context, healthData)
          );
        }
      }

      if (crossPlatformData?.calendar) {
        const calendarData = crossPlatformData.calendar;

        // Meeting density hybrid recommendation
        if (
          calendarData.weeklyPattern.meetingDensity > 0.6 &&
          userVector.features.stressResilience < 0.6
        ) {
          recommendations.push(
            this.createMeetingOptimizationRecommendation(userId, context, calendarData)
          );
        }
      }

      if (crossPlatformData?.weather) {
        const weatherData = crossPlatformData.weather;

        // Weather adaptation hybrid recommendation
        if (
          weatherData.current.condition === 'rainy' &&
          userVector.features.weatherSensitivity > 0.6
        ) {
          recommendations.push(
            this.createWeatherAdaptationRecommendation(userId, context, weatherData)
          );
        }
      }
    } catch (error) {
      console.warn('[RecommendationEngine] Cross-platform data not available:', error);
    }

    return recommendations.filter(r => r !== null) as Recommendation[];
  }

  /**
   * Find similar users based on behavioral vectors
   */
  private findSimilarUsers(userId: string, limit: number = 10): SimilarityResult[] {
    const userVector = this.userVectors.get(userId);
    if (!userVector) return [];

    const similarities: SimilarityResult[] = [];

    for (const [otherUserId, otherVector] of this.userVectors) {
      if (otherUserId === userId) continue;

      // Calculate cosine similarity
      const similarity = this.calculateCosineSimilarity(
        userVector.embedding,
        otherVector.embedding
      );

      // Find shared features
      const sharedFeatures = this.findSharedFeatures(userVector, otherVector);

      similarities.push({
        userId: otherUserId,
        similarity,
        sharedFeatures,
      });
    }

    // Sort by similarity and return top results
    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Find shared behavioral features between users
   */
  private findSharedFeatures(userA: UserVector, userB: UserVector): string[] {
    const shared: string[] = [];
    const threshold = 0.3; // Features are considered shared if within 30%

    for (const [feature, valueA] of Object.entries(userA.features)) {
      const valueB = userB.features[feature as keyof typeof userB.features];
      if (typeof valueB === 'number' && Math.abs(valueA - valueB) < threshold) {
        shared.push(feature);
      }
    }

    return shared;
  }

  /**
   * Update user vector with latest behavioral data
   */
  private async updateUserVector(
    userId: string,
    alarms: Alarm[],
    alarmEvents: AlarmEvent[]
  ): Promise<void> {
    let userVector = this.userVectors.get(userId);

    if (!userVector) {
      userVector = this.createInitialUserVector(userId);
    }

    // Update features based on recent data
    const features = this.extractBehavioralFeatures(alarms, alarmEvents);
    userVector.features = { ...userVector.features, ...features };

    // Update embedding (simplified - in production, use more sophisticated methods)
    userVector.embedding = this.generateEmbedding(userVector.features);
    userVector.lastUpdated = new Date();

    this.userVectors.set(userId, userVector);
  }

  /**
   * Extract behavioral features from user data
   */
  private extractBehavioralFeatures(
    alarms: Alarm[],
    alarmEvents: AlarmEvent[]
  ): Partial<UserVector['features']> {
    if (alarmEvents.length === 0) return {};

    const dismissedEvents = alarmEvents.filter(e => e.dismissed);
    const snoozedEvents = alarmEvents.filter(e => e.snoozed);

    return {
      consistencyScore: dismissedEvents.length / alarmEvents.length,
      morningPersonality: this.calculateMorningPersonality(alarms),
      changeAdaptability: this.calculateChangeAdaptability(alarmEvents),
      stressResilience: Math.max(
        0,
        1 - (snoozedEvents.length / alarmEvents.length) * 2
      ),
      sleepQualityTrend: this.calculateSleepQualityTrend(alarmEvents),
      engagementLevel: this.calculateEngagementLevel(userId),
    };
  }

  /**
   * Generate high-dimensional embedding from features
   */
  private generateEmbedding(features: UserVector['features']): number[] {
    // Simplified embedding generation - in production, use neural networks
    const embedding: number[] = [];

    for (const [key, value] of Object.entries(features)) {
      if (typeof value === 'number') {
        embedding.push(value);
      }
    }

    // Pad to fixed size
    while (embedding.length < 50) {
      embedding.push(0);
    }

    return embedding.slice(0, 50);
  }

  // Recommendation creation methods
  private createProductivityRecommendation(
    userId: string,
    context: RecommendationContext
  ): ActionableRecommendation {
    return {
      id: `productivity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'actionable',
      title: 'Optimize Your Productive Hours',
      description:
        'Align your most challenging tasks with your natural energy peaks for maximum productivity.',
      category: 'productivity',
      priority: 'high',
      confidence: 0.85,
      personalizedReason:
        'Your productivity patterns suggest you could benefit from better task-energy alignment.',
      estimatedImpact: {
        sleepQuality: 0.1,
        energyLevel: 0.3,
        consistency: 0.2,
        wellbeing: 0.2,
        productivity: 0.7,
      },
      implementationComplexity: 'moderate',
      timeToSeeResults: '1-2 weeks',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      actions: [
        {
          step: 1,
          description: 'Track your energy levels hourly for 3 days',
          duration: '5 minutes daily',
          required: true,
        },
        {
          step: 2,
          description: 'Identify your top 3 energy peak hours',
          duration: '10 minutes',
          required: true,
        },
        {
          step: 3,
          description: 'Schedule your most important tasks during peak hours',
          duration: '15 minutes weekly',
          required: true,
        },
      ],
      prerequisites: ['Enable productivity tracking'],
      successMetrics: [
        {
          metric: 'Task completion rate',
          targetImprovement: 0.25,
          measuredBy: 'weekly review',
        },
      ],
    };
  }

  private createWellnessRecommendation(
    userId: string,
    context: RecommendationContext
  ): ActionableRecommendation {
    return {
      id: `wellness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'actionable',
      title: 'Stress Reduction Morning Routine',
      description:
        'Start your day with a personalized stress-reduction routine to improve overall wellbeing.',
      category: 'wellness',
      priority: 'high',
      confidence: 0.8,
      personalizedReason:
        'Your stress patterns suggest you would benefit from morning mindfulness practices.',
      estimatedImpact: {
        sleepQuality: 0.3,
        energyLevel: 0.4,
        consistency: 0.2,
        wellbeing: 0.8,
        productivity: 0.3,
      },
      implementationComplexity: 'simple',
      timeToSeeResults: '1 week',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      actions: [
        {
          step: 1,
          description: 'Set aside 5 minutes after your alarm for breathing exercises',
          duration: '5 minutes daily',
          required: true,
        },
        {
          step: 2,
          description: 'Practice progressive muscle relaxation',
          duration: '3 minutes',
          required: false,
          alternatives: ['Light stretching', 'Gratitude journaling'],
        },
      ],
      prerequisites: [],
      successMetrics: [
        {
          metric: 'Morning stress level',
          targetImprovement: 0.3,
          measuredBy: 'daily self-assessment',
        },
      ],
    };
  }

  // Additional helper methods...
  private calculateMorningPersonality(alarms: Alarm[]): number {
    const morningAlarms = alarms.filter(a => {
      const hour = parseInt(a.time.split(':')[0]);
      return hour >= 5 && hour <= 9;
    });
    return morningAlarms.length / Math.max(alarms.length, 1);
  }

  private calculateChangeAdaptability(alarmEvents: AlarmEvent[]): number {
    // Simplified calculation based on alarm time variations
    if (alarmEvents.length < 5) return 0.5;

    const times = alarmEvents.map(
      e => e.firedAt.getHours() * 60 + e.firedAt.getMinutes()
    );
    const variance = this.calculateVariance(times);
    return Math.min(1, variance / 3600); // Normalize to 0-1
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    return numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
  }

  private calculateSleepQualityTrend(alarmEvents: AlarmEvent[]): number {
    // Simplified calculation - in production, integrate with sleep tracking
    const recentEvents = alarmEvents.slice(-7);
    const dismissedCount = recentEvents.filter(e => e.dismissed && !e.snoozed).length;
    return dismissedCount / Math.max(recentEvents.length, 1);
  }

  private calculateEngagementLevel(userId: string): number {
    const userEngagement = this.engagementData.get(userId);
    if (!userEngagement || userEngagement.size === 0) return 0.5;

    const engagements = Array.from(userEngagement.values());
    return engagements.reduce((sum, e) => sum + e, 0) / engagements.length;
  }

  // Additional stub methods for completeness
  private createInitialUserVector(userId: string): UserVector {
    return {
      userId,
      features: {
        consistencyScore: 0.5,
        morningPersonality: 0.5,
        socialInfluence: 0.5,
        changeAdaptability: 0.5,
        stressResilience: 0.5,
        challengeSeeking: 0.5,
        privacyPreference: 0.5,
        featureUsage: {},
        seasonalSensitivity: 0.5,
        weatherSensitivity: 0.5,
        socialActivityLevel: 0.5,
        workLifeBalance: 0.5,
        sleepQualityTrend: 0.5,
        productivityTrend: 0.5,
        wellbeingTrend: 0.5,
        engagementLevel: 0.5,
      },
      embedding: new Array(50).fill(0.5),
      lastUpdated: new Date(),
    };
  }

  private async buildRecommendationContext(
    userId: string
  ): Promise<RecommendationContext> {
    const now = new Date();
    const hour = now.getHours();

    let timeOfDay: string;
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    return {
      timeOfDay,
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
      season: this.getCurrentSeason(),
      recentAlarmPerformance: 0.7, // Placeholder
      stressLevel: 0.4, // Placeholder
      energyLevel: 0.7, // Placeholder
      upcomingEvents: [],
      recentRecommendationEngagement: this.calculateEngagementLevel(userId),
    };
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private deduplicateAndRank(
    recommendations: Recommendation[],
    userId: string,
    context: RecommendationContext
  ): Recommendation[] {
    // Remove duplicates based on title similarity
    const unique = new Map<string, Recommendation>();

    for (const rec of recommendations) {
      const key = rec.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!unique.has(key)) {
        unique.set(key, rec);
      } else {
        // Keep the one with higher confidence
        const existing = unique.get(key)!;
        if (rec.confidence > existing.confidence) {
          unique.set(key, rec);
        }
      }
    }

    // Rank by combined score
    return Array.from(unique.values()).sort((a, b) => {
      const scoreA = this.calculateRecommendationScore(a, userId, context);
      const scoreB = this.calculateRecommendationScore(b, userId, context);
      return scoreB - scoreA;
    });
  }

  private calculateRecommendationScore(
    rec: Recommendation,
    userId: string,
    context: RecommendationContext
  ): number {
    const userVector = this.userVectors.get(userId);
    if (!userVector) return rec.confidence;

    let score = rec.confidence * 0.4; // Base confidence

    // Add priority weight
    const priorityWeights = { critical: 1.0, high: 0.8, medium: 0.6, low: 0.4 };
    score += priorityWeights[rec.priority] * 0.3;

    // Add impact weight
    const totalImpact = Object.values(rec.estimatedImpact).reduce(
      (sum, impact) => sum + impact,
      0
    );
    score += (totalImpact / 5) * 0.3; // Normalize by 5 impact categories

    return Math.min(1.0, score);
  }

  private selectOptimalRecommendations(
    recommendations: Recommendation[],
    userId: string
  ): Recommendation[] {
    const userVector = this.userVectors.get(userId);
    const maxRecommendations = userVector?.features.engagementLevel > 0.7 ? 8 : 5;

    return recommendations.slice(0, maxRecommendations);
  }

  private generateRecommendationReasoning(
    recommendations: Recommendation[],
    userId: string,
    context: RecommendationContext
  ): {
    primaryFactors: string[];
    collaborativeInsights: string[];
    contentBasedMatches: string[];
    contextualAdjustments: string[];
  } {
    return {
      primaryFactors: [
        'Your consistency patterns show room for optimization',
        'Recent sleep quality trends indicate potential improvements',
        'Stress levels suggest wellness interventions would be beneficial',
      ],
      collaborativeInsights: [
        'Users with similar patterns found success with morning routines',
        'Peer data suggests productivity optimizations work well for your profile',
      ],
      contentBasedMatches: [
        'Based on your previous engagement with productivity content',
        'Your preference for actionable recommendations guided these selections',
      ],
      contextualAdjustments: [
        `Adjusted for ${context.timeOfDay} timing`,
        `Seasonal considerations for ${context.season} included`,
      ],
    };
  }

  private storeRecommendationHistory(
    userId: string,
    recommendations: Recommendation[]
  ): void {
    if (!this.recommendationHistory.has(userId)) {
      this.recommendationHistory.set(userId, []);
    }

    const history = this.recommendationHistory.get(userId)!;
    history.push(...recommendations);

    // Keep only last 50 recommendations
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  private calculateNextUpdateTime(userId: string): number {
    const engagementLevel = this.calculateEngagementLevel(userId);

    // High engagement = more frequent updates
    if (engagementLevel > 0.8) return 240; // 4 hours
    if (engagementLevel > 0.6) return 480; // 8 hours
    if (engagementLevel > 0.4) return 720; // 12 hours
    return 1440; // 24 hours
  }

  // Stub implementations for various helper methods
  private hasUserSeenRecommendation(userId: string, rec: Recommendation): boolean {
    const history = this.recommendationHistory.get(userId) || [];
    return history.some(r => r.title === rec.title);
  }

  private adaptRecommendationForUser(
    rec: Recommendation,
    userId: string,
    context: RecommendationContext,
    similarity: number
  ): Recommendation | null {
    // Adapt existing recommendation for new user
    const adapted = { ...rec };
    adapted.id = `adapted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    adapted.confidence *= similarity;
    adapted.createdAt = new Date();
    adapted.personalizedReason = `Based on successful outcomes from users with similar patterns (${Math.round(similarity * 100)}% similarity)`;

    return adapted.confidence > 0.5 ? adapted : null;
  }

  private analyzePreferredCategories(
    history: Recommendation[],
    engagement: Map<string, number>
  ): string[] {
    const categoryEngagement = new Map<string, number>();

    for (const rec of history) {
      const engagementScore = engagement.get(rec.id) || 0;
      const current = categoryEngagement.get(rec.category) || 0;
      categoryEngagement.set(rec.category, current + engagementScore);
    }

    return Array.from(categoryEngagement.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
  }

  private analyzePreferredComplexity(
    history: Recommendation[],
    engagement: Map<string, number>
  ): string {
    const complexityEngagement = new Map<string, number>();

    for (const rec of history) {
      const engagementScore = engagement.get(rec.id) || 0;
      const current = complexityEngagement.get(rec.implementationComplexity) || 0;
      complexityEngagement.set(rec.implementationComplexity, current + engagementScore);
    }

    return (
      Array.from(complexityEngagement.entries()).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0] || 'moderate'
    );
  }

  private analyzePreferredTypes(
    history: Recommendation[],
    engagement: Map<string, number>
  ): string[] {
    const typeEngagement = new Map<string, number>();

    for (const rec of history) {
      const engagementScore = engagement.get(rec.id) || 0;
      const current = typeEngagement.get(rec.type) || 0;
      typeEngagement.set(rec.type, current + engagementScore);
    }

    return Array.from(typeEngagement.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([type]) => type);
  }

  // Additional stub methods for specific recommendation types
  private createOptimizationRecommendation(
    userId: string,
    context: RecommendationContext
  ): Recommendation {
    return this.createProductivityRecommendation(userId, context); // Placeholder
  }

  private createChallengeRecommendation(
    userId: string,
    context: RecommendationContext
  ): ChallengeRecommendation {
    return {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'challenge',
      title: '7-Day Consistency Challenge',
      description: 'Build your alarm consistency with a fun 7-day challenge',
      category: 'habit_formation',
      priority: 'medium',
      confidence: 0.75,
      personalizedReason:
        'Your challenge-seeking nature suggests you would enjoy this gamified approach',
      estimatedImpact: {
        sleepQuality: 0.2,
        energyLevel: 0.3,
        consistency: 0.8,
        wellbeing: 0.4,
        productivity: 0.3,
      },
      implementationComplexity: 'simple',
      timeToSeeResults: '1 week',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      challenge: {
        duration: '7 days',
        difficulty: 'beginner',
        goals: [
          'Dismiss alarm within 5 minutes',
          'No snoozing',
          'Consistent wake time',
        ],
        milestones: [
          { day: 3, milestone: 'Halfway there!', reward: 'Achievement badge' },
          { day: 7, milestone: 'Challenge complete!', reward: 'Premium theme unlock' },
        ],
      },
    };
  }

  private createMorningOptimizationRecommendation(
    userId: string,
    context: RecommendationContext
  ): Recommendation {
    return this.createProductivityRecommendation(userId, context); // Placeholder
  }

  private createEveningRelaxationRecommendation(
    userId: string,
    context: RecommendationContext
  ): Recommendation {
    return this.createWellnessRecommendation(userId, context); // Placeholder
  }

  private createStressReductionRecommendation(
    userId: string,
    context: RecommendationContext
  ): Recommendation {
    return this.createWellnessRecommendation(userId, context); // Placeholder
  }

  private createEnergyBoostRecommendation(
    userId: string,
    context: RecommendationContext
  ): Recommendation {
    return this.createProductivityRecommendation(userId, context); // Placeholder
  }

  private createSeasonalAdjustmentRecommendation(
    userId: string,
    context: RecommendationContext
  ): Recommendation {
    return this.createWellnessRecommendation(userId, context); // Placeholder
  }

  private createSleepQualityHybridRecommendation(
    userId: string,
    context: RecommendationContext,
    healthData: any
  ): Recommendation {
    return this.createWellnessRecommendation(userId, context); // Placeholder
  }

  private createEnergyCorrelationRecommendation(
    userId: string,
    context: RecommendationContext,
    healthData: any
  ): Recommendation {
    return this.createProductivityRecommendation(userId, context); // Placeholder
  }

  private createMeetingOptimizationRecommendation(
    userId: string,
    context: RecommendationContext,
    calendarData: any
  ): Recommendation {
    return this.createProductivityRecommendation(userId, context); // Placeholder
  }

  private createWeatherAdaptationRecommendation(
    userId: string,
    context: RecommendationContext,
    weatherData: any
  ): Recommendation {
    return this.createWellnessRecommendation(userId, context); // Placeholder
  }

  private initializeRecommendationEngine(): void {
    console.log(
      '[EnhancedRecommendationEngine] Initializing advanced recommendation system...'
    );
  }

  /**
   * Record user engagement with a recommendation
   */
  recordRecommendationEngagement(
    userId: string,
    recommendationId: string,
    engagement: number
  ): void {
    if (!this.engagementData.has(userId)) {
      this.engagementData.set(userId, new Map());
    }

    const userEngagement = this.engagementData.get(userId)!;
    userEngagement.set(recommendationId, engagement);

    console.log(
      `[RecommendationEngine] Recorded engagement: ${engagement} for recommendation ${recommendationId}`
    );
  }

  /**
   * Get recommendation performance metrics
   */
  getRecommendationMetrics(userId: string): {
    totalRecommendations: number;
    averageEngagement: number;
    categoryPerformance: Record<string, number>;
    typePerformance: Record<string, number>;
  } {
    const history = this.recommendationHistory.get(userId) || [];
    const engagement = this.engagementData.get(userId) || new Map();

    const categoryPerformance: Record<string, number> = {};
    const typePerformance: Record<string, number> = {};
    let totalEngagement = 0;

    for (const rec of history) {
      const engagementScore = engagement.get(rec.id) || 0;
      totalEngagement += engagementScore;

      if (!categoryPerformance[rec.category]) {
        categoryPerformance[rec.category] = 0;
      }
      categoryPerformance[rec.category] += engagementScore;

      if (!typePerformance[rec.type]) {
        typePerformance[rec.type] = 0;
      }
      typePerformance[rec.type] += engagementScore;
    }

    return {
      totalRecommendations: history.length,
      averageEngagement: history.length > 0 ? totalEngagement / history.length : 0,
      categoryPerformance,
      typePerformance,
    };
  }
}

// Supporting classes for collaborative and content-based filtering
class CollaborativeFilteringModel {
  // Placeholder implementation
}

class ContentBasedFilteringModel {
  // Placeholder implementation
}

export default EnhancedRecommendationEngine;
