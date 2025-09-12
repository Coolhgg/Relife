import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

export default tseslint.config([
  // Global ignores
  {
    ignores: [
      'dist/**/*',
      'coverage/**/*',
      'node_modules/**/*',
      'public/**/*',
      'android/**/*',
      'ios/**/*',
      'build/**/*',
      'backup/**/*',
      'relife-campaign-dashboard/**/*',
      'ci/**/*',
      'scripts/**/*',
      'email-campaigns/**/*',
      'monitoring/**/*',
      '.next/**/*',
      '*.config.{js,ts}',
      '*.d.ts',
    ],
  },

  // JavaScript files
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^(_|unused|create.*|generate.*)',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      'no-constant-condition': 'warn',
      'prefer-const': 'warn',
      'no-undef': 'error',
      'no-useless-escape': 'warn', // More lenient for regex patterns
      'no-case-declarations': 'off', // Allow declarations in case blocks
    },
  },

  // K6 Performance Test files
  {
    files: ['performance/k6/**/*.js', 'performance/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        // K6 globals
        __ENV: 'readonly',
        __VU: 'readonly',
        __ITER: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^(_|unused|create.*|generate.*)',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      'no-undef': 'error',
    },
  },

  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        // DOM globals for web APIs
        HeadersInit: 'readonly',
        RequestInit: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        fetch: 'readonly',
        NotificationPermission: 'readonly',
        EventListener: 'readonly',
        EventListenerOrEventListenerObject: 'readonly',
        NotificationOptions: 'readonly',
        // Additional Node.js types
        NodeJS: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript rules - more permissive for development
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^(_|unused|create.*|generate.*)',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'warn', // Warn instead of error
      '@typescript-eslint/no-namespace': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/triple-slash-reference': 'warn',

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn', // Warn instead of error for development

      // React Refresh rules - more permissive
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: ['meta', 'config', 'default'],
        },
      ],

      // General rules
      'no-constant-condition': 'warn',
      'prefer-const': 'warn',
      'no-console': 'off', // Allow console in development
      'no-undef': 'off',
      'no-useless-catch': 'warn', // More lenient
    },
  },

  // E2E Test files with Detox globals
  {
    files: ['**/tests/e2e/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        // Detox globals
        detox: 'readonly',
        device: 'readonly',
        element: 'readonly',
        waitFor: 'readonly',
        expect: 'readonly',
        by: 'readonly',
        web: 'readonly',
        system: 'readonly',
        copilot: 'readonly',
        pilot: 'readonly',
        // Jasmine globals
        jasmine: 'readonly',
        // Node.js types
        NodeJS: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript rules - very permissive for test files
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^(_|unused|create.*|generate.*|test.*)',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off', // Very permissive for tests
      '@typescript-eslint/no-require-imports': 'error',

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Refresh rules
      'react-refresh/only-export-components': 'off', // Disabled for test files

      // General rules
      'no-constant-condition': 'warn',
      'prefer-const': 'warn',
      'no-console': 'off',
      'no-undef': 'error',
    },
  },

  // Test files with Jest globals - more permissive rules
  {
    files: [
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/tests/**/*.{ts,tsx}',
    ],
    ignores: ['**/tests/e2e/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        // Additional Jest/testing globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        vi: 'readonly', // Vitest
        // DOM types for test files
        NotificationPermission: 'readonly',
        EventListener: 'readonly',
        EventListenerOrEventListenerObject: 'readonly',
        NotificationOptions: 'readonly',
        HeadersInit: 'readonly',
        vitest: 'readonly', // Vitest
        // Additional test utilities and globals
        renderWithProviders: 'readonly',
        i18nMocks: 'readonly',
        storageMocks: 'readonly',
        completedChallenges: 'readonly',
        audioMocks: 'readonly',
        asyncUtils: 'readonly',
        PremiumFeatureAccess: 'readonly',
        SubscriptionService: 'readonly',
        server: 'readonly',
        memoryTesting: 'readonly',
        alarm: 'readonly',
        React: 'readonly',
        NodeJS: 'readonly',
        // Factory function globals for test utilities
        asDate: 'readonly',
        createTestUserPreferences: 'readonly',
        createTestUserStats: 'readonly',
        createTestBattleParticipant: 'readonly',
        createTestUser: 'readonly',
        createTestAlarm: 'readonly',
        createTestBattle: 'readonly',
        createTestTheme: 'readonly',
        createFlexibleUser: 'readonly',
        createFlexibleAlarm: 'readonly',
        createFlexibleBattle: 'readonly',
        createTestEmotionalState: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript rules - very permissive for test files
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^(_|unused|create.*|generate.*|test.*)',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off', // Very permissive for tests
      '@typescript-eslint/no-require-imports': 'error',

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Refresh rules
      'react-refresh/only-export-components': 'off', // Disabled for test files

      // General rules
      'no-constant-condition': 'warn',
      'prefer-const': 'warn',
      'no-console': 'off',
      'no-undef': 'off', // More permissive for test utilities
    },
  },

  // Deno deployment files
  {
    files: ['relife-campaign-dashboard/main.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        // Deno runtime globals
        Deno: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
    },
  },

  // UI Component files - disable react-refresh rule for shadcn/ui patterns
  {
    files: [
      'relife-campaign-dashboard/src/components/ui/**/*.{ts,tsx}',
      'src/components/ui/**/*.{ts,tsx}',
      '**/ui/**/*.{ts,tsx}',
    ],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        HeadersInit: 'readonly',
        RequestInit: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        fetch: 'readonly',
        NotificationPermission: 'readonly',
        EventListener: 'readonly',
        EventListenerOrEventListenerObject: 'readonly',
        NotificationOptions: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^(_|unused|create.*|generate.*)',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-require-imports': 'error',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Disable react-refresh rule for UI components that export variants
      'react-refresh/only-export-components': 'off',
      'no-constant-condition': 'warn',
      'prefer-const': 'warn',
      'no-console': 'off',
      'no-undef': 'error',
    },
  },

  // Dashboard files with DOM globals
  {
    files: ['relife-campaign-dashboard/**/*.{ts,tsx}'],
    ignores: [
      'relife-campaign-dashboard/main.ts',
      'relife-campaign-dashboard/src/components/ui/**/*.{ts,tsx}',
    ],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        // DOM globals for HeadersInit and other web types
        HeadersInit: 'readonly',
        RequestInit: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        fetch: 'readonly',
        NotificationPermission: 'readonly',
        EventListener: 'readonly',
        EventListenerOrEventListenerObject: 'readonly',
        NotificationOptions: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript rules - more lenient for dashboard components
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^(_|unused|create.*|generate.*)',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-require-imports': 'error',

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Refresh rules - more permissive
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: ['meta', 'config', 'default'],
        },
      ],

      // General rules
      'no-constant-condition': 'warn',
      'prefer-const': 'warn',
      'no-console': 'off',
      'no-undef': 'error',
    },
  },
]);
