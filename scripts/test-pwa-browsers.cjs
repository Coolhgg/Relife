#!/usr/bin/env node

/**
 * PWA Browser Testing Script
 * Tests PWA installation and functionality across multiple browsers
 */

const fs = require('fs');
const path = require('path');
const _https = require('https');

class PWABrowserTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
      },
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
    }[type];

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addTestResult(test, status, message, details = {}) {
    const result = {
      test,
      status, // 'pass', 'fail', 'warning'
      message,
      details,
      timestamp: new Date().toISOString(),
    };

    this.results.tests.push(result);
    this.results.summary.total++;

    if (status === 'pass') this.results.summary.passed++;
    else if (status === 'fail') this.results.summary.failed++;
    else if (status === 'warning') this.results.summary.warnings++;

    this.log(
      `${test}: ${message}`,
      status === 'pass' ? 'success' : status === 'fail' ? 'error' : 'warning'
    );
  }

  // Test PWA Manifest
  testManifest() {
    this.log('Testing PWA Manifest...', 'info');

    try {
      const manifestPath = path.join(__dirname, '../public/manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

      // Required fields
      const requiredFields = [
        'name',
        'short_name',
        'start_url',
        'display',
        'theme_color',
        'icons',
      ];
      const missingFields = requiredFields.filter((field) => !manifest[field]);

      if (missingFields.length > 0) {
        this.addTestResult(
          'Manifest Required Fields',
          'fail',
          `Missing required fields: ${missingFields.join(', ')}`,
          { missingFields }
        );
      } else {
        this.addTestResult(
          'Manifest Required Fields',
          'pass',
          'All required manifest fields present'
        );
      }

      // Icon sizes validation
      const requiredIconSizes = [
        '72x72',
        '96x96',
        '128x128',
        '144x144',
        '152x152',
        '192x192',
        '384x384',
        '512x512',
      ];
      const existingIconSizes = manifest.icons.map((icon) => icon.sizes);
      const missingIcons = requiredIconSizes.filter(
        (size) => !existingIconSizes.includes(size)
      );

      if (missingIcons.length > 0) {
        this.addTestResult(
          'Manifest Icon Sizes',
          'warning',
          `Missing recommended icon sizes: ${missingIcons.join(', ')}`,
          { missingIcons }
        );
      } else {
        this.addTestResult(
          'Manifest Icon Sizes',
          'pass',
          'All recommended icon sizes present'
        );
      }

      // Advanced PWA features
      const advancedFeatures = ['shortcuts', 'screenshots', 'categories'];
      const existingAdvanced = advancedFeatures.filter((feature) => manifest[feature]);

      this.addTestResult(
        'Advanced PWA Features',
        existingAdvanced.length === advancedFeatures.length ? 'pass' : 'warning',
        `Advanced features: ${existingAdvanced.join(', ')}`,
        {
          existingAdvanced,
          missingAdvanced: advancedFeatures.filter((f) => !manifest[f]),
        }
      );
    } catch (error) {
      this.addTestResult(
        'Manifest Validation',
        'fail',
        `Failed to read/parse manifest: ${error.message}`,
        { error: error.message }
      );
    }
  }

  // Test Service Worker
  testServiceWorker() {
    this.log('Testing Service Worker...', 'info');

    try {
      const swPath = path.join(__dirname, '../public/sw-enhanced.js');
      const swContent = fs.readFileSync(swPath, 'utf8');

      // Check for PWA features
      const pwaPattterns = {
        'Cache Management': /CACHE_NAME.*=.*['"].*['"]/,
        'Install Event': /addEventListener.*['"]install['"]/,
        'Fetch Event': /addEventListener.*['"]fetch['"]/,
        'Background Sync': /sync.*['"]background.*sync['"]/,
        'Push Notifications': /addEventListener.*['"]push['"]/,
        'Offline Support': /navigator\.onLine/,
      };

      Object.entries(pwaPattterns).forEach(([feature, pattern]) => {
        if (pattern.test(swContent)) {
          this.addTestResult(
            `Service Worker ${feature}`,
            'pass',
            `${feature} implementation found`
          );
        } else {
          this.addTestResult(
            `Service Worker ${feature}`,
            'warning',
            `${feature} implementation not detected`,
            { pattern: pattern.toString() }
          );
        }
      });
    } catch (error) {
      this.addTestResult(
        'Service Worker Validation',
        'fail',
        `Failed to read service worker: ${error.message}`,
        { error: error.message }
      );
    }
  }

  // Test PWA Icons
  testPWAIcons() {
    this.log('Testing PWA Icons...', 'info');

    const iconSizes = ['72x72', '192x192', '512x512'];
    const iconPath = path.join(__dirname, '../public');

    iconSizes.forEach((size) => {
      const iconFile = `icon-${size}.png`;
      const fullPath = path.join(iconPath, iconFile);

      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        this.addTestResult(
          `PWA Icon ${size}`,
          'pass',
          `Icon exists (${(stats.size / 1024).toFixed(1)}KB)`,
          { size: stats.size, path: iconFile }
        );
      } else {
        this.addTestResult(
          `PWA Icon ${size}`,
          'fail',
          `Icon file missing: ${iconFile}`,
          { expectedPath: iconFile }
        );
      }
    });
  }

  // Generate browser-specific test HTML
  generateBrowserTests() {
    this.log('Generating browser test files...', 'info');

    const testHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relife PWA Browser Test</title>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#667eea">
  <style>
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .test-section { 
      background: rgba(255,255,255,0.1); 
      padding: 20px; 
      margin: 20px 0; 
      border-radius: 10px; 
      backdrop-filter: blur(10px);
    }
    .test-button { 
      background: #4CAF50; 
      color: white; 
      border: none; 
      padding: 12px 24px; 
      margin: 10px; 
      border-radius: 5px; 
      cursor: pointer; 
      font-size: 16px;
    }
    .test-button:hover { background: #45a049; }
    .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
    .success { background: rgba(76, 175, 80, 0.3); }
    .error { background: rgba(244, 67, 54, 0.3); }
    .warning { background: rgba(255, 193, 7, 0.3); }
    .info { background: rgba(33, 150, 243, 0.3); }
  </style>
</head>
<body>
  <h1>🚀 Relife PWA Browser Test</h1>
  
  <div class="test-section">
    <h2>Browser PWA Support Detection</h2>
    <div id="browser-info"></div>
    <div id="pwa-support"></div>
  </div>

  <div class="test-section">
    <h2>Installation Tests</h2>
    <button class="test-button" onclick="testInstallPrompt()">Test Install Prompt</button>
    <button class="test-button" onclick="testServiceWorker()">Test Service Worker</button>
    <button class="test-button" onclick="testOfflineMode()">Test Offline Mode</button>
    <div id="installation-results"></div>
  </div>

  <div class="test-section">
    <h2>PWA Features Tests</h2>
    <button class="test-button" onclick="testNotifications()">Test Notifications</button>
    <button class="test-button" onclick="testFullscreen()">Test Fullscreen</button>
    <button class="test-button" onclick="testCacheAPI()">Test Cache API</button>
    <div id="features-results"></div>
  </div>

  <div class="test-section">
    <h2>Test Results</h2>
    <div id="test-results"></div>
    <button class="test-button" onclick="downloadResults()">Download Results</button>
  </div>

  <script>
    let testResults = {
      browser: navigator.userAgent,
      timestamp: new Date().toISOString(),
      tests: [],
      support: {}
    };

    function addResult(test, status, message) {
      testResults.tests.push({ test, status, message, timestamp: new Date().toISOString() });
      updateDisplay();
    }

    function updateDisplay() {
      const container = document.getElementById('test-results');
      container.innerHTML = testResults.tests.map(t => 
        \`<div class="status \${t.status}"><strong>\${t.test}:</strong> \${t.message}</div>\`
      ).join('');
    }

    // Browser detection
    function detectBrowser() {
      const ua = navigator.userAgent;
      let browser = 'Unknown';
      
      if (ua.includes('Chrome') && !ua.includes('Edge')) browser = 'Chrome';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
      else if (ua.includes('Edge')) browser = 'Edge';
      
      const info = \`
        <div class="status info">
          <strong>Browser:</strong> \${browser}<br>
          <strong>Platform:</strong> \${navigator.platform}<br>
          <strong>PWA Support:</strong> \${'serviceWorker' in navigator ? '✅' : '❌'}<br>
          <strong>Push Support:</strong> \${'PushManager' in window ? '✅' : '❌'}<br>
          <strong>Notification Support:</strong> \${'Notification' in window ? '✅' : '❌'}
        </div>
      \`;
      
      document.getElementById('browser-info').innerHTML = info;
      
      testResults.support = {
        serviceWorker: 'serviceWorker' in navigator,
        pushManager: 'PushManager' in window,
        notifications: 'Notification' in window,
        installPrompt: 'onbeforeinstallprompt' in window
      };
    }

    // Test install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      deferredPrompt = e;
      addResult('Install Prompt', 'success', 'Install prompt available');
    });

    function testInstallPrompt() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          addResult('Install Choice', choiceResult.outcome === 'accepted' ? 'success' : 'warning', 
            \`User \${choiceResult.outcome} the install prompt\`);
          deferredPrompt = null;
        });
      } else {
        addResult('Install Prompt', 'error', 'Install prompt not available or already used');
      }
    }

    // Test service worker
    function testServiceWorker() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw-enhanced.js')
          .then(registration => {
            addResult('Service Worker', 'success', 'Service Worker registered successfully');
          })
          .catch(error => {
            addResult('Service Worker', 'error', \`Service Worker registration failed: \${error.message}\`);
          });
      } else {
        addResult('Service Worker', 'error', 'Service Worker not supported');
      }
    }

    // Test offline mode
    function testOfflineMode() {
      const originalOnLine = navigator.onLine;
      addResult('Offline Detection', originalOnLine ? 'warning' : 'success', 
        \`Currently \${originalOnLine ? 'online' : 'offline'}\`);
      
      // Test cache API
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          addResult('Cache API', 'success', \`\${cacheNames.length} caches found: \${cacheNames.join(', ')}\`);
        });
      } else {
        addResult('Cache API', 'error', 'Cache API not supported');
      }
    }

    // Test notifications
    function testNotifications() {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Relife PWA Test', {
            body: 'Notifications are working!',
            icon: '/icon-192x192.png'
          });
          addResult('Notifications', 'success', 'Notification sent successfully');
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            addResult('Notifications', permission === 'granted' ? 'success' : 'warning', 
              \`Notification permission: \${permission}\`);
          });
        } else {
          addResult('Notifications', 'error', 'Notifications denied');
        }
      } else {
        addResult('Notifications', 'error', 'Notifications not supported');
      }
    }

    // Test fullscreen
    function testFullscreen() {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
          .then(() => {
            addResult('Fullscreen', 'success', 'Fullscreen mode activated');
            setTimeout(() => document.exitFullscreen(), 2000);
          })
          .catch(error => {
            addResult('Fullscreen', 'error', \`Fullscreen failed: \${error.message}\`);
          });
      } else {
        addResult('Fullscreen', 'error', 'Fullscreen API not supported');
      }
    }

    // Test Cache API
    function testCacheAPI() {
      if ('caches' in window) {
        const testCache = 'relife-test-cache';
        caches.open(testCache)
          .then(cache => {
            return cache.add('/manifest.json');
          })
          .then(() => {
            addResult('Cache API Write', 'success', 'Successfully cached test file');
            return caches.delete(testCache);
          })
          .then(() => {
            addResult('Cache API Cleanup', 'success', 'Test cache cleaned up');
          })
          .catch(error => {
            addResult('Cache API', 'error', \`Cache test failed: \${error.message}\`);
          });
      } else {
        addResult('Cache API', 'error', 'Cache API not supported');
      }
    }

    // Download results
    function downloadResults() {
      const blob = new Blob([JSON.stringify(testResults, null, 2)], 
        { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`relife-pwa-test-\${new Date().toISOString().split('T')[0]}.json\`;
      a.click();
      URL.revokeObjectURL(url);
    }

    // Initialize
    detectBrowser();
    
    // Auto-run basic tests
    setTimeout(() => {
      testServiceWorker();
      testOfflineMode();
    }, 1000);
  </script>
</body>
</html>`;

    const testDir = path.join(__dirname, '../test-pwa');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    fs.writeFileSync(path.join(testDir, 'browser-test.html'), testHTML);

    this.addTestResult(
      'Browser Test Generation',
      'pass',
      'Browser test HTML generated successfully',
      { path: 'test-pwa/browser-test.html' }
    );
  }

  // Generate Lighthouse PWA audit
  generateLighthouseConfig() {
    this.log('Generating Lighthouse PWA config...', 'info');

    const lighthouseConfig = {
      extends: 'lighthouse:default',
      settings: {
        onlyCategories: ['pwa', 'performance', 'accessibility'],
        skipAudits: ['redirects-http'],
      },
      audits: [
        'installable-manifest',
        'splash-screen',
        'themed-omnibox',
        'content-width',
        'viewport',
        'apple-touch-icon',
        'maskable-icon',
        'service-worker',
        'works-offline',
        'offline-start-url',
      ],
    };

    const testDir = path.join(__dirname, '../test-pwa');
    fs.writeFileSync(
      path.join(testDir, 'lighthouse-config.json'),
      JSON.stringify(lighthouseConfig, null, 2)
    );

    // Generate test script
    const testScript = `#!/bin/bash

# Relife PWA Lighthouse Testing Script
echo "🚀 Starting Relife PWA Lighthouse Tests..."

# Ensure the app is running
if ! curl -f http://localhost:5173 > /dev/null 2>&1; then
  echo "❌ App not running. Please start with: npm run dev"
  exit 1
fi

echo "📊 Running Lighthouse PWA audit..."

# Run Lighthouse with PWA focus
lighthouse http://localhost:5173 \\
  --config-path=./lighthouse-config.json \\
  --output=html,json \\
  --output-path=./lighthouse-report \\
  --chrome-flags="--headless --no-sandbox" \\
  --verbose

echo "✅ Lighthouse audit complete!"
echo "📄 Reports saved to:"
echo "  - lighthouse-report.html (visual report)"
echo "  - lighthouse-report.json (raw data)"

# Check PWA score
if command -v jq &> /dev/null; then
  PWA_SCORE=$(jq '.categories.pwa.score * 100' lighthouse-report.json)
  echo "🏆 PWA Score: $PWA_SCORE/100"
  
  if (( $(echo "$PWA_SCORE >= 90" | bc -l) )); then
    echo "🎉 Excellent PWA score!"
  elif (( $(echo "$PWA_SCORE >= 70" | bc -l) )); then
    echo "⚠️  Good PWA score, room for improvement"
  else
    echo "❌ PWA score needs improvement"
  fi
fi
`;

    fs.writeFileSync(path.join(testDir, 'run-lighthouse.sh'), testScript);
    fs.chmodSync(path.join(testDir, 'run-lighthouse.sh'), '755');

    this.addTestResult(
      'Lighthouse Config Generation',
      'pass',
      'Lighthouse configuration and test script generated',
      {
        configPath: 'test-pwa/lighthouse-config.json',
        scriptPath: 'test-pwa/run-lighthouse.sh',
      }
    );
  }

  // Run all tests
  async run() {
    this.log('🚀 Starting PWA Browser Testing Suite...', 'info');

    this.testManifest();
    this.testServiceWorker();
    this.testPWAIcons();
    this.generateBrowserTests();
    this.generateLighthouseConfig();

    // Generate final report
    const reportPath = path.join(__dirname, '../test-pwa/test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    this.log(`\\n📊 Test Summary:`, 'info');
    this.log(`  Total Tests: ${this.results.summary.total}`, 'info');
    this.log(`  Passed: ${this.results.summary.passed}`, 'success');
    this.log(`  Failed: ${this.results.summary.failed}`, 'error');
    this.log(`  Warnings: ${this.results.summary.warnings}`, 'warning');
    this.log(`\\n📄 Full report saved to: ${reportPath}`, 'info');

    return this.results;
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new PWABrowserTester();
  tester.run().then((results) => {
    process.exit(results.summary.failed > 0 ? 1 : 0);
  });
}

module.exports = PWABrowserTester;
