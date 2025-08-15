-- Voice Features Database Schema Extensions for Relife Smart Alarm
-- Voice biometrics, analytics, shortcuts, and enhanced features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================================================
-- VOICE BIOMETRICS TABLES
-- ================================================================

-- Voice prints for biometric authentication
CREATE TABLE IF NOT EXISTS voice_prints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    features JSONB NOT NULL,
    confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    language VARCHAR(10) NOT NULL DEFAULT 'en-US',
    accent VARCHAR(50) NOT NULL DEFAULT 'General American',
    emotion VARCHAR(20) NOT NULL DEFAULT 'neutral',
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_voice_prints_user_id (user_id),
    INDEX idx_voice_prints_recorded_at (recorded_at),
    INDEX idx_voice_prints_language (language)
);

-- Voice authentication logs
CREATE TABLE IF NOT EXISTS voice_authentication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    authenticated BOOLEAN NOT NULL,
    confidence DECIMAL(5,2) NOT NULL,
    matched_features TEXT[] NOT NULL DEFAULT '{}',
    risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes for security monitoring
    INDEX idx_voice_auth_logs_user_id (user_id),
    INDEX idx_voice_auth_logs_timestamp (timestamp),
    INDEX idx_voice_auth_logs_risk_level (risk_level),
    INDEX idx_voice_auth_logs_authenticated (authenticated)
);

-- Voice training sessions
CREATE TABLE IF NOT EXISTS voice_training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    phrases TEXT[] NOT NULL,
    quality_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    improvements TEXT[] NOT NULL DEFAULT '{}',
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_voice_training_user_id (user_id),
    INDEX idx_voice_training_session_id (session_id),
    INDEX idx_voice_training_completed_at (completed_at)
);

-- ================================================================
-- VOICE COMMANDS AND ANALYTICS TABLES
-- ================================================================

-- Enhanced voice command logs
CREATE TABLE IF NOT EXISTS voice_commands_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    command_text TEXT NOT NULL,
    intent VARCHAR(50) NOT NULL,
    entities JSONB NOT NULL DEFAULT '{}',
    language VARCHAR(10) NOT NULL DEFAULT 'en-US',
    emotion VARCHAR(20) NOT NULL DEFAULT 'neutral',
    confidence DECIMAL(5,2) NOT NULL,
    contextual_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    success BOOLEAN NOT NULL DEFAULT false,
    response_time_ms INTEGER,
    processing_time_ms INTEGER,
    error_message TEXT,
    device_info JSONB,
    location JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Full-text search index
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', command_text)) STORED,
    
    -- Indexes for analytics
    INDEX idx_voice_commands_user_id (user_id),
    INDEX idx_voice_commands_intent (intent),
    INDEX idx_voice_commands_language (language),
    INDEX idx_voice_commands_timestamp (timestamp),
    INDEX idx_voice_commands_success (success),
    INDEX idx_voice_commands_search (search_vector) USING gin
);

-- Voice usage analytics aggregation
CREATE TABLE IF NOT EXISTS voice_analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_commands INTEGER NOT NULL DEFAULT 0,
    successful_commands INTEGER NOT NULL DEFAULT 0,
    failed_commands INTEGER NOT NULL DEFAULT 0,
    avg_confidence DECIMAL(5,2) NOT NULL DEFAULT 0,
    avg_response_time_ms INTEGER NOT NULL DEFAULT 0,
    top_intents JSONB NOT NULL DEFAULT '{}',
    languages_used JSONB NOT NULL DEFAULT '{}',
    emotions_detected JSONB NOT NULL DEFAULT '{}',
    peak_usage_hour INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(user_id, date),
    
    -- Indexes
    INDEX idx_voice_analytics_user_date (user_id, date),
    INDEX idx_voice_analytics_date (date)
);

-- ================================================================
-- VOICE SHORTCUTS AND CUSTOMIZATION
-- ================================================================

-- User-defined voice shortcuts
CREATE TABLE IF NOT EXISTS voice_shortcuts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    trigger TEXT NOT NULL,
    actions JSONB NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_voice_shortcuts_user_id (user_id),
    INDEX idx_voice_shortcuts_trigger (trigger),
    INDEX idx_voice_shortcuts_active (is_active),
    INDEX idx_voice_shortcuts_usage_count (usage_count DESC)
);

