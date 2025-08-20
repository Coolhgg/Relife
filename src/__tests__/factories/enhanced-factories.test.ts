import { expect, test, jest } from "@jest/globals";
/**
 * Enhanced Factories Tests
 *
 * Test coverage for the enhanced factory functions
 */

import {
  createTestPersonaProfile,
  createTestPersonaDetectionResult,
  createTestEmailCampaign,
  createTestPerformanceMetrics,
} from "./enhanced-factories";

describe("Enhanced Factories", () => {
  describe("createTestPersonaProfile", () => {
    it("should create a valid persona profile with default options", () => {
      const profile = createTestPersonaProfile();

      expect(profile).toBeDefined();
      expect(profile.id).toBeTruthy();
      expect(profile.displayName).toBeTruthy();
      expect(profile.description).toBeTruthy();
      expect(profile.primaryColor).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("should respect persona parameter", () => {
      const profile = createTestPersonaProfile({ persona: "busy_ben" });

      expect(profile.id).toBe("busy_ben");
      expect(profile.displayName).toBe("Busy Ben");
      expect(profile.messagingTone).toBe("efficient");
    });
  });

  describe("createTestPersonaDetectionResult", () => {
    it("should create a valid detection result", () => {
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

  describe("createTestEmailCampaign", () => {
    it("should create a valid email campaign", () => {
      const campaign = createTestEmailCampaign();

      expect(campaign).toBeDefined();
      expect(campaign.id).toBeTruthy();
      expect(campaign.name).toBeTruthy();
      expect(campaign.targetPersona).toBeTruthy();
      expect(campaign.sequences).toBeInstanceOf(Array);
      expect(campaign.metrics).toBeDefined();
      expect(["draft", "active", "paused", "completed"]).toContain(
        campaign.status,
      );
    });

    it("should create campaign with specified persona", () => {
      const campaign = createTestEmailCampaign({
        persona: "professional_paula",
      });

      expect(campaign.targetPersona).toBe("professional_paula");
    });
  });

  describe("createTestPerformanceMetrics", () => {
    it("should create valid performance metrics", () => {
      const metrics = createTestPerformanceMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.alarmAccuracy).toBe("number");
      expect(typeof metrics.wakeUpSuccess).toBe("number");
      expect(typeof metrics.userSatisfaction).toBe("number");
      expect(metrics.lastUpdated).toBeInstanceOf(Date);
      expect(metrics.alarmAccuracy).toBeGreaterThanOrEqual(85);
      expect(metrics.alarmAccuracy).toBeLessThanOrEqual(99);
    });
  });
});
