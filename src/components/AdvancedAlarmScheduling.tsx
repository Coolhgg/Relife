import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  MapPin,
  Brain,
  Repeat,
  Settings,
  Sun,
  Moon,
  Plus,
  Save,
  X,
  Edit3,
  Copy,
  Trash2,
  Download,
  Upload,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Zap,
  Target,
  TrendingUp,
  Sunrise,
  Sunset,
  CloudRain,
  Navigation,
  Smartphone,
  Users,
  Bell,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type {
  RecurrencePattern,
  ConditionalRule,
  LocationTrigger,
  SmartOptimization,
  SeasonalAdjustment,
  CalendarIntegration,
  SchedulingConfig,
  SunSchedule,
} from '../types/index';
interface AdvancedAlarmSchedulingProps {
  alarms: any[];
  onCreateAlarm: (alarm: any) => void;
  onUpdateAlarm: (id: string, alarm: any) => void;
  onDeleteAlarm: (id: string) => void;
}

const AdvancedAlarmScheduling: React.FC<AdvancedAlarmSchedulingProps> = ({
  alarms,
  onCreateAlarm,
  onUpdateAlarm,
  onDeleteAlarm,
}) => {
  const [activeTab, setActiveTab] = useState<'alarms' | 'create' | 'settings' | 'bulk'>(
    'alarms'
  );
  const [config, setConfig] = useState<SchedulingConfig | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic'])
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<any>(null);

  const [formData, setFormData] = useState({
    time: '07:00',
    label: 'New Advanced Alarm',
    scheduleType: 'daily',
    isActive: true,
    days: [1, 2, 3, 4, 5], // Weekdays
    sound: 'default',
    difficulty: 'medium',
    snoozeEnabled: true,
    snoozeInterval: 5,
    voiceMood: 'motivational',
  });

  const loadConfig = async () => {
    try {
      setConfig(null); // TODO: Load actual config
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleCreateAlarm = async () => {
    try {
      // Apply smart optimizations before creating
      const optimizedAlarm = formData; // TODO: Apply smart optimizations

      onCreateAlarm({
        ...optimizedAlarm,
        userId: '1', // Current user
        enabled: formData.isActive || true,
        dayNames: [], // Will be populated from days array
        snoozeCount: 0,
      });

      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating alarm:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      time: '07:00',
      label: 'New Advanced Alarm',
      scheduleType: 'daily',
      isActive: true,
      days: [1, 2, 3, 4, 5],
      sound: 'default',
      difficulty: 'medium',
      snoozeEnabled: true,
      snoozeInterval: 5,
      voiceMood: 'motivational',
    });
    setExpandedSections(new Set(['basic']));
  };

  const formatScheduleType = (type: string) => {
    const types = {
      once: 'One Time',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      custom: 'Custom Pattern',
      conditional: 'Conditional',
      dynamic: 'Smart Dynamic',
    };
    return types[type as keyof typeof types] || type;
  };

  const getNextOccurrence = (alarm: any) => {
    try {
      const occurrences = [new Date()]; // TODO: Implement calculateNextOccurrences(
      //   alarm,
      //   new Date(),
      //   1
      // );
      return occurrences[0] ? occurrences[0].toLocaleString() : 'Not scheduled';
    } catch (error) {
      return 'Calculation error';
    }
  };

  const renderAlarmsList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Advanced Alarms</h3>
          <p className="text-sm text-muted-foreground">
            {alarms.length} active alarms with advanced scheduling
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus size={16} />
          Create Advanced Alarm
        </Button>
      </div>

      {alarms.map(alarm => (
        <Card
          key={alarm.id}
          className={`transition-all ${!alarm.isActive ? 'opacity-60' : ''}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl font-bold">{alarm.time}</div>
                  <div className="flex flex-col">
                    <span className="font-medium">{alarm.label}</span>
                    <Badge variant="secondary" className="w-fit">
                      {formatScheduleType(alarm.scheduleType)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Next: {getNextOccurrence(alarm)}</span>
                  </div>

                  {alarm.smartOptimizations && alarm.smartOptimizations.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Brain size={12} />
                      <span>
                        {
                          alarm.smartOptimizations.filter((o: any) => o.isEnabled)
                            .length
                        }{' '}
                        optimizations
                      </span>
                    </div>
                  )}

                  {alarm.conditionalRules && alarm.conditionalRules.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Zap size={12} />
                      <span>
                        {alarm.conditionalRules.filter((r: any) => r.isActive).length}{' '}
                        conditions
                      </span>
                    </div>
                  )}

                  {alarm.locationTriggers && alarm.locationTriggers.length > 0 && (
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      <span>
                        {alarm.locationTriggers.filter((t: any) => t.isActive).length}{' '}
                        locations
                      </span>
                    </div>
                  )}

                  {alarm.calendarIntegration && alarm.calendarIntegration.isActive && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>Calendar synced</span>
                    </div>
                  )}

                  {alarm.seasonalAdjustments &&
                    alarm.seasonalAdjustments.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Sun size={12} />
                        <span>Seasonal adjustments</span>
                      </div>
                    )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={alarm.isActive}
                  onCheckedChange={checked =>
                    onUpdateAlarm(alarm.id, { isActive: checked })
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAlarm(alarm)}
                >
                  <Edit3 size={14} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteAlarm(alarm.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderCreateForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Create Advanced Alarm</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetForm}>
            <X size={16} className="mr-2" />
            Reset
          </Button>
          <Button onClick={handleCreateAlarm}>
            <Save size={16} className="mr-2" />
            Create Alarm
          </Button>
        </div>
      </div>

      <Accordion
        type="multiple"
        value={Array.from(expandedSections)}
        className="space-y-4"
      >
        {/* Basic Settings */}
        <AccordionItem value="basic" className="border rounded-lg px-4">
          <AccordionTrigger
            onClick={() => toggleSection('basic')}
            className="hover:no-underline"
          >
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span>Basic Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alarm-time">Time</Label>
                <Input
                  id="alarm-time"
                  type="time"
                  value={formData.time}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, time: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="alarm-label">Label</Label>
                <Input
                  id="alarm-label"
                  value={formData.label}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, label: e.target.value }))
                  }
                  placeholder="Enter alarm name"
                />
              </div>
              <div>
                <Label htmlFor="schedule-type">Schedule Type</Label>
                <Select
                  value={formData.scheduleType}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, scheduleType: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">One Time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="custom">Custom Pattern</SelectItem>
                    <SelectItem value="conditional">Conditional</SelectItem>
                    <SelectItem value="dynamic">Smart Dynamic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="voice-mood">Voice Mood</Label>
                <Select
                  value={formData.voiceMood}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, voiceMood: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drill-sergeant">Drill Sergeant 🪖</SelectItem>
                    <SelectItem value="sweet-angel">Sweet Angel 😇</SelectItem>
                    <SelectItem value="anime-hero">Anime Hero 🦸</SelectItem>
                    <SelectItem value="savage-roast">Savage Roast 🔥</SelectItem>
                    <SelectItem value="motivational">Motivational 💪</SelectItem>
                    <SelectItem value="gentle">Gentle 🌸</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={checked =>
                  setFormData(prev => ({ ...prev, isActive: checked }))
                }
              />
              <Label>Enable alarm</Label>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Recurrence Pattern */}
        <AccordionItem value="recurrence" className="border rounded-lg px-4">
          <AccordionTrigger
            onClick={() => toggleSection('recurrence')}
            className="hover:no-underline"
          >
            <div className="flex items-center gap-2">
              <Repeat size={18} />
              <span>Recurrence Pattern</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Repeat Every</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.recurrencePattern?.interval || 1}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        recurrencePattern: {
                          ...prev.recurrencePattern,
                          interval: parseInt(e.target.value) || 1,
                          type: prev.recurrencePattern?.type || 'daily',
                        } as RecurrencePattern,
                      }))
                    }
                    className="w-20"
                  />
                  <Select
                    value={formData.recurrencePattern?.type || 'daily'}
                    onValueChange={value =>
                      setFormData(prev => ({
                        ...prev,
                        recurrencePattern: {
                          ...prev.recurrencePattern,
                          type: value as any,
                          interval: prev.recurrencePattern?.interval || 1,
                        } as RecurrencePattern,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Day(s)</SelectItem>
                      <SelectItem value="weekly">Week(s)</SelectItem>
                      <SelectItem value="monthly">Month(s)</SelectItem>
                      <SelectItem value="yearly">Year(s)</SelectItem>
                      <SelectItem value="workdays">Workdays</SelectItem>
                      <SelectItem value="weekends">Weekends</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>End Condition</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={!!formData.recurrencePattern?.endDate}
                      onCheckedChange={checked => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            recurrencePattern: {
                              ...prev.recurrencePattern,
                              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                              type: prev.recurrencePattern?.type || 'daily',
                              interval: prev.recurrencePattern?.interval || 1,
                            } as RecurrencePattern,
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            recurrencePattern: {
                              ...prev.recurrencePattern,
                              endDate: undefined,
                              type: prev.recurrencePattern?.type || 'daily',
                              interval: prev.recurrencePattern?.interval || 1,
                            } as RecurrencePattern,
                          }));
                        }
                      }}
                    />
                    <Label>End on date</Label>
                  </div>
                  {formData.recurrencePattern?.endDate && (
                    <Input
                      type="date"
                      value={
                        formData.recurrencePattern.endDate.toISOString().split('T')[0]
                      }
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          recurrencePattern: {
                            ...prev.recurrencePattern!,
                            endDate: new Date(e.target.value),
                          },
                        }))
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Smart Optimizations */}
        <AccordionItem value="optimizations" className="border rounded-lg px-4">
          <AccordionTrigger
            onClick={() => toggleSection('optimizations')}
            className="hover:no-underline"
          >
            <div className="flex items-center gap-2">
              <Brain size={18} />
              <span>Smart Optimizations</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  type: 'sleep_cycle',
                  icon: Moon,
                  label: 'Sleep Cycle Optimization',
                  desc: 'Adjust based on sleep patterns',
                },
                {
                  type: 'sunrise_sunset',
                  icon: Sunrise,
                  label: 'Sunrise/Sunset Sync',
                  desc: 'Align with natural light cycles',
                },
                {
                  type: 'traffic_conditions',
                  icon: Navigation,
                  label: 'Traffic Conditions',
                  desc: 'Account for commute times',
                },
                {
                  type: 'weather_forecast',
                  icon: CloudRain,
                  label: 'Weather Forecast',
                  desc: 'Adjust for weather conditions',
                },
                {
                  type: 'energy_levels',
                  icon: TrendingUp,
                  label: 'Energy Level Analysis',
                  desc: 'Optimize for your energy patterns',
                },
                {
                  type: 'workout_schedule',
                  icon: Target,
                  label: 'Workout Integration',
                  desc: 'Coordinate with fitness schedule',
                },
              ].map(({ type, icon: Icon, label, desc }) => (
                <div
                  key={type}
                  className="flex items-start space-x-3 p-3 border rounded-lg"
                >
                  <Icon size={18} className="text-primary mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{label}</span>
                      <Switch
                        checked={
                          formData.smartOptimizations?.some(
                            (o: any) => o.type === type && o.isEnabled
                          ) || false
                        }
                        onCheckedChange={checked => {
                          const currentOptimizations =
                            formData.smartOptimizations || [];
                          const existingIndex = currentOptimizations.findIndex(
                            (o: any) => o.type === type
                          );

                          let newOptimizations;
                          if (existingIndex >= 0) {
                            newOptimizations = [...currentOptimizations];
                            newOptimizations[existingIndex] = {
                              ...newOptimizations[existingIndex],
                              isEnabled: checked,
                            };
                          } else if (checked) {
                            newOptimizations = [
                              ...currentOptimizations,
                              {
                                type: type as any,
                                isEnabled: true,
                                parameters: {
                                  sensitivity: 0.5,
                                  maxAdjustment: 30,
                                  learningEnabled: true,
                                  preferences: {},
                                },
                              },
                            ];
                          } else {
                            newOptimizations = currentOptimizations;
                          }

                          setFormData(prev => ({
                            ...prev,
                            smartOptimizations: newOptimizations,
                          }));
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Location Triggers */}
        <AccordionItem value="location" className="border rounded-lg px-4">
          <AccordionTrigger
            onClick={() => toggleSection('location')}
            className="hover:no-underline"
          >
            <div className="flex items-center gap-2">
              <MapPin size={18} />
              <span>Location Triggers</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Configure location-based triggers for your alarm
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Trigger Type</Label>
                  <Select defaultValue="arrive_home">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enter_location">Enter Location</SelectItem>
                      <SelectItem value="exit_location">Exit Location</SelectItem>
                      <SelectItem value="arrive_home">Arrive Home</SelectItem>
                      <SelectItem value="leave_home">Leave Home</SelectItem>
                      <SelectItem value="arrive_work">Arrive at Work</SelectItem>
                      <SelectItem value="leave_work">Leave Work</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Action</Label>
                  <Select defaultValue="enable_alarm">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enable_alarm">Enable Alarm</SelectItem>
                      <SelectItem value="disable_alarm">Disable Alarm</SelectItem>
                      <SelectItem value="adjust_time">Adjust Time</SelectItem>
                      <SelectItem value="notification">Send Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                <Plus size={16} className="mr-2" />
                Add Location Trigger
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Conditional Rules */}
        <AccordionItem value="conditions" className="border rounded-lg px-4">
          <AccordionTrigger
            onClick={() => toggleSection('conditions')}
            className="hover:no-underline"
          >
            <div className="flex items-center gap-2">
              <Zap size={18} />
              <span>Conditional Rules</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Set up conditions that modify alarm behavior automatically
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>If Condition</Label>
                  <Select defaultValue="weather">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weather">Weather Condition</SelectItem>
                      <SelectItem value="calendar_event">Calendar Event</SelectItem>
                      <SelectItem value="sleep_quality">Sleep Quality</SelectItem>
                      <SelectItem value="day_of_week">Day of Week</SelectItem>
                      <SelectItem value="battery_level">Battery Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Operator</Label>
                  <Select defaultValue="equals">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Then Action</Label>
                  <Select defaultValue="adjust_time">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adjust_time">Adjust Time</SelectItem>
                      <SelectItem value="change_sound">Change Sound</SelectItem>
                      <SelectItem value="skip_alarm">Skip Alarm</SelectItem>
                      <SelectItem value="change_difficulty">
                        Change Difficulty
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                <Plus size={16} className="mr-2" />
                Add Conditional Rule
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Seasonal Adjustments */}
        <AccordionItem value="seasonal" className="border rounded-lg px-4">
          <AccordionTrigger
            onClick={() => toggleSection('seasonal')}
            className="hover:no-underline"
          >
            <div className="flex items-center gap-2">
              <Sun size={18} />
              <span>Seasonal Adjustments</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Automatically adjust alarm times throughout the year
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { season: 'spring', icon: '🌸', adjustment: 0 },
                  { season: 'summer', icon: '☀️', adjustment: 15 },
                  { season: 'fall', icon: '🍁', adjustment: 0 },
                  { season: 'winter', icon: '❄️', adjustment: -15 },
                ].map(({ season, icon, adjustment }) => (
                  <div key={season} className="border rounded-lg p-3 text-center">
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="font-medium capitalize mb-2">{season}</div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={adjustment}
                        onChange={() => {}}
                        className="w-16 text-center"
                      />
                      <span className="text-xs">min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Advanced Scheduling Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure global settings for advanced alarm scheduling
        </p>
      </div>

      {config && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings size={18} />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Default Wake Window (minutes)</Label>
                  <Slider
                    value={[config.defaultWakeWindow]}
                    onValueChange={value =>
                      setConfig(prev =>
                        prev ? { ...prev, defaultWakeWindow: value[0] } : null
                      )
                    }
                    max={120}
                    min={5}
                    step={5}
                    className="mt-2"
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    {config.defaultWakeWindow} minutes before alarm
                  </div>
                </div>

                <div>
                  <Label>Max Daily Adjustment (minutes)</Label>
                  <Slider
                    value={[config.maxDailyAdjustment]}
                    onValueChange={value =>
                      setConfig(prev =>
                        prev ? { ...prev, maxDailyAdjustment: value[0] } : null
                      )
                    }
                    max={180}
                    min={15}
                    step={15}
                    className="mt-2"
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    {config.maxDailyAdjustment} minutes maximum
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Smart Adjustments</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow AI to optimize alarm times
                    </p>
                  </div>
                  <Switch
                    checked={config.enableSmartAdjustments}
                    onCheckedChange={checked =>
                      setConfig(prev =>
                        prev ? { ...prev, enableSmartAdjustments: checked } : null
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Learning Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Improve suggestions based on your patterns
                    </p>
                  </div>
                  <Switch
                    checked={config.learningMode}
                    onCheckedChange={checked =>
                      setConfig(prev =>
                        prev ? { ...prev, learningMode: checked } : null
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Backup Alarms</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically create backup alarms
                    </p>
                  </div>
                  <Switch
                    checked={config.backupAlarms}
                    onCheckedChange={checked =>
                      setConfig(prev =>
                        prev ? { ...prev, backupAlarms: checked } : null
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Privacy Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Limit data collection and sharing
                    </p>
                  </div>
                  <Switch
                    checked={config.privacyMode}
                    onCheckedChange={checked =>
                      setConfig(prev =>
                        prev ? { ...prev, privacyMode: checked } : null
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download size={18} />
                Import & Export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1">
                  <Upload size={16} className="mr-2" />
                  Import Alarms
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download size={16} className="mr-2" />
                  Export Alarms
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Import from other apps or export your alarms for backup
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderBulkOperations = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Bulk Operations</h3>
        <p className="text-sm text-muted-foreground">Manage multiple alarms at once</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copy size={18} />
              Duplicate Alarms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create copies of existing alarms with modifications
            </p>
            <Button className="w-full">Select Alarms to Duplicate</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 size={18} />
              Bulk Edit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Modify multiple alarms simultaneously
            </p>
            <Button className="w-full">Select Alarms to Edit</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={18} />
              Date Range Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Apply changes to alarms in specific date ranges
            </p>
            <Button className="w-full">Select Date Range</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 size={18} />
              Bulk Delete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Remove multiple alarms based on criteria
            </p>
            <Button variant="destructive" className="w-full">
              Select Alarms to Delete
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain size={24} />
            Advanced Alarm Scheduling
          </h2>
          <p className="text-muted-foreground">
            Create intelligent alarms with smart optimizations, conditions, and advanced
            patterns
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alarms" className="flex items-center gap-2">
            <Clock size={16} />
            Alarms
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus size={16} />
            Create
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings size={16} />
            Settings
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Copy size={16} />
            Bulk
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alarms">{renderAlarmsList()}</TabsContent>

        <TabsContent value="create">{renderCreateForm()}</TabsContent>

        <TabsContent value="settings">{renderSettings()}</TabsContent>

        <TabsContent value="bulk">{renderBulkOperations()}</TabsContent>
      </Tabs>

      {/* Create Alarm Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus size={18} />
              Create Advanced Alarm
            </DialogTitle>
          </DialogHeader>
          {renderCreateForm()}
        </DialogContent>
      </Dialog>

      {/* Edit Alarm Dialog */}
      <Dialog open={!!selectedAlarm} onOpenChange={() => setSelectedAlarm(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 size={18} />
              Edit Advanced Alarm
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            Advanced alarm editing interface would be implemented here
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedAlarmScheduling;
