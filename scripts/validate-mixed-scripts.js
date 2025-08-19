#!/usr/bin/env node

/**
 * Mixed Script Validation Script
 * Validates and manages intentional mixed script usage in translation files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LOCALES_DIR = path.join(__dirname, '..', 'public', 'locales');
const ALLOWED_MIXED_SCRIPTS = [
  'Relife المنبه', // Brand name with Arabic
  'Relife', // English brand name
  'المنبه', // Arabic for "the alarm"
];

// Template variable patterns that are allowed in i18n
const ALLOWED_TEMPLATE_PATTERNS = [
  /\{\{\w+\}\}/g, // i18n template variables like {{name}}, {{count}}, {{minutes}}
  /#\{\{\w+\}\}/g, // numbered template variables like #{{rank}}
];

// Mixed script detection regex
const MIXED_SCRIPT_PATTERNS = [
  // Latin + Arabic
  /[a-zA-Z]+.*[\u0600-\u06FF]/g,
  // Arabic + Latin
  /[\u0600-\u06FF].*[a-zA-Z]+/g,
];

class MixedScriptValidator {
  constructor() {
    this.findings = [];
    this.allowedPatterns = ALLOWED_MIXED_SCRIPTS;
  }

  /**
   * Check if a text contains mixed scripts
   */
  hasMixedScripts(text) {
    return MIXED_SCRIPT_PATTERNS.some(pattern => pattern.test(text));
  }

  /**
   * Check if mixed script usage is allowed
   */
  isAllowedMixedScript(text) {
    // Check explicit allowed patterns
    if (this.allowedPatterns.some(pattern => text.includes(pattern))) {
      return true;
    }
    
    // Check if the mixed script is only due to template variables
    let textWithoutTemplates = text;
    ALLOWED_TEMPLATE_PATTERNS.forEach(pattern => {
      textWithoutTemplates = textWithoutTemplates.replace(pattern, '');
    });
    
    // If after removing templates, there's no more mixed script, it's allowed
    return !this.hasMixedScripts(textWithoutTemplates);
  }

  /**
   * Validate a translation file
   */
  validateFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const translations = JSON.parse(content);
      
      this.validateObject(translations, filePath, []);
    } catch (error) {
      console.error(`Error validating ${filePath}:`, error.message);
    }
  }

  /**
   * Recursively validate translation object
   */
  validateObject(obj, filePath, keyPath) {
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = [...keyPath, key];
      
      if (typeof value === 'string') {
        if (this.hasMixedScripts(value)) {
          const finding = {
            file: filePath,
            key: currentPath.join('.'),
            value: value,
            allowed: this.isAllowedMixedScript(value)
          };
          
          this.findings.push(finding);
        }
      } else if (typeof value === 'object' && value !== null) {
        this.validateObject(value, filePath, currentPath);
      }
    });
  }

  /**
   * Validate all translation files
   */
  validateAllFiles() {
    console.log('🔍 Validating mixed script usage in translation files...\n');
    
    const languages = fs.readdirSync(LOCALES_DIR).filter(dir => 
      fs.statSync(path.join(LOCALES_DIR, dir)).isDirectory()
    );

    languages.forEach(lang => {
      const langDir = path.join(LOCALES_DIR, lang);
      const files = fs.readdirSync(langDir).filter(file => file.endsWith('.json'));
      
      files.forEach(file => {
        const filePath = path.join(langDir, file);
        this.validateFile(filePath);
      });
    });
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log('📊 MIXED SCRIPT VALIDATION REPORT\n');
    
    if (this.findings.length === 0) {
      console.log('✅ No mixed scripts found in translation files.\n');
      return;
    }

    const allowed = this.findings.filter(f => f.allowed);
    const flagged = this.findings.filter(f => !f.allowed);

    console.log(`📋 Total mixed scripts found: ${this.findings.length}`);
    console.log(`✅ Allowed (intentional): ${allowed.length}`);
    console.log(``);

    if (allowed.length > 0) {
      console.log('✅ ALLOWED MIXED SCRIPTS (Intentional):');
      allowed.forEach(finding => {
        const relativePath = path.relative(process.cwd(), finding.file);
        console.log(`  📁 ${relativePath}`);
        console.log(`  🔑 ${finding.key}`);
        console.log(`  📝 "${finding.value}"`);
        console.log('');
      });
    }

    if (flagged.length > 0) {
      console.log('⚠️  FLAGGED MIXED SCRIPTS (Need Review):');
      flagged.forEach(finding => {
        const relativePath = path.relative(process.cwd(), finding.file);
        console.log(`  📁 ${relativePath}`);
        console.log(`  🔑 ${finding.key}`);
        console.log(`  📝 "${finding.value}"`);
        console.log('  💡 Add to ALLOWED_MIXED_SCRIPTS if intentional');
        console.log('');
      });
    }

    console.log('📖 To suppress warnings for intentional mixed scripts:');
    console.log('   1. Add patterns to ALLOWED_MIXED_SCRIPTS in this script');
    console.log('   2. Update .mixedscriptignore file');
    console.log('   3. Add comments to translation files explaining intent');
    console.log('');
  }

  /**
   * Generate ignore patterns for external tools
   */
  generateIgnorePatterns() {
    const ignoreFile = path.join(__dirname, '..', '.mixedscriptignore');
    let content = '# Mixed Script Ignore File\n';
    content += '# This file specifies intentional mixed script usage that should not generate warnings

';

    this.findings.filter(f => f.allowed).forEach(finding => {
      const relativePath = path.relative(process.cwd(), finding.file);
      content += `# ${finding.key}: ${finding.value}
`;
      content += `${relativePath}:${finding.key}

`;
    });

    fs.writeFileSync(ignoreFile, content);
    console.log(`📝 Updated .mixedscriptignore with ${this.findings.filter(f => f.allowed).length} patterns`);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'validate';

  const validator = new MixedScriptValidator();

  switch (command) {
    case 'validate':
      validator.validateAllFiles();
      validator.generateReport();
      break;

    case 'update-ignore':
      validator.validateAllFiles();
      validator.generateIgnorePatterns();
      break;

    case 'report':
      validator.validateAllFiles();
      validator.generateReport();
      validator.generateIgnorePatterns();
      break;

    default:
      console.log(`      `);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default MixedScriptValidator;