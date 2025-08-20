import { expect, test, jest } from "@jest/globals";
/**
 * Unit tests for useAlarmRingingAnnouncements hook
 * Tests alarm-specific screen reader announcements
 */

import { renderHook, act } from "@testing-library/react";
import { useAlarmRingingAnnouncements } from "../useAlarmRingingAnnouncements";

// Mock screen reader announcement service
const mockAnnouncementService = {
  announce: jest.fn(),
  announcePolite: jest.fn(),
  announceAssertive: jest.fn(),
  clearQueue: jest.fn(),
  setEnabled: jest.fn(),
  isEnabled: jest.fn(() => true),
};

// Mock accessibility service
jest.mock("../../services/accessibility-announcement", () => ({
  __esModule: true,
  default: {
    getInstance: () => mockAnnouncementService,
  },
}));

// Mock i18n hook
const mockT = jest.fn((key, options) => {
  const translations: Record<string, string> = {
    "alarm.ringing.announcement": "Alarm is ringing: {{alarmName}}",
    "alarm.snooze.announcement": "Alarm snoozed for {{minutes}} minutes",
    "alarm.dismiss.announcement": "Alarm dismissed",
    "alarm.volume.changed": "Volume changed to {{volume}}%",
    "alarm.sound.changed": "Alarm sound changed to {{soundName}}",
    "alarm.next.announcement": "Next alarm: {{time}}",
    "alarm.multiple.ringing": "{{count}} alarms are ringing",
    "alarm.smart.adjustment":
      "Smart alarm adjusted wake time by {{minutes}} minutes",
  };

  let translation = translations[key] || key;

  if (options) {
    Object.keys(options).forEach((optionKey) => {
      translation = translation.replace(`{{${optionKey}}}`, options[optionKey]);
    });
  }

  return translation;
});

jest.mock("../useI18n", () => ({
  useAlarmI18n: () => ({ t: mockT }),
}));

