/**
 * WebSocket Type-specific Mock Utilities
 * Provides mock factories and utilities specifically designed for testing WebSocket types
 */

import type {
  WebSocketMessage,
  WebSocketConfig,
  WebSocketConnectionInfo,
  WebSocketError,
  WebSocketMetrics,
  WebSocketAuthPayload,
  WebSocketAuthResponse,
  WebSocketSubscription,
  DeviceInfo,
  WebSocketState,
  WebSocketErrorType,
} from '../../types/websocket';

import type {
  AlarmTriggeredPayload,
  AlarmDismissedPayload,
  AlarmSnoozedPayload,
  UserPresenceUpdatePayload,
  UserActivityPayload,
  DeviceStatusChangePayload,
  RecommendationGeneratedPayload,
  AIAnalysisCompletePayload,
  VoiceMoodDetectedPayload,
  SleepPatternUpdatedPayload,
  SystemNotificationPayload,
  EmergencyAlertPayload,
  SyncStatusUpdatePayload,
  SyncConflictDetectedPayload,
} from '../../types/realtime-messages';

// Mock Data Factories
export class WebSocketTypeMocks {
  // Basic WebSocket Type Factories
  static createMockWebSocketConfig(
    overrides: Partial<WebSocketConfig> = {}
  ): WebSocketConfig {
    return {
      url: 'wss://test.relife.app/ws',
      protocols: ['relife-v1'],
      timeout: 10000,
      heartbeatInterval: 30000,
      reconnectAttempts: 3,
      reconnectDelay: 1000,
      exponentialBackoff: true,
      maxReconnectDelay: 30000,
      enableCompression: false,
      bufferMaxItems: 100,
      bufferMaxTime: 5000,
      enableLogging: false,
      ...overrides,
    };
  }

  static createMockConnectionInfo(
    overrides: Partial<WebSocketConnectionInfo> = {}
  ): WebSocketConnectionInfo {
    return {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      state: 'OPEN',
      url: 'wss://test.relife.app/ws',
      protocol: 'relife-v1',
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
      reconnectCount: 0,
      latency: 125,
      userId: 'test-user-123',
      sessionId: 'test-session-456',
      ...overrides,
    };
  }

  static createMockDeviceInfo(
    type: 'mobile' | 'tablet' | 'desktop' | 'smartwatch' | 'smart_speaker' = 'mobile'
  ): DeviceInfo {
    const baseInfo: DeviceInfo = {
      type,
      platform: type === 'mobile' ? 'iOS' : 'Windows',
      userAgent: 'test-user-agent',
      capabilities: {
        notifications: true,
        serviceWorker: true,
        webSocket: true,
        webRTC: type !== 'smartwatch',
      },
    };

    switch (type) {
      case 'mobile':
        return {
          ...baseInfo,
          screen: { width: 375, height: 812, pixelRatio: 3 },
          network: { type: 'cellular', effectiveType: '4g', downlink: 25, rtt: 50 },
        };
      case 'tablet':
        return {
          ...baseInfo,
          screen: { width: 768, height: 1024, pixelRatio: 2 },
          network: { type: 'wifi', downlink: 100, rtt: 20 },
        };
      case 'desktop':
        return {
          ...baseInfo,
          platform: 'Windows',
          screen: { width: 1920, height: 1080, pixelRatio: 1 },
          network: { type: 'ethernet', downlink: 1000, rtt: 10 },
        };
      case 'smartwatch':
        return {
          ...baseInfo,
          platform: 'WatchOS',
          screen: { width: 184, height: 224, pixelRatio: 2 },
          network: { type: 'bluetooth', rtt: 100 },
        };
      default:
        return baseInfo;
    }
  }

