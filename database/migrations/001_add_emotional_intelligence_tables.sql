-- Migration: Add Emotional Intelligence Tables
-- Description: Add tables required for emotional notification system
-- Dependencies: Requires existing users table

BEGIN;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Emotional States Table
-- Tracks user's emotional state over time based on behavior analysis
CREATE TABLE user_emotional_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emotion_type TEXT NOT NULL CHECK (emotion_type IN ('happy', 'sad', 'worried', 'excited', 'lonely', 'proud', 'sleepy')),
    intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    context JSONB NOT NULL DEFAULT '{}', -- {daysSinceLastUse, missedAlarms, brokenStreaks, etc.}
    triggers TEXT[] DEFAULT '{}', -- Array of trigger strings
    recommended_tone TEXT NOT NULL CHECK (recommended_tone IN ('encouraging', 'playful', 'firm', 'roast')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_user_emotional_states_user_id ON user_emotional_states(user_id);
CREATE INDEX idx_user_emotional_states_emotion_type ON user_emotional_states(emotion_type);
CREATE INDEX idx_user_emotional_states_created_at ON user_emotional_states(created_at);
CREATE INDEX idx_user_emotional_states_context ON user_emotional_states USING GIN(context);

-- Emotional Messages Table
-- Template library for emotional messages with effectiveness tracking
CREATE TABLE emotional_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emotion_type TEXT NOT NULL CHECK (emotion_type IN ('happy', 'sad', 'worried', 'excited', 'lonely', 'proud', 'sleepy')),
    tone TEXT NOT NULL CHECK (tone IN ('encouraging', 'playful', 'firm', 'roast')),
    template TEXT NOT NULL,
    variables JSONB DEFAULT '{}', -- Template variables like {name}, {streak_days}, etc.
    tags TEXT[] DEFAULT '{}', -- Categorization tags
    effectiveness_score DECIMAL(5,2) DEFAULT 0.0 CHECK (effectiveness_score >= 0.0),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for message templates
CREATE INDEX idx_emotional_messages_emotion_tone ON emotional_messages(emotion_type, tone);
CREATE INDEX idx_emotional_messages_effectiveness ON emotional_messages(effectiveness_score DESC);
CREATE INDEX idx_emotional_messages_usage ON emotional_messages(usage_count DESC);
CREATE INDEX idx_emotional_messages_tags ON emotional_messages USING GIN(tags);

-- Emotional Notification Logs Table
-- Track sent notifications and user responses for learning
CREATE TABLE emotional_notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES emotional_messages(id) ON DELETE SET NULL,
    emotion_type TEXT NOT NULL,
    tone TEXT NOT NULL,
    message_sent TEXT NOT NULL,
    escalation_level TEXT NOT NULL CHECK (escalation_level IN ('gentle', 'slightly_emotional', 'strong_emotional', 'social_pressure', 'major_reset')),
    
    -- Notification delivery
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'failed')),
    
    -- User response tracking
    notification_opened BOOLEAN DEFAULT FALSE,
    action_taken TEXT CHECK (action_taken IN ('dismissed', 'snoozed', 'opened_app', 'completed_task', 'none')),
    response_time_ms INTEGER, -- Time from notification to response
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    
    -- Analytics data
    deep_link TEXT,
    metadata JSONB DEFAULT '{}', -- Additional tracking data
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notification logs
CREATE INDEX idx_emotional_notification_logs_user_id ON emotional_notification_logs(user_id);
CREATE INDEX idx_emotional_notification_logs_sent_at ON emotional_notification_logs(sent_at);
CREATE INDEX idx_emotional_notification_logs_emotion_type ON emotional_notification_logs(emotion_type);
CREATE INDEX idx_emotional_notification_logs_action_taken ON emotional_notification_logs(action_taken);
CREATE INDEX idx_emotional_notification_logs_effectiveness ON emotional_notification_logs(effectiveness_rating);

-- User Emotional Profiles Table
-- Learned preferences and patterns for each user
CREATE TABLE user_emotional_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Learned preferences
    preferred_tones TEXT[] DEFAULT '{encouraging}',
    avoided_tones TEXT[] DEFAULT '{}',
    most_effective_emotions TEXT[] DEFAULT '{}',
    
    -- Response patterns
    response_patterns JSONB DEFAULT '{}', -- {bestTimeToSend, averageResponseTime, preferredEscalationSpeed}
    
    -- Effectiveness metrics
    average_effectiveness DECIMAL(3,2) DEFAULT 0.0,
    total_notifications_sent INTEGER DEFAULT 0,
    total_notifications_opened INTEGER DEFAULT 0,
    total_tasks_completed INTEGER DEFAULT 0,
    
    -- Learning data
    last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint and index for profiles
