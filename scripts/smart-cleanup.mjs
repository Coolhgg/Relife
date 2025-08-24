#!/usr/bin/env node

/**
 * Smart Code Cleanup - Intelligent import and variable cleanup
 * Uses analysis results to safely remove unused code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeFile, generateReport } from './intelligent-code-analyzer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cleanup configuration
const CLEANUP_CONFIG = {
  // Dry run mode - set to false to actually make changes
  dryRun: true,
  
  // Safety settings
  backupFiles: true,
  maxFilesPerRun: 100,
  
  // What to clean up
  cleanupTypes: {
    unusedImports: true,
    unusedVariables: true,
    emptyImportLines: true,
    duplicateImports: true,
  },
  
  // Preserved patterns - never remove these
  preservePatterns: [
    // React imports - may be needed for JSX
    /^import React/,
    // Type-only imports
    /^import type/,
    // Side-effect imports
    /^import ['"][^'"]*['"]$/,
    // Test utilities
    /test-setup|jest|vitest|@testing-library/,
    // Global type definitions
    /globals|\.d\.ts/,
  ],
  
  // Variable patterns to preserve
  preserveVariables: [
    /^_/, // Already prefixed with underscore
    /^unused/, // Explicitly marked as unused
    /^React$/, // React variable
    /Props$|State$|Type$|Interface$/, // Type definitions
  ],
};

// Cleanup statistics
const cleanupStats = {
  filesProcessed: 0,
  importsRemoved: 0,
  variablesFixed: 0,
  linesRemoved: 0,
  backupsCreated: 0,
  errors: 0,
  skipped: 0,
};

/**
 * Create backup of file before modification
 */
