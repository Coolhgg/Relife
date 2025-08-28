# Getting Started with Relife Testing Framework

This guide will help you get up and running with the Relife testing framework quickly.

## Prerequisites

- Node.js 18+ and bun package manager
- Basic knowledge of TypeScript and React
- Familiarity with testing concepts

## Installation & Setup

The testing framework is already included with the Relife project. No additional installation needed.

### Verify Setup

Run the test suite to ensure everything is working:

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Run specific test file
bun test src/__tests__/components/AlarmCard.test.tsx

# Run tests in watch mode
bun test --watch
```

## Your First Test

Let's create a simple test for an alarm component:

```typescript
// src/__tests__/components/AlarmCard.test.tsx
import { render, screen } from '@testing-library/react';
import { testHelpers } from '../helpers/comprehensive-test-helpers';
import { AlarmCard } from '../../components/AlarmCard';

describe('AlarmCard Component', () => {
  const mockAlarm = {
    id: '1',
    userId: 'user-123',
    label: 'Morning Workout',
    time: '06:30',
    enabled: true,
    days: [1, 2, 3, 4, 5], // Monday to Friday
    voiceMood: 'motivational' as const,
    difficulty: 'medium' as const,
  };

  it('displays alarm information correctly', () => {
    render(<AlarmCard alarm={mockAlarm} />);
    
    expect(screen.getByText('Morning Workout')).toBeInTheDocument();
    expect(screen.getByText('06:30')).toBeInTheDocument();
    expect(screen.getByText(/motivational/i)).toBeInTheDocument();
  });

  it('handles enable/disable toggle', async () => {
    render(<AlarmCard alarm={mockAlarm} />);
    
    const toggleButton = screen.getByRole('switch');
    expect(toggleButton).toBeChecked();
    
    await testHelpers.user.click(toggleButton);
    expect(toggleButton).not.toBeChecked();
  });
});
```

## Using Test Helpers

The framework provides comprehensive test helpers for common operations:

### Basic User Interactions

```typescript
import { testHelpers } from '../helpers/comprehensive-test-helpers';

// Type with realistic delays
await testHelpers.typeWithDelay(inputElement, 'test@example.com', 100);

// Click and wait for response
await testHelpers.clickAndWaitForResponse(
  button,
  () => screen.queryByText(/success/i) !== null
);

// Fill forms with validation
await testHelpers.fillFormWithValidation({
  email: 'test@example.com',
  password: 'SecurePassword123!',
  name: 'Test User'
});
```

### Navigation Testing

```typescript
// Navigate to a route
await testHelpers.navigateTo('/alarms');

// Verify current route
await testHelpers.verifyCurrentRoute('/alarms');

// Test modal interactions
const modal = await testHelpers.openModal(triggerButton);
await testHelpers.closeModal('escape');
```

### Advanced Waiting

```typescript
// Wait for data to load
await testHelpers.waitForDataLoad('[data-testid="loading"]');

// Wait for custom conditions
await testHelpers.waitForCondition(
  () => document.querySelectorAll('.alarm-card').length > 0
);

// Wait for elements to appear/disappear
await testHelpers.waitForElement(() => 
  screen.queryByText('Alarm created successfully')
);
```

## Using Relife-Specific Utilities

The framework includes utilities specifically for Relife features:

### Alarm Testing

```typescript
import { relifeTestUtils } from '../helpers/comprehensive-test-helpers';

// Create a test alarm
await relifeTestUtils.createTestAlarm({
  label: 'Test Alarm',
  time: '07:00',
  days: [1, 2, 3, 4, 5],
  voiceMood: 'gentle',
  difficulty: 'medium'
});
```

### Battle Testing

```typescript
// Join a battle
await relifeTestUtils.joinBattle('quick');

// Test battle completion flow
await relifeTestUtils.joinBattle('ranked');
```

### Voice Testing

```typescript
// Test voice recording
await relifeTestUtils.testVoiceRecording(5000); // 5 second recording
```

### Subscription Testing

```typescript
// Test subscription purchase
await relifeTestUtils.purchaseSubscription('premium');
```

## Mock Services

All external services are automatically mocked. You can control their behavior:

### Alarm Service Mock

```typescript
import { MockAlarmService } from '../mocks/service-mocks';

beforeEach(() => {
  // Reset mock state
  MockAlarmService.reset();
  
  // Set scenario (success, error, slow)
  MockAlarmService.setScenario('success');
});

// Get call history for verification
const calls = MockAlarmService.getCallHistory();
expect(calls.addAlarm).toHaveBeenCalledWith(expectedAlarmData);
```

### API Response Control

```typescript
import { ApiTestClient } from '../api/api-testing-utilities';

const apiClient = new ApiTestClient();

// Set response scenario
apiClient.setScenario('error'); // Will return error responses

// Make test requests
const response = await apiClient.request('GET', '/api/alarms');
expect(response.status).toBe(500);
```

## Test Data and Factories

Use the built-in factories for consistent test data:

```typescript
import { MockDataFactory } from '../api/enhanced-msw-handlers';

