-- Analytics Database Migration
-- Creates tables and indexes for persona-driven analytics tracking

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS persona_analytics_events CASCADE;
DROP TABLE IF EXISTS campaign_performance CASCADE;
DROP TABLE IF EXISTS persona_conversion_funnel CASCADE;
DROP TABLE IF EXISTS analytics_reports CASCADE;

-- Create persona analytics events table
CREATE TABLE persona_analytics_events (
    id SERIAL PRIMARY KEY,
    user_id TEXT,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    persona TEXT NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    detection_method TEXT CHECK (detection_method IN ('behavioral', 'explicit', 'inferred')),
    conversion_step TEXT CHECK (conversion_step IN ('awareness', 'consideration', 'trial', 'conversion', 'retention')),
    campaign_source TEXT CHECK (campaign_source IN ('email', 'social', 'organic', 'paid', 'referral')),
    previous_persona TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create campaign performance table
CREATE TABLE campaign_performance (
    id SERIAL PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    persona TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'social', 'display', 'search', 'influencer', 'organic')),
    impressions INTEGER DEFAULT 0 CHECK (impressions >= 0),
    clicks INTEGER DEFAULT 0 CHECK (clicks >= 0),
    conversions INTEGER DEFAULT 0 CHECK (conversions >= 0),
    revenue DECIMAL(10,2) DEFAULT 0 CHECK (revenue >= 0),
    ctr DECIMAL(5,4) DEFAULT 0 CHECK (ctr >= 0),
    conversion_rate DECIMAL(5,4) DEFAULT 0 CHECK (conversion_rate >= 0),
    cost_per_acquisition DECIMAL(10,2) DEFAULT 0 CHECK (cost_per_acquisition >= 0),
    return_on_ad_spend DECIMAL(8,2) DEFAULT 0,
    campaign_start_date DATE,
    campaign_end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(campaign_id, persona)
);

-- Create persona conversion funnel tracking table
CREATE TABLE persona_conversion_funnel (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    persona TEXT NOT NULL,
    funnel_step TEXT NOT NULL CHECK (funnel_step IN ('landing', 'signup', 'onboarding', 'trial', 'payment', 'active')),
    step_order INTEGER NOT NULL,
    time_in_step INTEGER, -- seconds spent in this step
    completed_step BOOLEAN DEFAULT false,
    exit_point BOOLEAN DEFAULT false,
    conversion_attribution TEXT, -- which campaign/source led to this conversion
    step_metadata JSONB DEFAULT '{}',
    entered_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create analytics reports storage table for pre-computed reports
CREATE TABLE analytics_reports (
    id SERIAL PRIMARY KEY,
    report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'custom')),
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    personas_included TEXT[] DEFAULT ARRAY[]::TEXT[],
    campaigns_included TEXT[] DEFAULT ARRAY[]::TEXT[],
    report_data JSONB NOT NULL,
    summary_metrics JSONB DEFAULT '{}',
    generated_by TEXT, -- user who generated report
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance optimization

-- Analytics events indexes
CREATE INDEX idx_analytics_events_persona ON persona_analytics_events(persona);
CREATE INDEX idx_analytics_events_timestamp ON persona_analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_user_id ON persona_analytics_events(user_id);
CREATE INDEX idx_analytics_events_session_id ON persona_analytics_events(session_id);
CREATE INDEX idx_analytics_events_event_type ON persona_analytics_events(event_type);
CREATE INDEX idx_analytics_events_conversion_step ON persona_analytics_events(conversion_step);
CREATE INDEX idx_analytics_events_campaign_source ON persona_analytics_events(campaign_source);
CREATE INDEX idx_analytics_events_composite ON persona_analytics_events(persona, conversion_step, created_at DESC);

-- Campaign performance indexes
CREATE INDEX idx_campaign_performance_persona ON campaign_performance(persona);
CREATE INDEX idx_campaign_performance_campaign_id ON campaign_performance(campaign_id);
CREATE INDEX idx_campaign_performance_channel ON campaign_performance(channel);
CREATE INDEX idx_campaign_performance_active ON campaign_performance(is_active) WHERE is_active = true;
CREATE INDEX idx_campaign_performance_revenue ON campaign_performance(revenue DESC);
CREATE INDEX idx_campaign_performance_conversion_rate ON campaign_performance(conversion_rate DESC);
CREATE INDEX idx_campaign_performance_updated_at ON campaign_performance(updated_at DESC);

-- Conversion funnel indexes
CREATE INDEX idx_funnel_user_id ON persona_conversion_funnel(user_id);
CREATE INDEX idx_funnel_session_id ON persona_conversion_funnel(session_id);
CREATE INDEX idx_funnel_persona ON persona_conversion_funnel(persona);
CREATE INDEX idx_funnel_step ON persona_conversion_funnel(funnel_step);
CREATE INDEX idx_funnel_completion ON persona_conversion_funnel(completed_step);
CREATE INDEX idx_funnel_timeline ON persona_conversion_funnel(persona, step_order, entered_at DESC);

-- Reports indexes
CREATE INDEX idx_reports_type ON analytics_reports(report_type);
CREATE INDEX idx_reports_period ON analytics_reports(report_period_start, report_period_end);
CREATE INDEX idx_reports_status ON analytics_reports(status);
CREATE INDEX idx_reports_created_at ON analytics_reports(created_at DESC);

-- Create trigger functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_persona_analytics_events_updated_at 
    BEFORE UPDATE ON persona_analytics_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_performance_updated_at 
    BEFORE UPDATE ON campaign_performance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_reports_updated_at 
    BEFORE UPDATE ON analytics_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create useful views for common analytics queries

-- Persona performance summary view
CREATE VIEW persona_performance_summary AS
SELECT 
    persona,
    COUNT(*) as total_events,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(confidence) as avg_confidence,
    COUNT(CASE WHEN conversion_step = 'conversion' THEN 1 END) as conversions,
    CASE 
        WHEN COUNT(*) > 0 THEN 
            (COUNT(CASE WHEN conversion_step = 'conversion' THEN 1 END)::float / COUNT(*) * 100)
        ELSE 0 
    END as conversion_rate,
    SUM((metadata->>'revenue')::DECIMAL) as total_revenue,
    DATE_TRUNC('day', created_at) as date
FROM persona_analytics_events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY persona, DATE_TRUNC('day', created_at)
ORDER BY date DESC, total_events DESC;

-- Campaign ROI view
CREATE VIEW campaign_roi_summary AS
SELECT 
    campaign_id,
    persona,
    channel,
    impressions,
    clicks,
    conversions,
    revenue,
    CASE 
        WHEN impressions > 0 THEN (clicks::float / impressions * 100)
        ELSE 0 
    END as ctr_percentage,
    CASE 
        WHEN clicks > 0 THEN (conversions::float / clicks * 100)
        ELSE 0 
    END as conversion_rate_percentage,
    CASE 
        WHEN conversions > 0 AND cost_per_acquisition > 0 THEN 
            (revenue / (conversions * cost_per_acquisition))
        ELSE 0 
    END as roas,
    CASE 
        WHEN conversions > 0 THEN (revenue / conversions)
        ELSE 0 
    END as revenue_per_conversion,
    updated_at
FROM campaign_performance
WHERE is_active = true
ORDER BY roas DESC, revenue DESC;

-- Daily analytics summary view
CREATE VIEW daily_analytics_summary AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    persona,
    COUNT(*) as total_events,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(confidence) as avg_confidence,
    COUNT(CASE WHEN event_type = 'persona_detected' THEN 1 END) as persona_detections,
    COUNT(CASE WHEN event_type = 'persona_cta_clicked' THEN 1 END) as cta_clicks,
    COUNT(CASE WHEN event_type = 'persona_subscription_converted' THEN 1 END) as conversions,
    COUNT(CASE WHEN event_type = 'persona_onboarding_completed' THEN 1 END) as onboarding_completions,
    SUM((metadata->>'revenue')::DECIMAL) as total_revenue
FROM persona_analytics_events
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at), persona
ORDER BY date DESC, total_events DESC;

-- Create helper functions for analytics calculations

-- Function to calculate conversion rate between two steps
CREATE OR REPLACE FUNCTION calculate_conversion_rate(
    start_step TEXT,
    end_step TEXT,
    persona_filter TEXT DEFAULT NULL,
    date_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    date_to DATE DEFAULT CURRENT_DATE
) 
RETURNS DECIMAL AS $$
DECLARE
    start_count INTEGER;
    end_count INTEGER;
    conversion_rate DECIMAL;
BEGIN
    -- Count events at start step
    SELECT COUNT(*) INTO start_count
    FROM persona_analytics_events
    WHERE conversion_step = start_step
        AND created_at BETWEEN date_from AND date_to
        AND (persona_filter IS NULL OR persona = persona_filter);
    
    -- Count events at end step  
    SELECT COUNT(*) INTO end_count
    FROM persona_analytics_events
    WHERE conversion_step = end_step
        AND created_at BETWEEN date_from AND date_to
        AND (persona_filter IS NULL OR persona = persona_filter);
    
    -- Calculate conversion rate
    IF start_count > 0 THEN
        conversion_rate := (end_count::DECIMAL / start_count::DECIMAL * 100);
    ELSE
        conversion_rate := 0;
    END IF;
    
    RETURN conversion_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to get top performing personas by metric
CREATE OR REPLACE FUNCTION get_top_personas(
    metric_type TEXT DEFAULT 'conversion_rate', -- 'conversion_rate', 'revenue', 'events'
    limit_count INTEGER DEFAULT 5,
    date_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    persona TEXT,
    metric_value DECIMAL,
    total_events BIGINT,
    conversions BIGINT,
    revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pae.persona,
        CASE 
            WHEN metric_type = 'conversion_rate' THEN 
                CASE WHEN COUNT(*) > 0 THEN 
                    (COUNT(CASE WHEN conversion_step = 'conversion' THEN 1 END)::DECIMAL / COUNT(*) * 100)
                ELSE 0 END
            WHEN metric_type = 'revenue' THEN 
                COALESCE(SUM((metadata->>'revenue')::DECIMAL), 0)
            ELSE COUNT(*)::DECIMAL
        END as metric_value,
        COUNT(*) as total_events,
        COUNT(CASE WHEN conversion_step = 'conversion' THEN 1 END) as conversions,
        COALESCE(SUM((metadata->>'revenue')::DECIMAL), 0) as revenue
    FROM persona_analytics_events pae
    WHERE pae.created_at BETWEEN date_from AND date_to
    GROUP BY pae.persona
    ORDER BY metric_value DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to track persona change patterns
CREATE OR REPLACE FUNCTION analyze_persona_stability(
    date_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    persona TEXT,
    stability_score DECIMAL,
    total_detections BIGINT,
    persona_changes BIGINT,
    avg_confidence DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pae.persona,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ((COUNT(*) - COUNT(CASE WHEN event_type = 'persona_changed' THEN 1 END))::DECIMAL / COUNT(*) * 100)
            ELSE 0 
        END as stability_score,
        COUNT(*) as total_detections,
        COUNT(CASE WHEN event_type = 'persona_changed' THEN 1 END) as persona_changes,
        AVG(confidence) * 100 as avg_confidence
    FROM persona_analytics_events pae
    WHERE pae.created_at BETWEEN date_from AND date_to
        AND pae.event_type IN ('persona_detected', 'persona_changed')
    GROUP BY pae.persona
    ORDER BY stability_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing (optional)
INSERT INTO persona_analytics_events (user_id, session_id, event_type, persona, confidence, detection_method, conversion_step, campaign_source, metadata) VALUES
('user_001', 'session_001', 'persona_detected', 'struggling_sam', 0.85, 'behavioral', 'awareness', 'organic', '{"device": "mobile", "source_page": "landing"}'),
('user_001', 'session_001', 'persona_pricing_viewed', 'struggling_sam', 0.90, 'explicit', 'consideration', 'organic', '{"tier": "Basic", "time_spent": 45}'),
('user_002', 'session_002', 'persona_detected', 'busy_ben', 0.92, 'behavioral', 'awareness', 'email', '{"device": "desktop", "email_campaign": "productivity_series"}'),
('user_002', 'session_002', 'persona_cta_clicked', 'busy_ben', 0.95, 'explicit', 'consideration', 'email', '{"cta": "Start Free Trial", "tier": "Premium"}'),
('user_003', 'session_003', 'persona_detected', 'professional_paula', 0.88, 'behavioral', 'awareness', 'social', '{"device": "mobile", "social_platform": "linkedin"}'),
('user_003', 'session_003', 'persona_subscription_converted', 'professional_paula', 1.0, 'explicit', 'conversion', 'social', '{"tier": "Premium", "revenue": 95.88, "trial_duration": 14}');

-- Insert sample campaign performance data
INSERT INTO campaign_performance (campaign_id, persona, channel, impressions, clicks, conversions, revenue, ctr, conversion_rate, cost_per_acquisition, campaign_start_date, campaign_end_date) VALUES
('email_welcome_struggling_sam', 'struggling_sam', 'email', 5000, 250, 20, 959.60, 0.050, 0.080, 15.50, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '7 days'),
('social_linkedin_professional_paula', 'professional_paula', 'social', 8000, 400, 50, 4794.00, 0.050, 0.125, 28.75, CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '15 days'),
('paid_google_busy_ben', 'busy_ben', 'search', 12000, 720, 90, 8629.20, 0.060, 0.125, 32.50, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '30 days');

-- Add comments to document the schema
COMMENT ON TABLE persona_analytics_events IS 'Stores all persona detection and user interaction events for analytics tracking';
COMMENT ON TABLE campaign_performance IS 'Tracks performance metrics for marketing campaigns by persona and channel';
COMMENT ON TABLE persona_conversion_funnel IS 'Detailed funnel tracking for conversion optimization by persona';
COMMENT ON TABLE analytics_reports IS 'Pre-computed analytics reports for performance optimization';

COMMENT ON COLUMN persona_analytics_events.confidence IS 'Algorithm confidence score for persona detection (0-1 scale)';
COMMENT ON COLUMN persona_analytics_events.detection_method IS 'How the persona was detected: behavioral analysis, explicit user input, or inferred from actions';
COMMENT ON COLUMN persona_analytics_events.metadata IS 'Flexible JSON field for additional event-specific data';

COMMENT ON VIEW persona_performance_summary IS 'Daily summary of persona performance metrics for quick analysis';
COMMENT ON VIEW campaign_roi_summary IS 'Campaign return on investment calculations with key performance indicators';
COMMENT ON VIEW daily_analytics_summary IS 'Comprehensive daily analytics breakdown by persona';

-- Grant permissions (adjust based on your user roles)
GRANT SELECT, INSERT, UPDATE ON persona_analytics_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON campaign_performance TO authenticated;  
GRANT SELECT ON persona_performance_summary TO authenticated;
GRANT SELECT ON campaign_roi_summary TO authenticated;
GRANT SELECT ON daily_analytics_summary TO authenticated;

-- Create sequence permissions
GRANT USAGE ON SEQUENCE persona_analytics_events_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE campaign_performance_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE persona_conversion_funnel_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE analytics_reports_id_seq TO authenticated;

COMMIT;