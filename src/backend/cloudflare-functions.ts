// Enhanced Cloudflare Worker Functions for Relife Smart Alarm
// Advanced cloud functions for real-time analytics, notifications, and AI processing

// Using official @cloudflare/workers-types
import AnalyticsService from '../services/analytics';
// Note: D1Database, KVNamespace, DurableObjectNamespace types should come from @cloudflare/workers-types
import {
  DatabaseUser,
  DatabaseAlarm,
  DatabaseAlarmEvent,
  DatabaseAnalyticsEvent,
  DatabaseUserStats,
  DatabaseEmotionalProfile,
  DatabaseBattleStats,
  DatabasePerformanceMetric,
  DatabaseDeploymentData,
  DatabaseHealthData,
  DatabaseAIResponse,
  DatabaseRecommendation,
  DatabaseVoiceAnalysis,
  DatabaseQueryResult,
  isDatabaseUser,
  isDatabaseAlarm,
  isDatabaseAlarmEvent,
  isNumeric,
  isStringValue,
  asNumber,
  asString,
  asObject,
} from './database-types';

// Environment bindings interface
interface Env {
  // Database connections
  DB: D1Database; // D1 SQL database
  KV: KVNamespace; // Key-value storage for caching
  DURABLE_OBJECTS: DurableObjectNamespace; // For real-time features

  // External service keys
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  ELEVENLABS_API_KEY: string;
  OPENAI_API_KEY: string;
  PUSH_PUBLIC_KEY: string;
  PUSH_PRIVATE_KEY: string;

  // Configuration
  ENVIRONMENT: string;
  JWT_SECRET: string;
}

// Real-time alarm trigger processing
export class AlarmTriggerProcessor {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  // Process alarm trigger with advanced analytics
  async processAlarmTrigger(alarmData: {
    alarmId: string;
    userId: string;
    triggeredAt: string;
    deviceInfo: unknown;
    context: Record<string, unknown>;
  }): Promise<Response> {
    try {
      const startTime = Date.now();

      // Store trigger event with detailed context
      await this.storeAlarmEvent(alarmData);

      // Update real-time analytics
      await this.updateRealtimeAnalytics(alarmData);

      // Generate personalized wake-up content
      const personalizedContent = await this.generatePersonalizedContent(alarmData);

      // Send push notification if needed
      await this.sendPushNotification(alarmData);

      // Update user's sleep pattern analysis
      await this.updateSleepPatternAnalysis(alarmData);

      const processingTime = Date.now() - startTime;

      return Response.json({
        success: true,
        personalizedContent,
        processingTime,
        timestamp: new Date().toISOString(),
      });
    } catch (_error) {
      console._error('Error processing alarm trigger:', _error);
      return Response.json(
        {
          success: false,
          _error: 'Failed to process alarm trigger',
        },
        { status: 500 }
      );
    }
  }

  private async storeAlarmEvent(alarmData: unknown): Promise<void> {
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alarm_id: alarmData.alarmId,
      fired_at: alarmData.triggeredAt,
      device_type: alarmData.deviceInfo.type,
      network_type: alarmData.deviceInfo.networkType,
      battery_level: alarmData.deviceInfo.batteryLevel,
      ambient_light: alarmData.context.ambientLight,
      sleep_stage: alarmData.context.sleepStage || 'unknown',
      app_load_time: alarmData.context.appLoadTime,
      created_at: new Date().toISOString(),
    };

    // Store in both D1 and cache in KV for quick access
    await this.env.DB.prepare(
      `
      INSERT INTO alarm_events
      (id, alarm_id, fired_at, device_type, network_type, battery_level,
       ambient_light, sleep_stage, app_load_time, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(
        event.id,
        event.alarm_id,
        event.fired_at,
        event.device_type,
        event.network_type,
        event.battery_level,
        event.ambient_light,
        event.sleep_stage,
        event.app_load_time,
        _event.created_at
      )
      .run();

    // Cache recent events for quick access
    const cacheKey = `events:${alarmData.userId}:recent`;
    await this.env.KV.put(cacheKey, JSON.stringify(_event), { expirationTtl: 3600 });
  }

  private async updateRealtimeAnalytics(alarmData: unknown): Promise<void> {
    const analyticsData = {
      userId: alarmData.userId,
      timestamp: Date.now(),
      metric: 'alarm_triggered',
      value: 1,
      context: alarmData.context,
      deviceInfo: alarmData.deviceInfo,
    };

    // Update real-time analytics in KV store
    const analyticsKey = `analytics:${alarmData.userId}:${new Date().toISOString().split('T')[0]}`;
    const existingData = await this.env.KV.get(analyticsKey, 'json');
    const existing =
      existingData && typeof existingData === 'object'
        ? (existingData as {
            events: unknown[];
            totalTriggers: number;
            lastUpdated?: string;
          })
        : { events: [], totalTriggers: 0 };

    existing.events.push(analyticsData);
    existing.totalTriggers += 1;
    existing.lastUpdated = new Date().toISOString();

    await this.env.KV.put(analyticsKey, JSON.stringify(existing), {
      expirationTtl: 86400 * 7,
    });
  }

  private async generatePersonalizedContent(alarmData: unknown): Promise<unknown> {
    try {
      // Get user's historical data for personalization
      const userHistory = await this.getUserAlarmHistory(alarmData.userId);
      const sleepPattern = await this.getUserSleepPattern(alarmData.userId);

      // Generate personalized wake-up message using AI
      const personalizedMessage = await this.generateAIWakeupMessage({
        userHistory,
        sleepPattern,
        currentContext: alarmData.context,
        timeOfDay: new Date().getHours(),
      });

      // Get optimal voice settings for user
      const voiceSettings = await this.getOptimalVoiceSettings(
        alarmData.userId,
        alarmData.context
      );

      return {
        message: personalizedMessage,
        voiceSettings,
        escalationStrategy: await this.getOptimalEscalationStrategy(alarmData.userId),
        motivationalBoost: await this.getMotivationalContent(alarmData.userId),
      };
    } catch (_error) {
      console._error('Error generating personalized content:', _error);
      return {
        message: "Time to wake up! You've got this!",
        voiceSettings: { mood: 'motivational', rate: 1.0, pitch: 1.0 },
      };
    }
  }

  private async generateAIWakeupMessage(
    context: Record<string, unknown>
  ): Promise<string> {
    if (!this.env.OPENAI_API_KEY) {
      return 'Rise and shine! Time to start your amazing day!';
    }

    try {
      const prompt = `Generate a personalized wake-up message for someone with these characteristics:
      - Sleep pattern: ${JSON.stringify(context.sleepPattern)}
      - Time of day: ${context.timeOfDay}
      - Recent alarm history: ${context.userHistory.recentEffectiveness || 'unknown'}
      - Current context: ${JSON.stringify(context.currentContext)}

      Make it motivating, personalized, and appropriate for the time of day. Keep it under 50 words.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: '_user', content: prompt }],
          max_tokens: 100,
          temperature: 0.8,
        }),
      });

      const data = (await response.json()) as DatabaseAIResponse;
      return (
        data.choices?.[0]?.message?.content || 'Time to wake up and seize the day!'
      );
    } catch (_error) {
      console._error('AI message generation failed:', _error);
      return 'Time to wake up and seize the day!';
    }
  }

  private async getUserAlarmHistory(userId: string): Promise<unknown> {
    const cacheKey = `history:${userId}`;
    const cached = await this.env.KV.get(cacheKey, 'json');

    if (cached) {
      return cached;
    }

    // Query recent alarm history from database
    const history = await this.env.DB.prepare(
      `
      SELECT
        AVG(effectiveness_rating) as avg_effectiveness,
        AVG(response_time) as avg_response_time,
        COUNT(*) as total_alarms,
        COUNT(CASE WHEN dismissed = true THEN 1 END) as dismissed_count
      FROM alarm_events ae
      JOIN alarms a ON ae.alarm_id = a.id
      WHERE a.user_id = ? AND ae.fired_at > datetime('now', '-30 days')
    `
    )
      .bind(userId)
      .first();

    const historyData = {
      avgEffectiveness: asNumber(history?.avg_effectiveness, 0),
      avgResponseTime: asNumber(history?.avg_response_time, 0),
      totalAlarms: asNumber(history?.total_alarms, 0),
      successRate: history
        ? asNumber(history.dismissed_count, 0) / asNumber(history.total_alarms, 1)
        : 0,
    };

    // Cache for 1 hour
    await this.env.KV.put(cacheKey, JSON.stringify(historyData), {
      expirationTtl: 3600,
    });

    return historyData;
  }

  private async getUserSleepPattern(userId: string): Promise<unknown> {
    const cacheKey = `sleep_pattern:${userId}`;
    const cached = await this.env.KV.get(cacheKey, 'json');

    if (cached) {
      return cached;
    }

    // Query sleep pattern from database
    const sleepData = await this.env.DB.prepare(
      `
      SELECT
        AVG(total_duration) as avg_sleep_duration,
        AVG(sleep_efficiency) as avg_efficiency,
        AVG(restfulness_score) as avg_quality
      FROM sleep_sessions
      WHERE user_id = ? AND sleep_start > datetime('now', '-14 days')
    `
    )
      .bind(userId)
      .first();

    const patternData = {
      avgDuration: sleepData?.avg_sleep_duration || 480, // 8 hours default
      avgEfficiency: sleepData?.avg_efficiency || 85,
      avgQuality: sleepData?.avg_quality || 75,
    };

    // Cache for 6 hours
    await this.env.KV.put(cacheKey, JSON.stringify(patternData), {
      expirationTtl: 21600,
    });

    return patternData;
  }

  private async getOptimalVoiceSettings(
    userId: string,
    _context: Record<string, unknown>
  ): Promise<unknown> {
    // Get user's most effective voice settings based on history
    const effectiveSettings = await this.env.DB.prepare(
      `
      SELECT uv.voice_mood, uv.speech_rate, uv.pitch, uv.volume,
             AVG(ae.effectiveness_rating) as effectiveness
      FROM user_voices uv
      JOIN alarms a ON a.voice_mood = uv.voice_mood AND a.user_id = uv.user_id
      JOIN alarm_events ae ON ae.alarm_id = a.id
      WHERE uv.user_id = ? AND ae.fired_at > datetime('now', '-30 days')
      GROUP BY uv.voice_mood, uv.speech_rate, uv.pitch, uv.volume
      ORDER BY effectiveness DESC
      LIMIT 1
    `
    )
      .bind(userId)
      .first();

    return (
      effectiveSettings || {
        voice_mood: 'motivational',
        speech_rate: 1.0,
        pitch: 1.0,
        volume: 0.8,
      }
    );
  }

  private async getOptimalEscalationStrategy(userId: string): Promise<unknown> {
    // Determine optimal escalation based on user's response patterns
    const responsePatterns = await this.env.DB.prepare(
      `
      SELECT
        AVG(response_time) as avg_response_time,
        COUNT(CASE WHEN response_time <= 30 THEN 1 END) as quick_responses,
        COUNT(*) as total_responses
      FROM alarm_events
      WHERE alarm_id IN (
        SELECT id FROM alarms WHERE user_id = ?
      ) AND fired_at > datetime('now', '-30 days')
      AND response_time IS NOT NULL
    `
    )
      .bind(userId)
      .first();

    const avgResponseTime = asNumber(responsePatterns?.avg_response_time, 60);
    const quickResponseRate = responsePatterns
      ? asNumber(responsePatterns.quick_responses, 0) /
        asNumber(responsePatterns.total_responses, 1)
      : 0.5;

    // Adjust escalation based on user patterns
    let escalationSteps;
    if (quickResponseRate > 0.8) {
      // User responds quickly, use gentle escalation
      escalationSteps = [
        { delay: 30, volume: 0.6, vibration: false },
        { delay: 90, volume: 0.8, vibration: true },
        { delay: 180, volume: 1.0, vibration: true, flashlight: true },
      ];
    } else if (quickResponseRate < 0.3) {
      // User responds slowly, use aggressive escalation
      escalationSteps = [
        { delay: 15, volume: 0.8, vibration: true },
        { delay: 45, volume: 1.0, vibration: true, flashlight: true },
        { delay: 90, volume: 1.0, vibration: true, flashlight: true, repeat: true },
      ];
    } else {
      // Standard escalation
      escalationSteps = [
        { delay: 30, volume: 0.7, vibration: false },
        { delay: 75, volume: 0.9, vibration: true },
        { delay: 150, volume: 1.0, vibration: true, flashlight: true },
      ];
    }

    return { steps: escalationSteps, avgResponseTime, quickResponseRate };
  }

  private async getMotivationalContent(userId: string): Promise<unknown> {
    // Get user's goals and preferences for motivational content
    const userPrefs = await this.env.DB.prepare(
      `
      SELECT preferences, ai_settings
      FROM users
      WHERE id = ?
    `
    )
      .bind(userId)
      .first();

    const _preferences = userPrefs
      ? JSON.parse(asString(userPrefs.preferences, '{}'))
      : {};
    const aiSettings = userPrefs
      ? JSON.parse(asString(userPrefs.ai_settings, '{}'))
      : {};

    if (!aiSettings.moodBasedAlarms) {
      return { enabled: false };
    }

    // Generate contextual motivational boost
    const timeOfDay = new Date().getHours();
    let motivationalTheme;

    if (timeOfDay < 6) {
      motivationalTheme = 'early-riser';
    } else if (timeOfDay < 9) {
      motivationalTheme = 'morning-energy';
    } else if (timeOfDay < 12) {
      motivationalTheme = 'productive-day';
    } else {
      motivationalTheme = 'afternoon-reset';
    }

    return {
      enabled: true,
      theme: motivationalTheme,
      personalizedTip: await this.getPersonalizedTip(userId, motivationalTheme),
      energyBoost: await this.getEnergyBoostContent(motivationalTheme),
    };
  }

  private async getPersonalizedTip(userId: string, theme: string): Promise<string> {
    const tips = {
      'early-riser': [
        "You're ahead of 90% of people already! The early hours are your secret weapon.",
        'The world is quiet and yours to conquer. What will you create today?',
        "Champions wake up early. You're already winning.",
      ],
      'morning-energy': [
        'Your energy is your superpower. Channel it into something amazing today!',
        'The morning momentum you create will carry you through the entire day.',
        "You're not just waking up, you're rising up to meet your potential!",
      ],
      'productive-day': [
        "Time to turn possibilities into reality. What's your priority today?",
        'Your future self is counting on what you do in the next few hours.',
        'Success starts with the decision to wake up and show up.',
      ],
      'afternoon-reset': [
        "It's never too late to make today count. Reset and refocus.",
        'The afternoon is your second chance to make today extraordinary.',
        'Power naps are for champions preparing for their next victory.',
      ],
    };

    const themeTips = tips[theme as keyof typeof tips] || tips['morning-energy'];
    return themeTips[Math.floor(Math.random() * themeTips.length)];
  }

  private async getEnergyBoostContent(theme: string): Promise<unknown> {
    return {
      breathingExercise: {
        name: '4-7-8 Energizing Breath',
        instructions: 'Inhale for 4, hold for 7, exhale for 8. Repeat 3 times.',
        duration: 60,
      },
      quickWin: {
        action: 'Make your bed and drink a glass of water',
        benefit: 'Instant sense of accomplishment and hydration boost',
        timeRequired: 2,
      },
      affirmation: this.getContextualAffirmation(theme),
    };
  }

  private getContextualAffirmation(theme: string): string {
    const affirmations = {
      'early-riser': 'I am disciplined, focused, and ahead of my goals.',
      'morning-energy': 'I have abundant energy and unlimited potential.',
      'productive-day': 'I accomplish meaningful work that matters to me.',
      'afternoon-reset': 'I refresh my mind and approach challenges with clarity.',
    };

    return (
      affirmations[theme as keyof typeof affirmations] || affirmations['morning-energy']
    );
  }

  private async sendPushNotification(alarmData: unknown): Promise<void> {
    // Implementation for sending push notifications
    // This would integrate with service worker for web push notifications
    try {
      const notificationPayload = {
        title: 'Wake Up Call! ⏰',
        body: 'Your alarm is ringing. Time to start your amazing day!',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: `alarm-${alarmData.alarmId}`,
        timestamp: Date.now(),
        actions: [
          { action: 'dismiss', title: "I'm Up!" },
          { action: 'snooze', title: 'Snooze 5 min' },
        ],
      };

      // Store notification for service worker to pick up
      const notificationKey = `notification:${alarmData.userId}:${Date.now()}`;
      await this.env.KV.put(notificationKey, JSON.stringify(notificationPayload), {
        expirationTtl: 300, // 5 minutes
      });
    } catch (_error) {
      console._error('Failed to send push notification:', _error);
    }
  }

  private async updateSleepPatternAnalysis(alarmData: unknown): Promise<void> {
    // Update sleep pattern analysis based on alarm timing and user response
    const analysisData = {
      alarmTime: alarmData.triggeredAt,
      responseTime: null, // Will be updated when user responds
      context: alarmData.context,
      deviceInfo: alarmData.deviceInfo,
      timestamp: Date.now(),
    };

    // Store for sleep analysis processing
    const analysisKey = `sleep_analysis:${alarmData.userId}:${Date.now()}`;
    await this.env.KV.put(analysisKey, JSON.stringify(analysisData), {
      expirationTtl: 86400 * 30, // 30 days
    });
  }
}

