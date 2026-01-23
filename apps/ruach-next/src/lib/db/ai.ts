import { Pool, type QueryResultRow } from 'pg';
import crypto from 'crypto';

/**
 * Database utilities for AI features
 * Connects to PostgreSQL database for storing AI-related data
 */

// Create connection pool (lazy initialization)
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL ||
      `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;

    pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

/**
 * Execute a query with type-safe parameters
 */
type QueryParam = string | number | boolean | null | Date | string[] | number[];

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: QueryParam[]
): Promise<{ rows: T[]; rowCount: number }> {
  // Validate parameters
  if (params) {
    for (const param of params) {
      if (param === undefined) {
        throw new Error('Query parameters cannot be undefined - use null instead');
      }

      const paramType = typeof param;
      const isValidType =
        param === null ||
        paramType === 'string' ||
        paramType === 'number' ||
        paramType === 'boolean' ||
        param instanceof Date ||
        (Array.isArray(param) && param.every(
          (p) => typeof p === 'string' || typeof p === 'number'
        ));

      if (!isValidType) {
        throw new Error(
          `Invalid query parameter type: ${paramType}. Must be string, number, boolean, null, Date, or array of string/number.`
        );
      }
    }
  }

  const client = getPool();
  const result = await client.query<T>(text, params);

  return {
    rows: result.rows,
    rowCount: typeof result.rowCount === 'number' ? result.rowCount : result.rows.length,
  };
}

/**
 * Save content embedding with validated metadata
 */
interface BaseMetadata {
  title: string;
  contentType: 'media' | 'lesson' | 'course' | 'blog' | 'series';
}

interface MediaMetadata extends BaseMetadata {
  contentType: 'media';
  description?: string;
  speakers?: string[];
  tags?: string[];
  category?: string;
  duration?: number;
  views?: number;
}

interface LessonMetadata extends BaseMetadata {
  contentType: 'lesson';
  courseSlug: string;
  lessonNumber?: number;
  duration?: number;
}

interface CourseMetadata extends BaseMetadata {
  contentType: 'course';
  level?: 'foundation' | 'intermediate' | 'advanced';
  lessonCount?: number;
}

interface BlogMetadata extends BaseMetadata {
  contentType: 'blog';
  author?: string;
  publishedDate?: string;
  excerpt?: string;
}

interface SeriesMetadata extends BaseMetadata {
  contentType: 'series';
  episodeCount?: number;
}

type ContentMetadata =
  | MediaMetadata
  | LessonMetadata
  | CourseMetadata
  | BlogMetadata
  | SeriesMetadata;

// Chunked embedding metadata (more detailed per-segment)
export interface ChunkMetadata extends Record<string, any> {
  title?: string;
  url?: string;
  speaker?: string;
  tags?: string[];
  contentType?: string;
  contentId?: number;
  chunkIndex?: number;
  timestampStart?: number;
  timestampEnd?: number;
}

export interface ChunkEmbeddingRow {
  id: number;
  content_type: string;
  content_id: number;
  chunk_index: number;
  text: string;
  metadata: ChunkMetadata;
  hash: string;
  similarity?: number;
}

export function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Upsert a chunk-level embedding row
 */
export async function upsertChunkEmbedding(params: {
  contentType: string;
  contentId: number;
  chunkIndex: number;
  text: string;
  embedding: number[];
  metadata?: ChunkMetadata;
}) {
  const { contentType, contentId, chunkIndex, text, embedding } = params;
  const metadata = params.metadata || {};

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('Embedding must be a non-empty array');
  }
  if (!text?.trim()) {
    throw new Error('Chunk text must be non-empty');
  }

  const hash = sha256Hex(
    JSON.stringify({
      contentType,
      contentId,
      chunkIndex,
      text,
      metadata,
    })
  );

  const sql = `
    INSERT INTO content_embedding_chunks
      (content_type, content_id, chunk_index, text, embedding, metadata, hash, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5::vector, $6, $7, NOW(), NOW())
    ON CONFLICT (content_type, content_id, chunk_index)
    DO UPDATE SET
      text = EXCLUDED.text,
      embedding = EXCLUDED.embedding,
      metadata = EXCLUDED.metadata,
      hash = EXCLUDED.hash,
      updated_at = NOW()
    RETURNING id, hash
  `;

  const result = await query<{ id: number; hash: string }>(sql, [
    contentType,
    contentId,
    chunkIndex,
    text,
    JSON.stringify(embedding),
    JSON.stringify(metadata),
    hash,
  ]);

  return result.rows[0];
}

/**
 * Semantic search over chunk embeddings
 */
export async function semanticSearchChunks(params: {
  queryEmbedding: number[];
  limit?: number;
  contentTypes?: string[];
  similarityThreshold?: number;
}): Promise<ChunkEmbeddingRow[]> {
  const { queryEmbedding, limit = 20, contentTypes, similarityThreshold = 0.0 } = params;

  const sql = `
    SELECT
      id,
      content_type,
      content_id,
      chunk_index,
      text,
      metadata,
      hash,
      1 - (embedding <=> $1::vector) AS similarity
    FROM content_embedding_chunks
    WHERE ($2::text[] IS NULL OR content_type = ANY($2))
      AND 1 - (embedding <=> $1::vector) > $3
    ORDER BY similarity DESC
    LIMIT $4
  `;

  const result = await query<ChunkEmbeddingRow>(sql, [
    JSON.stringify(queryEmbedding),
    contentTypes && contentTypes.length ? contentTypes : null,
    similarityThreshold,
    limit,
  ]);

  return result.rows.map((row) => ({
    ...row,
    metadata:
      typeof row.metadata === 'string'
        ? (JSON.parse(row.metadata) as ChunkMetadata)
        : (row.metadata as ChunkMetadata),
  }));
}

interface SaveEmbeddingParams {
  contentType: ContentMetadata['contentType'];
  contentId: number;
  embedding: number[];
  textContent: string;
  metadata: ContentMetadata;
}

export async function saveEmbedding(data: SaveEmbeddingParams): Promise<{ id: number }> {
  // Validate embedding
  if (!Array.isArray(data.embedding) || data.embedding.length === 0) {
    throw new Error('Embedding must be a non-empty array');
  }

  if (!data.embedding.every((val) => typeof val === 'number' && Number.isFinite(val))) {
    throw new Error('Embedding must contain only finite numbers');
  }

  // Validate content ID
  if (!Number.isInteger(data.contentId) || data.contentId < 1) {
    throw new Error('Content ID must be a positive integer');
  }

  // Validate text content
  if (typeof data.textContent !== 'string' || data.textContent.trim().length === 0) {
    throw new Error('Text content must be a non-empty string');
  }
  const sql = `
    INSERT INTO content_embeddings (content_type, content_id, embedding, text_content, metadata, created_at, updated_at)
    VALUES ($1, $2, $3::vector, $4, $5, NOW(), NOW())
    ON CONFLICT (content_type, content_id)
    DO UPDATE SET
      embedding = EXCLUDED.embedding,
      text_content = EXCLUDED.text_content,
      metadata = EXCLUDED.metadata,
      updated_at = NOW()
    RETURNING id
  `;

  const result = await query<{ id: number }>(sql, [
    data.contentType,
    data.contentId,
    JSON.stringify(data.embedding), // Convert array to string for pgvector
    data.textContent,
    JSON.stringify(data.metadata),
  ]);

  if (result.rows.length === 0) {
    throw new Error('Failed to save embedding');
  }

  return result.rows[0];
}

/**
 * Semantic search using vector similarity
 */
export async function semanticSearch(params: {
  queryEmbedding: number[];
  contentType?: string;
  limit?: number;
  similarityThreshold?: number;
}) {
  const { queryEmbedding, contentType, limit = 20, similarityThreshold = 0.7 } = params;

  const sql = `
    SELECT
      content_type,
      content_id,
      metadata,
      text_content,
      1 - (embedding <=> $1::vector) AS similarity
    FROM content_embeddings
    WHERE ($2::text IS NULL OR content_type = $2)
      AND 1 - (embedding <=> $1::vector) > $3
    ORDER BY similarity DESC
    LIMIT $4
  `;

  const result = await query<{
    content_type: string;
    content_id: number;
    metadata: ContentMetadata;
    text_content: string;
    similarity: number;
  }>(sql, [
    JSON.stringify(queryEmbedding),
    contentType || null,
    similarityThreshold,
    limit,
  ]);

  return result.rows.map(row => ({
    ...row,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) as ContentMetadata : row.metadata,
  }));
}

/**
 * Save AI conversation
 */
export async function createConversation(userId: number, title?: string) {
  const sql = `
    INSERT INTO ai_conversations (user_id, title, created_at, updated_at)
    VALUES ($1, $2, NOW(), NOW())
    RETURNING id
  `;

  const result = await query<{ id: number }>(sql, [userId, title || 'New Conversation']);
  return result.rows[0];
}

/**
 * Save AI message
 */
export async function saveMessage(data: {
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
}) {
  const sql = `
    INSERT INTO ai_messages (conversation_id, role, content, metadata, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING id
  `;

  const result = await query<{ id: number }>(sql, [
    data.conversationId,
    data.role,
    data.content,
    data.metadata ? JSON.stringify(data.metadata) : null,
  ]);

  return result.rows[0];
}

/**
 * Get conversation history
 */
export async function getConversationHistory(conversationId: number, limit = 20) {
  const sql = `
    SELECT id, role, content, metadata, created_at
    FROM ai_messages
    WHERE conversation_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;

  const result = await query<{
    id: number;
    role: string;
    content: string;
    metadata: Record<string, unknown> | null;
    created_at: Date;
  }>(sql, [conversationId, limit]);

  return result.rows.reverse(); // Oldest first
}

