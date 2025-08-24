/**
 * API Response Type Definitions
 * Comprehensive interfaces for all API responses to replace Promise<any>
 */

// =============================================================================
// BASE API RESPONSE STRUCTURES
// =============================================================================

export interface BaseApiResponse {
  success: boolean;
  timestamp: string;
  requestId?: string;
}

export interface SuccessResponse<T = unknown> extends BaseApiResponse {
  success: true;
  data: T;
}

export interface ErrorResponse extends BaseApiResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// =============================================================================
// ACTIVECAMPAIGN API RESPONSES
// =============================================================================

// Contact List Subscription Response
export interface ContactListSubscription {
  id: string;
  status: number; // 1 = active, 2 = unsubscribed
  list: string; // list ID
  contact: string; // contact ID
  sourceid?: string;
  automation?: string;
  seriesid?: string;
  formid?: string;
  createdTimestamp?: string;
  updatedTimestamp?: string;
}

export interface SubscribeContactResponse {
  contactList: ContactListSubscription;
}

// Contact Automation Response
export interface ContactAutomation {
  id: string;
  contact: string; // contact ID
  automation: string; // automation ID
  status: 'active' | 'completed' | 'stopped';
  addDate?: string;
  remDate?: string;
  lastLogDate?: string;
  completedElements?: number;
  totalElements?: number;
}

export interface AddContactToAutomationResponse {
  contactAutomation: ContactAutomation;
}

// Contact Tag Response
export interface ContactTag {
  id: string;
  contact: string; // contact ID
  tag: string; // tag ID
  createdTimestamp?: string;
  updatedTimestamp?: string;
}

export interface AddTagToContactResponse {
  contactTag: ContactTag;
}

// Campaign Statistics Response
export interface CampaignStats {
  id: string;
  campaignId: string;
  status: 'active' | 'draft' | 'sent' | 'scheduled';
  
  // Delivery metrics
  sends: number;
  deliveries: number;
  bounces: number;
  softBounces: number;
  hardBounces: number;
  
  // Engagement metrics
  opens: number;
  uniqueOpens: number;
  openRate: number; // percentage
  clicks: number;
  uniqueClicks: number;
  clickRate: number; // percentage
  clickThroughRate: number; // percentage
  
  // Response metrics
  unsubscribes: number;
  unsubscribeRate: number; // percentage
  complaints: number;
  complaintRate: number; // percentage
  
  // Revenue metrics (if applicable)
  revenue?: number;
  revenuePerEmail?: number;
  averageOrderValue?: number;
  
  // Timing
  sentAt?: string;
  lastEngagementAt?: string;
}

// Automation Statistics Response
export interface AutomationStats {
  id: string;
  automationId: string;
  name: string;
  status: 'active' | 'inactive' | 'draft';
  
  // Participation metrics
  totalContacts: number;
  activeContacts: number;
  completedContacts: number;
  stoppedContacts: number;
  
  // Performance metrics
  totalSends: number;
  totalOpens: number;
  totalClicks: number;
  averageEngagementRate: number;
  
  // Conversion metrics
  conversionRate: number; // percentage
  totalRevenue?: number;
  averageRevenuePerContact?: number;
  
  // Timing
  createdAt: string;
  lastTriggeredAt?: string;
  averageCompletionTime?: number; // hours
}

// =============================================================================
// CONVERTKIT API RESPONSES  
// =============================================================================

// ConvertKit Account Response
export interface ConvertKitAccount {
  id: number;
  name: string;
  email: string;
  timezone: string;
  currency: string;
  
  // Subscription details
  plan: {
    name: string;
    type: 'free' | 'creator' | 'creator_pro' | 'enterprise';
    subscriberLimit: number;
    currentSubscribers: number;
  };
  
  // Account status
  status: 'active' | 'suspended' | 'trial';
  trialEndsAt?: string;
  billingInterval?: 'monthly' | 'yearly';
  
  // Features
  features: {
    automations: boolean;
    integrations: boolean;
    advancedReporting: boolean;
    deliverabilityReporting: boolean;
    prioritySupport: boolean;
  };
  
