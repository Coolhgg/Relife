# Enhanced Quality System Setup Guide

This guide will help you quickly enable the enhanced quality system to prevent ESLint issues and
other code quality problems from reoccurring.

## 🚀 Quick Start (5 minutes)

### 1. Enable Enhanced Pre-commit Hooks

Replace your current pre-commit hook with the enhanced version:

```bash
# Backup current hook
cp .husky/pre-commit .husky/pre-commit.backup

# Enable enhanced pre-commit
cp .husky/pre-commit-enhanced .husky/pre-commit

# Make sure scripts are executable
chmod +x scripts/intelligent-eslint-fix.js
chmod +x scripts/react-hooks-enforcer.js
chmod +x scripts/enhanced-commit-validator.js
chmod +x scripts/bundle-size-monitor.js
```

### 2. Test the System

```bash
# Test the enhanced pre-commit hook
.husky/pre-commit-enhanced

# Test individual tools
node scripts/intelligent-eslint-fix.js --verbose
node scripts/react-hooks-enforcer.js --verbose
```

### 3. Add Quality Scripts to package.json

Add these scripts to your `package.json` for easy access:

```json
{
  "scripts": {
    "quality:fix": "node scripts/intelligent-eslint-fix.js --verbose",
    "quality:hooks": "node scripts/react-hooks-enforcer.js --verbose",
    "quality:hooks:strict": "node scripts/react-hooks-enforcer.js --strict --verbose",
    "quality:check": "bun run type-check && bun run quality:fix && bun run quality:hooks && bun run format",
    "bundle:check": "node scripts/bundle-size-monitor.js"
  }
}
```

## 🛠️ What You Get

### Intelligent ESLint Auto-Fixing

- **Auto-fixes safe issues**: Unused imports, variables (prefixed with `_`)
- **Warns about risky issues**: React hook dependencies that might cause infinite loops
- **Context-aware suggestions**: Smart recommendations based on code patterns

### React Hooks Dependency Enforcement

- **Prevents infinite re-renders**: Detects problematic hook dependency patterns
- **Risk analysis**: Identifies high-risk dependencies (setState, dispatch functions)
- **Smart suggestions**: Context-aware recommendations for fixing dependencies

### Enhanced Commit Message Validation

- **Conventional commits**: Enforces consistent commit format
- **Project-specific types**: Supports your domain-specific commit types (`mobile`, `premium`,
  `gaming`, etc.)
- **Intelligent suggestions**: Helps write better commit messages

### Bundle Size Monitoring

- **Performance protection**: Prevents bundle size regressions
- **Detailed analysis**: Shows which files are approaching size limits
- **Optimization suggestions**: Recommendations for reducing bundle size

## 📋 Daily Usage

### Before Committing

The enhanced pre-commit hook automatically runs and:

1. ✅ Validates TypeScript compilation
2. 🔧 Auto-fixes safe ESLint issues
3. ⚠️ Warns about React hook dependencies
4. 💅 Fixes code formatting
5. 📦 Checks bundle size limits
6. 🔒 Scans for hardcoded secrets

### Manual Quality Checks

```bash
# Fix all auto-fixable issues
bun run quality:check

# Check React hook dependencies (strict mode)
bun run quality:hooks:strict

# Monitor bundle size
bun run bundle:check
```

### Handling Warnings

When you see **React Hook dependency warnings**:

1. Review the suggestions carefully
2. Test your changes thoroughly
3. Consider if dependencies are truly needed
4. Use `useCallback`/`useMemo` for object dependencies

## 🚨 Troubleshooting

### "Critical ESLint issues found"

```bash
# Run intelligent fixer to see details
node scripts/intelligent-eslint-fix.js --verbose

# Manual fixes may be needed for complex issues
bun run lint:fix
```

### "React Hook dependency issues found"

```bash
# Get detailed analysis
node scripts/react-hooks-enforcer.js --verbose

# This is often fixable but requires careful review
# Test thoroughly after fixing to prevent infinite loops
```

### "Bundle size exceeds limits"

```bash
# Analyze bundle composition
node scripts/bundle-size-monitor.js

# Consider:
# - Dynamic imports for large components
# - Code splitting
# - Removing unused dependencies
```

### "Commit message validation failed"

```bash
# Use conventional commit format:
# type(scope): description
#
# Examples:
# feat(alarm): add smart snooze feature
# fix(auth): resolve login timeout issue
# docs(api): update authentication guide
```

## ⚙️ Customization

### Adjust Hook Dependency Strictness

Edit `.husky/pre-commit-enhanced` to change React hooks enforcement:

```bash
# Strict mode (blocks commits on hook issues)
node scripts/react-hooks-enforcer.js --strict --verbose

# Warning mode (allows commits with warnings)
node scripts/react-hooks-enforcer.js --verbose
```

### Modify Bundle Size Limits

Edit `scripts/bundle-size-monitor.js` to adjust limits:

```javascript
limits: {
  'assets/*.js': 600 * 1024, // Increase JS limit to 600KB
  'assets/*.css': 120 * 1024, // Increase CSS limit to 120KB
  'index.html': 50 * 1024     // Keep HTML limit at 50KB
}
```

### Add Custom ESLint Rules

The intelligent ESLint fixer respects your `eslint.config.js` configuration. Add custom rules there
and they'll be automatically applied.

## 🎯 Success Indicators

After setup, you should see:

- ✅ **Fewer ESLint issues** in PRs and code reviews
- ✅ **No more React hook infinite loops** from missing dependencies
- ✅ **Consistent commit messages** following conventional format
- ✅ **Stable bundle size** without performance regressions
- ✅ **Auto-fixed formatting** and safe code issues

## 📚 Full Documentation

For complete details, see: [`docs/ENHANCED_QUALITY_SYSTEM.md`](docs/ENHANCED_QUALITY_SYSTEM.md)

## 🔄 Migration from Old System

If you had previous pre-commit hooks:

```bash
# Your old hooks are backed up as .backup files
# You can compare configurations:
diff .husky/pre-commit.backup .husky/pre-commit-enhanced

# The enhanced system is backwards compatible with:
# - Your existing lint-staged configuration
# - Current ESLint rules
# - Existing commitlint setup
```

---

**Need help?** The enhanced quality system is designed to be helpful, not obstructive. If you
encounter issues, the verbose output will guide you to solutions. Most issues can be auto-fixed or
resolved with the provided suggestions.
