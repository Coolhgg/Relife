/**
 * API Service for Struggling Sam Optimization Features
 * Handles all backend operations for streaks, achievements, challenges, and A/B testing
 */

import {
  UserStreak,
  SamAchievement,
  SocialChallenge,
  SmartUpgradePrompt,
  HabitCelebration,
  ABTestGroup,
  UserABTest,
  CommunityStats,
  SocialProofData,
  SuccessStory,
  ChallengeParticipant,
} from "../types/struggling-sam";

// Base API configuration
const API_BASE_URL = process.env.VITE_API_BASE_URL || "http://localhost:3001";
const API_ENDPOINTS = {
  // User Streak endpoints
  USER_STREAK: "/api/struggling-sam/streak",
  UPDATE_STREAK: "/api/struggling-sam/streak/update",

  // Achievement endpoints
  ACHIEVEMENTS: "/api/struggling-sam/achievements",
  UNLOCK_ACHIEVEMENT: "/api/struggling-sam/achievements/unlock",
  SHARE_ACHIEVEMENT: "/api/struggling-sam/achievements/share",

  // Social Challenge endpoints
  CHALLENGES: "/api/struggling-sam/challenges",
  JOIN_CHALLENGE: "/api/struggling-sam/challenges/join",
  LEAVE_CHALLENGE: "/api/struggling-sam/challenges/leave",

  // Smart Upgrade Prompts
  UPGRADE_PROMPTS: "/api/struggling-sam/upgrade-prompts",
  TRACK_PROMPT_ACTION: "/api/struggling-sam/upgrade-prompts/track",

  // Celebrations
  CELEBRATIONS: "/api/struggling-sam/celebrations",

  // Community & Social Proof
  COMMUNITY_STATS: "/api/struggling-sam/community/stats",
  SOCIAL_PROOF: "/api/struggling-sam/social-proof",
  SUCCESS_STORIES: "/api/struggling-sam/success-stories",

  // A/B Testing
  AB_TEST_ASSIGNMENT: "/api/struggling-sam/ab-test/assignment",
  AB_TEST_TRACKING: "/api/struggling-sam/ab-test/track",
};

// HTTP client with error handling
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  post<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }
}

const apiClient = new ApiClient();

// Struggling Sam API Service
export class StrugglingSamApiService {
  // ============================================================================
  // USER STREAK OPERATIONS
  // ============================================================================

  static async getUserStreak(userId: string): Promise<UserStreak | null> {
    try {
      return await apiClient.get<UserStreak>(
        `${API_ENDPOINTS.USER_STREAK}/${userId}`,
      );
    } catch (error) {
      console.error("Error fetching user streak:", error);
      return null;
    }
  }

  static async updateStreak(
    userId: string,
    streakData: {
      currentStreak: number;
      longestStreak?: number;
      lastWakeUpDate: string;
      streakType?: string;
    },
  ): Promise<UserStreak> {
    return await apiClient.put<UserStreak>(API_ENDPOINTS.UPDATE_STREAK, {
      userId,
      ...streakData,
    });
  }

  static async useStreakFreeze(userId: string): Promise<UserStreak> {
    return await apiClient.post<UserStreak>(
      `${API_ENDPOINTS.USER_STREAK}/freeze`,
      { userId },
    );
  }

  // ============================================================================
  // ACHIEVEMENT OPERATIONS
  // ============================================================================

  static async getUserAchievements(userId: string): Promise<SamAchievement[]> {
    return await apiClient.get<SamAchievement[]>(
      `${API_ENDPOINTS.ACHIEVEMENTS}/${userId}`,
    );
  }

  static async unlockAchievement(
    userId: string,
    achievementType: string,
    progress?: {
      current: number;
      target: number;
    },
  ): Promise<SamAchievement> {
    return await apiClient.post<SamAchievement>(
      API_ENDPOINTS.UNLOCK_ACHIEVEMENT,
      {
        userId,
        achievementType,
        progress,
      },
    );
  }

