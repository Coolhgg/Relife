# 🔧 Relife Smart Alarm - Integration Settings Configuration Guide

## Overview

Welcome to the comprehensive integration settings guide for the Relife Smart Alarm application. This
guide will walk you through configuring all external services, monitoring tools, payment systems,
analytics, and mobile integrations.

## 📋 Table of Contents

- [Quick Start Setup](#quick-start-setup)
- [Core Services Configuration](#core-services-configuration)
- [Analytics & Monitoring Setup](#analytics--monitoring-setup)
- [Payment Integration](#payment-integration)
- [Push Notifications](#push-notifications)
- [Mobile App Configuration](#mobile-app-configuration)
- [Infrastructure & Monitoring](#infrastructure--monitoring)
- [Advanced Features](#advanced-features)
- [Validation & Testing](#validation--testing)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start Setup

### Prerequisites

Before configuring integrations, ensure you have:

- [ ] Node.js 20+ installed
- [ ] Docker and Docker Compose installed
- [ ] Access to the Relife repository
- [ ] API keys for external services (see sections below)

### Automated Setup

Run the automated setup script to configure essential services:

```bash
# Run the interactive setup
./scripts/setup-external-services.sh

# Or validate existing configuration
node scripts/validate-external-services.js
```

### Manual Configuration

1. Copy the environment template:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` with your actual API keys and configuration values
3. Validate your configuration:

```bash
npm run services:validate
```

---

## 🗄️ Core Services Configuration

### Supabase Database (REQUIRED)

Supabase provides the core database and authentication for the Relife app.

**Setup Steps:**

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Get your URL and keys from Settings > API
4. Import the database schema

**Environment Variables:**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Database Setup:**

```bash
# Import the enhanced schema
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# Or manually import database/schema-enhanced.sql in the Supabase dashboard
```

### Environment Configuration

Configure the core app settings:

```env
# App Configuration
VITE_APP_NAME="Relife"
VITE_APP_VERSION="2.0.0"
VITE_APP_DOMAIN=localhost:3000
VITE_API_BASE_URL=http://localhost:3001

# Feature Flags
VITE_ENABLE_OFFLINE_SUPPORT=true
VITE_ENABLE_VOICE_SYNTHESIS=true
VITE_ENABLE_DEBUG_MODE=true
VITE_PWA_ENABLED=true
```

---

## 📊 Analytics & Monitoring Setup

### PostHog Analytics (RECOMMENDED)

Primary user analytics and behavior tracking.

**Setup Steps:**

1. Sign up at [posthog.com](https://posthog.com)
2. Create a project
3. Copy your project API key

**Configuration:**

```env
VITE_POSTHOG_KEY=phc_your_project_api_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_ENABLE_SESSION_RECORDING=true
VITE_ENABLE_HEATMAPS=true
```

**Features Enabled:**

- User behavior tracking
- Session recordings
- Feature flag management
- Funnel analysis
- Cohort tracking

### Sentry Error Monitoring (RECOMMENDED)

Real-time error tracking and performance monitoring.

**Setup Steps:**

1. Sign up at [sentry.io](https://sentry.io)
2. Create a React project
3. Copy your DSN from project settings

**Configuration:**

```env
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ORG=your-organization
VITE_SENTRY_PROJECT=your-project-name
```

### DataDog Infrastructure Monitoring (OPTIONAL)

Advanced infrastructure monitoring and APM.

**Setup Steps:**

1. Sign up at [datadoghq.com](https://datadoghq.com)
2. Get API key from Integrations > APIs
3. Create RUM application for frontend monitoring

**Configuration:**

```env
DATADOG_API_KEY=your_api_key_here
VITE_DATADOG_CLIENT_TOKEN=your_client_token_here
VITE_DATADOG_APPLICATION_ID=your_app_id_here
```

### New Relic APM (OPTIONAL)

Application performance monitoring.

**Configuration:**

```env
NEWRELIC_LICENSE_KEY=your_license_key_here
VITE_NEW_RELIC_ACCOUNT_ID=your_account_id_here
```

### Amplitude User Analytics (OPTIONAL)

Advanced user analytics and product intelligence.

**Configuration:**

```env
VITE_AMPLITUDE_API_KEY=your_amplitude_api_key_here
```

---

## 💳 Payment Integration

### Stripe Payment Processing

Complete payment system with subscriptions, one-time payments, and billing management.

**Setup Steps:**

1. Sign up at [stripe.com](https://dashboard.stripe.com)
2. Get your API keys from the dashboard
3. Configure webhook endpoints

**Environment Variables:**

```env
# Use test keys for development
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Payment Settings
VITE_STRIPE_ENABLED=true
VITE_PAYMENT_CURRENCY=usd
VITE_PAYMENT_SUCCESS_URL=/payment/success
VITE_PAYMENT_CANCEL_URL=/payment/cancel
```

**Webhook Configuration:**

1. In Stripe Dashboard, go to Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhooks`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

**Subscription Plans Available:**

- **Free**: $0 (3 alarms max)
- **Basic**: $4.99/month (unlimited alarms)
- **Premium**: $9.99/month (smart features + analytics)
- **Pro**: $19.99/month (AI coach + advanced features)

**Testing:**

```bash
# Test payment configuration
node scripts/test-payment-config.js

# Start API server for testing
npm run api:dev
```

---

## 🔔 Push Notifications

### Firebase/VAPID Configuration

Configure push notifications for alarm reminders and updates.

**Setup Steps:**

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Cloud Messaging
3. Generate VAPID keys

**Configuration:**

```env
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"..."}
```

**Service Worker Setup:** The service worker (`public/sw-unified.js`) is already configured to
handle:

- Push notification display
- Background alarm processing
- Offline capability
- Cache management

---

## 📱 Mobile App Configuration

### Capacitor Configuration

The mobile app is configured via `capacitor.config.ts` with the following features:

**Core Settings:**

- App ID: `com.scrapybara.relife`
- App Name: `Relife Alarm`
- Scheme: HTTPS for Android, `Relife` for iOS

**Plugins Enabled:**

- Local Notifications
- Push Notifications
- Background Mode (for alarms)
- Haptics
- Device Info
- Geolocation
- Camera (for profile pictures)

### Android Setup

**Prerequisites:**

- Android Studio installed
- Java 11+ configured
- Android SDK tools

**Setup Steps:**

```bash
# Add Android platform
npm run cap:add:android

# Generate signing keystore
npm run sign:android

# Configure keystore in android/keystore.properties
```

**Keystore Configuration:**

```properties
# android/keystore.properties
storeFile=../app-release-key.keystore
storePassword=your_keystore_password
keyAlias=relife-alarm
keyPassword=your_key_password
```

### iOS Setup

**Prerequisites:**

- Xcode installed (macOS only)
- Apple Developer account

**Setup Steps:**

```bash
# Add iOS platform
npm run cap:add:ios

# Configure signing
npm run sign:ios
```

**iOS Configuration:**

- Background app refresh enabled
- Push notification capabilities
- App Store Connect configuration

### Mobile Build Commands

```bash
# Development builds
npm run mobile:dev:android
npm run mobile:dev:ios

# Production builds
npm run build:android:release
npm run build:ios:archive

# Sync changes
npm run cap:sync
```

---

## 🏗️ Infrastructure & Monitoring

### Docker Services Stack

The project includes a complete monitoring stack with Docker Compose.

**Services Included:**

- **App Container**: Main Relife application
- **API Container**: Express.js backend API
- **Redis**: Caching and session storage
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards
- **Nginx Exporter**: Web server metrics
- **Fluentd**: Log aggregation

**Quick Start:**

```bash
# Start all services
docker-compose up -d

# View logs
npm run services:monitor:logs

# Stop services
npm run services:monitor:stop
```

**Service URLs:**

- App: http://localhost (port 80)
- API: http://localhost:3001
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3002
- Redis: localhost:6379

### Prometheus Configuration

**Metrics Collection:**

- System metrics (CPU, memory, disk)
- Application performance metrics
- Web vitals (LCP, FID, CLS)
- Custom business metrics
- External service health checks

**Alert Rules:** Configured in `monitoring/prometheus/alerts/`:

- Performance degradation
- High error rates
- Resource exhaustion
- SLA breaches
- Security incidents

### Grafana Dashboards

**Available Dashboards:**

- Application Performance Overview
- User Experience Metrics
- Business Intelligence
- Infrastructure Health
- Security Monitoring

**Access:** http://localhost:3002

- Username: `admin`
- Password: Set via `GRAFANA_PASSWORD` environment variable

---

## 🎯 Advanced Features

### AI Model Configuration

Configure AI-powered features for smart alarm optimization.

**Environment Variables:**

```env
# OpenAI for intelligent features
VITE_OPENAI_API_KEY=sk-your_openai_api_key_here

# ElevenLabs for voice synthesis
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# AI Performance Monitoring
VITE_ENABLE_AI_MONITORING=true
VITE_AI_PERFORMANCE_ENDPOINT=/api/ai/performance
```

**AI Features Available:**

- Smart alarm optimization
- Voice cloning for custom alarms
- Behavioral intelligence analysis
- Predictive scheduling
- Emotional state detection

### Performance Monitoring

**Configuration:**

```env
VITE_PERFORMANCE_MONITORING=true
VITE_PERFORMANCE_ENDPOINT=/api/performance
VITE_ANALYTICS_ENDPOINT=/api/analytics

# Performance Thresholds
VITE_PERFORMANCE_LCP_THRESHOLD=2500
VITE_PERFORMANCE_FID_THRESHOLD=100
VITE_PERFORMANCE_CLS_THRESHOLD=0.1
VITE_PERFORMANCE_MEMORY_THRESHOLD=50
```

### Security Configuration

**Security Headers:**

```env
VITE_ENABLE_SECURITY_HEADERS=true
VITE_ENABLE_HTTPS=true
VITE_CSRF_TOKEN=your_csrf_token_here
VITE_RATE_LIMIT_ENABLED=true
```

**Security Features:**

- CSRF protection
- Rate limiting
- Content Security Policy
- HTTPS enforcement
- Input validation
- SQL injection prevention

---

## ✅ Validation & Testing

### Configuration Validation

Validate your setup before deployment:

```bash
# Validate all external services
npm run services:validate

# Test payment configuration
node scripts/test-payment-config.js

# Test mobile setup
npm run test:mobile:smoke

# Run full test suite
npm run test:all
```

### Testing Scripts Available

**Unit & Integration Tests:**

```bash
npm run test                    # Basic unit tests
npm run test:integration        # Integration tests
npm run test:e2e               # End-to-end tests
npm run test:mobile            # Mobile-specific tests
npm run test:coverage          # Test coverage reports
```

**Performance Tests:**

```bash
npm run test:perf:baseline     # Performance baseline
npm run test:perf:load         # Load testing
npm run test:perf:lighthouse   # Lighthouse audits
```

**Accessibility Tests:**

```bash
npm run test:a11y:all          # Complete accessibility test suite
npm run a11y:baseline          # Generate accessibility baseline
npm run a11y:report            # Generate a11y report
```

### Service Health Checks

**Health Check Endpoints:**

- App Health: `GET /api/health`
- Database Health: `GET /api/health/database`
- External Services: `GET /api/health/services`
- Performance Metrics: `GET /api/performance/metrics`

---

## 🔧 Step-by-Step Configuration

### 1. Essential Services (Start Here)

**Supabase Database:**

```bash
# 1. Set up Supabase credentials
echo "VITE_SUPABASE_URL=https://your-project.supabase.co" >> .env.local
echo "VITE_SUPABASE_ANON_KEY=your_anon_key" >> .env.local

# 2. Import database schema
supabase db push
```

**Basic App Configuration:**

```env
# Add to .env.local
VITE_APP_NAME="Relife"
VITE_APP_VERSION="2.0.0"
VITE_APP_DOMAIN=localhost:3000
NODE_ENV=development
```

### 2. Analytics Setup (High Priority)

**PostHog (Primary Analytics):**

```bash
# Sign up at posthog.com and get your API key
echo "VITE_POSTHOG_KEY=phc_your_key_here" >> .env.local
echo "VITE_ANALYTICS_ENABLED=true" >> .env.local
```

**Sentry (Error Monitoring):**

```bash
# Sign up at sentry.io and create a React project
echo "VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id" >> .env.local
```

### 3. Payment Integration (For Monetization)

**Stripe Configuration:**

```bash
# Get keys from dashboard.stripe.com/apikeys
echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key" >> .env.local
echo "STRIPE_SECRET_KEY=sk_test_your_key" >> .env.local
echo "VITE_STRIPE_ENABLED=true" >> .env.local

# Start payment API server
npm run api:dev
```

### 4. Push Notifications (Mobile Features)

**VAPID Configuration:**

```bash
# Generate VAPID keys or use Firebase
echo "VITE_VAPID_PUBLIC_KEY=your_vapid_public_key" >> .env.local
echo "VAPID_PRIVATE_KEY=your_vapid_private_key" >> .env.local
```

### 5. Mobile App Setup (For Mobile Users)

**Capacitor Configuration:**

```bash
# Build and sync mobile platforms
npm run mobile:setup

# Test on devices
npm run mobile:dev:android    # Android development
npm run mobile:dev:ios        # iOS development
```

### 6. Monitoring Stack (Production)

**Docker Monitoring:**

```bash
# Start monitoring services
docker-compose up -d

# Configure environment for monitoring
echo "GRAFANA_PASSWORD=your_grafana_password" >> .env.local
echo "REDIS_PASSWORD=your_redis_password" >> .env.local
```

---

## 🎛️ Advanced Configuration Options

### Performance Optimization

```env
# Performance Monitoring
VITE_PERFORMANCE_MONITORING=true
VITE_PERFORMANCE_LCP_THRESHOLD=2500      # Largest Contentful Paint (ms)
VITE_PERFORMANCE_FID_THRESHOLD=100       # First Input Delay (ms)
VITE_PERFORMANCE_CLS_THRESHOLD=0.1       # Cumulative Layout Shift
VITE_PERFORMANCE_MEMORY_THRESHOLD=50     # Memory usage (MB)

# Caching Configuration
VITE_ENABLE_SERVICE_WORKER=true
VITE_CACHE_STRATEGY=stale-while-revalidate
VITE_CACHE_MAX_AGE=86400
```

### International & Accessibility

```env
# Internationalization
VITE_DEFAULT_LANGUAGE=en
VITE_FALLBACK_LANGUAGE=en
VITE_RTL_SUPPORT=true

# Accessibility Features
VITE_ENABLE_SCREEN_READER=true
VITE_ENABLE_HIGH_CONTRAST=true
VITE_ENABLE_VOICE_NAVIGATION=true
```

### Security Hardening

```env
# Security Configuration
VITE_ENABLE_SECURITY_HEADERS=true
VITE_CSRF_TOKEN=your_csrf_token_here
VITE_RATE_LIMIT_ENABLED=true
VITE_ENABLE_HTTPS=true

# Content Security Policy
VITE_CSP_ENABLED=true
VITE_CSP_REPORT_URI=/api/security/csp-reports
```

---

## 🎯 Integration Priorities

### Phase 1: Core Functionality (Essential)

1. ✅ **Supabase** - Database and authentication
2. ✅ **Environment** - Basic app configuration
3. ✅ **Service Worker** - PWA functionality

### Phase 2: User Intelligence (High Priority)

1. ⚡ **PostHog** - User analytics and behavior
2. ⚡ **Sentry** - Error monitoring and performance
3. ⚡ **Push Notifications** - User engagement

### Phase 3: Monetization (Business Critical)

1. 💰 **Stripe** - Payment processing
2. 💰 **Subscription Management** - Billing and plans
3. 💰 **Usage Tracking** - Feature usage analytics

### Phase 4: Advanced Features (Growth)

1. 🚀 **Mobile Apps** - Android and iOS
2. 🚀 **AI Features** - Smart optimization
3. 🚀 **Infrastructure Monitoring** - Production reliability

### Phase 5: Scale & Optimization (Enterprise)

1. 📈 **Advanced Analytics** - DataDog, New Relic
2. 📈 **Performance Optimization** - CDN, caching
3. 📈 **International Support** - Multi-language, RTL

---

## 🧪 Testing Your Configuration

### Automated Validation

```bash
# Run comprehensive validation
npm run services:validate

# Test specific integrations
npm run test:analytics        # Test analytics integrations
npm run test:payment          # Test payment flow
npm run test:mobile           # Test mobile functionality
npm run test:pwa              # Test PWA features
```

### Manual Testing Checklist

**Core Functionality:**

- [ ] App loads without errors
- [ ] Database connection works
- [ ] Authentication flow works
- [ ] Alarms can be created and triggered

**Analytics:**

- [ ] Events appear in PostHog
- [ ] Errors appear in Sentry
- [ ] Performance metrics are collected
- [ ] User sessions are tracked

**Payments:**

- [ ] Stripe checkout works
- [ ] Webhooks process correctly
- [ ] Subscription creation works
- [ ] Billing management functional

**Mobile:**

- [ ] Apps build successfully
- [ ] Push notifications work
- [ ] Offline functionality works
- [ ] Background alarms trigger

---

## 🚨 Production Deployment

### Environment-Specific Configuration

**Development (.env.development):**

```env
NODE_ENV=development
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
# Use test API keys
```

**Staging (.env.staging):**

```env
NODE_ENV=staging
VITE_APP_ENV=staging
VITE_DEBUG_MODE=false
# Use test API keys with production-like data
```

**Production (.env.production):**

```env
NODE_ENV=production
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
VITE_ENABLE_HTTPS=true
# Use live API keys
```

### Security Checklist for Production

- [ ] Replace all test API keys with production keys
- [ ] Enable HTTPS everywhere
- [ ] Configure proper CORS origins
- [ ] Set up SSL certificates
- [ ] Enable security headers
- [ ] Configure rate limiting
- [ ] Set up backup strategies
- [ ] Enable audit logging

---

## 🆘 Troubleshooting

### Common Issues

**"Supabase connection failed"**

- ✅ Check URL format: `https://your-project.supabase.co`
- ✅ Verify anon key is correct
- ✅ Check network connectivity

**"Stripe initialization error"**

- ✅ Verify publishable key format: `pk_test_...` or `pk_live_...`
- ✅ Check if Stripe is enabled: `VITE_STRIPE_ENABLED=true`
- ✅ Ensure API server is running

**"Analytics not tracking"**

- ✅ Check PostHog key format: `phc_...`
- ✅ Verify analytics is enabled: `VITE_ANALYTICS_ENABLED=true`
- ✅ Check browser console for errors

**"Mobile app not building"**

- ✅ Check Capacitor CLI installation: `npm install -g @capacitor/cli`
- ✅ Verify platform setup: `npx cap doctor`
- ✅ Check Android/iOS requirements

### Debug Commands

```bash
# Debug configuration
npm run services:validate --verbose

# Check service connectivity
curl -f http://localhost:3001/api/health

# Test database connection
npm run test:database

# Debug mobile setup
npx cap doctor
```

### Support Resources

- 📚 **Documentation**: Check `/docs` folder for detailed guides
- 🐛 **Issue Tracking**: File issues in the repository
- 💬 **Community**: Join the Relife Discord/Slack
- 📧 **Support**: Contact support@relife.app

---

## 📚 Additional Resources

### Configuration Files Reference

- **Environment**: `.env.example`, `.env.local`, `.env.production`
- **Docker**: `docker-compose.yml`, `docker-compose.dev.yml`
- **Mobile**: `capacitor.config.ts`, `android/`, `ios/`
- **Monitoring**: `monitoring/prometheus/`, `monitoring/grafana/`
- **Database**: `database/schema-enhanced.sql`, `database/migrations/`

### Setup Scripts

- `./scripts/setup-external-services.sh` - Interactive service setup
- `./scripts/validate-external-services.js` - Configuration validation
- `./scripts/test-payment-config.js` - Payment testing
- `./scripts/setup-monitoring.sh` - Monitoring stack setup

### Documentation Index

- `PAYMENT_SETUP_GUIDE.md` - Detailed payment setup
- `ANALYTICS_TRACKING_SETUP.md` - Analytics configuration
- `MOBILE_INTEGRATION_GUIDE.md` - Mobile app setup
- `MONITORING_ALERTS_SETUP_COMPLETE.md` - Monitoring configuration
- `SECURITY.md` - Security guidelines

---

## 🎉 Quick Reference Commands

```bash
# Complete setup from scratch
cp .env.example .env.local
./scripts/setup-external-services.sh
npm run services:validate
npm run dev

# Start development environment
npm run dev                    # Frontend
npm run api:dev               # Backend API

# Mobile development
npm run mobile:dev:android    # Android development
npm run mobile:dev:ios        # iOS development

# Production deployment
docker-compose up -d          # Start infrastructure
npm run build                 # Build production
npm run ci:validate           # Pre-deployment checks

# Monitoring
npm run services:monitor      # Start monitoring stack
npm run test:perf:all         # Performance testing
npm run quality:full-check    # Code quality checks
```

---

This guide provides everything you need to configure all integrations for the Relife Smart Alarm
application. Start with the essential services and gradually add more advanced features as your
application grows.

For detailed implementation guides, check the specific documentation files mentioned throughout this
guide.
