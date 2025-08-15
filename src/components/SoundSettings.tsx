/**
 * Sound Settings Component
 * Provides comprehensive controls for all sound effects in the app
 */

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Volume1, Settings as SettingsIcon, Play, Pause, TestTube, Check, X, Palette } from 'lucide-react';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import useSoundEffects, { useUISound, useNotificationSounds, useAlarmSounds } from '../hooks/useSoundEffects';
import type { SoundEffectId, SoundTheme } from '../services/sound-effects';

interface SoundSettingsProps {
  className?: string;
}

const SoundSettings: React.FC<SoundSettingsProps> = ({ className }) => {
  const {
    settings,
    updateSettings,
    testSound,
    isInitialized,
    stopAllSounds,
    setSoundTheme,
    getSoundTheme,
    getAvailableThemes,
    previewTheme,
  } = useSoundEffects();

  const { soundsEnabled: uiSoundsEnabled } = useUISound();
  const { soundsEnabled: notificationSoundsEnabled } = useNotificationSounds();
  const { soundsEnabled: alarmSoundsEnabled } = useAlarmSounds();

  const [testResults, setTestResults] = useState<{ [key: string]: boolean | null }>({});
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [availableThemes] = useState(getAvailableThemes());

  // Volume change handlers
  const handleVolumeChange = async (category: string, value: number[]) => {
    const volume = value[0] / 100;
    
    switch (category) {
      case 'master':
        await updateSettings({ masterVolume: volume });
        break;
      case 'ui':
        await updateSettings({ uiVolume: volume });
        break;
      case 'notification':
        await updateSettings({ notificationVolume: volume });
        break;
      case 'alarm':
        await updateSettings({ alarmVolume: volume });
        break;
      case 'ambient':
        await updateSettings({ ambientVolume: volume });
        break;
    }
  };

  // Toggle handlers
  const handleToggleCategory = async (category: string, enabled: boolean) => {
    switch (category) {
      case 'ui':
        await updateSettings({ uiSoundsEnabled: enabled });
        break;
      case 'notification':
        await updateSettings({ notificationSoundsEnabled: enabled });
        break;
      case 'alarm':
        await updateSettings({ alarmSoundsEnabled: enabled });
        break;
      case 'ambient':
        await updateSettings({ ambientSoundsEnabled: enabled });
        break;
    }
  };

  // Theme selection handler
  const handleThemeChange = async (theme: SoundTheme) => {
    try {
      await setSoundTheme(theme);
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  };

  // Preview theme handler
  const handleThemePreview = async (theme: SoundTheme) => {
    try {
      await previewTheme(theme);
    } catch (error) {
      console.error('Error previewing theme:', error);
    }
  };

  // Test individual sound
  const handleTestSound = async (soundId: SoundEffectId) => {
    setTestResults(prev => ({ ...prev, [soundId]: null }));
    
    try {
      const result = await testSound(soundId);
      setTestResults(prev => ({ ...prev, [soundId]: result }));
      
      // Clear result after 3 seconds
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, [soundId]: null }));
      }, 3000);
    } catch (error) {
      setTestResults(prev => ({ ...prev, [soundId]: false }));
    }
  };

  // Test all sounds
  const handleTestAllSounds = async () => {
    setIsTestingAll(true);
    const allSounds: SoundEffectId[] = [
      'ui.click', 'ui.hover', 'ui.success', 'ui.error',
      'notification.default', 'notification.alarm', 'notification.beep',
      'alarm.gentle_bells', 'alarm.morning_birds', 'alarm.classic_beep', 
      'alarm.ocean_waves', 'alarm.energetic_beep'
    ];

    for (const soundId of allSounds) {
      await handleTestSound(soundId);
      await new Promise(resolve => setTimeout(resolve, 800)); // Delay between tests
    }
    
    setIsTestingAll(false);
  };

  const VolumeIcon = ({ volume }: { volume: number }) => {
    if (volume === 0) return <VolumeX className="w-4 h-4" />;
    if (volume < 0.5) return <Volume1 className="w-4 h-4" />;
    return <Volume2 className="w-4 h-4" />;
  };

  const TestButton = ({ soundId, label }: { soundId: SoundEffectId; label: string }) => {
    const result = testResults[soundId];
    
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleTestSound(soundId)}
        disabled={isTestingAll}
        className="min-w-[80px]"
      >
        <Play className="w-3 h-3 mr-1" />
        Test
        {result === true && <Check className="w-3 h-3 ml-1 text-green-500" />}
        {result === false && <X className="w-3 h-3 ml-1 text-red-500" />}
      </Button>
    );
  };

  if (!isInitialized) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Sound Effects
          </CardTitle>
          <CardDescription>Loading sound system...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Sound Effects
          <Badge variant={settings.masterVolume > 0 ? 'default' : 'secondary'}>
            {settings.masterVolume > 0 ? 'Enabled' : 'Muted'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure sound effects for different parts of the app
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Master Volume Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VolumeIcon volume={settings.masterVolume} />
              <span className="text-sm font-medium">Master Volume</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.round(settings.masterVolume * 100)}%
            </span>
          </div>
          <Slider
            value={[settings.masterVolume * 100]}
            onValueChange={(value) => handleVolumeChange('master', value)}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        {/* Theme Selector */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="text-sm font-medium">Sound Theme</span>
            </div>
            <Badge variant="outline">
              {availableThemes.find(theme => theme.id === settings.soundTheme)?.name || 'Default'}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {availableThemes.map((theme) => (
              <Card
                key={theme.id}
                className={`cursor-pointer transition-colors ${
                  settings.soundTheme === theme.id
                    ? 'border-primary bg-primary/10'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleThemeChange(theme.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">{theme.name}</h4>
                      <p className="text-xs text-muted-foreground">{theme.description}</p>
                    </div>
                    {settings.soundTheme !== theme.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleThemePreview(theme.id);
                        }}
                        className="p-1 h-6 w-6"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Click on a theme to apply it, or use the play button to preview without changing your current theme.
          </p>
        </div>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="sounds">Individual Sounds</TabsTrigger>
            <TabsTrigger value="test">Testing</TabsTrigger>
          </TabsList>

          {/* Sound Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            {/* UI Sounds */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">UI Sounds</CardTitle>
                    <CardDescription className="text-xs">
                      Button clicks, hover effects, success/error feedback
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.uiSoundsEnabled}
                    onCheckedChange={(enabled) => handleToggleCategory('ui', enabled)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Volume</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(settings.uiVolume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[settings.uiVolume * 100]}
                    onValueChange={(value) => handleVolumeChange('ui', value)}
                    max={100}
                    step={5}
                    disabled={!settings.uiSoundsEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Sounds */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Notifications</CardTitle>
                    <CardDescription className="text-xs">
                      Push notifications, system alerts
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.notificationSoundsEnabled}
                    onCheckedChange={(enabled) => handleToggleCategory('notification', enabled)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Volume</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(settings.notificationVolume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[settings.notificationVolume * 100]}
                    onValueChange={(value) => handleVolumeChange('notification', value)}
                    max={100}
                    step={5}
                    disabled={!settings.notificationSoundsEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Alarm Sounds */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Alarms</CardTitle>
                    <CardDescription className="text-xs">
                      Alarm tones and wake-up sounds
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.alarmSoundsEnabled}
                    onCheckedChange={(enabled) => handleToggleCategory('alarm', enabled)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Volume</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(settings.alarmVolume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[settings.alarmVolume * 100]}
                    onValueChange={(value) => handleVolumeChange('alarm', value)}
                    max={100}
                    step={5}
                    disabled={!settings.alarmSoundsEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ambient Sounds */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Ambient Sounds</CardTitle>
                    <CardDescription className="text-xs">
                      Background sounds and environmental audio
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.ambientSoundsEnabled}
                    onCheckedChange={(enabled) => handleToggleCategory('ambient', enabled)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Volume</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(settings.ambientVolume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[settings.ambientVolume * 100]}
                    onValueChange={(value) => handleVolumeChange('ambient', value)}
                    max={100}
                    step={5}
                    disabled={!settings.ambientSoundsEnabled}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Individual Sounds Tab */}
          <TabsContent value="sounds" className="space-y-4">
            {/* UI Sounds */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">UI Sound Effects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Click Sound</span>
                    <TestButton soundId="ui.click" label="Click" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hover Sound</span>
                    <TestButton soundId="ui.hover" label="Hover" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Success Sound</span>
                    <TestButton soundId="ui.success" label="Success" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Sound</span>
                    <TestButton soundId="ui.error" label="Error" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Sounds */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notification Sounds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Default Notification</span>
                    <TestButton soundId="notification.default" label="Notification" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Alarm Notification</span>
                    <TestButton soundId="notification.alarm" label="Alarm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Beep</span>
                    <TestButton soundId="notification.beep" label="Beep" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alarm Sounds */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alarm Sounds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gentle Bells</span>
                    <TestButton soundId="alarm.gentle_bells" label="Bells" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Morning Birds</span>
                    <TestButton soundId="alarm.morning_birds" label="Birds" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Classic Beep</span>
                    <TestButton soundId="alarm.classic_beep" label="Classic" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ocean Waves</span>
                    <TestButton soundId="alarm.ocean_waves" label="Ocean" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Energetic Beep</span>
                    <TestButton soundId="alarm.energetic_beep" label="Energetic" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sound System Testing</CardTitle>
                <CardDescription>
                  Test all sound effects to ensure they're working properly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleTestAllSounds}
                    disabled={isTestingAll}
                    className="flex-1"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {isTestingAll ? 'Testing All Sounds...' : 'Test All Sounds'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={stopAllSounds}
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Stop All
                  </Button>
                </div>

                {Object.keys(testResults).length > 0 && (
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Test Results</h4>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {Object.entries(testResults).map(([soundId, result]) => (
                        <div key={soundId} className="flex items-center justify-between">
                          <span className="truncate">{soundId.replace(/^(ui|notification|alarm)\./, '')}</span>
                          {result === true && <Check className="w-3 h-3 text-green-500" />}
                          {result === false && <X className="w-3 h-3 text-red-500" />}
                          {result === null && <div className="w-3 h-3 bg-muted-foreground rounded-full animate-pulse" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SoundSettings;