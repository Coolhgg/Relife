/**
 * Integration testing utilities and test orchestration for Relife
 * Provides comprehensive testing flows and test suite coordination
 */

import {
  TestHelpers,
  TestAssertions,
  RelifeTestUtils,
} from '../helpers/comprehensive-test-helpers';
import {
  ApiPerformanceTester,
  PerformanceTestSuite,
} from '../performance/performance-testing-utilities';
import { PaymentFlowTester } from '../payments/payment-testing-utilities';
import { MobilePerformanceTester } from '../performance/performance-testing-utilities';
import { MockPerformanceMonitor } from '../performance/performance-testing-utilities';

// Test orchestration interfaces
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  tags: string[];
  prerequisites?: string[];
  setup?: () => Promise<void>;
  execute: () => Promise<TestScenarioResult>;
  cleanup?: () => Promise<void>;
  timeout?: number;
  retries?: number;
}

export interface TestScenarioResult {
  passed: boolean;
  duration: number;
  steps: TestStepResult[];
  metrics?: Record<string, any>;
  errors?: string[];
  warnings?: string[];
}

export interface TestStepResult {
  name: string;
  passed: boolean;
  duration: number;
  _error?: string;
  data?: any;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  scenarios: TestScenario[];
  parallel?: boolean;
  beforeAll?: () => Promise<void>;
  afterAll?: () => Promise<void>;
}

export interface TestOrchestrationConfig {
  parallel: boolean;
  maxConcurrency: number;
  failFast: boolean;
  retryFailures: boolean;
  generateReport: boolean;
  enablePerformanceMonitoring: boolean;
  enableScreenshots: boolean;
}

// Main test orchestration class
export class TestOrchestrator {
  private helpers = new TestHelpers();
  private assertions = TestAssertions;
  private relifeUtils = new RelifeTestUtils();
  private performanceMonitor = MockPerformanceMonitor.getInstance();
  private _config: TestOrchestrationConfig;
  private results: Map<string, TestScenarioResult> = new Map();

  constructor(_config: Partial<TestOrchestrationConfig> = {}) {
    this.config = {
      parallel: true,
      maxConcurrency: 3,
      failFast: false,
      retryFailures: true,
      generateReport: true,
      enablePerformanceMonitoring: true,
      enableScreenshots: false,
      ..._config,
    };
  }

