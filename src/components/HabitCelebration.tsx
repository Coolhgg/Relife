import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Trophy,
  Share2,
  X,
  Gift,
  Zap,
  Crown,
  Star,
  Sparkles,
  Award,
  Target,
  Calendar
} from 'lucide-react';
import {
  HabitCelebration as HabitCelebrationType,
  CelebrationType,
  CelebrationAnimation,
  CelebrationReward
} from '../types/struggling-sam';

interface HabitCelebrationProps {
  celebration: HabitCelebrationType | null;
  onShare?: (celebration: HabitCelebrationType) => void;
  onClose?: () => void;
  onRewardClaim?: (reward: CelebrationReward) => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  size: number;
  velocityX: number;
  velocityY: number;
}

const CELEBRATION_CONFIGS = {
  streak_milestone: {
    icon: Target,
    color: '#f59e0b',
    title: 'Streak Milestone!',
    message: 'Incredible consistency! You\'re building a powerful habit.',
    bgGradient: 'from-amber-500/20 to-orange-500/20'
  },
  achievement_unlock: {
    icon: Award,
    color: '#3b82f6',
    title: 'Achievement Unlocked!',
    message: 'You\'ve earned a new badge! Your dedication is paying off.',
    bgGradient: 'from-blue-500/20 to-indigo-500/20'
  },
  challenge_complete: {
    icon: Trophy,
    color: '#10b981',
    title: 'Challenge Complete!',
    message: 'Amazing job completing the challenge! You\'re unstoppable.',
    bgGradient: 'from-emerald-500/20 to-green-500/20'
  },
  comeback_success: {
    icon: Zap,
    color: '#8b5cf6',
    title: 'Comeback Success!',
    message: 'You bounced back stronger! True resilience in action.',
    bgGradient: 'from-purple-500/20 to-violet-500/20'
  },
  weekend_success: {
    icon: Calendar,
    color: '#f97316',
    title: 'Weekend Warrior!',
    message: 'Staying consistent on weekends shows real commitment!',
    bgGradient: 'from-orange-500/20 to-amber-500/20'
  },
  monthly_perfect: {
    icon: Crown,
    color: '#ec4899',
    title: 'Perfect Month!',
    message: 'A flawless month of consistency! You\'re truly exceptional.',
    bgGradient: 'from-pink-500/20 to-rose-500/20'
  }
};

