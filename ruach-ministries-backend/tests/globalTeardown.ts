/**
 * Jest Global Teardown for Strapi
 *
 * Runs once after all test suites complete.
 * Use this to clean up test database, etc.
 */

export default async () => {
  console.log('\n✅ Cleaning up Strapi test environment...\n');

  // Clean up test database connections, files, etc.
  // For in-memory SQLite, nothing to clean up
};
