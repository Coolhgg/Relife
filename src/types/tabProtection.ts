export interface TabProtectionSettings {
  enabled: boolean;
  protectionTiming: {
    activeAlarmWarning: boolean; // Always warn for active/ringing alarms
    upcomingAlarmWarning: boolean; // Warn for upcoming alarms
    upcomingAlarmThreshold: number; // Minutes before alarm to start warning (default: 60)
    enabledAlarmWarning: boolean; // Warn when any alarms are enabled
  };
  customMessages: {
    activeAlarmMessage: string;
    upcomingAlarmMessage: string;
    enabledAlarmMessage: string;
    visualWarningTitle: {
      activeAlarm: string;
      upcomingAlarm: string;
    };
    accessibilityMessages: {
      protectionActive: string;
      protectionInactive: string;
      alarmRingingWarning: string;
      upcomingAlarmWarning: string;
    };
  };
  visualSettings: {
    showVisualWarning: boolean;
    autoHideDelay: number; // seconds, 0 = never auto-hide
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
    showAlarmDetails: boolean; // Show upcoming alarm list
    maxAlarmsShown: number; // Max number of upcoming alarms to show
  };
}

export const DEFAULT_TAB_PROTECTION_SETTINGS: TabProtectionSettings = {
  enabled: true,
  protectionTiming: {
    activeAlarmWarning: true,
    upcomingAlarmWarning: true,
    upcomingAlarmThreshold: 60, // 1 hour
    enabledAlarmWarning: false, // Don't warn just because alarms exist
  },
  customMessages: {
    activeAlarmMessage: "An alarm is currently ringing! Are you sure you want to close this tab?",
    upcomingAlarmMessage: "You have {count} alarm{plural} set to ring within {timeframe}. Are you sure you want to close this tab?",
    enabledAlarmMessage: "You have {count} enabled alarm{plural}. Closing this tab may prevent them from working properly. Continue?",
    visualWarningTitle: {
      activeAlarm: "Alarm Currently Ringing!",
      upcomingAlarm: "Upcoming Alarms",
    },
    accessibilityMessages: {
      protectionActive: "Tab closure protection is active due to {reason}.",
      protectionInactive: "Tab closure protection is inactive.",
      alarmRingingWarning: "Warning: Closing this tab will stop the currently ringing alarm.",
      upcomingAlarmWarning: "Warning: You have {count} upcoming alarm{plural}. Closing this tab may prevent them from ringing.",
    },
  },
  visualSettings: {
    showVisualWarning: true,
    autoHideDelay: 0, // Never auto-hide by default
    position: 'top-right',
    showAlarmDetails: true,
    maxAlarmsShown: 3,
  },
};

// Message template helpers
export const formatProtectionMessage = (
  template: string,
  variables: {
    count?: number;
    timeframe?: string;
    reason?: string;
    alarmName?: string;
  }
): string => {
  let message = template;

  if (variables.count !== undefined) {
    message = message.replace('{count}', variables.count.toString());
    message = message.replace('{plural}', variables.count === 1 ? '' : 's');
  }

  if (variables.timeframe) {
    message = message.replace('{timeframe}', variables.timeframe);
  }

  if (variables.reason) {
    message = message.replace('{reason}', variables.reason);
  }

  if (variables.alarmName) {
    message = message.replace('{alarmName}', variables.alarmName);
  }

  return message;
};

// Settings persistence helpers
export const getTabProtectionSettings = (): TabProtectionSettings => {
  try {
    const stored = localStorage.getItem('tabProtectionSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new settings added in updates
      return {
        ...DEFAULT_TAB_PROTECTION_SETTINGS,
        ...parsed,
        protectionTiming: {
          ...DEFAULT_TAB_PROTECTION_SETTINGS.protectionTiming,
          ...parsed.protectionTiming,
        },
        customMessages: {
          ...DEFAULT_TAB_PROTECTION_SETTINGS.customMessages,
          ...parsed.customMessages,
          visualWarningTitle: {
            ...DEFAULT_TAB_PROTECTION_SETTINGS.customMessages.visualWarningTitle,
            ...parsed.customMessages?.visualWarningTitle,
          },
          accessibilityMessages: {
            ...DEFAULT_TAB_PROTECTION_SETTINGS.customMessages.accessibilityMessages,
            ...parsed.customMessages?.accessibilityMessages,
          },
        },
        visualSettings: {
          ...DEFAULT_TAB_PROTECTION_SETTINGS.visualSettings,
          ...parsed.visualSettings,
        },
      };
    }
  } catch (error) {
    console.warn('Failed to load tab protection settings:', error);
  }

  return DEFAULT_TAB_PROTECTION_SETTINGS;
};

export const saveTabProtectionSettings = (settings: TabProtectionSettings): void => {
  try {
    localStorage.setItem('tabProtectionSettings', JSON.stringify(settings));

    // Dispatch custom event for cross-tab synchronization
    window.dispatchEvent(new CustomEvent('tabProtectionSettingsChanged', {
      detail: settings
    }));
  } catch (error) {
    console.error('Failed to save tab protection settings:', error);
  }
};

// Time formatting helper
export const formatTimeframe = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  } else if (minutes < 1440) { // Less than 24 hours
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    } else {
      return `${hours} hour${hours === 1 ? '' : 's'} and ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
    }
  } else {
    const days = Math.floor(minutes / 1440);
    return `${days} day${days === 1 ? '' : 's'}`;
  }
};