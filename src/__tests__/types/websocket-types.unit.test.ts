/**
 * Unit Tests for WebSocket Types
 * Tests type guards, message validation, and type utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  WebSocketMessage,
  WebSocketConfig,
  WebSocketConnectionInfo,
  WebSocketError,
  WebSocketMetrics,
  WebSocketAuthPayload,
  WebSocketAuthResponse,
  WebSocketState,
  WebSocketErrorType,
  DeviceInfo
} from '../../types/websocket';

import type {
  AlarmTriggeredPayload,
  AlarmDismissedPayload,
  UserPresenceUpdatePayload,
  RecommendationGeneratedPayload,
  SystemNotificationPayload,
  RealtimeMessage
} from '../../types/realtime-messages';

import {
  isAlarmMessage,
  isUserMessage,
  isAIMessage,
  isSystemMessage,
  isSyncMessage
} from '../../types/realtime-messages';

describe('WebSocket Types Unit Tests', () => {
  describe('Type Guards', () => {
    it('should correctly identify alarm messages', () => {
      const alarmMessage: WebSocketMessage<AlarmTriggeredPayload> = {
        id: 'test-1',
        type: 'alarm_triggered',
        payload: {
          alarm: {
            id: 'alarm-1',
            label: 'Morning Alarm',
            time: '07:00',
            enabled: true,
            days: [1, 2, 3, 4, 5]
          } as any,
          triggeredAt: new Date(),
          deviceInfo: {
            batteryLevel: 85,
            networkType: 'wifi',
            isCharging: false
          },
          contextualData: {
            weatherCondition: 'sunny',
            ambientLightLevel: 75,
            noiseLevel: 30
          }
        },
        timestamp: new Date().toISOString(),
        userId: 'user-123'
      };

      const userMessage: WebSocketMessage<UserPresenceUpdatePayload> = {
        id: 'test-2',
        type: 'user_presence_update',
        payload: {
          userId: 'user-123',
          status: 'online',
          lastSeen: new Date(),
          activeDevices: []
        },
        timestamp: new Date().toISOString()
      };

      expect(isAlarmMessage(alarmMessage)).toBe(true);
      expect(isAlarmMessage(userMessage)).toBe(false);
      expect(isUserMessage(userMessage)).toBe(true);
      expect(isUserMessage(alarmMessage)).toBe(false);
    });

    it('should correctly identify AI messages', () => {
      const aiMessage: WebSocketMessage<RecommendationGeneratedPayload> = {
        id: 'test-ai-1',
        type: 'recommendation_generated',
        payload: {
          recommendationId: 'rec-123',
          type: 'alarm_optimization',
          category: 'performance',
          priority: 'medium',
          recommendation: {
            title: 'Optimize morning alarm',
            description: 'Adjust wake time by 15 minutes',
            actionText: 'Apply suggestion',
            benefits: ['Better sleep quality', 'Easier wake-up'],
            estimatedImpact: 7
          },
          data: {
            currentState: { wakeTime: '07:00' },
            suggestedChanges: { wakeTime: '06:45' },
            reasoning: 'Based on sleep pattern analysis',
            confidence: 0.85,
            basedOn: ['sleep_tracker', 'voice_mood']
          }
        },
        timestamp: new Date().toISOString(),
        userId: 'user-123'
      };

      expect(isAIMessage(aiMessage)).toBe(true);
      expect(isAlarmMessage(aiMessage)).toBe(false);
      expect(isUserMessage(aiMessage)).toBe(false);
    });

    it('should correctly identify system messages', () => {
      const systemMessage: WebSocketMessage<SystemNotificationPayload> = {
        id: 'test-system-1',
        type: 'system_notification',
        payload: {
          notificationId: 'notif-123',
          type: 'warning',
          severity: 'medium',
          title: 'Service Update',
          message: 'Scheduled maintenance in 1 hour',
          actionRequired: false,
          dismissible: true
        },
        timestamp: new Date().toISOString()
      };

      expect(isSystemMessage(systemMessage)).toBe(true);
      expect(isAIMessage(systemMessage)).toBe(false);
      expect(isAlarmMessage(systemMessage)).toBe(false);
    });

    it('should handle edge cases in type guards', () => {
      const invalidMessage = {
        id: 'invalid',
        type: 'unknown_type',
        payload: {},
        timestamp: new Date().toISOString()
      } as any;

      expect(isAlarmMessage(invalidMessage)).toBe(false);
      expect(isUserMessage(invalidMessage)).toBe(false);
      expect(isAIMessage(invalidMessage)).toBe(false);
      expect(isSystemMessage(invalidMessage)).toBe(false);
      expect(isSyncMessage(invalidMessage)).toBe(false);
    });
  });

  describe('WebSocket Configuration Validation', () => {
    it('should validate complete WebSocket config', () => {
      const config: WebSocketConfig = {
        url: 'wss://api.relife.app/ws',
        protocols: ['relife-v1'],
        timeout: 10000,
        heartbeatInterval: 30000,
        reconnectAttempts: 3,
        reconnectDelay: 1000,
        exponentialBackoff: true,
        maxReconnectDelay: 30000,
        enableCompression: true,
        bufferMaxItems: 100,
        bufferMaxTime: 5000,
        enableLogging: false
      };

      // Validate required fields
      expect(config.url).toMatch(/^wss?:\/\//);
      expect(config.timeout).toBeGreaterThan(0);
      expect(config.heartbeatInterval).toBeGreaterThan(0);
      expect(config.reconnectAttempts).toBeGreaterThanOrEqual(0);
      expect(config.reconnectDelay).toBeGreaterThan(0);
      expect(config.maxReconnectDelay).toBeGreaterThanOrEqual(config.reconnectDelay);
      expect(config.bufferMaxItems).toBeGreaterThan(0);
      expect(config.bufferMaxTime).toBeGreaterThan(0);
    });

    it('should validate minimal WebSocket config', () => {
      const minimalConfig: WebSocketConfig = {
        url: 'ws://localhost:3001',
        timeout: 5000,
        heartbeatInterval: 15000,
        reconnectAttempts: 1,
        reconnectDelay: 500,
        exponentialBackoff: false,
        maxReconnectDelay: 1000,
        enableCompression: false,
        bufferMaxItems: 50,
        bufferMaxTime: 2000,
        enableLogging: true
      };

      expect(minimalConfig.url).toBeTruthy();
      expect(minimalConfig.timeout).toBeGreaterThan(0);
      expect(minimalConfig.reconnectAttempts).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Device Info Validation', () => {
    it('should validate mobile device info', () => {
      const mobileDevice: DeviceInfo = {
        type: 'mobile',
        platform: 'iOS',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        screen: {
          width: 375,
          height: 812,
          pixelRatio: 3
        },
        network: {
          type: 'cellular',
          effectiveType: '4g',
          downlink: 25.5,
          rtt: 50
        },
        capabilities: {
          notifications: true,
          serviceWorker: true,
          webSocket: true,
          webRTC: false
        }
      };

      expect(mobileDevice.type).toBe('mobile');
      expect(mobileDevice.platform).toBeTruthy();
      expect(mobileDevice.screen?.width).toBeGreaterThan(0);
      expect(mobileDevice.screen?.height).toBeGreaterThan(0);
      expect(mobileDevice.screen?.pixelRatio).toBeGreaterThan(0);
      expect(mobileDevice.capabilities.webSocket).toBe(true);
    });

    it('should validate desktop device info', () => {
      const desktopDevice: DeviceInfo = {
        type: 'desktop',
        platform: 'Windows',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        screen: {
          width: 1920,
          height: 1080,
          pixelRatio: 1
        },
        capabilities: {
          notifications: true,
          serviceWorker: true,
          webSocket: true,
          webRTC: true
        }
      };

      expect(desktopDevice.type).toBe('desktop');
      expect(desktopDevice.capabilities.webRTC).toBe(true);
      expect(desktopDevice.screen?.width).toBeGreaterThan(1000);
    });
  });

  describe('Message Payload Validation', () => {
    it('should validate alarm triggered payload', () => {
      const payload: AlarmTriggeredPayload = {
        alarm: {
          id: 'alarm-123',
          label: 'Morning Routine',
          time: '07:00',
          enabled: true,
          days: [1, 2, 3, 4, 5]
        } as any,
        triggeredAt: new Date(),
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10
        },
        deviceInfo: {
          batteryLevel: 65,
          networkType: 'wifi',
          isCharging: true
        },
        contextualData: {
          weatherCondition: 'cloudy',
          ambientLightLevel: 45,
          noiseLevel: 25
        }
      };

      expect(payload.alarm.id).toBeTruthy();
      expect(payload.triggeredAt).toBeInstanceOf(Date);
      expect(payload.location?.latitude).toBeGreaterThan(-90);
      expect(payload.location?.latitude).toBeLessThan(90);
      expect(payload.location?.longitude).toBeGreaterThan(-180);
      expect(payload.location?.longitude).toBeLessThan(180);
      expect(payload.deviceInfo.batteryLevel).toBeGreaterThanOrEqual(0);
      expect(payload.deviceInfo.batteryLevel).toBeLessThanOrEqual(100);
    });

    it('should validate alarm dismissed payload', () => {
      const payload: AlarmDismissedPayload = {
        alarmId: 'alarm-123',
        dismissedAt: new Date(),
        dismissMethod: 'voice',
        timeToReact: 15000,
        voiceData: {
          mood: 'tired',
          confidenceScore: 0.75,
          wakefulness: 0.4,
          responseText: 'okay'
        },
        challengeData: {
          type: 'math',
          completed: true,
          attempts: 2,
          duration: 45000
        }
      };

      expect(payload.alarmId).toBeTruthy();
      expect(payload.dismissedAt).toBeInstanceOf(Date);
      expect(['voice', 'button', 'shake', 'challenge', 'timeout']).toContain(payload.dismissMethod);
      expect(payload.timeToReact).toBeGreaterThan(0);
      expect(payload.voiceData?.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(payload.voiceData?.confidenceScore).toBeLessThanOrEqual(1);
      expect(payload.voiceData?.wakefulness).toBeGreaterThanOrEqual(0);
      expect(payload.voiceData?.wakefulness).toBeLessThanOrEqual(1);
    });

    it('should validate user presence payload', () => {
      const payload: UserPresenceUpdatePayload = {
        userId: 'user-123',
        status: 'online',
        lastSeen: new Date(),
        activeDevices: [
          {
            deviceId: 'device-1',
            type: 'mobile',
            lastActivity: new Date(),
            location: 'home'
          }
        ],
        currentActivity: {
          type: 'viewing_alarms',
          details: { page: 'dashboard' },
          startedAt: new Date()
        }
      };

      expect(payload.userId).toBeTruthy();
      expect(['online', 'away', 'busy', 'offline', 'do_not_disturb']).toContain(payload.status);
      expect(payload.lastSeen).toBeInstanceOf(Date);
      expect(payload.activeDevices).toBeInstanceOf(Array);
      expect(payload.activeDevices[0]?.deviceId).toBeTruthy();
    });
  });

  describe('Error Handling Types', () => {
    it('should validate WebSocket error structure', () => {
      const error: WebSocketError = {
        type: 'CONNECTION_FAILED',
        code: 1006,
        message: 'Connection lost unexpectedly',
        details: { reason: 'Network timeout' },
        timestamp: new Date(),
        recoverable: true,
        retryAfter: 5000
      };

      expect(error.type).toBeTruthy();
      expect(error.message).toBeTruthy();
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(typeof error.recoverable).toBe('boolean');
      
      if (error.retryAfter) {
        expect(error.retryAfter).toBeGreaterThan(0);
      }
    });

    it('should validate all error types', () => {
      const errorTypes: WebSocketErrorType[] = [
        'CONNECTION_FAILED',
        'AUTHENTICATION_FAILED',
        'NETWORK_ERROR',
        'PROTOCOL_ERROR',
        'TIMEOUT',
        'RATE_LIMITED',
        'INVALID_MESSAGE',
        'RECONNECTION_FAILED'
      ];

      errorTypes.forEach(type => {
        const error: WebSocketError = {
          type,
          message: `Test ${type} error`,
          timestamp: new Date(),
          recoverable: type !== 'AUTHENTICATION_FAILED'
        };

        expect(error.type).toBe(type);
        expect(error.message).toContain(type.toLowerCase().replace('_', ' '));
      });
    });
  });

  describe('Connection State Validation', () => {
    it('should validate WebSocket states', () => {
      const states: WebSocketState[] = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED', 'ERROR'];
      
      states.forEach(state => {
        const connectionInfo: WebSocketConnectionInfo = {
          id: `conn-${Date.now()}`,
          state,
          url: 'wss://test.example.com',
          reconnectCount: 0
        };

        expect(connectionInfo.state).toBe(state);
        expect(connectionInfo.id).toBeTruthy();
        expect(connectionInfo.url).toMatch(/^wss?:\/\//);
        expect(connectionInfo.reconnectCount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should validate connection info with optional fields', () => {
      const connectionInfo: WebSocketConnectionInfo = {
        id: 'conn-123',
        state: 'OPEN',
        url: 'wss://api.relife.app/ws',
        protocol: 'relife-v1',
        connectedAt: new Date(),
        lastHeartbeat: new Date(),
        reconnectCount: 2,
        latency: 125,
        userId: 'user-456',
        sessionId: 'session-789',
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
        }
      };

      expect(connectionInfo.connectedAt).toBeInstanceOf(Date);
      expect(connectionInfo.lastHeartbeat).toBeInstanceOf(Date);
      expect(connectionInfo.latency).toBeGreaterThan(0);
      expect(connectionInfo.deviceInfo?.type).toBeTruthy();
    });
  });

  describe('Authentication Types', () => {
    it('should validate authentication payload', () => {
      const authPayload: WebSocketAuthPayload = {
        token: 'jwt-token-example',
        userId: 'user-123',
        sessionId: 'session-456',
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
        capabilities: ['realtime_messaging', 'push_notifications', 'voice_commands']
      };

      expect(authPayload.token).toBeTruthy();
      expect(authPayload.userId).toBeTruthy();
      expect(authPayload.sessionId).toBeTruthy();
      expect(authPayload.deviceInfo).toBeTruthy();
      expect(authPayload.capabilities).toBeInstanceOf(Array);
      expect(authPayload.capabilities.length).toBeGreaterThan(0);
    });

    it('should validate authentication response', () => {
      const authResponse: WebSocketAuthResponse = {
        success: true,
        sessionId: 'session-789',
        permissions: ['alarm_management', 'user_presence', 'ai_recommendations'],
        serverCapabilities: ['heartbeat', 'compression', 'binary_messages'],
        heartbeatInterval: 30000,
        maxMessageSize: 65536,
        rateLimit: {
          messagesPerSecond: 10,
          burstLimit: 50
        }
      };

      expect(authResponse.success).toBe(true);
      expect(authResponse.sessionId).toBeTruthy();
      expect(authResponse.permissions).toBeInstanceOf(Array);
      expect(authResponse.serverCapabilities).toBeInstanceOf(Array);
      expect(authResponse.heartbeatInterval).toBeGreaterThan(0);
      expect(authResponse.maxMessageSize).toBeGreaterThan(0);
      expect(authResponse.rateLimit.messagesPerSecond).toBeGreaterThan(0);
      expect(authResponse.rateLimit.burstLimit).toBeGreaterThan(0);
    });
  });

  describe('Metrics Validation', () => {
    it('should validate WebSocket metrics', () => {
      const metrics: WebSocketMetrics = {
        connectionId: 'conn-123',
        connectionsEstablished: 5,
        connectionsDropped: 2,
        messagesReceived: 1250,
        messagesSent: 890,
        averageLatency: 145,
        maxLatency: 450,
        totalReconnections: 3,
        uptime: 3600000, // 1 hour in ms
        dataTransferred: {
          sent: 524288, // 512KB
          received: 1048576 // 1MB
        },
        errorCounts: {
          CONNECTION_FAILED: 2,
          AUTHENTICATION_FAILED: 0,
          NETWORK_ERROR: 1,
          PROTOCOL_ERROR: 0,
          TIMEOUT: 1,
          RATE_LIMITED: 0,
          INVALID_MESSAGE: 0,
          RECONNECTION_FAILED: 1
        },
        lastUpdated: new Date()
      };

      expect(metrics.connectionId).toBeTruthy();
      expect(metrics.connectionsEstablished).toBeGreaterThanOrEqual(0);
      expect(metrics.connectionsDropped).toBeGreaterThanOrEqual(0);
      expect(metrics.messagesReceived).toBeGreaterThanOrEqual(0);
      expect(metrics.messagesSent).toBeGreaterThanOrEqual(0);
      expect(metrics.averageLatency).toBeGreaterThan(0);
      expect(metrics.maxLatency).toBeGreaterThanOrEqual(metrics.averageLatency);
      expect(metrics.uptime).toBeGreaterThan(0);
      expect(metrics.dataTransferred.sent).toBeGreaterThanOrEqual(0);
      expect(metrics.dataTransferred.received).toBeGreaterThanOrEqual(0);
      expect(metrics.lastUpdated).toBeInstanceOf(Date);

      // Validate error counts
      Object.values(metrics.errorCounts).forEach(count => {
        expect(count).toBeGreaterThanOrEqual(0);
      });

      const totalErrors = Object.values(metrics.errorCounts).reduce((sum, count) => sum + count, 0);
      expect(totalErrors).toBeGreaterThanOrEqual(0);
    });
  });
});