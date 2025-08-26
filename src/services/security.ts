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
   * Enhanced password validation against comprehensive security requirements
   */
  validatePasswordSecurity(password: string, options?: {
    enforceMinScore?: number;
    maxLength?: number;
    checkDictionary?: boolean;
    checkKeyboardPatterns?: boolean;
    requireMinEntropy?: boolean;
  }): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    strength: PasswordStrength;
    entropy: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const opts = {
      enforceMinScore: 3,
      maxLength: 128,
      checkDictionary: true,
      checkKeyboardPatterns: true,
      requireMinEntropy: true,
      ...options,
    };

    const strength = this.checkPasswordStrength(password);
    const entropy = this.calculatePasswordEntropy(password);

    // Length requirements
    if (!password || password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    if (password && password.length > opts.maxLength) {
      errors.push(`Password must not exceed ${opts.maxLength} characters`);
    }

    // Character diversity requirements (enhanced)
    const lowercaseCount = (password.match(/[a-z]/g) || []).length;
    const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
    const digitCount = (password.match(/\d/g) || []).length;
    const specialCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/g) || []).length;

    if (lowercaseCount < 2) {
      errors.push('Password must contain at least 2 lowercase letters');
    }
    if (uppercaseCount < 2) {
      errors.push('Password must contain at least 2 uppercase letters');
    }
    if (digitCount < 2) {
      errors.push('Password must contain at least 2 numbers');
    }
    if (specialCount < 2) {
      errors.push('Password must contain at least 2 special characters');
    }

    // Advanced pattern checks
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password must not contain more than 2 consecutive identical characters');
    }

    // Sequential character check
    if (this.hasSequentialChars(password)) {
      errors.push('Password must not contain sequential characters (abc, 123, etc.)');
    }

    // Keyboard pattern check
    if (opts.checkKeyboardPatterns && this.hasKeyboardPattern(password)) {
      errors.push('Password must not contain keyboard patterns (qwerty, asdf, etc.)');
    }

    // Dictionary word check
    if (opts.checkDictionary && this.containsDictionaryWords(password)) {
      warnings.push('Password contains common dictionary words - consider using more random combinations');
    }

    // Common password patterns
    if (this.isCommonPasswordPattern(password)) {
      errors.push('Password follows a common pattern that is easily guessable');
    }

    // Entropy requirements
    if (opts.requireMinEntropy && entropy < 50) {
      warnings.push(`Password entropy (${entropy.toFixed(1)}) is below recommended minimum of 50 bits`);
    }

    // Personal information check (basic)
    if (this.containsPersonalInfo(password)) {
      errors.push('Password must not contain obvious personal information');
    }

    // zxcvbn strength check (enhanced)
    if (strength.score < opts.enforceMinScore) {
      errors.push(`Password strength is too low (${strength.score}/${opts.enforceMinScore} required). ${strength.feedback.warning}`);
      if (strength.feedback.suggestions.length > 0) {
        warnings.push(...strength.feedback.suggestions);
      }
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (errors.length > 0) {
      riskLevel = 'critical';
    } else if (strength.score < 2 || entropy < 40) {
      riskLevel = 'high';
    } else if (strength.score < 3 || entropy < 50 || warnings.length > 2) {
      riskLevel = 'medium';
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      strength,
      entropy,
      riskLevel,
    };
  }

  /**
   * Calculate password entropy in bits
   */
  private calculatePasswordEntropy(password: string): number {
    if (!password) return 0;

    let charset = 0;
    if (/[a-z]/.test(password)) charset += 26;
    if (/[A-Z]/.test(password)) charset += 26;
    if (/\d/.test(password)) charset += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) charset += 32;
    if (/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) charset += 50; // Other unicode

    return Math.log2(Math.pow(charset, password.length));
  }

  /**
   * Check for sequential characters
   */
  private hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      'zyxwvutsrqponmlkjihgfedcba',
      '0123456789',
      '9876543210',
      'qwertyuiopasdfghjklzxcvbnm',
      'mnbvcxzlkjhgfdsapoiuytrewq',
    ];

    const lowerPassword = password.toLowerCase();
    return sequences.some(seq => {
      for (let i = 0; i <= seq.length - 3; i++) {
        if (lowerPassword.includes(seq.substring(i, i + 3))) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Check for keyboard patterns
   */
  private hasKeyboardPattern(password: string): boolean {
    const patterns = [
      'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
      'poiuytrewq', 'lkjhgfdsa', 'mnbvcxz',
      '1234567890', '0987654321',
      '!@#$%^&*()', ')(*&^%$#@!',
    ];

    const lowerPassword = password.toLowerCase();
    return patterns.some(pattern => {
      for (let i = 0; i <= pattern.length - 3; i++) {
        if (lowerPassword.includes(pattern.substring(i, i + 3))) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Check for common dictionary words
   */
  private containsDictionaryWords(password: string): boolean {
    const commonWords = [
      'password', 'admin', 'user', 'login', 'welcome', 'hello', 'world',
      'love', 'life', 'money', 'home', 'work', 'email', 'phone', 'name',
      'address', 'birthday', 'family', 'friend', 'school', 'company',
      'computer', 'internet', 'website', 'security', 'private', 'secret',
      'account', 'access', 'system', 'network', 'server', 'database',
    ];

    const lowerPassword = password.toLowerCase();
    return commonWords.some(word => 
      word.length >= 4 && lowerPassword.includes(word)
    );
  }

  /**
   * Check for common password patterns
   */
  private isCommonPasswordPattern(password: string): boolean {
    const patterns = [
      /^password\d*[!@#$%^&*]*$/i,
      /^\w*123[!@#$%^&*]*$/i,
      /^\w*\d{4}[!@#$%^&*]*$/i, // year patterns
      /^[a-zA-Z]+\d{1,4}[!@#$%^&*]*$/, // word + numbers
      /^\d{4,}[a-zA-Z]*[!@#$%^&*]*$/, // numbers + letters
      /^[!@#$%^&*]+\w+[!@#$%^&*]*$/, // symbols + word
      /^(..)\1+/, // repeated pairs
    ];

    return patterns.some(pattern => pattern.test(password));
  }

  /**
   * Basic check for personal information patterns
   */
  private containsPersonalInfo(password: string): boolean {
    const personalPatterns = [
      /admin|user|guest|test|demo/i,
      /(19|20)\d{2}/, // years
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i, // months
      /\b(mon|tue|wed|thu|fri|sat|sun)\b/i, // days
    ];

    return personalPatterns.some(pattern => pattern.test(password));
  }

  /**
   * Check password against previous passwords (for password history)
   */
  validatePasswordHistory(newPassword: string, previousPasswords: string[] = []): {
    isValid: boolean;
    error?: string;
  } {
    const hashedNew = this.hashData(newPassword);
    const hashedPrevious = previousPasswords.map(pwd => this.hashData(pwd));

    if (hashedPrevious.includes(hashedNew)) {
      return {
        isValid: false,
        error: 'Password has been used recently. Please choose a different password.',
      };
    }

    // Check for similar passwords (edit distance)
    for (const prevPwd of previousPasswords) {
      if (this.calculateEditDistance(newPassword.toLowerCase(), prevPwd.toLowerCase()) < 3) {
        return {
          isValid: false,
          error: 'New password is too similar to a recently used password.',
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private calculateEditDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
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