export const HabitCelebration: React.FC<HabitCelebrationProps> = ({
  celebration,
  onShare,
  onClose,
  onRewardClaim
}) => {
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [showRewards, setShowRewards] = useState(false);
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Create confetti animation
  const createConfetti = (colors: string[], intensity: string) => {
    const pieces: ConfettiPiece[] = [];
    const pieceCount = intensity === 'subtle' ? 20 : intensity === 'moderate' ? 40 : 60;

    for (let i = 0; i < pieceCount; i++) {
      pieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        size: Math.random() * 8 + 4,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: Math.random() * 3 + 2
      });
    }

    return pieces;
  };

  // Animate confetti
  const animateConfetti = () => {
    setConfettiPieces(pieces =>
      pieces
        .map(piece => ({
          ...piece,
          x: piece.x + piece.velocityX,
          y: piece.y + piece.velocityY,
          rotation: piece.rotation + 5,
          velocityY: piece.velocityY + 0.1
        }))
        .filter(piece => piece.y < window.innerHeight + 50)
    );

    animationRef.current = requestAnimationFrame(animateConfetti);
  };

  useEffect(() => {
    if (celebration && celebration.animation.type === 'confetti') {
      const pieces = createConfetti(
        celebration.animation.colors,
        celebration.animation.intensity
      );
      setConfettiPieces(pieces);
      animateConfetti();

      // Show rewards after animation
      setTimeout(() => setShowRewards(true), 1500);

      // Auto cleanup
      setTimeout(() => {
        setConfettiPieces([]);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      }, celebration.animation.duration);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [celebration]);

  const handleRewardClaim = (reward: CelebrationReward) => {
    if (reward.immediate && !claimedRewards.includes(reward.type)) {
      setClaimedRewards(prev => [...prev, reward.type]);
      onRewardClaim?.(reward);
    }
  };

  const handleShare = () => {
    if (celebration) {
      onShare?.(celebration);
    }
  };

  if (!celebration) return null;

  const config = CELEBRATION_CONFIGS[celebration.celebrationType];
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Confetti Layer */}
        {confettiPieces.length > 0 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confettiPieces.map(piece => (
              <motion.div
                key={piece.id}
                className="absolute w-2 h-2 rounded-sm"
                style={{
                  backgroundColor: piece.color,
                  width: piece.size,
                  height: piece.size,
                  left: piece.x,
                  top: piece.y,
                  transform: `rotate(${piece.rotation}deg)`
                }}
                animate={{
                  rotate: piece.rotation + 360,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            ))}
          </div>
        )}

        {/* Celebration Modal */}
        <motion.div
          ref={containerRef}
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300
          }}
          className="relative max-w-md w-full"
        >
          <Card className={`relative overflow-hidden bg-gradient-to-br ${config.bgGradient} border-2`}
                style={{ borderColor: config.color }}>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>

            <CardContent className="p-8 text-center">
              {/* Main Icon with Pulse Animation */}
              <motion.div
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center relative"
                style={{ backgroundColor: `${config.color}15` }}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <IconComponent
                    className="w-10 h-10"
                    style={{ color: config.color }}
                  />
                </motion.div>

                {/* Glow Effect */}
                <motion.div
                  className="absolute inset-0 rounded-full opacity-30"
                  style={{ backgroundColor: config.color }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.1, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              </motion.div>

              {/* Title */}
              <motion.h2
                className="text-2xl font-bold mb-3"
                style={{ color: config.color }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {celebration.title}
              </motion.h2>

              {/* Message */}
              <motion.p
                className="text-muted-foreground mb-6 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {celebration.message}
              </motion.p>

              {/* Trigger Context */}
              <motion.div
                className="flex items-center justify-center gap-2 mb-6 p-3 bg-muted/20 rounded-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">
                  {celebration.trigger.type === 'streak_reached' && `${celebration.trigger.value} Day Streak!`}
                  {celebration.trigger.type === 'achievement_earned' && 'New Achievement Earned!'}
                  {celebration.trigger.type === 'challenge_won' && 'Challenge Victory!'}
                  {celebration.trigger.type === 'milestone_hit' && `Milestone: ${celebration.trigger.value}`}
                </span>
              </motion.div>

              {/* Rewards Section */}
              <AnimatePresence>
                {showRewards && celebration.rewards.length > 0 && (
                  <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Gift className="w-4 h-4 text-purple-500" />
                      <span className="font-medium text-sm">Rewards Unlocked!</span>
                    </div>

                    <div className="space-y-2">
                      {celebration.rewards.map((reward, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-muted/20"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                        >
                          <div className="flex items-center gap-3">
                            {reward.type === 'badge' && <Award className="w-4 h-4 text-blue-500" />}
                            {reward.type === 'experience' && <Star className="w-4 h-4 text-yellow-500" />}
                            {reward.type === 'streak_freeze' && <Zap className="w-4 h-4 text-purple-500" />}
                            {reward.type === 'discount' && <Gift className="w-4 h-4 text-green-500" />}
                            {reward.type === 'social_unlock' && <Share2 className="w-4 h-4 text-pink-500" />}

                            <div>
                              <div className="font-medium text-sm">{reward.description}</div>
                              <Badge variant="secondary" className="text-xs mt-1">
                                {reward.type.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                          </div>

                          {reward.immediate && (
                            <Button
                              size="sm"
                              variant={claimedRewards.includes(reward.type) ? "secondary" : "default"}
                              disabled={claimedRewards.includes(reward.type)}
                              onClick={() => handleRewardClaim(reward)}
                            >
                              {claimedRewards.includes(reward.type) ? 'Claimed' : 'Claim'}
                            </Button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <motion.div
                className="flex gap-3 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {celebration.socialShare.enabled && (
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Achievement
                  </Button>
                )}

                <Button
                  onClick={onClose}
                  className="flex items-center gap-2"
                  style={{ backgroundColor: config.color }}
                >
                  <Trophy className="w-4 h-4" />
                  Continue
                </Button>
              </motion.div>

              {/* Social Share Preview */}
              {celebration.socialShare.enabled && (
                <motion.div
                  className="mt-4 p-3 bg-muted/10 rounded-lg text-left"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <div className="text-xs text-muted-foreground mb-1">Share message:</div>
                  <div className="text-sm font-medium">{celebration.socialShare.defaultMessage}</div>
                  <div className="flex gap-1 mt-2">
                    {celebration.socialShare.hashtags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}
            </CardContent>

            {/* Background Pattern */}
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, ${config.color} 1px, transparent 1px)`,
                backgroundSize: '30px 30px'
              }}
            />
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};