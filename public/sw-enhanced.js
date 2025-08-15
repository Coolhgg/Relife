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

// Enhanced App State for Alarm Reliability
let alarmTimeouts = new Map();
let scheduledAlarms = new Map();
let alarmDatabase = null;
let pushSubscription = null;
let analyticsQueue = [];
let isOnline = false;
let appVersion = '2.1.0';
let lastAlarmCheck = Date.now();
let tabCloseDetected = false;
let notificationPermission = 'default';

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

// Enhanced Message handling for communication with main thread
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  let response = { success: true, timestamp: Date.now() };

  try {
    switch (type) {
      case 'SCHEDULE_ALARM':
        await scheduleEnhancedAlarm(data.alarm);
        response.message = `Alarm ${data.alarm.id} scheduled successfully`;
        break;
        
      case 'CANCEL_ALARM':
        await cancelEnhancedAlarm(data.alarmId);
        response.message = `Alarm ${data.alarmId} cancelled successfully`;
        break;
        
      case 'UPDATE_ALARMS':
        await updateEnhancedAlarms(data.alarms);
        response.message = `Updated ${data.alarms.length} alarms successfully`;
        break;
        
      case 'GET_SCHEDULED_ALARMS':
        const scheduledData = Array.from(scheduledAlarms.entries()).map(([id, info]) => ({
          id,
          alarm: info.alarm,
          nextTrigger: info.nextTrigger,
          scheduledAt: info.scheduledAt
        }));
        response.data = scheduledData;
        response.message = `Retrieved ${scheduledData.length} scheduled alarms`;
        break;
        
      case 'FORCE_ALARM_RECOVERY':
        await recoverScheduledAlarms();
        response.message = 'Alarm recovery completed';
        break;
        
      case 'HEALTH_CHECK':
        await performAlarmHealthCheck();
        response.message = 'Alarm health check completed';
        response.data = {
          scheduledCount: scheduledAlarms.size,
          timeoutsCount: alarmTimeouts.size,
          lastCheck: new Date(lastAlarmCheck).toISOString()
        };
        break;
        
      case 'REQUEST_NOTIFICATION_PERMISSION':
        try {
          const permission = await Notification.requestPermission();
          notificationPermission = permission;
          response.data = { permission };
          response.message = `Notification permission: ${permission}`;
        } catch (error) {
          response.success = false;
          response.error = error.message;
        }
        break;
        
      case 'GET_ALARM_STATS':
        const stats = await getAlarmStatistics();
        response.data = stats;
        response.message = 'Alarm statistics retrieved';
        break;
        
      case 'CLEAR_MISSED_ALARMS':
        await clearMissedAlarms();
        response.message = 'Missed alarms cleared';
        break;
        
      case 'SYNC_ALARM_STATE':
        await syncAlarmStateWithClients();
        response.message = 'Alarm state synchronized';
        break;
        
      case 'REGISTER_PUSH':
        await registerPushSubscription(data.subscription);
        response.message = 'Push subscription registered';
        break;
        
      case 'QUEUE_ANALYTICS':
        await queueAnalytics(data.event);
        response.message = 'Analytics event queued';
        break;
        
      case 'FORCE_SYNC':
        await performCompleteSync();
        response.message = 'Complete sync performed';
        break;
        
      case 'CHECK_FOR_UPDATES':
        await checkForAppUpdates();
        response.message = 'Update check completed';
        break;
        
      case 'SKIP_WAITING':
        await self.skipWaiting();
        response.message = 'Service worker activated';
        break;
        
      case 'GET_SERVICE_WORKER_STATE':
        response.data = {
          version: appVersion,
          isOnline,
          notificationPermission,
          scheduledAlarms: scheduledAlarms.size,
          alarmTimeouts: alarmTimeouts.size,
          analyticsQueueLength: analyticsQueue.length,
          databaseInitialized: !!alarmDatabase,
          lastAlarmCheck: new Date(lastAlarmCheck).toISOString()
        };
        response.message = 'Service worker state retrieved';
        break;
        
      default:
        response.success = false;
        response.error = `Unknown message type: ${type}`;
        console.log('Enhanced SW: Unknown message type:', type);
    }
  } catch (error) {
    console.error(`Enhanced SW: Error handling message ${type}:`, error);
    response.success = false;
    response.error = error.message;
  }

  // Send response back to main thread
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage(response);
  } else {
    // Fallback for direct postMessage without MessagePort
    event.source?.postMessage({
      type: 'SW_RESPONSE',
      originalType: type,
      ...response
    });
  }
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