  // Execute a single test scenario
  async executeScenario(scenario: TestScenario): Promise<TestScenarioResult> {
    const startTime = performance.now();
    const steps: TestStepResult[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Setup
      if (scenario.setup) {
        const setupStart = performance.now();
        await scenario.setup();
        steps.push({
          name: 'Setup',
          passed: true,
          duration: performance.now() - setupStart,
        });
      }

      // Execute main test
      const result = await scenario.execute();

      // Merge results
      steps.push(...result.steps);
      if (result.errors) errors.push(...result.errors);
      if (result.warnings) warnings.push(...result.warnings);

      // Cleanup
      if (scenario.cleanup) {
        const cleanupStart = performance.now();
        await scenario.cleanup();
        steps.push({
          name: 'Cleanup',
          passed: true,
          duration: performance.now() - cleanupStart,
        });
      }

      const duration = performance.now() - startTime;
      const passed = steps.every(step => step.passed) && errors.length === 0;

      const scenarioResult: TestScenarioResult = {
        passed,
        duration,
        steps,
        metrics: result.metrics,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

      this.results.set(scenario.id, scenarioResult);
      return scenarioResult;
    } catch (_error) {
      const duration = performance.now() - startTime;
      errors.push(error instanceof Error ? _error.message : String(_error));

      const scenarioResult: TestScenarioResult = {
        passed: false,
        duration,
        steps,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

      this.results.set(scenario.id, scenarioResult);
      return scenarioResult;
    }
  }

  // Execute a test suite
  async executeSuite(suite: TestSuite): Promise<Map<string, TestScenarioResult>> {
    const results: Map<string, TestScenarioResult> = new Map();

    try {
      // Suite setup
      if (suite.beforeAll) {
        await suite.beforeAll();
      }

      // Execute scenarios
      if (this._config.parallel && suite.parallel !== false) {
        const batches = this.createBatches(
          suite.scenarios,
          this._config.maxConcurrency
        );

        for (const batch of batches) {
          const batchPromises = batch.map(scenario =>
            this.executeScenarioWithRetry(scenario)
          );

          const batchResults = await Promise.allSettled(batchPromises);

          batchResults.forEach((result, _index) => {
            const scenario = batch[_index];
            if (result.status === 'fulfilled') {
              results.set(scenario.id, result.value);
            } else {
              results.set(scenario.id, {
                passed: false,
                duration: 0,
                steps: [],
                errors: [result.reason?.message || 'Unknown _error'],
              });
            }

            // Fail fast if enabled
            if (this._config.failFast && !results.get(scenario.id)?.passed) {
              throw new Error(`Test failed: ${scenario.name}`);
            }
          });
        }
      } else {
        // Sequential execution
        for (const scenario of suite.scenarios) {
          const result = await this.executeScenarioWithRetry(scenario);
          results.set(scenario.id, result);

          if (this._config.failFast && !result.passed) {
            break;
          }
        }
      }

      // Suite cleanup
      if (suite.afterAll) {
        await suite.afterAll();
      }

      return results;
    } catch (_error) {
      console._error(`Test suite execution failed: ${_error}`);
      throw error;
    }
  }

  // Execute scenario with retry logic
  private async executeScenarioWithRetry(
    scenario: TestScenario
  ): Promise<TestScenarioResult> {
    const maxRetries = this._config.retryFailures ? scenario.retries || 1 : 1;
    let lastResult: TestScenarioResult | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.executeScenario(scenario);

        if (result.passed || attempt === maxRetries) {
          return result;
        }

        lastResult = result;
        console.warn(
          `Scenario ${scenario.name} failed (attempt ${attempt}/${maxRetries}), retrying...`
        );

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      } catch (_error) {
        if (attempt === maxRetries) {
          return {
            passed: false,
            duration: 0,
            steps: [],
            errors: [error instanceof Error ? _error.message : String(_error)],
          };
        }
      }
    }

    return lastResult!;
  }

  // Create batches for parallel execution
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  // Get all results
  getResults(): Map<string, TestScenarioResult> {
    return new Map(this.results);
  }

  // Generate comprehensive test report
  generateReport(): TestReport {
    const results = Array.from(this.results.values());
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    return {
      summary: {
        total: results.length,
        passed,
        failed,
        successRate: results.length > 0 ? (passed / results.length) * 100 : 0,
        totalDuration,
        averageDuration: results.length > 0 ? totalDuration / results.length : 0,
      },
      scenarios: Object.fromEntries(this.results.entries()),
      performanceMetrics: this.config.enablePerformanceMonitoring
        ? this.performanceMonitor.getPerformanceSummary()
        : undefined,
      generatedAt: new Date().toISOString(),
    };
  }

  // Clear results
  reset(): void {
    this.results.clear();
    if (this._config.enablePerformanceMonitoring) {
      this.performanceMonitor.reset();
    }
  }
}

export interface TestReport {
  summary: {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
    totalDuration: number;
    averageDuration: number;
  };
  scenarios: Record<string, TestScenarioResult>;
  performanceMetrics?: any;
  generatedAt: string;
}

// Pre-built integration test scenarios for Relife
export class RelifeIntegrationScenarios {
  private helpers = new TestHelpers();
  private relifeUtils = new RelifeTestUtils();
  private apiTester = new ApiPerformanceTester();
  private paymentTester = new PaymentFlowTester();
  private performanceSuite = new PerformanceTestSuite();

