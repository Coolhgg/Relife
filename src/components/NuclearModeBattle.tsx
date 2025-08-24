/// <reference types="node" />
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TimeoutHandle } from '../types/timers';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Alert,
  Timer,
  Target,
  Skull,
  Atom,
  Shield,
  Explosion,
  Crown,
} from 'lucide-react';
import { PremiumGate } from './PremiumGate';
import type { Alarm, User, AlarmDifficulty } from '../types';
import { SoundService } from '../services/sound-effects';
import { ErrorHandler } from '../services/error-handler';

interface NuclearModeBattleProps {
  alarm: Alarm;
  user: User;
  onDismiss: (method: 'nuclear-challenge' | 'nuclear-failed') => void;
  onSnooze: () => void;
  isActive: boolean;
}

interface NuclearChallenge {
  id: string;
  type: 'sequence' | 'math' | 'pattern' | 'endurance' | 'precision';
  title: string;
  description: string;
  difficulty: number;
  timeLimit: number; // seconds
  points: number;
}

const NUCLEAR_CHALLENGES: NuclearChallenge[] = [
  {
    id: 'sequence-memory',
    type: 'sequence',
    title: 'Nuclear Sequence',
    description: 'Memorize and repeat the atomic sequence',
    difficulty: 10,
    timeLimit: 30,
    points: 500,
  },
  {
    id: 'fusion-math',
    type: 'math',
    title: 'Fusion Calculator',
    description: 'Solve complex equations to prevent meltdown',
    difficulty: 9,
    timeLimit: 45,
    points: 400,
  },
  {
    id: 'reactor-pattern',
    type: 'pattern',
    title: 'Reactor Pattern',
    description: 'Match the cooling rod pattern exactly',
    difficulty: 8,
    timeLimit: 60,
    points: 600,
  },
  {
    id: 'endurance-protocol',
    type: 'endurance',
    title: 'Endurance Protocol',
    description: 'Maintain focus while chaos erupts around you',
    difficulty: 10,
    timeLimit: 90,
    points: 800,
  },
  {
    id: 'precision-targeting',
    type: 'precision',
    title: 'Precision Strike',
    description: 'Hit exact targets with nuclear precision',
    difficulty: 9,
    timeLimit: 40,
    points: 700,
  },
];

