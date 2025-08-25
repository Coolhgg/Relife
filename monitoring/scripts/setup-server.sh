#!/bin/bash

# =============================================================================
# RELIFE MONITORING SERVER SETUP SCRIPT
# =============================================================================
# Automated server preparation for monitoring system deployment
# Installs all dependencies, configures system settings, and prepares environment
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

# Configuration
LOG_FILE="/var/log/relife-server-setup.log"
SETUP_USER="${SUDO_USER:-$USER}"

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

print_header() {
    clear
    echo -e "${BLUE}🔧 Relife Monitoring Server Setup${NC}"
    echo "===================================="
    echo ""
    echo "This script will prepare your server for monitoring deployment."
    echo ""
}

# =============================================================================
# SYSTEM CHECKS
# =============================================================================

check_system_requirements() {
    log "Checking system requirements..."
    
    # Check OS
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        log "Operating System: $PRETTY_NAME"
        
        if [[ "$ID" != "ubuntu" ]] && [[ "$ID" != "debian" ]]; then
            warn "This script is optimized for Ubuntu/Debian. Proceed with caution."
        fi
    fi
    
    # Check architecture
    local arch=$(uname -m)
    if [[ "$arch" != "x86_64" ]]; then
        error "Unsupported architecture: $arch. x86_64 required."
    fi
    
    # Check system resources
    local cores=$(nproc)
    local memory_gb=$(free -g | awk '/^Mem:/{print $2}')
    local disk_gb=$(df / --output=avail | tail -1 | awk '{print int($1/1024/1024)}')
    
    log "System resources: ${cores} cores, ${memory_gb}GB RAM, ${disk_gb}GB disk"
    
    if [[ $cores -lt 2 ]]; then
        error "Insufficient CPU cores. Minimum 2 required, 4+ recommended."
    fi
    
    if [[ $memory_gb -lt 4 ]]; then
        error "Insufficient memory. Minimum 4GB required, 8GB+ recommended."
    fi
    
    if [[ $disk_gb -lt 50 ]]; then
        error "Insufficient disk space. Minimum 50GB required, 100GB+ recommended."
    fi
    
    log "✅ System requirements check passed"
}

# =============================================================================
# PACKAGE INSTALLATION
# =============================================================================

install_system_packages() {
    log "Installing system packages..."
    
    # Update package lists
    apt-get update
    
    # Install essential packages
    apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        wget \
        gnupg \
        lsb-release \
        software-properties-common \
        unzip \
        git \
        nano \
        vim \
        htop \
        iotop \
        iftop \
        ncdu \
        tree \
        jq \
        openssl \
        zip \
        unzip \
        net-tools \
        dnsutils \
        telnet \
        tcpdump \
        rsync \
        cron
    
    log "✅ System packages installed"
}

install_docker() {
    log "Installing Docker..."
    
    # Check if Docker is already installed
    if command -v docker &> /dev/null; then
        log "Docker already installed: $(docker --version)"
        return 0
    fi
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index
    apt-get update
    
    # Install Docker Engine
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add user to docker group
    usermod -aG docker $SETUP_USER
    
    # Test Docker installation
    docker run hello-world
    
    log "✅ Docker installed successfully"
}

install_nodejs() {
    log "Installing Node.js..."
    
    # Check if Node.js is already installed
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        log "Node.js already installed: $node_version"
        return 0
    fi
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Verify installation
    local node_version=$(node --version)
    local npm_version=$(npm --version)
    
    log "✅ Node.js installed: $node_version, npm: $npm_version"
}

install_certbot() {
    log "Installing Certbot for SSL certificates..."
    
    # Check if Certbot is already installed
    if command -v certbot &> /dev/null; then
        log "Certbot already installed: $(certbot --version 2>&1 | head -1)"
        return 0
    fi
    
    # Install Certbot
    apt-get install -y certbot
    
    log "✅ Certbot installed successfully"
}

# =============================================================================
# SYSTEM CONFIGURATION
# =============================================================================

