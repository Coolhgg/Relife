#!/bin/bash

# =============================================================================
# PRODUCTION DEPLOYMENT ASSISTANT
# =============================================================================
# Interactive deployment guide that walks you through each step
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

print_header() {
    clear
    echo -e "${BLUE}🚀 Relife Monitoring - Production Deployment Assistant${NC}"
    echo "========================================================"
    echo ""
}

print_step() {
    echo -e "${CYAN}📍 Step $1: $2${NC}"
    echo "$(printf '%.0s─' {1..50})"
}

confirm_step() {
    echo ""
    read -p "Ready to proceed? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Exiting deployment..."
        exit 0
    fi
}

check_prerequisites() {
    print_header
    print_step "1" "Checking Prerequisites"
    echo ""
    
    local issues=0
    
    # Check if we're on the production server
    echo "🖥️  Checking server environment..."
    
    # Check required commands
    local commands=("docker" "curl" "git" "openssl")
    for cmd in "${commands[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            echo -e "  ✅ $cmd: ${GREEN}Available${NC}"
        else
            echo -e "  ❌ $cmd: ${RED}Missing${NC}"
            ((issues++))
        fi
    done
    
    # Check Docker service
    if systemctl is-active --quiet docker; then
        echo -e "  ✅ Docker service: ${GREEN}Running${NC}"
    else
        echo -e "  ❌ Docker service: ${RED}Not running${NC}"
        ((issues++))
    fi
    
    # Check if we're in the right directory
    if [[ -f "docker-compose.monitoring.yml" ]]; then
        echo -e "  ✅ Project directory: ${GREEN}Correct${NC}"
    else
        echo -e "  ❌ Project directory: ${RED}Wrong location${NC}"
        echo "    Please run this script from the Relife project root"
        ((issues++))
    fi
    
    echo ""
    if [[ $issues -gt 0 ]]; then
        echo -e "${RED}❌ Found $issues issues. Please fix them before continuing.${NC}"
        echo ""
        echo "Common fixes:"
        echo "• Install Docker: curl -fsSL https://get.docker.com | sh"
        echo "• Start Docker: sudo systemctl start docker"
        echo "• Add user to docker group: sudo usermod -aG docker \$USER"
        echo "• Install utilities: sudo apt-get install -y curl git openssl"
        echo ""
        exit 1
    else
        echo -e "${GREEN}✅ All prerequisites met!${NC}"
        confirm_step
    fi
}

setup_notifications() {
    print_header
    print_step "2" "Configure Notification Channels"
    echo ""
    
    echo "Setting up where you'll receive monitoring alerts..."
    echo ""
    echo "Available options:"
    echo "1. 💬 Slack - Team chat notifications"
    echo "2. 🎮 Discord - Gaming community notifications"  
    echo "3. 📧 Email - Traditional email alerts"
    echo "4. 📟 PagerDuty - Enterprise incident management"
    echo ""
    echo "You can configure multiple channels for different alert types."
    echo ""
    
    confirm_step
    
    # Run webhook setup
    echo "Starting interactive webhook setup..."
    echo ""
    ./monitoring/scripts/setup-webhooks.sh
    
    echo ""
    echo -e "${GREEN}✅ Notification channels configured!${NC}"
    echo ""
    read -p "Press Enter to continue..."
}

