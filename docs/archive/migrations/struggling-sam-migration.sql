-- ============================================================================
-- STRUGGLING SAM OPTIMIZATION DATABASE MIGRATION
-- Adds support for user streaks, achievements, social challenges, and A/B testing
-- ============================================================================

-- User streaks and achievements (from optimization plan)
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_achievements INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_freezes_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_streak_freezes INTEGER DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_wake_up_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_multiplier DECIMAL(3,2) DEFAULT 1.0;

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  rarity VARCHAR(20) DEFAULT 'common',
  earned_date TIMESTAMP DEFAULT NOW(),
  shared BOOLEAN DEFAULT FALSE,
  social_proof_text TEXT,
  progress_current INTEGER DEFAULT 0,
  progress_target INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_type)
);

-- Streak Milestones Table
CREATE TABLE IF NOT EXISTS streak_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  streak_days INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reward_type VARCHAR(50),
  reward_value VARCHAR(255),
  unlocked_at TIMESTAMP,
  celebrated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Social challenges
CREATE TABLE IF NOT EXISTS social_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  challenge_type VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'medium',
  duration_days INTEGER NOT NULL,
  max_participants INTEGER DEFAULT 50,
  current_participants INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Challenge Participants
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES social_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  last_activity TIMESTAMP DEFAULT NOW(),
  rank INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  UNIQUE(challenge_id, user_id)
);

-- Challenge Rewards
CREATE TABLE IF NOT EXISTS challenge_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES social_challenges(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL,
  reward_value VARCHAR(255),
  description TEXT,
  eligible_ranks INTEGER[] DEFAULT ARRAY[1,2,3],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Social Proof Data
CREATE TABLE IF NOT EXISTS social_proof_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  user_segment VARCHAR(50),
  is_realtime BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Success Stories
CREATE TABLE IF NOT EXISTS success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255) NOT NULL,
  user_avatar VARCHAR(500),
  title VARCHAR(255) NOT NULL,
  story TEXT NOT NULL,
  before_wake_time TIME,
  before_consistency INTEGER,
  before_energy INTEGER,
  after_wake_time TIME,
  after_consistency INTEGER,
  after_energy INTEGER,
  after_streak_days INTEGER,
  tags VARCHAR(50)[] DEFAULT '{}',
  verified BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  persona VARCHAR(50),
  conversion_impact DECIMAL(5,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Smart Upgrade Prompts
CREATE TABLE IF NOT EXISTS smart_upgrade_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50) NOT NULL,
  prompt_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  benefits TEXT[] DEFAULT '{}',
  social_proof TEXT,
  discount_percentage INTEGER,
  discount_duration_hours INTEGER,
  discount_code VARCHAR(50),
  discount_reason VARCHAR(255),
  urgency_level VARCHAR(20),
  urgency_message TEXT,
  expires_at TIMESTAMP,
  streak_context INTEGER DEFAULT 0,
  recent_achievements TEXT[] DEFAULT '{}',
  social_activity BOOLEAN DEFAULT FALSE,
  engagement_level VARCHAR(20),
  previous_prompts_seen INTEGER DEFAULT 0,
  days_since_last_prompt INTEGER DEFAULT 0,
  is_shown BOOLEAN DEFAULT FALSE,
  shown_at TIMESTAMP,
  clicked_at TIMESTAMP,
  converted_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- A/B Testing Framework
CREATE TABLE IF NOT EXISTS ab_test_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  percentage INTEGER NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  is_control BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE,
  total_users INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  significance_level DECIMAL(5,4) DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- A/B Test Features
CREATE TABLE IF NOT EXISTS ab_test_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_group_id UUID REFERENCES ab_test_groups(id) ON DELETE CASCADE,
  feature_id VARCHAR(100) NOT NULL,
  variant VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- User A/B Test Assignments
CREATE TABLE IF NOT EXISTS user_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  test_group_id UUID REFERENCES ab_test_groups(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  has_converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMP,
  sessions_count INTEGER DEFAULT 0,
  features_used TEXT[] DEFAULT '{}',
  engagement_score DECIMAL(5,2) DEFAULT 0,
  retention_days INTEGER DEFAULT 0,
  last_activity TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, test_group_id)
);

