# 🔗 Stripe Webhooks Production Setup - Complete Guide

## 🎯 Overview

This guide walks you through setting up Stripe webhooks for production deployment of your Relife
Smart Alarm app. Webhooks are **critical** for subscription billing - they ensure your app knows
immediately when payments succeed, fail, or subscriptions change.

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Relife app deployed to production with HTTPS
- [ ] Stripe account in Live Mode
- [ ] API server running and accessible
- [ ] Database configured and connected

---

## 🚀 Step 1: Access Stripe Live Mode

### 1.1 Switch to Live Mode

1. Log into [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Important**: Toggle to **"Live Mode"** in the left sidebar
3. You should see "Live" indicator - you're now working with real payments

### 1.2 Navigate to Webhooks

1. Go to **Developers** → **Webhooks**
2. You should see any existing webhooks
3. Click **"Add endpoint"** to create a new production webhook

---

## 🌐 Step 2: Configure Webhook Endpoint

### 2.1 Set Endpoint URL

**Enter your production API webhook URL:**

```
https://your-production-domain.com/api/stripe/webhooks
```

**Common production URL patterns:**

- Custom domain: `https://api.relife.app/api/stripe/webhooks`
- Heroku: `https://relife-app.herokuapp.com/api/stripe/webhooks`
- Vercel: `https://relife-api.vercel.app/api/stripe/webhooks`
- Railway: `https://relife-api.railway.app/api/stripe/webhooks`
- AWS: `https://your-alb.us-east-1.elb.amazonaws.com/api/stripe/webhooks`

### 2.2 Verify Endpoint Accessibility

Test your endpoint before proceeding:

```bash
# Test that your webhook endpoint is reachable
curl -X POST https://your-domain.com/api/stripe/webhooks \
  -H "Content-Type: application/json" \
  -d '{"test": "connectivity"}'

# Expected response: 400 Bad Request (missing Stripe signature)
# This confirms the endpoint exists and is accessible
```

---

## 📡 Step 3: Select Critical Events

### 3.1 Essential Events for Subscription Billing

Select these **must-have** events:

```
✅ customer.subscription.created      # New subscription
✅ customer.subscription.updated      # Plan changes, upgrades
✅ customer.subscription.deleted      # Cancellations
✅ invoice.payment_succeeded          # Successful billing
✅ invoice.payment_failed             # Failed payments
✅ customer.subscription.trial_will_end # Trial expiring
```

### 3.2 Recommended Additional Events

For enhanced functionality, also select:

```
✅ customer.created                   # New customer
✅ customer.updated                   # Customer info changes
✅ payment_method.attached            # New payment method
✅ payment_method.detached            # Removed payment method
✅ invoice.upcoming                   # Billing reminders
✅ customer.subscription.paused       # Subscription paused
✅ setup_intent.succeeded             # Payment setup complete
```

### 3.3 Event Configuration

- **API Version**: Use latest (2023-10-16 or newer)
- **Filter events**: Leave unchecked (send all selected events)
- **Connect**: Leave unchecked (not using Stripe Connect)

---

## 🔐 Step 4: Configure Security

### 4.1 Get Webhook Signing Secret

1. After creating the webhook, click on it
2. In the **"Signing secret"** section, click **"Reveal"**
3. Copy the secret (starts with `whsec_...`)

**Example:**

```
whsec_1234567890abcdefghijklmnopqrstuvwxyz...
```

### 4.2 Add to Production Environment

**Option A: Environment Variables**

```env
STRIPE_WEBHOOK_SECRET="whsec_your_actual_webhook_secret_here"
```

**Option B: Docker Secrets**

```bash
# If using Docker Swarm or Kubernetes
echo "whsec_your_secret" | docker secret create stripe_webhook_secret -
```

**Option C: Cloud Provider Secrets**

```bash
# AWS Systems Manager Parameter Store
aws ssm put-parameter \
  --name "/relife/stripe/webhook-secret" \
  --value "whsec_your_secret" \
  --type "SecureString"

# Google Cloud Secret Manager
gcloud secrets create stripe-webhook-secret --data-file=webhook-secret.txt

# Azure Key Vault
az keyvault secret set \
  --vault-name relife-vault \
  --name stripe-webhook-secret \
  --value whsec_your_secret
```

---

## 🧪 Step 5: Test Production Webhooks

### 5.1 Send Test Event from Stripe

1. In your webhook settings, click **"Send test webhook"**
2. Select **"customer.subscription.created"**
3. Click **"Send test webhook"**

### 5.2 Verify Webhook Processing

**Check Your API Logs:**

```bash
# Look for successful processing
✅ "Webhook signature verified"
✅ "Processing event: customer.subscription.created"
✅ "Subscription created in database"
✅ "Webhook processing completed"

# Red flags:
❌ "Webhook signature verification failed"
❌ "Database connection timeout"
❌ "Error processing webhook"
```

**Check Stripe Dashboard:**

1. Go to your webhook → **"Recent deliveries"**
2. Click on the test event
3. Verify:
   - ✅ **Status**: 200 OK
   - ⏱️ **Response time**: <5 seconds
   - 📄 **Response body**: Success confirmation

### 5.3 Test Real Payment Flow

**Create a test subscription:**

1. Use your production app
2. Sign up with a real email
3. Use a test card: `4242 4242 4242 4242`
4. Complete subscription purchase

**Verify end-to-end:**

- ✅ Payment processes in Stripe
- ✅ Webhook delivered to your server
- ✅ Subscription created in your database
- ✅ User gets access to premium features
- ✅ Confirmation email sent (if configured)

---

## 📊 Step 6: Production Monitoring

### 6.1 Webhook Health Dashboard

Monitor these key metrics:

```
📈 Delivery Success Rate: >99%
⏱️ Average Response Time: <2 seconds
🔄 Retry Rate: <5%
❌ Error Rate: <1%
```

### 6.2 Set Up Alerts

Configure alerts for webhook issues:

```javascript
// Example alert configuration
const webhookAlerts = {
  delivery_failure: {
    threshold: '5 failures in 1 hour',
    channels: ['email', 'slack'],
    priority: 'high',
  },
  slow_response: {
    threshold: 'average response > 10s',
    channels: ['slack'],
    priority: 'medium',
  },
  signature_verification_failure: {
    threshold: '3 failures in 15 minutes',
    channels: ['email', 'pagerduty'],
    priority: 'critical',
  },
};
```

### 6.3 Webhook Logs Monitoring

Track webhook processing:

```bash
# Production logging examples
[INFO] Webhook received: customer.subscription.created (evt_1234...)
[INFO] Signature verified successfully
[INFO] Processing subscription for customer: cus_5678...
[INFO] Database updated: subscription_id sub_9012...
[INFO] Webhook processing completed in 1.2s
[SUCCESS] Event evt_1234... processed successfully
```

---

## 🔧 Advanced Configuration

### Webhook Retry Logic

Your Relife app includes intelligent retry handling:

```javascript
// Built-in retry configuration
const retryConfig = {
  maxRetries: 3,
  backoffStrategy: 'exponential',
  retryDelays: [1000, 5000, 15000], // 1s, 5s, 15s
  retryConditions: [
    'database_connection_error',
    'temporary_service_unavailable',
    'rate_limit_exceeded',
  ],
};
```

### Idempotency Handling

Webhooks might be delivered multiple times. Your app handles this:

```javascript
// Idempotency protection
const processedEvents = new Set();

const processWebhook = (event) => {
  if (processedEvents.has(event.id)) {
    return { status: 'already_processed' };
  }

  // Process event...
  processedEvents.add(event.id);
  return { status: 'processed' };
};
```

### Database Transaction Safety

Critical webhook operations use database transactions:

```javascript
// Example transaction handling
const processSubscriptionWebhook = async (event) => {
  const transaction = await db.transaction();

  try {
    // Update subscription
    await updateSubscription(event.data, transaction);

    // Update user permissions
    await updateUserPermissions(event.data, transaction);

    // Commit transaction
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

---

## 🚀 Production Deployment Checklist

### Pre-Deployment

- [ ] **Test webhooks thoroughly** in staging environment
- [ ] **Verify all environment variables** are set correctly
- [ ] **Test database connectivity** from production server
- [ ] **Configure monitoring and alerting**
- [ ] **Set up log aggregation**

### During Deployment

- [ ] **Deploy API server** with webhook endpoint
- [ ] **Configure load balancer** to route webhook traffic
- [ ] **Update DNS records** if needed
- [ ] **Test webhook endpoint accessibility**
- [ ] **Create webhook in Stripe Live Mode**

### Post-Deployment

- [ ] **Send test webhooks** from Stripe Dashboard
- [ ] **Monitor webhook delivery** for first few hours
- [ ] **Test complete payment flows**
- [ ] **Verify user notifications** are working
- [ ] **Check business metrics** are tracking correctly

---

## 🎯 Success Verification

### ✅ Your production webhooks are working when:

1. **Stripe Dashboard shows**:
   - 100% delivery success rate
   - <2 second average response time
   - Green status indicators

2. **Your app logs show**:
   - All webhook events being received
   - Successful signature verification
   - Database updates completing
   - No error spikes

3. **User experience works**:
   - Subscriptions activate immediately after payment
   - Failed payments show appropriate messages
   - Cancellations process correctly
   - Users get proper access to features

4. **Business metrics track**:
   - Revenue data matches Stripe
   - Subscription counts are accurate
   - Churn rates are tracked correctly

---

## 🆘 Emergency Procedures

### If Webhooks Stop Working

1. **Immediate actions**:
   - Check Stripe Dashboard for delivery failures
   - Verify API server is responding
   - Check recent deployments for issues

2. **Quick fixes**:
   - Restart API servers
   - Check environment variables
   - Verify webhook endpoint URL

3. **Temporary fallback**:
   - Use Stripe Dashboard for manual subscription management
   - Set up backup webhook endpoint
   - Process failed webhooks manually if needed

### Support Contacts

- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **Webhook Documentation**: [stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)
- **API Reference**: [stripe.com/docs/api/webhooks](https://stripe.com/docs/api/webhooks)

---

## 🎉 Congratulations!

With production webhooks properly configured, your Relife Smart Alarm app now has:

✅ **Bulletproof subscription billing** ✅ **Real-time payment processing**  
✅ **Automatic subscription management** ✅ **Comprehensive error handling** ✅ **Production-grade
monitoring** ✅ **Enterprise-level reliability**

Your payment system is now ready to handle real customers and revenue! 🚀

---

_This guide is part of the comprehensive Relife integration configuration system. For more setup
guides, see `INTEGRATION_SETTINGS_CONFIGURATION_GUIDE.md`._