function createBackup(filePath) {
  if (!CLEANUP_CONFIG.backupFiles) return;
  
  const backupPath = `${filePath}.backup.${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  cleanupStats.backupsCreated++;
  
  // Clean up old backups (keep only 3 most recent)
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath);
  const backupPattern = new RegExp(`^${basename}\\.backup\\.(\\d+)$`);
  
  const backups = fs.readdirSync(dir)
    .filter(f => backupPattern.test(f))
    .map(f => ({
      name: f,
      time: parseInt(f.match(backupPattern)[1]),
      path: path.join(dir, f),
    }))
    .sort((a, b) => b.time - a.time);
  
  // Remove old backups
  backups.slice(3).forEach(backup => {
    try {
      fs.unlinkSync(backup.path);
    } catch (error) {
      console.warn(`Could not remove old backup ${backup.path}`);
    }
  });
}

/**
 * Clean up unused imports from file content
 */
function cleanupUnusedImports(content, analysis) {
  let modified = content;
  let removedCount = 0;
  
  // Sort imports by line number (descending) to avoid line number shifts
  const unusedImports = analysis.imports
    .filter(imp => !imp.isUsed && imp.safeToRemove)
    .sort((a, b) => b.line - a.line);
  
  for (const importInfo of unusedImports) {
    // Check if import should be preserved
    const shouldPreserve = CLEANUP_CONFIG.preservePatterns.some(pattern => 
      pattern.test(importInfo.fullMatch)
    );
    
    if (shouldPreserve) {
      console.log(`  ⚠️  Preserving import: ${importInfo.modulePath}`);
      continue;
    }
    
    // Remove the entire import line
    const lines = modified.split('\n');
    const importLine = lines[importInfo.line - 1];
    
    // Verify this is actually the import we want to remove
    if (importLine && importLine.includes(importInfo.modulePath)) {
      lines.splice(importInfo.line - 1, 1);
      modified = lines.join('\n');
      removedCount++;
      cleanupStats.linesRemoved++;
    }
  }
  
  // Clean up empty lines left by removed imports
  modified = cleanupEmptyImportBlocks(modified);
  
  cleanupStats.importsRemoved += removedCount;
  return { modified, removedCount };
}

/**
 * Clean up empty import blocks and excessive whitespace
 */
function cleanupEmptyImportBlocks(content) {
  // Remove multiple consecutive empty lines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Remove empty lines at the beginning of file after imports
  const lines = content.split('\n');
  let firstNonImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('import') && !line.startsWith('//') && !line.startsWith('/*')) {
      firstNonImportIndex = i;
      break;
    }
  }
  
  if (firstNonImportIndex > 0) {
    // Remove excessive empty lines between imports and first code
    let emptyLineCount = 0;
    for (let i = firstNonImportIndex - 1; i >= 0; i--) {
      if (lines[i].trim() === '') {
        emptyLineCount++;
      } else {
        break;
      }
    }
    
    if (emptyLineCount > 2) {
      lines.splice(firstNonImportIndex - emptyLineCount, emptyLineCount - 1);
    }
  }
  
  return lines.join('\n');
}

/**
 * Fix unused variables by adding underscore prefix
 */
function fixUnusedVariables(content) {
  let modified = content;
  let fixedCount = 0;
  
  // Pattern for function parameters
  const parameterPatterns = [
    // Arrow function parameters: (param) => or (param1, param2) =>
    /\(([^)]+)\)\s*=>/g,
    // Regular function parameters: function name(param) or name(param)
    /function\s+\w*\s*\(([^)]+)\)|(\w+)\s*\(([^)]+)\)\s*{/g,
  ];
  
  for (const pattern of parameterPatterns) {
    modified = modified.replace(pattern, (match, params) => {
      if (!params) return match;
      
      const fixedParams = params
        .split(',')
        .map(param => {
          const trimmed = param.trim();
          const varName = trimmed.split(':')[0].trim(); // Handle TypeScript types
          
          // Skip if already prefixed or should be preserved
          if (CLEANUP_CONFIG.preserveVariables.some(p => p.test(varName))) {
            return trimmed;
          }
          
          // Check for common unused parameter patterns
          const isLikelyUnused = [
            'event', 'e', 'evt', 'error', 'err',
            'index', 'i', 'idx', 'key',
            'prev', 'current', 'next',
            'props', 'state', 'context',
          ].some(pattern => varName.toLowerCase().includes(pattern.toLowerCase()));
          
          if (isLikelyUnused && !varName.startsWith('_')) {
            fixedCount++;
            return '_' + trimmed;
          }
          
          return trimmed;
        })
        .join(', ');
      
      return match.replace(params, fixedParams);
    });
  }
  
  // Fix destructuring patterns
  const destructuringPattern = /const\s+{([^}]+)}\s*=/g;
  modified = modified.replace(destructuringPattern, (match, destructured) => {
    const items = destructured.split(',').map(item => {
      const trimmed = item.trim();
      const varName = trimmed.split(':')[0].trim();
      
      // Skip if already prefixed or should be preserved
      if (CLEANUP_CONFIG.preserveVariables.some(p => p.test(varName))) {
        return trimmed;
      }
      
      // Check if this looks like an unused variable
      if (varName.length > 1 && /^[a-zA-Z]\w*$/.test(varName)) {
        fixedCount++;
        return '_' + trimmed;
      }
      
      return trimmed;
    });
    
    return match.replace(destructured, items.join(', '));
  });
  
  cleanupStats.variablesFixed += fixedCount;
  return { modified, fixedCount };
}

/**
 * Process a single file for cleanup
 */
async function processFile(filePath) {
  try {
    console.log(`\n🔧 Processing: ${path.relative(process.cwd(), filePath)}`);
    
    // Analyze the file first
    const analysis = analyzeFile(filePath);
    if (!analysis) {
      cleanupStats.skipped++;
      return null;
    }
    
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = originalContent;
    let totalChanges = 0;
    
    // Clean up unused imports
    if (CLEANUP_CONFIG.cleanupTypes.unusedImports) {
      const importResult = cleanupUnusedImports(modifiedContent, analysis);
      modifiedContent = importResult.modified;
      totalChanges += importResult.removedCount;
      
      if (importResult.removedCount > 0) {
        console.log(`  📦 Removed ${importResult.removedCount} unused imports`);
      }
    }
    
    // Fix unused variables
    if (CLEANUP_CONFIG.cleanupTypes.unusedVariables) {
      const variableResult = fixUnusedVariables(modifiedContent);
      modifiedContent = variableResult.modified;
      totalChanges += variableResult.fixedCount;
      
      if (variableResult.fixedCount > 0) {
        console.log(`  🔧 Fixed ${variableResult.fixedCount} unused variables`);
      }
    }
    
    // Write changes if any were made
    if (totalChanges > 0 && modifiedContent !== originalContent) {
      if (!CLEANUP_CONFIG.dryRun) {
        createBackup(filePath);
        fs.writeFileSync(filePath, modifiedContent);
        console.log(`  ✅ Applied ${totalChanges} fixes`);
      } else {
        console.log(`  👁️  [DRY RUN] Would apply ${totalChanges} fixes`);
      }
      
      cleanupStats.filesProcessed++;
      return {
        file: filePath,
        changes: totalChanges,
        content: modifiedContent,
      };
    }
    
    console.log(`  ⭕ No changes needed`);
    return null;
    
  } catch (error) {
    cleanupStats.errors++;
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Get files to process based on configuration
 */
function getFilesToProcess() {
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  const files = [];
  
  function scanDirectory(dir, depth = 0) {
    if (depth > 5) return; // Prevent infinite recursion
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          const ignoreDirectories = [
            'node_modules', 'dist', 'build', '.git', 'coverage',
            'android', 'ios', '.next', 'artifacts',
          ];
          
          if (!ignoreDirectories.includes(item) && !item.startsWith('.')) {
            scanDirectory(fullPath, depth + 1);
          }
        } else {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}: ${error.message}`);
    }
  }
  
  scanDirectory(process.cwd());
  return files.slice(0, CLEANUP_CONFIG.maxFilesPerRun);
}

