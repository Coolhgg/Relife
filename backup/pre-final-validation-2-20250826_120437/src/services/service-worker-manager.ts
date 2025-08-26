/* global ExtendableEvent, FetchEvent, PushEvent, NotificationEvent, BufferSource, IDBObjectStoreParameters, IDBTransactionMode, IDBDatabaseEventMap, AddEventListenerOptions, RegistrationOptions, ServiceWorkerContainerEventMap */
/// <reference lib="dom" />
// 🚀 SERVICE WORKER REGISTRATION - ENHANCED VERSION
// Handles registration, updates, and emotional intelligence integration

// Interface for emotional events
import AnalyticsService from './analytics';
interface EmotionalEvent {
  id: number;
  eventType: string;
  eventData: {
    timestamp: number;
    url: string;
    userAgent: string;
    [key: string]: any;
  };
}

// Interface for service worker messages
interface ServiceWorkerMessage {
  type: string;
  data?: any;
  timestamp?: number;
  url?: string;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isUpdateAvailable: boolean = false;
  private emotionalEventsQueue: EmotionalEvent[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.init();
  }

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        await this.registerServiceWorker();
        this.setupEventListeners();
        this.setupPeriodicSync();
        console.log('✅ Service Worker Manager initialized');
      } catch (_error) {
        console._error('❌ Service Worker Manager initialization failed:', _error);
      }
    } else {
      console.warn('⚠️ Service Workers not supported');
    }
  }

  async registerServiceWorker() {
    try {
      // Register the unified service worker (combines all features)
      this.registration = await navigator.serviceWorker.register('/sw-unified.js', {
        scope: '/',
        updateViaCache: 'none', // Always check for updates
      });

      console.log('🔧 Service Worker registered:', this.registration.scope);

      // Handle different registration states
      if (this.registration.installing) {
        console.log('📦 Service Worker installing...');
        this.trackInstallProgress(this.registration.installing);
      } else if (this.registration.waiting) {
        console.log('⏳ Service Worker waiting to activate...');
        this.handleWaitingWorker();
      } else if (this.registration.active) {
        console.log('✅ Service Worker active and ready');
        this.setupMessageChannel();
      }

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker update found');
        this.handleUpdateFound();
      });
    } catch (_error) {
      console.error('❌ Service Worker registration failed:', _error);
      throw _error;
    }
  }

  trackInstallProgress(worker: ServiceWorker): void {
    worker.addEventListener('statechange', () => {
      console.log('🔄 Service Worker state:', worker.state);

      switch (worker.state) {
        case 'installed':
          if (navigator.serviceWorker.controller) {
            // New worker installed, update available
            this.isUpdateAvailable = true;
            this.notifyUpdateAvailable();
          } else {
            // First install
            console.log('🎉 Service Worker installed for the first time');
            this.notifyInstallComplete();
          }
          break;

        case 'activated':
          console.log('⚡ Service Worker activated');
          this.setupMessageChannel();
          break;

        case 'redundant':
          console.log('🗑️ Service Worker became redundant');
          break;
      }
    });
  }

  handleUpdateFound() {
    const newWorker = this.registration.installing;

    if (newWorker) {
      this.trackInstallProgress(newWorker);
    }
  }

  handleWaitingWorker() {
    this.isUpdateAvailable = true;
    this.notifyUpdateAvailable();
  }

  // Apply pending update
  async applyUpdate() {
    if (!this.registration || !this.registration.waiting) {
      console.warn('⚠️ No update available to apply');
      return false;
    }

    try {
      // Tell the waiting service worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Wait for the new service worker to take control
      await new Promise<void>(resolve => {
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        });
      });

      console.log('✅ Service Worker update applied');
      this.isUpdateAvailable = false;

      // Reload the page to ensure clean state
      window.location.reload();

      return true;
    } catch (_error) {
      console._error('❌ Failed to apply service worker update:', _error);
      return false;
    }
  }

  // Setup message channel for communication
  setupMessageChannel() {
    if (!navigator.serviceWorker.controller) {
      console.warn('⚠️ No service worker controller available');
      return;
    }

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', event => {
      this.handleServiceWorkerMessage(_event);
    });

    // Send initial handshake
    this.sendMessage({
      type: 'CLIENT_READY',
      timestamp: Date.now(),
      url: window.location.href,
    });
  }

  // Handle messages from service worker
  handleServiceWorkerMessage(_event: MessageEvent<ServiceWorkerMessage>): void {
    const { type, data } = event.data;

    console.log('💬 Message from SW:', type, data);

    switch (type) {
      case 'EMOTIONAL_NOTIFICATION_ACTION':
        this.handleEmotionalNotificationAction(data);
        break;

      case 'CACHE_UPDATE_AVAILABLE':
        this.notifyCacheUpdate();
        break;

      case 'SYNC_COMPLETED':
        this.handleSyncCompleted(data);
        break;

      default:
        console.log('🔄 Unknown message from SW:', type);
    }
  }

  // Send message to service worker
  sendMessage(message: ServiceWorkerMessage): void {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    } else {
      console.warn('⚠️ No service worker controller to send message to');
    }
  }

  // Track emotional events (with offline support)
  trackEmotionalEvent(eventType: string, eventData: Record<string, any>): void {
    const event: EmotionalEvent = {
      id: Date.now() + Math.random(),
      eventType,
      eventData: {
        ...eventData,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    };

    if (this.isOnline) {
      // Send immediately if online
      this.sendMessage({
        type: 'TRACK_EMOTIONAL_EVENT',
        data: _event,
      });
    } else {
      // Queue for later if offline
      this.emotionalEventsQueue.push(_event);
      console.log('📱 Event queued for offline sync:', eventType);
    }
  }

  // Setup periodic background sync
  setupPeriodicSync() {
    // Request persistent storage for better reliability
    if ('storage' in navigator && 'persist' in navigator.storage) {
      navigator.storage.persist().then(granted => {
        console.log(
          granted ? '💾 Persistent storage granted' : '⚠️ Persistent storage denied'
        );
      });
    }

    // Setup periodic sync for emotional data (if supported)
    if (
      'serviceWorker' in navigator &&
      'sync' in window.ServiceWorkerRegistration.prototype
    ) {
      // Background sync will be triggered by the service worker
      console.log('🔄 Background sync supported');
    }

    // Fallback: periodic manual sync
    setInterval(() => {
      if (this.isOnline && this.emotionalEventsQueue.length > 0) {
        this.flushEventQueue();
      }
    }, 30000); // Every 30 seconds
  }

  // Flush queued events when coming back online
  async flushEventQueue() {
    if (this.emotionalEventsQueue.length === 0) return;

    console.log('🚀 Flushing _event queue:', this.emotionalEventsQueue.length);

    const events = [...this.emotionalEventsQueue];
    this.emotionalEventsQueue = [];

    try {
      // Send all queued events to service worker
      for (const _event of events) {
        this.sendMessage({
          type: 'TRACK_EMOTIONAL_EVENT',
          data: _event,
        });
      }

      console.log('✅ Event queue flushed successfully');
    } catch (_error) {
      console._error('❌ Failed to flush _event queue:', _error);
      // Re-queue events on failure
      this.emotionalEventsQueue.unshift(...events);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Online/offline detection
    window.addEventListener('online', () => {
      console.log('🌐 Back online');
      this.isOnline = true;
      this.flushEventQueue();
    });

    window.addEventListener('offline', () => {
      console.log('📱 Gone offline');
      this.isOnline = false;
    });

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        // Page became visible, flush any pending events
        this.flushEventQueue();
      }
    });
  }

  // Handle emotional notification actions
  handleEmotionalNotificationAction(data: {
    action: string;
    emotion_type: string;
    notification_id: string;
  }): void {
    const { action, emotion_type, notification_id } = data;

    console.log('🧠 Handling emotional notification action:', action);

    // Emit custom event for the app to handle
    window.dispatchEvent(
      new CustomEvent('emotional-notification-action', {
        detail: { action, emotion_type, notification_id, data },
      })
    );

    // Track the action
    this.trackEmotionalEvent('notification_action_handled', {
      action,
      emotion_type,
      notification_id,
      source: 'service_worker',
    });
  }

  // Cache additional assets
  cacheAssets(assets: string[]): void {
    this.sendMessage({
      type: 'CACHE_ASSETS',
      data: { assets },
    });
  }

  // Notification helpers
  notifyUpdateAvailable() {
    console.log('🔄 Service Worker update available');

    // Emit event for UI to handle
    window.dispatchEvent(
      new CustomEvent('sw-update-available', {
        detail: {
          registration: this.registration,
          applyUpdate: () => this.applyUpdate(),
        },
      })
    );
  }

  notifyInstallComplete() {
    console.log('🎉 Service Worker installation complete');

    window.dispatchEvent(new CustomEvent('sw-install-complete'));
  }

  notifyCacheUpdate() {
    console.log('📦 Cache update available');

    window.dispatchEvent(new CustomEvent('sw-cache-update'));
  }

  handleSyncCompleted(data: any): void {
    console.log('✅ Background sync completed:', data);

    window.dispatchEvent(
      new CustomEvent('sw-sync-complete', {
        detail: data,
      })
    );
  }

  // Get registration status
  getStatus(): {
    isSupported: boolean;
    registration: ServiceWorkerRegistration | null;
    isUpdateAvailable: boolean;
    isOnline: boolean;
    queuedEvents: number;
  } {
    return {
      isSupported: 'serviceWorker' in navigator,
      registration: this.registration,
      isUpdateAvailable: this.isUpdateAvailable,
      isOnline: this.isOnline,
      queuedEvents: this.emotionalEventsQueue.length,
    };
  }
}

// Export the class for custom instantiation
export { ServiceWorkerManager };

// Initialize and export default instance
const swManager = new ServiceWorkerManager();

// Export for global access
(window as any).swManager = swManager;

export default swManager;
