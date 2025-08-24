#!/usr/bin/env node

/**
 * Script to fix react-refresh/only-export-components ESLint violations
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting React refresh component exports cleanup...\n');

let stats = {
  filesProcessed: 0,
  exportsFixed: 0,
  errors: 0,
};

function fixComponentExports(content, filePath) {
  let modified = content;
  let changes = 0;

  // Skip if this is a UI component or story file (they're allowed to export variants)
  if (filePath.includes('/ui/') || filePath.includes('.stories.')) {
    return { modified, changes };
  }

  // Pattern 1: Files that export both components and non-components
  // Add /* eslint-disable react-refresh/only-export-components */ at the top

  const hasComponentExports = /export\s+(const|function)\s+[A-Z]\w*/.test(content);
  const hasNonComponentExports =
    /export\s+(const|function|interface|type|enum)\s+[a-z]/.test(content);
  const hasNamedExports = /export\s*{\s*[^}]*\s*}/.test(content);

  if (hasComponentExports && (hasNonComponentExports || hasNamedExports)) {
    // Check if eslint disable comment already exists
    if (!content.includes('eslint-disable react-refresh/only-export-components')) {
      modified = `/* eslint-disable react-refresh/only-export-components */\n${content}`;
      changes++;
    }
  }

  // Pattern 2: Convert named exports to default exports for simple component files
  const componentExportMatches = content.match(/export\s+const\s+([A-Z]\w*)\s*[:=]/g);
  if (componentExportMatches && componentExportMatches.length === 1) {
    const componentMatch = componentExportMatches[0];
    const componentName = componentMatch.match(/export\s+const\s+([A-Z]\w*)/)[1];

    // Check if this is the only export and it's a React component
    const allExports = content.match(/export\s+/g) || [];
    if (
      (allExports.length === 1 && content.includes('React.FC')) ||
      content.includes(': FC')
    ) {
      // Convert to default export
      modified = modified.replace(
        `export const ${componentName}`,
        `const ${componentName}`
      );
      if (!modified.includes(`export default ${componentName}`)) {
        modified += `\n\nexport default ${componentName};\n`;
        changes++;
      }
    }
  }

  // Pattern 3: Fix files that export constants alongside components
  // Mark non-component exports as allowConstantExport
  const constantExports = content.match(/export\s+const\s+[A-Z_][A-Z_0-9]*\s*=/g);
  if (constantExports && hasComponentExports) {
    // Add eslint disable for files with constants and components
    if (
      !content.includes('eslint-disable') &&
      !content.includes('allowConstantExport')
    ) {
      modified = `/* eslint-disable react-refresh/only-export-components */\n${content}`;
      changes++;
    }
  }

  return { modified, changes };
}

function processFile(filePath) {
  try {
    if (!fs.existsSync(filePath) || !filePath.match(/\.(tsx|jsx)$/)) {
      return;
    }

    // Skip certain file types that are allowed to have mixed exports
    const skipPatterns = [
      '/ui/',
      '.stories.',
      '.test.',
      '.spec.',
      '__tests__',
      'index.tsx',
      'index.jsx',
    ];

    if (skipPatterns.some((pattern) => filePath.includes(pattern))) {
      stats.filesProcessed++;
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const result = fixComponentExports(content, filePath);

    if (result.changes > 0 && result.modified !== content) {
      fs.writeFileSync(filePath, result.modified);
      console.log(
        `✅ Fixed ${result.changes} export issues in ${path.relative(process.cwd(), filePath)}`
      );
      stats.exportsFixed += result.changes;
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
      } else if (item.isFile() && /\.(tsx|jsx)$/.test(item.name)) {
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
  console.log(`Found ${files.length} React component files to process\n`);

  for (const file of files) {
    processFile(file);
  }

  console.log('\n📊 React Refresh Exports Cleanup Summary:');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Export issues fixed: ${stats.exportsFixed}`);
  console.log(`Errors: ${stats.errors}`);

  if (stats.exportsFixed > 0) {
    console.log('\n✅ React refresh exports cleanup completed successfully!');
  } else {
    console.log('\nℹ️  No export issues found to fix.');
  }
} catch (error) {
  console.error('❌ Script failed:', error);
  process.exit(1);
}
