// Service Worker for Relife Alarm App
// Handles caching, background sync, and alarm processing

const CACHE_NAME = 'relife-v1';
const STATIC_CACHE = 'relife-static-v1';
const DYNAMIC_CACHE = 'relife-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/favicon.ico'
];

// Dynamic content patterns
const CACHEABLE_PATTERNS = [
  /\/api\/alarms/,
  /\/api\/voice/,
  /\/api\/sleep/,
  /\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/
];

// Background sync tags
const SYNC_TAGS = {
  ALARMS: 'alarm-sync',
  SLEEP: 'sleep-sync',
  SETTINGS: 'settings-sync'
};

// Alarm processing state
let alarmTimeouts = new Map();
let isProcessingAlarms = false;

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('Service Worker: Error during install:', error);
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim(),
      // Initialize alarm processing
      initializeAlarmProcessing()
    ])
  );
});

// Fetch event - serve cached content and cache new requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // For API requests, try network first, then cache
        if (url.pathname.startsWith('/api/')) {
          return networkFirst(request);
        }

        // For static assets, try cache first, then network
        if (CACHEABLE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
          return cacheFirst(request);
        }

        // For everything else, use network with cache fallback
        return networkWithFallback(request);
      })
      .catch(error => {
        console.error('Service Worker: Fetch error:', error);
        return offlinePage();
      })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);

  switch (event.tag) {
    case SYNC_TAGS.ALARMS:
      event.waitUntil(syncAlarms());
      break;
    case SYNC_TAGS.SLEEP:
      event.waitUntil(syncSleepData());
      break;
    case SYNC_TAGS.SETTINGS:
      event.waitUntil(syncSettings());
      break;
    default:
      console.log('Service Worker: Unknown sync tag:', event.tag);
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Relife Alarm', body: event.data.text() };
    }
  }

  const options = {
    title: data.title || 'Relife Alarm',
    body: data.body || 'Your alarm is ready!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'alarm-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'dismiss',
        title: 'Dismiss'
      },
      {
        action: 'snooze',
        title: 'Snooze'
      }
    ],
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'dismiss') {
    handleAlarmDismiss(event.notification.data);
  } else if (event.action === 'snooze') {
    handleAlarmSnooze(event.notification.data);
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message event - communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SCHEDULE_ALARM':
      scheduleAlarm(data.alarm);
      break;
    case 'CANCEL_ALARM':
      cancelAlarm(data.alarmId);
      break;
    case 'UPDATE_ALARMS':
      updateAlarmSchedule(data.alarms);
      break;
    case 'SYNC_REQUEST':
      performBackgroundSync();
      break;
    default:
      console.log('Service Worker: Unknown message type:', type);
  }

  // Send response back to main thread
  event.ports[0]?.postMessage({ success: true });
});

// Caching strategies
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    return cachedResponse || offlineResponse();
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return offlineResponse();
  }
}

async function networkWithFallback(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || offlinePage();
  }
}

function offlineResponse() {
  return new Response('Offline - content not available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

function offlinePage() {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Relife - Offline</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          margin: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .offline-icon {
          font-size: 4em;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 2em;
          margin-bottom: 10px;
        }
        p {
          font-size: 1.1em;
          margin-bottom: 30px;
        }
        button {
          background: rgba(255,255,255,0.2);
          border: 2px solid white;
          color: white;
          padding: 10px 20px;
          font-size: 1em;
          border-radius: 5px;
          cursor: pointer;
        }
        button:hover {
          background: rgba(255,255,255,0.3);
        }
      </style>
    </head>
    <body>
      <div class="offline-icon">📱</div>
      <h1>You're Offline</h1>
      <p>Don't worry! Your alarms will still work.<br>The app will sync when you're back online.</p>
      <button onclick="location.reload()">Try Again</button>
    </body>
    </html>
  `, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

// Alarm processing functions
async function initializeAlarmProcessing() {
  console.log('Service Worker: Initializing alarm processing...');
  
  try {
    // Load alarms from IndexedDB
    const db = await openIndexedDB();
    const alarms = await getAllAlarms(db);
    
    // Schedule all active alarms
    alarms.filter(alarm => alarm.enabled).forEach(alarm => {
      scheduleAlarm(alarm);
    });
    
    console.log(`Service Worker: Scheduled ${alarms.length} alarms`);
  } catch (error) {
    console.error('Service Worker: Error initializing alarms:', error);
  }
}

function scheduleAlarm(alarm) {
  // Cancel existing timeout if any
  if (alarmTimeouts.has(alarm.id)) {
    clearTimeout(alarmTimeouts.get(alarm.id));
  }

  const now = new Date();
  const alarmTime = getNextAlarmTime(alarm, now);
  
  if (alarmTime) {
    const msUntilAlarm = alarmTime.getTime() - now.getTime();
    
    if (msUntilAlarm > 0) {
      const timeoutId = setTimeout(() => {
        triggerAlarm(alarm);
      }, msUntilAlarm);
      
      alarmTimeouts.set(alarm.id, timeoutId);
      
      console.log(`Service Worker: Alarm ${alarm.id} scheduled for`, alarmTime);
    }
  }
}

function cancelAlarm(alarmId) {
  if (alarmTimeouts.has(alarmId)) {
    clearTimeout(alarmTimeouts.get(alarmId));
    alarmTimeouts.delete(alarmId);
    console.log(`Service Worker: Cancelled alarm ${alarmId}`);
  }
}

function updateAlarmSchedule(alarms) {
  // Clear all existing timeouts
  alarmTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  alarmTimeouts.clear();
  
  // Schedule new alarms
  alarms.filter(alarm => alarm.enabled).forEach(alarm => {
    scheduleAlarm(alarm);
  });
}

async function triggerAlarm(alarm) {
  console.log(`Service Worker: Triggering alarm ${alarm.id}`);

  try {
    // Remove from scheduled timeouts
    alarmTimeouts.delete(alarm.id);

    // Show notification
    await self.registration.showNotification('🔔 Relife Alarm', {
      body: alarm.label || `It's ${alarm.time}!`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `alarm-${alarm.id}`,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      actions: [
        {
          action: 'dismiss',
          title: '⏹️ Stop'
        },
        {
          action: 'snooze',
          title: '😴 Snooze 5min'
        }
      ],
      data: {
        alarmId: alarm.id,
        alarmTime: alarm.time,
        alarmLabel: alarm.label
      }
    });

    // Try to open the app or send message to existing clients
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    if (clients.length > 0) {
      // Send message to existing client
      clients[0].postMessage({
        type: 'ALARM_TRIGGER',
        alarm: alarm
      });
      
      // Focus the window
      if (clients[0].focus) {
        clients[0].focus();
      }
    } else {
      // Open new window
      await self.clients.openWindow('/');
    }

    // Schedule next occurrence if repeating
    if (alarm.days && alarm.days.length > 0) {
      scheduleAlarm(alarm);
    }

    // Log alarm trigger
    await logAlarmEvent(alarm, 'triggered');

  } catch (error) {
    console.error('Service Worker: Error triggering alarm:', error);
  }
}

function getNextAlarmTime(alarm, from = new Date()) {
  if (!alarm.days || alarm.days.length === 0) {
    // One-time alarm
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const alarmTime = new Date(from);
    alarmTime.setHours(hours, minutes, 0, 0);
    
    if (alarmTime <= from) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }
    
    return alarmTime;
  }

  // Recurring alarm
  const [hours, minutes] = alarm.time.split(':').map(Number);
  const today = from.getDay();
  
  // Find next occurrence
  for (let i = 0; i < 7; i++) {
    const checkDay = (today + i) % 7;
    
    if (alarm.days.includes(checkDay)) {
      const alarmTime = new Date(from);
      alarmTime.setDate(from.getDate() + i);
      alarmTime.setHours(hours, minutes, 0, 0);
      
      if (alarmTime > from) {
        return alarmTime;
      }
    }
  }
  
  return null;
}

async function handleAlarmDismiss(data) {
  console.log('Service Worker: Dismissing alarm:', data.alarmId);
  
  try {
    // Cancel any scheduled timeout for this alarm
    cancelAlarm(data.alarmId);
    
    // Log the dismissal
    await logAlarmEvent({ id: data.alarmId }, 'dismissed');
    
    // Send message to app
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'ALARM_DISMISSED',
        alarmId: data.alarmId
      });
    });
  } catch (error) {
    console.error('Service Worker: Error dismissing alarm:', error);
  }
}

