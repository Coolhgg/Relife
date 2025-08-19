#!/usr/bin/env node
/**
 * Corruption Detection Script
 * Systematically scans for various types of file corruption patterns
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class CorruptionDetector {
  constructor() {
    this.results = {
      escapedNewlines: [],
      compressedFiles: [],
      encodingIssues: [],
      jsxSyntaxBreakage: [],
      formatIssues: [],
    };
    this.scannedFiles = 0;
  }

  // Check for escaped newlines and tab characters in source files
  detectEscapedNewlines(filePath, content) {
    const patterns = [/\\n/g, /\\t/g, /\\r/g, /\\\"/g, /\\\'/g, /\\>/g, /\\</g];

    const issues = [];

    patterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        const patternNames = [
          "escaped newlines",
          "escaped tabs",
          "escaped carriage returns",
          "escaped double quotes",
          "escaped single quotes",
          "escaped greater than",
          "escaped less than",
        ];
        issues.push({
          pattern: patternNames[index],
          count: matches.length,
          examples: matches.slice(0, 5), // First 5 examples
        });
      }
    });

    if (issues.length > 0) {
      this.results.escapedNewlines.push({
        file: filePath,
        issues: issues,
      });
    }
  }

  // Detect one-line compressed files (no proper indentation, extreme line length)
  detectCompressedFiles(filePath, content) {
    const lines = content.split("\n");
    const totalLines = lines.length;

    // Check for extremely long lines (> 10k chars)
    const longLines = lines.filter((line) => line.length > 10000);

    // Check for lack of indentation (all lines start at column 0)
    let indentedLines = 0;
    lines.forEach((line) => {
      if (line.match(/^\s+/)) {
        indentedLines++;
      }
    });

    const indentationRatio = indentedLines / totalLines;

    // Flag as compressed if:
    // 1. Has extremely long lines OR
    // 2. Less than 10% of lines are indented (excluding empty files)
    if (longLines.length > 0 || (totalLines > 10 && indentationRatio < 0.1)) {
      this.results.compressedFiles.push({
        file: filePath,
        totalLines: totalLines,
        longLinesCount: longLines.length,
        maxLineLength: Math.max(...lines.map((l) => l.length)),
        indentationRatio: indentationRatio,
        avgLineLength: content.length / totalLines,
      });
    }
  }

  // Detect encoding issues
  detectEncodingIssues(filePath) {
    try {
      // Check for invalid UTF-8 using file command
      const result = execSync(`file -b "${filePath}"`, {
        encoding: "utf8",
      }).trim();

      if (!result.includes("UTF-8") && !result.includes("ASCII")) {
        this.results.encodingIssues.push({
          file: filePath,
          encoding: result,
        });
      }
    } catch (error) {
      // If file command fails, try reading with different encodings
      try {
        fs.readFileSync(filePath, "utf8");
      } catch (readError) {
        if (
          readError.code === "EILSEQ" ||
          readError.message.includes("invalid")
        ) {
          this.results.encodingIssues.push({
            file: filePath,
            error: readError.message,
          });
        }
      }
    }
  }

  // Detect JSX syntax breakage patterns
  detectJSXSyntaxBreakage(filePath, content) {
    if (!filePath.match(/\.(tsx|jsx)$/)) return;

    const jsxIssues = [];

    // Check for escaped JSX attributes
    if (
      content.includes('className=\\"') ||
      content.includes("className=\\'")
    ) {
      jsxIssues.push("Escaped className attributes");
    }

    // Check for escaped JSX tags
    if (content.includes("\\<") || content.includes("\\>")) {
      jsxIssues.push("Escaped JSX angle brackets");
    }

    // Check for improperly closed JSX tags
    const unclosedTags = content.match(/<[a-zA-Z][^>]*[^/]>\s*$/gm);
    if (unclosedTags) {
      jsxIssues.push("Potentially unclosed JSX tags");
    }

    // Check for JSX fragments in strings
    if (content.includes('"<>') || content.includes("'<>")) {
      jsxIssues.push("JSX fragments inside strings");
    }

    if (jsxIssues.length > 0) {
      this.results.jsxSyntaxBreakage.push({
        file: filePath,
        issues: jsxIssues,
      });
    }
  }

  // Detect general formatting issues
  detectFormatIssues(filePath, content) {
    const issues = [];

    // Check for mixed line endings
    const hasLF = content.includes("\n");
    const hasCRLF = content.includes("\r\n");
    const hasCR = content.includes("\r");

    if ((hasLF && hasCRLF) || (hasLF && hasCR) || (hasCRLF && hasCR)) {
      issues.push("Mixed line endings");
    }

    // Check for trailing whitespace
    const linesWithTrailingWhitespace = content
      .split("\n")
      .filter((line) => line.match(/\s+$/));
    if (linesWithTrailingWhitespace.length > 0) {
      issues.push(
        `Trailing whitespace on ${linesWithTrailingWhitespace.length} lines`,
      );
    }

    // Check for inconsistent indentation
    const lines = content.split("\n").filter((line) => line.trim().length > 0);
    let tabIndented = 0;
    let spaceIndented = 0;

    lines.forEach((line) => {
      if (line.match(/^\t/)) tabIndented++;
      if (line.match(/^  +/)) spaceIndented++;
    });

    if (tabIndented > 0 && spaceIndented > 0) {
      issues.push(
        `Mixed indentation: ${tabIndented} tab-indented, ${spaceIndented} space-indented`,
      );
    }

    if (issues.length > 0) {
      this.results.formatIssues.push({
        file: filePath,
        issues: issues,
      });
    }
  }

  // Main scanning function
  scanFile(filePath) {
    try {
      this.scannedFiles++;

      // Skip binary files, node_modules, and other irrelevant directories
      if (this.shouldSkipFile(filePath)) {
        return;
      }

      const content = fs.readFileSync(filePath, "utf8");

      // Run all detection methods
      this.detectEscapedNewlines(filePath, content);
      this.detectCompressedFiles(filePath, content);
      this.detectEncodingIssues(filePath);
      this.detectJSXSyntaxBreakage(filePath, content);
      this.detectFormatIssues(filePath, content);
    } catch (error) {
      // If we can't read as UTF-8, it might be an encoding issue
      if (error.code === "EILSEQ" || error.message.includes("invalid")) {
        this.results.encodingIssues.push({
          file: filePath,
          error: error.message,
        });
      }
    }
  }

  shouldSkipFile(filePath) {
    const skipPatterns = [
      /node_modules/,
      /\.git/,
      /\.png$/,
      /\.jpg$/,
      /\.jpeg$/,
      /\.gif$/,
      /\.ico$/,
      /\.svg$/,
      /\.woff$/,
      /\.woff2$/,
      /\.ttf$/,
      /\.eot$/,
      /\.mp3$/,
      /\.wav$/,
      /\.mp4$/,
      /\.webm$/,
      /bun\.lock$/,
      /package-lock\.json$/,
      /yarn\.lock$/,
    ];

    return skipPatterns.some((pattern) => pattern.test(filePath));
  }

  // Recursively scan directory
  scanDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath);

    entries.forEach((entry) => {
      const fullPath = path.join(dirPath, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.scanDirectory(fullPath);
      } else if (stat.isFile()) {
        this.scanFile(fullPath);
      }
    });
  }

  // Generate summary report
  generateReport() {
    const totalIssues =
      this.results.escapedNewlines.length +
      this.results.compressedFiles.length +
      this.results.encodingIssues.length +
      this.results.jsxSyntaxBreakage.length +
      this.results.formatIssues.length;

    const report = {
      summary: {
        totalFilesScanned: this.scannedFiles,
        totalIssuesFound: totalIssues,
        corruptedFiles: totalIssues,
      },
      categories: {
        escapedNewlines: {
          count: this.results.escapedNewlines.length,
          files: this.results.escapedNewlines,
        },
        compressedFiles: {
          count: this.results.compressedFiles.length,
          files: this.results.compressedFiles,
        },
        encodingIssues: {
          count: this.results.encodingIssues.length,
          files: this.results.encodingIssues,
        },
        jsxSyntaxBreakage: {
          count: this.results.jsxSyntaxBreakage.length,
          files: this.results.jsxSyntaxBreakage,
        },
        formatIssues: {
          count: this.results.formatIssues.length,
          files: this.results.formatIssues,
        },
      },
      timestamp: new Date().toISOString(),
    };

    return report;
  }

  // Run the complete scan
  run(rootDir = ".") {
    console.log("Starting corruption detection scan...");

    const startTime = Date.now();
    this.scanDirectory(rootDir);
    const endTime = Date.now();

    const report = this.generateReport();

    console.log(`\nScan completed in ${endTime - startTime}ms`);
    console.log(`Files scanned: ${report.summary.totalFilesScanned}`);
    console.log(`Issues found: ${report.summary.totalIssuesFound}`);

    console.log("\nBreakdown:");
    console.log(
      `  Escaped newlines: ${report.categories.escapedNewlines.count} files`,
    );
    console.log(
      `  Compressed files: ${report.categories.compressedFiles.count} files`,
    );
    console.log(
      `  Encoding issues: ${report.categories.encodingIssues.count} files`,
    );
    console.log(
      `  JSX syntax breakage: ${report.categories.jsxSyntaxBreakage.count} files`,
    );
    console.log(
      `  Format issues: ${report.categories.formatIssues.count} files`,
    );

    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const detector = new CorruptionDetector();
  const report = detector.run();

  // Save report to artifacts
  fs.writeFileSync(
    path.join(__dirname, "..", "artifacts", "corruption-report.json"),
    JSON.stringify(report, null, 2),
  );

  console.log("\nReport saved to artifacts/corruption-report.json");
}

module.exports = CorruptionDetector;