configure_system_limits() {
    log "Configuring system limits for monitoring workloads..."
    
    # Configure file descriptor limits
    tee -a /etc/security/limits.conf > /dev/null <<EOF

# Relife Monitoring system limits
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
$SETUP_USER soft nofile 65536
$SETUP_USER hard nofile 65536
EOF
    
    # Configure sysctl for network and memory performance
    tee /etc/sysctl.d/99-relife-monitoring.conf > /dev/null <<EOF
# Network performance tuning for monitoring
net.core.somaxconn = 32768
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_congestion_control = bbr

# Memory settings for time series databases
vm.swappiness = 1
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
vm.max_map_count = 262144

# File system settings
fs.file-max = 2097152
EOF
    
    # Apply sysctl settings
    sysctl -p /etc/sysctl.d/99-relife-monitoring.conf
    
    log "✅ System limits configured"
}

configure_docker() {
    log "Configuring Docker for production..."
    
    # Create Docker daemon configuration
    mkdir -p /etc/docker
    
    tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "default-ulimits": {
    "nofile": {
      "name": "nofile",
      "hard": 65536,
      "soft": 65536
    }
  },
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 5
}
EOF
    
    # Restart Docker to apply configuration
    systemctl restart docker
    
    # Wait for Docker to be ready
    sleep 5
    
    # Test Docker functionality
    docker info > /dev/null
    
    log "✅ Docker configured for production"
}

configure_firewall() {
    log "Configuring firewall..."
    
    # Install and configure UFW if not present
    if ! command -v ufw &> /dev/null; then
        apt-get install -y ufw
    fi
    
    # Reset UFW to default settings
    ufw --force reset
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (current connection)
    local ssh_port=$(ss -tlnp | grep sshd | awk '{print $4}' | cut -d':' -f2 | head -1)
    ssh_port=${ssh_port:-22}
    ufw allow $ssh_port/tcp comment "SSH"
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp comment "HTTP"
    ufw allow 443/tcp comment "HTTPS"
    
    # Allow monitoring ports (we'll secure these with authentication)
    ufw allow 9090/tcp comment "Prometheus"
    ufw allow 3000/tcp comment "Grafana"
    ufw allow 9093/tcp comment "AlertManager"
    
    # Enable firewall
    ufw --force enable
    
    log "✅ Firewall configured"
}

# =============================================================================
# DIRECTORY SETUP
# =============================================================================

