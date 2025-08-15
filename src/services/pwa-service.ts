import { OfflineManager } from './offline-manager';
import { NotificationService } from './notification';

export interface PWACapabilities {
  serviceWorker: boolean;
  backgroundSync: boolean;
  pushNotifications: boolean;
  installPrompt: boolean;
  offlineSupport: boolean;
  periodicSync: boolean;
}

export interface PWAInstallPrompt {
  canInstall: boolean;
  isInstalled: boolean;
  installPrompt: Event | null;
}

export interface BackgroundSyncStatus {
  enabled: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  failedSyncs: number;
}

export interface PushSubscriptionInfo {
  subscribed: boolean;
  endpoint: string | null;
  keys: {
    p256dh: string | null;
    auth: string | null;
  };
}

export class PWAService {
  private static instance: PWAService;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private deferredInstallPrompt: Event | null = null;
  private installPromptListeners: ((canInstall: boolean) => void)[] = [];
  private updateListeners: ((hasUpdate: boolean) => void)[] = [];
  private syncListeners: ((status: BackgroundSyncStatus) => void)[] = [];
  private networkListeners: ((isOnline: boolean) => void)[] = [];
  
  private isInitialized = false;
  private lastSyncTime: Date | null = null;
  private failedSyncCount = 0;
  private updateAvailable = false;
  private newServiceWorker: ServiceWorker | null = null;

