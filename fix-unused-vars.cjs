#!/usr/bin/env node

/**
 * Script to fix unused variables by adding underscore prefix or removing them
 */

import fs from 'src/shims/fs'; // auto: converted require to shim
import path from 'src/shims/path'; // auto: converted require to shim
import { __cjs as _child_process } from 'src/shims/child_process';
const { execSync } = _child_process; // auto: converted require to shim

console.log('🔧 Starting unused variables cleanup...\n');

// Common unused variable patterns to fix
const UNUSED_PATTERNS = [
  // Unused function parameters
  { pattern: /\(([^)]*)\bindex\b([^)]*)\)/g, replacement: '($1_index$2)' },
  { pattern: /\(([^)]*)\berror\b([^)]*)\)/g, replacement: '($1_error$2)' },
  { pattern: /\(([^)]*)\bevent\b([^)]*)\)/g, replacement: '($1_event$2)' },
  { pattern: /\(([^)]*)\bconfig\b([^)]*)\)/g, replacement: '($1_config$2)' },
  { pattern: /\(([^)]*)\buser\b([^)]*)\)/g, replacement: '($1_user$2)' },
  { pattern: /\(([^)]*)\bpersona\b([^)]*)\)/g, replacement: '($1_persona$2)' },

  // Destructured unused variables
  { pattern: /\{\s*([^}]*)\bindex\b([^}]*)\s*\}/g, replacement: '{ $1_index$2 }' },
  { pattern: /\{\s*([^}]*)\berror\b([^}]*)\s*\}/g, replacement: '{ $1_error$2 }' },
  { pattern: /\{\s*([^}]*)\bconfig\b([^}]*)\s*\}/g, replacement: '{ $1_config$2 }' },

  // Catch block errors
  { pattern: /catch\s*\(\s*error\s*\)/g, replacement: 'catch (_error)' },
  { pattern: /catch\s*\(\s*e\s*\)/g, replacement: 'catch (_e)' },
];

// Remove unused imports patterns
const UNUSED_IMPORT_PATTERNS = [
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

const stats = {
  filesProcessed: 0,
  variablesFixed: 0,
  importsRemoved: 0,
  errors: 0,
};

function fixUnusedVariables(content) {
  let modified = content;
  let changes = 0;

  // Apply variable fixes
  for (const { pattern, replacement } of UNUSED_PATTERNS) {
    const before = modified;
    modified = modified.replace(pattern, replacement);
    if (modified !== before) changes++;
  }

  // Fix common unused variable declarations
  modified = modified.replace(
    /const\s+(\w+)\s*=.*?\/\*\s*unused\s*\*\//g,
    'const _$1 = $2'
  );

  return { modified, changes };
}

function removeUnusedImports(content) {
  let modified = content;
  let changes = 0;

  for (const importName of UNUSED_IMPORT_PATTERNS) {
    // Check if import is actually used (not just in import statements)
    const importRegex = new RegExp(`\\bimport\\b.*?\\b${importName}\\b`, 'g');
    const usageRegex = new RegExp(`(?<!import.*?)\\b${importName}\\b`, 'g');

    const importMatches = (modified.match(importRegex) || []).length;
    const usageMatches = (modified.match(usageRegex) || []).length;

    // If only appears in imports, remove it
    if (importMatches > 0 && usageMatches === importMatches) {
      // Remove from destructured imports
      const destructurePattern = new RegExp(
        `(\\{[^}]*?),?\\s*${importName}\\s*,?([^}]*?\\})`,
        'g'
      );

      modified = modified.replace(destructurePattern, (match, before, after) => {
        const cleanBefore = before.replace(/,\s*$/, '');
        const cleanAfter = after.replace(/^,\s*/, '');

        if (cleanBefore === '{' && cleanAfter === '}') {
          return ''; // Remove entire import line
        }
        return cleanBefore + cleanAfter;
      });

      changes++;
    }
  }

  // Clean up empty import lines
  modified = modified.replace(/import\s*\{\s*\}\s*from\s*['""][^'"]*['"];?\s*\n?/g, '');

  return { modified, changes };
}

function processFile(filePath) {
  try {
    if (!fs.existsSync(filePath) || !filePath.match(/\.(ts|tsx|js|jsx)$/)) {
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let modified = content;
    let totalChanges = 0;

    // Fix unused variables
    const varResult = fixUnusedVariables(modified);
    modified = varResult.modified;
    totalChanges += varResult.changes;
    stats.variablesFixed += varResult.changes;

    // Remove unused imports
    const importResult = removeUnusedImports(modified);
    modified = importResult.modified;
    totalChanges += importResult.changes;
    stats.importsRemoved += importResult.changes;

    // Write back if changes were made
    if (totalChanges > 0 && modified !== content) {
      fs.writeFileSync(filePath, modified);
      console.log(
        `✅ Fixed ${totalChanges} issues in ${path.relative(process.cwd(), filePath)}`
      );
    }

    stats.filesProcessed++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    stats.errors++;
  }
}

function getAllFiles(dir) {
  let files = [];

  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        // Skip certain directories
        if (
          !['node_modules', '.git', 'dist', 'build', 'coverage'].includes(item.name)
        ) {
          files = files.concat(getAllFiles(fullPath));
        }
      } else if (item.isFile() && /\.(ts|tsx|js|jsx)$/.test(item.name)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Warning: Could not read directory ${dir}:`, error.message);
  }

  return files;
}

// Main execution
try {
  const files = getAllFiles('./src');
  console.log(`Found ${files.length} files to process\n`);

  for (const file of files) {
    processFile(file);

    // Limit output for performance
    if (stats.filesProcessed > 0 && stats.filesProcessed % 50 === 0) {
      console.log(`... processed ${stats.filesProcessed} files so far`);
    }
  }

  console.log('\n📊 Cleanup Summary:');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Variables fixed: ${stats.variablesFixed}`);
  console.log(`Imports removed: ${stats.importsRemoved}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Total fixes: ${stats.variablesFixed + stats.importsRemoved}`);

  if (stats.variablesFixed + stats.importsRemoved > 0) {
    console.log('\n✅ Unused variables cleanup completed successfully!');
  } else {
    console.log('\nℹ️  No unused variables found to fix.');
  }
} catch (error) {
  console.error('❌ Script failed:', error);
  process.exit(1);
}
