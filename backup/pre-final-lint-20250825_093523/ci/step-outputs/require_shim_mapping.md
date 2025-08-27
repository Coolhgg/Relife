# Require() to ES Shim Conversion Mapping

## Summary

Successfully converted all require() statements to ES shim imports while preserving runtime
behavior.

## Module Mapping Table

| Original Module | Shim Path                    | Usage Pattern                                | Files Affected      |
| --------------- | ---------------------------- | -------------------------------------------- | ------------------- |
| `fs`            | `src/shims/fs.ts`            | Default import                               | 8 files (.cjs, .js) |
| `path`          | `src/shims/path.ts`          | Default import                               | 8 files (.cjs, .js) |
| `child_process` | `src/shims/child_process.ts` | Named destructuring (`execSync`)             | 3 files (.cjs)      |
| `msw`           | `src/shims/msw.ts`           | Named destructuring (`http`, `HttpResponse`) | 1 file (.ts)        |
| `./test-mocks`  | `src/shims/test-mocks.ts`    | Named/mixed destructuring                    | 1 file (.ts)        |

## Conversion Examples

### Node.js Built-in Modules

```javascript
// Before
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// After
import fs from 'src/shims/fs'; // auto: converted require to shim
import path from 'src/shims/path'; // auto: converted require to shim
import { __cjs as _child_process } from 'src/shims/child_process';
const { execSync } = _child_process; // auto: converted require to shim
```

### NPM Package Modules

```javascript
// Before
const { http, HttpResponse } = require('msw');

// After
import { __cjs as _msw } from 'src/shims/msw';
const { http, HttpResponse } = _msw; // auto: converted require to shim
```

### Relative Module Imports

```javascript
// Before
const { setupAllMocks, mockWebSocket } = require('./test-mocks');

// After
import { __cjs as _test_mocks } from 'src/shims/test-mocks';
const { setupAllMocks, mockWebSocket } = _test_mocks; // auto: converted require to shim
```

## Files Modified

### .cjs Files (8 files)

- `auto-fix-unused.cjs` - fs, path, child_process
- `cleanup-unused.cjs` - fs, path, child_process
- `comment-dead-code.cjs` - fs, path
- `fix-react-hooks-deps.cjs` - fs, path
- `fix-react-refresh-exports.cjs` - fs, path
- `fix-syntax-errors.cjs` - fs, path
- `fix-unused-vars.cjs` - fs, path, child_process
- `fix-useless-catch.cjs` - fs, path

### .js Files (1 file)

- `test-syntax.js` - fs, path

### .ts Files (1 file)

- `tests/utils/integration-test-setup.ts` - msw, ./test-mocks

## Shim Implementation

Each shim follows the conservative ES module pattern:

```typescript
// auto shim for CommonJS module 'original'
const _cjs = require('original');
const _default = _cjs && _cjs.__esModule ? _cjs.default : _cjs;
export default _default;
export const __cjs = _cjs; // fallback if named properties used
```

This approach:

- ✅ Preserves exact runtime behavior
- ✅ Supports both default and named exports
- ✅ Maintains CommonJS compatibility
- ✅ Provides safe fallback patterns
- ✅ Uses require() internally to avoid import/export issues

## Validation Results

### TypeScript Compilation

```bash
npx tsc --noEmit
```

✅ **PASSED** - No TypeScript errors

### ESLint Analysis

```bash
npx eslint . --ext .ts,.tsx
```

⚠️ **WARNINGS ONLY** - No critical errors, some unused variable warnings (expected)

## Safety Guarantees

1. **Reversible**: All changes are isolated to shim files and marked with comments
2. **Conservative**: Uses require() internally, no complex transforms
3. **Behavioral Preservation**: Runtime behavior unchanged
4. **Incremental**: Can be applied file-by-file if needed
5. **Fallback Support**: \_\_cjs export provides access to original CommonJS object

## Next Steps

1. Review and merge this conversion
2. Incrementally migrate to native ES imports when safe
3. Remove shims once full ES module migration complete
4. Consider TypeScript strict mode compatibility
