#!/usr/bin/env node

/**
 * Accessibility Report Generator
 * 
 * Generates comprehensive accessibility test reports by aggregating results
 * from jest-axe, Playwright, Lighthouse, and pa11y test runs.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const reportsDir = path.join(projectRoot, 'artifacts', 'a11y-reports');

// Ensure reports directory exists
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

/**
 * Read and parse JSON file safely
 */
function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error.message);
  }
  return null;
}

/**
 * Generate summary statistics from various test results
 */
function generateSummary() {
  const summary = {
    timestamp: new Date().toISOString(),
    testSuites: {
      unit: { status: 'not_run', violations: 0, components: 0 },
      e2e: { status: 'not_run', violations: 0, flows: 0 },
      lighthouse: { status: 'not_run', score: null, audits: 0 },
      pa11y: { status: 'not_run', violations: 0, pages: 0 }
    },
    coverage: {
      components: 0,
      criticalFlows: 0,
      pages: 0
    },
    violations: {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0
    }
  };

  // Check for jest-axe unit test results
  const unitResultsPath = path.join(reportsDir, 'jest-axe-results.json');
  const unitResults = readJsonFile(unitResultsPath);
  if (unitResults) {
    summary.testSuites.unit.status = unitResults.success ? 'passed' : 'failed';
    summary.testSuites.unit.violations = unitResults.numFailedTests || 0;
    summary.testSuites.unit.components = unitResults.numTotalTests || 0;
  }

  // Check for Playwright accessibility results
  const e2eResultsPath = path.join(reportsDir, 'playwright-a11y-results.json');
  const e2eResults = readJsonFile(e2eResultsPath);
  if (e2eResults) {
    summary.testSuites.e2e.status = e2eResults.suites?.every(suite => 
      suite.tests?.every(test => test.status === 'passed')
    ) ? 'passed' : 'failed';
    
    // Count violations from Playwright axe results
    e2eResults.suites?.forEach(suite => {
      suite.tests?.forEach(test => {
        if (test.results) {
          test.results.forEach(result => {
            if (result.violations) {
              result.violations.forEach(violation => {
                const impact = violation.impact || 'minor';
                summary.violations[impact] = (summary.violations[impact] || 0) + violation.nodes?.length || 1;
              });
            }
          });
        }
      });
    });
  }

  // Check for Lighthouse results
  const lighthouseResultsPath = path.join(reportsDir, 'lighthouse-results.json');
  const lighthouseResults = readJsonFile(lighthouseResultsPath);
  if (lighthouseResults) {
    const accessibilityScore = lighthouseResults.categories?.accessibility?.score;
    summary.testSuites.lighthouse.status = accessibilityScore >= 0.9 ? 'passed' : 'failed';
    summary.testSuites.lighthouse.score = Math.round(accessibilityScore * 100);
    summary.testSuites.lighthouse.audits = Object.keys(lighthouseResults.audits || {}).length;
  }

  // Check for pa11y results
  const pa11yResultsPath = path.join(reportsDir, 'pa11y-results.json');
  const pa11yResults = readJsonFile(pa11yResultsPath);
  if (pa11yResults && Array.isArray(pa11yResults)) {
    const hasViolations = pa11yResults.some(result => result.issues && result.issues.length > 0);
    summary.testSuites.pa11y.status = hasViolations ? 'failed' : 'passed';
    summary.testSuites.pa11y.pages = pa11yResults.length;
    
    pa11yResults.forEach(result => {
      if (result.issues) {
        result.issues.forEach(issue => {
          const type = issue.type?.toLowerCase() || 'minor';
          if (type === 'error') {
            summary.violations.serious = (summary.violations.serious || 0) + 1;
          } else if (type === 'warning') {
            summary.violations.moderate = (summary.violations.moderate || 0) + 1;
          } else {
            summary.violations.minor = (summary.violations.minor || 0) + 1;
          }
        });
      }
    });
  }

  return summary;
}

/**
 * Generate detailed HTML report
 */
