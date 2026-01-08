#!/usr/bin/env tsx
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

async function checkSchema() {
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
    const schemaRow = await db('strapi_core_store_settings')
      .where('key', 'strapi_content_types_schema')
      .first();

    if (schemaRow) {
      const schema = JSON.parse(schemaRow.value);
      const libraryTypes = Object.keys(schema).filter(key => key.includes('library'));

      console.log('\n📊 Library content types registered in Strapi:');
      if (libraryTypes.length === 0) {
        console.log('   ❌ No library content types found in schema');
        console.log('\n💡 This means Strapi hasn\'t detected the new content types yet.');
        console.log('   Solution: The content types need to be accessed via the admin panel first.');
      } else {
        libraryTypes.forEach(type => {
          const config = schema[type];
          console.log(`   ✅ ${type}`);
          console.log(`      collectionName: ${config.collectionName}`);
        });
      }

      console.log('\n📋 Sample of registered content types:');
      const sampleTypes = Object.keys(schema).filter(k => k.startsWith('api::')).slice(0, 5);
      sampleTypes.forEach(type => console.log(`   - ${type}`));
    }
  } finally {
    await db.destroy();
  }
}

checkSchema();