  // User onboarding flow
  createUserOnboardingScenario(): TestScenario {
    return {
      id: 'user-onboarding',
      name: 'User Onboarding Flow',
      description: 'Test complete user registration and initial setup',
      tags: ['integration', 'onboarding', 'user-flow'],
      execute: async () => {
        const steps: TestStepResult[] = [];
        const metrics: Record<string, any> = {};

        // Step 1: Registration
        const registrationStart = performance.now();
        try {
          await this.helpers.navigateTo('/register');
          await this.helpers.fillFormWithValidation({
            email: 'test@example.com',
            password: 'SecurePassword123!',
            confirmPassword: 'SecurePassword123!',
            name: 'Test User',
          });

          const form = await this.helpers.findElementWithRetry(
            () => document.querySelector('form') as HTMLElement
          );
          await this.helpers.submitForm(form, 'success');

          steps.push({
            name: 'User Registration',
            passed: true,
            duration: performance.now() - registrationStart,
          });
        } catch (_error) {
          steps.push({
            name: 'User Registration',
            passed: false,
            duration: performance.now() - registrationStart,
            error: error instanceof Error ? _error.message : String(_error),
          });
        }

        // Step 2: Profile Setup
        const profileStart = performance.now();
        try {
          await this.helpers.verifyCurrentRoute('/profile/setup');

          // Set preferences
          await this.helpers.fillFormWithValidation({
            timezone: 'America/New_York',
            language: 'English',
            theme: 'dark',
          });

          const nextButton = await this.helpers.findElementWithRetry(
            () => document.querySelector('[data-testid="next-step"]') as HTMLElement
          );
          await this.helpers.user.click(nextButton);

          steps.push({
            name: 'Profile Setup',
            passed: true,
            duration: performance.now() - profileStart,
          });
        } catch (_error) {
          steps.push({
            name: 'Profile Setup',
            passed: false,
            duration: performance.now() - profileStart,
            error: error instanceof Error ? _error.message : String(_error),
          });
        }

        // Step 3: First Alarm Creation
        const alarmStart = performance.now();
        try {
          await this.relifeUtils.createTestAlarm({
            label: 'My First Alarm',
            time: '07:00',
            days: [1, 2, 3, 4, 5],
          });

          steps.push({
            name: 'First Alarm Creation',
            passed: true,
            duration: performance.now() - alarmStart,
          });
        } catch (_error) {
          steps.push({
            name: 'First Alarm Creation',
            passed: false,
            duration: performance.now() - alarmStart,
            error: error instanceof Error ? _error.message : String(_error),
          });
        }

        // Step 4: Tutorial Completion
        const tutorialStart = performance.now();
        try {
          await this.helpers.waitForElement(
            () =>
              document.querySelector('[data-testid="tutorial-complete"]') as HTMLElement
          );

          const completeButton = await this.helpers.findElementWithRetry(
            () =>
              document.querySelector('[data-testid="complete-tutorial"]') as HTMLElement
          );
          await this.helpers.user.click(completeButton);

          await this.helpers.verifyCurrentRoute('/dashboard');

          steps.push({
            name: 'Tutorial Completion',
            passed: true,
            duration: performance.now() - tutorialStart,
          });
        } catch (_error) {
          steps.push({
            name: 'Tutorial Completion',
            passed: false,
            duration: performance.now() - tutorialStart,
            error: error instanceof Error ? _error.message : String(_error),
          });
        }

        const allPassed = steps.every(step => step.passed);
        const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);

        metrics.onboardingTime = totalDuration;
        metrics.completionRate = allPassed ? 100 : 0;

        return {
          passed: allPassed,
          duration: totalDuration,
          steps,
          metrics,
        };
      },
      timeout: 30000,
    };
  }

  // Alarm lifecycle scenario
  createAlarmLifecycleScenario(): TestScenario {
    return {
      id: 'alarm-lifecycle',
      name: 'Complete Alarm Lifecycle',
      description: 'Test alarm creation, modification, triggering, and deletion',
      tags: ['integration', 'alarms', 'core-features'],
      execute: async () => {
        const steps: TestStepResult[] = [];
        const metrics: Record<string, any> = {};

        // Step 1: Create Alarm
        const createStart = performance.now();
        try {
          await this.relifeUtils.createTestAlarm({
            label: 'Lifecycle Test Alarm',
            time: '08:00',
            difficulty: 'medium',
            voiceMood: 'motivational',
          });

          steps.push({
            name: 'Create Alarm',
            passed: true,
            duration: performance.now() - createStart,
          });
        } catch (_error) {
          steps.push({
            name: 'Create Alarm',
            passed: false,
            duration: performance.now() - createStart,
            error: error instanceof Error ? _error.message : String(_error),
          });
        }

        // Step 2: Modify Alarm
        const modifyStart = performance.now();
        try {
          const editButton = await this.helpers.findElementWithRetry(
            () => document.querySelector('[data-testid="edit-alarm"]') as HTMLElement
          );
          await this.helpers.user.click(editButton);

          await this.helpers.fillFormWithValidation({
            label: 'Modified Lifecycle Alarm',
            time: '08:30',
          });

          const saveButton = await this.helpers.findElementWithRetry(
            () => document.querySelector('[data-testid="save-alarm"]') as HTMLElement
          );
          await this.helpers.user.click(saveButton);

          steps.push({
            name: 'Modify Alarm',
            passed: true,
            duration: performance.now() - modifyStart,
          });
        } catch (_error) {
          steps.push({
            name: 'Modify Alarm',
            passed: false,
            duration: performance.now() - modifyStart,
            error: error instanceof Error ? _error.message : String(_error),
          });
        }

        // Step 3: Test Alarm (simulate trigger)
        const testStart = performance.now();
        try {
          const testButton = await this.helpers.findElementWithRetry(
            () => document.querySelector('[data-testid="test-alarm"]') as HTMLElement
          );
          await this.helpers.user.click(testButton);

          await this.helpers.waitForElement(
            () => document.querySelector('[data-testid="alarm-modal"]') as HTMLElement
          );

          // Complete challenge
          const challengeButton = await this.helpers.findElementWithRetry(
            () =>
              document.querySelector(
                '[data-testid="complete-challenge"]'
              ) as HTMLElement
          );
          await this.helpers.user.click(challengeButton);

          steps.push({
            name: 'Test Alarm Trigger',
            passed: true,
            duration: performance.now() - testStart,
          });
        } catch (_error) {
          steps.push({
            name: 'Test Alarm Trigger',
            passed: false,
            duration: performance.now() - testStart,
            error: error instanceof Error ? _error.message : String(_error),
          });
        }

        // Step 4: Delete Alarm
        const deleteStart = performance.now();
        try {
          const deleteButton = await this.helpers.findElementWithRetry(
            () => document.querySelector('[data-testid="delete-alarm"]') as HTMLElement
          );
          await this.helpers.user.click(deleteButton);

          // Confirm deletion
          const confirmButton = await this.helpers.findElementWithRetry(
            () =>
              document.querySelector('[data-testid="confirm-delete"]') as HTMLElement
          );
          await this.helpers.user.click(confirmButton);

          await this.helpers.waitForElementToDisappear(
            () => document.querySelector('[data-testid="alarm-card"]') as HTMLElement
          );

          steps.push({
            name: 'Delete Alarm',
            passed: true,
            duration: performance.now() - deleteStart,
          });
        } catch (_error) {
          steps.push({
            name: 'Delete Alarm',
            passed: false,
            duration: performance.now() - deleteStart,
            error: error instanceof Error ? _error.message : String(_error),
          });
        }

        const allPassed = steps.every(step => step.passed);
        const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);

        metrics.lifecycleDuration = totalDuration;
        metrics.stepsCompleted = steps.filter(s => s.passed).length;

        return {
          passed: allPassed,
          duration: totalDuration,
          steps,
          metrics,
        };
      },
      timeout: 45000,
    };
  }

  // Battle integration scenario
  createBattleIntegrationScenario(): TestScenario {
    return {
      id: 'battle-integration',
      name: 'Battle System Integration',
      description: 'Test complete battle flow from joining to completion',
      tags: ['integration', 'battles', 'real-time'],
      execute: async () => {
        const steps: TestStepResult[] = [];
        const metrics: Record<string, any> = {};

        // Step 1: Join Battle
        const joinStart = performance.now();
        try {
          await this.relifeUtils.joinBattle('quick');

          steps.push({
            name: 'Join Battle',
            passed: true,
            duration: performance.now() - joinStart,
          });
        } catch (_error) {
          steps.push({
            name: 'Join Battle',
            passed: false,
            duration: performance.now() - joinStart,
            error: error instanceof Error ? _error.message : String(_error),
          });
        }

        // Step 2: Battle Start
        const battleStart = performance.now();
        try {
          await this.helpers.waitForElement(
            () => document.querySelector('[data-testid="battle-arena"]') as HTMLElement
          );

          await this.helpers.waitForElement(
            () =>
              document.querySelector('[data-testid="battle-started"]') as HTMLElement
          );

          steps.push({
            name: 'Battle Start',
            passed: true,
            duration: performance.now() - battleStart,
          });
        } catch (_error) {
          steps.push({
            name: 'Battle Start',
            passed: false,
            duration: performance.now() - battleStart,
            error: error instanceof Error ? _error.message : String(_error),
          });
        }

        // Step 3: Complete Challenges
        const challengesStart = performance.now();
        try {
          // Complete multiple challenges
          for (let i = 0; i < 3; i++) {
            await this.helpers.waitForElement(
              () => document.querySelector('[data-testid="challenge"]') as HTMLElement
            );

            const answerButton = await this.helpers.findElementWithRetry(
              () =>
                document.querySelector('[data-testid="submit-answer"]') as HTMLElement
            );
            await this.helpers.user.click(answerButton);

            await this.helpers.wait(1000); // Wait for next challenge
          }

          steps.push({
            name: 'Complete Challenges',
            passed: true,
            duration: performance.now() - challengesStart,
          });
        } catch (_error) {
          steps.push({
            name: 'Complete Challenges',
            passed: false,
            duration: performance.now() - challengesStart,
            error: error instanceof Error ? _error.message : String(_error),
          });
        }

        // Step 4: Battle Completion
        const completionStart = performance.now();
        try {
          await this.helpers.waitForElement(
            () =>
              document.querySelector('[data-testid="battle-results"]') as HTMLElement
          );

          const continueButton = await this.helpers.findElementWithRetry(
            () => document.querySelector('[data-testid="continue"]') as HTMLElement
          );
          await this.helpers.user.click(continueButton);

          steps.push({
            name: 'Battle Completion',
            passed: true,
            duration: performance.now() - completionStart,
          });
        } catch (_error) {
          steps.push({
            name: 'Battle Completion',
            passed: false,
            duration: performance.now() - completionStart,
            error: error instanceof Error ? _error.message : String(_error),
          });
        }

        const allPassed = steps.every(step => step.passed);
        const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);

        metrics.battleDuration = totalDuration;
        metrics.challengesCompleted = 3;

        return {
          passed: allPassed,
          duration: totalDuration,
          steps,
          metrics,
        };
      },
      timeout: 60000,
    };
  }

  // Premium subscription scenario
  createSubscriptionScenario(): TestScenario {
    return {
      id: 'premium-subscription',
      name: 'Premium Subscription Flow',
      description: 'Test subscription purchase and premium feature access',
      tags: ['integration', 'subscription', 'payments'],
      execute: async () => {
        const steps: TestStepResult[] = [];
        const metrics: Record<string, any> = {};

        // Step 1: Purchase Subscription
        const purchaseStart = performance.now();
        try {
          await this.relifeUtils.purchaseSubscription('premium');

          steps.push({
            name: 'Purchase Subscription',
            passed: true,
            duration: performance.now() - purchaseStart,
          });
        } catch (_error) {
          steps.push({
            name: 'Purchase Subscription',
            passed: false,
            duration: performance.now() - purchaseStart,
            error: error instanceof Error ? _error.message : String(_error),
          });
        }

        // Step 2: Access Premium Features
        const accessStart = performance.now();
        try {
          await this.helpers.navigateTo('/voice-recording');

          await this.relifeUtils.testVoiceRecording(3000);

          steps.push({
            name: 'Access Premium Features',
            passed: true,
            duration: performance.now() - accessStart,
          });
        } catch (_error) {
          steps.push({
            name: 'Access Premium Features',
            passed: false,
            duration: performance.now() - accessStart,
            error: error instanceof Error ? _error.message : String(_error),
          });
        }

        // Step 3: Create Premium Alarms
        const premiumAlarmStart = performance.now();
        try {
          await this.relifeUtils.createTestAlarm({
            label: 'Premium Custom Voice Alarm',
            voiceMood: 'custom',
            difficulty: 'nuclear',
          });

          steps.push({
            name: 'Create Premium Alarms',
            passed: true,
            duration: performance.now() - premiumAlarmStart,
          });
        } catch (_error) {
          steps.push({
            name: 'Create Premium Alarms',
            passed: false,
            duration: performance.now() - premiumAlarmStart,
            error: error instanceof Error ? _error.message : String(_error),
          });
        }

        const allPassed = steps.every(step => step.passed);
        const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);

        metrics.subscriptionTime = totalDuration;
        metrics.featuresAccessed = steps.filter(s => s.passed).length;

        return {
          passed: allPassed,
          duration: totalDuration,
          steps,
          metrics,
        };
      },
      timeout: 45000,
    };
  }

  // Get all integration scenarios
  getAllScenarios(): TestScenario[] {
    return [
      this.createUserOnboardingScenario(),
      this.createAlarmLifecycleScenario(),
      this.createBattleIntegrationScenario(),
      this.createSubscriptionScenario(),
    ];
  }
}