  static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService();
    }
    return PWAService.instance;
  }

  private constructor() {
    // Private constructor for singleton
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      console.log('PWA Service: Initializing...');

      // Initialize base services first
      await OfflineManager.initialize();
      await NotificationService.initialize();

      // Set up install prompt listener
      this.setupInstallPromptListener();

      // Register enhanced service worker
      await this.registerEnhancedServiceWorker();

      // Set up background sync
      await this.setupBackgroundSync();

      // Set up network listeners
      this.setupNetworkListeners();

      // Set up periodic sync
      this.setupPeriodicSync();

      // Check for updates
      this.checkForUpdates();

      this.isInitialized = true;
      console.log('PWA Service: Initialization complete');
      return true;
    } catch (error) {
      console.error('PWA Service: Initialization failed:', error);
      return false;
    }
  }

  private async registerEnhancedServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('PWA Service: Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw-enhanced.js', {
        scope: '/'
      });

      this.serviceWorkerRegistration = registration;
      console.log('PWA Service: Enhanced service worker registered');

      // Set up update detection
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          this.newServiceWorker = newWorker;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              this.notifyUpdateListeners(true);
            }
          });
        }
      });

      // Set up message listener
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
    } catch (error) {
      console.error('PWA Service: Service worker registration failed:', error);
    }
  }

  private setupInstallPromptListener(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('PWA Service: Install prompt available');
      event.preventDefault();
      this.deferredInstallPrompt = event;
      this.notifyInstallPromptListeners(true);
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA Service: App installed');
      this.deferredInstallPrompt = null;
      this.notifyInstallPromptListeners(false);
    });
  }

  private async setupBackgroundSync(): Promise<void> {
    if (!this.serviceWorkerRegistration || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('PWA Service: Background Sync not supported');
      return;
    }

    try {
      // Register background sync for different data types
      const syncTags = [
        'alarms-sync',
        'sleep-sync',
        'voice-sync',
        'analytics-sync',
        'settings-sync',
        'user-data-sync'
      ];

      for (const tag of syncTags) {
        await this.serviceWorkerRegistration.sync.register(tag);
      }

      console.log('PWA Service: Background sync registered for all data types');
    } catch (error) {
      console.error('PWA Service: Background sync registration failed:', error);
    }
  }

  private setupNetworkListeners(): void {
    const updateNetworkStatus = (isOnline: boolean) => {
      console.log('PWA Service: Network status changed:', isOnline ? 'online' : 'offline');
      this.notifyNetworkListeners(isOnline);
      
      if (isOnline) {
        // Trigger sync when coming back online
        this.triggerBackgroundSync();
      }
    };

    window.addEventListener('online', () => updateNetworkStatus(true));
    window.addEventListener('offline', () => updateNetworkStatus(false));

    // Initial status
    updateNetworkStatus(navigator.onLine);
  }

  private setupPeriodicSync(): void {
    // Periodic sync every 15 minutes when app is active
    setInterval(() => {
      if (navigator.onLine && !document.hidden) {
        this.triggerBackgroundSync();
      }
    }, 15 * 60 * 1000);

    // Sync when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        this.triggerBackgroundSync();
      }
    });
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'SYNC_COMPLETE':
        this.lastSyncTime = new Date();
        this.failedSyncCount = 0;
        this.notifySyncListeners();
        break;

      case 'SYNC_FAILED':
        this.failedSyncCount++;
        this.notifySyncListeners();
        break;

      case 'NETWORK_STATUS':
        this.notifyNetworkListeners(data.isOnline);
        break;

      case 'CACHE_UPDATED':
        console.log('PWA Service: Cache updated');
        break;

      case 'ALARM_TRIGGERED':
        // Forward alarm triggers to main app
        window.dispatchEvent(new CustomEvent('alarm-triggered', {
          detail: data.alarm
        }));
        break;

      default:
        console.log('PWA Service: Unknown message from service worker:', type);
    }
  }

  // Public API methods

  async installApp(): Promise<boolean> {
    if (!this.deferredInstallPrompt) {
      console.warn('PWA Service: No install prompt available');
      return false;
    }

    try {
      const promptEvent = this.deferredInstallPrompt as any;
      promptEvent.prompt();
      
      const result = await promptEvent.userChoice;
      
      if (result.outcome === 'accepted') {
        console.log('PWA Service: User accepted install prompt');
        this.deferredInstallPrompt = null;
        this.notifyInstallPromptListeners(false);
        return true;
      } else {
        console.log('PWA Service: User dismissed install prompt');
        return false;
      }
    } catch (error) {
      console.error('PWA Service: Install prompt failed:', error);
      return false;
    }
  }

  getInstallPromptStatus(): PWAInstallPrompt {
    return {
      canInstall: !!this.deferredInstallPrompt,
      isInstalled: this.isAppInstalled(),
      installPrompt: this.deferredInstallPrompt
    };
  }

  private isAppInstalled(): boolean {
    // Check if running as PWA
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as any).standalone === true;
  }

  async updateApp(): Promise<boolean> {
    if (!this.updateAvailable || !this.newServiceWorker) {
      console.warn('PWA Service: No update available');
      return false;
    }

    try {
      // Send skip waiting message to new service worker
      if (this.newServiceWorker.state === 'installed') {
        this.newServiceWorker.postMessage({ type: 'SKIP_WAITING' });
      }

      // Wait for new service worker to take control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      return true;
    } catch (error) {
      console.error('PWA Service: Update failed:', error);
      return false;
    }
  }

  hasUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  async checkForUpdates(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) return false;

    try {
      await this.serviceWorkerRegistration.update();
      return this.updateAvailable;
    } catch (error) {
      console.error('PWA Service: Update check failed:', error);
      return false;
    }
  }

  async subscribeToPushNotifications(): Promise<PushSubscriptionInfo> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not registered');
    }

    if (!('PushManager' in window)) {
      throw new Error('Push notifications not supported');
    }

    try {
      // Get existing subscription
      let subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          throw new Error('VAPID public key not configured');
        }

        subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      // Send subscription to service worker
      this.sendMessageToServiceWorker('REGISTER_PUSH', { subscription });

      const subscriptionJson = subscription.toJSON();
      return {
        subscribed: true,
        endpoint: subscriptionJson.endpoint || null,
        keys: {
          p256dh: subscriptionJson.keys?.p256dh || null,
          auth: subscriptionJson.keys?.auth || null
        }
      };
    } catch (error) {
      console.error('PWA Service: Push subscription failed:', error);
      return {
        subscribed: false,
        endpoint: null,
        keys: { p256dh: null, auth: null }
      };
    }
  }

  async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) return false;

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('PWA Service: Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('PWA Service: Unsubscribe failed:', error);
      return false;
    }
  }

  async getPushSubscriptionInfo(): Promise<PushSubscriptionInfo> {
    if (!this.serviceWorkerRegistration) {
      return {
        subscribed: false,
        endpoint: null,
        keys: { p256dh: null, auth: null }
      };
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (subscription) {
        const subscriptionJson = subscription.toJSON();
        return {
          subscribed: true,
          endpoint: subscriptionJson.endpoint || null,
          keys: {
            p256dh: subscriptionJson.keys?.p256dh || null,
            auth: subscriptionJson.keys?.auth || null
          }
        };
      }

      return {
        subscribed: false,
        endpoint: null,
        keys: { p256dh: null, auth: null }
      };
    } catch (error) {
      console.error('PWA Service: Get subscription info failed:', error);
      return {
        subscribed: false,
        endpoint: null,
        keys: { p256dh: null, auth: null }
      };
    }
  }

  async triggerBackgroundSync(tags?: string[]): Promise<void> {
    if (!this.serviceWorkerRegistration || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('PWA Service: Background Sync not available');
      return;
    }

    const defaultTags = [
      'alarms-sync',
      'sleep-sync',
      'voice-sync',
      'analytics-sync',
      'settings-sync',
      'user-data-sync'
    ];

    const syncTags = tags || defaultTags;

    try {
      for (const tag of syncTags) {
        await this.serviceWorkerRegistration.sync.register(tag);
      }
      console.log('PWA Service: Background sync triggered for tags:', syncTags);
    } catch (error) {
      console.error('PWA Service: Background sync trigger failed:', error);
    }
  }

  async forceSync(): Promise<void> {
    this.sendMessageToServiceWorker('FORCE_SYNC', {});
  }

  getBackgroundSyncStatus(): BackgroundSyncStatus {
    return {
      enabled: this.serviceWorkerRegistration !== null && 'sync' in window.ServiceWorkerRegistration.prototype,
      lastSync: this.lastSyncTime,
      nextSync: null, // Would calculate based on sync strategy
      failedSyncs: this.failedSyncCount
    };
  }

  getPWACapabilities(): PWACapabilities {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      backgroundSync: 'sync' in window.ServiceWorkerRegistration.prototype,
      pushNotifications: 'PushManager' in window,
      installPrompt: !!this.deferredInstallPrompt,
      offlineSupport: this.serviceWorkerRegistration !== null,
      periodicSync: 'periodicSync' in window.ServiceWorkerRegistration.prototype
    };
  }

  sendMessageToServiceWorker(type: string, data: any): void {
    if (!this.serviceWorkerRegistration?.active) {
      console.warn('PWA Service: No active service worker to send message to');
      return;
    }

    this.serviceWorkerRegistration.active.postMessage({ type, data });
  }

  // Queue analytics for offline processing
  queueAnalytics(event: any): void {
    this.sendMessageToServiceWorker('QUEUE_ANALYTICS', { event });
  }

  // Event listeners
  addInstallPromptListener(listener: (canInstall: boolean) => void): void {
    this.installPromptListeners.push(listener);
  }

  removeInstallPromptListener(listener: (canInstall: boolean) => void): void {
    const index = this.installPromptListeners.indexOf(listener);
    if (index > -1) {
      this.installPromptListeners.splice(index, 1);
    }
  }

  addUpdateListener(listener: (hasUpdate: boolean) => void): void {
    this.updateListeners.push(listener);
  }

  removeUpdateListener(listener: (hasUpdate: boolean) => void): void {
    const index = this.updateListeners.indexOf(listener);
    if (index > -1) {
      this.updateListeners.splice(index, 1);
    }
  }

  addSyncListener(listener: (status: BackgroundSyncStatus) => void): void {
    this.syncListeners.push(listener);
  }

  removeSyncListener(listener: (status: BackgroundSyncStatus) => void): void {
    const index = this.syncListeners.indexOf(listener);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  addNetworkListener(listener: (isOnline: boolean) => void): void {
    this.networkListeners.push(listener);
  }

  removeNetworkListener(listener: (isOnline: boolean) => void): void {
    const index = this.networkListeners.indexOf(listener);
    if (index > -1) {
      this.networkListeners.splice(index, 1);
    }
  }

  // Private helper methods
  private notifyInstallPromptListeners(canInstall: boolean): void {
    this.installPromptListeners.forEach(listener => {
      try {
        listener(canInstall);
      } catch (error) {
        console.error('PWA Service: Install prompt listener error:', error);
      }
    });
  }

  private notifyUpdateListeners(hasUpdate: boolean): void {
    this.updateListeners.forEach(listener => {
      try {
        listener(hasUpdate);
      } catch (error) {
        console.error('PWA Service: Update listener error:', error);
      }
    });
  }

  private notifySyncListeners(): void {
    const status = this.getBackgroundSyncStatus();
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('PWA Service: Sync listener error:', error);
      }
    });
  }

  private notifyNetworkListeners(isOnline: boolean): void {
    this.networkListeners.forEach(listener => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error('PWA Service: Network listener error:', error);
      }
    });
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Cleanup
  destroy(): void {
    this.installPromptListeners = [];
    this.updateListeners = [];
    this.syncListeners = [];
    this.networkListeners = [];
    this.serviceWorkerRegistration = null;
    this.deferredInstallPrompt = null;
    this.isInitialized = false;
  }
}

export default PWAService;