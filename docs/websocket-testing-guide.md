# WebSocket Real-time Types Testing Guide

This comprehensive guide covers how to create unit tests and integration tests for the WebSocket real-time types in the Relife application.

## Overview

The testing infrastructure provides three levels of testing for WebSocket functionality:

1. **Unit Tests** - Test individual type guards, message validation, and utility functions
2. **Integration Tests** - Test complete WebSocket flows including connection, authentication, messaging
3. **Service Tests** - Test the WebSocket manager and service-level integrations

## Testing Infrastructure

### Core Testing Tools

- **Vitest** - Main testing framework (configured in `vitest.config.ts`)
- **MockWebSocket** - Complete WebSocket mock implementation
- **WebSocketTypeMocks** - Type-specific mock factories and utilities
- **RealTimeTestUtils** - Higher-level testing utilities for complex scenarios

### Key Files

```
src/__tests__/
├── types/
│   └── websocket-types.unit.test.ts          # Unit tests for types
├── integration/
│   └── websocket-realtime.integration.test.ts # Integration tests
├── services/
│   └── websocket-manager.integration.test.ts  # Service-level tests
├── mocks/
│   └── websocket-type-mocks.ts               # Mock utilities
└── realtime/
    ├── realtime-testing-utilities.ts         # Core testing utilities
    └── websocket-testing.ts                  # WebSocket-specific mocks
```

## Unit Testing WebSocket Types

### Testing Type Guards

Unit tests validate that type guards correctly identify message types:

```typescript
import { describe, it, expect } from 'vitest';
import { isAlarmMessage, isUserMessage, isAIMessage } from '../../types/realtime-messages';
import { WebSocketTypeMocks } from '../mocks/websocket-type-mocks';

describe('WebSocket Type Guards', () => {
  it('should correctly identify alarm messages', () => {
    const alarmMessage = WebSocketTypeMocks.createMockWebSocketMessage(
      'alarm_triggered',
      WebSocketTypeMocks.createMockAlarmTriggeredPayload()
    );
    
    const userMessage = WebSocketTypeMocks.createMockWebSocketMessage(
      'user_presence_update',
      WebSocketTypeMocks.createMockUserPresencePayload()
    );

    expect(isAlarmMessage(alarmMessage)).toBe(true);
    expect(isAlarmMessage(userMessage)).toBe(false);
    expect(isUserMessage(userMessage)).toBe(true);
    expect(isUserMessage(alarmMessage)).toBe(false);
  });
});
```

### Testing Message Payload Validation

Validate that message payloads contain expected data structure:

```typescript
describe('Message Payload Validation', () => {
  it('should validate alarm triggered payload', () => {
    const payload = WebSocketTypeMocks.createMockAlarmTriggeredPayload();
    
    expect(payload.alarm.id).toBeTruthy();
    expect(payload.triggeredAt).toBeInstanceOf(Date);
    expect(payload.location?.latitude).toBeGreaterThan(-90);
    expect(payload.location?.latitude).toBeLessThan(90);
    expect(payload.deviceInfo.batteryLevel).toBeGreaterThanOrEqual(0);
    expect(payload.deviceInfo.batteryLevel).toBeLessThanOrEqual(100);
  });
});
```

### Testing Configuration Objects

Validate WebSocket configuration objects:

```typescript
describe('WebSocket Configuration', () => {
  it('should validate complete WebSocket config', () => {
    const config = WebSocketTypeMocks.createMockWebSocketConfig();
    
    expect(config.url).toMatch(/^wss?:\/\//);
    expect(config.timeout).toBeGreaterThan(0);
    expect(config.heartbeatInterval).toBeGreaterThan(0);
    expect(config.reconnectAttempts).toBeGreaterThanOrEqual(0);
  });
});
```

## Integration Testing WebSocket Flow

### Setting Up Integration Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockWebSocket, RealTimeTestUtils, setupRealTimeTesting } from '../realtime/realtime-testing-utilities';

// Setup WebSocket testing environment
setupRealTimeTesting();

