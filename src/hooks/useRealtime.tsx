/**
 * useRealtime Hook
 * React hook for managing real-time WebSocket connections, push notifications, and Supabase real-time features
 */

import { useEffect, useRef, useState, useCallback, useContext, createContext } from 'react';
import type {
  RealtimeService,
  RealtimeServiceConfig,
  ConnectionStatus,
  RealtimeServiceMetrics,
  RealtimeMessage,
  AlarmTriggeredPayload,
  AlarmDismissedPayload,
  UserPresenceUpdatePayload,
  RecommendationGeneratedPayload,
  PushNotification,
  NotificationPreferences,
  RealtimeServiceError,
  RealtimeEventHandler,
  RealtimeSubscriptionCleanup,
  DEFAULT_REALTIME_CONFIG
} from '../types/realtime';

// ===============================
// REALTIME CONTEXT
// ===============================

interface RealtimeContextValue {
  service: RealtimeService | null;
  isInitialized: boolean;
  connectionStatus: ConnectionStatus | null;
  error: RealtimeServiceError | null;
  metrics: RealtimeServiceMetrics | null;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

interface RealtimeProviderProps {
  children: React.ReactNode;
  service: RealtimeService;
  config?: Partial<RealtimeServiceConfig>;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({
  children,
  service,
  config
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [error, setError] = useState<RealtimeServiceError | null>(null);
  const [metrics, setMetrics] = useState<RealtimeServiceMetrics | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const finalConfig = { ...DEFAULT_REALTIME_CONFIG, ...config };
        await service.initialize(finalConfig);
        await service.start();
        setIsInitialized(true);

        // Set up event listeners
        const unsubscribeStatus = service.onConnectionStatusChange(setConnectionStatus);
        const unsubscribeError = service.onError(setError);

        // Periodic metrics updates
        const metricsInterval = setInterval(async () => {
          try {
            const currentMetrics = await service.getMetrics();
            setMetrics(currentMetrics);
          } catch (err) {
            console.error('Failed to update metrics:', err);
          }
        }, 30000); // Update every 30 seconds

        return () => {
          unsubscribeStatus();
          unsubscribeError();
          clearInterval(metricsInterval);
        };
      } catch (err) {
        console.error('Failed to initialize realtime service:', err);
        setError(err as RealtimeServiceError);
      }
    };

    initialize();

    return () => {
      service?.stop();
    };
  }, [service, config]);

  const contextValue: RealtimeContextValue = {
    service,
    isInitialized,
    connectionStatus,
    error,
    metrics
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};

// ===============================
// MAIN REALTIME HOOK
// ===============================

export interface UseRealtimeOptions {
  autoConnect?: boolean;
  retryOnError?: boolean;
  enableMetrics?: boolean;
  enableLogging?: boolean;
}

export interface UseRealtimeReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: ConnectionStatus | null;
  connectionQuality: ConnectionStatus['connectionQuality'];
  
  // Service instance
  service: RealtimeService | null;
  
  // Error handling
  error: RealtimeServiceError | null;
  clearError: () => void;
  
  // Metrics and monitoring
  metrics: RealtimeServiceMetrics | null;
  refreshMetrics: () => Promise<void>;
  
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
  
  // Feature-specific hooks
  alarm: UseAlarmRealtimeReturn;
  user: UseUserRealtimeReturn;
  ai: UseAIRealtimeReturn;
  push: UsePushNotificationReturn;
  
  // Health check
  performHealthCheck: () => Promise<boolean>;
}

