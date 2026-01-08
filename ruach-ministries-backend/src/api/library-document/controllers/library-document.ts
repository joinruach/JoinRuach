import { factories } from '@strapi/strapi';
import type { Core } from '@strapi/strapi';
import { Pool } from 'pg';

/**
 * Library Search Controller
 *
 * Extends core controller with custom search functionality
 * Provides three search modes:
 * 1. Full-text search (PostgreSQL ts_vector)
 * 2. Semantic search (pgvector similarity)
 * 3. Hybrid search (combines both with weighted scoring)
 */

interface SearchParams {
  query: string;
  mode?: 'fulltext' | 'semantic' | 'hybrid';
  limit?: number;
  offset?: number;
  minScore?: number;
}

/**
 * Full-text search using PostgreSQL ts_vector
 * Uses direct pg connection to bypass Strapi ORM issues
 */
async function fullTextSearch(pool: Pool, query: string, limit: number, offset: number) {
  const sql = `
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
      ts_rank(to_tsvector('english', c.chunk_text), plainto_tsquery('english', $1)) as relevance_score
    FROM library_chunks c
    INNER JOIN library_documents d ON c.document_id = d.id
    INNER JOIN library_license_policies p ON d.license_policy_id = p.id
    WHERE to_tsvector('english', c.chunk_text) @@ plainto_tsquery('english', $2)
      AND p.allow_rag_retrieval = true
    ORDER BY relevance_score DESC
    LIMIT $3 OFFSET $4
  `;

  const result = await pool.query(sql, [query, query, limit, offset]);
  return result.rows.map(formatResult);
}

/**
 * Semantic search using pgvector similarity
 */
async function semanticSearch(pool: Pool, query: string, limit: number, offset: number, minScore: number) {
  // TODO: Integrate with OpenAI embedding API
  throw new Error('Semantic search requires OpenAI API integration (coming soon)');
}

/**
 * Hybrid search combining full-text and semantic search
 */
async function hybridSearch(pool: Pool, query: string, limit: number, offset: number, minScore: number) {
  // For now, just use full-text search
  // TODO: Implement true hybrid search when semantic search is ready
  return fullTextSearch(pool, query, limit, offset);
}

/**
 * Format search result for API response
 */
function formatResult(row: any) {
  return {
    id: row.id,
    chunkKey: row.chunk_key,
    text: row.chunk_text,
    startLocator: row.start_locator,
    endLocator: row.end_locator,
    tokenCount: row.token_count,
    relevanceScore: parseFloat(row.relevance_score || row.similarity_score || '0'),
    document: {
      id: row.document_id,
      key: row.document_key,
      title: row.title,
      author: row.author,
      type: row.document_type,
    },
    license: {
      policy: row.policy_name,
      allowRetrieval: row.allow_rag_retrieval,
    },
  };
}

export default factories.createCoreController('api::library-document.library-document', ({ strapi }) => ({
  /**
   * POST /api/library-documents/search
   * Search library content with multiple modes
   */
  async search(ctx: any) {
    try {
      const params: SearchParams = ctx.request.body;
      const { query, mode = 'hybrid', limit = 10, offset = 0, minScore = 0.5 } = params;

      if (!query || query.trim().length === 0) {
        return ctx.badRequest('Query parameter is required');
      }

      // Create direct pg Pool (bypasses Strapi ORM to avoid type mapping issues)
      const dbConfig = strapi.config.get('database.connection');
      const pool = new Pool(dbConfig);

      let results;

      try {
        switch (mode) {
          case 'fulltext':
            results = await fullTextSearch(pool, query, limit, offset);
            break;

          case 'semantic':
            results = await semanticSearch(pool, query, limit, offset, minScore);
            break;

          case 'hybrid':
            results = await hybridSearch(pool, query, limit, offset, minScore);
            break;

          default:
            return ctx.badRequest(`Invalid search mode: ${mode}`);
        }
      } finally {
        // Always close the pool
        await pool.end();
      }

      // Format response
      ctx.send({
        data: results,
        meta: {
          query,
          mode,
          count: results.length,
          limit,
          offset,
        },
      });

    } catch (error: any) {
      strapi.log.error('Library search error:', error);
      ctx.internalServerError('Search failed: ' + error.message);
    }
  },
}));
