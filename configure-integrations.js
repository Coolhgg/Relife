#!/usr/bin/env node

/**
 * Relife Smart Alarm - Interactive Integration Configuration Wizard
 *
 * This script provides a guided setup for all integrations and external services.
 * Run with: node configure-integrations.js
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for output
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Logging utilities
const log = {
  title: msg => console.log(`${colors.cyan}${colors.bright}${msg}${colors.reset}`),
  section: msg =>
    console.log(`${colors.magenta}${colors.bright}🔧 ${msg}${colors.reset}`),
  info: msg => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: msg => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  step: (step, msg) => console.log(`${colors.cyan}${step}.${colors.reset} ${msg}`),
};

// Promisify readline question
const question = query => new Promise(resolve => rl.question(query, resolve));

// Configuration profiles
const integrationProfiles = {
  minimal: {
    name: '🚀 Minimal Setup (Quick Start)',
    description: 'Essential services only - get up and running fast',
    services: ['supabase', 'basic-env'],
    estimated_time: '5 minutes',
  },
  standard: {
    name: '📊 Standard Setup (Recommended)',
    description: 'Core services + analytics + payments',
    services: ['supabase', 'basic-env', 'posthog', 'sentry', 'stripe'],
    estimated_time: '15 minutes',
  },
  complete: {
    name: '🏆 Complete Setup (Full Featured)',
    description: 'All integrations including monitoring and mobile',
    services: [
      'supabase',
      'basic-env',
      'posthog',
      'sentry',
      'stripe',
      'mobile',
      'monitoring',
    ],
    estimated_time: '30 minutes',
  },
  custom: {
    name: '🎯 Custom Setup (Choose Your Own)',
    description: 'Select specific services to configure',
    services: [], // Will be selected interactively
    estimated_time: 'Variable',
  },
};

// Service definitions
const services = {
  supabase: {
    name: 'Supabase Database',
    priority: 'CRITICAL',
    description: 'Core database and authentication',
    envVars: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
    setupUrl: 'https://supabase.com',
    instructions: [
      '1. Sign up at supabase.com',
      '2. Create a new project',
      '3. Go to Settings > API',
      '4. Copy Project URL and anon key',
    ],
  },
  'basic-env': {
    name: 'Basic App Configuration',
    priority: 'CRITICAL',
    description: 'Essential app settings',
    envVars: ['VITE_APP_NAME', 'VITE_APP_VERSION', 'VITE_APP_DOMAIN'],
    instructions: [
      '1. Set your app name and version',
      '2. Configure your domain',
      '3. Set environment type',
    ],
  },
  posthog: {
    name: 'PostHog Analytics',
    priority: 'HIGH',
    description: 'User behavior analytics and feature flags',
    envVars: ['VITE_POSTHOG_KEY'],
    setupUrl: 'https://posthog.com',
    instructions: [
      '1. Sign up at posthog.com',
      '2. Create a project',
      '3. Copy your Project API Key',
      '4. Enable session recordings (optional)',
    ],
  },
  sentry: {
    name: 'Sentry Error Monitoring',
    priority: 'HIGH',
    description: 'Real-time error tracking and performance',
    envVars: ['VITE_SENTRY_DSN'],
    setupUrl: 'https://sentry.io',
    instructions: [
      '1. Sign up at sentry.io',
      '2. Create a React project',
      '3. Copy the DSN from project settings',
      '4. Configure GitHub integration (optional)',
    ],
  },
  stripe: {
    name: 'Stripe Payments',
    priority: 'HIGH',
    description: 'Payment processing and subscriptions',
    envVars: ['VITE_STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY'],
    setupUrl: 'https://dashboard.stripe.com',
    instructions: [
      '1. Sign up at stripe.com',
      '2. Go to Developers > API Keys',
      '3. Copy Publishable and Secret keys',
      '4. Set up webhook endpoints',
    ],
  },
  mobile: {
    name: 'Mobile App (Capacitor)',
    priority: 'MEDIUM',
    description: 'Android and iOS app configuration',
    envVars: ['VITE_MOBILE_ENABLED'],
    instructions: [
      '1. Install Android Studio / Xcode',
      '2. Run: npm run mobile:setup',
      '3. Configure app signing',
      '4. Test on device/emulator',
    ],
  },
  monitoring: {
    name: 'Infrastructure Monitoring',
    priority: 'MEDIUM',
    description: 'Prometheus, Grafana, and logging',
    envVars: ['GRAFANA_PASSWORD', 'REDIS_PASSWORD'],
    instructions: [
      '1. Set monitoring passwords',
      '2. Run: docker-compose up -d',
      '3. Access Grafana at localhost:3002',
      '4. Import monitoring dashboards',
    ],
  },
  datadog: {
    name: 'DataDog Monitoring',
    priority: 'LOW',
    description: 'Advanced infrastructure monitoring',
    envVars: ['DATADOG_API_KEY', 'VITE_DATADOG_CLIENT_TOKEN'],
    setupUrl: 'https://datadoghq.com',
    instructions: [
      '1. Sign up at datadoghq.com',
      '2. Get API key from Integrations > APIs',
      '3. Create RUM application',
      '4. Copy client token',
    ],
  },
};

// Load existing environment file
function loadEnvFile(filePath = '.env.local') {
  if (!fs.existsSync(filePath)) {
    return {};
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

// Save environment variables
function saveEnvVar(key, value, filePath = '.env.local') {
  const envContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const lines = envContent.split('\n');

  // Find existing line or add new one
  let found = false;
  const updatedLines = lines.map(line => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    updatedLines.push(`${key}=${value}`);
  }

  fs.writeFileSync(filePath, updatedLines.join('\n'));
}

// Check if service is configured
function isServiceConfigured(serviceKey) {
  const service = services[serviceKey];
  const env = loadEnvFile();

  return service.envVars.every(varName => {
    const value = env[varName];
    return value && !value.includes('your_') && !value.includes('_here');
  });
}

// Configure a specific service
async function configureService(serviceKey) {
  const service = services[serviceKey];

  log.section(`Configuring ${service.name}`);
  console.log(`📝 ${service.description}`);
  console.log(`🌐 Setup URL: ${service.setupUrl || 'N/A'}`);
  console.log();

  // Show instructions
  log.info('Setup Instructions:');
  service.instructions.forEach(instruction => {
    console.log(`   ${instruction}`);
  });
  console.log();

  // Check if already configured
  if (isServiceConfigured(serviceKey)) {
    const reconfigure = await question(
      '⚡ This service is already configured. Reconfigure? (y/N): '
    );
    if (!reconfigure.toLowerCase().startsWith('y')) {
      log.info('Skipping reconfiguration');
      return;
    }
  }

  // Get configuration values
  for (const envVar of service.envVars) {
    const currentValue = loadEnvFile()[envVar] || '';
    const promptText = currentValue
      ? `Enter ${envVar} (current: ${currentValue.substring(0, 20)}...): `
      : `Enter ${envVar}: `;

    const value = await question(promptText);

    if (value.trim()) {
      saveEnvVar(envVar, value.trim());
      log.success(`Set ${envVar}`);
    } else if (!currentValue) {
      log.warning(`Skipped ${envVar} - no value provided`);
    }
  }

  // Service-specific post-setup
  await postSetupActions(serviceKey);
  console.log();
}

// Post-setup actions for specific services
async function postSetupActions(serviceKey) {
  switch (serviceKey) {
    case 'supabase':
      log.info('Next steps:');
      log.info('1. Import database schema: npm run db:migrate');
      log.info('2. Test connection: npm run test:database');
      break;

    case 'stripe':
      log.info('Next steps:');
      log.info('1. Set up webhooks in Stripe dashboard');
      log.info('2. Test payments: npm run test:payment');
      log.info('3. Start API server: npm run api:dev');
      break;

    case 'mobile':
      log.info('Next steps:');
      log.info('1. Install platform tools (Android Studio/Xcode)');
      log.info('2. Run: npm run mobile:setup');
      log.info('3. Test: npm run mobile:dev:android');
      break;

    case 'monitoring':
      log.info('Next steps:');
      log.info('1. Start services: docker-compose up -d');
      log.info('2. Access Grafana: http://localhost:3002');
      log.info('3. Import dashboards from monitoring/grafana/');
      break;
  }
}

// Validate current configuration
function validateConfiguration() {
  log.section('Configuration Validation');

  const env = loadEnvFile();
  let criticalMissing = false;
  let warningCount = 0;

  Object.entries(services).forEach(([key, service]) => {
    const configured = isServiceConfigured(key);

    if (configured) {
      log.success(`${service.name}: Configured`);
    } else {
      if (service.priority === 'CRITICAL') {
        log.error(`${service.name}: Not configured (CRITICAL)`);
        criticalMissing = true;
      } else if (service.priority === 'HIGH') {
        log.warning(`${service.name}: Not configured (HIGH PRIORITY)`);
        warningCount++;
      } else {
        log.info(`${service.name}: Not configured (OPTIONAL)`);
      }
    }
  });

  console.log();

  if (criticalMissing) {
    log.error('Critical services are missing! App may not function properly.');
  } else if (warningCount > 0) {
    log.warning(`${warningCount} high-priority services need configuration.`);
  } else {
    log.success('All critical services are configured!');
  }

  return { criticalMissing, warningCount };
}

// Main configuration wizard
async function runConfigurationWizard() {
  // Header
  log.title('🚀 Relife Smart Alarm - Integration Configuration Wizard');
  console.log('='.repeat(70));
  console.log();

  log.info(
    'This wizard will help you configure all external integrations and services.'
  );
  console.log();

  // Show current status
  const { criticalMissing, warningCount } = validateConfiguration();
  console.log();

  // Profile selection
  log.section('Setup Profile Selection');
  console.log('Choose a configuration profile:');
  console.log();

  Object.entries(integrationProfiles).forEach(([key, profile], index) => {
    console.log(`${index + 1}. ${profile.name}`);
    console.log(`   ${profile.description}`);
    console.log(`   ⏱️  Estimated time: ${profile.estimated_time}`);
    console.log();
  });

  const profileChoice = await question('Select profile (1-4): ');
  const profileKeys = Object.keys(integrationProfiles);
  const selectedProfileKey = profileKeys[parseInt(profileChoice) - 1];

  if (!selectedProfileKey) {
    log.error('Invalid selection. Exiting...');
    rl.close();
    return;
  }

  const selectedProfile = integrationProfiles[selectedProfileKey];
  log.success(`Selected: ${selectedProfile.name}`);
  console.log();

  // Get services to configure
  let servicesToConfigure = [...selectedProfile.services];

  if (selectedProfileKey === 'custom') {
    log.section('Custom Service Selection');
    console.log('Available services:');
    console.log();

    Object.entries(services).forEach(([key, service], index) => {
      const configured = isServiceConfigured(key) ? '✅' : '❌';
      console.log(`${index + 1}. ${configured} ${service.name} (${service.priority})`);
      console.log(`   ${service.description}`);
    });
    console.log();

    const serviceChoices = await question(
      'Select services (comma-separated numbers, e.g., 1,2,3): '
    );
    const serviceIndices = serviceChoices.split(',').map(n => parseInt(n.trim()) - 1);
    servicesToConfigure = serviceIndices
      .filter(i => i >= 0 && i < Object.keys(services).length)
      .map(i => Object.keys(services)[i]);
  }

  // Configure selected services
  log.section('Service Configuration');
  console.log(`Configuring ${servicesToConfigure.length} services...`);
  console.log();

  for (const serviceKey of servicesToConfigure) {
    await configureService(serviceKey);
  }

  // Final validation
  log.section('Final Validation');
  validateConfiguration();
  console.log();

  // Post-setup instructions
  log.section('Next Steps');
  console.log("Your integration configuration is complete! Here's what to do next:");
  console.log();

  log.step(1, 'Test your configuration:');
  console.log('   npm run services:validate');
  console.log();

  log.step(2, 'Start development environment:');
  console.log('   npm run dev              # Frontend');
  console.log('   npm run api:dev          # Backend API (if using payments)');
  console.log();

  log.step(3, 'Run tests to verify everything works:');
  console.log('   npm run test');
  console.log('   npm run test:integration');
  console.log();

  if (servicesToConfigure.includes('stripe')) {
    log.step(4, 'Test payment integration:');
    console.log('   node scripts/test-payment-config.js');
    console.log();
  }

  if (servicesToConfigure.includes('mobile')) {
    log.step(5, 'Set up mobile development:');
    console.log('   npm run mobile:setup');
    console.log('   npm run mobile:dev:android');
    console.log();
  }

  if (servicesToConfigure.includes('monitoring')) {
    log.step(6, 'Start monitoring stack:');
    console.log('   docker-compose up -d');
    console.log('   # Access Grafana at http://localhost:3002');
    console.log();
  }

  // Additional resources
  log.section('📚 Additional Resources');
  console.log('• Full documentation: INTEGRATION_SETTINGS_CONFIGURATION_GUIDE.md');
  console.log('• Payment setup: PAYMENT_SETUP_GUIDE.md');
  console.log('• Analytics setup: ANALYTICS_TRACKING_SETUP.md');
  console.log('• Mobile guide: MOBILE_INTEGRATION_GUIDE.md');
  console.log();

  log.success('🎉 Configuration wizard complete!');
  log.info('Your Relife Smart Alarm app is ready to launch!');
}

// Environment file validation
function checkEnvironmentFiles() {
  const requiredFiles = ['.env.example'];
  const optionalFiles = ['.env.local', '.env.development', '.env.production'];

  log.section('Environment File Check');

  // Check required files
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log.success(`${file} exists`);
    } else {
      log.error(`${file} missing - this is required!`);
    }
  });

  // Check optional files
  optionalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log.success(`${file} exists`);
    } else {
      log.info(`${file} not found (will be created if needed)`);
    }
  });

  console.log();
}

// Create .env.local if it doesn't exist
function ensureEnvFile() {
  if (!fs.existsSync('.env.local')) {
    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', '.env.local');
      log.success('Created .env.local from .env.example');
    } else {
      log.error(".env.example not found! Please ensure you're in the project root.");
      process.exit(1);
    }
  }
}

// Test connectivity to external services
async function testConnectivity() {
  log.section('Testing Service Connectivity');

  const tests = [
    { name: 'Supabase', url: 'https://supabase.com' },
    { name: 'PostHog', url: 'https://app.posthog.com' },
    { name: 'Sentry', url: 'https://sentry.io' },
    { name: 'Stripe', url: 'https://api.stripe.com' },
  ];

  for (const test of tests) {
    try {
      execSync(`curl -s --head --fail ${test.url} > /dev/null`, { stdio: 'pipe' });
      log.success(`${test.name}: Reachable`);
    } catch (error) {
      log.warning(`${test.name}: Cannot reach (check internet connection)`);
    }
  }
  console.log();
}

// Main execution
async function main() {
  try {
    // Preliminary checks
    checkEnvironmentFiles();
    ensureEnvFile();

    // Test internet connectivity
    await testConnectivity();

    // Run the main wizard
    await runConfigurationWizard();
  } catch (error) {
    log.error(`Configuration failed: ${error.message}`);
    console.log();
    log.info('For help, check:');
    log.info('• INTEGRATION_SETTINGS_CONFIGURATION_GUIDE.md');
    log.info('• README.md');
    log.info('• ./scripts/setup-external-services.sh');
  } finally {
    rl.close();
  }
}

// Handle script arguments
if (process.argv.includes('--validate-only')) {
  log.title('🔍 Configuration Validation Only');
  console.log('='.repeat(50));
  console.log();
  validateConfiguration();
  process.exit(0);
}

if (process.argv.includes('--help')) {
  console.log('Relife Integration Configuration Wizard');
  console.log();
  console.log('Usage:');
  console.log(
    '  node configure-integrations.js                 # Run interactive wizard'
  );
  console.log(
    '  node configure-integrations.js --validate-only # Validate current config'
  );
  console.log('  node configure-integrations.js --help          # Show this help');
  console.log();
  console.log('For detailed documentation, see:');
  console.log('  INTEGRATION_SETTINGS_CONFIGURATION_GUIDE.md');
  process.exit(0);
}

// Run main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { configureService, validateConfiguration, isServiceConfigured };
