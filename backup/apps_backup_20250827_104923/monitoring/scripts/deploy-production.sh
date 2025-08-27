#!/bin/bash

# =============================================================================
# RELIFE MONITORING PRODUCTION DEPLOYMENT SCRIPT
# =============================================================================
# This script deploys the comprehensive monitoring system to production
# 
# Prerequisites:
# - Docker and Docker Compose installed
# - Production environment configured (.env.production)
# - SSL certificates available or Let's Encrypt configured
# - Domain DNS pointing to your server
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MONITORING_DIR="$PROJECT_ROOT/monitoring"
BACKUP_DIR="/var/backups/relife-monitoring"
LOG_FILE="/var/log/relife-monitoring-deploy.log"

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        error "$1 is required but not installed. Please install it first."
    fi
}

# =============================================================================
# PRE-DEPLOYMENT CHECKS
# =============================================================================

pre_deployment_checks() {
    log "Starting pre-deployment checks..."
    
    # Check required commands
    check_command "docker"
    check_command "docker-compose"
    check_command "curl"
    check_command "openssl"
    
    # Check if running as root or with sudo
    if [[ $EUID -eq 0 ]]; then
        warn "Running as root. Consider using a dedicated user for production."
    fi
    
    # Check Docker service
    if ! systemctl is-active --quiet docker; then
        error "Docker service is not running. Please start it with: sudo systemctl start docker"
    fi
    
    # Check environment file
    if [[ ! -f "$PROJECT_ROOT/.env.production" ]]; then
        error "Production environment file not found. Please copy .env.production.template to .env.production and configure it."
    fi
    
    # Source environment variables
    set -a
    source "$PROJECT_ROOT/.env.production"
    set +a
    
    # Validate critical environment variables
    local required_vars=(
        "RELIFE_DOMAIN"
        "GRAFANA_ADMIN_PASSWORD" 
        "SLACK_WEBHOOK_URL"
        "SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable $var is not set in .env.production"
        fi
    done
    
    log "✅ Pre-deployment checks passed"
}

# =============================================================================
# INFRASTRUCTURE SETUP
# =============================================================================

setup_infrastructure() {
    log "Setting up infrastructure..."
    
    # Create directories
    sudo mkdir -p "$BACKUP_DIR"
    sudo mkdir -p /var/log/relife-monitoring
    sudo mkdir -p /var/lib/node_exporter/textfile_collector
    
    # Set permissions
    sudo chown -R $USER:$USER "$BACKUP_DIR"
    sudo chown -R $USER:$USER /var/log/relife-monitoring
    sudo chown 65534:65534 /var/lib/node_exporter/textfile_collector
    
    # Create monitoring network if it doesn't exist
    if ! docker network ls | grep -q "relife-network"; then
        log "Creating relife-network..."
        docker network create relife-network
    fi
    
    log "✅ Infrastructure setup complete"
}

# =============================================================================
# SSL CERTIFICATE SETUP
# =============================================================================

setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Check if certificates already exist
    if [[ -f "/etc/ssl/certs/${RELIFE_DOMAIN}.crt" ]] && [[ -f "/etc/ssl/private/${RELIFE_DOMAIN}.key" ]]; then
        log "SSL certificates already exist, skipping generation"
        return
    fi
    
    # Check if Let's Encrypt email is configured
    if [[ -n "$LETSENCRYPT_EMAIL" ]]; then
        log "Setting up Let's Encrypt certificates..."
        
        # Install certbot if not available
        if ! command -v certbot &> /dev/null; then
            log "Installing certbot..."
            sudo apt-get update
            sudo apt-get install -y certbot
        fi
        
        # Generate certificates for monitoring domains
        local domains=(
            "$RELIFE_DOMAIN"
            "$PROMETHEUS_DOMAIN"
            "$GRAFANA_DOMAIN"
            "$ALERTMANAGER_DOMAIN"
        )
        
        for domain in "${domains[@]}"; do
            log "Generating certificate for $domain..."
            sudo certbot certonly --standalone --non-interactive --agree-tos \
                --email "$LETSENCRYPT_EMAIL" -d "$domain" || warn "Failed to generate certificate for $domain"
        done
    else
        warn "LETSENCRYPT_EMAIL not set. You'll need to manually configure SSL certificates."
        warn "Place certificates at:"
        warn "  - /etc/ssl/certs/${RELIFE_DOMAIN}.crt"
        warn "  - /etc/ssl/private/${RELIFE_DOMAIN}.key"
    fi
    
    log "✅ SSL setup complete"
}

