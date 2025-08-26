#!/usr/bin/env node
// Production Environment Setup Script for Webhook Deployment
// Run with: node setup-production-env.js

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('🚀 Relife Webhook Production Environment Setup');
  console.log('==============================================\n');

  const envVars = {};

  // Essential webhook environment variables
  console.log('📡 STRIPE CONFIGURATION:');
  envVars.STRIPE_SECRET_KEY = await ask(
    'Enter your Stripe Live Secret Key (sk_live_...): '
  );

  console.log(
    '\n⚠️  Note: STRIPE_WEBHOOK_SECRET will be set after creating the webhook in Stripe Dashboard'
  );
  envVars.STRIPE_WEBHOOK_SECRET = 'PLACEHOLDER_GET_FROM_STRIPE_DASHBOARD';

  console.log('\n🗄️  SUPABASE CONFIGURATION:');
  envVars.SUPABASE_URL = await ask(
    'Enter your Supabase URL (https://xxx.supabase.co): '
  );
  envVars.SUPABASE_SERVICE_KEY = await ask(
    'Enter your Supabase Service Key (eyJhb...): '
  );

  console.log('\n🌐 OPTIONAL CONFIGURATION:');
  envVars.NODE_ENV = 'production';
  envVars.PORT = '3000';

  const frontendUrl = await ask(
    'Enter your frontend URL (https://your-app.com) or press Enter to skip: '
  );
  if (frontendUrl.trim()) {
    envVars.FRONTEND_URL = frontendUrl.trim();
  }

  // Generate .env.production file
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');

  writeFileSync('.env.production', envContent);

  console.log('\n✅ Created .env.production file');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Deploy your webhook endpoint using the deployment guide');
  console.log('2. Create webhook in Stripe Dashboard with your deployed URL');
  console.log(
    '3. Get webhook signing secret from Stripe and update STRIPE_WEBHOOK_SECRET'
  );
  console.log('4. Re-deploy with updated environment variables');
  console.log('\n📖 See WEBHOOK_DEPLOYMENT_QUICKSTART.md for detailed instructions');

  // Platform-specific instructions
  console.log('\n🚀 DEPLOYMENT COMMANDS:');
  console.log('Vercel: vercel --prod');
  console.log('Netlify: netlify deploy --prod');
  console.log('Railway: railway up');

  rl.close();
}

main().catch(error => {
  console.error('Setup error:', error);
  rl.close();
  process.exit(1);
});
