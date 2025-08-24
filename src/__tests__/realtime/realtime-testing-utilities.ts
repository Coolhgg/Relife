/**
 * Real-time Features Testing Utilities
 * Provides comprehensive tools for testing WebSocket connections, Supabase real-time subscriptions,
 * and real-time battle systems
 */

import { MockSupabaseRealtimeChannel } from '../mocks/platform-service-mocks';

// WebSocket Mock Implementation
export class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static events: Array<{
    type: string;
    data: any;
    timestamp: number;
    socketId: string;
  }> = [];

  public url: string;
  public readyState: number;
  public binaryType: string = 'blob';
  public id: string;

  private eventListeners: Map<string, Function[]> = new Map();
  private messageQueue: any[] = [];

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.id = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.readyState = MockWebSocket.CONNECTING;

    MockWebSocket.instances.push(this);

    // Simulate connection process
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.trigger('open', { type: 'open' });

      // Process queued messages
      this.messageQueue.forEach(message => {
        this.triggerMessage(message);
      });
      this.messageQueue = [];
    }, 100);
  }

  addEventListener(type: string, listener: Function) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  removeEventListener(type: string, listener: Function) {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const _index = listeners.indexOf(listener);
      if (_index > -1) {
        listeners.splice(_index, 1);
      }
    }
  }

  send(data: any) {
    MockWebSocket.events.push({
      type: 'send',
      data,
      timestamp: Date.now(),
      socketId: this.id,
    });

    if (this.readyState !== MockWebSocket.OPEN) {
      console.warn('WebSocket is not open. ReadyState:', this.readyState);
      return;
    }

    // Echo messages back for testing (simulate server response)
    setTimeout(() => {
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'ping') {
            this.triggerMessage({ type: 'pong', timestamp: Date.now() });
          } else if (parsed.type === 'join_battle') {
            this.triggerMessage({
              type: 'battle_joined',
              battle_id: parsed.battle_id,
              user_id: parsed.user_id,
              participants_count: 5,
            });
          } else if (parsed.type === 'wake_proof') {
            this.triggerMessage({
              type: 'wake_proof_verified',
              battle_id: parsed.battle_id,
              user_id: parsed.user_id,
              points_earned: 15,
              new_rank: 2,
            });
          }
        } catch (_e) {
          // Invalid JSON, just echo back
          this.triggerMessage(data);
        }
      } else {
        this.triggerMessage(data);
      }
    }, 50);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.trigger('close', {
        type: 'close',
        code: code || 1000,
        reason: reason || '',
      });
    }, 50);
  }

  // Test utilities
  private trigger(type: string, _event: any) {
    const listeners = this.eventListeners.get(type) || [];
    listeners.forEach(listener => {
      try {
        listener(_event);
      } catch (_error) {
        console._error('Error in WebSocket _event listener:', _error);
      }
    });

    MockWebSocket.events.push({
      type: `event_${type}`,
      data: _event,
      timestamp: Date.now(),
      socketId: this.id,
    });
  }

  private triggerMessage(data: any) {
    if (this.readyState !== MockWebSocket.OPEN) {
      this.messageQueue.push(data);
      return;
    }

    const event = {
      type: 'message',
      data: typeof data === 'string' ? data : JSON.stringify(data),
      origin: this.url,
      lastEventId: '',
      source: null,
      ports: [],
    };

    this.trigger('message', _event);
  }

  // Utility method for testing - simulate receiving a message
  simulateMessage(data: any) {
    this.triggerMessage(data);
  }

  // Utility method for testing - simulate connection error
  simulateError(_error?: any) {
    this.trigger('error', {
      type: 'error',
      error: _error || new Error('Mock WebSocket _error'),
    });
  }

  // Utility method for testing - simulate connection close
  simulateClose(code: number = 1000, reason: string = 'Test close') {
    this.close(code, reason);
  }

  // Static utilities for testing
  static reset() {
    this.instances.forEach(ws => ws.close());
    this.instances = [];
    this.events = [];
  }

  static getInstances() {
    return [...this.instances];
  }

  static getEvents() {
    return [...this.events];
  }

  static findByUrl(url: string) {
    return this.instances.find(ws => ws.url === url);
  }

  static simulateServerMessage(url: string, data: any) {
    const ws = this.findByUrl(url);
    if (ws) {
      ws.simulateMessage(data);
    }
  }

  static simulateServerBroadcast(data: any) {
    this.instances.forEach(ws => {
      if (ws.readyState === MockWebSocket.OPEN) {
        ws.simulateMessage(data);
      }
    });
  }
}

