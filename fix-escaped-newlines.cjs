#!/usr/bin/env node

/**
 * Fix Escaped Newlines Script
 * Converts literal \n sequences back to actual newlines in text files
 */

const fs = require("fs");
const path = require("path");

// Files that have escaped newlines based on corruption report
const filesToFix = [
  "database/README.md",
  "database/schema.sql",
  "TRANSLATION_GUIDELINES.md",
  "TYPESCRIPT_FIXES_SUMMARY.md",
  "android/gradlew",
  "docker/default.conf",
  "docker/health-check.sh",
  "email-campaigns/quick-setup.js",
  "ios/App/App.xcodeproj/project.pbxproj",
  "scripts/advanced-translation-manager.mjs",
  "scripts/check-dependency-compatibility.cjs",
  "scripts/corruption-detector.cjs",
  "scripts/generate-comprehensive-themes.js",
  "scripts/generate-theme-sounds.js",
  "scripts/manage-translations.mjs",
  "scripts/persona-optimizer.js",
  "scripts/run-struggling-sam-migration.cjs",
  "scripts/scan-syntax-errors-improved.cjs",
  "scripts/setup-convertkit.js",
  "scripts/test-payment-config.js",
  "scripts/test-pwa-browsers.cjs",
  "scripts/validate-external-services.js",
  "scripts/validate-mixed-scripts.js",
  "server/analytics-api.ts",
  "src/__tests__/config/global-setup.ts",
  "src/__tests__/config/global-teardown.ts",
  "src/__tests__/config/test-sequencer.js",
  "src/__tests__/factories/enhanced-factories.ts",
  "src/components/RootErrorBoundary.tsx",
  "src/components/ThemeCustomizationStudio.tsx",
  "src/components/ui/chart.tsx",
  "src/components/user-testing/BetaTestingProgram.tsx",
  "src/config/themes.ts",
  "src/services/__tests__/error-handler.test.ts",
  "src/services/error-handler.ts",
  "src/utils/premium-testing.ts",
  "src/utils/translationValidation.ts",
  "relife-campaign-dashboard/src/components/ui/chart.tsx",
  "relife-campaign-dashboard/vite.config.ts",
];

function fixEscapedNewlines(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, "utf8");

    // Check if file has literal \n sequences (not actual newlines)
    if (content.includes("\\n") && content.split("\n").length < 10) {
      console.log(`🔧 Fixing escaped newlines in: ${filePath}`);

      // Replace literal \n with actual newlines
      let fixed = content
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\r");

      // Write the fixed content
      fs.writeFileSync(filePath, fixed, "utf8");
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`✓  Already correct: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log("🚀 Starting escaped newlines fix...\n");

  let fixedCount = 0;
  let totalFiles = 0;

  for (const file of filesToFix) {
    totalFiles++;
    if (fixEscapedNewlines(file)) {
      fixedCount++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Fixed: ${fixedCount} files`);
  console.log(`   Total processed: ${totalFiles} files`);
  console.log(`   Completion: ${Math.round((fixedCount / totalFiles) * 100)}%`);
}

if (require.main === module) {
  main();
}
