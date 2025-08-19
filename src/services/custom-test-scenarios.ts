/**
 * Custom Test Scenarios Configuration for Relife Smart Alarm App
 * Comprehensive test scenarios covering all app features
 */

export interface TestScenario {
  id: string;
  message: string;
  priority: "low" | "medium" | "high";
  context?: "alarm" | "voice" | "battle" | "sleep" | "premium" | "general";
  tags: string[];
  expectedBehavior?: string;
  deviceTypes?: ("mobile" | "desktop" | "tablet")[];
  userTypes?: ("new" | "premium" | "standard")[];
}

export interface TestCategory {
  name: string;
  description: string;
  icon: string;
  color: string;
  tests: TestScenario[];
  isPremium?: boolean;
}

export interface CustomCategoryConfig {
  [key: string]: {
    enabled: boolean;
    requiresPremium: boolean;
    customIcon?: string;
    customColor?: string;
  };
}

// Configuration for enabling/disabling custom categories
export const customCategoryConfig: CustomCategoryConfig = {
  voiceFeatures: { enabled: true, requiresPremium: true },
  gamingBattles: { enabled: true, requiresPremium: false },
  smartScheduling: { enabled: true, requiresPremium: true },
  premiumFeatures: { enabled: true, requiresPremium: true },
  sleepTracking: { enabled: true, requiresPremium: false },
};

// Voice Features & Personality Tests
export const voiceFeaturesTests: TestScenario[] = [
  {
    id: "voice-mood-happy",
    message:
      "Good morning sunshine! Your energetic alarm is ready to start an amazing day at 7:00 AM tomorrow!",
    priority: "high",
    context: "voice",
    tags: ["voice", "mood", "personality", "alarm-set"],
    expectedBehavior: "Should announce with upbeat, energetic tone",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["premium"],
  },
  {
    id: "voice-mood-calm",
    message:
      "Your gentle morning alarm has been set for 6:30 AM. Rest well, and wake peacefully tomorrow.",
    priority: "medium",
    context: "voice",
    tags: ["voice", "mood", "calm", "alarm-set"],
    expectedBehavior: "Should announce with soothing, calm tone",
    deviceTypes: ["mobile", "desktop"],
    userTypes: ["premium"],
  },
  {
    id: "voice-cloning-complete",
    message:
      "Voice cloning analysis complete. Your personalized wake-up voice is now ready and will greet you with your custom personality tomorrow morning.",
    priority: "high",
    context: "voice",
    tags: ["voice", "cloning", "ai", "completion"],
    expectedBehavior: "Should announce completion with excitement",
    userTypes: ["premium"],
  },
  {
    id: "voice-generation-error",
    message:
      "Voice generation temporarily unavailable. Using default energetic voice for your 7:30 AM alarm. Try voice customization again in a few minutes.",
    priority: "high",
    context: "voice",
    tags: ["voice", "error", "fallback", "retry"],
    expectedBehavior: "Should announce error with helpful recovery message",
    userTypes: ["premium"],
  },
  {
    id: "voice-preview-playing",
    message:
      'Now previewing your motivational voice: "Rise and shine, champion! Today is your day to conquer goals and achieve greatness!"',
    priority: "medium",
    context: "voice",
    tags: ["voice", "preview", "motivational"],
    expectedBehavior: "Should play voice preview with sample message",
    userTypes: ["premium"],
  },
];

// Gaming & Battle System Tests
export const gamingBattlesTests: TestScenario[] = [
  {
    id: "battle-mode-activated",
    message:
      "Battle Mode activated! Complete this 30-second math challenge to defeat the Sleep Dragon and turn off your alarm: What is 47 plus 29?",
    priority: "high",
    context: "battle",
    tags: ["battle", "math", "challenge", "alarm-stop"],
    expectedBehavior:
      "Should announce challenge with urgency and clear instructions",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "battle-victory",
    message:
      "Victory! You defeated the Sleep Dragon! +50 XP earned, +25 coins awarded. Your alarm is silenced and your 7-day wake-up streak continues!",
    priority: "high",
    context: "battle",
    tags: ["battle", "victory", "rewards", "streak"],
    expectedBehavior:
      "Should announce victory with celebration and reward details",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "battle-defeat",
    message:
      "The Sleep Dragon won this round. Alarm continues ringing. Try the next challenge: Solve this memory sequence - 4, 7, 2, 9, 1.",
    priority: "high",
    context: "battle",
    tags: ["battle", "defeat", "retry", "memory"],
    expectedBehavior:
      "Should announce defeat but provide immediate next challenge",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "level-up-achievement",
    message:
      "Congratulations! Level up to Wake Warrior Level 5! New unlocked: Ultimate Battle Mode with boss fights. Keep conquering those mornings!",
    priority: "medium",
    context: "battle",
    tags: ["battle", "level-up", "unlock", "achievement"],
    expectedBehavior:
      "Should announce level-up with excitement and new features",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "weekly-battle-stats",
    message:
      "Weekly Battle Report: 5 victories, 2 defeats, 320 XP earned. You are ranked #12 in the morning warriors leaderboard!",
    priority: "low",
    context: "battle",
    tags: ["battle", "stats", "leaderboard", "weekly"],
    expectedBehavior: "Should announce stats with encouraging competitive tone",
    deviceTypes: ["mobile", "desktop"],
  },
];

