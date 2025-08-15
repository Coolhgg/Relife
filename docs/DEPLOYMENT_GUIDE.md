# Relife Smart Alarm - Comprehensive Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Performance Monitoring Setup](#performance-monitoring-setup)
7. [External Services Configuration](#external-services-configuration)
8. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
9. [SSL/TLS Configuration](#ssltls-configuration)
10. [Monitoring and Alerting](#monitoring-and-alerting)
11. [Backup and Recovery](#backup-and-recovery)
12. [Troubleshooting](#troubleshooting)
13. [Maintenance](#maintenance)
14. [Scaling](#scaling)

## Overview

This guide provides comprehensive instructions for deploying the Relife Smart Alarm application with full performance monitoring capabilities to production. The deployment includes:

- **Application Stack**: React frontend with TypeScript, Capacitor for mobile, Cloudflare Workers backend
- **Database**: Supabase (PostgreSQL) with enhanced schema for performance monitoring
- **Performance Monitoring**: Custom monitoring system with Web Vitals tracking
- **External Monitoring**: DataDog, New Relic, Prometheus, Grafana integration
- **Infrastructure**: Docker containerization with nginx, Redis, and monitoring stack
- **CI/CD**: GitHub Actions with automated testing and deployment

## Prerequisites

### System Requirements

**Minimum Production Requirements:**
- **CPU**: 4 cores (8 recommended)
- **Memory**: 8GB RAM (16GB recommended)
- **Storage**: 50GB SSD (100GB recommended)
- **Network**: 1Gbps connection
- **OS**: Ubuntu 22.04 LTS (or compatible Linux distribution)

### Required Accounts and Services

1. **GitHub Account** - For repository and CI/CD
2. **Cloudflare Account** - For Workers, DNS, and CDN
3. **Supabase Account** - For database services
4. **Docker Hub Account** - For container registry
5. **External Monitoring Services** (optional but recommended):
   - DataDog account
   - New Relic account
   - Sentry account
   - PostHog account

### Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com | sudo sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install bun (package manager)
curl -fsSL https://bun.sh/install | bash

# Install additional tools
sudo apt install -y git curl wget unzip jq htop nginx certbot python3-certbot-nginx
```

## Environment Setup

### 1. Environment Variables Configuration

Create environment files for different deployment stages:

#### Development Environment

Create `.env.development`:

```bash
# Application Configuration
NODE_ENV=development
ENVIRONMENT=development
PORT=3000
HOST=localhost

# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Performance Monitoring
PERFORMANCE_MONITORING_ENABLED=true
PERFORMANCE_ENDPOINTS=http://localhost:8080
PERFORMANCE_THRESHOLDS_LCP=4000
PERFORMANCE_THRESHOLDS_FID=200
PERFORMANCE_THRESHOLDS_CLS=0.2

# Analytics
POSTHOG_API_KEY=your_posthog_key
SENTRY_DSN=your_sentry_dsn

# Feature Flags
ENABLE_BATTLE_MODE=true
ENABLE_VOICE_COMMANDS=true
ENABLE_AI_INSIGHTS=false
ENABLE_PREMIUM_FEATURES=false

# Security
JWT_SECRET=your_development_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

#### Production Environment

Create `.env.production`:

```bash
# Application Configuration
NODE_ENV=production
ENVIRONMENT=production
PORT=443
HOST=relife.app

# Database Configuration
SUPABASE_URL=https://your-production-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_KEY=your_production_service_key

# Performance Monitoring
PERFORMANCE_MONITORING_ENABLED=true
PERFORMANCE_ENDPOINTS=https://api.relife.app
PERFORMANCE_THRESHOLDS_LCP=2500
PERFORMANCE_THRESHOLDS_FID=100
PERFORMANCE_THRESHOLDS_CLS=0.1

# Analytics and Monitoring
POSTHOG_API_KEY=your_production_posthog_key
SENTRY_DSN=your_production_sentry_dsn
DATADOG_API_KEY=your_datadog_key
NEWRELIC_LICENSE_KEY=your_newrelic_key
AMPLITUDE_API_KEY=your_amplitude_key

# External Service URLs
PROMETHEUS_URL=https://prometheus.relife.app
GRAFANA_URL=https://grafana.relife.app
ALERTMANAGER_URL=https://alerts.relife.app

# Security
JWT_SECRET=your_super_secure_production_jwt_secret
CORS_ORIGIN=https://relife.app,https://app.relife.app
SSL_ENABLED=true
HSTS_ENABLED=true

# Performance Optimization
CACHE_ENABLED=true
REDIS_URL=redis://redis:6379
CDN_URL=https://cdn.relife.app

# Feature Flags
ENABLE_BATTLE_MODE=true
ENABLE_VOICE_COMMANDS=true
ENABLE_AI_INSIGHTS=true
ENABLE_PREMIUM_FEATURES=true

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=900
RATE_LIMIT_MAX=1000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/relife/app.log
```

### 2. Secrets Management

For production, use a secrets management system:

```bash
# Install and configure secrets
mkdir -p /opt/relife/secrets

# Create secrets files (ensure proper permissions)
echo "your_jwt_secret" | sudo tee /opt/relife/secrets/jwt_secret
echo "your_db_password" | sudo tee /opt/relife/secrets/db_password

# Set proper permissions
sudo chmod 600 /opt/relife/secrets/*
sudo chown root:root /opt/relife/secrets/*
```

## Docker Deployment

### 1. Basic Docker Setup

```bash
# Clone the repository
git clone https://github.com/Coolhgg/Relife.git
cd Relife

# Copy environment configuration
cp .env.production .env

# Build and start services
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Docker Compose Production Configuration

The production docker-compose includes:

- **Application**: Main React app with nginx
- **API**: Cloudflare Workers local development
- **Database**: PostgreSQL with performance extensions
- **Cache**: Redis for session storage and caching
- **Monitoring Stack**: Prometheus, Grafana, Alertmanager
- **Log Management**: Fluentd for log aggregation

```bash
# Verify services are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f app
docker-compose -f docker-compose.prod.yml logs -f monitoring
```

### 3. Health Checks

```bash
# Run health check script
chmod +x scripts/check-monitoring-health.sh
./scripts/check-monitoring-health.sh

# Check individual services
curl http://localhost/api/health
curl http://localhost:9090/api/v1/status/config  # Prometheus
curl http://localhost:3000/api/health           # Grafana
```

## Production Deployment

### 1. Server Preparation

```bash
# Create application user
sudo useradd -m -s /bin/bash relife
sudo usermod -aG docker relife

# Create directory structure
sudo mkdir -p /opt/relife/{app,data,logs,backups,scripts}
sudo chown -R relife:relife /opt/relife

# Clone repository to production location
sudo -u relife git clone https://github.com/Coolhgg/Relife.git /opt/relife/app
```

### 2. Nginx Configuration

```bash
# Install nginx
sudo apt install nginx

# Copy nginx configuration
sudo cp /opt/relife/app/config/nginx/nginx-ssl.conf /etc/nginx/sites-available/relife
sudo ln -s /etc/nginx/sites-available/relife /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Enable and start nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 3. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificates
sudo certbot --nginx -d relife.app -d www.relife.app -d api.relife.app

# Verify auto-renewal
sudo certbot renew --dry-run

# Create renewal hook for nginx reload
sudo sh -c 'echo "systemctl reload nginx" > /etc/letsencrypt/renewal-hooks/deploy/nginx-reload'
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload
```

### 4. Database Setup

```bash
# Configure Supabase connection
cd /opt/relife/app

# Run database migrations
npx supabase db push

# Seed initial data (if needed)
npx supabase db reset --seed

# Verify database connection
npm run db:test
```

### 5. Application Deployment

```bash
# Switch to relife user
sudo -u relife -s

cd /opt/relife/app

# Install dependencies
bun install

# Build application for production
bun run build

# Build Docker images
docker build -t relife:latest .

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
curl -f https://relife.app/api/health
```

## Performance Monitoring Setup

### 1. Install Monitoring Stack

```bash
# Run the comprehensive monitoring setup script
chmod +x scripts/setup-monitoring.sh
sudo ./scripts/setup-monitoring.sh
```

This script will:
- Install and configure Prometheus
- Set up Grafana with dashboards
- Configure Alertmanager
- Install DataDog and New Relic agents
- Create health check and maintenance scripts

### 2. Configure Performance Monitoring

```bash
# Verify performance monitoring endpoints
curl https://api.relife.app/api/performance/health
curl https://api.relife.app/api/performance/system-health

# Test performance data collection
curl -X POST https://api.relife.app/api/performance/web-vitals \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session",
    "url": "https://relife.app",
    "lcp": 1500,
    "fid": 50,
    "cls": 0.05,
    "device_type": "desktop",
    "timestamp": "'$(date -Iseconds)'"
  }'
```

### 3. Dashboard Access

Once deployed, access monitoring dashboards at:

- **Grafana**: https://grafana.relife.app (admin/admin - change on first login)
- **Prometheus**: https://prometheus.relife.app
- **Alertmanager**: https://alerts.relife.app

## External Services Configuration

### 1. DataDog Setup

```bash
# DataDog agent is installed by setup-monitoring.sh
# Verify DataDog agent status
sudo datadog-agent status

# Create custom dashboards
python3 scripts/create-datadog-dashboards.py

# Test DataDog integration
curl -X POST https://api.relife.app/api/external-monitoring/datadog/metrics \
  -H "Content-Type: application/json" \
  -d '[{
    "name": "test.metric",
    "value": 100,
    "device_type": "desktop",
    "tags": ["environment:production"]
  }]'
```

### 2. New Relic Configuration

```bash
# Verify New Relic agent
systemctl status newrelic-infra
newrelic-infra -version

# Test New Relic integration
curl -X POST https://api.relife.app/api/external-monitoring/newrelic/events \
  -H "Content-Type: application/json" \
  -d '[{
    "event_name": "test_event",
    "properties": {
      "test": "value"
    },
    "timestamp": "'$(date -Iseconds)'"
  }]'
```

### 3. Cloudflare Workers Deployment

```bash
# Install Wrangler CLI
npm install -g @cloudflare/wrangler

# Login to Cloudflare
wrangler login

# Deploy API worker
cd src/backend
wrangler deploy api.ts

# Deploy monitoring integration worker
wrangler deploy monitoring-integration.ts

# Set up environment variables in Cloudflare dashboard
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put JWT_SECRET
```

## CI/CD Pipeline Setup

### 1. GitHub Actions Configuration

The CI/CD pipeline is already configured in `.github/workflows/deploy-production.yml`. To set it up:

```bash
# Go to GitHub repository settings -> Secrets and variables -> Actions
# Add the following secrets:

SUPABASE_URL=your_production_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
CLOUDFLARE_API_TOKEN=your_cloudflare_token
DOCKERHUB_USERNAME=your_dockerhub_username
DOCKERHUB_TOKEN=your_dockerhub_token
PRODUCTION_SERVER_HOST=your_server_ip
PRODUCTION_SERVER_USER=relife
PRODUCTION_SSH_KEY=your_private_ssh_key
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### 2. Manual Deployment Trigger

```bash
# Trigger production deployment
gh workflow run deploy-production.yml \
  --ref main \
  -f environment=production \
  -f run_tests=true
```

### 3. Deployment Pipeline Stages

1. **Security Scanning** - Snyk vulnerability scanning
2. **Testing** - Unit, integration, and E2E tests
3. **Building** - Multi-platform Docker images
4. **Staging Deployment** - Deploy to staging environment
5. **Smoke Tests** - Verify staging deployment
6. **Production Deployment** - Deploy to production
7. **Post-Deployment Verification** - Performance audits and health checks

## SSL/TLS Configuration

### 1. Certificate Management

```bash
# Certificates are auto-managed by Certbot
# Verify certificate status
sudo certbot certificates

# Manual renewal (if needed)
sudo certbot renew

# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/relife.app/cert.pem -text -noout | grep -A 2 "Validity"
```

### 2. Security Headers

The nginx configuration includes security headers:

```nginx
# Security headers are configured in config/nginx/nginx-ssl.conf
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

### 3. SSL Testing

```bash
# Test SSL configuration
curl -I https://relife.app
curl -I https://api.relife.app

# Check SSL Labs rating
curl -s "https://api.ssllabs.com/api/v3/analyze?host=relife.app" | jq '.status'
```

## Monitoring and Alerting

### 1. Alert Configuration

Alerts are configured in `monitoring/prometheus/alerts/performance.yml` and include:

- **Performance Alerts**: Web Vitals thresholds, response time, error rates
- **Infrastructure Alerts**: CPU, memory, disk usage, service availability
- **Business Logic Alerts**: Alarm trigger failures, user experience metrics

### 2. Notification Channels

Configure notification channels in Alertmanager:

```yaml
# Slack notifications
slack_configs:
  - channel: '#alerts-critical'
    webhook_url: '${SLACK_WEBHOOK_URL}'

# Email notifications  
email_configs:
  - to: 'engineering@relife.app'
    from: 'alerts@relife.app'

# PagerDuty integration
pagerduty_configs:
  - routing_key: '${PAGERDUTY_ROUTING_KEY}'
```

### 3. Custom Metrics

Monitor custom business metrics:

```javascript
// Track alarm success rate
fetch('/api/performance/analytics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_name: 'alarm_triggered',
    session_id: sessionId,
    properties: {
      alarm_id: alarmId,
      success: true,
      response_time: responseTime
    }
  })
});
```

## Backup and Recovery

### 1. Automated Backups

```bash
# Create backup script
cat > /opt/relife/scripts/backup.sh << 'EOF'
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/relife/backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Database backup
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database.sql"

