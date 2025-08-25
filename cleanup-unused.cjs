#!/usr/bin/env node

/**
 * Custom script to clean up unused imports and variables
 * Based on the ESLint violations found in the codebase
 */

import fs from 'src/shims/fs'; // auto: converted require to shim
import path from 'src/shims/path'; // auto: converted require to shim
import { __cjs as _child_process } from 'src/shims/child_process'; const { execSync } = _child_process; // auto: converted require to shim

// Track statistics
const stats = {
  filesProcessed: 0,
  importsRemoved: 0,
  variablesFixed: 0,
  errorsFixed: 0,
};

console.log('🧹 Starting unused code cleanup...');

/**
 * Remove unused imports from a TypeScript/JavaScript file
 */
function removeUnusedImports(filePath, content) {
  let modified = content;
  let changes = 0;

  // Common unused imports that appear multiple times in the codebase
  const commonUnusedImports = [
    'Users',
    'Target',
    'CheckCircle',
    'TrendingUp',
    'BarChart3',
    'MessageSquare',
    'Type',
    'AlertTriangle',
    'Progress',
    'TrendingDown',
    'Mail',
    'Card',
    'CardContent',
    'CardDescription',
    'CardHeader',
    'CardTitle',
    'Tabs',
    'TabsContent',
    'TabsList',
    'TabsTrigger',
    'Palette',
    'AlignLeft',
    'AlignCenter',
    'AlignRight',
    'Bold',
    'Italic',
    'Link',
    'Zap',
    'Textarea',
    'Dialog',
    'DialogContent',
    'DialogDescription',
    'DialogHeader',
    'DialogTitle',
    'DialogTrigger',
    'Filter',
    'Calendar',
  ];

  // Remove imports that are completely unused
  for (const importName of commonUnusedImports) {
    // Pattern: remove specific import from destructuring
    const destructurePattern = new RegExp(`\\s*,?\\s*${importName}\\s*,?`, 'g');
    const beforeRemoval = modified;

    // First, check if this import is actually used in the file
    const importUsagePattern = new RegExp(`(?<!import.*?)\\b${importName}\\b`, 'g');
    const usagesInContent = (modified.match(importUsagePattern) || []).length;
    const usagesInImports = (
      modified.match(new RegExp(`import.*?${importName}`, 'g')) || []
    ).length;

    // If the import appears only in import statements, remove it
    if (usagesInContent === usagesInImports) {
      // Remove from destructured imports
      modified = modified.replace(
        new RegExp(`({[^}]*?)\\s*,?\\s*${importName}\\s*,?([^}]*?})`, 'g'),
        (match, before, after) => {
          const cleanedBefore = before.replace(/,\s*$/, '');
          const cleanedAfter = after.replace(/^\s*,/, '');

          if (cleanedBefore === '{' && cleanedAfter === '}') {
            return ''; // Remove entire import line if empty
          }
          return cleanedBefore + cleanedAfter;
        }
      );

      if (modified !== beforeRemoval) {
        changes++;
      }
    }
  }

  // Clean up empty import lines
  modified = modified.replace(/import\s*{\s*}\s*from\s*['""][^'"]*['"];?\s*\n?/g, '');
  modified = modified.replace(/import\s*from\s*['""][^'"]*['"];?\s*\n?/g, '');

  return { modified, changes };
}

/**
 * Fix simple undefined variable issues by adding underscores
 */
function fixUnusedVariables(filePath, content) {
  let modified = content;
  let changes = 0;

  // Fix common unused parameter patterns by adding underscore prefix
  const unusedPatterns = [
    { pattern: /(persona)(?=\s*,)/g, replacement: '_persona' },
    { pattern: /(user)(?=\s*,)/g, replacement: '_user' },
    { pattern: /(emailId)(?=\s*[,)])/g, replacement: '_emailId' },
    { pattern: /(error)(?=\s*\))/g, replacement: '_error' },
    { pattern: /(config)(?=\s*\])/g, replacement: '_config' },
    { pattern: /(index)(?=\s*[,)])/g, replacement: '_index' },
    { pattern: /\berror\b(?=\s*\)\s*{)/g, replacement: '_error' },
  ];

  for (const { pattern, replacement } of unusedPatterns) {
    const beforeFix = modified;
    modified = modified.replace(pattern, replacement);
    if (modified !== beforeFix) {
      changes++;
    }
  }

  return { modified, changes };
}