function generateHtmlReport(summary) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Test Report - Relife Alarm App</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header h1 { color: #2563eb; margin-bottom: 10px; }
        .header .meta { color: #666; font-size: 14px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card h2 { margin-bottom: 15px; color: #1f2937; font-size: 18px; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status.passed { background: #dcfce7; color: #166534; }
        .status.failed { background: #fef2f2; color: #dc2626; }
        .status.not_run { background: #f3f4f6; color: #6b7280; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .metric:last-child { border-bottom: none; }
        .metric-value { font-weight: 600; color: #1f2937; }
        .violations { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .violation-card { text-align: center; padding: 15px; border-radius: 6px; }
        .violation-card.critical { background: #fef2f2; border: 1px solid #fecaca; }
        .violation-card.serious { background: #fef3c7; border: 1px solid #fed7aa; }
        .violation-card.moderate { background: #eff6ff; border: 1px solid #dbeafe; }
        .violation-card.minor { background: #f0fdf4; border: 1px solid #bbf7d0; }
        .violation-count { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .violation-label { font-size: 12px; text-transform: uppercase; font-weight: 600; opacity: 0.8; }
        .score { font-size: 36px; font-weight: bold; text-align: center; }
        .score.good { color: #059669; }
        .score.warning { color: #d97706; }
        .score.error { color: #dc2626; }
        .recommendations { background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .recommendations h3 { color: #374151; margin-bottom: 15px; }
        .recommendations ul { padding-left: 20px; }
        .recommendations li { margin-bottom: 8px; color: #4b5563; }
        .footer { text-align: center; margin-top: 40px; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Accessibility Test Report</h1>
            <div class="meta">
                <strong>Relife Alarm App</strong> • 
                Generated: ${new Date(summary.timestamp).toLocaleString()} •
                WCAG 2.1 AA Compliance
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h2>Test Suites Overview</h2>
                <div class="metric">
                    <span>Unit Tests (jest-axe)</span>
                    <span class="status ${summary.testSuites.unit.status}">${summary.testSuites.unit.status.replace('_', ' ')}</span>
                </div>
                <div class="metric">
                    <span>E2E Tests (Playwright + axe)</span>
                    <span class="status ${summary.testSuites.e2e.status}">${summary.testSuites.e2e.status.replace('_', ' ')}</span>
                </div>
                <div class="metric">
                    <span>Lighthouse Audits</span>
                    <span class="status ${summary.testSuites.lighthouse.status}">${summary.testSuites.lighthouse.status.replace('_', ' ')}</span>
                </div>
                <div class="metric">
                    <span>pa11y WCAG Audits</span>
                    <span class="status ${summary.testSuites.pa11y.status}">${summary.testSuites.pa11y.status.replace('_', ' ')}</span>
                </div>
            </div>

            <div class="card">
                <h2>Lighthouse Score</h2>
                <div class="score ${summary.testSuites.lighthouse.score >= 90 ? 'good' : summary.testSuites.lighthouse.score >= 75 ? 'warning' : 'error'}">
                    ${summary.testSuites.lighthouse.score || 'N/A'}${summary.testSuites.lighthouse.score ? '/100' : ''}
                </div>
                <div style="text-align: center; margin-top: 10px; color: #6b7280;">
                    Accessibility Score
                </div>
            </div>

            <div class="card">
                <h2>Test Coverage</h2>
                <div class="metric">
                    <span>Components Tested</span>
                    <span class="metric-value">${summary.testSuites.unit.components}</span>
                </div>
                <div class="metric">
                    <span>Critical Flows</span>
                    <span class="metric-value">${summary.testSuites.e2e.flows}</span>
                </div>
                <div class="metric">
                    <span>Pages Audited</span>
                    <span class="metric-value">${summary.testSuites.pa11y.pages}</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Accessibility Violations</h2>
            <div class="violations">
                <div class="violation-card critical">
                    <div class="violation-count">${summary.violations.critical}</div>
                    <div class="violation-label">Critical</div>
                </div>
                <div class="violation-card serious">
                    <div class="violation-count">${summary.violations.serious}</div>
                    <div class="violation-label">Serious</div>
                </div>
                <div class="violation-card moderate">
                    <div class="violation-count">${summary.violations.moderate}</div>
                    <div class="violation-label">Moderate</div>
                </div>
                <div class="violation-card minor">
                    <div class="violation-count">${summary.violations.minor}</div>
                    <div class="violation-label">Minor</div>
                </div>
            </div>
        </div>

        <div class="recommendations">
            <h3>📋 Recommendations</h3>
            <ul>
                ${summary.violations.critical > 0 ? '<li><strong>Critical:</strong> Address critical violations immediately - these severely impact accessibility</li>' : ''}
                ${summary.violations.serious > 0 ? '<li><strong>Serious:</strong> Fix serious violations before deployment - these significantly affect users</li>' : ''}
                ${summary.testSuites.lighthouse.score < 90 ? '<li><strong>Lighthouse:</strong> Improve accessibility score to reach 90+ target</li>' : ''}
                ${summary.testSuites.unit.status === 'failed' ? '<li><strong>Unit Tests:</strong> Review and fix failing component accessibility tests</li>' : ''}
                ${summary.testSuites.e2e.status === 'failed' ? '<li><strong>E2E Tests:</strong> Address accessibility issues in critical user flows</li>' : ''}
                <li><strong>Manual Testing:</strong> Complement automated tests with keyboard navigation and screen reader testing</li>
                <li><strong>Documentation:</strong> Review the <a href="../docs/A11Y-Guide.md">Accessibility Guide</a> for remediation steps</li>
            </ul>
        </div>

        <div class="footer">
            <p>Generated by Relife Accessibility Testing Suite • WCAG 2.1 AA • jest-axe • Playwright • Lighthouse • pa11y</p>
        </div>
    </div>
</body>
</html>`;

  return html;
}

/**
 * Generate markdown report for GitHub/docs
 */
function generateMarkdownReport(summary) {
  const totalViolations = Object.values(summary.violations).reduce((sum, count) => sum + count, 0);
  
  const markdown = `# Accessibility Test Report 🔍

**Generated:** ${new Date(summary.timestamp).toLocaleString()}  
**Standard:** WCAG 2.1 AA Compliance  
**Total Violations:** ${totalViolations}

## Summary

| Test Suite | Status | Score/Coverage |
|------------|--------|----------------|
| Unit Tests (jest-axe) | ${getStatusEmoji(summary.testSuites.unit.status)} ${summary.testSuites.unit.status} | ${summary.testSuites.unit.components} components |
| E2E Tests (Playwright + axe) | ${getStatusEmoji(summary.testSuites.e2e.status)} ${summary.testSuites.e2e.status} | ${summary.testSuites.e2e.flows} critical flows |
| Lighthouse Audits | ${getStatusEmoji(summary.testSuites.lighthouse.status)} ${summary.testSuites.lighthouse.status} | ${summary.testSuites.lighthouse.score || 'N/A'}/100 |
| pa11y WCAG Audits | ${getStatusEmoji(summary.testSuites.pa11y.status)} ${summary.testSuites.pa11y.status} | ${summary.testSuites.pa11y.pages} pages |

## Violations Breakdown

| Severity | Count | Impact |
|----------|-------|--------|
| 🔴 Critical | ${summary.violations.critical} | Severely impacts accessibility |
| 🟠 Serious | ${summary.violations.serious} | Significantly affects users |
| 🟡 Moderate | ${summary.violations.moderate} | Noticeable accessibility barriers |
| 🟢 Minor | ${summary.violations.minor} | Minor accessibility improvements |

## Recommendations

${generateRecommendations(summary)}

## Test Coverage Details

- **Components:** ${summary.testSuites.unit.components} React components tested with jest-axe
- **User Flows:** ${summary.testSuites.e2e.flows} critical user journeys validated  
- **Pages:** ${summary.testSuites.pa11y.pages} pages audited for WCAG compliance
- **Lighthouse Score:** ${summary.testSuites.lighthouse.score || 'Not available'}/100

## Resources

- 📖 [Accessibility Testing Guide](../docs/A11Y-Guide.md)
- ✅ [Manual QA Checklist](../docs/manual-qa-checklist.md)
- 🌐 [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- 🔧 [Accessibility Remediation Examples](../docs/a11y-examples.md)

---
*Report generated by Relife Accessibility Testing Suite*`;

  return markdown;
}

function getStatusEmoji(status) {
  switch(status) {
    case 'passed': return '✅';
    case 'failed': return '❌';
    case 'not_run': return '⏸️';
    default: return '❓';
  }
}

function generateRecommendations(summary) {
  const recommendations = [];
  
  if (summary.violations.critical > 0) {
    recommendations.push('🔴 **Immediate Action Required:** Fix critical violations that severely impact accessibility');
  }
  
  if (summary.violations.serious > 0) {
    recommendations.push('🟠 **High Priority:** Address serious violations before deployment');
  }
  
  if (summary.testSuites.lighthouse.score && summary.testSuites.lighthouse.score < 90) {
    recommendations.push('📊 **Lighthouse:** Improve accessibility score to reach 90+ target');
  }
  
  if (summary.testSuites.unit.status === 'failed') {
    recommendations.push('🧪 **Unit Tests:** Review and fix failing component accessibility tests');
  }
  
  if (summary.testSuites.e2e.status === 'failed') {
    recommendations.push('🔄 **E2E Tests:** Address accessibility issues in critical user flows');
  }
  
  recommendations.push('⌨️ **Manual Testing:** Complement automated tests with keyboard and screen reader testing');
  
  if (recommendations.length === 1) {
    recommendations.unshift('🎉 **Great Work!** Most accessibility tests are passing. Continue with manual validation.');
  }
  
  return recommendations.map(rec => `- ${rec}`).join('\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Generating accessibility test report...');
  
  try {
    // Generate summary from available test results
    const summary = generateSummary();
    
    // Save JSON summary
    const summaryPath = path.join(reportsDir, 'accessibility-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`✅ Summary saved: ${summaryPath}`);
    
    // Generate HTML report
    const htmlReport = generateHtmlReport(summary);
    const htmlPath = path.join(reportsDir, 'accessibility-report.html');
    fs.writeFileSync(htmlPath, htmlReport);
    console.log(`✅ HTML report saved: ${htmlPath}`);
    
    // Generate Markdown report
    const markdownReport = generateMarkdownReport(summary);
    const markdownPath = path.join(reportsDir, 'accessibility-report.md');
    fs.writeFileSync(markdownPath, markdownReport);
    console.log(`✅ Markdown report saved: ${markdownPath}`);
    
    // Print summary to console
    console.log('\n📊 ACCESSIBILITY TEST SUMMARY');
    console.log('================================');
    console.log(`Unit Tests: ${summary.testSuites.unit.status} (${summary.testSuites.unit.components} components)`);
    console.log(`E2E Tests: ${summary.testSuites.e2e.status} (${summary.testSuites.e2e.flows} flows)`);
    console.log(`Lighthouse: ${summary.testSuites.lighthouse.status} (${summary.testSuites.lighthouse.score || 'N/A'}/100)`);
    console.log(`pa11y: ${summary.testSuites.pa11y.status} (${summary.testSuites.pa11y.pages} pages)`);
    console.log(`\nViolations: ${summary.violations.critical} critical, ${summary.violations.serious} serious, ${summary.violations.moderate} moderate, ${summary.violations.minor} minor`);
    
    // Exit with error code if critical issues found
    if (summary.violations.critical > 0 || summary.testSuites.unit.status === 'failed') {
      console.log('\n❌ Critical accessibility issues detected!');
      process.exit(1);
    }
    
    console.log('\n✅ Accessibility report generation complete!');
    
  } catch (error) {
    console.error('❌ Error generating accessibility report:', error);
    process.exit(1);
  }
}

// Run the script
main();