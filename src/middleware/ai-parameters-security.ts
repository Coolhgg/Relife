/**
 * AI Parameters API Security Middleware
 * Comprehensive authentication, authorization, and security controls
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { body, param, query, validationResult } from 'express-validator';
import crypto from 'crypto';
import APIKeyManagementService, { APIKeyScope } from '../services/api-key-management';
import { createClient } from '@supabase/supabase-js';

// Types for security context
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user' | 'developer';
    permissions: string[];
    sessionId: string;
  };
  apiKey?: {
    id: string;
    name: string;
    permissions: APIKeyScope[];
    rateLimit: number;
    userId?: string;
    environment?: string;
  };
}

interface SecurityConfig {
  jwtSecret: string;
  apiKeySecret: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  enableAuditLogging: boolean;
  csrfProtection: boolean;
}

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for security');
}
if (!process.env.API_KEY_SECRET) {
  throw new Error('API_KEY_SECRET environment variable is required for security');
}

// Security configuration
const securityConfig: SecurityConfig = {
  jwtSecret: process.env.JWT_SECRET,
  apiKeySecret: process.env.API_KEY_SECRET,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  enableAuditLogging: true,
  csrfProtection: true,
};

// Audit logging service
class AuditLogger {
  private static instance: AuditLogger;
  private logs: any[] = [];

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  log(event: string, userId: string, details: any, req: Request) {
    if (!securityConfig.enableAuditLogging) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      endpoint: `${req.method} ${req.path}`,
      details,
      sessionId: (req as AuthenticatedRequest).user?.sessionId,
    };

    this.logs.push(logEntry);

    // In production, send to logging service (e.g., CloudWatch, Datadog)
    console.log('[AUDIT]', JSON.stringify(logEntry));

    // Rotate logs to prevent memory issues
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500);
    }
  }

  getRecentLogs(limit = 100) {
    return this.logs.slice(-limit);
  }
}

// Rate limiting configurations
const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message, retryAfter: Math.ceil(windowMs / 1000) },
    standardHeaders: true,
    legacyHeaders: false,
    skip: req => {
      // Skip rate limiting for admin users with special permissions
      const user = (req as AuthenticatedRequest).user;
      return user?.role === 'admin' && user.permissions.includes('bypass_rate_limit');
    },
  });
};

// Rate limiters for different endpoint types
export const rateLimiters = {
  // General API rate limiting
  general: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests per window
    'Too many API requests, please try again later'
  ),

  // Authentication endpoints (stricter)
  auth: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    10, // 10 attempts per window
    'Too many authentication attempts, please try again later'
  ),

  // Parameter updates (moderate)
  parameterUpdates: createRateLimiter(
    5 * 60 * 1000, // 5 minutes
    50, // 50 updates per window
    'Too many parameter updates, please slow down'
  ),

  // Critical operations (very strict)
  critical: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    10, // 10 critical operations per hour
    'Too many critical operations, please contact support'
  ),
};

// Generate nonce for inline scripts/styles
const generateNonce = (): string => {
  return crypto.randomBytes(16).toString('base64');
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  const nonce = generateNonce();
  res.locals.nonce = nonce;
  
  // Apply helmet security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", `'nonce-${nonce}'`, 'https://cdnjs.cloudflare.com'],
        styleSrc: ["'self'", `'nonce-${nonce}'`, 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: { policy: 'credentialless' },
  })(req, res, next);
  
  // Additional security headers not covered by helmet
  res.setHeader('Permissions-Policy', [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'camera=()',
    'cross-origin-isolated=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'execution-while-not-rendered=()',
    'execution-while-out-of-viewport=()',
    'fullscreen=(self)',
    'geolocation=()',
    'gyroscope=()',
    'keyboard-map=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'navigation-override=()',
    'payment=()',
    'picture-in-picture=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
    'sync-xhr=()',
    'usb=()',
    'web-share=()',
    'xr-spatial-tracking=()',
  ].join(', '));
  
  // Clear site data on logout
  if (req.path === '/api/auth/logout') {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
  }
  
  // Server timing information (development only)
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('Server-Timing', 'total;dur=0');
  }
  
  // Custom security headers for API endpoints
  if (req.path.startsWith('/api/')) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
};

// CORS configuration
export const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// JWT Authentication middleware
export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'MISSING_TOKEN',
      });
    }

    const decoded = jwt.verify(token, securityConfig.jwtSecret) as any;

    // Check token expiration
    if (decoded.exp * 1000 < Date.now()) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      permissions: decoded.permissions || [],
      sessionId: decoded.sessionId,
    };

    // Log authentication
    AuditLogger.getInstance().log('auth_success', req.user.id, { method: 'jwt' }, req);

    next();
  } catch (error) {
    AuditLogger.getInstance().log(
      'auth_failure',
      'unknown',
      {
        error: error.message,
        method: 'jwt',
      },
      req
    );

    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }
};

// Initialize Supabase client for API key management
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase configuration missing for API key management');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const apiKeyService = APIKeyManagementService.getInstance(supabase);

// API Key authentication middleware with enhanced security
export const authenticateAPIKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const clientIp = req.ip || req.connection.remoteAddress;
    const origin = req.headers.origin;
    const userAgent = req.headers['user-agent'];

    if (!apiKey) {
      AuditLogger.getInstance().log(
        'auth_failure',
        'unknown',
        {
          error: 'Missing API key',
          method: 'api_key',
        },
        req
      );

      return res.status(401).json({
        success: false,
        error: 'API key required',
        code: 'MISSING_API_KEY',
      });
    }

    // Validate API key using the new service
    const validation = await apiKeyService.validateAPIKey(
      apiKey,
      [], // No specific scopes required for basic auth
      clientIp,
      origin
    );

    if (!validation.valid) {
      const responseTime = Date.now() - startTime;
      
      // Log security violation if API key is invalid
      if (validation.apiKey) {
        await apiKeyService.logUsage(
          validation.apiKey.id,
          req.method,
          req.path,
          401,
          {
            ipAddress: clientIp,
            userAgent,
            origin,
            responseTimeMs: responseTime,
            errorMessage: validation.error,
            securityViolation: true,
            violationType: 'invalid_key',
          }
        );
      }

      AuditLogger.getInstance().log(
        'auth_failure',
        'unknown',
        {
          error: validation.error,
          method: 'api_key',
        },
        req
      );

      return res.status(401).json({
        success: false,
        error: validation.error || 'Invalid API key',
        code: 'INVALID_API_KEY',
      });
    }

    const { apiKey: validatedKey, rateLimitInfo } = validation;

    // Set API key context with enhanced information
    req.apiKey = {
      id: validatedKey!.id,
      name: validatedKey!.keyName,
      permissions: validatedKey!.scopes,
      rateLimit: validatedKey!.rateLimitPerMinute,
      userId: validatedKey!.userId,
      environment: validatedKey!.environment,
    };

    // Set rate limit headers
    if (rateLimitInfo) {
      res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
      res.setHeader('X-RateLimit-Reset', rateLimitInfo.resetAt.toISOString());
    }

    // Log successful authentication
    AuditLogger.getInstance().log(
      'auth_success',
      validatedKey!.id,
      { 
        method: 'api_key',
        keyName: validatedKey!.keyName,
        scopes: validatedKey!.scopes,
        rateLimitRemaining: rateLimitInfo?.remaining,
      },
      req
    );

    // Log API usage for analytics
    const responseTime = Date.now() - startTime;
    await apiKeyService.logUsage(
      validatedKey!.id,
      req.method,
      req.path,
      200, // Will be updated later if needed
      {
        ipAddress: clientIp,
        userAgent,
        origin,
        responseTimeMs: responseTime,
        rateLimitRemaining: rateLimitInfo?.remaining,
      }
    );

    next();
  } catch (error) {
    AuditLogger.getInstance().log(
      'auth_error',
      'unknown',
      {
        error: error.message,
        method: 'api_key',
      },
      req
    );

    return res.status(500).json({
      success: false,
      error: 'API key authentication failed',
      code: 'API_KEY_AUTH_FAILED',
    });
  }
};

// Combined authentication middleware (JWT or API Key)
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  if (authHeader) {
    return authenticateJWT(req, res, next);
  } else if (apiKey) {
    return authenticateAPIKey(req, res, next);
  } else {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Provide either Bearer token or API key.',
      code: 'NO_AUTH_METHOD',
    });
  }
};

// Authorization middleware for role-based access with enhanced API key support
export const authorize = (requiredPermissions: (string | APIKeyScope)[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    const apiKey = req.apiKey;

    let userPermissions: (string | APIKeyScope)[] = [];
    let userId = 'unknown';

    if (user) {
      userPermissions = user.permissions;
      userId = user.id;
      // Admin role has all permissions
      if (user.role === 'admin') {
        return next();
      }
    } else if (apiKey) {
      userPermissions = apiKey.permissions;
      userId = apiKey.id;
    }

    // Check if user has required permissions
    const hasPermission = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      AuditLogger.getInstance().log(
        'authorization_failure',
        userId,
        {
          required: requiredPermissions,
          available: userPermissions,
          authMethod: user ? 'jwt' : 'api_key',
        },
        req
      );

      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: requiredPermissions,
        available: userPermissions,
      });
    }

    next();
  };
};

// Input validation middleware
export const validateParameterUpdate = [
  body('category')
    .isIn([
      'core_ai',
      'voice_ai',
      'behavioral_intelligence',
      'rewards',
      'platform',
      'deployment',
    ])
    .withMessage('Invalid parameter category'),

  body('parameters')
    .isObject()
    .withMessage('Parameters must be an object')
    .custom(value => {
      if (Object.keys(value).length === 0) {
        throw new Error('Parameters object cannot be empty');
      }
      return true;
    }),

  body('userId')
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('Valid userId is required'),

  body('immediate').optional().isBoolean().withMessage('Immediate must be a boolean'),

  // Sanitize and validate individual parameters
  body('parameters.*').custom((value, { path }) => {
    // Prevent injection attacks
    if (typeof value === 'string' && value.length > 1000) {
      throw new Error(`Parameter ${path} is too long`);
    }

    // Block potentially dangerous values
    if (typeof value === 'string') {
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /eval\s*\(/i,
        /function\s*\(/i,
      ];

      if (dangerousPatterns.some(pattern => pattern.test(value))) {
        throw new Error(`Parameter ${path} contains potentially dangerous content`);
      }
    }

    return true;
  }),
];

export const validateUserId = [
  param('userId')
    .isString()
    .isLength({ min: 1, max: 255 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid userId format'),
];

export const validateSessionId = [
  param('sessionId')
    .isString()
    .isLength({ min: 1, max: 255 })
    .matches(/^session_[0-9]+_[a-zA-Z0-9]+$/)
    .withMessage('Invalid sessionId format'),
];

// Validation error handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    AuditLogger.getInstance().log(
      'validation_failure',
      (req as AuthenticatedRequest).user?.id || 'unknown',
      { errors: errors.array() },
      req
    );

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array(),
    });
  }

  next();
};

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (!securityConfig.csrfProtection) {
    return next();
  }

  // Skip CSRF for API key authentication
  if (req.headers['x-api-key']) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string;
  const sessionToken = req.headers.authorization?.split(' ')[1];

  if (!csrfToken || !sessionToken) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token required',
      code: 'MISSING_CSRF_TOKEN',
    });
  }

  // Verify CSRF token (simplified implementation)
  const expectedToken = crypto
    .createHmac('sha256', securityConfig.jwtSecret)
    .update(sessionToken)
    .digest('hex')
    .substring(0, 32);

  if (csrfToken !== expectedToken) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      code: 'INVALID_CSRF_TOKEN',
    });
  }

  next();
};

// Security logging middleware
export const securityLogger = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Log request
  AuditLogger.getInstance().log(
    'api_request',
    req.user?.id || req.apiKey?.id || 'anonymous',
    {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.method !== 'GET' ? '[REDACTED]' : undefined,
    },
    req
  );

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function (body: any) {
    const duration = Date.now() - startTime;

    AuditLogger.getInstance().log(
      'api_response',
      req.user?.id || req.apiKey?.id || 'anonymous',
      {
        statusCode: res.statusCode,
        duration,
        success: res.statusCode < 400,
      },
      req
    );

    return originalJson.call(this, body);
  };

  next();
};

// Error handling middleware
export const securityErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log security-related errors
  AuditLogger.getInstance().log(
    'security_error',
    (req as AuthenticatedRequest).user?.id || 'unknown',
    {
      error: err.message,
      stack: err.stack?.split('\n').slice(0, 3),
      type: err.name,
    },
    req
  );

  // Don't leak internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request data',
      code: 'VALIDATION_ERROR',
      details: isDevelopment ? err.details : undefined,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'RateLimitError') {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: err.retryAfter,
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    details: isDevelopment ? err.message : undefined,
  });
};

// Generate CSRF token utility
export const generateCSRFToken = (sessionToken: string): string => {
  return crypto
    .createHmac('sha256', securityConfig.jwtSecret)
    .update(sessionToken)
    .digest('hex')
    .substring(0, 32);
};

// Security utilities
export const SecurityUtils = {
  // Hash sensitive data
  hashSensitiveData: (data: string): string => {
    return crypto.createHash('sha256').update(data).digest('hex');
  },

  // Generate secure random tokens
  generateSecureToken: (length = 32): string => {
    return crypto.randomBytes(length).toString('hex');
  },

  // Validate IP address
  isValidIP: (ip: string): boolean => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  },

  // Get audit logs
  getAuditLogs: (limit?: number) => {
    return AuditLogger.getInstance().getRecentLogs(limit);
  },
};

export default {
  rateLimiters,
  securityHeaders,
  corsOptions,
  authenticate,
  authorize,
  validateParameterUpdate,
  validateUserId,
  validateSessionId,
  handleValidationErrors,
  csrfProtection,
  securityLogger,
  securityErrorHandler,
  generateCSRFToken,
  SecurityUtils,
};
