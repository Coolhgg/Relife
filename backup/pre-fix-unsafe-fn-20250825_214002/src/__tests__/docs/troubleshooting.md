# Troubleshooting Guide

This guide helps you diagnose and resolve common issues when using the Relife testing framework.

## Common Issues and Solutions

### Test Setup Issues

#### Tests Not Running

**Problem**: Tests don't execute or throw setup errors.

**Diagnosis**:

```bash
# Check test configuration
bun test --verbose

# Verify dependencies
bun install

# Check test file discovery
bun test --listTests
```

**Solutions**:

1. Verify test files match the pattern in `vitest.config.ts`
2. Check that all dependencies are installed
3. Ensure test files have proper imports

```typescript
// ✅ Correct imports
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ❌ Missing or incorrect imports
// Missing vitest imports or using jest syntax with vitest
```

#### Mock Service Worker (MSW) Issues

**Problem**: API requests are not being intercepted by MSW.

**Diagnosis**:

```typescript
// Add MSW request logging
import { setupServer } from 'msw/node';
import { enhancedHandlers } from '../api/enhanced-msw-handlers';

const server = setupServer(...enhancedHandlers);

beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn', // This will show unhandled requests
  });
});
```

**Solutions**:

1. Ensure MSW server is started in test setup
2. Check that request URLs match handler patterns exactly
3. Verify handlers are imported correctly

```typescript
// ✅ Correct MSW setup
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ❌ Missing MSW setup
// No server.listen() call or incorrect setup order
```

### Mock-Related Issues

#### Mock Services Not Resetting

**Problem**: Mock services retain state between tests.

**Diagnosis**:

```typescript
import { MockAlarmService } from '../mocks/service-mocks';

beforeEach(() => {
  console.log('Mock state:', MockAlarmService.getCallHistory());
});
```

**Solutions**:

1. Always reset mocks in `beforeEach`
2. Use proper cleanup in `afterEach`

```typescript
// ✅ Proper mock cleanup
beforeEach(() => {
  MockAlarmService.reset();
  MockSubscriptionService.reset();
  testHelpers.clearTestState();
});

afterEach(() => {
  jest.clearAllMocks();
});
```

#### Capacitor Mocks Not Working

**Problem**: Capacitor plugin calls fail or don't trigger mocks.

**Diagnosis**:

```typescript
import { Capacitor } from '@capacitor/core';

// Check if platform detection is working
console.log('Platform:', Capacitor.getPlatform());
console.log('Native:', Capacitor.isNativePlatform());
```

**Solutions**:

1. Ensure Capacitor mocks are imported before components
2. Check platform detection configuration

```typescript
// ✅ Correct Capacitor mock import order
import '../mocks/capacitor.mock'; // Import first
import { MyComponent } from '../components/MyComponent';

// ❌ Wrong import order
import { MyComponent } from '../components/MyComponent';
import '../mocks/capacitor.mock'; // Too late
```

### Async Testing Issues

#### Tests Timing Out

**Problem**: Tests hang or timeout on async operations.

**Diagnosis**:

```typescript
// Add timeout logging
const timeout = setTimeout(() => {
  console.log('Test operation timed out');
}, 5000);

try {
  await testOperation();
  clearTimeout(timeout);
} catch (error) {
  clearTimeout(timeout);
  throw error;
}
```

**Solutions**:

1. Use proper waiting utilities instead of arbitrary timeouts
2. Ensure async operations complete properly
3. Check for infinite loops or unresolved promises

```typescript
// ✅ Proper async testing
await testHelpers.waitForElement(() => screen.queryByText('Expected content'));

// ❌ Arbitrary timeout
setTimeout(() => {
  expect(screen.getByText('Expected content')).toBeInTheDocument();
}, 1000);
```

#### Flaky Tests

**Problem**: Tests pass sometimes and fail other times.

**Diagnosis**:

```typescript
// Run test multiple times to identify flakiness
describe.each(Array.from({ length: 10 }, (_, i) => i))('Run %i', (run) => {
  it('should be stable', async () => {
    // Your test here
  });
});
```

**Solutions**:

1. Use proper waiting mechanisms
2. Avoid race conditions
3. Ensure proper cleanup between tests

```typescript
// ✅ Stable test with proper waiting
await testHelpers.clickAndWaitForResponse(button, () => screen.queryByText(/success/i) !== null);

// ❌ Flaky test with race condition
await testHelpers.user.click(button);
expect(screen.getByText(/success/i)).toBeInTheDocument(); // May not be ready yet
```

### Component Testing Issues

#### Elements Not Found

**Problem**: `screen.getByText()` or similar queries fail to find elements.

**Diagnosis**:

```typescript
// Debug what's actually rendered
import { screen } from '@testing-library/react';

// Print the DOM to see what's rendered
screen.debug();

// Or print specific container
const container = render(<MyComponent />);
console.log(container.container.innerHTML);
```

**Solutions**:

1. Use more flexible queries
2. Wait for elements to appear
3. Check for correct text content

```typescript
// ✅ Flexible and robust queries
await testHelpers.waitForElement(
  () => screen.queryByText(/alarm created/i) // Case insensitive regex
);

// ❌ Brittle exact match
expect(screen.getByText('Alarm Created Successfully')).toBeInTheDocument();
```

#### React Testing Library Issues

**Problem**: `act()` warnings or state update issues.

**Diagnosis**:

```typescript
// Check for unwrapped state updates
console.warn = jest.fn((message) => {
  if (message.includes('act()')) {
    console.error('ACT WARNING:', message);
  }
});
```

**Solutions**:

1. Wrap state updates in `act()`
2. Use React Testing Library's async utilities
3. Ensure proper component cleanup

```typescript
// ✅ Proper act() usage
await act(async () => {
  await testHelpers.user.click(button);
});

// Or use built-in async utilities
await testHelpers.clickAndWaitForResponse(button, expectedChange);
```

### Performance Testing Issues

#### Performance Tests Failing in CI

**Problem**: Performance tests pass locally but fail in CI.

**Diagnosis**:

```typescript
// Add environment detection
console.log('Environment:', {
  CI: process.env.CI,
  NODE_ENV: process.env.NODE_ENV,
  platform: process.platform,
  memory: process.memoryUsage(),
});
```

**Solutions**:

1. Adjust thresholds for CI environment
2. Use relative performance measurements
3. Mock time-sensitive operations

```typescript
// ✅ Environment-aware thresholds
const isCI = process.env.CI === 'true';
const maxRenderTime = isCI ? 200 : 100; // More lenient in CI

expect(renderTime).toBeLessThan(maxRenderTime);
```

#### Inconsistent Performance Results

**Problem**: Performance measurements vary significantly between runs.

**Solutions**:

1. Use statistical analysis over multiple iterations
2. Warm up performance testing
3. Control external factors

```typescript
// ✅ Statistical performance testing
const results = await performanceCore.benchmark(testFunction, {
  iterations: 100,
  warmup: 10, // Warm up runs
});

expect(results.standardDeviation).toBeLessThan(results.averageTime * 0.2);
```

### Integration Testing Issues

#### E2E Tests Failing

**Problem**: End-to-end tests fail with navigation or interaction issues.

**Diagnosis**:

```typescript
// Add detailed logging
const testContext = await e2eUtils.createBrowserContext({
  enableLogging: true,
  screenshots: true,
});

// Take screenshots at each step
await testContext.page.screenshot({ path: 'step-1.png' });
```

**Solutions**:

1. Add explicit waits for page loads
2. Use data-testid attributes for reliable element selection
3. Handle dynamic content properly

```typescript
// ✅ Reliable E2E testing
await testContext.page.waitForSelector('[data-testid="dashboard"]');
await testContext.page.click('[data-testid="create-alarm-button"]');

// ❌ Unreliable selectors
await testContext.page.click('.btn.btn-primary'); // CSS classes can change
```

### Mobile Testing Issues

#### Capacitor Plugin Errors

**Problem**: Native plugin calls fail in test environment.

**Diagnosis**:

```typescript
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Check plugin availability
console.log('LocalNotifications available:', Capacitor.isPluginAvailable('LocalNotifications'));
```

**Solutions**:

1. Ensure all required plugins are mocked
2. Check platform-specific behavior
3. Verify mock implementations match plugin APIs

```typescript
// ✅ Comprehensive plugin mocking
jest.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    schedule: jest.fn().mockResolvedValue({ notifications: [] }),
    getPending: jest.fn().mockResolvedValue({ notifications: [] }),
    cancel: jest.fn().mockResolvedValue(undefined),
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    removeAllListeners: jest.fn().mockResolvedValue(undefined),
  },
}));
```

## Debugging Techniques

### Enable Verbose Logging

```bash
# Run tests with verbose output
VERBOSE_TESTS=true bun test

# Enable debug mode
DEBUG_TESTS=true bun test

# Combine with specific test file
DEBUG_TESTS=true bun test src/__tests__/components/AlarmCard.test.tsx
```

### Use Debug Utilities

```typescript
import { testConsole } from '../utils';

describe('My Component', () => {
  beforeEach(() => {
    testConsole.group('Test Setup');
    testConsole.log('Starting test with clean state');
    testConsole.groupEnd();
  });

  it('should work correctly', async () => {
    testConsole.debug('Rendering component');
    render(<MyComponent />);

    testConsole.debug('Clicking button');
    await testHelpers.user.click(screen.getByRole('button'));

    testConsole.log('Test completed successfully');
  });
});
```

