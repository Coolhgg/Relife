/**
 * App-Specific Custom Test Scenarios for Relife Smart Alarm App
 * Specialized scenarios for unique Relife features beyond generic functionality
 */

import { TestScenario, TestCategory } from "./custom-test-scenarios";

// Nuclear Mode Challenge Tests
export const nuclearModeTests: TestScenario[] = [
  {
    id: "nuclear-mode-activation",
    message:
      "DEFCON 1 - MAXIMUM ALERT! Nuclear Mode activated! Complete 3 sequential challenges to prevent meltdown. First challenge: Solve this equation in 30 seconds: 47 × 23 + 156 = ?",
    priority: "high",
    context: "battle",
    tags: ["nuclear-mode", "challenge", "math", "countdown"],
    expectedBehavior:
      "Should announce with extreme urgency and clear time pressure",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["premium"],
  },
  {
    id: "nuclear-warning-escalation",
    message:
      "WARNING LEVEL YELLOW! 15 seconds remaining! Current answer: 1237. Submit now or face nuclear meltdown consequences!",
    priority: "high",
    context: "battle",
    tags: ["nuclear-mode", "warning", "countdown", "pressure"],
    expectedBehavior: "Should escalate urgency with time countdown",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["premium"],
  },
  {
    id: "nuclear-meltdown",
    message:
      "CRITICAL MELTDOWN INITIATED! Challenge failed! Alarm continues ringing. Emergency snooze activated for 10 minutes. Prepare for next nuclear challenge.",
    priority: "high",
    context: "battle",
    tags: ["nuclear-mode", "failure", "meltdown", "snooze"],
    expectedBehavior: "Should announce dramatic failure with clear next steps",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["premium"],
  },
  {
    id: "nuclear-defusal-success",
    message:
      "NUCLEAR DEFUSAL SUCCESSFUL! All 3 challenges completed! Crisis averted! Your reflexes saved the day. Alarm silenced. +500 XP earned!",
    priority: "high",
    context: "battle",
    tags: ["nuclear-mode", "success", "completion", "rewards"],
    expectedBehavior:
      "Should announce triumphant victory with celebration tone",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["premium"],
  },
  {
    id: "nuclear-precision-challenge",
    message:
      "Challenge 2: Precision Targeting! Tap the exact center of the red circle within 20 seconds. Accuracy required: 95% or higher!",
    priority: "high",
    context: "battle",
    tags: ["nuclear-mode", "precision", "targeting", "accuracy"],
    expectedBehavior:
      "Should provide clear instructions for motor precision task",
    deviceTypes: ["mobile", "tablet"],
    userTypes: ["premium"],
  },
];

// Battle System Tests
export const battleSystemTests: TestScenario[] = [
  {
    id: "battle-invitation-received",
    message:
      "Battle Challenge Received! Sarah invited you to a Speed Battle: First to dismiss alarm wins. 3 other participants joined. Battle starts tomorrow at 7:00 AM!",
    priority: "medium",
    context: "battle",
    tags: ["battle", "invitation", "social", "multiplayer"],
    expectedBehavior:
      "Should announce social interaction with participant details",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "battle-trash-talk",
    message:
      'Trash Talk from Mike: "Hope you are ready to lose again! My wake-up speed record is 12 seconds!" Respond with your own message or stay focused.',
    priority: "low",
    context: "battle",
    tags: ["battle", "trash-talk", "social", "competition"],
    expectedBehavior:
      "Should read trash talk message with playful competitive tone",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "battle-live-progress",
    message:
      "Battle in Progress! Current standings: 1st Mike - 15 seconds, 2nd You - 23 seconds, 3rd Sarah - 45 seconds, 4th Alex - still sleeping!",
    priority: "medium",
    context: "battle",
    tags: ["battle", "live-standings", "competition", "progress"],
    expectedBehavior: "Should announce current rankings with excitement",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "battle-victory",
    message:
      "BATTLE VICTORY! You completed the Task Master Battle in record time! Winner rewards: +200 XP, Battle Champion badge, bragging rights for the week!",
    priority: "high",
    context: "battle",
    tags: ["battle", "victory", "rewards", "achievement"],
    expectedBehavior:
      "Should celebrate victory with detailed reward announcement",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "battle-disconnect",
    message:
      "Battle Connection Lost! Continuing in offline mode. Your progress is saved and will sync when connection is restored. Keep battling!",
    priority: "medium",
    context: "battle",
    tags: ["battle", "offline", "sync", "connection"],
    expectedBehavior: "Should provide reassurance about offline functionality",
    deviceTypes: ["mobile", "desktop"],
  },
];

