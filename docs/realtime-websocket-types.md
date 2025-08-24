# Real-time WebSocket Types Documentation

## Overview

This documentation covers the comprehensive real-time WebSocket type system for the Relife alarm application. The type system provides full TypeScript coverage for WebSocket connections, push notifications, Supabase real-time subscriptions, and all related real-time functionality.

## Architecture Overview

The real-time system consists of several key components:

1. **WebSocket Core** (`src/types/websocket.ts`) - Base WebSocket connection and message handling
2. **Real-time Messages** (`src/types/realtime-messages.ts`) - Typed message payloads for all real-time events
3. **Push Notifications** (`src/types/push-notifications.ts`) - Push notification types and service worker communication
4. **Supabase Real-time** (`src/types/supabase-realtime.ts`) - Database change events and presence management
5. **Service Interface** (`src/types/realtime-service.ts`) - Main service interface and configuration
6. **React Hooks** (`src/hooks/useRealtime.ts`) - React integration and component-friendly API

## Type System Structure

### Core WebSocket Types

```typescript
import type { 
  WebSocketMessage, 
  WebSocketConfig, 
  WebSocketManager 
} from './types/realtime';

// Basic message structure
interface WebSocketMessage<T = any> {
  id: string;
  type: WebSocketMessageType;
  payload: T;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

// Connection configuration
interface WebSocketConfig {
  url: string;
  timeout: number;
  heartbeatInterval: number;
  reconnectAttempts: number;
  // ... more options
}
```

### Real-time Message Types

All real-time messages are strongly typed with specific payload interfaces:

```typescript
import type {
  AlarmTriggeredPayload,
  UserPresenceUpdatePayload,
  RecommendationGeneratedPayload
} from './types/realtime';

// Alarm events
interface AlarmTriggeredPayload {
  alarm: Alarm;
  triggeredAt: Date;
  location?: GeolocationData;
  deviceInfo: DeviceStatus;
  contextualData: EnvironmentData;
}

// User presence
interface UserPresenceUpdatePayload {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  activeDevices: DeviceInfo[];
  currentActivity?: ActivityContext;
}
```

## Getting Started

### 1. Setting Up the Real-time Service

First, configure and initialize the real-time service:

```typescript
import { RealtimeService, DEFAULT_REALTIME_CONFIG } from './types/realtime';

const config: RealtimeServiceConfig = {
  ...DEFAULT_REALTIME_CONFIG,
  websocket: {
    enabled: true,
    config: {
      url: 'wss://your-websocket-server.com',
      timeout: 10000,
      heartbeatInterval: 30000,
      // ... other config
    }
  },
  supabase: {
    enabled: true,
    enablePresence: true,
    enableBroadcast: true,
    enableDatabaseChanges: true
  }
};

const realtimeService = await RealtimeServiceFactory.create(config);
await realtimeService.start();
```

### 2. Using React Hooks

Wrap your app with the RealtimeProvider and use hooks in components:

```typescript
import { RealtimeProvider, useRealtime } from './hooks/useRealtime';

// App setup
function App() {
  return (
    <RealtimeProvider service={realtimeService}>
      <AlarmComponent />
    </RealtimeProvider>
  );
}

// Component usage
function AlarmComponent() {
  const { alarm, isConnected, error } = useRealtime();
  
  useEffect(() => {
    // Listen for alarm triggers
    const unsubscribe = alarm.onAlarmTriggered((data: AlarmTriggeredPayload) => {
      console.log('Alarm triggered:', data.alarm.label);
      // Handle alarm trigger with full type safety
    });
    
    return unsubscribe;
  }, [alarm]);
  
  // Rest of component...
}
```

## Feature-Specific Usage

### Alarm Real-time Features

