interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallationState {
  isInstallable: boolean;
  isInstalled: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  hasShownPrompt: boolean;
}

interface PWACapabilities {
  serviceWorker: boolean;
  pushNotifications: boolean;
  backgroundSync: boolean;
  offlineStorage: boolean;
  installPrompt: boolean;
  standalone: boolean;
}

export class PWAManager {
  private static instance: PWAManager;
  private state: PWAInstallationState = {
    isInstallable: false,
    isInstalled: false,
    installPrompt: null,
    hasShownPrompt: false,
  };

  private capabilities: PWACapabilities = {
    serviceWorker: false,
    pushNotifications: false,
    backgroundSync: false,
    offlineStorage: false,
    installPrompt: false,
    standalone: false,
  };

  private eventListeners: Map<string, Function[]> = new Map();
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initializePWA();
  }

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  // Initialize PWA features
  private async initializePWA() {
    console.log('[PWA] Initializing PWA Manager');

    // Check capabilities
    await this.checkCapabilities();

    // Register service worker
    await this.registerServiceWorker();

    // Setup install prompt
    this.setupInstallPrompt();

    // Check if already installed
    this.checkInstallationStatus();

    // Setup message handling
    this.setupServiceWorkerMessaging();

    console.log('[PWA] PWA Manager initialized', {
      capabilities: this.capabilities,
      state: this.state,
    });
  }

  // Check PWA capabilities
  private async checkCapabilities() {
    this.capabilities = {
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window && 'Notification' in window,
      backgroundSync:
        'serviceWorker' in navigator &&
        'sync' in window.ServiceWorkerRegistration.prototype,
      offlineStorage: 'localStorage' in window && 'indexedDB' in window,
      installPrompt:
        'BeforeInstallPromptEvent' in window ||
        navigator.userAgent.includes('Chrome') ||
        navigator.userAgent.includes('Edge'),
      standalone:
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as any).standalone === true,
    };
  }

  // Register service worker
  private async registerServiceWorker() {
    if (!this.capabilities.serviceWorker) {
      console.warn('[PWA] Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        '/sw-mobile-enhanced.js',
        {
          scope: '/',
          updateViaCache: 'none', // Always check for updates
        }
      );

      this.serviceWorkerRegistration = registration;

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.emit('sw-update-available', { registration });
            }
          });
        }
      });

      // Check for existing update
      if (registration.waiting) {
        this.emit('sw-update-available', { registration });
      }

      console.log('[PWA] Service Worker registered successfully');
      this.emit('sw-registered', { registration });
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      this.emit('sw-registration-failed', { error });
    }
  }

  // Setup install prompt handling
  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', event => {
      console.log('[PWA] Install prompt available');
      event.preventDefault();

      this.state.isInstallable = true;
      this.state.installPrompt = event as BeforeInstallPromptEvent;

      this.emit('installable', { prompt: this.state.installPrompt });
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
      this.state.isInstalled = true;
      this.state.isInstallable = false;
      this.state.installPrompt = null;

      this.emit('installed');
    });
  }

  // Check if app is already installed
  private checkInstallationStatus() {
    this.state.isInstalled = this.capabilities.standalone;

    if (this.state.isInstalled) {
      console.log('[PWA] App is running as installed PWA');
      this.emit('already-installed');
    }
  }

  // Setup service worker messaging
  private setupServiceWorkerMessaging() {
    if (!this.capabilities.serviceWorker) return;

    navigator.serviceWorker.addEventListener('message', event => {
      const { type, data } = event.data;

      switch (type) {
        case 'SYNC_COMPLETE':
          this.emit('sync-complete', data);
          break;
        case 'ALARM_TRIGGERED':
          this.emit('alarm-triggered', data);
          break;
        case 'ALARM_DISMISSED':
          this.emit('alarm-dismissed', data);
          break;
        case 'ALARM_SNOOZED':
          this.emit('alarm-snoozed', data);
          break;
        case 'NETWORK_STATUS':
          this.emit('network-status', data);
          break;
        default:
          console.log('[PWA] Unknown SW message:', type, data);
      }
    });
  }

  // Public API Methods

  // Show install prompt
  async showInstallPrompt(): Promise<boolean> {
    if (!this.state.isInstallable || !this.state.installPrompt) {
      console.warn('[PWA] Install prompt not available');
      return false;
    }

    try {
      await this.state.installPrompt.prompt();
      const choiceResult = await this.state.installPrompt.userChoice;

      this.state.hasShownPrompt = true;

      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
        this.emit('install-accepted');
        return true;
      } else {
        console.log('[PWA] User dismissed install prompt');
        this.emit('install-dismissed');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      this.emit('install-error', { error });
      return false;
    }
  }

  // Check if install prompt should be shown
  shouldShowInstallPrompt(): boolean {
    return (
      this.state.isInstallable && !this.state.hasShownPrompt && !this.state.isInstalled
    );
  }

  // Force service worker update
  async updateServiceWorker(): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service Worker not registered');
    }

    try {
      await this.serviceWorkerRegistration.update();

      if (this.serviceWorkerRegistration.waiting) {
        // Tell the waiting service worker to skip waiting
        this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    } catch (error) {
      console.error('[PWA] Service Worker update failed:', error);
      throw error;
    }
  }

  // Request push notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.capabilities.pushNotifications) {
      throw new Error('Push notifications not supported');
    }

    try {
      const permission = await Notification.requestPermission();
      this.emit('notification-permission-changed', { permission });
      return permission;
    } catch (error) {
      console.error('[PWA] Notification permission request failed:', error);
      throw error;
    }
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration || !this.capabilities.pushNotifications) {
      throw new Error('Push notifications not available');
    }

    if (Notification.permission !== 'granted') {
      const permission = await this.requestNotificationPermission();
      if (permission !== 'granted') {
        return null;
      }
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || ''
        ),
      });

      this.emit('push-subscribed', { subscription });
      return subscription;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      throw error;
    }
  }

  // Get current push subscription
  async getPushSubscription(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      return null;
    }

    try {
      return await this.serviceWorkerRegistration.pushManager.getSubscription();
    } catch (error) {
      console.error('[PWA] Failed to get push subscription:', error);
      return null;
    }
  }

  // Check if app is offline
  isOffline(): boolean {
    return !navigator.onLine;
  }

  // Get PWA capabilities
  getCapabilities(): PWACapabilities {
    return { ...this.capabilities };
  }

  // Get PWA state
  getState(): PWAInstallationState {
    return { ...this.state };
  }

  // Send message to service worker
  sendMessageToSW(message: any): void {
    if (!this.capabilities.serviceWorker || !navigator.serviceWorker.controller) {
      console.warn('[PWA] Cannot send message: Service Worker not available');
      return;
    }

    navigator.serviceWorker.controller.postMessage(message);
  }

  // Event handling
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[PWA] Event listener error for ${event}:`, error);
        }
      });
    }
  }

  // Utility functions
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Cleanup
  destroy(): void {
    this.eventListeners.clear();
    this.serviceWorkerRegistration = null;
  }
}

// Create singleton instance
export const pwaManager = PWAManager.getInstance();