configure_environment() {
    print_header
    print_step "3" "Configure Production Environment"
    echo ""
    
    echo "Now we'll configure your production settings..."
    echo ""
    
    # Check if .env.production exists
    if [[ -f ".env.production" ]]; then
        echo -e "${GREEN}✅ Found existing .env.production file${NC}"
        echo ""
        echo "Current configuration preview:"
        echo "$(head -10 .env.production | grep -E '^[A-Z]' | head -5)"
        echo "..."
        echo ""
        
        read -p "Do you want to edit the configuration? (y/N): " edit_env
        if [[ "$edit_env" =~ ^[Yy]$ ]]; then
            echo ""
            echo "Opening configuration file..."
            echo "Please update these critical values:"
            echo "• RELIFE_DOMAIN (your domain name)"
            echo "• POSTGRES_HOST and database credentials"
            echo "• SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
            echo "• LETSENCRYPT_EMAIL for SSL certificates"
            echo ""
            read -p "Press Enter to open editor..."
            nano .env.production
        fi
    else
        echo -e "${YELLOW}⚠️  No .env.production file found${NC}"
        echo "Creating from template..."
        cp monitoring/.env.production.template .env.production
        echo ""
        echo "Please configure these required values:"
        echo "• RELIFE_DOMAIN"
        echo "• Database credentials"
        echo "• Supabase credentials"
        echo "• LETSENCRYPT_EMAIL"
        echo ""
        read -p "Press Enter to open editor..."
        nano .env.production
    fi
    
    echo ""
    echo -e "${GREEN}✅ Environment configuration complete!${NC}"
    confirm_step
}

run_validation() {
    print_header
    print_step "4" "Validate Configuration"
    echo ""
    
    echo "Running comprehensive validation checks..."
    echo ""
    
    if ./monitoring/scripts/validate-production-config.sh; then
        echo ""
        echo -e "${GREEN}🎉 All validations passed! Ready for deployment.${NC}"
        confirm_step
    else
        echo ""
        echo -e "${RED}❌ Validation failed. Please fix the issues above.${NC}"
        echo ""
        read -p "Would you like to edit configuration again? (y/N): " edit_again
        if [[ "$edit_again" =~ ^[Yy]$ ]]; then
            nano .env.production
            run_validation  # Retry validation
        else
            exit 1
        fi
    fi
}

deploy_system() {
    print_header
    print_step "5" "Deploy Monitoring System"
    echo ""
    
    echo "🚀 Starting production deployment..."
    echo ""
    echo "This will:"
    echo "• Set up Docker containers for all monitoring services"
    echo "• Configure SSL certificates with Let's Encrypt"
    echo "• Import Grafana dashboards"
    echo "• Start metrics collection"
    echo "• Test all notification channels"
    echo ""
    echo "⏱️  Estimated time: 10-15 minutes"
    echo ""
    
    confirm_step
    
    # Run deployment
    ./monitoring/scripts/deploy-production.sh
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    read -p "Press Enter to continue to verification..."
}

verify_deployment() {
    print_header
    print_step "6" "Verify Deployment"
    echo ""
    
    echo "🔍 Running post-deployment verification..."
    echo ""
    
    # Run health check
    ./monitoring/scripts/health-check.sh
    
    echo ""
    echo "🌐 Testing web access..."
    
    # Get domain from env file
    source .env.production
    
    local endpoints=(
        "https://$GRAFANA_DOMAIN"
        "https://$PROMETHEUS_DOMAIN" 
        "https://$ALERTMANAGER_DOMAIN"
    )
    
    for endpoint in "${endpoints[@]}"; do
        echo -n "Testing $endpoint... "
        if curl -sf "$endpoint" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Accessible${NC}"
        else
            echo -e "${YELLOW}⚠️  Check SSL/DNS${NC}"
        fi
    done
    
    echo ""
    echo "🔔 Testing alert notifications..."
    
    # Send test alert
    curl -X POST http://localhost:9093/api/v1/alerts \
      -H "Content-Type: application/json" \
      -d '[{
        "labels": {
          "alertname": "DeploymentTest",
          "severity": "info",
          "service": "monitoring"
        },
        "annotations": {
          "summary": "🎉 Monitoring system deployed successfully!",
          "description": "This is a test alert to verify your notification channels are working."
        }
      }]' > /dev/null 2>&1
    
    echo "Test alert sent! Check your notification channels."
    echo ""
    confirm_step
}

