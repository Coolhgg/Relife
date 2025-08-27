#!/usr/bin/env node

/**
 * Auto-fix script for common ESLint issues
 * Focuses on fixing unused variables and imports automatically
 */

import fs from 'fs';
import path from 'path';
import {execSync} from 'child_process';

console.log('🔧 Starting automated fixes for unused variables and imports...\n');

// Get all TypeScript and JavaScript files
const getAllFiles = (dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) => {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and dist directories
      if (!item.startsWith('.') && !['node_modules', 'dist', 'build'].includes(item)) {
        files.push(...getAllFiles(fullPath, extensions));
      }
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
};

// Fix unused imports in a file
const fixUnusedImports = filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;

  // Remove unused imports that match common patterns
  const importLines = content
    .split('\n')
    .filter(line => line.trim().startsWith('import'));

  for (const line of importLines) {
    // Extract imported items
    const importMatch = line.match(/import\s+{([^}]+)}\s+from/);
    if (importMatch) {
      const imports = importMatch[1].split(',').map(item => item.trim());
      const usedImports = imports.filter(importItem => {
        const itemName = importItem.replace(/\s+as\s+\w+$/, '').trim();
        // Check if the import is used in the file (simple regex check)
        const usage = new RegExp(`\\b${itemName}\\b`, 'g');
        const matches = (content.match(usage) || []).length;
        return matches > 1; // More than 1 match means it's used (1 is just the import itself)
      });

      if (usedImports.length === 0) {
        // Remove entire import line
        modified = modified.replace(line + '\n', '');
      } else if (usedImports.length < imports.length) {
        // Update import with only used items
        const newImportLine = line.replace(importMatch[1], usedImports.join(', '));
        modified = modified.replace(line, newImportLine);
      }
    }
  }

  // Fix unused variables by prefixing with underscore
  const lines = modified.split('\n');
  const fixedLines = lines.map(line => {
    // Fix unused function parameters
    line = line.replace(/(\w+): [^,)]+(?=,|\))/g, (match, paramName) => {
      if (paramName && !line.includes('_' + paramName) && !paramName.startsWith('_')) {
        // Check if parameter is used in the function body
        const functionIndex = lines.indexOf(line);
        const functionBody = lines.slice(functionIndex, functionIndex + 20).join('\n');
        if (
          !functionBody.includes(paramName + '.') &&
          !functionBody.includes(paramName + '(') &&
          !functionBody.includes(paramName + '[')
        ) {
          return match.replace(paramName, '_' + paramName);
        }
      }
      return match;
    });

    // Fix unused variables in destructuring
    line = line.replace(/const\s+{([^}]+)}\s*=/g, (match, destructured) => {
      const items = destructured.split(',').map(item => {
        const trimmed = item.trim();
        const varName = trimmed.split(':')[0].trim();
        if (varName && !trimmed.startsWith('_') && !varName.startsWith('_')) {
          return '_' + trimmed;
        }
        return trimmed;
      });
      return match.replace(destructured, items.join(', '));
    });

    return line;
  });

  const newContent = fixedLines.join('\n');

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }

  return false;
};

// Main execution
try {
  const files = getAllFiles(process.cwd());
  let fixedCount = 0;

  console.log(`Found ${files.length} files to process...\n`);

  for (const file of files) {
    try {
      if (fixUnusedImports(file)) {
        console.log(`✅ Fixed: ${path.relative(process.cwd(), file)}`);
        fixedCount++;
      }
    } catch (_error) {
      console.log(`❌ Error processing ${file}: ${_error.message}`);
    }
  }

  console.log(`\n🎉 Auto-fix completed! Modified ${fixedCount} files.`);

  // Run prettier to format the files
  console.log('\n🎨 Running Prettier to format files...');
  try {
    execSync('bunx prettier --write .', { stdio: 'inherit' });
    console.log('✅ Prettier formatting completed');
  } catch (_error) {
    console.log('⚠️ Prettier formatting had issues:', _error.message);
  }
} catch (_error) {
  console.error('❌ Script failed:', _error.message);
  process.exit(1);
}
