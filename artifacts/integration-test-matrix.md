# Integration Test Matrix for Critical User Flows

## Overview

This document outlines the comprehensive integration test matrix for Relife's critical user flows. Each flow is prioritized by business impact and includes detailed preconditions, test steps, and expected outcomes.

## Priority Classification

1. **P0 (Critical)**: Core alarm functionality - business cannot operate without these
2. **P1 (High)**: Revenue-generating features and core user experience 
3. **P2 (Medium)**: Enhancement features that improve user engagement
4. **P3 (Low)**: Analytics and background features

---

## 1. Alarm Creation/Editing/Deletion Flow [P0]

### Business Impact: Critical
Alarms are the core product functionality. Users must be able to reliably create, modify, and manage alarms.

### 1.1 Basic Alarm Creation Flow

**Preconditions:**
- User is authenticated
- User is on the dashboard
- User has not exceeded alarm limits (free: 5, premium: unlimited)

**Test Steps:**
1. Click "Add Alarm" button
2. Fill alarm form with valid data:
   - Time: 07:00
   - Label: "Morning Workout"
   - Days: Monday-Friday
   - Voice Mood: Motivational
3. Save alarm
4. Verify alarm appears in list
5. Verify alarm is scheduled in service worker
6. Verify analytics event is tracked

**Expected Outcomes:**
- Alarm form opens without errors
- All form fields accept valid input
- Save operation completes successfully
- Alarm appears in dashboard list with correct details
- Background scheduling is activated
- `alarm_created` analytics event is fired
- Success notification is displayed

**Error Scenarios:**
- Network failure during save → fallback to offline storage
- Validation errors → show specific field errors
- Permission denied → show permission request dialog

### 1.2 Premium Alarm Features

**Preconditions:**
- User has premium subscription
- User is authenticated

**Test Steps:**
1. Open alarm creation form
2. Verify premium features are available:
   - Smart wake-up toggle
   - Custom sound upload
   - Nuclear mode challenges
   - Advanced scheduling
3. Enable premium features
4. Save alarm with premium features
5. Verify premium features persist

**Expected Outcomes:**
- Premium UI elements are visible and functional
- Premium feature flags are saved correctly
- Premium analytics events are tracked
- Premium feature limitations are not applied

### 1.3 Alarm Editing Flow

**Preconditions:**
- User has existing alarm
- User is authenticated

**Test Steps:**
1. Click edit button on existing alarm
2. Modify alarm properties (time, label, days)
3. Save changes
4. Verify changes are reflected in UI
5. Verify updated scheduling

**Expected Outcomes:**
- Edit form pre-populates with current values
- Changes save successfully
- UI updates reflect changes immediately
- Service worker reschedules alarm
- `alarm_updated` analytics event is fired

### 1.4 Alarm Deletion Flow

**Preconditions:**
- User has existing alarm
- User is authenticated

**Test Steps:**
1. Click delete button on alarm
2. Confirm deletion in modal
3. Verify alarm is removed from UI
4. Verify alarm is unscheduled

**Expected Outcomes:**
- Confirmation dialog appears
- Alarm is removed from database
- Alarm disappears from UI
- Service worker unschedules alarm
- `alarm_deleted` analytics event is fired

---

## 2. Alarm Triggering & Interaction Flow [P0]

### Business Impact: Critical
Users must receive reliable alarm notifications and be able to interact with them.

### 2.1 Basic Alarm Triggering

**Preconditions:**
- User has enabled alarm scheduled for current time
- Service worker is active
- Notification permissions granted

**Test Steps:**
1. Set system time to alarm trigger time
2. Wait for alarm trigger
3. Verify notification appears
4. Verify alarm ringing interface displays
5. Test dismiss functionality
6. Verify return to dashboard

**Expected Outcomes:**
- Push notification is delivered
- Alarm ringing interface appears
- Audio plays (if enabled)
- Dismiss button functions correctly
- Alarm stops ringing on dismiss
- Analytics event tracked

### 2.2 Snooze Functionality

**Preconditions:**
- Alarm is currently ringing
- Snooze is enabled for the alarm

**Test Steps:**
1. Click snooze button
2. Verify snooze countdown appears
3. Wait for snooze to expire
4. Verify alarm triggers again
5. Test multiple snooze cycles
6. Test snooze limit enforcement

**Expected Outcomes:**
- Snooze sets correct delay (5 minutes default)
- Countdown displays remaining time
- Alarm re-triggers after snooze
- Maximum snooze limit is enforced
- Each snooze event is tracked

### 2.3 Nuclear Mode Challenges (Premium)

**Preconditions:**
- Premium user
- Alarm has nuclear mode enabled
- Alarm is ringing

**Test Steps:**
1. Attempt to dismiss alarm
2. Complete required challenges:
   - Math problems
   - QR code scanning
   - Location verification
3. Verify challenge completion
4. Dismiss alarm after challenges

**Expected Outcomes:**
- Challenge interface appears before dismiss
- Each challenge type functions correctly
- Alarm cannot be dismissed until challenges complete
- Challenge results are tracked

---

## 3. Premium Purchase Flow [P1]

### Business Impact: High
Primary revenue generation mechanism. Must be reliable and frictionless.

### 3.1 Free-to-Premium Upgrade

**Preconditions:**
- User is on free tier
- User hits feature limitation
- Stripe is configured

**Test Steps:**
1. Trigger premium feature limitation
2. Click upgrade prompt
3. Navigate to pricing page
4. Select premium plan
5. Enter payment information
6. Complete purchase
7. Verify premium features unlock
8. Verify subscription status

**Expected Outcomes:**
- Upgrade prompt appears at appropriate times
- Pricing page displays correctly
- Payment flow completes without errors
- Stripe subscription is created
- User gains premium access immediately
- Premium analytics events are tracked

### 3.2 Payment Method Management

**Preconditions:**
- User has premium subscription
- User is authenticated

**Test Steps:**
1. Navigate to subscription dashboard
2. View current payment method
3. Add new payment method
4. Set as default payment method
5. Remove old payment method
6. Verify billing continues normally

**Expected Outcomes:**
- Payment methods display correctly
- Add/remove operations succeed
- Default payment method is updated
- No billing interruption occurs

### 3.3 Subscription Cancellation

**Preconditions:**
- User has active premium subscription

**Test Steps:**
1. Navigate to subscription settings
2. Click cancel subscription
3. Complete cancellation flow
4. Verify immediate access continuation
5. Verify features lock at period end
6. Test reactivation flow

**Expected Outcomes:**
- Cancellation flow is clear and honest
- Access continues until period end
- Features appropriately lock after expiration
- Reactivation is seamless
- Cancellation analytics are tracked

---

## 4. Voice Commands Flow [P1]

### Business Impact: High
Key differentiating feature for alarm dismissal and app interaction.

### 4.1 Voice Recognition Setup

**Preconditions:**
- Browser supports Web Speech API
- Microphone permissions available

**Test Steps:**
1. Navigate to voice settings
2. Grant microphone permission
3. Test microphone functionality
4. Configure voice sensitivity
5. Test voice recognition accuracy
6. Save voice preferences

**Expected Outcomes:**
- Permission request appears appropriately
- Microphone test provides feedback
- Sensitivity settings work correctly
- Voice recognition accuracy is acceptable (>80%)
- Settings persist across sessions

### 4.2 Alarm Dismissal via Voice

**Preconditions:**
- Alarm is ringing
- Voice commands are enabled
- Microphone access granted

**Test Steps:**
1. Say "Stop alarm" command
2. Verify alarm stops
3. Test alternative commands: "Dismiss", "Turn off"
4. Test voice commands with background noise
5. Test failed recognition scenarios
6. Verify fallback to button controls

**Expected Outcomes:**
- Common dismiss commands work reliably
- Recognition works with reasonable background noise
- Failed recognition provides visual feedback
- Users can always fall back to manual controls
- Voice dismissal is tracked separately in analytics

### 4.3 App Navigation via Voice

**Preconditions:**
- User is on dashboard
- Voice navigation enabled

**Test Steps:**
1. Say "Create alarm"
2. Verify alarm form opens
3. Test navigation commands: "Settings", "Profile"
4. Test voice form filling
5. Test command disambiguation
6. Verify accessibility compliance

**Expected Outcomes:**
- Navigation commands work consistently
- Voice form filling is functional
- Ambiguous commands request clarification
- Voice navigation doesn't break keyboard/screen reader access

---

## 5. Analytics Logging Flow [P2]

### Business Impact: Medium
Critical for product decisions and user behavior understanding.

### 5.1 Core Event Tracking

**Preconditions:**
- Analytics service initialized
- User consent obtained (if required)
- PostHog configured

**Test Steps:**
1. Create an alarm
2. Edit an alarm
3. Delete an alarm
4. Trigger alarm
5. Use voice commands
6. Navigate between pages
7. Verify all events are captured
8. Test offline event queuing

**Expected Outcomes:**
- All user actions generate appropriate events
- Events include required metadata
- Events are batched efficiently
- Offline events queue and sync when online
- No PII is accidentally tracked

### 5.2 Feature Usage Analytics

**Preconditions:**
- User interacts with various features

**Test Steps:**
1. Use premium features
2. Interact with voice commands
3. Use accessibility features
4. Change themes/settings
5. Complete user flows
6. Verify feature usage tracking
7. Test conversion funnel events

**Expected Outcomes:**
- Feature usage is tracked granularly
- Conversion events are properly attributed
- Feature discovery events are captured
- User journey is reconstructable from events

### 5.3 Performance Monitoring

**Preconditions:**
- Performance monitoring enabled

**Test Steps:**
1. Load application
2. Perform various operations
3. Monitor performance metrics
4. Test on slow connections
5. Test on low-end devices
6. Verify error tracking
7. Test crash reporting

**Expected Outcomes:**
- Load times are measured accurately
- User experience metrics are captured
- Errors are reported with context
- Performance regressions are detectable

---

## 6. App Initialization Flow [P1]

### Business Impact: High
Users must be able to reliably start and use the application.

### 6.1 First-Time User Experience

**Preconditions:**
- New user (no existing data)
- Clean browser state

**Test Steps:**
1. Load application
2. Complete onboarding flow
3. Grant required permissions
4. Create first alarm
5. Verify data persistence
6. Test offline capabilities
7. Verify service worker registration

**Expected Outcomes:**
- App loads within 3 seconds
- Onboarding is clear and engaging
- Permission requests are contextual
- First alarm creation succeeds
- Data persists across page refreshes
- Service worker enables offline functionality

### 6.2 Returning User Experience

**Preconditions:**
- Existing user with saved data
- Previous session data available

**Test Steps:**
1. Load application
2. Verify auto-authentication
3. Verify data restoration
4. Test sync from other devices
5. Verify alarm scheduling restoration
6. Test state migration

**Expected Outcomes:**
- Authentication state restores automatically
- User data loads quickly
- Cross-device sync works correctly
- Scheduled alarms are restored
- No data loss occurs

### 6.3 Error Recovery

**Preconditions:**
- Various error conditions

**Test Steps:**
1. Test network failures during init
2. Test authentication failures
3. Test data corruption scenarios
4. Test permission denial recovery
5. Test service worker failures
6. Verify graceful degradation

**Expected Outcomes:**
- Network failures show appropriate messages
- Auth failures redirect to login
- Corrupt data is handled gracefully
- Permission denials explain consequences
- Core functionality works without service worker

---

## Test Data Requirements

### User Accounts
- **Free User**: Basic account with no subscription
- **Premium User**: Active premium subscription
- **Expired Premium**: Previously premium, now expired
- **Trial User**: In trial period

### Alarm Configurations
- **Basic Alarm**: Simple time and label
- **Complex Alarm**: Multiple days, voice mood, premium features
- **Nuclear Alarm**: Maximum difficulty challenges
- **Recurring Alarm**: Daily/weekly patterns

### Device Scenarios
- **Desktop Browser**: Chrome, Firefox, Safari
- **Mobile Browser**: iOS Safari, Chrome Mobile
- **PWA Install**: Installed as app on mobile/desktop
- **Offline Mode**: No network connectivity

### Network Conditions
- **Fast Connection**: Broadband/WiFi
- **Slow Connection**: 3G simulation
- **Unstable Connection**: Intermittent connectivity
- **Offline**: No network access

---

## Coverage Requirements

### Functional Coverage
- **Alarm Operations**: >95% coverage
- **Payment Flow**: >90% coverage
- **Voice Commands**: >85% coverage
- **Analytics**: >80% coverage

### Browser Coverage
- **Chrome**: Latest + 2 previous versions
- **Firefox**: Latest + 1 previous version
- **Safari**: Latest + 1 previous version
- **Mobile**: iOS Safari, Chrome Mobile

### Device Coverage
- **Desktop**: 1920x1080, 1366x768
- **Tablet**: iPad, Android tablet
- **Mobile**: iPhone, Android phones
- **Accessibility**: Screen reader users

---

## Success Criteria

### Reliability
- Test suite passes >99% of the time
- No flaky tests in critical paths
- Full test run completes in <10 minutes

### Performance
- App initialization: <3 seconds
- Alarm creation: <2 seconds
- Payment flow: <30 seconds
- Test execution: <10 minutes

### Coverage
- Integration tests cover all P0 and P1 flows
- >90% code coverage on tested flows
- All error scenarios have test coverage
- All user personas have test coverage

---

## Maintenance Plan

### Regular Updates
- Review test matrix monthly
- Update test data quarterly
- Refresh browser matrix bi-annually
- Validate performance baselines monthly

### Monitoring
- Track test execution times
- Monitor test failure patterns
- Alert on coverage drops
- Review flaky test reports weekly

### Dependencies
- Update testing framework dependencies monthly
- Maintain MSW handlers with API changes
- Keep device/browser matrix current
- Sync test data with production schemas