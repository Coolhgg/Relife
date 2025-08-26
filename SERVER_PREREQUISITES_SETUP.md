# 🖥️ Production Server Setup Guide - Prerequisites & Dependencies

This guide will prepare your production server with all required dependencies for the Relife
monitoring system deployment.

## 🎯 Overview

We'll install and configure:

- **System updates** and security hardening
- **Docker Engine** and Docker Compose
- **Essential utilities** (curl, wget, jq, openssl, git)
- **User permissions** and security settings
- **Network configuration** and firewall rules
- **Directory structure** for monitoring data

**Estimated time:** 15-20 minutes

---

## 🚀 Step 1: Initial Server Access and Setup

### Connect to Your Production Server

```bash
# Connect via SSH (replace with your server details)
ssh root@your-server-ip
# OR if you have a non-root user:
ssh username@your-server-ip
```

### Check Server Information

```bash
# Check OS version
cat /etc/os-release

# Check system resources
free -h
df -h
nproc  # CPU cores
```

**Expected output for Ubuntu 20.04+:**

```
NAME="Ubuntu"
VERSION="20.04.6 LTS (Focal Fossa)"
ID=ubuntu

              total        used        free      shared  buff/cache   available
Mem:           7.7Gi       1.2Gi       5.8Gi        10Mi       691Mi       6.2Gi
Swap:          2.0Gi          0B       2.0Gi

Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       100G   15G   80G  16% /

4  # CPU cores
```

### Create Deployment User (if not exists)

```bash
# If you're logged in as root, create a deployment user
if [[ $USER == "root" ]]; then
    # Create deployment user
    useradd -m -s /bin/bash deployer
    usermod -aG sudo deployer

    # Set password
    passwd deployer

    # Switch to deployment user
    su - deployer
    cd ~
else
    echo "Using existing user: $USER"
fi
```

---

## 🔄 Step 2: System Updates and Security

### Update System Packages

```bash
# Update package lists
sudo apt-get update

# Upgrade all packages
sudo apt-get upgrade -y

# Install essential packages
sudo apt-get install -y \
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
    htop \
    jq \
    openssl
```

**Expected output:**

```
Hit:1 http://archive.ubuntu.com/ubuntu focal InRelease
Get:2 http://archive.ubuntu.com/ubuntu focal-updates InRelease [114 kB]
...
Reading package lists... Done
Building dependency tree... Done
...
The following NEW packages will be installed:
  apt-transport-https ca-certificates curl wget gnupg lsb-release...
...
✅ Installation complete
```

### Configure Basic Security

```bash
# Configure firewall (UFW)
sudo ufw --force enable

# Allow SSH (replace 22 with your SSH port if different)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS for Let's Encrypt and web access
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow monitoring ports (we'll secure these with authentication later)
sudo ufw allow 9090/tcp  # Prometheus
sudo ufw allow 3000/tcp  # Grafana
sudo ufw allow 9093/tcp  # AlertManager

# Check firewall status
sudo ufw status numbered
```

**Expected output:**

```
Status: active

     To                         Action      From
     --                         ------      ----
[ 1] 22/tcp                     ALLOW IN    Anywhere
[ 2] 80/tcp                     ALLOW IN    Anywhere
[ 3] 443/tcp                    ALLOW IN    Anywhere
[ 4] 9090/tcp                   ALLOW IN    Anywhere
[ 5] 3000/tcp                   ALLOW IN    Anywhere
[ 6] 9093/tcp                   ALLOW IN    Anywhere
```

---

## 🐳 Step 3: Docker Installation and Configuration

### Install Docker Engine

```bash
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index
sudo apt-get update

# Install Docker Engine
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker
```

**Expected output:**

```
✅ Docker Engine installed successfully
```

### Configure Docker for Your User

```bash
# Add current user to docker group
sudo usermod -aG docker $USER

# Apply group membership (you might need to log out/in or use newgrp)
newgrp docker

# Test Docker access
docker run hello-world
```

