# Persona Analytics Integration Guide

## 🚀 Quick Start Integration

This guide will help you integrate the persona-driven UI and analytics tracking system into your Relife alarm app.

## 📋 Prerequisites

- Supabase database access
- React/TypeScript application
- Node.js backend with Express
- Chart.js or Recharts for dashboard visualizations

## 🔧 Step-by-Step Integration

### Step 1: Database Setup

1. **Run the analytics migration**:
```bash
# Connect to your Supabase database and run:
psql -d your_database < database/analytics-migration.sql
```

2. **Verify tables were created**:
```sql
-- Check that analytics tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%analytics%' OR table_name LIKE '%campaign%';
```

### Step 2: Install Required Dependencies

```bash
# Analytics and charting libraries
bun add recharts
bun add @types/node

# If not already installed
bun add @supabase/supabase-js
```

### Step 3: Environment Variables

Add to your `.env` file:
```bash
# Analytics Configuration
ANALYTICS_ENDPOINT=https://your-api.com/api/analytics
ANALYTICS_API_KEY=your_analytics_api_key
ENABLE_ANALYTICS=true
ANALYTICS_FLUSH_INTERVAL=30000
ANALYTICS_BATCH_SIZE=50

# Campaign Tracking
CAMPAIGN_TRACKING_PIXEL=https://track.your-domain.com/pixel
EMAIL_TRACKING_DOMAIN=email.your-domain.com
SOCIAL_UTM_SOURCE=relife_social
```

### Step 4: Backend API Integration

1. **Add analytics routes to your Express app**:
```typescript
// In your main server file (e.g., server/index.ts)
import { analyticsRoutes, analyticsMiddleware } from './analytics-api';

// Add analytics middleware
app.use(analyticsMiddleware);

// Add analytics routes
app.post('/api/analytics/persona-events', analyticsRoutes.collectPersonaEvents);
app.get('/api/analytics/persona-data', analyticsRoutes.getPersonaAnalyticsData);
app.post('/api/analytics/campaign-performance', analyticsRoutes.updateCampaignPerformance);
app.get('/api/analytics/reports', analyticsRoutes.generateAnalyticsReport);
```

### Step 5: Frontend Integration

1. **Add PersonaAnalyticsProvider to your App.tsx**:
```typescript
// In your src/App.tsx
import { PersonaAnalyticsProvider } from './analytics/PersonaAnalytics';

function App() {
  return (
    <PersonaAnalyticsProvider>
      {/* Your existing app content */}
    </PersonaAnalyticsProvider>
  );
}
```

2. **Integrate PersonaDrivenUI component**:
```typescript
// In your pricing or main page component
import { PersonaDrivenUI } from '../components/PersonaDrivenUI';
import { usePersonaAnalytics } from '../analytics/PersonaAnalytics';

const YourComponent = () => {
  const analytics = usePersonaAnalytics();
  
  useEffect(() => {
    // Set user ID when available
    if (userId) {
      analytics.setUserId(userId);
    }
  }, [userId, analytics]);

  return (
    <div>
      <PersonaDrivenUI />
      {/* Your existing content */}
    </div>
  );
};
```

3. **Add analytics dashboard to admin panel**:
```typescript
// In your admin/dashboard area
import { PersonaAnalyticsDashboard } from '../components/PersonaAnalyticsDashboard';

const AdminDashboard = () => {
  return (
    <div>
      <h1>Analytics Dashboard</h1>
      <PersonaAnalyticsDashboard className="w-full" />
    </div>
  );
};
```

### Step 6: Campaign Tracking Integration

1. **Email campaign tracking**:
```html
<!-- Add to email templates -->
<img src="{{CAMPAIGN_TRACKING_PIXEL}}?campaign={{campaign_id}}&persona={{persona}}&user={{user_id}}&event=opened" 
     width="1" height="1" alt="" style="display:none;" />

<!-- For email links -->
<a href="{{TRACKING_DOMAIN}}/link?url={{destination_url}}&campaign={{campaign_id}}&persona={{persona}}&user={{user_id}}">
  {{persona_specific_cta}}
</a>
```

