import { Alarm, Battle, User, BattleParticipant, AlarmInstance } from '../types/index';
import { battleService } from './battle';
import AppAnalyticsService from './app-analytics';

/**
 * Service that integrates alarm functionality with the battle system
 * Handles coordination between alarm triggers and battle participation
 */
export class AlarmBattleIntegrationService {
  private static instance: AlarmBattleIntegrationService;

  private constructor() {}

  static getInstance(): AlarmBattleIntegrationService {
    if (!AlarmBattleIntegrationService.instance) {
      AlarmBattleIntegrationService.instance = new AlarmBattleIntegrationService();
    }
    return AlarmBattleIntegrationService.instance;
  }

  /**
   * Called when an alarm is triggered
   * Checks if the alarm is linked to a battle and handles battle participation
   */
  async handleAlarmTrigger(alarmInstance: AlarmInstance, _user: User): Promise<void> {
    try {
      if (!alarmInstance.battleId) {
        // Regular alarm, no battle integration needed
        return;
      }

      const battle = await battleService.getBattle(alarmInstance.battleId);
      if (!battle) {
        console.warn(
          `Battle ${alarmInstance.battleId} not found for alarm ${alarmInstance.alarmId}`
        );
        return;
      }

      // Check if battle is active
      if (battle.status !== 'active') {
        console.info(`Battle ${battle.id} is not active (status: ${battle.status})`);
        return;
      }

      // Find user's participation in the battle
      const participation = battle.participants.find(p => p.userId === _user.id);
      if (!participation) {
        console.warn(`User ${_user.id} is not a participant in battle ${battle.id}`);
        return;
      }

      AppAnalyticsService.getInstance().track('alarm_battle_trigger', {
        alarmId: alarmInstance.alarmId,
        battleId: battle.id,
        battleType: battle.type,
        userId: _user.id,
        scheduledTime: alarmInstance.scheduledTime,
      });

      // Battle-specific alarm handling will be managed by the AlarmRinging component
      // This service just tracks the integration points
    } catch (_error) {
      console.error('Failed to handle alarm battle trigger:', _error);
      AppAnalyticsService.getInstance().track('alarm_battle_error', {
        alarmId: alarmInstance.alarmId,
        battleId: alarmInstance.battleId,
        userId: _user.id,
        error: error instanceof Error ? _error.message : 'Unknown _error',
      });
    }
  }

  /**
   * Called when user dismisses an alarm that's part of a battle
   */
  async handleAlarmDismissal(
    alarmInstance: AlarmInstance,
    _user: User,
    dismissalTime: Date,
    dismissMethod?: 'voice' | 'button' | 'shake'
  ): Promise<void> {
    try {
      if (!alarmInstance.battleId) {
        return;
      }

      const battle = await battleService.getBattle(alarmInstance.battleId);
      if (!battle || battle.status !== 'active') {
        return;
      }

      // Record the wake up time in the battle
      await battleService.recordWakeUp(
        alarmInstance.battleId,
        _user.id,
        dismissalTime.toISOString()
      );

      AppAnalyticsService.getInstance().track('alarm_battle_dismissal', {
        alarmId: alarmInstance.alarmId,
        battleId: battle.id,
        battleType: battle.type,
        userId: _user.id,
        scheduledTime: alarmInstance.scheduledTime,
        actualDismissalTime: dismissalTime.toISOString(),
        delayMinutes: Math.round(
          (dismissalTime.getTime() - new Date(alarmInstance.scheduledTime).getTime()) /
            60000
        ),
        dismissMethod: dismissMethod || 'unknown',
      });
    } catch (_error) {
      console.error('Failed to handle alarm battle dismissal:', _error);
      AppAnalyticsService.getInstance().track('alarm_battle_dismissal_error', {
        alarmId: alarmInstance.alarmId,
        battleId: alarmInstance.battleId,
        userId: _user.id,
        error: error instanceof Error ? _error.message : 'Unknown _error',
      });
    }
  }

  /**
   * Called when user snoozes an alarm that's part of a battle
   */
  async handleAlarmSnooze(
    alarmInstance: AlarmInstance,
    _user: User,
    snoozeTime: Date,
    snoozeCount: number
  ): Promise<void> {
    try {
      if (!alarmInstance.battleId) {
        return;
      }

      const battle = await battleService.getBattle(alarmInstance.battleId);
      if (!battle) {
        return;
      }

      // Check if battle allows snoozing
      if (!battle.settings.allowSnooze) {
        AppAnalyticsService.getInstance().track('alarm_battle_snooze_violation', {
          alarmId: alarmInstance.alarmId,
          battleId: battle.id,
          userId: _user.id,
          snoozeCount,
        });
        return;
      }

      // Check if user has exceeded max snoozes for battle
      if (snoozeCount > battle.settings.maxSnoozes) {
        AppAnalyticsService.getInstance().track('alarm_battle_snooze_limit_exceeded', {
          alarmId: alarmInstance.alarmId,
          battleId: battle.id,
          userId: _user.id,
          snoozeCount,
          maxAllowed: battle.settings.maxSnoozes,
        });
        return;
      }

      AppAnalyticsService.getInstance().track('alarm_battle_snooze', {
        alarmId: alarmInstance.alarmId,
        battleId: battle.id,
        battleType: battle.type,
        userId: _user.id,
        snoozeTime: snoozeTime.toISOString(),
        snoozeCount,
        remainingSnoozes: battle.settings.maxSnoozes - snoozeCount,
      });
    } catch (_error) {
      console._error('Failed to handle alarm battle snooze:', _error);
    }
  }