# Configuration backup
tar -czf "$BACKUP_DIR/config.tar.gz" /etc/nginx /etc/prometheus /etc/grafana

# Application data backup
tar -czf "$BACKUP_DIR/data.tar.gz" /opt/relife/data

# Upload to cloud storage (implement based on your provider)
# aws s3 sync "$BACKUP_DIR" s3://relife-backups/$(date +%Y%m%d)/

# Cleanup old backups (keep 30 days)
find /opt/relife/backups -mtime +30 -type d -exec rm -rf {} \;
EOF

chmod +x /opt/relife/scripts/backup.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/relife/scripts/backup.sh") | crontab -
```

### 2. Recovery Procedures

```bash
# Database recovery
psql "$DATABASE_URL" < /path/to/backup/database.sql

# Configuration recovery
tar -xzf /path/to/backup/config.tar.gz -C /

# Application data recovery
tar -xzf /path/to/backup/data.tar.gz -C /opt/relife/

# Restart services
docker-compose -f docker-compose.prod.yml restart
systemctl restart nginx prometheus grafana-server
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start

**Symptoms**: 502 Bad Gateway, connection refused

**Solutions**:
```bash
# Check Docker containers
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs app

# Check nginx configuration
sudo nginx -t
sudo systemctl status nginx

# Verify environment variables
docker-compose -f docker-compose.prod.yml exec app env | grep -E "(DATABASE|API|NODE_ENV)"

# Check disk space
df -h
```

