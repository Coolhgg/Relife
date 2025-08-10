import { useState } from 'react';
import { Moon, Sun, Bell, Smartphone, Volume2, Shield, Info, ExternalLink } from 'lucide-react';
import type { AppState, VoiceMood } from '../types';
import { VOICE_MOODS } from '../utils';

interface SettingsPageProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  onTestVoice?: (mood: VoiceMood) => Promise<void>;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ appState }) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    // In a real app, this would update the theme
    console.log('Theme changed to:', theme);
  };

  const handleDefaultVoiceMoodChange = (mood: VoiceMood) => {
    console.log('Default voice mood changed to:', mood);
  };

  const renderPermissionStatus = (granted: boolean, label: string) => (
    <div className={`flex items-center gap-2 text-sm ${
      granted ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        granted ? 'bg-green-500' : 'bg-red-500'
      }`} />
      <span>{granted ? `${label} granted` : `${label} denied`}</span>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        Settings
      </h2>

      {/* App Permissions */}
      <div className="alarm-card">
        <button
          onClick={() => toggleSection('permissions')}
          className="w-full flex items-center justify-between p-1"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-gray-900 dark:text-white">Permissions</span>
          </div>
        </button>
        
        {activeSection === 'permissions' && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-3">
            {renderPermissionStatus(appState.permissions.notifications.granted, 'Notifications')}
            {renderPermissionStatus(appState.permissions.microphone.granted, 'Microphone')}
            
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              If permissions are denied, some features may not work properly. You can enable them in your device settings.
            </div>
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="alarm-card">
        <button
          onClick={() => toggleSection('appearance')}
          className="w-full flex items-center justify-between p-1"
        >
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="font-medium text-gray-900 dark:text-white">Appearance</span>
          </div>
        </button>
        
        {activeSection === 'appearance' && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['light', 'dark', 'auto'].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme as 'light' | 'dark' | 'auto')}
                    className="alarm-button alarm-button-secondary py-2 text-sm capitalize"
                  >
                    {theme === 'light' && <Sun className="w-4 h-4 mr-1" />}
                    {theme === 'dark' && <Moon className="w-4 h-4 mr-1" />}
                    {theme === 'auto' && <Smartphone className="w-4 h-4 mr-1" />}
                    {theme}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voice Settings */}
      <div className="alarm-card">
        <button
          onClick={() => toggleSection('voice')}
          className="w-full flex items-center justify-between p-1"
        >
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-gray-900 dark:text-white">Voice Settings</span>
          </div>
        </button>
        
        {activeSection === 'voice' && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                Default Voice Mood
              </label>
              <div className="grid grid-cols-2 gap-2">
                {VOICE_MOODS.slice(0, 4).map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => handleDefaultVoiceMoodChange(mood.id)}
                    className="alarm-button alarm-button-secondary p-3 text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{mood.icon}</span>
                      <span className="text-sm font-medium">{mood.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {mood.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Voice Dismissal Sensitivity
              </label>
              <input
                type="range"
                min="1"
                max="10"
                defaultValue="5"
                className="w-full h-2 bg-gray-200 dark:bg-dark-300 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="alarm-card">
        <button
          onClick={() => toggleSection('notifications')}
          className="w-full flex items-center justify-between p-1"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-gray-900 dark:text-white">Notifications</span>
          </div>
        </button>
        
        {activeSection === 'notifications' && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Push Notifications</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Receive alarm notifications</div>
              </div>
              <button className="alarm-toggle alarm-toggle-checked">
                <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Haptic Feedback</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Vibrate on interactions</div>
              </div>
              <button className="alarm-toggle alarm-toggle-checked">
                <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5" />
              </button>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Snooze Duration (minutes)
              </label>
              <select className="alarm-input">
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Maximum Snoozes
              </label>
              <select className="alarm-input">
                <option value="3">3 times</option>
                <option value="5">5 times</option>
                <option value="10">10 times</option>
                <option value="-1">Unlimited</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* About */}
      <div className="alarm-card">
        <button
          onClick={() => toggleSection('about')}
          className="w-full flex items-center justify-between p-1"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">About</span>
          </div>
        </button>
        
        {activeSection === 'about' && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Smart Alarm
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Version 1.0.0
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                Wake up with personalized voice messages and intelligent features.
              </div>
            </div>
            
            <div className="space-y-3">
              <button className="alarm-button alarm-button-secondary w-full flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Privacy Policy
              </button>
              
              <button className="alarm-button alarm-button-secondary w-full flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Terms of Service
              </button>
              
              <button className="alarm-button alarm-button-secondary w-full flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Contact Support
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-6">
        Made with ❤️ for better mornings
      </div>
    </div>
  );
};

export default SettingsPage;