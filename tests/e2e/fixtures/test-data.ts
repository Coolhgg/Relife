export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export interface TestAlarm {
  time: string;
  label: string;
  sound?: string;
  volume?: string;
  days?: string[];
  vibrate?: boolean;
  voiceMood?: string;
}

export class TestData {
  static readonly USERS = {
    VALID_USER: {
      email: 'test.user@example.com',
      password: 'TestPassword123!',
      name: 'Test User'
    },
    ADMIN_USER: {
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      name: 'Admin User'
    },
    PREMIUM_USER: {
      email: 'premium@example.com',
      password: 'PremiumPassword123!',
      name: 'Premium User'
    }
  } as const;

  static readonly INVALID_USERS = {
    INVALID_EMAIL: {
      email: 'invalid-email',
      password: 'ValidPassword123!'
    },
    WEAK_PASSWORD: {
      email: 'test@example.com',
      password: '123'
    },
    EMPTY_FIELDS: {
      email: '',
      password: ''
    }
  } as const;

  static readonly ALARMS = {
    BASIC_ALARM: {
      time: '07:00',
      label: 'Morning Alarm'
    },
    WEEKEND_ALARM: {
      time: '09:00',
      label: 'Weekend Sleep-in',
      days: ['Saturday', 'Sunday']
    },
    WORK_ALARM: {
      time: '06:30',
      label: 'Work Day',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      sound: 'gentle-wake',
      volume: '70',
      vibrate: true
    },
    ADVANCED_ALARM: {
      time: '07:30',
      label: 'Smart Morning Alarm',
      days: ['Monday', 'Wednesday', 'Friday'],
      sound: 'nature-sounds',
      volume: '80',
      vibrate: true,
      voiceMood: 'energetic'
    },
    QUICK_NAP: {
      time: '14:30',
      label: 'Power Nap',
      sound: 'soft-chime',
      volume: '50'
    }
  } as const;

  static readonly SETTINGS = {
    THEMES: ['light', 'dark', 'auto', 'high-contrast'],
    LANGUAGES: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'hi'],
    SOUNDS: ['default', 'gentle-wake', 'nature-sounds', 'classical', 'electronic'],
    VOICE_MOODS: ['gentle', 'energetic', 'professional', 'friendly', 'motivational'],
    TIME_FORMATS: ['12h', '24h'],
    VOLUME_LEVELS: ['0', '25', '50', '75', '100']
  } as const;

  static readonly API_ENDPOINTS = {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    ALARMS: '/api/alarms',
    SETTINGS: '/api/settings',
    USER_PROFILE: '/api/user/profile'
  } as const;

  static readonly ERROR_MESSAGES = {
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_REQUIRED: 'Email is required',
    PASSWORD_REQUIRED: 'Password is required',
    WEAK_PASSWORD: 'Password must be at least 8 characters',
    EMAIL_FORMAT: 'Please enter a valid email address',
    PASSWORD_MISMATCH: 'Passwords do not match',
    ACCOUNT_NOT_FOUND: 'Account not found',
    NETWORK_ERROR: 'Network error occurred'
  } as const;

  static readonly SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Successfully logged in',
    SIGNUP_SUCCESS: 'Account created successfully',
    ALARM_CREATED: 'Alarm created successfully',
    ALARM_UPDATED: 'Alarm updated successfully',
    ALARM_DELETED: 'Alarm deleted successfully',
    SETTINGS_SAVED: 'Settings saved successfully'
  } as const;

  static readonly SELECTORS = {
    // Common UI elements
    LOADING_SPINNER: '[data-testid="loading-spinner"]',
    ERROR_MESSAGE: '[role="alert"], .error-message, [data-testid*="error"]',
    SUCCESS_MESSAGE: '.success-message, [data-testid*="success"]',
    TOAST_NOTIFICATION: '[data-sonner-toast]',
    MODAL_DIALOG: '[role="dialog"]',
    DROPDOWN_MENU: '[role="menu"]',
    
    // Navigation
    NAV_DASHBOARD: '[data-testid="nav-dashboard"]',
    NAV_ALARMS: '[data-testid="nav-alarms"]',
    NAV_SETTINGS: '[data-testid="nav-settings"]',
    NAV_PROFILE: '[data-testid="nav-profile"]',
    
    // Buttons
    SAVE_BUTTON: 'button:has-text("Save"), [data-testid*="save"]',
    CANCEL_BUTTON: 'button:has-text("Cancel"), [data-testid*="cancel"]',
    DELETE_BUTTON: 'button:has-text("Delete"), [data-testid*="delete"]',
    ADD_BUTTON: 'button:has-text("Add"), [data-testid*="add"]'
  } as const;

  // Helper methods for generating test data
  static generateRandomUser(): TestUser {
    const timestamp = Date.now();
    return {
      email: `test.user.${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: `Test User ${timestamp}`
    };
  }

  static generateRandomAlarm(): TestAlarm {
    const hours = Math.floor(Math.random() * 24).toString().padStart(2, '0');
    const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');
    const timestamp = Date.now();
    
    return {
      time: `${hours}:${minutes}`,
      label: `Test Alarm ${timestamp}`,
      sound: this.SETTINGS.SOUNDS[Math.floor(Math.random() * this.SETTINGS.SOUNDS.length)],
      volume: this.SETTINGS.VOLUME_LEVELS[Math.floor(Math.random() * this.SETTINGS.VOLUME_LEVELS.length)]
    };
  }

  static getFutureTime(minutesFromNow: number = 5): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutesFromNow);
    return now.toTimeString().slice(0, 5);
  }

  static getPastTime(minutesAgo: number = 5): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - minutesAgo);
    return now.toTimeString().slice(0, 5);
  }

  static getRandomDays(count: number = 3): string[] {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shuffled = days.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  static getWorkDays(): string[] {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  }

  static getWeekendDays(): string[] {
    return ['Saturday', 'Sunday'];
  }

  static getAllDays(): string[] {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  }
}

// Mock responses for API testing
export const MockResponses = {
  LOGIN_SUCCESS: {
    success: true,
    user: {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      premium: false
    },
    token: 'mock-jwt-token'
  },

  ALARMS_LIST: {
    success: true,
    alarms: [
      {
        id: '1',
        time: '07:00',
        label: 'Morning Alarm',
        enabled: true,
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      {
        id: '2',
        time: '09:00',
        label: 'Weekend Alarm',
        enabled: false,
        days: ['Saturday', 'Sunday']
      }
    ]
  },

  USER_SETTINGS: {
    success: true,
    settings: {
      theme: 'light',
      language: 'en',
      timeFormat: '12h',
      defaultSound: 'gentle-wake',
      volume: '75',
      vibrate: true,
      pushNotifications: true
    }
  },

  ERROR_RESPONSE: {
    success: false,
    error: 'Something went wrong',
    message: 'Please try again later'
  }
};