2. **Social media UTM tracking**:
```javascript
// Generate UTM links for social campaigns
const generateUTMLink = (persona, campaign, platform) => {
  const baseUrl = 'https://relife.app';
  const params = new URLSearchParams({
    utm_source: platform,
    utm_medium: 'social',
    utm_campaign: campaign,
    utm_content: persona,
    utm_term: 'persona_driven'
  });
  return `${baseUrl}?${params.toString()}`;
};
```

### Step 7: Testing the Integration

1. **Test persona detection**:
```typescript
// In browser console or test file
import { usePersonaAnalytics } from '../analytics/PersonaAnalytics';

const testAnalytics = () => {
  const analytics = usePersonaAnalytics();
  
  // Test persona detection
  analytics.trackPersonaDetection('busy_ben', {
    subscriptionTier: 'free',
    ageRange: '25-35',
    usagePatterns: ['morning', 'work_focus'],
    priceInteraction: 'viewed_premium',
    featurePreferences: ['custom_sounds', 'calendar_sync'],
    deviceType: 'desktop',
    timeOfDay: 'morning'
  }, 0.85);
  
  // Check session summary
  console.log(analytics.getSessionSummary());
};
```

2. **Verify database entries**:
```sql
-- Check if events are being recorded
SELECT * FROM persona_analytics_events 
ORDER BY created_at DESC 
LIMIT 10;

-- Check persona distribution
SELECT persona, COUNT(*) as count 
FROM persona_analytics_events 
GROUP BY persona 
ORDER BY count DESC;
```

## 📊 Dashboard Configuration

### Customizing Chart Colors
```typescript
// In PersonaAnalyticsDashboard.tsx, modify PERSONA_COLORS
const PERSONA_COLORS: Record<UserPersona, string> = {
  struggling_sam: '#10B981',     // Green - Budget-friendly
  busy_ben: '#3B82F6',          // Blue - Professional
  professional_paula: '#8B5CF6', // Purple - Premium
  enterprise_emma: '#6366F1',    // Indigo - Enterprise
  student_sarah: '#F59E0B',      // Orange - Student
  lifetime_larry: '#EAB308'      // Yellow - Lifetime
};
```

### Adding Custom Metrics
```typescript
// Add custom metrics to dashboard
const customMetrics = useMemo(() => {
  return {
    averageTimeToConversion: calculateAverageTimeToConversion(analyticsData),
    personaRetentionRate: calculateRetentionRate(analyticsData),
    topConvertingFeatures: findTopConvertingFeatures(analyticsData)
  };
}, [analyticsData]);
```

## 🎯 Campaign Setup Examples

### Setting up Email Campaigns
```javascript
// Email campaign configuration
const emailCampaigns = {
  struggling_sam_welcome: {
    subject: "Welcome to Relife - Start Free Today! 🎉",
    template: "struggling_sam_series_01",
    delay_hours: 0,
    persona_target: "struggling_sam",
    conversion_goal: "trial_signup"
  },
  busy_ben_productivity: {
    subject: "Save 30 Minutes Every Morning ⏰",
    template: "busy_ben_series_01", 
    delay_hours: 24,
    persona_target: "busy_ben",
    conversion_goal: "premium_upgrade"
  }
};
```

### Social Media Campaign Tracking
```javascript
// Social media campaign setup
const socialCampaigns = [
  {
    platform: 'tiktok',
    target_persona: 'student_sarah',
    content_type: 'video',
    campaign_id: 'tiktok_student_back_to_school_2024',
    budget: 500,
    target_metrics: {
      ctr: 0.03,
      conversion_rate: 0.12
    }
  },
  {
    platform: 'linkedin',
    target_persona: 'professional_paula',
    content_type: 'article',
    campaign_id: 'linkedin_productivity_tips_2024',
    budget: 800,
    target_metrics: {
      ctr: 0.04,
      conversion_rate: 0.18
    }
  }
];
```

## 🔍 Monitoring & Alerts

