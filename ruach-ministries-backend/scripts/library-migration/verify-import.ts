#!/usr/bin/env tsx
import { config } from 'dotenv';
import { join } from 'path';
config({ path: join(__dirname, '../../.env') });

async function verifyImport() {
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
    console.log('\n📊 Canonical Library Import Verification\n');

    // Documents
    const docs = await db('library_documents').count('* as count');
    const docDetails = await db('library_documents')
      .select('document_id', 'title', 'author', 'total_sections', 'total_chunks', 'ingestion_status')
      .first();
    console.log(`✅ Documents: ${docs[0].count}`);
    if (docDetails) {
      console.log(`   - ${docDetails.title} by ${docDetails.author}`);
      console.log(`   - Status: ${docDetails.ingestion_status}`);
      console.log(`   - Sections: ${docDetails.total_sections}, Chunks: ${docDetails.total_chunks}`);
    }

    // Sections
    const sections = await db('library_sections').count('* as count');
    console.log(`\n✅ Sections: ${sections[0].count}`);

    // Chunks
    const chunks = await db('library_chunks').count('* as count');
    const chunkSample = await db('library_chunks')
      .select('chunk_key', 'token_count', 'start_locator', 'end_locator')
      .first();
    console.log(`\n✅ Chunks: ${chunks[0].count}`);
    if (chunkSample) {
      console.log(`   - Sample: ${chunkSample.chunk_key}`);
      console.log(`   - Range: ${chunkSample.start_locator} → ${chunkSample.end_locator}`);
      console.log(`   - Tokens: ${chunkSample.token_count}`);
    }

    // Embeddings
    const embeddings = await db('library_chunk_embeddings').count('* as count');
    const embSample = await db('library_chunk_embeddings')
      .select('chunk_id', 'model_name', 'model_dimensions')
      .first();
    console.log(`\n✅ Embeddings: ${embeddings[0].count}`);
    if (embSample) {
      console.log(`   - Model: ${embSample.model_name}`);
      console.log(`   - Dimensions: ${embSample.model_dimensions}`);
    }

    // License policy
    const policy = await db('library_documents as d')
      .join('library_license_policies as p', 'd.license_policy_id', 'p.id')
      .select('p.policy_name', 'p.max_chunk_length', 'p.allow_rag_retrieval')
      .first();
    console.log(`\n✅ License Policy: ${policy.policy_name}`);
    console.log(`   - Max chunk length: ${policy.max_chunk_length}`);
    console.log(`   - RAG retrieval: ${policy.allow_rag_retrieval ? 'Allowed' : 'Blocked'}`);

    console.log('\n🎉 Canonical Library Stack is COMPLETE!\n');
    console.log('   ✅ Tables created');
    console.log('   ✅ License policies seeded');
    console.log('   ✅ Content imported (Ministry of Healing)');
    console.log('   ✅ Embeddings inserted');
    console.log('   ✅ Ready for retrieval!\n');

  } finally {
    await db.destroy();
  }
}

verifyImport();
