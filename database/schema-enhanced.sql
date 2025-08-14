-- Enhanced Smart Alarm Database Schema for Supabase v2.0
-- Features: Smart scheduling, sleep pattern tracking, advanced analytics, performance optimization
-- Run this in your Supabase SQL editor to set up the database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Enhanced Users table with sleep tracking and AI preferences
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{
    "theme": "auto",
    "notificationsEnabled": true,
    "voiceDismissalSensitivity": 5,
    "defaultVoiceMood": "motivational",
    "hapticFeedback": true,
    "snoozeMinutes": 5,
    "maxSnoozes": 3,
    "smartScheduling": true,
    "sleepPatternAnalysis": true,
    "adaptiveAlarms": false,
    "weekendMode": false,
    "gentleWakeup": true,
    "voicePersonalization": true
  }'::jsonb,
  sleep_profile JSONB DEFAULT '{
    "averageSleepDuration": 8,
    "preferredBedtime": "22:00",
    "preferredWakeTime": "06:00",
    "sleepEfficiencyTarget": 85,
    "deepSleepTarget": 20,
    "remSleepTarget": 25
  }'::jsonb,
  ai_settings JSONB DEFAULT '{
    "personalityLearning": true,
    "responseAdaptation": true,
    "predictiveScheduling": false,
    "moodBasedAlarms": false,
    "contextAwareness": true
  }'::jsonb,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'ultimate')),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Alarms table with smart scheduling capabilities
CREATE TABLE IF NOT EXISTS alarms (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  time TEXT NOT NULL, -- HH:MM format
  label TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  days INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- Array of day numbers (0-6)
  voice_mood TEXT DEFAULT 'motivational',
  snooze_count INTEGER DEFAULT 0,
  max_snoozes INTEGER DEFAULT 3,
  snooze_interval INTEGER DEFAULT 5, -- minutes
  last_triggered TIMESTAMPTZ,
  
  -- Smart scheduling features
  smart_enabled BOOLEAN DEFAULT false,
  adaptive_timing BOOLEAN DEFAULT false,
  gentle_wakeup BOOLEAN DEFAULT false,
  wake_window INTEGER DEFAULT 30, -- minutes before/after set time
  sleep_cycle_aware BOOLEAN DEFAULT false,
  
  -- Advanced settings
  escalation_enabled BOOLEAN DEFAULT false,
  escalation_steps JSONB DEFAULT '[
    {"delay": 30, "volume": 0.5, "vibration": false},
    {"delay": 60, "volume": 0.8, "vibration": true},
    {"delay": 120, "volume": 1.0, "vibration": true, "flashlight": true}
  ]'::jsonb,
  
  -- Custom messages and conditions
  custom_message TEXT,
  weather_dependent BOOLEAN DEFAULT false,
  location_dependent BOOLEAN DEFAULT false,
  calendar_integration BOOLEAN DEFAULT false,
  
  -- Analytics
  success_rate FLOAT DEFAULT 0.0,
  average_response_time INTEGER DEFAULT 0, -- seconds
  effectiveness_score FLOAT DEFAULT 0.0,
  
  -- Metadata
  alarm_type TEXT DEFAULT 'standard' CHECK (alarm_type IN ('standard', 'smart', 'meditation', 'power_nap', 'workout')),
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Alarm events table with detailed tracking
CREATE TABLE IF NOT EXISTS alarm_events (
  id TEXT PRIMARY KEY,
  alarm_id TEXT REFERENCES alarms(id) ON DELETE CASCADE,
  fired_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ,
  response_time INTEGER, -- seconds until user interaction
  dismissed BOOLEAN DEFAULT false,
  snoozed BOOLEAN DEFAULT false,
  snooze_count INTEGER DEFAULT 0,
  user_action TEXT, -- 'dismissed', 'snoozed', 'ignored', 'auto_dismissed'
  dismiss_method TEXT, -- 'voice', 'button', 'shake', 'timeout', 'gesture'
  
  -- Context data
  device_type TEXT, -- 'mobile', 'web', 'pwa'
  battery_level INTEGER, -- percentage
  is_charging BOOLEAN,
  network_type TEXT, -- 'wifi', '4g', '5g', 'offline'
  ambient_light FLOAT, -- lux level if available
  
  -- Sleep data integration
  sleep_stage TEXT, -- 'light', 'deep', 'rem', 'awake', 'unknown'
  estimated_sleep_quality FLOAT, -- 0-100 score
  time_since_sleep INTEGER, -- minutes
  
  -- Performance metrics
  app_load_time INTEGER, -- milliseconds
  notification_delay INTEGER, -- milliseconds
  audio_played BOOLEAN DEFAULT false,
  vibration_triggered BOOLEAN DEFAULT false,
  
  -- Effectiveness tracking
  user_feedback TEXT, -- 'too_early', 'perfect', 'too_late', 'no_feedback'
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Voices table
CREATE TABLE IF NOT EXISTS voices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'elevenlabs', 'google', 'azure', 'system', etc.
  voice_id TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  subscription_required TEXT DEFAULT 'free' CHECK (subscription_required IN ('free', 'premium', 'ultimate')),
  language_code TEXT DEFAULT 'en-US',
  gender TEXT CHECK (gender IN ('male', 'female', 'neutral')),
  age_range TEXT CHECK (age_range IN ('child', 'adult', 'senior')),
  accent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced User voice preferences with AI learning
CREATE TABLE IF NOT EXISTS user_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  voice_mood TEXT NOT NULL,
  voice_id TEXT REFERENCES voices(id),
  custom_message TEXT,
  
  -- AI personalization
  personality_traits JSONB DEFAULT '{}'::jsonb,
  effectiveness_score FLOAT DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  
  -- Voice synthesis settings
  speech_rate FLOAT DEFAULT 1.0,
  pitch FLOAT DEFAULT 1.0,
  volume FLOAT DEFAULT 0.8,
  emphasis_words TEXT[],
  pause_duration INTEGER DEFAULT 500, -- milliseconds
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, voice_mood)
);

