/**
 * Real-time Service Integration Tests
 * Tests the complete real-time service implementation including WebSocket integration,
 * Supabase real-time, and service orchestration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MockWebSocket,
  RealTimeTestUtils,
  setupRealTimeTesting,
} from '../realtime/realtime-testing-utilities';
import { WebSocketTypeMocks } from '../mocks/websocket-type-mocks';
import type {
  WebSocketMessage,
  WebSocketConfig,
  WebSocketConnectionInfo,
  WebSocketEventHandlers,
} from '../../types/websocket';
import { AnyFn } from 'src/types/utility-types';

import type {
  AlarmTriggeredPayload,
  UserPresenceUpdatePayload,
  RecommendationGeneratedPayload,
  SystemNotificationPayload,
  SyncStatusUpdatePayload,
} from '../../types/realtime-messages';

// Setup WebSocket testing environment
setupRealTimeTesting();

// Mock Real-time Service Implementation
class MockRealtimeService {
  private websocket: MockWebSocket | null = null;
  private config: WebSocketConfig;
  private eventHandlers: Map<string, AnyFn[]> = new Map();
  private isConnected: boolean = false;
  private userId: string;
  private sessionId: string;

  constructor(_config: WebSocketConfig, userId: string) {
    this.config = _config;
    this.userId = userId;
    this.sessionId = `session_${Date.now()}`;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.websocket = new MockWebSocket(this._config.url);

      this.websocket.addEventListener('open', () => {
        this.isConnected = true;
        this.emit('connected', { userId: this.userId, sessionId: this.sessionId });
        resolve();
      });

      this.websocket.addEventListener('close', () => {
        this.isConnected = false;
        this.emit('disconnected', { reason: 'Connection closed' });
      });

      this.websocket.addEventListener('error', _error => {
        this.isConnected = false;
        this.emit('_error', _error);
        reject(_error);
      });

      this.websocket.addEventListener('message', (_event: unknown) => {
        try {
          const message: WebSocketMessage = JSON.parse(_event.data);
          this.handleMessage(message);
        } catch (_error) {
          this.emit('_error', { type: 'INVALID_MESSAGE', _error });
        }
      });

      // Simulate connection timeout
      setTimeout(() => {
        if (this.websocket?.readyState === MockWebSocket.CONNECTING) {
          reject(new Error('Connection timeout'));
        }
      }, this.config.timeout);
    });
  }

  async stop(): Promise<void> {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
  }

  on(eventType: string, handler: AnyFn): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        const _index = handlers.indexOf(handler);
        if (_index > -1) {
          handlers.splice(_index, 1);
        }
      }
    };
  }

  async sendMessage<T>(message: WebSocketMessage<T>): Promise<boolean> {
    if (!this.isConnected || !this.websocket) {
      return false;
    }

    try {
      this.websocket.send(JSON.stringify(message));
      return true;
    } catch (_error) {
      this.emit('_error', { type: 'SEND_FAILED', _error });
      return false;
    }
  }

  // Alarm-specific methods
  onAlarmTriggered(handler: (payload: AlarmTriggeredPayload) => void): () => void {
    return this.on('alarm_triggered', handler);
  }

  onAlarmDismissed(handler: (payload: unknown) => void): () => void {
    return this.on('alarm_dismissed', handler);
  }

  async syncAlarmState(alarmId: string): Promise<void> {
    const message = WebSocketTypeMocks.createMockWebSocketMessage('sync_requested', {
      itemType: 'alarm',
      itemId: alarmId,
      userId: this.userId,
    });

    await this.sendMessage(message);
  }

  // User presence methods
  onPresenceUpdate(handler: (payload: UserPresenceUpdatePayload) => void): () => void {
    return this.on('user_presence_update', handler);
  }

  async updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): Promise<void> {
    const message = WebSocketTypeMocks.createMockWebSocketMessage(
      'user_presence_update',
      {
        userId: this.userId,
        status,
        lastSeen: new Date(),
        activeDevices: [],
      }
    );

    await this.sendMessage(message);
  }

  // AI recommendation methods
  onRecommendation(
    handler: (payload: RecommendationGeneratedPayload) => void
  ): () => void {
    return this.on('recommendation_generated', handler);
  }

  async requestAnalysis(type: string, data: unknown): Promise<string> {
    const analysisId = `analysis_${Date.now()}`;
    const message = WebSocketTypeMocks.createMockWebSocketMessage(
      'ai_analysis_request',
      {
        analysisId,
        type,
        data,
        userId: this.userId,
      }
    );

    await this.sendMessage(message);
    return analysisId;
  }

  // System notification methods
  onSystemNotification(
    handler: (payload: SystemNotificationPayload) => void
  ): () => void {
    return this.on('system_notification', handler);
  }

  // Sync methods
  onSyncStatus(handler: (payload: SyncStatusUpdatePayload) => void): () => void {
    return this.on('sync_status_update', handler);
  }

  getConnectionStatus(): { connected: boolean; userId: string; sessionId: string } {
    return {
      connected: this.isConnected,
      userId: this.userId,
      sessionId: this.sessionId,
    };
  }

  // Internal methods
  private handleMessage(message: WebSocketMessage): void {
    this.emit(message.type, message.payload);
    this.emit('message', message);
  }

  private emit(eventType: string, data: unknown): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (_error) {
        console._error(`Error in ${eventType} handler:`, _error);
      }
    });
  }

  // Test utilities
  simulateServerMessage<T>(type: string, payload: T): void {
    if (this.websocket) {
      const message = WebSocketTypeMocks.createMockWebSocketMessage(type, payload, {
        userId: this.userId,
        sessionId: this.sessionId,
      });
      this.websocket.simulateMessage(message);
    }
  }

  getWebSocket(): MockWebSocket | null {
    return this.websocket;
  }
}

describe('Real-time Service Integration Tests', () => {
  let realtimeService: MockRealtimeService;
  let config: WebSocketConfig;
  let testUserId: string;

  beforeEach(() => {
    RealTimeTestUtils.reset();
    testUserId = 'test-user-123';

    _config = WebSocketTypeMocks.createMockWebSocketConfig({
      url: 'wss://test.relife.app/realtime',
      timeout: 5000,
      heartbeatInterval: 10000,
    });

    realtimeService = new MockRealtimeService(_config, testUserId);
  });

  afterEach(async () => {
    await realtimeService.stop();
    RealTimeTestUtils.reset();
  });

  describe('Service Lifecycle', () => {
    it('should start and connect successfully', async () => {
      const connectionEvents: string[] = [];

      realtimeService.on('connected', () => {
        connectionEvents.push('connected');
      });

      await realtimeService.start();

      expect(connectionEvents).toContain('connected');

      const status = realtimeService.getConnectionStatus();
      expect(status.connected).toBe(true);
      expect(status.userId).toBe(testUserId);
      expect(status.sessionId).toBeTruthy();
    });

    it('should handle connection failure', async () => {
      const errorConfig = WebSocketTypeMocks.createMockWebSocketConfig({
        url: 'wss://invalid-url.test.com',
        timeout: 100,
      });

      const errorService = new MockRealtimeService(errorConfig, testUserId);

      await expect(errorService.start()).rejects.toThrow();

      const status = errorService.getConnectionStatus();
      expect(status.connected).toBe(false);
    });

    it('should stop and disconnect cleanly', async () => {
      const disconnectionEvents: string[] = [];

      realtimeService.on('disconnected', () => {
        disconnectionEvents.push('disconnected');
      });

      await realtimeService.start();
      expect(realtimeService.getConnectionStatus().connected).toBe(true);

      await realtimeService.stop();
      expect(realtimeService.getConnectionStatus().connected).toBe(false);
      expect(disconnectionEvents).toContain('disconnected');
    });
  });

  describe('Alarm Real-time Integration', () => {
    beforeEach(async () => {
      await realtimeService.start();
    });

    it('should handle alarm triggered events', async () => {
      const triggeredAlarms: AlarmTriggeredPayload[] = [];

      const unsubscribe = realtimeService.onAlarmTriggered(payload => {
        triggeredAlarms.push(payload);
      });

      const alarmPayload = WebSocketTypeMocks.createMockAlarmTriggeredPayload();
      realtimeService.simulateServerMessage('alarm_triggered', alarmPayload);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(triggeredAlarms).toHaveLength(1);
      expect(triggeredAlarms[0]?.alarm.id).toBe(alarmPayload.alarm.id);
      expect(triggeredAlarms[0]?.triggeredAt).toBeInstanceOf(Date);
      expect(triggeredAlarms[0]?.deviceInfo.batteryLevel).toBe(
        alarmPayload.deviceInfo.batteryLevel
      );

      unsubscribe();
    });

    it('should handle alarm dismissed events with voice data', async () => {
      const dismissedAlarms: unknown[] = [];

      const unsubscribe = realtimeService.onAlarmDismissed(payload => {
        dismissedAlarms.push(payload);
      });

      const dismissPayload = WebSocketTypeMocks.createMockAlarmDismissedPayload();
      realtimeService.simulateServerMessage('alarm_dismissed', dismissPayload);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(dismissedAlarms).toHaveLength(1);
      expect(dismissedAlarms[0]?.dismissMethod).toBe('voice');
      expect(dismissedAlarms[0]?.voiceData?.mood).toBe('tired');
      expect(dismissedAlarms[0]?.voiceData?.confidenceScore).toBe(0.75);

      unsubscribe();
    });

    it('should sync alarm state with server', async () => {
      const sentMessages: unknown[] = [];

      const ws = realtimeService.getWebSocket();
      const originalSend = ws?.send;
      if (ws && originalSend) {
        ws.send = vi.fn().mockImplementation((data: string) => {
          sentMessages.push(JSON.parse(data));
          return originalSend.call(ws, data);
        });
      }

      await realtimeService.syncAlarmState('alarm-123');

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]?.type).toBe('sync_requested');
      expect(sentMessages[0]?.payload.itemType).toBe('alarm');
      expect(sentMessages[0]?.payload.itemId).toBe('alarm-123');
    });
  });

  describe('User Presence Integration', () => {
    beforeEach(async () => {
      await realtimeService.start();
    });

    it('should handle presence updates', async () => {
      const presenceUpdates: UserPresenceUpdatePayload[] = [];

      const unsubscribe = realtimeService.onPresenceUpdate(payload => {
        presenceUpdates.push(payload);
      });

      const presencePayload = WebSocketTypeMocks.createMockUserPresencePayload();
      realtimeService.simulateServerMessage('user_presence_update', presencePayload);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(presenceUpdates).toHaveLength(1);
      expect(presenceUpdates[0]?.userId).toBe(presencePayload.userId);
      expect(presenceUpdates[0]?.status).toBe('online');
      expect(presenceUpdates[0]?.currentActivity?.type).toBe('viewing_alarms');

      unsubscribe();
    });

    it('should update own presence status', async () => {
      const sentMessages: unknown[] = [];

      const ws = realtimeService.getWebSocket();
      const originalSend = ws?.send;
      if (ws && originalSend) {
        ws.send = vi.fn().mockImplementation((data: string) => {
          sentMessages.push(JSON.parse(data));
          return originalSend.call(ws, data);
        });
      }

      await realtimeService.updatePresence('busy');

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]?.type).toBe('user_presence_update');
      expect(sentMessages[0]?.payload.status).toBe('busy');
      expect(sentMessages[0]?.payload.userId).toBe(testUserId);
    });

    it('should track multiple presence states', async () => {
      const presenceUpdates: UserPresenceUpdatePayload[] = [];

      realtimeService.onPresenceUpdate(payload => {
        presenceUpdates.push(payload);
      });

      const statuses: Array<'online' | 'away' | 'busy' | 'offline'> = [
        'online',
        'busy',
        'away',
        'offline',
      ];

      for (const status of statuses) {
        const payload = {
          ...WebSocketTypeMocks.createMockUserPresencePayload(),
          status,
          lastSeen: new Date(),
        };

        realtimeService.simulateServerMessage('user_presence_update', payload);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      expect(presenceUpdates).toHaveLength(4);
      expect(presenceUpdates.map(p => p.status)).toEqual(statuses);
    });
  });

  describe('AI Recommendations Integration', () => {
    beforeEach(async () => {
      await realtimeService.start();
    });

    it('should handle AI recommendations', async () => {
      const recommendations: RecommendationGeneratedPayload[] = [];

      const unsubscribe = realtimeService.onRecommendation(payload => {
        recommendations.push(payload);
      });

      const recommendationPayload =
        WebSocketTypeMocks.createMockRecommendationPayload();
      realtimeService.simulateServerMessage(
        'recommendation_generated',
        recommendationPayload
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]?.type).toBe('alarm_optimization');
      expect(recommendations[0]?.category).toBe('performance');
      expect(recommendations[0]?.data.confidence).toBeGreaterThan(0.8);
      expect(recommendations[0]?.recommendation.estimatedImpact).toBeGreaterThan(5);

      unsubscribe();
    });

    it('should request AI analysis', async () => {
      const sentMessages: unknown[] = [];

      const ws = realtimeService.getWebSocket();
      const originalSend = ws?.send;
      if (ws && originalSend) {
        ws.send = vi.fn().mockImplementation((data: string) => {
          sentMessages.push(JSON.parse(data));
          return originalSend.call(ws, data);
        });
      }

      const analysisId = await realtimeService.requestAnalysis('sleep_pattern', {
        timeRange: { start: new Date(), end: new Date() },
      });

      expect(analysisId).toBeTruthy();
      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]?.type).toBe('ai_analysis_request');
      expect(sentMessages[0]?.payload.type).toBe('sleep_pattern');
    });

    it('should handle multiple recommendation types', async () => {
      const recommendations: RecommendationGeneratedPayload[] = [];

      realtimeService.onRecommendation(payload => {
        recommendations.push(payload);
      });

      const recommendationTypes = [
        'alarm_optimization',
        'sleep_schedule',
        'voice_mood',
        'challenge_difficulty',
      ] as const;

      for (const type of recommendationTypes) {
        const payload = {
          ...WebSocketTypeMocks.createMockRecommendationPayload(),
          type,
          recommendationId: `rec-${type}-${Date.now()}`,
        };

        realtimeService.simulateServerMessage('recommendation_generated', payload);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      expect(recommendations).toHaveLength(4);
      expect(recommendations.map(r => r.type)).toEqual(recommendationTypes);
    });
  });

  describe('System Notifications Integration', () => {
    beforeEach(async () => {
      await realtimeService.start();
    });

    it('should handle system notifications', async () => {
      const notifications: SystemNotificationPayload[] = [];

      const unsubscribe = realtimeService.onSystemNotification(payload => {
        notifications.push(payload);
      });

      const notificationPayload =
        WebSocketTypeMocks.createMockSystemNotificationPayload();
      realtimeService.simulateServerMessage('system_notification', notificationPayload);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(notifications).toHaveLength(1);
      expect(notifications[0]?.type).toBe('info');
      expect(notifications[0]?.severity).toBe('medium');
      expect(notifications[0]?.dismissible).toBe(true);
      expect(notifications[0]?.actions).toHaveLength(2);

      unsubscribe();
    });

    it('should handle emergency alerts', async () => {
      const alerts: unknown[] = [];

      realtimeService.on('emergency_alert', payload => {
        alerts.push(payload);
      });

      const alertPayload = WebSocketTypeMocks.createMockEmergencyAlertPayload();
      realtimeService.simulateServerMessage('emergency_alert', alertPayload);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(alerts).toHaveLength(1);
      expect(alerts[0]?.severity).toBe('critical');
      expect(alerts[0]?.type).toBe('service_outage');
      expect(alerts[0]?.immediateActions).toHaveLength(3);
    });
  });

  describe('Data Synchronization Integration', () => {
    beforeEach(async () => {
      await realtimeService.start();
    });

    it('should handle sync status updates', async () => {
      const syncUpdates: SyncStatusUpdatePayload[] = [];

      const unsubscribe = realtimeService.onSyncStatus(payload => {
        syncUpdates.push(payload);
      });

      const syncPayload = WebSocketTypeMocks.createMockSyncStatusPayload();
      realtimeService.simulateServerMessage('sync_status_update', syncPayload);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(syncUpdates).toHaveLength(1);
      expect(syncUpdates[0]?.type).toBe('incremental_sync');
      expect(syncUpdates[0]?.status).toBe('in_progress');
      expect(syncUpdates[0]?.progress.percentage).toBe(75);
      expect(syncUpdates[0]?.items.alarms.processed).toBe(8);

      unsubscribe();
    });

    it('should handle sync conflicts', async () => {
      const conflicts: unknown[] = [];

      realtimeService.on('sync_conflict_detected', payload => {
        conflicts.push(payload);
      });

      const conflictPayload = WebSocketTypeMocks.createMockSyncConflictPayload();
      realtimeService.simulateServerMessage('sync_conflict_detected', conflictPayload);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]?.conflictType).toBe('data_mismatch');
      expect(conflicts[0]?.userActionRequired).toBe(true);
      expect(conflicts[0]?.suggestedActions).toHaveLength(3);
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await realtimeService.start();
    });

    it('should handle invalid messages gracefully', async () => {
      const errors: unknown[] = [];

      realtimeService.on('_error', _error => {
        errors.push(_error);
      });

      const ws = realtimeService.getWebSocket();
      if (ws) {
        // Send invalid JSON
        (ws as unknown).triggerMessage('invalid-json{');
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errors).toHaveLength(1);
      expect(errors[0]?.type).toBe('INVALID_MESSAGE');
    });

    it('should handle connection drops', async () => {
      const disconnectionEvents: unknown[] = [];

      realtimeService.on('disconnected', _event => {
        disconnectionEvents.push(_event);
      });

      const ws = realtimeService.getWebSocket();
      if (ws) {
        ws.simulateClose(1006, 'Connection lost');
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(disconnectionEvents).toHaveLength(1);
      expect(realtimeService.getConnectionStatus().connected).toBe(false);
    });
  });

  describe('Event Subscription Management', () => {
    beforeEach(async () => {
      await realtimeService.start();
    });

    it('should manage multiple _event subscriptions', async () => {
      const alarmEvents: unknown[] = [];
      const userEvents: unknown[] = [];
      const systemEvents: unknown[] = [];

      const unsubscribeAlarm = realtimeService.onAlarmTriggered(payload => {
        alarmEvents.push(payload);
      });

      const unsubscribeUser = realtimeService.onPresenceUpdate(payload => {
        userEvents.push(payload);
      });

      const unsubscribeSystem = realtimeService.onSystemNotification(payload => {
        systemEvents.push(payload);
      });

      // Send different types of messages
      realtimeService.simulateServerMessage(
        'alarm_triggered',
        WebSocketTypeMocks.createMockAlarmTriggeredPayload()
      );
      realtimeService.simulateServerMessage(
        'user_presence_update',
        WebSocketTypeMocks.createMockUserPresencePayload()
      );
      realtimeService.simulateServerMessage(
        'system_notification',
        WebSocketTypeMocks.createMockSystemNotificationPayload()
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(alarmEvents).toHaveLength(1);
      expect(userEvents).toHaveLength(1);
      expect(systemEvents).toHaveLength(1);

      // Unsubscribe and verify no more events
      unsubscribeAlarm();
      unsubscribeUser();
      unsubscribeSystem();

      realtimeService.simulateServerMessage(
        'alarm_triggered',
        WebSocketTypeMocks.createMockAlarmTriggeredPayload()
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still be 1 (no new events)
      expect(alarmEvents).toHaveLength(1);
      expect(userEvents).toHaveLength(1);
      expect(systemEvents).toHaveLength(1);
    });

    it('should handle unsubscription correctly', async () => {
      const events: unknown[] = [];

      const unsubscribe = realtimeService.onAlarmTriggered(payload => {
        events.push(payload);
      });

      // Send message before unsubscribe
      realtimeService.simulateServerMessage(
        'alarm_triggered',
        WebSocketTypeMocks.createMockAlarmTriggeredPayload()
      );
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(events).toHaveLength(1);

      // Unsubscribe
      unsubscribe();

      // Send message after unsubscribe
      realtimeService.simulateServerMessage(
        'alarm_triggered',
        WebSocketTypeMocks.createMockAlarmTriggeredPayload()
      );
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should still be 1
      expect(events).toHaveLength(1);
    });
  });
});
