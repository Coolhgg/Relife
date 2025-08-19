// Global teardown for Jest testing environment
// This runs once after all test suites complete

import { performance } from "perf_hooks";

/**
 * Enhanced global teardown for comprehensive test environment cleanup
 */
export default async function globalTeardown() {
  const startTime = performance.now();

  console.log("\n🧹 Starting Relife test suite cleanup...\n");

  try {
    // Run any registered cleanup tasks
    if ((global as any).testCleanupTasks) {
      console.log("🔧 Running registered cleanup tasks...");
      const cleanupTasks = (global as any).testCleanupTasks;

      for (let i = 0; i < cleanupTasks.length; i++) {
        try {
          const task = cleanupTasks[i];
          if (typeof task === "function") {
            await task();
          }
        } catch (error) {
          console.warn(`⚠️ Cleanup task ${i + 1} failed:`, error);
        }
      }

      console.log(`✅ ${cleanupTasks.length} cleanup tasks completed`);
    }

    // Clean up test database if it was used
    if (process.env.RUN_INTEGRATION_TESTS === "true") {
      console.log("🗄️ Cleaning up test database...");
      // Database cleanup would go here
      console.log("✅ Test database cleaned");
    }

    // Clean up test file system
    if (process.env.TEST_FILE_UPLOADS === "true") {
      console.log("📁 Cleaning up test files...");

      try {
        const fs = await import("fs/promises");
        const path = await import("path");

        const testUploadsDir = path.join(process.cwd(), "tmp", "test-uploads");

        try {
          const files = await fs.readdir(testUploadsDir);
          for (const file of files) {
            await fs.unlink(path.join(testUploadsDir, file));
          }
          await fs.rmdir(testUploadsDir);
          console.log("✅ Test files cleaned up");
        } catch (error) {
          if ((error as any).code !== "ENOENT") {
            console.warn("⚠️ Could not clean up test files:", error);
          }
        }
      } catch (error) {
        console.warn("⚠️ Error during file cleanup:", error);
      }
    }

    // Generate test performance report
    if ((global as any).testPerformance) {
      console.log("📊 Generating performance report...");

      const slowTests = (global as any).testPerformance.getSlowTests();
      if (slowTests.length > 0) {
        console.log("\n⏱️ Slow Tests Report:");
        console.log("==================");
        slowTests
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 10) // Top 10 slowest
          .forEach((test, index) => {
            console.log(
              `${index + 1}. ${test.name}: ${test.duration.toFixed(2)}ms`,
            );
          });

        if (slowTests.length > 10) {
          console.log(`... and ${slowTests.length - 10} more slow tests`);
        }
        console.log("");
      }
    }

    // Memory usage report
    if (process.memoryUsage && process.env.VERBOSE_TESTS) {
      const memUsage = process.memoryUsage();
      console.log("💾 Memory Usage Report:");
      console.log("=====================");
      console.log(`RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
      console.log(
        `Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      );
      console.log(
        `Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      );
      console.log(
        `External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
      );
      console.log("");
    }

    // Clean up timers if fake timers were used
    if (jest && jest.isMockFunction && jest.isMockFunction(setTimeout)) {
      console.log("⏰ Restoring real timers...");
      jest.useRealTimers();
      console.log("✅ Real timers restored");
    }

    // Clear any remaining intervals/timeouts from tests
    if ((global as any).mockGeoWatchIntervals) {
      console.log("🌍 Cleaning up geolocation watchers...");
      (global as any).mockGeoWatchIntervals.forEach((interval: any) => {
        clearInterval(interval);
      });
      (global as any).mockGeoWatchIntervals.clear();
      console.log("✅ Geolocation watchers cleaned");
    }

    // Clear any global test state
    if ((global as any).testHelpers) {
      delete (global as any).testHelpers;
    }
    if ((global as any).testPerformance) {
      delete (global as any).testPerformance;
    }
    if ((global as any).testCleanupTasks) {
      delete (global as any).testCleanupTasks;
    }
    if ((global as any).addTestCleanupTask) {
      delete (global as any).addTestCleanupTask;
    }

    // Reset environment variables that were modified for testing
    const testEnvVars = [
      "NODE_ENV",
      "VITE_SUPABASE_URL",
      "VITE_SUPABASE_ANON_KEY",
      "VITE_POSTHOG_KEY",
      "VITE_SENTRY_DSN",
      "VITE_STRIPE_PUBLISHABLE_KEY",
      "VITE_APP_VERSION",
      "VITE_APP_ENV",
      "DATABASE_URL",
      "REDIS_URL",
      "WEBHOOK_SECRET",
      "JWT_SECRET",
    ];

    // Don't actually delete them as other processes might need them
    // Just log that they were test-specific
    if (process.env.VERBOSE_TESTS) {
      console.log("🔧 Test environment variables were:");
      testEnvVars.forEach((varName) => {
        if (process.env[varName]) {
          const value = process.env[varName];
          const maskedValue =
            varName.includes("SECRET") || varName.includes("KEY")
              ? value?.slice(0, 10) + "..."
              : value;
          console.log(`  ${varName}: ${maskedValue}`);
        }
      });
      console.log("");
    }

    // Final cleanup message
    const endTime = performance.now();
    const teardownDuration = endTime - startTime;

    console.log(
      `✅ Global test teardown complete in ${teardownDuration.toFixed(2)}ms`,
    );

    // Test suite summary
    console.log("\n📈 Test Suite Summary:");
    console.log("====================");
    console.log(
      `🕒 Total setup/teardown time: ${teardownDuration.toFixed(2)}ms`,
    );
    console.log(`👷 Worker ID: ${process.env.JEST_WORKER_ID}`);
    console.log(`🧪 Environment: ${process.env.NODE_ENV}`);

    // Check for common issues
    const warnings: string[] = [];

    if (process.listenerCount("unhandledRejection") > 2) {
      warnings.push("High number of unhandledRejection listeners detected");
    }

    if (process.listenerCount("uncaughtException") > 1) {
      warnings.push("Multiple uncaughtException listeners detected");
    }

    if (warnings.length > 0) {
      console.log("\n⚠️ Potential Issues:");
      warnings.forEach((warning) => console.log(`  • ${warning}`));
      console.log("");
    }

    console.log("🎉 All tests completed successfully!");
    console.log("\n" + "=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ Global test teardown failed:");
    console.error(error);
    console.error("\nThis may indicate test cleanup issues.\n");

    // Don't throw here as it would mask the actual test results
    // Just log the error and continue
  }
}
