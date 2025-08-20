# ESLint Violations Analysis - Phase 05

## Current Status
- **Total violations**: 684 files
- **no-undef**: 7,067 violations (primary target)
- **@typescript-eslint/no-require-imports**: 212 violations
- **@typescript-eslint/no-unused-vars**: 1,422 violations

## Violation Breakdown

### 1. no-undef Violations (7,067)
**Primary patterns identified:**

#### Pattern A: Missing React imports
- **Files**: `relife-campaign-dashboard/src/components/ui/*.tsx`
- **Error**: `'React' is not defined`
- **Fix**: Add `import React from 'react'` or `import * as React from 'react'`

#### Pattern B: Missing Jest globals in test files  
- **Files**: `src/__tests__/**/*.test.ts`, `src/__tests__/**/*.test.tsx`
- **Errors**: `'describe' is not defined`, `'it' is not defined`, `'expect' is not defined`
- **Fix**: Add `/* global describe, it, expect, beforeEach, afterEach, jest */` or configure Jest globals in ESLint config

#### Pattern C: Browser globals
- **Likely errors**: `'window' is not defined`, `'document' is not defined`, `'localStorage' is not defined`
- **Fix**: Ensure `globals.browser` is properly configured in ESLint config

#### Pattern D: Node.js globals  
- **Likely errors**: `'process' is not defined`, `'__dirname' is not defined`
- **Fix**: Ensure `globals.node` is properly configured

### 2. @typescript-eslint/no-require-imports (212)
- **Files**: Mainly in test files
- **Error**: `A 'require()' style import is forbidden`
- **Example**: Lines with `require('./path/to/module')`
- **Fix**: Convert to `import` statements

### 3. @typescript-eslint/no-unused-vars (1,422)
- **Error**: Variables declared but not used
- **Fix**: Remove unused variables or prefix with `_` if intentionally unused

## Fix Strategy

### Phase 1: Fix require() imports (212 violations)
- Convert all `require()` statements to ES6 `import` statements
- Priority: High (project should be ESM-compatible)

### Phase 2: Fix test file globals (estimated 3,000+ no-undef)
- Add Jest globals to test files
- Update ESLint config for test files if needed

### Phase 3: Fix React imports (estimated 2,000+ no-undef)
- Add missing React imports to component files
- Consider using automatic JSX runtime if React 17+

### Phase 4: Fix remaining no-undef (estimated 2,000+)
- Browser globals, Node globals, type imports
- Custom global declarations where needed

### Phase 5: Clean unused variables (1,422)
- Remove or rename unused variables
- Enable TypeScript strict mode

## Expected Outcome
- **no-undef**: 7,067 → 0
- **@typescript-eslint/no-require-imports**: 212 → 0  
- **@typescript-eslint/no-unused-vars**: 1,422 → 0
- **Total violations**: 684 files → 0 violations
- **Build status**: `tsc --noEmit` passes with 0 errors