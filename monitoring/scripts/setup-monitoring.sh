#!/bin/bash
# Comprehensive monitoring setup script for Relife Smart Alarm
# This script sets up Prometheus, AlertManager, Grafana, and all monitoring components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITORING_DIR="/opt/relife-monitoring"
PROMETHEUS_VERSION="2.45.0"
ALERTMANAGER_VERSION="0.25.0"
GRAFANA_VERSION="10.0.0"
NODE_EXPORTER_VERSION="1.6.0"

echo -e "${BLUE}=== Relife Smart Alarm - Monitoring Setup ===${NC}"
echo "Setting up comprehensive monitoring infrastructure..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   exit 1
fi

# Create monitoring user
echo -e "${YELLOW}Creating monitoring user...${NC}"
if ! id "prometheus" &>/dev/null; then
    useradd --no-create-home --shell /bin/false prometheus
fi

if ! id "alertmanager" &>/dev/null; then
    useradd --no-create-home --shell /bin/false alertmanager
fi

# Create directories
echo -e "${YELLOW}Creating monitoring directories...${NC}"
mkdir -p $MONITORING_DIR/{prometheus,alertmanager,grafana,node_exporter}
mkdir -p /etc/{prometheus,alertmanager}/rules
mkdir -p /var/lib/{prometheus,alertmanager,grafana}

# Download and install Prometheus
echo -e "${YELLOW}Installing Prometheus $PROMETHEUS_VERSION...${NC}"
cd /tmp
wget -q https://github.com/prometheus/prometheus/releases/download/v$PROMETHEUS_VERSION/prometheus-$PROMETHEUS_VERSION.linux-amd64.tar.gz
tar xzf prometheus-$PROMETHEUS_VERSION.linux-amd64.tar.gz
cp prometheus-$PROMETHEUS_VERSION.linux-amd64/prometheus /usr/local/bin/
cp prometheus-$PROMETHEUS_VERSION.linux-amd64/promtool /usr/local/bin/
chown prometheus:prometheus /usr/local/bin/prometheus
chown prometheus:prometheus /usr/local/bin/promtool
rm -rf prometheus-$PROMETHEUS_VERSION.linux-amd64*

# Download and install AlertManager
echo -e "${YELLOW}Installing AlertManager $ALERTMANAGER_VERSION...${NC}"
wget -q https://github.com/prometheus/alertmanager/releases/download/v$ALERTMANAGER_VERSION/alertmanager-$ALERTMANAGER_VERSION.linux-amd64.tar.gz
tar xzf alertmanager-$ALERTMANAGER_VERSION.linux-amd64.tar.gz
cp alertmanager-$ALERTMANAGER_VERSION.linux-amd64/alertmanager /usr/local/bin/
cp alertmanager-$ALERTMANAGER_VERSION.linux-amd64/amtool /usr/local/bin/
chown alertmanager:alertmanager /usr/local/bin/alertmanager
chown alertmanager:alertmanager /usr/local/bin/amtool
rm -rf alertmanager-$ALERTMANAGER_VERSION.linux-amd64*

# Download and install Node Exporter
echo -e "${YELLOW}Installing Node Exporter $NODE_EXPORTER_VERSION...${NC}"
wget -q https://github.com/prometheus/node_exporter/releases/download/v$NODE_EXPORTER_VERSION/node_exporter-$NODE_EXPORTER_VERSION.linux-amd64.tar.gz
tar xzf node_exporter-$NODE_EXPORTER_VERSION.linux-amd64.tar.gz
cp node_exporter-$NODE_EXPORTER_VERSION.linux-amd64/node_exporter /usr/local/bin/
chown prometheus:prometheus /usr/local/bin/node_exporter
rm -rf node_exporter-$NODE_EXPORTER_VERSION.linux-amd64*

# Set permissions
echo -e "${YELLOW}Setting up permissions...${NC}"
chown -R prometheus:prometheus /etc/prometheus
chown -R prometheus:prometheus /var/lib/prometheus
chown -R alertmanager:alertmanager /etc/alertmanager
chown -R alertmanager:alertmanager /var/lib/alertmanager