// Smart recommendations processor
export class SmartRecommendationsProcessor {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async generateRecommendations(userId: string): Promise<Response> {
    try {
      const recommendations = await this.analyzeAndRecommend(userId);
      return Response.json({
        success: true,
        recommendations,
        generatedAt: new Date().toISOString(),
      });
    } catch (_error) {
      console._error('Error generating recommendations:', _error);
      return Response.json(
        {
          success: false,
          _error: 'Failed to generate recommendations',
        },
        { status: 500 }
      );
    }
  }

  private async analyzeAndRecommend(userId: string): Promise<unknown[]> {
    const recommendations: unknown[] = [];

    // Analyze alarm effectiveness
    const effectivenessAnalysis = await this.analyzeAlarmEffectiveness(userId);
    if (effectivenessAnalysis.recommendation) {
      recommendations.push(effectivenessAnalysis.recommendation);
    }

    // Analyze sleep patterns
    const sleepAnalysis = await this.analyzeSleepPatterns(userId);
    if (sleepAnalysis.recommendation) {
      recommendations.push(sleepAnalysis.recommendation);
    }

    // Analyze voice preferences
    const voiceAnalysis = await this.analyzeVoicePreferences(userId);
    if (voiceAnalysis.recommendation) {
      recommendations.push(voiceAnalysis.recommendation);
    }

    // Analyze timing patterns
    const timingAnalysis = await this.analyzeTimingPatterns(userId);
    if (timingAnalysis.recommendation) {
      recommendations.push(timingAnalysis.recommendation);
    }

    return recommendations.filter(rec => asNumber(rec.confidence_score, 0) > 0.6);
  }

