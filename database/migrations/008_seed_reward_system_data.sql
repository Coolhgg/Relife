-- Migration 008: Seed Reward System Data
-- Description: Seeds initial rewards, achievements, and gifts for the reward system
-- Dependencies: Requires migration 007_create_reward_system.sql
-- Version: 1.0.0
-- Date: 2024-01-15

BEGIN;

-- Check that reward system tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rewards') THEN
        RAISE EXCEPTION 'Reward system tables not found. Please run migration 007 first.';
    END IF;
END $$;

-- ========================================
-- SEED REWARDS / ACHIEVEMENTS
-- ========================================

-- Consistency Category Rewards
INSERT INTO rewards (type, category, rarity, title, description, icon, points, unlock_conditions, progress_target, progress_unit, personalized_message_template, ai_insight_template, is_active, is_premium, sort_order, tags) VALUES

-- Common Consistency Rewards
('achievement', 'consistency', 'common', 'Early Bird', 'Wake up to your first alarm without snoozing', '🌅', 50, 
 '{"alarms_completed": 1, "snooze_count": 0}', 1, 'alarm', 
 'Great start, {name}! You''ve proven you can wake up on the first try. Keep building this habit!',
 'Your first successful wake-up shows discipline. Try setting your alarm 15 minutes earlier tomorrow to build momentum.',
 true, false, 1, ARRAY['beginner', 'morning', 'discipline']),

('streak', 'consistency', 'common', 'Three Day Streak', 'Wake up on time for 3 consecutive days', '🔥', 100, 
 '{"consecutive_days": 3, "on_time_wakeup": true}', 3, 'days', 
 'Fantastic, {name}! Three days of consistent wake-ups is the foundation of a lasting habit.',
 'Neurological research shows it takes about 66 days to form a habit. You''re 4.5% there!',
 true, false, 2, ARRAY['streak', 'habit', 'consistency']),

('achievement', 'consistency', 'rare', 'Week Warrior', 'Complete a full week of on-time wake-ups', '⚡', 200, 
 '{"consecutive_days": 7, "on_time_wakeup": true}', 7, 'days', 
 'Incredible dedication, {name}! A full week of consistent mornings shows real commitment.',
 'Weekly consistency is a major milestone. Your body clock is starting to adapt to your chosen rhythm.',
 true, false, 3, ARRAY['weekly', 'commitment', 'rhythm']),

('milestone', 'consistency', 'epic', 'Consistency Champion', 'Maintain 90% wake-up success rate for 30 days', '👑', 500, 
 '{"success_rate": 0.9, "days_tracked": 30}', 30, 'days', 
 'You''ve earned the title of Consistency Champion, {name}! Your morning discipline is inspirational.',
 'A 90% success rate shows you''ve mastered the balance between ambition and achievability.',
 true, false, 4, ARRAY['champion', 'mastery', 'discipline']),

-- Early Riser Category Rewards
('achievement', 'early_riser', 'common', 'Dawn Greetings', 'Wake up before 7 AM for the first time', '🌄', 75, 
 '{"wake_time_before": "07:00", "completed": 1}', 1, 'morning', 
 'Welcome to the dawn club, {name}! Early mornings offer peaceful moments and fresh possibilities.',
 'Early risers often report higher productivity and better mental clarity throughout the day.',
 true, false, 10, ARRAY['dawn', 'early', 'peaceful']),

('streak', 'early_riser', 'rare', 'Sunrise Devotee', 'Wake up before 6 AM for 5 consecutive days', '🌅', 300, 
 '{"wake_time_before": "06:00", "consecutive_days": 5}', 5, 'days', 
 'You''re a true sunrise devotee, {name}! These golden hours are your reward for dedication.',
 'Studies show that people who wake before 6 AM have higher levels of life satisfaction and goal achievement.',
 true, false, 11, ARRAY['sunrise', 'devotion', 'golden-hour']),

('milestone', 'early_riser', 'epic', '5 AM Club Member', 'Join the exclusive 5 AM wake-up club for 14 days', '🌟', 600, 
 '{"wake_time_before": "05:00", "consecutive_days": 14}', 14, 'days', 
 'Welcome to the elite 5 AM Club, {name}! You''ve unlocked the secret to extraordinary mornings.',
 'The 5 AM Club represents the top 5% of early risers. This quiet hour belongs entirely to you.',
 true, false, 12, ARRAY['elite', '5am-club', 'extraordinary']),

