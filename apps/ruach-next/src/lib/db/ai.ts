import { Pool } from 'pg';

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
 * Execute a query
 */
export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const client = getPool();
  return client.query(text, params);
}

/**
 * Save content embedding
 */
export async function saveEmbedding(data: {
  contentType: string;
  contentId: number;
  embedding: number[];
  textContent: string;
  metadata: Record<string, any>;
}) {
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

  const result = await query(sql, [
    data.contentType,
    data.contentId,
    JSON.stringify(data.embedding), // Convert array to string for pgvector
    data.textContent,
    JSON.stringify(data.metadata),
  ]);

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
    metadata: any;
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
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
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
  metadata?: Record<string, any>;
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
    metadata: any;
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
    metadata: any;
    score: number;
  }>(sql, [userId, limit]);

  return result.rows.map(row => ({
    ...row,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
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