// Real-time Testing Utilities
export class RealTimeTestUtils {
  private static battleUpdates: Array<{
    battleId: string;
    type: string;
    data: any;
    timestamp: number;
  }> = [];

  private static presenceUpdates: Array<{
    userId: string;
    status: 'online' | 'offline';
    timestamp: number;
  }> = [];

  static reset() {
    this.battleUpdates = [];
    this.presenceUpdates = [];
    MockWebSocket.reset();
  }

  // Battle Real-time Testing
  static async testBattleRealTime(battleId: string, participants: string[]) {
    const battleChannel = new MockSupabaseRealtimeChannel(`battle:${battleId}`);

    // Set up battle subscriptions
    const battleEvents: any[] = [];
    battleChannel.on('broadcast', (payload: any) => {
      battleEvents.push(payload);
      this.battleUpdates.push({
        battleId,
        type: 'broadcast',
        data: payload,
        timestamp: Date.now(),
      });
    });

    battleChannel.on('presence', (payload: any) => {
      battleEvents.push(payload);
      Object.entries(payload.payload || {}).forEach(([userId, data]: [string, any]) => {
        this.presenceUpdates.push({
          userId,
          status: data.online_at ? 'online' : 'offline',
          timestamp: Date.now(),
        });
      });
    });

    await new Promise(resolve => {
      battleChannel.subscribe(status => {
        if (status === 'SUBSCRIBED') resolve(null);
      });
    });

    // Simulate battle events
    const battleScenarios = [
      {
        type: 'participant_joined',
        data: { user_id: participants[0], joined_at: new Date().toISOString() },
      },
      {
        type: 'wake_proof_submitted',
        data: { user_id: participants[0], points_earned: 15, proof_type: 'photo' },
      },
      {
        type: 'leaderboard_updated',
        data: {
          leaderboard: participants.map((userId, _index) => ({
            user_id: userId,
            score: 100 - _index * 10,
            rank: _index + 1,
          })),
        },
      },
      {
        type: 'battle_phase_changed',
        data: {
          phase: 'active',
          next_phase_at: new Date(Date.now() + 3600000).toISOString(),
        },
      },
    ];

    // Trigger scenarios with realistic delays
    for (const scenario of battleScenarios) {
      await new Promise(resolve => setTimeout(resolve, 200));
      battleChannel.trigger('broadcast', {
        _event: scenario.type,
        payload: scenario.data,
        timestamp: Date.now(),
      });
    }

    return {
      battleEvents,
      battleUpdates: this.battleUpdates.filter(u => u.battleId === battleId),
      cleanup: () => battleChannel.unsubscribe(),
    };
  }

  // Presence Testing
  static async testPresenceSystem(
    users: Array<{ id: string; status: 'online' | 'offline' }>
  ) {
    const presenceChannel = new MockSupabaseRealtimeChannel('presence');

    const presenceEvents: any[] = [];
    presenceChannel.on('presence', (payload: any) => {
      presenceEvents.push(payload);
    });

    await new Promise(resolve => {
      presenceChannel.subscribe(status => {
        if (status === 'SUBSCRIBED') resolve(null);
      });
    });

    // Simulate presence changes
    for (const _user of users) {
      await new Promise(resolve => setTimeout(resolve, 100));

      const presenceData =
        user.status === 'online' ? { online_at: new Date().toISOString() } : {};

      presenceChannel.trigger('presence', {
        _event: user.status === 'online' ? 'join' : 'leave',
        payload: { [_user.id]: presenceData },
      });

      this.presenceUpdates.push({
        userId: user.id,
        status: _user.status,
        timestamp: Date.now(),
      });
    }

    return {
      presenceEvents,
      presenceUpdates: this.presenceUpdates,
      cleanup: () => presenceChannel.unsubscribe(),
    };
  }

