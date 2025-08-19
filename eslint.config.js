import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import tseslint from 'typescript-eslint'

export default tseslint.config([
  {
    ignores: [
      'dist/**/*',
      'coverage/**/*',
      'node_modules/**/*',
      'public/**/*',
      '*.config.{js,ts}',
      '*.d.ts'
    ]
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: {
      react,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Allow unused vars that start with underscore or are imports
      '@typescript-eslint/no-unused-vars': [
        'off',  // Disabled during development to allow rapid iteration
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // Allow any type when explicitly needed - common in rapid development
      '@typescript-eslint/no-explicit-any': 'off',
      
      // React 17+ with JSX Transform doesn't require React imports
      'react/react-in-jsx-scope': 'off',
      
      // Suppress mixed script warnings for intentional brand name usage
      'no-mixed-scripts': 'off',
      'unicode/no-mixed': 'off',
      'textlint/no-mixed-scripts': 'off',
      
      // Development-friendly rules for rapid iteration
      'react-refresh/only-export-components': 'warn',
      'no-constant-condition': 'warn',
      'prefer-const': 'warn',
      
      // Allow unused imports during development
      'no-unused-vars': 'off',
      
      // Allow unsafe function types for Express middleware compatibility
      '@typescript-eslint/no-unsafe-function-type': 'warn',
    },
  },
])
