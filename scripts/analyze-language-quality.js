#!/usr/bin/env node

// Analyze individual language quality results
// Usage: node analyze-language-quality.js <analysis-file> <language-code>

const fs = require('fs');

function main() {
  const [analysisFile, languageCode] = process.argv.slice(2);

  if (!analysisFile || !languageCode) {
    console.error(
      'Usage: node analyze-language-quality.js <analysis-file> <language-code>'
    );
    process.exit(1);
  }

  try {
    if (!fs.existsSync(analysisFile)) {
      console.log(`Analysis file ${analysisFile} not found`);
      return;
    }

    const report = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));
    const langData = report.languages?.[languageCode];

    if (!langData) {
      console.log(`Language ${languageCode} not found in analysis`);
      return;
    }

    const quality = Math.round(langData.qualityScore?.overall || 0);
    const cultural = Math.round(langData.qualityScore?.culturalAdaptation || 0);
    const consistency = Math.round(langData.qualityScore?.consistency || 0);

    console.log(`${languageCode} Analysis:`);
    console.log(`Overall Quality: ${quality}%`);
    console.log(`Cultural Adaptation: ${cultural}%`);
    console.log(`Consistency: ${consistency}%`);

    const culturalIssues = langData.culturalIssues?.length || 0;
    const consistencyIssues = langData.consistencyIssues?.length || 0;

    if (culturalIssues > 0) {
      console.log(`Cultural Issues: ${culturalIssues}`);
    }

    if (consistencyIssues > 0) {
      console.log(`Consistency Issues: ${consistencyIssues}`);
    }

    // Create issue if quality is poor
    if (quality < 70) {
      console.log(`⚠️ Language ${languageCode} needs attention`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error analyzing language ${languageCode}:`, error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
