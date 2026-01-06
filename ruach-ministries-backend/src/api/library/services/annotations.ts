import type { Core } from "@strapi/strapi";

export interface CreateAnnotationRequest {
  chunkId: number;
  annotationText: string;
  annotationType?: "note" | "question" | "correction" | "cross-reference";
  visibility?: "private" | "shared" | "public";
}

export interface AnnotationFilters {
  chunkId?: number;
  userId?: number;
  visibility?: string;
  annotationType?: string;
}

/**
 * Create a new annotation
 */
export async function createAnnotation(
  strapi: Core.Strapi,
  userId: number,
  data: CreateAnnotationRequest
) {
  const db = strapi.db.connection;

  const annotationId = `annotation:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

  const result = await db("library_annotations").insert({
    annotation_id: annotationId,
    chunk_id: data.chunkId,
    user_id: userId,
    annotation_text: data.annotationText,
    annotation_type: data.annotationType || "note",
    visibility: data.visibility || "private",
    created_at: new Date(),
    updated_at: new Date(),
  }).returning("*");

  return result[0];
}

/**
 * List annotations with filters
 */
export async function listAnnotations(
  strapi: Core.Strapi,
  userId: number,
  userAccessLevel: string,
  filters?: AnnotationFilters
) {
  const db = strapi.db.connection;

  let query = db("library_annotations as la")
    .select(
      "la.*",
      "lc.text_content as chunk_text",
      "ls.title as source_title"
    )
    .join("library_chunks as lc", "la.chunk_id", "lc.id")
    .join("library_versions as lv", "lc.version_id", "lv.id")
    .join("library_sources as ls", "lv.source_id", "ls.id");

  // Visibility filtering
  query = query.where((builder) => {
    // User's own annotations
    builder.where({ "la.user_id": userId });

    // Shared annotations (if Builder+)
    if (userAccessLevel === "leader") {
      builder.orWhere("la.visibility", "shared");
    }

    // Public annotations
    builder.orWhere("la.visibility", "public");
  });

  // Apply additional filters
  if (filters?.chunkId) {
    query = query.where("la.chunk_id", filters.chunkId);
  }

  if (filters?.annotationType) {
    query = query.where("la.annotation_type", filters.annotationType);
  }

  const results = await query.orderBy("la.created_at", "desc");
  return results;
}

/**
 * Get annotation by ID
 */
export async function getAnnotationById(
  strapi: Core.Strapi,
  annotationId: string,
  userId: number
) {
  const db = strapi.db.connection;

  const result = await db("library_annotations as la")
    .select("la.*", "lc.text_content as chunk_text")
    .join("library_chunks as lc", "la.chunk_id", "lc.id")
    .where("la.annotation_id", annotationId)
    .andWhere((builder) => {
      builder
        .where("la.user_id", userId)
        .orWhere("la.visibility", "shared")
        .orWhere("la.visibility", "public");
    })
    .first();

  return result;
}

/**
 * Update annotation (only owner can update)
 */
export async function updateAnnotation(
  strapi: Core.Strapi,
  annotationId: string,
  userId: number,
  data: Partial<CreateAnnotationRequest>
) {
  const db = strapi.db.connection;

  const updateData: any = {
    updated_at: new Date(),
  };

  if (data.annotationText !== undefined) updateData.annotation_text = data.annotationText;
  if (data.annotationType !== undefined) updateData.annotation_type = data.annotationType;
  if (data.visibility !== undefined) updateData.visibility = data.visibility;

  const result = await db("library_annotations")
    .where({ annotation_id: annotationId, user_id: userId })
    .update(updateData)
    .returning("*");

  return result[0];
}

/**
 * Delete annotation (only owner can delete)
 */
export async function deleteAnnotation(
  strapi: Core.Strapi,
  annotationId: string,
  userId: number
) {
  const db = strapi.db.connection;
  await db("library_annotations")
    .where({ annotation_id: annotationId, user_id: userId })
    .delete();
}

export default {
  createAnnotation,
  listAnnotations,
  getAnnotationById,
  updateAnnotation,
  deleteAnnotation,
};