```typescript
import { useRealtime } from './hooks/useRealtime';
import type { AlarmTriggeredPayload, AlarmDismissedPayload } from './types/realtime';

function AlarmManager() {
  const { alarm } = useRealtime();
  
  useEffect(() => {
    // Strongly typed alarm event handlers
    const unsubscribeTriggered = alarm.onAlarmTriggered((data: AlarmTriggeredPayload) => {
      const { alarm: alarmData, triggeredAt, deviceInfo, contextualData } = data;
      
      // Full access to typed data
      console.log(`Alarm "${alarmData.label}" triggered at ${triggeredAt}`);
      console.log(`Battery level: ${deviceInfo.batteryLevel}%`);
      console.log(`Weather: ${contextualData.weatherCondition}`);
    });
    
    const unsubscribeDismissed = alarm.onAlarmDismissed((data: AlarmDismissedPayload) => {
      const { alarmId, dismissMethod, timeToReact, voiceData } = data;
      
      if (voiceData) {
        console.log(`Voice mood detected: ${voiceData.mood}`);
        console.log(`Confidence: ${voiceData.confidenceScore}`);
      }
    });
    
    return () => {
      unsubscribeTriggered();
      unsubscribeDismissed();
    };
  }, [alarm]);
  
  const syncAlarm = async (alarmId: string) => {
    await alarm.syncAlarmState(alarmId);
  };
}
```

### User Presence and Activity

```typescript
import type { UserPresenceUpdatePayload } from './types/realtime';

function UserPresenceComponent() {
  const { user } = useRealtime();
  const [onlineUsers, setOnlineUsers] = useState<UserPresenceUpdatePayload[]>([]);
  
  useEffect(() => {
    const unsubscribe = user.onPresenceUpdate((data: UserPresenceUpdatePayload) => {
      setOnlineUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId);
        return [data, ...filtered];
      });
    });
    
    return unsubscribe;
  }, [user]);
  
  const updateMyPresence = async (status: 'online' | 'away' | 'busy' | 'offline') => {
    await user.updatePresence(status);
  };
  
  const trackActivity = async () => {
    await user.trackActivity({
      type: 'page_view',
      details: {
        page: '/alarms',
        duration: 30000,
        metadata: { feature: 'alarm_list' }
      },
      timestamp: new Date(),
      sessionId: 'current-session'
    });
  };
}
```

### AI Recommendations

```typescript
import type { RecommendationGeneratedPayload } from './types/realtime';

function AIRecommendationsComponent() {
  const { ai } = useRealtime();
  const [recommendations, setRecommendations] = useState<RecommendationGeneratedPayload[]>([]);
  
  useEffect(() => {
    const unsubscribe = ai.onRecommendation((data: RecommendationGeneratedPayload) => {
      const { recommendation, data: analysisData } = data;
      
      console.log(`New ${data.type} recommendation: ${recommendation.title}`);
      console.log(`Confidence: ${analysisData.confidence}`);
      console.log(`Expected impact: ${recommendation.estimatedImpact}/10`);
      
      setRecommendations(prev => [data, ...prev.slice(0, 4)]);
    });
    
    return unsubscribe;
  }, [ai]);
  
  const requestAnalysis = async () => {
    const analysisId = await ai.requestAnalysis('sleep_pattern', {
      userId: 'current-user',
      timeRange: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }
    });
    
    console.log('Sleep analysis requested:', analysisId);
  };
}
```

### Push Notifications

```typescript
import type { 
  PushNotification, 
  NotificationPreferences,
  AlarmNotificationData 
} from './types/realtime';

function PushNotificationManager() {
  const { push } = useRealtime();
  
  const subscribeToNotifications = async () => {
    const success = await push.subscribe();
    if (success) {
      console.log('Successfully subscribed to push notifications');
    }
  };
  
  const updatePreferences = async () => {
    const preferences: Partial<NotificationPreferences> = {
      categories: {
        alarm: true,
        motivation: true,
        progress: true,
        system: true,
        emergency: true,
        social: false,
        promotional: false
      },
      schedule: {
        enabled: true,
        allowedHours: { start: '07:00', end: '22:00' },
        timezone: 'America/New_York'
      }
    };
    
    await push.updatePreferences(preferences);
  };
  
  const sendAlarmNotification = async (alarmId: string) => {
    const notification: PushNotification = {
      id: `alarm-${alarmId}`,
      title: 'Wake Up!',
      body: 'Your morning alarm is ringing',
      category: 'alarm',
      priority: 'max',
      timestamp: new Date(),
      ttl: 300, // 5 minutes
      userId: 'current-user',
      data: {
        type: 'alarm',
        alarmId,
        alarmLabel: 'Morning Routine',
        alarmTime: '07:00',
        snoozeCount: 0,
        maxSnoozes: 3,
        voiceEnabled: true,
        challengeEnabled: false
      } as AlarmNotificationData,
      actions: [
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' },
        { action: 'snooze', title: 'Snooze', icon: '/icons/snooze.png' }
      ]
    };
    
    const notificationId = await push.sendNotification(notification);
    console.log('Notification sent:', notificationId);
  };
}
```

