import type { Core } from "@strapi/strapi";

export interface SearchFilters {
  categories?: string[];
  sourceIds?: string[];
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  threshold?: number;
}

export interface ChunkResult {
  chunkId: string;
  score: number;
  textContent: string;
  citation: {
    sourceTitle: string;
    author: string | null;
    chapter: string | null;
    pageRange: string | null;
  };
  context: {
    anchorTitle: string | null;
  };
}

export interface SearchResponse {
  results: ChunkResult[];
  meta: {
    totalResults: number;
    processingTimeMs: number;
  };
}

interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

/**
 * Generate embedding for search query via OpenAI
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable not set");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-large",
      input: query,
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = (await response.json()) as OpenAIEmbeddingResponse;
  const embedding = data.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("OpenAI response did not include an embedding");
  }
  return embedding;
}

/**
 * Hybrid search: tsvector (full-text) + pgvector (semantic) with Reciprocal Rank Fusion
 */
export async function hybridSearch(
  strapi: Core.Strapi,
  request: SearchRequest
): Promise<SearchResponse> {
  const startTime = Date.now();
  const { query, filters, limit = 20, threshold = 0.7 } = request;

  // Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(query);

  // Build SQL query
  const db = strapi.db.connection;

  // Build category filter
  let categoryFilter = "";
  let categoryParams: any[] = [];
  if (filters?.categories && filters.categories.length > 0) {
    categoryFilter = "AND ls.category = ANY($1)";
    categoryParams = [filters.categories];
  }

  const sqlParams: any[] = [
    query, // $1 or $2 (text query)
    queryEmbedding, // $2 or $3 (vector query)
    limit, // $3 or $4 (result limit)
  ];

  if (categoryParams.length > 0) {
    sqlParams.unshift(categoryParams[0]);
  }

  const textQueryIdx = categoryParams.length > 0 ? 2 : 1;
  const vectorQueryIdx = categoryParams.length > 0 ? 3 : 2;
  const limitIdx = categoryParams.length > 0 ? 4 : 3;

  const sql = `
    WITH text_results AS (
      SELECT
        lc.id,
        lc.chunk_id,
        lc.text_content,
        lc.anchor_id,
        lc.page_start,
        lc.page_end,
        lc.version_id,
        ts_rank(lc.text_search_vector, plainto_tsquery('english', $${textQueryIdx})) AS text_score,
        ROW_NUMBER() OVER (ORDER BY ts_rank(lc.text_search_vector, plainto_tsquery('english', $${textQueryIdx})) DESC) AS text_rank
      FROM library_chunks lc
      WHERE lc.text_search_vector @@ plainto_tsquery('english', $${textQueryIdx})
        AND lc.version_id IN (
          SELECT lv.id FROM library_versions lv
          JOIN library_sources ls ON lv.source_id = ls.id
          WHERE lv.status = 'completed'
            ${categoryFilter}
        )
      LIMIT 100
    ),
    vector_results AS (
      SELECT
        lc.id,
        lc.chunk_id,
        lc.text_content,
        lc.anchor_id,
        lc.page_start,
        lc.page_end,
        lc.version_id,
        1 - (le.embedding <=> $${vectorQueryIdx}::vector) AS vector_score,
        ROW_NUMBER() OVER (ORDER BY le.embedding <=> $${vectorQueryIdx}::vector) AS vector_rank
      FROM library_chunks lc
      JOIN library_embeddings le ON lc.id = le.chunk_id
      WHERE lc.version_id IN (
        SELECT lv.id FROM library_versions lv
        JOIN library_sources ls ON lv.source_id = ls.id
        WHERE lv.status = 'completed'
          ${categoryFilter}
      )
      ORDER BY le.embedding <=> $${vectorQueryIdx}::vector
      LIMIT 100
    ),
    fused_results AS (
      SELECT
        COALESCE(tr.id, vr.id) AS id,
        COALESCE(tr.chunk_id, vr.chunk_id) AS chunk_id,
        COALESCE(tr.text_content, vr.text_content) AS text_content,
        COALESCE(tr.anchor_id, vr.anchor_id) AS anchor_id,
        COALESCE(tr.page_start, vr.page_start) AS page_start,
        COALESCE(tr.page_end, vr.page_end) AS page_end,
        COALESCE(tr.version_id, vr.version_id) AS version_id,
        (COALESCE(1.0 / (60 + tr.text_rank), 0) + COALESCE(1.0 / (60 + vr.vector_rank), 0)) AS rrf_score
      FROM text_results tr
      FULL OUTER JOIN vector_results vr ON tr.id = vr.id
    )
    SELECT
      fr.*,
      ls.title AS source_title,
      ls.author AS source_author,
      la.title AS anchor_title
    FROM fused_results fr
    JOIN library_versions lv ON fr.version_id = lv.id
    JOIN library_sources ls ON lv.source_id = ls.id
    LEFT JOIN library_anchors la ON fr.anchor_id = la.id
    WHERE fr.rrf_score >= $${limitIdx}
    ORDER BY fr.rrf_score DESC
    LIMIT $${limitIdx}
  `;

  const results = await db.raw(sql, sqlParams);

  // Format results
  const formattedResults: ChunkResult[] = results.rows.map((row: any) => ({
    chunkId: row.chunk_id,
    score: parseFloat(row.rrf_score),
    textContent: row.text_content,
    citation: {
      sourceTitle: row.source_title,
      author: row.source_author,
      chapter: row.anchor_title,
      pageRange: formatPageRange(row.page_start, row.page_end),
    },
    context: {
      anchorTitle: row.anchor_title,
    },
  }));

  const processingTimeMs = Date.now() - startTime;

  return {
    results: formattedResults,
    meta: {
      totalResults: formattedResults.length,
      processingTimeMs,
    },
  };
}

