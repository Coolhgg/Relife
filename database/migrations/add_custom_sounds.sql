-- Migration: Add custom sounds support
-- This adds the custom_sounds table and updates the alarms table to support custom sound selection

-- Create storage bucket for audio files (if not exists)
-- Note: This needs to be run as a Supabase admin or through the dashboard
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-files',
    'audio-files',
    true,
    10485760, -- 10MB limit
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a']
) ON CONFLICT (id) DO NOTHING;

-- Create custom_sounds table
CREATE TABLE IF NOT EXISTS custom_sounds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    duration INTEGER NOT NULL, -- duration in seconds
    category TEXT NOT NULL DEFAULT 'custom',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_custom BOOLEAN DEFAULT true,
    uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    downloads INTEGER DEFAULT 0,
    rating REAL DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add custom sound support to alarms table
ALTER TABLE alarms 
ADD COLUMN IF NOT EXISTS sound_type TEXT DEFAULT 'voice-only' 
    CHECK (sound_type IN ('built-in', 'custom', 'voice-only'));

ALTER TABLE alarms 
ADD COLUMN IF NOT EXISTS custom_sound_id TEXT REFERENCES custom_sounds(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_sounds_uploaded_by ON custom_sounds(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_custom_sounds_category ON custom_sounds(category);
CREATE INDEX IF NOT EXISTS idx_custom_sounds_uploaded_at ON custom_sounds(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_alarms_custom_sound_id ON alarms(custom_sound_id);
CREATE INDEX IF NOT EXISTS idx_alarms_sound_type ON alarms(sound_type);

-- Enable RLS for custom_sounds
ALTER TABLE custom_sounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_sounds
CREATE POLICY "Users can view own custom sounds" ON custom_sounds
    FOR SELECT USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can insert own custom sounds" ON custom_sounds
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own custom sounds" ON custom_sounds
    FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete own custom sounds" ON custom_sounds
    FOR DELETE USING (auth.uid() = uploaded_by);

-- Allow users to view public custom sounds (for future sharing feature)
CREATE POLICY "Users can view public custom sounds" ON custom_sounds
    FOR SELECT USING (
        -- For now, only allow users to see their own sounds
        -- This can be expanded later for public sound sharing
        auth.uid() = uploaded_by
    );

-- Storage policies for audio-files bucket
-- Note: These policies need to be set up in Supabase dashboard or via SQL
-- Users can upload files to their own folder
INSERT INTO storage.policies (name, bucket_id, operation, policy)
VALUES (
    'Users can upload own audio files',
    'audio-files',
    'INSERT',
    'auth.uid()::text = (storage.foldername(name))[1]'
) ON CONFLICT DO NOTHING;

-- Users can view their own audio files
INSERT INTO storage.policies (name, bucket_id, operation, policy)
VALUES (
    'Users can view own audio files',
    'audio-files',
    'SELECT',
    'auth.uid()::text = (storage.foldername(name))[1]'
) ON CONFLICT DO NOTHING;

-- Users can delete their own audio files
INSERT INTO storage.policies (name, bucket_id, operation, policy)
VALUES (
    'Users can delete own audio files',
    'audio-files',
    'DELETE',
    'auth.uid()::text = (storage.foldername(name))[1]'
) ON CONFLICT DO NOTHING;

-- Add trigger for updated_at on custom_sounds
DROP TRIGGER IF EXISTS update_custom_sounds_updated_at ON custom_sounds;
CREATE TRIGGER update_custom_sounds_updated_at
    BEFORE UPDATE ON custom_sounds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default built-in sounds (optional)
INSERT INTO custom_sounds (
    id, name, description, file_name, file_url, duration, category, tags, is_custom, uploaded_by
) VALUES
    ('builtin_gentle_bells', 'Gentle Bells', 'Soft chiming bells for a peaceful wake-up', 'gentle_bells.mp3', '/sounds/gentle_bells.mp3', 30, 'calm', ARRAY['gentle', 'bells', 'peaceful'], false, NULL),
    ('builtin_nature_birds', 'Morning Birds', 'Cheerful bird sounds from a forest morning', 'morning_birds.mp3', '/sounds/morning_birds.mp3', 45, 'nature', ARRAY['nature', 'birds', 'morning'], false, NULL),
    ('builtin_energetic_beep', 'Classic Alarm', 'Traditional alarm beeping sound', 'classic_beep.mp3', '/sounds/classic_beep.mp3', 20, 'mechanical', ARRAY['classic', 'beep', 'traditional'], false, NULL),
    ('builtin_ocean_waves', 'Ocean Waves', 'Gradually intensifying ocean waves', 'ocean_waves.mp3', '/sounds/ocean_waves.mp3', 60, 'nature', ARRAY['ocean', 'waves', 'nature'], false, NULL)
ON CONFLICT (id) DO NOTHING;

-- Update existing alarms to have default sound_type if not set
UPDATE alarms 
SET sound_type = 'voice-only' 
WHERE sound_type IS NULL;

-- Add some helpful comments
COMMENT ON TABLE custom_sounds IS 'User uploaded custom alarm sounds and built-in sound library';
COMMENT ON COLUMN custom_sounds.duration IS 'Duration of the audio file in seconds';
COMMENT ON COLUMN custom_sounds.category IS 'Sound category: nature, music, voice, mechanical, ambient, energetic, calm, custom';
COMMENT ON COLUMN custom_sounds.file_url IS 'Public URL to the audio file in storage';
COMMENT ON COLUMN alarms.sound_type IS 'Type of sound to play: built-in, custom, or voice-only';
COMMENT ON COLUMN alarms.custom_sound_id IS 'Reference to custom_sounds table when sound_type is custom';

-- Create a view for user sound statistics
CREATE OR REPLACE VIEW user_sound_stats AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(cs.id) as total_custom_sounds,
    COALESCE(SUM(cs.duration), 0) as total_duration_seconds,
    COUNT(CASE WHEN cs.category = 'custom' THEN 1 END) as uploaded_sounds,
    AVG(cs.rating) as average_rating,
    MAX(cs.uploaded_at) as last_upload
FROM users u
LEFT JOIN custom_sounds cs ON u.id = cs.uploaded_by
GROUP BY u.id, u.email;

COMMENT ON VIEW user_sound_stats IS 'Statistics about user custom sound uploads and usage';