## Advanced Usage

### Custom Message Handling

Use the generic message hook for custom message types:

```typescript
import { useRealtimeMessage } from './hooks/useRealtime';
import type { SystemNotificationPayload } from './types/realtime';

function CustomMessageHandler() {
  // Listen to specific message types with full type safety
  useRealtimeMessage<SystemNotificationPayload>(
    'system_notification',
    (data) => {
      const { title, message, severity, actions } = data;
      
      if (severity === 'critical') {
        // Handle critical system notifications
        showEmergencyModal(title, message);
      }
      
      if (actions) {
        // Handle notification actions
        actions.forEach(action => {
          console.log(`Available action: ${action.label}`);
        });
      }
    },
    [] // Dependencies
  );
}
```

### Connection Quality Monitoring

```typescript
import { useConnectionQuality, useRealtimeMetrics } from './hooks/useRealtime';

function ConnectionMonitor() {
  const { quality, isGood, shouldWarn } = useConnectionQuality();
  const metrics = useRealtimeMetrics(5000); // Update every 5 seconds
  
  if (shouldWarn) {
    return (
      <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
        <p>Connection quality is {quality}. Some features may be degraded.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-green-100 border border-green-300 rounded p-3">
      <p>Connection quality: {quality}</p>
      {metrics && (
        <div className="text-sm text-gray-600 mt-2">
          <p>Latency: {metrics.messaging.averageLatency.toFixed(0)}ms</p>
          <p>Messages/sec: {metrics.messaging.messagesPerSecond.toFixed(1)}</p>
          <p>Health Score: {metrics.health.healthScore}/100</p>
        </div>
      )}
    </div>
  );
}
```

### Error Handling

```typescript
import type { RealtimeServiceError } from './types/realtime';

function ErrorHandler() {
  const { error, clearError } = useRealtime();
  
  if (!error) return null;
  
  const handleError = (error: RealtimeServiceError) => {
    switch (error.severity) {
      case 'critical':
        // Show full-screen error modal
        showCriticalErrorModal(error);
        break;
      case 'high':
        // Show prominent notification
        showErrorNotification(error);
        break;
      case 'medium':
      case 'low':
        // Show subtle toast
        showErrorToast(error);
        break;
    }
    
    // Log error for debugging
    console.error(`Real-time ${error.type} error:`, error);
    
    if (error.userActionRequired) {
      // Show actionable error message
      error.suggestedActions.forEach(action => {
        console.log(`Suggested action: ${action}`);
      });
    }
  };
  
  useEffect(() => {
    if (error) {
      handleError(error);
    }
  }, [error]);
  
  return (
    <div className="error-container">
      {error && (
        <div className={`alert alert-${error.severity}`}>
          <h4>{error.type} Error</h4>
          <p>{error.message}</p>
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
```

## Testing and Mocking

The type system includes comprehensive testing interfaces:

```typescript
import type { MockRealtimeService, RealtimeServiceTestHarness } from './types/realtime';

// Create mock service for testing
const mockService: MockRealtimeService = RealtimeServiceTestHarness.createMockService({
  websocket: { enabled: true },
  supabase: { enabled: false } // Disable Supabase for unit tests
});

// Simulate real-time events in tests
mockService.simulateMessage({
  id: 'test-message',
  type: 'alarm_triggered',
  payload: {
    alarm: { id: 'test-alarm', label: 'Test Alarm' },
    triggeredAt: new Date(),
    deviceInfo: { batteryLevel: 100, networkType: 'wifi' }
  } as AlarmTriggeredPayload,
  timestamp: new Date().toISOString(),
  userId: 'test-user'
});

// Test connection scenarios
mockService.simulateDisconnection(5000); // Disconnect for 5 seconds
mockService.simulateLatency(200); // Add 200ms latency

// Verify behavior
const receivedMessages = mockService.getReceivedMessages();
const sentMessages = mockService.getSentMessages();
const methodCalls = mockService.getMethodCallHistory();
```

## Performance Considerations

### Subscription Management

Always clean up subscriptions to prevent memory leaks:

```typescript
function MyComponent() {
  const { alarm, user, ai } = useRealtime();
  
  useEffect(() => {
    const subscriptions = [
      alarm.onAlarmTriggered(handleAlarmTrigger),
      user.onPresenceUpdate(handlePresenceUpdate),
      ai.onRecommendation(handleRecommendation)
    ];
    
    // Clean up all subscriptions on unmount
    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, []);
}
```

