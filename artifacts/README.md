# Artifacts Directory

This directory contains reports, logs, and artifacts generated during CI/CD processes and development workflows.

## Structure

```
artifacts/
├── ci-reports/           # CI/CD pipeline reports
│   ├── tsc-reports/     # TypeScript compilation reports
│   ├── eslint-reports/  # ESLint violation reports  
│   ├── coverage/        # Coverage reports and summaries
│   ├── build-reports/   # Build validation reports
│   └── integration/     # Integration test artifacts
├── quality-gates/       # Quality gate enforcement artifacts
│   ├── violations/      # Current and historical violations
│   ├── thresholds/      # Coverage and quality thresholds
│   └── enforcement/     # Quality gate enforcement logs
├── security/            # Security audit artifacts
│   ├── dependency-audits/ # npm/bun audit results
│   └── vulnerability-scans/ # Security scan reports
└── legacy/              # Legacy artifacts from previous processes
```

## File Types

### CI/CD Reports
- `tsc-report.log` - TypeScript compilation logs
- `eslint-report.json` - ESLint violations in JSON format
- `coverage-summary.json` - Test coverage summary
- `build-validation.log` - Build process validation logs

### Quality Gate Artifacts  
- `violation-tracking.json` - Historical violation tracking
- `violation-summary.md` - Human-readable violation summaries
- `quality-gate-status.json` - Current quality gate status

### Security Artifacts
- `audit-results.json` - Security audit results
- `dependency-vulnerabilities.json` - Known vulnerabilities

## Quality Gates Integration

The quality gates CI workflow (`.github/workflows/ci-quality-gates.yml`) automatically generates and uploads the following artifacts:

1. **TypeScript Reports** - Compilation errors and warnings
2. **ESLint Reports** - Code quality violations with severity levels
3. **Coverage Reports** - Test coverage with threshold enforcement
4. **Build Artifacts** - Production build validation results
5. **Integration Test Results** - End-to-end workflow validation

## Artifact Retention

- **CI Reports**: 30 days retention
- **Coverage Reports**: 30 days retention  
- **Build Artifacts**: 7 days retention
- **Security Audits**: 90 days retention

## Usage in CI/CD

These artifacts are automatically:
- Generated during CI runs
- Uploaded to GitHub Actions artifacts
- Used for quality gate enforcement
- Referenced in PR status comments
- Archived for historical analysis

## Access

- **Developers**: Can download artifacts from GitHub Actions runs
- **CI/CD**: Automatically processes artifacts for quality gate decisions  
- **Quality Teams**: Can analyze historical trends and patterns

## Quality Standards

All artifacts follow these standards:
- JSON format for machine-readable data
- Markdown format for human-readable summaries
- Structured logging with timestamps
- Consistent naming conventions
- Proper retention policies

## Historical Context

This directory contains artifacts from various phases of the project:
- Phase 1-4: ESLint violation resolution (2024)
- Ongoing: Quality gate enforcement artifacts
- Legacy: Pre-quality-gate development artifacts

See individual files for specific documentation and context.