  private async analyzeAlarmEffectiveness(userId: string): Promise<unknown> {
    const effectiveness = await this.env.DB.prepare(
      `
      SELECT
        AVG(effectiveness_rating) as avg_rating,
        AVG(response_time) as avg_response,
        COUNT(*) as total_alarms,
        a.alarm_type,
        a.voice_mood
      FROM alarm_events ae
      JOIN alarms a ON ae.alarm_id = a.id
      WHERE a.user_id = ? AND ae.fired_at > datetime('now', '-30 days')
      GROUP BY a.alarm_type, a.voice_mood
      ORDER BY avg_rating DESC
    `
    )
      .bind(userId)
      .all();

    if (!effectiveness.results || effectiveness.results.length === 0) {
      return {};
    }

    const bestPerforming = effectiveness.results[0];
    const worstPerforming = effectiveness.results[effectiveness.results.length - 1];

    if (
      asNumber(bestPerforming.avg_rating, 0) >
      asNumber(worstPerforming.avg_rating, 0) + 1
    ) {
      return {
        recommendation: {
          id: `rec_${Date.now()}`,
          user_id: userId,
          recommendation_type: 'alarm_optimization',
          title: 'Optimize Your Alarm Settings',
          description: `Your ${asString(bestPerforming.alarm_type)} alarms with ${asString(bestPerforming.voice_mood)} mood are ${Math.round((asNumber(bestPerforming.avg_rating, 0) - asNumber(worstPerforming.avg_rating, 0)) * 20)}% more effective.`,
          suggested_value: {
            alarm_type: asString(bestPerforming.alarm_type),
            voice_mood: asString(bestPerforming.voice_mood),
          },
          confidence_score: Math.min(
            0.95,
            (asNumber(bestPerforming.avg_rating, 0) -
              asNumber(worstPerforming.avg_rating, 0)) /
              2
          ),
          reasoning: `Based on ${bestPerforming.total_alarms} alarm interactions over the past 30 days`,
          category: ['effectiveness', 'personalization'],
          priority: 2,
        },
      };
    }

    return {};
  }

