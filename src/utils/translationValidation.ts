/**
 * Translation validation utilities
 * Helps ensure consistency and completeness across all language files
 */

import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../config/i18n';

// Define the expected structure of translation files
export interface TranslationStructure {
  [key: string]: string | TranslationStructure;
}

// Define validation results
export interface ValidationResult {
  language: SupportedLanguage;
  file: string;
  issues: ValidationIssue[];
  completeness: number; // Percentage of translated keys
  totalKeys: number;
  translatedKeys: number;
}

export interface ValidationIssue {
  type: 'missing_key' | 'empty_value' | 'invalid_interpolation' | 'inconsistent_structure' | 'suspicious_translation';
  key: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// Known interpolation patterns
const INTERPOLATION_PATTERNS = [
  /\{\{(\w+)\}\}/g, // {{variable}}
  /\{(\w+)\}/g,     // {variable}
  /\$t\(['"]([\w:.]+)['"]\)/g, // $t('key')
];

export class TranslationValidator {
  private referenceLanguage: SupportedLanguage = 'en';
  private validationResults: ValidationResult[] = [];

  constructor(referenceLanguage: SupportedLanguage = 'en') {
    this.referenceLanguage = referenceLanguage;
  }

  /**
   * Validate a translation object against the reference language
   */
  public validateTranslation(
    language: SupportedLanguage,
    fileName: string,
    translations: TranslationStructure,
    referenceTranslations: TranslationStructure
  ): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Get all keys from reference
    const referenceKeys = this.getAllKeys(referenceTranslations);
    const translationKeys = this.getAllKeys(translations);

    // Check for missing keys
    referenceKeys.forEach(key => {
      if (!this.hasKey(translations, key)) {
        issues.push({
          type: 'missing_key',
          key,
          message: `Missing translation for key: ${key}`,
          severity: 'error'
        });
      }
    });

    // Check for empty values
    translationKeys.forEach(key => {
      const value = this.getValue(translations, key);
      if (typeof value === 'string' && value.trim() === '') {
        issues.push({
          type: 'empty_value',
          key,
          message: `Empty translation value for key: ${key}`,
          severity: 'warning'
        });
      }
    });

    // Check for interpolation consistency
    this.validateInterpolations(translations, referenceTranslations, issues);

    // Check for suspicious translations (same as key or reference)
    this.validateSuspiciousTranslations(translations, referenceTranslations, issues);

    // Calculate completeness
    const totalKeys = referenceKeys.length;
    const translatedKeys = referenceKeys.filter(key => {
      const value = this.getValue(translations, key);
      return value && typeof value === 'string' && value.trim() !== '';
    }).length;

    const completeness = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0;

    return {
      language,
      file: fileName,
      issues,
      completeness,
      totalKeys,
      translatedKeys
    };
  }

  /**
   * Validate interpolations between translations and reference
   */
  private validateInterpolations(
    translations: TranslationStructure,
    referenceTranslations: TranslationStructure,
    issues: ValidationIssue[]
  ) {
    const checkInterpolation = (key: string, value: string, referenceValue: string) => {
      INTERPOLATION_PATTERNS.forEach(pattern => {
        const translationMatches = value.match(pattern) || [];
        const referenceMatches = referenceValue.match(pattern) || [];

        // Check if interpolation variables match
        const translationVars = translationMatches.map(match => match.replace(pattern, '$1'));
        const referenceVars = referenceMatches.map(match => match.replace(pattern, '$1'));

        const missingInTranslation = referenceVars.filter(v => !translationVars.includes(v));
        const extraInTranslation = translationVars.filter(v => !referenceVars.includes(v));

        if (missingInTranslation.length > 0) {
          issues.push({
            type: 'invalid_interpolation',
            key,
            message: `Missing interpolation variables: ${missingInTranslation.join(', ')}`,
            severity: 'error'
          });
        }

        if (extraInTranslation.length > 0) {
          issues.push({
            type: 'invalid_interpolation',
            key,
            message: `Extra interpolation variables: ${extraInTranslation.join(', ')}`,
            severity: 'warning'
          });
        }
      });
    };

    this.traverseTranslations(translations, referenceTranslations, checkInterpolation);
  }

  /**
   * Validate for suspicious translations
   */
  private validateSuspiciousTranslations(
    translations: TranslationStructure,
    referenceTranslations: TranslationStructure,
    issues: ValidationIssue[]
  ) {
    const checkSuspicious = (key: string, value: string, referenceValue: string) => {
      // Check if translation is the same as the key
      if (value === key) {
        issues.push({
          type: 'suspicious_translation',
          key,
          message: 'Translation is the same as the key, might be missing',
          severity: 'warning'
        });
      }

      // Check if translation is the same as reference (for non-English languages)
      if (this.referenceLanguage === 'en' && value === referenceValue && value.length > 3) {
        issues.push({
          type: 'suspicious_translation',
          key,
          message: 'Translation is the same as English, might need localization',
          severity: 'info'
        });
      }
    };

    this.traverseTranslations(translations, referenceTranslations, checkSuspicious);
  }

  /**
   * Traverse translation structures and apply callback
   */
  private traverseTranslations(
    translations: TranslationStructure,
    referenceTranslations: TranslationStructure,
    callback: (key: string, value: string, referenceValue: string) => void,
    prefix: string = ''
  ) {
    Object.keys(referenceTranslations).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const refValue = referenceTranslations[key];
      const translatedValue = translations[key];

      if (typeof refValue === 'string' && typeof translatedValue === 'string') {
        callback(fullKey, translatedValue, refValue);
      } else if (typeof refValue === 'object' && typeof translatedValue === 'object') {
        this.traverseTranslations(
          translatedValue as TranslationStructure,
          refValue as TranslationStructure,
          callback,
          fullKey
        );
      }
    });
  }

