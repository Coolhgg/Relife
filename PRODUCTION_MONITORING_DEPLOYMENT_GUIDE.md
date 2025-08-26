# 🚀 Relife Smart Alarm - Production Monitoring Deployment Guide

This comprehensive guide will walk you through deploying the complete monitoring system to your
production infrastructure.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup Process](#detailed-setup-process)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Server Requirements

**Minimum Hardware:**

- **CPU:** 4 cores
- **RAM:** 8GB
- **Storage:** 100GB SSD
- **Network:** 1Gbps connection

**Recommended Hardware:**

- **CPU:** 8 cores
- **RAM:** 16GB
- **Storage:** 200GB SSD
- **Network:** 1Gbps+ connection with good latency

### Software Requirements

```bash
# Ubuntu 20.04+ or similar Linux distribution
# Docker Engine 20.10+
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 2.0+
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Additional utilities
sudo apt-get install -y curl wget jq openssl
```

### Domain Setup

You'll need the following subdomains pointing to your server:

- `prometheus.yourdomain.com` - Prometheus metrics database
- `grafana.yourdomain.com` - Dashboard interface
- `alertmanager.yourdomain.com` - Alert management

**DNS Configuration Example:**

```
A record: prometheus.relife.app → YOUR_SERVER_IP
A record: grafana.relife.app → YOUR_SERVER_IP
A record: alertmanager.relife.app → YOUR_SERVER_IP
```

---

## ⚡ Quick Start

For experienced users who want to deploy immediately:

```bash
# 1. Clone and setup
cd /path/to/your/relife/project

# 2. Configure webhooks and notifications
./monitoring/scripts/setup-webhooks.sh

# 3. Review and customize .env.production
nano .env.production

# 4. Deploy monitoring stack
./monitoring/scripts/deploy-production.sh

# 5. Access your dashboards
# Grafana: https://grafana.yourdomain.com
# Prometheus: https://prometheus.yourdomain.com
```

---

## 📝 Detailed Setup Process

### Step 1: Notification Channels Setup

Before deployment, configure your notification channels to receive alerts.

#### Option A: Interactive Setup (Recommended)

```bash
cd /path/to/your/relife/project
./monitoring/scripts/setup-webhooks.sh
```

This interactive script will guide you through:

- ✅ Slack webhook configuration
- ✅ Discord webhook setup
- ✅ Email/SMTP configuration
- ✅ PagerDuty integration
- ✅ Automatic environment file generation

#### Option B: Manual Configuration

**Slack Setup:**

1. Go to https://api.slack.com/messaging/webhooks
2. Create a new Slack app for your workspace
3. Enable "Incoming Webhooks"
4. Create webhooks for your alert channels:
   - `#critical-alerts` - Critical system issues
   - `#monitoring-alerts` - General monitoring notifications
   - `#monitoring-info` - Informational updates

**Discord Setup:**

1. Go to your Discord server
2. Right-click the channel → Edit Channel → Integrations → Webhooks
3. Create webhook named "Relife Monitoring"
4. Copy the webhook URL

**Email Setup:**

- **Gmail:** Use App Passwords (smtp.gmail.com:587)
- **Office 365:** Use standard credentials (smtp.office365.com:587)
- **SendGrid:** Use API key as password (smtp.sendgrid.net:587)

### Step 2: Environment Configuration

#### Copy and Configure Environment File

```bash
# Copy the template
cp monitoring/.env.production.template .env.production

# Edit with your values
nano .env.production
```

#### Critical Configuration Values

**🔐 Security Settings:**

```bash
# Generate secure passwords
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 32)
WEBHOOK_AUTH_TOKEN=$(openssl rand -base64 48)
```

**🌐 Domain Configuration:**

```bash
RELIFE_DOMAIN=yourdomain.com
PROMETHEUS_DOMAIN=prometheus.yourdomain.com
GRAFANA_DOMAIN=grafana.yourdomain.com
ALERTMANAGER_DOMAIN=alertmanager.yourdomain.com
```

**📊 Database Configuration:**

```bash
POSTGRES_HOST=your_postgres_server
GRAFANA_DB_NAME=grafana
GRAFANA_DB_USER=grafana
GRAFANA_DB_PASSWORD=your_secure_db_password
```

**🔔 Notification URLs:**

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK
PAGERDUTY_ROUTING_KEY_CRITICAL=your_pagerduty_key
```

#### Alert Thresholds Customization

Adjust these based on your application's baseline metrics:

```bash
# Business Metrics
DAU_WARNING_THRESHOLD=1000
DAU_CRITICAL_THRESHOLD=500
DAILY_REVENUE_WARNING_THRESHOLD=100
CHURN_RATE_WARNING=10.0
ALARM_SUCCESS_RATE_WARNING=80.0

# Performance Metrics
RESPONSE_TIME_WARNING=2000  # milliseconds
ERROR_RATE_WARNING=5.0      # percentage
MOBILE_CRASH_RATE_WARNING=1.0

# SLA Targets
UPTIME_TARGET_PUBLIC=99.9
UPTIME_TARGET_PREMIUM=99.95
```

### Step 3: SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)

```bash
# Set in .env.production
LETSENCRYPT_EMAIL=admin@yourdomain.com

# The deployment script will automatically generate certificates
```

#### Option B: Custom Certificates

```bash
# Place your certificates at:
sudo mkdir -p /etc/ssl/certs /etc/ssl/private
sudo cp yourdomain.com.crt /etc/ssl/certs/
sudo cp yourdomain.com.key /etc/ssl/private/
sudo chmod 600 /etc/ssl/private/yourdomain.com.key
```

---

## 🚀 Deployment

### Automated Deployment

The deployment script handles everything automatically:

```bash
# Make sure you're in the project root
cd /path/to/your/relife/project

# Run the production deployment
./monitoring/scripts/deploy-production.sh
```

**The script will:**

1. ✅ Validate prerequisites and configuration
2. ✅ Set up infrastructure and networks
3. ✅ Configure SSL certificates
4. ✅ Create backups of existing data
5. ✅ Deploy all monitoring services
6. ✅ Run health checks and validation
7. ✅ Configure dashboards and alerts
8. ✅ Test notification channels
9. ✅ Set up automated backups and maintenance
10. ✅ Generate deployment report

### Manual Deployment Steps

If you prefer manual control:

```bash
# 1. Create Docker network
docker network create relife-network

# 2. Copy environment file
cp .env.production .env

# 3. Build custom images
docker-compose -f docker-compose.monitoring.yml build

# 4. Start services
docker-compose -f docker-compose.monitoring.yml up -d

# 5. Check service health
docker-compose -f docker-compose.monitoring.yml ps
```

---

## 🎯 Post-Deployment

### Immediate Access

After successful deployment, access your monitoring interfaces:

| Service          | URL                                 | Default Login                |
| ---------------- | ----------------------------------- | ---------------------------- |
| **Grafana**      | https://grafana.yourdomain.com      | admin / [generated_password] |
| **Prometheus**   | https://prometheus.yourdomain.com   | No auth required             |
| **AlertManager** | https://alertmanager.yourdomain.com | No auth required             |

### Initial Dashboard Setup

1. **Log into Grafana**

   ```
   URL: https://grafana.yourdomain.com
   Username: admin
   Password: [check .env.production or deployment report]
   ```

2. **Import Enhanced Dashboard**
   - Go to Dashboards → Browse
   - The "Relife Smart Alarm - Enhanced Monitoring" dashboard should be automatically imported
   - If not, manually import `monitoring/grafana/enhanced-dashboard.json`

3. **Configure Data Sources**
   - Prometheus should be automatically configured at http://prometheus:9090
   - Test the connection in Configuration → Data Sources

### Alert Testing

Test your alert channels:

```bash
# Run webhook tests
./monitoring/scripts/setup-webhooks.sh
# Choose option 7: Test existing webhooks

# Or manually test alerts
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{"labels":{"alertname":"test","severity":"warning"}}]'
```

### Team Access Setup

1. **Create Grafana Teams**
   - Go to Configuration → Teams
   - Create teams: "Developers", "DevOps", "Business"
   - Assign appropriate dashboard permissions

2. **Share Credentials Securely**
   - Use your organization's secret management system
   - Share Grafana password through secure channels
   - Consider setting up LDAP/SSO integration

---

## 📊 Monitoring & Maintenance

### Health Monitoring

The system includes automated health monitoring:

```bash
# Manual health check
./monitoring/scripts/health-check.sh

