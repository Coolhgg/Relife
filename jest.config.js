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
    '<rootDir>/src/test-setup.ts'
  ],
  setupFilesAfterEnv: [
    '@testing-library/jest-dom'
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
    '^@capacitor/(.*)$': '<rootDir>/src/__tests__/mocks/capacitor.mock.ts'
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
        useESM: true
      }
    ],
    '^.+\\.(js|jsx|mjs|cjs)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          '@babel/preset-typescript'
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
    '<rootDir>/tests/**/*.(test|spec).(ts|tsx|js|jsx)'
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
    'jest-watch-typeahead/testname'
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
    '!src/config/**',
    '!src/types/**'
  ],
  
  // Progressive coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Enhanced coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json'
  ],
  
  // Coverage output directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Enhanced mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Performance optimizations
  maxWorkers: process.env.CI ? '100%' : '50%',
  testTimeout: process.env.CI ? 30000 : 15000,
  
  // Enhanced output configuration
  verbose: process.env.CI ? false : true,
  detectOpenHandles: process.env.NODE_ENV === 'development',
  
  // Advanced debugging configuration
  silent: false,
  passWithNoTests: true,
  
  // Jest extensions and plugins
  watchman: true,
  
  // Error handling
  errorOnDeprecated: false,
  bail: false,
  
  // Enhanced test results caching
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // Enhanced ESM support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Custom snapshot serializers
  snapshotSerializers: [
    '@emotion/jest/serializer'
  ],
  
  // Timezone configuration
  fakeTimers: {
    enableGlobally: false
  },
  
  // Enhanced module directories
  moduleDirectories: [
    'node_modules', 
    '<rootDir>/src'
  ],
  
  // Root directory configuration
  rootDir: '.',
  
  // CI-specific optimizations
  ...(process.env.CI && {
    collectCoverage: true,
    coverageReporters: ['lcov', 'text-summary'],
    maxWorkers: '100%',
    testTimeout: 30000,
    verbose: false,
    reporters: [
      'default',
      ['jest-junit', {
        outputDirectory: './coverage',
        outputName: 'junit.xml'
      }]
    ]
  })
};

export default config;