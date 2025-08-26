/// <reference types="node" />
/// <reference lib="dom" />
import React, { useState, useRef, useEffect } from 'react';
import path from 'path';
import {
  Loader2,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
  Settings,
  TestTube,
  Speaker,
  Headphones,
  Music,
  Timer,
  Waves,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { soundEffectsService, SoundEffectId } from '../services/sound-effects';
import { TimeoutHandle } from '../types/timers';
import type {
  CustomSoundTheme,
  CustomSoundAssignment,
  DemoSequence,
  PreviewSound,
} from '../types/custom-sound-themes';

interface SoundPreviewSystemProps {
  theme?: CustomSoundTheme;
  onThemeTest?: (results: ThemeTestResults) => void;
  className?: string;
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loop: boolean;
  fadeIn: number;
  fadeOut: number;
}

interface ThemeTestResults {
  overallScore: number;
  categoryScores: Record<string, number>;
  issues: Array<{
    category: string;
    sound: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
}

interface SoundTest {
  id: string;
  name: string;
  category: string;
  description: string;
  soundId?: SoundEffectId;
  customAssignment?: CustomSoundAssignment;
}

const THEME_TESTS: SoundTest[] = [
  // UI Tests
  {
    id: 'ui.click',
    name: 'Button Click',
    category: 'UI',
    description: 'Primary interface interaction',
    soundId: 'ui.click',
  },
  {
    id: 'ui.hover',
    name: 'Hover Effect',
    category: 'UI',
    description: 'Element hover feedback',
    soundId: 'ui.hover',
  },
  {
    id: 'ui.success',
    name: 'Success Action',
    category: 'UI',
    description: 'Successful operation feedback',
    soundId: 'ui.success',
  },
  {
    id: 'ui.error',
    name: 'Error Alert',
    category: 'UI',
    description: 'Error state notification',
    soundId: 'ui._error',
  },

  // Notification Tests
  {
    id: 'notification.default',
    name: 'Default Notification',
    category: 'Notification',
    description: 'Standard app notification',
    soundId: 'notification.default',
  },
  {
    id: 'notification.alarm',
    name: 'Alarm Notification',
    category: 'Notification',
    description: 'Important alarm alert',
    soundId: 'notification.alarm',
  },
  {
    id: 'notification.urgent',
    name: 'Urgent Alert',
    category: 'Notification',
    description: 'High priority notification',
    soundId: 'notification.urgent',
  },

  // Alarm Tests
  {
    id: 'alarm.gentle',
    name: 'Gentle Wake-up',
    category: 'Alarm',
    description: 'Soft morning alarm',
    soundId: 'alarm.gentle_bells',
  },
  {
    id: 'alarm.energetic',
    name: 'Energetic Wake-up',
    category: 'Alarm',
    description: 'High-energy morning alarm',
    soundId: 'alarm.energetic_beep',
  },
  {
    id: 'alarm.nature',
    name: 'Nature Wake-up',
    category: 'Alarm',
    description: 'Natural sound alarm',
    soundId: 'alarm.morning_birds',
  },

  // Ambient Tests
  {
    id: 'ambient.focus',
    name: 'Focus Ambience',
    category: 'Ambient',
    description: 'Background focus sound',
    soundId: 'ambient.white_noise',
  },
  {
    id: 'ambient.relax',
    name: 'Relaxation Ambience',
    category: 'Ambient',
    description: 'Calming background sound',
    soundId: 'ambient.brown_noise',
  },
];

const DEMO_SCENARIOS = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    description: 'Simulates a typical morning wake-up sequence',
    steps: [
      {
        sound: 'alarm.gentle',
        delay: 0,
        duration: 5000,
        description: 'Alarm starts gently',
      },
      {
        sound: 'ui.click',
        delay: 5000,
        duration: 200,
        description: 'User dismisses alarm',
      },
      {
        sound: 'ui.success',
        delay: 5200,
        duration: 500,
        description: 'Successful dismissal',
      },
      {
        sound: 'notification.default',
        delay: 6000,
        duration: 1000,
        description: 'Morning notification',
      },
    ],
  },
  {
    id: 'focused-work',
    name: 'Focused Work Session',
    description: 'Demonstrates ambient sounds and notifications during work',
    steps: [
      {
        sound: 'ambient.focus',
        delay: 0,
        duration: 10000,
        description: 'Background focus ambience',
      },
      {
        sound: 'notification.default',
        delay: 3000,
        duration: 500,
        description: 'Incoming notification',
      },
      {
        sound: 'ui.click',
        delay: 4000,
        duration: 200,
        description: 'User interaction',
      },
      {
        sound: 'notification.default',
        delay: 7000,
        duration: 500,
        description: 'Another notification',
      },
    ],
  },
  {
    id: 'error-recovery',
    name: 'Error & Recovery',
    description: 'Shows _error handling and recovery sounds',
    steps: [
      { sound: 'ui.click', delay: 0, duration: 200, description: 'User action' },
      { sound: 'ui._error', delay: 1000, duration: 800, description: 'Error occurs' },
      { sound: 'ui.click', delay: 2500, duration: 200, description: 'Retry action' },
      {
        sound: 'ui.success',
        delay: 3000,
        duration: 500,
        description: 'Successful recovery',
      },
    ],
  },
];

