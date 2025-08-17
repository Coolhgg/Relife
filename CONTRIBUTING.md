# Contributing to Relife Alarm

Thank you for your interest in contributing to the Relife Alarm project! This document provides guidelines and information to help you contribute effectively.

## Development Setup

### Prerequisites
- Node.js 20.19.0+ or 22.12.0+
- npm 10+

### Installation
```bash
git clone https://github.com/Coolhgg/Relife.git
cd Relife
npm install
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run test` - Run test suite
- `npm run type-check` - Run TypeScript type checking

## Code Quality Standards

### ESLint Rules

This project enforces several code quality rules through ESLint to maintain consistency and prevent common issues.

#### React Import Requirements

**Rule**: `react/react-in-jsx-scope`  
**Level**: Error  
**Enforced Since**: August 2025

All `.tsx` files that use JSX elements must explicitly import React:

```typescript
// ✅ Correct - React import present
import React from 'react';
import { useState } from 'react';

export function MyComponent() {
  return <div>Hello World</div>;
}
```

```typescript
// ❌ Incorrect - Missing React import
import { useState } from 'react';

export function MyComponent() {
  return <div>Hello World</div>; // ESLint error: 'React' must be in scope when using JSX
}
```

**Why This Rule?**
- Ensures explicit dependencies are declared
- Improves code clarity and maintainability
- Prevents runtime errors in certain bundling scenarios
- Maintains consistency across the codebase

**How to Fix Violations:**
Add `import React from 'react';` as the first import in any `.tsx` file that uses JSX elements.

### Other Code Quality Rules

- **Unused Variables**: Variables starting with `_` are allowed (e.g., `_unusedParam`)
- **TypeScript Any**: Use of `any` type generates warnings (use specific types when possible)
- **React Hooks**: Follows React Hooks ESLint rules for proper usage

## Testing

### Running Tests
```bash
npm run test
```

### Writing Tests
- Place test files adjacent to components with `.test.tsx` extension
- Use React Testing Library for component testing
- Follow existing test patterns in the codebase

## Building

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

## Submitting Changes

### Pull Request Process
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following the code quality standards
4. Run linting and tests: `npm run lint && npm run test`
5. Commit your changes with clear, descriptive messages
6. Push to your fork and submit a pull request

### Commit Message Format
Use clear, descriptive commit messages:
- `feat: add new alarm sound feature`
- `fix: resolve timezone issue in scheduling`
- `docs: update API documentation`
- `test: add unit tests for alarm validation`

### Code Review Guidelines
- Ensure all ESLint rules pass
- Include tests for new functionality
- Update documentation as needed
- Follow existing code patterns and conventions

## Getting Help

If you have questions or need help:
- Check existing issues on GitHub
- Review the README.md for project information
- Feel free to open a new issue for questions

Thank you for contributing to Relife Alarm!