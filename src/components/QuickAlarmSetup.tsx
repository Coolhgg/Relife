import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, Crown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import type { DayOfWeek } from '../types/index';
import { PremiumGate } from './PremiumGate';
import { SubscriptionService } from '../services/subscription';

interface QuickAlarmSetupProps {
  onAlarmSet: (alarm: {
    time: string;
    label: string;
    days: DayOfWeek[];
    difficulty: string;
    snoozeEnabled: boolean;
  }) => void;
  userId: string;
}

const DAYS = [
  { value: 'monday' as DayOfWeek, short: 'Mon' },
  { value: 'tuesday' as DayOfWeek, short: 'Tue' },
  { value: 'wednesday' as DayOfWeek, short: 'Wed' },
  { value: 'thursday' as DayOfWeek, short: 'Thu' },
  { value: 'friday' as DayOfWeek, short: 'Fri' },
  { value: 'saturday' as DayOfWeek, short: 'Sat' },
  { value: 'sunday' as DayOfWeek, short: 'Sun' },
];

export function QuickAlarmSetup({ onAlarmSet, userId }: QuickAlarmSetupProps) {
  const [hasNuclearMode, setHasNuclearMode] = useState(false);

  // Check premium access on component mount
  useEffect(() => {
    const checkAccess = async () => {
      const access = await SubscriptionService.hasFeatureAccess(userId, 'nuclearMode');
      setHasNuclearMode(access);
    };
    checkAccess();
  }, [userId]);
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState('07:00');
  const [label, setLabel] = useState('Wake up!');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [difficulty, setDifficulty] = useState('medium');
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) return;

    onAlarmSet({
      time,
      label,
      days: selectedDays,
      difficulty,
      snoozeEnabled,
    });

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus size={16} />
          Quick Set
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock size={20} />
            Set New Alarm
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Wake up!"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Repeat Days</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DAYS.map(day => (
                <Badge
                  key={day.value}
                  variant={selectedDays.includes(day.value) ? 'default' : 'secondary'}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => toggleDay(day.value)}
                >
                  {day.short}
                </Badge>
              ))}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-xs text-destructive mt-1">Select at least one day</p>
            )}
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">😴 Easy</SelectItem>
                <SelectItem value="medium">⏰ Medium</SelectItem>
                <SelectItem value="hard">🔥 Hard</SelectItem>
                <SelectItem value="extreme">💀 Extreme</SelectItem>
                {hasNuclearMode ? (
                  <SelectItem value="nuclear">☢️ Nuclear</SelectItem>
                ) : (
                  <div className="px-2 py-1.5 text-sm">
                    <PremiumGate
                      feature="nuclearMode"
                      userId={userId}
                      mode="replace"
                      fallback={
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>☢️ Nuclear</span>
                          <Crown className="h-4 w-4 text-amber-500" />
                        </div>
                      }
                    >
                      <SelectItem value="nuclear">☢️ Nuclear</SelectItem>
                    </PremiumGate>
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="snooze" className="text-sm font-medium">
              Enable Snooze
            </Label>
            <Switch
              id="snooze"
              checked={snoozeEnabled}
              onCheckedChange={setSnoozeEnabled}
            />
          </div>

          <Button type="submit" className="w-full" disabled={selectedDays.length === 0}>
            Set Alarm
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default QuickAlarmSetup;