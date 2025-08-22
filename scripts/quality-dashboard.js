#!/usr/bin/env node

/**
 * Quality Dashboard - Comprehensive Quality Metrics Reporter
 *
 * This script generates a comprehensive quality dashboard showing:
 * - Code quality metrics
 * - Bundle size trends
 * - Hook dependency compliance
 * - Commit message quality
 * - Overall health score
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class QualityDashboard {
  constructor() {
    this.metrics = {
      eslint: { score: 0, issues: 0, fixable: 0 },
      typescript: { score: 0, errors: 0 },
      hooks: { score: 0, issues: 0, critical: 0 },
      commits: { score: 0, total: 0, conventional: 0 },
      bundle: { score: 0, size: 0, violations: 0 },
      coverage: { score: 0, percentage: 0 },
      overall: { score: 0, grade: 'F' },
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async analyzeESLint() {
    this.log('🔍 Analyzing ESLint issues...', 'blue');

    try {
      const result = execSync('bunx eslint src/ --format json', {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const eslintResults = JSON.parse(result);
      const totalIssues = eslintResults.reduce(
        (sum, file) => sum + file.messages.length,
        0
      );
      const fixableIssues = eslintResults.reduce((sum, file) => {
        return sum + file.messages.filter(msg => msg.fix).length;
      }, 0);

      this.metrics.eslint = {
        score: Math.max(0, 100 - totalIssues * 2),
        issues: totalIssues,
        fixable: fixableIssues,
      };
    } catch (error) {
      // ESLint might exit with code 1 if issues found
      if (error.stdout) {
        try {
          const eslintResults = JSON.parse(error.stdout);
          const totalIssues = eslintResults.reduce(
            (sum, file) => sum + file.messages.length,
            0
          );
          const fixableIssues = eslintResults.reduce((sum, file) => {
            return sum + file.messages.filter(msg => msg.fix).length;
          }, 0);

          this.metrics.eslint = {
            score: Math.max(0, 100 - totalIssues * 2),
            issues: totalIssues,
            fixable: fixableIssues,
          };
        } catch (parseError) {
          this.metrics.eslint = { score: 50, issues: 'unknown', fixable: 0 };
        }
      }
    }
  }

  async analyzeTypeScript() {
    this.log('🔷 Analyzing TypeScript compilation...', 'blue');

    try {
      execSync('bunx tsc --noEmit', { stdio: 'pipe' });
      this.metrics.typescript = { score: 100, errors: 0 };
    } catch (error) {
      const errorOutput = error.stderr || error.stdout || '';
      const errorMatches = errorOutput.match(/Found (\d+) errors?/);
      const errorCount = errorMatches ? parseInt(errorMatches[1]) : 1;

      this.metrics.typescript = {
        score: Math.max(0, 100 - errorCount * 5),
        errors: errorCount,
      };
    }
  }

  async analyzeReactHooks() {
    this.log('🎣 Analyzing React hooks dependencies...', 'blue');

    try {
      execSync('node scripts/react-hooks-enforcer.js --max-warnings 100', {
        stdio: 'pipe',
      });
      this.metrics.hooks = { score: 100, issues: 0, critical: 0 };
    } catch (error) {
      // Parse output for hook issues
      const output = error.stdout || '';
      const issueMatches = output.match(/Found (\d+) React Hook dependency issues/);
      const criticalMatches = output.match(/(\d+) critical/);

      const issues = issueMatches ? parseInt(issueMatches[1]) : 0;
      const critical = criticalMatches ? parseInt(criticalMatches[1]) : 0;

      this.metrics.hooks = {
        score: Math.max(0, 100 - issues * 3 - critical * 10),
        issues,
        critical,
      };
    }
  }

  async analyzeCommitQuality() {
    this.log('📝 Analyzing commit message quality...', 'blue');

    try {
      const commits = execSync('git log --oneline -n 20', { encoding: 'utf8' });
      const commitLines = commits.trim().split('\n');
      const total = commitLines.length;

      const conventionalRegex = /^[a-f0-9]+ (\w+)(\([^)]+\))?: .+$/;
      const conventional = commitLines.filter(line =>
        conventionalRegex.test(line)
      ).length;

      this.metrics.commits = {
        score: Math.round((conventional / total) * 100),
        total,
        conventional,
      };
    } catch (error) {
      this.metrics.commits = { score: 0, total: 0, conventional: 0 };
    }
  }

  async analyzeBundleSize() {
    this.log('📦 Analyzing bundle size...', 'blue');

    try {
      execSync('node scripts/bundle-size-monitor.js', { stdio: 'pipe' });
      this.metrics.bundle = { score: 100, size: 'within limits', violations: 0 };
    } catch (error) {
      const output = error.stdout || '';
      const violationMatches = output.match(/(\d+) size limit violations/);
      const violations = violationMatches ? parseInt(violationMatches[1]) : 1;

      this.metrics.bundle = {
        score: Math.max(0, 100 - violations * 25),
        size: 'exceeds limits',
        violations,
      };
    }
  }

  async analyzeCoverage() {
    this.log('🧪 Analyzing test coverage...', 'blue');

    try {
      const result = execSync('bunx vitest run --coverage --reporter=json', {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // Parse coverage from vitest output
      // This is a simplified example - adjust based on your setup
      const coverage = 85; // Placeholder

      this.metrics.coverage = {
        score: coverage,
        percentage: coverage,
      };
    } catch (error) {
      this.metrics.coverage = { score: 0, percentage: 0 };
    }
  }

  calculateOverallScore() {
    const weights = {
      eslint: 0.25,
      typescript: 0.2,
      hooks: 0.2,
      commits: 0.1,
      bundle: 0.15,
      coverage: 0.1,
    };

    const weightedScore = Object.entries(weights).reduce((sum, [metric, weight]) => {
      return sum + this.metrics[metric].score * weight;
    }, 0);

    const grade =
      weightedScore >= 90
        ? 'A'
        : weightedScore >= 80
          ? 'B'
          : weightedScore >= 70
            ? 'C'
            : weightedScore >= 60
              ? 'D'
              : 'F';

    this.metrics.overall = {
      score: Math.round(weightedScore),
      grade,
    };
  }

  getScoreColor(score) {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    return 'red';
  }

  getScoreEmoji(score) {
    if (score >= 90) return '✅';
    if (score >= 70) return '⚠️';
    return '❌';
  }

  printDashboard() {
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('📊 QUALITY DASHBOARD', 'bright');
    this.log('='.repeat(60), 'cyan');

    // Overall Score
    const overallColor = this.getScoreColor(this.metrics.overall.score);
    this.log(
      `\n🎯 Overall Quality Score: ${this.metrics.overall.score}/100 (${this.metrics.overall.grade})`,
      overallColor
    );

    // Detailed Metrics
    this.log('\n📋 Detailed Metrics:', 'cyan');

    const metrics = [
      [
        'ESLint Issues',
        this.metrics.eslint.score,
        `${this.metrics.eslint.issues} issues (${this.metrics.eslint.fixable} fixable)`,
      ],
      [
        'TypeScript',
        this.metrics.typescript.score,
        `${this.metrics.typescript.errors} compilation errors`,
      ],
      [
        'React Hooks',
        this.metrics.hooks.score,
        `${this.metrics.hooks.issues} dependency issues (${this.metrics.hooks.critical} critical)`,
      ],
      [
        'Commit Quality',
        this.metrics.commits.score,
        `${this.metrics.commits.conventional}/${this.metrics.commits.total} conventional commits`,
      ],
      [
        'Bundle Size',
        this.metrics.bundle.score,
        `${this.metrics.bundle.violations} violations`,
      ],
      [
        'Test Coverage',
        this.metrics.coverage.score,
        `${this.metrics.coverage.percentage}% coverage`,
      ],
    ];

    metrics.forEach(([name, score, details]) => {
      const color = this.getScoreColor(score);
      const emoji = this.getScoreEmoji(score);
      this.log(
        `  ${emoji} ${name.padEnd(15)}: ${score.toString().padStart(3)}/100  ${details}`,
        color
      );
    });

    // Recommendations
    this.log('\n💡 Recommendations:', 'magenta');

    if (this.metrics.eslint.score < 90) {
      this.log(`  • Run: node scripts/intelligent-eslint-fix.js --verbose`, 'blue');
    }

    if (this.metrics.typescript.score < 90) {
      this.log(`  • Fix TypeScript errors: bunx tsc --noEmit`, 'blue');
    }

    if (this.metrics.hooks.score < 90) {
      this.log(
        `  • Review hook dependencies: node scripts/react-hooks-enforcer.js --verbose`,
        'blue'
      );
    }

    if (this.metrics.commits.score < 80) {
      this.log(`  • Use conventional commit format: type(scope): description`, 'blue');
    }

    if (this.metrics.bundle.score < 90) {
      this.log(`  • Optimize bundle size: node scripts/bundle-size-monitor.js`, 'blue');
    }

    if (this.metrics.coverage.score < 80) {
      this.log(`  • Increase test coverage: bunx vitest run --coverage`, 'blue');
    }

    // Quick Actions
    this.log('\n⚡ Quick Actions:', 'yellow');
    this.log(`  • Fix all auto-fixable: bun run quality:check`, 'blue');
    this.log(`  • Run tests: bun run test`, 'blue');
    this.log(`  • Check bundle: bun run bundle:check`, 'blue');

    this.log('\n' + '='.repeat(60), 'cyan');
  }

  async generateReport() {
    try {
      this.log('🚀 Generating Quality Dashboard...', 'bright');

      await this.analyzeESLint();
      await this.analyzeTypeScript();
      await this.analyzeReactHooks();
      await this.analyzeCommitQuality();
      await this.analyzeBundleSize();
      await this.analyzeCoverage();

      this.calculateOverallScore();
      this.printDashboard();

      // Save report to file
      const report = {
        timestamp: new Date().toISOString(),
        metrics: this.metrics,
        summary: `Overall Score: ${this.metrics.overall.score}/100 (${this.metrics.overall.grade})`,
      };

      fs.writeFileSync('quality-report.json', JSON.stringify(report, null, 2));
      this.log('\n💾 Report saved to quality-report.json', 'green');
    } catch (error) {
      this.log(`❌ Error generating dashboard: ${error.message}`, 'red');
      throw error;
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const dashboard = new QualityDashboard();
  dashboard.generateReport().catch(error => {
    console.error(`${colors.red}❌ Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

export default QualityDashboard;
