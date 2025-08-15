#!/bin/bash
# Startup script for Relife Smart Alarm App
# Handles initialization, monitoring, and graceful shutdown

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_LEVEL=${LOG_LEVEL:-INFO}
NGINX_WORKER_PROCESSES=${NGINX_WORKER_PROCESSES:-auto}
MONITORING_ENABLED=${MONITORING_ENABLED:-true}
PERFORMANCE_MONITORING=${PERFORMANCE_MONITORING:-true}

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        ERROR)
            echo -e "${RED}[$timestamp] [ERROR]${NC} $message" >&2
            ;;
        WARN)
            echo -e "${YELLOW}[$timestamp] [WARN]${NC} $message"
            ;;
        INFO)
            echo -e "${GREEN}[$timestamp] [INFO]${NC} $message"
            ;;
        DEBUG)
            if [ "$LOG_LEVEL" = "DEBUG" ]; then
                echo -e "${BLUE}[$timestamp] [DEBUG]${NC} $message"
            fi
            ;;
    esac
}

# Error handling
error_exit() {
    log ERROR "$1"
    exit 1
}

# Function to validate environment
validate_environment() {
    log INFO "Validating environment configuration..."
    
    # Check required files
    local required_files=(
        "/usr/share/nginx/html/index.html"
        "/etc/nginx/nginx.conf"
        "/etc/nginx/conf.d/default.conf"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            error_exit "Required file not found: $file"
        fi
    done
    
    # Check nginx configuration
    if ! nginx -t >/dev/null 2>&1; then
        error_exit "Invalid nginx configuration"
    fi
    
    log INFO "Environment validation completed successfully"
}

# Function to setup monitoring
setup_monitoring() {
    if [ "$MONITORING_ENABLED" = "true" ]; then
        log INFO "Setting up monitoring and logging..."
        
        # Create log directories
        mkdir -p /var/log/nginx
        mkdir -p /var/log/app
        
        # Set up log rotation (basic)
        cat > /etc/logrotate.d/nginx << EOF
/var/log/nginx/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 nginx nginx
    postrotate
        nginx -s reload
    endscript
}
EOF
        
        # Set up performance monitoring log
        if [ "$PERFORMANCE_MONITORING" = "true" ]; then
            log INFO "Performance monitoring enabled"
            touch /var/log/app/performance.log
            chown nginx:nginx /var/log/app/performance.log
        fi
        
        log INFO "Monitoring setup completed"
    else
        log INFO "Monitoring disabled"
    fi
}

# Function to optimize nginx configuration
optimize_nginx() {
    log INFO "Optimizing nginx configuration..."
    
    # Update worker processes if specified
    if [ "$NGINX_WORKER_PROCESSES" != "auto" ]; then
        sed -i "s/worker_processes auto;/worker_processes $NGINX_WORKER_PROCESSES;/" /etc/nginx/nginx.conf
        log INFO "Set nginx worker processes to $NGINX_WORKER_PROCESSES"
    fi
    
    # Create cache directories with proper permissions
    mkdir -p /var/cache/nginx/static_cache
    mkdir -p /var/cache/nginx/api_cache
    chown -R nginx:nginx /var/cache/nginx
    
    log INFO "Nginx optimization completed"
}

# Function to display startup banner
show_banner() {
    cat << 'EOF'
 ____      _ _  __      
|  _ \ ___| (_)/ _| ___ 
| |_) / _ \ | | |_ / _ \
|  _ <  __/ | |  _|  __/
|_| \_\___|_|_|_|  \___|

Smart Alarm App - Production Container
EOF
    
    log INFO "Starting Relife Smart Alarm App"
    log INFO "Environment: ${VITE_APP_ENV:-production}"
    log INFO "Version: ${VITE_APP_VERSION:-unknown}"
    log INFO "Build Time: ${VITE_BUILD_TIME:-unknown}"
    log INFO "Performance Monitoring: $PERFORMANCE_MONITORING"
    log INFO "General Monitoring: $MONITORING_ENABLED"
}

