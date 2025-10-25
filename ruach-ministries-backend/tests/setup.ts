/**
 * Jest Setup for Strapi Backend Tests
 *
 * This file runs before each test suite.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-characters-long';
process.env.ADMIN_JWT_SECRET = 'test-admin-jwt-secret-min-32-characters';
process.env.API_TOKEN_SALT = 'test-api-token-salt';
process.env.TRANSFER_TOKEN_SALT = 'test-transfer-token-salt';
process.env.APP_KEYS = 'test-app-key-1,test-app-key-2';

// Mock console methods to reduce noise during tests (optional)
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(), // Keep error logging
};

// Increase test timeout for database operations
jest.setTimeout(15000);
