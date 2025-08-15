// Enhanced Service Worker with Emotional Notification Support
// Extends existing sw-push.js with emotional intelligence features

// Import base service worker functionality
importScripts('/sw-push.js');

// Emotional notification configuration
const EMOTIONAL_ICONS = {
  happy: '/icons/emotions/happy-72x72.png',
  sad: '/icons/emotions/sad-72x72.png',
  worried: '/icons/emotions/worried-72x72.png',
  excited: '/icons/emotions/excited-72x72.png',
  lonely: '/icons/emotions/lonely-72x72.png',
  proud: '/icons/emotions/proud-72x72.png',
  sleepy: '/icons/emotions/sleepy-72x72.png'
};

const EMOTIONAL_LARGE_IMAGES = {
  happy: '/images/emotional-banners/happy-banner-512x256.png',
  sad: '/images/emotional-banners/sad-banner-512x256.png',
  worried: '/images/emotional-banners/worried-banner-512x256.png',
  excited: '/images/emotional-banners/excited-banner-512x256.png',
  lonely: '/images/emotional-banners/lonely-banner-512x256.png',
  proud: '/images/emotional-banners/proud-banner-512x256.png',
  sleepy: '/images/emotional-banners/sleepy-banner-512x256.png'
};

const EMOTIONAL_VIBRATION_PATTERNS = {
  happy: [200, 100, 200],
  excited: [100, 50, 100, 50, 200],
  sad: [500, 200, 500],
  worried: [300, 100, 300, 100, 300],
  lonely: [400, 200, 400],
  proud: [100, 50, 100, 50, 100, 50, 200],
  sleepy: [200, 300, 200]
};

const EMOTIONAL_SOUNDS = {
  happy: 'gentle-chime.wav',
  excited: 'celebration.wav',
  sad: 'soft-bell.wav',
  worried: 'attention-tone.wav',
  lonely: 'warm-melody.wav',
  proud: 'achievement-fanfare.wav',
  sleepy: 'gentle-wake.wav'
};

// Enhanced push event handler for emotional notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('[SW-Emotional] Push event with no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW-Emotional] Push data:', data);

    // Handle emotional notifications
    if (data.category && data.category.startsWith('emotional_')) {
      event.waitUntil(handleEmotionalNotification(data));
      return;
    }

    // Fallback to original push handler
    console.log('[SW-Emotional] Delegating to base push handler');
  } catch (error) {
    console.error('[SW-Emotional] Error processing push notification:', error);
  }
});

// Enhanced notification click handler for emotional notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[SW-Emotional] Notification click received:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  // Handle emotional notification actions
  if (data.category && data.category.startsWith('emotional_')) {
    event.waitUntil(handleEmotionalNotificationClick(action, data));
    return;
  }

  // Fallback to original notification click handler
  console.log('[SW-Emotional] Delegating to base notification click handler');
});

// Handle emotional notification display
async function handleEmotionalNotification(data) {
  try {
    console.log('[SW-Emotional] Processing emotional notification:', data);

    const emotion = data.emotion || 'happy';
    const tone = data.tone || 'encouraging';
    const escalationLevel = data.escalationLevel || 'gentle';

    // Build notification options with emotional context
    const options = {
      title: data.title || getEmotionalTitle(emotion, tone),
      body: data.body || 'Your personalized message awaits!',
      icon: EMOTIONAL_ICONS[emotion] || '/icon-192x192.png',
      image: data.largeImage || EMOTIONAL_LARGE_IMAGES[emotion],
      badge: '/badge-72x72.png',
      tag: `emotional_${emotion}_${Date.now()}`,
      requireInteraction: escalationLevel !== 'gentle',
      silent: false,
      vibrate: data.vibrationPattern || EMOTIONAL_VIBRATION_PATTERNS[emotion] || [200, 100, 200],
      data: {
        ...data,
        category: data.category || 'emotional_nudge',
        emotion: emotion,
        tone: tone,
        escalationLevel: escalationLevel,
        timestamp: Date.now(),
        showInAppAnimation: true,
        soundFile: EMOTIONAL_SOUNDS[emotion]
      },
      actions: getEmotionalActions(emotion, tone, escalationLevel)
    };

    // Show the notification
    await self.registration.showNotification(options.title, options);

    // Track notification display
    await sendMessageToClients({
      type: 'EMOTIONAL_NOTIFICATION_DISPLAYED',
      data: {
        emotion: emotion,
        tone: tone,
        escalationLevel: escalationLevel,
        messageId: data.messageId,
        timestamp: Date.now()
      }
    });

    // Play emotional sound if supported
    if (options.data.soundFile && !options.silent) {
      await playEmotionalSound(options.data.soundFile);
    }

    console.log('[SW-Emotional] Emotional notification displayed successfully');

  } catch (error) {
    console.error('[SW-Emotional] Error showing emotional notification:', error);
  }
}

