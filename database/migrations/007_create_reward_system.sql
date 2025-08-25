-- Migration 007: Create Reward System Tables
-- Description: Creates tables for comprehensive reward system with achievements, gifts, and AI insights
-- Dependencies: Requires existing users table with id column
-- Version: 1.0.0
-- Date: 2024-01-15

BEGIN;

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types for reward system
CREATE TYPE reward_type AS ENUM ('achievement', 'milestone', 'streak', 'habit_boost', 'niche_mastery', 'social_share', 'gift_unlock');
CREATE TYPE reward_category AS ENUM ('consistency', 'early_riser', 'wellness', 'productivity', 'social', 'explorer', 'master', 'challenger');
CREATE TYPE reward_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');
CREATE TYPE gift_type AS ENUM ('theme', 'sound_pack', 'voice_personality', 'alarm_tone', 'background', 'icon_pack', 'premium_trial', 'feature_unlock');
CREATE TYPE user_niche AS ENUM ('fitness', 'work', 'study', 'creative', 'family', 'health', 'social', 'spiritual');
CREATE TYPE ai_insight_type AS ENUM ('improvement_suggestion', 'pattern_recognition', 'habit_analysis', 'optimization_tip', 'celebration');
CREATE TYPE insight_priority AS ENUM ('low', 'medium', 'high');

-- Rewards/Achievements Table
-- Master catalog of all available rewards and achievements
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type reward_type NOT NULL,
    category reward_category NOT NULL,
    rarity reward_rarity NOT NULL DEFAULT 'common',
    
    -- Core reward information
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100) DEFAULT '🏆',
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
    
    -- Unlock conditions (stored as JSONB for flexibility)
    unlock_conditions JSONB NOT NULL DEFAULT '{}',
    
    -- Progress tracking
    progress_target INTEGER DEFAULT NULL,
    progress_unit VARCHAR(50) DEFAULT NULL,
    
    -- Personalization
    personalized_message_template TEXT,
    ai_insight_template TEXT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Rewards Table
-- Tracks which rewards users have unlocked
CREATE TABLE user_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    
    -- Unlock details
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    points_earned INTEGER NOT NULL DEFAULT 0,
    
    -- Personalized content
    personalized_message TEXT,
    ai_insight TEXT,
    
    -- Progress tracking
    progress_current INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0.0 CHECK (progress_percentage >= 0.0 AND progress_percentage <= 100.0),
    
    -- Context when unlocked
    unlock_context JSONB DEFAULT '{}',
    
    -- Unique constraint to prevent duplicate rewards per user
    UNIQUE(user_id, reward_id)
);

-- Gift Catalog Table
-- Available gifts that can be earned or purchased
CREATE TABLE gift_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type gift_type NOT NULL,
    
    -- Gift information
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    preview_image VARCHAR(500),
    
    -- Cost and availability
    cost_points INTEGER DEFAULT 0 CHECK (cost_points >= 0),
    cost_premium_currency INTEGER DEFAULT 0 CHECK (cost_premium_currency >= 0),
    is_purchasable_with_points BOOLEAN DEFAULT true,
    is_purchasable_with_currency BOOLEAN DEFAULT false,
    
    -- Gift content (file paths, theme data, etc.)
    content_data JSONB NOT NULL DEFAULT '{}',
    
    -- Availability
    is_available BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    is_seasonal BOOLEAN DEFAULT false,
    available_from DATE DEFAULT NULL,
    available_until DATE DEFAULT NULL,
    
    -- Requirements
    required_level INTEGER DEFAULT 1 CHECK (required_level >= 1),
    required_achievements UUID[] DEFAULT '{}',
    required_subscription_tier VARCHAR(50) DEFAULT NULL,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Gift Inventory Table
-- Tracks gifts that users own
CREATE TABLE user_gift_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gift_id UUID NOT NULL REFERENCES gift_catalog(id) ON DELETE CASCADE,
    
    -- Acquisition details
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acquired_method VARCHAR(50) NOT NULL DEFAULT 'earned', -- earned, purchased_points, purchased_currency, gifted
    cost_paid INTEGER DEFAULT 0,
    
    -- Usage tracking
    is_equipped BOOLEAN DEFAULT false,
    first_used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    usage_count INTEGER DEFAULT 0,
    
    -- Metadata
    acquisition_context JSONB DEFAULT '{}',
    
    -- Unique constraint to prevent duplicate gifts per user
    UNIQUE(user_id, gift_id)
);

