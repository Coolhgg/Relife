module.exports = {
  // Basic formatting options
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 88,
  tabWidth: 2,
  useTabs: false,

  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        singleQuote: false,
        trailingComma: 'none',
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        singleQuote: false,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always',
      },
    },
    {
      files: ['*.js', '*.ts', '*.jsx', '*.tsx'],
      options: {
        arrowParens: 'avoid',
        bracketSpacing: true,
        endOfLine: 'lf',
      },
    },
  ],
};
