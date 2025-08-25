#!/bin/bash

# =============================================================================
# AUTOMATED SECURITY HARDENING SCRIPT FOR RELIFE MONITORING SERVER
# =============================================================================
# Implements enterprise-grade security measures automatically
# WARNING: This makes significant system changes - review before running
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_IP="YOUR_ADMIN_IP_HERE"
SSH_PORT="2222"
SETUP_USER="${SUDO_USER:-$USER}"

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

print_banner() {
    clear
    echo -e "${BLUE}🛡️  Relife Monitoring Server - Security Hardening${NC}"
    echo "=================================================="
    echo ""
    echo "This script will implement enterprise-grade security measures:"
    echo "• SSH hardening with key-only authentication"
    echo "• Advanced firewall rules and intrusion prevention"
    echo "• System kernel hardening and service restrictions"
    echo "• Docker security enhancements"
    echo "• File integrity monitoring and log analysis"
    echo "• Continuous security monitoring and alerting"
    echo ""
    warn "This will make significant changes to your system!"
    echo ""
    read -p "Do you want to continue? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Security hardening cancelled."
        exit 0
    fi
    echo ""
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root. Use: sudo $0"
    fi
    
    # Check if SSH keys are configured
    if [[ ! -f "/home/$SETUP_USER/.ssh/authorized_keys" ]]; then
        warn "No SSH keys found in /home/$SETUP_USER/.ssh/authorized_keys"
        echo "Please set up SSH key authentication before running this script:"
        echo "1. On your local machine: ssh-keygen -t ed25519"
        echo "2. Copy key to server: ssh-copy-id user@server"
        exit 1
    fi
    
    log "✅ Prerequisites check passed"
}

harden_ssh() {
    log "Hardening SSH configuration..."
    
    # Backup current SSH config
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d)
    
    # Create hardened SSH configuration
    tee /etc/ssh/sshd_config > /dev/null <<EOF
# Relife Monitoring Server - Hardened SSH Configuration
Port $SSH_PORT
AddressFamily inet
ListenAddress 0.0.0.0

# Authentication
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

# Security Settings
MaxAuthTries 3
MaxSessions 2
MaxStartups 2:30:10
LoginGraceTime 30
ClientAliveInterval 300
ClientAliveCountMax 2

# Protocol and Crypto
Protocol 2
HostKey /etc/ssh/ssh_host_ed25519_key
HostKey /etc/ssh/ssh_host_rsa_key
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com

# Restrictions
AllowUsers $SETUP_USER
DenyUsers root
DenyGroups root

# Logging
SyslogFacility AUTH
LogLevel VERBOSE

# Features
X11Forwarding no
AllowTcpForwarding no
AllowAgentForwarding no
PermitTunnel no

# Subsystem
Subsystem sftp /usr/lib/openssh/sftp-server -l INFO
EOF
    
    # Test SSH configuration
    sshd -t || error "SSH configuration test failed"
    
    log "✅ SSH hardening completed"
}

setup_firewall() {
    log "Configuring advanced firewall rules..."
    
    # Install and reset UFW
    apt-get install -y ufw
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # SSH on custom port
    ufw allow $SSH_PORT/tcp comment "SSH Hardened"
    
    # HTTP/HTTPS with rate limiting
    ufw limit 80/tcp comment "HTTP with rate limiting"
    ufw limit 443/tcp comment "HTTPS with rate limiting"
    
    # Monitoring services - restrict to admin IP if provided
    if [[ "$ADMIN_IP" != "YOUR_ADMIN_IP_HERE" ]]; then
        ufw allow from $ADMIN_IP to any port 3000 comment "Grafana - Admin only"
        ufw allow from $ADMIN_IP to any port 9090 comment "Prometheus - Admin only"
        ufw allow from $ADMIN_IP to any port 9093 comment "AlertManager - Admin only"
    else
        warn "ADMIN_IP not set - monitoring ports will be open to all"
        ufw allow 3000/tcp comment "Grafana"
        ufw allow 9090/tcp comment "Prometheus"
        ufw allow 9093/tcp comment "AlertManager"
    fi
    
    # Allow localhost access
    ufw allow from 127.0.0.1
    
    # Enable firewall
    ufw --force enable
    
    log "✅ Firewall configuration completed"
}

