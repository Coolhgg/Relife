# Integration Tests for Critical User Flows

This directory contains comprehensive integration tests that validate end-to-end user journeys in the Relife alarm application. These tests complement the existing E2E tests by focusing on complex, multi-step workflows that span multiple components and services.

## Test Structure

### 1. Complete Alarm Lifecycle Integration (`alarm-lifecycle.integration.test.ts`)
Tests the entire alarm journey from creation to completion:
- ✅ User authentication and dashboard access
- ✅ Alarm creation with all features (basic, recurring, advanced)
- ✅ Service worker integration and background scheduling
- ✅ Alarm triggering and notification handling
- ✅ User interactions (snooze, dismiss) 
- ✅ Analytics tracking and rewards system integration
- ✅ Premium feature access control
- ✅ Error handling and graceful degradation
- ✅ Performance validation (< 2s alarm creation, < 3s app init)

### 2. Offline/Online Sync Integration (`offline-sync.integration.test.ts`)
Tests comprehensive offline functionality and synchronization:
- ✅ Offline alarm operations (create, edit, delete)
- ✅ Local storage and pending changes management
- ✅ Automatic sync when back online
- ✅ Conflict resolution (server vs local changes)
- ✅ Background sync via service worker
- ✅ Cross-device synchronization
- ✅ Network failure handling and recovery

### 3. Premium Upgrade Flow (`premium-upgrade.integration.test.ts`)
Tests the complete subscription and premium features flow:
- ✅ Premium feature discovery and paywall
- ✅ Free tier limitations and upgrade prompts
- ✅ Payment processing with Stripe integration
- ✅ Feature unlocking after successful payment
- ✅ Subscription management and billing
- ✅ Trial period handling (start, usage, expiration)
- ✅ Persona-based upgrade flows
- ✅ Payment failure handling
- ✅ Downgrade and cancellation scenarios

### 4. Notification & Service Worker Integration (`notification-service-worker.integration.test.ts`)
Tests background processing and notification systems:
- ✅ Service worker registration and initialization
- ✅ Push notification setup and permissions
- ✅ Background alarm triggering when tab inactive
- ✅ Tab protection and visibility handling
- ✅ Notification interactions (dismiss/snooze actions)
- ✅ Cross-tab communication and state sync
- ✅ Offline notification queuing
- ✅ Emotional intelligence notifications
- ✅ Performance under various browser states

### 5. Gaming & Rewards System (`gaming-rewards.integration.test.ts`)
Tests the complete gamification and social features:
- ✅ Reward system initialization and progression
- ✅ Achievement unlocking and notifications
- ✅ Level progression and experience tracking
- ✅ Battle creation and participation
- ✅ Social features (friends, leaderboards, trash talk)
- ✅ Analytics integration for gaming features
- ✅ Performance with large datasets (virtualization)
- ✅ Error handling and graceful degradation

## Key Testing Patterns

### 1. **End-to-End User Journeys**
Each test simulates real user workflows from start to finish, including authentication, navigation, form interactions, and result verification.

### 2. **Service Integration**
Tests validate integration between:
- Frontend components
- Backend services (Supabase)
- External APIs (Stripe, Push notifications)
- Browser APIs (Service Worker, Notifications)
- Analytics services (PostHog, Sentry)

### 3. **Error Handling & Resilience**
Comprehensive error scenarios:
- Network failures
- Payment failures
- Permission denials
- Service unavailability
- Invalid data states

### 4. **Performance Validation**
Built-in performance assertions:
- App initialization < 3 seconds
- Alarm creation < 2 seconds
- Large dataset handling (1000+ items)
- Memory leak prevention

### 5. **Cross-Platform Testing**
Tests account for different environments:
- Online/offline states
- Different device types
- Various browser capabilities
- Mobile vs desktop experiences

## Running Integration Tests

### Local Development

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test file
npm test tests/integration/alarm-lifecycle.integration.test.ts

# Run with coverage
npm run test:integration:coverage

# Run in watch mode for development
npm run test:integration:watch

# Run with UI interface
npm run test:integration:ui

# Run with debugging
npm run test:integration:debug
```

### CI/CD Integration

```bash
# Run in CI mode with GitHub reporter
npm run test:integration:ci

# Run as part of full CI pipeline
npm run ci:test:integration

