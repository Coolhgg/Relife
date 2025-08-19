/**
 * Express API Endpoints for Struggling Sam Optimization Features
 * Handles all backend operations for streaks, achievements, challenges, and A/B testing
 */

import express, { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const router = express.Router();

// ============================================================================
// MIDDLEWARE & UTILITIES
// ============================================================================

// Error handling middleware
const handleError = (error: any, res: Response) => {
  console.error('Struggling Sam API Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message || 'An unexpected error occurred'
  });
};

// Validate user ID middleware
const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  if (!userId || userId === 'undefined') {
    return res.status(400).json({ error: 'Valid user ID is required' });
  }
  next();
};

// Update community stats helper
const updateCommunityStats = async () => {
  try {
    const { error } = await supabase.rpc('update_community_stats');
    if (error) {
      console.error('Failed to update community stats:', error);
    }
  } catch (error) {
    console.error('Error updating community stats:', error);
  }
};

// ============================================================================
// USER STREAK ENDPOINTS
// ============================================================================

// Get user streak data
router.get('/streak/:userId', validateUserId, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('current_streak, longest_streak, streak_freezes_used, max_streak_freezes, last_wake_up_date, streak_multiplier')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userStreak = {
      id: `streak-${userId}`,
      userId,
      currentStreak: data.current_streak || 0,
      longestStreak: data.longest_streak || 0,
      lastWakeUpDate: data.last_wake_up_date || new Date().toISOString().split('T')[0],
      streakType: 'daily_wakeup',
      freezesUsed: data.streak_freezes_used || 0,
      maxFreezes: data.max_streak_freezes || 3,
      multiplier: data.streak_multiplier || 1.0,
      milestones: [], // TODO: Fetch from streak_milestones table
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    res.json(userStreak);
  } catch (error) {
    handleError(error, res);
  }
});

// Update user streak
router.put('/streak/update', async (req: Request, res: Response) => {
  try {
    const { userId, currentStreak, longestStreak, lastWakeUpDate } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const updates: any = {
      current_streak: currentStreak,
      last_wake_up_date: lastWakeUpDate,
    };

    if (longestStreak !== undefined) {
      updates.longest_streak = longestStreak;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Update community stats
    await updateCommunityStats();

    res.json({
      id: `streak-${userId}`,
      userId,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      lastWakeUpDate: data.last_wake_up_date,
      streakType: 'daily_wakeup',
      freezesUsed: data.streak_freezes_used || 0,
      maxFreezes: data.max_streak_freezes || 3,
      multiplier: data.streak_multiplier || 1.0,
      milestones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Use streak freeze
router.post('/streak/freeze', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get current freeze usage
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('streak_freezes_used, max_streak_freezes')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const freezesUsed = userData.streak_freezes_used || 0;
    const maxFreezes = userData.max_streak_freezes || 3;

    if (freezesUsed >= maxFreezes) {
      return res.status(400).json({ error: 'No streak freezes remaining' });
    }

    // Use a freeze
    const { data, error } = await supabase
      .from('users')
      .update({ streak_freezes_used: freezesUsed + 1 })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Streak freeze used successfully',
      freezesRemaining: maxFreezes - (freezesUsed + 1)
    });
  } catch (error) {
    handleError(error, res);
  }
});

// ============================================================================
// ACHIEVEMENT ENDPOINTS
// ============================================================================

// Get user achievements
router.get('/achievements/:userId', validateUserId, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const achievements = data.map((achievement: any) => ({
      id: achievement.id,
      userId: achievement.user_id,
      achievementType: achievement.achievement_type,
      title: achievement.title,
      description: achievement.description,
      iconUrl: achievement.icon_url || '🏆',
      rarity: achievement.rarity,
      unlockedAt: new Date(achievement.earned_date),
      shared: achievement.shared,
      progress: {
        current: achievement.progress_current,
        target: achievement.progress_target,
        percentage: achievement.progress_target > 0 
          ? (achievement.progress_current / achievement.progress_target) * 100 
          : 0
      },
      requirements: [], // TODO: Implement requirements system
      socialProofText: achievement.social_proof_text,
    }));

    res.json(achievements);
  } catch (error) {
    handleError(error, res);
  }
});

