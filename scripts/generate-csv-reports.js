#!/usr/bin/env node

// Generate CSV reports from summary data
// Usage: node generate-csv-reports.js <summary-file> <timestamp>

const fs = require('fs');

function main() {
  const [summaryFile, timestamp] = process.argv.slice(2);

  if (!summaryFile || !timestamp) {
    console.error('Usage: node generate-csv-reports.js <summary-file> <timestamp>');
    process.exit(1);
  }

  try {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;

    // Load summary data
    const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));

    // Generate language breakdown CSV
    const csvWriter = createCsvWriter({
      path: `translation-breakdown-${timestamp}.csv`,
      header: [
        { id: 'code', title: 'Language Code' },
        { id: 'name', title: 'Language Name' },
        { id: 'quality', title: 'Quality Score (%)' },
        { id: 'completion', title: 'Completion (%)' },
        { id: 'cultural', title: 'Cultural Adaptation (%)' },
        { id: 'consistency', title: 'Consistency (%)' },
        { id: 'status', title: 'Status' },
        { id: 'lastUpdated', title: 'Last Updated' },
      ],
    });

    const csvData = summary.languageBreakdown.map(lang => ({
      ...lang,
      status:
        lang.quality >= 80 ? 'Excellent' : lang.quality >= 60 ? 'Good' : 'Needs Work',
    }));

    csvWriter
      .writeRecords(csvData)
      .then(() => console.log('✅ Generated CSV breakdown report'));

    // Generate summary CSV
    const summaryWriter = createCsvWriter({
      path: `translation-summary-${timestamp}.csv`,
      header: [
        { id: 'metric', title: 'Metric' },
        { id: 'value', title: 'Value' },
      ],
    });

    const summaryData = [
      { metric: 'Total Languages', value: summary.statistics.totalLanguages },
      { metric: 'Average Quality (%)', value: summary.statistics.averageQuality },
      { metric: 'Total Translation Keys', value: summary.statistics.totalKeys },
      {
        metric: 'Average Completion (%)',
        value: summary.statistics.completionPercentage,
      },
      {
        metric: 'Report Generated',
        value: new Date(summary.generated).toLocaleString(),
      },
      { metric: 'Report Type', value: summary.reportType },
    ];

    summaryWriter
      .writeRecords(summaryData)
      .then(() => console.log('✅ Generated CSV summary report'));
  } catch (error) {
    console.error('Error generating CSV reports:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
