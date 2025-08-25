#!/usr/bin/env node
// Webhook Setup Testing Script
// Run with: node test-webhook-setup.js

import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config();

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000';

async function testHealthCheck() {
  console.log('🏥 Testing health check endpoint...');
  
  try {
    const response = await fetch(`${WEBHOOK_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Health check passed');
      console.log('📊 Response:', data);
      return true;
    } else {
      console.log('❌ Health check failed:', response.status);
      console.log('📊 Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

async function testWebhookEndpoint() {
  console.log('📡 Testing webhook endpoint accessibility...');
  
  try {
    // This should fail with 400 (missing signature) but confirms endpoint exists
    const response = await fetch(`${WEBHOOK_URL}/api/stripe/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'connectivity' })
    });
    
    const text = await response.text();
    
    if (response.status === 400) {
      console.log('✅ Webhook endpoint is accessible');
      console.log('📊 Expected 400 error (missing signature):', text);
      return true;
    } else {
      console.log('⚠️  Unexpected response status:', response.status);
      console.log('📊 Response:', text);
      return false;
    }
  } catch (error) {
    console.log('❌ Webhook endpoint test error:', error.message);
    return false;
  }
}

async function testEnvironmentVariables() {
  console.log('⚙️  Testing environment variables...');
  
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY'
  ];
  
  let allSet = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value === 'PLACEHOLDER_GET_FROM_STRIPE_DASHBOARD') {
      console.log(`❌ Missing or placeholder: ${varName}`);
      allSet = false;
    } else {
      const maskedValue = value.substring(0, 8) + '...';
      console.log(`✅ Set: ${varName} = ${maskedValue}`);
    }
  });
  
  return allSet;
}

async function testDatabaseConnection() {
  console.log('🗄️  Testing database connection...');
  
  try {
    // Import Supabase client
    const { supabase } = await import('./src/services/supabase.js');
    
    // Test simple query
    const { data, error } = await supabase
      .from('webhook_logs')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Database connection error:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.log('❌ Database test error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Relife Webhook Setup Testing');
  console.log('================================\n');
  
  if (!WEBHOOK_URL.includes('localhost')) {
    console.log(`🌐 Testing production URL: ${WEBHOOK_URL}`);
  } else {
    console.log(`🏠 Testing local development: ${WEBHOOK_URL}`);
  }
  console.log('');
  
  const results = {
    health: await testHealthCheck(),
    webhook: await testWebhookEndpoint(),
    env: await testEnvironmentVariables(),
    database: await testDatabaseConnection()
  };
  
  console.log('\n📊 TEST RESULTS:');
  console.log('================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const emoji = passed ? '✅' : '❌';
    console.log(`${emoji} ${test.toUpperCase()}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Your webhook setup is ready for production.');
    console.log('\n📋 Next steps:');
    console.log('1. Create webhook in Stripe Dashboard');
    console.log('2. Update STRIPE_WEBHOOK_SECRET environment variable');
    console.log('3. Test with real Stripe webhook events');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('Please fix the failing tests before deploying to production.');
    console.log('\n📖 See WEBHOOK_DEPLOYMENT_QUICKSTART.md for troubleshooting');
  }
}

// Handle command line usage
if (process.argv[2]) {
  process.env.WEBHOOK_URL = process.argv[2];
}

main().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});

// Export for programmatic use
export { testHealthCheck, testWebhookEndpoint, testEnvironmentVariables, testDatabaseConnection };