# 🌍 Environment Setup Guide

This guide explains how to configure GitHub Environments for the Relife project's CI/CD pipeline.

## Overview

Our CI/CD pipeline uses two environments:
- **Staging** (`staging`): Automatic deployments from `develop` branch
- **Production** (`production`): Protected deployments from `main` branch

## GitHub Environment Configuration

### 1. Create Environments

Navigate to your GitHub repository → Settings → Environments → New environment

#### Staging Environment Setup

1. **Environment Name**: `staging`
2. **Deployment branches**: Add rule for `develop` branch
3. **Environment secrets**: Configure required secrets (see below)
4. **Environment variables**: Set staging-specific variables

#### Production Environment Setup

1. **Environment Name**: `production`
2. **Deployment protection rules**:
   - ✅ Required reviewers: 2 people
   - ✅ Prevent self-review
   - ✅ Wait timer: 5 minutes
3. **Deployment branches**: Restrict to `main` branch only
4. **Environment secrets**: Configure required secrets (see below)
5. **Environment variables**: Set production-specific variables

### 2. Required Secrets Configuration

Configure these secrets in each environment:

#### Core Deployment Secrets
```
STAGING_DEPLOY_KEY          # SSH key or token for staging deployment
PRODUCTION_DEPLOY_KEY       # SSH key or token for production deployment
CODECOV_TOKEN              # Code coverage reporting token
```

#### Service Integration Secrets
```
SENTRY_DSN_STAGING         # Staging error tracking
SENTRY_DSN_PRODUCTION      # Production error tracking
FIREBASE_CONFIG_STAGING    # Firebase staging config JSON
FIREBASE_CONFIG_PRODUCTION # Firebase production config JSON
```

#### Cloud Provider Secrets (if using AWS)
```
AWS_ACCESS_KEY_ID          # AWS access key
AWS_SECRET_ACCESS_KEY      # AWS secret key
AWS_REGION                 # AWS region (e.g., us-east-1)
```

#### Optional Secrets
```
SSL_CERTIFICATE            # Custom SSL certificate
CDN_INVALIDATION_KEY       # CDN cache invalidation
ANALYTICS_API_KEY          # Analytics service key
PAYMENT_API_KEY            # Payment processing key
```

### 3. Environment Variables Configuration

#### Staging Variables
```
NODE_ENV=staging
VITE_APP_ENV=staging
VITE_APP_API_URL=https://api-staging.relife.com
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
VITE_FEATURE_ADVANCED_BATTLE=true
VITE_FEATURE_PREMIUM_THEMES=true
VITE_FEATURE_ANALYTICS=true
```

#### Production Variables
```
NODE_ENV=production
VITE_APP_ENV=production
VITE_APP_API_URL=https://api.relife.com
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
VITE_ENABLE_PWA=true
VITE_ENABLE_SERVICE_WORKER=true
VITE_FEATURE_ADVANCED_BATTLE=true
VITE_FEATURE_PREMIUM_THEMES=true
VITE_FEATURE_ANALYTICS=true
```

## Deployment Configuration

### Staging Deployment

- **Trigger**: Automatic on `develop` branch push
- **Requirements**: Tests pass, security scan clean, mobile build success
- **Protection**: None (fast iteration)
- **URL**: `https://relife-staging.yourdomain.com`

### Production Deployment

- **Trigger**: Automatic on `main` branch push (after review approval)
- **Requirements**: All quality gates + reviewer approval
- **Protection**: 2 required reviewers + 5-minute wait timer
- **Strategy**: Blue-green deployment with canary rollout
- **URL**: `https://relife.yourdomain.com`

## Health Checks

Both environments include automated health checks:

### Staging Health Check
```yaml
URL: https://relife-staging.yourdomain.com/api/health
Timeout: 30s
Retries: 3
Expected Status: 200
```

### Production Health Check
```yaml
URL: https://relife.yourdomain.com/api/health
Timeout: 10s
Retries: 5
Expected Status: 200
Interval: 30s
```

## Performance Monitoring

### Staging Performance Budget
- First Contentful Paint (FCP): < 2s
- Largest Contentful Paint (LCP): < 3s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms

### Production Performance Budget (Stricter)
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.05
- First Input Delay (FID): < 50ms

## Rollback Strategy

### Automatic Rollback Triggers
- Health check failures
- Error rate > 1% (production)
- Performance degradation > 20%
- Critical security alerts

### Manual Rollback Process
1. Navigate to GitHub Actions
2. Find the failed deployment workflow
3. Use the "Rollback" action (if available)
4. Or manually trigger deployment of previous successful commit

## Troubleshooting

### Common Issues

#### 1. Deployment Fails with "Environment not found"
**Solution**: Ensure environment names match exactly: `staging` and `production`

#### 2. "Required reviewers not met"
**Solution**: Have 2 different team members approve the production deployment

#### 3. Health check timeouts
**Solution**:
- Verify the health check URL is accessible
- Check application startup time
- Review server capacity and performance

#### 4. Secret not found errors
**Solution**:
- Verify secret names match exactly (case-sensitive)
- Ensure secrets are configured in the correct environment
- Check secret values don't contain extra whitespace

### Debug Commands

```bash
# Test health endpoint locally
curl -I https://relife-staging.yourdomain.com/api/health

# Check deployment logs
gh run list --workflow="Enhanced Testing & Deployment Pipeline"
gh run view [RUN_ID] --log

# Verify environment configuration
gh environment list
gh environment view staging
gh environment view production
```

## Security Considerations

1. **Secret Rotation**: Regularly rotate all secrets (quarterly recommended)
2. **Access Control**: Limit who can modify environments and secrets
3. **Audit Logs**: Monitor environment access and changes
4. **Least Privilege**: Only grant necessary permissions
5. **Backup Secrets**: Securely backup critical secrets

## Monitoring and Alerts

### Key Metrics to Monitor
- Deployment success rate
- Application uptime
- Response times
- Error rates
- Security scan results

### Alert Channels
- GitHub Actions notifications
- Email alerts for production issues
- Slack/Discord webhooks (optional)
- Sentry error tracking

## Next Steps

After configuring environments:

1. ✅ Test staging deployment with a feature branch
2. ✅ Verify health checks work correctly
3. ✅ Test production deployment process (with reviewers)
4. ✅ Set up monitoring dashboards
5. ✅ Train team on deployment and rollback procedures

## Support

For environment setup issues:
1. Check this documentation first
2. Review GitHub Actions logs
3. Verify secret and variable configuration
4. Test with a simple deployment
5. Contact DevOps team if needed

---

*Last Updated: $(date)*
*Pipeline Version: Enhanced CI/CD v1.0*