  private async analyzeSleepPatterns(userId: string): Promise<unknown> {
    const sleepData = await this.env.DB.prepare(
      `
      SELECT
        AVG(total_duration) as avg_duration,
        AVG(sleep_efficiency) as avg_efficiency,
        AVG(restfulness_score) as avg_quality,
        COUNT(*) as sessions_count
      FROM sleep_sessions
      WHERE user_id = ? AND sleep_start > datetime('now', '-14 days')
    `
    )
      .bind(userId)
      .first();

    if (!sleepData || asNumber(sleepData.sessions_count, 0) < 5) {
      return {};
    }

    // Recommend earlier bedtime if sleep duration is consistently low
    const avgDuration = asNumber(sleepData.avg_duration, 480);
    if (avgDuration < 420) {
      // Less than 7 hours
      return {
        recommendation: {
          id: `rec_${Date.now()}`,
          user_id: userId,
          recommendation_type: 'bedtime',
          title: 'Earlier Bedtime Recommended',
          description: `You're averaging ${Math.round((avgDuration / 60) * 10) / 10} hours of sleep. Consider going to bed 30-45 minutes earlier.`,
          suggested_value: {
            adjustment: -45, // minutes earlier
            target_duration: 480, // 8 hours
          },
          confidence_score: Math.min(
            0.9,
            (420 - asNumber(sleepData.avg_duration, 480)) / 120
          ),
          reasoning: `Based on ${asNumber(sleepData.sessions_count, 0)} sleep sessions showing consistently short sleep duration`,
          category: ['sleep_health', 'schedule_optimization'],
          priority: 1,
        },
      };
    }

    return {};
  }

