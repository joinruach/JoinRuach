#!/usr/bin/env tsx
/**
 * Manually create library content-type tables
 */
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

async function createTables() {
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
    console.log('🔨 Creating library content-type tables...\n');

    // 1. library_license_policies
    if (!(await db.schema.hasTable('library_license_policies'))) {
      await db.schema.createTable('library_license_policies', (table) => {
        table.increments('id').primary();
        table.string('policy_id').unique().notNullable();
        table.string('policy_name').notNullable();
        table.string('license_type').notNullable();
        table.boolean('allow_commercial').defaultTo(false);
        table.boolean('allow_derivatives').defaultTo(false);
        table.boolean('require_attribution').defaultTo(true);
        table.integer('max_chunk_length').defaultTo(500);
        table.integer('max_chunks_per_response').defaultTo(3);
        table.boolean('allow_rag_retrieval').defaultTo(true);
        table.boolean('allow_full_text_search').defaultTo(true);
        table.boolean('allow_embedding').defaultTo(true);
        table.text('attribution_template');
        table.text('legal_text');
        table.jsonb('policy_metadata');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        table.integer('created_by_id');
        table.integer('updated_by_id');
        table.string('locale');
      });
      console.log('  ✅ library_license_policies');
    } else {
      console.log('  ⏭️  library_license_policies (already exists)');
    }

    // 2. library_documents
    if (!(await db.schema.hasTable('library_documents'))) {
      await db.schema.createTable('library_documents', (table) => {
        table.increments('id').primary();
        table.string('document_id').unique().notNullable();
        table.string('title').notNullable();
        table.string('slug').unique();
        table.string('document_type').notNullable();
        table.string('author');
        table.date('publication_date');
        table.string('source_system');
        table.text('source_url');
        table.string('language').defaultTo('en');
        table.string('ingestion_status').defaultTo('pending');
        table.string('file_sha256');
        table.string('r2_original_url');
        table.string('r2_artifacts_url');
        table.jsonb('document_metadata');
        table.integer('total_sections').defaultTo(0);
        table.integer('total_chunks').defaultTo(0);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        table.integer('created_by_id');
        table.integer('updated_by_id');
        table.integer('license_policy_id').references('id').inTable('library_license_policies');
      });
      console.log('  ✅ library_documents');
    } else {
      console.log('  ⏭️  library_documents (already exists)');
    }

    // 3. library_sections
    if (!(await db.schema.hasTable('library_sections'))) {
      await db.schema.createTable('library_sections', (table) => {
        table.increments('id').primary();
        table.string('section_key').unique().notNullable();
        table.integer('document_id').references('id').inTable('library_documents').notNullable();
        table.string('section_type').notNullable();
        table.integer('sequence_number').notNullable();
        table.string('locator');
        table.text('heading');
        table.text('text').notNullable();
        table.jsonb('section_metadata');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        table.integer('created_by_id');
        table.integer('updated_by_id');
      });
      console.log('  ✅ library_sections');
    } else {
      console.log('  ⏭️  library_sections (already exists)');
    }

    // 4. library_chunks
    if (!(await db.schema.hasTable('library_chunks'))) {
      await db.schema.createTable('library_chunks', (table) => {
        table.increments('id').primary();
        table.string('chunk_key').unique().notNullable();
        table.integer('document_id').references('id').inTable('library_documents').notNullable();
        table.text('chunk_text').notNullable();
        table.integer('token_count');
        table.string('start_locator');
        table.string('end_locator');
        table.integer('sequence_number').notNullable();
        table.jsonb('chunk_metadata');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        table.integer('created_by_id');
        table.integer('updated_by_id');
      });
      console.log('  ✅ library_chunks');
    } else {
      console.log('  ⏭️  library_chunks (already exists)');
    }

    // 5. library_citations
    if (!(await db.schema.hasTable('library_citations'))) {
      await db.schema.createTable('library_citations', (table) => {
        table.increments('id').primary();
        table.integer('generated_node_id').notNullable();
        table.integer('chunk_id').references('id').inTable('library_chunks').notNullable();
        table.string('retrieval_method');
        table.float('relevance_score');
        table.text('attribution_text');
        table.jsonb('citation_metadata');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        table.integer('created_by_id');
        table.integer('updated_by_id');
      });
      console.log('  ✅ library_citations');
    } else {
      console.log('  ⏭️  library_citations (already exists)');
    }

    // 6. library_generated_nodes
    if (!(await db.schema.hasTable('library_generated_nodes'))) {
      await db.schema.createTable('library_generated_nodes', (table) => {
        table.increments('id').primary();
        table.string('node_type').notNullable();
        table.string('generation_method').notNullable();
        table.string('title');
        table.text('content').notNullable();
        table.text('prompt_used');
        table.string('review_status').defaultTo('draft');
        table.integer('reviewed_by_id');
        table.timestamp('reviewed_at');
        table.jsonb('node_metadata');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        table.integer('created_by_id');
        table.integer('updated_by_id');
      });
      console.log('  ✅ library_generated_nodes');
    } else {
      console.log('  ⏭️  library_generated_nodes (already exists)');
    }

    // Create relation tables
    if (!(await db.schema.hasTable('library_chunks_sections_lnk'))) {
      await db.schema.createTable('library_chunks_sections_lnk', (table) => {
        table.increments('id').primary();
        table.integer('chunk_id').references('id').inTable('library_chunks');
        table.integer('section_id').references('id').inTable('library_sections');
        table.float('chunk_ord');
        table.float('section_ord');
      });
      console.log('  ✅ library_chunks_sections_lnk (relation table)');
    }

    console.log('\n✅ All library tables created successfully!');

  } finally {
    await db.destroy();
  }
}

createTables();
