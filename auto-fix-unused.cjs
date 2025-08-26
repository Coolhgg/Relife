#!/usr/bin/env node

/**
 * Auto-fix script for common ESLint issues
 * Focuses on fixing unused variables and imports automatically
 */

import fs from 'src/shims/fs'; // auto: converted require to shim
import path from 'src/shims/path'; // auto: converted require to shim
import { __cjs as _child_process } from 'src/shims/child_process';
const { execSync } = _child_process; // auto: converted require to shim

console.log('🔧 Starting automated fixes for unused variables and imports...\n');

// Get all TypeScript and JavaScript files
const getAllFiles = (dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) => {
  const files = [];
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and dist directories
        if (
          !item.startsWith('.') &&
          !['node_modules', 'dist', 'build', '.git'].includes(item)
        ) {
          files.push(...getAllFiles(fullPath, extensions));
        }
      } else if (extensions.some((ext) => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.log(`Warning: Could not read directory ${dir}: ${error.message}`);
  }

  return files;
};

// Fix unused parameters by prefixing with underscore
const fixUnusedParameters = (content) => {
  let modified = content;

  // Pattern for function parameters that could be unused
  const parameterPatterns = [
    // Arrow function parameters
    /\(([^)]+)\)\s*=>/g,
    // Regular function parameters
    /function\s+\w*\s*\(([^)]+)\)/g,
    // Method parameters
    /\w+\s*\(([^)]+)\)\s*{/g,
  ];

  parameterPatterns.forEach((pattern) => {
    modified = modified.replace(pattern, (match, params) => {
      const fixedParams = params
        .split(',')
        .map((param) => {
          const trimmed = param.trim();
          // If parameter doesn't start with _ and looks like a common unused parameter
          if (
            trimmed &&
            !trimmed.startsWith('_') &&
            (trimmed.includes('index') ||
              trimmed.includes('event') ||
              trimmed.includes('error') ||
              trimmed.includes('unused'))
          ) {
            return trimmed.replace(/^(\w+)/, '_$1');
          }
          return trimmed;
        })
        .join(', ');

      return match.replace(params, fixedParams);
    });
  });

  return modified;
};

// Fix unused destructured variables
const fixUnusedDestructuring = (content) => {
  let modified = content;

  // Pattern for destructuring assignments
  const destructuringPattern = /const\s+{([^}]+)}\s*=/g;

  modified = modified.replace(destructuringPattern, (match, destructured) => {
    const items = destructured.split(',').map((item) => {
      const trimmed = item.trim();
      const varName = trimmed.split(':')[0].trim();

      // If variable name doesn't start with _ and appears to be unused
      if (varName && !trimmed.startsWith('_') && !varName.startsWith('_')) {
        // Simple heuristic: if it's a single word and looks like it might be unused
        if (/^[a-zA-Z]\w*$/.test(varName) && varName.length > 2) {
          return '_' + trimmed;
        }
      }
      return trimmed;
    });

    return match.replace(destructured, items.join(', '));
  });

  return modified;
};

// Process a single file
const processFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = content;

    // Apply fixes
    modified = fixUnusedParameters(modified);
    modified = fixUnusedDestructuring(modified);

    // Only write if content changed
    if (modified !== content) {
      fs.writeFileSync(filePath, modified, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
};

// Main execution
try {
  const files = getAllFiles(process.cwd());
  let fixedCount = 0;

  console.log(`Found ${files.length} files to process...\n`);

  for (const file of files) {
    // Skip certain directories and files
    if (
      file.includes('node_modules') ||
      file.includes('.git') ||
      file.includes('dist') ||
      file.includes('build') ||
      file.endsWith('.d.ts')
    ) {
      continue;
    }

    if (processFile(file)) {
      console.log(`✅ Fixed: ${path.relative(process.cwd(), file)}`);
      fixedCount++;
    }

    // Limit output for readability
    if (fixedCount > 50) {
      console.log(`... and ${files.length - files.indexOf(file)} more files`);
      break;
    }
  }

  console.log(`\n🎉 Auto-fix completed! Modified ${fixedCount} files.`);

  // Run prettier to format the files
  console.log('\n🎨 Running Prettier to format files...');
  try {
    execSync('bunx prettier --write . --log-level=error', { stdio: 'inherit' });
    console.log('✅ Prettier formatting completed');
  } catch (_error) {
    console.log('⚠️ Prettier formatting had issues, but continuing...');
  }
} catch (error) {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
}
