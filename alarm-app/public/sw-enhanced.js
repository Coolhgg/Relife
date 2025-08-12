// Enhanced Smart Alarm Service Worker v3
// Comprehensive offline functionality with advanced caching strategies

const CACHE_NAME = 'smart-alarm-v3';
const STATIC_CACHE = 'smart-alarm-static-v3';
const DYNAMIC_CACHE = 'smart-alarm-dynamic-v3';
const ALARM_CHECK_INTERVAL = 30000; // 30 seconds

// Comprehensive list of files to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icon-72x72.png',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Runtime caching patterns
const CACHE_STRATEGIES = {
  assets: 'CacheFirst',
  api: 'NetworkFirst',
  fonts: 'CacheFirst',
  images: 'CacheFirst'
};

let alarmCheckInterval = null;
let cachedAlarms = [];
let activeTimeouts = new Set();
let isTerminating = false;
let networkStatus = 'online';

// Install event - cache essential files with comprehensive strategy
self.addEventListener('install', (event) => {
  console.log('[SW] Installing enhanced service worker v3');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      }),
      
      // Prepare dynamic cache
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('[SW] Dynamic cache ready');
        return cache;
      })
    ])
    .then(() => {
      console.log('[SW] Service worker installed successfully');
      return self.skipWaiting();
    })
    .catch((error) => {
      console.error('[SW] Error during install:', error);
    })
  );
});

// Activate event - clean up old caches and initialize
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating enhanced service worker v3');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (![STATIC_CACHE, DYNAMIC_CACHE, CACHE_NAME].includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Initialize service
      initializeServiceWorker()
    ])
    .then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Enhanced fetch event with intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  event.respondWith(handleFetchWithStrategy(request));
});

async function handleFetchWithStrategy(request) {
  const url = new URL(request.url);
  
  try {
    // Static assets - Cache First
    if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset)) || 
        url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot)$/)) {
      return await cacheFirstStrategy(request, STATIC_CACHE);
    }
    
    // API calls - Network First
    if (url.pathname.startsWith('/api/')) {
      return await networkFirstStrategy(request, DYNAMIC_CACHE);
    }
    
    // HTML pages - Network First with offline fallback
    if (request.mode === 'navigate') {
      return await networkFirstStrategy(request, DYNAMIC_CACHE, true);
    }
    
    // Default strategy - Network First
    return await networkFirstStrategy(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(STATIC_CACHE);
      return await cache.match('/') || new Response('Offline', { 
        status: 503,
        statusText: 'Service Unavailable' 
      });
    }
    
    throw error;
  }
}

// Cache First Strategy
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // Return cached version immediately
    fetchAndUpdateCache(request, cache); // Update cache in background
    return cached;
  }
  
  // Not in cache, fetch from network
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

// Network First Strategy
async function networkFirstStrategy(request, cacheName, isNavigation = false) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request, { 
      timeout: isNavigation ? 3000 : 5000 
    });
    
    if (response.ok) {
      cache.put(request, response.clone());
      networkStatus = 'online';
      notifyClientsOfNetworkStatus(true);
    }
    
    return response;
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error.message);
    networkStatus = 'offline';
    notifyClientsOfNetworkStatus(false);
    
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    // Navigation fallback
    if (isNavigation) {
      const fallback = await cache.match('/') || await caches.match('/index.html');
      if (fallback) {
        return fallback;
      }
    }
    
    throw error;
  }
}

// Background fetch and cache update
async function fetchAndUpdateCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
  } catch (error) {
    // Silently fail background updates
    console.log('[SW] Background cache update failed:', error.message);
  }
}

