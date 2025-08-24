// Alarm API Security Headers and Validation Service
// Provides comprehensive security for alarm API endpoints including headers, validation, and protection mechanisms

import SecurityService from './security';
import SecurityMonitoringForensicsService from './security-monitoring-forensics';
import AlarmRateLimitingService from './alarm-rate-limiting';
import { ErrorHandler } from './error-handler';
import { TimeoutHandle } from '../types/timers';

interface APIRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp?: Date;
}

interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Strict-Transport-Security': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'X-Permitted-Cross-Domain-Policies': string;
  'X-Rate-Limit-Limit'?: string;
  'X-Rate-Limit-Remaining'?: string;
  'X-Rate-Limit-Reset'?: string;
  'X-Request-ID': string;
  'X-Content-Security-Policy': string;
  'Cache-Control': string;
  Pragma: string;
  Expires: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedData?: any;
  securityFlags?: string[];
}

interface APISecurityContext {
  requestId: string;
  userId?: string;
  operation: string;
  authenticated: boolean;
  rateLimited: boolean;
  validatedInput: boolean;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  threats: string[];
  headers: SecurityHeaders;
  startTime: Date;
}

type AlarmAPIEndpoint =
  | 'GET /alarms'
  | 'POST /alarms'
  | 'PUT /alarms/:id'
  | 'DELETE /alarms/:id'
  | 'POST /alarms/bulk'
  | 'GET /alarms/export'
  | 'POST /alarms/import'
  | 'POST /alarms/:id/snooze'
  | 'POST /alarms/:id/dismiss'
  | 'GET /alarms/backup'
  | 'POST /alarms/backup'
  | 'POST /alarms/restore'
  | 'GET /alarms/security/status'
  | 'POST /alarms/security/test';

export class AlarmAPISecurityService {
  private static instance: AlarmAPISecurityService;
  private static readonly CSRF_TOKEN_HEADER = 'X-CSRF-Token';
  private static readonly REQUEST_ID_HEADER = 'X-Request-ID';
  private static readonly SIGNATURE_HEADER = 'X-Request-Signature';
  private static readonly TIMESTAMP_HEADER = 'X-Request-Timestamp';
  private static readonly NONCE_HEADER = 'X-Request-Nonce';

  private activeRequests: Map<string, APISecurityContext> = new Map();
  private csrfTokens: Map<string, { token: string; expiresAt: Date; used: boolean }> =
    new Map();
  private requestNonces: Set<string> = new Set();

  // Security configuration
  private readonly CSP_POLICY = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' wss: https:",
    "media-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');

  private readonly ENDPOINT_SECURITY_LEVELS: Record<
    AlarmAPIEndpoint,
    'low' | 'medium' | 'high' | 'critical'
  > = {
    'GET /alarms': 'medium',
    'POST /alarms': 'high',
    'PUT /alarms/:id': 'high',
    'DELETE /alarms/:id': 'critical',
    'POST /alarms/bulk': 'critical',
    'GET /alarms/export': 'high',
    'POST /alarms/import': 'critical',
    'POST /alarms/:id/snooze': 'medium',
    'POST /alarms/:id/dismiss': 'medium',
    'GET /alarms/backup': 'high',
    'POST /alarms/backup': 'critical',
    'POST /alarms/restore': 'critical',
    'GET /alarms/security/status': 'medium',
    'POST /alarms/security/test': 'high',
  };

  private constructor() {
    this.startCleanupTimer();
  }

  static getInstance(): AlarmAPISecurityService {
    if (!AlarmAPISecurityService.instance) {
      AlarmAPISecurityService.instance = new AlarmAPISecurityService();
    }
    return AlarmAPISecurityService.instance;
  }

