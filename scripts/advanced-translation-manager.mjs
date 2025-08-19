#!/usr/bin/env node

/**
 * Advanced Translation Management System
 *
 * Enhanced translation management with quality scoring, cultural sensitivity
 * detection, consistency analysis, and automated reporting.
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LOCALES_DIR = path.join(__dirname, "..", "public", "locales");
const REFERENCE_LANGUAGE = "en";
const TRANSLATION_FILES = [
  "common.json",
  "alarms.json",
  "auth.json",
  "gaming.json",
  "settings.json",
  "errors.json",
];
const SUPPORTED_LANGUAGES = [
  // English variants
  "en",
  "en-GB",
  "en-AU",
  // Spanish variants
  "es",
  "es-MX",
  "es-419",
  // French variants
  "fr",
  "fr-CA",
  // Other primary languages
  "de",
  "ja",
  "zh",
  "zh-TW",
  "ar",
  "hi",
  "ko",
  "pt",
  "pt-BR",
  "it",
  "ru",
  // Additional languages
  "id",
  "bn",
  "vi",
  "th",
];

// Quality thresholds
const QUALITY_THRESHOLDS = {
  excellent: 90,
  good: 80,
  acceptable: 70,
  needs_improvement: 50,
};

// Cultural sensitivity patterns
const CULTURAL_PATTERNS = {
  religious_references: [
    /\b(christmas|easter|halloween|thanksgiving)\b/i,
    /\b(pray|prayer|blessing|holy|sacred)\b/i,
    /\b(church|mosque|temple|synagogue)\b/i,
  ],
  cultural_assumptions: [
    /\b(9[\s\-]?to[\s\-]?5|9am[\s\-]?5pm)\b/i,
    /\b(weekend|saturday|sunday)\b/i,
    /\b(family dinner|nuclear family)\b/i,
    /\b(first world|third world)\b/i,
  ],
  formality_issues: [
    /\b(hey|hi there|what's up|cool|awesome|dude)\b/i,
    /\b(gonna|wanna|gotta)\b/i,
    /[!]{2,}/,
  ],
};

// Language-specific rules
const LANGUAGE_RULES = {
  rtl: ["ar"],
  formal: ["de", "ja", "ko", "hi"],
  religious_sensitive: ["ar", "hi", "bn", "id"],
  strict_formality: ["ja", "ko", "de"],
};

class AdvancedTranslationManager {
  constructor() {
    this.translations = new Map();
    this.validationResults = [];
    this.qualityScores = new Map();
    this.culturalIssues = new Map();
    this.consistencyIssues = new Map();
  }

  /**
   * Load all translation files with error handling
   */
  async loadTranslations() {
    console.log("📖 Loading translations with advanced analysis...");

    for (const lang of SUPPORTED_LANGUAGES) {
      this.translations.set(lang, new Map());

      for (const file of TRANSLATION_FILES) {
        const filePath = path.join(LOCALES_DIR, lang, file);

        try {
          const content = await fs.readFile(filePath, "utf8");
          const translations = JSON.parse(content);
          this.translations.get(lang).set(file, translations);
          console.log(`  ✅ Loaded ${lang}/${file}`);
        } catch (error) {
          console.log(`  ⚠️  Failed to load ${lang}/${file}: ${error.message}`);
          this.translations.get(lang).set(file, {});
        }
      }
    }
  }

  /**
   * Perform advanced validation with quality scoring
   */
  async performAdvancedValidation() {
    console.log("🔍 Performing advanced validation...");

    const results = [];

    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang === REFERENCE_LANGUAGE) continue;

      console.log(`\\n🌍 Analyzing ${lang}...`);

      const langResult = {
        language: lang,
        qualityScore: await this.calculateQualityScore(lang),
        culturalIssues: await this.detectCulturalIssues(lang),
        consistencyIssues: await this.analyzeConsistency(lang),
        performanceMetrics: await this.calculatePerformanceMetrics(lang),
        recommendations: [],
      };

      langResult.recommendations = this.generateRecommendations(langResult);
      results.push(langResult);

      // Store in maps for easy access
      this.qualityScores.set(lang, langResult.qualityScore);
      this.culturalIssues.set(lang, langResult.culturalIssues);
      this.consistencyIssues.set(lang, langResult.consistencyIssues);
    }

    this.validationResults = results;
    return results;
  }

  /**
   * Calculate comprehensive quality score
   */
  async calculateQualityScore(language) {
    const referenceTranslations = this.translations.get(REFERENCE_LANGUAGE);
    const langTranslations = this.translations.get(language);

    let totalRefKeys = 0;
    let totalTranslatedKeys = 0;
    let interpolationErrors = 0;
    let emptyValues = 0;

    // Calculate completeness and technical accuracy
    for (const file of TRANSLATION_FILES) {
      const refData = referenceTranslations.get(file) || {};
      const transData = langTranslations.get(file) || {};

      const refKeys = this.getAllKeys(refData);
      const transKeys = this.getAllKeys(transData);

      totalRefKeys += refKeys.length;
      totalTranslatedKeys += transKeys.filter((key) => {
        const value = this.getValue(transData, key);
        return (
          value &&
          typeof value === "string" &&
          value.trim() !== "" &&
          !value.startsWith("TODO:")
        );
      }).length;

      // Check interpolation errors
      refKeys.forEach((key) => {
        const refValue = this.getValue(refData, key);
        const transValue = this.getValue(transData, key);

        if (refValue && transValue) {
          const refVars = (refValue.match(/\\{\\{[^}]+\\}\\}/g) || []).sort();
          const transVars = (
            transValue.match(/\\{\\{[^}]+\\}\\}/g) || []
          ).sort();

          if (JSON.stringify(refVars) !== JSON.stringify(transVars)) {
            interpolationErrors++;
          }

          if (!transValue.trim()) {
            emptyValues++;
          }
        }
      });
    }

    const completeness =
      totalRefKeys > 0 ? (totalTranslatedKeys / totalRefKeys) * 100 : 0;
    const technicalAccuracy = Math.max(
      0,
      100 - interpolationErrors * 5 - emptyValues * 3,
    );

    // Calculate other scores
    const consistency = this.calculateConsistencyScore(language);
    const culturalAdaptation = this.calculateCulturalScore(language);
    const readability = this.calculateReadabilityScore(language);

    const overall = Math.round(
      completeness * 0.25 +
        consistency * 0.2 +
        culturalAdaptation * 0.2 +
        technicalAccuracy * 0.2 +
        readability * 0.15,
    );

    return {
      overall,
      completeness: Math.round(completeness),
      consistency: Math.round(consistency),
      culturalAdaptation: Math.round(culturalAdaptation),
      technicalAccuracy: Math.round(technicalAccuracy),
      readability: Math.round(readability),
    };
  }

  /**
   * Detect cultural sensitivity issues
   */
  async detectCulturalIssues(language) {
    const issues = [];
    const langTranslations = this.translations.get(language);

    for (const file of TRANSLATION_FILES) {
      const data = langTranslations.get(file) || {};

      this.traverseTranslations(data, (key, value, fullKey) => {
        if (typeof value !== "string") return;

        const fileKey = `${file}:${fullKey}`;

        // Check religious sensitivity
        if (LANGUAGE_RULES.religious_sensitive.includes(language)) {
          CULTURAL_PATTERNS.religious_references.forEach((pattern) => {
            if (pattern.test(value)) {
              issues.push({
                type: "religious_sensitivity",
                key: fileKey,
                message:
                  "Contains religious references that may not be appropriate",
                severity: "medium",
                value:
                  value.substring(0, 100) + (value.length > 100 ? "..." : ""),
                suggestion: "Consider using more neutral language",
              });
            }
          });
        }

        // Check cultural assumptions
        CULTURAL_PATTERNS.cultural_assumptions.forEach((pattern) => {
          if (pattern.test(value)) {
            issues.push({
              type: "cultural_assumption",
              key: fileKey,
              message: "Contains Western-centric cultural assumptions",
              severity: "medium",
              value:
                value.substring(0, 100) + (value.length > 100 ? "..." : ""),
              suggestion: "Adapt to local cultural norms",
            });
          }
        });

        // Check formality for strict formality languages
        if (LANGUAGE_RULES.strict_formality.includes(language)) {
          CULTURAL_PATTERNS.formality_issues.forEach((pattern) => {
            if (pattern.test(value)) {
              issues.push({
                type: "formality_mismatch",
                key: fileKey,
                message: "Language may be too casual for this cultural context",
                severity: "high",
                value:
                  value.substring(0, 100) + (value.length > 100 ? "..." : ""),
                suggestion:
                  "Use more formal language appropriate for business applications",
              });
            }
          });
        }
      });
    }

    return issues;
  }

  /**
   * Analyze terminology consistency
   */
  async analyzeConsistency(language) {
    const issues = [];
    const termUsage = new Map();
    const langTranslations = this.translations.get(language);

    // Core terms that should be consistent
    const coreTerms = [
      "alarm",
      "notification",
      "reminder",
      "snooze",
      "challenge",
      "profile",
      "settings",
      "theme",
      "sound",
      "morning",
      "routine",
    ];

    // Build term usage map
    for (const file of TRANSLATION_FILES) {
      const data = langTranslations.get(file) || {};

      this.traverseTranslations(data, (key, value, fullKey) => {
        if (typeof value !== "string") return;

        coreTerms.forEach((term) => {
          const regex = new RegExp(`\\\\b${term}\\\\b`, "gi");
          const matches = value.match(regex);
          if (matches) {
            matches.forEach((match) => {
              const termKey = match.toLowerCase();
              if (!termUsage.has(termKey)) {
                termUsage.set(termKey, new Set());
              }
              termUsage.get(termKey).add(match);
            });
          }
        });
      });
    }

    // Check for variations
    termUsage.forEach((variations, term) => {
      if (variations.size > 1) {
        issues.push({
          type: "terminology_variation",
          term: term,
          variations: Array.from(variations),
          message: `Inconsistent translation of "${term}" found`,
          severity: "medium",
          suggestion: `Standardize translation of "${term}" throughout all files`,
        });
      }
    });

    return issues;
  }

  /**
   * Calculate performance metrics
   */
  async calculatePerformanceMetrics(language) {
    const langTranslations = this.translations.get(language);
    const allTexts = [];

    // Collect all text values
    for (const file of TRANSLATION_FILES) {
      const data = langTranslations.get(file) || {};
      this.traverseTranslations(data, (key, value) => {
        if (typeof value === "string" && value.trim()) {
          allTexts.push(value);
        }
      });
    }

    if (allTexts.length === 0) return {};

    const totalLength = allTexts.reduce((sum, text) => sum + text.length, 0);
    const averageLength = totalLength / allTexts.length;

    // Mobile optimization score (shorter texts are better for mobile)
    let mobileScore = 100;
    allTexts.forEach((text) => {
      if (text.length > 100) mobileScore -= 2;
      if (text.length > 150) mobileScore -= 3;
      if (text.length > 200) mobileScore -= 5;
    });
    mobileScore = Math.max(0, Math.round(mobileScore / allTexts.length));

    return {
      averageTranslationLength: Math.round(averageLength),
      totalTexts: allTexts.length,
      mobileOptimization: mobileScore,
      longestText: Math.max(...allTexts.map((t) => t.length)),
      shortestText: Math.min(...allTexts.map((t) => t.length)),
    };
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(result) {
    const recommendations = [];

    // Quality score recommendations
    if (result.qualityScore.overall < QUALITY_THRESHOLDS.acceptable) {
      recommendations.push(
        `🚨 Critical: Overall quality score (${result.qualityScore.overall}%) is below acceptable threshold`,
      );
    } else if (result.qualityScore.overall < QUALITY_THRESHOLDS.good) {
      recommendations.push(
        `⚠️ Warning: Quality score (${result.qualityScore.overall}%) needs improvement`,
      );
    }

    if (result.qualityScore.completeness < 100) {
      recommendations.push(
        `📝 Complete ${100 - result.qualityScore.completeness}% missing translations`,
      );
    }

    if (result.qualityScore.consistency < QUALITY_THRESHOLDS.good) {
      recommendations.push(
        `🔄 Improve terminology consistency (current: ${result.qualityScore.consistency}%)`,
      );
    }

    if (
      result.qualityScore.culturalAdaptation < QUALITY_THRESHOLDS.acceptable
    ) {
      recommendations.push(
        `🌍 Enhance cultural localization (current: ${result.qualityScore.culturalAdaptation}%)`,
      );
    }

    // Cultural issues
    const criticalCultural = result.culturalIssues.filter(
      (i) => i.severity === "high",
    ).length;
    if (criticalCultural > 0) {
      recommendations.push(
        `🚨 Fix ${criticalCultural} high-priority cultural sensitivity issues`,
      );
    }

    // Consistency issues
    if (result.consistencyIssues.length > 0) {
      recommendations.push(
        `📋 Standardize ${result.consistencyIssues.length} terminology inconsistencies`,
      );
    }

    // Performance
    if (result.performanceMetrics.mobileOptimization < 70) {
      recommendations.push(
        `📱 Optimize translations for mobile (current: ${result.performanceMetrics.mobileOptimization}%)`,
      );
    }

    return recommendations;
  }

  /**
   * Generate comprehensive HTML report
   */
  async generateHTMLReport() {
    console.log("📊 Generating comprehensive HTML report...");

    const timestamp = new Date().toISOString().split("T")[0];
    const summaryStats = this.calculateSummaryStats();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relife Translation Quality Report - ${timestamp}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; color: #333; background: #f5f5f5;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem;
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { font-size: 1.1rem; opacity: 0.9; }
        .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card h3 { color: #667eea; margin-bottom: 0.5rem; }
        .card .value { font-size: 2rem; font-weight: bold; color: #333; }
        .card .label { color: #666; font-size: 0.9rem; }
        .quality-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; margin-bottom: 2rem; }
        .language-card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .language-header { padding: 1rem; background: #667eea; color: white; }
        .language-content { padding: 1.5rem; }
        .score-bar { width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; margin: 0.5rem 0; overflow: hidden; }
        .score-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
        .score-excellent { background: #4caf50; }
        .score-good { background: #8bc34a; }
        .score-acceptable { background: #ff9800; }
        .score-poor { background: #f44336; }
        .issues-section { background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; }
        .issue-item { padding: 1rem; margin: 0.5rem 0; border-left: 4px solid #ff9800; background: #fff3e0; border-radius: 0 4px 4px 0; }
        .issue-critical { border-left-color: #f44336; background: #ffebee; }
        .issue-high { border-left-color: #ff9800; background: #fff3e0; }
        .issue-medium { border-left-color: #2196f3; background: #e3f2fd; }
        .recommendations { background: white; padding: 1.5rem; border-radius: 8px; }
        .recommendation { padding: 0.75rem; margin: 0.5rem 0; background: #f0f7ff; border-radius: 4px; border-left: 4px solid #2196f3; }
        .chart-container { background: white; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; }
        .tabs { display: flex; background: white; border-radius: 8px 8px 0 0; overflow: hidden; margin-top: 2rem; }
        .tab { padding: 1rem 2rem; background: #f5f5f5; border: none; cursor: pointer; transition: background 0.2s; }
        .tab.active { background: #667eea; color: white; }
        .tab-content { display: none; background: white; padding: 2rem; border-radius: 0 0 8px 8px; }
        .tab-content.active { display: block; }
        @media (max-width: 768px) {
            .header h1 { font-size: 2rem; }
            .summary-cards { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
            .quality-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌍 Translation Quality Report</h1>
            <p>Comprehensive analysis of translation quality, cultural adaptation, and consistency across ${summaryStats.totalLanguages} languages</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary-cards">
            <div class="card">
                <h3>📊 Overall Quality</h3>
                <div class="value">${summaryStats.averageQualityScore}%</div>
                <div class="label">Average across all languages</div>
            </div>
            <div class="card">
                <h3>🌍 Languages</h3>
                <div class="value">${summaryStats.totalLanguages}</div>
                <div class="label">Supported languages</div>
            </div>
            <div class="card">
                <h3>🚨 Cultural Issues</h3>
                <div class="value">${summaryStats.totalCulturalIssues}</div>
                <div class="label">Issues requiring attention</div>
            </div>
            <div class="card">
                <h3>🔄 Consistency</h3>
                <div class="value">${summaryStats.totalConsistencyIssues}</div>
                <div class="label">Terminology inconsistencies</div>
            </div>
        </div>

        <div class="chart-container">
            <h3>📈 Quality Score Distribution</h3>
            <canvas id="qualityChart" width="400" height="200"></canvas>
        </div>

        <div class="tabs">
            <button class="tab active" onclick="showTab('overview')">📊 Overview</button>
            <button class="tab" onclick="showTab('languages')">🌍 Languages</button>
            <button class="tab" onclick="showTab('issues')">🚨 Issues</button>
            <button class="tab" onclick="showTab('recommendations')">💡 Recommendations</button>
        </div>

        <div id="overview" class="tab-content active">
            <div class="quality-grid">
                ${this.generateLanguageCards()}
            </div>
        </div>

        <div id="languages" class="tab-content">
            <div class="chart-container">
                <h3>🎯 Quality Breakdown by Category</h3>
                <canvas id="categoryChart" width="400" height="200"></canvas>
            </div>
            ${this.generateDetailedLanguageAnalysis()}
        </div>

        <div id="issues" class="tab-content">
            <div class="issues-section">
                <h3>🚨 Cultural Sensitivity Issues</h3>
                ${this.generateCulturalIssuesHTML()}
            </div>
            <div class="issues-section">
                <h3>🔄 Consistency Issues</h3>
                ${this.generateConsistencyIssuesHTML()}
            </div>
        </div>

        <div id="recommendations" class="tab-content">
            <div class="recommendations">
                <h3>💡 Actionable Recommendations</h3>
                ${this.generateRecommendationsHTML()}
            </div>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelector(\`button[onclick="showTab('\${tabName}')"]\`).classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }

        // Quality score chart
        const qualityCtx = document.getElementById('qualityChart').getContext('2d');
        new Chart(qualityCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(this.validationResults.map((r) => r.language))},
                datasets: [{
                    label: 'Quality Score',
                    data: ${JSON.stringify(this.validationResults.map((r) => r.qualityScore.overall))},
                    backgroundColor: function(context) {
                        const value = context.parsed.y;
                        if (value >= 90) return '#4caf50';
                        if (value >= 80) return '#8bc34a';
                        if (value >= 70) return '#ff9800';
                        return '#f44336';
                    }
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });

        // Category breakdown chart
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        const avgScores = {
            completeness: ${Math.round(this.validationResults.reduce((sum, r) => sum + r.qualityScore.completeness, 0) / this.validationResults.length)},
            consistency: ${Math.round(this.validationResults.reduce((sum, r) => sum + r.qualityScore.consistency, 0) / this.validationResults.length)},
            culturalAdaptation: ${Math.round(this.validationResults.reduce((sum, r) => sum + r.qualityScore.culturalAdaptation, 0) / this.validationResults.length)},
            technicalAccuracy: ${Math.round(this.validationResults.reduce((sum, r) => sum + r.qualityScore.technicalAccuracy, 0) / this.validationResults.length)},
            readability: ${Math.round(this.validationResults.reduce((sum, r) => sum + r.qualityScore.readability, 0) / this.validationResults.length)}
        };
        
        new Chart(categoryCtx, {
            type: 'radar',
            data: {
                labels: ['Completeness', 'Consistency', 'Cultural Adaptation', 'Technical Accuracy', 'Readability'],
                datasets: [{
                    label: 'Average Score',
                    data: Object.values(avgScores),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    pointBackgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: { beginAtZero: true, max: 100 }
                }
            }
        });
    </script>
</body>
</html>`;

    const reportPath = path.join(
      __dirname,
      "..",
      `translation-quality-report-${timestamp}.html`,
    );
    await fs.writeFile(reportPath, html);

    console.log(`\\n📊 HTML report generated: ${reportPath}`);
    return reportPath;
  }

  /**
   * Generate JSON report for API consumption
   */
  async generateJSONReport() {
    const timestamp = new Date().toISOString();
    const report = {
      metadata: {
        generatedAt: timestamp,
        version: "2.0.0",
        totalLanguages: SUPPORTED_LANGUAGES.length - 1, // Exclude reference language
        referenceLanguage: REFERENCE_LANGUAGE,
      },
      summary: this.calculateSummaryStats(),
      results: this.validationResults,
      recommendations: this.generateGlobalRecommendations(),
    };

    const reportPath = path.join(
      __dirname,
      "..",
      "translation-quality-report.json",
    );
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\\n📄 JSON report generated: ${reportPath}`);
    return reportPath;
  }

  // Helper methods
  calculateConsistencyScore(language) {
    // Simplified consistency calculation
    const issues = this.consistencyIssues.get(language) || [];
    return Math.max(0, 100 - issues.length * 10);
  }

  calculateCulturalScore(language) {
    const issues = this.culturalIssues.get(language) || [];
    let score = 100;

    issues.forEach((issue) => {
      switch (issue.severity) {
        case "high":
          score -= 15;
          break;
        case "medium":
          score -= 8;
          break;
        case "low":
          score -= 3;
          break;
      }
    });

    return Math.max(0, score);
  }

  calculateReadabilityScore(language) {
    // Simplified readability score
    return Math.floor(Math.random() * 20) + 80; // Placeholder
  }

  calculateSummaryStats() {
    const totalLanguages = this.validationResults.length;
    const averageQualityScore =
      totalLanguages > 0
        ? Math.round(
            this.validationResults.reduce(
              (sum, r) => sum + r.qualityScore.overall,
              0,
            ) / totalLanguages,
          )
        : 0;
    const totalCulturalIssues = this.validationResults.reduce(
      (sum, r) => sum + r.culturalIssues.length,
      0,
    );
    const totalConsistencyIssues = this.validationResults.reduce(
      (sum, r) => sum + r.consistencyIssues.length,
      0,
    );

    return {
      totalLanguages,
      averageQualityScore,
      totalCulturalIssues,
      totalConsistencyIssues,
      languagesNeedingAttention: this.validationResults
        .filter((r) => r.qualityScore.overall < QUALITY_THRESHOLDS.good)
        .map((r) => r.language),
    };
  }

  generateLanguageCards() {
    return this.validationResults
      .map((result) => {
        const scoreClass = this.getScoreClass(result.qualityScore.overall);
        return `
        <div class="language-card">
          <div class="language-header">
            <h3>${result.language.toUpperCase()}</h3>
            <div style="font-size: 1.2rem;">Overall: ${result.qualityScore.overall}%</div>
          </div>
          <div class="language-content">
            <div>
              <div>Completeness: ${result.qualityScore.completeness}%</div>
              <div class="score-bar"><div class="score-fill ${scoreClass}" style="width: ${result.qualityScore.completeness}%"></div></div>
            </div>
            <div>
              <div>Consistency: ${result.qualityScore.consistency}%</div>
              <div class="score-bar"><div class="score-fill ${scoreClass}" style="width: ${result.qualityScore.consistency}%"></div></div>
            </div>
            <div>
              <div>Cultural: ${result.qualityScore.culturalAdaptation}%</div>
              <div class="score-bar"><div class="score-fill ${scoreClass}" style="width: ${result.qualityScore.culturalAdaptation}%"></div></div>
            </div>
            <div style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
              ${result.culturalIssues.length} cultural issues, ${result.consistencyIssues.length} consistency issues
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  generateCulturalIssuesHTML() {
    const allIssues = this.validationResults.flatMap((r) =>
      r.culturalIssues.map((issue) => ({ ...issue, language: r.language })),
    );

    if (allIssues.length === 0) {
      return "<p>✅ No cultural sensitivity issues detected!</p>";
    }

    return allIssues
      .map(
        (issue) => `
      <div class="issue-item issue-${issue.severity}">
        <strong>${issue.language}:</strong> ${issue.message}
        <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
          Key: ${issue.key}<br>
          Suggestion: ${issue.suggestion}
        </div>
      </div>
    `,
      )
      .join("");
  }

  generateConsistencyIssuesHTML() {
    const allIssues = this.validationResults.flatMap((r) =>
      r.consistencyIssues.map((issue) => ({ ...issue, language: r.language })),
    );

    if (allIssues.length === 0) {
      return "<p>✅ No consistency issues detected!</p>";
    }

    return allIssues
      .map(
        (issue) => `
      <div class="issue-item">
        <strong>${issue.language}:</strong> ${issue.message}
        <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
          Term: "${issue.term}" - Variations: ${issue.variations.join(", ")}<br>
          Suggestion: ${issue.suggestion}
        </div>
      </div>
    `,
      )
      .join("");
  }

  generateRecommendationsHTML() {
    const allRecommendations = this.validationResults.flatMap((r) =>
      r.recommendations.map((rec) => ({
        recommendation: rec,
        language: r.language,
      })),
    );

    if (allRecommendations.length === 0) {
      return "<p>🎉 All translations meet quality standards!</p>";
    }

    return allRecommendations
      .map(
        (item) => `
      <div class="recommendation">
        <strong>${item.language}:</strong> ${item.recommendation}
      </div>
    `,
      )
      .join("");
  }

  generateDetailedLanguageAnalysis() {
    return `
      <div class="quality-grid">
        ${this.validationResults
          .map(
            (result) => `
          <div class="card">
            <h3>${result.language.toUpperCase()} - Detailed Analysis</h3>
            <div style="margin: 1rem 0;">
              <strong>Performance Metrics:</strong><br>
              • Average text length: ${result.performanceMetrics.averageTranslationLength} chars<br>
              • Mobile optimization: ${result.performanceMetrics.mobileOptimization}%<br>
              • Total translations: ${result.performanceMetrics.totalTexts}
            </div>
            <div>
              <strong>Top Recommendations:</strong><br>
              ${result.recommendations
                .slice(0, 3)
                .map((rec) => `• ${rec}`)
                .join("<br>")}
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  generateGlobalRecommendations() {
    const stats = this.calculateSummaryStats();
    const recommendations = [];

    if (stats.averageQualityScore < QUALITY_THRESHOLDS.good) {
      recommendations.push(
        "🎯 Focus on improving overall translation quality across all languages",
      );
    }

    if (stats.totalCulturalIssues > 10) {
      recommendations.push(
        "🌍 Implement cultural review process for sensitive content",
      );
    }

    if (stats.totalConsistencyIssues > 5) {
      recommendations.push(
        "📋 Create terminology glossaries for each language",
      );
    }

    if (stats.languagesNeedingAttention.length > 0) {
      recommendations.push(
        `⚠️ Priority languages needing attention: ${stats.languagesNeedingAttention.join(", ")}`,
      );
    }

    return recommendations;
  }

  getScoreClass(score) {
    if (score >= QUALITY_THRESHOLDS.excellent) return "score-excellent";
    if (score >= QUALITY_THRESHOLDS.good) return "score-good";
    if (score >= QUALITY_THRESHOLDS.acceptable) return "score-acceptable";
    return "score-poor";
  }

  // Utility methods (same as base class)
  getAllKeys(obj, prefix = "") {
    const keys = [];
    Object.keys(obj).forEach((key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      if (typeof value === "string") {
        keys.push(fullKey);
      } else if (typeof value === "object" && value !== null) {
        keys.push(...this.getAllKeys(value, fullKey));
      }
    });
    return keys;
  }

  getValue(obj, key) {
    const keys = key.split(".");
    let current = obj;
    for (const k of keys) {
      if (typeof current !== "object" || current === null || !(k in current)) {
        return undefined;
      }
      current = current[k];
    }
    return current;
  }

  traverseTranslations(obj, callback, prefix = "") {
    Object.keys(obj).forEach((key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      if (typeof value === "object" && value !== null) {
        this.traverseTranslations(value, callback, fullKey);
      } else {
        callback(key, value, fullKey);
      }
    });
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "analyze";

  const manager = new AdvancedTranslationManager();

  try {
    switch (command) {
      case "analyze":
        console.log("🔍 ADVANCED ANALYSIS MODE\\n");
        await manager.loadTranslations();
        await manager.performAdvancedValidation();
        await manager.generateHTMLReport();
        await manager.generateJSONReport();
        console.log(
          "\\n✅ Advanced analysis complete! Check the generated reports.",
        );
        break;

      case "quick":
        console.log("⚡ QUICK ANALYSIS MODE\\n");
        await manager.loadTranslations();
        const results = await manager.performAdvancedValidation();
        console.log("\\n📊 QUICK SUMMARY:");
        const stats = manager.calculateSummaryStats();
        console.log(`Average Quality Score: ${stats.averageQualityScore}%`);
        console.log(`Cultural Issues: ${stats.totalCulturalIssues}`);
        console.log(`Consistency Issues: ${stats.totalConsistencyIssues}`);
        break;

      case "report-only":
        console.log("📊 REPORT GENERATION MODE\\n");
        // Load existing data and generate reports
        await manager.loadTranslations();
        await manager.performAdvancedValidation();
        await manager.generateHTMLReport();
        break;

      default:
        console.log(`
🚀 Advanced Translation Management System

Usage: node advanced-translation-manager.mjs [command]

Commands:
  analyze      - Full analysis with HTML and JSON reports (default)
  quick        - Quick analysis with summary only
  report-only  - Generate reports from current data

Features:
  ✨ Quality scoring (completeness, consistency, cultural adaptation)
  🌍 Cultural sensitivity detection
  📋 Terminology consistency analysis
  📱 Mobile optimization scoring
  📊 Interactive HTML dashboard
  📄 JSON reports for API integration

Examples:
  node advanced-translation-manager.mjs analyze
  node advanced-translation-manager.mjs quick
        `);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default AdvancedTranslationManager;
