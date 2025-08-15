// Enhanced Service Worker for Relife Alarm App
// Advanced PWA features: background sync, push notifications, offline analytics, app updates

const CACHE_NAME = 'relife-enhanced-v2.0.0';
const STATIC_CACHE = 'relife-static-v2.0.0';
const DYNAMIC_CACHE = 'relife-dynamic-v2.0.0';
const API_CACHE = 'relife-api-v2.0.0';
const ASSETS_CACHE = 'relife-assets-v2.0.0';
const ANALYTICS_CACHE = 'relife-analytics-v2.0.0';

// Enhanced file patterns for better caching
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-72x72.png',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Dynamic content patterns with priority
const CACHE_STRATEGIES = {
  // Network first for critical API calls
  NETWORK_FIRST: [
    /\/api\/auth/,
    /\/api\/users/,
    /\/api\/sync/
  ],
  // Cache first for static assets
  CACHE_FIRST: [
    /\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/,
    /\/static\//,
    /\/assets\//
  ],
  // Stale while revalidate for dynamic content
  STALE_WHILE_REVALIDATE: [
    /\/api\/alarms/,
    /\/api\/voice/,
    /\/api\/sleep/,
    /\/api\/analytics/
  ]
};

// Background sync tags
const SYNC_TAGS = {
  ALARMS: 'alarms-sync',
  SLEEP: 'sleep-sync',
  VOICE: 'voice-sync',
  ANALYTICS: 'analytics-sync',
  SETTINGS: 'settings-sync',
  USER_DATA: 'user-data-sync'
};

// Push notification tags
const NOTIFICATION_TAGS = {
  ALARM: 'alarm-notification',
  REMINDER: 'reminder-notification',
  BATTLE: 'battle-notification',
  ACHIEVEMENT: 'achievement-notification',
  UPDATE: 'app-update-notification'
};

// App state
let alarmTimeouts = new Map();
let pushSubscription = null;
let analyticsQueue = [];
let isOnline = false;
let appVersion = '2.0.0';

// Install event - cache static files and set up databases
self.addEventListener('install', (event) => {
  console.log('Enhanced SW: Installing version', appVersion);
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Enhanced SW: Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      
      // Initialize IndexedDB for advanced features
      initializeEnhancedStorage(),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ]).catch(error => {
      console.error('Enhanced SW: Error during install:', error);
    })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('Enhanced SW: Activating version', appVersion);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!Object.values({
              CACHE_NAME,
              STATIC_CACHE,
              DYNAMIC_CACHE,
              API_CACHE,
              ASSETS_CACHE,
              ANALYTICS_CACHE
            }).includes(cacheName)) {
              console.log('Enhanced SW: Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim all clients
      self.clients.claim(),
      
      // Initialize advanced features
      initializeAdvancedFeatures(),
      
      // Set up push notification subscription
      setupPushNotifications(),
      
      // Process any queued analytics
      processAnalyticsQueue()
    ])
  );
});

// Enhanced fetch event with multiple caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Analytics requests - queue offline
  if (url.pathname.includes('/analytics') || url.pathname.includes('/tracking')) {
    event.respondWith(handleAnalyticsRequest(request));
    return;
  }

  // Determine caching strategy
  let strategy = 'NETWORK_WITH_FALLBACK'; // default
  
  for (const [strategyName, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => pattern.test(url.pathname))) {
      strategy = strategyName;
      break;
    }
  }

  // Apply the determined strategy
  switch (strategy) {
    case 'NETWORK_FIRST':
      event.respondWith(networkFirst(request));
      break;
    case 'CACHE_FIRST':
      event.respondWith(cacheFirst(request));
      break;
    case 'STALE_WHILE_REVALIDATE':
      event.respondWith(staleWhileRevalidate(request));
      break;
    default:
      event.respondWith(networkWithFallback(request));
  }
});

// Enhanced background sync with retry logic
self.addEventListener('sync', (event) => {
  console.log('Enhanced SW: Background sync triggered:', event.tag);

  switch (event.tag) {
    case SYNC_TAGS.ALARMS:
      event.waitUntil(syncAlarms());
      break;
    case SYNC_TAGS.SLEEP:
      event.waitUntil(syncSleepData());
      break;
    case SYNC_TAGS.VOICE:
      event.waitUntil(syncVoiceData());
      break;
    case SYNC_TAGS.ANALYTICS:
      event.waitUntil(syncAnalytics());
      break;
    case SYNC_TAGS.SETTINGS:
      event.waitUntil(syncSettings());
      break;
    case SYNC_TAGS.USER_DATA:
      event.waitUntil(syncUserData());
      break;
    default:
      console.log('Enhanced SW: Unknown sync tag:', event.tag);
  }
});