CREATE UNIQUE INDEX idx_user_emotional_profiles_user_id ON user_emotional_profiles(user_id);

-- Emotional Notification Schedule Table
-- Track scheduled notifications and frequency limits
CREATE TABLE emotional_notification_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    emotion_type TEXT NOT NULL,
    tone TEXT NOT NULL,
    escalation_level TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
    payload JSONB NOT NULL, -- Complete notification payload
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for scheduling
CREATE INDEX idx_emotional_notification_schedule_user_id ON emotional_notification_schedule(user_id);
CREATE INDEX idx_emotional_notification_schedule_scheduled_for ON emotional_notification_schedule(scheduled_for);
CREATE INDEX idx_emotional_notification_schedule_status ON emotional_notification_schedule(status);

-- Insert default emotional message templates
INSERT INTO emotional_messages (emotion_type, tone, template, tags) VALUES
-- Happy messages
('happy', 'encouraging', 'Look at you, {name}! {streak_days} days strong and crushing it! Keep shining! ⭐', ARRAY['streak', 'positive']),
('happy', 'playful', 'Someone''s becoming a morning person! Day {streak_days} of {name} being awesome! 😎', ARRAY['streak', 'fun']),
('happy', 'firm', '{streak_days} days, {name}. This is what discipline looks like. Keep building. 💪', ARRAY['streak', 'discipline']),
('happy', 'roast', 'Well, well, {name}. Look who''s actually functional. {streak_days} days without being a disaster. 👏', ARRAY['streak', 'sarcastic']),

-- Sad messages
('sad', 'encouraging', 'Hey {name}, I''m not angry... just disappointed. 😔 Remember when mornings used to be your thing?', ARRAY['comeback', 'gentle']),
('sad', 'playful', 'Psst {name}... your alarm is feeling lonely. Come rescue it! 🦸‍♂️', ARRAY['comeback', 'fun']),
('sad', 'firm', 'You skipped {missed_days} days, {name}. One push now, one streak saved later. 💪', ARRAY['comeback', 'direct']),
('sad', 'roast', '{name} — still sleeping? Your bed is winning. Show up. 😤', ARRAY['comeback', 'harsh']),

-- Worried messages
('worried', 'encouraging', 'It''s been {missed_days} days, {name}. Your alarm misses you. Ready for a comeback story? 💪', ARRAY['extended_absence', 'motivation']),
('worried', 'playful', 'Houston, we have a problem. {name} has been MIA for {missed_days} days. Mission: Rescue! 🚀', ARRAY['extended_absence', 'fun']),
('worried', 'firm', 'Week {missed_weeks}: Time to decide who you want to be, {name}. ⚡', ARRAY['extended_absence', 'serious']),
('worried', 'roast', '{name}, your motivation called. It''s filing for divorce. Irreconcilable differences. 💔', ARRAY['extended_absence', 'brutal']),

-- Excited messages
('excited', 'encouraging', '🎉 {name}, you just unlocked ''{achievement}''! Your friends are going to be so jealous!', ARRAY['achievement', 'celebration']),
('excited', 'playful', 'Someone''s on fire! 🔥 {name} just crushed another morning goal!', ARRAY['achievement', 'energetic']),
('excited', 'firm', '{achievement} earned, {name}. This is what happens when you commit. Keep going. 💪', ARRAY['achievement', 'discipline']),
('excited', 'roast', 'Holy plot twist! {name} actually achieved something: ''{achievement}''. Witnesses required. 📸', ARRAY['achievement', 'surprise']),

-- Lonely messages
('lonely', 'encouraging', 'Hey {name}, you don''t have to do this alone. Your morning wins matter, and so do you. 💙', ARRAY['isolation', 'support']),
('lonely', 'playful', 'Your alarm has been practicing its best encouraging voice just for you, {name}! 🎭', ARRAY['isolation', 'caring']),
('lonely', 'firm', 'Isolation ends now, {name}. Start with yourself. Show up. 💪', ARRAY['isolation', 'tough_love']),
('lonely', 'roast', '{name}, even your alarm feels sorry for you. That''s saying something. Wake up. 😅', ARRAY['isolation', 'humorous']),

