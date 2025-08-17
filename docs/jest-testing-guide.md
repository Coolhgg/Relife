# Jest Testing Guide

This guide explains how to run tests in the Relife project and documents the Jest configuration choices.

## Quick Start

### Running Tests

```bash
# Run all tests
bun test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch

# Run specific test file
bun test path/to/test.spec.ts

# Run tests matching a pattern
bun test --testNamePattern="should render"
```

### Test Structure

Tests are located in:
- `src/components/__tests__/` - Component tests
- `src/services/__tests__/` - Service/utility tests
- `src/__tests__/` - Integration tests
- `tests/e2e/` - End-to-end tests (Playwright)

## Jest Configuration

The Jest configuration is defined in `jest.config.js` with the following key settings:

### Environment
- **Test Environment**: `jsdom` - Simulates a browser environment for React components
- **Setup Files**: `src/test-setup.ts` - Global test configuration

### Module Resolution
The project uses absolute imports with the following mappings:
- `@/` → `src/`
- `@components/` → `src/components/`
- `@services/` → `src/services/`
- `@utils/` → `src/utils/`
- And more...

### Mocks
Several modules are automatically mocked:
- **External Services**: PostHog, Sentry, Supabase, Stripe, Capacitor
- **Assets**: Images, audio files, stylesheets
- **File System**: Audio and image files are mocked for testing

### Coverage
Coverage is collected from:
- All TypeScript/JavaScript files in `src/`
- Excludes: test files, stories, config files, type definitions

Coverage thresholds:
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Snapshot Serializers

### Why No @emotion Serializer?

This project **does not use** the `@emotion/jest` serializer because:

1. **No Emotion Usage**: The project doesn't use @emotion for CSS-in-JS styling
2. **Styling Approach**: Uses TailwindCSS for styling instead
3. **Avoided Dependency**: Prevents unnecessary package installation

If you need to add CSS-in-JS libraries in the future:
1. Install the appropriate Jest serializer (e.g., `@emotion/jest` for Emotion)
2. Add it to the `snapshotSerializers` array in `jest.config.js`
3. Update this documentation

## Common Issues & Solutions

### Issue: "Cannot find module" errors
**Solution**: Check that the module is installed and listed in `package.json`. For development-only dependencies, ensure they're in `devDependencies`.

### Issue: JSX/TypeScript syntax errors
**Solution**: Verify `ts-jest` configuration is correct and `tsx` files are properly transformed.

### Issue: Mock not working
**Solution**: Ensure mocks are in the correct location (`__mocks__` directory or `moduleNameMapper` configuration).

### Issue: Tests timing out
**Solution**: Check for async operations without proper awaiting. Use `waitFor` from `@testing-library/react` for async assertions.

## Best Practices

### Test Organization
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('rendering', () => {
    it('should render with default props', () => {
      // Test implementation
    });
  });

  describe('behavior', () => {
    it('should handle user interaction', () => {
      // Test implementation
    });
  });
});
```

### Async Testing
```typescript
import { waitFor, screen } from '@testing-library/react';

it('should load data', async () => {
  render(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### Mock Services
```typescript
// Mock external dependencies
jest.mock('@/services/api', () => ({
  fetchData: jest.fn(() => Promise.resolve({ data: 'test' }))
}));
```

## CI/CD Integration

Tests run automatically on:
- Pull requests (via `pr-validation.yml`)
- Main branch pushes (via `enhanced-ci-cd.yml`)

The CI uses the same `bun test:coverage` command and uploads coverage to Codecov.

## Troubleshooting

### Dependencies Not Found
If you encounter "Cannot find module" errors:
1. Ensure all test dependencies are in `devDependencies`
2. Run `bun install` to install dependencies
3. Check that bun lockfile is up to date

### Performance Issues
If tests are slow:
1. Use `--maxWorkers=50%` for local development
2. Consider splitting large test files
3. Mock heavy external dependencies

For more help, check the main project README or create an issue.