export const useRealtime = (options: UseRealtimeOptions = {}): UseRealtimeReturn => {
  const context = useContext(RealtimeContext);
  
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }

  const { service, isInitialized, connectionStatus, error: contextError, metrics } = context;
  const [localError, setLocalError] = useState<RealtimeServiceError | null>(null);
  const [isManuallyDisconnected, setIsManuallyDisconnected] = useState(false);

  const error = contextError || localError;

  // Connection state derived from connectionStatus
  const isConnected = connectionStatus?.overall === 'connected';
  const isConnecting = connectionStatus?.overall === 'connecting';
  const connectionQuality = connectionStatus?.connectionQuality || 'unknown';

  // Connection management functions
  const connect = useCallback(async () => {
    if (!service || !isInitialized) return;
    
    try {
      setLocalError(null);
      setIsManuallyDisconnected(false);
      if (!service.isRunning()) {
        await service.start();
      }
    } catch (err) {
      setLocalError(err as RealtimeServiceError);
    }
  }, [service, isInitialized]);

  const disconnect = useCallback(async () => {
    if (!service) return;
    
    try {
      setIsManuallyDisconnected(true);
      await service.stop();
    } catch (err) {
      setLocalError(err as RealtimeServiceError);
    }
  }, [service]);

  const reconnect = useCallback(async () => {
    if (!service) return;
    
    try {
      await service.stop();
      await service.start();
      setIsManuallyDisconnected(false);
    } catch (err) {
      setLocalError(err as RealtimeServiceError);
    }
  }, [service]);

  const clearError = useCallback(() => {
    setLocalError(null);
  }, []);

  const refreshMetrics = useCallback(async () => {
    if (!service) return;
    
    try {
      await service.getMetrics();
    } catch (err) {
      console.error('Failed to refresh metrics:', err);
    }
  }, [service]);

  const performHealthCheck = useCallback(async (): Promise<boolean> => {
    if (!service) return false;
    
    try {
      const result = await service.performHealthCheck();
      return result.overall === 'healthy';
    } catch (err) {
      console.error('Health check failed:', err);
      return false;
    }
  }, [service]);

  // Feature-specific hooks
  const alarm = useAlarmRealtime(service);
  const user = useUserRealtime(service);
  const ai = useAIRealtime(service);
  const push = usePushNotification(service);

  // Auto-reconnect on error if enabled
  useEffect(() => {
    if (options.retryOnError && error && !isManuallyDisconnected) {
      const timer = setTimeout(() => {
        reconnect();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, isManuallyDisconnected, options.retryOnError, reconnect]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionStatus,
    connectionQuality,
    
    // Service instance
    service,
    
    // Error handling
    error,
    clearError,
    
    // Metrics and monitoring
    metrics,
    refreshMetrics,
    
    // Connection management
    connect,
    disconnect,
    reconnect,
    
    // Feature-specific hooks
    alarm,
    user,
    ai,
    push,
    
    // Health check
    performHealthCheck
  };
};

// ===============================
// ALARM REALTIME HOOK
// ===============================

export interface UseAlarmRealtimeReturn {
  onAlarmTriggered: (handler: RealtimeEventHandler<AlarmTriggeredPayload>) => RealtimeSubscriptionCleanup;
  onAlarmDismissed: (handler: RealtimeEventHandler<AlarmDismissedPayload>) => RealtimeSubscriptionCleanup;
  onAlarmSnoozed: (handler: RealtimeEventHandler<any>) => RealtimeSubscriptionCleanup;
  syncAlarm: (alarmId: string) => Promise<void>;
  subscribeToAlarmChanges: (userId: string, handler: RealtimeEventHandler<any>) => RealtimeSubscriptionCleanup;
}

const useAlarmRealtime = (service: RealtimeService | null): UseAlarmRealtimeReturn => {
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());

  const createSubscription = useCallback(
    (subscribeFunc: () => () => void): RealtimeSubscriptionCleanup => {
      if (!service) {
        return () => {}; // No-op cleanup function
      }

      const cleanup = subscribeFunc();
      const id = Math.random().toString(36);
      subscriptionsRef.current.set(id, cleanup);

      return () => {
        cleanup();
        subscriptionsRef.current.delete(id);
      };
    },
    [service]
  );

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach(cleanup => cleanup());
      subscriptionsRef.current.clear();
    };
  }, []);

  return {
    onAlarmTriggered: useCallback(
      (handler: RealtimeEventHandler<AlarmTriggeredPayload>) =>
        createSubscription(() => service?.alarm.onAlarmTriggered(handler) || (() => {})),
      [service, createSubscription]
    ),

    onAlarmDismissed: useCallback(
      (handler: RealtimeEventHandler<AlarmDismissedPayload>) =>
        createSubscription(() => service?.alarm.onAlarmDismissed(handler) || (() => {})),
      [service, createSubscription]
    ),

    onAlarmSnoozed: useCallback(
      (handler: RealtimeEventHandler<any>) =>
        createSubscription(() => service?.alarm.onAlarmSnoozed(handler) || (() => {})),
      [service, createSubscription]
    ),

    syncAlarm: useCallback(
      async (alarmId: string) => {
        if (service) {
          await service.alarm.syncAlarmState(alarmId);
        }
      },
      [service]
    ),

    subscribeToAlarmChanges: useCallback(
      (userId: string, handler: RealtimeEventHandler<any>) =>
        createSubscription(() => service?.alarm.subscribeToAlarmChanges(userId, handler) || (() => {})),
      [service, createSubscription]
    )
  };
};

