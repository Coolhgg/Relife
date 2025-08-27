#!/bin/bash

# =============================================================================
# WEBHOOK SETUP AND TESTING UTILITY
# =============================================================================
# This script helps you set up and test webhook integrations for monitoring alerts
# Run this before production deployment to ensure notifications work correctly
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# =============================================================================
# SLACK WEBHOOK SETUP
# =============================================================================

setup_slack() {
    echo -e "${BLUE}🔧 Setting up Slack Integration${NC}"
    echo "=================================="
    echo ""
    echo "To set up Slack alerts:"
    echo "1. Go to https://api.slack.com/messaging/webhooks"
    echo "2. Click 'Create your Slack app'"
    echo "3. Choose 'From scratch'"
    echo "4. Name your app 'Relife Monitoring' and select your workspace"
    echo "5. Go to 'Incoming Webhooks' and activate them"
    echo "6. Click 'Add New Webhook to Workspace'"
    echo "7. Select the channel for alerts (e.g., #critical-alerts)"
    echo "8. Copy the webhook URL"
    echo ""
    
    read -p "Enter your Slack webhook URL (or press Enter to skip): " slack_url
    
    if [[ -n "$slack_url" ]]; then
        echo "Testing Slack webhook..."
        local test_payload='{"text":"🧪 Test alert from Relife Monitoring setup! If you see this, Slack integration is working correctly."}'
        
        if curl -X POST -H 'Content-type: application/json' \
           --data "$test_payload" "$slack_url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Slack webhook test successful!${NC}"
            echo "SLACK_WEBHOOK_URL=$slack_url" >> .webhook-config
        else
            echo -e "${RED}❌ Slack webhook test failed${NC}"
        fi
    else
        echo "Skipping Slack setup..."
    fi
    echo ""
}

# =============================================================================
# DISCORD WEBHOOK SETUP
# =============================================================================

setup_discord() {
    echo -e "${BLUE}🔧 Setting up Discord Integration${NC}"
    echo "==================================="
    echo ""
    echo "To set up Discord alerts:"
    echo "1. Go to your Discord server"
    echo "2. Right-click on the channel where you want alerts"
    echo "3. Go to 'Edit Channel' → 'Integrations' → 'Webhooks'"
    echo "4. Click 'Create Webhook'"
    echo "5. Name it 'Relife Monitoring'"
    echo "6. Copy the webhook URL"
    echo ""
    
    read -p "Enter your Discord webhook URL (or press Enter to skip): " discord_url
    
    if [[ -n "$discord_url" ]]; then
        echo "Testing Discord webhook..."
        local test_payload='{"content":"🧪 Test alert from Relife Monitoring setup! If you see this, Discord integration is working correctly."}'
        
        if curl -X POST -H 'Content-type: application/json' \
           --data "$test_payload" "$discord_url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Discord webhook test successful!${NC}"
            echo "DISCORD_WEBHOOK_URL=$discord_url" >> .webhook-config
        else
            echo -e "${RED}❌ Discord webhook test failed${NC}"
        fi
    else
        echo "Skipping Discord setup..."
    fi
    echo ""
}

# =============================================================================
# EMAIL/SMTP SETUP
# =============================================================================

setup_email() {
    echo -e "${BLUE}🔧 Setting up Email Integration${NC}"
    echo "================================="
    echo ""
    echo "For email alerts, you'll need SMTP credentials."
    echo "Common providers:"
    echo "- Gmail: smtp.gmail.com:587 (use App Password)"
    echo "- Outlook: smtp.office365.com:587"
    echo "- SendGrid: smtp.sendgrid.net:587"
    echo "- Mailgun: smtp.mailgun.org:587"
    echo ""
    
    read -p "SMTP Host (e.g., smtp.gmail.com): " smtp_host
    read -p "SMTP Port (default 587): " smtp_port
    smtp_port=${smtp_port:-587}
    read -p "SMTP Username/Email: " smtp_user
    read -s -p "SMTP Password: " smtp_password
    echo ""
    read -p "From Address (e.g., alerts@relife.app): " from_address
    
    if [[ -n "$smtp_host" ]] && [[ -n "$smtp_user" ]] && [[ -n "$smtp_password" ]]; then
        echo "Testing SMTP connection..."
        
        # Test SMTP with a simple command
        if command -v swaks &> /dev/null; then
            if swaks --to "$smtp_user" --from "$from_address" \
               --server "$smtp_host:$smtp_port" \
               --auth-user "$smtp_user" --auth-password "$smtp_password" \
               --header "Subject: Relife Monitoring Test" \
               --body "Test email from Relife Monitoring setup" \
               --tls > /dev/null 2>&1; then
                echo -e "${GREEN}✅ SMTP test successful!${NC}"
            else
                echo -e "${YELLOW}⚠️  SMTP test inconclusive (install 'swaks' for proper testing)${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Install 'swaks' to test SMTP connection${NC}"
        fi
        
        cat >> .webhook-config <<EOF
SMTP_HOST=$smtp_host
SMTP_PORT=$smtp_port
SMTP_USER=$smtp_user
SMTP_PASSWORD=$smtp_password
SMTP_FROM_ADDRESS=$from_address
EOF
    else
        echo "Skipping SMTP setup..."
    fi
    echo ""
}

# =============================================================================
# PAGERDUTY SETUP
# =============================================================================

