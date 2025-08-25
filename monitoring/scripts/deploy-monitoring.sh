#!/bin/bash
# Monitoring configuration deployment script for Relife Smart Alarm
# Handles safe deployment of monitoring configurations with validation and rollback

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_ROOT="$(dirname "$SCRIPT_DIR")"
PROMETHEUS_CONFIG="/etc/prometheus/prometheus.yml"
ALERTMANAGER_CONFIG="/etc/alertmanager/alertmanager.yml"
BACKUP_DIR="/opt/relife-monitoring/backups/$(date +%Y%m%d_%H%M%S)"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Backup current configurations
backup_configs() {
    log "Creating configuration backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup Prometheus config
    if [ -f "$PROMETHEUS_CONFIG" ]; then
        cp "$PROMETHEUS_CONFIG" "$BACKUP_DIR/prometheus.yml.backup"
        success "Prometheus config backed up"
    fi
    
    # Backup AlertManager config
    if [ -f "$ALERTMANAGER_CONFIG" ]; then
        cp "$ALERTMANAGER_CONFIG" "$BACKUP_DIR/alertmanager.yml.backup"
        success "AlertManager config backed up"
    fi
    
    # Backup alert rules
    if [ -d "/etc/prometheus/rules" ]; then
        cp -r /etc/prometheus/rules "$BACKUP_DIR/rules.backup"
        success "Alert rules backed up"
    fi
    
    # Backup templates
    if [ -d "/etc/alertmanager/templates" ]; then
        cp -r /etc/alertmanager/templates "$BACKUP_DIR/templates.backup"
        success "AlertManager templates backed up"
    fi
    
    success "Backup created at $BACKUP_DIR"
}