# Copy configuration files
echo -e "${YELLOW}Installing configuration files...${NC}"
cp $(dirname "$0")/../prometheus/prometheus.yml /etc/prometheus/
cp $(dirname "$0")/../alertmanager/alertmanager.yml /etc/alertmanager/
cp $(dirname "$0")/../prometheus/alerts/*.yml /etc/prometheus/rules/
cp $(dirname "$0")/../alertmanager/templates/*.tmpl /etc/alertmanager/

# Create systemd service files
echo -e "${YELLOW}Creating systemd services...${NC}"

# Prometheus service
cat > /etc/systemd/system/prometheus.service << EOF
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \\
    --config.file /etc/prometheus/prometheus.yml \\
    --storage.tsdb.path /var/lib/prometheus/ \\
    --web.console.templates=/etc/prometheus/consoles \\
    --web.console.libraries=/etc/prometheus/console_libraries \\
    --web.listen-address=0.0.0.0:9090 \\
    --web.external-url=https://prometheus.relife.app \\
    --storage.tsdb.retention.time=90d \\
    --storage.tsdb.wal-compression \\
    --web.enable-lifecycle \\
    --web.enable-admin-api

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# AlertManager service
cat > /etc/systemd/system/alertmanager.service << EOF
[Unit]
Description=AlertManager
Wants=network-online.target
After=network-online.target

[Service]
User=alertmanager
Group=alertmanager
Type=simple
ExecStart=/usr/local/bin/alertmanager \\
    --config.file /etc/alertmanager/alertmanager.yml \\
    --storage.path /var/lib/alertmanager/ \\
    --web.external-url=https://alertmanager.relife.app \\
    --cluster.listen-address=0.0.0.0:9094

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Node Exporter service
cat > /etc/systemd/system/node_exporter.service << EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/node_exporter \\
    --web.listen-address=0.0.0.0:9100

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Install and start Docker if not present
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Install and start Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Create Grafana Docker setup
echo -e "${YELLOW}Setting up Grafana...${NC}"
mkdir -p /var/lib/grafana
chown 472:472 /var/lib/grafana

# Create Grafana Docker Compose file
cat > $MONITORING_DIR/docker-compose.grafana.yml << EOF
version: '3.8'
services:
  grafana:
    image: grafana/grafana:$GRAFANA_VERSION
    container_name: relife-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_ADMIN_PASSWORD:-admin}
      - GF_SERVER_ROOT_URL=https://grafana.relife.app
      - GF_SMTP_ENABLED=true
      - GF_SMTP_HOST=smtp.gmail.com:587
      - GF_SMTP_USER=\${SMTP_USER}
      - GF_SMTP_PASSWORD=\${SMTP_PASSWORD}
      - GF_SMTP_FROM_ADDRESS=grafana@relife.app
      - GF_ALERTING_ENABLED=true
      - GF_UNIFIED_ALERTING_ENABLED=true
    volumes:
      - /var/lib/grafana:/var/lib/grafana
      - $(dirname "$0")/../grafana:/etc/grafana/provisioning
    networks:
      - monitoring
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  monitoring:
    external: true
EOF

# Reload systemd and start services
echo -e "${YELLOW}Starting monitoring services...${NC}"
systemctl daemon-reload

# Enable and start services
systemctl enable prometheus
systemctl enable alertmanager
systemctl enable node_exporter

systemctl start prometheus
systemctl start alertmanager
systemctl start node_exporter

# Start Grafana with Docker
docker network create monitoring 2>/dev/null || true
cd $MONITORING_DIR
docker-compose -f docker-compose.grafana.yml up -d

# Wait for services to start
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Validate services
echo -e "${YELLOW}Validating services...${NC}"
services=("prometheus:9090" "alertmanager:9093" "node_exporter:9100")

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -s http://localhost:$port > /dev/null; then
        echo -e "${GREEN}✓ $name is running on port $port${NC}"
    else
        echo -e "${RED}✗ $name failed to start on port $port${NC}"
    fi
done

# Check Grafana
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✓ Grafana is running on port 3000${NC}"
else
    echo -e "${RED}✗ Grafana failed to start${NC}"
fi

# Validate Prometheus configuration
echo -e "${YELLOW}Validating Prometheus configuration...${NC}"
if /usr/local/bin/promtool check config /etc/prometheus/prometheus.yml; then
    echo -e "${GREEN}✓ Prometheus configuration is valid${NC}"
else
    echo -e "${RED}✗ Prometheus configuration has errors${NC}"
fi

# Validate AlertManager configuration
echo -e "${YELLOW}Validating AlertManager configuration...${NC}"
if /usr/local/bin/amtool check-config /etc/alertmanager/alertmanager.yml; then
    echo -e "${GREEN}✓ AlertManager configuration is valid${NC}"
else
    echo -e "${RED}✗ AlertManager configuration has errors${NC}"
fi

# Create monitoring status script
cat > /usr/local/bin/relife-monitoring-status << 'EOF'
#!/bin/bash
# Quick monitoring status check script

echo "=== Relife Monitoring Status ==="
echo ""

# Check service status
services=("prometheus" "alertmanager" "node_exporter")
for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        echo "✓ $service: RUNNING"
    else
        echo "✗ $service: STOPPED"
    fi
done

# Check Grafana container
if docker ps | grep -q relife-grafana; then
    echo "✓ grafana: RUNNING"
else
    echo "✗ grafana: STOPPED"
fi

echo ""
echo "=== Service Endpoints ==="
echo "Prometheus: http://localhost:9090"
echo "AlertManager: http://localhost:9093"
echo "Grafana: http://localhost:3000"
echo "Node Exporter: http://localhost:9100"
echo ""

# Check if services are responding
echo "=== Health Checks ==="
curl -s http://localhost:9090/-/healthy >/dev/null && echo "✓ Prometheus: HEALTHY" || echo "✗ Prometheus: UNHEALTHY"
curl -s http://localhost:9093/-/healthy >/dev/null && echo "✓ AlertManager: HEALTHY" || echo "✗ AlertManager: UNHEALTHY"
curl -s http://localhost:3000/api/health >/dev/null && echo "✓ Grafana: HEALTHY" || echo "✗ Grafana: UNHEALTHY"
curl -s http://localhost:9100/metrics >/dev/null && echo "✓ Node Exporter: HEALTHY" || echo "✗ Node Exporter: UNHEALTHY"
EOF

chmod +x /usr/local/bin/relife-monitoring-status

# Create log rotation configuration
cat > /etc/logrotate.d/relife-monitoring << EOF
/var/log/prometheus/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    postrotate
        systemctl reload prometheus
    endscript
}

/var/log/alertmanager/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    postrotate
        systemctl reload alertmanager
    endscript
}
EOF

echo ""
echo -e "${GREEN}=== Monitoring Setup Complete! ===${NC}"
echo ""
echo "Services Status:"
echo "  • Prometheus: http://localhost:9090"
echo "  • AlertManager: http://localhost:9093" 
echo "  • Grafana: http://localhost:3000 (admin/admin)"
echo "  • Node Exporter: http://localhost:9100"
echo ""
echo "Configuration Files:"
echo "  • Prometheus: /etc/prometheus/prometheus.yml"
echo "  • AlertManager: /etc/alertmanager/alertmanager.yml"
echo "  • Alert Rules: /etc/prometheus/rules/"
echo "  • Templates: /etc/alertmanager/templates/"
echo ""
echo "Management Commands:"
echo "  • Check status: relife-monitoring-status"
echo "  • Reload Prometheus config: systemctl reload prometheus"
echo "  • Reload AlertManager config: systemctl reload alertmanager"
echo "  • View logs: journalctl -u prometheus -f"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Configure external notification channels (Slack, PagerDuty, etc.)"
echo "2. Set up SSL certificates for external access"
echo "3. Configure backup and retention policies"
echo "4. Test alert routing and notifications"
echo "5. Import Grafana dashboards"
echo ""
echo -e "${GREEN}Monitoring infrastructure is ready!${NC}"