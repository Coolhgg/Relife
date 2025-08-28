# Complete Webhook Configuration Guide

This comprehensive guide will help you configure all notification webhooks for your Relife Alarm
application. The app supports multiple webhook types for payments, push notifications, monitoring
alerts, and custom integrations.

## 📋 Quick Start

```bash
# 1. Run the interactive configuration tool
node scripts/configure-webhooks.js

# 2. Test your configuration
node test-webhook-setup.js

# 3. Deploy and monitor
npm run webhook:deploy
```

## 🔧 Configuration Overview

Your Relife app supports these webhook types:

- **💳 Stripe Payment Webhooks** - Handle subscription and payment events
- **📱 Push Notification Webhooks** - Mobile and web push notifications
- **📊 Monitoring Alert Webhooks** - Slack, Discord, Email, PagerDuty alerts
- **🔒 Security & Audit Webhooks** - Security events and compliance logging
- **🛠️ Custom Webhooks** - Integration with third-party services

## 🚀 Step-by-Step Configuration

### 1. Prerequisites Setup

Before configuring webhooks, ensure you have:

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.production
cp .env.example .env.development

# Run database migrations
npm run migrate

# Start the application
npm run build && npm run start
```

### 2. Database Setup

Run the webhook management schema:

```bash
# Apply webhook database schema
psql $DATABASE_URL -f database/migrations/webhook_management_schema.sql

# Verify tables were created
npm run db:verify
```

### 3. Stripe Payment Webhooks

#### Step 3.1: Configure Stripe Dashboard

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter your endpoint URL: `https://yourdomain.com/api/stripe/webhooks`
4. Select these events:
   ```
   ✓ customer.subscription.created
   ✓ customer.subscription.updated
   ✓ customer.subscription.deleted
   ✓ customer.subscription.trial_will_end
   ✓ invoice.payment_succeeded
   ✓ invoice.payment_failed
   ✓ payment_intent.succeeded
   ✓ payment_intent.payment_failed
   ```
5. Copy the **Webhook Secret** (starts with `whsec_`)

#### Step 3.2: Environment Configuration

Add to your `.env.production`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Webhook Security
STRIPE_WEBHOOK_TOLERANCE=300
STRIPE_MAX_RETRIES=3
```

#### Step 3.3: Test Stripe Webhooks

```bash
# Test webhook endpoint
curl -X POST https://yourdomain.com/api/stripe/webhooks \
  -H "Content-Type: application/json" \
  -d '{"test": "connectivity"}'

# Should return 400 with "Missing Stripe signature" (this is expected)

# Use Stripe CLI for end-to-end testing
stripe listen --forward-to https://yourdomain.com/api/stripe/webhooks
stripe trigger customer.subscription.created
```

### 4. Push Notification Webhooks

#### Step 4.1: Firebase Setup (for Mobile)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create or select your project
3. Go to **Project Settings → Cloud Messaging**
4. Copy the **Server Key**

#### Step 4.2: Web Push Setup (VAPID)

```bash
# Generate VAPID keys
npm install -g web-push
web-push generate-vapid-keys

# This generates:
# Public Key: BP1LiNuBGuK9Z...
# Private Key: BGtUGpCKd8yPh...
```

#### Step 4.3: Push Notification Configuration

Add to your `.env.production`:

```bash
# Push Notification Configuration
FIREBASE_SERVER_KEY=your_firebase_server_key_here
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
PUSH_NOTIFICATIONS_ENABLED=true

# Push Settings
PUSH_WEBHOOK_URL=https://yourdomain.com/api/push/webhook
PUSH_RATE_LIMIT=100
PUSH_BATCH_SIZE=1000
```

#### Step 4.4: Test Push Notifications

```bash
# Test push notification system
node -e "
const { PushNotificationService } = require('./src/services/push-notifications');
PushNotificationService.testPushNotification('test-user-id');
"
```

### 5. Monitoring Alert Webhooks

#### Step 5.1: Slack Integration

1. Go to [Slack Apps](https://api.slack.com/apps)
2. Create new app → **"From scratch"**
3. Name: **"Relife Monitoring"**, select workspace
4. Go to **"Incoming Webhooks"** → Activate
5. **"Add New Webhook to Workspace"**
6. Select channel (e.g., `#alerts`)
7. Copy webhook URL

#### Step 5.2: Discord Integration

1. Go to your Discord server
2. Right-click channel → **"Edit Channel"**
3. **"Integrations"** → **"Webhooks"** → **"Create Webhook"**
4. Name: **"Relife Alerts"**
5. Copy webhook URL

#### Step 5.3: Email (SMTP) Configuration

Choose your email provider:

| Provider | SMTP Host          | Port | Security |
| -------- | ------------------ | ---- | -------- |
| Gmail    | smtp.gmail.com     | 587  | TLS      |
| Outlook  | smtp.office365.com | 587  | TLS      |
| SendGrid | smtp.sendgrid.net  | 587  | TLS      |
| Mailgun  | smtp.mailgun.org   | 587  | TLS      |

#### Step 5.4: PagerDuty Setup

