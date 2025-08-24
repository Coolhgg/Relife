import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { AlertTriangle, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import {
  Zap,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Brain,
  Camera,
  Mic,
  BarChart3,
  QrCode,
  Keyboard,
  Shield,
  Volume2,
  Eye,
  Lightbulb,
  Trophy,
  Flame,
  Timer,
} from 'lucide-react';
import type {
  NuclearModeChallenge,
  NuclearChallengeType,
  NuclearModeSession,
  NuclearChallengeAttempt,
} from '../types';
import { nuclearModeService } from '../services/nuclear-mode';
import { cn } from '../lib/utils';
import { TimeoutHandle } from '../types/timers';

interface NuclearModeChallengeProps {
  session: NuclearModeSession;
  currentChallenge: NuclearModeChallenge;
  onChallengeComplete: (successful: boolean, data?: any) => void;
  onSessionComplete: () => void;
  onSessionFailed: () => void;
  className?: string;
}

// Math Challenge Component
const MathChallenge: React.FC<{
  challenge: NuclearModeChallenge;
  onComplete: (success: boolean, data: any) => void;
}> = ({ challenge, onComplete }) => {
  const [problems, setProblems] = useState<
    Array<{
      question: string;
      answer: number;
      userAnswer: string;
      correct?: boolean;
    }>
  >([]);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [errors, setErrors] = useState(0);

  useEffect(() => {
    // Generate math problems based on difficulty
    const generateProblems = () => {
      const numProblems = challenge.configuration.sequenceLength || 5;
      const complexity = challenge.configuration.mathComplexity || 'advanced';
      const newProblems = [];

      for (let i = 0; i < numProblems; i++) {
        let question = '';
        let answer = 0;

        switch (complexity) {
          case 'basic':
            const a = Math.floor(Math.random() * 50) + 1;
            const b = Math.floor(Math.random() * 50) + 1;
            const op = ['+', '-', '*'][Math.floor(Math.random() * 3)];
            question = `${a} ${op} ${b}`;
            answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
            break;

          case 'advanced':
            const x = Math.floor(Math.random() * 20) + 1;
            const y = Math.floor(Math.random() * 20) + 1;
            const z = Math.floor(Math.random() * 10) + 1;
            question = `(${x} * ${y}) + ${z}²`;
            answer = x * y + z * z;
            break;

          case 'expert':
            const base = Math.floor(Math.random() * 10) + 2;
            const exp = Math.floor(Math.random() * 3) + 2;
            const mult = Math.floor(Math.random() * 5) + 1;
            question = `${base}^${exp} - ${mult} * 7`;
            answer = Math.pow(base, exp) - mult * 7;
            break;
        }

        newProblems.push({
          question,
          answer,
          userAnswer: '',
          correct: undefined,
        });
      }

      setProblems(newProblems);
    };

    generateProblems();
  }, [challenge]);

  const handleSubmit = () => {
    const currentAnswerNum = parseFloat(userAnswer);
    const correctAnswer = problems[currentProblem].answer;
    const isCorrect = Math.abs(currentAnswerNum - correctAnswer) < 0.001;

    const updatedProblems = [...problems];
    updatedProblems[currentProblem] = {
      ...updatedProblems[currentProblem],
      userAnswer,
      correct: isCorrect,
    };
    setProblems(updatedProblems);

    if (!isCorrect) {
      const newErrors = errors + 1;
      setErrors(newErrors);

      if (newErrors >= 2) {
        // Reset sequence on too many errors
        setCurrentProblem(0);

        setProblems(
          problems.map((p: any) => ({
            ...p,
            userAnswer: '',
            correct: undefined,
          }))
        );
        setErrors(0);
        setUserAnswer('');
        return;
      }
    }

    if (currentProblem < problems.length - 1) {
      setCurrentProblem(currentProblem + 1);
      setUserAnswer('');
    } else {
      // All problems completed successfully
      onComplete(true, {
        totalProblems: problems.length,
        errors,
        answers: updatedProblems,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Problem {currentProblem + 1} of {problems.length}
        </h3>
        <Progress value={(currentProblem / problems.length) * 100} className="h-3" />
      </div>

      {problems[currentProblem] && (
        <div className="text-center space-y-4">
          <div className="text-4xl font-mono bg-gray-100 p-6 rounded-lg border-2">
            {problems[currentProblem].question} = ?
          </div>

          <Input
            type="number"
            value={userAnswer}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUserAnswer(e.target.value)
            }
            placeholder="Enter your answer"
            className="text-center text-2xl h-16"
            autoFocus
            onKeyPress={(e: React.SyntheticEvent) =>
              e.key === 'Enter' && handleSubmit()
            }
          />

          <Button
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
          >
            Submit Answer
          </Button>
        </div>
      )}

      {errors > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {errors} error{errors !== 1 ? 's' : ''} made.
            {errors >= 1 && ' One more _error will reset the sequence!'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Memory Challenge Component
const MemoryChallenge: React.FC<{
  challenge: NuclearModeChallenge;
  onComplete: (success: boolean, data: any) => void;
}> = ({ challenge, onComplete }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [gameState, setGameState] = useState<'waiting' | 'showing' | 'input'>(
    'waiting'
  );

  const maxRounds = challenge.configuration.sequenceLength || 8;
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
  ];

  const startRound = () => {
    const newSequence = [];
    for (let i = 0; i < currentRound; i++) {
      newSequence.push(Math.floor(Math.random() * 6));
    }
    setSequence(newSequence);
    setUserSequence([]);
    setGameState('showing');

    // Show sequence
    setShowingSequence(true);
    setTimeout(
      () => {
        setShowingSequence(false);
        setGameState('input');
      },
      newSequence.length * 800 + 1000
    );
  };

  const handleColorClick = (colorIndex: number) => {
    if (gameState !== 'input') return;

    const newUserSequence = [...userSequence, colorIndex];
    setUserSequence(newUserSequence);

    if (
      newUserSequence[newUserSequence.length - 1] !==
      sequence[newUserSequence.length - 1]
    ) {
      // Wrong sequence - reset
      onComplete(false, {
        round: currentRound,
        sequence,
        userSequence: newUserSequence,
        _error: 'wrong_sequence',
      });
      return;
    }

    if (newUserSequence.length === sequence.length) {
      // Round completed
      if (currentRound >= maxRounds) {
        // All rounds completed!
        onComplete(true, {
          totalRounds: maxRounds,
          completed: true,
        });
      } else {
        // Next round
        setCurrentRound(currentRound + 1);
        setGameState('waiting');
        setTimeout(startRound, 1000);
      }
    }
  };

  useEffect(() => {
    if (gameState === 'waiting') {
      setTimeout(startRound, 1000);
    }
  }, [gameState]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Round {currentRound} of {maxRounds}
        </h3>
        <Progress value={(currentRound / maxRounds) * 100} className="h-3" />
      </div>

      <div className="text-center">
        {gameState === 'waiting' && (
          <div className="text-lg text-gray-600">
            Get ready for round {currentRound}...
          </div>
        )}
        {gameState === 'showing' && (
          <div className="text-lg text-blue-600">Watch the sequence carefully!</div>
        )}
        {gameState === 'input' && (
          <div className="text-lg text-green-600">
            Repeat the sequence by clicking the colors
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        {colors.map((color, _index) => (
          <button
            key={_index}
            className={cn(
              'w-20 h-20 rounded-lg border-4 transition-all transform',
              color,
              gameState === 'input'
                ? 'hover:scale-105 cursor-pointer'
                : 'cursor-not-allowed',
              showingSequence &&
                sequence[Math.floor((Date.now() % (sequence.length * 800)) / 800)] ===
                  _index
                ? 'scale-110 border-white shadow-lg'
                : 'border-gray-300'
            )}
            onClick={() => handleColorClick(_index)}
            disabled={gameState !== 'input'}
          />
        ))}
      </div>

      {userSequence.length > 0 && (
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">Your sequence:</div>
          <div className="flex gap-2 justify-center">
            {userSequence.map((colorIndex, _index) => (
              <div key={_index} className={cn('w-6 h-6 rounded', colors[colorIndex])} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Photo Challenge Component
const PhotoChallenge: React.FC<{
  challenge: NuclearModeChallenge;
  onComplete: (success: boolean, data: any) => void;
}> = ({ challenge, onComplete }) => {
  const [photosTaken, setPhotosTaken] = useState<File[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoRequirements = [
    {
      title: 'Clear Selfie',
      description: 'Take a clear photo of your face with eyes open and visible',
      type: 'selfie',
    },
    {
      title: 'Location Proof',
      description: "Take a photo showing you're in a different room than your bedroom",
      type: 'location',
    },
    {
      title: 'Date Verification',
      description:
        "Include a clock, phone screen, or newspaper showing today's date/time",
      type: 'date_proof',
    },
  ];

  const handlePhotoCapture = (_event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newPhotos = [...photosTaken, file];
      setPhotosTaken(newPhotos);

      if (currentPhotoIndex < photoRequirements.length - 1) {
        setCurrentPhotoIndex(currentPhotoIndex + 1);
      } else {
        // All photos taken
        onComplete(true, {
          photos: newPhotos,
          requirements: photoRequirements,
        });
      }
    }
  };

  const currentRequirement = photoRequirements[currentPhotoIndex];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Photo {currentPhotoIndex + 1} of {photoRequirements.length}
        </h3>
        <Progress
          value={(currentPhotoIndex / photoRequirements.length) * 100}
          className="h-3"
        />
      </div>

      <div className="text-center space-y-4">
        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <Camera className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-blue-900 mb-2">
            {currentRequirement.title}
          </h4>
          <p className="text-blue-700">{currentRequirement.description}</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoCapture}
          className="hidden"
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700"
        >
          <Camera className="w-6 h-6 mr-2" />
          Take Photo
        </Button>

        {photosTaken.length > 0 && (
          <div className="mt-6">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Photos taken:</h5>
            <div className="flex gap-2 justify-center">
              {photosTaken.map((_, _index) => (
                <CheckCircle key={_index} className="w-6 h-6 text-green-500" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Voice Challenge Component
const VoiceChallenge: React.FC<{
  challenge: NuclearModeChallenge;
  onComplete: (success: boolean, data: any) => void;
}> = ({ challenge, onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [completedPhrases, setCompletedPhrases] = useState<boolean[]>([]);

  const tongueTwisters = [
    'She sells seashells by the seashore',
    'How much wood would a woodchuck chuck if a woodchuck could chuck wood',
    'Peter Piper picked a peck of pickled peppers',
    'Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair',
    'Red leather, yellow leather',
  ];

  const handleRecording = async () => {
    if (!isRecording) {
      setIsRecording(true);
      // Simulate recording for 3 seconds
      setTimeout(() => {
        setIsRecording(false);
        // Simulate voice recognition success (in real app, would use actual voice recognition)
        const newCompleted = [...completedPhrases];
        newCompleted[currentPhrase] = Math.random() > 0.3; // 70% success rate for demo
        setCompletedPhrases(newCompleted);

        if (newCompleted[currentPhrase]) {
          if (currentPhrase < tongueTwisters.length - 1) {
            setCurrentPhrase(currentPhrase + 1);
          } else {
            // All phrases completed
            onComplete(true, {
              phrases: tongueTwisters,
              completed: newCompleted,
            });
          }
        }
      }, 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Phrase {currentPhrase + 1} of {tongueTwisters.length}
        </h3>
        <Progress
          value={
            ((currentPhrase + completedPhrases.filter(Boolean).length) /
              tongueTwisters.length) *
            100
          }
          className="h-3"
        />
      </div>

      <div className="text-center space-y-4">
        <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
          <Volume2 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-purple-900 mb-4">
            Speak this phrase clearly:
          </h4>
          <p className="text-2xl font-mono text-purple-800 leading-relaxed">
            "{tongueTwisters[currentPhrase]}"
          </p>
        </div>

        <Button
          onClick={handleRecording}
          disabled={isRecording}
          className={cn(
            'w-full h-16 text-lg',
            isRecording
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-purple-600 hover:bg-purple-700'
          )}
        >
          {isRecording ? (
            <>
              <div className="animate-pulse w-6 h-6 bg-white rounded-full mr-2" />
              Recording... ({3}s)
            </>
          ) : (
            <>
              <Mic className="w-6 h-6 mr-2" />
              Start Recording
            </>
          )}
        </Button>

        {completedPhrases.length > 0 && (
          <div className="space-y-2">
            {tongueTwisters.slice(0, currentPhrase + 1).map((phrase, _index) => (
              <div key={_index} className="flex items-center gap-2 text-sm">
                {completedPhrases[_index] ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : _index === currentPhrase ? (
                  <Clock className="w-5 h-5 text-yellow-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span
                  className={
                    completedPhrases[_index] ? 'text-green-600' : 'text-gray-600'
                  }
                >
                  {phrase}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Nuclear Mode Challenge Component
export const NuclearModeChallenge: React.FC<NuclearModeChallengeProps> = ({
  session,
  currentChallenge,
  onChallengeComplete,
  onSessionComplete,
  onSessionFailed,
  className,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(currentChallenge.timeLimit || 300);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev: any) => {
        if (prev <= 1) {
          // Time's up!
          onChallengeComplete(false, { reason: 'timeout' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onChallengeComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const useHint = () => {
    if (hintsUsed < (currentChallenge.hints?.length || 0)) {
      setHintsUsed(hintsUsed + 1);
      setShowHint(true);
    }
  };

  const renderChallenge = () => {
    switch (currentChallenge.type) {
      case 'multi_step_math':
        return (
          <MathChallenge
            challenge={currentChallenge}
            onComplete={onChallengeComplete}
          />
        );
      case 'memory_sequence':
        return (
          <MemoryChallenge
            challenge={currentChallenge}
            onComplete={onChallengeComplete}
          />
        );
      case 'photo_proof':
        return (
          <PhotoChallenge
            challenge={currentChallenge}
            onComplete={onChallengeComplete}
          />
        );
      case 'voice_recognition':
        return (
          <VoiceChallenge
            challenge={currentChallenge}
            onComplete={onChallengeComplete}
          />
        );
      default:
        return (
          <div className="text-center">
            <p className="text-gray-600">
              Challenge type not implemented: {currentChallenge.type}
            </p>
            <Button onClick={() => onChallengeComplete(true, {})}>
              Skip Challenge
            </Button>
          </div>
        );
    }
  };

  return (
    <Card
      className={cn(
        'min-h-screen bg-gradient-to-br from-red-50 to-orange-50',
        className
      )}
    >
      <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <CardTitle className="text-2xl">💣 Nuclear Mode Active</CardTitle>
              <p className="text-red-100">
                Challenge {session.successfulChallenges + 1} of{' '}
                {session.challenges.length}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={cn(
                'text-2xl font-mono font-bold',
                timeRemaining < 60 ? 'text-yellow-300 animate-pulse' : 'text-white'
              )}
            >
              {formatTime(timeRemaining)}
            </div>
            <div className="text-red-100 text-sm">Time Remaining</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        {/* Challenge Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {currentChallenge.title}
          </h2>
          <p className="text-gray-600 mb-4">{currentChallenge.description}</p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <Badge variant="destructive" className="px-4 py-2">
              <Target className="w-4 h-4 mr-1" />
              Difficulty {currentChallenge.difficulty}/10
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Flame className="w-4 h-4 mr-1" />
              Attempt {currentChallenge.attempts + 1}/{currentChallenge.maxAttempts}
            </Badge>
          </div>
        </div>

        {/* Challenge Component */}
        <div className="max-w-2xl mx-auto">{renderChallenge()}</div>

        {/* Hints Section */}
        {currentChallenge.hints && currentChallenge.hints.length > 0 && (
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700">Need Help?</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={useHint}
                disabled={hintsUsed >= currentChallenge.hints.length}
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                Use Hint ({hintsUsed}/{currentChallenge.hints.length})
              </Button>
            </div>

            {showHint && hintsUsed > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Hint {hintsUsed}:</strong>{' '}
                  {currentChallenge.hints[hintsUsed - 1]}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Session Progress */}
        <div className="mt-8 max-w-2xl mx-auto">
          <Separator className="mb-4" />
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Session Progress</span>
            <span>
              {session.successfulChallenges} / {session.challenges.length} completed
            </span>
          </div>
          <Progress
            value={(session.successfulChallenges / session.challenges.length) * 100}
            className="mt-2 h-2"
          />
        </div>

        {/* Warning */}
        <Alert className="mt-6 max-w-2xl mx-auto border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Nuclear Mode is active. You must complete all challenges to dismiss the
            alarm. Snoozing is disabled.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
export default NuclearModeChallenge;
