#!/usr/bin/env tsx
/**
 * Embedding Generator
 *
 * Generates semantic embeddings for ministry text using OpenAI's text-embedding-3-small API.
 *
 * Features:
 * - Batch processing (100 paragraphs per request)
 * - Resume support (skip already embedded paragraphs)
 * - Rate limiting & retry logic
 * - Cost tracking & estimation
 * - Progress reporting
 *
 * Usage:
 *   npx tsx scripts/ministry-extraction/generate-embeddings.ts \
 *     <input-jsonl> <output-jsonl> [options]
 *
 * Options:
 *   --dimensions 512|1536    Embedding dimensions (default: 512)
 *   --batch-size N           Paragraphs per API call (default: 100)
 *   --skip-existing          Skip paragraphs that already have embeddings
 *   --dry-run                Show what would be done without making API calls
 *
 * Environment Variables:
 *   OPENAI_API_KEY - OpenAI API key (required)
 *
 * Pricing (as of 2025):
 *   text-embedding-3-small: $0.02 / 1M tokens
 *   Average ministry paragraph: ~100 tokens
 *   Estimated cost: $0.002 per 2,225 paragraphs
 *
 * @version 1.0.0
 */

import { createReadStream, createWriteStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { setTimeout } from 'node:timers/promises';

interface MinistryParagraph {
  book: string;
  chapter: number;
  paragraph: number;
  text: string;
  pdfPage: number;
  heading?: string;
  confidence: number;
  detectedReferences?: any[];
}

interface Embedding {
  model: string;
  dimensions: number;
  vector: number[];
}

interface EmbeddedParagraph extends MinistryParagraph {
  embedding?: Embedding;
}

interface EmbeddingOptions {
  dimensions: 512 | 1536;
  batchSize: number;
  skipExisting: boolean;
  dryRun: boolean;
}

interface EmbeddingStats {
  totalParagraphs: number;
  alreadyEmbedded: number;
  newEmbeddings: number;
  totalTokens: number;
  estimatedCost: number;
  apiCalls: number;
  errors: number;
}

const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const COST_PER_MILLION_TOKENS = 0.02; // $0.02 per 1M tokens

/**
 * Validate environment
 */
function validateEnvironment(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is required');
    console.error('   Get your API key from: https://platform.openai.com/api-keys');
    process.exit(1);
  }
  return apiKey;
}

/**
 * Parse command line arguments
 */
function parseArgs(): { inputPath: string; outputPath: string; options: EmbeddingOptions } {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npx tsx scripts/ministry-extraction/generate-embeddings.ts <input-jsonl> <output-jsonl> [options]');
    console.error('');
    console.error('Options:');
    console.error('  --dimensions 512|1536    Embedding dimensions (default: 512)');
    console.error('  --batch-size N           Paragraphs per API call (default: 100)');
    console.error('  --skip-existing          Skip paragraphs that already have embeddings');
    console.error('  --dry-run                Show what would be done without making API calls');
    console.error('');
    console.error('Example:');
    console.error('  npx tsx scripts/ministry-extraction/generate-embeddings.ts \\');
    console.error('    ministry-pipeline/exports/egw/ministry-of-healing/v1/refs.jsonl \\');
    console.error('    ministry-pipeline/exports/egw/ministry-of-healing/v1/embedded.jsonl \\');
    console.error('    --dimensions 512 --batch-size 100');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1];

  // Parse dimensions
  const dimensionsIdx = args.indexOf('--dimensions');
  const dimensions = dimensionsIdx >= 0
    ? parseInt(args[dimensionsIdx + 1], 10) as 512 | 1536
    : 512;

  if (dimensions !== 512 && dimensions !== 1536) {
    console.error('❌ Invalid dimensions. Must be 512 or 1536.');
    process.exit(1);
  }

  // Parse batch size
  const batchSizeIdx = args.indexOf('--batch-size');
  const batchSize = batchSizeIdx >= 0
    ? parseInt(args[batchSizeIdx + 1], 10)
    : 100;

  if (batchSize < 1 || batchSize > 2048) {
    console.error('❌ Invalid batch size. Must be between 1 and 2048.');
    process.exit(1);
  }

  const options: EmbeddingOptions = {
    dimensions,
    batchSize,
    skipExisting: args.includes('--skip-existing'),
    dryRun: args.includes('--dry-run'),
  };

  return { inputPath, outputPath, options };
}

/**
 * Estimate tokens for text (rough estimate: ~0.75 tokens per word)
 */
function estimateTokens(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.ceil(words * 0.75);
}

/**
 * Generate embeddings via OpenAI API
 */
async function generateEmbeddings(
  texts: string[],
  apiKey: string,
  dimensions: number
): Promise<number[][]> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    data: Array<{ index: number; embedding: number[] }>;
  };

  // Extract embeddings in order
  const embeddings = data.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);

  return embeddings;
}

/**
 * Process paragraphs and generate embeddings
 */