// Handle emotional notification click actions
async function handleEmotionalNotificationClick(action, data) {
  try {
    console.log('[SW-Emotional] Handling emotional notification action:', action, data);

    const emotion = data.emotion;
    const messageId = data.messageId;
    const deepLink = data.deepLink || '/dashboard';

    // Track the interaction
    await sendMessageToClients({
      type: 'EMOTIONAL_NOTIFICATION_CLICKED',
      data: {
        action: action || 'default',
        emotion: emotion,
        messageId: messageId,
        timestamp: Date.now()
      }
    });

    // Handle specific actions
    switch (action) {
      case 'complete_task':
        await handleCompleteTaskAction(data);
        break;
      
      case 'snooze_gentle':
        await handleSnoozeAction(data, 30); // 30 minutes
        break;
      
      case 'snooze_later':
        await handleSnoozeAction(data, 120); // 2 hours
        break;
      
      case 'dismiss':
        await handleDismissAction(data);
        break;
      
      case 'feedback':
        await handleFeedbackAction(data);
        break;
      
      default:
        // Default action - open app with deep link
        await handleDefaultAction(data, deepLink);
        break;
    }

  } catch (error) {
    console.error('[SW-Emotional] Error handling emotional notification click:', error);
  }
}

// Generate emotional actions based on context
function getEmotionalActions(emotion, tone, escalationLevel) {
  const baseActions = [];

  // Primary action varies by emotion
  switch (emotion) {
    case 'sad':
    case 'worried':
    case 'lonely':
      baseActions.push({
        action: 'complete_task',
        title: '💪 Start 2-min task',
        icon: '/icons/actions/play.png'
      });
      break;
    
    case 'excited':
    case 'proud':
      baseActions.push({
        action: 'complete_task',
        title: '🚀 Keep the momentum!',
        icon: '/icons/actions/continue.png'
      });
      break;
    
    case 'happy':
      baseActions.push({
        action: 'complete_task',
        title: '⭐ Add to streak',
        icon: '/icons/actions/add.png'
      });
      break;
    
    case 'sleepy':
      baseActions.push({
        action: 'complete_task',
        title: '☀️ Gentle wake-up',
        icon: '/icons/actions/sunrise.png'
      });
      break;
  }

  // Secondary actions based on escalation level
  if (escalationLevel === 'gentle' || escalationLevel === 'slightly_emotional') {
    baseActions.push({
      action: 'snooze_gentle',
      title: '😴 30 more minutes',
      icon: '/icons/actions/snooze.png'
    });
  } else {
    baseActions.push({
      action: 'snooze_later',
      title: '⏰ Remind me later',
      icon: '/icons/actions/later.png'
    });
  }

  // Always include feedback option for learning
  if (tone !== 'roast') {
    baseActions.push({
      action: 'feedback',
      title: '💬 How was this?',
      icon: '/icons/actions/feedback.png'
    });
  }

  return baseActions.slice(0, 3); // Maximum 3 actions for mobile compatibility
}

// Generate emotional title based on emotion and tone
function getEmotionalTitle(emotion, tone) {
  const titles = {
    happy: {
      encouraging: '🌟 You\'re doing great!',
      playful: '😎 Looking good!',
      firm: '💪 Keep it up!',
      roast: '👑 Not bad for once!'
    },
    excited: {
      encouraging: '🎉 Amazing achievement!',
      playful: '🚀 You\'re on fire!',
      firm: '🏆 Excellence achieved!',
      roast: '😱 Actual success?!'
    },
    sad: {
      encouraging: '💙 We miss you',
      playful: '🦸‍♂️ Hero needed!',
      firm: '⚡ Time to return',
      roast: '😤 Wake up call!'
    },
    worried: {
      encouraging: '🤗 Ready to try again?',
      playful: '🔄 Comeback time?',
      firm: '🎯 Show up now',
      roast: '🙄 Still sleeping?'
    },
    lonely: {
      encouraging: '💝 You matter',
      playful: '👋 Hey there!',
      firm: '💪 Start today',
      roast: '😅 Social life needed'
    },
    proud: {
      encouraging: '👑 Incredible work!',
      playful: '🎊 Legend status!',
      firm: '🏅 Well earned',
      roast: '🤯 Plot twist!'
    },
    sleepy: {
      encouraging: '☀️ Gentle wake-up',
      playful: '😴 Sleepyhead alert!',
      firm: '⏰ Time to rise',
      roast: '🛏️ Bed's not paying rent'
    }
  };

  return titles[emotion]?.[tone] || '🔔 Relife Alarm';
}