  static createMockWebSocketError(
    type: WebSocketErrorType = 'CONNECTION_FAILED'
  ): WebSocketError {
    const errorMessages = {
      CONNECTION_FAILED: 'Failed to establish connection',
      AUTHENTICATION_FAILED: 'Authentication credentials invalid',
      NETWORK_ERROR: 'Network connectivity issue',
      PROTOCOL_ERROR: 'Protocol violation detected',
      TIMEOUT: 'Operation timed out',
      RATE_LIMITED: 'Rate limit exceeded',
      INVALID_MESSAGE: 'Message format is invalid',
      RECONNECTION_FAILED: 'Failed to reconnect after multiple attempts',
    };

    return {
      type,
      code: type === 'CONNECTION_FAILED' ? 1006 : undefined,
      message: errorMessages[type],
      details: { errorType: type, timestamp: Date.now() },
      timestamp: new Date(),
      recoverable: type !== 'AUTHENTICATION_FAILED',
      retryAfter: type === 'RATE_LIMITED' ? 60000 : undefined,
    };
  }

  static createMockWebSocketMetrics(): WebSocketMetrics {
    return {
      connectionId: 'conn-123',
      connectionsEstablished: 5,
      connectionsDropped: 2,
      messagesReceived: 1250,
      messagesSent: 890,
      averageLatency: 145,
      maxLatency: 450,
      totalReconnections: 3,
      uptime: 3600000, // 1 hour
      dataTransferred: {
        sent: 524288, // 512KB
        received: 1048576, // 1MB
      },
      errorCounts: {
        CONNECTION_FAILED: 2,
        AUTHENTICATION_FAILED: 0,
        NETWORK_ERROR: 1,
        PROTOCOL_ERROR: 0,
        TIMEOUT: 1,
        RATE_LIMITED: 0,
        INVALID_MESSAGE: 0,
        RECONNECTION_FAILED: 1,
      },
      lastUpdated: new Date(),
    };
  }

  static createMockAuthPayload(
    overrides: Partial<WebSocketAuthPayload> = {}
  ): WebSocketAuthPayload {
    return {
      token: 'mock-jwt-token-123',
      userId: 'test-user-456',
      sessionId: 'test-session-789',
      deviceInfo: this.createMockDeviceInfo('mobile'),
      capabilities: ['realtime_messaging', 'push_notifications', 'voice_commands'],
      ...overrides,
    };
  }

  static createMockAuthResponse(success: boolean = true): WebSocketAuthResponse {
    return {
      success,
      sessionId: success ? 'authenticated-session-123' : 'failed-session',
      permissions: success
        ? ['alarm_management', 'user_presence', 'ai_recommendations']
        : [],
      serverCapabilities: success
        ? ['heartbeat', 'compression', 'binary_messages']
        : [],
      heartbeatInterval: success ? 30000 : 0,
      maxMessageSize: success ? 65536 : 0,
      rateLimit: {
        messagesPerSecond: success ? 10 : 0,
        burstLimit: success ? 50 : 0,
      },
    };
  }

  static createMockSubscription(
    overrides: Partial<WebSocketSubscription> = {}
  ): WebSocketSubscription {
    return {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'alarm_updates',
      filters: { userId: 'test-user' },
      priority: 'normal',
      createdAt: new Date(),
      lastActivity: new Date(),
      ...overrides,
    };
  }

  // Message Payload Factories
  static createMockAlarmTriggeredPayload(): AlarmTriggeredPayload {
    return {
      alarm: {
        id: 'alarm-123',
        label: 'Morning Routine',
        time: '07:00',
        enabled: true,
        days: [1, 2, 3, 4, 5],
        sound: 'gentle_bells.wav',
        volume: 0.8,
      } as unknown,
      triggeredAt: new Date(),
      location: {
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 5,
      },
      deviceInfo: {
        batteryLevel: 85,
        networkType: 'wifi',
        isCharging: false,
      },
      contextualData: {
        weatherCondition: 'sunny',
        ambientLightLevel: 80,
        noiseLevel: 25,
      },
    };
  }

  static createMockAlarmDismissedPayload(): AlarmDismissedPayload {
    return {
      alarmId: 'alarm-123',
      dismissedAt: new Date(),
      dismissMethod: 'voice',
      timeToReact: 15000,
      voiceData: {
        mood: 'tired',
        confidenceScore: 0.75,
        wakefulness: 0.4,
        responseText: 'okay I am awake',
      },
      challengeData: {
        type: 'math',
        completed: true,
        attempts: 2,
        duration: 45000,
      },
    };
  }

