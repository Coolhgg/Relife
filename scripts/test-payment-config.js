#!/usr/bin/env node

// Test script to verify Stripe configuration
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

console.log('🧪 Testing Payment Configuration...');

// Load environment variables
config();

// Test 1: Check environment variables
console.log('1. Environment Variables:');
const requiredVars = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

let envIssues = 0;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value
    ? varName.includes('SECRET') || varName.includes('KEY')
      ? `${value.substring(0, 12)}...`
      : value
    : 'NOT SET';

  console.log(`   ${status} ${varName}: ${displayValue}`);
  if (!value) envIssues++;
});

console.log(`
   Summary: ${requiredVars.length - envIssues}/${requiredVars.length} variables configured`);

// Test 2: Check configuration files
console.log('2. Configuration Files:');
const configFiles = [
  'src/config/environment.ts',
  'src/config/stripe.ts',
  '.env',
  '.env.example',
  'server/api.ts',
  'server/webhook-handler.ts',
];

configFiles.forEach(filePath => {
  const exists = fs.existsSync(path.join(process.cwd(), filePath));
  const status = exists ? '✅' : '❌';
  console.log(`   ${status} ${filePath}`);
});

// Test 3: Check package.json dependencies
console.log('\n3. Dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['@stripe/stripe-js', 'stripe', 'cors', 'express'];

  requiredDeps.forEach(dep => {
    const installed =
      packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    const status = installed ? '✅' : '❌';
    console.log(`   ${status} ${dep}${installed ? ` (${installed})` : ''}`);
  });
} catch (error) {
  console.log('   ❌ Error reading package.json');
}

// Test 4: Test Stripe connection (if keys are provided)
console.log('\n4. Stripe Connection Test:');
if (process.env.STRIPE_SECRET_KEY) {
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    // Simple API call to test connection
    const account = await stripe.accounts.retrieve();
    console.log(
      `   ✅ Connected to Stripe account: ${account.display_name || account.id}`
    );
    console.log(`   📧 Account email: ${account.email || 'Not provided'}`);
    console.log(`   🌍 Country: ${account.country}`);
    console.log(`   💰 Default currency: ${account.default_currency?.toUpperCase()}`);
  } catch (error) {
    console.log(`   ❌ Stripe connection failed: ${error.message}`);
  }
} else {
  console.log('   ⏭️  Skipped (no STRIPE_SECRET_KEY provided)');
}

// Test 5: Validate Stripe publishable key format
console.log('5. Key Validation:');
const pubKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
const secKey = process.env.STRIPE_SECRET_KEY;

if (pubKey) {
  const validPubKey = pubKey.startsWith('pk_');
  console.log(
    `   ${validPubKey ? '✅' : '❌'} Publishable key format: ${validPubKey ? 'Valid' : 'Invalid (should start with pk_)'}`
  );
} else {
  console.log('   ⏭️  Publishable key not provided');
}

if (secKey) {
  const validSecKey = secKey.startsWith('sk_');
  console.log(
    `   ${validSecKey ? '✅' : '❌'} Secret key format: ${validSecKey ? 'Valid' : 'Invalid (should start with sk_)'}`
  );

  const isTestKey = secKey.includes('_test_');
  console.log(
    `   ${isTestKey ? '🧪' : '🔴'} Environment: ${isTestKey ? 'Test mode' : 'Live mode'}`
  );
} else {
  console.log('   ⏭️  Secret key not provided');
}

console.log('\n' + '='.repeat(50));
console.log('📋 CONFIGURATION SUMMARY');
console.log('='.repeat(50));

if (envIssues === 0) {
  console.log('🎉 All environment variables are configured!');
} else {
  console.log(`⚠️  ${envIssues} environment variables need attention`);
}

console.log('Next Steps:');
console.log(
  '1. Update your .env file with real Stripe keys from https://dashboard.stripe.com/apikeys'
);
console.log('2. Start the API server: npm run api:dev');
console.log('3. Start the frontend: npm run dev');
console.log('4. Test the payment flow in your browser');
console.log('5. Set up webhook endpoint in Stripe dashboard');

console.log('Pro Tips:');
console.log('- Use test keys (pk_test_/sk_test_) for development');
console.log('- Set up webhook endpoint: https://yourdomain.com/api/stripe/webhooks');
console.log('- Enable events: customer.subscription.*, invoice.payment_*');
console.log(
  '- Test webhooks with Stripe CLI: stripe listen --forward-to localhost:3001/api/stripe/webhooks'
);