-- Voice preferences and settings
CREATE TABLE IF NOT EXISTS voice_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    primary_language VARCHAR(10) NOT NULL DEFAULT 'en-US',
    secondary_languages TEXT[] NOT NULL DEFAULT '{}',
    auto_language_detection BOOLEAN NOT NULL DEFAULT true,
    voice_authentication_enabled BOOLEAN NOT NULL DEFAULT false,
    gesture_recognition_enabled BOOLEAN NOT NULL DEFAULT true,
    gesture_sensitivity JSONB NOT NULL DEFAULT '{}',
    smart_home_integration BOOLEAN NOT NULL DEFAULT false,
    calendar_integration BOOLEAN NOT NULL DEFAULT false,
    contextual_commands BOOLEAN NOT NULL DEFAULT true,
    learning_enabled BOOLEAN NOT NULL DEFAULT true,
    cross_device_sync BOOLEAN NOT NULL DEFAULT true,
    emergency_mode_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- GESTURE RECOGNITION TABLES
-- ================================================================

-- Gesture detection logs
CREATE TABLE IF NOT EXISTS gesture_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gesture_type VARCHAR(20) NOT NULL CHECK (gesture_type IN ('whistle', 'hum', 'clap', 'kiss', 'snap')),
    confidence DECIMAL(5,2) NOT NULL,
    intent VARCHAR(20) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    audio_features JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_gesture_detections_user_id (user_id),
    INDEX idx_gesture_detections_type (gesture_type),
    INDEX idx_gesture_detections_timestamp (timestamp),
    INDEX idx_gesture_detections_success (success)
);

-- ================================================================
-- SMART INTEGRATION TABLES
-- ================================================================

-- Smart home device configurations
CREATE TABLE IF NOT EXISTS smart_home_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(100) NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    capabilities JSONB NOT NULL DEFAULT '{}',
    is_controllable BOOLEAN NOT NULL DEFAULT false,
    voice_commands JSONB NOT NULL DEFAULT '{}',
    last_command TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(user_id, device_id, platform),
    
    -- Indexes
    INDEX idx_smart_devices_user_id (user_id),
    INDEX idx_smart_devices_type (device_type),
    INDEX idx_smart_devices_platform (platform),
    INDEX idx_smart_devices_active (is_active)
);

-- Voice command execution logs
CREATE TABLE IF NOT EXISTS voice_command_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    command_id UUID REFERENCES voice_commands_enhanced(id),
    execution_type VARCHAR(50) NOT NULL,
    target_entity VARCHAR(100),
    parameters JSONB NOT NULL DEFAULT '{}',
    success BOOLEAN NOT NULL DEFAULT false,
    execution_time_ms INTEGER,
    error_details TEXT,
    result JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_voice_executions_user_id (user_id),
    INDEX idx_voice_executions_command_id (command_id),
    INDEX idx_voice_executions_type (execution_type),
    INDEX idx_voice_executions_timestamp (timestamp),
    INDEX idx_voice_executions_success (success)
);

-- ================================================================
-- ADVANCED FEATURES TABLES
-- ================================================================

-- Voice mood analysis and learning
CREATE TABLE IF NOT EXISTS voice_mood_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    detected_mood VARCHAR(20) NOT NULL,
    confidence DECIMAL(5,2) NOT NULL,
    energy_level DECIMAL(3,2) NOT NULL,
    stress_level DECIMAL(3,2) NOT NULL,
    audio_features JSONB,
    recommendations TEXT[] NOT NULL DEFAULT '{}',
    context JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_voice_mood_user_id (user_id),
    INDEX idx_voice_mood_detected (detected_mood),
    INDEX idx_voice_mood_timestamp (timestamp)
);

-- Language detection and switching logs
CREATE TABLE IF NOT EXISTS language_detection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    detected_language VARCHAR(10) NOT NULL,
    confidence DECIMAL(5,2) NOT NULL,
    audio_features JSONB,
    switch_successful BOOLEAN,
    previous_language VARCHAR(10),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_language_detection_user_id (user_id),
    INDEX idx_language_detection_language (detected_language),
    INDEX idx_language_detection_timestamp (timestamp)
);

-- ================================================================
-- PERFORMANCE AND MONITORING TABLES
-- ================================================================

-- Voice service performance metrics
CREATE TABLE IF NOT EXISTS voice_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20),
    metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_voice_metrics_service (service_name),
    INDEX idx_voice_metrics_name (metric_name),
    INDEX idx_voice_metrics_timestamp (timestamp)
);

-- ================================================================
-- VIEWS FOR ANALYTICS AND REPORTING
-- ================================================================

