# Custom React Hooks Inventory - Relife Alarm App

## Overview

This document provides a comprehensive inventory of all custom React hooks in the Relife alarm application. The analysis covers 45 custom hooks providing sophisticated functionality for authentication, theming, accessibility, mobile features, PWA capabilities, analytics, and advanced alarm management.

## Summary Statistics

- **Total Custom Hooks**: 45
- **Primary Hook Files**: 44 (43 .ts + 1 .tsx files)
- **Test Files**: 1 existing test file (useTheme.test.tsx)
- **Test Coverage**: Currently minimal (<5% of hooks tested)

---

## Core System Hooks

### 1. Authentication & User Management

#### **useAuth.ts**

- **Purpose**: Complete authentication system with security, session management, and analytics
- **Dependencies**:
  - Services: SupabaseService, SecurityService, AnalyticsService, ErrorHandler
  - External: Supabase auth, localStorage
- **State Management**:
  - `user`, `isLoading`, `isInitialized`, `error`, `forgotPasswordSuccess`
  - `sessionExpiry`, `csrfToken`, `rateLimitRemaining`
- **Key Functions**:
  - Auth: `signIn`, `signUp`, `signOut`, `resetPassword`
  - Session: `refreshSession`, `isSessionValid`, `getRateLimitInfo`
  - Profile: `updateUserProfile`, `clearError`
- **Testing Priority**: **HIGH** (security critical)
- **Complex Logic**: Rate limiting, session timeouts, CSRF protection, activity tracking

#### **useSubscription.ts**

- **Purpose**: Premium subscription management with billing and feature access control
- **Dependencies**:
  - Services: SubscriptionService, StripeService, ErrorHandler, AnalyticsService
  - External: Stripe API, payment processing
- **State Management**:
  - `subscription`, `currentPlan`, `userTier`, `featureAccess`, `usage`
  - `availablePlans`, `paymentMethods`, `invoiceHistory`
- **Key Functions**:
  - Subscription: `createSubscription`, `updateSubscription`, `cancelSubscription`
  - Features: `hasFeatureAccess`, `trackFeatureUsage`, `getUpgradeRequirement`
  - Payment: `addPaymentMethod`, `removePaymentMethod`, `setDefaultPaymentMethod`
- **Testing Priority**: **HIGH** (revenue protection)
- **Complex Logic**: Billing cycles, feature gates, payment flows, trial management

---

## Theme & Accessibility System

#### **useTheme.tsx**

- **Purpose**: Advanced theme management with customization, accessibility, and premium features
- **Dependencies**:
  - Services: CloudSyncService, ThemePersistenceService, ThemePerformanceService, ThemeAccessibilityService, PremiumThemeAnimationService
  - External: localStorage, cloud sync, system preferences
- **State Management**:
  - `theme`, `themeConfig`, `personalization`, `isDarkMode`, `isSystemTheme`
  - `availableThemes`, `themeAnalytics`, `cloudSyncStatus`
- **Key Functions**:
  - Theme: `setTheme`, `toggleTheme`, `resetTheme`
  - Personalization: `updatePersonalization`, `updateColorPreference`
  - Accessibility: `testThemeAccessibility`, `calculateContrastRatio`
  - Premium: `initializePremiumAnimations`, `setAnimationIntensity`
- **Testing Priority**: **HIGH** (core UX feature)
- **Complex Logic**: Premium themes, cloud sync, accessibility compliance, CSS generation

#### **useAccessibility.ts**

- **Purpose**: Comprehensive accessibility features with screen reader, focus, and preference management
- **Dependencies**: Screen reader APIs, system accessibility preferences
- **Multiple Sub-hooks**:
  - `useAccessibility`: Main accessibility preferences
  - `useScreenReader`: Screen reader announcements
  - `useFocusManagement`: Focus management and trapping
  - `useAccessibleTooltip`: Accessible tooltip management
  - `useMobileAccessibility`: Mobile-specific accessibility
- **Testing Priority**: **HIGH** (legal compliance)
- **Complex Logic**: Screen reader compatibility, keyboard navigation, accessibility standards

#### **useAccessibilityPreferences.ts**

- **Purpose**: User accessibility preferences management
- **Dependencies**: localStorage, system preferences
- **Testing Priority**: **MEDIUM**

---

## Alarm System

#### **useAdvancedAlarms.ts**

- **Purpose**: Advanced alarm management with scheduling, optimization, and export/import
- **Dependencies**:
  - Services: AlarmService, AdvancedAlarmScheduler
  - External: Geolocation API, file system
- **State Management**: `alarms`, `loading`, `error`
- **Key Functions**:
  - CRUD: `createAlarm`, `updateAlarm`, `deleteAlarm`, `duplicateAlarm`
  - Bulk: `bulkUpdate`
  - Utilities: `getNextOccurrence`, `exportAlarms`, `importAlarms`
- **Testing Priority**: **HIGH** (core functionality)
- **Complex Logic**: Smart optimization, seasonal adjustments, conditional rules, geolocation triggers

#### **useEnhancedSmartAlarms.ts**

- **Purpose**: Enhanced smart alarm features with AI optimization
- **Dependencies**: Smart alarm scheduler, AI services
- **Testing Priority**: **MEDIUM**
- **Complex Logic**: AI-based optimization, learning algorithms

---

## PWA & Mobile Features

#### **usePWA.ts**

- **Purpose**: Progressive Web App features with multiple specialized hooks
- **Dependencies**: pwaManager service
- **Sub-hooks**:
  - `usePWA`: Main PWA functionality
  - `useInstallPrompt`: App installation management
  - `useServiceWorkerUpdate`: Service worker update handling
  - `usePushNotifications`: Push notification management
  - `useOffline`: Offline functionality
  - `useBackgroundSync`: Background sync operations
- **Testing Priority**: **HIGH** (core mobile experience)
- **Complex Logic**: PWA lifecycle, service worker management, background sync

#### **useCapacitor.ts**

- **Purpose**: Native mobile integration via Capacitor
- **Dependencies**: Capacitor plugins
- **Testing Priority**: **MEDIUM**
- **Complex Logic**: Native bridge communication

#### **useMobileTouch.ts**

- **Purpose**: Touch gestures, haptic feedback, mobile interactions
- **Dependencies**: Touch APIs, haptic APIs
- **Testing Priority**: **MEDIUM**
- **Complex Logic**: Gesture recognition, haptic patterns

#### **use-mobile.ts**

- **Purpose**: Mobile breakpoint detection and responsive behavior
- **Dependencies**: Media queries, viewport detection
- **Testing Priority**: **LOW**

---

## Analytics & Tracking

#### **useAnalytics.ts**

- **Purpose**: Analytics tracking with specialized domain hooks
- **Dependencies**: AnalyticsService (PostHog, etc.)
- **Sub-hooks**:
  - `useAlarmAnalytics`: Alarm-specific tracking
  - `useEngagementAnalytics`: User engagement tracking
  - `usePerformanceAnalytics`: Performance metrics
  - `usePageTracking`: Automatic page tracking
- **Testing Priority**: **MEDIUM**
- **Complex Logic**: Event categorization, user property management

---

## Audio & Sound System

#### **useSoundEffects.tsx**

- **Purpose**: Audio system with UI sounds, notifications, and alarm sounds
- **Dependencies**: soundEffectsService, Web Audio API
- **Sub-hooks**:
  - `useSoundEffects`: Main sound management
  - `useUISound`: UI interaction sounds
  - `useNotificationSounds`: Notification audio
  - `useAlarmSounds`: Alarm audio management
- **Testing Priority**: **MEDIUM**
- **Complex Logic**: Audio loading, theme management, playback control

---

## Internationalization

#### **useI18n.ts**

- **Purpose**: Internationalization with RTL support and specialized translation hooks
- **Dependencies**: react-i18next, LanguageContext
- **Sub-hooks**:
  - `useAlarmI18n`: Alarm-specific translations
  - `useAuthI18n`: Authentication translations
  - `useGamingI18n`: Gaming feature translations
  - `useSettingsI18n`: Settings translations
- **Testing Priority**: **MEDIUM**
- **Complex Logic**: RTL support, pluralization, date/time formatting

#### **useRTL.ts**

- **Purpose**: Right-to-left language support
- **Dependencies**: Language detection, CSS direction management
- **Testing Priority**: **MEDIUM**

---

## Feature Management & A/B Testing

#### **useFeatureGate.ts**

- **Purpose**: Premium feature access control and feature flags
- **Dependencies**: Subscription service, A/B testing service
- **Testing Priority**: **HIGH** (premium feature protection)
- **Complex Logic**: Feature access logic, subscription validation

#### **useABTesting.tsx**

- **Purpose**: A/B testing and feature flags management
- **Dependencies**: A/B testing service
- **Testing Priority**: **MEDIUM**
- **Complex Logic**: Test group assignment, feature flag evaluation

