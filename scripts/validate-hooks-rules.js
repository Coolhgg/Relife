#!/usr/bin/env node

/**
 * React Hooks Rules Validator
 * 
 * Validates React hooks are following rules-of-hooks and proper naming conventions.
 * This script is specifically designed to prevent the violations we just fixed.
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
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateHooksRules(files = []) {
  const filePattern = files.length > 0 ? files.join(' ') : 'src/**/*.{ts,tsx}';
  
  try {
    log('🎣 Validating React hooks rules...', 'blue');
    
    // Run ESLint specifically for hooks rules
    const result = execSync(
      `bunx eslint ${filePattern} --format json --no-eslintrc --config '{"plugins":["react-hooks"],"rules":{"react-hooks/rules-of-hooks":"error"}}'`,
      { stdio: 'pipe', encoding: 'utf8' }
    );
    
    const eslintResults = JSON.parse(result);
    const violations = [];
    
    eslintResults.forEach(result => {
      result.messages.forEach(message => {
        if (message.ruleId === 'react-hooks/rules-of-hooks') {
          violations.push({
            file: result.filePath,
            line: message.line,
            column: message.column,
            message: message.message,
            severity: message.severity
          });
        }
      });
    });
    
    if (violations.length === 0) {
      log('✅ All React hooks are following the rules of hooks!', 'green');
      return { success: true, violations: [] };
    }
    
    log(`❌ Found ${violations.length} React hooks rules violations:`, 'red');
    
    violations.forEach(violation => {
      const relativePath = path.relative(process.cwd(), violation.file);
      log(`\n📍 ${relativePath}:${violation.line}:${violation.column}`, 'cyan');
      log(`   ${violation.message}`, 'red');
      
      // Provide specific guidance based on the violation message
      if (violation.message.includes('neither a React function component nor a custom React Hook function')) {
        log('   💡 Fix: Ensure hook functions start with "use" (e.g., useMyHook)', 'yellow');
        log('   💡 Alternative: Move hook calls to the top level of a component', 'yellow');
      }
      
      if (violation.message.includes('called conditionally')) {
        log('   💡 Fix: Move hook calls to the top level, outside conditions/loops', 'yellow');
      }
    });
    
    log('\n🔧 Common Fixes:', 'cyan');
    log('   • Rename functions to start with "use": _useMyHook → useMyHook', 'blue');
    log('   • Move hook calls to component top level', 'blue');
    log('   • Ensure hooks are only called from React components or custom hooks', 'blue');
    
    return { success: false, violations };
    
  } catch (error) {
    if (error.stdout) {
      try {
        const eslintResults = JSON.parse(error.stdout);
        return validateHooksRules(files); // Recursively handle
      } catch (parseError) {
        log(`❌ Error parsing ESLint output: ${parseError.message}`, 'red');
      }
    }
    
    log(`❌ Error validating hooks: ${error.message}`, 'red');
    return { success: false, violations: [], error: error.message };
  }
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const files = args.filter(arg => !arg.startsWith('--'));
  
  const result = validateHooksRules(files);
  
  if (!result.success) {
    process.exit(1);
  }
}

export default validateHooksRules;