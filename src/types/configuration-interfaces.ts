/**
 * Typed Configuration Interfaces
 * Specific interfaces to replace Record<string, any> objects
 */

// =============================================================================
// CONVERTKIT CONFIGURATION
// =============================================================================

export interface ConvertKitAutomationParameters {
  // Sequence parameters
  sequence_id?: number;
  delay_days?: number;
  
  // Tag parameters
  tag_id?: number;
  tag_name?: string;
  
  // Email parameters
  email_template_id?: number;
  subject?: string;
  content?: string;
  
  // Field update parameters
  field_name?: string;
  field_value?: string | number | boolean;
  
  // Conditional parameters
  condition_type?: 'has_tag' | 'field_equals' | 'date_based' | 'engagement_based';
  condition_value?: any;
  
  // Custom parameters
  webhook_url?: string;
  custom_data?: {
    [key: string]: string | number | boolean;
  };
}

// =============================================================================
// EMOTIONAL MESSAGING CONFIGURATION
// =============================================================================

export interface EmotionalMessageVariables {
  // User information
  userName?: string;
  firstName?: string;
  lastName?: string;
  
  // Time-based variables
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  currentTime?: string; // HH:MM format
  dayOfWeek?: string;
  
  // Streak and achievement data
  currentStreak?: number;
  longestStreak?: number;
  totalAlarms?: number;
  successRate?: number;
  
  // Motivational content
  achievementType?: string;
  goalProgress?: number;
  nextMilestone?: string;
  
  // Contextual information
  weatherCondition?: string;
  location?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  
  // Custom variables for specific contexts
  customMessage?: string;
  urgencyLevel?: 'low' | 'medium' | 'high';
  encouragementType?: 'gentle' | 'firm' | 'playful' | 'serious';
}

// =============================================================================
// PERFORMANCE MONITORING METADATA
// =============================================================================

export interface PerformanceEventMetadata {
  // User context
  userId?: string;
  sessionId?: string;
  deviceId?: string;
  
  // Technical context
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  connectionType?: string;
  memoryUsage?: number;
  batteryLevel?: number;
  
  // Application context
  appVersion?: string;
  buildVersion?: string;
  featureFlags?: string[];
  experimentGroups?: string[];
  
  // Performance context
  renderTime?: number;
  loadTime?: number;
  interactionTime?: number;
  errorCount?: number;
  warningCount?: number;
  
  // Business context
  userTier?: string;
  subscriptionStatus?: string;
  trialDaysRemaining?: number;
  
  // Custom tracking
  customMetrics?: {
    [metricName: string]: number | string | boolean;
  };
}

// =============================================================================
// ANALYTICS PROPERTIES
// =============================================================================

export interface AnalyticsEventProperties {
  // Event classification
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  
  // User properties
  userId?: string;
  userTier?: 'free' | 'basic' | 'premium' | 'pro' | 'ultimate';
  signupDate?: string;
  lastActiveDate?: string;
  
  // Session properties
  sessionId?: string;
  sessionDuration?: number;
  pageViews?: number;
  isFirstSession?: boolean;
  
  // Device properties
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  operatingSystem?: string;
  browserName?: string;
  browserVersion?: string;
  screenResolution?: string;
  
  // Location properties
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  
  // Marketing properties
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  
  // Feature-specific properties
  featureUsed?: string;
  featureVersion?: string;
  experimentVariant?: string;
  
  // Alarm-specific properties (for alarm events)
  alarmId?: string;
  alarmType?: string;
  alarmDifficulty?: string;
  snoozeCount?: number;
  dismissalTime?: number;
  
  // Business metrics
  revenue?: number;
  conversionValue?: number;
  subscriptionTier?: string;
  planType?: 'monthly' | 'yearly' | 'lifetime';
  
  // Custom properties
  customDimensions?: {
    [dimensionName: string]: string | number | boolean;
  };
}

// =============================================================================
// FORM CONFIGURATION
// =============================================================================

export interface FormFieldData {
  // Basic form fields
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  website?: string;
  
  // Address fields
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  
  // Preference fields
  preferences?: string[];
  interests?: string[];
  communicationFrequency?: 'daily' | 'weekly' | 'monthly' | 'never';
  
