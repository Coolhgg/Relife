#!/bin/bash
# Alert testing script for Relife Smart Alarm monitoring system
# This script tests various alert conditions and notification channels

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROMETHEUS_URL="http://localhost:9090"
ALERTMANAGER_URL="http://localhost:9093"
GRAFANA_URL="http://localhost:3000"

echo -e "${BLUE}=== Relife Alert Testing Suite ===${NC}"
echo "Testing monitoring alerts and notification channels..."

# Function to check if service is responding
check_service() {
    local service_name=$1
    local url=$2
    local endpoint=$3
    
    echo -n "Checking $service_name... "
    if curl -s "$url$endpoint" >/dev/null; then
        echo -e "${GREEN}✓ ONLINE${NC}"
        return 0
    else
        echo -e "${RED}✗ OFFLINE${NC}"
        return 1
    fi
}

# Function to test alert rule
test_alert_rule() {
    local rule_name=$1
    local query=$2
    
    echo -n "Testing alert rule '$rule_name'... "
    
    # Query Prometheus for the alert
    response=$(curl -s "$PROMETHEUS_URL/api/v1/query" --data-urlencode "query=$query")
    
    if echo "$response" | jq -e '.status == "success"' >/dev/null; then
        echo -e "${GREEN}✓ VALID${NC}"
        return 0
    else
        echo -e "${RED}✗ INVALID${NC}"
        echo "  Query: $query"
        echo "  Response: $response"
        return 1
    fi
}

# Function to simulate metric and trigger alert
simulate_alert() {
    local alert_name=$1
    local metric_name=$2
    local metric_value=$3
    local duration=$4
    
    echo -e "${YELLOW}Simulating alert: $alert_name${NC}"
    echo "  Metric: $metric_name = $metric_value"
    echo "  Duration: $duration seconds"
    
    # Push custom metric to Prometheus pushgateway (if available)
    if command -v curl >/dev/null; then
        # Simulate metric via pushgateway or direct prometheus
        for i in $(seq 1 $duration); do
            echo "  Sending metric data ($i/$duration)..."
            # This would normally push to pushgateway
            # curl -X POST "$PUSHGATEWAY_URL/metrics/job/relife-test/instance/test" \
            #      --data-binary "$metric_name $metric_value"
            sleep 1
        done
    fi
    
    echo -e "${GREEN}  ✓ Simulation complete${NC}"
}

# Function to check active alerts
check_active_alerts() {
    echo -e "${YELLOW}Checking active alerts...${NC}"
    
    alerts=$(curl -s "$ALERTMANAGER_URL/api/v1/alerts")
    
    if echo "$alerts" | jq -e '.status == "success"' >/dev/null; then
        alert_count=$(echo "$alerts" | jq '.data | length')
        echo -e "${GREEN}✓ AlertManager API accessible${NC}"
        echo "  Active alerts: $alert_count"
        
        if [ "$alert_count" -gt 0 ]; then
            echo "  Alert details:"
            echo "$alerts" | jq -r '.data[] | "    - \(.labels.alertname): \(.status.state)"'
        fi
    else
        echo -e "${RED}✗ AlertManager API error${NC}"
        return 1
    fi
}

# Function to test notification channels
test_notification_channels() {
    echo -e "${YELLOW}Testing notification channels...${NC}"
    
    # Test Slack webhook (if configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        echo -n "Testing Slack webhook... "
        if curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data '{"text":"🧪 Test alert from Relife monitoring system"}' >/dev/null; then
            echo -e "${GREEN}✓ SUCCESS${NC}"
        else
            echo -e "${RED}✗ FAILED${NC}"
        fi
    else
        echo "  Slack webhook not configured (set SLACK_WEBHOOK_URL)"
    fi
    
    # Test Discord webhook (if configured)
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        echo -n "Testing Discord webhook... "
        if curl -s -X POST "$DISCORD_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data '{"content":"🧪 Test alert from Relife monitoring system"}' >/dev/null; then
            echo -e "${GREEN}✓ SUCCESS${NC}"
        else
            echo -e "${RED}✗ FAILED${NC}"
        fi
    else
        echo "  Discord webhook not configured (set DISCORD_WEBHOOK_URL)"
    fi
    
    # Test PagerDuty (if configured)
    if [ -n "$PAGERDUTY_ROUTING_KEY" ]; then
        echo -n "Testing PagerDuty integration... "
        if curl -s -X POST "https://events.pagerduty.com/v2/enqueue" \
            -H 'Content-Type: application/json' \
            --data "{
                \"routing_key\": \"$PAGERDUTY_ROUTING_KEY\",
                \"event_action\": \"trigger\",
                \"payload\": {
                    \"summary\": \"Test alert from Relife monitoring\",
                    \"source\": \"relife-monitoring-test\",
                    \"severity\": \"info\"
                }
            }" >/dev/null; then
            echo -e "${GREEN}✓ SUCCESS${NC}"
        else
            echo -e "${RED}✗ FAILED${NC}"
        fi
    else
        echo "  PagerDuty not configured (set PAGERDUTY_ROUTING_KEY)"
    fi
}

