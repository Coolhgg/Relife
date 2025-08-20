# Test Runner Configuration Audit - Relife Project

## Phase 1: Audit & Decide Runner

### Current State Analysis

#### ✅ **Correctly Using Vitest**
- Primary test runner: **Vitest 3.2.4** (good, latest version)
- Scripts properly configured for Vitest
- Good Vitest setup with `@vitest/ui`, `happy-dom`, `jsdom`
- Vite + React + TypeScript stack → Vitest is the right choice

#### ❌ **Key Issues Identified**

1. **Dependency Conflicts**
   - `@jest/globals: "^30.0.5"` in devDependencies (should be removed)
   - `@types/jest: "^29.5.12"` in devDependencies (conflicts with Vitest)
   - Mixed Jest/Vitest imports in test files

2. **Import/Setup Issues**
   - `src/__tests__/mocks/msw-setup.ts` uses `import { beforeAll, afterEach, afterAll } from '@jest/globals'` (wrong)
   - `src/__tests__/utils/hook-testing-utils.tsx` uses `jest.fn()` instead of `vi.fn()`
   - MSW setup conflicts between unit and integration tests

3. **Node Module Corruption**
   - Vite dependencies appear corrupted: `ERR_MODULE_NOT_FOUND: Cannot find module '/project/workspace/Coolhgg/Relife/node_modules/vite/dist/node/chunks/dep-eRCq8YxU.js'`
   - Likely caused by dependency version mismatches

4. **Configuration Overlap**
   - Multiple test config files but some confusion about which globals to use
   - Jest config file exists for e2e/detox tests (this is okay)

### Decision: Keep Vitest, Fix Conflicts

**Recommendation**: Standardize on **Vitest** (already the primary runner)
- ✅ Better performance with Vite projects
- ✅ Native ES module support  
- ✅ TypeScript support built-in
- ✅ Good DOM environment setup already

### Next Steps

#### Phase 2: Dependency Alignment
- Remove conflicting Jest dependencies (`@jest/globals`, `@types/jest`) 
- Keep `@testing-library/jest-dom` (works with Vitest)
- Keep `jest-axe` (needed for accessibility testing)
- Fix node module corruption with clean install

#### Phase 3: Config File Fix
- Fix MSW setup imports to use Vitest
- Update hook testing utilities to use `vi.fn()` consistently  
- Ensure proper TypeScript + DOM environment setup

#### Phase 4: Verification
- Clean install dependencies
- Run TypeScript compilation
- Run test suite with coverage
- Verify CI pipeline

## Files Needing Updates

### High Priority
- `package.json` - Remove Jest conflicting dependencies
- `src/__tests__/mocks/msw-setup.ts` - Fix imports from Jest to Vitest
- `src/__tests__/utils/hook-testing-utils.tsx` - Replace `jest.fn()` with `vi.fn()`

### Medium Priority  
- Clean `node_modules` and `package-lock.json`
- Verify all test files use Vitest globals consistently

### Configuration Files (Good)
- `vitest.config.ts` - ✅ Well configured
- `vitest.integration.config.ts` - ✅ Good integration setup
- `src/test-setup.ts` - ✅ Comprehensive mocking setup

## Acceptance Criteria
- [x] Single test runner (Vitest) identified
- [ ] Dependencies aligned (remove Jest conflicts)
- [ ] TypeScript + DOM environment working
- [ ] Tests run locally without import errors
- [ ] Coverage reports generate successfully
- [ ] CI pipeline passes