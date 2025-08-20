/**
 * Unit tests for useAdvancedAlarms hook
 * Tests advanced alarm scheduling, optimization, and management functionality
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useAdvancedAlarms } from "../useAdvancedAlarms";
import {
  renderHookWithProviders,
  createMockAlarm,
  clearAllMocks,
} from "../../__tests__/utils/hook-testing-utils";
import type { AdvancedAlarm } from "../../types/index";

// Mock services
jest.mock("../../services/alarm", () => ({
  AlarmService: {
    loadAlarms: jest.fn(),
    createAlarm: jest.fn(),
    updateAlarm: jest.fn(),
    deleteAlarm: jest.fn(),
  },
}));

jest.mock("../../services/advanced-alarm-scheduler", () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    applySmartOptimizations: jest.fn(),
    applySeasonalAdjustments: jest.fn(),
    calculateNextOccurrences: jest.fn(),
    evaluateConditionalRules: jest.fn(),
    evaluateLocationTriggers: jest.fn(),
    scheduleAdvancedAlarmNotifications: jest.fn(),
    cancelAdvancedAlarmNotifications: jest.fn(),
    exportSchedule: jest.fn(),
    importSchedule: jest.fn(),
    getStats: jest.fn(),
  },
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(navigator, "geolocation", {
  value: mockGeolocation,
  writable: true,
});

// Mock URL and blob for exports
Object.defineProperty(global, "URL", {
  value: {
    createObjectURL: jest.fn(() => "blob:url"),
    revokeObjectURL: jest.fn(),
  },
  writable: true,
});

describe("useAdvancedAlarms Hook", () => {
  const mockBasicAlarm = createMockAlarm();

  const mockAdvancedAlarm: AdvancedAlarm = {
    ...mockBasicAlarm,
    scheduleType: "daily",
    recurrencePattern: undefined,
    conditionalRules: [
      {
        id: "weather-rule",
        type: "weather",
        condition: "sunny",
        action: "enable",
        isActive: true,
      },
    ],
    locationTriggers: [
      {
        id: "home-trigger",
        name: "Home",
        latitude: 40.7128,
        longitude: -74.006,
        radius: 100,
        action: "enable",
        isActive: true,
      },
    ],
    calendarIntegration: {
      isEnabled: true,
      calendarId: "primary",
      syncMode: "read_only",
      respectBusyTime: true,
    },
    timeZone: "America/New_York",
    seasonalAdjustments: [
      {
        id: "winter-adjustment",
        season: "winter",
        timeOffset: 30,
        isActive: true,
      },
    ],
    smartOptimizations: [
      {
        id: "sleep-pattern",
        type: "sleep_pattern",
        isEnabled: true,
        settings: { analysisWeeks: 4 },
      },
    ],
    dependencies: [
      {
        alarmId: "dependent-alarm-id",
        type: "sequence",
        delay: 600,
      },
    ],
  };

  beforeEach(() => {
    clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Reset all mocks to default successful responses
    const { AlarmService } = require("../../services/alarm");
    const AdvancedAlarmScheduler =
      require("../../services/advanced-alarm-scheduler").default;

    AlarmService.loadAlarms.mockResolvedValue([mockBasicAlarm]);
    AlarmService.createAlarm.mockResolvedValue(mockBasicAlarm);
    AlarmService.updateAlarm.mockResolvedValue(mockBasicAlarm);
    AlarmService.deleteAlarm.mockResolvedValue(true);

    AdvancedAlarmScheduler.initialize.mockResolvedValue(true);
    AdvancedAlarmScheduler.applySmartOptimizations.mockImplementation((alarm) =>
      Promise.resolve(alarm),
    );
    AdvancedAlarmScheduler.applySeasonalAdjustments.mockImplementation(
      (alarm) => alarm,
    );
    AdvancedAlarmScheduler.calculateNextOccurrences.mockReturnValue([
      new Date(Date.now() + 24 * 60 * 60 * 1000),
    ]);
    AdvancedAlarmScheduler.evaluateConditionalRules.mockResolvedValue(true);
    AdvancedAlarmScheduler.evaluateLocationTriggers.mockResolvedValue(true);
    AdvancedAlarmScheduler.scheduleAdvancedAlarmNotifications.mockResolvedValue(
      true,
    );
    AdvancedAlarmScheduler.cancelAdvancedAlarmNotifications.mockResolvedValue(
      true,
    );
    AdvancedAlarmScheduler.exportSchedule.mockResolvedValue({
      alarms: [mockAdvancedAlarm],
    });
    AdvancedAlarmScheduler.importSchedule.mockResolvedValue({
      success: 1,
      failed: 0,
      errors: [],
    });
    AdvancedAlarmScheduler.getStats.mockReturnValue({
      totalAlarms: 1,
      activeAlarms: 1,
      scheduledNotifications: 5,
    });

    mockGeolocation.getCurrentPosition.mockImplementation((success) =>
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
        },
        timestamp: Date.now(),
      }),
    );

    // Mock DOM methods for export functionality
    document.createElement = jest.fn().mockImplementation((tag) => {
      if (tag === "a") {
        return {
          href: "",
          download: "",
          click: jest.fn(),
        };
      }
      return {};
    });
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      expect(result.current.alarms).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("should load alarms and initialize scheduler on mount", async () => {
      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.alarms).toHaveLength(1);
      expect(result.current.alarms[0]).toMatchObject({
        ...mockBasicAlarm,
        scheduleType: "daily",
        conditionalRules: [],
        locationTriggers: [],
        seasonalAdjustments: [],
        smartOptimizations: [],
        dependencies: [],
      });

      const AdvancedAlarmScheduler =
        require("../../services/advanced-alarm-scheduler").default;
      expect(AdvancedAlarmScheduler.initialize).toHaveBeenCalled();
    });

    it("should handle alarm loading errors", async () => {
      const { AlarmService } = require("../../services/alarm");
      AlarmService.loadAlarms.mockRejectedValue(new Error("Failed to load"));

      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Failed to load alarms");
      expect(result.current.alarms).toEqual([]);
    });

    it("should handle scheduler initialization errors", async () => {
      const AdvancedAlarmScheduler =
        require("../../services/advanced-alarm-scheduler").default;
      AdvancedAlarmScheduler.initialize.mockRejectedValue(
        new Error("Scheduler failed"),
      );

      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to initialize scheduler");
      });
    });
  });

  describe("Creating Alarms", () => {
    it("should create advanced alarm successfully", async () => {
      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newAlarmData = {
        userId: "test-user",
        time: "08:00",
        label: "New Advanced Alarm",
        days: [1, 2, 3, 4, 5],
        sound: "default-alarm.mp3",
        difficulty: "medium" as const,
        snoozeEnabled: true,
        snoozeInterval: 5,
        voiceMood: "motivational" as const,
        isActive: true,
        scheduleType: "weekly" as const,
        conditionalRules: mockAdvancedAlarm.conditionalRules,
        locationTriggers: mockAdvancedAlarm.locationTriggers,
        timeZone: "America/New_York",
      };

      let createdAlarm;
      await act(async () => {
        createdAlarm = await result.current.createAlarm(newAlarmData);
      });

      expect(createdAlarm).toBeDefined();
      expect(result.current.alarms).toHaveLength(2); // Original + new
      expect(result.current.error).toBeNull();

      const AdvancedAlarmScheduler =
        require("../../services/advanced-alarm-scheduler").default;
      expect(AdvancedAlarmScheduler.applySmartOptimizations).toHaveBeenCalled();
      expect(
        AdvancedAlarmScheduler.applySeasonalAdjustments,
      ).toHaveBeenCalled();
      expect(
        AdvancedAlarmScheduler.scheduleAdvancedAlarmNotifications,
      ).toHaveBeenCalled();
    });

    it("should handle alarm creation errors", async () => {
      const { AlarmService } = require("../../services/alarm");
      AlarmService.createAlarm.mockRejectedValue(new Error("Creation failed"));

      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newAlarmData = {
        userId: "test-user",
        time: "08:00",
        label: "Failed Alarm",
        days: [1, 2, 3, 4, 5],
        sound: "default-alarm.mp3",
        difficulty: "medium" as const,
        snoozeEnabled: true,
        snoozeInterval: 5,
        voiceMood: "motivational" as const,
        isActive: true,
        scheduleType: "daily" as const,
      };

      await expect(async () => {
        await act(async () => {
          await result.current.createAlarm(newAlarmData);
        });
      }).rejects.toThrow("Creation failed");

      expect(result.current.error).toBe("Failed to create alarm");
    });
  });

  describe("Updating Alarms", () => {
    it("should update alarm successfully", async () => {
      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updates = {
        label: "Updated Alarm",
        time: "09:00",
        conditionalRules: [
          {
            id: "new-rule",
            type: "weather" as const,
            condition: "rainy",
            action: "disable" as const,
            isActive: true,
          },
        ],
      };

      let updatedAlarm;
      await act(async () => {
        updatedAlarm = await result.current.updateAlarm(
          mockBasicAlarm.id,
          updates,
        );
      });

      expect(updatedAlarm).toBeDefined();
      expect(result.current.alarms[0].label).toBe("Updated Alarm");
      expect(result.current.error).toBeNull();

      const AdvancedAlarmScheduler =
        require("../../services/advanced-alarm-scheduler").default;
      expect(
        AdvancedAlarmScheduler.cancelAdvancedAlarmNotifications,
      ).toHaveBeenCalledWith(mockBasicAlarm.id);
      expect(
        AdvancedAlarmScheduler.scheduleAdvancedAlarmNotifications,
      ).toHaveBeenCalled();
    });

    it("should handle update of non-existent alarm", async () => {
      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.updateAlarm("non-existent-id", {
            label: "Test",
          });
        });
      }).rejects.toThrow("Alarm not found");

      expect(result.current.error).toBe("Failed to update alarm");
    });

    it("should handle alarm update errors", async () => {
      const { AlarmService } = require("../../services/alarm");
      AlarmService.updateAlarm.mockRejectedValue(new Error("Update failed"));

      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.updateAlarm(mockBasicAlarm.id, {
            label: "Test",
          });
        });
      }).rejects.toThrow("Update failed");

      expect(result.current.error).toBe("Failed to update alarm");
    });
  });

  describe("Deleting Alarms", () => {
    it("should delete alarm successfully", async () => {
      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteAlarm(mockBasicAlarm.id);
      });

      expect(result.current.alarms).toHaveLength(0);
      expect(result.current.error).toBeNull();

      const AdvancedAlarmScheduler =
        require("../../services/advanced-alarm-scheduler").default;
      expect(
        AdvancedAlarmScheduler.cancelAdvancedAlarmNotifications,
      ).toHaveBeenCalledWith(mockBasicAlarm.id);
    });

    it("should handle alarm deletion errors", async () => {
      const { AlarmService } = require("../../services/alarm");
      AlarmService.deleteAlarm.mockRejectedValue(new Error("Deletion failed"));

      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.deleteAlarm(mockBasicAlarm.id);
        });
      }).rejects.toThrow("Deletion failed");

      expect(result.current.error).toBe("Failed to delete alarm");
    });
  });

  describe("Alarm Duplication", () => {
    it("should duplicate alarm successfully", async () => {
      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let duplicatedAlarm;
      await act(async () => {
        duplicatedAlarm = await result.current.duplicateAlarm(
          mockBasicAlarm.id,
          {
            label: "Duplicated Alarm",
          },
        );
      });

      expect(duplicatedAlarm).toBeDefined();
      expect(duplicatedAlarm?.label).toBe("Duplicated Alarm");
      expect(result.current.alarms).toHaveLength(2);
    });

    it("should handle duplication of non-existent alarm", async () => {
      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.duplicateAlarm("non-existent-id");
        });
      }).rejects.toThrow("Alarm not found");

      expect(result.current.error).toBe("Failed to duplicate alarm");
    });

    it("should use default label when duplicating without modifications", async () => {
      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let duplicatedAlarm;
      await act(async () => {
        duplicatedAlarm = await result.current.duplicateAlarm(
          mockBasicAlarm.id,
        );
      });

      expect(duplicatedAlarm?.label).toBe(`${mockBasicAlarm.label} (Copy)`);
    });
  });

  describe("Bulk Operations", () => {
    it("should perform bulk update successfully", async () => {
      // Add multiple alarms first
      const { AlarmService } = require("../../services/alarm");
      const alarm2 = { ...mockBasicAlarm, id: "alarm-2" };
      const alarm3 = { ...mockBasicAlarm, id: "alarm-3" };
      AlarmService.loadAlarms.mockResolvedValue([
        mockBasicAlarm,
        alarm2,
        alarm3,
      ]);

      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updates = { isActive: false };
      let bulkResult;
      await act(async () => {
        bulkResult = await result.current.bulkUpdate(
          ["alarm-2", "alarm-3"],
          updates,
        );
      });

      expect(bulkResult).toEqual({
        success: 2,
        failed: 0,
        errors: [],
      });
      expect(result.current.error).toBeNull();
    });

    it("should handle partial failures in bulk update", async () => {
      const { AlarmService } = require("../../services/alarm");
      const alarm2 = { ...mockBasicAlarm, id: "alarm-2" };
      AlarmService.loadAlarms.mockResolvedValue([mockBasicAlarm, alarm2]);

      // Make update fail for one alarm
      AlarmService.updateAlarm.mockImplementation((id) => {
        if (id === "alarm-2") {
          return Promise.reject(new Error("Update failed for alarm-2"));
        }
        return Promise.resolve(mockBasicAlarm);
      });

      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updates = { isActive: false };
      let bulkResult;
      await act(async () => {
        bulkResult = await result.current.bulkUpdate(
          [mockBasicAlarm.id, "alarm-2"],
          updates,
        );
      });

      expect(bulkResult).toEqual({
        success: 1,
        failed: 1,
        errors: ["Failed to update alarm alarm-2: Update failed for alarm-2"],
      });
    });
  });

  describe("Next Occurrence Calculation", () => {
    it("should calculate next occurrence", async () => {
      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const nextOccurrence =
        result.current.getNextOccurrence(mockAdvancedAlarm);

      expect(nextOccurrence).toBeInstanceOf(Date);
      expect(nextOccurrence!.getTime()).toBeGreaterThan(Date.now());

      const AdvancedAlarmScheduler =
        require("../../services/advanced-alarm-scheduler").default;
      expect(
        AdvancedAlarmScheduler.calculateNextOccurrences,
      ).toHaveBeenCalledWith(mockAdvancedAlarm, expect.any(Date), 1);
    });

    it("should handle calculation errors", async () => {
      const AdvancedAlarmScheduler =
        require("../../services/advanced-alarm-scheduler").default;
      AdvancedAlarmScheduler.calculateNextOccurrences.mockImplementation(() => {
        throw new Error("Calculation failed");
      });

      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const nextOccurrence =
        result.current.getNextOccurrence(mockAdvancedAlarm);

      expect(nextOccurrence).toBeNull();
    });
  });

  describe("Import/Export", () => {
    it("should export alarms successfully", async () => {
      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let exportData;
      await act(async () => {
        exportData = await result.current.exportAlarms();
      });

      expect(exportData).toEqual({ alarms: [mockAdvancedAlarm] });

      // Verify download functionality was triggered
      expect(document.createElement).toHaveBeenCalledWith("a");
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });

    it("should handle export errors", async () => {
      const AdvancedAlarmScheduler =
        require("../../services/advanced-alarm-scheduler").default;
      AdvancedAlarmScheduler.exportSchedule.mockRejectedValue(
        new Error("Export failed"),
      );

      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.exportAlarms();
        });
      }).rejects.toThrow("Export failed");

      expect(result.current.error).toBe("Failed to export alarms");
    });

    it("should import alarms successfully", async () => {
      const mockFile = new File(
        [JSON.stringify({ alarms: [mockAdvancedAlarm] })],
        "test-alarms.json",
        { type: "application/json" },
      );

      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let importResult;
      await act(async () => {
        importResult = await result.current.importAlarms(mockFile);
      });

      expect(importResult).toEqual({
        success: 1,
        failed: 0,
        errors: [],
      });
      expect(result.current.error).toBeNull();

      const AdvancedAlarmScheduler =
        require("../../services/advanced-alarm-scheduler").default;
      expect(AdvancedAlarmScheduler.importSchedule).toHaveBeenCalledWith({
        source: "backup",
        data: { alarms: [mockAdvancedAlarm] },
        options: {
          overwriteExisting: false,
          preserveIds: false,
          adjustTimeZones: true,
          skipInvalid: true,
        },
      });
    });

    it("should handle import errors", async () => {
      const mockFile = new File(["invalid json"], "test-alarms.json", {
        type: "application/json",
      });

      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.importAlarms(mockFile);
        });
      }).rejects.toThrow();

      expect(result.current.error).toBe("Failed to import alarms");
    });
  });

  describe("Scheduling Features", () => {
    it("should handle conditional rules evaluation", async () => {
      const AdvancedAlarmScheduler =
        require("../../services/advanced-alarm-scheduler").default;
      AdvancedAlarmScheduler.evaluateConditionalRules.mockResolvedValue(false);

      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newAlarmData = {
        userId: "test-user",
        time: "08:00",
        label: "Conditional Alarm",
        days: [1, 2, 3, 4, 5],
        sound: "default-alarm.mp3",
        difficulty: "medium" as const,
        snoozeEnabled: true,
        snoozeInterval: 5,
        voiceMood: "motivational" as const,
        isActive: true,
        scheduleType: "daily" as const,
        conditionalRules: mockAdvancedAlarm.conditionalRules,
      };

      await act(async () => {
        await result.current.createAlarm(newAlarmData);
      });

      expect(
        AdvancedAlarmScheduler.evaluateConditionalRules,
      ).toHaveBeenCalled();
      // Should not schedule notifications if conditional rules fail
      expect(
        AdvancedAlarmScheduler.scheduleAdvancedAlarmNotifications,
      ).not.toHaveBeenCalled();
    });

    it("should handle location triggers", async () => {
      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newAlarmData = {
        userId: "test-user",
        time: "08:00",
        label: "Location Alarm",
        days: [1, 2, 3, 4, 5],
        sound: "default-alarm.mp3",
        difficulty: "medium" as const,
        snoozeEnabled: true,
        snoozeInterval: 5,
        voiceMood: "motivational" as const,
        isActive: true,
        scheduleType: "daily" as const,
        locationTriggers: mockAdvancedAlarm.locationTriggers,
      };

      await act(async () => {
        await result.current.createAlarm(newAlarmData);
      });

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();

      const AdvancedAlarmScheduler =
        require("../../services/advanced-alarm-scheduler").default;
      expect(
        AdvancedAlarmScheduler.evaluateLocationTriggers,
      ).toHaveBeenCalled();
    });

    it("should handle geolocation errors gracefully", async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) =>
        error(new Error("Geolocation failed")),
      );

      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newAlarmData = {
        userId: "test-user",
        time: "08:00",
        label: "Location Alarm",
        days: [1, 2, 3, 4, 5],
        sound: "default-alarm.mp3",
        difficulty: "medium" as const,
        snoozeEnabled: true,
        snoozeInterval: 5,
        voiceMood: "motivational" as const,
        isActive: true,
        scheduleType: "daily" as const,
        locationTriggers: mockAdvancedAlarm.locationTriggers,
      };

      await act(async () => {
        await result.current.createAlarm(newAlarmData);
      });

      // Should continue with scheduling even if geolocation fails
      const AdvancedAlarmScheduler =
        require("../../services/advanced-alarm-scheduler").default;
      expect(
        AdvancedAlarmScheduler.scheduleAdvancedAlarmNotifications,
      ).toHaveBeenCalled();
    });
  });

  describe("Statistics", () => {
    it("should get scheduling statistics", async () => {
      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const stats = result.current.getSchedulingStats();

      expect(stats).toEqual({
        totalAlarms: 1,
        activeAlarms: 1,
        scheduledNotifications: 5,
      });

      const AdvancedAlarmScheduler =
        require("../../services/advanced-alarm-scheduler").default;
      expect(AdvancedAlarmScheduler.getStats).toHaveBeenCalled();
    });

    it("should handle statistics errors", async () => {
      const AdvancedAlarmScheduler =
        require("../../services/advanced-alarm-scheduler").default;
      AdvancedAlarmScheduler.getStats.mockImplementation(() => {
        throw new Error("Stats failed");
      });

      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const stats = result.current.getSchedulingStats();

      expect(stats).toBeNull();
    });
  });

  describe("Refresh Functionality", () => {
    it("should refresh alarms manually", async () => {
      const { result } = renderHookWithProviders(() => useAdvancedAlarms());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const { AlarmService } = require("../../services/alarm");
      AlarmService.loadAlarms.mockClear();

      await act(async () => {
        await result.current.refresh();
      });

      expect(AlarmService.loadAlarms).toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });
  });
});
