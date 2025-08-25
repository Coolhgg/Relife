#!/bin/bash

# =============================================================================
# MONITORING SYSTEM DEMONSTRATION
# =============================================================================
# This script demonstrates what your monitoring system will look like in production
# Shows sample metrics, alerts, and dashboard data
# =============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

demo_dashboard() {
    echo -e "${BLUE}📊 RELIFE MONITORING DASHBOARD PREVIEW${NC}"
    echo "=============================================="
    echo ""
    
    echo -e "${GREEN}🏢 BUSINESS INTELLIGENCE${NC}"
    echo "───────────────────────────────────"
    echo "📈 Daily Active Users:     3,247 (↑ 5.2%)"
    echo "💰 Daily Revenue:         $4,231 (↑ 12.8%)"
    echo "📱 Mobile App Users:      2,891 (89%)"
    echo "⏰ Alarm Success Rate:    94.7% (↑ 0.3%)"
    echo "🔔 Premium Conversions:   127 today (3.9%)"
    echo "📊 Customer Satisfaction: 4.6/5.0 stars"
    echo ""
    
    echo -e "${PURPLE}📱 MOBILE APP HEALTH${NC}"
    echo "───────────────────────────────────"
    echo "🍎 iOS Crash Rate:        0.12% (↓ 0.05%)"
    echo "🤖 Android Crash Rate:    0.18% (↓ 0.02%)"
    echo "🔋 Battery Impact:        2.3% average"
    echo "📡 Network Performance:   98.7% success"
    echo "⚡ App Launch Time:       1.2s average"
    echo "💾 Memory Usage:          127MB average"
    echo ""
    
    echo -e "${YELLOW}⚡ SYSTEM PERFORMANCE${NC}"
    echo "───────────────────────────────────"
    echo "🌐 API Response Time:     127ms (95th percentile)"
    echo "❌ Error Rate:            0.23% (↓ 0.07%)"
    echo "🖥️  CPU Usage:            34% average"
    echo "💾 Memory Usage:          67% average"
    echo "💿 Disk Usage:            45% full"
    echo "🔄 Cache Hit Rate:        96.8%"
    echo ""
    
    echo -e "${RED}🛡️  SECURITY MONITORING${NC}"
    echo "───────────────────────────────────"
    echo "🔒 Failed Logins:         3 (last hour)"
    echo "🚫 API Abuse Attempts:    0 (last hour)"
    echo "🔍 Fraud Detection:       2 blocked (today)"
    echo "🛡️  WAF Blocks:           45 (today)"
    echo "📋 GDPR Requests:         2 processed (this week)"
    echo "🔐 Security Score:        97/100"
    echo ""
}

demo_alerts() {
    echo -e "${BLUE}🚨 ACTIVE ALERTS PREVIEW${NC}"
    echo "==============================="
    echo ""
    
    echo -e "${GREEN}✅ NO CRITICAL ALERTS${NC}"
    echo ""
    
    echo -e "${YELLOW}⚠️  WARNING ALERTS (2)${NC}"
    echo "────────────────────────────────"
    echo "🔔 Mobile App Performance"
    echo "   iOS memory usage increased to 285MB"
    echo "   Threshold: 250MB | Current: 285MB"
    echo "   Duration: 15 minutes"
    echo "   Action: Investigate memory leaks"
    echo ""
    echo "📊 Revenue Trend Change"
    echo "   Daily revenue growth rate decreased"
    echo "   7-day average: +8.2% → +3.1%"
    echo "   Duration: 3 days"
    echo "   Action: Review conversion funnel"
    echo ""
    
    echo -e "${BLUE}ℹ️  INFO ALERTS (1)${NC}"
    echo "────────────────────────────────"
    echo "🔄 Backup Completed"
    echo "   Daily monitoring backup successful"
    echo "   Size: 247MB | Duration: 3m 24s"
    echo "   Location: /var/backups/relife-monitoring/"
    echo ""
}