-- Wellness Category Rewards
('achievement', 'wellness', 'common', 'Mindful Morning', 'Use a meditation alarm sound for 3 mornings', '🧘', 60, 
 '{"alarm_sound_type": "meditation", "uses": 3}', 3, 'mornings', 
 'Beautiful choice, {name}! Starting your day mindfully sets a peaceful tone for everything ahead.',
 'Meditation-based wake-ups can reduce morning stress and improve focus throughout the day.',
 true, false, 20, ARRAY['meditation', 'mindful', 'peaceful']),

('habit_boost', 'wellness', 'rare', 'Sleep Optimizer', 'Maintain 7-9 hours of sleep for 10 consecutive nights', '😴', 250, 
 '{"sleep_hours_min": 7, "sleep_hours_max": 9, "consecutive_nights": 10}', 10, 'nights', 
 'Excellent sleep hygiene, {name}! You''re giving your body and mind the rest they deserve.',
 'Optimal sleep duration is crucial for memory consolidation, immune function, and emotional regulation.',
 true, false, 21, ARRAY['sleep', 'optimization', 'health']),

('achievement', 'wellness', 'epic', 'Wellness Guru', 'Complete 30 days with perfect sleep schedule and mindful wake-ups', '🌸', 750, 
 '{"perfect_sleep_days": 30, "mindful_wakeups": 30}', 30, 'days', 
 'You''ve achieved wellness mastery, {name}! Your commitment to holistic health is truly inspiring.',
 'Perfect sleep schedules are linked to improved longevity, mental clarity, and emotional resilience.',
 true, false, 22, ARRAY['guru', 'holistic', 'mastery']),

-- Productivity Category Rewards
('achievement', 'productivity', 'common', 'Quick Starter', 'Get out of bed within 5 minutes of alarm for 3 days', '🚀', 80, 
 '{"out_of_bed_minutes_max": 5, "consecutive_days": 3}', 3, 'days', 
 'Impressive speed, {name}! Quick transitions from sleep to action show great mental discipline.',
 'Rapid morning transitions can boost momentum and create a sense of achievement that carries through the day.',
 true, false, 30, ARRAY['speed', 'transition', 'momentum']),

('milestone', 'productivity', 'rare', 'Morning Ritual Master', 'Complete your morning routine within 30 minutes for 2 weeks', '📋', 350, 
 '{"morning_routine_minutes_max": 30, "consecutive_days": 14}', 14, 'days', 
 'You''ve mastered the art of efficient mornings, {name}! Your streamlined routine is productivity gold.',
 'Efficient morning routines create more time for priorities and reduce decision fatigue throughout the day.',
 true, false, 31, ARRAY['routine', 'efficiency', 'streamlined']),

('niche_mastery', 'productivity', 'legendary', 'Productivity Titan', 'Achieve 98% on-time rate with sub-10-minute routines for 60 days', '⚡', 1000, 
 '{"success_rate": 0.98, "routine_minutes_max": 10, "days": 60}', 60, 'days', 
 'You are a Productivity Titan, {name}! Your morning mastery is the stuff of legends.',
 'This level of morning efficiency indicates exceptional time management and priority clarity.',
 true, false, 32, ARRAY['titan', 'legendary', 'mastery']),

-- Social Category Rewards
('achievement', 'social', 'common', 'First Share', 'Share your first achievement with friends', '📤', 40, 
 '{"achievements_shared": 1}', 1, 'share', 
 'Thanks for spreading the positivity, {name}! Sharing achievements can inspire others.',
 'Social sharing of goals increases accountability and motivation by up to 65%.',
 true, false, 40, ARRAY['sharing', 'community', 'inspiration']),

('social_share', 'social', 'rare', 'Inspiration Station', 'Receive 10 likes/reactions on shared achievements', '💫', 200, 
 '{"social_reactions": 10}', 10, 'reactions', 
 'Your achievements are inspiring others, {name}! You''re becoming a beacon of morning motivation.',
 'Positive social reinforcement creates powerful motivation loops that benefit entire communities.',
 true, false, 41, ARRAY['inspiration', 'beacon', 'motivation']),

