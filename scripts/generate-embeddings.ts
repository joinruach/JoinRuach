#!/usr/bin/env tsx
/**
 * Generate Embeddings Script
 *
 * Generates vector embeddings for all content in the Strapi CMS
 * and stores them in the PostgreSQL database with pgvector.
 *
 * Usage:
 *   pnpm tsx scripts/generate-embeddings.ts [--content-type=media] [--limit=100]
 *
 * Options:
 *   --content-type  Filter by content type (media, lesson, blog, course, series)
 *   --limit         Max items to process per type (default: 1000)
 *   --batch-size    Batch size for API calls (default: 50)
 *   --dry-run       Preview without saving to database
 */

import 'dotenv/config';
import { generateEmbeddings, type ContentItem } from '../packages/ruach-ai/src/embeddings/generator';
import { saveEmbedding } from '../apps/ruach-next/src/lib/db/ai';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  contentType: args.find(a => a.startsWith('--content-type='))?.split('=')[1],
  limit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '1000', 10),
  batchSize: parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '50', 10),
  dryRun: args.includes('--dry-run'),
};

async function main() {
  console.log('🤖 Ruach AI - Embedding Generation Script\n');

  // Validate API key
  if (!OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment');
    console.error('   Please set OPENAI_API_KEY in your .env file');
    process.exit(1);
  }

  // Determine which content types to process
  const contentTypes = options.contentType
    ? [options.contentType]
    : ['media', 'lesson', 'blog', 'course', 'series'];

  console.log('⚙️  Configuration:');
  console.log(`   Content Types: ${contentTypes.join(', ')}`);
  console.log(`   Limit per type: ${options.limit}`);
  console.log(`   Batch size: ${options.batchSize}`);
  console.log(`   Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
  console.log(`   Strapi URL: ${STRAPI_URL}\n`);

  let totalProcessed = 0;
  let totalErrors = 0;

  for (const contentType of contentTypes) {
    console.log(`\n📦 Processing ${contentType}...`);

    try {
      const items = await fetchContent(contentType, options.limit);
      console.log(`   Found ${items.length} items`);

      if (items.length === 0) {
        continue;
      }

      // Generate embeddings
      console.log(`   Generating embeddings...`);
      const embeddings = await generateEmbeddings(items, contentType as any, {
        apiKey: OPENAI_API_KEY!,
        batchSize: options.batchSize,
      });

      console.log(`   ✅ Generated ${embeddings.length} embeddings`);

      // Save to database
      if (!options.dryRun) {
        console.log(`   Saving to database...`);
        let saved = 0;
        for (const embedding of embeddings) {
          try {
            await saveEmbedding(embedding);
            saved++;
            if (saved % 10 === 0) {
              process.stdout.write(`\r   Progress: ${saved}/${embeddings.length}`);
            }
          } catch (error) {
            console.error(`\n   ⚠️  Failed to save ${contentType}/${embedding.contentId}:`, error);
            totalErrors++;
          }
        }
        console.log(`\n   ✅ Saved ${saved} embeddings to database`);
        totalProcessed += saved;
      } else {
        console.log(`   ⚠️  Dry run - skipping database save`);
        totalProcessed += embeddings.length;
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${contentType}:`, error);
      totalErrors++;
    }
  }

  // Summary
  console.log(`\n\n📊 Summary:`);
  console.log(`   Total processed: ${totalProcessed}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log(`   Status: ${totalErrors === 0 ? '✅ Success' : '⚠️  Completed with errors'}`);

  process.exit(totalErrors > 0 ? 1 : 0);
}

/**
 * Fetch content from Strapi
 */
async function fetchContent(contentType: string, limit: number): Promise<ContentItem[]> {
  const endpoints: Record<string, string> = {
    media: '/api/media-items',
    lesson: '/api/lessons',
    blog: '/api/blogs',
    course: '/api/courses',
    series: '/api/series-collection',
  };

  const endpoint = endpoints[contentType];
  if (!endpoint) {
    throw new Error(`Unknown content type: ${contentType}`);
  }

  const params = new URLSearchParams({
    'pagination[limit]': limit.toString(),
    'populate[speakers]': 'true',
    'populate[tags]': 'true',
  });

  const response = await fetch(`${STRAPI_URL}${endpoint}?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${contentType}: ${response.statusText}`);
  }

  const data = await response.json();
  const items = data.data || [];

  return items.map((item: any) => ({
    id: item.id,
    title: item.attributes?.title || 'Untitled',
    description: item.attributes?.description,
    excerpt: item.attributes?.excerpt,
    summary: item.attributes?.summary,
    transcript: item.attributes?.transcript,
    tags: item.attributes?.tags?.data?.map((t: any) => ({ name: t.attributes?.name })) || [],
    speakers:
      item.attributes?.speakers?.data?.map((s: any) => ({ name: s.attributes?.name })) || [],
  }));
}

// Run the script
main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