// Unlock achievement
router.post('/achievements/unlock', async (req: Request, res: Response) => {
  try {
    const { userId, achievementType, progress } = req.body;

    if (!userId || !achievementType) {
      return res.status(400).json({ error: 'User ID and achievement type are required' });
    }

    // Get achievement template
    const { data: template, error: templateError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('achievement_type', achievementType)
      .is('user_id', null)
      .single();

    if (templateError || !template) {
      return res.status(404).json({ error: 'Achievement type not found' });
    }

    // Check if user already has this achievement
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_type', achievementType)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Achievement already unlocked' });
    }

    // Create user achievement
    const { data, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_type: achievementType,
        title: template.title,
        description: template.description,
        icon_url: template.icon_url,
        rarity: template.rarity,
        social_proof_text: template.social_proof_text,
        progress_current: progress?.current || template.progress_target,
        progress_target: template.progress_target,
        earned_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Update user total achievements count
    await supabase.rpc('increment', {
      table_name: 'users',
      column_name: 'total_achievements',
      row_id: userId,
    });

    // Update community stats
    await updateCommunityStats();

    // Add to realtime activity feed
    await supabase
      .from('realtime_activity')
      .insert({
        activity_type: 'achievement_unlocked',
        message: `Someone just unlocked ${template.title}! 🏆`,
        anonymous: true,
      });

    res.json({
      id: data.id,
      userId: data.user_id,
      achievementType: data.achievement_type,
      title: data.title,
      description: data.description,
      iconUrl: data.icon_url,
      rarity: data.rarity,
      unlockedAt: new Date(data.earned_date),
      shared: false,
      progress: {
        current: data.progress_current,
        target: data.progress_target,
        percentage: 100
      },
      requirements: [],
      socialProofText: data.social_proof_text,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Share achievement
router.post('/achievements/share', async (req: Request, res: Response) => {
  try {
    const { achievementId, platform } = req.body;

    if (!achievementId) {
      return res.status(400).json({ error: 'Achievement ID is required' });
    }

    const { error } = await supabase
      .from('user_achievements')
      .update({ shared: true })
      .eq('id', achievementId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Achievement shared successfully', platform });
  } catch (error) {
    handleError(error, res);
  }
});

// ============================================================================
// SOCIAL CHALLENGE ENDPOINTS
// ============================================================================

// Get available challenges
router.get('/challenges', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    let query = supabase
      .from('social_challenges')
      .select(`
        *,
        challenge_participants(user_id, progress, current_streak, rank),
        challenge_rewards(*)
      `)
      .eq('status', 'active');

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const challenges = data.map((challenge: any) => ({
      id: challenge.id,
      creatorId: challenge.creator_id,
      title: challenge.title,
      description: challenge.description,
      challengeType: challenge.challenge_type,
      difficulty: challenge.difficulty,
      duration: challenge.duration_days,
      maxParticipants: challenge.max_participants,
      currentParticipants: challenge.current_participants,
      startDate: new Date(challenge.start_date),
      endDate: new Date(challenge.end_date),
      status: challenge.status,
      participants: challenge.challenge_participants || [],
      rewards: challenge.challenge_rewards || [],
      leaderboard: [], // TODO: Implement leaderboard calculation
      socialProofMetrics: {
        totalParticipants: challenge.current_participants,
        activeParticipants: challenge.current_participants,
        completionRate: 0.75, // Mock data
        shareCount: 0,
        engagementScore: 0.8,
      },
      createdAt: new Date(challenge.created_at),
    }));

    res.json(challenges);
  } catch (error) {
    handleError(error, res);
  }
});

// Get user challenges
router.get('/challenges/user/:userId', validateUserId, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('challenge_participants')
      .select(`
        *,
        social_challenges(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const challenges = data.map((participant: any) => ({
      id: participant.social_challenges.id,
      title: participant.social_challenges.title,
      description: participant.social_challenges.description,
      challengeType: participant.social_challenges.challenge_type,
      userProgress: participant.progress,
      userRank: participant.rank,
      joinedAt: new Date(participant.joined_at),
    }));

    res.json(challenges);
  } catch (error) {
    handleError(error, res);
  }
});

// Join challenge
router.post('/challenges/join', async (req: Request, res: Response) => {
  try {
    const { userId, challengeId } = req.body;

    if (!userId || !challengeId) {
      return res.status(400).json({ error: 'User ID and challenge ID are required' });
    }

    // Check if already joined
    const { data: existing } = await supabase
      .from('challenge_participants')
      .select('id')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Already joined this challenge' });
    }

    // Join challenge
    const { data, error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        progress: 0,
        current_streak: 0,
        rank: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Update challenge participant count
    await supabase.rpc('increment', {
      table_name: 'social_challenges',
      column_name: 'current_participants',
      row_id: challengeId,
    });

    res.json({
      userId: data.user_id,
      user: { id: userId }, // TODO: Fetch user details
      joinedAt: new Date(data.joined_at),
      progress: data.progress,
      currentStreak: data.current_streak,
      lastActivity: new Date(data.last_activity),
      rank: data.rank,
      isActive: data.is_active,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Leave challenge
router.post('/challenges/leave', async (req: Request, res: Response) => {
  try {
    const { userId, challengeId } = req.body;

    if (!userId || !challengeId) {
      return res.status(400).json({ error: 'User ID and challenge ID are required' });
    }

    const { error } = await supabase
      .from('challenge_participants')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('challenge_id', challengeId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Decrement challenge participant count
    await supabase.rpc('decrement', {
      table_name: 'social_challenges',
      column_name: 'current_participants',
      row_id: challengeId,
    });

    res.json({ message: 'Left challenge successfully' });
  } catch (error) {
    handleError(error, res);
  }
});

// ============================================================================
// SMART UPGRADE PROMPT ENDPOINTS
// ============================================================================

// Get upgrade prompts for user
router.get('/upgrade-prompts/:userId', validateUserId, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('smart_upgrade_prompts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_shown', false)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const prompts = data.map((prompt: any) => ({
      id: prompt.id,
      userId: prompt.user_id,
      triggerType: prompt.trigger_type,
      promptType: prompt.prompt_type,
      title: prompt.title,
      description: prompt.description,
      benefits: prompt.benefits,
      socialProof: prompt.social_proof,
      discount: prompt.discount_percentage ? {
        percentage: prompt.discount_percentage,
        duration: prompt.discount_duration_hours,
        code: prompt.discount_code,
        reason: prompt.discount_reason,
      } : undefined,
      urgency: {
        level: prompt.urgency_level,
        message: prompt.urgency_message,
        expiresAt: prompt.expires_at ? new Date(prompt.expires_at) : undefined,
      },
      context: {
        streakDays: prompt.streak_context,
        recentAchievements: prompt.recent_achievements,
        socialActivity: prompt.social_activity,
        engagementLevel: prompt.engagement_level,
        previousPromptsSeen: prompt.previous_prompts_seen,
        daysSinceLastPrompt: prompt.days_since_last_prompt,
      },
      isShown: prompt.is_shown,
      createdAt: new Date(prompt.created_at),
    }));

    res.json(prompts);
  } catch (error) {
    handleError(error, res);
  }
});

// Track prompt action
router.post('/upgrade-prompts/track', async (req: Request, res: Response) => {
  try {
    const { promptId, action, timestamp } = req.body;

    if (!promptId || !action) {
      return res.status(400).json({ error: 'Prompt ID and action are required' });
    }

    const updates: any = {};

    switch (action) {
      case 'shown':
        updates.is_shown = true;
        updates.shown_at = timestamp;
        break;
      case 'clicked':
        updates.clicked_at = timestamp;
        break;
      case 'converted':
        updates.converted_at = timestamp;
        break;
      case 'dismissed':
        updates.dismissed_at = timestamp;
        break;
    }

    const { error } = await supabase
      .from('smart_upgrade_prompts')
      .update(updates)
      .eq('id', promptId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Prompt action tracked successfully', action });
  } catch (error) {
    handleError(error, res);
  }
});

// ============================================================================
// CELEBRATION ENDPOINTS
// ============================================================================

// Create celebration
router.post('/celebrations', async (req: Request, res: Response) => {
  try {
    const celebrationData = req.body;

    const { data, error } = await supabase
      .from('habit_celebrations')
      .insert({
        user_id: celebrationData.userId,
        celebration_type: celebrationData.celebrationType,
        trigger_type: celebrationData.trigger.type,
        trigger_value: celebrationData.trigger.value,
        trigger_context: celebrationData.trigger.context,
        title: celebrationData.title,
        message: celebrationData.message,
        animation_type: celebrationData.animation.type,
        animation_duration: celebrationData.animation.duration,
        animation_intensity: celebrationData.animation.intensity,
        animation_colors: celebrationData.animation.colors,
        rewards: celebrationData.rewards,
        social_share_enabled: celebrationData.socialShare.enabled,
        social_share_message: celebrationData.socialShare.defaultMessage,
        social_share_hashtags: celebrationData.socialShare.hashtags,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      id: data.id,
      userId: data.user_id,
      celebrationType: data.celebration_type,
      trigger: {
        type: data.trigger_type,
        value: data.trigger_value,
        context: data.trigger_context,
      },
      title: data.title,
      message: data.message,
      animation: {
        type: data.animation_type,
        duration: data.animation_duration,
        intensity: data.animation_intensity,
        colors: data.animation_colors,
      },
      rewards: data.rewards,
      socialShare: {
        enabled: data.social_share_enabled,
        defaultMessage: data.social_share_message,
        hashtags: data.social_share_hashtags,
        platforms: ['twitter', 'facebook'],
      },
      isShown: data.is_shown,
      createdAt: new Date(data.created_at),
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Mark celebration as shown
router.put('/celebrations/:celebrationId/shown', async (req: Request, res: Response) => {
  try {
    const { celebrationId } = req.params;
    const { shownAt } = req.body;

    const { error } = await supabase
      .from('habit_celebrations')
      .update({
        is_shown: true,
        shown_at: shownAt,
      })
      .eq('id', celebrationId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Celebration marked as shown' });
  } catch (error) {
    handleError(error, res);
  }
});

// ============================================================================
// COMMUNITY & SOCIAL PROOF ENDPOINTS
// ============================================================================

// Get community stats
router.get('/community/stats', async (req: Request, res: Response) => {
  try {
    await updateCommunityStats();

    const { data, error } = await supabase
      .from('community_stats')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get recent activity
    const { data: activityData } = await supabase
      .from('realtime_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const communityStats = {
      totalUsers: data.total_users,
      activeToday: data.active_today,
      totalStreaks: data.total_streaks,
      averageStreak: data.average_streak,
      achievementsUnlocked: data.achievements_unlocked,
      challengesActive: data.challenges_active,
      successRate: data.success_rate,
      lastUpdated: new Date(data.updated_at),
      realtimeActivity: (activityData || []).map((activity: any) => ({
        id: activity.id,
        type: activity.activity_type,
        message: activity.message,
        timestamp: new Date(activity.created_at),
        anonymous: activity.anonymous,
      })),
    };

    res.json(communityStats);
  } catch (error) {
    handleError(error, res);
  }
});

// Get social proof data
router.get('/social-proof', async (req: Request, res: Response) => {
  try {
    const { segment } = req.query;

    let query = supabase
      .from('social_proof_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (segment) {
      query = query.eq('user_segment', segment);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const socialProofData = data.map((item: any) => ({
      id: item.id,
      type: item.type,
      content: item.content,
      timestamp: new Date(item.created_at),
      isRealTime: item.is_realtime,
      userSegment: item.user_segment,
      engagement: {
        views: item.views,
        clicks: item.clicks,
        shares: item.shares,
        conversionRate: item.conversion_rate,
        lastUpdated: new Date(item.updated_at),
      },
    }));

    res.json(socialProofData);
  } catch (error) {
    handleError(error, res);
  }
});

// ============================================================================
// A/B TESTING ENDPOINTS
// ============================================================================

// Get user A/B test assignment
router.get('/ab-test/assignment/:userId', validateUserId, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('user_ab_tests')
      .select(`
        *,
        ab_test_groups(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'No A/B test assignment found' });
    }

    const userABTest = {
      userId: data.user_id,
      testId: data.test_group_id,
      groupId: data.test_group_id,
      assignedAt: new Date(data.assigned_at),
      isActive: data.is_active,
      hasConverted: data.has_converted,
      convertedAt: data.converted_at ? new Date(data.converted_at) : undefined,
      metrics: {
        sessionsCount: data.sessions_count,
        featuresUsed: data.features_used,
        engagementScore: data.engagement_score,
        retentionDays: data.retention_days,
        lastActivity: new Date(data.last_activity),
      },
    };

    res.json(userABTest);
  } catch (error) {
    handleError(error, res);
  }
});