  static async shareAchievement(
    achievementId: string,
    platform: string,
  ): Promise<void> {
    await apiClient.post(API_ENDPOINTS.SHARE_ACHIEVEMENT, {
      achievementId,
      platform,
    });
  }

  static async checkAchievementProgress(
    userId: string,
  ): Promise<SamAchievement[]> {
    return await apiClient.get<SamAchievement[]>(
      `${API_ENDPOINTS.ACHIEVEMENTS}/${userId}/progress`,
    );
  }

  // ============================================================================
  // SOCIAL CHALLENGE OPERATIONS
  // ============================================================================

  static async getAvailableChallenges(
    userId?: string,
  ): Promise<SocialChallenge[]> {
    const endpoint = userId
      ? `${API_ENDPOINTS.CHALLENGES}?userId=${userId}`
      : API_ENDPOINTS.CHALLENGES;
    return await apiClient.get<SocialChallenge[]>(endpoint);
  }

  static async getUserChallenges(userId: string): Promise<SocialChallenge[]> {
    return await apiClient.get<SocialChallenge[]>(
      `${API_ENDPOINTS.CHALLENGES}/user/${userId}`,
    );
  }

  static async joinChallenge(
    userId: string,
    challengeId: string,
  ): Promise<ChallengeParticipant> {
    return await apiClient.post<ChallengeParticipant>(
      API_ENDPOINTS.JOIN_CHALLENGE,
      {
        userId,
        challengeId,
      },
    );
  }

  static async leaveChallenge(
    userId: string,
    challengeId: string,
  ): Promise<void> {
    await apiClient.post(API_ENDPOINTS.LEAVE_CHALLENGE, {
      userId,
      challengeId,
    });
  }

  static async updateChallengeProgress(
    userId: string,
    challengeId: string,
    progress: number,
  ): Promise<void> {
    await apiClient.put(`${API_ENDPOINTS.CHALLENGES}/progress`, {
      userId,
      challengeId,
      progress,
    });
  }

  // ============================================================================
  // SMART UPGRADE PROMPT OPERATIONS
  // ============================================================================

  static async getUpgradePrompts(
    userId: string,
  ): Promise<SmartUpgradePrompt[]> {
    return await apiClient.get<SmartUpgradePrompt[]>(
      `${API_ENDPOINTS.UPGRADE_PROMPTS}/${userId}`,
    );
  }

  static async createUpgradePrompt(
    userId: string,
    promptData: Partial<SmartUpgradePrompt>,
  ): Promise<SmartUpgradePrompt> {
    return await apiClient.post<SmartUpgradePrompt>(
      API_ENDPOINTS.UPGRADE_PROMPTS,
      {
        userId,
        ...promptData,
      },
    );
  }

  static async trackPromptAction(
    promptId: string,
    action: "shown" | "clicked" | "converted" | "dismissed",
  ): Promise<void> {
    await apiClient.post(API_ENDPOINTS.TRACK_PROMPT_ACTION, {
      promptId,
      action,
      timestamp: new Date().toISOString(),
    });
  }

  // ============================================================================
  // CELEBRATION OPERATIONS
  // ============================================================================

  static async createCelebration(
    celebration: Omit<HabitCelebration, "id">,
  ): Promise<HabitCelebration> {
    return await apiClient.post<HabitCelebration>(
      API_ENDPOINTS.CELEBRATIONS,
      celebration,
    );
  }

  static async markCelebrationShown(celebrationId: string): Promise<void> {
    await apiClient.put(
      `${API_ENDPOINTS.CELEBRATIONS}/${celebrationId}/shown`,
      {
        shownAt: new Date().toISOString(),
      },
    );
  }

  static async shareCelebration(
    celebrationId: string,
    platform: string,
  ): Promise<void> {
    await apiClient.post(
      `${API_ENDPOINTS.CELEBRATIONS}/${celebrationId}/share`,
      {
        platform,
        sharedAt: new Date().toISOString(),
      },
    );
  }

