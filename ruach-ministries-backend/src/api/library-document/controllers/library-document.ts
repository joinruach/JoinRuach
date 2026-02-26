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
 * Generate query embedding via OpenAI API
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI embedding failed: ${err}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Semantic search using pgvector cosine similarity
 */
async function semanticSearch(pool: Pool, query: string, limit: number, offset: number, minScore: number) {
  const embedding = await generateEmbedding(query);
  const vectorLiteral = `[${embedding.join(',')}]`;

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
      1 - (c.embedding <=> $1::vector) as similarity_score
    FROM library_chunks c
    INNER JOIN library_documents d ON c.document_id = d.id
    INNER JOIN library_license_policies p ON d.license_policy_id = p.id
    WHERE p.allow_rag_retrieval = true
      AND c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> $1::vector) >= $2
    ORDER BY similarity_score DESC
    LIMIT $3 OFFSET $4
  `;

  const result = await pool.query(sql, [vectorLiteral, minScore, limit, offset]);
  return result.rows.map(formatResult);
}

/**
 * Hybrid search: combines full-text rank + vector similarity with weighted scoring
 */
async function hybridSearch(pool: Pool, query: string, limit: number, offset: number, minScore: number) {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  if (!hasOpenAI) {
    return fullTextSearch(pool, query, limit, offset);
  }

  const embedding = await generateEmbedding(query);
  const vectorLiteral = `[${embedding.join(',')}]`;

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
      ts_rank(to_tsvector('english', c.chunk_text), plainto_tsquery('english', $1)) as fulltext_score,
      CASE WHEN c.embedding IS NOT NULL
        THEN 1 - (c.embedding <=> $2::vector)
        ELSE 0
      END as semantic_score,
      (
        0.4 * COALESCE(NULLIF(ts_rank(to_tsvector('english', c.chunk_text), plainto_tsquery('english', $1)), 0), 0) +
        0.6 * CASE WHEN c.embedding IS NOT NULL
          THEN 1 - (c.embedding <=> $2::vector)
          ELSE 0
        END
      ) as relevance_score
    FROM library_chunks c
    INNER JOIN library_documents d ON c.document_id = d.id
    INNER JOIN library_license_policies p ON d.license_policy_id = p.id
    WHERE p.allow_rag_retrieval = true
      AND (
        to_tsvector('english', c.chunk_text) @@ plainto_tsquery('english', $1)
        OR (c.embedding IS NOT NULL AND 1 - (c.embedding <=> $2::vector) >= $3)
      )
    ORDER BY relevance_score DESC
    LIMIT $4 OFFSET $5
  `;

  const result = await pool.query(sql, [query, vectorLiteral, minScore, limit, offset]);
  return result.rows.map(formatResult);
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