export const NuclearModeBattle: React.FC<NuclearModeBattleProps> = ({
  alarm,
  user,
  onDismiss,
  onSnooze,
  isActive,
}) => {
  const [currentChallenge, setCurrentChallenge] = useState<NuclearChallenge | null>(
    null
  );
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [challengesCompleted, setChallengesCompleted] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [nuclearEffects, setNuclearEffects] = useState(true);
  const [warningLevel, setWarningLevel] = useState<
    'green' | 'yellow' | 'red' | 'critical'
  >('green');

  const timerRef = useRef<TimeoutHandle | undefined>(undefined); // auto: changed from number | null to TimeoutHandle
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const requiredChallenges = 3; // Must complete 3 nuclear challenges to dismiss

  useEffect(() => {
    if (isActive && !currentChallenge) {
      initializeNuclearMode();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  const initializeNuclearMode = useCallback(() => {
    // Play nuclear alarm sound
    playNuclearAlarm();

    // Start with first challenge
    const challenge = getRandomChallenge();
    setCurrentChallenge(challenge);
    setTimeRemaining(challenge.timeLimit);
    setChallengeProgress(0);
    setWarningLevel('red');

    // Start timer
    startChallengeTimer(challenge.timeLimit);
  }, []);

  const getRandomChallenge = useCallback((): NuclearChallenge => {
    return NUCLEAR_CHALLENGES[Math.floor(Math.random() * NUCLEAR_CHALLENGES.length)];
  }, []);

  const startChallengeTimer = useCallback((duration: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev: any) => // auto: implicit any {
        if (prev <= 1) {
          handleChallengeTimeout();
          return 0;
        }

        // Update warning level based on time remaining
        const percentage = prev / duration;
        if (percentage > 0.5) {
          setWarningLevel('yellow');
        } else if (percentage > 0.25) {
          setWarningLevel('red');
        } else {
          setWarningLevel('critical');
        }

        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleChallengeTimeout = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Challenge failed - trigger meltdown sequence
    triggerNuclearMeltdown();
  }, []);

  const handleChallengeComplete = useCallback(
    (success: boolean, score: number = 0) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (success) {
        setTotalScore((prev: any) => // auto: implicit any prev + score);
        setChallengesCompleted((prev: any) => // auto: implicit any prev + 1);

        // Check if all challenges completed
        if (challengesCompleted + 1 >= requiredChallenges) {
          handleNuclearSuccess();
        } else {
          // Move to next challenge
          setTimeout(() => {
            const nextChallenge = getRandomChallenge();
            setCurrentChallenge(nextChallenge);
            setTimeRemaining(nextChallenge.timeLimit);
            setChallengeProgress(0);
            startChallengeTimer(nextChallenge.timeLimit);
          }, 1000);
        }
      } else {
        triggerNuclearMeltdown();
      }
    },
    [challengesCompleted]
  );

  const handleNuclearSuccess = useCallback(() => {
    setWarningLevel('green');
    setNuclearEffects(false);

    // Play success sound
    SoundService.playSystemSound('nuclear-success');

    // Award bonus points for nuclear completion
    const bonusScore = totalScore * 0.5;
    setTotalScore((prev: any) => // auto: implicit any prev + bonusScore);

    // Dismiss alarm with nuclear success
    setTimeout(() => {
      onDismiss('nuclear-challenge');
    }, 2000);
  }, [totalScore, onDismiss]);

  const triggerNuclearMeltdown = useCallback(() => {
    setIsExploding(true);
    setWarningLevel('critical');

    // Play meltdown sound
    SoundService.playSystemSound('nuclear-meltdown');

    // Prevent dismissal - must snooze and try again
    setTimeout(() => {
      onSnooze();
    }, 3000);
  }, [onSnooze]);

  const playNuclearAlarm = useCallback(() => {
    try {
      // Play intense nuclear alarm sound
      SoundService.playSystemSound('nuclear-alarm');
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to play nuclear alarm');
    }
  }, []);

  const renderChallenge = () => {
    if (!currentChallenge) return null;

    switch (currentChallenge.type) {
      case 'sequence':
        return (
          <SequenceChallenge
            challenge={currentChallenge}
            onComplete={handleChallengeComplete}
            timeRemaining={timeRemaining}
          />
        );
      case 'math':
        return (
          <MathChallenge
            challenge={currentChallenge}
            onComplete={handleChallengeComplete}
            timeRemaining={timeRemaining}
          />
        );
      case 'pattern':
        return (
          <PatternChallenge
            challenge={currentChallenge}
            onComplete={handleChallengeComplete}
            timeRemaining={timeRemaining}
          />
        );
      case 'endurance':
        return (
          <EnduranceChallenge
            challenge={currentChallenge}
            onComplete={handleChallengeComplete}
            timeRemaining={timeRemaining}
          />
        );
      case 'precision':
        return (
          <PrecisionChallenge
            challenge={currentChallenge}
            onComplete={handleChallengeComplete}
            timeRemaining={timeRemaining}
          />
        );
      default:
        return null;
    }
  };

  return (
    <PremiumGate
      feature="nuclearMode"
      userId={user.id}
      title="🚀 Nuclear Mode Activated"
      description="The ultimate wake-up challenge. Complete nuclear protocols or face meltdown. Pro subscription required."
    >
      <div className="fixed inset-0 z-50 bg-black">
        {/* Nuclear Effects Background */}
        <AnimatePresence>
          {nuclearEffects && (
            <motion.div
              className={`absolute inset-0 ${
                warningLevel === 'critical'
                  ? 'bg-red-900/90'
                  : warningLevel === 'red'
                    ? 'bg-red-800/70'
                    : warningLevel === 'yellow'
                      ? 'bg-orange-600/50'
                      : 'bg-green-900/30'
              }`}
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: warningLevel === 'critical' ? 0.5 : 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </AnimatePresence>

        {/* Explosion Effect */}
        <AnimatePresence>
          {isExploding && (
            <motion.div
              className="absolute inset-0 bg-orange-500"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 3, opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {/* Main Interface */}
        <div className="relative h-full flex flex-col text-white">
          {/* Header */}
          <div className="p-6 border-b border-red-500/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Atom className="h-8 w-8 text-red-500" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-red-400">NUCLEAR MODE</h1>
                  <p className="text-sm text-red-300">DEFCON 1 - MAXIMUM ALERT</p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-yellow-400" />
                  <span className="text-lg font-bold">{totalScore}</span>
                </div>
                <p className="text-xs text-gray-400">Nuclear Points</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-3 bg-black/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Protocol Progress</span>
              <span className="text-sm">
                {challengesCompleted}/{requiredChallenges}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-red-600 to-orange-500 h-2 rounded-full"
                initial={{ width: '0%' }}
                animate={{
                  width: `${(challengesCompleted / requiredChallenges) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Timer */}
          {currentChallenge && (
            <div className="px-6 py-2 bg-red-900/30">
              <div className="flex items-center justify-center space-x-2">
                <Timer
                  className={`h-5 w-5 ${
                    warningLevel === 'critical'
                      ? 'text-red-400'
                      : warningLevel === 'red'
                        ? 'text-orange-400'
                        : 'text-yellow-400'
                  }`}
                />
                <span
                  className={`text-lg font-mono font-bold ${
                    warningLevel === 'critical'
                      ? 'text-red-400'
                      : warningLevel === 'red'
                        ? 'text-orange-400'
                        : 'text-yellow-400'
                  }`}
                >
                  {Math.floor(timeRemaining / 60)}:
                  {(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          )}

          {/* Challenge Area */}
          <div className="flex-1 p-6">{renderChallenge()}</div>

          {/* Warning Footer */}
          <div className="p-4 bg-red-900/50 border-t border-red-500/50">
            <div className="flex items-center justify-center space-x-2">
              <Alert className="h-5 w-5 text-yellow-400" />
              <span className="text-sm font-medium">
                FAILURE TO COMPLETE PROTOCOLS WILL RESULT IN NUCLEAR MELTDOWN
              </span>
              <Skull className="h-5 w-5 text-red-400" />
            </div>
          </div>
        </div>
      </div>
    </PremiumGate>
  );
};

// Placeholder challenge components - would be implemented with actual game logic
const SequenceChallenge: React.FC<{
  challenge: NuclearChallenge;
  onComplete: (success: boolean, score: number) => void;
  timeRemaining: number;
}> = ({ challenge, onComplete, timeRemaining }) => (
  <div className="text-center">
    <h2 className="text-xl font-bold mb-4">{challenge.title}</h2>
    <p className="mb-6">{challenge.description}</p>
    <button
      onClick={() => onComplete(true, challenge.points)}
      className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-colors"
    >
      Complete Sequence
    </button>
  </div>
);

const MathChallenge: React.FC<{
  challenge: NuclearChallenge;
  onComplete: (success: boolean, score: number) => void;
  timeRemaining: number;
}> = ({ challenge, onComplete, timeRemaining }) => (
  <div className="text-center">
    <h2 className="text-xl font-bold mb-4">{challenge.title}</h2>
    <p className="mb-6">{challenge.description}</p>
    <button
      onClick={() => onComplete(true, challenge.points)}
      className="px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-bold transition-colors"
    >
      Solve Equation
    </button>
  </div>
);

const PatternChallenge: React.FC<{
  challenge: NuclearChallenge;
  onComplete: (success: boolean, score: number) => void;
  timeRemaining: number;
}> = ({ challenge, onComplete, timeRemaining }) => (
  <div className="text-center">
    <h2 className="text-xl font-bold mb-4">{challenge.title}</h2>
    <p className="mb-6">{challenge.description}</p>
    <button
      onClick={() => onComplete(true, challenge.points)}
      className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold transition-colors"
    >
      Match Pattern
    </button>
  </div>
);

const EnduranceChallenge: React.FC<{
  challenge: NuclearChallenge;
  onComplete: (success: boolean, score: number) => void;
  timeRemaining: number;
}> = ({ challenge, onComplete, timeRemaining }) => (
  <div className="text-center">
    <h2 className="text-xl font-bold mb-4">{challenge.title}</h2>
    <p className="mb-6">{challenge.description}</p>
    <button
      onClick={() => onComplete(true, challenge.points)}
      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-colors"
    >
      Maintain Focus
    </button>
  </div>
);

const PrecisionChallenge: React.FC<{
  challenge: NuclearChallenge;
  onComplete: (success: boolean, score: number) => void;
  timeRemaining: number;
}> = ({ challenge, onComplete, timeRemaining }) => (
  <div className="text-center">
    <h2 className="text-xl font-bold mb-4">{challenge.title}</h2>
    <p className="mb-6">{challenge.description}</p>
    <button
      onClick={() => onComplete(true, challenge.points)}
      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
    >
      Precision Strike
    </button>
  </div>
);

export default NuclearModeBattle;