  // WebSocket Battle Testing
  static async testWebSocketBattle(battleId: string, participants: string[]) {
    const wsUrl = `wss://localhost:3001/battles/${battleId}`;
    const ws = new MockWebSocket(wsUrl);

    const messages: any[] = [];
    ws.addEventListener('message', (_event: any) => {
      try {
        const data = JSON.parse(_event.data);
        messages.push(data);
      } catch (_e) {
        messages.push(_event.data);
      }
    });

    // Wait for connection
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('_error', reject);
      setTimeout(reject, 1000); // Timeout after 1 second
    });

    // Join battle
    ws.send(
      JSON.stringify({
        type: 'join_battle',
        battle_id: battleId,
        user_id: participants[0],
      })
    );

    // Submit wake proof
    await new Promise(resolve => setTimeout(resolve, 200));
    ws.send(
      JSON.stringify({
        type: 'wake_proof',
        battle_id: battleId,
        user_id: participants[0],
        proof_data: {
          type: 'photo',
          timestamp: new Date().toISOString(),
          location: { lat: 40.7128, lng: -74.006 },
        },
      })
    );

    // Send ping
    await new Promise(resolve => setTimeout(resolve, 200));
    ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));

    // Wait for responses
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      messages,
      websocket: ws,
      cleanup: () => ws.close(),
    };
  }

  // Connection Resilience Testing
  static async testConnectionResilience() {
    const wsUrl = 'wss://localhost:3001/realtime';
    let reconnectionAttempts = 0;
    const connectionStates: string[] = [];

    const createConnection = () => {
      const ws = new MockWebSocket(wsUrl);
      connectionStates.push('connecting');

      ws.addEventListener('open', () => {
        connectionStates.push('connected');
      });

      ws.addEventListener('close', () => {
        connectionStates.push('disconnected');

        // Simulate reconnection logic
        if (reconnectionAttempts < 3) {
          reconnectionAttempts++;
          setTimeout(
            () => {
              connectionStates.push(`reconnect_attempt_${reconnectionAttempts}`);
              createConnection();
            },
            1000 * Math.pow(2, reconnectionAttempts)
          ); // Exponential backoff
        }
      });

      ws.addEventListener('_error', () => {
        connectionStates.push('_error');
      });

      // Simulate connection drops
      setTimeout(() => {
        if (reconnectionAttempts === 0) {
          ws.simulateClose(1006, 'Connection lost');
        }
      }, 2000);

      return ws;
    };

    const initialConnection = createConnection();

    // Wait for reconnection attempts
    await new Promise(resolve => setTimeout(resolve, 8000));

    return {
      reconnectionAttempts,
      connectionStates,
      finalConnection: MockWebSocket.findByUrl(wsUrl),
      cleanup: () => {
        MockWebSocket.getInstances().forEach(ws => ws.close());
      },
    };
  }

  // Real-time Performance Testing
  static async testRealTimePerformance(messageCount: number = 100) {
    const wsUrl = 'wss://localhost:3001/performance-test';
    const ws = new MockWebSocket(wsUrl);

    const messageTimings: Array<{
      sent: number;
      received: number;
      roundTrip: number;
      messageId: number;
    }> = [];

    let receivedMessages = 0;

    ws.addEventListener('message', (_event: any) => {
      const data = JSON.parse(_event.data);
      const receivedTime = Date.now();

      if (data.messageId !== undefined) {
        const timing = messageTimings.find(t => t.messageId === data.messageId);
        if (timing) {
          timing.received = receivedTime;
          timing.roundTrip = receivedTime - timing.sent;
        }
      }

      receivedMessages++;
    });

    // Wait for connection
    await new Promise(resolve => {
      ws.addEventListener('open', resolve);
    });

    // Send messages rapidly
    const startTime = Date.now();

    for (let i = 0; i < messageCount; i++) {
      const sentTime = Date.now();
      messageTimings.push({
        sent: sentTime,
        received: 0,
        roundTrip: 0,
        messageId: i,
      });

      ws.send(
        JSON.stringify({
          type: 'performance_test',
          messageId: i,
          timestamp: sentTime,
        })
      );

      // Small delay to prevent overwhelming
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // Wait for all responses
    const timeout = 5000;
    const endTime = startTime + timeout;

    while (receivedMessages < messageCount && Date.now() < endTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const totalTime = Date.now() - startTime;
    const completedTimings = messageTimings.filter(t => t.received > 0);
    const averageRoundTrip =
      completedTimings.reduce((sum, t) => sum + t.roundTrip, 0) /
      completedTimings.length;
    const messagesPerSecond = (receivedMessages / totalTime) * 1000;

    return {
      messageCount,
      receivedMessages,
      totalTime,
      averageRoundTrip,
      messagesPerSecond,
      messageTimings: completedTimings,
      cleanup: () => ws.close(),
    };
  }

  // Getters for test data
  static getBattleUpdates(battleId?: string) {
    return battleId
      ? this.battleUpdates.filter(u => u.battleId === battleId)
      : [...this.battleUpdates];
  }

  static getPresenceUpdates(userId?: string) {
    return userId
      ? this.presenceUpdates.filter(u => u.userId === userId)
      : [...this.presenceUpdates];
  }
}

// WebSocket Event Matchers for Jest
export const webSocketMatchers = {
  toHaveReceivedMessage: (ws: MockWebSocket, expectedMessage: any) => {
    const events = MockWebSocket.getEvents().filter(
      event => event.socketId === ws.id && _event.type === 'event_message'
    );

    const messageReceived = events.some(event => {
      try {
        const data =
          typeof event.data.data === 'string'
            ? JSON.parse(_event.data.data)
            : event.data.data;
        return JSON.stringify(data) === JSON.stringify(expectedMessage);
      } catch {
        return event.data.data === expectedMessage;
      }
    });

    return {
      pass: messageReceived,
      message: () =>
        `Expected WebSocket to ${messageReceived ? 'not ' : ''}have received message: ${JSON.stringify(expectedMessage)}`,
    };
  },

  toHaveState: (ws: MockWebSocket, expectedState: number) => {
    return {
      pass: ws.readyState === expectedState,
      message: () =>
        `Expected WebSocket readyState to be ${expectedState}, but was ${ws.readyState}`,
    };
  },

  toHaveReconnected: (timesExpected: number) => {
    const reconnectEvents = MockWebSocket.getEvents().filter(event =>
      _event.type.includes('reconnect')
    );

    return {
      pass: reconnectEvents.length === timesExpected,
      message: () =>
        `Expected ${timesExpected} reconnection attempts, but found ${reconnectEvents.length}`,
    };
  },
};

// Setup function for tests
export const setupRealTimeTesting = () => {
  // Replace global WebSocket with mock
  const originalWebSocket = global.WebSocket;

  beforeAll(() => {
    global.WebSocket = MockWebSocket as any;
  });

  beforeEach(() => {
    RealTimeTestUtils.reset();
  });

  afterAll(() => {
    global.WebSocket = originalWebSocket;
  });

  // Add custom matchers
  if (expect.extend) {
    expect.extend(webSocketMatchers);
  }
};

export { MockWebSocket, MockSupabaseRealtimeChannel };

export default {
  MockWebSocket,
  RealTimeTestUtils,
  webSocketMatchers,
  setupRealTimeTesting,
};