# View service logs
docker-compose -f docker-compose.monitoring.yml logs [service-name]

# Check resource usage
docker stats
```

### Automated Backups

Backups run automatically based on your `BACKUP_SCHEDULE`:

```bash
# Manual backup
./monitoring/scripts/backup-monitoring.sh

# View backup status
ls -la /var/backups/relife-monitoring/

# Restore from backup (if needed)
# 1. Stop services
docker-compose -f docker-compose.monitoring.yml down

# 2. Restore data volumes
docker run --rm -v relife_prometheus-data:/data -v /path/to/backup:/backup \
  alpine tar xzf /backup/prometheus-data.tar.gz -C /data

# 3. Start services
docker-compose -f docker-compose.monitoring.yml up -d
```

### Performance Monitoring

Monitor the monitoring system itself:

```bash
# Resource usage dashboard
docker system df
docker system prune  # Clean up if needed

# Service performance
curl -s http://localhost:9090/api/v1/query?query=prometheus_build_info
curl -s http://localhost:3000/api/health
```

### Regular Maintenance Tasks

**Weekly:**

- [ ] Review alert trends in Grafana
- [ ] Check disk usage and clean up if needed
- [ ] Validate backup integrity
- [ ] Review business metrics for anomalies

**Monthly:**

- [ ] Update Docker images to latest stable versions
- [ ] Review and adjust alert thresholds
- [ ] Analyze monitoring system performance
- [ ] Update SSL certificates if needed
- [ ] Review team access and permissions

**Quarterly:**

- [ ] Full security audit of monitoring system
- [ ] Review and update alert runbooks
- [ ] Capacity planning based on growth trends
- [ ] Disaster recovery testing

---

## 🔧 Troubleshooting

### Common Issues

**1. Services Not Starting**

```bash
# Check Docker logs
docker-compose -f docker-compose.monitoring.yml logs