-- Explorer Category Rewards
('achievement', 'explorer', 'common', 'Sound Explorer', 'Try 5 different alarm sounds', '🎵', 30, 
 '{"unique_sounds_tried": 5}', 5, 'sounds', 
 'Great exploration, {name}! Finding your perfect wake-up sound is a fun journey of discovery.',
 'Different alarm sounds can affect wake-up mood and energy levels. Natural sounds often work best.',
 true, false, 50, ARRAY['exploration', 'sounds', 'discovery']),

('achievement', 'explorer', 'rare', 'Theme Adventurer', 'Experiment with 3 different visual themes', '🎨', 150, 
 '{"themes_tried": 3}', 3, 'themes', 
 'You''re a true theme adventurer, {name}! Personalizing your space enhances the morning experience.',
 'Visual environment affects mood and motivation. Finding themes that resonate with you boosts engagement.',
 true, false, 51, ARRAY['adventure', 'themes', 'personalization']),

-- Challenger Category Rewards
('achievement', 'challenger', 'epic', 'Impossible Made Possible', 'Successfully wake up at 4:30 AM for 7 days', '🏔️', 800, 
 '{"wake_time_exact": "04:30", "consecutive_days": 7}', 7, 'days', 
 'You''ve achieved the impossible, {name}! 4:30 AM wake-ups put you in elite company.',
 'Ultra-early rising requires exceptional discipline and is associated with high achievement in many fields.',
 true, false, 60, ARRAY['impossible', 'elite', 'ultra-early']),

('achievement', 'challenger', 'legendary', 'Century Streak', 'Maintain a perfect 100-day wake-up streak', '💯', 2000, 
 '{"consecutive_days": 100, "success_rate": 1.0}', 100, 'days', 
 'LEGENDARY! {name}, you''ve achieved what less than 1% of people ever accomplish - a perfect century streak!',
 'A 100-day perfect streak represents extraordinary self-discipline and habit mastery. You''re in rare company.',
 true, false, 61, ARRAY['legendary', 'century', 'perfection']),

-- Master Category Rewards
('niche_mastery', 'master', 'epic', 'Habit Architect', 'Design and maintain 5 custom morning habits for 30 days', '🏗️', 700, 
 '{"custom_habits": 5, "maintained_days": 30}', 30, 'days', 
 'You''re a true Habit Architect, {name}! Designing your perfect morning routine shows mastery.',
 'Custom habit creation indicates deep self-awareness and commitment to personal growth.',
 true, false, 70, ARRAY['architect', 'custom', 'design']),

('niche_mastery', 'master', 'legendary', 'Morning Sage', 'Help 50 friends achieve their first wake-up streak', '🧙', 1500, 
 '{"friends_helped": 50, "streak_achievements": 50}', 50, 'friends', 
 'You are a Morning Sage, {name}! Your wisdom and support have transformed dozens of lives.',
 'Teaching and mentoring others creates the deepest level of mastery and community impact.',
 true, false, 71, ARRAY['sage', 'wisdom', 'mentoring']);

-- ========================================
-- SEED GIFT CATALOG
-- ========================================

-- Theme Gifts
INSERT INTO gift_catalog (type, name, description, preview_image, cost_points, cost_premium_currency, is_purchasable_with_points, is_purchasable_with_currency, content_data, is_available, is_premium, is_seasonal, required_level, required_achievements, tags, sort_order) VALUES

-- Basic Themes (Points Only)
('theme', 'Sunrise Gradient', 'Warm orange and yellow gradients that mimic a beautiful sunrise', '/images/themes/sunrise-gradient.jpg', 200, 0, true, false, 
 '{"primary_color": "#FF6B35", "secondary_color": "#F7931E", "accent_color": "#FFD23F", "background_gradient": ["#FF6B35", "#F7931E", "#FFD23F"]}', 
 true, false, false, 1, '{}', ARRAY['sunrise', 'warm', 'gradient'], 1),

('theme', 'Ocean Depths', 'Cool blue tones inspired by deep ocean waters', '/images/themes/ocean-depths.jpg', 250, 0, true, false, 
 '{"primary_color": "#1e40af", "secondary_color": "#0ea5e9", "accent_color": "#06b6d4", "background_gradient": ["#1e40af", "#0ea5e9"]}', 
 true, false, false, 1, '{}', ARRAY['ocean', 'blue', 'calm'], 2),