// Smart Scheduling & AI Tests
export const smartSchedulingTests: TestScenario[] = [
  {
    id: "sleep-cycle-detected",
    message:
      "Sleep cycle analysis complete. Based on your movement patterns, optimal wake time adjusted from 7:00 to 6:45 AM for lighter sleep phase.",
    priority: "high",
    context: "sleep",
    tags: ["sleep-cycle", "optimization", "adjustment"],
    expectedBehavior: "Should explain sleep optimization with clear reasoning",
    userTypes: ["premium"],
  },
  {
    id: "weather-adjustment",
    message:
      "Weather Alert: Heavy rain expected tomorrow morning. Your 6:30 AM alarm moved 15 minutes earlier to account for slower commute time.",
    priority: "medium",
    context: "alarm",
    tags: ["weather", "commute", "adjustment"],
    expectedBehavior: "Should announce weather-based schedule changes",
    userTypes: ["premium"],
  },
  {
    id: "calendar-conflict",
    message:
      "Calendar Conflict Detected: Important meeting moved to 8:00 AM. Your alarm automatically rescheduled from 7:30 to 6:45 AM to ensure preparation time.",
    priority: "high",
    context: "alarm",
    tags: ["calendar", "conflict", "meeting", "adjustment"],
    expectedBehavior:
      "Should announce calendar integration and automatic adjustments",
    userTypes: ["premium"],
  },
  {
    id: "health-insights",
    message:
      "Health Insight: Your average sleep quality this week is 85%. Consider moving bedtime 30 minutes earlier for improved deep sleep phases.",
    priority: "medium",
    context: "sleep",
    tags: ["health", "insights", "sleep-quality", "recommendation"],
    expectedBehavior:
      "Should provide health insights with actionable recommendations",
    userTypes: ["premium"],
  },
  {
    id: "smart-snooze-adaptation",
    message:
      "Smart Snooze adapted to your patterns. Instead of standard 9 minutes, your personalized snooze is now 7 minutes for optimal alertness.",
    priority: "medium",
    context: "alarm",
    tags: ["snooze", "adaptation", "personalization"],
    expectedBehavior: "Should explain personalized snooze timing with benefits",
    userTypes: ["premium"],
  },
];

// Premium Features Tests
export const premiumFeaturesTests: TestScenario[] = [
  {
    id: "premium-activated",
    message:
      "Premium subscription activated! Welcome to Relife Pro! All advanced features unlocked: voice customization, battle modes, smart scheduling, and unlimited themes.",
    priority: "high",
    context: "premium",
    tags: ["premium", "activation", "unlock", "features"],
    expectedBehavior:
      "Should announce premium activation with feature overview",
    userTypes: ["premium"],
  },
  {
    id: "feature-locked",
    message:
      "Advanced AI Sleep Optimization requires Relife Pro. Upgrade now to unlock intelligent wake timing based on your sleep cycles and daily schedule.",
    priority: "medium",
    context: "premium",
    tags: ["premium", "locked", "upgrade", "ai-features"],
    expectedBehavior: "Should announce locked feature with upgrade benefits",
    userTypes: ["standard"],
  },
  {
    id: "trial-expiring",
    message:
      "Premium trial expires in 3 days. Continue enjoying unlimited voice themes and advanced scheduling by upgrading to Relife Pro today.",
    priority: "medium",
    context: "premium",
    tags: ["trial", "expiring", "upgrade", "reminder"],
    expectedBehavior:
      "Should announce trial expiration with urgency but not pressure",
    userTypes: ["standard"],
  },
  {
    id: "usage-limit-reached",
    message:
      "Monthly limit reached for custom voice generation. Upgrade to Pro for unlimited voice customization or wait 12 days for limit reset.",
    priority: "medium",
    context: "premium",
    tags: ["limit", "usage", "voice", "upgrade"],
    expectedBehavior: "Should announce usage limits with clear options",
    userTypes: ["standard"],
  },
  {
    id: "premium-feature-preview",
    message:
      "Try Premium Feature: Experience our AI Sleep Optimizer for free! This 3-day trial shows how smart scheduling can improve your sleep quality by 23%.",
    priority: "low",
    context: "premium",
    tags: ["preview", "trial", "ai-features", "benefits"],
    expectedBehavior: "Should announce feature preview with specific benefits",
    userTypes: ["standard"],
  },
];

// Sleep Analytics & Tracking Tests
export const sleepTrackingTests: TestScenario[] = [
  {
    id: "daily-sleep-report",
    message:
      "Good morning! Last night: 7 hours 23 minutes sleep, 8.2/10 quality score. 2 hours deep sleep, 3.5 hours REM. You are well-rested and ready for the day!",
    priority: "medium",
    context: "sleep",
    tags: ["sleep-report", "daily", "quality", "metrics"],
    expectedBehavior:
      "Should announce sleep metrics with positive reinforcement",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "sleep-goal-achieved",
    message:
      "Sleep Goal Achievement! You have maintained 7+ hours of sleep for 14 consecutive days. Keep up the excellent sleep hygiene!",
    priority: "medium",
    context: "sleep",
    tags: ["sleep-goal", "achievement", "streak", "congratulations"],
    expectedBehavior: "Should announce achievement with celebration",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "poor-sleep-alert",
    message:
      "Sleep Alert: Only 4.5 hours sleep detected with frequent interruptions. Consider earlier bedtime tonight for better recovery.",
    priority: "high",
    context: "sleep",
    tags: ["sleep-quality", "poor", "alert", "recommendation"],
    expectedBehavior: "Should announce poor sleep with helpful suggestions",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "bedtime-reminder",
    message:
      "Smart Bedtime Reminder: To achieve your 7-hour sleep goal and wake refreshed at 6:30 AM, consider starting your bedtime routine in 30 minutes.",
    priority: "medium",
    context: "sleep",
    tags: ["bedtime", "reminder", "goal", "routine"],
    expectedBehavior: "Should announce bedtime reminder with goal context",
    deviceTypes: ["mobile", "desktop"],
  },
  {
    id: "weekly-sleep-trends",
    message:
      "Weekly Sleep Analysis: Average 6.8 hours nightly, improving trend. Best sleep Wednesday with 8.5 hours. Consider replicating Wednesday routine.",
    priority: "low",
    context: "sleep",
    tags: ["sleep-analysis", "weekly", "trends", "insights"],
    expectedBehavior: "Should announce weekly trends with actionable insights",
    deviceTypes: ["mobile", "desktop"],
  },
];

// Combine all custom test categories
export const customTestCategories: Record<string, TestCategory> = {
  voiceFeatures: {
    name: "Voice Features & Personality",
    description:
      "Test voice customization, moods, and AI-powered personality features",
    icon: "🎭",
    color: "#9333EA",
    tests: voiceFeaturesTests,
    isPremium: true,
  },
  gamingBattles: {
    name: "Gaming & Battles",
    description:
      "Test battle system, challenges, rewards, and gaming mechanics",
    icon: "⚔️",
    color: "#DC2626",
    tests: gamingBattlesTests,
    isPremium: false,
  },
  smartScheduling: {
    name: "Smart Scheduling",
    description:
      "Test AI scheduling, sleep optimization, and calendar integration",
    icon: "🧠",
    color: "#0891B2",
    tests: smartSchedulingTests,
    isPremium: true,
  },
  premiumFeatures: {
    name: "Premium Features",
    description: "Test premium functionality, subscriptions, and feature gates",
    icon: "💎",
    color: "#059669",
    tests: premiumFeaturesTests,
    isPremium: true,
  },
  sleepTracking: {
    name: "Sleep Analytics",
    description: "Test sleep tracking, analytics, and health insights",
    icon: "📊",
    color: "#7C3AED",
    tests: sleepTrackingTests,
    isPremium: false,
  },
};

// User context for personalized test generation
export interface UserContext {
  userId?: string;
  userName?: string;
  isPremium: boolean;
  currentTime?: Date;
  scheduledAlarms?: number;
  sleepGoalHours?: number;
  preferredVoiceMood?: string;
  battleLevel?: number;
}

/**
 * Generate dynamic test scenarios based on user context
 */