---

## Performance & Device Optimization

#### **useDeviceCapabilities.tsx**

- **Purpose**: Device capability detection and performance optimization
- **Dependencies**: performanceBudgetManager, device detection services
- **Sub-hooks**:
  - `usePerformanceOptimizations`: Performance settings
  - `useMemoryOptimizations`: Memory management
  - `useNetworkOptimizations`: Network optimization
  - `useAnimationOptimizations`: Animation settings
- **Testing Priority**: **MEDIUM**
- **Complex Logic**: Performance budgeting, device classification

#### **useMobilePerformance.ts**

- **Purpose**: Mobile-specific performance optimizations
- **Dependencies**: Performance APIs, mobile detection
- **Testing Priority**: **LOW**

---

## Navigation & UI Enhancement

#### **useKeyboardNavigation.ts**

- **Purpose**: Keyboard navigation patterns and accessibility
- **Dependencies**: Keyboard event handling, focus management
- **Testing Priority**: **MEDIUM**
- **Complex Logic**: Focus trap, keyboard shortcuts

#### **useAnimations.ts**

- **Purpose**: Advanced animation management with performance consideration
- **Dependencies**: Animation APIs, performance monitoring
- **Testing Priority**: **LOW**

#### **useFocusRestoration.ts**

- **Purpose**: Focus restoration for modal and navigation flows
- **Dependencies**: Focus management APIs
- **Testing Priority**: **LOW**

#### **useFocusTrap.ts**

- **Purpose**: Focus trapping for modal and overlay components
- **Dependencies**: Focus management, keyboard events
- **Testing Priority**: **MEDIUM**

---

## Specialized Features

#### **usePushNotifications.ts**

- **Purpose**: Push notification management and permissions
- **Dependencies**: Push API, notification permissions
- **Testing Priority**: **MEDIUM**
- **Complex Logic**: Permission handling, subscription management

#### **useCulturalTheme.tsx**

- **Purpose**: Cultural theme adaptation based on locale
- **Dependencies**: Locale detection, cultural theme service
- **Testing Priority**: **LOW**

#### **useEnhancedServiceWorker.ts**

- **Purpose**: Enhanced service worker functionality
- **Dependencies**: Service worker APIs, cache management
- **Testing Priority**: **LOW**

#### **useEnhancedCaching.ts**

- **Purpose**: Advanced caching strategies
- **Dependencies**: Cache APIs, storage management
- **Testing Priority**: **LOW**

---

## Announcement & Screen Reader Hooks

#### **useScreenReaderAnnouncements.ts**

- **Purpose**: Screen reader announcements for dynamic content
- **Dependencies**: Screen reader APIs
- **Testing Priority**: **HIGH** (accessibility critical)

#### **useAlarmRingingAnnouncements.ts**

- **Purpose**: Alarm-specific announcements
- **Dependencies**: Screen reader APIs, alarm events
- **Testing Priority**: **MEDIUM**

#### **useNavigationAnnouncements.ts**

- **Purpose**: Navigation change announcements
- **Dependencies**: Router, screen reader APIs
- **Testing Priority**: **MEDIUM**

#### **useFormAnnouncements.ts**

- **Purpose**: Form validation and error announcements
- **Dependencies**: Form validation, screen reader APIs
- **Testing Priority**: **MEDIUM**

#### **useAuthAnnouncements.ts**

- **Purpose**: Authentication flow announcements
- **Dependencies**: Auth state, screen reader APIs
- **Testing Priority**: **MEDIUM**

#### **useSettingsAnnouncements.ts**

- **Purpose**: Settings change announcements
- **Dependencies**: Settings state, screen reader APIs
- **Testing Priority**: **LOW**

#### **useProfileAnnouncements.ts**

- **Purpose**: Profile update announcements
- **Dependencies**: Profile state, screen reader APIs
- **Testing Priority**: **LOW**

#### **useGamingAnnouncements.ts**

- **Purpose**: Gaming feature announcements
- **Dependencies**: Gaming state, screen reader APIs
- **Testing Priority**: **LOW**

#### **useMediaContentAnnouncements.ts**

- **Purpose**: Media content accessibility announcements
- **Dependencies**: Media APIs, screen reader APIs
- **Testing Priority**: **LOW**

#### **useErrorLoadingAnnouncements.ts**

- **Purpose**: Error and loading state announcements
- **Dependencies**: Error handling, screen reader APIs
- **Testing Priority**: **MEDIUM**

#### **useSmartFeaturesAnnouncements.ts**

- **Purpose**: Smart feature announcements
- **Dependencies**: Smart features, screen reader APIs
- **Testing Priority**: **LOW**

#### **useTabProtectionAnnouncements.ts**

- **Purpose**: Tab protection feature announcements
- **Dependencies**: Tab protection state, screen reader APIs
- **Testing Priority**: **LOW**

---

## Additional Utility Hooks

#### **useTabProtectionSettings.ts**

- **Purpose**: Tab protection settings management
- **Dependencies**: localStorage, tab management
- **Testing Priority**: **LOW**

#### **useCriticalPreloading.ts**

- **Purpose**: Critical resource preloading
- **Dependencies**: Resource loading APIs
- **Testing Priority**: **LOW**

#### **useAudioLazyLoading.ts**

- **Purpose**: Lazy loading for audio resources
- **Dependencies**: Audio APIs, intersection observer
- **Testing Priority**: **LOW**

#### **useDynamicFocus.ts**

- **Purpose**: Dynamic focus management
- **Dependencies**: Focus APIs, DOM manipulation
- **Testing Priority**: **LOW**

#### **useEmotionalNotifications.ts**

- **Purpose**: Emotional context-aware notifications
- **Dependencies**: Notification APIs, emotional analysis
- **Testing Priority**: **LOW**

---

## Testing Priorities Summary

### **HIGH Priority** (Core functionality, security, revenue, accessibility)

1. **useAuth.ts** - Authentication security
2. **useSubscription.ts** - Revenue protection
3. **useAdvancedAlarms.ts** - Core functionality
4. **useTheme.tsx** - Core UX
5. **useAccessibility.ts** - Legal compliance
6. **usePWA.ts** - Core mobile experience
7. **useFeatureGate.ts** - Premium protection
8. **useScreenReaderAnnouncements.ts** - Accessibility critical

### **MEDIUM Priority** (Important features, user experience)

9. **useAnalytics.ts** - Data integrity
10. **useSoundEffects.tsx** - Audio system
11. **useI18n.ts** - Internationalization
12. **useRTL.ts** - RTL support
13. **useDeviceCapabilities.tsx** - Performance
14. **useKeyboardNavigation.ts** - Accessibility
15. **usePushNotifications.ts** - Notification system
16. **useABTesting.tsx** - Feature flags

### **LOW Priority** (Utility functions, enhancements)

17. All announcement hooks (except screen reader)
18. Performance optimization hooks
19. Animation and UI enhancement hooks
20. Cultural and specialized features

---

## Dependencies Analysis

### **External Service Dependencies**

- **Supabase**: Authentication, database
- **Stripe**: Payment processing
- **PostHog**: Analytics tracking
- **Capacitor**: Native mobile features
- **Web APIs**: PWA, notifications, audio, performance

### **Internal Service Dependencies**

- **AnalyticsService**: Event tracking across hooks
- **SecurityService**: Rate limiting, CSRF protection
- **ErrorHandler**: Centralized error management
- **ThemeServices**: Theme persistence and performance
- **AlarmServices**: Alarm scheduling and management

### **React Dependencies**

- **Context APIs**: Theme, language, accessibility
- **State Management**: useState, useReducer patterns
- **Side Effects**: useEffect for API calls, subscriptions
- **Performance**: useMemo, useCallback for optimization

---

## Recommended Testing Strategy

### **Unit Testing Focus**

1. **Pure Functions**: Theme calculations, utility functions
2. **State Management**: State transitions, reducer logic
3. **Error Handling**: Error scenarios, fallback behavior
4. **Business Logic**: Feature access, alarm scheduling
5. **Validation**: Input validation, data transformation

### **Integration Testing Focus**

1. **Service Integration**: API calls, external services
2. **Context Integration**: Provider interactions
3. **Event Flows**: User interaction sequences
4. **Cross-hook Communication**: Dependent hook interactions
5. **Browser API Integration**: PWA, notification, audio APIs

### **Mock Requirements**

1. **External APIs**: Supabase, Stripe, analytics
2. **Browser APIs**: Notification, audio, geolocation
3. **Storage**: localStorage, sessionStorage
4. **Performance APIs**: Performance observer, device info
5. **Native APIs**: Capacitor plugins, device capabilities

This inventory provides the foundation for comprehensive test coverage across all custom React hooks in the Relife alarm application.
