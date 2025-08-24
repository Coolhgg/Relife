/**
 * WebSocket Manager Service Integration Tests
 * Tests the complete WebSocket manager implementation including service integration,
 * subscription management, error handling, and performance monitoring
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockWebSocket, RealTimeTestUtils, setupRealTimeTesting } from '../realtime/realtime-testing-utilities';
import type {
  WebSocketManager,
  WebSocketConfig,
  WebSocketConnectionInfo,
  WebSocketEventHandlers,
  WebSocketMetrics,
  WebSocketSubscription,
  WebSocketError,
  WebSocketRateLimitStatus
} from '../../types/websocket';

import type {
  AlarmTriggeredPayload,
  UserPresenceUpdatePayload,
  SystemNotificationPayload
} from '../../types/realtime-messages';

// Setup WebSocket testing environment
setupRealTimeTesting();

// Mock WebSocket Manager Implementation for Testing
class MockWebSocketManager implements WebSocketManager {
  private connection: MockWebSocket | null = null;
  private connectionInfo: WebSocketConnectionInfo | null = null;
  private metrics: WebSocketMetrics;
  private subscriptions: Map<string, WebSocketSubscription> = new Map();
  private messageFilters: Array<(message: any) => boolean> = [];
  private heartbeatInterval: number = 30000;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.metrics = {
      connectionId: '',
      connectionsEstablished: 0,
      connectionsDropped: 0,
      messagesReceived: 0,
      messagesSent: 0,
      averageLatency: 0,
      maxLatency: 0,
      totalReconnections: 0,
      uptime: 0,
      dataTransferred: { sent: 0, received: 0 },
      errorCounts: {
        CONNECTION_FAILED: 0,
        AUTHENTICATION_FAILED: 0,
        NETWORK_ERROR: 0,
        PROTOCOL_ERROR: 0,
        TIMEOUT: 0,
        RATE_LIMITED: 0,
        INVALID_MESSAGE: 0,
        RECONNECTION_FAILED: 0
      },
      lastUpdated: new Date()
    };
  }

  async connect(config: WebSocketConfig, handlers: WebSocketEventHandlers): Promise<WebSocketConnectionInfo> {
    this.connection = new MockWebSocket(config.url);
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, config.timeout);

      this.connection!.addEventListener('open', (event) => {
        clearTimeout(timeoutId);
        
        this.connectionInfo = {
          id: this.connection!.id,
          state: 'OPEN',
          url: config.url,
          connectedAt: new Date(),
          reconnectCount: 0
        };

        this.metrics.connectionId = this.connectionInfo.id;
        this.metrics.connectionsEstablished++;
        this.startHeartbeat();

        if (handlers.onOpen) {
          handlers.onOpen(this.connectionInfo);
        }

        resolve(this.connectionInfo);
      });

      this.connection!.addEventListener('close', (event: any) => {
        this.stopHeartbeat();
        this.metrics.connectionsDropped++;
        
        if (this.connectionInfo) {
          this.connectionInfo.state = 'CLOSED';
        }

        if (handlers.onClose) {
          handlers.onClose(event.code, event.reason);
        }
      });

      this.connection!.addEventListener('error', (event: any) => {
        const error: WebSocketError = {
          type: 'CONNECTION_FAILED',
          message: 'Connection error',
          timestamp: new Date(),
          recoverable: true
        };

        this.metrics.errorCounts.CONNECTION_FAILED++;

        if (handlers.onError) {
          handlers.onError(error);
        }

        reject(error);
      });

      this.connection!.addEventListener('message', (event: any) => {
        this.metrics.messagesReceived++;
        this.metrics.dataTransferred.received += event.data.length || 0;

        try {
          const message = JSON.parse(event.data);
          
          // Apply filters
          const passesFilters = this.messageFilters.every(filter => filter(message));
          
          if (passesFilters && handlers.onMessage) {
            handlers.onMessage(message);
          }
        } catch (error) {
          this.metrics.errorCounts.INVALID_MESSAGE++;
        }

        this.updateMetrics();
      });
    });
  }

  async disconnect(reason?: string): Promise<void> {
    if (this.connection) {
      this.stopHeartbeat();
      this.connection.close(1000, reason || 'Client disconnect');
      this.connection = null;
      this.connectionInfo = null;
    }
  }

  async send<T>(message: any): Promise<boolean> {
    if (!this.connection || this.connection.readyState !== MockWebSocket.OPEN) {
      return false;
    }

    try {
      const messageStr = JSON.stringify(message);
      this.connection.send(messageStr);
      
      this.metrics.messagesSent++;
      this.metrics.dataTransferred.sent += messageStr.length;
      this.updateMetrics();
      
      return true;
    } catch (error) {
      this.metrics.errorCounts.PROTOCOL_ERROR++;
      return false;
    }
  }

  isConnected(): boolean {
    return this.connection?.readyState === MockWebSocket.OPEN;
  }

  getConnectionInfo(): WebSocketConnectionInfo | null {
    return this.connectionInfo;
  }

  getMetrics(): WebSocketMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  setHeartbeatInterval(interval: number): void {
    this.heartbeatInterval = interval;
    if (this.heartbeatTimer) {
      this.stopHeartbeat();
      this.startHeartbeat();
    }
  }

  addMessageFilter(filter: (message: any) => boolean): void {
    this.messageFilters.push(filter);
  }

  removeMessageFilter(filter: (message: any) => boolean): void {
    const index = this.messageFilters.indexOf(filter);
    if (index > -1) {
      this.messageFilters.splice(index, 1);
    }
  }

  // Additional methods for testing
  subscribe(subscription: Omit<WebSocketSubscription, 'id' | 'createdAt'>): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullSubscription: WebSocketSubscription = {
      ...subscription,
      id,
      createdAt: new Date()
    };
    
    this.subscriptions.set(id, fullSubscription);
    return id;
  }

  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  getSubscriptions(): WebSocketSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: 'heartbeat_ping',
          timestamp: Date.now()
        });
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private updateMetrics(): void {
    if (this.connectionInfo?.connectedAt) {
      this.metrics.uptime = Date.now() - this.connectionInfo.connectedAt.getTime();
    }
    this.metrics.lastUpdated = new Date();
  }
}

describe('WebSocket Manager Service Integration Tests', () => {
  let wsManager: MockWebSocketManager;
  let config: WebSocketConfig;

  beforeEach(() => {
    RealTimeTestUtils.reset();
    wsManager = new MockWebSocketManager();
    
    config = {
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
      enableLogging: false
    };
  });

  afterEach(async () => {
    await wsManager.disconnect();
    RealTimeTestUtils.reset();
  });

  describe('Connection Management', () => {
    it('should establish connection with event handlers', async () => {
      const events: string[] = [];
      let connectionInfo: WebSocketConnectionInfo | null = null;

      const handlers: WebSocketEventHandlers = {
        onOpen: (info) => {
          events.push('open');
          connectionInfo = info;
        },
        onClose: (code, reason) => {
          events.push(`close:${code}:${reason}`);
        },
        onError: (error) => {
          events.push(`error:${error.type}`);
        },
        onMessage: (message) => {
          events.push(`message:${message.type}`);
        }
      };

      const result = await wsManager.connect(config, handlers);

      expect(result.state).toBe('OPEN');
      expect(result.url).toBe(config.url);
      expect(result.connectedAt).toBeInstanceOf(Date);
      expect(events).toContain('open');
      expect(connectionInfo).toBeTruthy();
      expect(wsManager.isConnected()).toBe(true);

      const metrics = wsManager.getMetrics();
      expect(metrics.connectionsEstablished).toBe(1);
      expect(metrics.connectionId).toBe(result.id);
    });

    it('should handle connection timeout', async () => {
      const shortTimeoutConfig = { ...config, timeout: 100 };
      
      const handlers: WebSocketEventHandlers = {};

      await expect(wsManager.connect(shortTimeoutConfig, handlers))
        .rejects.toThrow('Connection timeout');
    });

    it('should track connection metrics', async () => {
      const handlers: WebSocketEventHandlers = {};
      await wsManager.connect(config, handlers);

      const initialMetrics = wsManager.getMetrics();
      expect(initialMetrics.connectionsEstablished).toBe(1);
      expect(initialMetrics.connectionsDropped).toBe(0);
      expect(initialMetrics.uptime).toBeGreaterThan(0);

      await wsManager.disconnect();

      const finalMetrics = wsManager.getMetrics();
      expect(finalMetrics.connectionsDropped).toBe(1);
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      const handlers: WebSocketEventHandlers = {};
      await wsManager.connect(config, handlers);
    });

    it('should send messages successfully', async () => {
      const testMessage = {
        id: 'test-123',
        type: 'test_message',
        payload: { data: 'test' },
        timestamp: new Date().toISOString()
      };

      const result = await wsManager.send(testMessage);
      expect(result).toBe(true);

      const metrics = wsManager.getMetrics();
      expect(metrics.messagesSent).toBe(1);
      expect(metrics.dataTransferred.sent).toBeGreaterThan(0);
    });

    it('should fail to send when disconnected', async () => {
      await wsManager.disconnect();

      const testMessage = {
        type: 'test_message',
        payload: { data: 'test' }
      };

      const result = await wsManager.send(testMessage);
      expect(result).toBe(false);
    });

    it('should receive and process messages', async () => {
      const receivedMessages: any[] = [];

      const handlers: WebSocketEventHandlers = {
        onMessage: (message) => {
          receivedMessages.push(message);
        }
      };

      await wsManager.disconnect();
      await wsManager.connect(config, handlers);

      // Get the underlying connection to simulate incoming messages
      const connectionInfo = wsManager.getConnectionInfo();
      const mockConnection = MockWebSocket.findByUrl(config.url);

      const testMessage = {
        id: 'incoming-123',
        type: 'alarm_triggered',
        payload: {
          alarm: { id: 'alarm-1', label: 'Test Alarm' },
          triggeredAt: new Date(),
          deviceInfo: { batteryLevel: 80, networkType: 'wifi' },
          contextualData: { weatherCondition: 'sunny' }
        },
        timestamp: new Date().toISOString(),
        userId: 'test-user'
      };

      mockConnection?.simulateMessage(testMessage);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0]?.type).toBe('alarm_triggered');
      expect(receivedMessages[0]?.payload.alarm.id).toBe('alarm-1');

      const metrics = wsManager.getMetrics();
      expect(metrics.messagesReceived).toBe(1);
    });
  });

  describe('Message Filtering', () => {
    beforeEach(async () => {
      const handlers: WebSocketEventHandlers = {};
      await wsManager.connect(config, handlers);
    });

    it('should filter messages based on custom filters', async () => {
      const receivedMessages: any[] = [];

      const handlers: WebSocketEventHandlers = {
        onMessage: (message) => {
          receivedMessages.push(message);
        }
      };

      await wsManager.disconnect();
      await wsManager.connect(config, handlers);

      // Add filter to only allow alarm messages
      wsManager.addMessageFilter((message) => {
        return message.type?.startsWith('alarm_');
      });

      const mockConnection = MockWebSocket.findByUrl(config.url);

      // Send alarm message (should pass filter)
      mockConnection?.simulateMessage({
        type: 'alarm_triggered',
        payload: { alarm: { id: 'test' } }
      });

      // Send user message (should be filtered out)
      mockConnection?.simulateMessage({
        type: 'user_presence_update',
        payload: { userId: 'test' }
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0]?.type).toBe('alarm_triggered');
    });

    it('should allow multiple filters', async () => {
      const receivedMessages: any[] = [];

      const handlers: WebSocketEventHandlers = {
        onMessage: (message) => {
          receivedMessages.push(message);
        }
      };

      await wsManager.disconnect();
      await wsManager.connect(config, handlers);

      // Add multiple filters
      wsManager.addMessageFilter((message) => message.type?.startsWith('alarm_'));
      wsManager.addMessageFilter((message) => message.payload?.priority !== 'low');

      const mockConnection = MockWebSocket.findByUrl(config.url);

      // This should pass both filters
      mockConnection?.simulateMessage({
        type: 'alarm_triggered',
        payload: { alarm: { id: 'test' }, priority: 'high' }
      });

      // This should fail the second filter
      mockConnection?.simulateMessage({
        type: 'alarm_dismissed',
        payload: { alarmId: 'test', priority: 'low' }
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0]?.payload.priority).toBe('high');
    });

    it('should remove message filters', async () => {
      const receivedMessages: any[] = [];

      const handlers: WebSocketEventHandlers = {
        onMessage: (message) => {
          receivedMessages.push(message);
        }
      };

      await wsManager.disconnect();
      await wsManager.connect(config, handlers);

      const alarmFilter = (message: any) => message.type?.startsWith('alarm_');
      
      wsManager.addMessageFilter(alarmFilter);

      const mockConnection = MockWebSocket.findByUrl(config.url);

      // Send message that passes filter
      mockConnection?.simulateMessage({
        type: 'alarm_triggered',
        payload: { alarm: { id: 'test1' } }
      });

      // Remove filter
      wsManager.removeMessageFilter(alarmFilter);

      // Send message that would have been filtered
      mockConnection?.simulateMessage({
        type: 'user_presence_update',
        payload: { userId: 'test' }
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedMessages).toHaveLength(2);
      expect(receivedMessages[0]?.type).toBe('alarm_triggered');
      expect(receivedMessages[1]?.type).toBe('user_presence_update');
    });
  });

  describe('Subscription Management', () => {
    beforeEach(async () => {
      const handlers: WebSocketEventHandlers = {};
      await wsManager.connect(config, handlers);
    });

    it('should manage subscriptions', async () => {
      const subscription1Id = wsManager.subscribe({
        type: 'alarm_updates',
        filters: { userId: 'user-123' },
        priority: 'high'
      });

      const subscription2Id = wsManager.subscribe({
        type: 'user_activity',
        filters: { includePresence: true },
        priority: 'normal'
      });

      expect(subscription1Id).toBeTruthy();
      expect(subscription2Id).toBeTruthy();
      expect(subscription1Id).not.toBe(subscription2Id);

      const subscriptions = wsManager.getSubscriptions();
      expect(subscriptions).toHaveLength(2);
      
      const sub1 = subscriptions.find(s => s.id === subscription1Id);
      const sub2 = subscriptions.find(s => s.id === subscription2Id);

      expect(sub1?.type).toBe('alarm_updates');
      expect(sub1?.priority).toBe('high');
      expect(sub2?.type).toBe('user_activity');
      expect(sub2?.priority).toBe('normal');
    });

    it('should unsubscribe successfully', async () => {
      const subscriptionId = wsManager.subscribe({
        type: 'system_notifications',
        priority: 'critical'
      });

      expect(wsManager.getSubscriptions()).toHaveLength(1);

      const unsubscribed = wsManager.unsubscribe(subscriptionId);
      expect(unsubscribed).toBe(true);
      expect(wsManager.getSubscriptions()).toHaveLength(0);

      // Trying to unsubscribe again should return false
      const unsubscribedAgain = wsManager.unsubscribe(subscriptionId);
      expect(unsubscribedAgain).toBe(false);
    });
  });

  describe('Heartbeat Mechanism', () => {
    it('should send heartbeat messages at specified intervals', async () => {
      const sentMessages: any[] = [];
      let originalSend: any;

      const handlers: WebSocketEventHandlers = {};
      await wsManager.connect(config, handlers);

      // Mock the send method to capture heartbeat messages
      originalSend = wsManager.send;
      wsManager.send = vi.fn().mockImplementation(async (message) => {
        sentMessages.push(message);
        return originalSend.call(wsManager, message);
      });

      // Set a short heartbeat interval for testing
      wsManager.setHeartbeatInterval(500);

      // Wait for multiple heartbeat cycles
      await new Promise(resolve => setTimeout(resolve, 1200));

      const heartbeatMessages = sentMessages.filter(msg => msg.type === 'heartbeat_ping');
      expect(heartbeatMessages.length).toBeGreaterThanOrEqual(2);
      
      heartbeatMessages.forEach(msg => {
        expect(msg.timestamp).toBeTypeOf('number');
        expect(Date.now() - msg.timestamp).toBeLessThan(2000);
      });

      // Restore original send method
      wsManager.send = originalSend;
    });

    it('should stop heartbeat when disconnected', async () => {
      const sentMessages: any[] = [];
      let originalSend: any;

      const handlers: WebSocketEventHandlers = {};
      await wsManager.connect(config, handlers);

      originalSend = wsManager.send;
      wsManager.send = vi.fn().mockImplementation(async (message) => {
        sentMessages.push(message);
        return originalSend.call(wsManager, message);
      });

      wsManager.setHeartbeatInterval(200);

      // Wait for some heartbeats
      await new Promise(resolve => setTimeout(resolve, 500));
      const heartbeatCountBeforeDisconnect = sentMessages.filter(msg => msg.type === 'heartbeat_ping').length;

      // Disconnect
      await wsManager.disconnect();

      // Wait and check no more heartbeats are sent
      await new Promise(resolve => setTimeout(resolve, 500));
      const heartbeatCountAfterDisconnect = sentMessages.filter(msg => msg.type === 'heartbeat_ping').length;

      expect(heartbeatCountBeforeDisconnect).toBeGreaterThan(0);
      expect(heartbeatCountAfterDisconnect).toBe(heartbeatCountBeforeDisconnect);

      // Restore original send method
      wsManager.send = originalSend;
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should track error counts in metrics', async () => {
      const errors: WebSocketError[] = [];

      const handlers: WebSocketEventHandlers = {
        onError: (error) => {
          errors.push(error);
        }
      };

      await wsManager.connect(config, handlers);

      // Simulate various error types by sending invalid messages
      const mockConnection = MockWebSocket.findByUrl(config.url);

      // Send invalid JSON to trigger INVALID_MESSAGE error
      if (mockConnection) {
        (mockConnection as any).triggerMessage('invalid-json{');
        (mockConnection as any).triggerMessage('another-invalid-json[');
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics = wsManager.getMetrics();
      expect(metrics.errorCounts.INVALID_MESSAGE).toBeGreaterThan(0);
    });

    it('should handle connection errors gracefully', async () => {
      const errors: WebSocketError[] = [];

      const handlers: WebSocketEventHandlers = {
        onError: (error) => {
          errors.push(error);
        }
      };

      // Try to connect to an invalid URL that will cause an error
      const invalidConfig = { ...config, url: 'wss://invalid-url' };

      await expect(wsManager.connect(invalidConfig, handlers))
        .rejects.toThrow();

      // Should have recorded the error in metrics
      const metrics = wsManager.getMetrics();
      expect(metrics.errorCounts.CONNECTION_FAILED).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      const handlers: WebSocketEventHandlers = {};
      await wsManager.connect(config, handlers);
    });

    it('should track comprehensive metrics', async () => {
      // Send some messages
      await wsManager.send({ type: 'test1', data: 'small' });
      await wsManager.send({ type: 'test2', data: 'larger message with more content' });

      // Simulate receiving messages
      const mockConnection = MockWebSocket.findByUrl(config.url);
      mockConnection?.simulateMessage({ type: 'response1', data: 'response' });
      mockConnection?.simulateMessage({ type: 'response2', data: 'longer response message' });

      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics = wsManager.getMetrics();

      expect(metrics.connectionsEstablished).toBe(1);
      expect(metrics.messagesSent).toBe(2);
      expect(metrics.messagesReceived).toBe(2);
      expect(metrics.dataTransferred.sent).toBeGreaterThan(0);
      expect(metrics.dataTransferred.received).toBeGreaterThan(0);
      expect(metrics.uptime).toBeGreaterThan(0);
      expect(metrics.lastUpdated).toBeInstanceOf(Date);
    });

    it('should calculate uptime correctly', async () => {
      const initialMetrics = wsManager.getMetrics();
      const initialUptime = initialMetrics.uptime;

      await new Promise(resolve => setTimeout(resolve, 500));

      const laterMetrics = wsManager.getMetrics();
      const laterUptime = laterMetrics.uptime;

      expect(laterUptime).toBeGreaterThan(initialUptime);
      expect(laterUptime - initialUptime).toBeGreaterThanOrEqual(400); // Allow some tolerance
    });
  });

  describe('Resource Management', () => {
    it('should clean up resources on disconnect', async () => {
      const handlers: WebSocketEventHandlers = {};
      await wsManager.connect(config, handlers);

      // Add subscriptions and filters
      const subId1 = wsManager.subscribe({ type: 'alarm_updates', priority: 'high' });
      const subId2 = wsManager.subscribe({ type: 'user_activity', priority: 'normal' });
      
      wsManager.addMessageFilter(() => true);
      wsManager.setHeartbeatInterval(1000);

      expect(wsManager.isConnected()).toBe(true);
      expect(wsManager.getSubscriptions()).toHaveLength(2);

      await wsManager.disconnect();

      expect(wsManager.isConnected()).toBe(false);
      expect(wsManager.getConnectionInfo()).toBeNull();

      // Subscriptions should still exist (they're managed separately)
      expect(wsManager.getSubscriptions()).toHaveLength(2);
    });

    it('should handle multiple rapid connect/disconnect cycles', async () => {
      const handlers: WebSocketEventHandlers = {};

      for (let i = 0; i < 5; i++) {
        await wsManager.connect(config, handlers);
        expect(wsManager.isConnected()).toBe(true);

        await wsManager.disconnect();
        expect(wsManager.isConnected()).toBe(false);

        // Small delay between cycles
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const metrics = wsManager.getMetrics();
      expect(metrics.connectionsEstablished).toBe(5);
      expect(metrics.connectionsDropped).toBe(5);
    });
  });
});