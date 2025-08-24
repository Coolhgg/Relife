#!/usr/bin/env node

/**
 * Dead Code Detector - Advanced unused code detection
 * Finds unused functions, exports, variables, and entire files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detection configuration
const DETECTOR_CONFIG = {
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  ignoreDirectories: [
    'node_modules', 'dist', 'build', '.git', 'coverage',
    'android', 'ios', '.next', 'artifacts', 'public',
  ],
  
  // Patterns for code that should never be considered dead
  preservePatterns: {
    // Entry points and critical files
    entryPoints: [
      'main.tsx', 'main.ts', 'index.ts', 'index.tsx',
      'App.tsx', 'App.ts', '_app.tsx', '_document.tsx',
      'vite.config.ts', 'vitest.config.ts', 'eslint.config.js',
    ],
    
    // Function patterns to preserve
    functions: [
      /^main$/,
      /^default$/,
      /^render$/,
      /^init/,
      /^setup/,
      /^configure/,
      /Handler$/,
      /Middleware$/,
      /^use[A-Z]/,    // React hooks
      /^get[A-Z]/,    // Getters
      /^set[A-Z]/,    // Setters
      /^create[A-Z]/, // Factory functions
      /^generate[A-Z]/, // Generators
      /^validate[A-Z]/, // Validators
    ],
    
    // Variable patterns to preserve
    variables: [
      /^[A-Z_][A-Z0-9_]*$/, // Constants
      /config$/i,
      /schema$/i,
      /types$/i,
      /constants$/i,
    ],
    
    // Exports that should be preserved
    exports: [
      /^default$/,
      /^meta$/,
      /^config$/,
      /Types?$/,
      /Props$/,
      /Interface$/,
    ],
  },
  
  // File patterns to analyze for cross-references
  crossReferencePatterns: [
    // Package.json scripts
    'package.json',
    // Config files
    '*.config.*',
    // HTML files that might reference JS
    '*.html',
    // Test files
    '*.test.*', '*.spec.*',
    // Story files
    '*.stories.*',
  ],
};

// Detection results
const detectionResults = {
  deadFunctions: [],
  deadVariables: [],
  deadExports: [],
  unusedFiles: [],
  statistics: {
    filesAnalyzed: 0,
    functionsAnalyzed: 0,
    variablesAnalyzed: 0,
    exportsAnalyzed: 0,
    crossReferences: 0,
    deadCodeFound: 0,
  },
};

/**
 * Parse file and extract code elements
 */
function parseCodeElements(filePath, content) {
  const elements = {
    functions: [],
    variables: [],
    exports: [],
    imports: [],
    references: new Set(),
  };
  
  // Extract function declarations
  const functionPatterns = [
    // Regular functions
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,
    // Arrow functions assigned to variables
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
    // Method definitions in classes/objects
    /(\w+)\s*\([^)]*\)\s*{/g,
  ];
  
  functionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const functionName = match[1];
      if (functionName && functionName !== 'if' && functionName !== 'for') {
        elements.functions.push({
          name: functionName,
          line: content.substring(0, match.index).split('\n').length,
          isExported: match[0].includes('export'),
          isAsync: match[0].includes('async'),
        });
      }
    }
  });
  
  // Extract variable declarations
  const variablePatterns = [
    // const/let/var declarations
    /(?:export\s+)?(?:const|let|var)\s+(\w+)/g,
    // Destructuring assignments
    /(?:export\s+)?(?:const|let|var)\s+{\s*([^}]+)\s*}/g,
  ];
  
  variablePatterns.forEach((pattern, index) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (index === 1) {
        // Handle destructuring
        const destructured = match[1].split(',').map(v => v.trim().split(':')[0]);
        destructured.forEach(varName => {
          if (varName && /^\w+$/.test(varName)) {
            elements.variables.push({
              name: varName,
              line: content.substring(0, match.index).split('\n').length,
              isExported: match[0].includes('export'),
              type: 'destructured',
            });
          }
        });
      } else {
        elements.variables.push({
          name: match[1],
          line: content.substring(0, match.index).split('\n').length,
          isExported: match[0].includes('export'),
          type: 'declaration',
        });
      }
    }
  });
  
  // Extract exports
  const exportPatterns = [
    // export { name }
    /export\s+{\s*([^}]+)\s*}/g,
    // export const/function
    /export\s+(?:const|function|class)\s+(\w+)/g,
    // export default
    /export\s+default\s+(\w+)/g,
  ];
  
  exportPatterns.forEach((pattern, index) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (index === 0) {
        // Handle named exports
        const exported = match[1].split(',').map(e => e.trim());
        exported.forEach(expName => {
          if (expName && /^\w+$/.test(expName)) {
            elements.exports.push({
              name: expName,
              line: content.substring(0, match.index).split('\n').length,
              type: 'named',
            });
          }
        });
      } else {
        elements.exports.push({
          name: match[1] || 'default',
          line: content.substring(0, match.index).split('\n').length,
          type: index === 2 ? 'default' : 'declaration',
        });
      }
    }
  });
  
  // Extract all identifiers that could be references
  const identifierPattern = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
  let match;
  while ((match = identifierPattern.exec(content)) !== null) {
    elements.references.add(match[0]);
  }
  
  return elements;
}

