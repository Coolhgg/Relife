# Relife Smart Alarm - Alert Response Runbooks

## 🚨 Critical Alert Response Procedures

### Service Down Alerts
**Timeline: Immediate (0-5 minutes)**
1. **Acknowledge**: Immediately acknowledge in AlertManager
2. **Assess**: Check service status via health endpoints
3. **Escalate**: Page on-call engineer immediately
4. **Communicate**: Update status page and notify users
5. **Investigate**: Check recent deployments, infrastructure changes
6. **Resolve**: Follow service-specific recovery procedures

### Security Incident Response
**Timeline: 0-30 minutes**
1. **Contain**: Block malicious IPs immediately
2. **Assess**: Determine scope and impact
3. **Document**: Log all actions and findings
4. **Escalate**: Notify security team lead
5. **Investigate**: Analyze attack patterns and vectors
6. **Remediate**: Apply security patches and fixes

### SLA Violation Response
**Timeline: 0-60 minutes**
1. **Acknowledge**: Document SLA violation start time
2. **Prioritize**: Focus resources on rapid resolution
3. **Communicate**: Notify customer success team
4. **Track**: Monitor error budget consumption
5. **Resolve**: Implement immediate fixes
6. **Follow-up**: Calculate customer credits if needed

## ⚠️ Warning Alert Procedures

### Performance Degradation
1. **Monitor**: Watch for escalation to critical
2. **Analyze**: Check performance metrics and trends
3. **Investigate**: Review recent changes and deployments
4. **Optimize**: Apply performance improvements
5. **Document**: Log findings and actions taken

### Business Metric Alerts
1. **Analyze**: Review business intelligence dashboards
2. **Context**: Check for external factors (marketing, seasonality)
3. **Investigate**: Look for product or technical causes
4. **Coordinate**: Work with product and growth teams
5. **Track**: Monitor metric recovery

## 📱 Mobile-Specific Procedures

### Mobile Crash Alerts
1. **Immediate**: Check crash reporting tools (Crashlytics, Sentry)
2. **Analyze**: Review crash patterns and affected devices
3. **Investigate**: Check recent app releases and changes
4. **Fix**: Prepare hotfix if critical issue identified
5. **Deploy**: Push hotfix through app stores if needed
6. **Monitor**: Track crash rate reduction

### Mobile Performance Issues
1. **Device Analysis**: Check device/OS compatibility matrix
2. **Version Check**: Review app version distribution
3. **Testing**: Test on affected platforms
4. **Optimization**: Apply mobile-specific performance fixes
5. **Release**: Deploy optimizations in next release

## 🛠️ General Response Guidelines

### Severity Levels
- **Critical**: Immediate response (0-15 minutes)
- **Warning**: Response within 30 minutes
- **Info**: Response within 2 hours

### Communication Channels
- **Critical**: Slack #incidents + PagerDuty + Email
- **Warning**: Slack team channels
- **Info**: Slack monitoring channels

### Escalation Matrix
1. **On-call Engineer** (0-15 min for critical)
2. **Team Lead** (15-30 min)
3. **Engineering Manager** (30-60 min)
4. **CTO** (1+ hour for critical)

### Post-Incident Process
1. **Document**: Create incident timeline
2. **Review**: Schedule post-mortem within 48h
3. **Action Items**: Assign preventive measures
4. **Update**: Improve monitoring and alerts
5. **Share**: Communicate learnings with team

## 🔍 Useful Commands

### Prometheus Queries
```promql
# Check service health
up{job="relife-api"}

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# Response time percentiles
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### AlertManager Commands
```bash
# Silence alert
amtool silence add alertname="HighErrorRate" --duration="1h" --comment="Investigating"

# List active alerts
amtool alert query

# Check configuration
amtool check-config /etc/alertmanager/alertmanager.yml
```

### Service Management
```bash
# Reload configurations
systemctl reload prometheus
systemctl reload alertmanager

# Check service status
systemctl status prometheus
journalctl -u prometheus -f

# Check Grafana
docker logs relife-grafana -f
```