// Theme System Tests
export const themeSystemTests: TestScenario[] = [
  {
    id: "theme-creation-complete",
    message:
      'Custom theme "Ocean Sunset" created successfully! Features deep blue backgrounds with orange accent colors. Theme exported to library and ready for use.',
    priority: "medium",
    context: "general",
    tags: ["theme", "creation", "customization", "completion"],
    expectedBehavior:
      "Should announce theme completion with color descriptions",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["premium"],
  },
  {
    id: "seasonal-theme-auto-switch",
    message:
      "Seasonal Theme Change! Switching from Summer Vibrant to Autumn Warmth theme. Orange and golden colors now active to match the fall season.",
    priority: "low",
    context: "general",
    tags: ["theme", "seasonal", "automatic", "transition"],
    expectedBehavior:
      "Should explain seasonal theme change with color descriptions",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "high-contrast-activated",
    message:
      "High Contrast Theme activated for better visibility! All text now displays with maximum contrast ratios. Colors adjusted for accessibility compliance.",
    priority: "medium",
    context: "general",
    tags: ["theme", "accessibility", "high-contrast", "visibility"],
    expectedBehavior: "Should explain accessibility theme change clearly",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "theme-sync-conflict",
    message:
      'Theme Sync Conflict Detected! You modified "Gaming RGB" on two devices. Choose: Keep mobile version with neon green accents, or desktop version with purple highlights.',
    priority: "medium",
    context: "general",
    tags: ["theme", "sync", "conflict", "resolution"],
    expectedBehavior: "Should explain conflict with clear resolution options",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["premium"],
  },
];

// Voice Analytics Tests
export const voiceAnalyticsTests: TestScenario[] = [
  {
    id: "voice-accuracy-report",
    message:
      "Weekly Voice Analytics Report: Command recognition accuracy improved to 94.2%. Most effective personality: Drill Sergeant with 89% wake-up success rate. Least effective: Gentle voice at 67%.",
    priority: "medium",
    context: "voice",
    tags: ["voice", "analytics", "accuracy", "report"],
    expectedBehavior:
      "Should provide detailed analytics with specific percentages",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["premium"],
  },
  {
    id: "voice-biometric-strength",
    message:
      'Voice Biometric Update: Your vocal pattern strength increased by 12% this week. Voice security level upgraded to "Strong" - your voice unlock is now more reliable.',
    priority: "low",
    context: "voice",
    tags: ["voice", "biometric", "security", "upgrade"],
    expectedBehavior: "Should announce security improvement with clear benefit",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["premium"],
  },
  {
    id: "voice-mood-effectiveness",
    message:
      "Voice Mood Analysis: Morning energy levels highest with Motivational personality (8.4/10 alertness). Evening wind-down most effective with Gentle voice (9.1/10 relaxation).",
    priority: "low",
    context: "voice",
    tags: ["voice", "mood", "analysis", "effectiveness"],
    expectedBehavior: "Should provide mood analysis with specific scoring",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["premium"],
  },
];

