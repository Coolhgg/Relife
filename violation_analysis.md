# No-Undef Violation Analysis

## Summary

Total violations: 489

## Categories by Priority and Type

### 1. React/Component Related (8+ violations)

- `React` (8) - Missing React imports in component files
- `JSX` (3) - JSX namespace issues
- `defaultProps` (4) - Default props not defined

### 2. Testing Framework Issues (50+ violations)

- `expect` (12) - Jest expect not imported
- `jest` (6) - Jest globals not available
- `describe` (3) - Test describe not imported
- `test` (4) - Test function not imported
- `renderWithProviders` (17) - Custom test utility not imported
- `testEnv` (4) - Test environment setup
- `testConsole` (6) - Console testing utilities

### 3. Mock Objects & Test Data (50+ violations)

- `i18nMocks` (10) - Internationalization mocks
- `storageMocks` (8) - Storage API mocks
- `audioMocks` (8) - Audio system mocks
- `mockSessionStorage` (5) - Session storage mocks
- `mockLocalStorage` (5) - Local storage mocks
- `mockGeolocation` (4) - Geolocation mocks
- `createMockServices` (5) - Service creation utilities
- `generateRealisticTestData` (5) - Test data generators

### 4. Web API Types (30+ violations)

- `EventListener` (16) - DOM event listener type
- `NotificationPermission` (14) - Notification API type
- `NotificationOptions` (4) - Notification configuration type
- `HeadersInit` (from summary) - Fetch API type

### 5. Business Logic & Services (50+ violations)

- `alarm` (23) - Alarm domain object/service
- `SubscriptionService` (15) - Subscription management
- `PremiumFeatureAccess` (8) - Premium feature checks
- `completedChallenges` (8) - Challenge tracking
- `alarms` (4) - Alarm collection
- `NuclearChallengeType` (5) - Challenge type enum

### 6. Mobile/Capacitor (7+ violations)

- `Capacitor` (7) - Capacitor framework globals

### 7. Utilities & Helpers (40+ violations)

- `asyncUtils` (8) - Async operation utilities
- `performanceCore` (6) - Performance monitoring
- `memoryTesting` (7) - Memory management testing
- `colorContrast` (6) - Accessibility color utilities
- `styling` (5) - Styling utilities
- `loadingStates` (5) - Loading state management
- `apiUtils` (4) - API interaction utilities
- `orientation` (4) - Device orientation
- `keyboardNavigation` (3) - Keyboard navigation helpers
- `reactPerformance` (3) - React performance utilities
- `reactAsync` (4) - React async patterns

### 8. Miscellaneous (30+ violations)

- `server` (7) - Server configuration/setup
- `http` (3) - HTTP utilities
- `Theme` (4) - Theme management
- Various single-occurrence items

## Fix Strategy Priority

1. **High Priority (Quick wins, many files affected)**
   - React imports (8 files) - Simple import additions
   - Testing utilities (70+ violations) - Import test helpers
   - Type definitions (30+ violations) - Add TypeScript types

2. **Medium Priority (Business logic)**
   - Service imports and definitions (50+ violations)
   - Utilities and helpers (40+ violations)

3. **Lower Priority (Complex/fewer occurrences)**
   - Mock object setup (50+ violations) - May need restructuring
   - Capacitor globals (7 violations)
   - Miscellaneous items (30+ violations)
