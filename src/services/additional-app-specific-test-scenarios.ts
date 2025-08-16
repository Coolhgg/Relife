/**
 * Additional App-Specific Custom Test Scenarios for Relife Smart Alarm App
 * Extended scenarios covering onboarding, emotional intelligence, privacy, feedback, PWA, and tab protection
 */

import { TestScenario, TestCategory } from './custom-test-scenarios';

// Onboarding Flow & First Experience Tests
export const onboardingFlowTests: TestScenario[] = [
  {
    id: 'onboarding-welcome-sequence',
    message: 'Welcome to Relife Smart Alarm! This guided setup will take 3 minutes. We'll set up notifications, voice features, and your first alarm. Press Continue to start.',
    priority: 'medium',
    context: 'general',
    tags: ['onboarding', 'welcome', 'setup'],
    expectedBehavior: 'Should provide clear time expectation and setup overview',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'permission-request-notification',
    message: 'Step 1 of 4: Notification Permission. Relife needs notification access to wake you up reliably, even when the app is closed. Your privacy is protected - we only send alarm notifications.',
    priority: 'high',
    context: 'general',
    tags: ['onboarding', 'permissions', 'notifications'],
    expectedBehavior: 'Should explain permission purpose and privacy protection',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'permission-request-microphone',
    message: 'Step 2 of 4: Voice Features. Allow microphone access to dismiss alarms with voice commands like "Stop alarm" or "Snooze 10 minutes". You can skip this step and enable later.',
    priority: 'medium',
    context: 'voice',
    tags: ['onboarding', 'permissions', 'voice', 'microphone'],
    expectedBehavior: 'Should explain voice feature benefits with skip option',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'permission-denied-fallback',
    message: 'Permission declined. No worries! You can still use Relife with manual dismissal. Alarms will work when the app is open. You can enable permissions anytime in Settings.',
    priority: 'medium',
    context: 'general',
    tags: ['onboarding', 'permissions', 'error-recovery'],
    expectedBehavior: 'Should provide reassurance and alternative options',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'first-alarm-creation-guidance',
    message: 'Step 3 of 4: Create Your First Alarm. Set your wake-up time using the time picker. Currently set to 7:00 AM. Choose a gentle wake-up sound to start.',
    priority: 'medium',
    context: 'alarm',
    tags: ['onboarding', 'alarm-creation', 'guidance'],
    expectedBehavior: 'Should guide through alarm creation with current values',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'onboarding-completion-success',
    message: 'Setup Complete! Your first alarm is set for 7:00 AM tomorrow. Relife will wake you up gently. Explore premium features like voice personalities and smart scheduling anytime.',
    priority: 'medium',
    context: 'general',
    tags: ['onboarding', 'completion', 'success'],
    expectedBehavior: 'Should confirm setup success and mention exploration options',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  }
];

// Emotional Intelligence & Nudges Tests
export const emotionalIntelligenceTests: TestScenario[] = [
  {
    id: 'emotional-state-recognition',
    message: 'Good morning! Based on your sleep patterns, you seem tired today. I've selected a gentler wake-up approach with soothing sounds. How are you feeling right now?',
    priority: 'medium',
    context: 'general',
    tags: ['emotional-intelligence', 'mood-detection', 'personalization'],
    expectedBehavior: 'Should explain reasoning for emotional detection and adaptations',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['premium']
  },
  {
    id: 'mood-feedback-collection',
    message: 'Rate your current mood: Currently Good. Use left and right arrows to change between Terrible, Bad, Okay, Good, Great, Amazing. This helps personalize your experience.',
    priority: 'medium',
    context: 'general',
    tags: ['emotional-intelligence', 'mood-rating', 'feedback'],
    expectedBehavior: 'Should provide clear mood rating interface with keyboard navigation',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'motivational-message-effectiveness',
    message: 'How effective was this morning\'s motivational message? "You\'re unstoppable today!" Rate from 1 to 5 stars. Currently 3 stars selected.',
    priority: 'low',
    context: 'general',
    tags: ['emotional-intelligence', 'motivation', 'effectiveness-rating'],
    expectedBehavior: 'Should quote the actual message and provide clear rating scale',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['premium']
  },
  {
    id: 'emotional-adaptation-notification',
    message: 'Emotional Intelligence Update: I\'ve learned you prefer energetic wake-ups on weekdays and gentle sounds on weekends. Your future alarms will adapt automatically.',
    priority: 'low',
    context: 'general',
    tags: ['emotional-intelligence', 'adaptation', 'learning'],
    expectedBehavior: 'Should explain specific learned preferences and automatic adaptations',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['premium']
  },
  {
    id: 'stress-detection-support',
    message: 'Stress Pattern Detected: You\'ve had difficulty waking up for 3 days. Would you like me to suggest relaxation techniques or adjust your bedtime reminders?',
    priority: 'medium',
    context: 'general',
    tags: ['emotional-intelligence', 'stress-detection', 'support'],
    expectedBehavior: 'Should identify patterns and offer specific helpful suggestions',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['premium']
  },
  {
    id: 'celebration-achievement-emotional',
    message: 'Emotional Victory! You\'ve maintained a positive morning mood for 7 days straight! Your consistency is inspiring. Here\'s a special achievement badge.',
    priority: 'low',
    context: 'general',
    tags: ['emotional-intelligence', 'achievement', 'celebration'],
    expectedBehavior: 'Should celebrate emotional achievements with specific metrics',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['premium']
  }
];