# Check system resources
free -h
df -h

# Restart problematic service
docker-compose -f docker-compose.monitoring.yml restart [service-name]
```

**2. SSL Certificate Issues**

```bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/yourdomain.com.crt -text -noout

# Renew Let's Encrypt certificates
sudo certbot renew

# Test certificate setup
curl -I https://grafana.yourdomain.com
```

**3. Alerts Not Firing**

```bash
# Check AlertManager status
curl http://localhost:9093/api/v1/status

# Check Prometheus rules
curl http://localhost:9090/api/v1/rules

# Test alert rules manually
curl -X POST http://localhost:9090/api/v1/admin/tsdb/delete_series \
  -d 'match[]=up{job="prometheus"}'
```

**4. Dashboard Not Loading**

```bash
# Check Grafana logs
docker logs relife-grafana

# Check database connection
docker exec relife-grafana grafana-cli admin reset-admin-password newpassword

# Clear browser cache and try again
```

**5. High Resource Usage**

```bash
# Check Prometheus storage usage
du -sh /var/lib/docker/volumes/relife_prometheus-data/

# Adjust retention policy in prometheus.yml
--storage.tsdb.retention.time=30d

# Restart Prometheus
docker-compose -f docker-compose.monitoring.yml restart prometheus
```

### Getting Help

**1. Check Logs First**

```bash
# All services
docker-compose -f docker-compose.monitoring.yml logs

# Specific service
docker-compose -f docker-compose.monitoring.yml logs grafana
```

**2. Run Diagnostics**

```bash
./monitoring/scripts/health-check.sh
```

**3. Review Configuration**

```bash
# Check environment variables
grep -v '^#\|^$' .env.production

# Validate Docker Compose configuration
docker-compose -f docker-compose.monitoring.yml config
```

---

## 📚 Additional Resources

### Documentation

- [Alert Response Runbooks](monitoring/runbooks/alert-response-guide.md)
- [Grafana Dashboard Guide](MONITORING_ALERTS_SETUP_COMPLETE.md)
- [Business Metrics Documentation](monitoring/prometheus/alerts/business-metrics.yml)

### External Links

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)

### Community

- [Prometheus Community](https://prometheus.io/community/)
- [Grafana Community](https://community.grafana.com/)

---

## ✅ Deployment Checklist

Before going live, ensure you've completed:

### Pre-Deployment

- [ ] Server meets minimum hardware requirements
- [ ] DNS records configured for monitoring subdomains
- [ ] SSL certificates available or Let's Encrypt configured
- [ ] Notification channels (Slack/Discord/Email) set up and tested
- [ ] Database credentials configured
- [ ] Environment file (.env.production) fully configured
- [ ] Alert thresholds customized for your application

### During Deployment

- [ ] Deployment script runs without errors
- [ ] All services pass health checks
- [ ] SSL certificates are valid and trusted
- [ ] Grafana dashboard loads correctly
- [ ] Prometheus is collecting metrics
- [ ] AlertManager can send test notifications

### Post-Deployment

- [ ] Team has access to Grafana dashboards
- [ ] Alert channels are receiving test messages
- [ ] Backup system is functioning
- [ ] Monitoring system itself is being monitored
- [ ] Documentation shared with team
- [ ] Incident response procedures established

---

## 🎉 Success!

Your comprehensive monitoring system is now deployed and protecting your Relife Smart Alarm
application!

**What you now have:**

- 📊 Real-time business intelligence dashboards
- 🔔 Proactive alerting for critical issues
- 📱 Mobile app performance monitoring
- 🛡️ Security threat detection
- 📈 SLA compliance tracking
- 🔄 Automated backup and recovery
- 📋 Comprehensive alert runbooks

**Next steps:**

1. Monitor the dashboards for the first few days to establish baselines
2. Fine-tune alert thresholds based on actual usage patterns
3. Train your team on the new monitoring capabilities
4. Set up regular review cycles for monitoring effectiveness

Your application is now enterprise-ready with comprehensive observability! 🚀
