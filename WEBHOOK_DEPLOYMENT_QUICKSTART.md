# 🚀 Webhook Deployment & Setup - Quick Start

## 🎯 Goal

Get your Stripe webhooks deployed and configured for production in **under 30 minutes**.

## 📋 What You Have

✅ Webhook handling code is **ready** (`stripe-webhooks.ts`, `webhook-endpoint.ts`)  
✅ Database schema is in place  
✅ Environment configuration is set up

## 🚀 Step 1: Deploy Your Webhook Endpoint

You have **3 fast deployment options**. Choose the one that fits your preference:

### Option A: Vercel (Recommended - 5 minutes)

**1. Install Vercel CLI:**

```bash
npm install -g vercel
```

**2. Create webhook API route:**

```bash
mkdir -p api/stripe
```

**3. Create `/api/stripe/webhooks.js`:**

```javascript
// api/stripe/webhooks.js
import { createServerlessWebhookHandler } from '../../src/backend/webhook-endpoint';

export default createServerlessWebhookHandler();

// Important: Disable body parsing for raw webhook data
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    // Disable default body parser to handle raw request
    externalResolver: true,
  },
};
```

**4. Deploy:**

```bash
vercel --prod
```

**5. Your webhook URL will be:**

```
https://your-app.vercel.app/api/stripe/webhooks
```

---

### Option B: Netlify (Alternative - 7 minutes)

**1. Create `netlify/functions/stripe-webhooks.js`:**

```javascript
// netlify/functions/stripe-webhooks.js
const { createServerlessWebhookHandler } = require('../../src/backend/webhook-endpoint');

exports.handler = createServerlessWebhookHandler();
```

**2. Deploy to Netlify:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**3. Your webhook URL:**

```
https://your-app.netlify.app/.netlify/functions/stripe-webhooks
```

---

### Option C: Railway (Full Backend - 10 minutes)

**1. Create `server.js`:**

```javascript
// server.js
import express from 'express';
import { createExpressWebhookHandler } from './src/backend/webhook-endpoint.js';

const app = express();
const port = process.env.PORT || 3000;

// Raw body parser for webhooks
app.use('/api/stripe/webhooks', express.raw({ type: 'application/json' }));

// Webhook endpoint
app.post('/api/stripe/webhooks', createExpressWebhookHandler());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Webhook server running on port ${port}`);
});
```

**2. Deploy to Railway:**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

**3. Your webhook URL:**

```
https://your-app.railway.app/api/stripe/webhooks
```

---

## ⚙️ Step 2: Set Environment Variables

**For any deployment platform, set these variables:**

```bash
STRIPE_SECRET_KEY=sk_live_...     # Your Stripe Live secret key
STRIPE_WEBHOOK_SECRET=whsec_...   # From Stripe webhook config (get this next)
SUPABASE_URL=https://...          # Your Supabase project URL
SUPABASE_SERVICE_KEY=eyJhb...     # Supabase service role key
```

**Platform-specific setup:**

**Vercel:**

```bash
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
# ... add all variables
```

**Netlify:**

- Go to Site Settings → Environment Variables
- Add each variable

**Railway:**

```bash
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
# ... set all variables
```

---

## 🔌 Step 3: Configure Stripe Webhooks

**1. Go to Stripe Dashboard:**

- Visit [dashboard.stripe.com](https://dashboard.stripe.com)
- **Switch to Live Mode** (important!)
- Navigate to **Developers → Webhooks**

**2. Create Webhook Endpoint:**

- Click **"Add endpoint"**
- **Endpoint URL:** `https://your-deployed-app.com/api/stripe/webhooks`
- **Events to send:** Select these critical ones:
  ```
  customer.subscription.created
  customer.subscription.updated
  customer.subscription.deleted
  invoice.payment_succeeded
  invoice.payment_failed
  customer.subscription.trial_will_end
  ```

**3. Get Webhook Signing Secret:**

- After creating, click on your webhook
- In "Signing secret" section, click **"Reveal"**
- Copy the secret (starts with `whsec_...`)
- **Add this to your environment variables** as `STRIPE_WEBHOOK_SECRET`

**4. Re-deploy with the secret:**

```bash
# Update your deployment with the webhook secret
vercel --prod  # or netlify deploy --prod, or railway up
```

---

## 🧪 Step 4: Test Your Setup

**1. Send Test Webhook from Stripe:**

- In your webhook settings, click **"Send test webhook"**
- Choose **"customer.subscription.created"**
- Click **"Send test webhook"**

**2. Check Response:**

- ✅ **Status should be:** 200 OK
- ✅ **Response time:** Under 5 seconds
- ⏱️ **Response body:** `{"success": true, "message": "Webhook processed successfully"}`

**3. Check Your Logs:**

**Vercel:**

```bash
vercel logs --follow
```

**Netlify:**

- Functions tab in dashboard

**Railway:**

```bash
railway logs
```

**4. Look for:**

```
✅ "Processing Stripe webhook: customer.subscription.created"
✅ "Webhook signature verified"
✅ "Successfully processed webhook..."
```

---

## 🔍 Step 5: Production Testing

**1. Test Real Payment Flow:**

- Use your production app
- Create a subscription with test card: `4242 4242 4242 4242`
- **Verify sequence:**
  1. Payment processes in Stripe ✅
  2. Webhook delivered to your endpoint ✅
  3. Subscription stored in database ✅
  4. User gets premium access ✅

**2. Monitor Webhook Health:**

- **Stripe Dashboard:** Check Recent deliveries tab
- **Your Database:** Verify webhook_logs table has entries
- **Analytics:** Check webhook processing metrics

---

## 🚨 Troubleshooting

### Webhook Signature Verification Failed

```bash
# Check environment variable is set correctly
echo $STRIPE_WEBHOOK_SECRET

# Should start with: whsec_...
# If not, re-add the environment variable and redeploy
```

### Database Connection Issues

```bash
# Verify Supabase credentials
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# Test connection from your deployed app
```

### 500 Internal Server Error

```bash
# Check deployment logs for detailed error messages
# Common issues:
# - Missing environment variables
# - Database connection timeout
# - Malformed webhook handler setup
```

### Webhook Delivery Failures

- **Check endpoint URL** is publicly accessible
- **Verify HTTPS** (required for production webhooks)
- **Test manually:** `curl -X POST https://your-app.com/api/stripe/webhooks`

---

## ✅ Success Checklist

Your production webhooks are working when:

- [ ] **Stripe Dashboard shows:** 100% delivery success, <2s response time
- [ ] **Database shows:** New entries in subscriptions, webhook_logs tables
- [ ] **App shows:** Users get immediate access after payment
- [ ] **Logs show:** No webhook processing errors
- [ ] **Test payments work:** End-to-end subscription flow works

---

## 🎉 You're Done!

Your Stripe webhooks are now:

- ✅ **Deployed and accessible**
- ✅ **Securely configured**
- ✅ **Processing payments in real-time**
- ✅ **Production-ready**

Your users can now subscribe and get instant access to premium features!

---

## 📞 Need Help?

If you run into issues:

1. **Check the webhook guide:** `STRIPE_WEBHOOK_PRODUCTION_GUIDE.md`
2. **Review logs** for detailed error messages
3. **Test the connection** manually with curl
4. **Verify environment variables** are set correctly

Remember: Webhook processing should complete in **under 2 seconds** for optimal reliability.