-- Sleep pattern tracking table
CREATE TABLE IF NOT EXISTS sleep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sleep_start TIMESTAMPTZ NOT NULL,
  sleep_end TIMESTAMPTZ NOT NULL,
  
  -- Sleep metrics
  total_duration INTEGER NOT NULL, -- minutes
  deep_sleep_duration INTEGER, -- minutes
  light_sleep_duration INTEGER, -- minutes
  rem_sleep_duration INTEGER, -- minutes
  awake_duration INTEGER DEFAULT 0, -- minutes
  
  -- Quality metrics
  sleep_efficiency FLOAT, -- percentage
  restfulness_score FLOAT, -- 0-100
  movements_count INTEGER DEFAULT 0,
  interruptions_count INTEGER DEFAULT 0,
  
  -- Environmental factors
  ambient_temperature FLOAT,
  humidity FLOAT,
  noise_level FLOAT,
  light_exposure FLOAT,
  
  -- Data sources
  data_source TEXT DEFAULT 'manual', -- 'manual', 'device', 'app', 'wearable'
  confidence_score FLOAT DEFAULT 1.0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Smart recommendations table
CREATE TABLE IF NOT EXISTS smart_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL, -- 'alarm_time', 'voice_mood', 'bedtime', 'schedule'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Recommendation data
  suggested_value JSONB NOT NULL,
  confidence_score FLOAT NOT NULL,
  reasoning TEXT,
  data_points INTEGER DEFAULT 0,
  
  -- User interaction
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'ignored')),
  applied_at TIMESTAMPTZ,
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
  
  -- Metadata
  expires_at TIMESTAMPTZ,
  priority INTEGER DEFAULT 1,
  category TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance analytics table