// Create test users
const user = MockDataFactory.createUser({
  email: 'custom@example.com',
  subscription: { tier: 'premium' }
});

// Create test alarms
const alarm = MockDataFactory.createAlarm({
  label: 'Custom Alarm',
  difficulty: 'hard'
});

// Create test battles
const battle = MockDataFactory.createBattle({
  participants: ['user1', 'user2'],
  difficulty: 'medium'
});
```

## Assertions and Expectations

The framework extends Jest/Vitest with custom matchers:

```typescript
// Custom alarm validation
expect(alarmData).toBeValidAlarm();

// Custom user validation
expect(userData).toBeValidUser();

// Performance assertions
await expect(async () => {
  await loadAlarms();
}).toLoadWithinTime(1000); // 1 second

// Accessibility checks
expect(buttonElement).toHaveAccessibilityAttributes();

// Responsive design checks
expect(containerElement).toBeResponsive();
```

## Performance Testing

Add performance monitoring to your tests:

```typescript
import { performanceTestSuite } from '../performance/performance-testing-utilities';

describe('Alarm Performance', () => {
  it('should create alarms quickly', async () => {
    const { result, renderTime } = await testHelpers.measureRenderTime(
      () => relifeTestUtils.createTestAlarm()
    );
    
    expect(renderTime).toBeLessThan(500); // 500ms
  });
});
```

## Mobile Testing

Test mobile-specific functionality:

```typescript
// Simulate mobile gestures
await testHelpers.simulateSwipe(element, 'left', 200);
await testHelpers.simulateLongPress(element, 1000);

// Test with device profiles
import { mobilePerformanceTester } from '../performance/performance-testing-utilities';

const results = await mobilePerformanceTester.testWithDeviceProfile({
  device: 'low-end',
  platform: 'android',
  networkCondition: '3g'
});
```

## Error Testing

Test error scenarios effectively:

```typescript
// Force error conditions
MockAlarmService.setScenario('error');

// Test error handling
await testHelpers.verifyErrorHandling(
  () => relifeTestUtils.createTestAlarm(),
  /failed to create alarm/i
);

// Test error boundaries
await testHelpers.triggerError(errorTriggerComponent);
```

## Best Practices

### 1. Test Structure
```typescript
describe('Feature: User Management', () => {
  describe('When user registers', () => {
    beforeEach(() => {
      // Setup for this scenario
    });
    
    it('should create user account', async () => {
      // Test implementation
    });
    
    it('should send welcome email', async () => {
      // Test implementation
    });
  });
});
```

### 2. Async Testing
```typescript
// Always await async operations
await relifeTestUtils.createTestAlarm();

// Use proper waiting utilities
await testHelpers.waitForElement(() => screen.queryByText('Success'));

// Don't use arbitrary timeouts
// ❌ Bad
setTimeout(() => expect(something).toBe(true), 1000);

// ✅ Good
await testHelpers.waitForCondition(() => something === true);
```

### 3. Clean Test Data
```typescript
beforeEach(() => {
  // Reset all mocks and state
  testHelpers.clearTestState();
  MockAlarmService.reset();
  MockSubscriptionService.reset();
});
```

### 4. Descriptive Tests
```typescript
// ❌ Bad
it('should work', () => {});

// ✅ Good
it('should display error message when alarm creation fails', async () => {});
```

## Common Patterns

### Testing Forms
```typescript
it('should validate form inputs', async () => {
  render(<AlarmForm />);
  
  // Test validation
  await testHelpers.validateFormField('label', '', 'invalid');
  await testHelpers.validateFormField('label', 'Valid Label', 'valid');
  
  // Submit form
  await testHelpers.fillFormWithValidation({
    label: 'Morning Alarm',
    time: '07:00'
  });
  
  const form = screen.getByRole('form');
  await testHelpers.submitForm(form, 'success');
});
```

### Testing Loading States
```typescript
it('should show loading state while creating alarm', async () => {
  render(<AlarmCreator />);
  
  const createButton = screen.getByRole('button', { name: /create/i });
  await testHelpers.user.click(createButton);
  
  // Verify loading state
  expect(screen.getByText(/creating/i)).toBeInTheDocument();
  
  // Wait for completion
  await testHelpers.waitForDataLoad();
  expect(screen.getByText(/created successfully/i)).toBeInTheDocument();
});
```

## Next Steps

1. Read the [API Testing Guide](./api-testing-guide.md) for backend testing
2. Check the [Performance Testing Guide](./performance-testing-guide.md) for performance monitoring
3. Review [Mobile Testing Guide](./mobile-testing-guide.md) for mobile-specific testing
4. Explore [Integration Testing Guide](./integration-testing-guide.md) for E2E testing

## Troubleshooting

If you encounter issues:

1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Verify mock services are properly reset
3. Ensure async operations are properly awaited
4. Check test environment configuration

---

You're now ready to start writing comprehensive tests for the Relife application! Remember to leverage the framework's utilities and follow the established patterns for the best testing experience.