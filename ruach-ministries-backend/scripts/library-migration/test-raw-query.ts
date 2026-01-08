#!/usr/bin/env tsx
import { config } from 'dotenv';
import { join } from 'path';
config({ path: join(__dirname, '../../.env') });

async function testRawQuery() {
  const { default: knex } = await import('knex');
  const db = knex({
    client: 'postgres',
    connection: {
      host: process.env.LOCAL_DATABASE_HOST,
      port: parseInt(process.env.LOCAL_DATABASE_PORT || '5432'),
      database: process.env.LOCAL_DATABASE_NAME,
      user: process.env.LOCAL_DATABASE_USERNAME,
      password: process.env.LOCAL_DATABASE_PASSWORD,
    }
  });

  try {
    console.log('Testing exact SQL from controller...\n');

    const query = 'faith healing';
    const limit = 3;
    const offset = 0;

    const result = await db.raw(`
      SELECT
        c.id,
        c.chunk_key,
        c.chunk_text,
        c.start_locator,
        c.end_locator,
        c.token_count,
        d.id as document_id,
        d.document_id as document_key,
        d.title,
        d.author,
        d.document_type,
        p.policy_name,
        p.allow_rag_retrieval,
        ts_rank(to_tsvector('english', c.chunk_text), plainto_tsquery('english', ?)) as relevance_score
      FROM library_chunks c
      INNER JOIN library_documents d ON c.document_id = d.id
      INNER JOIN library_license_policies p ON d.license_policy_id = p.id
      WHERE to_tsvector('english', c.chunk_text) @@ plainto_tsquery('english', ?)
        AND p.allow_rag_retrieval = true
      ORDER BY relevance_score DESC
      LIMIT ? OFFSET ?
    `, [query, query, limit, offset]);

    console.log(`✅ Found ${result.rows.length} results:\n`);
    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.title} by ${row.author}`);
      console.log(`   Location: ${row.start_locator} → ${row.end_locator}`);
      console.log(`   Score: ${row.relevance_score}`);
      console.log('');
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await db.destroy();
  }
}

testRawQuery();
