import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Volume2, VolumeX, Palette, Music, Zap } from 'lucide-react';
import { soundEffectsService, SoundTheme } from '../services/sound-effects';
import { motion } from 'framer-motion';
import { TimeoutHandle } from '../types/timers';

interface ThemeCategory {
  name: string;
  icon: React.ReactNode;
  color: string;
  themes: Array<{
    id: SoundTheme;
    name: string;
    description: string;
    color: string;
  }>;
}

const SoundThemeDemo: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<SoundTheme>('default');
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [testResults, setTestResults] = useState<{
    [key: string]: 'success' | 'error' | 'testing';
  }>({});

  // Organized theme categories for better presentation
  const themeCategories: ThemeCategory[] = [
    {
      name: 'Core Themes',
      icon: <Palette className="w-5 h-5" />,
      color: 'blue',
      themes: [
        {
          id: 'default',
          name: 'Default',
          description: 'Clean and modern sounds',
          color: 'blue',
        },
        {
          id: 'minimal',
          name: 'Minimal',
          description: 'Subtle and understated sounds',
          color: 'gray',
        },
      ],
    },
    {
      name: 'Nature & Ambient',
      icon: <div className="text-green-500">🌿</div>,
      color: 'green',
      themes: [
        {
          id: 'nature',
          name: 'Nature',
          description: 'Organic wood taps and wind chimes',
          color: 'green',
        },
        {
          id: 'ambient',
          name: 'Ambient',
          description: 'Ethereal pads and atmospheric sounds',
          color: 'cyan',
        },
        {
          id: 'seasonal',
          name: 'Seasonal',
          description: 'Crystal winter sparkles and ice sounds',
          color: 'sky',
        },
      ],
    },
    {
      name: 'Electronic & Futuristic',
      icon: <Zap className="w-5 h-5 text-purple-500" />,
      color: 'purple',
      themes: [
        {
          id: 'electronic',
          name: 'Electronic',
          description: 'Sharp digital clicks and arpeggios',
          color: 'indigo',
        },
        {
          id: 'cyberpunk',
          name: 'Cyberpunk',
          description: 'Dark dystopian tech with distortion',
          color: 'pink',
        },
        {
          id: 'scifi',
          name: 'Sci-Fi',
          description: 'Futuristic laser sweeps and space sounds',
          color: 'blue',
        },
      ],
    },
    {
      name: 'Artistic & Creative',
      icon: <div className="text-purple-500">✨</div>,
      color: 'purple',
      themes: [
        {
          id: 'fantasy',
          name: 'Fantasy',
          description: 'Magical sparkles and bell harmonics',
          color: 'emerald',
        },
        {
          id: 'horror',
          name: 'Horror',
          description: 'Dissonant tones and creepy ambience',
          color: 'zinc',
        },
        {
          id: 'classical',
          name: 'Classical',
          description: 'Harpsichord plucks and orchestral progressions',
          color: 'yellow',
        },
        {
          id: 'lofi',
          name: 'Lo-Fi',
          description: 'Warm vintage sounds with vinyl crackle',
          color: 'rose',
        },
      ],
    },
    {
      name: 'Energy & Activity',
      icon: <div className="text-red-500">💪</div>,
      color: 'red',
      themes: [
        {
          id: 'workout',
          name: 'Workout',
          description: 'High-energy motivational beats',
          color: 'red',
        },
        {
          id: 'retro',
          name: 'Retro',
          description: '8-bit gaming sounds and square waves',
          color: 'fuchsia',
        },
      ],
    },
  ];

  // Sound types for testing
  const soundTypes = [
    { id: 'ui.click', name: 'Click', description: 'Primary interaction sound' },
    { id: 'ui.hover', name: 'Hover', description: 'Rollover feedback' },
    { id: 'ui.success', name: 'Success', description: 'Positive confirmation' },
    { id: 'ui.error', name: 'Error', description: 'Negative feedback' },
  ];

  const alarmTypes = [
    { name: 'Gentle Awakening', description: 'Soft morning alarm' },
    { name: 'Energetic Wake', description: 'High-energy alarm' },
  ];

  // Play sound effect
  const playSound = async (soundId: string, themeId: SoundTheme) => {
    if (!soundEnabled) return;

    const key = `${themeId}-${soundId}`;
    setIsPlaying((prev: any) => // auto: implicit any ({ ...prev, [key]: true }));
    setTestResults((prev: any) => // auto: implicit any ({ ...prev, [key]: 'testing' }));

    try {
      // Temporarily switch to theme for testing
      const originalTheme = soundEffectsService.getSoundTheme();
      if (themeId !== originalTheme) {
        await soundEffectsService.setSoundTheme(themeId);
      }

      // Play the sound
      await soundEffectsService.playSound(soundId as any, { force: true });

      // Restore original theme if changed
      if (themeId !== originalTheme) {
        await soundEffectsService.setSoundTheme(originalTheme);
      }

      setTestResults((prev: any) => // auto: implicit any ({ ...prev, [key]: 'success' }));
    } catch (error) {
      console.error('Sound test failed:', error);
      setTestResults((prev: any) => // auto: implicit any ({ ...prev, [key]: 'error' }));
    } finally {
      setTimeout(() => {
        setIsPlaying((prev: any) => // auto: implicit any ({ ...prev, [key]: false }));
      }, 500);
    }
  };

  // Play alarm sound (simulated)
  const playAlarmSound = async (alarmType: string, themeId: SoundTheme) => {
    if (!soundEnabled) return;

    const key = `${themeId}-alarm-${alarmType}`;
    setIsPlaying((prev: any) => // auto: implicit any ({ ...prev, [key]: true }));

    // Simulate alarm sound by playing success sound with loop simulation
    await playSound('ui.success', themeId);

    setTimeout(() => {
      setIsPlaying((prev: any) => // auto: implicit any ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Apply theme to entire demo
  const applyTheme = async (themeId: SoundTheme) => {
    try {
      await soundEffectsService.setSoundTheme(themeId);
      setCurrentTheme(themeId);

      // Play a sample sound to demonstrate
      if (soundEnabled) {
        setTimeout(() => {
          soundEffectsService.playSound('ui.success', { force: true });
        }, 200);
      }
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  };

  const getStatusColor = (key: string) => {
    const status = testResults[key];
    if (status === 'testing') return 'animate-pulse text-blue-500';
    if (status === 'success') return 'text-green-500';
    if (status === 'error') return 'text-red-500';
    return 'text-gray-400';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎵 Sound Theme Showcase
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mt-2">
            Experience all 13 themes with UI sounds and alarm variations
          </p>
        </motion.div>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant={soundEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-2"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            {soundEnabled ? 'Sounds On' : 'Sounds Off'}
          </Button>

          <Badge variant="outline" className="text-sm">
            Current:{' '}
            {themeCategories.flatMap(cat => cat.themes).find(t => t.id === currentTheme)
              ?.name || 'Default'}
          </Badge>
        </div>
      </div>

      {/* Theme Categories */}
      {themeCategories.map((category, categoryIndex) => (
        <motion.div
          key={category.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            {category.icon}
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              {category.name}
            </h2>
            <Badge variant="secondary" className="text-xs">
              {category.themes.length} themes
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.themes.map((theme, themeIndex) => (
              <motion.div
                key={theme.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: themeIndex * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card
                  className={`h-full border-2 transition-all duration-300 ${
                    currentTheme === theme.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {theme.name}
                        {currentTheme === theme.id && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        )}
                      </CardTitle>
                      <Button
                        size="sm"
                        variant={currentTheme === theme.id ? 'default' : 'outline'}
                        onClick={() => applyTheme(theme.id)}
                      >
                        {currentTheme === theme.id ? 'Active' : 'Apply'}
                      </Button>
                    </div>
                    <CardDescription className="text-sm">
                      {theme.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* UI Sounds */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        UI Sounds
                      </h4>
                      <div className="grid grid-cols-2 gap-1">
                        {soundTypes.map(sound => {
                          const key = `${theme.id}-${sound.id}`;
                          const isPlayingThis = isPlaying[key];
                          return (
                            <Button
                              key={sound.id}
                              variant="ghost"
                              size="sm"
                              className={`h-8 text-xs justify-start ${getStatusColor(key)}`}
                              onClick={() => playSound(sound.id, theme.id)}
                              disabled={isPlayingThis}
                            >
                              <Play
                                className={`w-3 h-3 mr-1 ${isPlayingThis ? 'animate-spin' : ''}`}
                              />
                              {sound.name}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Alarm Sounds */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Music className="w-4 h-4" />
                        Alarm Sounds
                      </h4>
                      <div className="space-y-1">
                        {alarmTypes.map((alarm, index) => {
                          const key = `${theme.id}-alarm-${alarm.name}`;
                          const isPlayingThis = isPlaying[key];
                          return (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs justify-start w-full"
                              onClick={() => playAlarmSound(alarm.name, theme.id)}
                              disabled={isPlayingThis}
                            >
                              <Play
                                className={`w-3 h-3 mr-1 ${isPlayingThis ? 'animate-pulse' : ''}`}
                              />
                              {alarm.name}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg"
      >
        <h3 className="text-lg font-semibold mb-3">🎨 About Sound Themes</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
          <div>
            <p>
              <strong>13 Total Themes:</strong> From minimal to cyberpunk, fantasy to
              classical
            </p>
            <p>
              <strong>78 Sound Files:</strong> Each theme includes 4 UI sounds + 2 alarm
              variations
            </p>
          </div>
          <div>
            <p>
              <strong>Procedural Audio:</strong> All sounds generated using Web Audio
              API
            </p>
            <p>
              <strong>Instant Switching:</strong> Change themes immediately with
              persistent preferences
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">Web Audio API</Badge>
          <Badge variant="outline">44.1kHz WAV</Badge>
          <Badge variant="outline">TypeScript</Badge>
          <Badge variant="outline">React</Badge>
          <Badge variant="outline">Framer Motion</Badge>
        </div>
      </motion.div>
    </div>
  );
};

export default SoundThemeDemo;