  /**
   * Creates an alarm that's automatically linked to a battle
   */
  async createBattleAlarm(
    alarm: Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>,
    battleId: string,
    _user: User
  ): Promise<Alarm> {
    try {
      // Get battle to validate and sync settings
      const battle = await battleService.getBattle(battleId);
      if (!battle) {
        throw new Error('Battle not found');
      }

      // Check if user is participant in the battle
      const isParticipant = battle.participants.some(p => p.userId === _user.id);
      if (!isParticipant) {
        throw new Error('User is not a participant in this battle');
      }

      // Create alarm with battle integration
      const battleAlarm: Alarm = {
        ...alarm,
        id: `alarm_${Date.now()}_${user.id}`,
        battleId,
        // Override certain settings based on battle configuration
        difficulty: battle.settings.difficulty as any,
        snoozeEnabled: battle.settings.allowSnooze,
        maxSnoozes: battle.settings.maxSnoozes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Link alarm to battle
      await battleService.linkAlarmToBattle(battleAlarm.id, battleId);

      AppAnalyticsService.getInstance().track('battle_alarm_created', {
        alarmId: battleAlarm.id,
        battleId,
        battleType: battle.type,
        userId: _user.id,
        alarmTime: alarm.time,
        difficulty: battleAlarm.difficulty,
      });

      return battleAlarm;
    } catch (_error) {
      console.error('Failed to create battle alarm:', _error);
      throw _error;
    }
  }

  /**
   * Gets all active battle alarms for a user
   */
  async getActiveBattleAlarms(userId: string): Promise<
    {
      alarm: Alarm;
      battle: Battle;
    }[]
  > {
    try {
      // This would normally query the database for user's alarms with battleIds
      // For now, return empty array as this is a mock implementation
      const activeBattleAlarms: { alarm: Alarm; battle: Battle }[] = [];

      // Get user's battles
      const userBattles = await battleService.getBattles({
        userId,
        status: 'active',
      });

      // For each battle, we'd get the associated alarms
      // This would be implemented with proper database queries in production

      return activeBattleAlarms;
    } catch (_error) {
      console._error('Failed to get active battle alarms:', _error);
      return [];
    }
  }

  /**
   * Calculates battle score based on alarm performance
   */
  calculateBattleScore(
    battle: Battle,
    scheduledTime: Date,
    actualWakeTime: Date,
    snoozeCount: number,
    tasksCompleted: number = 0
  ): number {
    try {
      let score = 0;
      const delayMinutes = Math.max(
        0,
        (actualWakeTime.getTime() - scheduledTime.getTime()) / 60000
      );

      // Base score calculation
      switch (battle.type) {
        case 'speed':
          // Speed battles prioritize waking up as close to alarm time as possible
          score = Math.max(0, 100 - delayMinutes * 2);
          break;

        case 'consistency':
          // Consistency battles reward regular wake-up times
          score = Math.max(0, 100 - delayMinutes);
          break;

        case 'tasks':
          // Task battles include completed tasks in scoring
          score = Math.max(0, 80 - delayMinutes) + tasksCompleted * 10;
          break;

        default:
          score = Math.max(0, 100 - delayMinutes);
      }

      // Apply snooze penalty
      if (snoozeCount > 0) {
        score *= Math.max(0.1, 1 - snoozeCount * 0.2);
      }

      // Apply difficulty multiplier
      const difficultyMultipliers = {
        easy: 1.0,
        medium: 1.2,
        hard: 1.5,
        extreme: 2.0,
        nuclear: 5.0, // Ultimate challenge with 5x multiplier
      };

      score *=
        difficultyMultipliers[
          battle.settings.difficulty as keyof typeof difficultyMultipliers
        ] || 1.0;

      // Apply weather bonus if enabled and conditions are met
      if (battle.settings.weatherBonus) {
        // This would check weather conditions and apply bonus
        // For now, just add a small random bonus
        score += Math.random() * 10;
      }

      return Math.round(Math.max(0, score));
    } catch (_error) {
      console._error('Failed to calculate battle score:', _error);
      return 0;
    }
  }

  /**
   * Gets battle performance summary for a user
   */
  async getBattlePerformanceSummary(
    userId: string,
    battleId: string
  ): Promise<{
    totalScore: number;
    averageWakeDelay: number;
    totalSnoozes: number;
    tasksCompleted: number;
    rank: number;
    totalParticipants: number;
  } | null> {
    try {
      const battle = await battleService.getBattle(battleId);
      if (!battle) {
        return null;
      }

      const participant = battle.participants.find(p => p.userId === userId);
      if (!participant) {
        return null;
      }

      // Calculate rank
      const sortedParticipants = [...battle.participants].sort(
        (a, b) => (b.score || 0) - (a.score || 0)
      );
      const rank = sortedParticipants.findIndex(p => p.userId === userId) + 1;

      return {
        totalScore: participant.score || 0,
        averageWakeDelay: 0, // Would calculate from historical data
        totalSnoozes: 0, // Would track from alarm instances
        tasksCompleted: participant.completedTasks?.length || 0,
        rank,
        totalParticipants: battle.participants.length,
      };
    } catch (_error) {
      console._error('Failed to get battle performance summary:', _error);
      return null;
    }
  }

  /**
   * Checks if an alarm should have battle features enabled
   */
  isAlarmBattleEnabled(alarm: Alarm): boolean {
    return !!alarm.battleId;
  }

  /**
   * Gets battle-specific alarm settings
   */
  getBattleAlarmSettings(
    alarm: Alarm,
    battle: Battle
  ): {
    showBattleInfo: boolean;
    showParticipants: boolean;
    showLeaderboard: boolean;
    enableTaskChallenges: boolean;
    restrictSnoozing: boolean;
  } {
    return {
      showBattleInfo: true,
      showParticipants: battle.participants.length > 1,
      showLeaderboard: battle.status === 'active' || battle.status === 'completed',
      enableTaskChallenges: battle.settings.taskChallenge,
      restrictSnoozing: !battle.settings.allowSnooze,
    };
  }
}

// Export singleton instance
export const alarmBattleIntegration = AlarmBattleIntegrationService.getInstance();