  /**
   * Get all keys from a translation object (flattened)
   */
  private getAllKeys(obj: TranslationStructure, prefix: string = ''): string[] {
    const keys: string[] = [];

    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (typeof value === 'string') {
        keys.push(fullKey);
      } else if (typeof value === 'object' && value !== null) {
        keys.push(...this.getAllKeys(value, fullKey));
      }
    });

    return keys;
  }

  /**
   * Check if a nested key exists in the translation object
   */
  private hasKey(obj: TranslationStructure, key: string): boolean {
    const keys = key.split('.');
    let current = obj;

    for (const k of keys) {
      if (typeof current !== 'object' || current === null || !(k in current)) {
        return false;
      }
      current = current[k] as TranslationStructure;
    }

    return true;
  }

  /**
   * Get value from nested key
   */
  private getValue(obj: TranslationStructure, key: string): string | TranslationData | undefined {
    const keys = key.split('.');
    let current = obj;

    for (const k of keys) {
      if (typeof current !== 'object' || current === null || !(k in current)) {
        return undefined;
      }
      current = current[k] as TranslationStructure;
    }

    return current;
  }

  /**
   * Generate validation report
   */
  public generateReport(results: ValidationResult[]): string {
    let report = '# Translation Validation Report\n\n';

    // Summary
    const totalLanguages = results.length;
    const averageCompleteness = results.reduce((sum, r) => sum + r.completeness, 0) / totalLanguages;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

    report += `## Summary\n`;
    report += `- Languages: ${totalLanguages}\n`;
    report += `- Average Completeness: ${averageCompleteness.toFixed(1)}%\n`;
    report += `- Total Issues: ${totalIssues}\n\n`;

    // Per-language results
    results.forEach(result => {
      const langInfo = SUPPORTED_LANGUAGES[result.language];
      report += `## ${langInfo.nativeName} (${result.language}) - ${result.file}\n`;
      report += `- **Completeness**: ${result.completeness.toFixed(1)}% (${result.translatedKeys}/${result.totalKeys} keys)\n`;
      report += `- **Issues**: ${result.issues.length}\n\n`;

      if (result.issues.length > 0) {
        result.issues.forEach(issue => {
          const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
          report += `  ${icon} **${issue.type}** (${issue.key}): ${issue.message}\n`;
        });
        report += '\n';
      }
    });

    return report;
  }
}

// Export convenience functions
export const createValidator = (referenceLanguage: SupportedLanguage = 'en') => {
  return new TranslationValidator(referenceLanguage);
};

export const validateTranslationFile = async (
  language: SupportedLanguage,
  fileName: string
): Promise<ValidationResult | null> => {
  try {
    // This would load the actual translation files
    // For now, it's a placeholder that would be implemented based on your file loading strategy
    const translations = {}; // Load from /public/locales/{language}/{fileName}.json
    const referenceTranslations = {}; // Load from /public/locales/en/{fileName}.json

    const validator = new TranslationValidator();
    return validator.validateTranslation(language, fileName, translations, referenceTranslations);
  } catch (error) {
    console.error(`Failed to validate translation file ${fileName} for ${language}:`, error);
    return null;
  }
};

export default TranslationValidator;