**Expected output:**

```
Hello from Docker!
This message shows that your installation appears to be working correctly.
...
```

### Install Docker Compose

```bash
# Docker Compose should be installed with docker-compose-plugin
# Verify installation
docker compose version
```

**Expected output:**

```
Docker Compose version v2.20.3
```

### Configure Docker Daemon

```bash
# Create Docker daemon configuration for production
sudo mkdir -p /etc/docker

sudo tee /etc/docker/daemon.json > /dev/null <<EOF
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
  }
}
EOF

# Restart Docker to apply configuration
sudo systemctl restart docker

# Verify Docker is running
sudo systemctl status docker
```

**Expected output:**

```
● docker.service - Docker Application Container Engine
   Loaded: loaded (/lib/systemd/system/docker.service; enabled; vendor preset: enabled)
   Active: active (running) since Mon 2024-01-15 10:30:00 UTC; 10s ago
```

---

## 🛠️ Step 4: Additional Utilities Installation

### Install Monitoring-Specific Tools

```bash
# Install additional monitoring utilities
sudo apt-get install -y \
    net-tools \
    dnsutils \
    telnet \
    tcpdump \
    iotop \
    iftop \
    ncdu \
    tree \
    zip \
    unzip

# Install Node.js (for metrics collector)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
node --version
npm --version
```

**Expected output:**

```
v18.17.0
9.6.7
```

### Install SSL Certificate Tools

```bash
# Install Certbot for Let's Encrypt SSL certificates
sudo apt-get install -y certbot

# Verify Certbot installation
certbot --version
```

**Expected output:**

```
certbot 1.21.0
```

---

## 📁 Step 5: Directory Structure Setup

### Create Monitoring Directories

```bash
# Create monitoring data directories
sudo mkdir -p /var/lib/monitoring/{prometheus,grafana,alertmanager}
sudo mkdir -p /var/log/monitoring
sudo mkdir -p /var/backups/monitoring
sudo mkdir -p /etc/monitoring

# Create Node Exporter directory
sudo mkdir -p /var/lib/node_exporter/textfile_collector

# Set proper ownership
sudo chown -R $USER:$USER /var/lib/monitoring
sudo chown -R $USER:$USER /var/log/monitoring
sudo chown -R $USER:$USER /var/backups/monitoring
sudo chown 65534:65534 /var/lib/node_exporter/textfile_collector  # nobody user for node_exporter

# Set permissions
chmod 755 /var/lib/monitoring/*
chmod 755 /var/log/monitoring
chmod 755 /var/backups/monitoring
```

### Create Project Directory

```bash
# Create project directory
sudo mkdir -p /opt/relife
sudo chown $USER:$USER /opt/relife

# Navigate to project directory
cd /opt/relife
```

---

## 🌐 Step 6: Network Configuration

### Configure System Limits

```bash
# Increase system limits for monitoring workloads
sudo tee -a /etc/security/limits.conf > /dev/null <<EOF

# Monitoring system limits
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
EOF

# Configure sysctl for network performance
sudo tee /etc/sysctl.d/99-monitoring.conf > /dev/null <<EOF
# Network performance tuning for monitoring
net.core.somaxconn = 32768
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_congestion_control = bbr

# Memory settings for time series databases
vm.swappiness = 1
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

# Apply sysctl settings
sudo sysctl -p /etc/sysctl.d/99-monitoring.conf
```

### Test Network Connectivity

```bash
# Test external connectivity
curl -I https://prometheus.io
curl -I https://grafana.com
curl -I https://github.com

# Test DNS resolution
nslookup google.com
```

**Expected output:**

```
HTTP/1.1 200 OK
...
✅ External connectivity working
```

---

## 🔒 Step 7: Security Hardening

### Configure SSH Security (if needed)

