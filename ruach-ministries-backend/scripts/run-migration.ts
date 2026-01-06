#!/usr/bin/env tsx
/**
 * Migration Runner
 * Runs database migrations from the database/migrations directory
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import knex, { Knex } from 'knex';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

async function runMigration(migrationName: string) {
  console.log(`🚀 Running migration: ${migrationName}\n`);

  // Create Knex connection
  const db: Knex = knex({
    client: 'postgres',
    connection: {
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      ssl: process.env.DATABASE_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false,
    },
  });

  try {
    // Load migration file
    const migrationPath = resolve(__dirname, `../database/migrations/${migrationName}.js`);
    console.log(`📂 Loading migration from: ${migrationPath}`);

    const migration = require(migrationPath);

    if (!migration.up) {
      throw new Error('Migration file must export an "up" function');
    }

    // Run the migration
    await migration.up(db);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Get migration name from command line args
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Usage: npx tsx scripts/run-migration.ts <migration-name>');
  console.error('Example: npx tsx scripts/run-migration.ts 20260105000000_add_library_system');
  process.exit(1);
}

runMigration(migrationName)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