('theme', 'Forest Serenity', 'Peaceful green hues that bring nature indoors', '/images/themes/forest-serenity.jpg', 300, 0, true, false, 
 '{"primary_color": "#065f46", "secondary_color": "#059669", "accent_color": "#10b981", "background_gradient": ["#065f46", "#059669"]}', 
 true, false, false, 2, '{}', ARRAY['forest', 'green', 'nature'], 3),

-- Premium Themes
('theme', 'Midnight Galaxy', 'Stunning space theme with animated stars and nebulas', '/images/themes/midnight-galaxy.jpg', 0, 599, false, true, 
 '{"primary_color": "#1a1625", "secondary_color": "#2d1b69", "accent_color": "#9333ea", "animations": {"stars": true, "nebula": true}, "sounds": {"space_ambient": true}}', 
 true, true, false, 5, '{}', ARRAY['galaxy', 'premium', 'animated'], 4),

('theme', 'Cherry Blossom', 'Elegant Japanese-inspired theme with falling petals animation', '/images/themes/cherry-blossom.jpg', 0, 799, false, true, 
 '{"primary_color": "#fdf2f8", "secondary_color": "#f9a8d4", "accent_color": "#ec4899", "animations": {"falling_petals": true}, "cultural": "japanese"}', 
 true, true, true, 3, '{}', ARRAY['japanese', 'elegant', 'seasonal'], 5),

-- Sound Pack Gifts
('sound_pack', 'Nature Symphony', 'Collection of 10 natural sounds: birds, rain, ocean waves, and forest ambience', '/images/sound-packs/nature-symphony.jpg', 400, 0, true, false, 
 '{"sounds": ["morning_birds", "gentle_rain", "ocean_waves", "forest_stream", "wind_chimes", "bamboo_fountain", "cricket_chorus", "distant_thunder", "rustling_leaves", "mountain_breeze"], "duration_seconds": [300, 360, 420, 240, 180, 200, 480, 150, 320, 280]}', 
 true, false, false, 2, '{}', ARRAY['nature', 'relaxing', 'ambient'], 10),

('sound_pack', 'Urban Energy', 'Energizing city sounds and upbeat tones for productivity-focused mornings', '/images/sound-packs/urban-energy.jpg', 350, 0, true, false, 
 '{"sounds": ["coffee_shop_buzz", "subway_arrival", "keyboard_typing", "page_turning", "clock_ticking", "phone_notification", "elevator_ding", "footsteps_marble"], "mood": "energetic", "tempo": "upbeat"}', 
 true, false, false, 3, '{}', ARRAY['urban', 'energetic', 'productivity'], 11),

('sound_pack', 'Meditation Masters', 'Premium collection of Tibetan bowls, gongs, and guided wake-up meditations', '/images/sound-packs/meditation-masters.jpg', 0, 899, false, true, 
 '{"sounds": ["tibetan_bowl_deep", "crystal_singing", "meditation_bell", "guided_wakeup_5min", "guided_wakeup_10min", "om_chanting", "nature_meditation"], "guided_sessions": true, "premium_quality": true}', 
 true, true, false, 4, '["Mindful Morning"]', ARRAY['meditation', 'premium', 'spiritual'], 12),

-- Voice Personality Gifts
('voice_personality', 'Motivational Coach', 'Energetic and encouraging wake-up messages from your personal coach', '/images/voices/motivational-coach.jpg', 600, 0, true, false, 
 '{"personality": "energetic", "tone": "encouraging", "messages": ["Time to conquer the day, champion!", "Your future self will thank you for getting up now!", "Every morning is a new opportunity to be great!"], "voice_type": "male_energetic"}', 
 true, false, false, 5, '["Quick Starter"]', ARRAY['motivational', 'coaching', 'energetic'], 20),

('voice_personality', 'Zen Master', 'Calm and peaceful voice that gently guides you into wakefulness', '/images/voices/zen-master.jpg', 500, 0, true, false, 
 '{"personality": "calm", "tone": "peaceful", "messages": ["Breathe deeply and welcome this new day", "Let the morning light fill you with serenity", "Rise gently, like the sun over still waters"], "voice_type": "unisex_calm"}', 
 true, false, false, 3, '["Mindful Morning"]', ARRAY['zen', 'peaceful', 'meditation'], 21),

