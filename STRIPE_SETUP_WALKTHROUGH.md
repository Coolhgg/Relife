# 💳 Stripe Setup Guide for Relife - Step by Step

Let me walk you through setting up Stripe for subscription billing in your Relife Smart Alarm app.

## 🎯 What We'll Set Up

Your Relife app already has a complete payment system built in. We just need to connect it to your
Stripe account:

- **Subscription Plans**: Free, Basic ($4.99), Premium ($9.99), Pro ($19.99)
- **Payment Processing**: Credit cards, bank accounts, Apple Pay, Google Pay
- **Billing Management**: Automatic invoicing, proration, cancellation handling
- **Webhooks**: Real-time subscription updates

---

## 📋 Step 1: Create Your Stripe Account

### 1.1 Sign Up for Stripe

1. Go to [stripe.com](https://stripe.com) and click "Start now"
2. Create your account with business information
3. Complete identity verification (may take a few minutes)

### 1.2 Access Your Dashboard

1. Log into [dashboard.stripe.com](https://dashboard.stripe.com)
2. You'll start in **Test Mode** (perfect for setup)
3. Note the toggle in the left sidebar - we'll use test mode first

---

## 🔑 Step 2: Get Your API Keys

### 2.1 Find Your Keys

1. In Stripe Dashboard, go to **Developers** → **API Keys**
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`) - Safe to use in frontend
   - **Secret key** (starts with `sk_test_...`) - Keep this secure!

### 2.2 Copy Your Keys

```bash
# Example keys (yours will be different)
Publishable key: pk_test_51234567890abcdefghijklmnop...
Secret key: sk_test_51234567890abcdefghijklmnop...
```

**⚠️ Important**: Never share your secret key publicly!

---

## ⚙️ Step 3: Configure Your Relife App

### 3.1 Update Environment Variables

Open your `.env.local` file and add your Stripe keys:

```env
# Stripe Payment Configuration
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_your_actual_publishable_key_here"
STRIPE_SECRET_KEY="sk_test_your_actual_secret_key_here"
VITE_STRIPE_ENABLED=true

# Payment Settings
VITE_PAYMENT_CURRENCY=usd
VITE_PAYMENT_SUCCESS_URL=/payment/success
VITE_PAYMENT_CANCEL_URL=/payment/cancel
```

### 3.2 Verify Configuration

Run the configuration validator:

```bash
# Check if Stripe is configured correctly
node configure-integrations.js --validate-only

# Or test payment config specifically
node scripts/test-payment-config.js
```

---

## 🌐 Step 4: Set Up Webhooks (Critical for Production)

Webhooks allow Stripe to notify your app about payment events in real-time.

### 4.1 Create Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Set endpoint URL: `https://your-domain.com/api/stripe/webhooks`
   - For local testing: `https://yourlocalhost.ngrok.io/api/stripe/webhooks`

### 4.2 Select Events

Choose these essential events:

- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `customer.subscription.trial_will_end`

### 4.3 Get Webhook Secret

1. Click on your webhook endpoint
2. Copy the **"Signing secret"** (starts with `whsec_...`)
3. Add it to your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
```

---

## 🚀 Step 5: Start Your Servers

### 5.1 Terminal 1: Start API Server

```bash
# Start the backend API server
npm run api:dev

# You should see:
# "Server running on http://localhost:3001"
# "Stripe webhook endpoint: /api/stripe/webhooks"
```

### 5.2 Terminal 2: Start Frontend

```bash
# Start the React frontend
npm run dev

# You should see:
# "Local: http://localhost:5173"
```

---

## 🧪 Step 6: Test Your Payment System

### 6.1 Quick Test

1. Open your app: `http://localhost:5173`
2. Navigate to the pricing/subscription page
3. Click on any paid plan (Basic, Premium, or Pro)

### 6.2 Use Test Cards

Stripe provides test cards that simulate different scenarios:

**✅ Successful Payment:**

```
Card: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**❌ Declined Payment:**

```
Card: 4000 0000 0000 0002
(Same expiry, CVC, ZIP as above)
```

**🔐 Authentication Required:**

```
Card: 4000 0025 0000 3155
(Simulates 3D Secure authentication)
```

### 6.3 Verify Success

After a successful test payment:

1. Check your Stripe Dashboard → **Payments** (you'll see the test payment)
2. Check your app's database (subscription should be created)
3. User should see premium features unlocked

---

## ✅ Step 7: Validate Everything Works

### 7.1 Run Test Suite

```bash
# Test payment configuration
node scripts/test-payment-config.js

# Run full integration tests
npm run test:integration

# Test webhook functionality
npm run test:payment
```

### 7.2 Check Logs

Monitor your API server logs for successful webhook processing:

```bash
# You should see logs like:
# "Webhook received: customer.subscription.created"
# "Subscription created for user: user_12345"
```

---

## 🎯 Your Subscription Plans

Your Relife app comes with these pre-configured plans:

| Plan        | Price        | Features                        | Stripe Price ID         |
| ----------- | ------------ | ------------------------------- | ----------------------- |
| **Free**    | $0           | 3 alarms, basic sounds          | N/A                     |
| **Basic**   | $4.99/month  | Unlimited alarms, custom sounds | `price_basic_monthly`   |
| **Premium** | $9.99/month  | Smart features, analytics       | `price_premium_monthly` |
| **Pro**     | $19.99/month | AI coach, advanced features     | `price_pro_monthly`     |

### Create Products in Stripe (Optional)

If you want to customize pricing:

1. Go to **Products** in Stripe Dashboard
2. Click **"Add product"**
3. Create products for Basic, Premium, and Pro plans
4. Copy the price IDs and update your app configuration

---

## 🔧 Troubleshooting

### "Invalid API key provided"

- ✅ Check your `.env.local` file has the correct keys
- ✅ Make sure you're using test keys (start with `pk_test_` and `sk_test_`)
- ✅ Restart your servers after updating environment variables

### "Webhook signature verification failed"

- ✅ Check `STRIPE_WEBHOOK_SECRET` matches your Stripe dashboard
- ✅ Ensure webhook endpoint URL is correct
- ✅ For local testing, use ngrok or similar tunneling service

### "Customer not found"

- ✅ Check your Supabase database connection
- ✅ Ensure user authentication is working
- ✅ Verify customer creation in your API logs

### "Payment method required"

- ✅ Use valid test card numbers from Stripe docs
- ✅ Check that payment method is attached to customer
- ✅ Verify checkout session configuration

---

## 🚀 Next Steps

### For Development

1. ✅ Test all subscription plans
2. ✅ Test payment failures and retries
3. ✅ Test subscription cancellation flow
4. ✅ Verify feature access controls work

### For Production

1. 🔄 Switch to live Stripe keys (`pk_live_...` and `sk_live_...`)
2. 🔄 Update webhook endpoint to production domain
3. 🔄 Test with real payment methods
4. 🔄 Set up monitoring and alerts

---

## 💡 Pro Tips

### Security Best Practices

- Never expose secret keys in frontend code
- Use HTTPS for all webhook endpoints
- Verify webhook signatures to prevent spoofing
- Log all payment events for auditing

### User Experience

- Provide clear pricing information
- Handle payment errors gracefully
- Send confirmation emails for successful payments
- Offer easy cancellation and refund options

### Monitoring

- Set up alerts for failed payments
- Monitor subscription churn rates
- Track conversion from free to paid plans
- Analyze revenue metrics in Stripe Dashboard

---

## 🎉 Success!

Once you complete these steps, your Relife Smart Alarm app will have:

✅ **Complete payment processing** with Stripe ✅ **Subscription billing** with automatic renewals
✅ **Webhook integration** for real-time updates ✅ **Feature gating** based on subscription tiers
✅ **Professional checkout** experience ✅ **Comprehensive error handling**

Your users can now subscribe to premium features and you'll start generating revenue! 🚀

---

**Need help?** Check the comprehensive `PAYMENT_SETUP_GUIDE.md` in your project for more detailed
information, or run the interactive configuration wizard: `node configure-integrations.js`
