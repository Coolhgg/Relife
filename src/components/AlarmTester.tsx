import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, TestTube } from 'lucide-react';
import { ActiveAlarm } from './ActiveAlarm';
import type { Alarm, AlarmInstance, AlarmDifficulty } from '../types/index';

interface AlarmTesterProps {
  onClose?: () => void;
}

export function AlarmTester({ onClose }: AlarmTesterProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<AlarmDifficulty>('medium');
  const [showActiveAlarm, setShowActiveAlarm] = useState(false);
  const [battleMode, setBattleMode] = useState(false);

  const testAlarm: Alarm = {
    id: 'test',
    userId: '1',
    time: '07:00',
    days: ['monday'],
    label: 'Test Alarm',
    isActive: true,
    sound: 'default',
    snoozeEnabled: true,
    snoozeInterval: 5,
    difficulty: selectedDifficulty,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const testAlarmInstance: AlarmInstance = {
    id: 'test-instance',
    alarmId: 'test',
    scheduledTime: new Date().toISOString(),
    status: 'pending',
    snoozeCount: 0,
  };

  const handleTestAlarm = () => {
    setShowActiveAlarm(true);
  };

  const handleAlarmResult = (type: string) => {
    setShowActiveAlarm(false);
    // Could show a result toast or modal here
  };

  if (showActiveAlarm) {
    return (
      <ActiveAlarm
        alarm={testAlarm}
        alarmInstance={testAlarmInstance}
        battleMode={battleMode}
        onSnooze={(count) => {
          console.log('Snoozed', count);
          handleAlarmResult('snooze');
        }}
        onDismiss={(time, snoozeCount) => {
          console.log('Dismissed at', time, 'after', snoozeCount, 'snoozes');
          handleAlarmResult('dismiss');
        }}
        onMiss={() => {
          console.log('Alarm missed');
          handleAlarmResult('miss');
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test Alarm Experience
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Test Difficulty Level
          </label>
          <Select value={selectedDifficulty} onValueChange={(value) => setSelectedDifficulty(value as AlarmDifficulty)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">
                <div className="flex items-center gap-2">
                  <span>😴</span>
                  <div>
                    <div>Easy</div>
                    <div className="text-xs text-muted-foreground">Simple dismiss</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <span>⏰</span>
                  <div>
                    <div>Medium</div>
                    <div className="text-xs text-muted-foreground">Math problem</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="hard">
                <div className="flex items-center gap-2">
                  <span>🔥</span>
                  <div>
                    <div>Hard</div>
                    <div className="text-xs text-muted-foreground">Multiple tasks</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="extreme">
                <div className="flex items-center gap-2">
                  <span>💀</span>
                  <div>
                    <div>Extreme</div>
                    <div className="text-xs text-muted-foreground">Photo proof + tasks</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="battle-mode"
              checked={battleMode}
              onChange={(e) => setBattleMode(e.target.checked)}
            />
            <label htmlFor="battle-mode" className="text-sm font-medium">
              Battle Mode
            </label>
          </div>
          {battleMode && (
            <p className="text-xs text-muted-foreground">
              Simulates being in a competitive alarm battle with friends
            </p>
          )}
        </div>

        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <strong>What you'll experience:</strong>
          <ul className="mt-2 space-y-1 text-xs">
            {selectedDifficulty === 'easy' && <li>• Simple one-tap dismiss</li>}
            {selectedDifficulty === 'medium' && <li>• Solve a math problem to dismiss</li>}
            {selectedDifficulty === 'hard' && <li>• Complete 2 physical tasks</li>}
            {selectedDifficulty === 'extreme' && <li>• Complete 3 tasks including photo proof</li>}
            <li>• 30 second timeout (auto-miss)</li>
            <li>• Snooze option (max 3 times)</li>
          </ul>
        </div>

        <Button onClick={handleTestAlarm} className="w-full gap-2">
          <Play className="h-4 w-4" />
          Trigger Test Alarm
        </Button>

        {onClose && (
          <Button variant="outline" onClick={onClose} className="w-full">
            Close Tester
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default AlarmTester;