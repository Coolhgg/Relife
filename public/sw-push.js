// Enhanced Service Worker with Push Notification Support
const CACHE_NAME = 'relife-alarm-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/manifest.json'
];

// Notification sound files
const NOTIFICATION_SOUNDS = {
  'alarm.wav': '/sounds/alarm.wav',
  'beep.wav': '/sounds/beep.wav',
  'emergency.wav': '/sounds/emergency.wav'
};

// Global state
let alarms = [];
let isOnline = navigator.onLine;
let syncQueue = [];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker with push support...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event with offline support
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Add to cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            throw new Error('Network request failed and no cache available');
          });
      })
  );
});

// Push notification received
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  if (!event.data) {
    console.log('[SW] Push event with no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);

    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      tag: data.tag || 'relife-notification',
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      vibrate: data.vibrate || [200, 100, 200],
      data: data.data || {},
      actions: data.actions || []
    };

    // Add default actions for alarm notifications
    if (data.category === 'alarm') {
      options.actions = [
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss.png'
        },
        {
          action: 'snooze',
          title: 'Snooze 5min',
          icon: '/icons/snooze.png'
        }
      ];
      options.requireInteraction = true;
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
        .then(() => {
          console.log('[SW] Notification shown successfully');
          
          // Track notification display
          sendMessageToClients({
            type: 'PUSH_NOTIFICATION_SHOWN',
            data: {
              title: data.title,
              category: data.category,
              timestamp: new Date().toISOString()
            }
          });

          // Play sound if not silent
          if (!data.silent && data.sound) {
            playNotificationSound(data.sound);
          }
        })
        .catch((error) => {
          console.error('[SW] Error showing notification:', error);
        })
    );
  } catch (error) {
    console.error('[SW] Error processing push notification:', error);
  }
});

// Notification clicked
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  // Handle different actions
  if (action === 'dismiss') {
    handleNotificationAction('dismiss', data);
  } else if (action === 'snooze') {
    handleNotificationAction('snooze', data);
  } else {
    // Default action (clicking the notification body)
    handleNotificationAction('open', data);
  }

  event.waitUntil(
    // Focus or open the app
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Try to find an existing client to focus
        for (const client of clients) {
          if (client.url === self.registration.scope && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if no existing client found
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
      .then(() => {
        // Send action to client
        sendMessageToClients({
          type: 'NOTIFICATION_ACTION_PERFORMED',
          data: {
            action: action || 'click',
            notificationData: data,
            timestamp: new Date().toISOString()
          }
        });
      })
  );
});

// Notification closed
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
  
  const notification = event.notification;
  const data = notification.data || {};

  // Track notification closure
  sendMessageToClients({
    type: 'NOTIFICATION_CLOSED',
    data: {
      tag: notification.tag,
      data: data,
      timestamp: new Date().toISOString()
    }
  });
});

// Background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  } else if (event.tag === 'alarm-sync') {
    event.waitUntil(syncAlarms());
  }
});

// Message from client
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  console.log('[SW] Message received:', type, data);

  switch (type) {
    case 'UPDATE_ALARMS':
      alarms = data.alarms || [];
      console.log('[SW] Alarms updated:', alarms.length);
      scheduleNextAlarm();
      break;
    
    case 'SCHEDULE_ALARM_NOTIFICATION':
      scheduleAlarmNotification(data.alarm, data.time);
      break;
    
    case 'CANCEL_ALARM_NOTIFICATION':
      cancelAlarmNotification(data.alarmId);
      break;
    
    case 'TEST_PUSH_NOTIFICATION':
      showTestNotification();
      break;
    
    case 'REQUEST_NETWORK_STATUS':
      sendNetworkStatus();
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Online/Offline events
self.addEventListener('online', () => {
  isOnline = true;
  console.log('[SW] Back online');
  sendNetworkStatus();
  processQueuedSyncs();
});

self.addEventListener('offline', () => {
  isOnline = false;
  console.log('[SW] Gone offline');
  sendNetworkStatus();
});

// Helper Functions

function sendMessageToClients(message) {
  self.clients.matchAll({ includeUncontrolled: true })
    .then((clients) => {
      clients.forEach((client) => {
        client.postMessage(message);
      });
    })
    .catch((error) => {
      console.error('[SW] Error sending message to clients:', error);
    });
}

function sendNetworkStatus() {
  sendMessageToClients({
    type: 'NETWORK_STATUS',
    data: { isOnline }
  });
}

function handleNotificationAction(action, data) {
  console.log('[SW] Handling notification action:', action, data);
  
  switch (action) {
    case 'dismiss':
      if (data.alarmId) {
        // Cancel any pending notifications for this alarm
        cancelAlarmNotification(data.alarmId);
      }
      break;
    
    case 'snooze':
      if (data.alarmId) {
        // Schedule snooze notification
        scheduleSnoozeNotification(data.alarmId, 5); // 5 minutes
      }
      break;
    
    case 'open':
    default:
      // App will be focused/opened by the main event handler
      break;
  }

  // Track the action
  sendMessageToClients({
    type: 'NOTIFICATION_ANALYTICS',
    data: {
      action,
      alarmId: data.alarmId,
      notificationType: data.type,
      timestamp: new Date().toISOString()
    }
  });
}

function scheduleAlarmNotification(alarm, time) {
  // For demo purposes, we'll use setTimeout
  // In production, you'd want a more robust scheduling system
  const now = new Date();
  const scheduledTime = new Date(time);
  const delay = scheduledTime.getTime() - now.getTime();

  if (delay > 0) {
    setTimeout(() => {
      const notificationData = {
        title: `🔔 ${alarm.label}`,
        body: 'Your alarm is ringing!',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: `alarm_${alarm.id}`,
        category: 'alarm',
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 500],
        data: {
          alarmId: alarm.id,
          type: 'alarm',
          voiceMood: alarm.voiceMood
        },
        sound: 'alarm.wav'
      };

      self.registration.showNotification(notificationData.title, notificationData);
    }, delay);
  }
}