  private async analyzeVoicePreferences(userId: string): Promise<unknown> {
    const voiceEffectiveness = await this.env.DB.prepare(
      `
      SELECT
        a.voice_mood,
        AVG(ae.effectiveness_rating) as avg_effectiveness,
        COUNT(*) as usage_count
      FROM alarms a
      JOIN alarm_events ae ON a.id = ae.alarm_id
      WHERE a.user_id = ? AND ae.fired_at > datetime('now', '-30 days')
      AND ae.effectiveness_rating IS NOT NULL
      GROUP BY a.voice_mood
      HAVING usage_count >= 3
      ORDER BY avg_effectiveness DESC
    `
    )
      .bind(userId)
      .all();

    if (!voiceEffectiveness.results || voiceEffectiveness.results.length < 2) {
      return {};
    }

    const best = voiceEffectiveness.results[0];
    const current = voiceEffectiveness.results.find(
      (v: unknown) =>
        v.usage_count ===
        Math.max(...voiceEffectiveness.results.map((r: unknown) => r.usage_count))
    );

    if (
      best.voice_mood !== current?.voice_mood &&
      asNumber(best.avg_effectiveness, 0) >
        asNumber(current?.avg_effectiveness, 0) + 0.5
    ) {
      return {
        recommendation: {
          id: `rec_${Date.now()}`,
          user_id: userId,
          recommendation_type: 'voice_optimization',
          title: 'Switch to More Effective Voice Mood',
          description: `Your ${asString(best.voice_mood)} voice mood is performing ${Math.round((asNumber(best.avg_effectiveness, 0) - asNumber(current?.avg_effectiveness, 0)) * 20)}% better than your current preference.`,
          suggested_value: {
            voice_mood: asString(best.voice_mood),
            expected_improvement: Math.round(
              (asNumber(best.avg_effectiveness, 0) -
                asNumber(current?.avg_effectiveness, 0)) *
                20
            ),
          },
          confidence_score: Math.min(
            0.9,
            (asNumber(best.avg_effectiveness, 0) -
              asNumber(current?.avg_effectiveness, 0)) /
              2
          ),
          reasoning: `${best.voice_mood} mood shows consistently higher effectiveness ratings`,
          category: ['voice_personalization', 'effectiveness'],
          priority: 2,
        },
      };
    }

    return {};
  }