# Function to setup signal handlers
setup_signal_handlers() {
    log INFO "Setting up signal handlers..."
    
    # Graceful shutdown function
    graceful_shutdown() {
        log INFO "Received shutdown signal, performing graceful shutdown..."
        
        # Stop nginx gracefully
        if pgrep nginx >/dev/null 2>&1; then
            log INFO "Stopping nginx..."
            nginx -s quit
            
            # Wait for nginx to stop
            local timeout=30
            while pgrep nginx >/dev/null 2>&1 && [ $timeout -gt 0 ]; do
                sleep 1
                timeout=$((timeout - 1))
            done
            
            if pgrep nginx >/dev/null 2>&1; then
                log WARN "Force stopping nginx..."
                pkill -9 nginx
            fi
        fi
        
        log INFO "Graceful shutdown completed"
        exit 0
    }
    
    # Setup signal traps
    trap graceful_shutdown SIGTERM SIGINT SIGQUIT
    
    log INFO "Signal handlers configured"
}

# Function to perform health check
initial_health_check() {
    log INFO "Performing initial health check..."
    
    # Start nginx in background for testing
    nginx -t || error_exit "Nginx configuration test failed"
    
    log INFO "Initial health check passed"
}

# Function to setup performance monitoring
setup_performance_monitoring() {
    if [ "$PERFORMANCE_MONITORING" = "true" ]; then
        log INFO "Setting up performance monitoring..."
        
        # Create performance monitoring script
        cat > /usr/local/bin/monitor-performance.sh << 'EOF'
#!/bin/bash
while true; do
    # Log basic system metrics
    {
        echo "timestamp=$(date +%s)"
        echo "memory_usage=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')"
        echo "disk_usage=$(df /usr/share/nginx/html | awk 'NR==2 {print $5}' | sed 's/%//')"
        echo "load_average=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')"
        echo "nginx_processes=$(pgrep nginx | wc -l)"
    } >> /var/log/app/performance.log
    
    sleep 60
done
EOF
        
        chmod +x /usr/local/bin/monitor-performance.sh
        
        # Start performance monitoring in background
        /usr/local/bin/monitor-performance.sh &
        
        log INFO "Performance monitoring started"
    fi
}

# Function to display environment info
show_environment_info() {
    log INFO "Environment Information:"
    log INFO "  - Hostname: $(hostname)"
    log INFO "  - Container ID: $(hostname)"
    log INFO "  - User: $(whoami)"
    log INFO "  - Working Directory: $(pwd)"
    log INFO "  - Nginx Version: $(nginx -v 2>&1 | cut -d' ' -f3)"
    log INFO "  - Available Memory: $(free -h | grep Mem | awk '{print $2}')"
    log INFO "  - Available Disk: $(df -h /usr/share/nginx/html | awk 'NR==2 {print $4}')"
    log INFO "  - CPU Cores: $(nproc)"
    
    if [ "$LOG_LEVEL" = "DEBUG" ]; then
        log DEBUG "Environment Variables:"
        env | grep -E '^(VITE_|NODE_|NGINX_|MONITORING_|PERFORMANCE_)' | sort | while read -r var; do
            log DEBUG "    $var"
        done
    fi
}

# Main startup function
main() {
    # Show startup banner
    show_banner
    
    # Display environment info
    show_environment_info
    
    # Setup signal handlers first
    setup_signal_handlers
    
    # Validate environment
    validate_environment
    
    # Setup monitoring
    setup_monitoring
    
    # Optimize nginx
    optimize_nginx
    
    # Setup performance monitoring
    setup_performance_monitoring
    
    # Perform initial health check
    initial_health_check
    
    # Final preparation
    log INFO "Starting nginx in foreground mode..."
    log INFO "Container ready to serve requests"
    log INFO "Health check endpoint: http://localhost/health"
    log INFO "Metrics endpoint: http://localhost/metrics"
    
    # Start nginx in foreground
    exec nginx -g "daemon off;"
}

# Handle script arguments
case "${1:-start}" in
    "start")
        main
        ;;
    "health")
        /usr/local/bin/health-check.sh
        ;;
    "test")
        log INFO "Running container tests..."
        validate_environment
        nginx -t
        log INFO "All tests passed"
        ;;
    "debug")
        LOG_LEVEL=DEBUG
        main
        ;;
    *)
        echo "Usage: $0 {start|health|test|debug}"
        exit 1
        ;;
esac