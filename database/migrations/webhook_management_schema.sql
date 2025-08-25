-- Webhook Management Schema
-- Enhanced schema for comprehensive webhook management
-- Run after existing webhook_logs migration

-- Create webhook_configs table
CREATE TABLE IF NOT EXISTS webhook_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('stripe', 'push', 'monitoring', 'custom')),
    url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'maintenance')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    secret_key TEXT,
    
    -- Configuration metadata
    metadata JSONB DEFAULT '{}',
    
    -- Rate limiting and retry settings
    rate_limit_per_minute INTEGER DEFAULT 1000,
    max_retries INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    
    -- Monitoring settings  
    alert_on_failure BOOLEAN DEFAULT true,
    failure_threshold INTEGER DEFAULT 5,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_health_check TIMESTAMPTZ,
    
    -- Indexes
    UNIQUE(name, type)
);

-- Enhanced webhook_logs table (extend existing)
-- Add columns to existing webhook_logs table
DO $$ 
BEGIN 
    -- Add webhook_id foreign key if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'webhook_id'
    ) THEN
        ALTER TABLE webhook_logs ADD COLUMN webhook_id UUID REFERENCES webhook_configs(id) ON DELETE CASCADE;
    END IF;
    
    -- Add response_time if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'response_time'
    ) THEN
        ALTER TABLE webhook_logs ADD COLUMN response_time INTEGER; -- in milliseconds
    END IF;
    
    -- Add request_headers if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'request_headers'
    ) THEN
        ALTER TABLE webhook_logs ADD COLUMN request_headers JSONB;
    END IF;
    
    -- Add response_headers if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'response_headers'
    ) THEN
        ALTER TABLE webhook_logs ADD COLUMN response_headers JSONB;
    END IF;
    
    -- Add response_body if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'response_body'
    ) THEN
        ALTER TABLE webhook_logs ADD COLUMN response_body TEXT;
    END IF;
    
    -- Add ip_address if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE webhook_logs ADD COLUMN ip_address INET;
    END IF;
    
    -- Add user_agent if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE webhook_logs ADD COLUMN user_agent TEXT;
    END IF;
END $$;

-- Create webhook_failures table for detailed failure tracking
CREATE TABLE IF NOT EXISTS webhook_failures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_config_id UUID REFERENCES webhook_configs(id) ON DELETE CASCADE,
    webhook_log_id UUID REFERENCES webhook_logs(id) ON DELETE CASCADE,
    failure_type VARCHAR(100) NOT NULL,
    failure_reason TEXT NOT NULL,
    failure_details JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook_rate_limits table for rate limiting tracking
CREATE TABLE IF NOT EXISTS webhook_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_config_id UUID REFERENCES webhook_configs(id) ON DELETE CASCADE,
    ip_address INET,
    requests_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    window_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 minute',
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(webhook_config_id, ip_address, window_start)
);

