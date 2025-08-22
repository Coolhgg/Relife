import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Clock,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Volume2,
  Repeat,
  Brain,
  Crown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Alarm, DayOfWeek, AlarmDifficulty, VoiceMood } from '../types/index';
import { PremiumGate } from './PremiumGate';
import { SubscriptionService } from '../services/subscription';
import EnhancedSmartAlarmSettings from './EnhancedSmartAlarmSettings';
import { type EnhancedSmartAlarm } from '../services/enhanced-smart-alarm-scheduler';

interface AlarmManagementProps {
  alarms: Alarm[];
  onUpdateAlarm: (id: string, updates: Partial<Alarm>) => void;
  onDeleteAlarm: (id: string) => void;
  onCreateAlarm: (alarm: Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>) => void;
  userId: string;
}

const DAYS = [
  { number: 1, value: 'monday' as DayOfWeek, short: 'Mon', full: 'Monday' },
  { number: 2, value: 'tuesday' as DayOfWeek, short: 'Tue', full: 'Tuesday' },
  { number: 3, value: 'wednesday' as DayOfWeek, short: 'Wed', full: 'Wednesday' },
  { number: 4, value: 'thursday' as DayOfWeek, short: 'Thu', full: 'Thursday' },
  { number: 5, value: 'friday' as DayOfWeek, short: 'Fri', full: 'Friday' },
  { number: 6, value: 'saturday' as DayOfWeek, short: 'Sat', full: 'Saturday' },
  { number: 0, value: 'sunday' as DayOfWeek, short: 'Sun', full: 'Sunday' },
];

const DIFFICULTIES = [
  {
    value: 'easy' as AlarmDifficulty,
    label: 'Easy',
    emoji: '😴',
    description: 'Simple dismiss',
  },
  {
    value: 'medium' as AlarmDifficulty,
    label: 'Medium',
    emoji: '⏰',
    description: 'Math problem',
  },
  {
    value: 'hard' as AlarmDifficulty,
    label: 'Hard',
    emoji: '🔥',
    description: 'Multiple tasks',
  },
  {
    value: 'extreme' as AlarmDifficulty,
    label: 'Extreme',
    emoji: '💀',
    description: 'Photo proof',
  },
  {
    value: 'nuclear' as AlarmDifficulty,
    label: 'Nuclear',
    emoji: '☢️',
    description: 'Ultimate challenge',
    isPremium: true,
  },
];

const SOUNDS = [
  { value: 'default', label: 'Default Beep' },
  { value: 'gentle', label: 'Gentle Chimes' },
  { value: 'nature', label: 'Nature Sounds' },
  { value: 'energetic', label: 'Energetic Beat' },
  { value: 'coffee', label: 'Coffee Shop Ambiance' },
];

