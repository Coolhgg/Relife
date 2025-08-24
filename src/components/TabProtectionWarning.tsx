import React, { useEffect, useState } from 'react';
import { Alert, Shield, Clock, Bell, X } from 'lucide-react';
import type { Alarm } from '../types';
import type { TabProtectionSettings } from '../types/tabProtection';
import { formatProtectionMessage, formatTimeframe } from '../types/tabProtection';
import { TimeoutHandle } from '../types/timers';

interface TabProtectionWarningProps {
  activeAlarm: Alarm | null;
  enabledAlarms: Alarm[];
  settings: TabProtectionSettings;
  className?: string;
}

export const TabProtectionWarning: React.FC<TabProtectionWarningProps> = ({
  activeAlarm,
  enabledAlarms,
  settings,
  className = '',
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [upcomingAlarms, setUpcomingAlarms] = useState<Alarm[]>([]);

  useEffect(() => {
    if (!settings.enabled || !settings.visualSettings.showVisualWarning) {
      setShowWarning(false);
      return;
    }

    // Check for upcoming alarms within the configured threshold
    const checkUpcomingAlarms = () => {
      const now = new Date();
      const thresholdFromNow = new Date(
        now.getTime() + settings.protectionTiming.upcomingAlarmThreshold * 60 * 1000
      );

      const upcoming = enabledAlarms.filter((alarm: any) => {
        // auto: implicit any
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
      });

      setUpcomingAlarms(upcoming);

      // Determine if warning should be shown based on settings
      const shouldShow =
        (settings.protectionTiming.activeAlarmWarning && activeAlarm) ||
        (settings.protectionTiming.upcomingAlarmWarning && upcoming.length > 0) ||
        (settings.protectionTiming.enabledAlarmWarning && enabledAlarms.length > 0);

      setShowWarning(shouldShow);
    };

    checkUpcomingAlarms();

    // Update every minute to keep upcoming alarms current
    const interval = setInterval(checkUpcomingAlarms, 60000);

    return () => clearInterval(interval);
  }, [activeAlarm, enabledAlarms, settings]);

  // Auto-hide functionality
  useEffect(() => {
    if (!showWarning || settings.visualSettings.autoHideDelay === 0) {
      return;
    }

    const timer = setTimeout(() => {
      setShowWarning(false);
    }, settings.visualSettings.autoHideDelay * 1000);

    return () => clearTimeout(timer);
  }, [showWarning, settings.visualSettings.autoHideDelay]);

  if (!showWarning) {
    return null;
  }

  const getWarningMessage = () => {
    if (activeAlarm && settings.protectionTiming.activeAlarmWarning) {
      return {
        icon: (
          <Bell className="w-5 h-5 text-red-500 animate-pulse" aria-hidden="true" />
        ),
        title: settings.customMessages.visualWarningTitle.activeAlarm,
        message: `"${activeAlarm.label}" is ringing. Closing this tab will stop the alarm.`,
        priority: 'high' as const,
      };
    }

    if (settings.protectionTiming.upcomingAlarmWarning && upcomingAlarms.length > 0) {
      const timeframe = formatTimeframe(
        settings.protectionTiming.upcomingAlarmThreshold
      );
      return {
        icon: <Clock className="w-5 h-5 text-amber-500" aria-hidden="true" />,
        title: settings.customMessages.visualWarningTitle.upcomingAlarm,
        message: `${upcomingAlarms.length} alarm${upcomingAlarms.length > 1 ? 's' : ''} will ring within ${timeframe}. Keep this tab open to ensure they work.`,
        priority: 'medium' as const,
      };
    }

    if (settings.protectionTiming.enabledAlarmWarning && enabledAlarms.length > 0) {
      return {
        icon: <Shield className="w-5 h-5 text-blue-500" aria-hidden="true" />,
        title: 'Alarm Protection Active',
        message: `${enabledAlarms.length} alarm${enabledAlarms.length > 1 ? 's are' : ' is'} enabled. Keep this tab open for reliable alarm functionality.`,
        priority: 'low' as const,
      };
    }

    return null;
  };

  const warningData = getWarningMessage();
  if (!warningData) return null;

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  const priorityStyles = {
    high: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    medium: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    low: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  };

  return (
    <div
      className={`fixed ${positionClasses[settings.visualSettings.position]} max-w-sm z-50 transition-all duration-300 ${className}`}
      role="alert"
      aria-live={warningData.priority === 'high' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div
        className={`
        ${priorityStyles[warningData.priority]}
        border rounded-lg p-4 shadow-lg backdrop-blur-sm
        transform transition-all duration-300 ease-in-out
      `}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Shield
              className="w-4 h-4 text-blue-600 dark:text-blue-400"
              aria-hidden="true"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {warningData.icon}
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {warningData.title}
              </h3>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300">
              {warningData.message}
            </p>

            {settings.visualSettings.showAlarmDetails && upcomingAlarms.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Next alarm{upcomingAlarms.length > 1 ? 's' : ''}:
                </p>
                <ul className="space-y-1">
                  {upcomingAlarms
                    .slice(0, settings.visualSettings.maxAlarmsShown)

                    .map((alarm: any) => (
                      <li
                        key={alarm.id}
                        className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"
                      >
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <span>
                          {alarm.time} - {alarm.label}
                        </span>
                      </li>
                    ))}
                  {upcomingAlarms.length > settings.visualSettings.maxAlarmsShown && (
                    <li className="text-xs text-gray-500 dark:text-gray-500">
                      +{upcomingAlarms.length - settings.visualSettings.maxAlarmsShown}{' '}
                      more...
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <Alert className="w-4 h-4 text-gray-500" aria-hidden="true" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Tab closure protection active
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowWarning(false)}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Dismiss protection warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabProtectionWarning;
