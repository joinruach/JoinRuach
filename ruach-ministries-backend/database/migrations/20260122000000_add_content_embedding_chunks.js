/**
 * Adds chunk-level embeddings for RAG retrieval.
 * Keeps existing content_embeddings table as fallback.
 */

module.exports = {
  async up(knex) {
    const isPostgres = knex.client.config.client === 'postgres';

    // Enable pgvector on Postgres
    if (isPostgres) {
      await knex.raw('CREATE EXTENSION IF NOT EXISTS vector');
    }

    const exists = await knex.schema.hasTable('content_embedding_chunks');
    if (exists) return;

    await knex.schema.createTable('content_embedding_chunks', (table) => {
      table.increments('id').primary();
      table.string('content_type', 50).notNullable(); // media | lesson | blog | course | series
      table.integer('content_id').notNullable();
      table.integer('chunk_index').notNullable();
      table.text('text').notNullable();

      if (isPostgres) {
        // text-embedding-3-small => 1536 dims
        table.specificType('embedding', 'vector(1536)').notNullable();
      } else {
        // Dev SQLite fallback
        table.text('embedding').notNullable(); // JSON array of numbers
      }

      table.json('metadata').defaultTo('{}');
      table.string('hash', 64).notNullable();
      table.timestamps(true, true);

      table.unique(['content_type', 'content_id', 'chunk_index']);
      table.index(['content_type', 'content_id']);
    });

    if (isPostgres) {
      await knex.raw(`
        CREATE INDEX IF NOT EXISTS content_embedding_chunks_embedding_idx
        ON content_embedding_chunks
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
      `);
    }
  },

  async down(knex) {
    const exists = await knex.schema.hasTable('content_embedding_chunks');
    if (exists) {
      await knex.schema.dropTable('content_embedding_chunks');
    }
  },
};
