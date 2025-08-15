#!/bin/bash

# Relife Smart Alarm - External Services Setup Script
# Automates the setup and configuration of external monitoring services

set -e

echo "🚀 Relife Smart Alarm - External Services Setup"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running in project root
if [ ! -f "package.json" ]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

echo ""
echo "This script will help you set up external services for monitoring and analytics."
echo "You'll need API keys from the following services:"
echo "- Supabase (database)"
echo "- PostHog (analytics)"
echo "- DataDog (infrastructure monitoring)"
echo "- New Relic (APM)"
echo "- Sentry (error tracking)"
echo "- Amplitude (user analytics)"
echo "- Firebase (push notifications)"
echo ""

read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Create environment files if they don't exist
ENV_FILES=(".env.local" ".env.development" ".env.staging" ".env.production")

for env_file in "${ENV_FILES[@]}"; do
    if [ ! -f "$env_file" ]; then
        log_info "Creating $env_file from template..."
        cp .env.example "$env_file"
        log_success "Created $env_file"
    else
        log_warning "$env_file already exists, skipping..."
    fi
done

echo ""
echo "📋 Let's configure your external services..."
echo ""

# Function to prompt for service setup
setup_service() {
    local service_name=$1
    local env_vars=("${@:2}")
    
    echo "🔧 Setting up $service_name"
    echo "----------------------------------------"
    
    read -p "Do you want to configure $service_name? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for env_var in "${env_vars[@]}"; do
            read -p "Enter $env_var: " value
            if [ ! -z "$value" ]; then
                # Update .env.local
                if grep -q "^$env_var=" .env.local; then
                    sed -i.bak "s|^$env_var=.*|$env_var=$value|" .env.local
                else
                    echo "$env_var=$value" >> .env.local
                fi
                log_success "Set $env_var in .env.local"
            fi
        done
        
        echo ""
        case $service_name in
            "Supabase")
                log_info "Next steps for Supabase:"
                log_info "1. Run database migrations: 'supabase db push'"
                log_info "2. Set up auth providers in Supabase dashboard"
                ;;
            "PostHog")
                log_info "Next steps for PostHog:"
                log_info "1. Enable session recordings in PostHog dashboard"
                log_info "2. Configure feature flags for gradual rollouts"
                ;;
            "DataDog")
                log_info "Next steps for DataDog:"
                log_info "1. Install DataDog agent: 'docker-compose up -d'"
                log_info "2. Import dashboard from monitoring/grafana/dashboard.json"
                ;;
            "New Relic")
                log_info "Next steps for New Relic:"
                log_info "1. Configure browser monitoring in New Relic UI"
                log_info "2. Set up alert policies"
                ;;
            "Sentry")
                log_info "Next steps for Sentry:"
                log_info "1. Upload source maps for better error tracking"
                log_info "2. Configure GitHub integration"
                ;;
        esac
        echo ""
    else
        log_warning "Skipping $service_name configuration"
        echo ""
    fi
}

# Configure services
setup_service "Supabase" "VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "VITE_SUPABASE_SERVICE_ROLE_KEY"

setup_service "PostHog" "VITE_POSTHOG_KEY"

setup_service "DataDog" "DATADOG_API_KEY" "VITE_DATADOG_CLIENT_TOKEN"

setup_service "New Relic" "NEWRELIC_LICENSE_KEY" "VITE_NEW_RELIC_ACCOUNT_ID"

setup_service "Sentry" "VITE_SENTRY_DSN" "VITE_SENTRY_ORG" "VITE_SENTRY_PROJECT"

setup_service "Amplitude" "VITE_AMPLITUDE_API_KEY"

setup_service "Firebase" "VITE_VAPID_PUBLIC_KEY" "VITE_FIREBASE_CONFIG"

# Docker setup
echo "🐳 Docker Monitoring Stack Setup"
echo "----------------------------------------"
read -p "Do you want to start the monitoring stack with Docker? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Starting monitoring stack..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
        log_success "Monitoring stack started!"
        log_info "Services running:"
        log_info "- Prometheus: http://localhost:9090"
        log_info "- Grafana: http://localhost:3001"
        log_info "- Redis: localhost:6379"
    else
        log_error "docker-compose not found. Please install Docker first."
    fi
    echo ""
fi

# Database setup
echo "🗄️  Database Setup"
echo "----------------------------------------"
read -p "Do you want to run database migrations? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "database/schema-enhanced.sql" ]; then
        log_info "Database schema found. Please run these commands manually:"
        log_info "1. supabase login"
        log_info "2. supabase link --project-ref YOUR_PROJECT_REF"
        log_info "3. supabase db push"
        log_info "Or import database/schema-enhanced.sql directly in Supabase dashboard"
    else
        log_warning "Database schema not found. Please check the database/ directory."
    fi
    echo ""
fi

# Verification
echo "✅ Setup Verification"
echo "----------------------------------------"

# Check if essential environment variables are set
log_info "Checking environment configuration..."

required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY")
all_set=true

for var in "${required_vars[@]}"; do
    if grep -q "^$var=.\+" .env.local; then
        log_success "$var is configured"
    else
        log_error "$var is not configured"
        all_set=false
    fi
done

if [ "$all_set" = true ]; then
    log_success "Essential services are configured!"
else
    log_warning "Some essential services need configuration"
fi

echo ""
echo "🎯 Next Steps"
echo "----------------------------------------"
log_info "1. Test your app: 'npm run dev'"
log_info "2. Check monitoring dashboards"
log_info "3. Verify data is flowing to external services"
log_info "4. Set up alerts and notifications"
log_info "5. Configure production environment variables"
echo ""
log_info "📚 Full setup guide: docs/EXTERNAL_SERVICES_SETUP_GUIDE.md"
echo ""

# Test connectivity (optional)
read -p "Do you want to test external service connectivity? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    log_info "Testing external services..."
    
    # Test Supabase connection
    if grep -q "^VITE_SUPABASE_URL=https://" .env.local; then
        supabase_url=$(grep "^VITE_SUPABASE_URL=" .env.local | cut -d'=' -f2)
        if curl -s "$supabase_url/rest/v1/" >/dev/null; then
            log_success "Supabase connection: OK"
        else
            log_error "Supabase connection: FAILED"
        fi
    fi
    
    # Test PostHog
    if curl -s "https://app.posthog.com/" >/dev/null; then
        log_success "PostHog connectivity: OK"
    else
        log_warning "PostHog connectivity: Could not reach"
    fi
    
    # Test Sentry
    if curl -s "https://sentry.io/" >/dev/null; then
        log_success "Sentry connectivity: OK"
    else
        log_warning "Sentry connectivity: Could not reach"
    fi
    
    echo ""
fi

log_success "External services setup complete!"
log_info "Your Relife Smart Alarm app is now ready for comprehensive monitoring."
echo ""
echo "Happy monitoring! 🎉"