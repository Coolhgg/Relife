// Custom test sequencer for optimized test execution order
// This determines the order in which test files are run

const Sequencer = require('@jest/test-sequencer').default;
const path = require('path');
const fs = require('fs');

/**
 * Enhanced test sequencer that optimizes test execution order based on:
 * 1. Test type priority (unit -> integration -> e2e)
 * 2. Test file size (smaller files first for faster feedback)
 * 3. Historical test duration data
 * 4. Dependency analysis
 */
class RelifeTestSequencer extends Sequencer {
  constructor() {
    super();
    this.testTiming = this.loadTestTiming();
  }

  /**
   * Load historical test timing data
   */
  loadTestTiming() {
    try {
      const timingFile = path.join(process.cwd(), 'coverage', 'test-timing.json');
      if (fs.existsSync(timingFile)) {
        const data = fs.readFileSync(timingFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Could not load test timing data:', error.message);
    }
    return {};
  }

  /**
   * Save test timing data for future optimization
   */
  saveTestTiming() {
    try {
      const timingFile = path.join(process.cwd(), 'coverage', 'test-timing.json');
      const coverageDir = path.dirname(timingFile);

      if (!fs.existsSync(coverageDir)) {
        fs.mkdirSync(coverageDir, { recursive: true });
      }

      fs.writeFileSync(timingFile, JSON.stringify(this.testTiming, null, 2));
    } catch (error) {
      console.warn('Could not save test timing data:', error.message);
    }
  }

  /**
   * Determine test priority based on file path and type
   */
  getTestPriority(testPath) {
    const relativePath = path.relative(process.cwd(), testPath);

    // Critical core functionality tests (highest priority)
    if (relativePath.includes('alarm') || relativePath.includes('voice') || relativePath.includes('subscription')) {
      return 1;
    }

    // Unit tests (high priority)
    if (relativePath.includes('__tests__') && !relativePath.includes('integration') && !relativePath.includes('e2e')) {
      return 2;
    }

    // Service tests (high priority)
    if (relativePath.includes('services') && relativePath.includes('.test.')) {
      return 3;
    }

    // Hook tests (medium-high priority)
    if (relativePath.includes('hooks') && relativePath.includes('.test.')) {
      return 4;
    }

    // Component tests (medium priority)
    if (relativePath.includes('components') && relativePath.includes('.test.')) {
      return 5;
    }

    // Utility tests (medium-low priority)
    if (relativePath.includes('utils') && relativePath.includes('.test.')) {
      return 6;
    }

    // Integration tests (lower priority)
    if (relativePath.includes('integration') || relativePath.includes('Integration')) {
      return 7;
    }

    // End-to-end tests (lowest priority)
    if (relativePath.includes('e2e') || relativePath.includes('E2E')) {
      return 8;
    }

    // Default priority for other tests
    return 5;
  }

  /**
   * Get test file size for optimization
   */
  getTestFileSize(testPath) {
    try {
      const stats = fs.statSync(testPath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get historical test duration
   */
  getTestDuration(testPath) {
    const relativePath = path.relative(process.cwd(), testPath);
    return this.testTiming[relativePath] || 0;
  }

  /**
   * Calculate complexity score based on file contents
   */
  getTestComplexity(testPath) {
    try {
      const content = fs.readFileSync(testPath, 'utf8');

      let complexity = 0;

      // Count test cases
      const testCases = (content.match(/it\(|test\(/g) || []).length;
      complexity += testCases * 10;

      // Count describe blocks
      const describeBlocks = (content.match(/describe\(/g) || []).length;
      complexity += describeBlocks * 5;

      // Check for async operations
      if (content.includes('async') || content.includes('await')) {
        complexity += 50;
      }

      // Check for mock usage
      const mocks = (content.match(/jest\.mock|mockImplementation|mockReturnValue/g) || []).length;
      complexity += mocks * 2;

      // Check for DOM operations
      if (content.includes('render(') || content.includes('screen.')) {
        complexity += 30;
      }

      // Check for user events
      if (content.includes('fireEvent') || content.includes('userEvent')) {
        complexity += 20;
      }

      // Check for timers
      if (content.includes('setTimeout') || content.includes('setInterval') || content.includes('useFakeTimers')) {
        complexity += 25;
      }

      return complexity;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if test has dependencies on other tests
   */
  getTestDependencies(testPath) {
    try {
      const content = fs.readFileSync(testPath, 'utf8');
      const dependencies = [];

      // Check for shared test utilities
      if (content.includes('testUtils') || content.includes('test-setup')) {
        dependencies.push('shared-utils');
      }

      // Check for mock dependencies
      if (content.includes('posthog') || content.includes('PostHog')) {
        dependencies.push('analytics-mocks');
      }

      if (content.includes('supabase') || content.includes('Supabase')) {
        dependencies.push('database-mocks');
      }

      if (content.includes('stripe') || content.includes('Stripe')) {
        dependencies.push('payment-mocks');
      }

      if (content.includes('@capacitor')) {
        dependencies.push('mobile-mocks');
      }

      return dependencies;
    } catch (error) {
      return [];
    }
  }

  /**
   * Main sorting function
   */
  sort(tests) {
    console.log(`
🔄 Optimizing execution order for ${tests.length} test files...`);

    const testMetrics = tests.map(test => {
      const priority = this.getTestPriority(test.path);
      const fileSize = this.getTestFileSize(test.path);
      const duration = this.getTestDuration(test.path);
      const complexity = this.getTestComplexity(test.path);
      const dependencies = this.getTestDependencies(test.path);

      return {
        test,
        priority,
        fileSize,
        duration,
        complexity,
        dependencies,
        relativePath: path.relative(process.cwd(), test.path)
      };
    });

    // Sort by multiple criteria
    const sortedTests = testMetrics.sort((a, b) => {
      // 1. Priority first (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      // 2. Dependencies second (tests with fewer dependencies first)
      if (a.dependencies.length !== b.dependencies.length) {
        return a.dependencies.length - b.dependencies.length;
      }

      // 3. Historical duration (faster tests first within same priority)
      if (a.duration !== b.duration) {
        return a.duration - b.duration;
      }

      // 4. File size (smaller files first for faster startup)
      if (a.fileSize !== b.fileSize) {
        return a.fileSize - b.fileSize;
      }

      // 5. Complexity (simpler tests first)
      if (a.complexity !== b.complexity) {
        return a.complexity - b.complexity;
      }

      // 6. Alphabetical as final tiebreaker
      return a.relativePath.localeCompare(b.relativePath);
    });

    // Log optimization results
    if (process.env.VERBOSE_TESTS || process.env.DEBUG_TEST_SEQUENCER) {
      console.log('\n📋 Test Execution Order:');
      console.log('========================');

      let currentPriority = -1;
      sortedTests.forEach((item, index) => {
        if (item.priority !== currentPriority) {
          currentPriority = item.priority;
          const priorityNames = {
            1: 'Critical Core Tests',
            2: 'Unit Tests',
            3: 'Service Tests',
            4: 'Hook Tests',
            5: 'Component/Utility Tests',
            6: 'Utility Tests',
            7: 'Integration Tests',
            8: 'E2E Tests'
          };
          console.log(`
🔸 ${priorityNames[currentPriority] || `Priority ${currentPriority}`}:`);
        }

        const durationStr = item.duration ? ` (${item.duration}ms)` : '';
        const sizeStr = item.fileSize ? ` [${(item.fileSize / 1024).toFixed(1)}KB]` : '';
        console.log(`  ${index + 1}. ${item.relativePath}${durationStr}${sizeStr}`);
      });
      console.log('
');
    }

    // Statistics
    const stats = {
      totalTests: tests.length,
      criticalTests: sortedTests.filter(t => t.priority === 1).length,
      unitTests: sortedTests.filter(t => t.priority === 2).length,
      integrationTests: sortedTests.filter(t => t.priority >= 7).length,
      avgComplexity: sortedTests.reduce((sum, t) => sum + t.complexity, 0) / sortedTests.length
    };

    console.log('📊 Test Suite Statistics:');
    console.log(`   Total tests: ${stats.totalTests}`);
    console.log(`   Critical tests: ${stats.criticalTests}`);
    console.log(`   Unit tests: ${stats.unitTests}`);
    console.log(`   Integration tests: ${stats.integrationTests}`);
    console.log(`   Avg complexity: ${stats.avgComplexity.toFixed(1)}`);
    console.log('');

    return sortedTests.map(item => item.test);
  }
}

module.exports = RelifeTestSequencer;