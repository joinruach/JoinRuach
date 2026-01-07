/**
 * Scripture Ingestion System Migration
 *
 * Adds comprehensive scripture ingestion and review system:
 * - Scripture sources (YahScriptures, other translations)
 * - Scripture versions (ingestion tracking with deterministic keys)
 * - Scripture review actions (manual QA workflow)
 */

module.exports = {
  /**
   * Run migrations
   */
  async up(knex) {
    console.log('📖 Scripture Ingestion System: Adding tables...');

    const isPostgres = knex.client.config.client === 'postgres';

    if (!isPostgres) {
      console.warn('⚠️  Scripture ingestion system requires PostgreSQL');
      return;
    }

    // 1. Scripture Sources - Core translation/source metadata
    await knex.schema.createTable('scripture_sources', (table) => {
      table.increments('id').primary();
      table.string('source_id', 255).notNullable().unique().comment('Stable ID: scr:yahscriptures:v1');
      table.string('slug', 255).notNullable().unique();
      table.text('title').notNullable().comment('YahScriptures, KJV, etc.');
      table.text('publisher');
      table.string('language', 10).defaultTo('en').comment('ISO 639-1 code');
      table.string('testament_scope', 50).comment('tanakh, renewed_covenant, apocrypha, all');
      table.text('file_url').notNullable().comment('R2 URL for original PDF');
      table.string('file_type', 20).notNullable().comment('pdf, epub, docx');
      table.bigInteger('file_size_bytes');
      table.string('file_sha256', 64).notNullable().unique().comment('Deduplication key');
      table.jsonb('metadata').comment('copyright, year, license, etc.');
      table.timestamps(true, true);

      // Indexes
      table.index('slug');
      table.index('testament_scope');
      table.index('file_sha256');
    });
    console.log('✅ Created scripture_sources table');

    // 2. Scripture Versions - Ingestion versions (idempotency via determinism_key)
    await knex.schema.createTable('scripture_versions', (table) => {
      table.increments('id').primary();
      table.string('version_id', 255).notNullable().unique().comment('scr:yahscriptures:v1');
      table.integer('source_id').notNullable().references('id').inTable('scripture_sources').onDelete('CASCADE');
      table.string('parser_version', 20).notNullable().comment('Parser version: 1.0.0');
      table.jsonb('ingestion_params').notNullable().comment('testament, preserve_formatting, validate_canonical');
      table.string('determinism_key', 64).notNullable().comment('SHA256(parser_version + params + file_sha256)');
      table.string('status', 50).defaultTo('pending').comment('pending, processing, completed, failed, reviewing');
      table.integer('progress').defaultTo(0).comment('0-100');
      table.text('error_message');
      table.jsonb('qa_metrics').comment('extraction_complete, validation_passed, review_status, total_works, total_verses');
      table.jsonb('artifact_urls').comment('extraction_json, review_report_json, works_json');
      table.timestamps(true, true);
      table.timestamp('completed_at');
      table.timestamp('reviewed_at');

      // Indexes
      table.index('source_id');
      table.index('status');
      table.index('determinism_key');
    });
    console.log('✅ Created scripture_versions table');

    // 3. Scripture Review Actions - Manual QA workflow tracking
    await knex.schema.createTable('scripture_review_actions', (table) => {
      table.increments('id').primary();
      table.string('version_id', 255).notNullable().comment('Reference to scripture_versions.version_id');
      table.integer('reviewer_id').references('up_users.id').onDelete('SET NULL').comment('Strapi user ID');
      table.string('action', 50).notNullable().comment('approved, rejected, needs_review');
      table.text('notes').comment('Reviewer feedback');
      table.jsonb('review_data').comment('Spot-checked verses, issues found, etc.');
      table.timestamp('created_at').defaultTo(knex.fn.now());

      // Indexes
      table.index('version_id');
      table.index('reviewer_id');
      table.index('action');
      table.index('created_at');
    });
    console.log('✅ Created scripture_review_actions table');

    // 4. Canon Versions - For EGW canon ingestion (extends unified queue pattern)
    await knex.schema.createTable('canon_versions', (table) => {
      table.increments('id').primary();
      table.string('version_id', 255).notNullable().unique().comment('canon:book-slug:v1');
      table.string('book_slug', 255).notNullable();
      table.string('parser_version', 20).notNullable();
      table.jsonb('ingestion_params').notNullable().comment('max_node_chars, formation_phases, axioms');
      table.string('determinism_key', 64).notNullable();
      table.string('status', 50).defaultTo('pending');
      table.integer('progress').defaultTo(0);
      table.text('error_message');
      table.jsonb('qa_metrics');
      table.jsonb('artifact_urls');
      table.timestamps(true, true);
      table.timestamp('completed_at');

      // Indexes
      table.index('book_slug');
      table.index('status');
      table.index('determinism_key');
    });
    console.log('✅ Created canon_versions table');

    console.log('✅ Scripture ingestion system migration complete');
  },

  /**
   * Rollback migrations
   */
  async down(knex) {
    console.log('📖 Scripture Ingestion System: Rolling back...');

    await knex.schema.dropTableIfExists('scripture_review_actions');
    await knex.schema.dropTableIfExists('scripture_versions');
    await knex.schema.dropTableIfExists('scripture_sources');
    await knex.schema.dropTableIfExists('canon_versions');

    console.log('✅ Rollback complete');
  },
};
