#!/bin/bash

# =============================================================================
# PRODUCTION CONFIGURATION VALIDATOR
# =============================================================================
# This script validates your production configuration before deployment
# Run this to catch configuration issues early
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

validate_env_file() {
    echo -e "${BLUE}🔍 Validating Environment Configuration${NC}"
    echo "========================================"
    
    local env_file="$PROJECT_ROOT/.env.production"
    
    if [[ ! -f "$env_file" ]]; then
        echo -e "${RED}❌ .env.production file not found${NC}"
        echo "Please copy monitoring/.env.production.template to .env.production"
        return 1
    fi
    
    # Source environment file
    set -a
    source "$env_file"
    set +a
    
    local issues=0
    
    # Check critical variables
    local critical_vars=(
        "RELIFE_DOMAIN:Domain name"
        "GRAFANA_ADMIN_PASSWORD:Grafana admin password"
        "SUPABASE_URL:Supabase URL"
        "SUPABASE_SERVICE_ROLE_KEY:Supabase service role key"
    )
    
    echo ""
    echo "🔐 Critical Configuration:"
    for var_info in "${critical_vars[@]}"; do
        IFS=':' read -r var desc <<< "$var_info"
        if [[ -n "${!var}" ]] && [[ "${!var}" != *"your_"* ]] && [[ "${!var}" != *"_here"* ]]; then
            echo -e "  ✅ $desc: ${GREEN}Configured${NC}"
        else
            echo -e "  ❌ $desc: ${RED}Missing or using template value${NC}"
            ((issues++))
        fi
    done
    
    # Check notification channels
    echo ""
    echo "🔔 Notification Channels:"
    local notification_channels=(
        "SLACK_WEBHOOK_URL:Slack webhook"
        "DISCORD_WEBHOOK_URL:Discord webhook"
        "SMTP_HOST:Email SMTP"
        "PAGERDUTY_ROUTING_KEY_CRITICAL:PagerDuty critical"
    )
    
    local configured_channels=0
    for channel_info in "${notification_channels[@]}"; do
        IFS=':' read -r var desc <<< "$channel_info"
        if [[ -n "${!var}" ]] && [[ "${!var}" != *"your_"* ]]; then
            echo -e "  ✅ $desc: ${GREEN}Configured${NC}"
            ((configured_channels++))
        else
            echo -e "  ⚪ $desc: ${YELLOW}Not configured${NC}"
        fi
    done
    
    if [[ $configured_channels -eq 0 ]]; then
        echo -e "  ${RED}❌ No notification channels configured - you won't receive alerts!${NC}"
        ((issues++))
    fi
    
    # Check thresholds
    echo ""
    echo "📊 Alert Thresholds:"
    local threshold_vars=(
        "DAU_WARNING_THRESHOLD:Daily Active Users warning"
        "RESPONSE_TIME_WARNING:Response time warning (ms)"
        "ERROR_RATE_WARNING:Error rate warning (%)"
        "UPTIME_TARGET_PUBLIC:Public uptime target (%)"
    )
    
    for threshold_info in "${threshold_vars[@]}"; do
        IFS=':' read -r var desc <<< "$threshold_info"
        if [[ -n "${!var}" ]] && [[ "${!var}" =~ ^[0-9.]+$ ]]; then
            echo -e "  ✅ $desc: ${GREEN}${!var}${NC}"
        else
            echo -e "  ⚪ $desc: ${YELLOW}Using default${NC}"
        fi
    done
    
    echo ""
    if [[ $issues -eq 0 ]]; then
        echo -e "${GREEN}✅ Configuration validation passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ Found $issues configuration issues${NC}"
        return 1
    fi
}

