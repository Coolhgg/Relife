/**
 * Secure API Key Management Service
 * Provides comprehensive API key generation, validation, rotation, and monitoring
 */

import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { SecurityService } from './security';

export interface APIKey {
  id: string;
  keyName: string;
  keyPrefix: string;
  keySuffix: string;
  userId: string;
  status: 'active' | 'suspended' | 'revoked' | 'expired';
  scopes: APIKeyScope[];
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  rateLimitPerDay: number;
  usageCount: number;
  lastUsedAt?: Date;
  lastUsedIp?: string;
  allowedIps?: string[];
  allowedOrigins?: string[];
  environment: 'development' | 'staging' | 'production';
  purpose?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type APIKeyScope =
  | 'read'
  | 'write'
  | 'admin'
  | 'parameter_read'
  | 'parameter_write'
  | 'analytics_read'
  | 'user_management';

export interface CreateAPIKeyRequest {
  name: string;
  scopes: APIKeyScope[];
  purpose?: string;
  environment?: 'development' | 'staging' | 'production';
  expiresAt?: Date;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  rateLimitPerDay?: number;
  allowedIps?: string[];
  allowedOrigins?: string[];
}

export interface APIKeyUsageLog {
  id: string;
  apiKeyId: string;
  method: string;
  endpoint: string;
  statusCode: number;
  ipAddress?: string;
  userAgent?: string;
  origin?: string;
  requestTimestamp: Date;
  responseTimeMs?: number;
  rateLimitRemaining?: number;
  errorMessage?: string;
  securityViolation: boolean;
  violationType?: string;
}

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  violationType?: 'minute' | 'hour' | 'day';
}

class APIKeyManagementService {
  private static instance: APIKeyManagementService;
  private supabase: SupabaseClient;
  private securityService: SecurityService;

  // Key generation constants
  private readonly KEY_LENGTH = 32; // bytes
  private readonly PREFIX_LENGTH = 8;
  private readonly SUFFIX_LENGTH = 4;
  private readonly KEY_PREFIXES = {
    development: 'rl_dev_',
    staging: 'rl_stg_',
    production: 'rl_live_',
  };

