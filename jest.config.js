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
  
  // Watch plugins for better DX
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
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
  
  // Enhanced coverage reporters with custom configurations
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'clover',
    ['json-summary', { file: 'coverage-summary.json' }]
  ],
  
  // Coverage output directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Enhanced mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Performance optimizations
  maxWorkers: '50%',
  testTimeout: 15000,
  
  // Enhanced output configuration
  verbose: true,
  detectOpenHandles: true,
  detectLeaks: true,
  
  // Error handling
  errorOnDeprecated: true,
  bail: false, // Continue testing even if some tests fail
  
  // Test results caching
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // Enhanced globals with proper typing
  globals: {
    'ts-jest': {
      useESM: true,
      isolatedModules: true
    },
    // Global test environment variables
    __TEST_ENV__: 'jest',
    __DEVELOPMENT__: false,
    __PRODUCTION__: false
  },
  
  // Custom test sequences
  testSequencer: '<rootDir>/src/__tests__/config/test-sequencer.js',
  
  // Enhanced reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'test-report.html',
        pageTitle: 'Relife Test Report',
        logoImgPath: './public/icon-192x192.png'
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
        titleTemplate: '{title}'
      }
    ]
  ],
  
  // ESM support
  preset: undefined,
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  
  // Test environment setup
  globalSetup: '<rootDir>/src/__tests__/config/global-setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/config/global-teardown.ts'
};

export default config;