/**
 * Analytics Logging Flow Integration Tests
 * 
 * Comprehensive tests for analytics event tracking, user identification,
 * feature usage monitoring, and performance analytics across all user flows.
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Import main components
import App from '../../src/App';

// Import types
import type { User, Alarm, AnalyticsEvent } from '../../src/types';

// Import enhanced test utilities
import {
  createMockUser,
  createMockAlarm,
  createPremiumUser,
  createTrialUser,
  fillAlarmForm,
  simulateAlarmTrigger,
  mockPostHog,
  expectAnalyticsEvent,
  expectAnalyticsIdentify,
  createMockAnalyticsEvent,
  renderWithProviders,
  waitForLoadingToFinish,
  expectNoConsoleErrors,
  measureRenderTime
} from '../utils/enhanced-test-utilities';

import { setupAllMocks } from '../utils/test-mocks';
import { testDataHelpers, integrationTestUtils } from '../utils/integration-test-setup';

// Mock external services
vi.mock('posthog-js');
vi.mock('../../src/services/analytics');
vi.mock('../../src/services/app-analytics');
vi.mock('../../src/services/performance-monitor');
vi.mock('@sentry/react');

describe('Analytics Logging Flow Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockUser: User;
  let mockPostHogInstance: any;
  let checkConsoleErrors: () => void;

  beforeAll(async () => {
    setupAllMocks();
    mockPostHogInstance = mockPostHog();
  });

  beforeEach(async () => {
    user = userEvent.setup();
    mockUser = createMockUser();
    checkConsoleErrors = expectNoConsoleErrors();
    
    testDataHelpers.clearAll();
    testDataHelpers.addUser(mockUser);
    
    vi.clearAllMocks();
    
    // Mock console methods to prevent test noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    checkConsoleErrors();
    vi.restoreAllMocks();
  });

  describe('P2 Medium: Core Event Tracking', () => {
    it('should track user identification and session start', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Should identify user
      expectAnalyticsIdentify(mockPostHogInstance, mockUser.id, {
        email: mockUser.email,
        name: mockUser.name,
        subscriptionTier: mockUser.subscriptionTier,
        level: mockUser.level,
        detectedPersona: mockUser.detectedPersona
      });

      // Should track session start
      expectAnalyticsEvent(mockPostHogInstance, 'session_started', {
        userId: mockUser.id,
        platform: 'web',
        userAgent: expect.any(String)
      });

      // Should track page view
      expectAnalyticsEvent(mockPostHogInstance, 'page_viewed', {
        page: 'dashboard',
        userId: mockUser.id
      });
    });

    it('should track alarm lifecycle events comprehensively', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Track alarm creation flow start
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      expectAnalyticsEvent(mockPostHogInstance, 'alarm_form_opened', {
        userId: mockUser.id,
        source: 'add_button'
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Track form interactions
      await fillAlarmForm(user, {
        time: '07:30',
        label: 'Analytics Test Alarm',
        days: [1, 2, 3, 4, 5],
        voiceMood: 'motivational',
        snoozeEnabled: true
      });

      // Should track field interactions
      expectAnalyticsEvent(mockPostHogInstance, 'alarm_field_changed', {
        field: 'time',
        value: '07:30'
      });

      expectAnalyticsEvent(mockPostHogInstance, 'alarm_field_changed', {
        field: 'label',
        value: 'Analytics Test Alarm'
      });

      expectAnalyticsEvent(mockPostHogInstance, 'alarm_field_changed', {
        field: 'voiceMood',
        value: 'motivational'
      });

      // Save alarm
      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      // Should track alarm creation
      await waitFor(() => {
        expectAnalyticsEvent(mockPostHogInstance, 'alarm_created', {
          userId: mockUser.id,
          label: 'Analytics Test Alarm',
          time: '07:30',
          days: [1, 2, 3, 4, 5],
          voiceMood: 'motivational',
          snoozeEnabled: true,
          difficulty: 'medium'
        });
      });

      // Should track form completion
      expectAnalyticsEvent(mockPostHogInstance, 'alarm_form_completed', {
        duration: expect.any(Number),
        success: true
      });

      // Verify alarm appears
      await waitFor(() => {
        expect(screen.getByText('Analytics Test Alarm')).toBeInTheDocument();
      });

      // Test alarm editing
      const editButton = screen.queryByRole('button', { name: /edit/i });
      if (editButton) {
        await user.click(editButton);

        expectAnalyticsEvent(mockPostHogInstance, 'alarm_edit_started', {
          alarmId: expect.any(String),
          source: 'edit_button'
        });
      }
    });

    it('should track user interactions and feature discovery', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Track navigation
      const settingsButton = screen.queryByText(/settings/i);
      if (settingsButton) {
        await user.click(settingsButton);

        expectAnalyticsEvent(mockPostHogInstance, 'navigation_clicked', {
          destination: 'settings',
          source: 'main_menu'
        });

        expectAnalyticsEvent(mockPostHogInstance, 'page_viewed', {
          page: 'settings'
        });
      }

      // Track feature discovery
      const voiceSection = screen.queryByText(/voice|speech/i);
      if (voiceSection) {
        await user.click(voiceSection);

        expectAnalyticsEvent(mockPostHogInstance, 'feature_discovered', {
          feature: 'voice_commands',
          discoveryMethod: 'settings_navigation'
        });
      }

      // Track help/documentation access
      const helpButton = screen.queryByText(/help|support|\?/i);
      if (helpButton) {
        await user.click(helpButton);

        expectAnalyticsEvent(mockPostHogInstance, 'help_accessed', {
          section: 'general',
          source: 'help_button'
        });
      }
    });

    it('should track error events and recovery', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Simulate network error during alarm creation
      integrationTestUtils.simulateNetworkError();

      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await fillAlarmForm(user, {
        time: '08:00',
        label: 'Error Test Alarm'
      });

      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      // Should track error
      await waitFor(() => {
        expectAnalyticsEvent(mockPostHogInstance, 'error_occurred', {
          errorType: 'network_error',
          context: 'alarm_creation',
          userId: mockUser.id
        });
      });

      // Should track retry attempt
      integrationTestUtils.resetNetworkSimulation();
      
      const retryButton = screen.queryByRole('button', { name: /retry|try.*again/i });
      if (retryButton) {
        await user.click(retryButton);

        expectAnalyticsEvent(mockPostHogInstance, 'error_recovery_attempted', {
          errorType: 'network_error',
          recoveryMethod: 'retry',
          attemptNumber: 1
        });
      }
    });
  });

  describe('P1 High: Premium Feature Analytics', () => {
    it('should track premium feature usage and conversion funnel', async () => {
      // Start with free user
      const freeUser = createMockUser({ subscriptionTier: 'free' });
      testDataHelpers.addUser(freeUser);

      renderWithProviders(<App />, { user: freeUser });
      await waitForLoadingToFinish();

      // Track premium feature discovery
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Try to access premium feature
      const premiumSection = screen.queryByText(/premium|pro.*features/i);
      if (premiumSection) {
        await user.click(premiumSection);

        expectAnalyticsEvent(mockPostHogInstance, 'premium_feature_discovered', {
          feature: 'premium_features',
          userTier: 'free',
          discoveryContext: 'alarm_creation'
        });

        // Should show upgrade prompt
        await waitFor(() => {
          const upgradePrompt = screen.queryByText(/upgrade|premium/i);
          expect(upgradePrompt).toBeInTheDocument();
        });

        expectAnalyticsEvent(mockPostHogInstance, 'upgrade_prompt_shown', {
          feature: 'premium_features',
          promptType: 'feature_gate',
          userTier: 'free'
        });

        // Click upgrade
        const upgradeButton = screen.queryByRole('button', { name: /upgrade|go.*premium/i });
        if (upgradeButton) {
          await user.click(upgradeButton);

          expectAnalyticsEvent(mockPostHogInstance, 'upgrade_intent', {
            source: 'feature_gate',
            feature: 'premium_features',
            userTier: 'free'
          });
        }
      }
    });

    it('should track trial user behavior and conversion', async () => {
      const trialUser = createTrialUser();
      trialUser.trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days left
      testDataHelpers.addUser(trialUser);

      renderWithProviders(<App />, { user: trialUser });
      await waitForLoadingToFinish();

      // Should track trial status
      expectAnalyticsEvent(mockPostHogInstance, 'trial_status_checked', {
        daysRemaining: 3,
        trialLength: 7,
        userId: trialUser.id
      });

      // Track premium feature usage during trial
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const nuclearModeToggle = screen.queryByLabelText(/nuclear.*mode/i);
      if (nuclearModeToggle) {
        await user.click(nuclearModeToggle);

        expectAnalyticsEvent(mockPostHogInstance, 'premium_feature_used', {
          feature: 'nuclear_mode',
          userTier: 'trial',
          daysIntoTrial: 4,
          featureCategory: 'alarm_difficulty'
        });
      }

      // Track trial conversion prompt
      const convertButton = screen.queryByText(/convert|subscribe.*now/i);
      if (convertButton) {
        await user.click(convertButton);

        expectAnalyticsEvent(mockPostHogInstance, 'trial_conversion_prompted', {
          daysRemaining: 3,
          premiumFeaturesUsed: ['nuclear_mode'],
          promptContext: 'feature_usage'
        });
      }
    });

    it('should track premium user feature adoption', async () => {
      const premiumUser = createPremiumUser();
      testDataHelpers.addUser(premiumUser);

      renderWithProviders(<App />, { user: premiumUser });
      await waitForLoadingToFinish();

      // Track premium feature availability
      expectAnalyticsEvent(mockPostHogInstance, 'premium_features_loaded', {
        userId: premiumUser.id,
        availableFeatures: premiumUser.premiumFeatures,
        subscriptionTier: 'premium'
      });

      // Create alarm with premium features
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Enable multiple premium features
      const nuclearMode = screen.queryByLabelText(/nuclear.*mode/i);
      const smartWakeup = screen.queryByLabelText(/smart.*wake.*up/i);

      if (nuclearMode) {
        await user.click(nuclearMode);
        expectAnalyticsEvent(mockPostHogInstance, 'premium_feature_toggled', {
          feature: 'nuclear_mode',
          enabled: true,
          userTier: 'premium'
        });
      }

      if (smartWakeup) {
        await user.click(smartWakeup);
        expectAnalyticsEvent(mockPostHogInstance, 'premium_feature_toggled', {
          feature: 'smart_wakeup',
          enabled: true,
          userTier: 'premium'
        });
      }

      // Save alarm
      const timeInput = screen.getByLabelText(/time/i);
      await user.type(timeInput, '06:00');

      const labelInput = screen.getByLabelText(/label/i);
      await user.type(labelInput, 'Premium Feature Test');

      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      // Should track premium alarm creation
      await waitFor(() => {
        expectAnalyticsEvent(mockPostHogInstance, 'premium_alarm_created', {
          userId: premiumUser.id,
          premiumFeaturesUsed: expect.arrayContaining(['nuclear_mode']),
          subscriptionTier: 'premium'
        });
      });
    });
  });

  describe('P2 Medium: Performance and Usage Analytics', () => {
    it('should track app performance metrics', async () => {
      const startTime = performance.now();

      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      const loadTime = performance.now() - startTime;

      // Should track app load performance
      expectAnalyticsEvent(mockPostHogInstance, 'app_performance', {
        metric: 'load_time',
        value: loadTime,
        threshold: 3000,
        passed: loadTime < 3000
      });

      // Track render performance for heavy operations
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      
      const renderStartTime = performance.now();
      await user.click(addAlarmButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const renderTime = performance.now() - renderStartTime;

      expectAnalyticsEvent(mockPostHogInstance, 'component_performance', {
        component: 'alarm_form',
        metric: 'render_time',
        value: renderTime,
        threshold: 500
      });
    });

    it('should track user engagement patterns', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Track session engagement
      expectAnalyticsEvent(mockPostHogInstance, 'session_started', {
        userId: mockUser.id,
        timestamp: expect.any(String)
      });

      // Simulate user activity
      await user.click(screen.getByRole('button', { name: /add.*alarm/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Track engagement with different features
      await user.type(screen.getByLabelText(/time/i), '09:00');
      await user.type(screen.getByLabelText(/label/i), 'Engagement Test');

      // Should track form engagement
      expectAnalyticsEvent(mockPostHogInstance, 'form_engagement', {
        form: 'alarm_creation',
        fieldsInteracted: 2,
        timeSpent: expect.any(Number)
      });

      // Track completion
      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      await waitFor(() => {
        expectAnalyticsEvent(mockPostHogInstance, 'user_action_completed', {
          action: 'alarm_created',
          completionTime: expect.any(Number),
          success: true
        });
      });
    });

    it('should track feature usage frequency and patterns', async () => {
      // Create user with some existing alarms
      for (let i = 0; i < 3; i++) {
        const alarm = createMockAlarm({
          id: `existing-${i}`,
          userId: mockUser.id,
          label: `Existing Alarm ${i + 1}`,
          time: `0${7 + i}:00`
        });
        testDataHelpers.addAlarm(alarm);
      }

      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Should track existing alarms count
      expectAnalyticsEvent(mockPostHogInstance, 'user_state_analyzed', {
        userId: mockUser.id,
        existingAlarms: 3,
        subscriptionTier: mockUser.subscriptionTier,
        userLevel: mockUser.level
      });

      // Test different interactions
      const interactions = [
        { element: /add.*alarm/i, action: 'create_alarm' },
        { element: /settings/i, action: 'view_settings' },
        { element: /profile|account/i, action: 'view_profile' }
      ];

      for (const { element, action } of interactions) {
        const button = screen.queryByText(element) || screen.queryByRole('button', { name: element });
        if (button) {
          await user.click(button);

          expectAnalyticsEvent(mockPostHogInstance, 'feature_interaction', {
            feature: action,
            userId: mockUser.id,
            sessionTime: expect.any(Number)
          });

          // Navigate back for next test
          const backButton = screen.queryByText(/back|close|dashboard/i);
          if (backButton) {
            await user.click(backButton);
          }
        }
      }
    });

    it('should track cross-device usage patterns', async () => {
      // Simulate different device contexts
      const deviceContexts = [
        { userAgent: 'Mobile Safari', deviceType: 'mobile' },
        { userAgent: 'Chrome Desktop', deviceType: 'desktop' },
        { userAgent: 'iPad Safari', deviceType: 'tablet' }
      ];

      for (const { userAgent, deviceType } of deviceContexts) {
        // Mock user agent
        Object.defineProperty(navigator, 'userAgent', {
          value: userAgent,
          writable: true
        });

        renderWithProviders(<App />, { user: mockUser });
        await waitForLoadingToFinish();

        expectAnalyticsEvent(mockPostHogInstance, 'device_context_detected', {
          deviceType,
          userAgent,
          screenSize: expect.any(String),
          touchCapable: deviceType === 'mobile' || deviceType === 'tablet'
        });

        // Test device-specific interactions
        if (deviceType === 'mobile') {
          // Test touch interactions
          const addButton = screen.getByRole('button', { name: /add.*alarm/i });
          fireEvent.touchStart(addButton);
          fireEvent.touchEnd(addButton);

          expectAnalyticsEvent(mockPostHogInstance, 'touch_interaction', {
            element: 'add_alarm_button',
            deviceType: 'mobile'
          });
        }

        // Clean up for next iteration
        screen.getByTestId('root').innerHTML = '';
      }
    });
  });

  describe('P2 Medium: Privacy and Consent', () => {
    it('should respect user privacy preferences', async () => {
      // Test with analytics disabled
      const privacyUser = createMockUser({
        ...mockUser,
        analyticsConsent: false
      });
      testDataHelpers.addUser(privacyUser);

      renderWithProviders(<App />, { user: privacyUser });
      await waitForLoadingToFinish();

      // Should not track detailed events when consent is false
      expect(mockPostHogInstance.capture).not.toHaveBeenCalledWith(
        expect.stringMatching(/detailed_|sensitive_/),
        expect.any(Object)
      );

      // Should only track essential events
      expectAnalyticsEvent(mockPostHogInstance, 'session_started', {
        anonymized: true
      });
    });

    it('should anonymize sensitive data in analytics', async () => {
      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // Create alarm with potentially sensitive data
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await fillAlarmForm(user, {
        time: '07:00',
        label: 'Personal medical appointment', // Sensitive label
      });

      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      // Should track alarm creation but anonymize sensitive data
      await waitFor(() => {
        expectAnalyticsEvent(mockPostHogInstance, 'alarm_created', {
          userId: mockUser.id,
          time: '07:00',
          label: expect.not.stringContaining('medical'), // Should be anonymized
          labelHash: expect.any(String) // Should have hash instead
        });
      });
    });

    it('should handle analytics service failures gracefully', async () => {
      // Mock PostHog failure
      mockPostHogInstance.capture.mockImplementation(() => {
        throw new Error('Analytics service unavailable');
      });

      renderWithProviders(<App />, { user: mockUser });
      await waitForLoadingToFinish();

      // App should still work without analytics
      const addAlarmButton = screen.getByRole('button', { name: /add.*alarm/i });
      await user.click(addAlarmButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await fillAlarmForm(user, {
        time: '08:00',
        label: 'Analytics Failure Test'
      });

      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);

      // Alarm should still be created despite analytics failure
      await waitFor(() => {
        expect(screen.getByText('Analytics Failure Test')).toBeInTheDocument();
      });

      // Should track analytics failure
      expectAnalyticsEvent(mockPostHogInstance, 'analytics_error', {
        error: 'Analytics service unavailable',
        fallback: 'local_storage'
      });
    });
  });
});