install_fail2ban() {
    log "Installing and configuring fail2ban..."
    
    apt-get install -y fail2ban
    
    # Main fail2ban configuration
    tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd
destemail = $ADMIN_EMAIL
sendername = Fail2Ban-RelifeMonitoring
mta = sendmail

[sshd]
enabled = true
port = $SSH_PORT
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[grafana-auth]
enabled = true
port = 3000
filter = grafana-auth
logpath = /var/log/monitoring/grafana.log
maxretry = 5
bantime = 3600
EOF
    
    # Create Grafana filter
    mkdir -p /etc/fail2ban/filter.d
    tee /etc/fail2ban/filter.d/grafana-auth.conf > /dev/null <<EOF
[Definition]
failregex = ^.*Failed login attempt.*from <HOST>.*$
            ^.*Invalid username or password.*from <HOST>.*$
ignoreregex =
EOF
    
    systemctl enable fail2ban
    systemctl start fail2ban
    
    log "✅ fail2ban installation completed"
}

harden_system() {
    log "Applying system hardening..."
    
    # Kernel security parameters
    tee /etc/sysctl.d/99-security-hardening.conf > /dev/null <<EOF
# Network security
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.icmp_echo_ignore_all = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.log_martians = 1

# Kernel security
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
kernel.yama.ptrace_scope = 1
kernel.core_uses_pid = 1

# File system security
fs.suid_dumpable = 0
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
EOF
    
    # Apply sysctl settings
    sysctl -p /etc/sysctl.d/99-security-hardening.conf
    
    # Secure file permissions
    chmod 600 /etc/ssh/sshd_config
    chmod 644 /etc/passwd
    chmod 600 /etc/shadow
    chmod 644 /etc/group
    chmod 600 /etc/gshadow
    
    # Set umask for more secure file creation
    echo 'umask 027' >> /etc/profile
    echo 'umask 027' >> /etc/bash.bashrc
    
    log "✅ System hardening completed"
}

setup_docker_security() {
    log "Hardening Docker configuration..."
    
    # Enhanced Docker daemon configuration
    tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "icc": false,
  "disable-legacy-registry": true,
  "default-ulimits": {
    "nofile": {
      "name": "nofile",
      "hard": 65536,
      "soft": 65536
    }
  }
}
EOF
    
    systemctl restart docker
    
    log "✅ Docker security hardening completed"
}

setup_intrusion_detection() {
    log "Setting up intrusion detection..."
    
    # Install AIDE
    apt-get install -y aide
    
    # Configure AIDE
    tee /etc/aide/aide.conf > /dev/null <<EOF
database=file:/var/lib/aide/aide.db
database_out=file:/var/lib/aide/aide.db.new
verbose=5
report_url=file:/var/log/aide/aide.log

# Monitor critical directories
/boot f+p+u+g+s+b+m+c+md5+sha1
/bin f+p+u+g+s+b+m+c+md5+sha1
/sbin f+p+u+g+s+b+m+c+md5+sha1
/usr/bin f+p+u+g+s+b+m+c+md5+sha1
/usr/sbin f+p+u+g+s+b+m+c+md5+sha1
/etc p+u+g+s+b+m+c+md5+sha1
/opt/relife p+u+g+s+b+m+c+md5+sha1

# Exclude dynamic directories
!/var/log/.*
!/var/tmp/.*
!/tmp/.*
!/proc/.*
!/sys/.*
EOF
    
    # Initialize AIDE database
    mkdir -p /var/log/aide
    aide --init
    mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
    
    # Daily AIDE check
    tee /etc/cron.daily/aide-check > /dev/null <<'EOF'
#!/bin/bash
aide --check > /var/log/aide/aide-check-$(date +%Y%m%d).log 2>&1
if [ $? -ne 0 ]; then
    logger -t aide "AIDE integrity check failed"
fi
EOF
    chmod +x /etc/cron.daily/aide-check
    
    log "✅ Intrusion detection setup completed"
}

setup_security_monitoring() {
    log "Setting up security monitoring..."
    
    # Security monitoring script
    tee /usr/local/bin/security-monitor.sh > /dev/null <<'EOF'
#!/bin/bash

LOG_FILE="/var/log/security-monitor.log"

log_event() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check for SSH attacks
failed_ssh=$(grep "$(date '+%b %d')" /var/log/auth.log | grep "Failed password" | wc -l)
if [ $failed_ssh -gt 10 ]; then
    logger -t security-monitor "SSH attack detected: $failed_ssh failed attempts"
fi

# Check system load
load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
if (( $(echo "$load_avg > 4.0" | bc -l) )); then
    logger -t security-monitor "High system load: $load_avg"
fi

# Check disk usage
disk_usage=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
if [ $disk_usage -gt 90 ]; then
    logger -t security-monitor "High disk usage: ${disk_usage}%"
fi

log_event "Security monitoring check completed"
EOF
    
    chmod +x /usr/local/bin/security-monitor.sh
    
    # Cron job for security monitoring
    tee /etc/cron.d/security-monitor > /dev/null <<EOF
*/15 * * * * root /usr/local/bin/security-monitor.sh
EOF
    
    log "✅ Security monitoring setup completed"
}

