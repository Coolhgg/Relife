import {
  Battle,
  BattleType,
  BattleStatus,
  BattleParticipant,
  BattleSettings,
  Tournament,
  Team,
  Season,
  User,
  ExperienceGain,
} from '../types/index';
import { supabase } from './supabase';
import AppAnalyticsService from './app-analytics';

export class BattleService {
  private static instance: BattleService;
  private mockData: {
    battles: Battle[];
    tournaments: Tournament[];
    teams: Team[];
    seasons: Season[];
  } = {
    battles: [],
    tournaments: [],
    teams: [],
    seasons: [],
  };

  private constructor() {
    this.initializeMockData();
  }

  static getInstance(): BattleService {
    if (!BattleService.instance) {
      BattleService.instance = new BattleService();
    }
    return BattleService.instance;
  }

  private initializeMockData() {
    // Initialize with sample battle data for testing
    const sampleBattle: Battle = {
      id: 'battle_1',
      type: 'speed',
      participants: [],
      creatorId: 'user_1',
      status: 'registration',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      settings: {
        wakeWindow: 30,
        allowSnooze: false,
        maxSnoozes: 0,
        difficulty: 'medium',
        weatherBonus: false,
        taskChallenge: false,
      },
      createdAt: new Date().toISOString(),
      maxParticipants: 10,
      minParticipants: 2,
      entryFee: 50,
      prizePool: {
        winner: { experience: 200, coins: 100 },
        participation: { experience: 25, coins: 10 },
      },
    };

    this.mockData.battles = [sampleBattle];
  }

