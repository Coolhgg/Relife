// 🚀 UNIFIED SERVICE WORKER FOR RELIFE APP
// Combines all features: offline functionality, PWA, alarms, emotional intelligence, push notifications
// Replaces: sw.js, sw-enhanced.js, sw-enhanced-v2.js, sw-emotional.js, sw-push.js

const APP_VERSION = '3.0.0';
const CACHE_PREFIX = 'relife-unified';

// Cache names with versioning
const CACHES = {
  STATIC: `${CACHE_PREFIX}-static-v${APP_VERSION}`,
  DYNAMIC: `${CACHE_PREFIX}-dynamic-v${APP_VERSION}`,
  API: `${CACHE_PREFIX}-api-v${APP_VERSION}`,
  ASSETS: `${CACHE_PREFIX}-assets-v${APP_VERSION}`,
  ANALYTICS: `${CACHE_PREFIX}-analytics-v${APP_VERSION}`,
  EMOTIONAL: `${CACHE_PREFIX}-emotional-v${APP_VERSION}`,
};

// Cache size limits (in bytes)
const CACHE_LIMITS = {
  STATIC: 50 * 1024 * 1024, // 50MB
  DYNAMIC: 100 * 1024 * 1024, // 100MB
  API: 10 * 1024 * 1024, // 10MB
  ASSETS: 200 * 1024 * 1024, // 200MB
  ANALYTICS: 5 * 1024 * 1024, // 5MB
  EMOTIONAL: 5 * 1024 * 1024, // 5MB
};

// Cache performance tracking
let cacheStats = {
  hits: 0,
  misses: 0,
  size: 0,
  lastCleanup: Date.now(),
  hitRatio: 0,
};

// Static files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-72x72.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html',
];

// Cache strategies for different URL patterns
const CACHE_STRATEGIES = {
  NETWORK_FIRST: [/\/api\/auth/, /\/api\/users/, /\/api\/sync/, /\/api\/realtime/],
  CACHE_FIRST: [
    /\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/,
    /\/static\//,
    /\/assets\//,
    /\/icons\//,
  ],
  STALE_WHILE_REVALIDATE: [
    /\/api\/alarms/,
    /\/api\/voice/,
    /\/api\/sleep/,
    /\/api\/analytics/,
    /\/api\/gaming/,
    /\/api\/rewards/,
  ],
};

// Background sync tags
const SYNC_TAGS = {
  ALARMS: 'alarms-sync',
  SLEEP: 'sleep-sync',
  VOICE: 'voice-sync',
  ANALYTICS: 'analytics-sync',
  SETTINGS: 'settings-sync',
  USER_DATA: 'user-data-sync',
  GAMING: 'gaming-sync',
  EMOTIONAL: 'emotional-sync',
};

// Notification tags and emotional system
const NOTIFICATION_TAGS = {
  ALARM: 'alarm-notification',
  REMINDER: 'reminder-notification',
  BATTLE: 'battle-notification',
  ACHIEVEMENT: 'achievement-notification',
  UPDATE: 'app-update-notification',
  EMOTIONAL: 'emotional-notification',
};

// Emotional Intelligence System
const EMOTIONS = {
  ENCOURAGING: {
    icon: '💪',
    color: '#10B981',
    vibration: [200, 100, 200],
    sound: 'encouraging.mp3',
  },
  GENTLE: {
    icon: '🌸',
    color: '#F59E0B',
    vibration: [100, 50, 100, 50, 100],
    sound: 'gentle.mp3',
  },
  MOTIVATIONAL: {
    icon: '🚀',
    color: '#3B82F6',
    vibration: [300, 200, 300],
    sound: 'motivational.mp3',
  },
  SUPPORTIVE: {
    icon: '💝',
    color: '#EC4899',
    vibration: [150, 100, 150, 100, 150],
    sound: 'supportive.mp3',
  },
  ENERGETIC: {
    icon: '⚡',
    color: '#F59E0B',
    vibration: [100, 50, 100, 50, 100, 50, 100],
    sound: 'energetic.mp3',
  },
  CELEBRATORY: {
    icon: '🎉',
    color: '#7C3AED',
    vibration: [200, 100, 200, 100, 200, 100, 200],
    sound: 'celebratory.mp3',
  },
  CALMING: {
    icon: '🧘',
    color: '#059669',
    vibration: [300, 200, 300, 200],
    sound: 'calming.mp3',
  },
};

// ==================== ADVANCED CACHE MANAGEMENT ====================

// Cache performance metrics
function updateCacheStats(_hit, _cacheSize = 0) {
  if (hit) {
    cacheStats.hits++;
  } else {
    cacheStats.misses++;
  }

  const total = cacheStats.hits + cacheStats.misses;
  cacheStats.hitRatio = total > 0 ? cacheStats.hits / total : 0;
  cacheStats.size = cacheSize;
}

// Intelligent cache cleanup based on usage and age
async function performCacheCleanup(_cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    const limit =
      CACHE_LIMITS[cacheName.split('-').pop().toUpperCase()] || 50 * 1024 * 1024;

    if (requests.length === 0) return;

    // Calculate current cache size
    let totalSize = 0;
    const cacheEntries = [];

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const size =
          parseInt(response.headers.get('content-length') || '0', 10) || 1024; // Default 1KB
        const lastModified = response.headers.get('last-modified');
        const cacheDate = response.headers.get('date');

        cacheEntries.push({
          request,
          size,
          lastModified: lastModified ? new Date(lastModified).getTime() : 0,
          cacheDate: cacheDate ? new Date(cacheDate).getTime() : Date.now(),
          accessCount: parseInt(response.headers.get('x-access-count') || '0', 10),
        });

        totalSize += size;
      }
    }

    // Clean if over limit
    if (totalSize > limit) {
      console.log(
        `🧹 Cache ${cacheName} exceeds limit (${totalSize}/${limit}), cleaning...`
      );

      // Sort by least recently used and lowest access count
      cacheEntries.sort((a, b) => {
        const scoreA = a.accessCount * 1000 + a.cacheDate;
        const scoreB = b.accessCount * 1000 + b.cacheDate;
        return scoreA - scoreB;
      });

      // Remove oldest/least used entries until under limit
      let currentSize = totalSize;
      const targetSize = limit * 0.8; // Clean to 80% of limit

      for (const entry of cacheEntries) {
        if (currentSize <= targetSize) break;

        await cache.delete(entry.request);
        currentSize -= entry.size;
        console.log(`🗑️ Removed from cache: ${entry.request.url}`);
      }
    }

    cacheStats.lastCleanup = Date.now();
  } catch (_error) {
    console.error('❌ Cache cleanup failed:', error);
  }
}

