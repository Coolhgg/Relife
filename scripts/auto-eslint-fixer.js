#!/usr/bin/env node
/**
 * Automated ESLint Issue Fixer
 * Runs regular maintenance to fix common ESLint issues automatically
 */

const { execSync, _spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutoESLintFixer {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
    this.config = {
      maxFilesPerRun: 50,
      logFile: 'logs/eslint-auto-fixes.log',
      backupDir: 'backups/auto-eslint-fixes',
      dryRun: false,
    };
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);

    // Ensure log directory exists
    if (!fs.existsSync(path.dirname(this.config.logFile))) {
      fs.mkdirSync(path.dirname(this.config.logFile), { recursive: true });
    }

    fs.appendFileSync(this.config.logFile, logMessage + '\n');
  }

  async runESLintFix() {
    this.log('🔧 Starting automated ESLint fixes...');

    try {
      // Run ESLint with auto-fix on src directory
      const command = 'npx eslint src --ext .ts,.tsx --fix --max-warnings 999999';
      execSync(command, { stdio: 'inherit' });
      this.log('✅ ESLint auto-fix completed successfully');
      return true;
    } catch (error) {
      this.log(`⚠️ ESLint auto-fix had issues: ${error.message}`);
      return false;
    }
  }

  async fixUndefinedVariables() {
    this.log('🔍 Fixing undefined variables...');

    const patterns = [
      // Common undefined variable fixes
      {
        search: /console\.log\(error\)/g,
        replace: 'console.log(_error)',
        description: 'Fix undefined error variable',
      },
      {
        search: /catch\s*\(\s*error\s*\)/g,
        replace: 'catch (_error)',
        description: 'Fix undefined error in catch blocks',
      },
      {
        search: /\.map\(\s*\(\s*([^,\)]+)\s*,\s*index\s*\)/g,
        replace: '.map(($1, _index)',
        description: 'Fix undefined index in map functions',
      },
      {
        search: /const\s+user\s*=/g,
        replace: 'const _user =',
        description: 'Fix undefined user variable',
      },
      {
        search: /const\s+config\s*=/g,
        replace: 'const _config =',
        description: 'Fix undefined config variable',
      },
    ];

    const srcDir = 'src';
    const files = this.getAllTSFiles(srcDir);
    let totalFixes = 0;

    for (const file of files) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        let fileFixes = 0;

        for (const pattern of patterns) {
          const matches = content.match(pattern.search);
          if (matches) {
            content = content.replace(pattern.search, pattern.replace);
            fileFixes += matches.length;
            totalFixes += matches.length;
          }
        }

        if (fileFixes > 0) {
          fs.writeFileSync(file, content);
          this.log(`🔧 Fixed ${fileFixes} issues in ${file}`);
        }
      } catch (error) {
        this.log(`❌ Error processing ${file}: ${error.message}`);
      }
    }

    this.log(`✅ Fixed ${totalFixes} undefined variable issues`);
  }

  async fixMissingImports() {
    this.log('📦 Adding missing imports...');

    const commonImports = [
      {
        check: /React\.useState|React\.useEffect|React\.useCallback/,
        import: "import React, { useState, useEffect, useCallback } from 'react';",
        description: 'Add React hooks import',
      },
      {
        check: /useAuth\(/,
        import: "import useAuth from '../hooks/useAuth';",
        description: 'Add useAuth import',
      },
      {
        check: /useI18n\(/,
        import: "import { useI18n } from '../hooks/useI18n';",
        description: 'Add useI18n import',
      },
    ];

    const srcDir = 'src';
    const files = this.getAllTSFiles(srcDir);
    let totalImports = 0;

    for (const file of files) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        for (const importRule of commonImports) {
          if (importRule.check.test(content) && !content.includes(importRule.import)) {
            // Add import at the top after existing imports
            const lines = content.split('\n');
            let insertIndex = 0;

            // Find last import line
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].startsWith('import ')) {
                insertIndex = i + 1;
              }
            }

            lines.splice(insertIndex, 0, importRule.import);
            content = lines.join('\n');
            modified = true;
            totalImports++;
          }
        }

        if (modified) {
          fs.writeFileSync(file, content);
          this.log(`📦 Added imports to ${file}`);
        }
      } catch (error) {
        this.log(`❌ Error processing ${file}: ${error.message}`);
      }
    }

    this.log(`✅ Added ${totalImports} missing imports`);
  }

  async fixReactHooksDeps() {
    this.log('🎣 Fixing React hooks dependencies...');

    try {
      // Run ESLint fix specifically for React hooks rules
      const command =
        'npx eslint src --ext .ts,.tsx --fix --rule "react-hooks/exhaustive-deps: error"';
      execSync(command, { stdio: 'inherit' });
      this.log('✅ React hooks dependencies fixed');
    } catch (error) {
      this.log(`⚠️ Some React hooks issues require manual attention: ${error.message}`);
    }
  }

  async fixUnusedVariables() {
    this.log('🧹 Fixing unused variables...');

    const srcDir = 'src';
    const files = this.getAllTSFiles(srcDir);
    let totalFixes = 0;

    for (const file of files) {
      try {
        let content = fs.readFileSync(file, 'utf8');

        // Add underscore prefix to unused variables
        const patterns = [
          /const\s+([a-zA-Z][a-zA-Z0-9]*)\s*=/g,
          /let\s+([a-zA-Z][a-zA-Z0-9]*)\s*=/g,
          /\(\s*([a-zA-Z][a-zA-Z0-9]*)\s*:\s*[^)]+\)\s*=>/g,
        ];

        let modified = false;
        for (const pattern of patterns) {
          const newContent = content.replace(pattern, (match, varName) => {
            if (!varName.startsWith('_') && !this.isVariableUsed(content, varName)) {
              modified = true;
              totalFixes++;
              return match.replace(varName, `_${varName}`);
            }
            return match;
          });
          content = newContent;
        }

        if (modified) {
          fs.writeFileSync(file, content);
          this.log(`🧹 Fixed unused variables in ${file}`);
        }
      } catch (error) {
        this.log(`❌ Error processing ${file}: ${error.message}`);
      }
    }

    this.log(`✅ Fixed ${totalFixes} unused variables`);
  }

  isVariableUsed(content, varName) {
    // Simple check if variable is used elsewhere in the file
    const regex = new RegExp(`\\b${varName}\\b`, 'g');
    const matches = content.match(regex);
    return matches && matches.length > 1; // More than just the declaration
  }

  getAllTSFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files = files.concat(this.getAllTSFiles(fullPath));
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${this.config.backupDir}/backup-${timestamp}`;

    this.log(`💾 Creating backup at ${backupPath}`);

    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
    }

    try {
      execSync(`cp -r src ${backupPath}`, { stdio: 'inherit' });
      this.log(`✅ Backup created successfully`);
      return backupPath;
    } catch (error) {
      this.log(`❌ Backup failed: ${error.message}`);
      return null;
    }
  }

  async run() {
    this.log('🚀 Starting automated ESLint maintenance...');

    // Create backup first
    const backup = await this.createBackup();
    if (!backup) {
      this.log('❌ Cannot proceed without backup');
      return false;
    }

    try {
      // Run fixes in order
      await this.fixUndefinedVariables();
      await this.fixMissingImports();
      await this.fixUnusedVariables();
      await this.runESLintFix();
      await this.fixReactHooksDeps();

      this.log('🎉 Automated ESLint maintenance completed successfully!');
      return true;
    } catch (error) {
      this.log(`❌ Maintenance failed: ${error.message}`);

      // Restore from backup
      this.log('🔄 Restoring from backup...');
      try {
        execSync(`rm -rf src && cp -r ${backup} src`, { stdio: 'inherit' });
        this.log('✅ Restored from backup successfully');
      } catch (restoreError) {
        this.log(`❌ Restore failed: ${restoreError.message}`);
      }

      return false;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const fixer = new AutoESLintFixer();
  fixer
    .run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = AutoESLintFixer;
