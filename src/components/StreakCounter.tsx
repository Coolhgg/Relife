import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Flame, Zap, Trophy, Share2, Calendar, Target } from 'lucide-react';
import { UserStreak, StreakMilestone } from '../types/struggling-sam';

interface StreakCounterProps {
  userStreak: UserStreak;
  onMilestoneReached?: (milestone: StreakMilestone) => void;
  onStreakShare?: () => void;
  onStreakFreeze?: () => void;
  className?: string;
  compact?: boolean;
}

const STREAK_FIRE_LEVELS = [
  { min: 0, max: 2, emoji: '🌱', color: '#22c55e', label: 'Growing' },
  { min: 3, max: 6, emoji: '🔥', color: '#f59e0b', label: 'Warming Up' },
  { min: 7, max: 13, emoji: '🔥🔥', color: '#f97316', label: 'On Fire' },
  { min: 14, max: 29, emoji: '🔥🔥🔥', color: '#ef4444', label: 'Blazing' },
  { min: 30, max: 49, emoji: '🔥🔥🔥🔥', color: '#dc2626', label: 'Unstoppable' },
  { min: 50, max: 99, emoji: '🔥🔥🔥🔥🔥', color: '#b91c1c', label: 'Legendary' },
  { min: 100, max: Infinity, emoji: '🌟🔥🌟', color: '#7c3aed', label: 'Mythical' }
];

const MILESTONE_REWARDS = [
  { days: 3, title: 'Habit Starter', reward: 'Unlock streak freezes' },
  { days: 7, title: 'Week Warrior', reward: '15% upgrade discount' },
  { days: 14, title: 'Fortnight Champion', reward: 'Premium trial unlock' },
  { days: 30, title: 'Month Master', reward: '25% upgrade discount' },
  { days: 50, title: 'Streak Legend', reward: 'Exclusive badge' },
  { days: 100, title: 'Centurion', reward: 'Lifetime achievement' }
];

