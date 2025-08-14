import {
  validateTime,
  validateLabel,
  validateDays,
  validateVoiceMood,
  validateAlarmData,
  sanitizeTextInput,
  validateNumber,
  validateEmail,
  validateUrl
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateTime', () => {
    test('validates correct time format', () => {
      const result = validateTime('14:30');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toBe('14:30');
    });

    test('validates edge case times', () => {
      expect(validateTime('00:00').isValid).toBe(true);
      expect(validateTime('23:59').isValid).toBe(true);
      expect(validateTime('12:00').isValid).toBe(true);
    });

    test('rejects invalid time format', () => {
      const result = validateTime('25:00');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Hours must be between 0 and 23');
    });

    test('rejects invalid time strings', () => {
      expect(validateTime('abc').isValid).toBe(false);
      expect(validateTime('12:70').isValid).toBe(false);
      expect(validateTime('').isValid).toBe(false);
      expect(validateTime('24:00').isValid).toBe(false);
    });

    test('handles edge cases', () => {
      expect(validateTime('12').isValid).toBe(false);
      expect(validateTime('12:').isValid).toBe(false);
      expect(validateTime(':30').isValid).toBe(false);
      expect(validateTime('12:3').isValid).toBe(false);
    });

    test('trims whitespace', () => {
      const result = validateTime('  14:30  ');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('14:30');
    });
  });

  describe('validateLabel', () => {
    test('validates correct labels', () => {
      const result = validateLabel('Morning Alarm');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toBe('Morning Alarm');
    });

    test('rejects empty labels', () => {
      expect(validateLabel('').isValid).toBe(false);
      expect(validateLabel('   ').isValid).toBe(false);
    });

    test('rejects labels that are too short', () => {
      const result = validateLabel('A');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Label must be at least 2 characters long');
    });

    test('rejects labels that are too long', () => {
      const longLabel = 'A'.repeat(101);
      const result = validateLabel(longLabel);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Label must be less than 100 characters');
    });

    test('detects and rejects dangerous content', () => {
      const dangerousLabel = '<script>alert("xss")</script>';
      const result = validateLabel(dangerousLabel);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Label contains potentially unsafe content');
    });

    test('sanitizes HTML content', () => {
      const htmlLabel = 'My <b>Alarm</b>';
      const result = validateLabel(htmlLabel);
      expect(result.sanitized).toBe('My Alarm');
    });

    test('normalizes whitespace', () => {
      const result = validateLabel('  My   Alarm  ');
      expect(result.sanitized).toBe('My Alarm');
    });

    test('handles various dangerous patterns', () => {
      const patterns = [
        'javascript:alert(1)',
        '<img onerror="alert(1)" src="">',
        'data:text/html,<script>alert(1)</script>',
        'onclick="alert(1)"'
      ];

      patterns.forEach(pattern => {
        const result = validateLabel(pattern);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('validateDays', () => {
    test('validates correct day arrays', () => {
      const result = validateDays([1, 2, 3, 4, 5]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toEqual([1, 2, 3, 4, 5]);
    });

    test('validates weekend days', () => {
      const result = validateDays([0, 6]);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual([0, 6]);
    });

    test('rejects empty arrays', () => {
      const result = validateDays([]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one day must be selected');
    });

    test('rejects invalid day numbers', () => {
      const result = validateDays([7, 8, 9]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('All days must be valid integers between 0 and 6');
    });

    test('rejects negative day numbers', () => {
      const result = validateDays([-1, 1, 2]);
      expect(result.isValid).toBe(false);
    });

    test('removes duplicates and sorts', () => {
      const result = validateDays([3, 1, 3, 2, 1]);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual([1, 2, 3]);
    });

    test('rejects non-array input', () => {
      const result = validateDays('not an array' as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Days must be an array');
    });

    test('rejects non-integer values', () => {
      const result = validateDays([1.5, 2.7, 'a'] as any);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateVoiceMood', () => {
    test('validates correct voice moods', () => {
      const validMoods = [
        'drill-sergeant',
        'sweet-angel',
        'anime-hero',
        'savage-roast',
        'motivational',
        'gentle'
      ];

      validMoods.forEach(mood => {
        const result = validateVoiceMood(mood);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe(mood);
      });
    });

    test('rejects invalid voice moods', () => {
      const result = validateVoiceMood('invalid-mood');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Voice mood must be one of:');
    });

    test('rejects empty strings', () => {
      const result = validateVoiceMood('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Voice mood is required');
    });

    test('trims whitespace', () => {
      const result = validateVoiceMood('  motivational  ');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('motivational');
    });

    test('rejects non-string input', () => {
      const result = validateVoiceMood(123 as any);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateAlarmData', () => {
    const validAlarmData = {
      time: '07:00',
      label: 'Morning Alarm',
      days: [1, 2, 3, 4, 5],
      voiceMood: 'motivational'
    };

    test('validates complete alarm data', () => {
      const result = validateAlarmData(validAlarmData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.sanitizedData).toBeDefined();
    });

    test('returns sanitized data for valid input', () => {
      const result = validateAlarmData({
        ...validAlarmData,
        label: '  My <b>Alarm</b>  ',
        days: [3, 1, 3, 2]
      });
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData?.label).toBe('My Alarm');
      expect(result.sanitizedData?.days).toEqual([1, 2, 3]);
    });

    test('collects errors from all fields', () => {
      const result = validateAlarmData({
        time: '25:00',
        label: 'A',
        days: [],
        voiceMood: 'invalid'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.time).toBeDefined();
      expect(result.errors.label).toBeDefined();
      expect(result.errors.days).toBeDefined();
      expect(result.errors.voiceMood).toBeDefined();
    });

    test('handles partial errors', () => {
      const result = validateAlarmData({
        ...validAlarmData,
        time: '25:00'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.time).toBeDefined();
      expect(result.errors.label).toBeUndefined();
      expect(result.errors.days).toBeUndefined();
      expect(result.errors.voiceMood).toBeUndefined();
    });
  });

  describe('sanitizeTextInput', () => {
    test('removes HTML tags', () => {
      const result = sanitizeTextInput('<p>Hello <b>World</b></p>');
      expect(result).toBe('Hello World');
    });

    test('escapes dangerous characters', () => {
      const result = sanitizeTextInput('Hello & "World" <script>');
      expect(result).toBe('Hello &amp; &quot;World&quot; &lt;script&gt;');
    });

    test('normalizes whitespace', () => {
      const result = sanitizeTextInput('  Hello    World  ');
      expect(result).toBe('Hello World');
    });

    test('limits input length', () => {
      const longInput = 'A'.repeat(1500);
      const result = sanitizeTextInput(longInput);
      expect(result).toHaveLength(1000);
    });

    test('handles non-string input', () => {
      expect(sanitizeTextInput(null as any)).toBe('');
      expect(sanitizeTextInput(undefined as any)).toBe('');
      expect(sanitizeTextInput(123 as any)).toBe('');
    });

    test('handles empty string', () => {
      expect(sanitizeTextInput('')).toBe('');
    });
  });

  describe('validateNumber', () => {
    test('validates valid numbers', () => {
      expect(validateNumber(42).isValid).toBe(true);
      expect(validateNumber('42').isValid).toBe(true);
      expect(validateNumber(0).isValid).toBe(true);
      expect(validateNumber(-10).isValid).toBe(true);
    });

    test('validates numbers with min/max constraints', () => {
      expect(validateNumber(5, 0, 10).isValid).toBe(true);
      expect(validateNumber(0, 0, 10).isValid).toBe(true);
      expect(validateNumber(10, 0, 10).isValid).toBe(true);
    });

    test('rejects numbers outside constraints', () => {
      const result1 = validateNumber(-1, 0, 10);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Must be at least 0');

      const result2 = validateNumber(11, 0, 10);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Must be at most 10');
    });

    test('handles required vs optional', () => {
      expect(validateNumber(null, undefined, undefined, false).isValid).toBe(true);
      expect(validateNumber(null, undefined, undefined, true).isValid).toBe(false);
      expect(validateNumber('', undefined, undefined, true).isValid).toBe(false);
    });

    test('rejects invalid numbers', () => {
      expect(validateNumber('abc').isValid).toBe(false);
      expect(validateNumber('12.34.56').isValid).toBe(false);
      expect(validateNumber(NaN).isValid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    test('validates correct email addresses', () => {
      const emails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];

      emails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe(email.toLowerCase());
      });
    });

    test('rejects invalid email addresses', () => {
      const emails = [
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid.com',
        'invalid@@example.com',
        'invalid@.com',
        'invalid@com.'
      ];

      emails.forEach(email => {
        expect(validateEmail(email).isValid).toBe(false);
      });
    });

    test('rejects overly long emails', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail).isValid).toBe(false);
    });

    test('normalizes email case', () => {
      const result = validateEmail('USER@EXAMPLE.COM');
      expect(result.sanitized).toBe('user@example.com');
    });
  });

  describe('validateUrl', () => {
    test('validates correct URLs', () => {
      const urls = [
        'https://example.com',
        'http://test.org',
        'https://subdomain.example.co.uk/path?query=value',
        'http://localhost:3000'
      ];

      urls.forEach(url => {
        expect(validateUrl(url).isValid).toBe(true);
      });
    });

    test('rejects invalid URLs', () => {
      const urls = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert(1)',
        'data:text/html,<script>',
        'file:///etc/passwd'
      ];

      urls.forEach(url => {
        expect(validateUrl(url).isValid).toBe(false);
      });
    });

    test('rejects URLs with invalid protocols', () => {
      expect(validateUrl('ftp://example.com').isValid).toBe(false);
      expect(validateUrl('file://example.com').isValid).toBe(false);
    });

    test('requires valid domain', () => {
      expect(validateUrl('https://').isValid).toBe(false);
      expect(validateUrl('https://a').isValid).toBe(false);
    });
  });
});