export function generateDynamicTestData(context: UserContext): TestScenario[] {
  const dynamicTests: TestScenario[] = [];
  const userName = context.userName || "you";
  const currentHour = context.currentTime?.getHours() || new Date().getHours();

  // Morning context (5 AM - 11 AM)
  if (currentHour >= 5 && currentHour <= 11) {
    dynamicTests.push({
      id: "dynamic-morning-greeting",
      message: `Good morning, ${userName}! Your scheduled 7:00 AM alarm went off perfectly. Time to start an amazing day with your personalized wake-up routine!`,
      priority: "high",
      context: "alarm",
      tags: ["dynamic", "morning", "greeting", "personalized"],
    });
  }

  // Evening context (6 PM - 11 PM)
  if (currentHour >= 18 && currentHour <= 23) {
    dynamicTests.push({
      id: "dynamic-bedtime-prep",
      message: `Evening, ${userName}! Based on your ${context.sleepGoalHours || 8}-hour sleep goal, your optimal bedtime is approaching in 2 hours. Your 6:30 AM alarm is ready for tomorrow.`,
      priority: "medium",
      context: "sleep",
      tags: ["dynamic", "evening", "bedtime", "preparation"],
    });
  }

  // Premium user context
  if (context.isPremium) {
    dynamicTests.push({
      id: "dynamic-premium-feature",
      message: `${userName}, your Premium AI voice analysis detected optimal energy levels. Recommended wake time adjusted to 6:45 AM for peak morning performance.`,
      priority: "high",
      context: "voice",
      tags: ["dynamic", "premium", "ai", "optimization"],
      userTypes: ["premium"],
    });
  }

  // Battle level context
  if (context.battleLevel && context.battleLevel > 0) {
    dynamicTests.push({
      id: "dynamic-battle-level",
      message: `Battle Warrior Level ${context.battleLevel}! Your morning victory streak is impressive, ${userName}. Tomorrow's challenge will be: Advanced Pattern Recognition!`,
      priority: "medium",
      context: "battle",
      tags: ["dynamic", "battle", "level", "streak"],
    });
  }

  return dynamicTests;
}

/**
 * Get all enabled custom test categories based on configuration
 */
export function getEnabledCustomCategories(): Record<string, TestCategory> {
  const enabledCategories: Record<string, TestCategory> = {};

  Object.entries(customTestCategories).forEach(([key, category]) => {
    const config = customCategoryConfig[key];
    if (config?.enabled) {
      enabledCategories[key] = category;
    }
  });

  return enabledCategories;
}

/**
 * Filter tests based on user premium status
 */
export function filterTestsByFeatureAccess(
  tests: TestScenario[],
  isPremium: boolean,
): TestScenario[] {
  return tests.filter((test) => {
    // If test specifies user types, check if current user type is included
    if (test.userTypes && test.userTypes.length > 0) {
      const userType = isPremium ? "premium" : "standard";
      return test.userTypes.includes(userType);
    }
    // If no user type specified, include all tests
    return true;
  });
}

/**
 * Get all tests from enabled categories with feature filtering
 */
export function getAllCustomTests(isPremium: boolean = false): TestScenario[] {
  const enabledCategories = getEnabledCustomCategories();
  let allTests: TestScenario[] = [];

  Object.entries(enabledCategories).forEach(([key, category]) => {
    const config = customCategoryConfig[key];

    // Check if user has access to premium categories
    if (config?.requiresPremium && !isPremium) {
      return; // Skip premium categories for non-premium users
    }

    // Filter tests based on user access
    const filteredTests = filterTestsByFeatureAccess(category.tests, isPremium);
    allTests = [...allTests, ...filteredTests];
  });

  return allTests;
}

/**
 * Validate test scenario structure
 */
export function validateTestScenario(test: TestScenario): boolean {
  return !!(
    test.id &&
    test.message &&
    test.priority &&
    test.tags &&
    Array.isArray(test.tags) &&
    test.tags.length > 0
  );
}

/**
 * Get category statistics
 */
export function getCategoryStats(): Record<
  string,
  { total: number; premium: number; free: number }
> {
  const stats: Record<
    string,
    { total: number; premium: number; free: number }
  > = {};

  Object.entries(customTestCategories).forEach(([key, category]) => {
    const premiumTests = category.tests.filter((test) =>
      test.userTypes?.includes("premium"),
    ).length;
    const total = category.tests.length;

    stats[key] = {
      total,
      premium: premiumTests,
      free: total - premiumTests,
    };
  });

  return stats;
}

export default {
  customTestCategories,
  customCategoryConfig,
  generateDynamicTestData,
  getEnabledCustomCategories,
  filterTestsByFeatureAccess,
  getAllCustomTests,
  validateTestScenario,
  getCategoryStats,
};
