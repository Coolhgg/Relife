#!/usr/bin/env node

// Generate report statistics from translation analysis
// Usage: node generate-report-statistics.js <analysis-file> <timestamp>

const fs = require('fs');

function main() {
  const [analysisFile, timestamp] = process.argv.slice(2);
  
  if (!analysisFile || !timestamp) {
    console.error('Usage: node generate-report-statistics.js <analysis-file> <timestamp>');
    process.exit(1);
  }

  try {
    const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));
    
    // Calculate summary statistics
    const languages = Object.entries(analysis.languages || {});
    const totalLanguages = languages.length;
    const averageQuality = Math.round(
      languages.reduce((sum, [_, lang]) => sum + (lang.qualityScore?.overall || 0), 0) / totalLanguages
    );
    
    // Count total translation keys from English (base language)
    let totalKeys = 0;
    const englishData = analysis.languages?.['en'];
    if (englishData && englishData.keys) {
      totalKeys = Object.keys(englishData.keys).length;
    }
    
    // Calculate overall completion percentage
    const completionPercentage = Math.round(
      languages.reduce((sum, [_, lang]) => {
        const completion = (lang.qualityScore?.completeness || 0);
        return sum + completion;
      }, 0) / totalLanguages
    );
    
    console.log('📊 Summary Statistics:');
    console.log(`Total Languages: ${totalLanguages}`);
    console.log(`Average Quality: ${averageQuality}%`);
    console.log(`Total Keys: ${totalKeys}`);
    console.log(`Average Completion: ${completionPercentage}%`);
    
    // Set GitHub outputs
    const outputFile = process.env.GITHUB_OUTPUT || '/dev/stdout';
    const outputs = [
      `total-languages=${totalLanguages}`,
      `average-quality=${averageQuality}`,
      `total-keys=${totalKeys}`,
      `completion-percentage=${completionPercentage}`
    ];
    
    fs.appendFileSync(outputFile, outputs.join('\n') + '\n');
    
    // Generate summary data file
    const summary = {
      generated: new Date().toISOString(),
      reportType: process.env.REPORT_TYPE || 'weekly',
      statistics: {
        totalLanguages,
        averageQuality,
        totalKeys,
        completionPercentage
      },
      languageBreakdown: languages.map(([code, data]) => ({
        code,
        name: data.name || code,
        quality: Math.round(data.qualityScore?.overall || 0),
        completion: Math.round(data.qualityScore?.completeness || 0),
        cultural: Math.round(data.qualityScore?.culturalAdaptation || 0),
        consistency: Math.round(data.qualityScore?.consistency || 0),
        lastUpdated: data.lastUpdated || null
      }))
    };
    
    const summaryFile = analysisFile.replace('full-analysis-', 'summary-');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log('✅ Generated summary data file');
    
  } catch (error) {
    console.error('Error generating data:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}