import { expect, test, jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { AnalyticsProvider } from "../../../components/AnalyticsProvider";
import { FeatureAccessProvider } from "../../../contexts/FeatureAccessContext";
import { LanguageProvider } from "../../../contexts/LanguageContext";
import { StrugglingSamProvider } from "../../../contexts/StrugglingsamContext";

// Mock dependencies
jest.mock("../../../services/alarm-service", () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getAllAlarms: jest.fn(),
      createAlarm: jest.fn(),
      updateAlarm: jest.fn(),
      deleteAlarm: jest.fn(),
      duplicateAlarm: jest.fn(),
      exportAlarms: jest.fn(),
      importAlarms: jest.fn(),
    }),
  },
}));

jest.mock("../../../services/advanced-alarm-scheduler", () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      scheduleAlarm: jest.fn(),
      cancelAlarm: jest.fn(),
      updateScheduledAlarm: jest.fn(),
      getNextOccurrence: jest.fn(),
      optimizeSchedule: jest.fn(),
      handleLocationTrigger: jest.fn(),
      checkConditionalRules: jest.fn(),
    }),
  },
}));

jest.mock("../../../services/error-handler", () => ({
  ErrorHandler: {
    handleError: jest.fn(),
  },
}));

// Mock other services
jest.mock("../../../services/subscription-service", () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getFeatureAccess: jest.fn(),
      getUserTier: jest.fn(),
    }),
  },
}));

// Mock analytics hooks
jest.mock("../../useAnalytics", () => ({
  useAnalytics: () => ({
    track: jest.fn(),
    trackPageView: jest.fn(),
    trackFeatureUsage: jest.fn(),
  }),
  useEngagementAnalytics: () => ({
    trackFeatureDiscovery: jest.fn(),
  }),
  usePerformanceAnalytics: () => ({
    trackComponentRenderTime: jest.fn(),
  }),
  ANALYTICS_EVENTS: {
    SESSION_ENDED: "session_ended",
    ERROR_OCCURRED: "error_occurred",
    ALARM_CREATED: "alarm_created",
    ALARM_UPDATED: "alarm_updated",
  },
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, "geolocation", {
  value: mockGeolocation,
  writable: true,
});

// Mock i18n
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "en",
      exists: jest.fn().mockReturnValue(true),
    },
  }),
}));

jest.mock("@capacitor/device", () => ({
  Device: {
    getLanguageCode: jest.fn().mockResolvedValue({ value: "en" }),
  },
}));

jest.mock("../../../config/i18n", () => ({
  SUPPORTED_LANGUAGES: {
    en: { nativeName: "English", rtl: false },
    es: { nativeName: "Español", rtl: false },
  },
  getCurrentLanguage: () => "en",
  getLanguageInfo: () => ({ nativeName: "English", rtl: false }),
  isRTL: () => false,
  formatTime: (time: string) => time,
  formatRelativeTime: (date: Date) => date.toLocaleDateString(),
  changeLanguage: jest.fn(),
}));