  private async analyzeTimingPatterns(userId: string): Promise<unknown> {
    const timingData = await this.env.DB.prepare(
      `
      SELECT
        strftime('%H', a.time) as hour,
        AVG(ae.effectiveness_rating) as avg_effectiveness,
        AVG(ae.response_time) as avg_response_time,
        COUNT(*) as alarm_count
      FROM alarms a
      JOIN alarm_events ae ON a.id = ae.alarm_id
      WHERE a.user_id = ? AND ae.fired_at > datetime('now', '-30 days')
      AND ae.effectiveness_rating IS NOT NULL
      GROUP BY strftime('%H', a.time)
      HAVING alarm_count >= 3
      ORDER BY avg_effectiveness DESC
    `
    )
      .bind(userId)
      .all();

    if (!timingData.results || timingData.results.length < 2) {
      return {};
    }

    const bestHour = timingData.results[0];
    const worstHour = timingData.results[timingData.results.length - 1];

    if (
      asNumber(bestHour.avg_effectiveness, 0) >
      asNumber(worstHour.avg_effectiveness, 0) + 1
    ) {
      return {
        recommendation: {
          id: `rec_${Date.now()}`,
          user_id: userId,
          recommendation_type: 'timing_optimization',
          title: 'Optimize Your Wake-Up Time',
          description: `You respond best to alarms around ${asString(bestHour.hour)}:00. Consider adjusting your schedule.`,
          suggested_value: {
            optimal_hour: parseInt(asString(bestHour.hour, '7')),
            effectiveness_boost: Math.round(
              (asNumber(bestHour.avg_effectiveness, 0) -
                asNumber(worstHour.avg_effectiveness, 0)) *
                20
            ),
          },
          confidence_score: Math.min(
            0.85,
            (asNumber(bestHour.avg_effectiveness, 0) -
              asNumber(worstHour.avg_effectiveness, 0)) /
              3
          ),
          reasoning: `${asString(bestHour.hour)}:00 alarms show ${Math.round((asNumber(bestHour.avg_effectiveness, 0) - asNumber(worstHour.avg_effectiveness, 0)) * 20)}% higher effectiveness`,
          category: ['timing', 'circadian_rhythm'],
          priority: 3,
        },
      };
    }

    return {};
  }
}

// Real-time analytics aggregation
export class AnalyticsAggregator {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async processRealtimeAnalytics(): Promise<Response> {
    try {
      // Process analytics from KV store
      const analytics = await this.aggregateDailyAnalytics();
      const insights = await this.generateInsights(analytics);

      return Response.json({
        success: true,
        analytics,
        insights,
        processedAt: new Date().toISOString(),
      });
    } catch (_error) {
      console._error('Error processing analytics:', _error);
      return Response.json(
        {
          success: false,
          _error: 'Failed to process analytics',
        },
        { status: 500 }
      );
    }
  }

