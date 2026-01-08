#!/usr/bin/env tsx
/**
 * Manually register library content types in Strapi metadata
 */
import { config } from 'dotenv';
import { join } from 'path';
import { readFile } from 'fs/promises';

config({ path: join(__dirname, '../../.env') });

async function registerContentTypes() {
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
    console.log('📝 Reading current Strapi schema...');
    const schemaRow = await db('strapi_core_store_settings')
      .where('key', 'strapi_content_types_schema')
      .first();

    if (!schemaRow) {
      console.log('❌ No schema found in database');
      return;
    }

    const schema = JSON.parse(schemaRow.value);
    console.log(`✅ Current schema has ${Object.keys(schema).length} content types`);

    // Load library schemas
    const librarySchemas = [
      'library-license-policy',
      'library-document',
      'library-section',
      'library-chunk',
      'library-citation',
      'library-generated-node',
    ];

    let added = 0;
    for (const schemaName of librarySchemas) {
      const uid = `api::${schemaName}.${schemaName}`;

      if (schema[uid]) {
        console.log(`⏭️  ${uid} already registered`);
        continue;
      }

      const schemaPath = join(
        __dirname,
        `../../src/api/${schemaName}/content-types/${schemaName}/schema.json`
      );

      try {
        const schemaContent = await readFile(schemaPath, 'utf-8');
        const schemaData = JSON.parse(schemaContent);

        schema[uid] = schemaData;
        console.log(`✅ Added ${uid}`);
        added++;
      } catch (error: any) {
        console.log(`❌ Failed to load ${schemaName}: ${error.message}`);
      }
    }

    if (added > 0) {
      console.log(`\n📦 Updating schema with ${added} new content types...`);
      await db('strapi_core_store_settings')
        .where('key', 'strapi_content_types_schema')
        .update({
          value: JSON.stringify(schema),
        });

      console.log('✅ Schema updated! Restart Strapi to apply changes.');
    } else {
      console.log('\n💡 No new content types to add.');
    }

  } finally {
    await db.destroy();
  }
}

registerContentTypes();
