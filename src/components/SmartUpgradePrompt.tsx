import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { TimeoutHandle } from '../types/timers';
import { config } from '../config/environment';
import {
  Crown,
  X,
  Sparkles,
  Users,
  Zap,
  Gift,
  Clock,
  Star,
  TrendingUp,
  Shield,
  Heart,
} from 'lucide-react';
import {
  SmartUpgradePrompt as SmartUpgradePromptType,
  UpgradePromptType,
  UpgradeTriggerType,
} from '../types/struggling-sam';

interface SmartUpgradePromptProps {
  prompt: SmartUpgradePromptType | null;
  onUpgrade?: (prompt: SmartUpgradePromptType) => void;
  onDismiss?: (prompt: SmartUpgradePromptType) => void;
  onLearnMore?: (prompt: SmartUpgradePromptType) => void;
}

const PROMPT_TYPE_CONFIGS = {
  celebration_offer: {
    icon: Gift,
    color: '#f59e0b',
    bgGradient: 'from-amber-500/15 to-orange-500/15',
    title: 'Celebration Time!',
    ctaText: 'Celebrate with Premium',
  },
  feature_unlock: {
    icon: Zap,
    color: '#8b5cf6',
    bgGradient: 'from-purple-500/15 to-violet-500/15',
    title: 'Unlock Your Potential',
    ctaText: 'Unlock Features',
  },
  social_proof: {
    icon: Users,
    color: '#06b6d4',
    bgGradient: 'from-cyan-500/15 to-blue-500/15',
    title: 'Join the Community',
    ctaText: 'Join Premium Users',
  },
  limited_time: {
    icon: Clock,
    color: '#ef4444',
    bgGradient: 'from-red-500/15 to-rose-500/15',
    title: 'Limited Time Offer',
    ctaText: 'Claim Offer Now',
  },
  habit_milestone: {
    icon: TrendingUp,
    color: '#10b981',
    bgGradient: 'from-emerald-500/15 to-green-500/15',
    title: 'Supercharge Your Success',
    ctaText: 'Power Up Your Habits',
  },
  gentle_nudge: {
    icon: Heart,
    color: '#ec4899',
    bgGradient: 'from-pink-500/15 to-rose-500/15',
    title: 'Ready for More?',
    ctaText: 'Explore Premium',
  },
};

const TRIGGER_MESSAGES = {
  streak_milestone: 'Amazing streak achievement!',
  achievement_unlock: 'New achievement unlocked!',
  social_sharing: 'You shared your success!',
  challenge_completion: 'Challenge completed!',
  habit_formation: 'Habit successfully formed!',
  feature_limitation: "You've hit the free limit",
  peer_influence: 'Your friends are succeeding!',
};