// Message handling with enhanced functionality
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  console.log('[SW] Received message:', type, data);
  
  switch (type) {
    case 'UPDATE_ALARMS':
      updateCachedAlarms(data.alarms);
      break;
    case 'TRIGGER_ALARM':
      triggerAlarm(data.alarm);
      break;
    case 'PING':
      event.ports[0].postMessage({ 
        type: 'PONG', 
        timestamp: Date.now(),
        networkStatus,
        cacheStats: getCacheStats()
      });
      break;
    case 'CLEANUP':
      cleanup();
      break;
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
    case 'SYNC_ALARMS':
      handleAlarmSync();
      break;
    case 'GET_OFFLINE_STATUS':
      event.ports[0].postMessage({
        type: 'OFFLINE_STATUS',
        isOnline: networkStatus === 'online',
        cacheStats: getCacheStats()
      });
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Enhanced notification handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const alarmId = event.notification.tag;
  const action = event.action;
  
  event.waitUntil(
    handleNotificationAction(alarmId, action || 'open')
  );
});

self.addEventListener('notificationaction', (event) => {
  console.log('[SW] Notification action:', event.action);
  
  event.notification.close();
  
  event.waitUntil(
    handleNotificationAction(event.notification.tag, event.action)
  );
});

async function handleNotificationAction(alarmId, action) {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    
    switch (action) {
      case 'dismiss':
        handleAlarmDismiss(alarmId);
        break;
      case 'snooze':
        handleAlarmSnooze(alarmId);
        break;
      case 'open':
      default:
        // Open or focus the app
        let client = clients.find(c => c.visibilityState === 'visible');
        
        if (client) {
          client.focus();
          client.postMessage({
            type: 'ALARM_TRIGGERED',
            alarmId: alarmId
          });
        } else {
          client = await self.clients.openWindow('/');
          if (client) {
            client.postMessage({
              type: 'ALARM_TRIGGERED',
              alarmId: alarmId
            });
          }
        }
        break;
    }
  } catch (error) {
    console.error('[SW] Error handling notification action:', error);
  }
}

// Background sync with enhanced error handling
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'alarm-sync') {
    event.waitUntil(handleAlarmSync());
  }
});

async function handleAlarmSync() {
  try {
    console.log('[SW] Starting alarm sync...');
    
    // Notify clients about sync start
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_START',
        timestamp: Date.now()
      });
    });
    
    // In a real app, this would sync with your backend
    // For now, we'll simulate a successful sync
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Notify clients about sync completion
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now()
      });
    });
    
    console.log('[SW] Alarm sync completed successfully');
    
  } catch (error) {
    console.error('[SW] Alarm sync failed:', error);
    
    // Notify clients about sync error
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_ERROR',
        error: error.message,
        timestamp: Date.now()
      });
    });
  }
}

// Service worker initialization
async function initializeServiceWorker() {
  startAlarmChecker();
  
  // Set up periodic sync if supported
  if ('periodicsync' in self.registration) {
    try {
      await self.registration.periodicSync.register('alarm-check', {
        minInterval: 60000 // 1 minute minimum
      });
      console.log('[SW] Periodic sync registered');
    } catch (error) {
      console.log('[SW] Periodic sync registration failed:', error);
    }
  }
}

// Enhanced alarm checking
function startAlarmChecker() {
  if (isTerminating) return;
  
  stopAlarmChecker();
  console.log('[SW] Starting enhanced alarm checker');
  
  alarmCheckInterval = setInterval(() => {
    if (isTerminating) {
      stopAlarmChecker();
      return;
    }
    checkForTriggeredAlarms();
  }, ALARM_CHECK_INTERVAL);
  
  checkForTriggeredAlarms();
}

function stopAlarmChecker() {
  if (alarmCheckInterval) {
    clearInterval(alarmCheckInterval);
    alarmCheckInterval = null;
    console.log('[SW] Stopped alarm checker');
  }
}

function updateCachedAlarms(alarms) {
  if (isTerminating) return;
  cachedAlarms = alarms || [];
  console.log('[SW] Updated cached alarms:', cachedAlarms.length);
}