/**
 * Build cross-reference map across all files
 */
function buildCrossReferenceMap(files) {
  const crossRefMap = new Map();
  
  console.log('🔗 Building cross-reference map...');
  
  files.forEach((filePath, index) => {
    if (index % 20 === 0) {
      process.stdout.write(`\r   Processing ${index + 1}/${files.length} files...`);
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const elements = parseCodeElements(filePath, content);
      
      crossRefMap.set(filePath, elements);
      detectionResults.statistics.filesAnalyzed++;
      detectionResults.statistics.functionsAnalyzed += elements.functions.length;
      detectionResults.statistics.variablesAnalyzed += elements.variables.length;
      detectionResults.statistics.exportsAnalyzed += elements.exports.length;
      
    } catch (error) {
      console.warn(`\nWarning: Could not analyze ${filePath}: ${error.message}`);
    }
  });
  
  console.log(`\n   ✅ Analyzed ${crossRefMap.size} files`);
  return crossRefMap;
}

/**
 * Find usage of an identifier across all files
 */
function findUsages(identifier, crossRefMap, excludeFile = null) {
  let usageCount = 0;
  const usageFiles = [];
  
  for (const [filePath, elements] of crossRefMap) {
    if (filePath === excludeFile) continue;
    
    if (elements.references.has(identifier)) {
      usageCount++;
      usageFiles.push(filePath);
    }
  }
  
  return { count: usageCount, files: usageFiles };
}

/**
 * Detect dead functions
 */
function detectDeadFunctions(crossRefMap) {
  console.log('🔍 Detecting dead functions...');
  
  for (const [filePath, elements] of crossRefMap) {
    elements.functions.forEach(func => {
      // Skip if function should be preserved
      const shouldPreserve = DETECTOR_CONFIG.preservePatterns.functions.some(
        pattern => pattern.test(func.name)
      );
      
      if (shouldPreserve) return;
      
      // Check if function is used elsewhere
      const usage = findUsages(func.name, crossRefMap, filePath);
      
      // Consider dead if not exported and not used, or exported but never imported
      const isDead = (!func.isExported && usage.count === 0) ||
                     (func.isExported && usage.count === 0);
      
      if (isDead) {
        detectionResults.deadFunctions.push({
          name: func.name,
          file: filePath,
          line: func.line,
          isExported: func.isExported,
          usageCount: usage.count,
          reason: func.isExported 
            ? 'Exported but never imported'
            : 'Not used within file or externally',
        });
        
        detectionResults.statistics.deadCodeFound++;
      }
    });
  }
}

/**
 * Detect dead variables
 */
function detectDeadVariables(crossRefMap) {
  console.log('🔍 Detecting dead variables...');
  
  for (const [filePath, elements] of crossRefMap) {
    elements.variables.forEach(variable => {
      // Skip if variable should be preserved
      const shouldPreserve = DETECTOR_CONFIG.preservePatterns.variables.some(
        pattern => pattern.test(variable.name)
      );
      
      if (shouldPreserve) return;
      
      // Check if variable is used
      const usage = findUsages(variable.name, crossRefMap, filePath);
      
      const isDead = (!variable.isExported && usage.count === 0) ||
                     (variable.isExported && usage.count === 0);
      
      if (isDead) {
        detectionResults.deadVariables.push({
          name: variable.name,
          file: filePath,
          line: variable.line,
          type: variable.type,
          isExported: variable.isExported,
          usageCount: usage.count,
          reason: variable.isExported 
            ? 'Exported but never imported'
            : 'Declared but never used',
        });
        
        detectionResults.statistics.deadCodeFound++;
      }
    });
  }
}

