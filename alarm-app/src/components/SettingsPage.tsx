import { useState } from 'react';
import { Moon, Sun, Bell, Smartphone, Volume2, Shield, Info, ExternalLink, LogOut } from 'lucide-react';
import type { AppState, VoiceMood } from '../types';
import { VOICE_MOODS } from '../utils';
import UserProfile from './UserProfile';

interface SettingsPageProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  onTestVoice?: (mood: VoiceMood) => Promise<void>;
  onUpdateProfile?: (updates: any) => Promise<void>;
  onSignOut?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  appState, 
  onUpdateProfile, 
  onSignOut, 
  isLoading = false, 
  error = null 
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleKeyDown = (e: React.KeyboardEvent, section: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSection(section);
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    // In a real app, this would update the theme
    console.log('Theme changed to:', theme);
  };

  const handleDefaultVoiceMoodChange = (mood: VoiceMood) => {
    console.log('Default voice mood changed to:', mood);
  };

  const renderPermissionStatus = (granted: boolean, label: string) => (
    <div 
      className={`flex items-center gap-2 text-sm ${
        granted ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }`}
      role="status"
      aria-label={`${label} permission is ${granted ? 'granted' : 'denied'}`}
    >
      <div 
        className={`w-2 h-2 rounded-full ${
          granted ? 'bg-green-500' : 'bg-red-500'
        }`}
        role="img"
        aria-label={granted ? 'Permission granted' : 'Permission denied'}
      />
      <span>{granted ? `${label} granted` : `${label} denied`}</span>
    </div>
  );

  return (
    <main className="p-4 space-y-4" role="main" aria-labelledby="settings-heading">
      <h1 id="settings-heading" className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        Settings
      </h1>

      {/* User Profile Section */}
      {appState.user && (
        <section className="mb-6">
          <UserProfile
            user={appState.user}
            onUpdateProfile={onUpdateProfile || (() => Promise.resolve())}
            onSignOut={onSignOut || (() => {})}
            isLoading={isLoading}
            error={error}
          />
        </section>
      )}

      {/* App Permissions */}
      <section className="alarm-card">
        <button
          onClick={() => toggleSection('permissions')}
          onKeyDown={(e) => handleKeyDown(e, 'permissions')}
          className="w-full flex items-center justify-between p-1"
          aria-expanded={activeSection === 'permissions'}
          aria-controls="permissions-content"
          aria-labelledby="permissions-heading"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span id="permissions-heading" className="font-medium text-gray-900 dark:text-white">Permissions</span>
          </div>
        </button>
        
        {activeSection === 'permissions' && (
          <div 
            id="permissions-content"
            className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-3"
            role="region"
            aria-labelledby="permissions-heading"
          >
            {renderPermissionStatus(appState.permissions.notifications.granted, 'Notifications')}
            {renderPermissionStatus(appState.permissions.microphone.granted, 'Microphone')}
            
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-3" role="note">
              If permissions are denied, some features may not work properly. You can enable them in your device settings.
            </div>
          </div>
        )}
      </div>

      </section>

      {/* Appearance */}
      <section className="alarm-card">
        <button
          onClick={() => toggleSection('appearance')}
          onKeyDown={(e) => handleKeyDown(e, 'appearance')}
          className="w-full flex items-center justify-between p-1"
          aria-expanded={activeSection === 'appearance'}
          aria-controls="appearance-content"
          aria-labelledby="appearance-heading"
        >
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
            <span id="appearance-heading" className="font-medium text-gray-900 dark:text-white">Appearance</span>
          </div>
        </button>
        
        {activeSection === 'appearance' && (
          <div 
            id="appearance-content"
            className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-4"
            role="region"
            aria-labelledby="appearance-heading"
          >
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Theme
              </legend>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme selection">
                {['light', 'dark', 'auto'].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme as 'light' | 'dark' | 'auto')}
                    className="alarm-button alarm-button-secondary py-2 text-sm capitalize"
                    role="radio"
                    aria-checked={theme === 'auto'} // Default assumption, should be connected to actual state
                    aria-label={`${theme} theme`}
                  >
                    {theme === 'light' && <Sun className="w-4 h-4 mr-1" aria-hidden="true" />}
                    {theme === 'dark' && <Moon className="w-4 h-4 mr-1" aria-hidden="true" />}
                    {theme === 'auto' && <Smartphone className="w-4 h-4 mr-1" aria-hidden="true" />}
                    {theme}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )}
      </div>

      </section>

      {/* Voice Settings */}
      <section className="alarm-card">
        <button
          onClick={() => toggleSection('voice')}
          onKeyDown={(e) => handleKeyDown(e, 'voice')}
          className="w-full flex items-center justify-between p-1"
          aria-expanded={activeSection === 'voice'}
          aria-controls="voice-content"
          aria-labelledby="voice-heading"
        >
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            <span id="voice-heading" className="font-medium text-gray-900 dark:text-white">Voice Settings</span>
          </div>
        </button>
        
        {activeSection === 'voice' && (
          <div 
            id="voice-content"
            className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-4"
            role="region"
            aria-labelledby="voice-heading"
          >
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                Default Voice Mood
              </legend>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Default voice mood selection">
                {VOICE_MOODS.slice(0, 4).map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => handleDefaultVoiceMoodChange(mood.id)}
                    className="alarm-button alarm-button-secondary p-3 text-left"
                    role="radio"
                    aria-checked={mood.id === 'motivational'} // Default assumption, should connect to actual state
                    aria-label={`${mood.name}: ${mood.description}`}
                    aria-describedby={`mood-${mood.id}-desc`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span aria-hidden="true">{mood.icon}</span>
                      <span className="text-sm font-medium">{mood.name}</span>
                    </div>
                    <div id={`mood-${mood.id}-desc`} className="text-xs text-gray-500 dark:text-gray-400">
                      {mood.description}
                    </div>
                  </button>
                ))}
              </div>
            </fieldset>
            
            <div>
              <label 
                htmlFor="voice-sensitivity"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
              >
                Voice Dismissal Sensitivity
              </label>
              <input
                id="voice-sensitivity"
                type="range"
                min="1"
                max="10"
                defaultValue="5"
                className="w-full h-2 bg-gray-200 dark:bg-dark-300 rounded-lg appearance-none cursor-pointer"
                aria-describedby="sensitivity-help"
                aria-valuemin={1}
                aria-valuemax={10}
                aria-valuenow={5}
                aria-valuetext="Medium sensitivity"
              />
              <div id="sensitivity-help" className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        )}
      </div>

      </section>

      {/* Notification Settings */}
      <section className="alarm-card">
        <button
          onClick={() => toggleSection('notifications')}
          onKeyDown={(e) => handleKeyDown(e, 'notifications')}
          className="w-full flex items-center justify-between p-1"
          aria-expanded={activeSection === 'notifications'}
          aria-controls="notifications-content"
          aria-labelledby="notifications-heading"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            <span id="notifications-heading" className="font-medium text-gray-900 dark:text-white">Notifications</span>
          </div>
        </button>
        
        {activeSection === 'notifications' && (
          <div 
            id="notifications-content"
            className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-4"
            role="region"
            aria-labelledby="notifications-heading"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Push Notifications</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Receive alarm notifications</div>
              </div>
              <button 
                className="alarm-toggle alarm-toggle-checked"
                role="switch"
                aria-checked="true"
                aria-label="Push notifications enabled"
                aria-describedby="push-notif-desc"
              >
                <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5" aria-hidden="true" />
                <span id="push-notif-desc" className="sr-only">Toggle push notifications on or off</span>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Haptic Feedback</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Vibrate on interactions</div>
              </div>
              <button 
                className="alarm-toggle alarm-toggle-checked"
                role="switch"
                aria-checked="true"
                aria-label="Haptic feedback enabled"
                aria-describedby="haptic-desc"
              >
                <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5" aria-hidden="true" />
                <span id="haptic-desc" className="sr-only">Toggle haptic feedback on or off</span>
              </button>
            </div>
            
            <div>
              <label 
                htmlFor="snooze-duration"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
              >
                Snooze Duration (minutes)
              </label>
              <select id="snooze-duration" className="alarm-input" aria-describedby="snooze-duration-desc">
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
              </select>
              <div id="snooze-duration-desc" className="sr-only">How long to snooze alarms when snooze button is pressed</div>
            </div>
            
            <div>
              <label 
                htmlFor="max-snoozes"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
              >
                Maximum Snoozes
              </label>
              <select id="max-snoozes" className="alarm-input" aria-describedby="max-snoozes-desc">
                <option value="3">3 times</option>
                <option value="5">5 times</option>
                <option value="10">10 times</option>
                <option value="-1">Unlimited</option>
              </select>
              <div id="max-snoozes-desc" className="sr-only">Maximum number of times an alarm can be snoozed before it stops</div>
            </div>
          </div>
        )}
      </div>

      </section>

      {/* About */}
      <section className="alarm-card">
        <button
          onClick={() => toggleSection('about')}
          onKeyDown={(e) => handleKeyDown(e, 'about')}
          className="w-full flex items-center justify-between p-1"
          aria-expanded={activeSection === 'about'}
          aria-controls="about-content"
          aria-labelledby="about-heading"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            <span id="about-heading" className="font-medium text-gray-900 dark:text-white">About</span>
          </div>
        </button>
        
        {activeSection === 'about' && (
          <div 
            id="about-content"
            className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-300 space-y-4"
            role="region"
            aria-labelledby="about-heading"
          >
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
            
            <nav className="space-y-3" role="navigation" aria-label="App information links">
              <button 
                className="alarm-button alarm-button-secondary w-full flex items-center justify-center gap-2"
                aria-label="Open privacy policy in new window"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                Privacy Policy
              </button>
              
              <button 
                className="alarm-button alarm-button-secondary w-full flex items-center justify-center gap-2"
                aria-label="Open terms of service in new window"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                Terms of Service
              </button>
              
              <button 
                className="alarm-button alarm-button-secondary w-full flex items-center justify-center gap-2"
                aria-label="Contact support team"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                Contact Support
              </button>
            </nav>
          </div>
        )}
      </div>

      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 dark:text-gray-400 pt-6" role="contentinfo">
        Made with ❤️ for better mornings
      </footer>
    </main>
  );
};

export default SettingsPage;