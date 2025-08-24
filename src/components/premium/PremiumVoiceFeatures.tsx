// Premium Voice and AI Features for Relife Alarm App
// Advanced voice recognition, AI coaching, and personalized wake-up experiences

import React, { useState, useEffect } from 'react';
import {
  Mic,
  Bot,
  Speaker,
  MessageSquare,
  Volume2,
  Settings,
  Brain,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Slider } from '../ui/slider';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { FeatureGate } from './FeatureGate';
import { FeatureBadge } from './FeatureUtils';
import useAuth from '../../hooks/useAuth';

interface PremiumVoiceFeaturesProps {
  className?: string;
}

// AI Wake-up Coach Component
function AIWakeUpCoach() {
  const [coachPersonality, setCoachPersonality] = useState<
    'motivational' | 'gentle' | 'drill-sergeant' | 'zen'
  >('motivational');
  const [coachingGoals, setCoachingGoals] = useState<string[]>([
    'fitness',
    'productivity',
  ]);
  const [voiceSettings, setVoiceSettings] = useState({
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8,
  });
  const [customPrompts, setCustomPrompts] = useState<string[]>([]);

  const personalities = {
    motivational: {
      name: 'Motivational Mentor',
      description: 'Energetic and encouraging, focuses on your goals',
      sample: "Good morning, champion! Today's the day to crush your goals!",
    },
    gentle: {
      name: 'Gentle Guide',
      description: 'Calm and supportive, eases you into the day',
      sample: "Good morning, beautiful soul. Let's start this day with kindness.",
    },
    'drill-sergeant': {
      name: 'Drill Sergeant',
      description: 'Tough and direct, no-nonsense approach',
      sample: 'Rise and shine, soldier! Drop and give me twenty!',
    },
    zen: {
      name: 'Zen Master',
      description: 'Peaceful and mindful, promotes inner balance',
      sample: 'Awaken gently, like the sun rising over still waters.',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          AI Wake-up Coach
          <FeatureBadge tier="pro" size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Coach Personality</Label>
          <Select value={coachPersonality} onValueChange={setCoachPersonality}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(personalities).map(([key, personality]
) => (
                <SelectItem key={key} value={key}>
                  {personality.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              {personalities[coachPersonality].description}
            </p>
            <p className="text-sm font-medium text-gray-900">
              Sample: "{personalities[coachPersonality].sample}"
            </p>
          </div>
        </div>

        <div>
          <Label>Voice Settings</Label>
          <div className="space-y-3 mt-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Speed</span>
                <span className="text-sm text-gray-500">{voiceSettings.speed}x</span>
              </div>
              <Slider
                value={[voiceSettings.speed]}
                onValueChange={(value: any
) => 
                  setVoiceSettings((prev: any
) => ({ ...prev, speed: value[0] }))
                }
                min={0.5}
                max={2.0}
                step={0.1}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Pitch</span>
                <span className="text-sm text-gray-500">{voiceSettings.pitch}x</span>
              </div>
              <Slider
                value={[voiceSettings.pitch]}
                onValueChange={(value: any
) => 
                  setVoiceSettings((prev: any
) => ({ ...prev, pitch: value[0] }))
                }
                min={0.5}
                max={2.0}
                step={0.1}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Volume</span>
                <span className="text-sm text-gray-500">
                  {Math.round(voiceSettings.volume * 100)}%
                </span>
              </div>
              <Slider
                value={[voiceSettings.volume]}
                onValueChange={(value: any
) => 
                  setVoiceSettings((prev: any
) => ({ ...prev, volume: value[0] }))
                }
                min={0.1}
                max={1.0}
                step={0.1}
              />
            </div>
          </div>
        </div>

        <div>
          <Label>Coaching Goals</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              'fitness',
              'productivity',
              'mindfulness',
              'learning',
              'creativity',
              'relationships',
            ].map(goal => (
              <div key={goal} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={goal}
                  checked={coachingGoals.includes(goal)}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>)
) => { // auto: implicit any
                    if (e.target.checked) {
                      setCoachingGoals((prev: any
) => [...prev, goal]);
                    } else {
                      setCoachingGoals((prev: any
) => prev.filter((g: any
) => g !== goal));
                    }
                  }}
                />
                <Label htmlFor={goal} className="text-sm capitalize">
                  {goal}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Speaker className="w-4 h-4 mr-2" />
            Test Voice
          </Button>
          <Button className="flex-1">Save Coach Settings</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Voice Command Recognition Component
function VoiceCommandRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [commands, setCommands] = useState([
    { phrase: 'Good morning', action: 'Dismiss alarm' },
    { phrase: 'Snooze for 5 minutes', action: 'Snooze 5min' },
    { phrase: "What's my schedule", action: 'Read calendar' },
    { phrase: 'Weather today', action: 'Weather report' },
    { phrase: 'Start workout mode', action: 'Launch fitness' },
  ]);
  const [newCommand, setNewCommand] = useState({ phrase: '', action: '' });
  const [sensitivity, setSensitivity] = useState(0.7);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-green-600" />
          Voice Command Recognition
          <FeatureBadge tier="premium" size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Voice Recognition</Label>
            <p className="text-sm text-gray-600">
              Control your alarm with voice commands
            </p>
          </div>
          <Switch checked={isListening} onCheckedChange={setIsListening} />
        </div>

        <div>
          <Label>Recognition Sensitivity</Label>
          <div className="mt-2">
            <Slider
              value={[sensitivity]}
              onValueChange={(value: any
) => setSensitivity(value[0])}
              min={0.1}
              max={1.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Low</span>
              <span>{Math.round(sensitivity * 100)}%</span>
              <span>High</span>
            </div>
          </div>
        </div>

        <div>
          <Label>Custom Commands</Label>
          <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
            {commands.map((command, index
) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">"{command.phrase}"</p>
                  <p className="text-sm text-gray-600">{command.action}</p>
                </div>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Add New Command</Label>
          <Input
            placeholder="Say this phrase..."
            value={newCommand.phrase}
            onChange={(e: React.ChangeEvent<HTMLInputElement>)
) => setNewCommand((prev: any
) => ({ ...prev, phrase: e.target.value }))}
          />
          <Input
            placeholder="To do this action..."
            value={newCommand.action}
            onChange={(e: React.ChangeEvent<HTMLInputElement>)
) => setNewCommand((prev: any
) => ({ ...prev, action: e.target.value }))}
          />
          <Button size="sm" className="w-full">
            Add Command
          </Button>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Voice Training</span>
          </div>
          <p className="text-sm text-green-800 mb-2">
            Train your voice profile for better recognition accuracy
          </p>
          <Button size="sm" variant="outline">
            Start Training Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Personalized Audio Messages Component
function PersonalizedAudioMessages() {
  const [messageTypes, setMessageTypes] = useState({
    dailyAffirmations: true,
    weatherUpdate: true,
    calendarPreview: true,
    motivationalQuote: false,
    personalReminders: true,
    newsHeadlines: false,
  });
  const [voiceStyle, setVoiceStyle] = useState('natural');
  const [customMessages, setCustomMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          Personalized Audio Messages
          <FeatureBadge tier="premium" size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Message Types</Label>
          <div className="space-y-2 mt-2">
            {Object.entries(messageTypes).map(([key, enabled]
) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked: any
) => 
                    setMessageTypes((prev: any
) => ({ ...prev, [key]: checked }))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Voice Style</Label>
          <Select value={voiceStyle} onValueChange={setVoiceStyle}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="natural">Natural Conversation</SelectItem>
              <SelectItem value="news">News Anchor Style</SelectItem>
              <SelectItem value="casual">Casual Friend</SelectItem>
              <SelectItem value="professional">Professional Assistant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Custom Morning Messages</Label>
          <div className="space-y-2 mt-2">
            {customMessages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No custom messages yet
              </p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {customMessages.map((message, index
) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span className="text-sm">{message}</span>
                    <Button variant="ghost" size="sm">
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a personal message..."
              value={newMessage}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>)
) => setNewMessage(e.target.value)}
            />
            <Button
              size="sm"
              onClick={(
) => {
                if (newMessage.trim()) {
                  setCustomMessages((prev: any
) => [...prev, newMessage]);
                  setNewMessage('');
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">AI Generation</span>
          </div>
          <p className="text-sm text-purple-800 mb-2">
            Let AI create personalized messages based on your preferences and daily
            context
          </p>
          <Button size="sm" variant="outline">
            Generate AI Messages
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Voice-Controlled Snooze Component
function VoiceControlledSnooze() {
  const [snoozeCommands, setSnoozeCommands] = useState({
    'five more minutes': 5,
    'just a bit longer': 10,
    'ten minutes please': 10,
    'fifteen minutes': 15,
    'half hour': 30,
  });
  const [customSnoozeTime, setCustomSnoozeTime] = useState(5);
  const [voiceConfirmation, setVoiceConfirmation] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-orange-600" />
          Voice-Controlled Snooze
          <FeatureBadge tier="basic" size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Snooze Commands</Label>
          <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
            {Object.entries(snoozeCommands).map(([phrase, minutes]
) => (
              <div
                key={phrase}
                className="flex items-center justify-between p-2 border rounded"
              >
                <span className="text-sm">"{phrase}"</span>
                <Badge variant="outline">{minutes} min</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Voice Confirmation</Label>
            <p className="text-sm text-gray-600">
              Confirm snooze time with voice feedback
            </p>
          </div>
          <Switch checked={voiceConfirmation} onCheckedChange={setVoiceConfirmation} />
        </div>

        <div>
          <Label>Quick Snooze Time</Label>
          <div className="mt-2">
            <Slider
              value={[customSnoozeTime]}
              onValueChange={(value: any
) => setCustomSnoozeTime(value[0])}
              min={1}
              max={60}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>1 min</span>
              <span>{customSnoozeTime} minutes</span>
              <span>60 min</span>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-3 rounded-lg">
          <h5 className="font-semibold text-orange-900 mb-2">Smart Snooze Features</h5>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Switch />
              <span className="text-sm text-orange-800">Adaptive snooze duration</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch />
              <span className="text-sm text-orange-800">Snooze pattern learning</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch />
              <span className="text-sm text-orange-800">Maximum snooze limit</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Voice Profile Training Component
function VoiceProfileTraining() {
  const [trainingProgress, setTrainingProgress] = useState(65);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const trainingPhrases = [
    'Good morning, wake me up',
    'Snooze for five minutes',
    'Turn off the alarm',
    "What's the weather today",
    'Show my schedule',
    "I'm awake now",
    'Set alarm for tomorrow',
    'Play my morning playlist',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          Voice Profile Training
          <FeatureBadge tier="premium" size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Training Progress</Label>
            <span className="text-sm text-gray-600">{trainingProgress}%</span>
          </div>
          <Progress value={trainingProgress} className="w-full" />
          <p className="text-sm text-gray-600 mt-1">
            {trainingProgress < 100
              ? 'Continue training for better recognition'
              : 'Voice profile complete!'}
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="text-center">
            <h4 className="font-semibold mb-2">
              Training Phrase {currentPhrase + 1} of {trainingPhrases.length}
            </h4>
            <p className="text-lg text-gray-900 mb-4">
              "{trainingPhrases[currentPhrase]}"
            </p>

            <div className="flex justify-center mb-4">
              <Button
                size="lg"
                variant={isRecording ? 'destructive' : 'default'}
                className="rounded-full w-16 h-16"
                onClick={(
) => setIsRecording(!isRecording)}
              >
                <Mic className={`w-6 h-6 ${isRecording ? 'animate-pulse' : ''}`} />
              </Button>
            </div>

            <p className="text-sm text-gray-600">
              {isRecording ? 'Recording... Speak clearly' : 'Tap to record this phrase'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            disabled={currentPhrase === 0}
            onClick={(
) => setCurrentPhrase(Math.max(0, currentPhrase - 1))}
          >
            Previous
          </Button>
          <Button
            disabled={currentPhrase === trainingPhrases.length - 1}
            onClick={(
) =>
              setCurrentPhrase(Math.min(trainingPhrases.length - 1, currentPhrase + 1))
            }
          >
            Next
          </Button>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Pro Tips</span>
          </div>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Record in a quiet environment</li>
            <li>• Speak naturally and clearly</li>
            <li>• Train at different times for variety</li>
            <li>• Re-train if recognition accuracy drops</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Premium Voice Features Component
export function PremiumVoiceFeatures({ className = '' }: PremiumVoiceFeaturesProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-600">Sign in to access premium voice features</p>
      </div>
    );
  }

  return (
    <FeatureGate feature="voice_features" userId={user.id} showUpgradePrompt>
      <div className={`space-y-6 ${className}`}>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Premium Voice & AI Features</h2>
          <p className="text-gray-600">
            Transform your wake-up experience with advanced voice recognition and AI
            coaching
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIWakeUpCoach />
          <VoiceCommandRecognition />
          <PersonalizedAudioMessages />
          <VoiceControlledSnooze />
          <VoiceProfileTraining />
        </div>
      </div>
    </FeatureGate>
  );
}

export default PremiumVoiceFeatures;
