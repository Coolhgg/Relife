# 🎯 Complete Webhook Setup - Action Plan

## 📁 Files Created for You

I've created everything you need to deploy and configure your Stripe webhooks:

### 🚀 Deployment Files

- **`api/stripe/webhooks.js`** - Vercel serverless webhook handler
- **`server.js`** - Express server for Railway/Heroku deployment
- **`setup-production-env.js`** - Environment configuration script
- **`test-webhook-setup.js`** - Testing and validation script

### 📖 Documentation

- **`WEBHOOK_DEPLOYMENT_QUICKSTART.md`** - Step-by-step deployment guide
- **`STRIPE_WEBHOOK_PRODUCTION_GUIDE.md`** - Comprehensive production setup

---

## ⚡ Quick Start (30 minutes)

### 1️⃣ Choose Your Deployment Platform

**Option A: Vercel (Easiest)**

```bash
# Install and deploy
npm install -g vercel
vercel --prod
```

**Option B: Railway (Full Backend)**

```bash
# Install and deploy
npm install -g @railway/cli
railway login
railway link
railway up
```

**Option C: Netlify**

```bash
# Install and deploy
npm install -g netlify-cli
netlify deploy --prod
```

### 2️⃣ Configure Environment Variables

```bash
# Run the setup script
node setup-production-env.js
```

Or set manually on your platform:

- `STRIPE_SECRET_KEY` - Your Stripe live secret key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `STRIPE_WEBHOOK_SECRET` - (Get from Stripe after Step 3)

### 3️⃣ Create Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Live Mode**
2. Navigate to **Developers → Webhooks**
3. Click **"Add endpoint"**
4. **URL:** `https://your-app.vercel.app/api/stripe/webhooks`
5. **Events:** Select these critical ones:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`

### 4️⃣ Update Webhook Secret

1. In your new webhook, click **"Reveal"** in the Signing secret section
2. Copy the secret (starts with `whsec_...`)
3. Update your environment variables with this secret
4. Re-deploy your app

### 5️⃣ Test Everything

```bash
# Test your deployment
node test-webhook-setup.js https://your-app.vercel.app

# Send test webhook from Stripe Dashboard
# Look for 200 OK responses and check your logs
```

---

## 🧪 Testing Checklist

Run these tests to verify everything works:

### ✅ Basic Connectivity

```bash
# Health check should return 200 OK
curl https://your-app.vercel.app/health

# Webhook endpoint should return 400 (missing signature)
curl -X POST https://your-app.vercel.app/api/stripe/webhooks
```

### ✅ Environment Variables

All these should be set:

- [ ] `STRIPE_SECRET_KEY` (starts with `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`)
- [ ] `SUPABASE_URL` (your project URL)
- [ ] `SUPABASE_SERVICE_KEY` (service role key)

### ✅ Stripe Webhook Test

1. In Stripe Dashboard, send test webhook
2. Check Response: **200 OK, <2 seconds**
3. Check Logs: "Successfully processed webhook..."
4. Check Database: New entry in `webhook_logs` table

### ✅ End-to-End Payment

1. Create subscription in your app
2. Use test card: `4242 4242 4242 4242`
3. Verify webhook processes payment
4. User gets premium access immediately

---

## 🔍 Troubleshooting

### ❌ 400 Bad Request - Invalid Signature

- **Check:** `STRIPE_WEBHOOK_SECRET` environment variable
- **Fix:** Copy exact secret from Stripe Dashboard
- **Test:** Re-deploy and send test webhook

### ❌ 500 Internal Server Error

- **Check:** Application logs for detailed error
- **Common:** Missing environment variables
- **Fix:** Run `node test-webhook-setup.js` to diagnose

### ❌ Webhook Delivery Failures

- **Check:** Endpoint URL is publicly accessible
- **Verify:** HTTPS is working (required for production)
- **Test:** Manual curl request to your endpoint

### ❌ Database Connection Issues

- **Check:** Supabase credentials are correct
- **Verify:** Database tables exist (subscriptions, webhook_logs)
- **Test:** Run database connection test

---

## 📊 Production Monitoring

Once deployed, monitor these metrics:

### Stripe Dashboard

- **Delivery Success Rate:** >99%
- **Average Response Time:** <2 seconds
- **Retry Rate:** <5%

### Your Database

- Check `webhook_logs` table for processing records
- Verify `subscriptions` table updates correctly
- Monitor for failed webhook attempts

### Application Logs

Look for these success indicators:

```
✅ "Processing Stripe webhook: customer.subscription.created"
✅ "Webhook signature verified"
✅ "Successfully processed webhook ... in XXXms"
```

---

## 🎉 Success Indicators

Your webhook setup is working when:

1. **Stripe shows:** 100% delivery success, <2s response time
2. **Database shows:** Webhook events logged, subscriptions created
3. **Users experience:** Instant access after payment
4. **Logs show:** No webhook processing errors
5. **Tests pass:** All automated tests successful

---

## 📞 Need Help?

### Quick Fixes

1. **Run the test script:** `node test-webhook-setup.js`
2. **Check deployment logs** for specific error messages
3. **Verify environment variables** are set correctly
4. **Test connectivity** manually with curl

### Documentation

- `WEBHOOK_DEPLOYMENT_QUICKSTART.md` - Fast deployment steps
- `STRIPE_WEBHOOK_PRODUCTION_GUIDE.md` - Detailed production guide

### Command Reference

```bash
# Test everything
node test-webhook-setup.js https://your-app.com

# Setup environment
node setup-production-env.js

# Quick deploy (Vercel)
vercel --prod

# Check logs
vercel logs --follow
```

---

## 🚀 You're Ready!

With this setup, your Relife Smart Alarm app now has:

- ✅ **Production-ready webhook handling**
- ✅ **Real-time subscription management**
- ✅ **Automatic payment processing**
- ✅ **Comprehensive error handling**
- ✅ **Enterprise-grade reliability**

Your users can now subscribe and get **instant access** to premium features! 🎯
