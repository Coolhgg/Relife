// Express Server for Webhook Deployment
// Use this for Railway, Heroku, or any platform that supports Express

import express from 'express';
import cors from 'cors';
import {
  createExpressWebhookHandler,
  handleHealthCheck,
} from './src/backend/webhook-endpoint.js';

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'stripe-signature'],
  })
);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthResponse = await handleHealthCheck();
    res.status(healthResponse.statusCode);
    Object.entries(healthResponse.headers).forEach(([key, value]) => {
      res.set(key, value);
    });
    res.send(healthResponse.body);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Raw body parser for Stripe webhooks (must be before JSON parser)
app.use(
  '/api/stripe/webhooks',
  express.raw({
    type: 'application/json',
    limit: '1mb',
  })
);

// Stripe webhook endpoint
app.post('/api/stripe/webhooks', createExpressWebhookHandler());

// General JSON parser for other routes
app.use(express.json({ limit: '10mb' }));

// Basic info endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Relife Webhook Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhooks: '/api/stripe/webhooks',
      health: '/health',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Relife Webhook Server running on port ${port}`);
  console.log(`📡 Webhook endpoint: http://localhost:${port}/api/stripe/webhooks`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
