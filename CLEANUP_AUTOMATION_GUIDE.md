# 🧹 Code Cleanup Automation - Usage Guide

## 🔧 Available Commands

### Manual Analysis

```bash
# Analyze entire codebase
node scripts/intelligent-code-analyzer.mjs

# Analyze specific directory
node scripts/intelligent-code-analyzer.mjs src/

# Analyze specific files
node scripts/intelligent-code-analyzer.mjs src/components/
```

### Safe Cleanup

```bash
# Dry run (preview changes)
node scripts/smart-cleanup.mjs --mode=dry-run

# Apply safe fixes
node scripts/smart-cleanup.mjs --mode=auto-fix

# Full orchestrated cleanup
node scripts/cleanup-orchestrator.mjs
```

### Pre-commit Integration

- Automatically runs on every commit
- Provides informational analysis
- Won't block commits (development-friendly)
- Suggests cleanup actions when issues found

### GitHub Actions

- **PR Analysis**: Runs on every pull request
- **Scheduled Cleanup**: Weekly maintenance (Sundays 4 AM UTC)
- **Manual Trigger**: Available in Actions tab
- **Modes**: analysis, dry-run, full-cleanup

## 🛡️ Safety Features

### Automatic Backups

All cleanup operations create timestamped backups:

- `filename.js.backup.timestamp`
- Restore with: `mv backup_file original_file`

### Conservative Approach

- Only removes high-confidence unused code
- Preserves essential imports (React, types, tests)
- Cross-reference analysis prevents false positives
- Manual review for uncertain cases

### Pattern Preservation

Protected patterns that are never removed:

- React imports and hooks
- TypeScript type definitions
- Test utilities and mocks
- Configuration and setup files

## 📊 Reports & Monitoring

### Analysis Reports

- `reports/code-analysis-report.json` - Detailed analysis
- `reports/cleanup-summary.json` - Execution summary
- GitHub Actions artifacts for CI/CD runs

### Key Metrics

- Unused imports detected and removed
- Variable naming fixes applied
- Code quality improvement percentage
- Files processed and backup count

## 🔄 Workflow Integration

### Development Workflow

1. **Code** → Pre-commit check provides feedback
2. **PR** → Automated analysis comments on pull request
3. **Merge** → Optional cleanup suggestions
4. **Schedule** → Weekly maintenance cleanup

### CI/CD Integration

- Integrates with existing quality checks
- Preserves current lint and format workflows
- Adds cleanup analysis without disruption
- Artifact retention for audit trails

## 🎯 Best Practices

### Regular Usage

- Run analysis before major refactors
- Use dry-run mode to preview changes
- Review cleanup suggestions in PRs
- Schedule regular maintenance cleanups

### Team Workflow

- Include cleanup in code review process
- Document any custom preservation patterns
- Share cleanup reports in team updates
- Monitor automation success in CI/CD

## 🚀 Advanced Usage

### Custom Configuration

- Modify preservation patterns in analyzer
- Adjust confidence thresholds in cleanup
- Customize automation schedules
- Add project-specific exclusions

### Monitoring & Alerts

- GitHub Actions provide automated reporting
- Workflow artifacts for historical analysis
- Failed automation creates issues automatically
- Integration with existing notification systems

---

**Generated**: 2025-08-25T08:23:45.650Z **System**: Intelligent Code Cleanup System v1.0