demo_notifications() {
    echo -e "${BLUE}🔔 SAMPLE ALERT NOTIFICATIONS${NC}"
    echo "====================================="
    echo ""
    
    echo -e "${GREEN}📱 Slack Notification Example:${NC}"
    echo "────────────────────────────────────────"
    echo "🚨 **CRITICAL ALERT** - Service Down"
    echo ""
    echo "**Service:** API Gateway"
    echo "**Status:** DOWN"
    echo "**Duration:** 2 minutes"
    echo "**Impact:** All users affected"
    echo ""
    echo "**Quick Actions:**"
    echo "• 🔍 View Logs"
    echo "• 📊 Check Dashboard" 
    echo "• 🔄 Restart Service"
    echo ""
    echo "**Runbook:** Alert Response Guide → Service Down"
    echo "────────────────────────────────────────"
    echo ""
    
    echo -e "${PURPLE}📧 Email Alert Example:${NC}"
    echo "────────────────────────────────────────"
    echo "From: Relife Monitoring <alerts@relife.app>"
    echo "Subject: ⚠️ WARNING - High Mobile App Crash Rate"
    echo ""
    echo "Alert: MobileCrashRateHigh"
    echo "Severity: WARNING"
    echo "Platform: iOS"
    echo "Current Rate: 1.2% (Threshold: 1.0%)"
    echo "Duration: 45 minutes"
    echo ""
    echo "Recent crashes affecting:"
    echo "• iPhone 12 Pro (iOS 16.1) - 8 crashes"
    echo "• iPhone 13 (iOS 16.0) - 5 crashes"
    echo "• iPad Air (iPadOS 16.1) - 3 crashes"
    echo ""
    echo "Recommended Actions:"
    echo "1. Check crash logs in App Store Connect"
    echo "2. Review recent app updates"
    echo "3. Monitor user feedback"
    echo ""
    echo "Dashboard: https://grafana.relife.app/d/mobile-health"
    echo "────────────────────────────────────────"
    echo ""
}

demo_dashboard_features() {
    echo -e "${BLUE}📊 GRAFANA DASHBOARD FEATURES${NC}"
    echo "====================================="
    echo ""
    
    echo -e "${GREEN}🎯 Enhanced Business Intelligence Dashboard${NC}"
    echo ""
    echo "**Key Performance Indicators:**"
    echo "┌─────────────────────┬──────────┬─────────┬──────────┐"
    echo "│ Metric              │ Current  │ Target  │ Trend    │"
    echo "├─────────────────────┼──────────┼─────────┼──────────┤"
    echo "│ Daily Active Users  │ 3,247    │ 3,000   │ ↗ +5.2%  │"
    echo "│ Alarm Success Rate  │ 94.7%    │ 90%     │ ↗ +0.3%  │"
    echo "│ Premium Conversion  │ 3.9%     │ 5%      │ → 0.0%   │"
    echo "│ Customer Sat Score  │ 4.6/5    │ 4.5/5   │ ↗ +0.1   │"
    echo "│ Monthly Revenue     │ $127k    │ $100k   │ ↗ +27%   │"
    echo "└─────────────────────┴──────────┴─────────┴──────────┘"
    echo ""
    
    echo "**📈 Time Series Graphs:**"
    echo "• User activity patterns (hourly, daily, weekly)"
    echo "• Revenue trends with forecasting"
    echo "• Alarm success rates by time of day"
    echo "• Mobile app performance metrics"
    echo "• API endpoint response times"
    echo ""
    
    echo "**🎚️ Interactive Controls:**"
    echo "• Time range selector (1h, 24h, 7d, 30d)"
    echo "• Metric filtering by user segments"
    echo "• Alert status overview"
    echo "• Real-time data refresh"
    echo ""
    
    echo "**🚨 Alert Status Panel:**"
    echo "• 0 Critical alerts"
    echo "• 2 Warning alerts" 
    echo "• 1 Info notification"
    echo "• Last incident: 3 days ago (resolved in 12m)"
    echo ""
}

