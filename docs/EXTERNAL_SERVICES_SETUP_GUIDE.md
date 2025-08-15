# 🚀 External Services Setup Guide

Complete guide to setting up all external monitoring and analytics services for your Relife Smart Alarm app.

## 📋 Overview

Your app is configured to integrate with multiple external services for comprehensive monitoring, analytics, and error tracking. This guide walks you through setting up each service.

## 🔧 Required Services

### 1. 📊 **Supabase** (Database & Authentication)
**Purpose**: Primary database and user authentication

**Setup Steps**:
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your credentials from Settings > API
4. Run the database schema: `/database/schema-enhanced.sql`

**Environment Variables**:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. 📈 **PostHog** (Product Analytics)
**Purpose**: User behavior analytics, feature flags, session recordings

**Setup Steps**:
1. Sign up at [posthog.com](https://posthog.com)
2. Create a new project
3. Copy your Project API Key
4. Enable session recordings and heatmaps

**Environment Variables**:
```bash
VITE_POSTHOG_KEY=phc_your_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
```

**Features Enabled**:
- User event tracking
- Performance monitoring
- Session recordings (optional)
- Heatmaps
- Feature flags

### 3. 🐕 **DataDog** (Infrastructure Monitoring)
**Purpose**: Infrastructure monitoring, APM, logs, custom metrics

**Setup Steps**:
1. Sign up at [datadoghq.com](https://datadoghq.com)
2. Create account and get API key
3. Install DataDog agent (handled by Docker)
4. Configure dashboards for Relife metrics

**Environment Variables**:
```bash
DATADOG_API_KEY=your_datadog_api_key
VITE_DATADOG_CLIENT_TOKEN=your_client_token
DATADOG_SYNTHETICS_PUBLIC_KEY=your_synthetics_public
DATADOG_SYNTHETICS_PRIVATE_KEY=your_synthetics_private
```

**Configured Monitoring**:
- Application performance (APM)
- Infrastructure metrics
- Custom business metrics
- Log aggregation
- Synthetic monitoring

### 4. 🔍 **New Relic** (Application Performance Monitoring)
**Purpose**: Application performance, browser monitoring, alerting

**Setup Steps**:
1. Sign up at [newrelic.com](https://newrelic.com)
2. Create application in New Relic One
3. Get license key and account ID
4. Configure browser monitoring

**Environment Variables**:
```bash
NEWRELIC_LICENSE_KEY=your_license_key
VITE_NEW_RELIC_ACCOUNT_ID=your_account_id
NEWRELIC_API_KEY=your_api_key
```

**Features Configured**:
- Browser monitoring
- APM (Application Performance Monitoring)
- Custom events and metrics
- Error tracking
- Infrastructure monitoring

### 5. 📊 **Amplitude** (User Analytics)
**Purpose**: User behavior analysis, cohort analysis, funnels

**Setup Steps**:
1. Sign up at [amplitude.com](https://amplitude.com)
2. Create a new project
3. Get API key from Settings
4. Set up custom events

**Environment Variables**:
```bash
VITE_AMPLITUDE_API_KEY=your_amplitude_key
AMPLITUDE_API_KEY=your_server_key
```

**Tracked Events**:
- Alarm interactions
- User engagement
- Performance metrics
- Feature usage

### 6. 🚨 **Sentry** (Error Monitoring)
**Purpose**: Error tracking, performance monitoring, release tracking

**Setup Steps**:
1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project (React/JavaScript)
3. Get DSN from project settings
4. Configure release tracking

**Environment Variables**:
```bash
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ORG=your_org_name
VITE_SENTRY_PROJECT=your_project_name
VITE_SENTRY_ENVIRONMENT=production
```

### 7. 📱 **Firebase** (Push Notifications)
**Purpose**: Push notifications for alarms and reminders

**Setup Steps**:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project
3. Enable Cloud Messaging
4. Generate VAPID keys
5. Download service account key

**Environment Variables**:
```bash
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"..."}
```

### 8. ⏰ **UptimeRobot** (Uptime Monitoring)
**Purpose**: Website uptime monitoring and alerting

**Setup Steps**:
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Create HTTP monitors for your domains
3. Get API key for integrations
4. Set up alert contacts

**Environment Variables**:
```bash
VITE_UPTIME_ROBOT_KEY=your_uptime_key
```

## 🔐 Environment Configuration

### Development Environment (`.env.development`)
```bash
# Copy from .env.example and add your development keys
NODE_ENV=development
VITE_APP_ENV=development

# Use development/testing API keys
VITE_POSTHOG_KEY=phc_dev_key
VITE_SENTRY_DSN=https://dev-dsn@sentry.io/project
# ... other dev keys
```

### Production Environment (`.env.production`)
```bash
# Use production API keys with proper security
NODE_ENV=production
VITE_APP_ENV=production

# Production keys (keep secure!)
VITE_POSTHOG_KEY=phc_prod_key
VITE_SENTRY_DSN=https://prod-dsn@sentry.io/project
# ... other prod keys
```

## 🚀 Quick Setup Commands

### 1. Copy Environment Template
```bash
cp .env.example .env.local
```

### 2. Edit Environment Variables
```bash
# Edit .env.local with your API keys
nano .env.local
```

### 3. Start Monitoring Stack (Docker)
```bash
# Start DataDog, Prometheus, Grafana
docker-compose up -d
```

### 4. Initialize Database
```bash
# Run Supabase migrations
supabase db push
```

### 5. Deploy with Monitoring
```bash
# Deploy with all monitoring enabled
npm run build
npm run deploy:production
```

## 📊 Service-Specific Setup

### DataDog Dashboard Setup
1. Import the dashboard configuration: `/monitoring/grafana/dashboard.json`
2. Configure alerts in `/monitoring/alertmanager/alertmanager.yml`
3. Set up Slack/PagerDuty webhooks

### New Relic Browser Setup
1. Add browser monitoring script to `index.html`
2. Configure custom attributes in New Relic UI
3. Set up alert policies

### PostHog Feature Flags
1. Create feature flags for gradual rollouts
2. Set up funnels for alarm success tracking
3. Configure session recordings

### Sentry Release Tracking
1. Set up GitHub integration for automatic release creation
2. Configure source maps for better error tracking
3. Set up alerts for new errors

## 🔒 Security Best Practices

### API Key Management
- **Never commit API keys to git**
- Use environment variables for all keys
- Rotate keys regularly
- Use different keys for dev/staging/production

### Access Control
- Limit API key permissions to minimum required
- Use separate keys for different environments
- Enable IP restrictions where possible
- Monitor API key usage

### Data Privacy
- Configure data retention policies
- Enable data anonymization where required
- Review GDPR compliance for EU users
- Set up data export capabilities

## 🚨 Alerting Setup

### Critical Alerts (PagerDuty/Slack)
- App down (5xx errors > 50%)
- High error rate (errors > 5%)
- Performance degradation (LCP > 4s)
- Database connection issues

### Warning Alerts (Slack/Email)
- Performance warnings (LCP > 2.5s)
- High memory usage (> 80%)
- API rate limits approaching
- Deployment issues

### Business Metrics Alerts
- Alarm success rate < 90%
- User engagement drop > 20%
- Payment failures > 2%
- Support ticket increase

## 📈 Monitoring Endpoints

Your app exposes these monitoring endpoints:

### Performance Monitoring
- `POST /api/performance/web-vitals` - Web vitals tracking
- `GET /api/performance/metrics` - Performance metrics
- `POST /api/performance/errors` - Error tracking

### External Integrations
- `POST /api/external-monitoring/datadog/metrics` - DataDog metrics
- `POST /api/external-monitoring/newrelic/events` - New Relic events
- `POST /api/external-monitoring/amplitude/events` - Amplitude events

### Health Checks
- `GET /api/health` - Application health
- `GET /api/deployment/status` - Deployment status
- `POST /api/deployment/track` - Track deployments

## ✅ Verification Checklist

### Basic Setup
- [ ] Supabase project created and schema deployed
- [ ] PostHog project configured with tracking
- [ ] Sentry project setup with error tracking
- [ ] Firebase messaging configured

### Advanced Monitoring
- [ ] DataDog agent running and reporting
- [ ] New Relic browser monitoring active
- [ ] Amplitude events flowing
- [ ] Grafana dashboards displaying data

### Alerting
- [ ] Critical alerts configured
- [ ] Notification channels set up
- [ ] Alert escalation policies defined
- [ ] Test alerts verified

### Security
- [ ] API keys stored securely
- [ ] Environment separation verified
- [ ] Access permissions reviewed
- [ ] Data retention policies set

## 🆘 Troubleshooting

### Common Issues

**No data in monitoring dashboards**:
- Check API keys are correct
- Verify network connectivity
- Check browser console for errors
- Validate environment variables

**High monitoring costs**:
- Review data retention settings
- Adjust sampling rates
- Optimize custom metrics
- Use pricing calculators

**Missing alerts**:
- Verify webhook URLs
- Check notification channels
- Test alert conditions
- Review alert routing rules

**Performance impact**:
- Enable conditional monitoring
- Use async data sending
- Implement sampling
- Optimize tracking code

## 🔄 Maintenance

### Monthly Tasks
- [ ] Review monitoring costs
- [ ] Check alert effectiveness
- [ ] Update dashboard configurations
- [ ] Rotate API keys (quarterly)

### After Deployments
- [ ] Verify all monitoring still working
- [ ] Check for new errors in logs
- [ ] Update performance baselines
- [ ] Test critical alert paths

---

## 📞 Support

Need help with setup? Check the troubleshooting guide or create an issue in the repository.

**Monitoring Stack**: DataDog + New Relic + PostHog + Sentry
**Infrastructure**: Docker + Nginx + Redis + Prometheus
**Notifications**: Firebase + Slack + PagerDuty + Email