-- Proud messages
('proud', 'encouraging', 'Incredible, {name}! {achievement} is HUGE! Look how far you''ve come! So proud! 🏆', ARRAY['major_milestone', 'pride']),
('proud', 'playful', 'ALERT: {name} just became legendary! {achievement} unlocked! Hall of fame entry! 🏛️', ARRAY['major_milestone', 'epic']),
('proud', 'firm', 'Respect, {name}. {achievement} is what happens when you refuse to quit. 🙌', ARRAY['major_milestone', 'respect']),
('proud', 'roast', 'Wait, WHAT?! {name} achieved {achievement}?! Who are you and what did you do with the old {name}? 🤯', ARRAY['major_milestone', 'shocked']),

-- Sleepy messages
('sleepy', 'encouraging', 'Gentle nudge, {name}. I know you''re tired, but your morning routine misses you. 🌙', ARRAY['sleep_issues', 'gentle']),
('sleepy', 'playful', 'Sleepy {name} vs Morning Goals: Round 1! Who will win today? 🥊', ARRAY['sleep_issues', 'game']),
('sleepy', 'firm', 'Sleep debt paid, {name}. Time to invest in your future. Get up. 💪', ARRAY['sleep_issues', 'firm']),
('sleepy', 'roast', '{name}, your sleep schedule called - it''s filing for unemployment. Too much work lately. 😂', ARRAY['sleep_issues', 'funny']);

-- Create function to update effectiveness scores
CREATE OR REPLACE FUNCTION update_message_effectiveness()
RETURNS TRIGGER AS $$
BEGIN
    -- Update effectiveness score based on user response
    IF NEW.effectiveness_rating IS NOT NULL AND OLD.effectiveness_rating IS NULL THEN
        UPDATE emotional_messages 
        SET 
            effectiveness_score = (
                (effectiveness_score * usage_count + NEW.effectiveness_rating) / 
                (usage_count + 1)
            ),
            usage_count = usage_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.message_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic effectiveness updates
CREATE TRIGGER trigger_update_message_effectiveness
    AFTER UPDATE ON emotional_notification_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_message_effectiveness();

-- Create function to update user emotional profile
CREATE OR REPLACE FUNCTION update_user_emotional_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user emotional profile based on notification response
    INSERT INTO user_emotional_profiles (
        user_id, 
        total_notifications_sent,
        total_notifications_opened,
        total_tasks_completed,
        last_analyzed
    )
    VALUES (
        NEW.user_id,
        1,
        CASE WHEN NEW.notification_opened THEN 1 ELSE 0 END,
        CASE WHEN NEW.action_taken = 'completed_task' THEN 1 ELSE 0 END,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_notifications_sent = user_emotional_profiles.total_notifications_sent + 1,
        total_notifications_opened = user_emotional_profiles.total_notifications_opened + 
            (CASE WHEN NEW.notification_opened THEN 1 ELSE 0 END),
        total_tasks_completed = user_emotional_profiles.total_tasks_completed + 
            (CASE WHEN NEW.action_taken = 'completed_task' THEN 1 ELSE 0 END),
        average_effectiveness = (
            (user_emotional_profiles.average_effectiveness * user_emotional_profiles.total_notifications_sent + 
             COALESCE(NEW.effectiveness_rating, 0)) / 
            (user_emotional_profiles.total_notifications_sent + 1)
        ),
        last_analyzed = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic profile updates
CREATE TRIGGER trigger_update_user_emotional_profile
    AFTER INSERT ON emotional_notification_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_user_emotional_profile();

-- Create view for emotional analytics
CREATE VIEW emotional_analytics AS
SELECT 
    u.id as user_id,
    u.email,
    p.total_notifications_sent,
    p.total_notifications_opened,
    p.total_tasks_completed,
    p.average_effectiveness,
    ROUND(
        (p.total_notifications_opened::decimal / NULLIF(p.total_notifications_sent, 0)) * 100, 
        2
    ) as open_rate_percent,
    ROUND(
        (p.total_tasks_completed::decimal / NULLIF(p.total_notifications_opened, 0)) * 100, 
        2
    ) as completion_rate_percent,
    p.preferred_tones,
    p.most_effective_emotions,
    p.last_analyzed
FROM users u
LEFT JOIN user_emotional_profiles p ON u.id = p.user_id;

-- Grant permissions (adjust as needed for your role structure)
-- GRANT SELECT, INSERT, UPDATE ON emotional_notification_logs TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON user_emotional_profiles TO authenticated;
-- GRANT SELECT ON emotional_messages TO authenticated;
-- GRANT SELECT ON emotional_analytics TO authenticated;

-- Add RLS policies if using Row Level Security
-- ALTER TABLE user_emotional_states ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE emotional_notification_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_emotional_profiles ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view their own emotional data" ON user_emotional_states
--     FOR SELECT USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert their own emotional data" ON user_emotional_states
--     FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMIT;