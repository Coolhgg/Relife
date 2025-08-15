-- Migration 001: Create Emotional Intelligence Core Tables
-- Description: Creates the foundational tables for emotional notification system
-- Dependencies: Requires existing users table with id column
-- Version: 1.0.0
-- Date: 2024-01-01

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- Create enum types for better data integrity
CREATE TYPE emotion_type AS ENUM ('happy', 'sad', 'worried', 'excited', 'lonely', 'proud', 'sleepy');
CREATE TYPE emotional_tone AS ENUM ('encouraging', 'playful', 'firm', 'roast');
CREATE TYPE escalation_level AS ENUM ('gentle', 'slightly_emotional', 'strong_emotional', 'social_pressure', 'major_reset');
CREATE TYPE notification_action AS ENUM ('dismissed', 'snoozed', 'opened_app', 'completed_task', 'none');
CREATE TYPE delivery_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'cancelled');

-- User Emotional States Table
-- Tracks analyzed emotional states over time
CREATE TABLE user_emotional_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emotion_type emotion_type NOT NULL,
    intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    
    -- Context data from behavioral analysis
    context JSONB NOT NULL DEFAULT '{}',
    triggers TEXT[] DEFAULT '{}',
    recommended_tone emotional_tone NOT NULL,
    
    -- Metadata
    analysis_version VARCHAR(10) DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emotional Message Templates Table
-- Library of message templates with effectiveness tracking
CREATE TABLE emotional_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emotion_type emotion_type NOT NULL,
    tone emotional_tone NOT NULL,
    
    -- Template content
    template TEXT NOT NULL,
    variables JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    -- Effectiveness metrics
    effectiveness_score DECIMAL(5,2) DEFAULT 0.0 CHECK (effectiveness_score >= 0.0),
    usage_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emotional Notification Logs Table
-- Comprehensive tracking of sent notifications and responses
CREATE TABLE emotional_notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES emotional_messages(id) ON DELETE SET NULL,
    emotional_state_id UUID REFERENCES user_emotional_states(id) ON DELETE SET NULL,
    
    -- Notification content
    emotion_type emotion_type NOT NULL,
    tone emotional_tone NOT NULL,
    message_sent TEXT NOT NULL,
    escalation_level escalation_level NOT NULL,
    
    -- Scheduling and delivery
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_status delivery_status DEFAULT 'pending',
    
    -- User interaction tracking
    notification_opened BOOLEAN DEFAULT FALSE,
    opened_at TIMESTAMP WITH TIME ZONE,
    action_taken notification_action,
    action_taken_at TIMESTAMP WITH TIME ZONE,
    response_time_ms INTEGER,
    
    -- Effectiveness feedback
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    user_feedback TEXT,
    
    -- Technical metadata
    platform VARCHAR(20), -- 'ios', 'android', 'web'
    notification_id VARCHAR(255), -- Platform-specific notification ID
    deep_link TEXT,
    large_image_url TEXT,
    sound_file VARCHAR(100),
    vibration_pattern INTEGER[],
    
    -- Analytics metadata
    experiment_id VARCHAR(100), -- For A/B testing
    experiment_variant VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Emotional Profiles Table
-- Learned preferences and behavioral patterns
CREATE TABLE user_emotional_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Learned preferences
    preferred_tones emotional_tone[] DEFAULT '{encouraging}',
    avoided_tones emotional_tone[] DEFAULT '{}',
    most_effective_emotions emotion_type[] DEFAULT '{}',
    least_effective_emotions emotion_type[] DEFAULT '{}',
    
    -- Behavioral patterns
    optimal_send_times TIME[], -- Best hours to send notifications
    timezone VARCHAR(50),
    average_response_time_ms INTEGER DEFAULT 300000,
    preferred_escalation_speed VARCHAR(10) DEFAULT 'medium',
    
    -- Effectiveness metrics  
    total_notifications_sent INTEGER DEFAULT 0,
    total_notifications_opened INTEGER DEFAULT 0,
    total_tasks_completed INTEGER DEFAULT 0,
    average_effectiveness_rating DECIMAL(3,2) DEFAULT 0.0,
    
    -- Learning metadata
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    data_points_collected INTEGER DEFAULT 0,
    last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emotional Notification Schedule Table
-- Queue for scheduled notifications
CREATE TABLE emotional_notification_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Scheduling details
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone VARCHAR(50),
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    
    -- Notification content
    emotion_type emotion_type NOT NULL,
    tone emotional_tone NOT NULL,
    escalation_level escalation_level NOT NULL,
    template_id UUID REFERENCES emotional_messages(id) ON DELETE SET NULL,
    
    -- Status tracking
    status delivery_status DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    
    -- Full payload for delivery
    notification_payload JSONB NOT NULL,
    
    -- Metadata
    created_by_system BOOLEAN DEFAULT TRUE,
    experiment_id VARCHAR(100),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emotional Analytics Events Table
-- Granular event tracking for analytics
CREATE TABLE emotional_analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_log_id UUID REFERENCES emotional_notification_logs(id) ON DELETE SET NULL,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- 'generated', 'sent', 'opened', 'clicked', 'completed', etc.
    event_data JSONB DEFAULT '{}',
    
    -- Context
    emotion_type emotion_type,
    tone emotional_tone,
    platform VARCHAR(20),
    user_agent TEXT,
    
    -- Timing
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    client_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Session tracking
    session_id VARCHAR(100),
    page_url TEXT,
    referrer TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emotional A/B Test Experiments Table
-- Track A/B testing experiments
CREATE TABLE emotional_ab_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Experiment configuration
    control_variant JSONB NOT NULL,
    treatment_variants JSONB NOT NULL, -- Array of variant configurations
    traffic_allocation DECIMAL(3,2) DEFAULT 0.1, -- Percentage of users in experiment
    
    -- Targeting
    target_emotions emotion_type[],
    target_tones emotional_tone[],
    target_user_segments TEXT[],
    
    -- Status and timing
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed', 'archived'
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Results
    primary_metric VARCHAR(50), -- 'open_rate', 'completion_rate', 'effectiveness_rating'
    success_criteria JSONB,
    results JSONB,
    
    -- Metadata
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraints
ALTER TABLE user_emotional_profiles ADD CONSTRAINT unique_user_emotional_profile UNIQUE (user_id);

-- Add comments for documentation
COMMENT ON TABLE user_emotional_states IS 'Tracks analyzed emotional states of users based on behavioral patterns';
COMMENT ON TABLE emotional_messages IS 'Template library for emotional messages with effectiveness tracking';
COMMENT ON TABLE emotional_notification_logs IS 'Comprehensive log of all emotional notifications sent and user responses';
COMMENT ON TABLE user_emotional_profiles IS 'Learned preferences and behavioral patterns for each user';
COMMENT ON TABLE emotional_notification_schedule IS 'Queue for scheduled emotional notifications';
COMMENT ON TABLE emotional_analytics_events IS 'Granular event tracking for analytics and optimization';
COMMENT ON TABLE emotional_ab_experiments IS 'A/B testing experiments for emotional notification optimization';

COMMIT;