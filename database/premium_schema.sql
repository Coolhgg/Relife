-- Premium Subscription System Database Schema
-- This file contains the SQL schema for supporting premium features

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier subscription_tier_enum NOT NULL DEFAULT 'free',
    status subscription_status_enum NOT NULL DEFAULT 'inactive',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Payment provider specific fields
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    
    -- Indexes for performance
    CONSTRAINT subscription_per_user_unique UNIQUE (user_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Premium usage tracking table
CREATE TABLE IF NOT EXISTS premium_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- Format: YYYY-MM
    elevenlabs_api_calls INTEGER DEFAULT 0,
    ai_insights_generated INTEGER DEFAULT 0,
    custom_voice_messages INTEGER DEFAULT 0,
    premium_themes_used TEXT[] DEFAULT ARRAY[]::TEXT[],
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint per user per month
    CONSTRAINT usage_per_user_month_unique UNIQUE (user_id, month)
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type payment_method_type_enum NOT NULL,
    last4 TEXT,
    brand TEXT,
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN NOT NULL DEFAULT false,
    stripe_payment_method_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription history for analytics
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    action subscription_action_enum NOT NULL,
    from_tier subscription_tier_enum,
    to_tier subscription_tier_enum,
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Enum types
CREATE TYPE subscription_tier_enum AS ENUM ('free', 'premium', 'pro', 'lifetime');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'inactive', 'trialing', 'past_due', 'canceled', 'unpaid', 'paused');
CREATE TYPE payment_method_type_enum AS ENUM ('card', 'paypal', 'google_pay', 'apple_pay');
CREATE TYPE subscription_action_enum AS ENUM ('created', 'upgraded', 'downgraded', 'canceled', 'renewed', 'paused', 'resumed');

-- Update users table to include premium fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier_enum DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS feature_access JSONB DEFAULT '{
    "elevenlabsVoices": false,
    "customVoiceMessages": false,
    "voiceCloning": false,
    "advancedAIInsights": false,
    "personalizedChallenges": false,
    "smartRecommendations": false,
    "behaviorAnalysis": false,
    "premiumThemes": false,
    "customSounds": false,
    "advancedPersonalization": false,
    "unlimitedCustomization": false,
    "advancedScheduling": false,
    "smartScheduling": false,
    "locationBasedAlarms": false,
    "weatherIntegration": false,
    "exclusiveBattleModes": false,
    "customBattleRules": false,
    "advancedStats": false,
    "leaderboardFeatures": false,
    "premiumSoundLibrary": false,
    "exclusiveContent": false,
    "adFree": false,
    "prioritySupport": false
}';

-- Add missing user fields if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_premium_usage_user_month ON premium_usage(user_id, month);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);