// Privacy & Consent Management Tests
export const privacyConsentTests: TestScenario[] = [
  {
    id: 'gdpr-initial-consent-request',
    message: 'Privacy Notice: Relife collects sleep and alarm data to improve your experience. We need your consent for analytics and personalization. You control all data and can withdraw consent anytime.',
    priority: 'high',
    context: 'general',
    tags: ['privacy', 'gdpr', 'consent', 'data-collection'],
    expectedBehavior: 'Should clearly explain data usage and user control',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'granular-consent-options',
    message: 'Consent Options: Essential functions enabled. Analytics: Currently enabled. Personalization: Enabled. Marketing: Disabled. Tap any option to change individual preferences.',
    priority: 'medium',
    context: 'general',
    tags: ['privacy', 'consent', 'granular-control'],
    expectedBehavior: 'Should list current consent state for each category with change options',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'data-usage-transparency',
    message: 'Data Transparency: We use your sleep patterns to suggest optimal bedtimes. Alarm success rates help improve wake-up methods. Voice data stays on your device only.',
    priority: 'medium',
    context: 'general',
    tags: ['privacy', 'transparency', 'data-usage'],
    expectedBehavior: 'Should explain specific data usage examples with clear boundaries',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'consent-withdrawal-confirmation',
    message: 'Analytics consent withdrawn successfully. This may reduce personalization quality, but all core features remain available. You can re-enable anytime in Privacy Settings.',
    priority: 'medium',
    context: 'general',
    tags: ['privacy', 'consent-withdrawal', 'confirmation'],
    expectedBehavior: 'Should confirm withdrawal and explain impact with re-enable option',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'data-export-request-confirmation',
    message: 'Data Export Request Received: Your personal data will be compiled and emailed within 30 days as required by GDPR. This includes all alarms, sleep data, and preferences.',
    priority: 'low',
    context: 'general',
    tags: ['privacy', 'data-export', 'gdpr-compliance'],
    expectedBehavior: 'Should confirm request and provide timeline with data scope',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  }
];