export const SmartUpgradePrompt: React.FC<SmartUpgradePromptProps> = ({
  prompt,
  onUpgrade,
  onDismiss,
  onLearnMore,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (prompt && prompt.urgency.expiresAt) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const expiry = new Date(prompt.urgency.expiresAt!).getTime();
        const diff = expiry - now;

        if (diff <= 0) {
          setTimeRemaining('Expired');
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTimeRemaining(`${minutes}m`);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [prompt]);

  useEffect(() => {
    if (prompt) {
      setIsVisible(true);
    }
  }, [prompt]);

  const handleUpgrade = () => {
    if (prompt) {
      onUpgrade?.(prompt);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    if (prompt) {
      onDismiss?.(prompt);
      setIsVisible(false);
    }
  };

  const handleLearnMore = () => {
    if (prompt) {
      onLearnMore?.(prompt);
    }
  };

  if (!prompt || !isVisible) return null;

  const config = PROMPT_TYPE_CONFIGS[prompt.promptType];
  const IconComponent = config.icon;
  const hasDiscount = prompt.discount && prompt.discount.percentage > 0;
  const urgencyLevel = prompt.urgency.level;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-md w-full"
        >
          <Card
            className={`relative overflow-hidden bg-gradient-to-br ${_config.bgGradient} border-2`}
            style={{ borderColor: `${_config.color}40` }}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>

            <CardContent className="p-6">
              {/* Header Section */}
              <div className="text-center mb-6">
                {/* Trigger Context */}
                <motion.div
                  className="inline-flex items-center gap-2 px-3 py-1 bg-muted/20 rounded-full mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs font-medium">
                    {TRIGGER_MESSAGES[prompt.triggerType]}
                  </span>
                </motion.div>

                {/* Main Icon */}
                <motion.div
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center relative"
                  style={{ backgroundColor: `${_config.color}20` }}
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                  }}
                >
                  <IconComponent className="w-8 h-8" style={{ color: _config.color }} />

                  {urgencyLevel === 'high' && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: _config.color }}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.1, 0.2],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                    />
                  )}
                </motion.div>

                {/* Title */}
                <h2 className="text-xl font-bold mb-2" style={{ color: _config.color }}>
                  {prompt.title}
                </h2>

                {/* Context Info */}
                {prompt.context.streakDays > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">
                      {prompt.context.streakDays} day streak achieved!
                    </span>
                  </div>
                )}

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {prompt.description}
                </p>
              </div>

              {/* Benefits Section */}
              <div className="mb-6">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Premium Benefits
                </h3>
                <div className="space-y-2">
                  {prompt.benefits.slice(0, 3).map((benefit, _index) => (
                    <motion.div
                      key={_index}
                      className="flex items-start gap-3 text-sm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + _index * 0.1 }}
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      <span>{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Discount Section */}
              {hasDiscount && (
                <motion.div
                  className="mb-6 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-lg text-green-600">
                      {prompt.discount!.percentage}% OFF
                    </span>
                  </div>
                  <p className="text-sm text-center text-green-700">
                    {prompt.discount!.reason}
                  </p>
                  {prompt.discount!.code && (
                    <div className="mt-2 p-2 bg-green-100 rounded border-2 border-dashed border-green-300 text-center">
                      <span className="font-mono font-bold text-green-800">
                        {prompt.discount!.code}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Social Proof */}
              {prompt.socialProof && (
                <motion.div
                  className="mb-6 p-3 bg-muted/20 rounded-lg text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-sm text-muted-foreground">{prompt.socialProof}</p>
                </motion.div>
              )}

              {/* Urgency Timer */}
              {prompt.urgency.expiresAt && timeRemaining !== 'Expired' && (
                <motion.div
                  className={`mb-6 p-3 rounded-lg text-center ${
                    urgencyLevel === 'high'
                      ? 'bg-red-500/10 border border-red-500/20'
                      : urgencyLevel === 'medium'
                        ? 'bg-orange-500/10 border border-orange-500/20'
                        : 'bg-blue-500/10 border border-blue-500/20'
                  }`}
                  animate={
                    urgencyLevel === 'high'
                      ? {
                          scale: [1, 1.02, 1],
                        }
                      : {}
                  }
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock
                      className={`w-4 h-4 ${
                        urgencyLevel === 'high'
                          ? 'text-red-500'
                          : urgencyLevel === 'medium'
                            ? 'text-orange-500'
                            : 'text-blue-500'
                      }`}
                    />
                    <span className="font-medium text-sm">
                      {prompt.urgency.message}
                    </span>
                  </div>
                  <div
                    className={`font-bold ${
                      urgencyLevel === 'high'
                        ? 'text-red-600'
                        : urgencyLevel === 'medium'
                          ? 'text-orange-600'
                          : 'text-blue-600'
                    }`}
                  >
                    {timeRemaining} remaining
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleLearnMore}>
                  Learn More
                </Button>
                <Button
                  className="flex-2"
                  onClick={handleUpgrade}
                  style={{ backgroundColor: _config.color }}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  {_config.ctaText}
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-muted/20">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    30-day guarantee
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Join 15k+ users</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">4.9/5 rating</span>
                </div>
              </div>
            </CardContent>

            {/* Background Pattern */}
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 30% 70%, ${_config.color} 1px, transparent 1px)`,
                backgroundSize: '25px 25px',
              }}
            />
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
export default SmartUpgradePrompt;
