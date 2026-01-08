#!/usr/bin/env tsx
/**
 * Insert embeddings into library_chunk_embeddings
 */
import { readFile } from 'node:fs/promises';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

async function insertEmbeddings() {
  const { default: knex } = await import('knex');
  const db = knex({
    client: 'postgres',
    connection: {
      host: process.env.LOCAL_DATABASE_HOST || 'localhost',
      port: parseInt(process.env.LOCAL_DATABASE_PORT || '5432'),
      database: process.env.LOCAL_DATABASE_NAME || 'strapi_db',
      user: process.env.LOCAL_DATABASE_USERNAME || 'postgres',
      password: process.env.LOCAL_DATABASE_PASSWORD || 'postgres',
    }
  });

  try {
    console.log('📊 Inserting embeddings into library_chunk_embeddings...\n');

    // Load embedded data
    const embeddedPath = 'ministry-pipeline/exports/egw/ministry-of-healing/v1/embedded.jsonl';
    const content = await readFile(embeddedPath, 'utf-8');
    const lines = content.trim().split('\n');
    console.log(`   Found ${lines.length} embeddings\n`);

    // Get chunks from database
    const chunks = await db('library_chunks')
      .orderBy('sequence_number')
      .select('id', 'sequence_number', 'chunk_key');

    console.log(`   Found ${chunks.length} chunks in database\n`);

    // Parse embeddings
    const embeddings = lines.map(line => JSON.parse(line));

    // Strategy: Map sections to chunks
    // Each chunk contains multiple sections, so we'll:
    // 1. Get all sections with their sequence numbers
    // 2. For each chunk, find sections within its range
    // 3. Average the embeddings of those sections

    const sections = await db('library_sections')
      .orderBy('sequence_number')
      .select('id', 'sequence_number', 'section_key');

    console.log(`   Found ${sections.length} sections in database\n`);

    // Map embeddings to sections by sequence
    const sectionEmbeddings = new Map();
    embeddings.forEach((emb, idx) => {
      if (idx < sections.length && emb.embedding) {
        sectionEmbeddings.set(sections[idx].sequence_number, emb.embedding);
      }
    });

    console.log(`   Mapped ${sectionEmbeddings.size} section embeddings\n`);

    // For each chunk, use the embedding of its first section (simplified)
    // TODO: In production, re-generate embeddings for actual chunk text
    let inserted = 0;
    let skipped = 0;

    for (const chunk of chunks) {
      // Get sections in this chunk's range
      const chunkSections = await db('library_sections')
        .where('id', '>=', chunk.id)
        .where('id', '<', chunk.id + 10) // rough estimate of sections per chunk
        .orderBy('sequence_number')
        .select('sequence_number')
        .limit(5);

      if (chunkSections.length === 0) {
        skipped++;
        continue;
      }

      // Use first section's embedding for this chunk
      const firstSectionSeq = chunkSections[0].sequence_number;
      const embeddingData = sectionEmbeddings.get(firstSectionSeq);

      if (!embeddingData) {
        skipped++;
        continue;
      }

      // Extract vector array from nested structure
      const vectorArray = embeddingData.vector || embeddingData;
      if (!Array.isArray(vectorArray)) {
        console.error(`Invalid embedding format for chunk ${chunk.id}`);
        skipped++;
        continue;
      }

      // Format as PostgreSQL vector (array notation)
      const vectorString = `[${vectorArray.join(',')}]`;

      // Insert embedding
      try {
        await db.raw(`
          INSERT INTO library_chunk_embeddings (chunk_id, model_name, model_dimensions, embedding, created_at)
          VALUES (?, ?, ?, ?::vector, NOW())
          ON CONFLICT (chunk_id, model_name) DO NOTHING
        `, [chunk.id, 'text-embedding-3-small', vectorArray.length, vectorString]);

        inserted++;

        if (inserted % 100 === 0) {
          console.log(`   Progress: ${inserted} / ${chunks.length} chunks`);
        }
      } catch (error: any) {
        console.error(`   Error inserting embedding for chunk ${chunk.id}:`, error.message);
        skipped++;
      }
    }

    console.log(`\n✅ Embeddings inserted: ${inserted}`);
    console.log(`   Skipped: ${skipped}\n`);

  } finally {
    await db.destroy();
  }
}

insertEmbeddings().catch(error => {
  console.error('❌ Failed:', error);
  process.exit(1);
});