### Snapshot Testing for Debugging

```typescript
// Use snapshots to debug unexpected changes
expect(container.firstChild).toMatchSnapshot('component-initial-state');

// Update snapshots when needed
// bun test --update-snapshots
```

### Network Request Debugging

```typescript
// Debug MSW handlers
import { rest } from 'msw';

const handlers = [
  rest.get('/api/alarms', (req, res, ctx) => {
    console.log('MSW: Handling GET /api/alarms');
    console.log('Request:', req.url.toString());

    return res(ctx.status(200), ctx.json({ alarms: [] }));
  }),
];
```

## Environment-Specific Issues

### Node.js Version Issues

**Problem**: Tests fail with Node.js version incompatibilities.

**Solutions**:

1. Use the correct Node.js version (18+)
2. Check package compatibility
3. Update dependencies if needed

```bash
# Check Node.js version
node --version

# Use correct version with nvm
nvm use 18
```

### TypeScript Configuration Issues

**Problem**: Type errors in test files.

**Solutions**:

1. Ensure test files are included in tsconfig
2. Check type definitions for testing libraries
3. Verify proper module resolution

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src/**/*", "src/__tests__/**/*"]
}
```

### Module Resolution Issues

**Problem**: Imports fail or modules not found.

**Solutions**:

1. Check path mappings in tsconfig
2. Verify relative import paths
3. Ensure proper file extensions

```typescript
// ✅ Correct relative imports
import { testHelpers } from '../helpers/comprehensive-test-helpers';
import { MockAlarmService } from '../mocks/service-mocks';

// ❌ Incorrect paths
import { testHelpers } from 'helpers/comprehensive-test-helpers'; // Missing relative path
```

## Performance Debugging

### Memory Leak Detection

```typescript
// Debug memory usage
const memoryBefore = process.memoryUsage();

// Run test operation
await testOperation();

const memoryAfter = process.memoryUsage();
const memoryDiff = memoryAfter.heapUsed - memoryBefore.heapUsed;

if (memoryDiff > 10 * 1024 * 1024) {
  // 10MB threshold
  console.warn('Potential memory leak detected:', memoryDiff);
}
```

### Performance Profiling

```typescript
// Profile slow operations
console.time('slow-operation');

const result = await performanceCore.timeFunction(async () => {
  return await slowOperation();
}, 'detailed-timing');

console.timeEnd('slow-operation');
console.log('Detailed timing:', result.duration);
```

## Best Practices for Debugging

### 1. Isolate Issues

```typescript
// Create minimal reproduction
describe('Minimal reproduction', () => {
  it('should reproduce the issue', async () => {
    // Minimal test case that reproduces the problem
  });
});
```

### 2. Use Proper Error Messages

```typescript
// ✅ Descriptive error messages
expect(alarmCount).toBe(5); // "expected 3 to be 5"

// ✅ Even better with custom message
expect(alarmCount).toBe(5);
// Add context: expect(alarmCount, 'Number of user alarms').toBe(5);
```

### 3. Add Debugging Hooks

```typescript
// Add debugging in beforeEach/afterEach
beforeEach(() => {
  if (process.env.DEBUG_TESTS) {
    console.log('Test state before:', testHelpers.snapshotTestState());
  }
});

afterEach(() => {
  if (process.env.DEBUG_TESTS) {
    console.log('Test state after:', testHelpers.snapshotTestState());
  }
});
```

## Getting Help

### Check Existing Issues

1. Review this troubleshooting guide
2. Check the specific testing guide for your issue type
3. Look at existing test examples
4. Verify mock service implementations

### Debug Information to Collect

When reporting issues, include:

1. **Environment**: Node.js version, OS, CI/local
2. **Test command**: Exact command that fails
3. **Error message**: Full error output
4. **Test code**: Minimal reproduction case
5. **Configuration**: Relevant config files
6. **Dependencies**: Package versions

```bash
# Collect environment info
echo "Node: $(node --version)"
echo "Bun: $(bun --version)"
echo "OS: $(uname -a)"
echo "Dependencies:"
cat package.json | grep -A 20 '"devDependencies"'
```

### Common Commands for Debugging

```bash
# Run single test with debug info
DEBUG_TESTS=true bun test path/to/test.ts

# Run tests with coverage and verbose output
bun test --coverage --verbose

# Run tests in watch mode for debugging
bun test --watch path/to/test.ts

# List all available tests
bun test --listTests

# Run tests matching pattern
bun test --grep "pattern"
```

---

This troubleshooting guide covers the most common issues you'll encounter when using the Relife
testing framework. Remember to start with the simplest solutions and gradually work toward more
complex debugging techniques.
