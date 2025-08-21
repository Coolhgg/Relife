const fs = require('fs');
const path = require('path');

// Load the ESLint results
const eslintResults = JSON.parse(fs.readFileSync('post-autofix-baseline.json', 'utf8'));

// Extract files with unused TypeScript variables
const filesWithUnusedVars = eslintResults
  .filter(result => result.messages.some(msg => msg.ruleId === '@typescript-eslint/no-unused-vars'))
  .map(result => ({
    filePath: result.filePath,
    unusedVars: result.messages
      .filter(msg => msg.ruleId === '@typescript-eslint/no-unused-vars')
      .map(msg => ({
        variable: msg.message.match(/'([^']+)'/)?.[1],
        line: msg.line,
        column: msg.column
      }))
  }));

console.log(`Found ${filesWithUnusedVars.length} files with unused TypeScript variables`);

let totalFixed = 0;

// Process each file
for (const file of filesWithUnusedVars.slice(0, 5)) { // Start with first 5 files
  try {
    const relativePath = file.filePath.replace('/project/workspace/Coolhgg/Relife/', '');
    console.log(`\nProcessing ${relativePath}:`);
    
    if (!fs.existsSync(file.filePath)) {
      console.log(`  File not found, skipping`);
      continue;
    }
    
    let content = fs.readFileSync(file.filePath, 'utf8');
    const lines = content.split('\n');
    
    for (const unusedVar of file.unusedVars) {
      if (!unusedVar.variable) continue;
      
      console.log(`  - Removing unused: ${unusedVar.variable}`);
      
      // Try to remove unused imports
      if (unusedVar.line <= lines.length) {
        const line = lines[unusedVar.line - 1];
        
        // Handle single import on line
        if (line.includes(`import { ${unusedVar.variable} }`)) {
          lines[unusedVar.line - 1] = '';
          totalFixed++;
        }
        // Handle import in destructuring
        else if (line.includes(unusedVar.variable) && line.includes('{')) {
          // Remove from destructured import
          const newLine = line
            .replace(new RegExp(`,?\\s*${unusedVar.variable}\\s*,?`), '')
            .replace(/{\s*,/, '{')
            .replace(/,\s*}/, '}')
            .replace(/{\s*}/, '');
          
          if (newLine.trim() === '' || newLine.includes('from') && !newLine.includes('{')) {
            lines[unusedVar.line - 1] = '';
          } else {
            lines[unusedVar.line - 1] = newLine;
          }
          totalFixed++;
        }
        // Handle variable declarations
        else if (line.includes(`${unusedVar.variable} =`) || line.includes(`const ${unusedVar.variable}`)) {
          // Convert to underscore prefix to indicate intentionally unused
          lines[unusedVar.line - 1] = line.replace(
            new RegExp(`\\b${unusedVar.variable}\\b`), 
            `_${unusedVar.variable}`
          );
          totalFixed++;
        }
      }
    }
    
    // Clean up empty import lines and multiple consecutive empty lines
    const cleanedLines = lines
      .filter(line => line.trim() !== '' || lines.indexOf(line) === 0)
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
    
    if (cleanedLines !== content) {
      fs.writeFileSync(file.filePath, cleanedLines);
      console.log(`  ✓ Updated ${relativePath}`);
    } else {
      console.log(`  - No changes needed for ${relativePath}`);
    }
    
  } catch (error) {
    console.error(`  ✗ Error processing ${file.filePath}:`, error.message);
  }
}

console.log(`\nFixed ${totalFixed} unused variables across ${filesWithUnusedVars.slice(0, 5).length} files`);