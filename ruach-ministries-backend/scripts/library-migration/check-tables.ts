#!/usr/bin/env tsx
/**
 * Check if library tables exist in database
 */

import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

async function checkTables() {
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
    const tables = await db.raw(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename LIKE 'library_%'
      ORDER BY tablename
    `);

    console.log('📊 Library tables found:');
    if (tables.rows.length === 0) {
      console.log('   ⚠️  No library tables exist yet');
      console.log('   💡 Strapi needs to restart to generate tables from schema files');
    } else {
      tables.rows.forEach((row: any) => console.log(`   ✅ ${row.tablename}`));
    }
  } finally {
    await db.destroy();
  }
}

checkTables();