validate_docker_setup() {
    echo -e "${BLUE}🐳 Validating Docker Setup${NC}"
    echo "=========================="
    
    local issues=0
    
    # Check Docker installation
    if command -v docker &> /dev/null; then
        echo -e "  ✅ Docker: ${GREEN}Installed${NC}"
        
        # Check Docker service
        if systemctl is-active --quiet docker; then
            echo -e "  ✅ Docker service: ${GREEN}Running${NC}"
        else
            echo -e "  ❌ Docker service: ${RED}Not running${NC}"
            ((issues++))
        fi
        
        # Check Docker Compose
        if docker compose version &> /dev/null; then
            echo -e "  ✅ Docker Compose: ${GREEN}Available${NC}"
        else
            echo -e "  ❌ Docker Compose: ${RED}Not available${NC}"
            ((issues++))
        fi
        
        # Check Docker permissions
        if docker ps &> /dev/null; then
            echo -e "  ✅ Docker permissions: ${GREEN}OK${NC}"
        else
            echo -e "  ❌ Docker permissions: ${RED}User cannot run Docker${NC}"
            echo "    Run: sudo usermod -aG docker \$USER && newgrp docker"
            ((issues++))
        fi
    else
        echo -e "  ❌ Docker: ${RED}Not installed${NC}"
        ((issues++))
    fi
    
    # Check available disk space
    local available_space=$(df /var/lib/docker --output=avail | tail -1)
    if [[ $available_space -gt 10485760 ]]; then  # 10GB in KB
        echo -e "  ✅ Disk space: ${GREEN}Sufficient${NC}"
    else
        echo -e "  ⚠️  Disk space: ${YELLOW}Low ($(numfmt --to=iec --from-unit=1024 $available_space))${NC}"
    fi
    
    echo ""
    if [[ $issues -eq 0 ]]; then
        echo -e "${GREEN}✅ Docker setup validation passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ Found $issues Docker issues${NC}"
        return 1
    fi
}

validate_network_connectivity() {
    echo -e "${BLUE}🌐 Validating Network Connectivity${NC}"
    echo "=================================="
    
    local issues=0
    
    # Test external connectivity
    if curl -sf https://prometheus.io > /dev/null 2>&1; then
        echo -e "  ✅ External connectivity: ${GREEN}OK${NC}"
    else
        echo -e "  ❌ External connectivity: ${RED}Failed${NC}"
        ((issues++))
    fi
    
    # Test Docker Hub connectivity
    if curl -sf https://registry-1.docker.io > /dev/null 2>&1; then
        echo -e "  ✅ Docker Hub access: ${GREEN}OK${NC}"
    else
        echo -e "  ❌ Docker Hub access: ${RED}Failed${NC}"
        ((issues++))
    fi
    
    # Check if ports are available
    local required_ports=(9090 9093 3000 8080 9100 9091)
    echo ""
    echo "📡 Port Availability:"
    
    for port in "${required_ports[@]}"; do
        if ss -tuln | grep -q ":$port "; then
            echo -e "  ⚠️  Port $port: ${YELLOW}In use${NC}"
        else
            echo -e "  ✅ Port $port: ${GREEN}Available${NC}"
        fi
    done
    
    echo ""
    if [[ $issues -eq 0 ]]; then
        echo -e "${GREEN}✅ Network validation passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ Found $issues network issues${NC}"
        return 1
    fi
}

validate_dependencies() {
    echo -e "${BLUE}📦 Validating Dependencies${NC}"
    echo "========================="
    
    local issues=0
    local required_commands=("curl" "wget" "jq" "openssl" "tar" "gzip")
    
    for cmd in "${required_commands[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            echo -e "  ✅ $cmd: ${GREEN}Available${NC}"
        else
            echo -e "  ❌ $cmd: ${RED}Missing${NC}"
            ((issues++))
        fi
    done
    
    echo ""
    if [[ $issues -eq 0 ]]; then
        echo -e "${GREEN}✅ Dependencies validation passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ Missing $issues dependencies${NC}"
        echo "Install missing dependencies:"
        echo "sudo apt-get update && sudo apt-get install -y curl wget jq openssl"
        return 1
    fi
}

