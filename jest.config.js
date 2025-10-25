/**
 * Root Jest Configuration for Monorepo
 *
 * This is the base configuration that delegates to workspace-specific
 * Jest configs. Each package has its own jest.config.js.
 */

module.exports = {
  projects: [
    '<rootDir>/apps/ruach-next',
    '<rootDir>/ruach-ministries-backend',
  ],
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  testTimeout: 10000,
};