// Gamification & Rewards Tests
export const gamificationTests: TestScenario[] = [
  {
    id: "daily-challenge-complete",
    message:
      'Daily Challenge Complete! "No Snooze Hero" achieved! You dismissed 3 alarms without snoozing. Rewards: +150 XP, Discipline Badge, 50 coins for premium shop.',
    priority: "medium",
    context: "general",
    tags: ["gamification", "challenge", "achievement", "rewards"],
    expectedBehavior: "Should celebrate achievement with detailed reward list",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "level-up-milestone",
    message:
      'LEVEL UP! Welcome to Wake Warrior Level 10! Milestone rewards unlocked: Exclusive "Master Riser" title, golden alarm icon, and access to Legendary Battle Mode!',
    priority: "high",
    context: "general",
    tags: ["gamification", "level-up", "milestone", "exclusive"],
    expectedBehavior:
      "Should announce major milestone with excitement and exclusives",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "streak-achievement",
    message:
      "Streak Achievement! 30-day Perfect Morning Streak maintained! Consistency Master badge earned. Keep going to unlock the legendary 100-day streak reward!",
    priority: "medium",
    context: "general",
    tags: ["gamification", "streak", "consistency", "long-term"],
    expectedBehavior:
      "Should acknowledge consistency with encouragement for next goal",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "leaderboard-ranking",
    message:
      "Leaderboard Update! You climbed to #3 in the Global Wake Champions ranking! Just 247 XP away from #2 position. Challenge more friends to climb higher!",
    priority: "low",
    context: "general",
    tags: ["gamification", "leaderboard", "ranking", "competition"],
    expectedBehavior: "Should announce ranking with competitive encouragement",
    deviceTypes: ["mobile", "desktop"],
  },
];

// Sleep Analytics Tests
export const sleepAnalyticsTests: TestScenario[] = [
  {
    id: "chronotype-detection",
    message:
      'Chronotype Analysis Complete! Based on 30 days of data, you are identified as a "Bear" chronotype. Optimal sleep: 11:00 PM to 7:00 AM. Peak productivity: 10:00 AM to 2:00 PM.',
    priority: "medium",
    context: "sleep",
    tags: ["sleep", "chronotype", "analysis", "optimization"],
    expectedBehavior:
      "Should provide chronotype explanation with actionable insights",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["premium"],
  },
  {
    id: "sleep-debt-warning",
    message:
      "Sleep Debt Alert! You have accumulated 4.2 hours of sleep debt this week. Recommended recovery: Go to bed 1 hour earlier tonight for optimal health.",
    priority: "high",
    context: "sleep",
    tags: ["sleep", "debt", "health", "recovery"],
    expectedBehavior:
      "Should warn about health impact with specific recovery advice",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "sleep-efficiency-improvement",
    message:
      "Sleep Efficiency Improved! This week: 87% efficiency (up from 79%). You are falling asleep 8 minutes faster and waking up less during the night. Excellent progress!",
    priority: "medium",
    context: "sleep",
    tags: ["sleep", "efficiency", "improvement", "progress"],
    expectedBehavior: "Should celebrate improvement with specific metrics",
    deviceTypes: ["mobile", "desktop"],
  },
];

// Offline & Sync Tests
export const offlineSyncTests: TestScenario[] = [
  {
    id: "offline-mode-activated",
    message:
      "Offline Mode Activated! No internet connection detected. All features remain available. Your actions will sync automatically when connection is restored.",
    priority: "medium",
    context: "general",
    tags: ["offline", "sync", "connection", "reassurance"],
    expectedBehavior: "Should provide reassurance about offline functionality",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "sync-completion",
    message:
      "Sync Complete! 7 alarms, 3 battle results, and 12 achievements synchronized across all devices. All data is now up to date everywhere.",
    priority: "low",
    context: "general",
    tags: ["sync", "completion", "cross-device", "data"],
    expectedBehavior: "Should confirm successful sync with data summary",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "sync-conflict-resolution",
    message:
      'Sync Conflict Resolved! Your 7:00 AM alarm was modified on two devices. Using the most recent version: "Morning Workout" with battle mode enabled.',
    priority: "medium",
    context: "general",
    tags: ["sync", "conflict", "resolution", "merge"],
    expectedBehavior: "Should explain conflict resolution clearly",
    deviceTypes: ["mobile", "desktop"],
  },
];

