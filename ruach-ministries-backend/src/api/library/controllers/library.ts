import type { Core } from "@strapi/strapi";
import { hybridSearch, getSource, getVersionStatus, listSources } from "../services/library";
import { enqueueLibraryIngestion } from "../../../services/library-ingestion-queue";

/**
 * POST /api/library/search
 * Hybrid search endpoint (tsvector + pgvector)
 */
export async function search(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  // Check access level (Builder+ only)
  const user = ctx.state.user;
  if (!user || user.accessLevel !== "leader") {
    return ctx.unauthorized("Library access requires Builder tier or higher");
  }

  try {
    const { query, filters, limit, threshold } = ctx.request.body;

    if (!query || typeof query !== "string") {
      return ctx.badRequest("Query parameter is required");
    }

    const results = await hybridSearch(strapi, {
      query,
      filters,
      limit,
      threshold,
    });

    ctx.body = results;
  } catch (error) {
    strapi.log.error("[library] Search failed", error);
    ctx.internalServerError("Search failed");
  }
}

/**
 * GET /api/library/sources
 * List all library sources
 */
export async function getSources(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  // Check access level (Builder+ only)
  const user = ctx.state.user;
  if (!user || user.accessLevel !== "leader") {
    return ctx.unauthorized("Library access requires Builder tier or higher");
  }

  try {
    const { category } = ctx.query;
    const sources = await listSources(strapi, { category });
    ctx.body = { data: sources };
  } catch (error) {
    strapi.log.error("[library] Failed to list sources", error);
    ctx.internalServerError("Failed to list sources");
  }
}

/**
 * GET /api/library/sources/:sourceId
 * Get library source by ID
 */
export async function getSourceById(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  // Check access level (Builder+ only)
  const user = ctx.state.user;
  if (!user || user.accessLevel !== "leader") {
    return ctx.unauthorized("Library access requires Builder tier or higher");
  }

  try {
    const { sourceId } = ctx.params;
    const source = await getSource(strapi, sourceId);

    if (!source) {
      return ctx.notFound("Source not found");
    }

    ctx.body = { data: source };
  } catch (error) {
    strapi.log.error("[library] Failed to get source", error);
    ctx.internalServerError("Failed to get source");
  }
}

/**
 * GET /api/library/status/:versionId
 * Get ingestion status for a version
 */
export async function getStatus(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  // Check access level (Builder+ only)
  const user = ctx.state.user;
  if (!user || user.accessLevel !== "leader") {
    return ctx.unauthorized("Library access requires Builder tier or higher");
  }

  try {
    const { versionId } = ctx.params;
    const version = await getVersionStatus(strapi, versionId);

    if (!version) {
      return ctx.notFound("Version not found");
    }

    ctx.body = { data: version };
  } catch (error) {
    strapi.log.error("[library] Failed to get version status", error);
    ctx.internalServerError("Failed to get version status");
  }
}

/**
 * POST /api/library/ingest
 * Trigger ingestion for a library source
 */
export async function triggerIngestion(ctx: any) {
  const { strapi } = ctx as { strapi: Core.Strapi };

  // Check if admin
  const user = ctx.state.user;
  const isAdmin = ctx.state.admin;

  if (!isAdmin && (!user || user.accessLevel !== "leader")) {
    return ctx.unauthorized("Ingestion requires admin or Builder+ access");
  }

  try {
    const { sourceId, versionId, fileUrl, fileType, ingestionParams } = ctx.request.body;

    if (!sourceId || !versionId || !fileUrl || !fileType) {
      return ctx.badRequest("Missing required fields: sourceId, versionId, fileUrl, fileType");
    }

    // Enqueue ingestion job
    await enqueueLibraryIngestion(strapi, {
      sourceId,
      versionId,
      fileUrl,
      fileType,
      ingestionParams: ingestionParams || {
        maxChars: 1200,
        maxTokens: 500,
        includeToc: false,
      },
    });

    ctx.body = {
      message: "Ingestion job enqueued",
      versionId,
    };
  } catch (error) {
    strapi.log.error("[library] Failed to trigger ingestion", error);
    ctx.internalServerError("Failed to trigger ingestion");
  }
}

export default {
  search,
  getSources,
  getSourceById,
  getStatus,
  triggerIngestion,
};