setup_pagerduty() {
    echo -e "${BLUE}🔧 Setting up PagerDuty Integration${NC}"
    echo "===================================="
    echo ""
    echo "To set up PagerDuty alerts:"
    echo "1. Log into your PagerDuty account"
    echo "2. Go to 'Services' → 'Service Directory'"
    echo "3. Create or select your service"
    echo "4. Go to 'Integrations' tab"
    echo "5. Add integration → 'Prometheus'"
    echo "6. Copy the Integration Key (Routing Key)"
    echo ""
    
    read -p "PagerDuty Routing Key for CRITICAL alerts (or press Enter to skip): " pd_critical
    read -p "PagerDuty Routing Key for URGENT alerts (or press Enter to skip): " pd_urgent
    
    if [[ -n "$pd_critical" ]] || [[ -n "$pd_urgent" ]]; then
        if [[ -n "$pd_critical" ]]; then
            echo "PAGERDUTY_ROUTING_KEY_CRITICAL=$pd_critical" >> .webhook-config
        fi
        if [[ -n "$pd_urgent" ]]; then
            echo "PAGERDUTY_ROUTING_KEY_URGENT=$pd_urgent" >> .webhook-config
        fi
        echo -e "${GREEN}✅ PagerDuty integration configured${NC}"
    else
        echo "Skipping PagerDuty setup..."
    fi
    echo ""
}

# =============================================================================
# GENERATE ENVIRONMENT FILE
# =============================================================================

generate_env_file() {
    echo -e "${BLUE}🔧 Generating Environment Configuration${NC}"
    echo "========================================"
    echo ""
    
    if [[ ! -f ".webhook-config" ]]; then
        echo -e "${YELLOW}No webhook configuration found. Run setup first.${NC}"
        return
    fi
    
    # Create production environment file
    local env_file=".env.production"
    
    # Copy template
    cp "monitoring/.env.production.template" "$env_file"
    
    # Apply webhook configuration
    while IFS='=' read -r key value; do
        if [[ -n "$key" ]] && [[ -n "$value" ]]; then
            # Escape special characters for sed
            value_escaped=$(printf '%s\n' "$value" | sed 's/[[\.*^$()+?{|]/\\&/g')
            sed -i "s|^${key}=.*|${key}=${value_escaped}|" "$env_file"
        fi
    done < .webhook-config
    
    # Generate secure passwords
    local grafana_password=$(openssl rand -base64 32)
    local webhook_token=$(openssl rand -base64 48)
    
    sed -i "s/your_secure_grafana_password_here/$grafana_password/" "$env_file"
    sed -i "s/your_webhook_auth_token_here/$webhook_token/" "$env_file"
    
    echo -e "${GREEN}✅ Environment file generated: $env_file${NC}"
    echo ""
    echo -e "${YELLOW}📝 Important:${NC}"
    echo "1. Review and update $env_file with your specific values"
    echo "2. Set your domain name (RELIFE_DOMAIN)"
    echo "3. Configure Supabase credentials"
    echo "4. Adjust alert thresholds as needed"
    echo ""
    echo "Grafana admin password: $grafana_password"
    echo "(This is also saved in your .env.production file)"
    echo ""
    
    # Clean up
    rm -f .webhook-config
}

# =============================================================================
# MAIN MENU
# =============================================================================

main_menu() {
    echo -e "${BLUE}🔧 Relife Monitoring Webhook Setup${NC}"
    echo "===================================="
    echo ""
    echo "This utility will help you configure notification channels for monitoring alerts."
    echo ""
    echo "Choose setup option:"
    echo "1) Complete setup (Slack + Discord + Email + PagerDuty)"
    echo "2) Slack only"
    echo "3) Discord only" 
    echo "4) Email only"
    echo "5) PagerDuty only"
    echo "6) Generate environment file from existing config"
    echo "7) Test existing webhooks"
    echo "8) Exit"
    echo ""
    
    read -p "Select option (1-8): " choice
    
    case $choice in
        1)
            setup_slack
            setup_discord
            setup_email
            setup_pagerduty
            generate_env_file
            ;;
        2)
            setup_slack
            generate_env_file
            ;;
        3)
            setup_discord
            generate_env_file
            ;;
        4)
            setup_email
            generate_env_file
            ;;
        5)
            setup_pagerduty
            generate_env_file
            ;;
        6)
            generate_env_file
            ;;
        7)
            test_existing_webhooks
            ;;
        8)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            main_menu
            ;;
    esac
}

# =============================================================================
# TEST EXISTING WEBHOOKS
# =============================================================================

test_existing_webhooks() {
    echo -e "${BLUE}🧪 Testing Existing Webhooks${NC}"
    echo "============================="
    echo ""
    
    if [[ -f ".env.production" ]]; then
        source .env.production
        
        # Test Slack
        if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
            echo "Testing Slack webhook..."
            local slack_payload='{"text":"🧪 Webhook test from Relife Monitoring - ' $(date) '"}'
            
            if curl -X POST -H 'Content-type: application/json' \
               --data "$slack_payload" "$SLACK_WEBHOOK_URL" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Slack webhook working${NC}"
            else
                echo -e "${RED}❌ Slack webhook failed${NC}"
            fi
        fi
        
        # Test Discord
        if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
            echo "Testing Discord webhook..."
            local discord_payload='{"content":"🧪 Webhook test from Relife Monitoring - ' $(date) '"}'
            
            if curl -X POST -H 'Content-type: application/json' \
               --data "$discord_payload" "$DISCORD_WEBHOOK_URL" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Discord webhook working${NC}"
            else
                echo -e "${RED}❌ Discord webhook failed${NC}"
            fi
        fi
        
        echo ""
        echo "Webhook testing complete!"
    else
        echo -e "${RED}No .env.production file found${NC}"
    fi
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    cd "$(dirname "$0")/../.."
    main_menu
fi