export const StreakCounter: React.FC<StreakCounterProps> = ({
  userStreak,
  onMilestoneReached,
  onStreakShare,
  onStreakFreeze,
  className = '',
  compact = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousStreak, setPreviousStreak] = useState(userStreak.currentStreak);

  // Detect streak increase and trigger celebration
  useEffect(() => {
    if (userStreak.currentStreak > previousStreak) {
      setIsAnimating(true);
      setShowCelebration(true);
      
      // Check for milestone
      const milestone = MILESTONE_REWARDS.find(m => 
        m.days === userStreak.currentStreak
      );
      
      if (milestone && onMilestoneReached) {
        setTimeout(() => {
          onMilestoneReached({
            id: `milestone-${milestone.days}`,
            streakDays: milestone.days,
            title: milestone.title,
            description: milestone.reward,
            reward: {
              type: 'badge',
              value: milestone.title,
              description: milestone.reward
            },
            celebrated: false
          });
        }, 1000);
      }

      // Reset animations
      setTimeout(() => {
        setIsAnimating(false);
        setShowCelebration(false);
      }, 3000);
    }
    setPreviousStreak(userStreak.currentStreak);
  }, [userStreak.currentStreak, previousStreak, onMilestoneReached]);

  const getFireLevel = (streak: number) => {
    return STREAK_FIRE_LEVELS.find(level => 
      streak >= level.min && streak <= level.max
    ) || STREAK_FIRE_LEVELS[0];
  };

  const getNextMilestone = () => {
    return MILESTONE_REWARDS.find(m => m.days > userStreak.currentStreak);
  };

  const getMilestoneProgress = () => {
    const nextMilestone = getNextMilestone();
    if (!nextMilestone) return 100;

    const previousMilestone = MILESTONE_REWARDS
      .filter(m => m.days <= userStreak.currentStreak)
      .pop();

    const start = previousMilestone?.days || 0;
    const end = nextMilestone.days;
    const current = userStreak.currentStreak;

    return Math.min(((current - start) / (end - start)) * 100, 100);
  };

  const fireLevel = getFireLevel(userStreak.currentStreak);
  const nextMilestone = getNextMilestone();
  const progress = getMilestoneProgress();

  if (compact) {
    return (
      <motion.div 
        className={`flex items-center gap-2 ${className}`}
        whileHover={{ scale: 1.05 }}
      >
        <motion.span
          className="text-2xl"
          animate={{
            scale: isAnimating ? [1, 1.3, 1] : 1,
            rotate: isAnimating ? [0, -10, 10, 0] : 0
          }}
          transition={{ duration: 0.6 }}
        >
          {fireLevel.emoji}
        </motion.span>
        <div>
          <div className="font-bold text-lg" style={{ color: fireLevel.color }}>
            {userStreak.currentStreak}
          </div>
          <div className="text-xs text-muted-foreground">day streak</div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="absolute inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                scale: [0, 1.2, 1],
                rotate: [0, 360]
              }}
              transition={{ duration: 2 }}
            >
              <div className="text-6xl">🎉</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="relative overflow-hidden bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold">Streak Counter</h3>
            </div>
            <Badge variant="secondary" style={{ backgroundColor: `${fireLevel.color}20`, color: fireLevel.color }}>
              {fireLevel.label}
            </Badge>
          </div>

          {/* Main Counter */}
          <div className="text-center mb-6">
            <motion.div
              className="relative inline-block"
              animate={{
                scale: isAnimating ? [1, 1.1, 1] : 1
              }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="text-6xl mb-2"
                animate={{
                  scale: isAnimating ? [1, 1.3, 1] : 1,
                  rotate: isAnimating ? [0, -5, 5, 0] : 0
                }}
                transition={{ duration: 0.6 }}
              >
                {fireLevel.emoji}
              </motion.div>
              
              {/* Glow Effect */}
              {isAnimating && (
                <motion.div
                  className="absolute inset-0 rounded-full blur-xl opacity-60"
                  style={{ backgroundColor: fireLevel.color }}
                  animate={{ 
                    scale: [0, 2, 0],
                    opacity: [0, 0.6, 0]
                  }}
                  transition={{ duration: 1.5 }}
                />
              )}
            </motion.div>

            <motion.div
              className="text-4xl font-bold mb-2"
              style={{ color: fireLevel.color }}
              animate={{
                scale: isAnimating ? [1, 1.2, 1] : 1
              }}
            >
              {userStreak.currentStreak}
            </motion.div>
            
            <div className="text-muted-foreground">
              {userStreak.currentStreak === 1 ? 'day streak' : 'days streak'}
            </div>
            
            {userStreak.longestStreak > userStreak.currentStreak && (
              <div className="text-sm text-muted-foreground mt-1">
                Personal best: {userStreak.longestStreak} days
              </div>
            )}
          </div>

          {/* Progress to Next Milestone */}
          {nextMilestone && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Next Milestone</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {nextMilestone.days - userStreak.currentStreak} days to go
                </span>
              </div>
              
              <Progress 
                value={progress} 
                className="h-3 mb-2"
                style={{
                  background: `linear-gradient(to right, ${fireLevel.color}20, transparent)`
                }}
              />
              
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{nextMilestone.title}</span>
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-yellow-500" />
                  <span className="text-muted-foreground">{nextMilestone.reward}</span>
                </div>
              </div>
            </div>
          )}

          {/* Streak Freezes */}
          {userStreak.maxFreezes > 0 && (
            <div className="flex items-center justify-between mb-4 p-3 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Streak Freezes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {userStreak.maxFreezes - userStreak.freezesUsed} left
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onStreakFreeze}
                  disabled={userStreak.freezesUsed >= userStreak.maxFreezes}
                >
                  Use Freeze
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onStreakShare}
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Streak
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-2" />
              View History
            </Button>
          </div>

          {/* Multiplier Indicator */}
          {userStreak.multiplier > 1 && (
            <motion.div
              className="mt-4 p-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20"
              animate={{
                scale: isAnimating ? [1, 1.05, 1] : 1
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">
                  {userStreak.multiplier}x Experience Multiplier!
                </span>
              </div>
            </motion.div>
          )}
        </CardContent>

        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, ${fireLevel.color} 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />
      </Card>
    </div>
  );
};