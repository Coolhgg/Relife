-- Migration 002: Create Indexes and Performance Optimizations
-- Description: Adds indexes and constraints for optimal query performance
-- Dependencies: 001_create_emotional_tables.sql
-- Version: 1.0.0

BEGIN;

-- User Emotional States Indexes
CREATE INDEX idx_user_emotional_states_user_id ON user_emotional_states(user_id);
CREATE INDEX idx_user_emotional_states_emotion_type ON user_emotional_states(emotion_type);
CREATE INDEX idx_user_emotional_states_created_at ON user_emotional_states(created_at DESC);
CREATE INDEX idx_user_emotional_states_analyzed_at ON user_emotional_states(analyzed_at DESC);
CREATE INDEX idx_user_emotional_states_confidence ON user_emotional_states(confidence DESC);
CREATE INDEX idx_user_emotional_states_context ON user_emotional_states USING GIN(context);
CREATE INDEX idx_user_emotional_states_triggers ON user_emotional_states USING GIN(triggers);

-- Composite indexes for common queries
CREATE INDEX idx_user_emotional_states_user_emotion ON user_emotional_states(user_id, emotion_type);
CREATE INDEX idx_user_emotional_states_user_recent ON user_emotional_states(user_id, created_at DESC);

-- Emotional Messages Indexes
CREATE INDEX idx_emotional_messages_emotion_tone ON emotional_messages(emotion_type, tone);
CREATE INDEX idx_emotional_messages_effectiveness ON emotional_messages(effectiveness_score DESC);
CREATE INDEX idx_emotional_messages_usage_count ON emotional_messages(usage_count DESC);
CREATE INDEX idx_emotional_messages_success_rate ON emotional_messages((success_count::decimal / NULLIF(usage_count, 0)) DESC);
CREATE INDEX idx_emotional_messages_tags ON emotional_messages USING GIN(tags);
CREATE INDEX idx_emotional_messages_active ON emotional_messages(is_active) WHERE is_active = true;
CREATE INDEX idx_emotional_messages_template_search ON emotional_messages USING GIN(to_tsvector('english', template));

-- Emotional Notification Logs Indexes (Most Critical for Performance)
CREATE INDEX idx_emotional_logs_user_id ON emotional_notification_logs(user_id);
CREATE INDEX idx_emotional_logs_sent_at ON emotional_notification_logs(sent_at DESC);
CREATE INDEX idx_emotional_logs_scheduled_for ON emotional_notification_logs(scheduled_for);
CREATE INDEX idx_emotional_logs_emotion_type ON emotional_notification_logs(emotion_type);
CREATE INDEX idx_emotional_logs_tone ON emotional_notification_logs(tone);
CREATE INDEX idx_emotional_logs_action_taken ON emotional_notification_logs(action_taken);
CREATE INDEX idx_emotional_logs_effectiveness ON emotional_notification_logs(effectiveness_rating DESC);
CREATE INDEX idx_emotional_logs_delivery_status ON emotional_notification_logs(delivery_status);
CREATE INDEX idx_emotional_logs_platform ON emotional_notification_logs(platform);
CREATE INDEX idx_emotional_logs_experiment ON emotional_notification_logs(experiment_id) WHERE experiment_id IS NOT NULL;

-- Composite indexes for analytics queries
CREATE INDEX idx_emotional_logs_user_date ON emotional_notification_logs(user_id, sent_at DESC);
CREATE INDEX idx_emotional_logs_emotion_date ON emotional_notification_logs(emotion_type, sent_at DESC);
CREATE INDEX idx_emotional_logs_user_emotion ON emotional_notification_logs(user_id, emotion_type);
CREATE INDEX idx_emotional_logs_effectiveness_rating ON emotional_notification_logs(user_id, effectiveness_rating) WHERE effectiveness_rating IS NOT NULL;

-- User Emotional Profiles Indexes
CREATE UNIQUE INDEX idx_user_emotional_profiles_user_id ON user_emotional_profiles(user_id);
CREATE INDEX idx_user_emotional_profiles_effectiveness ON user_emotional_profiles(average_effectiveness_rating DESC);
CREATE INDEX idx_user_emotional_profiles_last_analyzed ON user_emotional_profiles(last_analyzed_at DESC);
CREATE INDEX idx_user_emotional_profiles_confidence ON user_emotional_profiles(confidence_score DESC);

-- Emotional Notification Schedule Indexes
CREATE INDEX idx_emotional_schedule_user_id ON emotional_notification_schedule(user_id);
CREATE INDEX idx_emotional_schedule_scheduled_for ON emotional_notification_schedule(scheduled_for);
CREATE INDEX idx_emotional_schedule_status ON emotional_notification_schedule(status);
CREATE INDEX idx_emotional_schedule_priority ON emotional_notification_schedule(priority DESC, scheduled_for);
CREATE INDEX idx_emotional_schedule_pending ON emotional_notification_schedule(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_emotional_schedule_retry ON emotional_notification_schedule(last_attempt_at, attempts) WHERE status = 'failed' AND attempts < max_attempts;

-- Emotional Analytics Events Indexes
CREATE INDEX idx_emotional_events_user_id ON emotional_analytics_events(user_id);
CREATE INDEX idx_emotional_events_type ON emotional_analytics_events(event_type);
CREATE INDEX idx_emotional_events_timestamp ON emotional_analytics_events(event_timestamp DESC);
CREATE INDEX idx_emotional_events_notification_id ON emotional_analytics_events(notification_log_id);
CREATE INDEX idx_emotional_events_session ON emotional_analytics_events(session_id);
CREATE INDEX idx_emotional_events_platform ON emotional_analytics_events(platform);

-- Composite indexes for event analytics
CREATE INDEX idx_emotional_events_user_type_time ON emotional_analytics_events(user_id, event_type, event_timestamp DESC);
CREATE INDEX idx_emotional_events_emotion_time ON emotional_analytics_events(emotion_type, event_timestamp DESC) WHERE emotion_type IS NOT NULL;

-- Emotional A/B Experiments Indexes
CREATE INDEX idx_emotional_experiments_status ON emotional_ab_experiments(status);
CREATE INDEX idx_emotional_experiments_active ON emotional_ab_experiments(start_date, end_date) WHERE status = 'active';
CREATE INDEX idx_emotional_experiments_date_range ON emotional_ab_experiments(start_date, end_date);

-- Partial indexes for better performance on common queries
CREATE INDEX idx_emotional_logs_opened ON emotional_notification_logs(user_id, opened_at) WHERE notification_opened = true;
CREATE INDEX idx_emotional_logs_completed ON emotional_notification_logs(user_id, action_taken_at) WHERE action_taken = 'completed_task';
CREATE INDEX idx_emotional_logs_recent_week ON emotional_notification_logs(user_id, sent_at) WHERE sent_at >= CURRENT_DATE - INTERVAL '7 days';

-- Text search indexes for content
CREATE INDEX idx_emotional_messages_content_search ON emotional_messages USING GIN(to_tsvector('english', template || ' ' || COALESCE(array_to_string(tags, ' '), '')));
CREATE INDEX idx_emotional_logs_feedback_search ON emotional_notification_logs USING GIN(to_tsvector('english', user_feedback)) WHERE user_feedback IS NOT NULL;

-- Statistics updates for better query planning
-- These will be run automatically but can be manually triggered
-- ANALYZE user_emotional_states;
-- ANALYZE emotional_messages;  
-- ANALYZE emotional_notification_logs;
-- ANALYZE user_emotional_profiles;

COMMIT;