async function handleAlarmSnooze(data) {
  console.log('Service Worker: Snoozing alarm:', data.alarmId);
  
  try {
    // Cancel current timeout
    cancelAlarm(data.alarmId);
    
    // Schedule snooze (5 minutes)
    const snoozeTime = new Date(Date.now() + 5 * 60 * 1000);
    const snoozeAlarm = {
      id: data.alarmId,
      time: `${snoozeTime.getHours()}:${snoozeTime.getMinutes().toString().padStart(2, '0')}`,
      label: `${data.alarmLabel} (Snoozed)`,
      enabled: true,
      days: [] // One-time snooze
    };
    
    scheduleAlarm(snoozeAlarm);
    
    // Log the snooze
    await logAlarmEvent({ id: data.alarmId }, 'snoozed');
    
    // Send message to app
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'ALARM_SNOOZED',
        alarmId: data.alarmId,
        snoozeTime: snoozeTime
      });
    });
  } catch (error) {
    console.error('Service Worker: Error snoozing alarm:', error);
  }
}

// Background sync functions
async function syncAlarms() {
  console.log('Service Worker: Syncing alarms...');
  
  try {
    const db = await openIndexedDB();
    const pendingAlarms = await getPendingAlarms(db);
    
    for (const alarm of pendingAlarms) {
      await syncAlarmToServer(alarm);
      await markAlarmAsSynced(db, alarm.id);
    }
    
    console.log(`Service Worker: Synced ${pendingAlarms.length} alarms`);
  } catch (error) {
    console.error('Service Worker: Error syncing alarms:', error);
  }
}

async function syncSleepData() {
  console.log('Service Worker: Syncing sleep data...');
  // Implementation would go here
}

async function syncSettings() {
  console.log('Service Worker: Syncing settings...');
  // Implementation would go here
}

async function performBackgroundSync() {
  console.log('Service Worker: Performing background sync...');
  
  await Promise.all([
    syncAlarms(),
    syncSleepData(),
    syncSettings()
  ]);
  
  // Notify main app
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_COMPLETE'
    });
  });
}

// IndexedDB helper functions
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RelifeOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('alarms')) {
        const alarmStore = db.createObjectStore('alarms', { keyPath: 'id' });
        alarmStore.createIndex('syncStatus', 'syncStatus');
      }
      
      if (!db.objectStoreNames.contains('alarmEvents')) {
        const eventStore = db.createObjectStore('alarmEvents', { keyPath: 'id', autoIncrement: true });
        eventStore.createIndex('alarmId', 'alarmId');
        eventStore.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

async function getAllAlarms(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['alarms'], 'readonly');
    const store = transaction.objectStore('alarms');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

async function getPendingAlarms(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['alarms'], 'readonly');
    const store = transaction.objectStore('alarms');
    const index = store.index('syncStatus');
    const request = index.getAll('pending');
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

async function markAlarmAsSynced(db, alarmId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['alarms'], 'readwrite');
    const store = transaction.objectStore('alarms');
    const getRequest = store.get(alarmId);
    
    getRequest.onsuccess = () => {
      const alarm = getRequest.result;
      if (alarm) {
        alarm.syncStatus = 'synced';
        const putRequest = store.put(alarm);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

async function logAlarmEvent(alarm, eventType) {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['alarmEvents'], 'readwrite');
    const store = transaction.objectStore('alarmEvents');
    
    const event = {
      alarmId: alarm.id,
      eventType: eventType,
      timestamp: Date.now(),
      alarmTime: alarm.time,
      alarmLabel: alarm.label || ''
    };
    
    store.add(event);
  } catch (error) {
    console.error('Service Worker: Error logging alarm event:', error);
  }
}

async function syncAlarmToServer(alarm) {
  // This would implement actual sync to Supabase
  // For now, just simulate network request
  console.log('Service Worker: Syncing alarm to server:', alarm.id);
}

console.log('Service Worker: Loaded and ready');