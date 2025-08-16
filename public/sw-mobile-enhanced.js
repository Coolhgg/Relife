// Enhanced Service Worker for Relife Mobile PWA
// Version: 2.1.0

const CACHE_NAME = 'relife-mobile-v2.1.0';
const DATA_CACHE_NAME = 'relife-data-v2.1.0';
const IMAGE_CACHE_NAME = 'relife-images-v2.1.0';

// Resources to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/src/App.css',
  // Icons
  '/icons/icon-72.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/shortcut-alarm.png',
  '/icons/shortcut-sleep.png',
  // Sounds (critical for alarm functionality)
  '/sounds/alarms/gentle_bells.wav',
  '/sounds/alarms/classic_beep.wav',
  '/sounds/alarms/morning_birds.wav',
  '/sounds/notifications/notification.wav',
  '/sounds/ui/click.wav',
];

// Data URLs that should be cached
const DATA_CACHE_PATTERNS = [
  /\/api\/alarms/,
  /\/api\/sleep/,
  /\/api\/settings/,
  /\/api\/user/,
];

// Image patterns for caching
const IMAGE_CACHE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\/images\//,
  /\/icons\//,
];

// Background sync tags
const BACKGROUND_SYNC_TAGS = {
  ALARM_SYNC: 'alarm-sync',
  SETTINGS_SYNC: 'settings-sync',
  USAGE_ANALYTICS: 'usage-analytics',
};

// Service Worker Installation
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v2.1.0');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Static cache complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Cache installation failed:', error);
      })
  );
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v2.1.0');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== DATA_CACHE_NAME && 
                cacheName !== IMAGE_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
      self.clients.claim(),
      // Initialize background sync if supported
      initializeBackgroundSync(),
    ])
  );
});

// Fetch Event Handler with Enhanced Caching Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle different request types
  if (request.method === 'GET') {
    event.respondWith(handleGetRequest(request));
  } else if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
    event.respondWith(handleDataRequest(request));
  }
});

// Enhanced GET request handler
async function handleGetRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 1. Handle API data requests
    if (DATA_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return await handleDataCacheRequest(request);
    }
    
    // 2. Handle image requests
    if (IMAGE_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return await handleImageCacheRequest(request);
    }
    
    // 3. Handle static resources (Cache First)
    if (STATIC_CACHE_URLS.some(cachedUrl => url.pathname === cachedUrl || url.pathname.endsWith(cachedUrl))) {
      return await handleStaticCacheRequest(request);
    }
    
    // 4. Handle navigation requests
    if (request.mode === 'navigate') {
      return await handleNavigationRequest(request);
    }
    
    // 5. Default: Network first with cache fallback
    return await handleNetworkFirstRequest(request);
    
  } catch (error) {
    console.error('[SW] Request handling failed:', error);
    return await handleOfflineFallback(request);
  }
}

// Data cache strategy (Network First with Background Sync)
async function handleDataCacheRequest(request) {
  const cache = await caches.open(DATA_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Network failed for data request, trying cache');
    
    // Fall back to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This data is not available offline',
        cached: false 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Image cache strategy (Cache First)
async function handleImageCacheRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    // Return placeholder image for failed image loads
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="14">Image Unavailable</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Static cache strategy (Cache First)
async function handleStaticCacheRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static resource failed:', error);
    throw error;
  }
}

// Navigation request handler
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation request failed, serving offline page');
    const cache = await caches.open(CACHE_NAME);
    const offlineResponse = await cache.match('/offline.html');
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

// Network first with cache fallback
async function handleNetworkFirstRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses for future offline use
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    return cachedResponse || await handleOfflineFallback(request);
  }
}

// Data request handler (POST, PUT, DELETE)
async function handleDataRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Invalidate related cache entries on successful mutations
      await invalidateDataCache(request);
      return response;
    }
    
    throw new Error('Network request failed');
  } catch (error) {
    console.log('[SW] Data request failed, queueing for background sync');
    
    // Queue for background sync
    await queueBackgroundSync(request);
    
    // Return optimistic response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Changes queued for sync when online',
        offline: true 
      }),
      { 
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Background Sync Setup
async function initializeBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    console.log('[SW] Background sync supported');
    
    // Register background sync events
    self.addEventListener('sync', handleBackgroundSync);
  } else {
    console.log('[SW] Background sync not supported');
  }
}

// Background sync handler
async function handleBackgroundSync(event) {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case BACKGROUND_SYNC_TAGS.ALARM_SYNC:
      event.waitUntil(syncAlarms());
      break;
    case BACKGROUND_SYNC_TAGS.SETTINGS_SYNC:
      event.waitUntil(syncSettings());
      break;
    case BACKGROUND_SYNC_TAGS.USAGE_ANALYTICS:
      event.waitUntil(syncAnalytics());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
}