#### 2. High Memory Usage

**Symptoms**: OutOfMemory errors, slow response times

**Solutions**:
```bash
# Check memory usage
free -h
docker stats

# Optimize Docker containers
docker system prune -f
docker-compose -f docker-compose.prod.yml restart

# Adjust container memory limits in docker-compose.prod.yml
```

#### 3. Database Connection Issues

**Symptoms**: Database connection errors, timeout errors

**Solutions**:
```bash
# Check database connectivity
pg_isready -h your-db-host -p 5432

# Verify connection string
echo $SUPABASE_URL

# Check connection pools
docker-compose -f docker-compose.prod.yml logs app | grep -i "database\|connection"

# Test connection manually
psql "$SUPABASE_URL" -c "SELECT version();"
```

#### 4. Performance Monitoring Issues

**Symptoms**: Missing metrics, dashboard not loading

**Solutions**:
```bash
# Check monitoring services
systemctl status prometheus grafana-server alertmanager

# Verify endpoints
curl http://localhost:9090/-/healthy
curl http://localhost:3000/api/health

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Restart monitoring stack
scripts/monitoring-maintenance.sh update
```

#### 5. SSL Certificate Issues

**Symptoms**: SSL certificate warnings, HTTPS not working

**Solutions**:
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew --force-renewal