setup_directories() {
    log "Setting up directory structure..."
    
    # Create monitoring directories
    mkdir -p /var/lib/monitoring/{prometheus,grafana,alertmanager}
    mkdir -p /var/log/monitoring
    mkdir -p /var/backups/monitoring
    mkdir -p /etc/monitoring
    mkdir -p /var/lib/node_exporter/textfile_collector
    
    # Set ownership
    chown -R $SETUP_USER:$SETUP_USER /var/lib/monitoring
    chown -R $SETUP_USER:$SETUP_USER /var/log/monitoring
    chown -R $SETUP_USER:$SETUP_USER /var/backups/monitoring
    chown -R $SETUP_USER:$SETUP_USER /etc/monitoring
    chown 65534:65534 /var/lib/node_exporter/textfile_collector
    
    # Set permissions
    chmod 755 /var/lib/monitoring/*
    chmod 755 /var/log/monitoring
    chmod 755 /var/backups/monitoring
    chmod 755 /etc/monitoring
    
    # Create project directory
    mkdir -p /opt/relife
    chown $SETUP_USER:$SETUP_USER /opt/relife
    
    log "✅ Directory structure created"
}

# =============================================================================
# LOG ROTATION SETUP
# =============================================================================

setup_log_rotation() {
    log "Setting up log rotation..."
    
    # Configure log rotation for monitoring
    tee /etc/logrotate.d/relife-monitoring > /dev/null <<EOF
/var/log/monitoring/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 $SETUP_USER $SETUP_USER
    postrotate
        # Signal processes to reopen log files if needed
        /bin/kill -HUP \$(cat /var/run/rsyslogd.pid 2> /dev/null) 2> /dev/null || true
    endscript
}

/var/log/relife-*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 $SETUP_USER $SETUP_USER
}
EOF
    
    # Test log rotation configuration
    logrotate -d /etc/logrotate.d/relife-monitoring
    
    log "✅ Log rotation configured"
}

# =============================================================================
# VALIDATION
# =============================================================================

create_validation_script() {
    log "Creating server validation script..."
    
    cat > /opt/relife/validate-server.sh <<'EOF'
#!/bin/bash

# Server Setup Validation Script

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Relife Monitoring Server Validation${NC}"
echo "========================================"
echo ""

issues=0

# System requirements
echo "💻 System Requirements:"
cores=$(nproc)
memory_gb=$(free -g | awk '/^Mem:/{print $2}')
disk_gb=$(df / --output=avail | tail -1 | awk '{print int($1/1024/1024)}')

if [[ $cores -ge 4 ]]; then
    echo -e "  ✅ CPU Cores: ${GREEN}$cores cores${NC}"
else
    echo -e "  ⚠️  CPU Cores: ${YELLOW}$cores cores (4+ recommended)${NC}"
fi

if [[ $memory_gb -ge 8 ]]; then
    echo -e "  ✅ Memory: ${GREEN}${memory_gb}GB${NC}"
else
    echo -e "  ⚠️  Memory: ${YELLOW}${memory_gb}GB (8GB+ recommended)${NC}"
fi

if [[ $disk_gb -ge 100 ]]; then
    echo -e "  ✅ Disk Space: ${GREEN}${disk_gb}GB available${NC}"
else
    echo -e "  ⚠️  Disk Space: ${YELLOW}${disk_gb}GB available (100GB+ recommended)${NC}"
fi

echo ""

# Required software
echo "📦 Required Software:"
commands=("docker" "docker" "curl" "wget" "git" "openssl" "jq" "certbot" "node" "npm")
command_names=("Docker" "Docker Compose" "curl" "wget" "git" "openssl" "jq" "certbot" "Node.js" "npm")

for i in "${!commands[@]}"; do
    cmd="${commands[$i]}"
    name="${command_names[$i]}"
    
    if [[ "$cmd" == "docker" ]] && [[ "$name" == "Docker Compose" ]]; then
        if docker compose version &> /dev/null; then
            version=$(docker compose version --short)
            echo -e "  ✅ $name: ${GREEN}$version${NC}"
        else
            echo -e "  ❌ $name: ${RED}Missing${NC}"
            ((issues++))
        fi
    elif command -v "$cmd" &> /dev/null; then
        if [[ "$cmd" == "docker" ]]; then
            version=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
            echo -e "  ✅ $name: ${GREEN}$version${NC}"
        elif [[ "$cmd" == "node" ]]; then
            version=$(node --version)
            echo -e "  ✅ $name: ${GREEN}$version${NC}"
        else
            echo -e "  ✅ $name: ${GREEN}Available${NC}"
        fi
    else
        echo -e "  ❌ $name: ${RED}Missing${NC}"
        ((issues++))
    fi
done

echo ""

# Docker configuration
echo "🐳 Docker Configuration:"
if systemctl is-active --quiet docker; then
    echo -e "  ✅ Docker service: ${GREEN}Running${NC}"
    
    if docker ps &> /dev/null; then
        echo -e "  ✅ Docker permissions: ${GREEN}OK${NC}"
    else
        echo -e "  ❌ Docker permissions: ${RED}User cannot run Docker${NC}"
        ((issues++))
    fi
else
    echo -e "  ❌ Docker service: ${RED}Not running${NC}"
    ((issues++))
fi

echo ""

# Network connectivity
echo "🌐 Network Connectivity:"
if curl -sf https://google.com > /dev/null 2>&1; then
    echo -e "  ✅ Internet access: ${GREEN}Working${NC}"
else
    echo -e "  ❌ Internet access: ${RED}Failed${NC}"
    ((issues++))
fi

if curl -sf https://registry-1.docker.io > /dev/null 2>&1; then
    echo -e "  ✅ Docker Hub access: ${GREEN}Working${NC}"
else
    echo -e "  ❌ Docker Hub access: ${RED}Failed${NC}"
    ((issues++))
fi

echo ""

# Directory structure
echo "📁 Directory Structure:"
directories=("/var/lib/monitoring" "/var/log/monitoring" "/var/backups/monitoring" "/opt/relife")
for dir in "${directories[@]}"; do
    if [[ -d "$dir" ]] && [[ -w "$dir" ]]; then
        echo -e "  ✅ $dir: ${GREEN}Ready${NC}"
    else
        echo -e "  ❌ $dir: ${RED}Missing or not writable${NC}"
        ((issues++))
    fi
done

echo ""

# Summary
if [[ $issues -eq 0 ]]; then
    echo -e "${GREEN}🎉 SERVER VALIDATION: ALL CHECKS PASSED!${NC}"
    echo ""
    echo "Your server is ready for monitoring system deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Clone repository: cd /opt/relife && git clone https://github.com/Coolhgg/Relife.git ."
    echo "2. Configure notifications: ./monitoring/scripts/setup-webhooks.sh"
    echo "3. Deploy monitoring: ./monitoring/scripts/deploy-assistant.sh"
    echo ""
    exit 0
else
    echo -e "${RED}❌ SERVER VALIDATION: FOUND $issues ISSUES${NC}"
    echo ""
    echo "Please fix the issues above before proceeding."
    echo "You can re-run this script after fixes: /opt/relife/validate-server.sh"
    echo ""
    exit 1
fi
EOF
    
    chmod +x /opt/relife/validate-server.sh
    chown $SETUP_USER:$SETUP_USER /opt/relife/validate-server.sh
    
    log "✅ Validation script created"
}

# =============================================================================
# MAIN SETUP FUNCTIONS
# =============================================================================

main_setup() {
    print_header
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root. Use: sudo $0"
    fi
    
    log "Starting Relife monitoring server setup..."
    log "Setup user: $SETUP_USER"
    
    # Create log file
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    chmod 644 "$LOG_FILE"
    
    # Run setup steps
    check_system_requirements
    install_system_packages
    install_docker
    install_nodejs
    install_certbot
    configure_system_limits
    configure_docker
    configure_firewall
    setup_directories
    setup_log_rotation
    create_validation_script
    
    log "✅ Server setup completed successfully!"
}

show_completion_summary() {
    echo ""
    echo -e "${GREEN}🎉 SERVER SETUP COMPLETE!${NC}"
    echo "=========================="
    echo ""
    echo "Your production server is now ready for monitoring deployment."
    echo ""
    echo -e "${BLUE}📦 Installed Components:${NC}"
    echo "• Docker Engine $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
    echo "• Docker Compose $(docker compose version --short)"
    echo "• Node.js $(node --version)"
    echo "• Certbot $(certbot --version 2>&1 | head -1 | cut -d' ' -f2)"
    echo "• System utilities (curl, wget, jq, openssl, git)"
    echo ""
    echo -e "${BLUE}⚙️  Configured Settings:${NC}"
    echo "• System limits optimized for time-series databases"
    echo "• Docker daemon configured for production workloads"
    echo "• Firewall rules for monitoring services"
    echo "• Log rotation for monitoring logs"
    echo "• Directory structure for monitoring data"
    echo ""
    echo -e "${BLUE}🔧 Next Steps:${NC}"
    echo ""
    echo "1. **Switch to deployment user:**"
    echo "   su - $SETUP_USER"
    echo ""
    echo "2. **Clone the repository:**"
    echo "   cd /opt/relife"
    echo "   git clone https://github.com/Coolhgg/Relife.git ."
    echo ""
    echo "3. **Run server validation:**"
    echo "   ./validate-server.sh"
    echo ""
    echo "4. **Start monitoring deployment:**"
    echo "   ./monitoring/scripts/deploy-assistant.sh"
    echo ""
    echo -e "${GREEN}✅ Server is production-ready for monitoring deployment!${NC}"
    echo ""
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

case "${1:-setup}" in
    "setup")
        main_setup
        show_completion_summary
        ;;
    "validate")
        if [[ -f "/opt/relife/validate-server.sh" ]]; then
            /opt/relife/validate-server.sh
        else
            error "Validation script not found. Run setup first."
        fi
        ;;
    "help")
        echo "Relife Monitoring Server Setup Script"
        echo ""
        echo "Usage: sudo $0 [command]"
        echo ""
        echo "Commands:"
        echo "  setup (default) - Complete server preparation"
        echo "  validate        - Validate existing setup"
        echo "  help           - Show this help"
        echo ""
        echo "This script must be run as root (with sudo)."
        ;;
    *)
        error "Unknown command: $1. Use 'sudo $0 help' for available commands."
        ;;
esac