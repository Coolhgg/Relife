#!/usr/bin/env node

/**
 * Script to fix no-useless-catch ESLint violations
 */

import fs from 'src/shims/fs'; // auto: converted require to shim
import path from 'src/shims/path'; // auto: converted require to shim

console.log('🔧 Starting useless catch blocks cleanup...\n');

let stats = {
  filesProcessed: 0,
  catchBlocksFixed: 0,
  errors: 0,
};

function fixUselessCatch(content) {
  let modified = content;
  let changes = 0;

  // Pattern 1: try { ... } catch (e) { throw e; }
  const uselessCatchPattern1 =
    /try\s*{\s*([^}]+)\s*}\s*catch\s*\(\s*([^)]+)\s*\)\s*{\s*throw\s+\2\s*;?\s*}/gs;
  modified = modified.replace(uselessCatchPattern1, (match, tryBlock, errorVar) => {
    changes++;
    return tryBlock.trim();
  });

  // Pattern 2: try { ... } catch (error) { throw error; }
  const uselessCatchPattern2 =
    /try\s*{\s*([^}]+)\s*}\s*catch\s*\(\s*error\s*\)\s*{\s*throw\s+error\s*;?\s*}/gs;
  modified = modified.replace(uselessCatchPattern2, (match, tryBlock) => {
    changes++;
    return tryBlock.trim();
  });

  // Pattern 3: Simple rethrow patterns
  const uselessCatchPattern3 =
    /try\s*{\s*([^}]+)\s*}\s*catch\s*\(\s*_?e\s*\)\s*{\s*throw\s+_?e\s*;?\s*}/gs;
  modified = modified.replace(uselessCatchPattern3, (match, tryBlock) => {
    changes++;
    return tryBlock.trim();
  });

  // Pattern 4: More specific single-statement try-catch that just rethrows
  const lines = modified.split('\n');
  const newLines = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Look for simple single-line try-catch patterns
    if (line.match(/try\s*{\s*.+?\s*}\s*catch\s*\([^)]+\)\s*{\s*throw.+?\s*}/)) {
      // Extract the try content
      const tryMatch = line.match(/try\s*{\s*(.+?)\s*}\s*catch/);
      if (tryMatch) {
        const tryContent = tryMatch[1];
        newLines.push(
          lines[i].replace(
            /try\s*{\s*.+?\s*}\s*catch\s*\([^)]+\)\s*{\s*throw.+?\s*}/,
            tryContent
          )
        );
        changes++;
      } else {
        newLines.push(lines[i]);
      }
    } else {
      newLines.push(lines[i]);
    }
    i++;
  }

  if (changes > 0) {
    modified = newLines.join('\n');
  }

  return { modified, changes };
}

function processFile(filePath) {
  try {
    if (!fs.existsSync(filePath) || !filePath.match(/\.(ts|tsx|js|jsx)$/)) {
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const result = fixUselessCatch(content);

    if (result.changes > 0 && result.modified !== content) {
      fs.writeFileSync(filePath, result.modified);
      console.log(
        `✅ Fixed ${result.changes} useless catch blocks in ${path.relative(process.cwd(), filePath)}`
      );
      stats.catchBlocksFixed += result.changes;
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
  }

  console.log('\n📊 Useless Catch Cleanup Summary:');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Catch blocks fixed: ${stats.catchBlocksFixed}`);
  console.log(`Errors: ${stats.errors}`);

  if (stats.catchBlocksFixed > 0) {
    console.log('\n✅ Useless catch blocks cleanup completed successfully!');
  } else {
    console.log('\nℹ️  No useless catch blocks found to fix.');
  }
} catch (error) {
  console.error('❌ Script failed:', error);
  process.exit(1);
}