# Function to validate alert rules syntax
validate_alert_rules() {
    echo -e "${YELLOW}Validating alert rules...${NC}"
    
    # Check if promtool is available
    if ! command -v promtool >/dev/null; then
        echo -e "${RED}✗ promtool not found${NC}"
        return 1
    fi
    
    # Validate each alert file
    for rule_file in /etc/prometheus/rules/*.yml; do
        if [ -f "$rule_file" ]; then
            echo -n "  Validating $(basename "$rule_file")... "
            if promtool check rules "$rule_file" >/dev/null 2>&1; then
                echo -e "${GREEN}✓ VALID${NC}"
            else
                echo -e "${RED}✗ INVALID${NC}"
                promtool check rules "$rule_file"
            fi
        fi
    done
}

# Function to run performance tests
test_monitoring_performance() {
    echo -e "${YELLOW}Testing monitoring system performance...${NC}"
    
    # Test Prometheus query performance
    echo -n "  Prometheus query performance... "
    start_time=$(date +%s.%N)
    curl -s "$PROMETHEUS_URL/api/v1/query?query=up" >/dev/null
    end_time=$(date +%s.%N)
    duration=$(echo "$end_time - $start_time" | bc)
    
    if (( $(echo "$duration < 1.0" | bc -l) )); then
        echo -e "${GREEN}✓ ${duration}s${NC}"
    else
        echo -e "${YELLOW}⚠ ${duration}s (slow)${NC}"
    fi
    
    # Test AlertManager API performance
    echo -n "  AlertManager API performance... "
    start_time=$(date +%s.%N)
    curl -s "$ALERTMANAGER_URL/api/v1/alerts" >/dev/null
    end_time=$(date +%s.%N)
    duration=$(echo "$end_time - $start_time" | bc)
    
    if (( $(echo "$duration < 1.0" | bc -l) )); then
        echo -e "${GREEN}✓ ${duration}s${NC}"
    else
        echo -e "${YELLOW}⚠ ${duration}s (slow)${NC}"
    fi
}

# Function to generate test metrics
generate_test_metrics() {
    echo -e "${YELLOW}Generating test metrics...${NC}"
    
    # Create temporary metrics file
    cat > /tmp/test_metrics.prom << EOF
# Test metrics for Relife monitoring validation
relife_test_counter 42
relife_test_gauge 85.5
relife_test_histogram_bucket{le="0.1"} 10
relife_test_histogram_bucket{le="0.5"} 25
relife_test_histogram_bucket{le="1.0"} 40
relife_test_histogram_bucket{le="+Inf"} 50
relife_test_histogram_count 50
relife_test_histogram_sum 25.5
EOF
    
    echo "  Test metrics generated at /tmp/test_metrics.prom"
    echo "  Use 'curl -T /tmp/test_metrics.prom http://pushgateway:9091/metrics/job/test' to push"
}

# Main test execution
main() {
    echo -e "${BLUE}Starting comprehensive alert testing...${NC}"
    echo ""
    
    # Check prerequisites
    echo "=== Prerequisites Check ==="
    check_service "Prometheus" "$PROMETHEUS_URL" "/-/healthy" || exit 1
    check_service "AlertManager" "$ALERTMANAGER_URL" "/-/healthy" || exit 1
    check_service "Grafana" "$GRAFANA_URL" "/api/health" || exit 1
    echo ""
    
    # Validate configurations
    echo "=== Configuration Validation ==="
    validate_alert_rules
    echo ""
    
    # Check active alerts
    echo "=== Active Alerts Status ==="
    check_active_alerts
    echo ""
    
    # Test notification channels
    echo "=== Notification Channel Tests ==="
    test_notification_channels
    echo ""
    
    # Performance tests
    echo "=== Performance Tests ==="
    test_monitoring_performance
    echo ""
    
    # Generate test metrics
    echo "=== Test Metrics Generation ==="
    generate_test_metrics
    echo ""
    
    # Test specific alert rules
    echo "=== Alert Rule Testing ==="
    test_alert_rule "Service Up Check" "up"
    test_alert_rule "HTTP Request Rate" "rate(http_requests_total[5m])"
    test_alert_rule "Error Rate" "rate(http_requests_total{status=~\"5..\"}[5m])"
    echo ""
    
    echo -e "${GREEN}=== Alert Testing Complete! ===${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review any failed tests above"
    echo "2. Configure missing notification channels"
    echo "3. Test with real application metrics"
    echo "4. Schedule regular alert testing"
    echo ""
    echo "For ongoing monitoring:"
    echo "  • Run 'relife-monitoring-status' for quick health check"
    echo "  • Check 'journalctl -u prometheus -f' for Prometheus logs"
    echo "  • Check 'journalctl -u alertmanager -f' for AlertManager logs"
}

# Run main function
main "$@"