function scheduleSnoozeNotification(alarmId, minutes) {
  const delay = minutes * 60 * 1000; // Convert to milliseconds

  setTimeout(() => {
    const notificationData = {
      title: '😴 Snooze Time Up',
      body: 'Your snoozed alarm is ringing again!',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `snooze_${alarmId}`,
      category: 'alarm',
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300],
      data: {
        alarmId: alarmId,
        type: 'snooze'
      },
      sound: 'alarm.wav'
    };

    self.registration.showNotification(notificationData.title, notificationData);
  }, delay);
}

function cancelAlarmNotification(alarmId) {
  // Cancel any scheduled notifications for this alarm
  self.registration.getNotifications({ tag: `alarm_${alarmId}` })
    .then((notifications) => {
      notifications.forEach(notification => notification.close());
    });
    
  self.registration.getNotifications({ tag: `snooze_${alarmId}` })
    .then((notifications) => {
      notifications.forEach(notification => notification.close());
    });
}

function scheduleNextAlarm() {
  if (alarms.length === 0) return;

  // Find the next alarm to ring
  const now = new Date();
  let nextAlarm = null;
  let nextTime = null;

  for (const alarm of alarms) {
    if (!alarm.enabled) continue;

    // Calculate next occurrence for this alarm
    const alarmTime = calculateNextAlarmTime(alarm, now);
    
    if (alarmTime && (!nextTime || alarmTime < nextTime)) {
      nextAlarm = alarm;
      nextTime = alarmTime;
    }
  }

  if (nextAlarm && nextTime) {
    console.log('[SW] Next alarm scheduled:', nextAlarm.label, 'at', nextTime);
    scheduleAlarmNotification(nextAlarm, nextTime);
  }
}

function calculateNextAlarmTime(alarm, fromTime) {
  // This is a simplified version - in production you'd want more robust date/time handling
  const [hours, minutes] = alarm.time.split(':').map(Number);
  const nextTime = new Date(fromTime);
  
  nextTime.setHours(hours, minutes, 0, 0);
  
  // If the time has already passed today, schedule for tomorrow
  if (nextTime <= fromTime) {
    nextTime.setDate(nextTime.getDate() + 1);
  }
  
  return nextTime;
}

function showTestNotification() {
  const notificationData = {
    title: '🔔 Test Notification',
    body: 'This is a test push notification from Relife Alarm!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'test_notification',
    vibrate: [200, 100, 200],
    data: {
      type: 'test',
      timestamp: new Date().toISOString()
    }
  };

  self.registration.showNotification(notificationData.title, notificationData);
}

function playNotificationSound(soundName) {
  // This is a placeholder - actual sound playing would depend on browser support
  // and might require interaction with the client
  console.log('[SW] Playing notification sound:', soundName);
}

function doBackgroundSync() {
  console.log('[SW] Performing background sync...');
  
  return Promise.resolve()
    .then(() => {
      // Process any queued operations
      return processQueuedSyncs();
    })
    .then(() => {
      // Sync alarm data if online
      if (isOnline) {
        return syncAlarms();
      }
    })
    .then(() => {
      console.log('[SW] Background sync completed');
    })
    .catch((error) => {
      console.error('[SW] Background sync failed:', error);
    });
}

function processQueuedSyncs() {
  if (syncQueue.length === 0) return Promise.resolve();

  console.log('[SW] Processing', syncQueue.length, 'queued sync operations');
  
  const operations = syncQueue.slice();
  syncQueue = [];

  return Promise.all(
    operations.map((operation) => {
      return processQueuedOperation(operation)
        .catch((error) => {
          console.error('[SW] Failed to process queued operation:', error);
          // Re-queue on failure
          syncQueue.push(operation);
        });
    })
  );
}

function processQueuedOperation(operation) {
  // Process individual sync operations
  console.log('[SW] Processing operation:', operation.type);
  
  switch (operation.type) {
    case 'alarm_update':
      return syncAlarmUpdate(operation.data);
    case 'settings_sync':
      return syncSettings(operation.data);
    default:
      return Promise.resolve();
  }
}

function syncAlarms() {
  console.log('[SW] Syncing alarms...');
  
  // Send sync request to clients
  sendMessageToClients({
    type: 'SYNC_REQUEST',
    data: { type: 'alarms' }
  });
  
  return Promise.resolve();
}

function syncAlarmUpdate(alarmData) {
  console.log('[SW] Syncing alarm update:', alarmData.id);
  return Promise.resolve();
}

function syncSettings(settingsData) {
  console.log('[SW] Syncing settings:', Object.keys(settingsData));
  return Promise.resolve();
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

console.log('[SW] Service worker with push notification support loaded');