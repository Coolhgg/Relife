/// <reference lib="dom" />
// Offline Gaming Service for Relife App
// Comprehensive offline support for battles, rewards, achievements, and social gaming features

import type {
import AnalyticsService from './analytics';
import { ErrorHandler } from './error-handler';
  Battle,
  User,
  Achievement,
  RewardSystem,
  BattleParticipant,
  ExperienceGain,
  DailyChallenge,
  WeeklyChallenge,
  AIInsight,
} from '../types/index';
import { EnhancedOfflineStorage } from './enhanced-offline-storage';
import { ErrorHandler } from './error-handler';
import SecurityService from './security';
import { TimeoutHandle } from '../types/timers';

interface OfflineGamingData {
  battles: Battle[];
  userStats: Record<string, any>;
  achievements: Achievement[];
  rewardSystem: RewardSystem | null;
  friends: User[];
  experienceGains: ExperienceGain[];
  dailyChallenges: DailyChallenge[];
  weeklyChallenges: WeeklyChallenge[];
  aiInsights: AIInsight[];
  lastSync: string;
}

interface BattleAction {
  id: string;
  type: 'create' | 'join' | 'leave' | 'update' | 'complete' | 'message';
  battleId: string;
  userId: string;
  data: any;
  timestamp: string;
  synced: boolean;
}

interface OfflineReward {
  id: string;
  type: 'experience' | 'achievement' | 'level_up' | 'streak' | 'battle_win';
  amount: number;
  reason: string;
  timestamp: string;
  synced: boolean;
}

export class OfflineGamingService {
  private static instance: OfflineGamingService;
  private readonly STORAGE_KEYS = {
    GAMING_DATA: 'relife-gaming-data',
    BATTLE_ACTIONS: 'relife-battle-actions',
    OFFLINE_REWARDS: 'relife-offline-rewards',
    GAMING_CONFLICTS: 'relife-gaming-conflicts',
  };

  private gamingData: OfflineGamingData = {
    battles: [],
    userStats: {},
    achievements: [],
    rewardSystem: null,
    friends: [],
    experienceGains: [],
    dailyChallenges: [],
    weeklyChallenges: [],
    aiInsights: [],
    lastSync: new Date().toISOString(),
  };

  private pendingActions: BattleAction[] = [];
  private offlineRewards: OfflineReward[] = [];
  private isOnline = navigator.onLine;

  private constructor() {
    this.initializeOfflineGaming();
    this.setupEventListeners();
  }

  static getInstance(): OfflineGamingService {
    if (!OfflineGamingService.instance) {
      OfflineGamingService.instance = new OfflineGamingService();
    }
    return OfflineGamingService.instance;
  }

  // ==================== INITIALIZATION ====================

  private async initializeOfflineGaming(): Promise<void> {
    try {
      await this.loadFromStorage();
      console.log(
        '[OfflineGaming] Initialized with',
        this.gamingData.battles.length,
        'battles'
      );
    } catch (_error) {
      ErrorHandler.handleError(_error, 'Failed to initialize offline gaming', {
        context: 'OfflineGamingService.initializeOfflineGaming',
      });
    }
  }

