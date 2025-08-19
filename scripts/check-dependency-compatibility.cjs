#!/usr/bin/env node
/**
 * Dependency Compatibility Checker
 *
 * This script checks for incompatible dependency updates that could
 * break Jest/ts-jest compatibility or introduce other version conflicts.
 *
 * Usage: node scripts/check-dependency-compatibility.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Known compatibility constraints
const COMPATIBILITY_RULES = {
  // Jest/ts-jest compatibility matrix
  jest: {
    "30.x": {
      compatible: [],
      incompatible: ["ts-jest@^29.x"],
      warning:
        "Jest 30.x is not compatible with ts-jest 29.x. Use Jest 29.7.0 with ts-jest 29.2.5",
    },
  },
  "ts-jest": {
    "29.x": {
      compatible: ["jest@^29.x"],
      incompatible: ["jest@^30.x"],
      warning:
        "ts-jest 29.x requires Jest 29.x. Jest 30.x support is not yet stable",
    },
  },
};

class DependencyChecker {
  constructor() {
    this.packageJson = this.loadPackageJson();
    this.violations = [];
    this.warnings = [];
  }

  loadPackageJson() {
    try {
      const content = fs.readFileSync("package.json", "utf8");
      return JSON.parse(content);
    } catch (error) {
      console.error("❌ Failed to read package.json:", error.message);
      process.exit(1);
    }
  }

  checkOutdatedDependencies() {
    console.log("🔍 Checking for outdated dependencies...");

    try {
      // Run bun outdated and capture output
      const output = execSync("bun outdated --json", { encoding: "utf8" });
      const outdated = JSON.parse(output);

      if (Object.keys(outdated).length === 0) {
        console.log("✅ All dependencies are up to date");
        return [];
      }

      console.log(
        `📦 Found ${Object.keys(outdated).length} outdated dependencies`,
      );
      return outdated;
    } catch (error) {
      // bun outdated exits with code 1 when there are outdated packages
      // Try to parse the output anyway
      try {
        if (error.stdout) {
          const outdated = JSON.parse(error.stdout);
          console.log(
            `📦 Found ${Object.keys(outdated).length} outdated dependencies`,
          );
          return outdated;
        }
      } catch (parseError) {
        console.log(
          "ℹ️  Could not parse outdated dependencies (this is normal if all are up to date)",
        );
        return [];
      }

      return [];
    }
  }

  checkCompatibilityRules(outdated) {
    console.log("🔬 Checking compatibility rules...");

    for (const [packageName, info] of Object.entries(outdated)) {
      const currentVersion = info.from;
      const latestVersion = info.to;

      // Check if this package has compatibility rules
      if (COMPATIBILITY_RULES[packageName]) {
        this.checkPackageRules(packageName, currentVersion, latestVersion);
      }
    }

    // Also check current dependencies against rules
    this.checkCurrentDependencies();
  }

  checkPackageRules(packageName, currentVersion, latestVersion) {
    const rules = COMPATIBILITY_RULES[packageName];
    const latestMajor = this.getMajorVersion(latestVersion);

    for (const [versionPattern, rule] of Object.entries(rules)) {
      if (this.matchesVersionPattern(latestVersion, versionPattern)) {
        // Check if this version has incompatibilities
        if (rule.incompatible && rule.incompatible.length > 0) {
          this.checkIncompatibilities(packageName, latestVersion, rule);
        }
      }
    }
  }

  checkCurrentDependencies() {
    const allDeps = {
      ...(this.packageJson.dependencies || {}),
      ...(this.packageJson.devDependencies || {}),
    };

    // Specifically check Jest/ts-jest compatibility
    const jestVersion = allDeps.jest;
    const tsJestVersion = allDeps["ts-jest"];

    if (jestVersion && tsJestVersion) {
      // Extract version numbers (remove ^ or ~ prefixes)
      const jestMajor = this.getMajorVersion(jestVersion.replace(/[\^~]/, ""));
      const tsJestMajor = this.getMajorVersion(
        tsJestVersion.replace(/[\^~]/, ""),
      );

      if (jestMajor === "30" && tsJestMajor === "29") {
        this.violations.push({
          type: "incompatibility",
          message: `Jest ${jestVersion} is incompatible with ts-jest ${tsJestVersion}`,
          recommendation: "Use Jest ^29.7.0 with ts-jest ^29.2.5",
          severity: "error",
        });
      }
    }
  }

  checkIncompatibilities(packageName, version, rule) {
    const allDeps = {
      ...(this.packageJson.dependencies || {}),
      ...(this.packageJson.devDependencies || {}),
    };

    for (const incompatible of rule.incompatible) {
      const [depName, depVersionPattern] = incompatible.split("@");
      const currentDepVersion = allDeps[depName];

      if (
        currentDepVersion &&
        this.matchesVersionPattern(currentDepVersion, depVersionPattern)
      ) {
        this.violations.push({
          type: "incompatibility",
          package: packageName,
          version: version,
          incompatibleWith: incompatible,
          message:
            rule.warning ||
            `${packageName}@${version} is incompatible with ${incompatible}`,
          severity: "error",
        });
      }
    }
  }

  getMajorVersion(version) {
    const match = version.match(/^[\^~]?(\d+)/);
    return match ? match[1] : "0";
  }

  matchesVersionPattern(version, pattern) {
    // Simple pattern matching for major versions
    const versionMajor = this.getMajorVersion(version);
    const patternMajor = this.getMajorVersion(pattern);

    if (pattern.includes(".x")) {
      return versionMajor === patternMajor;
    }

    return version.includes(pattern.replace(/[\^~]/, ""));
  }

  generateReport() {
    console.log("\n📋 Dependency Compatibility Report");
    console.log("=====================================");

    if (this.violations.length === 0 && this.warnings.length === 0) {
      console.log("✅ No compatibility issues found");
      return true;
    }

    if (this.violations.length > 0) {
      console.log("\n❌ VIOLATIONS:");
      this.violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.message}`);
        if (violation.recommendation) {
          console.log(`   💡 Recommendation: ${violation.recommendation}`);
        }
      });
    }

    if (this.warnings.length > 0) {
      console.log("\n⚠️  WARNINGS:");
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.message}`);
      });
    }

    return this.violations.length === 0;
  }

  run() {
    console.log("🚀 Starting dependency compatibility check...\n");

    // Check for outdated dependencies
    const outdated = this.checkOutdatedDependencies();

    // Check compatibility rules
    this.checkCompatibilityRules(outdated);

    // Generate and return report
    const success = this.generateReport();

    if (!success) {
      console.log("\n💥 Compatibility check FAILED");
      console.log("Please resolve the compatibility issues before proceeding.");
      process.exit(1);
    }

    console.log("\n✅ Compatibility check PASSED");
    return true;
  }
}

// Run the checker if this script is executed directly
if (require.main === module) {
  const checker = new DependencyChecker();
  checker.run();
}

module.exports = DependencyChecker;