// Wake-Up Feedback Collection Tests
export const wakeUpFeedbackTests: TestScenario[] = [
  {
    id: 'morning-difficulty-rating',
    message: 'Morning Check-in: How difficult was waking up today? Currently set to Normal. Use arrows to select: Very Easy, Easy, Normal, Hard, Very Hard. This helps optimize future alarms.',
    priority: 'low',
    context: 'alarm',
    tags: ['feedback', 'wake-up', 'difficulty-rating'],
    expectedBehavior: 'Should provide clear difficulty scale with current selection and purpose explanation',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'morning-feeling-assessment',
    message: 'How are you feeling this morning? Currently Good. This helps me understand your sleep quality and adjust tomorrow\'s wake-up approach. Your pattern shows improvement this week.',
    priority: 'low',
    context: 'general',
    tags: ['feedback', 'morning-feeling', 'sleep-quality'],
    expectedBehavior: 'Should explain feedback purpose and provide encouraging context',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'alarm-effectiveness-rating',
    message: 'Rate this alarm\'s effectiveness: Ocean Waves at medium volume woke you up after 2 minutes. Was this: Too gentle, Just right, or Too intense? Currently Just right selected.',
    priority: 'low',
    context: 'alarm',
    tags: ['feedback', 'alarm-effectiveness', 'sound-rating'],
    expectedBehavior: 'Should reference specific alarm details with clear rating options',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'sleep-quality-correlation-feedback',
    message: 'Sleep Insight: You rated sleep quality as Good and waking up as Easy. This positive correlation suggests your 11 PM bedtime is optimal. Continue this pattern?',
    priority: 'low',
    context: 'general',
    tags: ['feedback', 'sleep-correlation', 'optimization'],
    expectedBehavior: 'Should connect feedback data points and provide actionable insights',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['premium']
  },
  {
    id: 'feedback-impact-notification',
    message: 'Feedback Applied: Based on your ratings, I\'ve reduced alarm volume by 20% and switched to gentler sounds on weekdays. You can always adjust these changes in settings.',
    priority: 'medium',
    context: 'alarm',
    tags: ['feedback', 'adaptation', 'changes-applied'],
    expectedBehavior: 'Should explain specific changes made from feedback with user control options',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['premium']
  }
];

