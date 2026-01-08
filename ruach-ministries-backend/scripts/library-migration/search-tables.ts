#!/usr/bin/env tsx
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

async function searchTables() {
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
    const allTables = await db.raw(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log('\n🔍 Searching for library/license tables...\n');

    const matching = allTables.rows.filter((row: any) =>
      row.tablename.includes('librar') ||
      row.tablename.includes('license') ||
      row.tablename.includes('document') ||
      row.tablename.includes('chunk') ||
      row.tablename.includes('citation')
    );

    if (matching.length > 0) {
      console.log('✅ Found matching tables:');
      matching.forEach((row: any) => console.log(`   - ${row.tablename}`));
    } else {
      console.log('❌ No matching tables found');
      console.log('\n📋 All tables (first 30):');
      allTables.rows.slice(0, 30).forEach((row: any) => console.log(`   - ${row.tablename}`));
    }
  } finally {
    await db.destroy();
  }
}

searchTables();