/**
 * Detect dead exports
 */
function detectDeadExports(crossRefMap) {
  console.log('🔍 Detecting dead exports...');
  
  for (const [filePath, elements] of crossRefMap) {
    elements.exports.forEach(exp => {
      // Skip if export should be preserved
      const shouldPreserve = DETECTOR_CONFIG.preservePatterns.exports.some(
        pattern => pattern.test(exp.name)
      );
      
      if (shouldPreserve) return;
      
      // Check if export is imported elsewhere
      const usage = findUsages(exp.name, crossRefMap, filePath);
      
      if (usage.count === 0) {
        detectionResults.deadExports.push({
          name: exp.name,
          file: filePath,
          line: exp.line,
          type: exp.type,
          usageCount: usage.count,
          reason: 'Exported but never imported',
        });
        
        detectionResults.statistics.deadCodeFound++;
      }
    });
  }
}

/**
 * Detect unused files
 */
function detectUnusedFiles(crossRefMap, allFiles) {
  console.log('🔍 Detecting unused files...');
  
  const entryPoints = new Set();
  const referenced = new Set();
  
  // Mark entry points
  allFiles.forEach(filePath => {
    const basename = path.basename(filePath);
    if (DETECTOR_CONFIG.preservePatterns.entryPoints.includes(basename)) {
      entryPoints.add(filePath);
    }
  });
  
  // Find all file references
  for (const [filePath, elements] of crossRefMap) {
    // Mark this file as having content if it has exports
    if (elements.exports.length > 0 || elements.functions.length > 0) {
      referenced.add(filePath);
    }
    
    // Look for import statements to find referenced files
    const content = fs.readFileSync(filePath, 'utf8');
    const importPattern = /import.*?from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importPattern.exec(content)) !== null) {
      const importPath = match[1];
      
      // Resolve relative imports to absolute paths
      if (importPath.startsWith('.')) {
        const resolvedPath = path.resolve(path.dirname(filePath), importPath);
        
        // Try different extensions
        for (const ext of DETECTOR_CONFIG.extensions) {
          const fullPath = resolvedPath + ext;
          if (fs.existsSync(fullPath)) {
            referenced.add(fullPath);
            break;
          }
          
          const indexPath = path.join(resolvedPath, 'index' + ext);
          if (fs.existsSync(indexPath)) {
            referenced.add(indexPath);
            break;
          }
        }
      }
    }
  }
  
  // Find files that are not referenced and not entry points
  allFiles.forEach(filePath => {
    const isEntryPoint = entryPoints.has(filePath);
    const isReferenced = referenced.has(filePath);
    const isTestFile = /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath);
    const isConfigFile = /\.(config|setup)\.(ts|tsx|js|jsx)$/.test(filePath);
    
    if (!isEntryPoint && !isReferenced && !isTestFile && !isConfigFile) {
      const elements = crossRefMap.get(filePath);
      const hasExports = elements && elements.exports.length > 0;
      
      detectionResults.unusedFiles.push({
        file: filePath,
        hasExports,
        reason: hasExports 
          ? 'Has exports but is never imported'
          : 'No exports and not referenced',
      });
      
      detectionResults.statistics.deadCodeFound++;
    }
  });
}

/**
 * Generate comprehensive report
 */
function generateDeadCodeReport() {
  const report = {
    timestamp: new Date().toISOString(),
    statistics: { ...detectionResults.statistics },
    summary: {
      totalDeadFunctions: detectionResults.deadFunctions.length,
      totalDeadVariables: detectionResults.deadVariables.length,
      totalDeadExports: detectionResults.deadExports.length,
      totalUnusedFiles: detectionResults.unusedFiles.length,
      totalDeadCodeItems: detectionResults.statistics.deadCodeFound,
    },
    deadCode: {
      functions: detectionResults.deadFunctions.sort((a, b) => 
        b.usageCount - a.usageCount || a.file.localeCompare(b.file)
      ),
      variables: detectionResults.deadVariables.sort((a, b) => 
        b.usageCount - a.usageCount || a.file.localeCompare(b.file)
      ),
      exports: detectionResults.deadExports.sort((a, b) => 
        a.file.localeCompare(b.file)
      ),
      files: detectionResults.unusedFiles.sort((a, b) => 
        a.file.localeCompare(b.file)
      ),
    },
    recommendations: generateDeadCodeRecommendations(),
  };
  
  // Save report
  const reportPath = './reports/dead-code-report.json';
  const reportsDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  return report;
}

