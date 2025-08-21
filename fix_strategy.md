# Systematic Fix Strategy for 489 No-Undef Violations

## Phase 1: Quick Wins (Target: ~245 violations, 50% of total)

### 1.1 React Import Fixes (8 files, ~8 violations)

**Files to fix:**

- Components missing `import React from 'react'`
- Components using JSX without React import

**Approach:**

- Search for `.tsx` files with React usage but no React import
- Add `import React from 'react'` at top of files

### 1.2 Testing Framework Setup (70+ violations)

**Common patterns:**

- `expect` (12) - Add to test setup or import from jest
- `jest` (6) - Configure in test environment
- `describe` (3) - Import from jest globals
- `renderWithProviders` (17) - Import from test utils

**Approach:**

- Check test setup files for missing imports
- Add missing jest/testing library imports
- Ensure test utilities are properly exported/imported

### 1.3 Web API Type Definitions (30+ violations)

**Types needed:**

- `EventListener` (16) - DOM event listener type
- `NotificationPermission` (14) - Web Notification API
- `NotificationOptions` (4) - Notification config
- `HeadersInit` - Fetch API type

**Approach:**

- Add type imports from TypeScript DOM library
- Update tsconfig to include necessary lib types
- Add explicit type annotations where needed

### 1.4 Business Service Imports (25+ violations for core services)

**Priority services:**

- `SubscriptionService` (15) - High usage, likely centralized
- `PremiumFeatureAccess` (8) - Feature flag service

**Approach:**

- Locate service definitions
- Add proper import statements
- Ensure exports are correctly defined

## Phase 2: Complex Fixes (Target: ~244 remaining violations)

### 2.1 Alarm Domain Objects (27+ violations)

**Items:**

- `alarm` (23) - Core domain object
- `alarms` (4) - Collection/array

**Approach:**

- Find alarm type/class definitions
- Add imports to components using alarms
- Ensure proper typing

### 2.2 Test Infrastructure (50+ violations)

**Mock objects and test utilities:**

- `i18nMocks` (10), `storageMocks` (8), `audioMocks` (8)
- `createMockServices` (5), `generateRealisticTestData` (5)
- Various mock storage/API objects

**Approach:**

- Consolidate mock definitions
- Create centralized test utility exports
- Update test imports systematically

### 2.3 Utility Functions (40+ violations)

**Categories:**

- Performance: `performanceCore` (6), `memoryTesting` (7)
- UI: `colorContrast` (6), `styling` (5), `loadingStates` (5)
- Async: `asyncUtils` (8), `reactAsync` (4)

**Approach:**

- Locate utility modules
- Add missing exports/imports
- Consider creating barrel exports

### 2.4 Mobile/Capacitor Integration (7+ violations)

**Items:**

- `Capacitor` (7) - Framework globals

**Approach:**

- Check Capacitor setup
- Add proper imports for Capacitor APIs
- Ensure mobile-specific code is properly typed

## Implementation Order

### Batch 1 (Target: Push after ~245 fixes)

1. React imports (8 violations) - 15 minutes
2. Core testing framework (25 high-frequency testing violations) - 30 minutes
3. Web API types (30 violations) - 45 minutes
4. Core business services (23 violations) - 60 minutes
5. Alarm domain (27 violations) - 45 minutes
6. High-frequency utilities (40 violations) - 90 minutes

**Total estimated time: ~4.5 hours** **Target violations fixed: ~153**

### Mid-point Check and PR

- Push changes to feature branch
- Create pull request
- Review and merge if approved

### Batch 2 (Remaining ~336 violations)

1. Test infrastructure overhaul (50+ violations) - 2 hours
2. Remaining utilities (remaining utility violations) - 1.5 hours
3. Mock object consolidation (remaining mock violations) - 2 hours
4. Capacitor integration (7 violations) - 30 minutes
5. Miscellaneous cleanup (remaining violations) - 2 hours

**Total estimated time: ~8 hours**

## Quality Assurance

- Run `bun run lint:eslint` after each category
- Verify no new violations introduced
- Test build process: `bun run build`
- Run tests: `bun run test` (if possible)

## Success Metrics

- Phase 1: Reduce violations from 489 to ~244 (50% reduction)
- Phase 2: Reduce violations to 0 (100% completion)
- No breaking changes to existing functionality
- Successful build and basic test execution
