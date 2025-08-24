#!/usr/bin/env node

// Generate translation quality trends analysis
// Usage: node generate-trends.js <history-file>

const fs = require('fs');
const path = require('path');

function main() {
  const [historyFile] = process.argv.slice(2);

  if (!historyFile) {
    console.error('Usage: node generate-trends.js <history-file>');
    process.exit(1);
  }

  try {
    if (!fs.existsSync(historyFile)) {
      console.log('No historical data available for trend analysis');
      return;
    }

    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    const trendsFile = '.github/translation-reports/trends/quality-trends.json';

    // Calculate trends over different time periods
    const now = new Date();
    const week = 7 * 24 * 60 * 60 * 1000;
    const month = 30 * 24 * 60 * 60 * 1000;

    const weekAgo = new Date(now - week);
    const monthAgo = new Date(now - month);

    const recentWeek = history.filter(h => new Date(h.timestamp) >= weekAgo);
    const recentMonth = history.filter(h => new Date(h.timestamp) >= monthAgo);

    const trends = {
      lastUpdated: now.toISOString(),
      weeklyTrend: {
        dataPoints: recentWeek.length,
        averageQuality:
          recentWeek.length > 0
            ? Math.round(
                recentWeek.reduce((sum, h) => sum + h.averageQuality, 0) /
                  recentWeek.length
              )
            : 0,
        qualityChange:
          recentWeek.length >= 2
            ? recentWeek[recentWeek.length - 1].averageQuality -
              recentWeek[0].averageQuality
            : 0,
      },
      monthlyTrend: {
        dataPoints: recentMonth.length,
        averageQuality:
          recentMonth.length > 0
            ? Math.round(
                recentMonth.reduce((sum, h) => sum + h.averageQuality, 0) /
                  recentMonth.length
              )
            : 0,
        qualityChange:
          recentMonth.length >= 2
            ? recentMonth[recentMonth.length - 1].averageQuality -
              recentMonth[0].averageQuality
            : 0,
      },
      recommendations: [],
    };

    // Generate recommendations based on trends
    if (trends.weeklyTrend.qualityChange < -5) {
      trends.recommendations.push(
        'Quality has declined significantly this week - immediate review needed'
      );
    } else if (trends.monthlyTrend.qualityChange < -3) {
      trends.recommendations.push(
        'Gradual quality decline over the month - consider translation review'
      );
    } else if (trends.weeklyTrend.qualityChange > 5) {
      trends.recommendations.push(
        'Great improvement this week - current practices are working well'
      );
    }

    if (trends.weeklyTrend.averageQuality < 70) {
      trends.recommendations.push(
        'Average quality below 70% - prioritize translation improvements'
      );
    }

    fs.writeFileSync(trendsFile, JSON.stringify(trends, null, 2));

    console.log('📊 Trend Analysis Summary:');
    console.log(
      `Weekly average: ${trends.weeklyTrend.averageQuality}% (change: ${trends.weeklyTrend.qualityChange >= 0 ? '+' : ''}${trends.weeklyTrend.qualityChange}%)`
    );
    console.log(
      `Monthly average: ${trends.monthlyTrend.averageQuality}% (change: ${trends.monthlyTrend.qualityChange >= 0 ? '+' : ''}${trends.monthlyTrend.qualityChange}%)`
    );

    if (trends.recommendations.length > 0) {
      console.log('Recommendations:');
      trends.recommendations.forEach(rec => console.log(`- ${rec}`));
    }
  } catch (error) {
    console.error('Error generating trends:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
