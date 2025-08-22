module.exports = {
  ci: {
    collect: {
      // Number of lighthouse runs per URL (more runs = more accurate results)
      numberOfRuns: 3,
      // URLs to test - using localhost for CI builds or production URL
      url: [
        'http://localhost:4173', // Preview build URL - homepage
        'http://localhost:4173/settings', // Settings page
        'http://localhost:4173/alarm/create', // Alarm creation
        'http://localhost:4173/onboarding', // Onboarding flow
      ],
      // Build settings
      staticDistDir: './dist',
      // Chrome options for headless CI
      chromeFlags: '--no-sandbox --disable-gpu --disable-dev-shm-usage --headless',
      // Wait for page to be ready before running audit
      settings: {
        // Wait 3 seconds after load before starting audit
        pauseAfterLoadMs: 3000,
        // Include all performance-related categories
        onlyCategories: ['performance', 'best-practices', 'accessibility', 'seo'],
        // Set viewport for desktop performance testing
        screenEmulation: {
          mobile: false,
          width: 1200,
          height: 800,
        },
        // Throttling settings for consistent results
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
      },
    },
    assert: {
      assertions: {
        // Performance budgets - strict for alarm app
        'categories:performance': ['error', { minScore: 0.85 }], // Must score 85+ for performance
        'categories:best-practices': ['error', { minScore: 0.9 }], // Must score 90+ for best practices
        'categories:accessibility': ['error', { minScore: 0.9 }], // Must score 90+ for accessibility
        'categories:seo': ['warn', { minScore: 0.8 }], // Warn if SEO < 80

        // Critical performance metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }], // FCP < 2s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // LCP < 2.5s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // CLS < 0.1
        'total-blocking-time': ['warn', { maxNumericValue: 300 }], // TBT < 300ms
        'speed-index': ['warn', { maxNumericValue: 3000 }], // SI < 3s

        // Resource optimization
        'unused-javascript': ['warn', { maxNumericValue: 50000 }], // < 50KB unused JS
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }], // < 20KB unused CSS
        'modern-image-formats': 'error', // Use modern image formats
        'uses-optimized-images': 'warn', // Optimize images
        'uses-text-compression': 'error', // Enable text compression
        'uses-rel-preconnect': 'warn', // Use preconnect for external domains

        // Bundle size and efficiency
        'bootup-time': ['warn', { maxNumericValue: 3000 }], // JS bootup < 3s
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }], // Main thread < 4s
        'dom-size': ['warn', { maxNumericValue: 1500 }], // DOM nodes < 1500

        // Accessibility (carried over from main config)
        'color-contrast': 'error',
        'image-alt': 'error',
        label: 'error',
        'button-name': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',

        // Best practices
        'uses-https': 'error',
        'is-on-https': 'error',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn', // Content Security Policy
      },
    },
    upload: {
      target: 'temporary-public-storage', // Store performance reports temporarily for PR artifacts
      // Set up for future GitHub integration
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
      // Optional: Configure for future LHCI server
      // target: 'lhci',
      // serverBaseUrl: process.env.LHCI_SERVER_URL
    },
  },
};
