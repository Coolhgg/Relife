# 🧪 Custom Test Scenarios Integration Guide

## Overview

Your Relife Smart Alarm app now includes a comprehensive custom test scenarios framework integrated into the Accessibility Dashboard. This system provides extensive testing capabilities for all your app's features with personalized, context-aware test scenarios.

## 🚀 What's Been Integrated

### ✅ 1. Core Service: `custom-test-scenarios.ts`

**Location**: `src/services/custom-test-scenarios.ts`

**Features**:

- **5 Core Test Categories**: Voice Features, Gaming/Battles, Smart Scheduling, Premium Features, Sleep Analytics
- **Dynamic Test Generation** based on user context (name, premium status, time)
- **Premium Feature Gating** to respect subscription levels
- **User Personalization** with context-aware messages
- **Flexible Configuration** to enable/disable categories

### ✅ 2. App-Specific Service: `app-specific-test-scenarios.ts`

**Location**: `src/services/app-specific-test-scenarios.ts`

**Features**:

- **8 Specialized Test Categories** for unique Relife features
- **40+ Advanced Scenarios** covering Nuclear Mode, Battle System, Theme Management, etc.
- **Feature-specific Testing** for advanced app functionality
- **Premium Integration** with subscription-aware scenarios
- **Edge Case Coverage** including offline modes and sync conflicts

### ✅ 2. Enhanced Component: `ExtendedScreenReaderTester.tsx`

**Location**: `src/components/ExtendedScreenReaderTester.tsx`

**Features**:

- **Category-based Testing** with tabbed interface
- **Real-time Test Results** with success/failure tracking
- **Premium Simulation** for testing premium-only features
- **User Context Integration** (name, subscription status, current time)
- **Auto-advance Testing** with configurable delays
- **Individual Test Control** - play any test on demand
- **Comprehensive Test Summary** with statistics

### ✅3. Updated Accessibility Dashboard

**Location**: `src/components/AccessibilityDashboard.tsx`

**Changes**:

- Added new **"Screen Reader Testing"** section
- Integrated both basic and extended testing components
- Seamless navigation between testing modes
- Consistent UI/UX with existing dashboard

## 🎯 Available Test Categories

### Core Categories (5)

### 1. **Voice Features & Personality** 💎 _Premium_

- Voice mood selection (Happy, Calm, Energetic)
- Voice cloning completion notifications
- Voice preview playback
- Voice generation error handling
- Personalized wake-up messages

### 2. **Gaming & Battles** ⚔️ _Free_

- Battle mode activation (Math, Memory, Puzzle challenges)
- Victory announcements with XP/coin rewards
- Defeat scenarios with retry mechanics
- Level-up notifications and achievements
- Weekly battle statistics and leaderboards

### 3. **Smart Scheduling** 💎 _Premium_

- Sleep cycle detection and optimization
- Weather-based alarm adjustments
- Calendar conflict detection and resolution
- Health insights and sleep quality recommendations
- Smart snooze adaptation

### 4. **Premium Features** 💎 _Premium_

- Premium subscription activation
- Feature lock notifications and upgrade prompts
- Trial expiration warnings
- Usage limit notifications
- Feature previews and benefits

### 5. **Sleep Analytics** 📊 _Free_

- Daily sleep quality reports with metrics
- Sleep goal achievement notifications
- Poor sleep quality alerts and recommendations
- Bedtime reminders with goal context
- Weekly sleep trend analysis

## 🎯 App-Specific Test Categories _(NEW)_

### 6. **Nuclear Mode Challenges** ☢️ _Premium_

- DEFCON alert activation with countdown timers
- Multi-stage nuclear challenge sequences (Math, Memory, Precision)
- Escalating warning levels with time pressure announcements
- Meltdown failure scenarios with emergency snooze
- Nuclear defusal success celebrations with XP rewards

### 7. **Battle System & Social** ⚔️ _Free_

- Battle invitation announcements from friends
- Live battle progress updates and trash talk
- Victory celebrations with social sharing
- Battle defeat scenarios with rematch offers
- Offline battle handling and sync notifications

### 8. **Theme Creation & Management** 🎨 _Premium_

- Custom theme creation completion announcements
- Seasonal theme switching notifications
- High contrast accessibility activation
- Theme sync conflict resolution alerts
- Community theme showcase and sharing

### 9. **Voice Analytics & Biometrics** 📊 _Premium_

- Voice accuracy analysis reports
- Biometric strength and improvement updates
- Mood effectiveness tracking announcements
- Voice pattern recognition achievements
- Personalized voice training recommendations