```bash
# Backup SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Create more secure SSH configuration
sudo tee -a /etc/ssh/sshd_config > /dev/null <<EOF

# Monitoring server security settings
PermitRootLogin no
PasswordAuthentication yes
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

# Restart SSH service
sudo systemctl restart ssh
```

### Set Up Log Rotation

```bash
# Configure log rotation for monitoring logs
sudo tee /etc/logrotate.d/monitoring > /dev/null <<EOF
/var/log/monitoring/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 $USER $USER
}
EOF
```

---

## ✅ Step 8: Validation and Testing

### Create System Validation Script

```bash
# Create validation script
cat > ~/validate-server-setup.sh <<'EOF'
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Server Setup Validation${NC}"
echo "=========================="
echo ""

issues=0

# Check system requirements
echo "💻 System Requirements:"
cores=$(nproc)
memory_gb=$(free -g | awk '/^Mem:/{print $2}')
disk_gb=$(df / --output=avail | tail -1 | awk '{print int($1/1024/1024)}')

if [[ $cores -ge 4 ]]; then
    echo -e "  ✅ CPU Cores: ${GREEN}$cores cores${NC}"
else
    echo -e "  ❌ CPU Cores: ${RED}$cores cores (minimum 4 required)${NC}"
    ((issues++))
fi

if [[ $memory_gb -ge 8 ]]; then
    echo -e "  ✅ Memory: ${GREEN}${memory_gb}GB${NC}"
else
    echo -e "  ❌ Memory: ${RED}${memory_gb}GB (minimum 8GB required)${NC}"
    ((issues++))
fi

if [[ $disk_gb -ge 100 ]]; then
    echo -e "  ✅ Disk Space: ${GREEN}${disk_gb}GB available${NC}"
else
    echo -e "  ⚠️  Disk Space: ${YELLOW}${disk_gb}GB available (100GB+ recommended)${NC}"
fi

echo ""

# Check installed software
echo "📦 Required Software:"
commands=("docker" "docker-compose" "curl" "wget" "git" "openssl" "jq" "certbot" "node" "npm")

for cmd in "${commands[@]}"; do
    if command -v "$cmd" &> /dev/null; then
        if [[ "$cmd" == "docker" ]]; then
            version=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
            echo -e "  ✅ Docker: ${GREEN}$version${NC}"
        elif [[ "$cmd" == "node" ]]; then
            version=$(node --version)
            echo -e "  ✅ Node.js: ${GREEN}$version${NC}"
        else
            echo -e "  ✅ $cmd: ${GREEN}Available${NC}"
        fi
    else
        echo -e "  ❌ $cmd: ${RED}Missing${NC}"
        ((issues++))
    fi
done

echo ""

# Check Docker service
echo "🐳 Docker Configuration:"
if systemctl is-active --quiet docker; then
    echo -e "  ✅ Docker service: ${GREEN}Running${NC}"

    # Check Docker permissions
    if docker ps &> /dev/null; then
        echo -e "  ✅ Docker permissions: ${GREEN}OK${NC}"
    else
        echo -e "  ❌ Docker permissions: ${RED}User cannot run Docker${NC}"
        echo "    Fix: sudo usermod -aG docker $USER && newgrp docker"
        ((issues++))
    fi

    # Check Docker Compose
    if docker compose version &> /dev/null; then
        compose_version=$(docker compose version --short)
        echo -e "  ✅ Docker Compose: ${GREEN}$compose_version${NC}"
    else
        echo -e "  ❌ Docker Compose: ${RED}Not available${NC}"
        ((issues++))
    fi
else
    echo -e "  ❌ Docker service: ${RED}Not running${NC}"
    ((issues++))
fi

echo ""

# Check network connectivity
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

# Check firewall
echo "🔥 Firewall Configuration:"
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        echo -e "  ✅ UFW firewall: ${GREEN}Active${NC}"

        # Check required ports
        required_ports=("80/tcp" "443/tcp" "22/tcp")
        for port in "${required_ports[@]}"; do
            if ufw status | grep -q "$port.*ALLOW"; then
                echo -e "  ✅ Port $port: ${GREEN}Open${NC}"
            else
                echo -e "  ⚠️  Port $port: ${YELLOW}Not explicitly allowed${NC}"
            fi
        done
    else
        echo -e "  ⚠️  UFW firewall: ${YELLOW}Not active${NC}"
    fi
else
    echo -e "  ⚠️  UFW firewall: ${YELLOW}Not installed${NC}"
fi

echo ""

# Check directories
echo "📁 Directory Structure:"
directories=("/var/lib/monitoring" "/var/log/monitoring" "/var/backups/monitoring")
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
    echo -e "${GREEN}🎉 Server Setup Validation: ALL CHECKS PASSED!${NC}"
    echo ""
    echo "Your server is ready for monitoring system deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Clone the Relife repository"
    echo "2. Run the webhook setup: ./monitoring/scripts/setup-webhooks.sh"
    echo "3. Deploy monitoring: ./monitoring/scripts/deploy-production.sh"
else
    echo -e "${RED}❌ Server Setup Validation: FOUND $issues ISSUES${NC}"
    echo ""
    echo "Please fix the issues above before proceeding with deployment."
fi

exit $issues
EOF

chmod +x ~/validate-server-setup.sh
```

