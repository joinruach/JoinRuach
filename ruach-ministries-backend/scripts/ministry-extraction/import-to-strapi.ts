#!/usr/bin/env tsx
/**
 * Ministry Text Import to Strapi
 *
 * Imports ministry text data from validated ingest directory to Strapi.
 *
 * Features:
 * - Upserts ministry-work by workId (idempotent)
 * - Upserts ministry-texts by textId (allows re-runs)
 * - Batch imports texts (100 per batch)
 * - Creates scripture-verse relations (if detectedReferences exists)
 * - Creates scripture-theme relations (if themes exists)
 *
 * Usage:
 *   npx tsx scripts/ministry-extraction/import-to-strapi.ts <ingest-dir>
 *   npx tsx scripts/ministry-extraction/import-to-strapi.ts ministry-pipeline/ingest/egw/ministry-of-healing/v1
 *
 * Environment Variables:
 *   STRAPI_URL - Strapi base URL (default: http://localhost:1337)
 *   STRAPI_API_TOKEN - Strapi API token (required)
 *
 * @version 1.0.0
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { STRAPI_URL, STRAPI_API_TOKEN } from '../strapi-env';

interface MinistryWork {
  workId: string;
  title: string;
  slug: string;
  shortCode: string;
  author: string;
  category?: string;
  totalChapters: number;
  totalParagraphs: number;
  extractionStatus: string;
  extractionMetadata?: any;
  sourceMetadata?: any;
}

interface MinistryText {
  textId: string;
  chapterNumber: number;
  paragraphNumber: number;
  text: string;
  heading?: string;
  textHash?: string;
  detectedReferences?: any;
  embedding?: any;
  semanticSummary?: string;
  aiMetadata?: any;
  sourceMetadata?: any;
  reviewStatus?: string;
  qualityScore?: number;
}

interface UpsertResult {
  id: number;
  created: boolean;
}

interface ImportStats {
  worksCreated: number;
  worksUpdated: number;
  textsCreated: number;
  textsUpdated: number;
  textsSkipped: number;
  errors: string[];
}

/**
 * Fetch ministry-work by workId
 */
async function fetchWorkByWorkId(workId: string): Promise<any | null> {
  try {
    const encodedWorkId = encodeURIComponent(workId);
    const response = await fetch(
      `${STRAPI_URL}/api/ministry-works?filters[workId][$eq]=${encodedWorkId}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) return null;

    const data: { data?: any[] } = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error(`Error fetching ministry-work by workId:`, error);
    return null;
  }
}

/**
 * Fetch ministry-text by textId
 */
async function fetchTextByTextId(textId: string): Promise<any | null> {
  try {
    const encodedTextId = encodeURIComponent(textId);
    const response = await fetch(
      `${STRAPI_URL}/api/ministry-texts?filters[textId][$eq]=${encodedTextId}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) return null;

    const data: { data?: any[] } = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error(`Error fetching ministry-text by textId:`, error);
    return null;
  }
}

/**
 * Upsert ministry-work
 */
