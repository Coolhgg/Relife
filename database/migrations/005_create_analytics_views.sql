-- Migration 005: Create Analytics Views  
-- Description: Reporting views for emotional intelligence dashboard
-- Dependencies: 001_create_emotional_tables.sql
-- Version: 1.0.0

BEGIN;

-- Overview Dashboard View
-- Provides high-level metrics for admin dashboard
CREATE OR REPLACE VIEW emotional_overview_dashboard AS
SELECT 
    -- Overall metrics
    (SELECT COUNT(*) FROM emotional_notification_logs WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as notifications_sent_30d,
    (SELECT COUNT(*) FROM emotional_notification_logs WHERE notification_opened = true AND created_at >= CURRENT_DATE - INTERVAL '30 days') as notifications_opened_30d,
    (SELECT COUNT(*) FROM emotional_notification_logs WHERE action_taken = 'completed_task' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as tasks_completed_30d,
    (SELECT ROUND(AVG(effectiveness_rating), 2) FROM emotional_notification_logs WHERE effectiveness_rating IS NOT NULL AND created_at >= CURRENT_DATE - INTERVAL '30 days') as avg_effectiveness_30d,
    
    -- Open rates by period
    (SELECT ROUND((COUNT(*) FILTER (WHERE notification_opened = true)::decimal / COUNT(*)) * 100, 1) 
     FROM emotional_notification_logs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as open_rate_7d,
    (SELECT ROUND((COUNT(*) FILTER (WHERE notification_opened = true)::decimal / COUNT(*)) * 100, 1) 
     FROM emotional_notification_logs WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as open_rate_30d,
     
    -- Completion rates by period
    (SELECT ROUND((COUNT(*) FILTER (WHERE action_taken = 'completed_task')::decimal / COUNT(*)) * 100, 1) 
     FROM emotional_notification_logs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as completion_rate_7d,
    (SELECT ROUND((COUNT(*) FILTER (WHERE action_taken = 'completed_task')::decimal / COUNT(*)) * 100, 1) 
     FROM emotional_notification_logs WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as completion_rate_30d,
     
    -- Active users
    (SELECT COUNT(DISTINCT user_id) FROM emotional_notification_logs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as active_users_7d,
    (SELECT COUNT(DISTINCT user_id) FROM emotional_notification_logs WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as active_users_30d,
    
    -- Top performing emotion and tone
    (SELECT emotion_type FROM emotional_notification_logs 
     WHERE effectiveness_rating IS NOT NULL AND created_at >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY emotion_type 
     ORDER BY AVG(effectiveness_rating) DESC LIMIT 1) as top_emotion_30d,
    (SELECT tone FROM emotional_notification_logs 
     WHERE effectiveness_rating IS NOT NULL AND created_at >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY tone 
     ORDER BY AVG(effectiveness_rating) DESC LIMIT 1) as top_tone_30d;

-- User Performance Analytics View
-- Individual user performance metrics for personalization
CREATE OR REPLACE VIEW user_emotional_analytics AS
SELECT 
    u.id as user_id,
    uep.preferred_tones,
    uep.most_effective_emotions,
    uep.optimal_send_times,
    
    -- Recent activity (30 days)
    COUNT(enl.id) as total_notifications_30d,
    COUNT(enl.id) FILTER (WHERE enl.notification_opened = true) as notifications_opened_30d,
    COUNT(enl.id) FILTER (WHERE enl.action_taken = 'completed_task') as tasks_completed_30d,
    ROUND(AVG(enl.effectiveness_rating), 2) as avg_effectiveness_30d,
    
    -- Performance rates
    ROUND((COUNT(enl.id) FILTER (WHERE enl.notification_opened = true)::decimal / NULLIF(COUNT(enl.id), 0)) * 100, 1) as open_rate_30d,
    ROUND((COUNT(enl.id) FILTER (WHERE enl.action_taken = 'completed_task')::decimal / NULLIF(COUNT(enl.id), 0)) * 100, 1) as completion_rate_30d,
    
    -- Behavioral patterns
    MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM enl.sent_at)) as most_active_hour,
    AVG(enl.response_time_ms) as avg_response_time_ms,
    
    -- Escalation patterns
    AVG(CASE 
        WHEN enl.escalation_level = 'gentle' THEN 1
        WHEN enl.escalation_level = 'slightly_emotional' THEN 2
        WHEN enl.escalation_level = 'strong_emotional' THEN 3
        WHEN enl.escalation_level = 'social_pressure' THEN 4
        WHEN enl.escalation_level = 'major_reset' THEN 5
    END) as avg_escalation_level,
    
    -- Last activity
    MAX(enl.created_at) as last_notification_at,
    MAX(enl.opened_at) as last_opened_at,
    MAX(enl.action_taken_at) as last_action_at,
    
    -- Profile data
    uep.confidence_score,
    uep.data_points_collected,
    uep.last_analyzed_at
    
FROM users u
LEFT JOIN user_emotional_profiles uep ON u.id = uep.user_id
LEFT JOIN emotional_notification_logs enl ON u.id = enl.user_id 
    AND enl.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, uep.preferred_tones, uep.most_effective_emotions, uep.optimal_send_times, 
    uep.confidence_score, uep.data_points_collected, uep.last_analyzed_at;

-- Emotion Performance Analytics View
-- Performance metrics by emotion type for optimization
CREATE OR REPLACE VIEW emotion_performance_analytics AS
SELECT 
    emotion_type,
    tone,
    
    -- Volume metrics (30 days)
    COUNT(*) as total_sent_30d,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as total_sent_7d,
    
    -- Engagement metrics
    COUNT(*) FILTER (WHERE notification_opened = true) as total_opened_30d,
    COUNT(*) FILTER (WHERE action_taken = 'completed_task') as total_completed_30d,
    
    -- Performance rates
    ROUND((COUNT(*) FILTER (WHERE notification_opened = true)::decimal / COUNT(*)) * 100, 1) as open_rate,
    ROUND((COUNT(*) FILTER (WHERE action_taken = 'completed_task')::decimal / COUNT(*)) * 100, 1) as completion_rate,
    
    -- Effectiveness metrics
    ROUND(AVG(effectiveness_rating), 2) as avg_effectiveness,
    COUNT(*) FILTER (WHERE effectiveness_rating >= 4) as high_effectiveness_count,
    COUNT(*) FILTER (WHERE effectiveness_rating <= 2) as low_effectiveness_count,
    
    -- Response time metrics
    ROUND(AVG(response_time_ms), 0) as avg_response_time_ms,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_ms), 0) as median_response_time_ms,
    
    -- User engagement
    COUNT(DISTINCT user_id) as unique_users,
    ROUND(AVG(CASE WHEN action_taken = 'dismissed' THEN 1.0 ELSE 0.0 END), 3) as dismiss_rate,
    ROUND(AVG(CASE WHEN action_taken = 'snoozed' THEN 1.0 ELSE 0.0 END), 3) as snooze_rate,
    
    -- Timing insights
    MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM sent_at)) as best_send_hour,
    MODE() WITHIN GROUP (ORDER BY EXTRACT(DOW FROM sent_at)) as best_send_dow,
    
    -- Recent trends (7d vs previous 7d)
    LAG(COUNT(*)) OVER (ORDER BY emotion_type, tone) as previous_week_volume,
    
    -- Last updated
    MAX(created_at) as last_sent_at

FROM emotional_notification_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY emotion_type, tone
ORDER BY avg_effectiveness DESC, open_rate DESC;

-- Message Template Performance View
-- Performance metrics for each message template
CREATE OR REPLACE VIEW message_template_performance AS
SELECT 
    em.id as template_id,
    em.emotion_type,
    em.tone,
    em.template,
    em.tags,
    
    -- Usage metrics
    em.usage_count as total_usage,
    em.success_count as total_success,
    em.effectiveness_score as calculated_effectiveness,
    
    -- Recent performance (30 days)
    COUNT(enl.id) as usage_30d,
    COUNT(enl.id) FILTER (WHERE enl.notification_opened = true) as opened_30d,
    COUNT(enl.id) FILTER (WHERE enl.action_taken = 'completed_task') as completed_30d,
    ROUND(AVG(enl.effectiveness_rating), 2) as avg_effectiveness_30d,
    
    -- Performance rates
    ROUND((COUNT(enl.id) FILTER (WHERE enl.notification_opened = true)::decimal / NULLIF(COUNT(enl.id), 0)) * 100, 1) as open_rate_30d,
    ROUND((COUNT(enl.id) FILTER (WHERE enl.action_taken = 'completed_task')::decimal / NULLIF(COUNT(enl.id), 0)) * 100, 1) as completion_rate_30d,
    
    -- User feedback
    COUNT(enl.id) FILTER (WHERE enl.effectiveness_rating >= 4) as positive_ratings_30d,
    COUNT(enl.id) FILTER (WHERE enl.effectiveness_rating <= 2) as negative_ratings_30d,
    
    -- Template metadata
    em.created_at as template_created_at,
    em.updated_at as template_updated_at,
    em.is_active,
    
    -- Usage trends
    COUNT(enl.id) FILTER (WHERE enl.created_at >= CURRENT_DATE - INTERVAL '7 days') as usage_7d,
    COUNT(enl.id) FILTER (WHERE enl.created_at >= CURRENT_DATE - INTERVAL '14 days' AND enl.created_at < CURRENT_DATE - INTERVAL '7 days') as usage_prev_7d

FROM emotional_messages em
LEFT JOIN emotional_notification_logs enl ON em.id = enl.message_id 
    AND enl.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY em.id, em.emotion_type, em.tone, em.template, em.tags, em.usage_count, 
    em.success_count, em.effectiveness_score, em.created_at, em.updated_at, em.is_active
ORDER BY avg_effectiveness_30d DESC NULLS LAST, usage_30d DESC;

-- A/B Experiment Analytics View
-- Performance metrics for A/B experiments
CREATE OR REPLACE VIEW ab_experiment_analytics AS
SELECT 
    eae.name as experiment_name,
    eae.description,
    eae.status,
    eae.start_date,
    eae.end_date,
    eae.primary_metric,
    
    -- Experiment metadata
    jsonb_array_length(eae.treatment_variants) as variant_count,
    eae.traffic_allocation,
    
    -- Participant metrics
    COUNT(DISTINCT enl.user_id) as total_participants,
    COUNT(enl.id) as total_notifications,
    
    -- Performance by variant
    jsonb_object_agg(
        enl.experiment_variant,
        jsonb_build_object(
            'notifications_sent', COUNT(enl.id),
            'unique_users', COUNT(DISTINCT enl.user_id),
            'open_rate', ROUND((COUNT(enl.id) FILTER (WHERE enl.notification_opened = true)::decimal / NULLIF(COUNT(enl.id), 0)) * 100, 1),
            'completion_rate', ROUND((COUNT(enl.id) FILTER (WHERE enl.action_taken = 'completed_task')::decimal / NULLIF(COUNT(enl.id), 0)) * 100, 1),
            'avg_effectiveness', ROUND(AVG(enl.effectiveness_rating), 2)
        )
    ) FILTER (WHERE enl.experiment_variant IS NOT NULL) as variant_performance,
    
    -- Overall experiment metrics
    ROUND((COUNT(enl.id) FILTER (WHERE enl.notification_opened = true)::decimal / NULLIF(COUNT(enl.id), 0)) * 100, 1) as overall_open_rate,
    ROUND((COUNT(enl.id) FILTER (WHERE enl.action_taken = 'completed_task')::decimal / NULLIF(COUNT(enl.id), 0)) * 100, 1) as overall_completion_rate,
    ROUND(AVG(enl.effectiveness_rating), 2) as overall_avg_effectiveness,
    
    -- Statistical significance (basic)
    CASE 
        WHEN COUNT(DISTINCT enl.user_id) >= 100 AND eae.status = 'completed' THEN 'sufficient'
        WHEN COUNT(DISTINCT enl.user_id) >= 50 AND eae.status = 'active' THEN 'approaching'
        ELSE 'insufficient'
    END as sample_size_status,
    
    -- Timestamps
    MIN(enl.created_at) as first_notification_at,
    MAX(enl.created_at) as last_notification_at,
    eae.created_at as experiment_created_at,
    eae.updated_at as experiment_updated_at

FROM emotional_ab_experiments eae
LEFT JOIN emotional_notification_logs enl ON eae.name = enl.experiment_id
GROUP BY eae.name, eae.description, eae.status, eae.start_date, eae.end_date, eae.primary_metric,
    eae.treatment_variants, eae.traffic_allocation, eae.created_at, eae.updated_at
ORDER BY eae.created_at DESC;

-- Daily Performance Trends View
-- Day-over-day performance metrics for trend analysis
CREATE OR REPLACE VIEW daily_performance_trends AS
SELECT 
    date_trunc('day', created_at)::date as notification_date,
    
    -- Volume metrics
    COUNT(*) as notifications_sent,
    COUNT(DISTINCT user_id) as unique_users,
    
    -- Engagement metrics
    COUNT(*) FILTER (WHERE notification_opened = true) as notifications_opened,
    COUNT(*) FILTER (WHERE action_taken = 'completed_task') as tasks_completed,
    COUNT(*) FILTER (WHERE action_taken = 'dismissed') as notifications_dismissed,
    COUNT(*) FILTER (WHERE action_taken = 'snoozed') as notifications_snoozed,
    
    -- Performance rates
    ROUND((COUNT(*) FILTER (WHERE notification_opened = true)::decimal / COUNT(*)) * 100, 1) as open_rate,
    ROUND((COUNT(*) FILTER (WHERE action_taken = 'completed_task')::decimal / COUNT(*)) * 100, 1) as completion_rate,
    ROUND((COUNT(*) FILTER (WHERE action_taken = 'dismissed')::decimal / COUNT(*)) * 100, 1) as dismiss_rate,
    
    -- Effectiveness metrics
    ROUND(AVG(effectiveness_rating), 2) as avg_effectiveness,
    COUNT(*) FILTER (WHERE effectiveness_rating IS NOT NULL) as ratings_received,
    COUNT(*) FILTER (WHERE effectiveness_rating >= 4) as positive_ratings,
    COUNT(*) FILTER (WHERE effectiveness_rating <= 2) as negative_ratings,
    
    -- Response time metrics
    ROUND(AVG(response_time_ms), 0) as avg_response_time_ms,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_ms), 0) as median_response_time_ms,
    
    -- Distribution by emotion
    COUNT(*) FILTER (WHERE emotion_type = 'happy') as happy_count,
    COUNT(*) FILTER (WHERE emotion_type = 'sad') as sad_count,
    COUNT(*) FILTER (WHERE emotion_type = 'worried') as worried_count,
    COUNT(*) FILTER (WHERE emotion_type = 'excited') as excited_count,
    COUNT(*) FILTER (WHERE emotion_type = 'lonely') as lonely_count,
    COUNT(*) FILTER (WHERE emotion_type = 'proud') as proud_count,
    COUNT(*) FILTER (WHERE emotion_type = 'sleepy') as sleepy_count,
    
    -- Distribution by tone
    COUNT(*) FILTER (WHERE tone = 'encouraging') as encouraging_count,
    COUNT(*) FILTER (WHERE tone = 'playful') as playful_count,
    COUNT(*) FILTER (WHERE tone = 'firm') as firm_count,
    COUNT(*) FILTER (WHERE tone = 'roast') as roast_count,
    
    -- Platform distribution
    COUNT(*) FILTER (WHERE platform = 'ios') as ios_count,
    COUNT(*) FILTER (WHERE platform = 'android') as android_count,
    COUNT(*) FILTER (WHERE platform = 'web') as web_count