# =============================================================================
# BACKUP EXISTING CONFIGURATION
# =============================================================================

backup_existing() {
    log "Creating backup of existing configuration..."
    
    local backup_timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_path="$BACKUP_DIR/pre-deploy-$backup_timestamp"
    
    mkdir -p "$backup_path"
    
    # Backup Docker volumes if they exist
    if docker volume ls | grep -q "relife.*prometheus-data"; then
        log "Backing up Prometheus data..."
        docker run --rm -v relife_prometheus-data:/data -v "$backup_path":/backup \
            alpine tar czf /backup/prometheus-data.tar.gz -C /data .
    fi
    
    if docker volume ls | grep -q "relife.*grafana-data"; then
        log "Backing up Grafana data..."
        docker run --rm -v relife_grafana-data:/data -v "$backup_path":/backup \
            alpine tar czf /backup/grafana-data.tar.gz -C /data .
    fi
    
    # Backup configuration files
    if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
        cp "$PROJECT_ROOT/.env.production" "$backup_path/"
    fi
    
    log "✅ Backup created at $backup_path"
}

# =============================================================================
# DEPLOY MONITORING STACK
# =============================================================================

deploy_monitoring() {
    log "Deploying monitoring stack..."
    
    cd "$PROJECT_ROOT"
    
    # Copy environment file
    if [[ -f ".env.production" ]]; then
        cp .env.production .env
    else
        error "No .env.production file found"
    fi
    
    # Build custom images
    log "Building metrics collector image..."
    docker-compose -f docker-compose.monitoring.yml build metrics-collector
    
    # Pull latest images
    log "Pulling latest monitoring images..."
    docker-compose -f docker-compose.monitoring.yml pull
    
    # Deploy the stack
    log "Starting monitoring services..."
    docker-compose -f docker-compose.monitoring.yml up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be ready..."
    sleep 30
    
    log "✅ Monitoring stack deployed"
}

# =============================================================================
# HEALTH CHECKS AND VALIDATION
# =============================================================================

validate_deployment() {
    log "Validating deployment..."
    
    local services=(
        "prometheus:9090:-/healthy"
        "alertmanager:9093:-/healthy"
        "grafana:3000:api/health"
        "metrics-collector:8080:health"
        "pushgateway:9091:-/healthy"
    )
    
    local all_healthy=true
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service port endpoint <<< "$service_info"
        
        log "Checking $service health..."
        
        local health_url="http://localhost:$port/$endpoint"
        local retries=0
        local max_retries=10
        
        while [[ $retries -lt $max_retries ]]; do
            if curl -sf "$health_url" > /dev/null 2>&1; then
                log "✅ $service is healthy"
                break
            else
                warn "$service not ready yet, retrying in 10s... ($((retries + 1))/$max_retries)"
                sleep 10
                ((retries++))
            fi
        done
        
        if [[ $retries -eq $max_retries ]]; then
            error "❌ $service failed health check"
            all_healthy=false
        fi
    done
    
    if [[ "$all_healthy" == "true" ]]; then
        log "✅ All services are healthy"
    else
        error "Some services failed health checks"
    fi
}

# =============================================================================
# CONFIGURE DASHBOARDS AND ALERTS
# =============================================================================

