/**
 * Enhanced Factories Tests
 * 
 * Test coverage for the enhanced factory functions
 */

import {
  createTestPersonaProfile,
  createTestPersonaDetectionResult,
  createTestEmailCampaign,
  createTestTabProtectionSettings,
  createTestPerformanceMetric,
  createTestSystemHealth,
  createTestFeatureUsageStats
} from './enhanced-factories';

describe('Enhanced Factories', () => {
  describe('createTestPersonaProfile', () => {
    it('should create a valid persona profile with default options', () => {
      const profile = createTestPersonaProfile();
      
      expect(profile).toBeDefined();
      expect(profile.id).toBeTruthy();
      expect(profile.displayName).toBeTruthy();
      expect(profile.description).toBeTruthy();
      expect(profile.primaryColor).toMatch(/^#[0-9A-F]{6}$/i);
      expect(profile.conversionGoals).toBeInstanceOf(Array);
      expect(profile.preferredChannels).toBeInstanceOf(Array);
    });

    it('should respect persona parameter', () => {
      const profile = createTestPersonaProfile({ persona: 'busy_ben' });
      
      expect(profile.id).toBe('busy_ben');
      expect(profile.displayName).toBe('Busy Ben');
      expect(profile.messagingTone).toBe('efficient');
    });
  });

  describe('createTestPersonaDetectionResult', () => {
    it('should create a valid detection result', () => {
      const result = createTestPersonaDetectionResult();
      
      expect(result).toBeDefined();
      expect(result.persona).toBeTruthy();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.factors).toBeInstanceOf(Array);
      expect(result.factors.length).toBeGreaterThan(0);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('createTestEmailCampaign', () => {
    it('should create a valid email campaign', () => {
      const campaign = createTestEmailCampaign();
      
      expect(campaign).toBeDefined();
      expect(campaign.id).toBeTruthy();
      expect(campaign.name).toBeTruthy();
      expect(campaign.targetPersona).toBeTruthy();
      expect(campaign.sequences).toBeInstanceOf(Array);
      expect(campaign.metrics).toBeDefined();
      expect(['draft', 'active', 'paused', 'completed']).toContain(campaign.status);
    });

    it('should create campaign with specified persona', () => {
      const campaign = createTestEmailCampaign({ persona: 'professional_paula' });
      
      expect(campaign.targetPersona).toBe('professional_paula');
    });
  });

  describe('createTestTabProtectionSettings', () => {
    it('should create valid tab protection settings', () => {
      const settings = createTestTabProtectionSettings();
      
      expect(settings).toBeDefined();
      expect(typeof settings.enabled).toBe('boolean');
      expect(settings.protectionTiming).toBeDefined();
      expect(settings.customMessages).toBeDefined();
      expect(settings.visualSettings).toBeDefined();
      expect(settings.preventNavigation).toBeDefined();
      expect(settings.exceptions).toBeDefined();
    });

    it('should respect enabled parameter', () => {
      const settings = createTestTabProtectionSettings({ enabled: false });
      
      expect(settings.enabled).toBe(false);
    });
  });

  describe('createTestPerformanceMetric', () => {
    it('should create a valid performance metric', () => {
      const metric = createTestPerformanceMetric();
      
      expect(metric).toBeDefined();
      expect(metric.id).toBeTruthy();
      expect(metric.metricType).toBeTruthy();
      expect(typeof metric.value).toBe('number');
      expect(metric.timestamp).toBeTruthy();
      expect(metric.metadata).toBeDefined();
    });
  });

  describe('createTestSystemHealth', () => {
    it('should create valid system health data', () => {
      const health = createTestSystemHealth();
      
      expect(health).toBeDefined();
      expect(['healthy', 'warning', 'critical']).toContain(health.status);
      expect(health.metrics).toBeDefined();
      expect(health.services).toBeDefined();
      expect(typeof health.metrics.cpuUsage).toBe('number');
      expect(typeof health.metrics.memoryUsage).toBe('number');
    });
  });

  describe('createTestFeatureUsageStats', () => {
    it('should create valid feature usage statistics', () => {
      const stats = createTestFeatureUsageStats();
      
      expect(stats).toBeDefined();
      expect(stats.feature).toBeTruthy();
      expect(typeof stats.totalUsers).toBe('number');
      expect(typeof stats.activeUsers).toBe('number');
      expect(stats.activeUsers).toBeLessThanOrEqual(stats.totalUsers);
      expect(stats.topActions).toBeInstanceOf(Array);
      expect(stats.conversionMetrics).toBeDefined();
    });
  });
});