-- AI Insights Table
-- Stores AI-generated insights about user behavior and suggestions
CREATE TABLE user_ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Insight details
    type ai_insight_type NOT NULL,
    priority insight_priority NOT NULL DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    
    -- Actionability
    is_actionable BOOLEAN DEFAULT false,
    suggested_actions TEXT[] DEFAULT '{}',
    
    -- Analysis data
    analysis_data JSONB NOT NULL DEFAULT '{}',
    patterns_detected TEXT[] DEFAULT '{}',
    
    -- User interaction
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    user_feedback INTEGER DEFAULT NULL CHECK (user_feedback >= 1 AND user_feedback <= 5),
    user_feedback_text TEXT DEFAULT NULL,
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- User Habits Table
-- Tracks identified user habits and patterns
CREATE TABLE user_habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Habit identification
    pattern VARCHAR(100) NOT NULL, -- morning_routine, evening_routine, workout_time, etc.
    niche user_niche DEFAULT 'health',
    
    -- Habit metrics
    frequency INTEGER NOT NULL DEFAULT 0 CHECK (frequency >= 0), -- times per week
    consistency DECIMAL(3,2) NOT NULL DEFAULT 0.0 CHECK (consistency >= 0.0 AND consistency <= 1.0),
    improvement_trend DECIMAL(4,3) DEFAULT 0.0, -- positive for improving, negative for declining
    
    -- Analysis metadata
    analyzed_from TIMESTAMP WITH TIME ZONE NOT NULL,
    analyzed_to TIMESTAMP WITH TIME ZONE NOT NULL,
    analysis_confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (analysis_confidence >= 0.0 AND analysis_confidence <= 1.0),
    
    -- Habit context
    context_data JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Niche Profiles Table
-- Stores user niche identification and preferences
CREATE TABLE user_niche_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Primary niche identification
    primary_niche user_niche NOT NULL,
    secondary_niche user_niche DEFAULT NULL,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    
    -- User traits and preferences
    traits TEXT[] NOT NULL DEFAULT '{}',
    preferences JSONB NOT NULL DEFAULT '{}',
    
    -- Analysis metadata
    analysis_version VARCHAR(10) DEFAULT '1.0.0',
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one active profile per user
    UNIQUE(user_id)
);

-- User Reward Analytics Table
-- Aggregated analytics about user reward engagement
CREATE TABLE user_reward_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Core metrics
    total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
    current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level >= 1),
    current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
    
    -- Reward counts
    total_rewards_unlocked INTEGER NOT NULL DEFAULT 0 CHECK (total_rewards_unlocked >= 0),
    rewards_this_week INTEGER NOT NULL DEFAULT 0 CHECK (rewards_this_week >= 0),
    rewards_this_month INTEGER NOT NULL DEFAULT 0 CHECK (rewards_this_month >= 0),
    
    -- Gift metrics
    total_gifts_owned INTEGER NOT NULL DEFAULT 0 CHECK (total_gifts_owned >= 0),
    gifts_equipped INTEGER NOT NULL DEFAULT 0 CHECK (gifts_equipped >= 0),
    points_spent_on_gifts INTEGER NOT NULL DEFAULT 0 CHECK (points_spent_on_gifts >= 0),
    
    -- Engagement metrics
    insights_generated INTEGER NOT NULL DEFAULT 0 CHECK (insights_generated >= 0),
    insights_acted_upon INTEGER NOT NULL DEFAULT 0 CHECK (insights_acted_upon >= 0),
    avg_insight_rating DECIMAL(3,2) DEFAULT NULL CHECK (avg_insight_rating >= 1.0 AND avg_insight_rating <= 5.0),
    
    -- Timing
    last_reward_earned_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    last_analysis_run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Analytics metadata
    analysis_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    analysis_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one analytics record per user (updated in place)
    UNIQUE(user_id)
);

-- Create indexes for better performance

-- Rewards table indexes
CREATE INDEX idx_rewards_type ON rewards(type);
CREATE INDEX idx_rewards_category ON rewards(category);
CREATE INDEX idx_rewards_rarity ON rewards(rarity);
CREATE INDEX idx_rewards_active ON rewards(is_active) WHERE is_active = true;
CREATE INDEX idx_rewards_premium ON rewards(is_premium);
CREATE INDEX idx_rewards_points ON rewards(points);
CREATE INDEX idx_rewards_sort_order ON rewards(sort_order);

-- User rewards table indexes
CREATE INDEX idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX idx_user_rewards_reward_id ON user_rewards(reward_id);
CREATE INDEX idx_user_rewards_unlocked_at ON user_rewards(unlocked_at);
CREATE INDEX idx_user_rewards_points ON user_rewards(points_earned);

-- Gift catalog table indexes
CREATE INDEX idx_gift_catalog_type ON gift_catalog(type);
CREATE INDEX idx_gift_catalog_available ON gift_catalog(is_available) WHERE is_available = true;
CREATE INDEX idx_gift_catalog_premium ON gift_catalog(is_premium);
CREATE INDEX idx_gift_catalog_seasonal ON gift_catalog(is_seasonal);
CREATE INDEX idx_gift_catalog_cost_points ON gift_catalog(cost_points);
CREATE INDEX idx_gift_catalog_level ON gift_catalog(required_level);
CREATE INDEX idx_gift_catalog_sort_order ON gift_catalog(sort_order);

