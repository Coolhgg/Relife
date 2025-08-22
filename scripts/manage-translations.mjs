#!/usr/bin/env node

/**
 * Translation management script
 * Helps validate, complete, and manage translation files
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LOCALES_DIR = path.join(__dirname, '..', 'public', 'locales');
const REFERENCE_LANGUAGE = 'en';
const TRANSLATION_FILES = [
  'common.json',
  'alarms.json',
  'auth.json',
  'gaming.json',
  'settings.json',
  'errors.json',
];
const SUPPORTED_LANGUAGES = [
  // English variants
  'en',
  'en-GB',
  'en-AU',
  // Spanish variants
  'es',
  'es-MX',
  'es-419',
  // French variants
  'fr',
  'fr-CA',
  // Other primary languages
  'de',
  'ja',
  'zh',
  'zh-TW',
  'ar',
  'hi',
  'ko',
  'pt',
  'pt-BR',
  'it',
  'ru',
  // Additional languages
  'id',
  'bn',
  'vi',
  'th',
];

class TranslationManager {
  constructor() {
    this.translations = new Map();
    this.validationResults = [];
  }

  /**
   * Load all translation files
   */
  async loadTranslations() {
    console.log('📖 Loading translations...');

    for (const lang of SUPPORTED_LANGUAGES) {
      this.translations.set(lang, new Map());

      for (const file of TRANSLATION_FILES) {
        const filePath = path.join(LOCALES_DIR, lang, file);

        try {
          const content = await fs.readFile(filePath, 'utf8');
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
   * Get all keys from a translation object (flattened)
   */
  getAllKeys(obj, prefix = '') {
    const keys = [];

    Object.keys(obj).forEach((key) => {
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
   * Get value from nested key
   */
  getValue(obj, key) {
    const keys = key.split('.');
    let current = obj;

    for (const k of keys) {
      if (typeof current !== 'object' || current === null || !(k in current)) {
        return undefined;
      }
      current = current[k];
    }

    return current;
  }

  /**
   * Check if a nested key exists
   */
  hasKey(obj, key) {
    const keys = key.split('.');
    let current = obj;

    for (const k of keys) {
      if (typeof current !== 'object' || current === null || !(k in current)) {
        return false;
      }
      current = current[k];
    }

    return true;
  }

  /**
   * Set value at nested key
   */
  setValue(obj, key, value) {
    const keys = key.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Validate translations against reference language
   */
  validateTranslations() {
    console.log('🔍 Validating translations...');

    const results = [];

    for (const file of TRANSLATION_FILES) {
      const referenceTranslations = this.translations.get(REFERENCE_LANGUAGE).get(file);
      const referenceKeys = this.getAllKeys(referenceTranslations);

      console.log(`\\n📋 Validating ${file}:`);
      console.log(`  Reference keys: ${referenceKeys.length}`);

      for (const lang of SUPPORTED_LANGUAGES) {
        if (lang === REFERENCE_LANGUAGE) continue;

        const translations = this.translations.get(lang).get(file);
        const translatedKeys = referenceKeys.filter((key) => {
          const value = this.getValue(translations, key);
          return (
            value &&
            typeof value === 'string' &&
            value.trim() !== '' &&
            !value.startsWith('TODO:')
          );
        });

        const completeness =
          referenceKeys.length > 0
            ? (translatedKeys.length / referenceKeys.length) * 100
            : 0;
        const missing = referenceKeys.length - translatedKeys.length;

        results.push({
          language: lang,
          file: file,
          total: referenceKeys.length,
          translated: translatedKeys.length,
          missing: missing,
          completeness: completeness,
        });

        console.log(
          `  ${lang}: ${completeness.toFixed(1)}% (${translatedKeys.length}/${referenceKeys.length}) - ${missing} missing`
        );
      }
    }

    this.validationResults = results;
    return results;
  }

  /**
   * Generate missing key templates
   */
  async generateMissingKeyTemplates() {
    console.log('🏗️  Generating missing key templates...');

    for (const file of TRANSLATION_FILES) {
      const referenceTranslations = this.translations.get(REFERENCE_LANGUAGE).get(file);
      const referenceKeys = this.getAllKeys(referenceTranslations);

      for (const lang of SUPPORTED_LANGUAGES) {
        if (lang === REFERENCE_LANGUAGE) continue;

        const translations = this.translations.get(lang).get(file);
        const missingKeys = [];

        referenceKeys.forEach((key) => {
          if (!this.hasKey(translations, key)) {
            const referenceValue = this.getValue(referenceTranslations, key);
            missingKeys.push({
              key,
              reference: referenceValue,
              translation: `TODO: ${referenceValue}`,
            });
          }
        });

        if (missingKeys.length > 0) {
          console.log(`  ${lang}/${file}: ${missingKeys.length} missing keys`);

          // Add missing keys with TODO markers
          missingKeys.forEach(({ key, translation }) => {
            this.setValue(translations, key, translation);
          });
        }
      }
    }
  }

  /**
   * Save all translation files
   */
  async saveTranslations() {
    console.log('💾 Saving translations...');

    for (const lang of SUPPORTED_LANGUAGES) {
      const langDir = path.join(LOCALES_DIR, lang);

      // Ensure directory exists
      try {
        await fs.mkdir(langDir, { recursive: true });
      } catch (error) {
        // Directory probably exists
      }

      for (const file of TRANSLATION_FILES) {
        const filePath = path.join(langDir, file);
        const translations = this.translations.get(lang).get(file);

        try {
          await fs.writeFile(filePath, JSON.stringify(translations, null, 2), 'utf8');
          console.log(`  ✅ Saved ${lang}/${file}`);
        } catch (error) {
          console.log(`  ❌ Failed to save ${lang}/${file}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log('\\n📊 TRANSLATION REPORT\\n');

    // Summary by language
    const languageStats = new Map();
    this.validationResults.forEach((result) => {
      if (!languageStats.has(result.language)) {
        languageStats.set(result.language, {
          totalKeys: 0,
          translatedKeys: 0,
          files: 0,
        });
      }
      const stats = languageStats.get(result.language);
      stats.totalKeys += result.total;
      stats.translatedKeys += result.translated;
      stats.files += 1;
    });

    console.log('🌍 LANGUAGE COMPLETENESS:');
    Array.from(languageStats.entries())
      .sort(
        (a, b) =>
          b[1].translatedKeys / b[1].totalKeys - a[1].translatedKeys / a[1].totalKeys
      )
      .forEach(([lang, stats]) => {
        const completeness = (stats.translatedKeys / stats.totalKeys) * 100;
        const bar =
          '█'.repeat(Math.floor(completeness / 5)) +
          '░'.repeat(20 - Math.floor(completeness / 5));
        console.log(
          `  ${lang}: ${bar} ${completeness.toFixed(1)}% (${stats.translatedKeys}/${stats.totalKeys})`
        );
      });

    console.log('\\n📁 FILE BREAKDOWN:');
    TRANSLATION_FILES.forEach((file) => {
      console.log(`\\n  ${file.toUpperCase()}:`);
      const fileResults = this.validationResults.filter((r) => r.file === file);
      fileResults
        .sort((a, b) => b.completeness - a.completeness)
        .forEach((result) => {
          const bar =
            '█'.repeat(Math.floor(result.completeness / 5)) +
            '░'.repeat(20 - Math.floor(result.completeness / 5));
          console.log(
            `    ${result.language}: ${bar} ${result.completeness.toFixed(1)}% (${result.missing} missing)`
          );
        });
    });

    console.log('\\n🎯 PRIORITY LANGUAGES TO WORK ON:');
    const priorities = Array.from(languageStats.entries())
      .sort(
        (a, b) =>
          a[1].translatedKeys / a[1].totalKeys - b[1].translatedKeys / b[1].totalKeys
      )
      .slice(0, 5);

    priorities.forEach(([lang, stats], index) => {
      const completeness = (stats.translatedKeys / stats.totalKeys) * 100;
      console.log(
        `  ${index + 1}. ${lang}: ${completeness.toFixed(1)}% complete (${stats.totalKeys - stats.translatedKeys} keys needed)`
      );
    });
  }

  /**
   * Create language directories for new languages
   */
  async createLanguageDirectories() {
    console.log('📁 Creating language directories...');

    for (const lang of SUPPORTED_LANGUAGES) {
      const langDir = path.join(LOCALES_DIR, lang);

      try {
        await fs.mkdir(langDir, { recursive: true });
        console.log(`  ✅ Created directory: ${lang}`);

        // Create empty translation files if they don't exist
        for (const file of TRANSLATION_FILES) {
          const filePath = path.join(langDir, file);
          try {
            await fs.access(filePath);
          } catch {
            // File doesn't exist, create it
            await fs.writeFile(filePath, '{}\\n', 'utf8');
            console.log(`    📄 Created: ${file}`);
          }
        }
      } catch (error) {
        console.log(`  ❌ Failed to create ${lang}: ${error.message}`);
      }
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'validate';

  const manager = new TranslationManager();

  try {
    switch (command) {
      case 'validate':
        console.log('🔍 VALIDATION MODE\\n');
        await manager.loadTranslations();
        manager.validateTranslations();
        manager.generateReport();
        break;

      case 'generate':
        console.log('🏗️  GENERATION MODE\\n');
        await manager.loadTranslations();
        manager.validateTranslations();
        await manager.generateMissingKeyTemplates();
        await manager.saveTranslations();
        console.log('\\n✅ Generated missing key templates with TODO markers');
        break;

      case 'setup':
        console.log('🏗️  SETUP MODE\\n');
        await manager.createLanguageDirectories();
        console.log('\\n✅ Language directories created');
        break;

      case 'report':
        console.log('📊 REPORT MODE\\n');
        await manager.loadTranslations();
        manager.validateTranslations();
        manager.generateReport();
        break;

      default:
        console.log(`
🌍 Translation Management Tool

Usage: node manage-translations.js [command]

Commands:
  validate  - Validate translations against reference language (default)
  generate  - Generate missing key templates with TODO markers
  setup     - Create language directories and empty files
  report    - Generate detailed translation report

Examples:
  node manage-translations.js validate
  node manage-translations.js generate
  node manage-translations.js setup
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default TranslationManager;
