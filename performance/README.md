# Performance Testing Infrastructure

Comprehensive performance and load testing setup for the Relife alarm app using k6 and Lighthouse
CI.

## Overview

This directory contains performance testing infrastructure designed to validate system performance,
identify bottlenecks, and ensure the Relife alarm app can handle real-world user loads efficiently.

## Test Types

### 1. Baseline Tests

- **Purpose**: Validate basic functionality under minimal load
- **File**: `k6/baseline-smoke-test.js`
- **Duration**: 2 minutes
- **Virtual Users**: 10
- **Use Case**: CI/CD pipeline validation, regression detection

### 2. Validation Tests

- **Purpose**: Verify k6 infrastructure is working correctly
- **File**: `k6/validation-test.js`
- **Duration**: 40 seconds
- **Virtual Users**: 5
- **Use Case**: Testing setup validation, troubleshooting

### 3. Load Tests

- **Purpose**: Test realistic user load patterns and alarm lifecycle
- **File**: `k6/alarm-lifecycle-load-test.js`
- **Duration**: 14 minutes (3 scenarios)
- **Virtual Users**: Up to 200 (load), 500 (stress), 100 (soak)
- **Use Case**: Normal operations validation, capacity planning

### 4. Stress Tests

- **Purpose**: Find breaking points and system limits
- **File**: `k6/critical-endpoints-stress-test.js`
- **Duration**: 20 minutes (3 scenarios)
- **Virtual Users**: Up to 1000 (breaking point), 2000 (spike)
- **Use Case**: Disaster recovery planning, infrastructure sizing

### 5. Soak/Endurance Tests

- **Purpose**: Long-term stability and memory leak detection
- **File**: `k6/soak-endurance-test.js`
- **Duration**: 30 minutes
- **Virtual Users**: 100 (sustained), up to 180 (periodic)
- **Use Case**: Production readiness, long-term reliability

### 6. Frontend Performance Tests

- **Purpose**: Web performance auditing and optimization
- **Tool**: Lighthouse CI
- **Config**: `lighthouserc.perf.js`
- **Metrics**: FCP, LCP, CLS, TBT, Performance Score
- **Use Case**: Frontend optimization, Core Web Vitals compliance

## Quick Start

### Prerequisites

- Docker installed and running
- Node.js and npm
- Development server running (for full tests)

### Running Tests

```bash
# Quick validation (no servers required)
npm run test:perf:validation

# Baseline smoke test
npm run test:perf:baseline

# Full load testing suite
npm run test:perf:load

# Stress testing
npm run test:perf:stress

# Long-term endurance testing
npm run test:perf:soak

# Frontend performance audit
npm run test:perf:lighthouse:full

# Complete performance test suite
npm run test:perf:full-suite

# CI-friendly test suite
npm run test:perf:ci

# Generate performance report
npm run test:perf:report
```

## Test Scenarios

### Alarm Lifecycle Test (`alarm-lifecycle-load-test.js`)

Simulates complete user workflows:

1. **User Authentication** - Token validation and session management
2. **Alarm Creation** - Creating alarms with various settings
3. **Premium Features** - Subscription validation and feature access
4. **Alarm Triggering** - Background alarm activation testing
5. **Alarm Dismissal** - User interaction with active alarms
6. **Analytics Logging** - Usage data collection and reporting

**Scenarios:**

- **Load Test**: 50 → 200 → 200 → 0 users over 14 minutes
- **Stress Test**: 200 → 500 → 500 → 0 users over 10 minutes
- **Soak Test**: 100 constant users for 10 minutes

**Performance Targets:**

- 95th percentile response time < 300ms
- Error rate < 1% (load), < 2% (stress)
- Request rate > 10 req/s

### Critical Endpoints Stress Test (`critical-endpoints-stress-test.js`)

Focused testing of system-critical endpoints:

1. **Breaking Point Test**: Gradual load increase to find system limits
2. **Spike Test**: Sudden traffic bursts to test elasticity
3. **Critical Path Test**: High-frequency testing of essential functions

**Key Endpoints:**

- `/auth/login` - Authentication endpoint
- `/alarms` (GET/POST) - Alarm management
- `/alarms/*/trigger` - Alarm activation
- `/users/*/premium` - Subscription validation
- `/analytics/events` - Usage tracking

**Performance Targets:**

- Median response time < 200ms
- 95th percentile < 1000ms under stress
- Error rate < 5% even at breaking point

### Soak/Endurance Test (`soak-endurance-test.js`)

Long-term stability validation:

1. **Endurance Test**: 100 users for 30 minutes constant load
2. **Background Activity**: Lightweight system operations simulation
3. **Periodic Load**: Rush hour pattern simulation

**Stability Indicators:**

- Response time consistency over time
- Memory usage patterns (no degradation)
- Error rate stability
- System resource utilization

## Performance Thresholds

### Response Time Targets

- **API Endpoints**: < 500ms (95th percentile)
- **Alarm Triggers**: < 150ms (95th percentile)
- **Database Queries**: < 100ms (average)
- **Authentication**: < 500ms (95th percentile)

