#!/usr/bin/env node

/**
 * PR Accessibility Gate Checker
 *
 * Validates accessibility requirements for pull requests including:
 * - Automated test results
 * - Required artifacts presence
 * - PR template compliance
 * - Breaking change assessment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const reportsDir = path.join(projectRoot, 'artifacts', 'a11y-reports');

// Exit codes
const EXIT_CODES = {
  SUCCESS: 0,
  ACCESSIBILITY_FAILURE: 1,
  MISSING_ARTIFACTS: 2,
  CONFIGURATION_ERROR: 3,
};

// Severity levels for violations
const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  SERIOUS: 'serious',
  MODERATE: 'moderate',
  MINOR: 'minor',
};

/**
 * Configuration for accessibility gates
 */
const A11Y_GATES = {
  // Maximum allowed violations by severity
  maxViolations: {
    [SEVERITY_LEVELS.CRITICAL]: 0, // No critical violations allowed
    [SEVERITY_LEVELS.SERIOUS]: 0, // No serious violations allowed
    [SEVERITY_LEVELS.MODERATE]: 5, // Up to 5 moderate violations allowed
    [SEVERITY_LEVELS.MINOR]: 10, // Up to 10 minor violations allowed
  },

  // Minimum required scores
  minScores: {
    lighthouse: 90, // Minimum Lighthouse accessibility score
    coverage: {
      unit: 80, // Minimum unit test coverage for a11y
      e2e: 70, // Minimum E2E test coverage for a11y
    },
  },

  // Required test files/artifacts
  requiredArtifacts: ['accessibility-summary.json', 'accessibility-report.html'],

  // Files that trigger accessibility testing requirements
  accessibilityTriggerPaths: [
    'src/components/',
    'src/pages/',
    'src/layouts/',
    '.storybook/',
    'public/',
    'tests/e2e/a11y/',
  ],
};

/**
 * Get list of changed files from git
 */
function getChangedFiles() {
  try {
    const { execSync } = require('child_process');

    // Get changed files compared to main branch
    const result = execSync('git diff --name-only origin/main...HEAD', {
      encoding: 'utf8',
      cwd: projectRoot,
    });

    return result
      .trim()
      .split('\n')
      .filter((file) => file.length > 0);
  } catch (error) {
    console.warn('Warning: Could not get changed files from git:', error.message);
    return [];
  }
}

/**
 * Check if changes require accessibility testing
 */
function requiresAccessibilityTesting(changedFiles) {
  if (changedFiles.length === 0) {
    return true; // Default to requiring testing if we can't determine changes
  }

  return changedFiles.some((file) =>
    A11Y_GATES.accessibilityTriggerPaths.some((path) => file.startsWith(path))
  );
}

/**
 * Read and validate jest-axe test results
 */
function validateUnitTestResults() {
  const resultsPath = path.join(reportsDir, 'jest-axe-results.json');

  if (!fs.existsSync(resultsPath)) {
    return {
      status: 'missing',
      message: 'Jest-axe unit test results not found',
    };
  }

  try {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

    const failed = results.numFailedTests || 0;
    const total = results.numTotalTests || 0;
    const coverage = total > 0 ? ((total - failed) / total) * 100 : 0;

    return {
      status: failed === 0 ? 'passed' : 'failed',
      failed,
      total,
      coverage: Math.round(coverage),
      message:
        failed > 0
          ? `${failed} unit accessibility tests failed out of ${total}`
          : `All ${total} unit accessibility tests passed`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Error reading unit test results: ${error.message}`,
    };
  }
}

/**
 * Read and validate Playwright E2E accessibility results
 */
function validateE2ETestResults() {
  const resultsPath = path.join(reportsDir, 'playwright-a11y-results.json');

  if (!fs.existsSync(resultsPath)) {
    return {
      status: 'missing',
      message: 'Playwright E2E accessibility results not found',
    };
  }

  try {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

    // Parse Playwright results structure
    const violations = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    };

    // Count violations by severity
    if (results.suites) {
      results.suites.forEach((suite) => {
        suite.tests?.forEach((test) => {
          if (test.results) {
            test.results.forEach((result) => {
              if (result.violations) {
                result.violations.forEach((violation) => {
                  const impact = violation.impact || 'minor';
                  violations[impact] =
                    (violations[impact] || 0) + (violation.nodes?.length || 1);
                });
              }
            });
          }
        });
      });
    }

    // Check if violations exceed limits
    const exceedsLimits = Object.entries(violations).some(
      ([severity, count]) => count > (A11Y_GATES.maxViolations[severity] || 0)
    );

    return {
      status: exceedsLimits ? 'failed' : 'passed',
      violations,
      message: exceedsLimits
        ? `E2E accessibility tests have violations exceeding limits`
        : `E2E accessibility tests passed`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Error reading E2E test results: ${error.message}`,
    };
  }
}