demo_metrics_collection() {
    echo -e "${BLUE}📊 METRICS COLLECTION SIMULATION${NC}"
    echo "===================================="
    echo ""
    
    echo "🔄 Simulating real-time metrics collection..."
    echo ""
    
    for i in {1..5}; do
        case $i in
            1)
                echo -e "📈 ${GREEN}Business Metrics${NC} → Revenue: $4,231, DAU: 3,247, Churn: 2.1%"
                ;;
            2) 
                echo -e "⚡ ${YELLOW}Performance Metrics${NC} → Response: 127ms, Errors: 0.23%, CPU: 34%"
                ;;
            3)
                echo -e "📱 ${PURPLE}Mobile Metrics${NC} → iOS crashes: 0.12%, Android: 0.18%, Memory: 127MB"
                ;;
            4)
                echo -e "🛡️  ${RED}Security Metrics${NC} → Failed logins: 3, API abuse: 0, Fraud blocked: 2"
                ;;
            5)
                echo -e "📊 ${BLUE}SLA Metrics${NC} → Uptime: 99.97%, Response SLA: 98.3%, Error budget: 0.03%"
                ;;
        esac
        sleep 1
    done
    
    echo ""
    echo -e "${GREEN}✅ All metrics collected successfully!${NC}"
    echo ""
}

show_deployment_summary() {
    echo -e "${BLUE}🎯 DEPLOYMENT SUMMARY${NC}"
    echo "======================"
    echo ""
    echo "Your monitoring system includes:"
    echo ""
    echo -e "${GREEN}✅ Infrastructure Components:${NC}"
    echo "   • Prometheus (metrics database)"
    echo "   • AlertManager (notification routing)"
    echo "   • Grafana (dashboards & visualization)"
    echo "   • Custom metrics collector"
    echo "   • System exporters (node, nginx, redis)"
    echo ""
    echo -e "${GREEN}✅ Monitoring Coverage:${NC}"
    echo "   • 20+ business intelligence alerts"
    echo "   • 15+ mobile app performance alerts"
    echo "   • 18+ security monitoring alerts"
    echo "   • 12+ SLA and uptime alerts"
    echo ""
    echo -e "${GREEN}✅ Notification Channels:${NC}"
    echo "   • Slack integration with rich formatting"
    echo "   • Discord notifications with embeds"
    echo "   • HTML email alerts with dashboards"
    echo "   • PagerDuty escalation for critical issues"
    echo ""
    echo -e "${GREEN}✅ Operational Features:${NC}"
    echo "   • Automated daily backups"
    echo "   • Health monitoring and self-healing"
    echo "   • Alert response runbooks"
    echo "   • Performance optimization"
    echo ""
}

main() {
    clear
    echo -e "${BLUE}🚀 Relife Smart Alarm - Monitoring System Demo${NC}"
    echo "=================================================="
    echo ""
    echo "This demonstration shows what your production monitoring system will provide."
    echo ""
    
    read -p "Press Enter to start the demo..."
    clear
    
    demo_dashboard
    read -p "Press Enter to continue..."
    clear
    
    demo_alerts
    read -p "Press Enter to continue..."
    clear
    
    demo_notifications
    read -p "Press Enter to continue..."
    clear
    
    demo_dashboard_features
    read -p "Press Enter to continue..."
    clear
    
    demo_metrics_collection
    read -p "Press Enter to continue..."
    clear
    
    show_deployment_summary
    
    echo ""
    echo -e "${GREEN}🎉 Demo Complete!${NC}"
    echo ""
    echo "Ready to deploy this monitoring system to production?"
    echo ""
    echo "Next steps:"
    echo -e "1. ${BLUE}./monitoring/scripts/setup-webhooks.sh${NC} - Configure notifications"
    echo -e "2. ${BLUE}./monitoring/scripts/validate-production-config.sh${NC} - Validate setup"
    echo -e "3. ${BLUE}./monitoring/scripts/deploy-production.sh${NC} - Deploy to production"
    echo ""
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    cd "$(dirname "$0")/../.."
    main
fi