// Premium Subscription Tests
export const subscriptionTests: TestScenario[] = [
  {
    id: "premium-trial-started",
    message:
      "Premium Trial Activated! Welcome to 7 days of Pro features: Nuclear Mode, all voice personalities, advanced analytics, and unlimited themes. Enjoy exploring!",
    priority: "high",
    context: "premium",
    tags: ["premium", "trial", "activation", "features"],
    expectedBehavior: "Should welcome user with comprehensive feature list",
    userTypes: ["standard"],
  },
  {
    id: "usage-limit-approaching",
    message:
      "Usage Limit Alert! You have used 8 of 10 free custom themes this month. Upgrade to Premium for unlimited theme creation and access to Theme Studio.",
    priority: "medium",
    context: "premium",
    tags: ["usage", "limit", "warning", "upgrade"],
    expectedBehavior: "Should warn about limit with clear upgrade path",
    userTypes: ["standard"],
  },
  {
    id: "premium-feature-showcase",
    message:
      "Premium Feature Spotlight: Try Nuclear Mode for free! Experience the ultimate wake-up challenge with this 3-day trial. Join thousands who conquered their snoozing habit!",
    priority: "low",
    context: "premium",
    tags: ["premium", "showcase", "trial", "social-proof"],
    expectedBehavior: "Should entice with social proof and trial offer",
    userTypes: ["standard"],
  },
];

// Combine all app-specific categories
export const appSpecificTestCategories: Record<string, TestCategory> = {
  nuclearMode: {
    name: "Nuclear Mode Challenges",
    description:
      "Test the ultimate wake-up challenge system with multi-stage defusal",
    icon: "☢️",
    color: "#EF4444",
    tests: nuclearModeTests,
    isPremium: true,
  },
  battleSystem: {
    name: "Battle System & Social",
    description:
      "Test multiplayer battles, trash talk, and social competition features",
    icon: "⚔️",
    color: "#F59E0B",
    tests: battleSystemTests,
    isPremium: false,
  },
  themeSystem: {
    name: "Theme Creation & Management",
    description:
      "Test custom theme creation, seasonal switching, and accessibility themes",
    icon: "🎨",
    color: "#8B5CF6",
    tests: themeSystemTests,
    isPremium: true,
  },
  voiceAnalytics: {
    name: "Voice Analytics & Biometrics",
    description:
      "Test voice pattern analysis, accuracy reports, and biometric security",
    icon: "📊",
    color: "#06B6D4",
    tests: voiceAnalyticsTests,
    isPremium: true,
  },
  gamification: {
    name: "Gamification & Rewards",
    description: "Test XP system, achievements, challenges, and leaderboards",
    icon: "🏆",
    color: "#10B981",
    tests: gamificationTests,
    isPremium: false,
  },
  sleepAnalytics: {
    name: "Advanced Sleep Analytics",
    description:
      "Test chronotype detection, sleep debt tracking, and efficiency analysis",
    icon: "😴",
    color: "#6366F1",
    tests: sleepAnalyticsTests,
    isPremium: true,
  },
  offlineSync: {
    name: "Offline & Synchronization",
    description:
      "Test offline functionality, sync conflicts, and cross-device features",
    icon: "🔄",
    color: "#84CC16",
    tests: offlineSyncTests,
    isPremium: false,
  },
  subscription: {
    name: "Premium Subscription",
    description:
      "Test premium features, trials, usage limits, and subscription management",
    icon: "💎",
    color: "#F43F5E",
    tests: subscriptionTests,
    isPremium: false,
  },
};

// Configuration for app-specific categories
export const appSpecificCategoryConfig = {
  nuclearMode: { enabled: true, requiresPremium: true },
  battleSystem: { enabled: true, requiresPremium: false },
  themeSystem: { enabled: true, requiresPremium: true },
  voiceAnalytics: { enabled: true, requiresPremium: true },
  gamification: { enabled: true, requiresPremium: false },
  sleepAnalytics: { enabled: true, requiresPremium: true },
  offlineSync: { enabled: true, requiresPremium: false },
  subscription: { enabled: true, requiresPremium: false },
};

export default {
  appSpecificTestCategories,
  appSpecificCategoryConfig,
  nuclearModeTests,
  battleSystemTests,
  themeSystemTests,
  voiceAnalyticsTests,
  gamificationTests,
  sleepAnalyticsTests,
  offlineSyncTests,
  subscriptionTests,
};
