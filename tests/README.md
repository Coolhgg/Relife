# E2E Tests

This directory contains end-to-end tests for the Relife Alarm application using Playwright.

## Quick Start

```bash
# Install dependencies
bun install

# Install Playwright browsers
bun run test:e2e:install

# Build app and run tests
bun run build
bun run test:e2e
```

## Directory Structure

```
tests/e2e/
├── specs/              # Test specifications
│   ├── dashboard.spec.ts           # Dashboard functionality tests
│   ├── alarm-management.spec.ts    # Alarm CRUD operations
│   ├── authentication.spec.ts      # Login/signup/logout flows
│   ├── settings.spec.ts           # Settings management tests
│   └── mobile-experience.spec.ts   # Mobile-specific tests
├── page-objects/       # Page Object Models
│   ├── base-page.ts              # Common page functionality
│   ├── dashboard-page.ts         # Dashboard interactions
│   ├── alarm-form-page.ts        # Alarm creation/editing
│   ├── auth-page.ts             # Authentication flows
│   ├── settings-page.ts         # Settings management
│   └── index.ts                 # Page object exports
├── fixtures/          # Test data and mock responses
│   └── test-data.ts             # Centralized test data
├── utils/            # Test utilities and helpers
│   └── test-helpers.ts          # Common test functions
└── auth/            # Authentication test utilities
```

## Test Categories

### 🏠 Dashboard Tests

- Main navigation verification
- Responsive design testing
- Loading states and error handling
- PWA install prompts
- Accessibility compliance

### ⏰ Alarm Management Tests

- Create, edit, delete alarms
- Recurring alarm configuration
- Sound preview and selection
- Alarm toggle functionality
- Form validation

### 🔐 Authentication Tests

- Login with valid/invalid credentials
- User registration flow
- Password reset functionality
- Session management
- Social login integration

### ⚙️ Settings Tests

- Theme and language changes
- Sound and notification settings
- Accessibility feature toggles
- Data export/import
- Premium feature access

### 📱 Mobile Experience Tests

- Touch interactions (tap, swipe, long press)
- Mobile navigation patterns
- Responsive layout verification
- PWA functionality
- Performance on mobile networks

## Quick Commands

```bash
# Run all tests
bun run test:e2e

# Run with browser UI (great for debugging)
bun run test:e2e:ui

# Run specific test file
bunx playwright test tests/e2e/specs/dashboard.spec.ts

# Run only mobile tests
bun run test:e2e:mobile

# Debug mode (step through tests)
bun run test:e2e:debug

# Generate new tests
bun run test:e2e:codegen
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from "@playwright/test";
import { DashboardPage } from "../page-objects";

test.describe("Feature Name", () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.navigateToDashboard();
  });

  test("should perform expected behavior", async () => {
    // Test implementation
  });
});
```

### Using Page Objects

```typescript
// Good - use page objects for clean, maintainable tests
await dashboardPage.clickAddAlarmButton();
await alarmFormPage.createBasicAlarm("07:00", "Morning Alarm");

// Avoid - direct page interactions
await page.click('[data-testid="add-alarm"]');
```

### Test Data

```typescript
import { TestData } from "../fixtures/test-data";

// Use predefined test data
const user = TestData.USERS.VALID_USER;
const alarm = TestData.ALARMS.WORK_ALARM;

// Generate dynamic data when needed
const randomUser = TestData.generateRandomUser();
```

## Best Practices

1. ✅ **Use data-testid attributes** for reliable element selection
2. ✅ **Wait for elements** instead of using fixed timeouts
3. ✅ **Test user journeys** rather than implementation details
4. ✅ **Keep tests independent** - each should run in isolation
5. ✅ **Clean up after tests** - clear storage and reset state
6. ✅ **Use meaningful test names** that describe the behavior
7. ✅ **Group related tests** with describe blocks

## Debugging

When tests fail:

1. **Run with UI mode** - `bun run test:e2e:ui`
2. **Check screenshots** - Automatically captured on failure
3. **Run in headed mode** - `bun run test:e2e:headed`
4. **Use debug mode** - `bun run test:e2e:debug`
5. **Check test reports** - `bun run test:e2e:report`

## CI/CD

Tests run automatically on:

- Push to main/develop branches
- Pull requests
- Manual workflow dispatch

Results are reported as:

- GitHub job summaries
- PR comments with test status
- Uploaded artifacts (reports, screenshots)

For more detailed information, see [E2E Testing Documentation](../docs/e2e-testing.md).
