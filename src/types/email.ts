// Core Email Campaign Types for Relife Application
export type PersonaType =
  | 'struggling_sam'     // Free-focused users
  | 'busy_ben'           // Efficiency-driven professionals
  | 'professional_paula' // Feature-rich seekers
  | 'enterprise_emma'    // Team-oriented decision makers
  | 'student_sarah'      // Budget-conscious students
  | 'lifetime_larry';    // One-time payment preferrers

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
  targetPlan:
    | "free"
    | "basic"
    | "premium"
    | "pro"
    | "student"
    | "lifetime";
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
  influence: number;
}

export interface EmailCampaign {
  id: string;
  name: string;
  persona: PersonaType;
  status: 'draft' | 'active' | 'paused' | 'completed';
  sequences: EmailSequence[];
  metrics: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailSequence {
  id: string;
  campaignId: string;
  order: number;
  name: string;
  subject: string;
  delayHours: number;
  targetAction: string;
  successMetrics: {
    openRateTarget: number;
    clickRateTarget: number;
    conversionRateTarget?: number;
  };
}

export interface CampaignMetrics {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  lastUpdated: Date;
}

export interface EmailPreferences {
  userId: string;
  subscribed: boolean;
  preferences: {
    marketing: boolean;
    product_updates: boolean;
    educational_content: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  lastUpdated: Date;
}