export function AlarmManagement({
  alarms,
  onUpdateAlarm,
  onDeleteAlarm,
  onCreateAlarm,
  userId,
}: AlarmManagementProps) {
  const [hasNuclearMode, setHasNuclearMode] = useState(false);

  // Check premium access on component mount
  useEffect(() => {
    const checkAccess = async () => {
      const access = await SubscriptionService.hasFeatureAccess(userId, 'nuclearMode');
      setHasNuclearMode(access);
    };
    checkAccess();
  }, [userId]);
  const [editingAlarm, setEditingAlarm] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSmartSettings, setShowSmartSettings] = useState(false);
  const [selectedAlarmForSmart, setSelectedAlarmForSmart] = useState<Alarm | null>(
    null
  );

  // Form state for editing/creating
  const [formData, setFormData] = useState({
    time: '07:00',
    label: 'New Alarm',
    days: [1, 2, 3, 4, 5], // Monday through Friday as numbers
    sound: 'default',
    snoozeEnabled: true,
    snoozeInterval: 5,
    difficulty: 'medium' as AlarmDifficulty,
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getNextAlarmTime = (alarm: Alarm) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const [hours, minutes] = alarm.time.split(':').map(Number);

    // Find the next occurrence
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date();
      checkDate.setDate(now.getDate() + i);
      checkDate.setHours(hours, minutes, 0, 0);

      const checkDay = Object.keys(dayMap).find(
        key => dayMap[key as keyof typeof dayMap] === checkDate.getDay()
      ) as DayOfWeek;

      const checkDayNumber = dayMap[checkDay as keyof typeof dayMap];
      if (alarm.days.includes(checkDayNumber) && checkDate > now) {
        const diffMs = checkDate.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHours < 24) {
          return `${diffHours}h ${diffMinutes}m`;
        } else {
          const days = Math.floor(diffHours / 24);
          return `${days}d ${diffHours % 24}h`;
        }
      }
    }
    return 'Not scheduled';
  };

  const startEditing = (alarm: Alarm) => {
    setEditingAlarm(alarm.id);
    setFormData({
      time: alarm.time,
      label: alarm.label,
      days: alarm.days,
      sound: alarm.sound,
      snoozeEnabled: alarm.snoozeEnabled,
      snoozeInterval: alarm.snoozeInterval,
      difficulty: alarm.difficulty,
    });
  };

  const handleSave = () => {
    if (editingAlarm) {
      onUpdateAlarm(editingAlarm, formData);
      setEditingAlarm(null);
    } else if (showCreateForm) {
      onCreateAlarm({
        userId: '1', // Current user
        isActive: true,
        enabled: true,
        voiceMood: 'motivational' as VoiceMood,
        snoozeCount: 0,
        dayNames: formData.days.map(dayNum => {
          const dayNames = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
          ];
          return dayNames[dayNum] as DayOfWeek;
        }),
        ...formData,
      });
      setShowCreateForm(false);
      // Reset form
      setFormData({
        time: '07:00',
        label: 'New Alarm',
        days: [1, 2, 3, 4, 5], // Monday through Friday as numbers
        sound: 'default',
        snoozeEnabled: true,
        snoozeInterval: 5,
        difficulty: 'medium' as AlarmDifficulty,
      });
    }
  };

  const handleCancel = () => {
    setEditingAlarm(null);
    setShowCreateForm(false);
  };

  const toggleDay = (dayNumber: number) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(dayNumber)
        ? prev.days.filter(d => d !== dayNumber)
        : [...prev.days, dayNumber].sort(),
    }));
  };

  const getDaysSummary = (days: number[]) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes(6) && !days.includes(0)) return 'Weekdays';
    if (days.length === 2 && days.includes(6) && days.includes(0)) return 'Weekends';
    return days.map(dayNum => DAYS.find(d => d.number === dayNum)?.short).join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">My Alarms</h2>
          <p className="text-sm text-muted-foreground">
            {alarms.length} alarm{alarms.length !== 1 ? 's' : ''} set
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus size={16} />
          New Alarm
        </Button>
      </div>

      {/* Alarms List */}
      <div className="space-y-4">
        {alarms.map(alarm => (
          <Card
            key={alarm.id}
            className={`transition-all ${!alarm.isActive ? 'opacity-60' : ''}`}
          >
            <CardContent className="p-4">
              {editingAlarm === alarm.id ? (
                // Edit Form
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Edit Alarm</h3>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave}>
                        <Save size={16} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Time and Label */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-time" className="text-xs">
                        Time
                      </Label>
                      <Input
                        id="edit-time"
                        type="time"
                        value={formData.time}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, time: e.target.value }))
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-label" className="text-xs">
                        Label
                      </Label>
                      <Input
                        id="edit-label"
                        value={formData.label}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, label: e.target.value }))
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Days */}
                  <div>
                    <Label className="text-xs">Days</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {DAYS.map(day => (
                        <Badge
                          key={day.value}
                          variant={
                            formData.days.includes(day.number) ? 'default' : 'secondary'
                          }
                          className="cursor-pointer text-xs"
                          onClick={() => toggleDay(day.number)}
                        >
                          {day.short}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-sound" className="text-xs">
                        Sound
                      </Label>
                      <Select
                        value={formData.sound}
                        onValueChange={value =>
                          setFormData(prev => ({ ...prev, sound: value }))
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOUNDS.map(sound => (
                            <SelectItem key={sound.value} value={sound.value}>
                              {sound.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-difficulty" className="text-xs">
                        Difficulty
                      </Label>
                      <Select
                        value={formData.difficulty}
                        onValueChange={value =>
                          setFormData(prev => ({
                            ...prev,
                            difficulty: value as AlarmDifficulty,
                          }))
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTIES.map(diff => {
                            if (diff.isPremium && !hasNuclearMode) {
                              return (
                                <div
                                  key={diff.value}
                                  className="px-2 py-1.5 text-sm text-muted-foreground flex items-center justify-between"
                                >
                                  <span>
                                    {diff.emoji} {diff.label}
                                  </span>
                                  <Crown className="h-3 w-3 text-amber-500" />
                                </div>
                              );
                            }
                            return (
                              <SelectItem key={diff.value} value={diff.value}>
                                {diff.emoji} {diff.label}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                // Display View
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{formatTime(alarm.time)}</div>
                      <div className="text-sm text-muted-foreground">{alarm.label}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alarm.isActive}
                        onCheckedChange={checked =>
                          onUpdateAlarm(alarm.id, { isActive: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Repeat size={12} />
                      {getDaysSummary(alarm.days)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Volume2 size={12} />
                      {SOUNDS.find(s => s.value === alarm.sound)?.label}
                    </div>
                    <div className="flex items-center gap-1">
                      {DIFFICULTIES.find(d => d.value === alarm.difficulty)?.emoji}
                      {DIFFICULTIES.find(d => d.value === alarm.difficulty)?.label}
                    </div>
                  </div>

                  {alarm.isActive && (
                    <div className="bg-primary/10 rounded-lg p-2">
                      <div className="text-sm font-medium">
                        Next: {getNextAlarmTime(alarm)}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-muted-foreground">
                      Snooze:{' '}
                      {alarm.snoozeEnabled ? `${alarm.snoozeInterval}min` : 'Disabled'}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedAlarmForSmart(alarm);
                          setShowSmartSettings(true);
                        }}
                        title="Smart Settings"
                      >
                        <Brain size={16} className="text-purple-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(alarm)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteAlarm(alarm.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {alarms.length === 0 && !showCreateForm && (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No alarms set</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first alarm to start waking up on time!
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus size={16} className="mr-2" />
                Create First Alarm
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Form Modal */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Alarm</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="new-time">Time</Label>
                <Input
                  id="new-time"
                  type="time"
                  value={formData.time}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, time: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="new-label">Label</Label>
                <Input
                  id="new-label"
                  value={formData.label}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, label: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <Label>Repeat Days</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS.map(day => (
                  <Badge
                    key={day.value}
                    variant={
                      formData.days.includes(day.number) ? 'default' : 'secondary'
                    }
                    className="cursor-pointer"
                    onClick={() => toggleDay(day.number)}
                  >
                    {day.short}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="new-sound">Sound</Label>
              <Select
                value={formData.sound}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, sound: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOUNDS.map(sound => (
                    <SelectItem key={sound.value} value={sound.value}>
                      {sound.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="new-difficulty">Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    difficulty: value as AlarmDifficulty,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(diff => {
                    if (diff.isPremium && !hasNuclearMode) {
                      return (
                        <div key={diff.value} className="px-2 py-1.5 text-sm">
                          <PremiumGate
                            feature="nuclearMode"
                            userId={userId}
                            mode="replace"
                            fallback={
                              <div className="flex items-center justify-between text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <span>{diff.emoji}</span>
                                  <div>
                                    <div>{diff.label}</div>
                                    <div className="text-xs">{diff.description}</div>
                                  </div>
                                </div>
                                <Crown className="h-4 w-4 text-amber-500" />
                              </div>
                            }
                          >
                            <SelectItem value={diff.value}>
                              <div className="flex items-center gap-2">
                                <span>{diff.emoji}</span>
                                <div>
                                  <div>{diff.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {diff.description}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          </PremiumGate>
                        </div>
                      );
                    }
                    return (
                      <SelectItem key={diff.value} value={diff.value}>
                        <div className="flex items-center gap-2">
                          <span>{diff.emoji}</span>
                          <div>
                            <div>{diff.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {diff.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-snooze">Enable Snooze</Label>
                <Switch
                  id="new-snooze"
                  checked={formData.snoozeEnabled}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, snoozeEnabled: checked }))
                  }
                />
              </div>

              {formData.snoozeEnabled && (
                <div>
                  <Label htmlFor="snooze-interval">Snooze Interval (minutes)</Label>
                  <Select
                    value={formData.snoozeInterval.toString()}
                    onValueChange={value =>
                      setFormData(prev => ({
                        ...prev,
                        snoozeInterval: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minute</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="20">20 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                Create Alarm
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Smart Alarm Settings Modal */}
      <EnhancedSmartAlarmSettings
        isOpen={showSmartSettings}
        onClose={() => {
          setShowSmartSettings(false);
          setSelectedAlarmForSmart(null);
        }}
        alarm={selectedAlarmForSmart as EnhancedSmartAlarm | undefined}
        onSave={async (alarmData: Partial<EnhancedSmartAlarm>) => {
          if (selectedAlarmForSmart) {
            // Update the alarm with enhanced settings
            onUpdateAlarm(selectedAlarmForSmart.id, alarmData);
          }
        }}
      />
    </div>
  );
}

export default AlarmManagement;
