// Email Campaign Types and Interfaces for Relife Application
// Integrates persona-driven email marketing with the main app

export type PersonaType =
  | "struggling_sam" // Free-focused users
  | "busy_ben" // Efficiency-driven professionals
  | "professional_paula" // Feature-rich seekers
  | "enterprise_emma" // Team-oriented decision makers
  | "student_sarah" // Budget-conscious students
  | "lifetime_larry"; // One-time payment preferrers

export interface PersonaProfile {
  id: PersonaType;
  displayName: string;
  description: string;
  primaryColor: string;
  messagingTone:
    | "supportive"
    | "efficient"
    | "sophisticated"
    | "business_focused"
    | "casual"
    | "value_focused";
  ctaStyle:
    | "friendly"
    | "urgent"
    | "professional"
    | "corporate"
    | "youthful"
    | "exclusive";
  targetSubscriptionTier:
    | "free"
    | "basic"
    | "premium"
    | "pro"
    | "student"
    | "lifetime";
  conversionGoals: string[];
  preferredChannels: ("email" | "push" | "in_app" | "sms")[];
}

export interface PersonaDetectionResult {
  persona: PersonaType;
  confidence: number; // 0-1 scale
  factors: PersonaDetectionFactor[];
  updatedAt: Date;
  previousPersona?: PersonaType;
}

export interface PersonaDetectionFactor {
  factor: string;
  weight: number;
  value: string | number | boolean;
  influence: number; // How much this factor influenced the decision
}