-- Create webhook_security_events table
CREATE TABLE IF NOT EXISTS webhook_security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_config_id UUID REFERENCES webhook_configs(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    request_headers JSONB,
    blocked BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_configs_type ON webhook_configs(type);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_status ON webhook_configs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_enabled ON webhook_configs(enabled);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_created_at ON webhook_configs(created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_response_time ON webhook_logs(response_time);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_ip_address ON webhook_logs(ip_address);

CREATE INDEX IF NOT EXISTS idx_webhook_failures_config_id ON webhook_failures(webhook_config_id);
CREATE INDEX IF NOT EXISTS idx_webhook_failures_resolved ON webhook_failures(resolved);
CREATE INDEX IF NOT EXISTS idx_webhook_failures_created_at ON webhook_failures(created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_config_id ON webhook_rate_limits(webhook_config_id);
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_window ON webhook_rate_limits(window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_ip ON webhook_rate_limits(ip_address);

CREATE INDEX IF NOT EXISTS idx_webhook_security_events_config_id ON webhook_security_events(webhook_config_id);
CREATE INDEX IF NOT EXISTS idx_webhook_security_events_severity ON webhook_security_events(severity);
CREATE INDEX IF NOT EXISTS idx_webhook_security_events_created_at ON webhook_security_events(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_webhook_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhook_configs_updated_at_trigger
    BEFORE UPDATE ON webhook_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_configs_updated_at();

-- Enhanced views for monitoring and analytics

-- Webhook health status view
CREATE OR REPLACE VIEW webhook_health_status AS
SELECT 
    wc.id,
    wc.name,
    wc.type,
    wc.status,
    wc.enabled,
    COUNT(wl.id) as total_events_24h,
    COUNT(CASE WHEN wl.status = 'success' THEN 1 END) as success_events_24h,
    COUNT(CASE WHEN wl.status = 'error' THEN 1 END) as error_events_24h,
    COALESCE(
        ROUND(
            COUNT(CASE WHEN wl.status = 'success' THEN 1 END)::NUMERIC / 
            NULLIF(COUNT(wl.id), 0) * 100, 
            2
        ), 
        0
    ) as success_rate_24h,
    AVG(wl.response_time) as avg_response_time_24h,
    MAX(wl.created_at) as last_event_at,
    wc.last_health_check
FROM webhook_configs wc
LEFT JOIN webhook_logs wl ON wc.id = wl.webhook_id 
    AND wl.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY wc.id, wc.name, wc.type, wc.status, wc.enabled, wc.last_health_check;

-- Webhook performance metrics view
CREATE OR REPLACE VIEW webhook_performance_metrics AS
SELECT 
    wc.id,
    wc.name,
    wc.type,
    DATE_TRUNC('hour', wl.created_at) as hour_bucket,
    COUNT(*) as events_count,
    COUNT(CASE WHEN wl.status = 'success' THEN 1 END) as success_count,
    COUNT(CASE WHEN wl.status = 'error' THEN 1 END) as error_count,
    AVG(wl.response_time) as avg_response_time,
    MIN(wl.response_time) as min_response_time,
    MAX(wl.response_time) as max_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY wl.response_time) as p95_response_time
FROM webhook_configs wc
LEFT JOIN webhook_logs wl ON wc.id = wl.webhook_id
WHERE wl.created_at >= NOW() - INTERVAL '7 days'
GROUP BY wc.id, wc.name, wc.type, DATE_TRUNC('hour', wl.created_at)
ORDER BY hour_bucket DESC;

-- Security events summary view
CREATE OR REPLACE VIEW webhook_security_summary AS
SELECT 
    wc.id,
    wc.name,
    COUNT(wse.id) as total_security_events,
    COUNT(CASE WHEN wse.severity = 'critical' THEN 1 END) as critical_events,
    COUNT(CASE WHEN wse.severity = 'high' THEN 1 END) as high_events,
    COUNT(CASE WHEN wse.severity = 'medium' THEN 1 END) as medium_events,
    COUNT(CASE WHEN wse.severity = 'low' THEN 1 END) as low_events,
    MAX(wse.created_at) as last_security_event
FROM webhook_configs wc
LEFT JOIN webhook_security_events wse ON wc.id = wse.webhook_config_id
    AND wse.created_at >= NOW() - INTERVAL '30 days'
GROUP BY wc.id, wc.name;

-- Functions for webhook management

-- Function to get webhook statistics
CREATE OR REPLACE FUNCTION get_webhook_analytics(
    webhook_id_param UUID DEFAULT NULL,
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
    webhook_id UUID,
    webhook_name VARCHAR(255),
    webhook_type VARCHAR(50),
    total_events BIGINT,
    success_events BIGINT,
    error_events BIGINT,
    success_rate NUMERIC,
    avg_response_time NUMERIC,
    p95_response_time NUMERIC,
    max_response_time INTEGER,
    total_failures BIGINT,
    unique_ips BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wc.id,
        wc.name,
        wc.type,
        COUNT(wl.id) as total_events,
        COUNT(CASE WHEN wl.status = 'success' THEN 1 END) as success_events,
        COUNT(CASE WHEN wl.status = 'error' THEN 1 END) as error_events,
        COALESCE(
            ROUND(
                COUNT(CASE WHEN wl.status = 'success' THEN 1 END)::NUMERIC / 
                NULLIF(COUNT(wl.id), 0) * 100, 
                2
            ), 
            0
        ) as success_rate,
        ROUND(AVG(wl.response_time), 2) as avg_response_time,
        ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY wl.response_time), 2) as p95_response_time,
        MAX(wl.response_time) as max_response_time,
        COUNT(wf.id) as total_failures,
        COUNT(DISTINCT wl.ip_address) as unique_ips
    FROM webhook_configs wc
    LEFT JOIN webhook_logs wl ON wc.id = wl.webhook_id
        AND wl.created_at BETWEEN start_date AND end_date
    LEFT JOIN webhook_failures wf ON wc.id = wf.webhook_config_id
        AND wf.created_at BETWEEN start_date AND end_date
    WHERE (webhook_id_param IS NULL OR wc.id = webhook_id_param)
    GROUP BY wc.id, wc.name, wc.type
    ORDER BY total_events DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old webhook data
CREATE OR REPLACE FUNCTION cleanup_webhook_data(
    retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    cutoff_date TIMESTAMPTZ;
BEGIN
    cutoff_date := NOW() - INTERVAL '1 day' * retention_days;
    
    -- Delete old webhook logs
    DELETE FROM webhook_logs 
    WHERE created_at < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete resolved webhook failures older than retention period
    DELETE FROM webhook_failures 
    WHERE resolved = true AND created_at < cutoff_date;
    
    -- Delete old rate limit records
    DELETE FROM webhook_rate_limits 
    WHERE window_end < cutoff_date;
    
    -- Delete old security events (keep critical ones longer)
    DELETE FROM webhook_security_events 
    WHERE created_at < cutoff_date AND severity NOT IN ('critical', 'high');
    
    -- Delete very old critical security events
    DELETE FROM webhook_security_events 
    WHERE created_at < (cutoff_date - INTERVAL '30 days') AND severity IN ('critical', 'high');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check webhook health
CREATE OR REPLACE FUNCTION check_webhook_health()
RETURNS TABLE(
    webhook_id UUID,
    webhook_name VARCHAR(255),
    health_status VARCHAR(20),
    issues TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wc.id,
        wc.name,
        CASE 
            WHEN NOT wc.enabled THEN 'disabled'
            WHEN wc.status != 'active' THEN 'unhealthy'
            WHEN recent_stats.success_rate < 80 THEN 'degraded'
            WHEN recent_stats.avg_response_time > 10000 THEN 'slow'
            ELSE 'healthy'
        END as health_status,
        ARRAY[
            CASE WHEN NOT wc.enabled THEN 'Webhook is disabled' END,
            CASE WHEN wc.status != 'active' THEN 'Webhook status is ' || wc.status END,
            CASE WHEN recent_stats.success_rate < 80 THEN 'Success rate below 80%' END,
            CASE WHEN recent_stats.avg_response_time > 10000 THEN 'High response time' END,
            CASE WHEN recent_stats.total_events = 0 THEN 'No recent activity' END
        ]::TEXT[] as issues
    FROM webhook_configs wc
    LEFT JOIN (
        SELECT 
            webhook_id,
            COUNT(*) as total_events,
            AVG(CASE WHEN status = 'success' THEN 100.0 ELSE 0.0 END) as success_rate,
            AVG(response_time) as avg_response_time
        FROM webhook_logs 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY webhook_id
    ) recent_stats ON wc.id = recent_stats.webhook_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_security_events ENABLE ROW LEVEL SECURITY;

-- Policies for service role access
CREATE POLICY "Service role can manage webhook configs" ON webhook_configs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage webhook failures" ON webhook_failures
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage rate limits" ON webhook_rate_limits
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage security events" ON webhook_security_events
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON webhook_configs TO service_role;
GRANT ALL ON webhook_failures TO service_role;
GRANT ALL ON webhook_rate_limits TO service_role;
GRANT ALL ON webhook_security_events TO service_role;

GRANT SELECT ON webhook_health_status TO service_role;
GRANT SELECT ON webhook_performance_metrics TO service_role;
GRANT SELECT ON webhook_security_summary TO service_role;

GRANT EXECUTE ON FUNCTION get_webhook_analytics(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_webhook_data(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION check_webhook_health() TO service_role;

-- Insert default webhook configurations
INSERT INTO webhook_configs (name, type, url, metadata) VALUES
('Stripe Payment Webhooks', 'stripe', 'https://your-domain.com/api/stripe/webhooks', '{"events": ["customer.subscription.created", "invoice.payment_succeeded"]}'),
('Push Notifications', 'push', 'https://your-domain.com/api/push/webhook', '{"platforms": ["ios", "android", "web"]}'),
('Slack Monitoring', 'monitoring', 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK', '{"channel": "#alerts"}'),
('Discord Alerts', 'monitoring', 'https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK', '{"channel": "alerts"}}')
ON CONFLICT (name, type) DO NOTHING;

-- Add table comments
COMMENT ON TABLE webhook_configs IS 'Webhook configuration and management';
COMMENT ON TABLE webhook_failures IS 'Detailed webhook failure tracking';
COMMENT ON TABLE webhook_rate_limits IS 'Rate limiting tracking per webhook and IP';
COMMENT ON TABLE webhook_security_events IS 'Security events and violations';

COMMENT ON VIEW webhook_health_status IS 'Real-time webhook health monitoring';
COMMENT ON VIEW webhook_performance_metrics IS 'Webhook performance analytics by hour';
COMMENT ON VIEW webhook_security_summary IS 'Security events summary by webhook';

COMMENT ON FUNCTION get_webhook_analytics(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Comprehensive webhook analytics for date range';
COMMENT ON FUNCTION cleanup_webhook_data(INTEGER) IS 'Cleanup old webhook data based on retention period';
COMMENT ON FUNCTION check_webhook_health() IS 'Check health status of all webhooks';