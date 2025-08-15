-- Real-time Extensions for Enhanced Smart Alarm Database Schema
-- Additional tables and features to support cloud functions and real-time features
-- Run after schema-enhanced.sql

-- Voice learning data table for AI personalization
CREATE TABLE IF NOT EXISTS voice_learning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  voice_mood TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  outcome_success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT,
  auth_key TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time presence tracking
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('online', 'away', 'offline')) DEFAULT 'offline',
  device_info JSONB DEFAULT '{}'::jsonb,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics aggregation table for cloud processing
CREATE TABLE IF NOT EXISTS analytics_aggregation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  aggregation_period TEXT CHECK (aggregation_period IN ('hourly', 'daily', 'weekly', 'monthly')),
  user_segment TEXT,
  value_sum FLOAT DEFAULT 0,
  value_avg FLOAT DEFAULT 0,
  value_min FLOAT DEFAULT 0,
  value_max FLOAT DEFAULT 0,
  count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User analytics history for personal best tracking
CREATE TABLE IF NOT EXISTS user_analytics_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  value FLOAT NOT NULL,
  date DATE NOT NULL,
  period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, metric, date, period_type)
);

-- Cloud function logs for monitoring
CREATE TABLE IF NOT EXISTS cloud_function_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  execution_time INTEGER, -- milliseconds
  status TEXT CHECK (status IN ('success', 'error', 'timeout')),
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced indexes for new tables
CREATE INDEX IF NOT EXISTS idx_voice_learning_user_mood ON voice_learning_data(user_id, voice_mood);
CREATE INDEX IF NOT EXISTS idx_voice_learning_created ON voice_learning_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_learning_success ON voice_learning_data(outcome_success);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

