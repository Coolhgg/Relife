import React, { useState, useEffect } from 'react';
import { NuclearChallengeType } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Alert, AlertDescription, Alert } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import {
  Zap,
  Shield,
  Brain,
  Camera,
  BarChart3,
  Mic,
  QrCode,
  Keyboard,
  Target,
  Crown,
  Lock,
  Alert as AlertIcon,
} from 'lucide-react';
import { nuclearModeService } from '../services/nuclear-mode';
import { premiumService } from '../services/premium';
import { cn } from '../lib/utils';

interface NuclearModeSelectorProps {
  isEnabled: boolean;
  selectedChallenges: NuclearChallengeType[];
  customDifficulty: number;
  onEnabledChange: (enabled: boolean) => void;
  onChallengesChange: (challenges: NuclearChallengeType[]) => void;
  onDifficultyChange: (difficulty: number) => void;
  userId: string;
  className?: string;
}

const challengeIcons: Record<NuclearChallengeType, React.ComponentType<any>> = {
  multi_step_math: BarChart3,
  memory_sequence: Brain,
  physical_movement: Target,
  barcode_scan: QrCode,
  photo_proof: Camera,
  voice_recognition: Mic,
  typing_challenge: Keyboard,
  pattern_matching: Shield,
  location_verification: Target,
  qr_code_hunt: QrCode,
  shake_intensity: Zap,
  sound_matching: Mic,
  color_sequence: Shield,
  puzzle_solving: Brain,
  riddle_answer: Brain,
};

export const NuclearModeSelector: React.FC<NuclearModeSelectorProps> = ({
  isEnabled,
  selectedChallenges,
  customDifficulty,
  onEnabledChange,
  onChallengesChange,
  onDifficultyChange,
  userId,
  className,
}) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [userTier, setUserTier] = useState<string>('free'); // auto: added missing userTier state
  const [upgradeUrl, setUpgradeUrl] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [challengeTypes, setChallengeTypes] = useState<
    Array<{
      type: NuclearChallengeType;
      name: string;
      description: string;
      difficulty: number;
      estimatedTime: number;
    }>
  >([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);
      try {
        const access = await nuclearModeService.canAccessNuclearMode(userId);
        const types = nuclearModeService.getChallengeTypes();

        setHasAccess(access.hasAccess);
        setUserTier(access.userTier);
        setUpgradeUrl(access.upgradeUrl);
        setChallengeTypes(types);
      } catch (error) {
        console.error('Error checking nuclear mode access:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [userId]);

  const handleChallengeToggle = (
    challengeType: NuclearChallengeType,
    checked: boolean
  ) => {
    if (checked) {
      onChallengesChange([...selectedChallenges, challengeType]);
    } else {
      onChallengesChange(selectedChallenges.filter((c: any) => // auto: implicit any c !== challengeType));
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 3) return { label: 'Moderate', color: 'bg-yellow-500' };
    if (difficulty <= 6) return { label: 'Intense', color: 'bg-orange-500' };
    if (difficulty <= 8) return { label: 'Extreme', color: 'bg-red-500' };
    return { label: 'NUCLEAR', color: 'bg-red-600' };
  };

  const calculateEstimatedTime = () => {
    const totalTime = selectedChallenges.reduce((total, challengeType) => {
      const challenge = challengeTypes.find((c: any) => // auto: implicit any c.type === challengeType);
      return total + (challenge?.estimatedTime || 300);
    }, 0);
    return Math.round(totalTime / 60); // Convert to minutes
  };

  const difficultyInfo = getDifficultyLabel(customDifficulty);

  if (isLoading) {
    return (
      <Card className={cn('border-orange-200', className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <Card
        className={cn(
          'border-orange-200 bg-gradient-to-r from-orange-50 to-red-50',
          className
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-orange-900 flex items-center gap-2">
                  💣 Nuclear Mode
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Extreme difficulty challenges for the ultimate wake-up experience
                </CardDescription>
              </div>
            </div>
            <Lock className="w-5 h-5 text-orange-400" />
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="border-orange-200 bg-orange-50">
            <AlertIcon className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Nuclear Mode requires a Premium subscription. This feature includes
              extreme difficulty challenges with math problems, memory tests, physical
              movements, and more.
            </AlertDescription>
          </Alert>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {challengeTypes.slice(0, 4).map((challenge: any) => // auto: implicit any {
              const Icon = challengeIcons[challenge.type];
              return (
                <div
                  key={challenge.type}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg border border-orange-100 opacity-60"
                >
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{challenge.name}</span>
                  <Lock className="w-3 h-3 text-gray-400 ml-auto" />
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              onClick={() => window.open(upgradeUrl, '_blank')}
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  Preview Nuclear Mode
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    Nuclear Mode Preview
                  </DialogTitle>
                  <DialogDescription>
                    See what you'll get with Nuclear Mode challenges
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {challengeTypes.map((challenge: any) => // auto: implicit any {
                    const Icon = challengeIcons[challenge.type];
                    return (
                      <div key={challenge.type} className="p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Icon className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {challenge.name}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {challenge.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline" className="text-xs">
                                Difficulty: {challenge.difficulty}/10
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                ~{Math.round(challenge.estimatedTime / 60)} min
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPreview(false)}>
                    Close Preview
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    onClick={() => window.open(upgradeUrl, '_blank')}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Get Premium
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'border-red-200 bg-gradient-to-r from-red-50 to-orange-50',
        className
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Zap className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-900 flex items-center gap-2">
                💣 Nuclear Mode
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium Active
                </Badge>
              </CardTitle>
              <CardDescription className="text-red-700">
                Extreme difficulty challenges that are nearly impossible to ignore
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={onEnabledChange}
            className="data-[state=checked]:bg-red-500"
          />
        </div>
      </CardHeader>

      {isEnabled && (
        <CardContent>
          <Alert className="border-red-200 bg-red-50 mb-6">
            <Alert className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Warning:</strong> Nuclear Mode disables snoozing and requires
              completing all selected challenges to dismiss the alarm. Choose your
              challenges carefully!
            </AlertDescription>
          </Alert>

          {/* Difficulty Selector */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Difficulty Level</Label>
              <Badge className={cn('text-white', difficultyInfo.color)}>
                {difficultyInfo.label} ({customDifficulty}/10)
              </Badge>
            </div>
            <Slider
              value={[customDifficulty]}
              onValueChange={(value: any) => // auto: implicit any onDifficultyChange(value[0])}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Moderate</span>
              <span>Extreme</span>
              <span>NUCLEAR</span>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Challenge Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Select Challenges</Label>
              <Badge variant="outline">{selectedChallenges.length} selected</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {challengeTypes.map((challenge: any) => // auto: implicit any {
                const Icon = challengeIcons[challenge.type];
                const isSelected = selectedChallenges.includes(challenge.type);

                return (
                  <div
                    key={challenge.type}
                    className={cn(
                      'p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md',
                      isSelected
                        ? 'border-red-200 bg-red-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                    onClick={() => handleChallengeToggle(challenge.type, !isSelected)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked: any) => // auto: implicit any
                          handleChallengeToggle(challenge.type, checked as boolean)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon
                            className={cn(
                              'w-4 h-4',
                              isSelected ? 'text-red-600' : 'text-gray-400'
                            )}
                          />
                          <h4
                            className={cn(
                              'font-medium text-sm',
                              isSelected ? 'text-red-900' : 'text-gray-900'
                            )}
                          >
                            {challenge.name}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {challenge.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            Level {challenge.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            ~{Math.round(challenge.estimatedTime / 60)}m
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedChallenges.length === 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Alert className="w-4 h-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Select at least one challenge to enable Nuclear Mode
                </AlertDescription>
              </Alert>
            )}
          </div>

          {selectedChallenges.length > 0 && (
            <>
              <Separator className="my-6" />

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-gray-900">Nuclear Mode Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Challenges:</span>
                    <span className="font-medium ml-2">
                      {selectedChallenges.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Est. Time:</span>
                    <span className="font-medium ml-2">
                      {calculateEstimatedTime()}m
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="font-medium ml-2">{difficultyInfo.label}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Snooze:</span>
                    <span className="font-medium ml-2 text-red-600">Disabled</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">Challenge Intensity</span>
                    <span className="text-xs font-medium">{customDifficulty}/10</span>
                  </div>
                  <Progress value={customDifficulty * 10} className="h-2" />
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};
export default NuclearModeSelector;
