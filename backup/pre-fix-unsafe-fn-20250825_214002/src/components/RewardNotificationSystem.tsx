import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Trophy,
  Gift,
  Star,
  Sparkles,
  Award,
  Crown,
  Target,
  Zap,
  TrendingUp,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { 
  UserReward, 
  UserGiftInventory, 
  RewardCategory, 
  GiftType, 
  UserAIInsight,
  RewardRarity 
} from '../types/reward-system';
import { useGamingAnnouncements } from '../hooks/useGamingAnnouncements';

interface RewardNotification {
  id: string;
  type: 'reward' | 'gift' | 'milestone' | 'streak' | 'insight' | 'level_up';
  title: string;
  description: string;
  category?: RewardCategory | GiftType;
  rarity?: RewardRarity;
  icon?: React.ComponentType<any>;
  data?: any;
  timestamp: Date;
  duration?: number; // milliseconds
  persistent?: boolean;
  soundEffect?: string;
  celebrationLevel?: 'low' | 'medium' | 'high' | 'epic';
}

interface NotificationSystemProps {
  enableSounds?: boolean;
  enableAnimations?: boolean;
  maxVisible?: number;
  defaultDuration?: number;
}

const RewardNotificationSystem: React.FC<NotificationSystemProps> = ({
  enableSounds = true,
  enableAnimations = true,
  maxVisible = 3,
  defaultDuration = 5000,
}) => {
  const [notifications, setNotifications] = useState<RewardNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(enableSounds);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const { announceGaming } = useGamingAnnouncements();

  // Initialize audio
  useEffect(() => {
    if (soundEnabled && !audioRef.current) {
      audioRef.current = new Audio();
    }
  }, [soundEnabled]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const playSound = useCallback((soundType: string) => {
    if (!soundEnabled || !audioRef.current) return;

    // Map sound types to actual sound files
    const soundMap: Record<string, string> = {
      achievement: '/sounds/achievement.mp3',
      reward: '/sounds/reward.mp3',
      gift: '/sounds/gift.mp3',
      milestone: '/sounds/milestone.mp3',
      level_up: '/sounds/level-up.mp3',
      epic: '/sounds/epic-reward.mp3',
      legendary: '/sounds/legendary.mp3',
    };

    const soundFile = soundMap[soundType] || soundMap.reward;
    
    try {
      audioRef.current.src = soundFile;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {
        // Fail silently if sound can't play
      });
    } catch (error) {
      // Fail silently
    }
  }, [soundEnabled]);

  const addNotification = useCallback((notification: Omit<RewardNotification, 'id' | 'timestamp'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: RewardNotification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration || defaultDuration,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Keep only the most recent notifications
      return updated.slice(0, maxVisible);
    });

    // Play sound effect
    if (notification.soundEffect) {
      playSound(notification.soundEffect);
    } else if (notification.rarity === 'legendary') {
      playSound('legendary');
    } else if (notification.rarity === 'epic') {
      playSound('epic');
    } else {
      playSound(notification.type);
    }

    // Auto-remove notification (unless persistent)
    if (!notification.persistent) {
      const timeout = setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
      
      timeoutRefs.current.set(id, timeout);
    }

    // Announce to screen readers
    announceGaming({
      type: 'achievement',
      customMessage: `${notification.title}. ${notification.description}`,
      priority: notification.celebrationLevel === 'epic' || notification.celebrationLevel === 'high' 
        ? 'assertive' 
        : 'polite',
    });
  }, [defaultDuration, maxVisible, playSound, announceGaming]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
    setNotifications([]);
  }, []);

  const getCelebrationClass = (level?: string) => {
    switch (level) {
      case 'epic':
        return 'animate-bounce border-4 border-yellow-400 shadow-2xl';
      case 'high':
        return 'animate-pulse border-2 border-purple-400 shadow-xl';
      case 'medium':
        return 'animate-pulse border border-blue-400 shadow-lg';
      default:
        return 'shadow-md';
    }
  };

  const getNotificationColor = (type: string, rarity?: string) => {
    if (rarity === 'legendary') return 'from-yellow-500 to-orange-500 text-white';
    if (rarity === 'epic') return 'from-purple-500 to-pink-500 text-white';
    if (rarity === 'rare') return 'from-blue-500 to-indigo-500 text-white';

    switch (type) {
      case 'reward':
        return 'from-green-500 to-emerald-500 text-white';
      case 'gift':
        return 'from-purple-500 to-pink-500 text-white';
      case 'milestone':
        return 'from-blue-500 to-cyan-500 text-white';
      case 'streak':
        return 'from-orange-500 to-red-500 text-white';
      case 'level_up':
        return 'from-yellow-500 to-orange-500 text-white';
      default:
        return 'from-gray-500 to-gray-600 text-white';
    }
  };

  const getIcon = (type: string, category?: string) => {
    if (category) {
      const categoryIcons: Record<string, React.ComponentType<any>> = {
        consistency: Target,
        early_riser: Star,
        wellness: Zap,
        productivity: TrendingUp,
        social: Gift,
        explorer: Sparkles,
        master: Crown,
        challenger: Award,
        theme: Star,
        sound_pack: Volume2,
        voice_personality: Star,
        alarm_tone: Volume2,
        background: Star,
        icon_pack: Star,
        premium_trial: Crown,
        feature_unlock: CheckCircle2,
      };
      
      if (categoryIcons[category]) {
        return categoryIcons[category];
      }
    }

    switch (type) {
      case 'reward':
        return Trophy;
      case 'gift':
        return Gift;
      case 'milestone':
        return Star;
      case 'streak':
        return Target;
      case 'level_up':
        return Crown;
      default:
        return Award;
    }
  };

  // Public methods for creating notifications
  const showRewardNotification = useCallback((userReward: UserReward) => {
    const reward = userReward.reward;
    if (!reward) return;

    addNotification({
      type: 'reward',
      title: `🏆 ${reward.name}`,
      description: reward.description || 'Achievement unlocked!',
      category: reward.category,
      rarity: reward.rarity,
      celebrationLevel: reward.rarity === 'legendary' ? 'epic' : 
                       reward.rarity === 'epic' ? 'high' :
                       reward.rarity === 'rare' ? 'medium' : 'low',
      soundEffect: reward.rarity,
      data: userReward,
    });
  }, [addNotification]);

  const showGiftNotification = useCallback((userGift: UserGiftInventory) => {
    const gift = userGift.gift;
    if (!gift) return;

    addNotification({
      type: 'gift',
      title: `🎁 ${gift.name}`,
      description: `New ${gift.type.replace('_', ' ')} unlocked!`,
      category: gift.type,
      rarity: gift.rarity as RewardRarity,
      celebrationLevel: 'medium',
      soundEffect: 'gift',
      data: userGift,
    });
  }, [addNotification]);

  const showMilestoneNotification = useCallback((milestone: string, description: string, data?: any) => {
    addNotification({
      type: 'milestone',
      title: `⭐ ${milestone}`,
      description,
      celebrationLevel: 'high',
      soundEffect: 'milestone',
      data,
    });
  }, [addNotification]);

  const showStreakNotification = useCallback((streakDays: number, category?: string) => {
    const celebrationLevel = streakDays >= 30 ? 'epic' :
                            streakDays >= 14 ? 'high' :
                            streakDays >= 7 ? 'medium' : 'low';

    addNotification({
      type: 'streak',
      title: `🔥 ${streakDays} Day Streak!`,
      description: `Amazing consistency${category ? ` in ${category}` : ''}!`,
      celebrationLevel,
      soundEffect: streakDays >= 30 ? 'epic' : 'achievement',
      data: { streakDays, category },
    });
  }, [addNotification]);

  const showLevelUpNotification = useCallback((newLevel: number, previousLevel: number) => {
    addNotification({
      type: 'level_up',
      title: `👑 Level ${newLevel}!`,
      description: `Leveled up from ${previousLevel} to ${newLevel}!`,
      celebrationLevel: 'high',
      soundEffect: 'level_up',
      data: { newLevel, previousLevel },
    });
  }, [addNotification]);

  const showInsightNotification = useCallback((insight: UserAIInsight) => {
    addNotification({
      type: 'insight',
      title: `💡 ${insight.title}`,
      description: insight.description,
      celebrationLevel: 'low',
      duration: 8000, // Longer for insights
      data: insight,
    });
  }, [addNotification]);

  // Expose methods for external use
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    showRewardNotification,
    showGiftNotification,
    showMilestoneNotification,
    showStreakNotification,
    showLevelUpNotification,
    showInsightNotification,
    clearAllNotifications,
  }), [
    showRewardNotification,
    showGiftNotification,
    showMilestoneNotification,
    showStreakNotification,
    showLevelUpNotification,
    showInsightNotification,
    clearAllNotifications,
  ]);

  return (
    <>
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
        {notifications.map(notification => {
          const Icon = getIcon(notification.type, notification.category);
          const bgClass = getNotificationColor(notification.type, notification.rarity);
          const celebrationClass = getCelebrationClass(notification.celebrationLevel);

          return (
            <div
              key={notification.id}
              className={`
                relative overflow-hidden rounded-lg p-4 shadow-lg
                bg-gradient-to-r ${bgClass} ${celebrationClass}
                transform transition-all duration-300 ease-in-out
                hover:scale-105 cursor-pointer
                ${enableAnimations ? 'animate-slide-in-right' : ''}
              `}
              onClick={() => removeNotification(notification.id)}
            >
              {/* Celebration Effects */}
              {enableAnimations && (notification.celebrationLevel === 'epic' || notification.celebrationLevel === 'high') && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-white opacity-60 rounded-full animate-ping"></div>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-white opacity-60 rounded-full animate-ping animation-delay-200"></div>
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white opacity-60 rounded-full animate-ping animation-delay-400"></div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white opacity-60 rounded-full animate-ping animation-delay-600"></div>
                </div>
              )}

              {/* Sparkle Effect for Legendary */}
              {enableAnimations && notification.rarity === 'legendary' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
                      style={{
                        left: `${20 + (i * 15)}%`,
                        top: `${20 + (i % 3) * 20}%`,
                        animationDelay: `${i * 200}ms`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Main Content */}
              <div className="relative flex items-start space-x-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm leading-5">{notification.title}</h4>
                  <p className="text-sm opacity-90 mt-1 leading-5">{notification.description}</p>
                  
                  {/* Rarity Badge */}
                  {notification.rarity && notification.rarity !== 'common' && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {notification.rarity.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                  className="flex-shrink-0 w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar */}
              {!notification.persistent && notification.duration && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white bg-opacity-20">
                  <div 
                    className="h-full bg-white bg-opacity-60 animate-shrink-width"
                    style={{ animationDuration: `${notification.duration}ms` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sound Toggle */}
      {enableSounds && (
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="fixed bottom-4 right-4 z-40 w-12 h-12 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      )}

      {/* Global Styles for Animations */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }

        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        .animate-twinkle {
          animation: twinkle 1.5s ease-in-out infinite;
        }

        .animate-shrink-width {
          animation: shrink-width linear;
          animation-fill-mode: forwards;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animation-delay-600 {
          animation-delay: 600ms;
        }
      `}</style>
    </>
  );
};

// Hook for using the notification system
export const useRewardNotifications = () => {
  const [notificationSystem, setNotificationSystem] = useState<any>(null);

  const showRewardUnlocked = useCallback((userReward: UserReward) => {
    notificationSystem?.showRewardNotification(userReward);
  }, [notificationSystem]);

  const showGiftUnlocked = useCallback((userGift: UserGiftInventory) => {
    notificationSystem?.showGiftNotification(userGift);
  }, [notificationSystem]);

  const showMilestone = useCallback((milestone: string, description: string, data?: any) => {
    notificationSystem?.showMilestoneNotification(milestone, description, data);
  }, [notificationSystem]);

  const showStreak = useCallback((streakDays: number, category?: string) => {
    notificationSystem?.showStreakNotification(streakDays, category);
  }, [notificationSystem]);

  const showLevelUp = useCallback((newLevel: number, previousLevel: number) => {
    notificationSystem?.showLevelUpNotification(newLevel, previousLevel);
  }, [notificationSystem]);

  const showInsight = useCallback((insight: UserAIInsight) => {
    notificationSystem?.showInsightNotification(insight);
  }, [notificationSystem]);

  const clearAll = useCallback(() => {
    notificationSystem?.clearAllNotifications();
  }, [notificationSystem]);

  return {
    NotificationSystem: React.forwardRef<any, NotificationSystemProps>((props, ref) => {
      React.useImperativeHandle(ref, () => notificationSystem, [notificationSystem]);
      
      return (
        <RewardNotificationSystem
          {...props}
          ref={(instance) => setNotificationSystem(instance)}
        />
      );
    }),
    showRewardUnlocked,
    showGiftUnlocked,
    showMilestone,
    showStreak,
    showLevelUp,
    showInsight,
    clearAll,
  };
};

export default RewardNotificationSystem;