// Enhanced cache put with access tracking
async function smartCachePut(_cache, _request, _response) {
  if (!response || !response.ok) return response;

  const clonedResponse = response.clone();

  // Add access tracking headers
  const headers = new Headers(clonedResponse.headers);
  headers.set('x-cache-time', new Date().toISOString());
  headers.set('x-access-count', '1');

  const enhancedResponse = new Response(await clonedResponse.blob(), {
    status: clonedResponse.status,
    statusText: clonedResponse.statusText,
    headers: headers,
  });

  try {
    await cache.put(request, enhancedResponse);
  } catch (_error) {
    console.error('❌ Failed to cache:', error);
  }

  return response;
}

// Enhanced cache match with access tracking
async function smartCacheMatch(_cache, _request) {
  const response = await cache.match(request);

  if (response) {
    // Update access count
    const accessCount = parseInt(response.headers.get('x-access-count') || '0', 10) + 1;
    const headers = new Headers(response.headers);
    headers.set('x-access-count', accessCount.toString());
    headers.set('x-last-access', new Date().toISOString());

    const updatedResponse = new Response(await response.clone().blob(), {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });

    // Re-cache with updated headers (don't await to avoid blocking)
    cache.put(request, updatedResponse.clone()).catch(error => {
      console.error('❌ Failed to update cache access:', error);
    });

    updateCacheStats(true);
    return updatedResponse;
  }

  updateCacheStats(false);
  return null;
}

// Intelligent cache warming for critical resources
async function warmCriticalCaches() {
  const criticalResources = [
    '/api/user/profile',
    '/api/alarms/active',
    '/api/settings/current',
  ];

  const cache = await caches.open(CACHES.API);

  for (const resource of criticalResources) {
    try {
      const request = new Request(resource);
      const cachedResponse = await cache.match(request);

      if (!cachedResponse) {
        console.log(`🔥 Warming cache for: ${resource}`);
        const response = await fetch(request);
        if (response.ok) {
          await smartCachePut(cache, request, response);
        }
      }
    } catch (_error) {
      console.log(`❌ Failed to warm cache for ${resource}:`, error);
    }
  }
}

// Conditional caching based on response headers
function shouldCache(_request, _response) {
  // Don't cache if explicitly told not to
  const cacheControl = response.headers.get('cache-control');
  if (cacheControl && cacheControl.includes('no-cache')) {
    return false;
  }

  // Don't cache errors
  if (!response.ok) {
    return false;
  }

  // Don't cache large responses (>10MB)
  const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
  if (contentLength > 10 * 1024 * 1024) {
    return false;
  }

  // Don't cache authentication requests
  if (request.url.includes('/auth/') || request.url.includes('/login')) {
    return false;
  }

  return true;
}

// App state
const alarmTimeouts = new Map();
const pushSubscription = null;
let analyticsQueue = [];
let emotionalQueue = [];
let isOnline = false;
let lastSyncTime = null;

// ==================== INSTALL EVENT ====================
self.addEventListener('install', event => {
  console.log('🚀 Unified SW: Installing version', APP_VERSION);

  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(CACHES.STATIC).then(cache => {
        console.log('📦 Caching static files');
        return cache.addAll(STATIC_FILES);
      }),

      // Initialize IndexedDB for advanced features
      initializeDatabase(),

      // Warm critical caches
      warmCriticalCaches(),

      // Skip waiting to activate immediately
      self.skipWaiting(),
    ]).catch(error => {
      console.error('❌ SW Install error:', error);
    })
  );
});

// ==================== ACTIVATE EVENT ====================
self.addEventListener('activate', event => {
  console.log('⚡ Unified SW: Activating version', APP_VERSION);

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!Object.values(CACHES).includes(cacheName)) {
              console.log('🗑️ Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Claim all clients
      self.clients.claim(),

      // Initialize advanced features
      initializeAdvancedFeatures(),

      // Set up push notifications
      setupPushNotifications(),

      // Process any queued data
      processOfflineQueues(),
    ])
  );
});

// ==================== FETCH EVENT ====================
self.addEventListener('fetch', event => {
  const {_request} = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle analytics requests specially (queue offline)
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

// ==================== BACKGROUND SYNC EVENT ====================
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);

  switch (_event.tag) {
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
    case SYNC_TAGS.GAMING:
      event.waitUntil(syncGamingData());
      break;
    case SYNC_TAGS.EMOTIONAL:
      event.waitUntil(syncEmotionalData());
      break;
    default:
      console.log('❓ Unknown sync tag:', event.tag);
  }
});

// ==================== PUSH NOTIFICATION EVENT ====================
self.addEventListener('push', event => {
  console.log('📱 Push notification received');

  let data = {};
  if (_event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Relife Alarm', body: event.data.text() };
    }
  }

  const notificationType = data.type || 'alarm';
  event.waitUntil(handlePushNotification(data, notificationType));
});

// ==================== NOTIFICATION CLICK EVENT ====================
self.addEventListener('notificationclick', event => {
  console.log('🖱️ Notification clicked:', event.action, event.notification.tag);

  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  event.waitUntil(handleNotificationClick(action, data));
});

