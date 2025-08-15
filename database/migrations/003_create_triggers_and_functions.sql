-- Migration 003: Create Triggers and Functions
-- Description: Automated effectiveness updates and user profile learning
-- Dependencies: 001_create_emotional_tables.sql, 002_create_indexes_and_constraints.sql
-- Version: 1.0.0

BEGIN;

-- Function to update message effectiveness automatically
CREATE OR REPLACE FUNCTION update_message_effectiveness()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if effectiveness_rating is provided and action was taken
    IF NEW.effectiveness_rating IS NOT NULL AND NEW.action_taken IS NOT NULL THEN
        UPDATE emotional_messages 
        SET 
            usage_count = usage_count + 1,
            success_count = success_count + CASE 
                WHEN NEW.effectiveness_rating >= 4 AND NEW.action_taken IN ('completed_task', 'opened_app') 
                THEN 1 
                ELSE 0 
            END,
            effectiveness_score = (
                (success_count + CASE 
                    WHEN NEW.effectiveness_rating >= 4 AND NEW.action_taken IN ('completed_task', 'opened_app') 
                    THEN 1 
                    ELSE 0 
                END)::decimal / 
                (usage_count + 1)::decimal
            ) * 100,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.message_id AND NEW.message_id IS NOT NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user emotional profile learning
CREATE OR REPLACE FUNCTION update_user_emotional_profile()
RETURNS TRIGGER AS $$
DECLARE
    profile_exists BOOLEAN;
    effectiveness_avg DECIMAL(3,2);
    optimal_times TIME[];
    successful_tones emotional_tone[];
    effective_emotions emotion_type[];