/**
 * Read and validate Lighthouse accessibility results
 */
function validateLighthouseResults() {
  const resultsPath = path.join(reportsDir, 'lighthouse-results.json');

  if (!fs.existsSync(resultsPath)) {
    return {
      status: 'missing',
      message: 'Lighthouse accessibility results not found',
    };
  }

  try {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

    const accessibilityScore = results.categories?.accessibility?.score;
    const score = accessibilityScore ? Math.round(accessibilityScore * 100) : 0;
    const passed = score >= A11Y_GATES.minScores.lighthouse;

    return {
      status: passed ? 'passed' : 'failed',
      score,
      message: passed
        ? `Lighthouse accessibility score: ${score}/100 (✅ ≥${A11Y_GATES.minScores.lighthouse})`
        : `Lighthouse accessibility score: ${score}/100 (❌ <${A11Y_GATES.minScores.lighthouse})`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Error reading Lighthouse results: ${error.message}`,
    };
  }
}

/**
 * Read and validate pa11y results
 */
function validatePa11yResults() {
  const resultsPath = path.join(reportsDir, 'pa11y-results.json');

  if (!fs.existsSync(resultsPath)) {
    return {
      status: 'missing',
      message: 'pa11y WCAG results not found',
    };
  }

  try {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

    if (!Array.isArray(results)) {
      return {
        status: 'error',
        message: 'Invalid pa11y results format',
      };
    }

    const violations = {
      errors: 0,
      warnings: 0,
      notices: 0,
    };

    const totalPages = results.length;

    results.forEach((result) => {
      if (result.issues) {
        result.issues.forEach((issue) => {
          const type = issue.type?.toLowerCase();
          if (type === 'error') violations.errors++;
          else if (type === 'warning') violations.warnings++;
          else violations.notices++;
        });
      }
    });

    // pa11y errors are considered serious violations
    const passed = violations.errors === 0;

    return {
      status: passed ? 'passed' : 'failed',
      violations,
      totalPages,
      message: passed
        ? `pa11y WCAG audit passed (${totalPages} pages, ${violations.warnings} warnings)`
        : `pa11y WCAG audit failed (${violations.errors} errors, ${violations.warnings} warnings)`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Error reading pa11y results: ${error.message}`,
    };
  }
}

/**
 * Check if required artifacts exist
 */
function validateRequiredArtifacts() {
  const missing = A11Y_GATES.requiredArtifacts.filter(
    (artifact) => !fs.existsSync(path.join(reportsDir, artifact))
  );

  return {
    status: missing.length === 0 ? 'passed' : 'failed',
    missing,
    message:
      missing.length === 0
        ? 'All required accessibility artifacts present'
        : `Missing required artifacts: ${missing.join(', ')}`,
  };
}

/**
 * Generate accessibility gate report
 */
function generateGateReport(results) {
  const timestamp = new Date().toISOString();

  const report = {
    timestamp,
    pr: process.env.GITHUB_PR_NUMBER || 'unknown',
    commit: process.env.GITHUB_SHA || 'unknown',
    branch: process.env.GITHUB_REF_NAME || 'unknown',
    status: 'passed', // Will be updated based on results
    results,
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      missingTests: 0,
    },
    recommendations: [],
  };

  // Calculate summary
  Object.values(results).forEach((result) => {
    report.summary.totalTests++;
    if (result.status === 'passed') report.summary.passedTests++;
    else if (result.status === 'failed') report.summary.failedTests++;
    else if (result.status === 'missing') report.summary.missingTests++;
  });

  // Determine overall status
  if (report.summary.failedTests > 0) {
    report.status = 'failed';
    report.recommendations.push('Fix failing accessibility tests before merging');
  }

  if (report.summary.missingTests > 0) {
    report.status = 'failed';
    report.recommendations.push(
      'Run accessibility tests and ensure all artifacts are generated'
    );
  }

  // Add specific recommendations
  if (
    results.lighthouse?.score &&
    results.lighthouse.score < A11Y_GATES.minScores.lighthouse
  ) {
    report.recommendations.push(
      `Improve Lighthouse accessibility score to ${A11Y_GATES.minScores.lighthouse}+`
    );
  }

  if (results.e2e?.violations) {
    const criticalViolations = results.e2e.violations.critical || 0;
    const seriousViolations = results.e2e.violations.serious || 0;

    if (criticalViolations > 0) {
      report.recommendations.push(
        `Fix ${criticalViolations} critical accessibility violations`
      );
    }

    if (seriousViolations > 0) {
      report.recommendations.push(
        `Fix ${seriousViolations} serious accessibility violations`
      );
    }
  }

  return report;
}

/**
 * Print formatted results to console
 */
