// @manasik/config/eslint/next.js
// ESLint flat config for Next.js apps (extends base)

const base = require('./base');

/** @type {import('eslint').Linter.Config[]} */
const nextConfig = [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Allow default exports for pages/layouts
      'import/prefer-default-export': 'off',
    },
  },
  {
    // Allow console in server actions / route handlers
    files: ['**/app/**/{route,layout,page,loading,error,not-found}.{ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Relax rules in config files
    files: ['*.config.{ts,mts,js,mjs}', 'next.config.*'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];

module.exports = nextConfig;
