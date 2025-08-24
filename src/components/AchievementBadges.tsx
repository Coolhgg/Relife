import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import {
  Trophy,
  Share2,
  Lock,
  Star,
  Award,
  Zap,
  Calendar,
  Users,
  Target,
  Crown,
  Medal,
  Gem,
} from 'lucide-react';
import { SamAchievement, SamAchievementType } from '../types/struggling-sam';

interface AchievementBadgesProps {
  achievements: SamAchievement[];
  onShare?: (achievement: SamAchievement) => void;
  onViewDetails?: (achievement: SamAchievement) => void;
  className?: string;
  showProgress?: boolean;
  compact?: boolean;
}

const ACHIEVEMENT_CONFIGS: Record<
  SamAchievementType,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    gradient: string;
    description: string;
    category: string;
  }
> = {
  early_bird: {
    icon: Calendar,
    color: '#22c55e',
    gradient: 'from-green-400 to-emerald-600',
    description: 'Wake up 5 consecutive days at your alarm time',
    category: 'Consistency',
  },
  consistent_riser: {
    icon: Target,
    color: '#3b82f6',
    gradient: 'from-blue-400 to-indigo-600',
    description: 'Maintain a 14-day wake-up streak',
    category: 'Dedication',
  },
  morning_champion: {
    icon: Crown,
    color: '#f59e0b',
    gradient: 'from-amber-400 to-orange-600',
    description: 'Achieve a perfect 30-day streak',
    category: 'Mastery',
  },
  streak_warrior: {
    icon: Medal,
    color: '#ef4444',
    gradient: 'from-red-400 to-rose-600',
    description: 'Reach an impressive 50-day streak',
    category: 'Warrior',
  },
  habit_master: {
    icon: Gem,
    color: '#8b5cf6',
    gradient: 'from-purple-400 to-violet-600',
    description: 'Complete 100 days of consistent wake-ups',
    category: 'Legendary',
  },
  social_butterfly: {
    icon: Share2,
    color: '#ec4899',
    gradient: 'from-pink-400 to-rose-600',
    description: 'Share 3 achievements with the community',
    category: 'Social',
  },
  community_helper: {
    icon: Users,
    color: '#06b6d4',
    gradient: 'from-cyan-400 to-blue-600',
    description: 'Join 5 social challenges',
    category: 'Community',
  },
  comeback_kid: {
    icon: Zap,
    color: '#10b981',
    gradient: 'from-emerald-400 to-green-600',
    description: 'Successfully recover from a streak break',
    category: 'Resilience',
  },
  weekend_warrior: {
    icon: Star,
    color: '#f97316',
    gradient: 'from-orange-400 to-amber-600',
    description: 'Wake up early on weekends for 4 consecutive weeks',
    category: 'Dedication',
  },
  month_perfectionist: {
    icon: Award,
    color: '#7c3aed',
    gradient: 'from-violet-400 to-purple-600',
    description: 'Complete a perfect calendar month',
    category: 'Perfectionist',
  },
};

