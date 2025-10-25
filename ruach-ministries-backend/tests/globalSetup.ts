/**
 * Jest Global Setup for Strapi
 *
 * Runs once before all test suites.
 * Use this to start test database, etc.
 */

export default async () => {
  console.log('\n🧪 Starting Strapi test environment...\n');

  // You can initialize test database here
  // For now, using in-memory SQLite is recommended for tests

  process.env.DATABASE_CLIENT = 'sqlite';
  process.env.DATABASE_FILENAME = ':memory:';
};
