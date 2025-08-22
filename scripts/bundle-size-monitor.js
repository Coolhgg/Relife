#!/usr/bin/env node

/**
 * Bundle Size Monitoring Script
 *
 * This script monitors bundle size changes and prevents performance regressions
 * by enforcing size limits and providing detailed analysis.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class BundleSizeMonitor {
  constructor(options = {}) {
    this.options = {
      distDir: options.distDir || 'dist',
      limits: {
        'assets/*.js': 500 * 1024, // 500KB
        'assets/*.css': 100 * 1024, // 100KB
        'index.html': 50 * 1024, // 50KB
      },
      ...options,
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async analyzeBundleSize() {
    this.log('📦 Analyzing bundle size...', 'blue');

    const results = {
      files: [],
      totalSize: 0,
      violations: [],
      warnings: [],
    };

    // Check if dist directory exists
    if (!fs.existsSync(this.options.distDir)) {
      throw new Error(
        `Distribution directory '${this.options.distDir}' not found. Run build first.`
      );
    }

    // Analyze each file pattern
    Object.entries(this.options.limits).forEach(([pattern, limit]) => {
      const files = this.findMatchingFiles(pattern);

      files.forEach(file => {
        const size = this.getFileSize(file);
        const relativePath = path.relative(process.cwd(), file);

        results.files.push({
          path: relativePath,
          size,
          limit,
          pattern,
          ratio: size / limit,
          exceeds: size > limit,
        });

        results.totalSize += size;

        if (size > limit) {
          results.violations.push({
            path: relativePath,
            size,
            limit,
            excess: size - limit,
          });
        } else if (size > limit * 0.8) {
          results.warnings.push({
            path: relativePath,
            size,
            limit,
            ratio: size / limit,
          });
        }
      });
    });

    return results;
  }

  findMatchingFiles(pattern) {
    const fullPattern = path.join(this.options.distDir, pattern);
    try {
      return execSync(
        `find ${this.options.distDir} -name "${path.basename(pattern)}"`,
        { encoding: 'utf8' }
      )
        .trim()
        .split('\n')
        .filter(file => file && fs.existsSync(file));
    } catch (error) {
      return [];
    }
  }

  printResults(results) {
    this.log('\n📊 Bundle Size Analysis Results', 'cyan');
    this.log(`Total bundle size: ${this.formatBytes(results.totalSize)}`, 'blue');

    // Show all files
    this.log('\n📁 File sizes:', 'blue');
    results.files.forEach(file => {
      const color = file.exceeds ? 'red' : file.ratio > 0.8 ? 'yellow' : 'green';
      const status = file.exceeds ? '❌' : file.ratio > 0.8 ? '⚠️' : '✅';

      this.log(
        `  ${status} ${file.path}: ${this.formatBytes(file.size)} / ${this.formatBytes(file.limit)} (${(file.ratio * 100).toFixed(1)}%)`,
        color
      );
    });

    // Show violations
    if (results.violations.length > 0) {
      this.log('\n❌ Size limit violations:', 'red');
      results.violations.forEach(violation => {
        this.log(
          `  ${violation.path} exceeds limit by ${this.formatBytes(violation.excess)}`,
          'red'
        );
      });
    }

    // Show warnings
    if (results.warnings.length > 0) {
      this.log('\n⚠️ Size warnings (>80% of limit):', 'yellow');
      results.warnings.forEach(warning => {
        this.log(
          `  ${warning.path} is at ${(warning.ratio * 100).toFixed(1)}% of limit`,
          'yellow'
        );
      });
    }

    // Recommendations
    if (results.violations.length > 0 || results.warnings.length > 0) {
      this.log('\n💡 Optimization suggestions:', 'blue');
      this.log('  • Run bundle analyzer: npx vite-bundle-analyzer', 'blue');
      this.log('  • Enable code splitting for large components', 'blue');
      this.log('  • Use dynamic imports for non-critical code', 'blue');
      this.log('  • Check for duplicate dependencies', 'blue');
      this.log('  • Consider lazy loading for features', 'blue');
    }
  }

  async run() {
    try {
      const results = await this.analyzeBundleSize();
      this.printResults(results);

      if (results.violations.length > 0) {
        this.log('\n❌ Bundle size check failed due to size violations', 'red');
        process.exit(1);
      }

      if (results.warnings.length > 0) {
        this.log('\n⚠️ Bundle size check passed with warnings', 'yellow');
      } else {
        this.log('\n✅ Bundle size check passed', 'green');
      }
    } catch (error) {
      this.log(`❌ Bundle size analysis failed: ${error.message}`, 'red');
      process.exit(1);
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new BundleSizeMonitor();
  monitor.run();
}

export default BundleSizeMonitor;