### Run Server Validation

```bash
# Run the validation script
~/validate-server-setup.sh
```

---

## 🎯 Step 9: Clone Relife Repository

### Clone the Repository

```bash
# Navigate to deployment directory
cd /opt/relife

# Clone the Relife repository
git clone https://github.com/Coolhgg/Relife.git .

# Verify repository contents
ls -la

# Check monitoring files
ls -la monitoring/
```

**Expected output:**

```
total 48
drwxr-xr-x  15 deployer deployer 4096 Jan 15 10:30 .
drwxr-xr-x   3 deployer deployer 4096 Jan 15 10:30 ..
-rw-r--r--   1 deployer deployer  123 Jan 15 10:30 .gitignore
drwxr-xr-x   8 deployer deployer 4096 Jan 15 10:30 android
-rw-r--r--   1 deployer deployer 1234 Jan 15 10:30 package.json
drwxr-xr-x   5 deployer deployer 4096 Jan 15 10:30 monitoring
...

monitoring/:
total 28
drwxr-xr-x 7 deployer deployer 4096 Jan 15 10:30 .
drwxr-xr-x 15 deployer deployer 4096 Jan 15 10:30 ..
drwxr-xr-x 3 deployer deployer 4096 Jan 15 10:30 alertmanager
drwxr-xr-x 3 deployer deployer 4096 Jan 15 10:30 grafana
drwxr-xr-x 3 deployer deployer 4096 Jan 15 10:30 prometheus
drwxr-xr-x 2 deployer deployer 4096 Jan 15 10:30 runbooks
drwxr-xr-x 2 deployer deployer 4096 Jan 15 10:30 scripts
```

### Verify Monitoring Scripts

```bash
# Check script permissions
ls -la monitoring/scripts/

# Make sure scripts are executable
chmod +x monitoring/scripts/*.sh

# Test script availability
./monitoring/scripts/setup-webhooks.sh --help 2>/dev/null || echo "Scripts ready for execution"
```

---

## 🔧 Step 10: System Optimization for Monitoring

### Configure System for Time-Series Database

```bash
# Optimize for Prometheus time-series database
echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf

# Apply immediately
sudo sysctl vm.max_map_count=262144

# Configure file descriptor limits
echo '$USER soft nofile 65536' | sudo tee -a /etc/security/limits.conf
echo '$USER hard nofile 65536' | sudo tee -a /etc/security/limits.conf

# Verify limits
ulimit -n
```

**Expected output:**

