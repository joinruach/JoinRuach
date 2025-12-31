#!/usr/bin/env tsx
/**
 * Vector Ingestion Script
 *
 * Generates embeddings and ingests canon vectors into PostgreSQL with pgvector.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... tsx scripts/canon-parser/ingest-vectors-to-db.ts \
 *     --input scripts/canon-parser/out/ministry-of-healing.vectors.json \
 *     [--batch-size 50] \
 *     [--dry-run]
 *
 * Environment:
 *   OPENAI_API_KEY - OpenAI API key (required)
 *   DATABASE_* - Database connection variables (uses .env)
 */

import fs from "node:fs/promises";
import pkg from "pg";
const { Pool } = pkg;

// Simple OpenAI client without external dependency
async function createEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small",
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  type OpenAIEmbeddingResponse = {
    data?: Array<{ embedding?: number[] }>;
  };

  const data = (await response.json()) as OpenAIEmbeddingResponse;
  const embedding = data?.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("OpenAI response missing embedding");
  }

  return embedding;
}

type VectorChunk = {
  id: string;
  text: string;
  context: string;
  meta: {
    canonNodeId: string;
    chapter: number;
    order: number;
    authority: {
      tier: number;
      weight: number;
    };
    source: {
      slug: string;
      title: string;
      author: string;
    };
  };
};

type Options = {
  input: string;
  batchSize: number;
  dryRun: boolean;
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    input: "",
    batchSize: 50,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case "--input":
      case "-i":
        options.input = args[++i] ?? "";
        break;
      case "--batch-size":
        options.batchSize = Number.parseInt(args[++i] ?? "", 10);
        if (!Number.isFinite(options.batchSize) || options.batchSize < 1) {
          throw new Error("--batch-size must be a positive number.");
        }
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
      default:
        throw new Error(`Unknown arg: ${arg}`);
    }
  }

  if (!options.input) {
    throw new Error("--input is required.");
  }

  return options;
}

function printUsage(): void {
  console.log(`
Usage:
  tsx scripts/canon-parser/ingest-vectors-to-db.ts \\
    --input <vectors.json> \\
    [--batch-size 50] \\
    [--dry-run]

Options:
  --input, -i      Path to vectors JSON file (required)
  --batch-size     Number of chunks to process in parallel (default: 50)
  --dry-run        Preview without inserting to database

Environment:
  OPENAI_API_KEY   OpenAI API key (required)
  DATABASE_*       PostgreSQL connection variables

Examples:
  # Dry run
  OPENAI_API_KEY=sk-... tsx scripts/canon-parser/ingest-vectors-to-db.ts \\
    --input scripts/canon-parser/out/ministry-of-healing.vectors.json \\
    --dry-run

  # Ingest to production
  OPENAI_API_KEY=sk-... tsx scripts/canon-parser/ingest-vectors-to-db.ts \\
    --input scripts/canon-parser/out/ministry-of-healing.vectors.json
`);
}

async function main(): Promise<void> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is required.");
  }

  const options = parseArgs();
  const startTime = Date.now();

  // Load vectors
  console.log(`\n📂 Loading vectors from ${options.input}...`);
  const fileContent = await fs.readFile(options.input, "utf-8");
  const chunks: VectorChunk[] = JSON.parse(fileContent);
  console.log(`✅ Loaded ${chunks.length} chunks`);

  if (options.dryRun) {
    console.log("\n🔍 DRY RUN MODE - No database operations will be performed\n");
    console.log(`Would process ${chunks.length} chunks in batches of ${options.batchSize}`);
    console.log(`Estimated OpenAI API calls: ${chunks.length}`);
    console.log(`Estimated cost: ~$${(chunks.length * 0.00002).toFixed(4)} (text-embedding-3-small)`);
    return;
  }

  // Connect to database
  console.log("\n🔌 Connecting to database...");

  const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  try {
    const { rows } = await pool.query("SELECT 1 as test");
    console.log("✅ Database connected");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    await pool.end();
    throw error;
  }

  console.log(`\n🚀 Starting vector ingestion (batch size: ${options.batchSize})...\n`);

  let processed = 0;
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  // Process in batches
  for (let i = 0; i < chunks.length; i += options.batchSize) {
    const batch = chunks.slice(i, i + options.batchSize);
    const batchNum = Math.floor(i / options.batchSize) + 1;
    const totalBatches = Math.ceil(chunks.length / options.batchSize);

    console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`);

    // Process batch in parallel
    const results = await Promise.allSettled(
      batch.map(async (chunk) => {
        try {
          // Generate embedding
          const embedding = await createEmbedding(chunk.context, OPENAI_API_KEY);

          // Check if exists
          const existing = await pool.query(
            "SELECT id FROM content_embeddings WHERE content_type = $1 AND content_id = $2",
            ["canon", chunk.id]
          );

          const metadata = {
            canonNodeId: chunk.meta.canonNodeId,
            chapter: chunk.meta.chapter,
            order: chunk.meta.order,
            authority: chunk.meta.authority,
            source: chunk.meta.source,
          };

          if (existing.rows.length > 0) {
            // Update existing
            await pool.query(
              `UPDATE content_embeddings
               SET text_content = $1, embedding = $2::vector, metadata = $3::jsonb, updated_at = NOW()
               WHERE content_type = 'canon' AND content_id = $4`,
              [chunk.text, `[${embedding.join(",")}]`, JSON.stringify(metadata), chunk.id]
            );
            return { action: "updated", id: chunk.id };
          } else {
            // Insert new
            await pool.query(
              `INSERT INTO content_embeddings (content_type, content_id, text_content, embedding, metadata, created_at, updated_at)
               VALUES ($1, $2, $3, $4::vector, $5::jsonb, NOW(), NOW())`,
              ["canon", chunk.id, chunk.text, `[${embedding.join(",")}]`, JSON.stringify(metadata)]
            );
            return { action: "inserted", id: chunk.id };
          }
        } catch (error) {
          console.error(`   ❌ Failed: ${chunk.id}`);
          console.error(`      ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      })
    );

    // Tally results
    for (const result of results) {
      processed += 1;
      if (result.status === "fulfilled") {
        if (result.value.action === "inserted") {
          inserted += 1;
        } else {
          updated += 1;
        }
      } else {
        errors += 1;
      }
    }

    console.log(`   ✓ Processed: ${processed}/${chunks.length} (inserted: ${inserted}, updated: ${updated}, errors: ${errors})`);

    // Rate limiting pause (OpenAI has 3000 RPM limit on tier 1)
    if (i + options.batchSize < chunks.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const cost = (chunks.length * 0.00002).toFixed(4);

  console.log(`\n✅ Vector ingestion complete in ${duration}s`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Estimated cost: $${cost}`);

  // Verify
  const { rows } = await pool.query(
    "SELECT COUNT(*) as count FROM content_embeddings WHERE content_type = 'canon'"
  );
  console.log(`\n📊 Total canon embeddings in database: ${rows[0].count}`);

  await pool.end();
}

main().catch((error) => {
  console.error("\n❌ Ingestion failed:", error);
  process.exit(1);
});