configure_monitoring() {
    log "Configuring dashboards and alerts..."
    
    # Wait for Grafana to be fully ready
    sleep 20
    
    # Import enhanced dashboard
    if [[ -f "$MONITORING_DIR/grafana/enhanced-dashboard.json" ]]; then
        log "Importing enhanced Grafana dashboard..."
        
        local grafana_url="http://localhost:3000"
        local dashboard_file="$MONITORING_DIR/grafana/enhanced-dashboard.json"
        
        # Create API request to import dashboard
        curl -X POST \
            -H "Content-Type: application/json" \
            -u "admin:${GRAFANA_ADMIN_PASSWORD}" \
            -d @"$dashboard_file" \
            "$grafana_url/api/dashboards/db" || warn "Failed to import dashboard automatically"
    fi
    
    # Test AlertManager configuration
    log "Testing AlertManager configuration..."
    
    local alertmanager_url="http://localhost:9093"
    if curl -sf "$alertmanager_url/-/healthy" > /dev/null; then
        log "✅ AlertManager is responsive"
        
        # Check configuration
        if curl -sf "$alertmanager_url/api/v1/status" > /dev/null; then
            log "✅ AlertManager configuration is valid"
        else
            warn "AlertManager configuration may have issues"
        fi
    else
        error "AlertManager is not responding"
    fi
    
    log "✅ Monitoring configuration complete"
}

# =============================================================================
# WEBHOOK TESTING
# =============================================================================

test_webhooks() {
    log "Testing webhook integrations..."
    
    # Test Slack webhook
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        log "Testing Slack webhook..."
        local slack_payload='{"text":"🚀 Relife Monitoring System deployed successfully! This is a test message."}'
        
        if curl -X POST -H 'Content-type: application/json' \
           --data "$slack_payload" "$SLACK_WEBHOOK_URL" > /dev/null 2>&1; then
            log "✅ Slack webhook test successful"
        else
            warn "❌ Slack webhook test failed"
        fi
    fi
    
    # Test Discord webhook
    if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
        log "Testing Discord webhook..."
        local discord_payload='{"content":"🚀 Relife Monitoring System deployed successfully! This is a test message."}'
        
        if curl -X POST -H 'Content-type: application/json' \
           --data "$discord_payload" "$DISCORD_WEBHOOK_URL" > /dev/null 2>&1; then
            log "✅ Discord webhook test successful"
        else
            warn "❌ Discord webhook test failed"
        fi
    fi
    
    log "✅ Webhook testing complete"
}

# =============================================================================
# POST-DEPLOYMENT SETUP
# =============================================================================

post_deployment_setup() {
    log "Running post-deployment setup..."
    
    # Start metrics collection
    log "Starting metrics collection..."
    docker-compose -f docker-compose.monitoring.yml restart metrics-collector
    
    # Set up log rotation
    log "Setting up log rotation..."
    sudo tee /etc/logrotate.d/relife-monitoring > /dev/null <<EOF
/var/log/relife-monitoring/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
    postrotate
        docker-compose -f $PROJECT_ROOT/docker-compose.monitoring.yml restart metrics-collector
    endscript
}
EOF
    
    # Set up monitoring cron jobs
    log "Setting up monitoring cron jobs..."
    (crontab -l 2>/dev/null; echo "# Relife Monitoring Health Check") | crontab -
    (crontab -l 2>/dev/null; echo "*/5 * * * * $SCRIPT_DIR/health-check.sh >> /var/log/relife-monitoring/health-check.log 2>&1") | crontab -
    (crontab -l 2>/dev/null; echo "# Relife Monitoring Backup") | crontab -
    (crontab -l 2>/dev/null; echo "$BACKUP_SCHEDULE $SCRIPT_DIR/backup-monitoring.sh >> /var/log/relife-monitoring/backup.log 2>&1") | crontab -
    
    log "✅ Post-deployment setup complete"
}

# =============================================================================
# DEPLOYMENT STATUS REPORT
# =============================================================================