### Efficient Message Filtering

Use specific message type hooks instead of generic message listeners:

```typescript
// ✅ Good - specific type handler
useRealtimeMessage<AlarmTriggeredPayload>('alarm_triggered', handleAlarmTrigger);

// ❌ Less efficient - generic handler with manual filtering
const { service } = useRealtime();
useEffect(() => {
  const unsubscribe = service?.onMessage((message) => {
    if (message.type === 'alarm_triggered') {
      handleAlarmTrigger(message.payload);
    }
  });
  return unsubscribe;
}, [service]);
```

### Batching and Throttling

For high-frequency events, consider batching updates:

```typescript
import { useMemo } from 'react';
import { debounce } from 'lodash';

function HighFrequencyComponent() {
  const { user } = useRealtime();
  
  // Debounce presence updates to avoid excessive re-renders
  const debouncedPresenceUpdate = useMemo(
    () => debounce((data: UserPresenceUpdatePayload) => {
      setPresenceData(data);
    }, 1000),
    []
  );
  
  useEffect(() => {
    return user.onPresenceUpdate(debouncedPresenceUpdate);
  }, [user, debouncedPresenceUpdate]);
}
```

## Configuration Options

### Default Configuration

The system provides sensible defaults that can be overridden:

```typescript
import { DEFAULT_REALTIME_CONFIG, DEFAULT_NOTIFICATION_PREFERENCES } from './types/realtime';

const customConfig: RealtimeServiceConfig = {
  ...DEFAULT_REALTIME_CONFIG,
  websocket: {
    ...DEFAULT_REALTIME_CONFIG.websocket,
    config: {
      ...DEFAULT_REALTIME_CONFIG.websocket.config,
      reconnectAttempts: 10, // Increase reconnection attempts
      heartbeatInterval: 15000, // More frequent heartbeats
    }
  },
  pushNotifications: {
    ...DEFAULT_REALTIME_CONFIG.pushNotifications,
    defaultPreferences: {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      categories: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.categories,
        promotional: true // Enable promotional notifications
      }
    }
  }
};
```

## Security Considerations

### Authentication

All WebSocket connections should be authenticated:

```typescript
const config: RealtimeServiceConfig = {
  websocket: {
    enabled: true,
    config: {
      url: 'wss://secure-websocket.example.com',
      // Authentication will be handled automatically using current user token
    }
  }
};
```

### Message Validation

The type system provides built-in validation, but always validate sensitive data:

```typescript
function validateAlarmData(payload: AlarmTriggeredPayload): boolean {
  return (
    payload.alarm?.id &&
    payload.triggeredAt instanceof Date &&
    payload.deviceInfo &&
    typeof payload.deviceInfo.batteryLevel === 'number'
  );
}

// Use in message handlers
useRealtimeMessage<AlarmTriggeredPayload>('alarm_triggered', (data) => {
  if (!validateAlarmData(data)) {
    console.warn('Invalid alarm data received:', data);
    return;
  }
  
  handleAlarmTrigger(data);
});
```

## Troubleshooting

### Common Issues

1. **Connection Fails to Establish**
   - Check WebSocket URL and network connectivity
   - Verify authentication token is valid
   - Check firewall/proxy settings

2. **Messages Not Received**
   - Ensure subscriptions are properly set up
   - Check connection status and quality
   - Verify message type and payload structure

3. **Memory Leaks**
   - Always clean up subscriptions in useEffect cleanup
   - Use useCallback for event handlers to prevent unnecessary re-subscriptions

4. **Performance Issues**
   - Use specific message type handlers instead of generic listeners
   - Implement debouncing for high-frequency updates
   - Monitor metrics using useRealtimeMetrics hook

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
const debugConfig: RealtimeServiceConfig = {
  ...DEFAULT_REALTIME_CONFIG,
  enableLogging: true,
  websocket: {
    ...DEFAULT_REALTIME_CONFIG.websocket,
    config: {
      ...DEFAULT_REALTIME_CONFIG.websocket.config,
      enableLogging: true
    }
  }
};
```

This comprehensive type system ensures type safety across all real-time functionality while providing a developer-friendly API for building responsive, real-time features in the Relife alarm application.