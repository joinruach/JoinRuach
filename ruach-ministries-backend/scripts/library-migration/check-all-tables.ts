#!/usr/bin/env tsx
/**
 * Check all content-type tables in database
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
    // Check for library-related tables (all patterns)
    const libraryTables = await db.raw(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND (tablename LIKE '%library%' OR tablename LIKE '%license%')
      ORDER BY tablename
    `);

    console.log('📊 Library-related tables:');
    if (libraryTables.rows.length === 0) {
      console.log('   ⚠️  No library tables found');
    } else {
      libraryTables.rows.forEach((row: any) => console.log(`   ✅ ${row.tablename}`));
    }

    // Check total content-type tables
    const allTables = await db.raw(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'strapi_%'
      AND tablename NOT LIKE 'admin_%'
      AND tablename NOT LIKE 'up_%'
      ORDER BY tablename
      LIMIT 20
    `);

    console.log('\n📋 Sample content-type tables (first 20):');
    allTables.rows.forEach((row: any) => console.log(`   - ${row.tablename}`));

  } finally {
    await db.destroy();
  }
}

checkTables();