  /**
   * Validate and secure an incoming API request
   */
  async validateRequest(request: APIRequest): Promise<{
    context: APISecurityContext;
    proceed: boolean;
    response?: { status: number; headers: SecurityHeaders; body: any };
  }> {
    const requestId = this.generateRequestId();
    const startTime = new Date();

    try {
      // Initialize security context
      const endpoint = this.normalizeEndpoint(request.method, request.url);
      const securityLevel = this.getEndpointSecurityLevel(endpoint);

      const context: APISecurityContext = {
        requestId,
        userId: request.userId,
        operation: endpoint,
        authenticated: !!request.userId,
        rateLimited: false,
        validatedInput: false,
        securityLevel,
        threats: [],
        headers: this.generateSecurityHeaders(requestId),
        startTime,
      };

      this.activeRequests.set(requestId, context);

      // 1. Basic request validation
      const basicValidation = await this.performBasicValidation(request);
      if (!basicValidation.valid) {
        context.threats.push('basic_validation_failed');
        return this.createSecurityResponse(
          context,
          400,
          'Invalid request format',
          basicValidation.errors
        );
      }

      // 2. Rate limiting check
      if (request.userId) {
        const operation = this.mapEndpointToOperation(endpoint);
        const rateLimitResult = await AlarmRateLimitingService.checkRateLimit(
          request.userId,
          operation,
          request.ip
        );

        context.rateLimited = !rateLimitResult.allowed;
        context.headers['X-Rate-Limit-Limit'] = rateLimitResult.remaining.toString();
        context.headers['X-Rate-Limit-Remaining'] =
          rateLimitResult.remaining.toString();
        context.headers['X-Rate-Limit-Reset'] = Math.floor(
          rateLimitResult.resetTime.getTime() / 1000
        ).toString();

        if (!rateLimitResult.allowed) {
          context.threats.push('rate_limit_exceeded');
          return this.createSecurityResponse(context, 429, 'Rate limit exceeded', [], {
            retryAfter: rateLimitResult.retryAfter,
            escalation: rateLimitResult.escalation,
          });
        }
      }

      // 3. CSRF protection for state-changing operations
      if (this.requiresCSRFProtection(request.method)) {
        const csrfValidation = await this.validateCSRFToken(request);
        if (!csrfValidation.valid) {
          context.threats.push('csrf_validation_failed');
          return this.createSecurityResponse(
            context,
            403,
            'CSRF validation failed',
            csrfValidation.errors
          );
        }
      }

      // 4. Request signature validation for critical operations
      if (securityLevel === 'critical') {
        const signatureValidation = await this.validateRequestSignature(request);
        if (!signatureValidation.valid) {
          context.threats.push('signature_validation_failed');
          return this.createSecurityResponse(
            context,
            403,
            'Request signature invalid',
            signatureValidation.errors
          );
        }
      }

      // 5. Input validation and sanitization
      const inputValidation = await this.validateAndSanitizeInput(request, endpoint);
      context.validatedInput = inputValidation.valid;
      if (!inputValidation.valid) {
        context.threats.push('input_validation_failed');
        return this.createSecurityResponse(
          context,
          400,
          'Invalid input data',
          inputValidation.errors
        );
      }

      // 6. Replay attack protection
      if (securityLevel === 'high' || securityLevel === 'critical') {
        const replayValidation = await this.validateReplayProtection(request);
        if (!replayValidation.valid) {
          context.threats.push('replay_attack_detected');
          return this.createSecurityResponse(
            context,
            403,
            'Replay attack detected',
            replayValidation.errors
          );
        }
      }

      // 7. Threat detection
      const threatAnalysis = await this.analyzePotentialThreats(request, context);
      context.threats.push(...threatAnalysis.threats);

      if (threatAnalysis.block) {
        return this.createSecurityResponse(
          context,
          403,
          'Request blocked by security policy',
          threatAnalysis.reasons
        );
      }

      // Update sanitized request data
      if (inputValidation.sanitizedData) {
        request.body = inputValidation.sanitizedData;
      }

      // Log successful validation
      await this.logAPISecurityEvent('request_validated', context, {
        endpoint,
        securityLevel,
      });

      // Request validation passed
      return {
        context,
        proceed: true,
      };
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'API security validation failed',
        { context: 'api_security', metadata: { requestId, endpoint: request.url } }
      );

      // Create default security context for error case
      const errorContext: APISecurityContext = {
        requestId,
        operation: 'error',
        authenticated: false,
        rateLimited: false,
        validatedInput: false,
        securityLevel: 'critical',
        threats: ['validation_error'],
        headers: this.generateSecurityHeaders(requestId),
        startTime,
      };

      return this.createSecurityResponse(
        errorContext,
        500,
        'Security validation error'
      );
    }
  }

  /**
   * Generate comprehensive security headers for API responses
   */
  generateSecurityHeaders(
    requestId: string,
    additional?: Partial<SecurityHeaders>
  ): SecurityHeaders {
    const headers: SecurityHeaders = {
      'Content-Security-Policy': this.CSP_POLICY,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy':
        'camera=(), microphone=(), geolocation=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()',
      'X-Permitted-Cross-Domain-Policies': 'none',
      'X-Request-ID': requestId,
      'X-Content-Security-Policy': this.CSP_POLICY,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
      Expires: '0',
    };

    // Merge additional headers
    return { ...headers, ...additional };
  }

  /**
   * Finalize API response with security enhancements
   */
  async finalizeResponse(
    context: APISecurityContext,
    status: number,
    responseData: any
  ): Promise<{ status: number; headers: SecurityHeaders; body: any }> {
    try {
      // Calculate response time
      const responseTime = Date.now() - context.startTime.getTime();

      // Add performance headers
      context.headers['X-Response-Time'] = `${responseTime}ms`;
      context.headers['X-Security-Level'] = context.securityLevel;

      // Log API response
      await this.logAPISecurityEvent('response_sent', context, {
        status,
        responseTime,
        dataSize: JSON.stringify(responseData).length,
      });

      // Clean up active request
      this.activeRequests.delete(context.requestId);

      // Sanitize response data for security
      const sanitizedResponse = this.sanitizeResponseData(
        responseData,
        context.securityLevel
      );

      return {
        status,
        headers: context.headers,
        body: sanitizedResponse,
      };
    } catch (error) {
      console.error('[AlarmAPISecurity] Failed to finalize response:', error);
      return {
        status: 500,
        headers: context.headers,
        body: { error: 'Response processing failed' },
      };
    }
  }

  /**
   * Generate CSRF token for client
   */
  async generateCSRFToken(userId: string): Promise<string> {
    const token = SecurityService.generateCSRFToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    this.csrfTokens.set(token, {
      token,
      expiresAt,
      used: false,
    });

    // Clean up old tokens for this user
    const userTokens = Array.from(this.csrfTokens.entries()).filter(
      ([, tokenData]) => !tokenData.used && tokenData.expiresAt > new Date()
    );

    if (userTokens.length > 10) {
      const oldestToken = userTokens[0][0];
      this.csrfTokens.delete(oldestToken);
    }

    return token;
  }

  /**
   * Validate API request input data
   */
  private async validateAndSanitizeInput(
    request: APIRequest,
    endpoint: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitizedData: any = null;

    try {
      if (request.body) {
        // Basic structure validation
        if (typeof request.body !== 'object' || request.body === null) {
          errors.push('Request body must be a valid JSON object');
          return { valid: false, errors, warnings };
        }

        // Deep clone for sanitization
        sanitizedData = JSON.parse(JSON.stringify(request.body));

        // Endpoint-specific validation
        switch (endpoint) {
          case 'POST /alarms':
          case 'PUT /alarms/:id':
            const alarmValidation = this.validateAlarmData(sanitizedData);
            errors.push(...alarmValidation.errors);
            warnings.push(...alarmValidation.warnings);
            sanitizedData = alarmValidation.sanitizedData;
            break;

          case 'POST /alarms/bulk':
            if (!Array.isArray(sanitizedData.alarms)) {
              errors.push('Bulk operation requires an array of alarms');
            } else if (sanitizedData.alarms.length > 100) {
              errors.push('Bulk operation limited to 100 alarms per request');
            } else {
              sanitizedData.alarms = sanitizedData.alarms.map((alarm: any) => {
                const validation = this.validateAlarmData(alarm);
                errors.push(...validation.errors);
                warnings.push(...validation.warnings);
                return validation.sanitizedData;
              });
            }
            break;

          case 'POST /alarms/import':
            const importValidation = this.validateImportData(sanitizedData);
            errors.push(...importValidation.errors);
            warnings.push(...importValidation.warnings);
            sanitizedData = importValidation.sanitizedData;
            break;

          case 'POST /alarms/restore':
            if (!sanitizedData.backupId || typeof sanitizedData.backupId !== 'string') {
              errors.push('Valid backup ID is required');
            }
            break;
        }

        // Generic security sanitization
        sanitizedData = this.sanitizeForSecurity(sanitizedData);
      }

      // Validate query parameters
      if (request.query) {
        const queryValidation = this.validateQueryParameters(request.query, endpoint);
        errors.push(...queryValidation.errors);
        warnings.push(...queryValidation.warnings);
      }

      // Validate URL parameters
      if (request.params) {
        const paramValidation = this.validateURLParameters(request.params);
        errors.push(...paramValidation.errors);
        warnings.push(...paramValidation.warnings);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        sanitizedData,
      };
    } catch (error) {
      errors.push('Failed to validate input data');
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Validate alarm data structure and content
   */
  private validateAlarmData(alarm: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedData: any = {};

    // Required fields validation
    if (!alarm.label || typeof alarm.label !== 'string') {
      errors.push('Alarm label is required and must be a string');
    } else {
      sanitizedData.label = SecurityService.sanitizeInput(alarm.label, {
        maxLength: 100,
      });
      if (sanitizedData.label !== alarm.label) {
        warnings.push('Alarm label was sanitized for security');
      }
    }

    if (!alarm.time || typeof alarm.time !== 'string') {
      errors.push('Alarm time is required and must be a string');
    } else {
      // Validate time format (HH:MM)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(alarm.time)) {
        errors.push('Alarm time must be in HH:MM format');
      } else {
        sanitizedData.time = alarm.time;
      }
    }

    // Optional fields with validation
    sanitizedData.enabled = Boolean(alarm.enabled);
    sanitizedData.isActive = Boolean(alarm.isActive);

    if (alarm.days) {
      if (Array.isArray(alarm.days)) {
        sanitizedData.days = alarm.days.filter(
          d => typeof d === 'number' && d >= 0 && d <= 6
        );
        if (sanitizedData.days.length !== alarm.days.length) {
          warnings.push('Some invalid days were filtered out');
        }
      } else {
        errors.push('Days must be an array of numbers (0-6)');
      }
    } else {
      sanitizedData.days = [];
    }

    if (alarm.voiceMood) {
      const validMoods = ['energetic', 'calm', 'motivational', 'gentle', 'stern'];
      if (validMoods.includes(alarm.voiceMood)) {
        sanitizedData.voiceMood = alarm.voiceMood;
      } else {
        warnings.push('Invalid voice mood, defaulting to "energetic"');
        sanitizedData.voiceMood = 'energetic';
      }
    }

    if (alarm.sound) {
      sanitizedData.sound = SecurityService.sanitizeInput(String(alarm.sound));
    }

    if (typeof alarm.snoozeEnabled === 'boolean') {
      sanitizedData.snoozeEnabled = alarm.snoozeEnabled;
    }

    if (
      typeof alarm.snoozeInterval === 'number' &&
      alarm.snoozeInterval > 0 &&
      alarm.snoozeInterval <= 60
    ) {
      sanitizedData.snoozeInterval = alarm.snoozeInterval;
    } else if (alarm.snoozeInterval !== undefined) {
      warnings.push('Invalid snooze interval, defaulting to 5 minutes');
      sanitizedData.snoozeInterval = 5;
    }

    return { valid: errors.length === 0, errors, warnings, sanitizedData };
  }

  /**
   * Validate import data
   */
  private validateImportData(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedData: any = {};

    if (!data.alarms || !Array.isArray(data.alarms)) {
      errors.push('Import data must contain an array of alarms');
      return { valid: false, errors, warnings };
    }

    if (data.alarms.length > 1000) {
      errors.push('Import limited to 1000 alarms');
      return { valid: false, errors, warnings };
    }

    sanitizedData.alarms = data.alarms.map((alarm: any, index: number) => {
      const validation = this.validateAlarmData(alarm);
      validation.errors.forEach(error => errors.push(`Alarm ${index}: ${error}`));
      validation.warnings.forEach(warning =>
        warnings.push(`Alarm ${index}: ${warning}`)
      );
      return validation.sanitizedData;
    });

    // Validate metadata if present
    if (data.metadata) {
      sanitizedData.metadata = {
        version: SecurityService.sanitizeInput(String(data.metadata.version || '1.0')),
        exportedAt: data.metadata.exportedAt
          ? new Date(data.metadata.exportedAt).toISOString()
          : new Date().toISOString(),
        source: SecurityService.sanitizeInput(
          String(data.metadata.source || 'unknown')
        ),
      };
    }

    return { valid: errors.length === 0, errors, warnings, sanitizedData };
  }

  /**
   * Validate query parameters
   */
  private validateQueryParameters(
    query: Record<string, string>,
    endpoint: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    Object.entries(query).forEach(([key, value]) => {
      // Sanitize all query values
      const sanitized = SecurityService.sanitizeInput(value);
      if (sanitized !== value) {
        warnings.push(`Query parameter ${key} was sanitized`);
      }

      // Endpoint-specific validation
      switch (key) {
        case 'limit':
          const limit = parseInt(value, 10);
          if (isNaN(limit) || limit < 1 || limit > 1000) {
            errors.push('Limit must be a number between 1 and 1000');
          }
          break;

        case 'offset':
          const offset = parseInt(value, 10);
          if (isNaN(offset) || offset < 0) {
            errors.push('Offset must be a non-negative number');
          }
          break;

        case 'search':
          if (value.length > 100) {
            errors.push('Search query too long (max 100 characters)');
          }
          break;
      }
    });

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate URL parameters
   */
  private validateURLParameters(params: Record<string, string>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    Object.entries(params).forEach(([key, value]) => {
      switch (key) {
        case 'id':
          if (
            !value ||
            typeof value !== 'string' ||
            value.length < 1 ||
            value.length > 50
          ) {
            errors.push('Invalid ID parameter');
          }
          break;
      }
    });

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Basic request validation
   */
  private async performBasicValidation(request: APIRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Method validation
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
    if (!validMethods.includes(request.method.toUpperCase())) {
      errors.push('Invalid HTTP method');
    }

    // URL validation
    if (!request.url || typeof request.url !== 'string') {
      errors.push('Invalid URL');
    }

    // Headers validation
    if (!request.headers || typeof request.headers !== 'object') {
      errors.push('Invalid headers');
    } else {
      // Check for required headers
      const contentType =
        request.headers['content-type'] || request.headers['Content-Type'];
      if (['POST', 'PUT'].includes(request.method.toUpperCase()) && request.body) {
        if (!contentType || !contentType.includes('application/json')) {
          errors.push('Content-Type must be application/json for requests with body');
        }
      }

      // Check for suspicious headers
      Object.entries(request.headers).forEach(([key, value]) => {
        if (this.isSuspiciousHeader(key, value)) {
          errors.push(`Suspicious header detected: ${key}`);
        }
      });
    }

    // User agent validation
    if (request.userAgent && this.isSuspiciousUserAgent(request.userAgent)) {
      errors.push('Suspicious User-Agent detected');
    }

    return { valid: errors.length === 0, errors, warnings: [] };
  }

  /**
   * CSRF token validation
   */
  private async validateCSRFToken(request: APIRequest): Promise<ValidationResult> {
    const token = request.headers[AlarmAPISecurityService.CSRF_TOKEN_HEADER];

    if (!token) {
      return { valid: false, errors: ['CSRF token is required'], warnings: [] };
    }

    const tokenData = this.csrfTokens.get(token);
    if (!tokenData) {
      return { valid: false, errors: ['Invalid CSRF token'], warnings: [] };
    }

    if (tokenData.used) {
      return { valid: false, errors: ['CSRF token already used'], warnings: [] };
    }

    if (tokenData.expiresAt < new Date()) {
      this.csrfTokens.delete(token);
      return { valid: false, errors: ['CSRF token expired'], warnings: [] };
    }

    // Mark token as used
    tokenData.used = true;
    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Request signature validation
   */
  private async validateRequestSignature(
    request: APIRequest
  ): Promise<ValidationResult> {
    const signature = request.headers[AlarmAPISecurityService.SIGNATURE_HEADER];
    const timestamp = request.headers[AlarmAPISecurityService.TIMESTAMP_HEADER];

    if (!signature || !timestamp) {
      return {
        valid: false,
        errors: [
          'Request signature and timestamp are required for critical operations',
        ],
        warnings: [],
      };
    }

    // Validate timestamp (must be within 5 minutes)
    const requestTime = new Date(timestamp);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - requestTime.getTime());

    if (timeDiff > 5 * 60 * 1000) {
      // 5 minutes
      return { valid: false, errors: ['Request timestamp is too old'], warnings: [] };
    }

    // Validate signature
    const expectedSignature = this.generateRequestSignature(request, timestamp);
    if (signature !== expectedSignature) {
      return { valid: false, errors: ['Invalid request signature'], warnings: [] };
    }

    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Replay attack protection
   */
  private async validateReplayProtection(
    request: APIRequest
  ): Promise<ValidationResult> {
    const nonce = request.headers[AlarmAPISecurityService.NONCE_HEADER];

    if (!nonce) {
      return { valid: false, errors: ['Request nonce is required'], warnings: [] };
    }

    if (this.requestNonces.has(nonce)) {
      return {
        valid: false,
        errors: ['Request nonce already used (replay attack detected)'],
        warnings: [],
      };
    }

    // Add nonce to set
    this.requestNonces.add(nonce);

    // Clean up old nonces (keep last 10000)
    if (this.requestNonces.size > 10000) {
      const noncesArray = Array.from(this.requestNonces);
      this.requestNonces = new Set(noncesArray.slice(-5000));
    }

    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Analyze potential security threats in request
   */
  private async analyzePotentialThreats(
    request: APIRequest,
    context: APISecurityContext
  ): Promise<{
    threats: string[];
    block: boolean;
    reasons: string[];
  }> {
    const threats: string[] = [];
    const reasons: string[] = [];
    let block = false;

    // SQL injection patterns
    if (
      this.containsSQLInjection(
        JSON.stringify(request.body) + JSON.stringify(request.query)
      )
    ) {
      threats.push('sql_injection_attempt');
      reasons.push('Potential SQL injection detected');
      block = true;
    }

    // XSS patterns
    if (this.containsXSS(JSON.stringify(request.body))) {
      threats.push('xss_attempt');
      reasons.push('Potential XSS attack detected');
      block = true;
    }

    // Large payload attack
    if (request.body && JSON.stringify(request.body).length > 10 * 1024 * 1024) {
      // 10MB
      threats.push('large_payload_attack');
      reasons.push('Payload too large');
      block = true;
    }

    // Suspicious patterns in URL
    if (this.containsSuspiciousURLPatterns(request.url)) {
      threats.push('suspicious_url_pattern');
      reasons.push('Suspicious URL pattern detected');
      // Don't block for this, just log
    }

    // Excessive nested objects (JSON bomb)
    if (request.body && this.isJSONBomb(request.body)) {
      threats.push('json_bomb_attempt');
      reasons.push('Potential JSON bomb detected');
      block = true;
    }

    return { threats, block, reasons };
  }

  // Helper methods for threat detection
  private containsSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(;|\|\||--|\*|\bxp_\b)/i,
    ];
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  private containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
    ];
    return xssPatterns.some(pattern => pattern.test(input));
  }

  private containsSuspiciousURLPatterns(url: string): boolean {
    const suspiciousPatterns = [
      /\.\.\//, // Directory traversal
      /%2e%2e%2f/i, // Encoded directory traversal
      /\0/, // Null byte
      /%00/i, // Encoded null byte
    ];
    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  private isJSONBomb(obj: any, depth = 0, maxDepth = 100): boolean {
    if (depth > maxDepth) return true;

    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        if (obj.length > 10000) return true;
        return obj.some(item => this.isJSONBomb(item, depth + 1, maxDepth));
      } else {
        const keys = Object.keys(obj);
        if (keys.length > 1000) return true;
        return keys.some(key => this.isJSONBomb(obj[key], depth + 1, maxDepth));
      }
    }

    return false;
  }

  private isSuspiciousHeader(key: string, value: string): boolean {
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip'];
    const suspiciousValues = /(<script|javascript:|data:)/i;

    return (
      suspiciousHeaders.includes(key.toLowerCase()) && suspiciousValues.test(value)
    );
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot|crawler|spider/i,
      /script|curl|wget|python/i,
      /<script|javascript:/i,
    ];
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  // Utility methods
  private normalizeEndpoint(method: string, url: string): string {
    // Normalize URL by replacing ID parameters with :id
    const normalizedUrl = url.replace(/\/[0-9a-fA-F-]{8,}/g, '/:id');
    return `${method.toUpperCase()} ${normalizedUrl}`;
  }

  private getEndpointSecurityLevel(
    endpoint: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    return this.ENDPOINT_SECURITY_LEVELS[endpoint as AlarmAPIEndpoint] || 'medium';
  }

  private mapEndpointToOperation(endpoint: string): any {
    const operationMap: Record<string, any> = {
      'POST /alarms': 'create_alarm',
      'PUT /alarms/:id': 'update_alarm',
      'DELETE /alarms/:id': 'delete_alarm',
      'POST /alarms/bulk': 'bulk_operations',
      'GET /alarms/export': 'alarm_export',
      'POST /alarms/import': 'alarm_import',
      'POST /alarms/:id/snooze': 'snooze_alarm',
      'POST /alarms/:id/dismiss': 'dismiss_alarm',
      'POST /alarms/backup': 'backup_create',
      'POST /alarms/restore': 'backup_restore',
      'GET /alarms': 'data_access',
    };
    return operationMap[endpoint] || 'data_access';
  }

  private requiresCSRFProtection(method: string): boolean {
    return ['POST', 'PUT', 'DELETE'].includes(method.toUpperCase());
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestSignature(request: APIRequest, timestamp: string): string {
    const signatureData = {
      method: request.method,
      url: request.url,
      body: request.body,
      timestamp,
    };
    return SecurityService.hashData(JSON.stringify(signatureData));
  }

  private sanitizeForSecurity(data: any): any {
    if (typeof data === 'string') {
      return SecurityService.sanitizeInput(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForSecurity(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      Object.entries(data).forEach(([key, value]) => {
        const sanitizedKey = SecurityService.sanitizeInput(key);
        sanitized[sanitizedKey] = this.sanitizeForSecurity(value);
      });
      return sanitized;
    }

    return data;
  }

  private sanitizeResponseData(data: any, securityLevel: string): any {
    // Remove sensitive fields based on security level
    if (securityLevel === 'low') {
      return data; // No sanitization for low security
    }

    // Deep clone and sanitize
    const sanitized = JSON.parse(JSON.stringify(data));

    // Remove sensitive fields
    this.removeSensitiveFields(sanitized);

    return sanitized;
  }

  private removeSensitiveFields(obj: any): void {
    if (typeof obj === 'object' && obj !== null) {
      const sensitiveFields = [
        'password',
        'token',
        'secret',
        'key',
        'signature',
        'csrf',
      ];

      sensitiveFields.forEach(field => {
        delete obj[field];
      });

      Object.values(obj).forEach(value => {
        if (typeof value === 'object') {
          this.removeSensitiveFields(value);
        }
      });
    }
  }

  private createSecurityResponse(
    context: APISecurityContext,
    status: number,
    message: string,
    errors: string[] = [],
    additional: any = {}
  ): {
    context: APISecurityContext;
    proceed: false;
    response: { status: number; headers: SecurityHeaders; body: any };
  } {
    return {
      context,
      proceed: false,
      response: {
        status,
        headers: context.headers,
        body: {
          error: message,
          errors,
          requestId: context.requestId,
          timestamp: new Date().toISOString(),
          ...additional,
        },
      },
    };
  }

  private async logAPISecurityEvent(
    event: string,
    context: APISecurityContext,
    details: any = {}
  ): Promise<void> {
    await SecurityMonitoringForensicsService.logSecurityEvent(
      event === 'request_validated' ? 'data_access' : 'security_test_failure',
      context.threats.length > 0 ? 'high' : 'low',
      'alarm_api_security',
      {
        requestId: context.requestId,
        operation: context.operation,
        securityLevel: context.securityLevel,
        threats: context.threats,
        event,
        ...details,
      },
      context.userId
    );
  }

  private startCleanupTimer(): void {
    setInterval(
      () => {
        this.cleanupExpiredData();
      },
      15 * 60 * 1000
    ); // Every 15 minutes
  }

  private cleanupExpiredData(): void {
    const now = new Date();

    // Cleanup expired CSRF tokens
    for (const [token, data] of this.csrfTokens.entries()) {
      if (data.expiresAt < now || data.used) {
        this.csrfTokens.delete(token);
      }
    }

    // Cleanup old requests
    for (const [requestId, context] of this.activeRequests.entries()) {
      if (now.getTime() - context.startTime.getTime() > 10 * 60 * 1000) {
        // 10 minutes
        this.activeRequests.delete(requestId);
      }
    }

    // Limit nonces set size
    if (this.requestNonces.size > 10000) {
      const noncesArray = Array.from(this.requestNonces);
      this.requestNonces = new Set(noncesArray.slice(-5000));
    }
  }

  /**
   * Get security statistics for monitoring
   */
  async getSecurityStats(): Promise<{
    activeRequests: number;
    blockedRequests: number;
    threatsDetected: number;
    csrfTokensActive: number;
    requestNoncesActive: number;
    securityLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const activeRequests = this.activeRequests.size;
    const threatCount = Array.from(this.activeRequests.values()).reduce(
      (sum, context) => sum + context.threats.length,
      0
    );

    const blockedRequests = Array.from(this.activeRequests.values()).filter(
      context => context.threats.length > 0
    ).length;

    let securityLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (threatCount > 10) {
      securityLevel = 'critical';
    } else if (threatCount > 5) {
      securityLevel = 'high';
    } else if (threatCount > 2) {
      securityLevel = 'medium';
    }

    return {
      activeRequests,
      blockedRequests,
      threatsDetected: threatCount,
      csrfTokensActive: this.csrfTokens.size,
      requestNoncesActive: this.requestNonces.size,
      securityLevel,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.activeRequests.clear();
    this.csrfTokens.clear();
    this.requestNonces.clear();
    console.log('[AlarmAPISecurity] Service destroyed');
  }
}

export default AlarmAPISecurityService.getInstance();
