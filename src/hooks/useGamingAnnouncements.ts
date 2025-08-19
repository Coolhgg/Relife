// Gaming-specific Screen Reader Announcements
// Extends the base screen reader system with gaming features
import { useCallback, useEffect, useRef } from "react";
import { useScreenReaderAnnouncements } from "./useScreenReaderAnnouncements";
import type {
  Battle,
  Achievement,
  User as UserType,
  Reward,
  Quest,
  DailyChallenge,
  WeeklyChallenge,
  PlayerLevel,
  ExperienceGain,
  BattleType,
} from "../types";

interface GamingAnnouncement {
  type:
    | "battle"
    | "achievement"
    | "level"
    | "friend"
    | "reward"
    | "quest"
    | "leaderboard"
    | "tournament"
    | "xp-gain";
  action?: string;
  data?: any;
  priority?: "polite" | "assertive";
  customMessage?: string;
}

export function useGamingAnnouncements(enabled = true) {
  const { announce } = useScreenReaderAnnouncements({ enabled });
  const previousValues = useRef<Record<string, any>>({});

  const announceGaming = useCallback(
    (announcement: GamingAnnouncement) => {
      if (!enabled) return;

      const {
        type,
        action,
        data,
        priority = "polite",
        customMessage,
      } = announcement;
      let message = customMessage || "";

      switch (type) {
        case "battle":
          message = formatBattleAnnouncement(action!, data);
          break;
        case "achievement":
          message = formatAchievementAnnouncement(action!, data);
          break;
        case "level":
          message = formatLevelAnnouncement(action!, data);
          break;
        case "friend":
          message = formatFriendAnnouncement(action!, data);
          break;
        case "reward":
          message = formatRewardAnnouncement(action!, data);
          break;
        case "quest":
          message = formatQuestAnnouncement(action!, data);
          break;
        case "leaderboard":
          message = formatLeaderboardAnnouncement(action!, data);
          break;
        case "tournament":
          message = formatTournamentAnnouncement(action!, data);
          break;
        case "xp-gain":
          message = formatXpGainAnnouncement(data);
          break;
      }

      if (message) {
        announce({
          type: "custom",
          message,
          priority,
        });
      }
    },
    [enabled, announce],
  );

  // Battle announcements
  const announceBattleEvent = useCallback(
    (
      action: "created" | "joined" | "started" | "won" | "lost" | "ended",
      battleData: Partial<Battle>,
    ) => {
      announceGaming({
        type: "battle",
        action,
        data: battleData,
        priority:
          action === "won" || action === "lost" ? "assertive" : "polite",
      });
    },
    [announceGaming],
  );

  // Achievement announcements
  const announceAchievement = useCallback(
    (
      action: "unlocked" | "progress" | "completed",
      achievementData: Partial<Achievement>,
    ) => {
      announceGaming({
        type: "achievement",
        action,
        data: achievementData,
        priority: action === "unlocked" ? "assertive" : "polite",
      });
    },
    [announceGaming],
  );

  // Level/XP announcements
  const announceLevelChange = useCallback(
    (
      action: "level-up" | "xp-gained",
      levelData: Partial<PlayerLevel> | ExperienceGain,
    ) => {
      announceGaming({
        type: "level",
        action,
        data: levelData,
        priority: action === "level-up" ? "assertive" : "polite",
      });
    },
    [announceGaming],
  );

  // Friend system announcements
  const announceFriendEvent = useCallback(
    (
      action: "added" | "request-sent" | "request-received" | "removed",
      friendData: Partial<UserType>,
    ) => {
      announceGaming({
        type: "friend",
        action,
        data: friendData,
        priority: "polite",
      });
    },
    [announceGaming],
  );

  // Reward announcements
  const announceRewardEvent = useCallback(
    (
      action: "claimed" | "available" | "expired",
      rewardData: Partial<Reward>,
    ) => {
      announceGaming({
        type: "reward",
        action,
        data: rewardData,
        priority: action === "claimed" ? "assertive" : "polite",
      });
    },
    [announceGaming],
  );

  // Quest announcements
  const announceQuestEvent = useCallback(
    (
      action: "started" | "completed" | "progress" | "failed",
      questData: Partial<Quest>,
    ) => {
      announceGaming({
        type: "quest",
        action,
        data: questData,
        priority: action === "completed" ? "assertive" : "polite",
      });
    },
    [announceGaming],
  );

  // Leaderboard announcements
  const announceLeaderboardChange = useCallback(
    (
      action: "rank-up" | "rank-down" | "new-record",
      leaderboardData: { oldRank?: number; newRank: number; score?: number },
    ) => {
      announceGaming({
        type: "leaderboard",
        action,
        data: leaderboardData,
        priority: "polite",
      });
    },
    [announceGaming],
  );

  // Tournament announcements
  const announceTournamentEvent = useCallback(
    (
      action: "joined" | "eliminated" | "advanced" | "won",
      tournamentData: any,
    ) => {
      announceGaming({
        type: "tournament",
        action,
        data: tournamentData,
        priority: action === "won" ? "assertive" : "polite",
      });
    },
    [announceGaming],
  );

  // Auto-tracking for common state changes
  const trackBattleCount = useCallback(
    (battles: Battle[]) => {
      const activeBattleCount = battles.filter(
        (b) => b.status === "active",
      ).length;
      const previousCount = previousValues.current.activeBattles || 0;

      if (previousCount !== activeBattleCount && previousCount > 0) {
        const difference = activeBattleCount - previousCount;
        if (difference > 0) {
          announceGaming({
            type: "battle",
            customMessage: `${difference} new battle${difference > 1 ? "s" : ""} available`,
            priority: "polite",
          });
        }
      }
      previousValues.current.activeBattles = activeBattleCount;
    },
    [announceGaming],
  );

  const trackAchievements = useCallback(
    (achievements: Achievement[]) => {
      const unlockedCount = achievements.filter((a) => a.unlockedAt).length;
      const previousCount = previousValues.current.achievements || 0;

      if (unlockedCount > previousCount && previousCount > 0) {
        const newAchievements = unlockedCount - previousCount;
        announceGaming({
          type: "achievement",
          customMessage: `${newAchievements} new achievement${newAchievements > 1 ? "s" : ""} unlocked!`,
          priority: "assertive",
        });
      }
      previousValues.current.achievements = unlockedCount;
    },
    [announceGaming],
  );

  return {
    announceGaming,
    announceBattleEvent,
    announceAchievement,
    announceLevelChange,
    announceFriendEvent,
    announceRewardEvent,
    announceQuestEvent,
    announceLeaderboardChange,
    announceTournamentEvent,
    trackBattleCount,
    trackAchievements,
  };
}

