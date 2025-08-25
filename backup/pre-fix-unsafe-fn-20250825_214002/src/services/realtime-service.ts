/// <reference types="node" />
/// <reference lib="dom" />
// Real-time Service for Relife Smart Alarm
// Handles WebSocket connections, live updates, push notifications, and real-time features

import { supabase } from './supabase';
import { ErrorHandler } from './error-handler';
import PerformanceMonitor from './performance-monitor';
import type { Alarm, User } from '../types';
import { TimeoutHandle } from '../types/timers';
import AnalyticsService from './analytics';
import { ErrorHandler } from './error-handler';
// Note: User data should be passed as parameters or retrieved from auth context

export interface RealtimeConfig {
  enableWebSocket: boolean;
  enablePushNotifications: boolean;
  enableLiveUpdates: boolean;
  enablePresenceTracking: boolean;
  heartbeatInterval: number;
  reconnectAttempts: number;
  reconnectDelay: number;
}

export interface PresenceData {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  deviceInfo?: {
    type: string;
    platform: string;
    userAgent: string;
  };
}

export interface LiveUpdate {
  type:
    | 'alarm_triggered'
    | 'alarm_dismissed'
    | 'alarm_created'
    | 'user_status'
    | 'recommendation';
  data: any;
  timestamp: Date;
  userId: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class RealtimeService {
  private static instance: RealtimeService;
  private websocket: WebSocket | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private config: RealtimeConfig;
  private isConnected = false;
  private reconnectAttempt = 0;
  private heartbeatTimer?: number;
  private subscriptions = new Map<string, any>();
  private presenceData: PresenceData | null = null;
  private eventListeners = new Map<string, Set<Function>>();
  private performanceMonitor = PerformanceMonitor.getInstance();

  private constructor() {
    this._config = {
      enableWebSocket: true,
      enablePushNotifications: true,
      enableLiveUpdates: true,
      enablePresenceTracking: true,
      heartbeatInterval: 30000, // 30 seconds
      reconnectAttempts: 5,
      reconnectDelay: 2000, // 2 seconds
    };
  }

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Initialize the real-time service
   */
  async initialize(_user: User, _config?: Partial<RealtimeConfig>): Promise<void> {
    try {
      if (_config) {
        this.config = { ...this.config, ..._config };
      }

      // Initialize push notifications
      if (this._config.enablePushNotifications) {
        await this.initializePushNotifications();
      }

      // Initialize WebSocket connection
      if (this._config.enableWebSocket) {
        await this.initializeWebSocket(_user);
      }

      // Initialize Supabase real-time subscriptions
      if (this._config.enableLiveUpdates) {
        await this.initializeLiveUpdates(_user);
      }

      // Initialize presence tracking
      if (this._config.enablePresenceTracking) {
        await this.initializePresenceTracking(_user);
      }

      console.info('Real-time service initialized successfully');
      this.performanceMonitor.trackCustomMetric('realtime_service_initialized', 1);
    } catch (_error) {
      ErrorHandler.handleError(
        _error as Error,
        'Failed to initialize real-time service',
        { context: 'RealtimeService.initialize' }
      );
    }
  }

  /**
   * Initialize push notifications
   */
  private async initializePushNotifications(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return;
      }

      if (!('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return;
      }

      // Register service worker
      // Use existing registration from ServiceWorkerManager instead of registering again
      this.serviceWorkerRegistration =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register('/sw-unified.js'));
      console.info('Service Worker registered');

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.info('Notification permission granted');
        await this.subscribeToPushNotifications();
      } else {
        console.warn('Notification permission denied');
      }
    } catch (_error) {
      console._error('Failed to initialize push notifications:', _error);
    }
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToPushNotifications(): Promise<void> {
    try {
      if (!this.serviceWorkerRegistration) {
        throw new Error('Service Worker not registered');
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
        ),
      });

      // Store subscription in Supabase
      const { _error } = await supabase.from('push_subscriptions').upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        subscription: JSON.stringify(subscription),
        created_at: new Date().toISOString(),
      });

      if (_error) {
        throw _error;
      }

      console.info('Push notification subscription created');
    } catch (_error) {
      console._error('Failed to subscribe to push notifications:', _error);
    }
  }

  /**
   * Initialize WebSocket connection for real-time communication
   */
  private async initializeWebSocket(_user: User): Promise<void> {
    try {
      const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080';
      this.websocket = new WebSocket(`${wsUrl}?userId=${_user.id}`);

      this.websocket.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempt = 0;
        console.info('WebSocket connected');
        this.startHeartbeat();
        this.emit('websocket_connected');
        this.performanceMonitor.trackCustomMetric('websocket_connected', 1);
      };

      this.websocket.onmessage = event => {
        try {
          const data = JSON.parse(_event.data);
          this.handleWebSocketMessage(data);
        } catch (_error) {
          console._error('Failed to parse WebSocket message:', _error);
        }
      };

      this.websocket.onclose = () => {
        this.isConnected = false;
        console.warn('WebSocket disconnected');
        this.stopHeartbeat();
        this.emit('websocket_disconnected');
        this.attemptReconnect(_user);
      };

      this.websocket.onerror = error => {
        console.error('WebSocket _error:', _error);
        this.emit('websocket_error', _error);
      };
    } catch (_error) {
      console._error('Failed to initialize WebSocket:', _error);
    }
  }

  /**
   * Initialize Supabase real-time subscriptions
   */
  private async initializeLiveUpdates(_user: User): Promise<void> {
    try {
      // Subscribe to user-specific alarm changes
      const alarmChannel = supabase
        .channel(`user-alarms-${_user.id}`)
        .on(
          'postgres_changes',
          {
            _event: '*',
            schema: 'public',
            table: 'alarms',
            filter: `user_id=eq.${_user.id}`,
          },
          payload => {
            this.handleDatabaseChange('alarm', payload);
          }
        )
        .on(
          'postgres_changes',
          {
            _event: '*',
            schema: 'public',
            table: 'alarm_events',
            filter: `alarm_id=in.(${this.getUserAlarmIds(_user.id)})`,
          },
          payload => {
            this.handleDatabaseChange('alarm_event', payload);
          }
        )
        .subscribe();

      this.subscriptions.set('alarms', alarmChannel);

      // Subscribe to recommendations
      const recommendationChannel = supabase
        .channel(`user-recommendations-${_user.id}`)
        .on(
          'postgres_changes',
          {
            _event: 'INSERT',
            schema: 'public',
            table: 'smart_recommendations',
            filter: `user_id=eq.${_user.id}`,
          },
          payload => {
            this.handleDatabaseChange('recommendation', payload);
          }
        )
        .subscribe();

      this.subscriptions.set('recommendations', recommendationChannel);

      console.info('Live updates initialized');
    } catch (_error) {
      console._error('Failed to initialize live updates:', _error);
    }
  }

  /**
   * Initialize presence tracking
   */
  private async initializePresenceTracking(_user: User): Promise<void> {
    try {
      this.presenceData = {
        userId: user.id,
        status: 'online',
        lastSeen: new Date(),
        deviceInfo: {
          type: this.getDeviceType(),
          platform: navigator.platform,
          userAgent: navigator.userAgent,
        },
      };

      // Track presence using Supabase real-time
      const presenceChannel = supabase
        .channel('presence-tracking')
        .on('presence', { _event: 'sync' }, () => {
          const presenceState = presenceChannel.presenceState();
          this.emit('presence_updated', presenceState);
        })
        .on('presence', { _event: 'join' }, ({ key, newPresences }) => {
          this.emit('user_joined', { key, newPresences });
        })
        .on('presence', { _event: 'leave' }, ({ key, leftPresences }) => {
          this.emit('user_left', { key, leftPresences });
        })
        .subscribe(async status => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track(this.presenceData!);
          }
        });

      this.subscriptions.set('presence', presenceChannel);

      // Update presence periodically
      setInterval(() => {
        if (this.presenceData) {
          this.presenceData.lastSeen = new Date();
          presenceChannel.track(this.presenceData);
        }
      }, 30000); // Every 30 seconds

      // Handle page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (this.presenceData) {
          this.presenceData.status = document.hidden ? 'away' : 'online';
          this.presenceData.lastSeen = new Date();
          presenceChannel.track(this.presenceData);
        }
      });
    } catch (_error) {
      console._error('Failed to initialize presence tracking:', _error);
    }
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(data: any): void {
    try {
      switch (data.type) {
        case 'alarm_trigger':
          this.emit('alarm_triggered', data.payload);
          this.showNotification({
            title: 'Alarm Triggered! ⏰',
            body: data.payload.message || 'Time to wake up!',
            tag: `alarm-${data.payload.alarmId}`,
            data: data.payload,
          });
          break;

        case 'recommendation_generated':
          this.emit('recommendation_generated', data.payload);
          break;

        case 'user_activity':
          this.emit('user_activity_detected', data.payload);
          break;

        case 'heartbeat_response':
          // Heartbeat acknowledged
          break;

        default:
          console.warn('Unknown WebSocket message type:', data.type);
      }

      this.performanceMonitor.trackCustomMetric('websocket_message_received', 1, {
        type: data.type,
      });
    } catch (_error) {
      console._error('Failed to handle WebSocket message:', _error);
    }
  }

  /**
   * Handle database changes from Supabase
   */
  private handleDatabaseChange(table: string, payload: any): void {
    try {
      const liveUpdate: LiveUpdate = {
        type: this.getUpdateType(table, payload.eventType),
        data: payload,
        timestamp: new Date(),
        userId: payload.new?.user_id || payload.old?.user_id,
      };

      this.emit('live_update', liveUpdate);
      this.performanceMonitor.trackCustomMetric('database_change_received', 1, {
        table,
        eventType: payload.eventType,
      });
    } catch (_error) {
      console._error('Failed to handle database change:', _error);
    }
  }

  /**
   * Send a real-time message via WebSocket
   */
  sendMessage(type: string, payload: any): void {
    if (!this.isConnected || !this.websocket) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    try {
      const message = {
        type,
        payload,
        timestamp: new Date().toISOString(),
        userId: this.presenceData?.userId,
      };

      this.websocket.send(JSON.stringify(message));
      this.performanceMonitor.trackCustomMetric('websocket_message_sent', 1, {
        type,
      });
    } catch (_error) {
      console._error('Failed to send WebSocket message:', _error);
    }
  }

  /**
   * Show a push notification
   */
  async showNotification(notification: PushNotificationPayload): Promise<void> {
    try {
      if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      // Check if page is visible
      if (!document.hidden) {
        // Page is visible, show in-app notification instead
        this.emit('in_app_notification', notification);
        return;
      }

      const notificationInstance = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icon-192x192.png',
        badge: notification.badge || '/icon-72x72.png',
        tag: notification.tag,
        data: notification.data,
        requireInteraction: true,
      });

      // Handle notification clicks
      notificationInstance.onclick = () => {
        window.focus();
        notificationInstance.close();
        this.emit('notification_clicked', notification);
      };

      this.performanceMonitor.trackCustomMetric('notification_shown', 1);
    } catch (_error) {
      console._error('Failed to show notification:', _error);
    }
  }

  /**
   * Add event listener
   */
  on(_event: string, callback: Function): void {
    if (!this.eventListeners.has(_event)) {
      this.eventListeners.set(_event, new Set());
    }
    this.eventListeners.get(_event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(_event: string, callback: Function): void {
    const listeners = this.eventListeners.get(_event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(_event: string, data?: any): void {
    const listeners = this.eventListeners.get(_event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (_error) {
          console._error(`Error in event listener for ${_event}:`, _error);
        }
      });
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.sendMessage('heartbeat', { timestamp: Date.now() });
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private async attemptReconnect(_user: User): Promise<void> {
    if (this.reconnectAttempt >= this._config.reconnectAttempts) {
      console._error('Max reconnection attempts reached');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempt++;
    console.info(
      `Attempting to reconnect... (${this.reconnectAttempt}/${this._config.reconnectAttempts})`
    );

    setTimeout(
      () => {
        if (!this.isConnected) {
          this.initializeWebSocket(_user);
        }
      },
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempt - 1)
    ); // Exponential backoff
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    websocket: boolean;
    supabase: boolean;
    pushNotifications: boolean;
    presenceTracking: boolean;
  } {
    return {
      websocket: this.isConnected,
      supabase: this.subscriptions.size > 0,
      pushNotifications: Notification.permission === 'granted',
      presenceTracking: this.presenceData !== null,
    };
  }

  /**
   * Utility functions
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private getDeviceType(): string {
    const width = window.screen.width;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getUpdateType(table: string, eventType: string): LiveUpdate['type'] {
    if (table === 'alarms') {
      if (eventType === 'INSERT') return 'alarm_created';
      return 'alarm_dismissed'; // Fallback
    }
    if (table === 'alarm_events') {
      return 'alarm_triggered';
    }
    if (table === 'smart_recommendations') {
      return 'recommendation';
    }
    return 'user_status';
  }

  private async getUserAlarmIds(userId: string): Promise<string> {
    try {
      const { data: alarms } = await supabase
        .from('alarms')
        .select('id')
        .eq('user_id', userId);

      return alarms?.map((a: any) => a.id).join(',') || '';
    } catch (_error) {
      console._error('Failed to get _user alarm IDs:', _error);
      return '';
    }
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect(): Promise<void> {
    try {
      // Close WebSocket
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }

      // Unsubscribe from all Supabase channels
      for (const [key, subscription] of this.subscriptions) {
        await subscription.unsubscribe();
      }
      this.subscriptions.clear();

      // Stop heartbeat
      this.stopHeartbeat();

      // Clear presence
      this.presenceData = null;

      // Clear event listeners
      this.eventListeners.clear();

      console.info('Real-time service disconnected');
    } catch (_error) {
      console._error('Error disconnecting real-time service:', _error);
    }
  }
}

export default RealtimeService;