### 10. **Gamification & Rewards** 🏆 _Free_

- Daily challenge completion announcements
- Level-up milestone celebrations
- Streak achievement notifications
- Leaderboard ranking updates
- Achievement unlock announcements with benefits

### 11. **Advanced Sleep Analytics** 😴 _Premium_

- Chronotype detection results and recommendations
- Sleep debt accumulation warnings
- Sleep efficiency improvement suggestions
- REM sleep cycle optimization alerts
- Personalized sleep coaching announcements

### 12. **Offline & Synchronization** 🔄 _Free_

- Offline mode activation notifications
- Data sync completion announcements
- Sync conflict resolution prompts
- Background sync progress updates
- Network reconnection and data validation

### 13. **Premium Subscription** 💎 _Premium_

- Premium trial activation announcements
- Usage limit approach warnings
- Feature showcase and benefit highlights
- Subscription renewal reminders
- Exclusive feature unlock celebrations

## 🎆 Additional Feature Test Categories _(NEW)_

### 14. **Onboarding & First Experience** 🚀 _Free_

- Welcome sequence with setup time expectations
- Permission request flows (notifications, microphone)
- Step-by-step progress announcements
- Error recovery when permissions are denied
- First alarm creation guidance and completion

### 15. **Emotional Intelligence & Nudges** 🧠 _Premium_

- Emotional state recognition and explanations
- Interactive mood feedback collection
- Motivational message effectiveness ratings
- Stress pattern detection and support suggestions
- Achievement celebrations with emotional context

### 16. **Privacy & Consent Management** 🛡️ _Free_

- GDPR/CCPA initial consent requests
- Granular consent options with current status
- Data usage transparency explanations
- Consent withdrawal confirmations
- Data export request processing

### 17. **Wake-Up Feedback Collection** 😴 _Free_

- Morning difficulty rating interface
- Morning feeling assessment with context
- Alarm effectiveness rating with specifics
- Sleep quality correlation insights
- Feedback impact notifications and changes

### 18. **Progressive Web App & Installation** 📱 _Free_

- Installation benefit explanations
- Platform-specific installation instructions (iOS, Android, Desktop)
- Offline capability feature explanations
- Successful installation confirmations
- Background alarm enablement notifications

### 19. **Tab Protection & Browser Context** ⚠️ _Free_

- Tab close prevention with immediate alarm warnings
- Tab visibility impact alerts
- Device sleep mode warnings and solutions
- Multiple tabs conflict detection
- Safe browsing confirmation messages

## 🔧 How to Use

### Access the Testing System

1. **Open Accessibility Dashboard**:
   - Navigate to your app settings
   - Open "Accessibility Settings"
   - Click on "Screen Reader Testing" tab

2. **Choose Testing Mode**:
   - **Basic Tests**: Simple announcements for fundamental functionality
   - **Comprehensive Tests**: Full app feature testing with custom scenarios

### Using the Extended Tester

1. **Select Category**: Click on any category tab (Voice, Gaming, Nuclear Mode, etc.)
   - **19 Total Categories**: 5 core + 8 app-specific + 6 additional feature categories available
   - **Premium Lock Indicators** (🔒): Shows categories requiring premium subscription
   - **Dynamic Category Count**: Changes based on your subscription level

2. **Configure Settings**:
   - Toggle **Auto-advance** for sequential testing
   - Adjust **delay between tests** (1-5 seconds)
   - Enable **Simulate Premium** to test premium features without subscription
   - Toggle **Include Descriptions** to add expected behavior context

3. **Run Tests**:
   - **Play Tests**: Start sequential testing of all scenarios in current category
   - **Run All Categories**: Test all accessible categories automatically
   - **Individual Tests**: Click play button on specific tests
   - **Skip/Pause**: Control test progression with skip and pause buttons

4. **App-Specific Features**:
   - **Nuclear Mode Testing**: Experience DEFCON alerts and countdown scenarios
   - **Battle System Testing**: Test multiplayer wake-up competition features
   - **Theme Management**: Test custom theme creation and switching
   - **Voice Analytics**: Test voice accuracy and biometric feedback
   - **Advanced Sleep Analytics**: Test chronotype and sleep efficiency features

### Test Results

- **Green checkmarks**: Successful test announcements
- **Red alerts**: Failed test playbacks
- **Test Summary**: Real-time statistics of completed tests
- **Category Progress**: Track testing progress per category

## ⚙️ Customization Options

### Add New Core Test Scenarios

Edit `src/services/custom-test-scenarios.ts`:

```typescript
// Add new test to existing category
export const voiceFeaturesTests: TestScenario[] = [
  // ... existing tests
  {
    id: "your-new-test",
    message: "Your custom screen reader announcement message",
    priority: "high",
    context: "voice",
    tags: ["voice", "custom"],
    expectedBehavior: "Should announce with specific behavior",
    userTypes: ["premium"], // Optional: restrict to premium users
  },
];
```

### Add New App-Specific Test Scenarios

Edit `src/services/app-specific-test-scenarios.ts`:

```typescript
// Add new nuclear mode test
export const nuclearModeTests: TestScenario[] = [
  // ... existing tests
  {
    id: "nuclear-custom-challenge",
    message:
      "ALERT: Custom nuclear challenge activated! Complete the memory sequence: Blue, Red, Green, Yellow. You have 45 seconds!",
    priority: "high",
    context: "battle",
    tags: ["nuclear-mode", "memory", "custom"],
    expectedBehavior:
      "Should announce with extreme urgency and clear instructions",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["premium"],
  },
];
```

### Add New Additional Feature Test Scenarios

Edit `src/services/additional-app-specific-test-scenarios.ts`:

```typescript
// Add new onboarding test
export const onboardingFlowTests: TestScenario[] = [
  // ... existing tests
  {
    id: "custom-onboarding-step",
    message:
      "Custom Step: Configure your personal wake-up preferences. This helps Relife learn your ideal morning routine. Current progress: 75% complete.",
    priority: "medium",
    context: "general",
    tags: ["onboarding", "personalization", "custom"],
    expectedBehavior:
      "Should provide clear progress and personalization context",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["free", "premium"],
  },
];
```

### Create New Test Category

```typescript
// Add to customTestCategories object
yourNewCategory: {
  name: 'Your Category Name',
  description: 'Description of what this category tests',
  icon: '🆕',
  color: '#FF6B6B',
  tests: yourNewCategoryTests,
  isPremium: false // Set to true for premium-only categories
}
```

### Configure Category Availability

```typescript
// Update customCategoryConfig
export const customCategoryConfig: CustomCategoryConfig = {
  // ... existing config
  yourNewCategory: {
    enabled: true,
    requiresPremium: false,
  },
};
```

## 🔊 Integration with Existing Screen Reader

The custom test scenarios integrate seamlessly with your existing `ScreenReaderService`:

- Uses your established screen reader announcement patterns
- Respects user accessibility preferences
- Maintains consistent voice and timing settings
- Provides both polite and assertive announcement types

## 📱 User Context Integration

Tests are personalized based on:

- **User Name**: Messages replace "you" with actual user name
- **Premium Status**: Shows/hides premium-only tests
- **Current Time**: Time-appropriate greetings and contexts
- **App State**: Reflects current alarms, sleep goals, battle levels

## 🏆 Benefits for Your App

1. **Comprehensive Testing**: Cover all app features systematically
2. **User Experience**: Ensure screen reader users can access all functionality
3. **Premium Feature Testing**: Validate subscription-gated features work properly
4. **Accessibility Compliance**: Meet WCAG standards with thorough testing
5. **User Feedback**: Built-in system for collecting accessibility feedback
6. **Development Workflow**: Easy testing during feature development

## 🚀 Next Steps

### For Immediate Use:

1. **Test Current Features**: Run through all categories to verify existing functionality
2. **Premium Testing**: Enable "Simulate Premium" to test all premium features
3. **User Feedback**: Have actual users with screen readers test the scenarios

### For Customization:

1. **Add App-Specific Tests**: Create scenarios specific to your unique features
2. **Integrate with Real Data**: Connect tests to actual alarm data, user preferences
3. **Analytics Integration**: Track which tests fail most often to identify issues
4. **A/B Testing**: Use different announcement styles to optimize user experience

### For Advanced Features:

1. **Voice Integration**: Connect with your voice cloning system for realistic tests
2. **Battle System Integration**: Use actual battle challenges in test scenarios
3. **Sleep Data Integration**: Incorporate real sleep metrics in test messages
4. **Calendar Integration**: Test with actual calendar events and conflicts

## 📧 Support & Feedback

The custom test scenarios system is designed to grow with your app. As you add new features to Relife, you can easily create corresponding test scenarios to ensure accessibility compliance.

**Key Integration Points**:

- `ScreenReaderService` for announcements
- `AccessibilityDashboard` for UI integration
- User preferences for personalization
- Premium features for subscription testing

Your Relife Smart Alarm app now has enterprise-grade accessibility testing capabilities! 🎉