// Action handlers

async function handleCompleteTaskAction(data) {
  const clients = await self.clients.matchAll({ type: 'window' });
  
  if (clients.length > 0) {
    // Focus existing window and navigate to task
    const client = clients[0];
    client.focus();
    client.postMessage({
      type: 'EMOTIONAL_ACTION_COMPLETE_TASK',
      data: data
    });
  } else {
    // Open new window with task page
    await self.clients.openWindow('/alarms/quick-task');
  }

  // Track completion intent
  await sendMessageToClients({
    type: 'EMOTIONAL_TASK_COMPLETION_STARTED',
    data: {
      messageId: data.messageId,
      emotion: data.emotion,
      timestamp: Date.now()
    }
  });
}

async function handleSnoozeAction(data, minutes) {
  console.log(`[SW-Emotional] Snoozing for ${minutes} minutes`);

  // Schedule follow-up notification
  setTimeout(async () => {
    try {
      // Show gentle follow-up notification
      await self.registration.showNotification('🔔 Gentle reminder', {
        body: 'Ready to try again? No pressure! 😊',
        icon: EMOTIONAL_ICONS[data.emotion] || '/icon-192x192.png',
        tag: `snooze_followup_${data.messageId}`,
        requireInteraction: false,
        vibrate: [200, 100, 200],
        data: {
          ...data,
          isSnoozeFollowup: true,
          originalMessageId: data.messageId
        },
        actions: [
          {
            action: 'complete_task',
            title: '🌟 I\'m ready now',
            icon: '/icons/actions/ready.png'
          },
          {
            action: 'dismiss',
            title: '✋ Maybe later',
            icon: '/icons/actions/dismiss.png'
          }
        ]
      });

      // Track snooze follow-up
      await sendMessageToClients({
        type: 'EMOTIONAL_SNOOZE_FOLLOWUP',
        data: {
          originalMessageId: data.messageId,
          snoozeMinutes: minutes,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('[SW-Emotional] Error showing snooze follow-up:', error);
    }
  }, minutes * 60 * 1000);

  // Track snooze action
  await sendMessageToClients({
    type: 'EMOTIONAL_NOTIFICATION_SNOOZED',
    data: {
      messageId: data.messageId,
      snoozeMinutes: minutes,
      emotion: data.emotion,
      timestamp: Date.now()
    }
  });
}

async function handleDismissAction(data) {
  console.log('[SW-Emotional] Dismissing emotional notification');

  // Track dismissal
  await sendMessageToClients({
    type: 'EMOTIONAL_NOTIFICATION_DISMISSED',
    data: {
      messageId: data.messageId,
      emotion: data.emotion,
      timestamp: Date.now()
    }
  });

  // Cancel any related notifications
  const notifications = await self.registration.getNotifications({
    tag: `emotional_${data.emotion}`
  });
  
  notifications.forEach(notification => {
    if (notification.data?.messageId === data.messageId) {
      notification.close();
    }
  });
}

async function handleFeedbackAction(data) {
  console.log('[SW-Emotional] Opening feedback for emotional notification');

  const clients = await self.clients.matchAll({ type: 'window' });
  
  if (clients.length > 0) {
    // Send feedback request to existing window
    const client = clients[0];
    client.focus();
    client.postMessage({
      type: 'EMOTIONAL_FEEDBACK_REQUESTED',
      data: {
        messageId: data.messageId,
        emotion: data.emotion,
        tone: data.tone
      }
    });
  } else {
    // Open new window with feedback page
    await self.clients.openWindow(`/feedback?type=emotional&messageId=${data.messageId}`);
  }

  // Track feedback request
  await sendMessageToClients({
    type: 'EMOTIONAL_FEEDBACK_STARTED',
    data: {
      messageId: data.messageId,
      emotion: data.emotion,
      timestamp: Date.now()
    }
  });
}

async function handleDefaultAction(data, deepLink) {
  console.log('[SW-Emotional] Opening app with deep link:', deepLink);

  const clients = await self.clients.matchAll({ type: 'window' });
  
  if (clients.length > 0) {
    // Focus existing window
    const client = clients[0];
    client.focus();
    
    // Send navigation message
    client.postMessage({
      type: 'EMOTIONAL_NAVIGATE',
      data: {
        deepLink: deepLink,
        messageId: data.messageId,
        emotion: data.emotion,
        showAnimation: data.showInAppAnimation || false
      }
    });
  } else {
    // Open new window
    await self.clients.openWindow(deepLink);
  }

  // Track default action
  await sendMessageToClients({
    type: 'EMOTIONAL_NOTIFICATION_OPENED',
    data: {
      messageId: data.messageId,
      emotion: data.emotion,
      deepLink: deepLink,
      timestamp: Date.now()
    }
  });
}

// Utility functions

async function playEmotionalSound(soundFile) {
  try {
    // In a real implementation, you might:
    // 1. Cache audio files during service worker install
    // 2. Use Web Audio API if available
    // 3. Send message to client to play sound
    
    console.log(`[SW-Emotional] Playing emotional sound: ${soundFile}`);
    
    // Send sound play request to client
    await sendMessageToClients({
      type: 'PLAY_EMOTIONAL_SOUND',
      data: {
        soundFile: soundFile,
        timestamp: Date.now()
      }
    });
    
  } catch (error) {
    console.error('[SW-Emotional] Error playing emotional sound:', error);
  }
}

async function sendMessageToClients(message) {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    
    clients.forEach(client => {
      client.postMessage(message);
    });
    
  } catch (error) {
    console.error('[SW-Emotional] Error sending message to clients:', error);
  }
}

// Cache emotional assets on install
self.addEventListener('install', (event) => {
  console.log('[SW-Emotional] Installing with emotional notification support...');
  
  const emotionalAssets = [
    // Emotional icons
    ...Object.values(EMOTIONAL_ICONS),
    // Large images
    ...Object.values(EMOTIONAL_LARGE_IMAGES),
    // Sound files
    ...Object.values(EMOTIONAL_SOUNDS).map(sound => `/sounds/${sound}`),
    // Action icons
    '/icons/actions/play.png',
    '/icons/actions/continue.png',
    '/icons/actions/add.png',
    '/icons/actions/sunrise.png',
    '/icons/actions/snooze.png',
    '/icons/actions/later.png',
    '/icons/actions/feedback.png',
    '/icons/actions/ready.png',
    '/icons/actions/dismiss.png'
  ];

  event.waitUntil(
    caches.open('relife-emotional-v1')
      .then(cache => {
        console.log('[SW-Emotional] Caching emotional assets');
        return cache.addAll(emotionalAssets.filter(Boolean));
      })
      .then(() => {
        console.log('[SW-Emotional] Emotional assets cached successfully');
      })
      .catch(error => {
        console.error('[SW-Emotional] Error caching emotional assets:', error);
      })
  );
});

// Handle messages from the main thread for emotional notifications
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SCHEDULE_EMOTIONAL_NOTIFICATION':
      scheduleEmotionalNotification(data);
      break;
    
    case 'CANCEL_EMOTIONAL_NOTIFICATION':
      cancelEmotionalNotification(data.messageId);
      break;
    
    case 'TEST_EMOTIONAL_NOTIFICATION':
      testEmotionalNotification(data);
      break;
    
    case 'UPDATE_EMOTIONAL_PREFERENCES':
      updateEmotionalPreferences(data);
      break;
    
    default:
      console.log('[SW-Emotional] Unknown message type:', type);
  }
});

