import type { Core } from "@strapi/strapi";

export interface CreateQuoteRequest {
  chunkId: number;
  textContent: string;
  commentary?: string;
  visibilityTier?: "basic" | "full" | "leader";
  tagIds?: number[];
  isFeatured?: boolean;
}

export interface QuoteFilters {
  visibilityTier?: string;
  tagIds?: number[];
  isFeatured?: boolean;
}

/**
 * Create a new quote
 */
export async function createQuote(
  strapi: Core.Strapi,
  userId: number,
  data: CreateQuoteRequest
) {
  const db = strapi.db.connection;

  // Generate quote ID
  const quoteId = `quote:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

  const result = await db("library_quotes").insert({
    quote_id: quoteId,
    chunk_id: data.chunkId,
    text_content: data.textContent,
    commentary: data.commentary,
    visibility_tier: data.visibilityTier || "leader",
    tag_ids: data.tagIds || [],
    created_by: userId,
    is_featured: data.isFeatured || false,
    created_at: new Date(),
    updated_at: new Date(),
  }).returning("*");

  return result[0];
}

/**
 * List quotes with filters
 */
export async function listQuotes(
  strapi: Core.Strapi,
  userAccessLevel: string,
  filters?: QuoteFilters
) {
  const db = strapi.db.connection;

  let query = db("library_quotes as lq")
    .select(
      "lq.*",
      "lc.text_content as chunk_text",
      "ls.title as source_title",
      "ls.author as source_author"
    )
    .join("library_chunks as lc", "lq.chunk_id", "lc.id")
    .join("library_versions as lv", "lc.version_id", "lv.id")
    .join("library_sources as ls", "lv.source_id", "ls.id");

  // Filter by visibility tier based on user access level
  const accessLevelMap: Record<string, string[]> = {
    basic: ["basic"],
    full: ["basic", "full"],
    leader: ["basic", "full", "leader"],
  };

  const allowedTiers = accessLevelMap[userAccessLevel] || ["basic"];
  query = query.whereIn("lq.visibility_tier", allowedTiers);

  // Apply filters
  if (filters?.visibilityTier) {
    query = query.where("lq.visibility_tier", filters.visibilityTier);
  }

  if (filters?.isFeatured !== undefined) {
    query = query.where("lq.is_featured", filters.isFeatured);
  }

  if (filters?.tagIds && filters.tagIds.length > 0) {
    query = query.whereRaw("lq.tag_ids && ?", [filters.tagIds]);
  }

  const results = await query.orderBy("lq.created_at", "desc");
  return results;
}

/**
 * Get quote by ID
 */
export async function getQuoteById(strapi: Core.Strapi, quoteId: string) {
  const db = strapi.db.connection;

  const result = await db("library_quotes as lq")
    .select(
      "lq.*",
      "lc.text_content as chunk_text",
      "ls.title as source_title",
      "ls.author as source_author"
    )
    .join("library_chunks as lc", "lq.chunk_id", "lc.id")
    .join("library_versions as lv", "lc.version_id", "lv.id")
    .join("library_sources as ls", "lv.source_id", "ls.id")
    .where("lq.quote_id", quoteId)
    .first();

  return result;
}

/**
 * Update quote
 */
export async function updateQuote(
  strapi: Core.Strapi,
  quoteId: string,
  data: Partial<CreateQuoteRequest>
) {
  const db = strapi.db.connection;

  const updateData: any = {
    updated_at: new Date(),
  };

  if (data.textContent !== undefined) updateData.text_content = data.textContent;
  if (data.commentary !== undefined) updateData.commentary = data.commentary;
  if (data.visibilityTier !== undefined) updateData.visibility_tier = data.visibilityTier;
  if (data.tagIds !== undefined) updateData.tag_ids = data.tagIds;
  if (data.isFeatured !== undefined) updateData.is_featured = data.isFeatured;

  const result = await db("library_quotes")
    .where({ quote_id: quoteId })
    .update(updateData)
    .returning("*");

  return result[0];
}

/**
 * Delete quote
 */
export async function deleteQuote(strapi: Core.Strapi, quoteId: string) {
  const db = strapi.db.connection;
  await db("library_quotes").where({ quote_id: quoteId }).delete();
}

export default {
  createQuote,
  listQuotes,
  getQuoteById,
  updateQuote,
  deleteQuote,
};