```
65536
```

### Set Up Log Management

```bash
# Configure systemd journal limits
sudo mkdir -p /etc/systemd/journald.conf.d

sudo tee /etc/systemd/journald.conf.d/monitoring.conf > /dev/null <<EOF
[Journal]
SystemMaxUse=1G
SystemMaxFileSize=100M
SystemMaxFiles=10
RuntimeMaxUse=100M
RuntimeMaxFileSize=10M
RuntimeMaxFiles=5
EOF

# Restart journald
sudo systemctl restart systemd-journald
```

---

## ✅ Final Validation

### Run Complete System Check

```bash
# Run the validation script again
~/validate-server-setup.sh
```

**You should see:**

```
🔍 Server Setup Validation
==========================

💻 System Requirements:
  ✅ CPU Cores: 4 cores
  ✅ Memory: 8GB
  ✅ Disk Space: 150GB available

📦 Required Software:
  ✅ Docker: 24.0.7
  ✅ docker-compose: Available
  ✅ curl: Available
  ✅ wget: Available
  ✅ git: Available
  ✅ openssl: Available
  ✅ jq: Available
  ✅ certbot: Available
  ✅ Node.js: v18.17.0
  ✅ npm: Available

🐳 Docker Configuration:
  ✅ Docker service: Running
  ✅ Docker permissions: OK
  ✅ Docker Compose: v2.20.3

🌐 Network Connectivity:
  ✅ Internet access: Working
  ✅ Docker Hub access: Working

🔥 Firewall Configuration:
  ✅ UFW firewall: Active
  ✅ Port 80/tcp: Open
  ✅ Port 443/tcp: Open
  ✅ Port 22/tcp: Open

📁 Directory Structure:
  ✅ /var/lib/monitoring: Ready
  ✅ /var/log/monitoring: Ready
  ✅ /var/backups/monitoring: Ready

🎉 Server Setup Validation: ALL CHECKS PASSED!

Your server is ready for monitoring system deployment!
```

### Create Server Information Summary

```bash
# Create server info file for reference
cat > ~/server-info.txt <<EOF
Relife Monitoring Server Information
===================================
Server IP: $(curl -s ifconfig.me)
Hostname: $(hostname -f)
OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)
CPU Cores: $(nproc)
Memory: $(free -h | awk '/^Mem:/{print $2}')
Disk Space: $(df -h / | awk 'NR==2{print $4}') available
Docker Version: $(docker --version)
Setup Date: $(date)

Next Steps:
1. Configure notifications: ./monitoring/scripts/setup-webhooks.sh
2. Validate configuration: ./monitoring/scripts/validate-production-config.sh
3. Deploy monitoring: ./monitoring/scripts/deploy-production.sh

Access URLs (after deployment):
- Grafana: https://grafana.yourdomain.com
- Prometheus: https://prometheus.yourdomain.com
- AlertManager: https://alertmanager.yourdomain.com
EOF

cat ~/server-info.txt
```

---

## 🎉 Prerequisites Complete!

Your production server is now fully prepared with all required dependencies and optimizations for
the monitoring system deployment.

### What's Ready:

- ✅ **Docker Engine** and Docker Compose installed and configured
- ✅ **System utilities** installed (curl, wget, jq, openssl, git)
- ✅ **SSL certificate tools** ready (Certbot for Let's Encrypt)
- ✅ **Network configuration** optimized for monitoring workloads
- ✅ **Security hardening** with firewall and SSH configuration
- ✅ **Directory structure** created with proper permissions
- ✅ **System limits** optimized for time-series databases
- ✅ **Repository cloned** and scripts ready for execution

### Next Steps:

```bash
# 1. Configure notification channels
./monitoring/scripts/setup-webhooks.sh

# 2. Run the full deployment
./monitoring/scripts/deploy-assistant.sh
```

Your server is now **production-ready** for monitoring deployment! 🚀