/**
 * Generate cleanup recommendations
 */
function generateDeadCodeRecommendations() {
  const recommendations = [];
  
  // High-confidence removals
  const safeRemovals = [
    ...detectionResults.deadFunctions.filter(f => !f.isExported),
    ...detectionResults.deadVariables.filter(v => !v.isExported),
    ...detectionResults.unusedFiles.filter(f => !f.hasExports),
  ];
  
  if (safeRemovals.length > 0) {
    recommendations.push({
      type: 'safe-removal',
      priority: 'high',
      count: safeRemovals.length,
      description: `${safeRemovals.length} items can be safely removed (not exported, no external usage)`,
      action: 'Safe to remove automatically',
    });
  }
  
  // Medium-confidence removals (exported but unused)
  const exportedUnused = [
    ...detectionResults.deadFunctions.filter(f => f.isExported),
    ...detectionResults.deadExports,
  ];
  
  if (exportedUnused.length > 0) {
    recommendations.push({
      type: 'exported-unused',
      priority: 'medium',
      count: exportedUnused.length,
      description: `${exportedUnused.length} exported items appear unused`,
      action: 'Review for potential removal - may be used dynamically',
    });
  }
  
  // File-level recommendations
  if (detectionResults.unusedFiles.length > 0) {
    recommendations.push({
      type: 'unused-files',
      priority: 'high',
      count: detectionResults.unusedFiles.length,
      description: `${detectionResults.unusedFiles.length} files appear completely unused`,
      action: 'Verify these files can be deleted',
    });
  }
  
  return recommendations;
}

/**
 * Get all files to analyze
 */
function getFilesToAnalyze() {
  const files = [];
  
  function scanDirectory(dir, depth = 0) {
    if (depth > 6) return;
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!DETECTOR_CONFIG.ignoreDirectories.includes(item) && !item.startsWith('.')) {
            scanDirectory(fullPath, depth + 1);
          }
        } else {
          const ext = path.extname(item);
          if (DETECTOR_CONFIG.extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}: ${error.message}`);
    }
  }
  
  scanDirectory(process.cwd());
  return files;
}

/**
 * Main execution
 */
async function main() {
  console.log('💀 Dead Code Detection Starting...\n');
  
  const startTime = Date.now();
  const files = getFilesToAnalyze();
  
  console.log(`📁 Found ${files.length} files to analyze`);
  
  // Build cross-reference map
  const crossRefMap = buildCrossReferenceMap(files);
  
  // Detect different types of dead code
  detectDeadFunctions(crossRefMap);
  detectDeadVariables(crossRefMap);
  detectDeadExports(crossRefMap);
  detectUnusedFiles(crossRefMap, files);
  
  // Generate report
  console.log('\n📊 Generating dead code report...');
  const report = generateDeadCodeReport();
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('💀 Dead Code Detection Complete!');
  console.log('='.repeat(60));
  console.log(`📊 Results:`);
  console.log(`   Files analyzed: ${report.statistics.filesAnalyzed}`);
  console.log(`   Dead functions: ${report.summary.totalDeadFunctions}`);
  console.log(`   Dead variables: ${report.summary.totalDeadVariables}`);
  console.log(`   Dead exports: ${report.summary.totalDeadExports}`);
  console.log(`   Unused files: ${report.summary.totalUnusedFiles}`);
  console.log(`   Total dead code items: ${report.summary.totalDeadCodeItems}`);
  console.log(`   Duration: ${duration}s`);
  
  if (report.recommendations.length > 0) {
    console.log('\n🎯 Recommendations:');
    report.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec.description}`);
      console.log(`      Action: ${rec.action}`);
    });
  }
  
  console.log(`\n💾 Detailed report saved to: reports/dead-code-report.json`);
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { detectDeadFunctions, detectDeadVariables, generateDeadCodeReport };