### Setting Up Performance Alerts
```typescript
// Alert configuration
const alertRules = {
  lowConversionRate: {
    condition: (metrics) => metrics.conversionRate < 10,
    message: "Conversion rate below 10% threshold",
    action: "review_persona_messaging",
    notify: ["team@relife.com", "#analytics-alerts"]
  },
  highPersonaConfidence: {
    condition: (metrics) => metrics.avgConfidence > 95,
    message: "Persona detection confidence very high",
    action: "consider_persona_expansion", 
    notify: ["team@relife.com"]
  },
  campaignUnderperforming: {
    condition: (campaign) => campaign.ctr < 0.02,
    message: `Campaign ${campaign.id} underperforming`,
    action: "review_creative_assets",
    notify: ["marketing@relife.com"]
  }
};
```

### Creating Automated Reports
```javascript
// Schedule weekly reports
const scheduleWeeklyReport = () => {
  cron.schedule('0 9 * * 1', async () => {
    const report = await generateAnalyticsReport({
      timeRange: '7d',
      format: 'json',
      includePersonas: 'all',
      includeCampaigns: true
    });
    
    await sendReportEmail(report, ['team@relife.com']);
  });
};
```

## 📈 Advanced Analytics Features

### A/B Testing Integration
```typescript
// A/B test persona variations
const runPersonaABTest = async (userId: string) => {
  const variant = getABTestVariant(userId);
  const persona = await detectPersona(userId);
  
  analytics.trackPersonaDetection(persona, detectionData, confidence, {
    abTestVariant: variant,
    testName: 'persona_ui_v2_test'
  });
};
```

### Cohort Analysis Setup
```sql
-- Create cohort analysis view
CREATE VIEW persona_cohort_analysis AS
SELECT 
    DATE_TRUNC('week', first_detection.created_at) as cohort_week,
    persona,
    COUNT(DISTINCT first_detection.user_id) as cohort_size,
    COUNT(DISTINCT conversions.user_id) as converted_users,
    COUNT(DISTINCT conversions.user_id)::FLOAT / COUNT(DISTINCT first_detection.user_id) as cohort_conversion_rate
FROM (
    SELECT user_id, persona, MIN(created_at) as created_at
    FROM persona_analytics_events
    WHERE event_type = 'persona_detected'
    GROUP BY user_id, persona
) first_detection
LEFT JOIN (
    SELECT DISTINCT user_id
    FROM persona_analytics_events 
    WHERE conversion_step = 'conversion'
) conversions ON first_detection.user_id = conversions.user_id
GROUP BY DATE_TRUNC('week', first_detection.created_at), persona
ORDER BY cohort_week DESC, persona;
```

## 🚨 Troubleshooting

### Common Issues & Solutions

**1. Analytics events not appearing in dashboard**
```bash
# Check API endpoint connectivity
curl -X POST http://localhost:3000/api/analytics/persona-events \
  -H "Content-Type: application/json" \
  -d '{"events": [{"event": "test", "data": {"persona": "test"}}]}'
```

**2. Database connection errors**
- Verify Supabase credentials in environment variables
- Check if analytics tables exist with proper permissions
- Confirm Supabase RLS policies allow inserts/selects

**3. Dashboard not loading data**
- Verify React components have proper imports
- Check browser console for JavaScript errors
- Confirm API endpoints are returning data

**4. Persona detection not working**
- Check if PersonaAnalyticsProvider is properly wrapped around components
- Verify usePersonaAnalytics hook is being called correctly
- Check browser network tab for failed API calls

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('ANALYTICS_DEBUG', 'true');

// Check analytics queue status
const analytics = usePersonaAnalytics();
console.log('Analytics Status:', analytics.getSessionSummary());
```

## 🎯 Success Metrics & KPIs

### Week 1 Goals
- [ ] Persona detection accuracy > 80%
- [ ] Analytics events flowing to database
- [ ] Dashboard displaying real-time data
- [ ] At least 3 campaigns actively tracked

### Month 1 Goals  
- [ ] Conversion rate improvement of 15%+
- [ ] Persona-specific CTRs above baseline
- [ ] Campaign ROI tracking operational
- [ ] Automated weekly reports generated

### Quarter 1 Goals
- [ ] 25%+ improvement in user conversion
- [ ] Persona stability score > 90%
- [ ] All marketing channels tracked
- [ ] Predictive analytics implemented

This integration guide should get your persona-driven analytics system up and running effectively. The combination of persona detection, targeted UI/UX, and comprehensive analytics tracking will provide powerful insights for optimizing user conversion and retention! 🚀