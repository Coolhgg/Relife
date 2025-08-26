import React, { useEffect, useState, useCallback, useRef } from 'react';
import RewardNotificationSystem, {
  useRewardNotifications,
} from './RewardNotificationSystem';
import CelebrationEffects, { useCelebrationEffects } from './CelebrationEffects';
import type {
  UserReward,
  UserGiftInventory,
  UserAIInsight,
  UserHabit,
  RewardRarity,
  RewardCategory,
  GiftType,
} from '../types/reward-system';
import { rewardService } from '../services/reward-service';
import AnalyticsService from '../services/analytics';

interface RewardManagerProps {
  userId: string;
  enableSounds?: boolean;
  enableAnimations?: boolean;
  enableCelebrations?: boolean;
  children?: React.ReactNode;
}

interface RewardEventQueue {
  id: string;
  type: 'reward' | 'gift' | 'milestone' | 'streak' | 'level_up' | 'insight';
  data: any;
  timestamp: Date;
  processed: boolean;
}

const RewardManager: React.FC<RewardManagerProps> = ({
  userId,
  enableSounds = true,
  enableAnimations = true,
  enableCelebrations = true,
  children,
}) => {
  const [eventQueue, setEventQueue] = useState<RewardEventQueue[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const analytics = AnalyticsService.getInstance();
  const processingRef = useRef(false);

  // Notification and celebration hooks
  const {
    NotificationSystem,
    showRewardUnlocked,
    showGiftUnlocked,
    showMilestone,
    showStreak,
    showLevelUp,
    showInsight,
  } = useRewardNotifications();

  const {
    CelebrationEffects,
    celebrate,
    stopCelebration,
    isActive: isCelebrating,
  } = useCelebrationEffects();

  // Initialize reward service event listeners
  useEffect(() => {
    if (!userId) return;

    const handleRewardUnlocked = (reward: UserReward) => {
      addToQueue('reward', reward);
    };

    const handleGiftUnlocked = (gift: UserGiftInventory) => {
      addToQueue('gift', gift);
    };

    const handleStreakUpdated = (habit: UserHabit) => {
      if (habit.current_streak && habit.current_streak > 0) {
        addToQueue('streak', habit);
      }
    };

    const handleInsightGenerated = (insight: UserAIInsight) => {
      addToQueue('insight', insight);
    };

    // Register event listeners
    rewardService.on('reward:unlocked', handleRewardUnlocked);
    rewardService.on('gift:unlocked', handleGiftUnlocked);
    rewardService.on('streak:updated', handleStreakUpdated);
    rewardService.on('insight:generated', handleInsightGenerated);

    return () => {
      // Cleanup would go here if the service supported removing listeners
    };
  }, [userId]);

  // Add event to processing queue
  const addToQueue = useCallback((type: RewardEventQueue['type'], data: any) => {
    const event: RewardEventQueue = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      processed: false,
    };

    setEventQueue(prev => [...prev, event]);
  }, []);

  // Process events from queue
  const processQueue = useCallback(async () => {
    if (processingRef.current || eventQueue.length === 0) return;

    processingRef.current = true;
    setIsProcessing(true);

    try {
      const unprocessedEvents = eventQueue.filter(event => !event.processed);

      for (const event of unprocessedEvents) {
        await processEvent(event);

        // Mark as processed
        setEventQueue(prev =>
          prev.map(e => (e.id === event.id ? { ...e, processed: true } : e))
        );

        // Small delay between events to avoid overwhelming the user
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Clean up processed events older than 1 minute
      const cutoff = new Date(Date.now() - 60000);
      setEventQueue(prev =>
        prev.filter(event => !event.processed || event.timestamp > cutoff)
      );
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [eventQueue]);

  // Process individual event
  const processEvent = async (event: RewardEventQueue) => {
    try {
      switch (event.type) {
        case 'reward':
          await handleRewardEvent(event.data as UserReward);
          break;
        case 'gift':
          await handleGiftEvent(event.data as UserGiftInventory);
          break;
        case 'streak':
          await handleStreakEvent(event.data as UserHabit);
          break;
        case 'insight':
          await handleInsightEvent(event.data as UserAIInsight);
          break;
        case 'milestone':
          await handleMilestoneEvent(event.data);
          break;
        case 'level_up':
          await handleLevelUpEvent(event.data);
          break;
      }

      // Track event processing
      analytics.track('reward_event_processed', {
        user_id: userId,
        event_type: event.type,
        event_id: event.id,
        processing_delay: Date.now() - event.timestamp.getTime(),
      });
    } catch (error) {
      console.error('Failed to process reward event:', error);
      analytics.trackError(error as Error, 'reward_event_processing');
    }
  };

  const handleRewardEvent = async (userReward: UserReward) => {
    const reward = userReward.reward;
    if (!reward) return;

    // Show notification
    showRewardUnlocked(userReward);

    // Celebrate based on rarity
    if (enableCelebrations) {
      celebrate('reward', reward.rarity, reward.category);
    }

    // Track analytics
    analytics.track('reward_celebration_shown', {
      user_id: userId,
      reward_id: reward.id,
      reward_category: reward.category,
      reward_rarity: reward.rarity,
      points_earned: reward.points_value,
    });
  };

  const handleGiftEvent = async (userGift: UserGiftInventory) => {
    const gift = userGift.gift;
    if (!gift) return;

    // Show notification
    showGiftUnlocked(userGift);

    // Celebrate
    if (enableCelebrations) {
      celebrate('gift', gift.rarity as RewardRarity, gift.type);
    }

    // Track analytics
    analytics.track('gift_celebration_shown', {
      user_id: userId,
      gift_id: gift.id,
      gift_type: gift.type,
      payment_method: userGift.payment_method,
      cost_paid: userGift.cost_paid,
    });
  };

  const handleStreakEvent = async (habit: UserHabit) => {
    const streakDays = habit.current_streak || 0;

    // Only celebrate significant streaks
    if (
      streakDays > 0 &&
      (streakDays % 7 === 0 || streakDays === 3 || streakDays === 5)
    ) {
      showStreak(streakDays, habit.habit_name);

      if (enableCelebrations) {
        const intensity =
          streakDays >= 30
            ? 'epic'
            : streakDays >= 14
              ? 'high'
              : streakDays >= 7
                ? 'medium'
                : 'low';
        celebrate('streak', intensity as RewardRarity);
      }
    }
  };

  const handleInsightEvent = async (insight: UserAIInsight) => {
    // Only show notifications for high priority insights
    if (insight.priority === 'high' || insight.priority === 'critical') {
      showInsight(insight);
    }
  };

  const handleMilestoneEvent = async (data: any) => {
    showMilestone(data.title, data.description, data);

    if (enableCelebrations) {
      celebrate('milestone', 'epic');
    }
  };

  const handleLevelUpEvent = async (data: {
    newLevel: number;
    previousLevel: number;
  }) => {
    showLevelUp(data.newLevel, data.previousLevel);

    if (enableCelebrations) {
      celebrate('level_up', 'epic');
    }
  };

  // Process queue when events are added
  useEffect(() => {
    if (eventQueue.length > 0 && !isProcessing) {
      processQueue();
    }
  }, [eventQueue, isProcessing, processQueue]);

  // Public methods for manual triggering
  const triggerRewardCelebration = useCallback(
    (userReward: UserReward) => {
      addToQueue('reward', userReward);
    },
    [addToQueue]
  );

  const triggerGiftCelebration = useCallback(
    (userGift: UserGiftInventory) => {
      addToQueue('gift', userGift);
    },
    [addToQueue]
  );

  const triggerMilestoneCelebration = useCallback(
    (title: string, description: string, data?: any) => {
      addToQueue('milestone', { title, description, ...data });
    },
    [addToQueue]
  );

  const triggerStreakCelebration = useCallback(
    (streakDays: number, habitName?: string) => {
      addToQueue('streak', { current_streak: streakDays, habit_name: habitName });
    },
    [addToQueue]
  );

  const triggerLevelUpCelebration = useCallback(
    (newLevel: number, previousLevel: number) => {
      addToQueue('level_up', { newLevel, previousLevel });
    },
    [addToQueue]
  );

  // Expose methods via context or ref
  React.useImperativeHandle(
    React.forwardRef(() => null),
    () => ({
      triggerRewardCelebration,
      triggerGiftCelebration,
      triggerMilestoneCelebration,
      triggerStreakCelebration,
      triggerLevelUpCelebration,
      clearQueue: () => setEventQueue([]),
      stopCelebration,
    }),
    [
      triggerRewardCelebration,
      triggerGiftCelebration,
      triggerMilestoneCelebration,
      triggerStreakCelebration,
      triggerLevelUpCelebration,
      stopCelebration,
    ]
  );

  return (
    <>
      {children}

      {/* Notification System */}
      <NotificationSystem
        enableSounds={enableSounds}
        enableAnimations={enableAnimations}
        maxVisible={3}
        defaultDuration={5000}
      />

      {/* Celebration Effects */}
      {enableCelebrations && <CelebrationEffects />}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs max-w-xs">
          <div>Queue: {eventQueue.length} events</div>
          <div>Processing: {isProcessing ? 'Yes' : 'No'}</div>
          <div>Celebrating: {isCelebrating ? 'Yes' : 'No'}</div>
          {eventQueue.length > 0 && (
            <div className="mt-1 text-xs opacity-75">
              Next: {eventQueue.find(e => !e.processed)?.type || 'None'}
            </div>
          )}
        </div>
      )}
    </>
  );
};

// Context for accessing reward manager throughout the app
export const RewardManagerContext = React.createContext<{
  triggerRewardCelebration: (userReward: UserReward) => void;
  triggerGiftCelebration: (userGift: UserGiftInventory) => void;
  triggerMilestoneCelebration: (title: string, description: string, data?: any) => void;
  triggerStreakCelebration: (streakDays: number, habitName?: string) => void;
  triggerLevelUpCelebration: (newLevel: number, previousLevel: number) => void;
} | null>(null);

// Provider component
export const RewardManagerProvider: React.FC<{
  userId: string;
  enableSounds?: boolean;
  enableAnimations?: boolean;
  enableCelebrations?: boolean;
  children: React.ReactNode;
}> = ({ userId, children, ...config }) => {
  const managerRef = useRef<any>(null);

  const contextValue = {
    triggerRewardCelebration: (userReward: UserReward) => {
      managerRef.current?.triggerRewardCelebration(userReward);
    },
    triggerGiftCelebration: (userGift: UserGiftInventory) => {
      managerRef.current?.triggerGiftCelebration(userGift);
    },
    triggerMilestoneCelebration: (title: string, description: string, data?: any) => {
      managerRef.current?.triggerMilestoneCelebration(title, description, data);
    },
    triggerStreakCelebration: (streakDays: number, habitName?: string) => {
      managerRef.current?.triggerStreakCelebration(streakDays, habitName);
    },
    triggerLevelUpCelebration: (newLevel: number, previousLevel: number) => {
      managerRef.current?.triggerLevelUpCelebration(newLevel, previousLevel);
    },
  };

  return (
    <RewardManagerContext.Provider value={contextValue}>
      <RewardManager ref={managerRef} userId={userId} {...config}>
        {children}
      </RewardManager>
    </RewardManagerContext.Provider>
  );
};

// Hook for using reward manager context
export const useRewardManager = () => {
  const context = React.useContext(RewardManagerContext);
  if (!context) {
    throw new Error('useRewardManager must be used within a RewardManagerProvider');
  }
  return context;
};

export default RewardManager;
