#!/usr/bin/env node

/**
 * Enhanced Commit Message Validator
 * 
 * This script provides intelligent commit message validation with project-specific rules
 * and helpful suggestions for better commit practices.
 * 
 * Features:
 * - Conventional commit format enforcement
 * - Project-specific type validation
 * - Breaking change detection
 * - Scope validation based on project structure
 * - Intelligent suggestions
 * - Ticket/issue linking validation
 */

import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class EnhancedCommitValidator {
  constructor(options = {}) {
    this.options = {
      strict: options.strict || false,
      requireScope: options.requireScope || false,
      requireIssueLink: options.requireIssueLink || false,
      maxSubjectLength: options.maxSubjectLength || 72,
      maxBodyLineLength: options.maxBodyLineLength || 80,
      ...options
    };

    // Project-specific configuration
    this.config = {
      types: {
        // Core development types
        feat: { description: 'A new feature', emoji: '✨' },
        fix: { description: 'A bug fix', emoji: '🐛' },
        docs: { description: 'Documentation only changes', emoji: '📚' },
        style: { description: 'Code style changes (formatting, etc)', emoji: '💄' },
        refactor: { description: 'Code refactoring', emoji: '♻️' },
        perf: { description: 'Performance improvements', emoji: '⚡' },
        test: { description: 'Adding or updating tests', emoji: '🧪' },
        chore: { description: 'Build process or auxiliary tool changes', emoji: '🔧' },
        
        // Project-specific types
        mobile: { description: 'Mobile-specific changes (iOS/Android)', emoji: '📱' },
        pwa: { description: 'Progressive Web App features', emoji: '📲' },
        a11y: { description: 'Accessibility improvements', emoji: '♿' },
        i18n: { description: 'Internationalization changes', emoji: '🌐' },
        premium: { description: 'Premium features development', emoji: '💎' },
        gaming: { description: 'Gaming/rewards system features', emoji: '🎮' },
        voice: { description: 'Voice features and AI integration', emoji: '🎤' },
        security: { description: 'Security-related changes', emoji: '🔒' },
        analytics: { description: 'Analytics and tracking features', emoji: '📊' },
        
        // Release types
        release: { description: 'Release preparation', emoji: '🚀' },
        hotfix: { description: 'Critical hotfix', emoji: '🚨' },
      },

      scopes: {
        // Core components
        'alarm': 'Alarm functionality',
        'auth': 'Authentication system', 
        'ui': 'User interface components',
        'api': 'API and backend integration',
        'database': 'Database schemas and migrations',
        
        // Features
        'premium': 'Premium features',
        'gaming': 'Gaming and rewards',
        'voice': 'Voice features',
        'themes': 'Theme system',
        'notifications': 'Push notifications',
        'sync': 'Cloud synchronization',
        'offline': 'Offline functionality',
        'pwa': 'Progressive Web App',
        'mobile': 'Mobile platforms',
        
        // Infrastructure
        'ci': 'Continuous integration',
        'build': 'Build system',
        'deps': 'Dependencies',
        'config': 'Configuration',
        'scripts': 'Build and utility scripts',
        'docker': 'Docker configuration',
        'monitoring': 'Monitoring and analytics',
        
        // Quality
        'tests': 'Test suite',
        'a11y': 'Accessibility',
        'perf': 'Performance',
        'security': 'Security',
        'i18n': 'Internationalization'
      }
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  parseCommitMessage(message) {
    const lines = message.trim().split('\n');
    const subject = lines[0];
    const body = lines.slice(2).join('\n').trim(); // Skip empty line after subject
    
    // Parse conventional commit format: type(scope): subject
    const conventionalRegex = /^(\w+)(\([^)]+\))?: (.+)$/;
    const match = subject.match(conventionalRegex);
    
    if (!match) {
      return {
        isConventional: false,
        raw: message,
        subject,
        body,
        lines
      };
    }
    
    return {
      isConventional: true,
      raw: message,
      type: match[1],
      scope: match[2] ? match[2].slice(1, -1) : null, // Remove parentheses
      subject,
      description: match[3],
      body,
      lines,
      isBreakingChange: message.includes('BREAKING CHANGE:') || subject.includes('!')
    };
  }

  validateType(parsed) {
    const issues = [];
    
    if (!parsed.isConventional) {
      issues.push({
        level: 'error',
        message: 'Commit message must follow conventional commit format',
        suggestion: 'Use format: type(scope): description'
      });
      return issues;
    }
    
    if (!this.config.types[parsed.type]) {
      issues.push({
        level: 'error',
        message: `Unknown commit type: ${parsed.type}`,
        suggestion: `Valid types: ${Object.keys(this.config.types).join(', ')}`
      });
    }
    
    return issues;
  }

  validateScope(parsed) {
    const issues = [];
    
    if (this.options.requireScope && !parsed.scope) {
      issues.push({
        level: 'error',
        message: 'Scope is required for this project',
        suggestion: `Valid scopes: ${Object.keys(this.config.scopes).join(', ')}`
      });
      return issues;
    }
    
    if (parsed.scope && !this.config.scopes[parsed.scope]) {
      issues.push({
        level: 'warning',
        message: `Unknown scope: ${parsed.scope}`,
        suggestion: `Consider using: ${Object.keys(this.config.scopes).slice(0, 5).join(', ')}, ...`
      });
    }
    
    return issues;
  }

  validateSubject(parsed) {
    const issues = [];
    const description = parsed.description || parsed.subject;
    
    if (description.length > this.options.maxSubjectLength) {
      issues.push({
        level: 'error',
        message: `Subject line too long (${description.length} > ${this.options.maxSubjectLength})`,
        suggestion: 'Keep subject line concise and under 72 characters'
      });
    }
    
    if (description.endsWith('.')) {
      issues.push({
        level: 'warning',
        message: 'Subject line should not end with a period',
        suggestion: 'Remove the trailing period'
      });
    }
    
    if (description !== description.toLowerCase() && !description.match(/[A-Z][a-z]/)) {
      // Check if it's all caps (which might be intentional for breaking changes)
      if (description === description.toUpperCase()) {
        issues.push({
          level: 'warning',
          message: 'Subject line is in all caps',
          suggestion: 'Consider using sentence case unless this is intentional'
        });
      }
    }
    
    // Check for present tense
    const pastTensePatterns = ['added', 'fixed', 'updated', 'removed', 'changed'];
    const words = description.toLowerCase().split(' ');
    const hasPastTense = pastTensePatterns.some(pattern => words.includes(pattern));
    
    if (hasPastTense) {
      issues.push({
        level: 'warning',
        message: 'Use imperative mood (present tense) in subject',
        suggestion: 'Use "add" instead of "added", "fix" instead of "fixed", etc.'
      });
    }
    
    return issues;
  }

  validateBody(parsed) {
    const issues = [];
    
    if (!parsed.body) {
      // Body is optional, but recommend for certain types
      const bodyRecommendedTypes = ['feat', 'fix', 'refactor', 'perf'];
      if (bodyRecommendedTypes.includes(parsed.type)) {
        issues.push({
          level: 'info',
          message: `Consider adding a body to explain the ${parsed.type}`,
          suggestion: 'Add details about what changed and why'
        });
      }
      return issues;
    }
    
    // Check body line lengths
    const bodyLines = parsed.body.split('\n');
    bodyLines.forEach((line, index) => {
      if (line.length > this.options.maxBodyLineLength) {
        issues.push({
          level: 'warning',
          message: `Body line ${index + 1} too long (${line.length} > ${this.options.maxBodyLineLength})`,
          suggestion: 'Wrap lines to improve readability'
        });
      }
    });
    
    return issues;
  }

  validateIssueLinks(parsed) {
    const issues = [];
    
    // Check for issue/ticket references
    const issuePatterns = [
      /#\d+/, // GitHub issues: #123
      /closes #\d+/i, // Closes #123
      /fixes #\d+/i, // Fixes #123
      /resolves #\d+/i, // Resolves #123
    ];
    
    const hasIssueLink = issuePatterns.some(pattern => pattern.test(parsed.raw));
    
    if (this.options.requireIssueLink && !hasIssueLink) {
      issues.push({
        level: 'error',
        message: 'Issue/ticket reference required',
        suggestion: 'Add "Closes #123", "Fixes #123", or reference the issue number'
      });
    }
    
    return issues;
  }

  validateBreakingChanges(parsed) {
    const issues = [];
    
    if (parsed.isBreakingChange) {
      // Breaking changes should have detailed explanation
      if (!parsed.body || !parsed.raw.includes('BREAKING CHANGE:')) {
        issues.push({
          level: 'error',
          message: 'Breaking changes must include "BREAKING CHANGE:" section in body',
          suggestion: 'Add detailed explanation of the breaking change'
        });
      }
      
      // Breaking changes should be in feat or fix
      if (!['feat', 'fix'].includes(parsed.type)) {
        issues.push({
          level: 'warning',
          message: 'Breaking changes should typically be "feat" or "fix" type',
          suggestion: 'Consider if this should be a feat or fix'
        });
      }
    }
    
    return issues;
  }

  generateSuggestions(parsed, issues) {
    const suggestions = [];
    
    // Type-specific suggestions
    if (parsed.type && this.config.types[parsed.type]) {
      const typeConfig = this.config.types[parsed.type];
      suggestions.push(`${typeConfig.emoji} ${typeConfig.description}`);
    }
    
    // Scope suggestions based on changed files (if available)
    suggestions.push('💡 Consider adding a scope to clarify the area of change');
    
    // Context-specific suggestions
    if (parsed.type === 'feat') {
      suggestions.push('✨ New features should describe user-visible changes');
      suggestions.push('📝 Consider adding tests and documentation');
    } else if (parsed.type === 'fix') {
      suggestions.push('🐛 Bug fixes should reference the issue or describe the problem');
      suggestions.push('🧪 Ensure tests are updated to prevent regression');
    } else if (parsed.type === 'refactor') {
      suggestions.push('♻️ Refactoring should maintain the same external behavior');
      suggestions.push('⚡ Consider if this improves performance or maintainability');
    }
    
    return suggestions;
  }

  validate(message) {
    const parsed = this.parseCommitMessage(message);
    const issues = [];
    
    // Run all validations
    issues.push(...this.validateType(parsed));
    issues.push(...this.validateScope(parsed));
    issues.push(...this.validateSubject(parsed));
    issues.push(...this.validateBody(parsed));
    issues.push(...this.validateIssueLinks(parsed));
    issues.push(...this.validateBreakingChanges(parsed));
    
    const errors = issues.filter(i => i.level === 'error');
    const warnings = issues.filter(i => i.level === 'warning');
    const info = issues.filter(i => i.level === 'info');
    
    return {
      parsed,
      issues,
      errors,
      warnings,
      info,
      isValid: errors.length === 0,
      suggestions: this.generateSuggestions(parsed, issues)
    };
  }

  printResults(result) {
    const { parsed, errors, warnings, info, suggestions } = result;
    
    this.log('\n🔍 Commit Message Analysis', 'cyan');
    this.log(`Subject: ${parsed.subject}`, 'blue');
    
    if (parsed.isConventional) {
      this.log(`Type: ${parsed.type}`, 'green');
      if (parsed.scope) this.log(`Scope: ${parsed.scope}`, 'green');
      if (parsed.isBreakingChange) this.log('⚠️ Breaking Change Detected', 'yellow');
    }
    
    // Show issues
    if (errors.length > 0) {
      this.log('\n❌ Errors:', 'red');
      errors.forEach(error => {
        this.log(`  • ${error.message}`, 'red');
        if (error.suggestion) this.log(`    💡 ${error.suggestion}`, 'blue');
      });
    }
    
    if (warnings.length > 0) {
      this.log('\n⚠️ Warnings:', 'yellow');
      warnings.forEach(warning => {
        this.log(`  • ${warning.message}`, 'yellow');
        if (warning.suggestion) this.log(`    💡 ${warning.suggestion}`, 'blue');
      });
    }
    
    if (info.length > 0) {
      this.log('\nℹ️ Suggestions:', 'cyan');
      info.forEach(infoItem => {
        this.log(`  • ${infoItem.message}`, 'cyan');
        if (infoItem.suggestion) this.log(`    💡 ${infoItem.suggestion}`, 'blue');
      });
    }
    
    // Show type-specific suggestions
    if (suggestions.length > 0) {
      this.log('\n💡 Type-specific Tips:', 'magenta');
      suggestions.forEach(suggestion => {
        this.log(`  ${suggestion}`, 'blue');
      });
    }
    
    // Show available types if needed
    if (errors.some(e => e.message.includes('Unknown commit type'))) {
      this.log('\n📋 Available Types:', 'cyan');
      Object.entries(this.config.types).forEach(([type, config]) => {
        this.log(`  ${config.emoji} ${type}: ${config.description}`, 'blue');
      });
    }
  }

  async validateFile(filePath) {
    try {
      const message = fs.readFileSync(filePath, 'utf8').trim();
      return this.validate(message);
    } catch (error) {
      throw new Error(`Failed to read commit message file: ${error.message}`);
    }
  }
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {};
  let messageFile = args[0];
  
  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--strict') options.strict = true;
    else if (arg === '--require-scope') options.requireScope = true;
    else if (arg === '--require-issue-link') options.requireIssueLink = true;
    else if (arg === '--max-subject-length') options.maxSubjectLength = parseInt(args[++i]);
  }
  
  if (!messageFile) {
    console.error('Usage: node enhanced-commit-validator.js <commit-message-file> [options]');
    process.exit(1);
  }
  
  const validator = new EnhancedCommitValidator(options);
  
  validator.validateFile(messageFile)
    .then(result => {
      validator.printResults(result);
      
      if (!result.isValid) {
        console.log(`\n❌ Commit message validation failed with ${result.errors.length} errors`);
        process.exit(1);
      }
      
      console.log(`\n✅ Commit message is valid!`);
    })
    .catch(error => {
      console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
      process.exit(1);
    });
}

export default EnhancedCommitValidator;