/**
 * Alarm Themes Integration & Customization Guide
 * Comprehensive guide for implementing custom themes, smart features, and audio setup
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { visualAlarmThemes, VisualAlarmThemeId } from '../services/visual-alarm-themes';
import { soundEffectsService, SoundTheme } from '../services/sound-effects';
import {
  contextualThemes,
  ContextualThemeRecommendation,
} from '../services/contextual-themes';
import { themeCombinations, ThemeCombination } from '../services/theme-combinations';
import { VoiceMood, Alarm } from '../types';
import AlarmThemeBrowser from './AlarmThemeBrowser';
import VisualAlarmDisplay from './VisualAlarmDisplay';

// 🎨 CUSTOM THEME CREATION DEMO
export const CustomThemeCreator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [customTheme, setCustomTheme] = useState({
    name: '',
    description: '',
    visual: 'sunrise_glow' as VisualAlarmThemeId,
    sound: 'nature' as SoundTheme,
    voice: 'gentle' as VoiceMood,
    tags: [] as string[],
    timeOfDay: [] as string[],
  });

  const handleCreateCustomTheme = () => {
    const newThemeId = themeCombinations.createCustomCombination(
      customTheme.name,
      customTheme.description,
      customTheme.visual,
      customTheme.sound,
      customTheme.voice,
      {
        category: 'gentle',
        tags: customTheme.tags,
        timeOfDay: customTheme.timeOfDay as any,
        weatherSuitability: ['sunny', 'cloudy'],
        difficulty: 'moderate',
        mood: 'peaceful',
      }
    );

    console.log('Created custom theme:', newThemeId);
    return newThemeId;
  };

  return (
    <div className="custom-theme-creator p-6 bg-white dark:bg-gray-800 rounded-xl">
      <h2 className="text-2xl font-bold mb-6">🎨 Create Your Perfect Theme</h2>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map(step => (
          <div
            key={step}
            className={`flex items-center justify-center w-10 h-10 rounded-full
              ${currentStep >= step ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}
            `}
          >
            {step}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        {currentStep === 1 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Theme name (e.g., 'My Perfect Morning')"
                value={customTheme.name}
                onChange={(e: any) => s // auto: implicit anyetCustomTheme({ ...customTheme, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Describe your ideal wake-up experience..."
                value={customTheme.description}
                onChange={(e: any) => /* auto: implicit any */
                  setCustomTheme({ ...customTheme, description: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Visual Theme</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {visualAlarmThemes.getAllThemes().map(theme => (
                <div
                  key={theme.id}
                  onClick={() =>
                    setCustomTheme({
                      ...customTheme,
                      visual: theme.id as VisualAlarmThemeId,
                    })
                  }
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${customTheme.visual === theme.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                  `}
                >
                  <div
                    className="w-full h-12 rounded mb-2"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
                    }}
                  />
                  <h4 className="font-medium text-sm">{theme.name}</h4>
                  <p className="text-xs text-gray-500">{theme.category}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Audio & Voice</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Sound Theme</label>
                <div className="space-y-2">
                  {soundEffectsService.getAvailableThemes().map(theme => (
                    <label key={theme.id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="sound"
                        value={theme.id}
                        checked={customTheme.sound === theme.id}
                        onChange={(e: any) => /* auto: implicit any */
                          setCustomTheme({
                            ...customTheme,
                            sound: e.target.value as SoundTheme,
                          })
                        }
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">
                        {theme.name} - {theme.description}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Voice Personality
                </label>
                <div className="space-y-2">
                  {(
                    [
                      'gentle',
                      'sweet-angel',
                      'motivational',
                      'drill-sergeant',
                      'anime-hero',
                    ] as VoiceMood[]
                  ).map(voice => (
                    <label key={voice} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="voice"
                        value={voice}
                        checked={customTheme.voice === voice}
                        onChange={(e: any) => /* auto: implicit any */
                          setCustomTheme({
                            ...customTheme,
                            voice: e.target.value as VoiceMood,
                          })
                        }
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm capitalize">
                        {voice.replace('-', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Personalization</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="morning, energetic, workout, peaceful"
                  onChange={(e: any) => /* auto: implicit any */
                    setCustomTheme({
                      ...customTheme,
                      tags: e.target.value
                        .split(',')
                        .map((tag: any) => t // auto: implicit anyag.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Best Time of Day
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'early-morning',
                    'morning',
                    'midday',
                    'afternoon',
                    'evening',
                    'night',
                  ].map(time => (
                    <label key={time} className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        value={time}
                        onChange={(e: any) => { // auto: implicit any
                          if (e.target.checked) {
                            setCustomTheme({
                              ...customTheme,
                              timeOfDay: [...customTheme.timeOfDay, time],
                            });
                          } else {
                            setCustomTheme({
                              ...customTheme,
                              timeOfDay: customTheme.timeOfDay.filter((t: any) => t // auto: implicit any !== time),
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm capitalize">
                        {time.replace('-', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="px-6 py-2 text-gray-600 disabled:opacity-50"
        >
          Previous
        </button>

        {currentStep === 4 ? (
          <button
            onClick={handleCreateCustomTheme}
            disabled={!customTheme.name || !customTheme.description}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Create Theme
          </button>
        ) : (
          <button
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

// 🧠 SMART CONTEXTUAL FEATURES DEMO
export const SmartThemesDemo: React.FC = () => {
  const [currentRecommendation, setCurrentRecommendation] =
    useState<ContextualThemeRecommendation | null>(null);
  const [testTime, setTestTime] = useState('07:00');
  const [testDate, setTestDate] = useState(new Date());
  const [learningData, setLearningData] = useState<any[]>([]);

  useEffect(() => {
    loadRecommendation();
  }, [testTime, testDate]);

  const loadRecommendation = async () => {
    try {
      const recommendation = await contextualThemes.getContextualRecommendation(
        testTime,
        testDate
      );
      setCurrentRecommendation(recommendation);
    } catch (error) {
      console.error('Failed to load recommendation:', error);
    }
  };

  const simulateUsage = () => {
    // Simulate user choosing a theme and recording the usage
    if (currentRecommendation) {
      contextualThemes.recordThemeUsage(
        currentRecommendation.visual,
        currentRecommendation.sound,
        currentRecommendation.voice,
        testTime,
        testDate,
        Math.floor(Math.random() * 40 + 60) // 60-100% satisfaction
      );

      // Update learning data display
      setLearningData((prev: any) => /* auto: implicit any */
        [
          ...prev,
          {
            time: testTime,
            date: testDate.toDateString(),
            theme: `${currentRecommendation.visual} + ${currentRecommendation.sound}`,
            satisfaction: Math.floor(Math.random() * 40 + 60),
          },
        ].slice(-5)
      ); // Keep last 5 entries
    }
  };

  return (
    <div className="smart-themes-demo p-6 bg-white dark:bg-gray-800 rounded-xl">
      <h2 className="text-2xl font-bold mb-6">🧠 Smart Contextual Themes</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Test Conditions</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Alarm Time</label>
                <input
                  type="time"
                  value={testTime}
                  onChange={(e: any) => s // auto: implicit anyetTestTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={testDate.toISOString().split('T')[0]}
                  onChange={(e: any) => s // auto: implicit anyetTestDate(new Date(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Learning Simulation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Learning Simulation</h3>
            <button
              onClick={simulateUsage}
              className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 mb-4"
            >
              Simulate Theme Usage
            </button>

            {learningData.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Recent Learning Data</h4>
                <div className="space-y-2 text-sm">
                  {learningData.map((data, index) => (
                    <div key={index} className="flex justify-between">
                      <span>
                        {data.time} on {data.date}
                      </span>
                      <span className="text-green-600">
                        {data.satisfaction}% satisfaction
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h3 className="text-lg font-semibold mb-4">AI Recommendation</h3>
          {currentRecommendation && (
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Recommended Theme</h4>
                  <span className="text-sm bg-blue-100 px-2 py-1 rounded">
                    {currentRecommendation.confidence}% confidence
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {currentRecommendation.reason}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded">
                  <span className="font-medium">Visual:</span>
                  <span className="text-blue-600">{currentRecommendation.visual}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded">
                  <span className="font-medium">Sound:</span>
                  <span className="text-green-600">{currentRecommendation.sound}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded">
                  <span className="font-medium">Voice:</span>
                  <span className="text-purple-600">{currentRecommendation.voice}</span>
                </div>
              </div>

              <div className="mt-4">
                <h5 className="font-medium mb-2">Context Factors:</h5>
                <div className="flex flex-wrap gap-2">
                  {currentRecommendation.context.map((ctx, index) => (
                    <span key={index} className="px-2 py-1 bg-white text-sm rounded">
                      {ctx.type}: {ctx.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 📱 APP INTEGRATION EXAMPLE
export const AlarmFormIntegration: React.FC<{
  alarm: Alarm;
  onAlarmUpdate: (alarm: Partial<Alarm>) => void;
}> = ({ alarm, onAlarmUpdate }) => {
  const [selectedThemeCombination, setSelectedThemeCombination] = useState<string>('');
  const [showThemeBrowser, setShowThemeBrowser] = useState(false);

  const handleThemeSelect = (combination: ThemeCombination) => {
    // Update alarm with selected theme combination
    onAlarmUpdate({
      // Map to existing alarm properties
      sound: combination.visual, // You'd map this properly to alarm.sound
      voiceMood: combination.voice,
      // Add any other mappings needed
    });

    setSelectedThemeCombination(combination.id);
    setShowThemeBrowser(false);
  };

  const handlePreview = async (combination: ThemeCombination) => {
    // Preview the theme combination
    visualAlarmThemes.previewTheme(combination.visual, 3000);
    await soundEffectsService.previewTheme(combination.sound);
  };

  return (
    <div className="alarm-form-integration">
      {/* Theme Selection Button */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Alarm Theme
        </label>
        <button
          onClick={() => setShowThemeBrowser(true)}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg
                     hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
        >
          {selectedThemeCombination ? (
            <div>
              <div className="font-medium">
                {themeCombinations.getCombination(selectedThemeCombination)?.name}
              </div>
              <div className="text-sm text-gray-500">Click to change theme</div>
            </div>
          ) : (
            <div>
              <div className="font-medium text-gray-500">Choose Alarm Theme</div>
              <div className="text-sm text-gray-400">
                Select visual, audio, and voice combination
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Theme Browser Modal */}
      {showThemeBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-6xl max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Choose Your Alarm Theme</h3>
              <button
                onClick={() => setShowThemeBrowser(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <AlarmThemeBrowser
              selectedTheme={selectedThemeCombination}
              onThemeSelect={handleThemeSelect}
              onPreview={handlePreview}
              className="max-h-96"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// 🔊 AUDIO SETUP & TESTING
export const AudioSetupDemo: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<SoundTheme>('default');
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});
  const [isTestingAll, setIsTestingAll] = useState(false);

  const testSingleSound = async (soundId: string) => {
    try {
      const result = await soundEffectsService.testSound(soundId as any);
      /* auto: implicit any */
      setTestResults((prev: any) => ({{ ...prev, [soundId]: result }));
      return result;
    } catch (error) {
      console.error('Sound test failed:', error);
      /* auto: implicit any */
      setTestResults((prev: any) => ({{ ...prev, [soundId]: false }));
      return false;
    }
  };

  const testAllSounds = async () => {
    setIsTestingAll(true);
    try {
      const results = await soundEffectsService.testAllSounds();
      setTestResults(results);
    } catch (error) {
      console.error('Failed to test all sounds:', error);
    } finally {
      setIsTestingAll(false);
    }
  };

  const playThemePreview = async (theme: SoundTheme) => {
    try {
      await soundEffectsService.previewTheme(theme);
    } catch (error) {
      console.error('Theme preview failed:', error);
    }
  };

  return (
    <div className="audio-setup-demo p-6 bg-white dark:bg-gray-800 rounded-xl">
      <h2 className="text-2xl font-bold mb-6">🔊 Audio System Setup & Testing</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Selection & Preview */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Sound Theme Testing</h3>
          <div className="space-y-4">
            {soundEffectsService.getAvailableThemes().map(theme => (
              <div key={theme.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-medium">{theme.name}</h4>
                    <p className="text-sm text-gray-600">{theme.description}</p>
                  </div>
                  <button
                    onClick={() => playThemePreview(theme.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Preview
                  </button>
                </div>

                {theme.category && (
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {theme.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sound Testing */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Individual Sound Testing</h3>

          <div className="mb-4">
            <button
              onClick={testAllSounds}
              disabled={isTestingAll}
              className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {isTestingAll ? 'Testing All Sounds...' : 'Test All Sounds'}
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {soundEffectsService
              .getAllSoundEffects()
              .slice(0, 20)
              .map(sound => (
                <div
                  key={sound.id}
                  className="flex items-center justify-between p-2 border border-gray-200 rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{sound.name}</div>
                    <div className="text-xs text-gray-500">{sound.category}</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {testResults[sound.id] !== undefined && (
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          testResults[sound.id]
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {testResults[sound.id] ? 'Pass' : 'Fail'}
                      </span>
                    )}

                    <button
                      onClick={() => testSingleSound(sound.id)}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    >
                      Test
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Audio Settings */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Audio Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Master Volume</label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="70"
              onChange={(e: any) => /* auto: implicit any */
                soundEffectsService.setVolume('master', parseInt(e.target.value) / 100)
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">UI Sounds</label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="50"
              onChange={(e: any) => /* auto: implicit any */
                soundEffectsService.setVolume('ui', parseInt(e.target.value) / 100)
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Alarms</label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="100"
              onChange={(e: any) => /* auto: implicit any */
                soundEffectsService.setVolume('alarm', parseInt(e.target.value) / 100)
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ambient</label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="60"
              onChange={(e: any) => /* auto: implicit any */
                soundEffectsService.setVolume('ambient', parseInt(e.target.value) / 100)
              }
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// 🚀 COMPLETE INTEGRATION EXAMPLE
export const CompleteThemeSystemDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<
    'customize' | 'smart' | 'audio' | 'integration'
  >('customize');
  const [mockAlarm, setMockAlarm] = useState<Alarm>({
    id: '1',
    name: 'Morning Alarm',
    time: '07:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    enabled: true,
    sound: 'gentle_bells',
    soundType: 'built-in',
    voiceMood: 'gentle',
    difficulty: 'easy',
    snoozeEnabled: true,
    snoozeInterval: 5,
    snoozeCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const handleAlarmUpdate = (updates: Partial<Alarm>) => {
    /* auto: implicit any */
      setMockAlarm((prev: any) => ({{ ...prev, ...updates }));
  };

  return (
    <div className="complete-theme-system-demo">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
        {[
          { id: 'customize', label: '🎨 Customize', title: 'Custom Themes' },
          { id: 'smart', label: '🧠 Smart AI', title: 'Smart Features' },
          { id: 'integration', label: '📱 Integration', title: 'App Integration' },
          { id: 'audio', label: '🔊 Audio', title: 'Audio Setup' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveDemo(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-colors
              ${
                activeDemo === tab.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Demo Content */}
      <motion.div
        key={activeDemo}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[600px]"
      >
        {activeDemo === 'customize' && <CustomThemeCreator />}
        {activeDemo === 'smart' && <SmartThemesDemo />}
        {activeDemo === 'integration' && (
          <AlarmFormIntegration alarm={mockAlarm} onAlarmUpdate={handleAlarmUpdate} />
        )}
        {activeDemo === 'audio' && <AudioSetupDemo />}
      </motion.div>
    </div>
  );
};

export default CompleteThemeSystemDemo;
