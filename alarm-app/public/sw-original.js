// Smart Alarm Service Worker - Improved with Memory Leak Fixes
// Handles background alarm processing and notifications

const CACHE_NAME = 'smart-alarm-v2';
const ALARM_CHECK_INTERVAL = 30000; // 30 seconds
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

let alarmCheckInterval = null;
let cachedAlarms = [];
let activeTimeouts = new Set(); // Track active timeouts for cleanup
let isTerminating = false;

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error during install:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v2');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      startAlarmChecker();
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});

// Message event - handle communication with main app
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
      event.ports[0].postMessage({ type: 'PONG', timestamp: Date.now() });
      break;
    case 'CLEANUP':
      cleanup();
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  // Open the app
  event.waitUntil(
    clients.openWindow('/')
      .then((client) => {
        if (client) {
          client.focus();
          // Send alarm trigger event to the client
          client.postMessage({
            type: 'ALARM_TRIGGERED',
            alarmId: event.notification.tag
          });
        }
      })
  );
});

// Notification action event
self.addEventListener('notificationaction', (event) => {
  console.log('[SW] Notification action:', event.action);
  
  event.notification.close();
  
  switch (event.action) {
    case 'dismiss':
      handleAlarmDismiss(event.notification.tag);
      break;
    case 'snooze':
      handleAlarmSnooze(event.notification.tag);
      break;
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Service worker error:', event.error);
  cleanup();
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

// Cleanup on termination
self.addEventListener('beforeunload', () => {
  cleanup();
});

// Alarm checking functions
function startAlarmChecker() {
  if (isTerminating) return;
  
  stopAlarmChecker(); // Clean up existing interval
  
  console.log('[SW] Starting alarm checker');
  
  alarmCheckInterval = setInterval(() => {
    if (isTerminating) {
      stopAlarmChecker();
      return;
    }
    checkForTriggeredAlarms();
  }, ALARM_CHECK_INTERVAL);
  
  // Check immediately
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
    
    // Check if this is the exact alarm time
    if (alarmHour === currentHour && alarmMinute === currentMinute) {
      // Check if we haven't triggered this alarm recently
      const lastTriggered = alarm.lastTriggered ? new Date(alarm.lastTriggered) : null;
      const shouldTrigger = !lastTriggered || 
        (now.getTime() - lastTriggered.getTime()) > (22 * 60 * 60 * 1000); // 22 hours
      
      if (shouldTrigger) {
        triggerAlarm(alarm);
      }
    }
  });
}

function triggerAlarm(alarm) {
  if (isTerminating) return;
  
  console.log('[SW] Triggering alarm:', alarm.label);
  
  // Show notification
  const notificationOptions = {
    body: `Time for ${alarm.label}!`,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: alarm.id,
    requireInteraction: true,
    vibrate: [500, 200, 500, 200, 500],
    actions: [
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/dismiss-icon.png'
      },
      {
        action: 'snooze',
        title: 'Snooze 5min',
        icon: '/snooze-icon.png'
      }
    ],
    data: {
      alarmId: alarm.id,
      voiceMood: alarm.voiceMood,
      timestamp: Date.now()
    }
  };
  
  self.registration.showNotification('🔔 Smart Alarm', notificationOptions);
  
  // Notify all clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'ALARM_TRIGGERED',
        alarm: alarm
      });
    });
  });
  
  // Update last triggered time
  updateAlarmLastTriggered(alarm.id);
}

function handleAlarmDismiss(alarmId) {
  console.log('[SW] Alarm dismissed:', alarmId);
  
  // Notify clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'ALARM_DISMISSED',
        alarmId: alarmId,
        method: 'notification'
      });
    });
  });
}

function handleAlarmSnooze(alarmId) {
  console.log('[SW] Alarm snoozed:', alarmId);
  
  // Schedule snooze notification with tracked timeout
  const snoozeTime = 5 * 60 * 1000; // 5 minutes
  
  const timeoutId = setTimeout(() => {
    // Remove from active timeouts
    activeTimeouts.delete(timeoutId);
    
    if (!isTerminating) {
      const alarm = cachedAlarms.find(a => a.id === alarmId);
      if (alarm) {
        triggerAlarm(alarm);
      }
    }
  }, snoozeTime);
  
  // Track this timeout for cleanup
  activeTimeouts.add(timeoutId);
  
  // Notify clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'ALARM_SNOOZED',
        alarmId: alarmId,
        snoozeMinutes: 5
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

function cleanup() {
  console.log('[SW] Performing cleanup');
  isTerminating = true;
  
  stopAlarmChecker();
  clearAllTimeouts();
  
  // Clear cached data
  cachedAlarms = [];
}

function clearAllTimeouts() {
  console.log('[SW] Clearing', activeTimeouts.size, 'active timeouts');
  activeTimeouts.forEach(timeoutId => {
    clearTimeout(timeoutId);
  });
  activeTimeouts.clear();
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'alarm-sync') {
    event.waitUntil(syncAlarms());
  }
});

async function syncAlarms() {
  try {
    console.log('[SW] Syncing alarms...');
    
    // This would sync with the server when connectivity is restored
    // For now, we'll just log the attempt
    
    // In a real implementation, you would:
    // 1. Get stored offline changes
    // 2. Send them to the server
    // 3. Fetch latest alarm data
    // 4. Update local cache
    
    console.log('[SW] Alarm sync completed');
  } catch (error) {
    console.error('[SW] Error syncing alarms:', error);
  }
}

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    cleanup();
    self.skipWaiting();
  }
});

// Periodic background sync (if supported)
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
  console.log('[SW] Background sync supported');
} else {
  console.log('[SW] Background sync not supported');
}