/**
 * Format page range for citation
 */
function formatPageRange(pageStart: number | null, pageEnd: number | null): string | null {
  if (!pageStart) return null;
  if (!pageEnd || pageStart === pageEnd) {
    return `p. ${pageStart}`;
  }
  return `pp. ${pageStart}-${pageEnd}`;
}

/**
 * Get library source by ID
 */
export async function getSource(strapi: Core.Strapi, sourceId: string) {
  const db = strapi.db.connection;
  const result = await db("library_sources").where({ source_id: sourceId }).first();
  return result;
}

/**
 * Get ingestion status for a version
 */
export async function getVersionStatus(strapi: Core.Strapi, versionId: string) {
  const db = strapi.db.connection;
  const result = await db("library_versions").where({ version_id: versionId }).first();
  return result;
}

/**
 * List all library sources
 */
export async function listSources(
  strapi: Core.Strapi,
  filters?: { category?: string }
) {
  const db = strapi.db.connection;
  let query = db("library_sources").select("*");

  if (filters?.category) {
    query = query.where({ category: filters.category });
  }

  const results = await query.orderBy("created_at", "desc");
  return results;
}

/**
 * Scripture-specific search with semantic matching
 * Searches scripture-verse table using embeddings + full-text search
 */
export async function searchScripture(
  strapi: Core.Strapi,
  query: string,
  limit: number = 10
): Promise<ChunkResult[]> {
  const db = strapi.db.connection;

  // Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(query);

  // Search scripture verses with hybrid approach
  const sql = `
    WITH text_results AS (
      SELECT
        sv.id,
        sv.verse_id,
        sv.text AS verse_text,
        sv.chapter,
        sv.verse_number,
        sw.title AS book_title,
        sw.abbrev AS book_abbrev,
        ts_rank(sv.text_search_vector, plainto_tsquery('english', $1)) AS text_score,
        ROW_NUMBER() OVER (ORDER BY ts_rank(sv.text_search_vector, plainto_tsquery('english', $1)) DESC) AS text_rank
      FROM scripture_verses sv
      JOIN scripture_works sw ON sv.work_id = sw.id
      WHERE sv.text_search_vector @@ plainto_tsquery('english', $1)
      LIMIT 50
    ),
    vector_results AS (
      SELECT
        sv.id,
        sv.verse_id,
        sv.text AS verse_text,
        sv.chapter,
        sv.verse_number,
        sw.title AS book_title,
        sw.abbrev AS book_abbrev,
        1 - (se.embedding <=> $2::vector) AS vector_score,
        ROW_NUMBER() OVER (ORDER BY se.embedding <=> $2::vector) AS vector_rank
      FROM scripture_verses sv
      JOIN scripture_works sw ON sv.work_id = sw.id
      LEFT JOIN scripture_embeddings se ON sv.id = se.verse_id
      WHERE se.embedding IS NOT NULL
      ORDER BY se.embedding <=> $2::vector
      LIMIT 50
    ),
    fused_results AS (
      SELECT
        COALESCE(tr.id, vr.id) AS id,
        COALESCE(tr.verse_id, vr.verse_id) AS verse_id,
        COALESCE(tr.verse_text, vr.verse_text) AS verse_text,
        COALESCE(tr.chapter, vr.chapter) AS chapter,
        COALESCE(tr.verse_number, vr.verse_number) AS verse_number,
        COALESCE(tr.book_title, vr.book_title) AS book_title,
        COALESCE(tr.book_abbrev, vr.book_abbrev) AS book_abbrev,
        (COALESCE(1.0 / (60 + tr.text_rank), 0) + COALESCE(1.0 / (60 + vr.vector_rank), 0)) AS rrf_score
      FROM text_results tr
      FULL OUTER JOIN vector_results vr ON tr.id = vr.id
    )
    SELECT *
    FROM fused_results
    ORDER BY rrf_score DESC
    LIMIT $3
  `;

  const results = await db.raw(sql, [query, queryEmbedding, limit]);

  // Format as ChunkResult for consistency
  const formattedResults: ChunkResult[] = results.rows.map((row: any) => ({
    chunkId: row.verse_id,
    score: parseFloat(row.rrf_score),
    textContent: row.verse_text,
    citation: {
      sourceTitle: `${row.book_title} ${row.chapter}:${row.verse_number}`,
      author: null,
      chapter: `Chapter ${row.chapter}`,
      pageRange: null,
    },
    context: {
      anchorTitle: `${row.book_title} ${row.chapter}`,
    },
  }));

  return formattedResults;
}

