-- Webhook Logs Table for Stripe Webhook Processing
-- Tracks webhook events for idempotency and debugging

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'error', 'processing')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    
    -- Indexes
    CONSTRAINT webhook_logs_stripe_event_id_key UNIQUE (stripe_event_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed_at ON webhook_logs(processed_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_webhook_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhook_logs_updated_at_trigger
    BEFORE UPDATE ON webhook_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_logs_updated_at();

-- Create a view for webhook event summary
CREATE OR REPLACE VIEW webhook_event_summary AS
SELECT 
    event_type,
    status,
    COUNT(*) as event_count,
    MAX(processed_at) as last_processed,
    MIN(processed_at) as first_processed,
    AVG(retry_count) as avg_retry_count,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count
FROM webhook_logs
GROUP BY event_type, status
ORDER BY event_type, status;

-- Create a function to clean up old webhook logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webhook_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get webhook processing stats
CREATE OR REPLACE FUNCTION get_webhook_stats(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
    event_type VARCHAR(100),
    total_events BIGINT,
    success_events BIGINT,
    error_events BIGINT,
    success_rate NUMERIC,
    avg_retry_count NUMERIC,
    last_event TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wl.event_type,
        COUNT(*) as total_events,
        COUNT(CASE WHEN wl.status = 'success' THEN 1 END) as success_events,
        COUNT(CASE WHEN wl.status = 'error' THEN 1 END) as error_events,
        ROUND(
            COUNT(CASE WHEN wl.status = 'success' THEN 1 END)::NUMERIC / 
            COUNT(*)::NUMERIC * 100, 2
        ) as success_rate,
        ROUND(AVG(wl.retry_count), 2) as avg_retry_count,
        MAX(wl.processed_at) as last_event
    FROM webhook_logs wl
    WHERE wl.created_at BETWEEN start_date AND end_date
    GROUP BY wl.event_type
    ORDER BY total_events DESC;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access webhook logs
CREATE POLICY "Service role can access webhook logs" ON webhook_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON webhook_logs TO service_role;
GRANT SELECT ON webhook_event_summary TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_webhook_logs() TO service_role;
GRANT EXECUTE ON FUNCTION get_webhook_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- Add comments for documentation
COMMENT ON TABLE webhook_logs IS 'Logs of processed Stripe webhook events for idempotency and debugging';
COMMENT ON COLUMN webhook_logs.stripe_event_id IS 'Unique Stripe event ID for idempotency';
COMMENT ON COLUMN webhook_logs.event_type IS 'Type of Stripe webhook event (e.g., customer.subscription.created)';
COMMENT ON COLUMN webhook_logs.status IS 'Processing status: success, error, or processing';
COMMENT ON COLUMN webhook_logs.error_message IS 'Error message if processing failed';
COMMENT ON COLUMN webhook_logs.retry_count IS 'Number of times this event was retried';
COMMENT ON COLUMN webhook_logs.metadata IS 'Additional event metadata and processing details';

COMMENT ON VIEW webhook_event_summary IS 'Summary statistics of webhook events by type and status';
COMMENT ON FUNCTION cleanup_old_webhook_logs() IS 'Removes webhook logs older than 90 days';
COMMENT ON FUNCTION get_webhook_stats(TIMESTAMPTZ, TIMESTAMPTZ) IS 'Returns webhook processing statistics for a date range';