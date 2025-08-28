import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useSmartFeaturesAnnouncements } from '../hooks/useSmartFeaturesAnnouncements';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  MapPin,
  Activity,
  Zap,
  Target,
  Footprints,
  Heart,
  Navigation,
  Timer,
  Trophy,
  Settings,
  Smartphone,
  Wifi,
  AlertCircle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import type {
  User as UserType,
  WeatherData,
  LocationChallenge,
  FitnessIntegration,
  FitnessChallenge,
  SmartAlarmSettings,
  ContextualTask,
} from '../types/index';

interface SmartFeaturesProps {
  currentUser: UserType;
  weatherData?: WeatherData;
  locationChallenges: LocationChallenge[];
  fitnessIntegrations: FitnessIntegration[];
  fitnessChallenges: FitnessChallenge[];
  smartSettings: SmartAlarmSettings;
  contextualTasks: ContextualTask[];
  onUpdateSettings?: (settings: Partial<SmartAlarmSettings>) => void;
  onCreateLocationChallenge?: (challenge: Partial<LocationChallenge>) => void;
  onConnectFitness?: (provider: string) => void;
}

// Mock data for smart features
const MOCK_WEATHER: WeatherData = {
  temperature: 22,
  condition: 'partly_cloudy',
  humidity: 65,
  windSpeed: 12,
  location: 'San Francisco, CA',
  lastUpdated: new Date().toISOString(),
  forecast: [
    { time: '06:00', temperature: 18, condition: 'cloudy', precipitation: 10 },
    { time: '09:00', temperature: 22, condition: 'partly_cloudy', precipitation: 0 },
    { time: '12:00', temperature: 26, condition: 'sunny', precipitation: 0 },
    { time: '15:00', temperature: 24, condition: 'sunny', precipitation: 0 },
  ],
};

const MOCK_LOCATION_CHALLENGES: LocationChallenge[] = [
  {
    id: '1',
    name: 'Morning Coffee Run',
    description: 'Visit your favorite coffee shop before 8:00 AM',
    type: 'visit_place',
    targetLocation: {
      latitude: 37.7749,
      longitude: -122.4194,
      name: 'Blue Bottle Coffee',
    },
    radius: 50,
    timeLimit: 30,
    rewards: [
      { type: 'experience', value: 150, description: '150 XP' },
      { type: 'badge', value: 'Coffee Enthusiast', description: 'Coffee Badge' },
    ],
    status: 'active',
    startedAt: new Date().toISOString(),
    progress: {
      distanceToTarget: 250,
      timeInRadius: 0,
    },
  },
  {
    id: '2',
    name: 'Stay Active',
    description: 'Stay within 200m of the gym for 45 minutes',
    type: 'stay_duration',
    targetLocation: { latitude: 37.7849, longitude: -122.4094, name: 'FitLife Gym' },
    radius: 200,
    timeLimit: 60,
    rewards: [
      { type: 'experience', value: 200, description: '200 XP' },
      { type: 'bonus_xp', value: 50, description: '50 Bonus XP' },
    ],
    status: 'completed',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 900000).toISOString(),
    progress: {
      timeInRadius: 45,
      currentLocation: { latitude: 37.7849, longitude: -122.4094 },
    },
  },
];

const MOCK_FITNESS_INTEGRATIONS: FitnessIntegration[] = [
  {
    id: '1',
    userId: 'user1',
    provider: 'apple_health',
    isConnected: true,
    lastSync: new Date(Date.now() - 300000).toISOString(),
    permissions: ['steps', 'sleep', 'heart_rate', 'activity'],
    data: {
      steps: 8547,
      sleepHours: 7.5,
      heartRate: 72,
      activeMinutes: 45,
      distance: 6200,
      caloriesBurned: 342,
      date: new Date().toISOString().split('T')[0],
    },
  },
];

const MOCK_FITNESS_CHALLENGES: FitnessChallenge[] = [
  {
    id: 'fit1',
    date: new Date().toISOString().split('T')[0],
    name: '10K Steps Challenge',
    description: 'Walk 10,000 steps today',
    type: 'task_master',
    difficulty: 'medium',
    target: 10000,
    progress: 8547,
    fitnessType: 'steps',
    targetValue: 10000,
    currentValue: 8547,
    unit: 'steps',
    integration: 'apple_health',
    rewards: [
      { type: 'experience', value: 100, description: '100 XP' },
      { type: 'badge', value: 'Step Master', description: 'Daily Steps Badge' },
    ],
    completed: false,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_SMART_SETTINGS: SmartAlarmSettings = {
  weatherEnabled: true,
  locationEnabled: true,
  fitnessEnabled: true,
  smartWakeWindow: 30,
  adaptiveDifficulty: true,
  contextualTasks: true,
  environmentalAdjustments: true,
};

const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case 'sunny':
      return <Sun className="h-5 w-5 text-yellow-500" />;
    case 'partly_cloudy':
      return <Cloud className="h-5 w-5 text-gray-400" />;
    case 'cloudy':
      return <Cloud className="h-5 w-5 text-gray-500" />;
    case 'rainy':
      return <CloudRain className="h-5 w-5 text-blue-500" />;
    default:
      return <Cloud className="h-5 w-5 text-gray-400" />;
  }
};

