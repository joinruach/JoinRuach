/**
 * Library System Migration
 *
 * Adds comprehensive library ingestion and retrieval system:
 * - Library sources and versions (metadata + ingestion tracking)
 * - Structural anchors (chapters, sections) and nodes (paragraphs)
 * - Chunks optimized for embedding and full-text search
 * - Vector embeddings for semantic search (pgvector)
 * - Knowledge layer: quotes, annotations, writing patterns
 */

module.exports = {
  /**
   * Run migrations
   */
  async up(knex) {
    console.log('📚 Library System: Adding tables...');

    const isPostgres = knex.client.config.client === 'postgres';

    if (!isPostgres) {
      console.warn('⚠️  Library system requires PostgreSQL with pgvector extension');
      return;
    }

    // 1. Library Sources - Core book/document metadata
    await knex.schema.createTable('library_sources', (table) => {
      table.increments('id').primary();
      table.string('source_id', 255).notNullable().unique().comment('Stable ID: lib:book:slug');
      table.string('slug', 255).notNullable().unique();
      table.text('title').notNullable();
      table.text('author');
      table.string('source_type', 50).notNullable().comment('book, article, essay, manual');
      table.string('category', 100).comment('theology, discipleship, writing_craft, bible_study');
      table.text('file_url').notNullable().comment('R2 URL for original PDF/EPUB');
      table.string('file_type', 20).notNullable().comment('pdf or epub');
      table.bigInteger('file_size_bytes');
      table.string('file_sha256', 64).notNullable().unique().comment('Deduplication key');
      table.integer('resource_id').comment('FK to Strapi Resource.id (nullable)');
      table.jsonb('metadata').comment('publisher, isbn, year, language, etc.');
      table.timestamps(true, true);

      // Indexes
      table.index('slug');
      table.index('category');
      table.index('file_sha256');
      table.index('resource_id');
    });
    console.log('✅ Created library_sources table');

    // 2. Library Versions - Ingestion versions (idempotency via determinism_key)
    await knex.schema.createTable('library_versions', (table) => {
      table.increments('id').primary();
      table.string('version_id', 255).notNullable().unique().comment('lib:book:slug:v1');
      table.integer('source_id').notNullable().references('id').inTable('library_sources').onDelete('CASCADE');
      table.string('parser_version', 20).notNullable().comment('Parser version: 1.0.0');
      table.jsonb('ingestion_params').notNullable().comment('max_chars, max_tokens, include_toc');
      table.string('determinism_key', 64).notNullable().comment('SHA256(parser_version + params + file_sha256)');
      table.string('status', 50).defaultTo('pending').comment('pending, processing, completed, failed');
      table.integer('progress').defaultTo(0).comment('0-100');
      table.text('error_message');
      table.jsonb('qa_metrics').comment('ocr_confidence, coverage_ratio, warnings[]');
      table.jsonb('artifact_urls').comment('extraction_json, structure_json, chunks_json');
      table.timestamps(true, true);
      table.timestamp('completed_at');

      // Indexes
      table.index('source_id');
      table.index('status');
      table.index('determinism_key');
    });
    console.log('✅ Created library_versions table');

    // 3. Library Anchors - Chapter/section structure
    await knex.schema.createTable('library_anchors', (table) => {
      table.increments('id').primary();
      table.string('anchor_id', 255).notNullable().unique().comment('lib:book:slug:ch3');
      table.integer('version_id').notNullable().references('id').inTable('library_versions').onDelete('CASCADE');
      table.string('anchor_type', 50).notNullable().comment('chapter, section, part, appendix');
      table.integer('index_number').comment('Chapter number, section number');
      table.text('title').notNullable();
      table.integer('parent_anchor_id').references('id').inTable('library_anchors').onDelete('SET NULL').comment('For nested sections');
      table.integer('page_start');
      table.integer('page_end');
      table.jsonb('metadata').comment('subtitle, summary, etc.');
      table.timestamp('created_at').defaultTo(knex.fn.now());

      // Indexes
      table.index('version_id');
      table.index('anchor_type');
      table.index('parent_anchor_id');
    });
    console.log('✅ Created library_anchors table');

    // 4. Library Nodes - Pre-chunking units (paragraphs, blocks)
    await knex.schema.createTable('library_nodes', (table) => {
      table.increments('id').primary();
      table.string('node_id', 255).notNullable().unique().comment('lib:book:slug:ch3:n42');
      table.integer('version_id').notNullable().references('id').inTable('library_versions').onDelete('CASCADE');
      table.integer('anchor_id').references('id').inTable('library_anchors').onDelete('SET NULL');
      table.string('node_type', 50).defaultTo('paragraph').comment('paragraph, heading, blockquote, list');
      table.integer('order_index').notNullable().comment('Sequential order within anchor');
      table.text('text_content').notNullable();
      table.integer('page_start');
      table.integer('page_end');
      table.jsonb('metadata').comment('style_hints, ocr_confidence, etc.');
      table.timestamp('created_at').defaultTo(knex.fn.now());

      // Indexes
      table.index('version_id');
      table.index('anchor_id');
      table.index('order_index');
    });
    console.log('✅ Created library_nodes table');

    // 5. Library Chunks - Embedding-optimized segments
    await knex.schema.createTable('library_chunks', (table) => {
      table.increments('id').primary();
      table.string('chunk_id', 255).notNullable().unique().comment('lib:book:slug:ch3:c5');
      table.integer('version_id').notNullable().references('id').inTable('library_versions').onDelete('CASCADE');
      table.integer('anchor_id').references('id').inTable('library_anchors').onDelete('SET NULL');
      table.specificType('node_ids', 'integer[]').notNullable().comment('Array of library_nodes.id this chunk spans');
      table.integer('chunk_index').notNullable().comment('Sequential chunk number');
      table.text('text_content').notNullable();
      table.integer('char_count').notNullable();
      table.integer('token_count').notNullable().comment('Approximate token count');
      table.integer('page_start');
      table.integer('page_end');
      table.timestamp('created_at').defaultTo(knex.fn.now());

      // Indexes
      table.index('version_id');
      table.index('anchor_id');
      table.index('chunk_index');
    });
    console.log('✅ Created library_chunks table');

    // Add tsvector column for full-text search
    await knex.raw('ALTER TABLE library_chunks ADD COLUMN text_search_vector tsvector');
    console.log('✅ Added tsvector column to library_chunks');

    // Create GIN index for full-text search
    await knex.raw('CREATE INDEX library_chunks_text_search_idx ON library_chunks USING GIN(text_search_vector)');
    console.log('✅ Created GIN index for full-text search');

    // Create trigger to auto-update tsvector
    await knex.raw(`
      CREATE TRIGGER library_chunks_text_search_update
      BEFORE INSERT OR UPDATE ON library_chunks
      FOR EACH ROW EXECUTE FUNCTION
        tsvector_update_trigger(text_search_vector, 'pg_catalog.english', text_content)
    `);
    console.log('✅ Created tsvector auto-update trigger');

    // 6. Library Embeddings - Vector search
    await knex.schema.createTable('library_embeddings', (table) => {
      table.increments('id').primary();
      table.integer('chunk_id').notNullable().references('id').inTable('library_chunks').onDelete('CASCADE').unique();
      table.string('model_name', 100).defaultTo('text-embedding-3-large');
      table.integer('model_dimensions').defaultTo(1536);
      table.timestamp('created_at').defaultTo(knex.fn.now());

      // Index
      table.index('chunk_id');
    });
    console.log('✅ Created library_embeddings table');

    // Add vector column (pgvector extension already enabled in AI features migration)
    await knex.raw('ALTER TABLE library_embeddings ADD COLUMN embedding vector(1536)');
    console.log('✅ Added vector(1536) column to library_embeddings');

    // Create IVFFlat index for cosine similarity (same pattern as content_embeddings)
    await knex.raw(`
      CREATE INDEX library_embeddings_vector_idx
      ON library_embeddings
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `);
    console.log('✅ Created IVFFlat vector index');

    // 7. Library Quotes - Curated extracts
    await knex.schema.createTable('library_quotes', (table) => {
      table.increments('id').primary();
      table.string('quote_id', 255).notNullable().unique();
      table.integer('chunk_id').notNullable().references('id').inTable('library_chunks').onDelete('CASCADE');
      table.text('text_content').notNullable();
      table.text('commentary');
      table.string('visibility_tier', 20).defaultTo('leader').comment('basic, full, leader');
      table.specificType('tag_ids', 'integer[]').comment('Array of Strapi tag IDs');
      table.integer('created_by').comment('Strapi user ID');
      table.boolean('is_featured').defaultTo(false);
      table.timestamps(true, true);

      // Indexes
      table.index('chunk_id');
      table.index('visibility_tier');
    });

    // Create GIN index for tag_ids array
    await knex.raw('CREATE INDEX library_quotes_tag_ids_idx ON library_quotes USING GIN(tag_ids)');
    console.log('✅ Created library_quotes table');

    // 8. Library Annotations - Community notes
    await knex.schema.createTable('library_annotations', (table) => {
      table.increments('id').primary();
      table.string('annotation_id', 255).notNullable().unique();
      table.integer('chunk_id').notNullable().references('id').inTable('library_chunks').onDelete('CASCADE');
      table.integer('user_id').notNullable().comment('Strapi user ID');
      table.text('annotation_text').notNullable();
      table.string('annotation_type', 50).defaultTo('note').comment('note, question, correction, cross-reference');
      table.string('visibility', 20).defaultTo('private').comment('private, shared, public');
      table.timestamps(true, true);

      // Indexes
      table.index('chunk_id');
      table.index('user_id');
    });
    console.log('✅ Created library_annotations table');

    // 9. Writing Patterns - Reusable templates
    await knex.schema.createTable('writing_patterns', (table) => {
      table.increments('id').primary();
      table.string('pattern_id', 255).notNullable().unique();
      table.text('title').notNullable();
      table.text('description');
      table.string('pattern_type', 50).comment('sentence-structure, paragraph-flow, argument-technique');
      table.text('template').comment('Reusable structure/template');
      table.specificType('example_chunk_ids', 'integer[]').comment('References to library_chunks');
      table.specificType('tag_ids', 'integer[]').comment('Strapi tag IDs');
      table.timestamp('created_at').defaultTo(knex.fn.now());

      // Indexes
      table.index('pattern_type');
    });

    // Create GIN indexes for array columns
    await knex.raw('CREATE INDEX writing_patterns_example_chunk_ids_idx ON writing_patterns USING GIN(example_chunk_ids)');
    await knex.raw('CREATE INDEX writing_patterns_tag_ids_idx ON writing_patterns USING GIN(tag_ids)');
    console.log('✅ Created writing_patterns table');

    console.log('🎉 Library system migration completed successfully!');
  },

  /**
   * Rollback migrations
   */
  async down(knex) {
    console.log('🔄 Rolling back library system...');

    await knex.schema.dropTableIfExists('writing_patterns');
    await knex.schema.dropTableIfExists('library_annotations');
    await knex.schema.dropTableIfExists('library_quotes');
    await knex.schema.dropTableIfExists('library_embeddings');
    await knex.schema.dropTableIfExists('library_chunks');
    await knex.schema.dropTableIfExists('library_nodes');
    await knex.schema.dropTableIfExists('library_anchors');
    await knex.schema.dropTableIfExists('library_versions');
    await knex.schema.dropTableIfExists('library_sources');

    console.log('✅ Rollback completed');
  },
};
