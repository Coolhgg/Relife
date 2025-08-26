# 🚀 Production Monitoring Deployment - Step-by-Step Walkthrough

This guide will walk you through deploying your comprehensive monitoring system to production in
approximately 30 minutes.

## 📋 Prerequisites Checklist

Before we start, ensure you have:

### Server Requirements

- **Server:** Ubuntu 20.04+ with root/sudo access
- **CPU:** 4+ cores, **RAM:** 8GB+, **Storage:** 100GB+ SSD
- **Network:** Public IP with domain access

### Required Information

- **Domain name** (e.g., `relife.app`)
- **Notification preferences** (Slack, Discord, Email, PagerDuty)
- **Database credentials** (for Grafana storage)
- **Supabase credentials** (for business metrics)

---

## 🎯 Step 1: Server Preparation

### Connect to Your Production Server

```bash
ssh user@your-production-server.com
```

### Install Required Dependencies

```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin -y

# Install utilities
sudo apt-get install -y curl wget jq openssl git

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

**Expected Output:**

```
Docker version 24.0.x
Docker Compose version v2.x.x
```

### Clone Your Repository

```bash
# Navigate to your preferred directory
cd /opt

# Clone the repository
sudo git clone https://github.com/Coolhgg/Relife.git
sudo chown -R $USER:$USER Relife

# Navigate to project
cd Relife
```

---

## 🔔 Step 2: Configure Notification Channels

This step sets up where you'll receive monitoring alerts.

### Run the Interactive Webhook Setup

```bash
./monitoring/scripts/setup-webhooks.sh
```

You'll see a menu like this:

```
🔧 Relife Monitoring Webhook Setup
====================================

Choose setup option:
1) Complete setup (Slack + Discord + Email + PagerDuty)
2) Slack only
3) Discord only
4) Email only
5) PagerDuty only
6) Generate environment file from existing config
7) Test existing webhooks
8) Exit

Select option (1-8):
```

### Option A: Complete Setup (Recommended)

**Choose option 1** for full notification coverage.

#### Configure Slack (5 minutes)

The script will prompt you:

```
🔧 Setting up Slack Integration
==================================

