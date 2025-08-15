#!/bin/bash

# Comprehensive Monitoring Setup Script for Relife Smart Alarm
# This script sets up all external monitoring services and configurations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    case $level in
        "ERROR")   echo -e "${RED}[ERROR]${NC} $*" >&2 ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $*" ;;
        "WARNING") echo -e "${YELLOW}[WARNING]${NC} $*" ;;
        "INFO")    echo -e "${BLUE}[INFO]${NC} $*" ;;
        *)         echo -e "$*" ;;
    esac
}

# Check if required environment variables are set
check_environment() {
    log "INFO" "Checking environment variables..."
    
    local required_vars=(
        "ENVIRONMENT"
        "DATADOG_API_KEY"
        "NEWRELIC_LICENSE_KEY"
        "POSTHOG_API_KEY"
        "SENTRY_DSN"
        "PROMETHEUS_URL"
        "GRAFANA_URL"
        "SLACK_WEBHOOK_URL"
        "PAGERDUTY_ROUTING_KEY_CRITICAL"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log "ERROR" "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            log "ERROR" "  - $var"
        done
        exit 1
    fi
    
    log "SUCCESS" "All required environment variables are set"
}

# Setup DataDog monitoring
setup_datadog() {
    log "INFO" "Setting up DataDog monitoring..."
    
    # Create DataDog configuration directory
    mkdir -p /etc/datadog-agent/conf.d
    
    # Copy DataDog configuration
    envsubst < monitoring/datadog/datadog.yaml > /etc/datadog-agent/datadog.yaml
    
    # Install DataDog agent if not already installed
    if ! command -v datadog-agent &> /dev/null; then
        log "INFO" "Installing DataDog agent..."
        bash -c "$(curl -L https://raw.githubusercontent.com/DataDog/datadog-agent/main/cmd/agent/install_script.sh)"
    fi
    
    # Start DataDog agent
    if systemctl is-active --quiet datadog-agent; then
        log "INFO" "Restarting DataDog agent..."
        systemctl restart datadog-agent
    else
        log "INFO" "Starting DataDog agent..."
        systemctl start datadog-agent
        systemctl enable datadog-agent
    fi
    
    # Verify DataDog agent status
    if systemctl is-active --quiet datadog-agent; then
        log "SUCCESS" "DataDog agent is running"
    else
        log "ERROR" "DataDog agent failed to start"
        return 1
    fi
    
    # Create custom dashboards
    log "INFO" "Creating DataDog dashboards..."
    
    # Dashboard API calls would go here
    # For now, we'll create a script that can be run separately
    cat > scripts/create-datadog-dashboards.py << 'EOF'
#!/usr/bin/env python3
import os
import requests
import json

DATADOG_API_KEY = os.environ['DATADOG_API_KEY']
DATADOG_APP_KEY = os.environ['DATADOG_APP_KEY']

def create_dashboard():
    url = "https://api.datadoghq.com/api/v1/dashboard"
    headers = {
        "DD-API-KEY": DATADOG_API_KEY,
        "DD-APPLICATION-KEY": DATADOG_APP_KEY,
        "Content-Type": "application/json"
    }
    
    dashboard_config = {
        "title": "Relife Smart Alarm - Performance Monitoring",
        "description": "Comprehensive performance monitoring dashboard for Relife Smart Alarm",
        "widgets": [
            {
                "definition": {
                    "title": "Web Vitals Overview",
                    "type": "timeseries",
                    "requests": [
                        {
                            "q": "avg:relife.web_vitals.lcp{*}",
                            "display_type": "line",
                            "style": {"palette": "dog_classic"}
                        }
                    ]
                }
            }
        ],
        "layout_type": "ordered"
    }
    
    response = requests.post(url, headers=headers, data=json.dumps(dashboard_config))
    if response.status_code == 200:
        print("Dashboard created successfully")
        return response.json()
    else:
        print(f"Failed to create dashboard: {response.text}")
        return None

if __name__ == "__main__":
    create_dashboard()
EOF
    
    chmod +x scripts/create-datadog-dashboards.py
    
    log "SUCCESS" "DataDog monitoring setup complete"
}

# Setup New Relic monitoring
setup_newrelic() {
    log "INFO" "Setting up New Relic monitoring..."
    
    # Create New Relic configuration
    mkdir -p /etc/newrelic
    envsubst < monitoring/newrelic/newrelic.yml > /etc/newrelic/newrelic.yml
    
    # Install New Relic agent (for Node.js applications)
    if [[ -f "package.json" ]]; then
        log "INFO" "Installing New Relic Node.js agent..."
        npm install newrelic --save
        
        # Create New Relic startup script
        cat > scripts/start-with-newrelic.js << 'EOF'
require('newrelic');
// Your application start code goes here
EOF
    fi
    
    # Install New Relic infrastructure agent
    if ! command -v newrelic-infra &> /dev/null; then
        log "INFO" "Installing New Relic infrastructure agent..."
        curl -Ls https://download.newrelic.com/infrastructure_agent/gpg/newrelic-infra.gpg | sudo apt-key add -
        printf "deb [arch=amd64] https://download.newrelic.com/infrastructure_agent/linux/apt focal main" | sudo tee /etc/apt/sources.list.d/newrelic-infra.list
        sudo apt-get update
        sudo apt-get install -y newrelic-infra
    fi
    
    # Configure New Relic infrastructure
    cat > /etc/newrelic-infra.yml << EOF
license_key: ${NEWRELIC_LICENSE_KEY}
display_name: relife-${ENVIRONMENT}
log_level: info

# Custom attributes
custom_attributes:
  environment: ${ENVIRONMENT}
  service: relife-smart-alarm
  team: engineering
EOF
    
    # Start New Relic infrastructure agent
    systemctl start newrelic-infra
    systemctl enable newrelic-infra
    
    log "SUCCESS" "New Relic monitoring setup complete"
}

# Setup Prometheus monitoring
setup_prometheus() {
    log "INFO" "Setting up Prometheus monitoring..."
    
    # Create Prometheus directories
    mkdir -p /etc/prometheus/rules
    mkdir -p /etc/prometheus/templates
    mkdir -p /var/lib/prometheus
    
    # Copy Prometheus configuration
    envsubst < monitoring/prometheus/prometheus.yml > /etc/prometheus/prometheus.yml
    
    # Copy alert rules
    cp monitoring/prometheus/alerts/*.yml /etc/prometheus/rules/
    
    # Create Prometheus service file
    cat > /etc/systemd/system/prometheus.service << 'EOF'
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \
    --config.file /etc/prometheus/prometheus.yml \
    --storage.tsdb.path /var/lib/prometheus/ \
    --web.console.templates=/etc/prometheus/consoles \
    --web.console.libraries=/etc/prometheus/console_libraries \
    --web.listen-address=0.0.0.0:9090 \
    --web.external-url=http://localhost:9090 \
    --storage.tsdb.retention.time=15d

[Install]
WantedBy=multi-user.target
EOF
    
    # Create Prometheus user
    useradd --no-create-home --shell /bin/false prometheus || true
    chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus
    
    # Install Prometheus if not already installed
    if ! command -v prometheus &> /dev/null; then
        log "INFO" "Installing Prometheus..."
        PROMETHEUS_VERSION="2.40.0"
        wget https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz
        tar xvf prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz
        cp prometheus-${PROMETHEUS_VERSION}.linux-amd64/prometheus /usr/local/bin/
        cp prometheus-${PROMETHEUS_VERSION}.linux-amd64/promtool /usr/local/bin/
        rm -rf prometheus-${PROMETHEUS_VERSION}.linux-amd64*
    fi
    
    # Start Prometheus
    systemctl daemon-reload
    systemctl start prometheus
    systemctl enable prometheus
    
    log "SUCCESS" "Prometheus monitoring setup complete"
}

# Setup Grafana dashboards
setup_grafana() {
    log "INFO" "Setting up Grafana dashboards..."
    
    # Create Grafana provisioning directories
    mkdir -p /etc/grafana/provisioning/dashboards
    mkdir -p /etc/grafana/provisioning/datasources
    
    # Create datasources configuration
    cat > /etc/grafana/provisioning/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: ${PROMETHEUS_URL}
    isDefault: true
    editable: true
EOF
    
    # Create dashboard provisioning configuration
    cat > /etc/grafana/provisioning/dashboards/relife.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'Relife Dashboards'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF
    
    # Copy dashboard JSON files
    mkdir -p /var/lib/grafana/dashboards
    cp monitoring/grafana/*.json /var/lib/grafana/dashboards/
    
    # Set permissions
    chown -R grafana:grafana /var/lib/grafana/dashboards
    
    log "SUCCESS" "Grafana dashboards setup complete"
}

# Setup Alertmanager
setup_alertmanager() {
    log "INFO" "Setting up Alertmanager..."
    
    # Create Alertmanager directories
    mkdir -p /etc/alertmanager/templates
    mkdir -p /var/lib/alertmanager
    
    # Copy Alertmanager configuration
    envsubst < monitoring/alertmanager/alertmanager.yml > /etc/alertmanager/alertmanager.yml
    
    # Create Alertmanager service file
    cat > /etc/systemd/system/alertmanager.service << 'EOF'
[Unit]
Description=Alertmanager
Wants=network-online.target
After=network-online.target

[Service]
User=alertmanager
Group=alertmanager
Type=simple
ExecStart=/usr/local/bin/alertmanager \
    --config.file /etc/alertmanager/alertmanager.yml \
    --storage.path /var/lib/alertmanager/ \
    --web.external-url http://localhost:9093 \
    --cluster.listen-address=""

[Install]
WantedBy=multi-user.target
EOF
    
    # Create Alertmanager user
    useradd --no-create-home --shell /bin/false alertmanager || true
    chown -R alertmanager:alertmanager /etc/alertmanager /var/lib/alertmanager
    
    # Install Alertmanager if not already installed
    if ! command -v alertmanager &> /dev/null; then
        log "INFO" "Installing Alertmanager..."
        ALERTMANAGER_VERSION="0.25.0"
        wget https://github.com/prometheus/alertmanager/releases/download/v${ALERTMANAGER_VERSION}/alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz
        tar xvf alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz
        cp alertmanager-${ALERTMANAGER_VERSION}.linux-amd64/alertmanager /usr/local/bin/
        cp alertmanager-${ALERTMANAGER_VERSION}.linux-amd64/amtool /usr/local/bin/
        rm -rf alertmanager-${ALERTMANAGER_VERSION}.linux-amd64*
    fi
    
    # Start Alertmanager
    systemctl daemon-reload
    systemctl start alertmanager
    systemctl enable alertmanager
    
    log "SUCCESS" "Alertmanager setup complete"
}

# Create monitoring health check script
create_health_check() {
    log "INFO" "Creating monitoring health check script..."
    
    cat > scripts/check-monitoring-health.sh << 'EOF'
#!/bin/bash

# Monitoring Health Check Script
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_service() {
    local service=$1
    local port=$2
    local name=$3
    
    if systemctl is-active --quiet "$service"; then
        if nc -z localhost "$port" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} $name is running and accessible"
            return 0
        else
            echo -e "${YELLOW}⚠${NC} $name is running but port $port is not accessible"
            return 1
        fi
    else
        echo -e "${RED}✗${NC} $name is not running"
        return 1
    fi
}

echo "=== Monitoring Services Health Check ==="
echo

# Check core monitoring services
check_service "prometheus" "9090" "Prometheus"
check_service "alertmanager" "9093" "Alertmanager"
check_service "grafana-server" "3000" "Grafana"

# Check agents
if systemctl is-active --quiet datadog-agent; then
    echo -e "${GREEN}✓${NC} DataDog agent is running"
else
    echo -e "${YELLOW}⚠${NC} DataDog agent is not running"
fi

if systemctl is-active --quiet newrelic-infra; then
    echo -e "${GREEN}✓${NC} New Relic infrastructure agent is running"
else
    echo -e "${YELLOW}⚠${NC} New Relic infrastructure agent is not running"
fi

echo
echo "=== API Endpoint Health Check ==="

# Check monitoring API endpoints
endpoints=(
    "http://localhost:8080/api/performance/health"
    "http://localhost:8080/api/monitoring/health"
    "http://localhost:8080/api/deployment/health"
)

for endpoint in "${endpoints[@]}"; do
    if curl -sf "$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $endpoint is responding"
    else
        echo -e "${RED}✗${NC} $endpoint is not responding"
    fi
done

echo
echo "Health check complete"
EOF
    
    chmod +x scripts/check-monitoring-health.sh
    
    log "SUCCESS" "Health check script created"
}

# Create monitoring maintenance script
create_maintenance_script() {
    log "INFO" "Creating monitoring maintenance script..."
    
    cat > scripts/monitoring-maintenance.sh << 'EOF'
#!/bin/bash

# Monitoring Maintenance Script
set -euo pipefail

RETENTION_DAYS=30
BACKUP_DIR="/var/backups/monitoring"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Cleanup old metrics data
cleanup_metrics() {
    log "Cleaning up old metrics data..."
    
    # Cleanup Prometheus data (older than retention period)
    find /var/lib/prometheus -name "*.db" -mtime +$RETENTION_DAYS -delete || true
    
    # Cleanup logs
    find /var/log -name "*prometheus*" -mtime +$RETENTION_DAYS -delete || true
    find /var/log -name "*alertmanager*" -mtime +$RETENTION_DAYS -delete || true
    find /var/log -name "*grafana*" -mtime +$RETENTION_DAYS -delete || true
    
    log "Cleanup complete"
}

# Backup monitoring configurations
backup_configs() {
    log "Backing up monitoring configurations..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Create timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/monitoring-config-$TIMESTAMP.tar.gz"
    
    # Backup configurations
    tar -czf "$BACKUP_FILE" \
        /etc/prometheus/ \
        /etc/alertmanager/ \
        /etc/grafana/ \
        /etc/datadog-agent/ \
        /etc/newrelic/ || true
    
    log "Configuration backed up to $BACKUP_FILE"
    
    # Remove old backups
    find "$BACKUP_DIR" -name "monitoring-config-*.tar.gz" -mtime +7 -delete || true
}

# Update monitoring rules and dashboards
update_configs() {
    log "Updating monitoring configurations..."
    
    # Reload Prometheus configuration
    if systemctl is-active --quiet prometheus; then
        curl -X POST http://localhost:9090/-/reload || true
        log "Prometheus configuration reloaded"
    fi
    
    # Reload Alertmanager configuration
    if systemctl is-active --quiet alertmanager; then
        curl -X POST http://localhost:9093/-/reload || true
        log "Alertmanager configuration reloaded"
    fi
    
    # Restart Grafana to pick up new dashboards
    if systemctl is-active --quiet grafana-server; then
        systemctl reload grafana-server || true
        log "Grafana configuration reloaded"
    fi
}

# Main execution
case "${1:-maintenance}" in
    "cleanup")
        cleanup_metrics
        ;;
    "backup")
        backup_configs
        ;;
    "update")
        update_configs
        ;;
    "maintenance")
        backup_configs
        cleanup_metrics
        update_configs
        ;;
    *)
        echo "Usage: $0 [cleanup|backup|update|maintenance]"
        exit 1
        ;;
esac

log "Monitoring maintenance completed"
EOF
    
    chmod +x scripts/monitoring-maintenance.sh
    
    # Create cron job for regular maintenance
    cat > /etc/cron.d/monitoring-maintenance << 'EOF'
# Monitoring maintenance cron job
0 2 * * 0 root /opt/relife/scripts/monitoring-maintenance.sh maintenance
0 */6 * * * root /opt/relife/scripts/check-monitoring-health.sh
EOF
    
    log "SUCCESS" "Maintenance script created with cron job"
}

# Verify monitoring setup
verify_setup() {
    log "INFO" "Verifying monitoring setup..."
    
    local errors=0
    
    # Check services
    services=("prometheus" "alertmanager" "datadog-agent" "newrelic-infra")
    for service in "${services[@]}"; do
        if ! systemctl is-active --quiet "$service"; then
            log "ERROR" "$service is not running"
            errors=$((errors + 1))
        fi
    done
    
    # Check ports
    ports=("9090" "9093" "3000")
    for port in "${ports[@]}"; do
        if ! nc -z localhost "$port" 2>/dev/null; then
            log "ERROR" "Port $port is not accessible"
            errors=$((errors + 1))
        fi
    done
    
    # Check configuration files
    configs=(
        "/etc/prometheus/prometheus.yml"
        "/etc/alertmanager/alertmanager.yml"
        "/etc/datadog-agent/datadog.yaml"
        "/etc/newrelic/newrelic.yml"
    )
    
    for config in "${configs[@]}"; do
        if [[ ! -f "$config" ]]; then
            log "ERROR" "Configuration file $config not found"
            errors=$((errors + 1))
        fi
    done
    
    if [[ $errors -eq 0 ]]; then
        log "SUCCESS" "All monitoring services are properly configured and running"
        return 0
    else
        log "ERROR" "Found $errors issues with monitoring setup"
        return 1
    fi
}

# Main execution function
main() {
    log "INFO" "Starting comprehensive monitoring setup for Relife Smart Alarm"
    log "INFO" "Environment: $ENVIRONMENT"
    
    # Check prerequisites
    check_environment
    
    # Setup each monitoring service
    setup_datadog
    setup_newrelic
    setup_prometheus
    setup_grafana
    setup_alertmanager
    
    # Create utility scripts
    create_health_check
    create_maintenance_script
    
    # Verify everything is working
    verify_setup
    
    log "SUCCESS" "Monitoring setup completed successfully!"
    log "INFO" "Access points:"
    log "INFO" "  - Prometheus: http://localhost:9090"
    log "INFO" "  - Alertmanager: http://localhost:9093"
    log "INFO" "  - Grafana: http://localhost:3000"
    log "INFO" ""
    log "INFO" "Run 'scripts/check-monitoring-health.sh' to verify all services"
    log "INFO" "Run 'scripts/monitoring-maintenance.sh' for maintenance tasks"
}

# Execute main function
main "$@"