-- User gift inventory table indexes
CREATE INDEX idx_user_gift_inventory_user_id ON user_gift_inventory(user_id);
CREATE INDEX idx_user_gift_inventory_gift_id ON user_gift_inventory(gift_id);
CREATE INDEX idx_user_gift_inventory_acquired_at ON user_gift_inventory(acquired_at);
CREATE INDEX idx_user_gift_inventory_equipped ON user_gift_inventory(is_equipped) WHERE is_equipped = true;
CREATE INDEX idx_user_gift_inventory_method ON user_gift_inventory(acquired_method);

-- AI insights table indexes
CREATE INDEX idx_user_ai_insights_user_id ON user_ai_insights(user_id);
CREATE INDEX idx_user_ai_insights_type ON user_ai_insights(type);
CREATE INDEX idx_user_ai_insights_priority ON user_ai_insights(priority);
CREATE INDEX idx_user_ai_insights_created_at ON user_ai_insights(created_at);
CREATE INDEX idx_user_ai_insights_unread ON user_ai_insights(is_read) WHERE is_read = false;
CREATE INDEX idx_user_ai_insights_active ON user_ai_insights(is_dismissed) WHERE is_dismissed = false;
CREATE INDEX idx_user_ai_insights_actionable ON user_ai_insights(is_actionable) WHERE is_actionable = true;
CREATE INDEX idx_user_ai_insights_expires_at ON user_ai_insights(expires_at) WHERE expires_at IS NOT NULL;

-- User habits table indexes
CREATE INDEX idx_user_habits_user_id ON user_habits(user_id);
CREATE INDEX idx_user_habits_pattern ON user_habits(pattern);
CREATE INDEX idx_user_habits_niche ON user_habits(niche);
CREATE INDEX idx_user_habits_consistency ON user_habits(consistency);
CREATE INDEX idx_user_habits_analyzed_at ON user_habits(last_analyzed_at);

-- User niche profiles table indexes
CREATE INDEX idx_user_niche_profiles_user_id ON user_niche_profiles(user_id);
CREATE INDEX idx_user_niche_profiles_primary ON user_niche_profiles(primary_niche);
CREATE INDEX idx_user_niche_profiles_confidence ON user_niche_profiles(confidence);
CREATE INDEX idx_user_niche_profiles_updated_at ON user_niche_profiles(last_updated_at);

-- User reward analytics table indexes
CREATE INDEX idx_user_reward_analytics_user_id ON user_reward_analytics(user_id);
CREATE INDEX idx_user_reward_analytics_level ON user_reward_analytics(current_level);
CREATE INDEX idx_user_reward_analytics_points ON user_reward_analytics(total_points);
CREATE INDEX idx_user_reward_analytics_streak ON user_reward_analytics(current_streak);
CREATE INDEX idx_user_reward_analytics_last_reward ON user_reward_analytics(last_reward_earned_at);

-- Composite indexes for common queries
CREATE INDEX idx_rewards_category_rarity ON rewards(category, rarity);
CREATE INDEX idx_rewards_active_premium ON rewards(is_active, is_premium);
CREATE INDEX idx_user_rewards_user_unlocked ON user_rewards(user_id, unlocked_at);
CREATE INDEX idx_gift_catalog_available_premium ON gift_catalog(is_available, is_premium);
CREATE INDEX idx_user_insights_user_priority ON user_ai_insights(user_id, priority, created_at);
CREATE INDEX idx_user_habits_user_niche ON user_habits(user_id, niche);

-- Text search indexes
CREATE INDEX idx_rewards_title_search ON rewards USING gin(to_tsvector('english', title));
CREATE INDEX idx_rewards_description_search ON rewards USING gin(to_tsvector('english', description));
CREATE INDEX idx_gift_catalog_name_search ON gift_catalog USING gin(to_tsvector('english', name));
CREATE INDEX idx_gift_catalog_description_search ON gift_catalog USING gin(to_tsvector('english', description));

-- JSONB indexes for better performance on complex queries
CREATE INDEX idx_rewards_unlock_conditions ON rewards USING gin(unlock_conditions);
CREATE INDEX idx_user_rewards_context ON user_rewards USING gin(unlock_context);
CREATE INDEX idx_gift_catalog_content_data ON gift_catalog USING gin(content_data);
CREATE INDEX idx_user_insights_analysis_data ON user_ai_insights USING gin(analysis_data);
CREATE INDEX idx_user_habits_context_data ON user_habits USING gin(context_data);
CREATE INDEX idx_user_niche_preferences ON user_niche_profiles USING gin(preferences);

COMMIT;