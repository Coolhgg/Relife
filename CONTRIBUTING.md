# Contributing to Relife

Thank you for your interest in contributing to the Relife project! This guide will help you understand our development workflow and standards.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Dependency Management](#dependency-management)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

## Getting Started

### Prerequisites

- **Node.js**: Version 18 or 20 (see `.github/workflows` for exact versions)
- **Bun**: Latest version (primary package manager)
- **Git**: Latest version
- **Java**: Version 17 (for Android builds)

### Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Coolhgg/Relife.git
   cd Relife
   ```

2. **Install dependencies**:

   ```bash
   bun install --frozen-lockfile
   ```

3. **Run the development server**:

   ```bash
   bun run dev
   ```

4. **Run tests**:
   ```bash
   bun run test
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/description` - New features
- `fix/description` - Bug fixes
- `chore/description` - Maintenance tasks
- `docs/description` - Documentation updates

### Commit Messages

Follow conventional commit format:

```
type(scope): description

body (optional)

footer (optional)
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:

```
feat(auth): add Google OAuth integration
fix(deps): resolve Jest/ts-jest compatibility issue
docs(api): update authentication endpoints
```

## Dependency Management

### 🔒 Critical: Dependency Compatibility

This project maintains strict dependency compatibility rules to prevent build failures and security issues.

#### Jest/ts-jest Compatibility

**Current Stable Configuration**:

- Jest: `^29.7.0`
- ts-jest: `^29.2.5`
- @types/jest: `^29.5.12`

**❌ Known Incompatibilities**:

- Jest `^30.x` + ts-jest `^29.x` → **INCOMPATIBLE**
- Wait for ts-jest `^30.x` before upgrading Jest to v30

#### Package Manager

**Primary**: Bun (fastest, modern toolchain)

- Use `bun install --frozen-lockfile` in production/CI
- Lockfile: `bun.lock` (binary format, tracked in git)

**Fallback**: npm (compatibility only)

- Use only if Bun fails
- Convert back to Bun when possible

### Adding Dependencies

1. **Check compatibility** first:

   ```bash
   # Check current compatibility
   node scripts/check-dependency-compatibility.cjs
   ```

2. **Add the dependency**:

   ```bash
   bun add package-name
   # or for dev dependencies
   bun add -d package-name
   ```

3. **Test thoroughly**:

   ```bash
   bun run test
   bun run build
   ```

4. **Commit lockfile changes** with package.json:
   ```bash
   git add package.json bun.lock
   git commit -m "deps: add package-name for feature"
   ```

### Updating Dependencies

⚠️ **Update dependencies gradually, not all at once**

1. **Check for outdated packages**:

   ```bash
   bun outdated
   ```

2. **Update specific packages**:

   ```bash
   bun update package-name
   ```

3. **Run compatibility check**:

   ```bash
   node scripts/check-dependency-compatibility.cjs
   ```

4. **Test thoroughly**:
   ```bash
   bun run test:coverage
   bun run build
   bun run type-check
   ```

### Security Updates

- **Weekly**: Run `bun audit` to check for vulnerabilities
- **Critical**: Update security patches immediately
- **Document** any version constraints in PR description

## Code Standards

### TypeScript

- **Strict mode**: All TypeScript strict checks enabled
- **No `any` types**: Use proper typing or `unknown`
- **ESLint**: Follow configured rules strictly
- **Prettier**: Auto-format on save

### React

- **Functional components**: Use hooks instead of class components
- **TypeScript**: All components must be typed
- **Testing**: Each component needs corresponding test file

### File Organization

```
src/
├── components/         # Reusable UI components
├── pages/             # Route components
├── services/          # Business logic and API calls
├── utils/             # Pure utility functions
├── types/             # TypeScript type definitions
├── hooks/             # Custom React hooks
└── __tests__/         # Test files (co-located with source)
```

## Testing

### Test Requirements

- **Unit tests**: All services and utilities must have tests
- **Component tests**: All components must have rendering tests
- **Integration tests**: Critical user flows must be tested
- **Coverage**: Maintain >80% overall coverage

### Test Commands

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Run specific test file
bun test path/to/test.ts
```

### Test Structure

```typescript
// Good test structure
describe("AlarmService", () => {
  beforeEach(() => {
    // Setup
  });

  describe("createAlarm", () => {
    it("should create alarm with valid data", () => {
      // Test implementation
    });

    it("should throw error with invalid data", () => {
      // Test implementation
    });
  });
});
```

## Pull Request Process

### Before Creating a PR

1. **Run full test suite**:

   ```bash
   bun run test:coverage
   bun run build
   bun run lint
   bun run type-check
   ```

2. **Check dependency compatibility**:

   ```bash
   node scripts/check-dependency-compatibility.cjs
   ```

3. **Update documentation** if needed

### PR Requirements

1. **Descriptive title** following conventional commits
2. **Clear description** explaining:
   - What changes were made
   - Why the changes were needed
   - How to test the changes
3. **Tests** covering new functionality
4. **No breaking changes** without discussion
5. **Passes all CI checks**

### PR Template

```markdown
## Summary

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Tested on multiple devices/browsers

## Dependencies

- [ ] No new dependencies added
- [ ] New dependencies are compatible
- [ ] Dependency compatibility check passes

## Screenshots (if applicable)

## Additional Notes
```

## CI/CD Pipeline

### Automated Checks

All PRs must pass:

- **Type checking**: TypeScript compilation
- **Linting**: ESLint rules
- **Testing**: Jest test suite with coverage
- **Building**: Production build
- **Dependency check**: Compatibility validation
- **Security**: Dependency audit

### Deployment

- **Staging**: Automatic deployment on `develop` branch
- **Production**: Automatic deployment on `main` branch
- **Mobile**: Manual release process with APK artifacts

## Getting Help

### Resources

- **Documentation**: Check existing docs in `/docs`
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions

### Contact

- **Project Lead**: Create an issue or discussion
- **Bug Reports**: Use GitHub issues with bug template
- **Feature Requests**: Use GitHub issues with feature template

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to Relife! 🚀**
