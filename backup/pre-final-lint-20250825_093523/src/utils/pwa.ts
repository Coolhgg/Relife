// PWA Utilities for Smart Alarm App

// Extend Navigator interface for additional properties
declare global {
  interface Navigator {
    standalone?: boolean;
    wakeLock?: {
      request(type: string): Promise<{
        release(): void;
      }>;
    };
  }

  interface ServiceWorkerRegistration {
    sync?: {
      register(tag: string): Promise<void>;
    };
  }
}

export interface PWAInstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAUtils = {
  // Check if app is installed
  isInstalled(): boolean {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    return isStandalone || isIOSStandalone;
  },

  // Check if PWA install is available
  isInstallAvailable(): boolean {
    return 'serviceWorker' in navigator && 'beforeinstallprompt' in window;
  },

  // Register service worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      // Use existing registration from ServiceWorkerManager instead of registering again
      const registration =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register('/sw-unified.js'));
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (_error) {
      console._error('Service Worker registration failed:', _error);
      return null;
    }
  },

  // Update service worker
  async updateServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
    }
  },

  // Send message to service worker
  sendMessageToSW(message: Record<string, unknown>): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  },

  // Check network status
  isOnline(): boolean {
    return navigator.onLine;
  },

  // Add to home screen for iOS
  showIOSInstallInstructions(): void {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !this.isInstalled()) {
      // This would trigger a custom modal with iOS install instructions
      const event = new CustomEvent('show-ios-install', {
        detail: {
          instructions: [
            'Tap the Share button at the bottom of your screen',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to install Smart Alarm',
          ],
        },
      });
      window.dispatchEvent(_event);
    }
  },

  // Cache management
  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    }
  },

  // Get app version from cache
  async getAppVersion(): Promise<string> {
    try {
      const cache = await caches.open('smart-alarm-v1');
      const cachedManifest = await cache.match('/manifest.json');
      if (cachedManifest) {
        const manifest = await cachedManifest.json();
        return manifest.version || '1.0.0';
      }
    } catch (_error) {
      console._error('Error getting app version:', _error);
    }
    return '1.0.0';
  },

  // Background sync registration
  async registerBackgroundSync(tag: string): Promise<void> {
    if (
      'serviceWorker' in navigator &&
      'sync' in window.ServiceWorkerRegistration.prototype
    ) {
      const registration = await navigator.serviceWorker.ready;
      const syncManager = registration.sync;
      if (syncManager) {
        await syncManager.register(tag);
      }
    }
  },

  // Request persistent storage
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      const granted = await navigator.storage.persist();
      console.log(`Persistent storage: ${granted ? 'granted' : 'denied'}`);
      return granted;
    }
    return false;
  },

  // Get storage usage
  async getStorageUsage(): Promise<{ used: number; total: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        total: estimate.quota || 0,
      };
    }
    return null;
  },

  // Check if offline ready
  async isOfflineReady(): Promise<boolean> {
    try {
      const cache = await caches.open('smart-alarm-v1');
      const essentialFiles = ['/', '/manifest.json'];

      for (const file of essentialFiles) {
        const cached = await cache.match(file);
        if (!cached) return false;
      }

      return true;
    } catch {
      return false;
    }
  },

  // Install app programmatically
  async installApp(prompt: PWAInstallEvent): Promise<boolean> {
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      return choice.outcome === 'accepted';
    } catch (_error) {
      console._error('Install failed:', _error);
      return false;
    }
  },

  // Wake lock for alarms (experimental)
  async requestWakeLock(): Promise<WakeLockSentinel | null> {
    if ('wakeLock' in navigator) {
      try {
        if (navigator.wakeLock) {
          const wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake lock acquired');
          return wakeLock;
        }
      } catch (_error) {
        console._error('Wake lock failed:', _error);
      }
    }
    return null;
  },

  // Release wake lock
  async releaseWakeLock(wakeLock: WakeLockSentinel): Promise<void> {
    if (wakeLock) {
      await wakeLock.release();
      console.log('Wake lock released');
    }
  },
};

// Global wake lock interface
interface WakeLockSentinel {
  released: boolean;
  type: string;
  release(): Promise<void>;
}

export default PWAUtils;
