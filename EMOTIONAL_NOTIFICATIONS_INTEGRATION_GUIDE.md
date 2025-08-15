# 🧠 Emotional Intelligence Integration Guide
## For Relife Smart Alarm App

This guide shows you exactly how to integrate the new Emotional Intelligence service with your existing Relife Smart Alarm app infrastructure.

---

## 🚀 Quick Start

### 1. Database Setup
```bash
# Run the complete migration suite (recommended)
psql -d your_database -f database/migrations/run_all_migrations.sql

# OR run individual migrations in order:
# psql -d your_database -f database/migrations/001_create_emotional_tables.sql
# psql -d your_database -f database/migrations/002_create_indexes_and_constraints.sql
# psql -d your_database -f database/migrations/003_create_triggers_and_functions.sql
# psql -d your_database -f database/migrations/004_seed_emotional_message_templates.sql
# psql -d your_database -f database/migrations/005_create_analytics_views.sql
# psql -d your_database -f database/migrations/006_setup_row_level_security.sql

# Verify tables were created
psql -d your_database -c "\dt emotional*"

# Check installation status
psql -d your_database -c "SELECT * FROM emotional_overview_dashboard;"
```

### 2. Service Worker Update
```bash
# Replace your existing service worker registration
cp public/sw-emotional.js public/sw.js

# Update your manifest.json to point to the new service worker
# OR register both service workers for gradual migration
```

### 3. Environment Variables
Add to your `.env` files:
```env
# Optional: For enhanced message generation (OpenAI integration)
OPENAI_API_KEY=your_key_here

# Feature flags
EMOTIONAL_NOTIFICATIONS_ENABLED=true
EMOTIONAL_MESSAGE_CACHE_TTL=3600
MAX_EMOTIONAL_NOTIFICATIONS_PER_DAY=1
```

### 4. Install in Your App
```tsx
// In your main App.tsx or dashboard component
import { useEmotionalNotifications } from './hooks/useEmotionalNotifications';
import { EmotionalNudgeModal } from './components/EmotionalNudgeModal';

function Dashboard() {
  const [{ lastNotification, isLoading }, { trackResponse, dismissCurrentNotification }] = 
    useEmotionalNotifications({ 
      userId: user.id, 
      enabled: user.preferences?.emotionalNotificationsEnabled 
    });

  const [showModal, setShowModal] = useState(false);

  // Show modal when new emotional notification arrives
  useEffect(() => {
    if (lastNotification) {
      setShowModal(true);
    }
  }, [lastNotification]);

  return (
    <>
      {/* Your existing dashboard content */}
      
      <EmotionalNudgeModal
        notification={lastNotification}
        isVisible={showModal}
        onClose={() => {
          setShowModal(false);
          dismissCurrentNotification();
        }}
        onResponse={(response) => {
          trackResponse(lastNotification?.message.id, response);
          setShowModal(false);
        }}
      />
    </>
  );
}
```

---

## 🔧 Integration Points

### 1. **Analytics Service Integration**
Your existing `AnalyticsService` automatically tracks emotional notification events:

```typescript
// These events are automatically tracked:
- EMOTIONAL_NOTIFICATION_GENERATED
- EMOTIONAL_NOTIFICATION_DISPLAYED  
- EMOTIONAL_NOTIFICATION_CLICKED
- EMOTIONAL_NOTIFICATION_RESPONSE
- EMOTIONAL_NOTIFICATION_SNOOZED
- EMOTIONAL_NOTIFICATION_DISMISSED

// Add to your PostHog dashboard:
const emotionalEvents = [
  'emotional_notification_generated',
  'emotional_notification_opened', 
  'emotional_task_completed'
];
```

### 2. **Push Notification Service Integration** 
Extend your existing `PushNotificationService`:

```typescript
// In src/services/push-notifications.ts
import { emotionalIntelligenceService } from './emotional-intelligence';

export class PushNotificationService {
  // Your existing methods...

  static async scheduleEmotionalNotification(userId: string): Promise<void> {
    const emotionalPayload = await emotionalIntelligenceService
      .generateEmotionalNotification(userId);
    
    if (emotionalPayload) {
      // Send via your existing FCM/push infrastructure
      await this.sendNotification({
        userId,
        title: emotionalPayload.message.personalizedMessage,
        body: 'Tap to see your personalized message',
        category: 'emotional_nudge',
        data: emotionalPayload
      });
    }
  }
}
```

