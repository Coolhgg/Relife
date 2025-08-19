// Express API Server for Stripe Integration
import express from "express";
import cors from "cors";
import { config } from "dotenv";
import WebhookProcessor from "./webhook-handler";
import strugglingSamRouter from "./struggling-sam-api";

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Raw body parser for webhooks (must come before express.json())
app.use("/api/stripe/webhooks", express.raw({ type: "application/json" }));

// JSON body parser for other routes
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "relife-api-server",
    version: "1.0.0",
  });
});

// Stripe configuration validation
const validateStripeConfig = () => {
  const config = {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseKey:
      process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  };

  const errors: string[] = [];

  if (!config.stripeSecretKey) {
    errors.push("STRIPE_SECRET_KEY is required");
  }
  if (!config.stripeWebhookSecret) {
    errors.push("STRIPE_WEBHOOK_SECRET is required");
  }
  if (!config.supabaseUrl) {
    errors.push("VITE_SUPABASE_URL is required");
  }
  if (!config.supabaseKey) {
    errors.push("SUPABASE_SERVICE_KEY or VITE_SUPABASE_ANON_KEY is required");
  }

  return { config, errors, isValid: errors.length === 0 };
};

// Stripe Plans endpoint
app.get("/api/stripe/plans", (req, res) => {
  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      currency: "usd",
      interval: "month",
      features: [
        "Basic alarm functionality",
        "Up to 3 alarms",
        "Standard wake-up sounds",
        "Basic statistics",
      ],
      limits: {
        maxAlarms: 3,
        maxCustomSounds: 0,
        aiInsightsPerDay: 3,
        battlesPerDay: 5,
      },
    },
    {
      id: "basic",
      name: "Basic",
      price: 499,
      currency: "usd",
      interval: "month",
      stripePriceId: "price_basic_monthly",
      features: [
        "Unlimited alarms",
        "Custom sound uploads (up to 50MB)",
        "Voice-controlled snooze",
        "Social features (team joining)",
        "Email support",
      ],
      limits: {
        maxAlarms: null,
        maxCustomSounds: 10,
        aiInsightsPerDay: 20,
        battlesPerDay: 50,
      },
    },
    {
      id: "premium",
      name: "Premium",
      price: 999,
      currency: "usd",
      interval: "month",
      stripePriceId: "price_premium_monthly",
      popular: true,
      features: [
        "All Basic features",
        "Smart wake-up optimization",
        "Advanced scheduling patterns",
        "Voice command recognition",
        "Premium analytics dashboard",
        "Team creation and management",
        "Location-based alarms",
        "Priority support",
      ],
      limits: {
        maxAlarms: null,
        maxCustomSounds: 50,
        aiInsightsPerDay: 100,
        battlesPerDay: null,
        elevenlabsCallsPerMonth: 100,
      },
    },
    {
      id: "pro",
      name: "Pro",
      price: 1999,
      currency: "usd",
      interval: "month",
      stripePriceId: "price_pro_monthly",
      features: [
        "All Premium features",
        "AI wake-up coach",
        "Enhanced battle modes with tournaments",
        "Advanced voice features",
        "Custom challenge creation",
        "Detailed reporting and exports",
        "White-label options",
        "Dedicated support",
      ],
      limits: {
        maxAlarms: null,
        maxCustomSounds: null,
        aiInsightsPerDay: null,
        battlesPerDay: null,
        elevenlabsCallsPerMonth: 500,
        voiceCloning: true,
      },
    },
  ];

  res.json({ plans });
});

// Stripe Customer creation
app.post("/api/stripe/customers", async (req, res) => {
  const { userId, email, name, metadata } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: "UserId and email are required" });
  }

  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
        ...metadata,
      },
    });

    // Here you would update your database with the customer ID
    // For now, just return the customer ID
    res.json({ customerId: customer.id });
  } catch (error) {
    console.error("Failed to create customer:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// Payment Intent creation
app.post("/api/stripe/payment-intents", async (req, res) => {
  const { amount, currency = "usd", customerId, metadata } = req.body;

  if (!amount || amount < 50) {
    // Minimum amount in cents
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      id: paymentIntent.id,
    });
  } catch (error) {
    console.error("Failed to create payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

// Subscription creation
app.post("/api/stripe/subscriptions", async (req, res) => {
  const { customerId, priceId, paymentMethodId, trialDays, metadata } =
    req.body;

  if (!customerId || !priceId) {
    return res
      .status(400)
      .json({ error: "CustomerId and priceId are required" });
  }

  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    const subscriptionData: any = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata,
    };

    if (paymentMethodId) {
      subscriptionData.default_payment_method = paymentMethodId;
    }

    if (trialDays && trialDays > 0) {
      subscriptionData.trial_period_days = trialDays;
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);

    res.json({
      subscription,
      client_secret: subscription.latest_invoice?.payment_intent?.client_secret,
      requires_action:
        subscription.latest_invoice?.payment_intent?.status ===
        "requires_action",
    });
  } catch (error) {
    console.error("Failed to create subscription:", error);

    let errorMessage = "Failed to create subscription";
    let errorCode = "subscription_creation_failed";

    if (error && typeof error === "object" && "message" in error) {
      errorMessage = (error as any).message;
      errorCode = (error as any).code || errorCode;
    }

    res.status(400).json({
      error: {
        code: errorCode,
        message: errorMessage,
        retryable: false,
        userFriendlyMessage:
          "Unable to create subscription. Please check your payment method and try again.",
      },
    });
  }
});

// Webhook endpoint (placeholder - you'll need to implement webhook processing)
app.post("/api/stripe/webhooks", (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  // TODO: Implement webhook processing using the existing webhook-endpoint.ts
  console.log("Webhook received:", req.body);
  res.json({ received: true });
});

// Configuration check endpoint
app.get("/api/config/check", (req, res) => {
  const validation = validateStripeConfig();

  res.json({
    isConfigured: validation.isValid,
    errors: validation.errors,
    checks: {
      stripeConfigured: !!validation.config.stripeSecretKey,
      webhookConfigured: !!validation.config.stripeWebhookSecret,
      databaseConfigured:
        !!validation.config.supabaseUrl && !!validation.config.supabaseKey,
    },
  });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
    });
  },
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`🚀 Relife API Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`💳 Stripe endpoints: http://localhost:${port}/api/stripe/*`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);

  // Validate configuration
  const validation = validateStripeConfig();
  if (!validation.isValid) {
    console.warn("⚠️  Configuration issues found:");
    validation.errors.forEach((error) => console.warn(`   - ${error}`));
    console.warn("💡 Check your .env file and update the missing variables");
  } else {
    console.log("✅ All configuration checks passed");
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export default app;
