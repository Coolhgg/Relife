-- Rollback Script: Emotional Intelligence System
-- Description: Safely removes all emotional intelligence tables, functions, and policies
-- Warning: This will permanently delete all emotional intelligence data!
-- Version: 1.0.0
-- Usage: Run this script to completely remove the emotional intelligence system

-- SAFETY WARNINGS AND CONFIRMATION
-- Uncomment the lines below to enable rollback (safety mechanism)
-- SET emotional_rollback_confirmed = true;
-- 
-- DO $$
-- BEGIN
--     IF current_setting('emotional_rollback_confirmed', true) != 'true' THEN
--         RAISE EXCEPTION 'Rollback not confirmed. Uncomment confirmation lines and set emotional_rollback_confirmed = true to proceed.';
--     END IF;
-- END $$;

BEGIN;

-- Log rollback start
INSERT INTO emotional_analytics_events (event_type, event_data, event_timestamp)
VALUES ('system_rollback_started', jsonb_build_object(
    'rollback_at', CURRENT_TIMESTAMP,
    'performed_by', auth.uid(),
    'reason', 'manual_rollback'
), CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING; -- In case the table is already dropped

-- Create backup of critical data before rollback (optional)
-- Uncomment if you want to backup data before rollback
/*
CREATE TABLE IF NOT EXISTS emotional_data_backup AS
SELECT 
    'user_profiles' as table_name,
    row_to_json(uep) as data,
    CURRENT_TIMESTAMP as backup_at
FROM user_emotional_profiles uep
UNION ALL
SELECT 
    'notification_logs' as table_name,
    row_to_json(enl) as data,
    CURRENT_TIMESTAMP as backup_at
FROM emotional_notification_logs enl
UNION ALL  
SELECT 
    'message_templates' as table_name,
    row_to_json(em) as data,
    CURRENT_TIMESTAMP as backup_at
FROM emotional_messages em
WHERE created_by IS NOT NULL; -- Only backup custom templates
*/

-- ========================================
-- STEP 1: DROP VIEWS (in dependency order)
-- ========================================

RAISE NOTICE 'Dropping analytics views...';

DROP VIEW IF EXISTS user_engagement_cohorts CASCADE;
DROP VIEW IF EXISTS daily_performance_trends CASCADE;
DROP VIEW IF EXISTS ab_experiment_analytics CASCADE;
DROP VIEW IF EXISTS message_template_performance CASCADE;
DROP VIEW IF EXISTS emotion_performance_analytics CASCADE;
DROP VIEW IF EXISTS user_emotional_analytics CASCADE;
DROP VIEW IF EXISTS emotional_overview_dashboard CASCADE;

-- ========================================
-- STEP 2: DROP TRIGGERS (before functions)
-- ========================================

RAISE NOTICE 'Dropping triggers...';

-- Drop table triggers
DROP TRIGGER IF EXISTS trigger_update_message_effectiveness ON emotional_notification_logs;
DROP TRIGGER IF EXISTS trigger_update_user_profile ON emotional_notification_logs;
DROP TRIGGER IF EXISTS trigger_calculate_response_time ON emotional_notification_logs;
DROP TRIGGER IF EXISTS trigger_update_schedule_status ON emotional_notification_logs;
DROP TRIGGER IF EXISTS trigger_update_ab_results ON emotional_notification_logs;

DROP TRIGGER IF EXISTS trigger_updated_at_emotional_messages ON emotional_messages;
DROP TRIGGER IF EXISTS trigger_updated_at_user_profiles ON user_emotional_profiles;
DROP TRIGGER IF EXISTS trigger_updated_at_schedule ON emotional_notification_schedule;
DROP TRIGGER IF EXISTS trigger_updated_at_experiments ON emotional_ab_experiments;

DROP TRIGGER IF EXISTS trigger_emotional_state_retention ON user_emotional_states;

-- Note: User cleanup trigger would be on users table, handle separately
-- DROP TRIGGER IF EXISTS trigger_cleanup_emotional_data ON users;

-- ========================================
-- STEP 3: DROP FUNCTIONS
-- ========================================

RAISE NOTICE 'Dropping functions...';

-- Core system functions
DROP FUNCTION IF EXISTS update_message_effectiveness() CASCADE;
DROP FUNCTION IF EXISTS update_user_emotional_profile() CASCADE;
DROP FUNCTION IF EXISTS calculate_response_time() CASCADE;
DROP FUNCTION IF EXISTS update_schedule_status() CASCADE;
DROP FUNCTION IF EXISTS update_ab_experiment_results() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Maintenance functions
DROP FUNCTION IF EXISTS archive_old_emotional_states() CASCADE;
DROP FUNCTION IF EXISTS cleanup_failed_notifications() CASCADE;
DROP FUNCTION IF EXISTS run_daily_emotional_cleanup() CASCADE;
DROP FUNCTION IF EXISTS update_emotional_statistics() CASCADE;

-- Security and helper functions
DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS can_access_user_data(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS can_access_analytics(UUID) CASCADE;
DROP FUNCTION IF EXISTS check_analytics_access() CASCADE;
DROP FUNCTION IF EXISTS cleanup_user_emotional_data() CASCADE;
DROP FUNCTION IF EXISTS enforce_emotional_state_retention() CASCADE;

-- ========================================
-- STEP 4: DROP INDEXES (explicit cleanup)
-- ========================================

RAISE NOTICE 'Dropping indexes...';

-- User Emotional States Indexes
DROP INDEX IF EXISTS idx_user_emotional_states_user_id;
DROP INDEX IF EXISTS idx_user_emotional_states_emotion_type;
DROP INDEX IF EXISTS idx_user_emotional_states_created_at;
DROP INDEX IF EXISTS idx_user_emotional_states_analyzed_at;
DROP INDEX IF EXISTS idx_user_emotional_states_confidence;
DROP INDEX IF EXISTS idx_user_emotional_states_context;
DROP INDEX IF EXISTS idx_user_emotional_states_triggers;
DROP INDEX IF EXISTS idx_user_emotional_states_user_emotion;
DROP INDEX IF EXISTS idx_user_emotional_states_user_recent;

-- Emotional Messages Indexes
DROP INDEX IF EXISTS idx_emotional_messages_emotion_tone;
DROP INDEX IF EXISTS idx_emotional_messages_effectiveness;
DROP INDEX IF EXISTS idx_emotional_messages_usage_count;
DROP INDEX IF EXISTS idx_emotional_messages_success_rate;
DROP INDEX IF EXISTS idx_emotional_messages_tags;
DROP INDEX IF EXISTS idx_emotional_messages_active;
DROP INDEX IF EXISTS idx_emotional_messages_template_search;
DROP INDEX IF EXISTS idx_emotional_messages_content_search;

-- Notification Logs Indexes
DROP INDEX IF EXISTS idx_emotional_logs_user_id;
DROP INDEX IF EXISTS idx_emotional_logs_sent_at;
DROP INDEX IF EXISTS idx_emotional_logs_scheduled_for;
DROP INDEX IF EXISTS idx_emotional_logs_emotion_type;
DROP INDEX IF EXISTS idx_emotional_logs_tone;
DROP INDEX IF EXISTS idx_emotional_logs_action_taken;
DROP INDEX IF EXISTS idx_emotional_logs_effectiveness;
DROP INDEX IF EXISTS idx_emotional_logs_delivery_status;
DROP INDEX IF EXISTS idx_emotional_logs_platform;
DROP INDEX IF EXISTS idx_emotional_logs_experiment;
DROP INDEX IF EXISTS idx_emotional_logs_user_date;
DROP INDEX IF EXISTS idx_emotional_logs_emotion_date;
DROP INDEX IF EXISTS idx_emotional_logs_user_emotion;
DROP INDEX IF EXISTS idx_emotional_logs_effectiveness_rating;
DROP INDEX IF EXISTS idx_emotional_logs_opened;
DROP INDEX IF EXISTS idx_emotional_logs_completed;
DROP INDEX IF EXISTS idx_emotional_logs_recent_week;
DROP INDEX IF EXISTS idx_emotional_logs_feedback_search;

-- User Profiles Indexes
DROP INDEX IF EXISTS idx_user_emotional_profiles_user_id;
DROP INDEX IF EXISTS idx_user_emotional_profiles_effectiveness;
DROP INDEX IF EXISTS idx_user_emotional_profiles_last_analyzed;
DROP INDEX IF EXISTS idx_user_emotional_profiles_confidence;

-- Schedule Indexes
DROP INDEX IF EXISTS idx_emotional_schedule_user_id;
DROP INDEX IF EXISTS idx_emotional_schedule_scheduled_for;
DROP INDEX IF EXISTS idx_emotional_schedule_status;
DROP INDEX IF EXISTS idx_emotional_schedule_priority;
DROP INDEX IF EXISTS idx_emotional_schedule_pending;
DROP INDEX IF EXISTS idx_emotional_schedule_retry;

-- Analytics Events Indexes
DROP INDEX IF EXISTS idx_emotional_events_user_id;
DROP INDEX IF EXISTS idx_emotional_events_type;
DROP INDEX IF EXISTS idx_emotional_events_timestamp;
DROP INDEX IF EXISTS idx_emotional_events_notification_id;
DROP INDEX IF EXISTS idx_emotional_events_session;
DROP INDEX IF EXISTS idx_emotional_events_platform;
DROP INDEX IF EXISTS idx_emotional_events_user_type_time;
DROP INDEX IF EXISTS idx_emotional_events_emotion_time;

-- Experiments Indexes  
DROP INDEX IF EXISTS idx_emotional_experiments_status;
DROP INDEX IF EXISTS idx_emotional_experiments_active;
DROP INDEX IF EXISTS idx_emotional_experiments_date_range;

-- ========================================
-- STEP 5: DROP TABLES (in dependency order)
-- ========================================

RAISE NOTICE 'Dropping tables...';

-- Tables with foreign key dependencies first
DROP TABLE IF EXISTS emotional_analytics_events CASCADE;
DROP TABLE IF EXISTS emotional_notification_schedule CASCADE;
DROP TABLE IF EXISTS emotional_notification_logs CASCADE;
DROP TABLE IF EXISTS user_emotional_states CASCADE;
DROP TABLE IF EXISTS user_emotional_profiles CASCADE;

-- Independent tables
DROP TABLE IF EXISTS emotional_ab_experiments CASCADE;
DROP TABLE IF EXISTS emotional_messages CASCADE;

-- ========================================
-- STEP 6: DROP ENUM TYPES
-- ========================================

RAISE NOTICE 'Dropping enum types...';

DROP TYPE IF EXISTS emotion_type CASCADE;
DROP TYPE IF EXISTS emotional_tone CASCADE;
DROP TYPE IF EXISTS escalation_level CASCADE;
DROP TYPE IF EXISTS notification_action CASCADE;
DROP TYPE IF EXISTS delivery_status CASCADE;

-- ========================================
-- STEP 7: DROP EXTENSIONS (if not used elsewhere)
-- ========================================

-- Note: Only drop extensions if they're not used by other parts of the system
-- Uncomment carefully after verifying no other tables use these extensions

-- DROP EXTENSION IF EXISTS "pg_trgm"; -- Text search optimization
-- DROP EXTENSION IF EXISTS "uuid-ossp"; -- UUID generation

-- ========================================
-- STEP 8: CLEANUP AND VERIFICATION
-- ========================================

RAISE NOTICE 'Performing cleanup verification...';

-- Verify all emotional intelligence objects are removed
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    view_count INTEGER;
    type_count INTEGER;
BEGIN
    -- Count remaining emotional intelligence objects
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name LIKE '%emotional%' 
    AND table_schema = 'public';
    
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_name LIKE '%emotional%'
    AND routine_schema = 'public';
    
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views
    WHERE table_name LIKE '%emotional%'
    AND table_schema = 'public';
    
    SELECT COUNT(*) INTO type_count
    FROM pg_type
    WHERE typname IN ('emotion_type', 'emotional_tone', 'escalation_level', 'notification_action', 'delivery_status');
    
    -- Report cleanup status
    RAISE NOTICE 'Cleanup verification:';
    RAISE NOTICE '- Tables remaining: %', table_count;
    RAISE NOTICE '- Functions remaining: %', function_count;
    RAISE NOTICE '- Views remaining: %', view_count;
    RAISE NOTICE '- Types remaining: %', type_count;
    
    IF (table_count + function_count + view_count + type_count) = 0 THEN
        RAISE NOTICE 'SUCCESS: All emotional intelligence components removed cleanly.';
    ELSE
        RAISE WARNING 'Some emotional intelligence components may still exist. Manual cleanup may be required.';
    END IF;
END $$;

-- Final rollback log entry (if analytics table still exists temporarily)
INSERT INTO emotional_analytics_events (event_type, event_data, event_timestamp)
VALUES ('system_rollback_completed', jsonb_build_object(
    'completed_at', CURRENT_TIMESTAMP,
    'performed_by', auth.uid(),
    'status', 'success'
), CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING; -- Table might already be dropped

-- ========================================
-- STEP 9: POST-ROLLBACK INSTRUCTIONS
-- ========================================

RAISE NOTICE '';
RAISE NOTICE '=====================================';
RAISE NOTICE 'EMOTIONAL INTELLIGENCE ROLLBACK COMPLETE';
RAISE NOTICE '=====================================';
RAISE NOTICE '';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Remove emotional intelligence service files from application code';
RAISE NOTICE '2. Remove emotional notification components from frontend';
RAISE NOTICE '3. Update service workers to remove emotional notification handling';
RAISE NOTICE '4. Remove emotional intelligence API endpoints';
RAISE NOTICE '5. Clean up emotional notification assets (icons, banners)';
RAISE NOTICE '';
RAISE NOTICE 'Files to remove/update:';
RAISE NOTICE '- src/services/emotional-intelligence.ts';
RAISE NOTICE '- src/hooks/useEmotionalNotifications.ts';
RAISE NOTICE '- src/components/EmotionalNudgeModal.tsx';
RAISE NOTICE '- src/types/emotional.ts';
RAISE NOTICE '- src/data/emotional-message-templates.ts';
RAISE NOTICE '- public/sw-emotional.js';
RAISE NOTICE '- emotional notification assets in public/';
RAISE NOTICE '';
RAISE NOTICE 'Analytics integrations to review:';
RAISE NOTICE '- Remove emotional events from PostHog tracking';
RAISE NOTICE '- Update dashboard to remove emotional intelligence metrics';
RAISE NOTICE '- Review push notification service for emotional components';
RAISE NOTICE '';

COMMIT;