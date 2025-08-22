# Email Campaign Setup Guide for Persona-Driven Marketing

## 🚀 Quick Start: Launch Your Email Campaigns

This guide will help you set up and launch the persona-specific email marketing campaigns for
Relife's 6 user personas.

## 📋 Prerequisites

### Required Tools

- **Email automation platform** (recommendations below)
- **Analytics tracking** (Google Analytics, Mixpanel, or custom)
- **User segmentation system** (based on persona detection)
- **Email templates** (provided in `/email-campaigns/` directory)

### Recommended Email Platforms

| Platform           | Best For                   | Pricing                | Persona Support          |
| ------------------ | -------------------------- | ---------------------- | ------------------------ |
| **ConvertKit**     | Creator economy, sequences | $29/month (1k subs)    | Excellent tagging        |
| **Mailchimp**      | Small business, templates  | $10/month (500 subs)   | Good segmentation        |
| **ActiveCampaign** | Advanced automation        | $29/month (1k subs)    | Advanced personalization |
| **Klaviyo**        | E-commerce focused         | $20/month (500 subs)   | Strong analytics         |
| **SendGrid**       | Developer-friendly         | $15/month (40k emails) | API integration          |

## 🎯 Step 1: Platform Setup

### Option A: ConvertKit Setup (Recommended)

1. **Create ConvertKit Account**

```bash
# Sign up at convertkit.com
# Choose Creator plan ($29/month for up to 1,000 subscribers)
```

2. **Create Forms for Each Persona**

```javascript
// Persona-specific signup forms
const personaForms = {
  struggling_sam: 'Free Alarm App Signup',
  busy_ben: 'Productivity Morning Routine',
  professional_paula: 'Professional Productivity Tools',
  enterprise_emma: 'Team Productivity Solutions',
  student_sarah: 'Student Discount Signup',
  lifetime_larry: 'One-Time Payment Alarm App',
};
```

3. **Set Up Tags**

```javascript
// ConvertKit tags for persona identification
const personaTags = [
  'persona:struggling_sam',
  'persona:busy_ben',
  'persona:professional_paula',
  'persona:enterprise_emma',
  'persona:student_sarah',
  'persona:lifetime_larry',
];
```

4. **Configure Custom Fields**

```javascript
const customFields = {
  persona: 'Text field for persona type',
  confidence_score: 'Number field for detection confidence',
  signup_source: 'Text field for traffic source',
  trial_start_date: 'Date field for trial tracking',
  company_name: 'Text field for enterprise users',
};
```

### Option B: Mailchimp Setup

1. **Create Audience**

```javascript
// Mailchimp audience setup
const audienceConfig = {
  name: 'Relife Users - Persona Segmented',
  merge_fields: {
    PERSONA: 'Persona Type',
    CONFIDENCE: 'Detection Confidence',
    SOURCE: 'Signup Source',
  },
  tags: [
    'struggling_sam',
    'busy_ben',
    'professional_paula',
    'enterprise_emma',
    'student_sarah',
    'lifetime_larry',
  ],
};
```

2. **Create Segments**

```javascript
// Dynamic segments for each persona
const segments = {
  struggling_sam: {
    conditions: [{ field: 'PERSONA', op: 'is', value: 'struggling_sam' }],
  },
  busy_ben: {
    conditions: [{ field: 'PERSONA', op: 'is', value: 'busy_ben' }],
  },
  // ... repeat for other personas
};
```

## 🎨 Step 2: Email Template Import

### Upload Email Templates

1. **Create Template Files**
   - Copy HTML from `/email-campaigns/struggling-sam-series.html`
   - Copy HTML from `/email-campaigns/busy-ben-series.html`
   - Repeat for other personas

2. **ConvertKit Template Setup**

```html
<!-- ConvertKit Template Example -->
<div style="max-width: 600px; margin: 0 auto;">
  <h1 style="color: {{persona_color}};">{{email_subject}}</h1>
  <p>Hi {{first_name}},</p>

  {{email_content}}

  <a href="{{cta_link}}" style="background: {{persona_color}};">{{cta_text}}</a>
</div>
```

3. **Mailchimp Template Setup**

```html
<!-- Mailchimp Template Example -->
<div mc:repeatable="content" mc:variant="text">
  <h1 style="color: *|PERSONA_COLOR|*;">*|EMAIL_SUBJECT|*</h1>
  <p>Hi *|FNAME|*,</p>

  *|EMAIL_CONTENT|*

  <a href="*|CTA_LINK|*" style="background: *|PERSONA_COLOR|*;">*|CTA_TEXT|*</a>
</div>
```

