import type { Core } from "@strapi/strapi";

export interface CreatePatternRequest {
  title: string;
  description?: string;
  patternType?: string;
  template?: string;
  exampleChunkIds?: number[];
  tagIds?: number[];
}

export interface PatternFilters {
  patternType?: string;
  tagIds?: number[];
}

/**
 * Create a new writing pattern
 */
export async function createPattern(
  strapi: Core.Strapi,
  data: CreatePatternRequest
) {
  const db = strapi.db.connection;

  const patternId = `pattern:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

  const result = await db("writing_patterns").insert({
    pattern_id: patternId,
    title: data.title,
    description: data.description,
    pattern_type: data.patternType,
    template: data.template,
    example_chunk_ids: data.exampleChunkIds || [],
    tag_ids: data.tagIds || [],
    created_at: new Date(),
  }).returning("*");

  return result[0];
}

/**
 * List writing patterns with filters
 */
export async function listPatterns(
  strapi: Core.Strapi,
  filters?: PatternFilters
) {
  const db = strapi.db.connection;

  let query = db("writing_patterns").select("*");

  if (filters?.patternType) {
    query = query.where("pattern_type", filters.patternType);
  }

  if (filters?.tagIds && filters.tagIds.length > 0) {
    query = query.whereRaw("tag_ids && ?", [filters.tagIds]);
  }

  const results = await query.orderBy("created_at", "desc");
  return results;
}

/**
 * Get pattern by ID with examples
 */
export async function getPatternById(strapi: Core.Strapi, patternId: string) {
  const db = strapi.db.connection;

  const pattern = await db("writing_patterns")
    .where({ pattern_id: patternId })
    .first();

  if (!pattern) return null;

  // Fetch example chunks if present
  if (pattern.example_chunk_ids && pattern.example_chunk_ids.length > 0) {
    const examples = await db("library_chunks as lc")
      .select(
        "lc.chunk_id",
        "lc.text_content",
        "ls.title as source_title",
        "ls.author as source_author"
      )
      .join("library_versions as lv", "lc.version_id", "lv.id")
      .join("library_sources as ls", "lv.source_id", "ls.id")
      .whereIn("lc.id", pattern.example_chunk_ids);

    pattern.examples = examples;
  }

  return pattern;
}

/**
 * Update pattern
 */
export async function updatePattern(
  strapi: Core.Strapi,
  patternId: string,
  data: Partial<CreatePatternRequest>
) {
  const db = strapi.db.connection;

  const updateData: any = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.patternType !== undefined) updateData.pattern_type = data.patternType;
  if (data.template !== undefined) updateData.template = data.template;
  if (data.exampleChunkIds !== undefined) updateData.example_chunk_ids = data.exampleChunkIds;
  if (data.tagIds !== undefined) updateData.tag_ids = data.tagIds;

  const result = await db("writing_patterns")
    .where({ pattern_id: patternId })
    .update(updateData)
    .returning("*");

  return result[0];
}

/**
 * Delete pattern
 */
export async function deletePattern(strapi: Core.Strapi, patternId: string) {
  const db = strapi.db.connection;
  await db("writing_patterns").where({ pattern_id: patternId }).delete();
}

export default {
  createPattern,
  listPatterns,
  getPatternById,
  updatePattern,
  deletePattern,
};