  private constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.securityService = SecurityService.getInstance();
  }

  static getInstance(supabase: SupabaseClient): APIKeyManagementService {
    if (!APIKeyManagementService.instance) {
      APIKeyManagementService.instance = new APIKeyManagementService(supabase);
    }
    return APIKeyManagementService.instance;
  }

  /**
   * Generate a secure API key with proper formatting
   */
  private generateAPIKey(environment: string = 'production'): {
    key: string;
    prefix: string;
    suffix: string;
    hash: string;
  } {
    // Generate random bytes for the key
    const keyBytes = crypto.randomBytes(this.KEY_LENGTH);
    const keyString = keyBytes.toString('hex');

    // Create the formatted key with environment prefix
    const prefix = this.KEY_PREFIXES[environment] || this.KEY_PREFIXES.production;
    const key = `${prefix}${keyString}`;

    // Extract prefix and suffix for storage
    const displayPrefix = key.substring(0, this.PREFIX_LENGTH);
    const displaySuffix = key.substring(key.length - this.SUFFIX_LENGTH);

    // Create secure hash for storage
    const hash = crypto.createHash('sha256').update(key).digest('hex');

    return {
      key,
      prefix: displayPrefix,
      suffix: displaySuffix,
      hash,
    };
  }

  /**
   * Create a new API key
   */
  async createAPIKey(
    userId: string,
    request: CreateAPIKeyRequest
  ): Promise<{ apiKey: APIKey; key: string }> {
    // Validate request
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('API key name is required');
    }

    if (!request.scopes || request.scopes.length === 0) {
      throw new Error('At least one scope is required');
    }

    // Generate the key
    const { key, prefix, suffix, hash } = this.generateAPIKey(request.environment);

    // Set default rate limits
    const rateLimitPerMinute = request.rateLimitPerMinute || 60;
    const rateLimitPerHour = request.rateLimitPerHour || 1000;
    const rateLimitPerDay = request.rateLimitPerDay || 10000;

    // Validate rate limit hierarchy
    if (rateLimitPerMinute > rateLimitPerHour || rateLimitPerHour > rateLimitPerDay) {
      throw new Error('Rate limits must be: minute <= hour <= day');
    }

    try {
      const { data, error } = await this.supabase
        .from('api_keys')
        .insert({
          key_name: request.name.trim(),
          key_hash: hash,
          key_prefix: prefix,
          key_suffix: suffix,
          user_id: userId,
          created_by: userId,
          scopes: request.scopes,
          rate_limit_per_minute: rateLimitPerMinute,
          rate_limit_per_hour: rateLimitPerHour,
          rate_limit_per_day: rateLimitPerDay,
          allowed_ips: request.allowedIps || null,
          allowed_origins: request.allowedOrigins || null,
          expires_at: request.expiresAt?.toISOString() || null,
          environment: request.environment || 'production',
          purpose: request.purpose || null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create API key: ${error.message}`);
      }

      // Convert database record to APIKey interface
      const apiKey: APIKey = {
        id: data.id,
        keyName: data.key_name,
        keyPrefix: data.key_prefix,
        keySuffix: data.key_suffix,
        userId: data.user_id,
        status: data.status,
        scopes: data.scopes,
        rateLimitPerMinute: data.rate_limit_per_minute,
        rateLimitPerHour: data.rate_limit_per_hour,
        rateLimitPerDay: data.rate_limit_per_day,
        usageCount: data.usage_count,
        lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : undefined,
        lastUsedIp: data.last_used_ip,
        allowedIps: data.allowed_ips,
        allowedOrigins: data.allowed_origins,
        environment: data.environment,
        purpose: data.purpose,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return { apiKey, key };
    } catch (error) {
      throw new Error(`Database error creating API key: ${error.message}`);
    }
  }

  /**
   * Validate an API key and return key information
   */
  async validateAPIKey(
    key: string,
    requiredScopes: APIKeyScope[] = [],
    clientIp?: string,
    origin?: string
  ): Promise<{
    valid: boolean;
    apiKey?: APIKey;
    rateLimitInfo?: RateLimitInfo;
    error?: string;
  }> {
    try {
      // Hash the provided key
      const keyHash = crypto.createHash('sha256').update(key).digest('hex');

      // Look up the key in the database
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return { valid: false, error: 'Invalid API key' };
      }

      const apiKey: APIKey = {
        id: data.id,
        keyName: data.key_name,
        keyPrefix: data.key_prefix,
        keySuffix: data.key_suffix,
        userId: data.user_id,
        status: data.status,
        scopes: data.scopes,
        rateLimitPerMinute: data.rate_limit_per_minute,
        rateLimitPerHour: data.rate_limit_per_hour,
        rateLimitPerDay: data.rate_limit_per_day,
        usageCount: data.usage_count,
        lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : undefined,
        lastUsedIp: data.last_used_ip,
        allowedIps: data.allowed_ips,
        allowedOrigins: data.allowed_origins,
        environment: data.environment,
        purpose: data.purpose,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      // Check expiration
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return { valid: false, error: 'API key expired' };
      }

      // Check IP restrictions
      if (apiKey.allowedIps && clientIp) {
        const ipAllowed = apiKey.allowedIps.some(
          allowedIp => clientIp.includes(allowedIp) || allowedIp === clientIp
        );
        if (!ipAllowed) {
          return { valid: false, error: 'IP address not allowed' };
        }
      }

      // Check origin restrictions
      if (apiKey.allowedOrigins && origin) {
        const originAllowed = apiKey.allowedOrigins.includes(origin);
        if (!originAllowed) {
          return { valid: false, error: 'Origin not allowed' };
        }
      }

      // Check required scopes
      if (requiredScopes.length > 0) {
        const hasRequiredScopes = requiredScopes.every(scope =>
          apiKey.scopes.includes(scope)
        );
        if (!hasRequiredScopes) {
          return {
            valid: false,
            error: `Missing required scopes: ${requiredScopes.join(', ')}`,
          };
        }
      }

      // Check rate limits
      const rateLimitInfo = await this.checkRateLimit(apiKey.id);
      if (!rateLimitInfo.allowed) {
        return {
          valid: false,
          error: 'Rate limit exceeded',
          rateLimitInfo,
        };
      }

      return { valid: true, apiKey, rateLimitInfo };
    } catch (error) {
      return { valid: false, error: `Validation error: ${error.message}` };
    }
  }

  /**
   * Check rate limit for an API key
   */
  private async checkRateLimit(apiKeyId: string): Promise<RateLimitInfo> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      // Get API key limits
      const { data: keyData } = await this.supabase
        .from('api_keys')
        .select('rate_limit_per_minute, rate_limit_per_hour, rate_limit_per_day')
        .eq('id', apiKeyId)
        .single();

      if (!keyData) {
        throw new Error('API key not found');
      }

      // Count usage in different time windows
      const [minuteCount, hourCount, dayCount] = await Promise.all([
        this.getUsageCount(apiKeyId, oneMinuteAgo),
        this.getUsageCount(apiKeyId, oneHourAgo),
        this.getUsageCount(apiKeyId, oneDayAgo),
      ]);

      // Check limits
      if (minuteCount >= keyData.rate_limit_per_minute) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(Math.ceil(now.getTime() / 60000) * 60000),
          violationType: 'minute',
        };
      }

      if (hourCount >= keyData.rate_limit_per_hour) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(Math.ceil(now.getTime() / 3600000) * 3600000),
          violationType: 'hour',
        };
      }

      if (dayCount >= keyData.rate_limit_per_day) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(Math.ceil(now.getTime() / 86400000) * 86400000),
          violationType: 'day',
        };
      }

      // Calculate remaining requests (most restrictive limit)
      const minuteRemaining = keyData.rate_limit_per_minute - minuteCount;
      const hourRemaining = keyData.rate_limit_per_hour - hourCount;
      const dayRemaining = keyData.rate_limit_per_day - dayCount;

      const remaining = Math.min(minuteRemaining, hourRemaining, dayRemaining);

      return {
        allowed: true,
        remaining,
        resetAt: new Date(Math.ceil(now.getTime() / 60000) * 60000),
      };
    } catch (error) {
      // Fail secure - deny if we can't check limits
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now.getTime() + 60000),
      };
    }
  }

  /**
   * Get usage count for an API key since a given time
   */
  private async getUsageCount(apiKeyId: string, since: Date): Promise<number> {
    const { count } = await this.supabase
      .from('api_key_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyId)
      .gte('request_timestamp', since.toISOString());

    return count || 0;
  }

  /**
   * Log API key usage
   */
  async logUsage(
    apiKeyId: string,
    method: string,
    endpoint: string,
    statusCode: number,
    options: {
      ipAddress?: string;
      userAgent?: string;
      origin?: string;
      responseTimeMs?: number;
      rateLimitRemaining?: number;
      errorMessage?: string;
      securityViolation?: boolean;
      violationType?: string;
    } = {}
  ): Promise<void> {
    try {
      await this.supabase.from('api_key_usage_logs').insert({
        api_key_id: apiKeyId,
        method,
        endpoint,
        status_code: statusCode,
        ip_address: options.ipAddress,
        user_agent: options.userAgent,
        origin: options.origin,
        response_time_ms: options.responseTimeMs,
        rate_limit_remaining: options.rateLimitRemaining,
        error_message: options.errorMessage,
        security_violation: options.securityViolation || false,
        violation_type: options.violationType,
      });
    } catch (error) {
      // Don't throw - logging failures shouldn't break the API
      console.error('Failed to log API key usage:', error);
    }
  }

  /**
   * List API keys for a user
   */
  async listAPIKeys(userId: string): Promise<APIKey[]> {
    const { data, error } = await this.supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list API keys: ${error.message}`);
    }

    return data.map(item => ({
      id: item.id,
      keyName: item.key_name,
      keyPrefix: item.key_prefix,
      keySuffix: item.key_suffix,
      userId: item.user_id,
      status: item.status,
      scopes: item.scopes,
      rateLimitPerMinute: item.rate_limit_per_minute,
      rateLimitPerHour: item.rate_limit_per_hour,
      rateLimitPerDay: item.rate_limit_per_day,
      usageCount: item.usage_count,
      lastUsedAt: item.last_used_at ? new Date(item.last_used_at) : undefined,
      lastUsedIp: item.last_used_ip,
      allowedIps: item.allowed_ips,
      allowedOrigins: item.allowed_origins,
      environment: item.environment,
      purpose: item.purpose,
      expiresAt: item.expires_at ? new Date(item.expires_at) : undefined,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  /**
   * Revoke an API key
   */
  async revokeAPIKey(userId: string, keyId: string): Promise<void> {
    const { error } = await this.supabase
      .from('api_keys')
      .update({ status: 'revoked' })
      .eq('id', keyId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to revoke API key: ${error.message}`);
    }
  }

  /**
   * Rotate an API key (create new one and revoke old)
   */
  async rotateAPIKey(
    userId: string,
    keyId: string
  ): Promise<{ apiKey: APIKey; key: string }> {
    // Get existing key details
    const { data: existingKey, error } = await this.supabase
      .from('api_keys')
      .select('*')
      .eq('id', keyId)
      .eq('user_id', userId)
      .single();

    if (error || !existingKey) {
      throw new Error('API key not found');
    }

    // Create new key with same properties
    const newKeyRequest: CreateAPIKeyRequest = {
      name: existingKey.key_name,
      scopes: existingKey.scopes,
      purpose: (existingKey.purpose || '') + ' (rotated)',
      environment: existingKey.environment,
      expiresAt: existingKey.expires_at ? new Date(existingKey.expires_at) : undefined,
      rateLimitPerMinute: existingKey.rate_limit_per_minute,
      rateLimitPerHour: existingKey.rate_limit_per_hour,
      rateLimitPerDay: existingKey.rate_limit_per_day,
      allowedIps: existingKey.allowed_ips,
      allowedOrigins: existingKey.allowed_origins,
    };

    const { apiKey: newAPIKey, key: newKey } = await this.createAPIKey(
      userId,
      newKeyRequest
    );

    // Revoke the old key
    await this.revokeAPIKey(userId, keyId);

    return { apiKey: newAPIKey, key: newKey };
  }

  /**
   * Get usage analytics for an API key
   */
  async getUsageAnalytics(
    userId: string,
    keyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    errorRequests: number;
    securityViolations: number;
    averageResponseTime: number;
    requestsByDay: { date: string; count: number }[];
    topEndpoints: { endpoint: string; count: number }[];
  }> {
    const { data, error } = await this.supabase
      .from('api_key_usage_logs')
      .select('*')
      .eq('api_key_id', keyId)
      .gte('request_timestamp', startDate.toISOString())
      .lte('request_timestamp', endDate.toISOString());

    if (error) {
      throw new Error(`Failed to get usage analytics: ${error.message}`);
    }

    const logs = data || [];

    // Calculate metrics
    const totalRequests = logs.length;
    const successfulRequests = logs.filter(
      log => log.status_code >= 200 && log.status_code < 300
    ).length;
    const errorRequests = logs.filter(log => log.status_code >= 400).length;
    const securityViolations = logs.filter(log => log.security_violation).length;
    const averageResponseTime =
      logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / totalRequests ||
      0;

    // Group by day
    const requestsByDay: Record<string, number> = {};
    logs.forEach(log => {
      const date = new Date(log.request_timestamp).toISOString().split('T')[0];
      requestsByDay[date] = (requestsByDay[date] || 0) + 1;
    });

    // Top endpoints
    const endpointCounts: Record<string, number> = {};
    logs.forEach(log => {
      endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1;
    });

    const topEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      successfulRequests,
      errorRequests,
      securityViolations,
      averageResponseTime,
      requestsByDay: Object.entries(requestsByDay).map(([date, count]) => ({
        date,
        count,
      })),
      topEndpoints,
    };
  }
}

export default APIKeyManagementService;
