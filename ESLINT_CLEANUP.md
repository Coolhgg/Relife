# ESLint Cleanup - Key Fixes Applied

## Summary

This pull request addresses critical ESLint warnings and errors to improve code quality and type
safety.

## Changes Made

### 1. Fixed TypeScript Unsafe Function Types

**File: `src/services/pwa-manager.ts`**

- Changed `Map<string, Function[]>` to `Map<string, AnyFn[]>` for better type safety
- Fixed undefined variable reference from `_event.data` to `event.data`
- Removed unnecessary escape character in regex pattern

### 2. ESLint Configuration

- The existing `eslint.config.js` properly handles all file types and environments
- Deprecated `.eslintignore` was previously removed in favor of flat config ignores
- Globals are properly configured for different contexts (browser, node, test environments)

## Issues Resolved

- ✅ `@typescript-eslint/no-unsafe-function-type` warnings
- ✅ `no-undef` errors for event handling
- ✅ `no-useless-escape` warnings in regex patterns

## Verification

```bash
# Test the specific file
npx eslint src/services/pwa-manager.ts

# Run full lint check
npm run lint
```

The changes maintain backward compatibility while improving type safety and code quality standards.
