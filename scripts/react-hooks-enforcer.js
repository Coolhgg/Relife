#!/usr/bin/env node

/**
 * React Hooks Dependency Enforcer
 * 
 * This script provides strict enforcement of React Hook dependencies with
 * intelligent analysis to prevent common pitfalls like infinite re-renders.
 * 
 * Features:
 * - Detects missing and unnecessary hook dependencies
 * - Analyzes dependency patterns for potential infinite loops
 * - Provides context-aware suggestions
 * - Configurable strictness levels
 */

import { execSync } from 'child_process';
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

class ReactHooksEnforcer {
  constructor(options = {}) {
    this.options = {
      strict: options.strict || false, // If true, blocks commits on hook dependency issues
      maxWarnings: options.maxWarnings || 5,
      analyzeInfiniteLoops: options.analyzeInfiniteLoops !== false,
      verbose: options.verbose || false,
      ...options
    };
    
    this.stats = {
      filesAnalyzed: 0,
      hooksFound: 0,
      dependencyIssues: 0,
      potentialInfiniteLoops: 0,
      criticalIssues: 0
    };
    
    this.riskPatterns = [
      // Patterns that commonly cause infinite loops
      { pattern: /setState.*function/, risk: 'high', message: 'setState in dependency might cause infinite loop' },
      { pattern: /dispatch.*function/, risk: 'medium', message: 'dispatch function in dependency - verify if needed' },
      { pattern: /\.current/, risk: 'low', message: 'ref.current in dependency - usually not needed' }
    ];
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async analyzeHookDependencies(files = []) {
    const filePattern = files.length > 0 ? files.join(' ') : 'src/**/*.{ts,tsx}';
    
    try {
      const result = execSync(
        `bunx eslint ${filePattern} --format json --rule "react-hooks/exhaustive-deps: error"`,
        { 
          stdio: 'pipe',
          encoding: 'utf8'
        }
      );
      
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
      return [];
    }
  }

  analyzeFileForHooks(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      const hooks = [];
      const hookRegex = /use(Effect|Callback|Memo|ImperativeHandle|LayoutEffect)\s*\(/g;
      
      lines.forEach((line, index) => {
        const matches = line.matchAll(hookRegex);
        for (const match of matches) {
          hooks.push({
            type: match[1].toLowerCase(),
            line: index + 1,
            content: line.trim()
          });
        }
      });
      
      return hooks;
    } catch (error) {
      this.log(`⚠️ Error reading file ${filePath}: ${error.message}`, 'yellow');
      return [];
    }
  }

  detectPotentialInfiniteLoops(issue) {
    const risks = [];
    
    // Check for common infinite loop patterns
    this.riskPatterns.forEach(pattern => {
      if (pattern.pattern.test(issue.message)) {
        risks.push({
          level: pattern.risk,
          message: pattern.message
        });
      }
    });
    
    // Analyze specific dependency patterns
    if (issue.message.includes('missing dependencies')) {
      // Extract suggested dependencies
      const depsMatch = issue.message.match(/\[(.*?)\]/);
      if (depsMatch) {
        const suggestedDeps = depsMatch[1].split(',').map(d => d.trim().replace(/['"]/g, ''));
        
        suggestedDeps.forEach(dep => {
          // Functions that change frequently
          if (dep.includes('set') && dep.includes('State')) {
            risks.push({
              level: 'high',
              message: `Adding '${dep}' might cause infinite re-renders`
            });
          }
          
          // Object or array dependencies
          if (dep.includes('.') || dep.includes('[')) {
            risks.push({
              level: 'medium',
              message: `'${dep}' reference might change on every render`
            });
          }
        });
      }
    }
    
    return risks;
  }

  generateSmartSuggestions(issue) {
    const suggestions = [];
    const risks = this.detectPotentialInfiniteLoops(issue);
    
    if (issue.message.includes('missing dependencies')) {
      suggestions.push('🔍 Review if all suggested dependencies are truly needed');
      suggestions.push('💡 Consider using useCallback/useMemo for object/array dependencies');
      suggestions.push('🎯 Move constants outside the component to avoid dependencies');
      
      if (risks.some(r => r.level === 'high')) {
        suggestions.push('⚠️ HIGH RISK: This might cause infinite re-renders - test thoroughly');
        suggestions.push('🔄 Consider restructuring the effect to reduce dependencies');
      }
    }
    
    if (issue.message.includes('unnecessary dependencies')) {
      suggestions.push('✨ Remove unnecessary dependencies to improve performance');
      suggestions.push('🚀 Fewer dependencies = fewer re-renders');
    }
    
    // Add context-specific suggestions based on hook type
    const hookTypeMatch = issue.message.match(/(useEffect|useCallback|useMemo|useLayoutEffect)/);
    if (hookTypeMatch) {
      const hookType = hookTypeMatch[1];
      
      switch (hookType) {
        case 'useEffect':
          suggestions.push('💭 Consider if this effect needs to run on every dependency change');
          break;
        case 'useCallback':
          suggestions.push('🎯 Verify this callback really needs to be memoized');
          break;
        case 'useMemo':
          suggestions.push('📊 Ensure the memoization provides actual performance benefit');
          break;
        case 'useLayoutEffect':
          suggestions.push('⚡ useLayoutEffect is synchronous - use sparingly');
          break;
      }
    }
    
    return { suggestions, risks };
  }

  async run(files = []) {
    this.log(`${colors.bright}🔍 Starting React Hooks Dependency Analysis...${colors.reset}`);
    
    try {
      // Get ESLint results for hook dependencies
      const results = await this.analyzeHookDependencies(files);
      this.stats.filesAnalyzed = results.length;
      
      // Filter for hook dependency issues
      const hookIssues = [];
      
      results.forEach(result => {
        // Count hooks in each file for context
        const hooks = this.analyzeFileForHooks(result.filePath);
        this.stats.hooksFound += hooks.length;
        
        result.messages.forEach(message => {
          if (message.ruleId === 'react-hooks/exhaustive-deps') {
            hookIssues.push({
              file: result.filePath,
              line: message.line,
              column: message.column,
              message: message.message,
              severity: message.severity,
              hooks: hooks.filter(h => Math.abs(h.line - message.line) <= 5) // Nearby hooks for context
            });
          }
        });
      });
      
      this.stats.dependencyIssues = hookIssues.length;
      
      if (hookIssues.length === 0) {
        this.log('✅ No React Hook dependency issues found! Excellent work.', 'green');
        this.log(`📊 Analyzed ${this.stats.hooksFound} hooks across ${this.stats.filesAnalyzed} files`, 'cyan');
        return this.stats;
      }
      
      this.log(`⚠️ Found ${hookIssues.length} React Hook dependency issues`, 'yellow');
      
      // Analyze each issue
      let displayedIssues = 0;
      hookIssues.forEach(issue => {
        if (displayedIssues >= this.options.maxWarnings) return;
        
        const relativePath = path.relative(process.cwd(), issue.file);
        this.log(`\n📍 ${relativePath}:${issue.line}:${issue.column}`, 'cyan');
        this.log(`   ${issue.message}`, 'yellow');
        
        // Show nearby hook context if verbose
        if (this.options.verbose && issue.hooks.length > 0) {
          this.log(`   📝 Nearby hooks:`, 'blue');
          issue.hooks.forEach(hook => {
            this.log(`      Line ${hook.line}: ${hook.type} - ${hook.content.substring(0, 60)}...`, 'blue');
          });
        }
        
        // Generate smart suggestions and risk analysis
        const { suggestions, risks } = this.generateSmartSuggestions(issue);
        
        // Show risks first if any
        if (risks.length > 0) {
          risks.forEach(risk => {
            const riskColor = risk.level === 'high' ? 'red' : risk.level === 'medium' ? 'yellow' : 'blue';
            this.log(`   🚨 ${risk.level.toUpperCase()} RISK: ${risk.message}`, riskColor);
          });
          
          if (risks.some(r => r.level === 'high')) {
            this.stats.criticalIssues++;
            this.stats.potentialInfiniteLoops++;
          }
        }
        
        // Show suggestions
        suggestions.forEach(suggestion => {
          this.log(`   ${suggestion}`, 'blue');
        });
        
        displayedIssues++;
      });
      
      if (hookIssues.length > this.options.maxWarnings) {
        this.log(`\n... and ${hookIssues.length - this.options.maxWarnings} more issues.`, 'yellow');
        this.log(`   Run with --verbose to see all issues`, 'blue');
      }
      
      // Show summary
      this.printSummary();
      
      // Show recommendations
      this.printRecommendations(hookIssues);
      
      // Determine exit code based on strictness
      if (this.options.strict && this.stats.dependencyIssues > 0) {
        this.log(`\n❌ STRICT MODE: Blocking commit due to ${this.stats.dependencyIssues} hook dependency issues`, 'red');
        process.exit(1);
      }
      
      if (this.stats.criticalIssues > 0) {
        this.log(`\n⚠️ ${this.stats.criticalIssues} critical hook dependency issues found`, 'yellow');
        this.log(`   These may cause infinite re-renders. Please review carefully.`, 'yellow');
        
        if (!this.options.strict) {
          this.log(`   Run with --strict to block commits on these issues`, 'blue');
        }
      }
      
      return this.stats;
      
    } catch (error) {
      this.log(`❌ Error analyzing React Hooks: ${error.message}`, 'red');
      throw error;
    }
  }

  printSummary() {
    this.log('\n📊 React Hooks Analysis Summary:', 'bright');
    this.log(`   Files analyzed: ${this.stats.filesAnalyzed}`, 'cyan');
    this.log(`   Total hooks found: ${this.stats.hooksFound}`, 'cyan');
    this.log(`   Dependency issues: ${this.stats.dependencyIssues}`, 'yellow');
    this.log(`   Potential infinite loops: ${this.stats.potentialInfiniteLoops}`, 'red');
    this.log(`   Critical issues: ${this.stats.criticalIssues}`, 'red');
  }

  printRecommendations(issues) {
    if (issues.length === 0) return;
    
    this.log('\n💡 Recommendations:', 'magenta');
    this.log('   1. Review each hook dependency carefully', 'blue');
    this.log('   2. Test components after fixing dependencies', 'blue');
    this.log('   3. Use React DevTools Profiler to check for performance issues', 'blue');
    this.log('   4. Consider extracting complex logic into custom hooks', 'blue');
    
    if (this.stats.potentialInfiniteLoops > 0) {
      this.log('\n🔥 Critical Actions Needed:', 'red');
      this.log('   • Test thoroughly for infinite re-renders', 'red');
      this.log('   • Consider using useCallback/useMemo for object dependencies', 'red');
      this.log('   • Move constants outside component scope', 'red');
    }
    
    this.log('\n📚 Useful Commands:', 'cyan');
    this.log('   • Fix all: bunx eslint src/ --fix --rule "react-hooks/exhaustive-deps: error"', 'cyan');
    this.log('   • Analyze: bunx eslint src/ --rule "react-hooks/exhaustive-deps: error"', 'cyan');
  }
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {};
  const files = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--max-warnings') {
      options.maxWarnings = parseInt(args[++i]) || 5;
    } else if (arg === '--no-infinite-loop-analysis') {
      options.analyzeInfiniteLoops = false;
    } else if (!arg.startsWith('--')) {
      files.push(arg);
    }
  }
  
  const enforcer = new ReactHooksEnforcer(options);
  
  enforcer.run(files).catch(error => {
    console.error(`${colors.red}❌ Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

export default ReactHooksEnforcer;