  // Settings
  settings: {
    doubleOptIn: boolean;
    unsubscribeRedirectUrl?: string;
    confirmationEmailSubject?: string;
    fromName: string;
    fromEmail: string;
  };
}

// Broadcast Statistics Response
export interface BroadcastStats {
  id: number;
  broadcastId: number;
  subject: string;
  
  // Delivery metrics
  recipients: number;
  deliveries: number;
  bounces: number;
  
  // Engagement metrics
  opens: number;
  uniqueOpens: number;
  openRate: number; // percentage
  clicks: number;
  uniqueClicks: number;
  clickRate: number; // percentage
  
  // Response metrics
  unsubscribes: number;
  unsubscribeRate: number; // percentage
  
  // Revenue metrics
  revenue?: number;
  purchases?: number;
  
  // Timing
  sentAt: string;
  statsCalculatedAt: string;
}

// Growth Statistics Response
export interface GrowthStats {
  timeframe: '1d' | '7d' | '30d';
  period: {
    start: string;
    end: string;
  };
  
  // Subscriber metrics
  subscriberGrowth: {
    netGrowth: number;
    newSubscribers: number;
    unsubscribes: number;
    growthRate: number; // percentage
  };
  
  // Engagement metrics
  engagementStats: {
    averageOpenRate: number;
    averageClickRate: number;
    totalEmails: number;
    totalOpens: number;
    totalClicks: number;
  };
  
  // Revenue metrics (if applicable)
  revenueStats?: {
    totalRevenue: number;
    averageRevenuePerSubscriber: number;
    conversionRate: number;
    totalPurchases: number;
  };
  
  // Trend data
  dailyBreakdown: {
    date: string;
    newSubscribers: number;
    unsubscribes: number;
    netGrowth: number;
    revenue?: number;
  }[];
}

// =============================================================================
// AI SERVICE RESPONSES
// =============================================================================

// User Segmentation Response
export interface UserFeatures {
  demographics: {
    ageGroup: string;
    location: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    timezone: string;
  };
  
  behavioral: {
    averageSessionDuration: number; // minutes
    sessionsPerWeek: number;
    preferredEmailTime: string; // HH:MM
    engagementScore: number; // 0-100
    contentPreferences: string[];
  };
  
  engagement: {
    emailOpenRate: number; // percentage
    emailClickRate: number; // percentage
    socialMediaActivity: number; // 0-100 score
    purchaseHistory: {
      totalPurchases: number;
      averageOrderValue: number;
      lastPurchaseDate?: string;
    };
  };
  
  preferences: {
    communicationFrequency: 'daily' | 'weekly' | 'monthly';
    contentTypes: string[];
    channels: ('email' | 'sms' | 'push' | 'social')[];
  };
}

export interface EngagementMetrics {
  overall: {
    score: number; // 0-100
    trend: 'increasing' | 'decreasing' | 'stable';
    lastUpdated: string;
  };
  
  channels: {
    email: {
      openRate: number;
      clickRate: number;
      frequency: number; // emails per week
    };
    website: {
      averageSessionDuration: number;
      pagesPerSession: number;
      bounceRate: number;
    };
    social: {
      followsCompany: boolean;
      sharesContent: boolean;
      engagementRate: number;
    };
  };
  
  content: {
    preferredTopics: string[];
    avgTimeOnContent: number; // seconds
    sharingBehavior: 'high' | 'medium' | 'low';
  };
}

// =============================================================================
// EXTERNAL SERVICE RESPONSES
// =============================================================================

// ConvertKit Field Definitions
export interface ConvertKitCustomFields {
  firstName?: string;
  lastName?: string;
  company?: string;
  website?: string;
  phone?: string;
  birthday?: string; // YYYY-MM-DD
  location?: string;
  
  // Custom fields (dynamic)
  [customField: string]: string | number | boolean | undefined;
}