  // Custom fields with validation
  customFields?: {
    [fieldName: string]: {
      value: string | number | boolean;
      type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
      validation?: RegExp | ((value: any) => boolean);
    };
  };
}

// =============================================================================
// FEATURE TRACKING CONTEXT
// =============================================================================

export interface FeatureTrackingContext {
  // Feature identification
  featureId: string;
  featureName: string;
  featureCategory?: string;
  featureVersion?: string;
  
  // User context
  userId?: string;
  userTier?: string;
  subscriptionStatus?: string;
  
  // Usage context
  usageCount?: number;
  firstUsedAt?: Date;
  lastUsedAt?: Date;
  
  // A/B testing context
  experimentId?: string;
  experimentVariant?: string;
  experimentStartDate?: Date;
  
  // Performance context
  loadTime?: number;
  renderTime?: number;
  errorCount?: number;
  
  // Business context
  hasAccess?: boolean;
  isPremiumFeature?: boolean;
  upgradePromptShown?: boolean;
  
  // Custom context
  customAttributes?: {
    [attributeName: string]: string | number | boolean | Date;
  };
}

// =============================================================================
// NOTIFICATION CONFIGURATION
// =============================================================================

export interface NotificationExtrasData {
  // Basic notification data
  title?: string;
  body?: string;
  icon?: string;
  image?: string;
  
  // Action configuration
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  
  // Behavior configuration
  silent?: boolean;
  vibrate?: number[];
  sound?: string;
  
  // Deep linking
  deepLink?: string;
  url?: string;
  
  // Scheduling
  scheduledAt?: Date;
  expiresAt?: Date;
  
  // Categorization
  category?: string;
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
  
  // Tracking
  trackingId?: string;
  campaignId?: string;
  userId?: string;
  
  // Custom data
  customData?: {
    [key: string]: string | number | boolean;
  };
}

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

export interface CacheConfiguration {
  // TTL settings
  ttl?: number; // seconds
  maxAge?: number; // seconds
  
  // Size limits
  maxSize?: number; // bytes
  maxEntries?: number;
  
  // Eviction policy
  evictionPolicy?: 'lru' | 'lfu' | 'fifo' | 'ttl';
  
  // Serialization
  serialize?: boolean;
  compression?: boolean;
  
  // Persistence
  persistent?: boolean;
  storageLocation?: string;
  
  // Validation
  validator?: (value: any) => boolean;
  
  // Custom metadata
  tags?: string[];
  priority?: number;
  
  // Callback configuration
  onHit?: (key: string, value: any) => void;
  onMiss?: (key: string) => void;
  onSet?: (key: string, value: any) => void;
  onDelete?: (key: string) => void;
}

// =============================================================================
// VALIDATION AND UTILITY FUNCTIONS
// =============================================================================

// Type guards
export const isEmotionalMessageVariables = (value: any): value is EmotionalMessageVariables => {
  return typeof value === 'object' && value !== null;
};

export const isAnalyticsEventProperties = (value: any): value is AnalyticsEventProperties => {
  return typeof value === 'object' && value !== null;
};

export const isPerformanceEventMetadata = (value: any): value is PerformanceEventMetadata => {
  return typeof value === 'object' && value !== null;
};

// Default configurations
export const DEFAULT_CACHE_CONFIG: CacheConfiguration = {
  ttl: 3600, // 1 hour
  maxEntries: 1000,
  evictionPolicy: 'lru',
  serialize: false,
  persistent: false,
};

export const DEFAULT_PERFORMANCE_METADATA: PerformanceEventMetadata = {
  customMetrics: {},
};

// Validation helpers
export const validateFormFieldData = (data: FormFieldData): boolean => {
  // Email validation if provided
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return false;
  }
  
  // Phone validation if provided
  if (data.phone && !/^\+?[\d\s\-\(\)]+$/.test(data.phone)) {
    return false;
  }
  
  return true;
};

export const sanitizeCustomFields = (customFields: any): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  if (typeof customFields === 'object' && customFields !== null) {
    for (const [key, value] of Object.entries(customFields)) {
      // Only allow safe types
      if (['string', 'number', 'boolean'].includes(typeof value)) {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
};