CREATE INDEX IF NOT EXISTS idx_user_presence_user_status ON user_presence(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_user_presence_session ON user_presence(session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_agg_date_metric ON analytics_aggregation(date, metric_type, metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_agg_period ON analytics_aggregation(aggregation_period, date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_agg_segment ON analytics_aggregation(user_segment, date DESC);

CREATE INDEX IF NOT EXISTS idx_user_analytics_user_metric ON user_analytics_history(user_id, metric);
CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON user_analytics_history(date DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_period ON user_analytics_history(period_type, date DESC);

CREATE INDEX IF NOT EXISTS idx_cloud_logs_function ON cloud_function_logs(function_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cloud_logs_status ON cloud_function_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cloud_logs_user ON cloud_function_logs(user_id, created_at DESC);

-- Enhanced RLS policies for new tables
ALTER TABLE voice_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_aggregation ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_function_logs ENABLE ROW LEVEL SECURITY;

-- Voice learning data policies
CREATE POLICY "Users can view own voice learning data" ON voice_learning_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice learning data" ON voice_learning_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- User presence policies
CREATE POLICY "Users can view own presence" ON user_presence
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own presence" ON user_presence
    FOR ALL USING (auth.uid() = user_id);

-- Analytics history policies
CREATE POLICY "Users can view own analytics history" ON user_analytics_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics history" ON user_analytics_history
    FOR INSERT WITH CHECK (true); -- Allows system inserts

-- Cloud logs policies (admin only)
CREATE POLICY "Admin can view cloud logs" ON cloud_function_logs
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM users WHERE email LIKE '%@admin.%'
    ));

-- Analytics aggregation (public read for anonymized data)
CREATE POLICY "Public can read aggregated analytics" ON analytics_aggregation
    FOR SELECT USING (true);

-- Enhanced functions for real-time features

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
    target_user_id UUID,
    new_status TEXT,
    device_info JSONB DEFAULT '{}'::jsonb,
    session_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_presence (user_id, status, device_info, session_id, last_seen, updated_at)
    VALUES (target_user_id, new_status, device_info, session_id, NOW(), NOW())
    ON CONFLICT (user_id, session_id) 
    DO UPDATE SET 
        status = EXCLUDED.status,
        device_info = EXCLUDED.device_info,
        last_seen = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate daily analytics
CREATE OR REPLACE FUNCTION aggregate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    -- Aggregate alarm success rates
    INSERT INTO analytics_aggregation (
        date, metric_type, metric_name, aggregation_period,
        value_avg, count, metadata
    )
    SELECT 
        target_date,
        'performance',
        'success_rate',
        'daily',
        AVG(CASE WHEN ae.dismissed AND NOT ae.snoozed THEN 100.0 ELSE 0.0 END),
        COUNT(*),
        json_build_object('total_alarms', COUNT(*))
    FROM alarm_events ae
    JOIN alarms a ON ae.alarm_id = a.id
    WHERE DATE(ae.fired_at) = target_date
    ON CONFLICT (date, metric_type, metric_name, aggregation_period) 
    DO UPDATE SET 
        value_avg = EXCLUDED.value_avg,
        count = EXCLUDED.count,
        metadata = EXCLUDED.metadata;

    -- Aggregate response times
    INSERT INTO analytics_aggregation (
        date, metric_type, metric_name, aggregation_period,
        value_avg, value_min, value_max, count
    )
    SELECT 
        target_date,
        'performance',
        'response_time',
        'daily',
        AVG(ae.response_time),
        MIN(ae.response_time),
        MAX(ae.response_time),
        COUNT(*)
    FROM alarm_events ae
    WHERE DATE(ae.fired_at) = target_date 
      AND ae.response_time IS NOT NULL
    ON CONFLICT (date, metric_type, metric_name, aggregation_period) 
    DO UPDATE SET 
        value_avg = EXCLUDED.value_avg,
        value_min = EXCLUDED.value_min,
        value_max = EXCLUDED.value_max,
        count = EXCLUDED.count;
END;
$$ LANGUAGE plpgsql;

-- Function to store user analytics history
CREATE OR REPLACE FUNCTION store_user_analytics_snapshot(
    target_user_id UUID,
    metric_name TEXT,
    metric_value FLOAT,
    period_type TEXT DEFAULT 'daily'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_analytics_history (
        user_id, metric, value, date, period_type
    )
    VALUES (
        target_user_id, 
        metric_name, 
        metric_value, 
        CURRENT_DATE, 
        period_type
    )
    ON CONFLICT (user_id, metric, date, period_type)
    DO UPDATE SET 
        value = EXCLUDED.value,
        metadata = COALESCE(user_analytics_history.metadata, '{}'::jsonb) || 
                  json_build_object('updated_at', NOW())::jsonb;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old real-time data
CREATE OR REPLACE FUNCTION cleanup_realtime_data()
RETURNS VOID AS $$
BEGIN
    -- Clean old presence data (older than 7 days)
    DELETE FROM user_presence 
    WHERE last_seen < NOW() - INTERVAL '7 days';

    -- Clean old voice learning data (keep last 100 per user)
    DELETE FROM voice_learning_data 
    WHERE id NOT IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (
                PARTITION BY user_id 
                ORDER BY created_at DESC
            ) as rn
            FROM voice_learning_data
        ) ranked
        WHERE rn <= 100
    );

    -- Clean old cloud function logs (older than 30 days)
    DELETE FROM cloud_function_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';

    -- Archive old analytics aggregation (older than 1 year)
    DELETE FROM analytics_aggregation 
    WHERE date < CURRENT_DATE - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic data management

-- Trigger to update user last_active on presence changes
CREATE OR REPLACE FUNCTION update_user_last_active_from_presence()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET last_active = NOW() 
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_last_active_on_presence ON user_presence;
CREATE TRIGGER update_last_active_on_presence
    AFTER INSERT OR UPDATE ON user_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_user_last_active_from_presence();

-- Trigger to update push subscription timestamps
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_presence_updated_at ON user_presence;
CREATE TRIGGER update_user_presence_updated_at
    BEFORE UPDATE ON user_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enhanced views for real-time analytics

-- Real-time user activity view
CREATE OR REPLACE VIEW realtime_user_activity AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    up.status,
    up.last_seen,
    up.device_info,
    
    -- Today's alarm stats
    COUNT(ae_today.id) as today_alarms,
    COUNT(CASE WHEN ae_today.dismissed AND NOT ae_today.snoozed THEN 1 END) as today_successful,
    AVG(ae_today.response_time) as today_avg_response,
    
    -- Recent learning data
    COUNT(vld.id) as learning_events_count,
    AVG(CASE WHEN vld.outcome_success THEN 1.0 ELSE 0.0 END) as learning_success_rate

FROM users u
LEFT JOIN user_presence up ON u.id = up.user_id
LEFT JOIN alarms a ON u.id = a.user_id
LEFT JOIN alarm_events ae_today ON a.id = ae_today.alarm_id 
    AND DATE(ae_today.fired_at) = CURRENT_DATE
LEFT JOIN voice_learning_data vld ON u.id = vld.user_id 
    AND vld.created_at > NOW() - INTERVAL '7 days'
GROUP BY u.id, u.email, u.name, up.status, up.last_seen, up.device_info;

-- Cloud function performance view
CREATE OR REPLACE VIEW cloud_function_performance AS
SELECT 
    function_name,
    DATE(created_at) as date,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_executions,
    AVG(execution_time) as avg_execution_time,
    MAX(execution_time) as max_execution_time,
    MIN(execution_time) as min_execution_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time) as p95_execution_time
FROM cloud_function_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY function_name, DATE(created_at)
ORDER BY date DESC, function_name;

-- Voice effectiveness analytics view
CREATE OR REPLACE VIEW voice_effectiveness_analytics AS
SELECT 
    vld.voice_mood,
    COUNT(*) as total_uses,
    AVG(CASE WHEN vld.outcome_success THEN 1.0 ELSE 0.0 END) as success_rate,
    AVG((vld.user_response->>'responseTime')::INTEGER) as avg_response_time,
    COUNT(DISTINCT vld.user_id) as unique_users,
    
    -- Context analysis
    AVG((vld.context->>'timeOfDay')::INTEGER) as avg_time_of_day,
    MODE() WITHIN GROUP (ORDER BY (vld.context->>'dayOfWeek')::INTEGER) as most_common_day,
    
    -- Recent trend (last 7 days vs previous 7 days)
    AVG(CASE 
        WHEN vld.created_at > NOW() - INTERVAL '7 days' AND vld.outcome_success 
        THEN 1.0 ELSE 0.0 
    END) as recent_success_rate,
    AVG(CASE 
        WHEN vld.created_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days' 
        AND vld.outcome_success THEN 1.0 ELSE 0.0 
    END) as previous_success_rate

FROM voice_learning_data vld
WHERE vld.created_at > NOW() - INTERVAL '30 days'
GROUP BY vld.voice_mood
ORDER BY success_rate DESC;

-- Schedule automatic maintenance
-- (In production, this would be handled by pg_cron or cloud scheduler)

-- Grant permissions for new objects
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Comments for documentation
COMMENT ON TABLE voice_learning_data IS 'AI learning data for voice personalization and effectiveness tracking';
COMMENT ON TABLE push_subscriptions IS 'Web push notification subscriptions for real-time alerts';
COMMENT ON TABLE user_presence IS 'Real-time user presence and activity tracking';
COMMENT ON TABLE analytics_aggregation IS 'Pre-computed analytics for fast dashboard queries';
COMMENT ON TABLE user_analytics_history IS 'Historical analytics snapshots for trend analysis';
COMMENT ON TABLE cloud_function_logs IS 'Cloud function execution logs and performance monitoring';

COMMENT ON VIEW realtime_user_activity IS 'Real-time view of user activity and engagement metrics';
COMMENT ON VIEW cloud_function_performance IS 'Cloud function performance analytics and monitoring';
COMMENT ON VIEW voice_effectiveness_analytics IS 'Voice mood effectiveness analysis and trends';

COMMENT ON FUNCTION update_user_presence(UUID, TEXT, JSONB, TEXT) IS 'Updates or inserts user presence status';
COMMENT ON FUNCTION aggregate_daily_analytics(DATE) IS 'Aggregates daily analytics for performance dashboards';
COMMENT ON FUNCTION store_user_analytics_snapshot(UUID, TEXT, FLOAT, TEXT) IS 'Stores user analytics snapshots for historical tracking';
COMMENT ON FUNCTION cleanup_realtime_data() IS 'Maintenance function to clean up old real-time data';

-- Setup completion notice
DO $$
BEGIN
    RAISE NOTICE 'Real-time database extensions setup complete!';
    RAISE NOTICE 'New features added:';
    RAISE NOTICE '- Voice AI learning and personalization';
    RAISE NOTICE '- Push notification subscriptions';
    RAISE NOTICE '- Real-time presence tracking';
    RAISE NOTICE '- Advanced analytics aggregation';
    RAISE NOTICE '- Cloud function monitoring';
    RAISE NOTICE '- Automated maintenance functions';
    RAISE NOTICE '';
    RAISE NOTICE 'Remember to:';
    RAISE NOTICE '1. Set up automated cleanup job (cleanup_realtime_data)';
    RAISE NOTICE '2. Configure push notification keys in environment';
    RAISE NOTICE '3. Set up cloud function monitoring alerts';
    RAISE NOTICE '4. Test real-time features end-to-end';
END
$$;