// Mailchimp Merge Fields
export interface MailchimpMergeFields {
  FNAME?: string;
  LNAME?: string;
  EMAIL: string;
  PHONE?: string;
  BIRTHDAY?: string; // MM/DD
  ADDRESS?: {
    addr1?: string;
    addr2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  
  // Custom merge fields (dynamic)
  [mergeField: string]: any;
}

// =============================================================================
// MOCK/TEST SERVICE RESPONSES
// =============================================================================

// Generic test service response
export interface TestServiceResponse<T = any> {
  mockData: T;
  executionTime: number; // milliseconds
  requestId: string;
  timestamp: string;
}

// Notification extras for testing
export interface NotificationExtras {
  alarmId?: string;
  userId?: string;
  type?: 'alarm' | 'reminder' | 'achievement' | 'social';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  deepLink?: string;
  imageUrl?: string;
  actionButtons?: {
    text: string;
    action: string;
    destructive?: boolean;
  }[];
}

// Cache service responses
export interface CacheGetResponse<T = any> {
  value: T | null;
  exists: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export interface CacheSetResponse {
  success: boolean;
  key: string;
  expiresAt?: Date;
}

// =============================================================================
// PERFORMANCE AND ANALYTICS RESPONSES
// =============================================================================

// Performance metadata
export interface PerformanceMetadata {
  executionTime: number; // milliseconds
  memoryUsage: number; // bytes
  cpuUsage: number; // percentage
  requestSize: number; // bytes
  responseSize: number; // bytes
  cacheHit: boolean;
  dbQueryCount: number;
  apiCallCount: number;
  timestamp: string;
}

// Analytics metadata
export interface AnalyticsMetadata {
  sessionId: string;
  userId?: string;
  deviceId: string;
  userAgent: string;
  ipAddress?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  customProperties: Record<string, any>;
  timestamp: string;
}

// Feature tracking context
export interface FeatureContext {
  featureId: string;
  version: string;
  userId?: string;
  sessionId: string;
  
  // Feature state
  enabled: boolean;
  configuration: Record<string, any>;
  
  // Usage tracking
  usageCount: number;
  lastUsed?: string;
  
  // A/B testing
  experimentGroup?: string;
  
  // Performance
  loadTime: number;
  errorCount: number;
}

// =============================================================================
// UTILITY TYPES AND HELPERS
// =============================================================================

// Helper for paginated responses
export interface PaginatedApiResponse<T> extends BaseApiResponse {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Helper for batch operation responses
export interface BatchOperationResponse<T> {
  results: {
    success: T[];
    failed: {
      item: any;
      error: string;
    }[];
  };
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Type guard helpers
export const isSuccessResponse = <T>(response: ApiResponse<T>): response is SuccessResponse<T> => {
  return response.success === true;
};

export const isErrorResponse = (response: ApiResponse): response is ErrorResponse => {
  return response.success === false;
};

// Response transformation helpers
export const createSuccessResponse = <T>(data: T): SuccessResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

export const createErrorResponse = (code: string, message: string, details?: Record<string, any>): ErrorResponse => ({
  success: false,
  error: { code, message, details },
  timestamp: new Date().toISOString(),
});

// =============================================================================
// EXPORT NAMESPACES FOR ORGANIZED IMPORTS
// =============================================================================

export namespace ActiveCampaign {
  export type SubscribeResponse = ApiResponse<SubscribeContactResponse>;
  export type AutomationResponse = ApiResponse<AddContactToAutomationResponse>;
  export type TagResponse = ApiResponse<AddTagToContactResponse>;
  export type CampaignStatsResponse = ApiResponse<CampaignStats>;
  export type AutomationStatsResponse = ApiResponse<AutomationStats>;
}

export namespace ConvertKit {
  export type AccountResponse = ApiResponse<ConvertKitAccount>;
  export type BroadcastStatsResponse = ApiResponse<BroadcastStats>;
  export type GrowthStatsResponse = ApiResponse<GrowthStats>;
  export type CustomFields = ConvertKitCustomFields;
}

export namespace AI {
  export type UserFeaturesResponse = ApiResponse<UserFeatures>;
  export type EngagementResponse = ApiResponse<EngagementMetrics>;
}

export namespace Testing {
  export type MockResponse<T> = ApiResponse<TestServiceResponse<T>>;
  export type NotificationResponse = ApiResponse<NotificationExtras>;
  export type CacheResponse<T> = ApiResponse<CacheGetResponse<T>>;
}