To set up Slack alerts:
1. Go to https://api.slack.com/messaging/webhooks
2. Click 'Create your Slack app'
3. Choose 'From scratch'
4. Name your app 'Relife Monitoring' and select your workspace
5. Go to 'Incoming Webhooks' and activate them
6. Click 'Add New Webhook to Workspace'
7. Select the channel for alerts (e.g., #critical-alerts)
8. Copy the webhook URL

Enter your Slack webhook URL (or press Enter to skip):
```

**Steps to get Slack webhook:**

1. Open https://api.slack.com/messaging/webhooks in new tab
2. Click "Create your Slack app"
3. Choose "From scratch"
4. App name: `Relife Monitoring`
5. Select your workspace
6. Go to "Incoming Webhooks" → Toggle ON
7. Click "Add New Webhook to Workspace"
8. Select channel (create `#relife-alerts` if needed)
9. Copy the webhook URL (starts with `https://hooks.slack.com/`)
10. Paste it into the terminal

#### Configure Discord (3 minutes)

```
🔧 Setting up Discord Integration
===================================

To set up Discord alerts:
1. Go to your Discord server
2. Right-click on the channel where you want alerts
3. Go to 'Edit Channel' → 'Integrations' → 'Webhooks'
4. Click 'Create Webhook'
5. Name it 'Relife Monitoring'
6. Copy the webhook URL

Enter your Discord webhook URL (or press Enter to skip):
```

**Steps to get Discord webhook:**

1. Open Discord and go to your server
2. Right-click the channel → Edit Channel
3. Go to Integrations → Webhooks → Create Webhook
4. Name: `Relife Monitoring`
5. Copy webhook URL
6. Paste into terminal

#### Configure Email/SMTP (5 minutes)

```
🔧 Setting up Email Integration
=================================

For email alerts, you'll need SMTP credentials.
Common providers:
- Gmail: smtp.gmail.com:587 (use App Password)
- Outlook: smtp.office365.com:587
- SendGrid: smtp.sendgrid.net:587

SMTP Host (e.g., smtp.gmail.com):
```

**For Gmail users:**

1. SMTP Host: `smtp.gmail.com`
2. SMTP Port: `587`
3. Username: your Gmail address
4. Password: [Create App Password](https://myaccount.google.com/apppasswords)
5. From Address: your email or `alerts@yourdomain.com`

**The script will test each webhook and show:**

```
✅ Slack webhook test successful!
✅ Discord webhook test successful!
✅ SMTP test successful!
```

---

## ⚙️ Step 3: Configure Environment Settings

### Review Generated Environment File

```bash
# The webhook setup created .env.production
cat .env.production | head -20
```

### Configure Critical Settings

```bash
# Edit the environment file
nano .env.production
```

**Update these essential values:**

```bash
# Domain Configuration (REQUIRED)
RELIFE_DOMAIN=yourdomain.com
PROMETHEUS_DOMAIN=prometheus.yourdomain.com
GRAFANA_DOMAIN=grafana.yourdomain.com
ALERTMANAGER_DOMAIN=alertmanager.yourdomain.com

# Database Configuration (REQUIRED)
POSTGRES_HOST=your_postgres_server
GRAFANA_DB_NAME=grafana
GRAFANA_DB_USER=grafana
GRAFANA_DB_PASSWORD=your_secure_password

# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Let's Encrypt Email (for SSL)
LETSENCRYPT_EMAIL=admin@yourdomain.com
```

**Press Ctrl+X, then Y, then Enter to save**

### Set Up DNS Records

Configure these DNS A records pointing to your server IP:

```bash
# Check your server's public IP
curl ifconfig.me
```

**DNS Records to create:**

```
A    prometheus.yourdomain.com    →    YOUR_SERVER_IP
A    grafana.yourdomain.com       →    YOUR_SERVER_IP
A    alertmanager.yourdomain.com  →    YOUR_SERVER_IP
```

---

## ✅ Step 4: Pre-Deployment Validation

Run the validation script to catch any issues:

```bash
./monitoring/scripts/validate-production-config.sh
```

**Expected successful output:**

```
🔍 Relife Monitoring - Production Configuration Validator
==========================================================

📦 Validating Dependencies
=========================
  ✅ curl: Available
  ✅ wget: Available
  ✅ jq: Available
  ✅ openssl: Available

🐳 Validating Docker Setup
==========================
  ✅ Docker: Installed
  ✅ Docker service: Running
  ✅ Docker Compose: Available
  ✅ Docker permissions: OK
  ✅ Disk space: Sufficient

📁 Validating Monitoring Files
==============================
  ✅ Prometheus configuration: Present
  ✅ AlertManager configuration: Present
  ✅ Business alerts: Present
  ✅ Mobile alerts: Present
  ✅ Security alerts: Present
  ✅ SLA alerts: Present
  ✅ Enhanced dashboard: Present
  ✅ Docker Compose file: Present

🔍 Validating Environment Configuration
========================================
🔐 Critical Configuration:
  ✅ Domain name: Configured
  ✅ Grafana admin password: Configured
  ✅ Supabase URL: Configured
  ✅ Supabase service role key: Configured

🔔 Notification Channels:
  ✅ Slack webhook: Configured
  ✅ Discord webhook: Configured
  ✅ Email SMTP: Configured

🔗 Testing Webhook Connectivity
===============================
Testing Slack webhook...
  ✅ Slack webhook: Working
Testing Discord webhook...
  ✅ Discord webhook: Working

🏁 VALIDATION SUMMARY
====================
🎉 All validations passed! Ready for production deployment.

To deploy, run:
  ./monitoring/scripts/deploy-production.sh
```

**If you see any ❌ errors, fix them before proceeding.**

---

## 🚀 Step 5: Production Deployment

Now for the main event! Run the deployment script:

```bash
./monitoring/scripts/deploy-production.sh
```

**The script will show progress through these phases:**

### Phase 1: Pre-deployment Checks (2 minutes)

```
🚀 Relife Monitoring Production Deployment
==============================================

[2024-01-15 10:30:00] Starting production deployment of Relife monitoring system...
[2024-01-15 10:30:01] ✅ Pre-deployment checks passed
```

### Phase 2: Infrastructure Setup (3 minutes)

```
[2024-01-15 10:30:05] Setting up infrastructure...
[2024-01-15 10:30:10] Creating relife-network...
[2024-01-15 10:30:15] ✅ Infrastructure setup complete
```

### Phase 3: SSL Certificate Setup (5 minutes)

```
[2024-01-15 10:30:20] Setting up SSL certificates...
[2024-01-15 10:30:25] Setting up Let's Encrypt certificates...
[2024-01-15 10:30:30] Generating certificate for prometheus.yourdomain.com...
[2024-01-15 10:30:45] Generating certificate for grafana.yourdomain.com...
[2024-01-15 10:31:00] Generating certificate for alertmanager.yourdomain.com...
[2024-01-15 10:31:15] ✅ SSL setup complete
```

### Phase 4: Service Deployment (5 minutes)

```
[2024-01-15 10:31:20] Deploying monitoring stack...
[2024-01-15 10:31:25] Building metrics collector image...
[2024-01-15 10:31:45] Pulling latest monitoring images...
[2024-01-15 10:32:00] Starting monitoring services...
[2024-01-15 10:32:30] Waiting for services to be ready...
[2024-01-15 10:32:45] ✅ Monitoring stack deployed
```

### Phase 5: Health Validation (3 minutes)

```
[2024-01-15 10:32:50] Validating deployment...
[2024-01-15 10:32:55] Checking prometheus health...
[2024-01-15 10:33:00] ✅ prometheus is healthy
[2024-01-15 10:33:05] Checking alertmanager health...
[2024-01-15 10:33:10] ✅ alertmanager is healthy
[2024-01-15 10:33:15] Checking grafana health...
[2024-01-15 10:33:20] ✅ grafana is healthy
[2024-01-15 10:33:25] Checking metrics-collector health...
[2024-01-15 10:33:30] ✅ metrics-collector is healthy
[2024-01-15 10:33:35] ✅ All services are healthy
```

### Phase 6: Configuration & Testing (5 minutes)

```
[2024-01-15 10:33:40] Configuring dashboards and alerts...
[2024-01-15 10:33:50] Importing enhanced Grafana dashboard...
[2024-01-15 10:34:00] Testing AlertManager configuration...
[2024-01-15 10:34:10] ✅ Monitoring configuration complete

[2024-01-15 10:34:15] Testing webhook integrations...
[2024-01-15 10:34:20] Testing Slack webhook...
[2024-01-15 10:34:25] ✅ Slack webhook test successful
[2024-01-15 10:34:30] Testing Discord webhook...
[2024-01-15 10:34:35] ✅ Discord webhook test successful
[2024-01-15 10:34:40] ✅ Webhook testing complete
```

### Final Success Message

```
🎉 DEPLOYMENT SUCCESSFUL!
==============================================

Your monitoring system is now running at:
  📊 Grafana: https://grafana.yourdomain.com
  📈 Prometheus: https://prometheus.yourdomain.com
  🚨 AlertManager: https://alertmanager.yourdomain.com

Next steps:
1. 🔑 Log into Grafana with admin/[generated_password]
2. 📋 Review the enhanced dashboard
3. 🔔 Test alert notifications
4. 📖 Read the deployment report: MONITORING_DEPLOYMENT_REPORT.md

Health check: ./monitoring/scripts/health-check.sh
View logs: docker-compose -f docker-compose.monitoring.yml logs

[2024-01-15 10:35:00] Deployment completed successfully!
```

---

## 🎉 Step 6: Access Your Monitoring System

### Get Your Grafana Password

```bash
# Your password is in the deployment report
cat MONITORING_DEPLOYMENT_REPORT.md | grep "Password:"
```

### Access Grafana Dashboard

1. Open https://grafana.yourdomain.com in your browser
2. Login with:
   - **Username:** `admin`
   - **Password:** [from above command]

### First Login Steps

1. **Change Default Password** (recommended)
   - Go to Profile → Change Password
2. **View Enhanced Dashboard**
   - Go to Dashboards → Browse
   - Open "Relife Smart Alarm - Enhanced Monitoring"

3. **Verify Data Sources**
   - Go to Configuration → Data Sources
   - Prometheus should be connected and green

### Test Alert System

```bash
# Send a test alert
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning",
      "service": "test"
    },
    "annotations": {
      "summary": "This is a test alert from your new monitoring system!"
    }
  }]'
```

**You should receive notifications in your configured channels within 1-2 minutes.**

---

## 🔧 Step 7: Final Configuration

### Create Team Access (Optional)

```bash
# Access Grafana as admin
# Go to Configuration → Teams
# Create teams: "Developers", "DevOps", "Business"
# Assign dashboard permissions
```

### Set Up Automated Backups

```bash
# View backup configuration
crontab -l | grep relife

# Manual backup test
./monitoring/scripts/backup-monitoring.sh
```

### Monitor the Monitoring System

```bash
# Check all services
./monitoring/scripts/health-check.sh

# View resource usage
docker stats --no-stream

# Check logs
docker-compose -f docker-compose.monitoring.yml logs grafana
```

---

## 📊 What You Now Have

### Real-Time Dashboards

- **Business Intelligence:** Revenue, DAU, conversion rates
- **Performance Monitoring:** Response times, error rates, resource usage
- **Mobile App Health:** Crash rates, performance metrics
- **Security Monitoring:** Threat detection, compliance tracking

### Smart Alerting

- **Critical alerts** → PagerDuty + Slack + Discord (immediate response)
- **Warning alerts** → Slack + Email (investigation needed)
- **Info alerts** → Email only (awareness)

### Operational Features

- **Daily automated backups** with 30-day retention
- **SSL certificates** automatically renewed
- **Health monitoring** with auto-restart
- **Performance optimization** and resource monitoring

---

## 🆘 Troubleshooting

### Service Not Starting?

```bash
# Check specific service logs
docker-compose -f docker-compose.monitoring.yml logs [service-name]

# Restart problematic service
docker-compose -f docker-compose.monitoring.yml restart [service-name]
```

### Can't Access Dashboards?

```bash
# Check if ports are open
sudo ufw status
sudo ufw allow 443  # HTTPS
sudo ufw allow 80   # HTTP (for Let's Encrypt)

# Check DNS resolution
nslookup grafana.yourdomain.com
```

### Alerts Not Working?

```bash
# Test webhook URLs manually
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Manual test"}' \
  YOUR_SLACK_WEBHOOK_URL
```

### Need Help?

```bash
# Run health check
./monitoring/scripts/health-check.sh

# Check deployment report
cat MONITORING_DEPLOYMENT_REPORT.md

# View all service status
docker-compose -f docker-compose.monitoring.yml ps
```

---

## ✅ Success Checklist

- [ ] All services show as "healthy" in health check
- [ ] Grafana dashboard accessible at https://grafana.yourdomain.com
- [ ] Enhanced monitoring dashboard shows data
- [ ] Test alert received in Slack/Discord/Email
- [ ] SSL certificates valid and trusted
- [ ] Backup system functioning
- [ ] Team has access credentials

## 🎯 Next Steps

1. **Monitor for 24 hours** to establish baseline metrics
2. **Fine-tune alert thresholds** based on actual usage
3. **Train your team** on dashboard usage and alert response
4. **Set up regular monitoring reviews** (weekly/monthly)

**Congratulations! Your Relife Smart Alarm now has enterprise-grade monitoring! 🎉**
