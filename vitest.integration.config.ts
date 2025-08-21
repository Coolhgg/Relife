import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: 'react',
      jsxRuntime: 'automatic'
    })
  ],
  test: {
    name: 'integration',
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/utils/integration-test-setup.ts'],
    
    // Integration-specific test patterns - ONLY integration tests
    include: [
      'tests/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      'android',
      'ios',
      '.next',
      'coverage',
      'tests/e2e/**',
      'tests/smoke/**',
      'src/**' // Exclude all src directory tests (unit tests with Jest globals)
    ],
    
    // Integration tests may take longer due to complex flows
    // Increased timeouts for real-time and AI features
    testTimeout: 45000,
    hookTimeout: 15000,
    teardownTimeout: 10000,
    
    // Coverage configuration for integration tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'html', 'json'],
      reportsDirectory: './coverage/integration',
      include: [
        'src/**/*.{ts,tsx,js,jsx}'
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/index.tsx',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/__tests__/**',
        'src/**/__mocks__/**',
        'src/**/*.test.{ts,tsx,js,jsx}',
        'src/**/*.spec.{ts,tsx,js,jsx}',
        'src/test-setup.ts',
        'src/**/*.stories.{ts,tsx,js,jsx}',
        'src/**/index.{ts,tsx,js,jsx}',
        'src/config/**',
        'src/types/**'
      ],
      // Integration test coverage thresholds (may be lower than unit tests)
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 75,
          statements: 75
        },
        // Specific thresholds for critical integration paths
        'src/services/alarm/**': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        },
        'src/services/subscription/**': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/components/premium/**': {
          branches: 70,
          functions: 75,
          lines: 75,
          statements: 75
        },
        // New feature coverage thresholds
        'src/services/social-battles/**': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/services/voice-cloning/**': {
          branches: 70,
          functions: 75,
          lines: 75,
          statements: 75
        },
        'src/services/sleep-tracking/**': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/services/tournament/**': {
          branches: 70,
          functions: 75,
          lines: 75,
          statements: 75
        },
        'src/services/realtime/**': {
          branches: 65,
          functions: 70,
          lines: 70,
          statements: 70
        },
        'src/components/social/**': {
          branches: 65,
          functions: 70,
          lines: 70,
          statements: 70
        },
        'src/components/voice/**': {
          branches: 65,
          functions: 70,
          lines: 70,
          statements: 70
        },
        'src/components/sleep/**': {
          branches: 65,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    
    // Optimizations for integration testing environment
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
        singleThread: false
      }
    },
    
    // Test isolation and cleanup
    isolate: true,
    
    // Mock external dependencies consistently
    server: {
      deps: {
        inline: [
          '@testing-library/jest-dom',
          'posthog-js',
          '@sentry/react',
          '@supabase/supabase-js',
          '@stripe/stripe-js',
          '@capacitor/core',
          '@capacitor/device',
          '@capacitor/haptics',
          '@capacitor/local-notifications',
          '@capacitor/preferences',
          '@capacitor/push-notifications',
          'lucide-react',
          'date-fns',
          'recharts',
          'react-day-picker',
          'framer-motion',
          'embla-carousel-react',
          'vaul',
          'sonner',
          'cmdk',
          'next-themes',
          'class-variance-authority',
          'tailwind-merge',
          'i18next',
          'react-i18next',
          // Additional dependencies for new features
          'socket.io-client',
          'ws',
          'webrtc-adapter',
          '@tensorflow/tfjs',
          'chart.js',
          'chartjs-adapter-date-fns',
          'react-chartjs-2',
          'ml-matrix',
          'ml-regression'
        ]
      }
    },
    
    // Ensure JSX is properly handled in TypeScript files
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment'
    },
    
    // Reporter configuration for integration tests
    reporters: [
      'default',
      'json',
      ['junit', { outputFile: './test-results/integration-junit.xml' }],
      ['html', { outputFile: './test-results/integration-report.html' }]
    ],
    
    // Output configuration
    outputFile: {
      json: './test-results/integration-results.json'
    }
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@contexts': resolve(__dirname, './src/contexts'),
      '@config': resolve(__dirname, './src/config'),
      '@assets': resolve(__dirname, './src/assets'),
      '@data': resolve(__dirname, './src/data'),
      '@lib': resolve(__dirname, './src/lib'),
      '@backend': resolve(__dirname, './src/backend')
    }
  }
})