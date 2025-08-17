# 🔐 Secrets & Environment Variables Configuration

This document provides comprehensive details on all secrets and environment variables required for the Relife CI/CD pipeline.

## 📋 Quick Setup Checklist

- [ ] Core deployment secrets configured
- [ ] Service integration tokens added
- [ ] Cloud provider credentials set
- [ ] Environment variables configured
- [ ] Test all integrations
- [ ] Document secret rotation schedule

## 🔑 Required Secrets

### Core Deployment Secrets

#### `CODECOV_TOKEN`
- **Purpose**: Code coverage reporting integration
- **Where to get**: [Codecov.io](https://codecov.io) → Repository Settings → Copy token
- **Environments**: Both staging and production
- **Format**: `uuid4` format token
- **Example**: `12345678-1234-1234-1234-123456789012`

#### `STAGING_DEPLOY_KEY` / `PRODUCTION_DEPLOY_KEY`
- **Purpose**: Authentication for deployment to hosting service
- **Where to get**: Your hosting provider (Vercel, Netlify, AWS, etc.)
- **Environments**: Staging / Production respectively
- **Format**: Varies by provider
- **Examples**:
  - Vercel: `vercel_token_abc123...`
  - Netlify: `netlify_token_def456...`
  - SSH Key: `-----BEGIN OPENSSH PRIVATE KEY-----...`

### Error Tracking & Monitoring

#### `SENTRY_DSN_STAGING` / `SENTRY_DSN_PRODUCTION`
- **Purpose**: Error tracking and performance monitoring
- **Where to get**: [Sentry.io](https://sentry.io) → Project Settings → Client Keys
- **Environments**: Staging / Production respectively
- **Format**: `https://public@dsn.ingest.sentry.io/project-id`
- **Example**: `https://abc123@o123456.ingest.sentry.io/123456`

### Firebase Integration

#### `FIREBASE_CONFIG_STAGING` / `FIREBASE_CONFIG_PRODUCTION`
- **Purpose**: Firebase SDK configuration for backend services
- **Where to get**: Firebase Console → Project Settings → General → Your apps
- **Environments**: Staging / Production respectively
- **Format**: JSON configuration object
- **Example**:
```json
{
  "apiKey": "AIza...",
  "authDomain": "project.firebaseapp.com",
  "projectId": "project-id",
  "storageBucket": "project.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123:web:abc123"
}
```

### Cloud Provider (AWS)

#### `AWS_ACCESS_KEY_ID`
- **Purpose**: AWS authentication for deployment and services
- **Where to get**: AWS IAM Console → Users → Security credentials
- **Environments**: Both (can be same for non-sensitive resources)
- **Format**: 20-character alphanumeric string
- **Example**: `AKIAIOSFODNN7EXAMPLE`

#### `AWS_SECRET_ACCESS_KEY`
- **Purpose**: AWS secret key paired with access key ID
- **Where to get**: AWS IAM Console → Users → Security credentials
- **Environments**: Both (can be same for non-sensitive resources)
- **Format**: 40-character base64-like string
- **Example**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

#### `AWS_REGION` (Optional)
- **Purpose**: Specify AWS region for deployments
- **Where to get**: Choose based on your deployment location
- **Environments**: Both
- **Format**: AWS region code
- **Example**: `us-east-1`, `eu-west-1`, `ap-southeast-1`

### Optional Integrations

#### `SSL_CERTIFICATE`
- **Purpose**: Custom SSL certificate for HTTPS
- **Where to get**: Certificate authority or cloud provider
- **Environments**: Production (typically)
- **Format**: PEM-encoded certificate
- **Example**: `-----BEGIN CERTIFICATE-----...`

#### `CDN_INVALIDATION_KEY`
- **Purpose**: CloudFront/CDN cache invalidation
- **Where to get**: AWS CloudFront or CDN provider
- **Environments**: Production
- **Format**: Provider-specific API key

#### `ANALYTICS_API_KEY`
- **Purpose**: Google Analytics or similar service integration
- **Where to get**: Analytics provider dashboard
- **Environments**: Production
- **Format**: Provider-specific key format

#### `PAYMENT_API_KEY`
- **Purpose**: Payment processing integration (Stripe, PayPal, etc.)
- **Where to get**: Payment provider dashboard
- **Environments**: Production (use test keys for staging)
- **Format**: Provider-specific format

## 🌍 Environment Variables

### Core Application Variables

#### Staging Environment Variables
```bash
# Application Environment
NODE_ENV=staging
VITE_APP_ENV=staging
VITE_APP_VERSION=${{ github.sha }}

# API Configuration
VITE_APP_API_URL=https://api-staging.relife.com
VITE_APP_WS_URL=wss://ws-staging.relife.com

# Debug Settings
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
VITE_ENABLE_DEVTOOLS=true

# Feature Flags
VITE_FEATURE_ADVANCED_BATTLE=true
VITE_FEATURE_PREMIUM_THEMES=true
VITE_FEATURE_ANALYTICS=true
VITE_FEATURE_BETA_FEATURES=true

# Performance
VITE_ENABLE_PWA=false
VITE_ENABLE_SERVICE_WORKER=false
```

#### Production Environment Variables
```bash
# Application Environment
NODE_ENV=production
VITE_APP_ENV=production
VITE_APP_VERSION=${{ github.sha }}

# API Configuration
VITE_APP_API_URL=https://api.relife.com
VITE_APP_WS_URL=wss://ws.relife.com

# Production Settings
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
VITE_ENABLE_DEVTOOLS=false

# Feature Flags
VITE_FEATURE_ADVANCED_BATTLE=true
VITE_FEATURE_PREMIUM_THEMES=true
VITE_FEATURE_ANALYTICS=true
VITE_FEATURE_BETA_FEATURES=false

# Performance & PWA
VITE_ENABLE_PWA=true
VITE_ENABLE_SERVICE_WORKER=true
VITE_ENABLE_COMPRESSION=true
```

### Service-Specific Variables

#### AlarmService Configuration
```bash
# Alarm Settings
VITE_ALARM_MAX_DAILY_ALARMS=10
VITE_ALARM_SNOOZE_DURATION=300000  # 5 minutes in ms
VITE_ALARM_BATTLE_TIMEOUT=60000    # 1 minute in ms
VITE_ALARM_DEFAULT_VOLUME=0.7
```

#### VoiceService Configuration
```bash
# Voice Settings
VITE_VOICE_DEFAULT_ENGINE=web-speech
VITE_VOICE_CACHE_DURATION=3600000  # 1 hour in ms
VITE_VOICE_MAX_CACHE_SIZE=50       # Number of cached audio files
VITE_VOICE_FALLBACK_ENABLED=true
```

#### SubscriptionService Configuration
```bash
# Subscription Settings
VITE_SUBSCRIPTION_TRIAL_DAYS=7
VITE_SUBSCRIPTION_FREE_ALARM_LIMIT=3
VITE_SUBSCRIPTION_PREMIUM_PRICE=4.99
VITE_SUBSCRIPTION_CURRENCY=USD
```

## 🔧 Setup Instructions

### 1. Create Secrets in GitHub

```bash
# Using GitHub CLI
gh secret set CODECOV_TOKEN --body "your-codecov-token" --env staging
gh secret set CODECOV_TOKEN --body "your-codecov-token" --env production

gh secret set STAGING_DEPLOY_KEY --body "your-staging-key" --env staging
gh secret set PRODUCTION_DEPLOY_KEY --body "your-production-key" --env production

# Or via GitHub Web UI:
# Repository → Settings → Environments → [Environment] → Add secret
```

### 2. Configure Environment Variables

```bash
# Using GitHub CLI
gh variable set NODE_ENV --body "staging" --env staging
gh variable set NODE_ENV --body "production" --env production

# Or via GitHub Web UI:
# Repository → Settings → Environments → [Environment] → Add variable
```

### 3. Validate Configuration

Create a simple validation script:

```bash
#!/bin/bash
# validate-secrets.sh

echo "🔍 Validating CI/CD configuration..."

# Check required secrets exist
required_secrets=("CODECOV_TOKEN" "STAGING_DEPLOY_KEY" "PRODUCTION_DEPLOY_KEY")

for secret in "${required_secrets[@]}"; do
    if gh secret list | grep -q "$secret"; then
        echo "✅ $secret configured"
    else
        echo "❌ $secret missing"
    fi
done

echo "🌍 Environment validation complete"
```

## 🔄 Secret Rotation Schedule

### Monthly Rotation
- [ ] Deployment keys (if using tokens)
- [ ] API keys for external services

### Quarterly Rotation
- [ ] AWS credentials
- [ ] Database credentials
- [ ] SSL certificates check

### Annual Rotation
- [ ] Service account keys
- [ ] Long-term authentication tokens

### Emergency Rotation
- [ ] Any compromised secrets
- [ ] After team member departures
- [ ] Security incident response

## 🛡️ Security Best Practices

### Secret Management
1. **Never commit secrets to code**: Use environment variables only
2. **Use least privilege**: Grant minimal required permissions
3. **Regular rotation**: Follow the rotation schedule above
4. **Access logging**: Monitor who accesses secrets
5. **Backup strategy**: Securely backup critical secrets

### Environment Variables
1. **Environment separation**: Never share production secrets with staging
2. **Descriptive naming**: Use clear, consistent naming conventions
3. **Documentation**: Keep this document updated
4. **Validation**: Test that all variables are correctly set

## 🐛 Troubleshooting

### Common Issues

#### "Secret not found" errors
1. Check secret name spelling (case-sensitive)
2. Verify secret is set in correct environment
3. Ensure no extra whitespace in secret values

#### "Invalid credentials" errors
1. Verify secret values are current and valid
2. Check if secrets need rotation
3. Confirm service integrations are properly configured

#### Environment variable issues
1. Verify variable names match exactly in code
2. Check that variables are set in the correct environment
3. Ensure values don't contain special characters that need escaping

### Debug Commands

```bash
# List all secrets (names only, not values)
gh secret list

# List environment variables
gh variable list

# Check specific environment
gh environment view staging
gh environment view production

# Test deployment with debug output
gh workflow run "Enhanced Testing & Deployment Pipeline" --ref develop
```

## 📞 Support

For secrets and configuration issues:

1. **Documentation**: Check this guide and environment setup docs
2. **GitHub Actions logs**: Review workflow run details
3. **Provider documentation**: Consult service provider docs
4. **Team escalation**: Contact DevOps or platform team

---

**Security Notice**: Never share actual secret values. If you suspect a secret has been compromised, rotate it immediately and update all dependent systems.

*Last Updated: $(date)*
*Document Version: 1.0*