// Assign user to A/B test
router.post('/ab-test/assignment', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get available test groups
    const { data: testGroups, error: groupsError } = await supabase
      .from('ab_test_groups')
      .select('*')
      .eq('status', 'active');

    if (groupsError || !testGroups.length) {
      return res.status(400).json({ error: 'No active test groups available' });
    }

    // Randomly assign user to a group based on percentages
    const random = Math.random() * 100;
    let cumulativePercentage = 0;
    let selectedGroup = testGroups[0];

    for (const group of testGroups) {
      cumulativePercentage += group.percentage;
      if (random <= cumulativePercentage) {
        selectedGroup = group;
        break;
      }
    }

    // Create user assignment
    const { data, error } = await supabase
      .from('user_ab_tests')
      .insert({
        user_id: userId,
        test_group_id: selectedGroup.id,
        is_active: true,
        sessions_count: 1,
        features_used: [],
        engagement_score: 0,
        retention_days: 0,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      userId: data.user_id,
      testId: data.test_group_id,
      groupId: data.test_group_id,
      assignedAt: new Date(data.assigned_at),
      isActive: data.is_active,
      hasConverted: data.has_converted,
      metrics: {
        sessionsCount: data.sessions_count,
        featuresUsed: data.features_used,
        engagementScore: data.engagement_score,
        retentionDays: data.retention_days,
        lastActivity: new Date(data.last_activity),
      },
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Get A/B test groups
router.get('/ab-test/groups', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('ab_test_groups')
      .select(`
        *,
        ab_test_features(*)
      `)
      .eq('status', 'active');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const testGroups = data.map((group: any) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      percentage: group.percentage,
      isControl: group.is_control,
      features: (group.ab_test_features || []).map((feature: any) => ({
        featureId: feature.feature_id,
        variant: feature.variant,
        enabled: feature.enabled,
        configuration: feature.configuration,
      })),
      status: group.status,
      startDate: new Date(group.start_date),
      endDate: group.end_date ? new Date(group.end_date) : undefined,
      results: {
        totalUsers: group.total_users,
        conversionRate: group.conversion_rate,
        significanceLevel: group.significance_level,
        isWinner: group.is_winner,
        lastUpdated: new Date(group.updated_at),
      },
    }));

    res.json(testGroups);
  } catch (error) {
    handleError(error, res);
  }
});

