#!/usr/bin/env node

/**
 * Extract and analyze no-undef errors from ESLint JSON output
 */

const fs = require('fs');
const path = require('path');

function extractNoUndefErrors(jsonFilePath) {
  try {
    const eslintResults = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    const undefinedIdentifiers = new Map();
    const fileErrors = new Map();

    for (const result of eslintResults) {
      if (result.messages && result.messages.length > 0) {
        const noUndefMessages = result.messages.filter(msg => msg.ruleId === 'no-undef');
        
        if (noUndefMessages.length > 0) {
          const relativeFilePath = path.relative(process.cwd(), result.filePath);
          fileErrors.set(relativeFilePath, noUndefMessages.length);

          for (const message of noUndefMessages) {
            // Extract identifier name from message like "'error' is not defined."
            const match = message.message.match(/^'([^']+)' is not defined\.$/);
            if (match) {
              const identifier = match[1];
              
              if (!undefinedIdentifiers.has(identifier)) {
                undefinedIdentifiers.set(identifier, {
                  count: 0,
                  files: new Set(),
                  locations: []
                });
              }

              const entry = undefinedIdentifiers.get(identifier);
              entry.count++;
              entry.files.add(relativeFilePath);
              entry.locations.push({
                file: relativeFilePath,
                line: message.line,
                column: message.column
              });
            }
          }
        }
      }
    }

    return { undefinedIdentifiers, fileErrors };
  } catch (error) {
    console.error('Error processing ESLint results:', error);
    process.exit(1);
  }
}

function generateReport(undefinedIdentifiers, fileErrors, outputPath) {
  // Sort identifiers by count (most occurrences first)
  const sortedIdentifiers = Array.from(undefinedIdentifiers.entries())
    .sort(([, a], [, b]) => b.count - a.count);

  // Generate main report
  let report = `# No-Undef Analysis Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Total unique identifiers:** ${sortedIdentifiers.length}\n`;
  report += `**Total occurrences:** ${sortedIdentifiers.reduce((sum, [, data]) => sum + data.count, 0)}\n`;
  report += `**Files with errors:** ${fileErrors.size}\n\n`;

  // Top 150 identifiers for processing
  const top150 = sortedIdentifiers.slice(0, 150);
  report += `## Top 150 Identifiers by Occurrence (for processing)\n\n`;
  report += `| Rank | Identifier | Count | Files | Sample Location |\n`;
  report += `|------|------------|-------|-------|-----------------|\n`;

  top150.forEach(([identifier, data], index) => {
    const sampleLocation = data.locations[0];
    report += `| ${index + 1} | \`${identifier}\` | ${data.count} | ${data.files.size} | ${sampleLocation.file}:${sampleLocation.line} |\n`;
  });

  report += `\n## Files with Most Errors\n\n`;
  const sortedFiles = Array.from(fileErrors.entries()).sort(([, a], [, b]) => b - a);
  report += `| File | Error Count |\n`;
  report += `|------|-------------|\n`;
  sortedFiles.forEach(([file, count]) => {
    report += `| ${file} | ${count} |\n`;
  });

  report += `\n## All Identifiers (Complete List)\n\n`;
  sortedIdentifiers.forEach(([identifier, data], index) => {
    report += `### ${index + 1}. \`${identifier}\` (${data.count} occurrences in ${data.files.size} files)\n\n`;
    
    // Group locations by file
    const locationsByFile = new Map();
    data.locations.forEach(loc => {
      if (!locationsByFile.has(loc.file)) {
        locationsByFile.set(loc.file, []);
      }
      locationsByFile.get(loc.file).push(`${loc.line}:${loc.column}`);
    });

    Array.from(locationsByFile.entries()).forEach(([file, locations]) => {
      report += `- **${file}:** ${locations.join(', ')}\n`;
    });
    report += `\n`;
  });

  fs.writeFileSync(outputPath, report);
  
  // Generate top 150 list for processing
  const top150List = top150.map(([identifier, data]) => 
    `${identifier} (${data.count} occurrences)`
  ).join('\n');
  
  const top150Path = outputPath.replace('.txt', '_top150.txt');
  fs.writeFileSync(top150Path, top150List);

  return { 
    totalIdentifiers: sortedIdentifiers.length, 
    totalOccurrences: sortedIdentifiers.reduce((sum, [, data]) => sum + data.count, 0),
    top150Count: top150.length
  };
}

// Main execution
const jsonFile = process.argv[2] || 'ci/step-outputs/eslint_no_undef_current.json';
const outputFile = process.argv[3] || 'ci/step-outputs/no_undef_remaining_list.txt';

console.log(`Processing ESLint results from: ${jsonFile}`);
console.log(`Output report to: ${outputFile}`);

const { undefinedIdentifiers, fileErrors } = extractNoUndefErrors(jsonFile);
const stats = generateReport(undefinedIdentifiers, fileErrors, outputFile);

console.log(`\n📊 Analysis Complete:`);
console.log(`- ${stats.totalIdentifiers} unique undefined identifiers`);
console.log(`- ${stats.totalOccurrences} total occurrences`);
console.log(`- ${stats.top150Count} identifiers in top 150 for processing`);
console.log(`\nFiles generated:`);
console.log(`- ${outputFile} (complete analysis)`);
console.log(`- ${outputFile.replace('.txt', '_top150.txt')} (top 150 for processing)`);