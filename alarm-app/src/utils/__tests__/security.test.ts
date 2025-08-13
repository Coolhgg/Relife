// Security Service Tests
// Validates encryption, validation, and security utilities

import SecurityService from '../../../services/security';
import { validateEmail, validatePassword, sanitizeTextInput } from '../../validation';

describe('SecurityService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Data Encryption', () => {
    test('should encrypt and decrypt data correctly', () => {
      const testData = {
        id: '123',
        sensitive: 'secret information',
        timestamp: new Date().toISOString()
      };

      const encrypted = SecurityService.encryptData(testData);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toContain('secret information');

      const decrypted = SecurityService.decryptData(encrypted);
      expect(decrypted).toEqual(testData);
    });

    test('should handle encryption errors gracefully', () => {
      expect(() => {
        SecurityService.decryptData('invalid-encrypted-data');
      }).toThrow();
    });
  });

  describe('Secure Storage', () => {
    test('should store and retrieve data securely', () => {
      const testData = { userId: 'user123', preferences: { theme: 'dark' } };
      
      SecurityService.secureStorageSet('user-data', testData);
      const retrieved = SecurityService.secureStorageGet('user-data');
      
      expect(retrieved).toEqual(testData);
    });

    test('should return null for non-existent keys', () => {
      const result = SecurityService.secureStorageGet('non-existent-key');
      expect(result).toBeNull();
    });

    test('should clear secure storage', () => {
      SecurityService.secureStorageSet('test-key', { data: 'test' });
      SecurityService.clearSecureStorage();
      
      const result = SecurityService.secureStorageGet('test-key');
      expect(result).toBeNull();
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize HTML input', () => {
      const maliciousInput = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = SecurityService.sanitizeHtml(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toBe('Safe content');
    });

    test('should sanitize input with options', () => {
      const input = 'Hello <b>world</b>! 😀 This is a very long text that should be truncated at some point to prevent overflow issues.';
      
      const sanitized = SecurityService.sanitizeInput(input, {
        allowBasicFormatting: true,
        maxLength: 50,
        stripEmoji: true
      });
      
      expect(sanitized).toContain('<b>world</b>');
      expect(sanitized).not.toContain('😀');
      expect(sanitized.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Password Validation', () => {
    test('should validate strong passwords', () => {
      const strongPassword = 'MyStr0ng!P@ssw0rd123';
      const result = SecurityService.validatePasswordSecurity(strongPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.strength.score).toBeGreaterThanOrEqual(3);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject weak passwords', () => {
      const weakPassword = '123456';
      const result = SecurityService.validatePasswordSecurity(weakPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.strength.score).toBeLessThan(2);
    });

    test('should provide feedback for medium passwords', () => {
      const mediumPassword = 'password123';
      const result = SecurityService.validatePasswordSecurity(mediumPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.strength.feedback.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting', () => {
    test('should allow requests within rate limit', () => {
      const action = 'test-action';
      const maxAttempts = 3;
      const windowMs = 60000;
      
      // First few attempts should succeed
      expect(SecurityService.checkRateLimit(action, maxAttempts, windowMs)).toBe(true);
      expect(SecurityService.checkRateLimit(action, maxAttempts, windowMs)).toBe(true);
      expect(SecurityService.checkRateLimit(action, maxAttempts, windowMs)).toBe(true);
    });

    test('should block requests exceeding rate limit', () => {
      const action = 'test-action-block';
      const maxAttempts = 2;
      const windowMs = 60000;
      
      // Exhaust the rate limit
      SecurityService.checkRateLimit(action, maxAttempts, windowMs);
      SecurityService.checkRateLimit(action, maxAttempts, windowMs);
      
      // Next attempt should be blocked
      expect(SecurityService.checkRateLimit(action, maxAttempts, windowMs)).toBe(false);
    });

    test('should clear rate limit data', () => {
      const action = 'test-action-clear';
      const maxAttempts = 1;
      const windowMs = 60000;
      
      // Exhaust rate limit
      SecurityService.checkRateLimit(action, maxAttempts, windowMs);
      expect(SecurityService.checkRateLimit(action, maxAttempts, windowMs)).toBe(false);
      
      // Clear and try again
      SecurityService.clearRateLimit(action);
      expect(SecurityService.checkRateLimit(action, maxAttempts, windowMs)).toBe(true);
    });
  });

  describe('CSRF Protection', () => {
    test('should generate CSRF tokens', () => {
      const token1 = SecurityService.generateCSRFToken();
      const token2 = SecurityService.generateCSRFToken();
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(10);
    });

    test('should validate CSRF tokens', () => {
      const token = SecurityService.generateCSRFToken();
      
      expect(SecurityService.validateCSRFToken(token, token)).toBe(true);
      expect(SecurityService.validateCSRFToken(token, 'different-token')).toBe(false);
      expect(SecurityService.validateCSRFToken('', token)).toBe(false);
      expect(SecurityService.validateCSRFToken(token, '')).toBe(false);
    });
  });

  describe('Data Integrity', () => {
    test('should generate and verify data signatures', () => {
      const data = { id: '123', value: 'test data' };
      
      const signature = SecurityService.generateDataSignature(data);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      
      expect(SecurityService.verifyDataSignature(data, signature)).toBe(true);
      
      // Modified data should fail verification
      const modifiedData = { ...data, value: 'modified' };
      expect(SecurityService.verifyDataSignature(modifiedData, signature)).toBe(false);
    });
  });
});

describe('Enhanced Validation Utils', () => {
  describe('Email Validation', () => {
    test('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@domain.org'
      ];
      
      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@domain.com',
        'test@domain',
        'test@domain..com'
      ];
      
      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should detect suspicious email patterns', () => {
      const suspiciousEmails = [
        'test<script>@domain.com',
        'test@domain.com"javascript:',
        'test@domain.com&lt;script&gt;'
      ];
      
      suspiciousEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => 
          error.includes('invalid characters')
        )).toBe(true);
      });
    });
  });

  describe('Password Validation Integration', () => {
    test('should use enhanced password validation', () => {
      const password = 'weak';
      const result = validatePassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBeDefined();
      expect(result.strength.score).toBeLessThan(3);
    });
  });

  describe('Text Sanitization', () => {
    test('should sanitize dangerous input', () => {
      const dangerousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = sanitizeTextInput(dangerousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toBe('Hello World');
    });

    test('should handle empty and null inputs', () => {
      expect(sanitizeTextInput('')).toBe('');
      expect(sanitizeTextInput(null as any)).toBe('');
      expect(sanitizeTextInput(undefined as any)).toBe('');
    });
  });
});