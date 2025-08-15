#!/bin/bash
# Health check script for Relife Smart Alarm App
# Comprehensive health monitoring for production deployment

set -e

# Configuration
HEALTH_CHECK_URL="http://localhost/health"
METRICS_URL="http://localhost/metrics"
APP_URL="http://localhost/"
TIMEOUT=10
MAX_RETRIES=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Error logging function
error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Warning logging function
warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

# Success logging function
success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    log "Checking $description..."
    
    local response
    local http_code
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
        http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "$expected_status" ]; then
            success "$description is healthy (HTTP $http_code)"
            return 0
        else
            retries=$((retries + 1))
            warn "$description check failed (HTTP $http_code), retry $retries/$MAX_RETRIES"
            
            if [ $retries -lt $MAX_RETRIES ]; then
                sleep 2
            fi
        fi
    done
    
    error "$description is unhealthy (HTTP $http_code)"
    return 1
}

# Function to check nginx status
check_nginx() {
    log "Checking nginx process..."
    
    if pgrep nginx >/dev/null 2>&1; then
        success "Nginx process is running"
        return 0
    else
        error "Nginx process is not running"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    log "Checking disk space..."
    
    local usage
    usage=$(df /usr/share/nginx/html | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 90 ]; then
        success "Disk space is adequate ($usage% used)"
        return 0
    else
        warn "Disk space is high ($usage% used)"
        return 1
    fi
}

# Function to check memory usage
check_memory() {
    log "Checking memory usage..."
    
    local memory_info
    memory_info=$(free | grep Mem)
    local total=$(echo $memory_info | awk '{print $2}')
    local used=$(echo $memory_info | awk '{print $3}')
    local usage_percent=$((used * 100 / total))
    
    if [ "$usage_percent" -lt 90 ]; then
        success "Memory usage is normal ($usage_percent% used)"
        return 0
    else
        warn "Memory usage is high ($usage_percent% used)"
        return 1
    fi
}

# Function to check application files
check_app_files() {
    log "Checking application files..."
    
    # Check if critical files exist
    local critical_files=(
        "/usr/share/nginx/html/index.html"
        "/usr/share/nginx/html/manifest.json"
        "/etc/nginx/nginx.conf"
        "/etc/nginx/conf.d/default.conf"
    )
    
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            success "File $file exists"
        else
            error "Critical file $file is missing"
            return 1
        fi
    done
    
    return 0
}

# Function to check nginx configuration
check_nginx_config() {
    log "Checking nginx configuration..."
    
    if nginx -t >/dev/null 2>&1; then
        success "Nginx configuration is valid"
        return 0
    else
        error "Nginx configuration is invalid"
        return 1
    fi
}

# Function to perform performance checks
check_performance() {
    log "Checking application performance..."
    
    local start_time
    local end_time
    local response_time
    
    start_time=$(date +%s%N)
    
    if curl -s --max-time 5 "$APP_URL" >/dev/null 2>&1; then
        end_time=$(date +%s%N)
        response_time=$(( (end_time - start_time) / 1000000 ))
        
        if [ "$response_time" -lt 2000 ]; then
            success "Application response time is good (${response_time}ms)"
            return 0
        else
            warn "Application response time is slow (${response_time}ms)"
            return 1
        fi
    else
        error "Application is not responding"
        return 1
    fi
}

# Function to check SSL certificate (if HTTPS is enabled)
check_ssl() {
    # Skip SSL check if not using HTTPS
    if ! curl -s "$APP_URL" | grep -q "https://"; then
        log "Skipping SSL check (HTTP mode)"
        return 0
    fi
    
    log "Checking SSL certificate..."
    
    local cert_info
    cert_info=$(echo | openssl s_client -servername localhost -connect localhost:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        success "SSL certificate is valid"
        return 0
    else
        warn "SSL certificate check failed"
        return 1
    fi
}

# Main health check function
main() {
    log "Starting health check for Relife Smart Alarm App..."
    
    local checks_passed=0
    local total_checks=0
    
    # Define checks
    local checks=(
        "check_nginx"
        "check_nginx_config"
        "check_app_files"
        "check_endpoint $HEALTH_CHECK_URL 'Health endpoint'"
        "check_endpoint $METRICS_URL 'Metrics endpoint'"
        "check_endpoint $APP_URL 'Main application'"
        "check_performance"
        "check_disk_space"
        "check_memory"
        "check_ssl"
    )
    
    # Run all checks
    for check in "${checks[@]}"; do
        total_checks=$((total_checks + 1))
        
        if eval "$check"; then
            checks_passed=$((checks_passed + 1))
        fi
        
        echo # Empty line for readability
    done
    
    # Summary
    log "Health check completed: $checks_passed/$total_checks checks passed"
    
    if [ "$checks_passed" -eq "$total_checks" ]; then
        success "All health checks passed - container is healthy"
        exit 0
    elif [ "$checks_passed" -ge $((total_checks * 3 / 4)) ]; then
        warn "Most health checks passed - container is degraded but functional"
        exit 0
    else
        error "Critical health checks failed - container is unhealthy"
        exit 1
    fi
}

# Handle script arguments
case "${1:-health}" in
    "health")
        main
        ;;
    "quick")
        log "Running quick health check..."
        check_endpoint "$HEALTH_CHECK_URL" "Health endpoint" && \
        check_nginx && \
        success "Quick health check passed" || \
        error "Quick health check failed"
        ;;
    "performance")
        log "Running performance check..."
        check_performance
        ;;
    "endpoints")
        log "Checking all endpoints..."
        check_endpoint "$HEALTH_CHECK_URL" "Health endpoint" && \
        check_endpoint "$METRICS_URL" "Metrics endpoint" && \
        check_endpoint "$APP_URL" "Main application"
        ;;
    *)
        echo "Usage: $0 {health|quick|performance|endpoints}"
        exit 1
        ;;
esac