// Schedule emotional notification
function scheduleEmotionalNotification(notificationData) {
  console.log('[SW-Emotional] Scheduling emotional notification:', notificationData);
  
  const delay = new Date(notificationData.scheduledFor).getTime() - Date.now();
  
  if (delay > 0) {
    setTimeout(() => {
      handleEmotionalNotification(notificationData);
    }, delay);
  } else {
    // Send immediately if scheduled time has passed
    handleEmotionalNotification(notificationData);
  }
}

// Cancel emotional notification
async function cancelEmotionalNotification(messageId) {
  console.log('[SW-Emotional] Canceling emotional notification:', messageId);
  
  try {
    const notifications = await self.registration.getNotifications();
    
    notifications.forEach(notification => {
      if (notification.data?.messageId === messageId) {
        notification.close();
      }
    });
    
  } catch (error) {
    console.error('[SW-Emotional] Error canceling notification:', error);
  }
}

// Test emotional notification
function testEmotionalNotification(testData) {
  console.log('[SW-Emotional] Testing emotional notification:', testData);
  
  const testNotification = {
    title: `🧪 Test: ${testData.emotion} + ${testData.tone}`,
    body: 'This is a test emotional notification!',
    emotion: testData.emotion,
    tone: testData.tone,
    escalationLevel: 'gentle',
    messageId: `test_${Date.now()}`,
    category: 'emotional_test',
    showInAppAnimation: true
  };
  
  handleEmotionalNotification(testNotification);
}

// Update emotional preferences
function updateEmotionalPreferences(preferences) {
  console.log('[SW-Emotional] Updating emotional preferences:', preferences);
  
  // Store preferences in IndexedDB or pass to main thread
  sendMessageToClients({
    type: 'EMOTIONAL_PREFERENCES_UPDATED',
    data: preferences
  });
}

console.log('[SW-Emotional] Enhanced service worker with emotional notifications loaded');