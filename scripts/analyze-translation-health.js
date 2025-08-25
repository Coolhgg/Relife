#!/usr/bin/env node

// Analyze translation health for notifications
// Usage: node analyze-translation-health.js <analysis-file> <min-threshold> <critical-threshold> <notification-type>

import fs from 'fs';

function main() {
  const [analysisFile, minThreshold, criticalThreshold, notificationType] =
    process.argv.slice(2);

  if (!analysisFile || !minThreshold || !criticalThreshold) {
    console.error(
      'Usage: node analyze-translation-health.js <analysis-file> <min-threshold> <critical-threshold> <notification-type>'
    );
    process.exit(1);
  }

  try {
    const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));
    const languages = Object.entries(analysis.languages || {});
    const minQualityThreshold = parseInt(minThreshold);
    const criticalQualityThreshold = parseInt(criticalThreshold);

    console.log('🔍 Health Analysis Results:');
    console.log('===========================');

    let needsAttention = false;
    let criticalIssues = 0;
    let qualityAlerts = [];
    let maintenanceDue = false;

    // Check quality scores
    const belowThreshold = languages.filter(([_, lang]) => {
      const quality = Math.round(lang.qualityScore?.overall || 0);
      return quality < minQualityThreshold;
    });

    const criticalLanguages = languages.filter(([_, lang]) => {
      const quality = Math.round(lang.qualityScore?.overall || 0);
      return quality < criticalQualityThreshold;
    });

    if (belowThreshold.length > 0) {
      needsAttention = true;
      qualityAlerts = belowThreshold.map(_([code, lang]) => ({
        language: code,
        quality: Math.round(lang.qualityScore?.overall || 0),
        issues: lang.culturalIssues?.filter(i => i.severity === 'critical').length || 0,
      }));

      console.log(
        `⚠️ Languages below quality threshold (${minQualityThreshold}%): ${belowThreshold.length}`
      );
    }

    if (criticalLanguages.length > 0) {
      criticalIssues = criticalLanguages.length;
      console.log(`🚨 Critical quality issues: ${criticalIssues} languages`);
    }

    // Check for maintenance needs
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Check if any language hasn't been updated recently
    const staleLanguages = languages.filter(([_, lang]) => {
      const lastUpdate = lang.lastUpdated ? new Date(lang.lastUpdated) : new Date(0);
      return lastUpdate < weekAgo;
    });

    if (staleLanguages.length > 3) {
      maintenanceDue = true;
      console.log(`🔧 Maintenance needed: ${staleLanguages.length} stale languages`);
    }

    // Create notification data
    const notificationData = {
      timestamp: now.toISOString(),
      type: notificationType,
      summary: {
        totalLanguages: languages.length,
        averageQuality: Math.round(_languages.reduce(
            (sum, [_, lang]) => sum + (lang.qualityScore?.overall || 0),
            0
          ) / languages.length
        ),
        belowThreshold: belowThreshold.length,
        critical: criticalLanguages.length,
        stale: staleLanguages.length,
      },
      alerts: qualityAlerts,
      criticalLanguages: criticalLanguages.map(_([code, lang]) => ({
        language: code,
        quality: Math.round(lang.qualityScore?.overall || 0),
      })),
      staleLanguages: staleLanguages.map(_([code, lang]) => ({
        language: code,
        lastUpdate: lang.lastUpdated,
      })),
    };

    // Save notification data
    fs.writeFileSync(
      process.env.NOTIFICATIONS_DIR + '/notification-data.json',
      JSON.stringify(notificationData, null, 2)
    );

    // Set GitHub outputs
    const outputFile = process.env.GITHUB_OUTPUT || '/dev/stdout';
    const outputs = [
      `needs-attention=${needsAttention}`,
      `critical-issues=${criticalIssues}`,
      `quality-alerts=${JSON.stringify(qualityAlerts)}`,
      `maintenance-due=${maintenanceDue}`,
      `notification-data=${JSON.stringify(notificationData)}`,
    ];

    fs.appendFileSync(outputFile, outputs.join('\n') + '\n');

    console.log(`✅ Health analysis complete - Attention needed: ${needsAttention}`);
  } catch (error) {
    console.error('Error analyzing health:', error.message);
    const outputFile = process.env.GITHUB_OUTPUT || '/dev/stdout';
    const errorOutputs = [
      'needs-attention=false',
      'critical-issues=0',
      'quality-alerts=[]',
      'maintenance-due=false',
      'notification-data={}',
    ];
    fs.appendFileSync(outputFile, errorOutputs.join('\n') + '\n');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