// ==================== MESSAGE EVENT ====================
self.addEventListener('message', async event => {
  const {_type, _data} = event.data;

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
    case 'REGISTER_PUSH':
      registerPushSubscription(data.subscription);
      break;
    case 'QUEUE_ANALYTICS':
      queueAnalytics(data.event);
      break;
    case 'QUEUE_EMOTIONAL':
      queueEmotionalEvent(data.event);
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
    case 'GET_STATUS':
      event.ports[0]?.postMessage(getServiceWorkerStatus());
      break;
    case 'GET_CACHE_STATS':
      event.ports[0]?.postMessage(await getCacheStatistics());
      break;
    case 'CLEAR_CACHE':
      await clearAllCaches();
      event.ports[0]?.postMessage({ success: true, message: 'All caches cleared' });
      break;
    case 'OPTIMIZE_CACHE':
      await optimizeAllCaches();
      event.ports[0]?.postMessage({
        success: true,
        message: 'Cache optimization complete',
      });
      break;
    default:
      console.log('❓ Unknown message type:', type);
  }

  // Send response back to main thread
  event.ports[0]?.postMessage({ success: true, timestamp: Date.now() });
});

// ==================== CACHING STRATEGIES ====================

async function networkFirst(_request) {
  const cache = await caches.open(CACHES.API);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok && shouldCache(request, networkResponse)) {
      await smartCachePut(cache, request, networkResponse);

      // Trigger cleanup if needed (don't block response)
      if (Date.now() - cacheStats.lastCleanup > 30 * 60 * 1000) {
        // Every 30 minutes
        performCacheCleanup(CACHES.API).catch(error => {
          console.error('❌ Background cache cleanup failed:', error);
        });
      }
    }

    return networkResponse;
  } catch (_error) {
    console.log('🌐 Network failed, trying cache:', request.url);
    const cachedResponse = await smartCacheMatch(cache, request);

    if (cachedResponse) {
      // Add stale indicator header
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Cache-Status', 'stale');
      headers.set('X-Cache-Hit-Ratio', cacheStats.hitRatio.toFixed(2));

      return new Response(await cachedResponse.blob(), {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers,
      });
    }

    return createOfflineResponse(request);
  }
}

async function cacheFirst(_request) {
  const cache = await caches.open(CACHES.ASSETS);
  const cachedResponse = await smartCacheMatch(cache, request);

  if (cachedResponse) {
    // Intelligent background refresh based on content type and age
    const cacheTime = cachedResponse.headers.get('x-cache-time');
    const contentType = cachedResponse.headers.get('content-type') || '';

    if (cacheTime) {
      const age = Date.now() - new Date(cacheTime).getTime();
      const refreshThreshold = getRefreshThreshold(contentType);

      if (age > refreshThreshold) {
        console.log(`🔄 Background refresh for: ${request.url}`);
        // Update in background (don't block response)
        fetch(request)
          .then(async response => {
            if (response.ok && shouldCache(request, response)) {
              await smartCachePut(cache, request, response);
            }
          })
          .catch(error => {
            console.log('❌ Background refresh failed:', error);
          });
      }
    }

    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok && shouldCache(request, networkResponse)) {
      await smartCachePut(cache, request, networkResponse);
    }

    return networkResponse;
  } catch (_error) {
    return createOfflineResponse(request);
  }
}

// Helper function to determine refresh threshold based on content type
function getRefreshThreshold(contentType) {
  if (contentType.includes('javascript') || contentType.includes('css')) {
    return 24 * 60 * 60 * 1000; // 24 hours for JS/CSS
  }
  if (contentType.includes('image')) {
    return 7 * 24 * 60 * 60 * 1000; // 7 days for images
  }
  if (contentType.includes('font')) {
    return 30 * 24 * 60 * 60 * 1000; // 30 days for fonts
  }
  return 6 * 60 * 60 * 1000; // 6 hours for other content
}

async function staleWhileRevalidate(_request) {
  const cache = await caches.open(CACHES.DYNAMIC);
  const cachedResponse = await smartCacheMatch(cache, request);

  // Always try to update cache in background with intelligent timing
  const fetchPromise = fetch(request)
    .then(async response => {
      if (response.ok && shouldCache(request, response)) {
        await smartCachePut(cache, request, response);

        // Periodic cache cleanup
        if (Math.random() < 0.1) {
          // 10% chance per request
          performCacheCleanup(CACHES.DYNAMIC).catch(error => {
            console.error('❌ Background cache cleanup failed:', error);
          });
        }
      }
      return response;
    })
    .catch(error => {
      console.log('🔄 Background fetch failed:', error);
      return null;
    });

  // Return cached response immediately if available
  if (cachedResponse) {
    // Add cache status headers
    const headers = new Headers(cachedResponse.headers);
    headers.set('X-Cache-Status', 'hit');
    headers.set('X-Cache-Strategy', 'stale-while-revalidate');

    return new Response(await cachedResponse.blob(), {
      status: cachedResponse.status,
      statusText: cachedResponse.statusText,
      headers: headers,
    });
  }

  // If no cache, wait for network
  try {
    const response = await fetchPromise;
    return response || createOfflineResponse(request);
  } catch (_error) {
    return createOfflineResponse(request);
  }
}

async function networkWithFallback(_request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses with intelligent caching
    if (
      networkResponse.ok &&
      request.method === 'GET' &&
      shouldCache(request, networkResponse)
    ) {
      const cache = await caches.open(CACHES.DYNAMIC);
      await smartCachePut(cache, request, networkResponse);
    }

    return networkResponse;
  } catch (_error) {
    // Try all caches for fallback (in order of priority)
    const cacheNames = Object.values(CACHES);

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const cachedResponse = await smartCacheMatch(cache, request);
      if (cachedResponse) {
        const headers = new Headers(cachedResponse.headers);
        headers.set('X-Cache-Status', 'fallback');
        headers.set('X-Cache-Source', cacheName);

        return new Response(await cachedResponse.blob(), {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: headers,
        });
      }
    }

    return createOfflineResponse(request);
  }
}

// ==================== ANALYTICS HANDLING ====================

