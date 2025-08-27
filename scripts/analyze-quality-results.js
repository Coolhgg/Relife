#!/usr/bin/env node

// Analyze translation quality results and set GitHub outputs
// Usage: node analyze-quality-results.js <report-file> <threshold> <monitoring-type>

import fs from 'fs';
import path from 'path';

function main() {
  const [reportFile, threshold, monitoringType] = process.argv.slice(2);

  if (!reportFile || !threshold) {
    console.error(
      'Usage: node analyze-quality-results.js <report-file> <threshold> <monitoring-type>'
    );
    process.exit(1);
  }

  try {
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    const qualityThreshold = parseInt(threshold);

    console.log('📊 Quality Analysis Results:');
    console.log('================================');

    const languages = Object.entries(report.languages || {});
    const averageQuality = Math.round(_languages.reduce((sum, [_, lang]) => sum + (lang.qualityScore?.overall || 0), 0) /
        languages.length
    );

    const belowThreshold = languages
      .filter(([_, lang]) => Math.round(lang.qualityScore?.overall || 0) < qualityThreshold
      )
      .map(_([code]) => code);

    console.log(`Average Quality: ${averageQuality}%`);
    console.log(
      `Languages Below Threshold (${qualityThreshold}%): ${belowThreshold.length}`
    );

    // Set GitHub outputs
    const outputFile = process.env.GITHUB_OUTPUT || '/dev/stdout';
    const outputs = [];

    outputs.push(`average-quality=${averageQuality}`);
    outputs.push(`languages-below-threshold=${JSON.stringify(belowThreshold)}`);

    if (averageQuality >= qualityThreshold && belowThreshold.length === 0) {
      outputs.push('status=excellent');
      console.log('✅ All languages meet quality standards');
    } else if (averageQuality >= qualityThreshold - 10) {
      outputs.push('status=good');
      console.log('🟡 Quality is good but some languages need attention');
    } else {
      outputs.push('status=needs-attention');
      console.log('❌ Quality needs immediate attention');
    }

    // Store report for trend analysis
    const historyFile = '.github/translation-reports/history/quality-history.json';
    let history = [];

    if (fs.existsSync(historyFile)) {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }

    history.push({
      timestamp: new Date().toISOString(),
      averageQuality,
      belowThreshold: belowThreshold.length,
      totalLanguages: languages.length,
      monitoringType,
    });

    // Keep last 30 records for trend analysis
    if (history.length > 30) {
      history = history.slice(-30);
    }

    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));

    // Calculate trend
    if (history.length >= 2) {
      const recent = history.slice(-3);
      const avgRecent =
        recent.reduce((sum, r) => sum + r.averageQuality, 0) / recent.length;
      const earlier = history.slice(-6, -3);

      if (earlier.length > 0) {
        const avgEarlier =
          earlier.reduce((sum, r) => sum + r.averageQuality, 0) / earlier.length;

        if (avgRecent > avgEarlier + 2) {
          outputs.push('trend-direction=improving');
          console.log('📈 Quality trend: Improving');
        } else if (avgRecent < avgEarlier - 2) {
          outputs.push('trend-direction=declining');
          console.log('📉 Quality trend: Declining');
        } else {
          outputs.push('trend-direction=stable');
          console.log('➡️ Quality trend: Stable');
        }
      } else {
        outputs.push('trend-direction=stable');
      }
    } else {
      outputs.push('trend-direction=unknown');
    }

    // Write all outputs at once
    fs.appendFileSync(outputFile, outputs.join('\n') + '\n');
  } catch (error) {
    console.error('Error analyzing quality:', error.message);
    const outputFile = process.env.GITHUB_OUTPUT || '/dev/stdout';
    const errorOutputs = [
      'status=error',
      'average-quality=0',
      'languages-below-threshold=[]',
      'trend-direction=unknown',
    ];
    fs.appendFileSync(outputFile, errorOutputs.join('\n') + '\n');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