BEGIN
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM user_emotional_profiles WHERE user_id = NEW.user_id) INTO profile_exists;
    
    -- Calculate average effectiveness for this user
    SELECT AVG(effectiveness_rating) 
    INTO effectiveness_avg
    FROM emotional_notification_logs 
    WHERE user_id = NEW.user_id AND effectiveness_rating IS NOT NULL;
    
    -- Find optimal send times (hours with >3.5 avg rating)
    SELECT ARRAY_AGG(DISTINCT EXTRACT(HOUR FROM sent_at)::TIME)
    INTO optimal_times
    FROM emotional_notification_logs
    WHERE user_id = NEW.user_id 
      AND effectiveness_rating >= 4
      AND sent_at IS NOT NULL;
    
    -- Find most successful tones (>3.5 avg rating, min 3 uses)
    SELECT ARRAY_AGG(DISTINCT tone)
    INTO successful_tones
    FROM (
        SELECT tone, AVG(effectiveness_rating) as avg_rating, COUNT(*) as usage_count
        FROM emotional_notification_logs
        WHERE user_id = NEW.user_id AND effectiveness_rating IS NOT NULL
        GROUP BY tone
        HAVING AVG(effectiveness_rating) >= 3.5 AND COUNT(*) >= 3
    ) successful;
    
    -- Find most effective emotions
    SELECT ARRAY_AGG(DISTINCT emotion_type)
    INTO effective_emotions
    FROM (
        SELECT emotion_type, AVG(effectiveness_rating) as avg_rating, COUNT(*) as usage_count
        FROM emotional_notification_logs
        WHERE user_id = NEW.user_id AND effectiveness_rating IS NOT NULL
        GROUP BY emotion_type
        HAVING AVG(effectiveness_rating) >= 3.5 AND COUNT(*) >= 3
    ) effective;
    
    -- Upsert user profile
    INSERT INTO user_emotional_profiles (
        user_id,
        preferred_tones,
        most_effective_emotions,
        optimal_send_times,
        average_effectiveness_rating,
        total_notifications_sent,
        total_notifications_opened,
        total_tasks_completed,
        confidence_score,
        data_points_collected,
        last_analyzed_at,
        updated_at
    )
    VALUES (
        NEW.user_id,
        COALESCE(successful_tones, '{encouraging}'),
        COALESCE(effective_emotions, '{}'),
        COALESCE(optimal_times, '{}'),
        COALESCE(effectiveness_avg, 0.0),
        1,
        CASE WHEN NEW.notification_opened THEN 1 ELSE 0 END,
        CASE WHEN NEW.action_taken = 'completed_task' THEN 1 ELSE 0 END,
        CASE WHEN effectiveness_avg IS NOT NULL THEN LEAST(effectiveness_avg / 5.0, 1.0) ELSE 0.5 END,
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        preferred_tones = EXCLUDED.preferred_tones,
        most_effective_emotions = EXCLUDED.most_effective_emotions,
        optimal_send_times = EXCLUDED.optimal_send_times,
        average_effectiveness_rating = EXCLUDED.average_effectiveness_rating,
        total_notifications_sent = user_emotional_profiles.total_notifications_sent + 1,
        total_notifications_opened = user_emotional_profiles.total_notifications_opened + 
            CASE WHEN NEW.notification_opened THEN 1 ELSE 0 END,
        total_tasks_completed = user_emotional_profiles.total_tasks_completed + 
            CASE WHEN NEW.action_taken = 'completed_task' THEN 1 ELSE 0 END,
        confidence_score = CASE 
            WHEN EXCLUDED.average_effectiveness_rating > 0 
            THEN LEAST(EXCLUDED.average_effectiveness_rating / 5.0, 1.0) 
            ELSE user_emotional_profiles.confidence_score 
        END,
        data_points_collected = user_emotional_profiles.data_points_collected + 1,
        last_analyzed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user response time
CREATE OR REPLACE FUNCTION calculate_response_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate response time if both sent_at and action_taken_at exist
    IF NEW.sent_at IS NOT NULL AND NEW.action_taken_at IS NOT NULL THEN
        NEW.response_time_ms := EXTRACT(EPOCH FROM (NEW.action_taken_at - NEW.sent_at)) * 1000;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update notification schedule status
CREATE OR REPLACE FUNCTION update_schedule_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update corresponding schedule entry when notification is sent
    IF NEW.delivery_status IN ('sent', 'delivered') AND OLD.delivery_status = 'pending' THEN
        UPDATE emotional_notification_schedule
        SET 
            status = NEW.delivery_status,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.user_id 
          AND scheduled_for = NEW.scheduled_for
          AND status = 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-archive old emotional states
CREATE OR REPLACE FUNCTION archive_old_emotional_states()
RETURNS void AS $$
BEGIN
    -- Delete emotional states older than 90 days to maintain performance
    DELETE FROM user_emotional_states 
    WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
    
    -- Log the archival
    INSERT INTO emotional_analytics_events (event_type, event_data, event_timestamp)
    VALUES ('emotional_states_archived', jsonb_build_object(
        'archived_at', CURRENT_TIMESTAMP,
        'retention_days', 90
    ), CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup failed notification attempts
CREATE OR REPLACE FUNCTION cleanup_failed_notifications()
RETURNS void AS $$
BEGIN
    -- Mark notifications as failed if max attempts reached
    UPDATE emotional_notification_schedule
    SET 
        status = 'failed',
        updated_at = CURRENT_TIMESTAMP
    WHERE status = 'pending' 
      AND attempts >= max_attempts
      AND last_attempt_at < CURRENT_TIMESTAMP - INTERVAL '1 hour';
      
    -- Archive old failed notifications (30 days)
    DELETE FROM emotional_notification_schedule
    WHERE status = 'failed'
      AND updated_at < CURRENT_DATE - INTERVAL '30 days';
      
    -- Archive old completed notifications (7 days)  
    DELETE FROM emotional_notification_schedule
    WHERE status IN ('sent', 'delivered')
      AND updated_at < CURRENT_DATE - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Function to update A/B experiment results
CREATE OR REPLACE FUNCTION update_ab_experiment_results()
RETURNS TRIGGER AS $$
DECLARE
    experiment_data JSONB;
    variant_performance JSONB;
BEGIN
    -- Only process if this is part of an A/B experiment
    IF NEW.experiment_id IS NOT NULL THEN
        -- Aggregate performance by variant
        SELECT jsonb_object_agg(
            experiment_variant,
            jsonb_build_object(
                'total_sent', COUNT(*),
                'total_opened', SUM(CASE WHEN notification_opened THEN 1 ELSE 0 END),
                'total_completed', SUM(CASE WHEN action_taken = 'completed_task' THEN 1 ELSE 0 END),
                'avg_effectiveness', AVG(effectiveness_rating),
                'open_rate', (SUM(CASE WHEN notification_opened THEN 1 ELSE 0 END)::decimal / COUNT(*)) * 100,
                'completion_rate', (SUM(CASE WHEN action_taken = 'completed_task' THEN 1 ELSE 0 END)::decimal / COUNT(*)) * 100
            )
        )
        INTO variant_performance
        FROM emotional_notification_logs
        WHERE experiment_id = NEW.experiment_id;
        
        -- Update experiment results
        UPDATE emotional_ab_experiments
        SET 
            results = jsonb_build_object(
                'variant_performance', variant_performance,
                'last_updated', CURRENT_TIMESTAMP,
                'total_participants', (
                    SELECT COUNT(DISTINCT user_id) 
                    FROM emotional_notification_logs 
                    WHERE experiment_id = NEW.experiment_id
                )
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE name = NEW.experiment_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers

-- Trigger for message effectiveness updates
DROP TRIGGER IF EXISTS trigger_update_message_effectiveness ON emotional_notification_logs;
CREATE TRIGGER trigger_update_message_effectiveness
    AFTER UPDATE OF effectiveness_rating ON emotional_notification_logs
    FOR EACH ROW
    WHEN (NEW.effectiveness_rating IS DISTINCT FROM OLD.effectiveness_rating)
    EXECUTE FUNCTION update_message_effectiveness();

-- Trigger for user profile learning
DROP TRIGGER IF EXISTS trigger_update_user_profile ON emotional_notification_logs;
CREATE TRIGGER trigger_update_user_profile
    AFTER INSERT OR UPDATE ON emotional_notification_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_user_emotional_profile();

-- Trigger for response time calculation
DROP TRIGGER IF EXISTS trigger_calculate_response_time ON emotional_notification_logs;
CREATE TRIGGER trigger_calculate_response_time
    BEFORE INSERT OR UPDATE ON emotional_notification_logs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_response_time();

-- Trigger for schedule status updates
DROP TRIGGER IF EXISTS trigger_update_schedule_status ON emotional_notification_logs;
CREATE TRIGGER trigger_update_schedule_status
    AFTER UPDATE OF delivery_status ON emotional_notification_logs
    FOR EACH ROW
    WHEN (NEW.delivery_status IS DISTINCT FROM OLD.delivery_status)
    EXECUTE FUNCTION update_schedule_status();

-- Trigger for A/B experiment results
DROP TRIGGER IF EXISTS trigger_update_ab_results ON emotional_notification_logs;
CREATE TRIGGER trigger_update_ab_results
    AFTER INSERT OR UPDATE ON emotional_notification_logs
    FOR EACH ROW
    WHEN (NEW.experiment_id IS NOT NULL)
    EXECUTE FUNCTION update_ab_experiment_results();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS trigger_updated_at_emotional_messages ON emotional_messages;
CREATE TRIGGER trigger_updated_at_emotional_messages
    BEFORE UPDATE ON emotional_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_updated_at_user_profiles ON user_emotional_profiles;  
CREATE TRIGGER trigger_updated_at_user_profiles
    BEFORE UPDATE ON user_emotional_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_updated_at_schedule ON emotional_notification_schedule;
CREATE TRIGGER trigger_updated_at_schedule
    BEFORE UPDATE ON emotional_notification_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_updated_at_experiments ON emotional_ab_experiments;
CREATE TRIGGER trigger_updated_at_experiments
    BEFORE UPDATE ON emotional_ab_experiments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create scheduled job functions (PostgreSQL with pg_cron extension)
-- Note: Requires pg_cron extension for automated execution

-- Daily cleanup job
CREATE OR REPLACE FUNCTION run_daily_emotional_cleanup()
RETURNS void AS $$
BEGIN
    PERFORM archive_old_emotional_states();
    PERFORM cleanup_failed_notifications();
    
    -- Log cleanup completion
    INSERT INTO emotional_analytics_events (event_type, event_data, event_timestamp)
    VALUES ('daily_cleanup_completed', jsonb_build_object(
        'completed_at', CURRENT_TIMESTAMP,
        'cleanup_type', 'automated'
    ), CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- Update statistics for better query performance
CREATE OR REPLACE FUNCTION update_emotional_statistics()
RETURNS void AS $$
BEGIN
    ANALYZE user_emotional_states;
    ANALYZE emotional_messages;
    ANALYZE emotional_notification_logs;
    ANALYZE user_emotional_profiles;
    ANALYZE emotional_notification_schedule;
    ANALYZE emotional_analytics_events;
    ANALYZE emotional_ab_experiments;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_message_effectiveness() TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_emotional_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_response_time() TO authenticated;
GRANT EXECUTE ON FUNCTION update_schedule_status() TO authenticated;
GRANT EXECUTE ON FUNCTION update_ab_experiment_results() TO authenticated;
GRANT EXECUTE ON FUNCTION run_daily_emotional_cleanup() TO authenticated;
GRANT EXECUTE ON FUNCTION update_emotional_statistics() TO authenticated;

-- Add function comments for documentation
COMMENT ON FUNCTION update_message_effectiveness() IS 'Automatically updates message effectiveness scores based on user ratings and actions';
COMMENT ON FUNCTION update_user_emotional_profile() IS 'Learns and updates user preferences based on notification responses';
COMMENT ON FUNCTION calculate_response_time() IS 'Calculates response time between notification send and user action';
COMMENT ON FUNCTION update_schedule_status() IS 'Updates scheduled notification status based on delivery status';
COMMENT ON FUNCTION archive_old_emotional_states() IS 'Archives emotional states older than 90 days for performance';
COMMENT ON FUNCTION cleanup_failed_notifications() IS 'Cleans up failed and old notification attempts';
COMMENT ON FUNCTION run_daily_emotional_cleanup() IS 'Runs daily maintenance tasks for emotional intelligence system';
COMMENT ON FUNCTION update_emotional_statistics() IS 'Updates table statistics for optimal query performance';

COMMIT;