show_success_summary() {
    print_header
    echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
    echo "=========================="
    echo ""
    
    # Get credentials from deployment report
    local grafana_password
    if [[ -f "MONITORING_DEPLOYMENT_REPORT.md" ]]; then
        grafana_password=$(grep "Password:" MONITORING_DEPLOYMENT_REPORT.md | cut -d'`' -f2)
    fi
    
    source .env.production 2>/dev/null || true
    
    echo -e "${BLUE}🌐 Access Your Monitoring System:${NC}"
    echo ""
    echo -e "📊 **Grafana Dashboard:** ${GREEN}https://${GRAFANA_DOMAIN:-grafana.yourdomain.com}${NC}"
    echo -e "   Username: ${YELLOW}admin${NC}"
    echo -e "   Password: ${YELLOW}${grafana_password:-check_deployment_report}${NC}"
    echo ""
    echo -e "📈 **Prometheus:** ${GREEN}https://${PROMETHEUS_DOMAIN:-prometheus.yourdomain.com}${NC}"
    echo -e "🚨 **AlertManager:** ${GREEN}https://${ALERTMANAGER_DOMAIN:-alertmanager.yourdomain.com}${NC}"
    echo ""
    
    echo -e "${PURPLE}📊 What's Being Monitored:${NC}"
    echo "• Business metrics (revenue, DAU, churn rates)"
    echo "• Mobile app performance (crash rates, performance)"
    echo "• Security threats (auth failures, API abuse)"
    echo "• SLA compliance (uptime, response times)"
    echo "• System health (CPU, memory, disk usage)"
    echo ""
    
    echo -e "${CYAN}🔔 Alert Channels:${NC}"
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        echo "✅ Slack notifications enabled"
    fi
    if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
        echo "✅ Discord notifications enabled"
    fi
    if [[ -n "$SMTP_HOST" ]]; then
        echo "✅ Email notifications enabled"
    fi
    if [[ -n "$PAGERDUTY_ROUTING_KEY_CRITICAL" ]]; then
        echo "✅ PagerDuty escalation enabled"
    fi
    echo ""
    
    echo -e "${YELLOW}📋 Useful Commands:${NC}"
    echo "• Health check: ./monitoring/scripts/health-check.sh"
    echo "• View logs: docker-compose -f docker-compose.monitoring.yml logs"
    echo "• Manual backup: ./monitoring/scripts/backup-monitoring.sh"
    echo "• Test webhooks: ./monitoring/scripts/setup-webhooks.sh"
    echo ""
    
    echo -e "${GREEN}🎯 Your monitoring system is now protecting your Relife Smart Alarm in production!${NC}"
    echo ""
}

main() {
    cd "$PROJECT_ROOT"
    
    echo -e "${BLUE}Welcome to the Relife Monitoring Production Deployment Assistant!${NC}"
    echo ""
    echo "This interactive guide will help you deploy comprehensive monitoring"
    echo "to your production server in about 30 minutes."
    echo ""
    echo "We'll walk through:"
    echo "1. ✅ Prerequisites check"
    echo "2. 🔔 Notification setup (Slack, Discord, Email)"
    echo "3. ⚙️  Environment configuration" 
    echo "4. ✅ Pre-deployment validation"
    echo "5. 🚀 Production deployment"
    echo "6. 🔍 Verification and testing"
    echo ""
    
    read -p "Ready to start? (y/N): " start_deploy
    if [[ ! "$start_deploy" =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    # Run deployment steps
    check_prerequisites
    setup_notifications
    configure_environment
    run_validation
    deploy_system
    verify_deployment
    show_success_summary
}

# Handle command line arguments
case "${1:-interactive}" in
    "interactive"|"")
        main
        ;;
    "check")
        check_prerequisites
        ;;
    "webhooks")
        setup_notifications
        ;;
    "config")
        configure_environment
        ;;
    "validate")
        run_validation
        ;;
    "deploy")
        deploy_system
        ;;
    "verify")
        verify_deployment
        ;;
    "help")
        echo "Relife Monitoring Production Deployment Assistant"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  interactive (default) - Full interactive deployment"
        echo "  check                - Check prerequisites only"
        echo "  webhooks             - Configure notifications only"
        echo "  config               - Configure environment only"
        echo "  validate             - Run validation only"
        echo "  deploy               - Run deployment only"
        echo "  verify               - Verify deployment only"
        echo "  help                 - Show this help"
        echo ""
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for available commands."
        exit 1
        ;;
esac