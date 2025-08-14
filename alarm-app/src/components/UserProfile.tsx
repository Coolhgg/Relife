import { useState } from 'react';
import { User, Mail, Settings, Shield, Bell, Mic, Palette, Clock, Save, X, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import type { User as AppUser, VoiceMood } from '../types';

interface UserProfileProps {
  user: AppUser;
  onUpdateProfile: (updates: Partial<AppUser>) => Promise<void>;
  onSignOut: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function UserProfile({ 
  user, 
  onUpdateProfile, 
  onSignOut, 
  isLoading, 
  error 
}: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name || '',
    preferences: { ...user.preferences }
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    if (field === 'name') {
      setEditForm(prev => ({ ...prev, name: value }));
    } else {
      setEditForm(prev => ({
        ...prev,
        preferences: { ...prev.preferences, [field]: value }
      }));
    }
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    try {
      await onUpdateProfile({
        name: editForm.name,
        preferences: editForm.preferences
      });
      setIsEditing(false);
      setHasChanges(false);
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: user.name || '',
      preferences: { ...user.preferences }
    });
    setIsEditing(false);
    setHasChanges(false);
    setSaveSuccess(false);
  };

  const voiceMoodOptions: { value: VoiceMood; label: string; description: string }[] = [
    { value: 'motivational', label: 'Motivational', description: 'Encouraging and uplifting' },
    { value: 'gentle', label: 'Gentle', description: 'Soft and calming' },
    { value: 'drill-sergeant', label: 'Drill Sergeant', description: 'Intense and commanding' },
    { value: 'sweet-angel', label: 'Sweet Angel', description: 'Kind and nurturing' },
    { value: 'anime-hero', label: 'Anime Hero', description: 'Energetic and heroic' },
    { value: 'savage-roast', label: 'Savage Roast', description: 'Humorous and teasing' }
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Success Message */}
      {saveSuccess && (
        <div 
          className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            <p className="text-green-800 dark:text-green-200 font-medium">
              Profile updated successfully!
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div 
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200 mb-1">
                Profile Update Failed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            </div>
            <div>
              <div>
                {isEditing ? (
                  <div className="space-y-1">
                    <label htmlFor="user-name-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    <input
                      id="user-name-input"
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="bg-gray-50 dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-1 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter your name"
                      aria-describedby="user-name-help"
                      required
                    />
                    <div id="user-name-help" className="text-xs text-gray-500 dark:text-gray-400">
                      This name will be displayed in your profile
                    </div>
                  </div>
                ) : (
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.name || 'User'}
                  </h2>
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm">{user.email}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                  aria-label="Cancel editing"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isLoading}
                  className="alarm-button alarm-button-primary p-2 disabled:opacity-50"
                  aria-label="Save profile changes"
                >
                  <Save className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="alarm-button alarm-button-secondary"
                aria-label="Edit profile"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Shield className="w-4 h-4" aria-hidden="true" />
            <span>Member since {user.createdAt.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>ID: {user.id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" aria-hidden="true" />
          App Preferences
        </h3>

        <div className="space-y-6">
          {/* Theme Preference */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Palette className="w-4 h-4 inline mr-2" aria-hidden="true" />
              Theme Preference
            </legend>
            <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-labelledby="theme-legend" aria-describedby="theme-help">
              {['light', 'dark', 'auto'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => isEditing && handleInputChange('theme', theme)}
                  disabled={!isEditing}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    (isEditing ? editForm.preferences.theme : user.preferences.theme) === theme
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-dark-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-dark-500'
                  } ${!isEditing ? 'cursor-default' : ''}`}
                  role="radio"
                  aria-checked={(isEditing ? editForm.preferences.theme : user.preferences.theme) === theme}
                  aria-label={`Set theme to ${theme} mode`}
                  aria-describedby={`theme-${theme}-desc`}
                >
                  {theme}
                  <span id={`theme-${theme}-desc`} className="sr-only">
                    {theme === 'light' ? 'Use light theme always' : 
                     theme === 'dark' ? 'Use dark theme always' : 
                     'Automatically switch between light and dark based on system settings'}
                  </span>
                </button>
              ))}
            </div>
            <div id="theme-help" className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Choose your preferred color scheme for the app interface
            </div>
          </fieldset>

          {/* Default Voice Mood */}
          <div>
            <label htmlFor="default-voice-mood" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Mic className="w-4 h-4 inline mr-2" aria-hidden="true" />
              Default Voice Mood
            </label>
            <select
              id="default-voice-mood"
              value={isEditing ? editForm.preferences.defaultVoiceMood : user.preferences.defaultVoiceMood}
              onChange={(e) => isEditing && handleInputChange('defaultVoiceMood', e.target.value)}
              disabled={!isEditing}
              className="w-full p-3 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
              aria-describedby="voice-mood-help"
              required
            >
              {voiceMoodOptions.map((mood) => (
                <option key={mood.value} value={mood.value}>
                  {mood.label} - {mood.description}
                </option>
              ))}
            </select>
            <div id="voice-mood-help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This voice mood will be used for new alarms by default
            </div>
          </div>

          {/* Notifications Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Bell className="w-4 h-4" aria-hidden="true" />
              Notification Settings
            </h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-dark-600 rounded-lg">
                <div>
                  <label htmlFor="notifications-enabled" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                    Enable Notifications
                  </label>
                  <p id="notifications-help" className="text-xs text-gray-600 dark:text-gray-400">
                    Receive alarm notifications on this device
                  </p>
                </div>
                <input
                  id="notifications-enabled"
                  type="checkbox"
                  checked={isEditing ? editForm.preferences.notificationsEnabled : user.preferences.notificationsEnabled}
                  onChange={(e) => isEditing && handleInputChange('notificationsEnabled', e.target.checked)}
                  disabled={!isEditing}
                  className="w-5 h-5 text-primary-600 border-gray-300 dark:border-dark-600 rounded focus:ring-primary-500 focus:ring-2 disabled:opacity-50"
                  aria-describedby="notifications-help"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-dark-600 rounded-lg">
                <div>
                  <label htmlFor="haptic-feedback" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                    Haptic Feedback
                  </label>
                  <p id="haptic-help" className="text-xs text-gray-600 dark:text-gray-400">
                    Vibrate on mobile devices when alarms ring
                  </p>
                </div>
                <input
                  id="haptic-feedback"
                  type="checkbox"
                  checked={isEditing ? editForm.preferences.hapticFeedback : user.preferences.hapticFeedback}
                  onChange={(e) => isEditing && handleInputChange('hapticFeedback', e.target.checked)}
                  disabled={!isEditing}
                  className="w-5 h-5 text-primary-600 border-gray-300 dark:border-dark-600 rounded focus:ring-primary-500 focus:ring-2 disabled:opacity-50"
                  aria-describedby="haptic-help"
                />
              </div>
            </div>
          </div>

          {/* Alarm Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4" aria-hidden="true" />
              Alarm Settings
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="snooze-duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Snooze Duration (minutes)
                </label>
                <input
                  id="snooze-duration"
                  type="number"
                  min="1"
                  max="30"
                  value={isEditing ? editForm.preferences.snoozeMinutes : user.preferences.snoozeMinutes}
                  onChange={(e) => isEditing && handleInputChange('snoozeMinutes', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                  aria-describedby="snooze-duration-help"
                  required
                />
                <div id="snooze-duration-help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  How long to wait between snooze activations (1-30 minutes)
                </div>
              </div>
              
              <div>
                <label htmlFor="max-snoozes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Snoozes
                </label>
                <input
                  id="max-snoozes"
                  type="number"
                  min="1"
                  max="10"
                  value={isEditing ? editForm.preferences.maxSnoozes : user.preferences.maxSnoozes}
                  onChange={(e) => isEditing && handleInputChange('maxSnoozes', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                  aria-describedby="max-snoozes-help"
                  required
                />
                <div id="max-snoozes-help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum number of times you can snooze an alarm (1-10)
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="voice-sensitivity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voice Dismissal Sensitivity
              </label>
              <input
                id="voice-sensitivity"
                type="range"
                min="1"
                max="10"
                value={isEditing ? editForm.preferences.voiceDismissalSensitivity : user.preferences.voiceDismissalSensitivity}
                onChange={(e) => isEditing && handleInputChange('voiceDismissalSensitivity', parseInt(e.target.value))}
                disabled={!isEditing}
                className="w-full h-2 bg-gray-200 dark:bg-dark-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                aria-describedby="voice-sensitivity-help"
                aria-valuemin={1}
                aria-valuemax={10}
                aria-valuenow={isEditing ? editForm.preferences.voiceDismissalSensitivity : user.preferences.voiceDismissalSensitivity}
                aria-valuetext={`Sensitivity level ${isEditing ? editForm.preferences.voiceDismissalSensitivity : user.preferences.voiceDismissalSensitivity} out of 10`}
              />
              <div id="voice-sensitivity-help" className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Less sensitive</span>
                <span className="font-medium">
                  Level {isEditing ? editForm.preferences.voiceDismissalSensitivity : user.preferences.voiceDismissalSensitivity}
                </span>
                <span>More sensitive</span>
              </div>
            </div>
          </div>

          {/* AI & Rewards Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Settings className="w-4 h-4" aria-hidden="true" />
              AI & Rewards
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-dark-600 rounded-lg">
                <div>
                  <label htmlFor="ai-insights" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                    AI Insights
                  </label>
                  <p id="ai-insights-help" className="text-xs text-gray-600 dark:text-gray-400">
                    Get personalized sleep and alarm recommendations
                  </p>
                </div>
                <input
                  id="ai-insights"
                  type="checkbox"
                  checked={isEditing ? editForm.preferences.aiInsightsEnabled : user.preferences.aiInsightsEnabled}
                  onChange={(e) => isEditing && handleInputChange('aiInsightsEnabled', e.target.checked)}
                  disabled={!isEditing}
                  className="w-5 h-5 text-primary-600 border-gray-300 dark:border-dark-600 rounded focus:ring-primary-500 focus:ring-2 disabled:opacity-50"
                  aria-describedby="ai-insights-help"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-dark-600 rounded-lg">
                <div>
                  <label htmlFor="rewards-system" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                    Rewards System
                  </label>
                  <p id="rewards-help" className="text-xs text-gray-600 dark:text-gray-400">
                    Earn achievements and track your alarm success
                  </p>
                </div>
                <input
                  id="rewards-system"
                  type="checkbox"
                  checked={isEditing ? editForm.preferences.rewardsEnabled : user.preferences.rewardsEnabled}
                  onChange={(e) => isEditing && handleInputChange('rewardsEnabled', e.target.checked)}
                  disabled={!isEditing}
                  className="w-5 h-5 text-primary-600 border-gray-300 dark:border-dark-600 rounded focus:ring-primary-500 focus:ring-2 disabled:opacity-50"
                  aria-describedby="rewards-help"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-dark-600 rounded-lg">
                <div>
                  <label htmlFor="personalized-messages" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                    Personalized Messages
                  </label>
                  <p id="personalized-messages-help" className="text-xs text-gray-600 dark:text-gray-400">
                    AI-powered custom alarm messages based on your preferences
                  </p>
                </div>
                <input
                  id="personalized-messages"
                  type="checkbox"
                  checked={isEditing ? editForm.preferences.personalizedMessagesEnabled : user.preferences.personalizedMessagesEnabled}
                  onChange={(e) => isEditing && handleInputChange('personalizedMessagesEnabled', e.target.checked)}
                  disabled={!isEditing}
                  className="w-5 h-5 text-primary-600 border-gray-300 dark:border-dark-600 rounded focus:ring-primary-500 focus:ring-2 disabled:opacity-50"
                  aria-describedby="personalized-messages-help"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-dark-600 rounded-lg">
                <div>
                  <label htmlFor="share-achievements" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                    Share Achievements
                  </label>
                  <p id="share-achievements-help" className="text-xs text-gray-600 dark:text-gray-400">
                    Allow sharing your progress and achievements with friends
                  </p>
                </div>
                <input
                  id="share-achievements"
                  type="checkbox"
                  checked={isEditing ? editForm.preferences.shareAchievements : user.preferences.shareAchievements}
                  onChange={(e) => isEditing && handleInputChange('shareAchievements', e.target.checked)}
                  disabled={!isEditing}
                  className="w-5 h-5 text-primary-600 border-gray-300 dark:border-dark-600 rounded focus:ring-primary-500 focus:ring-2 disabled:opacity-50"
                  aria-describedby="share-achievements-help"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" aria-hidden="true" />
          Account
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={onSignOut}
            className="w-full alarm-button alarm-button-secondary text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label="Sign out of your account"
          >
            <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}