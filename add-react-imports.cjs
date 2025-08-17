#!/usr/bin/env node

const fs = require('fs');

// List of files that need React imports (from our scan)
const filesToFix = [
  'src/components/AlarmForm.tsx',
  'src/components/AlarmList.tsx',
  'src/components/AlarmRinging.tsx',
  'src/components/AuthenticationFlow.tsx',
  'src/components/ConsentBanner.tsx',
  'src/components/Dashboard.tsx',
  'src/components/EnhancedDashboard.tsx',
  'src/components/ForgotPasswordForm.tsx',
  'src/components/LoginForm.tsx',
  'src/components/OnboardingFlow.tsx',
  'src/components/PersonalizationSettings.tsx',
  'src/components/ScreenReaderProvider.tsx',
  'src/components/SettingsPage.tsx',
  'src/components/SignUpForm.tsx',
  'src/components/UserProfile.tsx',
  'src/components/ui/aspect-ratio.tsx',
  'src/components/ui/collapsible.tsx',
  'src/components/ui/skeleton.tsx',
  'src/components/ui/sonner.tsx',
  'src/main.tsx',
  'src/stories/components/AlarmForm.stories.tsx',
  'src/stories/components/Dashboard.stories.tsx',
  'src/stories/ui/Button.stories.tsx',
  'src/stories/ui/Card.stories.tsx',
  'src/App.tsx'
];

// Check if file already has React import
const hasReactImport = (content) => {
  const reactImportPatterns = [
    /^import\s+React\s+from\s+['"]react['"];?/m,
    /^import\s+\*\s+as\s+React\s+from\s+['"]react['"];?/m,
    /^import\s+{\s*[^}]*React[^}]*\s*}\s+from\s+['"]react['"];?/m,
    /^import\s+React,/m
  ];
  
  return reactImportPatterns.some(pattern => pattern.test(content));
};

// Add React import to the beginning of the file
const addReactImport = (content) => {
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Find the best place to insert the import
  // Skip over comments and other imports to maintain order
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments at the top
    if (line === '' || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
      insertIndex = i + 1;
      continue;
    }
    
    // If we hit another import, this is where we want to be
    if (line.startsWith('import ')) {
      insertIndex = i;
      break;
    }
    
    // If we hit non-import code, insert before it
    if (line.length > 0) {
      insertIndex = i;
      break;
    }
  }
  
  // Insert the React import
  lines.splice(insertIndex, 0, "import React from 'react';");
  
  return lines.join('\n');
};

// Main function to process all files
const addReactImportsToFiles = () => {
  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  console.log(`\n🔧 Adding React imports to ${filesToFix.length} files...\n`);
  
  for (const file of filesToFix) {
    try {
      if (!fs.existsSync(file)) {
        console.log(`⚠️  File not found: ${file}`);
        errorCount++;
        continue;
      }
      
      const content = fs.readFileSync(file, 'utf8');
      
      if (hasReactImport(content)) {
        console.log(`✅ ${file} (already has React import)`);
        skippedCount++;
        continue;
      }
      
      const updatedContent = addReactImport(content);
      fs.writeFileSync(file, updatedContent);
      
      console.log(`📝 ${file} (React import added)`);
      processedCount++;
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files skipped (already had import): ${skippedCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Total files: ${filesToFix.length}\n`);
  
  return { processedCount, skippedCount, errorCount };
};

// Run the script
if (require.main === module) {
  addReactImportsToFiles();
}

module.exports = { addReactImportsToFiles };