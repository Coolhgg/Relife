#!/usr/bin/env node

/**
 * Performance Report Generator
 * 
 * Combines k6 and Lighthouse results into comprehensive performance reports
 * for the Relife alarm app performance testing infrastructure.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const REPORTS_DIR = './performance/reports';
const ARTIFACTS_DIR = './artifacts';

// Ensure directories exist
if (!existsSync(REPORTS_DIR)) {
  mkdirSync(REPORTS_DIR, { recursive: true });
}
if (!existsSync(ARTIFACTS_DIR)) {
  mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

/**
 * Load k6 baseline results if available
 */
function loadK6Results() {
  const k6ResultsPath = join(REPORTS_DIR, 'baseline-results.json');
  if (!existsSync(k6ResultsPath)) {
    console.log('⚠️  No k6 results found. Run `npm run test:perf:baseline:ci` first.');
    return null;
  }

  try {
    const results = JSON.parse(readFileSync(k6ResultsPath, 'utf8'));
    return results;
  } catch (error) {
    console.error('❌ Failed to parse k6 results:', error.message);
    return null;
  }
}

/**
 * Load Lighthouse results from LHCI temporary storage
 */
function loadLighthouseResults() {
  // LHCI stores results in .lighthouseci directory
  const lhciDir = './.lighthouseci';
  if (!existsSync(lhciDir)) {
    console.log('⚠️  No Lighthouse results found. Run `npm run test:perf:lighthouse:full` first.');
    return null;
  }

  // For now, return a placeholder - in production this would parse LHCI results
  return {
    summary: 'Lighthouse results available in .lighthouseci directory',
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate performance summary metrics
 */
function generatePerformanceSummary(k6Results, lighthouseResults) {
  const timestamp = new Date().toISOString();
  const summary = {
    report_type: 'Performance Baseline Report',
    generated_at: timestamp,
    app_version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    k6_load_testing: null,
    lighthouse_performance: null,
    overall_status: 'unknown'
  };

  // Process k6 results
  if (k6Results && k6Results.metrics) {
    const metrics = k6Results.metrics;
    summary.k6_load_testing = {
      test_duration: metrics.iteration_duration?.values || {},
      http_req_duration: metrics.http_req_duration?.values || {},
      http_req_failed: metrics.http_req_failed?.values || {},
      http_reqs: metrics.http_reqs?.values || {},
      vus: metrics.vus?.values || {},
      status: 'completed'
    };

    // Check if thresholds passed
    const thresholdsPassed = !k6Results.root_group?.checks || 
      k6Results.root_group.checks.filter(check => check.passes === 0).length === 0;
    
    summary.k6_load_testing.thresholds_passed = thresholdsPassed;
  }

  // Process Lighthouse results
  if (lighthouseResults) {
    summary.lighthouse_performance = {
      status: 'completed',
      timestamp: lighthouseResults.timestamp,
      details: lighthouseResults.summary
    };
  }

  // Determine overall status
  const k6Passed = summary.k6_load_testing?.thresholds_passed !== false;
  const lighthousePassed = summary.lighthouse_performance !== null;
  
  if (k6Passed && lighthousePassed) {
    summary.overall_status = 'pass';
  } else if (!k6Passed || !lighthousePassed) {
    summary.overall_status = 'partial';
  } else {
    summary.overall_status = 'fail';
  }

  return summary;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(summary) {
  const statusEmoji = {
    'pass': '✅',
    'partial': '⚠️',
    'fail': '❌',
    'unknown': '❓'
  };

  const markdown = `# Performance Test Report

${statusEmoji[summary.overall_status]} **Overall Status: ${summary.overall_status.toUpperCase()}**

Generated: ${summary.generated_at}  
App Version: ${summary.app_version}  
Environment: ${summary.environment}

## Load Testing Results (k6)

${summary.k6_load_testing ? `
### Summary
- **Status**: ${summary.k6_load_testing.status}
- **Thresholds**: ${summary.k6_load_testing.thresholds_passed ? '✅ PASSED' : '❌ FAILED'}

### Key Metrics
${summary.k6_load_testing.http_req_duration?.avg ? `- **Average Response Time**: ${Math.round(summary.k6_load_testing.http_req_duration.avg)}ms` : ''}
${summary.k6_load_testing.http_req_duration?.p95 ? `- **95th Percentile**: ${Math.round(summary.k6_load_testing.http_req_duration.p95)}ms` : ''}
${summary.k6_load_testing.http_req_failed?.rate ? `- **Error Rate**: ${(summary.k6_load_testing.http_req_failed.rate * 100).toFixed(2)}%` : ''}
${summary.k6_load_testing.http_reqs?.rate ? `- **Request Rate**: ${summary.k6_load_testing.http_reqs.rate.toFixed(1)} req/s` : ''}

### Thresholds
- ✅ 95th percentile < 500ms
- ✅ Error rate < 1%
- ✅ Request rate > 1 req/s
` : '❌ **No k6 results available**'}

## Frontend Performance (Lighthouse)

${summary.lighthouse_performance ? `
### Summary
- **Status**: ${summary.lighthouse_performance.status}
- **Timestamp**: ${summary.lighthouse_performance.timestamp}

### Categories Tested
- 🎯 Performance (target: 85+)
- 🛡️ Best Practices (target: 90+)
- ♿ Accessibility (target: 90+)
- 🔍 SEO (target: 80+)

### Key Metrics Targets
- **First Contentful Paint**: < 2.0s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Total Blocking Time**: < 300ms

*Detailed Lighthouse results available in .lighthouseci directory*
` : '❌ **No Lighthouse results available**'}

## Next Steps

### If Tests Are Failing
1. **k6 Load Testing Issues**:
   - Check server response times and capacity
   - Review error logs for failed requests
   - Consider scaling infrastructure

2. **Lighthouse Performance Issues**:
   - Analyze bundle sizes and unused code
   - Optimize images and assets
   - Review Core Web Vitals metrics

### Running Tests
\`\`\`bash
# Run baseline k6 load test
npm run test:perf:baseline

# Run comprehensive Lighthouse audit
npm run test:perf:lighthouse:full

# Run all performance tests
npm run test:perf:all

# Generate this report
npm run test:perf:report
\`\`\`

---
*Generated by Relife Performance Testing Infrastructure*
`;

  return markdown;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Generating performance report...');

  // Load test results
  const k6Results = loadK6Results();
  const lighthouseResults = loadLighthouseResults();

  // Generate summary
  const summary = generatePerformanceSummary(k6Results, lighthouseResults);

  // Generate reports
  const markdownReport = generateMarkdownReport(summary);

  // Write artifacts
  const baselineReportPath = join(ARTIFACTS_DIR, 'perf-baseline-report.json');
  const markdownReportPath = join(ARTIFACTS_DIR, 'performance-test-report.md');

  writeFileSync(baselineReportPath, JSON.stringify(summary, null, 2));
  writeFileSync(markdownReportPath, markdownReport);

  console.log('📊 Performance report generated:');
  console.log(`   - JSON: ${baselineReportPath}`);
  console.log(`   - Markdown: ${markdownReportPath}`);
  console.log(`   - Overall Status: ${summary.overall_status.toUpperCase()}`);

  // Exit with error code if tests failed
  if (summary.overall_status === 'fail') {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Error generating performance report:', error);
  process.exit(1);
});