// Track A/B test events
router.post('/ab-test/track', async (req: Request, res: Response) => {
  try {
    const { testId, userId, action, metadata, timestamp } = req.body;

    if (!testId || !userId || !action) {
      return res.status(400).json({ error: 'Test ID, user ID, and action are required' });
    }

    // Update user assignment with tracking data
    const updates: any = {
      last_activity: timestamp || new Date().toISOString(),
    };

    if (action === 'conversion') {
      updates.has_converted = true;
      updates.converted_at = timestamp || new Date().toISOString();
    }

    // Increment sessions count if it's a session start
    if (action === 'session_start') {
      await supabase.rpc('increment', {
        table_name: 'user_ab_tests',
        column_name: 'sessions_count',
        row_id: testId,
        user_column: 'user_id',
        user_value: userId,
      });
    }

    // Add to features used array if it's a feature action
    if (action.startsWith('feature_') && metadata?.feature) {
      const { data: currentData } = await supabase
        .from('user_ab_tests')
        .select('features_used')
        .eq('user_id', userId)
        .eq('test_group_id', testId)
        .single();

      if (currentData) {
        const featuresUsed = currentData.features_used || [];
        if (!featuresUsed.includes(metadata.feature)) {
          featuresUsed.push(metadata.feature);
          updates.features_used = featuresUsed;
        }
      }
    }

    const { error } = await supabase
      .from('user_ab_tests')
      .update(updates)
      .eq('user_id', userId)
      .eq('test_group_id', testId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'A/B test event tracked successfully', action });
  } catch (error) {
    handleError(error, res);
  }
});

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

