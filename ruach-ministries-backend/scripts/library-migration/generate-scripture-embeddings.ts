#!/usr/bin/env tsx
/**
 * Generate embeddings for YahScriptures chunks
 *
 * Uses OpenAI text-embedding-3-small to generate 512-dimensional embeddings
 * for all scripture chunks in the library.
 *
 * Cost: ~$0.02 per 1M tokens (~$0.15 for all 7,374 chunks)
 *
 * Usage:
 *   export OPENAI_API_KEY=your-key-here
 *   npx tsx scripts/library-migration/generate-scripture-embeddings.ts
 */

import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BATCH_SIZE = 100; // Process 100 chunks at a time
const MODEL = 'text-embedding-3-small';
const DIMENSIONS = 512;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable required');
  console.error('   Get your key from: https://platform.openai.com/api-keys');
  process.exit(1);
}

async function getDb() {
  const { default: knex } = await import('knex');
  return knex({
    client: 'postgres',
    connection: {
      host: process.env.LOCAL_DATABASE_HOST || 'localhost',
      port: parseInt(process.env.LOCAL_DATABASE_PORT || '5432'),
      database: process.env.LOCAL_DATABASE_NAME || 'strapi_db',
      user: process.env.LOCAL_DATABASE_USERNAME || 'postgres',
      password: process.env.LOCAL_DATABASE_PASSWORD || 'postgres',
    }
  });
}

interface Chunk {
  id: number;
  chunk_key: string;
  chunk_text: string;
  sequence_number: number;
  embedding_status: string;
}

/**
 * Generate embeddings for a batch of texts using OpenAI API
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: texts,
      dimensions: DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = (await response.json()) as { data: { embedding: number[] }[] };
  return data.data.map((item) => item.embedding);
}

/**
 * Calculate average chunk size for display
 */
function avgChunkSize(chunks: Chunk[]): number {
  if (chunks.length === 0) return 0;
  const totalChars = chunks.reduce((sum, c) => sum + c.chunk_text.length, 0);
  return Math.round(totalChars / chunks.length);
}

/**
 * Calculate cost estimate
 */
function estimateCost(totalTokens: number): string {
  // text-embedding-3-small costs $0.00002 per 1K tokens
  const costPer1k = 0.00002;
  const cost = (totalTokens / 1000) * costPer1k;
  return cost.toFixed(4);
}

async function generateScriptureEmbeddings() {
  const db = await getDb();

  try {
    console.log('📖 Generating embeddings for YahScriptures chunks\n');

    // Get scripture document
    const doc = await db('library_documents')
      .where('document_id', 'doc:scripture:yahscriptures')
      .first();

    if (!doc) {
      throw new Error('YahScriptures document not found. Run import-yahscriptures-bbli.ts first.');
    }

    console.log(`   Document: ${doc.title} (${doc.total_chunks} chunks)\n`);

    // Get all chunks that need embeddings (status = 'pending' or embedding_vector IS NULL)
    const chunks = await db('library_chunks')
      .where('document_id', doc.id)
      .where(function() {
        this.where('embedding_status', 'pending')
          .orWhereNull('embedding_vector');
      })
      .orderBy('sequence_number')
      .select('id', 'chunk_key', 'chunk_text', 'sequence_number', 'embedding_status') as Chunk[];

    if (chunks.length === 0) {
      console.log('✅ All chunks already have embeddings!');
      return;
    }

    console.log(`   Chunks needing embeddings: ${chunks.length}`);
    console.log(`   Average chunk size: ${avgChunkSize(chunks)} chars\n`);

    // Estimate tokens and cost
    const totalChars = chunks.reduce((sum, c) => sum + c.chunk_text.length, 0);
    const estimatedTokens = Math.ceil(totalChars / 4); // rough estimate: 4 chars ≈ 1 token
    const estimatedCost = estimateCost(estimatedTokens);

    console.log(`   Estimated tokens: ${estimatedTokens.toLocaleString()}`);
    console.log(`   Estimated cost: $${estimatedCost}\n`);

    // Process in batches
    let processed = 0;
    let totalTokensUsed = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map(c => c.chunk_text);

      console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}: Processing ${batch.length} chunks...`);

      try {
        // Mark chunks as processing
        await db('library_chunks')
          .whereIn('id', batch.map(c => c.id))
          .update({ embedding_status: 'processing' });

        // Generate embeddings via OpenAI
        const embeddings = await generateEmbeddings(texts);

        // Update database with embeddings
        for (let j = 0; j < batch.length; j++) {
          const chunk = batch[j];
          const embedding = embeddings[j];

          await db('library_chunks')
            .where('id', chunk.id)
            .update({
              embedding_vector: JSON.stringify(embedding),
              embedding_model: MODEL,
              embedding_dimensions: DIMENSIONS,
              embedding_status: 'completed',
              updated_at: new Date(),
            });

          processed++;
        }

        // Estimate tokens used (rough calculation: 4 chars ≈ 1 token)
        const batchTokens = texts.reduce((sum, t) => sum + Math.ceil(t.length / 4), 0);
        totalTokensUsed += batchTokens;

        console.log(`      ✓ Processed ${batch.length} embeddings (${batchTokens.toLocaleString()} tokens)`);

      } catch (error) {
        console.error(`      ✗ Error processing batch:`, error);

        // Mark failed chunks
        await db('library_chunks')
          .whereIn('id', batch.map(c => c.id))
          .update({ embedding_status: 'failed' });

        console.log(`      Marked batch as failed, continuing...`);
      }

      // Rate limit: Wait 1 second between batches to avoid OpenAI rate limits
      if (i + BATCH_SIZE < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const actualCost = estimateCost(totalTokensUsed);

    console.log(`\n✅ Embedding generation complete!`);
    console.log(`   Processed: ${processed.toLocaleString()} chunks`);
    console.log(`   Tokens used: ${totalTokensUsed.toLocaleString()}`);
    console.log(`   Actual cost: $${actualCost}\n`);

    // Verify final status
    const statusCounts = await db('library_chunks')
      .where('document_id', doc.id)
      .select('embedding_status')
      .count('* as count')
      .groupBy('embedding_status');

    console.log(`📊 Final status breakdown:`);
    statusCounts.forEach((row: any) => {
      console.log(`   ${row.embedding_status}: ${row.count}`);
    });
    console.log();

  } finally {
    await db.destroy();
  }
}

generateScriptureEmbeddings().catch(error => {
  console.error('❌ Failed:', error);
  process.exit(1);
});