export const SoundPreviewSystem: React.FC<SoundPreviewSystemProps> = ({
  theme,
  onThemeTest,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState('individual');
  const [playbackStates, setPlaybackStates] = useState<Map<string, PlaybackState>>(
    new Map()
  );
  const [globalVolume, setGlobalVolume] = useState(0.7);
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);
  const [runningDemo, setRunningDemo] = useState<string | null>(null);
  const [demoProgress, setDemoProgress] = useState(0);
  const [testResults, setTestResults] = useState<ThemeTestResults | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const intervalRefs = useRef<Map<string, TimeoutHandle>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    const currentAudioRefs = audioRefs.current;
    const currentIntervalRefs = intervalRefs.current;
    return () => {
      currentAudioRefs.forEach((audio: unknown) => {
        if (!audio.paused) {
          audio.pause();
        }
      });
      currentIntervalRefs.forEach((interval: unknown) => {
        clearInterval(interval);
      });
    };
  }, []);

  // Initialize playback states
  const getPlaybackState = (soundId: string): PlaybackState => {
    return (
      playbackStates.get(soundId) || {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 0.8,
        loop: false,
        fadeIn: 0,
        fadeOut: 0,
      }
    );
  };

  const updatePlaybackState = (soundId: string, updates: Partial<PlaybackState>) => {
    const currentState = getPlaybackState(soundId);
    const newState = { ...currentState, ...updates };
    setPlaybackStates(new Map(playbackStates.set(soundId, newState)));
  };

  // Audio management functions
  const createAudio = (soundId: string, soundUrl: string): HTMLAudioElement => {
    let audio = audioRefs.current.get(soundId);
    if (!audio) {
      audio = new Audio(soundUrl);
      audioRefs.current.set(soundId, audio);

      audio.addEventListener('loadedmetadata', () => {
        updatePlaybackState(soundId, { duration: audio!.duration });
      });

      audio.addEventListener('timeupdate', () => {
        updatePlaybackState(soundId, { currentTime: audio!.currentTime });
      });

      audio.addEventListener('ended', () => {
        updatePlaybackState(soundId, { isPlaying: false, currentTime: 0 });
      });
    }
    return audio;
  };

  const playSound = async (
    test: SoundTest,
    options: { loop?: boolean; fadeIn?: number } = {}
  ) => {
    try {
      const soundUrl = await getSoundUrl(test);
      if (!soundUrl) return;

      // Stop other sounds unless it's ambient
      if (test.category !== 'Ambient') {
        stopAllSounds();
      }

      const audio = createAudio(test.id, soundUrl);
      const state = getPlaybackState(test.id);

      audio.volume = state.volume * globalVolume * (isGlobalMuted ? 0 : 1);
      audio.loop = options.loop || state.loop;

      // Apply fade in effect
      if (options.fadeIn || state.fadeIn) {
        audio.volume = 0;
        audio.play();
        fadeInAudio(
          audio,
          state.volume * globalVolume * (isGlobalMuted ? 0 : 1),
          options.fadeIn || state.fadeIn
        );
      } else {
        await audio.play();
      }

      updatePlaybackState(test.id, { isPlaying: true });

      // Set up progress tracking
      const interval = setInterval(() => {
        if (audio.ended || audio.paused) {
          clearInterval(interval);
          intervalRefs.current.delete(test.id);
        }
      }, 100);
      intervalRefs.current.set(test.id, interval);
    } catch (_error) {
      console._error('Error playing sound:', _error);
    }
  };

  const pauseSound = (soundId: string) => {
    const audio = audioRefs.current.get(soundId);
    if (audio && !audio.paused) {
      audio.pause();
      updatePlaybackState(soundId, { isPlaying: false });
    }
  };

  const stopSound = (soundId: string) => {
    const audio = audioRefs.current.get(soundId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      updatePlaybackState(soundId, { isPlaying: false, currentTime: 0 });
    }

    const interval = intervalRefs.current.get(soundId);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(soundId);
    }
  };

  const stopAllSounds = () => {
    audioRefs.current.forEach((audio, soundId) => {
      if (!audio.paused) {
        stopSound(soundId);
      }
    });
  };

  const fadeInAudio = (
    audio: HTMLAudioElement,
    targetVolume: number,
    duration: number
  ) => {
    const steps = 20;
    const stepVolume = targetVolume / steps;
    const stepDuration = (duration * 1000) / steps;

    let currentStep = 0;
    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(stepVolume * currentStep, targetVolume);

      if (currentStep >= steps) {
        clearInterval(fadeInterval);
      }
    }, stepDuration);
  };

  const getSoundUrl = async (test: SoundTest): Promise<string | null> => {
    if (theme && test.customAssignment) {
      return test.customAssignment.source;
    } else if (test.soundId) {
      const soundConfig = soundEffectsService.getSoundEffect(test.soundId);
      return soundConfig?.url || null;
    }
    return null;
  };

  // Demo sequence functions
  const runDemoSequence = async (demoId: string) => {
    const demo = DEMO_SCENARIOS.find(d => d.id === demoId);
    if (!demo) return;

    setRunningDemo(demoId);
    setDemoProgress(0);

    const totalDuration = demo.steps.reduce(
      (sum, step) => Math.max(sum, step.delay + step.duration),
      0
    );

    for (const step of demo.steps) {
      setTimeout(async () => {
        const test = THEME_TESTS.find(t => t.id === step.sound);
        if (test) {
          await playSound(test, { loop: step.duration > 3000 });

          // Stop the sound after its duration
          setTimeout(() => {
            stopSound(test.id);
          }, step.duration);
        }
      }, step.delay);
    }

    // Track progress
    const progressInterval = setInterval(() => {
      setDemoProgress((prev: unknown) => {
        const newProgress = prev + 100 / (totalDuration / 100);
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setRunningDemo(null);
          setDemoProgress(0);
          return 100;
        }
        return newProgress;
      });
    }, 100);
  };

  const stopDemo = () => {
    stopAllSounds();
    setRunningDemo(null);
    setDemoProgress(0);
  };

  // Theme testing functions
  const runThemeTest = async () => {
    setIsRunningTest(true);

    const results: ThemeTestResults = {
      overallScore: 0,
      categoryScores: {},
      issues: [],
      recommendations: [],
    };

    // Test each category
    const categories = ['UI', 'Notification', 'Alarm', 'Ambient'];

    for (const category of categories) {
      const categoryTests = THEME_TESTS.filter(t => t.category === category);
      let categoryScore = 0;

      for (const test of categoryTests) {
        try {
          const soundUrl = await getSoundUrl(test);
          if (soundUrl) {
            categoryScore += 25; // Each working sound adds to score
          } else {
            results.issues.push({
              category,
              sound: test.name,
              issue: 'Sound not configured',
              severity: 'medium',
            });
          }
        } catch (_error) {
          results.issues.push({
            category,
            sound: test.name,
            issue: 'Failed to load sound',
            severity: 'high',
          });
        }
      }

      results.categoryScores[category] = Math.min(categoryScore, 100);
    }

    // Calculate overall score
    const scores = Object.values(results.categoryScores);
    results.overallScore =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;

    // Generate recommendations
    if (results.overallScore < 60) {
      results.recommendations.push(
        'Consider configuring more sounds for better _user experience'
      );
    }
    if (results.issues.filter(i => i.severity === 'high').length > 0) {
      results.recommendations.push('Fix critical sound loading issues');
    }
    if (results.categoryScores['UI'] < 80) {
      results.recommendations.push('Ensure all essential UI sounds are configured');
    }

    setTestResults(results);
    onThemeTest?.(results);
    setIsRunningTest(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Global Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Speaker className="w-5 h-5" />
              Preview Controls
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={stopAllSounds}>
                <Square className="w-4 h-4 mr-2" />
                Stop All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsGlobalMuted(!isGlobalMuted)}
              >
                {isGlobalMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-20">Volume:</Label>
              <Slider
                value={[globalVolume]}
                onValueChange={([value]) => setGlobalVolume(value)}
                max={1}
                step={0.01}
                className="flex-1"
              />
              <span className="w-12 text-sm">{Math.round(globalVolume * 100)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Preview Interface */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="p-6 pb-0">
              <TabsList>
                <TabsTrigger value="individual">Individual Sounds</TabsTrigger>
                <TabsTrigger value="sequences">Demo Sequences</TabsTrigger>
                <TabsTrigger value="testing">Theme Testing</TabsTrigger>
              </TabsList>
            </div>

            {/* Individual Sound Testing */}
            <TabsContent value="individual" className="p-6 space-y-4">
              <div className="grid gap-4">
                {['UI', 'Notification', 'Alarm', 'Ambient'].map(category => {
                  const categoryTests = THEME_TESTS.filter(
                    t => t.category === category
                  );
                  return (
                    <Card key={category}>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-base">{category} Sounds</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {categoryTests.map(test => {
                          const state = getPlaybackState(test.id);
                          return (
                            <div
                              key={test.id}
                              className="flex items-center gap-3 p-3 border rounded-lg"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  state.isPlaying
                                    ? pauseSound(test.id)
                                    : playSound(test)
                                }
                              >
                                {state.isPlaying ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </Button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{test.name}</h4>
                                  <Badge variant="secondary" className="text-xs">
                                    {test.category}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {test.description}
                                </p>

                                {state.duration > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>{formatTime(state.currentTime)}</span>
                                      <span>{formatTime(state.duration)}</span>
                                    </div>
                                    <Progress
                                      value={(state.currentTime / state.duration) * 100}
                                      className="h-1"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="w-20">
                                  <Slider
                                    value={[state.volume]}
                                    onValueChange={([value]) => {
                                      updatePlaybackState(test.id, { volume: value });
                                      const audio = audioRefs.current.get(test.id);
                                      if (audio) {
                                        audio.volume =
                                          value *
                                          globalVolume *
                                          (isGlobalMuted ? 0 : 1);
                                      }
                                    }}
                                    max={1}
                                    step={0.01}
                                    className="w-full"
                                  />
                                </div>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newLoop = !state.loop;
                                    updatePlaybackState(test.id, { loop: newLoop });
                                    const audio = audioRefs.current.get(test.id);
                                    if (audio) {
                                      audio.loop = newLoop;
                                    }
                                  }}
                                  className={state.loop ? 'bg-blue-50' : ''}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => stopSound(test.id)}
                                  disabled={!state.isPlaying}
                                >
                                  <Square className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Demo Sequences */}
            <TabsContent value="sequences" className="p-6 space-y-4">
              <div className="space-y-4">
                {DEMO_SCENARIOS.map(demo => (
                  <Card key={demo.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{demo.name}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {demo.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {runningDemo === demo.id ? (
                            <>
                              <div className="w-32">
                                <Progress value={demoProgress} className="h-2" />
                              </div>
                              <Button size="sm" variant="outline" onClick={stopDemo}>
                                <Square className="w-4 h-4 mr-2" />
                                Stop
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => runDemoSequence(demo.id)}
                              disabled={runningDemo !== null}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Run Demo
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {demo.steps.map((step, _index) => (
                          <div key={_index} className="flex items-center gap-3 text-sm">
                            <Badge
                              variant="outline"
                              className="text-xs w-8 h-6 flex items-center justify-center"
                            >
                              {_index + 1}
                            </Badge>
                            <span className="text-gray-500">{step.delay / 1000}s</span>
                            <span className="font-medium">{step.description}</span>
                            <span className="text-gray-500">
                              ({step.duration / 1000}s)
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Theme Testing */}
            <TabsContent value="testing" className="p-6 space-y-6">
              <div className="text-center">
                <TestTube className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-medium mb-2">Theme Quality Testing</h3>
                <p className="text-gray-600 mb-6">
                  Test your theme's completeness and functionality across all sound
                  categories
                </p>

                <Button onClick={runThemeTest} disabled={isRunningTest} size="lg">
                  {isRunningTest ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      Run Theme Test
                    </>
                  )}
                </Button>
              </div>

              {testResults && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Test Results
                      <Badge
                        variant={
                          testResults.overallScore >= 80
                            ? 'default'
                            : testResults.overallScore >= 60
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {Math.round(testResults.overallScore)}%
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Category Scores */}
                    <div>
                      <h4 className="font-medium mb-3">Category Scores</h4>
                      <div className="space-y-2">
                        {Object.entries(testResults.categoryScores).map(
                          ([category, score]) => (
                            <div key={category} className="flex items-center gap-3">
                              <span className="w-20 text-sm">{category}</span>
                              <Progress value={score} className="flex-1" />
                              <span className="w-12 text-sm text-right">
                                {Math.round(score)}%
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Issues */}
                    {testResults.issues.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Issues Found</h4>
                        <div className="space-y-2">
                          {testResults.issues.map((issue, _index) => (
                            <div
                              key={_index}
                              className={`p-3 rounded-lg border ${
                                issue.severity === 'high'
                                  ? 'bg-red-50 border-red-200'
                                  : issue.severity === 'medium'
                                    ? 'bg-yellow-50 border-yellow-200'
                                    : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant={
                                    issue.severity === 'high'
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {issue.severity}
                                </Badge>
                                <span className="font-medium text-sm">
                                  {issue.category} - {issue.sound}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{issue.issue}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {testResults.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Recommendations</h4>
                        <ul className="space-y-1">
                          {testResults.recommendations.map((rec, _index) => (
                            <li
                              key={_index}
                              className="text-sm text-gray-600 flex items-start gap-2"
                            >
                              <span className="text-blue-500 mt-1">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SoundPreviewSystem;