validate_monitoring_files() {
    echo -e "${BLUE}📁 Validating Monitoring Files${NC}"
    echo "=============================="
    
    local issues=0
    local required_files=(
        "monitoring/prometheus/prometheus.yml:Prometheus configuration"
        "monitoring/alertmanager/alertmanager.yml:AlertManager configuration"
        "monitoring/prometheus/alerts/business-metrics.yml:Business alerts"
        "monitoring/prometheus/alerts/mobile-performance.yml:Mobile alerts"
        "monitoring/prometheus/alerts/security-monitoring.yml:Security alerts"
        "monitoring/prometheus/alerts/sla-uptime.yml:SLA alerts"
        "monitoring/grafana/enhanced-dashboard.json:Enhanced dashboard"
        "docker-compose.monitoring.yml:Docker Compose file"
    )
    
    for file_info in "${required_files[@]}"; do
        IFS=':' read -r file desc <<< "$file_info"
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            echo -e "  ✅ $desc: ${GREEN}Present${NC}"
        else
            echo -e "  ❌ $desc: ${RED}Missing${NC}"
            echo "     File: $file"
            ((issues++))
        fi
    done
    
    echo ""
    if [[ $issues -eq 0 ]]; then
        echo -e "${GREEN}✅ Monitoring files validation passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ Missing $issues monitoring files${NC}"
        return 1
    fi
}

test_webhook_connectivity() {
    echo -e "${BLUE}🔗 Testing Webhook Connectivity${NC}"
    echo "==============================="
    
    if [[ ! -f "$PROJECT_ROOT/.env.production" ]]; then
        echo -e "${YELLOW}⚪ No .env.production file found - skipping webhook tests${NC}"
        return 0
    fi
    
    # Source environment file
    set -a
    source "$PROJECT_ROOT/.env.production"
    set +a
    
    local issues=0
    
    # Test Slack webhook
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        echo "Testing Slack webhook..."
        local slack_payload='{"text":"🧪 Pre-deployment webhook test from Relife Monitoring"}'
        
        if curl -X POST -H 'Content-type: application/json' \
           --data "$slack_payload" "$SLACK_WEBHOOK_URL" > /dev/null 2>&1; then
            echo -e "  ✅ Slack webhook: ${GREEN}Working${NC}"
        else
            echo -e "  ❌ Slack webhook: ${RED}Failed${NC}"
            ((issues++))
        fi
    else
        echo -e "  ⚪ Slack webhook: ${YELLOW}Not configured${NC}"
    fi
    
    # Test Discord webhook
    if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
        echo "Testing Discord webhook..."
        local discord_payload='{"content":"🧪 Pre-deployment webhook test from Relife Monitoring"}'
        
        if curl -X POST -H 'Content-type: application/json' \
           --data "$discord_payload" "$DISCORD_WEBHOOK_URL" > /dev/null 2>&1; then
            echo -e "  ✅ Discord webhook: ${GREEN}Working${NC}"
        else
            echo -e "  ❌ Discord webhook: ${RED}Failed${NC}"
            ((issues++))
        fi
    else
        echo -e "  ⚪ Discord webhook: ${YELLOW}Not configured${NC}"
    fi
    
    echo ""
    if [[ $issues -eq 0 ]]; then
        echo -e "${GREEN}✅ Webhook connectivity validation passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ Found $issues webhook connectivity issues${NC}"
        return 1
    fi
}

main() {
    echo -e "${BLUE}🔍 Relife Monitoring - Production Configuration Validator${NC}"
    echo "=========================================================="
    echo ""
    
    cd "$PROJECT_ROOT"
    
    local total_issues=0
    
    # Run all validations
    validate_dependencies || ((total_issues++))
    echo ""
    
    validate_docker_setup || ((total_issues++))
    echo ""
    
    validate_monitoring_files || ((total_issues++))
    echo ""
    
    validate_env_file || ((total_issues++))
    echo ""
    
    test_webhook_connectivity || ((total_issues++))
    echo ""
    
    # Final summary
    echo "🏁 VALIDATION SUMMARY"
    echo "===================="
    
    if [[ $total_issues -eq 0 ]]; then
        echo -e "${GREEN}🎉 All validations passed! Ready for production deployment.${NC}"
        echo ""
        echo "To deploy, run:"
        echo -e "${BLUE}  ./monitoring/scripts/deploy-production.sh${NC}"
        echo ""
        exit 0
    else
        echo -e "${RED}❌ Found issues in $total_issues validation areas${NC}"
        echo ""
        echo "Please fix the issues above before deployment."
        echo ""
        echo "Quick fixes:"
        echo "- Missing dependencies: sudo apt-get install -y curl wget jq openssl"
        echo "- Configure webhooks: ./monitoring/scripts/setup-webhooks.sh"
        echo "- Edit environment: nano .env.production"
        echo ""
        exit 1
    fi
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi