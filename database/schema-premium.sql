-- Premium Subscription Database Schema for Relife Alarm App
-- Run this after the main schema.sql to add premium subscription functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Subscription Plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'premium', 'pro', 'enterprise')),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  tagline TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  stripe_price_id_lifetime TEXT,
  stripe_product_id TEXT,
  is_popular BOOLEAN DEFAULT false,
  is_recommended BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  trial_days INTEGER DEFAULT 0,
  setup_fee INTEGER DEFAULT 0, -- in cents
  discount_eligible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'premium', 'pro', 'enterprise')) DEFAULT 'free',
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired')) DEFAULT 'active',
  billing_interval TEXT CHECK (billing_interval IN ('month', 'year', 'lifetime')),
  amount INTEGER NOT NULL DEFAULT 0, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_account', 'paypal', 'apple_pay', 'google_pay')),
  is_default BOOLEAN DEFAULT false,
  card_data JSONB, -- brand, last4, exp_month, exp_year, country
  billing_details JSONB, -- name, email, address
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'canceled', 'requires_action', 'processing')),
  amount INTEGER NOT NULL, -- in cents
  tax INTEGER DEFAULT 0, -- in cents
  total INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  description TEXT,
  download_url TEXT,
  receipt_url TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'canceled', 'requires_action', 'processing')),
  payment_method TEXT,
  description TEXT,
  receipt_url TEXT,
  failure_reason TEXT,
  refunded BOOLEAN DEFAULT false,
  refunded_amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  stripe_refund_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  reason TEXT CHECK (reason IN ('duplicate', 'fraudulent', 'requested_by_customer', 'expired_uncaptured_charge')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Usage Tracking table
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  feature TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  limit_count INTEGER NOT NULL DEFAULT 0,
  reset_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature, reset_date)
);

-- Discounts/Promotions table
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'trial_extension')),
  value NUMERIC NOT NULL, -- percentage (0-100) or fixed amount in cents
  currency TEXT,
  applicable_tiers TEXT[] DEFAULT '{}',
  applicable_plans UUID[] DEFAULT '{}',
  min_amount INTEGER, -- minimum purchase amount in cents
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  max_uses_per_customer INTEGER,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ,
  first_time_buyers BOOLEAN DEFAULT false,
  stackable BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Discount Usage table
CREATE TABLE IF NOT EXISTS user_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  used_count INTEGER DEFAULT 0,
  first_used_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, discount_id)
);

-- Trials table
CREATE TABLE IF NOT EXISTS trials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'premium', 'pro', 'enterprise')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'converted', 'canceled')) DEFAULT 'active',
  converted_to_subscription_id UUID REFERENCES subscriptions(id),
  reminders_sent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Free Credits table
CREATE TABLE IF NOT EXISTS free_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  source TEXT NOT NULL CHECK (source IN ('referral', 'promotion', 'refund', 'bonus', 'compensation')),
  description TEXT NOT NULL,
  remaining_amount INTEGER NOT NULL,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referee_email TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'signed_up', 'converted', 'rewarded', 'expired')) DEFAULT 'pending',
  signed_up_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  referrer_reward TEXT,
  referee_reward TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Changes/History table
