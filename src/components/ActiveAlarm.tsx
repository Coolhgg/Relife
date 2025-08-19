import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Clock as _Clock,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle,
  X,
  Camera as _Camera,
  Target,
  Calculator,
} from "lucide-react";
import { NuclearModeBattle } from "./NuclearModeBattle";
import type { Alarm, AlarmDifficulty, AlarmInstance } from "../types/index";

interface ActiveAlarmProps {
  alarm: Alarm;
  alarmInstance: AlarmInstance;
  onSnooze: (snoozeCount: number) => void;
  onDismiss: (completedAt: string, snoozeCount: number) => void;
  onMiss: () => void;
  battleMode?: boolean;
}

// Different challenge types based on difficulty
const MATH_PROBLEMS = {
  easy: [
    { question: "5 + 3 = ?", answer: 8 },
    { question: "10 - 4 = ?", answer: 6 },
    { question: "7 + 2 = ?", answer: 9 },
  ],
  medium: [
    { question: "15 × 3 = ?", answer: 45 },
    { question: "64 ÷ 8 = ?", answer: 8 },
    { question: "12 + 17 = ?", answer: 29 },
  ],
  hard: [
    { question: "23 × 4 = ?", answer: 92 },
    { question: "144 ÷ 12 = ?", answer: 12 },
    { question: "35 + 47 = ?", answer: 82 },
  ],
  extreme: [
    { question: "87 × 13 = ?", answer: 1131 },
    { question: "169 ÷ 13 = ?", answer: 13 },
    { question: "234 + 567 = ?", answer: 801 },
  ],
};

const TASKS = {
  medium: [
    "Stand up and do 5 jumping jacks",
    'Say "I am awake and ready!" out loud',
    "Touch your toes 3 times",
  ],
  hard: [
    "Do 10 push-ups",
    "Name 5 things you can see right now",
    "Recite the alphabet backwards (A to M is enough)",
    "Do a 30-second plank",
  ],
  extreme: [
    "Go to the bathroom and splash water on your face",
    "Take a selfie to prove you're awake",
    "Walk to your kitchen and back",
    "Do 20 jumping jacks",
    "Make your bed",
  ],
};