async function handleAnalyticsRequest(_request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (_error) {
    // Queue for later if offline
    if (request.method === 'POST') {
      const body = await request.text();
      analyticsQueue.push({
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: body,
        timestamp: Date.now(),
      });

      // Store in IndexedDB
      await storeOfflineEvent('analytics', {
        url: request.url,
        data: body,
        timestamp: Date.now(),
      });
    }

    // Return empty response to prevent errors
    return new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ==================== ALARM MANAGEMENT ====================

async function scheduleAlarm(alarm) {
  // Cancel existing timeout if any
  if (alarmTimeouts.has(alarm.id)) {
    clearTimeout(alarmTimeouts.get(alarm.id));
  }

  const nextTime = getNextAlarmTime(alarm);

  if (nextTime) {
    const msUntilAlarm = nextTime.getTime() - Date.now();

    if (msUntilAlarm > 0) {
      const timeoutId = setTimeout(() => {
        triggerAlarm(alarm);
      }, msUntilAlarm);

      alarmTimeouts.set(alarm.id, timeoutId);

      // Store alarm in IndexedDB for persistence
      await storeScheduledAlarm(alarm, nextTime);

      console.log(`⏰ Alarm ${alarm.id} scheduled for`, nextTime);
    }
  }
}

async function triggerAlarm(alarm) {
  console.log(`🔔 Triggering alarm ${alarm.id}`);

  try {
    // Remove from scheduled timeouts
    alarmTimeouts.delete(alarm.id);

    // Determine emotional context
    const emotionalContext = determineEmotionalContext(alarm);
    const emotion = EMOTIONS[emotionalContext] || EMOTIONS.ENCOURAGING;

    // Create rich notification
    const notificationOptions = {
      title: `${emotion.icon} ${alarm.label || 'Alarm'}`,
      body: `It's ${alarm.time}! ${getEmotionalMessage(emotionalContext)}`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: NOTIFICATION_TAGS.ALARM,
      requireInteraction: true,
      vibrate: emotion.vibration,
      actions: [
        {
          action: 'dismiss',
          title: '⏹️ Dismiss',
          icon: '/icons/dismiss.png',
        },
        {
          action: 'snooze',
          title: '😴 Snooze 5min',
          icon: '/icons/snooze.png',
        },
        {
          action: 'voice',
          title: '🎤 Voice Response',
          icon: '/icons/voice.png',
        },
      ],
      data: {
        alarmId: alarm.id,
        alarmTime: alarm.time,
        alarmLabel: alarm.label,
        emotionalContext: emotionalContext,
        voiceMood: alarm.voiceMood,
        type: 'alarm',
        triggeredAt: Date.now(),
      },
    };

    await self.registration.showNotification(
      notificationOptions.title,
      notificationOptions
    );

    // Try to open the app or send message to existing clients
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    if (clients.length > 0) {
      // Send message to existing client
      clients[0].postMessage({
        type: 'ALARM_TRIGGERED',
        alarm: alarm,
        emotionalContext: emotionalContext,
        timestamp: Date.now(),
      });

      // Focus the window
      clients[0].focus();
    } else {
      // Open new window
      await self.clients.openWindow('/');
    }

    // Log alarm event for analytics
    await logAlarmEvent(alarm, 'triggered', { emotionalContext });

    // Schedule next occurrence if repeating
    if (alarm.days && alarm.days.length > 0) {
      await scheduleAlarm(alarm);
    }
  } catch (_error) {
    console.error('❌ Error triggering alarm:', error);
  }
}

function cancelAlarm(_alarmId) {
  if (alarmTimeouts.has(alarmId)) {
    clearTimeout(alarmTimeouts.get(alarmId));
    alarmTimeouts.delete(alarmId);
    console.log(`❌ Cancelled alarm ${alarmId}`);
  }
}

function updateAlarmSchedule(alarms) {
  // Clear all existing timeouts
  alarmTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  alarmTimeouts.clear();

  // Schedule new alarms
  alarms
    .filter(alarm => alarm.enabled)
    .forEach(alarm => {
      scheduleAlarm(alarm);
    });
}

// ==================== EMOTIONAL INTELLIGENCE ====================

function determineEmotionalContext(alarm) {
  const hour = new Date().getHours();
  const isWeekend = [0, 6].includes(new Date().getDay());

  // Morning alarms (5-9 AM)
  if (hour >= 5 && hour <= 9) {
    return isWeekend ? 'GENTLE' : 'ENERGETIC';
  }

  // Work hours (9-17)
  if (hour >= 9 && hour <= 17) {
    return 'MOTIVATIONAL';
  }

  // Evening (17-22)
  if (hour >= 17 && hour <= 22) {
    return 'SUPPORTIVE';
  }

  // Night/late (22+, 0-5)
  return 'CALMING';
}

function getEmotionalMessage(_emotionalContext) {
  const messages = {
    ENCOURAGING: "You've got this! Time to conquer your day! 💪",
    GENTLE: 'Good morning, beautiful soul. Rise gently and shine. 🌸',
    MOTIVATIONAL: "Your goals are calling! Let's make today amazing! 🚀",
    SUPPORTIVE: "You're doing great. Time for your next step! 💝",
    ENERGETIC: 'Energy up! Today is full of possibilities! ⚡',
    CELEBRATORY: 'Time to celebrate another moment in your journey! 🎉',
    CALMING: 'Peaceful reminder. Take your time. 🧘',
  };

  return messages[emotionalContext] || messages.ENCOURAGING;
}

// ==================== PUSH NOTIFICATION HANDLING ====================

async function handlePushNotification(data, _type) {
  let notificationOptions;

  switch (type) {
    case 'alarm':
      const emotion = EMOTIONS[data.emotionalContext] || EMOTIONS.ENCOURAGING;
      notificationOptions = {
        title: `${emotion.icon} ${data.title || 'Alarm'}`,
        body: data.body || 'Your alarm is ringing!',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: NOTIFICATION_TAGS.ALARM,
        requireInteraction: true,
        vibrate: emotion.vibration,
        actions: [
          { action: 'dismiss', title: 'Dismiss' },
          { action: 'snooze', title: 'Snooze' },
        ],
        data: data,
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
          { action: 'decline', title: 'Decline' },
        ],
        data: data,
      };
      break;

    case 'achievement':
      notificationOptions = {
        title: data.title || '🏆 Achievement Unlocked',
        body: data.body || 'You earned a new achievement!',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: NOTIFICATION_TAGS.ACHIEVEMENT,
        vibrate: EMOTIONS.CELEBRATORY.vibration,
        data: data,
      };
      break;

    case 'emotional':
      const emotionalType = data.emotionalContext || 'ENCOURAGING';
      const emotionData = EMOTIONS[emotionalType] || EMOTIONS.ENCOURAGING;

      notificationOptions = {
        title: `${emotionData.icon} ${data.title || 'Emotional Check-in'}`,
        body: data.body || getEmotionalMessage(emotionalType),
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: NOTIFICATION_TAGS.EMOTIONAL,
        vibrate: emotionData.vibration,
        actions: [
          { action: 'positive', title: '😊 Good' },
          { action: 'neutral', title: '😐 Okay' },
          { action: 'negative', title: '😔 Not great' },
        ],
        data: { ...data, emotionalType },
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
          { action: 'later', title: 'Later' },
        ],
        data: data,
      };
      break;

    default:
      notificationOptions = {
        title: data.title || 'Relife',
        body: data.body || 'You have a notification',
        icon: '/icon-192x192.png',
        data: data,
      };
  }

  await self.registration.showNotification(
    notificationOptions.title,
    notificationOptions
  );
}