/**
 * Fix simple no-undef issues by adding missing variable declarations
 */
function fixUndefinedVariables(filePath, content) {
  let modified = content;
  let changes = 0;

  // Add common missing imports/declarations
  if (filePath.includes('.js') && !filePath.includes('node_modules')) {
    // Fix missing require imports for Node.js files
    if (modified.includes('execSync') && !modified.includes('require')) {
      const importLine = "const { execSync } = require('child_process');\n";
      modified = importLine + modified;
      changes++;
    }
  }

  return { modified, changes };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let modified = content;
    let totalChanges = 0;

    // Remove unused imports
    const importResult = removeUnusedImports(filePath, modified);
    modified = importResult.modified;
    totalChanges += importResult.changes;
    stats.importsRemoved += importResult.changes;

    // Fix unused variables
    const variableResult = fixUnusedVariables(filePath, modified);
    modified = variableResult.modified;
    totalChanges += variableResult.changes;
    stats.variablesFixed += variableResult.changes;

    // Fix undefined variables
    const undefResult = fixUndefinedVariables(filePath, modified);
    modified = undefResult.modified;
    totalChanges += undefResult.changes;
    stats.errorsFixed += undefResult.changes;

    // Write back if changes were made
    if (totalChanges > 0 && modified !== content) {
      fs.writeFileSync(filePath, modified);
      console.log(`✅ Fixed ${totalChanges} issues in ${filePath}`);
    }

    stats.filesProcessed++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Get all files to process from the ESLint report
 */
function getFilesToProcess() {
  const eslintReportPath = 'ci/step-outputs/eslint_before_cleanup.txt';
  if (!fs.existsSync(eslintReportPath)) {
    console.log('ESLint report not found, scanning src directory...');
    return scanDirectory('src');
  }

  const reportContent = fs.readFileSync(eslintReportPath, 'utf8');
  const filePathRegex = /^\/project\/workspace\/Coolhgg\/Relife\/(.+)$/gm;
  const files = new Set();

  let match;
  while ((match = filePathRegex.exec(reportContent)) !== null) {
    const relativePath = match[1];
    if (
      relativePath &&
      (relativePath.endsWith('.ts') ||
        relativePath.endsWith('.tsx') ||
        relativePath.endsWith('.js') ||
        relativePath.endsWith('.jsx'))
    ) {
      files.add(relativePath);
    }
  }

  return Array.from(files);
}

/**
 * Scan directory for files
 */
function scanDirectory(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (
      item.isDirectory() &&
      !['node_modules', '.git', 'dist', 'build'].includes(item.name)
    ) {
      files.push(...scanDirectory(fullPath));
    } else if (item.isFile() && /\.(ts|tsx|js|jsx)$/.test(item.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

// Main execution
try {
  const filesToProcess = getFilesToProcess();
  console.log(`📁 Found ${filesToProcess.length} files to process`);

  for (const file of filesToProcess) {
    processFile(file);
  }

  console.log('\n📊 Cleanup Summary:');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Imports removed: ${stats.importsRemoved}`);
  console.log(`Variables fixed: ${stats.variablesFixed}`);
  console.log(`Errors fixed: ${stats.errorsFixed}`);
  console.log(
    `Total fixes: ${stats.importsRemoved + stats.variablesFixed + stats.errorsFixed}`
  );
} catch (error) {
  console.error('❌ Cleanup script failed:', error);
  process.exit(1);
}
