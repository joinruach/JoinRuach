#!/usr/bin/env tsx
/**
 * Test Library Search API
 *
 * Tests the /api/library-documents/search endpoint
 */
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ STRAPI_API_TOKEN required');
  process.exit(1);
}

async function testSearchAPI() {
  console.log('\n🔍 Testing Library Search API\n');
  console.log(`   Endpoint: ${STRAPI_URL}/api/library-documents/search\n`);

  const queries = [
    { query: 'faith healing', mode: 'fulltext' as const, description: 'Full-text search for "faith healing"' },
    { query: 'divine power', mode: 'fulltext' as const, description: 'Full-text search for "divine power"' },
    { query: 'ministry', mode: 'fulltext' as const, description: 'Full-text search for "ministry"' },
  ];

  for (const test of queries) {
    console.log(`📝 Test: ${test.description}`);
    console.log(`   Query: "${test.query}", Mode: ${test.mode}\n`);

    try {
      const response = await fetch(`${STRAPI_URL}/api/library-documents/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          query: test.query,
          mode: test.mode,
          limit: 3,
          offset: 0,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`   ❌ HTTP ${response.status}: ${error}\n`);
        continue;
      }

      const result: any = await response.json();

      console.log(`   ✅ Found ${result.meta.count} results\n`);

      result.data.forEach((item: any, idx: number) => {
        console.log(`   ${idx + 1}. ${item.document.title} by ${item.document.author}`);
        console.log(`      Location: ${item.startLocator} → ${item.endLocator}`);
        console.log(`      Score: ${item.relevanceScore.toFixed(4)}`);
        console.log(`      Preview: ${item.text.substring(0, 100)}...`);
        console.log('');
      });

    } catch (error: any) {
      console.error(`   ❌ Request failed: ${error.message}\n`);
    }
  }

  console.log('🎉 Search API tests complete!\n');
}

testSearchAPI().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