// Record wake up event (comprehensive tracking)
router.post('/wake-up-event', async (req: Request, res: Response) => {
  try {
    const { userId, alarmTime, actualWakeTime, timestamp } = req.body;

    if (!userId || !alarmTime || !actualWakeTime) {
      return res.status(400).json({ error: 'User ID, alarm time, and actual wake time are required' });
    }

    // Calculate if wake up was on time (within 10 minutes)
    const alarmDate = new Date(alarmTime);
    const wakeDate = new Date(actualWakeTime);
    const timeDiff = Math.abs(wakeDate.getTime() - alarmDate.getTime()) / (1000 * 60); // minutes
    const onTime = timeDiff <= 10;

    // Get current streak
    const { data: userData } = await supabase
      .from('users')
      .select('current_streak, longest_streak')
      .eq('id', userId)
      .single();

    let newStreak = 0;
    let streakUpdated = false;
    const achievementsUnlocked = [];

    if (onTime) {
      newStreak = (userData?.current_streak || 0) + 1;
      streakUpdated = true;

      // Update user streak
      await supabase
        .from('users')
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, userData?.longest_streak || 0),
          last_wake_up_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', userId);

      // Check for achievement unlocks
      const milestoneAchievements = [
        { days: 3, type: 'early_bird' },
        { days: 7, type: 'consistent_riser' },
        { days: 14, type: 'morning_champion' },
        { days: 30, type: 'streak_warrior' },
        { days: 50, type: 'habit_master' },
        { days: 100, type: 'month_perfectionist' },
      ];

      for (const milestone of milestoneAchievements) {
        if (newStreak === milestone.days) {
          // Try to unlock achievement (will check if already exists)
          try {
            const achievementResponse = await fetch(
              `${req.protocol}://${req.get('host')}/api/struggling-sam/achievements/unlock`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId,
                  achievementType: milestone.type,
                  progress: { current: milestone.days, target: milestone.days },
                }),
              }
            );

            if (achievementResponse.ok) {
              const achievement = await achievementResponse.json();
              achievementsUnlocked.push(achievement);
            }
          } catch (error) {
            console.error('Failed to unlock achievement:', error);
          }
        }
      }

      // Add to realtime activity
      await supabase
        .from('realtime_activity')
        .insert({
          activity_type: 'streak_started',
          message: `Someone reached a ${newStreak}-day streak! 🔥`,
          anonymous: true,
        });
    } else {
      // Reset streak
      await supabase
        .from('users')
        .update({
          current_streak: 0,
          last_wake_up_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', userId);
    }

    // Update community stats
    await updateCommunityStats();

    res.json({
      streakUpdated,
      newStreak,
      achievementsUnlocked,
      celebrationTriggered: achievementsUnlocked.length > 0 || (newStreak > 0 && [3, 7, 14, 30, 50, 100].includes(newStreak)),
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Get dashboard data (all Struggling Sam data for a user)
router.get('/dashboard/:userId', validateUserId, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Fetch all data in parallel
    const [
      streakResponse,
      achievementsResponse,
      challengesResponse,
      communityStatsResponse,
      socialProofResponse,
      upgradePromptsResponse,
      celebrationsResponse,
    ] = await Promise.allSettled([
      fetch(`${req.protocol}://${req.get('host')}/api/struggling-sam/streak/${userId}`),
      fetch(`${req.protocol}://${req.get('host')}/api/struggling-sam/achievements/${userId}`),
      fetch(`${req.protocol}://${req.get('host')}/api/struggling-sam/challenges/user/${userId}`),
      fetch(`${req.protocol}://${req.get('host')}/api/struggling-sam/community/stats`),
      fetch(`${req.protocol}://${req.get('host')}/api/struggling-sam/social-proof?segment=struggling_sam`),
      fetch(`${req.protocol}://${req.get('host')}/api/struggling-sam/upgrade-prompts/${userId}`),
      supabase
        .from('habit_celebrations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_shown', false),
    ]);

    const dashboardData = {
      userStreak: null,
      achievements: [],
      activeChallenges: [],
      communityStats: null,
      socialProofData: [],
      upgradePrompts: [],
      pendingCelebrations: [],
    };

    // Process responses
    if (streakResponse.status === 'fulfilled' && streakResponse.value.ok) {
      dashboardData.userStreak = await streakResponse.value.json();
    }

    if (achievementsResponse.status === 'fulfilled' && achievementsResponse.value.ok) {
      dashboardData.achievements = await achievementsResponse.value.json();
    }

    if (challengesResponse.status === 'fulfilled' && challengesResponse.value.ok) {
      dashboardData.activeChallenges = await challengesResponse.value.json();
    }

    if (communityStatsResponse.status === 'fulfilled' && communityStatsResponse.value.ok) {
      dashboardData.communityStats = await communityStatsResponse.value.json();
    }

    if (socialProofResponse.status === 'fulfilled' && socialProofResponse.value.ok) {
      dashboardData.socialProofData = await socialProofResponse.value.json();
    }

    if (upgradePromptsResponse.status === 'fulfilled' && upgradePromptsResponse.value.ok) {
      dashboardData.upgradePrompts = await upgradePromptsResponse.value.json();
    }

    if (celebrationsResponse.status === 'fulfilled' && !celebrationsResponse.value.error) {
      dashboardData.pendingCelebrations = celebrationsResponse.value.data || [];
    }

    res.json(dashboardData);
  } catch (error) {
    handleError(error, res);
  }
});

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'struggling-sam-api',
    version: '1.0.0',
  });
});

export default router;