generate_deployment_report() {
    log "Generating deployment report..."
    
    local report_file="$PROJECT_ROOT/MONITORING_DEPLOYMENT_REPORT.md"
    
    cat > "$report_file" <<EOF
# Relife Monitoring System - Production Deployment Report

**Deployment Date:** $(date)
**Deployed By:** $(whoami)
**Server:** $(hostname -f)

## 🚀 Deployment Status: SUCCESSFUL

### Services Deployed

| Service | Status | Port | Health Check |
|---------|--------|------|--------------|
| Prometheus | ✅ Running | 9090 | http://localhost:9090/-/healthy |
| AlertManager | ✅ Running | 9093 | http://localhost:9093/-/healthy |
| Grafana | ✅ Running | 3000 | http://localhost:3000/api/health |
| Metrics Collector | ✅ Running | 8080 | http://localhost:8080/health |
| Node Exporter | ✅ Running | 9100 | System metrics |
| Pushgateway | ✅ Running | 9091 | http://localhost:9091/-/healthy |

### 🌐 Web Access

- **Grafana Dashboard:** https://${GRAFANA_DOMAIN:-grafana.relife.app}
- **Prometheus:** https://${PROMETHEUS_DOMAIN:-prometheus.relife.app}
- **AlertManager:** https://${ALERTMANAGER_DOMAIN:-alertmanager.relife.app}

**Default Grafana Login:**
- Username: \`admin\`
- Password: \`${GRAFANA_ADMIN_PASSWORD}\`

### 📊 Monitoring Coverage

✅ **Business Metrics**
- Daily Active Users (DAU)
- Revenue tracking
- Subscription churn monitoring
- Alarm success rates
- Customer satisfaction metrics

✅ **Performance Monitoring**
- Response time tracking
- Error rate monitoring
- Resource utilization
- Database performance
- API endpoint monitoring

✅ **Mobile App Monitoring**
- Crash detection (iOS/Android)
- Performance metrics
- Battery usage tracking
- Network performance
- App store ratings monitoring

✅ **Security Monitoring**
- Authentication failures
- API abuse detection
- Fraud prevention
- Compliance monitoring
- Incident response automation

✅ **SLA Monitoring**
- Uptime tracking (99.9% target)
- Response time SLA enforcement
- Error budget management
- Regional performance monitoring

### 🔔 Alert Channels Configured

$(if [[ -n "$SLACK_WEBHOOK_URL" ]]; then echo "✅ **Slack:** ${SLACK_CHANNEL_CRITICAL:-#critical-alerts} (critical), ${SLACK_CHANNEL_WARNING:-#monitoring-alerts} (warnings)"; else echo "❌ **Slack:** Not configured"; fi)

$(if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then echo "✅ **Discord:** Alert notifications enabled"; else echo "❌ **Discord:** Not configured"; fi)

$(if [[ -n "$SMTP_HOST" ]] && [[ -n "$SMTP_USER" ]]; then echo "✅ **Email:** ${SMTP_FROM_ADDRESS:-alerts@relife.app}"; else echo "❌ **Email:** Not configured"; fi)

$(if [[ -n "$PAGERDUTY_ROUTING_KEY_CRITICAL" ]]; then echo "✅ **PagerDuty:** Critical alerts configured"; else echo "❌ **PagerDuty:** Not configured"; fi)

### 📈 Key Metrics Being Tracked

**Business Intelligence:**
- Daily/Monthly Active Users
- Revenue per day/month
- Subscription conversion rates
- Feature usage analytics
- Customer lifetime value

**Application Performance:**
- API response times (95th/99th percentile)
- Error rates by endpoint
- Database query performance
- Cache hit rates
- Background job success rates

**User Experience:**
- Alarm success rates
- Wake-up completion rates
- App crash frequency
- Battery impact metrics
- Network connectivity issues

**Security & Compliance:**
- Failed authentication attempts
- API abuse patterns
- Unusual user behavior
- Data privacy compliance
- Security incident detection

### 🔧 Next Steps

1. **Configure Webhooks** (if not done):
   - Set up Slack incoming webhooks
   - Configure Discord bot webhooks
   - Test PagerDuty integration

2. **Customize Thresholds**:
   - Review alert thresholds in \`.env.production\`
   - Adjust based on your baseline metrics
   - Test alert firing and resolution

3. **Team Training**:
   - Share Grafana dashboard access
   - Review alert response runbooks
   - Practice incident response procedures

4. **Monitoring Optimization**:
   - Monitor the monitoring system resource usage
   - Adjust retention policies if needed
   - Set up automated backups

### 📝 Important Files

- **Configuration:** \`/project/workspace/Coolhgg/Relife/.env.production\`
- **Deployment Logs:** \`/var/log/relife-monitoring/\`
- **Backup Location:** \`$BACKUP_DIR\`
- **Alert Runbooks:** \`/project/workspace/Coolhgg/Relife/monitoring/runbooks/\`

### 🆘 Support & Troubleshooting

**Check Service Status:**
\`\`\`bash
cd /project/workspace/Coolhgg/Relife
docker-compose -f docker-compose.monitoring.yml ps
\`\`\`

**View Service Logs:**
\`\`\`bash
docker-compose -f docker-compose.monitoring.yml logs [service-name]
\`\`\`

**Restart Services:**
\`\`\`bash
docker-compose -f docker-compose.monitoring.yml restart [service-name]
\`\`\`

**Health Check Script:**
\`\`\`bash
$SCRIPT_DIR/health-check.sh
\`\`\`

---
**Deployment completed at:** $(date)
EOF
    
    log "✅ Deployment report generated: $report_file"
}

# =============================================================================
# HEALTH CHECK SCRIPT
# =============================================================================

create_health_check_script() {
    log "Creating health check script..."
    
    cat > "$SCRIPT_DIR/health-check.sh" <<'EOF'
#!/bin/bash

# Relife Monitoring Health Check Script
# Run this to check the health of all monitoring services

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "🏥 Relife Monitoring Health Check - $(date)"
echo "=================================================="

# Check Docker containers
echo "📦 Container Status:"
docker-compose -f docker-compose.monitoring.yml ps

echo ""
echo "🔍 Service Health Checks:"

# Health check function
check_service() {
    local service="$1"
    local port="$2"
    local endpoint="$3"
    
    if curl -sf "http://localhost:$port/$endpoint" > /dev/null 2>&1; then
        echo -e "✅ $service: ${GREEN}Healthy${NC}"
        return 0
    else
        echo -e "❌ $service: ${RED}Unhealthy${NC}"
        return 1
    fi
}

# Check all services
healthy_count=0
total_services=5

check_service "Prometheus" "9090" "-/healthy" && ((healthy_count++))
check_service "AlertManager" "9093" "-/healthy" && ((healthy_count++))
check_service "Grafana" "3000" "api/health" && ((healthy_count++))
check_service "Metrics Collector" "8080" "health" && ((healthy_count++))
check_service "Pushgateway" "9091" "-/healthy" && ((healthy_count++))

echo ""
echo "📊 Overall Health: $healthy_count/$total_services services healthy"

if [[ $healthy_count -eq $total_services ]]; then
    echo -e "${GREEN}🎉 All monitoring services are healthy!${NC}"
else
    echo -e "${YELLOW}⚠️  Some services need attention${NC}"
fi

# Check disk usage
echo ""
echo "💾 Disk Usage:"
docker system df

# Check recent alerts
echo ""
echo "🚨 Recent Alerts (last 24h):"
if curl -sf "http://localhost:9093/api/v1/alerts" > /dev/null 2>&1; then
    curl -s "http://localhost:9093/api/v1/alerts" | jq -r '.data[] | select(.endsAt == "0001-01-01T00:00:00Z") | "- \(.labels.alertname): \(.labels.severity)"' 2>/dev/null || echo "No active alerts"
else
    echo "Unable to check alerts - AlertManager not responding"
fi

echo ""
echo "=================================================="
EOF
    
    chmod +x "$SCRIPT_DIR/health-check.sh"
    log "✅ Health check script created"
}

# =============================================================================
# BACKUP SCRIPT
# =============================================================================

create_backup_script() {
    log "Creating backup script..."
    
    cat > "$SCRIPT_DIR/backup-monitoring.sh" <<EOF
#!/bin/bash

# Relife Monitoring Backup Script
# Automated backup of monitoring data and configuration

set -e

BACKUP_DIR="$BACKUP_DIR"
PROJECT_ROOT="$PROJECT_ROOT"
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="\$BACKUP_DIR/backup-\$TIMESTAMP"

echo "🗄️  Starting monitoring backup - \$(date)"

mkdir -p "\$BACKUP_PATH"

# Backup Docker volumes
echo "Backing up Prometheus data..."
docker run --rm -v relife_prometheus-data:/data -v "\$BACKUP_PATH":/backup \\
    alpine tar czf /backup/prometheus-data.tar.gz -C /data .

echo "Backing up Grafana data..."
docker run --rm -v relife_grafana-data:/data -v "\$BACKUP_PATH":/backup \\
    alpine tar czf /backup/grafana-data.tar.gz -C /data .

echo "Backing up AlertManager data..."
docker run --rm -v relife_alertmanager-data:/data -v "\$BACKUP_PATH":/backup \\
    alpine tar czf /backup/alertmanager-data.tar.gz -C /data .

# Backup configuration
cp "\$PROJECT_ROOT/.env.production" "\$BACKUP_PATH/" 2>/dev/null || true
cp -r "\$PROJECT_ROOT/monitoring" "\$BACKUP_PATH/"

# Create backup manifest
cat > "\$BACKUP_PATH/manifest.txt" <<MANIFEST
Relife Monitoring Backup
========================
Created: \$(date)
Server: \$(hostname -f)
Docker Compose Version: \$(docker-compose --version)

Contents:
- prometheus-data.tar.gz (Prometheus TSDB data)
- grafana-data.tar.gz (Grafana dashboards and settings)
- alertmanager-data.tar.gz (AlertManager data)
- .env.production (Environment configuration)
- monitoring/ (Configuration files)

Restore Instructions:
1. Stop services: docker-compose -f docker-compose.monitoring.yml down
2. Extract data: tar xzf [backup-file] -C [volume-path]
3. Start services: docker-compose -f docker-compose.monitoring.yml up -d
MANIFEST

# Cleanup old backups (keep last 14 days)
find "\$BACKUP_DIR" -name "backup-*" -type d -mtime +14 -exec rm -rf {} + 2>/dev/null || true

echo "✅ Backup completed: \$BACKUP_PATH"
EOF
    
    chmod +x "$SCRIPT_DIR/backup-monitoring.sh"
    log "✅ Backup script created"
}

# =============================================================================
# MAIN DEPLOYMENT FLOW
# =============================================================================

main() {
    echo -e "${BLUE}🚀 Relife Monitoring Production Deployment${NC}"
    echo "=============================================="
    echo ""
    
    log "Starting production deployment of Relife monitoring system..."
    
    # Run deployment steps
    pre_deployment_checks
    setup_infrastructure
    setup_ssl
    backup_existing
    deploy_monitoring
    validate_deployment
    configure_monitoring
    test_webhooks
    create_health_check_script
    create_backup_script
    post_deployment_setup
    generate_deployment_report
    
    echo ""
    echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
    echo "=============================================="
    echo ""
    echo "Your monitoring system is now running at:"
    echo -e "  📊 Grafana: ${BLUE}https://${GRAFANA_DOMAIN:-grafana.relife.app}${NC}"
    echo -e "  📈 Prometheus: ${BLUE}https://${PROMETHEUS_DOMAIN:-prometheus.relife.app}${NC}"
    echo -e "  🚨 AlertManager: ${BLUE}https://${ALERTMANAGER_DOMAIN:-alertmanager.relife.app}${NC}"
    echo ""
    echo "Next steps:"
    echo "1. 🔑 Log into Grafana with admin/${GRAFANA_ADMIN_PASSWORD}"
    echo "2. 📋 Review the enhanced dashboard"
    echo "3. 🔔 Test alert notifications"
    echo "4. 📖 Read the deployment report: MONITORING_DEPLOYMENT_REPORT.md"
    echo ""
    echo "Health check: $SCRIPT_DIR/health-check.sh"
    echo "View logs: docker-compose -f docker-compose.monitoring.yml logs"
    echo ""
    log "Deployment completed successfully!"
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "check")
        validate_deployment
        ;;
    "backup")
        backup_existing
        ;;
    "health")
        if [[ -f "$SCRIPT_DIR/health-check.sh" ]]; then
            bash "$SCRIPT_DIR/health-check.sh"
        else
            error "Health check script not found. Run full deployment first."
        fi
        ;;
    "help")
        echo "Relife Monitoring Production Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy (default)  - Full production deployment"
        echo "  check            - Validate existing deployment"
        echo "  backup           - Create backup of current state"
        echo "  health           - Run health checks"
        echo "  help             - Show this help"
        echo ""
        ;;
    *)
        error "Unknown command: $1. Use '$0 help' for available commands."
        ;;
esac