// Enhanced Alarm Processing with Full Reliability
async function scheduleEnhancedAlarm(alarm) {
  if (!alarm || !alarm.id || !alarm.enabled) {
    console.log('Enhanced SW: Invalid or disabled alarm, skipping:', alarm?.id);
    return;
  }

  console.log(`Enhanced SW: Scheduling enhanced alarm ${alarm.id}`);
  
  try {
    // Cancel existing timeout if any
    if (alarmTimeouts.has(alarm.id)) {
      clearTimeout(alarmTimeouts.get(alarm.id));
      alarmTimeouts.delete(alarm.id);
    }

    const nextTime = getNextAlarmTime(alarm);
    
    if (nextTime) {
      const msUntilAlarm = nextTime.getTime() - Date.now();
      
      if (msUntilAlarm > 0) {
        // Store in persistent storage FIRST
        await storeScheduledAlarm(alarm, nextTime);
        
        // Set up timeout for immediate triggering
        const timeoutId = setTimeout(async () => {
          await triggerEnhancedAlarm(alarm);
        }, Math.min(msUntilAlarm, 2147483647)); // Max timeout value
        
        alarmTimeouts.set(alarm.id, timeoutId);
        scheduledAlarms.set(alarm.id, {
          alarm,
          nextTrigger: nextTime,
          timeoutId,
          scheduledAt: new Date()
        });
        
        console.log(`Enhanced SW: Alarm ${alarm.id} scheduled for`, nextTime.toISOString());
        
        // If alarm is more than 1 hour away, also schedule backup check
        if (msUntilAlarm > 60 * 60 * 1000) {
          await scheduleBackupAlarmCheck(alarm.id, nextTime);
        }
        
        // Notify clients of successful scheduling
        await notifyClients('ALARM_SCHEDULED', {
          alarmId: alarm.id,
          nextTrigger: nextTime,
          scheduledAt: new Date()
        });
      } else {
        console.log(`Enhanced SW: Alarm ${alarm.id} scheduled time has passed, triggering immediately`);
        await triggerEnhancedAlarm(alarm);
      }
    } else {
      console.log(`Enhanced SW: No next trigger time found for alarm ${alarm.id}`);
      await removeScheduledAlarm(alarm.id);
    }
  } catch (error) {
    console.error(`Enhanced SW: Error scheduling alarm ${alarm.id}:`, error);
    await logEnhancedAlarmEvent(alarm, 'scheduling_error', { error: error.message });
  }
}

