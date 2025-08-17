/** @type {import('jest').Config} */
const config = {
  // Test environment with enhanced configuration
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    // Enhanced jsdom configuration for better compatibility
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable',
    runScripts: 'dangerously',
    // Enhanced browser simulation
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    // Screen simulation for responsive testing
    screen: {
      width: 375,
      height: 812,
      devicePixelRatio: 3
    }
  },
  
  // Setup files with enhanced configuration
  setupFiles: [
    '<rootDir>/src/test-setup.ts',
    '<rootDir>/src/__tests__/setup/global-setup.ts'
  ],
  setupFilesAfterEnv: [
    '@testing-library/jest-dom',
    '<rootDir>/src/__tests__/setup/after-env-setup.ts'
  ],
  
  // Enhanced module name mapping for comprehensive path resolution
  moduleNameMapper: {
    // Absolute path imports
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@data/(.*)$': '<rootDir>/src/data/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@backend/(.*)$': '<rootDir>/src/backend/$1',
    
    // Style and asset mocks
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(png|jpg|jpeg|gif|webp|avif|svg)$': '<rootDir>/src/__tests__/mocks/file-mock.ts',
    '\\.(mp3|wav|ogg|m4a)$': '<rootDir>/src/__tests__/mocks/audio-mock.ts',
    
    // External module mocks
    '^posthog-js$': '<rootDir>/src/__tests__/mocks/posthog.mock.ts',
    '^@sentry/react$': '<rootDir>/src/__tests__/mocks/sentry.mock.ts',
    '^@supabase/supabase-js$': '<rootDir>/src/__tests__/mocks/supabase.mock.ts',
    '^@stripe/stripe-js$': '<rootDir>/src/__tests__/mocks/stripe.mock.ts',
    '^@capacitor/(.*)$': '<rootDir>/src/__tests__/mocks/capacitor.mock.ts',
    
    // React Router mock
    '^react-router-dom$': '<rootDir>/src/__tests__/mocks/react-router.mock.ts'
  },
  
  // Enhanced file extensions
  moduleFileExtensions: [
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'mjs',
    'cjs',
    'node'
  ],
  
  // Advanced transform configuration with caching
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          target: 'ES2020',
          moduleResolution: 'node'
        },
        isolatedModules: true,
        useESM: true,
        // Enable caching for faster builds
        compiler: 'typescript'
      }
    ],
    '^.+\\.(js|jsx|mjs|cjs)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          '@babel/preset-typescript'
        ],
        plugins: [
          '@babel/plugin-transform-runtime'
        ]
      }
    ]
  },
  
  // Enhanced ignore patterns for better performance
  transformIgnorePatterns: [
    'node_modules/(?!(@testing-library|@babel|@jest|posthog-js|@supabase|@stripe|@sentry|@capacitor|lucide-react|date-fns|recharts|react-day-picker|framer-motion|embla-carousel-react|vaul|sonner|cmdk|next-themes|class-variance-authority|tailwind-merge|i18next|react-i18next|.*\\.mjs$))'
  ],
  
  // Enhanced test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/tests/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/e2e/**/*.(test|spec).(ts|tsx|js|jsx)'
  ],
  
  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/android/',
    '/ios/',
    '/.next/',
    '/coverage/'
  ],
  
  // Enhanced watch plugins for better developer experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    'jest-watch-select-projects',
    'jest-watch-suspend'
  ],
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '\.git/',
    '\.vscode/',
    '\.idea/'
  ],
  
  // Force exit after tests complete
  forceExit: process.env.CI ? true : false,
  
  // Enhanced coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/**/*.spec.{ts,tsx,js,jsx}',
    '!src/test-setup.ts',
    '!src/**/*.stories.{ts,tsx,js,jsx}',
    '!src/**/index.{ts,tsx,js,jsx}',
    // Exclude config files
    '!src/config/**',
    // Exclude type-only files
    '!src/types/**',
    // Include specific important files
    'src/services/**/*.{ts,tsx}',
    'src/components/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    'src/utils/**/*.{ts,tsx}',
    'src/contexts/**/*.{ts,tsx}'
  ],
  
  // Progressive coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Strict thresholds for critical modules
    './src/services/alarm.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/services/voice.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/services/subscription.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    // Relaxed thresholds for UI components
    './src/components/': {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  
  // Enhanced coverage reporters with comprehensive output formats
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    ['html', { 
      skipEmpty: true,
      subdir: 'html-report',
      verbose: true
    }],
    'json',
    'clover',
    'cobertura',
    ['json-summary', { 
      file: 'coverage-summary.json' 
    }],
    ['teamcity', {
      blockName: 'Relife Coverage',
      file: 'teamcity-coverage.txt'
    }]
  ],
  
  // Coverage output directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Enhanced mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Performance optimizations with dynamic worker allocation
  maxWorkers: process.env.CI ? '100%' : '50%',
  testTimeout: process.env.CI ? 30000 : 15000,
  
  // Advanced parallel execution
  runInBand: process.env.CI ? false : false,
  
  // Memory management
  logHeapUsage: process.env.NODE_ENV === 'development',
  workerIdleMemoryLimit: '512MB',
  
  // Enhanced output configuration with better formatting
  verbose: process.env.CI ? false : true,
  detectOpenHandles: process.env.NODE_ENV === 'development',
  detectLeaks: process.env.NODE_ENV === 'development',
  
  // Advanced debugging configuration
  silent: false,
  passWithNoTests: true,
  listTests: false,
  
  // Test retry configuration for flaky tests
  testRetries: process.env.CI ? 2 : 0,
  
  // Jest extensions and plugins
  watchman: true,
  
  // Notify configuration for watch mode
  notify: false,
  notifyMode: 'failure-change',
  
  // Error handling
  errorOnDeprecated: true,
  bail: false, // Continue testing even if some tests fail
  
  // Enhanced test results caching with better performance
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // Cache management
  clearCache: false,
  
  // Dependency extraction for better caching
  dependencyExtractor: undefined,
  
  // Haste map configuration
  haste: {
    enableSymlinks: false,
    forceNodeFilesystemAPI: false,
    throwOnModuleCollision: true
  },
  
  // Enhanced globals with comprehensive environment setup
  globals: {
    'ts-jest': {
      useESM: true,
      isolatedModules: true,
      tsconfig: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        skipLibCheck: true,
        strict: false
      }
    },
    // Global test environment variables
    __TEST_ENV__: 'jest',
    __DEVELOPMENT__: false,
    __PRODUCTION__: false,
    __TESTING__: true,
    __VERSION__: '1.0.0',
    
    // Feature flags for testing
    __ENABLE_PREMIUM_FEATURES__: true,
    __ENABLE_ANALYTICS__: false,
    __ENABLE_DEBUG_LOGS__: false,
    
    // Mock API endpoints
    __API_BASE_URL__: 'http://localhost:3000/api',
    __SUPABASE_URL__: 'http://localhost:54321',
    __STRIPE_PUBLIC_KEY__: 'pk_test_mock_key'
  },
  
  // Custom test sequences
  testSequencer: '<rootDir>/src/__tests__/config/test-sequencer.js',
  
  // Enhanced reporters with advanced configurations
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'test-report.html',
        pageTitle: 'Relife Test Report',
        logoImgPath: './public/icon-192x192.png',
        expand: true,
        hideIcon: false,
        testCommand: 'npm test',
        openReport: false,
        failureMessageOnly: false
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        includeConsoleOutput: true,
        includeShortConsoleOutput: false
      }
    ],
    [
      'jest-sonar-reporter',
      {
        outputDirectory: './coverage',
        outputName: 'sonar-report.xml',
        reportedFilePath: 'relative'
      }
    ],
    [
      '@jest/reporters',
      {
        silent: false,
        verbose: true,
        useDots: false
      }
    ]
  ],
  
  // Enhanced ESM support with better module resolution
  preset: undefined,
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts', '.cts'],
  
  // Module resolution enhancements
  resolver: undefined,
  
  // Custom test runner for specific test types
  runner: 'jest-runner',
  
  // Project configuration for multi-project setup
  projects: undefined,
  
  // Custom test results processor
  testResultsProcessor: undefined,
  
  // Custom snapshot serializers
  snapshotSerializers: [
    'enzyme-to-json/serializer',
    '@emotion/jest/serializer'
  ],
  
  // Snapshot configuration
  updateSnapshot: process.env.UPDATE_SNAPSHOTS === 'true',
  
  // Timezone configuration for consistent date/time testing
  timers: 'real',
  
  // Enhanced module directories with priority ordering
  moduleDirectories: [
    'node_modules', 
    '<rootDir>/src',
    '<rootDir>/src/components',
    '<rootDir>/src/hooks',
    '<rootDir>/src/utils',
    '<rootDir>/src/services'
  ],
  
  // Test environment setup with enhanced configuration
  globalSetup: '<rootDir>/src/__tests__/config/global-setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/config/global-teardown.ts',
  
  // Enhanced test data management
  testDataPathPattern: '/testdata/',
  
  // Test name pattern for better organization
  testNamePattern: undefined,
  
  // Root directory configuration
  rootDir: '.',
  
  // Test runner options
  testRunner: 'jest-circus/runner',
  
  // Advanced configuration for CI/CD optimization
  ...(process.env.CI && {
    // CI-specific optimizations
    collectCoverage: true,
    coverageReporters: ['lcov', 'text-summary', 'clover'],
    maxWorkers: '100%',
    testTimeout: 30000,
    verbose: false,
    silent: true,
    reporters: [
      'default',
      ['jest-junit', {
        outputDirectory: './coverage',
        outputName: 'junit.xml'
      }]
    ]
  })
};

// Environment-specific configuration overrides
if (process.env.NODE_ENV === 'development') {
  // Development-specific settings
  config.verbose = true;
  config.detectOpenHandles = true;
  config.detectLeaks = true;
  config.notify = true;
  config.logHeapUsage = true;
}

if (process.env.NODE_ENV === 'production') {
  // Production testing settings
  config.verbose = false;
  config.silent = true;
  config.bail = true;
  config.maxWorkers = '100%';
}

if (process.env.JEST_WATCH === 'true') {
  // Watch mode optimizations
  config.watchAll = false;
  config.watchman = true;
  config.cache = true;
}

// Debug mode configuration
if (process.env.DEBUG_JEST === 'true') {
  config.verbose = true;
  config.detectOpenHandles = true;
  config.detectLeaks = true;
  config.logHeapUsage = true;
  config.silent = false;
}

export default config;