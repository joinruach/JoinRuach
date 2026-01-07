/**
 * Clear all scripture data from production database
 * Uses Strapi API to safely delete all scripture-related content
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const STRAPI_URL = process.env.STRAPI_URL || 'https://api.joinruach.org';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

if (!STRAPI_TOKEN) {
  console.error('❌ STRAPI_TOKEN environment variable required');
  process.exit(1);
}

const contentTypes = [
  'scripture-verses',
  'scripture-books',
  'scripture-tokens',
  'scripture-lemmas',
  'scripture-alignments',
  'scripture-themes',
  'scripture-works',
];

interface StrapiResponse {
  data: Array<{ id: number }>;
  meta?: {
    pagination?: {
      total?: number;
    };
  };
}

async function deleteAll(contentType: string): Promise<number> {
  let deleted = 0;
  let page = 1;
  const pageSize = 100;

  while (true) {
    // Fetch a page
    const response = await fetch(
      `${STRAPI_URL}/api/${contentType}?pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  ℹ️  Content type '${contentType}' not found (might not exist)`);
        return 0;
      }
      throw new Error(`Failed to fetch ${contentType}: ${response.statusText}`);
    }

    const data: StrapiResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      break;
    }

    // Delete each entry
    for (const entry of data.data) {
      const deleteResponse = await fetch(`${STRAPI_URL}/api/${contentType}/${entry.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
      });

      if (deleteResponse.ok) {
        deleted++;
        if (deleted % 10 === 0) {
          process.stdout.write(`\r  🗑️  Deleted ${deleted} entries...`);
        }
      } else {
        console.error(`\n  ⚠️  Failed to delete ${contentType}/${entry.id}`);
      }
    }

    // If we got fewer results than pageSize, we're done
    if (data.data.length < pageSize) {
      break;
    }

    page++;
  }

  if (deleted > 0) {
    process.stdout.write(`\r  ✅ Deleted ${deleted} entries\n`);
  }

  return deleted;
}

async function countEntries(contentType: string): Promise<number> {
  const response = await fetch(
    `${STRAPI_URL}/api/${contentType}?pagination[page]=1&pagination[pageSize]=1`,
    {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return 0;
    }
    throw new Error(`Failed to fetch ${contentType}: ${response.statusText}`);
  }

  const data: StrapiResponse = await response.json();
  return data.meta?.pagination?.total || 0;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log(`🗑️  ${dryRun ? 'DRY RUN:' : ''} Clearing scripture data from production...\n`);
  console.log(`Target: ${STRAPI_URL}\n`);

  if (dryRun) {
    console.log('📊 Counting entries (no deletion)...\n');
    let total = 0;
    for (const contentType of contentTypes) {
      const count = await countEntries(contentType);
      console.log(`  ${contentType}: ${count} entries`);
      total += count;
    }
    console.log(`\n📊 Total: ${total} entries would be deleted`);
    console.log('\n⚠️  Run without --dry-run to actually delete');
    return;
  }

  // Confirm before deletion
  console.log('⚠️  WARNING: This will permanently delete all scripture data!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  let totalDeleted = 0;

  for (const contentType of contentTypes) {
    console.log(`📦 ${contentType}:`);
    const count = await deleteAll(contentType);
    totalDeleted += count;
  }

  console.log(`\n✅ Complete! Deleted ${totalDeleted} total entries.`);
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
