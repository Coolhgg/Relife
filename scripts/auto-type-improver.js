#!/usr/bin/env node
/**
 * Automated TypeScript Type Improver
 * Systematically reduces 'any' usage and improves type safety
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoTypeImprover {
  constructor() {
    this.config = {
      logFile: 'logs/type-improvements.log',
      backupDir: 'backups/auto-type-fixes',
      maxFilesPerRun: 30,
      anyReductionTarget: 0.1, // Reduce any usage by 10% per run
    };
    this.typeReplacements = this.initializeTypeReplacements();
    this.improvements = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);

    if (!fs.existsSync(path.dirname(this.config.logFile))) {
      fs.mkdirSync(path.dirname(this.config.logFile), { recursive: true });
    }

    fs.appendFileSync(this.config.logFile, logMessage + '\n');
  }

  initializeTypeReplacements() {
    return [
      // Event handlers
      {
        pattern: /\(event:\s*any\)\s*=>/g,
        replacement: '(event: React.ChangeEvent<HTMLInputElement>) =>',
        description: 'Improve event handler types',
        context: 'event handlers',
      },
      {
        pattern: /\(e:\s*any\)\s*=>/g,
        replacement: '(e: React.MouseEvent<HTMLButtonElement>) =>',
        description: 'Improve click event types',
        context: 'click handlers',
      },
      // API responses
      {
        pattern: /:\s*any\[\]/g,
        replacement: ': unknown[]',
        description: 'Replace any[] with unknown[]',
        context: 'arrays',
      },
      {
        pattern: /Promise<any>/g,
        replacement: 'Promise<unknown>',
        description: 'Improve Promise return types',
        context: 'promises',
      },
      // Function parameters
      {
        pattern: /\(data:\s*any\)/g,
        replacement: '(data: unknown)',
        description: 'Improve generic data parameters',
        context: 'function parameters',
      },
      {
        pattern: /\(props:\s*any\)/g,
        replacement: '(props: Record<string, unknown>)',
        description: 'Improve props typing',
        context: 'component props',
      },
      // Object types
      {
        pattern: /:\s*any\s*=/g,
        replacement: ': Record<string, unknown> =',
        description: 'Improve object literal types',
        context: 'object assignments',
      },
      // State and refs
      {
        pattern: /useState<any>/g,
        replacement: 'useState<unknown>',
        description: 'Improve useState typing',
        context: 'React state',
      },
      {
        pattern: /useRef<any>/g,
        replacement: 'useRef<HTMLElement | null>',
        description: 'Improve useRef typing',
        context: 'React refs',
      },
      // Common specific types
      {
        pattern: /\berror:\s*any\b/g,
        replacement: 'error: Error | unknown',
        description: 'Improve error typing',
        context: 'error handling',
      },
      {
        pattern: /\bresponse:\s*any\b/g,
        replacement: 'response: Response | unknown',
        description: 'Improve response typing',
        context: 'API responses',
      },
    ];
  }

  async analyzeCurrentAnyUsage() {
    this.log('📊 Analyzing current any usage...');

    try {
      const result = execSync(
        'grep -r ": any" src --include="*.ts" --include="*.tsx" | wc -l',
        { encoding: 'utf8' }
      );
      const count = parseInt(result.trim());
      this.log(`📈 Found ${count} any type usages`);
      return count;
    } catch (error) {
      this.log(`⚠️ Could not analyze any usage: ${error.message}`);
      return 0;
    }
  }

  async improveEventHandlerTypes() {
    this.log('🎯 Improving event handler types...');

    const eventPatterns = [
      {
        search: /onChange=\{[^}]*\(([^:)]+):\s*any\)/g,
        replace: 'onChange={(event: React.ChangeEvent<HTMLInputElement>)',
        description: 'Fix onChange event types',
      },
      {
        search: /onClick=\{[^}]*\(([^:)]+):\s*any\)/g,
        replace: 'onClick={(event: React.MouseEvent<HTMLButtonElement>)',
        description: 'Fix onClick event types',
      },
      {
        search: /onSubmit=\{[^}]*\(([^:)]+):\s*any\)/g,
        replace: 'onSubmit={(event: React.FormEvent<HTMLFormElement>)',
        description: 'Fix onSubmit event types',
      },
    ];

    const files = this.getAllTSFiles('src');
    let totalFixes = 0;

    for (const file of files) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        let fileFixes = 0;

        for (const pattern of eventPatterns) {
          const before = content;
          content = content.replace(pattern.search, pattern.replace);
          if (content !== before) {
            fileFixes++;
            totalFixes++;
          }
        }

        if (fileFixes > 0) {
          fs.writeFileSync(file, content);
          this.log(`🎯 Improved ${fileFixes} event handlers in ${file}`);
        }
      } catch (error) {
        this.log(`❌ Error processing ${file}: ${error.message}`);
      }
    }

    this.log(`✅ Improved ${totalFixes} event handler types`);
    return totalFixes;
  }

  async addMissingInterfaces() {
    this.log('🏗️ Adding missing interfaces...');

    const commonInterfaces = [
      {
        name: 'ApiResponse',
        definition: `interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
  error?: string;
}`,
        usage: /response:\s*any/g,
      },
      {
        name: 'EventHandler',
        definition: `type EventHandler<T = HTMLElement> = (event: React.MouseEvent<T>) => void;`,
        usage: /onClick:\s*any/g,
      },
      {
        name: 'FormData',
        definition: `interface FormData {
  [key: string]: string | number | boolean;
}`,
        usage: /formData:\s*any/g,
      },
    ];

    const files = this.getAllTSFiles('src');
    let interfacesAdded = 0;

    for (const file of files) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        for (const iface of commonInterfaces) {
          if (iface.usage.test(content) && !content.includes(iface.name)) {
            // Add interface at the top of the file after imports
            const lines = content.split('\n');
            let insertIndex = 0;

            // Find where to insert (after imports, before other code)
            for (let i = 0; i < lines.length; i++) {
              if (
                lines[i].startsWith('import ') ||
                lines[i].startsWith('//') ||
                lines[i].trim() === ''
              ) {
                insertIndex = i + 1;
              } else {
                break;
              }
            }

            lines.splice(insertIndex, 0, '', iface.definition, '');
            content = lines.join('\n');
            modified = true;
            interfacesAdded++;
          }
        }

        if (modified) {
          fs.writeFileSync(file, content);
          this.log(`🏗️ Added interfaces to ${file}`);
        }
      } catch (error) {
        this.log(`❌ Error processing ${file}: ${error.message}`);
      }
    }

    this.log(`✅ Added ${interfacesAdded} interface definitions`);
    return interfacesAdded;
  }

  async improveGenericTypes() {
    this.log('🔧 Improving generic types...');

    const files = this.getAllTSFiles('src');
    let totalImprovements = 0;

    for (const file of files) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        let fileImprovements = 0;

        for (const replacement of this.typeReplacements) {
          const before = content;
          content = content.replace(replacement.pattern, replacement.replacement);
          if (content !== before) {
            fileImprovements++;
            totalImprovements++;
            this.improvements.push({
              file,
              description: replacement.description,
              context: replacement.context,
            });
          }
        }

        if (fileImprovements > 0) {
          fs.writeFileSync(file, content);
          this.log(`🔧 Made ${fileImprovements} type improvements in ${file}`);
        }
      } catch (error) {
        this.log(`❌ Error processing ${file}: ${error.message}`);
      }
    }

    this.log(`✅ Made ${totalImprovements} generic type improvements`);
    return totalImprovements;
  }

  async enableStricterTypeChecking() {
    this.log('🔒 Enabling stricter TypeScript settings...');

    const tsconfigPath = 'tsconfig.json';

    try {
      if (fs.existsSync(tsconfigPath)) {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

        const strictSettings = {
          noImplicitAny: true,
          strictNullChecks: true,
          strictFunctionTypes: true,
          noImplicitReturns: true,
          noFallthroughCasesInSwitch: true,
          noUncheckedIndexedAccess: false, // Start with false, enable later
        };

        let modified = false;
        for (const [setting, value] of Object.entries(strictSettings)) {
          if (tsconfig.compilerOptions[setting] !== value) {
            tsconfig.compilerOptions[setting] = value;
            modified = true;
          }
        }

        if (modified) {
          fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
          this.log('🔒 Updated TypeScript configuration for better type safety');
        } else {
          this.log('✅ TypeScript configuration already optimal');
        }
      }
    } catch (error) {
      this.log(`⚠️ Could not update TypeScript config: ${error.message}`);
    }
  }

  async generateTypeDefinitions() {
    this.log('📝 Generating missing type definitions...');

    const commonTypes = `
// Auto-generated common types
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Alarm {
  id: string;
  name: string;
  time: string;
  enabled: boolean;
  days: string[];
  created_at: string;
  updated_at: string;
}

export interface AppState {
  user: User | null;
  alarms: Alarm[];
  loading: boolean;
  error: string | null;
}

export type AsyncHandler<T = void> = () => Promise<T>;
export type EventHandler<T = HTMLElement> = (event: React.MouseEvent<T>) => void;
export type ChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;
`;

    const typesDir = 'src/types';
    const commonTypesFile = `${typesDir}/common.ts`;

    if (!fs.existsSync(typesDir)) {
      fs.mkdirSync(typesDir, { recursive: true });
    }

    if (!fs.existsSync(commonTypesFile)) {
      fs.writeFileSync(commonTypesFile, commonTypes);
      this.log('📝 Generated common type definitions');
    }
  }

  getAllTSFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files = files.concat(this.getAllTSFiles(fullPath));
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${this.config.backupDir}/backup-${timestamp}`;

    this.log(`💾 Creating backup at ${backupPath}`);

    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
    }

    try {
      execSync(`cp -r src ${backupPath}`, { stdio: 'inherit' });
      this.log(`✅ Backup created successfully`);
      return backupPath;
    } catch (error) {
      this.log(`❌ Backup failed: ${error.message}`);
      return null;
    }
  }

  async run() {
    this.log('🚀 Starting automated type improvements...');

    const initialAnyCount = await this.analyzeCurrentAnyUsage();

    // Create backup first
    const backup = await this.createBackup();
    if (!backup) {
      this.log('❌ Cannot proceed without backup');
      return false;
    }

    try {
      // Run improvements in order
      await this.generateTypeDefinitions();
      const eventHandlerFixes = await this.improveEventHandlerTypes();
      const interfacesAdded = await this.addMissingInterfaces();
      const genericImprovements = await this.improveGenericTypes();
      await this.enableStricterTypeChecking();

      const finalAnyCount = await this.analyzeCurrentAnyUsage();
      const reduction = initialAnyCount - finalAnyCount;
      const reductionPercent =
        initialAnyCount > 0 ? ((reduction / initialAnyCount) * 100).toFixed(1) : 0;

      this.log(`📊 Type improvements summary:`);
      this.log(`   - Event handlers improved: ${eventHandlerFixes}`);
      this.log(`   - Interfaces added: ${interfacesAdded}`);
      this.log(`   - Generic improvements: ${genericImprovements}`);
      this.log(`   - Any usage reduced: ${reduction} (${reductionPercent}%)`);

      this.log('🎉 Automated type improvements completed successfully!');
      return true;
    } catch (error) {
      this.log(`❌ Type improvements failed: ${error.message}`);

      // Restore from backup
      this.log('🔄 Restoring from backup...');
      try {
        execSync(`rm -rf src && cp -r ${backup} src`, { stdio: 'inherit' });
        this.log('✅ Restored from backup successfully');
      } catch (restoreError) {
        this.log(`❌ Restore failed: ${restoreError.message}`);
      }

      return false;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const improver = new AutoTypeImprover();
  improver
    .run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = AutoTypeImprover;
