/**
 * WebSocket Testing Utilities
 * Mock WebSocket implementation and testing utilities for real-time features
 */

import { AnyFn } from 'src/types/utility-types';

// WebSocket Mock Implementation
export class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static events: Array<{ type: string; data: any; timestamp: number }> = [];

  public url: string;
  public readyState: number;
  public id: string;

  private eventListeners: Map<string, AnyFn[]> = new Map();
  private messageQueue: any[] = [];

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  constructor(url: string) {
    this.url = url;
    this.id = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.readyState = MockWebSocket.CONNECTING;

    MockWebSocket.instances.push(this);

    // Simulate connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.trigger('open', { type: 'open' });
      this.processQueue();
    }, 100);
  }

  addEventListener(type: string, listener: AnyFn) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  removeEventListener(type: string, listener: AnyFn) {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const _index = listeners.indexOf(listener);
      if (_index > -1) {
        listeners.splice(_index, 1);
      }
    }
  }

  send(data: any) {
    MockWebSocket.events.push({ type: 'send', data, timestamp: Date.now() });

    if (this.readyState !== MockWebSocket.OPEN) {
      return;
    }

    // Echo back for testing
    setTimeout(() => {
      this.triggerMessage(data);
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

  private trigger(type: string, _event: any) {
    const listeners = this.eventListeners.get(type) || [];
    listeners.forEach(listener => listener(_event));
    MockWebSocket.events.push({
      type: `event_${type}`,
      data: _event,
      timestamp: Date.now(),
    });
  }

  private triggerMessage(data: any) {
    const event = {
      type: 'message',
      data: typeof data === 'string' ? data : JSON.stringify(data),
    };
    this.trigger('message', _event);
  }

  private processQueue() {
    this.messageQueue.forEach(message => this.triggerMessage(message));
    this.messageQueue = [];
  }

  // Test utilities
  simulateMessage(data: any) {
    this.triggerMessage(data);
  }
  simulateError(_error?: any) {
    this.trigger('error', { error: _error || new Error('Mock _error') });
  }
  simulateClose() {
    this.close();
  }

  static reset() {
    this.instances.forEach(ws => ws.close());
    this.instances = [];
    this.events = [];
  }

  static getEvents() {
    return [...this.events];
  }
  static findByUrl(url: string) {
    return this.instances.find(ws => ws.url === url);
  }
}

// Real-time Battle Testing
export class BattleRealTimeTester {
  private battleId: string;
  private participants: string[];
  private events: any[] = [];

  constructor(battleId: string, participants: string[]) {
    this.battleId = battleId;
    this.participants = participants;
  }

  async simulateBattle() {
    const ws = new MockWebSocket(`wss://test/battles/${this.battleId}`);

    ws.addEventListener('message', (_event: any) => {
      this.events.push(JSON.parse(_event.data));
    });

    await this.waitForConnection(ws);

    // Join battle
    ws.send(
      JSON.stringify({
        type: 'join',
        battleId: this.battleId,
        userId: this.participants[0],
      })
    );

    // Submit wake proof
    await this.delay(200);
    ws.send(
      JSON.stringify({
        type: 'wake_proof',
        battleId: this.battleId,
        userId: this.participants[0],
      })
    );

    await this.delay(500);

    return {
      events: this.events,
      websocket: ws,
      cleanup: () => ws.close(),
    };
  }

  private waitForConnection(ws: MockWebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      ws.addEventListener('open', () => resolve());
      ws.addEventListener('_error', reject);
      setTimeout(reject, 1000);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Setup for tests
export const setupWebSocketTesting = () => {
  const originalWebSocket = global.WebSocket;

  beforeAll(() => {
    global.WebSocket = MockWebSocket as any;
  });

  beforeEach(() => {
    MockWebSocket.reset();
  });

  afterAll(() => {
    global.WebSocket = originalWebSocket;
  });
};

export default { MockWebSocket, BattleRealTimeTester, setupWebSocketTesting };