  // Battle Management
  async createBattle(battle: Omit<Battle, 'id' | 'createdAt'>): Promise<Battle> {
    try {
      const newBattle: Battle = {
        ...battle,
        id: `battle_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      // In production, this would save to database
      this.mockData.battles.push(newBattle);

      AppAnalyticsService.getInstance().track('battle_created', {
        battleType: newBattle.type,
        maxParticipants: newBattle.maxParticipants,
        entryFee: newBattle.entryFee,
      });

      return newBattle;
    } catch (error) {
      console.error('Failed to create battle:', error);
      throw error;
    }
  }

  async joinBattle(battleId: string, userId: string): Promise<boolean> {
    try {
      const battle = this.mockData.battles.find(b => b.id === battleId);

      if (!battle) {
        throw new Error('Battle not found');
      }

      if (battle.status !== 'registration') {
        throw new Error('Battle registration is closed');
      }

      if (
        battle.maxParticipants &&
        battle.participants.length >= battle.maxParticipants
      ) {
        throw new Error('Battle is full');
      }

      const isAlreadyParticipant = battle.participants.some(p => p.userId === userId);
      if (isAlreadyParticipant) {
        throw new Error('User already in battle');
      }

      const participant: BattleParticipant = {
        userId,
        joinedAt: new Date().toISOString(),
        status: 'joined',
        score: 0,
        wakeTime: null,
        completedTasks: [],
      };

      battle.participants.push(participant);

      AppAnalyticsService.getInstance().track('battle_joined', {
        battleId,
        battleType: battle.type,
        participantCount: battle.participants.length,
      });

      return true;
    } catch (error) {
      console.error('Failed to join battle:', error);
      throw error;
    }
  }

  async leaveBattle(battleId: string, userId: string): Promise<boolean> {
    try {
      const battle = this.mockData.battles.find(b => b.id === battleId);

      if (!battle) {
        throw new Error('Battle not found');
      }

      if (battle.status !== 'registration') {
        throw new Error('Cannot leave active battle');
      }

      const participantIndex = battle.participants.findIndex(p => p.userId === userId);
      if (participantIndex === -1) {
        throw new Error('User not in battle');
      }

      battle.participants.splice(participantIndex, 1);

      AppAnalyticsService.getInstance().track('battle_left', {
        battleId,
        battleType: battle.type,
        participantCount: battle.participants.length,
      });

      return true;
    } catch (error) {
      console.error('Failed to leave battle:', error);
      throw error;
    }
  }

  async getBattles(filters?: {
    type?: BattleType;
    status?: BattleStatus;
    userId?: string;
  }): Promise<Battle[]> {
    try {
      let battles = [...this.mockData.battles];

      if (filters) {
        if (filters.type) {
          battles = battles.filter(b => b.type === filters.type);
        }

        if (filters.status) {
          battles = battles.filter(b => b.status === filters.status);
        }

        if (filters.userId) {
          battles = battles.filter(
            b =>
              b.creatorId === filters.userId ||
              b.participants.some(p => p.userId === filters.userId)
          );
        }
      }

      return battles;
    } catch (error) {
      console.error('Failed to get battles:', error);
      throw error;
    }
  }

  async getBattle(battleId: string): Promise<Battle | null> {
    try {
      const battle = this.mockData.battles.find(b => b.id === battleId);
      return battle || null;
    } catch (error) {
      console.error('Failed to get battle:', error);
      throw error;
    }
  }

  // Battle Progression
  async startBattle(battleId: string): Promise<boolean> {
    try {
      const battle = this.mockData.battles.find(b => b.id === battleId);

      if (!battle) {
        throw new Error('Battle not found');
      }

      if (battle.participants.length < (battle.minParticipants || 2)) {
        throw new Error('Not enough participants to start battle');
      }

      battle.status = 'active';

      AppAnalyticsService.getInstance().track('battle_started', {
        battleId,
        battleType: battle.type,
        participantCount: battle.participants.length,
      });

      return true;
    } catch (error) {
      console.error('Failed to start battle:', error);
      throw error;
    }
  }

  async recordWakeUp(
    battleId: string,
    userId: string,
    wakeTime: string
  ): Promise<boolean> {
    try {
      const battle = this.mockData.battles.find(b => b.id === battleId);

      if (!battle) {
        throw new Error('Battle not found');
      }

      const participant = battle.participants.find(p => p.userId === userId);
      if (!participant) {
        throw new Error('User not in battle');
      }

      participant.wakeTime = wakeTime;
      participant.score = this.calculateWakeScore(battle, wakeTime);

      AppAnalyticsService.getInstance().track('battle_wake_recorded', {
        battleId,
        userId,
        wakeTime,
        score: participant.score,
      });

      // Check if battle is complete
      const allParticipantsAwake = battle.participants.every(p => p.wakeTime !== null);
      if (allParticipantsAwake) {
        await this.completeBattle(battleId);
      }

      return true;
    } catch (error) {
      console.error('Failed to record wake up:', error);
      throw error;
    }
  }

  private calculateWakeScore(battle: Battle, wakeTime: string): number {
    const targetTime = new Date(battle.startTime);
    const actualWakeTime = new Date(wakeTime);
    const diffMinutes = Math.abs(
      (actualWakeTime.getTime() - targetTime.getTime()) / 60000
    );

    // Base score calculation - closer to target time = higher score
    let score = Math.max(0, 100 - diffMinutes);

    // Apply difficulty multiplier
    const difficultyMultiplier = {
      easy: 1.0,
      medium: 1.2,
      hard: 1.5,
      extreme: 2.0,
      nuclear: 5.0, // Ultimate challenge with 5x multiplier
    };

    score *= difficultyMultiplier[battle.settings.difficulty];

    return Math.round(score);
  }

  private async completeBattle(battleId: string): Promise<void> {
    try {
      const battle = this.mockData.battles.find(b => b.id === battleId);
      if (!battle) return;

      // Sort participants by score
      battle.participants.sort((a, b
) => (b.score || 0) - (a.score || 0));

      // Set winner
      if (battle.participants.length > 0) {
        battle.winner = battle.participants[0].userId;
      }

      battle.status = 'completed';

      // Award experience and prizes
      await this.awardBattlePrizes(battle);

      AppAnalyticsService.getInstance().track('battle_completed', {
        battleId,
        winnerId: battle.winner,
        participantCount: battle.participants.length,
        averageScore:
          battle.participants.reduce((acc, p
) => acc + (p.score || 0), 0) /
          battle.participants.length,
      });
    } catch (error) {
      console.error('Failed to complete battle:', error);
    }
  }

  private async awardBattlePrizes(battle: Battle): Promise<void> {
    try {
      if (!battle.prizePool) return;

      // Award winner
      if (battle.winner) {
        await this.awardExperience(
          battle.winner,
          battle.prizePool.winner.experience,
          'battle_win'
        );
      }

      // Award participation prizes
      for (const participant of battle.participants) {
        if (participant.userId !== battle.winner && battle.prizePool.participation) {
          await this.awardExperience(
            participant.userId,
            battle.prizePool.participation.experience,
            'battle_participate'
          );
        }
      }
    } catch (error) {
      console.error('Failed to award battle prizes:', error);
    }
  }

  private async awardExperience(
    userId: string,
    amount: number,
    source: string
  ): Promise<void> {
    try {
      const experienceGain: ExperienceGain = {
        id: `exp_${Date.now()}_${userId}`,
        userId,
        amount,
        source: source as any,
        description: `Gained ${amount} XP from ${source.replace('_', ' ')}`,
        timestamp: new Date().toISOString(),
      };

      // In production, this would update the user's experience in the database
      console.log('Experience awarded:', experienceGain);

      AppAnalyticsService.getInstance().track('experience_gained', {
        userId,
        amount,
        source,
        newTotal: amount, // Would be actual total in production
      });
    } catch (error) {
      console.error('Failed to award experience:', error);
    }
  }

  // Tournament Management
  async createTournament(
    tournament: Omit<Tournament, 'id' | 'createdAt'>
  ): Promise<Tournament> {
    try {
      const newTournament: Tournament = {
        ...tournament,
        id: `tournament_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      this.mockData.tournaments.push(newTournament);

      AppAnalyticsService.getInstance().track('tournament_created', {
        tournamentType: newTournament.type,
        maxParticipants: newTournament.maxParticipants,
        entryFee: newTournament.entryFee,
      });

      return newTournament;
    } catch (error) {
      console.error('Failed to create tournament:', error);
      throw error;
    }
  }

  async getTournaments(filters?: {
    status?: 'registration' | 'active' | 'completed';
    seasonId?: string;
  }): Promise<Tournament[]> {
    try {
      let tournaments = [...this.mockData.tournaments];

      if (filters) {
        if (filters.status) {
          tournaments = tournaments.filter(t => t.status === filters.status);
        }

        if (filters.seasonId) {
          tournaments = tournaments.filter(t => t.seasonId === filters.seasonId);
        }
      }

      return tournaments;
    } catch (error) {
      console.error('Failed to get tournaments:', error);
      throw error;
    }
  }

  // Team Management
  async createTeam(team: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
    try {
      const newTeam: Team = {
        ...team,
        id: `team_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      this.mockData.teams.push(newTeam);

      AppAnalyticsService.getInstance().track('team_created', {
        teamName: newTeam.name,
        maxMembers: newTeam.maxMembers,
        isPublic: newTeam.isPublic,
      });

      return newTeam;
    } catch (error) {
      console.error('Failed to create team:', error);
      throw error;
    }
  }

  async getTeams(filters?: { isPublic?: boolean; userId?: string }): Promise<Team[]> {
    try {
      let teams = [...this.mockData.teams];

      if (filters) {
        if (filters.isPublic !== undefined) {
          teams = teams.filter(t => t.isPublic === filters.isPublic);
        }

        if (filters.userId) {
          teams = teams.filter(t => t.members.some(m => m.userId === filters.userId));
        }
      }

      return teams;
    } catch (error) {
      console.error('Failed to get teams:', error);
      throw error;
    }
  }

  // Integration with Alarm Service
  async linkAlarmToBattle(alarmId: string, battleId: string): Promise<boolean> {
    try {
      // This would update the alarm record to include the battleId
      // For now, we'll just track the analytics

      AppAnalyticsService.getInstance().track('alarm_battle_linked', {
        alarmId,
        battleId,
      });

      return true;
    } catch (error) {
      console.error('Failed to link alarm to battle:', error);
      throw error;
    }
  }

  async unlinkAlarmFromBattle(alarmId: string): Promise<boolean> {
    try {
      // This would remove the battleId from the alarm record

      AppAnalyticsService.getInstance().track('alarm_battle_unlinked', {
        alarmId,
      });

      return true;
    } catch (error) {
      console.error('Failed to unlink alarm from battle:', error);
      throw error;
    }
  }

  // Helper methods
  async getBattleStats(userId: string): Promise<{
    totalBattles: number;
    wins: number;
    losses: number;
    winRate: number;
    averageScore: number;
  }> {
    try {
      const userBattles = this.mockData.battles.filter(
        b => b.participants.some(p => p.userId === userId) && b.status === 'completed'
      );

      const wins = userBattles.filter(b => b.winner === userId).length;
      const totalBattles = userBattles.length;
      const winRate = totalBattles > 0 ? (wins / totalBattles) * 100 : 0;

      const totalScore = userBattles.reduce((acc, battle
) => {
        const participant = battle.participants.find(p => p.userId === userId);
        return acc + (participant?.score || 0);
      }, 0);

      const averageScore = totalBattles > 0 ? totalScore / totalBattles : 0;

      return {
        totalBattles,
        wins,
        losses: totalBattles - wins,
        winRate,
        averageScore,
      };
    } catch (error) {
      console.error('Failed to get battle stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const battleService = BattleService.getInstance();
