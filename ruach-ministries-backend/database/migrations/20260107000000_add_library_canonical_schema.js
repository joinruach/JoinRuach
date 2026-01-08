/**
 * Library Canonical Schema Migration
 *
 * Adds production-ready canonical library schema for unified content management:
 * - pgvector table for embeddings (library_chunk_embeddings)
 * - Indexes for all library content types
 * - Full-text search configuration
 *
 * Supports: scripture, ministry books, theology books, articles, web content
 */

module.exports = {
  /**
   * Run migrations
   */
  async up(knex) {
    console.log('📚 Library Canonical Schema: Adding vector storage and indexes...');

    const isPostgres = knex.client.config.client === 'postgres';

    if (!isPostgres) {
      console.warn('⚠️  Library canonical schema requires PostgreSQL');
      return;
    }

    // Ensure pgvector extension exists
    await knex.raw('CREATE EXTENSION IF NOT EXISTS vector');
    await knex.raw('CREATE EXTENSION IF NOT EXISTS pg_trgm'); // Trigram similarity
    await knex.raw('CREATE EXTENSION IF NOT EXISTS btree_gin'); // Composite GIN indexes
    console.log('✅ Enabled PostgreSQL extensions (vector, pg_trgm, btree_gin)');

    // =====================================================
    // 1. LIBRARY CHUNK EMBEDDINGS (pgvector storage)
    // =====================================================

    const hasChunkEmbeddingsTable = await knex.schema.hasTable('library_chunk_embeddings');

    if (!hasChunkEmbeddingsTable) {
      await knex.raw(`
        CREATE TABLE library_chunk_embeddings (
          id SERIAL PRIMARY KEY,
          chunk_id INTEGER NOT NULL,
          model_name VARCHAR(100) NOT NULL DEFAULT 'text-embedding-3-small',
          model_dimensions INTEGER NOT NULL DEFAULT 512,
          embedding vector(512) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT unique_chunk_embedding UNIQUE (chunk_id, model_name)
        )
      `);
      console.log('✅ Created library_chunk_embeddings table with pgvector');
    }

    // =====================================================
    // 2. INDEXES FOR LIBRARY TABLES
    // =====================================================

    // library_license_policies indexes
    const hasLicensePoliciesTable = await knex.schema.hasTable('library_license_policies');
    if (hasLicensePoliciesTable) {
      await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS library_license_policies_policy_id_idx ON library_license_policies(policy_id)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_license_policies_license_type_idx ON library_license_policies(license_type)');
      console.log('✅ Created library_license_policies indexes');
    }

    // library_documents indexes
    const hasDocumentsTable = await knex.schema.hasTable('library_documents');
    if (hasDocumentsTable) {
      await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS library_documents_document_key_idx ON library_documents(document_key)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_documents_slug_idx ON library_documents(slug)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_documents_type_status_idx ON library_documents(document_type, ingestion_status)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_documents_short_code_idx ON library_documents(short_code)');
      await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS library_documents_file_sha256_idx ON library_documents(file_sha256)');
      console.log('✅ Created library_documents indexes');
    }

    // library_sections indexes
    const hasSectionsTable = await knex.schema.hasTable('library_sections');
    if (hasSectionsTable) {
      await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS library_sections_section_key_idx ON library_sections(section_key)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_sections_locator_key_idx ON library_sections(locator_key)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_sections_document_id_idx ON library_sections(document_id)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_sections_type_order_idx ON library_sections(section_type, order_index)');
      await knex.raw(`
        CREATE INDEX IF NOT EXISTS library_sections_chapter_verse_idx
        ON library_sections(chapter_number, verse_number)
        WHERE chapter_number IS NOT NULL AND verse_number IS NOT NULL
      `);
      await knex.raw('CREATE INDEX IF NOT EXISTS library_sections_text_gin_idx ON library_sections USING GIN(to_tsvector(\'english\', text))');
      console.log('✅ Created library_sections indexes (including FTS)');
    }

    // library_chunks indexes
    const hasChunksTable = await knex.schema.hasTable('library_chunks');
    if (hasChunksTable) {
      await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS library_chunks_chunk_key_idx ON library_chunks(chunk_key)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_chunks_document_id_idx ON library_chunks(document_id)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_chunks_chunk_index_idx ON library_chunks(chunk_index)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_chunks_embedding_status_idx ON library_chunks(embedding_status)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_chunks_text_gin_idx ON library_chunks USING GIN(to_tsvector(\'english\', text))');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_chunks_document_chunk_idx ON library_chunks(document_id, chunk_index)');
      console.log('✅ Created library_chunks indexes (including FTS)');
    }

    // library_citations indexes
    const hasCitationsTable = await knex.schema.hasTable('library_citations');
    if (hasCitationsTable) {
      await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS library_citations_citation_id_idx ON library_citations(citation_id)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_citations_chunk_id_idx ON library_citations(chunk_id)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_citations_generated_node_id_idx ON library_citations(generated_node_id)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_citations_relevance_idx ON library_citations(relevance_score DESC)');
      console.log('✅ Created library_citations indexes');
    }

    // library_generated_nodes indexes
    const hasGeneratedNodesTable = await knex.schema.hasTable('library_generated_nodes');
    if (hasGeneratedNodesTable) {
      await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS library_generated_nodes_node_id_idx ON library_generated_nodes(node_id)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_generated_nodes_slug_idx ON library_generated_nodes(slug)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_generated_nodes_type_status_idx ON library_generated_nodes(node_type, review_status)');
      await knex.raw('CREATE INDEX IF NOT EXISTS library_generated_nodes_quality_idx ON library_generated_nodes(quality_score DESC)');
      console.log('✅ Created library_generated_nodes indexes');
    }

    // =====================================================
    // 3. VECTOR INDEX FOR EMBEDDINGS
    // =====================================================

    if (hasChunkEmbeddingsTable) {
      // IVFFlat index for cosine similarity (optimal for 512-dim embeddings)
      // Lists=100 is good for <100k vectors; adjust if dataset grows
      await knex.raw(`
        CREATE INDEX IF NOT EXISTS library_chunk_embeddings_vector_idx
        ON library_chunk_embeddings
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `);
      await knex.raw('CREATE INDEX IF NOT EXISTS library_chunk_embeddings_chunk_id_idx ON library_chunk_embeddings(chunk_id)');
      console.log('✅ Created pgvector IVFFlat index for embeddings');
    }

    // =====================================================
    // 4. FOREIGN KEY FOR CHUNK EMBEDDINGS
    // =====================================================

    if (hasChunkEmbeddingsTable && hasChunksTable) {
      // Add foreign key constraint (if not already exists)
      const hasForeignKey = await knex.raw(`
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'library_chunk_embeddings_chunk_id_fkey'
      `);

      if (hasForeignKey.rows.length === 0) {
        await knex.raw(`
          ALTER TABLE library_chunk_embeddings
          ADD CONSTRAINT library_chunk_embeddings_chunk_id_fkey
          FOREIGN KEY (chunk_id) REFERENCES library_chunks(id) ON DELETE CASCADE
        `);
        console.log('✅ Added foreign key constraint for chunk_id');
      }
    }

    console.log('🎉 Library canonical schema migration complete!');
  },

  /**
   * Rollback migrations
   */
  async down(knex) {
    console.log('📚 Rolling back library canonical schema...');

    const isPostgres = knex.client.config.client === 'postgres';

    if (!isPostgres) {
      return;
    }

    // Drop indexes
    await knex.raw('DROP INDEX IF EXISTS library_license_policies_policy_id_idx');
    await knex.raw('DROP INDEX IF EXISTS library_license_policies_license_type_idx');
    await knex.raw('DROP INDEX IF EXISTS library_documents_document_key_idx');
    await knex.raw('DROP INDEX IF EXISTS library_documents_slug_idx');
    await knex.raw('DROP INDEX IF EXISTS library_documents_type_status_idx');
    await knex.raw('DROP INDEX IF EXISTS library_documents_short_code_idx');
    await knex.raw('DROP INDEX IF EXISTS library_documents_file_sha256_idx');
    await knex.raw('DROP INDEX IF EXISTS library_sections_section_key_idx');
    await knex.raw('DROP INDEX IF EXISTS library_sections_locator_key_idx');
    await knex.raw('DROP INDEX IF EXISTS library_sections_document_id_idx');
    await knex.raw('DROP INDEX IF EXISTS library_sections_type_order_idx');
    await knex.raw('DROP INDEX IF EXISTS library_sections_chapter_verse_idx');
    await knex.raw('DROP INDEX IF EXISTS library_sections_text_gin_idx');
    await knex.raw('DROP INDEX IF EXISTS library_chunks_chunk_key_idx');
    await knex.raw('DROP INDEX IF EXISTS library_chunks_document_id_idx');
    await knex.raw('DROP INDEX IF EXISTS library_chunks_chunk_index_idx');
    await knex.raw('DROP INDEX IF EXISTS library_chunks_embedding_status_idx');
    await knex.raw('DROP INDEX IF EXISTS library_chunks_text_gin_idx');
    await knex.raw('DROP INDEX IF EXISTS library_chunks_document_chunk_idx');
    await knex.raw('DROP INDEX IF EXISTS library_citations_citation_id_idx');
    await knex.raw('DROP INDEX IF EXISTS library_citations_chunk_id_idx');
    await knex.raw('DROP INDEX IF EXISTS library_citations_generated_node_id_idx');
    await knex.raw('DROP INDEX IF EXISTS library_citations_relevance_idx');
    await knex.raw('DROP INDEX IF EXISTS library_generated_nodes_node_id_idx');
    await knex.raw('DROP INDEX IF EXISTS library_generated_nodes_slug_idx');
    await knex.raw('DROP INDEX IF EXISTS library_generated_nodes_type_status_idx');
    await knex.raw('DROP INDEX IF EXISTS library_generated_nodes_quality_idx');
    await knex.raw('DROP INDEX IF EXISTS library_chunk_embeddings_vector_idx');
    await knex.raw('DROP INDEX IF EXISTS library_chunk_embeddings_chunk_id_idx');

    // Drop table
    await knex.schema.dropTableIfExists('library_chunk_embeddings');

    console.log('✅ Rolled back library canonical schema');
  },
};