FROM emotional_notification_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY date_trunc('day', created_at)::date
ORDER BY notification_date DESC;

-- User Engagement Cohort View
-- Cohort analysis of user engagement over time
CREATE OR REPLACE VIEW user_engagement_cohorts AS
WITH user_first_notification AS (
    SELECT 
        user_id,
        date_trunc('week', MIN(created_at))::date as cohort_week
    FROM emotional_notification_logs
    GROUP BY user_id
),
weekly_activity AS (
    SELECT 
        enl.user_id,
        ufn.cohort_week,
        date_trunc('week', enl.created_at)::date as activity_week,
        COUNT(*) as notifications_received,
        COUNT(*) FILTER (WHERE enl.notification_opened = true) as notifications_opened,
        COUNT(*) FILTER (WHERE enl.action_taken = 'completed_task') as tasks_completed
    FROM emotional_notification_logs enl
    JOIN user_first_notification ufn ON enl.user_id = ufn.user_id
    GROUP BY enl.user_id, ufn.cohort_week, date_trunc('week', enl.created_at)::date
)
SELECT 
    cohort_week,
    (activity_week - cohort_week) / 7 as week_number,
    COUNT(DISTINCT user_id) as active_users,
    SUM(notifications_received) as total_notifications,
    SUM(notifications_opened) as total_opened,
    SUM(tasks_completed) as total_completed,
    ROUND((SUM(notifications_opened)::decimal / SUM(notifications_received)) * 100, 1) as cohort_open_rate,
    ROUND((SUM(tasks_completed)::decimal / SUM(notifications_received)) * 100, 1) as cohort_completion_rate