# Check nginx SSL configuration
sudo nginx -t
openssl s_client -connect relife.app:443 -servername relife.app
```

### Debugging Commands

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100 app

# System resource usage
htop
iotop
nethogs

# Network connectivity
netstat -tlnp | grep :80
netstat -tlnp | grep :443
ss -tlnp

# Service status
systemctl status nginx
systemctl status docker
systemctl --failed

# Disk usage
du -sh /opt/relife/*
docker system df
```

## Maintenance

### 1. Regular Maintenance Tasks

Create a maintenance checklist and schedule:

```bash
# Weekly maintenance (run scripts/monitoring-maintenance.sh)
- Update system packages
- Check disk usage and cleanup
- Verify backup integrity
- Review performance metrics
- Check security alerts

# Monthly maintenance
- Update application dependencies
- Review and rotate logs
- Test disaster recovery procedures
- Security audit and updates
- Performance optimization review
```

### 2. Update Procedures

```bash
# Application updates
cd /opt/relife/app
git pull origin main
bun install
bun run build
docker-compose -f docker-compose.prod.yml up -d --build

# System updates
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y

# Docker updates
sudo apt update docker-ce docker-ce-cli containerd.io
docker-compose down && docker-compose -f docker-compose.prod.yml up -d
```

### 3. Performance Tuning

