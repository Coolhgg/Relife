#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all .tsx files
const findTsxFiles = () => {
  try {
    const output = execSync('find src -name "*.tsx" -type f', { encoding: 'utf8' });
    return output.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    console.error('Error finding TSX files:', error);
    return [];
  }
};

// Check if file contains JSX elements
const containsJSX = (content) => {
  // Look for JSX elements - opening tags with angle brackets
  const jsxPattern = /<[A-Z][a-zA-Z0-9]*\s*[^>]*>/;
  // Also check for self-closing JSX elements
  const selfClosingPattern = /<[A-Z][a-zA-Z0-9]*[^>]*\/>/;
  // Check for React fragments
  const fragmentPattern = /<>\s*|<\/>/;
  // Check for lowercase JSX elements (div, span, etc.)
  const htmlElementPattern = /<[a-z][a-zA-Z0-9]*[\s>]/;
  
  return jsxPattern.test(content) || 
         selfClosingPattern.test(content) || 
         fragmentPattern.test(content) ||
         htmlElementPattern.test(content);
};

// Check if file has React import
const hasReactImport = (content) => {
  const reactImportPatterns = [
    /^import\s+React\s+from\s+['"]react['"];?/m,
    /^import\s+\*\s+as\s+React\s+from\s+['"]react['"];?/m,
    /^import\s+{\s*[^}]*React[^}]*\s*}\s+from\s+['"]react['"];?/m,
    /^import\s+React,/m
  ];
  
  return reactImportPatterns.some(pattern => pattern.test(content));
};

// Main scanning function
const scanFiles = () => {
  const tsxFiles = findTsxFiles();
  const missingImports = [];
  const summary = {
    totalFiles: tsxFiles.length,
    filesWithJSX: 0,
    filesWithReactImport: 0,
    filesMissingImport: 0
  };

  console.log(`\n🔍 Scanning ${tsxFiles.length} TSX files for missing React imports...\n`);

  for (const file of tsxFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const hasJSX = containsJSX(content);
      const hasImport = hasReactImport(content);

      if (hasJSX) {
        summary.filesWithJSX++;
        
        if (hasImport) {
          summary.filesWithReactImport++;
        } else {
          summary.filesMissingImport++;
          
          // Find line numbers where JSX is used
          const lines = content.split('\n');
          const jsxLines = [];
          
          for (let i = 0; i < lines.length; i++) {
            if (containsJSX(lines[i])) {
              jsxLines.push(i + 1);
            }
          }
          
          missingImports.push({
            file: file,
            jsxLines: jsxLines.slice(0, 5) // Show first 5 JSX lines
          });
          
          console.log(`❌ ${file}`);
          console.log(`   JSX found on lines: ${jsxLines.slice(0, 5).join(', ')}${jsxLines.length > 5 ? '...' : ''}`);
          console.log('');
        }
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error.message);
    }
  }

  // Generate report
  const report = `# React Imports Scan Report

## Summary
- **Total TSX files scanned**: ${summary.totalFiles}
- **Files containing JSX**: ${summary.filesWithJSX}
- **Files with React import**: ${summary.filesWithReactImport}
- **Files missing React import**: ${summary.filesMissingImport}

## Files Missing React Imports

${missingImports.map(item => `### ${item.file}
- JSX usage detected on lines: ${item.jsxLines.join(', ')}${item.jsxLines.length >= 5 ? ' (showing first 5)' : ''}
`).join('\n')}

## Recommended Action
All files listed above should have \`import React from 'react';\` added at the top of the file.

---
*Generated on ${new Date().toISOString()}*
`;

  // Save report to file
  fs.writeFileSync('REACT_IMPORTS_SCAN.md', report);
  
  console.log(`\n📊 SCAN COMPLETE:`);
  console.log(`   Files with JSX: ${summary.filesWithJSX}`);
  console.log(`   Missing React import: ${summary.filesMissingImport}`);
  console.log(`   Report saved to: REACT_IMPORTS_SCAN.md\n`);

  return missingImports;
};

// Run the scan
if (require.main === module) {
  scanFiles();
}

module.exports = { scanFiles };