-- Habit Celebrations
CREATE TABLE IF NOT EXISTS habit_celebrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  celebration_type VARCHAR(50) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_value INTEGER,
  trigger_context JSONB DEFAULT '{}',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  animation_type VARCHAR(50) DEFAULT 'confetti',
  animation_duration INTEGER DEFAULT 3000,
  animation_intensity VARCHAR(20) DEFAULT 'moderate',
  animation_colors TEXT[] DEFAULT ARRAY['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'],
  rewards JSONB DEFAULT '[]',
  social_share_enabled BOOLEAN DEFAULT TRUE,
  social_share_message TEXT,
  social_share_hashtags TEXT[] DEFAULT ARRAY['#MorningHabit', '#StreakSuccess'],
  is_shown BOOLEAN DEFAULT FALSE,
  shown_at TIMESTAMP,
  shared_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Community Stats (for real-time social proof)
CREATE TABLE IF NOT EXISTS community_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_users INTEGER DEFAULT 0,
  active_today INTEGER DEFAULT 0,
  total_streaks INTEGER DEFAULT 0,
  average_streak DECIMAL(5,2) DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,
  challenges_active INTEGER DEFAULT 0,
  success_rate DECIMAL(5,4) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Realtime Activity (for social proof feed)
CREATE TABLE IF NOT EXISTS realtime_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_streak_milestones_user_id ON streak_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_social_challenges_status ON social_challenges(status);
CREATE INDEX IF NOT EXISTS idx_smart_upgrade_prompts_user_id ON smart_upgrade_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_upgrade_prompts_trigger ON smart_upgrade_prompts(trigger_type);
CREATE INDEX IF NOT EXISTS idx_user_ab_tests_user_id ON user_ab_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ab_tests_group_id ON user_ab_tests(test_group_id);
CREATE INDEX IF NOT EXISTS idx_habit_celebrations_user_id ON habit_celebrations(user_id);
CREATE INDEX IF NOT EXISTS idx_social_proof_type ON social_proof_data(type);
CREATE INDEX IF NOT EXISTS idx_realtime_activity_created_at ON realtime_activity(created_at DESC);

-- Insert default A/B test groups for Struggling Sam optimization
INSERT INTO ab_test_groups (name, description, percentage, is_control, status, start_date) VALUES
  ('Control Group', 'Current experience without gamification', 30, TRUE, 'active', CURRENT_DATE),
  ('Gamification Only', 'Streak counter and achievements only', 35, FALSE, 'active', CURRENT_DATE),
  ('Full Optimization', 'Complete Struggling Sam optimization with all features', 35, FALSE, 'active', CURRENT_DATE);

-- Insert A/B test features
INSERT INTO ab_test_features (test_group_id, feature_id, variant, enabled, configuration) 
SELECT 
  g.id,
  CASE 
    WHEN g.name = 'Control Group' THEN 'original_experience'
    WHEN g.name = 'Gamification Only' THEN 'streak_gamification'
    ELSE 'full_optimization'
  END,
  CASE 
    WHEN g.name = 'Control Group' THEN 'control'
    WHEN g.name = 'Gamification Only' THEN 'gamification'
    ELSE 'full'
  END,
  TRUE,
  CASE 
    WHEN g.name = 'Control Group' THEN '{}'::jsonb
    WHEN g.name = 'Gamification Only' THEN '{"streaks": true, "achievements": true, "social_proof": false, "upgrade_prompts": false}'::jsonb
    ELSE '{"streaks": true, "achievements": true, "social_proof": true, "upgrade_prompts": true, "celebrations": true, "challenges": true}'::jsonb
  END
FROM ab_test_groups g;

-- Insert default achievement types
INSERT INTO user_achievements (user_id, achievement_type, title, description, rarity, progress_target) VALUES
-- These will be templates, actual user achievements will be created when earned
(NULL, 'early_bird', 'Early Bird', 'Wake up 5 consecutive days at your alarm time', 'common', 5),
(NULL, 'consistent_riser', 'Consistent Riser', 'Maintain a 14-day wake-up streak', 'rare', 14),
(NULL, 'morning_champion', 'Morning Champion', 'Achieve a perfect 30-day streak', 'epic', 30),
(NULL, 'streak_warrior', 'Streak Warrior', 'Reach an impressive 50-day streak', 'epic', 50),
(NULL, 'habit_master', 'Habit Master', 'Complete 100 days of consistent wake-ups', 'legendary', 100),
(NULL, 'social_butterfly', 'Social Butterfly', 'Share 3 achievements with the community', 'rare', 3),
(NULL, 'community_helper', 'Community Helper', 'Join 5 social challenges', 'rare', 5),
(NULL, 'comeback_kid', 'Comeback Kid', 'Successfully recover from a streak break', 'uncommon', 1),
(NULL, 'weekend_warrior', 'Weekend Warrior', 'Wake up early on weekends for 4 consecutive weeks', 'rare', 4),
(NULL, 'month_perfectionist', 'Month Perfectionist', 'Complete a perfect calendar month', 'epic', 1)
ON CONFLICT (user_id, achievement_type) DO NOTHING;