## ⚡ Step 3: Automation Setup

### Struggling Sam Campaign (Free-Focused)

```javascript
// ConvertKit Automation Setup
const strugglingSamSequence = {
  trigger: 'Tag added: persona:struggling_sam',
  emails: [
    {
      subject: 'Welcome to Relife - Start Free Today! 🎉',
      delay: '0 days',
      template: 'struggling-sam-welcome',
      actions: ['Tag: email_1_sent']
    },
    {
      subject: 'The #1 mistake people make with alarms (+ how to avoid it)',
      delay: '3 days',
      template: 'struggling-sam-tips',
      actions: ['Tag: email_2_sent']
    },
    {
      subject: '"I can't believe this is free" - Real user stories',
      delay: '7 days',
      template: 'struggling-sam-social-proof',
      actions: ['Tag: email_3_sent']
    },
    {
      subject: '5 hidden features you probably haven't tried yet',
      delay: '14 days',
      template: 'struggling-sam-features'
    },
    {
      subject: 'What if I told you Premium costs less than a coffee?',
      delay: '90 days', // Very gentle upgrade approach
      template: 'struggling-sam-upgrade'
    }
  ]
};
```

### Busy Ben Campaign (ROI-Focused)

```javascript
const busyBenSequence = {
  trigger: 'Tag added: persona:busy_ben',
  emails: [
    {
      subject: 'Save 30 minutes every morning (less than your daily coffee)',
      delay: '0 days',
      template: 'busy-ben-roi',
      goals: ['Start premium trial']
    },
    {
      subject: 'This morning routine hack saves 45 minutes daily',
      delay: '2 days',
      template: 'busy-ben-smart-wake'
    },
    {
      subject: 'Never wonder "what's my day like?" again',
      delay: '4 days',
      template: 'busy-ben-calendar'
    },
    {
      subject: 'Eliminate decision fatigue with smart routines',
      delay: '7 days',
      template: 'busy-ben-routines'
    },
    {
      subject: 'How Sarah saved 2 hours per week (and you can too)',
      delay: '10 days',
      template: 'busy-ben-testimonials'
    },
    {
      subject: 'Your trial expires in 3 days (don't lose your progress)',
      delay: '11 days',
      condition: 'Trial active AND not converted',
      template: 'busy-ben-urgency'
    },
    {
      subject: 'Last chance: Keep your optimized morning routine',
      delay: '13 days',
      condition: 'Trial active AND not converted',
      template: 'busy-ben-final'
    }
  ]
};
```

## 📊 Step 4: Tracking & Analytics Setup

### 1. Email Tracking Pixels

```html
<!-- Add to email templates -->
<img
  src="https://track.relife.app/pixel?campaign={{campaign_id}}&persona={{persona}}&user={{user_id}}&event=opened"
  width="1"
  height="1"
  alt=""
  style="display:none;"
/>
```

### 2. Link Tracking

```html
<!-- Tracked CTA buttons -->
<a
  href="https://track.relife.app/click?url={{destination_url}}&campaign={{campaign_id}}&persona={{persona}}&user={{user_id}}"
  style="background: {{persona_color}}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;"
>
  {{cta_text}}
</a>
```

### 3. ConvertKit Analytics Integration

```javascript
// ConvertKit webhook for tracking
const webhookEndpoint = 'https://your-api.com/webhook/convertkit';

const trackEmailEvent = (event) => {
  return {
    subscriber_id: event.subscriber.id,
    email_address: event.subscriber.email_address,
    persona: event.subscriber.fields.persona,
    campaign_id: event.email_template.id,
    event_type: event.type, // 'open', 'click', 'subscribe'
    timestamp: event.occurred_at,
  };
};
```

### 4. Custom Analytics Dashboard

```javascript
// Track email performance by persona
const emailAnalytics = {
  trackOpen: (campaignId, persona, userId) => {
    analytics.track('Email Opened', {
      campaignId,
      persona,
      userId,
      timestamp: new Date(),
    });
  },

  trackClick: (campaignId, persona, userId, linkUrl) => {
    analytics.track('Email Clicked', {
      campaignId,
      persona,
      userId,
      linkUrl,
      timestamp: new Date(),
    });
  },

  trackConversion: (campaignId, persona, userId, conversionType) => {
    analytics.track('Email Conversion', {
      campaignId,
      persona,
      userId,
      conversionType, // 'trial_start', 'subscription', 'demo_request'
      timestamp: new Date(),
    });
  },
};
```

## 🔄 Step 5: User Segmentation & Persona Assignment

### 1. API Integration for Persona Detection