### 3. **User Preferences Integration**
Add emotional settings to your existing preferences system:

```typescript
// In your user preferences type
interface UserPreferences {
  // ... existing preferences
  emotionalNotifications?: {
    enabled: boolean;
    tone: 'encouraging' | 'playful' | 'firm' | 'roast';
    intensity: 'soft' | 'medium' | 'strong';
    frequency: 'daily' | 'every2days' | 'weekly';
    roastModeEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
}

// Default preferences
const defaultEmotionalPreferences = {
  enabled: true,
  tone: 'encouraging',
  intensity: 'medium',
  frequency: 'daily',
  roastModeEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00'
};
```

### 4. **Voice Mood System Integration**
Your existing voice moods automatically map to emotional tones:

```typescript
// Automatic mapping in types/emotional.ts:
const VOICE_MOOD_TO_EMOTIONAL_TONE = {
  'drill-sergeant': 'firm',
  'sweet-angel': 'encouraging', 
  'anime-hero': 'playful',
  'savage-roast': 'roast',
  'motivational': 'encouraging',
  'gentle': 'encouraging'
};

// In your user onboarding, when they select a voice mood:
const emotionalTone = VOICE_MOOD_TO_EMOTIONAL_TONE[selectedVoiceMood];
// This automatically sets their preferred emotional notification tone
```

---

## 🎯 A/B Testing Integration

### 1. **PostHog Feature Flags**
```typescript
// Add to your feature flags
const emotionalFeatureFlags = {
  'emotional-notifications-enabled': {
    rollout: 0.1, // Start with 10% of users
    variants: {
      control: 0.5,    // No emotional notifications
      treatment: 0.5   // Emotional notifications enabled
    }
  },
  'emotional-tone-test': {
    rollout: 1.0,
    variants: {
      encouraging: 0.25,
      playful: 0.25,
      firm: 0.25,
      mixed: 0.25  // Adaptive tone selection
    }
  }
};
```

### 2. **A/B Test Tracking**
```typescript
// Automatically tracked in analytics:
this.analytics.track('EMOTIONAL_AB_TEST_ASSIGNMENT', {
  userId,
  testName: 'emotional-tone-test',
  variant: assignedVariant,
  emotion: emotionalState.emotion
});
```

---

## 📊 Analytics Dashboard Setup

### 1. **PostHog Dashboard Widgets**
Add these insights to your PostHog dashboard:

```javascript
// Emotional Notification Funnel
const emotionalFunnel = {
  type: 'Funnel',
  events: [
    'emotional_notification_generated',
    'emotional_notification_opened', 
    'emotional_task_completed'
  ],
  breakdown: 'emotion_type'
};

// Emotional Effectiveness by Tone
const effectivenessByTone = {
  type: 'Trend',
  events: ['emotional_notification_response'],
  properties: ['effectiveness_rating'],
  breakdown: 'tone'
};

// User Retention Impact
const retentionImpact = {
  type: 'Retention',
  cohortEvent: 'emotional_notification_first_received',
  returningEvent: 'alarm_completed'
};
```

### 2. **Custom Metrics**
```sql
-- Add these queries to your analytics:

-- Emotional notification open rates by emotion
SELECT 
  emotion_type,
  COUNT(*) as sent,
  COUNT(*) FILTER (WHERE notification_opened) as opened,
  ROUND(
    COUNT(*) FILTER (WHERE notification_opened)::decimal / COUNT(*) * 100, 
    2
  ) as open_rate_percent
FROM emotional_notification_logs
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY emotion_type;

-- Task completion rates after emotional notifications
SELECT 
  tone,
  COUNT(*) FILTER (WHERE notification_opened) as opened,
  COUNT(*) FILTER (WHERE action_taken = 'completed_task') as completed,
  ROUND(
    COUNT(*) FILTER (WHERE action_taken = 'completed_task')::decimal / 
    COUNT(*) FILTER (WHERE notification_opened) * 100, 
    2
  ) as completion_rate_percent
FROM emotional_notification_logs
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY tone;
```

---

## 🔄 Background Job Integration

### 1. **Scheduling Emotional Notifications**
Add to your existing job scheduler:

```typescript
// In your background job system (cron, Bull, etc.)
import { emotionalIntelligenceService } from '../services/emotional-intelligence';

// Daily emotional notification job
export const scheduleEmotionalNotifications = async () => {
  console.log('Scheduling emotional notifications...');
  
  // Get users who should receive emotional notifications
  const { data: eligibleUsers } = await supabase
    .from('users')
    .select('id, preferences')
    .eq('preferences->emotionalNotifications->enabled', true);
  
  for (const user of eligibleUsers) {
    try {
      const notification = await emotionalIntelligenceService
        .generateEmotionalNotification(user.id);
      
      if (notification) {
        // Schedule via your push notification service
        await PushNotificationService.scheduleEmotionalNotification(user.id);
      }
    } catch (error) {
      console.error(`Error scheduling emotional notification for user ${user.id}:`, error);
    }
  }
};

// Run daily at optimal times for different time zones
cron.schedule('0 8 * * *', scheduleEmotionalNotifications); // 8 AM UTC
```

### 2. **Effectiveness Analysis Job**
```typescript
// Weekly job to analyze and optimize message effectiveness
export const analyzeEmotionalEffectiveness = async () => {
  console.log('Analyzing emotional notification effectiveness...');
  
  // Update message effectiveness scores
  await supabase.rpc('update_all_message_effectiveness');
  
  // Generate insights for underperforming messages
  const { data: lowPerforming } = await supabase
    .from('emotional_messages')
    .select('*')
    .lt('effectiveness_score', 2.0)
    .gt('usage_count', 10);
  
  // Log insights or trigger alerts
  if (lowPerforming.length > 0) {
    console.warn(`${lowPerforming.length} emotional messages underperforming`);
    // Could trigger alerts or A/B tests for new variants
  }
};

cron.schedule('0 2 * * 1', analyzeEmotionalEffectiveness); // Weekly Monday 2 AM
```

---

## 🔧 Development Tools

### 1. **Testing Emotional Notifications**
```typescript
// Add to your development tools
export const EmotionalNotificationTester: React.FC = () => {
  const [, { testEmotionalNotification }] = useEmotionalNotifications({
    userId: 'test-user',
    enabled: true
  });

  return (
    <div className="p-4 border rounded">
      <h3>Test Emotional Notifications</h3>
      <div className="grid grid-cols-3 gap-2 mt-2">
        {['happy', 'sad', 'excited', 'worried', 'lonely', 'proud', 'sleepy'].map(emotion => 
          ['encouraging', 'playful', 'firm', 'roast'].map(tone => (
            <button
              key={`${emotion}-${tone}`}
              onClick={() => testEmotionalNotification(emotion, tone)}
              className="p-2 bg-blue-500 text-white rounded text-sm"
            >
              {emotion} + {tone}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
```

### 2. **Emotional State Debugger**
```typescript
// Debug component to view user's emotional state
export const EmotionalStateDebugger: React.FC<{ userId: string }> = ({ userId }) => {
  const [emotionalState, setEmotionalState] = useState(null);

  useEffect(() => {
    const debugEmotionalState = async () => {
      const userStats = await getUserStats(userId);
      const userProfile = await getUserEmotionalProfile(userId);
      const state = await emotionalIntelligenceService.analyzeUserEmotionalState(userStats, userProfile);
      setEmotionalState(state);
    };

    debugEmotionalState();
  }, [userId]);

  if (!emotionalState) return <div>Loading...</div>;

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3>Emotional State Debug</h3>
      <pre>{JSON.stringify(emotionalState, null, 2)}</pre>
    </div>
  );
};
```

---

## 🎨 Asset Requirements

### 1. **Emotional Icons** (72x72px)
Create these icons and place in `public/icons/emotions/`:
- `happy-72x72.png` - 😊 Active user
- `sad-72x72.png` - 😢 Missed alarms  
- `worried-72x72.png` - 😟 3-7 days inactive
- `excited-72x72.png` - 🥳 Achievements unlocked
- `lonely-72x72.png` - 😔 No social activity
- `proud-72x72.png` - 🏆 Major milestones
- `sleepy-72x72.png` - 😴 Sleep schedule issues

### 2. **Large Banner Images** (512x256px)
Create these for rich notifications in `public/images/emotional-banners/`:
- `happy-banner-512x256.png`
- `excited-banner-512x256.png`
- `sad-banner-512x256.png`
- `worried-banner-512x256.png`
- `lonely-banner-512x256.png`
- `proud-banner-512x256.png`
- `sleepy-banner-512x256.png`

