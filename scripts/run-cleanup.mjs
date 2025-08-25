#!/usr/bin/env node

/**
 * Quick Cleanup Runner
 * Simple interface for running cleanup operations
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

const args = process.argv.slice(2);
const command = args[0] || 'help';

const commands = {
  analyze: {
    description: 'Run intelligent code analysis',
    action: (target = '.') => {
      console.log(`${colors.cyan}🔍 Analyzing code...${colors.reset}`);
      execSync(`node scripts/intelligent-code-analyzer.mjs ${target}`, {
        stdio: 'inherit',
      });
    },
  },

  'dry-run': {
    description: 'Preview cleanup changes (safe)',
    action: () => {
      console.log(`${colors.yellow}🧪 Running dry-run cleanup...${colors.reset}`);
      execSync('node scripts/smart-cleanup.mjs --mode=dry-run', { stdio: 'inherit' });
    },
  },

  fix: {
    description: 'Apply safe automatic fixes',
    action: () => {
      console.log(`${colors.green}🔧 Applying safe fixes...${colors.reset}`);
      execSync('node scripts/smart-cleanup.mjs --mode=auto-fix', { stdio: 'inherit' });
    },
  },

  full: {
    description: 'Run full orchestrated cleanup',
    action: () => {
      console.log(`${colors.blue}🚀 Running full cleanup...${colors.reset}`);
      execSync('node scripts/cleanup-orchestrator.mjs --interactive', {
        stdio: 'inherit',
      });
    },
  },

  status: {
    description: 'Show cleanup system status',
    action: () => {
      console.log(`${colors.bright}📊 Cleanup System Status${colors.reset}\n`);

      const checks = [
        { name: 'Code Analyzer', file: 'scripts/intelligent-code-analyzer.mjs' },
        { name: 'Smart Cleanup', file: 'scripts/smart-cleanup.mjs' },
        { name: 'Dead Code Detector', file: 'scripts/dead-code-detector.mjs' },
        { name: 'Cleanup Orchestrator', file: 'scripts/cleanup-orchestrator.mjs' },
        { name: 'Pre-commit Integration', file: 'scripts/pre-commit-cleanup.mjs' },
        { name: 'GitHub Actions', file: '.github/workflows/cleanup-automation.yml' },
        { name: 'Documentation', file: 'IMPROVED_CLEANUP_SYSTEM.md' },
      ];

      checks.forEach(({ name, file }) => {
        const exists = existsSync(file);
        const icon = exists ? '✅' : '❌';
        console.log(`${icon} ${name}`);
      });

      console.log(`\n${colors.cyan}📈 Recent Reports:${colors.reset}`);
      if (existsSync('reports/')) {
        execSync('ls -la reports/ 2>/dev/null | head -5', { stdio: 'inherit' });
      } else {
        console.log('   No reports yet - run analysis first');
      }
    },
  },

  help: {
    description: 'Show this help message',
    action: () => {
      console.log(`${colors.bright}🧹 Cleanup System - Quick Runner${colors.reset}\n`);
      console.log(
        `${colors.cyan}Usage:${colors.reset} node scripts/run-cleanup.mjs <command>\n`
      );
      console.log(`${colors.bright}Available Commands:${colors.reset}\n`);

      Object.entries(commands).forEach(([cmd, { description }]) => {
        console.log(`  ${colors.green}${cmd.padEnd(12)}${colors.reset} ${description}`);
      });

      console.log(`\n${colors.bright}Examples:${colors.reset}`);
      console.log(
        `  ${colors.cyan}node scripts/run-cleanup.mjs analyze${colors.reset}        # Analyze entire codebase`
      );
      console.log(
        `  ${colors.cyan}node scripts/run-cleanup.mjs dry-run${colors.reset}        # Preview cleanup changes`
      );
      console.log(
        `  ${colors.cyan}node scripts/run-cleanup.mjs fix${colors.reset}            # Apply safe fixes`
      );
      console.log(
        `  ${colors.cyan}node scripts/run-cleanup.mjs status${colors.reset}         # Check system status`
      );

      console.log(`\n${colors.yellow}💡 Pro Tips:${colors.reset}`);
      console.log(`  • Always run 'dry-run' before 'fix' to preview changes`);
      console.log(`  • Use 'analyze' to get detailed reports before cleanup`);
      console.log(`  • Check 'status' to verify all components are working`);
      console.log(`  • All operations create automatic backups`);
    },
  },
};

// Execute command
try {
  if (commands[command]) {
    commands[command].action(args[1]);
  } else {
    console.log(`${colors.red}❌ Unknown command: ${command}${colors.reset}\n`);
    commands.help.action();
    process.exit(1);
  }
} catch (error) {
  console.log(
    `${colors.red}❌ Error executing ${command}: ${error.message}${colors.reset}`
  );
  process.exit(1);
}
