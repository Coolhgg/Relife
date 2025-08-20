# Code Quality Standards

This document provides a quick reference for the code quality tools and standards used in this
project.

## Quick Start

```bash
# Install all dependencies
pip install -e ".[dev]"
npm install

# Run all quality checks
npm run quality:check

# Fix auto-fixable issues
npm run quality:fix
```

## Tools Overview

| Tool            | Purpose                       | Auto-fix | Config File        |
| --------------- | ----------------------------- | -------- | ------------------ |
| **Black**       | Python code formatting        | ✅       | `pyproject.toml`   |
| **isort**       | Python import sorting         | ✅       | `pyproject.toml`   |
| **Flake8**      | Python linting                | ❌       | `pyproject.toml`   |
| **MyPy**        | Python static type checking   | ❌       | `pyproject.toml`   |
| **Prettier**    | JS/TS/JSON/YAML/MD formatting | ✅       | `.prettierrc.js`   |
| **ShellCheck**  | Shell script linting          | ❌       | Built-in rules     |
| **Commitlint**  | Commit message validation     | ❌       | `.commitlintrc.js` |
| **Husky**       | Git hooks management          | N/A      | `.husky/`          |
| **lint-staged** | Run tools on staged files     | N/A      | `package.json`     |

## Commands

### Development Commands

```bash
# Format and fix issues
npm run quality:fix
python -m black .
python -m isort .
npx prettier --write .

# Check without fixing
npm run quality:check
python -m black --check .
python -m isort --check-only .
python -m flake8 .
python -m mypy .
npx prettier --check .
```

### Git Commands

```bash
# Standard commit (hooks run automatically)
git commit -m "feat: add new feature"

# Skip hooks (emergency only)
git commit --no-verify -m "emergency fix"

# Test commit message format
echo "feat: your message" | npx commitlint
```

## Pre-commit Hooks

Automatically run on `git commit`:

1. **Prettier** - Formats non-Python files
2. **Black** - Formats Python code
3. **isort** - Sorts Python imports
4. **Flake8** - Lints Python code
5. **ShellCheck** - Lints shell scripts (if any)
6. **Commitlint** - Validates commit message format

## Configuration Files

- **`pyproject.toml`** - Python tool configuration
- **`.prettierrc.js`** - Prettier configuration
- **`.prettierignore`** - Files ignored by Prettier
- **`.commitlintrc.js`** - Commit message rules
- **`package.json`** - lint-staged configuration
- **`.husky/`** - Git hook scripts

## Standards Summary

### Python

- **Line Length**: 88 characters
- **Quotes**: Double quotes preferred
- **Import Style**: Absolute imports, sorted by type
- **Type Hints**: Required for public functions

### JavaScript/TypeScript

- **Line Length**: 88 characters
- **Quotes**: Single quotes
- **Semicolons**: Required
- **Trailing Commas**: ES5 style

### Commit Messages

- **Format**: `type(scope): description`
- **Types**: feat, fix, docs, style, refactor, test, chore
- **Length**: Max 100 characters for subject

## CI/CD Integration

GitHub Actions automatically:

- ✅ Runs all quality checks
- ✅ Tests multiple Python versions
- ✅ Validates commit messages
- ✅ Scans dependencies for security issues
- ✅ Generates quality reports

## Troubleshooting

### Common Issues

**Pre-commit hooks fail:**

```bash
npm run prepare  # Reinstall hooks
```

**Formatting conflicts:**

```bash
npm run quality:fix  # Auto-fix all issues
```

**Type errors:**

```bash
python -m mypy . --show-error-codes  # Detailed type errors
```

**Commit rejected:**

```bash
# Use conventional commit format
git commit -m "fix: resolve the specific issue"
```

### Override Commands

**Skip all pre-commit checks** (emergency only):

```bash
git commit --no-verify -m "emergency commit"
```

**Ignore specific Flake8 errors** (add to code):

```python
# noqa: E501  # Ignore line too long
```

**Ignore MyPy errors** (add to code):

```python
# type: ignore[error-code]
```

## Integration with IDEs

### VS Code

Install recommended extensions:

- Python (ms-python.python)
- Black Formatter (ms-python.black-formatter)
- Prettier (esbenp.prettier-vscode)
- MyPy Type Checker (matangover.mypy)

### PyCharm

Enable in Settings:

- Tools → Actions on Save → Reformat code
- Tools → External Tools → Black, isort
- Editor → Inspections → MyPy

### Vim/Neovim

Popular plugins:

- ALE (Asynchronous Lint Engine)
- vim-black
- prettier.vim

---

For detailed information, see [CONTRIBUTING.md](CONTRIBUTING.md).
