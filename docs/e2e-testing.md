# End-to-End Testing with Playwright

This document provides comprehensive guidance on running, writing, and maintaining end-to-end tests for the Relife Alarm application using Playwright.

## Table of Contents

- [Quick Start](#quick-start)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Page Object Models](#page-object-models)
- [Test Data and Fixtures](#test-data-and-fixtures)
- [Debugging Tests](#debugging-tests)
- [CI/CD Integration](#cicd-integration)
- [Mobile Testing](#mobile-testing)
- [Accessibility Testing](#accessibility-testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Bun package manager
- Application built and ready to serve

### Installation

1. Install dependencies:
   ```bash
   bun install
   ```

2. Install Playwright browsers:
   ```bash
   bun run test:e2e:install
   ```

3. Build the application:
   ```bash
   bun run build
   ```

4. Run your first test:
   ```bash
   bun run test:e2e
   ```

## Running Tests

### Available Scripts

#### Basic Test Execution
```bash
# Run all E2E tests
bun run test:e2e

# Run tests with browser UI (headed mode)
bun run test:e2e:headed

# Run only desktop browser tests
bun run test:e2e:desktop

# Run only mobile device tests
bun run test:e2e:mobile
```

#### Debugging and Development
```bash
# Open Playwright Test UI (interactive mode)
bun run test:e2e:ui

# Debug tests step by step
bun run test:e2e:debug

# Generate new tests using Playwright Codegen
bun run test:e2e:codegen

# View test reports
bun run test:e2e:report
```

#### CI/CD Mode
```bash
# Run tests in CI mode with GitHub reporter
bun run test:e2e:ci
```

### Running Specific Tests

```bash
# Run a specific test file
bunx playwright test tests/e2e/specs/dashboard.spec.ts

# Run tests matching a pattern
bunx playwright test --grep "login"

# Run tests for a specific browser
bunx playwright test --project=chromium

# Run tests for mobile devices only
bunx playwright test --project="Mobile Chrome" --project="Mobile Safari"
```

### Test Configuration

The test configuration is defined in `playwright.config.ts`:

- **Base URL**: `http://localhost:4173` (Vite preview server)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retries**: 2 retries on CI, 0 locally
- **Reporters**: HTML, JSON, JUnit
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Traces**: On first retry

## Writing Tests

### Test Structure

Tests are organized in the `tests/e2e/` directory:

```
tests/e2e/
├── specs/           # Test specifications
├── page-objects/    # Page Object Models
├── fixtures/        # Test data and fixtures
└── utils/          # Test utilities and helpers
```

### Basic Test Template

```typescript
import { test, expect } from '@playwright/test';
import { DashboardPage } from '../page-objects';
import { TestHelpers } from '../utils/test-helpers';
import { TestData } from '../fixtures/test-data';

test.describe('Feature Name', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await TestHelpers.clearAllStorage(page);
    await dashboardPage.navigateToDashboard();
  });

  test('should perform expected behavior', async () => {
    await test.step('Given some initial state', async () => {
      // Setup code
    });

    await test.step('When user performs action', async () => {
      // Action code
    });

    await test.step('Then expected result occurs', async () => {
      // Assertion code
      await expect(someElement).toBeVisible();
    });
  });
});
```

### Test Organization Best Practices

1. **Group related tests** using `test.describe()`
2. **Use test steps** for better reporting and readability
3. **Clear test data** before each test using `TestHelpers.clearAllStorage()`
4. **Use descriptive test names** that explain the behavior being tested
5. **Keep tests independent** - each test should be able to run in isolation

## Page Object Models

Page Object Models provide a clean interface for interacting with application pages.

### Using Existing Page Objects

```typescript
import { DashboardPage, AlarmFormPage, AuthPage } from '../page-objects';

test('should create alarm through dashboard', async ({ page }) => {
  const dashboardPage = new DashboardPage(page);
  const alarmFormPage = new AlarmFormPage(page);

  await dashboardPage.navigateToDashboard();
  await dashboardPage.clickAddAlarmButton();
  await alarmFormPage.createBasicAlarm('07:00', 'Morning Alarm');
});
```

### Available Page Objects

- **BasePage**: Common functionality for all pages
- **DashboardPage**: Main dashboard interactions
- **AlarmFormPage**: Alarm creation and editing
- **AuthPage**: Login, signup, and authentication flows
- **SettingsPage**: Application settings management

### Creating New Page Objects

```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class NewFeaturePage extends BasePage {
  readonly page: Page;
  readonly specificElement: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.specificElement = page.locator('[data-testid="specific-element"]');
  }

  async performAction() {
    await this.specificElement.click();
  }

  async verifyResult() {
    await expect(this.specificElement).toBeVisible();
  }
}
```

## Test Data and Fixtures

### Using Test Data

```typescript
import { TestData } from '../fixtures/test-data';

test('should login with valid user', async () => {
  const user = TestData.USERS.VALID_USER;
  await authPage.login(user.email, user.password);
});

test('should create alarm with test data', async () => {
  const alarm = TestData.ALARMS.WORK_ALARM;
  await alarmFormPage.createRecurringAlarm(
    alarm.time,
    alarm.label,
    alarm.days!
  );
});
```

### Generating Dynamic Test Data

```typescript
// Generate random user data
const randomUser = TestData.generateRandomUser();

// Generate random alarm data
const randomAlarm = TestData.generateRandomAlarm();

// Get future time for alarm testing
const futureTime = TestData.getFutureTime(10); // 10 minutes from now
```

### Mock Responses

```typescript
import { MockResponses } from '../fixtures/test-data';
import { TestHelpers } from '../utils/test-helpers';

test('should handle API failure gracefully', async ({ page }) => {
  await TestHelpers.interceptApiCalls(
    page,
    '/api/alarms',
    MockResponses.ERROR_RESPONSE
  );

  // Test error handling behavior
});
```

## Debugging Tests

### Local Debugging

#### 1. Playwright UI Mode (Recommended)
```bash
bun run test:e2e:ui
```
- Interactive test execution
- Step-by-step debugging
- Live browser preview
- Test recording capabilities

#### 2. Debug Mode
```bash
bun run test:e2e:debug
```
- Runs tests with debugger attached
- Browser stays open for inspection
- Console logging enabled

#### 3. Headed Mode
```bash
bun run test:e2e:headed
```
- Tests run with visible browser
- See real-time test execution
- Good for understanding test flow

### Debugging Specific Tests

```bash
# Debug a specific test file
bunx playwright test tests/e2e/specs/dashboard.spec.ts --debug

# Debug tests matching a pattern
bunx playwright test --grep "login" --debug

# Debug with specific browser
bunx playwright test --project=chromium --debug
```

### Using Browser Developer Tools

When debugging, you can access browser developer tools:

```typescript
test('debug with browser tools', async ({ page }) => {
  await page.goto('/dashboard');

  // Pause execution and open developer tools
  await page.pause();

  // Test continues after you resume
  await expect(page.locator('h1')).toBeVisible();
});
```

### Screenshots and Videos

Tests automatically capture screenshots and videos on failure. You can also manually capture:

```typescript
test('manual screenshots', async ({ page }) => {
  await page.goto('/dashboard');

  // Take screenshot
  await page.screenshot({ path: 'debug-screenshot.png' });

  // Take full page screenshot
  await page.screenshot({
    path: 'debug-full-page.png',
    fullPage: true
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow

The E2E tests run automatically on:
- **Push** to main/develop branches
- **Pull requests** to main/develop branches
- **Manual dispatch** with test suite selection

### Workflow Features

1. **Multi-browser testing** across Chromium, Firefox, WebKit, and mobile
2. **Parallel execution** for faster feedback
3. **Test artifacts** with reports and screenshots
4. **PR comments** with test result summaries
5. **Mobile-specific testing** on main branch pushes
6. **Accessibility testing** for compliance
7. **Performance testing** for critical flows

### Manual Workflow Dispatch

You can manually trigger E2E tests with specific parameters:

1. Go to Actions tab in GitHub
2. Select "E2E Tests" workflow
3. Click "Run workflow"
4. Choose test suite: all, desktop, mobile, auth, dashboard, alarms, settings

### Viewing Results

- **Test reports** are uploaded as artifacts
- **Screenshots** are available for failed tests
- **PR comments** provide quick summaries
- **GitHub job summaries** show detailed results

## Mobile Testing

### Mobile Device Configuration

Tests run on simulated mobile devices:
- **Mobile Chrome** (Pixel 5)
- **Mobile Safari** (iPhone 12)

### Mobile-Specific Tests

```typescript
import { devices } from '@playwright/test';

test.describe('Mobile Experience', () => {
  test.use({ ...devices['iPhone 12'] });

  test('should work on mobile', async ({ page }) => {
    // Mobile-specific test logic
    await page.goto('/');

    // Test touch interactions
    await page.locator('button').tap();

    // Test mobile-specific UI
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    await expect(mobileNav).toBeVisible();
  });
});
```

### Mobile Testing Features

- **Touch interactions** (tap, swipe, long press)
- **Viewport simulation** for different screen sizes
- **Mobile navigation patterns**
- **PWA functionality** (install prompts, offline mode)
- **Performance testing** on mobile networks
- **Accessibility** on mobile devices

## Accessibility Testing

### Built-in Accessibility Checks

The test framework includes accessibility utilities:

```typescript
import { TestHelpers } from '../utils/test-helpers';

test('should meet accessibility standards', async ({ page }) => {
  await page.goto('/dashboard');

  // Run accessibility checks
  await TestHelpers.checkAccessibility(page);

  // Check specific element
  await TestHelpers.checkAccessibility(page, '[data-testid="alarm-form"]');
});
```

### Accessibility Features Tested

- **ARIA labels** and roles
- **Keyboard navigation**
- **Focus management**
- **Alt text** for images
- **Form labels** and associations
- **Color contrast** (when possible)
- **Screen reader compatibility**

## Best Practices

### Test Writing

1. **Use data-testid attributes** for reliable element selection
2. **Wait for elements** instead of using fixed timeouts
3. **Test user flows** rather than implementation details
4. **Keep tests independent** and isolated
5. **Use meaningful assertions** with good error messages
6. **Group related tests** with describe blocks
7. **Clean up test data** after each test

### Element Selection

```typescript
// ✅ Good - using data-testid
await page.locator('[data-testid="add-alarm-button"]').click();

// ✅ Good - using role and text
await page.getByRole('button', { name: 'Add Alarm' }).click();

// ❌ Avoid - fragile selectors
await page.locator('.btn.btn-primary.alarm-button').click();
```

### Waiting Strategies

```typescript
// ✅ Good - wait for specific condition
await expect(page.locator('[data-testid="alarm-item"]')).toBeVisible();

// ✅ Good - wait for network to be idle
await page.waitForLoadState('networkidle');

// ❌ Avoid - arbitrary timeouts
await page.waitForTimeout(5000);
```

### Test Data Management

```typescript
// ✅ Good - use test data constants
const testAlarm = TestData.ALARMS.BASIC_ALARM;

// ✅ Good - generate dynamic data when needed
const uniqueEmail = TestData.generateRandomUser().email;

// ❌ Avoid - hardcoded test data
await authPage.login('test@example.com', 'password123');
```

## Troubleshooting

### Common Issues

#### 1. Tests fail with "element not found"
```bash
# Check if elements have correct data-testid attributes
# Verify app is fully loaded before interacting
await page.waitForLoadState('networkidle');
```

#### 2. Flaky tests
```bash
# Add proper waits instead of timeouts
await expect(element).toBeVisible();

# Use test isolation
await TestHelpers.clearAllStorage(page);
```

#### 3. Browser installation issues
```bash
# Reinstall browsers
bun run test:e2e:install

# Install system dependencies (Linux)
sudo apt-get install -y libwoff2dec-1.0-2 libwebpdemux2 libwebpmux3
```

#### 4. Port conflicts
```bash
# Check if port 4173 is available
netstat -tulpn | grep 4173

# Kill process using the port
kill -9 $(lsof -t -i:4173)
```

### Debugging Checklist

1. **Build the app** - `bun run build`
2. **Check browser installation** - `bunx playwright install`
3. **Verify test configuration** - Check `playwright.config.ts`
4. **Run single test** - Isolate the failing test
5. **Use headed mode** - See what's happening visually
6. **Check console logs** - Look for JavaScript errors
7. **Inspect network tab** - Check for failed API calls
8. **Verify test data** - Ensure test data is valid

### Getting Help

1. **Check test reports** in `playwright-report/` directory
2. **Review screenshots** in `test-results/` directory
3. **Run with debug mode** for step-by-step execution
4. **Check GitHub Actions logs** for CI failures
5. **Use Playwright UI** for interactive debugging

### Reporting Issues

When reporting test issues, include:

1. **Test command** used
2. **Error message** and stack trace
3. **Browser version** and OS
4. **Screenshots** if applicable
5. **Steps to reproduce**
6. **Expected vs actual behavior**

## Advanced Features

### Custom Test Utilities

Create reusable test utilities in `tests/e2e/utils/`:

```typescript
// tests/e2e/utils/alarm-helpers.ts
export class AlarmHelpers {
  static async createTestAlarm(page: Page, time: string, label: string) {
    const alarmForm = new AlarmFormPage(page);
    await alarmForm.openAlarmForm();
    await alarmForm.createBasicAlarm(time, label);
  }

  static async deleteAllAlarms(page: Page) {
    // Implementation for cleaning up alarms
  }
}
```

### Environment Variables

Configure tests with environment variables:

```typescript
// In your test
const baseUrl = process.env.BASE_URL || 'http://localhost:4173';
const testUser = process.env.TEST_USER_EMAIL || 'test@example.com';
```

### Custom Fixtures

Create custom fixtures for common test setup:

```typescript
// tests/e2e/fixtures/custom-fixtures.ts
import { test as base } from '@playwright/test';
import { DashboardPage } from '../page-objects';

type CustomFixtures = {
  dashboardPage: DashboardPage;
  authenticatedPage: DashboardPage;
};

export const test = base.extend<CustomFixtures>({
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  authenticatedPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);

    await authPage.navigateToLogin();
    await authPage.loginWithTestUser();
    await dashboardPage.navigateToDashboard();

    await use(dashboardPage);
  },
});
```

---

This documentation should be updated as the test suite evolves. For questions or improvements, please open an issue or submit a pull request.