-- Insert default social proof messages
INSERT INTO social_proof_data (type, content, user_segment, is_realtime) VALUES
  ('user_count', '{count} people started their morning routine in the last hour', 'struggling_sam', TRUE),
  ('community_activity', '{count} users joined challenges today', 'struggling_sam', TRUE),
  ('upgrade_social_proof', 'Join 15,420+ users who upgraded for better results', 'struggling_sam', FALSE),
  ('peer_comparison', 'Users like you average 25-day streaks', 'struggling_sam', FALSE),
  ('success_story', 'After using Relife for 30 days, Sarah increased her consistency from 40% to 85%', 'struggling_sam', FALSE),
  ('achievement_unlock', 'Congratulations! You''ve unlocked the Early Bird achievement', 'struggling_sam', TRUE),
  ('streak_milestone', 'Amazing! You''ve reached a 7-day streak', 'struggling_sam', TRUE);

-- Create a function to update community stats
CREATE OR REPLACE FUNCTION update_community_stats()
RETURNS void AS $$
BEGIN
  UPDATE community_stats SET
    total_users = (SELECT COUNT(*) FROM users),
    active_today = (SELECT COUNT(*) FROM users WHERE last_active::date = CURRENT_DATE),
    total_streaks = (SELECT SUM(current_streak) FROM users WHERE current_streak > 0),
    average_streak = (SELECT COALESCE(AVG(current_streak), 0) FROM users WHERE current_streak > 0),
    achievements_unlocked = (SELECT COUNT(*) FROM user_achievements WHERE user_id IS NOT NULL),
    challenges_active = (SELECT COUNT(*) FROM social_challenges WHERE status = 'active'),
    success_rate = (SELECT COALESCE(AVG(CASE WHEN current_streak >= 7 THEN 1.0 ELSE 0.0 END), 0) FROM users),
    updated_at = NOW()
  WHERE id = (SELECT id FROM community_stats LIMIT 1);
  
  -- Insert if no record exists
  INSERT INTO community_stats (
    total_users, active_today, total_streaks, average_streak, 
    achievements_unlocked, challenges_active, success_rate
  )
  SELECT 
    (SELECT COUNT(*) FROM users),
    (SELECT COUNT(*) FROM users WHERE last_active::date = CURRENT_DATE),
    (SELECT COALESCE(SUM(current_streak), 0) FROM users WHERE current_streak > 0),
    (SELECT COALESCE(AVG(current_streak), 0) FROM users WHERE current_streak > 0),
    (SELECT COUNT(*) FROM user_achievements WHERE user_id IS NOT NULL),
    (SELECT COUNT(*) FROM social_challenges WHERE status = 'active'),
    (SELECT COALESCE(AVG(CASE WHEN current_streak >= 7 THEN 1.0 ELSE 0.0 END), 0) FROM users)
  WHERE NOT EXISTS (SELECT 1 FROM community_stats);
END;
$$ LANGUAGE plpgsql;

-- Initialize community stats
SELECT update_community_stats();

-- Create a trigger to update community stats when relevant data changes
CREATE OR REPLACE FUNCTION trigger_update_community_stats()
RETURNS trigger AS $$
BEGIN
  PERFORM update_community_stats();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers (commented out to avoid conflicts in existing databases)
-- CREATE TRIGGER update_stats_on_user_change
--   AFTER INSERT OR UPDATE OR DELETE ON users
--   FOR EACH STATEMENT
--   EXECUTE FUNCTION trigger_update_community_stats();

-- CREATE TRIGGER update_stats_on_achievement_change
--   AFTER INSERT OR DELETE ON user_achievements
--   FOR EACH STATEMENT
--   EXECUTE FUNCTION trigger_update_community_stats();

COMMIT;