```bash
# Optimize nginx
sudo nginx -s reload

# Optimize Docker
docker system prune -a
docker volume prune

# Database maintenance
psql "$DATABASE_URL" -c "VACUUM ANALYZE;"

# Redis optimization
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Scaling

### 1. Horizontal Scaling

For high-traffic scenarios:

```bash
# Load balancer configuration (nginx upstream)
upstream relife_app {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

# Database read replicas
# Configure in Supabase dashboard or use connection pooling

# CDN setup
# Configure Cloudflare CDN for static assets
```

### 2. Vertical Scaling

```bash
# Increase server resources
# - CPU: 4+ cores recommended
# - Memory: 16GB+ for high traffic
# - Storage: SSD with 100GB+ space

# Optimize Docker resources
# Edit docker-compose.prod.yml:
services:
  app:
    mem_limit: 4g
    cpus: 2.0
```

### 3. Monitoring Scaling

```bash
# Increase Prometheus retention
# Edit /etc/prometheus/prometheus.yml:
global:
  evaluation_interval: 15s
  scrape_interval: 15s

# Add more monitoring targets
# Configure service discovery for auto-scaling
```

## Security Checklist

### Production Security Verification

- [ ] SSL/TLS certificates installed and auto-renewing
- [ ] Security headers configured in nginx
- [ ] Firewall configured (UFW or iptables)
- [ ] Regular security updates scheduled
- [ ] Secrets properly managed (not in plain text)
- [ ] Database access restricted
- [ ] Monitoring and alerting for security events
- [ ] Backup encryption enabled
- [ ] Access logs monitored
- [ ] Rate limiting configured

### Security Commands

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Check open ports
nmap localhost

# Review access logs
tail -f /var/log/nginx/access.log
tail -f /var/log/auth.log
```

## Support and Resources

### Documentation
- [Supabase Documentation](https://supabase.io/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Docker Documentation](https://docs.docker.com/)
- [Prometheus Documentation](https://prometheus.io/docs/)

### Monitoring Resources
- [Web Vitals Documentation](https://web.dev/vitals/)
- [DataDog Documentation](https://docs.datadoghq.com/)
- [New Relic Documentation](https://docs.newrelic.com/)

### Emergency Contacts
- **Technical Issues**: Create GitHub issues
- **Security Issues**: Email security@relife.app
- **Infrastructure Issues**: Check monitoring dashboards first

---

This deployment guide provides comprehensive coverage of deploying Relife Smart Alarm with full performance monitoring capabilities. For additional support or custom deployment scenarios, refer to the troubleshooting section or create an issue in the project repository.