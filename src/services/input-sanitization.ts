/**
 * Comprehensive Input Sanitization Service
 * Provides advanced sanitization, validation, and security filtering for React components
 */

import DOMPurify from 'dompurify';
import { SecurityService } from './security';

export interface SanitizationOptions {
  allowHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
  maxLength?: number;
  stripEmojis?: boolean;
  normalizeWhitespace?: boolean;
  preventSQL?: boolean;
  preventXSS?: boolean;
  preventCodeInjection?: boolean;
  customValidation?: (input: string) => boolean;
  customTransformation?: (input: string) => string;
}

export interface SanitizationResult {
  sanitized: string;
  original: string;
  wasModified: boolean;
  violations: string[];
  isValid: boolean;
}

export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'url'
  | 'phone'
  | 'number'
  | 'html'
  | 'markdown'
  | 'json'
  | 'name'
  | 'message'
  | 'code'
  | 'search'
  | 'username';

class InputSanitizationService {
  private static instance: InputSanitizationService;
  private securityService: SecurityService;

  // Dangerous patterns that should always be blocked
  private readonly DANGEROUS_PATTERNS = [
    /javascript\s*:/gi,
    /vbscript\s*:/gi,
    /data\s*:\s*text\/html/gi,
    /data\s*:\s*image\/svg\+xml/gi,
    /<\s*script[^>]*>/gi,
    /<\s*\/\s*script[^>]*>/gi,
    /<\s*iframe[^>]*>/gi,
    /<\s*object[^>]*>/gi,
    /<\s*embed[^>]*>/gi,
    /<\s*link[^>]*>/gi,
    /<\s*meta[^>]*>/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
    /document\s*\.\s*(write|writeln|cookie)/gi,
    /window\s*\.\s*(location|open)/gi,
  ];

