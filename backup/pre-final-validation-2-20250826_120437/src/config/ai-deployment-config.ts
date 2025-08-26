/**
 * AI Model Configuration Settings
 * Configurable parameters for the enhanced AI behavior analysis system
 */

export interface AISettings {
  patternRecognitionSensitivity: 'low' | 'medium' | 'high';
  recommendationFrequency: 'daily' | 'weekly' | 'adaptive';
  privacyLevel: 'basic' | 'enhanced' | 'comprehensive';
  learningRate: number; // 0.1 - 0.9
  confidenceThreshold: number; // 0.5 - 0.95
  enabledFeatures: {
    behavioralIntelligence: boolean;
    crossPlatformIntegration: boolean;
    recommendationEngine: boolean;
    predictiveAnalytics: boolean;
    psychologicalProfiling: boolean;
  };
  modelSettings: {
    embeddingDimensions: number; // 50-200
    minDataPointsRequired: number; // 5-30
    maxHistoryDays: number; // 30-365
    backgroundProcessingEnabled: boolean;
    realtimeUpdatesEnabled: boolean;
  };
  performanceSettings: {
    maxConcurrentAnalyses: number;
    cacheTTLMinutes: number;
    batchProcessingSize: number;
    enabledOptimizations: string[];
  };
}

export interface PlatformConfig {
  enabled: boolean;
  syncFrequency: number; // minutes
  privacyLevel: 'basic' | 'enhanced' | 'comprehensive';
  dataRetentionDays: number;
  platformSettings: {
    healthApps: {
      appleHealth: boolean;
      googleFit: boolean;
      fitbit: boolean;
      syncMetrics: string[];
    };
    calendar: {
      googleCalendar: boolean;
      outlook: boolean;
      appleCalendar: boolean;
      eventTypes: string[];
    };
    weather: {
      enabled: boolean;
      provider: 'openweather' | 'weatherapi' | 'darksky';
      forecastDays: number;
    };
    social: {
      sentimentAnalysis: boolean;
      platforms: string[];
      activityTracking: boolean;
    };
    productivity: {
      taskManagement: boolean;
      timeTracking: boolean;
      goalTracking: boolean;
    };
  };
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  patternRecognitionSensitivity: 'medium',
  recommendationFrequency: 'adaptive',
  privacyLevel: 'enhanced',
  learningRate: 0.3,
  confidenceThreshold: 0.7,
  enabledFeatures: {
    behavioralIntelligence: true,
    crossPlatformIntegration: true,
    recommendationEngine: true,
    predictiveAnalytics: true,
    psychologicalProfiling: true,
  },
  modelSettings: {
    embeddingDimensions: 50,
    minDataPointsRequired: 10,
    maxHistoryDays: 180,
    backgroundProcessingEnabled: true,
    realtimeUpdatesEnabled: true,
  },
  performanceSettings: {
    maxConcurrentAnalyses: 5,
    cacheTTLMinutes: 60,
    batchProcessingSize: 100,
    enabledOptimizations: ['caching', 'batching', 'lazy_loading'],
  },
};

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  enabled: true,
  syncFrequency: 30, // 30 minutes
  privacyLevel: 'enhanced',
  dataRetentionDays: 90,
  platformSettings: {
    healthApps: {
      appleHealth: true,
      googleFit: true,
      fitbit: false,
      syncMetrics: ['sleep', 'steps', 'heart_rate', 'energy'],
    },
    calendar: {
      googleCalendar: true,
      outlook: false,
      appleCalendar: false,
      eventTypes: ['work', 'personal', 'health'],
    },
    weather: {
      enabled: true,
      provider: 'openweather',
      forecastDays: 7,
    },
    social: {
      sentimentAnalysis: false,
      platforms: [],
      activityTracking: false,
    },
    productivity: {
      taskManagement: true,
      timeTracking: false,
      goalTracking: true,
    },
  },
};

/**
 * Phase-specific deployment configurations
 */
export interface PhaseConfig {
  phase: number;
  name: string;
  enabled: boolean;
  dependencies: number[];
  services: string[];
  testingSuite: string;
  rollbackStrategy: string;
}

export const DEPLOYMENT_PHASES: PhaseConfig[] = [
  {
    phase: 1,
    name: 'Core Services',
    enabled: true,
    dependencies: [],
    services: ['AdvancedBehavioralIntelligence'],
    testingSuite: 'core-services',
    rollbackStrategy: 'disable-ai-features',
  },
  {
    phase: 2,
    name: 'Cross-Platform Integration',
    enabled: true,
    dependencies: [1],
    services: ['CrossPlatformIntegration'],
    testingSuite: 'platform-integration',
    rollbackStrategy: 'disable-external-integrations',
  },
  {
    phase: 3,
    name: 'Recommendation Engine',
    enabled: true,
    dependencies: [1, 2],
    services: ['EnhancedRecommendationEngine'],
    testingSuite: 'recommendation-engine',
    rollbackStrategy: 'disable-recommendations',
  },
  {
    phase: 4,
    name: 'Dashboard & UI',
    enabled: true,
    dependencies: [1, 2, 3],
    services: ['EnhancedBehavioralIntelligenceDashboard'],
    testingSuite: 'ui-integration',
    rollbackStrategy: 'hide-dashboard-features',
  },
  {
    phase: 5,
    name: 'Optimization & Scaling',
    enabled: true,
    dependencies: [1, 2, 3, 4],
    services: ['PerformanceOptimizer', 'ScalingManager'],
    testingSuite: 'performance-scaling',
    rollbackStrategy: 'basic-optimization-only',
  },
];

/**
 * Monitoring and KPI configuration
 */
export interface MonitoringConfig {
  enabledMetrics: string[];
  alertThresholds: Record<string, number>;
  reportingFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  dashboardUpdateInterval: number; // seconds
}

export const MONITORING_CONFIG: MonitoringConfig = {
  enabledMetrics: [
    'pattern_recognition_accuracy',
    'recommendation_engagement_rate',
    'user_satisfaction_score',
    'system_performance_metrics',
    'privacy_compliance_score',
    'prediction_accuracy',
    'service_availability',
    'data_sync_success_rate',
  ],
  alertThresholds: {
    pattern_recognition_accuracy: 0.8,
    recommendation_engagement_rate: 0.6,
    user_satisfaction_score: 0.75,
    service_availability: 0.99,
    data_sync_success_rate: 0.95,
  },
  reportingFrequency: 'daily',
  dashboardUpdateInterval: 300, // 5 minutes
};
