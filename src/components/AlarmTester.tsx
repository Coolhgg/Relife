import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, TestTube, Crown } from 'lucide-react';
import { ActiveAlarm } from './ActiveAlarm';
import type {
  Alarm,
  AlarmInstance,
  AlarmDifficulty,
  VoiceMood,
  DayOfWeek,
} from '../types/index';
import PremiumGate from './PremiumGate';
import { SubscriptionService } from '../services/subscription';

interface AlarmTesterProps {
  onClose?: () => void;
  userId?: string;
}

export function AlarmTester({ onClose, userId = 'demo-user' }: AlarmTesterProps) {
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<AlarmDifficulty>('medium');
  const [hasNuclearMode, setHasNuclearMode] = useState(false);

  // Check premium access on component mount
  useEffect(() => {
    const checkAccess = async () => {
      const access = await SubscriptionService.hasFeatureAccess(userId, 'nuclearMode');
      setHasNuclearMode(access);
    };
    checkAccess();
  }, [userId]);
  const [showActiveAlarm, setShowActiveAlarm] = useState(false);
  const [battleMode, setBattleMode] = useState(false);

  const testAlarm: Alarm = {
    id: 'test',
    userId: '1',
    time: '07:00',
    days: [1], // Monday as number
    dayNames: ['monday' as DayOfWeek],
    label: 'Test Alarm',
    enabled: true,
    isActive: true,
    voiceMood: 'motivational',
    sound: 'default',
    snoozeEnabled: true,
    snoozeInterval: 5,
    snoozeCount: 0,
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

  const handleAlarmResult = (_type: string) => {
    setShowActiveAlarm(false);
    // Could show a result toast or modal here
  };

  if (showActiveAlarm) {
    return (
      <ActiveAlarm
        alarm={testAlarm}
        alarmInstance={testAlarmInstance}
        battleMode={battleMode}
        onSnooze={count => {
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
          <Select
            value={selectedDifficulty}
            onValueChange={(value: any) => setSelectedDifficulty(value as AlarmDifficulty)}
          >
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
                {hasNuclearMode ? (
                  <SelectItem value="nuclear">
                    <div className="flex items-center gap-2">
                      <span>☢️</span>
                      <div>
                        <div>Nuclear</div>
                        <div className="text-xs text-muted-foreground">
                          Ultimate challenge
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ) : (
                  <div className="px-2 py-1.5 text-sm">
                    <PremiumGate
                      feature="nuclearMode"
                      mode="replace"
                      fallback={
                        <div className="flex items-center justify-between text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>☢️</span>
                            <div>
                              <div>Nuclear</div>
                              <div className="text-xs">Ultimate challenge</div>
                            </div>
                          </div>
                          <Crown className="h-4 w-4 text-amber-500" />
                        </div>
                      }
                    >
                      <SelectItem value="nuclear">
                        <div className="flex items-center gap-2">
                          <span>☢️</span>
                          <div>
                            <div>Nuclear</div>
                            <div className="text-xs text-muted-foreground">
                              Ultimate challenge
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </PremiumGate>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {hasNuclearMode ? (
                    <SelectItem value="nuclear">
                      <div className="flex items-center gap-2">
                        <span>☢️</span>
                        <div>
                          <div>Nuclear</div>
                          <div className="text-xs text-muted-foreground">
                            Ultimate challenge
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ) : (
                    <div className="px-2 py-1.5 text-sm">
                      <PremiumGate
                        feature="nuclearMode"
                        mode="replace"
                        fallback={
                          <div className="flex items-center justify-between text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span>☢️</span>
                              <div>
                                <div>Nuclear</div>
                                <div className="text-xs">Ultimate challenge</div>
                              </div>
                            </div>
                            <Crown className="h-4 w-4 text-amber-500" />
                          </div>
                        }
                      >
                        <SelectItem value="nuclear">
                          <div className="flex items-center gap-2">
                            <span>☢️</span>
                            <div>
                              <div>Nuclear</div>
                              <div className="text-xs text-muted-foreground">
                                Ultimate challenge
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      </PremiumGate>
                    </div>
                  )}
                  <span>💀</span>
                  {hasNuclearMode ? (
                    <SelectItem value="nuclear">
                      <div className="flex items-center gap-2">
                        <span>☢️</span>
                        <div>
                          <div>Nuclear</div>
                          <div className="text-xs text-muted-foreground">
                            Ultimate challenge
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ) : (
                    <div className="px-2 py-1.5 text-sm">
                      <PremiumGate
                        feature="nuclearMode"
                        mode="replace"
                        fallback={
                          <div className="flex items-center justify-between text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span>☢️</span>
                              <div>
                                <div>Nuclear</div>
                                <div className="text-xs">Ultimate challenge</div>
                              </div>
                            </div>
                            <Crown className="h-4 w-4 text-amber-500" />
                          </div>
                        }
                      >
                        <SelectItem value="nuclear">
                          <div className="flex items-center gap-2">
                            <span>☢️</span>
                            <div>
                              <div>Nuclear</div>
                              <div className="text-xs text-muted-foreground">
                                Ultimate challenge
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      </PremiumGate>
                    </div>
                  )}
                  <div>
                    {hasNuclearMode ? (
                      <SelectItem value="nuclear">
                        <div className="flex items-center gap-2">
                          <span>☢️</span>
                          <div>
                            <div>Nuclear</div>
                            <div className="text-xs text-muted-foreground">
                              Ultimate challenge
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ) : (
                      <div className="px-2 py-1.5 text-sm">
                        <PremiumGate
                          feature="nuclearMode"
                          mode="replace"
                          fallback={
                            <div className="flex items-center justify-between text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <span>☢️</span>
                                <div>
                                  <div>Nuclear</div>
                                  <div className="text-xs">Ultimate challenge</div>
                                </div>
                              </div>
                              <Crown className="h-4 w-4 text-amber-500" />
                            </div>
                          }
                        >
                          <SelectItem value="nuclear">
                            <div className="flex items-center gap-2">
                              <span>☢️</span>
                              <div>
                                <div>Nuclear</div>
                                <div className="text-xs text-muted-foreground">
                                  Ultimate challenge
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        </PremiumGate>
                      </div>
                    )}
                    <div>Extreme</div>
                    {hasNuclearMode ? (
                      <SelectItem value="nuclear">
                        <div className="flex items-center gap-2">
                          <span>☢️</span>
                          <div>
                            <div>Nuclear</div>
                            <div className="text-xs text-muted-foreground">
                              Ultimate challenge
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ) : (
                      <div className="px-2 py-1.5 text-sm">
                        <PremiumGate
                          feature="nuclearMode"
                          mode="replace"
                          fallback={
                            <div className="flex items-center justify-between text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <span>☢️</span>
                                <div>
                                  <div>Nuclear</div>
                                  <div className="text-xs">Ultimate challenge</div>
                                </div>
                              </div>
                              <Crown className="h-4 w-4 text-amber-500" />
                            </div>
                          }
                        >
                          <SelectItem value="nuclear">
                            <div className="flex items-center gap-2">
                              <span>☢️</span>
                              <div>
                                <div>Nuclear</div>
                                <div className="text-xs text-muted-foreground">
                                  Ultimate challenge
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        </PremiumGate>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Photo proof + tasks
                    </div>
                    {hasNuclearMode ? (
                      <SelectItem value="nuclear">
                        <div className="flex items-center gap-2">
                          <span>☢️</span>
                          <div>
                            <div>Nuclear</div>
                            <div className="text-xs text-muted-foreground">
                              Ultimate challenge
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ) : (
                      <div className="px-2 py-1.5 text-sm">
                        <PremiumGate
                          feature="nuclearMode"
                          mode="replace"
                          fallback={
                            <div className="flex items-center justify-between text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <span>☢️</span>
                                <div>
                                  <div>Nuclear</div>
                                  <div className="text-xs">Ultimate challenge</div>
                                </div>
                              </div>
                              <Crown className="h-4 w-4 text-amber-500" />
                            </div>
                          }
                        >
                          <SelectItem value="nuclear">
                            <div className="flex items-center gap-2">
                              <span>☢️</span>
                              <div>
                                <div>Nuclear</div>
                                <div className="text-xs text-muted-foreground">
                                  Ultimate challenge
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        </PremiumGate>
                      </div>
                    )}
                  </div>
                  {hasNuclearMode ? (
                    <SelectItem value="nuclear">
                      <div className="flex items-center gap-2">
                        <span>☢️</span>
                        <div>
                          <div>Nuclear</div>
                          <div className="text-xs text-muted-foreground">
                            Ultimate challenge
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ) : (
                    <div className="px-2 py-1.5 text-sm">
                      <PremiumGate
                        feature="nuclearMode"
                        mode="replace"
                        fallback={
                          <div className="flex items-center justify-between text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span>☢️</span>
                              <div>
                                <div>Nuclear</div>
                                <div className="text-xs">Ultimate challenge</div>
                              </div>
                            </div>
                            <Crown className="h-4 w-4 text-amber-500" />
                          </div>
                        }
                      >
                        <SelectItem value="nuclear">
                          <div className="flex items-center gap-2">
                            <span>☢️</span>
                            <div>
                              <div>Nuclear</div>
                              <div className="text-xs text-muted-foreground">
                                Ultimate challenge
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      </PremiumGate>
                    </div>
                  )}
                </div>
                {hasNuclearMode ? (
                  <SelectItem value="nuclear">
                    <div className="flex items-center gap-2">
                      <span>☢️</span>
                      <div>
                        <div>Nuclear</div>
                        <div className="text-xs text-muted-foreground">
                          Ultimate challenge
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ) : (
                  <div className="px-2 py-1.5 text-sm">
                    <PremiumGate
                      feature="nuclearMode"
                      mode="replace"
                      fallback={
                        <div className="flex items-center justify-between text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>☢️</span>
                            <div>
                              <div>Nuclear</div>
                              <div className="text-xs">Ultimate challenge</div>
                            </div>
                          </div>
                          <Crown className="h-4 w-4 text-amber-500" />
                        </div>
                      }
                    >
                      <SelectItem value="nuclear">
                        <div className="flex items-center gap-2">
                          <span>☢️</span>
                          <div>
                            <div>Nuclear</div>
                            <div className="text-xs text-muted-foreground">
                              Ultimate challenge
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </PremiumGate>
                  </div>
                )}
              </SelectItem>
              {hasNuclearMode ? (
                <SelectItem value="nuclear">
                  <div className="flex items-center gap-2">
                    <span>☢️</span>
                    <div>
                      <div>Nuclear</div>
                      <div className="text-xs text-muted-foreground">
                        Ultimate challenge
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ) : (
                <div className="px-2 py-1.5 text-sm">
                  <PremiumGate
                    feature="nuclearMode"
                    mode="replace"
                    fallback={
                      <div className="flex items-center justify-between text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>☢️</span>
                          <div>
                            <div>Nuclear</div>
                            <div className="text-xs">Ultimate challenge</div>
                          </div>
                        </div>
                        <Crown className="h-4 w-4 text-amber-500" />
                      </div>
                    }
                  >
                    <SelectItem value="nuclear">
                      <div className="flex items-center gap-2">
                        <span>☢️</span>
                        <div>
                          <div>Nuclear</div>
                          <div className="text-xs text-muted-foreground">
                            Ultimate challenge
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </PremiumGate>
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="battle-mode"
              checked={battleMode}
              onChange={(e: any) => s // auto: implicit anyetBattleMode(e.target.checked)}
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
            {selectedDifficulty === 'medium' && (
              <li>• Solve a math problem to dismiss</li>
            )}
            {selectedDifficulty === 'hard' && <li>• Complete 2 physical tasks</li>}
            {selectedDifficulty === 'extreme' && (
              <li>• Complete 3 tasks including photo proof</li>
            )}
            {selectedDifficulty === 'nuclear' && (
              <li>• Nuclear-level challenges with meltdown consequences</li>
            )}
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
