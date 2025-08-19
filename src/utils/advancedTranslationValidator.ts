/**
 * Advanced Translation Validation System
 *
 * Enhanced validation tools with quality scoring, cultural sensitivity detection,
 * consistency analysis, and performance metrics for the Relife translation system.
 */

import { SupportedLanguage, SUPPORTED_LANGUAGES } from "../config/i18n";

// Enhanced validation result interfaces
export interface QualityScore {
  overall: number; // 0-100
  completeness: number;
  consistency: number;
  culturalAdaptation: number;
  technicalAccuracy: number;
  readability: number;
}

export interface CulturalIssue {
  type:
    | "inappropriate_reference"
    | "cultural_assumption"
    | "religious_sensitivity"
    | "formality_mismatch"
    | "time_format"
    | "currency_assumption";
  key: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  suggestion?: string;
  culturalContext: string;
}

export interface ConsistencyIssue {
  type:
    | "terminology_variation"
    | "tone_inconsistency"
    | "formatting_difference"
    | "style_mismatch";
  keys: string[];
  message: string;
  examples: { key: string; value: string }[];
  suggestedFix: string;
}

export interface AdvancedValidationResult {
  language: SupportedLanguage;
  qualityScore: QualityScore;
  culturalIssues: CulturalIssue[];
  consistencyIssues: ConsistencyIssue[];
  performanceMetrics: PerformanceMetrics;
  recommendations: string[];
  lastValidated: Date;
}

export interface PerformanceMetrics {
  averageTranslationLength: number;
  readabilityScore: number; // Flesch-Kincaid equivalent
  complexityRating: "simple" | "moderate" | "complex";
  estimatedReadingTime: number; // seconds
  mobileOptimization: number; // 0-100 score
}

