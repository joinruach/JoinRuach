#!/usr/bin/env tsx
/**
 * Run Library Canonical Schema Migration
 *
 * This script manually runs the canonical library schema migration.
 */

import { config } from 'dotenv';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Load .env file
config({ path: join(__dirname, '../../.env') });

// Database configuration from env (prefer LOCAL for development)
const DB_HOST = process.env.LOCAL_DATABASE_HOST || process.env.DATABASE_HOST || 'localhost';
const DB_PORT = parseInt(process.env.LOCAL_DATABASE_PORT || process.env.DATABASE_PORT || '5432');
const DB_NAME = process.env.LOCAL_DATABASE_NAME || process.env.DATABASE_NAME || 'strapi_db';
const DB_USER = process.env.LOCAL_DATABASE_USERNAME || process.env.DATABASE_USERNAME || 'postgres';
const DB_PASSWORD = process.env.LOCAL_DATABASE_PASSWORD || process.env.DATABASE_PASSWORD || 'postgres';

async function runMigration() {
  console.log('🚀 Running Library Canonical Schema Migration\n');

  // Import knex
  const { default: knex } = await import('knex');

  // Create database connection
  const db = knex({
    client: 'postgres',
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
    },
    pool: { min: 1, max: 1 },
  });

  try {
    // Check if library_chunk_embeddings table already exists
    const tableExists = await db.schema.hasTable('library_chunk_embeddings');

    if (tableExists) {
      console.log('✅ Migration already applied (library_chunk_embeddings table exists). Skipping.');
      return;
    }

    console.log('📝 Loading migration file...');
    const migrationPath = join(
      __dirname,
      '../../database/migrations/20260107000000_add_library_canonical_schema.js'
    );

    // Load the migration module
    const migration = await import(migrationPath);

    console.log('⚡ Running migration up()...');
    await migration.default.up(db);

    console.log('\n✅ Migration completed successfully!\n');
    console.log('Created:');
    console.log('  - library_chunk_embeddings table');
    console.log('  - Unique indexes for locator fields');
    console.log('  - Full-text search indexes (GIN)');
    console.log('  - Vector search index (IVFFlat)');
    console.log('  - PostgreSQL extensions (vector, pg_trgm, btree_gin)');
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

runMigration().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});

// Make this file a module
export {};
