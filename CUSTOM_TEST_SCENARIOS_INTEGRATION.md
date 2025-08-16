# 🧪 Custom Test Scenarios Integration Guide

## Overview

Your Relife Smart Alarm app now includes a comprehensive custom test scenarios framework integrated into the Accessibility Dashboard. This system provides extensive testing capabilities for all your app's features with personalized, context-aware test scenarios.

## 🚀 What's Been Integrated

### ✅ 1. New Service: `custom-test-scenarios.ts`
**Location**: `src/services/custom-test-scenarios.ts`

**Features**:
- **5 Custom Test Categories**: Voice Features, Gaming/Battles, Smart Scheduling, Premium Features, Sleep Analytics
- **100+ Pre-built Test Scenarios** covering all Relife app functionality
- **Dynamic Test Generation** based on user context (name, premium status, time)
- **Premium Feature Gating** to respect subscription levels
- **User Personalization** with context-aware messages
- **Flexible Configuration** to enable/disable categories

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

### 1. **Voice Features & Personality** 💎 *Premium*
- Voice mood selection (Happy, Calm, Energetic)
- Voice cloning completion notifications
- Voice preview playback
- Voice generation error handling
- Personalized wake-up messages

### 2. **Gaming & Battles** ⚔️ *Free*
- Battle mode activation (Math, Memory, Puzzle challenges)
- Victory announcements with XP/coin rewards
- Defeat scenarios with retry mechanics
- Level-up notifications and achievements
- Weekly battle statistics and leaderboards

### 3. **Smart Scheduling** 💎 *Premium*
- Sleep cycle detection and optimization
- Weather-based alarm adjustments
- Calendar conflict detection and resolution
- Health insights and sleep quality recommendations
- Smart snooze adaptation

### 4. **Premium Features** 💎 *Premium*
- Premium subscription activation
- Feature lock notifications and upgrade prompts
- Trial expiration warnings
- Usage limit notifications
- Feature previews and benefits

### 5. **Sleep Analytics** 📊 *Free*
- Daily sleep quality reports with metrics
- Sleep goal achievement notifications
- Poor sleep quality alerts and recommendations
- Bedtime reminders with goal context
- Weekly sleep trend analysis

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

1. **Select Category**: Click on any category tab (Voice, Gaming, etc.)
2. **Configure Settings**:
   - Toggle **Auto-advance** for sequential testing
   - Adjust **delay between tests** (1-5 seconds)
   - Enable **Simulate Premium** to test premium features
3. **Run Tests**:
   - **Play Tests**: Start sequential testing of all scenarios
   - **Run All Categories**: Test all categories automatically
   - **Individual Tests**: Click play button on specific tests

### Test Results

- **Green checkmarks**: Successful test announcements
- **Red alerts**: Failed test playbacks
- **Test Summary**: Real-time statistics of completed tests
- **Category Progress**: Track testing progress per category

## ⚙️ Customization Options

### Add New Test Scenarios

Edit `src/services/custom-test-scenarios.ts`:

```typescript
// Add new test to existing category
export const voiceFeaturesTests: TestScenario[] = [
  // ... existing tests
  {
    id: 'your-new-test',
    message: 'Your custom screen reader announcement message',
    priority: 'high',
    context: 'voice',
    tags: ['voice', 'custom'],
    expectedBehavior: 'Should announce with specific behavior',
    userTypes: ['premium'] // Optional: restrict to premium users
  }
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
    requiresPremium: false 
  }
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