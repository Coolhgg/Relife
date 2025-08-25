#!/usr/bin/env node

/**
 * Pre-commit Cleanup Integration
 * Lightweight cleanup checks for development workflow
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}🧹 Running pre-commit cleanup checks...${colors.reset}`);

// Get staged files
const getStagedFiles = () => {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output
      .trim()
      .split('\n')
      .filter((file) => file.length > 0);
  } catch (_error) {
    return [];
  }
};

// Filter relevant files
const filterCleanupFiles = (files) => {
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs'];
  return files.filter((file) => {
    const ext = path.extname(file);
    return extensions.includes(ext) && !file.includes('node_modules');
  });
};

// Quick analysis
const analyzeFiles = (files) => {
  let totalIssues = 0;

  for (const file of files) {
    if (!existsSync(file)) continue;

    try {
      const content = readFileSync(file, 'utf8');
      const importLines = content
        .split('\n')
        .filter((line) => line.trim().startsWith('import') && line.includes('{'));

      for (const line of importLines) {
        const importMatch = line.match(/import\s+{([^}]+)}\s+from/);
        if (importMatch) {
          const imports = importMatch[1].split(',').map((i) => i.trim());
          for (const imp of imports) {
            const cleanName = imp.replace(/\s+as\s+\w+$/, '').trim();
            const usageRegex = new RegExp(`\\b${cleanName}\\b`, 'g');
            const matches = (content.match(usageRegex) || []).length;
            if (matches <= 1) totalIssues++;
          }
        }
      }
    } catch (_error) {
      // Ignore errors in pre-commit
    }
  }

  return totalIssues;
};

// Main execution
const stagedFiles = getStagedFiles();
const relevantFiles = filterCleanupFiles(stagedFiles);

if (relevantFiles.length > 0) {
  const issues = analyzeFiles(relevantFiles);
  if (issues > 0) {
    console.log(
      `${colors.yellow}📊 Found ${issues} potential cleanup items${colors.reset}`
    );
    console.log(
      `${colors.cyan}💡 Run: node scripts/intelligent-code-analyzer.mjs${colors.reset}`
    );
  } else {
    console.log(`${colors.green}✅ No cleanup issues found${colors.reset}`);
  }
}

console.log(`${colors.green}✅ Pre-commit check complete${colors.reset}`);