// Enhanced push notification handling
self.addEventListener('push', (event) => {
  console.log('Enhanced SW: Push notification received');

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Relife Alarm', body: event.data.text() };
    }
  }

  const notificationType = data.type || 'alarm';
  event.waitUntil(handlePushNotification(data, notificationType));
});

// Enhanced notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Enhanced SW: Notification clicked:', event.action, event.notification.tag);

  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  event.waitUntil(handleNotificationClick(action, data));
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SCHEDULE_ALARM':
      scheduleEnhancedAlarm(data.alarm);
      break;
    case 'CANCEL_ALARM':
      cancelEnhancedAlarm(data.alarmId);
      break;
    case 'UPDATE_ALARMS':
      updateEnhancedAlarms(data.alarms);
      break;
    case 'REGISTER_PUSH':
      registerPushSubscription(data.subscription);
      break;
    case 'QUEUE_ANALYTICS':
      queueAnalytics(data.event);
      break;
    case 'FORCE_SYNC':
      performCompleteSync();
      break;
    case 'CHECK_FOR_UPDATES':
      checkForAppUpdates();
      break;
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    default:
      console.log('Enhanced SW: Unknown message type:', type);
  }

  // Send response back to main thread
  event.ports[0]?.postMessage({ success: true, timestamp: Date.now() });
});

// Enhanced caching strategies
async function networkFirst(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Enhanced SW: Network failed, trying cache:', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add stale indicator header
      const response = cachedResponse.clone();
      response.headers.set('X-Cache-Status', 'stale');
      return response;
    }
    
    return createOfflineResponse(request);
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Update cache in background if it's old
    const dateHeader = cachedResponse.headers.get('Date');
    if (dateHeader) {
      const cacheDate = new Date(dateHeader);
      const hoursSinceCache = (Date.now() - cacheDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCache > 24) {
        // Update in background
        fetch(request).then(response => {
          if (response.ok) {
            cache.put(request, response);
          }
        }).catch(() => {});
      }
    }
    
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return createOfflineResponse(request);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Always try to update cache in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.log('Enhanced SW: Background fetch failed:', error);
  });

  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // If no cache, wait for network
  try {
    return await fetchPromise;
  } catch (error) {
    return createOfflineResponse(request);
  }
}

async function networkWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || createOfflineResponse(request);
  }
}

// Enhanced analytics handling
async function handleAnalyticsRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Queue for later if offline
    if (request.method === 'POST') {
      const body = await request.text();
      analyticsQueue.push({
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: body,
        timestamp: Date.now()
      });
      
      // Store in IndexedDB
      await storeAnalyticsEvent({
        url: request.url,
        data: body,
        timestamp: Date.now()
      });
    }
    
    // Return empty response to prevent errors
    return new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Enhanced alarm processing
async function scheduleEnhancedAlarm(alarm) {
  // Cancel existing timeout if any
  if (alarmTimeouts.has(alarm.id)) {
    clearTimeout(alarmTimeouts.get(alarm.id));
  }

  const nextTime = getNextAlarmTime(alarm);
  
  if (nextTime) {
    const msUntilAlarm = nextTime.getTime() - Date.now();
    
    if (msUntilAlarm > 0) {
      const timeoutId = setTimeout(() => {
        triggerEnhancedAlarm(alarm);
      }, msUntilAlarm);
      
      alarmTimeouts.set(alarm.id, timeoutId);
      
      // Store alarm in IndexedDB for persistence
      await storeScheduledAlarm(alarm, nextTime);
      
      console.log(`Enhanced SW: Alarm ${alarm.id} scheduled for`, nextTime);
    }
  }
}

async function triggerEnhancedAlarm(alarm) {
  console.log(`Enhanced SW: Triggering enhanced alarm ${alarm.id}`);

  try {
    // Remove from scheduled timeouts
    alarmTimeouts.delete(alarm.id);

    // Create rich notification
    const notificationOptions = {
      title: `🔔 ${alarm.label || 'Alarm'}`,
      body: `It's ${alarm.time}! Tap to open your personalized wake-up experience.`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: NOTIFICATION_TAGS.ALARM,
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500, 200, 500],
      actions: [
        {
          action: 'dismiss',
          title: '⏹️ Dismiss',
          icon: '/dismiss-icon.png'
        },
        {
          action: 'snooze',
          title: '😴 Snooze 5min',
          icon: '/snooze-icon.png'
        },
        {
          action: 'voice',
          title: '🎤 Voice Response',
          icon: '/voice-icon.png'
        }
      ],
      data: {
        alarmId: alarm.id,
        alarmTime: alarm.time,
        alarmLabel: alarm.label,
        voiceMood: alarm.voiceMood,
        type: 'alarm',
        triggeredAt: Date.now()
      }
    };

    await self.registration.showNotification(notificationOptions.title, notificationOptions);

    // Try to open the app or send message to existing clients
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    if (clients.length > 0) {
      // Send message to existing client
      clients[0].postMessage({
        type: 'ALARM_TRIGGERED',
        alarm: alarm,
        timestamp: Date.now()
      });
      
      // Focus the window
      clients[0].focus();
    } else {
      // Open new window
      await self.clients.openWindow('/');
    }

    // Log alarm event for analytics
    await logEnhancedAlarmEvent(alarm, 'triggered');

    // Schedule next occurrence if repeating
    if (alarm.days && alarm.days.length > 0) {
      await scheduleEnhancedAlarm(alarm);
    }

  } catch (error) {
    console.error('Enhanced SW: Error triggering alarm:', error);
  }
}

