-- API Key Management System
-- Migration: 009_create_api_keys_table.sql
-- Version: 1.0.0
-- Description: Creates secure API key management system with rotation capabilities

-- Drop existing objects if they exist (for safe re-running)
DROP TABLE IF EXISTS api_key_usage_logs CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TYPE IF EXISTS api_key_status CASCADE;
DROP TYPE IF EXISTS api_key_scope CASCADE;

-- Create enum types for API key management
CREATE TYPE api_key_status AS ENUM ('active', 'suspended', 'revoked', 'expired');
CREATE TYPE api_key_scope AS ENUM ('read', 'write', 'admin', 'parameter_read', 'parameter_write', 'analytics_read', 'user_management');

-- API Keys table with comprehensive security features
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Key identification
  key_name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL, -- SHA-256 hash of the actual key
  key_prefix TEXT NOT NULL, -- First 8 characters for identification (e.g., "rl_live_")
  key_suffix TEXT NOT NULL, -- Last 4 characters for partial display
  
  -- Ownership and permissions
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Status and lifecycle
  status api_key_status DEFAULT 'active',
  scopes api_key_scope[] DEFAULT ARRAY['read']::api_key_scope[],
  
  -- Rate limiting and usage
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,
  usage_count BIGINT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_used_ip INET,
  
  -- Security features
  allowed_ips INET[] DEFAULT NULL, -- NULL = allow all IPs
  allowed_origins TEXT[] DEFAULT NULL, -- NULL = allow all origins
  allowed_user_agents TEXT[] DEFAULT NULL, -- NULL = allow all user agents
  
  -- Rotation and expiration
  expires_at TIMESTAMPTZ DEFAULT NULL, -- NULL = never expires
  rotation_schedule INTERVAL DEFAULT NULL, -- NULL = no automatic rotation
  next_rotation_at TIMESTAMPTZ DEFAULT NULL,
  rotated_from UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  
  -- Environment and purpose
  environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  purpose TEXT, -- Brief description of what this key is for
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT api_keys_name_length CHECK (LENGTH(key_name) BETWEEN 1 AND 100),
  CONSTRAINT api_keys_positive_limits CHECK (
    rate_limit_per_minute > 0 AND 
    rate_limit_per_hour > 0 AND 
    rate_limit_per_day > 0
  ),
  CONSTRAINT api_keys_consistent_limits CHECK (
    rate_limit_per_minute <= rate_limit_per_hour AND
    rate_limit_per_hour <= rate_limit_per_day
  )
);

-- API Key usage logs for monitoring and analytics
CREATE TABLE api_key_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  
  -- Request details
  method TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  
  -- Client information
  ip_address INET,
  user_agent TEXT,
  origin TEXT,
  
  -- Timing and performance
  request_timestamp TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER,
  
  -- Rate limiting info
  rate_limit_remaining INTEGER,
  rate_limit_reset_at TIMESTAMPTZ,
  
  -- Error tracking
  error_message TEXT,
  error_code TEXT,
  
  -- Security events
  security_violation BOOLEAN DEFAULT FALSE,
  violation_type TEXT, -- e.g., 'ip_blocked', 'rate_limit_exceeded', 'invalid_scope'
  
  -- Additional metadata
  request_size BIGINT,
  response_size BIGINT,
  metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_status ON api_keys(status) WHERE status = 'active';
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_api_keys_next_rotation ON api_keys(next_rotation_at) WHERE next_rotation_at IS NOT NULL;

CREATE INDEX idx_api_key_usage_logs_key_id ON api_key_usage_logs(api_key_id);
CREATE INDEX idx_api_key_usage_logs_timestamp ON api_key_usage_logs(request_timestamp);
CREATE INDEX idx_api_key_usage_logs_security ON api_key_usage_logs(security_violation) WHERE security_violation = TRUE;

-- Composite indexes for common queries
CREATE INDEX idx_api_keys_user_status ON api_keys(user_id, status);
CREATE INDEX idx_api_usage_key_timestamp ON api_key_usage_logs(api_key_id, request_timestamp);

-- Trigger functions for automatic updates
CREATE OR REPLACE FUNCTION update_api_key_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE TRIGGER api_keys_update_timestamp
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_key_updated_at();

-- Function to increment usage count when API key is used
CREATE OR REPLACE FUNCTION increment_api_key_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE api_keys 
  SET 
    usage_count = usage_count + 1,
    last_used_at = NEW.request_timestamp,
    last_used_ip = NEW.ip_address
  WHERE id = NEW.api_key_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update usage statistics
CREATE TRIGGER api_key_usage_update
  AFTER INSERT ON api_key_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION increment_api_key_usage();

-- Function to clean up old usage logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_usage_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM api_key_usage_logs 
  WHERE request_timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to rotate API keys
