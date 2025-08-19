/**
 * Additional App-Specific Custom Test Scenarios for Relife Smart Alarm App
 * Extended scenarios covering onboarding, emotional intelligence, privacy, feedback, PWA, and tab protection
 */

import { TestScenario, TestCategory } from "./custom-test-scenarios";

// Onboarding Flow & First Experience Tests
export const onboardingFlowTests: TestScenario[] = [
  {
    id: "onboarding-welcome-sequence",
    message:
      "Welcome to Relife Smart Alarm! This guided setup will take 3 minutes. We will set up notifications, voice features, and your first alarm. Press Continue to start.",
    priority: "medium",
    context: "general",
    tags: ["onboarding", "welcome", "setup"],
    expectedBehavior:
      "Should provide clear time expectation and setup overview",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["standard", "premium"],
  },
  {
    id: "onboarding-permissions-request",
    message:
      "To wake you up effectively, Relife needs notification permissions and microphone access for voice commands. These permissions help create the best alarm experience.",
    priority: "high",
    context: "general",
    tags: ["onboarding", "permissions", "notifications", "voice"],
    expectedBehavior: "Should clearly explain why each permission is needed",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["standard", "premium"],
  },
  {
    id: "onboarding-first-alarm-setup",
    message:
      "Let me help you create your first alarm. What time would you like to wake up tomorrow? I recommend starting with a gentle wake-up sound for your first experience.",
    priority: "medium",
    context: "general",
    tags: ["onboarding", "first-alarm", "guidance"],
    expectedBehavior: "Should offer helpful suggestions for first-time users",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["standard", "premium"],
  },
];

// Emotional Intelligence & Personalization Tests
export const emotionalIntelligenceTests: TestScenario[] = [
  {
    id: "emotional-state-recognition",
    message:
      "Good morning! Based on your sleep patterns, you seem tired today. I have selected a gentler wake-up approach with soothing sounds. How are you feeling right now?",
    priority: "medium",
    context: "general",
    tags: ["emotional-intelligence", "mood-detection", "personalization"],
    expectedBehavior:
      "Should explain reasoning for emotional detection and adaptations",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["premium"],
  },
  {
    id: "stress-level-adaptation",
    message:
      "I notice your heart rate was elevated before sleep last night. Today I will use calmer tones and longer snooze intervals. Would you like me to suggest some breathing exercises?",
    priority: "medium",
    context: "general",
    tags: ["emotional-intelligence", "stress-detection", "health-awareness"],
    expectedBehavior:
      "Should offer appropriate support based on detected stress levels",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["premium"],
  },
];

// Privacy & Security Tests
export const privacySecurityTests: TestScenario[] = [
  {
    id: "privacy-voice-data-handling",
    message:
      "Your voice commands are processed locally on your device for privacy. Voice data is never sent to external servers unless you explicitly enable cloud features. Current status: Local processing active.",
    priority: "medium",
    context: "general",
    tags: ["privacy", "voice-data", "local-processing"],
    expectedBehavior: "Should clearly communicate privacy protections",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["standard", "premium"],
  },
  {
    id: "privacy-data-export-request",
    message:
      "You can export all your Relife data at any time. This includes alarm history, sleep patterns, voice command logs, and preferences. Would you like to download your data now?",
    priority: "low",
    context: "general",
    tags: ["privacy", "data-export", "user-rights"],
    expectedBehavior: "Should provide easy access to personal data",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["standard", "premium"],
  },
];

// User Feedback & Satisfaction Tests
export const feedbackTests: TestScenario[] = [
  {
    id: "feedback-alarm-effectiveness",
    message:
      "How effective was your alarm this morning? Rate from 1-5: Too gentle (1), Just right (3), Too aggressive (5). Your feedback helps me personalize your wake-up experience.",
    priority: "low",
    context: "general",
    tags: ["feedback", "effectiveness", "personalization"],
    expectedBehavior: "Should collect specific actionable feedback",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["standard", "premium"],
  },
  {
    id: "feedback-feature-suggestion",
    message:
      "Is there a wake-up feature you wish Relife had? Voice your suggestion now, and I will add it to our development roadmap. Popular requests get priority implementation.",
    priority: "low",
    context: "general",
    tags: ["feedback", "feature-requests", "voice-input"],
    expectedBehavior: "Should encourage and capture user suggestions",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["standard", "premium"],
  },
];

