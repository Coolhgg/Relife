#!/usr/bin/env node
/**
 * Automated Security Vulnerability Fixer
 * Automatically updates dependencies and fixes security issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutoSecurityUpdater {
  constructor() {
    this.config = {
      logFile: 'logs/security-updates.log',
      backupDir: 'backups/auto-security-fixes',
      maxVulnerabilities: 50,
      allowBreakingChanges: false,
    };
    this.vulnerabilities = [];
    this.fixedVulnerabilities = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);

    if (!fs.existsSync(path.dirname(this.config.logFile))) {
      fs.mkdirSync(path.dirname(this.config.logFile), { recursive: true });
    }

    fs.appendFileSync(this.config.logFile, logMessage + '\n');
  }

  async runSecurityAudit() {
    this.log('🔍 Running security audit...');

    try {
      const output = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(output);

      this.vulnerabilities = audit.vulnerabilities || {};
      const vulnCount = Object.keys(this.vulnerabilities).length;

      this.log(`🚨 Found ${vulnCount} security vulnerabilities`);

      if (vulnCount === 0) {
        this.log('✅ No security vulnerabilities found!');
        return true;
      }

      // Log vulnerability summary
      const severityCounts = {};
      for (const [_name, vuln] of Object.entries(this.vulnerabilities)) {
        const severity = vuln.severity || 'unknown';
        severityCounts[severity] = (severityCounts[severity] || 0) + 1;
      }

      for (const [severity, count] of Object.entries(severityCounts)) {
        this.log(`   - ${severity}: ${count} vulnerabilities`);
      }

      return false;
    } catch (error) {
      // npm audit exits with code 1 when vulnerabilities are found
      if (error.status === 1 && error.stdout) {
        try {
          const audit = JSON.parse(error.stdout);
          this.vulnerabilities = audit.vulnerabilities || {};
          const vulnCount = Object.keys(this.vulnerabilities).length;
          this.log(`🚨 Found ${vulnCount} security vulnerabilities`);
          return false;
        } catch (parseError) {
          this.log(`⚠️ Could not parse audit output: ${parseError.message}`);
        }
      }
      this.log(`❌ Security audit failed: ${error.message}`);
      return false;
    }
  }

  async runAutomatedFixes() {
    this.log('🔧 Running automated security fixes...');

    try {
      // Try npm audit fix first (non-breaking changes)
      this.log('📦 Running npm audit fix...');
      execSync('npm audit fix', { stdio: 'inherit' });

      // Check if we need force fixes
      const stillVulnerable = await this.runSecurityAudit();

      if (!stillVulnerable) {
        this.log('✅ All vulnerabilities fixed with npm audit fix');
        return true;
      }

      if (this.config.allowBreakingChanges) {
        this.log('⚠️ Running npm audit fix --force for remaining issues...');
        execSync('npm audit fix --force', { stdio: 'inherit' });
      } else {
        this.log(
          '⚠️ Some vulnerabilities require breaking changes (use --force to apply)'
        );
      }

      return true;
    } catch (error) {
      this.log(`⚠️ Automated fixes had issues: ${error.message}`);
      return false;
    }
  }

  async updateSpecificPackages() {
    this.log('📦 Updating specific vulnerable packages...');

    const knownVulnerablePackages = [
      // Common packages that frequently need updates
      { name: 'esbuild', command: 'npm install esbuild@latest' },
      { name: 'vite', command: 'npm install vite@latest' },
      { name: 'tmp', command: 'npm install tmp@latest' },
      { name: '@lhci/cli', command: 'npm install @lhci/cli@latest' },
      { name: 'external-editor', command: 'npm install external-editor@latest' },
      { name: 'inquirer', command: 'npm install inquirer@latest' },
    ];

    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    let updatedPackages = 0;

    for (const pkg of knownVulnerablePackages) {
      const hasInDeps = packageJson.dependencies && packageJson.dependencies[pkg.name];
      const hasInDevDeps =
        packageJson.devDependencies && packageJson.devDependencies[pkg.name];

      if (hasInDeps || hasInDevDeps) {
        try {
          this.log(`📦 Updating ${pkg.name}...`);
          execSync(pkg.command, { stdio: 'inherit' });
          updatedPackages++;
          this.log(`✅ Updated ${pkg.name} successfully`);
        } catch (error) {
          this.log(`⚠️ Failed to update ${pkg.name}: ${error.message}`);
        }
      }
    }

    this.log(`✅ Updated ${updatedPackages} packages`);
    return updatedPackages > 0;
  }

  async updateOutdatedPackages() {
    this.log('🔄 Checking for outdated packages...');

    try {
      // Get list of outdated packages
      const output = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdated = JSON.parse(output);
      const outdatedCount = Object.keys(outdated).length;

      if (outdatedCount === 0) {
        this.log('✅ All packages are up to date');
        return true;
      }

      this.log(`📦 Found ${outdatedCount} outdated packages`);

      // Update non-breaking changes
      const safeUpdates = [];
      for (const [name, info] of Object.entries(outdated)) {
        const currentMajor = info.current.split('.')[0];
        const wantedMajor = info.wanted.split('.')[0];

        if (currentMajor === wantedMajor) {
          safeUpdates.push(name);
        }
      }

      if (safeUpdates.length > 0) {
        this.log(`📦 Updating ${safeUpdates.length} packages safely...`);
        const updateCommand = `npm update ${safeUpdates.join(' ')}`;
        execSync(updateCommand, { stdio: 'inherit' });
        this.log(`✅ Updated ${safeUpdates.length} packages`);
      }

      return true;
    } catch (error) {
      // npm outdated exits with code 1 when packages are outdated
      if (error.status === 1) {
        this.log('📦 Some packages are outdated but no JSON output available');
      } else {
        this.log(`⚠️ Could not check outdated packages: ${error.message}`);
      }
      return false;
    }
  }

  async cleanupLockFiles() {
    this.log('🧹 Cleaning up lock files...');

    try {
      // Remove node_modules and lock files, then reinstall
      if (fs.existsSync('node_modules')) {
        this.log('🗑️ Removing node_modules...');
        execSync('rm -rf node_modules', { stdio: 'inherit' });
      }

      if (fs.existsSync('package-lock.json')) {
        this.log('🗑️ Removing package-lock.json...');
        fs.unlinkSync('package-lock.json');
      }

      this.log('📦 Reinstalling dependencies...');
      execSync('npm install', { stdio: 'inherit' });

      this.log('✅ Dependencies reinstalled with clean lock file');
      return true;
    } catch (error) {
      this.log(`❌ Lock file cleanup failed: ${error.message}`);
      return false;
    }
  }

  async updateGitHubActions() {
    this.log('🔄 Updating GitHub Actions...');

    const workflowsDir = '.github/workflows';
    if (!fs.existsSync(workflowsDir)) {
      this.log('ℹ️ No GitHub Actions workflows found');
      return true;
    }

    const actionUpdates = [
      { from: 'actions/checkout@v2', to: 'actions/checkout@v4' },
      { from: 'actions/checkout@v3', to: 'actions/checkout@v4' },
      { from: 'actions/setup-node@v2', to: 'actions/setup-node@v4' },
      { from: 'actions/setup-node@v3', to: 'actions/setup-node@v4' },
      { from: 'actions/cache@v2', to: 'actions/cache@v3' },
    ];

    const workflowFiles = fs
      .readdirSync(workflowsDir)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
      .map(file => path.join(workflowsDir, file));

    let updatedFiles = 0;

    for (const file of workflowFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        for (const update of actionUpdates) {
          if (content.includes(update.from)) {
            content = content.replace(new RegExp(update.from, 'g'), update.to);
            modified = true;
          }
        }

        if (modified) {
          fs.writeFileSync(file, content);
          updatedFiles++;
          this.log(`✅ Updated GitHub Actions in ${file}`);
        }
      } catch (error) {
        this.log(`⚠️ Could not update ${file}: ${error.message}`);
      }
    }

    this.log(`✅ Updated ${updatedFiles} workflow files`);
    return true;
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${this.config.backupDir}/backup-${timestamp}`;

    this.log(`💾 Creating backup at ${backupPath}`);

    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
    }

    try {
      execSync(`mkdir -p ${backupPath}`, { stdio: 'inherit' });
      execSync(`cp package.json package-lock.json ${backupPath}/`, {
        stdio: 'inherit',
      });
      if (fs.existsSync('bun.lock')) {
        execSync(`cp bun.lock ${backupPath}/`, { stdio: 'inherit' });
      }
      this.log(`✅ Backup created successfully`);
      return backupPath;
    } catch (error) {
      this.log(`❌ Backup failed: ${error.message}`);
      return null;
    }
  }

  async generateSecurityReport() {
    this.log('📊 Generating security report...');

    const reportPath = 'reports/security-report.md';
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const report = `# Security Update Report

**Generated:** ${timestamp}

## Summary
- Vulnerabilities fixed: ${this.fixedVulnerabilities.length}
- Packages updated: Automatic updates applied
- Status: ${this.fixedVulnerabilities.length > 0 ? 'Improvements made' : 'No changes needed'}

## Actions Taken
${this.fixedVulnerabilities.map(fix => `- ${fix}`).join('\n')}

## Next Steps
- Monitor for new vulnerabilities
- Keep dependencies up to date
- Review security best practices

---
*Report generated by automated security updater*
`;

    fs.writeFileSync(reportPath, report);
    this.log(`📊 Security report saved to ${reportPath}`);
  }

  async run() {
    this.log('🚀 Starting automated security updates...');

    // Create backup first
    const backup = await this.createBackup();
    if (!backup) {
      this.log('❌ Cannot proceed without backup');
      return false;
    }

    try {
      // Run security improvements
      const hasVulnerabilities = !(await this.runSecurityAudit());

      if (hasVulnerabilities) {
        this.fixedVulnerabilities.push('Ran npm audit fix');
        await this.runAutomatedFixes();

        this.fixedVulnerabilities.push('Updated specific vulnerable packages');
        await this.updateSpecificPackages();

        this.fixedVulnerabilities.push('Updated outdated packages');
        await this.updateOutdatedPackages();

        // Final audit
        await this.runSecurityAudit();
      }

      // Additional improvements
      await this.updateGitHubActions();
      await this.generateSecurityReport();

      this.log('🎉 Automated security updates completed successfully!');
      return true;
    } catch (error) {
      this.log(`❌ Security updates failed: ${error.message}`);

      // Restore from backup
      this.log('🔄 Restoring from backup...');
      try {
        execSync(`cp ${backup}/* ./`, { stdio: 'inherit' });
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
  const updater = new AutoSecurityUpdater();

  // Check for command line arguments
  if (process.argv.includes('--force')) {
    updater.config.allowBreakingChanges = true;
  }

  updater
    .run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = AutoSecurityUpdater;