# Combined unit + integration testing
npm run ci:test
```

## Test Configuration

### Vitest Integration Config (`vitest.integration.config.ts`)

Integration tests use a dedicated Vitest configuration:
- **Test Runner**: Vitest with happy-dom environment
- **Component Testing**: @testing-library/react with user-event
- **Coverage**: V8 provider with dedicated integration coverage directory
- **Timeouts**: Extended timeouts for complex flows (30s test, 10s hooks)
- **Parallel Execution**: Multi-threaded with up to 4 workers
- **Reporting**: Multiple formats (JSON, JUnit, HTML) for CI/CD integration

### Technology Stack
- **Vitest** for test runner and assertions
- **@testing-library/react** for component testing
- **@testing-library/user-event** for realistic user interactions
- **MSW** for API mocking (when needed)
- **Custom mocks** for browser APIs and external services
- **Performance monitoring** with built-in timing assertions

## Mock Strategy

The tests use comprehensive mocking via `tests/utils/test-mocks.ts`:
- **Navigator APIs**: geolocation, clipboard, permissions, vibration
- **Storage APIs**: localStorage, sessionStorage, IndexedDB
- **Web APIs**: fetch, ResizeObserver, IntersectionObserver
- **Media APIs**: AudioContext, HTMLAudioElement, mediaDevices
- **External Services**: Stripe, Supabase, Capacitor plugins

## Critical User Flows Covered

1. **New User Onboarding**: Sign up → Create first alarm → Receive notifications
2. **Daily Alarm Usage**: View dashboard → Manage alarms → Handle notifications
3. **Premium Discovery**: Hit limits → View pricing → Subscribe → Access features
4. **Offline Usage**: Go offline → Create alarms → Sync when online
5. **Gaming Engagement**: Complete alarms → Earn rewards → Participate in battles
6. **Multi-Device Sync**: Use on phone → Switch to laptop → Data synced
7. **Background Reliability**: Close tab → Alarm still fires → Notification works

## Analytics Validation

Each test validates that appropriate analytics events are tracked:
- User actions (alarm_created, premium_upgrade, etc.)
- Feature usage (gaming_hub_accessed, notification_dismissed)
- Performance metrics (load_time, interaction_duration)
- Error tracking (payment_failed, sync_error)
- Conversion events (trial_started, subscription_activated)

## Test Data Management

Tests use factories and builders for consistent test data:
- `createMockUser()` - Generate users with various states
- `createMockAlarm()` - Generate alarms with different configurations
- `generateTestAlarms()` - Bulk alarm generation
- Realistic test scenarios based on actual user personas

## CI/CD Integration

### GitHub Actions Workflows

#### 1. Enhanced CI/CD Pipeline (`enhanced-ci-cd.yml`)
- Runs integration tests alongside unit tests
- Generates combined coverage reports
- Posts detailed coverage comments on PRs
- Uploads coverage to Codecov with separate flags

#### 2. PR Validation (`pr-validation.yml`)
- Quick integration test execution on PRs
- Validates critical user flows before merge
- Updates PR status with integration test results

#### 3. Dedicated Integration Tests (`integration-tests.yml`)
- **Matrix Testing**: Runs each test suite individually
- **Full Suite**: Comprehensive integration test execution
- **Performance Monitoring**: Regression detection
- **Daily Health Checks**: Scheduled runs to catch issues
- **Failure Alerts**: Creates GitHub issues for failed daily checks

### CI/CD Features
- **Parallel Execution**: Matrix strategy for individual test suites
- **Performance Tracking**: Built-in performance regression detection
- **Environment Mocking**: Consistent test environment setup
- **Coverage Integration**: Separate integration coverage tracking
- **Artifact Storage**: Test results and coverage reports preserved
- **Health Monitoring**: Daily scheduled runs with failure alerting
- **PR Integration**: Automated reporting on pull requests

## Environment Configuration

### Local Development Environment

```bash
# Required environment variables for integration tests
export NODE_ENV=test

# Mock external service URLs (automatically set in package.json scripts)
export VITE_SUPABASE_URL=https://test.supabase.co
export VITE_SUPABASE_ANON_KEY=test_key_12345
export VITE_STRIPE_PUBLISHABLE_KEY=pk_test_123456
export VITE_POSTHOG_KEY=phc_test_123456
export VITE_SENTRY_DSN=https://test@sentry.io/123456

# Performance testing thresholds
export PERFORMANCE_ALARM_CREATION_THRESHOLD=2000
export PERFORMANCE_APP_INIT_THRESHOLD=3000
```

### CI/CD Environment

Integration tests in CI/CD use the same mock environment variables, ensuring consistent behavior across local development and automated testing.

## Debugging Integration Tests

### Local Debugging

```bash
# Run with verbose output
npm run test:integration -- --reporter=verbose

# Debug specific test file
npm run test:integration:debug tests/integration/alarm-lifecycle.integration.test.ts

# Run with UI for interactive debugging
npm run test:integration:ui
```

### CI/CD Debugging

1. **GitHub Actions Logs**: Check workflow run logs for detailed output
2. **Test Artifacts**: Download test results and coverage reports
3. **Coverage Reports**: View integration coverage in Codecov
4. **Performance Metrics**: Check step summaries for performance data

### Common Issues and Solutions

#### Test Timeouts
- **Cause**: Complex integration flows taking longer than expected
- **Solution**: Adjust timeout values in `vitest.integration.config.ts`

#### Service Worker Mocking
- **Cause**: Service worker registration failing in test environment
- **Solution**: Check mock setup in `tests/utils/test-mocks.ts`

#### Payment Flow Testing
- **Cause**: Stripe integration not properly mocked
- **Solution**: Verify Stripe mock configuration and test environment keys

## Future Enhancements

Planned additions:
- **Multi-language testing**: Integration tests with different locales
- **Accessibility validation**: A11y checks within integration flows
- **Performance regression detection**: Automated performance monitoring
- **Visual regression testing**: Screenshot comparison for UI changes
- **Load testing**: High-concurrency scenario validation
- **Mobile-specific flows**: Capacitor plugin integration testing
- **Real-time features**: WebSocket and real-time sync testing