  // ============================================================================
  // COMMUNITY & SOCIAL PROOF OPERATIONS
  // ============================================================================

  static async getCommunityStats(): Promise<CommunityStats> {
    return await apiClient.get<CommunityStats>(API_ENDPOINTS.COMMUNITY_STATS);
  }

  static async getSocialProofData(
    userSegment?: string,
  ): Promise<SocialProofData[]> {
    const endpoint = userSegment
      ? `${API_ENDPOINTS.SOCIAL_PROOF}?segment=${userSegment}`
      : API_ENDPOINTS.SOCIAL_PROOF;
    return await apiClient.get<SocialProofData[]>(endpoint);
  }

  static async getSuccessStories(
    persona?: string,
    limit?: number,
  ): Promise<SuccessStory[]> {
    const params = new URLSearchParams();
    if (persona) params.append("persona", persona);
    if (limit) params.append("limit", limit.toString());

    const endpoint = `${API_ENDPOINTS.SUCCESS_STORIES}${params.toString() ? `?${params}` : ""}`;
    return await apiClient.get<SuccessStory[]>(endpoint);
  }

  static async trackSocialProofEngagement(
    proofId: string,
    action: "view" | "click" | "share",
  ): Promise<void> {
    await apiClient.post(`${API_ENDPOINTS.SOCIAL_PROOF}/${proofId}/track`, {
      action,
      timestamp: new Date().toISOString(),
    });
  }

  // ============================================================================
  // A/B TESTING OPERATIONS
  // ============================================================================

  static async getUserABTestAssignment(
    userId: string,
  ): Promise<UserABTest | null> {
    try {
      return await apiClient.get<UserABTest>(
        `${API_ENDPOINTS.AB_TEST_ASSIGNMENT}/${userId}`,
      );
    } catch (error) {
      console.error("Error fetching A/B test assignment:", error);
      return null;
    }
  }

  static async assignUserToABTest(userId: string): Promise<UserABTest> {
    return await apiClient.post<UserABTest>(API_ENDPOINTS.AB_TEST_ASSIGNMENT, {
      userId,
    });
  }

  static async getABTestGroups(): Promise<ABTestGroup[]> {
    return await apiClient.get<ABTestGroup[]>(
      "/api/struggling-sam/ab-test/groups",
    );
  }

  static async trackABTestConversion(
    testId: string,
    userId: string,
  ): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AB_TEST_TRACKING, {
      testId,
      userId,
      action: "conversion",
      timestamp: new Date().toISOString(),
    });
  }

  static async trackABTestEngagement(
    testId: string,
    userId: string,
    action: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AB_TEST_TRACKING, {
      testId,
      userId,
      action,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  static async recordWakeUpEvent(
    userId: string,
    alarmTime: string,
    actualWakeTime: string,
  ): Promise<{
    streakUpdated: boolean;
    newStreak: number;
    achievementsUnlocked: SamAchievement[];
    celebrationTriggered: boolean;
  }> {
    return await apiClient.post("/api/struggling-sam/wake-up-event", {
      userId,
      alarmTime,
      actualWakeTime,
      timestamp: new Date().toISOString(),
    });
  }

  static async getDashboardData(userId: string): Promise<{
    userStreak: UserStreak | null;
    achievements: SamAchievement[];
    activeChallenges: SocialChallenge[];
    communityStats: CommunityStats;
    socialProofData: SocialProofData[];
    upgradePrompts: SmartUpgradePrompt[];
    pendingCelebrations: HabitCelebration[];
  }> {
    return await apiClient.get(`/api/struggling-sam/dashboard/${userId}`);
  }

  static async healthCheck(): Promise<{
    status: "ok" | "error";
    timestamp: string;
  }> {
    return await apiClient.get("/api/struggling-sam/health");
  }
}

// Export singleton instance
export default StrugglingSamApiService;