('voice_personality', 'AI Assistant Pro', 'Advanced AI voice with personalized daily briefings and weather updates', '/images/voices/ai-assistant.jpg', 0, 1299, false, true, 
 '{"personality": "intelligent", "features": ["weather_update", "calendar_preview", "motivational_quote", "daily_goals"], "voice_quality": "premium", "customizable": true}', 
 true, true, false, 10, '["Productivity Titan"]', ARRAY['ai', 'premium', 'personalized'], 22),

-- Alarm Tone Gifts
('alarm_tone', 'Gentle Chimes', 'Soft wind chime melody that gradually increases in volume', '/images/tones/gentle-chimes.jpg', 150, 0, true, false, 
 '{"tone_name": "gentle_chimes", "duration": 60, "fade_in": true, "volume_curve": "gradual", "instruments": ["wind_chimes", "soft_bells"]}', 
 true, false, false, 1, '{}', ARRAY['gentle', 'chimes', 'gradual'], 30),

('alarm_tone', 'Rooster Call', 'Classic farm rooster sound for traditional early risers', '/images/tones/rooster-call.jpg', 100, 0, true, false, 
 '{"tone_name": "rooster_call", "duration": 15, "repeats": 3, "volume": "medium", "style": "traditional"}', 
 true, false, false, 1, '{}', ARRAY['traditional', 'farm', 'classic'], 31),

('alarm_tone', 'Space Odyssey', 'Futuristic tones inspired by sci-fi movies', '/images/tones/space-odyssey.jpg', 300, 0, true, false, 
 '{"tone_name": "space_odyssey", "duration": 45, "effects": ["reverb", "echo"], "style": "sci-fi", "mood": "adventurous"}', 
 true, false, false, 4, '["Sound Explorer"]', ARRAY['sci-fi', 'futuristic', 'adventure'], 32),

-- Background Gifts
('background', 'Mountain Sunrise', 'Breathtaking mountain landscape with dynamic lighting', '/images/backgrounds/mountain-sunrise.jpg', 250, 0, true, false, 
 '{"image_url": "/images/backgrounds/mountain-sunrise-4k.jpg", "resolution": "4K", "dynamic_lighting": true, "time_of_day": "sunrise"}', 
 true, false, false, 2, '{}', ARRAY['mountain', 'sunrise', 'landscape'], 40),

('background', 'City Skyline', 'Modern city skyline with twinkling lights', '/images/backgrounds/city-skyline.jpg', 200, 0, true, false, 
 '{"image_url": "/images/backgrounds/city-skyline-4k.jpg", "resolution": "4K", "lighting": "night", "style": "modern"}', 
 true, false, false, 3, '{}', ARRAY['city', 'modern', 'urban'], 41),

('background', 'Abstract Art', 'Dynamic abstract patterns that change with your mood', '/images/backgrounds/abstract-art.jpg', 0, 499, false, true, 
 '{"type": "generative", "mood_responsive": true, "pattern_types": ["geometric", "fluid", "particle"], "color_adaptive": true}', 
 true, true, false, 6, '["Theme Adventurer"]', ARRAY['abstract', 'premium', 'dynamic'], 42),

-- Icon Pack Gifts
('icon_pack', 'Minimalist Icons', 'Clean and simple icons for a clutter-free interface', '/images/icons/minimalist.jpg', 300, 0, true, false, 
 '{"style": "minimalist", "icon_count": 50, "categories": ["alarms", "settings", "achievements", "social"], "color_variants": 5}', 
 true, false, false, 3, '{}', ARRAY['minimalist', 'clean', 'simple'], 50),

('icon_pack', 'Retro Gaming', 'Pixel art icons inspired by classic video games', '/images/icons/retro-gaming.jpg', 400, 0, true, false, 
 '{"style": "pixel_art", "icon_count": 60, "theme": "retro_gaming", "animated": true, "sound_effects": true}', 
 true, false, false, 5, '["Sound Explorer", "Theme Adventurer"]', ARRAY['retro', 'gaming', 'pixel'], 51),

-- Premium Trial Gifts
('premium_trial', '7-Day Premium Experience', 'Full access to all premium features for one week', '/images/gifts/premium-trial.jpg', 0, 0, false, false, 
 '{"duration_days": 7, "features": ["all_premium_themes", "all_voice_personalities", "advanced_analytics", "priority_support"], "auto_renew": false}', 
 true, false, false, 8, '["Week Warrior"]', ARRAY['trial', 'premium', 'experience'], 60),