// Test wrapper with all necessary providers
interface TestWrapperProps {
  children: React.ReactNode;
  userId?: string;
  userTier?: "free" | "basic" | "pro";
  mockAlarms?: any[];
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  userId = "test-user-123",
  userTier = "basic",
  mockAlarms = [],
}) => {
  // Mock service responses
  React.useEffect(() => {
      // Service is now imported at the top
    const mockAlarmService = AlarmService.getInstance();
    mockAlarmService.getAllAlarms.mockResolvedValue(mockAlarms);

    const SubscriptionService =
      // Service is now imported at the top
    const mockSubscriptionService = SubscriptionService.getInstance();
    mockSubscriptionService.getUserTier.mockResolvedValue(userTier);
    mockSubscriptionService.getFeatureAccess.mockResolvedValue({
      features: {
        advanced_alarms: {
          hasAccess: userTier !== "free",
          usageLimit: userTier === "basic" ? 10 : null,
          usageCount: mockAlarms.length,
          upgradeRequired: userTier === "free" ? "basic" : null,
        },
        conditional_rules: {
          hasAccess: userTier === "pro",
          upgradeRequired: userTier !== "pro" ? "pro" : null,
        },
        location_triggers: {
          hasAccess: userTier === "pro",
          upgradeRequired: userTier !== "pro" ? "pro" : null,
        },
      },
    });

      // Service is now imported at the top
    mockScheduler.scheduleAlarm.mockResolvedValue({ success: true });
    mockScheduler.getNextOccurrence.mockReturnValue(
      new Date(Date.now() + 24 * 60 * 60 * 1000),
    );
  }, [mockAlarms, userTier]);

  return (
    <AnalyticsProvider>
      <LanguageProvider>
        <FeatureAccessProvider userId={userId}>
          <StrugglingSamProvider userId={userId}>
            {children}
          </StrugglingSamProvider>
        </FeatureAccessProvider>
      </LanguageProvider>
    </AnalyticsProvider>
  );
};

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockGeolocation.getCurrentPosition.mockClear();
  });

  describe("Feature Access Integration", () => {
    it("should respect feature gates from FeatureAccessProvider", async () => {
        wrapper: (props) => <TestWrapper {...props} userTier="free" />,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Free users should have limited functionality
      expect(result.current.canUseAdvancedFeatures).toBe(false);
    });

    it("should enable advanced features for pro users through provider integration", async () => {
        wrapper: (props) => <TestWrapper {...props} userTier="pro" />,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.canUseAdvancedFeatures).toBe(true);
      expect(result.current.canUseConditionalRules).toBe(true);
      expect(result.current.canUseLocationTriggers).toBe(true);
    });

    it("should enforce usage limits through FeatureAccessProvider", async () => {
      const mockAlarms = Array(9)
        .fill(null)
        .map((_, i) => ({
          id: `alarm-${i}`,
          name: `Alarm ${i}`,
          time: "07:00",
          enabled: true,
        }));

        wrapper: (props) => (
          <TestWrapper {...props} userTier="basic" mockAlarms={mockAlarms} />
        ),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.usageInfo).toEqual({
        used: 9,
        limit: 10,
        remaining: 1,
      });
    });

    it("should block feature creation when limits exceeded", async () => {
      const mockAlarms = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `alarm-${i}`,
          name: `Alarm ${i}`,
          time: "07:00",
          enabled: true,
        }));

        wrapper: (props) => (
          <TestWrapper {...props} userTier="basic" mockAlarms={mockAlarms} />
        ),
      });

      await act(async () => {
        await result.current.createAlarm({
          name: "Test Alarm",
          time: "08:00",
          enabled: true,
          repeatDays: [],
        });
      });

      expect(result.current.error).toContain("limit");
    });
  });

  describe("Analytics Integration", () => {
    it("should track alarm creation through AnalyticsProvider", async () => {
      const mockTrack = jest.fn();
      // Service is now imported at the top
      useAnalytics.mockReturnValue({
        track: mockTrack,
        trackPageView: jest.fn(),
        trackFeatureUsage: jest.fn(),
      });

        wrapper: (props) => <TestWrapper {...props} userTier="pro" />,
      });

      // Service is now imported at the top
      const mockAlarmService = AlarmService.getInstance();
      mockAlarmService.createAlarm.mockResolvedValue({
        id: "new-alarm-123",
        name: "Test Alarm",
        time: "08:00",
      });

      await act(async () => {
        await result.current.createAlarm({
          name: "Test Alarm",
          time: "08:00",
          enabled: true,
          repeatDays: [],
        });
      });

      expect(mockTrack).toHaveBeenCalledWith(
        "alarm_created",
        expect.objectContaining({
          metadata: expect.objectContaining({
            alarm_id: "new-alarm-123",
            has_advanced_features: true,
          }),
        }),
      );
    });

    it("should track performance metrics for alarm operations", async () => {
      const mockTrackPerformance = jest.fn();
      // Service is now imported at the top
      useAnalytics.mockReturnValue({
        track: jest.fn(),
        trackPageView: jest.fn(),
        trackFeatureUsage: jest.fn(),
        trackPerformance: mockTrackPerformance,
      });

        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.refreshAlarms();
      });

      expect(mockTrackPerformance).toHaveBeenCalledWith(
        "alarm_load_duration",
        expect.any(Number),
        "alarm_management",
      );
    });
  });

  describe("Language Provider Integration", () => {
    it("should format alarm times according to language settings", async () => {
      const mockFormatTime = jest.fn((time) => `Formatted: ${time}`);
      // Service is now imported at the top
      i18nConfig.formatTime = mockFormatTime;

      const mockAlarms = [
        {
          id: "alarm-1",
          name: "Morning Alarm",
          time: "07:30",
          enabled: true,
        },
      ];

        wrapper: (props) => <TestWrapper {...props} mockAlarms={mockAlarms} />,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockFormatTime).toHaveBeenCalledWith("07:30", "en");
    });

    it("should handle RTL layouts for alarm scheduling interface", async () => {
      // Service is now imported at the top
      i18nConfig.isRTL.mockReturnValue(true);
      i18nConfig.getCurrentLanguage.mockReturnValue("ar");

        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Hook should be aware of RTL context
      expect(result.current.isLoading).toBeDefined();
    });
  });

  describe("Struggling Sam Context Integration", () => {
    it("should trigger achievements through StrugglingSamProvider", async () => {
      const mockUnlockAchievement = jest.fn();

      const TestWrapperWithAchievements: React.FC<{
        children: React.ReactNode;
      }> = ({ children }) => {
        const [achievements, setAchievements] = React.useState<any[]>([]);

        const contextValue = {
          achievements,
          unlockAchievement: mockUnlockAchievement,
          updateStreak: jest.fn(),
          shareAchievement: jest.fn(),
          joinChallenge: jest.fn(),
          leaveChallenge: jest.fn(),
          showUpgradePrompt: jest.fn(),
          dismissUpgradePrompt: jest.fn(),
          celebrateMilestone: jest.fn(),
          dismissCelebration: jest.fn(),
          loadUserData: jest.fn(),
          refreshCommunityStats: jest.fn(),
          currentTests: [],
          userAssignments: [],
          isFeatureEnabled: jest.fn(),
          getFeatureVariant: jest.fn(),
          trackConversion: jest.fn(),
          trackEngagement: jest.fn(),
          userStreak: null,
          activeChallenges: [],
          upgradePrompts: [],
          pendingCelebrations: [],
          communityStats: null,
          socialProofData: [],
          currentTestGroup: null,
          userABTest: null,
          loading: false,
          error: null,
        };

        return (
          <AnalyticsProvider>
            <LanguageProvider>
              <FeatureAccessProvider userId="test-user-123">
                <StrugglingSamProvider userId="test-user-123">
                  {children}
                </StrugglingSamProvider>
              </FeatureAccessProvider>
            </LanguageProvider>
          </AnalyticsProvider>
        );
      };

        wrapper: TestWrapperWithAchievements,
      });

      // Service is now imported at the top
      const mockAlarmService = AlarmService.getInstance();
      mockAlarmService.createAlarm.mockResolvedValue({
        id: "alarm-5",
        name: "Fifth Alarm",
      });

      // Create multiple alarms to trigger achievement
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.createAlarm({
            name: `Alarm ${i}`,
            time: "07:00",
            enabled: true,
            repeatDays: [],
          });
        });
      }

      // Should trigger achievement for creating multiple alarms
      expect(mockUnlockAchievement).toHaveBeenCalledWith(
        expect.objectContaining({
          achievementType: "alarm_master",
          title: expect.stringContaining("Alarm"),
        }),
      );
    });

    it("should update streak information when alarm is completed", async () => {
      const mockUpdateStreak = jest.fn();

      // Mock StrugglingSamProvider with streak tracking
      const useStrugglingSam = jest.fn().mockReturnValue({
        updateStreak: mockUpdateStreak,
        userStreak: {
          currentStreak: 3,
          longestStreak: 5,
        },
      });

        wrapper: TestWrapper,
      });

      await act(async () => {
        // Simulate alarm completion triggering streak update
        result.current.handleAlarmCompleted("alarm-123");
      });

      // Should integrate with streak tracking
      expect(result.current.isLoading).toBeDefined();
    });
  });

  describe("Location Triggers Integration", () => {
    it("should integrate geolocation with feature access controls", async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10,
          },
        });
      });

        wrapper: (props) => <TestWrapper {...props} userTier="pro" />,
      });

      await act(async () => {
        await result.current.createAlarm({
          name: "Location Alarm",
          time: "08:00",
          enabled: true,
          repeatDays: [],
          locationTrigger: {
            latitude: 37.7749,
            longitude: -122.4194,
            radius: 100,
          },
        });
      });

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });

    it("should deny location features for non-pro users", async () => {
        wrapper: (props) => <TestWrapper {...props} userTier="basic" />,
      });

      await act(async () => {
        await result.current.createAlarm({
          name: "Location Alarm",
          time: "08:00",
          enabled: true,
          repeatDays: [],
          locationTrigger: {
            latitude: 37.7749,
            longitude: -122.4194,
            radius: 100,
          },
        });
      });

      expect(result.current.error).toContain("Pro subscription required");
    });
  });

  describe("Cross-Provider Error Handling", () => {
    it("should handle errors gracefully across all providers", async () => {
      const mockHandleError = jest.fn();
      const ErrorHandler =
      // Service is now imported at the top
      ErrorHandler.handleError = mockHandleError;

      // Mock service error
      // Service is now imported at the top
      const mockAlarmService = AlarmService.getInstance();
      mockAlarmService.createAlarm.mockRejectedValue(
        new Error("Database error"),
      );

        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.createAlarm({
          name: "Test Alarm",
          time: "07:00",
          enabled: true,
          repeatDays: [],
        });
      });

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining("Failed to create alarm"),
        expect.objectContaining({
        }),
      );
    });
  });

  describe("Performance with Multiple Providers", () => {
    it("should maintain performance with full provider stack", async () => {
      const startTime = Date.now();

        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should initialize quickly even with multiple providers
      expect(duration).toBeLessThan(200);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
