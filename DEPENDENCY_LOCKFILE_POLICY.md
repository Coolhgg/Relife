# Dependency Lockfile Policy

## Overview

This document outlines the dependency lockfile management strategy for the Relife project to ensure consistent builds and prevent dependency drift that can cause compatibility issues.

## Current State

### Lockfile Management
- **Package Manager**: Bun (primary)
- **Lockfile**: `bun.lock`
- **Status**: ✅ Tracked in git
- **Format**: Binary lockfile managed by Bun

### Dependency Alignment
The project has been aligned to use compatible Jest and ts-jest versions:
- **Jest**: `^29.7.0` (downgraded from ^30.0.5)
- **@types/jest**: `^29.5.12` (downgraded from ^30.0.0)
- **ts-jest**: `^29.2.5` (stable version)

**Rationale**: Jest v30 is not compatible with ts-jest v29. Using Jest 29.7.0 ensures stable testing functionality.

## CI/CD Integration

### Frozen Installations
All CI workflows use frozen lockfile installations to ensure reproducible builds:

```yaml
- name: Install dependencies
  run: bun install --frozen-lockfile
```

**Workflows using frozen installs**:
- `.github/workflows/enhanced-ci-cd.yml`
- `.github/workflows/pr-validation.yml` 
- Mobile build workflows

### Benefits
- **Reproducible builds**: Same dependency versions across all environments
- **Security**: Prevents unexpected dependency updates during CI
- **Reliability**: Avoids build failures due to version conflicts
- **Performance**: Faster installs when lockfile is present

## Development Guidelines

### Local Development
```bash
# Install dependencies (respects lockfile)
bun install

# Update dependencies (updates lockfile)
bun update

# Force fresh install from lockfile
bun install --frozen-lockfile
```

### Dependency Updates
1. **Review changes**: Always review package.json and lockfile changes
2. **Test thoroughly**: Run full test suite after dependency updates
3. **Check compatibility**: Verify major version changes are compatible
4. **Update gradually**: Update dependencies incrementally, not all at once

### Branch Workflow
- **Feature branches**: Include lockfile changes in same commit as package.json changes
- **PR reviews**: Review lockfile changes for unexpected version jumps
- **Merge conflicts**: Resolve by running `bun install` and committing the updated lockfile

## Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules
bun install
```

#### Lockfile conflicts during merge
```bash
# Delete lockfile and reinstall
rm bun.lock
bun install
# Commit the regenerated lockfile
```

#### CI failing with dependency issues
1. Check if package.json and lockfile are in sync
2. Verify all dependencies have compatible versions
3. Run `bun install --frozen-lockfile` locally to reproduce

## Monitoring and Maintenance

### Regular Tasks
- **Weekly**: Check for security updates using `bun audit`
- **Monthly**: Review outdated dependencies with `bun outdated`
- **Quarterly**: Major version updates and compatibility testing

### Security
- Lockfile prevents malicious dependency injection during installation
- All dependency versions are explicitly locked
- CI fails if lockfile is missing or incompatible

## Jest/ts-jest Compatibility Matrix

| Jest Version | ts-jest Version | Status |
|--------------|-----------------|---------|
| ^29.7.0 | ^29.2.5 | ✅ Compatible (Current) |
| ^30.x | ^29.2.5 | ❌ Incompatible |
| ^30.x | ^30.x | 🚧 In development |

## Future Considerations

### Jest v30 Migration
- Monitor ts-jest development for Jest 30 support
- Plan migration when ts-jest ^30 becomes stable
- Test compatibility before upgrading

### Alternative Package Managers
- Primary: Bun (fastest, modern)
- Fallback: npm (compatibility)
- Not recommended: yarn (complexity)

---

**Last Updated**: Step 3 - Dependency Resolution Project  
**Next Review**: After Jest v30 + ts-jest compatibility is resolved