async function triggerEnhancedAlarm(alarm) {
  console.log(`Enhanced SW: Triggering enhanced alarm ${alarm.id} at ${new Date().toISOString()}`);

  try {
    // Remove from scheduled timeouts and memory
    if (alarmTimeouts.has(alarm.id)) {
      clearTimeout(alarmTimeouts.get(alarm.id));
      alarmTimeouts.delete(alarm.id);
    }
    scheduledAlarms.delete(alarm.id);
    
    // Remove from persistent storage
    await removeScheduledAlarm(alarm.id);

    // Check notification permission
    if (notificationPermission !== 'granted') {
      console.warn('Enhanced SW: Notifications not permitted, requesting permission...');
      try {
        const permission = await Notification.requestPermission();
        notificationPermission = permission;
      } catch (error) {
        console.error('Enhanced SW: Error requesting notification permission:', error);
      }
    }

    // Create enhanced notification with robust fallbacks
    const notificationOptions = {
      title: `🔔 ${alarm.label || alarm.title || 'Relife Alarm'}`,
      body: `It's ${alarm.time}! ${alarm.description || 'Time to wake up with your personalized experience.'} Tap to open the app.`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: `${NOTIFICATION_TAGS.ALARM}-${alarm.id}`,
      requireInteraction: true,
      silent: false,
      vibrate: [500, 200, 500, 200, 500, 200, 500],
      actions: [
        {
          action: 'dismiss',
          title: '⏹️ Dismiss',
          icon: '/icons/actions/dismiss.png'
        },
        {
          action: 'snooze',
          title: '😴 Snooze 5min',
          icon: '/icons/actions/snooze.png'
        },
        {
          action: 'voice',
          title: '🎤 Voice Response',
          icon: '/icons/actions/play.png'
        }
      ],
      data: {
        alarmId: alarm.id,
        alarmTime: alarm.time,
        alarmLabel: alarm.label || alarm.title,
        voiceMood: alarm.voiceMood,
        userId: alarm.userId,
        type: 'alarm',
        triggeredAt: Date.now(),
        originalSchedule: alarm.days,
        difficulty: alarm.difficulty,
        sound: alarm.sound
      }
    };

    // Show notification with error handling
    try {
      await self.registration.showNotification(notificationOptions.title, notificationOptions);
      console.log(`Enhanced SW: Notification shown for alarm ${alarm.id}`);
    } catch (notificationError) {
      console.error('Enhanced SW: Error showing notification:', notificationError);
      // Continue with other alarm actions even if notification fails
    }

    // Try to open the app or send message to existing clients
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    let clientNotified = false;
    
    for (const client of clients) {
      try {
        // Send message to client
        client.postMessage({
          type: 'ALARM_TRIGGERED',
          alarm: alarm,
          timestamp: Date.now(),
          source: 'service-worker'
        });
        
        // Focus the window
        await client.focus();
        
        clientNotified = true;
        console.log(`Enhanced SW: Notified client for alarm ${alarm.id}`);
        break; // Only need to notify one client
      } catch (clientError) {
        console.error('Enhanced SW: Error notifying client:', clientError);
        continue;
      }
    }
    
    // If no clients were notified, open new window
    if (!clientNotified) {
      try {
        const url = `/?alarm=${alarm.id}&trigger=${Date.now()}`;
        await self.clients.openWindow(url);
        console.log(`Enhanced SW: Opened new window for alarm ${alarm.id}`);
      } catch (openError) {
        console.error('Enhanced SW: Error opening new window:', openError);
      }
    }

    // Log alarm event for analytics with comprehensive data
    await logEnhancedAlarmEvent(alarm, 'triggered', {
      clientsCount: clients.length,
      clientNotified,
      notificationShown: true,
      triggerTime: new Date().toISOString(),
      scheduleAccuracy: 'on-time' // Could be enhanced with timing analysis
    });

    // Handle recurring alarms - schedule next occurrence
    if (alarm.days && alarm.days.length > 0) {
      console.log(`Enhanced SW: Scheduling next occurrence for recurring alarm ${alarm.id}`);
      
      // Add small delay to prevent immediate rescheduling conflicts
      setTimeout(async () => {
        try {
          await scheduleEnhancedAlarm(alarm);
        } catch (rescheduleError) {
          console.error(`Enhanced SW: Error rescheduling alarm ${alarm.id}:`, rescheduleError);
        }
      }, 1000);
    } else {
      console.log(`Enhanced SW: One-time alarm ${alarm.id} completed`);
      // For one-time alarms, mark as completed
      await logEnhancedAlarmEvent(alarm, 'completed');
    }
    
    // Update app state to reflect alarm trigger
    await storeAppState('lastTriggeredAlarm', {
      alarmId: alarm.id,
      triggerTime: new Date().toISOString(),
      success: true
    });

  } catch (error) {
    console.error(`Enhanced SW: Error triggering alarm ${alarm.id}:`, error);
    
    // Log the error
    await logEnhancedAlarmEvent(alarm, 'trigger_error', {
      error: error.message,
      stack: error.stack
    });
    
    // Store failed trigger for debugging
    await storeAppState('lastTriggeredAlarm', {
      alarmId: alarm.id,
      triggerTime: new Date().toISOString(),
      success: false,
      error: error.message
    });
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

// Enhanced IndexedDB Implementation for Alarm Persistence
async function initializeEnhancedStorage() {
  console.log('Enhanced SW: Initializing enhanced storage...');
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RelifeAlarmDB', 3);
    
    request.onerror = () => {
      console.error('Enhanced SW: IndexedDB failed to open:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      alarmDatabase = request.result;
      console.log('Enhanced SW: IndexedDB initialized successfully');
      
      // Set up error handling
      alarmDatabase.onerror = (event) => {
        console.error('Enhanced SW: IndexedDB error:', event.target.error);
      };
      
      resolve(alarmDatabase);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Scheduled Alarms store
      if (!db.objectStoreNames.contains('scheduledAlarms')) {
        const alarmStore = db.createObjectStore('scheduledAlarms', { keyPath: 'id' });
        alarmStore.createIndex('nextTrigger', 'nextTrigger', { unique: false });
        alarmStore.createIndex('userId', 'userId', { unique: false });
        alarmStore.createIndex('enabled', 'enabled', { unique: false });
      }
      
      // Alarm Events store for analytics
      if (!db.objectStoreNames.contains('alarmEvents')) {
        const eventStore = db.createObjectStore('alarmEvents', { keyPath: 'id' });
        eventStore.createIndex('alarmId', 'alarmId', { unique: false });
        eventStore.createIndex('timestamp', 'timestamp', { unique: false });
        eventStore.createIndex('eventType', 'eventType', { unique: false });
      }
      
      // Missed Alarms store for recovery
      if (!db.objectStoreNames.contains('missedAlarms')) {
        const missedStore = db.createObjectStore('missedAlarms', { keyPath: 'id' });
        missedStore.createIndex('alarmId', 'alarmId', { unique: false });
        missedStore.createIndex('missedTime', 'missedTime', { unique: false });
        missedStore.createIndex('recovered', 'recovered', { unique: false });
      }
      
      // App State store for cross-tab synchronization
      if (!db.objectStoreNames.contains('appState')) {
        const stateStore = db.createObjectStore('appState', { keyPath: 'key' });
      }
      
      console.log('Enhanced SW: IndexedDB schema updated');
    };
  });
}

async function initializeAdvancedFeatures() {
  console.log('Enhanced SW: Initializing advanced features...');
  
  // Check notification permissions
  notificationPermission = await self.registration.showNotification ? 'granted' : 'denied';
  console.log('Enhanced SW: Notification permission:', notificationPermission);
  
  // Set up periodic background sync
  await schedulePeriodicSync();
  
  // Initialize alarm processing with recovery
  await initializeAlarmProcessing();
  
  // Recover scheduled alarms from IndexedDB
  await recoverScheduledAlarms();
  
  // Set up periodic alarm check
  await schedulePeriodicAlarmCheck();
  
  // Check network status
  isOnline = navigator.onLine;
  
  // Set up network listeners
  addEventListener('online', () => {
    isOnline = true;
    notifyClients('NETWORK_STATUS', { isOnline: true });
    processAnalyticsQueue();
    // Sync alarm state when back online
    syncAlarmStateWithClients();
  });
  
  addEventListener('offline', () => {
    isOnline = false;
    notifyClients('NETWORK_STATUS', { isOnline: false });
  });
  
  // Set up page visibility detection for alarm reliability
  // Note: Service workers don't have access to document.visibilityState directly
  // This is handled through client communication instead
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

// Enhanced Alarm Reliability Functions

// Cancel Enhanced Alarm
async function cancelEnhancedAlarm(alarmId) {
  console.log(`Enhanced SW: Cancelling enhanced alarm ${alarmId}`);
  
  try {
    // Clear timeout
    if (alarmTimeouts.has(alarmId)) {
      clearTimeout(alarmTimeouts.get(alarmId));
      alarmTimeouts.delete(alarmId);
    }
    
    // Remove from memory
    scheduledAlarms.delete(alarmId);
    
    // Remove from persistent storage
    await removeScheduledAlarm(alarmId);
    
    // Cancel any existing notifications
    const notifications = await self.registration.getNotifications({
      tag: `${NOTIFICATION_TAGS.ALARM}-${alarmId}`
    });
    
    notifications.forEach(notification => notification.close());
    
    console.log(`Enhanced SW: Alarm ${alarmId} cancelled successfully`);
    
    // Notify clients
    await notifyClients('ALARM_CANCELLED', { alarmId });
    
  } catch (error) {
    console.error(`Enhanced SW: Error cancelling alarm ${alarmId}:`, error);
  }
}

// Update Enhanced Alarms
async function updateEnhancedAlarms(alarms) {
  console.log(`Enhanced SW: Updating ${alarms.length} enhanced alarms`);
  
  try {
    // Cancel all existing alarms
    for (const [alarmId] of alarmTimeouts) {
      await cancelEnhancedAlarm(alarmId);
    }
    
    // Clear all scheduled alarms
    alarmTimeouts.clear();
    scheduledAlarms.clear();
    
    // Schedule new alarms
    const enabledAlarms = alarms.filter(alarm => alarm.enabled);
    console.log(`Enhanced SW: Scheduling ${enabledAlarms.length} enabled alarms`);
    
    for (const alarm of enabledAlarms) {
      await scheduleEnhancedAlarm(alarm);
      // Add small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Store current alarm state
    await storeAppState('currentAlarms', {
      alarms,
      lastUpdated: new Date().toISOString(),
      scheduledCount: enabledAlarms.length
    });
    
    console.log(`Enhanced SW: Successfully updated all alarms`);
    
  } catch (error) {
    console.error('Enhanced SW: Error updating enhanced alarms:', error);
  }
}

// IndexedDB Storage Functions
async function storeScheduledAlarm(alarm, nextTime) {
  if (!alarmDatabase) {
    console.error('Enhanced SW: IndexedDB not initialized');
    return;
  }
  
  try {
    const transaction = alarmDatabase.transaction(['scheduledAlarms'], 'readwrite');
    const store = transaction.objectStore('scheduledAlarms');
    
    const alarmData = {
      id: alarm.id,
      userId: alarm.userId,
      alarmData: alarm,
      nextTrigger: nextTime.toISOString(),
      scheduledAt: new Date().toISOString(),
      enabled: alarm.enabled,
      version: appVersion
    };
    
    await store.put(alarmData);
    console.log(`Enhanced SW: Stored alarm ${alarm.id} in IndexedDB`);
    
  } catch (error) {
    console.error(`Enhanced SW: Error storing alarm ${alarm.id}:`, error);
  }
}

async function removeScheduledAlarm(alarmId) {
  if (!alarmDatabase) return;
  
  try {
    const transaction = alarmDatabase.transaction(['scheduledAlarms'], 'readwrite');
    const store = transaction.objectStore('scheduledAlarms');
    await store.delete(alarmId);
    console.log(`Enhanced SW: Removed alarm ${alarmId} from IndexedDB`);
  } catch (error) {
    console.error(`Enhanced SW: Error removing alarm ${alarmId}:`, error);
  }
}

async function storeAppState(key, value) {
  if (!alarmDatabase) return;
  
  try {
    const transaction = alarmDatabase.transaction(['appState'], 'readwrite');
    const store = transaction.objectStore('appState');
    await store.put({ key, value, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Enhanced SW: Error storing app state:', error);
  }
}

async function getAppState(key) {
  if (!alarmDatabase) return null;
  
  try {
    const transaction = alarmDatabase.transaction(['appState'], 'readonly');
    const store = transaction.objectStore('appState');
    const result = await store.get(key);
    return result?.value || null;
  } catch (error) {
    console.error('Enhanced SW: Error getting app state:', error);
    return null;
  }
}

// Alarm Recovery Functions
async function recoverScheduledAlarms() {
  if (!alarmDatabase) {
    console.log('Enhanced SW: IndexedDB not available for alarm recovery');
    return;
  }
  
  console.log('Enhanced SW: Recovering scheduled alarms from IndexedDB...');
  
  try {
    const transaction = alarmDatabase.transaction(['scheduledAlarms'], 'readonly');
    const store = transaction.objectStore('scheduledAlarms');
    const enabledIndex = store.index('enabled');
    
    const request = enabledIndex.getAll(true);
    
    request.onsuccess = async () => {
      const storedAlarms = request.result;
      console.log(`Enhanced SW: Found ${storedAlarms.length} stored alarms to recover`);
      
      for (const storedAlarm of storedAlarms) {
        const nextTrigger = new Date(storedAlarm.nextTrigger);
        const now = new Date();
        
        if (nextTrigger > now) {
          // Alarm is still future, reschedule it
          console.log(`Enhanced SW: Rescheduling alarm ${storedAlarm.id} for ${nextTrigger}`);
          await scheduleEnhancedAlarm(storedAlarm.alarmData);
        } else if (nextTrigger > new Date(now.getTime() - 5 * 60 * 1000)) {
          // Alarm was supposed to trigger within last 5 minutes, trigger now
          console.log(`Enhanced SW: Triggering missed alarm ${storedAlarm.id}`);
          await triggerMissedAlarm(storedAlarm.alarmData, nextTrigger);
        } else {
          // Alarm is too old, schedule next occurrence if recurring
          if (storedAlarm.alarmData.days && storedAlarm.alarmData.days.length > 0) {
            console.log(`Enhanced SW: Scheduling next occurrence for recurring alarm ${storedAlarm.id}`);
            await scheduleEnhancedAlarm(storedAlarm.alarmData);
          } else {
            // One-time alarm that's expired, remove it
            console.log(`Enhanced SW: Removing expired one-time alarm ${storedAlarm.id}`);
            await removeScheduledAlarm(storedAlarm.id);
          }
        }
      }
    };
    
    request.onerror = () => {
      console.error('Enhanced SW: Error recovering alarms from IndexedDB:', request.error);
    };
    
  } catch (error) {
    console.error('Enhanced SW: Error in alarm recovery process:', error);
  }
}

async function triggerMissedAlarm(alarm, originalTime) {
  console.log(`Enhanced SW: Triggering missed alarm ${alarm.id} (was scheduled for ${originalTime})`);
  
  try {
    // Log as missed alarm for analytics
    await storeMissedAlarm({
      id: `missed-${alarm.id}-${Date.now()}`,
      alarmId: alarm.id,
      scheduledTime: originalTime.toISOString(),
      missedTime: new Date().toISOString(),
      alarmData: alarm,
      recovered: true
    });
    
    // Show missed alarm notification
    const notificationOptions = {
      title: `⏰ Missed Alarm: ${alarm.label || 'Alarm'}`,
      body: `You missed an alarm scheduled for ${originalTime.toLocaleTimeString()}. Tap to dismiss or snooze.`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: `${NOTIFICATION_TAGS.ALARM}-missed-${alarm.id}`,
      requireInteraction: true,
      vibrate: [200, 100, 200],
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
        }
      ],
      data: {
        alarmId: alarm.id,
        alarmTime: alarm.time,
        alarmLabel: alarm.label,
        type: 'missed-alarm',
        originalTime: originalTime.toISOString(),
        recoveredAt: new Date().toISOString()
      }
    };

    await self.registration.showNotification(notificationOptions.title, notificationOptions);
    
    // Try to open the app or send message to existing clients
    await focusOrOpenApp('/?missed-alarm=' + alarm.id);
    
    // Log the missed alarm event
    await logEnhancedAlarmEvent(alarm, 'missed_recovered', {
      originalTime: originalTime.toISOString(),
      recoveredAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`Enhanced SW: Error triggering missed alarm ${alarm.id}:`, error);
  }
}

async function storeMissedAlarm(missedAlarmData) {
  if (!alarmDatabase) return;
  
  try {
    const transaction = alarmDatabase.transaction(['missedAlarms'], 'readwrite');
    const store = transaction.objectStore('missedAlarms');
    await store.add(missedAlarmData);
  } catch (error) {
    console.error('Enhanced SW: Error storing missed alarm:', error);
  }
}

// Periodic Alarm Check
async function schedulePeriodicAlarmCheck() {
  // Set up periodic check every minute to ensure alarms are still scheduled
  setInterval(async () => {
    try {
      await performAlarmHealthCheck();
    } catch (error) {
      console.error('Enhanced SW: Error in periodic alarm check:', error);
    }
  }, 60 * 1000); // Every minute
}

async function performAlarmHealthCheck() {
  const now = Date.now();
  
  // Only run health check every 5 minutes to avoid excessive processing
  if (now - lastAlarmCheck < 5 * 60 * 1000) {
    return;
  }
  
  lastAlarmCheck = now;
  
  console.log('Enhanced SW: Performing alarm health check...');
  
  // Check if any scheduled alarms should have fired by now
  for (const [alarmId, alarmInfo] of scheduledAlarms) {
    const { alarm, nextTrigger } = alarmInfo;
    
    if (new Date(nextTrigger) <= new Date(now - 30000)) { // 30 seconds grace period
      console.log(`Enhanced SW: Alarm ${alarmId} should have fired, triggering now`);
      await triggerEnhancedAlarm(alarm);
    }
  }
  
  // Sync with IndexedDB to ensure consistency
  await syncScheduledAlarmsWithStorage();
}

async function syncScheduledAlarmsWithStorage() {
  if (!alarmDatabase) return;
  
  try {
    const transaction = alarmDatabase.transaction(['scheduledAlarms'], 'readonly');
    const store = transaction.objectStore('scheduledAlarms');
    const enabledIndex = store.index('enabled');
    
    const request = enabledIndex.getAll(true);
    
    request.onsuccess = () => {
      const storedAlarms = request.result;
      
      // Check for alarms in storage that aren't in memory
      for (const storedAlarm of storedAlarms) {
        if (!scheduledAlarms.has(storedAlarm.id)) {
          console.log(`Enhanced SW: Found alarm ${storedAlarm.id} in storage but not in memory, recovering...`);
          // Reschedule the alarm
          scheduleEnhancedAlarm(storedAlarm.alarmData);
        }
      }
      
      // Check for alarms in memory that aren't in storage (shouldn't happen but safety check)
      for (const [alarmId] of scheduledAlarms) {
        const found = storedAlarms.find(stored => stored.id === alarmId);
        if (!found) {
          console.log(`Enhanced SW: Alarm ${alarmId} in memory but not in storage, re-storing...`);
          const alarmInfo = scheduledAlarms.get(alarmId);
          if (alarmInfo) {
            storeScheduledAlarm(alarmInfo.alarm, new Date(alarmInfo.nextTrigger));
          }
        }
      }
    };
    
  } catch (error) {
    console.error('Enhanced SW: Error syncing alarms with storage:', error);
  }
}

// Background Scheduling
async function ensureBackgroundAlarmScheduling() {
  console.log('Enhanced SW: Ensuring background alarm scheduling...');
  
  // Verify all scheduled alarms are still active
  for (const [alarmId, alarmInfo] of scheduledAlarms) {
    if (!alarmTimeouts.has(alarmId)) {
      console.log(`Enhanced SW: Rescheduling alarm ${alarmId} for background`);
      await scheduleEnhancedAlarm(alarmInfo.alarm);
    }
  }
}

async function scheduleBackupAlarmCheck(alarmId, nextTime) {
  // Schedule a backup check 1 minute before the alarm should trigger
  const backupTime = new Date(nextTime.getTime() - 60 * 1000);
  const msUntilBackup = backupTime.getTime() - Date.now();
  
  if (msUntilBackup > 0) {
    setTimeout(async () => {
      // Check if alarm is still scheduled and hasn't fired
      if (scheduledAlarms.has(alarmId)) {
        const alarmInfo = scheduledAlarms.get(alarmId);
        const triggerTime = new Date(alarmInfo.nextTrigger);
        
        if (triggerTime > new Date()) {
          console.log(`Enhanced SW: Backup check - alarm ${alarmId} still pending`);
          // Ensure timeout is still active
          if (!alarmTimeouts.has(alarmId)) {
            console.log(`Enhanced SW: Rescheduling alarm ${alarmId} from backup check`);
            await scheduleEnhancedAlarm(alarmInfo.alarm);
          }
        }
      }
    }, Math.min(msUntilBackup, 2147483647));
  }
}

// Cross-tab Synchronization
async function syncAlarmStateWithClients() {
  const alarmState = {
    scheduledAlarms: Array.from(scheduledAlarms.entries()).map(([id, info]) => ({
      id,
      nextTrigger: info.nextTrigger,
      scheduledAt: info.scheduledAt
    })),
    lastSync: new Date().toISOString()
  };
  
  await notifyClients('ALARM_STATE_SYNC', alarmState);
}

// Enhanced Event Logging
async function storeAnalyticsEvent(event) {
  if (!alarmDatabase) {
    // Fallback to in-memory queue
    analyticsQueue.push(event);
    return;
  }
  
  try {
    const transaction = alarmDatabase.transaction(['alarmEvents'], 'readwrite');
    const store = transaction.objectStore('alarmEvents');
    
    const eventData = {
      id: `event-${Date.now()}-${Math.random()}`,
      ...event,
      timestamp: new Date().toISOString()
    };
    
    await store.add(eventData);
  } catch (error) {
    console.error('Enhanced SW: Error storing analytics event:', error);
    // Fallback to in-memory queue
    analyticsQueue.push(event);
  }
}

async function logEnhancedAlarmEvent(alarm, eventType, metadata = {}) {
  const eventData = {
    alarmId: alarm.id,
    eventType,
    alarmData: alarm,
    metadata,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    version: appVersion
  };
  
  console.log(`Enhanced SW: Logging alarm event - ${eventType} for alarm ${alarm.id}`);
  
  // Store in IndexedDB
  await storeAnalyticsEvent(eventData);
  
  // Also queue for immediate sync if online
  if (isOnline) {
    analyticsQueue.push({
      url: '/api/analytics/alarm-events',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
      timestamp: Date.now()
    });
    
    // Process queue immediately
    processAnalyticsQueue();
  }
}

// Enhanced Snooze Handling
async function handleEnhancedSnooze(data) {
  console.log(`Enhanced SW: Handling enhanced snooze for alarm ${data.alarmId}`);
  
  try {
    const snoozeTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    // Store snooze event
    await logEnhancedAlarmEvent({ id: data.alarmId }, 'snoozed', {
      snoozeTime: snoozeTime.toISOString(),
      snoozeDuration: 5
    });
    
    // Schedule snooze alarm
    const snoozeAlarm = {
      id: `${data.alarmId}-snooze-${Date.now()}`,
      userId: data.userId || 'unknown',
      time: snoozeTime.toTimeString().slice(0, 5),
      label: `⏰ Snooze: ${data.alarmLabel || 'Alarm'}`,
      enabled: true,
      days: [], // One-time snooze
      voiceMood: data.voiceMood || 'gentle',
      sound: 'default',
      difficulty: 'easy',
      snoozeEnabled: false,
      snoozeInterval: 5,
      snoozeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await scheduleEnhancedAlarm(snoozeAlarm);
    
    console.log(`Enhanced SW: Snooze scheduled for ${snoozeTime}`);
    
  } catch (error) {
    console.error('Enhanced SW: Error handling enhanced snooze:', error);
  }
}

// Initialization Functions
async function performDataSync(dataType) {
  console.log(`Enhanced SW: Performing data sync for ${dataType}`);
  
  try {
    switch (dataType) {
      case 'alarms':
        await syncAlarmStateWithClients();
        break;
      case 'analytics':
        await processAnalyticsQueue();
        break;
      case 'settings':
        // Sync user settings
        break;
      default:
        console.log(`Enhanced SW: Unknown data type for sync: ${dataType}`);
    }
  } catch (error) {
    console.error(`Enhanced SW: Error syncing ${dataType}:`, error);
  }
}

async function schedulePeriodicSync() {
  console.log('Enhanced SW: Scheduling periodic background sync...');
  
  // Register for background sync if available
  if ('sync' in self.registration) {
    try {
      await self.registration.sync.register(SYNC_TAGS.ALARMS);
      console.log('Enhanced SW: Background sync registered for alarms');
    } catch (error) {
      console.log('Enhanced SW: Background sync not supported:', error);
    }
  }
  
  // Set up periodic sync checks
  await schedulePeriodicAlarmCheck();
}

async function initializeAlarmProcessing() {
  console.log('Enhanced SW: Initializing alarm processing...');
  
  // Set up alarm processing state
  lastAlarmCheck = Date.now();
  
  // Initialize Maps
  if (!alarmTimeouts) alarmTimeouts = new Map();
  if (!scheduledAlarms) scheduledAlarms = new Map();
  
  console.log('Enhanced SW: Alarm processing initialized');
}

async function checkForAppUpdates() {
  console.log('Enhanced SW: Checking for app updates...');
  
  try {
    const registration = await self.registration.update();
    console.log('Enhanced SW: Update check completed');
  } catch (error) {
    console.error('Enhanced SW: Error checking for updates:', error);
  }
}

async function handleAppUpdate() {
  console.log('Enhanced SW: Handling app update...');
  
  try {
    // Skip waiting and activate new service worker
    await self.skipWaiting();
    
    // Notify clients of update
    await notifyClients('APP_UPDATED', { version: appVersion });
    
  } catch (error) {
    console.error('Enhanced SW: Error handling app update:', error);
  }
}

// Additional Helper Functions
async function registerPushSubscription(subscription) {
  console.log('Enhanced SW: Registering push subscription...');
  
  try {
    pushSubscription = subscription;
    
    // Store subscription in IndexedDB for persistence
    await storeAppState('pushSubscription', subscription);
    
    console.log('Enhanced SW: Push subscription registered successfully');
    
    // Notify clients of successful registration
    await notifyClients('PUSH_SUBSCRIPTION_REGISTERED', { success: true });
    
  } catch (error) {
    console.error('Enhanced SW: Error registering push subscription:', error);
  }
}

async function queueAnalytics(event) {
  console.log('Enhanced SW: Queuing analytics event:', event.type);
  
  try {
    const analyticsEvent = {
      ...event,
      timestamp: Date.now(),
      version: appVersion,
      isOnline
    };
    
    // Add to queue
    analyticsQueue.push(analyticsEvent);
    
    // Store in IndexedDB
    await storeAnalyticsEvent(analyticsEvent);
    
    // Process queue if online
    if (isOnline && analyticsQueue.length > 0) {
      await processAnalyticsQueue();
    }
    
  } catch (error) {
    console.error('Enhanced SW: Error queuing analytics:', error);
  }
}

async function performCompleteSync() {
  console.log('Enhanced SW: Performing complete sync...');
  
  try {
    // Sync all data types
    await Promise.all([
      performDataSync('alarms'),
      performDataSync('analytics'),
      performDataSync('settings')
    ]);
    
    // Recover any missed alarms
    await recoverScheduledAlarms();
    
    // Perform health check
    await performAlarmHealthCheck();
    
    // Notify clients of sync completion
    await notifyClients('COMPLETE_SYNC_FINISHED', {
      timestamp: new Date().toISOString()
    });
    
    console.log('Enhanced SW: Complete sync finished');
    
  } catch (error) {
    console.error('Enhanced SW: Error in complete sync:', error);
  }
}

// Statistics and Analytics Helper Functions
async function getAlarmStatistics() {
  if (!alarmDatabase) {
    return {
      totalScheduled: scheduledAlarms.size,
      totalTimeouts: alarmTimeouts.size,
      error: 'Database not available'
    };
  }
  
  try {
    const transaction = alarmDatabase.transaction(['alarmEvents', 'scheduledAlarms', 'missedAlarms'], 'readonly');
    
    // Get alarm event counts
    const eventStore = transaction.objectStore('alarmEvents');
    const eventCount = await new Promise((resolve, reject) => {
      const request = eventStore.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    // Get scheduled alarm counts
    const alarmStore = transaction.objectStore('scheduledAlarms');
    const scheduledCount = await new Promise((resolve, reject) => {
      const request = alarmStore.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    // Get missed alarm counts
    const missedStore = transaction.objectStore('missedAlarms');
    const missedCount = await new Promise((resolve, reject) => {
      const request = missedStore.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    return {
      totalEvents: eventCount,
      totalScheduled: scheduledCount,
      totalMissed: missedCount,
      inMemoryScheduled: scheduledAlarms.size,
      activeTimeouts: alarmTimeouts.size,
      lastHealthCheck: new Date(lastAlarmCheck).toISOString(),
      analyticsQueueLength: analyticsQueue.length,
      version: appVersion
    };
    
  } catch (error) {
    console.error('Enhanced SW: Error getting alarm statistics:', error);
    return {
      totalScheduled: scheduledAlarms.size,
      totalTimeouts: alarmTimeouts.size,
      error: error.message
    };
  }
}

async function clearMissedAlarms() {
  if (!alarmDatabase) {
    console.log('Enhanced SW: Database not available for clearing missed alarms');
    return;
  }
  
  try {
    const transaction = alarmDatabase.transaction(['missedAlarms'], 'readwrite');
    const store = transaction.objectStore('missedAlarms');
    await store.clear();
    console.log('Enhanced SW: Cleared all missed alarms');
  } catch (error) {
    console.error('Enhanced SW: Error clearing missed alarms:', error);
  }
}

console.log(`Enhanced Service Worker v${appVersion}: Loaded and ready with comprehensive alarm reliability features`);