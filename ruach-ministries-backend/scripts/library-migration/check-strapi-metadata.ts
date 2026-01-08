#!/usr/bin/env tsx
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

async function checkMetadata() {
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
    // Check Strapi metadata table
    const metadata = await db('strapi_core_store_settings')
      .where('key', 'like', '%content_types%')
      .orWhere('key', 'like', '%model%')
      .select('key', 'value');

    console.log('\n📊 Strapi metadata:');
    metadata.slice(0, 5).forEach((row: any) => {
      console.log(`   ${row.key}: ${row.value.substring(0, 100)}...`);
    });

    // Check if library tables should exist based on migrations
    const strapiMigrations = await db('strapi_migrations')
      .orderBy('time', 'desc')
      .limit(10);

    console.log('\n📜 Recent Strapi migrations:');
    strapiMigrations.forEach((row: any) => {
      console.log(`   ${row.time} - ${row.name}`);
    });

  } finally {
    await db.destroy();
  }
}

checkMetadata();
