-- Smart Alarm Database Schema for Supabase
-- Run this in your Supabase SQL editor to set up the database

-- Enable Row Level Security
ALTER DATABASE postgres SET \"app.jwt_secret\" TO 'your-jwt-secret';

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  preferences JSONB DEFAULT '{
    \"theme\": \"auto\",
    \"notificationsEnabled\": true,
    \"voiceDismissalSensitivity\": 5,
    \"defaultVoiceMood\": \"motivational\",
    \"hapticFeedback\": true,
    \"snoozeMinutes\": 5,
    \"maxSnoozes\": 3
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alarms table
CREATE TABLE IF NOT EXISTS alarms (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  time TEXT NOT NULL, -- HH:MM format
  label TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  days INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- Array of day numbers (0-6)
  voice_mood TEXT DEFAULT 'motivational',
  snooze_count INTEGER DEFAULT 0,
  last_triggered TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alarm events table for tracking
CREATE TABLE IF NOT EXISTS alarm_events (
  id TEXT PRIMARY KEY,
  alarm_id TEXT REFERENCES alarms(id) ON DELETE CASCADE,
  fired_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT false,
  snoozed BOOLEAN DEFAULT false,
  user_action TEXT, -- 'dismissed', 'snoozed', 'ignored'
  dismiss_method TEXT -- 'voice', 'button', 'shake'
);

-- Voices table for future TTS integration
CREATE TABLE IF NOT EXISTS voices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'elevenlabs', 'google', 'azure', etc.
  voice_id TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User voice preferences
CREATE TABLE IF NOT EXISTS user_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  voice_mood TEXT NOT NULL,
  voice_id TEXT REFERENCES voices(id),
  custom_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, voice_mood)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alarms_user_id ON alarms(user_id);
CREATE INDEX IF NOT EXISTS idx_alarms_enabled ON alarms(enabled);
CREATE INDEX IF NOT EXISTS idx_alarm_events_alarm_id ON alarm_events(alarm_id);
CREATE INDEX IF NOT EXISTS idx_alarm_events_fired_at ON alarm_events(fired_at);
CREATE INDEX IF NOT EXISTS idx_user_voices_user_id ON user_voices(user_id);

-- Functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_voices ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY \"Users can view own profile\" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY \"Users can update own profile\" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY \"Users can insert own profile\" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Alarms policies
CREATE POLICY \"Users can view own alarms\" ON alarms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY \"Users can insert own alarms\" ON alarms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY \"Users can update own alarms\" ON alarms
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY \"Users can delete own alarms\" ON alarms
    FOR DELETE USING (auth.uid() = user_id);

-- Alarm events policies
CREATE POLICY \"Users can view own alarm events\" ON alarm_events
    FOR SELECT USING (
        auth.uid() = (
            SELECT user_id FROM alarms WHERE alarms.id = alarm_events.alarm_id
        )
    );

CREATE POLICY \"Users can insert own alarm events\" ON alarm_events
    FOR INSERT WITH CHECK (
        auth.uid() = (
            SELECT user_id FROM alarms WHERE alarms.id = alarm_events.alarm_id
        )
    );

-- User voices policies
CREATE POLICY \"Users can view own voice preferences\" ON user_voices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY \"Users can manage own voice preferences\" ON user_voices
    FOR ALL USING (auth.uid() = user_id);

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

-- Insert default voices
INSERT INTO voices (id, name, provider, voice_id, config) VALUES
    ('drill-sergeant-default', 'Drill Sergeant (Default)', 'system', 'system-male-assertive', '{\"rate\": 1.2, \"pitch\": 0.8}'),
    ('sweet-angel-default', 'Sweet Angel (Default)', 'system', 'system-female-gentle', '{\"rate\": 0.9, \"pitch\": 1.2}'),
    ('anime-hero-default', 'Anime Hero (Default)', 'system', 'system-male-energetic', '{\"rate\": 1.1, \"pitch\": 1.1}'),
    ('savage-roast-default', 'Savage Roast (Default)', 'system', 'system-neutral-sarcastic', '{\"rate\": 1.0, \"pitch\": 0.9}'),
    ('motivational-default', 'Motivational (Default)', 'system', 'system-male-confident', '{\"rate\": 1.0, \"pitch\": 1.0}'),
    ('gentle-default', 'Gentle (Default)', 'system', 'system-female-soft', '{\"rate\": 0.8, \"pitch\": 1.1}')
ON CONFLICT (id) DO NOTHING;

-- Create a view for alarm statistics
CREATE OR REPLACE VIEW user_alarm_stats AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(a.id) as total_alarms,
    COUNT(CASE WHEN a.enabled = true THEN 1 END) as active_alarms,
    COUNT(ae.id) as total_events,
    COUNT(CASE WHEN ae.dismissed = true THEN 1 END) as dismissed_count,
    COUNT(CASE WHEN ae.snoozed = true THEN 1 END) as snoozed_count,
    AVG(CASE WHEN ae.dismissed = true THEN 1.0 ELSE 0.0 END) as dismiss_rate
FROM users u
LEFT JOIN alarms a ON u.id = a.user_id
LEFT JOIN alarm_events ae ON a.id = ae.alarm_id
GROUP BY u.id, u.email;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Comment on tables for documentation
COMMENT ON TABLE users IS 'User profiles and preferences';
COMMENT ON TABLE alarms IS 'User-created alarms with scheduling information';
COMMENT ON TABLE alarm_events IS 'Log of alarm triggers and user interactions';
COMMENT ON TABLE voices IS 'Available TTS voices and configurations';
COMMENT ON TABLE user_voices IS 'User-specific voice preferences and custom messages';
COMMENT ON VIEW user_alarm_stats IS 'Aggregated statistics for user alarm usage';