/**
 * Parse scripture reference and retrieve specific verses
 * Format: "Matthew 6:25-34" or "John 3:16"
 */
export async function getScriptureByReference(
  strapi: Core.Strapi,
  reference: string
): Promise<ChunkResult[]> {
  const db = strapi.db.connection;

  // Parse reference
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) {
    return [];
  }

  const book = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const verseStart = parseInt(match[3], 10);
  const verseEnd = match[4] ? parseInt(match[4], 10) : verseStart;

  // Query scripture verses
  const sql = `
    SELECT
      sv.id,
      sv.verse_id,
      sv.text AS verse_text,
      sv.chapter,
      sv.verse_number,
      sw.title AS book_title,
      sw.abbrev AS book_abbrev
    FROM scripture_verses sv
    JOIN scripture_works sw ON sv.work_id = sw.id
    WHERE sw.title ILIKE $1
      AND sv.chapter = $2
      AND sv.verse_number >= $3
      AND sv.verse_number <= $4
    ORDER BY sv.verse_number
  `;

  const results = await db.raw(sql, [book, chapter, verseStart, verseEnd]);

  // Format as ChunkResult
  const formattedResults: ChunkResult[] = results.rows.map((row: any) => ({
    chunkId: row.verse_id,
    score: 1.0, // Exact match gets max score
    textContent: row.verse_text,
    citation: {
      sourceTitle: `${row.book_title} ${row.chapter}:${row.verse_number}`,
      author: null,
      chapter: `Chapter ${row.chapter}`,
      pageRange: null,
    },
    context: {
      anchorTitle: `${row.book_title} ${row.chapter}`,
    },
  }));

  return formattedResults;
}

export default {
  hybridSearch,
  getSource,
  getVersionStatus,
  listSources,
  searchScripture,
  getScriptureByReference,
};