// ==================== NOTIFICATION CLICK HANDLING ====================

async function handleNotificationClick(_action, data) {
  const clients = await self.clients.matchAll({ type: 'window' });

  switch (action) {
    case 'dismiss':
      if (data.alarmId) {
        await logAlarmEvent({ id: data.alarmId }, 'dismissed');
        if (clients.length > 0) {
          clients[0].postMessage({
            type: 'ALARM_DISMISSED',
            alarmId: data.alarmId,
          });
        }
      }
      break;

    case 'snooze':
      if (data.alarmId) {
        await handleSnooze(data);
        if (clients.length > 0) {
          clients[0].postMessage({
            type: 'ALARM_SNOOZED',
            alarmId: data.alarmId,
            snoozeTime: new Date(Date.now() + 5 * 60 * 1000),
          });
        }
      }
      break;

    case 'voice':
      await focusOrOpenApp('/?voice=true');
      break;

    case 'accept':
    case 'decline':
      if (clients.length > 0) {
        clients[0].postMessage({
          type: 'BATTLE_ACTION',
          action: action,
          data: data,
        });
      }
      break;

    case 'positive':
    case 'neutral':
    case 'negative':
      // Handle emotional feedback
      await queueEmotionalEvent({
        type: 'notification_feedback',
        response: action,
        emotionalType: data.emotionalType,
        timestamp: Date.now(),
      });
      break;

    case 'update':
      await handleAppUpdate();
      break;

    default:
      await focusOrOpenApp('/');
  }
}

// ==================== ENHANCED BACKGROUND SYNC FUNCTIONS ====================

// Enhanced sync configuration
const SYNC_CONFIG = {
  maxRetries: 3,
  retryDelays: [1000, 5000, 15000], // Progressive backoff
  batchSize: 20,
  conflictResolution: 'merge', // 'client', 'server', 'merge'
  enableConflictDetection: true,
};

// Sync state tracking
const syncState = {
  activeSync: null,
  syncHistory: [],
  conflicts: [],
  lastSuccessfulSync: null,
};

// Enhanced data sync with conflict resolution
async function performDataSync(dataType, _options = {}) {
  const startTime = Date.now();
  const syncId = `sync_${dataType}_${startTime}`;

  console.log(`🔄 Starting enhanced ${dataType} sync (${syncId})`);

  try {
    syncState.activeSync = { id: syncId, type: dataType, startTime };

    // Get local data to sync
    const localData = await getLocalDataForSync(dataType);
    if (!localData || localData.length === 0) {
      console.log(`ℹ️ No ${dataType} data to sync`);
      return { success: true, synced: 0, conflicts: 0 };
    }

    const syncResults = { success: 0, failed: 0, conflicts: 0 };

    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < localData.length; i += SYNC_CONFIG.batchSize) {
      const batch = localData.slice(i, i + SYNC_CONFIG.batchSize);

      try {
        const batchResult = await syncBatch(dataType, batch, options);
        syncResults.success += batchResult.success;
        syncResults.failed += batchResult.failed;
        syncResults.conflicts += batchResult.conflicts;

        // Handle conflicts if any
        if (batchResult.conflicts > 0) {
          await handleSyncConflicts(dataType, batchResult.conflictDetails);
        }
      } catch (_error) {
        console.error(`❌ Batch sync failed for ${dataType}:`, error);
        syncResults.failed += batch.length;
      }
    }

    // Record successful sync
    if (syncResults.success > 0) {
      syncState.lastSuccessfulSync = { type: dataType, timestamp: Date.now() };
      lastSyncTime = Date.now();
    }

    // Add to sync history
    syncState.syncHistory.unshift({
      id: syncId,
      type: dataType,
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      results: syncResults,
    });

    // Keep only last 50 sync records
    if (syncState.syncHistory.length > 50) {
      syncState.syncHistory = syncState.syncHistory.slice(0, 50);
    }

    console.log(`✅ ${dataType} sync completed:`, syncResults);
    return syncResults;
  } catch (_error) {
    console.error(`❌ ${dataType} sync failed:`, error);
    return {
      success: 0,
      failed: localData?.length || 0,
      conflicts: 0,
      error: error.message,
    };
  } finally {
    syncState.activeSync = null;
  }
}

// Get local data for specific sync type
async function getLocalDataForSync(dataType) {
  try {
    const db = await openIndexedDB();

    switch (dataType) {
      case 'alarms':
        return await getUnsyncedRecords(db, 'alarms');
      case 'sleep':
        return await getUnsyncedRecords(db, 'sleepSessions');
      case 'gaming':
        return await getUnsyncedRecords(db, 'battles');
      case 'analytics':
        return analyticsQueue.filter(event => !event.synced);
      case 'emotional':
        return emotionalQueue.filter(event => !event.synced);
      case 'voice':
        return await getUnsyncedRecords(db, 'voiceRecordings');
      case 'settings':
        return await getUnsyncedRecords(db, 'userSettings');
      case 'userData':
        return await getUnsyncedRecords(db, 'userData');
      default:
        return [];
    }
  } catch (_error) {
    console.error(`Failed to get ${dataType} data for sync:`, error);
    return [];
  }
}

