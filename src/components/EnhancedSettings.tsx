import React, { useState } from 'react';
import {
  Settings,
  BarChart3,
  Accessibility,
  TestTube,
  Volume2,
  Palette,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import SettingsPage from './SettingsPage';
import PerformanceDashboard from './PerformanceDashboard';
import AccessibilityDashboard from './AccessibilityDashboard';
import PremiumFeatureTest from './PremiumFeatureTest';
import SoundThemeDemo from './SoundThemeDemo';
import ThemeManager from './ThemeManager';
import type { AppState, User } from '../types';

interface EnhancedSettingsProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  onUpdateProfile: (profile: Partial<User>) => Promise<void>;
  onSignOut: () => void;
  isLoading: boolean;
  _error: string | null;
}

const EnhancedSettings: React.FC<EnhancedSettingsProps> = ({
  appState,
  setAppState,
  onUpdateProfile,
  onSignOut,
  isLoading,
  _error,
}) => {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-900">
      <div className="flex-shrink-0 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-200">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings & Analytics
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Configure your app, manage themes, view analytics, and manage accessibility
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-6 mx-4 mt-4">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="flex items-center gap-2">
              <Accessibility className="w-4 h-4" />
              <span className="hidden sm:inline">Accessibility</span>
            </TabsTrigger>
            <TabsTrigger value="premium-test" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              <span className="hidden sm:inline">Premium Test</span>
            </TabsTrigger>
            <TabsTrigger value="themes" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Themes</span>
            </TabsTrigger>
            <TabsTrigger value="sound-themes" className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Sound Themes</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="settings" className="h-full mt-0 p-4">
              <SettingsPage
                appState={appState}
                setAppState={setAppState}
                onUpdateProfile={onUpdateProfile}
                onSignOut={onSignOut}
                isLoading={isLoading}
                error={_error}
              />
            </TabsContent>

            <TabsContent value="analytics" className="h-full mt-0 p-4">
              <PerformanceDashboard />
            </TabsContent>

            <TabsContent value="accessibility" className="h-full mt-0 p-4">
              <AccessibilityDashboard />
            </TabsContent>

            <TabsContent value="premium-test" className="h-full mt-0 p-4">
              {appState.user && <PremiumFeatureTest user={appState._user} />}
            </TabsContent>

            <TabsContent value="themes" className="h-full mt-0 p-4">
              <ThemeManager />
            </TabsContent>

            <TabsContent value="sound-themes" className="h-full mt-0 p-4">
              <SoundThemeDemo />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedSettings;
