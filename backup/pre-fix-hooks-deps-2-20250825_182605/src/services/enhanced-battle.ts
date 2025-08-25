/**
 * Enhanced Battle Service
 * Refactored to use standardized service architecture with real persistence and improved testing
 */

import {
import { _config } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
import { error } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
import { _index } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
import { config } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
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
import { BaseService } from './base/BaseService';
import { CacheProvider, getCacheManager } from './base/CacheManager';
import {
  BattleServiceInterface,
  ServiceConfig,
  ServiceHealth,
  AnalyticsServiceInterface,
} from '../types/service-architecture';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface BattleServiceConfig extends ServiceConfig {
  maxActiveBattles: number;
  battleRegistrationWindow: number; // minutes
  cleanupInterval: number; // minutes
  enableTournaments: boolean;
  enableTeamBattles: boolean;
  enableSeasonalEvents: boolean;

  // Persistence configuration
  persistenceStrategy: 'memory' | 'localStorage' | 'supabase' | 'hybrid';
  enableBackgroundSync: boolean;
  syncInterval: number; // minutes

  // Battle limits and validation
  maxParticipantsPerBattle: number;
  minParticipantsPerBattle: number;
  maxBattleDuration: number; // hours
  defaultEntryFee: number;

  // Features
  enableWeatherBonus: boolean;
  enableTaskChallenges: boolean;
  enableSocialFeatures: boolean;
}

export interface BattleServiceDependencies {
  supabaseClient?: any;
  analyticsService?: AnalyticsServiceInterface;
  userService?: any;
  gamificationService?: any;
  notificationService?: any;
  errorHandler?: any;
}

export interface BattleResult {
  battleId: string;
  winners: BattleParticipant[];
  rankings: BattleRanking[];
  rewards: BattleRewards;
  statistics: BattleStatistics;
}

export interface BattleRanking {
  rank: number;
  participant: BattleParticipant;
  score: number;
  achievements: string[];
}

export interface BattleRewards {
  winner: ExperienceGain;
  secondPlace?: ExperienceGain;
  thirdPlace?: ExperienceGain;
  participation: ExperienceGain;
}

export interface BattleStatistics {
  totalParticipants: number;
  averageWakeTime: string;
  fastestWakeUp: string;
  completionRate: number;
  snoozesUsed: number;
  averageScore: number;
}

export interface BattleFilter {
  type?: BattleType;
  status?: BattleStatus;
  userId?: string;
  creatorId?: string;
  dateRange?: { start: Date; end: Date };
  tags?: string[];
}

export interface BattlePersistenceLayer {
  saveBattle(battle: Battle): Promise<void>;
  loadBattle(id: string): Promise<Battle | null>;
  loadBattles(filter?: BattleFilter): Promise<Battle[]>;
  deleteBattle(id: string): Promise<void>;
  updateBattle(id: string, updates: Partial<Battle>): Promise<void>;

  saveTournament?(tournament: Tournament): Promise<void>;
  loadTournaments?(filter?: any): Promise<Tournament[]>;

  saveTeam?(team: Team): Promise<void>;
  loadTeams?(filter?: any): Promise<Team[]>;

  saveSeason?(season: Season): Promise<void>;
  loadSeasons?(filter?: any): Promise<Season[]>;
}

// ============================================================================
// Enhanced Battle Service Implementation
// ============================================================================

export class EnhancedBattleService
  extends BaseService
  implements BattleServiceInterface
{
  private battles = new Map<string, Battle>();
  private tournaments = new Map<string, Tournament>();
  private teams = new Map<string, Team>();
  private seasons = new Map<string, Season>();

  private cleanupInterval: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private cache: CacheProvider;
  private dependencies: BattleServiceDependencies;
  private persistenceLayer: BattlePersistenceLayer;

  constructor(dependencies: BattleServiceDependencies, _config: BattleServiceConfig) {
    super('BattleService', '2.0.0', _config);
    this.dependencies = dependencies;
    this.cache = getCacheManager().getProvider(_config.caching?.strategy || 'memory');
    this.persistenceLayer = this.createPersistenceLayer();
  }

  // ============================================================================
  // BaseService Implementation
  // ============================================================================

  protected getDefaultConfig(): Partial<BattleServiceConfig> {
    return {
      maxActiveBattles: 100,
      battleRegistrationWindow: 60, // 1 hour
      cleanupInterval: 60, // 1 hour
      enableTournaments: true,
      enableTeamBattles: true,
      enableSeasonalEvents: true,
      persistenceStrategy: 'hybrid',
      enableBackgroundSync: true,
      syncInterval: 15, // 15 minutes
      maxParticipantsPerBattle: 50,
      minParticipantsPerBattle: 2,
      maxBattleDuration: 24, // 24 hours
      defaultEntryFee: 50,
      enableWeatherBonus: true,
      enableTaskChallenges: true,
      enableSocialFeatures: true,
      ...(super.getDefaultConfig?.() || {}),
    };
  }

  protected async doInitialize(): Promise<void> {
    const timerId = this.startTimer('initialize');

    try {
      // Load existing battles from persistence
      await this.loadBattlesFromPersistence();

      // Initialize sample data if none exists (for development)
      if (this.battles.size === 0 && this._config.environment === 'development') {
        await this.initializeSampleData();
      }

      // Start cleanup and sync intervals
      this.startPeriodicTasks();

      // Set up event listeners
      this.setupEventListeners();

      this.emit('battles:initialized', {
        battleCount: this.battles.size,
        tournamentCount: this.tournaments.size,
      });

      this.recordMetric('initialize_duration', this.endTimer(timerId) || 0);
    } catch (_error) {
      this.handleError(_error, 'Failed to initialize BattleService');
      throw _error;
    }
  }

  protected async doCleanup(): Promise<void> {
    try {
      // Stop periodic tasks
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }

      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      // Final sync to persistence
      await this.syncToPersistence();

      // Clear caches
      await this.cache.clear();

      // Clear in-memory data
      this.battles.clear();
      this.tournaments.clear();
      this.teams.clear();
      this.seasons.clear();
    } catch (_error) {
      this.handleError(_error, 'Failed to cleanup BattleService');
    }
  }

  public async getHealth(): Promise<ServiceHealth> {
    const baseHealth = await super.getHealth();

    const config = this._config as BattleServiceConfig;
    const activeBattles = Array.from(this.battles.values()).filter(
      b => b.status === 'active'
    ).length;

    // Determine health based on battle load and system resources
    let status = baseHealth.status;
    if (activeBattles > _config.maxActiveBattles * 0.8) {
      status = 'degraded';
    }
    if (activeBattles >= _config.maxActiveBattles) {
      status = 'unhealthy';
    }

    return {
      ...baseHealth,
      status,
      metrics: {
        ...(baseHealth.metrics || {}),
        totalBattles: this.battles.size,
        activeBattles,
        tournaments: this.tournaments.size,
        teams: this.teams.size,
      },
    };
  }

  // ============================================================================
  // BattleServiceInterface Implementation
  // ============================================================================

  public async createBattle(
    battleData: Omit<Battle, 'id' | 'createdAt'>
  ): Promise<Battle> {
    const timerId = this.startTimer('createBattle');

    try {
      // Validate battle data
      this.validateBattleData(battleData);

      // Check active battle limit
      const activeBattles = Array.from(this.battles.values()).filter(
        b => b.status === 'active'
      ).length;
      const config = this._config as BattleServiceConfig;

      if (activeBattles >= _config.maxActiveBattles) {
        throw new Error('Maximum active battles reached');
      }

      // Create new battle
      const battle: Battle = {
        ...battleData,
        id: this.generateBattleId(),
        createdAt: new Date().toISOString(),
        participants: battleData.participants || [],
      };

      // Save to persistence and cache
      await this.persistenceLayer.saveBattle(battle);
      await this.cache.set(`battle:${battle.id}`, battle, 3600000); // 1 hour

      // Store in memory
      this.battles.set(battle.id, battle);

      // Track analytics
      if (this.dependencies.analyticsService) {
        await this.dependencies.analyticsService.track('battle_created', {
          battleId: battle.id,
          battleType: battle.type,
          maxParticipants: battle.maxParticipants,
          entryFee: battle.entryFee,
          creatorId: battle.creatorId,
        });
      }

      // Emit event
      this.emit('battle:created', battle);

      this.recordMetric('createBattle_duration', this.endTimer(timerId) || 0);
      this.recordMetric('battles_created', 1);

      return battle;
    } catch (_error) {
      this.handleError(_error, 'Failed to create battle', { battleData });
      throw error;
    }
  }

  public async joinBattle(battleId: string, userId: string): Promise<any> {
    const timerId = this.startTimer('joinBattle');

    try {
      const battle = await this.getBattle(battleId);
      if (!battle) {
        throw new Error('Battle not found');
      }

      // Validate join conditions
      this.validateBattleJoin(battle, userId);

      // Create participant
      const participant: BattleParticipant = {
        userId,
        joinedAt: new Date().toISOString(),
        status: 'joined',
        score: 0,
        wakeTime: null,
        completedTasks: [],
      };

      // Add participant to battle
      battle.participants.push(participant);

      // Update battle
      await this.updateBattle(battleId, { participants: battle.participants });

      // Track analytics
      if (this.dependencies.analyticsService) {
        await this.dependencies.analyticsService.track('battle_joined', {
          battleId,
          battleType: battle.type,
          participantCount: battle.participants.length,
          userId,
        });
      }

      // Emit event
      this.emit('battle:participant_joined', { battle, participant });

      this.recordMetric('joinBattle_duration', this.endTimer(timerId) || 0);
      this.recordMetric('battle_joins', 1);

      return participant;
    } catch (_error) {
      this.handleError(_error, 'Failed to join battle', { battleId, userId });
      throw error;
    }
  }

  public async updateBattleProgress(battleId: string, progress: any): Promise<void> {
    const timerId = this.startTimer('updateBattleProgress');

    try {
      const battle = await this.getBattle(battleId);
      if (!battle) {
        throw new Error('Battle not found');
      }

      // Update participant progress
      const participant = battle.participants.find(p => p.userId === progress.userId);
      if (!participant) {
        throw new Error('Participant not found');
      }

      // Apply progress updates
      if (progress.wakeTime) {
        participant.wakeTime = progress.wakeTime;
        participant.status = 'completed';
      }

      if (progress.score !== undefined) {
        participant.score = progress.score;
      }

      if (progress.completedTasks) {
        participant.completedTasks = progress.completedTasks;
      }

      // Save updated battle
      await this.updateBattle(battleId, battle);

      // Check if battle should be completed
      await this.checkBattleCompletion(battle);

      // Track analytics
      if (this.dependencies.analyticsService) {
        await this.dependencies.analyticsService.track('battle_progress_updated', {
          battleId,
          userId: progress.userId,
          score: progress.score,
          completed: participant.status === 'completed',
        });
      }

      this.recordMetric('updateBattleProgress_duration', this.endTimer(timerId) || 0);
    } catch (_error) {
      this.handleError(_error, 'Failed to update battle progress', {
        battleId,
        progress,
      });
      throw error;
    }
  }

  public async getBattleHistory(userId: string): Promise<Battle[]> {
    const timerId = this.startTimer('getBattleHistory');

    try {
      // Get from cache first
      const cacheKey = `battle_history:${userId}`;
      let battles = await this.cache.get<Battle[]>(cacheKey);

      if (!battles) {
        // Load from persistence
        battles = await this.persistenceLayer.loadBattles({
          userId,
          dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            end: new Date(),
          },
        });

        // Cache result
        await this.cache.set(cacheKey, battles, 600000); // 10 minutes
      }

      this.recordMetric('getBattleHistory_duration', this.endTimer(timerId) || 0);

      return battles || [];
    } catch (_error) {
      this.handleError(_error, 'Failed to get battle history', { userId });
      return [];
    }
  }

  public async endBattle(battleId: string): Promise<BattleResult> {
    const timerId = this.startTimer('endBattle');

    try {
      const battle = await this.getBattle(battleId);
      if (!battle) {
        throw new Error('Battle not found');
      }

      if (battle.status !== 'active') {
        throw new Error('Battle is not active');
      }

      // Calculate results
      const result = await this.calculateBattleResults(battle);

      // Update battle status
      battle.status = 'completed';
      battle.endTime = new Date().toISOString();

      await this.updateBattle(battleId, battle);

      // Distribute rewards
      await this.distributeRewards(battle, result);

      // Track analytics
      if (this.dependencies.analyticsService) {
        await this.dependencies.analyticsService.track('battle_ended', {
          battleId,
          battleType: battle.type,
          participantCount: battle.participants.length,
          duration:
            new Date(battle.endTime).getTime() - new Date(battle.startTime).getTime(),
          winner: result.winners[0]?.userId,
        });
      }

      // Emit event
      this.emit('battle:ended', { battle, result });

      this.recordMetric('endBattle_duration', this.endTimer(timerId) || 0);
      this.recordMetric('battles_ended', 1);

      return result;
    } catch (_error) {
      this.handleError(_error, 'Failed to end battle', { battleId });
      throw error;
    }
  }

  // ============================================================================
  // Additional Battle Management Methods
  // ============================================================================

  public async getBattle(battleId: string): Promise<Battle | null> {
    // Try memory first
    let battle = this.battles.get(battleId);
    if (battle) return battle;

    // Try cache
    battle = await this.cache.get(`battle:${battleId}`);
    if (battle) {
      this.battles.set(battleId, battle);
      return battle;
    }

    // Load from persistence
    battle = await this.persistenceLayer.loadBattle(battleId);
    if (battle) {
      this.battles.set(battleId, battle);
      await this.cache.set(`battle:${battleId}`, battle, 3600000);
    }

    return battle;
  }

  public async getBattles(filter: BattleFilter = {}): Promise<Battle[]> {
    const cacheKey = `battles:${JSON.stringify(filter)}`;
    let battles = await this.cache.get<Battle[]>(cacheKey);

    if (!battles) {
      battles = await this.persistenceLayer.loadBattles(filter);
      await this.cache.set(cacheKey, battles, 300000); // 5 minutes
    }

    return battles || [];
  }

  public async updateBattle(battleId: string, updates: Partial<Battle>): Promise<void> {
    const battle = await this.getBattle(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    // Apply updates
    Object.assign(battle, updates);

    // Save to persistence and update cache
    await this.persistenceLayer.updateBattle(battleId, updates);
    await this.cache.set(`battle:${battleId}`, battle, 3600000);

    // Update memory
    this.battles.set(battleId, battle);

    // Emit event
    this.emit('battle:updated', battle);
  }

  public async deleteBattle(battleId: string): Promise<void> {
    const battle = await this.getBattle(battleId);
    if (!battle) return;

    // Only allow deletion of inactive battles
    if (battle.status === 'active') {
      throw new Error('Cannot delete active battle');
    }

    // Remove from persistence, cache, and memory
    await this.persistenceLayer.deleteBattle(battleId);
    await this.cache.delete(`battle:${battleId}`);
    this.battles.delete(battleId);

    // Emit event
    this.emit('battle:deleted', { battleId });
  }

  // ============================================================================
  // Private Implementation Methods
  // ============================================================================

  private createPersistenceLayer(): BattlePersistenceLayer {
    const config = this._config as BattleServiceConfig;

    switch (_config.persistenceStrategy) {
      case 'supabase':
        return new SupabaseBattlePersistence(this.dependencies.supabaseClient);
      case 'localStorage':
        return new LocalStorageBattlePersistence();
      case 'hybrid':
        return new HybridBattlePersistence(
          new SupabaseBattlePersistence(this.dependencies.supabaseClient),
          new LocalStorageBattlePersistence()
        );
      default:
        return new MemoryBattlePersistence();
    }
  }

  private async loadBattlesFromPersistence(): Promise<void> {
    try {
      const battles = await this.persistenceLayer.loadBattles();

      for (const battle of battles) {
        this.battles.set(battle.id, battle);
        await this.cache.set(`battle:${battle.id}`, battle, 3600000);
      }

      // Load tournaments if enabled
      if ((this._config as BattleServiceConfig).enableTournaments) {
        await this.loadTournaments();
      }
    } catch (_error) {
      this.handleError(_error, 'Failed to load battles from persistence');
    }
  }

  private async loadTournaments(): Promise<void> {
    if (!this.persistenceLayer.loadTournaments) return;

    try {
      const tournaments = await this.persistenceLayer.loadTournaments();

      for (const tournament of tournaments) {
        this.tournaments.set(tournament.id, tournament);
      }
    } catch (_error) {
      this.handleError(_error, 'Failed to load tournaments');
    }
  }

  private async initializeSampleData(): Promise<void> {
    const sampleBattle: Omit<Battle, 'id' | 'createdAt'> = {
      type: 'speed',
      participants: [],
      creatorId: 'sample_user',
      status: 'registration',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      settings: {
        wakeWindow: 30,
        allowSnooze: false,
        maxSnoozes: 0,
        difficulty: 'medium',
        weatherBonus: false,
        taskChallenge: false,
      },
      maxParticipants: 10,
      minParticipants: 2,
      entryFee: 50,
      prizePool: {
        winner: { experience: 200, coins: 100 },
        participation: { experience: 25, coins: 10 },
      },
    };

    await this.createBattle(sampleBattle);
  }

  private startPeriodicTasks(): void {
    const config = this._config as BattleServiceConfig;

    // Cleanup task
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredBattles().catch(_error =>
          this.handleError(_error, 'Failed in cleanup task')
        );
      },
      config.cleanupInterval * 60 * 1000
    );

    // Sync task
    if (_config.enableBackgroundSync) {
      this.syncInterval = setInterval(
        () => {
          this.syncToPersistence().catch(_error =>
            this.handleError(_error, 'Failed in sync task')
          );
        },
        config.syncInterval * 60 * 1000
      );
    }
  }

  private async cleanupExpiredBattles(): Promise<void> {
    const now = new Date();
    const expiredBattles = Array.from(this.battles.values()).filter(battle => {
      if (!battle.endTime) return false;
      const endTime = new Date(battle.endTime);
      return now.getTime() - endTime.getTime() > 7 * 24 * 60 * 60 * 1000; // 7 days
    });

    for (const battle of expiredBattles) {
      await this.deleteBattle(battle.id);
    }

    if (expiredBattles.length > 0) {
      this.emit('battles:cleanup', { cleanedCount: expiredBattles.length });
    }
  }

  private async syncToPersistence(): Promise<void> {
    // Sync battles that have been modified
    for (const battle of this.battles.values()) {
      await this.persistenceLayer.saveBattle(battle);
    }
  }

  private setupEventListeners(): void {
    // Listen for alarm events to update battle progress
    this.on('alarm:triggered', data => {
      this.handleAlarmTrigger(data).catch(_error =>
        this.handleError(_error, 'Failed to handle alarm trigger')
      );
    });
  }

  private async handleAlarmTrigger(data: any): Promise<void> {
    // Find active battles for this user
    const userBattles = Array.from(this.battles.values()).filter(
      battle =>
        battle.status === 'active' &&
        battle.participants.some(p => p.userId === data.userId)
    );

    for (const battle of userBattles) {
      await this.updateBattleProgress(battle.id, {
        userId: data.userId,
        wakeTime: new Date().toISOString(),
        score: this.calculateWakeScore(data.wakeTime, battle.settings),
      });
    }
  }

  private validateBattleData(battleData: any): void {
    const config = this._config as BattleServiceConfig;

    if (!battleData.type || !battleData.startTime) {
      throw new Error('Missing required battle data');
    }

    if (battleData.maxParticipants > _config.maxParticipantsPerBattle) {
      throw new Error('Too many participants allowed');
    }

    const startTime = new Date(battleData.startTime);
    const duration = battleData.endTime
      ? new Date(battleData.endTime).getTime() - startTime.getTime()
      : 0;

    if (duration > _config.maxBattleDuration * 60 * 60 * 1000) {
      throw new Error('Battle duration too long');
    }
  }

  private validateBattleJoin(battle: Battle, userId: string): void {
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
  }

  private async checkBattleCompletion(battle: Battle): Promise<void> {
    const completedParticipants = battle.participants.filter(
      p => p.status === 'completed'
    );
    const totalParticipants = battle.participants.length;

    // End battle if all participants completed or time expired
    const isTimeExpired = battle.endTime && new Date() > new Date(battle.endTime);
    const allCompleted = completedParticipants.length === totalParticipants;

    if (isTimeExpired || allCompleted) {
      await this.endBattle(battle.id);
    }
  }

  private async calculateBattleResults(battle: Battle): Promise<BattleResult> {
    // Sort participants by score
    const rankings: BattleRanking[] = battle.participants
      .map((participant, _index) => ({
        rank: _index + 1,
        participant,
        score: participant.score || 0,
        achievements: this.calculateAchievements(participant, battle),
      }))
      .sort((a, b) => b.score - a.score)
      .map((ranking, _index) => ({ ...ranking, rank: _index + 1 }));

    const winners = rankings.slice(0, 3).map(r => r.participant);

    const rewards: BattleRewards = {
      winner: battle.prizePool?.winner || { experience: 100, coins: 50 },
      secondPlace: battle.prizePool?.secondPlace,
      thirdPlace: battle.prizePool?.thirdPlace,
      participation: battle.prizePool?.participation || { experience: 10, coins: 5 },
    };

    const statistics: BattleStatistics = {
      totalParticipants: battle.participants.length,
      averageWakeTime: this.calculateAverageWakeTime(battle.participants),
      fastestWakeUp: this.getFastestWakeUp(battle.participants),
      completionRate:
        battle.participants.filter(p => p.status === 'completed').length /
        battle.participants.length,
      snoozesUsed: battle.participants.reduce(
        (sum, p) => sum + (p.snoozesUsed || 0),
        0
      ),
      averageScore:
        rankings.reduce((sum, r) => sum + r.score, 0) / rankings.length || 0,
    };

    return {
      battleId: battle.id,
      winners,
      rankings,
      rewards,
      statistics,
    };
  }

  private calculateAchievements(
    participant: BattleParticipant,
    battle: Battle
  ): string[] {
    const achievements: string[] = [];

    if (participant.status === 'completed') {
      achievements.push('completed_battle');
    }

    if (participant.score && participant.score > 90) {
      achievements.push('high_scorer');
    }

    if (participant.wakeTime && battle.startTime) {
      const wakeTime = new Date(participant.wakeTime);
      const battleStart = new Date(battle.startTime);
      if (wakeTime <= battleStart) {
        achievements.push('early_bird');
      }
    }

    return achievements;
  }

  private async distributeRewards(battle: Battle, result: BattleResult): Promise<void> {
    // Distribute rewards to participants based on ranking
    for (const ranking of result.rankings) {
      let reward: ExperienceGain;

      if (ranking.rank === 1) {
        reward = result.rewards.winner;
      } else if (ranking.rank === 2 && result.rewards.secondPlace) {
        reward = result.rewards.secondPlace;
      } else if (ranking.rank === 3 && result.rewards.thirdPlace) {
        reward = result.rewards.thirdPlace;
      } else {
        reward = result.rewards.participation;
      }

      // Apply rewards through gamification service
      if (this.dependencies.gamificationService) {
        await this.dependencies.gamificationService.awardExperience(
          ranking.participant.userId,
          reward.experience
        );
      }

      // Track reward distribution
      if (this.dependencies.analyticsService) {
        await this.dependencies.analyticsService.track('battle_reward_distributed', {
          battleId: battle.id,
          userId: ranking.participant.userId,
          rank: ranking.rank,
          experience: reward.experience,
          coins: reward.coins,
        });
      }
    }
  }

  private calculateWakeScore(wakeTime: string, settings: BattleSettings): number {
    // Implementation of wake score calculation based on battle settings
    // This would include factors like timing, weather bonus, completed tasks, etc.
    let score = 100; // Base score

    // Add weather bonus if enabled
    if (settings.weatherBonus) {
      score += 10;
    }

    // Add task completion bonus
    if (settings.taskChallenge) {
      score += 20;
    }

    return Math.min(score, 150); // Cap at 150
  }

  private calculateAverageWakeTime(participants: BattleParticipant[]): string {
    const wakeTimes = participants
      .filter(p => p.wakeTime)
      .map(p => new Date(p.wakeTime!).getTime());

    if (wakeTimes.length === 0) return 'N/A';

    const averageTime =
      wakeTimes.reduce((sum, time) => sum + time, 0) / wakeTimes.length;
    return new Date(averageTime).toISOString();
  }

  private getFastestWakeUp(participants: BattleParticipant[]): string {
    const wakeTimes = participants
      .filter(p => p.wakeTime)
      .map(p => new Date(p.wakeTime!));

    if (wakeTimes.length === 0) return 'N/A';

    const fastest = new Date(Math.min(...wakeTimes.map(t => t.getTime())));
    return fastest.toISOString();
  }

  private generateBattleId(): string {
    return `battle_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  // ============================================================================
  // Testing Support Methods
  // ============================================================================

  public async reset(): Promise<void> {
    if (this._config.environment !== 'test') {
      throw new Error('Reset only allowed in test environment');
    }

    this.battles.clear();
    this.tournaments.clear();
    this.teams.clear();
    this.seasons.clear();
    await this.cache.clear();
  }

  public getTestState(): any {
    if (this._config.environment !== 'test') {
      throw new Error('Test state only available in test environment');
    }

    return {
      battles: Array.from(this.battles.values()),
      tournaments: Array.from(this.tournaments.values()),
      teams: Array.from(this.teams.values()),
      seasons: Array.from(this.seasons.values()),
    };
  }
}

// ============================================================================
// Persistence Layer Implementations
// ============================================================================

class MemoryBattlePersistence implements BattlePersistenceLayer {
  private battles = new Map<string, Battle>();

  async saveBattle(battle: Battle): Promise<void> {
    this.battles.set(battle.id, { ...battle });
  }

  async loadBattle(id: string): Promise<Battle | null> {
    return this.battles.get(id) || null;
  }

  async loadBattles(filter?: BattleFilter): Promise<Battle[]> {
    let battles = Array.from(this.battles.values());

    if (filter) {
      battles = this.applyFilter(battles, filter);
    }

    return battles;
  }

  async deleteBattle(id: string): Promise<void> {
    this.battles.delete(id);
  }

  async updateBattle(id: string, updates: Partial<Battle>): Promise<void> {
    const battle = this.battles.get(id);
    if (battle) {
      Object.assign(battle, updates);
    }
  }

  private applyFilter(battles: Battle[], filter: BattleFilter): Battle[] {
    return battles.filter(battle => {
      if (filter.type && battle.type !== filter.type) return false;
      if (filter.status && battle.status !== filter.status) return false;
      if (filter.userId && !battle.participants.some(p => p.userId === filter.userId))
        return false;
      if (filter.creatorId && battle.creatorId !== filter.creatorId) return false;
      return true;
    });
  }
}

class LocalStorageBattlePersistence implements BattlePersistenceLayer {
  private readonly prefix = 'battle_service_';

  async saveBattle(battle: Battle): Promise<void> {
    try {
      localStorage.setItem(`${this.prefix}${battle.id}`, JSON.stringify(battle));

      // Update battle index
      const index = this.getBattleIndex();
      if (!_index.includes(battle.id)) {
        _index.push(battle.id);
        localStorage.setItem(`${this.prefix}index`, JSON.stringify(_index));
      }
    } catch (_error) {
      throw new Error(`Failed to save battle to localStorage: ${_error}`);
    }
  }

  async loadBattle(id: string): Promise<Battle | null> {
    try {
      const data = localStorage.getItem(`${this.prefix}${id}`);
      return data ? JSON.parse(data) : null;
    } catch (_error) {
      return null;
    }
  }

  async loadBattles(filter?: BattleFilter): Promise<Battle[]> {
    try {
      const _index = this.getBattleIndex();
      const battles: Battle[] = [];

      for (const id of _index) {
        const battle = await this.loadBattle(id);
        if (battle) {
          battles.push(battle);
        }
      }

      return filter ? this.applyFilter(battles, filter) : battles;
    } catch (_error) {
      return [];
    }
  }

  async deleteBattle(id: string): Promise<void> {
    try {
      localStorage.removeItem(`${this.prefix}${id}`);

      // Update index
      const index = this.getBattleIndex();
      const newIndex = index.filter(battleId => battleId !== id);
      localStorage.setItem(`${this.prefix}_index`, JSON.stringify(newIndex));
    } catch (_error) {
      // Silent fail for localStorage errors
    }
  }

  async updateBattle(id: string, updates: Partial<Battle>): Promise<void> {
    const battle = await this.loadBattle(id);
    if (battle) {
      Object.assign(battle, updates);
      await this.saveBattle(battle);
    }
  }

  private getBattleIndex(): string[] {
    try {
      const data = localStorage.getItem(`${this.prefix}_index`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private applyFilter(battles: Battle[], filter: BattleFilter): Battle[] {
    return battles.filter(battle => {
      if (filter.type && battle.type !== filter.type) return false;
      if (filter.status && battle.status !== filter.status) return false;
      if (filter.userId && !battle.participants.some(p => p.userId === filter.userId))
        return false;
      if (filter.creatorId && battle.creatorId !== filter.creatorId) return false;
      return true;
    });
  }
}

class SupabaseBattlePersistence implements BattlePersistenceLayer {
  constructor(private supabase: any) {}

  async saveBattle(battle: Battle): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase client not available');
    }

    try {
      const { _error } = await this.supabase.from('battles').upsert(battle);

      if (_error) throw error;
    } catch (_error) {
      throw new Error(`Failed to save battle to Supabase: ${_error}`);
    }
  }

  async loadBattle(id: string): Promise<Battle | null> {
    if (!this.supabase) return null;

    try {
      const { data, _error } = await this.supabase
        .from('battles')
        .select('*')
        .eq('id', id)
        .single();

      if (error && _error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (_error) {
      return null;
    }
  }

  async loadBattles(filter?: BattleFilter): Promise<Battle[]> {
    if (!this.supabase) return [];

    try {
      let query = this.supabase.from('battles').select('*');

      if (filter) {
        if (filter.type) query = query.eq('type', filter.type);
        if (filter.status) query = query.eq('status', filter.status);
        if (filter.creatorId) query = query.eq('creatorId', filter.creatorId);
        if (filter.dateRange) {
          query = query
            .gte('createdAt', filter.dateRange.start.toISOString())
            .lte('createdAt', filter.dateRange.end.toISOString());
        }
      }

      const { data, _error } = await query.order('createdAt', { ascending: false });

      if (_error) throw error;
      return data || [];
    } catch (_error) {
      return [];
    }
  }

  async deleteBattle(id: string): Promise<void> {
    if (!this.supabase) return;

    try {
      const { _error } = await this.supabase.from('battles').delete().eq('id', id);

      if (_error) throw error;
    } catch (_error) {
      // Silent fail for delete operations
    }
  }

  async updateBattle(id: string, updates: Partial<Battle>): Promise<void> {
    if (!this.supabase) return;

    try {
      const { _error } = await this.supabase
        .from('battles')
        .update(updates)
        .eq('id', id);

      if (_error) throw error;
    } catch (_error) {
      throw new Error(`Failed to update battle in Supabase: ${_error}`);
    }
  }
}

class HybridBattlePersistence implements BattlePersistenceLayer {
  constructor(
    private primary: BattlePersistenceLayer,
    private fallback: BattlePersistenceLayer
  ) {}

  async saveBattle(battle: Battle): Promise<void> {
    try {
      await this.primary.saveBattle(battle);
    } catch (_error) {
      await this.fallback.saveBattle(battle);
    }
  }

  async loadBattle(id: string): Promise<Battle | null> {
    try {
      return await this.primary.loadBattle(id);
    } catch (_error) {
      return await this.fallback.loadBattle(id);
    }
  }

  async loadBattles(filter?: BattleFilter): Promise<Battle[]> {
    try {
      return await this.primary.loadBattles(filter);
    } catch (_error) {
      return await this.fallback.loadBattles(filter);
    }
  }

  async deleteBattle(id: string): Promise<void> {
    await Promise.allSettled([
      this.primary.deleteBattle(id),
      this.fallback.deleteBattle(id),
    ]);
  }

  async updateBattle(id: string, updates: Partial<Battle>): Promise<void> {
    try {
      await this.primary.updateBattle(id, updates);
    } catch (_error) {
      await this.fallback.updateBattle(id, updates);
    }
  }
}

// ============================================================================
// Factory and Exports
// ============================================================================

export const createBattleService = (
  dependencies: BattleServiceDependencies = {},
  _config: Partial<BattleServiceConfig> = {}
): EnhancedBattleService => {
  const fullConfig: BattleServiceConfig = {
    enabled: true,
    environment: config.environment || 'development',
    maxActiveBattles: config.maxActiveBattles || 100,
    battleRegistrationWindow: config.battleRegistrationWindow || 60,
    cleanupInterval: config.cleanupInterval || 60,
    enableTournaments: config.enableTournaments ?? true,
    enableTeamBattles: config.enableTeamBattles ?? true,
    enableSeasonalEvents: config.enableSeasonalEvents ?? true,
    persistenceStrategy: config.persistenceStrategy || 'hybrid',
    enableBackgroundSync: config.enableBackgroundSync ?? true,
    syncInterval: config.syncInterval || 15,
    maxParticipantsPerBattle: config.maxParticipantsPerBattle || 50,
    minParticipantsPerBattle: config.minParticipantsPerBattle || 2,
    maxBattleDuration: config.maxBattleDuration || 24,
    defaultEntryFee: config.defaultEntryFee || 50,
    enableWeatherBonus: config.enableWeatherBonus ?? true,
    enableTaskChallenges: config.enableTaskChallenges ?? true,
    enableSocialFeatures: config.enableSocialFeatures ?? true,
    ..._config,
  };

  return new EnhancedBattleService(dependencies, fullConfig);
};

// Export singleton instance for backward compatibility
export const battleService = createBattleService();
