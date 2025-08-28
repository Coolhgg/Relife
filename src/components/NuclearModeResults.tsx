import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import {
  Trophy,
  Zap,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Star,
  Award,
  Brain,
  Timer,
  CheckCircle,
  XCircle,
  BarChart3,
  Share2,
  RefreshCw,
  Crown,
  Flame,
  Medal,
  Activity,
} from 'lucide-react';
import type {
  NuclearModeSession,
  NuclearPerformance,
  NuclearChallengeAttempt,
} from '../types';
import { nuclearModeService } from '../services/nuclear-mode';
import { cn } from '../lib/utils';

interface NuclearModeResultsProps {
  session: NuclearModeSession;
  onRestart?: () => void;
  onDismiss: () => void;
  className?: string;
}

interface PerformanceMetric {
  label: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

export const NuclearModeResults: React.FC<NuclearModeResultsProps> = ({
  session,
  onRestart,
  onDismiss,
  className,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const userStats = await nuclearModeService.getNuclearStats(session.userId);
        setStats(userStats);
      } catch (error) {
        console.error('Error loading nuclear stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [session.userId]);

  const isSuccess = session.result === 'completed';
  const performance = session.performance;

  const performanceMetrics: PerformanceMetric[] = [
    {
      label: 'Overall Score',
      value: performance.overallScore,
      icon: Trophy,
      color:
        performance.overallScore >= 80
          ? 'text-green-600'
          : performance.overallScore >= 60
            ? 'text-yellow-600'
            : 'text-red-600',
      description: 'Combined performance across all challenges',
    },
    {
      label: 'Speed',
      value: performance.speed,
      icon: Timer,
      color:
        performance.speed >= 80
          ? 'text-blue-600'
          : performance.speed >= 60
            ? 'text-yellow-600'
            : 'text-red-600',
      description: 'How quickly you completed challenges',
    },
    {
      label: 'Accuracy',
      value: performance.accuracy,
      icon: Target,
      color:
        performance.accuracy >= 90
          ? 'text-green-600'
          : performance.accuracy >= 70
            ? 'text-yellow-600'
            : 'text-red-600',
      description: 'Percentage of challenges completed correctly on first try',
    },
    {
      label: 'Persistence',
      value: performance.persistence,
      icon: Flame,
      color:
        performance.persistence >= 80
          ? 'text-orange-600'
          : performance.persistence >= 60
            ? 'text-yellow-600'
            : 'text-red-600',
      description: 'Determination shown when facing difficult challenges',
    },
  ];

  const getOverallRating = (
    score: number
  ): { label: string; color: string; icon: React.ComponentType<any> } => {
    if (score >= 90)
      return { label: 'Nuclear Master', color: 'text-purple-600', icon: Crown };
    if (score >= 80)
      return { label: 'Explosive Expert', color: 'text-orange-600', icon: Medal };
    if (score >= 70)
      return { label: 'Bomb Specialist', color: 'text-blue-600', icon: Award };
    if (score >= 60)
      return { label: 'Blast Rookie', color: 'text-green-600', icon: Star };
    return { label: 'Training Needed', color: 'text-gray-600', icon: RefreshCw };
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const rating = getOverallRating(performance.overallScore);

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4',
        className
      )}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <Card
          className={cn(
            'text-center',
            isSuccess
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
              : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
          )}
        >
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div
                className={cn(
                  'p-4 rounded-full',
                  isSuccess ? 'bg-green-100' : 'bg-red-100'
                )}
              >
                {isSuccess ? (
                  <Trophy className="w-12 h-12 text-green-600" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
              </div>
            </div>

            <CardTitle
              className={cn(
                'text-3xl font-bold',
                isSuccess ? 'text-green-900' : 'text-red-900'
              )}
            >
              {isSuccess ? '💣 Nuclear Mode Completed!' : '💥 Nuclear Mode Failed'}
            </CardTitle>

            <CardDescription
              className={cn('text-lg', isSuccess ? 'text-green-700' : 'text-red-700')}
            >
              {isSuccess
                ? 'Congratulations! You conquered all challenges!'
                : "Don't give up! Every failure teaches valuable lessons."}
            </CardDescription>

            {/* Overall Rating */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <rating.icon className={cn('w-6 h-6', rating.color)} />
              <span className={cn('text-xl font-semibold', rating.color)}>
                {rating.label}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {performanceMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label} className="text-center">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <Icon className={cn('w-6 h-6', metric.color)} />
                    </div>
                  </div>
                  <div className={cn('text-2xl font-bold mb-1', metric.color)}>
                    {metric.value}%
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    {metric.label}
                  </div>
                  <Progress value={metric.value} className="h-2" />
                  <div className="text-xs text-gray-500 mt-2">{metric.description}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Session Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Session Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Challenge Results</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium text-green-600">
                      {session.successfulChallenges}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Failed:</span>
                    <span className="font-medium text-red-600">
                      {session.failedChallenges}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Attempts:</span>
                    <span className="font-medium">{session.totalAttempts}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Time & Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">
                      {formatDuration(session.sessionDuration)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="font-medium">{session.difficulty}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Improvement:</span>
                    <span
                      className={cn(
                        'font-medium flex items-center gap-1',
                        performance.improvement >= 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {performance.improvement >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(performance.improvement)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Global Ranking</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Rank:</span>
                    <span className="font-medium">#{performance.rank}</span>
                  </div>
                  {stats && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-medium">
                          {Math.round(stats.successRate)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Best Score:</span>
                        <span className="font-medium">{stats.bestScore}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        {performance.achievements.length > 0 && (
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Award className="w-5 h-5" />
                Achievements Unlocked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {performance.achievements.map((achievement, index) => (
                  <Badge
                    key={achievement}
                    className="bg-yellow-100 text-yellow-800 px-3 py-2"
                  >
                    <Trophy className="w-3 h-3 mr-1" />
                    {achievement
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Challenge Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Challenge Breakdown
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {session.challenges.map((attempt: NuclearChallengeAttempt, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-4 rounded-lg border',
                    attempt.successful
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {attempt.successful ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <h4 className="font-semibold">{attempt.challenge.title}</h4>
                    </div>
                    <Badge variant={attempt.successful ? 'default' : 'destructive'}>
                      Attempt {attempt.attemptNumber}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Time: {attempt.timeToComplete}s</span>
                    <span>Hints: {attempt.hintsUsed}</span>
                    <span>Errors: {attempt.errorsMade}</span>
                  </div>

                  {showDetails && attempt.details && (
                    <div className="mt-3 p-3 bg-white rounded border text-sm">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(attempt.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={onDismiss}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Dismiss Alarm
              </Button>

              {onRestart && !isSuccess && (
                <Button onClick={onRestart} variant="outline" className="flex-1 h-12">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Try Again
                </Button>
              )}

              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={() => {
                  // Share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: 'Nuclear Mode Results',
                      text: `I just ${isSuccess ? 'completed' : 'attempted'} Nuclear Mode with a score of ${performance.overallScore}%!`,
                    });
                  }
                }}
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips for Improvement */}
        {!isSuccess && (
          <AlertCircle className="border-blue-200 bg-blue-50">
            <Brain className="w-4 h-4 text-blue-600" />
            <AlertCircleDescription className="text-blue-800">
              <strong>Tips for next time:</strong> Practice math problems, memory games,
              and speed challenges. Consider adjusting difficulty or selecting fewer
              challenges to build confidence.
            </AlertCircleDescription>
          </AlertCircle>
        )}
      </div>
    </div>
  );
};
export default NuclearModeResults;
