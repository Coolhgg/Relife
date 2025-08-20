// Premium Alarm Features for Relife Alarm App
// Advanced alarm functionality exclusive to premium subscribers

import React, { useState, useEffect } from "react";
import {
  Clock,
  Zap,
  Brain,
  Music,
  Users,
  Calendar,
  MapPin,
  Cloud,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Slider } from "../ui/slider";
import { FeatureGate } from "./FeatureGate";
import { FeatureBadge } from "./FeatureUtils";
import useAuth from "../../hooks/useAuth";
import useFeatureGate from "../../hooks/useFeatureGate";
import type { Alarm } from "../../types";

interface PremiumAlarmFeaturesProps {
  alarm?: Alarm;
  onUpdate: (updates: Partial<Alarm>) => void;
  className?: string;
}

// Smart Wake-Up Feature (Premium)
function SmartWakeUpFeature({
  alarm,
  onUpdate,
}: {
  alarm?: Alarm;
  onUpdate: (updates: Partial<Alarm>) => void;
}) {
  const { user } = useAuth();
  const [smartWindow, setSmartWindow] = useState(30); // minutes
  const [sleepPhaseOptimization, setSleepPhaseOptimization] = useState(true);
  const [weatherAdaptation, setWeatherAdaptation] = useState(false);

  return (
    <FeatureGate
      feature="smart_wakeup"
      userId={user?.id || ""}
      showUpgradePrompt
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Smart Wake-Up
            <FeatureBadge tier="premium" size="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Smart Wake-Up Window</Label>
            <div className="mt-2">
              <Slider
                value={[smartWindow]}
                onValueChange={(value) => setSmartWindow(value[0])}
                max={60}
                min={5}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>5 min</span>
                <span>{smartWindow} minutes</span>
                <span>60 min</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Wake you during the lightest sleep phase within this window
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Sleep Phase Optimization</Label>
              <p className="text-sm text-gray-600">
                Analyze sleep patterns for optimal wake time
              </p>
            </div>
            <Switch
              checked={sleepPhaseOptimization}
              onCheckedChange={setSleepPhaseOptimization}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Weather Adaptation</Label>
              <p className="text-sm text-gray-600">
                Adjust wake time based on weather conditions
              </p>
            </div>
            <Switch
              checked={weatherAdaptation}
              onCheckedChange={setWeatherAdaptation}
            />
          </div>

          <Button
            onClick={() =>
              onUpdate({
                smartWakeup: {
                  enabled: true,
                  window: smartWindow,
                  sleepPhaseOptimization,
                  weatherAdaptation,
                },
              })
            }
            className="w-full"
          >
            Enable Smart Wake-Up
          </Button>
        </CardContent>
      </Card>
    </FeatureGate>
  );
}