-- Voice usage summary view
CREATE OR REPLACE VIEW voice_usage_summary AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    COUNT(vce.id) as total_commands,
    COUNT(CASE WHEN vce.success THEN 1 END) as successful_commands,
    ROUND(AVG(vce.confidence), 2) as avg_confidence,
    ROUND(AVG(vce.response_time_ms), 0) as avg_response_time,
    ARRAY_AGG(DISTINCT vce.intent) as used_intents,
    ARRAY_AGG(DISTINCT vce.language) as used_languages,
    MAX(vce.timestamp) as last_command_at
FROM users u
LEFT JOIN voice_commands_enhanced vce ON u.id = vce.user_id
WHERE vce.timestamp >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name;

-- Voice authentication security view
CREATE OR REPLACE VIEW voice_auth_security AS
SELECT 
    user_id,
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN authenticated THEN 1 END) as successful_auths,
    COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_attempts,
    ROUND(
        COUNT(CASE WHEN authenticated THEN 1 END)::DECIMAL / COUNT(*) * 100, 
        2
    ) as success_rate,
    MAX(timestamp) as last_attempt
FROM voice_authentication_logs
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY user_id;

-- Voice shortcuts performance view
CREATE OR REPLACE VIEW voice_shortcuts_performance AS
SELECT 
    vs.user_id,
    vs.name,
    vs.trigger,
    vs.usage_count,
    vs.last_used,
    CASE 
        WHEN vs.last_used >= NOW() - INTERVAL '7 days' THEN 'active'
        WHEN vs.last_used >= NOW() - INTERVAL '30 days' THEN 'moderate'
        ELSE 'inactive'
    END as activity_level
FROM voice_shortcuts vs
WHERE vs.is_active = true
ORDER BY vs.usage_count DESC;

-- ================================================================
-- FUNCTIONS FOR DATA MAINTENANCE AND ANALYTICS
-- ================================================================

-- Function to aggregate daily voice analytics
CREATE OR REPLACE FUNCTION aggregate_daily_voice_analytics()
RETURNS void AS $$
BEGIN
    INSERT INTO voice_analytics_daily (
        user_id, date, total_commands, successful_commands, failed_commands,
        avg_confidence, avg_response_time_ms, top_intents, languages_used,
        emotions_detected, peak_usage_hour
    )
    SELECT 
        user_id,
        DATE(timestamp) as date,
        COUNT(*) as total_commands,
        COUNT(CASE WHEN success THEN 1 END) as successful_commands,
        COUNT(CASE WHEN NOT success THEN 1 END) as failed_commands,
        ROUND(AVG(confidence), 2) as avg_confidence,
        ROUND(AVG(response_time_ms), 0) as avg_response_time_ms,
        jsonb_object_agg(intent, intent_count) as top_intents,
        jsonb_object_agg(language, language_count) as languages_used,
        jsonb_object_agg(emotion, emotion_count) as emotions_detected,
        (
            SELECT EXTRACT(hour FROM timestamp)
            FROM voice_commands_enhanced vce2
            WHERE vce2.user_id = vce.user_id 
              AND DATE(vce2.timestamp) = DATE(vce.timestamp)
            GROUP BY EXTRACT(hour FROM timestamp)
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as peak_usage_hour
    FROM (
        SELECT 
            user_id, timestamp, intent, language, emotion, confidence, 
            response_time_ms, success,
            COUNT(*) OVER (PARTITION BY user_id, DATE(timestamp), intent) as intent_count,
            COUNT(*) OVER (PARTITION BY user_id, DATE(timestamp), language) as language_count,
            COUNT(*) OVER (PARTITION BY user_id, DATE(timestamp), emotion) as emotion_count
        FROM voice_commands_enhanced
        WHERE DATE(timestamp) = CURRENT_DATE - INTERVAL '1 day'
    ) vce
    GROUP BY user_id, DATE(timestamp)
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
        total_commands = EXCLUDED.total_commands,
        successful_commands = EXCLUDED.successful_commands,
        failed_commands = EXCLUDED.failed_commands,
        avg_confidence = EXCLUDED.avg_confidence,
        avg_response_time_ms = EXCLUDED.avg_response_time_ms,
        top_intents = EXCLUDED.top_intents,
        languages_used = EXCLUDED.languages_used,
        emotions_detected = EXCLUDED.emotions_detected,
        peak_usage_hour = EXCLUDED.peak_usage_hour,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old voice data
CREATE OR REPLACE FUNCTION cleanup_old_voice_data()
RETURNS void AS $$
BEGIN
    -- Clean up old voice commands (keep 90 days)
    DELETE FROM voice_commands_enhanced 
    WHERE timestamp < NOW() - INTERVAL '90 days';
    
    -- Clean up old authentication logs (keep 30 days)
    DELETE FROM voice_authentication_logs 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Clean up old gesture detections (keep 30 days)
    DELETE FROM gesture_detections 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Clean up old voice prints (keep 10 per user)
    DELETE FROM voice_prints 
    WHERE id NOT IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (
                PARTITION BY user_id ORDER BY recorded_at DESC
            ) as rn
            FROM voice_prints
        ) ranked
        WHERE rn <= 10
    );
    
    -- Clean up performance metrics (keep 7 days)
    DELETE FROM voice_performance_metrics 
    WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Function to get user voice statistics