  private setupEventListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (_event.data.type === 'GAMING_SYNC_COMPLETE') {
          this.handleSyncComplete(_event.data);
        }
      });
    }
  }

  private async handleOnline(): Promise<void> {
    this.isOnline = true;
    console.log('[OfflineGaming] Coming online, syncing data...');

    // Trigger sync when coming online
    await this.syncWithServer();

    // Notify service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'QUEUE_GAMING_SYNC',
        data: {
          pendingActions: this.pendingActions.length,
          offlineRewards: this.offlineRewards.length,
        },
      });
    }
  }

  private handleOffline(): void {
    this.isOnline = false;
    console.log('[OfflineGaming] Going offline, enabling offline mode...');
  }

  // ==================== BATTLE MANAGEMENT ====================

  async createBattle(battleData: Partial<Battle>): Promise<Battle> {
    try {
      const battle: Battle = {
        id: `offline_battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: battleData.type || 'speed',
        participants: [],
        creatorId: battleData.creatorId || '',
        status: 'registration',
        startTime: battleData.startTime || new Date(Date.now() + 60000).toISOString(), // 1 minute from now
        endTime: battleData.endTime || new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        settings: battleData.settings || {
          wakeWindow: 30,
          allowSnooze: false,
          maxSnoozes: 0,
          difficulty: 'medium',
          weatherBonus: false,
          taskChallenge: false,
        },
        createdAt: new Date().toISOString(),
        maxParticipants: battleData.maxParticipants || 10,
        minParticipants: battleData.minParticipants || 2,
        ...battleData,
      };

      // Add to local storage
      this.gamingData.battles.unshift(battle);
      await this.saveToStorage();

      // Queue action for sync
      const action: BattleAction = {
        id: `action_${Date.now()}`,
        type: 'create',
        battleId: battle.id,
        userId: battle.creatorId,
        data: battle,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      this.pendingActions.push(action);
      await this.savePendingActions();

      console.log('[OfflineGaming] Created battle offline:', battle.id);
      return battle;
    } catch (_error) {
      ErrorHandler.handleError(_error, 'Failed to create battle offline', {
        context: 'OfflineGamingService.createBattle',
      });
      throw error;
    }
  }

  async joinBattle(battleId: string, userId: string): Promise<boolean> {
    try {
      const battle = this.gamingData.battles.find(b => b.id === battleId);
      if (!battle) {
        throw new Error('Battle not found');
      }

      if (battle.participants.length >= (battle.maxParticipants || 10)) {
        throw new Error('Battle is full');
      }

      if (battle.participants.some(p => p.userId === userId)) {
        throw new Error('Already joined this battle');
      }

      // Add participant
      const participant: BattleParticipant = {
        userId,
        joinedAt: new Date().toISOString(),
        score: 0,
        wakeTime: '',
        status: 'registered',
        eliminated: false,
      };

      battle.participants.push(participant);
      await this.saveToStorage();

      // Queue action for sync
      const action: BattleAction = {
        id: `action_${Date.now()}`,
        type: 'join',
        battleId,
        userId,
        data: participant,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      this.pendingActions.push(action);
      await this.savePendingActions();

      console.log('[OfflineGaming] Joined battle offline:', battleId);
      return true;
    } catch (_error) {
      ErrorHandler.handleError(_error, 'Failed to join battle offline', {
        context: 'OfflineGamingService.joinBattle',
        battleId,
        userId,
      });
      return false;
    }
  }

  async completeBattle(
    battleId: string,
    results: { userId: string; score: number; wakeTime: string }[]
  ): Promise<void> {
    try {
      const battle = this.gamingData.battles.find(b => b.id === battleId);
      if (!battle) {
        throw new Error('Battle not found');
      }

      // Update battle with results
      battle.status = 'completed';
      battle.endTime = new Date().toISOString();

      // Calculate winner and update participants
      let highestScore = -1;
      let winnerId = '';

      results.forEach(result => {
        const participant = battle.participants.find(p => p.userId === result.userId);
        if (participant) {
          participant.score = result.score;
          participant.wakeTime = result.wakeTime;
          participant.status = 'completed';

          if (result.score > highestScore) {
            highestScore = result.score;
            winnerId = result.userId;
          }
        }
      });

      battle.winner = winnerId;

      // Award offline rewards
      for (const participant of battle.participants) {
        const isWinner = participant.userId === winnerId;
        const rewardAmount = isWinner ? 100 : 25; // Winners get 100 XP, others get 25 XP

        await this.awardOfflineReward({
          type: isWinner ? 'battle_win' : 'experience',
          amount: rewardAmount,
          reason: isWinner
            ? `Won ${battle.type} battle`
            : `Participated in ${battle.type} battle`,
          userId: participant.userId,
        });
      }

      await this.saveToStorage();

      // Queue action for sync
      const action: BattleAction = {
        id: `action_${Date.now()}`,
        type: 'complete',
        battleId,
        userId: winnerId,
        data: { results, winner: winnerId },
        timestamp: new Date().toISOString(),
        synced: false,
      };

      this.pendingActions.push(action);
      await this.savePendingActions();

      console.log(
        '[OfflineGaming] Completed battle offline:',
        battleId,
        'Winner:',
        winnerId
      );
    } catch (_error) {
      ErrorHandler.handleError(_error, 'Failed to complete battle offline', {
        context: 'OfflineGamingService.completeBattle',
        battleId,
      });
    }
  }

  // ==================== REWARDS MANAGEMENT ====================

  async awardOfflineReward(reward: {
    type: OfflineReward['type'];
    amount: number;
    reason: string;
    userId: string;
  }): Promise<void> {
    try {
      const offlineReward: OfflineReward = {
        id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: reward.type,
        amount: reward.amount,
        reason: reward.reason,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      this.offlineRewards.push(offlineReward);

      // Update local reward system
      if (this.gamingData.rewardSystem) {
        this.gamingData.rewardSystem.totalPoints += reward.amount;

        // Check for level up
        const newLevel =
          Math.floor(this.gamingData.rewardSystem.totalPoints / 1000) + 1;
        if (newLevel > this.gamingData.rewardSystem.level) {
          this.gamingData.rewardSystem.level = newLevel;

          // Award level up reward
          const levelUpReward: OfflineReward = {
            id: `levelup_${Date.now()}`,
            type: 'level_up',
            amount: newLevel,
            reason: `Reached level ${newLevel}`,
            timestamp: new Date().toISOString(),
            synced: false,
          };
          this.offlineRewards.push(levelUpReward);
        }
      }

      await this.saveToStorage();
      await this.saveOfflineRewards();

      console.log(
        '[OfflineGaming] Awarded offline reward:',
        reward.type,
        reward.amount
      );
    } catch (_error) {
      ErrorHandler.handleError(_error, 'Failed to award offline reward', {
        context: 'OfflineGamingService.awardOfflineReward',
      });
    }
  }

  // ==================== DATA RETRIEVAL ====================

  getBattles(): Battle[] {
    return this.gamingData.battles;
  }

  getActiveBattles(): Battle[] {
    return this.gamingData.battles.filter(
      b => b.status === 'active' || b.status === 'registration'
    );
  }

  getBattle(battleId: string): Battle | null {
    return this.gamingData.battles.find(b => b.id === battleId) || null;
  }

  getRewardSystem(): RewardSystem | null {
    return this.gamingData.rewardSystem;
  }

  getFriends(): User[] {
    return this.gamingData.friends;
  }

  getAchievements(): Achievement[] {
    return this.gamingData.achievements;
  }

  getPendingActions(): BattleAction[] {
    return this.pendingActions.filter(a => !a.synced);
  }

  getOfflineRewards(): OfflineReward[] {
    return this.offlineRewards.filter(r => !r.synced);
  }

  // ==================== STORAGE MANAGEMENT ====================

  private async loadFromStorage(): Promise<void> {
    try {
      const gamingData = SecurityService.secureStorageGet(
        this.STORAGE_KEYS.GAMING_DATA
      );
      if (gamingData) {
        this.gamingData = { ...this.gamingData, ...gamingData };
      }

      const pendingActions = SecurityService.secureStorageGet(
        this.STORAGE_KEYS.BATTLE_ACTIONS
      );
      if (pendingActions && Array.isArray(pendingActions)) {
        this.pendingActions = pendingActions;
      }

      const offlineRewards = SecurityService.secureStorageGet(
        this.STORAGE_KEYS.OFFLINE_REWARDS
      );
      if (offlineRewards && Array.isArray(offlineRewards)) {
        this.offlineRewards = offlineRewards;
      }
    } catch (_error) {
      console._error('[OfflineGaming] Failed to load from storage:', _error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      SecurityService.secureStorageSet(this.STORAGE_KEYS.GAMING_DATA, this.gamingData);
    } catch (_error) {
      console._error('[OfflineGaming] Failed to save to storage:', _error);
    }
  }

  private async savePendingActions(): Promise<void> {
    try {
      SecurityService.secureStorageSet(
        this.STORAGE_KEYS.BATTLE_ACTIONS,
        this.pendingActions
      );
    } catch (_error) {
      console._error('[OfflineGaming] Failed to save pending actions:', _error);
    }
  }

  private async saveOfflineRewards(): Promise<void> {
    try {
      SecurityService.secureStorageSet(
        this.STORAGE_KEYS.OFFLINE_REWARDS,
        this.offlineRewards
      );
    } catch (_error) {
      console._error('[OfflineGaming] Failed to save offline rewards:', _error);
    }
  }

  // ==================== SYNC MANAGEMENT ====================

  async syncWithServer(): Promise<void> {
    if (!this.isOnline) {
      console.log('[OfflineGaming] Cannot sync while offline');
      return;
    }

    try {
      console.log('[OfflineGaming] Starting sync with server...');

      // Sync pending actions
      for (const action of this.pendingActions.filter(a => !a.synced)) {
        try {
          await this.syncBattleAction(action);
          action.synced = true;
        } catch (_error) {
          console._error('[OfflineGaming] Failed to sync action:', action.id, _error);
        }
      }

      // Sync offline rewards
      for (const reward of this.offlineRewards.filter(r => !r.synced)) {
        try {
          await this.syncOfflineReward(reward);
          reward.synced = true;
        } catch (_error) {
          console._error('[OfflineGaming] Failed to sync reward:', reward.id, _error);
        }
      }

      // Update last sync time
      this.gamingData.lastSync = new Date().toISOString();

      await this.saveToStorage();
      await this.savePendingActions();
      await this.saveOfflineRewards();

      console.log('[OfflineGaming] Sync completed successfully');
    } catch (_error) {
      ErrorHandler.handleError(_error, 'Gaming sync failed', {
        context: 'OfflineGamingService.syncWithServer',
      });
    }
  }

  private async syncBattleAction(action: BattleAction): Promise<void> {
    // In a real implementation, this would make API calls to sync the action
    // For now, we'll simulate the sync
    console.log('[OfflineGaming] Syncing battle action:', action.type, action.battleId);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mark as synced
    return Promise.resolve();
  }

  private async syncOfflineReward(reward: OfflineReward): Promise<void> {
    // In a real implementation, this would make API calls to sync the reward
    console.log('[OfflineGaming] Syncing offline reward:', reward.type, reward.amount);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mark as synced
    return Promise.resolve();
  }

  private handleSyncComplete(data: any): void {
    console.log('[OfflineGaming] Sync completed via service worker:', data);

    // Dispatch custom event for components to update
    window.dispatchEvent(
      new CustomEvent('gaming-sync-complete', {
        detail: {
          synced: data.synced || 0,
          failed: data.failed || 0,
          timestamp: Date.now(),
        },
      })
    );
  }

  // ==================== UTILITY METHODS ====================

  async clearOfflineData(): Promise<void> {
    try {
      this.gamingData = {
        battles: [],
        userStats: {},
        achievements: [],
        rewardSystem: null,
        friends: [],
        experienceGains: [],
        dailyChallenges: [],
        weeklyChallenges: [],
        aiInsights: [],
        lastSync: new Date().toISOString(),
      };

      this.pendingActions = [];
      this.offlineRewards = [];

      await this.saveToStorage();
      await this.savePendingActions();
      await this.saveOfflineRewards();

      console.log('[OfflineGaming] Cleared all offline gaming data');
    } catch (_error) {
      ErrorHandler.handleError(_error, 'Failed to clear offline gaming data', {
        context: 'OfflineGamingService.clearOfflineData',
      });
    }
  }

  getOfflineStats() {
    return {
      battles: this.gamingData.battles.length,
      pendingActions: this.pendingActions.filter(a => !a.synced).length,
      offlineRewards: this.offlineRewards.filter(r => !r.synced).length,
      lastSync: this.gamingData.lastSync,
      isOnline: this.isOnline,
    };
  }
}

export default OfflineGamingService;