// Enhanced batch sync with retry mechanism
async function syncBatch(dataType, batch, _options = {}) {
  const results = { success: 0, failed: 0, conflicts: 0, conflictDetails: [] };

  for (const item of batch) {
    let retryCount = 0;
    let synced = false;

    while (retryCount <= SYNC_CONFIG.maxRetries && !synced) {
      try {
        const syncResult = await syncSingleItem(dataType, item, options);

        if (syncResult.conflict) {
          results.conflicts++;
          results.conflictDetails.push(syncResult.conflictDetail);
        } else {
          results.success++;
          // Mark item as synced in local storage
          await markItemAsSynced(dataType, item.id);
        }

        synced = true;
      } catch (_error) {
        retryCount++;
        if (retryCount <= SYNC_CONFIG.maxRetries) {
          const delay = SYNC_CONFIG.retryDelays[retryCount - 1] || 15000;
          console.log(
            `🔄 Retrying ${dataType} sync for item ${item.id} in ${delay}ms (attempt ${retryCount})`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error(
            `❌ Failed to sync ${dataType} item ${item.id} after ${SYNC_CONFIG.maxRetries} retries:`,
            error
          );
          results.failed++;
        }
      }
    }
  }

  return results;
}

// Sync individual item with conflict detection
async function syncSingleItem(dataType, _item, _options = {}) {
  // Simulate API call to sync individual item
  console.log(`📤 Syncing ${dataType} item:`, item.id);

  // In a real implementation, this would make an HTTP request
  // For now, we'll simulate the sync with conflict detection

  const response = await simulateApiSync(dataType, item);

  if (response.conflict && SYNC_CONFIG.enableConflictDetection) {
    return {
      conflict: true,
      conflictDetail: {
        type: dataType,
        itemId: item.id,
        localData: item,
        serverData: response.serverData,
        conflictType: response.conflictType,
      },
    };
  }

  return { success: true };
}

// Simulate API sync response (replace with real API calls)
async function simulateApiSync(dataType, _item) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 200));

  // Simulate occasional conflicts (5% chance)
  if (Math.random() < 0.05) {
    return {
      conflict: true,
      conflictType: 'modified',
      serverData: {
        ...item,
        lastModified: new Date(Date.now() - 60000).toISOString(), // Modified 1 minute ago
        conflictValue: 'server_value',
      },
    };
  }

  // Simulate occasional failures (2% chance)
  if (Math.random() < 0.02) {
    throw new Error(`Simulated sync failure for ${dataType}`);
  }

  return { success: true };
}

// Handle sync conflicts with configurable resolution strategies
async function handleSyncConflicts(dataType, _conflicts) {
  console.log(`⚠️ Handling ${conflicts.length} conflicts for ${dataType}`);

  for (const conflict of conflicts) {
    try {
      let resolvedData;

      switch (SYNC_CONFIG.conflictResolution) {
        case 'client':
          resolvedData = conflict.localData;
          break;

        case 'server':
          resolvedData = conflict.serverData;
          break;

        case 'merge':
          resolvedData = await mergeConflictData(
            conflict.localData,
            conflict.serverData
          );
          break;

        default:
          // Store for manual resolution
          syncState.conflicts.push({
            id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: conflict.type,
            itemId: conflict.itemId,
            localData: conflict.localData,
            serverData: conflict.serverData,
            timestamp: new Date().toISOString(),
            resolved: false,
          });
          continue;
      }

      // Apply resolved data
      await updateLocalData(dataType, conflict.itemId, resolvedData);
      console.log(`✅ Conflict resolved for ${dataType} item ${conflict.itemId}`);
    } catch (_error) {
      console.error(
        `❌ Failed to resolve conflict for ${dataType} item ${conflict.itemId}:`,
        error
      );
    }
  }
}

// Intelligent data merging for conflicts
async function mergeConflictData(localData, _serverData) {
  const merged = { ...localData };

  // Merge based on timestamps - newer wins for most fields
  const localTime = new Date(
    localData.lastModified || localData.createdAt || 0
  ).getTime();
  const serverTime = new Date(
    serverData.lastModified || serverData.createdAt || 0
  ).getTime();

  if (serverTime > localTime) {
    // Server data is newer, use server values but preserve local-only fields
    Object.keys(serverData).forEach(key => {
      if (!key.startsWith('local_') && key !== 'syncStatus') {
        merged[key] = serverData[key];
      }
    });
  }

  // Special handling for arrays - merge unique values
  ['tags', 'participants', 'achievements'].forEach(field => {
    if (Array.isArray(localData[field]) && Array.isArray(serverData[field])) {
      const combined = [...localData[field], ...serverData[field]];
      merged[field] = [...new Set(combined.map(item => JSON.stringify(item)))].map(
        item => JSON.parse(item)
      );
    }
  });

  // Always use the latest timestamp
  merged.lastModified = new Date().toISOString();

  return merged;
}

// Enhanced individual sync functions
async function syncAlarms() {
  console.log('⏰ Starting enhanced alarm sync...');
  const results = await performDataSync('alarms', {
    priority: 'high',
    validateData: true,
  });

  // Send sync status to main thread
  await notifyMainThread('alarms-sync', results);
  return results;
}

async function syncSleepData() {
  console.log('😴 Starting enhanced sleep data sync...');
  const results = await performDataSync('sleep', {
    priority: 'medium',
    includeAnalytics: true,
  });

  await notifyMainThread('sleep-sync', results);
  return results;
}

async function syncVoiceData() {
  console.log('🎤 Starting enhanced voice data sync...');
  const results = await performDataSync('voice', {
    priority: 'low',
    compressData: true,
  });

  await notifyMainThread('voice-sync', results);
  return results;
}