('premium_trial', '30-Day Premium Trial', 'Extended premium trial for dedicated users', '/images/gifts/premium-trial-30.jpg', 2000, 0, true, false, 
 '{"duration_days": 30, "features": ["all_premium_features", "exclusive_content", "beta_access", "personal_coaching"], "auto_renew": false}', 
 true, false, false, 15, '["Consistency Champion", "Habit Architect"]', ARRAY['trial', 'premium', 'extended'], 61),

-- Feature Unlock Gifts
('feature_unlock', 'Advanced Analytics', 'Unlock detailed sleep and wake-up pattern analysis', '/images/features/analytics.jpg', 800, 0, true, false, 
 '{"feature": "advanced_analytics", "includes": ["sleep_quality_tracking", "wake_up_mood_analysis", "productivity_correlation", "habit_strength_metrics"]}', 
 true, false, false, 10, '["Morning Ritual Master"]', ARRAY['analytics', 'tracking', 'insights'], 70),

('feature_unlock', 'Social Challenges', 'Create and join morning routine challenges with friends', '/images/features/social-challenges.jpg', 600, 0, true, false, 
 '{"feature": "social_challenges", "includes": ["create_challenges", "join_challenges", "leaderboards", "group_motivation"]}', 
 true, false, false, 8, '["First Share", "Inspiration Station"]', ARRAY['social', 'challenges', 'community'], 71),

('feature_unlock', 'Smart Home Integration', 'Connect with smart lights, thermostats, and coffee makers', '/images/features/smart-home.jpg', 0, 1599, false, true, 
 '{"feature": "smart_home", "compatible_devices": ["philips_hue", "nest_thermostat", "smart_coffee_makers"], "automation": true}', 
 true, true, false, 12, '["Productivity Titan", "Habit Architect"]', ARRAY['smart-home', 'automation', 'premium'], 72);

-- ========================================
-- UPDATE STATISTICS AND VALIDATION
-- ========================================

-- Update table statistics
ANALYZE rewards;
ANALYZE gift_catalog;

-- Validation queries
DO $$
DECLARE
    reward_count INTEGER;
    gift_count INTEGER;
    category_coverage INTEGER;
    rarity_distribution RECORD;
BEGIN
    -- Count inserted records
    SELECT COUNT(*) INTO reward_count FROM rewards;
    SELECT COUNT(*) INTO gift_count FROM gift_catalog;
    
    -- Check category coverage
    SELECT COUNT(DISTINCT category) INTO category_coverage FROM rewards;
    
    -- Validation report
    RAISE NOTICE '';
    RAISE NOTICE 'Seed Data Results:';
    RAISE NOTICE '- Rewards seeded: %', reward_count;
    RAISE NOTICE '- Gifts seeded: %', gift_count;
    RAISE NOTICE '- Categories covered: % of 8', category_coverage;
    
    -- Check rarity distribution
    FOR rarity_distribution IN 
        SELECT rarity, COUNT(*) as count 
        FROM rewards 
        GROUP BY rarity 
        ORDER BY 
            CASE rarity 
                WHEN 'common' THEN 1 
                WHEN 'rare' THEN 2 
                WHEN 'epic' THEN 3 
                WHEN 'legendary' THEN 4 
            END
    LOOP
        RAISE NOTICE '- % rewards: %', rarity_distribution.rarity, rarity_distribution.count;
    END LOOP;
    
    -- Validation checks
    IF reward_count < 20 THEN
        RAISE WARNING 'Expected at least 20 rewards, found %', reward_count;
    END IF;
    
    IF gift_count < 15 THEN
        RAISE WARNING 'Expected at least 15 gifts, found %', gift_count;
    END IF;
    
    IF category_coverage < 8 THEN
        RAISE WARNING 'Not all reward categories are covered. Found % of 8', category_coverage;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Seed data validation completed successfully!';
END $$;

-- Create analytics event for seeding completion
INSERT INTO emotional_analytics_events (event_type, event_data, event_timestamp)
VALUES ('reward_system_seeded', jsonb_build_object(
    'rewards_count', (SELECT COUNT(*) FROM rewards),
    'gifts_count', (SELECT COUNT(*) FROM gift_catalog),
    'seeded_at', CURRENT_TIMESTAMP,
    'version', '1.0.0'
), CURRENT_TIMESTAMP);

COMMIT;