  static createMockAlarmSnoozedPayload(): AlarmSnoozedPayload {
    return {
      alarmId: 'alarm-123',
      snoozedAt: new Date(),
      snoozeMethod: 'button',
      snoozeDuration: 10,
      snoozeCount: 1,
      voiceData: {
        mood: 'sleepy',
        responseText: 'five more minutes',
      },
    };
  }

  static createMockUserPresencePayload(): UserPresenceUpdatePayload {
    return {
      userId: 'user-456',
      status: 'online',
      lastSeen: new Date(),
      activeDevices: [
        {
          deviceId: 'device-789',
          type: 'mobile',
          lastActivity: new Date(),
          location: 'home',
        },
      ],
      currentActivity: {
        type: 'viewing_alarms',
        details: { page: 'dashboard', section: 'active_alarms' },
        startedAt: new Date(),
      },
    };
  }

  static createMockUserActivityPayload(): UserActivityPayload {
    return {
      userId: 'user-456',
      activityType: 'alarm_interaction',
      details: {
        action: 'create_alarm',
        feature: 'smart_scheduling',
        duration: 120000,
        metadata: {
          alarmType: 'recurring',
          hasVoiceCommand: true,
          difficulty: 'medium',
        },
      },
      timestamp: new Date(),
      sessionId: 'session-789',
      deviceInfo: {
        type: 'mobile',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        screen: { width: 375, height: 812 },
      },
    };
  }

  static createMockDeviceStatusChangePayload(): DeviceStatusChangePayload {
    return {
      deviceId: 'device-789',
      userId: 'user-456',
      status: 'connected',
      deviceInfo: {
        type: 'mobile',
        name: 'iPhone 13 Pro',
        batteryLevel: 85,
        isCharging: false,
        version: 'iOS 15.0',
        capabilities: ['notifications', 'voice_recognition', 'biometrics'],
      },
      location: {
        latitude: 40.7589,
        longitude: -73.9851,
        accuracy: 10,
        timestamp: new Date(),
      },
      networkInfo: {
        type: 'wifi',
        strength: 85,
        provider: 'Home Network',
      },
    };
  }

  static createMockRecommendationPayload(): RecommendationGeneratedPayload {
    return {
      recommendationId: 'rec-789',
      type: 'alarm_optimization',
      category: 'performance',
      priority: 'medium',
      recommendation: {
        title: 'Optimize your wake-up time',
        description:
          'Based on your sleep patterns, consider adjusting your alarm by 15 minutes',
        actionText: 'Apply suggestion',
        benefits: [
          'Better sleep quality',
          'Easier wake-up experience',
          'More consistent schedule',
        ],
        estimatedImpact: 7,
      },
      data: {
        currentState: {
          avgWakeTime: '07:00',
          avgSleepDuration: 6.5,
          consistency: 0.72,
        },
        suggestedChanges: {
          optimalWakeTime: '06:45',
          targetSleepDuration: 7.5,
          improvedConsistency: 0.89,
        },
        reasoning:
          'Your natural wake patterns align better with 6:45 AM based on movement and voice analysis',
        confidence: 0.87,
        basedOn: ['sleep_tracker', 'voice_analysis', 'movement_patterns'],
      },
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      autoApply: false,
    };
  }

  static createMockAIAnalysisPayload(): AIAnalysisCompletePayload {
    return {
      analysisId: 'analysis-123',
      type: 'sleep_pattern',
      userId: 'user-456',
      results: {
        summary: 'Your sleep pattern shows good duration but inconsistent timing',
        insights: [
          {
            category: 'duration',
            finding: 'Average sleep duration is within healthy range (7.2 hours)',
            confidence: 0.92,
            impact: 'positive',
          },
          {
            category: 'consistency',
            finding: 'Bedtime varies significantly on weekends (+2.5 hours)',
            confidence: 0.89,
            impact: 'negative',
          },
        ],
        metrics: {
          avgBedtime: 23.25, // 11:15 PM
          avgWakeTime: 6.75, // 6:45 AM
          avgDuration: 7.2,
          efficiency: 0.85,
          consistency: 0.68,
        },
        trends: [
          {
            metric: 'sleep_duration',
            direction: 'stable',
            rate: 0.02,
            significance: 0.3,
          },
          {
            metric: 'bedtime_consistency',
            direction: 'declining',
            rate: -0.15,
            significance: 0.82,
          },
        ],
      },
      recommendations: [
        {
          action: 'Maintain consistent weekend bedtime',
          priority: 1,
          expectedOutcome: 'Improved sleep quality and easier Monday mornings',
        },
        {
          action: 'Consider a 30-minute wind-down routine',
          priority: 2,
          expectedOutcome: 'Better sleep onset and deeper rest',
        },
      ],
      generatedAt: new Date(),
      validFor: 30,
    };
  }

  static createMockVoiceMoodPayload(): VoiceMoodDetectedPayload {
    return {
      userId: 'user-456',
      sessionId: 'voice-session-789',
      detectedMood: 'tired',
      confidence: 0.78,
      audioMetrics: {
        duration: 3.5,
        volume: -12.5,
        pitch: 180.5,
        clarity: 0.85,
        responseTime: 1200,
      },
      contextualFactors: {
        timeOfDay: '07:15',
        dayOfWeek: 'Monday',
        weatherCondition: 'rainy',
        recentAlarmActivity: true,
        stressIndicators: 0.6,
      },
      recommendations: [
        {
          type: 'mood_improvement',
          suggestion: 'Consider a gentler wake-up routine on rainy mornings',
          priority: 2,
        },
        {
          type: 'voice_training',
          suggestion: 'Practice morning voice commands for better recognition',
          priority: 3,
        },
      ],
      historicalComparison: {
        averageMood: 'neutral',
        moodTrend: 'declining',
        unusualPatterns: [
          'Lower energy on rainy days',
          'Slower response times on Mondays',
        ],
      },
    };
  }

  static createMockSleepPatternPayload(): SleepPatternUpdatedPayload {
    return {
      userId: 'user-456',
      analysisDate: new Date(),
      pattern: {
        averageBedtime: '23:15',
        averageWakeTime: '06:45',
        averageSleepDuration: 7.5,
        sleepEfficiency: 0.87,
        deepSleepPercentage: 22,
        remSleepPercentage: 20,
      },
      trends: {
        bedtimeConsistency: 0.73,
        wakeTimeConsistency: 0.81,
        weekendShift: 1.25,
        seasonalTrend: 'winter_delay',
      },
      insights: [
        {
          category: 'quality',
          finding: 'Sleep efficiency is above average',
          impact: 'positive',
          confidence: 0.91,
        },
        {
          category: 'consistency',
          finding: 'Weekend schedule disrupts weekday rhythm',
          impact: 'negative',
          confidence: 0.84,
        },
      ],
      recommendations: [
        {
          type: 'bedtime_adjustment',
          description: 'Try to maintain weekday bedtime on weekends',
          expectedImprovement: 'Better Monday morning alertness',
          difficulty: 'medium',
        },
      ],
    };
  }