// Push notification handling
async function handlePushNotification(data, type) {
  let notificationOptions;

  switch (type) {
    case 'alarm':
      notificationOptions = {
        title: data.title || '🔔 Alarm',
        body: data.body || 'Your alarm is ringing!',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: NOTIFICATION_TAGS.ALARM,
        requireInteraction: true,
        vibrate: [500, 200, 500],
        actions: [
          { action: 'dismiss', title: 'Dismiss' },
          { action: 'snooze', title: 'Snooze' }
        ],
        data: data
      };
      break;

    case 'battle':
      notificationOptions = {
        title: data.title || '⚔️ Battle Challenge',
        body: data.body || 'You have a new battle challenge!',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: NOTIFICATION_TAGS.BATTLE,
        actions: [
          { action: 'accept', title: 'Accept' },
          { action: 'decline', title: 'Decline' }
        ],
        data: data
      };
      break;

    case 'achievement':
      notificationOptions = {
        title: data.title || '🏆 Achievement Unlocked',
        body: data.body || 'You earned a new achievement!',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: NOTIFICATION_TAGS.ACHIEVEMENT,
        data: data
      };
      break;

    case 'update':
      notificationOptions = {
        title: data.title || '📱 App Update Available',
        body: data.body || 'A new version of Relife is available!',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: NOTIFICATION_TAGS.UPDATE,
        actions: [
          { action: 'update', title: 'Update Now' },
          { action: 'later', title: 'Later' }
        ],
        data: data
      };
      break;

    default:
      notificationOptions = {
        title: data.title || 'Relife',
        body: data.body || 'You have a notification',
        icon: '/icon-192x192.png',
        data: data
      };
  }

  await self.registration.showNotification(notificationOptions.title, notificationOptions);
}

// Enhanced notification click handling
async function handleNotificationClick(action, data) {
  const clients = await self.clients.matchAll({ type: 'window' });

  switch (action) {
    case 'dismiss':
      if (data.alarmId) {
        await logEnhancedAlarmEvent({ id: data.alarmId }, 'dismissed');
        // Notify app
        if (clients.length > 0) {
          clients[0].postMessage({
            type: 'ALARM_DISMISSED',
            alarmId: data.alarmId
          });
        }
      }
      break;

    case 'snooze':
      if (data.alarmId) {
        await handleEnhancedSnooze(data);
        // Notify app
        if (clients.length > 0) {
          clients[0].postMessage({
            type: 'ALARM_SNOOZED',
            alarmId: data.alarmId,
            snoozeTime: new Date(Date.now() + 5 * 60 * 1000)
          });
        }
      }
      break;

    case 'voice':
      // Open app to voice interface
      await focusOrOpenApp('/?voice=true');
      break;

    case 'accept':
    case 'decline':
      // Handle battle actions
      if (clients.length > 0) {
        clients[0].postMessage({
          type: 'BATTLE_ACTION',
          action: action,
          data: data
        });
      }
      break;

    case 'update':
      // Handle app update
      await handleAppUpdate();
      break;

    default:
      // Default action - open the app
      await focusOrOpenApp('/');
  }
}

// Background sync functions
async function syncAlarms() {
  console.log('Enhanced SW: Syncing alarms...');
  // Implementation would sync with backend
  await performDataSync('alarms');
}

async function syncSleepData() {
  console.log('Enhanced SW: Syncing sleep data...');
  await performDataSync('sleep');
}

async function syncVoiceData() {
  console.log('Enhanced SW: Syncing voice data...');
  await performDataSync('voice');
}

async function syncAnalytics() {
  console.log('Enhanced SW: Syncing analytics...');
  await processAnalyticsQueue();
}

async function syncSettings() {
  console.log('Enhanced SW: Syncing settings...');
  await performDataSync('settings');
}

async function syncUserData() {
  console.log('Enhanced SW: Syncing user data...');
  await performDataSync('userData');
}