describe('WebSocket Integration Tests', () => {
  beforeEach(() => {
    RealTimeTestUtils.reset();
  });

  afterEach(() => {
    RealTimeTestUtils.reset();
  });
  
  // Tests here...
});
```

### Testing Connection Establishment

```typescript
describe('Connection Management', () => {
  it('should establish WebSocket connection successfully', async () => {
    const ws = new MockWebSocket('wss://test.relife.app/ws');
    
    const connectionPromise = new Promise<WebSocketConnectionInfo>((resolve) => {
      ws.addEventListener('open', () => {
        resolve({
          id: ws.id,
          state: 'OPEN',
          url: ws.url,
          connectedAt: new Date(),
          reconnectCount: 0
        });
      });
    });

    const connectionInfo = await connectionPromise;
    expect(connectionInfo.state).toBe('OPEN');
    expect(ws.readyState).toBe(MockWebSocket.OPEN);
  });
});
```

### Testing Message Flow

```typescript
describe('Real-time Alarm Messages', () => {
  it('should handle alarm triggered message', async () => {
    const ws = new MockWebSocket('wss://test.relife.app/ws');
    await new Promise<void>((resolve) => {
      ws.addEventListener('open', () => resolve());
    });

    const alarmPayload = WebSocketTypeMocks.createMockAlarmTriggeredPayload();
    
    const messageReceived = new Promise<AlarmTriggeredPayload>((resolve) => {
      ws.addEventListener('message', (event: any) => {
        const message: WebSocketMessage<AlarmTriggeredPayload> = JSON.parse(event.data);
        if (message.type === 'alarm_triggered') {
          resolve(message.payload);
        }
      });
    });

    // Simulate server sending message
    ws.simulateMessage({
      id: 'msg-123',
      type: 'alarm_triggered',
      payload: alarmPayload,
      timestamp: new Date().toISOString()
    });

    const receivedPayload = await messageReceived;
    expect(receivedPayload.alarm.id).toBe(alarmPayload.alarm.id);
    expect(receivedPayload.triggeredAt).toBeInstanceOf(Date);
  });
});
```

### Testing Authentication Flow

```typescript
describe('Authentication', () => {
  it('should authenticate connection with valid credentials', async () => {
    const ws = new MockWebSocket('wss://test.relife.app/ws');
    await new Promise<void>((resolve) => {
      ws.addEventListener('open', () => resolve());
    });

    const authPayload = WebSocketTypeMocks.createMockAuthPayload();
    
    const authResponsePromise = new Promise<WebSocketAuthResponse>((resolve) => {
      ws.addEventListener('message', (event: any) => {
        const data = JSON.parse(event.data);
        if (data.type === 'authentication_response' && data.success) {
          resolve(data);
        }
      });
    });

    // Mock server authentication response
    ws.addEventListener('message', (event: any) => {
      const data = JSON.parse(event.data);
      if (data.type === 'authentication_request') {
        setTimeout(() => {
          ws.simulateMessage(WebSocketTypeMocks.createMockAuthResponse(true));
        }, 50);
      }
    });

    ws.send(JSON.stringify({
      type: 'authentication_request',
      payload: authPayload
    }));

    const authResponse = await authResponsePromise;
    expect(authResponse.success).toBe(true);
    expect(authResponse.permissions).toContain('alarm_management');
  });
});
```

## Service-Level Testing

### Testing WebSocket Manager

```typescript
describe('WebSocket Manager Service Tests', () => {
  let wsManager: MockWebSocketManager;
  
  beforeEach(() => {
    wsManager = new MockWebSocketManager();
  });

  it('should manage multiple subscriptions', async () => {
    const handlers: WebSocketEventHandlers = {};
    await wsManager.connect(config, handlers);

    const sub1Id = wsManager.subscribe({
      type: 'alarm_updates',
      filters: { userId: 'user-123' },
      priority: 'high'
    });

    const sub2Id = wsManager.subscribe({
      type: 'user_activity',
      priority: 'normal'
    });

    expect(wsManager.getSubscriptions()).toHaveLength(2);
    
    const unsubscribed = wsManager.unsubscribe(sub1Id);
    expect(unsubscribed).toBe(true);
    expect(wsManager.getSubscriptions()).toHaveLength(1);
  });
});
```

### Testing Message Filtering

```typescript
describe('Message Filtering', () => {
  it('should filter messages based on custom filters', async () => {
    const receivedMessages: any[] = [];
    const handlers: WebSocketEventHandlers = {
      onMessage: (message) => receivedMessages.push(message)
    };

    await wsManager.connect(config, handlers);

    // Add filter to only allow alarm messages
    wsManager.addMessageFilter((message) => {
      return message.type?.startsWith('alarm_');
    });

    const mockConnection = MockWebSocket.findByUrl(config.url);
    
    // Send alarm message (should pass)
    mockConnection?.simulateMessage({
      type: 'alarm_triggered',
      payload: WebSocketTypeMocks.createMockAlarmTriggeredPayload()
    });

    // Send user message (should be filtered out)
    mockConnection?.simulateMessage({
      type: 'user_presence_update',
      payload: WebSocketTypeMocks.createMockUserPresencePayload()
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(receivedMessages).toHaveLength(1);
    expect(receivedMessages[0]?.type).toBe('alarm_triggered');
  });
});
```

## Performance Testing

### Testing Connection Resilience

```typescript
describe('Connection Resilience', () => {
  it('should handle connection drops and reconnections', async () => {
    const connectionStates: string[] = [];
    let reconnectionAttempts = 0;

    const createConnection = () => {
      const ws = new MockWebSocket(config.url);
      connectionStates.push('connecting');

      ws.addEventListener('open', () => {
        connectionStates.push('connected');
      });

      ws.addEventListener('close', () => {
        connectionStates.push('disconnected');
        
        if (reconnectionAttempts < 3) {
          reconnectionAttempts++;
          setTimeout(() => {
            connectionStates.push(`reconnect_attempt_${reconnectionAttempts}`);
            createConnection();
          }, 1000);
        }
      });

      // Simulate connection drop
      if (reconnectionAttempts === 0) {
        setTimeout(() => {
          ws.simulateClose(1006, 'Connection lost');
        }, 1000);
      }

      return ws;
    };

    createConnection();
    await new Promise(resolve => setTimeout(resolve, 5000));

    expect(connectionStates).toContain('connecting');
    expect(connectionStates).toContain('connected');
    expect(connectionStates).toContain('disconnected');
    expect(reconnectionAttempts).toBe(3);
  });
});
```

### Testing Message Throughput

```typescript
describe('Performance Testing', () => {
  it('should handle high message throughput', async () => {
    const ws = new MockWebSocket('wss://test.relife.app/ws');
    await new Promise<void>((resolve) => {
      ws.addEventListener('open', () => resolve());
    });

    const messageCount = 100;
    const sentMessages: any[] = [];
    const receivedMessages: any[] = [];

    ws.addEventListener('message', (event: any) => {
      receivedMessages.push(JSON.parse(event.data));
    });

    const startTime = Date.now();

    // Send messages rapidly
    for (let i = 0; i < messageCount; i++) {
      const message = {
        id: `perf-test-${i}`,
        type: 'performance_test',
        payload: { messageNumber: i },
        timestamp: Date.now()
      };
      
      sentMessages.push(message);
      ws.send(JSON.stringify(message));
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const totalTime = Date.now() - startTime;
    const messagesPerSecond = (receivedMessages.length / totalTime) * 1000;

    expect(receivedMessages.length).toBe(messageCount);
    expect(messagesPerSecond).toBeGreaterThan(50); // At least 50 messages per second
  });
});
```

## Mock Utilities Usage

### Using WebSocketTypeMocks

The `WebSocketTypeMocks` class provides factories for all WebSocket types:

```typescript
import { WebSocketTypeMocks } from '../mocks/websocket-type-mocks';

// Create mock configuration
const config = WebSocketTypeMocks.createMockWebSocketConfig({
  url: 'wss://custom.test.com/ws',
  timeout: 3000
});

// Create mock device info
const mobileDevice = WebSocketTypeMocks.createMockDeviceInfo('mobile');
const desktopDevice = WebSocketTypeMocks.createMockDeviceInfo('desktop');

// Create mock message payloads
const alarmPayload = WebSocketTypeMocks.createMockAlarmTriggeredPayload();
const userPayload = WebSocketTypeMocks.createMockUserPresencePayload();
const aiPayload = WebSocketTypeMocks.createMockRecommendationPayload();

// Create complete messages
const alarmMessage = WebSocketTypeMocks.createMockWebSocketMessage(
  'alarm_triggered',
  alarmPayload
);

// Create test scenarios
const connectionScenario = WebSocketTypeMocks.createConnectionScenario('OPEN');
const errorScenario = WebSocketTypeMocks.createErrorScenario('CONNECTION_FAILED');
const messageFlow = WebSocketTypeMocks.createMessageFlowScenario();
```

### Validation Helpers

```typescript
// Validate mock data
const message = WebSocketTypeMocks.createMockWebSocketMessage('test', {});
expect(WebSocketTypeMocks.isValidWebSocketMessage(message)).toBe(true);

const device = WebSocketTypeMocks.createMockDeviceInfo('mobile');
expect(WebSocketTypeMocks.isValidDeviceInfo(device)).toBe(true);

const connection = WebSocketTypeMocks.createMockConnectionInfo();
expect(WebSocketTypeMocks.isValidConnectionInfo(connection)).toBe(true);
```

## Running Tests

### Basic Test Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only WebSocket-related tests
npm run test -- --grep="WebSocket"

# Run only integration tests
npm run test -- integration/

# Run only unit tests
npm run test -- types/
```

### Coverage Targets

The testing setup includes coverage thresholds:

- **Functions**: 80%
- **Lines**: 80%
- **Branches**: 75%
- **Statements**: 80%

### Test Organization

Tests are organized by category:

1. **Unit Tests** (`src/__tests__/types/`) - Fast, isolated tests for type utilities
2. **Integration Tests** (`src/__tests__/integration/`) - End-to-end WebSocket flow tests
3. **Service Tests** (`src/__tests__/services/`) - Service-level functionality tests

## Best Practices

### Test Structure

1. **Arrange** - Set up test data using mock factories
2. **Act** - Execute the functionality being tested
3. **Assert** - Verify expected outcomes

### Mock Usage

- Use `WebSocketTypeMocks` for consistent test data
- Use `MockWebSocket` for WebSocket connection simulation
- Use `RealTimeTestUtils` for complex real-time scenarios

### Test Data

- Create realistic test data using the mock factories
- Test edge cases and error conditions
- Validate both successful and failure scenarios

### Async Testing

- Always await async operations in tests
- Use proper timeout handling for WebSocket connections
- Clean up resources in `afterEach` hooks

### Error Testing

- Test all error types defined in `WebSocketErrorType`
- Verify error recovery mechanisms
- Test rate limiting and timeout scenarios

## Common Testing Patterns

### Testing Message Handlers

```typescript
it('should handle multiple message types', async () => {
  const receivedMessages = new Map<string, any[]>();
  
  const handlers: WebSocketEventHandlers = {
    onMessage: (message) => {
      if (!receivedMessages.has(message.type)) {
        receivedMessages.set(message.type, []);
      }
      receivedMessages.get(message.type)!.push(message);
    }
  };

  await wsManager.connect(config, handlers);
  const mockConnection = MockWebSocket.findByUrl(config.url);

  // Send different message types
  const messages = WebSocketTypeMocks.createMessageFlowScenario();
  
  for (const messageGroup of Object.values(messages)) {
    for (const message of messageGroup) {
      mockConnection?.simulateMessage(message);
    }
  }

  await new Promise(resolve => setTimeout(resolve, 200));

  expect(receivedMessages.get('alarm_triggered')).toHaveLength(1);
  expect(receivedMessages.get('user_presence_update')).toHaveLength(1);
  expect(receivedMessages.get('recommendation_generated')).toHaveLength(1);
});
```

### Testing Subscription Management

```typescript
it('should handle subscription lifecycle', async () => {
  const handlers: WebSocketEventHandlers = {};
  await wsManager.connect(config, handlers);

  // Create subscriptions
  const subscriptions = [
    wsManager.subscribe({ type: 'alarm_updates', priority: 'high' }),
    wsManager.subscribe({ type: 'user_activity', priority: 'normal' }),
    wsManager.subscribe({ type: 'system_notifications', priority: 'critical' })
  ];

  expect(wsManager.getSubscriptions()).toHaveLength(3);

  // Remove one subscription
  wsManager.unsubscribe(subscriptions[1]);
  expect(wsManager.getSubscriptions()).toHaveLength(2);

  // Verify remaining subscriptions
  const remaining = wsManager.getSubscriptions();
  expect(remaining.some(s => s.type === 'alarm_updates')).toBe(true);
  expect(remaining.some(s => s.type === 'system_notifications')).toBe(true);
  expect(remaining.some(s => s.type === 'user_activity')).toBe(false);
});
```

This comprehensive testing guide provides everything needed to create robust unit and integration tests for your WebSocket real-time types. The combination of unit tests, integration tests, and service tests ensures complete coverage of the WebSocket functionality while providing maintainable and reliable test code.