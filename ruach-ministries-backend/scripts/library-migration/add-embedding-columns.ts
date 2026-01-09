#!/usr/bin/env tsx
/**
 * Add embedding columns to library_chunks table
 *
 * Adds:
 * - embedding_model (varchar)
 * - embedding_dimensions (int)
 * - embedding_vector (jsonb)
 * - embedding_status (varchar with check constraint)
 */

import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

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

async function addEmbeddingColumns() {
  const db = await getDb();

  try {
    console.log('🔧 Adding embedding columns to library_chunks table\n');

    // Check if columns already exist
    const existingColumns = await db.raw(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'library_chunks'
      AND column_name IN ('embedding_model', 'embedding_dimensions', 'embedding_vector', 'embedding_status')
    `);

    const existing = existingColumns.rows.map((r: any) => r.column_name);

    if (existing.length === 4) {
      console.log('✅ All embedding columns already exist!\n');
      return;
    }

    console.log('   Adding columns...\n');

    // Add embedding_model column
    if (!existing.includes('embedding_model')) {
      await db.raw(`
        ALTER TABLE library_chunks
        ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(255) DEFAULT 'text-embedding-3-small'
      `);
      console.log('   ✓ Added embedding_model');
    }

    // Add embedding_dimensions column
    if (!existing.includes('embedding_dimensions')) {
      await db.raw(`
        ALTER TABLE library_chunks
        ADD COLUMN IF NOT EXISTS embedding_dimensions INTEGER DEFAULT 512
      `);
      console.log('   ✓ Added embedding_dimensions');
    }

    // Add embedding_vector column (JSONB for vector storage)
    if (!existing.includes('embedding_vector')) {
      await db.raw(`
        ALTER TABLE library_chunks
        ADD COLUMN IF NOT EXISTS embedding_vector JSONB
      `);
      console.log('   ✓ Added embedding_vector');
    }

    // Add embedding_status column with check constraint
    if (!existing.includes('embedding_status')) {
      await db.raw(`
        ALTER TABLE library_chunks
        ADD COLUMN IF NOT EXISTS embedding_status VARCHAR(50) DEFAULT 'pending'
        CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed'))
      `);
      console.log('   ✓ Added embedding_status');
    }

    // Create index on embedding_status for efficient queries
    await db.raw(`
      CREATE INDEX IF NOT EXISTS library_chunks_embedding_status_idx
      ON library_chunks(embedding_status)
    `);
    console.log('   ✓ Added index on embedding_status');

    console.log('\n✅ Embedding columns added successfully!\n');

    // Show current schema
    const columns = await db.raw(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'library_chunks'
      AND column_name LIKE 'embedding%'
      ORDER BY ordinal_position
    `);

    console.log('📋 Embedding-related columns:');
    columns.rows.forEach((col: any) => {
      console.log(`   ${col.column_name} (${col.data_type}) = ${col.column_default || 'NULL'}`);
    });
    console.log();

  } finally {
    await db.destroy();
  }
}

addEmbeddingColumns().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