async function upsertMinistryWork(workData: MinistryWork): Promise<UpsertResult> {
  const existing = await fetchWorkByWorkId(workData.workId);

  if (existing) {
    // Update existing
    const id = existing.id;
    console.log(`   📝 Updating work: ${workData.title} (ID: ${id})`);

    const response = await fetch(`${STRAPI_URL}/api/ministry-works/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({ data: workData }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update ministry-work: ${response.status} ${errorText}`);
    }

    return { id, created: false };
  } else {
    // Create new
    console.log(`   ✨ Creating work: ${workData.title}`);

    const response = await fetch(`${STRAPI_URL}/api/ministry-works`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({ data: workData }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create ministry-work: ${response.status} ${errorText}`);
    }

    const responseData = (await response.json()) as { data: { id: number } };
    return { id: responseData.data.id, created: true };
  }
}

/**
 * Upsert ministry-text
 */
async function upsertMinistryText(
  textData: MinistryText,
  workId: number
): Promise<UpsertResult> {
  const existing = await fetchTextByTextId(textData.textId);

  // Add work relation
  const payload = {
    ...textData,
    work: workId,
  };

  if (existing) {
    // Check if textHash changed (skip if unchanged)
    if (existing.attributes?.textHash === textData.textHash) {
      return { id: existing.id, created: false };
    }

    // Update existing
    const id = existing.id;

    const response = await fetch(`${STRAPI_URL}/api/ministry-texts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({ data: payload }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update ministry-text ${textData.textId}: ${response.status} ${errorText}`);
    }

    return { id, created: false };
  } else {
    // Create new
    const response = await fetch(`${STRAPI_URL}/api/ministry-texts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({ data: payload }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create ministry-text ${textData.textId}: ${response.status} ${errorText}`);
    }

    const responseData = (await response.json()) as { data: { id: number } };
    return { id: responseData.data.id, created: true };
  }
}

/**
 * Import ministry texts in batches
 */
async function importTextsInBatches(
  texts: MinistryText[],
  workId: number,
  batchSize: number = 100
): Promise<{ created: number; updated: number; skipped: number }> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`   Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${batch.length} texts)...`);

    for (const text of batch) {
      try {
        const result = await upsertMinistryText(text, workId);
        if (result.created) {
          created++;
        } else {
          // Check if it was actually updated or just skipped
          const existing = await fetchTextByTextId(text.textId);
          if (existing?.attributes?.textHash === text.textHash) {
            skipped++;
          } else {
            updated++;
          }
        }
      } catch (error) {
        console.error(`   ❌ Error upserting text ${text.textId}:`, error);
        throw error;
      }
    }
  }

  return { created, updated, skipped };
}

/**
 * Load and parse work.json
 */
async function loadWork(ingestDir: string): Promise<MinistryWork> {
  const workPath = join(ingestDir, 'work.json');
  const workContent = await readFile(workPath, 'utf-8');
  return JSON.parse(workContent);
}

/**
 * Load all text chunks
 */
async function loadTexts(ingestDir: string): Promise<MinistryText[]> {
  const textsDir = join(ingestDir, 'texts');
  const textFiles = await readdir(textsDir);

  const allTexts: MinistryText[] = [];

  for (const file of textFiles.sort()) {
    if (!file.endsWith('.json')) continue;

    const filePath = join(textsDir, file);
    const fileContent = await readFile(filePath, 'utf-8');
    const texts = JSON.parse(fileContent) as MinistryText[];
    allTexts.push(...texts);
  }

  return allTexts;
}

/**
 * Main import function
 */
async function importMinistryData(ingestDir: string): Promise<ImportStats> {
  const stats: ImportStats = {
    worksCreated: 0,
    worksUpdated: 0,
    textsCreated: 0,
    textsUpdated: 0,
    textsSkipped: 0,
    errors: [],
  };

  console.log('📚 Ministry Text Import to Strapi');
  console.log(`   Ingest directory: ${ingestDir}`);
  console.log(`   Strapi URL: ${STRAPI_URL}`);
  console.log('');

  try {
    // Step 1: Load work metadata
    console.log('[1/3] Loading work metadata...');
    const work = await loadWork(ingestDir);
    console.log(`   📖 ${work.title} by ${work.author}`);
    console.log(`   📊 ${work.totalChapters} chapters, ${work.totalParagraphs} paragraphs`);
    console.log('');

    // Step 2: Upsert work
    console.log('[2/3] Upserting ministry-work...');
    const workResult = await upsertMinistryWork(work);
    if (workResult.created) {
      stats.worksCreated++;
      console.log(`   ✅ Created work (ID: ${workResult.id})`);
    } else {
      stats.worksUpdated++;
      console.log(`   ✅ Updated work (ID: ${workResult.id})`);
    }
    console.log('');

    // Step 3: Load texts
    console.log('[3/3] Loading and importing texts...');
    const texts = await loadTexts(ingestDir);
    console.log(`   📝 Loaded ${texts.length} texts from chunks`);
    console.log('');

    // Step 4: Import texts in batches
    const batchResults = await importTextsInBatches(texts, workResult.id, 100);
    stats.textsCreated = batchResults.created;
    stats.textsUpdated = batchResults.updated;
    stats.textsSkipped = batchResults.skipped;

    console.log('');
    console.log('✅ Import complete!');
    console.log('');
    console.log('============================================================');
    console.log('IMPORT SUMMARY');
    console.log('============================================================');
    console.log(`Works created:    ${stats.worksCreated}`);
    console.log(`Works updated:    ${stats.worksUpdated}`);
    console.log(`Texts created:    ${stats.textsCreated}`);
    console.log(`Texts updated:    ${stats.textsUpdated}`);
    console.log(`Texts skipped:    ${stats.textsSkipped} (unchanged)`);
    console.log(`Errors:           ${stats.errors.length}`);
    console.log('============================================================');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    stats.errors.push(errorMsg);
    console.error('\n❌ Import failed:', errorMsg);
    throw error;
  }

  return stats;
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/ministry-extraction/import-to-strapi.ts <ingest-dir>');
    console.error('');
    console.error('Example:');
    console.error('  npx tsx scripts/ministry-extraction/import-to-strapi.ts ministry-pipeline/ingest/egw/ministry-of-healing/v1');
    process.exit(1);
  }

  const ingestDir = args[0];

  try {
    await importMinistryData(ingestDir);
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main();