  // SQL injection patterns
  private readonly SQL_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\s+[\w\s]*\s*=\s*[\w\s]*)/gi,
    /([\s\S]*['"][\s\S]*;[\s\S]*--)/gi,
    /(\b(INFORMATION_SCHEMA|SYS|SYSOBJECTS)\b)/gi,
    /([\s\S]*UNION[\s\S]+SELECT[\s\S]*)/gi,
  ];

  // Code injection patterns
  private readonly CODE_PATTERNS = [
    /__import__\s*\(/gi,
    /exec\s*\(/gi,
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /require\s*\(/gi,
    /import\s+.*from/gi,
    /<%[\s\S]*%>/gi, // Server-side includes
    /<\?php[\s\S]*\?>/gi, // PHP code
    /<%=[\s\S]*%>/gi, // ASP/JSP code
  ];

  // Default configurations for different input types
  private readonly TYPE_CONFIGS: Record<InputType, SanitizationOptions> = {
    text: {
      allowHtml: false,
      maxLength: 500,
      normalizeWhitespace: true,
      preventXSS: true,
      preventSQL: true,
      preventCodeInjection: true,
    },
    email: {
      allowHtml: false,
      maxLength: 254,
      normalizeWhitespace: true,
      preventXSS: true,
      preventSQL: true,
      preventCodeInjection: true,
      customValidation: input => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input),
    },
    password: {
      allowHtml: false,
      maxLength: 128,
      normalizeWhitespace: false,
      preventXSS: true,
      preventSQL: false, // Passwords are hashed, SQL injection less relevant
      preventCodeInjection: true,
    },
    url: {
      allowHtml: false,
      maxLength: 2048,
      normalizeWhitespace: true,
      preventXSS: true,
      preventSQL: true,
      preventCodeInjection: true,
      customValidation: input => {
        try {
          const url = new URL(input);
          return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol);
        } catch {
          return false;
        }
      },
    },
    phone: {
      allowHtml: false,
      maxLength: 20,
      normalizeWhitespace: true,
      preventXSS: true,
      preventSQL: true,
      preventCodeInjection: true,
      customTransformation: input => input.replace(/[^\d\s\-\+\(\)]/g, ''),
    },
    number: {
      allowHtml: false,
      maxLength: 50,
      normalizeWhitespace: true,
      preventXSS: true,
      preventSQL: true,
      preventCodeInjection: true,
      customTransformation: input => input.replace(/[^\d\.\-\+e]/gi, ''),
    },
    html: {
      allowHtml: true,
      allowedTags: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'a',
        'blockquote',
      ],
      allowedAttributes: ['href', 'title', 'alt'],
      maxLength: 10000,
      preventXSS: true,
      preventSQL: true,
      preventCodeInjection: true,
    },
    markdown: {
      allowHtml: false,
      maxLength: 10000,
      normalizeWhitespace: false,
      preventXSS: true,
      preventSQL: true,
      preventCodeInjection: true,
    },
    json: {
      allowHtml: false,
      maxLength: 50000,
      normalizeWhitespace: false,
      preventXSS: true,
      preventSQL: true,
      preventCodeInjection: true,
      customValidation: input => {
        try {
          JSON.parse(input);
          return true;
        } catch {
          return false;
        }
      },
    },
    name: {
      allowHtml: false,
      maxLength: 100,
      normalizeWhitespace: true,
      stripEmojis: false,
      preventXSS: true,
      preventSQL: true,
      preventCodeInjection: true,
      customTransformation: input => input.replace(/[^\p{L}\p{M}\s\-\.\']/gu, ''),
    },
    message: {
      allowHtml: false,
      maxLength: 2000,
      normalizeWhitespace: true,
      preventXSS: true,
      preventSQL: true,
      preventCodeInjection: true,
    },
    code: {
      allowHtml: false,
      maxLength: 10000,
      normalizeWhitespace: false,
      preventXSS: true,
      preventSQL: false, // Code snippets might contain SQL for educational purposes
      preventCodeInjection: false, // This is expected to contain code
    },
    search: {
      allowHtml: false,
      maxLength: 200,
      normalizeWhitespace: true,
      preventXSS: true,
      preventSQL: true,
      preventCodeInjection: true,
    },
    username: {
      allowHtml: false,
      maxLength: 50,
      normalizeWhitespace: true,
      stripEmojis: true,
      preventXSS: true,
      preventSQL: true,
      preventCodeInjection: true,
      customTransformation: input => input.replace(/[^\w\-\.]/g, ''),
      customValidation: input => /^[a-zA-Z0-9._-]+$/.test(input) && input.length >= 3,
    },
  };

  private constructor() {
    this.securityService = SecurityService.getInstance();
  }

  static getInstance(): InputSanitizationService {
    if (!InputSanitizationService.instance) {
      InputSanitizationService.instance = new InputSanitizationService();
    }
    return InputSanitizationService.instance;
  }

  /**
   * Comprehensive input sanitization with detailed reporting
   */
  sanitize(
    input: any,
    type: InputType = 'text',
    customOptions?: SanitizationOptions
  ): SanitizationResult {
    // Handle non-string inputs
    if (typeof input !== 'string') {
      if (input === null || input === undefined) {
        return {
          sanitized: '',
          original: String(input),
          wasModified: input !== '',
          violations: input ? ['Non-string input converted to string'] : [],
          isValid: true,
        };
      }
      input = String(input);
    }

    const original = input;
    const options = { ...this.TYPE_CONFIGS[type], ...customOptions };
    const violations: string[] = [];
    let sanitized = input;

    // Step 1: Check dangerous patterns
    if (options.preventXSS) {
      for (const pattern of this.DANGEROUS_PATTERNS) {
        if (pattern.test(sanitized)) {
          violations.push(`XSS pattern detected: ${pattern.toString()}`);
          sanitized = sanitized.replace(pattern, '');
        }
      }
    }

    // Step 2: Check SQL injection patterns
    if (options.preventSQL) {
      for (const pattern of this.SQL_PATTERNS) {
        if (pattern.test(sanitized)) {
          violations.push(`SQL injection pattern detected: ${pattern.toString()}`);
          sanitized = sanitized.replace(pattern, '***BLOCKED***');
        }
      }
    }

    // Step 3: Check code injection patterns
    if (options.preventCodeInjection) {
      for (const pattern of this.CODE_PATTERNS) {
        if (pattern.test(sanitized)) {
          violations.push(`Code injection pattern detected: ${pattern.toString()}`);
          sanitized = sanitized.replace(pattern, '***BLOCKED***');
        }
      }
    }

    // Step 4: Custom transformation
    if (options.customTransformation) {
      sanitized = options.customTransformation(sanitized);
    }

    // Step 5: HTML sanitization
    if (options.allowHtml) {
      const domPurifyOptions: any = {
        ALLOWED_TAGS: options.allowedTags || ['p', 'br', 'strong', 'em'],
        ALLOWED_ATTR: options.allowedAttributes || [],
        KEEP_CONTENT: true,
        SANITIZE_DOM: true,
        SANITIZE_NAMED_PROPS: true,
      };

      const beforeHtmlSanitization = sanitized;
      sanitized = DOMPurify.sanitize(sanitized, domPurifyOptions);

      if (beforeHtmlSanitization !== sanitized) {
        violations.push('HTML content was sanitized');
      }
    } else {
      // Strip all HTML tags
      const beforeStripHtml = sanitized;
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
      });

      if (beforeStripHtml !== sanitized) {
        violations.push('HTML tags were removed');
      }
    }

    // Step 6: Strip emojis if requested
    if (options.stripEmojis) {
      const beforeStripEmojis = sanitized;
      sanitized = sanitized.replace(
        /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
        ''
      );

      if (beforeStripEmojis !== sanitized) {
        violations.push('Emojis were removed');
      }
    }

    // Step 7: Normalize whitespace
    if (options.normalizeWhitespace) {
      const beforeNormalize = sanitized;
      sanitized = sanitized.replace(/\s+/g, ' ').trim();

      if (beforeNormalize !== sanitized) {
        violations.push('Whitespace was normalized');
      }
    }

    // Step 8: Enforce length limits
    if (options.maxLength && sanitized.length > options.maxLength) {
      violations.push(
        `Input truncated from ${sanitized.length} to ${options.maxLength} characters`
      );
      sanitized = sanitized.substring(0, options.maxLength).trim();
    }

    // Step 9: Custom validation
    let isValid = true;
    if (options.customValidation && !options.customValidation(sanitized)) {
      violations.push('Custom validation failed');
      isValid = false;
    }

    return {
      sanitized,
      original,
      wasModified: sanitized !== original,
      violations,
      isValid,
    };
  }

  /**
   * Batch sanitize multiple inputs
   */
  sanitizeBatch(
    inputs: Record<
      string,
      { value: any; type: InputType; options?: SanitizationOptions }
    >
  ): Record<string, SanitizationResult> {
    const results: Record<string, SanitizationResult> = {};

    for (const [key, { value, type, options }] of Object.entries(inputs)) {
      results[key] = this.sanitize(value, type, options);
    }

    return results;
  }

  /**
   * Quick sanitize for simple use cases
   */
  quickSanitize(input: string, type: InputType = 'text'): string {
    return this.sanitize(input, type).sanitized;
  }

  /**
   * Validate input without modification
   */
  validate(
    input: string,
    type: InputType = 'text',
    options?: SanitizationOptions
  ): {
    isValid: boolean;
    violations: string[];
  } {
    const result = this.sanitize(input, type, options);
    return {
      isValid: !result.wasModified && result.isValid,
      violations: result.violations,
    };
  }

  /**
   * Get configuration for a specific input type
   */
  getTypeConfig(type: InputType): SanitizationOptions {
    return { ...this.TYPE_CONFIGS[type] };
  }

  /**
   * Check if input contains dangerous patterns
   */
  isDangerous(input: string): boolean {
    const allPatterns = [
      ...this.DANGEROUS_PATTERNS,
      ...this.SQL_PATTERNS,
      ...this.CODE_PATTERNS,
    ];

    return allPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize file upload names
   */
  sanitizeFileName(fileName: string): string {
    // Remove path traversal attempts
    let sanitized = fileName.replace(/[/\\]/g, '');

    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '');

    // Limit length
    if (sanitized.length > 255) {
      const extension = sanitized.split('.').pop() || '';
      const nameWithoutExt = sanitized.substring(
        0,
        sanitized.lastIndexOf('.') || sanitized.length
      );
      sanitized =
        nameWithoutExt.substring(0, 255 - extension.length - 1) + '.' + extension;
    }

    // Ensure it's not empty
    if (!sanitized.trim()) {
      sanitized = 'untitled';
    }

    return sanitized;
  }

  /**
   * Sanitize URL parameters
   */
  sanitizeUrlParams(params: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      const sanitizedKey = this.quickSanitize(String(key), 'text');
      const sanitizedValue = this.quickSanitize(String(value), 'text');

      if (sanitizedKey && sanitizedValue) {
        sanitized[sanitizedKey] = sanitizedValue;
      }
    }

    return sanitized;
  }

  /**
   * Create a sanitized copy of form data
   */
  sanitizeFormData(
    formData: Record<string, any>,
    fieldTypes: Record<string, InputType> = {}
  ): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [field, value] of Object.entries(formData)) {
      const type = fieldTypes[field] || 'text';
      sanitized[field] = this.quickSanitize(String(value), type);
    }

    return sanitized;
  }
}

export default InputSanitizationService;