// Sync queued alarms
async function syncAlarms() {
  console.log('[SW] Syncing alarms...');
  try {
    const pendingRequests = await getQueuedRequests('alarms');
    
    for (const request of pendingRequests) {
      await fetch(request);
      await removeFromQueue('alarms', request);
    }
    
    console.log('[SW] Alarm sync completed');
    
    // Notify clients of successful sync
    broadcastMessage({
      type: 'SYNC_COMPLETE',
      category: 'alarms',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[SW] Alarm sync failed:', error);
    throw error; // This will trigger a retry
  }
}

// Sync settings
async function syncSettings() {
  console.log('[SW] Syncing settings...');
  // Similar implementation to syncAlarms
}

// Sync analytics
async function syncAnalytics() {
  console.log('[SW] Syncing analytics...');
  // Similar implementation to syncAlarms
}

// Queue management for offline operations
async function queueBackgroundSync(request) {
  // Store request for later sync
  const queueKey = determineQueueKey(request);
  const queue = await getQueuedRequests(queueKey) || [];
  
  queue.push({
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== 'GET' ? await request.text() : null,
    timestamp: Date.now()
  });
  
  await storeQueuedRequests(queueKey, queue);
  
  // Register background sync
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    await self.registration.sync.register(getBackgroundSyncTag(queueKey));
  }
}

// Utility functions
function determineQueueKey(request) {
  const url = new URL(request.url);
  if (url.pathname.includes('/api/alarms')) return 'alarms';
  if (url.pathname.includes('/api/settings')) return 'settings';
  return 'general';
}

function getBackgroundSyncTag(queueKey) {
  switch (queueKey) {
    case 'alarms': return BACKGROUND_SYNC_TAGS.ALARM_SYNC;
    case 'settings': return BACKGROUND_SYNC_TAGS.SETTINGS_SYNC;
    default: return 'general-sync';
  }
}

async function getQueuedRequests(key) {
  try {
    const cache = await caches.open('offline-queue');
    const response = await cache.match(`/queue/${key}`);
    return response ? await response.json() : [];
  } catch (error) {
    console.error('[SW] Failed to get queued requests:', error);
    return [];
  }
}

async function storeQueuedRequests(key, requests) {
  try {
    const cache = await caches.open('offline-queue');
    await cache.put(`/queue/${key}`, new Response(JSON.stringify(requests)));
  } catch (error) {
    console.error('[SW] Failed to store queued requests:', error);
  }
}

async function removeFromQueue(key, requestToRemove) {
  const queue = await getQueuedRequests(key);
  const updatedQueue = queue.filter(req => 
    req.url !== requestToRemove.url || req.timestamp !== requestToRemove.timestamp
  );
  await storeQueuedRequests(key, updatedQueue);
}

async function invalidateDataCache(request) {
  const cache = await caches.open(DATA_CACHE_NAME);
  const url = new URL(request.url);
  
  // Remove related cache entries
  const keys = await cache.keys();
  const keysToDelete = keys.filter(key => {
    const keyUrl = new URL(key.url);
    return keyUrl.pathname.startsWith(url.pathname.split('/').slice(0, -1).join('/'));
  });
  
  await Promise.all(keysToDelete.map(key => cache.delete(key)));
}

async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  if (request.mode === 'navigate') {
    const cache = await caches.open(CACHE_NAME);
    return await cache.match('/offline.html') || new Response('Offline', { status: 503 });
  }
  
  return new Response('Offline', { 
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Broadcast messages to all clients
function broadcastMessage(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'Your alarm is ready!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      timestamp: Date.now(),
      url: '/'
    },
    actions: [
      {
        action: 'snooze',
        title: 'Snooze',
        icon: '/icons/actions/snooze.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/actions/dismiss.png'
      }
    ]
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.body || options.body;
      options.data = { ...options.data, ...data };
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Relife Alarm', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  switch (event.action) {
    case 'snooze':
      // Handle snooze action
      handleSnoozeAction(event.notification.data);
      break;
    case 'dismiss':
      // Handle dismiss action
      handleDismissAction(event.notification.data);
      break;
    default:
      // Open app
      event.waitUntil(
        self.clients.matchAll().then(clients => {
          if (clients.length > 0) {
            return clients[0].focus();
          }
          return self.clients.openWindow('/');
        })
      );
  }
});

function handleSnoozeAction(data) {
  // Implement snooze logic
  broadcastMessage({
    type: 'ALARM_SNOOZED',
    data: data
  });
}

function handleDismissAction(data) {
  // Implement dismiss logic
  broadcastMessage({
    type: 'ALARM_DISMISSED',
    data: data
  });
}

console.log('[SW] Relife Mobile Enhanced Service Worker loaded');