1. Log into [PagerDuty](https://pagerduty.com)
2. Go to **"Services"** → **"Service Directory"**
3. Create or select service
4. **"Integrations"** → Add → **"Prometheus"**
5. Copy the **Integration Key**

#### Step 5.5: Monitoring Configuration

Add to your `.env.production`:

```bash
# Slack Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_CHANNEL=#alerts
SLACK_USERNAME=Relife Bot

# Discord Configuration
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@yourdomain.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_ADDRESS=Relife Alerts <alerts@yourdomain.com>

# PagerDuty Configuration
PAGERDUTY_INTEGRATION_KEY_CRITICAL=your_critical_integration_key
PAGERDUTY_INTEGRATION_KEY_URGENT=your_urgent_integration_key

# Alert Thresholds
ALERT_ERROR_RATE_THRESHOLD=5.0
ALERT_RESPONSE_TIME_THRESHOLD=5000
ALERT_FAILURE_COUNT_THRESHOLD=10
```

#### Step 5.6: Test Monitoring Webhooks

```bash
# Test all monitoring webhooks
node scripts/configure-webhooks.js --test

# Test individual services
curl -X POST $SLACK_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text":"🧪 Test from Relife setup"}'

curl -X POST $DISCORD_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"content":"🧪 Test from Relife setup"}'
```

### 6. Security Configuration

#### Step 6.1: Generate Security Keys

```bash
# Run the configuration script to generate secure keys
node scripts/configure-webhooks.js

# Or manually generate
node -e "console.log('Webhook Auth Token:', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('Encryption Key:', require('crypto').randomBytes(32).toString('hex'))"
```

#### Step 6.2: Security Environment Variables

Add to your `.env.production`:

```bash
# Security Configuration
WEBHOOK_AUTH_TOKEN=your_generated_webhook_auth_token_here
ENCRYPTION_KEY=your_generated_encryption_key_here
WEBHOOK_SIGNATURE_SECRET=your_signature_secret_here

# Rate Limiting
ENABLE_WEBHOOK_RATE_LIMITING=true
WEBHOOK_RATE_LIMIT_WINDOW=60000
WEBHOOK_RATE_LIMIT_MAX=1000
WEBHOOK_RATE_LIMIT_SKIP_SUCCESS=false

# IP Security
WEBHOOK_IP_WHITELIST=54.187.174.169,54.187.205.235,54.187.216.72
ENABLE_IP_WHITELIST=true

# Retry Configuration
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RETRY_DELAY=1000
WEBHOOK_RETRY_MULTIPLIER=2
WEBHOOK_RETRY_MAX_DELAY=30000
```

### 7. Advanced Configuration

#### Step 7.1: Custom Webhooks

Create custom webhook integrations:

```javascript
// Add to src/backend/webhook-handlers/custom-webhook-handler.ts
export class CustomWebhookHandler {
  async handleWebhook(event) {
    // Your custom logic here
    console.log('Custom webhook received:', event);
  }
}
```

#### Step 7.2: Webhook Middleware

Configure custom middleware:

```javascript
// Add to src/middleware/webhook-middleware.ts
export const customWebhookMiddleware = (req, res, next) => {
  // Custom authentication, logging, etc.
  next();
};
```

### 8. Dashboard Integration

#### Step 8.1: Enable Management Dashboard

Add the webhook dashboard to your app:

```tsx
// In your main App.tsx or dashboard route
import WebhookManagementDashboard from './components/WebhookManagementDashboard';

function App() {
  return (
    <div>
      {/* Your other components */}
      <Route path="/admin/webhooks" component={WebhookManagementDashboard} />
    </div>
  );
}
```

#### Step 8.2: API Routes Setup

Add webhook management routes to your Express app:

```javascript
// In your main server file
import { webhookManagementRoutes } from './src/backend/webhook-management-api';

app.get('/api/webhooks/config', webhookManagementRoutes.getConfigs);
app.get('/api/webhooks/stats', webhookManagementRoutes.getStats);
app.get('/api/webhooks/events', webhookManagementRoutes.getEvents);
app.post('/api/webhooks/test/:id', webhookManagementRoutes.testWebhook);
app.patch('/api/webhooks/config/:id', webhookManagementRoutes.updateConfig);
app.post('/api/webhooks/config', webhookManagementRoutes.createConfig);
app.delete('/api/webhooks/config/:id', webhookManagementRoutes.deleteConfig);
app.get('/api/webhooks/health', webhookManagementRoutes.getHealth);
app.post('/api/webhooks/retry', webhookManagementRoutes.retryEvents);
```

## 🧪 Testing & Validation

### Comprehensive Testing

```bash
# Run all webhook tests
npm run test:webhooks

# Test specific webhook types
npm run test:webhooks:stripe
npm run test:webhooks:push
npm run test:webhooks:monitoring

# Load testing
npm run test:webhooks:load

# Security testing
npm run test:webhooks:security
```

### Manual Testing Checklist

- [ ] Stripe webhooks receive and process test events
- [ ] Push notifications work on iOS, Android, and web
- [ ] Slack receives test alerts
- [ ] Discord receives test alerts
- [ ] Email alerts are delivered
- [ ] PagerDuty incidents are created
- [ ] Webhook logs are stored in database
- [ ] Rate limiting works correctly
- [ ] Signature validation blocks invalid requests
- [ ] Retry mechanism works for failed webhooks
- [ ] Dashboard shows real-time webhook status
- [ ] Security events are logged

## 📊 Monitoring & Maintenance

### Health Checks

Monitor webhook health with these endpoints:

```bash
# Overall webhook health
curl https://yourdomain.com/api/webhooks/health

# Webhook statistics
curl https://yourdomain.com/api/webhooks/stats

# Recent webhook events
curl https://yourdomain.com/api/webhooks/events?limit=100
```

### Automated Monitoring

Set up automated health checks:

```bash
# Add to your cron jobs
# Check webhook health every 5 minutes
*/5 * * * * curl -f https://yourdomain.com/api/webhooks/health || echo "Webhook health check failed"

# Cleanup old webhook logs daily at 2 AM
0 2 * * * psql $DATABASE_URL -c "SELECT cleanup_webhook_data(90);"

# Generate weekly webhook reports
0 9 * * 1 node scripts/generate-webhook-report.js
```

### Performance Optimization

```bash
# Analyze webhook performance
npm run webhook:analyze

# Optimize database queries
npm run webhook:optimize-db

# Update webhook configurations
npm run webhook:update-configs
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Stripe Webhook Signature Validation Fails

**Symptoms:**

- HTTP 400 errors in Stripe dashboard
- "Invalid webhook signature" in logs

**Solutions:**

```bash
# Verify webhook secret is correct
echo $STRIPE_WEBHOOK_SECRET | head -c 20

# Check endpoint URL matches exactly
curl -I https://yourdomain.com/api/stripe/webhooks

# Test with Stripe CLI
stripe listen --forward-to https://yourdomain.com/api/stripe/webhooks
```

#### 2. Push Notifications Not Working

**Symptoms:**

- No notifications received on devices
- Firebase errors in logs

**Solutions:**

```bash
# Verify Firebase configuration
node -e "console.log('Server key valid:', process.env.FIREBASE_SERVER_KEY?.startsWith('AAAA'))"

# Test push service
curl -X POST https://yourdomain.com/api/push/test \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user"}'

# Check device registration
npm run push:check-registration
```

#### 3. Monitoring Alerts Not Received

**Symptoms:**

- No alerts in Slack/Discord/email
- Webhook tests pass but real alerts fail

**Solutions:**

```bash
# Test webhook URLs directly
curl -X POST $SLACK_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text":"Direct test"}'

# Check alert thresholds
npm run webhook:check-thresholds

# Verify alert conditions
npm run webhook:simulate-alert
```

#### 4. High Response Times

**Symptoms:**

- Slow webhook processing
- Timeouts in webhook logs

**Solutions:**

```bash
# Check database performance
npm run db:analyze-webhook-queries

# Monitor webhook processing
npm run webhook:monitor-performance

# Optimize webhook handlers
npm run webhook:optimize-handlers
```

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Set debug environment variables
export WEBHOOK_LOG_LEVEL=debug
export WEBHOOK_VERBOSE_LOGGING=true
export DEBUG=webhook:*

# Run with debug logging
npm run dev

# View live logs
tail -f logs/webhook.log | grep ERROR
```

## 📚 Additional Resources

### Documentation

- [Stripe Webhook Guide](./STRIPE_WEBHOOK_PRODUCTION_GUIDE.md)
- [Push Notification Setup](./docs/push-notification-setup.md)
- [Security Best Practices](./SECURITY.md)
- [API Documentation](./docs/api-reference.md)

### Monitoring Dashboards

- Webhook Management: `/admin/webhooks`
- Analytics Dashboard: `/admin/analytics`
- Security Events: `/admin/security`

### Support Scripts

- `scripts/configure-webhooks.js` - Interactive configuration
- `scripts/test-webhooks.js` - Comprehensive testing
- `scripts/monitor-webhooks.js` - Health monitoring
- `scripts/backup-webhook-config.js` - Configuration backup

---

## 🎉 Congratulations!

You've successfully configured comprehensive webhook notifications for your Relife application! Your
users will now receive:

- ✅ **Reliable payment and subscription notifications**
- ✅ **Real-time push notifications for alarms and motivation**
- ✅ **Instant alerts for system issues and failures**
- ✅ **Comprehensive monitoring and analytics**
- ✅ **Enterprise-grade security and compliance**

### Next Steps

1. **Monitor Performance**: Check the webhook dashboard regularly
2. **Set Up Alerts**: Configure monitoring thresholds for your team
3. **Regular Maintenance**: Run cleanup scripts and performance reviews
4. **User Feedback**: Monitor user engagement with notifications
5. **Scale Planning**: Prepare for increased webhook volume as you grow

**Need Help?**

- Check the troubleshooting section above
- Review logs in `/admin/webhooks`
- Run `node scripts/configure-webhooks.js --help`

---

_Generated by Relife Webhook Configuration System v1.0_