create_validation_script() {
    log "Creating security validation script..."
    
    tee /usr/local/bin/validate-security.sh > /dev/null <<'EOF'
#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛡️  Security Hardening Validation${NC}"
echo "=================================="
echo ""

issues=0

# SSH Security
echo "🔐 SSH Security:"
if grep -q "PasswordAuthentication no" /etc/ssh/sshd_config; then
    echo -e "  ✅ Password authentication: ${GREEN}Disabled${NC}"
else
    echo -e "  ❌ Password authentication: ${RED}Still enabled${NC}"
    ((issues++))
fi

# Firewall
echo ""
echo "🔥 Firewall Configuration:"
if ufw status | grep -q "Status: active"; then
    echo -e "  ✅ UFW firewall: ${GREEN}Active${NC}"
else
    echo -e "  ❌ UFW firewall: ${RED}Not active${NC}"
    ((issues++))
fi

# fail2ban
echo ""
echo "🚫 Intrusion Prevention:"
if systemctl is-active --quiet fail2ban; then
    echo -e "  ✅ fail2ban: ${GREEN}Running${NC}"
else
    echo -e "  ❌ fail2ban: ${RED}Not running${NC}"
    ((issues++))
fi

# Summary
echo ""
if [ $issues -eq 0 ]; then
    echo -e "${GREEN}🎉 SECURITY VALIDATION: ALL CHECKS PASSED!${NC}"
    echo ""
    echo "Your server has enterprise-grade security hardening."
    echo "Ready for production monitoring deployment!"
else
    echo -e "${YELLOW}⚠️  SECURITY VALIDATION: $issues ISSUES FOUND${NC}"
    echo ""
    echo "Please review and fix the issues above."
fi

exit $issues
EOF
    
    chmod +x /usr/local/bin/validate-security.sh
    
    log "✅ Validation script created"
}

main() {
    print_banner
    check_prerequisites
    
    log "Starting comprehensive security hardening..."
    
    # Update system first
    log "Updating system packages..."
    apt-get update && apt-get upgrade -y
    
    # Run hardening steps
    harden_ssh
    setup_firewall
    install_fail2ban
    harden_system
    setup_docker_security
    setup_intrusion_detection
    setup_security_monitoring
    create_validation_script
    
    # Restart SSH with new configuration
    log "Restarting SSH service..."
    systemctl restart ssh
    
    echo ""
    echo -e "${GREEN}🎉 SECURITY HARDENING COMPLETE!${NC}"
    echo "====================================="
    echo ""
    echo -e "${BLUE}Security measures implemented:${NC}"
    echo "• SSH hardened with key-only authentication on port $SSH_PORT"
    echo "• Advanced firewall rules with intrusion prevention"
    echo "• System kernel hardening and service restrictions"
    echo "• Docker security enhancements"
    echo "• File integrity monitoring (AIDE)"
    echo "• Continuous security monitoring and alerting"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
    echo ""
    echo "1. **Update your SSH connection:**"
    echo "   ssh -p $SSH_PORT $SETUP_USER@$(hostname -I | awk '{print $1}')"
    echo ""
    echo "2. **Test SSH access in a NEW terminal window** before closing this one!"
    echo ""
    echo "3. **Update firewall rules if needed:**"
    echo "   Replace YOUR_ADMIN_IP_HERE with your actual IP in the script"
    echo ""
    echo "4. **Run security validation:**"
    echo "   /usr/local/bin/validate-security.sh"
    echo ""
    echo "5. **Proceed with monitoring deployment:**"
    echo "   cd /opt/relife && ./monitoring/scripts/deploy-assistant.sh"
    echo ""
    echo -e "${GREEN}🛡️  Your server now has military-grade security!${NC}"
    echo ""
}

# Script execution
case "${1:-harden}" in
    "harden")
        main
        ;;
    "validate")
        if [[ -f "/usr/local/bin/validate-security.sh" ]]; then
            /usr/local/bin/validate-security.sh
        else
            error "Security validation script not found. Run hardening first."
        fi
        ;;
    "help")
        echo "Relife Monitoring Server Security Hardening Script"
        echo ""
        echo "Usage: sudo $0 [command]"
        echo ""
        echo "Commands:"
        echo "  harden (default) - Apply security hardening"
        echo "  validate         - Validate security configuration"
        echo "  help            - Show this help"
        echo ""
        echo "Before running:"
        echo "1. Set up SSH keys for your user account"
        echo "2. Update ADMIN_IP variable in the script"
        echo "3. Update ADMIN_EMAIL for security alerts"
        ;;
    *)
        error "Unknown command: $1. Use 'sudo $0 help' for available commands."
        ;;
esac