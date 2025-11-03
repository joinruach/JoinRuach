const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Load next.config.js and .env files in the test environment
  dir: './',
});

const config = {
  displayName: 'ruach-next',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@ruach/components$': '<rootDir>/../../packages/ruach-components/src',
    '^@ruach/addons$': '<rootDir>/../../packages/ruach-next-addons/src',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/_*.{js,jsx,ts,tsx}',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/dist/',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/dist/',
  ],
  transformIgnorePatterns: ['/node_modules/(?!(@ruach)/)'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  testTimeout: 10000,
};

module.exports = createJestConfig(config);