# Validate configurations before deployment
validate_configs() {
    log "Validating monitoring configurations..."
    
    local validation_errors=0
    
    # Validate Prometheus config
    echo -n "  Validating Prometheus configuration... "
    if promtool check config "$MONITORING_ROOT/prometheus/prometheus.yml"; then
        echo -e "${GREEN}✓ VALID${NC}"
    else
        echo -e "${RED}✗ INVALID${NC}"
        validation_errors=$((validation_errors + 1))
    fi
    
    # Validate AlertManager config
    echo -n "  Validating AlertManager configuration... "
    if amtool check-config "$MONITORING_ROOT/alertmanager/alertmanager.yml"; then
        echo -e "${GREEN}✓ VALID${NC}"
    else
        echo -e "${RED}✗ INVALID${NC}"
        validation_errors=$((validation_errors + 1))
    fi
    
    # Validate alert rules
    for rule_file in "$MONITORING_ROOT"/prometheus/alerts/*.yml; do
        if [ -f "$rule_file" ]; then
            echo -n "  Validating $(basename "$rule_file")... "
            if promtool check rules "$rule_file"; then
                echo -e "${GREEN}✓ VALID${NC}"
            else
                echo -e "${RED}✗ INVALID${NC}"
                validation_errors=$((validation_errors + 1))
            fi
        fi
    done
    
    if [ $validation_errors -eq 0 ]; then
        success "All configurations are valid"
        return 0
    else
        error "$validation_errors validation errors found"
        return 1
    fi
}

# Deploy configurations
deploy_configs() {
    log "Deploying monitoring configurations..."
    
    # Deploy Prometheus config
    cp "$MONITORING_ROOT/prometheus/prometheus.yml" "$PROMETHEUS_CONFIG"
    success "Prometheus configuration deployed"
    
    # Deploy AlertManager config
    cp "$MONITORING_ROOT/alertmanager/alertmanager.yml" "$ALERTMANAGER_CONFIG"
    success "AlertManager configuration deployed"
    
    # Deploy alert rules
    mkdir -p /etc/prometheus/rules
    cp "$MONITORING_ROOT"/prometheus/alerts/*.yml /etc/prometheus/rules/
    success "Alert rules deployed"
    
    # Deploy templates
    mkdir -p /etc/alertmanager/templates
    cp "$MONITORING_ROOT"/alertmanager/templates/*.tmpl /etc/alertmanager/templates/
    success "AlertManager templates deployed"
    
    # Set correct permissions
    chown -R prometheus:prometheus /etc/prometheus
    chown -R alertmanager:alertmanager /etc/alertmanager
    success "Permissions set correctly"
}

# Reload services
reload_services() {
    log "Reloading monitoring services..."
    
    # Reload Prometheus
    echo -n "  Reloading Prometheus... "
    if curl -s -X POST "$PROMETHEUS_URL/-/reload" >/dev/null; then
        echo -e "${GREEN}✓ RELOADED${NC}"
    else
        echo -e "${RED}✗ FAILED${NC}"
        error "Prometheus reload failed"
        return 1
    fi
    
    # Reload AlertManager
    echo -n "  Reloading AlertManager... "
    if curl -s -X POST "$ALERTMANAGER_URL/-/reload" >/dev/null; then
        echo -e "${GREEN}✓ RELOADED${NC}"
    else
        echo -e "${RED}✗ FAILED${NC}"
        error "AlertManager reload failed"
        return 1
    fi
    
    success "Services reloaded successfully"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Wait for services to stabilize
    sleep 5
    
    # Check service health
    if ! check_service "Prometheus" "$PROMETHEUS_URL" "/-/healthy"; then
        error "Prometheus health check failed"
        return 1
    fi
    
    if ! check_service "AlertManager" "$ALERTMANAGER_URL" "/-/healthy"; then
        error "AlertManager health check failed"
        return 1
    fi
    
    # Check if alert rules loaded
    echo -n "  Checking alert rule loading... "
    rules_response=$(curl -s "$PROMETHEUS_URL/api/v1/rules")
    rule_count=$(echo "$rules_response" | jq '.data.groups | map(.rules) | flatten | length')
    
    if [ "$rule_count" -gt 0 ]; then
        echo -e "${GREEN}✓ $rule_count rules loaded${NC}"
    else
        echo -e "${RED}✗ No rules loaded${NC}"
        return 1
    fi
    
    success "Deployment verification complete"
}

# Rollback function
rollback_deployment() {
    log "Rolling back to previous configuration..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        error "No backup found at $BACKUP_DIR"
        return 1
    fi
    
    # Restore configurations
    if [ -f "$BACKUP_DIR/prometheus.yml.backup" ]; then
        cp "$BACKUP_DIR/prometheus.yml.backup" "$PROMETHEUS_CONFIG"
        success "Prometheus config restored"
    fi
    
    if [ -f "$BACKUP_DIR/alertmanager.yml.backup" ]; then
        cp "$BACKUP_DIR/alertmanager.yml.backup" "$ALERTMANAGER_CONFIG"
        success "AlertManager config restored"
    fi
    
    if [ -d "$BACKUP_DIR/rules.backup" ]; then
        rm -rf /etc/prometheus/rules
        cp -r "$BACKUP_DIR/rules.backup" /etc/prometheus/rules
        success "Alert rules restored"
    fi
    
    if [ -d "$BACKUP_DIR/templates.backup" ]; then
        rm -rf /etc/alertmanager/templates
        cp -r "$BACKUP_DIR/templates.backup" /etc/alertmanager/templates
        success "Templates restored"
    fi
    
    # Reload services
    reload_services
    
    success "Rollback completed"
}

# Generate deployment report
generate_report() {
    local status=$1
    local report_file="/var/log/relife-monitoring/deployment-$(date +%Y%m%d_%H%M%S).log"
    
    mkdir -p "$(dirname "$report_file")"
    
    cat > "$report_file" << EOF
Relife Monitoring Deployment Report
==================================
Date: $(date)
Status: $status
Backup Location: $BACKUP_DIR

Configuration Files Deployed:
- Prometheus: $PROMETHEUS_CONFIG
- AlertManager: $ALERTMANAGER_CONFIG
- Alert Rules: /etc/prometheus/rules/
- Templates: /etc/alertmanager/templates/

Service Status:
- Prometheus: $(systemctl is-active prometheus)
- AlertManager: $(systemctl is-active alertmanager)
- Node Exporter: $(systemctl is-active node_exporter)
- Grafana: $(docker ps --filter name=relife-grafana --format "{{.Status}}")

Alert Rules Count: $(find /etc/prometheus/rules -name "*.yml" -exec promtool check rules {} \; 2>/dev/null | grep -c "SUCCESS" || echo "0")

Active Alerts: $(curl -s "$ALERTMANAGER_URL/api/v1/alerts" | jq '.data | length' 2>/dev/null || echo "unknown")

Deployment Log:
$(tail -50 /var/log/relife-monitoring/deployment.log 2>/dev/null || echo "No deployment log found")
EOF
    
    echo "Deployment report saved to: $report_file"
}

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --deploy     Deploy monitoring configurations"
    echo "  --validate   Only validate configurations"
    echo "  --test       Run alert tests after deployment"
    echo "  --rollback   Rollback to previous configuration"
    echo "  --status     Show monitoring system status"
    echo "  --help       Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  SLACK_WEBHOOK_URL      Slack webhook for notifications"
    echo "  DISCORD_WEBHOOK_URL    Discord webhook for notifications"
    echo "  PAGERDUTY_ROUTING_KEY  PagerDuty routing key"
    echo ""
    echo "Examples:"
    echo "  $0 --deploy --test     Deploy configs and run tests"
    echo "  $0 --validate          Validate configs only"
    echo "  $0 --rollback          Rollback to previous version"
}

# Main execution logic
case "${1:-}" in
    --deploy)
        log "Starting monitoring configuration deployment..."
        backup_configs
        validate_configs || { error "Validation failed. Aborting deployment."; exit 1; }
        deploy_configs
        reload_services || { error "Service reload failed. Initiating rollback..."; rollback_deployment; exit 1; }
        verify_deployment || { error "Deployment verification failed. Initiating rollback..."; rollback_deployment; exit 1; }
        generate_report "SUCCESS"
        
        if [ "$2" = "--test" ]; then
            log "Running alert tests..."
            "$SCRIPT_DIR/test-alerts.sh"
        fi
        
        success "Monitoring deployment completed successfully!"
        ;;
        
    --validate)
        log "Validating monitoring configurations..."
        validate_configs
        success "Configuration validation completed!"
        ;;
        
    --test)
        log "Running alert tests..."
        "$SCRIPT_DIR/test-alerts.sh"
        ;;
        
    --rollback)
        if [ -z "$2" ]; then
            # Use most recent backup
            BACKUP_DIR=$(ls -t /opt/relife-monitoring/backups/ | head -1)
            BACKUP_DIR="/opt/relife-monitoring/backups/$BACKUP_DIR"
        else
            BACKUP_DIR="$2"
        fi
        
        log "Rolling back monitoring configuration..."
        rollback_deployment
        generate_report "ROLLBACK"
        success "Rollback completed!"
        ;;
        
    --status)
        log "Checking monitoring system status..."
        if command -v relife-monitoring-status >/dev/null; then
            relife-monitoring-status
        else
            check_service "Prometheus" "$PROMETHEUS_URL" "/-/healthy"
            check_service "AlertManager" "$ALERTMANAGER_URL" "/-/healthy"
            check_service "Grafana" "$GRAFANA_URL" "/api/health"
        fi
        ;;
        
    --help)
        usage
        ;;
        
    *)
        echo -e "${RED}Invalid option: ${1:-}${NC}"
        echo ""
        usage
        exit 1
        ;;
esac