function checkForTriggeredAlarms() {
  if (!cachedAlarms.length || isTerminating) return;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDay = now.getDay();
  
  cachedAlarms.forEach(alarm => {
    if (!alarm.enabled || !alarm.days.includes(currentDay)) return;
    
    const [alarmHour, alarmMinute] = alarm.time.split(':').map(Number);
    
    if (alarmHour === currentHour && alarmMinute === currentMinute) {
      const lastTriggered = alarm.lastTriggered ? new Date(alarm.lastTriggered) : null;
      const shouldTrigger = !lastTriggered || 
        (now.getTime() - lastTriggered.getTime()) > (22 * 60 * 60 * 1000);
      
      if (shouldTrigger) {
        triggerAlarm(alarm);
      }
    }
  });
}

function triggerAlarm(alarm) {
  if (isTerminating) return;
  
  console.log('[SW] Triggering enhanced alarm:', alarm.label);
  
  const notificationOptions = {
    body: `Time for ${alarm.label}! Voice mood: ${alarm.voiceMood}`,
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: alarm.id,
    requireInteraction: true,
    silent: false,
    vibrate: [500, 200, 500, 200, 500, 200, 500],
    actions: [
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-72x72.png'
      },
      {
        action: 'snooze',
        title: 'Snooze 5min',
        icon: '/icon-72x72.png'
      }
    ],
    data: {
      alarmId: alarm.id,
      voiceMood: alarm.voiceMood,
      timestamp: Date.now(),
      version: '3'
    }
  };
  
  self.registration.showNotification('🔔 Smart Alarm', notificationOptions);
  
  // Notify all clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'ALARM_TRIGGERED',
        alarm: alarm,
        timestamp: Date.now()
      });
    });
  });
  
  updateAlarmLastTriggered(alarm.id);
}

function handleAlarmDismiss(alarmId) {
  console.log('[SW] Alarm dismissed:', alarmId);
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'ALARM_DISMISSED',
        alarmId: alarmId,
        method: 'notification',
        timestamp: Date.now()
      });
    });
  });
}

function handleAlarmSnooze(alarmId) {
  console.log('[SW] Alarm snoozed:', alarmId);
  
  const snoozeTime = 5 * 60 * 1000;
  
  const timeoutId = setTimeout(() => {
    activeTimeouts.delete(timeoutId);
    
    if (!isTerminating) {
      const alarm = cachedAlarms.find(a => a.id === alarmId);
      if (alarm) {
        triggerAlarm(alarm);
      }
    }
  }, snoozeTime);
  
  activeTimeouts.add(timeoutId);
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'ALARM_SNOOZED',
        alarmId: alarmId,
        snoozeMinutes: 5,
        timestamp: Date.now()
      });
    });
  });
}

function updateAlarmLastTriggered(alarmId) {
  const alarm = cachedAlarms.find(a => a.id === alarmId);
  if (alarm) {
    alarm.lastTriggered = new Date().toISOString();
  }
}

// Network status notifications
function notifyClientsOfNetworkStatus(isOnline) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NETWORK_STATUS',
        isOnline,
        timestamp: Date.now()
      });
    });
  });
}

// Cache management utilities
async function getCacheStats() {
  try {
    const cacheNames = await caches.keys();
    const stats = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      stats[cacheName] = keys.length;
    }
    
    return stats;
  } catch (error) {
    console.error('[SW] Error getting cache stats:', error);
    return {};
  }
}

async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Error clearing caches:', error);
  }
}

// Enhanced cleanup
function cleanup() {
  console.log('[SW] Performing enhanced cleanup');
  isTerminating = true;
  
  stopAlarmChecker();
  clearAllTimeouts();
  cachedAlarms = [];
  
  // Cancel any ongoing fetch operations
  // Note: AbortController not available in service workers by default
}

function clearAllTimeouts() {
  console.log('[SW] Clearing', activeTimeouts.size, 'active timeouts');
  activeTimeouts.forEach(timeoutId => {
    clearTimeout(timeoutId);
  });
  activeTimeouts.clear();
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Service worker error:', event.error);
  cleanup();
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent default handling
});

// Graceful shutdown
self.addEventListener('beforeunload', () => {
  cleanup();
});

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    cleanup();
    self.skipWaiting();
  }
});

console.log('[SW] Enhanced service worker v3 loaded successfully');