#!/usr/bin/env node

// Generate public status page from summary data
// Usage: node generate-status-page.js <summary-file> <output-file>

const fs = require('fs');

function main() {
  const [summaryFile, outputFile] = process.argv.slice(2);

  if (!summaryFile || !outputFile) {
    console.error('Usage: node generate-status-page.js <summary-file> <output-file>');
    process.exit(1);
  }

  try {
    if (!fs.existsSync(summaryFile)) {
      console.error('Summary data not found');
      process.exit(1);
    }

    const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));

    // Generate public status page HTML
    const statusHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relife - Translation Status</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; color: #333; background: #f8fafc;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { text-align: center; margin-bottom: 3rem; }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; color: #1e293b; }
        .header p { font-size: 1.1rem; color: #64748b; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-bottom: 3rem; }
        .stat-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-card h3 { font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.5rem; }
        .stat-card .value { font-size: 2.5rem; font-weight: 700; color: #1e293b; }
        .languages-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 3rem; }
        .language-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .language-card h4 { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: #1e293b; }
        .progress-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .progress-fill.excellent { background: #10b981; }
        .progress-fill.good { background: #f59e0b; }
        .progress-fill.poor { background: #ef4444; }
        .chart-container { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; }
        .footer { text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; color: #64748b; }
        .last-updated { font-size: 0.875rem; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Relife Translation Status</h1>
            <p>Real-time overview of our internationalization progress</p>
            <div class="last-updated">Last updated: ${new Date(summary.generated).toLocaleString()}</div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Languages</h3>
                <div class="value">${summary.statistics.totalLanguages}</div>
            </div>
            <div class="stat-card">
                <h3>Average Quality</h3>
                <div class="value">${summary.statistics.averageQuality}%</div>
            </div>
            <div class="stat-card">
                <h3>Translation Keys</h3>
                <div class="value">${summary.statistics.totalKeys.toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <h3>Average Completion</h3>
                <div class="value">${summary.statistics.completionPercentage}%</div>
            </div>
        </div>
        
        <div class="chart-container">
            <h3 style="margin-bottom: 1rem;">Quality Overview</h3>
            <canvas id="qualityChart" width="400" height="200"></canvas>
        </div>
        
        <div class="languages-grid">
            ${summary.languageBreakdown
              .map(
                lang => `
                <div class="language-card">
                    <h4>${lang.code.toUpperCase()} - ${lang.name || lang.code}</h4>
                    <div class="progress-bar">
                        <div class="progress-fill ${lang.quality >= 80 ? 'excellent' : lang.quality >= 60 ? 'good' : 'poor'}" style="width: ${lang.quality}%"></div>
                    </div>
                    <div style="font-size: 0.875rem; color: #64748b;">Quality: ${lang.quality}% • Completion: ${lang.completion}%</div>
                </div>
            `
              )
              .join('')}
        </div>
        
        <div class="footer">
            <p>Generated by Relife Translation Monitoring System</p>
        </div>
    </div>
    
    <script>
        // Create quality chart
        const ctx = document.getElementById('qualityChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [${summary.languageBreakdown.map(l => "'" + l.code.toUpperCase() + "'").join(',')}],
                datasets: [{
                    label: 'Quality Score',
                    data: [${summary.languageBreakdown.map(l => l.quality).join(',')}],
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;

    fs.writeFileSync(outputFile, statusHtml);
    console.log('✅ Generated public status page');
  } catch (error) {
    console.error('Error generating status page:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
