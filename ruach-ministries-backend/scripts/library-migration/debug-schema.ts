#!/usr/bin/env tsx
import { config } from 'dotenv';
import { join } from 'path';
config({ path: join(__dirname, '../../.env') });

async function debugSchema() {
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
    // Check chunk schema
    const chunkInfo = await db.raw(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'library_chunks'
      AND column_name IN ('id', 'document_id')
      ORDER BY column_name
    `);
    console.log('\nlibrary_chunks columns:');
    console.log(chunkInfo.rows);

    // Check document schema
    const docInfo = await db.raw(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'library_documents'
      AND column_name IN ('id', 'document_id', 'license_policy_id')
      ORDER BY column_name
    `);
    console.log('\nlibrary_documents columns:');
    console.log(docInfo.rows);

    // Check sample data
    const sampleChunk = await db('library_chunks').first('id', 'document_id');
    console.log('\nSample chunk:');
    console.log(sampleChunk);
    console.log(`document_id type: ${typeof sampleChunk?.document_id}`);

    const sampleDoc = await db('library_documents').first('id', 'document_id');
    console.log('\nSample document:');
    console.log(sampleDoc);
    console.log(`id type: ${typeof sampleDoc?.id}`);

    // Check license policy schema
    const policyInfo = await db.raw(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'library_license_policies'
      AND column_name IN ('id', 'license_policy_id', 'allow_rag_retrieval')
      ORDER BY column_name
    `);
    console.log('\nlibrary_license_policies columns:');
    console.log(policyInfo.rows);

    const samplePolicy = await db('library_license_policies').first('id', 'license_policy_id', 'allow_rag_retrieval');
    console.log('\nSample policy:');
    console.log(samplePolicy);
    console.log(`allow_rag_retrieval type: ${typeof samplePolicy?.allow_rag_retrieval}`);

  } finally {
    await db.destroy();
  }
}

debugSchema();
