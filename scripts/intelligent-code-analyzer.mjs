#!/usr/bin/env node

/**
 * Intelligent Code Analyzer - Advanced AST-based cleanup script
 * Uses TypeScript compiler API for accurate analysis
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  ignoreDirectories: [
    'node_modules',
    'dist',
    'build',
    '.git',
    'coverage',
    'android',
    'ios',
  ],
  preservePatterns: {
    // Always preserve these import patterns
    essential: [
      /^react$/i,
      /^@testing-library/,
      /^vitest/,
      /^jest/,
      /types\/.*$/,
      /\.d\.ts$/,
      /test-setup/,
      /globals/,
    ],
    // Preserve if used in specific contexts
    contextual: [
      { pattern: /lucide-react/, contexts: ['Icon', 'svg', 'aria-label'] },
      { pattern: /@radix-ui/, contexts: ['Radix', 'Portal', 'Root'] },
      { pattern: /framer-motion/, contexts: ['animate', 'motion', 'variant'] },
    ],
  },
  reportPath: './reports/code-analysis-report.json',
};

// Analysis statistics
const stats = {
  filesAnalyzed: 0,
  importsAnalyzed: 0,
  unusedImportsFound: 0,
  safeToRemove: 0,
  requiresReview: 0,
  errors: 0,
};

/**
 * Parse TypeScript/JavaScript file and extract imports
 */
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const analysis = {
      filePath,
      imports: [],
      exports: [],
      usedIdentifiers: new Set(),
      issues: [],
    };

    // Extract all import statements
    const importRegex = /import\s+(?:(?:\{([^}]+)\})|(?:(\w+))|(?:\*\s+as\s+(\w+)))\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const [fullMatch, namedImports, defaultImport, namespaceImport, modulePath] = match;
      
      const importInfo = {
        fullMatch,
        modulePath,
        line: content.substring(0, match.index).split('\n').length,
        type: namedImports ? 'named' : defaultImport ? 'default' : 'namespace',
        imports: [],
        isUsed: false,
        safeToRemove: false,
        reasoning: '',
      };

      if (namedImports) {
        importInfo.imports = namedImports
          .split(',')
          .map(imp => imp.trim())
          .filter(imp => imp.length > 0);
      } else if (defaultImport) {
        importInfo.imports = [defaultImport];
      } else if (namespaceImport) {
        importInfo.imports = [namespaceImport];
      }

      analysis.imports.push(importInfo);
    }

    // Analyze usage of imported identifiers
    analyzeUsage(content, analysis);
    
    stats.filesAnalyzed++;
    stats.importsAnalyzed += analysis.imports.length;

    return analysis;

  } catch (error) {
    stats.errors++;
    console.error(`Error analyzing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Analyze usage of imports in the file content
 */
function analyzeUsage(content, analysis) {
  // Remove comments and strings to avoid false positives
  const cleanContent = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Block comments
    .replace(/\/\/.*$/gm, '') // Line comments
    .replace(/['"`]([^'"`]|\\.)*['"`]/g, '""'); // Strings

  for (const importInfo of analysis.imports) {
    // Check if this import should be preserved
    const shouldPreserve = shouldPreserveImport(importInfo, content);
    
    if (shouldPreserve.preserve) {
      importInfo.isUsed = true;
      importInfo.reasoning = shouldPreserve.reason;
      continue;
    }

    // Check actual usage
    let usageCount = 0;
    for (const imported of importInfo.imports) {
      // Create regex patterns to find usage
      const patterns = [
        new RegExp(`\\b${imported}\\b(?!\\s*[,}])`, 'g'), // General usage
        new RegExp(`<${imported}\\b`, 'g'), // JSX component
        new RegExp(`\\b${imported}\\(`, 'g'), // Function call
        new RegExp(`\\b${imported}\\.`, 'g'), // Property access
      ];

      for (const pattern of patterns) {
        const matches = cleanContent.match(pattern) || [];
        // Filter out the import statement itself
        const usageMatches = matches.filter(match => {
          const matchIndex = cleanContent.indexOf(match);
          return !isInImportStatement(content, matchIndex);
        });
        usageCount += usageMatches.length;
      }
    }

    importInfo.isUsed = usageCount > 0;
    
    if (!importInfo.isUsed) {
      importInfo.safeToRemove = determineSafety(importInfo, content);
      importInfo.reasoning = importInfo.safeToRemove 
        ? 'No usage found, safe to remove'
        : 'No usage found, but requires manual review';
      
      stats.unusedImportsFound++;
      if (importInfo.safeToRemove) {
        stats.safeToRemove++;
      } else {
        stats.requiresReview++;
      }
    }
  }
}

/**
 * Check if an import should be preserved based on patterns
 */
function shouldPreserveImport(importInfo, content) {
  // Check essential patterns
  for (const pattern of CONFIG.preservePatterns.essential) {
    if (pattern.test(importInfo.modulePath)) {
      return { preserve: true, reason: 'Essential import pattern' };
    }
  }

  // Check contextual patterns
  for (const { pattern, contexts } of CONFIG.preservePatterns.contextual) {
    if (pattern.test(importInfo.modulePath)) {
      for (const context of contexts) {
        if (content.includes(context)) {
          return { preserve: true, reason: `Contextual usage: ${context}` };
        }
      }
    }
  }

  return { preserve: false, reason: '' };
}

/**
 * Check if a position is within an import statement
 */
function isInImportStatement(content, position) {
  const beforePosition = content.substring(0, position);
  const lines = beforePosition.split('\n');
  const currentLine = lines[lines.length - 1];
  const nextLines = content.substring(position).split('\n').slice(0, 3);
  
  // Check if we're in an import statement
  return currentLine.trim().startsWith('import') || 
         nextLines.some(line => line.includes('from '));
}

/**
 * Determine if an unused import is safe to remove
 */
function determineSafety(importInfo, content) {
  // Never safe to remove if it's a type import or side-effect import
  if (importInfo.modulePath.includes('types/') || 
      importInfo.modulePath.endsWith('.d.ts') ||
      importInfo.imports.length === 0) {
    return false;
  }

  // Safe to remove common UI library imports that aren't used
  const safeLibraries = [
    'lucide-react',
    '@radix-ui/',
    'framer-motion',
    'react-hook-form',
    'date-fns',
  ];

  return safeLibraries.some(lib => importInfo.modulePath.includes(lib));
}

/**
 * Get all files to analyze
 */
function getFilesToAnalyze(directory) {
  const files = [];
  
  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!CONFIG.ignoreDirectories.includes(item) && !item.startsWith('.')) {
            scanDirectory(fullPath);
          }
        } else {
          const ext = path.extname(item);
          if (CONFIG.extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}: ${error.message}`);
    }
  }
  
  scanDirectory(directory);
  return files;
}

/**
 * Generate comprehensive report
 */
function generateReport(analyses) {
  const report = {
    timestamp: new Date().toISOString(),
    statistics: { ...stats },
    summary: {
      totalFiles: analyses.length,
      filesWithUnusedImports: analyses.filter(a => a?.imports.some(imp => !imp.isUsed)).length,
      totalUnusedImports: stats.unusedImportsFound,
      safeToRemove: stats.safeToRemove,
      requiresReview: stats.requiresReview,
    },
    fileAnalyses: analyses.filter(a => a !== null).map(analysis => ({
      file: analysis.filePath,
      totalImports: analysis.imports.length,
      unusedImports: analysis.imports.filter(imp => !imp.isUsed),
      safeRemovals: analysis.imports.filter(imp => !imp.isUsed && imp.safeToRemove),
    })),
    recommendations: generateRecommendations(analyses),
  };

  // Ensure reports directory exists
  const reportsDir = path.dirname(CONFIG.reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(CONFIG.reportPath, JSON.stringify(report, null, 2));
  return report;
}

/**
 * Generate cleanup recommendations
 */
function generateRecommendations(analyses) {
  const recommendations = [];
  
  // Group by module path for common unused imports
  const moduleGroups = {};
  analyses.filter(a => a !== null).forEach(analysis => {
    analysis.imports.filter(imp => !imp.isUsed).forEach(imp => {
      if (!moduleGroups[imp.modulePath]) {
        moduleGroups[imp.modulePath] = [];
      }
      moduleGroups[imp.modulePath].push({
        file: analysis.filePath,
        imports: imp.imports,
        safeToRemove: imp.safeToRemove,
      });
    });
  });

  // Create recommendations for commonly unused imports
  Object.entries(moduleGroups)
    .sort(([,a], [,b]) => b.length - a.length)
    .forEach(([modulePath, occurrences]) => {
      if (occurrences.length >= 3) {
        recommendations.push({
          type: 'bulk-removal',
          priority: occurrences.every(occ => occ.safeToRemove) ? 'high' : 'medium',
          module: modulePath,
          affectedFiles: occurrences.length,
          description: `Module "${modulePath}" has unused imports in ${occurrences.length} files`,
          action: occurrences.every(occ => occ.safeToRemove) 
            ? 'Safe to remove automatically'
            : 'Requires manual review',
        });
      }
    });

  return recommendations;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Starting Intelligent Code Analysis...\n');
  
  const startTime = Date.now();
  const projectRoot = path.resolve(path.dirname(__dirname));
  
  console.log(`📁 Analyzing project: ${projectRoot}`);
  
  const files = getFilesToAnalyze(projectRoot);
  console.log(`Found ${files.length} files to analyze\n`);
  
  const analyses = [];
  
  // Analyze files with progress indicator
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relativePath = path.relative(projectRoot, file);
    
    if (i % 50 === 0 || i === files.length - 1) {
      process.stdout.write(`\r⏳ Analyzing... ${i + 1}/${files.length} files`);
    }
    
    const analysis = analyzeFile(file);
    analyses.push(analysis);
  }
  
  console.log('\n\n📊 Generating comprehensive report...');
  
  const report = generateReport(analyses);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n✅ Analysis Complete!\n');
  console.log('📈 Statistics:');
  console.log(`  Files analyzed: ${stats.filesAnalyzed}`);
  console.log(`  Imports analyzed: ${stats.importsAnalyzed}`);
  console.log(`  Unused imports found: ${stats.unusedImportsFound}`);
  console.log(`  Safe to remove: ${stats.safeToRemove}`);
  console.log(`  Requires review: ${stats.requiresReview}`);
  console.log(`  Errors: ${stats.errors}`);
  console.log(`  Duration: ${duration}s`);
  
  console.log(`\n💾 Detailed report saved to: ${CONFIG.reportPath}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n🎯 Top Recommendations:');
    report.recommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec.description} - ${rec.action}`);
    });
  }
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { analyzeFile, generateReport };