// Main integration test suite
export class RelifeIntegrationTestSuite {
  private orchestrator: TestOrchestrator;
  private scenarios: RelifeIntegrationScenarios;

  constructor(_config: Partial<TestOrchestrationConfig> = {}) {
    this.orchestrator = new TestOrchestrator(_config);
    this.scenarios = new RelifeIntegrationScenarios();
  }

  async runFullIntegrationSuite(): Promise<TestReport> {
    const suite: TestSuite = {
      id: 'relife-full-integration',
      name: 'Relife Full Integration Test Suite',
      description: 'Comprehensive integration tests for all major Relife features',
      scenarios: this.scenarios.getAllScenarios(),
      parallel: false, // Run sequentially for integration tests
    };

    const results = await this.orchestrator.executeSuite(suite);
    return this.orchestrator.generateReport();
  }

  async runScenario(scenarioId: string): Promise<TestScenarioResult> {
    const allScenarios = this.scenarios.getAllScenarios();
    const scenario = allScenarios.find(s => s.id === scenarioId);

    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    return this.orchestrator.executeScenario(scenario);
  }

  getResults(): Map<string, TestScenarioResult> {
    return this.orchestrator.getResults();
  }

  reset(): void {
    this.orchestrator.reset();
  }
}

// Export utilities and classes
export { TestOrchestrator, RelifeIntegrationScenarios, RelifeIntegrationTestSuite };

// Create singleton instance for easy use
export const relifeIntegrationSuite = new RelifeIntegrationTestSuite();

// Export default
export default {
  TestOrchestrator,
  RelifeIntegrationScenarios,
  RelifeIntegrationTestSuite,
  relifeIntegrationSuite,
};
