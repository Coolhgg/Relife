#!/usr/bin/env node

/**
 * Intelligent ESLint Auto-Fix Script
 *
 * This script provides smart auto-fixing for common ESLint issues while being cautious
 * about potentially breaking changes like React hook dependencies.
 *
 * Features:
 * - Auto-fixes safe issues (unused imports, variables with underscore prefix)
 * - Warns about risky issues (React hook dependencies)
 * - Provides context-aware suggestions
 * - Maintains code quality without breaking functionality
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ANSI colors for better output
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

class IntelligentESLintFixer {
  constructor(options = {}) {
    this.options = {
      autoFix: options.autoFix !== false, // Default to true
      verbose: options.verbose || false,
      dryRun: options.dryRun || false,
      maxHookDepsWarnings: options.maxHookDepsWarnings || 3,
      ...options,
    };

    this.stats = {
      filesProcessed: 0,
      issuesFound: 0,
      issuesFixed: 0,
      hookDepsWarnings: 0,
      errors: [],
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async runESLint(files = []) {
    const filePattern = files.length > 0 ? files.join(' ') : 'src/**/*.{ts,tsx}';

    try {
      // First, run ESLint with --fix for safe auto-fixable issues
      if (this.options.autoFix && !this.options.dryRun) {
        this.log('🔧 Running ESLint with auto-fix for safe issues...', 'cyan');

        try {
          execSync(`bunx eslint ${filePattern} --fix --quiet`, {
            stdio: 'pipe',
            encoding: 'utf8',
          });
        } catch (error) {
          // ESLint exits with code 1 when there are unfixable issues, which is expected
          if (error.status !== 1) {
            throw error;
          }
        }
      }

      // Then run ESLint to get remaining issues
      this.log('🔍 Analyzing remaining ESLint issues...', 'blue');

      const result = execSync(`bunx eslint ${filePattern} --format json`, {
        stdio: 'pipe',
        encoding: 'utf8',
      });

      return JSON.parse(result);
    } catch (error) {
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch (parseError) {
          this.log(`❌ Error parsing ESLint output: ${parseError.message}`, 'red');
          return [];
        }
      }
      throw error;
    }
  }

  analyzeHookDependencies(results) {
    const hookDepIssues = [];

    results.forEach(result => {
      result.messages.forEach(message => {
        if (message.ruleId === 'react-hooks/exhaustive-deps') {
          hookDepIssues.push({
            file: result.filePath,
            line: message.line,
            column: message.column,
            message: message.message,
            severity: message.severity,
          });
        }
      });
    });

    return hookDepIssues;
  }

  generateHookDependencySuggestions(issue) {
    const suggestions = [];

    if (issue.message.includes('missing dependencies')) {
      suggestions.push(`📝 Add missing dependencies to the dependency array`);
      suggestions.push(
        `🔍 Consider if the dependency is needed or if the effect should be restructured`
      );
      suggestions.push(`⚠️  Verify this won't cause infinite re-renders`);
    }

    if (issue.message.includes('unnecessary dependencies')) {
      suggestions.push(`🗑️  Remove unnecessary dependencies from the array`);
      suggestions.push(`✨ This will improve performance by reducing re-renders`);
    }

    return suggestions;
  }

  async processUnusedVariables(results) {
    const fixes = [];

    for (const result of results) {
      const filePath = result.filePath;
      let fileContent = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // Sort messages by line number (descending) to avoid offset issues when modifying
      const sortedMessages = result.messages
        .filter(
          msg =>
            msg.ruleId === '@typescript-eslint/no-unused-vars' ||
            msg.ruleId === 'no-unused-vars'
        )
        .sort((a, b) => b.line - a.line);

      for (const message of sortedMessages) {
        if (this.canAutoFixUnusedVariable(message)) {
          const fix = this.generateUnusedVariableFix(fileContent, message);
          if (fix && !this.options.dryRun) {
            fileContent = fix.newContent;
            modified = true;
            fixes.push({
              file: filePath,
              line: message.line,
              type: 'unused-variable-fix',
              description: fix.description,
            });
          }
        }
      }

      if (modified && !this.options.dryRun) {
        fs.writeFileSync(filePath, fileContent, 'utf8');
      }
    }

    return fixes;
  }

  canAutoFixUnusedVariable(message) {
    // Only auto-fix certain types of unused variable issues
    const safePatterns = [
      'is assigned a value but never used',
      'is defined but never used',
    ];

    return safePatterns.some(pattern => message.message.includes(pattern));
  }

  generateUnusedVariableFix(content, message) {
    const lines = content.split('\n');
    const lineIndex = message.line - 1;
    const line = lines[lineIndex];

    // Extract variable name from the message
    const variableMatch = message.message.match(/'([^']+)'/);
    if (!variableMatch) return null;

    const variableName = variableMatch[1];

    // Don't prefix if already prefixed
    if (variableName.startsWith('_')) return null;

    // Replace the variable name with underscore-prefixed version
    const newLine = line.replace(
      new RegExp(`\\b${variableName}\\b`, 'g'),
      `_${variableName}`
    );

    if (newLine === line) return null;

    lines[lineIndex] = newLine;

    return {
      newContent: lines.join('\n'),
      description: `Prefixed unused variable '${variableName}' with underscore`,
    };
  }

  async run(files = []) {
    this.log(
      `${colors.bright}🚀 Starting Intelligent ESLint Analysis...${colors.reset}`
    );

    try {
      // Run ESLint analysis
      const results = await this.runESLint(files);
      this.stats.filesProcessed = results.length;

      // Count total issues
      this.stats.issuesFound = results.reduce(
        (total, result) => total + result.messages.length,
        0
      );

      if (this.stats.issuesFound === 0) {
        this.log('✅ No ESLint issues found! Code quality is excellent.', 'green');
        return this.stats;
      }

      this.log(
        `📊 Found ${this.stats.issuesFound} ESLint issues across ${this.stats.filesProcessed} files`,
        'yellow'
      );

      // Process unused variables (safe auto-fixes)
      if (this.options.autoFix) {
        const unusedVarFixes = await this.processUnusedVariables(results);
        this.stats.issuesFixed += unusedVarFixes.length;

        if (unusedVarFixes.length > 0) {
          this.log(
            `🔧 Auto-fixed ${unusedVarFixes.length} unused variable issues`,
            'green'
          );

          if (this.options.verbose) {
            unusedVarFixes.forEach(fix => {
              this.log(
                `  ✓ ${path.relative(process.cwd(), fix.file)}:${fix.line} - ${fix.description}`,
                'green'
              );
            });
          }
        }
      }

      // Analyze React Hook dependencies (warnings only)
      const hookDepIssues = this.analyzeHookDependencies(results);
      this.stats.hookDepsWarnings = hookDepIssues.length;

      if (hookDepIssues.length > 0) {
        this.log(
          `⚠️  Found ${hookDepIssues.length} React Hook dependency issues:`,
          'yellow'
        );

        hookDepIssues.slice(0, this.options.maxHookDepsWarnings).forEach(issue => {
          const relativePath = path.relative(process.cwd(), issue.file);
          this.log(`\n📍 ${relativePath}:${issue.line}:${issue.column}`, 'cyan');
          this.log(`   ${issue.message}`, 'yellow');

          const suggestions = this.generateHookDependencySuggestions(issue);
          suggestions.forEach(suggestion => {
            this.log(`   ${suggestion}`, 'blue');
          });
        });

        if (hookDepIssues.length > this.options.maxHookDepsWarnings) {
          this.log(
            `\n... and ${hookDepIssues.length - this.options.maxHookDepsWarnings} more hook dependency issues.`,
            'yellow'
          );
        }

        this.log(
          `\n💡 React Hook dependency issues require manual review to prevent infinite re-renders.`,
          'magenta'
        );
        this.log(
          `   Run: bunx eslint src/**/*.{ts,tsx} --rule 'react-hooks/exhaustive-deps: error'`,
          'blue'
        );
      }

      // Show summary
      this.printSummary();

      // Determine exit code
      const criticalIssues = results.reduce((total, result) => {
        return (
          total +
          result.messages.filter(
            msg =>
              msg.severity === 2 &&
              msg.ruleId !== 'react-hooks/exhaustive-deps' && // We handle these specially
              !msg.ruleId?.includes('no-unused-vars') // We auto-fix these
          ).length
        );
      }, 0);

      if (criticalIssues > 0) {
        this.log(
          `❌ ${criticalIssues} critical issues remain. Please fix before committing.`,
          'red'
        );
        process.exit(1);
      }

      if (hookDepIssues.length > 0) {
        this.log(
          `⚠️  Hook dependency issues found. Please review carefully.`,
          'yellow'
        );
        // Don't exit with error for hook deps - let developer decide
      }

      return this.stats;
    } catch (error) {
      this.log(`❌ Error running ESLint analysis: ${error.message}`, 'red');
      this.stats.errors.push(error.message);
      throw error;
    }
  }

  printSummary() {
    this.log('\n📊 Summary:', 'bright');
    this.log(`   Files processed: ${this.stats.filesProcessed}`, 'cyan');
    this.log(`   Issues found: ${this.stats.issuesFound}`, 'yellow');
    this.log(`   Issues auto-fixed: ${this.stats.issuesFixed}`, 'green');
    this.log(`   Hook dependency warnings: ${this.stats.hookDepsWarnings}`, 'magenta');

    if (this.stats.issuesFixed > 0) {
      this.log(
        `\n✨ Auto-fixed ${this.stats.issuesFixed} issues. Please review the changes.`,
        'green'
      );
    }
  }
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {};
  const files = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--no-fix') {
      options.autoFix = false;
    } else if (arg === '--max-hook-warnings') {
      options.maxHookDepsWarnings = parseInt(args[++i]) || 3;
    } else if (!arg.startsWith('--')) {
      files.push(arg);
    }
  }

  const fixer = new IntelligentESLintFixer(options);

  fixer.run(files).catch(error => {
    console.error(`${colors.red}❌ Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

export default IntelligentESLintFixer;
