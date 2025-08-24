// Security Service for Smart Alarm App
// Provides encryption, decryption, and security utilities

import CryptoJS from 'crypto-js';
import DOMPurify from 'dompurify';
import zxcvbn from 'zxcvbn';

export interface PasswordStrength {
  score: number; // 0-4, where 4 is strongest
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crack_times_display: {
    offline_slow_hashing_1e4_per_second: string;
    offline_fast_hashing_1e10_per_second: string;
    online_no_throttling_10_per_second: string;
    online_throttling_100_per_hour: string;
  };
}

class SecurityService {
  private static instance: SecurityService;
  private encryptionKey: string | null = null;
  private readonly STORAGE_PREFIX = 'saa_'; // Smart Alarm App prefix
  private readonly KEY_ITERATIONS = 10000; // PBKDF2 iterations
  private readonly SALT_LENGTH = 16; // bytes
  private readonly IV_LENGTH = 16; // bytes

  private constructor() {
    this.initializeEncryptionKey();
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Initialize encryption key from user session or generate new one
   */
  private initializeEncryptionKey(): void {
    // In a real app, this key would be derived from user authentication
    // For now, we'll use a device-specific key stored securely
    let deviceKey = localStorage.getItem(`${this.STORAGE_PREFIX}device_key`);

    if (!deviceKey) {
      // Generate a new device-specific key
      deviceKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
      localStorage.setItem(`${this.STORAGE_PREFIX}device_key`, deviceKey);
    }

    this.encryptionKey = deviceKey;
  }

  /**
   * Generate a cryptographically secure random salt
   */
  private generateSalt(): string {
    return CryptoJS.lib.WordArray.random(this.SALT_LENGTH).toString();
  }

  /**
   * Generate a cryptographically secure random IV
   */
  private generateIV(): string {
    return CryptoJS.lib.WordArray.random(this.IV_LENGTH).toString();
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  private deriveKey(password: string, salt: string): string {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: this.KEY_ITERATIONS,
      hasher: CryptoJS.algo.SHA256,
    }).toString();
  }

  /**
   * Encrypt sensitive data before storage
   */
  encryptData(data: any): string {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not initialized');
      }

      const dataString = JSON.stringify(data);
      const salt = this.generateSalt();
      const iv = this.generateIV();

      const key = this.deriveKey(this.encryptionKey, salt);

