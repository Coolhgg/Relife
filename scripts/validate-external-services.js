#!/usr/bin/env node

/**
 * Relife Smart Alarm - External Services Configuration Validator
 * Validates that all required external services are properly configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: msg => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: msg => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: msg => console.log(`${colors.cyan}${colors.bright}${msg}${colors.reset}`),
  section: msg => console.log(`${colors.magenta}🔧 ${msg}${colors.reset}`),
};

// Service configurations
const services = {
  essential: {
    'Supabase (Database)': ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
  },
  analytics: {
    'PostHog (Analytics)': ['VITE_POSTHOG_KEY'],
    'Amplitude (User Analytics)': ['VITE_AMPLITUDE_API_KEY'],
  },
  monitoring: {
    'Sentry (Error Tracking)': ['VITE_SENTRY_DSN'],
    'DataDog (Infrastructure)': ['DATADOG_API_KEY', 'VITE_DATADOG_CLIENT_TOKEN'],
    'New Relic (APM)': ['NEWRELIC_LICENSE_KEY', 'VITE_NEW_RELIC_ACCOUNT_ID'],
  },
  notifications: {
    'Firebase (Push Notifications)': ['VITE_VAPID_PUBLIC_KEY', 'VITE_FIREBASE_CONFIG'],
  },
  optional: {
    'UptimeRobot (Uptime Monitoring)': ['VITE_UPTIME_ROBOT_KEY'],
    'Slack (Alerts)': ['SLACK_WEBHOOK_URL'],
    'PagerDuty (Critical Alerts)': ['PAGERDUTY_WEBHOOK_URL'],
  },
};

// Load environment file
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key] = valueParts.join('=');
      }
    }
  });

  return env;
}

// Validate environment variable
function validateEnvVar(env, varName) {
  const value = env[varName];
  if (
    !value ||
    value.includes('your_') ||
    value.includes('_here') ||
    value.includes('_key_here')
  ) {
    return false;
  }
  return true;
}

// Validate service configuration
function validateService(env, serviceName, requiredVars) {
  const results = {
    service: serviceName,
    configured: 0,
    total: requiredVars.length,
    missing: [],
    present: [],
  };

  requiredVars.forEach(varName => {
    if (validateEnvVar(env, varName)) {
      results.configured++;
      results.present.push(varName);
    } else {
      results.missing.push(varName);
    }
  });

  return results;
}

// Main validation function
function validateConfiguration() {
  log.title('🚀 Relife Smart Alarm - External Services Validator');
  console.log('='.repeat(60));
  console.log('');

  const envFiles = ['.env.local', '.env.development', '.env.production'];
  const environments = {};

  // Load environment files
  envFiles.forEach(file => {
    const env = loadEnvFile(file);
    if (env) {
      environments[file] = env;
      log.success(`Loaded ${file}`);
    } else {
      log.warning(`${file} not found`);
    }
  });

  if (Object.keys(environments).length === 0) {
    log.error('No environment files found!');
    log.info('Run: cp .env.example .env.local');
    process.exit(1);
  }

  console.log('');

  // Validate each environment
  Object.keys(environments).forEach(envFile => {
    const env = environments[envFile];

    log.section(`Validating ${envFile}`);
    console.log('-'.repeat(40));

    let totalConfigured = 0;
    let totalRequired = 0;
    let criticalMissing = false;

    // Check each service category
    Object.keys(services).forEach(category => {
      const categoryServices = services[category];

      console.log(`
📋 ${category.toUpperCase()} SERVICES:`);

      Object.keys(categoryServices).forEach(serviceName => {
        const requiredVars = categoryServices[serviceName];
        const result = validateService(env, serviceName, requiredVars);

        totalConfigured += result.configured;
        totalRequired += result.total;

        const percentage = Math.round((result.configured / result.total) * 100);

        if (result.configured === result.total) {
          log.success(`${serviceName}: ${percentage}% configured`);
        } else if (result.configured > 0) {
          log.warning(
            `${serviceName}: ${percentage}% configured (${result.missing.length} missing)`
          );
          if (category === 'essential') criticalMissing = true;
        } else {
          log.error(`${serviceName}: Not configured`);
          if (category === 'essential') criticalMissing = true;
        }

        // Show missing variables for partially configured services
        if (result.missing.length > 0 && result.configured > 0) {
          log.info(`  Missing: ${result.missing.join(', ')}`);
        }
      });
    });

    // Summary for this environment
    const overallPercentage = Math.round((totalConfigured / totalRequired) * 100);

    console.log(`
📊 SUMMARY FOR ${envFile.toUpperCase()}:`);
    console.log(
      `Configuration: ${totalConfigured}/${totalRequired} variables (${overallPercentage}%)`
    );

    if (overallPercentage >= 80) {
      log.success('Great! Most services are configured');
    } else if (overallPercentage >= 60) {
      log.warning('Good start, but more services need configuration');
    } else {
      log.error('Many services need configuration');
    }

    if (criticalMissing) {
      log.error('Critical services are missing configuration!');
    }

    console.log('');
  });

  // Service-specific setup guidance
  console.log('');
  log.section('📚 Setup Guidance');
  console.log('-'.repeat(40));

  const setupSteps = [
    {
      service: 'Supabase',
      priority: 'CRITICAL',
      steps: [
        '1. Sign up at supabase.com',
        '2. Create a new project',
        '3. Copy URL and anon key from Settings > API',
        '4. Import database/schema-enhanced.sql',
      ],
    },
    {
      service: 'PostHog',
      priority: 'HIGH',
      steps: [
        '1. Sign up at posthog.com',
        '2. Create project and copy API key',
        '3. Enable session recordings (optional)',
      ],
    },
    {
      service: 'Sentry',
      priority: 'HIGH',
      steps: [
        '1. Sign up at sentry.io',
        '2. Create React project',
        '3. Copy DSN from project settings',
      ],
    },
    {
      service: 'DataDog',
      priority: 'MEDIUM',
      steps: [
        '1. Sign up at datadoghq.com',
        '2. Get API key from Integrations > APIs',
        '3. Start monitoring: docker-compose up -d',
      ],
    },
  ];

  setupSteps.forEach(({ service, priority, steps }) => {
    const priorityColor =
      priority === 'CRITICAL'
        ? colors.red
        : priority === 'HIGH'
          ? colors.yellow
          : colors.blue;

    console.log(`
${priorityColor}${priority}${colors.reset}: ${service}`);
    steps.forEach(step => log.info(`  ${step}`));
  });

  // Quick commands
  console.log('');
  log.section('🚀 Quick Commands');
  console.log('-'.repeat(40));
  log.info('Run automated setup: ./scripts/setup-external-services.sh');
  log.info('Start monitoring stack: docker-compose up -d');
  log.info('Test configuration: npm run test:services');
  log.info('Full setup guide: docs/EXTERNAL_SERVICES_SETUP_GUIDE.md');

  console.log('');
  log.title('Validation complete! 🎉');
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateConfiguration();
}

export { validateConfiguration, loadEnvFile, validateService };