// Advanced Scheduling Feature (Premium)
function AdvancedSchedulingFeature({
  alarm,
  onUpdate,
}: {
  alarm?: Alarm;
  onUpdate: (updates: Partial<Alarm>) => void;
}) {
  const { user } = useAuth();
  const [scheduleType, setScheduleType] = useState<
    "complex" | "conditional" | "dynamic"
  >("complex");
  const [conditions, setConditions] = useState<string[]>([]);

  return (
    <FeatureGate
      feature="advanced_scheduling"
      userId={user?.id || ""}
      showUpgradePrompt
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Advanced Scheduling
            <FeatureBadge tier="premium" size="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Schedule Type</Label>
            <Select value={scheduleType} onValueChange={setScheduleType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="complex">Complex Patterns</SelectItem>
                <SelectItem value="conditional">
                  Conditional Triggers
                </SelectItem>
                <SelectItem value="dynamic">Dynamic Adaptation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scheduleType === "complex" && (
            <div className="space-y-3">
              <Label>Complex Pattern Settings</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Every N days</Label>
                  <Input type="number" placeholder="3" />
                </div>
                <div>
                  <Label className="text-sm">Skip weekends</Label>
                  <Switch />
                </div>
                <div>
                  <Label className="text-sm">Holiday adjustments</Label>
                  <Switch />
                </div>
                <div>
                  <Label className="text-sm">Season-based timing</Label>
                  <Switch />
                </div>
              </div>
            </div>
          )}

          {scheduleType === "conditional" && (
            <div className="space-y-3">
              <Label>Conditional Triggers</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Only if calendar has events</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Weather-based conditions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Location-based triggers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Sleep quality threshold</span>
                </div>
              </div>
            </div>
          )}

          {scheduleType === "dynamic" && (
            <div className="space-y-3">
              <Label>Dynamic Adaptation</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Learn from snooze patterns</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Adapt to schedule changes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">AI-powered optimization</span>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={() =>
              onUpdate({
                advancedScheduling: {
                  enabled: true,
                  type: scheduleType,
                  conditions,
                },
              })
            }
            className="w-full"
          >
            Apply Advanced Scheduling
          </Button>
        </CardContent>
      </Card>
    </FeatureGate>
  );
}

// Custom Sound Library Feature (Premium)
function CustomSoundLibraryFeature({
  alarm,
  onUpdate,
}: {
  alarm?: Alarm;
  onUpdate: (updates: Partial<Alarm>) => void;
}) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("nature");
  const [uploadedSounds, setUploadedSounds] = useState<string[]>([]);

  const soundCategories = {
    nature: ["Rain", "Ocean Waves", "Birds", "Forest", "Thunder"],
    music: ["Classical", "Ambient", "Lo-fi", "Jazz", "Meditation"],
    voice: [
      "Personal Recording",
      "Motivational",
      "Affirmations",
      "Language Learning",
    ],
    binaural: ["Alpha Waves", "Beta Waves", "Gamma Waves", "Delta Waves"],
    custom: uploadedSounds,
  };

  return (
    <FeatureGate
      feature="custom_sounds"
      userId={user?.id || ""}
      showUpgradePrompt
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-green-600" />
            Custom Sound Library
            <FeatureBadge tier="basic" size="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Sound Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nature">Nature Sounds</SelectItem>
                <SelectItem value="music">Music & Melodies</SelectItem>
                <SelectItem value="voice">Voice & Speech</SelectItem>
                <SelectItem value="binaural">Binaural Beats</SelectItem>
                <SelectItem value="custom">My Uploads</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {soundCategories[
              selectedCategory as keyof typeof soundCategories
            ].map((sound) => (
              <Button
                key={sound}
                variant="outline"
                size="sm"
                className="h-12 text-left justify-start"
                onClick={() => onUpdate({ customSound: sound })}
              >
                <Music className="w-4 h-4 mr-2" />
                {sound}
              </Button>
            ))}
          </div>

          {selectedCategory === "custom" && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Cloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Upload your own sound files
              </p>
              <Button variant="outline" size="sm">
                Choose Files
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                MP3, WAV, M4A up to 10MB
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Label className="text-sm">Sound Mixing</Label>
            <FeatureBadge tier="premium" size="xs" />
          </div>
          <div className="flex items-center gap-2">
            <Switch />
            <span className="text-sm">Layer multiple sounds</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch />
            <span className="text-sm">Gradual volume increase</span>
          </div>
        </CardContent>
      </Card>
    </FeatureGate>
  );
}

// Enhanced Battle Mode Feature (Pro)
function EnhancedBattleModeFeature({
  alarm,
  onUpdate,
}: {
  alarm?: Alarm;
  onUpdate: (updates: Partial<Alarm>) => void;
}) {
  const { user } = useAuth();
  const [battleType, setBattleType] = useState<"team" | "tournament" | "ai">(
    "team",
  );
  const [difficulty, setDifficulty] = useState<
    "adaptive" | "extreme" | "impossible"
  >("adaptive");

  return (
    <FeatureGate
      feature="enhanced_battles"
      userId={user?.id || ""}
      showUpgradePrompt
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Enhanced Battle Mode
            <FeatureBadge tier="pro" size="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Battle Type</Label>
            <Select value={battleType} onValueChange={setBattleType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Team Battles</SelectItem>
                <SelectItem value="tournament">Tournament Mode</SelectItem>
                <SelectItem value="ai">AI Opponent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Difficulty Level</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adaptive">
                  Adaptive (learns from you)
                </SelectItem>
                <SelectItem value="extreme">Extreme Challenge</SelectItem>
                <SelectItem value="impossible">Impossible Mode</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {battleType === "team" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <Label>Team Features</Label>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Create wake-up groups</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Shared battle objectives</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Team leaderboards</span>
                </div>
              </div>
            </div>
          )}

          {battleType === "tournament" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Tournament Settings</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Duration (days)</Label>
                  <Input type="number" placeholder="7" />
                </div>
                <div>
                  <Label className="text-sm">Max participants</Label>
                  <Input type="number" placeholder="100" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch />
                <span className="text-sm">Prize rewards</span>
              </div>
            </div>
          )}

          {battleType === "ai" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <Label>AI Opponent Features</Label>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Personality adaptation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Dynamic difficulty scaling</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Trash talking mode</span>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={() =>
              onUpdate({
                enhancedBattles: {
                  enabled: true,
                  type: battleType,
                  difficulty,
                },
              })
            }
            className="w-full"
          >
            Enable Enhanced Battles
          </Button>
        </CardContent>
      </Card>
    </FeatureGate>
  );
}

// Location-Based Alarms Feature (Premium)
function LocationBasedAlarmsFeature({
  alarm,
  onUpdate,
}: {
  alarm?: Alarm;
  onUpdate: (updates: Partial<Alarm>) => void;
}) {
  const { user } = useAuth();
  const [locations, setLocations] = useState<
    Array<{ name: string; address: string; radius: number }>
  >([]);
  const [trigger, setTrigger] = useState<"arrive" | "leave" | "both">("arrive");

  return (
    <FeatureGate
      feature="location_alarms"
      userId={user?.id || ""}
      showUpgradePrompt
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            Location-Based Alarms
            <FeatureBadge tier="premium" size="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Trigger Type</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="arrive">
                  When arriving at location
                </SelectItem>
                <SelectItem value="leave">When leaving location</SelectItem>
                <SelectItem value="both">Both arrive and leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Monitored Locations</Label>
            {locations.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No locations added yet</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Add Location
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {locations.map((location, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-gray-600">
                        {location.address}
                      </p>
                      <p className="text-xs text-gray-500">
                        Radius: {location.radius}m
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch />
              <span className="text-sm">Background location tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch />
              <span className="text-sm">Battery optimization</span>
            </div>
          </div>

          <Button
            onClick={() =>
              onUpdate({
                locationBased: {
                  enabled: true,
                  locations,
                  trigger,
                },
              })
            }
            className="w-full"
          >
            Enable Location Alarms
          </Button>
        </CardContent>
      </Card>
    </FeatureGate>
  );
}

// Main Premium Alarm Features Component
export function PremiumAlarmFeatures({
  alarm,
  onUpdate,
  className = "",
}: PremiumAlarmFeaturesProps) {
  const { user } = useAuth();
  const featureGate = useFeatureGate({ userId: user?.id || "" });

  if (!user) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-600">
          Sign in to access premium alarm features
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Premium Alarm Features</h2>
        <p className="text-gray-600">
          Unlock advanced capabilities for the ultimate wake-up experience
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SmartWakeUpFeature alarm={alarm} onUpdate={onUpdate} />
        <AdvancedSchedulingFeature alarm={alarm} onUpdate={onUpdate} />
        <CustomSoundLibraryFeature alarm={alarm} onUpdate={onUpdate} />
        <EnhancedBattleModeFeature alarm={alarm} onUpdate={onUpdate} />
        <LocationBasedAlarmsFeature alarm={alarm} onUpdate={onUpdate} />
      </div>

      {/* Feature Usage Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your Premium Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {featureGate.getFeatureAccess?.("smart_wakeup")?.used || 0}
              </p>
              <p className="text-sm text-gray-600">Smart Alarms</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {featureGate.getFeatureAccess?.("custom_sounds")?.used || 0}
              </p>
              <p className="text-sm text-gray-600">Custom Sounds</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {featureGate.getFeatureAccess?.("enhanced_battles")?.used || 0}
              </p>
              <p className="text-sm text-gray-600">Battle Modes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {featureGate.getFeatureAccess?.("location_alarms")?.used || 0}
              </p>
              <p className="text-sm text-gray-600">Location Alarms</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PremiumAlarmFeatures;
