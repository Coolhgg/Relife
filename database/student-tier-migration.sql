-- Student Tier Migration for Relife Alarm App
-- Run this after schema-premium.sql to add student functionality

-- Student Verification table
CREATE TABLE IF NOT EXISTS student_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  school_name TEXT,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('email', 'document', 'third_party')),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')) DEFAULT 'pending',
  document_url TEXT,
  expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for student verification
CREATE INDEX IF NOT EXISTS idx_student_verification_user_id ON student_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_student_verification_status ON student_verification(verification_status);
CREATE INDEX IF NOT EXISTS idx_student_verification_email ON student_verification(email);

-- Update subscription plans with optimized pricing and student tiers
UPDATE subscription_plans SET 
  pricing = '{
    "monthly": {"amount": 399, "currency": "usd"},
    "yearly": {"amount": 3999, "currency": "usd", "discountPercentage": 17},
    "student_monthly": {"amount": 199, "currency": "usd"},
    "student_yearly": {"amount": 1999, "currency": "usd", "discountPercentage": 17}
  }'::jsonb
WHERE tier = 'basic';

UPDATE subscription_plans SET 
  pricing = '{
    "monthly": {"amount": 799, "currency": "usd"},
    "yearly": {"amount": 7999, "currency": "usd", "discountPercentage": 17},
    "student_monthly": {"amount": 399, "currency": "usd"},
    "student_yearly": {"amount": 3999, "currency": "usd", "discountPercentage": 17}
  }'::jsonb,
  is_popular = true
WHERE tier = 'premium';

UPDATE subscription_plans SET 
  pricing = '{
    "monthly": {"amount": 1599, "currency": "usd"},
    "yearly": {"amount": 15999, "currency": "usd", "discountPercentage": 17},
    "student_monthly": {"amount": 799, "currency": "usd"},
    "student_yearly": {"amount": 7999, "currency": "usd", "discountPercentage": 17}
  }'::jsonb
WHERE tier = 'pro';

-- Add Lifetime tier
INSERT INTO subscription_plans (
    tier, name, display_name, description, features, limits, pricing, is_active, sort_order, is_recommended
) VALUES (
    'lifetime',
    'Lifetime',
    'Lifetime Access',
    'Pay once, use forever! All Pro features with lifetime access',
    '[
        {"id": "unlimited_alarms", "name": "Unlimited Alarms", "description": "Set unlimited alarms"},
        {"id": "voice_commands", "name": "Premium Voice AI", "description": "Advanced AI with custom voice training"},
        {"id": "custom_sounds", "name": "Unlimited Custom Sounds", "description": "Upload unlimited custom sounds + sound library"},
        {"id": "premium_themes", "name": "All Themes + Custom", "description": "All themes plus custom theme creator"},
        {"id": "unlimited_battles", "name": "Unlimited Battles + Tournaments", "description": "Join battles and create tournaments"},
        {"id": "smart_scheduling", "name": "AI Smart Scheduling", "description": "Advanced AI-powered optimization"},
        {"id": "all_integrations", "name": "All Integrations", "description": "Calendar, fitness, weather, and more"},
        {"id": "team_features", "name": "Team Features", "description": "Team battles and collaboration"},
        {"id": "api_access", "name": "API Access", "description": "Developer API for custom integrations"},
        {"id": "white_label", "name": "White Label", "description": "Remove Relife branding"},
        {"id": "founder_badge", "name": "Founder Badge", "description": "Exclusive founder status and badge"},
        {"id": "priority_support", "name": "Lifetime Support", "description": "Priority support for life"}
    ]'::jsonb,
    '{
        "maxAlarms": -1,
        "maxBattles": -1,
        "maxCustomSounds": -1,
        "maxVoiceProfiles": -1,
        "maxThemes": -1,
        "maxTeamMembers": 10,
        "apiCallsPerMonth": 10000,
        "supportTier": "dedicated",
        "advancedAnalytics": true,
        "whiteLabel": true,
        "founderBadge": true
    }'::jsonb,
    '{
        "lifetime": {"amount": 14999, "currency": "usd"}
    }'::jsonb,
    true,
    4,
    true
) ON CONFLICT (tier) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    pricing = EXCLUDED.pricing,
    is_recommended = EXCLUDED.is_recommended,
    updated_at = NOW();

-- Function to check student verification status
CREATE OR REPLACE FUNCTION check_student_status(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_verified BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM student_verification 
        WHERE user_id = user_uuid 
        AND verification_status = 'verified'
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO is_verified;
    
    RETURN is_verified;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get applicable pricing for user (including student discounts)
CREATE OR REPLACE FUNCTION get_user_pricing(user_uuid UUID, plan_tier TEXT)
RETURNS JSONB AS $$
DECLARE
    is_student BOOLEAN;
    plan_pricing JSONB;
    result_pricing JSONB;
BEGIN
    -- Check if user is verified student
    SELECT check_student_status(user_uuid) INTO is_student;
    
    -- Get plan pricing
    SELECT pricing INTO plan_pricing
    FROM subscription_plans
    WHERE tier = plan_tier AND is_active = true;
    
    IF plan_pricing IS NULL THEN
        RETURN '{}'::jsonb;
    END IF;
    
    -- Return student pricing if available and user is verified student
    IF is_student AND plan_pricing ? 'student_monthly' THEN
        result_pricing = jsonb_build_object(
            'monthly', plan_pricing->'student_monthly',
            'yearly', plan_pricing->'student_yearly',
            'is_student_pricing', true
        );
    ELSE
        result_pricing = plan_pricing || jsonb_build_object('is_student_pricing', false);
    END IF;
    
    RETURN result_pricing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for student verification
ALTER TABLE student_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own student verification" ON student_verification
    FOR ALL USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE student_verification IS 'Student verification records for discounted pricing';
COMMENT ON FUNCTION check_student_status(UUID) IS 'Check if user has valid student verification';
COMMENT ON FUNCTION get_user_pricing(UUID, TEXT) IS 'Get applicable pricing for user including student discounts';