/**
 * Get user's conversations
 */
export async function getUserConversations(userId: number, limit = 10) {
  const sql = `
    SELECT id, title, created_at, updated_at
    FROM ai_conversations
    WHERE user_id = $1
    ORDER BY updated_at DESC
    LIMIT $2
  `;

  const result = await query<{
    id: number;
    title: string;
    created_at: Date;
    updated_at: Date;
  }>(sql, [userId, limit]);

  return result.rows;
}

/**
 * Track user interaction
 */
export async function trackInteraction(data: {
  userId: number;
  contentType: string;
  contentId: number;
  interactionType: 'view' | 'complete' | 'like' | 'bookmark';
  durationSec?: number;
  completed?: boolean;
}) {
  const sql = `
    INSERT INTO user_interactions (
      user_id, content_type, content_id, interaction_type, duration_sec, completed, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING id
  `;

  const result = await query<{ id: number }>(sql, [
    data.userId,
    data.contentType,
    data.contentId,
    data.interactionType,
    data.durationSec || null,
    data.completed || false,
  ]);

  return result.rows[0];
}

/**
 * Get user interaction history
 */
export async function getUserInteractions(userId: number, limit = 20) {
  const sql = `
    SELECT
      content_type,
      content_id,
      interaction_type,
      duration_sec,
      completed,
      created_at
    FROM user_interactions
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;

  const result = await query<{
    content_type: string;
    content_id: number;
    interaction_type: string;
    duration_sec: number | null;
    completed: boolean;
    created_at: Date;
  }>(sql, [userId, limit]);

  return result.rows;
}

/**
 * Get content-based recommendations
 * Finds similar content based on user's interaction history
 */
export async function getContentBasedRecommendations(userId: number, limit = 10) {
  const sql = `
    WITH user_liked_content AS (
      SELECT DISTINCT content_type, content_id
      FROM user_interactions
      WHERE user_id = $1
        AND (completed = true OR interaction_type IN ('like', 'bookmark'))
      ORDER BY created_at DESC
      LIMIT 10
    ),
    user_viewed_content AS (
      SELECT DISTINCT content_type, content_id
      FROM user_interactions
      WHERE user_id = $1
    )
    SELECT DISTINCT
      ce.content_type,
      ce.content_id,
      ce.metadata,
      0.8 AS score  -- Mock score for now
    FROM content_embeddings ce
    INNER JOIN user_liked_content ulc
      ON ce.content_type = ulc.content_type
    WHERE NOT EXISTS (
      SELECT 1 FROM user_viewed_content uvc
      WHERE uvc.content_type = ce.content_type
        AND uvc.content_id = ce.content_id
    )
    LIMIT $2
  `;

  const result = await query<{
    content_type: string;
    content_id: number;
    metadata: ContentMetadata;
    score: number;
  }>(sql, [userId, limit]);

  return result.rows.map(row => ({
    ...row,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) as ContentMetadata : row.metadata,
  }));
}

/**
 * Close database connection pool
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