// Email Campaign Configuration
export interface EmailCampaign {
  id: string;
  name: string;
  persona: PersonaType;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  trigger: CampaignTrigger;
  sequences: EmailSequence[];
  settings: CampaignSettings;
  metrics: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CampaignTrigger {
  type:
    | "user_signup"
    | "persona_detected"
    | "trial_started"
    | "subscription_cancelled"
    | "custom_event";
  conditions: TriggerCondition[];
  delay: number; // minutes to wait before triggering
  personaConfidenceThreshold?: number; // minimum confidence needed for persona triggers
}

export interface TriggerCondition {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "greater_than"
    | "less_than"
    | "contains"
    | "not_contains";
  value: string | number | boolean;
}

export interface EmailSequence {
  id: string;
  campaignId: string;
  order: number;
  name: string;
  subject: string;
  template: EmailTemplate;
  delayHours: number; // Hours after previous email or trigger
  conditions?: SequenceCondition[];
  targetAction: string;
  successMetrics: {
    openRateTarget: number;
    clickRateTarget: number;
    conversionRateTarget?: number;
  };
  abTestConfig?: ABTestConfig;
  isActive: boolean;
}

export interface SequenceCondition {
  type:
    | "user_action"
    | "time_based"
    | "subscription_status"
    | "engagement_level";
  condition: string;
  value: string | number | boolean;
  action: "send" | "skip" | "delay" | "branch";
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: TemplateVariable[];
  personalization: PersonalizationRule[];
  trackingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  key: string;
  name: string;
  type: "text" | "number" | "date" | "boolean" | "url";
  defaultValue?: string;
  required: boolean;
  description?: string;
}

export interface PersonalizationRule {
  condition: string;
  content: PersonalizedContent;
  priority: number;
}

export interface PersonalizedContent {
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  ctaText?: string;
  ctaUrl?: string;
}

// A/B Testing Configuration
export interface ABTestConfig {
  id: string;
  name: string;
  type: "subject_line" | "content" | "cta_button" | "send_time" | "sender_name";
  variants: ABTestVariant[];
  trafficSplit: number[]; // Percentage split for each variant
  winnerMetric: "open_rate" | "click_rate" | "conversion_rate";
  confidenceLevel: number; // 0.90, 0.95, 0.99
  minSampleSize: number;
  maxDuration: number; // hours
  status: "draft" | "running" | "completed" | "cancelled";
  winner?: string; // Variant ID
  results?: ABTestResults;
}

export interface ABTestVariant {
  id: string;
  name: string;
  content: Record<string, string>; // Field -> Value mapping
  trafficPercentage: number;
}

export interface ABTestResults {
  variants: Record<string, VariantResults>;
  statisticalSignificance: number;
  completedAt: Date;
  winner: string;
  improvement: number; // Percentage improvement of winner
}

export interface VariantResults {
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

// Campaign Settings
export interface CampaignSettings {
  timezone: string;
  sendTimeOptimization: boolean;
  frequencyCapping: FrequencyCapping;
  unsubscribeHandling: UnsubscribeSettings;
  complianceSettings: ComplianceSettings;
  tracking: TrackingSettings;
}

export interface FrequencyCapping {
  enabled: boolean;
  maxEmailsPerDay: number;
  maxEmailsPerWeek: number;
  respectQuietHours: boolean;
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string; // HH:MM format
}

export interface UnsubscribeSettings {
  showUnsubscribeLink: boolean;
  allowPreferenceCenter: boolean;
  autoRemoveUnsubscribed: boolean;
  unsubscribeRedirectUrl?: string;
}

export interface ComplianceSettings {
  requireDoubleOptIn: boolean;
  gdprCompliant: boolean;
  ccpaCompliant: boolean;
  includePhysicalAddress: boolean;
  companyName: string;
  companyAddress?: string;
}

export interface TrackingSettings {
  enableOpenTracking: boolean;
  enableClickTracking: boolean;
  enableConversionTracking: boolean;
  trackingDomain?: string;
  utmParameters: Record<string, string>;
  customTrackingParameters?: Record<string, string>;
}

// Campaign Metrics and Analytics
export interface CampaignMetrics {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  totalUnsubscribed: number;
  totalBounced: number;
  totalSpamComplaints: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  unsubscribeRate: number;
  bounceRate: number;
  spamRate: number;
  revenueAttributed: number;
  lastUpdated: Date;
}

export interface EmailEvent {
  id: string;
  userId: string;
  campaignId: string;
  sequenceId: string;
  emailId: string;
  eventType:
    | "sent"
    | "delivered"
    | "opened"
    | "clicked"
    | "converted"
    | "bounced"
    | "unsubscribed"
    | "spam_complaint";
  timestamp: Date;
  metadata?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export interface CampaignPerformanceReport {
  campaignId: string;
  persona: PersonaType;
  dateRange: {
    start: Date;
    end: Date;
  };
  overview: CampaignMetrics;
  sequencePerformance: SequencePerformance[];
  cohortAnalysis: CohortData[];
  topPerformers: TopPerformer[];
  recommendations: PerformanceRecommendation[];
  benchmarkComparison: BenchmarkComparison;
}

export interface SequencePerformance {
  sequenceId: string;
  sequenceName: string;
  order: number;
  metrics: CampaignMetrics;
  trends: MetricTrend[];
  abTestResults?: ABTestResults;
}

export interface CohortData {
  cohortDate: Date;
  cohortSize: number;
  metrics: Record<string, number>; // Day/Week/Month -> Metric
}

export interface TopPerformer {
  type: "sequence" | "subject_line" | "cta" | "send_time";
  item: string;
  metric: string;
  value: number;
  improvement: number;
}

export interface PerformanceRecommendation {
  type: "optimization" | "warning" | "opportunity";
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  actionItems: string[];
}

export interface BenchmarkComparison {
  industry: string;
  personaBenchmarks: Record<PersonaType, PersonaBenchmark>;
  overallPerformance:
    | "below_average"
    | "average"
    | "above_average"
    | "excellent";
}

export interface PersonaBenchmark {
  openRate: { current: number; benchmark: number; percentile: number };
  clickRate: { current: number; benchmark: number; percentile: number };
  conversionRate: { current: number; benchmark: number; percentile: number };
}

export interface MetricTrend {
  metric: string;
  values: number[];
  dates: Date[];
  trend: "increasing" | "decreasing" | "stable";
  changePercentage: number;
}

// User Email Preferences
export interface EmailPreferences {
  userId: string;
  subscribed: boolean;
  preferences: {
    marketing: boolean;
    product_updates: boolean;
    feature_announcements: boolean;
    educational_content: boolean;
    promotional_offers: boolean;
    account_notifications: boolean;
  };
  frequency: "immediate" | "daily" | "weekly" | "monthly";
  optedOutPersonas: PersonaType[];
  unsubscribedAt?: Date;
  lastUpdated: Date;
}

export interface EmailSubscription {
  id: string;
  userId: string;
  email: string;
  status: "active" | "unsubscribed" | "bounced" | "spam";
  source: "signup" | "import" | "api" | "manual";
  confirmedAt?: Date;
  tags: string[];
  customFields: Record<string, any>;
  persona?: PersonaType;
  personaConfidence?: number;
  preferences: EmailPreferences;
  createdAt: Date;
  updatedAt: Date;
}

// Email Campaign API Interfaces
export interface SendEmailRequest {
  to: string | string[];
  templateId: string;
  variables?: Record<string, any>;
  campaignId?: string;
  sequenceId?: string;
  scheduledAt?: Date;
  tags?: string[];
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  scheduledAt?: Date;
}

export interface EmailCampaignStats {
  campaignId: string;
  stats: CampaignMetrics;
  sequences: SequencePerformance[];
  recentEvents: EmailEvent[];
}

// Integration with existing Relife types
export interface UserWithEmailData
  extends Omit<import("./index").User, "preferences"> {
  emailSubscription?: EmailSubscription;
  detectedPersona?: PersonaDetectionResult;
  emailPreferences: EmailPreferences;
  campaignHistory: UserCampaignHistory[];
}

export interface UserCampaignHistory {
  campaignId: string;
  campaignName: string;
  persona: PersonaType;
  startedAt: Date;
  completedAt?: Date;
  currentSequence?: number;
  totalSequences: number;
  engagementScore: number;
  conversionEvents: ConversionEvent[];
}

export interface ConversionEvent {
  type:
    | "trial_started"
    | "subscription_created"
    | "upgrade"
    | "feature_used"
    | "custom";
  timestamp: Date;
  value?: number;
  metadata?: Record<string, any>;
}

// Persona Detection Service Types
export interface PersonaDetectionConfig {
  enabled: boolean;
  confidenceThreshold: number;
  updateFrequency: "immediate" | "daily" | "weekly";
  factors: PersonaFactor[];
}

export interface PersonaFactor {
  name: string;
  weight: number;
  type: "behavioral" | "demographic" | "engagement" | "subscription";
  conditions: PersonaCondition[];
}

export interface PersonaCondition {
  field: string;
  operator:
    | "equals"
    | "contains"
    | "greater_than"
    | "less_than"
    | "in"
    | "exists";
  value: any;
  points: number;
}

// Email Platform Integration Types
export type EmailPlatform =
  | "convertkit"
  | "mailchimp"
  | "activecampaign"
  | "sendgrid"
  | "postmark"
  | "resend";

export interface EmailPlatformConfig {
  platform: EmailPlatform;
  apiKey: string;
  apiSecret?: string;
  subdomain?: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  webhookSecret?: string;
  customDomain?: string;
}

export interface PlatformCapabilities {
  supportsAutomation: boolean;
  supportsABTesting: boolean;
  supportsSegmentation: boolean;
  supportsPersonalization: boolean;
  supportsAnalytics: boolean;
  maxSubscribers?: number;
  maxEmailsPerMonth?: number;
  rateLimits: {
    requestsPerSecond: number;
    requestsPerHour: number;
  };
}

// Advanced Campaign Features
export interface SmartSendOptimization {
  enabled: boolean;
  optimizeFor: "open_rate" | "click_rate" | "conversion_rate";
  timezoneOptimization: boolean;
  sendTimePersonalization: boolean;
  frequencyOptimization: boolean;
  contentOptimization: boolean;
}

export interface EmailDeliverabilitySettings {
  enableDKIM: boolean;
  enableSPF: boolean;
  enableDMARC: boolean;
  customDomain?: string;
  warmupSettings?: {
    enabled: boolean;
    dailyIncrement: number;
    maxDailyVolume: number;
  };
  reputationMonitoring: boolean;
  bounceHandling: {
    hardBounceAction: "unsubscribe" | "suppress" | "manual_review";
    softBounceRetries: number;
    softBounceThreshold: number;
  };
}

export interface CampaignAutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  priority: number;
}

export interface AutomationTrigger {
  type: "user_action" | "time_based" | "data_change" | "external_event";
  event: string;
  parameters: Record<string, any>;
}

export interface AutomationCondition {
  field: string;
  operator: string;
  value: any;
  logic: "and" | "or";
}

export interface AutomationAction {
  type:
    | "send_email"
    | "add_tag"
    | "remove_tag"
    | "update_field"
    | "trigger_campaign"
    | "webhook";
  parameters: Record<string, any>;
  delay?: number; // minutes
}

// Export default persona configurations
export const DEFAULT_PERSONAS: Record<PersonaType, PersonaProfile> = {
  struggling_sam: {
    id: "struggling_sam",
    displayName: "Struggling Sam",
    description:
      "Price-conscious users who need gentle encouragement and free value",
    primaryColor: "#10b981",
    messagingTone: "supportive",
    ctaStyle: "friendly",
    targetSubscriptionTier: "free",
    conversionGoals: ["app_engagement", "feature_discovery", "basic_upgrade"],
    preferredChannels: ["email", "in_app"],
  },
  busy_ben: {
    id: "busy_ben",
    displayName: "Busy Ben",
    description:
      "Efficiency-driven professionals who value time savings and ROI",
    primaryColor: "#3b82f6",
    messagingTone: "efficient",
    ctaStyle: "urgent",
    targetSubscriptionTier: "basic",
    conversionGoals: [
      "trial_conversion",
      "time_savings",
      "productivity_features",
    ],
    preferredChannels: ["email", "push"],
  },
  professional_paula: {
    id: "professional_paula",
    displayName: "Professional Paula",
    description:
      "Feature-rich seekers who want advanced functionality and analytics",
    primaryColor: "#8b5cf6",
    messagingTone: "sophisticated",
    ctaStyle: "professional",
    targetSubscriptionTier: "premium",
    conversionGoals: ["premium_trial", "advanced_features", "analytics_usage"],
    preferredChannels: ["email", "in_app", "push"],
  },
  enterprise_emma: {
    id: "enterprise_emma",
    displayName: "Enterprise Emma",
    description:
      "Team-oriented decision makers who need comprehensive solutions",
    primaryColor: "#6366f1",
    messagingTone: "business_focused",
    ctaStyle: "corporate",
    targetSubscriptionTier: "pro",
    conversionGoals: ["demo_request", "team_features", "enterprise_trial"],
    preferredChannels: ["email", "in_app"],
  },
  student_sarah: {
    id: "student_sarah",
    displayName: "Student Sarah",
    description:
      "Budget-conscious students who need verification and discounts",
    primaryColor: "#f59e0b",
    messagingTone: "casual",
    ctaStyle: "youthful",
    targetSubscriptionTier: "student",
    conversionGoals: [
      "student_verification",
      "discount_usage",
      "campus_features",
    ],
    preferredChannels: ["email", "push", "sms"],
  },
  lifetime_larry: {
    id: "lifetime_larry",
    displayName: "Lifetime Larry",
    description: "Users who prefer one-time payments over subscriptions",
    primaryColor: "#eab308",
    messagingTone: "value_focused",
    ctaStyle: "exclusive",
    targetSubscriptionTier: "lifetime",
    conversionGoals: [
      "lifetime_purchase",
      "value_demonstration",
      "exclusive_access",
    ],
    preferredChannels: ["email", "in_app"],
  },
};
