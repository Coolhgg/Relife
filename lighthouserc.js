module.exports = {
  ci: {
    collect: {
      // Number of lighthouse runs per URL (more runs = more accurate results)
      numberOfRuns: 3,
      // URLs to test - using localhost for CI builds or production URL
      url: [
        'http://localhost:4173', // Preview build URL
        'http://localhost:4173/settings',
        'http://localhost:4173/alarm/create',
        'http://localhost:4173/onboarding',
      ],
      // Build settings
      staticDistDir: './dist',
      // Chrome options for headless CI
      chromeFlags: '--no-sandbox --disable-gpu --disable-dev-shm-usage --headless',
      // Wait for page to be ready before running audit
      settings: {
        // Wait 3 seconds after load before starting audit
        pauseAfterLoadMs: 3000,
        // Skip the Progressive Web App audit category for now
        // onlyCategories: ['accessibility', 'best-practices', 'performance', 'seo'],
        // Include accessibility in the audit
        onlyCategories: ['accessibility'],
        // Set viewport for mobile-first testing
        screenEmulation: {
          mobile: false,
          width: 1200,
          height: 800,
        },
      },
    },
    assert: {
      assertions: {
        // Accessibility assertions - must score at least 90/100
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // Specific accessibility rules we care about
        'aria-allowed-attr': 'off', // Allow some flexibility with ARIA
        'aria-hidden-body': 'error',
        'aria-hidden-focus': 'error',
        'aria-input-field-name': 'error',
        'aria-required-children': 'error',
        'aria-required-parent': 'error',
        'aria-roles': 'error',
        'aria-valid-attr-value': 'error',
        'aria-valid-attr': 'error',
        'button-name': 'error',
        bypass: 'error', // Skip links
        'color-contrast': 'error',
        'document-title': 'error',
        'duplicate-id-aria': 'error',
        'form-field-multiple-labels': 'error',
        'frame-title': 'off', // Not applicable for SPA
        'heading-order': 'warn', // Allow some flexibility
        'html-has-lang': 'error',
        'html-lang-valid': 'error',
        'image-alt': 'error',
        'input-image-alt': 'error',
        label: 'error',
        'link-name': 'error',
        list: 'error',
        listitem: 'error',
        'meta-refresh': 'error',
        'meta-viewport': 'error',
        'object-alt': 'error',
        'select-name': 'error',
        'skip-link': 'warn', // Warn instead of error to allow gradual implementation
        tabindex: 'error',
        'td-headers-attr': 'off', // Not applicable for current app
        'th-has-data-cells': 'off', // Not applicable for current app
        'valid-lang': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage', // Store reports temporarily for PR artifacts
      // Set up for future GitHub integration
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
      // Optional: Configure for future LHCI server
      // target: 'lhci',
      // serverBaseUrl: process.env.LHCI_SERVER_URL
    },
  },
};