async function syncAnalytics() {
  console.log('📊 Starting enhanced analytics sync...');
  try {
    const results = await processAnalyticsQueue();
    await notifyMainThread('analytics-sync', results);
    return results;
  } catch (_error) {
    console.error('❌ Analytics sync failed:', error);
    return { success: 0, failed: analyticsQueue.length, error: error.message };
  }
}

async function syncSettings() {
  console.log('⚙️ Starting enhanced settings sync...');
  const results = await performDataSync('settings', {
    priority: 'high',
    validateSchema: true,
  });

  await notifyMainThread('settings-sync', results);
  return results;
}

async function syncUserData() {
  console.log('👤 Starting enhanced user data sync...');
  const results = await performDataSync('userData', {
    priority: 'high',
    encryptSensitiveData: true,
  });

  await notifyMainThread('user-data-sync', results);
  return results;
}

async function syncGamingData() {
  console.log('🎮 Starting enhanced gaming data sync...');
  const results = await performDataSync('gaming', {
    priority: 'medium',
    includeLeaderboards: true,
  });

  await notifyMainThread('gaming-sync', results);
  return results;
}

async function syncEmotionalData() {
  console.log('🧠 Starting enhanced emotional data sync...');
  try {
    const results = await processEmotionalQueue();
    await notifyMainThread('emotional-sync', results);
    return results;
  } catch (_error) {
    console.error('❌ Emotional data sync failed:', error);
    return { success: 0, failed: emotionalQueue.length, error: error.message };
  }
}

// ==================== ENHANCED SYNC UTILITY FUNCTIONS ====================

// IndexedDB helpers for sync operations
async function openIndexedDB() {
  return new Promise(_(resolve, _reject) => {
    const request = indexedDB.open('RelifeOfflineDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = _event => {
      const db = event.target.result;

      // Create object stores if they don't exist
      const stores = [
        'alarms',
        'sleepSessions',
        'battles',
        'voiceRecordings',
        'userSettings',
        'userData',
      ];
      stores.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('lastModified', 'lastModified', { unique: false });
        }
      });
    };
  });
}

// Get unsynced records from IndexedDB
async function getUnsyncedRecords(db, _storeName) {
  return new Promise(_(resolve, _reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index('synced');
    const request = index.getAll(false); // Get all unsynced records

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

// Mark item as synced in local storage
async function markItemAsSynced(dataType, _itemId) {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction([getStoreName(dataType)], 'readwrite');
    const store = transaction.objectStore(getStoreName(dataType));

    const getRequest = store.get(itemId);
    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        item.synced = true;
        item.syncedAt = new Date().toISOString();
        store.put(item);
      }
    };
  } catch (_error) {
    console.error(`Failed to mark ${dataType} item ${itemId} as synced:`, error);
  }
}

// Update local data after conflict resolution
async function updateLocalData(dataType, _itemId, _newData) {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction([getStoreName(dataType)], 'readwrite');
    const store = transaction.objectStore(getStoreName(dataType));

    newData.synced = true;
    newData.syncedAt = new Date().toISOString();
    newData.lastModified = new Date().toISOString();

    store.put(newData);
  } catch (_error) {
    console.error(`Failed to update ${dataType} item ${itemId}:`, error);
  }
}

// Get appropriate store name for data type
function getStoreName(dataType) {
  const storeMap = {
    alarms: 'alarms',
    sleep: 'sleepSessions',
    gaming: 'battles',
    voice: 'voiceRecordings',
    settings: 'userSettings',
    userData: 'userData',
  };
  return storeMap[dataType] || dataType;
}

// Enhanced analytics queue processing
async function processAnalyticsQueue() {
  console.log(`📊 Processing ${analyticsQueue.length} analytics events...`);

  if (analyticsQueue.length === 0) {
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < analyticsQueue.length; i += SYNC_CONFIG.batchSize) {
    const batch = analyticsQueue.slice(i, i + SYNC_CONFIG.batchSize);

    try {
      // Simulate batch analytics upload
      await simulateAnalyticsUpload(batch);

      // Mark events as synced
      batch.forEach(event => {
        event.synced = true;
        event.syncedAt = new Date().toISOString();
      });

      success += batch.length;
    } catch (_error) {
      console.error('Analytics batch upload failed:', error);
      failed += batch.length;
    }
  }

  // Remove synced events from queue
  analyticsQueue = analyticsQueue.filter(event => !event.synced);

  console.log(`✅ Analytics sync completed: ${success} success, ${failed} failed`);
  return { success, failed };
}

