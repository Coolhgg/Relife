/**
 * Mock Service Worker (MSW) handlers for API mocking in tests
 * Provides realistic API mocking for comprehensive hook testing
 */

import { http, HttpResponse } from "msw";

// Base URLs for different services
const SUPABASE_URL = "https://test-supabase-url.supabase.co";
const STRIPE_URL = "https://api.stripe.com";
const ANALYTICS_URL = "https://analytics-test.com";

export const handlers = [
  // Supabase Auth Handlers
  http.post(
    `${SUPABASE_URL}/auth/v1/token`,
    ({ request }: { request: Request }) => {
      return HttpResponse.json({
        access_token: "mock_access_token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock_refresh_token",
        user: {
          id: "test-user-123",
          email: "test@example.com",
          role: "authenticated",
          created_at: new Date().toISOString(),
        },
      });
    },
  ),

  http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
    return HttpResponse.json({}, { status: 200 });
  }),

  http.post(`${SUPABASE_URL}/auth/v1/signup`, () => {
    return HttpResponse.json({
      user: {
        id: "test-user-123",
        email: "test@example.com",
        email_confirmed_at: null,
        role: "authenticated",
        created_at: new Date().toISOString(),
      },
    });
  }),

  http.post(`${SUPABASE_URL}/auth/v1/recover`, () => {
    return HttpResponse.json({
      message: "Password recovery email sent",
    });
  }),

  // Supabase Database Handlers
  http.get(`${SUPABASE_URL}/rest/v1/users`, () => {
    return HttpResponse.json([
      {
        id: "test-user-123",
        email: "test@example.com",
        name: "Test User",
        preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/users`, () => {
    return HttpResponse.json(
      {
        id: "test-user-123",
        email: "test@example.com",
        name: "Test User",
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/users`, () => {
    return HttpResponse.json({
      id: "test-user-123",
      name: "Updated Test User",
      updated_at: new Date().toISOString(),
    });
  }),

  // Alarms CRUD
  http.get(`${SUPABASE_URL}/rest/v1/alarms`, () => {
    return HttpResponse.json([
      {
        id: "test-alarm-123",
        user_id: "test-user-123",
        time: "07:00",
        label: "Test Alarm",
        is_active: true,
        days: [1, 2, 3, 4, 5],
        voice_mood: "motivational",
        sound: "default-alarm.mp3",
        difficulty: "medium",
        snooze_enabled: true,
        snooze_interval: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/alarms`, () => {
    return HttpResponse.json(
      {
        id: "test-alarm-456",
        user_id: "test-user-123",
        time: "08:00",
        label: "New Test Alarm",
        is_active: true,
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/alarms`, () => {
    return HttpResponse.json({
      id: "test-alarm-123",
      label: "Updated Alarm",
      updated_at: new Date().toISOString(),
    });
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/alarms`, () => {
    return HttpResponse.json({}, { status: 204 });
  }),

  // Stripe Subscription Handlers
  http.get(`${STRIPE_URL}/v1/subscriptions`, () => {
    return HttpResponse.json({
      object: "list",
      data: [
        {
          id: "sub_test123",
          object: "subscription",
          status: "active",
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          plan: {
            id: "plan_premium",
            amount: 999,
            currency: "usd",
            interval: "month",
          },
          customer: "cus_test123",
        },
      ],
    });
  }),

  http.post(`${STRIPE_URL}/v1/subscriptions`, () => {
    return HttpResponse.json({
      id: "sub_test456",
      object: "subscription",
      status: "active",
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    });
  }),

  http.delete(`${STRIPE_URL}/v1/subscriptions/:id`, () => {
    return HttpResponse.json({
      id: "sub_test123",
      object: "subscription",
      status: "canceled",
      canceled_at: Math.floor(Date.now() / 1000),
    });
  }),

  // Payment Methods
  http.get(`${STRIPE_URL}/v1/payment_methods`, () => {
    return HttpResponse.json({
      object: "list",
      data: [
        {
          id: "pm_test123",
          object: "payment_method",
          type: "card",
          card: {
            brand: "visa",
            last4: "4242",
            exp_month: 12,
            exp_year: 2025,
          },
        },
      ],
    });
  }),

  http.post(`${STRIPE_URL}/v1/payment_methods`, () => {
    return HttpResponse.json({
      id: "pm_test456",
      object: "payment_method",
      type: "card",
      card: {
        brand: "mastercard",
        last4: "5555",
        exp_month: 10,
        exp_year: 2026,
      },
    });
  }),

  // Analytics Handlers (PostHog, etc.)
  http.post(`${ANALYTICS_URL}/capture/`, () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  http.post(`${ANALYTICS_URL}/identify/`, () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  http.post(`${ANALYTICS_URL}/batch/`, () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // Theme/Cloud Sync Handlers
  http.get(`${SUPABASE_URL}/rest/v1/themes`, () => {
    return HttpResponse.json([
      {
        id: "theme-123",
        user_id: "test-user-123",
        name: "Custom Dark",
        config: {
          theme: "dark",
          personalization: {
            colorPreferences: {
              accentColor: "#ff0000",
            },
          },
        },
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/themes`, () => {
    return HttpResponse.json({
      id: "theme-456",
      user_id: "test-user-123",
      name: "New Custom Theme",
      created_at: new Date().toISOString(),
    });
  }),

  // PWA/Service Worker Handlers
  http.get("/api/pwa/manifest", () => {
    return HttpResponse.json({
      name: "Relife Alarm",
      short_name: "Relife",
      start_url: "/",
      display: "standalone",
      theme_color: "#000000",
    });
  }),

  http.post("/api/pwa/subscribe", () => {
    return HttpResponse.json({
      success: true,
      subscriptionId: "sub_pwa_123",
    });
  }),

  // Geolocation mock (for location-based alarms)
  http.get("/api/location/geocode", ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");

    return HttpResponse.json({
      address: "123 Test Street, Test City",
      latitude: parseFloat(lat || "0"),
      longitude: parseFloat(lng || "0"),
    });
  }),

  // Sound/Audio file handlers
  http.get("/sounds/*", () => {
    // Return a mock audio response
    const audioBuffer = new ArrayBuffer(1024);
    return HttpResponse.arrayBuffer(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": "1024",
      },
    });
  }),

  // Error scenarios for testing error handling
  http.get("/api/error/500", () => {
    return HttpResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }),

  http.get("/api/error/401", () => {
    return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
  }),

  http.get("/api/error/429", () => {
    return HttpResponse.json({ error: "Rate Limited" }, { status: 429 });
  }),

  // Network timeout simulation
  http.get("/api/slow", async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return HttpResponse.json({ message: "slow response" });
  }),
];

// Handlers for specific test scenarios
export const errorHandlers = [
  // Override successful handlers with error responses for error testing
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),

  http.post(`${STRIPE_URL}/v1/subscriptions`, () => {
    return HttpResponse.json(
      { error: { message: "Payment failed" } },
      { status: 402 },
    );
  }),
];

export const slowHandlers = [
  // Override handlers with slow responses for timeout testing
  http.post(`${SUPABASE_URL}/auth/v1/token`, async () => {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    return HttpResponse.json({ access_token: "slow_token" });
  }),
];