```javascript
// When user signs up, detect persona and add to email list
const addUserToEmailCampaign = async (user, detectedPersona, confidence) => {
  // ConvertKit API example
  const response = await fetch('https://api.convertkit.com/v3/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: process.env.CONVERTKIT_API_KEY,
      email: user.email,
      first_name: user.firstName,
      fields: {
        persona: detectedPersona,
        confidence_score: confidence,
        signup_source: user.source,
        signup_date: new Date().toISOString(),
      },
      tags: [`persona:${detectedPersona}`],
    }),
  });

  if (response.ok) {
    console.log(`User ${user.email} added to ${detectedPersona} campaign`);
  }
};
```

### 2. Dynamic Persona Updates

```javascript
// Update user's persona if it changes
const updateUserPersona = async (userId, oldPersona, newPersona) => {
  // Remove old persona tag, add new one
  await removeTag(userId, `persona:${oldPersona}`);
  await addTag(userId, `persona:${newPersona}`);

  // Update custom fields
  await updateCustomFields(userId, {
    persona: newPersona,
    persona_updated_at: new Date().toISOString(),
  });

  // Analytics tracking
  analytics.track('Persona Changed', {
    userId,
    oldPersona,
    newPersona,
    timestamp: new Date(),
  });
};
```

## 📱 Step 6: A/B Testing Setup

### Subject Line Testing

```javascript
const subjectLineTests = {
  struggling_sam: {
    version_a: 'Welcome to Relife - Start Free Today! 🎉',
    version_b: 'Your free alarm upgrade is ready 🎉',
    version_c: 'Better mornings start here (100% free)',
    traffic_split: [33, 33, 34], // Percentage split
  },
  busy_ben: {
    version_a: 'Save 30 minutes every morning (less than your daily coffee)',
    version_b: 'ROI: 30 min saved daily for $7.99/month',
    version_c: 'Your time is worth more than $8/month',
    traffic_split: [33, 33, 34],
  },
};
```

### CTA Button Testing

```javascript
const ctaButtonTests = {
  struggling_sam: [
    { text: 'Start Your Free Journey →', style: 'primary' },
    { text: 'Try Relife Free →', style: 'secondary' },
    { text: 'Get Started - No Credit Card →', style: 'minimal' },
  ],
  busy_ben: [
    { text: 'Start 14-Day Free Trial →', style: 'urgent' },
    { text: 'Calculate My Time Savings →', style: 'analytical' },
    { text: 'See ROI Calculator →', style: 'data-driven' },
  ],
};
```

## 🎯 Step 7: Launch Checklist

### Pre-Launch Testing

- [ ] All email templates render correctly across devices
- [ ] Tracking pixels and links are working
- [ ] Personalization tokens are populating correctly
- [ ] Unsubscribe links are functional
- [ ] SPAM score is below 5.0
- [ ] Mobile responsiveness tested

### Email Deliverability Setup

- [ ] SPF record configured: `v=spf1 include:_spf.convertkit.com ~all`
- [ ] DKIM signing enabled
- [ ] DMARC policy set: `v=DMARC1; p=quarantine; rua=mailto:dmarc@relife.app`
- [ ] From email matches domain
- [ ] Reply-to address monitored

### Campaign Configuration

- [ ] All 6 persona campaigns created
- [ ] Automation triggers tested
- [ ] Email delays and conditions verified
- [ ] Analytics tracking confirmed
- [ ] A/B tests configured

### Monitoring Dashboard

- [ ] Email performance dashboard set up
- [ ] Alert thresholds configured
- [ ] Weekly report automation enabled
- [ ] Team access permissions granted

## 📈 Step 8: Performance Monitoring

### Key Metrics to Track

| Metric               | Excellent | Good   | Needs Work |
| -------------------- | --------- | ------ | ---------- |
| **Open Rate**        | >40%      | 25-40% | <25%       |
| **Click Rate**       | >12%      | 6-12%  | <6%        |
| **Conversion Rate**  | >25%      | 15-25% | <15%       |
| **Unsubscribe Rate** | <2%       | 2-5%   | >5%        |

### Persona-Specific Benchmarks

```javascript
const personaBenchmarks = {
  struggling_sam: {
    open_rate: { target: 0.35, excellent: 0.45 },
    click_rate: { target: 0.06, excellent: 0.1 },
    trial_conversion: { target: 0.12, excellent: 0.18 },
  },
  busy_ben: {
    open_rate: { target: 0.32, excellent: 0.4 },
    click_rate: { target: 0.1, excellent: 0.15 },
    trial_conversion: { target: 0.25, excellent: 0.35 },
  },
  professional_paula: {
    open_rate: { target: 0.3, excellent: 0.38 },
    click_rate: { target: 0.12, excellent: 0.18 },
    trial_conversion: { target: 0.3, excellent: 0.4 },
  },
  enterprise_emma: {
    open_rate: { target: 0.35, excellent: 0.45 },
    demo_booking: { target: 0.25, excellent: 0.4 },
    trial_conversion: { target: 0.35, excellent: 0.5 },
  },
  student_sarah: {
    open_rate: { target: 0.45, excellent: 0.55 },
    verification_rate: { target: 0.6, excellent: 0.75 },
    trial_conversion: { target: 0.2, excellent: 0.28 },
  },
  lifetime_larry: {
    open_rate: { target: 0.38, excellent: 0.48 },
    click_rate: { target: 0.14, excellent: 0.2 },
    lifetime_conversion: { target: 0.08, excellent: 0.15 },
  },
};
```

### Weekly Performance Review

```javascript
// Automated weekly email performance report
const generateWeeklyReport = async () => {
  const report = {
    date_range: getLastWeek(),
    campaigns: {},
    top_performers: [],
    needs_attention: [],
    recommendations: [],
  };

  for (const persona of Object.keys(campaignConfig)) {
    const metrics = await getPersonaMetrics(persona);
    report.campaigns[persona] = {
      emails_sent: metrics.sent,
      open_rate: metrics.opens / metrics.sent,
      click_rate: metrics.clicks / metrics.sent,
      conversion_rate: metrics.conversions / metrics.sent,
      revenue_attributed: metrics.revenue,
    };

    // Identify top performers and problems
    if (metrics.opens / metrics.sent > personaBenchmarks[persona].open_rate.excellent) {
      report.top_performers.push({
        persona,
        metric: 'open_rate',
        value: metrics.opens / metrics.sent,
      });
    }

    if (metrics.opens / metrics.sent < personaBenchmarks[persona].open_rate.target) {
      report.needs_attention.push({
        persona,
        issue: 'low_open_rate',
        value: metrics.opens / metrics.sent,
      });
    }
  }

  return report;
};
```

## 🚨 Troubleshooting Common Issues

### Low Open Rates

1. **Check subject lines** - Test different variations
2. **Sender reputation** - Verify deliverability settings
3. **Send time optimization** - Test different times by persona
4. **List hygiene** - Remove inactive subscribers

### Low Click Rates

1. **CTA placement** - Move buttons above the fold
2. **Value proposition** - Strengthen benefit messaging
3. **Link relevance** - Ensure links match email content
4. **Mobile optimization** - Test on mobile devices

### Low Conversions

1. **Landing page alignment** - Match email and landing page messaging
2. **Offer clarity** - Make the next step obvious
3. **Friction reduction** - Minimize form fields
4. **Trust signals** - Add testimonials and guarantees

### High Unsubscribe Rates

1. **Frequency** - Reduce email frequency
2. **Relevance** - Improve persona targeting
3. **Expectations** - Set clear expectations at signup
4. **Content quality** - Increase value in each email

## 🎉 Launch Timeline

### Week 1: Setup & Testing

- **Day 1-2**: Email platform setup, import templates
- **Day 3-4**: Configure automation workflows
- **Day 5-6**: Set up tracking and analytics
- **Day 7**: Final testing and team training

### Week 2: Soft Launch

- **Day 8-10**: Launch with 10% of new signups
- **Day 11-12**: Monitor performance, fix issues
- **Day 13-14**: A/B test subject lines and CTAs

### Week 3: Full Launch

- **Day 15**: Launch with 100% of new signups
- **Day 16-21**: Daily monitoring and optimization

### Week 4: Analysis & Optimization

- **Day 22-24**: Weekly performance analysis
- **Day 25-28**: Implement improvements based on data

## 📞 Support & Next Steps

### Getting Help

- **Email campaigns**: Reply to this guide for specific questions
- **Technical setup**: Check platform documentation
- **Analytics setup**: Reference the analytics integration guide
- **Performance optimization**: Schedule a campaign review call

### Advanced Features (Future Roadmap)

- **Behavioral triggers**: Send emails based on app usage
- **Dynamic content**: Real-time personalization
- **Predictive sending**: AI-optimized send times
- **Cross-channel campaigns**: Coordinate email with push notifications

Your persona-driven email campaigns are now ready to launch! 🚀

This system should drive significant improvements in user engagement and conversion rates by
delivering highly relevant, personalized messaging to each user type.

_Need help with implementation? Just reply to this guide with your specific questions._