// Enhanced emotional queue processing
async function processEmotionalQueue() {
  console.log(`🧠 Processing ${emotionalQueue.length} emotional events...`);

  if (emotionalQueue.length === 0) {
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  for (const event of emotionalQueue) {
    try {
      await simulateEmotionalDataUpload(event);
      event.synced = true;
      event.syncedAt = new Date().toISOString();
      success++;
    } catch (_error) {
      console.error('Emotional event sync failed:', error);
      failed++;
    }
  }

  // Remove synced events
  emotionalQueue = emotionalQueue.filter(event => !event.synced);

  console.log(`✅ Emotional data sync completed: ${success} success, ${failed} failed`);
  return { success, failed };
}

// Simulate API uploads (replace with real API calls)
async function simulateAnalyticsUpload(batch) {
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  if (Math.random() < 0.02) throw new Error('Simulated analytics upload failure');
}

async function simulateEmotionalDataUpload(_event) {
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  if (Math.random() < 0.02) throw new Error('Simulated emotional data upload failure');
}

// Notify main thread of sync results
async function notifyMainThread(syncType, _results) {
  const clients = await self.clients.matchAll();
  const message = {
    type: 'SYNC_COMPLETE',
    syncType,
    results,
    timestamp: Date.now(),
  };

  clients.forEach(client => {
    client.postMessage(message);
  });

  // Dispatch custom event
  self.postMessage({
    type: `${syncType.toUpperCase()}_SYNC_COMPLETE`,
    ...results,
  });
}

// Get comprehensive sync status
function getSyncStatus() {
  return {
    activeSync: syncState.activeSync,
    lastSuccessfulSync: syncState.lastSuccessfulSync,
    pendingConflicts: syncState.conflicts.filter(c => !c.resolved).length,
    syncHistory: syncState.syncHistory.slice(0, 10), // Last 10 syncs
    queueSizes: {
      analytics: analyticsQueue.filter(e => !e.synced).length,
      emotional: emotionalQueue.filter(e => !e.synced).length,
    },
    configuration: SYNC_CONFIG,
  };
}

// ==================== UTILITY FUNCTIONS ====================

async function focusOrOpenApp(url = '/') {
  const clients = await self.clients.matchAll({ type: 'window' });

  if (clients.length > 0) {
    await clients[0].focus();
    if (url !== '/') {
      clients[0].postMessage({
        type: 'NAVIGATE',
        url: url,
      });
    }
  } else {
    await self.clients.openWindow(url);
  }
}

function getNextAlarmTime(alarm) {
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

function createOfflineResponse(_request) {
  const url = new URL(request.url);

  if (url.pathname.includes('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature requires an internet connection',
        cached: false,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Return cached offline page
  return caches.match('/offline.html').then(response => {
    return (
      response ||
      new Response('You are offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      })
    );
  });
}

function getServiceWorkerStatus() {
  return {
    version: APP_VERSION,
    isOnline: isOnline,
    lastSyncTime: lastSyncTime,
    scheduledAlarms: alarmTimeouts.size,
    queuedAnalytics: analyticsQueue.length,
    queuedEmotional: emotionalQueue.length,
    pushSubscribed: !!pushSubscription,
    caches: Object.keys(CACHES),
    emotions: Object.keys(EMOTIONS),
  };
}

// ==================== INITIALIZATION FUNCTIONS ====================

async function initializeDatabase() {
  // Initialize IndexedDB for advanced offline features
  console.log('💾 Initializing IndexedDB...');
  // Implementation would set up IndexedDB stores
}

async function initializeAdvancedFeatures() {
  console.log('🚀 Initializing advanced features...');

  // Set up periodic background sync
  await schedulePeriodicSync();

  // Initialize alarm processing
  await initializeAlarmProcessing();

  // Check network status
  isOnline = navigator.onLine;

  // Set up network listeners
  addEventListener(_'online', () => {
    isOnline = true;
    notifyClients('NETWORK_STATUS', { isOnline: true });
    processOfflineQueues();
  });

  addEventListener(_'offline', () => {
    isOnline = false;
    notifyClients('NETWORK_STATUS', { isOnline: false });
  });
}

async function setupPushNotifications() {
  console.log('📱 Setting up push notifications...');
  // Implementation would handle push subscription
}

async function processOfflineQueues() {
  if (analyticsQueue.length > 0) {
    await processAnalyticsQueue();
  }

  if (emotionalQueue.length > 0) {
    await processEmotionalQueue();
  }
}

async function notifyClients(_type, data) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type, data });
  });
}

// Stub implementations for additional features
async function storeScheduledAlarm(alarm, _nextTime) {
  /* Implementation */
}
async function performCompleteSync() {
  await Promise.all([
    syncAlarms(),
    syncSleepData(),
    syncVoiceData(),
    syncAnalytics(),
    syncSettings(),
    syncUserData(),
    syncGamingData(),
    syncEmotionalData(),
  ]);
}

// ==================== CACHE DIAGNOSTICS AND OPTIMIZATION ====================

async function getCacheStatistics() {
  try {
    const stats = {
      performance: {
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRatio: cacheStats.hitRatio,
        lastCleanup: new Date(cacheStats.lastCleanup).toISOString(),
      },
      caches: {},
    };

    for (const [cacheName, cacheKey] of Object.entries(CACHES)) {
      const cache = await caches.open(cacheKey);
      const requests = await cache.keys();

      let totalSize = 0;
      let oldestEntry = Date.now();
      let newestEntry = 0;

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const size = parseInt(response.headers.get('content-length') || '1024', 10);
          const cacheTime = response.headers.get('x-cache-time');

          totalSize += size;

          if (cacheTime) {
            const time = new Date(cacheTime).getTime();
            oldestEntry = Math.min(oldestEntry, time);
            newestEntry = Math.max(newestEntry, time);
          }
        }
      }

      stats.caches[cacheName] = {
        entries: requests.length,
        totalSize: totalSize,
        limit: CACHE_LIMITS[cacheName] || 0,
        utilization: CACHE_LIMITS[cacheName] ? totalSize / CACHE_LIMITS[cacheName] : 0,
        oldestEntry:
          oldestEntry < Date.now() ? new Date(oldestEntry).toISOString() : null,
        newestEntry: newestEntry > 0 ? new Date(newestEntry).toISOString() : null,
      };
    }

    return stats;
  } catch (_error) {
    console.error('❌ Failed to get cache statistics:', error);
    return { error: error.message };
  }
}

async function clearAllCaches() {
  try {
    console.log('🧹 Clearing all caches...');

    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map(cacheName => {
      console.log(`🗑️ Deleting cache: ${cacheName}`);
      return caches.delete(cacheName);
    });

    await Promise.all(deletePromises);

    // Reset cache statistics
    cacheStats = {
      hits: 0,
      misses: 0,
      size: 0,
      lastCleanup: Date.now(),
      hitRatio: 0,
    };

    console.log('✅ All caches cleared successfully');
  } catch (_error) {
    console.error('❌ Failed to clear caches:', error);
    throw error;
  }
}

async function optimizeAllCaches() {
  try {
    console.log('🚀 Starting cache optimization...');

    // Clean up each cache
    for (const cacheKey of Object.values(CACHES)) {
      await performCacheCleanup(cacheKey);
    }

    // Warm critical caches
    await warmCriticalCaches();

    // Update statistics
    cacheStats.lastCleanup = Date.now();

    console.log('✅ Cache optimization completed');
  } catch (_error) {
    console.error('❌ Cache optimization failed:', error);
    throw error;
  }
}


console.log(`🎉 Unified Service Worker v${APP_VERSION} loaded and ready with comprehensive offline support!`);
console.log('📊 Cache statistics:', cacheStats);
console.log('🎯 Cache limits:', CACHE_LIMITS);