// Progressive Web App (PWA) Tests
export const pwaTests: TestScenario[] = [
  {
    id: "pwa-installation-prompt",
    message:
      "Install Relife as an app on your device for faster access and better alarm reliability. Installation enables background processing and ensures alarms work even when your browser is closed.",
    priority: "medium",
    context: "general",
    tags: ["pwa", "installation", "reliability"],
    expectedBehavior: "Should explain PWA benefits clearly",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["standard", "premium"],
  },
  {
    id: "pwa-offline-functionality",
    message:
      "Relife works offline! Your alarms, settings, and most features remain available without internet connection. Sync will resume automatically when you are back online.",
    priority: "low",
    context: "general",
    tags: ["pwa", "offline", "sync"],
    expectedBehavior: "Should communicate offline capabilities",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["standard", "premium"],
  },
];

// Tab Protection & Focus Tests
export const tabProtectionTests: TestScenario[] = [
  {
    id: "tab-protection-warning",
    message:
      "Alert: You switched away from Relife while an alarm was active. To ensure reliable wake-up calls, please keep Relife in an active tab or install as a PWA.",
    priority: "high",
    context: "general",
    tags: ["tab-protection", "reliability", "warning"],
    expectedBehavior: "Should warn about potential alarm reliability issues",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["standard", "premium"],
  },
  {
    id: "tab-protection-pwa-recommendation",
    message:
      "For the most reliable alarm experience, install Relife as an app. This prevents browser tab issues and ensures your alarms always work. Would you like to install now?",
    priority: "medium",
    context: "general",
    tags: ["tab-protection", "pwa-recommendation", "reliability"],
    expectedBehavior: "Should recommend PWA installation for reliability",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["standard", "premium"],
  },
];

// Organize all additional test categories
export const additionalAppSpecificTestCategories: Record<string, TestCategory> =
  {
    onboardingFlow: {
      name: "Onboarding Flow",
      description: "First-time user experience and setup guidance",
      icon: "user-plus",
      color: "#10B981",
      tests: onboardingFlowTests,
      isPremium: false,
    },
    emotionalIntelligence: {
      name: "Emotional Intelligence",
      description: "AI-powered mood and emotional state recognition",
      icon: "heart",
      color: "#F59E0B",
      tests: emotionalIntelligenceTests,
      isPremium: true,
    },
    privacySecurity: {
      name: "Privacy & Security",
      description: "Data protection and privacy compliance features",
      icon: "shield-check",
      color: "#6366F1",
      tests: privacySecurityTests,
      isPremium: false,
    },
    feedback: {
      name: "User Feedback",
      description: "Feedback collection and satisfaction measurement",
      icon: "message-square",
      color: "#EC4899",
      tests: feedbackTests,
      isPremium: false,
    },
    pwa: {
      name: "Progressive Web App",
      description: "PWA installation and offline functionality",
      icon: "download",
      color: "#8B5CF6",
      tests: pwaTests,
      isPremium: false,
    },
    tabProtection: {
      name: "Tab Protection",
      description: "Browser tab management and reliability features",
      icon: "shield",
      color: "#F43F5E",
      tests: tabProtectionTests,
      isPremium: false,
    },
  };

// Configuration for additional app-specific categories
export const additionalAppSpecificCategoryConfig = {
  onboardingFlow: { enabled: true, requiresPremium: false },
  emotionalIntelligence: { enabled: true, requiresPremium: true },
  privacySecurity: { enabled: true, requiresPremium: false },
  feedback: { enabled: true, requiresPremium: false },
  pwa: { enabled: true, requiresPremium: false },
  tabProtection: { enabled: true, requiresPremium: false },
};

export default {
  additionalAppSpecificTestCategories,
  additionalAppSpecificCategoryConfig,
  onboardingFlowTests,
  emotionalIntelligenceTests,
  privacySecurityTests,
  feedbackTests,
  pwaTests,
  tabProtectionTests,
};