CREATE OR REPLACE FUNCTION get_user_voice_stats(p_user_id UUID)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_commands', COALESCE(SUM(total_commands), 0),
        'success_rate', ROUND(
            CASE WHEN SUM(total_commands) > 0 
            THEN (SUM(successful_commands)::DECIMAL / SUM(total_commands)) * 100 
            ELSE 0 END, 2
        ),
        'avg_confidence', ROUND(AVG(avg_confidence), 2),
        'days_active', COUNT(*),
        'favorite_intents', (
            SELECT jsonb_agg(intent_data)
            FROM (
                SELECT jsonb_build_object(
                    'intent', key,
                    'count', value::integer
                ) as intent_data
                FROM voice_analytics_daily vad,
                jsonb_each_text(vad.top_intents)
                WHERE vad.user_id = p_user_id
                ORDER BY value::integer DESC
                LIMIT 5
            ) top_intents
        ),
        'languages_used', (
            SELECT ARRAY_AGG(DISTINCT key)
            FROM voice_analytics_daily vad,
            jsonb_each_text(vad.languages_used)
            WHERE vad.user_id = p_user_id
        )
    ) INTO result
    FROM voice_analytics_daily
    WHERE user_id = p_user_id
      AND date >= CURRENT_DATE - INTERVAL '30 days';
    
    RETURN COALESCE(result, '{}');
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- TRIGGERS FOR AUTOMATIC MAINTENANCE
-- ================================================================

-- Trigger to update voice preferences timestamp
CREATE OR REPLACE FUNCTION update_voice_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_voice_preferences_updated
    BEFORE UPDATE ON voice_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_voice_preferences_timestamp();

-- Trigger to update voice shortcuts timestamp
CREATE OR REPLACE FUNCTION update_voice_shortcuts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.usage_count > OLD.usage_count THEN
        NEW.last_used = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_voice_shortcuts_updated
    BEFORE UPDATE ON voice_shortcuts
    FOR EACH ROW
    EXECUTE FUNCTION update_voice_shortcuts_timestamp();

-- ================================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================================

-- Enable RLS on all voice tables
ALTER TABLE voice_prints ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_authentication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_commands_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE gesture_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_home_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_command_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_mood_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_detection_logs ENABLE ROW LEVEL SECURITY;

-- Policies for voice_prints
CREATE POLICY voice_prints_user_access ON voice_prints
    FOR ALL USING (auth.uid() = user_id);

-- Policies for voice_commands_enhanced  
CREATE POLICY voice_commands_user_access ON voice_commands_enhanced
    FOR ALL USING (auth.uid() = user_id);

-- Policies for voice_shortcuts
CREATE POLICY voice_shortcuts_user_access ON voice_shortcuts
    FOR ALL USING (auth.uid() = user_id);

-- Policies for voice_preferences
CREATE POLICY voice_preferences_user_access ON voice_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Policies for other voice tables (similar pattern)
CREATE POLICY voice_auth_logs_user_access ON voice_authentication_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY voice_training_user_access ON voice_training_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY voice_analytics_user_access ON voice_analytics_daily
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY gesture_detections_user_access ON gesture_detections
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY smart_devices_user_access ON smart_home_devices
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY voice_executions_user_access ON voice_command_executions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY voice_mood_user_access ON voice_mood_analysis
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY language_detection_user_access ON language_detection_logs
    FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- INITIAL DATA AND CONFIGURATION
-- ================================================================

-- Insert default voice preferences for existing users
INSERT INTO voice_preferences (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM voice_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Performance optimization: analyze tables
ANALYZE voice_prints;
ANALYZE voice_commands_enhanced;
ANALYZE voice_analytics_daily;
ANALYZE voice_shortcuts;
ANALYZE voice_preferences;