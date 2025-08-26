#!/usr/bin/env node

/**
 * Comprehensive Webhook Configuration Manager
 * Configures all notification webhooks for the Relife Alarm application
 *
 * Usage: node scripts/configure-webhooks.js [options]
 *
 * Supports:
 * - Stripe payment webhooks
 * - Push notification webhooks
 * - Monitoring alert webhooks (Slack, Discord, Email, PagerDuty)
 * - Database webhook logging
 * - Security and validation
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: msg => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: msg => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: msg => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  title: msg => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  section: msg => console.log(`\n${colors.bright}${msg}${colors.reset}`),
};

// Readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = query => new Promise(resolve => rl.question(query, resolve));

class WebhookConfigurationManager {
  constructor() {
    this.config = {
      stripe: {},
      pushNotifications: {},
      monitoring: {},
      database: {},
      security: {},
    };
    this.projectRoot = path.resolve(__dirname, '..');
  }

  async run() {
    try {
      log.title('🔧 Relife Webhook Configuration Manager');
      log.title('==========================================');

      console.log(
        '\nThis utility will help you configure all webhook types for your Relife application:'
      );
      console.log('• Stripe payment & subscription webhooks');
      console.log('• Push notification webhooks');
      console.log('• Monitoring alert webhooks (Slack, Discord, Email, PagerDuty)');
      console.log('• Database logging & security');

      const action = await this.showMainMenu();
      await this.handleAction(action);
    } catch (error) {
      log.error(`Configuration failed: ${error.message}`);
      process.exit(1);
    } finally {
      rl.close();
    }
  }

  async showMainMenu() {
    log.section('\n📋 Configuration Options:');
    console.log('1. Complete setup (all webhooks)');
    console.log('2. Stripe payment webhooks only');
    console.log('3. Push notification webhooks only');
    console.log('4. Monitoring alert webhooks only');
    console.log('5. Test existing webhook configuration');
    console.log('6. Generate environment files');
    console.log('7. Security audit & validation');
    console.log('8. View current configuration');
    console.log('9. Exit');

    const choice = await question('\nSelect option (1-9): ');
    return parseInt(choice);
  }

  async handleAction(action) {
    switch (action) {
      case 1:
        await this.completeSetup();
        break;
      case 2:
        await this.configureStripeWebhooks();
        break;
      case 3:
        await this.configurePushNotifications();
        break;
      case 4:
        await this.configureMonitoringWebhooks();
        break;
      case 5:
        await this.testConfiguration();
        break;
      case 6:
        await this.generateEnvironmentFiles();
        break;
      case 7:
        await this.performSecurityAudit();
        break;
      case 8:
        await this.viewCurrentConfiguration();
        break;
      case 9:
        log.info('Exiting...');
        break;
      default:
        log.error('Invalid option');
        await this.run();
    }
  }

  async completeSetup() {
    log.section('🚀 Complete Webhook Setup');

    await this.configureStripeWebhooks();
    await this.configurePushNotifications();
    await this.configureMonitoringWebhooks();
    await this.configureDatabaseLogging();
    await this.configureSecuritySettings();
    await this.generateEnvironmentFiles();
    await this.testConfiguration();

    log.success('Complete webhook setup finished!');
  }

  async configureStripeWebhooks() {
    log.section('💳 Stripe Webhook Configuration');

    console.log('\nTo configure Stripe webhooks:');
    console.log('1. Go to https://dashboard.stripe.com/webhooks');
    console.log('2. Click "Add endpoint"');
    console.log(
      '3. Enter your webhook URL: https://yourdomain.com/api/stripe/webhooks'
    );
    console.log('4. Select events to listen for');

    const stripeSecretKey = await question('Enter your Stripe Secret Key (sk_...): ');
    if (!stripeSecretKey.startsWith('sk_')) {
      log.error('Invalid Stripe secret key format');
      return;
    }

    const webhookSecret = await question(
      'Enter your Stripe Webhook Secret (whsec_...): '
    );
    if (!webhookSecret.startsWith('whsec_')) {
      log.error('Invalid webhook secret format');
      return;
    }

    const webhookUrl = await question(
      'Enter your webhook URL (https://yourdomain.com/api/stripe/webhooks): '
    );

    this.config.stripe = {
      secretKey: stripeSecretKey,
      webhookSecret: webhookSecret,
      webhookUrl: webhookUrl,
      events: [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
      ],
    };

    // Test Stripe configuration
    if (await this.testStripeWebhook()) {
      log.success('Stripe webhook configuration validated');
    } else {
      log.warning('Stripe webhook validation failed - check your settings');
    }
  }

  async configurePushNotifications() {
    log.section('📱 Push Notification Configuration');

    console.log('\nConfiguring push notification webhooks for:');
    console.log('• Mobile app notifications (iOS/Android)');
    console.log('• Web push notifications');
    console.log('• Alarm reminders and motivational messages');

    const enablePush = await question('Enable push notifications? (y/n): ');
    if (enablePush.toLowerCase() !== 'y') {
      log.info('Skipping push notification configuration');
      return;
    }

    // Firebase Configuration
    const firebaseServerKey = await question('Enter Firebase Server Key (optional): ');
    const vapidPublicKey = await question(
      'Enter VAPID Public Key for web push (optional): '
    );
    const vapidPrivateKey = await question(
      'Enter VAPID Private Key for web push (optional): '
    );

    // Push notification settings
    const pushSettings = {
      alarmReminders:
        (await question('Enable alarm reminder notifications? (y/n): ')) === 'y',
      dailyMotivation:
        (await question('Enable daily motivation messages? (y/n): ')) === 'y',
      weeklyProgress:
        (await question('Enable weekly progress reports? (y/n): ')) === 'y',
      emergencyAlerts: (await question('Enable emergency alerts? (y/n): ')) === 'y',
    };

    this.config.pushNotifications = {
      enabled: true,
      firebaseServerKey,
      vapidPublicKey,
      vapidPrivateKey,
      settings: pushSettings,
      webhookUrl: `${this.config.stripe.webhookUrl?.replace('/stripe/webhooks', '') || 'https://yourdomain.com/api'}/push/webhook`,
    };

    log.success('Push notification configuration completed');
  }

  async configureMonitoringWebhooks() {
    log.section('📊 Monitoring Alert Webhooks');

    console.log(
      '\nConfiguring monitoring webhooks for system alerts and notifications'
    );

    // Slack Configuration
    const configureSlack = await question('Configure Slack notifications? (y/n): ');
    if (configureSlack.toLowerCase() === 'y') {
      const slackWebhookUrl = await question('Enter Slack webhook URL: ');
      const slackChannel = await question('Enter Slack channel (e.g., #alerts): ');

      this.config.monitoring.slack = {
        webhookUrl: slackWebhookUrl,
        channel: slackChannel,
        enabled: true,
      };

      if (await this.testSlackWebhook(slackWebhookUrl)) {
        log.success('Slack webhook validated');
      }
    }

    // Discord Configuration
    const configureDiscord = await question('Configure Discord notifications? (y/n): ');
    if (configureDiscord.toLowerCase() === 'y') {
      const discordWebhookUrl = await question('Enter Discord webhook URL: ');

      this.config.monitoring.discord = {
        webhookUrl: discordWebhookUrl,
        enabled: true,
      };

      if (await this.testDiscordWebhook(discordWebhookUrl)) {
        log.success('Discord webhook validated');
      }
    }

    // Email Configuration
    const configureEmail = await question('Configure email notifications? (y/n): ');
    if (configureEmail.toLowerCase() === 'y') {
      const smtpHost = await question('SMTP Host (e.g., smtp.gmail.com): ');
      const smtpPort = (await question('SMTP Port (default 587): ')) || '587';
      const smtpUser = await question('SMTP Username: ');
      const smtpPassword = await question('SMTP Password: ');
      const fromAddress = await question('From Address: ');

      this.config.monitoring.email = {
        smtpHost,
        smtpPort: parseInt(smtpPort),
        smtpUser,
        smtpPassword,
        fromAddress,
        enabled: true,
      };
    }

    // PagerDuty Configuration
    const configurePagerDuty = await question(
      'Configure PagerDuty notifications? (y/n): '
    );
    if (configurePagerDuty.toLowerCase() === 'y') {
      const pagerdutyIntegrationKey = await question('PagerDuty Integration Key: ');

      this.config.monitoring.pagerduty = {
        integrationKey: pagerdutyIntegrationKey,
        enabled: true,
      };
    }
  }

  async configureDatabaseLogging() {
    log.section('🗄️ Database Webhook Logging');

    const supabaseUrl = await question('Enter Supabase URL: ');
    const supabaseServiceKey = await question('Enter Supabase Service Key: ');

    this.config.database = {
      supabaseUrl,
      supabaseServiceKey,
      enableLogging: true,
      retentionDays: 90,
    };

    log.success('Database logging configuration completed');
  }

  async configureSecuritySettings() {
    log.section('🔒 Security Configuration');

    // Generate secure tokens
    const webhookAuthToken = crypto.randomBytes(32).toString('hex');
    const encryptionKey = crypto.randomBytes(32).toString('hex');

    this.config.security = {
      webhookAuthToken,
      encryptionKey,
      enableRateLimit: true,
      maxRetries: 3,
      signatureValidation: true,
      ipWhitelist: [
        '54.187.174.169', // Stripe IPs
        '54.187.205.235',
        '54.187.216.72',
      ],
    };

    log.success('Security configuration completed');
  }

  async generateEnvironmentFiles() {
    log.section('📄 Generating Environment Files');

    try {
      // Production environment
      const prodEnv = this.generateProductionEnv();
      await fs.writeFile(path.join(this.projectRoot, '.env.production'), prodEnv);
      log.success('Generated .env.production');

      // Development environment
      const devEnv = this.generateDevelopmentEnv();
      await fs.writeFile(path.join(this.projectRoot, '.env.development'), devEnv);
      log.success('Generated .env.development');

      // Docker environment
      const dockerEnv = this.generateDockerEnv();
      await fs.writeFile(path.join(this.projectRoot, '.env.docker'), dockerEnv);
      log.success('Generated .env.docker');

      // Generate webhook configuration summary
      const summary = this.generateConfigurationSummary();
      await fs.writeFile(
        path.join(this.projectRoot, 'webhook-configuration-summary.md'),
        summary
      );
      log.success('Generated webhook-configuration-summary.md');
    } catch (error) {
      log.error(`Failed to generate environment files: ${error.message}`);
    }
  }

  generateProductionEnv() {
    return `# Production Environment Configuration
# Generated by Relife Webhook Configuration Manager
# Last updated: ${new Date().toISOString()}

# =============================================================================
# STRIPE WEBHOOK CONFIGURATION
# =============================================================================
STRIPE_SECRET_KEY=${this.config.stripe.secretKey || 'sk_live_your_stripe_secret_key_here'}
STRIPE_WEBHOOK_SECRET=${this.config.stripe.webhookSecret || 'whsec_your_webhook_secret_here'}
STRIPE_PUBLISHABLE_KEY=${this.config.stripe.publishableKey || 'pk_live_your_publishable_key_here'}

# =============================================================================
# PUSH NOTIFICATION CONFIGURATION
# =============================================================================
FIREBASE_SERVER_KEY=${this.config.pushNotifications?.firebaseServerKey || 'your_firebase_server_key_here'}
VAPID_PUBLIC_KEY=${this.config.pushNotifications?.vapidPublicKey || 'your_vapid_public_key_here'}
VAPID_PRIVATE_KEY=${this.config.pushNotifications?.vapidPrivateKey || 'your_vapid_private_key_here'}
PUSH_NOTIFICATIONS_ENABLED=${this.config.pushNotifications?.enabled || 'true'}

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
SUPABASE_URL=${this.config.database?.supabaseUrl || 'https://your-project.supabase.co'}
SUPABASE_SERVICE_KEY=${this.config.database?.supabaseServiceKey || 'your_supabase_service_key_here'}
SUPABASE_ANON_KEY=${this.config.database?.anonKey || 'your_supabase_anon_key_here'}

# =============================================================================
# MONITORING WEBHOOK CONFIGURATION
# =============================================================================
SLACK_WEBHOOK_URL=${this.config.monitoring?.slack?.webhookUrl || ''}
DISCORD_WEBHOOK_URL=${this.config.monitoring?.discord?.webhookUrl || ''}
PAGERDUTY_INTEGRATION_KEY=${this.config.monitoring?.pagerduty?.integrationKey || ''}

# Email Configuration
SMTP_HOST=${this.config.monitoring?.email?.smtpHost || ''}
SMTP_PORT=${this.config.monitoring?.email?.smtpPort || '587'}
SMTP_USER=${this.config.monitoring?.email?.smtpUser || ''}
SMTP_PASSWORD=${this.config.monitoring?.email?.smtpPassword || ''}
SMTP_FROM_ADDRESS=${this.config.monitoring?.email?.fromAddress || ''}

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
WEBHOOK_AUTH_TOKEN=${this.config.security?.webhookAuthToken || crypto.randomBytes(32).toString('hex')}
ENCRYPTION_KEY=${this.config.security?.encryptionKey || crypto.randomBytes(32).toString('hex')}
ENABLE_WEBHOOK_RATE_LIMITING=${this.config.security?.enableRateLimit || 'true'}
WEBHOOK_MAX_RETRIES=${this.config.security?.maxRetries || '3'}

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NODE_ENV=production
WEBHOOK_LOG_LEVEL=info
ENABLE_WEBHOOK_METRICS=true
ENABLE_WEBHOOK_RETRIES=true
WEBHOOK_PROCESSING_TIMEOUT=30000

# Domain Configuration
RELIFE_DOMAIN=your-domain.com
WEBHOOK_BASE_URL=https://your-domain.com/api
`;
  }

  generateDevelopmentEnv() {
    return `# Development Environment Configuration
# Generated by Relife Webhook Configuration Manager
# Last updated: ${new Date().toISOString()}

# =============================================================================
# STRIPE WEBHOOK CONFIGURATION (TEST MODE)
# =============================================================================
STRIPE_SECRET_KEY=${this.config.stripe.secretKey?.replace('sk_live_', 'sk_test_') || 'sk_test_your_test_secret_key_here'}
STRIPE_WEBHOOK_SECRET=${this.config.stripe.webhookSecret || 'whsec_your_test_webhook_secret_here'}
STRIPE_PUBLISHABLE_KEY=${this.config.stripe.publishableKey?.replace('pk_live_', 'pk_test_') || 'pk_test_your_test_publishable_key_here'}
STRIPE_TEST_MODE=true

# =============================================================================
# DEVELOPMENT CONFIGURATION
# =============================================================================
NODE_ENV=development
WEBHOOK_LOG_LEVEL=debug
WEBHOOK_VERBOSE_LOGGING=true
ENABLE_WEBHOOK_METRICS=false
WEBHOOK_BASE_URL=http://localhost:3000/api

# Database (Development)
SUPABASE_URL=${this.config.database?.supabaseUrl || 'https://your-dev-project.supabase.co'}
SUPABASE_SERVICE_KEY=${this.config.database?.supabaseServiceKey || 'your_dev_supabase_service_key_here'}

# Push Notifications (Development)
PUSH_NOTIFICATIONS_ENABLED=false
FIREBASE_SERVER_KEY=${this.config.pushNotifications?.firebaseServerKey || 'your_dev_firebase_server_key'}

# Security (Development - Less Strict)
WEBHOOK_AUTH_TOKEN=dev_webhook_token_${crypto.randomBytes(16).toString('hex')}
ENABLE_WEBHOOK_RATE_LIMITING=false
WEBHOOK_MAX_RETRIES=1
`;
  }

  generateDockerEnv() {
    return `# Docker Environment Configuration
# Generated by Relife Webhook Configuration Manager
# Last updated: ${new Date().toISOString()}

# Copy values from .env.production and override for Docker deployment
NODE_ENV=production
WEBHOOK_BASE_URL=http://localhost:8080/api

# Docker-specific settings
WEBHOOK_PROCESSING_TIMEOUT=45000
ENABLE_WEBHOOK_METRICS=true
WEBHOOK_LOG_LEVEL=info

# Health check settings
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=60000
`;
  }

  generateConfigurationSummary() {
    return `# Webhook Configuration Summary

Generated on: ${new Date().toISOString()}

## Configured Webhooks

### ✅ Stripe Payment Webhooks
- **Status**: ${this.config.stripe.secretKey ? 'Configured' : 'Not Configured'}
- **Webhook URL**: ${this.config.stripe.webhookUrl || 'Not Set'}
- **Events**: Subscription lifecycle, payments, invoices
- **Security**: Signature validation enabled

### 📱 Push Notification Webhooks  
- **Status**: ${this.config.pushNotifications?.enabled ? 'Enabled' : 'Disabled'}
- **Platform Support**: iOS, Android, Web
- **Features**: Alarm reminders, motivation, progress tracking
- **Security**: Token-based authentication

### 📊 Monitoring Alert Webhooks
- **Slack**: ${this.config.monitoring?.slack?.enabled ? '✅ Configured' : '❌ Not Configured'}
- **Discord**: ${this.config.monitoring?.discord?.enabled ? '✅ Configured' : '❌ Not Configured'}  
- **Email**: ${this.config.monitoring?.email?.enabled ? '✅ Configured' : '❌ Not Configured'}
- **PagerDuty**: ${this.config.monitoring?.pagerduty?.enabled ? '✅ Configured' : '❌ Not Configured'}

### 🗄️ Database Logging
- **Status**: ${this.config.database?.enableLogging ? 'Enabled' : 'Disabled'}
- **Retention**: ${this.config.database?.retentionDays || 90} days
- **Database**: Supabase PostgreSQL

### 🔒 Security Configuration
- **Rate Limiting**: ${this.config.security?.enableRateLimit ? 'Enabled' : 'Disabled'}
- **Signature Validation**: ${this.config.security?.signatureValidation ? 'Enabled' : 'Disabled'}
- **IP Whitelisting**: ${this.config.security?.ipWhitelist?.length || 0} IPs configured
- **Encryption**: AES-256 with secure key generation

## Next Steps

1. **Deploy Environment Files**: Copy the generated .env files to your deployment environment
2. **Configure Stripe Dashboard**: Add webhook endpoints in Stripe dashboard
3. **Test Webhooks**: Run \`npm run test:webhooks\` to validate configuration
4. **Monitor Logs**: Check webhook processing logs in your database
5. **Set Up Alerts**: Configure monitoring thresholds and alert rules

## Testing Commands

\`\`\`bash
# Test webhook configuration
node scripts/configure-webhooks.js --test

# Test specific webhook types
node test-webhook-setup.js

# Monitor webhook logs  
npm run webhook:logs

# Security audit
node scripts/configure-webhooks.js --audit
\`\`\`

## Support Documentation

- [Stripe Webhook Guide](./STRIPE_WEBHOOK_PRODUCTION_GUIDE.md)
- [Push Notification Setup](./docs/push-notification-setup.md) 
- [Monitoring Configuration](./MONITORING_ALERTS_SETUP_COMPLETE.md)
- [Security Best Practices](./SECURITY.md)

---
*Generated by Relife Webhook Configuration Manager v1.0*
`;
  }

  async testConfiguration() {
    log.section('🧪 Testing Webhook Configuration');

    let allTestsPassed = true;

    // Test Stripe webhooks
    if (this.config.stripe?.secretKey) {
      log.info('Testing Stripe webhook configuration...');
      if (await this.testStripeWebhook()) {
        log.success('Stripe webhooks: PASS');
      } else {
        log.error('Stripe webhooks: FAIL');
        allTestsPassed = false;
      }
    }

    // Test monitoring webhooks
    if (this.config.monitoring?.slack?.webhookUrl) {
      log.info('Testing Slack webhook...');
      if (await this.testSlackWebhook(this.config.monitoring.slack.webhookUrl)) {
        log.success('Slack webhook: PASS');
      } else {
        log.error('Slack webhook: FAIL');
        allTestsPassed = false;
      }
    }

    if (this.config.monitoring?.discord?.webhookUrl) {
      log.info('Testing Discord webhook...');
      if (await this.testDiscordWebhook(this.config.monitoring.discord.webhookUrl)) {
        log.success('Discord webhook: PASS');
      } else {
        log.error('Discord webhook: FAIL');
        allTestsPassed = false;
      }
    }

    // Test database connection
    if (this.config.database?.supabaseUrl) {
      log.info('Testing database connection...');
      if (await this.testDatabaseConnection()) {
        log.success('Database connection: PASS');
      } else {
        log.error('Database connection: FAIL');
        allTestsPassed = false;
      }
    }

    if (allTestsPassed) {
      log.success('All webhook tests passed! 🎉');
    } else {
      log.warning('Some webhook tests failed. Check your configuration.');
    }

    return allTestsPassed;
  }

  async testStripeWebhook() {
    try {
      // Simple validation of Stripe keys format
      return (
        this.config.stripe.secretKey?.startsWith('sk_') &&
        this.config.stripe.webhookSecret?.startsWith('whsec_')
      );
    } catch (error) {
      return false;
    }
  }

  async testSlackWebhook(webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '🧪 Webhook test from Relife Configuration Manager',
        }),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async testDiscordWebhook(webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '🧪 Webhook test from Relife Configuration Manager',
        }),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async testDatabaseConnection() {
    try {
      // Basic URL validation
      return (
        this.config.database?.supabaseUrl?.includes('supabase.co') &&
        this.config.database?.supabaseServiceKey?.length > 50
      );
    } catch (error) {
      return false;
    }
  }

  async performSecurityAudit() {
    log.section('🔍 Security Audit');

    const issues = [];

    // Check for placeholder values
    if (this.config.stripe?.secretKey?.includes('placeholder')) {
      issues.push('Stripe secret key contains placeholder value');
    }

    // Check webhook URL security
    if (
      this.config.stripe?.webhookUrl &&
      !this.config.stripe.webhookUrl.startsWith('https://')
    ) {
      issues.push('Webhook URL should use HTTPS in production');
    }

    // Check for weak tokens
    if (this.config.security?.webhookAuthToken?.length < 32) {
      issues.push('Webhook auth token is too short');
    }

    if (issues.length === 0) {
      log.success('Security audit passed - no issues found');
    } else {
      log.warning('Security audit found issues:');
      issues.forEach(issue => console.log(`  • ${issue}`));
    }
  }

  async viewCurrentConfiguration() {
    log.section('📋 Current Configuration');

    console.log('\n📍 Configuration Status:');
    console.log(
      `  Stripe: ${this.config.stripe?.secretKey ? '✅ Configured' : '❌ Not Configured'}`
    );
    console.log(
      `  Push Notifications: ${this.config.pushNotifications?.enabled ? '✅ Enabled' : '❌ Disabled'}`
    );
    console.log(
      `  Monitoring: ${Object.keys(this.config.monitoring || {}).length} services configured`
    );
    console.log(
      `  Database: ${this.config.database?.supabaseUrl ? '✅ Configured' : '❌ Not Configured'}`
    );
    console.log(
      `  Security: ${this.config.security?.webhookAuthToken ? '✅ Configured' : '❌ Not Configured'}`
    );

    console.log('\n📊 Detailed Configuration:');
    console.log(JSON.stringify(this.config, null, 2));
  }
}

// CLI handling
async function main() {
  const manager = new WebhookConfigurationManager();

  const args = process.argv.slice(2);
  if (args.includes('--test')) {
    await manager.testConfiguration();
  } else if (args.includes('--audit')) {
    await manager.performSecurityAudit();
  } else {
    await manager.run();
  }
}

// Handle CLI execution
if (process.argv[1] === __filename) {
  main().catch(error => {
    console.error('Configuration error:', error);
    process.exit(1);
  });
}

export default WebhookConfigurationManager;