describe("useAlarmRingingAnnouncements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    expect(result.current.isEnabled).toBe(true);
    expect(typeof result.current.announceAlarmRinging).toBe("function");
    expect(typeof result.current.announceAlarmSnoozed).toBe("function");
    expect(typeof result.current.announceAlarmDismissed).toBe("function");
  });

  it("should announce alarm ringing with alarm name", async () => {
    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    await act(async () => {
      await result.current.announceAlarmRinging({
        id: "alarm-1",
        name: "Morning Alarm",
        time: "07:00",
      });
    });

    expect(mockT).toHaveBeenCalledWith("alarm.ringing.announcement", {
      alarmName: "Morning Alarm",
    });
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      "Alarm is ringing: Morning Alarm",
    );
  });

  it("should announce alarm snoozed with duration", async () => {
    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    await act(async () => {
      await result.current.announceAlarmSnoozed({
        alarmId: "alarm-1",
        snoozeMinutes: 10,
      });
    });

    expect(mockT).toHaveBeenCalledWith("alarm.snooze.announcement", {
      minutes: 10,
    });
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      "Alarm snoozed for 10 minutes",
    );
  });

  it("should announce alarm dismissed", async () => {
    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    await act(async () => {
      await result.current.announceAlarmDismissed({
        alarmId: "alarm-1",
      });
    });

    expect(mockT).toHaveBeenCalledWith("alarm.dismiss.announcement");
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      "Alarm dismissed",
    );
  });

  it("should announce volume changes", async () => {
    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    await act(async () => {
      await result.current.announceVolumeChange(75);
    });

    expect(mockT).toHaveBeenCalledWith("alarm.volume.changed", {
      volume: 75,
    });
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      "Volume changed to 75%",
    );
  });

  it("should announce sound changes", async () => {
    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    await act(async () => {
      await result.current.announceSoundChange("Gentle Wake");
    });

    expect(mockT).toHaveBeenCalledWith("alarm.sound.changed", {
      soundName: "Gentle Wake",
    });
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      "Alarm sound changed to Gentle Wake",
    );
  });

  it("should announce next alarm", async () => {
    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    await act(async () => {
      await result.current.announceNextAlarm("08:30 AM");
    });

    expect(mockT).toHaveBeenCalledWith("alarm.next.announcement", {
      time: "08:30 AM",
    });
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      "Next alarm: 08:30 AM",
    );
  });

  it("should handle multiple alarms ringing", async () => {
    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    const alarms = [
      { id: "alarm-1", name: "Morning Alarm", time: "07:00" },
      { id: "alarm-2", name: "Backup Alarm", time: "07:05" },
    ];

    await act(async () => {
      await result.current.announceMultipleAlarms(alarms);
    });

    expect(mockT).toHaveBeenCalledWith("alarm.multiple.ringing", {
      count: 2,
    });
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      "2 alarms are ringing",
    );
  });

  it("should announce smart alarm adjustments", async () => {
    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    await act(async () => {
      await result.current.announceSmartAdjustment({
        originalTime: "07:00",
        adjustedTime: "06:45",
        adjustmentMinutes: -15,
      });
    });

    expect(mockT).toHaveBeenCalledWith("alarm.smart.adjustment", {
      minutes: 15,
    });
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      "Smart alarm adjusted wake time by 15 minutes",
    );
  });

  it("should respect enabled/disabled state", async () => {
    mockAnnouncementService.isEnabled.mockReturnValue(false);

    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    expect(result.current.isEnabled).toBe(false);

    await act(async () => {
      await result.current.announceAlarmRinging({
        id: "alarm-1",
        name: "Morning Alarm",
        time: "07:00",
      });
    });

    // Should not announce when disabled
    expect(mockAnnouncementService.announceAssertive).not.toHaveBeenCalled();
  });

  it("should enable/disable announcements", async () => {
    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    await act(async () => {
      result.current.setEnabled(false);
    });

    expect(mockAnnouncementService.setEnabled).toHaveBeenCalledWith(false);

    await act(async () => {
      result.current.setEnabled(true);
    });

    expect(mockAnnouncementService.setEnabled).toHaveBeenCalledWith(true);
  });

  it("should clear announcement queue", async () => {
    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    await act(async () => {
      result.current.clearQueue();
    });

    expect(mockAnnouncementService.clearQueue).toHaveBeenCalledTimes(1);
  });

  it("should handle errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockAnnouncementService.announceAssertive.mockRejectedValue(
      new Error("Announcement failed"),
    );

    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    await act(async () => {
      await result.current.announceAlarmRinging({
        id: "alarm-1",
        name: "Morning Alarm",
        time: "07:00",
      });
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to announce alarm ringing:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it("should handle missing alarm names gracefully", async () => {
    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    await act(async () => {
      await result.current.announceAlarmRinging({
        id: "alarm-1",
        time: "07:00",
        // Missing name
      });
    });

    expect(mockT).toHaveBeenCalledWith("alarm.ringing.announcement", {
      alarmName: "Unnamed Alarm",
    });
  });

  it("should support custom announcement priorities", async () => {
    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    await act(async () => {
      await result.current.announceCustom("Custom message", "assertive");
    });

    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledWith(
      "Custom message",
    );

    await act(async () => {
      await result.current.announceCustom("Another message", "polite");
    });

    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledWith(
      "Another message",
    );
  });

  it("should batch multiple announcements properly", async () => {
    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    const announcements = [
      {
        type: "ringing",
        alarm: { id: "alarm-1", name: "Alarm 1", time: "07:00" },
      },
      { type: "volume", volume: 80 },
      { type: "sound", soundName: "Birds" },
    ];

    await act(async () => {
      await result.current.batchAnnounce(announcements);
    });

    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalledTimes(1);
    expect(mockAnnouncementService.announcePolite).toHaveBeenCalledTimes(2);
  });

  it("should handle internationalization edge cases", () => {
    // Test with missing translation
    mockT.mockReturnValueOnce("missing.key");

    const { result } = renderHook(() => useAlarmRingingAnnouncements());

    act(() => {
      result.current.announceAlarmRinging({
        id: "alarm-1",
        name: "Test",
        time: "07:00",
      });
    });

    // Should still work with fallback
    expect(mockAnnouncementService.announceAssertive).toHaveBeenCalled();
  });
});