const RARITY_CONFIGS = {
  common: {
    color: '#64748b',
    bgColor: '#f1f5f9',
    label: 'Common',
    glow: false,
  },
  rare: {
    color: '#3b82f6',
    bgColor: '#dbeafe',
    label: 'Rare',
    glow: true,
  },
  epic: {
    color: '#a855f7',
    bgColor: '#f3e8ff',
    label: 'Epic',
    glow: true,
  },
  legendary: {
    color: '#f59e0b',
    bgColor: '#fef3c7',
    label: 'Legendary',
    glow: true,
  },
};

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  achievements,
  onShare,
  onViewDetails,
  className = '',
  showProgress = true,
  compact = false,
}) => {
  const [selectedAchievement, setSelectedAchievement] = useState<SamAchievement | null>(
    null
  );
  const [hoveredAchievement, setHoveredAchievement] = useState<string | null>(null);

  const unlockedAchievements = achievements.filter((a: any) => a // auto: implicit any.unlockedAt);
  const lockedAchievements = achievements.filter((a: any) => ! // auto: implicit anya.unlockedAt);

  const getBadgeVariant = (rarity: string) => {
    const config = RARITY_CONFIGS[rarity as keyof typeof RARITY_CONFIGS];
    return config ? 'secondary' : 'default';
  };

  const AchievementCard = ({ achievement }: { achievement: SamAchievement }) => {
    const config = ACHIEVEMENT_CONFIGS[achievement.achievementType];
    const rarityConfig = RARITY_CONFIGS[achievement.rarity];
    const IconComponent = config.icon;
    const isUnlocked = !!achievement.unlockedAt;
    const isHovered = hoveredAchievement === achievement.id;

    return (
      <motion.div
        layout
        className={`relative ${compact ? 'w-16 h-16' : 'w-32 h-40'}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setHoveredAchievement(achievement.id)}
        onHoverEnd={() => setHoveredAchievement(null)}
        onClick={() => onViewDetails?.(achievement)}
      >
        <Card
          className={`
            h-full cursor-pointer transition-all duration-300 overflow-hidden
            ${isUnlocked ? 'shadow-lg hover:shadow-xl' : 'opacity-60'}
            ${isHovered && rarityConfig.glow ? 'ring-2 ring-offset-2' : ''}
          `}
          style={{
            backgroundColor: isUnlocked ? rarityConfig.bgColor : '#f8fafc',
          }}
        >
          <CardContent
            className={`p-3 h-full flex flex-col items-center justify-center relative ${compact ? 'p-2' : ''}`}
          >
            {/* Glow Effect for Rare+ Achievements */}
            {isUnlocked && rarityConfig.glow && (
              <motion.div
                className="absolute inset-0 opacity-20 rounded-lg"
                style={{
                  background: `radial-gradient(circle, ${rarityConfig.color} 0%, transparent 70%)`,
                }}
                animate={{
                  scale: isHovered ? [1, 1.2, 1] : 1,
                  opacity: isHovered ? [0.2, 0.4, 0.2] : 0.2,
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            {/* Lock Overlay for Locked Achievements */}
            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
            )}

            {/* Achievement Icon */}
            <motion.div
              className={`
                ${compact ? 'w-8 h-8 p-1.5' : 'w-12 h-12 p-2'}
                rounded-full mb-2 flex items-center justify-center
                ${isUnlocked ? `bg-gradient-to-br ${config.gradient}` : 'bg-muted'}
              `}
              animate={{
                rotate: isUnlocked && isHovered ? [0, -5, 5, 0] : 0,
              }}
              transition={{ duration: 0.5 }}
            >
              <IconComponent
                className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} ${isUnlocked ? 'text-white' : 'text-muted-foreground'}`}
              />
            </motion.div>

            {!compact && (
              <>
                {/* Achievement Title */}
                <h4
                  className={`text-xs font-medium text-center mb-1 ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {achievement.title}
                </h4>

                {/* Rarity Badge */}
                <Badge
                  variant={getBadgeVariant(achievement.rarity)}
                  className="text-xs px-2 py-0"
                  style={{
                    backgroundColor: isUnlocked ? rarityConfig.color : '#e2e8f0',
                    color: isUnlocked ? 'white' : '#64748b',
                  }}
                >
                  {rarityConfig.label}
                </Badge>

                {/* Progress Bar for In-Progress Achievements */}
                {showProgress && achievement.progress && !isUnlocked && (
                  <div className="w-full mt-2">
                    <Progress value={achievement.progress.percentage} className="h-1" />
                    <div className="text-xs text-muted-foreground text-center mt-1">
                      {achievement.progress.current}/{achievement.progress.target}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* New Achievement Indicator */}
            {isUnlocked &&
              achievement.unlockedAt &&
              new Date(achievement.unlockedAt).getTime() >
                Date.now() - 24 * 60 * 60 * 1000 && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
          </CardContent>
        </Card>

        {/* Tooltip for Compact Mode */}
        {compact && isHovered && (
          <motion.div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-popover text-popover-foreground rounded-lg shadow-lg border z-50 whitespace-nowrap text-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className="font-medium">{achievement.title}</div>
            <div className="text-muted-foreground">{config.description}</div>
            {achievement.progress && !isUnlocked && (
              <div className="text-primary">
                Progress: {achievement.progress.current}/{achievement.progress.target}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  };

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {achievements.slice(0, 8).map((achievement: any) => ({ // auto: implicit any
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
        {achievements.length > 8 && (
          <div className="w-16 h-16 flex items-center justify-center text-muted-foreground border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <span className="text-xs">+{achievements.length - 8}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achievement Gallery
            <Badge variant="secondary" className="ml-auto">
              {unlockedAchievements.length}/{achievements.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Recently Unlocked */}
          {unlockedAchievements.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Unlocked Achievements
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {unlockedAchievements.map((achievement: any) => ({ // auto: implicit any
                  <div key={achievement.id} className="relative">
                    <AchievementCard achievement={achievement} />
                    {onShare && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          onShare(achievement);
                        }}
                      >
                        <Share2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In Progress / Locked */}
          {lockedAchievements.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                In Progress
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {lockedAchievements.map((achievement: any) => ({ // auto: implicit any
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {achievements.length === 0 && (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Start Your Achievement Journey
              </h3>
              <p className="text-muted-foreground">
                Begin your morning routine to unlock your first achievement!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e: any) => e // auto: implicit any.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2">{selectedAchievement.title}</h2>
                <p className="text-muted-foreground mb-4">
                  {selectedAchievement.description}
                </p>
                {selectedAchievement.unlockedAt && (
                  <p className="text-sm text-green-600 mb-4">
                    Unlocked on{' '}
                    {new Date(selectedAchievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setSelectedAchievement(null)}>Close</Button>
                  {onShare && selectedAchievement.unlockedAt && (
                    <Button
                      variant="outline"
                      onClick={() => onShare(selectedAchievement)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default AchievementBadges;