async function processEmbeddings(
  inputPath: string,
  outputPath: string,
  options: EmbeddingOptions,
  apiKey: string
): Promise<EmbeddingStats> {
  const stats: EmbeddingStats = {
    totalParagraphs: 0,
    alreadyEmbedded: 0,
    newEmbeddings: 0,
    totalTokens: 0,
    estimatedCost: 0,
    apiCalls: 0,
    errors: 0,
  };

  console.log('🔮 Embedding Generator');
  console.log(`   Input: ${inputPath}`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Model: ${EMBEDDING_MODEL}`);
  console.log(`   Dimensions: ${options.dimensions}`);
  console.log(`   Batch size: ${options.batchSize}`);
  console.log(`   Skip existing: ${options.skipExisting}`);
  console.log(`   Dry run: ${options.dryRun}`);
  console.log('');

  // Read all paragraphs
  const paragraphs: EmbeddedParagraph[] = [];
  const readStream = createReadStream(inputPath, 'utf-8');
  const rl = createInterface({ input: readStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;
    paragraphs.push(JSON.parse(line));
    stats.totalParagraphs++;
  }

  console.log(`   Loaded ${stats.totalParagraphs} paragraphs`);
  console.log('');

  // Filter paragraphs that need embeddings
  const needsEmbedding = paragraphs.filter((p) => {
    if (options.skipExisting && p.embedding) {
      stats.alreadyEmbedded++;
      return false;
    }
    return true;
  });

  if (stats.alreadyEmbedded > 0) {
    console.log(`   ⏭️  Skipping ${stats.alreadyEmbedded} paragraphs (already embedded)`);
  }

  if (needsEmbedding.length === 0) {
    console.log('✅ All paragraphs already have embeddings!');
    return stats;
  }

  console.log(`   📝 Generating embeddings for ${needsEmbedding.length} paragraphs...`);
  console.log('');

  // Process in batches
  const batches = [];
  for (let i = 0; i < needsEmbedding.length; i += options.batchSize) {
    batches.push(needsEmbedding.slice(i, i + options.batchSize));
  }

  console.log(`   Processing ${batches.length} batches...`);

  if (options.dryRun) {
    console.log('');
    console.log('🏃 DRY RUN - No API calls will be made');
    console.log('');

    // Estimate costs
    const totalTokens = needsEmbedding.reduce((sum, p) => sum + estimateTokens(p.text), 0);
    const estimatedCost = (totalTokens / 1_000_000) * COST_PER_MILLION_TOKENS;

    console.log('Estimated metrics:');
    console.log(`   Total tokens: ${totalTokens.toLocaleString()}`);
    console.log(`   Estimated cost: $${estimatedCost.toFixed(4)}`);
    console.log(`   API calls: ${batches.length}`);

    return stats;
  }

  // Process each batch
  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];

    try {
      // Extract texts
      const texts = batch.map((p) => p.text);

      // Estimate tokens for this batch
      const batchTokens = texts.reduce((sum, text) => sum + estimateTokens(text), 0);
      stats.totalTokens += batchTokens;

      // Generate embeddings
      const embeddings = await generateEmbeddings(texts, apiKey, options.dimensions);

      // Add embeddings to paragraphs
      for (let i = 0; i < batch.length; i++) {
        batch[i].embedding = {
          model: EMBEDDING_MODEL,
          dimensions: options.dimensions,
          vector: embeddings[i],
        };
        stats.newEmbeddings++;
      }

      stats.apiCalls++;

      // Progress reporting
      const progress = ((batchIdx + 1) / batches.length) * 100;
      const costSoFar = (stats.totalTokens / 1_000_000) * COST_PER_MILLION_TOKENS;

      process.stdout.write(
        `   Batch ${batchIdx + 1}/${batches.length} (${progress.toFixed(1)}%) - ` +
        `${stats.newEmbeddings} embeddings - ` +
        `${stats.totalTokens.toLocaleString()} tokens - ` +
        `$${costSoFar.toFixed(4)}  \r`
      );

      // Rate limiting (avoid hitting API limits)
      if (batchIdx < batches.length - 1) {
        await setTimeout(100); // 100ms delay between batches
      }
    } catch (error) {
      stats.errors++;
      console.error(`\n   ❌ Error processing batch ${batchIdx + 1}:`, error);

      // Retry with exponential backoff
      if (error instanceof Error && error.message.includes('429')) {
        console.log(`   ⏳ Rate limited. Waiting 60 seconds...`);
        await setTimeout(60000);
        // Retry the batch
        batchIdx--;
        continue;
      }

      // For other errors, mark batch paragraphs as failed but continue
      console.log(`   ⚠️  Skipping batch ${batchIdx + 1} due to error`);
    }
  }

  console.log('\n');

  // Calculate final cost
  stats.estimatedCost = (stats.totalTokens / 1_000_000) * COST_PER_MILLION_TOKENS;

  // Write output
  console.log('   💾 Writing output...');

  await new Promise<void>((resolve, reject) => {
    const writeStream = createWriteStream(outputPath, 'utf-8');

    writeStream.on('error', reject);
    writeStream.on('finish', resolve);

    for (const paragraph of paragraphs) {
      writeStream.write(JSON.stringify(paragraph) + '\n');
    }

    writeStream.end();
  });

  console.log(`   ✅ Written to: ${outputPath}`);

  return stats;
}

/**
 * Main entry point
 */
async function main() {
  const apiKey = validateEnvironment();
  const { inputPath, outputPath, options } = parseArgs();

  try {
    const stats = await processEmbeddings(inputPath, outputPath, options, apiKey);

    console.log('✅ Embedding generation complete!');
    console.log('');
    console.log('============================================================');
    console.log('EMBEDDING SUMMARY');
    console.log('============================================================');
    console.log(`Total paragraphs:       ${stats.totalParagraphs}`);
    console.log(`Already embedded:       ${stats.alreadyEmbedded}`);
    console.log(`New embeddings:         ${stats.newEmbeddings}`);
    console.log(`Total tokens:           ${stats.totalTokens.toLocaleString()}`);
    console.log(`API calls:              ${stats.apiCalls}`);
    console.log(`Errors:                 ${stats.errors}`);
    console.log(`Estimated cost:         $${stats.estimatedCost.toFixed(4)}`);
    console.log('============================================================');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Embedding generation failed:', error);
    process.exit(1);
  }
}

main();