const getLocationStatusColor = (status: LocationChallenge['status']) => {
  switch (status) {
    case 'active':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'expired':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function SmartFeatures({
  currentUser,
  weatherData = MOCK_WEATHER,
  locationChallenges = MOCK_LOCATION_CHALLENGES,
  fitnessIntegrations = MOCK_FITNESS_INTEGRATIONS,
  fitnessChallenges = MOCK_FITNESS_CHALLENGES,
  smartSettings = MOCK_SMART_SETTINGS,
  contextualTasks = [],
  onUpdateSettings,
  onCreateLocationChallenge,
  onConnectFitness,
}: SmartFeaturesProps) {
  const {
    announceTabChange,
    announceWeatherUpdate,
    announceWeatherAdjustment,
    announceLocationChallengeStatus,
    announceLocationProgress,
    announceFitnessDataUpdate,
    announceFitnessIntegration,
    announceFitnessChallengeProgress,
    announceSettingChange,
    announcePermissionStatus,
    announceCreateChallenge,
    announceConnectFitnessApp,
    announceNavigateToChallenge,
    announceDetailedWeather,
    announceDetailedChallenge,
    announceDetailedFitnessChallenge,
  } = useSmartFeaturesAnnouncements();

  const [selectedTab, setSelectedTab] = useState('weather');
  const [settings, setSettings] = useState(smartSettings);

  const handleSettingChange = (
    key: keyof SmartAlarmSettings,
    value: boolean | number
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onUpdateSettings?.(newSettings);

    // Announce setting changes with descriptions
    const settingDescriptions: Record<string, string> = {
      weatherEnabled: 'Alarm adjustments based on weather conditions',
      locationEnabled: 'Location-based wake-up challenges',
      fitnessEnabled: 'Health and fitness app integration',
      adaptiveDifficulty: 'Automatic challenge difficulty adjustment',
      smartWakeWindow: 'Smart wake window for optimal sleep cycles',
      contextualTasks: 'Context-aware task suggestions',
      environmentalAdjustments: 'Environmental condition adjustments',
    };

    const description = settingDescriptions[key] || 'Smart alarm feature';
    announceSettingChange(
      key.replace(/([A-Z])/g, ' $1').toLowerCase(),
      value,
      description
    );
  };

  const handleTabChange = (tabName: string) => {
    setSelectedTab(tabName);
    announceTabChange(tabName);
  };

  const handleCreateLocationChallenge = () => {
    announceCreateChallenge();
    onCreateLocationChallenge?.({
      name: 'New Challenge',
      type: 'visit_place',
    });
  };

  const handleConnectFitness = (provider: string) => {
    announceConnectFitnessApp(provider);
    onConnectFitness?.(provider);
  };

  const handleNavigateToChallenge = (challenge: LocationChallenge) => {
    announceNavigateToChallenge(challenge.name, challenge.targetLocation.name);
  };

  const activeChallenges = locationChallenges.filter(c => c.status === 'active');
  const completedChallenges = locationChallenges.filter(c => c.status === 'completed');

  const connectedIntegrations = fitnessIntegrations.filter(f => f.isConnected);
  const totalFitnessData = connectedIntegrations.reduce(
    (acc, integration) => ({
      steps: acc.steps + integration.data.steps,
      sleepHours: Math.max(acc.sleepHours, integration.data.sleepHours),
      activeMinutes: acc.activeMinutes + integration.data.activeMinutes,
      distance: acc.distance + integration.data.distance,
      caloriesBurned: acc.caloriesBurned + integration.data.caloriesBurned,
    }),
    { steps: 0, sleepHours: 0, activeMinutes: 0, distance: 0, caloriesBurned: 0 }
  );

  // Announce data updates when they change
  useEffect(() => {
    if (weatherData) {
      announceWeatherUpdate(weatherData);
    }
  }, [weatherData, announceWeatherUpdate]);

  useEffect(() => {
    if (totalFitnessData.steps > 0) {
      announceFitnessDataUpdate(totalFitnessData);
    }
  }, [
    totalFitnessData.steps,
    totalFitnessData.sleepHours,
    totalFitnessData.activeMinutes,
    totalFitnessData.distance,
    announceFitnessDataUpdate,
  ]);

  useEffect(() => {
    // Announce location challenge status changes
    locationChallenges.forEach(challenge => {
      if (challenge.status === 'completed') {
        announceLocationChallengeStatus(challenge, 'completed');
      } else if (challenge.status === 'failed') {
        announceLocationChallengeStatus(challenge, 'failed');
      }
    });
  }, [locationChallenges, announceLocationChallengeStatus]);

  useEffect(() => {
    // Announce fitness challenge progress
    fitnessChallenges.forEach(challenge => {
      if (challenge.completed) {
        announceFitnessChallengeProgress(challenge);
      }
    });
  }, [fitnessChallenges, announceFitnessChallengeProgress]);

  useEffect(() => {
    // Announce fitness integration status
    fitnessIntegrations.forEach(integration => {
      if (integration.isConnected) {
        announceFitnessIntegration(integration, 'synced');
      }
    });
  }, [fitnessIntegrations, announceFitnessIntegration]);

  return (
    <div className="space-y-6" role="main" aria-label="Smart Features Dashboard">
      {/* Screen reader live region for announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="smart-features-announcements"
      ></div>
      <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
        <TabsList
          className="grid w-full grid-cols-4"
          role="tablist"
          aria-label="Smart Features Navigation"
        >
          <TabsTrigger value="weather" aria-label="Weather-smart alarms and forecasts">
            Weather
          </TabsTrigger>
          <TabsTrigger
            value="location"
            aria-label="Location-based challenges and tracking"
          >
            Location
          </TabsTrigger>
          <TabsTrigger value="fitness" aria-label="Fitness data and health challenges">
            Fitness
          </TabsTrigger>
          <TabsTrigger value="settings" aria-label="Smart alarm configuration settings">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weather" className="space-y-4">
          {/* Current Weather */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getWeatherIcon(weatherData.condition)}
                Weather-Smart Alarms
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-xs"
                  onClick={() => announceDetailedWeather(weatherData)}
                  aria-label="Get detailed weather information"
                >
                  Click to hear details
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{weatherData.temperature}°C</div>
                  <div className="text-sm text-muted-foreground">
                    {weatherData.location}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    <span className="text-sm">
                      Feels like {weatherData.temperature + 2}°C
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Humidity: {weatherData.humidity}%
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-medium mb-2">Tomorrow's Forecast</h4>
                <div className="grid grid-cols-4 gap-2">
                  {weatherData.forecast.map((forecast, _index) => (
                    <div key={_index} className="text-center p-2 bg-muted/50 rounded">
                      {getWeatherIcon(forecast.condition)}
                      <div className="text-xs mt-1">{forecast.time}</div>
                      <div className="text-sm font-bold">{forecast.temperature}°</div>
                      {forecast.precipitation > 0 && (
                        <div className="text-xs text-blue-600">
                          {forecast.precipitation}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather Adjustments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Smart Adjustments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <CloudRain className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Rain Expected</div>
                    <div className="text-sm text-muted-foreground">
                      Your alarm will ring 15 minutes earlier
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">Auto-adjusted</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="font-medium">Sunny Morning</div>
                    <div className="text-sm text-muted-foreground">
                      Perfect weather for your morning run!
                    </div>
                  </div>
                </div>
                <Badge variant="outline">Suggested</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="space-y-4">
          {/* Location Overview */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{completedChallenges.length}</div>
                <div className="text-sm text-muted-foreground">Completed Today</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{activeChallenges.length}</div>
                <div className="text-sm text-muted-foreground">Active Challenges</div>
              </CardContent>
            </Card>
          </div>

          {/* Active Location Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Challenges</span>
                <Button
                  size="sm"
                  onClick={handleCreateLocationChallenge}
                  aria-label="Create new location-based challenge"
                >
                  Create Challenge
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeChallenges.map(challenge => (
                <div key={challenge.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{challenge.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {challenge.description}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 text-xs p-0 h-auto"
                        onClick={() => announceDetailedChallenge(challenge)}
                        aria-label={`Get detailed information about ${challenge.name}`}
                      >
                        Click to hear details
                      </Button>
                    </div>
                    <Badge className={getLocationStatusColor(challenge.status)}>
                      {challenge.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Distance to target</span>
                      <span>{challenge.progress.distanceToTarget}m away</span>
                    </div>
                    {challenge.timeLimit && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Time limit</span>
                        <span>{challenge.timeLimit} minutes</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        +{challenge.rewards[0]?.value} XP
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleNavigateToChallenge(challenge)}
                      aria-label={`Navigate to ${challenge.targetLocation.name}`}
                    >
                      Navigate
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Completed Challenges */}
          {completedChallenges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Completed Today</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {completedChallenges.map(challenge => (
                  <div
                    key={challenge.id}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">{challenge.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Completed at{' '}
                          {new Date(challenge.completedAt!).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold text-green-600">
                        +{challenge.rewards[0]?.value} XP
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fitness" className="space-y-4">
          {/* Fitness Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Today's Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {totalFitnessData.steps.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Steps</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {totalFitnessData.sleepHours}h
                  </div>
                  <div className="text-sm text-muted-foreground">Sleep</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {totalFitnessData.activeMinutes}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Min</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {Math.round((totalFitnessData.distance / 1000) * 10) / 10}km
                  </div>
                  <div className="text-sm text-muted-foreground">Distance</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fitness Integrations */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Apps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {connectedIntegrations.map(integration => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Smartphone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium capitalize">
                        {integration.provider.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Last sync: {new Date(integration.lastSync).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-green-500" />
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                </div>
              ))}

              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleConnectFitness('google_fit')}
                aria-label="Connect additional fitness and health apps"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Connect More Apps
              </Button>
            </CardContent>
          </Card>

          {/* Fitness Challenges */}
          <Card>
            <CardHeader>
              <CardTitle>Fitness Challenges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fitnessChallenges.map(challenge => (
                <div key={challenge.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{challenge.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {challenge.description}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 text-xs p-0 h-auto"
                        onClick={() => announceDetailedFitnessChallenge(challenge)}
                        aria-label={`Get detailed information about ${challenge.name}`}
                      >
                        Click to hear details
                      </Button>
                    </div>
                    <Badge variant={challenge.completed ? 'default' : 'outline'}>
                      {challenge.completed ? 'Complete' : 'Active'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>
                        {challenge.currentValue.toLocaleString()}/
                        {challenge.targetValue.toLocaleString()} {challenge.unit}
                      </span>
                    </div>
                    <Progress
                      value={(challenge.currentValue / challenge.targetValue) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        +{challenge.rewards[0]?.value} XP
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(
                        (challenge.targetValue - challenge.currentValue) /
                          (challenge.targetValue / 100)
                      )}
                      % to go
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Smart Alarm Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weather-enabled">Weather Integration</Label>
                  <p className="text-sm text-muted-foreground">
                    Adjust alarms based on weather conditions
                  </p>
                </div>
                <Switch
                  id="weather-enabled"
                  checked={settings.weatherEnabled}
                  onCheckedChange={(checked: unknown) =>
                    handleSettingChange('weatherEnabled', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="location-enabled">Location Challenges</Label>
                  <p className="text-sm text-muted-foreground">
                    Create location-based wake-up challenges
                  </p>
                </div>
                <Switch
                  id="location-enabled"
                  checked={settings.locationEnabled}
                  onCheckedChange={(checked: unknown) =>
                    handleSettingChange('locationEnabled', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="fitness-enabled">Fitness Integration</Label>
                  <p className="text-sm text-muted-foreground">
                    Connect with health and fitness apps
                  </p>
                </div>
                <Switch
                  id="fitness-enabled"
                  checked={settings.fitnessEnabled}
                  onCheckedChange={(checked: unknown) =>
                    handleSettingChange('fitnessEnabled', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="adaptive-difficulty">Adaptive Difficulty</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically adjust challenge difficulty
                  </p>
                </div>
                <Switch
                  id="adaptive-difficulty"
                  checked={settings.adaptiveDifficulty}
                  onCheckedChange={(checked: unknown) =>
                    handleSettingChange('adaptiveDifficulty', checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smart-wake-window">Smart Wake Window (minutes)</Label>
                <p className="text-sm text-muted-foreground">
                  How early can the alarm wake you for optimal sleep cycles
                </p>
                <Input
                  id="smart-wake-window"
                  type="number"
                  value={settings.smartWakeWindow}
                  onChange={(e: unknown) =>
                    handleSettingChange(
                      'smartWakeWindow',
                      parseInt(e.target.value) || 30
                    )
                  }
                  min="0"
                  max="60"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy & Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium">Location Access</div>
                  <div className="text-sm text-muted-foreground">
                    Required for location challenges
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium">Health Data</div>
                  <div className="text-sm text-muted-foreground">
                    Connected to Apple Health
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircleCircle className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="font-medium">Weather Data</div>
                  <div className="text-sm text-muted-foreground">
                    Enable for weather-based adjustments
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SmartFeatures;
