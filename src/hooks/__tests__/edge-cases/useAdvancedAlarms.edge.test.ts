import { expect, test, jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";

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
      getAlarmStatistics: jest.fn(),
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
      bulkScheduleAlarms: jest.fn(),
    }),
  },
}));

jest.mock("../../../services/error-handler", () => ({
  ErrorHandler: {
    handleError: jest.fn(),
  },
}));

jest.mock("../../useAnalytics", () => ({
  useAnalytics: () => ({
    track: jest.fn(),
    trackPageView: jest.fn(),
    trackFeatureUsage: jest.fn(),
  }),
  ANALYTICS_EVENTS: {
    ALARM_CREATED: "alarm_created",
    ALARM_DELETED: "alarm_deleted",
    BULK_OPERATION: "bulk_operation",
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

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.useFakeTimers();

    // Reset geolocation mocks
    mockGeolocation.getCurrentPosition.mockClear();
    mockGeolocation.watchPosition.mockClear();
    mockGeolocation.clearWatch.mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Data Corruption and Invalid States", () => {
    it("should handle corrupted alarm data from storage", async () => {
      // Service is now imported at the top
      const mockAlarmService = AlarmService.getInstance();

      // Return mixed valid and corrupted alarm data
      mockAlarmService.getAllAlarms.mockResolvedValue([
        { id: "alarm-1", name: "Valid Alarm", time: "07:00", enabled: true },
        { id: null, name: undefined, time: "invalid-time" }, // Corrupted
        "invalid-alarm-format", // Wrong format
        { id: "alarm-3", name: "Another Valid", time: "08:00", enabled: true },
        { id: "alarm-4", time: "09:00" }, // Missing required fields
      ]);


      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Should filter out corrupted alarms and keep valid ones
      const validAlarms = result.current.alarms.filter(
        (alarm) => alarm && typeof alarm === "object" && alarm.id && alarm.time,
      );
      expect(validAlarms).toHaveLength(2);
      expect(result.current.error).not.toContain("TypeError");
    });

    it("should handle invalid time formats", async () => {
      // Service is now imported at the top
      const mockAlarmService = AlarmService.getInstance();

      mockAlarmService.createAlarm.mockResolvedValue({
        id: "alarm-123",
        name: "Test Alarm",
        time: "25:70", // Invalid time
        enabled: true,
      });


      await act(async () => {
        await result.current.createAlarm({
          name: "Test Alarm",
          time: "25:70",
          enabled: true,
          repeatDays: [],
        });
      });

      expect(result.current.error).toContain("Invalid time format");
    });

    it("should handle extremely large alarm collections", async () => {
      // Service is now imported at the top
      const mockAlarmService = AlarmService.getInstance();

      // Generate 10,000 alarms
      const largeAlarmCollection = Array(10000)
        .fill(null)
        .map((_, index) => ({
          id: `alarm-${index}`,
          name: `Alarm ${index}`,
          time: `${(index % 24).toString().padStart(2, "0")}:${(index % 60).toString().padStart(2, "0")}`,
          enabled: index % 2 === 0,
          repeatDays: index % 7 === 0 ? [1, 2, 3, 4, 5] : [],
          metadata: {
            large_data: "x".repeat(1000), // 1KB per alarm
          },
        }));

      mockAlarmService.getAllAlarms.mockResolvedValue(largeAlarmCollection);

      const startTime = Date.now();

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
      const endTime = Date.now();

      // Should handle large collections efficiently
      expect(endTime - startTime).toBeLessThan(2000); // Less than 2 seconds
      expect(result.current.alarms).toHaveLength(10000);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Concurrency and Race Conditions", () => {
    it("should handle concurrent alarm creations", async () => {
      // Service is now imported at the top
      const mockAlarmService = AlarmService.getInstance();

      let creationCount = 0;
      mockAlarmService.createAlarm.mockImplementation((alarm) => {
        creationCount++;
        return new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                id: `alarm-${creationCount}`,
                ...alarm,
                created_at: new Date().toISOString(),
              }),
            100 + Math.random() * 200,
          );
        });
      });


      await act(async () => {
        // Create 20 alarms simultaneously
        const promises = Array(20)
          .fill(null)
          .map((_, index) =>
            result.current.createAlarm({
              name: `Concurrent Alarm ${index}`,
              time: `${(7 + (index % 3)).toString().padStart(2, "0")}:${((index * 5) % 60).toString().padStart(2, "0")}`,
              enabled: true,
              repeatDays: [],
            }),
          );

        await Promise.allSettled(promises);
      });

      expect(creationCount).toBe(20);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle alarm deletion during update", async () => {
      // Service is now imported at the top
      const mockAlarmService = AlarmService.getInstance();

      mockAlarmService.updateAlarm.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  id: "alarm-123",
                  name: "Updated Alarm",
                  time: "08:00",
                }),
              200,
            ),
          ),
      );

      mockAlarmService.deleteAlarm.mockResolvedValue({ success: true });


      await act(async () => {
        // Start update
        const updatePromise = result.current.updateAlarm("alarm-123", {
          name: "Updated Name",
        });

        // Delete before update completes
        setTimeout(() => {
          result.current.deleteAlarm("alarm-123");
        }, 50);

        await Promise.allSettled([updatePromise]);
      });

      // Should handle conflicting operations gracefully
      expect(result.current.error).not.toContain("conflict");
    });

    it("should handle rapid alarm scheduling operations", async () => {
      // Service is now imported at the top

      let scheduleCount = 0;
      mockScheduler.scheduleAlarm.mockImplementation((alarm) => {
        scheduleCount++;
        return Promise.resolve({
          scheduled: true,
          next_occurrence: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      });


      await act(async () => {
        // Schedule 100 alarms rapidly
        const alarms = Array(100)
          .fill(null)
          .map((_, index) => ({
            id: `alarm-${index}`,
            name: `Rapid Alarm ${index}`,
            time: "07:00",
            enabled: true,
          }));

        await result.current.bulkScheduleAlarms(alarms);
      });

      expect(scheduleCount).toBeGreaterThan(0);
    });
  });

  describe("Geolocation Edge Cases", () => {
    it("should handle geolocation permission denied", async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success, error) => {
          error({ code: 1, message: "User denied Geolocation" });
        },
      );


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

      expect(result.current.error).toContain("location permission");
    });

    it("should handle geolocation timeout", async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success, error) => {
          setTimeout(() => {
            error({ code: 3, message: "Timeout" });
          }, 10000);
        },
      );


      await act(async () => {
        // Try to create location-based alarm
        const promise = result.current.createAlarm({
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

        // Fast forward to timeout
        jest.advanceTimersByTime(10000);
        await promise;
      });

      expect(result.current.error).toContain("timeout");
    });

    it("should handle invalid GPS coordinates", async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 999, // Invalid latitude
            longitude: -999, // Invalid longitude
            accuracy: 10,
          },
        });
      });


      await act(async () => {
        await result.current.createAlarm({
          name: "Location Alarm",
          time: "08:00",
          enabled: true,
          repeatDays: [],
          locationTrigger: {
            latitude: 999,
            longitude: -999,
            radius: 100,
          },
        });
      });

      expect(result.current.error).toContain("Invalid coordinates");
    });
  });

  describe("Import/Export Edge Cases", () => {
    it("should handle corrupted import files", async () => {
      // Service is now imported at the top
      const mockAlarmService = AlarmService.getInstance();

      mockAlarmService.importAlarms.mockRejectedValue(
        new Error("Invalid file format"),
      );


      const corruptedFile = new File(["corrupted-data-{{{"], "alarms.json", {
        type: "application/json",
      });

      await act(async () => {
        await result.current.importAlarms(corruptedFile);
      });

      expect(result.current.error).toContain("Invalid file format");
    });

    it("should handle extremely large import files", async () => {
      // Service is now imported at the top
      const mockAlarmService = AlarmService.getInstance();

      // Mock successful import of large file
      mockAlarmService.importAlarms.mockImplementation((file) => {
        // Simulate processing delay based on file size
        const delay = Math.min(file.size / 1000, 5000); // Max 5 seconds
        return new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                imported: Math.floor(file.size / 100), // Mock alarm count
                skipped: 0,
                errors: [],
              }),
            delay,
          );
        });
      });


      // Create a 10MB file
      const largeContent = JSON.stringify(
        Array(10000).fill({
          name: "Large Import Alarm",
          time: "07:00",
          enabled: true,
        }),
      );

      const largeFile = new File([largeContent], "large-alarms.json", {
        type: "application/json",
      });

      const startTime = Date.now();
      await act(async () => {
        await result.current.importAlarms(largeFile);
      });
      const endTime = Date.now();

      // Should handle large files efficiently
      expect(endTime - startTime).toBeLessThan(10000); // Less than 10 seconds
      expect(result.current.importResult?.imported).toBeGreaterThan(0);
    });

    it("should handle network failures during export", async () => {
      // Service is now imported at the top
      const mockAlarmService = AlarmService.getInstance();

      mockAlarmService.exportAlarms.mockRejectedValue(
        new Error("Network error during export"),
      );


      await act(async () => {
        await result.current.exportAlarms("json");
      });

      expect(result.current.error).toContain("Network error");

      // Should provide retry mechanism
      mockAlarmService.exportAlarms.mockResolvedValue({
        data: JSON.stringify([]),
        filename: "alarms.json",
      });

      await act(async () => {
        await result.current.retryLastOperation();
      });

      expect(result.current.exportResult).toBeTruthy();
    });
  });

  describe("Conditional Rules Edge Cases", () => {
    it("should handle invalid weather API responses", async () => {
      // Service is now imported at the top

      mockScheduler.checkConditionalRules.mockRejectedValue(
        new Error("Weather API unavailable"),
      );


      await act(async () => {
        await result.current.createAlarm({
          name: "Weather Alarm",
          time: "07:00",
          enabled: true,
          repeatDays: [],
          conditionalRules: {
            weather: {
              condition: "sunny",
              temperature: { min: 15, max: 25 },
            },
          },
        });
      });

      // Should create alarm but disable weather rules
      expect(result.current.error).toContain("Weather conditions unavailable");
    });

    it("should handle conflicting conditional rules", async () => {

      await act(async () => {
        await result.current.createAlarm({
          name: "Conflicting Rules Alarm",
          time: "07:00",
          enabled: true,
          repeatDays: [],
          conditionalRules: {
            weather: { condition: "sunny" },
            calendar: { hasEvents: false },
            location: { withinRadius: 100 },
            // These rules might conflict with each other
            timeOffset: {
              earlier: 30, // 30 minutes earlier
              later: 15, // 15 minutes later - conflict!
            },
          },
        });
      });

      expect(result.current.error).toContain("Conflicting rules");
    });
  });

  describe("Performance and Memory Stress Tests", () => {
    it("should handle intensive alarm scheduling without memory leaks", async () => {
      // Service is now imported at the top

      let scheduleCallCount = 0;
      mockScheduler.scheduleAlarm.mockImplementation(() => {
        scheduleCallCount++;
        return Promise.resolve({ scheduled: true });
      });

      const { result, unmount } = renderHook(() =>
      );

      await act(async () => {
        // Create and schedule many alarms
        for (let batch = 0; batch < 10; batch++) {
          const alarms = Array(100)
            .fill(null)
            .map((_, index) => ({
              name: `Stress Test Alarm ${batch}-${index}`,
              time: `${((batch + index) % 24).toString().padStart(2, "0")}:00`,
              enabled: true,
              repeatDays: [1, 2, 3, 4, 5],
            }));

          for (const alarm of alarms) {
            await result.current.createAlarm(alarm);
          }
        }
      });

      // Should handle without excessive memory usage
      expect(scheduleCallCount).toBe(1000);
      expect(result.current.isLoading).toBe(false);

      unmount();
    });

    it("should handle rapid alarm state changes", async () => {
      // Service is now imported at the top
      const mockAlarmService = AlarmService.getInstance();

      let operationCount = 0;
      const mockOperation = (operation: string) => {
        operationCount++;
        return Promise.resolve({
          id: "alarm-123",
          operation: operation,
          count: operationCount,
        });
      };

      mockAlarmService.updateAlarm.mockImplementation(() =>
        mockOperation("update"),
      );
      mockAlarmService.createAlarm.mockImplementation(() =>
        mockOperation("create"),
      );
      mockAlarmService.deleteAlarm.mockImplementation(() =>
        mockOperation("delete"),
      );


      await act(async () => {
        // Rapid state changes
        for (let i = 0; i < 200; i++) {
          const operation = i % 3;
          switch (operation) {
            case 0:
              await result.current.createAlarm({
                name: `Rapid ${i}`,
                time: "07:00",
                enabled: true,
                repeatDays: [],
              });
              break;
            case 1:
              await result.current.updateAlarm("alarm-123", {
                name: `Updated ${i}`,
              });
              break;
            case 2:
              await result.current.deleteAlarm("alarm-123");
              break;
          }
        }
      });

      expect(operationCount).toBe(200);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Timezone and Time Edge Cases", () => {
    it("should handle timezone changes", async () => {
      // Service is now imported at the top

      // Mock timezone-aware scheduling
      mockScheduler.getNextOccurrence.mockImplementation((alarm) => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return new Date(Date.now() + 24 * 60 * 60 * 1000); // Next day
      });


      // Mock timezone change
      Object.defineProperty(Intl.DateTimeFormat.prototype, "resolvedOptions", {
        value: () => ({ timeZone: "America/Los_Angeles" }),
      });

      await act(async () => {
        await result.current.createAlarm({
          name: "Timezone Test",
          time: "07:00",
          enabled: true,
          repeatDays: [1, 2, 3, 4, 5],
        });
      });

      expect(result.current.error).not.toContain("timezone");
    });

    it("should handle daylight saving time transitions", async () => {
      // Service is now imported at the top

      // Mock DST transition
      const dstTransitionDate = new Date("2024-03-10T07:00:00"); // Spring forward
      mockScheduler.getNextOccurrence.mockReturnValue(dstTransitionDate);


      await act(async () => {
        await result.current.createAlarm({
          name: "DST Alarm",
          time: "02:30", // Time that doesn't exist during spring forward
          enabled: true,
          repeatDays: [0], // Sunday
        });
      });

      // Should handle DST transition gracefully
      expect(result.current.error).not.toContain("DST");
    });
  });

  describe("Regression Tests", () => {
    it("should preserve alarm order after bulk operations", async () => {
      // Service is now imported at the top
      const mockAlarmService = AlarmService.getInstance();

      const orderedAlarms = [
        { id: "alarm-1", name: "First", time: "06:00", enabled: true },
        { id: "alarm-2", name: "Second", time: "07:00", enabled: true },
        { id: "alarm-3", name: "Third", time: "08:00", enabled: true },
      ];

      mockAlarmService.getAllAlarms.mockResolvedValue(orderedAlarms);


      await act(async () => {
        await result.current.refreshAlarms();
      });

      // Verify order is preserved
      expect(result.current.alarms[0].name).toBe("First");
      expect(result.current.alarms[1].name).toBe("Second");
      expect(result.current.alarms[2].name).toBe("Third");
    });

    it("should handle alarm duplication with conflicting names", async () => {
      // Service is now imported at the top
      const mockAlarmService = AlarmService.getInstance();

      mockAlarmService.duplicateAlarm.mockResolvedValue({
        id: "alarm-duplicate",
        name: "Morning Alarm (Copy)",
        time: "07:00",
        enabled: true,
      });


      await act(async () => {
        await result.current.duplicateAlarm("alarm-1");
      });

      expect(result.current.error).toBeNull();
    });
  });
});
