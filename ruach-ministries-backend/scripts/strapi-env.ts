/**
 * Shared Strapi environment helpers for backend scripts.
 * Importing this file guarantees the required env vars are validated before any script runs.
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.error('❌ STRAPI_API_TOKEN environment variable is required');
  console.error('   Create an API token in Strapi Admin → Settings → API Tokens');
  process.exit(1);
}

export { STRAPI_API_TOKEN, STRAPI_URL };