// ===============================
// USER REALTIME HOOK
// ===============================

export interface UseUserRealtimeReturn {
  updatePresence: (status: UserPresenceUpdatePayload['status']) => Promise<void>;
  onPresenceUpdate: (handler: RealtimeEventHandler<UserPresenceUpdatePayload>) => RealtimeSubscriptionCleanup;
  getOnlineUsers: () => Promise<UserPresenceUpdatePayload[]>;
  trackActivity: (activity: any) => Promise<void>;
}

const useUserRealtime = (service: RealtimeService | null): UseUserRealtimeReturn => {
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());

  const createSubscription = useCallback(
    (subscribeFunc: () => () => void): RealtimeSubscriptionCleanup => {
      if (!service) {
        return () => {};
      }

      const cleanup = subscribeFunc();
      const id = Math.random().toString(36);
      subscriptionsRef.current.set(id, cleanup);

      return () => {
        cleanup();
        subscriptionsRef.current.delete(id);
      };
    },
    [service]
  );

  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach(cleanup => cleanup());
      subscriptionsRef.current.clear();
    };
  }, []);

  return {
    updatePresence: useCallback(
      async (status: UserPresenceUpdatePayload['status']) => {
        if (service) {
          await service.user.updatePresence(status);
        }
      },
      [service]
    ),

    onPresenceUpdate: useCallback(
      (handler: RealtimeEventHandler<UserPresenceUpdatePayload>) =>
        createSubscription(() => service?.user.subscribeToPresence(handler) || (() => {})),
      [service, createSubscription]
    ),

    getOnlineUsers: useCallback(
      async () => {
        if (!service) return [];
        return await service.user.getOnlineUsers();
      },
      [service]
    ),

    trackActivity: useCallback(
      async (activity: any) => {
        if (service) {
          await service.user.trackActivity(activity);
        }
      },
      [service]
    )
  };
};

// ===============================
// AI REALTIME HOOK
// ===============================

export interface UseAIRealtimeReturn {
  onRecommendation: (handler: RealtimeEventHandler<RecommendationGeneratedPayload>) => RealtimeSubscriptionCleanup;
  onVoiceMoodDetected: (handler: RealtimeEventHandler<any>) => RealtimeSubscriptionCleanup;
  onSleepPatternUpdate: (handler: RealtimeEventHandler<any>) => RealtimeSubscriptionCleanup;
  requestAnalysis: (type: string, data: any) => Promise<string>;
}

const useAIRealtime = (service: RealtimeService | null): UseAIRealtimeReturn => {
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());

  const createSubscription = useCallback(
    (subscribeFunc: () => () => void): RealtimeSubscriptionCleanup => {
      if (!service) {
        return () => {};
      }

      const cleanup = subscribeFunc();
      const id = Math.random().toString(36);
      subscriptionsRef.current.set(id, cleanup);

      return () => {
        cleanup();
        subscriptionsRef.current.delete(id);
      };
    },
    [service]
  );

  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach(cleanup => cleanup());
      subscriptionsRef.current.clear();
    };
  }, []);

  return {
    onRecommendation: useCallback(
      (handler: RealtimeEventHandler<RecommendationGeneratedPayload>) =>
        createSubscription(() => service?.ai.subscribeToRecommendations(handler) || (() => {})),
      [service, createSubscription]
    ),

    onVoiceMoodDetected: useCallback(
      (handler: RealtimeEventHandler<any>) =>
        createSubscription(() => service?.ai.onVoiceMoodDetected(handler) || (() => {})),
      [service, createSubscription]
    ),

    onSleepPatternUpdate: useCallback(
      (handler: RealtimeEventHandler<any>) =>
        createSubscription(() => service?.ai.onSleepPatternUpdate(handler) || (() => {})),
      [service, createSubscription]
    ),

    requestAnalysis: useCallback(
      async (type: string, data: any) => {
        if (!service) return '';
        return await service.ai.requestAnalysis(type, data);
      },
      [service]
    )
  };
};

