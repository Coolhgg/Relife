/** @type {import('jest').Config} */
module.exports = {
  preset: '@detox/jest-preset',
  rootDir: '../..',
  testMatch: ['<rootDir>/tests/e2e/**/*.e2e.{js,ts}'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'detox-junit.xml'
      }
    ]
  ],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.ts'],
  transform: {
    '\\.[jt]sx?$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-typescript'] }]
  }
};