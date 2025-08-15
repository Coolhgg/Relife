# Relife Smart Alarm - Troubleshooting Guide

## Table of Contents

1. [Quick Diagnosis](#quick-diagnosis)
2. [Application Issues](#application-issues)
3. [Performance Monitoring Issues](#performance-monitoring-issues)
4. [Database Problems](#database-problems)
5. [Network and SSL Issues](#network-and-ssl-issues)
6. [Container and Docker Issues](#container-and-docker-issues)
7. [Monitoring Stack Problems](#monitoring-stack-problems)
8. [External Services Issues](#external-services-issues)
9. [Performance Problems](#performance-problems)
10. [Security Issues](#security-issues)
11. [Emergency Procedures](#emergency-procedures)

## Quick Diagnosis

### Health Check Script

Run this first to get an overview of system status:

```bash
#!/bin/bash
# Quick system diagnosis
echo "=== Relife System Health Check ==="

# Check system resources
echo "📊 System Resources:"
echo "CPU Load: $(uptime | awk -F'load average:' '{ print $2 }' | cut -d, -f1 | sed 's/^[ \t]*//')"
echo "Memory: $(free -h | grep 'Mem:' | awk '{print $3 "/" $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
echo

# Check critical services
echo "🔧 Service Status:"
services=("nginx" "docker" "prometheus" "grafana-server")
for service in "${services[@]}"; do
    if systemctl is-active --quiet "$service"; then
        echo "✅ $service is running"
    else
        echo "❌ $service is not running"
    fi
done
echo

# Check Docker containers
echo "🐳 Docker Containers:"
if command -v docker &> /dev/null; then
    docker-compose -f docker-compose.prod.yml ps
else
    echo "Docker not available"
fi
echo

# Check critical ports
echo "🌐 Port Status:"
ports=("80:HTTP" "443:HTTPS" "9090:Prometheus" "3000:Grafana")
for port_info in "${ports[@]}"; do
    port=$(echo $port_info | cut -d: -f1)
    name=$(echo $port_info | cut -d: -f2)
    if nc -z localhost "$port" 2>/dev/null; then
        echo "✅ Port $port ($name) is open"
    else
        echo "❌ Port $port ($name) is not accessible"
    fi
done
echo

# Check application endpoints
echo "🔗 Application Health:"
endpoints=(
    "https://relife.app/api/health:Main API"
    "https://api.relife.app/api/performance/health:Performance API"
    "http://localhost:9090/-/healthy:Prometheus"
)

for endpoint_info in "${endpoints[@]}"; do
    endpoint=$(echo $endpoint_info | cut -d: -f1-2)
    name=$(echo $endpoint_info | cut -d: -f3)
    if curl -sf "$endpoint" > /dev/null 2>&1; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is not responding"
    fi
done

echo
echo "=== End Health Check ==="
```

Save this as `scripts/quick-diagnosis.sh` and run it first when troubleshooting.

## Application Issues

### Issue: Application Not Loading (502 Bad Gateway)

**Symptoms:**
- Users see "502 Bad Gateway" error
- Nginx error logs show "connect() failed"
- Application containers not responding

**Diagnosis:**
```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check if application containers are running
docker-compose -f docker-compose.prod.yml ps

# Check application logs
docker-compose -f docker-compose.prod.yml logs app

# Check nginx configuration
sudo nginx -t
```

**Solutions:**

1. **Restart application containers:**
```bash
docker-compose -f docker-compose.prod.yml restart app
```

2. **Check and fix nginx configuration:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

3. **Verify upstream servers:**
```bash
# Check if app container is accessible internally
docker-compose -f docker-compose.prod.yml exec nginx curl -f http://app:3000/api/health
```

### Issue: Application Slow Response Times

**Symptoms:**
- Pages load slowly (>3 seconds)
- High response times in monitoring
- Users reporting poor performance

**Diagnosis:**
```bash
# Check application performance metrics
curl https://api.relife.app/api/performance/system-health

# Monitor real-time resource usage
htop
iotop

# Check application logs for errors
docker-compose -f docker-compose.prod.yml logs app | grep -E "(error|timeout|slow)"

# Check database query performance
docker-compose -f docker-compose.prod.yml logs app | grep -i "query"
```

**Solutions:**

1. **Scale application resources:**
```bash
# Edit docker-compose.prod.yml to increase resources
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
```

2. **Optimize database queries:**
```bash
# Check slow queries in logs
grep -i "slow query" /var/log/postgresql/postgresql.log

# Add database indexes if needed
psql "$DATABASE_URL" -c "CREATE INDEX CONCURRENTLY idx_performance_timestamp ON performance_analytics(timestamp);"
```

3. **Enable caching:**
```bash
# Verify Redis is running
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# Clear cache if corrupted
docker-compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL
```

### Issue: Memory Leaks or High Memory Usage

**Symptoms:**
- Memory usage constantly increasing
- OutOfMemory errors in logs
- System becomes unresponsive

**Diagnosis:**
```bash
# Monitor memory usage over time
while true; do
    echo "$(date): $(free -h | grep 'Mem:' | awk '{print $3 "/" $2}')"
    sleep 60
done

# Check Docker container memory usage
docker stats --no-stream

# Check for memory leaks in application
docker-compose -f docker-compose.prod.yml exec app node --inspect-brk=0.0.0.0:9229 dist/main.js &
# Use Chrome DevTools to inspect memory
```

**Solutions:**

1. **Restart services to free memory:**
```bash
docker-compose -f docker-compose.prod.yml restart
```

2. **Optimize memory limits:**
```bash
# Set memory limits in docker-compose.prod.yml
services:
  app:
    mem_limit: 1g
    memswap_limit: 1g
```

3. **Clean up system:**
```bash
# Clean Docker system
docker system prune -a

# Clear logs
sudo journalctl --vacuum-time=7d
sudo find /var/log -name "*.log" -mtime +7 -delete
```

## Performance Monitoring Issues

### Issue: Missing Performance Metrics

**Symptoms:**
- Grafana dashboards show no data
- Performance metrics endpoints return empty responses
- Prometheus shows targets as down

**Diagnosis:**
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health != "up")'

# Test performance API endpoints
curl https://api.relife.app/api/performance/health
curl https://api.relife.app/api/performance/system-health

# Check Prometheus configuration
promtool check config /etc/prometheus/prometheus.yml

# Check if metrics are being generated
curl https://api.relife.app/api/performance/real-time
```

**Solutions:**

1. **Restart monitoring stack:**
```bash
systemctl restart prometheus
systemctl restart grafana-server
docker-compose -f docker-compose.prod.yml restart monitoring
```

2. **Fix Prometheus configuration:**
```bash
# Validate and reload Prometheus config
promtool check config /etc/prometheus/prometheus.yml
curl -X POST http://localhost:9090/-/reload
```

3. **Verify network connectivity:**
```bash
# Test internal network access
docker-compose -f docker-compose.prod.yml exec prometheus curl -f http://app:3000/metrics
```

### Issue: Web Vitals Not Being Collected

**Symptoms:**
- Web Vitals dashboards empty
- No LCP/FID/CLS data in metrics
- Frontend not sending performance data

**Diagnosis:**
```bash
# Check browser console for errors
# Open DevTools -> Console and look for fetch errors

# Test Web Vitals endpoint
curl -X POST https://api.relife.app/api/performance/web-vitals \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test",
    "url": "https://relife.app",
    "lcp": 2000,
    "fid": 100,
    "cls": 0.1,
    "device_type": "desktop",
    "timestamp": "'$(date -Iseconds)'"
  }'

# Check database for Web Vitals data
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM performance_analytics WHERE metric_name LIKE 'web_vitals_%';"
```

**Solutions:**

1. **Fix CORS issues:**
```bash
# Check nginx CORS configuration
grep -n "Access-Control" /etc/nginx/sites-enabled/relife

# Update CORS headers in API
curl -I https://api.relife.app/api/performance/web-vitals
```

2. **Update frontend monitoring code:**
```javascript
// Check if Web Vitals are properly initialized
import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFCP(console.log);
getFID(console.log);  
getLCP(console.log);
getTTFB(console.log);
```

## Database Problems

### Issue: Database Connection Failures

**Symptoms:**
- "Connection refused" errors
- Application cannot connect to database
- Timeout errors in logs

**Diagnosis:**
```bash
# Test database connectivity
pg_isready -h your-db-host -p 5432

# Test connection with psql
psql "$DATABASE_URL" -c "SELECT version();"

# Check connection string format
echo "$DATABASE_URL" | sed 's/:[^:]*@/:PASSWORD@/'

# Check database logs
docker-compose -f docker-compose.prod.yml logs db
```

**Solutions:**

1. **Verify connection parameters:**
```bash
# Check environment variables
env | grep -E "(DATABASE|SUPABASE)"

# Test with different connection parameters
psql -h your-host -p 5432 -U your-user -d your-db -c "SELECT 1;"
```

2. **Fix network issues:**
```bash
# Check if database port is accessible
telnet your-db-host 5432

# Test DNS resolution
nslookup your-db-host

# Check firewall rules
sudo ufw status
```

### Issue: Database Performance Problems

**Symptoms:**
- Slow query responses
- High database CPU usage
- Connection pool exhaustion

**Diagnosis:**
```bash
# Check active connections
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
psql "$DATABASE_URL" -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check database size
psql "$DATABASE_URL" -c "SELECT pg_size_pretty(pg_database_size('your_db'));"

# Check index usage
psql "$DATABASE_URL" -c "SELECT schemaname,tablename,attname,n_distinct,correlation FROM pg_stats;"
```

**Solutions:**

1. **Optimize queries:**
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_performance_timestamp ON performance_analytics(timestamp);
CREATE INDEX CONCURRENTLY idx_alarm_events_alarm_id ON alarm_events(alarm_id);

-- Update table statistics
ANALYZE;

-- Clean up old data
DELETE FROM performance_analytics WHERE timestamp < NOW() - INTERVAL '90 days';
```

2. **Optimize connection pooling:**
```bash
# Adjust connection pool settings in application
# Check current pool status
psql "$DATABASE_URL" -c "SHOW max_connections;"
```

## Network and SSL Issues

### Issue: SSL Certificate Problems

**Symptoms:**
- Browser shows "Not Secure" warning
- SSL certificate expired
- Mixed content warnings

**Diagnosis:**
```bash
# Check certificate status
sudo certbot certificates

# Test SSL connection
openssl s_client -connect relife.app:443 -servername relife.app

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/relife.app/cert.pem -text -noout | grep -A 2 "Validity"

# Test SSL configuration
curl -I https://relife.app
```

**Solutions:**

1. **Renew certificates:**
```bash
# Force certificate renewal
sudo certbot renew --force-renewal

# Restart nginx
sudo systemctl restart nginx
```

2. **Fix certificate installation:**
```bash
# Re-install certificate
sudo certbot --nginx -d relife.app -d www.relife.app

# Verify nginx configuration
sudo nginx -t
```

### Issue: Network Connectivity Problems

**Symptoms:**
- External API calls failing
- Cannot reach monitoring endpoints
- DNS resolution issues

**Diagnosis:**
```bash
# Test external connectivity
curl -I https://google.com
ping 8.8.8.8

# Check DNS resolution
nslookup relife.app
dig relife.app

# Check listening ports
netstat -tlnp | grep -E ":80|:443|:9090"
ss -tlnp
```

**Solutions:**

1. **Fix firewall rules:**
```bash
# Check current rules
sudo ufw status verbose

# Allow necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 10.0.0.0/8 to any port 9090
```

2. **Fix DNS issues:**
```bash
# Check /etc/hosts file
cat /etc/hosts

# Update DNS servers
sudo systemctl restart systemd-resolved
```

## Container and Docker Issues

### Issue: Docker Containers Not Starting

**Symptoms:**
- Containers exit immediately after starting
- "Cannot connect to Docker daemon" errors
- Permission denied errors

**Diagnosis:**
```bash
# Check Docker service status
systemctl status docker

# Check Docker daemon logs
journalctl -u docker.service

# Check container logs
docker-compose -f docker-compose.prod.yml logs

# Check Docker disk space
docker system df
```

**Solutions:**

1. **Restart Docker service:**
```bash
sudo systemctl restart docker
sudo systemctl enable docker
```

2. **Fix permissions:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Fix socket permissions
sudo chown root:docker /var/run/docker.sock
```

3. **Clean up Docker:**
```bash
# Remove unused containers, networks, images
docker system prune -a

# Remove unused volumes
docker volume prune
```

### Issue: Container Resource Limits

**Symptoms:**
- Containers being killed (OOMKilled)
- High CPU usage
- Containers running slowly

**Diagnosis:**
```bash
# Check container resource usage
docker stats --no-stream

# Check system resources
free -h
df -h

# Check container limits
docker inspect container_name | grep -A 10 -i "resources"
```

**Solutions:**

1. **Adjust resource limits:**
```yaml
# In docker-compose.prod.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
```

2. **Scale services:**
```bash
# Scale application containers
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

## Monitoring Stack Problems

### Issue: Prometheus Not Collecting Metrics

**Symptoms:**
- Targets showing as "DOWN" in Prometheus
- Missing metrics in queries
- Scrape errors in logs

**Diagnosis:**
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check Prometheus logs
journalctl -u prometheus.service

# Test scrape endpoints manually
curl http://localhost:9100/metrics  # Node exporter
curl https://api.relife.app/metrics  # Application metrics

# Validate Prometheus config
promtool check config /etc/prometheus/prometheus.yml
```

**Solutions:**

1. **Fix target configuration:**
```bash
# Update Prometheus configuration
sudo vi /etc/prometheus/prometheus.yml

# Reload configuration
curl -X POST http://localhost:9090/-/reload
```

2. **Fix network connectivity:**
```bash
# Test internal Docker network
docker-compose -f docker-compose.prod.yml exec prometheus curl app:3000/metrics
```

### Issue: Grafana Dashboards Not Loading

**Symptoms:**
- Grafana shows "No data" or "N/A"
- Dashboard panels not rendering
- Connection errors in Grafana logs

**Diagnosis:**
```bash
# Check Grafana logs
journalctl -u grafana-server.service

# Test Grafana API
curl http://admin:admin@localhost:3000/api/health

# Check datasource connectivity
curl http://admin:admin@localhost:3000/api/datasources

# Test Prometheus from Grafana
curl http://localhost:3000/api/datasources/proxy/1/api/v1/query?query=up
```

**Solutions:**

1. **Fix datasource configuration:**
```bash
# Update datasource URL in Grafana
# Go to Configuration -> Data Sources -> Prometheus
# Update URL to http://prometheus:9090
```

2. **Import dashboards:**
```bash
# Re-import dashboard JSON files
curl -X POST \
  http://admin:admin@localhost:3000/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -d @monitoring/grafana/dashboard.json
```

## External Services Issues

### Issue: DataDog Integration Not Working

**Symptoms:**
- Metrics not appearing in DataDog
- DataDog agent showing connection errors
- API calls to DataDog failing

**Diagnosis:**
```bash
# Check DataDog agent status
sudo datadog-agent status

# Test DataDog API connectivity
curl -X POST "https://api.datadoghq.com/api/v1/series" \
  -H "Content-Type: application/json" \
  -H "DD-API-KEY: ${DATADOG_API_KEY}" \
  -d '{
    "series": [{
      "metric": "test.metric",
      "points": [['$(date +%s)', 1]],
      "type": "gauge",
      "tags": ["environment:test"]
    }]
  }'

# Check agent logs
sudo tail -f /var/log/datadog/agent.log
```

**Solutions:**

1. **Fix API key:**
```bash
# Verify API key is correct
echo $DATADOG_API_KEY

# Update DataDog configuration
sudo vi /etc/datadog-agent/datadog.yaml
sudo systemctl restart datadog-agent
```

2. **Fix network connectivity:**
```bash
# Test DataDog endpoints
curl -I https://api.datadoghq.com
ping app.datadoghq.com
```

### Issue: New Relic Not Receiving Data

**Symptoms:**
- No data in New Relic dashboard
- License key errors
- Agent not reporting

**Diagnosis:**
```bash
# Check New Relic infrastructure agent
systemctl status newrelic-infra

# Test New Relic connectivity
curl -H "X-License-Key: $NEWRELIC_LICENSE_KEY" \
  https://platform-api.newrelic.com/platform/v1/metrics

# Check agent logs
sudo tail -f /var/log/newrelic-infra/newrelic-infra.log
```

**Solutions:**

1. **Fix license key:**
```bash
# Update license key
sudo vi /etc/newrelic-infra.yml
sudo systemctl restart newrelic-infra
```

2. **Verify agent configuration:**
```bash
# Check configuration file
cat /etc/newrelic-infra.yml

# Restart agent
sudo systemctl restart newrelic-infra
```

## Performance Problems

### Issue: High CPU Usage

**Symptoms:**
- System load > number of CPU cores
- Applications responding slowly
- High CPU usage in monitoring

**Diagnosis:**
```bash
# Check current CPU usage
top -p $(pgrep -d',' -f "node|nginx|prometheus")
htop

# Check system load
uptime
cat /proc/loadavg

# Identify CPU-intensive processes
ps aux --sort=-%cpu | head -10
```

**Solutions:**

1. **Scale application:**
```bash
# Add more application instances
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Distribute load with nginx
# Configure upstream load balancing
```

2. **Optimize application:**
```bash
# Enable application profiling
NODE_ENV=production node --prof app.js

# Analyze profile
node --prof-process isolate-*.log > processed.txt
```

### Issue: Disk Space Running Low

**Symptoms:**
- "No space left on device" errors
- Applications cannot write files
- Log rotation failing

**Diagnosis:**
```bash
# Check disk usage
df -h
du -sh /var/log/* | sort -hr
du -sh /opt/relife/* | sort -hr

# Check Docker disk usage
docker system df

# Find large files
find / -size +100M -type f 2>/dev/null | head -20
```

**Solutions:**

1. **Clean up logs:**
```bash
# Rotate and compress logs
sudo logrotate -f /etc/logrotate.conf

# Clean journal logs
sudo journalctl --vacuum-time=7d

# Clean old Docker logs
truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

2. **Clean up Docker:**
```bash
# Remove unused images and containers
docker system prune -a

# Remove unused volumes
docker volume prune
```

## Emergency Procedures

### Complete System Recovery

If the system is completely unresponsive:

```bash
# 1. Check if SSH is accessible
ssh user@server-ip

# 2. If SSH works, check system status
sudo systemctl status
df -h
free -h

# 3. Stop non-essential services
sudo systemctl stop grafana-server
sudo systemctl stop prometheus

# 4. Restart core services
sudo systemctl restart nginx
sudo systemctl restart docker

# 5. Restart application
cd /opt/relife/app
docker-compose -f docker-compose.prod.yml restart

# 6. Verify recovery
curl https://relife.app/api/health
```

### Database Emergency Recovery

If database is corrupted or inaccessible:

```bash
# 1. Stop application to prevent further damage
docker-compose -f docker-compose.prod.yml stop app

# 2. Create emergency backup
pg_dump "$DATABASE_URL" > emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Restore from latest backup
psql "$DATABASE_URL" < /opt/relife/backups/latest/database.sql

# 4. Verify data integrity
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM alarms;"

# 5. Restart application
docker-compose -f docker-compose.prod.yml start app
```

### Security Incident Response

If security breach is detected:

```bash
# 1. Immediate containment
sudo ufw enable  # Enable firewall
sudo ufw default deny incoming

# 2. Preserve evidence
sudo cp -r /var/log /tmp/incident_logs_$(date +%Y%m%d)
sudo cp -r /opt/relife /tmp/incident_app_$(date +%Y%m%d)

# 3. Check for unauthorized access
sudo last | head -20
sudo grep -i "failed\|invalid" /var/log/auth.log
sudo netstat -tlnp

# 4. Rotate all secrets
# - Generate new JWT secrets
# - Rotate database passwords
# - Update API keys

# 5. Update all systems
sudo apt update && sudo apt upgrade -y
```

### Contact Information

- **Technical Emergency**: Create GitHub issue with "URGENT" label
- **Security Incidents**: security@relife.app
- **Infrastructure Issues**: ops@relife.app

### Escalation Procedures

1. **Level 1**: Use this troubleshooting guide
2. **Level 2**: Check monitoring dashboards and logs
3. **Level 3**: Contact technical team via Slack/PagerDuty
4. **Level 4**: Emergency procedures and rollback

Remember to document all issues and solutions in the project wiki for future reference.