CREATE TABLE IF NOT EXISTS subscription_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'cancel', 'reactivate', 'pause', 'resume')),
  from_tier TEXT NOT NULL CHECK (from_tier IN ('free', 'basic', 'premium', 'pro', 'enterprise')),
  to_tier TEXT NOT NULL CHECK (to_tier IN ('free', 'basic', 'premium', 'pro', 'enterprise')),
  from_plan_id UUID REFERENCES subscription_plans(id),
  to_plan_id UUID REFERENCES subscription_plans(id),
  proration_amount INTEGER, -- in cents
  effective_date TIMESTAMPTZ NOT NULL,
  reason TEXT,
  applied_by TEXT NOT NULL CHECK (applied_by IN ('user', 'admin', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cancellation Surveys table
CREATE TABLE IF NOT EXISTS cancellation_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  primary_reason TEXT NOT NULL CHECK (primary_reason IN ('too_expensive', 'not_using', 'missing_features', 'technical_issues', 'competitor', 'other')),
  secondary_reasons TEXT[] DEFAULT '{}',
  feedback TEXT,
  improvement_suggestions TEXT,
  likely_to_return INTEGER CHECK (likely_to_return BETWEEN 1 AND 10),
  would_recommend INTEGER CHECK (would_recommend BETWEEN 1 AND 10),
  retention_offer_shown BOOLEAN DEFAULT false,
  retention_offer_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Premium Features table
CREATE TABLE IF NOT EXISTS premium_features (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('alarms', 'battles', 'voice', 'themes', 'integrations', 'analytics', 'ai', 'collaboration', 'automation', 'customization')),
  icon TEXT,
  required_tier TEXT NOT NULL CHECK (required_tier IN ('basic', 'premium', 'pro', 'enterprise')),
  is_core BOOLEAN DEFAULT true,
  is_addon BOOLEAN DEFAULT false,
  addon_price INTEGER, -- in cents
  coming_soon BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Events table (for audit trail)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  actions TEXT[] DEFAULT '{}',
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Revenue Analytics Views
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
  SUM(amount) as total_revenue,
  SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END) as active_revenue,
  AVG(amount) as average_revenue_per_user
FROM subscriptions
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;

CREATE OR REPLACE VIEW subscription_tier_stats AS
SELECT 
  tier,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_revenue,
  AVG(EXTRACT(EPOCH FROM (COALESCE(canceled_at, NOW()) - created_at))/86400) as avg_lifetime_days
FROM subscriptions
GROUP BY tier;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON feature_usage(feature);
CREATE INDEX IF NOT EXISTS idx_feature_usage_reset_date ON feature_usage(reset_date);

CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_valid_from_until ON discounts(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_discounts_is_active ON discounts(is_active);

CREATE INDEX IF NOT EXISTS idx_trials_user_id ON trials(user_id);
CREATE INDEX IF NOT EXISTS idx_trials_status ON trials(status);
CREATE INDEX IF NOT EXISTS idx_trials_end_date ON trials(end_date);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);

-- Triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feature_usage_updated_at ON feature_usage;
CREATE TRIGGER update_feature_usage_updated_at
    BEFORE UPDATE ON feature_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trials_updated_at ON trials;
CREATE TRIGGER update_trials_updated_at
    BEFORE UPDATE ON trials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_surveys ENABLE ROW LEVEL SECURITY;

-- Subscription Plans are public (read-only for users)
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

-- Users can only access their own subscription data
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Payment methods - users can only access their own
CREATE POLICY "Users can manage own payment methods" ON payment_methods
    FOR ALL USING (auth.uid() = user_id);

-- Invoices - users can only access their own
CREATE POLICY "Users can view own invoices" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

-- Payments - users can only access their own
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Refunds - users can only access their own
CREATE POLICY "Users can view own refunds" ON refunds
    FOR SELECT USING (auth.uid() = user_id);

-- Feature usage - users can only access their own
CREATE POLICY "Users can view own feature usage" ON feature_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage feature usage" ON feature_usage
    FOR ALL USING (true); -- System/service role can manage all

-- User discounts - users can only access their own
CREATE POLICY "Users can view own discounts" ON user_discounts
    FOR ALL USING (auth.uid() = user_id);

-- Trials - users can only access their own
CREATE POLICY "Users can view own trials" ON trials
    FOR ALL USING (auth.uid() = user_id);

-- Free credits - users can only access their own
CREATE POLICY "Users can view own free credits" ON free_credits
    FOR ALL USING (auth.uid() = user_id);

-- Referrals - users can view their own (as referrer or referee)
CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can create referrals" ON referrals
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Cancellation surveys - users can only access their own
CREATE POLICY "Users can manage own cancellation surveys" ON cancellation_surveys
    FOR ALL USING (auth.uid() = user_id);

-- Premium features are public (read-only)
ALTER TABLE premium_features DISABLE ROW LEVEL SECURITY;

-- Discounts are public (read-only for code validation)
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active discounts" ON discounts
    FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- Webhook events - only system access
ALTER TABLE webhook_events DISABLE ROW LEVEL SECURITY;

-- Function to update user's subscription tier in users table
CREATE OR REPLACE FUNCTION update_user_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's subscription tier when subscription changes
    UPDATE users 
    SET 
        preferences = COALESCE(preferences, '{}'::jsonb) || jsonb_build_object('subscriptionTier', NEW.tier)
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update user subscription tier
DROP TRIGGER IF EXISTS update_user_tier ON subscriptions;
CREATE TRIGGER update_user_tier
    AFTER INSERT OR UPDATE OF tier, status ON subscriptions
    FOR EACH ROW
    WHEN (NEW.status = 'active')
    EXECUTE FUNCTION update_user_subscription_tier();

-- Function to handle subscription lifecycle events
CREATE OR REPLACE FUNCTION handle_subscription_lifecycle()
RETURNS TRIGGER AS $$
BEGIN
    -- Log subscription changes
    IF TG_OP = 'UPDATE' AND (OLD.status != NEW.status OR OLD.tier != NEW.tier) THEN
        INSERT INTO subscription_changes (
            subscription_id,
            user_id,
            change_type,
            from_tier,
            to_tier,
            from_plan_id,
            to_plan_id,
            effective_date,
            applied_by
        ) VALUES (
            NEW.id,
            NEW.user_id,
            CASE 
                WHEN NEW.status = 'canceled' THEN 'cancel'
                WHEN OLD.tier != NEW.tier THEN 
                    CASE WHEN NEW.tier > OLD.tier THEN 'upgrade' ELSE 'downgrade' END
                ELSE 'reactivate'
            END,
            OLD.tier,
            NEW.tier,
            OLD.plan_id,
            NEW.plan_id,
            NOW(),
            'system'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for subscription lifecycle
DROP TRIGGER IF EXISTS subscription_lifecycle ON subscriptions;
CREATE TRIGGER subscription_lifecycle
    AFTER UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_subscription_lifecycle();

-- Insert default subscription plans
INSERT INTO subscription_plans (
    tier, name, display_name, description, features, limits, pricing, is_active, sort_order
) VALUES 
(
    'free',
    'Free',
    'Free Forever',
    'Perfect for getting started with basic alarm features',
    '[
        {"id": "basic_alarms", "name": "Basic Alarms", "description": "Set up to 3 alarms"},
        {"id": "voice_commands", "name": "Voice Dismissal", "description": "Dismiss alarms with voice commands"},
        {"id": "basic_sounds", "name": "Basic Sounds", "description": "Access to 5 built-in alarm sounds"}
    ]'::jsonb,
    '{
        "maxAlarms": 3,
        "maxBattles": 1,
        "maxCustomSounds": 0,
        "maxVoiceProfiles": 1,
        "maxThemes": 2,
        "supportTier": "community",
        "advancedAnalytics": false
    }'::jsonb,
    '{
        "monthly": {"amount": 0, "currency": "usd"},
        "yearly": {"amount": 0, "currency": "usd"}
    }'::jsonb,
    true,
    0
),
(
    'basic',
    'Basic',
    'Basic Plan',
    'Great for individuals who want more alarm customization',
    '[
        {"id": "unlimited_alarms", "name": "Unlimited Alarms", "description": "Set unlimited alarms"},
        {"id": "voice_commands", "name": "Voice Dismissal", "description": "Advanced voice recognition"},
        {"id": "custom_sounds", "name": "Custom Sounds", "description": "Upload your own alarm sounds"},
        {"id": "basic_themes", "name": "Premium Themes", "description": "Access to 10 premium themes"},
        {"id": "alarm_battles", "name": "Alarm Battles", "description": "Join up to 5 battles per month"}
    ]'::jsonb,
    '{
        "maxAlarms": -1,
        "maxBattles": 5,
        "maxCustomSounds": 10,
        "maxVoiceProfiles": 3,
        "maxThemes": 10,
        "supportTier": "email",
        "advancedAnalytics": true
    }'::jsonb,
    '{
        "monthly": {"amount": 499, "currency": "usd"},
        "yearly": {"amount": 4999, "currency": "usd", "discountPercentage": 17}
    }'::jsonb,
    true,
    1
),
(
    'premium',
    'Premium',
    'Premium Plan',
    'Perfect for power users and battle enthusiasts',
    '[
        {"id": "unlimited_alarms", "name": "Unlimited Alarms", "description": "Set unlimited alarms"},
        {"id": "voice_commands", "name": "Advanced Voice AI", "description": "AI-powered voice recognition and responses"},
        {"id": "custom_sounds", "name": "Unlimited Custom Sounds", "description": "Upload unlimited custom sounds"},
        {"id": "premium_themes", "name": "All Themes", "description": "Access to all premium themes"},
        {"id": "unlimited_battles", "name": "Unlimited Battles", "description": "Join unlimited alarm battles"},
        {"id": "smart_scheduling", "name": "Smart Scheduling", "description": "AI-powered alarm optimization"},
        {"id": "calendar_integration", "name": "Calendar Integration", "description": "Sync with Google/Apple Calendar"},
        {"id": "weather_integration", "name": "Weather Integration", "description": "Weather-based alarm adjustments"},
        {"id": "advanced_analytics", "name": "Advanced Analytics", "description": "Detailed sleep and wake patterns"}
    ]'::jsonb,
    '{
        "maxAlarms": -1,
        "maxBattles": -1,
        "maxCustomSounds": -1,
        "maxVoiceProfiles": 10,
        "maxThemes": -1,
        "supportTier": "priority",
        "advancedAnalytics": true
    }'::jsonb,
    '{
        "monthly": {"amount": 999, "currency": "usd"},
        "yearly": {"amount": 9999, "currency": "usd", "discountPercentage": 17}
    }'::jsonb,
    true,
    2
),
(
    'pro',
    'Pro',
    'Pro Plan',
    'For teams and advanced users who need collaboration features',
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
        {"id": "white_label", "name": "White Label", "description": "Remove Relife branding"}
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
        "whiteLabel": true
    }'::jsonb,
    '{
        "monthly": {"amount": 1999, "currency": "usd"},
        "yearly": {"amount": 19999, "currency": "usd", "discountPercentage": 17}
    }'::jsonb,
    true,
    3
) ON CONFLICT (tier) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    pricing = EXCLUDED.pricing,
    updated_at = NOW();

-- Insert premium features
INSERT INTO premium_features (id, name, description, category, required_tier, is_core) VALUES
('unlimited_alarms', 'Unlimited Alarms', 'Set unlimited number of alarms', 'alarms', 'basic', true),
('custom_sounds', 'Custom Sounds', 'Upload and use custom alarm sounds', 'alarms', 'basic', true),
('premium_themes', 'Premium Themes', 'Access to premium visual themes', 'themes', 'basic', true),
('alarm_battles', 'Alarm Battles', 'Participate in competitive wake-up challenges', 'battles', 'basic', true),
('smart_scheduling', 'Smart Scheduling', 'AI-powered optimal alarm timing', 'ai', 'premium', true),
('calendar_integration', 'Calendar Integration', 'Sync with external calendars', 'integrations', 'premium', true),
('weather_integration', 'Weather Integration', 'Weather-based alarm adjustments', 'integrations', 'premium', true),
('advanced_analytics', 'Advanced Analytics', 'Detailed sleep and wake pattern analysis', 'analytics', 'premium', true),
('voice_ai_advanced', 'Advanced Voice AI', 'Enhanced voice recognition and responses', 'voice', 'premium', true),
('team_features', 'Team Collaboration', 'Team battles and group challenges', 'collaboration', 'pro', true),
('api_access', 'API Access', 'Developer API for custom integrations', 'integrations', 'pro', true),
('white_label', 'White Label', 'Remove Relife branding', 'customization', 'pro', true),
('custom_themes', 'Custom Theme Creator', 'Create and share custom themes', 'themes', 'pro', true),
('tournament_creation', 'Tournament Creation', 'Create and manage tournaments', 'battles', 'pro', true),
('priority_support', 'Priority Support', 'Priority customer support', 'collaboration', 'premium', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    required_tier = EXCLUDED.required_tier,
    is_core = EXCLUDED.is_core,
    updated_at = NOW();

-- Create function to check feature access
CREATE OR REPLACE FUNCTION check_feature_access(user_uuid UUID, feature_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    required_tier TEXT;
    tier_hierarchy TEXT[] := ARRAY['free', 'basic', 'premium', 'pro', 'enterprise'];
    user_tier_level INTEGER;
    required_tier_level INTEGER;
BEGIN
    -- Get user's current subscription tier
    SELECT COALESCE(s.tier, 'free')
    INTO user_tier
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
    WHERE u.id = user_uuid;
    
    -- Get required tier for the feature
    SELECT pf.required_tier
    INTO required_tier
    FROM premium_features pf
    WHERE pf.id = feature_id;
    
    -- If feature doesn't exist, deny access
    IF required_tier IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get tier levels for comparison
    SELECT array_position(tier_hierarchy, user_tier) INTO user_tier_level;
    SELECT array_position(tier_hierarchy, required_tier) INTO required_tier_level;
    
    -- Grant access if user tier is >= required tier
    RETURN user_tier_level >= required_tier_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE subscription_plans IS 'Available subscription plans and their features';
COMMENT ON TABLE subscriptions IS 'User subscription records with Stripe integration';
COMMENT ON TABLE payment_methods IS 'User payment methods stored via Stripe';
COMMENT ON TABLE invoices IS 'Invoice records from Stripe';
COMMENT ON TABLE payments IS 'Payment transaction records';
COMMENT ON TABLE refunds IS 'Refund transaction records';
COMMENT ON TABLE feature_usage IS 'Track feature usage against subscription limits';
COMMENT ON TABLE discounts IS 'Discount codes and promotions';
COMMENT ON TABLE user_discounts IS 'Track user usage of discount codes';
COMMENT ON TABLE trials IS 'Free trial periods for users';
COMMENT ON TABLE free_credits IS 'Free credits awarded to users';
COMMENT ON TABLE referrals IS 'User referral tracking';
COMMENT ON TABLE subscription_changes IS 'Audit trail of subscription changes';
COMMENT ON TABLE cancellation_surveys IS 'Exit surveys from canceled users';
COMMENT ON TABLE premium_features IS 'Master list of premium features and requirements';
COMMENT ON TABLE webhook_events IS 'Stripe webhook event processing log';

COMMENT ON FUNCTION check_feature_access IS 'Check if a user has access to a specific premium feature';
COMMENT ON FUNCTION update_user_subscription_tier IS 'Update user subscription tier when subscription changes';
COMMENT ON FUNCTION handle_subscription_lifecycle IS 'Handle subscription status and tier changes';