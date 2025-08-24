#!/usr/bin/env node

// Update README with translation status
// Usage: node update-readme-status.js <total-languages> <average-quality> <completion>

const fs = require('fs');

function main() {
  const [totalLanguages, averageQuality, completion] = process.argv.slice(2);

  if (!totalLanguages || !averageQuality || !completion) {
    console.error(
      'Usage: node update-readme-status.js <total-languages> <average-quality> <completion>'
    );
    process.exit(1);
  }

  try {
    let readme = fs.readFileSync('README.md', 'utf8');

    // Translation status section
    const statusSection = `## 🌐 Translation Status

**Current Status**: ${totalLanguages} languages supported with ${averageQuality}% average quality

| Metric | Value |
|--------|-------|
| 🌍 Total Languages | ${totalLanguages} |
| ⭐ Average Quality | ${averageQuality}% |
| 📊 Average Completion | ${completion}% |
| 🔄 Last Updated | ${new Date().toLocaleDateString()} |

- [📊 View Translation Dashboard](./src/components/TranslationDashboard.tsx)
- [📑 Detailed Translation Report](./docs/translation-reports/status.html)
- [📖 Translation Guidelines](./TRANSLATION_GUIDELINES.md)
- [🚀 Quick Start Guide](./docs/TRANSLATOR_QUICK_START.md)

> **Note**: Translation quality is automatically monitored and reports are generated weekly. Contributors can view real-time status in our [Translation Dashboard](./src/components/TranslationDashboard.tsx).`;

    // Replace or add translation status section
    const statusRegex = /## 🌐 Translation Status[\s\S]*?(?=(?:^## |\n*$))/m;

    if (statusRegex.test(readme)) {
      readme = readme.replace(statusRegex, statusSection.trim());
      console.log('✅ Updated existing translation status section in README');
    } else {
      // Add after internationalization section if it exists
      const intlRegex = /(## 🌐 Internationalization[\s\S]*?)(?=(?:^## |\n*$))/m;
      if (intlRegex.test(readme)) {
        readme = readme.replace(intlRegex, `$1\n\n${statusSection.trim()}`);
        console.log(
          '✅ Added translation status section after internationalization in README'
        );
      } else {
        // Add at the end
        readme += '\n\n' + statusSection.trim();
        console.log('✅ Added translation status section at end of README');
      }
    }

    fs.writeFileSync('README.md', readme);
  } catch (error) {
    console.error('Error updating README:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
