#!/usr/bin/env node

/**
 * 🔔 Notification Environment Setup Script
 * Relife Smart Alarm - Interactive notification configuration
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  info: msg => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: msg => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: msg =>
    console.log(`\n${colors.bright}${colors.cyan}🔔 ${msg}${colors.reset}\n`),
};

// Helper function to ask questions
function ask(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

// Generate secure random keys
function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

async function setupNotifications() {
  log.header('Relife Smart Alarm - Notification Configuration Setup');

  console.log('This script will help you configure all notification features:\n');
  console.log('🌐 Web Push Notifications (VAPID)');
  console.log('📱 Mobile Push (Firebase/FCM)');
  console.log('📧 Email Campaigns (ConvertKit)');
  console.log('🔒 Security & Validation');
  console.log('🧠 Emotional AI Features');
  console.log('⏰ Smart Timing Settings\n');

  const config = {};

  // === WEB PUSH NOTIFICATIONS ===
  log.header('1. Web Push Notifications Setup');

  const setupVapid = await ask(
    'Would you like to generate VAPID keys for web push notifications? (y/n): '
  );

  if (setupVapid.toLowerCase() === 'y') {
    log.info('Generating VAPID keys...');

    // Check if web-push is available
    try {
      const webpush = require('web-push');
      const vapidKeys = webpush.generateVAPIDKeys();

      config.VITE_VAPID_PUBLIC_KEY = vapidKeys.publicKey;
      config.VAPID_PRIVATE_KEY = vapidKeys.privateKey;

      const vapidSubject = await ask('Enter VAPID subject (your email): ');
      config.VAPID_SUBJECT = `mailto:${vapidSubject}`;

      log.success('VAPID keys generated successfully!');
    } catch (error) {
      log.warning(
        'web-push package not found. Install it with: npm install -g web-push'
      );

      const publicKey = await ask(
        'Enter your VAPID public key (or press Enter to skip): '
      );
      const privateKey = await ask(
        'Enter your VAPID private key (or press Enter to skip): '
      );
      const subject = await ask('Enter VAPID subject email (or press Enter to skip): ');

      if (publicKey) config.VITE_VAPID_PUBLIC_KEY = publicKey;
      if (privateKey) config.VAPID_PRIVATE_KEY = privateKey;
      if (subject) config.VAPID_SUBJECT = `mailto:${subject}`;
    }
  }

  // === MOBILE PUSH NOTIFICATIONS ===
  log.header('2. Mobile Push Notifications (Firebase/FCM)');

  const setupFcm = await ask('Do you have Firebase/FCM credentials? (y/n): ');

  if (setupFcm.toLowerCase() === 'y') {
    config.FCM_SERVER_KEY = await ask('Enter FCM Server Key: ');
    config.FCM_SENDER_ID = await ask('Enter FCM Sender ID: ');

    const firebaseConfig = await ask(
      'Enter Firebase Config JSON (or press Enter to skip): '
    );
    if (firebaseConfig) {
      config.VITE_FIREBASE_CONFIG = firebaseConfig;
    }

    log.success('Firebase/FCM configuration saved!');
  } else {
    log.info('To set up Firebase later:');
    log.info('1. Go to https://console.firebase.google.com');
    log.info('2. Create/select project → Project Settings → Cloud Messaging');
    log.info('3. Copy Server Key and Sender ID');
  }

  // === EMAIL CAMPAIGNS ===
  log.header('3. Email Campaign Service (ConvertKit)');

  const setupEmail = await ask('Do you have ConvertKit API credentials? (y/n): ');

  if (setupEmail.toLowerCase() === 'y') {
    config.CONVERTKIT_API_KEY = await ask('Enter ConvertKit API Key: ');
    config.CONVERTKIT_API_SECRET = await ask('Enter ConvertKit API Secret: ');
    config.CONVERTKIT_WEBHOOK_SECRET = await ask(
      'Enter ConvertKit Webhook Secret (or press Enter to generate): '
    );

    if (!config.CONVERTKIT_WEBHOOK_SECRET) {
      config.CONVERTKIT_WEBHOOK_SECRET = generateSecureKey(16);
      log.info(`Generated webhook secret: ${config.CONVERTKIT_WEBHOOK_SECRET}`);
    }

    log.success('ConvertKit configuration saved!');
  } else {
    log.info('To set up ConvertKit later:');
    log.info('1. Go to https://app.convertkit.com');
    log.info('2. Settings → Advanced → API Keys');
    log.info('3. Copy API Key and Secret');
  }

  // === SECURITY CONFIGURATION ===
  log.header('4. Security & Validation Keys');

  log.info('Generating security keys for notification validation...');

  config.NOTIFICATION_SIGNING_KEY = generateSecureKey(32);
  config.NOTIFICATION_ENCRYPTION_KEY = generateSecureKey(32);
  config.RATE_LIMIT_MAX_REQUESTS = '100';
  config.RATE_LIMIT_WINDOW_MINUTES = '15';

  log.success('Security keys generated!');

  // === SMART FEATURES ===
  log.header('5. Smart Features Configuration');

  const quietStart = (await ask('Quiet hours start time (default 22:00): ')) || '22:00';
  const quietEnd = (await ask('Quiet hours end time (default 07:00): ')) || '07:00';

  config.SMART_TIMING_ENABLED = 'true';
  config.QUIET_HOURS_START = quietStart;
  config.QUIET_HOURS_END = quietEnd;
  config.BATTERY_OPTIMIZATION = 'true';
  config.LOCATION_AWARENESS = 'true';

  // === EMOTIONAL AI ===
  log.header('6. Emotional Intelligence AI');

  const enableAI = await ask('Enable emotional AI notifications? (y/n): ');

  if (enableAI.toLowerCase() === 'y') {
    config.EMOTIONAL_AI_ENABLED = 'true';
    config.EMOTIONAL_PROFILE_UPDATES = 'true';

    const aiEndpoint = await ask(
      'AI sentiment analysis endpoint (or press Enter to skip): '
    );
    if (aiEndpoint) {
      config.SENTIMENT_ANALYSIS_ENDPOINT = aiEndpoint;
    }
  } else {
    config.EMOTIONAL_AI_ENABLED = 'false';
  }

  // === ADVANCED SECURITY ===
  config.NOTIFICATION_SIGNATURE_VALIDATION = 'true';
  config.NOTIFICATION_REPLAY_PROTECTION = 'true';
  config.SUSPICIOUS_SENDER_BLOCKING = 'true';
  config.TRUST_SCORING_ENABLED = 'true';

  // === WRITE CONFIGURATION ===
  log.header('Writing Configuration');

  const envPath = path.join(__dirname, '.env.local');
  let envContent = '';

  // Read existing .env.local if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    log.info('Found existing .env.local, updating notification settings...');
  } else {
    log.info('Creating new .env.local file...');
    envContent = '# Relife Smart Alarm - Environment Configuration\n\n';
  }

  // Add notification configuration section
  envContent += '\n# ===========================================\n';
  envContent += '# NOTIFICATION CONFIGURATION (Auto-generated)\n';
  envContent += `# Generated on: ${new Date().toISOString()}\n`;
  envContent += '# ===========================================\n\n';

  // Write all configuration values
  Object.entries(config).forEach(([key, value]) => {
    envContent += `${key}=${value}\n`;
  });

  fs.writeFileSync(envPath, envContent);

  log.success('Configuration saved to .env.local!');

  // === SETUP SUMMARY ===
  log.header('Setup Complete! 🎉');

  console.log('Your notification system is configured with:');
  console.log(
    `✅ Web Push: ${config.VITE_VAPID_PUBLIC_KEY ? 'Enabled' : 'Pending setup'}`
  );
  console.log(`✅ Mobile Push: ${config.FCM_SERVER_KEY ? 'Enabled' : 'Pending setup'}`);
  console.log(
    `✅ Email Campaigns: ${config.CONVERTKIT_API_KEY ? 'Enabled' : 'Pending setup'}`
  );
  console.log(`✅ Security Keys: Generated`);
  console.log(`✅ Smart Features: Enabled`);
  console.log(
    `✅ Emotional AI: ${config.EMOTIONAL_AI_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`
  );

  console.log('\nNext steps:');
  console.log('1. Run: npm run test-notifications');
  console.log('2. Check your app notification settings');
  console.log('3. Test push notifications in browser/mobile');
  console.log('4. Monitor analytics in your dashboard\n');

  rl.close();
}

// Run the setup
setupNotifications().catch(error => {
  log.error(`Setup failed: ${error.message}`);
  process.exit(1);
});
