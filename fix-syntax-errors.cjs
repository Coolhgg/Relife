#!/usr/bin/env node

/**
 * Script to fix syntax errors found during Prettier run
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting syntax errors cleanup...\n');

let stats = {
  filesProcessed: 0,
  errorsFixed: 0,
  errors: 0,
};

const syntaxFixes = [
  // Fix empty imports
  { pattern: /import\s+from\s+['"]/g, replacement: "import { Progress } from '" },
  { pattern: /import\s+\s+from\s+['"]/g, replacement: "import { Progress } from '" },

  // Fix missing component names in import destructuring
  { pattern: /import\s*{\s*,\s*/g, replacement: 'import { ' },
  { pattern: /,\s*}\s*from/g, replacement: ' } from' },

  // Fix missing commas in icon imports
  { pattern: /import\s*{\s*(\w+)\s+(\w+)\s*}/g, replacement: 'import { $1, $2 }' },

  // Fix empty JSX tags
  { pattern: /<className=/g, replacement: '<div className=' },
  { pattern: /<\s+className=/g, replacement: '<div className=' },

  // Fix missing object properties
  { pattern: /icon:\s*}/g, replacement: 'icon: Calendar }' },
  { pattern: /icon:\s*,/g, replacement: 'icon: Calendar,' },
];

function fixSyntaxErrors(content, filePath) {
  let modified = content;
  let changes = 0;

  // Apply general fixes
  for (const fix of syntaxFixes) {
    const before = modified;
    modified = modified.replace(fix.pattern, fix.replacement);
    if (modified !== before) changes++;
  }

  // File-specific fixes based on the errors we saw
  const fileName = path.basename(filePath);

  switch (fileName) {
    case 'AdvancedSchedulingDashboard.tsx':
      modified = modified.replace('icon:},', 'icon: Calendar },');
      changes++;
      break;

    case 'AIAutomation.tsx':
    case 'CustomSoundThemeCreator.tsx':
    case 'EnhancedBattles.tsx':
    case 'MediaContent.tsx':
    case 'NuclearModeResults.tsx':
    case 'NuclearModeSelector.tsx':
    case 'SubscriptionDashboard.tsx':
    case 'SubscriptionManagement.tsx':
    case 'SoundUploader.tsx':
    case 'BetaTestingProgram.tsx':
    case 'FeedbackModal.tsx':
    case 'RedesignedFeedbackModal.tsx':
      if (modified.includes('import  from')) {
        modified = modified.replace(
          /import\s+from\s+['"]([^'"]+)['"]/g,
          "import { Progress } from '$1'"
        );
        changes++;
      }
      break;

    case 'EmotionalNudgeModal.tsx':
      modified = modified.replace('X, Heart Clock, Star', 'X, Heart, Clock, Star');
      changes++;
      break;

    case 'ErrorBoundaryTest.tsx':
      modified = modified.replace('Bug Alert, Database', 'Bug, Alert, Database');
      changes++;
      break;

    case 'ForgotPasswordForm.tsx':
      modified = modified.replace(
        '<className="w-12 h-12',
        '<CheckCircle className="w-12 h-12'
      );
      changes++;
      break;

    case 'GamingHub.tsx':
      modified = modified.replace('Trophy Sword', 'Trophy, Sword');
      changes++;
      break;

    case 'LoginForm.tsx':
      modified = modified.replace(
        'Lock ArrowRight, AlertCircle',
        'Lock, ArrowRight, AlertCircle'
      );
      changes++;
      break;

    case 'PremiumAlarmFeatures.tsx':
      modified = modified.replace(
        'Clock Brain, Music MapPin, Cloud',
        'Clock, Brain, Music, MapPin, Cloud'
      );
      changes++;
      break;

    case 'PremiumFeatureTest.tsx':
      modified = modified.replace('Crown, Star Shield', 'Crown, Star, Shield');
      changes++;
      break;

    case 'SoundThemeDemo.tsx':
      modified = modified.replace('VolumeX Music}', 'VolumeX, Music }');
      changes++;
      break;

    case 'StreakCounter.tsx':
      modified = modified.replace('<className="w-4 h-4', '<Target className="w-4 h-4');
      changes++;
      break;
  }

  // Fix import statements that are missing component names
  if (
    modified.includes('import { Progress } from') &&
    !modified.includes('Progress,')
  ) {
    // If we added Progress import, make sure other imports exist
    if (modified.includes("import  from '../ui/textarea'")) {
      modified = modified.replace(
        "import  from '../ui/textarea'",
        "import { Textarea } from '../ui/textarea'"
      );
      changes++;
    }
  }

  return { modified, changes };
}

function processFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const result = fixSyntaxErrors(content, filePath);

    if (result.changes > 0 && result.modified !== content) {
      fs.writeFileSync(filePath, result.modified);
      console.log(
        `✅ Fixed ${result.changes} syntax errors in ${path.relative(process.cwd(), filePath)}`
      );
      stats.errorsFixed += result.changes;
    }

    stats.filesProcessed++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    stats.errors++;
  }
}

// List of files with known syntax errors
const problematicFiles = [
  'src/components/AdvancedSchedulingDashboard.tsx',
  'src/components/AIAutomation.tsx',
  'src/components/CustomSoundThemeCreator.tsx',
  'src/components/EmotionalNudgeModal.tsx',
  'src/components/EnhancedBattles.tsx',
  'src/components/ErrorBoundaryTest.tsx',
  'src/components/ForgotPasswordForm.tsx',
  'src/components/GamingHub.tsx',
  'src/components/LoginForm.tsx',
  'src/components/MediaContent.tsx',
  'src/components/NuclearModeResults.tsx',
  'src/components/NuclearModeSelector.tsx',
  'src/components/premium/PremiumAlarmFeatures.tsx',
  'src/components/premium/SubscriptionDashboard.tsx',
  'src/components/premium/SubscriptionManagement.tsx',
  'src/components/PremiumFeatureTest.tsx',
  'src/components/SoundThemeDemo.tsx',
  'src/components/SoundUploader.tsx',
  'src/components/StreakCounter.tsx',
  'src/components/user-testing/BetaTestingProgram.tsx',
  'src/components/user-testing/FeedbackModal.tsx',
  'src/components/user-testing/RedesignedFeedbackModal.tsx',
  'tests/utils/a11y-testing-utils.js',
  'tests/utils/a11y-testing-utils.ts',
];

// Main execution
try {
  console.log(`Found ${problematicFiles.length} files with known syntax errors\n`);

  for (const file of problematicFiles) {
    processFile(file);
  }

  console.log('\n📊 Syntax Errors Cleanup Summary:');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Syntax errors fixed: ${stats.errorsFixed}`);
  console.log(`Errors: ${stats.errors}`);

  if (stats.errorsFixed > 0) {
    console.log('\n✅ Syntax errors cleanup completed successfully!');
  } else {
    console.log('\nℹ️  No syntax errors found to fix.');
  }
} catch (error) {
  console.error('❌ Script failed:', error);
  process.exit(1);
}