// Helper functions for formatting announcements

function formatBattleAnnouncement(
  action: string,
  data: Partial<Battle>,
): string {
  const battleTypeNames: Record<BattleType, string> = {
    speed: "Speed Battle",
    consistency: "Consistency Challenge",
    tasks: "Task Master",
    bragging: "Bragging Rights",
    group: "Group Battle",
    tournament: "Tournament Battle",
  };

  const battleName = data.type ? battleTypeNames[data.type] : "Battle";
  const participantCount = data.participants?.length || 0;

  switch (action) {
    case "created":
      return `${battleName} created with ${participantCount} participants. Battle starts soon.`;
    case "joined":
      return `Joined ${battleName}. ${participantCount} participants total.`;
    case "started":
      return `${battleName} has started! Good luck!`;
    case "won":
      return `Victory! You won the ${battleName}! Congratulations!`;
    case "lost":
      return `${battleName} ended. Better luck next time!`;
    case "ended":
      return `${battleName} has concluded. Check results for final standings.`;
    default:
      return `${battleName} event: ${action}`;
  }
}

function formatAchievementAnnouncement(
  action: string,
  data: Partial<Achievement>,
): string {
  const achievementName = data.name || "Achievement";
  const rarity = data.rarity || "common";
  const rarityText = rarity === "common" ? "" : ` ${rarity} `;

  switch (action) {
    case "unlocked":
      return `Achievement unlocked! ${achievementName}${rarityText ? ` - ${rarityText}rarity` : ""}. ${data.description || ""}`;
    case "progress":
      if (data.progress) {
        const percentage = Math.round(
          (data.progress.current / data.progress.target) * 100,
        );
        return `Achievement progress: ${achievementName} - ${percentage}% complete (${data.progress.current} of ${data.progress.target})`;
      }
      return `Progress made on ${achievementName}`;
    case "completed":
      return `Achievement completed: ${achievementName}! Rewards claimed.`;
    default:
      return `${achievementName}: ${action}`;
  }
}