  static createMockSystemNotificationPayload(): SystemNotificationPayload {
    return {
      notificationId: 'notif-456',
      type: 'info',
      severity: 'medium',
      title: 'New Feature Available',
      message: 'Smart sleep analysis is now available in your dashboard',
      details:
        'This feature uses AI to provide personalized sleep insights and recommendations',
      actionRequired: false,
      actions: [
        {
          id: 'try_now',
          label: 'Try Now',
          type: 'primary',
          url: '/dashboard/sleep-analysis',
        },
        {
          id: 'learn_more',
          label: 'Learn More',
          type: 'secondary',
          url: '/help/sleep-analysis',
        },
      ],
      affectedFeatures: ['sleep_tracking', 'ai_recommendations'],
      dismissible: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  static createMockEmergencyAlertPayload(): EmergencyAlertPayload {
    return {
      alertId: 'alert-critical-789',
      type: 'service_outage',
      severity: 'critical',
      title: 'Service Temporarily Unavailable',
      description:
        'We are experiencing technical difficulties that may affect alarm reliability',
      immediateActions: [
        'Set backup alarms on your device',
        'Check our status page for updates',
        'Contact support if issues persist',
      ],
      affectedUsers: ['premium_users', 'voice_feature_users'],
      estimatedImpact: 'Alarms may not trigger reliably for the next 30 minutes',
      statusUrl: 'https://status.relife.app',
      contactInfo: {
        email: 'support@relife.app',
        supportUrl: 'https://help.relife.app/emergency',
      },
      issuedAt: new Date(),
      resolvedAt: undefined,
    };
  }

  static createMockSyncStatusPayload(): SyncStatusUpdatePayload {
    return {
      syncId: 'sync-operation-123',
      userId: 'user-456',
      type: 'incremental_sync',
      status: 'in_progress',
      progress: {
        current: 75,
        total: 100,
        percentage: 75,
        estimatedTimeRemaining: 30,
      },
      items: {
        alarms: { processed: 8, total: 10, errors: 0 },
        settings: { processed: 15, total: 15, errors: 0 },
        analytics: { processed: 52, total: 75, errors: 1 },
      },
      conflicts: [],
      errors: [
        {
          code: 'ANALYTICS_PARSE_ERROR',
          message: 'Unable to parse analytics data from 2023-12-01',
          itemType: 'analytics',
          itemId: 'analytics-2023-12-01',
        },
      ],
    };
  }

  static createMockSyncConflictPayload(): SyncConflictDetectedPayload {
    return {
      conflictId: 'conflict-456',
      itemType: 'alarm',
      itemId: 'alarm-123',
      conflictType: 'data_mismatch',
      localVersion: {
        data: {
          label: 'Morning Alarm',
          time: '07:00',
          enabled: true,
        },
        lastModified: new Date(Date.now() - 60000), // 1 minute ago
        version: 5,
        source: 'mobile_app',
      },
      remoteVersion: {
        data: {
          label: 'Morning Routine',
          time: '07:15',
          enabled: true,
        },
        lastModified: new Date(Date.now() - 30000), // 30 seconds ago
        version: 6,
        source: 'web_app',
      },
      autoResolution: {
        possible: false,
        strategy: 'use_latest',
        confidence: 0.6,
      },
      userActionRequired: true,
      suggestedActions: [
        {
          action: 'accept_remote',
          description: 'Use the version from web app (Morning Routine, 07:15)',
          consequences: 'Local changes will be overwritten',
        },
        {
          action: 'accept_local',
          description: 'Keep the mobile app version (Morning Alarm, 07:00)',
          consequences: 'Remote changes will be overwritten',
        },
        {
          action: 'merge',
          description: 'Combine both versions manually',
          consequences: 'You will need to resolve conflicts manually',
        },
      ],
    };
  }

  // Message Factory
  static createMockWebSocketMessage<T>(
    type: string,
    payload: T,
    overrides: Partial<WebSocketMessage<T>> = {}
  ): WebSocketMessage<T> {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as unknown,
      payload,
      timestamp: new Date().toISOString(),
      userId: 'test-user-456',
      sessionId: 'test-session-789',
      version: '1.0',
      ...overrides,
    };
  }

  // Batch Message Creators
  static createMockAlarmMessages(): WebSocketMessage<unknown>[] {
    return [
      this.createMockWebSocketMessage(
        'alarm_triggered',
        this.createMockAlarmTriggeredPayload()
      ),
      this.createMockWebSocketMessage(
        'alarm_dismissed',
        this.createMockAlarmDismissedPayload()
      ),
      this.createMockWebSocketMessage(
        'alarm_snoozed',
        this.createMockAlarmSnoozedPayload()
      ),
    ];
  }

  static createMockUserMessages(): WebSocketMessage<unknown>[] {
    return [
      this.createMockWebSocketMessage(
        'user_presence_update',
        this.createMockUserPresencePayload()
      ),
      this.createMockWebSocketMessage(
        'user_activity',
        this.createMockUserActivityPayload()
      ),
      this.createMockWebSocketMessage(
        'device_status_change',
        this.createMockDeviceStatusChangePayload()
      ),
    ];
  }

  static createMockAIMessages(): WebSocketMessage<unknown>[] {
    return [
      this.createMockWebSocketMessage(
        'recommendation_generated',
        this.createMockRecommendationPayload()
      ),
      this.createMockWebSocketMessage(
        'ai_analysis_complete',
        this.createMockAIAnalysisPayload()
      ),
      this.createMockWebSocketMessage(
        'voice_mood_detected',
        this.createMockVoiceMoodPayload()
      ),
      this.createMockWebSocketMessage(
        'sleep_pattern_updated',
        this.createMockSleepPatternPayload()
      ),
    ];
  }

  static createMockSystemMessages(): WebSocketMessage<unknown>[] {
    return [
      this.createMockWebSocketMessage(
        'system_notification',
        this.createMockSystemNotificationPayload()
      ),
      this.createMockWebSocketMessage(
        'emergency_alert',
        this.createMockEmergencyAlertPayload()
      ),
    ];
  }

  static createMockSyncMessages(): WebSocketMessage<unknown>[] {
    return [
      this.createMockWebSocketMessage(
        'sync_status_update',
        this.createMockSyncStatusPayload()
      ),
      this.createMockWebSocketMessage(
        'sync_conflict_detected',
        this.createMockSyncConflictPayload()
      ),
    ];
  }

  // Test Scenario Builders
  static createConnectionScenario(state: WebSocketState = 'OPEN') {
    return {
      _config: this.createMockWebSocketConfig(),
      connectionInfo: this.createMockConnectionInfo({ state }),
      deviceInfo: this.createMockDeviceInfo('mobile'),
      authPayload: this.createMockAuthPayload(),
      authResponse: this.createMockAuthResponse(state === 'OPEN'),
    };
  }

  static createErrorScenario(errorType: WebSocketErrorType = 'CONNECTION_FAILED') {
    return {
      _error: this.createMockWebSocketError(errorType),
      metrics: {
        ...this.createMockWebSocketMetrics(),
        errorCounts: {
          ...this.createMockWebSocketMetrics().errorCounts,
          [errorType]: 1,
        },
      },
    };
  }

  static createMessageFlowScenario() {
    return {
      alarmMessages: this.createMockAlarmMessages(),
      userMessages: this.createMockUserMessages(),
      aiMessages: this.createMockAIMessages(),
      systemMessages: this.createMockSystemMessages(),
      syncMessages: this.createMockSyncMessages(),
    };
  }

  // Validation Helpers
  static isValidWebSocketMessage(message: unknown): message is WebSocketMessage {
    return (
      message &&
      typeof message.id === 'string' &&
      typeof message.type === 'string' &&
      message.payload !== undefined &&
      typeof message.timestamp === 'string' &&
      !isNaN(Date.parse(message.timestamp))
    );
  }

  static isValidConnectionInfo(info: unknown): info is WebSocketConnectionInfo {
    return (
      info &&
      typeof info.id === 'string' &&
      ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED', 'ERROR'].includes(info.state) &&
      typeof info.url === 'string' &&
      info.url.startsWith('ws') &&
      typeof info.reconnectCount === 'number' &&
      info.reconnectCount >= 0
    );
  }

  static isValidDeviceInfo(device: unknown): device is DeviceInfo {
    return (
      device &&
      ['mobile', 'tablet', 'desktop', 'smartwatch', 'smart_speaker'].includes(
        device.type
      ) &&
      typeof device.platform === 'string' &&
      typeof device.userAgent === 'string' &&
      device.capabilities &&
      typeof device.capabilities.notifications === 'boolean' &&
      typeof device.capabilities.serviceWorker === 'boolean' &&
      typeof device.capabilities.webSocket === 'boolean' &&
      typeof device.capabilities.webRTC === 'boolean'
    );
  }
}

export default WebSocketTypeMocks;
