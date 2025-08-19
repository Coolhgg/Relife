# Test Configuration Analysis Report

## Current Situation

### Primary Test Runner: Vitest
- **Main test scripts**: All use `vitest` (test, test:watch, test:coverage)
- **Vitest version**: 3.2.4 (properly installed)
- **Environment**: happy-dom
- **Config files**: vitest.config.ts, vitest.integration.config.ts

### Mixed Dependencies Issue 🚨

**Jest Dependencies (causing conflicts):**
- `@jest/globals: ^30.0.5` ← **ROOT CAUSE OF ERRORS**
- `@testing-library/jest-dom: ^6.7.0`
- `@types/jest: ^29.5.12`
- `jest-axe: ^10.0.0`

**Vitest Dependencies:**
- `vitest: ^3.2.4`
- `@vitest/ui: ^3.2.4`
- `@storybook/addon-vitest: ^9.1.2`

### Error Analysis

**Main Error**: `Do not import '@jest/globals' outside of the Jest test environment`
- **Cause**: Tests are importing Jest globals while running under Vitest
- **Affected**: All 81 test files failed with this error
- **Location**: Tests importing from `@jest/globals` or expecting Jest environment

### Configuration Status

#### vitest.config.ts ✅
- **Environment**: happy-dom ✅
- **Setup**: src/test-setup.ts ✅
- **Globals**: enabled ✅
- **Coverage**: properly configured ✅
- **TypeScript aliases**: properly configured ✅

#### vitest.integration.config.ts ✅  
- **Environment**: happy-dom ✅
- **Setup**: tests/utils/integration-test-setup.ts ✅
- **Separate coverage directory**: ✅
- **Integration-specific timeouts**: ✅

#### jest.config.js (E2E only) ✅
- **Scope**: Only for Detox e2e tests ✅
- **Isolated**: Doesn't conflict with unit tests ✅

### Node.js Version Warning ⚠️
- **Current**: v20.12.1
- **Required by Vite 7.1.3**: ^20.19.0 || >=22.12.0
- **Impact**: Non-blocking but shows warnings

## Root Cause Analysis

1. **Primary Issue**: Mixed Jest/Vitest globals
   - Tests import `@jest/globals` but run in Vitest environment
   - Vitest provides its own globals (describe, it, expect, vi)

2. **Setup File Issues**: 
   - src/test-setup.ts imports `@testing-library/jest-dom` ✅ (compatible)
   - But some test files likely import `@jest/globals` directly

3. **Dependency Confusion**:
   - `@jest/globals` package installed but not used by actual test runner
   - Creates false expectation that Jest globals are available

## Required Fixes

### High Priority
1. **Remove Jest Global Imports**: Replace `@jest/globals` imports with Vitest equivalents
2. **Remove Unused Jest Dependencies**: Clean up `@jest/globals`, `@types/jest`
3. **Update Test Files**: Ensure all test files use Vitest globals (vi instead of jest)

### Medium Priority  
1. **Node Version**: Update environment to Node 20.19.0+ (if possible)
2. **Dependency Audit**: Remove any other Jest-specific packages not needed

### Low Priority
1. **Testing Library Integration**: Keep `@testing-library/jest-dom` (works with Vitest)
2. **Jest-axe**: Replace with vitest-axe if available, or keep for compatibility

## Action Plan

### Step 1: Dependency Cleanup
```bash
npm uninstall @jest/globals @types/jest
# Keep jest-axe and @testing-library/jest-dom (both work with Vitest)
```

### Step 2: Update Test Files  
Replace imports like:
```typescript
// ❌ Remove
import { describe, it, expect } from '@jest/globals';

// ✅ Replace with (Vitest globals enabled)
// Nothing needed - describe, it, expect available globally
// OR explicitly import from vitest:
import { describe, it, expect, vi } from 'vitest';
```

### Step 3: Verify Mock Usage
Ensure tests use `vi` (Vitest) instead of `jest` for mocks:
```typescript
// ❌ Remove
jest.fn()
jest.mock()

// ✅ Replace with  
vi.fn()
vi.mock()
```

## Expected Outcome
After fixes:
- All 81 test files should run successfully
- Zero dependency conflicts between Jest/Vitest
- Clean test environment with single test runner (Vitest)
- Maintained compatibility with existing test patterns