  private async aggregateDailyAnalytics(): Promise<unknown> {
    // Get today's analytics from KV
    const today = new Date().toISOString().split('T')[0];
    const analyticsKeys = await this.env.KV.list({ prefix: `analytics:*:${today}` });

    const aggregatedData = {
      totalUsers: 0,
      totalAlarmTriggers: 0,
      avgResponseTime: 0,
      topPerformingVoiceMoods: new Map(),
      deviceTypeDistribution: new Map(),
      hourlyDistribution: new Array(24).fill(0),
    };

    for (const key of analyticsKeys.keys) {
      const data = await this.env.KV.get(key.name, 'json');
      if (data && typeof data === 'object' && 'events' in data) {
        const typedData = data as { events: unknown[]; totalTriggers: number };
        aggregatedData.totalUsers++;
        aggregatedData.totalAlarmTriggers += typedData.totalTriggers;

        for (const _event of typedData.events) {
          // Aggregate hourly distribution
          const hour = new Date(_event.timestamp).getHours();
          aggregatedData.hourlyDistribution[hour]++;

          // Track device types
          const deviceType = event.deviceInfo?.type || 'unknown';
          aggregatedData.deviceTypeDistribution.set(
            deviceType,
            (aggregatedData.deviceTypeDistribution.get(deviceType) || 0) + 1
          );
        }
      }
    }

    return {
      ...aggregatedData,
      deviceTypeDistribution: Object.fromEntries(aggregatedData.deviceTypeDistribution),
      topPerformingVoiceMoods: Object.fromEntries(
        aggregatedData.topPerformingVoiceMoods
      ),
    };
  }

  private async generateInsights(analytics: unknown): Promise<unknown[]> {
    const insights = [];

    // Peak usage hours
    const peakHour = analytics.hourlyDistribution.indexOf(
      Math.max(...analytics.hourlyDistribution)
    );
    insights.push({
      type: 'usage_pattern',
      title: 'Peak Wake-Up Hour',
      description: `Most users wake up at ${peakHour}:00`,
      value: peakHour,
      impact: 'high',
    });

    // Device preferences
    const totalDeviceUsage = Object.values(analytics.deviceTypeDistribution).reduce(
      (a, b) => (a as number) + (b as number),
      0
    );
    const topDevice = Object.entries(analytics.deviceTypeDistribution).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    )[0];

    if (topDevice) {
      insights.push({
        type: 'device_preference',
        title: 'Primary Device Type',
        description: `${Math.round(((topDevice[1] as number) / (totalDeviceUsage as number)) * 100)}% of alarms triggered on ${topDevice[0]}`,
        value: topDevice[0],
        impact: 'medium',
      });
    }

    return insights;
  }
}

// Main request router for cloud functions
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route to appropriate processor
      if (url.pathname === '/api/cloud/alarm-trigger' && method === 'POST') {
        const processor = new AlarmTriggerProcessor(env);
        const alarmData = asObject(await request.json(), {});
        const response = await processor.processAlarmTrigger(alarmData as unknown);

        // Add CORS headers to response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        return response;
      }

      if (url.pathname === '/api/cloud/recommendations' && method === 'POST') {
        const processor = new SmartRecommendationsProcessor(env);
        const requestData = asObject(await request.json(), {});
        const userId = asString(requestData.userId, '');
        const response = await processor.generateRecommendations(userId);

        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        return response;
      }

      if (url.pathname === '/api/cloud/analytics' && method === 'GET') {
        const aggregator = new AnalyticsAggregator(env);
        const response = await aggregator.processRealtimeAnalytics();

        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        return response;
      }

      // Health check
      if (url.pathname === '/api/cloud/health' && method === 'GET') {
        return Response.json(
          {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: env.ENVIRONMENT || 'production',
          },
          { headers: corsHeaders }
        );
      }

      return Response.json(
        {
          _error: 'Not found',
        },
        { status: 404, headers: corsHeaders }
      );
    } catch (_error) {
      console.error('Cloud function error:', _error);
      return Response.json(
        {
          _error: 'Internal server _error',
        },
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