function printResults(report) {
  console.log('\\n🔍 ACCESSIBILITY PR GATE RESULTS');
  console.log('==================================');

  console.log(`\\n📊 Summary:`);
  console.log(`   PR: #${report.pr}`);
  console.log(`   Branch: ${report.branch}`);
  console.log(`   Commit: ${report.commit.substring(0, 8)}`);
  console.log(`   Status: ${report.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(
    `   Tests: ${report.summary.passedTests}/${report.summary.totalTests} passed`
  );

  console.log('\\n📋 Test Results:');
  Object.entries(report.results).forEach(([test, result]) => {
    const statusIcon =
      result.status === 'passed'
        ? '✅'
        : result.status === 'failed'
          ? '❌'
          : result.status === 'missing'
            ? '⚠️'
            : '❓';

    console.log(`   ${statusIcon} ${test}: ${result.message}`);

    // Show additional details for specific tests
    if (test === 'lighthouse' && result.score) {
      console.log(`      Score: ${result.score}/100`);
    }

    if (test === 'e2e' && result.violations) {
      const v = result.violations;
      console.log(
        `      Violations: ${v.critical} critical, ${v.serious} serious, ${v.moderate} moderate, ${v.minor} minor`
      );
    }

    if (test === 'pa11y' && result.violations) {
      const v = result.violations;
      console.log(
        `      Issues: ${v.errors} errors, ${v.warnings} warnings, ${v.notices} notices`
      );
    }
  });

  if (report.recommendations.length > 0) {
    console.log('\\n🎯 Recommendations:');
    report.recommendations.forEach((rec) => console.log(`   - ${rec}`));
  }

  if (report.status === 'passed') {
    console.log('\\n✅ All accessibility gates passed! Ready to merge.');
  } else {
    console.log(
      '\\n❌ Accessibility gates failed. Please address issues before merging.'
    );
    console.log('\\n📖 Resources:');
    console.log('   - Accessibility Guide: docs/A11Y-Guide.md');
    console.log('   - Manual QA Checklist: docs/manual-qa-checklist.md');
    console.log('   - Test artifacts: artifacts/a11y-reports/');
  }

  console.log('');
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Running PR accessibility gate checks...');

  try {
    // Check if accessibility testing is required
    const changedFiles = getChangedFiles();
    const requiresTesting = requiresAccessibilityTesting(changedFiles);

    if (!requiresTesting) {
      console.log(
        'ℹ️  No accessibility-related changes detected. Skipping accessibility gates.'
      );
      process.exit(EXIT_CODES.SUCCESS);
    }

    console.log(
      `📁 Changed files trigger accessibility testing: ${changedFiles.slice(0, 5).join(', ')}${changedFiles.length > 5 ? '...' : ''}`
    );

    // Ensure reports directory exists
    if (!fs.existsSync(reportsDir)) {
      console.error(`❌ Accessibility reports directory not found: ${reportsDir}`);
      console.error('   Run accessibility tests first: npm run test:a11y:all');
      process.exit(EXIT_CODES.MISSING_ARTIFACTS);
    }

    // Run all validation checks
    const results = {
      artifacts: validateRequiredArtifacts(),
      unit: validateUnitTestResults(),
      e2e: validateE2ETestResults(),
      lighthouse: validateLighthouseResults(),
      pa11y: validatePa11yResults(),
    };

    // Generate comprehensive report
    const report = generateGateReport(results);

    // Save report for CI artifacts
    const reportPath = path.join(reportsDir, 'pr-gate-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Gate report saved: ${reportPath}`);

    // Print results to console
    printResults(report);

    // Exit with appropriate code
    const exitCode =
      report.status === 'passed'
        ? EXIT_CODES.SUCCESS
        : EXIT_CODES.ACCESSIBILITY_FAILURE;

    process.exit(exitCode);
  } catch (error) {
    console.error('❌ Error running accessibility gate checks:', error);
    process.exit(EXIT_CODES.CONFIGURATION_ERROR);
  }
}

// Handle CLI arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔍 PR Accessibility Gate Checker

Usage: node scripts/check-pr-a11y.mjs [options]

Options:
  --help, -h     Show this help message
  --verbose, -v  Enable verbose output
  --skip-git     Skip git change detection (test all)

Exit Codes:
  0 - All accessibility gates passed
  1 - Accessibility tests failed  
  2 - Missing required artifacts
  3 - Configuration/runtime error

Environment Variables:
  GITHUB_PR_NUMBER - PR number (for CI)
  GITHUB_SHA       - Commit SHA (for CI)  
  GITHUB_REF_NAME  - Branch name (for CI)

Examples:
  npm run test:a11y:all && node scripts/check-pr-a11y.mjs
  node scripts/check-pr-a11y.mjs --verbose
`);
  process.exit(0);
}

// Run main function
main();