-- Functions for premium usage management
CREATE OR REPLACE FUNCTION increment_premium_usage(
    p_user_id UUID,
    p_month TEXT,
    p_feature TEXT,
    p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
    -- Insert or update usage record
    INSERT INTO premium_usage (user_id, month, elevenlabs_api_calls, ai_insights_generated, custom_voice_messages)
    VALUES (p_user_id, p_month, 
        CASE WHEN p_feature = 'elevenlabsApiCalls' THEN p_increment ELSE 0 END,
        CASE WHEN p_feature = 'aiInsightsGenerated' THEN p_increment ELSE 0 END,
        CASE WHEN p_feature = 'customVoiceMessages' THEN p_increment ELSE 0 END
    )
    ON CONFLICT (user_id, month) 
    DO UPDATE SET
        elevenlabs_api_calls = premium_usage.elevenlabs_api_calls + 
            CASE WHEN p_feature = 'elevenlabsApiCalls' THEN p_increment ELSE 0 END,
        ai_insights_generated = premium_usage.ai_insights_generated + 
            CASE WHEN p_feature = 'aiInsightsGenerated' THEN p_increment ELSE 0 END,
        custom_voice_messages = premium_usage.custom_voice_messages + 
            CASE WHEN p_feature = 'customVoiceMessages' THEN p_increment ELSE 0 END,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get subscription analytics
CREATE OR REPLACE FUNCTION get_subscription_analytics()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    WITH subscription_stats AS (
        SELECT
            COUNT(*) as total_subscriptions,
            COUNT(*) FILTER (WHERE tier = 'premium') as premium_count,
            COUNT(*) FILTER (WHERE tier = 'pro') as pro_count,
            COUNT(*) FILTER (WHERE tier = 'lifetime') as lifetime_count,
            COUNT(*) FILTER (WHERE status = 'active') as active_count
        FROM subscriptions
        WHERE status IN ('active', 'trialing')
    ),
    revenue_stats AS (
        SELECT
            COALESCE(SUM(
                CASE 
                    WHEN sh.to_tier = 'premium' THEN 4.99
                    WHEN sh.to_tier = 'pro' THEN 9.99
                    WHEN sh.to_tier = 'lifetime' THEN 99.99
                    ELSE 0
                END
            ), 0) as monthly_revenue
        FROM subscription_history sh
        WHERE sh.created_at >= DATE_TRUNC('month', NOW())
        AND sh.action IN ('created', 'upgraded', 'renewed')
    )
    SELECT jsonb_build_object(
        'totalSubscriptions', ss.total_subscriptions,
        'subscriptionsByTier', jsonb_build_object(
            'free', (SELECT COUNT(*) FROM users WHERE subscription_tier = 'free'),
            'premium', ss.premium_count,
            'pro', ss.pro_count,
            'lifetime', ss.lifetime_count
        ),
        'monthlyRevenue', rs.monthly_revenue,
        'churnRate', COALESCE((
            SELECT (COUNT(*) FILTER (WHERE sh.action = 'canceled') * 100.0 / NULLIF(COUNT(*), 0))
            FROM subscription_history sh
            WHERE sh.created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
            AND sh.created_at < DATE_TRUNC('month', NOW())
        ), 0)
    ) INTO result
    FROM subscription_stats ss, revenue_stats rs;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update user feature access based on subscription
CREATE OR REPLACE FUNCTION update_user_feature_access()
RETURNS TRIGGER AS $$
DECLARE
    new_access JSONB;
BEGIN
    -- Determine feature access based on subscription tier
    CASE NEW.subscription_tier
        WHEN 'premium' THEN
            new_access := '{
                "elevenlabsVoices": true,
                "customVoiceMessages": true,
                "voiceCloning": false,
                "advancedAIInsights": true,
                "personalizedChallenges": true,
                "smartRecommendations": true,
                "behaviorAnalysis": true,
                "premiumThemes": true,
                "customSounds": true,
                "advancedPersonalization": true,
                "unlimitedCustomization": false,
                "advancedScheduling": true,
                "smartScheduling": false,
                "locationBasedAlarms": true,
                "weatherIntegration": true,
                "exclusiveBattleModes": true,
                "customBattleRules": false,
                "advancedStats": true,
                "leaderboardFeatures": true,
                "premiumSoundLibrary": true,
                "exclusiveContent": true,
                "adFree": true,
                "prioritySupport": false
            }';
        WHEN 'pro' THEN
            new_access := '{
                "elevenlabsVoices": true,
                "customVoiceMessages": true,
                "voiceCloning": true,
                "advancedAIInsights": true,
                "personalizedChallenges": true,
                "smartRecommendations": true,
                "behaviorAnalysis": true,
                "premiumThemes": true,
                "customSounds": true,
                "advancedPersonalization": true,
                "unlimitedCustomization": true,
                "advancedScheduling": true,
                "smartScheduling": true,
                "locationBasedAlarms": true,
                "weatherIntegration": true,
                "exclusiveBattleModes": true,
                "customBattleRules": true,
                "advancedStats": true,
                "leaderboardFeatures": true,
                "premiumSoundLibrary": true,
                "exclusiveContent": true,
                "adFree": true,
                "prioritySupport": true
            }';
        WHEN 'lifetime' THEN
            new_access := '{
                "elevenlabsVoices": true,
                "customVoiceMessages": true,
                "voiceCloning": true,
                "advancedAIInsights": true,
                "personalizedChallenges": true,
                "smartRecommendations": true,
                "behaviorAnalysis": true,
                "premiumThemes": true,
                "customSounds": true,
                "advancedPersonalization": true,
                "unlimitedCustomization": true,
                "advancedScheduling": true,
                "smartScheduling": true,
                "locationBasedAlarms": true,
                "weatherIntegration": true,
                "exclusiveBattleModes": true,
                "customBattleRules": true,
                "advancedStats": true,
                "leaderboardFeatures": true,
                "premiumSoundLibrary": true,
                "exclusiveContent": true,
                "adFree": true,
                "prioritySupport": true
            }';
        ELSE
            new_access := '{
                "elevenlabsVoices": false,
                "customVoiceMessages": false,
                "voiceCloning": false,
                "advancedAIInsights": false,
                "personalizedChallenges": false,
                "smartRecommendations": false,
                "behaviorAnalysis": false,
                "premiumThemes": false,
                "customSounds": false,
                "advancedPersonalization": false,
                "unlimitedCustomization": false,
                "advancedScheduling": false,
                "smartScheduling": false,
                "locationBasedAlarms": false,
                "weatherIntegration": false,
                "exclusiveBattleModes": false,
                "customBattleRules": false,
                "advancedStats": false,
                "leaderboardFeatures": false,
                "premiumSoundLibrary": false,
                "exclusiveContent": false,
                "adFree": false,
                "prioritySupport": false
            }';
    END CASE;
    
    -- Update feature access
    NEW.feature_access := new_access;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update feature access when subscription tier changes
CREATE TRIGGER update_feature_access_on_tier_change
    BEFORE UPDATE OF subscription_tier ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_feature_access();

-- Trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- This would be run separately for testing purposes

/*
-- Insert sample subscription plans (this would typically be in application config)
INSERT INTO subscription_plans (id, name, tier, price, currency, interval, features, feature_access) VALUES
('free-plan', 'Free', 'free', 0, 'USD', 'month', ARRAY['3 AI insights per day', 'Basic themes', '5 battles per day'], '{"elevenlabsVoices": false, "premiumThemes": false}'::jsonb),
('premium-monthly', 'Premium', 'premium', 4.99, 'USD', 'month', ARRAY['100 ElevenLabs calls/month', 'Premium themes', 'Advanced features'], '{"elevenlabsVoices": true, "premiumThemes": true}'::jsonb),
('pro-monthly', 'Pro', 'pro', 9.99, 'USD', 'month', ARRAY['500 ElevenLabs calls/month', 'Voice cloning', 'Unlimited features'], '{"elevenlabsVoices": true, "voiceCloning": true, "unlimitedCustomization": true}'::jsonb),
('lifetime', 'Lifetime', 'lifetime', 99.99, 'USD', 'lifetime', ARRAY['All premium features', 'Lifetime updates'], '{"elevenlabsVoices": true, "voiceCloning": true, "unlimitedCustomization": true}'::jsonb);
*/