// Progressive Web App & Installation Tests
export const pwaInstallationTests: TestScenario[] = [
  {
    id: 'pwa-install-prompt-benefits',
    message: 'Install Relife App: Get the full experience with reliable background alarms, offline access, and native app performance. Works without internet connection.',
    priority: 'medium',
    context: 'general',
    tags: ['pwa', 'installation', 'benefits'],
    expectedBehavior: 'Should highlight key benefits of app installation',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'platform-specific-install-ios',
    message: 'Install on iOS: Tap the Share button at the bottom of Safari, then select "Add to Home Screen". The app icon will appear on your home screen for easy access.',
    priority: 'medium',
    context: 'general',
    tags: ['pwa', 'installation', 'ios', 'instructions'],
    expectedBehavior: 'Should provide clear iOS-specific installation steps',
    deviceTypes: ['mobile'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'platform-specific-install-android',
    message: 'Install on Android: Tap "Add Relife to Home screen" in the browser menu, or look for the install prompt. You can also find it in Chrome\'s three-dot menu under "Install app".',
    priority: 'medium',
    context: 'general',
    tags: ['pwa', 'installation', 'android', 'instructions'],
    expectedBehavior: 'Should provide clear Android-specific installation steps',
    deviceTypes: ['mobile'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'desktop-pwa-install-prompt',
    message: 'Install Relife on Desktop: Click the install icon in your browser\'s address bar, or use the menu option "Install Relife". Access your alarms from your desktop or taskbar.',
    priority: 'medium',
    context: 'general',
    tags: ['pwa', 'installation', 'desktop', 'instructions'],
    expectedBehavior: 'Should provide clear desktop installation guidance',
    deviceTypes: ['desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'offline-capability-explanation',
    message: 'Offline Features Available: After installation, your alarms work without internet. Settings sync when reconnected. Voice features require connection for setup only.',
    priority: 'low',
    context: 'general',
    tags: ['pwa', 'offline', 'capabilities'],
    expectedBehavior: 'Should explain specific offline functionality and limitations',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'successful-pwa-installation',
    message: 'Installation Successful! Relife is now available from your home screen and app drawer. Background alarms are enabled. You can now close the browser safely.',
    priority: 'medium',
    context: 'general',
    tags: ['pwa', 'installation', 'success', 'confirmation'],
    expectedBehavior: 'Should confirm successful installation and explain new capabilities',
    deviceTypes: ['mobile', 'desktop'],
    userTypes: ['free', 'premium']
  }
];

// Tab Protection & Browser Context Tests
export const tabProtectionTests: TestScenario[] = [
  {
    id: 'tab-close-prevention-immediate-alarm',
    message: 'Warning: Closing this tab will disable your alarm in 15 minutes! Keep this tab open or install the app to ensure your 7:00 AM alarm works reliably.',
    priority: 'high',
    context: 'general',
    tags: ['tab-protection', 'alarm-safety', 'urgent-warning'],
    expectedBehavior: 'Should provide urgent warning with specific timing and solutions',
    deviceTypes: ['desktop', 'mobile'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'tab-visibility-impact-warning',
    message: 'Tab Visibility Alert: Switching to other tabs may affect alarm reliability. For guaranteed wake-ups, keep Relife active or install the app for background operation.',
    priority: 'medium',
    context: 'general',
    tags: ['tab-protection', 'visibility', 'reliability'],
    expectedBehavior: 'Should warn about visibility impact with background solution',
    deviceTypes: ['desktop', 'mobile'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'browser-sleep-mode-warning',
    message: 'Device Sleep Mode Detected: Your device may enter sleep mode overnight. This could prevent browser-based alarms. Consider installing the app for reliable wake-ups.',
    priority: 'medium',
    context: 'general',
    tags: ['tab-protection', 'sleep-mode', 'device-limitations'],
    expectedBehavior: 'Should explain device sleep impact and recommend app installation',
    deviceTypes: ['desktop', 'mobile'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'multiple-tabs-performance-warning',
    message: 'Multiple Relife Tabs Detected: Running multiple tabs may cause conflicts and reduce performance. Please use only one tab for optimal alarm reliability.',
    priority: 'medium',
    context: 'general',
    tags: ['tab-protection', 'multiple-tabs', 'performance'],
    expectedBehavior: 'Should identify multiple tabs issue and recommend single tab usage',
    deviceTypes: ['desktop', 'mobile'],
    userTypes: ['free', 'premium']
  },
  {
    id: 'safe-browsing-confirmation',
    message: 'Safe Browsing Enabled: Your alarms are protected from accidental tab closure. Install the app for even better reliability and background operation.',
    priority: 'low',
    context: 'general',
    tags: ['tab-protection', 'safe-browsing', 'confirmation'],
    expectedBehavior: 'Should confirm protection is active and suggest further improvement',
    deviceTypes: ['desktop', 'mobile'],
    userTypes: ['free', 'premium']
  }
];

// Combine all additional test categories
export const additionalAppSpecificTestCategories: Record<string, TestCategory> = {
  onboardingFlow: {
    name: 'Onboarding & First Experience',
    description: 'Testing user onboarding flow, permission requests, and setup guidance',
    icon: '🚀',
    color: '#10B981',
    isPremium: false,
    tests: onboardingFlowTests
  },
  emotionalIntelligence: {
    name: 'Emotional Intelligence & Nudges',
    description: 'Testing mood detection, emotional adaptations, and motivational features',
    icon: '🧠',
    color: '#8B5CF6',
    isPremium: true,
    tests: emotionalIntelligenceTests
  },
  privacyConsent: {
    name: 'Privacy & Consent Management',
    description: 'Testing privacy compliance, consent flows, and data transparency',
    icon: '🛡️',
    color: '#F59E0B',
    isPremium: false,
    tests: privacyConsentTests
  },
  wakeUpFeedback: {
    name: 'Wake-Up Feedback Collection',
    description: 'Testing post-alarm feedback, morning assessments, and adaptation processes',
    icon: '😴',
    color: '#06B6D4',
    isPremium: false,
    tests: wakeUpFeedbackTests
  },
  pwaInstallation: {
    name: 'PWA Installation & Offline',
    description: 'Testing app installation flows, platform instructions, and offline capabilities',
    icon: '📱',
    color: '#EF4444',
    isPremium: false,
    tests: pwaInstallationTests
  },
  tabProtection: {
    name: 'Tab Protection & Browser Context',
    description: 'Testing tab close warnings, visibility alerts, and browser-specific functionality',
    icon: '⚠️',
    color: '#F97316',
    isPremium: false,
    tests: tabProtectionTests
  }
};

// Configuration for additional app-specific categories
export const additionalAppSpecificCategoryConfig = {
  onboardingFlow: { enabled: true, requiresPremium: false },
  emotionalIntelligence: { enabled: true, requiresPremium: true },
  privacyConsent: { enabled: true, requiresPremium: false },
  wakeUpFeedback: { enabled: true, requiresPremium: false },
  pwaInstallation: { enabled: true, requiresPremium: false },
  tabProtection: { enabled: true, requiresPremium: false }
};

export default {
  additionalAppSpecificTestCategories,
  additionalAppSpecificCategoryConfig
};