function formatLevelAnnouncement(action: string, data: any): string {
  switch (action) {
    case "level-up":
      const levelData = data as Partial<PlayerLevel>;
      return `Level up! You are now level ${levelData.current}. ${levelData.experienceToNext} XP needed for next level.`;
    case "xp-gained":
      const xpData = data as ExperienceGain;
      return `${xpData.amount} XP gained from ${xpData.source}. ${xpData.reason || ""}`;
    default:
      return `Level event: ${action}`;
  }
}

function formatFriendAnnouncement(
  action: string,
  data: Partial<UserType>,
): string {
  const friendName = data.displayName || data.username || "Friend";

  switch (action) {
    case "added":
      return `${friendName} added to friends list. Level ${data.level || "unknown"}.`;
    case "request-sent":
      return `Friend request sent to ${friendName}.`;
    case "request-received":
      return `Friend request received from ${friendName}. Level ${data.level || "unknown"}.`;
    case "removed":
      return `${friendName} removed from friends list.`;
    default:
      return `Friend event with ${friendName}: ${action}`;
  }
}

function formatRewardAnnouncement(
  action: string,
  data: Partial<Reward>,
): string {
  const rewardTitle = data.title || "Reward";
  const rarity = data.rarity || "common";

  switch (action) {
    case "claimed":
      return `Reward claimed: ${rewardTitle}${rarity !== "common" ? ` (${rarity} rarity)` : ""}. ${data.description || ""}`;
    case "available":
      return `New reward available: ${rewardTitle}. ${data.description || ""}`;
    case "expired":
      return `Reward expired: ${rewardTitle}`;
    default:
      return `Reward event: ${rewardTitle} - ${action}`;
  }
}

function formatQuestAnnouncement(action: string, data: Partial<Quest>): string {
  const questTitle = data.title || "Quest";
  const progress = data.progress || 0;
  const target = data.target || 1;

  switch (action) {
    case "started":
      return `Quest started: ${questTitle}. ${data.description || ""}`;
    case "completed":
      return `Quest completed: ${questTitle}! Rewards earned.`;
    case "progress":
      const percentage = Math.round((progress / target) * 100);
      return `Quest progress: ${questTitle} - ${percentage}% complete (${progress} of ${target})`;
    case "failed":
      return `Quest failed: ${questTitle}. Try again next time.`;
    default:
      return `Quest event: ${questTitle} - ${action}`;
  }
}

function formatLeaderboardAnnouncement(
  action: string,
  data: { oldRank?: number; newRank: number; score?: number },
): string {
  switch (action) {
    case "rank-up":
      return `Leaderboard rank improved! Moved from rank ${data.oldRank} to rank ${data.newRank}.`;
    case "rank-down":
      return `Leaderboard rank changed. Now rank ${data.newRank}${data.oldRank ? ` (was rank ${data.oldRank})` : ""}.`;
    case "new-record":
      return `New personal best! Score: ${data.score}. Rank: ${data.newRank}.`;
    default:
      return `Leaderboard update: rank ${data.newRank}`;
  }
}

function formatTournamentAnnouncement(action: string, data: any): string {
  const tournamentName = data.name || "Tournament";

  switch (action) {
    case "joined":
      return `Joined ${tournamentName}. ${data.participantCount || ""} participants registered.`;
    case "eliminated":
      return `Eliminated from ${tournamentName}. Great effort!`;
    case "advanced":
      return `Advanced to the next round in ${tournamentName}!`;
    case "won":
      return `Tournament victory! You won ${tournamentName}! Congratulations, champion!`;
    default:
      return `Tournament event: ${tournamentName} - ${action}`;
  }
}

function formatXpGainAnnouncement(data: ExperienceGain): string {
  return `${data.amount} XP earned from ${data.source}. ${data.reason || "Keep up the great work!"}`;
}

export default useGamingAnnouncements;
