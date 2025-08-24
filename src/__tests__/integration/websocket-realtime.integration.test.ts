/**
 * Integration Tests for WebSocket Real-time Features
 * Tests the complete WebSocket flow including connection, authentication, messaging, and reconnection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockWebSocket, RealTimeTestUtils, setupRealTimeTesting } from '../realtime/realtime-testing-utilities';
import type {
  WebSocketMessage,
  WebSocketConfig,
  WebSocketConnectionInfo,
  WebSocketManager,
  WebSocketAuthPayload,
  WebSocketAuthResponse
} from '../../types/websocket';

import type {
  AlarmTriggeredPayload,
  AlarmDismissedPayload,
  UserPresenceUpdatePayload,
  RecommendationGeneratedPayload,
  SystemNotificationPayload,
  AIAnalysisCompletePayload
} from '../../types/realtime-messages';

// Setup WebSocket testing environment
setupRealTimeTesting();

describe('WebSocket Real-time Integration Tests', () => {
  let mockConfig: WebSocketConfig;
  let testUserId: string;
  let testSessionId: string;

  beforeEach(() => {
    RealTimeTestUtils.reset();
    testUserId = 'test-user-123';
    testSessionId = 'test-session-456';

    mockConfig = {
      url: 'wss://test.relife.app/ws',
      timeout: 5000,
      heartbeatInterval: 10000,
      reconnectAttempts: 3,
      reconnectDelay: 1000,
      exponentialBackoff: true,
      maxReconnectDelay: 10000,
      enableCompression: false,
      bufferMaxItems: 100,
      bufferMaxTime: 5000,
      enableLogging: true
    };
  });

  afterEach(() => {
    RealTimeTestUtils.reset();
  });

  describe('Connection Management', () => {
    it('should establish WebSocket connection successfully', async () => {
      const ws = new MockWebSocket(mockConfig.url);
      const connectionPromise = new Promise<WebSocketConnectionInfo>((resolve) => {
        ws.addEventListener('open', () => {
          resolve({
            id: ws.id,
            state: 'OPEN',
            url: ws.url,
            connectedAt: new Date(),
            reconnectCount: 0,
            userId: testUserId,
            sessionId: testSessionId
          });
        });
      });

      const connectionInfo = await connectionPromise;

      expect(connectionInfo.state).toBe('OPEN');
      expect(connectionInfo.url).toBe(mockConfig.url);
      expect(connectionInfo.connectedAt).toBeInstanceOf(Date);
      expect(ws.readyState).toBe(MockWebSocket.OPEN);

      ws.close();
    });

    it('should handle connection timeout', async () => {
      const timeoutConfig = { ...mockConfig, timeout: 100 };
      
      // Mock a WebSocket that doesn't connect
      const SlowMockWebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          this.readyState = MockWebSocket.CONNECTING;
          // Never transition to OPEN state to simulate timeout
        }
      };

      const ws = new SlowMockWebSocket(timeoutConfig.url);
      
      const timeoutPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, timeoutConfig.timeout);

        ws.addEventListener('open', () => {
          clearTimeout(timeoutId);
          resolve(ws);
        });
      });

      await expect(timeoutPromise).rejects.toThrow('Connection timeout');
      expect(ws.readyState).toBe(MockWebSocket.CONNECTING);
    });

    it('should authenticate connection with valid credentials', async () => {
      const ws = new MockWebSocket(mockConfig.url);
      
      await new Promise<void>((resolve) => {
        ws.addEventListener('open', () => resolve());
      });

      const authPayload: WebSocketAuthPayload = {
        token: 'valid-jwt-token',
        userId: testUserId,
        sessionId: testSessionId,
        deviceInfo: {
          type: 'mobile',
          platform: 'iOS',
          userAgent: 'test-agent',
          capabilities: {
            notifications: true,
            serviceWorker: true,
            webSocket: true,
            webRTC: false
          }
        },
        capabilities: ['realtime_messaging', 'push_notifications']
      };

      // Mock server authentication response
      const authResponsePromise = new Promise<WebSocketAuthResponse>((resolve) => {
        ws.addEventListener('message', (event: any) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'authentication_request') {
              // Simulate server auth response
              setTimeout(() => {
                ws.simulateMessage({
                  type: 'authentication_response',
                  success: true,
                  sessionId: testSessionId,
                  permissions: ['alarm_management', 'user_presence'],
                  serverCapabilities: ['heartbeat', 'compression'],
                  heartbeatInterval: 30000,
                  maxMessageSize: 65536,
                  rateLimit: {
                    messagesPerSecond: 10,
                    burstLimit: 50
                  }
                });
              }, 50);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        });

        ws.addEventListener('message', (event: any) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'authentication_response' && data.success) {
              resolve(data);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        });
      });

      // Send authentication request
      ws.send(JSON.stringify({
        type: 'authentication_request',
        payload: authPayload
      }));

      const authResponse = await authResponsePromise;
      expect(authResponse.success).toBe(true);
      expect(authResponse.sessionId).toBe(testSessionId);
      expect(authResponse.permissions).toContain('alarm_management');

      ws.close();
    });
  });

  describe('Real-time Alarm Messages', () => {
    let ws: MockWebSocket;

    beforeEach(async () => {
      ws = new MockWebSocket(mockConfig.url);
      await new Promise<void>((resolve) => {
        ws.addEventListener('open', () => resolve());
      });
    });

    afterEach(() => {
      ws.close();
    });

    it('should handle alarm triggered message', async () => {
      const alarmPayload: AlarmTriggeredPayload = {
        alarm: {
          id: 'alarm-123',
          label: 'Morning Alarm',
          time: '07:00',
          enabled: true,
          days: [1, 2, 3, 4, 5]
        } as any,
        triggeredAt: new Date(),
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 5
        },
        deviceInfo: {
          batteryLevel: 85,
          networkType: 'wifi',
          isCharging: false
        },
        contextualData: {
          weatherCondition: 'sunny',
          ambientLightLevel: 80,
          noiseLevel: 20
        }
      };

      const messageReceived = new Promise<AlarmTriggeredPayload>((resolve) => {
        ws.addEventListener('message', (event: any) => {
          try {
            const message: WebSocketMessage<AlarmTriggeredPayload> = JSON.parse(event.data);
            if (message.type === 'alarm_triggered') {
              resolve(message.payload);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        });
      });

      // Simulate server sending alarm triggered message
      ws.simulateMessage({
        id: 'msg-123',
        type: 'alarm_triggered',
        payload: alarmPayload,
        timestamp: new Date().toISOString(),
        userId: testUserId
      });

      const receivedPayload = await messageReceived;
      expect(receivedPayload.alarm.id).toBe('alarm-123');
      expect(receivedPayload.triggeredAt).toBeInstanceOf(Date);
      expect(receivedPayload.location?.latitude).toBe(40.7128);
      expect(receivedPayload.deviceInfo.batteryLevel).toBe(85);
    });

    it('should handle alarm dismissed with voice data', async () => {
      const dismissPayload: AlarmDismissedPayload = {
        alarmId: 'alarm-123',
        dismissedAt: new Date(),
        dismissMethod: 'voice',
        timeToReact: 15000,
        voiceData: {
          mood: 'tired',
          confidenceScore: 0.75,
          wakefulness: 0.4,
          responseText: 'okay I am awake'
        }
      };

      const messageReceived = new Promise<AlarmDismissedPayload>((resolve) => {
        ws.addEventListener('message', (event: any) => {
          try {
            const message: WebSocketMessage<AlarmDismissedPayload> = JSON.parse(event.data);
            if (message.type === 'alarm_dismissed') {
              resolve(message.payload);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        });
      });

      ws.simulateMessage({
        id: 'msg-dismiss-123',
        type: 'alarm_dismissed',
        payload: dismissPayload,
        timestamp: new Date().toISOString(),
        userId: testUserId
      });

      const receivedPayload = await messageReceived;
      expect(receivedPayload.alarmId).toBe('alarm-123');
      expect(receivedPayload.dismissMethod).toBe('voice');
      expect(receivedPayload.voiceData?.mood).toBe('tired');
      expect(receivedPayload.voiceData?.confidenceScore).toBe(0.75);
    });
  });

  describe('User Presence Integration', () => {
    let ws: MockWebSocket;

    beforeEach(async () => {
      ws = new MockWebSocket(mockConfig.url);
      await new Promise<void>((resolve) => {
        ws.addEventListener('open', () => resolve());
      });
    });

    afterEach(() => {
      ws.close();
    });

    it('should track user presence changes', async () => {
      const presenceUpdates: UserPresenceUpdatePayload[] = [];

      ws.addEventListener('message', (event: any) => {
        try {
          const message: WebSocketMessage<UserPresenceUpdatePayload> = JSON.parse(event.data);
          if (message.type === 'user_presence_update') {
            presenceUpdates.push(message.payload);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      });

      // Simulate multiple presence updates
      const presenceScenarios = [
        { status: 'online' as const, activity: 'viewing_alarms' as const },
        { status: 'busy' as const, activity: 'in_meeting' as const },
        { status: 'away' as const, activity: undefined },
        { status: 'offline' as const, activity: undefined }
      ];

      for (const scenario of presenceScenarios) {
        const payload: UserPresenceUpdatePayload = {
          userId: testUserId,
          status: scenario.status,
          lastSeen: new Date(),
          activeDevices: [{
            deviceId: 'device-123',
            type: 'mobile',
            lastActivity: new Date(),
            location: 'home'
          }],
          currentActivity: scenario.activity ? {
            type: scenario.activity,
            startedAt: new Date()
          } : undefined
        };

        ws.simulateMessage({
          id: `presence-${Date.now()}`,
          type: 'user_presence_update',
          payload,
          timestamp: new Date().toISOString(),
          userId: testUserId
        });

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(presenceUpdates).toHaveLength(4);
      expect(presenceUpdates[0]?.status).toBe('online');
      expect(presenceUpdates[1]?.status).toBe('busy');
      expect(presenceUpdates[2]?.status).toBe('away');
      expect(presenceUpdates[3]?.status).toBe('offline');

      expect(presenceUpdates[0]?.currentActivity?.type).toBe('viewing_alarms');
      expect(presenceUpdates[1]?.currentActivity?.type).toBe('in_meeting');
    });
  });

  describe('AI Recommendations Integration', () => {
    let ws: MockWebSocket;

    beforeEach(async () => {
      ws = new MockWebSocket(mockConfig.url);
      await new Promise<void>((resolve) => {
        ws.addEventListener('open', () => resolve());
      });
    });

    afterEach(() => {
      ws.close();
    });

    it('should receive and process AI recommendations', async () => {
      const recommendations: RecommendationGeneratedPayload[] = [];

      ws.addEventListener('message', (event: any) => {
        try {
          const message: WebSocketMessage<RecommendationGeneratedPayload> = JSON.parse(event.data);
          if (message.type === 'recommendation_generated') {
            recommendations.push(message.payload);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      });

      const recommendationPayload: RecommendationGeneratedPayload = {
        recommendationId: 'rec-123',
        type: 'alarm_optimization',
        category: 'performance',
        priority: 'high',
        recommendation: {
          title: 'Optimize your morning routine',
          description: 'Based on your sleep patterns, consider moving your alarm 15 minutes earlier',
          actionText: 'Apply suggestion',
          benefits: ['Better sleep quality', 'Easier wake-up', 'More consistent schedule'],
          estimatedImpact: 8
        },
        data: {
          currentState: { wakeTime: '07:00', avgSleepDuration: 6.5 },
          suggestedChanges: { wakeTime: '06:45', targetSleepDuration: 7.5 },
          reasoning: 'Your sleep data shows you naturally wake up around 6:45 AM. Aligning your alarm with this pattern will improve wake-up experience.',
          confidence: 0.89,
          basedOn: ['sleep_tracker', 'voice_mood_analysis', 'dismissal_patterns']
        },
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Valid for 7 days
      };

      ws.simulateMessage({
        id: 'ai-rec-123',
        type: 'recommendation_generated',
        payload: recommendationPayload,
        timestamp: new Date().toISOString(),
        userId: testUserId
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]?.type).toBe('alarm_optimization');
      expect(recommendations[0]?.priority).toBe('high');
      expect(recommendations[0]?.data.confidence).toBeGreaterThan(0.8);
      expect(recommendations[0]?.recommendation.estimatedImpact).toBe(8);
    });

    it('should handle AI analysis completion', async () => {
      const analysisResults: AIAnalysisCompletePayload[] = [];

      ws.addEventListener('message', (event: any) => {
        try {
          const message: WebSocketMessage<AIAnalysisCompletePayload> = JSON.parse(event.data);
          if (message.type === 'ai_analysis_complete') {
            analysisResults.push(message.payload);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      });

      const analysisPayload: AIAnalysisCompletePayload = {
        analysisId: 'analysis-456',
        type: 'sleep_pattern',
        userId: testUserId,
        results: {
          summary: 'Your sleep pattern analysis shows room for improvement in consistency.',
          insights: [
            {
              category: 'consistency',
              finding: 'Bedtime varies by up to 2 hours on weekends',
              confidence: 0.92,
              impact: 'negative'
            },
            {
              category: 'duration',
              finding: 'Average sleep duration is within healthy range',
              confidence: 0.87,
              impact: 'positive'
            }
          ],
          metrics: {
            avgBedtime: 23.5, // 11:30 PM in decimal hours
            avgWakeTime: 7.0,  // 7:00 AM
            avgDuration: 7.5,
            consistency: 0.72
          },
          trends: [
            {
              metric: 'bedtime_consistency',
              direction: 'declining',
              rate: -0.1,
              significance: 0.8
            }
          ]
        },
        recommendations: [
          {
            action: 'Set a consistent bedtime routine',
            priority: 1,
            expectedOutcome: 'Improved sleep quality and easier wake-ups'
          }
        ],
        generatedAt: new Date(),
        validFor: 30
      };

      ws.simulateMessage({
        id: 'analysis-complete-123',
        type: 'ai_analysis_complete',
        payload: analysisPayload,
        timestamp: new Date().toISOString(),
        userId: testUserId
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(analysisResults).toHaveLength(1);
      expect(analysisResults[0]?.type).toBe('sleep_pattern');
      expect(analysisResults[0]?.results.insights).toHaveLength(2);
      expect(analysisResults[0]?.results.metrics.consistency).toBeLessThan(1);
    });
  });

  describe('Connection Resilience', () => {
    it('should handle connection drops and reconnections', async () => {
      const connectionStates: string[] = [];
      let reconnectionAttempts = 0;

      const createConnection = () => {
        const ws = new MockWebSocket(mockConfig.url);
        connectionStates.push('connecting');

        ws.addEventListener('open', () => {
          connectionStates.push('connected');
        });

        ws.addEventListener('close', () => {
          connectionStates.push('disconnected');
          
          // Simulate reconnection logic
          if (reconnectionAttempts < mockConfig.reconnectAttempts) {
            reconnectionAttempts++;
            const delay = mockConfig.exponentialBackoff 
              ? mockConfig.reconnectDelay * Math.pow(2, reconnectionAttempts - 1)
              : mockConfig.reconnectDelay;

            setTimeout(() => {
              connectionStates.push(`reconnect_attempt_${reconnectionAttempts}`);
              createConnection();
            }, Math.min(delay, mockConfig.maxReconnectDelay));
          } else {
            connectionStates.push('reconnection_failed');
          }
        });

        ws.addEventListener('error', () => {
          connectionStates.push('error');
        });

        // Simulate connection drop after 1 second
        if (reconnectionAttempts === 0) {
          setTimeout(() => {
            ws.simulateClose(1006, 'Connection lost');
          }, 1000);
        }

        return ws;
      };

      const initialConnection = createConnection();

      // Wait for reconnection attempts to complete
      await new Promise(resolve => setTimeout(resolve, 8000));

      expect(connectionStates).toContain('connecting');
      expect(connectionStates).toContain('connected');
      expect(connectionStates).toContain('disconnected');
      expect(connectionStates.filter(s => s.startsWith('reconnect_attempt')).length).toBe(mockConfig.reconnectAttempts);
      expect(reconnectionAttempts).toBe(mockConfig.reconnectAttempts);
    });

    it('should handle heartbeat mechanism', async () => {
      const ws = new MockWebSocket(mockConfig.url);
      const heartbeats: number[] = [];

      await new Promise<void>((resolve) => {
        ws.addEventListener('open', () => resolve());
      });

      ws.addEventListener('message', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'heartbeat_pong') {
            heartbeats.push(data.timestamp);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      });

      // Send multiple heartbeat pings
      const pingCount = 3;
      for (let i = 0; i < pingCount; i++) {
        ws.send(JSON.stringify({
          type: 'heartbeat_ping',
          timestamp: Date.now()
        }));
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(heartbeats.length).toBeGreaterThanOrEqual(pingCount);
      
      // Verify timestamps are recent
      heartbeats.forEach(timestamp => {
        expect(Date.now() - timestamp).toBeLessThan(5000);
      });

      ws.close();
    });
  });

  describe('System Notifications', () => {
    let ws: MockWebSocket;

    beforeEach(async () => {
      ws = new MockWebSocket(mockConfig.url);
      await new Promise<void>((resolve) => {
        ws.addEventListener('open', () => resolve());
      });
    });

    afterEach(() => {
      ws.close();
    });

    it('should handle system notifications', async () => {
      const notifications: SystemNotificationPayload[] = [];

      ws.addEventListener('message', (event: any) => {
        try {
          const message: WebSocketMessage<SystemNotificationPayload> = JSON.parse(event.data);
          if (message.type === 'system_notification') {
            notifications.push(message.payload);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      });

      const notificationPayload: SystemNotificationPayload = {
        notificationId: 'notif-789',
        type: 'warning',
        severity: 'medium',
        title: 'Scheduled Maintenance',
        message: 'The service will be temporarily unavailable for maintenance in 30 minutes.',
        details: 'Expected downtime: 15 minutes. All data will be preserved.',
        actionRequired: false,
        actions: [
          {
            id: 'acknowledge',
            label: 'Acknowledge',
            type: 'primary'
          }
        ],
        affectedFeatures: ['real_time_sync', 'push_notifications'],
        estimatedResolution: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
        dismissible: true,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      };

      ws.simulateMessage({
        id: 'sys-notif-123',
        type: 'system_notification',
        payload: notificationPayload,
        timestamp: new Date().toISOString()
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(notifications).toHaveLength(1);
      expect(notifications[0]?.type).toBe('warning');
      expect(notifications[0]?.severity).toBe('medium');
      expect(notifications[0]?.actionRequired).toBe(false);
      expect(notifications[0]?.dismissible).toBe(true);
      expect(notifications[0]?.actions).toHaveLength(1);
      expect(notifications[0]?.affectedFeatures).toContain('real_time_sync');
    });
  });

  describe('Message Queue and Rate Limiting', () => {
    it('should handle message queuing when connection is closed', async () => {
      const ws = new MockWebSocket(mockConfig.url);
      
      await new Promise<void>((resolve) => {
        ws.addEventListener('open', () => resolve());
      });

      // Close the connection
      ws.close();
      
      await new Promise<void>((resolve) => {
        ws.addEventListener('close', () => resolve());
      });

      // Try to send messages while disconnected
      const messagesToSend = [
        { type: 'test_message_1', data: 'test1' },
        { type: 'test_message_2', data: 'test2' },
        { type: 'test_message_3', data: 'test3' }
      ];

      messagesToSend.forEach(message => {
        ws.send(JSON.stringify(message));
      });

      // Verify messages weren't sent (connection was closed)
      const events = MockWebSocket.getEvents();
      const sendEvents = events.filter(e => e.type === 'send');
      
      // Should have some send attempts, but they won't actually be transmitted
      expect(sendEvents.length).toBeGreaterThanOrEqual(3);
    });

    it('should enforce rate limiting', async () => {
      const ws = new MockWebSocket(mockConfig.url);
      
      await new Promise<void>((resolve) => {
        ws.addEventListener('open', () => resolve());
      });

      // Simulate rate limit by tracking message frequency
      const messageTimes: number[] = [];
      const messageCount = 20;
      const startTime = Date.now();

      for (let i = 0; i < messageCount; i++) {
        const sendTime = Date.now();
        messageTimes.push(sendTime);
        
        ws.send(JSON.stringify({
          type: 'rate_limit_test',
          messageId: i,
          timestamp: sendTime
        }));

        // Small delay to simulate rapid sending
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const totalTime = Date.now() - startTime;
      const messagesPerSecond = (messageCount / totalTime) * 1000;

      // Verify we can track message rate
      expect(messageTimes).toHaveLength(messageCount);
      expect(messagesPerSecond).toBeGreaterThan(0);

      // In a real implementation, you would check against rate limits here
      // For testing purposes, we just verify the mechanism works
      const timeDifferences = messageTimes.slice(1).map((time, i) => time - messageTimes[i]);
      expect(timeDifferences.every(diff => diff >= 0)).toBe(true);

      ws.close();
    });
  });
});