CREATE OR REPLACE FUNCTION rotate_api_key(key_id UUID)
RETURNS UUID AS $$
DECLARE
  old_key api_keys%ROWTYPE;
  new_key_id UUID;
BEGIN
  -- Get the existing key
  SELECT * INTO old_key FROM api_keys WHERE id = key_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'API key not found';
  END IF;
  
  -- Create new key with same properties
  INSERT INTO api_keys (
    key_name,
    key_hash,
    key_prefix,
    key_suffix,
    user_id,
    created_by,
    scopes,
    rate_limit_per_minute,
    rate_limit_per_hour,
    rate_limit_per_day,
    allowed_ips,
    allowed_origins,
    allowed_user_agents,
    expires_at,
    rotation_schedule,
    environment,
    purpose,
    rotated_from
  ) VALUES (
    old_key.key_name,
    'placeholder_hash', -- Will be updated by the application
    'placeholder_prefix',
    'placeholder_suffix',
    old_key.user_id,
    old_key.created_by,
    old_key.scopes,
    old_key.rate_limit_per_minute,
    old_key.rate_limit_per_hour,
    old_key.rate_limit_per_day,
    old_key.allowed_ips,
    old_key.allowed_origins,
    old_key.allowed_user_agents,
    old_key.expires_at,
    old_key.rotation_schedule,
    old_key.environment,
    old_key.purpose || ' (rotated)',
    old_key.id
  ) RETURNING id INTO new_key_id;
  
  -- Mark old key as revoked
  UPDATE api_keys 
  SET status = 'revoked'::api_key_status
  WHERE id = key_id;
  
  RETURN new_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if API key needs rotation
CREATE OR REPLACE FUNCTION check_keys_for_rotation()
RETURNS void AS $$
BEGIN
  -- This would be called by a scheduled job
  UPDATE api_keys 
  SET next_rotation_at = NOW() + rotation_schedule
  WHERE status = 'active' 
    AND rotation_schedule IS NOT NULL 
    AND (next_rotation_at IS NULL OR next_rotation_at <= NOW());
END;
$$ LANGUAGE plpgsql;

-- Views for monitoring and analytics
CREATE VIEW api_key_summary AS
SELECT 
  ak.id,
  ak.key_name,
  ak.key_prefix,
  ak.key_suffix,
  ak.status,
  ak.scopes,
  ak.usage_count,
  ak.last_used_at,
  ak.created_at,
  ak.expires_at,
  u.email as owner_email,
  u.name as owner_name
FROM api_keys ak
LEFT JOIN users u ON ak.user_id = u.id;

CREATE VIEW api_key_usage_summary AS
SELECT 
  ak.id as key_id,
  ak.key_name,
  COUNT(aul.*) as total_requests,
  COUNT(CASE WHEN aul.status_code >= 200 AND aul.status_code < 300 THEN 1 END) as successful_requests,
  COUNT(CASE WHEN aul.status_code >= 400 THEN 1 END) as error_requests,
  COUNT(CASE WHEN aul.security_violation = TRUE THEN 1 END) as security_violations,
  AVG(aul.response_time_ms) as avg_response_time,
  MIN(aul.request_timestamp) as first_request,
  MAX(aul.request_timestamp) as last_request
FROM api_keys ak
LEFT JOIN api_key_usage_logs aul ON ak.id = aul.api_key_id
WHERE ak.status = 'active'
GROUP BY ak.id, ak.key_name;

-- Row Level Security policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own API keys
CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can see all API keys
CREATE POLICY "Admins can manage all API keys" ON api_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (
        subscription_tier = 'ultimate' OR
        preferences->>'role' = 'admin'
      )
    )
  );

-- Usage logs follow the same pattern
CREATE POLICY "Users can view own API key usage" ON api_key_usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM api_keys ak 
      WHERE ak.id = api_key_usage_logs.api_key_id 
      AND ak.user_id = auth.uid()
    )
  );

-- Service role can access everything
CREATE POLICY "Service role can access all API keys" ON api_keys
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all usage logs" ON api_key_usage_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO authenticated;
GRANT SELECT ON api_key_usage_logs TO authenticated;
GRANT SELECT ON api_key_summary TO authenticated;
GRANT SELECT ON api_key_usage_summary TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION rotate_api_key(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_api_usage_logs() TO service_role;
GRANT EXECUTE ON FUNCTION check_keys_for_rotation() TO service_role;

-- Comments for documentation
COMMENT ON TABLE api_keys IS 'Secure API key management with rotation and monitoring capabilities';
COMMENT ON TABLE api_key_usage_logs IS 'Detailed logs of API key usage for monitoring and analytics';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the actual API key for secure storage';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 8 characters of key for identification (e.g., rl_live_)';
COMMENT ON COLUMN api_keys.key_suffix IS 'Last 4 characters for partial display in UI';
COMMENT ON FUNCTION rotate_api_key(UUID) IS 'Safely rotates an API key by creating a new one and revoking the old';