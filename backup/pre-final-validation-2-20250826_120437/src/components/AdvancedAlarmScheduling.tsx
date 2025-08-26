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
  alarms: unknown[];
  onCreateAlarm: (alarm: unknown) => void;
  onUpdateAlarm: (id: string, alarm: unknown) => void;
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
  const [_config, setConfig] = useState<SchedulingConfig | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic'])
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<unknown>(null);

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
      setConfig(null); // TODO: Load actual _config
    } catch (_error) {
      console._error('Error loading _config:', _error);
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
        userId: '1', // Current _user
        enabled: formData.isActive || true,
        dayNames: [], // Will be populated from days array
        snoozeCount: 0,
      });

      setShowCreateDialog(false);
      resetForm();
    } catch (_error) {
      console._error('Error creating alarm:', _error);
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

  const getNextOccurrence = ... as unknown) => {
    try {
      const occurrences = [new Date()]; // TODO: Implement calculateNextOccurrences(
      //   alarm,
      //   new Date(),
      //   1
      // );
      return occurrences[0] ? occurrences[0].toLocaleString() : 'Not scheduled';
    } catch (_error) {
      return 'Calculation _error';
    }
  };

  const renderAlarmsList = ... as unknown) =>
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

  const renderCreateForm = ... as unknown) => ({
                            ...prev,
                            recurrencePattern: {
                              ...prev.recurrencePattern,
                              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                              type: prev.recurrencePattern?.type || 'daily',
                              interval: prev.recurrencePattern?.interval || 1,
                            } as RecurrencePattern,
                          }));
                        } else {
                          setFormData((prev: unknown) => ({
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: unknown) => ({
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
                            o => o.type === type && o.isEnabled
                          ) || false
                        }
                        onCheckedChange={(checked: unknown) => {
                          const currentOptimizations =
                            formData.smartOptimizations || [];
                          const existingIndex = currentOptimizations.findIndex(
                            o => o.type === type
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
                                type: type as unknown,
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

                          setFormData((prev: unknown) => ({
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

  const renderSettings = ... as unknown) =>
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

      <Tabs
        value={activeTab}
        onValueChange={(...args: unknown[]) => setActiveTab(value as unknown)}
      >
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