// Cultural patterns and rules
const CULTURAL_PATTERNS = {
  // Religious and cultural sensitivity patterns
  religious_references: [
    /\b(christmas|easter|halloween|thanksgiving)\b/i,
    /\b(pray|prayer|blessing|holy|sacred)\b/i,
    /\b(church|mosque|temple|synagogue)\b/i,
  ],

  // Cultural assumptions (Western-centric)
  cultural_assumptions: [
    /\b(9[\s\-]?to[\s\-]?5|9am[\s\-]?5pm)\b/i, // Work hours
    /\b(weekend|saturday|sunday)\b/i, // Weekend assumptions
    /\b(family dinner|nuclear family)\b/i, // Family structure
    /\b(first world|third world)\b/i, // Outdated terminology
  ],

  // Inappropriate references
  inappropriate_content: [
    /\b(drinking|alcohol|wine|beer|cocktail)\b/i,
    /\b(dating|romantic|relationship)\b/i, // May not be appropriate in all cultures
    /\b(pork|beef|meat)\b/i, // Dietary restrictions
  ],

  // Formality mismatches (detect overly casual language)
  formality_issues: [
    /\b(hey|hi there|what's up|cool|awesome|dude)\b/i,
    /\b(gonna|wanna|gotta)\b/i,
    /[!]{2,}/, // Multiple exclamation marks
  ],
};

// Language-specific patterns
const LANGUAGE_SPECIFIC_RULES = {
  // RTL languages
  rtl: ["ar"],

  // Formal languages (require more formal tone)
  formal: ["de", "ja", "ko", "hi"],

  // Languages with complex pluralization
  complex_plurals: ["ru", "ar", "hi", "bn"],

  // Languages sensitive to religious content
  religious_sensitive: ["ar", "hi", "bn", "id"],

  // Languages with strict formality rules
  strict_formality: ["ja", "ko", "de"],
};

// Terminology consistency patterns
const TERMINOLOGY_PATTERNS = {
  // Core app terms that should be consistent
  core_terms: [
    "alarm",
    "notification",
    "reminder",
    "snooze",
    "challenge",
    "profile",
    "settings",
    "theme",
    "sound",
    "vibration",
    "morning",
    "routine",
    "goal",
    "achievement",
    "streak",
  ],

  // UI elements that should be consistent
  ui_elements: [
    "button",
    "menu",
    "tab",
    "screen",
    "page",
    "dialog",
    "save",
    "cancel",
    "ok",
    "yes",
    "no",
    "confirm",
  ],

  // Time-related terms
  time_terms: [
    "morning",
    "afternoon",
    "evening",
    "night",
    "hour",
    "minute",
    "second",
    "day",
    "week",
    "month",
  ],
};

export class AdvancedTranslationValidator {
  private referenceLanguage: SupportedLanguage = "en";
  private validationCache: Map<string, AdvancedValidationResult> = new Map();
  private terminologyMap: Map<SupportedLanguage, Map<string, string[]>> =
    new Map();

  constructor(referenceLanguage: SupportedLanguage = "en") {
    this.referenceLanguage = referenceLanguage;
    this.buildTerminologyMaps();
  }

  /**
   * Perform comprehensive validation with quality scoring
   */
  public async validateAdvanced(
    language: SupportedLanguage,
    translations: Record<string, any>,
    referenceTranslations: Record<string, any>,
  ): Promise<AdvancedValidationResult> {
    console.log(`🔍 Running advanced validation for ${language}...`);

    const result: AdvancedValidationResult = {
      language,
      qualityScore: this.calculateQualityScore(
        translations,
        referenceTranslations,
        language,
      ),
      culturalIssues: this.detectCulturalIssues(translations, language),
      consistencyIssues: this.analyzeConsistency(translations, language),
      performanceMetrics: this.calculatePerformanceMetrics(
        translations,
        language,
      ),
      recommendations: [],
      lastValidated: new Date(),
    };

    // Generate recommendations based on findings
    result.recommendations = this.generateRecommendations(result);

    // Cache result
    this.validationCache.set(language, result);

    return result;
  }

  /**
   * Calculate comprehensive quality score (0-100)
   */
  private calculateQualityScore(
    translations: Record<string, any>,
    reference: Record<string, any>,
    language: SupportedLanguage,
  ): QualityScore {
    const completeness = this.calculateCompleteness(translations, reference);
    const consistency = this.calculateConsistency(translations, language);
    const culturalAdaptation = this.calculateCulturalAdaptation(
      translations,
      language,
    );
    const technicalAccuracy = this.calculateTechnicalAccuracy(
      translations,
      reference,
    );
    const readability = this.calculateReadability(translations, language);

    const overall = Math.round(
      completeness * 0.25 +
        consistency * 0.2 +
        culturalAdaptation * 0.2 +
        technicalAccuracy * 0.2 +
        readability * 0.15,
    );

    return {
      overall,
      completeness,
      consistency,
      culturalAdaptation,
      technicalAccuracy,
      readability,
    };
  }

  /**
   * Detect cultural sensitivity issues
   */
  private detectCulturalIssues(
    translations: Record<string, any>,
    language: SupportedLanguage,
  ): CulturalIssue[] {
    const issues: CulturalIssue[] = [];
    const langInfo = SUPPORTED_LANGUAGES[language];

    this.traverseTranslations(translations, (key, value) => {
      if (typeof value !== "string") return;

      // Check religious sensitivity
      if (LANGUAGE_SPECIFIC_RULES.religious_sensitive.includes(language)) {
        CULTURAL_PATTERNS.religious_references.forEach((pattern) => {
          if (pattern.test(value)) {
            issues.push({
              type: "religious_sensitivity",
              key,
              message:
                "Contains religious references that may not be appropriate",
              severity: "medium",
              suggestion:
                "Consider using more neutral language or cultural alternatives",
              culturalContext: `${langInfo.nativeName} culture may have different religious practices`,
            });
          }
        });
      }

      // Check cultural assumptions
      CULTURAL_PATTERNS.cultural_assumptions.forEach((pattern) => {
        if (pattern.test(value)) {
          issues.push({
            type: "cultural_assumption",
            key,
            message: "Contains Western-centric cultural assumptions",
            severity: "medium",
            suggestion: "Adapt to local cultural norms and practices",
            culturalContext: `Consider ${langInfo.region} cultural context`,
          });
        }
      });

      // Check formality for strict formality languages
      if (LANGUAGE_SPECIFIC_RULES.strict_formality.includes(language)) {
        CULTURAL_PATTERNS.formality_issues.forEach((pattern) => {
          if (pattern.test(value)) {
            issues.push({
              type: "formality_mismatch",
              key,
              message: "Language may be too casual for this cultural context",
              severity: "high",
              suggestion:
                "Use more formal language appropriate for business applications",
              culturalContext: `${langInfo.nativeName} culture typically uses formal language in apps`,
            });
          }
        });
      }

      // Check time format assumptions
      if (value.includes("AM") || value.includes("PM")) {
        if (langInfo.timeFormat === "24h") {
          issues.push({
            type: "time_format",
            key,
            message: "Uses 12-hour time format in 24-hour time culture",
            severity: "low",
            suggestion: "Consider using 24-hour format or make format dynamic",
            culturalContext: `${langInfo.region} typically uses 24-hour time format`,
          });
        }
      }
    });

    return issues;
  }

  /**
   * Analyze terminology and style consistency
   */
  private analyzeConsistency(
    translations: Record<string, any>,
    language: SupportedLanguage,
  ): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const termUsage = new Map<string, { key: string; value: string }[]>();

    // Build terminology usage map
    this.traverseTranslations(translations, (key, value) => {
      if (typeof value !== "string") return;

      TERMINOLOGY_PATTERNS.core_terms.forEach((term) => {
        const regex = new RegExp(`\\b${term}\\b`, "gi");
        const matches = value.match(regex);
        if (matches) {
          matches.forEach((match) => {
            if (!termUsage.has(match.toLowerCase())) {
              termUsage.set(match.toLowerCase(), []);
            }
            termUsage.get(match.toLowerCase())!.push({ key, value });
          });
        }
      });
    });

    // Check for terminology variations
    termUsage.forEach((usages, term) => {
      const variations = new Set(
        usages.map((u) => this.extractTermVariation(u.value, term)),
      );
      if (variations.size > 1) {
        issues.push({
          type: "terminology_variation",
          keys: usages.map((u) => u.key),
          message: `Inconsistent translation of "${term}" found`,
          examples: Array.from(variations).map((variation) => ({
            key: usages.find(
              (u) => this.extractTermVariation(u.value, term) === variation,
            )!.key,
            value: variation,
          })),
          suggestedFix: `Standardize translation of "${term}" throughout all files`,
        });
      }
    });

    return issues;
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    translations: Record<string, any>,
    language: SupportedLanguage,
  ): PerformanceMetrics {
    const allTexts: string[] = [];
    this.traverseTranslations(translations, (key, value) => {
      if (typeof value === "string") allTexts.push(value);
    });

    const totalLength = allTexts.reduce((sum, text) => sum + text.length, 0);
    const averageLength = totalLength / allTexts.length;

    const readabilityScore = this.calculateReadabilityScore(allTexts, language);
    const complexityRating = this.determineComplexityRating(allTexts);
    const estimatedReadingTime = this.calculateReadingTime(allTexts, language);
    const mobileOptimization = this.calculateMobileOptimization(allTexts);

    return {
      averageTranslationLength: Math.round(averageLength),
      readabilityScore,
      complexityRating,
      estimatedReadingTime,
      mobileOptimization,
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(result: AdvancedValidationResult): string[] {
    const recommendations: string[] = [];

    // Quality score recommendations
    if (result.qualityScore.overall < 80) {
      recommendations.push(
        `🎯 Overall quality score (${result.qualityScore.overall}%) needs improvement`,
      );
    }

    if (result.qualityScore.completeness < 100) {
      recommendations.push(
        `📝 Complete missing translations (${100 - result.qualityScore.completeness}% remaining)`,
      );
    }

    if (result.qualityScore.consistency < 80) {
      recommendations.push(`🔄 Improve terminology consistency across files`);
    }

    if (result.qualityScore.culturalAdaptation < 70) {
      recommendations.push(
        `🌍 Enhance cultural localization beyond literal translation`,
      );
    }

    // Cultural issues recommendations
    const criticalCultural = result.culturalIssues.filter(
      (i) => i.severity === "critical",
    ).length;
    const highCultural = result.culturalIssues.filter(
      (i) => i.severity === "high",
    ).length;

    if (criticalCultural > 0) {
      recommendations.push(
        `🚨 Fix ${criticalCultural} critical cultural sensitivity issues`,
      );
    }
    if (highCultural > 0) {
      recommendations.push(
        `⚠️ Address ${highCultural} high-priority cultural issues`,
      );
    }

    // Consistency recommendations
    if (result.consistencyIssues.length > 0) {
      recommendations.push(
        `📋 Standardize ${result.consistencyIssues.length} terminology inconsistencies`,
      );
    }

    // Performance recommendations
    if (result.performanceMetrics.mobileOptimization < 70) {
      recommendations.push(
        `📱 Optimize translations for mobile display (current: ${result.performanceMetrics.mobileOptimization}%)`,
      );
    }

    if (result.performanceMetrics.complexityRating === "complex") {
      recommendations.push(
        `✂️ Simplify complex language for better user comprehension`,
      );
    }

    return recommendations;
  }

  // Helper methods for calculations
  private calculateCompleteness(translations: any, reference: any): number {
    const refKeys = this.getAllKeys(reference);
    const transKeys = this.getAllKeys(translations);
    return Math.round((transKeys.length / refKeys.length) * 100);
  }

  private calculateConsistency(
    translations: any,
    language: SupportedLanguage,
  ): number {
    // Simplified consistency calculation based on terminology usage
    const termMap = this.terminologyMap.get(language) || new Map();
    let consistencyScore = 100;

    // Deduct points for each inconsistent term usage
    termMap.forEach((variations) => {
      if (variations.length > 1) {
        consistencyScore -= 5; // Deduct 5 points per inconsistent term
      }
    });

    return Math.max(0, consistencyScore);
  }

  private calculateCulturalAdaptation(
    translations: any,
    language: SupportedLanguage,
  ): number {
    const issues = this.detectCulturalIssues(translations, language);
    let score = 100;

    issues.forEach((issue) => {
      switch (issue.severity) {
        case "critical":
          score -= 20;
          break;
        case "high":
          score -= 10;
          break;
        case "medium":
          score -= 5;
          break;
        case "low":
          score -= 2;
          break;
      }
    });

    return Math.max(0, score);
  }

  private calculateTechnicalAccuracy(
    translations: any,
    reference: any,
  ): number {
    // Check for interpolation variable preservation
    let score = 100;
    let errors = 0;

    this.traverseTranslations(reference, (key, refValue) => {
      if (typeof refValue !== "string") return;

      const transValue = this.getValue(translations, key);
      if (typeof transValue !== "string") return;

      // Check interpolation variables
      const refVars = (refValue.match(/\{\{[^}]+\}\}/g) || []).sort();
      const transVars = (transValue.match(/\{\{[^}]+\}\}/g) || []).sort();

      if (JSON.stringify(refVars) !== JSON.stringify(transVars)) {
        errors++;
      }
    });

    return Math.max(0, score - errors * 5);
  }

  private calculateReadability(
    translations: any,
    language: SupportedLanguage,
  ): number {
    const texts: string[] = [];
    this.traverseTranslations(translations, (key, value) => {
      if (typeof value === "string") texts.push(value);
    });

    return this.calculateReadabilityScore(texts, language);
  }

  private calculateReadabilityScore(
    texts: string[],
    language: SupportedLanguage,
  ): number {
    // Simplified readability score based on sentence length and complexity
    let totalScore = 0;

    texts.forEach((text) => {
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const avgSentenceLength =
        text.split(/\s+/).length / Math.max(sentences.length, 1);

      // Score based on sentence length (shorter is better for mobile)
      let score = 100;
      if (avgSentenceLength > 20) score -= 20;
      if (avgSentenceLength > 15) score -= 10;
      if (avgSentenceLength > 10) score -= 5;

      totalScore += Math.max(0, score);
    });

    return Math.round(totalScore / texts.length);
  }

  private determineComplexityRating(
    texts: string[],
  ): "simple" | "moderate" | "complex" {
    let totalComplexity = 0;

    texts.forEach((text) => {
      const words = text.split(/\s+/);
      const avgWordLength =
        words.reduce((sum, word) => sum + word.length, 0) / words.length;
      const sentenceLength = text.split(/[.!?]+/).length;

      let complexity = 0;
      if (avgWordLength > 8) complexity += 2;
      if (avgWordLength > 6) complexity += 1;
      if (sentenceLength > 3) complexity += 1;

      totalComplexity += complexity;
    });

    const avgComplexity = totalComplexity / texts.length;

    if (avgComplexity < 1.5) return "simple";
    if (avgComplexity < 3) return "moderate";
    return "complex";
  }

  private calculateReadingTime(
    texts: string[],
    language: SupportedLanguage,
  ): number {
    const totalWords = texts.reduce(
      (sum, text) =>
        sum + text.split(/\s+/).filter((word) => word.length > 0).length,
      0,
    );

    // Reading speeds vary by language and script complexity
    const wordsPerMinute = this.getReadingSpeedForLanguage(language);

    return Math.round((totalWords / wordsPerMinute) * 60); // Convert to seconds
  }

  private calculateMobileOptimization(texts: string[]): number {
    let score = 100;

    texts.forEach((text) => {
      // Penalize very long strings (bad for mobile)
      if (text.length > 100) score -= 5;
      if (text.length > 150) score -= 10;
      if (text.length > 200) score -= 15;

      // Penalize strings without spaces (can't wrap)
      if (text.length > 30 && !text.includes(" ")) score -= 10;
    });

    return Math.max(0, Math.round(score / texts.length));
  }

  private getReadingSpeedForLanguage(language: SupportedLanguage): number {
    // Average reading speeds (words per minute) by language/script
    const speeds: Record<string, number> = {
      en: 200,
      es: 180,
      fr: 190,
      de: 170,
      it: 175,
      pt: 185,
      ru: 160,
      ja: 120,
      zh: 130,
      "zh-TW": 125,
      ko: 140,
      ar: 120,
      hi: 140,
      bn: 135,
      th: 130,
      vi: 150,
      id: 160,
    };

    return speeds[language] || 150; // Default fallback
  }

  private buildTerminologyMaps(): void {
    // This would be built from actual translation analysis
    // For now, initialize empty maps
    Object.keys(SUPPORTED_LANGUAGES).forEach((lang) => {
      this.terminologyMap.set(lang as SupportedLanguage, new Map());
    });
  }

  private extractTermVariation(text: string, term: string): string {
    const regex = new RegExp(`\\b([\\w]*${term}[\\w]*)\\b`, "gi");
    const match = text.match(regex);
    return match ? match[0].toLowerCase() : term;
  }

  private traverseTranslations(
    obj: any,
    callback: (key: string, value: any, fullKey?: string) => void,
    prefix = "",
  ): void {
    Object.keys(obj).forEach((key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        this.traverseTranslations(value, callback, fullKey);
      } else {
        callback(fullKey, value, fullKey);
      }
    });
  }

  private getAllKeys(obj: any, prefix = ""): string[] {
    const keys: string[] = [];

    Object.keys(obj).forEach((key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        keys.push(...this.getAllKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    });

    return keys;
  }

  private getValue(obj: any, path: string): any {
    return path
      .split(".")
      .reduce((current, key) => current && current[key], obj);
  }

  /**
   * Export validation results for dashboard
   */
  public exportResults(): Record<SupportedLanguage, AdvancedValidationResult> {
    const results: Record<string, AdvancedValidationResult> = {};

    this.validationCache.forEach((result, language) => {
      results[language] = result;
    });

    return results as Record<SupportedLanguage, AdvancedValidationResult>;
  }

  /**
   * Get summary statistics across all languages
   */
  public getSummaryStats(): {
    totalLanguages: number;
    averageQualityScore: number;
    totalCulturalIssues: number;
    totalConsistencyIssues: number;
    languagesNeedingAttention: SupportedLanguage[];
  } {
    const results = Array.from(this.validationCache.values());

    const totalLanguages = results.length;
    const averageQualityScore =
      results.reduce((sum, r) => sum + r.qualityScore.overall, 0) /
      totalLanguages;
    const totalCulturalIssues = results.reduce(
      (sum, r) => sum + r.culturalIssues.length,
      0,
    );
    const totalConsistencyIssues = results.reduce(
      (sum, r) => sum + r.consistencyIssues.length,
      0,
    );
    const languagesNeedingAttention = results
      .filter(
        (r) =>
          r.qualityScore.overall < 80 ||
          r.culturalIssues.some((i) => i.severity === "critical"),
      )
      .map((r) => r.language);

    return {
      totalLanguages,
      averageQualityScore: Math.round(averageQualityScore),
      totalCulturalIssues,
      totalConsistencyIssues,
      languagesNeedingAttention,
    };
  }
}

export default AdvancedTranslationValidator;