### Error Rate Limits

- **Production**: < 0.1% error rate
- **Load Testing**: < 1% error rate
- **Stress Testing**: < 5% error rate

### Frontend Performance Budgets

- **Performance Score**: 85+
- **First Contentful Paint**: < 2.0s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Total Blocking Time**: < 300ms

## Configuration

### Environment Variables

```bash
# k6 Test Configuration
BASE_URL=http://localhost:3000        # Frontend URL
API_URL=http://localhost:3001/api     # Backend API URL
AUTH_TOKEN=your-test-token           # Authentication token
STRESS_LEVEL=high                    # low, medium, high, extreme
SOAK_DURATION=30                     # Soak test duration in minutes

# Lighthouse Configuration
LHCI_GITHUB_APP_TOKEN=your-token     # GitHub integration token
LHCI_SERVER_URL=your-lhci-server     # LHCI server URL
```

### Test Data Configuration

Tests use realistic data patterns:

- **Alarm Times**: Common wake-up and reminder times
- **User Patterns**: Morning users, office workers, night owls, shift workers
- **Labels**: Realistic alarm descriptions
- **Behaviors**: Actual user interaction patterns

## Reports and Artifacts

### Generated Reports

- `performance/reports/baseline-results.json` - k6 baseline results
- `performance/reports/alarm-lifecycle-report.html` - Load test results
- `performance/reports/critical-endpoints-report.html` - Stress test results
- `performance/reports/soak-endurance-report.html` - Endurance test results
- `artifacts/perf-baseline-report.json` - Combined performance summary
- `artifacts/performance-test-report.md` - Human-readable report
- `.lighthouseci/` - Lighthouse CI detailed reports

### Report Contents

- **Performance Metrics**: Response times, throughput, error rates
- **System Metrics**: CPU, memory, network utilization
- **User Experience**: Page load times, interaction delays
- **Trends**: Performance changes over time
- **Recommendations**: Optimization suggestions

## CI/CD Integration

### GitHub Actions Configuration

Add to your workflow:

```yaml
- name: Performance Testing
  run: |
    npm run test:perf:ci

- name: Upload Performance Reports
  uses: actions/upload-artifact@v3
  with:
    name: performance-reports
    path: |
      performance/reports/
      artifacts/performance-test-report.md
```

### Quality Gates

Performance tests can block deployments:

- Baseline tests must pass for all commits
- Load tests required for staging deployments
- Stress tests required for production releases
- Performance regression detection (>10% degradation fails build)

## Monitoring Integration

### Existing Infrastructure

- **Grafana**: Performance dashboard visualization
- **Prometheus**: Metrics collection and alerting
- **DataDog**: External monitoring and APM
- **New Relic**: Application performance monitoring

### Performance Alerts

- API response time > 1s for 5 minutes
- Error rate > 5% for 2 minutes
- Frontend performance score < 80
- Memory usage > 90% for 10 minutes

## Troubleshooting

### Common Issues

**k6 Tests Failing:**

```bash
# Check Docker is running
docker --version

# Verify image can be pulled
docker pull grafana/k6

# Check test syntax
docker run --rm -v $(pwd):/workspace grafana/k6 run --check /workspace/performance/k6/validation-test.js
```

**Lighthouse Tests Failing:**

```bash
# Check development server is running
curl http://localhost:4173

# Run Lighthouse manually
npx lighthouse http://localhost:4173 --output=json

# Check LHCI configuration
npx lhci autorun --help
```

**Performance Reports Empty:**

```bash
# Verify reports directory exists
ls -la performance/reports/

# Check npm script execution
npm run test:perf:baseline:ci
npm run test:perf:report
```

### Performance Optimization Tips

1. **API Optimization**:
   - Implement response caching
   - Optimize database queries
   - Use connection pooling
   - Enable request compression

2. **Frontend Optimization**:
   - Minimize bundle size
   - Use lazy loading
   - Optimize images
   - Implement service workers

3. **Infrastructure**:
   - Use CDN for static assets
   - Implement load balancing
   - Scale horizontally
   - Monitor resource usage

## Development Workflow

### Before Committing Code

```bash
# Run baseline performance test
npm run test:perf:baseline

# Generate performance report
npm run test:perf:report
```

### Before Production Deployment

```bash
# Run comprehensive performance suite
npm run test:perf:full-suite

# Review performance report
cat artifacts/performance-test-report.md
```

### Performance Regression Testing

```bash
# Compare against baseline
npm run test:perf:ci

# Check for performance degradation
npm run test:perf:report
```

## Best Practices

1. **Test Early and Often**: Run baseline tests on every commit
2. **Use Realistic Data**: Test with production-like datasets
3. **Monitor Trends**: Track performance changes over time
4. **Set Realistic Thresholds**: Balance performance goals with user needs
5. **Test Real Scenarios**: Focus on actual user workflows
6. **Document Issues**: Track performance problems and solutions
7. **Regular Reviews**: Schedule periodic performance assessments

---

For more information, see the [Performance Testing Matrix](../artifacts/integration-test-matrix.md)
and generated reports in the `artifacts/` directory.