CREATE TABLE IF NOT EXISTS performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  
  -- Performance metrics
  metric_name TEXT NOT NULL,
  metric_value FLOAT NOT NULL,
  metric_unit TEXT,
  
  -- Context
  page_path TEXT,
  user_agent TEXT,
  device_type TEXT,
  network_type TEXT,
  
  -- Timing
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error logs table for enhanced debugging
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Error details
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_category TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Context
  page_path TEXT,
  user_agent TEXT,
  device_info JSONB,
  app_version TEXT,
  
  -- Resolution
  resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  
  -- Aggregation
  fingerprint TEXT,
  occurrence_count INTEGER DEFAULT 1,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced indexes for performance optimization

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_timezone ON users(timezone);

CREATE INDEX IF NOT EXISTS idx_alarms_user_id ON alarms(user_id);
CREATE INDEX IF NOT EXISTS idx_alarms_enabled ON alarms(enabled);
CREATE INDEX IF NOT EXISTS idx_alarms_smart_enabled ON alarms(smart_enabled);
CREATE INDEX IF NOT EXISTS idx_alarms_type ON alarms(alarm_type);
CREATE INDEX IF NOT EXISTS idx_alarms_next_trigger ON alarms(user_id, enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_alarms_effectiveness ON alarms(effectiveness_score DESC);

CREATE INDEX IF NOT EXISTS idx_alarm_events_alarm_id ON alarm_events(alarm_id);
CREATE INDEX IF NOT EXISTS idx_alarm_events_fired_at ON alarm_events(fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_alarm_events_user_action ON alarm_events(user_action);
CREATE INDEX IF NOT EXISTS idx_alarm_events_effectiveness ON alarm_events(effectiveness_rating);
CREATE INDEX IF NOT EXISTS idx_alarm_events_response_time ON alarm_events(response_time);

CREATE INDEX IF NOT EXISTS idx_user_voices_user_id ON user_voices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_voices_effectiveness ON user_voices(effectiveness_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_voices_usage ON user_voices(usage_count DESC);

-- Sleep tracking indexes
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_user_id ON sleep_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_date ON sleep_sessions(user_id, sleep_start DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_efficiency ON sleep_sessions(sleep_efficiency DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_quality ON sleep_sessions(restfulness_score DESC);

-- Recommendations indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON smart_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON smart_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON smart_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON smart_recommendations(priority DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_expires ON smart_recommendations(expires_at) WHERE expires_at IS NOT NULL;

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_performance_user_id ON performance_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_session ON performance_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metric ON performance_analytics(metric_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_analytics(timestamp DESC);

-- Error logging indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_fingerprint ON error_logs(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(error_category, created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_alarms_user_enabled_time ON alarms(user_id, enabled, time) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_events_alarm_recent ON alarm_events(alarm_id, fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_user_recent ON sleep_sessions(user_id, sleep_start DESC);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_alarms_label_search ON alarms USING gin(to_tsvector('english', label));
CREATE INDEX IF NOT EXISTS idx_recommendations_search ON smart_recommendations USING gin(to_tsvector('english', title || ' ' || description));

-- Partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_active_alarms_only ON alarms(user_id, time, days) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_pending_recommendations ON smart_recommendations(user_id, priority DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_recent_events ON alarm_events(alarm_id, fired_at DESC) WHERE fired_at > NOW() - INTERVAL '30 days';

-- Enhanced Functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate alarm effectiveness
CREATE OR REPLACE FUNCTION calculate_alarm_effectiveness(alarm_uuid TEXT)
RETURNS FLOAT AS $$
DECLARE
    total_events INTEGER;
    successful_events INTEGER;
    avg_response_time FLOAT;
    effectiveness FLOAT;
BEGIN
    -- Get event counts
    SELECT COUNT(*) INTO total_events 
    FROM alarm_events 
    WHERE alarm_id = alarm_uuid AND fired_at > NOW() - INTERVAL '30 days';
    
    IF total_events = 0 THEN
        RETURN 0.0;
    END IF;
    
    -- Count successful dismissals (not snoozed or ignored)
    SELECT COUNT(*) INTO successful_events
    FROM alarm_events
    WHERE alarm_id = alarm_uuid 
      AND fired_at > NOW() - INTERVAL '30 days'
      AND dismissed = true 
      AND user_action = 'dismissed';
    
    -- Get average response time (in seconds)
    SELECT AVG(response_time) INTO avg_response_time
    FROM alarm_events
    WHERE alarm_id = alarm_uuid 
      AND fired_at > NOW() - INTERVAL '30 days'
      AND response_time IS NOT NULL;
    
    -- Calculate effectiveness score (0-100)
    effectiveness := (successful_events::FLOAT / total_events) * 100;
    
    -- Adjust based on response time (faster response = higher effectiveness)
    IF avg_response_time IS NOT NULL THEN
        -- Penalty for slow responses (over 60 seconds)
        IF avg_response_time > 60 THEN
            effectiveness := effectiveness * (1 - (avg_response_time - 60) / 300);
        END IF;
    END IF;
    
    RETURN GREATEST(0, LEAST(100, effectiveness));
END;
$$ LANGUAGE plpgsql;

-- Function to update alarm effectiveness scores
CREATE OR REPLACE FUNCTION update_alarm_effectiveness()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the alarm's effectiveness score
    UPDATE alarms 
    SET effectiveness_score = calculate_alarm_effectiveness(NEW.alarm_id),
        updated_at = NOW()
    WHERE id = NEW.alarm_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate smart recommendations
CREATE OR REPLACE FUNCTION generate_smart_recommendations(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    user_rec RECORD;
    avg_sleep_duration FLOAT;
    optimal_bedtime TIME;
    rec_exists BOOLEAN;
BEGIN
    -- Get user data
    SELECT * INTO user_rec FROM users WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Skip if user doesn't want smart recommendations
    IF NOT (user_rec.preferences->>'smartScheduling')::BOOLEAN THEN
        RETURN;
    END IF;
    
    -- Calculate average sleep duration from last 14 days
    SELECT AVG(total_duration) INTO avg_sleep_duration
    FROM sleep_sessions
    WHERE user_id = target_user_id
      AND sleep_start > NOW() - INTERVAL '14 days';
    
    -- Generate bedtime recommendation if sleep data exists
    IF avg_sleep_duration IS NOT NULL AND avg_sleep_duration < 420 THEN -- Less than 7 hours
        -- Check if recommendation already exists
        SELECT EXISTS(
            SELECT 1 FROM smart_recommendations
            WHERE user_id = target_user_id
              AND recommendation_type = 'bedtime'
              AND status = 'pending'
              AND created_at > NOW() - INTERVAL '7 days'
        ) INTO rec_exists;
        
        IF NOT rec_exists THEN
            INSERT INTO smart_recommendations (
                user_id, recommendation_type, title, description,
                suggested_value, confidence_score, reasoning,
                expires_at, priority
            ) VALUES (
                target_user_id,
                'bedtime',
                'Earlier Bedtime Recommended',
                'Based on your sleep patterns, going to bed 30-60 minutes earlier could improve your sleep quality.',
                json_build_object('adjustment', -45, 'target_duration', 480),
                0.8,
                'Average sleep duration below 7 hours for past 14 days',
                NOW() + INTERVAL '7 days',
                2
            );
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS VOID AS $$
BEGIN
    -- Delete old alarm events (older than 6 months)
    DELETE FROM alarm_events WHERE fired_at < NOW() - INTERVAL '6 months';
    
    -- Delete old performance analytics (older than 3 months)
    DELETE FROM performance_analytics WHERE created_at < NOW() - INTERVAL '3 months';
    
    -- Delete resolved error logs (older than 1 month)
    DELETE FROM error_logs WHERE resolved = true AND resolved_at < NOW() - INTERVAL '1 month';
    
    -- Delete expired recommendations
    DELETE FROM smart_recommendations WHERE expires_at < NOW();
    
    -- Archive old sleep sessions (older than 1 year) - in a real scenario, you might move to archive table
    DELETE FROM sleep_sessions WHERE sleep_start < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update timestamps
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alarms_updated_at ON alarms;
CREATE TRIGGER update_alarms_updated_at
    BEFORE UPDATE ON alarms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_voices_updated_at ON user_voices;
CREATE TRIGGER update_user_voices_updated_at
    BEFORE UPDATE ON user_voices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recommendations_updated_at ON smart_recommendations;
CREATE TRIGGER update_recommendations_updated_at
    BEFORE UPDATE ON smart_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update alarm effectiveness after events
DROP TRIGGER IF EXISTS update_alarm_effectiveness_trigger ON alarm_events;
CREATE TRIGGER update_alarm_effectiveness_trigger
    AFTER INSERT OR UPDATE ON alarm_events
    FOR EACH ROW
    EXECUTE FUNCTION update_alarm_effectiveness();

-- Trigger to update user last_active
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET last_active = NOW() WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_last_active_on_alarm_event ON alarm_events;
CREATE TRIGGER update_last_active_on_alarm_event
    AFTER INSERT ON alarm_events
    FOR EACH ROW
    EXECUTE FUNCTION update_user_last_active();

-- Enhanced Row Level Security (RLS) Policies

-- Enable RLS for all user tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Alarms policies
CREATE POLICY "Users can view own alarms" ON alarms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alarms" ON alarms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alarms" ON alarms
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alarms" ON alarms
    FOR DELETE USING (auth.uid() = user_id);

-- Alarm events policies
CREATE POLICY "Users can view own alarm events" ON alarm_events
    FOR SELECT USING (
        auth.uid() = (
            SELECT user_id FROM alarms WHERE alarms.id = alarm_events.alarm_id
        )
    );

CREATE POLICY "Users can insert own alarm events" ON alarm_events
    FOR INSERT WITH CHECK (
        auth.uid() = (
            SELECT user_id FROM alarms WHERE alarms.id = alarm_events.alarm_id
        )
    );

-- User voices policies
CREATE POLICY "Users can view own voice preferences" ON user_voices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own voice preferences" ON user_voices
    FOR ALL USING (auth.uid() = user_id);

-- Sleep sessions policies
CREATE POLICY "Users can view own sleep data" ON sleep_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sleep data" ON sleep_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sleep data" ON sleep_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sleep data" ON sleep_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Smart recommendations policies
CREATE POLICY "Users can view own recommendations" ON smart_recommendations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations" ON smart_recommendations
    FOR UPDATE USING (auth.uid() = user_id);

-- Performance analytics policies (insert only for users, admin can read all)
CREATE POLICY "Users can insert own analytics" ON performance_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics" ON performance_analytics
    FOR SELECT USING (auth.uid() = user_id);

-- Error logs policies (insert only, admin read)
CREATE POLICY "Users can insert own errors" ON error_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own errors" ON error_logs
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Voices table is public read (no user-specific data)
ALTER TABLE voices DISABLE ROW LEVEL SECURITY;

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Enhanced views for analytics and insights

-- Comprehensive user alarm statistics
CREATE OR REPLACE VIEW user_alarm_stats AS
SELECT 
    u.id as user_id,
    u.email,
    u.subscription_tier,
    u.timezone,
    
    -- Alarm counts
    COUNT(a.id) as total_alarms,
    COUNT(CASE WHEN a.enabled = true THEN 1 END) as active_alarms,
    COUNT(CASE WHEN a.smart_enabled = true THEN 1 END) as smart_alarms,
    COUNT(CASE WHEN a.alarm_type = 'standard' THEN 1 END) as standard_alarms,
    
    -- Event statistics
    COUNT(ae.id) as total_events,
    COUNT(CASE WHEN ae.dismissed = true THEN 1 END) as dismissed_count,
    COUNT(CASE WHEN ae.snoozed = true THEN 1 END) as snoozed_count,
    COUNT(CASE WHEN ae.user_action = 'ignored' THEN 1 END) as ignored_count,
    
    -- Performance metrics
    AVG(CASE WHEN ae.dismissed = true THEN 1.0 ELSE 0.0 END) as dismiss_rate,
    AVG(ae.response_time) as avg_response_time,
    AVG(a.effectiveness_score) as avg_effectiveness,
    
    -- Recent activity (last 30 days)
    COUNT(CASE WHEN ae.fired_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_events,
    
    -- Last activity
    MAX(ae.fired_at) as last_alarm_triggered,
    u.last_active
    
FROM users u
LEFT JOIN alarms a ON u.id = a.user_id
LEFT JOIN alarm_events ae ON a.id = ae.alarm_id
GROUP BY u.id, u.email, u.subscription_tier, u.timezone, u.last_active;

-- Sleep quality insights view
CREATE OR REPLACE VIEW sleep_quality_insights AS
SELECT 
    user_id,
    COUNT(*) as total_sessions,
    AVG(total_duration) as avg_sleep_duration,
    AVG(sleep_efficiency) as avg_sleep_efficiency,
    AVG(restfulness_score) as avg_restfulness,
    AVG(deep_sleep_duration) as avg_deep_sleep,
    AVG(rem_sleep_duration) as avg_rem_sleep,
    
    -- Trend analysis (last 7 vs previous 7 days)
    AVG(CASE WHEN sleep_start > NOW() - INTERVAL '7 days' THEN restfulness_score END) as recent_quality,
    AVG(CASE WHEN sleep_start BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days' 
         THEN restfulness_score END) as previous_quality,
    
    -- Sleep consistency
    STDDEV(total_duration) as sleep_duration_variance,
    
    -- Data quality
    AVG(confidence_score) as data_reliability,
    
    MIN(sleep_start) as first_recorded,
    MAX(sleep_start) as last_recorded
    
FROM sleep_sessions
WHERE sleep_start > NOW() - INTERVAL '90 days'
GROUP BY user_id;

-- Alarm effectiveness by time and conditions
CREATE OR REPLACE VIEW alarm_effectiveness_insights AS
SELECT 
    a.user_id,
    a.alarm_type,
    a.voice_mood,
    EXTRACT(hour FROM a.time::time) as alarm_hour,
    
    -- Effectiveness metrics
    COUNT(ae.id) as total_triggers,
    AVG(a.effectiveness_score) as avg_effectiveness,
    AVG(ae.response_time) as avg_response_time,
    
    -- Success rates by method
    COUNT(CASE WHEN ae.dismiss_method = 'voice' THEN 1 END) as voice_dismissals,
    COUNT(CASE WHEN ae.dismiss_method = 'button' THEN 1 END) as button_dismissals,
    COUNT(CASE WHEN ae.dismiss_method = 'shake' THEN 1 END) as shake_dismissals,
    
    -- Contextual success rates
    AVG(CASE WHEN ae.device_type = 'mobile' THEN ae.effectiveness_rating END) as mobile_effectiveness,
    AVG(CASE WHEN ae.device_type = 'web' THEN ae.effectiveness_rating END) as web_effectiveness,
    
    -- Environmental factors
    AVG(CASE WHEN ae.ambient_light > 100 THEN ae.effectiveness_rating END) as bright_environment_effectiveness,
    AVG(CASE WHEN ae.ambient_light <= 100 THEN ae.effectiveness_rating END) as dim_environment_effectiveness
    
FROM alarms a
JOIN alarm_events ae ON a.id = ae.alarm_id
WHERE ae.fired_at > NOW() - INTERVAL '90 days'
GROUP BY a.user_id, a.alarm_type, a.voice_mood, EXTRACT(hour FROM a.time::time);

-- Smart recommendations analytics
CREATE OR REPLACE VIEW recommendation_analytics AS
SELECT 
    recommendation_type,
    COUNT(*) as total_recommendations,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN status = 'ignored' THEN 1 END) as ignored_count,
    
    -- Acceptance rates
    AVG(CASE WHEN status = 'accepted' THEN 1.0 ELSE 0.0 END) as acceptance_rate,
    AVG(confidence_score) as avg_confidence,
    AVG(effectiveness_rating) as avg_effectiveness_rating,
    
    -- Timing
    AVG(EXTRACT(epoch FROM (applied_at - created_at))/3600) as avg_hours_to_apply,
    
    COUNT(DISTINCT user_id) as unique_users
    
FROM smart_recommendations
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY recommendation_type;

-- Insert enhanced default voices with better configurations
INSERT INTO voices (id, name, provider, voice_id, config, subscription_required, gender, language_code) VALUES
    ('drill-sergeant-default', 'Drill Sergeant (Default)', 'system', 'system-male-assertive', 
     '{"rate": 1.2, "pitch": 0.8, "volume": 0.9, "emphasis": ["NOW", "UP", "TIME"], "energy": "high"}', 'free', 'male', 'en-US'),
    ('sweet-angel-default', 'Sweet Angel (Default)', 'system', 'system-female-gentle', 
     '{"rate": 0.9, "pitch": 1.2, "volume": 0.7, "emphasis": ["sweetie", "time", "wake"], "energy": "low"}', 'free', 'female', 'en-US'),
    ('anime-hero-default', 'Anime Hero (Default)', 'system', 'system-male-energetic', 
     '{"rate": 1.1, "pitch": 1.1, "volume": 0.8, "emphasis": ["power", "adventure", "destiny"], "energy": "very_high"}', 'free', 'male', 'en-US'),
    ('savage-roast-default', 'Savage Roast (Default)', 'system', 'system-neutral-sarcastic', 
     '{"rate": 1.0, "pitch": 0.9, "volume": 0.8, "emphasis": ["seriously", "still", "really"], "energy": "medium"}', 'free', 'neutral', 'en-US'),
    ('motivational-default', 'Motivational (Default)', 'system', 'system-male-confident', 
     '{"rate": 1.0, "pitch": 1.0, "volume": 0.8, "emphasis": ["success", "achieve", "greatness"], "energy": "high"}', 'free', 'male', 'en-US'),
    ('gentle-default', 'Gentle (Default)', 'system', 'system-female-soft', 
     '{"rate": 0.8, "pitch": 1.1, "volume": 0.6, "emphasis": ["gently", "slowly", "peaceful"], "energy": "very_low"}', 'free', 'female', 'en-US'),
    
    -- Premium voices (require subscription)
    ('ai-coach-premium', 'AI Life Coach (Premium)', 'elevenlabs', 'voice-ai-coach-v1', 
     '{"rate": 1.0, "pitch": 1.0, "volume": 0.8, "model": "eleven_multilingual_v2", "stability": 0.7, "clarity": 0.8}', 'premium', 'neutral', 'en-US'),
    ('celebrity-morgan-premium', 'Morgan Freeman Style (Premium)', 'elevenlabs', 'voice-morgan-style', 
     '{"rate": 0.9, "pitch": 0.9, "volume": 0.8, "model": "eleven_multilingual_v2", "stability": 0.8, "clarity": 0.9}', 'premium', 'male', 'en-US'),
    ('meditation-master-premium', 'Meditation Master (Premium)', 'elevenlabs', 'voice-zen-master', 
     '{"rate": 0.7, "pitch": 1.0, "volume": 0.6, "model": "eleven_multilingual_v2", "stability": 0.9, "clarity": 0.7}', 'premium', 'neutral', 'en-US')
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Enhanced table and column documentation
COMMENT ON TABLE users IS 'Enhanced user profiles with sleep tracking and AI preferences';
COMMENT ON COLUMN users.sleep_profile IS 'User sleep preferences and targets for smart scheduling';
COMMENT ON COLUMN users.ai_settings IS 'AI personalization and learning preferences';
COMMENT ON COLUMN users.subscription_tier IS 'User subscription level affecting available features';

COMMENT ON TABLE alarms IS 'Enhanced alarms with smart scheduling and adaptive features';
COMMENT ON COLUMN alarms.smart_enabled IS 'Enable AI-powered smart scheduling for this alarm';
COMMENT ON COLUMN alarms.escalation_steps IS 'Progressive alarm escalation configuration';
COMMENT ON COLUMN alarms.effectiveness_score IS 'Calculated effectiveness score based on user interactions';

COMMENT ON TABLE alarm_events IS 'Comprehensive alarm event tracking with context and performance data';
COMMENT ON COLUMN alarm_events.sleep_stage IS 'Detected sleep stage when alarm triggered (if available)';
COMMENT ON COLUMN alarm_events.effectiveness_rating IS 'User-provided feedback on alarm effectiveness';

COMMENT ON TABLE sleep_sessions IS 'Sleep pattern tracking for smart alarm optimization';
COMMENT ON COLUMN sleep_sessions.sleep_efficiency IS 'Percentage of time in bed actually sleeping';
COMMENT ON COLUMN sleep_sessions.data_source IS 'Source of sleep data (manual, device, app, wearable)';

COMMENT ON TABLE smart_recommendations IS 'AI-generated recommendations for improving alarm effectiveness';
COMMENT ON COLUMN smart_recommendations.confidence_score IS 'AI confidence in the recommendation (0-1)';
COMMENT ON COLUMN smart_recommendations.effectiveness_rating IS 'User feedback on recommendation usefulness';

COMMENT ON TABLE performance_analytics IS 'Application performance metrics for optimization';
COMMENT ON TABLE error_logs IS 'Enhanced error tracking with categorization and resolution tracking';

COMMENT ON TABLE voices IS 'Available TTS voices with enhanced configuration options';
COMMENT ON TABLE user_voices IS 'Personalized voice preferences with AI learning capabilities';

-- Views documentation
COMMENT ON VIEW user_alarm_stats IS 'Comprehensive user alarm usage statistics and performance metrics';
COMMENT ON VIEW sleep_quality_insights IS 'Sleep quality analysis and trends for smart recommendations';
COMMENT ON VIEW alarm_effectiveness_insights IS 'Alarm effectiveness analysis by time, conditions, and methods';
COMMENT ON VIEW recommendation_analytics IS 'Smart recommendation performance and acceptance analytics';

-- Function documentation
COMMENT ON FUNCTION calculate_alarm_effectiveness(TEXT) IS 'Calculates alarm effectiveness score based on recent user interactions';
COMMENT ON FUNCTION generate_smart_recommendations(UUID) IS 'Generates personalized recommendations for a user based on their data';
COMMENT ON FUNCTION cleanup_old_data() IS 'Maintenance function to clean up old data and maintain performance';

-- Final setup message
DO $$
BEGIN
    RAISE NOTICE 'Enhanced Smart Alarm Database Schema v2.0 setup complete!';
    RAISE NOTICE 'Features enabled:';
    RAISE NOTICE '- Smart alarm scheduling with sleep pattern analysis';
    RAISE NOTICE '- AI-powered recommendations and personalization';
    RAISE NOTICE '- Comprehensive performance and error tracking';
    RAISE NOTICE '- Advanced analytics and insights';
    RAISE NOTICE '- Optimized indexes for better performance';
    RAISE NOTICE '- Automated maintenance and cleanup';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Configure environment variables for external services';
    RAISE NOTICE '2. Set up pg_cron for automated maintenance (optional)';
    RAISE NOTICE '3. Configure monitoring and alerting';
    RAISE NOTICE '4. Test with sample data';
END
$$;