// ===============================
// PUSH NOTIFICATION HOOK
// ===============================

export interface UsePushNotificationReturn {
  isSubscribed: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<boolean>;
  sendNotification: (notification: PushNotification) => Promise<string>;
  testNotifications: () => Promise<boolean>;
}

const usePushNotification = (service: RealtimeService | null): UsePushNotificationReturn => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscription = async () => {
      if (service) {
        try {
          const pushManager = service.getPushNotificationManager();
          const subscription = await pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (err) {
          console.error('Failed to check push subscription status:', err);
        }
      }
    };

    checkSubscription();
  }, [service]);

  return {
    isSubscribed,

    subscribe: useCallback(async () => {
      if (!service) return false;
      
      try {
        const pushManager = service.getPushNotificationManager();
        const subscription = await pushManager.subscribe();
        setIsSubscribed(true);
        return true;
      } catch (err) {
        console.error('Failed to subscribe to push notifications:', err);
        return false;
      }
    }, [service]),

    unsubscribe: useCallback(async () => {
      if (!service) return false;
      
      try {
        const pushManager = service.getPushNotificationManager();
        const subscription = await pushManager.getSubscription();
        if (subscription) {
          await pushManager.unsubscribe(subscription.id);
          setIsSubscribed(false);
        }
        return true;
      } catch (err) {
        console.error('Failed to unsubscribe from push notifications:', err);
        return false;
      }
    }, [service]),

    updatePreferences: useCallback(async (preferences: Partial<NotificationPreferences>) => {
      if (!service) return false;
      
      try {
        const pushManager = service.getPushNotificationManager();
        await pushManager.updatePreferences(preferences);
        return true;
      } catch (err) {
        console.error('Failed to update notification preferences:', err);
        return false;
      }
    }, [service]),

    sendNotification: useCallback(async (notification: PushNotification) => {
      if (!service) return '';
      
      try {
        const pushManager = service.getPushNotificationManager();
        return await pushManager.sendNotification(notification);
      } catch (err) {
        console.error('Failed to send push notification:', err);
        return '';
      }
    }, [service]),

    testNotifications: useCallback(async () => {
      if (!service) return false;
      
      try {
        const pushManager = service.getPushNotificationManager();
        const testResults = await pushManager.testPushCapabilities();
        return testResults.results.deliverySuccessful;
      } catch (err) {
        console.error('Failed to test push notifications:', err);
        return false;
      }
    }, [service])
  };
};

// ===============================
// UTILITY HOOKS
// ===============================

/**
 * Hook for listening to specific real-time messages
 */
export const useRealtimeMessage = <T = any>(
  messageType: string,
  handler: RealtimeEventHandler<T>,
  deps: React.DependencyList = []
): void => {
  const { service } = useRealtime();

  useEffect(() => {
    if (!service) return;

    const cleanup = service.onMessage((message: RealtimeMessage) => {
      if (message.type === messageType) {
        handler(message.payload as T);
      }
    });

    return cleanup;
  }, [service, messageType, ...deps]);
};

/**
 * Hook for monitoring connection quality
 */
export const useConnectionQuality = (): {
  quality: ConnectionStatus['connectionQuality'];
  isGood: boolean;
  shouldWarn: boolean;
} => {
  const { connectionQuality } = useRealtime();

  return {
    quality: connectionQuality,
    isGood: connectionQuality === 'excellent' || connectionQuality === 'good',
    shouldWarn: connectionQuality === 'poor' || connectionQuality === 'unknown'
  };
};

/**
 * Hook for real-time metrics with automatic updates
 */
export const useRealtimeMetrics = (updateInterval: number = 30000): RealtimeServiceMetrics | null => {
  const { metrics, service } = useRealtime();
  const [localMetrics, setLocalMetrics] = useState<RealtimeServiceMetrics | null>(metrics);

  useEffect(() => {
    if (!service) return;

    const interval = setInterval(async () => {
      try {
        const currentMetrics = await service.getMetrics();
        setLocalMetrics(currentMetrics);
      } catch (err) {
        console.error('Failed to update metrics:', err);
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [service, updateInterval]);

  return localMetrics || metrics;
};