export function ActiveAlarm({
  alarm,
  alarmInstance,
  onSnooze,
  onDismiss,
  onMiss,
  battleMode = false,
}: ActiveAlarmProps) {
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds to dismiss
  const [isMuted, setIsMuted] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [showChallenge, setShowChallenge] = useState(false);
  const [_challengePhase, _setChallengePhase] = useState(0);

  // Auto-miss alarm after timeout
  useEffect(() => {
    if (timeLeft <= 0) {
      onMiss();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onMiss]);

  // Initialize challenge based on difficulty
  useEffect(() => {
    if (!showChallenge) return;

    switch (alarm.difficulty) {
      case "easy":
        // No challenge, just dismiss
        break;
      case "medium": {
        const mathProblem =
          MATH_PROBLEMS.medium[
            Math.floor(Math.random() * MATH_PROBLEMS.medium.length)
          ];
        setCurrentChallenge(mathProblem);
        break;
      }
      case "hard": {
        const tasks = TASKS.hard.slice(0, 2); // 2 tasks for hard
        setCurrentChallenge({ type: "tasks", tasks });
        break;
      }
      case "extreme": {
        const extremeTasks = TASKS.extreme.slice(0, 3); // 3 tasks for extreme
        setCurrentChallenge({ type: "tasks", tasks: extremeTasks });
        break;
      }
      case "nuclear":
        // Nuclear mode is handled by NuclearModeBattle component
        // This should redirect to nuclear battle mode
        break;
    }
  }, [showChallenge, alarm.difficulty]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSnooze = () => {
    if (alarm.snoozeEnabled && alarmInstance.snoozeCount < 3) {
      onSnooze(alarmInstance.snoozeCount + 1);
    }
  };

  const handleDismissAttempt = () => {
    if (alarm.difficulty === "easy") {
      onDismiss(new Date().toISOString(), alarmInstance.snoozeCount);
    } else if (alarm.difficulty === "nuclear") {
      // Nuclear mode should be handled by NuclearModeBattle component
      // This component should not handle nuclear mode directly
      setShowChallenge(true);
    } else {
      setShowChallenge(true);
    }
  };

  const handleChallengeSubmit = () => {
    if (alarm.difficulty === "medium" && currentChallenge) {
      if (parseInt(challengeAnswer) === currentChallenge.answer) {
        onDismiss(new Date().toISOString(), alarmInstance.snoozeCount);
      } else {
        setChallengeAnswer("");
        // Wrong answer - generate new problem
        const mathProblem =
          MATH_PROBLEMS.medium[
            Math.floor(Math.random() * MATH_PROBLEMS.medium.length)
          ];
        setCurrentChallenge(mathProblem);
      }
    }
  };

  const handleTaskComplete = (task: string) => {
    const newCompleted = [...completedTasks, task];
    setCompletedTasks(newCompleted);

    if (
      currentChallenge &&
      newCompleted.length >= currentChallenge.tasks.length
    ) {
      // All tasks completed
      onDismiss(new Date().toISOString(), alarmInstance.snoozeCount);
    }
  };

  const getDifficultyColor = (difficulty: AlarmDifficulty) => {
    switch (difficulty) {
      case "easy":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "hard":
        return "text-orange-500";
      case "extreme":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getDifficultyEmoji = (difficulty: AlarmDifficulty) => {
    switch (difficulty) {
      case "easy":
        return "😴";
      case "medium":
        return "⏰";
      case "hard":
        return "🔥";
      case "extreme":
        return "💀";
      case "nuclear":
        return "☢️";
      default:
        return "⏰";
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card className="border-2 border-primary animate-pulse">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                {!isMuted ? (
                  <Volume2 className="h-12 w-12 text-primary animate-bounce" />
                ) : (
                  <VolumeX className="h-12 w-12 text-muted-foreground" />
                )}
                <div className="absolute -top-2 -right-2">
                  <Badge className={getDifficultyColor(alarm.difficulty)}>
                    {getDifficultyEmoji(alarm.difficulty)}
                  </Badge>
                </div>
              </div>
            </div>

            <CardTitle className="text-2xl">{alarm.label}</CardTitle>
            <p className="text-xl font-mono">
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            {battleMode && (
              <Badge variant="outline" className="mt-2">
                🏆 Battle Mode Active
              </Badge>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Timeout Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Time to respond</span>
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </div>
              <Progress value={(timeLeft / 30) * 100} className="h-2" />
              {timeLeft <= 10 && (
                <p className="text-sm text-destructive animate-pulse">
                  ⚠️ Alarm will be missed in {timeLeft} seconds!
                </p>
              )}
            </div>

            {!showChallenge ? (
              /* Initial Controls */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="destructive"
                    onClick={handleDismissAttempt}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Dismiss
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setIsMuted(!isMuted)}
                    className="flex-1"
                  >
                    {isMuted ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {alarm.snoozeEnabled && alarmInstance.snoozeCount < 3 && (
                  <Button
                    variant="outline"
                    onClick={handleSnooze}
                    className="w-full"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Snooze ({3 - alarmInstance.snoozeCount} left)
                  </Button>
                )}

                <div className="text-center text-sm text-muted-foreground">
                  {alarm.difficulty !== "easy" && (
                    <p>
                      This is a{" "}
                      <span className={getDifficultyColor(alarm.difficulty)}>
                        {alarm.difficulty}
                      </span>{" "}
                      alarm. You'll need to complete a challenge to dismiss it.
                    </p>
                  )}
                  {alarmInstance.snoozeCount > 0 && (
                    <p className="mt-2">
                      Snoozed {alarmInstance.snoozeCount} time(s) already
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Challenge Interface */
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">
                    Complete the challenge to dismiss
                  </h3>
                  <Badge className={getDifficultyColor(alarm.difficulty)}>
                    {getDifficultyEmoji(alarm.difficulty)}{" "}
                    {alarm.difficulty.toUpperCase()}
                  </Badge>
                </div>

                {/* Math Challenge */}
                {currentChallenge && !currentChallenge.type && (
                  <div className="space-y-3">
                    <div className="text-center">
                      <Calculator className="mx-auto h-8 w-8 mb-2 text-primary" />
                      <p className="text-lg font-mono">
                        {currentChallenge.question}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={challengeAnswer}
                        onChange={(e) => setChallengeAnswer(e.target.value)}
                        placeholder="Your answer"
                        className="text-center text-lg"
                        autoFocus
                      />
                      <Button
                        onClick={handleChallengeSubmit}
                        disabled={!challengeAnswer}
                      >
                        ✓
                      </Button>
                    </div>
                  </div>
                )}

                {/* Task Challenges */}
                {currentChallenge && currentChallenge.type === "tasks" && (
                  <div className="space-y-3">
                    <div className="text-center mb-4">
                      <Target className="mx-auto h-8 w-8 mb-2 text-primary" />
                      <p className="text-sm">Complete all tasks below:</p>
                    </div>

                    {currentChallenge.tasks.map(
                      (task: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <span
                            className={`text-sm ${completedTasks.includes(task) ? "line-through text-muted-foreground" : ""}`}
                          >
                            {task}
                          </span>
                          {completedTasks.includes(task) ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleTaskComplete(task)}
                            >
                              Done
                            </Button>
                          )}
                        </div>
                      ),
                    )}

                    <Progress
                      value={
                        (completedTasks.length /
                          currentChallenge.tasks.length) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowChallenge(false);
                    setChallengeAnswer("");
                    setCompletedTasks([]);
                  }}
                  className="w-full"
                  size="sm"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Challenge
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ActiveAlarm;
