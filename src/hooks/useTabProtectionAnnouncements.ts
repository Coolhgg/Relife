import { useEffect, useRef } from 'react';
import type { Alarm } from '../types';
import type { TabProtectionSettings } from '../types/tabProtection';
import { formatProtectionMessage, formatTimeframe } from '../types/tabProtection';
import AccessibilityUtils from '../utils/accessibility';

interface UseTabProtectionAnnouncementsProps {
  activeAlarm: Alarm | null;
  enabledAlarms: Alarm[];
  settings: TabProtectionSettings;
}

export const useTabProtectionAnnouncements = ({
  activeAlarm,
  enabledAlarms,
  settings
}: UseTabProtectionAnnouncementsProps) => {
  const previousActiveAlarm = useRef<Alarm | null>(null);
  const previousEnabledCount = useRef<number>(0);
  const lastAnnouncementTime = useRef<number>(0);

  // Announce when protection status changes
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastAnnouncement = now - lastAnnouncementTime.current;

    // Avoid too frequent announcements (minimum 5 seconds apart)
    if (timeSinceLastAnnouncement < 5000) {
      return;
    }

    // Announce when an alarm starts ringing
    if (activeAlarm && !previousActiveAlarm.current && settings.protectionTiming.activeAlarmWarning) {
      const message = formatProtectionMessage(
        settings.customMessages.accessibilityMessages.protectionActive,
        { reason: `alarm "${activeAlarm.label}" is ringing` }
      );
      AccessibilityUtils.createAriaAnnouncement(message, 'assertive');
      lastAnnouncementTime.current = now;
    }

    // Announce when alarm stops ringing
    else if (!activeAlarm && previousActiveAlarm.current) {
      const hasUpcomingAlarms = getUpcomingAlarmsCount(enabledAlarms, settings.protectionTiming.upcomingAlarmThreshold) > 0;

      if (hasUpcomingAlarms && settings.protectionTiming.upcomingAlarmWarning) {
        const message = formatProtectionMessage(
          settings.customMessages.accessibilityMessages.protectionActive,
          { reason: 'upcoming alarms' }
        );
        AccessibilityUtils.createAriaAnnouncement(
          `Alarm dismissed. ${message}`,
          'polite'
        );
      } else {
        AccessibilityUtils.createAriaAnnouncement(
          `Alarm dismissed. ${settings.customMessages.accessibilityMessages.protectionInactive}`,
          'polite'
        );
      }
      lastAnnouncementTime.current = now;
    }

    // Announce when enabled alarms count changes significantly
    else if (!activeAlarm && settings.protectionTiming.enabledAlarmWarning) {
      const currentEnabledCount = enabledAlarms.length;
      const upcomingCount = getUpcomingAlarmsCount(enabledAlarms, settings.protectionTiming.upcomingAlarmThreshold);

      if (currentEnabledCount !== previousEnabledCount.current) {
        if (currentEnabledCount > 0 && previousEnabledCount.current === 0) {
          const reason = upcomingCount > 0 ? 'upcoming alarms' : 'enabled alarms';
          const message = formatProtectionMessage(
            settings.customMessages.accessibilityMessages.protectionActive,
            { reason }
          );
          AccessibilityUtils.createAriaAnnouncement(
            `Alarm enabled. ${message}`,
            'polite'
          );
          lastAnnouncementTime.current = now;
        } else if (currentEnabledCount === 0 && previousEnabledCount.current > 0) {
          AccessibilityUtils.createAriaAnnouncement(
            `All alarms disabled. ${settings.customMessages.accessibilityMessages.protectionInactive}`,
            'polite'
          );
          lastAnnouncementTime.current = now;
        }
      }
    }

    // Update refs
    previousActiveAlarm.current = activeAlarm;
    previousEnabledCount.current = enabledAlarms.length;
  }, [activeAlarm, enabledAlarms, settings]);

  // Announce protection status on initial load
  useEffect(() => {
    if (!settings.enabled) return;

    // Small delay to ensure the app has loaded
    const timer = setTimeout(() => {
      if (activeAlarm && settings.protectionTiming.activeAlarmWarning) {
        const message = formatProtectionMessage(
          settings.customMessages.accessibilityMessages.protectionActive,
          { reason: `alarm "${activeAlarm.label}" is ringing` }
        );
        AccessibilityUtils.createAriaAnnouncement(message, 'polite');
      } else if (settings.protectionTiming.upcomingAlarmWarning) {
        const upcomingCount = getUpcomingAlarmsCount(enabledAlarms, settings.protectionTiming.upcomingAlarmThreshold);
        if (upcomingCount > 0) {
          const message = formatProtectionMessage(
            settings.customMessages.accessibilityMessages.protectionActive,
            {
              reason: `${upcomingCount} upcoming alarm${upcomingCount > 1 ? 's' : ''} within ${formatTimeframe(settings.protectionTiming.upcomingAlarmThreshold)}`
            }
          );
          AccessibilityUtils.createAriaAnnouncement(message, 'polite');
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [settings]); // Re-run when settings change

  const announceProtectionWarning = () => {
    if (activeAlarm && settings.protectionTiming.activeAlarmWarning) {
      AccessibilityUtils.createAriaAnnouncement(
        settings.customMessages.accessibilityMessages.alarmRingingWarning,
        'assertive'
      );
    } else if (settings.protectionTiming.upcomingAlarmWarning) {
      const upcomingCount = getUpcomingAlarmsCount(enabledAlarms, settings.protectionTiming.upcomingAlarmThreshold);
      if (upcomingCount > 0) {
        const message = formatProtectionMessage(
          settings.customMessages.accessibilityMessages.upcomingAlarmWarning,
          { count: upcomingCount }
        );
        AccessibilityUtils.createAriaAnnouncement(message, 'assertive');
      }
    }
  };

  return {
    announceProtectionWarning
  };
};

// Helper function to count upcoming alarms within the configurable threshold
function getUpcomingAlarmsCount(enabledAlarms: Alarm[], thresholdMinutes: number): number {
  const now = new Date();
  const thresholdFromNow = new Date(now.getTime() + thresholdMinutes * 60 * 1000);

  return enabledAlarms.filter(alarm => {
    const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Check if alarm is set for today
    if (!alarm.days.includes(today)) {
      return false;
    }

    // Parse alarm time
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const alarmTime = new Date(now);
    alarmTime.setHours(hours, minutes, 0, 0);

    // If alarm time has passed today, check if it's for tomorrow
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    return alarmTime <= thresholdFromNow;
  }).length;
}

export default useTabProtectionAnnouncements;