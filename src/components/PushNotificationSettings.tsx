import React, { useState, useCallback } from 'react';
import {
  Bell,
  BellOff,
  Settings,
  TestTube,
  Moon,
  Volume2,
  VolumeX,
  Smartphone,
  Alert,
  TrendingUp,
  Gift,
  Shield,
  Clock,
  Zap,
} from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import type { PushNotificationSettings } from '../services/push-notifications';

interface PushNotificationSettingsProps {
  className?: string;
  onClose?: () => void;
}

export const PushNotificationSettingsComponent: React.FC<
  PushNotificationSettingsProps
> = ({ className = '', onClose }) => {
  const {
    status,
    initialize,
    requestPermissions,
    updateSettings,
    testNotification,
    unregister,
  } = usePushNotifications();

  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const handleToggleEnabled = useCallback(
    async (enabled: boolean) => {
      if (enabled && !status.hasPermission) {
        await requestPermissions();
      } else {
        await updateSettings({ enabled });
      }
    },
    [status.hasPermission, requestPermissions, updateSettings]
  );

  const handleSettingChange = useCallback(
    async (key: keyof PushNotificationSettings, value: any) => {
      await updateSettings({ [key]: value });
    },
    [updateSettings]
  );

  const handleQuietHoursChange = useCallback(
    async (field: 'enabled' | 'start' | 'end', value: any) => {
      const quietHours = { ...status.settings.quietHours, [field]: value };
      await updateSettings({ quietHours });
    },
    [status.settings.quietHours, updateSettings]
  );

  const handleTestNotification = useCallback(async () => {
    setIsTestingNotification(true);
    try {
      await testNotification();
    } finally {
      setIsTestingNotification(false);
    }
  }, [testNotification]);

  const handleInitialize = useCallback(async () => {
    await initialize();
  }, [initialize]);

  if (!status.isSupported) {
    return (
      <div
        className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-start gap-3">
          <Alert className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
              Push Notifications Not Supported
            </h3>
            <p className="text-yellow-700 dark:text-yellow-400 text-sm">
              Push notifications are not supported on this device or browser. You can
              still receive local notifications for your alarms.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Push Notifications
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Stay connected with your alarms and progress
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close settings"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Status</h3>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    status.hasPermission ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {status.hasPermission ? 'Active' : 'Inactive'}
                </span>
                {status.isLoading && (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>
          </div>

          {status.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-800 dark:text-red-300 text-sm">{status.error}</p>
            </div>
          )}
        </div>

        {/* Main Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status.settings.enabled ? (
                <Bell className="w-5 h-5 text-blue-500" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <label className="font-medium text-gray-900 dark:text-white">
                  Enable Push Notifications
                </label>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Receive notifications even when the app is closed
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={status.settings.enabled}
                onChange={(e: any) => // auto: implicit any handleToggleEnabled(e.target.checked)}
                className="sr-only peer"
                disabled={status.isLoading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {!status.hasPermission && !status.settings.enabled && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                    Permission Required
                  </h4>
                  <p className="text-blue-700 dark:text-blue-400 text-sm mb-3">
                    Enable push notifications to receive alarm reminders and updates
                    even when the app is closed.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={
                        status.isInitialized ? requestPermissions : handleInitialize
                      }
                      disabled={status.isLoading}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-md transition-colors"
                    >
                      {status.isLoading ? 'Loading...' : 'Enable Notifications'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notification Types */}
        {status.settings.enabled && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Notification Types
            </h3>

            <div className="space-y-3">
              {/* Alarm Reminders */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <div>
                    <label className="font-medium text-gray-800 dark:text-gray-200">
                      Alarm Reminders
                    </label>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      Get notified before your scheduled alarms
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status.settings.alarmReminders}
                    onChange={(e: any) => // auto: implicit any
                      handleSettingChange('alarmReminders', e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Daily Motivation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <div>
                    <label className="font-medium text-gray-800 dark:text-gray-200">
                      Daily Motivation
                    </label>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      Receive inspirational messages daily
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status.settings.dailyMotivation}
                    onChange={(e: any) => // auto: implicit any
                      handleSettingChange('dailyMotivation', e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Weekly Progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <div>
                    <label className="font-medium text-gray-800 dark:text-gray-200">
                      Weekly Progress
                    </label>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      Get your weekly alarm statistics
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status.settings.weeklyProgress}
                    onChange={(e: any) => // auto: implicit any
                      handleSettingChange('weeklyProgress', e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* System Updates */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gift className="w-4 h-4 text-blue-500" />
                  <div>
                    <label className="font-medium text-gray-800 dark:text-gray-200">
                      System Updates
                    </label>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      New features and important updates
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status.settings.systemUpdates}
                    onChange={(e: any) => // auto: implicit any
                      handleSettingChange('systemUpdates', e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Emergency Alerts */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-red-500" />
                  <div>
                    <label className="font-medium text-gray-800 dark:text-gray-200">
                      Emergency Alerts
                    </label>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      Critical notifications and alerts
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status.settings.emergencyAlerts}
                    onChange={(e: any) => // auto: implicit any
                      handleSettingChange('emergencyAlerts', e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        {status.settings.enabled && (
          <div className="space-y-4">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
            >
              <Settings className="w-4 h-4" />
              Advanced Settings
              <span
                className={`transform transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`}
              >
                ▼
              </span>
            </button>

            {showAdvancedSettings && (
              <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                {/* Sound Settings */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {status.settings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-blue-500" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-gray-400" />
                    )}
                    <div>
                      <label className="font-medium text-gray-800 dark:text-gray-200">
                        Sound
                      </label>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        Play sound with notifications
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={status.settings.soundEnabled}
                      onChange={(e: any) => // auto: implicit any
                        handleSettingChange('soundEnabled', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Vibration Settings */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-purple-500" />
                    <div>
                      <label className="font-medium text-gray-800 dark:text-gray-200">
                        Vibration
                      </label>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        Vibrate on notifications
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={status.settings.vibrationEnabled}
                      onChange={(e: any) => // auto: implicit any
                        handleSettingChange('vibrationEnabled', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Badge Count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-orange-500" />
                    <div>
                      <label className="font-medium text-gray-800 dark:text-gray-200">
                        App Badge
                      </label>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        Show notification count on app icon
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={status.settings.badgeCount}
                      onChange={(e: any) => // auto: implicit any
                        handleSettingChange('badgeCount', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Quiet Hours */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Moon className="w-4 h-4 text-indigo-500" />
                      <div>
                        <label className="font-medium text-gray-800 dark:text-gray-200">
                          Quiet Hours
                        </label>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">
                          Pause non-essential notifications
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={status.settings.quietHours.enabled}
                        onChange={(e: any) => // auto: implicit any
                          handleQuietHoursChange('enabled', e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {status.settings.quietHours.enabled && (
                    <div className="flex items-center gap-3 pl-7">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          From
                        </label>
                        <input
                          type="time"
                          value={status.settings.quietHours.start}
                          onChange={(e: any) => // auto: implicit any
                            handleQuietHoursChange('start', e.target.value)
                          }
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          To
                        </label>
                        <input
                          type="time"
                          value={status.settings.quietHours.end}
                          onChange={(e: any) => // auto: implicit any handleQuietHoursChange('end', e.target.value)}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {status.settings.enabled && (
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleTestNotification}
              disabled={!status.hasPermission || isTestingNotification}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 text-blue-800 rounded-md transition-colors"
            >
              <TestTube className="w-4 h-4" />
              {isTestingNotification ? 'Sending...' : 'Test Notification'}
            </button>

            <button
              onClick={unregister}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 border border-gray-300 dark:border-gray-600 rounded-md transition-colors"
            >
              Disable All
            </button>
          </div>
        )}

        {/* Token Info (for debugging) */}
        {status.currentToken && process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
              Token: {status.currentToken.substring(0, 20)}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PushNotificationSettingsComponent;