FROM weekly_activity
WHERE activity_week >= cohort_week
GROUP BY cohort_week, week_number
ORDER BY cohort_week DESC, week_number;

-- Grant read permissions to authenticated users
GRANT SELECT ON emotional_overview_dashboard TO authenticated;
GRANT SELECT ON user_emotional_analytics TO authenticated;
GRANT SELECT ON emotion_performance_analytics TO authenticated;
GRANT SELECT ON message_template_performance TO authenticated;
GRANT SELECT ON ab_experiment_analytics TO authenticated;
GRANT SELECT ON daily_performance_trends TO authenticated;
GRANT SELECT ON user_engagement_cohorts TO authenticated;

-- Add view comments for documentation
COMMENT ON VIEW emotional_overview_dashboard IS 'High-level metrics for admin dashboard overview';
COMMENT ON VIEW user_emotional_analytics IS 'Individual user performance metrics for personalization';
COMMENT ON VIEW emotion_performance_analytics IS 'Performance metrics by emotion type and tone';
COMMENT ON VIEW message_template_performance IS 'Performance metrics for each message template';
COMMENT ON VIEW ab_experiment_analytics IS 'A/B experiment performance and statistical analysis';
COMMENT ON VIEW daily_performance_trends IS 'Day-over-day performance metrics for trend analysis';
COMMENT ON VIEW user_engagement_cohorts IS 'Cohort analysis of user engagement over time';

COMMIT;