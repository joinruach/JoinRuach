#!/usr/bin/env tsx
/**
 * Migration Runner for DigitalOcean Database
 * Runs database migrations on the DO production database
 */

import { resolve } from 'path';
import knex, { Knex } from 'knex';

async function runMigration(migrationName: string) {
  console.log(`🚀 Running migration on DigitalOcean: ${migrationName}\n`);

  // Create Knex connection to DO database
  const db: Knex = knex({
    client: 'postgres',
    connection: {
      host: process.env.DO_DB_HOST || 'ruach-do-user-24868745-0.d.db.ondigitalocean.com',
      port: parseInt(process.env.DO_DB_PORT || '25060'),
      database: process.env.DO_DB_NAME || 'defaultdb',
      user: process.env.DO_DB_USER || 'doadmin',
      password: process.env.DO_DB_PASSWORD,
      ssl: {
        rejectUnauthorized: false
      },
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

    console.log('\n✅ Migration completed successfully on DigitalOcean!');
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
  console.error('Usage: npx tsx scripts/run-migration-do.ts <migration-name>');
  console.error('Example: npx tsx scripts/run-migration-do.ts 20260105000000_add_library_system');
  process.exit(1);
}

runMigration(migrationName)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