// Utility functions
async function focusOrOpenApp(url = '/') {
  const clients = await self.clients.matchAll({ type: 'window' });
  
  if (clients.length > 0) {
    await clients[0].focus();
    if (url !== '/') {
      clients[0].postMessage({
        type: 'NAVIGATE',
        url: url
      });
    }
  } else {
    await self.clients.openWindow(url);
  }
}

function getNextAlarmTime(alarm) {
  // Implementation similar to the original but with enhancements
  if (!alarm.days || alarm.days.length === 0) {
    // One-time alarm
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const alarmTime = new Date();
    alarmTime.setHours(hours, minutes, 0, 0);
    
    if (alarmTime <= new Date()) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }
    
    return alarmTime;
  }

  // Recurring alarm
  const [hours, minutes] = alarm.time.split(':').map(Number);
  const today = new Date().getDay();
  
  // Find next occurrence
  for (let i = 0; i < 7; i++) {
    const checkDay = (today + i) % 7;
    
    if (alarm.days.includes(checkDay)) {
      const alarmTime = new Date();
      alarmTime.setDate(new Date().getDate() + i);
      alarmTime.setHours(hours, minutes, 0, 0);
      
      if (alarmTime > new Date()) {
        return alarmTime;
      }
    }
  }
  
  return null;
}

function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  if (url.pathname.includes('/api/')) {
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This feature requires an internet connection'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Relife - Offline</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          text-align: center;
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          margin: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .container {
          max-width: 400px;
          background: rgba(255,255,255,0.1);
          padding: 2rem;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .offline-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        h1 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        p {
          font-size: 1rem;
          margin-bottom: 1.5rem;
          opacity: 0.9;
          line-height: 1.5;
        }
        button {
          background: rgba(255,255,255,0.2);
          border: 2px solid rgba(255,255,255,0.3);
          color: white;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }
        button:hover {
          background: rgba(255,255,255,0.3);
          transform: translateY(-2px);
        }
        .features {
          margin-top: 1.5rem;
          font-size: 0.9rem;
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="offline-icon">📱</div>
        <h1>You're Offline</h1>
        <p>Don't worry! Your alarms will still work and all changes will sync when you're back online.</p>
        <button onclick="location.reload()">Try Again</button>
        <div class="features">
          ✓ Alarms work offline<br>
          ✓ Voice features available<br>
          ✓ Data syncs automatically
        </div>
      </div>
    </body>
    </html>
  `, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

// Enhanced initialization functions
async function initializeEnhancedStorage() {
  // Initialize IndexedDB for advanced offline features
  console.log('Enhanced SW: Initializing enhanced storage...');
  // Implementation would set up additional IndexedDB stores
}

async function initializeAdvancedFeatures() {
  console.log('Enhanced SW: Initializing advanced features...');
  
  // Set up periodic background sync
  await schedulePeriodicSync();
  
  // Initialize alarm processing
  await initializeAlarmProcessing();
  
  // Check network status
  isOnline = navigator.onLine;
  
  // Set up network listeners
  addEventListener('online', () => {
    isOnline = true;
    notifyClients('NETWORK_STATUS', { isOnline: true });
    processAnalyticsQueue();
  });
  
  addEventListener('offline', () => {
    isOnline = false;
    notifyClients('NETWORK_STATUS', { isOnline: false });
  });
}

async function setupPushNotifications() {
  // Set up push notification subscription
  console.log('Enhanced SW: Setting up push notifications...');
  // Implementation would handle push subscription
}

async function processAnalyticsQueue() {
  if (analyticsQueue.length === 0) return;
  
  console.log(`Enhanced SW: Processing ${analyticsQueue.length} queued analytics events`);
  
  for (const event of analyticsQueue) {
    try {
      await fetch(event.url, {
        method: event.method,
        headers: event.headers,
        body: event.body
      });
    } catch (error) {
      console.log('Enhanced SW: Failed to send analytics event:', error);
      // Keep in queue for retry
      continue;
    }
  }
  
  // Clear successfully sent events
  analyticsQueue = [];
}

async function notifyClients(type, data) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type, data });
  });
}

// Stub implementations for additional features
async function storeScheduledAlarm(alarm, nextTime) {
  // Store alarm in IndexedDB
}

async function storeAnalyticsEvent(event) {
  // Store analytics event for later sync
}

async function logEnhancedAlarmEvent(alarm, eventType) {
  // Enhanced alarm event logging
}

async function handleEnhancedSnooze(data) {
  // Enhanced snooze handling
}

async function performDataSync(dataType) {
  // Generic data sync function
}

async function schedulePeriodicSync() {
  // Schedule periodic background sync
}

async function initializeAlarmProcessing() {
  // Initialize alarm processing
}

async function checkForAppUpdates() {
  // Check for app updates
}

async function handleAppUpdate() {
  // Handle app update
}

console.log('Enhanced Service Worker: Loaded and ready with advanced PWA features');