### 3. **Sound Files** (Optional)
Add emotional notification sounds in `public/sounds/`:
- `gentle-chime.wav` - Happy notifications
- `celebration.wav` - Excited notifications
- `soft-bell.wav` - Sad notifications
- `attention-tone.wav` - Worried notifications
- `warm-melody.wav` - Lonely notifications
- `achievement-fanfare.wav` - Proud notifications
- `gentle-wake.wav` - Sleepy notifications

---

## 🔒 Privacy & Compliance

### 1. **Update Privacy Policy**
Add this section to your privacy policy:

```
Emotional Notifications Feature:
- We analyze your app usage patterns to determine emotional context
- Data used: alarm completion rates, streak information, time since last use
- We do not analyze or store sensitive personal information
- All emotional analysis is based on behavioral patterns, not personal content
- You can opt out of emotional notifications at any time
- Emotional data is deleted after 90 days of inactivity
```

### 2. **User Consent**
Add to your onboarding flow:

```tsx
const EmotionalNotificationsConsent: React.FC = () => (
  <div className="consent-screen">
    <h2>Make Your Notifications Personal</h2>
    <p>
      We can analyze your usage patterns to send more motivating and 
      personalized reminder messages. This helps improve your success rate.
    </p>
    
    <h3>What we analyze:</h3>
    <ul>
      <li>How often you complete your alarms</li>
      <li>Your current streak and achievements</li>
      <li>Time since your last successful morning</li>
    </ul>
    
    <h3>What we DON'T analyze:</h3>
    <ul>
      <li>Personal messages or content</li>
      <li>Location or device data</li>
      <li>Contacts or social media</li>
    </ul>
    
    <div className="consent-controls">
      <button onClick={acceptEmotionalNotifications}>
        ✨ Yes, make my notifications personal
      </button>
      <button onClick={declineEmotionalNotifications}>
        📱 Just standard notifications, please
      </button>
    </div>
  </div>
);
```

---

## 🚀 Launch Strategy

### 1. **Phase 1: Silent Beta (Week 1-2)**
- Enable for 5% of users
- Focus on data collection and bug fixes
- Monitor system performance
- Test push notification delivery

### 2. **Phase 2: Feedback Beta (Week 3-4)**
- Expand to 15% of users
- Add in-app feedback collection
- A/B test different message tones
- Optimize message timing

### 3. **Phase 3: Soft Launch (Week 5-6)**
- Expand to 50% of users
- Full analytics dashboard
- Documentation and training materials
- Performance optimization

### 4. **Phase 4: Full Launch (Week 7-8)**
- 100% rollout to opted-in users
- Marketing announcement
- User education campaign
- Monitoring and iteration

---

## 📈 Success Metrics

### Primary KPIs:
- **Notification Open Rate**: Target 40%+ (vs 20% baseline)
- **User Return Rate**: Target 60%+ within 24h of notification
- **7-Day Retention**: Target 25-40% improvement
- **Task Completion After Notification**: Target 30%+

### Secondary Metrics:
- Average emotional effectiveness rating: Target >3.5/5
- Opt-out rate: Target <5%
- User satisfaction scores for notifications
- Long-term retention improvements

---

## 🛠️ Troubleshooting

### Common Issues:

1. **Notifications not appearing**
   - Check service worker registration
   - Verify push permissions are granted
   - Ensure emotional tables exist in database

2. **Messages not personalized**
   - Verify user data is being collected
   - Check message template variable replacement
   - Ensure emotional analysis is running

3. **Performance issues**
   - Add database indexes for emotional tables
   - Implement message template caching
   - Optimize emotional analysis queries

4. **A/B test not working**
   - Verify PostHog integration
   - Check feature flag configuration
   - Ensure proper event tracking

---

## 📞 Support

For technical questions about emotional intelligence integration:
- Review the implementation guide: `/EMOTIONAL_NOTIFICATIONS_INTEGRATION_GUIDE.md`
- Check the service documentation: `/src/services/emotional-intelligence.ts`
- Test components: `/src/components/EmotionalNudgeModal.tsx`
- Database schema: `/database/migrations/001_add_emotional_intelligence_tables.sql`

Your Relife Smart Alarm app now has the foundation for truly emotional, personalized notifications that will create deeper user engagement and significantly improve retention! 🚀