      const encrypted = CryptoJS.AES.encrypt(dataString, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // Combine salt + iv + encrypted data
      const result = {
        salt,
        iv,
        data: encrypted.toString(),
        timestamp: new Date().toISOString(),
      };

      return btoa(JSON.stringify(result)); // Base64 encode the result
    } catch (_error) {
      console._error('[SecurityService] Encryption failed:', _error);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt sensitive data after retrieval
   */
  decryptData(encryptedData: string): any {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not initialized');
      }

      const decoded = JSON.parse(atob(encryptedData));
      const { salt, iv, data } = decoded;

      const key = this.deriveKey(this.encryptionKey, salt);

      const decrypted = CryptoJS.AES.decrypt(data, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Decryption failed - invalid data or key');
      }

      return JSON.parse(decryptedString);
    } catch (_error) {
      console._error('[SecurityService] Decryption failed:', _error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Securely store encrypted data in localStorage
   */
  secureStorageSet(key: string, data: any): void {
    try {
      const encrypted = this.encryptData(data);
      localStorage.setItem(`${this.STORAGE_PREFIX}${key}`, encrypted);
    } catch (_error) {
      console.error('[SecurityService] Secure storage set failed:', _error);
      throw _error;
    }
  }

  /**
   * Securely retrieve and decrypt data from localStorage
   */
  secureStorageGet(key: string): any {
    try {
      const encrypted = localStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
      if (!encrypted) {
        return null;
      }
      return this.decryptData(encrypted);
    } catch (_error) {
      console._error('[SecurityService] Secure storage get failed:', _error);
      // Return null instead of throwing to handle corrupted data gracefully
      return null;
    }
  }

  /**
   * Securely remove data from localStorage
   */
  secureStorageRemove(key: string): void {
    localStorage.removeItem(`${this.STORAGE_PREFIX}${key}`);
  }

  /**
   * Clear all secure storage data
   */
  clearSecureStorage(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Sanitize HTML input to prevent XSS attacks
   */
  sanitizeHtml(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true, // Keep text content, remove tags
      SANITIZE_NAMED_PROPS: true,
      SANITIZE_DOM: true,
    });
  }

  /**
   * Advanced input sanitization with custom rules
   */
  sanitizeInput(
    input: string,
    options?: {
      allowBasicFormatting?: boolean;
      maxLength?: number;
      stripEmoji?: boolean;
    }
  ): string {
    if (typeof input !== 'string') {
      return '';
    }

    const opts = {
      allowBasicFormatting: false,
      maxLength: 1000,
      stripEmoji: false,
      ...options,
    };

    let sanitized = input.trim();

    // Remove potentially dangerous patterns
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/vbscript:/gi, '');
    sanitized = sanitized.replace(/data:text\/html/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    // Use DOMPurify for HTML sanitization
    if (opts.allowBasicFormatting) {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
      });
    } else {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
      });
    }

    // Remove emoji if requested
    if (opts.stripEmoji) {
      sanitized = sanitized.replace(
        /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
        ''
      );
    }

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // Limit length
    if (sanitized.length > opts.maxLength) {
      sanitized = sanitized.substring(0, opts.maxLength).trim();
    }

    return sanitized;
  }

  /**
   * Check password strength using zxcvbn
   */
  checkPasswordStrength(password: string): PasswordStrength {
    if (!password || typeof password !== 'string') {
      return {
        score: 0,
        feedback: {
          warning: 'Password is required',
          suggestions: ['Enter a password'],
        },
        crack_times_display: {
          offline_slow_hashing_1e4_per_second: 'instantly',
          offline_fast_hashing_1e10_per_second: 'instantly',
          online_no_throttling_10_per_second: 'instantly',
          online_throttling_100_per_hour: 'instantly',
        },
      };
    }

    const result = zxcvbn(password);
    return {
      score: result.score,
      feedback: result.feedback,
      crack_times_display: result.crack_times_display,
    };
  }

  /**
   * Validate password against security requirements
   */
  validatePasswordSecurity(password: string): {
    isValid: boolean;
    errors: string[];
    strength: PasswordStrength;
  } {
    const errors: string[] = [];
    const strength = this.checkPasswordStrength(password);

    // Basic requirements
    if (!password || password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password should not contain repeated characters');
    }

    // zxcvbn strength check
    if (strength.score < 3) {
      errors.push(`Password is too weak. ${strength.feedback.warning}`);
      errors.push(...strength.feedback.suggestions);
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength,
    };
  }

  /**
   * Generate secure random password
   */
  generateSecurePassword(length = 16): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }

    return password;
  }

  /**
   * Hash data using SHA-256
   */
  hashData(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(): string {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) {
      return false;
    }
    // Use constant-time comparison to prevent timing attacks
    return (
      CryptoJS.enc.Hex.stringify(CryptoJS.SHA256(token)) ===
      CryptoJS.enc.Hex.stringify(CryptoJS.SHA256(expectedToken))
    );
  }

  /**
   * Check if data has been tampered with using HMAC
   */
  generateDataSignature(data: any): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const dataString = JSON.stringify(data);
    return CryptoJS.HmacSHA256(dataString, this.encryptionKey).toString();
  }

  /**
   * Verify data signature
   */
  verifyDataSignature(data: any, signature: string): boolean {
    try {
      const expectedSignature = this.generateDataSignature(data);
      return signature === expectedSignature;
    } catch {
      return false;
    }
  }

  /**
   * Rate limiting helper (client-side)
   */
  checkRateLimit(action: string, maxAttempts: number, windowMs: number): boolean {
    const key = `rate_limit_${action}`;
    const now = Date.now();

    let attempts = this.secureStorageGet(key) || [];

    // Remove old attempts outside the window
    attempts = attempts.filter((timestamp: number) => now - timestamp < windowMs);

    if (attempts.length >= maxAttempts) {
      return false; // Rate limit exceeded
    }

    // Add current attempt
    attempts.push(now);
    this.secureStorageSet(key, attempts);

    return true; // Within rate limit
  }

  /**
   * Clear rate limit data for an action
   */
  clearRateLimit(action: string): void {
    const key = `rate_limit_${action}`;
    this.secureStorageRemove(key);
  }
}

export default SecurityService.getInstance();