/**
 * Generate cleanup summary
 */
function generateSummary(processedFiles) {
  const summary = {
    timestamp: new Date().toISOString(),
    config: CLEANUP_CONFIG,
    statistics: { ...cleanupStats },
    processedFiles: processedFiles.filter(f => f !== null).length,
    files: processedFiles.filter(f => f !== null).map(f => ({
      path: path.relative(process.cwd(), f.file),
      changes: f.changes,
    })),
  };
  
  // Save summary report
  const summaryPath = './reports/cleanup-summary.json';
  const reportsDir = path.dirname(summaryPath);
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  return summary;
}

/**
 * Main cleanup execution
 */
async function main() {
  const args = process.argv.slice(2);
  const isProduction = args.includes('--production');
  
  console.log('🧹 Smart Code Cleanup Starting...\n');
  
  if (isProduction) {
    CLEANUP_CONFIG.dryRun = false;
    console.log('⚠️  PRODUCTION MODE - Changes will be applied!\n');
  } else {
    console.log('👁️  DRY RUN MODE - No changes will be made\n');
  }
  
  const startTime = Date.now();
  const files = getFilesToProcess();
  
  console.log(`📁 Found ${files.length} files to process`);
  console.log(`⚙️  Configuration:`);
  console.log(`   Max files per run: ${CLEANUP_CONFIG.maxFilesPerRun}`);
  console.log(`   Backup files: ${CLEANUP_CONFIG.backupFiles}`);
  console.log(`   Cleanup types: ${Object.entries(CLEANUP_CONFIG.cleanupTypes)
    .filter(([, enabled]) => enabled)
    .map(([type]) => type)
    .join(', ')}`);
  
  const processedFiles = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await processFile(file);
    if (result) {
      processedFiles.push(result);
    }
    
    // Show progress
    if ((i + 1) % 10 === 0 || i === files.length - 1) {
      const progress = ((i + 1) / files.length * 100).toFixed(1);
      console.log(`\n⏳ Progress: ${i + 1}/${files.length} files (${progress}%)`);
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const summary = generateSummary(processedFiles);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Smart Cleanup Complete!');
  console.log('='.repeat(60));
  console.log(`📊 Statistics:`);
  console.log(`   Files processed: ${cleanupStats.filesProcessed}`);
  console.log(`   Imports removed: ${cleanupStats.importsRemoved}`);
  console.log(`   Variables fixed: ${cleanupStats.variablesFixed}`);
  console.log(`   Lines removed: ${cleanupStats.linesRemoved}`);
  console.log(`   Backups created: ${cleanupStats.backupsCreated}`);
  console.log(`   Errors: ${cleanupStats.errors}`);
  console.log(`   Skipped: ${cleanupStats.skipped}`);
  console.log(`   Duration: ${duration}s`);
  
  if (!isProduction) {
    console.log('\n💡 To apply changes, run with --production flag');
  }
  
  console.log(`\n💾 Summary report saved to: reports/cleanup-summary.json`);
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { processFile, cleanupUnusedImports, fixUnusedVariables };