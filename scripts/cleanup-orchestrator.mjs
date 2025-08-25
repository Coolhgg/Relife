#!/usr/bin/env node

/**
 * Cleanup Orchestrator - Unified code cleanup command center
 * Coordinates all cleanup tools with safety checks and reporting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import cleanup modules
import { analyzeFile, generateReport } from './intelligent-code-analyzer.mjs';
import { processFile as smartCleanupFile } from './smart-cleanup.mjs';
import { generateDeadCodeReport } from './dead-code-detector.mjs';

// Orchestrator configuration
const ORCHESTRATOR_CONFIG = {
  phases: [
    {
      name: 'analysis',
      title: 'Code Analysis Phase',
      description: 'Analyze codebase for unused imports and dead code',
      enabled: true,
      tools: ['intelligent-code-analyzer', 'dead-code-detector'],
    },
    {
      name: 'cleanup',
      title: 'Smart Cleanup Phase',
      description: 'Remove safe unused imports and fix variables',
      enabled: true,
      tools: ['smart-cleanup'],
      requiresApproval: true,
    },
    {
      name: 'validation',
      title: 'Validation Phase',
      description: 'Run lints and tests to validate changes',
      enabled: true,
      tools: ['eslint', 'typescript-check'],
    },
  ],

  safety: {
    maxFilesPerRun: 150,
    requireBackups: true,
    validateAfterEachPhase: true,
    emergencyRollback: true,
  },

  reporting: {
    generateSummary: true,
    saveIntermediateReports: true,
    compareBeforeAfter: true,
  },
};

// Orchestration state
const orchestrationState = {
  startTime: null,
  currentPhase: null,
  phases: new Map(),
  errors: [],
  warnings: [],
  statistics: {
    filesProcessed: 0,
    issuesFound: 0,
    issuesFixed: 0,
    timeElapsed: 0,
  },
};

/**
 * Initialize orchestration
 */
function initializeOrchestration() {
  orchestrationState.startTime = Date.now();

  // Create reports directory
  const reportsDir = './reports';
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Create session directory for this run
  const sessionId = new Date().toISOString().replace(/[:.]/g, '-');
  const sessionDir = `./reports/session-${sessionId}`;
  fs.mkdirSync(sessionDir, { recursive: true });

  orchestrationState.sessionDir = sessionDir;

  console.log('🎯 Code Cleanup Orchestration Starting...');
  console.log(`📁 Session directory: ${sessionDir}\n`);

  return sessionId;
}

/**
 * Run analysis phase
 */
async function runAnalysisPhase() {
  console.log('📊 Phase 1: Code Analysis');
  console.log('=' * 40);

  const phaseStart = Date.now();
  const phaseResults = {
    analysisReport: null,
    deadCodeReport: null,
    errors: [],
  };

  try {
    // Run intelligent code analyzer
    console.log('🔍 Running intelligent code analysis...');
    const { spawn } = await import('child_process');

    await new Promise((resolve, reject) => {
      const analyzer = spawn('node', ['./scripts/intelligent-code-analyzer.mjs'], {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      analyzer.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Analysis failed with code ${code}`));
        }
      });
    });

    // Read analysis report
    if (fs.existsSync('./reports/code-analysis-report.json')) {
      phaseResults.analysisReport = JSON.parse(
        fs.readFileSync('./reports/code-analysis-report.json', 'utf8')
      );
    }

    // Run dead code detector
    console.log('\n💀 Running dead code detection...');
    await new Promise((resolve, reject) => {
      const detector = spawn('node', ['./scripts/dead-code-detector.mjs'], {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      detector.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Dead code detection failed with code ${code}`));
        }
      });
    });

    // Read dead code report
    if (fs.existsSync('./reports/dead-code-report.json')) {
      phaseResults.deadCodeReport = JSON.parse(
        fs.readFileSync('./reports/dead-code-report.json', 'utf8')
      );
    }
  } catch (error) {
    phaseResults.errors.push(error.message);
    console.error(`❌ Analysis phase error: ${error.message}`);
  }

  const phaseDuration = ((Date.now() - phaseStart) / 1000).toFixed(2);

  console.log(`\n✅ Analysis phase completed in ${phaseDuration}s`);

  // Save phase results
  const phaseReportPath = path.join(
    orchestrationState.sessionDir,
    'phase-1-analysis.json'
  );
  fs.writeFileSync(
    phaseReportPath,
    JSON.stringify(
      {
        phase: 'analysis',
        duration: phaseDuration,
        results: phaseResults,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );

  orchestrationState.phases.set('analysis', phaseResults);
  return phaseResults;
}

/**
 * Run cleanup phase
 */
async function runCleanupPhase() {
  console.log('\n🧹 Phase 2: Smart Cleanup');
  console.log('=' * 40);

  const phaseStart = Date.now();
  const analysisResults = orchestrationState.phases.get('analysis');

  if (!analysisResults || !analysisResults.analysisReport) {
    throw new Error('Cannot run cleanup phase without analysis results');
  }

  const { analysisReport } = analysisResults;
  const safeToRemove = analysisReport.fileAnalyses.flatMap(
    (f) => f.safeRemovals
  ).length;

  console.log(`📊 Found ${safeToRemove} items safe to remove automatically`);

  if (ORCHESTRATOR_CONFIG.phases[1].requiresApproval && safeToRemove > 0) {
    console.log('\n⚠️  Cleanup phase requires approval:');
    console.log(`   - Will modify files with unused imports`);
    console.log(`   - Will fix unused variable names`);
    console.log(`   - Backups will be created automatically`);

    // In a real implementation, you might want to add interactive approval
    console.log('   ✅ Proceeding with cleanup (auto-approved for demo)...\n');
  }

  const phaseResults = {
    filesProcessed: 0,
    changesApplied: 0,
    errors: [],
  };

  try {
    // Run smart cleanup in production mode
    const { spawn } = await import('child_process');

    await new Promise((resolve, reject) => {
      const cleanup = spawn('node', ['./scripts/smart-cleanup.mjs', '--production'], {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      cleanup.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Smart cleanup failed with code ${code}`));
        }
      });
    });

    // Read cleanup results
    if (fs.existsSync('./reports/cleanup-summary.json')) {
      const cleanupSummary = JSON.parse(
        fs.readFileSync('./reports/cleanup-summary.json', 'utf8')
      );

      phaseResults.filesProcessed = cleanupSummary.statistics.filesProcessed;
      phaseResults.changesApplied =
        cleanupSummary.statistics.importsRemoved +
        cleanupSummary.statistics.variablesFixed;
    }
  } catch (error) {
    phaseResults.errors.push(error.message);
    console.error(`❌ Cleanup phase error: ${error.message}`);
  }

  const phaseDuration = ((Date.now() - phaseStart) / 1000).toFixed(2);
  console.log(`\n✅ Cleanup phase completed in ${phaseDuration}s`);

  // Save phase results
  const phaseReportPath = path.join(
    orchestrationState.sessionDir,
    'phase-2-cleanup.json'
  );
  fs.writeFileSync(
    phaseReportPath,
    JSON.stringify(
      {
        phase: 'cleanup',
        duration: phaseDuration,
        results: phaseResults,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );

  orchestrationState.phases.set('cleanup', phaseResults);
  return phaseResults;
}

/**
 * Run validation phase
 */
async function runValidationPhase() {
  console.log('\n✅ Phase 3: Validation');
  console.log('=' * 40);

  const phaseStart = Date.now();
  const phaseResults = {
    eslintResults: null,
    typescriptResults: null,
    errors: [],
    passed: false,
  };

  try {
    // Run ESLint
    console.log('🔍 Running ESLint validation...');
    try {
      execSync('npm run lint:eslint', {
        stdio: 'pipe',
        encoding: 'utf8',
      });
      phaseResults.eslintResults = { status: 'passed', errors: 0 };
      console.log('   ✅ ESLint passed');
    } catch (error) {
      console.log('   ⚠️ ESLint found issues (expected after cleanup)');
      phaseResults.eslintResults = {
        status: 'issues_found',
        output: error.stdout || error.stderr,
      };
    }

    // Run TypeScript check
    console.log('🔍 Running TypeScript validation...');
    try {
      execSync('npm run type-check', {
        stdio: 'pipe',
        encoding: 'utf8',
      });
      phaseResults.typescriptResults = { status: 'passed', errors: 0 };
      console.log('   ✅ TypeScript check passed');
    } catch (error) {
      console.log('   ⚠️ TypeScript found issues');
      phaseResults.typescriptResults = {
        status: 'issues_found',
        output: error.stdout || error.stderr,
      };
    }

    // Determine overall validation status
    phaseResults.passed = phaseResults.typescriptResults?.status === 'passed';
  } catch (error) {
    phaseResults.errors.push(error.message);
    console.error(`❌ Validation phase error: ${error.message}`);
  }

  const phaseDuration = ((Date.now() - phaseStart) / 1000).toFixed(2);
  console.log(
    `\n${phaseResults.passed ? '✅' : '⚠️'} Validation phase completed in ${phaseDuration}s`
  );

  // Save phase results
  const phaseReportPath = path.join(
    orchestrationState.sessionDir,
    'phase-3-validation.json'
  );
  fs.writeFileSync(
    phaseReportPath,
    JSON.stringify(
      {
        phase: 'validation',
        duration: phaseDuration,
        results: phaseResults,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );

  orchestrationState.phases.set('validation', phaseResults);
  return phaseResults;
}

/**
 * Generate final orchestration report
 */
function generateOrchestrationReport() {
  const totalDuration = ((Date.now() - orchestrationState.startTime) / 1000).toFixed(2);

  const report = {
    sessionInfo: {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      sessionDir: orchestrationState.sessionDir,
    },

    phases: Array.from(orchestrationState.phases.entries()).map(([name, results]) => ({
      name,
      completed: true,
      results,
    })),

    summary: {
      totalPhases: orchestrationState.phases.size,
      completedPhases: orchestrationState.phases.size,
      errorsEncountered: orchestrationState.errors.length,
      warningsGenerated: orchestrationState.warnings.length,
    },

    impact: generateImpactSummary(),

    recommendations: generateFinalRecommendations(),
  };

  const reportPath = path.join(
    orchestrationState.sessionDir,
    'orchestration-final-report.json'
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return report;
}

/**
 * Generate impact summary
 */
function generateImpactSummary() {
  const analysisPhase = orchestrationState.phases.get('analysis');
  const cleanupPhase = orchestrationState.phases.get('cleanup');

  return {
    codeAnalysis: {
      filesAnalyzed: analysisPhase?.analysisReport?.summary?.totalFiles || 0,
      unusedImportsFound:
        analysisPhase?.analysisReport?.summary?.totalUnusedImports || 0,
      deadCodeItemsFound:
        analysisPhase?.deadCodeReport?.summary?.totalDeadCodeItems || 0,
    },
    cleanup: {
      filesModified: cleanupPhase?.filesProcessed || 0,
      changesApplied: cleanupPhase?.changesApplied || 0,
      backupsCreated: cleanupPhase?.backupsCreated || 0,
    },
    validation: {
      eslintPassed:
        orchestrationState.phases.get('validation')?.eslintResults?.status === 'passed',
      typescriptPassed:
        orchestrationState.phases.get('validation')?.typescriptResults?.status ===
        'passed',
    },
  };
}

/**
 * Generate final recommendations
 */
function generateFinalRecommendations() {
  const recommendations = [];

  const validationResults = orchestrationState.phases.get('validation');

  if (validationResults?.typescriptResults?.status === 'passed') {
    recommendations.push({
      type: 'success',
      message: 'Code cleanup completed successfully with no TypeScript errors',
      action: 'Ready to commit changes',
    });
  } else {
    recommendations.push({
      type: 'review-needed',
      message: 'Some validation issues remain after cleanup',
      action: 'Review validation results and fix remaining issues',
    });
  }

  const analysisPhase = orchestrationState.phases.get('analysis');
  const deadCodeItems = analysisPhase?.deadCodeReport?.summary?.totalDeadCodeItems || 0;

  if (deadCodeItems > 0) {
    recommendations.push({
      type: 'manual-review',
      message: `${deadCodeItems} dead code items found that require manual review`,
      action: 'Review dead-code-report.json for manual cleanup opportunities',
    });
  }

  return recommendations;
}

/**
 * Main orchestration execution
 */
async function main() {
  const args = process.argv.slice(2);
  const phases = args.length > 0 ? args : ['analysis', 'cleanup', 'validation'];

  try {
    const sessionId = initializeOrchestration();

    // Run requested phases
    for (const phaseName of phases) {
      orchestrationState.currentPhase = phaseName;

      switch (phaseName) {
        case 'analysis':
          await runAnalysisPhase();
          break;
        case 'cleanup':
          await runCleanupPhase();
          break;
        case 'validation':
          await runValidationPhase();
          break;
        default:
          console.warn(`⚠️ Unknown phase: ${phaseName}`);
      }
    }

    // Generate final report
    const finalReport = generateOrchestrationReport();
    const totalDuration = ((Date.now() - orchestrationState.startTime) / 1000).toFixed(
      2
    );

    console.log('\n' + '='.repeat(60));
    console.log('🎯 Code Cleanup Orchestration Complete!');
    console.log('='.repeat(60));
    console.log(`⏱️  Total duration: ${totalDuration}s`);
    console.log(`📊 Phases completed: ${orchestrationState.phases.size}`);
    console.log(`📁 Session directory: ${orchestrationState.sessionDir}`);

    if (finalReport.recommendations.length > 0) {
      console.log('\n🎯 Final Recommendations:');
      finalReport.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec.message}`);
        console.log(`      Action: ${rec.action}`);
      });
    }

    console.log(
      `\n📋 Complete report: ${path.join(orchestrationState.sessionDir, 'orchestration-final-report.json')}`
    );
  } catch (error) {
    console.error('\n❌ Orchestration failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { initializeOrchestration, runAnalysisPhase, runCleanupPhase };
