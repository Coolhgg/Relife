// Validation utilities for Smart Alarm App

import SecurityService from '../services/security';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string | number | boolean | number[];
}

export interface AlarmValidationErrors {
  time?: string;
  label?: string;
  days?: string;
  voiceMood?: string;
}

// Time validation
export const validateTime = (time: string): ValidationResult => {
  const errors: string[] = [];

  if (!time || typeof time !== 'string') {
    errors.push('Time is required');
    return { isValid: false, errors };
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time.trim())) {
    errors.push('Time must be in HH:MM format (24-hour)');
  }

  const [hours, minutes] = time.trim().split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    errors.push('Invalid time format');
  } else {
    if (hours < 0 || hours > 23) {
      errors.push('Hours must be between 0 and 23');
    }
    if (minutes < 0 || minutes > 59) {
      errors.push('Minutes must be between 0 and 59');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: time.trim()
  };
};

// Label validation
export const validateLabel = (label: string): ValidationResult => {
  const errors: string[] = [];

  if (!label || typeof label !== 'string') {
    errors.push('Label is required');
    return { isValid: false, errors };
  }

  const trimmedLabel = label.trim();

  if (trimmedLabel.length === 0) {
    errors.push('Label cannot be empty');
  }

  if (trimmedLabel.length > 100) {
    errors.push('Label must be less than 100 characters');
  }

  if (trimmedLabel.length < 2) {
    errors.push('Label must be at least 2 characters long');
  }

  // Use SecurityService for comprehensive sanitization
  const sanitized = SecurityService.sanitizeInput(trimmedLabel, {
    allowBasicFormatting: false,
    maxLength: 100,
    stripEmoji: false
  });

  // Additional check for empty sanitized content
  if (sanitized.length === 0) {
    errors.push('Label contains only invalid characters');
  }

  // Check if sanitization changed the content significantly
  if (sanitized.length < trimmedLabel.length * 0.5) {
    errors.push('Label contains too much invalid content');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};

// Days validation
export const validateDays = (days: number[]): ValidationResult => {
  const errors: string[] = [];

  if (!Array.isArray(days)) {
    errors.push('Days must be an array');
    return { isValid: false, errors };
  }

  if (days.length === 0) {
    errors.push('At least one day must be selected');
  }

  // Check if all values are valid day numbers (0-6, where 0 is Sunday)
  const validDays = days.filter(day =>
    typeof day === 'number' &&
    Number.isInteger(day) &&
    day >= 0 &&
    day <= 6
  );

  if (validDays.length !== days.length) {
    errors.push('All days must be valid integers between 0 and 6');
  }

  // Remove duplicates
  const uniqueDays = Array.from(new Set(validDays)).sort();

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: uniqueDays
  };
};

// Voice mood validation
export const validateVoiceMood = (voiceMood: string): ValidationResult => {
  const errors: string[] = [];

  if (!voiceMood || typeof voiceMood !== 'string') {
    errors.push('Voice mood is required');
    return { isValid: false, errors };
  }

  const validMoods = [
    'drill-sergeant',
    'sweet-angel',
    'anime-hero',
    'savage-roast',
    'motivational',
    'gentle'
  ];

  const trimmedMood = voiceMood.trim();

  if (!validMoods.includes(trimmedMood)) {
    errors.push(`Voice mood must be one of: ${validMoods.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmedMood
  };
};

// Comprehensive alarm validation
export const validateAlarmData = (alarmData: {
  time: string;
  label: string;
  days: number[];
  voiceMood: string;
  [key: string]: any; // Allow additional properties
}): { isValid: boolean; errors: AlarmValidationErrors; sanitizedData?: { time: string; label: string; days: number[]; voiceMood: string; } } => {

  const timeResult = validateTime(alarmData.time);
  const labelResult = validateLabel(alarmData.label);
  const daysResult = validateDays(alarmData.days);
  const voiceMoodResult = validateVoiceMood(alarmData.voiceMood);

  const errors: AlarmValidationErrors = {};

  if (!timeResult.isValid) {
    errors.time = timeResult.errors.join(', ');
  }

  if (!labelResult.isValid) {
    errors.label = labelResult.errors.join(', ');
  }

  if (!daysResult.isValid) {
    errors.days = daysResult.errors.join(', ');
  }

  if (!voiceMoodResult.isValid) {
    errors.voiceMood = voiceMoodResult.errors.join(', ');
  }

  const isValid = Object.keys(errors).length === 0;

  const sanitizedData = isValid ? {
    time: (timeResult.sanitized as string) || alarmData.time,
    label: (labelResult.sanitized as string) || alarmData.label,
    days: (daysResult.sanitized as number[]) || alarmData.days,
    voiceMood: (voiceMoodResult.sanitized as string) || alarmData.voiceMood
  } : undefined;

  return { isValid, errors, sanitizedData };
};

// Text input sanitization using SecurityService
export const sanitizeTextInput = (input: string): string => {
  return SecurityService.sanitizeInput(input, {
    allowBasicFormatting: false,
    maxLength: 1000,
    stripEmoji: false
  });
};

// HTML input sanitization
export const sanitizeHtmlInput = (input: string): string => {
  return SecurityService.sanitizeHtml(input);
};

// Password validation with enhanced security
export const validatePassword = (password: string) => {
  return SecurityService.validatePasswordSecurity(password);
};

// Number validation
export const validateNumber = (
  value: unknown,
  min?: number,
  max?: number,
  required = false
): ValidationResult => {
  const errors: string[] = [];

  if (value === null || value === undefined || value === '') {
    if (required) {
      errors.push('This field is required');
    }
    return { isValid: !required, errors };
  }

  const numValue = Number(value);

  if (isNaN(numValue)) {
    errors.push('Must be a valid number');
    return { isValid: false, errors };
  }

  if (min !== undefined && numValue < min) {
    errors.push(`Must be at least ${min}`);
  }

  if (max !== undefined && numValue > max) {
    errors.push(`Must be at most ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: numValue
  };
};

// Email validation (for future use)
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Enhanced email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(trimmedEmail)) {
    errors.push('Please enter a valid email address');
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /[<>"'&]/,
    /javascript:/i,
    /data:/i,
    /vbscript:/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(trimmedEmail))) {
    errors.push('Email contains invalid characters');
  }

  if (trimmedEmail.length > 254) {
    errors.push('Email address is too long');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmedEmail
  };
};

// URL validation (for future use)
export const validateUrl = (url: string): ValidationResult => {
  const errors: string[] = [];

  if (!url || typeof url !== 'string') {
    errors.push('URL is required');
    return { isValid: false, errors };
  }

  const trimmedUrl = url.trim();

  try {
    const urlObj = new URL(trimmedUrl);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('URL must use http or https protocol');
    }

    // Additional security checks
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(trimmedUrl))) {
      errors.push('URL contains potentially unsafe protocol');
    }

    // Basic domain validation
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      errors.push('URL must have a valid domain');
    }

  } catch {
    errors.push('Please enter a valid URL');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmedUrl
  };
};