# Contributing Guide

Welcome to the Universal Template project! This guide will help you understand our development
workflow and code quality standards.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Quality Standards](#code-quality-standards)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Commit Message Standards](#commit-message-standards)
- [Continuous Integration](#continuous-integration)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js 16 or higher
- Git

### Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd universal-template
   ```

2. Install Python dependencies:

   ```bash
   pip install -e ".[dev]"
   ```

3. Install Node.js dependencies:

   ```bash
   npm install
   ```

4. Install pre-commit hooks:
   ```bash
   npm run prepare
   ```

## Development Workflow

### Making Changes

1. Create a new branch for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our [code quality standards](#code-quality-standards)

3. Stage your changes:

   ```bash
   git add .
   ```

4. Commit with a conventional commit message:

   ```bash
   git commit -m "feat: add new feature description"
   ```

5. Push and create a pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

### Quality Checks

Before committing, you can manually run quality checks:

```bash
# Check all code quality at once
npm run quality:check

# Fix auto-fixable issues
npm run quality:fix

# Individual checks
npm run lint              # Check Prettier formatting
python -m black --check . # Check Python formatting
python -m isort --check . # Check Python import sorting
python -m flake8 .        # Python linting
python -m mypy .          # Python type checking
```

## Code Quality Standards

We maintain high code quality through automated tools and standards:

### Python Code Standards

- **Formatting**: [Black](https://black.readthedocs.io/) with 88 character line limit
- **Import Sorting**: [isort](https://pycqa.github.io/isort/) with Black profile
- **Linting**: [Flake8](https://flake8.pycqa.org/) for code style and error detection
- **Type Checking**: [MyPy](http://mypy-lang.org/) for static type analysis

#### Python Configuration

Configuration is defined in `pyproject.toml`:

- Black: 88 character line length, Python 3.10+ target
- isort: Black-compatible profile, multi-line output style 3
- Flake8: 88 character line limit, extended ignore for Black compatibility
- MyPy: Strict type checking with proper error reporting

### JavaScript/TypeScript/JSON/YAML Standards

- **Formatting**: [Prettier](https://prettier.io/) for consistent code formatting
- **Configuration**: Defined in `.prettierrc.js`
- **Line Length**: 88 characters (consistent with Python)
- **Quotes**: Single quotes for JS/TS, double quotes for JSON
- **Trailing Commas**: ES5 compatible

### Shell Script Standards

- **Linting**: [ShellCheck](https://www.shellcheck.net/) for shell script analysis
- Automatically runs on all `.sh` files during pre-commit

## Pre-commit Hooks

Pre-commit hooks automatically run quality checks before each commit:

### What Runs Automatically

1. **Prettier** formats JavaScript, TypeScript, JSON, CSS, HTML, Markdown, YAML
2. **Black** formats Python code
3. **isort** sorts Python imports
4. **Flake8** lints Python code for style and errors
5. **ShellCheck** lints shell scripts
6. **Syntax validation** checks for Python syntax errors

### Hook Configuration

Hooks are configured in:

- `package.json` - lint-staged configuration
- `.husky/pre-commit` - Husky pre-commit hook
- `.husky/commit-msg` - Husky commit message validation

### Skipping Hooks (Emergency Only)

If you absolutely need to skip pre-commit hooks:

```bash
git commit --no-verify -m "emergency fix"
```

**Warning**: This bypasses all quality checks. Use only in emergencies and fix issues immediately.

## Commit Message Standards

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, no code changes)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `build`: Build system or external dependency changes
- `ci`: CI configuration changes
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverting a previous commit

### Examples

```bash
# Simple feature
git commit -m "feat: add user authentication system"

# With scope
git commit -m "feat(api): add user login endpoint"

# Bug fix
git commit -m "fix: resolve memory leak in server startup"

# Documentation
git commit -m "docs: update installation instructions"

# Breaking change
git commit -m "feat!: change API response format"
```

### Rules

- Use lowercase for type and scope
- Keep subject line under 100 characters
- Use imperative mood ("add" not "added" or "adds")
- Don't end subject line with a period
- Separate subject from body with a blank line

## Continuous Integration

Our CI/CD pipeline runs on GitHub Actions and includes:

### Quality Checks Workflow

Runs on every push and pull request:

1. **Multi-Python Testing**: Tests against Python 3.10 and 3.11
2. **Code Formatting**: Black and Prettier checks
3. **Linting**: Flake8 and ShellCheck
4. **Type Checking**: MyPy analysis
5. **Import Sorting**: isort validation
6. **Security Scanning**: Dependency vulnerability checks

### Dependency Checks

- **npm audit**: JavaScript dependency security scan
- **pip-audit**: Python dependency security scan
- Results uploaded as artifacts for review

### Commit Message Validation

- Validates all commit messages in pull requests
- Ensures conventional commit format compliance

### Viewing CI Results

1. Check the "Actions" tab in GitHub
2. View detailed logs for any failures
3. Download security audit artifacts if needed

## Troubleshooting

### Pre-commit Hook Issues

**Hook fails to run:**

```bash
# Reinstall hooks
rm -rf .husky/_
npm run prepare
```

**Formatting conflicts:**

```bash
# Auto-fix formatting issues
npm run quality:fix
```

### Python Tool Issues

**Black formatting errors:**

```bash
# Auto-format all Python files
python -m black .
```

**Import sorting issues:**

```bash
# Auto-fix import order
python -m isort .
```

**Type checking errors:**

```bash
# Run MyPy with verbose output
python -m mypy . --verbose
```

### Node.js Tool Issues

**Prettier formatting errors:**

```bash
# Auto-format all supported files
npx prettier --write .
```

**Package conflicts:**

```bash
# Clear and reinstall Node.js dependencies
rm -rf node_modules package-lock.json
npm install
```

### Git Hook Problems

**Hooks not running:**

```bash
# Check hook permissions
ls -la .husky/
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

**Commit message rejected:**

```bash
# View commitlint rules
npx commitlint --print-config

# Test commit message format
echo "feat: your message" | npx commitlint
```

### CI/CD Issues

**GitHub Actions failing:**

1. Check the Actions tab for detailed error logs
2. Ensure all dependencies are properly specified
3. Verify Python and Node.js versions match requirements
4. Check for any secret or permission issues

**Security audit failures:**

1. Review audit results in action artifacts
2. Update vulnerable dependencies
3. Consider using `npm audit fix` or updating Python packages

### Getting Help

If you encounter issues not covered here:

1. Check existing GitHub issues
2. Run tools with verbose output for detailed error messages
3. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Python/Node versions)

## Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Black Documentation](https://black.readthedocs.io/)
- [Prettier Documentation](https://prettier.io/docs/)
- [Flake8 Documentation](https://flake8.pycqa.org/)
- [MyPy Documentation](https://mypy.readthedocs.io/)
- [Husky Documentation](https://typicode.github.io/husky/)
